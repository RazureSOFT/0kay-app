package com.razuresoft.okayapp.ui.screens

import android.os.Build
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
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
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController
import com.razuresoft.okayapp.data.ApiException
import com.razuresoft.okayapp.data.ServerConfig
import com.razuresoft.okayapp.data.asObject
import com.razuresoft.okayapp.data.bool
import com.razuresoft.okayapp.data.jsonOf
import com.razuresoft.okayapp.data.jsStr
import com.razuresoft.okayapp.data.normalizeBase
import com.razuresoft.okayapp.data.str
import com.razuresoft.okayapp.ui.LocalRepo
import com.razuresoft.okayapp.ui.Routes
import com.razuresoft.okayapp.ui.components.AppTextField
import com.razuresoft.okayapp.ui.components.ErrorBox
import com.razuresoft.okayapp.ui.components.PrimaryButton
import com.razuresoft.okayapp.ui.components.TonalButton
import com.razuresoft.okayapp.ui.theme.Primary
import com.razuresoft.okayapp.ui.theme.TextDim
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

/**
 * 登录与配对。默认走标准配对：App 向 Core 申请配对（POST /api/pairing/request），
 * 用户在 WebUI 的「设备配对」面板核对 6 位代码并允许后，App 轮询
 * /api/pairing/status 领取设备 token。也支持手动填 Token/PIN 或扫码。
 */
@Composable
fun LoginScreen(nav: NavHostController) {
    val repo = LocalRepo.current
    val scope = rememberCoroutineScope()
    var url by remember { mutableStateOf("http://192.168.1.15:8080") }
    var token by remember { mutableStateOf("") }
    var pin by remember { mutableStateOf("") }
    var manual by remember { mutableStateOf(false) }
    var busy by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    // 配对状态机
    var pairingCode by remember { mutableStateOf<String?>(null) }
    var pairingId by remember { mutableStateOf("") }
    var pairingSecret by remember { mutableStateOf("") }

    LaunchedEffect(Unit) {
        val c = repo.store.current()
        if (c.baseUrl.isNotBlank()) url = c.baseUrl
        token = c.token
        pin = c.pin
    }

    // 轮询配对结果
    LaunchedEffect(pairingId) {
        if (pairingId.isEmpty()) return@LaunchedEffect
        while (isActive) {
            delay(2000)
            try {
                val resp = repo.api.post("/api/pairing/status", jsonOf("id" to jsStr(pairingId), "secret" to jsStr(pairingSecret))).asObject()
                if (resp.bool("approved")) {
                    val t = resp.str("token")
                    repo.store.save(repo.api.config.baseUrl, t, "")
                    repo.api.config = ServerConfig(repo.api.config.baseUrl, t, "")
                    pairingCode = null; pairingId = ""
                    nav.navigate(Routes.Chat) { popUpTo(0) }
                    return@LaunchedEffect
                }
            } catch (e: ApiException) {
                if (e.status == 404) {
                    pairingCode = null; pairingId = ""
                    error = "配对请求已过期，请重新发起"
                    return@LaunchedEffect
                }
            } catch (e: Exception) {
                // 网络抖动，继续重试
            }
        }
    }

    Column(
        Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(20.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Spacer(Modifier.height(36.dp))
        Text("0KAY", style = MaterialTheme.typography.displaySmall, fontWeight = FontWeight.Black)
        Text("连接你自托管的 AI 伙伴", color = TextDim)
        Spacer(Modifier.height(24.dp))

        if (pairingCode == null) {
            AppTextField(url, { url = it }, label = "服务器地址", placeholder = "http://192.168.1.15:8080")
            Spacer(Modifier.height(12.dp))

            ErrorBox(error)
            PrimaryButton(
                "配对连接",
                onClick = {
                    scope.launch {
                        error = null; busy = true
                        try {
                            val base = normalizeBase(url)
                            if (base.isBlank()) throw IllegalStateException("请输入服务器地址")
                            repo.api.config = ServerConfig(base)
                            val resp = repo.api.post(
                                "/api/pairing/request",
                                jsonOf("name" to jsStr("Android · ${Build.MODEL ?: "手机"}")),
                            ).asObject()
                            pairingId = resp.str("id")
                            pairingSecret = resp.str("secret")
                            pairingCode = resp.str("code")
                        } catch (e: Exception) {
                            error = "无法发起配对：${e.message}\n请检查地址，或在下方手动输入 Token。"
                            manual = true
                        } finally {
                            busy = false
                        }
                    }
                },
                loading = busy,
                modifier = Modifier.fillMaxWidth(),
            )
            Spacer(Modifier.height(10.dp))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                TonalButton("扫描二维码", onClick = { nav.navigate(Routes.Scan) }, Modifier.weight(1f))
                TonalButton(if (manual) "收起手动输入" else "手动输入 Token", onClick = { manual = !manual }, Modifier.weight(1f))
            }

            if (manual) {
                Spacer(Modifier.height(14.dp))
                Text("手动配对（可选）", color = TextDim, style = MaterialTheme.typography.labelLarge, modifier = Modifier.align(Alignment.Start))
                Spacer(Modifier.height(8.dp))
                AppTextField(token, { token = it }, label = "API / 设备 Token", password = true)
                Spacer(Modifier.height(8.dp))
                AppTextField(pin, { pin = it }, label = "访问 PIN（可选）", password = true, numeric = true)
                Spacer(Modifier.height(10.dp))
                ErrorBox(error)
                PrimaryButton("保存并连接", onClick = {
                    scope.launch {
                        error = null; busy = true
                        try {
                            val base = normalizeBase(url)
                            if (base.isBlank()) throw IllegalStateException("请输入服务器地址")
                            val cfg = ServerConfig(base, token.trim(), pin.trim())
                            repo.store.save(cfg.baseUrl, cfg.token, cfg.pin)
                            repo.api.config = cfg
                            repo.api.get("/api/auth/session")
                            repo.api.get("/health")
                            nav.navigate(Routes.Chat) { popUpTo(0) }
                        } catch (e: Exception) {
                            error = e.message
                        } finally {
                            busy = false
                        }
                    }
                }, loading = busy, modifier = Modifier.fillMaxWidth())
            }
        } else {
            // 等待 WebUI 侧批准
            Text("在电脑的 0KAY 网页里", color = TextDim)
            Text("打开「设置 → 设备配对」", color = TextDim)
            Spacer(Modifier.height(18.dp))
            Text("输入这串配对代码", style = MaterialTheme.typography.labelLarge, color = TextDim)
            Text(
                pairingCode.orEmpty(),
                style = MaterialTheme.typography.displayMedium,
                fontWeight = FontWeight.Black,
                color = Primary,
            )
            Spacer(Modifier.height(18.dp))
            Text("核对代码后点击「允许配对」…", color = TextDim, style = MaterialTheme.typography.bodySmall)
            Spacer(Modifier.height(14.dp))
            PrimaryButton("取消", onClick = {
                pairingCode = null; pairingId = ""; error = null
            }, modifier = Modifier.fillMaxWidth())
        }

        Spacer(Modifier.height(24.dp))
        Text(
            "提示：手机与 Core 需在同一局域网。Core 监听 0.0.0.0 并开启 CORE_LAN_ENABLED=1 后可自动配对。",
            color = TextDim,
            style = MaterialTheme.typography.labelSmall,
        )
    }
}
