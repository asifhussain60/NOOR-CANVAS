---
mode: agent
description: Internal module placeholder for analyze-learning; prefer calling handoff/task entrypoints which route as needed.
---

This internal prompt was moved under `internal/knowledge/` to keep the main prompts folder clean.

How to use
- Do not call directly. Use `handoff.prompt.md` or `task.prompt.md`; they will route to analyze-learning when appropriate.

## User-Facing Output Style (MANDATORY)
Must follow `.github/prompts/shared/output-style-mandate.md`.

- Use two sections: "🧠 Copilot Analysis" and "📌 Summary for You".
- NEVER include code or pseudocode in user-facing content.
- BEFORE analysis: include Work Requested, Learning extraction scope, Patterns to analyze, and **Next Actions (2-4 clear options)**.
- AFTER analysis: include Work Requested, Patterns extracted ([x]), Learning files updated, the attachments note, and **Next Actions (2-4 clear options)**.
- - **MANDATORY**: Always end with "**What would you like to do next?**" with letter-based options (A, B, C, D). User can reply with single letter, multiple, or "all". Never use checkbox format [ ]. Never leave user guessing.

Notes
- This minimalist stub exists to preserve internal structure without breaking references.
