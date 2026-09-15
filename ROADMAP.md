# AI Standards 项目演进路线图与需求文档 (ROADMAP & REQUIREMENTS)

本文档系统性地记录了 `ai-standards` 项目的发展规划。本项目定位为 **“AI 驱动的云原生全栈工程与 SRE 运维自动化引擎”**，核心服务于 **Antigravity** 智能体与高级 SRE/平台工程师的 Pair Programming 与 Agentic 工作流。

## 🎯 当前迭代目标：Agentic Workflow & SRE Engine Upgrade (v2.0)

为了将本项目从“静态代码规范”升级为“支持云原生 SRE 运维、排障 SOP、可反哺与 Skill 扩展的 AI 引擎”，特引入以下 6 大核心机制需求：

### 1. 模块化与按需规则加载体系 (Antigravity-First Rules)
*   **需求描述**：摒弃庞大的静态上下文，以 **Google DeepMind Antigravity** 智能体架构为核心适配对象。
*   **Antigravity 核心方案**：
    *   在主入口 `GEMINI.md` 中以 Markdown 链接（`[rule](file://...)`）的形式建立目录索引，由 Antigravity 通过 `view_file` 工具按需读取。
    *   全面拥抱工作区 `.agents/skills` 目录体系与标准 `SKILL.md` 规范，将代码模板、SRE 工具包封装为智能体直接调用的技能。
*   **生态收敛**：全面收敛聚焦于 Antigravity IDE 智能体，精简冗余的多端配置。

### 2. SRE 运维与云原生规约体系 (SRE & Cloud-Native Rules)
*   **需求描述**：提供涵盖 Linux 内核参数调优规约、K8s 资源配置原则、HPA 缩容防震荡算法规约、优雅停机与容器网络调优的生产级规约。
*   **排障能力闭环**：将生产高频故障（PLEG 死锁、502 链路诊断、MySQL CPU 100% 止血 SOP）作为结构化决策树沉淀至 `skills/ops-troubleshooting/SKILL.md`，使 AI 具备专家级排障逻辑。

### 3. TDD 作为 AI 约束通信协议 (TDD as an AI Protocol)
*   **需求描述**：AI 极易在实现需求或写脚本时出现过度工程（Over-engineering）或幻觉。必须将测试驱动开发（TDD）与脚本验证作为硬性协议。
*   **工作流规范**：在改代码/写脚本前，先定义失败的测试用例（Red），修改必须以“恰好通过测试的最少代码”为红线（Green），通过后再重构提交（Refactor）。

### 4. 知识地图与外科手术式编辑 (Repository Map & Surgical Editing)
*   **需求描述**：禁止 AI 在未掌握全局上下文时盲目修改文件，且禁止全文件重写。
*   **工作流规范**：
    *   **Repository Map & 架构测绘**：任务规划与新人上手阶段，强制调用 `repo-map-analyzer` 或静默执行 `./automation-tools/gen-repo-map.sh` 建立符号依赖图；大型工程重构规划阶段使用 `macro-architecture-cartographer` 绘制 C4 拓扑。
    *   **Surgical Editing**：代码修改必须是局部、精准的 Diff 修改，降低破坏大文件的风险。

### 5. 双向反哺与自我演进闭环 (Continuous Feedback Flywheel)
*   **需求描述**：建立“知识库 (knowledgeBase) ➔ 规则库 (ai-standards) ➔ 生产实战 ➔ 反哺进化”的无缝闭环。
*   **工作流规范**：
    *   每个项目的 `LEARNING.md` 记录错误教训，并定期升格为全局规则。
    *   在 AI 解决复杂故障、重构避坑逻辑或阅读知识库后，**主动提示用户提炼归档**至 `ai-standards`。

### 6. 前沿 AI 技术与 Skill/MCP 演进 (Skill & MCP Integration)
*   **需求描述**：追踪前沿 AI 智能体技术，集成可复用的 Agent Skills 与 MCP (Model Context Protocol) 协议。
*   **工作流规范**：
    *   将常用 SRE/开发工具链打包为标准 `SKILL.md` 插件。
    *   集成并维护推荐的 Filesystem, Git, MySQL, K8s 等 MCP 配置清单。

---

## 📅 未来规划 (Future Backlog)
- *重构 `automation-tools` 以更智能化服务 Antigravity 智能体...*
- *持续丰富 SRE 常见中间件（Kafka, Redis, ES）与 K8s CNI/CSI 的排障 SOP...*

