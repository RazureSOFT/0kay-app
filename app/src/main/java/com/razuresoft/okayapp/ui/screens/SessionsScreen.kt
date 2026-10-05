package com.razuresoft.okayapp.ui.screens

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import com.razuresoft.okayapp.data.arr
import com.razuresoft.okayapp.data.asObject
import com.razuresoft.okayapp.data.str
import com.razuresoft.okayapp.ui.LocalRepo
import com.razuresoft.okayapp.ui.Routes
import com.razuresoft.okayapp.ui.components.EmptyBox
import com.razuresoft.okayapp.ui.components.ErrorBox
import com.razuresoft.okayapp.ui.components.Loading
import com.razuresoft.okayapp.ui.components.RowItem
import com.razuresoft.okayapp.ui.components.ScreenScaffold
import kotlinx.serialization.json.JsonObject

/**
 * Agent 会话列表。会话是 /api/tasks 快照里 kind == "agent_session" 的行，
 * 标题取 prompt，轮次经 /api/agent/sessions/{id}/turns 分页拉取。
 */
@Composable
fun SessionsScreen(nav: NavHostController) {
    val repo = LocalRepo.current
    var sessions by remember { mutableStateOf<List<JsonObject>>(emptyList()) }
    var error by remember { mutableStateOf<String?>(null) }
    var loaded by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        runCatching {
            val resp = repo.api.get("/api/tasks")
            val rows = (resp as? kotlinx.serialization.json.JsonArray)?.map { it.asObject() }
                ?: resp.asObject().arr("tasks").map { it.asObject() }
            sessions = rows.filter { it.str("kind") == "agent_session" }
                .sortedByDescending { it.str("started_at") }
        }.onFailure { error = it.message }
        loaded = true
    }

    ScreenScaffold(title = "Agent 会话", onBack = { nav.popBackStack() }) { padding ->
        // Scaffold 的内容槽是堆叠布局：必须包一层 Column，否则错误条/加载态
        // 会和列表叠在一起。
        Column(Modifier.fillMaxSize().padding(padding)) {
            ErrorBox(error)
            when {
                !loaded && error == null -> Loading()
                sessions.isEmpty() && error == null -> EmptyBox("暂无会话")
                else -> LazyColumn(Modifier.fillMaxSize()) {
                    items(sessions, key = { it.str("task_id").ifEmpty { it.hashCode().toString() } }) { s ->
                        RowItem(
                            title = s.str("prompt").ifEmpty { s.str("task_id").take(18) },
                            subtitle = s.str("started_at"),
                            onClick = { nav.navigate("${Routes.Session}/${s.str("task_id")}") },
                        )
                    }
                }
            }
        }
    }
}
