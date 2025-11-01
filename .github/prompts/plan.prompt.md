=# plan.prompt.md (Feature Planning Agent v1.8)

---
mode: agent
purpose: Interactive planning agent that refines a user request into an executable, testable plan and hands off to task and test-generation agents.
inputs: key, user_request, context, scope, constraints, include_suggestions, auto-chain, -test
outputs: Finalized plan recorded in .github/key-data-streams/{key}/work-log.md and a prepared handoff to task.prompt.md (tasks) and, when applicable, test-generation.prompt.md
lastUpdated: 2025-10-31
stateTracking: enabled

---

## 🛡️ Step -1: KDS Governance Enforcement

**CRITICAL CHECK** - See `.github/governance/kds-rulebook.md` Rule #10 for complete enforcement logic. If modifying `.github/` files, HALT and route to `@workspace /kds`.

---
- **v1.10 (2025-10-31)**: KDS GOVERNANCE INTEGRATION + HANDOFF CONTEXT + NEXT COMMAND
  - Added Step 0.2 to load route handoff context from `.github/key-data-streams/{key}/handoffs/route-to-plan.json`
  - Standardized "Next Command" output after plan generation to start Phase 1 via handoff JSON
  - Introduced KDS Governance Mode (key = `kds`) with explicit tasks to create `kds-handoff-protocol.md` and `kds.prompt.md`
  - Clarified honest handoff protocol (no implicit execution) and alignment with MANDATORY.md and SelfAwareness
  - Kept changes scoped to `.github/**` for clean, isolated merges to development
- **v1.9 (2025-10-31)**: PHASE ACCEPTANCE CRITERIA + CENTRAL TEST INDEX
  - Added mandatory Acceptance Criteria per phase (defined in the plan and enforced in tests)
  - Phase test-generation handoff now includes acceptanceCriteria and must assert them
  - Introduced a centralized Playwright Test Index JSON for reuse/avoid duplication
    - Default path: `.github/tests/playwright-index.json` (global)
    - Plan and test-generation update and consult this index
  - Added commit/merge hygiene guidance to keep changes isolated and traceable
- **v1.8 (2025-10-30)**: TEST-FIRST WORKFLOW & AUTOMATED JSON HANDOFFS
  - **Step 4 ENHANCED**: Plan generation now includes test-first workflow
    - Each phase: Task {N}a (create test) → Task {N}b-x (implement) → Task {N}y (run test) → Task {N}z (checkpoint)
    - Added complexity threshold: monolithic (≤3 phases) vs granular (>5 phases) structure
    - Final phase includes cleanup and mark-complete tasks
  - **Step 4.25 NEW**: Generate handoff JSON files for automated task execution
    - Creates `handoffs/phase-{N}-test.json` for test-generation.prompt.md
    - Creates `handoffs/phase-{N}-todo-{task}.json` for each implementation task
    - All handoff files saved to KDS before user approval
    - Eliminates manual parameter construction errors
  - **Step 6 ENHANCED**: Handoff preparation now references JSON files
    - Instead of manual parameters: `@workspace /test-generation #file:handoffs/phase-1-test.json`
    - Auto-chain enabled via "nextTask" field in JSON files
    - Traceable handoff chain for debugging
  - **Test Strategy**: Explicit test-first approach documented in plan
  - **Estimated Durations**: Added to each task for better tracking
  - **Auto-Continue Logic**: Refined with explicit conditions and rollback plans
  
  v1.7 (2025-10-29): E2E PHASE EXECUTION & RESPONSE FORMAT IMPROVEMENTS
  - Added auto-chain parameter for end-to-end multi-phase execution
  - **DEFAULT BEHAVIOR CHANGED**: auto-chain now defaults to TRUE (autocomplete enabled)
  - Option A (**AUTO-EXECUTE ALL PHASES**) shown as RECOMMENDED with 5s countdown
  - Updated Step 6 with auto-chain handoff logic (default auto vs manual override)
  - Added 📋 Phases & Tasks section to OUTPUT FORMAT (shows task breakdown)
  - Updated 📌 Plan Overview to show AUTO-CONTINUE markers between phases
  - Reduced 🧠 Analysis to ≤5 bullets (allocate space for task lists)
  - Users approve plan ONCE, execution proceeds E2E (halts only for manual intervention)
  - References MANDATORY.md (default to E2E execution)
  - Phase templates include explicit AUTO-CONTINUE instructions for task agent
  
  v1.6 (2025-10-29): Added Step 5.5 FILE FINALIZATION VERIFICATION (BLOCKING)
  - Enforces "Document First, Respond Later" protocol
  - Verifies plan.md, plan.json, work-log.md, state.json exist before user response
  - HALT execution if files missing (blocks Step 6 and Step 7.5)
  - References .github/prompts/shared/file-finalization-verifier.md
---

<!-- Metadata (non-frontmatter, lint-safe) -->
> acceptsFrom: [build, ask, drift]
> calls: [task, test-generation]

# plan.prompt.md (Feature Planning Agent)

**⚠️ LOAD FIRST:** `.github/MANDATORY.md` (Enforce: No code in chat | Document first | Playwright orchestration)

## Output Format
**LOAD:** `.github/MANDATORY.md` (Rule 1: output format, no code)

**Planning Exception:** plan.prompt.md uses flexible bullet limits (30-50 bullets) for detailed phase/task breakdown. See `.github/instructions/rules/concise-output-format/rule.md` - Planning Output Format Exception.

**Mode:** Agent | **Purpose:** Request → executable plan → handoff

---

## 📋 Parameters

### key *(required)*
The key identifier for this work (kebab-case format)

### user_request *(required)*
The feature request or problem to plan

### -test *(flag, optional)*
Enable post-execution validation using `.github/prompts/shared/prompt-test-validation-framework.md`

### scope *(optional)*
Explicit scope constraints (files, components, layers)

### constraints *(optional)*
Technical or business constraints

### include_suggestions *(optional)*
- `lightweight-mode` - Skip questionnaires for simple features
- `full-detail` - Use questionnaires for all features

### auto-chain *(default=`true`)*
- `true` - Automatically execute all phases end-to-end without user approval between phases (DEFAULT, RECOMMENDED)
- `false` - Wait for user approval after each phase (manual mode)
- When enabled: Executes Phase 1 → Phase 2 → ... → Phase N automatically
- Halts only for manual intervention (test validation, migration review, failures)
- User can override to manual mode by selecting Option B during plan approval

---

## Critical Rules
**LOAD:** `.github/MANDATORY.md` (3 rules enforced before all work)

**Agent-Specific:**
- All output → `.github/key-data-streams/{key}/` (never in chat)
- Show summary, not full plan content
- Validate before responding (Step 7.5)

---

## 🔍 Step -1: INITIALIZE STATE TRACKING (EXECUTE FIRST)

**Load state-tracker utility and log incoming request:**

**Algorithm:** See `.github/prompts/shared/plan-commands.md` - Command 1 (State Tracking Initialization)

**Purpose:**
- Track plan agent invocations
- Record request type (original routed from route vs. direct invocation)
- Enable timeline reconstruction across planning iterations

**Note:** If invoked directly without route, use Type "original". If routed from route.prompt, use Type "refinement".

---

## 🔍 Step 0: KEY DATA STREAM CONSULTATION (EXECUTE FIRST - ALWAYS)

**⚠️ BLOCKING REQUIREMENT**: Before ANY planning activity, you MUST consult the key data stream repository.

**Process:**
1. Load global index (`.github/key-data-streams/index.md`)
2. Search for related keys using semantic and keyword matching in `.github/key-data-streams/`
3. **CHECK FOR EXISTING PLAN FILE**: `.github/key-data-streams/{key}/{key}.plan.md`
4. **If plan exists**: Load it as source of truth, skip to Step 5 (plan update/refinement)
5. Load context for each related key (plan file, work log, status, phases)
6. If related keys found, present options to user and **HALT**
7. If no related keys, proceed to Step 0.1 (key spelling validation)

**Critical: If `{key}.plan.md` exists, treat it as authoritative source of truth:**
- Load existing plan structure
- User request becomes a refinement/update to existing plan
- Skip full plan generation (Step 4), proceed to plan update (Step 5)

**Algorithm:** See `.github/prompts/shared/key-consultation.md`

**Output format (if related keys found):**

```markdown
## 🧠 Key Consultation (≤5 bullets)
- Found: {N} related keys
- Top: {key-1} ({X}/{Y} phases, {status})
- Match: {relevance-score}
- Location: .github/key-data-streams/
- Recommendation: {Continue|New}

## 📌 Options
**A.** Use `{key-1}` (most relevant)
**B.** Create new key
**C.** Review {key-1} details

Reply: A, B, or C
```

---

## 🔍 Step 0.2: LOAD HANDOFF CONTEXT (IF PROVIDED)

If routed from the router, load the handoff context created by route.prompt.md. This preserves prior analysis and parameters and avoids rework.

**Default location:** `.github/key-data-streams/{key}/handoffs/route-to-plan.json`

**Behavior:**
- If file exists: Load and use `userRequest`, `analysis`, and any `constraints` to seed planning.
- If not present: Proceed normally.

**Notes:**
- Follows the honest handoff protocol: route prepares files; user invokes plan manually.
- Do not execute downstream agents automatically here; only read context.

---

## 🔍 Step 0.1: KEY SPELLING VALIDATION

**Validate key follows naming conventions:**
- Format: lowercase-with-hyphens (kebab-case)
- Length: 2-4 words maximum
- No typos, consistent terminology
- Matches existing related keys if extending work

**Algorithm:** See `.github/prompts/shared/key-spelling-validator.md`

**Auto-corrections:**
- `user-dash` → `user-dashboard`
- `btn-fix` → `button-fix`
- `DB-update` → `database-update`

---

## 🔍 Step 0.5: KEY DETECTION (if no key provided)

**Auto-detect active key from git history:**
1. Check recent commits for `ckpt({key}):` or `[DEBUG-WORKITEM:{key}:*]` patterns
2. Load key context from detected key
3. Present to user for confirmation

**If no active key detected:** Request key from user or generate from request keywords.

---

## 🔍 Step 1: REQUIRED READING & CONTEXT LOADING

**Load architectural context BEFORE planning:**

**Required files:**
- `Docs/Architecture.md` - System architecture overview
- `Docs/InfrastructureQuickRef.md` - Infrastructure patterns
- `Docs/TESTING_FRAMEWORK_V2_SUMMARY.md` - Testing conventions (if UI/API work)
- `.github/key-data-streams/index.md` - Active keys and relationships

**Optional (based on request):**
- `Docs/ZOOM-INTEGRATION-DOCUMENTATION.md` (if Zoom-related)
- `Docs/VISUAL_REGRESSION_TESTING.md` (if UI changes)
- `Docs/LOGGING-ENHANCEMENT-SUMMARY.md` (if logging-related)

**Algorithm:** See `.github/prompts/shared/context-loader.md`

---

## 🔍 Step 2: ANALYZE REQUEST & DETERMINE COMPLEXITY

**Extract requirements from user request:**
1. Identify affected layers (UI, API, Service, Database, SignalR)
2. Detect feature type (new feature, bug fix, refactor, optimization)
3. Estimate phase count (1-phase simple, 2-4 phases moderate, 5+ complex)
4. Identify test requirements (unit, integration, E2E, visual)
5. Detect dependencies on other keys or external systems

**Complexity scoring:**
- Simple: 1-2 layers, 1-2 phases, clear requirements
- Moderate: 2-3 layers, 3-4 phases, some unknowns
- Complex: 3+ layers, 5+ phases, architectural changes, many unknowns

**Algorithm:** See `.github/prompts/shared/request-analyzer.md`

---

## 🔍 Step 3: QUESTIONNAIRE GENERATION (if complex/moderate)

**Generate questionnaire for unknowns and ambiguities:**

**Skip questionnaire if:**
- Request is simple (1-2 phases, clear requirements)
- `include_suggestions=lightweight-mode`
- User explicitly requests to skip

**Questionnaire sections:**
1. **Open Questions** - Ambiguities in request (UX, behavior, edge cases)
2. **Drift Questions** - Potential side issues or blockers
3. **Test Strategy** - Coverage requirements, regression risks

**Algorithm:** See `.github/prompts/shared/questionnaire-generator.md`

**Output:** Save to `.github/key-data-streams/{key}/questionnaire-{timestamp}.md`

**Behavior:** **HALT** and wait for user to answer questionnaire.

---

## 🔍 Step 4: PLAN GENERATION WITH TEST-FIRST WORKFLOW

**Generate comprehensive technical plan with test-first phases:**

**Determine Directory Structure:**
```
IF total_phases > 5 OR total_tasks > 20 THEN
  use_granular_structure = true  # Create phases/, handoffs/ directories
ELSE
  use_monolithic_plan = true     # Single {key}.plan.md file
END IF
```

**Plan structure (Test-First Workflow):**
```
# {key}.plan.md

## Executive Summary
- Purpose, complexity, estimated time, priority
- Total Phases: {N}
- Total Tasks: {count}
- Estimated Duration: {total time}

## Current State Analysis
- Existing implementation, issues, constraints

## Implementation Plan

### Phase 1: {Title}
**Goal:** {one-liner}
**Dependencies:** None
**Estimated Duration:** {timeframe}
**Acceptance Criteria (MANDATORY):**
- Define 3–7 objective, testable outcomes for this phase
- Criteria must be verifiable via automated tests created in Task 1a and validated in Task 1d
- Examples: concrete UI states, API responses, file artifacts, log entries, side-effect constraints

**Tasks:**
1. **Task 1a: Create Passing Test** (test-generation.prompt.md handoff)
   - Purpose: Generate headless test for phase functionality
   - Test File: `.github/key-data-streams/{key}/tests/phase-1-test.spec.ts`
  - Coverage: {test scenarios aligned to Acceptance Criteria}
  - Acceptance Criteria Under Test: Reference the list above
   - Success Criteria: Test passes with current implementation (baseline)
   - Estimated Duration: {timeframe}
   - Handoff File: `handoffs/phase-1-test.json`

2. **Task 1b: {Implementation Task 1}** (todo.prompt.md handoff)
   - Action: {specific task description}
   - Files: {affected files}
   - Debug Marker: `[DEBUG-WORKITEM:{key}:phase-1-task-1]`
   - Success Criteria: {acceptance criteria}
   - Estimated Duration: {timeframe}
   - Handoff File: `handoffs/phase-1-todo-1.json`
   - On Completion: Auto-invoke Task 1c

3. **Task 1c: {Implementation Task 2}** (todo.prompt.md handoff)
   - Action: {specific task description}
   - Files: {affected files}
   - Debug Marker: `[DEBUG-WORKITEM:{key}:phase-1-task-2]`
   - Success Criteria: {acceptance criteria}
   - Estimated Duration: {timeframe}
   - Handoff File: `handoffs/phase-1-todo-2.json`
   - On Completion: Auto-invoke Task 1d

4. **Task 1d: Run & Fix Test**
  - Action: Execute phase-1-test.spec.ts; assert and satisfy all Phase Acceptance Criteria; make tests pass
   - Test Command: `npx playwright test tests/phase-1-test.spec.ts`
   - Success Criteria: All tests green
   - Estimated Duration: {timeframe}
   - On Success: Auto-invoke Task 1e
   - On Failure: Debug and fix until passing

5. **Task 1e: Phase Validation & Checkpoint**
   - Update work-log.md with phase completion
   - Update {key}.plan.json phase status to "complete"
   - Commit checkpoint: `ckpt({key}): Phase 1 complete`
   - **AUTO-CONTINUE:** Proceed to Phase 2

**Auto-Continue Conditions:**
- ✅ All tasks complete
- ✅ All tests passing
- ✅ Build succeeds
- ✅ Documentation updated
- ❌ HALT if: Test fails, build breaks, user intervention required

**Rollback Plan:**
- Checkpoint: `ckpt({key}): Before Phase 1`
- Rollback: `git reset --hard {checkpoint-sha}`

---

### Phase 2: {Title}
**Goal:** {one-liner}
**Dependencies:** Phase 1 must be complete
**Estimated Duration:** {timeframe}

**Tasks:**
[Same test-first structure as Phase 1]
1. Task 2a: Create Passing Test
2. Task 2b-2x: Implementation Tasks
3. Task 2y: Run & Fix Test
4. Task 2z: Phase Validation & Checkpoint
5. **AUTO-CONTINUE:** Proceed to Phase 3

---

### Phase N: {Title} (Final Phase)
**Goal:** {one-liner}
**Dependencies:** Phase N-1 must be complete
**Estimated Duration:** {timeframe}

**Tasks:**
1. Task Na: Create Passing Test
2. Task Nb-Nx: Implementation Tasks
3. Task Ny: Run & Fix Test
4. Task Nz: Phase Validation & Checkpoint
5. **Task N+1: Run KDS Cleanup** (cohesion.prompt.md v2.0)
   - Execute: `cohesion validation-level=kds-cleanup auto-fix=true`
   - Target: `.github/key-data-streams/{key}/`
   - Purpose: Validate KDS structure, archive deprecated files, organize internal prompts
   - Handoff File: Auto-invoked by task agent
   - **Note**: Replaces cleanup-copilot-mess.prompt.md (deprecated 2025-10-30)
6. **Task N+2: Mark Key Complete**
   - Update {key}.plan.json status to "complete"
   - Final commit: `complete({key}): All phases finished`

**FINAL PHASE:** No auto-continue after completion

---

## Test Strategy
- Test types required: {unit, E2E, visual}
- Test-first approach: Create test BEFORE implementation for each phase
- Test scenarios and coverage per phase
- Acceptance Criteria: Each phase MUST define acceptance criteria; tests MUST assert them (`assertCriteria: true`)
- Central Index: Maintain and consult `.github/tests/playwright-index.json` to reuse existing tests before creating new ones
- **CRITICAL**: If Playwright tests required, include:
  - Orchestration script creation in Task {N}a
  - Script path: `Scripts/run-{key}-phase-{N}-test.ps1`
  - Template reference: `.github/prompts/shared/test-orchestration-patterns.md`
  - Required pattern: Separate window + health check + try/finally cleanup
  - Prohibited: webServer config, direct npx execution, Start-Job

## Test Execution Requirements (if Playwright/Percy tests)
- **Method**: Orchestration script (MANDATORY per MANDATORY.md Rule 3)
- **Script Location**: `Scripts/run-{key}-test.ps1` (one per phase if needed)
- **Template**: `.github/prompts/shared/test-orchestration-patterns.md`
- **Launch Pattern**: Separate PowerShell window with health check polling
- **Cleanup**: Guaranteed via try/finally with Stop-Process -Force
- **References**:
  - Orchestration: `.github/prompts/shared/test-orchestration-patterns.md` (MANDATORY)
  - Test Generation: `.github/prompts/shared/playwright-test-generation.md`
  - Test Data: `.github/instructions/Links/PlaywrightQuickRef.md` (Session 212)

## Rollback Plan
- Checkpoint commits after each phase: `ckpt({key}): Phase {N} complete`
- Rollback to specific phase: `git reset --hard {phase-checkpoint-sha}`
- See `.github/prompts/shared/task-exec/checkpoint-protocol.md` for protocol
```

**Algorithm:** See `.github/prompts/shared/plan-generator.md`

**Output:** Save to `.github/key-data-streams/{key}/{key}.plan.md`

---

## 🔍 Step 4.25: GENERATE HANDOFF JSON FILES

**Purpose:** Create programmatic handoff parameters for automated task execution

**Directory Setup:**

**Algorithm:** See `.github/prompts/shared/plan-commands.md` - Command 2 (Handoffs Directory Setup)

**For Each Phase, Generate:**

### 1. Test Generation Handoff

**File:** `handoffs/phase-{N}-test.json`

**Format:**
```json
{
  "handoffType": "test-generation",
  "key": "{key}",
  "phase": {N},
  "e2eMode": true,
  "autoChainPhases": true,
  "scenario": "{test scenario description}",
  "testType": "{unit|e2e|visual}",
  "testFile": "tests/phase-{N}-test.spec.ts",
  "acceptanceCriteria": [
    "{criterion1}",
    "{criterion2}"
  ],
  "coverage": {
    "components": ["{component1}", "{component2}"],
    "interactions": ["{interaction1}", "{interaction2}"],
    "validations": ["{validation1}", "{validation2}"]
  },
  "testData": {
    "sessionId": 212,
    "assetType": "{type}",
    "user": "GitHub Copilot Test"
  },
  "orchestration": {
    "required": true,
    "scriptPath": "Scripts/run-{key}-phase-{N}-test.ps1",
    "templateRef": ".github/prompts/shared/test-orchestration-patterns.md"
  },
  "testsIndex": {
    "path": ".github/tests/playwright-index.json",
    "reuseStrategy": "prefer-index",
    "allowCreation": true
  },
  "assertCriteria": true,
  "estimatedDuration": "{timeframe}",
  "nextTask": "phase-{N}-todo-1"
}
```

**E2E Mode Fields**:
- `e2eMode`: Set to `true` for auto-execute mode (Option A), `false` for manual mode (Option B)
- `autoChainPhases`: Controls phase-to-phase auto-continuation (independent from task-level auto-chain)

### 2. Implementation Task Handoffs

**File:** `handoffs/phase-{N}-todo-{task}.json`

**Format:**
```json
{
  "handoffType": "todo",
  "key": "{key}",
  "phase": {N},
  "task": {task_number},
  "description": "{specific implementation task}",
  "files": [
    "{file1}",
    "{file2}"
  ],
  "debugMarker": "[DEBUG-WORKITEM:{key}:phase-{N}-task-{task}]",
  "acceptanceCriteria": [
    "{criterion1}",
    "{criterion2}"
  ],
  "estimatedDuration": "{timeframe}",
  "dependencies": ["{previous_task_id}"],
  "autoChain": true,
  "nextTask": "phase-{N}-todo-{next_task_number}",
  "testFile": "tests/phase-{N}-test.spec.ts"
}
```

### 3. Final Task (Last Phase Only)

**File:** `handoffs/phase-{N}-cleanup.json`

**Format:**
```json
{
  "handoffType": "cleanup",
  "key": "{key}",
  "targetFolders": ".github/key-data-streams/{key}/",
  "scope": "kds-cleanup",
  "autoApprove": true,
  "estimatedDuration": "5 minutes"
}
```

### 4. Central Playwright Test Index (Global)

To enable intelligent reuse and avoid duplicating tests, maintain a global index file of Playwright tests:

- Default path (global): `.github/tests/playwright-index.json`
- Update policy:
  - On creating or updating any phase test, add/update an entry keyed by `{key}`, `phase`, and `testFile`
  - Include `scenario`, `tags`, `acceptanceCriteria`, `assertCriteria`, and `lastUpdated`
  - Test-generation agents MUST consult the index first using `reuseStrategy: "prefer-index"`

Example entry shape:
```json
{
  "key": "{key}",
  "phase": {N},
  "testFile": ".github/key-data-streams/{key}/tests/phase-{N}-test.spec.ts",
  "scenario": "{brief}",
  "tags": ["{ui|api|visual}", "{component}", "{feature}"] ,
  "acceptanceCriteria": ["{criterion1}", "{criterion2}"],
  "assertCriteria": true,
  "lastUpdated": "2025-10-31T00:00:00Z"
}
```

**Save All Handoff Files Before User Approval:**

**Algorithm:** See `.github/prompts/shared/plan-commands.md` - Command 3 (Handoff JSON Generation Loop)

**Output:** All handoff files saved to `.github/key-data-streams/{key}/handoffs/`

---

## 🔍 Step 4.5: PLAN METADATA TRACKING

**Create tracking JSON for phase execution:**

**Format:**
```json
{
  "key": "{key}",
  "status": "planning",
  "totalPhases": 4,
  "completedPhases": 0,
  "currentPhase": 0,
  "phases": [
    {"id": 1, "title": "...", "status": "not-started", "checkpoint": null},
    {"id": 2, "title": "...", "status": "not-started", "checkpoint": null}
  ],
  "createdAt": "2025-10-27T...",
  "updatedAt": "2025-10-27T..."
}
```

**Output:** Save to `.github/key-data-streams/{key}/{key}.plan.json`

---

## 🔍 Step 5: WORK LOG INITIALIZATION

**Create work log for execution tracking:**

**Format:**
```markdown
# Work Log: {key}

## Session 1 (2025-10-27)
- **Status:** Planning
- **Phase:** 0/4
- **Activity:** Plan created, {N} phases defined
- **Files Created:** {key}.plan.md, {key}.plan.json
- **Next:** Handoff to task.prompt.md for Phase 1 execution
```

**Output:** Save to `.github/key-data-streams/{key}/work-log.md`

---

## 🔍 Step 5.5: FILE FINALIZATION VERIFICATION (BLOCKING)

**Purpose:** Ensure all key data stream files created before user output

**⚠️ BLOCKING REQUIREMENT:** Do NOT proceed to response validation or user output until ALL files verified.

**Algorithm:** See `.github/prompts/shared/file-finalization-verifier.md`

**Verification Checklist:**
1. `.github/key-data-streams/{key}/{key}.plan.md` exists
2. `.github/key-data-streams/{key}/{key}.plan.json` exists  
3. `.github/key-data-streams/{key}/work-log.md` exists
4. `.github/key-data-streams/{key}/state.json` exists (if state tracking enabled)

**Quick Verification:**
```
VerifyFileFinalization(key):
  requiredFiles = [
    ".github/key-data-streams/{key}/{key}.plan.md",
    ".github/key-data-streams/{key}/{key}.plan.json",
    ".github/key-data-streams/{key}/work-log.md"
  ]
  
  IF StateTrackingEnabled THEN
    requiredFiles.Add(".github/key-data-streams/{key}/state.json")
  END IF
  
  FOR EACH file IN requiredFiles:
    IF NOT FileExists(file) THEN
      HALT_EXECUTION()
      LOG_ERROR("File finalization incomplete: {file} missing")
      SHOW_ERROR_MESSAGE(file)  // See file-finalization-verifier.md
      RETURN FALSE
    END IF
  END FOR
  
  LOG_SUCCESS("File finalization complete: {requiredFiles.length} files verified")
  RETURN TRUE
```

**If ANY required file missing:**
- **HALT execution immediately**
- Log error with missing file path
- **DO NOT proceed to Step 6** (Handoff Preparation)
- **DO NOT proceed to Step 7.5** (Response Validation)
- **DO NOT show user output**
- Display error message (see file-finalization-verifier.md for templates)
- Request manual file creation or restart process

**If ALL files verified:**
- Log success: "File finalization complete: {count} files verified"
- Proceed to Step 6 (Handoff Preparation)

**Critical:** This step enforces "Document First, Respond Later" protocol. No user-facing output until documentation complete.

**See:** `.github/prompts/shared/file-finalization-verifier.md` for complete algorithm and error message templates

---

## 🔍 Step 6: HANDOFF PREPARATION WITH AUTOMATED JSON PARAMETERS

**Prepare automated handoffs using generated JSON files:**

**1. Log handoff to state tracking (file-based):**
- Update `.github/key-data-streams/{key}/state.json`
- Append to `promptHandoffs[]` array:
```json
{
  "timestamp": "2025-10-30T...",
  "from": "plan",
  "to": "test-generation",
  "handoffFile": "handoffs/phase-1-test.json",
  "reason": "Plan approved, creating Phase 1 test"
}
```

**2. Handoff Execution Chain:**

Instead of manual parameter construction, use generated JSON files:

```markdown
# Phase 1 Test Creation (First Task)
@workspace /test-generation #file:.github/key-data-streams/{key}/handoffs/phase-1-test.json

# Upon test creation completion, auto-chain invokes:
@workspace /todo #file:.github/key-data-streams/{key}/handoffs/phase-1-todo-1.json

# Upon task completion, auto-chain invokes:
@workspace /todo #file:.github/key-data-streams/{key}/handoffs/phase-1-todo-2.json

# Chain continues automatically until all tasks in phase complete
# Then executes test validation and phase checkpoint
# Then auto-continues to Phase 2 (unless manual mode selected)
```

**3. Auto-chain execution logic:**
```
IF user selects Option B (Manual Mode) THEN
  // Manual approval mode
  auto_chain = false
  InvokeHandoff("handoffs/phase-1-test.json", auto_chain=false)
  // Will wait for user approval after each phase
ELSE
  // DEFAULT: Auto-execute (Option A or 5s timeout)
  auto_chain = true
  InvokeHandoff("handoffs/phase-1-test.json", auto_chain=true)
  // Phases execute automatically via JSON handoff chain
  // Each JSON file includes "nextTask" parameter
  // Returns here only on completion or error
END IF
```

**4. Handoff File References:**

All handoff parameters pre-generated and saved:
- Test handoffs: `handoffs/phase-{N}-test.json`
- Implementation handoffs: `handoffs/phase-{N}-todo-{task}.json`
- Cleanup handoff: `handoffs/phase-{N}-cleanup.json` (final phase only)

**Benefits:**
- ✅ No manual parameter construction
- ✅ Consistent parameter format
- ✅ Traceable handoff chain
- ✅ Easy to modify parameters before execution
- ✅ Supports automated testing of prompt workflows

**Algorithm:** See `.github/prompts/shared/handoff-protocol.md`

---

## 🔍 Step 6.5: STANDARD "NEXT COMMAND" OUTPUT

After generating handoff files and verifying artifacts, present a single, copyable Next Command to begin Phase 1.

**Next Command:**

```
@workspace /test-generation #file:.github/key-data-streams/{key}/handoffs/phase-1-test.json
```

**What this does:**
- Creates or updates the Phase 1 test per the handoff
- Asserts the Phase 1 Acceptance Criteria (`assertCriteria: true`)
- Updates the central test index if tests are created or modified
- On completion, auto-chains to the first implementation task via `nextTask`

If manual mode is selected, still present this command but do not auto-trigger.

---

## 🔍 Step 7: INDEX MAINTENANCE

**Update global index with new key:**

**Format:**
```markdown
## Active Keys

### {key}
- **Purpose:** {one-liner from plan}
- **Status:** planning
- **Phases:** 0/4
- **Created:** 2025-10-27
- **Location:** `.github/key-data-streams/{key}/`
```

**Output:** Append to `.github/key-data-streams/index.md`

---

## � Step 7.5: Response Validation
**LOAD:** `.github/prompts/shared/output-validator.md` (enforce before all user-facing output)

**Exempt from validation:**
- Plan file contents (goes to {key}.plan.md)
- Questionnaire content (goes to questionnaire-{timestamp}.md)
- Work log entries (goes to work-log.md)

**See:** `.github/prompts/shared/loop-prevention.md` for preventing plan re-generation loops

---

## 📊 OUTPUT FORMAT (PLANNING EXCEPTION: 30-50 BULLETS)

**CRITICAL RULES:**
- ❌ **NO CODE EXAMPLES** - No implementation code, pseudocode, or code blocks in user-facing output
- ✅ **BULLET SUMMARIES ONLY** - Clear, structured bullets with headings
- ✅ **REPEAT {key} NAME** - Each section must begin by stating the key name
- ✅ **LETTER OPTIONS** - Always use A/B/C/D format for user choices
- ✅ **ARCHITECTURAL TASKS** - Phase→Task bullets describe WHAT, never HOW (no code)

**Planning Exception:** plan.prompt.md can use 30-50 bullets for detailed phase/task breakdown (vs 25 for Q&A agents). See `.github/instructions/rules/concise-output-format/rule.md`.

---

### Phase 1: After Key Consultation (if related keys found)

**Key:** `{key}` (user-specified or auto-detected)

**🧠 Key Search (≤5 bullets)**
- Found: {count} related keys in key data streams
- Top match: `{key-1}` with status {status}
- Relevance score: {score}%
- Recommendation: {Use existing | Create new}
- Reason: {brief-explanation}

**📌 Next Command** (copy-paste to continue):
```
@workspace /plan Key: {key-1}
```

⭐ **Recommended**: Use existing key `{key-1}` (reuse existing work, {score}% relevance)

**Alternative Actions**:
- Create new key: `@workspace /plan Key: {key}`
- Review details: Read `.github/key-data-streams/{key-1}/*.plan.md` first

**Behavior:** Router HALTS here - execute Next Command or alternative.

---

### Phase 2: After Questionnaire Generation (if complex/moderate)

**Key:** `{key}`

**🧠 Questions Generated (≤5 bullets)**
- Questionnaire created with {count} questions
- Saved to: `.github/key-data-streams/{key}/questionnaire-{ts}.md`
- Sections included: Open Questions, Drift Detection, Test Strategy
- Purpose: Refine plan based on your answers
- Next: Answer questions in the file, then reply "Done"

**📌 Next Steps** (follow in order):

1. Open questionnaire: `.github/key-data-streams/{key}/questionnaire-{ts}.md`
2. Answer all questions directly in that file
3. Save the file
4. Reply "Done" in chat (plan agent will process answers and finalize plan)

**Purpose**: Questionnaire refines plan based on your specific requirements

**Behavior:** Plan agent HALTS here - complete questionnaire and reply "Done" to continue.

---

### Phase 3: After Plan Generation (final output)

**Key:** `{key}`

**🧠 Plan Summary (≤5 bullets)**
- Plan finalized for key: `{key}`
- Total phases: {count} ({simple|moderate|complex} complexity)
- Files created: `{key}.plan.md`, `{key}.plan.json`, `work-log.md`
- Location: `.github/key-data-streams/{key}/`
- Ready for execution via task.prompt.md (manual or auto-chain)

**📌 Plan Overview (≤10 bullets)**
1. **Phase 1:** {phase-title} ({task-count} tasks, {file-count} files) → **AUTO-CONTINUE to Phase 2**
2. **Phase 2:** {phase-title} ({task-count} tasks, {file-count} files) → **AUTO-CONTINUE to Phase 3**
3. **Phase 3:** {phase-title} ({task-count} tasks, {file-count} files) → **FINAL PHASE**
4. **Test Strategy:** {test-types-list}
5. **Rollback:** Checkpoint commits enabled for each phase
6. **Handoff:** task.prompt.md (execution) + test-generation.prompt.md (tests)
7. **First Phase:** {phase-1-title}
8. **Estimated Scope:** {affected-layers-summary}
9. **Dependencies:** {any-dependencies-or-none}
10. **Next Step:** Auto-executing in 5 seconds (say "manual" or "cancel" to abort)

**📋 Phases & Tasks** (phase headers use bold, tasks use bullets)

**Phase 1: {Title}**
- Task 1.1: {action} - {expected-outcome}
- Task 1.2: {action} - {expected-outcome}
- Task 1.3: {action} - {expected-outcome}

**Phase 2: {Title}**
- Task 2.1: {action} - {expected-outcome}
- Task 2.2: {action} - {expected-outcome}

**Phase 3: {Title}**
- Task 3.1: {action} - {expected-outcome}
- Task 3.2: {action} - {expected-outcome}
- Task 3.3: {action} - {expected-outcome}

**⚡ Execution Mode**

**A. END-TO-END MODE** (RECOMMENDED - Auto-executes in 5s)  
   - All phases execute automatically without approval gates
   - Tests run before each phase implementation
   - Checkpoint commits created after each phase
   - Interrupt anytime with Ctrl+C
   - Best for: Refactors, compliance fixes, well-specified features

**B. MANUAL MODE** (Stop after each phase for approval)  
   - Await approval before starting each phase
   - Review test results before proceeding
   - Best for: Complex features, exploratory work, learning

**C.** Review plan files before deciding  
**D.** Modify plan scope  
**E.** Cancel planning

**Auto-executing in 5 seconds... Say "B", "manual", or "cancel" to abort.**

Reply: A (or wait 5s for auto-execute), B (manual), C, D, or E

**Behavior:** 
- **Default (no reply or A):** Set `auto-chain=true` + `e2eMode=true` in handoff JSONs → automatic E2E execution
- **If B selected:** Set `auto-chain=false` + `e2eMode=false` → wait for approval after each phase
- If C/D/E selected: Wait for user action

---

## � NEXT COMMAND (COPY AND EXECUTE)

Start Phase 1 by creating the test via the prepared handoff JSON:

```
@workspace /test-generation #file:.github/key-data-streams/{key}/handoffs/phase-1-test.json
```

What the next agent will do:
- Load the handoff JSON and honor `acceptanceCriteria` and `assertCriteria`
- Prefer reuse via `.github/tests/playwright-index.json` before creating new tests
- Run in headless mode unless the plan marks the phase as UI/visual
- On success, auto-chain to the first todo handoff in Phase 1

---

## �🚀 HANDOFF TO TASK.PROMPT.MD (After user approval)

**Handoff message:**

```markdown
## 🚀 Handoff to task.prompt.md

- Key: {key}
- Phase: 1/{total}
- Plan: .github/key-data-streams/{key}/{key}.plan.md
- Transitioning control...

---

{BEGIN TASK EXECUTION - task.prompt.md takes over}
```

**Behavior:** Load and execute `task.prompt.md` with parameters.

---

## 📝 PLAN MODIFICATION WORKFLOW

**If user chooses "B. Review Plan" or "C. Modify":**

1. User edits `.github/key-data-streams/{key}/{key}.plan.md` directly
2. User replies "Done" when modifications complete
3. Re-read plan file and update `.plan.json` metadata
4. Present updated summary and ask for approval again

**Algorithm:** See `.github/prompts/shared/plan-modifier.md`

---

## 🔄 RESUME EXISTING WORK WORKFLOW

**If user selected existing key in Step 0:**

1. Load key context (plan file, work log, phase tracking JSON)
2. Determine current phase from tracking JSON
3. Check if plan needs updates based on new request
4. Present resumption summary with current status
5. Offer to continue current phase or modify plan

**Resume output format:**

```markdown
## 🧠 Resume Work (≤5 bullets)
- Key: {key} (existing)
- Status: {status}
- Current Phase: {X}/{Y}
- Last Activity: {timestamp}
- Request: {new-request-summary}

## 📌 Next Command (copy-paste to continue current phase):
```
@workspace /task phase={X} key={key}
```

⭐ **Recommended**: Continue Phase {X} from where you left off

**Alternative Actions**:
- Modify plan: Edit `.github/key-data-streams/{key}/*.plan.md` and re-execute
- New key: `@workspace /route Key: {new-key-name}` to start fresh work

**Behavior:** Plan agent HALTS here - execute Next Command or alternative.
```

---

## 🧪 TEST STRATEGY DETERMINATION

**Determine test requirements based on affected layers:**

**UI changes:**
- ✅ Visual regression tests (Percy)
- ✅ E2E interaction tests (Playwright)
- ✅ Accessibility tests (if new components)
- ⚠️ **MANDATORY**: ALL Playwright tests require orchestration scripts

**API changes:**
- ✅ Integration tests (API endpoints)
- ✅ Unit tests (service layer)
- ✅ Contract tests (if external APIs)

**Database changes:**
- ✅ Migration tests
- ✅ Rollback validation
- ✅ Data integrity tests

**SignalR changes:**
- ✅ Real-time communication tests
- ✅ Connection/disconnection handling
- ✅ Message delivery verification
- ⚠️ **MANDATORY**: ALL SignalR tests require orchestration scripts (app must be running)

### Playwright Test Orchestration Requirements (MANDATORY)

**When plan includes ANY Playwright/Percy tests, the plan MUST include:**

1. **Orchestration Script Creation Phase**
   - Create `Scripts/run-{key}-test.ps1` using canonical template
   - Template: `.github/prompts/shared/test-orchestration-patterns.md`
   - Pattern: Cleanup → Launch (separate window) → Health Check → Test → Guaranteed Cleanup

2. **Test Strategy Documentation Must Specify:**
   ```markdown
   ## Test Execution
   - **Method**: Orchestration script (REQUIRED)
   - **Script**: `Scripts/run-{key}-test.ps1`
   - **Pattern**: Separate PowerShell window with health check polling
   - **Cleanup**: Guaranteed via try/finally with Stop-Process -Force
   - **Reference**: `.github/prompts/shared/test-orchestration-patterns.md`
   ```

3. **Plan Must Reference Required Files:**
   - `.github/prompts/shared/test-orchestration-patterns.md` - Canonical orchestration template (MANDATORY)
   - `.github/prompts/shared/playwright-test-generation.md` - Test generation patterns
   - `.github/instructions/Links/PlaywrightQuickRef.md` - Test data (Session 212)

4. **Prohibited Approaches (Mark as DEPRECATED in plan):**
   - ❌ `PW_MODE=standalone npx playwright test` (webServer config - unreliable)
   - ❌ Direct `npx playwright test` without orchestration
   - ❌ `Start-Job` for app startup
   - ❌ Manual `dotnet run` before tests

**Algorithm:** See `.github/prompts/shared/test-strategist.md`

---

## � Git Commit and Merge Hygiene (KDS-related changes)

- Use scoped, descriptive commit messages to simplify review and merging:
  - `feat(kds/plan): add phase acceptance criteria and central test index`
  - `docs(kds): update plan changelog v1.9`
  - `refactor(kds): normalize test handoff fields`
- Keep plan/prompt/KDS edits isolated to `.github/**` to reduce merge surface with application code.
- Use checkpoints for multi-file prompt updates: `ckpt(kds): after plan v1.9 updates`
- Summarize affected files and version in PR description for traceability.

## �🔀 DRIFT DETECTION & MANAGEMENT

**During planning, detect potential drift issues:**

**Drift indicators:**
- Mentions of unrelated bugs ("Also noticed X is broken")
- Blocking issues ("Can't proceed until Y is fixed")
- Side discoveries ("Found Z while investigating")

**Drift handling:**
1. Document drift issue in questionnaire
2. Assess severity (blocking, high, medium, low)
3. If blocking: Create drift key and handoff to drift.prompt.md
4. If non-blocking: Document in plan for later handling

**Algorithm:** See `.github/prompts/shared/drift-detector.md`

---

## 📋 KEY CLEANUP PHASE (After plan completion)

**When all phases complete, offer cleanup:**

**Cleanup tasks:**
1. Archive intermediate files (drafts, old questionnaires)
2. Consolidate execution logs into single work-log.md
3. Optimize test artifacts (compress screenshots, keep baselines only)
4. Update indexes (mark key as "complete")
5. Generate README.md summary for key folder
6. Target: Reduce key data stream size by >50%

**Algorithm:** See `.github/prompts/shared/cleanup-orchestrator.md`

**Cleanup output:**

```markdown
## 🧠 Cleanup (≤5 bullets)
- Key: {key} (complete)
- Size: {before-mb} MB → {after-mb} MB ({percent}% reduction)
- Archived: {count} intermediate files
- README: Generated with summary
- Status: Ready for long-term storage

## 📌 Next Command (copy-paste to archive key):
```
@workspace /archive key={key}
```

⭐ **Recommended**: Archive key for long-term storage

**Alternative Actions**:
- Keep active: No action needed, key remains in active state
- Review README: Read `.github/key-data-streams/{key}/README.md` first

**Behavior:** Cleanup complete - execute Next Command to archive or leave active.
```

---

## 🧭 KDS GOVERNANCE MODE (key = `kds`)

When planning for the KDS key (`key: kds`), include governance-specific tasks to evolve and safeguard the prompt system:

**Additional Phase 1 Tasks (KDS-only):**
1. Create `.github/prompts/shared/kds-handoff-protocol.md`
  - Define standard handoff JSON formats (route-to-*, phase-*-test.json, phase-*-todo-*.json)
  - Specify `nextTask` chaining and `autoChain` defaults (tasks=true, phases=manual by default)
  - Document the honest handoff protocol and "Next Command" UX
2. Create `.github/prompts/kds.prompt.md`
  - Governance gatekeeper for all `.github/**` and KDS changes
  - Load order: `.github/MANDATORY.md` → `kds-handoff-protocol.md` → `SelfAwareness.instructions.md` → active key context
  - Responsibilities: conflict detection, non-regression enforcement, compatibility reasoning requirement
  - Output: Always provide a single Next Command for the downstream agent; never auto-execute
3. Update governance docs as needed (e.g., add Rule 4 – manual invocation) while keeping MANDATORY.md the canonical source of truth

**Validation (KDS-only):**
- Verify prompts reference (not duplicate) canonical rules and protocol docs
- Ensure route/plan/task/todo/test-generation adhere to honest handoffs and JSON conventions
- Run coordination validators to check handoff counts, chains, and acceptance criteria presence

All KDS prompt changes must be scoped to `.github/**` and follow checkpoint commits for clean merges.

---

## 🧭 KDS GOVERNANCE MODE (key = `kds`)

When planning for the KDS key (`key: kds`), include governance-specific tasks to evolve and safeguard the prompt system:

**Additional Phase 1 Tasks (KDS-only):**
1. Create `.github/prompts/shared/kds-handoff-protocol.md`
  - Define standard handoff JSON formats (route-to-*, phase-*-test.json, phase-*-todo-*.json)
  - Specify `nextTask` chaining and `autoChain` defaults (tasks=true, phases=manual by default)
  - Document the honest handoff protocol and "Next Command" UX
2. Create `.github/prompts/kds.prompt.md`
  - Governance gatekeeper for all `.github/**` and KDS changes
  - Load order: `.github/MANDATORY.md` → `kds-handoff-protocol.md` → `SelfAwareness.instructions.md` → active key context
  - Responsibilities: conflict detection, non-regression enforcement, compatibility reasoning requirement
  - Output: Always provide a single Next Command for the downstream agent; never auto-execute
3. Update governance docs as needed (e.g., add Rule 4 – manual invocation) while keeping MANDATORY.md the canonical source of truth

**Validation (KDS-only):**
- Verify prompts reference (not duplicate) canonical rules and protocol docs
- Ensure route/plan/task/todo/test-generation adhere to honest handoffs and JSON conventions
- Run coordination validators to check handoff counts, chains, and acceptance criteria presence

All KDS prompt changes must be scoped to `.github/**` and follow checkpoint commits for clean merges.

---

## 📝 VERSION HISTORY

**1.5.0** (2025-10-28)
- **STATE TRACKING INTEGRATION**: Added state-tracker.ps1 integration for request/handoff logging
- **Step -1**: New step to initialize state tracking and log incoming request
- **Handoff Logging**: Log handoff to task.prompt.md with Update-StateHandoff
- **Metadata**: Added `stateTracking: enabled` to frontmatter
- Enables timeline reconstruction and cross-prompt coordination tracking

**1.4.0** (2025-10-27)
- **CONCISE MANDATE COMPLIANCE**: Removed all FUNCTION pseudocode blocks
- All algorithms moved to `.github/prompts/shared/*.md` files
- Output format reduced to max 15 bullets with letter-based options
- Removed nested lists and verbose examples
- All plan content goes to {key}.plan.md, not shown in chat

**1.3.0** (2025-10-27)
- Enhanced key data stream consultation with relationship tracking
- Added cleanup phase for completed keys
- Improved test strategy determination

**1.2.0** (2025-10-26)
- Added questionnaire generation for complex features
- Key spelling validation integration
- Drift detection during planning

**1.1.0** (2025-10-25)
- Multi-phase planning support
- Phase tracking JSON metadata
- Work log initialization

**1.0.0** (2025-10-24)
- Initial implementation
- Basic plan generation workflow
