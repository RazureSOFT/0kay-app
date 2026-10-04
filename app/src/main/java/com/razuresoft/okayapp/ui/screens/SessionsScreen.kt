package com.razuresoft.okayapp.ui.screens

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
import androidx.compose.ui.text.font.FontWeight
import androidx.navigation.NavHostController
import com.razuresoft.okayapp.data.arr
import com.razuresoft.okayapp.data.asObject
import com.razuresoft.okayapp.data.int
import com.razuresoft.okayapp.data.str
import com.razuresoft.okayapp.ui.LocalRepo
import com.razuresoft.okayapp.ui.Routes
import com.razuresoft.okayapp.ui.components.EmptyBox
import com.razuresoft.okayapp.ui.components.ErrorBox
import com.razuresoft.okayapp.ui.components.RowItem
import com.razuresoft.okayapp.ui.components.ScreenScaffold
import com.razuresoft.okayapp.ui.theme.TextFaint
import androidx.compose.ui.unit.dp
import kotlinx.serialization.json.JsonObject

/** Agent 会话列表（/api/agent/sessions）。 */
@Composable
fun SessionsScreen(nav: NavHostController) {
    val repo = LocalRepo.current
    var sessions by remember { mutableStateOf<List<JsonObject>>(emptyList()) }
    var error by remember { mutableStateOf<String?>(null) }
    var loaded by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        runCatching {
            val resp = repo.api.get("/api/agent/sessions")
            sessions = (resp as? kotlinx.serialization.json.JsonArray)?.map { it.asObject() }
                ?: resp.asObject().arr("sessions").map { it.asObject() }
        }.onFailure { error = it.message }
        loaded = true
    }

    ScreenScaffold(title = "Agent 会话", onBack = { nav.popBackStack() }) { padding ->
        if (loaded && sessions.isEmpty() && error == null) {
            EmptyBox("暂无会话")
        }
        ErrorBox(error)
        LazyColumn(Modifier.fillMaxSize().padding(padding)) {
            items(sessions, key = { it.str("id").ifEmpty { it.hashCode().toString() } }) { s ->
                RowItem(
                    title = s.str("title").ifEmpty { s.str("summary").ifEmpty { s.str("id").take(18) } },
                    subtitle = "消息 ${s.int("message_count")}${s.str("updated_at").let { if (it.isNotEmpty()) " · $it" else "" }}",
                    onClick = { nav.navigate("${Routes.Session}/${s.str("id")}") },
                )
            }
        }
        if (sessions.isEmpty() && error != null) {
            Text("无法加载会话列表", color = TextFaint, style = MaterialTheme.typography.labelSmall, modifier = Modifier.padding(18.dp))
        }
    }
}
