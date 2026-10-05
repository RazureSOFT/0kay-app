package com.razuresoft.okayapp.ui.components

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.razuresoft.okayapp.data.AppRepo
import com.razuresoft.okayapp.data.agentOptionLabel
import com.razuresoft.okayapp.data.arr
import com.razuresoft.okayapp.data.asObject
import com.razuresoft.okayapp.data.obj
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
 *
 * 每个弹层都提供「稍后」，并且提交期间禁用按钮：以前只有允许/拒绝、且可连点，
 * 一次误触就会对同一条审批发出两次决议。
 */
@Composable
fun ApprovalOverlay(repo: AppRepo) {
    // Agent 收件箱来自 repo 单例轮询，和任务页共享同一份数据，回答后即时刷新。
    val approvals by repo.inbox.approvals.collectAsState()
    val questions by repo.inbox.questions.collectAsState()
    var lifeApproval by remember { mutableStateOf<JsonObject?>(null) }
    // Items the user chose to defer: hidden without being answered.
    var deferred by remember { mutableStateOf(setOf<String>()) }
    // 正在提交的条目 id：提交期间禁用按钮，避免连点重复决议。
    var busy by remember { mutableStateOf<String?>(null) }
    // 提交失败必须让用户看见，否则弹窗会静默重现、看起来像没反应。
    var error by remember { mutableStateOf<String?>(null) }

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

    approvals.firstOrNull { it.str("id") !in deferred }?.let { a ->
        val id = a.str("id")
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
                    error?.let {
                        Spacer(Modifier.height(8.dp))
                        Text(it, color = Danger, style = MaterialTheme.typography.bodySmall)
                    }
                }
            },
            confirmButton = {
                TextButton(
                    onClick = { busy = id; resolveAgentApproval(repo, a, true) { busy = null; error = it } },
                    enabled = busy == null,
                ) {
                    Text("允许", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    TextButton(onClick = { deferred = deferred + id }) { Text("稍后") }
                    TextButton(
                        onClick = { busy = id; resolveAgentApproval(repo, a, false) { busy = null; error = it } },
                        enabled = busy == null,
                    ) {
                        Text("拒绝", color = Danger)
                    }
                }
            },
        )
    }

    questions.firstOrNull { it.str("id") !in deferred }?.let { q ->
        val id = q.str("id")
        var answer by remember(id) { mutableStateOf("") }
        val options = q.arr("options").map { it.agentOptionLabel() }
        AlertDialog(
            onDismissRequest = {},
            title = { Text("Agent 向你提问", fontWeight = FontWeight.Bold) },
            text = {
                Column {
                    Text(q.str("question"), fontWeight = FontWeight.SemiBold)
                    Spacer(Modifier.height(10.dp))
                    options.forEach { opt ->
                        TextButton(
                            onClick = { busy = id; resolveAgentQuestion(repo, q, opt) { busy = null; error = it } },
                            enabled = busy == null,
                        ) { Text("▸ $opt") }
                    }
                    OutlinedTextField(
                        value = answer,
                        onValueChange = { answer = it },
                        label = { Text("自由回答") },
                        singleLine = true,
                        modifier = Modifier.padding(top = 4.dp),
                    )
                    error?.let {
                        Spacer(Modifier.height(8.dp))
                        Text(it, color = Danger, style = MaterialTheme.typography.bodySmall)
                    }
                }
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        if (answer.isNotBlank()) {
                            busy = id
                            resolveAgentQuestion(repo, q, answer) { busy = null; error = it }
                        }
                    },
                    enabled = busy == null && answer.isNotBlank(),
                ) { Text("发送回答") }
            },
            dismissButton = {
                TextButton(onClick = { deferred = deferred + id }) { Text("稍后再说") }
            },
        )
    }

    lifeApproval?.let { lp ->
        val id = lp.str("id")
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
                    error?.let {
                        Spacer(Modifier.height(8.dp))
                        Text(it, color = Danger, style = MaterialTheme.typography.bodySmall)
                    }
                }
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        busy = id
                        resolveLifeApproval(repo, lp, true) { busy = null; error = it; lifeApproval = null }
                    },
                    enabled = busy == null,
                ) {
                    Text("允许", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(
                    onClick = {
                        busy = id
                        resolveLifeApproval(repo, lp, false) { busy = null; error = it; lifeApproval = null }
                    },
                    enabled = busy == null,
                ) {
                    Text("拒绝", color = Danger)
                }
            },
        )
    }
}

/** 提交一条 Agent 审批；`done` 收到 null 表示成功，否则是失败原因。 */
private fun resolveAgentApproval(repo: AppRepo, item: JsonObject, allow: Boolean, done: (String?) -> Unit) {
    repo.launchUi {
        val failure = runCatching {
            repo.api.post(
                "/api/agent/approvals",
                jsonOf("id" to jsStr(item.str("id")), "executor_id" to jsStr(item.str("executor_id")), "allow" to jsBool(allow)),
            )
        }.exceptionOrNull()?.message
        repo.inbox.refresh()
        done(failure)
    }
}

private fun resolveAgentQuestion(repo: AppRepo, item: JsonObject, answer: String, done: (String?) -> Unit) {
    repo.launchUi {
        val failure = runCatching {
            repo.api.post(
                "/api/agent/questions",
                jsonOf("id" to jsStr(item.str("id")), "executor_id" to jsStr(item.str("executor_id")), "answer" to jsStr(answer)),
            )
        }.exceptionOrNull()?.message
        repo.inbox.refresh()
        done(failure)
    }
}

private fun resolveLifeApproval(repo: AppRepo, item: JsonObject, allow: Boolean, done: (String?) -> Unit) {
    repo.launchUi {
        val failure = runCatching {
            repo.api.post(
                "/api/life/companion",
                jsonOf("action" to jsStr("approval_resolve"), "payload" to jsonOf("id" to jsStr(item.str("id")), "allow" to jsBool(allow))),
            )
        }.exceptionOrNull()?.message
        done(failure)
    }
}
