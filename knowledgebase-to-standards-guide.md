# 📘 知识库 (knowledgeBase) 提炼归档至 AI 规范库 (ai-standards) 标准指南

本指南旨在定义如何将个人/团队知识库（`knowledgeBase`）中沉淀的架构原理、源码解析、高可用配置与生产故障排障 SOP，系统化地提炼并归档到全局 AI 规范库（`ai-standards`）中，使 AI Agent（特别是 **Antigravity**）在 Pair Programming 和 Agentic Coding 时能够自动加载并遵从这些顶级实战规范。

---

## 一、 知识库 (knowledgeBase) vs AI 规范库 (ai-standards) 的角色定位

| 维度 | `knowledgeBase` (知识库) | `ai-standards` (AI 规范库) |
| :--- | :--- | :--- |
| **主要使用者** | 人类开发者（阅读、学习、查阅） | **AI 智能体 / AI IDE**（自动注入、强制约束、SOP 导引、Skill 扩展） |
| **内容形态** | 深度原理长文、源码剖析、公式推导、完整实战演练 | **AI 可消费的 Rules（规约）、SOP（排错决策树）、Skills（技能包）** |
| **目标与效果** | 解决“懂不懂”的知识储备问题 | 解决 AI“乱写代码、缺少生产规范、缺少排障逻辑”的**行为约束与能力赋能** |

---

## 二、 归档转化三阶模型 (Knowledge-to-Rules Pipeline)

```text
┌────────────────────────────────────────────────────────┐
│             knowledgeBase (知识库深度资产)              │
│  • K8s / MySQL 源码原理与机制                          │
│  • 生产高难故障 (PLEG, 502, etcd NOSPACE)              │
│  • 系统调优原理与并发锁机制                            │
└───────────────────────────┬────────────────────────────┘
                            │ 提炼与转化 (Extraction & Conversion)
                            ▼
┌────────────────────────────────────────────────────────┐
│             ai-standards (AI 规范与规约库)              │
│                                                        │
│ 1. 规约约束 (core-rules/)                               │
│    └─ 转化为 AI 代码编写、系统调优与云原生的硬性 Checklists │
│                                                        │
│ 2. 排障与诊断能力 (stack-templates/skills/ 或 .agents/skills/)│
│    └─ 转化为 AI 引导调试时的标准化排错决策树与执行步骤   │
│                                                        │
│ 3. Agent Skill 技能包 (skills/<skill_name>/)           │
│    └─ 转化为符合 SKILL.md 规范的可复用工具与脚本       │
└────────────────────────────────────────────────────────┘
```

---

## 三、 🎓 10 轮系统化学习与反哺演练体系 (10-Round Learning Curriculum)

为实现 `ai-standards` 的自我学习与持续进化，我们将按以下 **10 轮递进演练** 将知识库与实战经验萃取为规范资产：

```text
【第 1 轮】 Linux 内核与系统调优规约 ──────▶ 抽象为 core-rules/cloud-native-rules.md
【第 2 轮】 K8s 容器与 CNI 网络架构规约 ────▶ 抽象为 Pod 优雅下线与网络超时规约
【第 3 轮】 K8s PLEG 挂起故障排障 SOP ────▶ 沉淀为 skills/ops-troubleshooting/ 决策分支
【第 4 轮】 MySQL CPU 100% & 死锁 SOP ─────▶ 沉淀为 skills/ops-troubleshooting/ 决策分支
【第 5 轮】 Go Operator & Controller 规约 ──▶ 抽象 Informer 缓存与 Reconcile 幂等规约
【第 6 轮】 HPA/VPA 扩缩容算法避坑规约 ─────▶ 抽象容忍度计算与冷窗口防震荡规约
【第 7 轮】 SRE 高频排障 Agent Skill 封装 ──▶ 打包为 skills/sre-log-analyzer/ 技能包
【第 8 轮】 MCP 协议拓展与工具配置集成 ──▶ 沉淀 K8s / MySQL MCP 工具映射规范
【第 9 轮】 TDD 协议与外科手术代码重构 ──▶ 强化 Perception-Action-Verification 循环
【第 10 轮】生产事故复盘与主动反哺演练 ──▶ 验证 Proactive Mining 提示与反哺闭环
```

---

## 四、 映射归档分类标准与目录指南

### 1. 转化为【AI 代码与架构约束】(归档至 `core-rules/`)

* **知识库提取源**：
  * `03-K8S/01-组件原理/02-Controller_Manager.md`（Informer 带缓存 ListWatch）
  * `03-K8S/02-集群负载/06-资源更新/优雅关闭服务.md`（Pod 下线 `preStop: sleep 15` 优雅解耦）
* **归档目标路径**：
  * `ai-standards/core-rules/cloud-native-rules.md`
* **转化后形态示例**：
  ```markdown
  # 规则：云原生应用与控制器开发规范
  1. 【Informer 强制要求】：在开发 K8s 自定义控制器或读取对象时，必须使用 Informer 机制与 Indexer 缓存，严禁直接调用 clientset 发起全量 List 请求打爆 APIServer。
  2. 【优雅下线强制要求】：所有 Deployment 的 Pod 必须配置 lifecycle.preStop: "sleep 15"，防止滚动更新时上游 Ingress/IPVS 规则刷新延时导致 502。
  ```

---

### 2. 转化为【AI 排错诊断 SOP】(融入 `stack-templates/skills/ops-troubleshooting/`)

* **知识库提取源**：
  * `03-K8S/06-集群运维/06-生产级高难故障排查与实战方案.md`（PLEG 挂起、etcd NOSPACE 救援、Pod CrashLoop）
* **归档目标路径**：
  * `ai-standards/stack-templates/skills/ops-troubleshooting/SKILL.md`
* **转化后形态**：结构化的“现象 ➔ 命令白名单 ➔ 分支判断 ➔ 止血动作”思维树。

---

### 3. 转化为【Agent Skill 技能包】(归档至 `skills/<skill_name>/` 或 `stack-templates/skills/`)

* **知识库/工具提取源**：高频使用的 Shell 脚本、pprof 分析逻辑、日志提取组合命令。
* **归档目标路径**：`ai-standards/stack-templates/skills/<skill_name>/SKILL.md`。

---

## 五、 标准归档操作工作流 (SOP)

当您在 `knowledgeBase` 中整理完一项新技术或故障实战后，按以下 3 步完成归档：

```bash
# 1. 提炼核心规则与 SOP：在 knowledgeBase 中总结出的规则提炼为规约条目或 Skill
# 2. 直接同步更新 ai-standards 的对应模块 (单一事实来源 SSOT)
cd /Users/hexianghong/code/ai-standards

# 3. 执行更新通知脚本给其他本地仓库测试注入
/Users/hexianghong/code/ai-standards/automation-tools/init-project.sh --update
```

