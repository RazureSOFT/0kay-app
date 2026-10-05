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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController
import com.razuresoft.okayapp.ui.LocalRepo
import com.razuresoft.okayapp.ui.components.AppTextField
import com.razuresoft.okayapp.ui.components.Badge
import com.razuresoft.okayapp.ui.components.CardBox
import com.razuresoft.okayapp.ui.components.ErrorBox
import com.razuresoft.okayapp.ui.components.PrimaryButton
import com.razuresoft.okayapp.ui.components.RowItem
import com.razuresoft.okayapp.ui.components.ScreenScaffold
import com.razuresoft.okayapp.ui.components.SectionTitle
import com.razuresoft.okayapp.ui.components.TonalButton
import com.razuresoft.okayapp.ui.theme.Danger
import com.razuresoft.okayapp.ui.theme.Primary
import com.razuresoft.okayapp.ui.theme.Success
import com.razuresoft.okayapp.ui.theme.TextDim
import com.razuresoft.okayapp.ui.theme.TextFaint
import com.razuresoft.okayapp.ui.theme.TextMain
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.serialization.json.JsonObject
import com.razuresoft.okayapp.data.arr
import com.razuresoft.okayapp.data.asObject
import com.razuresoft.okayapp.data.bool
import com.razuresoft.okayapp.data.jsStr
import com.razuresoft.okayapp.data.jsonOf
import com.razuresoft.okayapp.data.obj
import com.razuresoft.okayapp.data.str

/**
 * 更新：平台与组件的版本检查与应用，对应 WebUI 的 UpdatesPanel。
 *  - GET  /api/plugins/pm/check          平台最新版本
 *  - GET  /api/plugins/pm/check-plugins  各组件/插件的可更新项
 *  - POST /api/plugins/pm/update         应用某个组件的更新 {plugin, version}
 *  - GET  /api/plugins/pm/status         最近一次更新的进度
 *  - GET/POST /api/settings/updates      全局插件源（GitHub 代理）
 */
@Composable
fun UpdatesScreen(nav: NavHostController) {
    val repo = LocalRepo.current
    val scope = rememberCoroutineScope()
    var core by remember { mutableStateOf<JsonObject?>(null) }
    var components by remember { mutableStateOf<List<JsonObject>>(emptyList()) }
    var apply by remember { mutableStateOf<JsonObject?>(null) }
    var proxy by remember { mutableStateOf("") }
    var savedProxy by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }
    var notice by remember { mutableStateOf<String?>(null) }

    suspend fun loadCore() {
        runCatching { core = repo.api.get("/api/plugins/pm/check").asObject() }
            .onFailure { error = it.message }
    }

    suspend fun loadComponents() {
        runCatching {
            components = repo.api.get("/api/plugins/pm/check-plugins").asObject()
                .arr("plugins").map { it.asObject() }
        }.onFailure { error = it.message }
    }

    suspend fun loadProxy() {
        runCatching {
            val v = repo.api.get("/api/settings/updates").asObject().obj("values").str("github_proxy")
            proxy = v; savedProxy = v
        }
    }

    fun applyUpdate(plugin: String, version: String) {
        scope.launch {
            error = null; notice = null
            try {
                apply = repo.api.post(
                    "/api/plugins/pm/update",
                    jsonOf("plugin" to jsStr(plugin), "version" to jsStr(version)),
                ).asObject()
            } catch (e: Exception) {
                error = e.message
            }
        }
    }

    LaunchedEffect(Unit) {
        loadCore(); loadComponents(); loadProxy()
        runCatching { apply = repo.api.get("/api/plugins/pm/status").asObject() }
    }

    // 更新进行中：轮询进度，Core 自更新会短暂重启，失败时静默重试。
    LaunchedEffect(apply?.str("status")) {
        while (isActive && apply?.str("status") == "running") {
            delay(2000)
            runCatching { apply = repo.api.get("/api/plugins/pm/status").asObject() }
        }
    }

    val running = apply?.str("status") == "running"
    val updateCount = components.count { it.bool("has_update") }

    ScreenScaffold(
        title = "更新",
        subtitle = if (updateCount > 0) "$updateCount 项可更新" else "平台与组件版本",
        onBack = { nav.popBackStack() },
    ) { padding ->
        Column(Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState())) {
            ErrorBox(error)
            notice?.let {
                Text(it, color = Success, style = MaterialTheme.typography.labelMedium, modifier = Modifier.padding(horizontal = 18.dp, vertical = 6.dp))
            }

            SectionTitle("平台")
            CardBox {
                val c = core
                if (c == null) {
                    Text("检查中…", color = TextDim)
                } else {
                    RowItem(
                        title = "0KAY Core",
                        subtitle = "当前 v${c.str("current")}",
                        value = c.str("latest").takeIf { it.isNotEmpty() }?.let { "最新 v$it" },
                    )
                    if (c.bool("has_update")) {
                        Spacer(Modifier.height(6.dp))
                        c.str("name").takeIf { it.isNotEmpty() }?.let { Text(it, color = TextMain, fontWeight = FontWeight.SemiBold) }
                        c.str("notes").takeIf { it.isNotEmpty() }?.let {
                            Text(it.take(600), color = TextDim, style = MaterialTheme.typography.bodySmall)
                        }
                        Spacer(Modifier.height(8.dp))
                        PrimaryButton(
                            "更新平台",
                            { applyUpdate("core", c.str("latest")) },
                            enabled = !running,
                            loading = running && apply?.str("plugin") == "core",
                        )
                    } else {
                        Spacer(Modifier.height(4.dp))
                        Badge("已是最新", Success)
                    }
                }
            }

            SectionTitle("组件与插件 (${components.size})")
            if (components.isEmpty()) {
                Text("没有可更新的组件", color = TextFaint, modifier = Modifier.padding(horizontal = 18.dp))
            }
            components.forEach { p ->
                val name = p.str("name")
                val has = p.bool("has_update")
                Column {
                    RowItem(
                        title = name,
                        subtitle = "当前 v${p.str("version")}" + p.str("error").takeIf { it.isNotEmpty() }?.let { " · $it" }.orEmpty(),
                        value = if (has) "→ v${p.str("latest")}" else null,
                        trailing = {
                            when {
                                !p.bool("can_update") -> Text("不可更新", color = TextFaint, style = MaterialTheme.typography.labelSmall)
                                has -> TonalButton(
                                    if (running && apply?.str("plugin") == name) "更新中…" else "更新",
                                    { applyUpdate(name, p.str("latest")) },
                                    // 一次只能跑一个更新：进行中时禁用所有组件按钮，
                                    // 否则会并发发起多个 /api/plugins/pm/update。
                                    enabled = !running,
                                )
                                else -> Text("最新", color = TextFaint, style = MaterialTheme.typography.labelSmall)
                            }
                        },
                    )
                }
            }

            apply?.takeIf { it.str("status") != "idle" }?.let { a ->
                SectionTitle("最近一次更新")
                CardBox {
                    Text("${a.str("plugin")} · ${a.str("status")}", fontWeight = FontWeight.SemiBold, color = when (a.str("status")) {
                        "failed" -> Danger
                        "done" -> Success
                        else -> Primary
                    })
                    a.str("error").takeIf { it.isNotEmpty() }?.let {
                        Text(it, color = Danger, style = MaterialTheme.typography.bodySmall)
                    }
                    a.str("log").takeIf { it.isNotEmpty() }?.let {
                        Text(it.takeLast(800), color = TextDim, style = MaterialTheme.typography.bodySmall)
                    }
                }
            }

            SectionTitle("插件源")
            Column(Modifier.padding(horizontal = 14.dp)) {
                AppTextField(proxy, { proxy = it }, label = "GitHub 代理（留空直连）", placeholder = "https://gh-proxy.com")
                Spacer(Modifier.height(8.dp))
                PrimaryButton("保存", {
                    scope.launch {
                        error = null; notice = null
                        try {
                            repo.api.post("/api/settings/updates", jsonOf("values" to jsonOf("github_proxy" to jsStr(proxy.trim()))))
                            savedProxy = proxy.trim()
                            notice = "已保存插件源"
                        } catch (e: Exception) {
                            error = e.message
                        }
                    }
                }, enabled = proxy.trim() != savedProxy)
                Spacer(Modifier.height(6.dp))
                Text(
                    "留空为直连 GitHub；填写加速前缀后，源码同步与 0kay-pm 安装/更新都会走该代理。",
                    color = TextFaint, style = MaterialTheme.typography.labelSmall,
                )
            }

            Column(Modifier.padding(14.dp)) {
                TonalButton("重新检查", {
                    scope.launch {
                        error = null
                        loadCore(); loadComponents()
                    }
                })
            }
            Spacer(Modifier.height(24.dp))
        }
    }
}
