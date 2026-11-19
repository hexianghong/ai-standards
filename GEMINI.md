# AI Standards Repository Business Context & Local Rules (GEMINI.md)

## 项目工作约定

本仓库是公司级、多成员、多项目接入的 AI 智能体总控规约源，负责维护公司基线、任务技能、客户端适配及发布接入工具。

- 修改规范前读取 [总控入口](core-rules/INSTRUCTIONS.md)，按任务加载相关技能。
- 项目自有内容由项目负责人维护，公司强制控制通过客户端托管配置、沙箱、服务端权限或 CI 执行。
- 需求分析使用 product-manager，代码审查使用 code-review，排障使用 ops-troubleshooting，脚本变更使用 devops-shell。
- 规范修改完成后运行 `node automation-tools/check-standards.js`，安装工具变更另运行 `node --test tests/standards/*.test.js`。
- 会话角色通过工作台请求传入，团队共享指令保持稳定。


---

## 1. 业务背景与核心职责

本仓库集中维护并分发研发与 SRE 的 AI 协作规范、技能和自动化工具，供各业务项目及其 AI 客户端复用。通过共享规则入口，减少各项目重复维护以及不同客户端之间的规则漂移。

- **定义工程规则**。维护 Go、Java、Vue3、React 和 TypeScript 的开发规范，以及安全、日志、SRE 排障和研发协作规范。
- **把规则接入项目**。通过初始化脚本接入项目指令文件、技能库和自动化工具，适配 Codex 与 Antigravity。工作台支持角色切换、敏捷看板和过程文档归档。
- **用实际问题改进规则**。将 AI 在业务项目中的错误和执行偏差记录到反馈看板，据此修订共享规范、技能和脚本。

---

## 2. 规范维护守则 (Maintenance Rules)
- **单一事实来源 (SSOT)**: 全局规范以根目录下的中文规约作为唯一标准版本，杜绝双语冗余与版本漂移。
- **更新策略**: 用户要求修改时直接落盘并验证。跨项目推广通过版本发布和项目显式升级进行。

---

## 3. 本地技能与自动化脚本 (Local Skills & Scripts)
- **项目 Skills 目录**：遵循[全局客户端加载规约](./core-rules/INSTRUCTIONS.md#1-客户端适配与上下文路由-client--rules-resolution)。所有 AI 客户端统一使用 [`stack-templates/skills/`](./stack-templates/skills/) 中的项目技能，工作区入口 [`.agents/skills/`](./.agents/skills/) 链接到该目录。
- **项目初始化与注入**: `./automation-tools/init-project.sh`
  - 为已有或新项目一键注入全局 AI 规约软链接 (`GEMINI_GLOBAL.md`)、挂载 `.agents/skills` 技能库、`.agents/mcp_config.json` 标准 MCP 配置、`.agents/gemini-web-chat` 效能工作台，以及挂载 `.agents/tools` 自动化脚本工具集。
- **Web 研发效能与敏捷工作台**: `node .agents/gemini-web-chat/server.js`
  - 专为 Antigravity Simple Browser 设计，提供流式对话、多角色热加载、敏捷看板流转与文档一键持久化至 `docs/`。
- **代码仓库大纲测绘**: `./automation-tools/gen-repo-map.sh .`
- **过程资产自动归档**: `./automation-tools/archive-specs.sh <feature-name>`
- **知识库全文索引构建**: `./automation-tools/index-knowledge.sh [dir]`
  - 为知识库与规约构建本地 SQLite FTS5 索引，赋能毫秒级 BM25 检索。
- **AI 错误反馈与看板沉淀**: `./automation-tools/record-feedback.sh <project> <category> <summary>`
  - 将各项目的 AI 踩坑或偏离案例沉淀至全局优化看板，支撑规约防御性重构。

---

## 4. 全局标准 MCP 服务 (Global Standard MCP Servers)
- **权威配置路径**: [.agents/mcp_config.json](.agents/mcp_config.json)
- **Filesystem MCP**: 优化跨项目文件的精准检索（授权根路径 `/Users/hexianghong/code`）。
- **MySQL MCP**: 本地数据库结构 Schema 查询。
- **Context-Mode MCP**: 针对海量日志排查（SRE）与大输出执行的沙箱虚拟化层，降低 98% 上下文消耗。

---

## 5. 核心符号与规约入口 (Repository Map)
- **最高执行总控**: [core-rules/INSTRUCTIONS.md](core-rules/INSTRUCTIONS.md)
- **AI 错误反馈与优化看板**: [feedback/FEEDBACK_KANBAN.md](feedback/FEEDBACK_KANBAN.md)
- **安全红线标准**: [core-rules/security-guardrails.md](core-rules/security-guardrails.md)
- **云原生与 SRE 规约**: [core-rules/cloud-native-rules.md](core-rules/cloud-native-rules.md)
- **项目技能库**: [stack-templates/skills/](stack-templates/skills/)
- **技术栈研发规约**: [stack-templates/](stack-templates/)
