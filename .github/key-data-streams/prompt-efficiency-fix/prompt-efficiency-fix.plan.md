# Plan: prompt-efficiency-fix (Prompt System Efficiency Gaps)

**Key:** `prompt-efficiency-fix`  
**Created:** 2025-10-29  
**Status:** not-started  
**Type:** System Enhancement  
**Priority:** High - System Foundation

---

## Overview

Address 5 critical gaps in prompt system efficiency identified during system audit: non-functional state tracking, unenforced Document-First protocol, missing efficiency registry, key auto-detection issues, and state tracking adoption verification.

---

## Phase 1: File-Based State Tracking

**Objective:** Replace non-functional PowerShell state tracking with file-based tracking

**Problem:** PowerShell scripts cannot execute in GitHub Copilot environment

**Tasks:**
1. Create `.github/prompts/shared/state-file-tracker.md`
2. Design JSON state file format
3. Define state update protocol (append-only)
4. Implement file-based tracking functions
5. Test with sample key creation

**Deliverables:**
- `state-file-tracker.md` specification
- State file schema documentation
- Migration guide from PowerShell tracker

**Success Criteria:**
- State tracking works in Copilot environment
- All prompts can record state
- Backward compatible with existing keys

---

## Phase 2: Document-First Enforcement

**Objective:** Add blocking validation at Step 5.5 to enforce Document-First protocol

**Problem:** Current validation happens after user output, not before

**Tasks:**
1. Add Step 5.5 to plan.prompt.md (BLOCKING)
2. Verify plan.md, plan.json, work-log.md, state.json exist
3. Check file timestamps (within 60 seconds)
4. HALT execution if files missing
5. Block Step 6 and Step 7.5 if validation fails

**Deliverables:**
- Updated plan.prompt.md with Step 5.5
- File finalization verification algorithm
- Error messages for missing files

**Success Criteria:**
- 100% document-first compliance
- Zero "plan in chat" violations
- User sees error if files missing

---

## Phase 3: Efficiency Enhancements Registry

**Objective:** Create centralized registry of efficiency patterns and anti-patterns

**Tasks:**
1. Create `.github/prompts/shared/efficiency-enhancements.md`
2. Document proven efficiency patterns
3. Document known anti-patterns
4. Add references from individual prompts
5. Create update protocol (cohesion prompt triggers)

**Deliverables:**
- `efficiency-enhancements.md` registry
- Pattern documentation (10+ patterns)
- Anti-pattern catalog (5+ violations)

**Success Criteria:**
- Centralized efficiency knowledge
- All prompts reference registry
- Cohesion prompt auto-updates registry

---

## Phase 4: Key Auto-Detection Error Handling

**Objective:** Improve robustness of key auto-detection with fallback mechanisms

**Problem:** "Adding to previous key data stream" fails if no recent keys

**Tasks:**
1. Add error handling for missing work-log.md
2. Implement fallback to explicit key parameter
3. Add user-friendly error messages
4. Test edge cases (no keys, multiple keys, corrupted files)

**Deliverables:**
- Enhanced key-consultation.md with error handling
- Fallback protocol documentation
- Error message catalog

**Success Criteria:**
- No crashes on missing keys
- Clear error messages
- Graceful fallback to manual key entry

---

## Phase 5: State Tracking Adoption Verification

**Objective:** Verify all prompts adopt new state tracking system

**Tasks:**
1. Audit all 12 prompt files for state tracking calls
2. Verify state.json updates after execution
3. Test state timeline reconstruction
4. Document adoption status per prompt

**Deliverables:**
- State tracking adoption report
- Per-prompt compliance status
- Missing adoption issues documented

**Success Criteria:**
- 100% prompt adoption
- All executions record state
- Timeline reconstruction works

---

## Success Metrics

**Reliability:**
- State tracking: 0% → 100% functional
- Document-First enforcement: 60% → 100% compliance
- Key auto-detection: 80% → 95% success rate

**Quality:**
- Efficiency patterns documented: 0 → 10+
- Anti-patterns cataloged: 0 → 5+
- State tracking adoption: TBD → 100%

**User Experience:**
- Clear error messages for missing files
- Fallback mechanisms prevent crashes
- Centralized efficiency knowledge

---

## Dependencies

**Required:**
- Access to `.github/prompts/`
- File system write permissions
- Git repository access

**Blocked By:**
- None - can start immediately

---

## Risk Mitigation

**Risk:** Breaking existing prompts with new state tracking  
**Mitigation:** Backward compatible design, optional adoption initially

**Risk:** File-based tracking performance issues  
**Mitigation:** Append-only design, minimal file size, async operations

**Risk:** Missing edge cases in error handling  
**Mitigation:** Comprehensive testing with real-world scenarios

---

## Testing Strategy

**Unit Tests:**
- State file creation and updates
- Error handling for missing files
- Fallback mechanism activation

**Integration Tests:**
- End-to-end key creation with state tracking
- Document-First validation blocking
- Efficiency registry updates

**Manual Verification:**
- Test with sample keys
- Verify error messages
- Confirm timeline reconstruction

---

## Next Steps

1. Begin Phase 1: Create state-file-tracker.md
2. Define state file JSON schema
3. Implement tracking functions
4. Test with new key creation
5. Proceed to Phase 2 enforcement
