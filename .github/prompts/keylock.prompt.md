# keylock.prompt.md

## Parameters
- **key:** Task identifier (maps directly to the prompt key system)
- **notes:** Additional context, details, or scope related to the task

## Context & Inputs
- **MANDATORY:** `.github/instructions/SelfAwareness.instructions.md` (operating guardrails)
- **MANDATORY:** `.github/instructions/SystemStructureSummary.md` (architectural mappings and structural orientation)
- **Architecture:** `.github/instructions/NOOR-CANVAS_ARCHITECTURE.MD`

---

## Behavior

For the specified key, follow this process:

1. Mark the current task complete.  
2. Stage all relevant changes.  
3. Show me a final summary of what will be committed.  
4. Wait for my explicit approval before proceeding.  

If I approve, then:  
- Commit with the message: "Complete <KEY_NAME> task" and push to origin/main.  
- Update all relevant prompts, especially `NOOR-CANVAS_ARCHITECTURE.MD` and `SystemStructureSummary.md`.  
- Ensure `SystemStructureSummary.md` always maintains a **summarized snapshot** of:  
  - Latest contracts for APIs  
  - Data Transfer Objects (DTOs)  
  - SQL tables, stored procedures, and database objects involved  
  - Any other useful architectural or contextual information  

---

## Integration Notes

- **Load Architectural Context**: Always use `SystemStructureSummary.md` to understand component relationships and API mappings for the `{key}` before starting work
- The `continue.prompt.md` and `workitem.prompt.md` must always **read `SystemStructureSummary.md` before doing any work** to ensure they target the correct views and objects.  
- Do not commit or push without my confirmation.  
- Ensure the commit message matches the key and scope.  

---

## Efficiency Recommendations

- Automatically flag stale or missing entries in `SystemStructureSummary.md` and recommend updates.  
- Cross-check DTOs and API contracts against SQL schema for mismatches before finalizing commit.  
- Suggest pruning or merging redundant notes for better clarity and maintenance.  


---

## API Contract Validation Integration

- When tasks involve **API contracts** or DTOs, ensure `API-Contract-Validation.md` is updated.  
- `API-Contract-Validation.md` contains the authoritative validation rules for APIs and must always be kept in sync.  
- Alongside this, update `SystemStructureSummary.md` (snapshot) and `NOOR-CANVAS_ARCHITECTURE.MD` (detailed design).  

## Undo Tracking Behavior
- On closure, locate and delete the associated undo log at `Workspaces/Copilot/change_log/<key>.log`.
- Ensure no undo data persists once a key is finalized.

## Git Auto-Squash
- On closing a key, squash all "backup before ..." commits into a single final commit:
  `git reset --soft <first-backup-commit>`
  `git commit -m "Finalize <key> task"`
- Mark key closed in DB and update notes.

## Debug Logging Cleanup
- Before finalizing the commit, remove all debug logging added during development using the marker pattern.
- Search for and remove all lines containing: `[DEBUG-{AGENT}:{key}:` or `[DEBUG-CONTINUE:{key}:`
- Example markers to remove:
  - `[DEBUG-WORKITEM:waitingroom:trace:RUN_ID]`
  - `[DEBUG-CONTINUE:waitingroom:trace:RUN_ID]` 
  - Console.WriteLine statements added for debugging
- Keep only essential logging that provides operational value in production.
- Ensure removal doesn't break functionality or introduce compilation errors.


---
### Patch: Keylock Integration
- Keylock now triggers automatic AC generation, subject to user approval.
- Clarify interaction: Retrosync integrates ACs into instructions.
