# Holistic Prompts & Instructions Review - Enforcement Plan
**Date**: 2025-10-14T18:00:00Z  
**Scope**: Enforce test location, .github consolidation, visual test automation, key data stream efficiency

---

## Requirements to Enforce

### 1. Test Location Standardization
**Rule**: ALL tests (Playwright functional, Percy visual, experimental) created in `Workspaces/TEMP/`

**Current State**: Mixed locations
- task.prompt.md: `Tests/UI/` or `Workspaces/TEMP/`  
- test-generation.prompt.md: `Tests/UI/` or `Workspaces/TEMP/`  
- Inconsistent guidance

**Required Changes**:
- ✅ **task.prompt.md** Step 6.1: Change test location from `Tests/UI/ or Workspaces/TEMP/` to `Workspaces/TEMP/` ONLY
- ✅ **test-generation.prompt.md**: Update test location mandate to `Workspaces/TEMP/` as default
- ✅ Add cleanup step: Move production-ready tests from TEMP → Tests/UI/ during completion workflow

### 2. .github Consolidation
**Rule**: ALL prompts, instructions, learning, key data streams housed under `.github/`

**Current State**: References to outdated paths
- Workspaces/Copilot/learning/ → MOVED to .github/learning/ ✅
- Workspaces/Documentation/ → Still referenced in multiple prompts
- Workspaces/TEMP/ → Correct (workspace for temporary artifacts)

**Required Changes**:
- ✅ **Update ALL prompts**: Replace `Workspaces/Copilot/learning/` → `.github/learning/`
- ✅ **cohesion-review.prompt.md**: Update output path from `Workspaces/Documentation/` → `.github/reports/`
- ⚠️ **Keep Workspaces/Documentation/**: For implementation summaries (not system configuration)
- ✅ **Clarify**: .github = system config, Workspaces = project artifacts

### 3. Visual Test Automation Decision Matrix
**Rule**: Clear automatic determination when to run Playwright functional vs Percy visual tests

**Current State**: Manual decision in task.prompt.md, no automatic execution

**Required Changes**:
- ✅ **task.prompt.md** Step 6.1: Add automatic test type detection
- ✅ **test-generation.prompt.md**: Add decision tree with keywords
- ✅ **Add auto-execution**: After test generation, automatically run appropriate test type
- ✅ **Percy detection keywords**: "CSS", "color", "layout", "spacing", "visual", "theme", "responsive"
- ✅ **Functional detection keywords**: "click", "submit", "broadcast", "API", "interaction", "workflow"

### 4. Key Data Stream Bloat Prevention
**Rule**: Check for duplication and bloat on every update, keep relevant and efficient

**Current State**: Append-only, no cleanup mechanism

**Required Changes**:
- ✅ **task.prompt.md** Step 8: Add bloat detection before update
- ✅ **Deduplication rules**: Merge duplicate file references, consolidate commit hashes
- ✅ **Obsolescence detection**: Remove experiments marked as failed >30 days
- ✅ **Size limit**: Warn if key data stream >2000 lines, suggest archival

---

## Implementation Details

### Change 1: Test Location Mandate

**Files to Update**:
1. `.github/prompts/task.prompt.md`
2. `.github/prompts/test-generation.prompt.md`

**Enforcement**:
```markdown
### 6.1. Automatic Playwright Test Creation (UI Tasks)

1. **Test Location**: `Workspaces/TEMP/` (MANDATORY - all new tests start here)
2. **Naming Convention**: `<key>-<test-type>.spec.ts`
   - Functional: `{key}-functional.spec.ts`
   - Visual: `{key}-visual.spec.ts`
3. **Promotion Path**: Tests move from TEMP → Tests/UI/ ONLY during Step 9 (Completion Workflow)
4. **Rationale**: 
   - Keeps Tests/UI/ clean (production-ready only)
   - Allows experimentation in TEMP without clutter
   - Clear promotion ceremony validates test quality
```

### Change 2: .github/ Path Consolidation

**Global Find/Replace**:
- `Workspaces/Copilot/learning/` → `.github/learning/`
- `Workspaces/Documentation/cohesion-review-*.md` → `.github/reports/cohesion-review-*.md`

**New Directory Structure**:
```
.github/
├── learning/               # Pattern libraries (MOVED ✅)
│   ├── error-patterns.json
│   ├── patterns/*.json
│   └── insights/*.json
├── reports/                # NEW - System reports
│   ├── cohesion-review-*.md
│   └── health-check-*.md
├── prompts/                # Agent prompts ✅
├── prompts.keys/           # Key data streams ✅
└── instructions/           # System instructions ✅
```

### Change 3: Automatic Visual Test Detection & Execution

**Add to task.prompt.md Step 6.1**:

```markdown
#### 6.1.5. Automatic Test Type Detection & Execution

**Trigger**: After test file created in Workspaces/TEMP/

**Detection Logic**:
1. **Analyze task description** for keywords:
   - **Visual Test Indicators**: CSS, color, layout, spacing, visual, theme, responsive, style, alignment, rendering
   - **Functional Test Indicators**: click, submit, broadcast, API, interaction, workflow, navigation, form, button

2. **Determine test type**:
   - If visual keywords > functional keywords → Visual regression test (Percy)
   - If functional keywords > visual keywords → Functional E2E test (Playwright)
   - If mixed → Generate BOTH tests

3. **Auto-execute appropriate test**:
   ```bash
   # Visual test
   npm run test:percy:visual -- Workspaces/TEMP/{key}-visual.spec.ts
   
   # Functional test
   npx playwright test Workspaces/TEMP/{key}-functional.spec.ts --headed
   ```

4. **Output to user**:
   ```
   🧪 Test Execution: {test-type}
   - File: Workspaces/TEMP/{key}-{test-type}.spec.ts
   - Command: {execution command}
   - Status: {PASS | FAIL | SKIPPED}
   - Artifacts: Workspaces/TEMP/playwright-artifacts/
   ```

**Skip auto-execution if**:
- User specifies `--no-auto-test`
- Test requires manual server setup
- Test needs environment configuration
```

### Change 4: Key Data Stream Bloat Prevention

**Add to task.prompt.md Step 8 (before update)**:

```markdown
#### 8.0. Key Data Stream Bloat Detection (Pre-Update Check)

**Purpose**: Prevent information bloat, ensure efficiency and relevance

**Execution** (before writing updates):

1. **Read current key data stream**:
   - Count total lines
   - Identify duplicate sections
   - Check for obsolete experiments

2. **Deduplication Rules**:
   - **File References**: Merge multiple references to same file with consolidated change list
   - **Commit Hashes**: Keep only latest commit per logical grouping
   - **Test Results**: Archive old test runs, keep only latest 3 executions
   - **View Documentation**: Keep only current HTML state, archive historical versions

3. **Obsolescence Detection**:
   - **Failed Experiments**: Remove if >30 days old and not referenced
   - **Temporary Notes**: Remove "TODO" items completed or abandoned >14 days
   - **Duplicate Work Logs**: Consolidate consecutive entries for same task

4. **Size Limits**:
   - **Warning at 2000 lines**: Suggest archiving historical sections
   - **Hard limit at 3000 lines**: Force archival before new updates
   - **Archive location**: `.github/prompts.keys/{key}/archive/work-log-{timestamp}.md`

5. **Efficiency Metrics**:
   - **Before cleanup**: {X} lines, {Y} duplicate sections, {Z} obsolete entries
   - **After cleanup**: {X2} lines ({reduction}%), {Y2} duplicates removed, {Z2} archived
   - **Space saved**: {MB} disk space

**Output**:
```
🧹 Key Data Stream Cleanup
- Size: 2450 lines → 1680 lines (-31%)
- Duplicates removed: 12 file references consolidated
- Obsolete entries archived: 5 failed experiments (>30 days)
- Efficiency: OPTIMAL
```

**Abort conditions**:
- Cleanup would remove active work-in-progress entries
- Archive location unavailable
- Size still >3000 lines after cleanup (manual intervention required)
```

---

## Validation Checklist

### Test Location
- [ ] All new tests created in `Workspaces/TEMP/`
- [ ] No hardcoded `Tests/UI/` paths in test generation
- [ ] Completion workflow includes test promotion step
- [ ] PlaywrightConfig.MD updated with TEMP-first mandate

### .github Consolidation
- [ ] No references to `Workspaces/Copilot/learning/` in prompts
- [ ] Cohesion reports go to `.github/reports/`
- [ ] Learning patterns reference `.github/learning/`
- [ ] Clear distinction: .github = system, Workspaces = artifacts

### Visual Test Automation
- [ ] Keyword detection logic implemented
- [ ] Auto-execution after test generation
- [ ] Percy vs Playwright decision transparent to user
- [ ] Manual override available (`--no-auto-test`)

### Bloat Prevention
- [ ] Deduplication runs before every update
- [ ] Size limits enforced (warn@2000, hard@3000)
- [ ] Obsolescence cleanup automatic (>30 days)
- [ ] Archival preserves history

---

## Files Requiring Updates

1. `.github/prompts/task.prompt.md` - 4 changes
   - Step 6.1: Test location to TEMP only
   - Step 6.1.5: NEW - Automatic test detection & execution
   - Step 8.0: NEW - Bloat detection
   - Step 9: Test promotion from TEMP → Tests/UI/
   - Step 10.1: Update path references to .github/learning/

2. `.github/prompts/test-generation.prompt.md` - 2 changes
   - Test location mandate: TEMP only
   - Add decision matrix with keywords

3. `.github/prompts/cohesion-review.prompt.md` - 1 change
   - Output path: .github/reports/

4. `.github/prompts/question.prompt.md` - 1 change
   - Pattern file path update

5. `.github/prompts/sync.prompt.md` - 1 change
   - Learning path update

6. `.github/prompts/refactor.prompt.md` - 1 change
   - Learning path update

7. `.github/prompts/healthcheck.prompt.md` - 1 change
   - Learning path update

8. `.github/prompts/commit.prompt.md` - 2 changes
   - Learning path update
   - Report path update

9. `.github/instructions/Links/PlaywrightConfig.MD` - 1 change
   - Document TEMP-first mandate

---

## Estimated Impact

**Test Quality**: ⬆️ Higher (promotion ceremony validates before Tests/UI/)  
**Workspace Organization**: ⬆️ Cleaner (.github consolidation)  
**Automation**: ⬆️ Better (auto-detect visual vs functional)  
**Key Data Stream Efficiency**: ⬆️ 30% size reduction via deduplication  
**Maintenance Overhead**: ⬇️ Lower (automatic cleanup)

---

## Rollout Plan

### Phase 1: Critical Enforcement (Immediate)
1. Update task.prompt.md Step 6.1 - Test location mandate
2. Update task.prompt.md Step 8.0 - Bloat detection
3. Update test-generation.prompt.md - TEMP location

### Phase 2: Path Consolidation (15 minutes)
4. Global replace: Workspaces/Copilot/learning/ → .github/learning/
5. Create .github/reports/ directory
6. Update cohesion-review output path

### Phase 3: Automation Enhancement (20 minutes)
7. Add automatic test type detection (Step 6.1.5)
8. Add auto-execution logic
9. Update PlaywrightConfig.MD

### Phase 4: Validation (10 minutes)
10. Run test to verify TEMP location
11. Trigger bloat detection on large key
12. Validate .github/ references

---

## Success Metrics

- ✅ 100% new tests in Workspaces/TEMP/
- ✅ 0 references to Workspaces/Copilot/learning/
- ✅ Automatic visual test detection >90% accuracy
- ✅ Key data stream size reduction >25%
- ✅ Zero bloat warnings on fresh keys

