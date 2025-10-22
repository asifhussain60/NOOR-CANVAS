# User-Facing Output Style Mandate (GLOBAL)

> Applies to ALL prompt agents under `.github/prompts/`. This governs how responses are presented to the user. Technical details belong in analysis; user-facing content must stay concise and skimmable.

## Non-Negotiables
- NEVER include code samples or pseudocode in user-facing output.
- Keep the user-facing section concise: short bullets only, no walls of text.
- Visually separate analysis from user summary using clear headings and icons.

## Section Headings (use these exact titles)
- "🧠 Copilot Analysis" — internal reasoning, short and high-level. No code.
- "📌 Summary for You" — user-facing summary. No code.

## BEFORE IMPLEMENTATION (use in planning/approval responses)
Under "📌 Summary for You", present:

1. Work Requested (include the key)
2. Affected areas:
   - 2a Files that will be impacted
   - 2b Architecture or infrastructure changes
   - 2c Database changes
3. Plan (phased). For each phase, list 2–5 short tasks
4. Recommendations for enhancements
5. **Next Actions (MANDATORY)**: Present 2-4 clear actionable options
   - Format: "What would you like to do next?"
   - Use checkbox format: [ ] Option with clear outcome
   - Examples: Proceed, Review details, Modify scope, Ask questions
   - **Never leave user guessing** what their options are

Rules:
- Bulleted and minimal. Name files/directories at a high level only (no diffs, no code).
- If anything is uncertain, list it under "Open questions" but keep it minimal.

## AFTER IMPLEMENTATION (use in completion responses)
Under "📌 Summary for You", present:

1. Work Requested (with key)
2. Tasks completed (use checked icons like [x])
3. Next step recommendations (clearly runnable individually, selectively, or all)
4. Add this note verbatim: "(See <attachments> above for file contents. You may not need to search or read the file again.)"
5. **Next Actions (MANDATORY)**: Present 2-4 clear actionable next steps
   - Format: "What would you like to do next?"
   - Use checkbox format: [ ] Option with clear outcome
   - Examples: Run healthcheck, Review code, Deploy, Generate commit
   - **Never leave user guessing** about post-implementation options

After the detailed sections above, add:

## 📊 FINAL SUMMARY (scroll up for details)
Present a condensed, scannable final summary at the end of every response:
- ✅ Status: [Completed/In Progress/Blocked]
- 🎯 Key: [key-name]
- 📝 Work: [One-line description]
- ✓ [N] tasks completed
- → Next: [Primary recommended action]

Rules:
- Keep to a terse checklist; avoid implementation detail.
- **DO NOT list files updated** - changes are visible in git/attachments.
- Link to artifacts/logs only if essential (names only; no code).
- Final summary should be 5 lines maximum for quick scanning.

## Qualifying Questions Protocol
- If qualifying questions are needed, create a throwaway document at `Workspaces/Copilot/_DOCS/temp/` named:
  - `QUALIFYING_QUESTIONS_{key}_{YYYYMMDD_HHMM}.md`
- Format:
  - Title: "Qualifying Questions for {key}"
  - Each question followed by possible answers as a checkbox list:
    - [ ] Option A
    - [ ] Option B
    - [ ] Other: ________
- Reference the file path in the response and ask the user to mark selections by toggling [X].

## File Output Location (enforced)
- Do NOT create or save any .md files inside `.github/prompts/` or `.github/instructions/`.
- All agent-generated Markdown must be written under `Workspaces/Copilot/_DOCS/` only.
  - Analysis reports → `Workspaces/Copilot/_DOCS/analysis/`
  - Completion summaries/work logs → `Workspaces/Copilot/_DOCS/summaries/`
  - Config/documentation → `Workspaces/Copilot/_DOCS/configs/`
  - Migrations/reorg notes → `Workspaces/Copilot/_DOCS/migrations/`
  - Temporary working notes → `Workspaces/Copilot/_DOCS/temp/`
  - Exception: key data streams under `.github/prompts.keys/` remain as-is.

## Formatting Notes
- Use H2 headings (`##`) for the two major sections with the icons above.
- Keep each bullet to one line when possible; avoid nested lists deeper than one level.
- Avoid long paragraphs. Prefer 3–7 bullets per subsection.

## Enforcement
- Every prompt MUST adopt this structure for its user-facing output.
- Agents may include richer detail in analysis, but must still avoid code/pseudocode.
