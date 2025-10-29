# prompt-enhancements.plan.md

**Version:** 1.0.0  
**Created:** 2025-10-29  
**Status:** Planning  
**Purpose:** Enforce "Document First, Respond Later" protocol across all `.github/prompts/` files

---

## Executive Summary

**Problem:** Current prompts document AFTER showing responses to users, violating "Document First, Respond Later" principle.

**Solution:** Reorder steps in 4 prompts (route, plan, task, todo) to enforce file finalization BEFORE user output.

**Complexity:** Simple (documentation order enforcement)  
**Estimated Time:** 30 minutes  
**Priority:** High (improves reliability and auditability)

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

### Phase 1: Add File Finalization Verification Step

**Goal:** Create blocking file verification step BEFORE response validation

**Tasks:**

1. **Create shared algorithm** - `.github/prompts/shared/file-finalization-verifier.md`
   ```markdown
   # File Finalization Verifier
   
   ## Purpose
   Block user output until all key data stream files verified
   
   ## Algorithm
   VerifyFileFinalization(key, requiredFiles):
     FOR EACH file IN requiredFiles:
       IF NOT FileExists(file):
         HALT_EXECUTION()
         LOG_ERROR("File finalization incomplete: {file} missing")
         RETURN FALSE
       END IF
     END FOR
     RETURN TRUE
   
   ## Required Files by Prompt
   - route: None (no file creation)
   - plan: {key}.plan.md, {key}.plan.json, work-log.md, state.json
   - task: work-log.md (updated), state.json (if tracking enabled)
   - todo: work-log.md (appended), state.json (if tracking enabled)
   ```

2. **Update plan.prompt.md** - Enforce Step 5.5 BEFORE Step 7.5
   - Current: Step 5.5 exists but not enforced
   - Change: Add BLOCKING requirement
   - Location: Between Step 5 (Work Log Init) and Step 6 (Handoff Prep)
   - Verification: Check `{key}.plan.md`, `{key}.plan.json`, `work-log.md`, `state.json`
   - Action: HALT if any file missing, log error, DO NOT proceed to Step 7.5

3. **Update task.prompt.md** - Add Step 8.5 file verification
   - Current: Step 8 updates work-log.md, Step 8.5 validates response
   - New: Insert Step 8.25 (File Finalization Verification) BEFORE Step 8.5
   - Location: After Step 8 (Update Key Data Stream)
   - Verification: Check `work-log.md` updated (compare timestamps)
   - Action: HALT if work-log.md not modified in last 60 seconds

4. **Update todo.prompt.md** - Add work-log append verification
   - Current: Execution step → Response validation
   - New: Insert file verification step between execution and validation
   - Verification: Check `work-log.md` appended (file size increased)
   - Action: HALT if work-log.md size unchanged

5. **Update route.prompt.md** - Document no-verification requirement
   - Route prompt creates keys but delegates file creation to plan/task
   - Add note: "File finalization delegated to target agent"
   - No verification needed (route is orchestrator, not executor)

---

### Phase 2: Update CONCISE-MANDATE.md

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

### Phase 3: Add Enforcement Tests

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

### Phase 4: Update Documentation

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
