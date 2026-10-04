package com.razuresoft.okayapp.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.ChatBubbleOutline
import androidx.compose.material.icons.outlined.Checklist
import androidx.compose.material.icons.outlined.GridView
import androidx.compose.material.icons.outlined.MonitorHeart
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.Alignment
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.razuresoft.okayapp.data.AppRepo
import com.razuresoft.okayapp.ui.components.Loading
import com.razuresoft.okayapp.ui.screens.AboutScreen
import com.razuresoft.okayapp.ui.screens.ChatScreen
import com.razuresoft.okayapp.ui.screens.CompanionScreen
import com.razuresoft.okayapp.ui.screens.InboxScreen
import com.razuresoft.okayapp.ui.screens.LoginScreen
import com.razuresoft.okayapp.ui.screens.MemoryScreen
import com.razuresoft.okayapp.ui.screens.MoreScreen
import com.razuresoft.okayapp.ui.screens.NotificationsScreen
import com.razuresoft.okayapp.ui.screens.PermissionsScreen
import com.razuresoft.okayapp.ui.screens.PluginsScreen
import com.razuresoft.okayapp.ui.screens.ProviderEditScreen
import com.razuresoft.okayapp.ui.screens.ProvidersScreen
import com.razuresoft.okayapp.ui.screens.ScanScreen
import com.razuresoft.okayapp.ui.screens.SectionScreen
import com.razuresoft.okayapp.ui.screens.SessionsScreen
import com.razuresoft.okayapp.ui.screens.SessionScreen
import com.razuresoft.okayapp.ui.screens.SettingsScreen
import com.razuresoft.okayapp.ui.screens.SkillsScreen
import com.razuresoft.okayapp.ui.screens.StatusScreen
import com.razuresoft.okayapp.ui.screens.TasksScreen
import com.razuresoft.okayapp.ui.screens.UsageScreen
import com.razuresoft.okayapp.ui.theme.Bg
import com.razuresoft.okayapp.ui.theme.TextDim

val LocalRepo = staticCompositionLocalOf<AppRepo> { error("AppRepo not provided") }

object Routes {
    const val Login = "login"
    const val Scan = "scan"
    const val Chat = "chat"
    const val Status = "status"
    const val Tasks = "tasks"
    const val More = "more"
    const val Sessions = "sessions"
    const val Session = "session"
    const val Settings = "settings"
    const val Section = "section"
    const val Providers = "providers"
    const val Provider = "provider"
    const val Plugins = "plugins"
    const val Usage = "usage"
    const val Memory = "memory"
    const val Skills = "skills"
    const val Permissions = "permissions"
    const val Companion = "companion"
    const val Inbox = "inbox"
    const val Notifications = "notifications"
    const val About = "about"
}

private data class Tab(val route: String, val label: String, val icon: ImageVector)

private val tabs = listOf(
    Tab(Routes.Chat, "聊天", Icons.Outlined.ChatBubbleOutline),
    Tab(Routes.Status, "状态", Icons.Outlined.MonitorHeart),
    Tab(Routes.Tasks, "任务", Icons.Outlined.Checklist),
    Tab(Routes.More, "更多", Icons.Outlined.GridView),
)

@Composable
fun AppRoot() {
    val repo = LocalRepo.current
    val config by repo.store.flow.collectAsState(initial = null)
    val c = config ?: run {
        Loading()
        return
    }

    val nav = rememberNavController()
    val backStack by nav.currentBackStackEntryAsState()
    val route = backStack?.destination?.route
    val showBottom = tabs.any { it.route == route }

    Scaffold(
        containerColor = Bg,
        bottomBar = {
            if (showBottom) {
                // M3 Expressive 底栏：整条是一个大胶囊（surfaceContainer），
                // 选中项内部再套一个小胶囊（primaryContainer）。
                Box(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 10.dp)) {
                    Surface(
                        shape = RoundedCornerShape(50),
                        color = MaterialTheme.colorScheme.surfaceContainer,
                        tonalElevation = 3.dp,
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Row(
                            Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                            horizontalArrangement = Arrangement.SpaceEvenly,
                        ) {
                            tabs.forEach { tab ->
                                val selected = route == tab.route
                                Column(
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    modifier = Modifier
                                        .weight(1f)
                                        .clip(RoundedCornerShape(50))
                                        .background(
                                            if (selected) MaterialTheme.colorScheme.primaryContainer
                                            else Color.Transparent
                                        )
                                        .clickable {
                                            nav.navigate(tab.route) {
                                                popUpTo(Routes.Chat) { saveState = true }
                                                launchSingleTop = true
                                                restoreState = true
                                            }
                                        }
                                        .padding(vertical = 8.dp),
                                ) {
                                    Icon(
                                        tab.icon,
                                        contentDescription = tab.label,
                                        tint = if (selected) MaterialTheme.colorScheme.onPrimaryContainer
                                        else MaterialTheme.colorScheme.onSurfaceVariant,
                                    )
                                    Text(
                                        tab.label,
                                        style = MaterialTheme.typography.labelSmall,
                                        color = if (selected) MaterialTheme.colorScheme.onPrimaryContainer
                                        else MaterialTheme.colorScheme.onSurfaceVariant,
                                        fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal,
                                    )
                                }
                            }
                        }
                    }
                }
            }
        },
    ) { padding ->
        NavHost(
            navController = nav,
            startDestination = if (c.connected) Routes.Chat else Routes.Login,
            modifier = Modifier.padding(padding),
        ) {
            composable(Routes.Login) { LoginScreen(nav) }
            composable(Routes.Scan) { ScanScreen(nav) }
            composable(Routes.Chat) { ChatScreen(nav) }
            composable(Routes.Status) { StatusScreen(nav) }
            composable(Routes.Tasks) { TasksScreen(nav) }
            composable(Routes.More) { MoreScreen(nav) }
            composable(Routes.Sessions) { SessionsScreen(nav) }
            composable("${Routes.Session}/{id}") { SessionScreen(nav, it.arguments?.getString("id").orEmpty()) }
            composable(Routes.Settings) { SettingsScreen(nav) }
            composable("${Routes.Section}/{id}") { SectionScreen(nav, it.arguments?.getString("id").orEmpty()) }
            composable(Routes.Providers) { ProvidersScreen(nav) }
            composable("${Routes.Provider}/{id}") { ProviderEditScreen(nav, it.arguments?.getString("id").orEmpty()) }
            composable(Routes.Plugins) { PluginsScreen(nav) }
            composable(Routes.Usage) { UsageScreen(nav) }
            composable(Routes.Memory) { MemoryScreen(nav) }
            composable(Routes.Skills) { SkillsScreen(nav) }
            composable(Routes.Permissions) { PermissionsScreen(nav) }
            composable(Routes.Companion) { CompanionScreen(nav) }
            composable(Routes.Inbox) { InboxScreen(nav) }
            composable(Routes.Notifications) { NotificationsScreen(nav) }
            composable(Routes.About) { AboutScreen(nav) }
        }
    }
}

fun NavHostController.go(route: String) = navigate(route)
