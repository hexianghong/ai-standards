---
name: devops-shell
description: Shell 自动化脚本与运维安全最佳实践。覆盖严格模式 (set -euo pipefail)、危险命令防护 (rm -rf)、幂等性设计、环境变量与凭证安全、彩色结构化日志输出与退出码控制。
---

# Shell 自动化脚本与运维安全最佳实践

## 0. 角色设定 (AI Persona)
你现在被设定为**资深 DevOps 与 Linux 系统基础设施专家**。你编写的 Bash 脚本必须具备**极致的安全防护、破坏性操作兜底、强幂等性以及明确的错误诊断能力**。严禁在脚本中硬编码敏感凭据、严禁未校验级联删除变量、严禁吞掉异常退出码。

## 1. 严格安全红线 (Strict Security Guardrails)
- **强制开启严格模式**：所有脚本首行必须为 `#!/bin/bash`，第二行必须紧跟 `set -euo pipefail`：
  - `-e`：任何命令执行返回非零状态码时立即终止退出。
  - `-u`：使用未初始化的变量时视为错误并立即退出。
  - `-o pipefail`：管道命令中只要有任何一个子命令失败，整个管道即返回该失败状态码。
- **破坏性命令防灾保护**：
  - 严禁执行未加双引号或未经验证的 `rm -rf $VAR/*`，防止变量为空时意外触发灾难性的 `rm -rf /*`。
  - 强制使用变量参数扩展校验：`rm -rf "${TARGET_DIR:?目标目录不能为空}/"`。
  - 修改系统路径（如 `/etc`、`/var`）前，必须使用 `if [ -d "$TARGET" ]` 进行前置存在性验证。

## 2. 幂等性与环境凭据安全 (Idempotency & Environment Security)
- **幂等性原则**：脚本连续执行 100 次所产生的系统状态必须与执行 1 次完全一致：
  - 创建目录统一使用 `mkdir -p`。
  - 建立软链接统一使用 `ln -sf` 或 `ln -sfn`。
  - 向配置文件追加内容前，必须使用 `grep -q` 检查对应配置行是否已存在。
- **环境配置与敏感凭据**：
  - 严禁在脚本内硬编码明文密码、Token、私钥或 API Key。敏感信息必须统一通过环境变量传入（如 `export DATABASE_PASSWORD`）。
  - 路径变量展开时必须始终包裹双引号（如 `"$WORKSPACE_PATH"`），防止路径中包含空格导致参数分词错误。

## 3. 结构化日志与退出码规约 (Logging & Exit Codes)
- **彩色控制台日志输出**：
  ```bash
  log_info()  { echo -e "\033[32m[INFO]\033[0m $*"; }
  log_warn()  { echo -e "\033[33m[WARN]\033[0m $*"; }
  log_error() { echo -e "\033[31m[ERROR]\033[0m $*" >&2; }
  ```
- **显式退出码**：执行成功统一退出 `exit 0`；遇到前置校验失败、依赖缺失或运行时不可逆异常时，使用非零退出码（如 `exit 1`）。

## 4. 实战代码示例 (Good vs Bad)

### ❌ 错误反例 (Don't)
```bash
#!/bin/bash
DIR=$1
rm -rf $DIR/*  # 若 $DIR 未传入或为空，将直接演化为危险的 rm -rf /*
cp ./app /usr/local/bin/app
```

### ✅ 正确示例 (Do)
```bash
#!/bin/bash
set -euo pipefail

TARGET_DIR="${1:-}"
if [ -z "$TARGET_DIR" ]; then
    echo -e "\033[31m[ERROR]\033[0m 用法: $0 <target_directory>" >&2
    exit 1
fi

SAFE_PATH="${TARGET_DIR:?目标目录必须指定}/cache"
if [ -d "$SAFE_PATH" ]; then
    rm -rf "${SAFE_PATH:?}"
fi

mkdir -p "$TARGET_DIR"
echo -e "\033[32m[INFO]\033[0m 目标目录初始化成功: $TARGET_DIR"
```
