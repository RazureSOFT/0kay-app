package com.razuresoft.okayapp.ui.screens

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController
import com.razuresoft.okayapp.ui.LocalRepo
import com.razuresoft.okayapp.ui.Routes
import com.razuresoft.okayapp.ui.components.AppTextField
import com.razuresoft.okayapp.ui.components.Badge
import androidx.compose.foundation.layout.fillMaxWidth
import com.razuresoft.okayapp.ui.components.CardBox
import com.razuresoft.okayapp.ui.components.EmptyBox
import com.razuresoft.okayapp.ui.components.ErrorBox
import com.razuresoft.okayapp.ui.components.Loading
import com.razuresoft.okayapp.ui.components.ScreenScaffold
import com.razuresoft.okayapp.ui.components.PrimaryButton
import com.razuresoft.okayapp.ui.components.RowItem
import com.razuresoft.okayapp.ui.components.SectionTitle
import com.razuresoft.okayapp.ui.components.TonalButton
import com.razuresoft.okayapp.ui.theme.Danger
import com.razuresoft.okayapp.ui.theme.TextDim
import com.razuresoft.okayapp.ui.theme.TextMain
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.serialization.json.JsonObject
import com.razuresoft.okayapp.data.arr
import com.razuresoft.okayapp.data.asObject
import com.razuresoft.okayapp.data.jsBool
import com.razuresoft.okayapp.data.jsStr
import com.razuresoft.okayapp.data.jsonOf
import com.razuresoft.okayapp.data.obj
import com.razuresoft.okayapp.data.str

/** Agent 收件箱：审批 + 提问的完整视图。 */
@Composable
fun InboxScreen(nav: NavHostController) {
    TasksScreen(nav)
}

@Composable
fun NotificationsScreen(nav: NavHostController) {
    val repo = LocalRepo.current
    val scope = rememberCoroutineScope()
    var notifications by remember { mutableStateOf<List<JsonObject>>(emptyList()) }
    var error by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        while (isActive) {
            runCatching {
                notifications = repo.api.get("/api/life/notifications").asObject()
                    .arr("notifications").map { it.asObject() }
            }.onFailure { error = it.message }
            delay(5000)
        }
    }

    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState())) {
        ErrorBox(error)
        SectionTitle("主动消息 (${notifications.size})")
        if (notifications.isEmpty()) EmptyBox("暂无通知")
        notifications.forEach { n ->
            CardBox {
                Text(n.str("text"), color = TextMain)
                Text(n.str("created_at"), color = TextDim, style = MaterialTheme.typography.labelSmall)
                TonalButton("已读", {
                    scope.launch {
                        runCatching {
                            repo.api.post(
                                "/api/life/notifications",
                                jsonOf("session_id" to jsStr("app:${repo.chat.sessionId}"), "ids" to kotlinx.serialization.json.JsonArray(listOf(jsStr(n.str("id"))))),
                            )
                        }
                    }
                })
            }
        }
        Spacer(Modifier.height(24.dp))
    }
}

/** Agent 会话详情：轮次（user prompt / assistant result）来自 turns 分页接口。 */
@Composable
fun SessionScreen(nav: NavHostController, id: String) {
    val repo = LocalRepo.current
    var turns by remember { mutableStateOf<List<JsonObject>>(emptyList()) }
    var error by remember { mutableStateOf<String?>(null) }
    var loaded by remember { mutableStateOf(false) }

    LaunchedEffect(id) {
        try {
            var url = "/api/agent/sessions/" + java.net.URLEncoder.encode(id, "UTF-8") + "/turns?limit=50"
            val acc = ArrayList<JsonObject>()
            for (i in 0 until 5) {
                val resp = repo.api.get(url).asObject()
                acc.addAll(resp.arr("tasks").map { it.asObject() })
                if (resp.str("more") != "true") break
                val next = resp.str("next")
                if (next.isEmpty()) break
                url = "/api/agent/sessions/" + java.net.URLEncoder.encode(id, "UTF-8") + "/turns?limit=50&before=" +
                    java.net.URLEncoder.encode(next, "UTF-8")
            }
            turns = acc.sortedBy { it.str("started_at") }
        } catch (e: Exception) {
            error = e.message
        }
        loaded = true
    }

    ScreenScaffold(title = "会话", subtitle = id.take(18), onBack = { nav.popBackStack() }) { padding ->
        Column(Modifier.fillMaxSize().padding(padding)) {
            ErrorBox(error)
            if (!loaded && error == null) {
                Loading()
                return@Column
            }
            if (loaded && turns.isEmpty() && error == null) EmptyBox("会话为空")
            Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState())) {
                turns.forEach { t ->
                    val prompt = t.str("prompt")
                    val result = t.str("result")
                    val err = t.str("error")
                    if (prompt.isNotBlank()) {
                        BubbleCard(text = prompt, isUser = true)
                    }
                    when {
                        err.isNotBlank() -> BubbleCard(text = "⚠ $err", isUser = false, isError = true)
                        result.isNotBlank() -> BubbleCard(text = result, isUser = false)
                        t.str("state") == "running" -> BubbleCard(text = "…执行中", isUser = false)
                    }
                }
                Spacer(Modifier.height(24.dp))
            }
        }
    }
}

@Composable
private fun BubbleCard(text: String, isUser: Boolean, isError: Boolean = false) {
    CardBox { Text(text, color = if (isError) Danger else TextMain) }
}

@Composable
fun AboutScreen(nav: NavHostController) {
    val repo = LocalRepo.current
    var health by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        runCatching {
            repo.api.get("/health")
            health = "已连接 ✓"
        }.onFailure { health = "连接失败: ${it.message}" }
    }

    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState())) {
        SectionTitle("关于")
        Column {
            RowItem("应用", "0KAY for Android")
            RowItem("版本", "0.2.0（原生 Compose）")
            RowItem("服务器", repo.api.config.baseUrl)
            RowItem("健康检查", health ?: "检测中…")
            RowItem("更新", subtitle = "平台与组件版本", onClick = { nav.navigate(Routes.Updates) })
        }
        SectionTitle("连接")
        Column {
            RowItem("WebUI", "浏览器打开服务器地址即可访问完整 WebUI")
        }
        Spacer(Modifier.height(24.dp))
    }
}
