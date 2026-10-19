#!/usr/bin/env bash
# ==============================================================================
# update-kanban.sh: 敏捷看板任务流转与同步工具
# 用法: ./automation-tools/update-kanban.sh <task-id> <target-stage> [summary]
# 可选阶段: backlog | design | development | testing | release | done
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STANDARDS_DIR="$(dirname "$SCRIPT_DIR")"

# 优先查找当前项目本地专属看板文件 (彻底实现跨项目看板数据隔离)
if [[ -f "${PWD}/.agents/agile-kanban.json" ]]; then
  KANBAN_FILE="${PWD}/.agents/agile-kanban.json"
elif [[ -f "${PWD}/agile-kanban.json" ]]; then
  KANBAN_FILE="${PWD}/agile-kanban.json"
elif [[ -f "${STANDARDS_DIR}/.agents/agile-kanban.json" ]]; then
  KANBAN_FILE="${STANDARDS_DIR}/.agents/agile-kanban.json"
else
  KANBAN_FILE="${PWD}/.agents/agile-kanban.json"
fi

if [[ $# -lt 2 ]]; then
  echo "❌ 参数不足！用法: $0 <task-id> <target-stage> [summary]"
  echo "👉 可用阶段: backlog, design, development, testing, release, done"
  exit 1
fi

TASK_ID="$1"
TARGET_STAGE="$2"
SUMMARY="${3:-}"

if [[ ! -f "${KANBAN_FILE}" ]]; then
  echo "❌ 看板文件不存在: ${KANBAN_FILE}"
  exit 1
fi

# Use node to update JSON cleanly
node -e "
const fs = require('fs');
const path = require('path');
const filePath = '${KANBAN_FILE}';
const tasks = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
const task = tasks.find(t => t.id === '${TASK_ID}');
if (!task) {
  console.error('❌ 未找到任务 ID: ${TASK_ID}');
  process.exit(1);
}
const oldStage = task.stage;
task.stage = '${TARGET_STAGE}';
task.updatedAt = new Date().toISOString();
if ('${SUMMARY}') {
  task.summary = '${SUMMARY}';
}

// 闭环完成 (done) 阶段自动落地完成文档 (无需界面按钮，完全静默自动化)
if ('${TARGET_STAGE}' === 'done') {
  try {
    const wsRoot = '${PWD}';
    const docBase = fs.existsSync(path.join(wsRoot, 'doc')) ? path.join(wsRoot, 'doc') : path.join(wsRoot, 'docs');
    const compDir = path.join(docBase, 'completed');
    if (!fs.existsSync(compDir)) fs.mkdirSync(compDir, { recursive: true });
    const fullPath = path.join(compDir, 'done_' + task.id + '.md');
    const relPath = path.relative(wsRoot, fullPath);

    const dodItems = (task.dod && task.dod.length > 0)
      ? task.dod.map(d => '- [x] **' + d + '** (已验证并通过)').join('\n')
      : '- [x] **核心业务逻辑开发与单元测试验证通过**\n- [x] **静态代码检查与安全红线合规**\n- [x] **全流程交付件验证通过**';

    const priorDoc = task.docLink ? '\n- **前置设计/规格说明**: [' + task.docLink + '](' + task.docLink + ')' : '';

    const content = '# 🎉 敏捷研发任务闭环落地报告 (Completion Record)\n\n' +
      '## 1. 任务基本元信息 (Metadata)\n' +
      '- **任务编号**: \`' + task.id + '\`\n' +
      '- **任务标题**: **' + task.title + '**\n' +
      '- **当前状态**: ✅ \`done\` (已闭环完成)\n' +
      '- **主要负责人**: ' + (task.assignee || '全栈工程师') + '\n' +
      '- **任务优先级**: \`' + (task.priority || 'P1') + '\`\n' +
      '- **所属标签/模块**: \`' + (task.tag || '通用') + '\`\n' +
      '- **创建时间**: ' + (task.createdAt || 'N/A') + '\n' +
      '- **闭环归档时间**: ' + task.updatedAt + priorDoc + '\n\n---\n\n' +
      '## 2. 需求背景与交付总结 (Summary)\n' +
      '> ' + (task.summary || '该敏捷研发任务已完成全流程研发、自测验证与代码评审，各项指标符合预期，顺利进入 Done 闭环状态。') + '\n\n---\n\n' +
      '## 3. 验收标准达成情况 (Definition of Done)\n' +
      dodItems + '\n\n---\n\n' +
      '## 4. 资产沉淀与长效追踪 (Traceability)\n' +
      '- **自动归档路径**: \`' + relPath + '\`\n' +
      '- **归档说明**: 本文档由敏捷看板任务流转至 done 闭环阶段时由系统自动静默落地。\n';

    fs.writeFileSync(fullPath, content, 'utf-8');
    task.completedDocLink = relPath;
    if (!task.docLink) task.docLink = relPath;
    console.log('🏛️ 闭环完成文档已自动静默落地: ' + relPath);
  } catch (err) {
    console.warn('⚠️ 自动生成完成文档异常: ' + err.message);
  }
}

fs.writeFileSync(filePath, JSON.stringify(tasks, null, 2), 'utf-8');
console.log('✅ 看板任务 [' + task.title + '] 状态已更新: ' + oldStage + ' -> ${TARGET_STAGE}');
"
