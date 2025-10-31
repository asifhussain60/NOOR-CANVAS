---
mode: agent
description: Generate Playwright end-to-end tests (functional and visual) with orchestration, browser-log guards, and key-scoped placement.
---

# test-generation.prompt.md (Test Generation Agent)

**⚠️ LOAD FIRST:** `.github/MANDATORY.md` (Enforce: No code in chat | Document first | Playwright orchestration)

---

## 🛡️ Step -1: KDS Governance Enforcement

**BEFORE processing any request, check:**

IF user request contains modifications to `.github/prompts/*.md` OR `.github/instructions/*.md`:
  - **HALT execution immediately**
  - Display enforcement message
  - **STOP** (do not proceed to Step 0+)

**⚠️ GOVERNANCE ENFORCEMENT**

Changes to `.github` prompts/instructions must go through the KDS gatekeeper for compatibility analysis.

```markdown
@workspace /kds request="[your change request here]"
```

**See:** `.github/prompts/kds.prompt.md` for governance protocol.

---

ELSE: Proceed to test generation

---

**Version:** 2.0.0  
**Purpose:** Generate Playwright end-to-end tests (functional and visual) with orchestration, browser-log guards, and key-scoped placement.

**Changelog:**
- **v2.0.0 (2025-10-31)**: RULE #1 COMPLIANCE - Extracted code examples to `shared/test-examples.md` (20+ blocks removed). Removed TypeScript/PowerShell/Bash/JSON code blocks from user-facing output. Algorithm references replace inline examples. Authentication patterns, migration templates, orchestration scripts now in shared file.
- **v1.8.0 (2025-10-29)**: FILE FINALIZATION VERIFICATION - Added work-log.md append verification. Enforces "Document First, Respond Later". References file-finalization-verifier.md.
- **v1.7.0**: STATE TRACKING INTEGRATION - Added state-tracker.ps1 integration for test tracking timeline reconstruction.

---

## Output Format
**LOAD:** `.github/MANDATORY.md` (Rule 1: output format, 25 bullets, no code)

**Structure:** 🧠 Analysis (≤5 bullets), 📌 Summary (≤15 bullets), 📊 Final (≤5 bullets)

**CRITICAL:** No code blocks in user-facing output (TypeScript/PowerShell/Bash examples in `shared/test-examples.md`)

---

## Parameters

### key *(required)*
Unique identifier for the feature/work stream (determines test file location)

### -test *(flag, optional)*
Enable post-execution validation using `.github/prompts/shared/prompt-test-validation-framework.md`

**Behavior:**
1. Execute test generation workflow normally
2. After completion, run validation checks specific to test-generation.prompt.md
3. Generate validation report with quality score (0-100)
4. If violations or missed requirements: generate recommendations
5. Present findings to user

**See:** `.github/prompts/shared/test-examples.md` - Validation Report Example

**Test-Generation-Specific Validation Checks:**
- ✓ Test files created (.spec.ts in Tests/UI/ directory)
- ✓ Test registry updated (`.github/key-data-streams/{key}/tests/test-registry.md`)
- ✓ Test coverage types appropriate (Percy for UI changes, functional for API)
- ✓ Valid test structure (test() or it() blocks present)
- ✓ Browser-log guards implemented where needed
- ✓ Orchestration scripts created for complex scenarios
- ✓ Commit message format followed (test(key): description)

### feature *(required)*
Feature name or scenario being tested

### scenario *(required)*
Specific test scenario description

### endpoints *(optional)*
Comma-separated API endpoints involved

### tokens *(default: Session 212)*
- Default host token: `PQ9N5YWW` (Session 212)
- Default participant token: `KJAHA99L` (Session 212)
- Custom tokens accepted if specified

### multiUser *(default=false)*
- `true`: Test involves host AND participant interactions
- `false`: Single-user test (host OR participant only)

### testType *(default="functional")*
- `functional`: Playwright E2E test (user interactions, state verification)
- `visual`: Percy visual regression test (UI appearance, layout)
- `both`: Generate functional + visual tests

### mode *(default="headless")*
- `headless`: Run tests without browser UI (faster, CI/CD)
- `headed`: Run tests with visible browser (debugging)

### screenshots *(optional)*
Array of image attachments with numbered markers indicating click sequence

**Behavior:**
- Agent uses built-in vision analysis to extract numbered markers (1, 2, 3...)
- Identifies button text, CSS properties, and session context from images
- Maps visual elements to Razor component code
- Generates `click-sequence-metadata.json` automatically
- Creates Playwright test + orchestration script
- See: `.github/prompts/shared/screenshot-test-extraction.md`

**Expected Screenshot Types:**
1. **Numbered Markers**: Circles/boxes with numbers showing click sequence
2. **DevTools CSS Panels**: CSS properties for element targeting
3. **Session Context**: URL bar showing base URL and tokens

**Vision Analysis Features:**
- Marker detection (numbered circles/boxes in screenshots)
- Text extraction (button labels, page titles)
- CSS property extraction (from DevTools Styles panel)
- URL parsing (session tokens, base URL)

---

## Purpose

Generate production-ready Playwright tests with:
- **Key-Scoped Organization**: Tests stored in `.github/key-data-streams/{key}/tests/`
- **Authentication Handling**: Auto-detect host vs participant requirements
- **Orchestration Scripts**: PowerShell scripts for app lifecycle management
- **Browser Log Guards**: Capture console errors/warnings during test execution
- **Test Registry**: Central index preventing duplicate test creation
- **Percy Integration**: Visual regression testing for UI changes

---

## When to Use

- **UI Component Changes** (buttons, forms, modals, layouts)
- **User Interaction Flows** (login, navigation, form submission)
- **Multi-User Scenarios** (host broadcasts, participant receives updates)
- **Visual Regressions** (layout changes, responsive design, theme updates)
- **API Integration** (frontend → backend → database validation)
- **Database Migrations** (schema validation, rollback testing)

---

## Execution Steps

### Step -1: Initialize State Tracking (EXECUTE FIRST)

**See:** `.github/prompts/shared/test-examples.md` - State Tracker Integration section

**Purpose:** Track test generation activities, record test scenarios and commits, enable test coverage timeline reconstruction

---

### Step 0: Test Registry Check (MANDATORY - Prevent Duplication)

**Purpose:** Check if similar test already exists before generating new one

**Algorithm:**
1. Load test registry: `.github/key-data-streams/{key}/tests/test-registry.md`
2. Search for existing tests matching scenario/feature
3. If duplicate found → Prompt user:
   - A. Reuse existing test (RECOMMENDED)
   - B. Create new test with different scope
   - C. Update existing test
   - D. Cancel
4. If no registry exists → Create new registry (first test for this key)

**Registry Format:**
```markdown
# Test Registry for {key}

| Test File | Type | Scenario | Created | Status |
|-----------|------|----------|---------|--------|
| feature-functional.spec.ts | Functional | User login flow | 2025-10-31 | Active |
| feature-visual.spec.ts | Visual | Button layout | 2025-10-31 | Active |
```

---

### Step 0.5: Screenshot Analysis (CONDITIONAL)

**Trigger:** User provides `screenshots` parameter with image attachments

**Purpose:** Extract test metadata from visual markers BEFORE test generation

**Algorithm Reference:** `.github/prompts/shared/screenshot-test-extraction.md`

**Workflow:**

1. **Analyze Screenshots Using Vision**
   - Use GitHub Copilot's built-in vision capabilities to analyze attached images
   - Extract numbered markers (1, 2, 3...) indicating click sequence
   - Extract button text, page titles, and visual context
   - Extract CSS properties from DevTools screenshots (if present)
   - Extract session context from URL bar (base URL, tokens)

2. **Map Visual Elements to Code**
   - Search Razor components for matching button text
   - Cross-reference CSS properties to narrow candidates
   - Generate Playwright selectors (data-testid, text, class)
   - Extract SignalR event names if applicable

3. **Generate Metadata JSON**
   - Create `click-sequence-metadata.json` with:
     - metadata: Session context, test framework, orchestration pattern
     - click_sequence: Each step with element definitions and selectors
     - ui_components: Component documentation
     - signalr_architecture: Hub and event mapping
     - playwright_selectors: Locator strategies
     - visual_regression: Percy screenshot specs
     - code_references: Razor files, methods, line numbers
   - Save to `.github/key-data-streams/{key}/tests/`

4. **User Approval Gate**
   - Display extracted metadata summary:
     - Session ID, tokens, base URL
     - Click sequence (N steps identified)
     - Component mappings (Razor files)
     - CSS identifiers (colors, spacing, layout)
   - Present options:
     - A. APPROVE - Proceed with extracted metadata (RECOMMENDED)
     - B. REVISE - User corrects extracted data
     - C. MANUAL - Skip automation, user provides manual JSON

5. **Proceed to Test Generation**
   - If APPROVED: Use metadata for Step 2 (Test Spec Generation)
   - If REVISED: Update metadata with user corrections
   - If MANUAL: Bypass screenshot analysis, continue standard workflow

**Vision Analysis Examples:**
- **Marker Detection:** "Identify all numbered circles/boxes in this image. Return number, location, and nearby text."
- **CSS Extraction:** "Extract CSS rules from the Styles panel. Return property names and values."
- **URL Parsing:** "Read the browser address bar. Extract base URL and query parameters."

**Integration with test-prep:**
- Cross-reference extracted selectors with existing `data-playwright-log-marker` attributes
- Validate that visual markers match prep markers (if test-prep workflow used)
- See: `.github/prompts/test-prep.prompt.md` Step 1.5

**Limitations:**
- Vision analysis may require user confirmation for ambiguous text
- Multiple components with same button text need user disambiguation
- Missing CSS properties from screenshots prompt user for inline styles

---

### Step 1: Authentication Requirements Detection

**MANDATORY step before test implementation - prevents authentication-related test failures**

**See:** `.github/prompts/shared/test-examples.md` - Authentication Detection Algorithm

**Detection Triggers:**
- Test involves Host Control Panel (`/host` route)
- Test requires "Start Session" or "Begin Broadcast" actions
- Test accesses host-only features (share controls, participant management)
- Test modifies session state (recording, transcript broadcasting)

**Authentication Patterns:**
- **Host tests:** Require host token input + "Start Session" button verification
- **Participant tests:** Require participant token input only
- **Multi-user tests:** Both host and participant authentication in separate contexts

**See:** `.github/prompts/shared/test-examples.md` - Authentication Patterns section for complete code templates

---

### Step 2: Test Type Determination

Based on `testType` parameter and scenario analysis:

**Functional E2E Tests (Playwright):**
- User interactions (clicks, typing, navigation)
- State verification (elements visible/hidden, text content)
- API call validation (network requests, responses)
- Database persistence (page refresh after mutation)
- Multi-user synchronization (SignalR broadcasts)

**Visual Regression Tests (Percy):**
- Layout changes (component positioning, spacing)
- Responsive design (mobile, tablet, desktop breakpoints)
- Theme updates (colors, fonts, borders)
- CSS modifications (hover states, animations)

**When to generate both:**
- Significant UI component changes (functional + visual validation)
- New feature with user interaction + layout requirements
- Redesign work (behavior + appearance testing)

---

### Step 3: Test File Generation

**Location:** `.github/key-data-streams/{key}/tests/{feature}-{test-type}.spec.ts`

**Naming Convention:**
- Functional: `{feature}-functional.spec.ts`
- Visual: `{feature}-visual.spec.ts`
- Migration: `migration-{timestamp}-{description}-validation.spec.ts`

**Test Structure:**
1. Imports (Playwright test, expect, Percy if visual)
2. Test describe block with feature name
3. beforeEach hook (authentication, navigation, setup)
4. Test cases (individual test() blocks)
5. afterEach hook (cleanup if needed)

**See:** `.github/prompts/shared/test-examples.md` for complete test templates:
- Host Control Panel Test Template
- Participant Test Template
- Migration Test Template

---

### Step 4: Orchestration Script Creation (MANDATORY for Playwright Tests)

**⚠️ CRITICAL:** All Playwright tests REQUIRE orchestration script (never run tests standalone)

**Purpose:** Manage app lifecycle (start → wait → test → stop)

**Script Location:** `.github/key-data-streams/{key}/scripts/run-{feature}-test.ps1`

**Canonical Pattern (Dotnet Orchestration):**
1. **Cleanup Phase:** Stop any existing app processes
2. **Launch Phase:** Start app in separate window (NOT background job)
3. **Health Check:** Wait for app to be ready (HTTP polling)
4. **Test Execution:** Run Playwright tests
5. **Cleanup:** Stop app process (try/finally for reliability)

**See:** `.github/prompts/shared/test-examples.md` - Orchestration Script Examples section for complete PowerShell template

**PROHIBITED Approaches:**
- ❌ `Start-Job` (nested PowerShell processes)
- ❌ `npx playwright test` standalone (no app orchestration)
- ❌ Manual `dotnet run` before tests (not automated)

---

### Step 5: Browser Log Guards Implementation (Conditional)

**When to Include:**
- Complex UI interactions (drag/drop, modals, dynamic content)
- SignalR integration (real-time updates, connection handling)
- Third-party libraries (external scripts, CDN resources)
- Known console warning sources (development mode warnings)

**Algorithm:** See `shared/test-examples.md` - Browser Log Guard Pattern (TypeScript beforeEach hook implementation)

---

### Step 6: Percy Visual Snapshots (if testType includes "visual")

**Purpose:** Capture baseline screenshots for visual regression detection

**Snapshot Strategy:**
- **Component-level:** Individual UI components (buttons, cards, forms)
- **Page-level:** Full page layouts (dashboard, settings, reports)
- **State-based:** Different UI states (loading, error, success, empty)
- **Responsive:** Multiple viewports (mobile, tablet, desktop)

**Naming Convention:** `{feature} - {state} - {viewport}`

**Example:** `"Share Button - Hover State - Desktop"`

---

### Step 7: Test Validation & Dry-Run

**Pre-Commit Checks:**
1. **Syntax Validation:** TypeScript compilation
2. **Import Resolution:** All dependencies available
3. **Token Validation:** Session 212 tokens correct
4. **Orchestration Script:** PowerShell syntax valid
5. **Test Registry:** Updated with new test entry

**Dry-Run Execution (Recommended):**
- Run test in headed mode for visual verification
- Capture screenshots on failure
- Verify authentication flow works
- Confirm assertions pass

---

### Step 7.5: Test Quality Scoring & Approval Gate (NEW - MANDATORY)

**Execute AFTER test file generation (Step 3-6) and BEFORE test registry update (Step 7.75)**

**Purpose:** Validate test quality and obtain user approval before finalizing test placement

**DRAFT/ Staging Structure:**

````
.github/key-data-streams/{key}/tests/
  DRAFT/
    {test-name}.spec.ts           # Staged test file (awaiting approval)
    {test-name}.quality-report.md # Quality scoring details
  {test-name}.spec.ts             # Approved test (moved from DRAFT/)
````

**Algorithm:** See `.github/prompts/shared/test-quality-scoring.md` for complete scoring logic

**Quality Scoring Criteria (0-100 Scale):**

1. **Acceptance Criteria Coverage (30 points)**
   - All acceptance criteria have corresponding assertions (30 pts)
   - Partial coverage (10-25 pts)
   - No coverage (0 pts)

2. **Assertion Completeness (20 points)**
   - Assertions for UI state, API responses, database changes (20 pts)
   - Partial assertions (10-15 pts)
   - Minimal assertions (0-5 pts)

3. **Error Handling (15 points)**
   - try/catch blocks, timeout handling, retry logic (15 pts)
   - Basic error handling (5-10 pts)
   - No error handling (0 pts)

4. **Test Isolation (15 points)**
   - Independent test data, cleanup hooks, no shared state (15 pts)
   - Partial isolation (5-10 pts)
   - Coupled tests (0 pts)

5. **Documentation Quality (10 points)**
   - Clear test description, commented complex logic, scenario explanation (10 pts)
   - Minimal comments (5 pts)
   - No documentation (0 pts)

6. **Playwright Best Practices (10 points)**
   - data-testid selectors, auto-waiting, parallel execution safe (10 pts)
   - Some best practices (5 pts)
   - Poor practices (0 pts)

**Scoring Process:**

1. **Generate Test** (Steps 3-6 complete)
2. **Save to DRAFT/** `.github/key-data-streams/{key}/tests/DRAFT/{test-name}.spec.ts`
3. **Calculate Quality Score** (0-100 using criteria above)
4. **Generate Quality Report** `.github/key-data-streams/{key}/tests/DRAFT/{test-name}.quality-report.md`
5. **Display Score & Report** to user
6. **Present Approval Options** (A/B/C/D)

**Quality Report Template:**

````markdown
# Test Quality Report: {test-name}
**Generated:** {timestamp}  
**Key:** {key}  
**Overall Score:** {score}/100  

## Score Breakdown

### Acceptance Criteria Coverage: {score}/30
- Criteria 1: {assertion-reference} ✅
- Criteria 2: {assertion-reference} ✅
- Criteria 3: ❌ Missing assertion

### Assertion Completeness: {score}/20
- UI assertions: ✅ (toBeVisible, toHaveText)
- API assertions: ✅ (response status, body validation)
- Database assertions: ❌ Missing

### Error Handling: {score}/15
- try/catch blocks: ✅
- Timeout handling: ⚠️ Partial (some waits missing)
- Retry logic: ❌ Not implemented

### Test Isolation: {score}/15
- Independent test data: ✅
- Cleanup hooks: ✅ (afterEach)
- No shared state: ✅

### Documentation Quality: {score}/10
- Test description: ✅ (clear scenario)
- Code comments: ⚠️ Minimal
- Complex logic explained: ❌ Missing

### Playwright Best Practices: {score}/10
- data-testid selectors: ✅
- Auto-waiting: ✅
- Parallel execution safe: ✅

## Recommendations
- Add assertion for Criteria 3: {acceptance-criteria-text}
- Add database validation after API call
- Improve error handling for API timeouts
- Add comments explaining complex selectors

## Test File Location
DRAFT: `.github/key-data-streams/{key}/tests/DRAFT/{test-name}.spec.ts`
````

**Approval Workflow Options:**

**A. APPROVE** (Recommended if score ≥ 80)
- Move test from DRAFT/ to `.github/key-data-streams/{key}/tests/`
- Delete DRAFT/ folder and quality report
- Update test registry (Step 7.75)
- Commit with message: `test({key}): {scenario} - Quality score: {score}/100`
- Test is now ready for execution

**B. REVISE** (Recommended if score 60-79)
- Keep test in DRAFT/
- User provides feedback on improvements needed
- Regenerate test with improvements (address quality report recommendations)
- Recalculate score (repeat Step 7.5)
- Present approval options again

**C. REGENERATE** (Recommended if score < 60)
- Delete DRAFT/ folder (including test and quality report)
- User refines requirements or acceptance criteria
- Return to Step 3 (Test File Generation)
- Generate new test with refined scope
- Repeat quality scoring

**D. CANCEL**
- Delete DRAFT/ folder (cleanup)
- Abort test creation (return to calling prompt)
- No files committed

**HALT after displaying options - user must select A/B/C/D**

**Output to User:**

````markdown
## 🧪 Test Quality Report | Key: `{key}`

**Test:** {test-name}  
**Score:** {score}/100  

**Breakdown:**
- Acceptance Criteria Coverage: {score}/30
- Assertion Completeness: {score}/20
- Error Handling: {score}/15
- Test Isolation: {score}/15
- Documentation Quality: {score}/10
- Playwright Best Practices: {score}/10

**Recommendations:**
1. {recommendation-1}
2. {recommendation-2}
3. {recommendation-3}

**Test Location:** `.github/key-data-streams/{key}/tests/DRAFT/{test-name}.spec.ts`  
**Quality Report:** `.github/key-data-streams/{key}/tests/DRAFT/{test-name}.quality-report.md`

## Approval Options

**A. APPROVE** (score ≥ 80 - RECOMMENDED)
   Move to final location, update registry, commit test.

**B. REVISE** (score 60-79)
   Keep in DRAFT/, provide feedback, regenerate with improvements.

**C. REGENERATE** (score < 60)
   Delete DRAFT/, refine requirements, start over with better scope.

**D. CANCEL**
   Delete DRAFT/, abort test creation.

**HALT - Select option to proceed**
````

**Guardrails:**
- NEVER move test from DRAFT/ to final location without user approval
- NEVER skip quality scoring (even if test looks perfect)
- NEVER auto-select approval option (user must explicitly choose)
- ALWAYS display quality report before approval options
- ALWAYS keep DRAFT/ files until approval (enables review/revision)

---

### Step 7.75: Test Registry Auto-Update (MANDATORY)

**Execute AFTER approval granted (Option A selected in Step 7.5)**

**LOAD MODULE:** `.github/prompts/shared/step-7-5-test-registry-auto-update.md`

**Purpose:** Update test registry AUTOMATICALLY after test approval (prevents duplication in future)

**Trigger:** ALWAYS when test moved from DRAFT/ to final location

**Registry Update Protocol:**
1. Load existing registry: `.github/key-data-streams/{key}/tests/test-registry.md`
2. Append new test entry with file name, type, scenario, created date, status, quality score
3. Commit registry with test files (single commit includes tests + registry)

**Registry Entry Format:**
```markdown
| {test-name}.spec.ts | {type} | {scenario} | {date} | Active | {score}/100 |
```

**Guardrail:** NEVER create test without registry update (blocks commit if missing)

---

### Step 8: Commit Tests & Documentation

**Commit Format:**
```
test({key}): {scenario description}

Type: {Functional|Visual|Both|Migration}
Feature: {feature name}
Test Files:
- .github/key-data-streams/{key}/tests/{file1}.spec.ts
- .github/key-data-streams/{key}/tests/{file2}.spec.ts

Orchestration:
- .github/key-data-streams/{key}/scripts/run-{feature}-test.ps1

Registry Updated:
- .github/key-data-streams/{key}/tests/test-registry.md

Authentication: {Host|Participant|Multi-User|None}
Session: 212 (tokens: {tokens used})
```

**Files in Commit:**
- Test files (`.spec.ts`)
- Orchestration script (`.ps1`)
- Test registry update (`.md`)
- Work log entry (document test creation)

---

### Step 9: Output Summary (CONCISE - NO CODE)

**🧠 Analysis (≤5 bullets)**
- Test type determined: {Functional|Visual|Both}
- Authentication detected: {Host|Participant|None}
- Files created: {count} test files + orchestration script
- Registry updated: {test-registry.md}
- Session: 212 (tokens: {list})

**📌 Summary (≤15 bullets)**
1. Test: {feature} - {scenario}
2. Type: {testType}
3. Location: `.github/key-data-streams/{key}/tests/`
4. Files created: {file names}
5. Orchestration: `run-{feature}-test.ps1`
6. Authentication: {pattern description}
7. Test cases: {count} scenarios
8. Percy snapshots: {count if visual}
9. Browser guards: {enabled/disabled}
10. Registry updated: {new entry added}
11. Commit: test({key}): {summary}
12. Next: Run `.\Scripts\run-{feature}-test.ps1` to execute
13. Validation: {passed/failed}
14. Status: Ready for execution
15. Promotion: Tests move to Tests/UI/ on key completion

**📊 Final (≤5 bullets)**
- ✅ Tests generated successfully
- ✅ Registry updated (prevents duplication)
- ✅ Orchestration script created
- ⏭️ Run tests: `.\Scripts\run-{feature}-test.ps1`
- 📋 See test registry: `.github/key-data-streams/{key}/tests/test-registry.md`

---

## Migration Test Generation (Database Changes)

**Trigger:** When test involves database schema validation

**See:** `.github/prompts/shared/test-examples.md` - Migration Test Template section

**Purpose:** Validate migration syntax, execution safety, rollback functionality, and data integrity

**Test Coverage:**
1. **SQL Syntax Validation:** Verify migration file exists, safety checks present, idempotent operations, MigrationHistory tracking
2. **Rollback Script Validation:** Verify rollback file exists, reverse operations correct, idempotent checks
3. **Migration Execution Simulation:** Execute against KSESSIONS_DEV (not production), verify success, check MigrationHistory record
4. **Rollback Execution Validation:** Execute rollback, verify success, check MigrationHistory updated with RolledBackAt timestamp

**CRITICAL:** Always run against KSESSIONS_DEV, never production

---

## Test Organization Strategy

**Key-Scoped Tests** (During Development):
- Location: `.github/key-data-streams/{key}/tests/`
- Purpose: Temporary test storage during active development
- Lifecycle: Created → Validated → Promoted on key completion

**Production Tests** (After Promotion):
- Location: `Tests/UI/`
- Purpose: Permanent test suite for CI/CD
- Lifecycle: Promoted from key directory when `tasks = "mark complete"`

**Registry Benefits:**
- Prevents duplicate test creation
- Enables test reuse across phases
- Tracks test coverage per key
- Facilitates test cleanup on completion

---

## Guardrails

- **ALWAYS check test registry before creating new test** (Step 0)
- **ALWAYS detect authentication requirements** (Step 1)
- **ALWAYS create orchestration script for Playwright tests** (Step 4)
- **ALWAYS update test registry after test creation** (Step 7.5)
- **ALWAYS use Session 212 defaults** (unless custom tokens specified)
- **ALWAYS commit tests + orchestration + registry together** (single commit)
- **ALWAYS reference code examples from shared/test-examples.md** (no inline code)
- **NEVER create tests without orchestration script**
- **NEVER skip registry update**
- **NEVER use standalone `npx playwright test`** (orchestration required)
- **NEVER run migration tests against production** (KSESSIONS_DEV only)
- **NEVER include code blocks in user-facing output** (Rule #1 compliance)

---

## Test Types Reference

**Functional E2E Tests (Playwright):**
- User interaction validation (clicks, typing, navigation)
- State verification (element visibility, text content)
- API integration (network requests, responses)
- Database persistence (page refresh validation)
- Multi-user synchronization (SignalR broadcasts)

**Visual Regression Tests (Percy):**
- Layout validation (component positioning, spacing)
- Responsive design (mobile, tablet, desktop)
- Theme consistency (colors, fonts, borders)
- CSS modifications (hover states, animations)

**Migration Tests:**
- SQL syntax validation (safety checks, idempotency)
- Execution simulation (KSESSIONS_DEV only)
- Rollback validation (reverse operations)
- MigrationHistory tracking

---

## Integration with Other Agents

**Called By:**
- **task.prompt.md** (Step 6.1) - Automatic test generation for UI changes
- **Direct user invocation** - Manual test creation

**Calls:**
- None (terminal agent - generates tests, does not invoke other agents)

**Handoff Protocol:**
- Receives: key, feature, scenario, testType, tokens, endpoints
- Returns: Test files, orchestration script, registry update, commit SHA

---

## Lessons Learned Integration

**See:** `.github/learning/test-generation-lessons.md` for historical lessons learned from test generation failures and prevention patterns.

**Key Lessons Applied:**
- Authentication detection prevents token-related failures
- Orchestration scripts prevent app lifecycle issues
- Registry prevents duplicate test creation
- Browser log guards catch console errors early

---

## Examples and Templates

**All code examples moved to:** `.github/prompts/shared/test-examples.md`

**Available Templates:**
- State Tracker Integration (PowerShell)
- Authentication Detection Algorithm (TypeScript)
- Host Control Panel Test Template (TypeScript)
- Participant Test Template (TypeScript)
- Migration Test Template (TypeScript)
- Orchestration Script Examples (PowerShell)
- Validation Report Example (Markdown)

**Usage:** Reference templates from shared file, customize for specific scenario, no inline code in user output.

---

## Success Criteria

- ✅ Test files created in `.github/key-data-streams/{key}/tests/`
- ✅ Orchestration script created (PowerShell, dotnet pattern)
- ✅ Test registry updated (prevents duplication)
- ✅ Authentication handled correctly (host/participant/multi-user)
- ✅ Browser log guards implemented (if complex UI)
- ✅ Percy snapshots included (if visual regression)
- ✅ Tests pass in dry-run execution
- ✅ Work log updated with test creation entry
- ✅ Commit includes tests + script + registry
- ✅ No code blocks in user-facing output (Rule #1 compliance)
