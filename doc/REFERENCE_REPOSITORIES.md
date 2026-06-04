# 优秀开源项目学习记录 (Reference Repositories)

此文档用于记录那些曾被用作 `ai-standards` 建设灵感来源的优秀外部开源项目。AI 智能体应将此作为知识源，定期重新访问这些仓库，以吸收开源社区最新的 AI 编程规范与工作流进展。

## 已学习项目列表

### 1. [microwind/ai-skills](https://github.com/microwind/ai-skills)
- **学习时间**: 2026-05-29
- **项目亮点**: 提供了一个极佳的、高度解耦的 AI Skills 插件树物理结构。包含了 100 多个分类清晰的后端、前端、DevOps 等编程技能，并为每个技能附带了标准的 AI 提示词和代码示例。
- **在我们项目中的落地成果**: 启发我们将原本单体大文件的 `stack-templates` 拆分、重构为了带有 YAML 头信息的模块化 `skills/` 目录体系，使其完美适配了 Antigravity 等智能体的按需加载插件机制。

### 2. [PatrickJS/awesome-cursorrules](https://github.com/PatrickJS/awesome-cursorrules)
- **学习时间**: 2026-05-28
- **项目亮点**: 社区中最大的按需加载（`.mdc`）模块化 AI 规则库。
- **在我们项目中的落地成果**: 启发了我们为 Cursor 适配并创建 `.cursor/rules/*.mdc` 的模块化目录结构。

### 3. [southwestmogrown/ai-workflow-toolkit](https://github.com/southwestmogrown/ai-workflow-toolkit)
- **学习时间**: 2026-05-28
- **项目亮点**: 提供了强大且独立的任务拆解 Markdown 文件以及严格的 TDD 验证协议。
- **在我们项目中的落地成果**: 直接促使我们将“基于 Markdown 的任务拆解清单（如 `task.md`）”和“严格的 TDD 微循环”作为核心指令写入了我们的全局规则。

### 4. [GitYCC/TempDD](https://github.com/GitYCC/TempDD)
- **学习时间**: 2026-05-28
- **项目亮点**: “模板驱动开发”（Template-Driven Development）框架的倡导者。
- **在我们项目中的落地成果**: 确立了 AI 编写代码前必须先生成或遵循标准架构模板（如 Repository Map）的核心规约。

### 5. [cline/clinerules](https://github.com/cline/clinerules)
- **学习时间**: 2026-05-28
- **项目亮点**: 为 Cline 等全自动智能体提供了自我纠错和指令持久化的典范。
- **在我们项目中的落地成果**: 启发了我们建立“长效错题本”（`LEARNING.md`）机制，让 AI 具备自我进化的能力。

---
*注：当用户要求 AI 学习新的开源项目并提取规范时，AI 必须主动更新此文档。*
