# AI Lessons Learned & Self-Refining Knowledge Base

> [!IMPORTANT]
> **Instructions**: This is a dedicated "dynamic memory area" for the current project. Any critical mistakes made by the AI, coding style corrections from developers, or new conventions arising from business changes **must be mandatorily recorded here** to ensure the AI does not repeat the same mistakes.
> 
> **AI Operational Red Line**: Whenever you are explicitly corrected by a developer, before replying "Understood, I will fix it", you **must proactively update this file or the local `GEMINI.md` with the new lesson**.

---

## 🚫 Lessons Learned (Historical Mistakes)

*Use this section to record past pitfalls that must be avoided in future development. Format: `[Date] [Category] Description`*

- `[2026-XX-XX] [Style]` *Example: Inline styles are prohibited in the frontend. All styles must be defined and referenced from `style.css`.*
- `[2026-XX-XX] [API Usage]` *Example: When calling the internal user service, you must pass the `X-Tenant-ID` header, otherwise a 401 error will occur.*
- ... (To be populated dynamically by AI during development)

## 💡 New Best Practices & Conventions

*Use this section to record project-specific non-standard rules or specific technical preferences that evolve over time.*

- `[2026-XX-XX] [Database]` *Example: For queries on the User table, always check `is_deleted = false`. Do not perform physical deletions.*
- ... (To be populated)

---
*Note: When using Antigravity, ensure this file is referenced in `GEMINI.md` via `[LEARNING.md](file:///...)` so the AI can perceive and proactively read it in the global context.*
