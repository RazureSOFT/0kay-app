package com.razuresoft.okayapp.ui.theme

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.ExperimentalMaterial3ExpressiveApi
import androidx.compose.material3.MaterialExpressiveTheme
import androidx.compose.material3.MotionScheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

// 与 WebUI styles/theme.css 的 --md-* 令牌一一对应（浅色 Expressive 调）。
val Bg = Color(0xFFFBF8FF)          // --md-surface
val BgAlt = Color(0xFFF5F1FA)       // --md-surface-container-low
val CardC = Color(0xFFEEE9F5)       // --md-surface-container
val CardAlt = Color(0xFFE8E1F1)     // --md-surface-container-high
val BorderC = Color(0xFFDAD2E4)     // --md-outline-variant 附近
val TextMain = Color(0xFF211D2A)    // --md-on-surface
val TextDim = Color(0xFF60596D)     // --md-on-surface-variant
// Faint is used for the smallest labels, so it must still clear WCAG AA on Bg;
// the previous #8B8497 sat at ~3.4:1 and was effectively unreadable.
val TextFaint = Color(0xFF6E677C)
val Primary = Color(0xFF5944C6)     // --md-primary
val PrimaryContainer = Color(0xFFE6DEFF) // --md-primary-container
val Success = Color(0xFF1F7A4D)
val Warn = Color(0xFF9A6A00)
val Danger = Color(0xFFB3261E)
val UserBubble = Color(0xFFE6DEFF)  // 用户气泡用 primary-container
val Accent = Color(0xFF9B405E)      // --md-tertiary

/**
 * 悬浮底栏的总高度（胶囊 58dp + 上下留白）。Tab 页的内容底部留白统一用它，
 * 避免各屏散落 84/96dp 的魔法值。
 */
val BottomBarInset = 88.dp

/** M3 Expressive 的形状体系：整体比默认 Material 圆润一到两档。 */
private val expressiveShapes = Shapes(
    extraSmall = RoundedCornerShape(8.dp),
    small = RoundedCornerShape(14.dp),
    medium = RoundedCornerShape(20.dp),
    large = RoundedCornerShape(28.dp),
    extraLarge = RoundedCornerShape(36.dp),
)

private val okayColors = lightColorScheme(
    primary = Primary,
    onPrimary = Color(0xFFFFFFFF),
    primaryContainer = PrimaryContainer,
    onPrimaryContainer = Color(0xFF28105F),
    secondary = Color(0xFF536255),
    onSecondary = Color(0xFFFFFFFF),
    secondaryContainer = Color(0xFFD9EADB),
    onSecondaryContainer = Color(0xFF142C20),
    tertiary = Accent,
    onTertiary = Color(0xFFFFFFFF),
    tertiaryContainer = Color(0xFFFFDAE3),
    onTertiaryContainer = Color(0xFF3E001D),
    background = Bg,
    onBackground = TextMain,
    surface = CardC,
    onSurface = TextMain,
    surfaceVariant = CardAlt,
    onSurfaceVariant = TextDim,
    surfaceContainerLowest = Color(0xFFFFFFFF),
    surfaceContainerLow = BgAlt,
    surfaceContainer = CardC,
    surfaceContainerHigh = CardAlt,
    surfaceContainerHighest = Color(0xFFE0D9E9),
    outline = Color(0xFF7C7589),
    outlineVariant = BorderC,
    error = Danger,
    onError = Color(0xFFFFFFFF),
    errorContainer = Color(0xFFFFDAD6),
    onErrorContainer = Color(0xFF410002),
    inverseSurface = Color(0xFF36303F),
    inverseOnSurface = Color(0xFFF4EEF7),
)

@OptIn(ExperimentalMaterial3ExpressiveApi::class)
@Composable
fun OkayTheme(content: @Composable () -> Unit) {
    MaterialExpressiveTheme(
        colorScheme = okayColors,
        motionScheme = MotionScheme.expressive(),
        shapes = expressiveShapes,
        content = content,
    )
}
