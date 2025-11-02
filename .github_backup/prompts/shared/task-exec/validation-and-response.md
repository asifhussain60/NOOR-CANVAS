# Validation and Response Protocol (Step 7)

**Purpose:** Confirm work completion with comprehensive validation before presenting summary

**Referenced by:** task.prompt.md Step 7

**Dependencies:**
- `shared/output-style-mandate.md` - CONCISE-MANDATE enforcement
- `shared/snippet-handling-policy.md` - No code snippets in response

---

## BLOCKER VALIDATION (Execute BEFORE Summary)

**Purpose:** Ensure documentation completeness - "Document first, report later"

**Validation Checklist:**

```
Documentation Completeness Check:
  ✓ Step 2.2.1 executed? (User Request + Implementation Plan recorded)
  ✓ Work-log.md contains Views/Components section? (if UI work)
  ✓ Work-log.md contains API Endpoints section? (if API work)
  ✓ Work-log.md contains Database section? (if data persistence)
  ✓ Work-log.md contains SignalR Hubs section? (if real-time features)
  ✓ Work-log.md contains HTML/CSS/JavaScript changes? (if UI styling)
  ✓ Work-log.md contains Testing Results? (all tests documented)
  ✓ Work-log.md contains complete file paths, method names, line ranges?

IF any check fails:
  → HALT confirmation
  → Update work-log.md with missing documentation
  → Then proceed to summary

WHY: Work-log must be comprehensive for investigation timeline reconstruction
```

---

## Summary Output (Controlled by Verbosity)

### Concise Mode

**Format:**

```
SUMMARY: {key-name}
- Status: {In Progress | Complete | Failed}
- Work Done: {1-2 sentence summary}
- Files Modified: {count} files
- Debug Logging: {inserted | removed | none}
- Tests: {passed/failed count}
- Build: {Clean | Warnings | Errors}
- Lint Validation: {PASS | FAIL} ({file-type breakdown})
- High-Priority Constraints: {N} verified
- Approval Iterations: {N} (if re-evaluation occurred)
- Checkpoint: checkpoint/{key}/{timestamp}
```

**Example:**

```
SUMMARY: key-108-delete-confirmation

- Status: Complete
- Work Done: Added delete confirmation dialog to SessionCanvas
- Files Modified: 3 files
- Debug Logging: none
- Tests: 2 passed (functional + visual)
- Build: Clean
- Lint Validation: PASS (C#: 2 files, CSS: 1 file)
- High-Priority Constraints: 2 verified
- Approval Iterations: 0
- Checkpoint: checkpoint/key-108/20251029-142315
```

---

### Detailed Mode

**Format:**

```
SUMMARY: {key-name}

- Status: {In Progress | Complete | Failed}

- Work Done:
  * {detailed change 1}
  * {detailed change 2}
  * {detailed change 3}

- Files Modified: {count} files
  - {file1}: {change description}
  - {file2}: {change description}
  - {file3}: {change description}

- Debug Logging: {details}
  - Inserted: {count} markers
  - Locations: {file paths and line numbers}
  - Level: {minimal | detailed}

- Tests: {X passed, Y failed}
  - Functional: {test-name} - PASSED
  - Visual (Percy): {test-name} - PASSED
  - {test-name} - FAILED (details: {error message})

- Build: {Clean | Warnings | Errors}
  - Warnings: {count} ({details if present})
  - Errors: {count} ({details if present})

- Lint Validation: {PASS | FAIL}
  - C# Files: {count} files ({warnings/errors count})
  - JS/TS Files: {count} files ({warnings/errors count})
  - CSS Files: {count} files ({warnings/errors count})
  - PowerShell: {count} files ({warnings/errors count})
  - JSON: {count} files ({syntax status})

- High-Priority Constraints Verified:
  - [PASS] {constraint 1 description}
    - Verification: {method used}
    - Evidence: {test results, file paths, etc.}
  - [PASS] {constraint 2 description}
    - Verification: {method used}
    - Evidence: {test results, file paths, etc.}

- Approval Iterations: {N}
  - Iteration 1: {additional requirement 1}
  - Iteration 2: {additional requirement 2}
  - Final: User approved after {N} iterations

- Checkpoint: checkpoint/{key}/{timestamp}
  - Browse: git tag --list "checkpoint/{key}/*" --sort=-creatordate
  - Rollback: git reset --hard checkpoint/{key}/{timestamp}
  - Parent: {parent-checkpoint-sha}

- Phase Tracking (if phase-driven):
  - Current Phase: {phase number} of {total phases}
  - Phase Status: {Complete | In Progress}
  - Next Phase: {phase number} - {phase title}
```

**Example:**

```
SUMMARY: key-108-delete-confirmation

- Status: Complete

- Work Done:
  * Added ConfirmDialog component to SessionCanvas.razor
  * Wired up deletion flow with confirmation step
  * Added confirmation state management to SessionService
  * Updated CSS for modal dialog styling

- Files Modified: 3 files
  - SPA/NoorCanvas/Components/SessionCanvas.razor: Added ConfirmDialog component, wired delete handler
  - SPA/NoorCanvas/Services/SessionService.cs: Added DeleteWithConfirmation method
  - SPA/NoorCanvas/wwwroot/css/session-canvas.css: Added modal styling

- Debug Logging: none

- Tests: 2 passed
  - Functional: delete-confirmation-functional.spec.ts - PASSED
  - Visual (Percy): delete-confirmation-visual.spec.ts - PASSED

- Build: Clean (0 warnings, 0 errors)

- Lint Validation: PASS
  - C# Files: 2 files (0 warnings)
  - CSS Files: 1 file (0 errors)

- High-Priority Constraints Verified:
  - [PASS] DO NOT remove existing save button
    - Verification: DOM query `.session-save-button` successful
    - Evidence: Regression test passed, button still renders
  - [PASS] EXACTLY match mockup colors
    - Verification: Percy visual regression test
    - Evidence: CSS values #FF5733, #3357FF confirmed, Percy snapshot approved

- Approval Iterations: 1
  - Iteration 1: User requested blue button instead of red
  - Final: User approved after 1 iteration

- Checkpoint: checkpoint/key-108/20251029-142315
  - Browse: git tag --list "checkpoint/key-108/*" --sort=-creatordate
  - Rollback: git reset --hard checkpoint/key-108/20251029-142315
  - Parent: a3f9d2c (from rollback-index.md)
```

---

## CONCISE-MANDATE Enforcement

**CRITICAL:** All summary output must comply with CONCISE-MANDATE principles

**Load Module:** `.github/prompts/shared/output-style-mandate.md`

**Mandatory Rules:**

1. **NO code snippets** in summary (violates snippet-handling-policy.md)
   - ❌ Don't show code examples
   - ✅ Reference file paths and line numbers instead

2. **File path references only:**
   - ✅ "Modified SPA/NoorCanvas/Components/SessionCanvas.razor (lines 42-58)"
   - ❌ "Added this code: `<ConfirmDialog ... />`"

3. **Succinct descriptions:**
   - ✅ "Added delete confirmation dialog"
   - ❌ "I added a new component called ConfirmDialog which displays when the user clicks delete and asks them if they're sure they want to delete the session..."

4. **Structured lists:**
   - Use bullet points for multiple items
   - Use sections for categorization
   - Keep depth to 2-3 levels maximum

5. **Factual, actionable language:**
   - ✅ "Tests passed"
   - ❌ "I think the tests probably passed but you should verify"

---

## Status Values

**In Progress:**
- Work started but not complete
- Waiting for user input
- Blocked by external dependency

**Complete:**
- All subtasks finished
- Tests passing
- Build clean
- Lint validation passed
- High-priority constraints verified
- Documentation complete

**Failed:**
- Critical error encountered
- Tests failing (cannot fix automatically)
- Build errors (cannot resolve)
- Lint failures (cannot auto-fix)
- Constraint violation detected

---

## Checkpoint Information

**Always include checkpoint details:**

```
Checkpoint: checkpoint/{key}/{timestamp}
- Browse: git tag --list "checkpoint/{key}/*" --sort=-creatordate
- Rollback: git reset --hard checkpoint/{key}/{timestamp}
- Parent: {parent-checkpoint-sha} (from rollback-index.md)
```

**Purpose:**
- Provides rollback point for user
- Shows lineage (parent checkpoint)
- Enables browsing all checkpoints for this key

---

## Phase-Driven Execution Details

**If phase-driven execution (when {key}.plan.md exists):**

Include phase tracking in detailed mode:

```
- Phase Tracking:
  - Current Phase: 2 of 4
  - Phase Status: Complete
  - Next Phase: 3 - API Implementation
  - Approval Gate: User must approve before Phase 3
```

**Phase completion summary:**

```
Phase 2 Complete: UI Implementation

Next Steps:
- Review Phase 2 changes
- Approve to proceed to Phase 3: API Implementation
- Or request modifications to Phase 2

To approve: Respond with "proceed" or "yes"
To modify: Describe additional requirements
```

---

## Drift Items Summary (if detected)

**If drift items detected during execution:**

```
- Drift Items Detected: {count}
  - HIGH: {count} items
  - MEDIUM: {count} items
  - LOW: {count} items
  
See work-log.md for complete drift details
```

**At Step 9 (Completion):**
Present full drift summary with resolution options
