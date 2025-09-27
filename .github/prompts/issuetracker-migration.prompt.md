# issuetracker-migration.prompt.md

## Purpose
This prompt guides Copilot in migrating knowledge from legacy **IssueTracker** files into the active instruction ecosystem.  
The migration process must be selective: only still-relevant fixes and lessons learned are preserved. Outdated or redundant issues must be ignored.

---

## Migration Protocol

### 1. Scope of Analysis
- Only analyze files in the `COMPLETED/` directory.  
- Ignore `AWAITING_CONFIRMATION` or any other folders.  

### 2. Relevance Test
For each completed issue:
- **Obsolete / Redundant** → Ignore.  
  - Criteria: fix refers to code paths, APIs, or components removed by architectural changes, or conflicts solved permanently by later redesigns.  
- **Still Valid** → Preserve.  
  - Criteria: fix encodes a durable requirement, a safeguard, a reusable testing pattern, or infrastructure knowledge that remains applicable to the current architecture.  

### 3. Transformation
For every issue deemed still valid, extract the durable knowledge and restructure it into one of the following key types:

- **key-requirements**  
  - Enduring product or system requirements identified through the issue resolution.  
  - Example: routing rules, validation constraints, UX invariants, error-handling contracts.  

- **key-tests**  
  - Durable test structures or coverage gaps identified and solved.  
  - Example: Playwright suite reorganization, test directory conventions, validation flows that must always be tested.  

- **key-infrastructure / key-techstack**  
  - Architectural, deployment, or environment lessons.  
  - Example: IIS port conflicts, SignalR behavior, IIS Express quirks, dependency management fixes.  

### 4. Folding Into System
- Transformed keys are injected into the active instruction ecosystem:  
  - Requirements → `workitem.prompt.md` and `SelfAwareness.instructions.md`.  
  - Tests → `pwtest.prompt.md`.  
  - Infrastructure / Techstack → `retrosync.prompt.md` (and synced into `SelfAwareness`).  

### 5. Exclusions
- Do not duplicate trivial bug fixes (e.g., typo corrections, single-line patches).  
- Do not migrate redundant fixes already covered in existing keys.  
- Do not keep history for its own sake — only preserve enduring lessons.  

---

## Compliance
- Document each migrated issue with a short justification for **why it was preserved** (or why it was discarded).  
- Maintain transparency by logging counts: total completed issues analyzed, preserved vs. ignored.  
- Ensure migrated knowledge is immediately usable in the target prompts without manual editing.

---

## Outcome
After migration, the IssueTracker markdown files can be safely deleted.  
All surviving, still-applicable knowledge is absorbed into the structured key system, keeping the instruction set lean, current, and authoritative.
