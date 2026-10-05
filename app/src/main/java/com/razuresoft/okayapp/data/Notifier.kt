package com.razuresoft.okayapp.data

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat

/**
 * 伙伴主动消息的系统通知。
 *
 * Android 13+ 需要 POST_NOTIFICATIONS（已在清单声明并在 MainActivity 申请）；
 * 用户拒绝时 [show] 静默返回，不影响应用内气泡。
 */
object Notifier {
    private const val CHANNEL_ID = "0kay_proactive"

    /** 幂等创建通知渠道（O 以下无需渠道）。 */
    fun ensureChannel(context: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val manager = context.getSystemService(NotificationManager::class.java) ?: return
        if (manager.getNotificationChannel(CHANNEL_ID) != null) return
        manager.createNotificationChannel(
            NotificationChannel(CHANNEL_ID, "伙伴主动消息", NotificationManager.IMPORTANCE_DEFAULT).apply {
                description = "L.I.F.E 主动发来的消息与提醒"
            },
        )
    }

    fun show(context: Context, id: Int, title: String, text: String) {
        if (text.isBlank()) return
        ensureChannel(context)
        val manager = NotificationManagerCompat.from(context)
        if (!manager.areNotificationsEnabled()) return
        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.stat_notify_chat)
            .setContentTitle(title)
            .setContentText(text)
            .setStyle(NotificationCompat.BigTextStyle().bigText(text))
            .setAutoCancel(true)
            .build()
        // 权限被拒时 notify() 会抛 SecurityException，这里静默降级。
        runCatching { manager.notify(id, notification) }
    }
}
