package com.razuresoft.okayapp.ui.screens

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController
import com.razuresoft.okayapp.ui.LocalRepo
import com.razuresoft.okayapp.ui.components.ErrorBox
import com.razuresoft.okayapp.ui.components.Loading
import com.razuresoft.okayapp.ui.components.PrimaryButton
import com.razuresoft.okayapp.ui.components.ScreenScaffold
import com.razuresoft.okayapp.ui.components.SectionTitle
import com.razuresoft.okayapp.ui.components.TonalButton
import com.razuresoft.okayapp.ui.theme.Danger
import com.razuresoft.okayapp.ui.theme.Success
import com.razuresoft.okayapp.ui.theme.TextDim
import kotlinx.coroutines.launch
import kotlinx.serialization.json.JsonArray
import com.razuresoft.okayapp.data.asObject
import com.razuresoft.okayapp.data.jsStr
import com.razuresoft.okayapp.data.jsonOf
import com.razuresoft.okayapp.data.obj
import com.razuresoft.okayapp.data.okayJson
import com.razuresoft.okayapp.data.str

/**
 * MCP 服务编辑器，对应 WebUI 的 McpPanel。
 *
 * 值是一个 JSON 数组（每项 ``{"id","transport","options"}``），由 Agent 与
 * L.I.F.E 共用。通用分区表单只会把它渲染成一行纯文本，没有校验，所以这里单独
 * 做一个屏：多行等宽编辑 + 保存前先解析。
 *
 *  - GET  /api/settings/mcp            → {section, values:{servers}}
 *  - POST /api/settings/mcp {values:{servers}}
 */
@Composable
fun McpScreen(nav: NavHostController) {
    val repo = LocalRepo.current
    val scope = rememberCoroutineScope()
    var text by remember { mutableStateOf("") }
    var saved by remember { mutableStateOf("") }
    var loaded by remember { mutableStateOf(false) }
    var parseError by remember { mutableStateOf<String?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    var notice by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        runCatching {
            val v = repo.api.get("/api/settings/mcp").asObject()
            val raw = v.obj("values").str("servers").ifEmpty { v.str("servers") }
            text = raw.ifEmpty { "[]" }
            saved = text
        }.onFailure { error = it.message }
        loaded = true
    }

    fun validate(): Boolean {
        parseError = runCatching {
            val el = okayJson.parseToJsonElement(text)
            if (el !is JsonArray) throw IllegalArgumentException("顶层必须是 JSON 数组，例如 []")
        }.exceptionOrNull()?.message
        return parseError == null
    }

    ScreenScaffold(
        title = "MCP",
        subtitle = "外部 MCP 服务（Agent 与 L.I.F.E 共用）",
        onBack = { nav.popBackStack() },
    ) { padding ->
        Column(Modifier.fillMaxSize().padding(padding).imePadding().verticalScroll(rememberScrollState())) {
            if (!loaded) {
                Loading()
                return@Column
            }
            ErrorBox(error)
            notice?.let {
                Text(
                    it,
                    color = Success,
                    style = MaterialTheme.typography.labelMedium,
                    modifier = Modifier.padding(horizontal = 18.dp, vertical = 6.dp),
                )
            }

            SectionTitle("servers")
            Text(
                "JSON 数组；每项形如 {\"id\":\"mail\",\"transport\":\"builtin\",\"options\":{...}}。留空数组表示不启用。",
                color = TextDim,
                style = MaterialTheme.typography.labelSmall,
                modifier = Modifier.padding(horizontal = 18.dp),
            )
            Spacer(Modifier.height(8.dp))
            OutlinedTextField(
                value = text,
                onValueChange = { text = it; parseError = null; notice = null },
                label = { Text("servers") },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 14.dp)
                    .height(240.dp),
                singleLine = false,
                textStyle = MaterialTheme.typography.bodySmall.copy(fontFamily = FontFamily.Monospace),
            )
            parseError?.let {
                Text(
                    it,
                    color = Danger,
                    style = MaterialTheme.typography.labelSmall,
                    modifier = Modifier.padding(horizontal = 18.dp, vertical = 6.dp),
                )
            }

            Row(Modifier.padding(14.dp)) {
                PrimaryButton("保存", {
                    if (!validate()) return@PrimaryButton
                    scope.launch {
                        error = null; notice = null
                        try {
                            repo.api.post("/api/settings/mcp", jsonOf("values" to jsonOf("servers" to jsStr(text.trim()))))
                            saved = text.trim()
                            notice = "已保存 ✓"
                        } catch (e: Exception) {
                            error = e.message
                        }
                    }
                }, enabled = text.trim() != saved)
                Spacer(Modifier.padding(6.dp))
                TonalButton("校验", { validate() })
            }
        }
    }
}
