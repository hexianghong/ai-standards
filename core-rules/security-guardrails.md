# Security Guardrails & Cloud-Native Engineering Standards

## 1. Zero-Trust Credentials
- **Strictly Prohibited**: Never hardcode API Keys, secrets, tokens, JWT secrets, database passwords, GCP service account keys, or private keys in code, configuration files (YAML/JSON), tests, or comments.
- **Runtime Injection**: All credentials must be read from environment variables or runtime container mounts (e.g., `os.Getenv` in Go, `process.env` in Node, `System.getenv` in Java).
- **Git Safety**: If creating new local config files containing sensitive paths/configurations, they must be excluded in `.gitignore` and accompanied by a dummy `.env.example` template.

## 2. API Gateway & Routing Standards (Kong Gateway)
- Any newly exposed internal microservices or endpoints must follow RESTful or gRPC API standards. Route configuration must be prioritized at the API Gateway layer (Kong) for centralized authentication, authorization, and rate limiting.
- Do not write custom CORS handling, rate-limiting, or authorization middleware in application code unless gateway layer solutions are unavailable.

## 3. Cloud-Native & Containerization Standards (GCP / K8s / Ubuntu)
- **Environment Isolation**: Clearly separate runtime configurations into `Development`, `Staging`, and `Production` profiles/environments.
- **Minimal & Safe Container Images**: Dockerfiles must use multi-stage builds. The final runtime image should be a lightweight, secure base image like `alpine` or `distroless` to minimize vulnerabilities. Full-size OS distributions are prohibited.
- **Spot Instance Compatibility**: Deployment scripts or configurations targeting K8s or GCP (such as E2 series) must design for Spot instance preemptibility. Stateless services must implement **graceful shutdown** (handling `SIGTERM` signals and terminating connections/flushing logs within 30 seconds).

## 4. Log Security & PII Protection
- **No PII Leaks**: Strictly prohibit logging unmasked Personally Identifiable Information (PII) including passwords, bank accounts, emails, phone numbers, and identity cards in stdout or log files.
- **Query Logging**: When logging database queries or raw external API payloads, sensitive parameters must be obfuscated, or debug logs must be disabled in Production environments.

## 5. SQL Injection Prevention
- All database interactions, whether via raw SQL queries or ORM frameworks (e.g., Go GORM, Java MyBatis/JPA, Node Prisma/Sequelize), must use **parameterized queries** or prepared statements.
- Direct string concatenation to construct SQL statements is strictly prohibited.

## 6. Dependency Security & Compliance
- Always lock dependency versions (e.g., `go.sum`, `package-lock.json`, `pnpm-lock.yaml`, specific versions in `pom.xml`). The use of floating versions or `latest` tags is prohibited.
- Do not introduce libraries with highly restrictive copyleft licenses (like GPL or AGPL) into commercial codebases without legal and security reviews.

## 7. AI & MCP Tooling Safety Guardrails
- AI agents using MCP tools must follow the Principle of Least Privilege.
- Never use unverified third-party MCP servers that read or write live database tables or sensitive credentials.
- When executing terminal commands, destructive actions (e.g., `rm -rf` without explicit folder constraints, clearing DB tables) are prohibited without explicit human review and approval.
