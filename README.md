# 公司级 AI 智能体总控规约与接入工具

本仓库面向公司多成员、多项目维护 AI 执行基线、任务技能、客户端适配与接入工具。平台维护发布和安装工具，安全负责人管理强制控制，领域负责人维护技术栈技能，项目团队维护业务上下文和验证命令。

版本接入与诊断见 [客户端兼容与接入](adapters/compatibility.md)。规则治理见 [公司治理约定](core-rules/governance.md)。本次改造的验收状态见 [实施验证报告](docs/specs/company-agent-governance/walkthrough.md)。

以下为已有软链接接入说明。多人项目优先使用上面的固定版本接入方式。

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
  • Linux 内核与参数调优规约  • PLEG 死锁诊断决策树       • 标准 SKILL.md 技能
  • CNI 容器与网络架构规约    • 502/504 链路止血 SOP      • K8s / MySQL / Git MCP
  • Operator 开发与 TDD 规约  • CPU 100% 故障应急响应     • repo-map 依赖图建立
```

---

## 📂 权威目录结构 (Single Source of Truth, SSOT)

本项目已彻底精简收敛为**以中文为唯一权威标准（SSOT）**的极简架构，杜绝双语镜像复制与版本漂移：

* **`core-rules/`**：
  * `INSTRUCTIONS.md`：最高执行总控（Master Instructions），统管全生命周期。
  * `security-guardrails.md`：全局安全防护红线与网络治理标准。
  * `cloud-native-rules.md`：云原生容器、优雅停机、HPA 防抖与内核调优规约。
  * `LEARNING.md`：错题本与自我进化机制规范。
* **`stack-templates/`**：
  * 多技术栈研发规约模版（Go、Java、Vue3、React 等）。
  * `skills/`：项目共享技能库，每项技能以 `SKILL.md` 为入口（包含 `product-manager` 产品经理效能、`ops-troubleshooting` 故障排查决策树、`logging-standard` 结构化日志、`repo-map-analyzer` 等）。
* **`automation-tools/`**：
  * 自动化工具链：一键注入脚本 `init-project.sh`、代码大纲测绘器 `gen-repo-map.sh`、过程资产归档脚本 `archive-specs.sh` 以及知识库全文索引构建器 `index-knowledge.sh`。
* **`GEMINI_GLOBAL.md`**：
  * 指向 `core-rules/INSTRUCTIONS.md` 的权威软链接入口。

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
3. **标准 MCP 配置注入 (.agents/mcp_config.json)**：自动挂载全局权威 MCP 配置软链接（内置 Filesystem、MySQL 等标准服务），全项目无感同步生效。
4. **初始化项目级错题本**：自动创建项目级 `LEARNING.md`，用于记录避坑教训。
5. **排除规则配置**：自动在 `.gitignore` 中追加软链接及临时过程资产排除项，杜绝仓库污染。

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
2. **AI 错误反馈与全局优化池 (Feedback Loop)**：在任何业务项目中，对 AI 说 `“反馈这个问题”` 或在 AI 多次出错时，AI 将自动将现场结构化写入 `feedback/inbox/`，并在 [FEEDBACK_KANBAN.md](feedback/FEEDBACK_KANBAN.md) 注册待办，支撑开发者针对性制定规约与技能加固方案。
3. **错题本升格通道**：项目本地 `LEARNING.md` 记录的踩坑教训，会动态升级为全局通用规约。

---

## 📁 最终仓库权威目录现状

```Markdown
ai-standards
├── GEMINI.md                                    # 本项目业务上下文与入口
├── GEMINI_GLOBAL.md                             # 指向 core-rules/INSTRUCTIONS.md 的软链接
├── LEARNING.md                                  # 错题本
├── README.md                                    # 项目主说明
├── REFERENCE_REPOSITORIES.md                    # 社区 Top 10 开源规约对标库
├── ROADMAP.md                                   # 路线图
├── knowledgebase-to-standards-guide.md          # 知识库与规范库联动指南
├── feedback/                                    # 📥 全局 AI 错误反馈中心与优化看板
│   ├── FEEDBACK_KANBAN.md                       # 📋 反馈跟踪与优化看板 (待评估/方案制定/已落地)
│   ├── inbox/                                   # 待分析的各业务项目 Case
│   ├── archive/                                 # 已完成规约优化并闭环的历史 Case
│   └── templates/                               # 标准反馈卡片模板
├── .agents/
│   └── skills -> stack-templates/skills        # Antigravity 原生工作区技能挂载
├── core-rules/
│   ├── INSTRUCTIONS.md                          # 最高执行总控 (Master Instructions)
│   ├── security-guardrails.md                   # 安全红线标准
│   ├── cloud-native-rules.md                    # 云原生与 SRE 生产规约
│   ├── markdown-formatting-rules.md             # Markdown/Mermaid 防报错规约
│   └── LEARNING.md                              # 错题本模板
├── stack-templates/
│   ├── backend-go-standard.md                   # Go 技术栈规约
│   ├── backend-java-standard.md                 # Java 微服务规约
│   ├── frontend-vue3-tailwind.md                # Vue3 前端规约
│   ├── frontend-react-standard.md               # React 前端规约
│   └── skills/                                  # 项目共享技能库
│       ├── code-review/SKILL.md                 # 全链路代码审查、仓库体检与技术债盘点
│       ├── ops-troubleshooting/SKILL.md         # SRE 故障排查 SOP 决策树
│       ├── logging-standard/SKILL.md            # 跨语言结构化日志标准
│       ├── devops-shell/SKILL.md                # Shell 运维脚本安全规范
│       ├── repo-map-analyzer/SKILL.md           # 符号大纲提取技能
│       ├── macro-architecture-cartographer/     # C4 架构测绘技能
│       └── backend-go / backend-java / ...      # 各语言栈与产品经理技能
└── automation-tools/
    ├── init-project.sh                          # Antigravity 一键注入与联动脚本
    ├── gen-repo-map.sh                          # 多语言代码大纲与符号测绘脚本
    └── archive-specs.sh                         # 过程资产自动化归档脚本
```
