#!/bin/bash
# ==============================================================================
# automation-tools/record-feedback.sh
# 作用: 快速将其他项目中的 AI 错误/失败案例沉淀为结构化反馈，并注册至全局优化看板
# 适配: 可由 AI 会话内直接调用，或由开发者在终端执行
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STANDARDS_DIR="$(dirname "$SCRIPT_DIR")"
FEEDBACK_DIR="${STANDARDS_DIR}/feedback"
INBOX_DIR="${FEEDBACK_DIR}/inbox"
KANBAN_FILE="${FEEDBACK_DIR}/FEEDBACK_KANBAN.md"

mkdir -p "$INBOX_DIR"

PROJECT_NAME="${1:-$(basename "$(pwd)")}"
CATEGORY="${2:-代码逻辑缺陷}"
SUMMARY="${3:-}"
DETAILS_FILE="${4:-}"

if [ -z "$SUMMARY" ]; then
    echo "❌ 错误: 必须提供错误简述 (Summary)"
    echo "用法: $0 <项目名> <错误分类> <简要描述> [详情Markdown临时文件路径]"
    exit 1
fi

DATE_STR="$(date +%Y-%m-%d)"
TIME_STR="$(date '+%Y-%m-%d %H:%M:%S')"
SLUG="$(echo "$SUMMARY" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-zA-Z0-9]+/-/g' | sed -E 's/^-+|-+$//g' | cut -c 1-30)"
[ -z "$SLUG" ] && SLUG="case"

TARGET_FILE="${INBOX_DIR}/${DATE_STR}_${PROJECT_NAME}_${SLUG}.md"

# 检查是否已存在同名文件，避免覆盖
COUNT=1
ORIGINAL_TARGET="$TARGET_FILE"
while [ -f "$TARGET_FILE" ]; do
    TARGET_FILE="${INBOX_DIR}/${DATE_STR}_${PROJECT_NAME}_${SLUG}_${COUNT}.md"
    COUNT=$((COUNT + 1))
done

if [ -n "$DETAILS_FILE" ] && [ -f "$DETAILS_FILE" ]; then
    cp "$DETAILS_FILE" "$TARGET_FILE"
else
    cat << EOF > "$TARGET_FILE"
# [AI 交互错误与偏离反馈] ${PROJECT_NAME} - ${SUMMARY}

## 1. 基础元数据 (Metadata)
- **上报时间**: ${TIME_STR}
- **来源项目**: \`${PROJECT_NAME}\`
- **项目路径**: \`$(pwd -P)\`
- **主要技术栈**: 通用
- **错误分类**: \`${CATEGORY}\`
- **当前处理状态**: \`待评估\`

---

## 2. 现场还原与失败现象 (Failure Context)
### 2.1 任务目标与上下文
${SUMMARY}

### 2.2 AI 的错误表现 (What AI Did Wrong)
*待补充具体的错误表现或幻觉逻辑*

### 2.3 关键报错信息 / 异常现场代码 (Logs & Snippets)
\`\`\`text
(现场日志或代码片段)
\`\`\`

---

## 3. 用户纠偏与正确做法 (Expected Behavior)
### 3.1 用户的纠正或期望结果
*请记录开发者的期望或指示*

---

## 4. 根因剖析与方案制定 (Root Cause & Solution Plan)
- **根因定位**: 待评估
- **优化与改进方案**: 待制定
EOF
fi

# 更新看板表格
REL_PATH="feedback/inbox/$(basename "$TARGET_FILE")"
NEW_ROW="| *NEW* | *${DATE_STR}* | *${PROJECT_NAME}* | *${CATEGORY}* | [${SUMMARY}](${REL_PATH}) | \`待评估\` | *待制定方案* |"

if [ -f "$KANBAN_FILE" ]; then
    # 在示例行之后插入新记录
    awk -v row="$NEW_ROW" '
        /\| \*示例-001\*/ {
            print $0
            print row
            next
        }
        { print }
    ' "$KANBAN_FILE" > "${KANBAN_FILE}.tmp" && mv "${KANBAN_FILE}.tmp" "$KANBAN_FILE"
fi

echo "✅ 反馈已成功录入全局优化池！"
echo "  📄 反馈详情: $TARGET_FILE"
echo "  📋 优化看板: $KANBAN_FILE"
