# Reference Repositories

This document records the excellent open-source repositories that have served as inspiration for the `ai-standards` architecture and workflows. AI agents should treat this as a knowledge source and periodically revisit these repositories to absorb the latest AI programming standards and workflow advancements from the open-source community.

## Studied Projects List

### 1. [microwind/ai-skills](https://github.com/microwind/ai-skills)
- **Time Studied**: 2026-05-29
- **Highlights**: Provides an excellent, highly decoupled physical structure for AI Skills plugin trees. It includes over 100 clearly categorized programming skills (Backend, Frontend, DevOps, etc.), each equipped with standard AI prompts and code examples.
- **Implemented Outcomes**: Inspired the refactoring of our monolithic `stack-templates` into a modular `skills/` directory architecture containing YAML frontmatter, making it perfectly compatible with on-demand plugin loading mechanisms for agents like Antigravity.

### 2. [PatrickJS/awesome-cursorrules](https://github.com/PatrickJS/awesome-cursorrules)
- **Time Studied**: 2026-05-28
- **Highlights**: The largest community repository of modular on-demand (`.mdc`) AI rules.
- **Implemented Outcomes**: Inspired our adaptation and creation of the modular `.cursor/rules/*.mdc` directory structure for Cursor.

### 3. [southwestmogrown/ai-workflow-toolkit](https://github.com/southwestmogrown/ai-workflow-toolkit)
- **Time Studied**: 2026-05-28
- **Highlights**: Provides robust, standalone Markdown files for task breakdown and strict TDD validation protocols.
- **Implemented Outcomes**: Directly prompted us to enforce "Markdown-based task breakdown lists (e.g., `task.md`)" and "strict TDD micro-loops" as core directives in our global rules.

### 4. [GitYCC/TempDD](https://github.com/GitYCC/TempDD)
- **Time Studied**: 2026-05-28
- **Highlights**: An advocate of the "Template-Driven Development" (TempDD) framework.
- **Implemented Outcomes**: Established the core convention that AI must generate or follow standard architectural templates (like a Repository Map) before writing code.

### 5. [cline/clinerules](https://github.com/cline/clinerules)
- **Time Studied**: 2026-05-28
- **Highlights**: A prime example of self-correction and instruction persistence for fully autonomous agents like Cline.
- **Implemented Outcomes**: Inspired the creation of the "Long-term Error Log" (`LEARNING.md`) mechanism, empowering the AI with the ability to self-evolve across sessions.

---
*Note: When a user requests the AI to study a new open-source project and extract standards, the AI MUST proactively update this document.*
