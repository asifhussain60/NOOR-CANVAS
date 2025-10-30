# High-Priority Task Detection Protocol (ALL CAPS Mandate)

## Purpose
Automatically detect and track high-priority constraints when user uses ALL CAPS in their request. These become mandatory verification checkpoints before work completion.

---

## Detection Pattern

**Trigger**: User uses ALL CAPS for emphasis in task description

**Examples**:
- "Add share button but do NOT remove the existing save button"
- "Fix the styling but PRESERVE the existing functionality"
- "Implement this feature EXACTLY as shown in the mockup"
- "Update the component but do NOT change the API contract"
- "Refactor the code but MAINTAIN backward compatibility"

**Pattern Recognition**:
```regex
\b([A-Z]{2,})\s+(NOT|NEVER|ALWAYS|MUST|EXACTLY|PRESERVE|MAINTAIN|KEEP)\b
```

---

## High-Priority Task Extraction

**Step 2.1.5: Extract High-Priority Constraints** (NEW - Insert in Context Gathering)

**Process**:
1. **Scan user request for ALL CAPS patterns**:
   ```
   User: "Add share button but do NOT remove the existing save button"
   
   Detected HIGH-PRIORITY constraint:
   - "do NOT remove the existing save button"
   ```

2. **Extract constraint details**:
   - **Action**: "do NOT remove"
   - **Target**: "existing save button"
   - **Category**: Preservation (don't break existing functionality)

3. **Create High-Priority Task Entry**:
   ```markdown
   ## High-Priority Constraints
   
   ### Constraint 1: Preserve Existing Save Button
   - **Source**: User request (ALL CAPS emphasis)
   - **Action Prohibited**: Removal of save button
   - **Verification Method**: Visual inspection + DOM query
   - **Status**: [PENDING] → [VERIFIED] → [FAILED]
   ```

4. **Add to Plan (Step 3)**:
   ```markdown
   ## Implementation Plan
   
   ### Primary Objective
   - Add share button to SessionCanvas component
   
   ### HIGH-PRIORITY Constraints (MUST VERIFY before completion)
   - [CONSTRAINT 1] do NOT remove existing save button
     - Verification: Check `.session-save-button` exists in DOM after changes
     - Rollback trigger: If save button removed, revert all changes
   ```

---

## Constraint Categories

### Category 1: Preservation (do NOT remove/change/break)
**Detection**: `NOT|NEVER` + action verb + target

**Examples**:
- "do NOT remove the logout button"
- "NEVER change the existing API contract"
- "do NOT break backward compatibility"

**Verification**:
- Visual inspection (UI elements still visible)
- DOM query (elements still exist with same selectors)
- API contract validation (endpoints return same response structure)
- Regression tests (existing tests still pass)

---

### Category 2: Exactness (EXACTLY as specified)
**Detection**: `EXACTLY|PRECISELY` + specification

**Examples**:
- "Implement EXACTLY as shown in the mockup"
- "Use EXACTLY these colors: #FF5733"
- "Match the design PRECISELY"

**Verification**:
- Screenshot comparison (Percy visual regression)
- Color value validation (CSS property inspection)
- Layout measurement (pixel-perfect positioning)

---

### Category 3: Mandatory Inclusion (MUST include/add/have)
**Detection**: `MUST|ALWAYS` + include/add/have + feature

**Examples**:
- "MUST include error handling"
- "ALWAYS show confirmation dialog"
- "Component MUST have accessibility attributes"

**Verification**:
- Code inspection (verify error handling exists)
- E2E testing (confirm dialog appears)
- Accessibility audit (ARIA attributes present)

---

### Category 4: Behavioral Constraints (MAINTAIN/KEEP/PRESERVE behavior)
**Detection**: `MAINTAIN|KEEP|PRESERVE` + behavior/functionality

**Examples**:
- "MAINTAIN existing drag-and-drop behavior"
- "KEEP the current sorting logic"
- "PRESERVE the animation timing"

**Verification**:
- Functional testing (behavior works as before)
- Regression testing (existing tests pass)
- User acceptance testing (manual verification)

---

## High-Priority Task Tracking

### Step 3: Planning Phase
**Add HIGH-PRIORITY section to plan**:
```markdown
## Implementation Plan

### Primary Objective
{main task description}

### HIGH-PRIORITY Constraints (ALL CAPS from user)
1. [CONSTRAINT] do NOT remove existing save button
   - **Category**: Preservation
   - **Verification**: DOM query for `.session-save-button`
   - **Status**: PENDING
   
2. [CONSTRAINT] EXACTLY match mockup colors
   - **Category**: Exactness
   - **Verification**: Percy visual regression + CSS value check
   - **Status**: PENDING
```

---

### Step 5: Execution Phase
**Track constraint status during implementation**:
```markdown
## Execution Progress

### Subtask 1: Add share button component
- [IN PROGRESS] Creating ShareButton.razor
- [VERIFIED] Constraint 1: Save button still exists in DOM ✓

### Subtask 2: Apply mockup styling
- [IN PROGRESS] Updating CSS
- [PENDING] Constraint 2: Color verification (awaiting Percy)
```

---

### Step 6: Validation Phase
**Step 6.3: High-Priority Constraint Verification** (NEW - Insert after lint validation)

**Execution**:
```powershell
# For each high-priority constraint, run verification check

# Example: Verify save button still exists
$saveButtonExists = dotnet test --filter "TestName~SaveButtonPresent"
if ($LASTEXITCODE -ne 0) {
    Write-Host "[CONSTRAINT FAIL] Save button was removed (violates user constraint)" -ForegroundColor Red
    # Trigger rollback
    git reset --hard HEAD~1
    exit 1
}
```

**Verification Checklist**:
```markdown
## High-Priority Constraint Verification

- [PASS] Constraint 1: Save button preserved (DOM query successful)
- [PASS] Constraint 2: Colors match mockup (Percy visual test passed)
- [PASS] Constraint 3: Error handling included (unit test coverage)
- [PASS] Constraint 4: Drag-and-drop behavior maintained (E2E test passed)
```

---

### Step 7: Confirmation Phase
**Include constraint verification in summary**:
```
SUMMARY: {key-name}
- Status: Complete
- Work Done: Added share button with confirmation dialog
- Files Modified: 3 files
- Debug Logging: none
- Tests: 8 passed
- Build: Clean
- Lint Validation: PASS

HIGH-PRIORITY Constraints Verified:
- [PASS] Save button preserved (user requested: do NOT remove)
- [PASS] Mockup colors matched (user requested: EXACTLY match)
```

---

### Step 8: Key Data Stream Update
**Document constraint verification**:
```markdown
### 2025-10-18T12:30:00Z
- **Status**: Complete
- **Changes**: Added share button component with dialog
- **Files Affected**: ShareButton.razor, SessionCanvas.razor, styles.css
- **Tests**: 8 passed (including constraint verification tests)
- **Commit**: a3f5b9c1234

**HIGH-PRIORITY Constraints Verified**:
- [PASS] Save button preserved (user ALL CAPS: do NOT remove)
  - Verification: DOM query `.session-save-button` successful
  - Test: `SaveButtonPresent` test passed
- [PASS] Mockup colors matched (user ALL CAPS: EXACTLY match)
  - Verification: Percy visual regression passed
  - CSS values: #FF5733 confirmed in styles.css
```

---

## Constraint Violation Protocol

**If high-priority constraint is violated:**

1. **Immediate Halt**:
   ```
   [CONSTRAINT VIOLATION]
   User requested: do NOT remove save button
   Current state: Save button missing from DOM
   
   HALTING execution. Rolling back to checkpoint.
   ```

2. **Rollback**:
   ```powershell
   git reset --hard {checkpoint-tag}
   ```

3. **Notify User**:
   ```
   ⚠️ HIGH-PRIORITY CONSTRAINT VIOLATED
   
   Your request emphasized: "do NOT remove the existing save button"
   
   Current implementation removed the save button, which violates this constraint.
   
   Actions taken:
   - Rolled back to checkpoint: checkpoint/canvas/2025-10-18_1230
   - Preserved all work in git history (can re-apply if needed)
   
   Next steps:
   1. Review implementation plan to avoid button removal
   2. Re-execute with constraint in mind
   OR
   3. Clarify if constraint should be relaxed
   ```

4. **Re-Plan** (return to Step 3 with constraint awareness)

---

## Integration with Task Prompt

### Step 2.1: Key Resolution (Update)
**Add Step 2.1.5: Extract High-Priority Constraints**

```markdown
### Step 2.1.5: Extract High-Priority Constraints

**Scan user request for ALL CAPS emphasis patterns.**

**Detection**:
1. Regex scan for ALL CAPS + action verbs (NOT, NEVER, ALWAYS, MUST, EXACTLY, etc.)
2. Extract constraint details (action, target, category)
3. Create High-Priority Task entries

**Output**:
```
HIGH-PRIORITY Constraints Detected:
1. do NOT remove existing save button (Preservation)
2. EXACTLY match mockup colors (Exactness)
```

**Add to context for Step 3 planning.**
```

### Step 3: Plan (Update)
**Always include HIGH-PRIORITY Constraints section if detected**

### Step 6: Validate (Update)
**Add Step 6.3: High-Priority Constraint Verification**
- Run verification checks for each constraint
- HALT if any constraint violated
- Document results in key data stream

### Step 7: Confirm (Update)
**Include constraint verification summary in output**

---

## Examples

### Example 1: Preservation Constraint
```
User: "Add share button but do NOT remove the existing save button"

Detection:
- Pattern: "do NOT remove"
- Target: "existing save button"
- Category: Preservation

Plan:
- [CONSTRAINT] Preserve save button
  - Verification: DOM query `.session-save-button`

Execution:
- Added share button
- Verified save button still exists ✓

Confirmation:
- [PASS] Save button preserved (user constraint verified)
```

### Example 2: Exactness Constraint
```
User: "Update styling to EXACTLY match the mockup colors #FF5733 and #3357FF"

Detection:
- Pattern: "EXACTLY match"
- Target: "mockup colors #FF5733 and #3357FF"
- Category: Exactness

Plan:
- [CONSTRAINT] Match exact colors
  - Verification: CSS inspection + Percy visual test

Execution:
- Updated CSS with specified colors
- Ran Percy visual regression ✓

Confirmation:
- [PASS] Colors matched exactly (CSS values confirmed)
```

### Example 3: Mandatory Inclusion Constraint
```
User: "Implement delete feature but MUST include confirmation dialog"

Detection:
- Pattern: "MUST include"
- Target: "confirmation dialog"
- Category: Mandatory Inclusion

Plan:
- [CONSTRAINT] Include confirmation dialog
  - Verification: E2E test for dialog appearance

Execution:
- Added delete button
- Implemented confirmation dialog
- Created E2E test ✓

Confirmation:
- [PASS] Confirmation dialog included (E2E test passed)
```

---

## Success Criteria

- [PASS] ALL CAPS patterns detected in user request
- [PASS] High-priority constraints extracted and categorized
- [PASS] Constraints added to implementation plan
- [PASS] Verification methods defined for each constraint
- [PASS] Constraints verified during validation phase
- [PASS] Constraint verification documented in key data stream
- [PASS] Constraint violations trigger rollback

---

End of High-Priority Task Detection Protocol
