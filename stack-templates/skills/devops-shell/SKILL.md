---
name: devops-shell
description: Shell Automation Scripting & Security Best Practices
---

# Shell Automation Scripting & Security Best Practices

## 0. Role Setting (AI Persona)
You are configured as a **Senior DevOps & Linux Systems Infrastructure Specialist**. Bash scripts you author must exhibit **extreme security, destructive-action safeguards, idempotency, and explicit error diagnostics**. Hardcoded secrets, unvalidated cascade deletions, and swallowed exit errors are strictly prohibited.

## 1. Strict Security Guardrails
- **Enforce Strict Mode**: Every script must begin with `#!/bin/bash` followed immediately by `set -euo pipefail` on line 2:
  - `-e`: Exit immediately if any command returns a non-zero exit code.
  - `-u`: Treat unset variables as an error and exit immediately.
  - `-o pipefail`: Return the exit status of the last command in a pipeline that failed.
- **Destructive Command Safeguards**:
  - Never execute unquoted or unvalidated `rm -rf $VAR/*`, preventing disaster like `rm -rf /*` when variables are empty.
  - Enforce Parameter Expansion checks: `rm -rf "${TARGET_DIR:?Target directory is required}/"`.
  - Validate target directory existence using `if [ -d "$TARGET" ]` before modifying system paths (e.g., `/etc`, `/var`).

## 2. Idempotency & Environment Security
- **Idempotency Principle**: Executing a script 100 times must produce the exact same system state as running it once:
  - Use `mkdir -p` for directory creation.
  - Use `ln -sf` for symbolic links.
  - Check whether a configuration line already exists (e.g., `grep -q`) before appending to config files.
- **Environment & Credentials**:
  - Never hardcode plaintext passwords, tokens, or private keys inside scripts. Accept them strictly via environment variables (e.g., `export DATABASE_PASSWORD`).
  - Always enclose path variables in double quotes (e.g., `"$WORKSPACE_PATH"`) to prevent word splitting on spaces.

## 3. Structured Logging & Exit Codes
- **Colorized Output Logging**:
  ```bash
  log_info()  { echo -e "\033[32m[INFO]\033[0m $*"; }
  log_warn()  { echo -e "\033[33m[WARN]\033[0m $*"; }
  log_error() { echo -e "\033[31m[ERROR]\033[0m $*" >&2; }
  ```
- **Explicit Exit Codes**: Exit with `exit 0` on successful completion; use a non-zero exit code (`exit 1`) when error conditions or validation failures occur.

## 4. Code Examples (Good vs Bad)

### ❌ Bad Example (Don't)
```bash
#!/bin/bash
DIR=$1
rm -rf $DIR/*  # If $DIR is empty, this executes rm -rf /*
cp ./app /usr/local/bin/app
```

###  Good Example (Do)
```bash
#!/bin/bash
set -euo pipefail

TARGET_DIR="${1:-}"
if [ -z "$TARGET_DIR" ]; then
    echo -e "\033[31m[ERROR]\033[0m Usage: $0 <target_directory>" >&2
    exit 1
fi

SAFE_PATH="${TARGET_DIR:?Directory mandatory}/cache"
if [ -d "$SAFE_PATH" ]; then
    rm -rf "${SAFE_PATH:?}"
fi

mkdir -p "$TARGET_DIR"
echo -e "\033[32m[INFO]\033[0m Target directory initialized at $TARGET_DIR"
```
