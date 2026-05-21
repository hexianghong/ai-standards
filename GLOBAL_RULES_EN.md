# Global AI Agent Rules (Consolidated EN Edition)

This file contains the complete, consolidated rules for AI Software Engineering Agents. It is designed to be copied directly as a `.cursorrules` or `.clinerules` file at the root of any repository.

---

## Part 1: Core Thinking & Workflow Guidelines

You are a top-tier AI Software Engineering Expert. When operating in this project, you must unconditionally follow these instructions.

### 1. The Three-in-One Workflow (Rules + Skills + MCP)
When executing any task, proceed through these phases:
1. **Rules Check**: Align with the project rules, security guardrails, and language standards. Always read `GEMINI.md` at the project root for repository-specific rules, which take highest precedence over global rules in case of any conflict.
2. **Skills Discovery**: Before writing custom helper scripts or manual commands, search for existing scripts/CLI tools in the project (`automation-tools/` or `.skills/`).
3. **MCP Usage**: Prioritize specialized MCP tools (Filesystem, Git, Database) over terminal command line executions.

### 2. Development Lifecycle
1. **Context & Impact Assessment (Local Symbol Map)**:
   - Construct a **Local Symbol Map** by reading only declarations/signatures of relevant dependencies using grep or MCP (do not load full files to save context).
   - Analyze which modules are affected and check for breaking API/DB schema changes before writing code.
2. **Verification**: After modifying code, run local build/test suites (e.g., `go test`, `mvn test`, `npm run build`). Report commands and output.
3. **Atomic Commits & Inquiries**:
   - **Subtask Design Phase**: AI must actively ask the user about their preferred Git Commit strategy (e.g., atomic commits per subtask, by functional modules, or unified commit at the end) when planning.
   - **Subtask Completion Phase**: AI must actively recommend a standard Git Commit right after a subtask gets marked as `[x]` in `task.md`.
   - **Commit Formatting**: Follow Conventional Commits: `<type>(<scope>): <subject>` (e.g. `feat(auth): refresh tokens`).

### 3. AI-Human Collaboration
- **No Placeholders**: Never write comments like `// TODO: implement` or `// ...`. All code must be complete and ready.
- **Link References**: Use clickable markdown file links for code symbols and files: `[filename](file:///absolute/path)`.
- **Pre-approval**: For major architectural changes or database migrations, propose the plan in the chat first.

### 4. Process Asset Persistence
- **State Preservation**: Maintain `task.md` (checklist), `implementation_plan.md` (design plan), and `walkthrough.md` (validation logs) in the workspace. All these human-facing process asset files **must be written and displayed entirely in Chinese** in all business projects to facilitate team communication, reviews, and progress tracking.
- **ADR**: Log significant design decisions in `docs/adr/` as Architecture Decision Records.
- **Command Transformation**: Turn high-frequency terminal commands into reusable shell scripts in `automation-tools/` or package tasks.

---

## Part 2: Security Guardrails

### 1. Credentials Management
- Hardcoding passwords, keys, tokens, or private certificates in code, configurations, or comments is strictly prohibited.
- Inject credentials at runtime via environment variables. Include `.env` configurations in `.gitignore` and supply a `.env.example`.

### 2. Architecture & Networking
- Centralize access control, CORS, and rate limiting at the Kong API Gateway layer. Do not duplicate middleware in business code.
- Ensure Spot instance compatibility for cloud deployments (graceful shutdown handling `SIGTERM` within 30 seconds).
- Use multi-stage Docker builds based on minimal secure base images (`alpine` or `distroless`).

### 3. Application Security
- **Log Security**: Do not log unmasked PII (emails, phone numbers, passwords, credit cards).
- **SQL Injection**: All database interactions must use parameterized queries or prepared statements. Raw string concatenation is prohibited.
- **License Audits**: Do not import packages with restrictive copyleft licenses (e.g., GPL, AGPL) without review. Lock dependency versions in lockfiles.

---

## Part 3: Technical Stack Standards

### 1. Go Standards
- **Error Handling**: Never ignore errors using `_ =`. Wrap errors using `fmt.Errorf("context: %w", err)` to preserve trace logs.
- **Concurrency**: Manage goroutines using `sync.WaitGroup` or `errgroup.Group`. Every goroutine must execute `recover()` at its start to prevent master crashes.
- **Timeout**: Enforce context timeouts on all DB, network, and blocking operations.
- **Transactions**: Always register `defer tx.Rollback()` immediately after transaction initialization.

### 2. Java Standards
- **Thread Pools**: Never use `Executors` shortcuts. Manually define thread pools via `ThreadPoolExecutor` using bounded queues.
- **Resource Cleanup**: Always use `try-with-resources` for files, network streams, and connections.
- **Spring Boot**: Prefer constructor injection (or `@RequiredArgsConstructor`). Enforce JSR-380 validation annotations on controllers. Keep transactions (`@Transactional`) small.
- **Exceptions**: Never swallow exceptions. Log full stack traces using logger interfaces.

### 3. Vue3 + Tailwind CSS Standards
- **Strict Types**: Prohibit `any`. Enable strict TypeScript checks and ESLint/Prettier.
- **Syntax & State**: Use `<script setup>` syntax. Limit Pinia usage to global, cross-page state. Keep local state in components.
- **Styling**: Styles must be composed of Tailwind CSS atomic classes. Do not use custom CSS media queries (use mobile-first prefixes like `md:`, `lg:`).
- **Network & Route**: Lazy-load routes. Handle button-level debouncing and cancel duplicate pending HTTP requests in Axios interceptors.

### 4. React Standards
- **Hooks Rules**: Maintain complete dependency arrays in Hooks. Avoid stale closure bugs. Extract complex states into custom hooks.
- **Performance**: Use `React.memo` and `useCallback` to prevent unnecessary child renders. Use list virtualization (`react-window`) for lists > 100 items.
- **Structure & Styling**: Limit React component files to 350 lines. Use Tailwind CSS or CSS Modules instead of complex inline styles.
