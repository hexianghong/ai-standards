# AI Standards Repository Business Context & Local Rules (GEMINI.md)

## 1. 业务背景与核心功能 (Context)
- **背景**: 本仓库是研发与 SRE 运维工作区的**全局 AI 规约与标准执行引擎**。定义编码标准、安全防护红线、SRE 排障 SOP、动态 Agent 协作流程及自动化脚本。
- **技术栈支持**: Go、Java、Vue3、React 及 TypeScript。
- **客户端适配**: 专享适配 Google DeepMind Antigravity (`GEMINI_GLOBAL.md`)。

---

## 2. 规范维护守则 (Maintenance Rules)
- **单一事实来源 (SSOT)**: 全局规范以根目录下的中文规约作为唯一标准版本，杜绝双语冗余与版本漂移。
- **更新策略**: 规范修改直接落盘生效，无需阻塞暂停确认。

---

## 3. 本地技能与自动化脚本 (Local Skills & Scripts)
- **项目初始化与注入**: `./automation-tools/init-project.sh`
  - 为已有或新项目一键注入全局 AI 规约软链接 (`GEMINI_GLOBAL.md`) 并挂载 `.agents/skills`。
- **代码仓库大纲测绘**: `./automation-tools/gen-repo-map.sh .`
- **过程资产自动归档**: `./automation-tools/archive-specs.sh <feature-name>`

---

## 4. 推荐 MCP 服务 (Recommended MCP Servers)
- **Filesystem MCP**: 优化跨项目文件的精准检索。
- **Git MCP**: 辅助版本控制与分支原子提交。

---

## 5. 核心符号与规约入口 (Repository Map)
- **最高执行总控**: [core-rules/INSTRUCTIONS.md](file:///Users/hexianghong/code/ai-standards/core-rules/INSTRUCTIONS.md)
- **安全红线标准**: [core-rules/security-guardrails.md](file:///Users/hexianghong/code/ai-standards/core-rules/security-guardrails.md)
- **云原生与 SRE 规约**: [core-rules/cloud-native-rules.md](file:///Users/hexianghong/code/ai-standards/core-rules/cloud-native-rules.md)
- **技能插件体系**: [stack-templates/skills/](file:///Users/hexianghong/code/ai-standards/stack-templates/skills/)
- **技术栈研发规约**: [stack-templates/](file:///Users/hexianghong/code/ai-standards/stack-templates/)
