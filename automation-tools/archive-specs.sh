#!/bin/bash
# ==============================================================================
# 自动化工具: archive-specs.sh
# 作用: 在 AI 功能开发完成并合并代码后，自动将过程资产 (implementation_plan.md & walkthrough.md)
#       合并归档至 docs/specs/archive/YYYY-MM-DD-feature-name.md，保持项目目录整洁。
# ==============================================================================

set -euo pipefail

FEATURE_NAME="${1:-}"
PROJECT_DIR="${2:-.}"

if [ -z "$FEATURE_NAME" ]; then
    echo "❌ 错误: 请指定功能名称标识 (Feature Name)。" >&2
    echo "用法: $0 <feature-name> [project_directory]" >&2
    echo "示例: $0 auth-jwt-refresh" >&2
    exit 1
fi

abs_project_dir="$(cd "$PROJECT_DIR" && pwd)"
SPECS_DIR="$abs_project_dir/docs/specs"
ARCHIVE_DIR="$SPECS_DIR/archive"

PLAN_FILE="$SPECS_DIR/implementation_plan.md"
WALKTHROUGH_FILE="$SPECS_DIR/walkthrough.md"

if [ ! -f "$PLAN_FILE" ] && [ ! -f "$WALKTHROUGH_FILE" ]; then
    echo "⚠️ 警告: 未在 '$SPECS_DIR' 下找到待归档的 implementation_plan.md 或 walkthrough.md 文件。"
    exit 0
fi

mkdir -p "$ARCHIVE_DIR"

TODAY="$(date '+%Y-%m-%d')"
ARCHIVE_FILE="$ARCHIVE_DIR/${TODAY}-${FEATURE_NAME}.md"

echo "# 🏛️ 过程资产归档: ${FEATURE_NAME}" > "$ARCHIVE_FILE"
echo "归档日期: ${TODAY}" >> "$ARCHIVE_FILE"
echo "项目路径: \`${abs_project_dir}\`" >> "$ARCHIVE_FILE"
echo "" >> "$ARCHIVE_FILE"

if [ -f "$PLAN_FILE" ]; then
    echo "---" >> "$ARCHIVE_FILE"
    echo "## 📄 实施方案设计 (Implementation Plan Archive)" >> "$ARCHIVE_FILE"
    echo "" >> "$ARCHIVE_FILE"
    cat "$PLAN_FILE" >> "$ARCHIVE_FILE"
    echo "" >> "$ARCHIVE_FILE"
fi

if [ -f "$WALKTHROUGH_FILE" ]; then
    echo "---" >> "$ARCHIVE_FILE"
    echo "## 📄 改动与验证报告 (Walkthrough Archive)" >> "$ARCHIVE_FILE"
    echo "" >> "$ARCHIVE_FILE"
    cat "$WALKTHROUGH_FILE" >> "$ARCHIVE_FILE"
    echo "" >> "$ARCHIVE_FILE"
fi

# 归档成功后清理源文件
[ -f "$PLAN_FILE" ] && rm "$PLAN_FILE"
[ -f "$WALKTHROUGH_FILE" ] && rm "$WALKTHROUGH_FILE"

echo "✅ 过程资产已成功归档至: $ARCHIVE_FILE"
echo "🧹 源设计与验证文件已自动清理。"
