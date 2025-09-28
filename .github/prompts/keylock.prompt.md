# keylock.prompt.md

## Parameters
- **key:** Task identifier (maps directly to the prompt key system)
- **notes:** Additional context, details, or scope related to the task

## Required Reading
- **MANDATORY:** `.github/instructions/SelfAwareness.instructions.md` (operating guardrails)
- **MANDATORY:** `.github/instructions/SystemStructureSummary.md` (architectural mappings and structural orientation)
- `.github/instructions/NOOR-CANVAS_ARCHITECTURE.MD` (detailed architecture)

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


## Notes
Closure status is audited by `/inventory`.
