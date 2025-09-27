---
mode: agent
---
# /refactor — Structural Integrity Agent (v3.2.0)

Performs holistic refactors of `{key}` to reduce duplication, remove unused code, improve maintainability, and align with standards — while ensuring analyzers, lints, and all tests remain clean.

**Core Mandate:** Refactors must **never change existing functionality**.  
All modified files are **backed up** for traceability. Obsolete files are deleted post-validation.

---

## Parameters
- **key:** Work stream identifier (auto-inferred if not provided).  
- **notes:** Freeform task description (areas, rationale).  
- **auditMode:** `compact` (default, 10–15 lines) | `full` (detailed breakdown).  

---

## Required Reading
- `.github/instructions/SelfAwareness.instructions.md`  
- `.github/instructions/NOOR-CANVAS_ARCHITECTURE.md`  
- `Workspaces/Copilot/prompts.keys/{key}/`  
- `#getTerminalOutput` for execution evidence  

---

## Application Launch
- **Development:** `./Workspaces/Global/nc.ps1` or `ncb.ps1` (never `dotnet run`).  
- **Testing:** Playwright manages lifecycle via `PW_MODE=standalone` in `playwright.config.cjs`.  
- **Never mix:** Don’t manually launch before Playwright tests.  

---

## Execution Protocol

### Phase 1: Scope & Backup
1. **Scope Check:**  
   - >5 files → present plan for approval.  
   - ≤5 files → proceed directly.  
2. **Backup Originals:**  
   - Copy each modified file to `Workspaces/temp/{key}/` (same name).  
   - Maintain reference map original → refactored.  
   - Auto-cleanup after 30 days.  

### Phase 2: Analysis & Planning
3. **Code Survey:**  
   - Identify duplicate/dead code, bloated implementations.  
   - Extract **TODO Functionalities Checklist** (public APIs, key features).  

### Phase 3: Systematic Refactoring
4. **Apply Updates:**  
   - Deduplication, dead code removal, encapsulation, SoC.  
   - StyleCop for .NET; ESLint + Prettier for JS.  
   - Flag major inefficiencies (>O(n²), repeated DB calls) → approval needed.  
   - Professional naming only (no `-new`, `-fixed`).  
   - Insert rationale comment in new files (reason, preserved functionality, test status).  

### Phase 4: Test Protection
5. **Test Strategy:**  
   - Reuse existing tests; generate only missing ones from TODO list.  
   - Run tests before & after refactor.  
   - All Playwright tests under `PW_MODE=standalone`.  

### Phase 5: Validation
6. **Quality Gates:**  
   - Build = 0 errors, 0 warnings.  
   - All analyzers & linters green.  
   - TODO checklist validated.  
   - Round-trip test (SQL → API → Frontend → API → SQL) for at least one path must succeed.  
7. **Iterative Recovery:**  
   - Checkpoints after major steps.  
   - Max 3 failed attempts → restore from backup.  

---

## Deliverables
- **Scope Summary:** If >5 files.  
- **TODO Checklist:** Preserved functionalities.  
- **Quality Report:** Analyzer, linter, test outcomes.  
- **Audit Trail:** File renames/deletions, backup map, terminal logs.  
- **Completion Statement:** `"Build completed with 0 errors and 0 warnings"`.  

---

## Safety Guardrails
- No changes to: `appsettings.*.json`, secrets, requirements (unless explicitly approved).  
- Stay within `Workspaces/Copilot/` (except `.github/`).  
- SQL Server only (`AHHOME/KSESSIONS_DEV`), never LocalDB.  

---

## Pattern Library (Quick Access)
- **Blazor Cascade Dropdowns:** Use `InvokeAsync()`, timeouts, clear dependencies.  
- **Token-Based Auto-Population:** Sequential API calls, timeouts, fallback.  
- **Service Layer Integration:** Dedicated services, async/await, consistent logging.  
- **Testing:** Comprehensive state transition tests, clipboard, error recovery.  
- **Error Handling:** Distinguish validation vs system errors, reset on interaction.  
- **Performance:** Prevent race conditions, dispose resources, cleanup collections.  
- **Documentation:** Update architecture docs, remove obsolete notes.  

---

## CRITICAL: API Contract & Cross-Layer Validation

**⚠️ REQUIRED READING:** `.github/instructions/API-Contract-Validation.md`

### API Contract Validation
- Response model type consistency between controllers and services.  
- Field name mapping validation (API → Frontend).  
- Fully qualified type names to prevent namespace conflicts.  
- Explicit transformation logic when models differ.  
- End-to-end deserialization testing.  

### Cross-Layer Consistency Check
Copilot must perform a **cross-layer comparison** to ensure data coherence across API DTOs, SQL/data access, and frontend models:  

- **API → SQL Mapping:** Verify DTO fields match SQL entities/tables (naming, types, nullability, defaults).  
- **API → Frontend Mapping:** Ensure DTO fields are exposed and consumed correctly in frontend components/models.  
- **SQL → Frontend Traceability:** Confirm data flows end-to-end with no field mismatches or type conflicts.  
- **Error Handling:** Flag discrepancies (extra/missing fields, mismatched types). Do **not** auto-fix; log and TODO them for approval.  
- **Tests:** Generate/update integration tests to cover at least one round-trip (SQL → API → Frontend → API → SQL).  
- **Core Rule:** Never change functionality. Discrepancies must be documented and surfaced for human review.  

---

## Logging
Lifecycle events must include:  
`[DEBUG-WORKITEM:{key}:refactor:{RUN_ID}] message ;CLEANUP_OK`
