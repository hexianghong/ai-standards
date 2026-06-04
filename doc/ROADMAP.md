# AI Standards 项目演进路线图与需求文档 (ROADMAP & REQUIREMENTS)

本文档系统性地记录了 `ai-standards` 项目的发展规划，特别是为了使其全面适应现代高级自治智能体（Autonomous Agents，如 Antigravity、SWE-agent、Aider 等）而引入的工作流需求。

## 🎯 当前迭代目标：Agentic Workflow Upgrade (v2.0)

为了将本项目从“静态的开发规范”升级为“支持动态自闭环的 AI 编程智能体生态”，特引入以下 5 大核心机制需求：

### 1. 模块化与按需规则加载体系 (Modular & Context-Aware Rules)
*   **需求描述**：摒弃单一的庞大 `.cursorrules` 或 `GEMINI_GLOBAL.md` 文件。根据不同的技术栈和项目结构，按需动态加载规则。
*   **Antigravity 适配方案**：
    *   在主入口 `GEMINI.md` 中以 Markdown 链接（`[rule](file://...)`）的形式建立目录索引。当开发触及特定领域时，Antigravity 可通过 `view_file` 工具按需阅读。
    *   探索将 `stack-templates` 转变为符合 Antigravity 插件格式的 `<skills>` 目录体系，通过 `SKILL.md` 的方式供智能体加载。
*   **Cursor 兼容方案**：支持生成 `.cursor/rules/*.mdc`，并使用 `globs` 语法自动激活。

### 2. TDD 作为 AI 约束通信协议 (TDD as an AI Protocol)
*   **需求描述**：AI 极易在实现需求时出现过度工程（Over-engineering）或幻觉。必须将测试驱动开发（TDD）作为硬性通信协议。
*   **工作流规范**：在写业务代码前，必须先定义失败的测试用例（Red）。AI 随后的代码修改必须以“写出恰好能让测试通过的最少代码”为绝对红线（Green）。通过后立即提交（Refactor）。

### 3. 知识地图与外科手术式编辑 (Repository Map & Surgical Editing)
*   **需求描述**：禁止 AI 在没有掌握全局上下文的情况下盲目修改文件，且禁止全文件重写。
*   **工作流规范**：
    *   **Repository Map**：任务规划阶段，强制使用搜索工具探测项目依赖图，明确上下游影响。
    *   **Surgical Editing**：代码修改必须是局部、精准的（针对特定函数或代码块），大幅降低大文件重写带来的破坏风险。

### 4. 感知-行动-验证大循环 (Perception-Action-Verification Loop)
*   **需求描述**：打破“写完所有代码最后再跑测试”的低效模式。
*   **工作流规范**：对于 `task.md` 上的每一个原子任务，AI 必须陷入一个微循环：`感知（读代码） -> 思考与规划 -> 行动（局部修改） -> 立即验证（跑 Linter/Test）`。失败则自我修正，成功再进入下一项。

### 5. 自我进化与错题本机制 (Self-Refining & Lessons Learned)
*   **需求描述**：赋予 AI 长期的项目记忆。如果在某个项目中犯了错（如格式、API 用法不符），不能在下一次对话中重复犯错。
*   **工作流规范**：创建 `LEARNING.md` 或在 `GEMINI.md` 中增加 `Lessons Learned` 板块。当 AI 被纠正时，必须主动将教训总结并写入该文件，作为后续对话的高优加载上下文。

---

## 📅 未来规划 (Future Backlog)
- *持续关注并整合前沿 Agentic 框架（如 OpenDevin、AutoGPT）的工作流最佳实践...*
- *重构 `automation-tools` 以更智能地识别客户端类型（Cursor / Cline / Antigravity）。*
