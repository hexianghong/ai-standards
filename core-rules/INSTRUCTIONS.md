# 公司级 AI 智能体总控入口

本仓库向公司多个项目和成员提供版本化规约、技能和工具。公司治理见 [治理约定](governance.md)。

## 通用工作约定

- 先确认用户目标、现有工作区变更和本次影响范围，保留其他成员的改动。
- 公司强制控制由实际权限系统执行。项目规则仅在声明允许的范围内覆盖默认约定。
- 按任务读取所需文档和技能，沿现有入口完成实现及验证。
- 项目负责人维护项目业务上下文、架构边界和真实验证命令。
- 凭据通过公司凭据系统或用户环境提供，反馈先脱敏，再按用户授权上报。
- 共享规范经评审、验证和发布后由项目升级。当前任务的角色与状态按会话保存。

## 按任务加载

| 任务 | 入口 |
| --- | --- |
| 常规开发与重构 | [研发流程](agile-dev-lifecycle.md)及相关技术栈标准 |
| 安全与权限变更 | [安全标准](security-guardrails.md) |
| 云原生与 SRE | [云原生标准](cloud-native-rules.md)及 ops-troubleshooting 技能 |
| 需求分析 | ../stack-templates/skills/product-manager/SKILL.md |
| 代码审查 | ../stack-templates/skills/code-review/SKILL.md |
| Shell 自动化 | ../stack-templates/skills/devops-shell/SKILL.md |
| 架构分析 | ../stack-templates/skills/macro-architecture-cartographer/SKILL.md |

验证命令从项目文档与构建配置确认。简单咨询直接回答，普通变更执行相关验证，高风险改动按对应控制点验证权限、失败恢复和影响范围。

## 发布接入

运行 `node automation-tools/check-standards.js` 检查源文件。
运行 `node automation-tools/build-standards.js <version> <output-directory>` 构建离线发布目录。
接入、诊断和恢复接口见 [接入说明](../adapters/compatibility.md)。


## 需求过程资产

每项需要方案和任务跟踪的需求沿用 `docs/specs/<需求编号>-<名称>/`，包含 `spec.md`、`implementation_plan.md`、`task.md` 和 `walkthrough.md`。验收条件使用 AC 编号，任务引用验收条件，完成证据记录在 walkthrough 中。已有平铺文档继续兼容。

实施前运行 `node automation-tools/check-specs.js plan <需求目录>`；全部验收满足后运行 `node automation-tools/check-specs.js done <需求目录>`。外部环境仍待验证时保留未完成状态。归档使用 `automation-tools/archive-specs.sh <需求目录>`，保留原需求与看板链接。
