# 0KAY App (Android)

基于 **0KAY Core HTTP API**（见 [docs/HTTP_API.md](https://github.com/RazureSOFT/0KAY/blob/main/docs/HTTP_API.md)）的 React Native (Expo) 手机客户端，尽量对齐 WebUI 的能力。

## 功能

- **聊天**：`POST /api/life/chat` SSE 流式对话，展示情绪、思考摘要、附件（图片/文件）。
- **状态**：`/api/state` 轮询（情绪轴、精神能量、在线 Agent、插件健康）、权限开关。
- **任务与会话**：`/api/tasks`、`/api/agent/sessions`，会话内 Agent 对话、取消任务、审批与提问。
- **模型供应商**：`/api/providers` 增删改、获取模型列表、默认模型与模型开关、协议格式（OpenAI / Anthropic）。
- **设置**：动态设置段 `/api/settings/sections`，按字段类型渲染（bool/number/text/select/model/models/test）。
- **插件**：`/api/plugins` 启停、`0kay-pm` 已安装组件与卸载、更新检查。
- **记忆 / 技能 / 通知 / 用量 / 伙伴快照 / 权限**：对应 LIFE 与 Agent 的相关路由。

## 连接 Core

1. 在主机上让 Core 监听局域网：
   ```sh
   CORE_BIND_HOST=0.0.0.0
   CORE_TRUSTED_NETWORKS=192.168.0.0/16
   # 或设置 CORE_API_TOKEN 并在 App 里填写
   ```
2. 打开 App，填写 `http://<主机IP>:8080` 与 Token（或 PIN）。
3. 也可以使用「设备配对」：先在 App 请求，主机在 WebUI 配对页批准。

> 明文 HTTP 需要在 Android 上允许 cleartext（本项目已通过 `expo-build-properties` 开启）。若使用 LAN 模式的自签 TLS（`:8443`），需自行信任证书。

## 开发

```sh
npm install
npx expo start
```

## 构建 APK

推送到 `main` 或手动触发 `.github/workflows/android.yml`，构建产物里下载 `0kay-app-apk`。
APK 使用调试签名（`assembleRelease` + debug keystore），可直接侧载安装，不可上架应用商店。

本地构建（需 Android SDK / JDK 17）：

```sh
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease
```

## 说明

- 认证统一使用 `Authorization: Bearer <token>`；敏感操作会补发 `X-0kay-Pin`。
- 未实现 Live2D 渲染（RN 下需要 WebGL/WebView），其余平台能力已覆盖。
