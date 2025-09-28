---
mode: agent
---

# /inventory — Key Inventory & Status Agent (v1.1.0)

Performs an audit of all keys in `NOOR-CANVAS/Workspaces/Copilot/prompts.keys`, reporting whether they have been closed by `/keylock`.  
This agent identifies **pending/unresolved issues** for follow-up.

**Core Mandate:** Follow `.github/instructions/SelfAwareness.instructions.md` for all operating guardrails.  
**Required Reading:** `.github/instructions/SystemStructureSummary.md` (architectural mappings).

---

## Parameters
- **key:** Specific key identifier.  
  - If provided, return status for just that key.  
  - If set to `all` or left blank, return the status for all keys in a table view.
- **notes:** Optional context, filters, or clarifications.

---

## Output Format

### Case 1: Specific Key
When `key` is specified, return a detailed block:

```
Key: <key name>
Files: <list of files involved>
API: <list of API endpoints touched>
Views: <UI/views affected>
SQL Objects: <tables, procs, functions touched>
Status: <closed | pending>
```

---

### Case 2: All Keys (key = all | blank)
When auditing all keys, return a **table sorted by status**:

**Pending items appear at the top, closed items at the bottom.**

| Key        | Files                         | API Endpoints             | Views              | SQL Objects             | Status   |
|------------|-------------------------------|---------------------------|--------------------|-------------------------|----------|
| workitem   | src/workitem.js               | /api/workitem/start       | WorkItemDashboard  | tasks.active            | pending  |
| cleanup    | utils/cleanup.py              | N/A                       | N/A                | cleanup_audit           | closed   |

---

## Behavior
1. **Discovery:** Scan `NOOR-CANVAS/Workspaces/Copilot/prompts.keys` for all registered keys.
2. **Cross-check:** Verify closure status with `/keylock`.  
   - If `/keylock` contains no record → `pending`.
   - If `/keylock` confirms staging + commit → `closed`.
3. **Expansion:** If applicable, pull metadata from associated files, APIs, views, and SQL objects.
4. **Reporting:**  
   - Specific key → detailed block.  
   - All keys → table, sorted pending → closed.

---

## Complementarity with Existing Prompts
- `/keylock`: Confirms closure; `/inventory` audits whether closure has been applied.
- `/retrosync`: Ensures requirements ↔ implementation ↔ tests align; `/inventory` ensures tasks ↔ keylock closure align.
- `/promptsync`: Keeps structure consistent; `/inventory` checks operational state.
- `/continue` & `/workitem`: These produce ongoing work items; `/inventory` lists which remain unresolved.

Together, `/inventory` + `/keylock` form a **ledger system**: one locks, the other audits.

---
