# Prompts Enhancement Implementation Plan

**Key**: `prompts`  
**Branch**: `development`  
**Created**: 2025-10-20  
**Status**: Ready for Implementation

---

## Overview

This plan enhances the prompts orchestration system with test tracking/reuse, learning integration, recovery protocols, and key management strategies to improve efficiency, reliability, and maintainability.

### Selected Enhancements

- ✅ Enhancement A: Test Similarity Scoring (0.75 threshold)
- ✅ Enhancement C: Auto-Archive on Commit (user-confirmed)
- ❌ Enhancement B: Interactive Recovery UI (deferred - simple "continue" sufficient)
- ❌ Enhancement D: Learning Dashboard (deferred - nice-to-have)
- ❌ Enhancement E: Test Index Search API (deferred - can use grep)

---

## System Context Pack (Full Execution Context)

### APIs
None (documentation-only changes to prompt files)

### Database (KSESSIONS_DEV)
None (no database changes)

### SignalR / Real-time
None

### Configuration & Environment
None

### Test Data
- Existing test-registry.md files in `.github/prompts.keys/*/tests/`
- active.keys.log with key consolidation history
- plan.json files with progress tracking

### Canonical References
- .github/prompts/plan.prompt.md (current orchestration structure)
- .github/prompts/task.prompt.md (execution workflow)
- .github/prompts/test-generation.prompt.md (test registry protocol)
- .github/prompts/analyze-learning.prompt.md (pattern extraction)
- .github/prompts/cohesion-review.prompt.md (system auditing)
- .github/prompts/commit.prompt.md (orchestration workflow)
- .github/prompts.keys/active.keys.log (consolidation patterns)

---

## Architecture Analysis

### Affected Layers

- Prompts Layer (plan, task, test-generation)
- Learning Infrastructure (analyze-learning integration)
- Key Management (active.keys.log, archival strategy)
- Test Infrastructure (global test index, reuse mechanisms)
- Recovery System (state tracking, resume protocol)

### Dependencies

**Files to Modify**:
- .github/prompts/plan.prompt.md
- .github/prompts/task.prompt.md
- .github/prompts/test-generation.prompt.md
- .github/prompts/analyze-learning.prompt.md
- .github/prompts/cohesion-review.prompt.md
- .github/prompts/commit.prompt.md

**Files to Create**:
- .github/tests/test-index.json
- .github/tests/README.md
- .github/prompts.keys/_archived/README.md

**Files to Reference**:
- .github/prompts.keys/prompts/work-log.md
- .github/prompts.keys/active.keys.log

### Infrastructure

- Technology: Markdown prompts, JSON tracking, PowerShell orchestration
- Build: File-based workflow with git integration
- Testing: Manual validation (no automated tests for prompts)
- Version Control: Git (all changes tracked)

### References

- test-registry.md format (test-generation.prompt.md)
- plan.json schema (plan.prompt.md lines 590-700)
- Key consolidation patterns (active.keys.log)
- Step 0.5 auto-detection (task.prompt.md)

---

## Phase 1: Centralized Test Index

### Objectives

1. Create global test index at `.github/tests/test-index.json`
2. Define JSON schema for test tracking
3. Enable cross-key test discovery

### Context

**Files to Analyze**: 
- .github/prompts/test-generation.prompt.md (test-registry.md protocol)
- .github/prompts.keys/*/tests/test-registry.md (existing registries)

**Previous Phase Dependencies**: None (foundation phase)

### Implementation Tasks (TODO Items)

- [ ] **Task 1.1**: Create `.github/tests/test-index.json` schema
  - Expected outcome: JSON schema with test tracking structure
  - Fields: id, key, file, feature, scenarios, reusable, tags, similarity_hash, created, last_used

- [ ] **Task 1.2**: Create `.github/tests/README.md` documentation
  - Expected outcome: Usage guide for test index
  - Document: How to query, update, validate index

- [ ] **Task 1.3**: Update test-generation.prompt.md to populate index
  - Expected outcome: New step after test creation to update global index
  - Location: After test-registry.md update step
  - Action: Append test metadata to test-index.json

### Validation Checklist

- [ ] Build passes (no syntax errors in prompt files)
- [ ] test-index.json validates against schema
- [ ] README.md documentation complete
- [ ] test-generation.prompt.md includes index update step
- [ ] Commit: [SHA]
- [ ] Tag: checkpoint/prompts/2025-10-20_phase1

### Test Specification

**Manual Validation**:
1. Create test-index.json with sample data
2. Verify JSON validates against schema
3. Run test-generation and confirm index updated
4. Query index for reusable tests

**No Playwright Tests** (documentation changes only)

### Commit Format

```
[prompts] Phase 1: Centralized Test Index

Created global test index for cross-key test discovery:
- .github/tests/test-index.json: Schema and initial structure
- .github/tests/README.md: Usage documentation
- test-generation.prompt.md: Index update step added

Schema includes:
- Test metadata (id, key, file, feature, scenarios)
- Reusability tracking (reusable flag, tags)
- Similarity hashing for test matching (0.75 threshold)
- Usage tracking (created, last_used timestamps)

Benefits:
- Cross-key test discovery without scanning 30+ folders
- Foundation for test reuse in planning phase
- Tracks test lifecycle and reusability

Debug: [DEBUG-WORKITEM:prompts:phase1:test-index];CLEANUP_OK
```

### Approval Gate

**User must explicitly approve**: "proceed to phase 2" or "begin phase 2"

---

## Phase 2: Test Reuse in Planning

### Objectives

1. Add test index query to plan.prompt.md Step 0.5
2. Implement test similarity scoring (0.75 threshold)
3. Recommend reusable tests during planning

### Context

**Files to Analyze**:
- .github/prompts/plan.prompt.md (Step 0.5 Technology Stack Discovery)
- .github/tests/test-index.json (created in Phase 1)

**Previous Phase Dependencies**: Phase 1 (test index must exist)

### Implementation Tasks (TODO Items)

- [ ] **Task 2.1**: Add Step 0.5.7 to plan.prompt.md - "Reusable Test Discovery"
  - Expected outcome: New substep queries test index
  - Location: After Step 0.5 Cross-Key Dependency Detection
  - Logic: Query test-index.json for tests matching feature keywords

- [ ] **Task 2.2**: Implement similarity scoring logic
  - Expected outcome: Documentation for calculating similarity (0.75 threshold)
  - Method: Token-based matching on feature/scenario descriptions
  - Threshold: ≥0.75 = recommend for reuse

- [ ] **Task 2.3**: Update plan template to include reusable tests section
  - Expected outcome: "Reusable Tests" section in {key}.plan.md template
  - Content: List of matching tests with similarity scores
  - Guidance: How to adapt tests for new key

### Validation Checklist

- [ ] Build passes (no syntax errors)
- [ ] Step 0.5.7 queries test index successfully
- [ ] Similarity scoring documented and tested
- [ ] Plan template includes reusable tests section
- [ ] Manual test: Query for "registration flow" returns relevant tests
- [ ] Commit: [SHA]
- [ ] Tag: checkpoint/prompts/2025-10-20_phase2

### Test Specification

**Manual Validation**:
1. Run plan agent with feature="user registration"
2. Verify Step 0.5.7 executes
3. Confirm reusable tests recommended (similarity ≥0.75)
4. Check plan.md includes "Reusable Tests" section

**No Playwright Tests** (documentation changes only)

### Commit Format

```
[prompts] Phase 2: Test Reuse in Planning

Added reusable test discovery to planning workflow:
- plan.prompt.md Step 0.5.7: Query test index for matching tests
- Similarity scoring: Token-based matching, 0.75 threshold
- Plan template: "Reusable Tests" section with adaptation guidance

Similarity Algorithm:
- Extract tokens from feature/scenario descriptions
- Calculate Jaccard similarity: |A ∩ B| / |A ∪ B|
- Recommend tests with similarity ≥0.75
- Include original key, file path, scenarios

Benefits:
- Reduces test duplication across keys
- Leverages proven test patterns
- Accelerates planning phase (less test design needed)

Debug: [DEBUG-WORKITEM:prompts:phase2:test-reuse];CLEANUP_OK
```

### Approval Gate

**User must explicitly approve**: "proceed to phase 3" or "begin phase 3"

---

## Phase 3: Learning Integration

### Objectives

1. Add Step 10 to plan.prompt.md for post-completion learning
2. Update plan.json schema to track learning extraction
3. Integrate with analyze-learning agent

### Context

**Files to Analyze**:
- .github/prompts/plan.prompt.md (current Step 9 is final step)
- .github/prompts/analyze-learning.prompt.md (learning extraction agent)
- .github/prompts.keys/*/plan.json (progress tracking)

**Previous Phase Dependencies**: Phase 1-2 (test index for learning patterns)

### Implementation Tasks (TODO Items)

- [ ] **Task 3.1**: Add Step 10 to plan.prompt.md - "Learning Extraction"
  - Expected outcome: New final step after completion handoff
  - Trigger: When user confirms completion or says "mark complete"
  - Action: Invoke @workspace /analyze-learning key={key} scope=key={key}

- [ ] **Task 3.2**: Update plan.json schema
  - Expected outcome: New field "learningExtracted": boolean
  - Location: Root level of schema
  - Default: false, set to true after analyze-learning runs

- [ ] **Task 3.3**: Create handoff template for analyze-learning
  - Expected outcome: Copy-paste ready invocation in Step 10
  - Format: @workspace /analyze-learning key={key} scope=key={key} analysis-type=comprehensive

- [ ] **Task 3.4**: Document skip option
  - Expected outcome: User can skip with skip-learning=true
  - Add to plan.prompt.md parameters section
  - Default: false (automatic extraction)

### Validation Checklist

- [ ] Build passes (no syntax errors)
- [ ] Step 10 added to plan.prompt.md
- [ ] plan.json schema updated with learningExtracted field
- [ ] Handoff template copy-paste ready
- [ ] skip-learning parameter documented
- [ ] Manual test: Complete a key, verify analyze-learning invoked
- [ ] Commit: [SHA]
- [ ] Tag: checkpoint/prompts/2025-10-20_phase3

### Test Specification

**Manual Validation**:
1. Complete a test key
2. Confirm Step 10 triggers
3. Copy analyze-learning command
4. Run analyze-learning
5. Verify learningExtracted=true in plan.json
6. Check .github/learning/ patterns updated

**No Playwright Tests** (documentation changes only)

### Commit Format

```
[prompts] Phase 3: Learning Integration

Added automatic learning extraction to plan completion workflow:
- plan.prompt.md Step 10: Learning Extraction (final step)
- plan.json schema: "learningExtracted" boolean field
- Handoff template: @workspace /analyze-learning invocation
- skip-learning parameter: Optional override (default: automatic)

Workflow:
1. User confirms completion
2. Step 9 outputs task handoff
3. Step 10 outputs analyze-learning handoff
4. User runs both commands
5. analyze-learning extracts patterns to .github/learning/
6. plan.json marks learningExtracted=true

Benefits:
- Ensures learning never forgotten
- Builds knowledge base automatically
- Improves future planning with proven patterns

Debug: [DEBUG-WORKITEM:prompts:phase3:learning];CLEANUP_OK
```

### Approval Gate

**User must explicitly approve**: "proceed to phase 4" or "begin phase 4"

---

## Phase 4: Universal Recovery Protocol

### Objectives

1. Add state tracking to plan.json for interrupted workflows
2. Implement recovery logic in task.prompt.md Step 0.5.5
3. Define simple "continue" command

### Context

**Files to Analyze**:
- .github/prompts/task.prompt.md (Step 0.5 auto-detection)
- .github/prompts.keys/*/plan.json (progress tracking)

**Previous Phase Dependencies**: Phase 3 (plan.json schema updates)

### Implementation Tasks (TODO Items)

- [ ] **Task 4.1**: Update plan.json schema with interruptedAt field
  - Expected outcome: New field "interruptedAt": { phase, step, timestamp, reason }
  - Set when task agent encounters error/exception
  - Clear when phase completes successfully

- [ ] **Task 4.2**: Add Step 0.5.5 to task.prompt.md - "Recovery Detection"
  - Expected outcome: New substep after Step 0.5 key detection
  - Location: Between Step 0.5 and Step 1
  - Logic: Check plan.json for interruptedAt, resume from checkpoint if found

- [ ] **Task 4.3**: Define "continue" command pattern
  - Expected outcome: User can type "continue" to resume
  - Pattern matching: "continue", "resume", "resume {key}"
  - Auto-detect key from plan.json if not specified

- [ ] **Task 4.4**: Document recovery workflow
  - Expected outcome: Clear instructions in task.prompt.md
  - Include: What gets preserved, what gets re-executed
  - Examples: Recovery from build failure, test failure, validation failure

### Validation Checklist

- [ ] Build passes (no syntax errors)
- [ ] plan.json schema updated with interruptedAt
- [ ] Step 0.5.5 added to task.prompt.md
- [ ] "continue" command pattern documented
- [ ] Recovery workflow documented with examples
- [ ] Manual test: Simulate failure, run "continue", confirm resume
- [ ] Commit: [SHA]
- [ ] Tag: checkpoint/prompts/2025-10-20_phase4

### Test Specification

**Manual Validation**:
1. Start task execution
2. Simulate failure (e.g., kill process mid-phase)
3. Verify plan.json has interruptedAt set
4. Run "continue" command
5. Confirm task agent resumes from checkpoint
6. Verify interruptedAt cleared on success

**No Playwright Tests** (documentation changes only)

### Commit Format

```
[prompts] Phase 4: Universal Recovery Protocol

Added automatic recovery for interrupted workflows:
- plan.json schema: "interruptedAt" field (phase, step, timestamp, reason)
- task.prompt.md Step 0.5.5: Recovery Detection
- User command: "continue" or "resume {key}"
- Recovery workflow: Resume from last checkpoint, preserve state

Recovery Logic:
1. Detect interrupted workflow in plan.json
2. Load checkpoint tag (git tag checkpoint/{key}/*)
3. Resume from phase/step in interruptedAt
4. Re-execute remaining tasks
5. Clear interruptedAt on success

Failure Scenarios Handled:
- Build failures (resume after fix)
- Test failures (resume after fix)
- Validation failures (resume after correction)
- Process crashes (resume from checkpoint)

Benefits:
- <1 minute recovery time (simple "continue" command)
- Preserves completed work
- No manual phase tracking needed

Debug: [DEBUG-WORKITEM:prompts:phase4:recovery];CLEANUP_OK
```

### Approval Gate

**User must explicitly approve**: "proceed to phase 5" or "begin phase 5"

---

## Phase 5: Key Management Strategy

### Objectives

1. Define key reuse vs creation rules in plan.prompt.md Step 0.2
2. Prevent key proliferation
3. Establish archival criteria

### Context

**Files to Analyze**:
- .github/prompts/plan.prompt.md (parameter validation)
- .github/prompts.keys/active.keys.log (consolidation history)

**Previous Phase Dependencies**: Phase 4 (recovery relies on stable keys)

### Implementation Tasks (TODO Items)

- [ ] **Task 5.1**: Add Step 0.2 to plan.prompt.md - "Key Reuse Strategy"
  - Expected outcome: Decision tree for reuse vs create
  - Location: After Step 0.1 Branch Validation
  - Rules: Reuse if same domain, create if different domain

- [ ] **Task 5.2**: Define domain matching logic
  - Expected outcome: Documentation for domain classification
  - Examples: "prompts" domain = all prompt work, "canvas" = all canvas work
  - Override: force-new-key=true parameter for major versions

- [ ] **Task 5.3**: Define archival criteria
  - Expected outcome: Clear rules for when to archive
  - Criteria: >100KB work-log.md OR >6 months inactive
  - Action: Move to .github/prompts.keys/_archived/

- [ ] **Task 5.4**: Update active.keys.log format
  - Expected outcome: Track "reuse_count" per key
  - Field: Number of times key reused
  - Purpose: Identify high-churn keys for optimization

### Validation Checklist

- [ ] Build passes (no syntax errors)
- [ ] Step 0.2 added to plan.prompt.md
- [ ] Domain matching logic documented
- [ ] Archival criteria defined
- [ ] active.keys.log format updated
- [ ] Manual test: Plan agent applies decision tree
- [ ] Commit: [SHA]
- [ ] Tag: checkpoint/prompts/2025-10-20_phase5

### Test Specification

**Manual Validation**:
1. Run plan agent with key="prompts"
2. Verify Step 0.2 recommends reuse (same domain)
3. Run plan agent with key="new-feature"
4. Verify Step 0.2 analyzes for domain match
5. Check active.keys.log tracks reuse_count

**No Playwright Tests** (documentation changes only)

### Commit Format

```
[prompts] Phase 5: Key Management Strategy

Added key reuse strategy to prevent proliferation:
- plan.prompt.md Step 0.2: Key Reuse Strategy (decision tree)
- Domain matching: Reuse if same domain, create if different
- Archival criteria: >100KB or >6 months inactive
- active.keys.log: Track reuse_count per key

Decision Tree:
1. Check if key exists in active.keys.log
2. If exists: Check domain match (same topic?)
   - Match: REUSE (append to work-log.md)
   - No match: CREATE NEW
3. If not exists: CREATE NEW
4. Override: force-new-key=true for major versions

Domain Examples:
- "prompts" = all prompt system work
- "canvas" = all SessionCanvas work
- "hcp" = all HostControlPanel work
- "system" = all system-wide improvements

Archival Rules:
- work-log.md >100KB → Archive (bloat prevention)
- No activity >6 months → Archive (stale cleanup)
- Archive location: .github/prompts.keys/_archived/

Benefits:
- Prevents key explosion (30→9 consolidation proven effective)
- Clear rules reduce decision paralysis
- Archival keeps system manageable

Debug: [DEBUG-WORKITEM:prompts:phase5:key-management];CLEANUP_OK
```

### Approval Gate

**User must explicitly approve**: "proceed to phase 6" or "begin phase 6"

---

## Phase 6: Knowledge Extraction Mechanisms

### Objectives

1. Add key-squash mode to analyze-learning.prompt.md
2. Add key-audit scope to cohesion-review.prompt.md
3. Add key-cleanup step to commit.prompt.md

### Context

**Files to Analyze**:
- .github/prompts/analyze-learning.prompt.md (pattern extraction)
- .github/prompts/cohesion-review.prompt.md (system auditing)
- .github/prompts/commit.prompt.md (orchestration workflow)

**Previous Phase Dependencies**: Phase 5 (archival structure)

### Implementation Tasks (TODO Items)

- [ ] **Task 6.1**: Add key-squash mode to analyze-learning.prompt.md
  - Expected outcome: New analysis-type="key-squash"
  - Input: Multiple keys to merge learnings
  - Output: Consolidated patterns in .github/learning/
  - Usage: @workspace /analyze-learning scope="key1,key2,key3" analysis-type=key-squash

- [ ] **Task 6.2**: Add key-audit scope to cohesion-review.prompt.md
  - Expected outcome: New scope="key-audit"
  - Analysis: Identify consolidation opportunities
  - Output: Recommendations for key merging
  - Report: .github/reports/key-audit-YYYYMMDD.md

- [ ] **Task 6.3**: Add key-cleanup step to commit.prompt.md
  - Expected outcome: New optional step before commit
  - Action: Scan for stale keys matching archival criteria
  - User confirmation: List keys to archive, user approves
  - Archive: Move to _archived/ with metadata.json

- [ ] **Task 6.4**: Create _archived/ structure and metadata schema
  - Expected outcome: .github/prompts.keys/_archived/README.md
  - Structure: _archived/{key}/work-log.md, plan.md, tests/, metadata.json
  - metadata.json: { archivedDate, reason, originalSize, testCount, learningsExtracted }

### Validation Checklist

- [ ] Build passes (no syntax errors)
- [ ] key-squash mode added to analyze-learning
- [ ] key-audit scope added to cohesion-review
- [ ] key-cleanup step added to commit
- [ ] _archived/ structure documented
- [ ] metadata.json schema defined
- [ ] Manual test: Squash 2 keys, verify patterns merged
- [ ] Manual test: Audit keys, get consolidation recommendations
- [ ] Manual test: Cleanup stale key, verify archived
- [ ] Commit: [SHA]
- [ ] Tag: checkpoint/prompts/2025-10-20_phase6

### Test Specification

**Manual Validation**:
1. Run analyze-learning with key-squash on 2 completed keys
2. Verify consolidated patterns in .github/learning/
3. Run cohesion-review with key-audit scope
4. Review consolidation recommendations
5. Run commit with key-cleanup
6. Confirm stale keys listed, archive after approval
7. Check _archived/ structure and metadata.json

**No Playwright Tests** (documentation changes only)

### Commit Format

```
[prompts] Phase 6: Knowledge Extraction Mechanisms

Added knowledge management capabilities to agent ecosystem:
- analyze-learning: key-squash mode (merge multiple keys' learnings)
- cohesion-review: key-audit scope (consolidation recommendations)
- commit: key-cleanup step (archive stale keys)
- _archived/ structure: Metadata tracking for archived keys

key-squash Mode:
- Input: comma-separated key list
- Process: Extract patterns from each key, merge unique insights
- Output: Consolidated .github/learning/ patterns
- Usage: @workspace /analyze-learning scope="key1,key2" analysis-type=key-squash

key-audit Scope:
- Scan: All active keys in prompts.keys/
- Analyze: Domain similarity, work-log overlap, test duplication
- Report: Consolidation recommendations with merge strategy
- Output: .github/reports/key-audit-YYYYMMDD.md

key-cleanup Step (commit agent):
- Trigger: Optional step in commit workflow
- Scan: Keys matching archival criteria (>100KB or >6 months)
- Confirm: User approves archive list
- Archive: Move to _archived/ with metadata.json

metadata.json Schema:
- archivedDate: ISO timestamp
- reason: "size" | "stale" | "consolidated"
- originalSize: work-log.md size in KB
- testCount: number of tests created
- learningsExtracted: boolean

Benefits:
- Prevents knowledge loss (squash before archive)
- Identifies consolidation opportunities (prevent duplication)
- Keeps workspace clean (automatic stale detection)

Debug: [DEBUG-WORKITEM:prompts:phase6:knowledge-extraction];CLEANUP_OK
```

### Approval Gate

**User must explicitly approve**: "proceed to phase 7" or "begin phase 7"

---

## Phase 7: Enhanced Test Orchestration Guidance

### Objectives

1. Add "Test Orchestration Best Practices" section to test-generation.prompt.md
2. Document common failure patterns
3. Provide retry strategies and logging approaches

### Context

**Files to Analyze**:
- .github/prompts/test-generation.prompt.md (test generation workflow)
- .github/prompts.keys/hcp/tests/*.spec.ts (reference examples)
- .github/prompts.keys/canvas/scripts/*.ps1 (orchestration examples)

**Previous Phase Dependencies**: Phase 1-6 (test index for failure pattern tracking)

### Implementation Tasks (TODO Items)

- [ ] **Task 7.1**: Add "Test Orchestration Best Practices" section
  - Expected outcome: New section in test-generation.prompt.md
  - Location: After "Test Registry Protocol" section
  - Content: Common patterns from successful tests

- [ ] **Task 7.2**: Document common failure patterns
  - Expected outcome: Subsection with failure taxonomy
  - Categories: Port conflicts, timing issues, flaky selectors, cleanup failures
  - Each pattern: Symptom, cause, solution

- [ ] **Task 7.3**: Provide retry strategies
  - Expected outcome: Subsection with retry patterns
  - Strategies: Exponential backoff, wait-for-condition, health checks
  - Code examples: Playwright retry patterns

- [ ] **Task 7.4**: Document logging best practices
  - Expected outcome: Subsection with logging guidance
  - Topics: What to log, log levels, artifact capture
  - Examples: Screenshot on failure, trace on timeout

- [ ] **Task 7.5**: Reference successful orchestration scripts
  - Expected outcome: Links to proven examples
  - References: hcp, canvas, userlanding keys
  - Annotation: What makes each example effective

### Validation Checklist

- [ ] Build passes (no syntax errors)
- [ ] "Test Orchestration Best Practices" section added
- [ ] Common failure patterns documented (4+ patterns)
- [ ] Retry strategies provided with examples
- [ ] Logging best practices documented
- [ ] Successful scripts referenced with annotations
- [ ] Manual test: Generate new test, confirm includes best practices
- [ ] Commit: [SHA]
- [ ] Tag: checkpoint/prompts/2025-10-20_phase7

### Test Specification

**Manual Validation**:
1. Run test-generation for new feature
2. Verify generated test includes orchestration best practices
3. Check for retry logic in generated script
4. Confirm logging follows documented patterns
5. Review against referenced successful examples

**No Playwright Tests** (documentation changes only)

### Commit Format

```
[prompts] Phase 7: Enhanced Test Orchestration Guidance

Added comprehensive test orchestration best practices to test-generation:
- "Test Orchestration Best Practices" section (new)
- Common failure patterns: Port conflicts, timing, selectors, cleanup
- Retry strategies: Exponential backoff, wait-for-condition, health checks
- Logging guidance: What/when to log, artifact capture
- Reference examples: hcp, canvas, userlanding orchestration scripts

Common Failure Patterns:
1. Port Conflicts
   - Symptom: EADDRINUSE error
   - Cause: Previous app instance not killed
   - Solution: nckill before app start, health check with retry

2. Timing Issues
   - Symptom: Element not found, intermittent failures
   - Cause: Race conditions, slow loading
   - Solution: wait-for-condition, explicit waits, toBeVisible()

3. Flaky Selectors
   - Symptom: Tests fail on selector changes
   - Cause: Brittle CSS/XPath selectors
   - Solution: data-testid attributes, role-based selectors

4. Cleanup Failures
   - Symptom: Tests pass alone, fail in suite
   - Cause: Leftover state, unclosed processes
   - Solution: finally blocks, process.on('exit') handlers

Retry Strategies:
- Health check with retry: Invoke-WebRequest with 60s timeout
- Wait for condition: page.waitForSelector with retry
- Exponential backoff: Start-Sleep with doubling delay

Logging Best Practices:
- Log orchestration steps: "Starting app...", "Running tests..."
- Capture artifacts on failure: screenshots, traces, console logs
- Use color coding: Green=success, Red=failure, Yellow=warning
- Include timestamps for debugging timing issues

Reference Examples (annotated):
- hcp/scripts/run-phase1-test.ps1: Clean process management
- canvas/tests/phase3-question-ownership.spec.ts: Robust selectors
- userlanding/tests/phase1-registration-guard.spec.ts: Retry patterns

Benefits:
- Reduces test flakiness (proven patterns)
- Accelerates debugging (clear logging)
- Improves reliability (retry strategies)
- Captures institutional knowledge (reference examples)

Debug: [DEBUG-WORKITEM:prompts:phase7:orchestration-guidance];CLEANUP_OK
```

### Approval Gate

**User must explicitly approve**: "proceed to phase 8" or "begin phase 8"

---

## Phase 8: Commit Integration & Validation

### Objectives

1. Add test-index validation to commit.prompt.md
2. Ensure recovery state committed
3. Update commit workflow with new validation steps

### Context

**Files to Analyze**:
- .github/prompts/commit.prompt.md (orchestration workflow)
- .github/tests/test-index.json (created in Phase 1)

**Previous Phase Dependencies**: All previous phases (final integration)

### Implementation Tasks (TODO Items)

- [ ] **Task 8.1**: Add test-index validation to commit workflow
  - Expected outcome: New validation step before commit
  - Check: test-index.json validates against schema
  - Check: No orphaned entries (test files exist)
  - Action: Fail commit if validation fails

- [ ] **Task 8.2**: Add recovery state validation
  - Expected outcome: Warn if interruptedAt set in any plan.json
  - Check: Scan all plan.json files for interruptedAt
  - Warn: "Key {key} has unresolved interruption, run 'continue' first"
  - Allow: User can proceed anyway with override

- [ ] **Task 8.3**: Update commit.prompt.md workflow documentation
  - Expected outcome: Updated workflow with new steps
  - Order: cohesion → sync → learning → refactor → test-index → recovery → commit
  - Document: What each validation checks, how to fix failures

- [ ] **Task 8.4**: Add skip-test-validation parameter
  - Expected outcome: User can skip test validation if needed
  - Parameter: skip-test-validation (default: false)
  - Usage: @workspace /commit skip-test-validation=true

### Validation Checklist

- [ ] Build passes (no syntax errors)
- [ ] test-index validation added to commit workflow
- [ ] Recovery state validation added
- [ ] commit.prompt.md workflow updated
- [ ] skip-test-validation parameter added
- [ ] Manual test: Commit with invalid test-index, verify fails
- [ ] Manual test: Commit with interrupted key, verify warns
- [ ] Manual test: Skip validation with parameter
- [ ] Commit: [SHA]
- [ ] Tag: checkpoint/prompts/2025-10-20_phase8

### Test Specification

**Manual Validation**:
1. Modify test-index.json (make invalid)
2. Run commit agent
3. Verify validation fails with clear error
4. Fix test-index.json
5. Set interruptedAt in a plan.json
6. Run commit agent
7. Verify warning about unresolved interruption
8. Run commit with skip-test-validation=true
9. Verify validation skipped

**No Playwright Tests** (documentation changes only)

### Commit Format

```
[prompts] Phase 8: Commit Integration & Validation

Added test index and recovery state validation to commit workflow:
- commit.prompt.md: test-index validation step
- commit.prompt.md: recovery state validation step
- Workflow updated: 7-step validation before commit
- skip-test-validation parameter: Override validation if needed

Validation Steps (in order):
1. cohesion-review (system consistency)
2. sync (documentation/config sync)
3. analyze-learning (knowledge extraction)
4. refactor (code quality)
5. test-index validation (NEW - test metadata consistency)
6. recovery state validation (NEW - warn on interrupted workflows)
7. git commit + push

test-index Validation:
- Check: JSON validates against schema
- Check: Referenced test files exist
- Check: No duplicate test IDs
- Fail: Commit aborted if validation fails
- Fix: Run test-generation to regenerate index

Recovery State Validation:
- Scan: All plan.json files for interruptedAt
- Warn: "Key {key} interrupted at Phase {N}, run 'continue' first"
- Allow: User can override and commit anyway
- Purpose: Prevent committing incomplete work

skip-test-validation Parameter:
- Default: false (validation enabled)
- Usage: @workspace /commit skip-test-validation=true
- Use case: Emergency commits, test-index temporarily invalid

Benefits:
- Ensures test index integrity (no stale metadata)
- Prevents committing interrupted work (data consistency)
- Clear workflow documentation (7-step validation)
- Override available (flexibility for emergencies)

Debug: [DEBUG-WORKITEM:prompts:phase8:commit-integration];CLEANUP_OK
```

### Approval Gate

**User must explicitly approve**: "proceed to final validation" or "mark complete"

---

## Phase 9: Final Validation & Documentation

### Objectives

1. Validate all enhancements integrated correctly
2. Test end-to-end workflows
3. Update documentation

### Context

**Files to Analyze**: All modified prompt files

**Previous Phase Dependencies**: All phases 1-8 complete

### Implementation Tasks (TODO Items)

- [ ] **Task 9.1**: End-to-end workflow validation
  - Expected outcome: Complete workflow test from plan → task → test → commit
  - Test: Create test key, plan, execute, generate tests, commit
  - Verify: All new features work (test reuse, learning, recovery, validation)

- [ ] **Task 9.2**: Update work-log.md with comprehensive summary
  - Expected outcome: Complete entry documenting all 8 phases
  - Include: Files changed, features added, benefits delivered

- [ ] **Task 9.3**: Update prompts.plan.json
  - Expected outcome: Mark all phases complete, set status="complete"
  - Update: metrics (files modified, lines added)

- [ ] **Task 9.4**: Create migration guide for existing keys
  - Expected outcome: .github/prompts.keys/MIGRATION-GUIDE.md
  - Content: How to add test-index entries for existing tests
  - Content: How to update plan.json with new fields

### Validation Checklist

- [ ] Build passes (all prompt files valid)
- [ ] End-to-end workflow test passed
- [ ] work-log.md updated with complete summary
- [ ] prompts.plan.json marked complete
- [ ] MIGRATION-GUIDE.md created
- [ ] All 8 phases validated
- [ ] Ready for Step 10 (Learning Extraction)
- [ ] Commit: [SHA]
- [ ] Tag: checkpoint/prompts/2025-10-20_phase9

### Test Specification

**End-to-End Workflow Test**:
1. Create test key: "test-enhancements"
2. Run: @workspace /plan key=test-enhancements user_request="Add feature X"
   - Verify: Step 0.2 applies key reuse strategy
   - Verify: Step 0.5.7 queries test index for reusable tests
3. Run: @workspace /task key=test-enhancements tasks="Implement feature"
   - Verify: Step 0.5.5 checks for recovery state
4. Simulate failure, run: "continue"
   - Verify: Recovery from checkpoint works
5. Run: @workspace /test-generation feature="X" key=test-enhancements
   - Verify: Test index updated after generation
6. Run: @workspace /commit key=test-enhancements
   - Verify: test-index validation runs
   - Verify: recovery state validation runs
7. Run: @workspace /analyze-learning key=test-enhancements scope=key=test-enhancements
   - Verify: Learning extraction works
   - Verify: plan.json marks learningExtracted=true

**No Playwright Tests** (documentation changes only)

### Commit Format

```
[prompts] Phase 9: Final Validation & Documentation

Completed all 8 enhancement phases with full validation:
- End-to-end workflow tested successfully
- All features integrated and working
- Documentation updated (work-log, plan.json, migration guide)

Files Modified (8 total):
1. .github/prompts/plan.prompt.md
   - Step 0.2: Key Reuse Strategy
   - Step 0.5.7: Reusable Test Discovery
   - Step 10: Learning Extraction

2. .github/prompts/task.prompt.md
   - Step 0.5.5: Recovery Detection

3. .github/prompts/test-generation.prompt.md
   - Test index update step
   - "Test Orchestration Best Practices" section

4. .github/prompts/analyze-learning.prompt.md
   - key-squash mode

5. .github/prompts/cohesion-review.prompt.md
   - key-audit scope

6. .github/prompts/commit.prompt.md
   - test-index validation
   - recovery state validation
   - key-cleanup step

Files Created (4 total):
1. .github/tests/test-index.json (test metadata)
2. .github/tests/README.md (usage guide)
3. .github/prompts.keys/_archived/README.md (archival structure)
4. .github/prompts.keys/MIGRATION-GUIDE.md (existing key migration)

Features Delivered:
✅ Test tracking & reuse (0.75 similarity threshold)
✅ Learning integration (automatic extraction)
✅ Recovery protocol ("continue" command)
✅ Key management (domain-based reuse)
✅ Knowledge extraction (squash, audit, cleanup)
✅ Test orchestration guidance (best practices)
✅ Commit validation (test-index, recovery state)

Success Metrics:
- Test reuse: >30% achievable (index + similarity scoring)
- Recovery: <1 minute ("continue" command)
- Key management: Reuse rules prevent proliferation
- Learning: Automatic extraction ensures no knowledge loss

Ready for Step 10: Learning Extraction

Debug: [DEBUG-WORKITEM:prompts:phase9:final-validation];CLEANUP_OK
```

### Approval Gate

**User must confirm**: "All tests passing, ready for learning extraction (Step 10)"

---

## Progress Tracker

- [ ] **Phase 1**: Centralized Test Index
  - [ ] Implementation complete
  - [ ] Build passes
  - [ ] Validation: test-index.json created and valid
  - [ ] Commit: [SHA]
  - [ ] Tag: checkpoint/prompts/2025-10-20_phase1

- [ ] **Phase 2**: Test Reuse in Planning
  - [ ] Implementation complete
  - [ ] Build passes
  - [ ] Validation: plan agent queries test index
  - [ ] Commit: [SHA]
  - [ ] Tag: checkpoint/prompts/2025-10-20_phase2

- [ ] **Phase 3**: Learning Integration
  - [ ] Implementation complete
  - [ ] Build passes
  - [ ] Validation: Step 10 triggers analyze-learning
  - [ ] Commit: [SHA]
  - [ ] Tag: checkpoint/prompts/2025-10-20_phase3

- [ ] **Phase 4**: Universal Recovery Protocol
  - [ ] Implementation complete
  - [ ] Build passes
  - [ ] Validation: "continue" command resumes from checkpoint
  - [ ] Commit: [SHA]
  - [ ] Tag: checkpoint/prompts/2025-10-20_phase4

- [ ] **Phase 5**: Key Management Strategy
  - [ ] Implementation complete
  - [ ] Build passes
  - [ ] Validation: plan agent applies reuse rules
  - [ ] Commit: [SHA]
  - [ ] Tag: checkpoint/prompts/2025-10-20_phase5

- [ ] **Phase 6**: Knowledge Extraction Mechanisms
  - [ ] Implementation complete
  - [ ] Build passes
  - [ ] Validation: key-squash, key-audit, key-cleanup working
  - [ ] Commit: [SHA]
  - [ ] Tag: checkpoint/prompts/2025-10-20_phase6

- [ ] **Phase 7**: Enhanced Test Orchestration Guidance
  - [ ] Implementation complete
  - [ ] Build passes
  - [ ] Validation: Best practices section added
  - [ ] Commit: [SHA]
  - [ ] Tag: checkpoint/prompts/2025-10-20_phase7

- [ ] **Phase 8**: Commit Integration & Validation
  - [ ] Implementation complete
  - [ ] Build passes
  - [ ] Validation: test-index and recovery validations working
  - [ ] Commit: [SHA]
  - [ ] Tag: checkpoint/prompts/2025-10-20_phase8

- [ ] **Phase 9**: Final Validation & Documentation
  - [ ] Implementation complete
  - [ ] Build passes
  - [ ] End-to-end workflow tested
  - [ ] Commit: [SHA]
  - [ ] Tag: checkpoint/prompts/2025-10-20_phase9

---

## Test Plan

### Manual Validation Tests

**Test 1: Test Index Creation and Query**
- Create test-index.json
- Populate with sample test metadata
- Run plan agent, verify reusable tests discovered

**Test 2: Learning Extraction**
- Complete a test key
- Verify Step 10 triggers
- Run analyze-learning
- Check .github/learning/ patterns updated

**Test 3: Recovery Protocol**
- Start task execution
- Simulate failure (kill process)
- Run "continue" command
- Verify resume from checkpoint

**Test 4: Key Management**
- Run plan with existing key domain
- Verify reuse recommended
- Run plan with new domain
- Verify new key suggested

**Test 5: Knowledge Extraction**
- Run analyze-learning with key-squash on 2 keys
- Run cohesion-review with key-audit
- Run commit with key-cleanup
- Verify all extraction mechanisms work

**Test 6: Test Orchestration**
- Generate test with test-generation
- Verify best practices included
- Check retry logic, logging

**Test 7: Commit Validation**
- Corrupt test-index.json
- Run commit, verify validation fails
- Fix test-index
- Set interruptedAt in plan.json
- Run commit, verify warning

**No Playwright Tests** (documentation-only changes)

---

## Final Validation

### End-to-End Workflow

1. Plan: Create comprehensive plan with test reuse
2. Execute: Implement with recovery capability
3. Test: Generate tests with best practices
4. Learn: Extract patterns automatically
5. Commit: Validate and push changes

### Success Criteria

- ✅ All 9 phases implemented
- ✅ All manual tests passing
- ✅ Documentation complete
- ✅ No syntax errors in prompt files
- ✅ Migration guide for existing keys

---

## References

### Required Reading

- .github/prompts/plan.prompt.md (orchestration structure)
- .github/prompts/task.prompt.md (execution workflow)
- .github/prompts/test-generation.prompt.md (test registry)
- .github/prompts/analyze-learning.prompt.md (pattern extraction)
- .github/prompts/commit.prompt.md (validation workflow)

### Reference Implementations

- test-registry.md format (test-generation.prompt.md)
- plan.json schema (plan.prompt.md lines 590-700)
- active.keys.log consolidation (October 2025 consolidation)

---

## Git Summary Line

```
Enhance prompt orchestration: test tracking/reuse, learning integration, recovery protocol, key management, knowledge extraction
```

---

**END OF PLAN DOCUMENT**
