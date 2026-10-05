package com.razuresoft.okayapp.data

import android.content.Context
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonObject
import okhttp3.sse.EventSource
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.UUID

data class FileRef(val name: String, val url: String, val mime: String = "", val size: Long = 0)

data class ChatMessage(
    val id: String,
    val role: String,
    val content: String,
    val images: List<String> = emptyList(),
    val files: List<FileRef> = emptyList(),
    val thinkSummary: String? = null,
    val emotion: JsonObject? = null,
    val timestamp: Long = System.currentTimeMillis(),
)

/**
 * Live2D driving channels shared between the chat screen and the stage.
 *
 * 每个通道除值本身还带一个单调递增的事件号：只观察「值」的话，第二次说同一
 * 句话 / 播同一个动作时值没有变化，LaunchedEffect 不会重跑，WebView 也就收不到
 * 指令。舞台以事件号为 key，值只作为参数读取。
 */
class Live2DBus {
    val speakText = mutableStateOf<String?>(null)
    val motion = mutableStateOf<String?>(null)   // "group:index" or ":index"
    val expression = mutableStateOf<Int?>(null)

    var speakEvent by mutableStateOf(0)
        private set
    var motionEvent by mutableStateOf(0)
        private set
    var expressionEvent by mutableStateOf(0)
        private set

    fun speak(text: String) {
        if (text.isBlank()) return
        speakText.value = text
        speakEvent++
    }

    fun playMotion(spec: String) {
        if (spec.isBlank()) return
        motion.value = spec
        motionEvent++
    }

    fun showExpression(index: Int) {
        expression.value = index
        expressionEvent++
    }
}

/**
 * Chat session: messages, SSE streaming against /api/life/chat, proactive
 * notification polling and the [[motion:..]] / [[expression:..]] markers.
 */
class ChatStore(context: Context, val api: OkayApi) {
    companion object {
        private const val PREFS = "okay_chat"
        private const val KEY_SESSION = "session_id"
        private val MOTION_RE = Regex("\\[\\[(?:motion|emote):([^\\]]*)\\]\\]")
        private val EXPR_RE = Regex("\\[\\[(?:expression|emote):exp_(\\d+)\\]\\]")
    }

    private val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)

    val live2d = Live2DBus()
    val messages = mutableStateListOf<ChatMessage>()
    val isTyping = mutableStateOf(false)
    val error = mutableStateOf<String?>(null)
    val voiceEnabled = mutableStateOf(false)
    /** 回复完成后等待播放 TTS 的文本 */
    val speakPending = mutableStateOf<String?>(null)
    /**
     * 语音排队事件号。播放协程必须以它为 key：若以 speakPending 的值当 key，
     * 协程体消费时把值置空就会取消自己，音频永远播不出来。
     */
    var speakEvent by mutableStateOf(0)
        private set

    private fun queueSpeak(text: String) {
        speakPending.value = text
        speakEvent++
    }
    var currentTaskId: String? = null
        private set

    val sessionId: String get() = prefs.getString(KEY_SESSION, null) ?: UUID.randomUUID().toString().also {
        prefs.edit().putString(KEY_SESSION, it).apply()
    }

    fun resetSession() {
        val oldSessionId = sessionId
        prefs.edit().putString(KEY_SESSION, UUID.randomUUID().toString()).apply()
        messages.clear()
        // Don't orphan the old session's proactive notes on the server.
        scope.launch {
            runCatching {
                val notes = api.get("/api/life/notifications", listOf("session_id" to "app:$oldSessionId"))
                    .asObject().arr("notifications")
                val ids = notes.mapNotNull { it.asObject().str("id").takeIf { id -> id.isNotEmpty() } }
                if (ids.isNotEmpty()) {
                    api.post("/api/life/notifications", jsonOf(
                        "session_id" to jsStr("app:$oldSessionId"),
                        "ids" to JsonArray(ids.map { jsStr(it) }),
                    ))
                }
            }
        }
    }

    private var sse: EventSource? = null

    fun sendMessage(prompt: String, images: List<String>, files: List<FileRef>, onError: (String) -> Unit) {
        if (isTyping.value) return
        val userMsg = ChatMessage("m_${System.currentTimeMillis()}", "user", prompt, images, files)
        messages.add(userMsg)

        val history = messages.takeLast(21).dropLast(1).map { m ->
            var content = m.content
            m.images.forEach { content += "\n[image: ${api.absoluteUrl(it)}]" }
            m.files.forEach { content += "\n[file: ${it.name} ${api.absoluteUrl(it.url)}]" }
            jsonOf("role" to jsStr(m.role), "content" to jsStr(content))
        }

        val requestId = "req_${System.currentTimeMillis()}"
        var acc = ""
        var think: String? = null
        var emo: JsonObject? = null
        val replyId = "m_${System.currentTimeMillis() + 1}"
        isTyping.value = true
        error.value = null

        val body = jsonOf(
            "request_id" to jsStr(requestId),
            "prompt" to jsStr(prompt),
            "stream" to jsBool(true),
            "session_id" to jsStr("app:${sessionId}"),
            "user_id" to jsStr("app"),
            "attachments" to JsonArray(
                images.map { jsonOf("name" to jsStr(it.substringAfterLast('/')), "url" to jsStr(api.absoluteUrl(it)), "mime" to jsStr("image/*")) } +
                    files.map { jsonOf("name" to jsStr(it.name), "url" to jsStr(api.absoluteUrl(it.url)), "mime" to jsStr(it.mime), "size" to jsNum(it.size)) }
            ),
            "history" to JsonArray(history),
        )

        fun pushChunk() {
            val index = messages.indexOfFirst { it.id == replyId }
            if (index >= 0) {
                // Replace (never mutate) the row: Compose observes list writes,
                // not writes to a plain var field.
                messages[index] = messages[index].copy(content = acc, thinkSummary = think, emotion = emo)
            } else {
                messages.add(ChatMessage(replyId, "assistant", acc, thinkSummary = think, emotion = emo))
            }
        }

        sse = api.sse("/api/life/chat", body, object : okhttp3.sse.EventSourceListener() {
            override fun onEvent(es: EventSource, id: String?, event: String?, data: String) {
                scope.launch {
                    val jo = runCatching { okayJson.parseToJsonElement(data).asObject() }.getOrNull()
                    if (event == "error" || jo?.str("error")?.isNotEmpty() == true) {
                        error.value = jo?.str("error")?.ifEmpty { data } ?: data
                        isTyping.value = false
                        return@launch
                    }
                    if (event == "done" || jo?.bool("done") == true) {
                        if (acc.isNotEmpty()) pushChunk()
                        if (voiceEnabled.value && acc.isNotBlank()) queueSpeak(acc)
                        isTyping.value = false
                        return@launch
                    }
                    when (event) {
                        "chunk" -> {
                            jo?.str("chunk")?.let { acc += it }
                            jo?.str("think_summary")?.takeIf { it.isNotEmpty() }?.let { think = it }
                            jo?.obj("emotion")?.takeIf { it.isNotEmpty() }?.let { emo = it }
                            jo?.str("task_id")?.takeIf { it.isNotEmpty() }?.let { currentTaskId = it }
                            if (acc.isNotEmpty()) pushChunk()
                        }
                        "done" -> { isTyping.value = false }
                    }
                }
            }

            override fun onFailure(es: EventSource, t: Throwable?, resp: okhttp3.Response?) {
                scope.launch {
                    isTyping.value = false
                    if (acc.isEmpty()) {
                        error.value = t?.message ?: "连接中断 (HTTP ${resp?.code})"
                    } else {
                        pushChunk()
                    }
                }
            }
        })
    }

    fun cancelStream() {
        sse?.cancel()
        sse = null
        isTyping.value = false
    }

    /** Parse [[motion:..]] / [[expression:..]] markers out of a reply and dispatch them. */
    fun dispatchMarkers(raw: String) {
        MOTION_RE.findAll(raw).forEach { m ->
            val parts = m.groupValues[1].split(":")
            live2d.playMotion(if (parts.size >= 2) "${parts[0]}:${parts[1]}" else ":${parts[0]}")
        }
        EXPR_RE.findAll(raw).forEach { m ->
            live2d.showExpression(m.groupValues[1].toIntOrNull() ?: 0)
        }
    }

    fun speak(text: String) {
        if (voiceEnabled.value && text.isNotBlank()) live2d.speak(text)
    }

    /** 语音合成：返回音频字节（POST /api/tts）。 */
    suspend fun tts(text: String): ByteArray = api.rawPost("/api/tts", jsonOf("text" to jsStr(text.take(600))))

    /** Maps valence/arousal/irritation to an expression index, mirroring the WebUI. */
    fun expressionFor(emo: JsonObject?): Int? {
        emo ?: return null
        val v = emo.dbl("valence")
        val irr = emo.dbl("irritation")
        return when {
            irr > 0.7 -> 6
            v > 0.5 -> 2
            v < -0.3 -> 4
            else -> 0
        }
    }

    suspend fun fetchNotifications(): List<Triple<String, String, String>> {
        return try {
            // Only this app's session: proactive notes for other adapters/webui
            // sessions are theirs to acknowledge.
            val resp = api.get("/api/life/notifications", listOf("session_id" to "app:$sessionId")).asObject()
            resp.arr("notifications").mapNotNull { n ->
                val o = n.asObject()
                val sid = o.str("session_id")
                Triple(o.str("id"), o.str("text"), sid)
            }
        } catch (e: Exception) {
            emptyList()
        }
    }

    suspend fun acknowledgeNotifications(ids: List<String>) {
        runCatching { api.post("/api/life/notifications", jsonOf("session_id" to jsStr("app:$sessionId"), "ids" to kotlinx.serialization.json.JsonArray(ids.map { jsStr(it) }))) }
    }
}

fun formatTime(ts: Long): String = SimpleDateFormat("HH:mm", Locale.getDefault()).format(Date(ts))
