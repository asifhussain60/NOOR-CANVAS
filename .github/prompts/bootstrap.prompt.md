---
mode: agent
---
# bootstrap.prompt.md
## Role
Initialize Copilot with the **canonical instructions and prompts** stored in `.github/`.  
Load and index all files into working memory to establish guardrails, roles, and architectural mappings.

## Execution Steps

1. **Load Global Guardrails**
   - Read `.github/instructions/SelfAwareness.instructions.md`.

2. **Load Structural Index**
   - Read `.github/instructions/Links/SystemStructureSummary.md`.
   - Use this to confirm available prompts and their roles.

3. **Load Architectural Context**
   - `.github/instructions/Links/NOOR-CANVAS_ARCHITECTURE.MD`
   - `.github/instructions/Links/API-Contract-Validation.md`
   - `.github/instructions/Links/AnalyzerConfig.MD` (placeholder: requires `/sync`)
   - `.github/instructions/Links/PlaywrightConfig.MD` (placeholder: requires `/sync`)

4. **Load All Active Prompts**
   - Align: `.github/prompts/align.prompt.md`
   - Cleanup: `.github/prompts/cleanup.prompt.md`
   - Inventory: `.github/prompts/inventory.prompt.md`
   - Lock: `.github/prompts/lock.prompt.md`
   - Pwtest: `.github/prompts/pwtest.prompt.md`
   - Refactor: `.github/prompts/refactor.prompt.md`
   - Sync: `.github/prompts/sync.md`
   - Task: `.github/prompts/task.prompt.md` (**canonical task agent**)

5. **Check for Retired or Obsolete Prompts**
   - If any prompt listed in `SystemStructureSummary.md` is missing from disk, mark it as *retired*.
   - Known retired prompts:  
     - `retrosync.prompt.md` → replaced by `sync.md`  
     - `task.md` → merged into `task.prompt.md`

6. **Fill Placeholders**
   - Run `/sync` to populate **AnalyzerConfig** and **PlaywrightConfig** with real repo data.
   - Remove any `[PLACEHOLDER]` sections.

7. **Confirm Cohesion**
   - Validate all prompts cross-reference guardrails and architecture.
   - Report any dangling references or unfilled placeholders.

---

## Notes
- **AnalyzerConfig** and **PlaywrightConfig** are empty shells until `/sync` fills them.  
- `/sync` must always prune obsolete prompts (e.g., retrosync, duplicate task).  
- The system depends on this bootstrap step for consistent context.
