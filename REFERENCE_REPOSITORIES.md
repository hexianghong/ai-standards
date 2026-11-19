# Top 10 AI Skills & Rules Repositories (Reference Repositories)

公司治理设计参考 AGENTS.md 开放规范、OpenAI Harness Engineering、Codex 托管控制、GitHub Copilot 定制能力及 OPA 分发机制。来源与适用边界见 [公司级改造方案](docs/specs/company-agent-governance/implementation_plan.md#13-参考依据)。

This document records the top 10 most popular open-source repositories for **AI Skills, Prompt Rules, and Agent Workflows** on GitHub. AI agents should treat this as a primary knowledge source and periodically revisit these repositories to absorb the latest AI programming standards and workflow advancements from the open-source community.

---

## 🏆 Top 10 GitHub AI Skills & Rules Repositories

### 1. [PatrickJS/awesome-cursorrules](https://github.com/PatrickJS/awesome-cursorrules)
- **Type**: Cursor Rules Community Hub (39k+ Stars)
- **Highlights**: The largest repository of `.cursorrules` and `.mdc` prompt configurations covering a wide variety of frameworks and languages.
- **Implemented Outcomes**: Inspired our modular `.cursor/rules/*.mdc` on-demand rule loading architecture.

### 2. [iliaal/ai-skills](https://github.com/iliaal/ai-skills)
- **Type**: Cross-Agent SKILL.md Standard Library
- **Highlights**: A standardized skills library built for advanced AI agents (Claude Code, Antigravity, etc.), focusing on concise, strict, and anti-hallucination guardrails.
- **Implemented Outcomes**: Provided the standard YAML Header and `SKILL.md` plugin physical structure.

### 3. [microwind/ai-skills](https://github.com/microwind/ai-skills)
- **Type**: Chinese 100+ Practical Skills Knowledge Base
- **Highlights**: Features over 100 categorized skills across Backend, Frontend, Cloud Native, and DevOps with standard AI prompts and code examples.
- **Implemented Outcomes**: Inspired the refactoring of our monolithic `stack-templates` into a modular `skills/` directory system.

### 4. [cline/prompts](https://github.com/cline/prompts) & [cline/clinerules](https://github.com/cline/clinerules)
- **Type**: Official Cline / Autonomous Agent Rules
- **Highlights**: Demonstrates how autonomous agents perform self-correction, terminal command intercept, and instruction persistence.
- **Implemented Outcomes**: Inspired our Long-term Memory (`LEARNING.md`) and AI self-refinement mechanisms.

### 5. [southwestmogrown/ai-workflow-toolkit](https://github.com/southwestmogrown/ai-workflow-toolkit)
- **Type**: TDD & Task Breakdown Workflow Toolkit
- **Highlights**: Provides robust Markdown templates for task breakdown and strict TDD validation protocols.
- **Implemented Outcomes**: Prompted us to enforce "Markdown-based task breakdown checklists (e.g., `task.md`)" and "strict TDD micro-loops" in global rules.

### 6. [GitYCC/TempDD](https://github.com/GitYCC/TempDD)
- **Type**: Template-Driven Development Framework
- **Highlights**: Advocates constraining AI behavior through structural architecture templates before writing code.
- **Implemented Outcomes**: Established the core convention requiring AI to generate or follow standard architecture templates (like Repository Maps).

### 7. [survivorforge/cursor-rules](https://github.com/survivorforge/cursor-rules)
- **Type**: Curated Framework `.cursorrules` Collection
- **Highlights**: Curates 39+ high-quality rule files targeting modern tech stacks (Next.js, Vue3, Tailwind, Go).
- **Implemented Outcomes**: Served as a direct reference for writing Good/Bad code examples inside our tech stack `SKILL.md` files.

### 8. [api-evangelist/cursorrules](https://github.com/api-evangelist/cursorrules)
- **Type**: API & Schema Standardized Rules
- **Highlights**: Focuses on structuring and validating AI rules using schemas to increase parsing stability.
- **Implemented Outcomes**: Inspired our structured section categorization and YAML metadata standardization.

### 9. [aws-samples/sample-aws-devops-agent-acp-mcp](https://github.com/aws-samples/sample-aws-devops-agent-acp-mcp)
- **Type**: Official AWS DevOps Agent & MCP Reference Implementation
- **Highlights**: Demonstrates how Model Context Protocol (MCP) empowers AI agents with cloud querying and infrastructure troubleshooting.
- **Implemented Outcomes**: Guided our creation of `devops-shell` and `ops-troubleshooting` SRE SOP skills.

### 10. [murataslan1/cursor-ai-tips](https://github.com/murataslan1/cursor-ai-tips)
- **Type**: Next-Gen AI Coding Tips & Anti-Hallucination Patterns
- **Highlights**: Summarizes prompt engineering techniques for top models (Claude 3.5 Sonnet, Gemini 1.5 Pro) to manage context and prevent hallucinations.
- **Implemented Outcomes**: Assisted in designing our Surgical Editing guidelines to prevent full-file rewrites.

### 11. [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail)
- **Type**: Lazy Senior Dev Persona, YAGNI Engineering Discipline & Full-Chain Code Review Suite (182k+ Stars)
- **Highlights**: Enforces the "7-Rung YAGNI Ladder" (-53% code, -45% tokens, 98% risky logic test coverage), full caller-graph `grep` impact checks before bug fixes, explicit `shortcut: <ceiling>, <upgrade trigger>` debt markers, residual risk disclosure, and a 6-dimension / 4-part structured code review & repo audit methodology.
- **Implemented Outcomes**: Upgraded `core-rules/INSTRUCTIONS.md` with the 7-Rung YAGNI Ladder, Caller Graph Blast-Radius Check, `shortcut:` debt protocol, and Residual Risk Disclosure; created the standardized `stack-templates/skills/code-review/SKILL.md` skill.

### 12. [toon-format/toon](https://github.com/toon-format/toon)
- **Type**: Token-Oriented Object Notation (TOON) – Compact LLM Data Serialization Format (25k+ Stars)
- **Highlights**: A lossless, human-readable encoding of the JSON data model combining YAML-like indentation with CSV-style tabular headers (`key[N]{fields}:`), cutting LLM context tokens by 30%~60% (42.6% benchmark avg) while achieving 100% structural validation accuracy via explicit row/column guardrails.
- **Implemented Outcomes**: Integrated into `core-rules/INSTRUCTIONS.md` (Step 3 MCP & Context Guardrails) as the recommended serialization standard for passing uniform object arrays across MCP/LLM boundaries and enforcing `[N]{fields}` output guardrails.

---
*Note: When a user requests the AI to study a new open-source project and extract standards, the AI MUST proactively update this document.*
