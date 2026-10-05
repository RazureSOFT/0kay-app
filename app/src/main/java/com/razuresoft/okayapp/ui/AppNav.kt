package com.razuresoft.okayapp.ui

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.tween
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.ChatBubbleOutline
import androidx.compose.material.icons.outlined.Checklist
import androidx.compose.material.icons.outlined.GridView
import androidx.compose.material.icons.outlined.MonitorHeart
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.draw.scale
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.razuresoft.okayapp.data.AppRepo
import com.razuresoft.okayapp.ui.components.ApprovalOverlay
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
import com.razuresoft.okayapp.ui.screens.SecurityScreen
import com.razuresoft.okayapp.ui.screens.SessionsScreen
import com.razuresoft.okayapp.ui.screens.SessionScreen
import com.razuresoft.okayapp.ui.screens.SettingsScreen
import com.razuresoft.okayapp.ui.screens.SkillsScreen
import com.razuresoft.okayapp.ui.screens.StatusScreen
import com.razuresoft.okayapp.ui.screens.TasksScreen
import com.razuresoft.okayapp.ui.screens.UpdatesScreen
import com.razuresoft.okayapp.ui.screens.UsageScreen
import com.razuresoft.okayapp.ui.theme.Bg
import dev.chrisbanes.haze.HazeState
import dev.chrisbanes.haze.HazeStyle
import dev.chrisbanes.haze.HazeTint
import dev.chrisbanes.haze.hazeEffect
import dev.chrisbanes.haze.hazeSource

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
    const val Updates = "updates"
    const val Security = "security"
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
    val hazeState = remember { HazeState() }

    Scaffold(containerColor = Bg) { padding ->
        Box(Modifier.fillMaxSize().padding(padding)) {
            NavHost(
                navController = nav,
                startDestination = if (c.connected) Routes.Chat else Routes.Login,
                modifier = Modifier
                    .fillMaxSize()
                    .hazeSource(hazeState),
                // 页面切换动效：淡入 + 轻微上滑，Expressive 弹簧曲线
                enterTransition = {
                    fadeIn(tween(240)) + slideInVertically(spring(stiffness = Spring.StiffnessMediumLow)) { it / 16 }
                },
                exitTransition = { fadeOut(tween(160)) },
                popEnterTransition = { fadeIn(tween(240)) },
                popExitTransition = { fadeOut(tween(160)) },
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
                composable(Routes.Updates) { UpdatesScreen(nav) }
                composable(Routes.Security) { SecurityScreen(nav) }
                composable(Routes.About) { AboutScreen(nav) }
            }

            // M3 Expressive 悬浮底栏：内容从它后面穿过，大胶囊高斯模糊，
            // 选中项的小胶囊带弹性滑动动画。
            AnimatedVisibility(
                visible = showBottom,
                modifier = Modifier.align(Alignment.BottomCenter),
                enter = slideInVertically(spring(dampingRatio = Spring.DampingRatioMediumBouncy)) { it } + fadeIn(),
                exit = slideOutVertically(spring(stiffness = Spring.StiffnessMediumLow)) { it } + fadeOut(),
            ) {
                FloatingNavBar(nav, route, hazeState)
            }

            ApprovalOverlay(repo)
        }
    }
}

@Composable
private fun FloatingNavBar(nav: NavHostController, route: String?, hazeState: HazeState) {
    val selectedIndex = tabs.indexOfFirst { it.route == route }.coerceAtLeast(0)

    val barColor = MaterialTheme.colorScheme.surfaceContainer
    Box(Modifier.fillMaxWidth().padding(horizontal = 16.dp).navigationBarsPadding().padding(bottom = 10.dp)) {
        Surface(
            shape = RoundedCornerShape(50),
            color = Color.Transparent,
            shadowElevation = 6.dp,
            modifier = Modifier
                .fillMaxWidth()
                .hazeEffect(hazeState) {
                    style = HazeStyle(
                        backgroundColor = barColor,
                        tints = listOf(HazeTint(barColor.copy(alpha = 0.72f))),
                        blurRadius = 24.dp,
                        noiseFactor = 0f,
                    )
                },
        ) {
            BoxWithIndicator(selectedIndex, route, nav)
        }
    }
}

@Composable
private fun BoxWithIndicator(selectedIndex: Int, route: String?, nav: NavHostController) {
    val itemHeight = 58.dp
    BoxWithConstraints(Modifier.fillMaxWidth().padding(horizontal = 10.dp, vertical = 6.dp)) {
        val itemWidth = maxWidth / tabs.size
        // 小胶囊的滑动：弹性动画驱动 x 偏移
        val indicatorX by animateDpAsState(
            targetValue = itemWidth * selectedIndex,
            animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy, stiffness = Spring.StiffnessMediumLow),
            label = "pillX",
        )

        Box(Modifier.fillMaxWidth()) {
            // 小胶囊指示器（画在图标/文字下层）
            Box(
                Modifier
                    .align(Alignment.TopStart)
                    .offset(x = indicatorX)
                    .width(itemWidth)
                    .height(itemHeight)
                    .clip(RoundedCornerShape(50))
                    .background(MaterialTheme.colorScheme.primaryContainer),
            )
            Row(Modifier.fillMaxWidth()) {
                tabs.forEach { tab ->
                    val selected = route == tab.route
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center,
                        modifier = Modifier
                            .width(itemWidth)
                            .height(itemHeight)
                            .clip(RoundedCornerShape(50))
                            .clickable(
                                interactionSource = remember { MutableInteractionSource() },
                                indication = null,
                            ) {
                                nav.navigate(tab.route) {
                                    popUpTo(nav.graph.findStartDestination().id) { saveState = true }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            },
                    ) {
                        // 图标的小弹跳：选中时缩放一下
                        val scale by animateFloatAsState(
                            targetValue = if (selected) 1.15f else 1f,
                            animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy),
                            label = "iconScale",
                        )
                        Icon(
                            tab.icon,
                            contentDescription = tab.label,
                            tint = if (selected) MaterialTheme.colorScheme.onPrimaryContainer
                            else MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.scale(scale),
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

fun NavHostController.go(route: String) = navigate(route)
