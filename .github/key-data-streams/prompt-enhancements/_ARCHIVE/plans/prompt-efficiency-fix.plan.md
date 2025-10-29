# Prompt System Efficiency Fix Plan

**Key:** `prompt-efficiency-fix`  
**Status:** In Progress  
**Created:** 2025-10-29  
**Priority:** High (System Foundation)

---

## Executive Summary

Comprehensive audit revealed 5 critical gaps in prompt system that prevent efficient operation and proper key data stream management. This plan addresses all gaps systematically.

---

## Current State Analysis

### Gap 1: State Tracking Non-Functional
**Issue:** `state-tracker.ps1` referenced in all prompts but PowerShell cannot execute in Copilot context
**Impact:** No `state.json` files created, no request/handoff/commit tracking
**Evidence:** 66 work-log.md files exist, zero state.json files found

### Gap 2: Document-First Not Enforced
**Issue:** User sees summaries before files finalized (plan.prompt.md Step 7.5 validates AFTER file creation)
**Impact:** Risk of incomplete documentation if execution interrupted
**Current Flow:** Step 4 (Create .plan.md) → Step 5 (Create work-log.md) → Step 7.5 (Validate) → USER OUTPUT

### Gap 3: No Efficiency Enhancement Registry
**Issue:** Optimization references scattered (caching, parallelization, context-gathering-phases.md)
**Impact:** Prompts cannot discover available efficiency functions
**Missing:** Centralized `.github/prompts/shared/efficiency-enhancements.md`

### Gap 4: Key Auto-Detection Reliability
**Issue:** Fails silently after 3 attempts, vague error messages
**Impact:** Users don't know to manually specify key
**Files:** `key-generator.md`, `todo.prompt.md`, `task.prompt.md`

### Gap 5: State Tracking Adoption Verification
**Issue:** All prompts reference state-tracker.ps1 but cannot execute it
**Impact:** False sense of tracking capability
**Affected:** route, plan, todo, task, test-generation, drift, cohesion, ask, healthcheck

---

## Implementation Plan

### Phase 1: Replace PowerShell State Tracking with File-Based Tracking

**Goal:** Create executable alternative to state-tracker.ps1

**Tasks:**
1. Create `.github/prompts/shared/state-manager.md` (replaces state-tracker.ps1)
2. Define file-based state tracking protocol:
   - `{key}/state.json` created during Step -1 (plan initialization)
   - Manual file creation with template (Copilot can write files)
   - Update functions become file write instructions
3. Update all prompts to use state-manager.md instead of state-tracker.ps1
4. Test: Verify state.json created during plan invocation

**Files Modified:**
- `.github/prompts/shared/state-manager.md` (NEW)
- `.github/prompts/plan.prompt.md` (Step -1)
- `.github/prompts/route.prompt.md` (Step -2)
- `.github/prompts/todo.prompt.md` (Step -1)
- `.github/prompts/task.prompt.md` (Step -1)
- `.github/prompts/test-generation.prompt.md` (Step -1)
- `.github/prompts/drift.prompt.md` (Step -1)
- `.github/prompts/ask.prompt.md` (Step -1)
- `.github/prompts/healthcheck.prompt.md` (Step -1)
- `.github/prompts/cohesion.prompt.md` (Step -1)

**Exit Criteria:**
- state.json created during plan.prompt.md execution
- requests[] array populated with user request
- lastUpdated timestamp accurate

---

### Phase 2: Enforce Document-First Protocol

**Goal:** Block user output until all key data stream files finalized

**Tasks:**
1. Add Step 5.5 to plan.prompt.md: "File Finalization Verification"
2. Verify .plan.md, .plan.json, work-log.md exist before proceeding
3. Move Step 7.5 (Response Validation) AFTER Step 5.5
4. Update output-validator.md to check file existence
5. Add file existence checks to task.prompt.md, todo.prompt.md

**New Step 5.5 in plan.prompt.md:**
```markdown
## 🔍 Step 5.5: FILE FINALIZATION VERIFICATION (BLOCKING)

**Purpose:** Ensure all key data stream files created before user output

**Verification Checklist:**
1. `.github/key-data-streams/{key}/{key}.plan.md` exists
2. `.github/key-data-streams/{key}/{key}.plan.json` exists  
3. `.github/key-data-streams/{key}/work-log.md` exists
4. `.github/key-data-streams/{key}/state.json` exists (if using state tracking)

**If ANY file missing:**
- HALT execution
- Log error: "File finalization incomplete"
- DO NOT proceed to Step 7.5 (Response Validation)
- DO NOT show user output

**If ALL files verified:**
- Proceed to Step 7.5 (Response Validation)
```

**Exit Criteria:**
- User output blocked if files missing
- All prompts verify file existence before responding
- Test: Delete .plan.md during execution, verify HALT

---

### Phase 3: Create Efficiency Enhancement Registry

**Goal:** Centralize all optimization capabilities for prompt discovery

**Tasks:**
1. Create `.github/prompts/shared/efficiency-enhancements.md`
2. Document available enhancements:
   - Context gathering phases (10-phase protocol)
   - Parallel file reads (semantic_search + grep_search)
   - Caching strategies (reuse context across steps)
   - Skip conditions (lightweight mode, simple work)
3. Add cross-references from plan, task, todo prompts
4. Update context-gathering-phases.md to reference registry

**Enhancement Registry Structure:**
```markdown
# Efficiency Enhancement Registry

## Available Enhancements

### 1. Context Gathering Phases (context-gathering-phases.md)
**Purpose:** 10-phase incremental context loading
**When to Use:** Complex multi-file changes, architectural analysis
**Skip Conditions:** Simple work (1-2 files), lightweight mode

### 2. Parallel Context Loading
**Purpose:** Load multiple files simultaneously
**Tools:** semantic_search + grep_search + read_file in parallel
**Speedup:** 3-5x faster than sequential

### 3. Lightweight Mode (plan.prompt.md)
**Purpose:** Skip questionnaires for simple features
**Trigger:** include_suggestions='lightweight-mode'
**Savings:** 50% reduction in steps

### 4. Auto-Chain Execution (task.prompt.md)
**Purpose:** Unassisted phase-to-phase transitions
**Trigger:** auto-chain=true
**Requirements:** Test registry, checkpoint commits
```

**Exit Criteria:**
- efficiency-enhancements.md created with 5+ documented enhancements
- All prompts reference registry in "See Also" sections
- Test: Invoke plan.prompt.md with lightweight-mode, verify skip

---

### Phase 4: Improve Key Auto-Detection Reliability

**Goal:** Clear error messages, better fallback logic

**Tasks:**
1. Update key-generator.md with enhanced error handling
2. Add user-friendly messages when detection fails
3. Update todo.prompt.md fallback logic (3 attempts → clear message)
4. Update task.prompt.md Step 0.5 with manual key suggestion
5. Add loop-prevention.md check for repeated failures

**Enhanced Error Messages:**
```markdown
## Auto-Detection Failure Protocol

**After 3 failed attempts:**

```
⚠️ Key Auto-Detection Failed

Could not detect active key from git history.

**Possible causes:**
- No recent commits with key markers (ckpt:, DEBUG-WORKITEM:)
- Working on new feature (no existing key)
- Git history unavailable

**Next steps:**
1. Specify key manually: @workspace /todo key=your-feature-name
2. Use /route to create new key
3. Check active.keys.log for recent keys
```

DO NOT proceed with auto-generated key.
REQUEST manual user input.
```

**Exit Criteria:**
- Clear error messages when detection fails
- User knows to specify key manually
- Test: Run /todo without recent commits, verify message

---

### Phase 5: Audit State Tracking Adoption

**Goal:** Verify all prompts use state-manager.md correctly

**Tasks:**
1. Grep all prompts for state-tracker.ps1 references → Replace with state-manager.md
2. Verify Step -1 exists in all prompts
3. Test each prompt with state.json creation verification
4. Update loop-prevention.md to track state.json updates
5. Document state tracking workflow in integration-protocol.md

**Verification Commands:**
```powershell
# Check for old PowerShell references
grep -r "state-tracker.ps1" .github/prompts/

# Check for new state-manager.md references  
grep -r "state-manager.md" .github/prompts/

# Verify Step -1 exists
grep -r "Step -1.*State" .github/prompts/*.prompt.md
```

**Exit Criteria:**
- Zero references to state-tracker.ps1
- All prompts reference state-manager.md
- Test: Run /plan, verify state.json created

---

## Test Strategy

### Unit Tests
- State.json creation during plan initialization
- File finalization verification blocks user output
- Efficiency enhancement registry accessible
- Key auto-detection error messages clear
- State tracking works across all prompts

### Integration Tests
- Full workflow: /route → /plan → /task with state.json tracking
- Document-first: Delete files mid-execution, verify HALT
- Auto-chain with efficiency enhancements enabled
- Key detection failure → manual specification

### Validation Tests
- Grep verification (state-tracker.ps1 → state-manager.md)
- File existence checks in all prompts
- Error message clarity (user feedback)

---

## Rollback Plan

**If Phase 1 fails:** Revert to state-tracker.ps1 references (non-functional but documented)
**If Phase 2 fails:** Remove Step 5.5, revert to Step 7.5 only
**If Phase 3 fails:** Delete efficiency-enhancements.md, use scattered references
**If Phase 4 fails:** Revert to original key-generator.md
**If Phase 5 fails:** Keep mixed state (some prompts updated, others not)

**Checkpoints:**
- `ckpt(prompt-efficiency-fix): Phase 1 - State tracking file-based`
- `ckpt(prompt-efficiency-fix): Phase 2 - Document-first enforced`
- `ckpt(prompt-efficiency-fix): Phase 3 - Efficiency registry created`
- `ckpt(prompt-efficiency-fix): Phase 4 - Key detection improved`
- `ckpt(prompt-efficiency-fix): Phase 5 - State tracking audited`

---

## Success Metrics

1. **State Tracking:** ≥5 state.json files created in key data streams
2. **Document-First:** Zero user outputs before file finalization
3. **Efficiency:** All prompts reference enhancement registry
4. **Key Detection:** Clear error messages 100% of time
5. **Adoption:** All 9 prompts use state-manager.md

---

## Dependencies

- `.github/prompts/shared/state-manager.md` (NEW - replaces PowerShell)
- `.github/prompts/shared/efficiency-enhancements.md` (NEW)
- Updated output-validator.md (file existence checks)
- Updated key-generator.md (error messages)
- Updated loop-prevention.md (state tracking)

---

## Notes

- PowerShell state-tracker.ps1 cannot execute in Copilot context
- File-based state-manager.md uses create_file tool instead
- Document-first protocol critical for data integrity
- Efficiency registry enables intelligent optimization
- Clear error messages reduce user confusion
