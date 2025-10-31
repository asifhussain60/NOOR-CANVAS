---
mode: agent
description: Canonical execution engine that breaks down requests, validates outcomes, maintains audit trails through progressive key data stream updates
---

<!-- Metadata (non-frontmatter, lint-safe) -->
> purpose: Execute planned work, validate outcomes, update key data stream progressively
> inputs: key, tasks, -test, github-branch, commit-checkpoints, auto-chain, phase, debug-level, verbosity
> outputs: phase execution results, checkpoints, updated work-log and artifacts
> lastUpdated: 2025-10-31
> version: 2.0
> changelog: v2.0 (2025-10-31) - RULE #1 COMPLIANCE - Extracted workflows to shared/task-algorithms.md (Branch Verification, Document First Checkpoint, Plan Validation Gate). Removed IF...THEN pseudocode blocks. Algorithm references replace inline code.
> stateTracking: enabled
> acceptsFrom: [plan]
> calls: [test-generation]

# task.prompt.md (Execution Agent)

**⚠️ LOAD FIRST:** `.github/MANDATORY.md` (Enforce: No code in chat | Document first | Playwright orchestration)

## Output Format
**LOAD:** `.github/MANDATORY.md` (Rule 1: output format, 15 bullets, no code)

**Structure:** 🧠 Analysis (≤5 bullets), 📌 Summary (≤10 bullets), 📊 Final (status)

---

## See Also
- `.github/prompts/shared/validation-engine.md`
- `.github/prompts/shared/integration-protocol.md`

## Parameters
See `.github/prompts/shared/task-parameters-reference.md`

### key *(required)*
Task identifier

### -test *(flag, optional)*
Enable post-execution validation using `.github/prompts/shared/prompt-test-validation-framework.md`

**Behavior:**
1. Execute task workflow normally (implement features, create files, commit checkpoints)
2. After completion, run validation checks specific to task.prompt.md
3. Generate validation report with quality score (0-100)
4. If violations (especially critical like database access rules): auto-generate improvement plan and handoff to plan.prompt.md
5. Present findings and actionable next steps to user

**Task-Specific Validation Checks:**
- ✓ Commit checkpoints created after phase completion (ckpt: messages in git log)
- ✓ Work log updated during execution
- ✓ Database access rules enforced (canvas.* READ-WRITE, dbo.* READ-ONLY)
- ✓ Branch compliance (development branch only)
- ✓ Test generation for UI/API changes (.spec.ts files created)
- ✓ Required reading consultation (Architecture.md, InfrastructureQuickRef.md for architectural changes)
- ✓ No code in user-facing output (CONCISE-MANDATE compliance)
- ✓ Output format compliance (🧠/📌/📊 structure)
- ✓ Max 15 bullets per response

**See:** `.github/prompts/shared/prompt-test-validation-framework.md` for complete validation algorithm

### debug-level *(default=`none`)*
`none` | `simple` | `trace` | `diagnostic` | `cleanup` | `doc`

### verbosity *(default=`concise`)*
`concise` | `detailed` (NO code in either)

### tasks *(optional)*
Sequential subtasks. `"mark complete"` triggers Step 9.

### github-branch *(default=`development`)*
Target branch per SelfAwareness.instructions.md

### commit-checkpoints *(default=`true`)*
Create git commit after each task completion (MANDATORY)
See: `.github/prompts/shared/commit-checkpoint-protocol.md`

### auto-chain *(default=`true`)*
Enable automatic phase-to-phase execution without user intervention
- `true` - Auto-invoke next phase after current completes (DEFAULT)
- `false` - Wait for user approval between phases (manual mode)
- Passed from plan.prompt.md (user can override with Option B)

### phase *(optional)*
Specific phase number to execute (used with auto-chain)
- If specified, execute only that phase from plan
- If omitted, execute all tasks sequentially

---

## Purpose & Usage

### What
Canonical execution engine that breaks down requests, validates outcomes, maintains audit trails through progressive key data stream updates, ensures information freshness through git-linked traceability.

### When to Use
- Feature Implementation (UI components, API endpoints, services, database migrations)
- Bug Fixes (across any layer)
- Incremental Work (multi-step tasks with continuous documentation)
- Task Completion (`tasks: mark complete` for comprehensive cross-layer documentation)
- Work Resumption (continue previously completed tasks)
- **Continuous Work** (use "Adding to previous key data stream," to auto-detect and continue recent work)

### How to Invoke

**Via Plan Agent Handoff** (Recommended for complex work):
Plan agent creates comprehensive plan → user approves → plan agent automatically invokes task agent

**Direct Invocation** (For simple tasks):
```
@workspace /task key=hcp tasks="Fix hadees token removal in SessionCanvas"
@workspace /task key=canvas tasks="Add share button\n---\nCreate Playwright test"
@workspace /task key=hcp tasks="mark complete"
@workspace Adding to previous key data stream, fix the submit button styling
```

**Note:** When message starts with "Adding to previous key data stream,", the agent automatically detects the most recently modified key from git history and continues work on that key.

### Expected Outcomes
- ✅ User request recorded in key data stream (succinct summary before work begins)
- ✅ High-priority constraints detected (ALL CAPS emphasis from user request)
- ✅ Incremental documentation (key data stream updated after EVERY sub-task)
- ✅ Git-linked traceability (full SHA commit hashes recorded)
- ✅ Checkpoint tags (every task creates searchable git tag with 28-tag history per key)
- ✅ Automatic test creation (Playwright tests generated for UI changes)
- ✅ Mandatory lint validation (ALL modified files pass syntax checks before commit)
- ✅ High-priority constraint verification (ALL CAPS constraints verified before completion)
- ✅ Clean build (zero errors, zero warnings - mandatory)
- ✅ Comprehensive completion (cross-layer documentation when "mark complete")
- ✅ Concise user output (full details in work-log.md)
- ✅ Iterative approval refinement (up to 3 re-evaluations for evolving requirements)

---

## Core Mandates

### Global Operating Guardrails
**ALWAYS** follow `.github/instructions/SelfAwareness.instructions.md` for all operating guardrails, file organization, runtime rules, and Roslynator integration.

### 🗄️ Database Access Rules (MANDATORY)

**LOAD MODULE:** `.github/prompts/shared/task-exec/database-access-rules.md`

**Quick Reference:**
- PRIMARY DATABASE: KSESSIONS_DEV
- ✅ `canvas.*` - READ/WRITE allowed
- ❌ All other schemas - **READ-ONLY**
- **VIOLATION = IMMEDIATE ROLLBACK**

### Architectural Reference Documentation

**Core References** (consult as needed based on task):
- **SystemIndex.md** - Central navigation hub
- **Architecture.md** - Full system design
- **InfrastructureQuickRef.md** ⭐ **MANDATORY for database operations**
- **PlaywrightQuickRef.md** ⭐ **MANDATORY for test creation**
- **ValidationFramework.md** - Standard 6-level validation pipeline

### Workflow Requirements
- Always begin with **checkpoint commit** for rollback safety
- **Always verify key data stream BEFORE planning** (prevent duplicate work)
- **Always update key data stream AFTER execution** (maintain continuity)
- Ensure analyzers, linters, tests remain clean after every operation
- Build must complete with **zero errors and zero warnings**

### Commit and Tagging Conventions (MANDATORY)

**LOAD MODULE:** `.github/prompts/shared/task-exec/checkpoint-protocol.md`

**Quick Reference:**
- Types: `ckpt`, `task`, `test`, `hc`, `doc`, `meta`
- Format: `{type}({key}): {summary} [sha={short}] [parent={short}]`
- Git Tag: `key-{key}-ckpt-{yyyyMMdd-HHmm}-{short}`
- Rollback Index: Update `.github/key-data-streams/{key}/rollback-index.md`

### UI/UX Execution Requirements (apply when redesign/layout/styling is in scope)
- Preserve existing visual identity (theme, colors, typography) unless explicitly authorized to change
- Apply modern UI principles inspired by Material Design, Fluent UI, or Tailwind spacing/scale best practices
- Ensure responsive behavior at mobile, tablet, and desktop breakpoints; avoid horizontal scroll on mobile for primary content
- Accessibility: implement keyboard navigation, visible focus states, ARIA landmarks/roles, and respect reduced motion preferences
- Usability: optimize button placement, spacing, and content flow; use semantic HTML and clear hierarchy
- Maintainability: align with existing CSS/utilities and component conventions; avoid duplication and regressions in shared styles

---

## Integration with Other Agents

### Called By
- **plan.prompt.md** (Planning Orchestrator) - Receives comprehensive execution plans
- **Direct user invocation** - For simple tasks without planning

### Calls (Orchestrates)
- **test-generation.prompt.md** - Automatic test generation for UI changes (Step 6.1)
- **healthcheck.prompt.md** - Post-implementation validation (recommended but manual)

### When to Use
- **Use plan.prompt.md first** if: Complex multi-phase implementation (3+ phases), need comprehensive test plan, requirements unclear, significant architecture changes
- **Use task.prompt.md directly** if: Simple well-defined task (1-2 steps), already have clear plan, quick fix, continuing existing work, bug fixes with known solution

---

## Plan Integration Protocol

**See**: [Agent Handoff Protocol](shared/agent-handoff-protocol.md) for complete handoff specification

**WHEN invoked with `key` parameter:**

1. **ALWAYS check for comprehensive plan first**: `.github/key-data-streams/{key}/{key}.plan.md`
2. **If plan exists:**
   - ✅ Load complete phase details from plan
   - ✅ Load JSON tracking data from plan.json
   - ✅ Use plan's technology stack analysis
   - ✅ Follow plan's test specifications
   - ✅ Update plan's JSON tracking after each phase
   - ✅ Report phase completion with progress tracking
3. **If plan missing:**
   - ⚠️ Warn user: "No comprehensive plan found. Consider running @workspace /feature first for complex multi-phase work."
   - Use lightweight planning
   - Generate simple work plan and proceed

---

## Execution Steps

**See:** `shared/execution-flow.md` for complete visual flow diagram

### Step -1: Initialize State Tracking (EXECUTE FIRST)

**See:** `.github/prompts/shared/test-examples.md` - State Tracker Integration section

**Purpose:** Track task execution invocations, record execution requests, enable commit tracking

---

### Step 0: Branch Verification (MANDATORY)

**LOAD MODULE:** `.github/prompts/shared/step-0-branch-verification.md`

⚠️ **ALWAYS verify you're in the correct branch before starting any work.**

**Algorithm:** See `shared/task-algorithms.md` - Algorithm 1: Branch Strategy Verification

**Branch Strategy:**
- **`master`** - Production only (PROTECTED - deploy target)
- **`development`** - ALL development work (DEFAULT)

**Enforcement:**
- ⚠️ **ABORT** if on `master` branch (unless github-branch explicitly set to `master`)
- ✅ **PROCEED** if current branch matches github-branch parameter
- ⚠️ **PROMPT** user if mismatch detected (allow override with warning)

---

### Step 0.5: Previous Key Data Stream Continuation Protocol (CONDITIONAL)

**Trigger Phrase:** User message starts with `"Adding to previous key data stream,"`

**Purpose:** Seamlessly continue work on the most recently modified key without requiring explicit key parameter.

**Detection & Resolution:**
1. Scan recent git commits for key data stream modifications
2. Identify most recent key from file path
3. Auto-populate key parameter
4. Inform user of detected key

**Validation:**
- If NO recent key modifications found → Request explicit key from user
- If MULTIPLE keys modified in last commit → Use most recent timestamp
- If ambiguous → Present options to user for selection

---

### Step 0.5.5: Recovery Detection (CONDITIONAL)

**Trigger:** ALWAYS when `key` parameter is resolved (Step 0.5 or Step 2.1)

**Purpose:** Detect interrupted workflows and offer seamless recovery from last checkpoint

**Detection:**
1. Load plan.json and check for interruptedAt field
2. If exists, present recovery option with phase/step details
3. User can resume, start over, or cancel

**Recovery Workflow:**
1. Load checkpoint tag from last successful phase
2. Resume from interrupted phase
3. Skip completed tasks
4. Execute remaining tasks
5. Clear interruptedAt on completion

---

### Step 0.25: Key Folder Existence Validation (MANDATORY)

**Trigger:** ALWAYS when `key` parameter is provided or auto-detected

**Purpose:** Verify key data stream infrastructure exists before proceeding

**Validation:**
1. Check if key folder exists: `.github/key-data-streams/{key}/`
2. If NOT exists → HALT with error message directing user to run planning agent first
3. If exists → Check for plan.md (use comprehensive plan if found, otherwise lightweight)

---

### Step 1: Checkpoint Commit (MANDATORY)

Create checkpoint commit for rollback capability with git tag and rollback index update.

**Log checkpoint to state tracking** after commit creation.

This ensures rollback capability if the task introduces instability.

---

## Auto-Drift Detection (MANDATORY)

**LOAD MODULE:** `.github/prompts/shared/task-exec/drift-detection-task.md`

Automatically detect and register unrelated issues during task execution (Steps 2, 5, 6) for post-completion resolution.

**Detection Triggers:** Context gathering, execution phase, validation phase  
**Critical Blocking:** Severity=critical requires user choice (fix/continue/abort)

---

### Step 2: Context Gathering (MANDATORY - Multi-Phase)

**LOAD MODULE:** `.github/prompts/shared/task-exec/context-gathering-protocol.md`

Build comprehensive context before planning through conditional, intelligent sub-phases.

**Always Execute:** 2.1 (Key Resolution + High-Priority Constraints), 2.2 (Key Data Stream Query), 2.3 (Auto-Load Files)  
**Conditional:** 2.4-2.12 (based on task type - errors, framework validation, UI debugging, architecture analysis, etc.)

**Critical Guardrails:**
- Token budget protection (>50,000 tokens → HALT)
- Circular dependency detection → HALT
- Phase timeout (>5 minutes → warn and proceed)

**Key Feature:** Step 2.8.7 validates complete CRUD data lifecycle (UI → API → DB → Broadcast → UI)

---

### Step 2.5: Document First Checkpoint (MANDATORY)

**LOAD MODULE:** `.github/prompts/shared/step-2-5-document-first-checkpoint.md`

**Purpose:** Update key documentation BEFORE any code implementation

**Trigger:** ALWAYS when `key` parameter exists

**Algorithm:** See `shared/task-algorithms.md` - Algorithm 2: Document First Checkpoint

**Guardrail:** Code commits WITHOUT prior documentation updates = VIOLATION

---

### Step 3: Plan

**Execution Context Detection:**

**A. Phase-Driven Planning** (when comprehensive plan exists):
1. Load plan document and JSON tracking
2. Parse tasks parameter for phase identifiers
3. For each phase, load from plan: objectives, context, implementation tasks, validation checklist, test specification, orchestration script, debug markers, commit format, approval gate
4. Skip lightweight planning
5. Proceed to Step 4 with loaded phase details

**B. Lightweight Planning** (no plan exists):
1. Use verified/inferred key from Step 2
2. Incorporate architecture analysis
3. **MANDATORY for CRUD:** Verify complete data lifecycle documented
4. **HIGH-PRIORITY Constraints:** Include dedicated section for ALL CAPS constraints
5. Parse parameters
6. **Detect completion keywords:** If tasks contains "mark complete", prepare Step 9
7. **Detect documentation mode:** If debug-level: doc, prepare documentation instead of code
8. Generate simple work plan

**Plan Structure (Lightweight Mode):**
- Primary Objective
- HIGH-PRIORITY Constraints (with verification method)
- Subtasks
- Verification Checklist

---

### Step 3.5: Plan Validation Gate (MANDATORY)

**LOAD MODULE:** `.github/prompts/shared/step-3-5-plan-validation-gate.md`

**Purpose:** Write plan to file BEFORE user approval (enforces plan-as-document)

**Trigger:** ALWAYS when lightweight planning used (Step 3B)

**Algorithm:** See `shared/task-algorithms.md` - Algorithm 3: Plan Validation Gate

**Guardrail:** No approval prompt WITHOUT plan file existing

---

### Step 3.6: Commit Message Planning and Parent Linkage (MANDATORY)

Before implementation commits, prepare the commit subject to include rollback metadata and lineage:

- Determine parent = latest checkpoint short SHA
- Use format: `{type}({key}): {summary} [sha={short}] [parent={short}]`
- Types: `task` for implementation; `test` for generated tests; `hc` for healthcheck-driven doc updates

---

### Step 4: Approval (MANDATORY)

**Purpose:** Iterative approval gate with re-evaluation support for additional requirements.

**Workflow:**

1. **Present Generated Plan** to user for confirmation
2. **Parse User Response:**
   - **Explicit Approval** (proceed to Step 5): `"yes"`, `"proceed"`, `"approved"`, etc. (ONLY approval keywords, no additional requests)
   - **Additional Requirements** (loop back to Step 3): Any response containing new instructions/modifications
   - **Rejection** (halt): `"no"`, `"cancel"`, `"stop"`

3. **Re-Evaluation Loop** (if additional requirements detected):
   - Append requirements to context
   - Return to Step 3 for re-planning
   - Present updated plan with change summary
   - **Iteration Limit:** Max 3 re-evaluations
   - **Loop Termination:** Only proceed on explicit approval without new requirements

4. **⚠️ Early Warning:** If Step 2.8.7 detected INCOMPLETE data lifecycle, show warning about missing persistence/broadcast

5. **Halt Conditions:** Rejection response, max iterations reached, explicit "Pending Approval" request

---

### Step 5: Execute

**Determine execution mode based on debug-level parameter and plan existence.**

#### 5a. Documentation Mode (`debug-level: doc`)
Skip code execution, generate implementation documentation, skip to Step 8

#### 5b. Phase-Driven Execution (when plan.md exists)
Execute phases from plan with validation checklists, debug markers, commit formats, update JSON tracking, wait for approval between phases

#### 5c. Lightweight Execution (no plan exists)
Execute subtasks in sequence, halt on failure, insert debug logging, apply architecture analysis

#### 5d. Production Migration Generation (Database Changes Detected)

**LOAD MODULE:** `.github/prompts/shared/task-exec/migration-generation-protocol.md`

**Trigger:** When phase involves database schema changes

**Detection Signals:** ALTER TABLE, CREATE TABLE, DROP TABLE, CREATE INDEX, etc.

**Generation Protocol:**
1. Extract migration details from plan
2. Generate migration ID (YYYYMMDD-HHMMSS format)
3. Create forward migration script with safety checks, idempotent operations, transaction wrapping
4. Create rollback script with reverse operations
5. Document in work log
6. Commit migration scripts

**Critical Rules:**
- ALWAYS generate both forward + rollback scripts
- ALWAYS use idempotent checks (IF NOT EXISTS / IF EXISTS)
- ALWAYS validate database name (DB_NAME() = 'KSESSIONS')
- ALWAYS wrap in transactions
- ALWAYS track in MigrationHistory

**Validation Gate (MANDATORY after every code change):**
1. Build Validation (dotnet build, zero errors/warnings)
2. Evidence Re-Collection (for UI bugs, re-run diagnostics)
3. Incremental Progress Check
4. Halt on Failure
5. Auto-Escalation after repeated failures

---

### Step 6: Validate

- Execute Standard Validation Pipeline per `ValidationFramework.md`
- Apply validation shortcuts for task agent (Levels 1-5, Level 6 if structural)
- Record validation results in key data stream
- **Automatic Rollback:** If validation fails after 3 attempts, execute rollback script

#### 6.1. Automatic Playwright Test Creation (UI Tasks)

**For tasks involving UI changes, delegate to test-generation.prompt.md.**

**Delegation Protocol:**
1. Detect if task involves UI changes
2. Invoke test-generation.prompt.md with parameters (key, feature, scenario, endpoints, tokens, testType)
3. Receive generated test files and orchestration script
4. **AUTOMATIC:** test-generation.prompt.md updates test registry
5. Verify registry updated in commit

**See:** `test-generation.prompt.md`, `.github/prompts/shared/playwright-test-generation.md`, `.github/prompts/shared/test-orchestration-patterns.md`

**Skip test creation if:** Backend-only task, documentation/configuration only, user requests --no-tests

---

#### 6.2. Mandatory Lint Validation (ALL Modified Files)

**LOAD MODULE:** `.github/prompts/shared/task-exec/ui-execution-requirements.md` (Section: Mandatory Lint Validation)

**CRITICAL:** MANDATORY before any commit. Lint failures BLOCK commit creation.

**Linters by Type:** C# (Roslynator), JS/TS (ESLint), CSS (Stylelint), PowerShell (PSScriptAnalyzer), JSON (syntax + Prettier)

#### 6.3. High-Priority Constraint Verification

**LOAD MODULE:** `.github/prompts/shared/task-exec/ui-execution-requirements.md` (Section: High-Priority Constraint Verification)

**CRITICAL:** Verify ALL CAPS constraints from user request before marking work complete.

**Violation Protocol:** HALT → Rollback → Return to Step 3 for re-planning

---

### Step 7: Confirm

**LOAD MODULE:** `.github/prompts/shared/task-exec/validation-and-response.md`

Provide summary based on verbosity parameter (concise/detailed).

**BLOCKER VALIDATION:** Ensure documentation completeness - work-log.md must contain all required sections.

**Summary Includes:** Status, work done, files modified, debug logging, tests, build, lint validation, high-priority constraints, approval iterations, checkpoint

---

### Step 8: Update Key Data Stream (MANDATORY)

**LOAD MODULE:** `.github/prompts/shared/task-exec/completion-workflow.md`

**CRITICAL:** ALL task completions MUST update the key data stream.

**Key Steps:**
- **8.0:** Auto-Chain Protocol (if auto-chain=true)
- **8.1:** Update JSON Tracking (if plan exists)
- **8.2:** Key Data Stream Bloat Detection
- **8.3:** Key Data Stream Update Requirements (COMPREHENSIVE DOCUMENTATION)
- **8.25:** File Finalization Verification (BLOCKING - verify work-log.md updated)
- **8.6:** Response Validation (MANDATORY - CONCISE-MANDATE enforcement)
- **8.5:** Checkpoint Commit & Tag (MANDATORY - create git tag)

**Guardrail:** Lock detection - HALT if lock file exists

---

### Step 9: Completion Workflow *(Conditional: When tasks = "mark complete")*

**LOAD MODULE:** `.github/prompts/shared/task-exec/completion-workflow.md` (Section: Step 9)

**Triggered when:** User specifies `tasks = "mark complete"` or `tasks = "completed"`

**Workflow:**
- **9.1:** Obsolete Information Removal & Debug Cleanup
- **9.2:** Test Promotion & Cleanup
- **9.3:** State Management & Completion
- **9.4:** Resumption Protocol

---

## Guardrails

- **ALWAYS verify branch strategy BEFORE any work** (Step 0)
- **ALWAYS update documentation BEFORE code changes** (Step 2.5)
- **ALWAYS write plan to file BEFORE approval** (Step 3.5)
- **ALWAYS check for comprehensive plan first** (if key provided)
- **ALWAYS load System Context Pack** (if plan exists)
- **ALWAYS update JSON tracking** (if plan.json exists)
- **ALWAYS query key data stream before planning** (Step 2)
- **ALWAYS record user request in key data stream**
- **ALWAYS detect high-priority constraints** (ALL CAPS)
- **ALWAYS execute Data Lifecycle Validation for CRUD** (Step 2.8.7)
- **ALWAYS run mandatory lint validation before commit** (Step 6.2)
- **ALWAYS verify high-priority constraints** (Step 6.3)
- **ALWAYS update key data stream after execution** (Step 8.3)
- **ALWAYS create checkpoint commit and git tag** (Step 8.5)
- **ALWAYS execute completion workflow when tasks = "mark complete"** (Step 9)
- **NEVER execute on master branch** unless explicitly authorized
- **NEVER skip documentation updates** when key exists
- **NEVER show plan only in chat** - must exist as file
- **NEVER implement UI-only mutations** - complete data lifecycle required
- **NEVER skip persistence validation**
- **NEVER proceed past Step 4 if user response contains additional requirements**
- **NEVER commit with lint failures**
- **NEVER violate high-priority constraints**
- Never modify functionality unless explicitly required
- Always ensure architectural and structural integrity
- Always pause and request clarification if uncertain
- Maintain alignment across all agents

---

## Clean Exit Guarantee

**See:** `.github/prompts/shared/clean-exit-guarantee.md` for complete exit criteria and failure protocols.

---

## Lifecycle

- Default state: `in-progress`
- Tasks transition to `complete` when user provides `tasks = "mark complete"`
- **Completion triggers Step 9** - comprehensive documentation and cleanup
- **Completed keys can be reopened** - new tasks automatically revert to `in-progress`
- **Resumption preserves history**
- Keys in `key-data-streams` remain **single source of truth**

---

## Lessons Learned Integration

**See:** `.github/learning/task-agent-lessons.md` for historical lessons learned from task agent failures, prevention patterns, and validation strategies.

**Key Lesson Applied:** Question Deletion Bug (Lesson 1)
- Step 2.8.7 validates complete CRUD data lifecycle
- Step 4 approval shows early warning for incomplete implementations
- Playwright tests require persistence validation with page refresh

---

## Diagnostic Mode Details

**See:** `.github/prompts/shared/debug-logging-mandate.md` for complete diagnostic mode patterns, marker formats, and use cases.
