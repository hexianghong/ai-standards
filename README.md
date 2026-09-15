# 全局 AI 协同工程与 SRE 运维规则引擎 (ai-standards)

`ai-standards` 是一个专门为 **Google DeepMind Antigravity** 及现代 AI 智能体（AI IDE / Autonomous Agents）定制的**全局开发规范、SRE 运维规约与 SOP 引擎 (Full-Stack Engineering & SRE AI Rules Engine)**。

本引擎面向高级 **SRE（站点可靠性工程师）** 与 **全栈平台工程师**，通过单一事实来源（SSOT）、标准化控制指令、安全防护红线、SRE 故障排查 SOP 以及 Agent 动态自闭环工作流，赋予 AI 智能体生产级的架构防护能力与专家级排障思维。

---

## 🏛️ 项目三大核心支柱 (Core Pillars)

```text
┌────────────────────────────────────────────────────────────────────────┐
│    ai-standards: 全局 AI 协同工程与 SRE 运维规则引擎 (Antigravity-First)│
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
  【1. SRE 与全栈规约】       【2. 故障排查 SOP】         【3. AI Skill & MCP】
  • Linux 内核与参数调优规约  • PLEG 死锁诊断决策树       • 标准 SKILL.md 技能插件
  • CNI 容器与网络架构规约    • 502/504 链路止血 SOP      • K8s / MySQL / Git MCP
  • Operator 开发与 TDD 规约  • CPU 100% 故障应急响应     • repo-map 依赖图建立
```

---

## 📂 权威目录结构 (Single Source of Truth, SSOT)

本项目已彻底精简收敛为**以中文为唯一权威标准（SSOT）**的极简架构，杜绝双语镜像复制与版本漂移：

*   **`core-rules/`**：
    *   `INSTRUCTIONS.md`：最高执行总控（Master Instructions），统管全生命周期。
    *   `security-guardrails.md`：全局安全防护红线与网络治理标准。
    *   `cloud-native-rules.md`：云原生容器、优雅停机、HPA 防抖与内核调优规约。
    *   `LEARNING.md`：错题本与自我进化机制规范。
*   **`stack-templates/`**：
    *   多技术栈研发规约模版（Go、Java、Vue3、React 等）。
    *   `skills/`：符合 Antigravity 规范的标准技能插件包（包含 `ops-troubleshooting` 故障排查决策树、`logging-standard` 结构化日志、`repo-map-analyzer` 等）。
*   **`automation-tools/`**：
    *   自动化工具链：一键注入脚本 `init-project.sh`、代码大纲测绘器 `gen-repo-map.sh` 及过程资产归档脚本 `archive-specs.sh`。
*   **`GEMINI_GLOBAL.md`**：
    *   指向 `core-rules/INSTRUCTIONS.md` 的权威软链接入口。

---

## 🚀 注入与使用操作手册 (Operation Guide)

在新建或已有的开发/运维项目根目录下，直接运行本仓库的一键注入脚本：

```bash
# 进入您的目标项目根目录
cd /Users/hexianghong/code/your-target-project

# 运行注入脚本 (一键秒级注入)
/Users/hexianghong/code/ai-standards/automation-tools/init-project.sh
```

### ⚙️ 脚本执行后的自动化动作
1. **核心环境适配 (Antigravity)**：自动挂载 `GEMINI_GLOBAL.md` 软链接，并根据技术栈动态生成项目业务上下文 `GEMINI.md`。
2. **原生技能注入 (.agents/skills)**：自动为目标项目挂载 `.agents/skills` 软链接，使 Antigravity 原生唤醒全局技能库。
3. **初始化项目级错题本**：自动创建项目级 `LEARNING.md`，用于记录避坑教训。
4. **排除规则配置**：自动在 `.gitignore` 中追加软链接及临时过程资产排除项，杜绝仓库污染。

---

## 🔄 三维自闭环认知演进飞轮 (Continuous Feedback Flywheel)

```text
┌──────────────────────────────┐
│ 1. 深度原理与技术底座        │ ──▶ 提炼 ──▶ ┌──────────────────────────────┐
│    knowledgeBase (知识库)    │              │ 2. 全局 AI 规则与 SOP 引擎   │
└──────────────────────────────┘              │    ai-standards              │
                                              └──────────────┬───────────────┘
                                                             │ 约束与驱动
                                                             ▼
┌──────────────────────────────┐ ──▶ 升级 ──▶ ┌──────────────────────────────┐
│ 4. 错题本升格与主动反哺提醒  │              │ 3. SRE 运维与全栈开发实战    │
│    (LEARNING.md & Refine)    │ ◀── 反哺 ─── │    (Antigravity Pair Coding) │
└──────────────────────────────┘              └──────────────────────────────┘
```

1. **主动反哺规约 (Proactive Mining)**：当 AI 协助您解决复杂故障或编写出通用脚本后，AI 将主动提示：“*本次解决的方案具备通用价值，建议提炼并归档至 ai-standards 或个人知识库 knowledgeBase*”。
2. **错题本升格通道**：项目本地 `LEARNING.md` 记录的踩坑教训，会动态升级为全局通用规约。
