package com.razuresoft.okayapp.ui.theme

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.ExperimentalMaterial3ExpressiveApi
import androidx.compose.material3.MaterialExpressiveTheme
import androidx.compose.material3.MotionScheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

val Bg = Color(0xFF0B1020)
val BgAlt = Color(0xFF0E1530)
val CardC = Color(0xFF141B36)
val CardAlt = Color(0xFF1A2344)
val BorderC = Color(0xFF243056)
val TextMain = Color(0xFFE8ECFF)
val TextDim = Color(0xFF9AA4C7)
val TextFaint = Color(0xFF6B76A0)
val Primary = Color(0xFFC7BFFF)
val PrimaryContainer = Color(0xFF4A3AA8)
val Success = Color(0xFF7FD9A8)
val Warn = Color(0xFFFFB454)
val Danger = Color(0xFFFF5C5C)
val UserBubble = Color(0xFF24406F)
val Accent = Color(0xFFFFB0C8)

/** M3 Expressive 的形状体系：整体比默认 Material 圆润一到两档。 */
private val expressiveShapes = Shapes(
    extraSmall = RoundedCornerShape(8.dp),
    small = RoundedCornerShape(14.dp),
    medium = RoundedCornerShape(20.dp),
    large = RoundedCornerShape(28.dp),
    extraLarge = RoundedCornerShape(36.dp),
)

private val okayColors = darkColorScheme(
    primary = Primary,
    onPrimary = Color(0xFF241B55),
    primaryContainer = PrimaryContainer,
    onPrimaryContainer = Color(0xFFE5DEFF),
    secondary = Accent,
    onSecondary = Color(0xFF5C1033),
    secondaryContainer = Color(0xFF7B2B57),
    onSecondaryContainer = Color(0xFFFFD9E6),
    tertiary = Color(0xFF8AD9C0),
    onTertiary = Color(0xFF00382C),
    tertiaryContainer = Color(0xFF1F5B4B),
    onTertiaryContainer = Color(0xFFA8F5DE),
    background = Bg,
    onBackground = TextMain,
    surface = CardC,
    onSurface = TextMain,
    surfaceVariant = CardAlt,
    onSurfaceVariant = TextDim,
    surfaceContainerLowest = Bg,
    surfaceContainerLow = BgAlt,
    surfaceContainer = CardC,
    surfaceContainerHigh = CardAlt,
    surfaceContainerHighest = Color(0xFF223058),
    outline = BorderC,
    outlineVariant = BorderC,
    error = Danger,
    onError = Color.White,
    errorContainer = Color(0xFF4A1F1F),
    onErrorContainer = Color(0xFFFFD9D9),
    inverseSurface = CardAlt,
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
