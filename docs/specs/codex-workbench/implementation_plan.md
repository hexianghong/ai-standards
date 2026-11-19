# 工作台接入 Codex
- [Added] 工作台设置提供 Codex CLI 路由，复用本机登录与工作区上下文。
- [Added] 将 CLI 的最终消息事件适配为工作台现有 SSE 协议，处理退出、超时和浏览器取消。
- [Modified] Codex 对话使用只读沙箱，限制来自其他网页的调用，保留 Gemini 和 Antigravity 的原有路径。
