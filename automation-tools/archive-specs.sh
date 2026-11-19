#!/bin/bash
set -euo pipefail
# ==============================================================================
# 自动化工具: archive-specs.sh
# 作用: 在 AI 功能开发完成并合并代码后，自动将过程资产 (implementation_plan.md & walkthrough.md)
#       合并归档至 docs/specs/archive/YYYY-MM-DD-feature-name.md，保持项目目录整洁。
# ==============================================================================

FEATURE_NAME="${1:-}"
PROJECT_DIR="${2:-.}"

if [ -z "$FEATURE_NAME" ]; then
    echo "❌ 错误: 请指定功能名称标识 (Feature Name)。" >&2
    echo "用法: $0 docs/specs/<需求编号>-<名称> [project_directory]" >&2
    echo "旧版平铺归档: $0 <feature-name> [project_directory]" >&2
    exit 1
fi

abs_project_dir="$(cd "$PROJECT_DIR" && pwd)"
SPECS_DIR="$abs_project_dir/docs/specs"
ARCHIVE_DIR="$SPECS_DIR/archive"

if [[ "$FEATURE_NAME" == */* ]]; then
    if [[ ! "$FEATURE_NAME" =~ ^docs/specs/[a-zA-Z0-9_][a-zA-Z0-9_-]*$ || "$FEATURE_NAME" == 'docs/specs/archive' ]]; then
        echo "无效的需求目录：$FEATURE_NAME" >&2
        exit 1
    fi
    feature_dir="$(cd "$abs_project_dir/$FEATURE_NAME" && pwd -P)"
    if [[ "$feature_dir" != "$(cd "$abs_project_dir" && pwd -P)/$FEATURE_NAME" ]]; then
        echo "需求目录必须位于目标项目内，且使用实际目录。" >&2
        exit 1
    fi

    script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
    node "$script_dir/check-specs.js" done "$feature_dir"
    archive_tmp="$(mktemp "$feature_dir/.archive.XXXXXX")"
    trap 'rm -f -- "$archive_tmp"' EXIT
    {
        printf '# 过程资产归档 · %s\n' "${FEATURE_NAME##*/}"
        for document in spec.md implementation_plan.md task.md walkthrough.md; do
            printf '\n---\n\n## %s\n\n' "$document"
            cat "$feature_dir/$document"
            printf '\n'
        done
    } > "$archive_tmp"
    if [[ -f "$feature_dir/archive.md" ]] && cmp -s "$archive_tmp" "$feature_dir/archive.md"; then
        echo "归档已是最新：$FEATURE_NAME/archive.md"
    else
        mv -f -- "$archive_tmp" "$feature_dir/archive.md"
        echo "归档成功：$FEATURE_NAME/archive.md"
    fi
    exit 0
fi

if [[ ! "$FEATURE_NAME" =~ ^[a-zA-Z0-9_][a-zA-Z0-9_-]*$ ]]; then
    echo "无效的旧版归档名称：$FEATURE_NAME" >&2
    exit 1
fi

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
