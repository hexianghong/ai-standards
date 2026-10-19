# 📋 AI 交互错误反馈与全局优化看板 (FEEDBACK_KANBAN.md)

> [!NOTE]
> 本看板用于统一汇总所有业务项目在 AI 辅助交互过程中捕获的错误、失败、偏离规约或产生幻觉的真实案例。
> **目标**：以真实的踩坑现场为导向，由开发者与 AI 协同分析根因，持续对全局规约 (`core-rules`)、技术栈规范 (`stack-templates`)、Agent 技能 (`.agents/skills`) 进行防御性重构与版本演进，实现全局 AI 研发能力的自我进化。

---

## 📊 状态看板 (Status Overview)

| 编号 | 发生时间 | 来源项目 | 错误分类 | 案例摘要 | 当前状态 | 优化方案索引/关联文件 |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| *示例-001* | *2026-10-19* | *cloud-agent* | *代码逻辑缺陷* | *Go 并发消费丢失 context 导致无法优雅退出* | `已优化落地` | *更新 `stack-templates/skills/backend-go/SKILL.md`* |

---

## 🗂️ 待评估与方案制定中 (Inbox & Planning)
> *新收集的 Case 统一落盘至 `feedback/inbox/` 目录。在 `ai-standards` 工作区中，您可以随时唤醒 AI 针对未闭环的 Case 进行根因剖析与方案制定。*

*(当前待办池为空，等待新案例沉淀)*

---

## ✅ 已优化落地与归档 (Closed & Archived)
> *已制定并完成规约/技能修订、且在多项目生效的 Case 将移动至 `feedback/archive/`。*

*(暂无归档记录)*

---

## 🔄 闭环流转标准 (SOP)
1. **收集与落盘 (Capture)**：其他项目通过 AI 会话指令（“反馈这个问题”/主动提议）将结构化报告落盘至 `ai-standards/feedback/inbox/YYYY-MM-DD_<project>_<slug>.md`。
2. **根因分类 (Root Cause)**：判断是规则漏洞、技能缺失、Prompt 模糊还是工具拦截缺位。
3. **制定优化方案 (Action Plan)**：在 `ai-standards` 编写具体的规约修订草案。
4. **落地修改 (Implementation)**：修改 `core-rules/`、`stack-templates/` 或 `.agents/skills/`。
5. **归档与同步 (Archive & Sync)**：将报告移至 `feedback/archive/`，更新看板状态；所有基于软链接的项目即时具备该最新防线。
