# Gemini Web Chat (Antigravity Simple Browser 专用效能工作台)

专为 **Google DeepMind Antigravity IDE Simple Browser** 量身定制的轻量级“研发效能与敏捷一体化工作台”。

---

## 核心设计特性

1. **零外部 npm 依赖（Zero Dependencies）**：
   - 全服务仅使用 Node.js 原生内置模块（`http`, `https`, `tls`, `net`, `fs`, `os`, `path`），无需安装任何 `node_modules`，即开即用。
   - 内置自研 `.env` 解析器与 HTTP CONNECT 正向代理隧道，国内网络环境无障碍直连 Google Gemini API。
2. **多项目即插即用（Workspace-Aware）**：
   - 物理存放于全局规约仓库 `.agents/gemini-web-chat`。
   - 通过 `./automation-tools/init-project.sh` 一键软链接至各业务微服务项目，自动动态向上识别当前项目的工作区根目录 (`WORKSPACE_ROOT`)。
3. **研发资产持久化（Document Persistence）**：
   - 支持将对话纪要、技术备忘与规格方案持久化至项目的 `docs/` 或 `doc/` 目录下。
   - 当敏捷看板任务流转至「闭环完成 (done)」时，系统在后台自动静默落地任务完成归档文档 (`docs/completed/*-completion-record.md`)。
4. **全生命周期敏捷看板（Agile Kanban）**：
   - 提供从 Backlog 需求池、方案设计、敏捷开发、质量验证、远程发布到闭环完成的 6 阶段可视化看板。
   - 支持自动生成规格方案 (`implementation_plan.md`) 与归档任务折叠过滤。
5. **系统健康巡检引擎（Inspection & Diagnosis）**：
   - 实时采集 Node.js 事件循环延迟、系统内存与 CPU 负载，提供健康度评分与周期性快照。

---

## 快速启动

在任意项目根目录执行：

```bash
node .agents/gemini-web-chat/server.js
```

或者使用兼容路径：

```bash
node automation-tools/gemini-web-chat/server.js
```

服务启动后，在 Antigravity IDE 右侧或使用内置浏览器打开：
👉 **http://127.0.0.1:3000**
