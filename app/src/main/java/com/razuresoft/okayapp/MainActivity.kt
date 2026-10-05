package com.razuresoft.okayapp

import android.app.Activity
import android.app.Application
import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.CompositionLocalProvider
import androidx.lifecycle.lifecycleScope
import com.razuresoft.okayapp.data.AppRepo
import com.razuresoft.okayapp.data.Notifier
import com.razuresoft.okayapp.data.parsePairing
import com.razuresoft.okayapp.ui.AppRoot
import com.razuresoft.okayapp.ui.LocalRepo
import com.razuresoft.okayapp.ui.theme.OkayTheme
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    private lateinit var repo: AppRepo

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        repo = AppRepo(applicationContext)
        Notifier.ensureChannel(this)
        registerForegroundTracking()
        requestNotificationPermission()
        handlePairingIntent(intent)
        setContent {
            CompositionLocalProvider(LocalRepo provides repo) {
                OkayTheme { AppRoot() }
            }
        }
    }

    /**
     * 维护 repo.inForeground：只有应用退到后台时才发系统通知，前台交给聊天页
     * 的气泡，避免同一条消息既弹通知又出现在屏幕上。
     */
    private fun registerForegroundTracking() {
        application.registerActivityLifecycleCallbacks(
            object : Application.ActivityLifecycleCallbacks {
                override fun onActivityStarted(activity: Activity) {
                    if (activity === this@MainActivity) repo.inForeground = true
                }

                override fun onActivityStopped(activity: Activity) {
                    if (activity === this@MainActivity) repo.inForeground = false
                }

                override fun onActivityCreated(activity: Activity, savedInstanceState: Bundle?) {}
                override fun onActivityResumed(activity: Activity) {}
                override fun onActivityPaused(activity: Activity) {}
                override fun onActivitySaveInstanceState(activity: Activity, outState: Bundle) {}
                override fun onActivityDestroyed(activity: Activity) {}
            },
        )
    }

    /** Android 13+ 通知权限：主动消息到达时允许系统通知。 */
    private fun requestNotificationPermission() {
        if (android.os.Build.VERSION.SDK_INT >= 33 &&
            checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS) !=
            android.content.pm.PackageManager.PERMISSION_GRANTED
        ) {
            requestPermissions(arrayOf(android.Manifest.permission.POST_NOTIFICATIONS), 1001)
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handlePairingIntent(intent)
    }

    /** 0kay://pair?url=...&token=...&pin=... 扫码/深链配对 */
    private fun handlePairingIntent(intent: Intent?) {
        val text = intent?.dataString ?: return
        val cfg = parsePairing(text) ?: return
        lifecycleScope.launch {
            // connect() 持久化并立即生效（DataStore 的发射是异步的）。
            repo.connect(cfg)
        }
    }
}
