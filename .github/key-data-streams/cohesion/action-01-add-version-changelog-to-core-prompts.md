# Action 01: Add Version/Changelog to Core Prompts

Priority: High
Effort: 1 SP each (3 SP total)
Affected Files:
- .github/prompts/task.prompt.md
- .github/prompts/test-generation.prompt.md
- .github/prompts/healthcheck.prompt.md

Implementation Steps:
1. Add a small header block after front matter:
   - **Version:** x.y.z
   - **Last Updated:** YYYY-MM-DD
   - **Changelog:** 1–3 bullets for recent changes
2. Keep behavior unchanged; this is metadata only.

Validation:
- Headers render correctly.
- No behavioral content altered.
