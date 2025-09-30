- Default `keylock-status` is **In Progress** until explicitly set to `complete`.  

---

### 1. Checkpoint Commit (Mandatory)
- Before planning or execution, create a **checkpoint commit** (or equivalent snapshot).  
- Commit message format:  
`checkpoint: pre-task <key>`  
- This ensures rollback capability if the task introduces instability.  

---

### 2. Plan
- Parse `key`, `debug-level`, and any provided `tasks`.  
- Generate a **step-by-step execution plan**, mapping each subtask to the appropriate component, service, or prompt.  
- Identify dependencies and validate that required instructions are available.  
- Plan must clearly describe:  
- Execution order.  
- Expected outcomes.  
- Validation requirements for each step.  

---

### 3. Approval (Mandatory)
- Present the generated plan to the user for confirmation.  
- Do not proceed until explicit approval is given.  
- If no approval is given, halt and mark the task as **Pending Approval**.  

---

### 4. Execute
- After approval, carry out subtasks in sequence.  
- If failure occurs and no override is provided, **halt immediately**.  
- For each step:  
- Apply guardrails from **SelfAwareness**.  
- Confirm compliance with **SystemStructureSummary.md**.  
- Run analyzers, linters, and tests if code/configs are changed.  
- Validate API contracts if endpoints are touched.  
- Respect `debug-level` to control verbosity of execution logging.  

---

### 5. Validate
- Ensure all acceptance criteria are met.  
- Confirm no architectural drift, contract mismatches, or DTO inconsistencies have been introduced.  
- Verify that the solution builds with **zero errors and zero warnings**.  
- Ensure analyzers, linters, and Roslynator checks are all clean.  
- Confirm that all relevant unit, integration, and Playwright tests pass.  

---

### 6. Confirm
- Provide a **human-readable summary** of what was executed and validated.  
- Explicitly restate the **task key** and its **keylock status**.  
- Example confirmation:  
    Task <key> executed successfully.
    Key: <key>
    Key Status: In Progress
- If incomplete or halted, report:  
- Which step failed.  
- Why it failed.  
- Recommended next actions.  

---

### 7. Summary + Key Management
- Update the **keys folder** (`Workspaces/Copilot/prompts.keys`) with the current state of the key.  
- Ensure all keys remain alphabetically sorted.  
- Do not duplicate key/keylock status in this section (already provided in Confirm).  

---

## Guardrails
- **Never** modify functionality unless explicitly required.  
- Always ensure architectural and structural integrity.  
- Always pause and request clarification if uncertain.  
- Maintain alignment across all agents (`sync`, `refactor`, `healthcheck`, `pwtest`, `lock`, `inventory`).  
- Do not continue execution past failure points unless explicitly approved.  

---

## Clean Exit Guarantee
At the end of every task:  
- Solution must build with **zero errors and zero warnings**.  
- All analyzers, linters, and Roslynator checks must pass with no blocking issues.  
- All relevant automated tests (unit, integration, Playwright) must pass.  
- All contracts (API, DTO, DB) must remain intact.  
- No obsolete or broken paths may remain.  

If any of these conditions fail, the task must be marked **Incomplete** and reported in the confirmation output.  

---

## Lifecycle
- Default state: `In Progress`.  
- Tasks transition to `complete` only when explicitly instructed by the user.  
- Keys and summaries in `prompts.keys` remain the **single source of truth** for lifecycle tracking.  
