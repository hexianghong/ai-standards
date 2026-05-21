#!/bin/bash
# 这个脚本用于在你的已有项目下，自动检测技术栈并创建指向全局 AI 规范的软链接，支持中英文版本及主流 AI IDE 自动加载。

# 1. 解析命令行参数
LANGUAGE=""
UPDATE_MODE=0
while [[ "$#" -gt 0 ]]; do
    case $1 in
        -en|--en|--english) LANGUAGE="en" ;;
        -cn|--cn|--chinese) LANGUAGE="cn" ;;
        -u|--update) UPDATE_MODE=1 ;;
        -h|--help)
            echo "用法: $0 [选项]"
            echo "选项:"
            echo "  -en, --en, --english    注入英文版规范 (Inject English rules) [默认]"
            echo "  -cn, --cn, --chinese    注入中文版规范 (Inject Chinese rules)"
            echo "  -u, --update            更新已有的 AI 规范软链接 (Update existing AI rules links)"
            echo "  -h, --help              显示此帮助信息"
            exit 0
            ;;
        *) echo "❌ 未知参数: $1"; exit 1 ;;
    esac
    shift
done

# 2. 交互式选择语言（如果未通过命令行指定且在交互式终端中运行）
if [ -z "$LANGUAGE" ] && [ -t 0 ]; then
    echo "🌐 请选择 AI 规则语言版本 / Select rule language:"
    echo "  1) English (英文) [默认 / Default]"
    echo "  2) 中文 (Chinese)"
    read -r -p "请输入序号 (1 或 2): " lang_choice
    if [ "$lang_choice" = "2" ]; then
        LANGUAGE="cn"
    else
        LANGUAGE="en"
    fi
fi

# 兜底默认语言为英文（最适合 AI 消费）
if [ -z "$LANGUAGE" ]; then
    LANGUAGE="en"
fi

# 3. 动态获取规范仓库的绝对路径并确定源文件
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STANDARDS_DIR="$(dirname "$SCRIPT_DIR")"

if [ "$LANGUAGE" = "cn" ]; then
    INSTRUCTIONS_PATH="${STANDARDS_DIR}/doc/core-rules/INSTRUCTIONS.md"
    if [ $UPDATE_MODE -eq 1 ]; then
        echo "🔄 将使用【中文版】规范（来自 doc/）进行项目更新..."
    else
        echo "🇨🇳 将使用【中文版】规范（来自 doc/）进行项目注入..."
    fi
else
    INSTRUCTIONS_PATH="${STANDARDS_DIR}/core-rules/INSTRUCTIONS.md"
    if [ $UPDATE_MODE -eq 1 ]; then
        echo "🔄 将使用【英文版】规范（来自 根目录）进行项目更新..."
    else
        echo "🇬🇧 将使用【英文版】规范（来自 根目录）进行项目注入..."
    fi
fi

if [ ! -f "$INSTRUCTIONS_PATH" ]; then
    echo "❌ 错误: 找不到最高总控文件: $INSTRUCTIONS_PATH"
    exit 1
fi

# 4. 自动检测项目技术栈
DETECTED_STACKS=()
IS_VALID_PROJECT=0

if [ -f "go.mod" ]; then
    DETECTED_STACKS+=("Go")
    IS_VALID_PROJECT=1
fi

if [ -f "pom.xml" ] || [ -f "build.gradle" ] || [ -f "build.gradle.kts" ]; then
    DETECTED_STACKS+=("Java")
    IS_VALID_PROJECT=1
fi

if [ -f "package.json" ]; then
    IS_VALID_PROJECT=1
    if grep -q '"vue"' package.json; then
        DETECTED_STACKS+=("Vue")
    elif grep -q '"react"' package.json; then
        DETECTED_STACKS+=("React")
    else
        DETECTED_STACKS+=("Node.js/JS/TS")
    fi
fi

if [ -f "requirements.txt" ] || [ -f "pyproject.toml" ] || [ -f "setup.py" ]; then
    DETECTED_STACKS+=("Python")
    IS_VALID_PROJECT=1
fi

if [ -f "Cargo.toml" ]; then
    DETECTED_STACKS+=("Rust")
    IS_VALID_PROJECT=1
fi

if [ -f "GEMINI.md" ] || [ -f "GEMINI_GLOBAL.md" ] || [ -f ".cursorrules" ] || [ -f ".clinerules" ]; then
    IS_VALID_PROJECT=1
fi

if [ $IS_VALID_PROJECT -eq 0 ]; then
    if [ "$LANGUAGE" = "cn" ]; then
        echo "⚠️  未检测到标准项目标志 (如 go.mod, pom.xml, package.json 等)。"
        if [ $UPDATE_MODE -eq 1 ]; then
            echo "是否仍要更新 AI 规范标准？(y/N)"
        else
            echo "是否仍要注入 AI 规范标准？(y/N)"
        fi
    else
        echo "⚠️  No standard project files detected (like go.mod, pom.xml, package.json)."
        if [ $UPDATE_MODE -eq 1 ]; then
            echo "Do you still want to update AI rules? (y/N)"
        else
            echo "Do you still want to inject AI rules? (y/N)"
        fi
    fi
    read -r response
    if [[ ! "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo "❌ Cancelled."
        exit 1
    fi
fi

# 输出检测到的技术栈
if [ ${#DETECTED_STACKS[@]} -ne 0 ]; then
    if [ "$LANGUAGE" = "cn" ]; then
        echo "🔍 检测到当前项目技术栈: ${DETECTED_STACKS[*]}"
    else
        echo "🔍 Detected project technology stacks: ${DETECTED_STACKS[*]}"
    fi
else
    if [ "$LANGUAGE" = "cn" ]; then
        echo "ℹ️  未识别出具体技术栈，将使用通用配置注入。"
    else
        echo "ℹ️  No specific stack identified, using general configuration."
    fi
fi

# 自动清理与排除函数定义
cleanup_broken_links() {
    local files=(
        "./GEMINI_GLOBAL.md"
        "./.cursorrules"
        "./.clinerules"
        "./.github/copilot-instructions.md"
    )
    for f in "${files[@]}"; do
        if [ -L "$f" ] && [ ! -e "$f" ]; then
            rm "$f"
            if [ "$LANGUAGE" = "cn" ]; then
                echo "  🧹 已清除失效软链接: $f"
            else
                echo "  🧹 Removed broken symlink: $f"
            fi
        fi
    done

    # 清除 .cursor/rules/ 下失效的 mdc 软链接
    if [ -d "./.cursor/rules" ]; then
        for f in ./.cursor/rules/*.mdc; do
            if [ -L "$f" ] && [ ! -e "$f" ]; then
                rm "$f"
                if [ "$LANGUAGE" = "cn" ]; then
                    echo "  🧹 已清除失效 mdc 软链接: $f"
                else
                    echo "  🧹 Removed broken mdc symlink: $f"
                fi
            fi
        done
    fi
}

update_gitignore() {
    local file=$1
    local gitignore_path="./.gitignore"
    if [ ! -f "$gitignore_path" ]; then
        touch "$gitignore_path"
    fi
    
    # 检查是否已忽略（支持 /file 或 file 匹配）
    if ! grep -F -q -x "$file" "$gitignore_path" && ! grep -F -q -x "/$file" "$gitignore_path"; then
        # 确保文件以换行符结尾
        if [ -s "$gitignore_path" ] && [ -n "$(tail -c 1 "$gitignore_path" 2>/dev/null)" ]; then
            echo "" >> "$gitignore_path"
        fi
        echo "/$file" >> "$gitignore_path"
        if [ "$LANGUAGE" = "cn" ]; then
            echo "  ➕ 已将 /$file 添加至 .gitignore"
        else
            echo "  ➕ Added /$file to .gitignore"
        fi
    fi
}

exclude_generated_files() {
    if [ "$LANGUAGE" = "cn" ]; then
        echo "🛡️  正在更新 .gitignore 以排除生成的文件及本地过程资产..."
    else
        echo "🛡️  Updating .gitignore to exclude generated files and local process assets..."
    fi

    # 排除主要的软链接
    update_gitignore "GEMINI_GLOBAL.md"
    update_gitignore ".cursorrules"
    update_gitignore ".clinerules"
    update_gitignore ".github/copilot-instructions.md"

    # 排除 Cursor MDC 规则软链接
    update_gitignore ".cursor/rules/global-instructions.mdc"
    update_gitignore ".cursor/rules/security-guardrails.mdc"
    update_gitignore ".cursor/rules/backend-go.mdc"
    update_gitignore ".cursor/rules/backend-java.mdc"
    update_gitignore ".cursor/rules/frontend-vue.mdc"
    update_gitignore ".cursor/rules/frontend-react.mdc"

    # 排除 AI 智能体开发过程资产文件
    update_gitignore "implementation_plan.md"
    update_gitignore "task.md"
    update_gitignore "walkthrough.md"
}

# 5. 建立指向全局规范总控的软链接 (支持多 AI 客户端)
if [ "$LANGUAGE" = "cn" ]; then
    echo "🔗 正在建立 AI 规范软链接..."
else
    echo "🔗 Creating AI rules symbolic links..."
fi

# 在创建前，清理所有可能存在的失效软链接
cleanup_broken_links

# 通用/Gemini 规范路径
ln -sf "$INSTRUCTIONS_PATH" ./GEMINI_GLOBAL.md
echo "  🔹 GEMINI_GLOBAL.md"

# Cursor 规则文件
ln -sf "$INSTRUCTIONS_PATH" ./.cursorrules
echo "  🔹 .cursorrules"

# Cline 规则文件
ln -sf "$INSTRUCTIONS_PATH" ./.clinerules
echo "  🔹 .clinerules"

# GitHub Copilot 规则文件
mkdir -p .github
ln -sf "$INSTRUCTIONS_PATH" ./.github/copilot-instructions.md
echo "  🔹 .github/copilot-instructions.md"

# 6. Cursor 2026 最新 .cursor/rules/*.mdc 模块化规则支持
if [ "$LANGUAGE" = "cn" ]; then
    echo "📂 正在建立 Cursor 最新 .mdc 模块化规则软链接..."
else
    echo "📂 Creating Cursor .mdc modular rules symbolic links..."
fi

mkdir -p .cursor/rules

# 全局与安全
if [ "$LANGUAGE" = "cn" ]; then
    ln -sf "${STANDARDS_DIR}/doc/core-rules/mdc/global-instructions.mdc" .cursor/rules/global-instructions.mdc
    ln -sf "${STANDARDS_DIR}/doc/core-rules/mdc/security-guardrails.mdc" .cursor/rules/security-guardrails.mdc
    echo "  🔹 .cursor/rules/global-instructions.mdc"
    echo "  🔹 .cursor/rules/security-guardrails.mdc"
else
    ln -sf "${STANDARDS_DIR}/core-rules/mdc/global-instructions.mdc" .cursor/rules/global-instructions.mdc
    ln -sf "${STANDARDS_DIR}/core-rules/mdc/security-guardrails.mdc" .cursor/rules/security-guardrails.mdc
    echo "  🔹 .cursor/rules/global-instructions.mdc"
    echo "  🔹 .cursor/rules/security-guardrails.mdc"
fi

# 按需链接技术栈模版
for stack in "${DETECTED_STACKS[@]}"; do
    case $stack in
        "Go")
            if [ "$LANGUAGE" = "cn" ]; then
                ln -sf "${STANDARDS_DIR}/doc/stack-templates/mdc/backend-go.mdc" .cursor/rules/backend-go.mdc
            else
                ln -sf "${STANDARDS_DIR}/stack-templates/mdc/backend-go.mdc" .cursor/rules/backend-go.mdc
            fi
            echo "  🔹 .cursor/rules/backend-go.mdc"
            ;;
        "Java")
            if [ "$LANGUAGE" = "cn" ]; then
                ln -sf "${STANDARDS_DIR}/doc/stack-templates/mdc/backend-java.mdc" .cursor/rules/backend-java.mdc
            else
                ln -sf "${STANDARDS_DIR}/stack-templates/mdc/backend-java.mdc" .cursor/rules/backend-java.mdc
            fi
            echo "  🔹 .cursor/rules/backend-java.mdc"
            ;;
        "Vue")
            if [ "$LANGUAGE" = "cn" ]; then
                ln -sf "${STANDARDS_DIR}/doc/stack-templates/mdc/frontend-vue.mdc" .cursor/rules/frontend-vue.mdc
            else
                ln -sf "${STANDARDS_DIR}/stack-templates/mdc/frontend-vue.mdc" .cursor/rules/frontend-vue.mdc
            fi
            echo "  🔹 .cursor/rules/frontend-vue.mdc"
            ;;
        "React")
            if [ "$LANGUAGE" = "cn" ]; then
                ln -sf "${STANDARDS_DIR}/doc/stack-templates/mdc/frontend-react.mdc" .cursor/rules/frontend-react.mdc
            else
                ln -sf "${STANDARDS_DIR}/stack-templates/mdc/frontend-react.mdc" .cursor/rules/frontend-react.mdc
            fi
            echo "  🔹 .cursor/rules/frontend-react.mdc"
            ;;
    esac
done

# 7. 自动初始化本地专属 GEMINI.md 业务上下文 (防覆盖)
if [ ! -f "GEMINI.md" ]; then
    if [ "$LANGUAGE" = "cn" ]; then
        echo "📝 正在初始化项目专属业务上下文模板: GEMINI.md ..."
        cat << 'EOF' > GEMINI.md
# [项目名称] 业务上下文 (GEMINI.md)

## 1. 业务背景与核心功能 (Context)
- **业务背景**: 简述此项目是什么、主要解决什么问题、服务于什么核心业务。
- **核心数据流**: 简述核心业务流程及关键实体。
- **系统架构**: 采用什么框架、数据库，以及对外的核心 API 接口。

## 2. 项目独有开发规则 (Local Rules)
- *在此处列出本项目特有的规则，例如特定的目录划分、强加的安全限制或特定库的使用规范。*

## 3. 本地可用技能与自动化脚本 (Local Skills & Scripts)
- **运行/开发**: `npm run dev` / `go run main.go`
- **构建/测试**: `npm run build` / `go test ./...`
- **自动化工具**: 如有内置的代码生成器、表迁移脚本，写在此处。AI 收到修改指令时，会优先调用此区域列出的命令或脚本。

## 4. 本地推荐 MCP 服务 (Recommended MCP Servers)
- **Database MCP**: `postgresql://...` 或 SQLite 等（方便 AI 自动获取表结构 Schema 进行精准开发）。
- **Git MCP**: 辅助 AI 进行精准的版本控制和分支管理。
- **Filesystem MCP**: 优化大型代码库的文件精准检索。

## 5. 项目核心符号与领域模型 (Domain Symbols - 仓库图谱)
- **核心接口/契约**: 列出项目中最关键的公共接口、服务定义文件路径（例如 `domain/service/order.go` 或 `IUserService.java`）。
- **核心模型/实体**: 列出关键的数据库实体或领域对象声明（例如 `model/user.go` 或 `User.java`）。
- *开发前，AI 智能体应优先参考这些符号骨架声明，避免盲目打开实现细节或重复编写相似的工具类。*
EOF
        echo "  🔹 GEMINI.md 模板生成成功！请根据您的具体项目修改完善它。"
    else
        echo "📝 Initializing project-specific context template: GEMINI.md ..."
        cat << 'EOF' > GEMINI.md
# [Project Name] Business Context (GEMINI.md)

## 1. Business Background & Core Functions (Context)
- **Background**: What this project does and what business goal it solves.
- **Core Flows**: Crucial business sequences and system interactions.
- **System Architecture**: Libraries, databases, and major interface details.

## 2. Project-Specific Local Rules (Local Rules)
- *List rules specific to this repository (e.g. directory conventions, security rules).*

## 3. Local Skills & Automation Scripts (Local Skills & Scripts)
- **Run/Dev**: `npm run dev` / `go run main.go`
- **Build/Test**: `npm run build` / `go test ./...`
- **Automation tools**: List local generators or migration tools here. The AI will prioritize executing these scripts.

## 4. Recommended Local MCP Servers (Recommended MCP Servers)
- **Database MCP**: URL or configuration (enables AI to query schema properties).
- **Git MCP**: Assisting with git operations.
- **Filesystem MCP**: Optimization for indexing larger projects.

## 5. Domain Symbols & Core Models (Domain Symbols - Repository Map)
- **Core Interfaces/Contracts**: List the most critical public interface or service definitions paths (e.g. `domain/service/order.go` or `IUserService.java`).
- **Core Models/Entities**: List crucial database entities or domain objects declarations (e.g. `model/user.go` or `User.java`).
- *Before coding, AI agents must prioritize reviewing these skeletal symbols to avoid loading deep implementation bodies or writing redundant utilities.*
EOF
        echo "  🔹 GEMINI.md template created successfully!"
    fi
else
    if [ "$LANGUAGE" = "cn" ]; then
        echo "ℹ️  检测到当前项目下已存在 GEMINI.md，跳过生成，避免覆盖您的配置。"
    else
        echo "ℹ️  GEMINI.md already exists, skipping template creation."
    fi
fi

# 8. 自动更新 .gitignore 排除规则
exclude_generated_files

if [ "$LANGUAGE" = "cn" ]; then
    if [ $UPDATE_MODE -eq 1 ]; then
        echo "✅ 全局 AI 规范标准更新成功！"
    else
        echo "✅ 全局 AI 规范标准注入成功！"
    fi
    echo "👉 现在你可以直接在各大 AI IDE (Cursor / Cline / Copilot 等) 中唤醒 AI，AI 将自动加载全局标准。"
else
    if [ $UPDATE_MODE -eq 1 ]; then
        echo "✅ Global AI rules successfully updated!"
    else
        echo "✅ Global AI rules successfully injected!"
    fi
    echo "👉 You can now wake up AI in Cursor / Cline / Copilot, and the rules will be loaded automatically."
fi
