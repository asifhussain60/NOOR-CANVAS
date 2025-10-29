# Autocomplete Gap Analysis - Plan Prompt Review

**Date:** 2025-10-29  
**Issue:** Plan prompt doesn't create phases with autocomplete, and last instruction of phase 1 doesn't tell it to continue with first task of phase 2  
**Requested Feature:** Auto-complete option as default and recommended

---

## Executive Summary

### Current State ✓ (What Works)
1. **auto-chain parameter exists** in plan.prompt.md (v1.7)
2. **Option E shows as recommended**: "AUTO-EXECUTE ALL PHASES (recommended - E2E execution with auto-chain)"
3. **Handoff logic implemented** in Step 6 with auto-chain awareness
4. **CONCISE-MANDATE Rule 12** mandates defaulting to E2E execution

### Critical Gap ❌ (What's Missing)
1. **No phase-to-phase continuation instruction** - Last task of Phase 1 does NOT tell agent to continue to Phase 2
2. **auto-chain parameter NOT passed to task agent by default** - Must be manually enabled via Option E
3. **Instruction missing in task prompt** - No explicit "continue to next phase" in phase tasks
4. **User friction** - Requires selecting Option E instead of being default behavior

---

## Root Cause Analysis

### Issue 1: Missing Phase Continuation Instruction

**Current Behavior:**
```markdown
### Phase 1: Database Schema
**Tasks:**
1. Add CanvasType column to Sessions table
2. Create migration scripts
3. Test migration in development

// ❌ MISSING: "After completion, continue to Phase 2: Backend Persistence"
```

**Expected Behavior:**
```markdown
### Phase 1: Database Schema
**Tasks:**
1. Add CanvasType column to Sessions table
2. Create migration scripts
3. Test migration in development
4. **Upon completion, automatically continue to Phase 2: Backend Persistence**

### Phase 2: Backend Persistence
**Dependencies:** Phase 1 must be complete
**Tasks:**
1. Update SessionService to set CanvasType
...
```

**Location of Fix:** `plan.prompt.md` Step 4 (Plan Generation) - Plan structure template

---

### Issue 2: auto-chain Not Default

**Current Flow:**
```
Plan Agent (Step 6):
- Generate plan
- Show Option E (AUTO-EXECUTE ALL PHASES) as recommended
- Wait for user to select E
- If E selected: set auto-chain=true
- Invoke task.prompt.md

Task Agent:
- Receive auto-chain parameter
- Execute Phase 1
- Complete Phase 1
- HALT (no auto-continuation unless auto-chain=true)
```

**Desired Flow:**
```
Plan Agent (Step 6):
- Generate plan with auto-chain=true by default
- Show Option A (AUTO-EXECUTE - DEFAULT) 
- Show Option B (Manual step-by-step)
- Auto-execute after 5s unless user says "manual" or "cancel"

Task Agent:
- Receive auto-chain=true (default)
- Execute Phase 1
- Complete Phase 1
- Automatically invoke Phase 2 (no user approval)
- Continue until all phases complete or manual intervention required
```

**Location of Fix:** 
- `plan.prompt.md` Step 6 (default auto-chain=true)
- `task.prompt.md` Step 8.0 (Auto-Chain Protocol)
- `CONCISE-MANDATE.md` Rule 12 enforcement

---

### Issue 3: Task Prompt Doesn't Auto-Continue Phases

**Current task.prompt.md Step 8.0 (Auto-Chain Protocol):**
```markdown
IF auto-chain == true THEN
  // Automatic E2E execution mode
  InvokeTaskPrompt(key, phase=1, auto-chain=true)
  // task.prompt.md will continue to phase 2, 3, ... N automatically
  // Returns here only on completion or manual intervention required
ELSE
  // Manual approval mode (current behavior)
  ShowUserApprovalOptions()
  WaitForUserChoice()
END IF
```

**Problem:** No explicit phase-to-phase continuation logic shown in task.prompt.md

**Location of Fix:** `task.prompt.md` Step 8.0 needs detailed algorithm

---

## Recommended Solutions

### Solution 1: Add Phase Continuation Instructions to Plan Template

**File:** `plan.prompt.md`  
**Section:** Step 4 (Plan Generation) - Plan Structure  

**Change:**
```markdown
## Implementation Plan
### Phase 1: {Title}
**Goal:** {one-liner}
**Tasks:**
1. {task} - {file} - {debug-marker}
2. {task} - {file} - {debug-marker}
3. **AUTO-CONTINUE:** Upon successful completion, automatically proceed to Phase 2

### Phase 2: {Title}
**Dependencies:** Phase 1 must be complete
**Goal:** {one-liner}
**Tasks:**
1. {task} - {file} - {debug-marker}
2. {task} - {file} - {debug-marker}
3. **AUTO-CONTINUE:** Upon successful completion, automatically proceed to Phase 3

### Phase N: {Title} (Final Phase)
**Dependencies:** Phase N-1 must be complete
**Goal:** {one-liner}
**Tasks:**
1. {task} - {file} - {debug-marker}
2. {task} - {file} - {debug-marker}
3. **FINAL PHASE:** Mark work as complete upon successful validation
```

**Rationale:**
- Makes auto-continuation explicit in plan document
- Task agent reads plan and follows continuation instructions
- User sees E2E flow in plan before approval

---

### Solution 2: Make auto-chain=true the Default

**File:** `plan.prompt.md`  
**Section:** Step 6 (Handoff Preparation)  

**Current:**
```markdown
### auto-chain *(optional)*
- `true` - Automatically execute all phases end-to-end without user approval between phases
- `false` - Wait for user approval after each phase (default)
```

**Change To:**
```markdown
### auto-chain *(default=`true`)*
- `true` - Automatically execute all phases end-to-end without user approval between phases (DEFAULT, RECOMMENDED)
- `false` - Wait for user approval after each phase (manual mode)
- User can override by selecting Option B (Manual Mode) during plan approval
```

**Update Step 6 Handoff Logic:**
```markdown
**2. Prepare task handoff parameters:**
- `key={key}` - Key identifier
- `phase=1` - Start with Phase 1
- `github-branch=development` - Target branch
- `commit-checkpoints=true` - Checkpoint after each phase
- `auto-chain=true` - **DEFAULT: Auto-continue phases (override with Option B)**

**3. Auto-chain execution logic:**
```
IF user selects Option B (Manual Mode) THEN
  InvokeTaskPrompt(key, phase=1, auto-chain=false)
  // Manual approval required after each phase
ELSE
  // DEFAULT: Auto-execute (Option A or 5s timeout)
  InvokeTaskPrompt(key, phase=1, auto-chain=true)
  // Phases execute automatically until completion or error
END IF
```
```

**Update Output Format (Phase 3):**
```markdown
**⚡ Options**
**A. AUTO-EXECUTE ALL PHASES** (DEFAULT - recommended, auto-starts in 5s)  
**B.** Manual mode (approve each phase)  
**C.** Review plan files first  
**D.** Modify plan scope  
**E.** Cancel planning

Reply: A (or wait 5s), B, C, D, or E
```

**Rationale:**
- Aligns with CONCISE-MANDATE Rule 12 (default to E2E execution)
- Reduces user friction (one approval for entire plan)
- Manual mode still available for complex/risky changes

---

### Solution 3: Implement Explicit Phase Continuation in task.prompt.md

**File:** `task.prompt.md`  
**Section:** Step 8.0 (Auto-Chain Protocol)  

**Current (vague):**
```markdown
IF auto-chain == true THEN
  // Automatic E2E execution mode
  InvokeTaskPrompt(key, phase=1, auto-chain=true)
  // task.prompt.md will continue to phase 2, 3, ... N automatically
  // Returns here only on completion or manual intervention required
```

**Change To (explicit algorithm):**
```markdown
### Step 8.0: Auto-Chain Protocol (if auto-chain=true)

**Trigger:** `auto-chain` parameter = `true`

**Purpose:** Enable automatic phase-to-phase execution without user intervention

**Algorithm:**
```
FUNCTION ExecuteAutoChainWorkflow(key, auto-chain, phase)
  
  IF auto-chain == false THEN
    // Manual mode - halt after current phase
    ShowPhaseCompletionSummary(phase)
    WaitForUserApprovalForNextPhase()
    RETURN
  END IF
  
  // AUTO-CHAIN MODE - Continue automatically
  
  // Load plan metadata
  planJson = Load("{key}.plan.json")
  currentPhase = phase
  totalPhases = planJson.totalPhases
  
  // Execute current phase
  ExecutePhase(currentPhase)
  
  // Validate current phase completion
  IF PhaseValidationFailed(currentPhase) THEN
    HALT("Phase {currentPhase} validation failed - manual intervention required")
    RETURN
  END IF
  
  // Update JSON tracking
  UpdatePhaseStatus(currentPhase, "completed")
  
  // Check for next phase
  nextPhase = currentPhase + 1
  
  IF nextPhase <= totalPhases THEN
    // Auto-continue to next phase
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Host "📍 Auto-continuing to Phase {nextPhase}/{totalPhases}" -ForegroundColor Yellow
    Write-Host "Phase {nextPhase}: {planJson.phases[nextPhase].title}" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Host ""
    
    // Self-invoke for next phase (recursive execution)
    SELF_INVOKE: @workspace /task key={key} phase={nextPhase} auto-chain=true
    
  ELSE
    // All phases complete
    Write-Host "✅ All {totalPhases} phases complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  @workspace /task key={key} tasks='mark complete'" -ForegroundColor White
    
    STOP_AUTO_CHAIN()
  END IF
  
END FUNCTION
```

**Manual Intervention Triggers** (halt auto-chain):
- Phase validation failure (build errors, test failures)
- Database migration review required (user must approve SQL)
- Critical lint violations detected
- User explicitly requests "pause" or "manual" during execution
- Error rate exceeds threshold (3 failures in sequence)

**Auto-Chain Continuation** (no halt):
- Successful phase completion
- All validations pass (build, lint, tests)
- Checkpoint commits created successfully
- No manual intervention flags in plan
```

**Rationale:**
- Makes phase continuation explicit and automated
- Clear halt conditions for safety
- User can interrupt with Ctrl+C at any time
- Maintains safety with validation gates

---

### Solution 4: Update User Options Format

**File:** `plan.prompt.md`  
**Section:** OUTPUT FORMAT (Phase 3 - After Plan Generation)

**Current:**
```markdown
**⚡ Options**
**A.** Execute Phase 1 only (manual approval for each phase)  
**B.** Review plan files first  
**C.** Modify plan scope  
**D.** Cancel planning  
**E. AUTO-EXECUTE ALL PHASES** (recommended - E2E execution with auto-chain)
```

**Change To:**
```markdown
**⚡ Options**
**A. AUTO-EXECUTE ALL PHASES** (RECOMMENDED - starts in 5s)  
**B.** Manual mode (approve each phase individually)  
**C.** Review plan files first  
**D.** Modify plan scope  
**E.** Cancel planning

Auto-executing in 5 seconds... Say "manual" or "cancel" to abort.
```

**Behavior:**
- **Default (5s timeout):** Set `auto-chain=true`, invoke task.prompt.md
- **"manual" or "B":** Set `auto-chain=false`, invoke task.prompt.md with manual approval gates
- **"cancel" or "E":** Abort execution
- **"review" or "C":** Show plan files, then re-ask

**Rationale:**
- Auto-execute is now default (no user action required)
- Manual mode still accessible for complex work
- Clear countdown gives user control
- Aligns with CONCISE-MANDATE Rule 12

---

## Implementation Priority

### High Priority (Immediate)
1. ✅ **Solution 1:** Add AUTO-CONTINUE instructions to plan template
2. ✅ **Solution 3:** Implement explicit auto-chain algorithm in task.prompt.md
3. ✅ **Solution 4:** Update user options to default to auto-execute

### Medium Priority (Next)
4. ✅ **Solution 2:** Make auto-chain=true the default parameter

### Low Priority (Optional)
5. Add progress indicators during auto-chain execution
6. Add pause/resume functionality
7. Add phase rollback within auto-chain

---

## Testing Checklist

After implementing solutions, verify:

- [ ] Plan generated with AUTO-CONTINUE instructions in each phase
- [ ] Task agent reads AUTO-CONTINUE and proceeds to next phase
- [ ] User sees countdown "Auto-executing in 5 seconds..."
- [ ] Manual mode still works (Option B stops auto-chain)
- [ ] Validation failures halt auto-chain correctly
- [ ] All phases execute without user intervention (happy path)
- [ ] JSON tracking updates after each phase
- [ ] Checkpoint commits created between phases
- [ ] Final phase completes and shows "mark complete" instruction

---

## Example: Before vs After

### BEFORE (Current - Manual Approval Required)

**Plan Output:**
```
📌 Plan Overview
1. Phase 1: Database Schema (3 tasks, 2 files)
2. Phase 2: Backend Persistence (4 tasks, 3 files)
3. Phase 3: Frontend Routing (5 tasks, 4 files)

⚡ Options
A. Execute Phase 1 only
B. Review plan files first
C. Modify plan scope
D. Cancel planning
E. AUTO-EXECUTE ALL PHASES (recommended)

Reply: A, B, C, D, or E
```

**User Experience:**
- User must type "E" or select option
- Agent invokes task.prompt.md with auto-chain=true
- Phases execute automatically

### AFTER (Proposed - Auto-Execute Default)

**Plan Output:**
```
📌 Plan Overview
1. Phase 1: Database Schema (3 tasks, 2 files) → AUTO-CONTINUE to Phase 2
2. Phase 2: Backend Persistence (4 tasks, 3 files) → AUTO-CONTINUE to Phase 3
3. Phase 3: Frontend Routing (5 tasks, 4 files) → FINAL PHASE

⚡ Options
A. AUTO-EXECUTE ALL PHASES (RECOMMENDED - starts in 5s)
B. Manual mode (approve each phase)
C. Review plan files first
D. Modify plan scope
E. Cancel planning

Auto-executing in 5 seconds... Say "manual" or "cancel" to abort.
```

**User Experience:**
- No action required (auto-starts in 5s)
- User can say "manual" to switch to step-by-step mode
- User can say "cancel" to abort
- Phases execute automatically with progress indicators

---

## Files Requiring Changes

1. **plan.prompt.md**
   - Step 4 (Plan Generation) - Add AUTO-CONTINUE to phase template
   - Step 6 (Handoff Preparation) - Change auto-chain default to true
   - OUTPUT FORMAT - Reorder options, add countdown

2. **task.prompt.md**
   - Step 8.0 (Auto-Chain Protocol) - Add explicit phase continuation algorithm
   - Update parameter documentation (auto-chain default=true)

3. **CONCISE-MANDATE.md**
   - Rule 12 enforcement clarification (already mentions E2E default)
   - Update examples to show auto-execute as default

4. **handoff-protocol.md**
   - Update to include auto-chain=true in standard handoff package

---

## Conclusion

The autocomplete feature **exists** but is **not the default**. The core issue is:

1. **auto-chain defaults to false** instead of true
2. **User must manually select Option E** instead of auto-executing
3. **Phase continuation not explicit** in plan template
4. **task.prompt.md algorithm vague** about phase-to-phase flow

**Recommended Fix:**
- Make `auto-chain=true` the default
- Add AUTO-CONTINUE instructions to each phase in plan
- Implement explicit phase continuation algorithm in task.prompt.md
- Show countdown "Auto-executing in 5 seconds..." with Option B for manual mode
- User approves plan ONCE, execution proceeds E2E until completion or error

This aligns with:
- **CONCISE-MANDATE Rule 12** - Default to E2E execution
- **User expectation** - Approve once, let it run
- **Safety** - Manual mode still available for complex work
