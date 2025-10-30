# prompt-enhancements.plan.md

**Version:** 1.0.0  
**Created:** 2025-10-29  
**Status:** Planning  
**Purpose:** Enforce "Document First, Respond Later" protocol across all `.github/prompts/` files

---

## Executive Summary

**Problem:** 
1. Prompts document AFTER showing responses (violates "Document First, Respond Later")
2. Users can't see phase/task breakdown before approving execution
3. **NEW:** Multi-phase plans require manual approval after EACH phase (slows execution)

**Solution:** 
1. Enforce file finalization BEFORE user responses
2. Show detailed task breakdown in 📋 Phases & Tasks section
3. **NEW:** Enable auto-chain mode for E2E phase execution without intervention

**Complexity:** Moderate (6 phases: auto-chain + format fix + file verification + mandate + tests + docs)  
**Estimated Time:** 60 minutes (was 45)  
**Priority:** High (user experience + efficiency improvements)

---

## Current State Analysis

### Existing Behavior (Problematic)

**route.prompt.md:**
- Step 5: Construct prompt parameters
- Step 6: User review (shows response)
- Step 7: Handoff execution
- Step 7.5: Response validation
- **Gap:** No file finalization verification before Step 6

**plan.prompt.md:**
- Step 4: Generate plan → writes to `{key}.plan.md`
- Step 5: Work log initialization → writes to `work-log.md`
- Step 6: Handoff preparation
- Step 7: Index maintenance
- Step 7.5: Response validation (BEFORE user output) ✅
- **Gap:** Step 5.5 exists but needs enforcement BEFORE Step 7.5

**task.prompt.md:**
- Step 8: Update key data stream → writes to `work-log.md`
- Step 8.5: Response validation
- Step 9: Completion workflow (shows response)
- **Gap:** No file verification between Step 8 and Step 8.5

**todo.prompt.md:**
- Execution step: Work completion
- Response validation: Before user output
- **Gap:** No explicit work-log append verification

---

## Root Cause

**All prompts share this pattern:**
1. Execute work
2. Write to files
3. Validate response format
4. Show response to user

**Problem:** Step 3 (validation) doesn't verify Step 2 (files written)

**Risk:** User sees "success" response but files may be incomplete/missing

---

## Implementation Plan

### Phase 0: Enable E2E Phase Execution (Auto-Chain Mode)

**Goal:** Update plan.prompt.md to enable automatic end-to-end phase execution without user intervention

**Root Issue:** Current workflow requires user approval after each phase completes (manual handoff gates)

**Tasks:**

1. **Add auto-chain parameter** - New optional parameter for plan.prompt.md
   - Parameter: `auto-chain` (boolean, default: false)
   - When true: Automatically proceed to next phase after current completes
   - When false: Wait for user approval (current behavior)
   - User sets during plan finalization, not after each phase
   - Action: Enable unattended execution of multi-phase plans

2. **Update Step 6: Handoff Preparation** - Auto-chain handoff logic
   - Current: Always halt and wait for user approval
   - New: If auto-chain=true, invoke task.prompt.md immediately
   - Add to handoff parameters: `auto-chain=true`, `phase=1`
   - task.prompt.md receives auto-chain flag for subsequent phases
   - Action: Eliminate approval gates between phases

3. **Update task.prompt.md integration** - Pass auto-chain to task agent
   - task.prompt.md must accept `auto-chain` parameter
   - When phase completes and auto-chain=true: Return to plan.prompt.md for next phase
   - When manual intervention needed: Break auto-chain, prompt user, resume after
   - Manual intervention triggers: Test failures, build errors, validation errors
   - Action: Task agent knows to continue or halt

4. **Update OUTPUT FORMAT Phase 3** - Show auto-chain option
   - Add Option E: "Execute All Phases (Auto-Chain Mode)"
   - When selected: Set auto-chain=true in handoff parameters
   - Output shows: "Auto-chain enabled - will execute all {N} phases automatically"
   - User can still choose Option A (manual, phase-by-phase)
   - Action: User controls execution mode at plan approval time

5. **Update CONCISE-MANDATE.md** - Document auto-chain default behavior
   - Rule: "Default to E2E execution after plan finalized"
   - Recommendation: Show Option E (**AUTO-EXECUTE ALL PHASES**) as primary choice
   - Option A becomes fallback for step-by-step execution
   - Mandate: Copilot should RECOMMEND auto-chain unless plan is high-risk
   - Action: Shift default mental model to E2E execution

6. **Add manual intervention detection** - Halt auto-chain when user action required
   - Break conditions: Playwright tests (require visual validation), Percy approvals, migration reviews
   - When broken: Show status ("Auto-chain paused - {reason}"), wait for user, offer resume
   - Resume: User replies "Continue" → auto-chain resumes from next phase
   - Action: Smart halting only when truly necessary

---

### Phase 2: Fix Response Format (Phase/Task Breakdown)

**Goal:** Ensure users see detailed phase and task breakdown BEFORE choosing to execute

**Root Issue:** Current output shows options (A/B/C/D) without showing what tasks are in each phase

**Tasks:**

1. **Update plan.prompt.md Output Format** - Add 📋 Phases & Tasks section
   - Location: Between 📌 Plan Overview and ⚡ Options
   - Format: Bold phase headers + flat task list (no nesting)
   - Example:
     ```markdown
     **📋 Phases & Tasks**
     
     **Phase 1: {Title}**
     - Task 1.1: {action} - {expected-outcome}
     - Task 1.2: {action} - {expected-outcome}
     
     **Phase 2: {Title}**
     - Task 2.1: {action} - {expected-outcome}
     ```
   - Bullet allocation: Max 10 bullets for task lists
   - Action: User sees task details before choosing Option A

2. **Update 📌 Plan Overview** - Show task counts per phase
   - Current: `**Phase 1:** {title} - {file-count} files affected`
   - New: `**Phase 1:** {title} ({task-count} tasks, {file-count} files)`
   - Benefit: Quick scope overview without full task list
   - Action: User can evaluate complexity at a glance

3. **Reduce 🧠 Analysis Section** - Free up bullets for task lists
   - Current: ≤8 bullets
   - New: ≤5 bullets
   - Savings: 3 bullets → Allocate to 📋 Phases & Tasks
   - Action: Stay within 25 bullet limit (CONCISE-MANDATE)

4. **Update CONCISE-MANDATE.md** - Add phase header exception
   - Add note: "Phase headers use **bold** (not bullets, don't count toward limit)"
   - Clarify: Task lists must be flat (no nested bullets)
   - Example section showing 📋 Phases & Tasks format
   - Action: Validation allows phase headers without counting as bullets

5. **Update output-validator.md** - Enforce phase breakdown requirement
   - Add validation rule: If response contains "Phase" references, MUST include 📋 Phases & Tasks section
   - Severity: CRITICAL (blocks response)
   - Remediation: "Add 📋 Phases & Tasks section showing individual tasks"
   - Action: HALT if phase plan shown without task breakdown

---

### Phase 3: File Finalization Verification

**Goal:** Create blocking file verification step BEFORE response validation (Document First, Respond Later)

**Tasks:**

1. **Create shared algorithm** - `.github/prompts/shared/file-finalization-verifier.md`
   - Purpose: Block user output until all key data stream files verified
   - Algorithm: Check file existence, HALT if missing
   - Required files by prompt: plan (4 files), task (1 file), todo (1 file)
   - Action: Shared reference for all prompts

2. **Update plan.prompt.md Step 5.5** - Enforce BLOCKING file verification
   - Current: Step 5.5 exists but not enforced
   - Change: Add HALT requirement if files missing
   - Verification: Check `{key}.plan.md`, `{key}.plan.json`, `work-log.md`, `state.json`
   - Action: DO NOT proceed to Step 7.5 (Response Validation) if files missing

3. **Update task.prompt.md Step 8.25** - Add file verification before response
   - Current: Step 8 updates work-log.md, Step 8.5 validates response
   - New: Insert Step 8.25 (File Finalization Verification) BEFORE Step 8.5
   - Verification: Check `work-log.md` updated (compare timestamps within 60s)
   - Action: HALT if work-log.md not modified

4. **Update todo.prompt.md** - Add work-log append verification
   - Current: Execution → Response validation
   - New: Insert file verification step between execution and validation
   - Verification: Check `work-log.md` appended (file size increased)
   - Action: HALT if work-log.md size unchanged

5. **Update route.prompt.md** - Document delegation pattern
   - Route prompt creates keys but delegates file creation
   - Add note: "File finalization delegated to target agent"
   - No verification needed (orchestrator, not executor)
   - Action: Clear documentation of no-verification requirement

---

### Phase 3: Update CONCISE-MANDATE.md

**Goal:** Document file finalization as mandatory rule

**Tasks:**

1. **Add new rule** - "File Finalization Before Response"
   - Location: After existing 10 rules
   - Rule 11: "VERIFY FILE FINALIZATION - All key data stream files must exist before user output"
   - Severity: CRITICAL (blocks response)
   - Enforcement: Via Step X.5 in each prompt

2. **Update validation checklist** - Include file verification
   - Add to output-validator.md: File finalization check
   - Integration: Called from response validation step
   - Sequence: File finalization → Response format validation → User output

---

### Phase 4: Add Enforcement Tests

**Goal:** Validate prompts enforce file finalization

**Tasks:**

1. **Create test scenarios** - `.github/prompts/shared/prompt-test-validation-framework.md`
   - Test: plan.prompt.md with missing `{key}.plan.md`
   - Expected: HALT with error, no user output
   - Test: task.prompt.md with stale `work-log.md`
   - Expected: HALT with error, request file update
   - Test: todo.prompt.md with unchanged `work-log.md`
   - Expected: HALT with error, verify append operation

2. **Document in prompts** - Add `-test` flag examples
   - Example: `@workspace /plan key=test -test user_request="Test file finalization"`
   - Expected output: Validation report showing file checks

---

### Phase 5: Update Documentation

**Goal:** Reflect new protocol in all prompt documentation

**Tasks:**

1. **Update version history** - All 4 prompts
   - Version: Increment minor version (e.g., 1.6.0 → 1.7.0)
   - Changelog: "Enforced file finalization before user output"

2. **Update execution flow diagrams** - shared/execution-flow.md
   - Add file finalization step to visual flow
   - Show blocking relationship to response validation

3. **Update SelfAwareness.instructions.md** - Document protocol
   - Section: "Document First, Respond Later Protocol"
   - Rules: File finalization mandatory before user output
   - Enforcement: Via Step X.5 in prompts

---

## Test Strategy

### Manual Testing
1. **Test plan.prompt.md:** Delete `{key}.plan.md` → verify HALT before user output
2. **Test task.prompt.md:** Delete `work-log.md` → verify HALT before completion
3. **Test todo.prompt.md:** Mock unchanged file → verify append detection

### Automated Testing
- Use `-test` flag with prompts
- Validation framework checks file finalization
- Report violations in quality score

---

## Rollback Plan

**If issues detected:**
1. Revert commits using `git revert {sha}`
2. Restore original step order
3. Document regression for investigation

**Checkpoint commits:**
- After Phase 1: `ckpt(prompt-enhancements): Phase 1 - file verification algorithm`
- After Phase 2: `ckpt(prompt-enhancements): Phase 2 - CONCISE-MANDATE update`
- After Phase 3: `ckpt(prompt-enhancements): Phase 3 - enforcement tests`
- After Phase 4: `ckpt(prompt-enhancements): Phase 4 - documentation update`

---

## Success Criteria

✅ **File finalization verified before user output** (all 4 prompts)  
✅ **HALT execution if files missing** (with clear error messages)  
✅ **Documentation updated** (version history, execution flows, SelfAwareness.instructions.md)  
✅ **Tests pass** (manual validation scenarios)  
✅ **No regressions** (existing functionality preserved)

---

## Dependencies

- `.github/prompts/shared/output-validator.md` - Response validation (existing)
- `.github/prompts/shared/state-tracker.ps1` - State tracking (existing)
- `.github/prompts/shared/CONCISE-MANDATE.md` - Output rules (to be updated)

---

## Next Steps

1. Create `file-finalization-verifier.md` shared algorithm
2. Update plan.prompt.md Step 5.5 (enforce blocking)
3. Update task.prompt.md (add Step 8.25)
4. Update todo.prompt.md (add file verification)
5. Update CONCISE-MANDATE.md (add Rule 11)
6. Test all prompts with missing files
7. Commit with checkpoint tags

---

**Estimated Timeline:**
- Phase 1: 10 minutes (file verification algorithm + 4 prompt updates)
- Phase 2: 5 minutes (CONCISE-MANDATE update)
- Phase 3: 10 minutes (test scenarios)
- Phase 4: 5 minutes (documentation updates)
- **Total: 30 minutes**
