#!/bin/bash
# ==============================================================================
# 自动化工具: gen-repo-map.sh
# 作用: 自动生成当前项目的目录结构与核心接口/类符号大纲大图 (Repository Map)，
#       供 AI 智能体在规划阶段精准掌握项目结构，避免上下文污染。
# ==============================================================================

set -euo pipefail

TARGET_DIR="${1:-.}"
OUTPUT_FILE="${2:-}"

if [ ! -d "$TARGET_DIR" ]; then
    echo "❌ Error: Target directory '$TARGET_DIR' does not exist." >&2
    exit 1
fi

abs_target_dir="$(cd "$TARGET_DIR" && pwd)"

generate_map() {
    echo "# 🗺️ 项目知识地图大纲 (Repository Map)"
    echo "生成的根目录: \`$abs_target_dir\`"
    echo "生成时间: $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""
    echo "## 📁 目录及文件层级大纲"
    echo "\`\`\`text"
    
    # 优先使用 tree 命令（若存在），否则使用 find 命令提取结构
    if command -v tree >/dev/null 2>&1; then
        tree -L 3 -I "node_modules|.git|vendor|target|dist|.idea|.vscode|.gemini|brain|bin" "$abs_target_dir"
    else
        find "$abs_target_dir" -maxdepth 3 \
            \( -path "*/node_modules" -o -path "*/.git" -o -path "*/vendor" -o -path "*/target" -o -path "*/dist" -o -path "*/.gemini" \) -prune \
            -o -print | sort | sed -e "s#^$abs_target_dir#.#" | sed -e 's/[^/]*\//  /g'
    fi
    
    echo "\`\`\`"
    echo ""
    echo "## 🧩 核心符号与接口契约声明 (Symbol Outlines)"
    echo ""
    
    # 提取 Go 核心接口与结构体
    if find "$abs_target_dir" -maxdepth 3 -name "*.go" -not -path "*/vendor/*" | grep -q .; then
        echo "### 🐹 Go 核心接口与 Struct 声明"
        echo "\`\`\`go"
        grep -rnE "^type +[A-Za-z0-9_]+ +(interface|struct)" "$abs_target_dir" --exclude-dir={vendor,.git,node_modules} | head -n 30 || true
        echo "\`\`\`"
        echo ""
    fi

    # 提取 Java 核心接口与 Controller
    if find "$abs_target_dir" -maxdepth 3 \( -name "*.java" \) -not -path "*/target/*" | grep -q .; then
        echo "### ☕ Java 核心 Interface / Class / Controller 声明"
        echo "\`\`\`java"
        grep -rnE "^(public +)?(interface|class|enum) +[A-Za-z0-9_]+" "$abs_target_dir" --exclude-dir={target,.git,build} | head -n 30 || true
        echo "\`\`\`"
        echo ""
    fi

    # 提取 TS / JS / Vue 接口与组件 Props
    if find "$abs_target_dir" -maxdepth 3 \( -name "*.ts" -o -name "*.tsx" -o -name "*.vue" \) -not -path "*/node_modules/*" | grep -q .; then
        echo "### 🌐 TS / React / Vue 核心 Type 与 Interface 声明"
        echo "\`\`\`typescript"
        grep -rnE "^(export +)?(interface|type) +[A-Za-z0-9_]+" "$abs_target_dir" --exclude-dir={node_modules,.git,dist} | head -n 30 || true
        echo "\`\`\`"
        echo ""
    fi

    # 提取 Python 核心 Class 与函数定义
    if find "$abs_target_dir" -maxdepth 3 -name "*.py" -not -path "*/venv/*" -not -path "*/.venv/*" | grep -q .; then
        echo "### 🐍 Python 核心 Class 与函数声明"
        echo "\`\`\`python"
        grep -rnE "^(class +[A-Za-z0-9_]+|def +[A-Za-z0-9_]+ *\()" "$abs_target_dir" --exclude-dir={venv,.venv,__pycache__,.git} | head -n 30 || true
        echo "\`\`\`"
        echo ""
    fi

    # 提取 Rust 核心 Struct, Enum, Trait 声明
    if find "$abs_target_dir" -maxdepth 3 -name "*.rs" -not -path "*/target/*" | grep -q .; then
        echo "### 🦀 Rust 核心 Struct / Enum / Trait / Fn 声明"
        echo "\`\`\`rust"
        grep -rnE "^ *(pub +)?(struct|enum|trait|fn) +[A-Za-z0-9_]+" "$abs_target_dir" --exclude-dir={target,.git} | head -n 30 || true
        echo "\`\`\`"
        echo ""
    fi
}

if [ -n "$OUTPUT_FILE" ]; then
    generate_map > "$OUTPUT_FILE"
    echo "✅ 知识地图提取成功，已保存至: $OUTPUT_FILE"
else
    generate_map
fi
