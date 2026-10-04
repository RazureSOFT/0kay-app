package com.razuresoft.okayapp.data

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.launch
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.booleanOrNull
import kotlinx.serialization.json.contentOrNull

val okayJson: Json = Json {
    ignoreUnknownKeys = true
    isLenient = true
    explicitNulls = false
    encodeDefaults = true
}

data class ServerConfig(
    val baseUrl: String = "",
    val token: String = "",
    val pin: String = "",
) {
    val connected: Boolean get() = baseUrl.isNotBlank()
}

private val Context.okayDataStore by preferencesDataStore(name = "okay_server")

class ServerStore(private val context: Context) {
    private val keyUrl = stringPreferencesKey("baseUrl")
    private val keyToken = stringPreferencesKey("token")
    private val keyPin = stringPreferencesKey("pin")

    val flow: Flow<ServerConfig> = context.okayDataStore.data.map { p ->
        ServerConfig(
            baseUrl = p[keyUrl] ?: "",
            token = p[keyToken] ?: "",
            pin = p[keyPin] ?: "",
        )
    }

    suspend fun current(): ServerConfig = flow.first()

    suspend fun save(baseUrl: String, token: String, pin: String) {
        context.okayDataStore.edit {
            it[keyUrl] = normalizeBase(baseUrl)
            it[keyToken] = token
            it[keyPin] = pin
        }
    }

    suspend fun setPin(pin: String) {
        context.okayDataStore.edit { it[keyPin] = pin }
    }

    suspend fun clear() {
        context.okayDataStore.edit { it.clear() }
    }
}

fun normalizeBase(url: String): String {
    var u = url.trim()
    if (u.isEmpty()) return ""
    if (!u.startsWith("http://") && !u.startsWith("https://")) u = "http://$u"
    return u.trimEnd('/')
}

/** App-wide container: config store + HTTP API. */
class AppRepo(context: Context) {
    val store = ServerStore(context)
    val api = OkayApi()
    val chat = ChatStore(context, api)
    val inbox = InboxStore(api)
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)

    init {
        scope.launch { store.flow.collect { api.config = it } }
        inbox.start()
    }

    /** 主线程协程里执行一段异步工作（UI 层的一次性调用用这个，别自建 scope）。 */
    fun launchUi(block: suspend () -> Unit) {
        scope.launch { block() }
    }
}

// ---- Json helpers -------------------------------------------------------

fun JsonElement?.asObject(): JsonObject = (this as? JsonObject) ?: JsonObject(emptyMap())
fun JsonElement?.asArray(): List<JsonElement> = (this as? JsonArray)?.toList() ?: emptyList()
fun JsonElement?.asString(): String = (this as? JsonPrimitive)?.contentOrNull ?: ""

fun JsonObject.str(key: String): String = (this[key] as? JsonPrimitive)?.contentOrNull ?: ""
fun JsonObject.int(key: String): Int = (this[key] as? JsonPrimitive)?.contentOrNull?.toDoubleOrNull()?.toInt() ?: 0
fun JsonObject.dbl(key: String): Double = (this[key] as? JsonPrimitive)?.contentOrNull?.toDoubleOrNull() ?: 0.0
fun JsonObject.bool(key: String): Boolean = (this[key] as? JsonPrimitive)?.booleanOrNull ?: false
fun JsonObject.obj(key: String): JsonObject = (this[key] as? JsonObject) ?: JsonObject(emptyMap())
fun JsonObject.arr(key: String): List<JsonElement> = (this[key] as? JsonArray)?.toList() ?: emptyList()
fun JsonObject.has(key: String): Boolean = this.containsKey(key) && this[key] !is JsonNull

fun jsonOf(vararg pairs: Pair<String, JsonElement?>): JsonObject =
    JsonObject(pairs.mapNotNull { (k, v) -> v?.let { k to it } }.toMap())

fun jsStr(value: String?): JsonElement = if (value == null) JsonNull else JsonPrimitive(value)
fun jsNum(value: Number): JsonElement = JsonPrimitive(value)
fun jsBool(value: Boolean): JsonElement = JsonPrimitive(value)

/**
 * Agent question options arrive either as ["label", ...] strings or as
 * [{"label": "..."}, ...] objects depending on the executor version.
 * Every consumer must parse them through this one function.
 */
fun JsonElement.agentOptionLabel(): String = when (this) {
    is JsonPrimitive -> contentOrNull.orEmpty()
    is JsonObject -> (this["label"] as? JsonPrimitive)?.contentOrNull
        ?: (this["text"] as? JsonPrimitive)?.contentOrNull.orEmpty()
    else -> toString()
}

/** True when a proactive notification belongs to this App session. */
fun JsonObject.notificationBelongsTo(sessionId: String): Boolean {
    val sid = str("session_id")
    return sid.isEmpty() || sid == sessionId
}

/**
 * Single polling owner for the agent inbox. The global overlay and the Tasks
 * screen both observe these lists; answering/denying an item refreshes here,
 * so the two views can never disagree or double-submit.
 */
class InboxStore(private val api: OkayApi) {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
    @Volatile private var started = false
    val approvals = kotlinx.coroutines.flow.MutableStateFlow(emptyList<JsonObject>())
    val questions = kotlinx.coroutines.flow.MutableStateFlow(emptyList<JsonObject>())

    fun start() {
        if (started) return
        started = true
        scope.launch {
            while (true) {
                refresh()
                kotlinx.coroutines.delay(2_500)
            }
        }
    }

    suspend fun refresh() {
        runCatching {
            val inbox = api.get("/api/agent/inbox").asObject()
            approvals.value = inbox.arr("approvals").map { it.asObject() }
            questions.value = inbox.arr("questions").map { it.asObject() }
        }
    }
}
