package com.razuresoft.okayapp.ui.screens

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Switch
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
import com.razuresoft.okayapp.ui.components.ConfirmDialog
import com.razuresoft.okayapp.ui.components.DangerTextButton
import com.razuresoft.okayapp.ui.components.ErrorBox
import com.razuresoft.okayapp.ui.components.PrimaryButton
import com.razuresoft.okayapp.ui.components.RowItem
import com.razuresoft.okayapp.ui.components.ScreenScaffold
import com.razuresoft.okayapp.ui.components.SectionTitle
import com.razuresoft.okayapp.ui.theme.Danger
import com.razuresoft.okayapp.ui.theme.Success
import com.razuresoft.okayapp.ui.theme.TextDim
import com.razuresoft.okayapp.ui.theme.TextFaint
import kotlinx.coroutines.launch
import kotlinx.serialization.json.JsonArray
import com.razuresoft.okayapp.data.arr
import com.razuresoft.okayapp.data.asObject
import com.razuresoft.okayapp.data.bool
import com.razuresoft.okayapp.data.has
import com.razuresoft.okayapp.data.jsBool
import com.razuresoft.okayapp.data.jsStr
import com.razuresoft.okayapp.data.jsonOf

/**
 * 安全：访问 PIN 与登录门禁，对应 WebUI 的 SecurityPanel。
 *  - GET    /api/security/pin  → {configured, enabled, login_enabled, pages}
 *  - POST   /api/security/pin  {pin} / {enabled} / {login_enabled} / {pages}
 *  - DELETE /api/security/pin  清除 PIN
 *
 * PIN 是敏感操作的二次确认凭据；设置后 App 会把它记在本机，之后
 * 触发 403 pin_required 的请求会自动带上 X-0kay-Pin 重试一次。
 */
@Composable
fun SecurityScreen(nav: NavHostController) {
    val repo = LocalRepo.current
    val scope = rememberCoroutineScope()
    var configured by remember { mutableStateOf(false) }
    var enabled by remember { mutableStateOf(true) }
    var loginEnabled by remember { mutableStateOf(true) }
    var pages by remember { mutableStateOf<List<String>>(emptyList()) }
    var loaded by remember { mutableStateOf(false) }
    var newPin by remember { mutableStateOf("") }
    var confirmPin by remember { mutableStateOf("") }
    var pagesText by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }
    var notice by remember { mutableStateOf<String?>(null) }
    var confirmClear by remember { mutableStateOf(false) }

    suspend fun refresh() {
        runCatching {
            val s = repo.api.get("/api/security/pin").asObject()
            configured = s.bool("configured")
            enabled = if (s.has("enabled")) s.bool("enabled") else true
            loginEnabled = if (s.has("login_enabled")) s.bool("login_enabled") else true
            pages = s.arr("pages").mapNotNull { (it as? kotlinx.serialization.json.JsonPrimitive)?.content }
            pagesText = pages.joinToString("\n")
        }.onFailure { error = it.message }
        loaded = true
    }

    fun savePrefs(body: kotlinx.serialization.json.JsonObject) {
        scope.launch {
            error = null; notice = null
            try {
                repo.api.post("/api/security/pin", body)
                refresh()
                notice = "已保存"
            } catch (e: Exception) {
                error = e.message
                refresh()
            }
        }
    }

    LaunchedEffect(Unit) { refresh() }

    ScreenScaffold(
        title = "安全",
        subtitle = if (configured) "已设置访问 PIN" else "尚未设置 PIN",
        onBack = { nav.popBackStack() },
    ) { padding ->
        Column(Modifier.fillMaxSize().padding(padding).imePadding().verticalScroll(rememberScrollState())) {
            ErrorBox(error)
            notice?.let {
                Text(it, color = Success, style = MaterialTheme.typography.labelMedium, modifier = Modifier.padding(horizontal = 18.dp, vertical = 6.dp))
            }
            if (!loaded) {
                Text("加载中…", color = TextDim, modifier = Modifier.padding(18.dp))
                return@Column
            }

            SectionTitle("门禁")
            CardBox {
                RowItem(
                    "PIN 保护",
                    subtitle = "敏感操作（改供应商、装插件、改权限）需要输入 PIN",
                    trailing = { Switch(enabled, { enabled = it; savePrefs(jsonOf("enabled" to jsBool(it))) }) },
                )
                RowItem(
                    "登录验证",
                    subtitle = "非本机访问需要凭据；局域网模式下不可关闭",
                    trailing = { Switch(loginEnabled, { loginEnabled = it; savePrefs(jsonOf("login_enabled" to jsBool(it))) }) },
                )
            }

            SectionTitle(if (configured) "修改 PIN" else "设置 PIN")
            CardBox {
                Text(
                    if (configured) "输入 6 位数字的新 PIN。修改需要当前 PIN（App 已记住时会自动带上）。"
                    else "设置一个 6 位数字 PIN，用于敏感操作的二次确认。",
                    color = TextDim, style = MaterialTheme.typography.labelSmall,
                )
                Spacer(Modifier.height(8.dp))
                AppTextField(newPin, { newPin = it.filter(Char::isDigit).take(6) }, label = "新 PIN（6 位）", password = true, numeric = true)
                Spacer(Modifier.height(8.dp))
                AppTextField(confirmPin, { confirmPin = it.filter(Char::isDigit).take(6) }, label = "确认 PIN", password = true, numeric = true)
                Spacer(Modifier.height(10.dp))
                Row {
                    PrimaryButton("保存 PIN", {
                        error = null; notice = null
                        when {
                            newPin.length != 6 -> error = "PIN 必须是 6 位数字"
                            newPin != confirmPin -> error = "两次输入不一致"
                            else -> scope.launch {
                                try {
                                    repo.api.post("/api/security/pin", jsonOf("pin" to jsStr(newPin)))
                                    // 记住新 PIN，之后的敏感操作可直接通过二次确认。
                                    repo.store.setPin(newPin)
                                    newPin = ""; confirmPin = ""
                                    refresh()
                                    notice = "PIN 已更新"
                                } catch (e: Exception) {
                                    error = e.message
                                }
                            }
                        }
                    })
                    Spacer(Modifier.padding(6.dp))
                    if (configured) {
                        DangerTextButton("清除 PIN", { confirmClear = true })
                    }
                }
            }

            SectionTitle("需要 PIN 的页面")
            CardBox {
                Text(
                    "WebUI 路径，每行一个；留空表示仅敏感操作需要 PIN。",
                    color = TextDim, style = MaterialTheme.typography.labelSmall,
                )
                Spacer(Modifier.height(8.dp))
                AppTextField(pagesText, { pagesText = it }, label = "页面范围", singleLine = false)
                Spacer(Modifier.height(10.dp))
                PrimaryButton("保存页面范围", {
                    savePrefs(jsonOf("pages" to JsonArray(pagesText.lines().map { it.trim() }.filter { it.isNotEmpty() }.map { jsStr(it) })))
                })
                if (pages.isNotEmpty()) {
                    Spacer(Modifier.height(8.dp))
                    Badge("${pages.size} 个页面", Danger)
                }
            }

            Spacer(Modifier.height(24.dp))
        }

        if (confirmClear) {
            ConfirmDialog(
                title = "清除访问 PIN",
                message = "清除后敏感操作不再需要二次确认，任何已配对的设备都能直接改配置。",
                confirmLabel = "清除",
                danger = true,
                onConfirm = {
                    scope.launch {
                        error = null; notice = null
                        try {
                            repo.api.delete("/api/security/pin")
                            repo.store.setPin("")
                            refresh()
                            notice = "PIN 已清除"
                        } catch (e: Exception) {
                            error = e.message
                        }
                    }
                },
                onDismiss = { confirmClear = false },
            )
        }
    }
}
