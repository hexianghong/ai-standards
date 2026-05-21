# Global AI Standards & Rules Library (ai-standards)

这是一个专为 AI 辅助开发（如 Cursor, Cline, GitHub Copilot 等 AI IDE）定制的全局开发规范与规则库。通过标准化指令、安全红线、技术栈模版以及协同工作流，帮助 AI 编写出符合企业级标准的高品质代码，并解决 AI 智能体上下文容易丢失的痛点。

---

## 📂 目录结构说明 (Directory Structure)

项目采用**双语分流设计**，以平衡“AI 对英文理解更精确”与“开发者对中文阅读更自然”的需求：

*   **`core-rules/` 与 `stack-templates/` (根目录 - 英文版)**：
    *   专供 AI 消费。AI IDE 软链接将直接指向这里。
    *   包含全局控制规则、安全规范以及 Go / Java / Vue3 / React 四大技术栈的英文标准。
*   **`doc/` (中文版 - 开发者维护)**：
    *   专供开发者阅读、扩充和修改。
    *   包含与根目录完全对应的中文版规约，方便您直观管理规则资产。
*   **`automation-tools/`**：
    *   包含项目初始化与规则注入工具。
*   **`GLOBAL_RULES_EN.md`**：
    *   英文一键打包版规则，适合在无法建立软链接的环境中直接复制粘贴至项目配置文件。

---

## 🚀 如何在其他项目中使用（操作手册）

当您在本地开启了一个新的或已有的开发项目（例如一个 Go 或 Java 后端，或者 React 前端），可以通过本项目提供的自动化脚本，一键将 AI 规则注入到您的目标项目中。

### 步骤 1：进入您的目标项目根目录
在终端中进入您准备开发的项目文件夹：
```bash
cd /Users/hexianghong/code/your-target-project
```

### 步骤 2：运行注入脚本
直接调用本仓库下的 `init-project.sh` 脚本：

#### 选项 A：注入英文版规范 (推荐 🇬🇧)
AI 对英文指令的理解和格式控制能力最强。**如果不带参数，脚本默认会注入英文版**：
```bash
/Users/hexianghong/code/ai-standards/automation-tools/init-project.sh --english
```

#### 选项 B：注入中文版规范 (🇨🇳)
如果您希望 AI 在阅读规则时完全使用中文，可以指定中文参数：
```bash
/Users/hexianghong/code/ai-standards/automation-tools/init-project.sh --chinese
```

#### 选项 C：交互式选择
如果您不加任何参数且处于交互终端中，脚本会主动弹出菜单供您选择：
```bash
/Users/hexianghong/code/ai-standards/automation-tools/init-project.sh
```

#### 选项 D：更新已有的 AI 规范 (🔄)
当全局 `ai-standards` 规范库更新时，您可以在项目根目录重新运行脚本并指定更新参数，以一键清理失效链接并覆盖最新规范（此操作不会覆盖您的 `GEMINI.md`）：
```bash
/Users/hexianghong/code/ai-standards/automation-tools/init-project.sh --update
```

---

## ⚙️ 脚本执行后发生了什么？

脚本运行成功后，会在您的目标项目根目录下自动创建以下内容，无需手动配置：

### 1. 自动检测技术栈
- 脚本会自动检测项目根目录下的标志性文件（如 `go.mod`, `pom.xml`, `package.json` 等），并在注入时向您反馈检测到的技术栈。

### 2. 自动建立多 IDE 软链接
脚本会创建 4 个软链接，确保无论您使用哪种 AI IDE，规则都能被自动加载：
- **`GEMINI_GLOBAL.md`**：通用的规范入口。
- **`.cursorrules`**：供 **Cursor** 自动加载并作为 System Prompt 级约束。
- **`.clinerules`**：供 **Cline (VS Code 插件)** 自动加载。
- **`.github/copilot-instructions.md`**：供 **GitHub Copilot** 自动加载。

### 3. 生成项目业务上下文模板 `GEMINI.md`
若目标项目下不存在 `GEMINI.md`，脚本会自动根据所选语言生成一份模板文件。
> [!TIP]
> **请务必手动修改并完善 `GEMINI.md`**：在此文件中填入您项目的业务背景、核心表结构、本地的启动/测试命令以及可用的 MCP 服务。这是 AI 智能体快速融入您项目业务的“第一上下文”。

### 4. 自动配置 `.gitignore` 排除规则
为了防止将特定于本地绝对路径的软链接以及开发过程中的临时文件提交至 Git 仓库，脚本会自动在 `.gitignore` 中追加以下排除规则（支持幂等，已存在则不重复添加）：
- 所有 AI 规范软链接文件（如 `GEMINI_GLOBAL.md`, `.cursorrules`, `.clinerules`, `.cursor/rules/*.mdc` 等）。
- AI 智能体开发过程中生成的生命周期过程资产（`implementation_plan.md`, `task.md`, `walkthrough.md`）。
> [!IMPORTANT]
> **关于 `GEMINI.md` 的提交建议**：`GEMINI.md` 作为项目共享的业务上下文不属于自动排除范围，请正常将其提交至 Git，以便整个团队以及其他协作 AI 智能体能够共享相同的背景上下文。

---

## 🔄 AI 协同开发推荐工作流

注入规则后，在您的目标项目中唤醒 AI 助手时，AI 将自动遵循以下流程：
1.  **Rules 对齐**：AI 自动读取项目根目录下的 `.cursorrules` (软链接) 及本地 `GEMINI.md`，明确开发红线。
2.  **Skills 发现**：AI 优先扫描您项目内的 `automation-tools/` 或 `.skills/`，并融合全局 `/Users/hexianghong/code/gemini-skills` 库中的 TDD、系统化调试与顶级 UI 设计系统。
3.  **过程资产沉淀 (State Preservation)**：开发过程中，AI 将在您的项目目录自动创建/维护以下文件：
    -   `implementation_plan.md`：动手前向您提交的架构设计与变更计划。
    -   `task.md`：任务 checklist 进度板，即使会话重置，下一个 AI 也能无缝接班。
    -   `walkthrough.md`：改动说明以及本地测试/编译通过的终端输出日志。
