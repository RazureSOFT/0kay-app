package com.razuresoft.okayapp.ui.components

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.razuresoft.okayapp.data.AppRepo
import com.razuresoft.okayapp.data.asObject
import com.razuresoft.okayapp.data.jsonOf
import com.razuresoft.okayapp.data.jsBool
import com.razuresoft.okayapp.data.jsStr
import com.razuresoft.okayapp.data.str
import com.razuresoft.okayapp.ui.theme.Danger
import com.razuresoft.okayapp.ui.theme.TextDim
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.serialization.json.JsonObject

/**
 * 全局审批弹层（挂在 AppRoot，覆盖所有页面），对应 WebUI 的
 * GlobalAgentInbox 与 LifeApprovalDialog：
 *  - Agent 审批/提问：GET /api/agent/inbox → /api/agent/approvals|questions
 *  - L.I.F.E 邮件审批：POST /api/life/companion (approval_list/approval_resolve)
 */
@Composable
fun ApprovalOverlay(repo: AppRepo) {
    var agentApproval by remember { mutableStateOf<JsonObject?>(null) }
    var agentQuestion by remember { mutableStateOf<JsonObject?>(null) }
    var lifeApproval by remember { mutableStateOf<JsonObject?>(null) }

    // Agent 收件箱轮询（WebUI 为 1.5s，这里 2.5s 折中省电）
    LaunchedEffect(Unit) {
        while (isActive) {
            if (agentApproval == null && agentQuestion == null) {
                runCatching {
                    val inbox = repo.api.get("/api/agent/inbox").asObject()
                    agentApproval = inbox.arr("approvals").firstOrNull()?.asObject()
                    if (agentApproval == null) {
                        agentQuestion = inbox.arr("questions").firstOrNull()?.asObject()
                    }
                }
            }
            delay(2500)
        }
    }

    // L.I.F.E 邮件审批轮询（WebUI 为 2.5s）
    LaunchedEffect(Unit) {
        while (isActive) {
            if (lifeApproval == null) {
                runCatching {
                    val resp = repo.api.post("/api/life/companion", jsonOf("action" to jsStr("approval_list"))).asObject()
                    lifeApproval = resp.arr("approvals").firstOrNull()?.asObject()
                }
            }
            delay(3000)
        }
    }

    agentApproval?.let { a ->
        AlertDialog(
            onDismissRequest = {},
            title = { Text("Agent 请求执行操作", fontWeight = FontWeight.Bold) },
            text = {
                Column {
                    Text("主机：${a.str("executor_id").ifEmpty { "未知" }}", color = TextDim, style = MaterialTheme.typography.labelMedium)
                    a.str("cwd").takeIf { it.isNotEmpty() }?.let {
                        Text("目录：$it", color = TextDim, style = MaterialTheme.typography.labelMedium)
                    }
                    Spacer(Modifier.height(8.dp))
                    Text("工具：${a.str("tool")}", fontWeight = FontWeight.SemiBold)
                    Spacer(Modifier.height(8.dp))
                    Text("参数：", color = TextDim, style = MaterialTheme.typography.labelMedium)
                    Text(
                        a.obj("args").toString().take(500),
                        style = MaterialTheme.typography.bodySmall,
                    )
                }
            },
            confirmButton = {
                TextButton(onClick = { resolveAgentApproval(repo, a, true) { agentApproval = null } }) {
                    Text("允许", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { resolveAgentApproval(repo, a, false) { agentApproval = null } }) {
                    Text("拒绝", color = Danger)
                }
            },
        )
    }

    agentQuestion?.let { q ->
        var answer by remember(q.str("id")) { mutableStateOf("") }
        val options = q.arr("options").map { it.toString().trim('"') }
        AlertDialog(
            onDismissRequest = {},
            title = { Text("Agent 向你提问", fontWeight = FontWeight.Bold) },
            text = {
                Column {
                    Text(q.str("question"), fontWeight = FontWeight.SemiBold)
                    Spacer(Modifier.height(10.dp))
                    options.forEach { opt ->
                        TextButton(onClick = {
                            resolveAgentQuestion(repo, q, opt) { agentQuestion = null }
                        }) { Text("▸ $opt") }
                    }
                    OutlinedTextField(
                        value = answer,
                        onValueChange = { answer = it },
                        label = { Text("自由回答") },
                        singleLine = true,
                        modifier = Modifier.padding(top = 4.dp),
                    )
                }
            },
            confirmButton = {
                TextButton(onClick = {
                    if (answer.isNotBlank()) resolveAgentQuestion(repo, q, answer) { agentQuestion = null }
                }) { Text("发送回答") }
            },
            dismissButton = {
                TextButton(onClick = { agentQuestion = null }) { Text("稍后再说") }
            },
        )
    }

    lifeApproval?.let { lp ->
        AlertDialog(
            onDismissRequest = {},
            title = { Text("L.I.F.E 请求邮件操作", fontWeight = FontWeight.Bold) },
            text = {
                Column {
                    Text("操作：${lp.str("tool")}", fontWeight = FontWeight.SemiBold)
                    lp.str("created_at").takeIf { it.isNotEmpty() }?.let {
                        Text("时间：$it", color = TextDim, style = MaterialTheme.typography.labelMedium)
                    }
                    Spacer(Modifier.height(8.dp))
                    Text(lp.str("detail"), style = MaterialTheme.typography.bodySmall)
                }
            },
            confirmButton = {
                TextButton(onClick = { resolveLifeApproval(repo, lp, true) { lifeApproval = null } }) {
                    Text("允许", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { resolveLifeApproval(repo, lp, false) { lifeApproval = null } }) {
                    Text("拒绝", color = Danger)
                }
            },
        )
    }
}

private fun resolveAgentApproval(repo: AppRepo, item: JsonObject, allow: Boolean, done: () -> Unit) {
    repo.launchUi {
        runCatching {
            repo.api.post(
                "/api/agent/approvals",
                jsonOf("id" to jsStr(item.str("id")), "executor_id" to jsStr(item.str("executor_id")), "allow" to jsBool(allow)),
            )
        }
        done()
    }
}

private fun resolveAgentQuestion(repo: AppRepo, item: JsonObject, answer: String, done: () -> Unit) {
    repo.launchUi {
        runCatching {
            repo.api.post(
                "/api/agent/questions",
                jsonOf("id" to jsStr(item.str("id")), "executor_id" to jsStr(item.str("executor_id")), "answer" to jsStr(answer)),
            )
        }
        done()
    }
}

private fun resolveLifeApproval(repo: AppRepo, item: JsonObject, allow: Boolean, done: () -> Unit) {
    repo.launchUi {
        runCatching {
            repo.api.post(
                "/api/life/companion",
                jsonOf("action" to jsStr("approval_resolve"), "payload" to jsonOf("id" to jsStr(item.str("id")), "allow" to jsBool(allow))),
            )
        }
        done()
    }
}
