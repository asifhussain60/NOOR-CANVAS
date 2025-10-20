# Prompts Enhancement Implementation Plan

**Key**: `prompts`  
**Branch**: `development`  
**Created**: 2025-10-20  
**Status**: Ready for Implementation

---

## Overview

This plan implements critical enhancements to the three core orchestration prompts (plan.prompt.md, task.prompt.md, test-generation.prompt.md) based on holistic analysis and user requirements.

### User Requirements Addressed

1. ✅ **Guard rails:** Both task and test-generation prompts stop if {key} folder does not exist in prompts.keys
2. ✅ **Guard rails:** Check if on correct github-branch specified in {key}, stop if mismatch
3. ✅ **Test organization:** Tests created within {key}/tests/ folder with orchestration designed to run individually and collectively
4. ✅ **Responsibility realignment:** Image annotation and requirement gathering moved from task prompt to plan prompt

---

## Phase 1: Add Key Folder Existence Validation

### Objectives

1. Add mandatory key folder validation to task.prompt.md
2. Add mandatory key folder validation to test-generation.prompt.md
3. Ensure clear error messages guide users to run plan first
4. Prevent cryptic file system errors during execution

### Implementation Tasks

- [ ] **Task 1.1:** Add Step 0.25 to task.prompt.md
  - Location: After Step 0.5 (Previous Key Data Stream Continuation Protocol)
  - Content: Key folder existence check with error message
  - Error message includes exact @workspace /plan invocation
  - Expected outcome: Task agent halts with P0 error if key folder missing

- [ ] **Task 1.2:** Add Step 0 to test-generation.prompt.md
  - Location: Before "Mandatory Prerequisites" section
  - Content: Key folder, tests/, and scripts/ directory validation
  - Auto-create tests/ and scripts/ if missing
  - Expected outcome: Test-generation halts if key folder missing, creates subdirectories if needed

- [ ] **Task 1.3:** Test key folder validation
  - Create test key with no folder: `@workspace /task key=nonexistent tasks="test"`
  - Verify error message appears
  - Verify agent halts without attempting file operations
  - Expected outcome: Clear error message, no cryptic failures

### Validation Checklist

- [ ] Task agent detects missing key folder at Step 0.25
- [ ] Test-generation detects missing key folder at Step 0
- [ ] Error messages include exact @workspace /plan command
- [ ] No file system errors occur (halts before attempting writes)
- [ ] Build passes (no syntax errors in prompt files)

### Commit Format

```
[prompts] Phase 1: Add Key Folder Existence Validation

Added mandatory key folder validation to task and test-generation prompts:
- task.prompt.md: New Step 0.25 checks .github/prompts.keys/{key}/ exists
- test-generation.prompt.md: New Step 0 validates key infrastructure
- Both agents halt with clear error if key folder missing
- Error messages guide users to run @workspace /plan first

Files modified:
- .github/prompts/task.prompt.md (added Step 0.25)
- .github/prompts/test-generation.prompt.md (added Step 0)

Testing:
- Verified task agent halts with missing key folder
- Verified test-generation halts with missing key folder
- Confirmed error messages include correct @workspace /plan invocation

Debug: [DEBUG-WORKITEM:prompts:phase1:key-validation];CLEANUP_OK
```

---

## Phase 2: Add Branch Verification

### Objectives

1. Add branch verification to test-generation.prompt.md (currently missing)
2. Enhance branch parameter validation in plan.prompt.md
3. Enforce development-only work per SelfAwareness.instructions.md
4. Prevent accidental test generation on master branch

### Implementation Tasks

- [ ] **Task 2.1:** Add Step 0.1 to test-generation.prompt.md
  - Location: After Step 0 (Key Folder Existence Check)
  - Content: Branch verification using `git branch --show-current`
  - Halt if on master branch with error message
  - Expected outcome: Test-generation only proceeds on development branch

- [ ] **Task 2.2:** Add Step 0.1 to plan.prompt.md
  - Location: After Step 0 (Initial Analysis)
  - Content: github-branch parameter validation
  - Warn if github-branch=master, request user confirmation
  - Expected outcome: Plan agent warns about master branch usage

- [ ] **Task 2.3:** Test branch verification
  - Switch to master: `git checkout master`
  - Attempt test generation: `@workspace /test-generation key=test feature=test`
  - Verify error message and halt
  - Switch back to development: `git checkout development`
  - Expected outcome: Agent halts on master, proceeds on development

### Validation Checklist

- [ ] Test-generation detects master branch at Step 0.1
- [ ] Plan agent warns if github-branch=master at Step 0.1
- [ ] Error messages include git checkout development command
- [ ] Task agent already has branch verification (no changes needed)
- [ ] Build passes (no syntax errors in prompt files)

### Commit Format

```
[prompts] Phase 2: Add Branch Verification

Added branch verification to test-generation prompt and enhanced plan prompt:
- test-generation.prompt.md: New Step 0.1 verifies development branch
- plan.prompt.md: New Step 0.1 validates github-branch parameter
- Both agents enforce development-only work per SelfAwareness.instructions.md
- Test-generation halts if on master branch (prevents production pollution)
- Plan warns if user specifies github-branch=master

Files modified:
- .github/prompts/test-generation.prompt.md (added Step 0.1)
- .github/prompts/plan.prompt.md (added Step 0.1)

Testing:
- Verified test-generation halts on master branch
- Verified plan warns about master branch
- Confirmed git checkout development command in error message

Debug: [DEBUG-WORKITEM:prompts:phase2:branch-verification];CLEANUP_OK
```

---

## Phase 3: Move Image Analysis to Plan Prompt

### Objectives

1. Move image annotation and requirement extraction from task to plan
2. Add vision analysis tool usage to plan prompt
3. Remove image analysis from task prompt (deprecate Step 2.10)
4. Ensure requirements are gathered BEFORE implementation begins

### Implementation Tasks

- [ ] **Task 3.1:** Add Step 0.6 to plan.prompt.md
  - Location: After Step 0.5 (Cross-Key Dependency Detection)
  - Content: Image Analysis & Requirement Extraction
  - Detect images in user request or annotate parameter
  - Use vision analysis to extract requirements from annotated mockups
  - Present extracted requirements for user approval
  - Expected outcome: Requirements extracted and incorporated into plan

- [ ] **Task 3.2:** Add vision tool usage instructions
  - Location: Step 0.6 in plan.prompt.md
  - Content: Instructions for Copilot to analyze images
  - Extract text annotations, colors, layout specs
  - Convert to structured requirements
  - Expected outcome: Clear guidance for vision analysis

- [ ] **Task 3.3:** Update plan deliverables template
  - Location: "Handoff Templates" section in plan.prompt.md
  - Content: Include annotate parameter in handoff commands
  - Reference extracted requirements in plan document
  - Expected outcome: Image analysis results flow to task agent

- [ ] **Task 3.4:** Deprecate Step 2.10 in task.prompt.md
  - Location: Step 2.10 (View Documentation)
  - Content: Mark as DEPRECATED with explanation
  - If user provides images, suggest running plan first
  - Allow proceeding but warn requirements may be incomplete
  - Expected outcome: Task agent no longer does image analysis

### Validation Checklist

- [ ] Plan agent analyzes images at Step 0.6
- [ ] Requirements extracted from annotated mockups
- [ ] User approves extracted requirements during plan approval
- [ ] Task agent Step 2.10 deprecated with clear warning
- [ ] Handoff commands include annotate parameter
- [ ] Build passes (no syntax errors in prompt files)

### Commit Format

```
[prompts] Phase 3: Move Image Analysis to Plan Prompt

Moved image annotation and requirement gathering from task to plan:
- plan.prompt.md: New Step 0.6 for Image Analysis & Requirement Extraction
- plan.prompt.md: Added vision tool usage instructions
- plan.prompt.md: Updated handoff templates to include annotate parameter
- task.prompt.md: Deprecated Step 2.10 (View Documentation)
- task.prompt.md: Added warning if user provides images during execution

Rationale:
- Requirements gathering belongs in planning phase, not execution
- User should approve interpreted requirements before implementation
- Vision analysis informs architecture decisions
- Clear separation of planning vs execution concerns

Files modified:
- .github/prompts/plan.prompt.md (added Step 0.6, updated templates)
- .github/prompts/task.prompt.md (deprecated Step 2.10)

Testing:
- Verified plan extracts requirements from annotated mockup
- Verified task warns if images provided during execution
- Confirmed vision tool instructions work correctly

Debug: [DEBUG-WORKITEM:prompts:phase3:image-analysis];CLEANUP_OK
```

---

## Phase 4: Add Comprehensive Test Suite Generation

### Objectives

1. Generate comprehensive test suite in plan's final phase
2. Create orchestration script for full regression testing
3. Enable collective execution of all phase tests
4. Verify no incremental breakage across phases

### Implementation Tasks

- [ ] **Task 4.1:** Add comprehensive test suite to plan template
  - Location: "Test Plan" section in plan.prompt.md
  - Content: Comprehensive test suite specification
  - TypeScript test that imports all phase tests
  - Verifies all phases complete before running
  - Expected outcome: Plan includes comprehensive suite generation

- [ ] **Task 4.2:** Add orchestration script template
  - Location: "Orchestration Script Specification" in plan.prompt.md
  - Content: PowerShell script for full regression
  - Runs all phase tests individually
  - Runs comprehensive suite if all phases pass
  - Reports aggregated results
  - Expected outcome: Full regression script template in plan

- [ ] **Task 4.3:** Add final validation phase to plan template
  - Location: "Phase Breakdown" section in plan.prompt.md
  - Content: Final phase for comprehensive testing
  - Objectives: Execute all tests, verify no breakage, confirm readiness
  - Validation checklist includes comprehensive suite passing
  - Expected outcome: Every plan includes final validation phase

- [ ] **Task 4.4:** Update plan.json tracking
  - Location: JSON schema in plan.prompt.md
  - Content: Add comprehensiveTestSuite field to testing section
  - Track comprehensive suite status in metrics
  - Expected outcome: JSON tracking includes comprehensive suite

- [ ] **Task 4.5:** Update test-generation for comprehensive suites
  - Location: "Test Generation Rules" in test-generation.prompt.md
  - Content: Support generating comprehensive test suites
  - Import individual phase tests
  - Add end-to-end workflow tests
  - Expected outcome: Test-generation can create comprehensive suites

### Validation Checklist

- [ ] Plan generates comprehensive test suite specification
- [ ] Orchestration script template includes all phase tests
- [ ] Final validation phase added to every plan
- [ ] plan.json tracks comprehensive suite status
- [ ] Test-generation supports comprehensive suite generation
- [ ] Build passes (no syntax errors in prompt files)

### Commit Format

```
[prompts] Phase 4: Add Comprehensive Test Suite Generation

Added comprehensive test suite generation to enable collective test execution:
- plan.prompt.md: Comprehensive test suite template in Test Plan section
- plan.prompt.md: Orchestration script for full regression testing
- plan.prompt.md: Final validation phase with comprehensive testing
- plan.prompt.md: Updated plan.json schema to track comprehensive suite
- test-generation.prompt.md: Support for generating comprehensive test suites

Features:
- Runs all phase tests individually before comprehensive suite
- Verifies no incremental breakage across phases
- Tests complete end-to-end user workflows
- Aggregates test results and reports status
- Halts if any phase test fails

Files modified:
- .github/prompts/plan.prompt.md (added comprehensive suite generation)
- .github/prompts/test-generation.prompt.md (added suite support)

Testing:
- Generated multi-phase plan with comprehensive suite
- Verified orchestration script runs all tests
- Confirmed final validation phase includes suite execution

Debug: [DEBUG-WORKITEM:prompts:phase4:comprehensive-suite];CLEANUP_OK
```

---

## Phase 5: Final Validation & Documentation

### Objectives

1. Update prompts-holistic-analysis.md with implementation status
2. Create test cases for all new guard rails
3. Document verification checklist completion
4. Prepare for production promotion

### Implementation Tasks

- [ ] **Task 5.1:** Test all guard rails
  - Test missing key folder (task and test-generation)
  - Test master branch detection (test-generation)
  - Test image analysis in plan
  - Test comprehensive suite generation
  - Expected outcome: All guard rails working correctly

- [ ] **Task 5.2:** Update holistic analysis document
  - Mark all implemented phases as complete
  - Update verification checklist
  - Document test results
  - Expected outcome: Analysis reflects implementation status

- [ ] **Task 5.3:** Create usage examples
  - Example: Running plan with annotated mockup
  - Example: Task execution with missing key folder (error case)
  - Example: Comprehensive test suite execution
  - Expected outcome: Clear examples for each new feature

- [ ] **Task 5.4:** Review and finalize
  - Verify all user requirements addressed
  - Confirm all commits have proper debug markers
  - Ensure documentation is complete
  - Expected outcome: Ready for production promotion

### Validation Checklist

- [ ] All guard rails tested and working
- [ ] Holistic analysis updated with implementation status
- [ ] Usage examples documented
- [ ] All commits have debug markers
- [ ] All modified prompts have zero syntax errors
- [ ] Build passes with zero warnings

### Commit Format

```
[prompts] Phase 5: Final Validation & Documentation

Completed implementation and validated all enhancements:
- Tested all guard rails (key folder, branch verification)
- Updated prompts-holistic-analysis.md with implementation status
- Created usage examples for new features
- Verified all user requirements addressed

Verification Results:
- Key folder validation: PASS (task and test-generation halt correctly)
- Branch verification: PASS (test-generation enforces development branch)
- Image analysis in plan: PASS (requirements extracted from mockups)
- Comprehensive test suite: PASS (collective execution working)

Files modified:
- .github/prompts.keys/prompts/prompts-holistic-analysis.md (updated status)

Testing:
- All guard rails tested with positive and negative cases
- All new features verified working correctly
- Documentation complete and accurate

Debug: [DEBUG-WORKITEM:prompts:phase5:final-validation];CLEANUP_OK
```

---

## Progress Tracker

- [ ] **Phase 1**: Add Key Folder Existence Validation
  - [ ] Implementation complete
  - [ ] Build passes
  - [ ] Tests passing
  - [ ] Commit: {SHA}
  - [ ] Tag: checkpoint/prompts/{timestamp}
  - [ ] User approved next phase

- [ ] **Phase 2**: Add Branch Verification
  - [ ] Implementation complete
  - [ ] Build passes
  - [ ] Tests passing
  - [ ] Commit: {SHA}
  - [ ] Tag: checkpoint/prompts/{timestamp}
  - [ ] User approved next phase

- [ ] **Phase 3**: Move Image Analysis to Plan Prompt
  - [ ] Implementation complete
  - [ ] Build passes
  - [ ] Tests passing
  - [ ] Commit: {SHA}
  - [ ] Tag: checkpoint/prompts/{timestamp}
  - [ ] User approved next phase

- [ ] **Phase 4**: Add Comprehensive Test Suite Generation
  - [ ] Implementation complete
  - [ ] Build passes
  - [ ] Tests passing
  - [ ] Commit: {SHA}
  - [ ] Tag: checkpoint/prompts/{timestamp}
  - [ ] User approved next phase

- [ ] **Phase 5**: Final Validation & Documentation
  - [ ] Implementation complete
  - [ ] Build passes
  - [ ] All tests passing
  - [ ] Commit: {SHA}
  - [ ] Tag: checkpoint/prompts/{timestamp}
  - [ ] Ready for production promotion

---

## Test Plan

### Test 1: Key Folder Validation (task.prompt.md)

**Scenario:** Task execution with missing key folder

**Steps:**
1. Ensure key folder does not exist: `Remove-Item .github/prompts.keys/nonexistent -Recurse -Force -ErrorAction SilentlyContinue`
2. Run task: `@workspace /task key=nonexistent tasks="test task"`
3. Verify error message appears
4. Verify agent halts without attempting file operations

**Expected Result:**
- Error message includes: "Key folder does not exist"
- Error message includes: `@workspace /plan key=nonexistent user_request=...`
- Agent exits with status code 1
- No file system errors

### Test 2: Key Folder Validation (test-generation.prompt.md)

**Scenario:** Test generation with missing key folder

**Steps:**
1. Ensure key folder does not exist: `Remove-Item .github/prompts.keys/nonexistent -Recurse -Force -ErrorAction SilentlyContinue`
2. Run test-generation: `@workspace /test-generation key=nonexistent feature=test scenario=test`
3. Verify error message appears
4. Verify agent halts without attempting file operations

**Expected Result:**
- Error message includes: "Key folder does not exist"
- Error message includes plan → task → test-generation workflow
- Agent exits with status code 1
- No file system errors

### Test 3: Branch Verification (test-generation.prompt.md)

**Scenario:** Test generation on master branch

**Steps:**
1. Switch to master: `git checkout master`
2. Run test-generation: `@workspace /test-generation key=prompts feature=test scenario=test`
3. Verify error message appears
4. Switch back to development: `git checkout development`

**Expected Result:**
- Error message includes: "Cannot generate tests on master branch"
- Error message includes: `git checkout development`
- Agent exits with status code 1

### Test 4: Image Analysis (plan.prompt.md)

**Scenario:** Plan generation with annotated mockup

**Steps:**
1. Create annotated mockup image (PNG with text annotations)
2. Run plan: `@workspace /plan key=test-image user_request="Implement feature from mockup" annotate="mockup.png"`
3. Verify image analysis runs at Step 0.6
4. Verify requirements extracted from annotations
5. Verify user approval requested for extracted requirements

**Expected Result:**
- Step 0.6 executes image analysis
- Requirements extracted and presented to user
- User can confirm or correct interpretations
- Requirements incorporated into plan document

### Test 5: Comprehensive Test Suite Generation

**Scenario:** Multi-phase plan with comprehensive test suite

**Steps:**
1. Create plan with 3+ phases
2. Verify final phase includes comprehensive testing
3. Verify orchestration script template included
4. Verify plan.json includes comprehensiveTestSuite field

**Expected Result:**
- Final validation phase exists in plan
- Orchestration script runs all phase tests + comprehensive suite
- plan.json tracks comprehensive suite status

---

## Final Validation

### User Requirements Verification

- [x] **Requirement 1:** Both task and test-generation stop if {key} folder does not exist
  - Implementation: Phase 1 (Step 0.25 in task, Step 0 in test-generation)
  - Status: Complete in plan, pending implementation

- [x] **Requirement 2:** Check if on correct github-branch, stop if mismatch
  - Implementation: Phase 2 (Step 0.1 in test-generation, Step 0.1 in plan)
  - Status: Complete in plan, pending implementation

- [x] **Requirement 3:** Tests created within {key}/tests/ folder
  - Status: Already implemented correctly (no changes needed)
  - Validation: Verified in holistic analysis

- [x] **Requirement 4:** Orchestration designed to run individually and collectively
  - Implementation: Phase 4 (comprehensive test suite)
  - Status: Complete in plan, pending implementation

- [x] **Requirement 5:** Image annotations and requirement gathering moved to plan
  - Implementation: Phase 3 (Step 0.6 in plan, deprecate Step 2.10 in task)
  - Status: Complete in plan, pending implementation

### Enhancement Verification

- [x] **Guard rails implemented:** Key folder + branch validation
- [x] **Responsibility aligned:** Image analysis in plan, not task
- [x] **Test organization:** Individual + collective execution supported
- [x] **Error messages:** Clear, actionable guidance for users
- [x] **Documentation:** Complete analysis and implementation plan

---

## References

### Architectural References
- `.github/instructions/SelfAwareness.instructions.md` - Global operating guardrails
- `.github/prompts/shared/test-orchestration-patterns.md` - Canonical orchestration patterns
- `.github/prompts.keys/prompts/prompts-holistic-analysis.md` - Detailed analysis

### Prompt Files Modified
- `.github/prompts/plan.prompt.md`
- `.github/prompts/task.prompt.md`
- `.github/prompts/test-generation.prompt.md`

---

## Git Summary Line

```
Add guard rails and enhance prompts per holistic analysis - key validation, branch verification, image analysis realignment, comprehensive test suites
```

---

**END OF IMPLEMENTATION PLAN**
