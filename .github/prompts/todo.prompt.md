---
mode: agent
description: Extend or modify current active work while preserving context, key, and execution flow (todo item workflow)
---

# Todo — Extend Current Work with Same Key

**⚠️ LOAD FIRST:** `.github/MANDATORY.md` (Enforce: No code in chat | Document first | Playwright orchestration)

---

## 🛡️ Step -1: KDS Governance Enforcement

**BEFORE processing any request, check:**

IF user request contains modifications to `.github/prompts/*.md` OR `.github/instructions/*.md`:
  - **HALT execution immediately**
  - Display enforcement message below
  - **STOP** (do not proceed to Step 0+)

**⚠️ GOVERNANCE ENFORCEMENT**

Changes to `.github` prompts/instructions must go through the KDS gatekeeper for compatibility analysis.

**Please use this command instead:**

```markdown
@workspace /kds request="[your change request here]"
```

**Why?** Ensures compatibility checks, prevents rule conflicts, and maintains architectural coherence.

**See:** `.github/prompts/kds.prompt.md` for governance protocol.

---

ELSE: Proceed to todo workflow

---

**Version**: 3.0.0  
**Purpose**: Extend or modify the current active work request while preserving context, key, and execution flow. Renamed from continue.prompt.md to better reflect "todo item" workflow pattern.

**Rename Note**: Previously `continue.prompt.md` (v1.0.0). Renamed to `todo.prompt.md` (v2.0.0) on 2025-10-25 to align with todo-based workflow terminology. All agent references updated accordingly.

**Changelog**:
- **v3.0.0 (2025-10-31)**: RULE #1 COMPLIANCE - Extracted all pseudocode to `shared/todo-algorithms.md`. Removed FUNCTION blocks (ClassifyWorkComplexity, GenerateDriftSummary, ValidateDriftCommitFormat, EnforceQueueLimit, CalculateDriftDepth). Algorithm references replace inline pseudocode.
- **v2.3.0 (2025-10-29)**: FILE FINALIZATION VERIFICATION - Added work-log.md append verification in Execution section. Enforces "Document First, Respond Later" protocol. Verifies file size increased (append occurred). HALT if unchanged. References file-finalization-verifier.md.
- **v2.2.0 (2025-10-28)**: STATE TRACKING INTEGRATION - Added state-tracker.ps1 integration for request/handoff/commit logging. Added Step -1 for state tracking initialization. Enables timeline reconstruction.
- **v2.1.0 (2025-10-27)**: Added `from-build` parameter to prevent dual approval gates when invoked from build.prompt.md. Approval behavior now conditional based on source agent.

---

## Critical Rules
**LOAD:** `.github/MANDATORY.md` (3 rules enforced before all work)

**Agent-Specific:**
- Preserve current key from git history
- Extend plan, don't replace
- Auto-execute after 5s unless "review"/"cancel" (skipped if from-build=true)

## Parameters

### key *(auto-detected from git history)*
Current active work key. Auto-detected from recent commits.

### -test *(flag, optional)*
Enable post-execution validation using `.github/prompts/shared/prompt-test-validation-framework.md`

**Behavior:**
1. Execute todo workflow normally (preserve key, extend plan, execute tasks)
2. After completion, run validation checks specific to todo.prompt.md
3. Generate validation report with quality score (0-100)
4. If violations or missed requirements: generate recommendations
5. Present findings to user

**Todo-Specific Validation Checks:**
- ✓ Key preserved from recent work (not creating new key unnecessarily)
- ✓ Context extended (not replaced) - plan file version incremented
- ✓ Routing classification correct (recommend /plan for complex work)
- ✓ Commit checkpoints maintained (ckpt: messages in git log)
- ✓ Work log updated with extension
- ✓ Auto-chain execution if enabled

**See:** `.github/prompts/shared/prompt-test-validation-framework.md` for complete validation algorithm

### auto-chain *(default=`false`)*
Enable automatic task-to-task execution without user intervention
- `true` - Auto-invoke next task after current completes
- `false` - Wait for user approval between tasks

### from-build *(default=`false`, internal)*
Indicates handoff from build.prompt.md
- `true` - Skip 5s auto-execute countdown (build already showed approval)
- `false` - Use normal 5s auto-execute behavior
- **Note:** This parameter is automatically set by build.prompt.md and should not be manually specified

### task-id *(optional)*
Specific task ID to execute from plan
- If specified, execute only that task
- If omitted, execute all tasks sequentially
- Used with auto-chain for unassisted execution

## Input
Additional work requests + optional modifications to current plan

## Key Strategy
- **Always preserve current key** from most recent work
- **Multi-task extensions**: `{current-key}-ext1`, `{current-key}-ext2` if needed
- **Expand shortcuts** via UserDictionary.md

---

## Execution Steps

### Step -1: Initialize State Tracking (EXECUTE FIRST)

**Load state-tracker utility and log incoming request:**

**See:** `.github/prompts/shared/test-examples.md` - State Tracker Integration section

**Purpose:**
- Track todo agent invocations and work continuations
- Record continuation requests vs. original requests
- Enable timeline reconstruction for extended work sessions

---

## Context Detection
1. **Find current key** from recent git commits (ckpt messages)
2. **Load current plan** from `.github/key-data-streams/{key}/{key}.plan.md` (authoritative source of truth)
3. **Check execution status** from recent commits and file changes
4. **Identify completion state** of current phases

## Mode Detection (Auto-Select Best Workflow)

When invoked, determine optimal workflow:

### If Active Key Detected

**Step 1: Run Drift Detection** (MANDATORY)
- Load drift detection algorithm: `.github/prompts/shared/drift-detection-algorithm.md`
- Execute classification on request + active key context
- Calculate drift confidence: HIGH / MEDIUM / LOW

**Step 2: Handle Drift Detection Results**

**IF HIGH confidence drift detected:**
- **HALT** execution immediately
- Present drift creation options
- Require explicit user decision with 4 options (A/B/C/D)
- Format: See original prompt for drift detection message format

**IF MEDIUM confidence drift detected:**
- **RECOMMEND** drift creation
- Show detected signals
- Allow override with default to extension after 10s
- User can reply "drift" to create or "continue" to proceed

**IF LOW confidence / Extension confirmed:**
- **PROCEED** with extension workflow below

**Step 3: Execute Extension Workflow** (if drift not detected or user chose option B/D)
- **EXTEND** existing work (primary todo.prompt.md behavior)
- Load existing plan and context
- Append new phases or modify existing ones
- Preserve execution continuity

### If NO Active Key Detected
Classify work complexity:

**Algorithm:** See `shared/todo-algorithms.md` - Algorithm 1: Classify Work Complexity

**Simple Work** (1-2 phases, clear scope, single layer):
- Create lightweight plan in continue
- Auto-execute after 5s
- Examples: button resize, text change, single config update

**Complex Work** (multi-phase, multi-layer, architectural):
- **RECOMMEND** comprehensive planning with `/plan` command
- Examples: UI redesign, new features, database migrations, SignalR changes
- User can override with "proceed anyway" to use lightweight mode

## Routing Classification

Classify work type → include specialized prompts:

**Always Include:**
- `task.prompt.md` - Core execution engine

**Conditional Includes:**
- **Tests Required** → `test-generation.prompt.md`
  - New features, UI changes, API endpoints, database schema
  - Triggers: keywords (test, e2e, Percy, Playwright, visual regression)
  - ⚠️ **MANDATORY**: If Playwright tests, must create orchestration script
  - Template: `.github/prompts/shared/test-orchestration-patterns.md`
  
- **Architecture Changes** → `plan.prompt.md` (recommend upgrade)
  - Multi-layer changes, new services, SignalR hubs
  - Triggers: keywords (architecture, refactor, redesign, migration)
  
- **Quality Focus** → `healthcheck.prompt.md`
  - Code quality, prompt optimization, system validation
  - Triggers: keywords (quality, lint, optimize, validate, audit)
  
- **Drift Detected** → `drift.prompt.md`
  - Unrelated issues discovered during work
  - Auto-trigger when tangent/blocker found

### Test Orchestration Requirements (if Playwright/Percy tests)

**When todo includes ANY Playwright/Percy test work:**

1. **MUST create orchestration script**: `Scripts/run-{key}-test.ps1`
2. **MUST use canonical template**: `.github/prompts/shared/test-orchestration-patterns.md`
3. **MUST include in plan extension** with 3 tasks (create script, configure, verify)

4. **PROHIBITED approaches (mark as deprecated)**:
   - ❌ `PW_MODE=standalone npx playwright test`
   - ❌ Direct `npx playwright test`
   - ❌ `Start-Job` for app startup
   - ❌ Manual `dotnet run` before tests

## Plan Extension Structure
Update existing `{key}.plan.md` with:
- **New phases** appended to current plan
- **Modified phases** if existing work needs changes
- **Exit criteria** updated for extended scope
- **Error remediation** plan updated

## Output (STRICT - 20 BULLETS MAX)

**CRITICAL RULES:**
- ❌ **NO CODE EXAMPLES** - No implementation code, pseudocode, or code blocks in user-facing output
- ✅ **BULLET SUMMARIES ONLY** - Clear, structured bullets with headings
- ✅ **REPEAT {key} NAME** - Each section must begin by stating the key name
- ✅ **LETTER OPTIONS** - Always use A/B/C/D format for user choices

**Planning Exception:** When extending multi-phase plans, todo.prompt.md uses up to 20 bullets (vs 25 for standard agents). See `.github/instructions/rules/concise-output-format/rule.md`.

---

### For Simple Work (No Active Key)

**Key:** `{generated-key}` (auto-generated from request)

**🧠 Analysis (≤5 bullets)**
- Detected complexity: SIMPLE (lightweight mode suitable)
- Key assigned: `{generated-key}`
- Routing to: task.prompt.md + {conditional-prompts}
- Total phases: {1-2}
- Execution: Auto-execute after 5s unless cancelled

**📌 Summary (≤10 bullets)**
1. Work: {one-line-description}
2. Mode: Lightweight (quick execution without comprehensive planning)
3. Phases: {phase-list-brief}
4. Files affected: {count} files
5. Tests required: {yes/no}
6. Timeline: {estimated-duration}
7. Impact: {scope-description}
8. Rollback: Checkpoint commits enabled
9. Auto-execute: 5 seconds (say "cancel" to abort)
10. Next: Execute or upgrade to full planning

**⚡ Options**
**A.** Execute now (auto-starts in 5s)  
**B.** Upgrade to `/plan` for comprehensive planning  
**C.** Modify scope  
**D.** Cancel

Reply: A, B, C, or D (or wait 5s for auto-execute)

---

### For Complex Work (Recommendation)

**Key:** `{suggested-key}` (recommended for comprehensive planning)

**🧠 Analysis (≤5 bullets)**
- Detected complexity: COMPLEX (comprehensive planning recommended)
- Reason: {multi-layer|phases>2|architectural-impact|UI-redesign}
- Suggested key: `{suggested-key}`
- Recommendation: Use `/plan` for better structure and testing
- Override option: Available if you prefer lightweight mode

**📌 Summary (≤10 bullets)**
1. Work: {one-line-description}
2. Complexity reason: {detailed-reason}
3. Why `/plan` recommended: {benefits-list}
4. Phases estimated: {count} phases
5. Files affected: {count} files across {layers}
6. Testing scope: {test-types-needed}
7. Risk if lightweight: {potential-issues}
8. Override available: Say "proceed anyway" to continue
9. Alternative: Use `/plan key={suggested-key}` for comprehensive approach
10. Next: Choose planning approach

**⚡ Options**
**A.** Use `/plan` (recommended for complex work)  
**B.** Proceed anyway with lightweight mode  
**C.** Cancel

Reply: A, B, or C

---

### For Extension (Active Key)

**Key:** `{current-key}` (detected from git history)

**🧠 Analysis (≤5 bullets)**
- Current key detected: `{current-key}`
- Current phase: {N} of {total} ({phase-name})
- Extension scope: {description}
- Routing to: {prompts-list}
- Integration: {how-fits-with-current-work}

**📌 Summary (≤10 bullets)**
1. Key: `{current-key}` | Extension: {description}
2. Current status: Phase {N} of {total}
3. Extension work: {new-work-description}
4. New phases to add: {count} phases
5. Additional files: {count} files
6. Integration approach: {how-extension-integrates}
7. Impact on existing work: {changes-needed}
8. Testing additions: {additional-tests}
9. Estimated timeline: {duration}
10. Next: Execute extension or review plan

**⚡ Options**
**A.** Execute extension now  
**B.** Review extended plan first  
**C.** Modify extension scope  
**D.** Start fresh with new key

Reply: A, B, C, or D

## 🎯 What Would You Like To Do Next?

**Current Key**: `{current-key}`

**Execute Extension:**
- If from-build=true: Say "proceed" to execute (no 5s countdown)
- If from-build=false: Say "proceed" or wait 5s for auto-execution

**Continue Without Extension:**
- Use: `@workspace /todo {additional-work}` (Auto-detects key from git history)

**Modify Plan:**
- Use: `@workspace /plan {modification-description}` (Auto-detects key, updates plan version)

**Cancel:**
- If from-build=true: Say "cancel" to abort
- If from-build=false: Say "cancel" or "review" within 5s

## Execution
- **Preserve execution context** - Continue from current phase
- **NO approval needed** between existing phases
- **MANDATORY**: Create git commit after EVERY new phase (see checkpoint protocol)
- **Checkpoint creation**: LOAD MODULE `.github/prompts/shared/task-exec/checkpoint-protocol.md`
- **Commit format**: `ckpt({key}): Phase {N} - {extension-summary}`
- **State tracking**: Log all commits with Update-StateCommit after each checkpoint
- **Auto-execute behavior:**
  - **If `from-build=true`**: Require explicit "proceed" (build already showed approval)
  - **If `from-build=false`**: Auto-execute after 5s unless "review"/"cancel"
- **FILE FINALIZATION VERIFICATION** (MANDATORY before response validation):
  - Algorithm: See `.github/prompts/shared/file-finalization-verifier.md`
  - Verify work-log.md appended (file size increased)
  - Check state.json updated (if state tracking enabled)
  - HALT if work-log.md size unchanged
- **RESPONSE VALIDATION** (MANDATORY after file finalization):
  - Validate all responses using `.github/prompts/shared/output-validator.md`
  - Auto-fix violations (bullet consolidation, list flattening) when possible
  - BLOCK response if critical violations cannot be fixed
  - See loop-prevention.md for auto-chain depth limits

**After each checkpoint commit:**
- Update state with commit SHA, message, phase, checkpoint type

## Context Preservation
- **Keep existing plan structure** intact
- **Append new phases** with proper numbering
- **Update completion criteria** to include extensions
- **Maintain checkpoint commit pattern**
- **Preserve work-log and documentation**

## Error Handling
- **If no current key detected**: Ask user to specify or create new handoff
- **If plan not found**: Reconstruct from git history or start fresh
- **If work completed**: Create new phases for post-completion work
- **If conflicts detected**: Present resolution options

## Integration Points
- **Current phase completion**: Ensure current work finishes before extension
- **Dependency management**: Identify if extension depends on current work
- **Testing integration**: Merge new tests with existing test plan
- **Documentation updates**: Extend existing summaries and logs

---

## Drift Detection and Handoff (MANDATORY)

### On Work Completion
When current key's work is completed:

1. **Check Drift Stack**
   - Query git history for drift registrations: `git log --grep="drift({current-key})"`
   - Parse drift keys from commit messages (both auto and manual modes)
   - Identify unresolved drifts (no matching `ckpt({drift-key}): Resolved`)
   - Extract severity levels from drift commit messages

2. **If Drifts Exist**
   - **DO NOT PROCEED** with new work
   - **PRESENT** comprehensive drift summary to user
   - **FORMAT** (severity-sorted) with 4 options (A/B/C/D)
   - **WAIT** for user choice before invoking drift resolution

3. **Drift Resolution Workflow**
   - **User selects "A" (Critical Only)**: Filter by severity=critical, invoke plan.prompt.md for each
   - **User selects "B" (All Drifts)**: Process in severity order (critical → high → medium → low)
   - **User selects "C" (Specific Drifts)**: Parse user-provided drift keys, process selected
   - **User selects "D" (Defer)**: Mark complete, preserve drift queue in work-log.md

4. **If No Drifts**
   - Mark current key complete
   - Present normal completion summary
   - Ready for new work or extensions

### Drift Summary Algorithm

**Algorithm:** See `shared/todo-algorithms.md` - Algorithm 2: Generate Drift Summary

**Purpose:** Query all registered drifts for parent key, filter resolved, enforce queue limits

### Unified Commit Format Validation

**Drift Registration Commit**:
```
drift({parent-key}): Register {drift-key} - {one-line-description}
Mode: auto | manual | user-critical | auto-deferred
Severity: critical | high | medium | low | informational
Triggered by: plan.prompt.md | task.prompt.md | test-generation.prompt.md | healthcheck.prompt.md | user
Phase: {phase-name} (optional - for auto mode only)
```

**Drift Resolution Commit**:
```
ckpt({drift-key}): Resolved - {summary}
Parent: {parent-key} | Remaining: {count} drifts
```

**Validation Rules**:
1. Drift key must be kebab-case, lowercase
2. Severity must be one of 5 valid levels
3. Mode must be one of 4 valid modes
4. Parent key must exist in git history
5. Description required (max 100 chars)

**Algorithm:** See `shared/todo-algorithms.md` - Algorithm 3: Validate Drift Commit Format

### Queue Overflow Protection

**Max Auto-Detected Drifts**: 10 per parent key

**Algorithm:** See `shared/todo-algorithms.md` - Algorithm 4: Enforce Queue Limit

**Manual Drifts**: Not subject to 10 drift limit (user explicitly registered)

**Queue Overflow Warning**: Display when at 9/10 drifts with low-priority drift recommendations

### Drift Stack Query
```bash
# Find all drifts for current key
git log --grep="drift({current-key})" --format="%h %s %b"

# Check if drift resolved
git log --grep="ckpt({drift-key}): Resolved" --format="%h %s"

# Count remaining drifts by severity
git log --grep="drift({current-key})" --grep="Severity: critical" --format="%h"

# Get drift details (mode, severity, triggered by)
git log --grep="drift({current-key})" --format="%h %s %b" | grep -E "Mode:|Severity:|Triggered by:"
```

### Handoff Integration
- **todo.prompt.md** → detects completion + generates comprehensive drift summary
- **plan.prompt.md** → creates drift resolution plan
- **task.prompt.md** → executes drift resolution with auto-detection
- **drift.prompt.md** → manages stack, context, commits, validation

### Auto-Commit on Drift Resolution
**MANDATORY** commit after each drift resolved:
```
ckpt({drift-key}): Resolved - {summary}
Parent: {parent-key} | Remaining: {count} drifts
Severity: {original-severity} | Mode: {original-mode}
```

### Stack Depth Enforcement
- **Max depth: 3 levels** (parent → drift → sub-drift → sub-sub-drift)
- Block new drifts if depth > 3
- Force resolution of deepest drift first
- Present overflow warning to user

**Algorithm:** See `shared/todo-algorithms.md` - Algorithm 5: Calculate Drift Depth

## Auto-Chain Protocol (if auto-chain=true)

**Trigger:** `auto-chain` parameter = `true`

**Purpose:** Enable unassisted task-to-task execution without manual approval between tasks

**Workflow:**
- Verify current task completed successfully
- Load task list from current key
- Calculate next task ID
- If more tasks exist: Auto-invoke next task with feedback
- If all complete: Display completion message with next steps

**Integration with execute-plan.ps1:**
- When todo.prompt.md invoked via execute-plan.ps1, auto-chain is enabled by default
- User can Ctrl+C at any time to halt auto-chain
- Errors halt auto-chain automatically with rollback options

## Success Criteria
- Current key preserved and continued
- Existing work context maintained
- New work properly integrated into plan
- Execution continues seamlessly
- All phases properly numbered and sequenced
- **Comprehensive drift summary generated on completion**
- **Severity-sorted presentation (critical → high → medium → low)**
- **Queue overflow protection enforced (max 10 auto drifts)**
- **Unified commit format validated**
- **User choice handling for drift resolution**
- **Pending drifts handed off to plan.prompt.md**
- **Auto-commits created for drift resolutions**
- **Stack depth enforced (max 3)**
