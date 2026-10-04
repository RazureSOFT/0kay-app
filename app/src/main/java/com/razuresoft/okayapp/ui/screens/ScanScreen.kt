package com.razuresoft.okayapp.ui.screens

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.provider.Settings
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.navigation.NavHostController
import com.journeyapps.barcodescanner.ScanContract
import com.journeyapps.barcodescanner.ScanOptions
import com.razuresoft.okayapp.data.parsePairing
import com.razuresoft.okayapp.ui.LocalRepo
import com.razuresoft.okayapp.ui.Routes
import com.razuresoft.okayapp.ui.components.ErrorBox
import com.razuresoft.okayapp.ui.components.Loading
import com.razuresoft.okayapp.ui.components.PrimaryButton
import com.razuresoft.okayapp.ui.components.ScreenScaffold
import com.razuresoft.okayapp.ui.components.TonalButton
import com.razuresoft.okayapp.ui.theme.TextDim
import kotlinx.coroutines.launch

/** 扫码连接：先申请相机权限（含拒绝后的说明与跳系统设置），再打开扫码。 */
@Composable
fun ScanScreen(nav: NavHostController) {
    val repo = LocalRepo.current
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    var status by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }
    var cameraGranted by remember {
        mutableStateOf(
            ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) ==
                PackageManager.PERMISSION_GRANTED
        )
    }
    var deniedBefore by remember { mutableStateOf(false) }
    var openScanner by remember { mutableStateOf(false) }

    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission(),
    ) { granted ->
        cameraGranted = granted
        if (granted) {
            deniedBefore = false
            openScanner = true
        } else {
            deniedBefore = true
        }
    }

    val launcher = rememberLauncherForActivityResult(ScanContract()) { result ->
        val contents = result.contents
        if (contents.isNullOrBlank()) {
            status = "已取消，可返回手动输入"
            openScanner = false
            return@rememberLauncherForActivityResult
        }
        val cfg = parsePairing(contents)
        if (cfg == null) {
            error = "无法识别的二维码"
            openScanner = false
            return@rememberLauncherForActivityResult
        }
        scope.launch {
            status = "正在连接并保存…"
            error = null
            try {
                repo.store.save(cfg.baseUrl, cfg.token, cfg.pin)
                repo.api.config = cfg
                repo.api.get("/health")
                status = "连接成功，已记住该服务器"
                nav.navigate(Routes.Chat) { popUpTo(0) }
            } catch (e: Exception) {
                error = e.message
                status = "连接失败"
                openScanner = false
            }
        }
    }

    LaunchedEffect(cameraGranted, openScanner) {
        if (cameraGranted && openScanner) {
            launcher.launch(
                ScanOptions().apply {
                    setDesiredBarcodeFormats(ScanOptions.QR_CODE)
                    setPrompt("扫描 0KAY 连接二维码")
                    setBeepEnabled(false)
                    setOrientationLocked(false)
                    setBarcodeImageEnabled(false)
                },
            )
        }
    }

    // 进入页面即触发权限弹窗
    LaunchedEffect(Unit) {
        if (cameraGranted) openScanner = true
        else permissionLauncher.launch(Manifest.permission.CAMERA)
    }

    ScreenScaffold(title = "扫码连接", subtitle = "对准电脑 WebUI 的「连接」二维码", onBack = { nav.popBackStack() }) { padding ->
        Column(Modifier.padding(padding).padding(20.dp)) {
            if (cameraGranted) {
                Loading(status.ifEmpty { "正在打开相机…" })
            } else {
                Text("需要相机权限", style = MaterialTheme.typography.titleMedium)
                Spacer(Modifier.height(6.dp))
                Text(
                    "扫描连接二维码需要使用相机。二维码只包含服务器地址与配对信息，不会上传给任何第三方。",
                    color = TextDim,
                )
                Spacer(Modifier.height(12.dp))
                if (deniedBefore) {
                    // 已经拒绝过：这次系统弹窗可能不再出现，给两个出路
                    TonalButton("去系统设置开启相机", {
                        context.startActivity(
                            Intent(
                                Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
                                Uri.parse("package:" + context.packageName),
                            ),
                        )
                    })
                    Spacer(Modifier.height(8.dp))
                    PrimaryButton("重新申请权限", { permissionLauncher.launch(Manifest.permission.CAMERA) })
                } else {
                    PrimaryButton("允许使用相机", { permissionLauncher.launch(Manifest.permission.CAMERA) })
                }
            }
            Spacer(Modifier.height(10.dp))
            ErrorBox(error)
            Spacer(Modifier.height(10.dp))
            Text("扫描后会自动保存连接信息，下次打开直接使用。", color = TextDim)
        }
    }
}
