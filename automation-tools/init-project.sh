#!/bin/bash
# ==============================================================================
# automation-tools/init-project.sh
# 作用: 为目标项目一键注入 Antigravity 全局规约 (GEMINI_GLOBAL.md) 与原生技能库 (.agents/skills)，
#       并根据检测到的技术栈动态初始化本地业务上下文 (GEMINI.md) 与错题本 (LEARNING.md)。
# 专享适配: Google DeepMind Antigravity IDE
# ==============================================================================

set -euo pipefail

UPDATE_MODE=0
while [[ "$#" -gt 0 ]]; do
    case $1 in
        -u|--update) UPDATE_MODE=1 ;;
        -h|--help)
            echo "用法: $0 [选项]"
            echo "选项:"
            echo "  -u, --update    更新已有项目的 AI 规约软链接与环境配置"
            echo "  -h, --help      显示此帮助信息"
            exit 0
            ;;
        *) echo "❌ 未知参数: $1"; exit 1 ;;
    esac
    shift
done

# 动态获取规范仓库的绝对路径并确定源文件 (单一事实来源 SSOT)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STANDARDS_DIR="$(dirname "$SCRIPT_DIR")"
INSTRUCTIONS_PATH="${STANDARDS_DIR}/core-rules/INSTRUCTIONS.md"
SKILLS_PATH="${STANDARDS_DIR}/stack-templates/skills"
MCP_CONFIG_PATH="${STANDARDS_DIR}/.agents/mcp_config.json"
WEB_CHAT_PATH="${STANDARDS_DIR}/.agents/gemini-web-chat"

if [ ! -f "$INSTRUCTIONS_PATH" ]; then
    echo "❌ 错误: 找不到最高执行总控文件: $INSTRUCTIONS_PATH" >&2
    exit 1
fi

if [ $UPDATE_MODE -eq 1 ]; then
    echo "🔄 正在更新项目 Antigravity AI 规约标准与技能库软链接..."
else
    echo "🚀 正在为当前项目注入 Antigravity 全局 AI 规约标准..."
fi

# 自动检测项目技术栈
DETECTED_STACKS=()
IS_VALID_PROJECT=0
PRIMARY_STACK=""
RUN_CMD=""
TEST_CMD=""
STACK_DOC_LINK=""

if [ -f "go.mod" ]; then
    DETECTED_STACKS+=("Go")
    PRIMARY_STACK="Go"
    RUN_CMD="go run main.go"
    TEST_CMD="go test -v ./..."
    STACK_DOC_LINK="- **后端 Go 研发规范**: [backend-go-standard.md](${STANDARDS_DIR}/stack-templates/backend-go-standard.md)"
    IS_VALID_PROJECT=1
fi

if [ -f "pom.xml" ] || [ -f "build.gradle" ] || [ -f "build.gradle.kts" ]; then
    DETECTED_STACKS+=("Java")
    [ -z "$PRIMARY_STACK" ] && PRIMARY_STACK="Java"
    [ -z "$RUN_CMD" ] && RUN_CMD="mvn spring-boot:run"
    [ -z "$TEST_CMD" ] && TEST_CMD="mvn test"
    STACK_DOC_LINK="${STACK_DOC_LINK}\n- **Java 微服务规范**: [backend-java-standard.md](${STANDARDS_DIR}/stack-templates/backend-java-standard.md)"
    IS_VALID_PROJECT=1
fi

if [ -f "package.json" ]; then
    IS_VALID_PROJECT=1
    if grep -q '"vue"' package.json; then
        DETECTED_STACKS+=("Vue")
        [ -z "$PRIMARY_STACK" ] && PRIMARY_STACK="Vue"
        [ -z "$RUN_CMD" ] && RUN_CMD="npm run dev"
        [ -z "$TEST_CMD" ] && TEST_CMD="npm run test"
        STACK_DOC_LINK="${STACK_DOC_LINK}\n- **前端 Vue3 规范**: [frontend-vue3-tailwind.md](${STANDARDS_DIR}/stack-templates/frontend-vue3-tailwind.md)"
    elif grep -q '"react"' package.json; then
        DETECTED_STACKS+=("React")
        [ -z "$PRIMARY_STACK" ] && PRIMARY_STACK="React"
        [ -z "$RUN_CMD" ] && RUN_CMD="npm run dev"
        [ -z "$TEST_CMD" ] && TEST_CMD="npm run test"
        STACK_DOC_LINK="${STACK_DOC_LINK}\n- **前端 React 规范**: [frontend-react-standard.md](${STANDARDS_DIR}/stack-templates/frontend-react-standard.md)"
    else
        DETECTED_STACKS+=("Node.js")
        [ -z "$PRIMARY_STACK" ] && PRIMARY_STACK="Node.js"
        [ -z "$RUN_CMD" ] && RUN_CMD="npm start"
        [ -z "$TEST_CMD" ] && TEST_CMD="npm test"
    fi
fi

if [ -f "requirements.txt" ] || [ -f "pyproject.toml" ] || [ -f "setup.py" ]; then
    DETECTED_STACKS+=("Python")
    [ -z "$PRIMARY_STACK" ] && PRIMARY_STACK="Python"
    [ -z "$RUN_CMD" ] && RUN_CMD="python main.py"
    [ -z "$TEST_CMD" ] && TEST_CMD="pytest"
    IS_VALID_PROJECT=1
fi

if [ -f "Cargo.toml" ]; then
    DETECTED_STACKS+=("Rust")
    [ -z "$PRIMARY_STACK" ] && PRIMARY_STACK="Rust"
    [ -z "$RUN_CMD" ] && RUN_CMD="cargo run"
    [ -z "$TEST_CMD" ] && TEST_CMD="cargo test"
    IS_VALID_PROJECT=1
fi

if [ -f "GEMINI.md" ] || [ -f "GEMINI_GLOBAL.md" ]; then
    IS_VALID_PROJECT=1
fi

if [ $IS_VALID_PROJECT -eq 0 ]; then
    echo "⚠️  未检测到标准项目标志 (如 go.mod, pom.xml, package.json, Cargo.toml 等)。"
    read -r -p "是否仍要注入/更新 AI 规范标准？(y/N): " response
    if [[ ! "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo "❌ 已取消。"
        exit 1
    fi
fi

if [ ${#DETECTED_STACKS[@]} -ne 0 ]; then
    echo "🔍 检测到项目技术栈: ${DETECTED_STACKS[*]}"
else
    echo "ℹ️  未识别出具体技术栈，使用基础通用配置注入。"
    RUN_CMD="npm run dev"
    TEST_CMD="npm test"
fi

# 自动清理失效的软链接 (包含历史 Cursor/Cline 废弃软链接)
cleanup_broken_links() {
    local legacy_files=(
        "./GEMINI_GLOBAL.md"
        "./.cursorrules"
        "./.clinerules"
        "./.github/copilot-instructions.md"
        "./.agents/skills"
        "./.agents/mcp_config.json"
        "./.agents/gemini-web-chat"
        "./.agent"
    )
    for f in "${legacy_files[@]}"; do
        if [ -L "$f" ] && [ ! -e "$f" ]; then
            rm "$f"
            echo "  🧹 已清除失效软链接: $f"
        fi
    done
}

update_gitignore() {
    local file=$1
    local gitignore_path="./.gitignore"
    if [ ! -f "$gitignore_path" ]; then
        touch "$gitignore_path"
    fi
    
    if ! grep -F -q -x "$file" "$gitignore_path" && ! grep -F -q -x "/$file" "$gitignore_path"; then
        if [ -s "$gitignore_path" ] && [ -n "$(tail -c 1 "$gitignore_path" 2>/dev/null)" ]; then
            echo "" >> "$gitignore_path"
        fi
        echo "$file" >> "$gitignore_path"
        echo "  ➕ 已将 $file 添加至 .gitignore"
    fi
}

exclude_generated_files() {
    echo "🛡️  正在更新 .gitignore 以排除生成的文件及本地过程资产..."
    update_gitignore "/GEMINI_GLOBAL.md"
    update_gitignore "/.agents/skills"
    update_gitignore "/.agents/mcp_config.json"
    update_gitignore "/.agents/gemini-web-chat"
    update_gitignore "/.agent"
    update_gitignore "/docs/specs/"
    update_gitignore "/implementation_plan.md"
    update_gitignore "/task.md"
    update_gitignore "/walkthrough.md"
}

# 1. 建立指向全局规范总控的软链接 (Antigravity 专享)
echo "🔗 正在建立 AI 规范总控软链接..."
cleanup_broken_links

ln -sf "$INSTRUCTIONS_PATH" ./GEMINI_GLOBAL.md
echo "  🔹 GEMINI_GLOBAL.md -> $INSTRUCTIONS_PATH"

# 2. 挂载 Antigravity 原生工作区技能 (.agents/skills)
if [ -d "$SKILLS_PATH" ]; then
    echo "🧠 正在挂载 Antigravity 原生工作区技能库..."
    mkdir -p ./.agents
    ln -sfn "$SKILLS_PATH" ./.agents/skills
    echo "  🔹 ./.agents/skills -> $SKILLS_PATH"
fi

# 3. 挂载 Antigravity 工作区标准 MCP 配置 (.agents/mcp_config.json)
if [ -f "$MCP_CONFIG_PATH" ]; then
    echo "🔌 正在挂载 Antigravity 全局标准 MCP 配置..."
    mkdir -p ./.agents
    ln -sf "$MCP_CONFIG_PATH" ./.agents/mcp_config.json
    echo "  🔹 ./.agents/mcp_config.json -> $MCP_CONFIG_PATH"
fi

# 4. 挂载 Antigravity Web Chat 效能与敏捷工作台 (.agents/gemini-web-chat)
if [ -d "$WEB_CHAT_PATH" ]; then
    echo "🛠️  正在挂载 Antigravity Web Chat 敏捷效能工作台..."
    mkdir -p ./.agents
    ln -sfn "$WEB_CHAT_PATH" ./.agents/gemini-web-chat
    echo "  🔹 ./.agents/gemini-web-chat -> $WEB_CHAT_PATH"
fi

# 5. 自动初始化本地专属业务上下文 GEMINI.md (防覆盖，带技术栈联动)
if [ ! -f "GEMINI.md" ]; then
    echo "📝 正在初始化项目专属业务上下文模板: GEMINI.md (已联动检测到的技术栈) ..."
    
    cat << EOF > GEMINI.md
# [项目名称] 业务上下文与本地规约 (GEMINI.md)

> [!IMPORTANT]
> 本项目遵循全局 AI 最高执行总控：[GEMINI_GLOBAL.md](./GEMINI_GLOBAL.md)，在此基础上执行以下项目专属业务规则。

## 1. 业务背景与核心功能 (Context)
- **业务背景**: 简述此项目是什么、主要解决什么问题、服务于什么核心业务。
- **主要技术栈**: ${DETECTED_STACKS[*]:-通用全栈}
- **系统架构**: 简述核心框架、服务划分及关键数据流。

## 2. 本地执行与已匹配规约 (Matching Standards)
- **云原生与 SRE 规约**: [cloud-native-rules.md](${STANDARDS_DIR}/core-rules/cloud-native-rules.md)
- **安全红线标准**: [security-guardrails.md](${STANDARDS_DIR}/core-rules/security-guardrails.md)
$(echo -e "$STACK_DOC_LINK")

## 3. 本地可用技能与常用命令 (Local Skills & Commands)
- **运行/开发**: \`${RUN_CMD:-npm run dev}\`
- **构建/测试**: \`${TEST_CMD:-npm test}\`
- **原生技能库**: 已通过 \`.agents/skills/\` 挂载全局 SRE 排障、日志规范与依赖图分析技能。
- **Web 效能工作台**: \`node .agents/gemini-web-chat/server.js\` (支持流式对话、敏捷看板、多角色热加载与文档自动持久化)
- **本地自动化工具**: 如有内置代码生成器、迁移脚本，写在此处，AI 将优先复用。

## 4. 本地推荐 MCP 服务 (Recommended MCP Servers)
- **Database MCP**: 配置数据库连接，方便 AI 精准获取表结构 Schema。
- **Git MCP**: 辅助 AI 进行精准的版本控制与分支管理。
- **Filesystem MCP**: 优化跨项目文件的精准检索。

## 5. 项目核心符号与契约 (Domain Symbols)
- **核心接口/路由**: 列出项目中最关键的公共接口、API 路由定义文件。
- **核心模型/实体**: 列出关键的数据库实体或领域对象声明。

## 6. AI 自我进化错题本 (Lessons Learned)
- **长效记忆库**: [LEARNING.md](./LEARNING.md)
- *注意: 任何在此项目中被开发者纠正的代码规范或错误，AI 必须主动总结并写入该文件中，确保不再重复犯错。*
EOF
    echo "  🔹 GEMINI.md 模板生成成功！"
else
    echo "ℹ️  检测到当前项目下已存在 GEMINI.md，跳过生成，保留本地业务配置。"
fi

# 4. 自动初始化本地错题本 LEARNING.md
if [ ! -f "LEARNING.md" ]; then
    cp "${STANDARDS_DIR}/core-rules/LEARNING.md" ./LEARNING.md
    echo "  🔹 LEARNING.md 错题本生成成功！"
fi

# 5. 排除规则配置
exclude_generated_files

echo ""
echo "✅ Antigravity 全局 AI 规范标准与技能库配置完成！"
echo "👉 现在你可以在 Antigravity IDE 中开启会话，智能体将自动识别规约与原生技能。"
