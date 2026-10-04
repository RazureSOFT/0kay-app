package com.razuresoft.okayapp.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.text.selection.SelectionContainer
import androidx.compose.material3.AnimatedVisibility
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExperimentalMaterial3ExpressiveApi
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearWavyProgressIndicator
import androidx.compose.material3.LoadingIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.MediumFlexibleTopAppBar
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.razuresoft.okayapp.ui.theme.Accent
import com.razuresoft.okayapp.ui.theme.BorderC
import com.razuresoft.okayapp.ui.theme.Danger
import com.razuresoft.okayapp.ui.theme.Primary
import com.razuresoft.okayapp.ui.theme.TextDim
import com.razuresoft.okayapp.ui.theme.TextFaint
import com.razuresoft.okayapp.ui.theme.TextMain

@OptIn(ExperimentalMaterial3Api::class, ExperimentalMaterial3ExpressiveApi::class)
@Composable
fun ScreenScaffold(
    title: String,
    subtitle: String? = null,
    onBack: (() -> Unit)? = null,
    actions: @Composable RowScope.() -> Unit = {},
    content: @Composable (PaddingValues) -> Unit,
) {
    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        topBar = {
            MediumFlexibleTopAppBar(
                title = {
                    Column {
                        Text(title, fontWeight = FontWeight.Bold)
                        if (!subtitle.isNullOrBlank()) {
                            Text(subtitle, color = TextDim, style = MaterialTheme.typography.labelSmall, maxLines = 1)
                        }
                    }
                },
                navigationIcon = {
                    if (onBack != null) {
                        IconButton(onClick = onBack) {
                            Icon(
                                androidx.compose.material.icons.Icons.AutoMirrored.Outlined.ArrowBack,
                                contentDescription = "返回",
                                tint = TextMain,
                            )
                        }
                    }
                },
                actions = actions,
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background,
                    titleContentColor = TextMain,
                ),
            )
        },
        content = content,
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CardBox(
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null,
    content: @Composable ColumnScope.() -> Unit,
) {
    Card(
        onClick = onClick ?: {},
        enabled = onClick != null,
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 14.dp, vertical = 6.dp),
        shape = MaterialTheme.shapes.large,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
    ) {
        Column(Modifier.padding(16.dp), content = content)
    }
}

@Composable
fun SectionTitle(text: String) {
    Text(
        text,
        color = TextDim,
        fontWeight = FontWeight.Bold,
        style = MaterialTheme.typography.labelLarge,
        modifier = Modifier.padding(start = 18.dp, top = 14.dp, bottom = 6.dp),
    )
}

@OptIn(ExperimentalMaterial3ExpressiveApi::class)
@Composable
fun PrimaryButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    loading: Boolean = false,
) {
    Button(
        onClick = onClick,
        enabled = enabled && !loading,
        modifier = modifier,
        shape = MaterialTheme.shapes.medium,
        colors = ButtonDefaults.buttonColors(containerColor = Primary),
    ) {
        if (loading) {
            LoadingIndicator(Modifier.size(20.dp), color = Color.White)
        } else {
            Text(text, fontWeight = FontWeight.SemiBold)
        }
    }
}

@Composable
fun TonalButton(text: String, onClick: () -> Unit, modifier: Modifier = Modifier) {
    FilledTonalButton(onClick = onClick, modifier = modifier, shape = MaterialTheme.shapes.medium) {
        Text(text)
    }
}

@Composable
fun DangerTextButton(text: String, onClick: () -> Unit) {
    TextButton(onClick = onClick) { Text(text, color = Danger) }
}

@Composable
fun AppTextField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    placeholder: String? = null,
    singleLine: Boolean = true,
    password: Boolean = false,
    numeric: Boolean = false,
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        label = { Text(label) },
        placeholder = placeholder?.let { { Text(it, color = TextFaint) } },
        modifier = modifier.fillMaxWidth(),
        singleLine = singleLine,
        shape = MaterialTheme.shapes.medium,
        visualTransformation = if (password) PasswordVisualTransformation() else VisualTransformation.None,
        keyboardOptions = KeyboardOptions(
            keyboardType = when {
                numeric -> KeyboardType.Number
                password -> KeyboardType.Password
                else -> KeyboardType.Text
            },
        ),
    )
}

@Composable
fun RowItem(
    title: String,
    subtitle: String? = null,
    value: String? = null,
    onClick: (() -> Unit)? = null,
    trailing: @Composable (() -> Unit)? = null,
) {
    Row(
        Modifier
            .fillMaxWidth()
            .then(if (onClick != null) Modifier.clickable { onClick() } else Modifier)
            .padding(horizontal = 14.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(Modifier.fillMaxWidth(0.62f)) {
            Text(title, color = TextMain)
            if (!subtitle.isNullOrBlank()) {
                Text(subtitle, color = TextFaint, style = MaterialTheme.typography.labelSmall)
            }
        }
        Spacer(Modifier.weight(1f))
        if (value != null) {
            Text(value, color = TextDim, style = MaterialTheme.typography.bodySmall, maxLines = 1)
        }
        trailing?.invoke()
    }
}

@Composable
fun Badge(text: String, color: Color = Primary) {
    Box(
        Modifier
            .clip(MaterialTheme.shapes.small)
            .background(color.copy(alpha = 0.2f))
            .border(1.dp, color, MaterialTheme.shapes.small)
            .padding(horizontal = 8.dp, vertical = 2.dp),
    ) {
        Text(text, color = color, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold)
    }
}

@OptIn(ExperimentalMaterial3ExpressiveApi::class)
@Composable
fun Loading(label: String? = null) {
    Column(
        Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        LoadingIndicator(color = Primary)
        if (label != null) {
            Spacer(Modifier.height(12.dp))
            Text(label, color = TextDim)
        }
    }
}

/** 不定长波浪进度条（Expressive）。progress 传 null 时为不定态流动。 */
@OptIn(ExperimentalMaterial3ExpressiveApi::class)
@Composable
fun WavyBar(progress: Float?, modifier: Modifier = Modifier, color: Color = Primary) {
    if (progress == null) {
        LinearWavyProgressIndicator(modifier = modifier, color = color)
    } else {
        LinearWavyProgressIndicator(progress = { progress.coerceIn(0f, 1f) }, modifier = modifier, color = color)
    }
}

@Composable
fun ErrorBox(message: String?, onRetry: (() -> Unit)? = null) {
    AnimatedVisibility(visible = !message.isNullOrBlank()) {
        Column(
            Modifier
                .fillMaxWidth()
                .padding(14.dp)
                .clip(MaterialTheme.shapes.medium)
                .background(Danger.copy(alpha = 0.15f))
                .border(1.dp, Danger, MaterialTheme.shapes.medium)
                .padding(12.dp),
        ) {
            Text(message.orEmpty(), color = TextMain)
            if (onRetry != null) {
                Spacer(Modifier.height(8.dp))
                TonalButton("重试", onRetry)
            }
        }
    }
}

@Composable
fun EmptyBox(text: String) {
    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Text(text, color = TextFaint)
    }
}

@Composable
fun DividerLine() {
    Box(
        Modifier
            .fillMaxWidth()
            .height(1.dp)
            .background(BorderC),
    )
}

// ---- Markdown 轻量渲染 ----------------------------------------------------

/**
 * 聊天用的轻量 Markdown：代码块/行内代码/加粗/斜体/删除线/链接/无序列表/标题。
 */
@Composable
fun MarkdownText(markdown: String, modifier: Modifier = Modifier) {
    Column(modifier) {
        val lines = markdown.split("\n")
        var i = 0
        while (i < lines.size) {
            val line = lines[i]
            when {
                line.trimStart().startsWith("```") -> {
                    val lang = line.trimStart().removePrefix("```").trim()
                    val buf = StringBuilder()
                    i++
                    while (i < lines.size && !lines[i].trimStart().startsWith("```")) {
                        buf.appendLine(lines[i]); i++
                    }
                    i++ // 收尾围栏
                    Column(
                        Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp)
                            .clip(MaterialTheme.shapes.small)
                            .background(Color(0xFF0A0F22))
                            .border(1.dp, BorderC, MaterialTheme.shapes.small)
                            .padding(10.dp),
                    ) {
                        if (lang.isNotEmpty()) {
                            Text(lang, color = Accent, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                        }
                        Text(
                            buf.toString().trimEnd(),
                            color = TextMain,
                            fontFamily = FontFamily.Monospace,
                            fontSize = 12.sp,
                        )
                    }
                }
                line.startsWith("#") -> {
                    val level = line.takeWhile { it == '#' }.length
                    Text(
                        inlineMd(line.dropWhile { it == '#' }.trim()),
                        fontWeight = FontWeight.Bold,
                        fontSize = when (level) {
                            1 -> 20.sp
                            2 -> 18.sp
                            else -> 16.sp
                        },
                        modifier = Modifier.padding(top = 6.dp, bottom = 2.dp),
                    )
                }
                line.trimStart().startsWith("- ") || line.trimStart().startsWith("* ") -> {
                    Row(Modifier.padding(start = 6.dp, top = 1.dp)) {
                        Text("•  ", color = Primary)
                        Text(inlineMd(line.trimStart().drop(2)))
                    }
                }
                else -> if (line.isNotBlank()) Text(inlineMd(line)) else Spacer(Modifier.height(4.dp))
            }
            i++
        }
    }
}

private val BOLD_RE = Regex("\\*\\*(.+?)\\*\\*")
private val ITALIC_RE = Regex("(?<!\\*)\\*([^*]+)\\*(?!\\*)")
private val CODE_RE = Regex("`([^`]+)`")
private val STRIKE_RE = Regex("~~(.+?)~~")
private val LINK_RE = Regex("\\[([^]]+)]\\(([^)]+)\\)")

private fun inlineMd(text: String): AnnotatedString = buildAnnotatedString {
    var rest = text
    val patterns = listOf(CODE_RE, LINK_RE, BOLD_RE, STRIKE_RE, ITALIC_RE)
    while (rest.isNotEmpty()) {
        var bestStart = -1
        var bestMatch: MatchResult? = null
        var bestKind = -1
        patterns.forEachIndexed { kind, re ->
            val m = re.find(rest)
            if (m != null && (bestStart == -1 || m.range.first < bestStart)) {
                bestStart = m.range.first; bestMatch = m; bestKind = kind
            }
        }
        val match = bestMatch
        if (match == null) {
            append(rest)
            break
        }
        if (match.range.first > 0) append(rest.substring(0, match.range.first))
        when (bestKind) {
            0 -> { // 行内代码
                pushStyle(SpanStyle(fontFamily = FontFamily.Monospace, background = Color(0xFF0A0F22), color = Accent, fontSize = 13.sp))
                append(match.groupValues[1]); pop()
            }
            1 -> { // 链接
                pushStyle(SpanStyle(color = Primary, textDecoration = TextDecoration.Underline))
                append(match.groupValues[1]); pop()
            }
            2 -> { pushStyle(SpanStyle(fontWeight = FontWeight.Bold)); append(match.groupValues[1]); pop() }
            3 -> { pushStyle(SpanStyle(textDecoration = TextDecoration.LineThrough)); append(match.groupValues[1]); pop() }
            4 -> {
                pushStyle(SpanStyle(fontStyle = androidx.compose.ui.text.font.FontStyle.Italic))
                append(match.groupValues[1]); pop()
            }
        }
        rest = rest.substring(match.range.last + 1)
    }
}
