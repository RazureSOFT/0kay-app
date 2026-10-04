# 0KAY App (Android, native Compose)

原生 Jetpack Compose 的 0KAY Android 客户端，替代早期 Expo 版本。

- 连接自托管 0KAY Core（Token / PIN / `0kay://pair` 扫码配对）
- 聊天：SSE 流式、图片/附件、THINK 思考摘要、情绪徽章、主动通知
- Live2D 形象（WebView + Pixi，Cubism 2/4；模型由 Core 的 `/api/live2d` 托管）
- 状态、任务、Agent 审批/提问收件箱
- 供应商与模型（探测）、动态设置分区、插件、记忆、技能、通知、用量

## 构建

```
gradle assembleRelease
```

CI：`.github/workflows/android.yml` 在 push 到 main 时自动构建并发布到 Release（调试签名，可直接侧载）。
