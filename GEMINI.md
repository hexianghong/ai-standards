# AI Standards Repository Business Context & Local Rules (GEMINI.md)

## 1. Business Background & Core Functions (Context)
- **Background**: This repository serves as the global AI rules and standards engine for development workspaces. It defines coding conventions, safety rules, development workflows, and automation linking scripts.
- **Languages Supported**: Go, Java, Vue3, React, and general TypeScript.
- **Client IDE Support**: Cursor (`.cursorrules`), Cline (`.clinerules`), Copilot (`copilot-instructions.md`), and general (`GEMINI_GLOBAL.md`).

---

## 2. Project-Specific Local Rules (Local Rules)

> [!IMPORTANT]
> **Double-Phase Rule Update Process (规则更新双阶段提交红线)**
> When you receive a request to modify or add rules inside this repository, you **must strictly adhere** to the following workflow:
>
> 1. **Phase 1 (Chinese First / 中文优先)**:
>    - You must **first and only** update the Chinese version of the rule files inside the `doc/` directory: [doc/](file:///Users/hexianghong/code/ai-standards/doc/).
>    - Present the proposed changes clearly to the user in Chinese and **stop executing**.
>    - Wait for the user's explicit confirmation and approval.
> 
> 2. **Phase 2 (English Translation & Sync / 英文同步)**:
>    - Once the user explicitly confirms and approves the Chinese changes, you must then translate the updates into English.
>    - Update the corresponding English files located at the root of the repository: [core-rules/](file:///Users/hexianghong/code/ai-standards/core-rules/), [stack-templates/](file:///Users/hexianghong/code/ai-standards/stack-templates/), or [GLOBAL_RULES_EN.md](file:///Users/hexianghong/code/ai-standards/GLOBAL_RULES_EN.md).
>
> **This local process is a strict guardrail and overrides any global or general instruction.**

---

## 3. Local Skills & Automation Scripts (Local Skills & Scripts)
- **Script Linking**: `./automation-tools/init-project.sh`
  - Injects AI rules (English by default, Chinese optionally via `--chinese`) into target projects.

---

## 4. Recommended Local MCP Servers (Recommended MCP Servers)
- **Filesystem MCP**: Optimization for indexing larger projects.
- **Git MCP**: Assisting with version control.

## 5. Domain Symbols & Core Models (Domain Symbols - Repository Map)
- **Core Orchestrator Rules**:
  - [doc/core-rules/INSTRUCTIONS.md](file:///Users/hexianghong/code/ai-standards/doc/core-rules/INSTRUCTIONS.md) (Chinese entry)
  - [core-rules/INSTRUCTIONS.md](file:///Users/hexianghong/code/ai-standards/core-rules/INSTRUCTIONS.md) (English entry)
- **Core Automation Scripts**:
  - [automation-tools/init-project.sh](file:///Users/hexianghong/code/ai-standards/automation-tools/init-project.sh)
- *Before modifying or adding any rules, AI must read these files to align with the core standards structure and process.*

