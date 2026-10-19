# [AI 交互错误与偏离反馈模板]
<!-- 报告唯一标识: {YYYY-MM-DD}_{PROJECT_NAME}_{ISSUE_SLUG} -->

## 1. 基础元数据 (Metadata)
- **上报时间**: {{DATE_TIME}}
- **来源项目**: `{{PROJECT_NAME}}`
- **项目路径**: `{{PROJECT_PATH}}`
- **主要技术栈**: `{{TECH_STACK}}`
- **错误分类**: `{{CATEGORY}}` <!-- 可选: 代码逻辑缺陷 / 规范与红线违规 / 幻觉与死循环 / 编译测试失败 / 架构设计偏离 / 工具与命令异常 -->
- **当前处理状态**: `待评估` <!-- 状态流转: 待评估 -> 方案制定中 -> 已优化落地 -> 已归档 -->

---

## 2. 现场还原与失败现象 (Failure Context)
### 2.1 任务目标与上下文
{{TASK_CONTEXT}}

### 2.2 AI 的错误表现 (What AI Did Wrong)
{{AI_ERROR_BEHAVIOR}}

### 2.3 关键报错信息 / 异常现场代码 (Logs & Snippets)
```text
{{ERROR_LOGS_OR_DIFF}}
```

---

## 3. 用户纠偏与正确做法 (Expected Behavior)
### 3.1 用户的纠正或期望结果
{{EXPECTED_BEHAVIOR}}

### 3.2 纠正后的正确代码/操作范式
```text
{{CORRECT_SOLUTION}}
```

---

## 4. 根因剖析与方案制定 (Root Cause & Solution Plan)
<!-- 由开发者与 ai-standards AI 协同分析并填写 -->
- **根因定位**:
  - [ ] 全局核心规约缺失 (`core-rules/INSTRUCTIONS.md` 或 `security-guardrails.md`)
  - [ ] 对应技术栈规范不完善 (`stack-templates/`)
  - [ ] AI 角色/技能提示词或流程设计有漏洞 (`.agents/skills/`)
  - [ ] 缺乏前置/后置自动化拦截脚本 (Linter / Guardrails / Pre-commit)
  - [ ] 模型上下文窗口受限或业务契约未提供
- **优化与改进方案**:
  1. *[待制定具体优化措施]*
- **实施改动文件**:
  - `待定`
- **验证与闭环标准**:
  - `待定`
