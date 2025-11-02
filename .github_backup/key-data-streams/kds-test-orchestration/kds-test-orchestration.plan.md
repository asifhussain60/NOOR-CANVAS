# KDS Test Orchestration Consolidation Plan

**Key:** `kds-test-orchestration`  
**Status:** Planning  
**Created:** 2025-11-02  
**Owner:** GitHub Copilot  
**Priority:** P0 (High - Governance/Architecture)

---

## Executive Summary

**Goal:** Consolidate all Playwright test orchestration rules, logic, and code snippets into a single canonical source in kds-rulebook.md (Rule #3). Remove duplication and conflicts from prompts and instructions while ensuring all agents reference the canonical source.

**Complexity:** High (affects 20+ files, requires careful extraction and reference updates)

**Estimated Duration:** 4-6 hours (7 phases)

**Total Phases:** 7

**Dependencies:** 
- kds-rulebook.md (Rule #3 exists, needs enhancement)
- .github/instructions/rules/playwright-orchestration/rule.md (canonical implementation)
- All prompts and instructions referencing orchestration

**Impact:**
- ✅ Single source of truth for orchestration rules
- ✅ Eliminates conflicting implementations (webServer vs orchestration scripts)
- ✅ Reduces maintenance burden (update once vs 20+ locations)
- ✅ Improves discoverability (one place to find orchestration guidance)

---

## KDS Rules Summary (Ordered by Functionality Relevance)

### Core Workflow Rules (Highest Priority)
1. **Rule #2: Document First** - Update KDS files BEFORE code changes
2. **Rule #5: TDD on Every Todo** - Tests created FIRST (red-green-refactor)
3. **Rule #4: Per-Task Handoffs** - Dedicated JSON per task with all parameters
4. **Rule #12: Honest Handoff Protocol** - Agents cannot execute other agents (JSON + Next Command + HALT)

### Output & Quality Rules
5. **Rule #1: Concise Output Format** - No code in chat, 3-line bullets max, letter options in ALL CAPS
6. **Rule #11: Key Display** - Active key visible in all headers, phase output, commands
7. **Rule #16: Test Quality Gate** - Tests scored 0-100 with approval gate
8. **Rule #17: Screenshot Tests** - Vision analysis workflow enforced

### Test Execution Rules (CRITICAL FOR THIS KEY)
9. **Rule #3: Playwright Orchestration** - Dotnet orchestration scripts ONLY (no webServer, no standalone mode)
10. **Rule #20: KDTR Enforcement** - Query before generation, publish after successful execution
11. **Rule #7: Central Test Index** - Prefer reuse before creating new tests

### Governance Rules
12. **Rule #10: KDS Governance** - All .github changes via kds.prompt.md gatekeeper
13. **Rule #18: Router Exemption** - Routers exempt from Step -1 enforcement
14. **Rule #19: Dual Rulebook Sync** - JSON + MD must be updated atomically

### Workflow Optimization Rules
15. **Rule #6: Auto-Chain Defaults** - Tasks chain by default, phases need approval (unless E2E)
16. **Rule #8: Holistic Regeneration** - Delete & recreate files (no partial edits)
17. **Rule #9: Plan Conflict Detection** - Load existing plan, analyze conflicts before routing
18. **Rule #13: Phase Boundary Chat Isolation** - New chat window per phase (when autoChain=false)

### Documentation & Metadata Rules
19. **Rule #2b: Test Reverse-Engineering Metadata** - UI/API files include PLAYWRIGHT TEST METADATA
20. **Rule #14: Build Validation** - Zero errors after task/phase completion
21. **Rule #15: Git History Validation** - Analyze commits for rule violations

---

## Current State Analysis

### Canonical Source (Established)
- **Location:** `.github/instructions/rules/playwright-orchestration/rule.md`
- **Status:** ✅ Complete, well-documented with examples
- **Contains:** 
  - Rule statement
  - Protocol (5 steps)
  - Validation algorithm
  - Enforcement action
  - Template script
  - Prohibited patterns

### Duplication Locations (To Be Cleaned)

#### Prompts (7 files with orchestration logic)
1. `plan.prompt.md` - Lines 200-250 (orchestration requirements in test strategy)
2. `task.prompt.md` - Lines 373, 503, 507 (orchestration script references)
3. `todo.prompt.md` - Lines 172-197 (full orchestration requirements section)
4. `test-generation.prompt.md` - Lines 3, 8, 19, 22, 60, 98, 119, 198, 343 (scattered refs)
5. `route.prompt.md` - Lines 477, 483, 484 (orchestration context routing)
6. `ui-map.prompt.md` - Line 4 (MANDATORY.md reference only)
7. `test-prep.prompt.md` - Lines 3, 190, 223, 280 (test execution commands)

#### Instructions (3 files with orchestration logic)
1. `SelfAwareness.instructions.md` - Lines 13, 560-612, 729, 752, 809, 819, 822 (full section + scattered refs)
2. `Links/PlaywrightTestOrchestration.md` - (NOT FOUND - may have been moved/renamed)
3. `MANDATORY.md` - Rule 3 reference (KEEP - index file)

#### Supporting Files (Keep with references)
1. `.github/tests/README.md` - Lines 17, 52, 80, 99, 165, 219 (orchestration script discovery)
2. `.github/tests/AUTO-UPDATE.md` - Lines 6, 15, 29, 33-106, 126, 139, 161, 170 (template integration)
3. `.github/SYSTEM-REGISTRY.md` - Lines 86, 108 (index entries - KEEP)

### Conflicts Identified

#### Conflict 1: webServer vs Orchestration Scripts
**Location:** `SelfAwareness.instructions.md` lines 809, 822  
**Conflict:**
```markdown
- **For Playwright Tests**: Use webServer configuration (`PW_MODE=standalone`)
```
**vs canonical rule:**
```markdown
- **NEVER** use `PW_MODE=standalone` or `webServer` config (DEPRECATED approach)
```
**Resolution:** Remove webServer references, enforce orchestration scripts only

#### Conflict 2: Multiple Validation Approaches
**Locations:** 
- `todo.prompt.md` lines 187-197 (inline validation)
- `instructions/rules/playwright-orchestration/rule.md` (ValidatePlaywrightOrchestration algorithm)

**Resolution:** Remove inline validation, reference canonical ValidatePlaywrightOrchestration()

#### Conflict 3: Template Locations
**Locations:**
- `shared/test-orchestration-patterns.md` (referenced in prompts)
- `templates/test-orchestration-template.ps1` (referenced in AUTO-UPDATE.md)
- Inline template in `instructions/rules/playwright-orchestration/rule.md`

**Resolution:** Consolidate to single canonical template, all others reference it

---

## Implementation Plan

### Phase 1: KDS Rulebook Enhancement
**Goal:** Integrate Rule #3 (Playwright Orchestration) into kds-rulebook.md with complete details

**Dependencies:** None

**Estimated Duration:** 45 minutes

**Acceptance Criteria:**
- kds-rulebook.md Rule #3 contains complete orchestration protocol
- kds-rulebook.json includes Rule #3 with validation function reference
- Both files synced atomically (Rule #19)
- Version bumped to 2.2.0
- Changelog updated with orchestration integration

**Tasks:**

1. **Task 1a: Create Comprehensive Test** (test-generation.prompt.md)
   - Test File: `.github/key-data-streams/kds-test-orchestration/tests/phase-1-rulebook-sync.spec.md`
   - Coverage: Validate kds-rulebook.md and .json both include Rule #3, versions match
   - Success Criteria: Both files contain identical Rule #3 content
   - Estimated Duration: 15 minutes
   - Handoff File: `handoffs/phase-1-test.json`

2. **Task 1b: Enhance kds-rulebook.md with Rule #3 Details**
   - Action: Add complete Rule #3 section after Rule #2b
   - Files: `.github/governance/kds-rulebook.md`
   - Content: Copy from `instructions/rules/playwright-orchestration/rule.md`
   - Include: Protocol (5 steps), validation algorithm, prohibited patterns, template reference
   - Debug Marker: `[DEBUG-WORKITEM:kds-test-orchestration:phase-1-task-1]`
   - Success Criteria: Rule #3 complete with all subsections
   - Estimated Duration: 20 minutes
   - Handoff File: `handoffs/phase-1-todo-1.json`
   - On Completion: Auto-invoke Task 1c

3. **Task 1c: Sync kds-rulebook.json**
   - Action: Add Rule #3 object to rules array
   - Files: `.github/governance/kds-rulebook.json`
   - Fields: id, number, title, statement, validation, enforcement, relatedRules
   - Debug Marker: `[DEBUG-WORKITEM:kds-test-orchestration:phase-1-task-2]`
   - Success Criteria: JSON Rule #3 matches MD content, version bumped to 2.2.0
   - Estimated Duration: 15 minutes
   - Handoff File: `handoffs/phase-1-todo-2.json`
   - On Completion: Auto-invoke Task 1d

4. **Task 1d: Run & Fix Test**
   - Action: Execute phase-1-rulebook-sync.spec.md
   - Test Command: Manual validation (MD-only test)
   - Success Criteria: Both rulebooks contain Rule #3, versions match
   - Estimated Duration: 10 minutes
   - On Success: Auto-invoke Task 1e
   - On Failure: Debug and fix until passing

5. **Task 1e: Phase Validation & Checkpoint**
   - Update work-log.md with phase completion
   - Update kds-test-orchestration.plan.json phase status to "complete"
   - Commit checkpoint: `ckpt(kds-test-orchestration): Phase 1 complete - Rule #3 integrated`
   - **AUTO-CONTINUE:** Proceed to Phase 2

**Auto-Continue Conditions:**
- ✅ All tasks complete
- ✅ All tests passing (manual validation)
- ✅ Build succeeds (no build required for MD/JSON)
- ✅ Documentation updated (kds-rulebook.md + .json)
- ❌ HALT if: Test fails, version mismatch, JSON schema error

**Rollback Plan:**
- Checkpoint: `ckpt(kds-test-orchestration): Before Phase 1`
- Rollback: `git reset --hard {checkpoint-sha}`

---

### Phase 2: Remove Orchestration Logic from Prompts
**Goal:** Remove all orchestration implementation details from prompt files, replace with references

**Dependencies:** Phase 1 must be complete (kds-rulebook.md Rule #3 established)

**Estimated Duration:** 60 minutes

**Acceptance Criteria:**
- All prompts contain ONLY references to canonical source
- No inline orchestration validation logic
- No code snippets or templates in prompts
- All 7 prompt files updated atomically

**Tasks:**

1. **Task 2a: Create Validation Test**
   - Test File: `.github/key-data-streams/kds-test-orchestration/tests/phase-2-prompt-cleanup.spec.md`
   - Coverage: Scan all prompts for orchestration code blocks, inline validation
   - Success Criteria: Zero orchestration code blocks found in prompts
   - Estimated Duration: 15 minutes
   - Handoff File: `handoffs/phase-2-test.json`

2. **Task 2b: Clean plan.prompt.md**
   - Action: Replace orchestration section with canonical reference
   - Files: `.github/prompts/plan.prompt.md`
   - Pattern: Replace lines 200-250 with "See: kds-rulebook.md Rule #3"
   - Debug Marker: `[DEBUG-WORKITEM:kds-test-orchestration:phase-2-task-1]`
   - Success Criteria: No orchestration implementation, only reference
   - Estimated Duration: 10 minutes
   - Handoff File: `handoffs/phase-2-todo-1.json`

3. **Task 2c: Clean task.prompt.md**
   - Action: Update orchestration script references
   - Files: `.github/prompts/task.prompt.md`
   - Pattern: Lines 373, 503, 507 → Replace with kds-rulebook.md Rule #3 reference
   - Debug Marker: `[DEBUG-WORKITEM:kds-test-orchestration:phase-2-task-2]`
   - Estimated Duration: 5 minutes
   - Handoff File: `handoffs/phase-2-todo-2.json`

4. **Task 2d: Clean todo.prompt.md**
   - Action: Remove full orchestration requirements section
   - Files: `.github/prompts/todo.prompt.md`
   - Pattern: Lines 172-197 → Delete, replace with "See: kds-rulebook.md Rule #3"
   - Debug Marker: `[DEBUG-WORKITEM:kds-test-orchestration:phase-2-task-3]`
   - Estimated Duration: 10 minutes
   - Handoff File: `handoffs/phase-2-todo-3.json`

5. **Task 2e: Clean test-generation.prompt.md**
   - Action: Remove scattered orchestration references
   - Files: `.github/prompts/test-generation.prompt.md`
   - Pattern: Lines 3, 8, 19, 22, 60, 98, 119, 198, 343 → Consolidate to single reference
   - Debug Marker: `[DEBUG-WORKITEM:kds-test-orchestration:phase-2-task-4]`
   - Estimated Duration: 15 minutes
   - Handoff File: `handoffs/phase-2-todo-4.json`

6. **Task 2f: Clean route.prompt.md**
   - Action: Update orchestration context routing
   - Files: `.github/prompts/route.prompt.md`
   - Pattern: Lines 477, 483, 484 → Replace with kds-rulebook.md Rule #3 reference
   - Debug Marker: `[DEBUG-WORKITEM:kds-test-orchestration:phase-2-task-5]`
   - Estimated Duration: 5 minutes
   - Handoff File: `handoffs/phase-2-todo-5.json`

7. **Task 2g: Clean test-prep.prompt.md**
   - Action: Remove direct npx playwright test commands
   - Files: `.github/prompts/test-prep.prompt.md`
   - Pattern: Lines 190, 223, 280 → Replace with orchestration script invocation
   - Debug Marker: `[DEBUG-WORKITEM:kds-test-orchestration:phase-2-task-6]`
   - Estimated Duration: 10 minutes
   - Handoff File: `handoffs/phase-2-todo-6.json`

8. **Task 2h: Run & Fix Test**
   - Action: Execute phase-2-prompt-cleanup validation
   - Success Criteria: All prompts pass cleanup test
   - Estimated Duration: 10 minutes

9. **Task 2i: Phase Validation & Checkpoint**
   - Commit checkpoint: `ckpt(kds-test-orchestration): Phase 2 complete - Prompts cleaned`
   - **AUTO-CONTINUE:** Proceed to Phase 3

**Auto-Continue Conditions:**
- ✅ All 7 prompts updated
- ✅ Validation test passes
- ❌ HALT if: Orchestration code blocks remain

**Rollback Plan:**
- Checkpoint: `ckpt(kds-test-orchestration): Before Phase 2`
- Rollback: `git reset --hard {checkpoint-sha}`

---

### Phase 3: Remove Orchestration Logic from Instructions
**Goal:** Clean instructions files (except canonical rule file)

**Dependencies:** Phase 2 complete

**Estimated Duration:** 45 minutes

**Acceptance Criteria:**
- SelfAwareness.instructions.md contains only reference to Rule #3
- No webServer conflicts remain
- Canonical rule file untouched

**Tasks:**

1. **Task 3a: Create Validation Test**
   - Test File: `.github/key-data-streams/kds-test-orchestration/tests/phase-3-instructions-cleanup.spec.md`
   - Coverage: Scan instructions for webServer references, conflicts
   - Estimated Duration: 15 minutes

2. **Task 3b: Clean SelfAwareness.instructions.md**
   - Action: Remove full orchestration section (lines 560-612)
   - Files: `.github/instructions/SelfAwareness.instructions.md`
   - Pattern: Replace with "See: kds-rulebook.md Rule #3"
   - Remove: Lines 729 (webServer conflicts), 809, 822 (conflicting guidance)
   - Debug Marker: `[DEBUG-WORKITEM:kds-test-orchestration:phase-3-task-1]`
   - Estimated Duration: 20 minutes

3. **Task 3c: Verify Canonical Rule Untouched**
   - Action: Ensure `.github/instructions/rules/playwright-orchestration/rule.md` unchanged
   - Estimated Duration: 5 minutes

4. **Task 3d: Run & Fix Test**
   - Action: Execute phase-3-instructions-cleanup validation
   - Estimated Duration: 10 minutes

5. **Task 3e: Phase Validation & Checkpoint**
   - Commit checkpoint: `ckpt(kds-test-orchestration): Phase 3 complete - Instructions cleaned`
   - **AUTO-CONTINUE:** Proceed to Phase 4

**Rollback Plan:**
- Checkpoint: `ckpt(kds-test-orchestration): Before Phase 3`

---

### Phase 4: Holistic Cleanup Verification
**Goal:** Scan entire .github directory for orphaned orchestration references

**Dependencies:** Phase 3 complete

**Estimated Duration:** 30 minutes

**Acceptance Criteria:**
- Zero orchestration code blocks outside canonical sources
- All references point to kds-rulebook.md Rule #3 or instructions/rules/playwright-orchestration/rule.md
- Supporting files (README.md, AUTO-UPDATE.md) use references only

**Tasks:**

1. **Task 4a: Create Comprehensive Scan Test**
   - Test File: `.github/key-data-streams/kds-test-orchestration/tests/phase-4-holistic-scan.spec.md`
   - Coverage: Grep entire .github directory for prohibited patterns
   - Patterns: `webServer`, `PW_MODE=standalone`, inline orchestration scripts
   - Estimated Duration: 15 minutes

2. **Task 4b: Execute Holistic Scan**
   - Action: Run comprehensive grep search
   - Report: List all remaining orchestration references with locations
   - Estimated Duration: 5 minutes

3. **Task 4c: Clean Orphaned References**
   - Action: Update remaining files with canonical references
   - Files: Identified in Task 4b scan
   - Estimated Duration: 15 minutes

4. **Task 4d: Run & Fix Test**
   - Action: Verify zero orphaned references
   - Estimated Duration: 5 minutes

5. **Task 4e: Phase Validation & Checkpoint**
   - Commit checkpoint: `ckpt(kds-test-orchestration): Phase 4 complete - Holistic cleanup verified`
   - **AUTO-CONTINUE:** Proceed to Phase 5

**Rollback Plan:**
- Checkpoint: `ckpt(kds-test-orchestration): Before Phase 4`

---

### Phase 5: Update KDS Rulebook Integration
**Goal:** Ensure plan.prompt.md and test-generation agents reference Rule #3

**Dependencies:** Phase 4 complete

**Estimated Duration:** 30 minutes

**Acceptance Criteria:**
- plan.prompt.md test strategy references Rule #3
- test-generation.prompt.md loads Rule #3 before generating tests
- All agents use canonical validation function

**Tasks:**

1. **Task 5a: Create Integration Test**
   - Test File: `.github/key-data-streams/kds-test-orchestration/tests/phase-5-kds-integration.spec.md`
   - Coverage: Verify plan/test-generation reference Rule #3
   - Estimated Duration: 15 minutes

2. **Task 5b: Update plan.prompt.md Test Strategy**
   - Action: Add Rule #3 reference to test strategy section
   - Files: `.github/prompts/plan.prompt.md`
   - Pattern: "Test Orchestration: See kds-rulebook.md Rule #3"
   - Estimated Duration: 10 minutes

3. **Task 5c: Update test-generation.prompt.md Workflow**
   - Action: Add Rule #3 loading to Step 1
   - Files: `.github/prompts/test-generation.prompt.md`
   - Pattern: "Load kds-rulebook.md Rule #3 before generating tests"
   - Estimated Duration: 10 minutes

4. **Task 5d: Run & Fix Test**
   - Estimated Duration: 5 minutes

5. **Task 5e: Phase Validation & Checkpoint**
   - Commit checkpoint: `ckpt(kds-test-orchestration): Phase 5 complete - KDS integration verified`
   - **AUTO-CONTINUE:** Proceed to Phase 6

**Rollback Plan:**
- Checkpoint: `ckpt(kds-test-orchestration): Before Phase 5`

---

### Phase 6: Update Playwright Config Enforcement
**Goal:** Update playwright.config.cjs to enforce orchestration-only approach

**Dependencies:** Phase 5 complete

**Estimated Duration:** 30 minutes

**Acceptance Criteria:**
- webServer config removed from playwright.config.cjs
- PW_MODE environment variable deprecated
- Standalone mode disabled
- Config validates orchestration script exists before allowing test execution

**Tasks:**

1. **Task 6a: Create Config Validation Test**
   - Test File: `.github/key-data-streams/kds-test-orchestration/tests/phase-6-config-enforcement.spec.md`
   - Coverage: Verify no webServer config, orchestration-only mode
   - Estimated Duration: 15 minutes

2. **Task 6b: Update playwright.config.cjs**
   - Action: Remove webServer section, add orchestration validation
   - Files: `config/testing/playwright.config.cjs`
   - Pattern: Validate orchestration script exists in Scripts/ before test execution
   - Estimated Duration: 20 minutes

3. **Task 6c: Run & Fix Test**
   - Estimated Duration: 5 minutes

4. **Task 6d: Phase Validation & Checkpoint**
   - Commit checkpoint: `ckpt(kds-test-orchestration): Phase 6 complete - Config enforcement enabled`
   - **AUTO-CONTINUE:** Proceed to Phase 7

**Rollback Plan:**
- Checkpoint: `ckpt(kds-test-orchestration): Before Phase 6`

---

### Phase 7: Finalization & Documentation
**Goal:** Generate comprehensive documentation and mark key complete

**Dependencies:** Phase 6 complete

**Estimated Duration:** 30 minutes

**Tasks:**

1. **Task 7a: Generate Migration Guide**
   - Action: Create migration guide for developers
   - Files: `.github/key-data-streams/kds-test-orchestration/MIGRATION-GUIDE.md`
   - Content: Before/after examples, common pitfalls, troubleshooting
   - Estimated Duration: 15 minutes

2. **Task 7b: Update CHANGELOG**
   - Action: Document all changes in kds-rulebook.md changelog
   - Files: `.github/governance/kds-rulebook.md`
   - Pattern: Version 2.2.0 entry with Phase 1-6 summary
   - Estimated Duration: 10 minutes

3. **Task 7c: Run KDS Cleanup** (cohesion.prompt.md v2.0)
   - Execute: `cohesion validation-level=kds-cleanup auto-fix=true`
   - Target: `.github/key-data-streams/kds-test-orchestration/`
   - Purpose: Validate KDS structure, archive deprecated files
   - Handoff File: Auto-invoked by task agent
   - Estimated Duration: 5 minutes

4. **Task 7d: Mark Key Complete**
   - Update kds-test-orchestration.plan.json status to "complete"
   - Final commit: `complete(kds-test-orchestration): All phases finished`
   - Estimated Duration: 5 minutes

**FINAL PHASE:** No auto-continue after completion

---

## Test Strategy

**Test Types Required:**
- Documentation tests (validation of MD/JSON content)
- Pattern matching tests (grep searches for prohibited patterns)
- Integration tests (verify agents load canonical sources)
- Config validation tests (playwright.config.cjs enforcement)

**Test Execution:**
- Manual validation (documentation tests)
- Automated grep searches (pattern matching)
- Config linting (JSON/YAML validation)

**Acceptance Criteria Per Phase:**
- Each phase MUST define acceptance criteria
- Tests MUST assert them (`assertCriteria: true`)
- Central Index: Maintain `.github/tests/playwright-index.json`

**Test Registry:**
- Query `.github/tests/playwright-index.json` before creating new tests
- Reuse existing pattern matching tests if available

---

## Rollback Plan

**Checkpoints:**
- `ckpt(kds-test-orchestration): Before Phase 1`
- `ckpt(kds-test-orchestration): Phase 1 complete`
- `ckpt(kds-test-orchestration): Phase 2 complete`
- `ckpt(kds-test-orchestration): Phase 3 complete`
- `ckpt(kds-test-orchestration): Phase 4 complete`
- `ckpt(kds-test-orchestration): Phase 5 complete`
- `ckpt(kds-test-orchestration): Phase 6 complete`

**Rollback to specific phase:**
```powershell
git reset --hard {phase-checkpoint-sha}
```

**See:** `.github/prompts/shared/task-exec/checkpoint-protocol.md`

---

## Success Metrics

**Quantitative:**
- Files cleaned: 20+ files updated
- Code blocks removed: 50+ orchestration snippets
- References consolidated: 1 canonical source (kds-rulebook.md Rule #3)
- Conflicts resolved: 3 major conflicts (webServer, validation, templates)

**Qualitative:**
- Single source of truth established
- No conflicting guidance across documentation
- Improved discoverability (one place to find orchestration rules)
- Reduced maintenance burden (update once vs 20+ locations)

---

## Related Documentation

**Canonical Sources:**
- `.github/governance/kds-rulebook.md` - Rule #3 (Playwright Orchestration)
- `.github/instructions/rules/playwright-orchestration/rule.md` - Implementation details

**Supporting Files:**
- `.github/prompts/shared/test-orchestration-patterns.md` - Template patterns
- `.github/tests/README.md` - Test registry integration
- `.github/tests/AUTO-UPDATE.md` - Auto-update orchestration integration

**Related Keys:**
- None (this is foundational governance work)

---

## Estimated Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: KDS Rulebook Enhancement | 45 min | None |
| Phase 2: Clean Prompts | 60 min | Phase 1 |
| Phase 3: Clean Instructions | 45 min | Phase 2 |
| Phase 4: Holistic Cleanup | 30 min | Phase 3 |
| Phase 5: KDS Integration | 30 min | Phase 4 |
| Phase 6: Config Enforcement | 30 min | Phase 5 |
| Phase 7: Finalization | 30 min | Phase 6 |
| **TOTAL** | **4 hours 30 minutes** | Sequential |

---

**END OF PLAN**
