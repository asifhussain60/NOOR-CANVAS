# drift.prompt.md (Drift Management Agent v1.3)

---
mode: agent
purpose: Manage dynamic, multi-threaded workflows using key-linked drift system for issue isolation and resolution (supports dual-mode: agent auto-detection + user manual invocation)
inputs: parent_key, drift_trigger, drift_description, stack_state, mode (auto|manual), severity (critical|high|medium|low|informational), -test
outputs: Drift key registration, stack management, context preservation, auto-commit checkpoints, drift summary at completion
lastUpdated: 2025-10-28
stateTracking: enabled
---

# drift.prompt.md (Drift Management)

**Mode:** Agent | **Purpose:** Multi-threaded workflow management via drift stack (dual-mode support)

**Version:** 1.3.0  
**Changelog:**
- **v1.3.0 (2025-10-28)**: STATE TRACKING INTEGRATION - Added state-tracker.ps1 integration with Update-StateDriftKey for automatic drift key tracking in parent state.json

## Parameters

### -test *(flag, optional)*
Enable post-execution validation using `.github/prompts/shared/prompt-test-validation-framework.md`

**Behavior:**
1. Execute drift workflow normally (create drift key, manage stack, resolve issue)
2. After completion, run validation checks specific to drift.prompt.md
3. Generate validation report with quality score (0-100)
4. If violations or stack issues: generate recommendations
5. Present findings to user

**Example:**
```bash
@workspace /drift key=main-task -test description="Fix database connection timeout"
@workspace /drift key=ui-refresh -test severity=high "Button alignment issue"
```

---

## See Also
- `.github/prompts/shared/validation-engine.md`
- `.github/prompts/shared/integration-protocol.md`

**Drift-Specific Validation Checks:**
- ✓ Drift key created with "drift-" prefix
- ✓ Parent key preserved and referenced
- ✓ Stack depth within limit (max 3 levels)
- ✓ Severity classification documented
- ✓ Commit checkpoints for drift resolution
- ✓ Drift summary generated at completion
- ✓ Parent key context restored after drift resolution

**Validation Report Example:**
```markdown
📊 Drift Validation Report

Quality Score: 80/100 (Good)

✅ Critical: 0 violations
⚠️ Medium: 1 issue
  - Stack depth at 3 (limit reached, no more drifts allowed)
  
🔍 Recommendations:
  - Resolve current drift before creating new ones
  - Consider simplifying parent task to reduce drift frequency

What would you like to do next?
A. Continue with drift resolution
B. Review stack depth and simplify workflow
C. Return to parent key
D. Accept findings and proceed
```

**See:** `.github/prompts/shared/prompt-test-validation-framework.md` for complete validation algorithm

## Critical Rules (see `.github/prompts/shared/CONCISE-MANDATE.md`)
1. **MAX 15 bullets** per response
2. **NO code blocks** - Use brief pseudocode only
3. **NO nested lists** - Flat bullets only
4. **Auto-commit** at each drift resolution
5. **Max stack depth: 3** levels
6. **Severity levels**: critical, high, medium, low, informational
7. **Queue limit**: Max 10 auto-detected drifts per parent key
8. **Always preserve parent key context**

## Dual-Mode Operation

### Agent Auto-Detection Mode (Silent, Non-Blocking)
- **Triggered by**: plan, task, test-generation, healthcheck prompts
- **Behavior**: Silent registration, no user interruption
- **Queue**: Up to 10 auto-detected drifts per parent key
- **Resolution**: Queued for post-completion (via todo.prompt.md)
- **User Awareness**: Drift summary presented at completion

### User Manual Invocation Mode (Explicit, Interactive)
- **Triggered by**: User executes `@workspace /drift key:{parent} description:{issue}`
- **Behavior**: Interactive confirmation, user chooses: work now or defer
- **Queue**: No limit for manual drifts
- **Resolution**: Immediate or queued per user choice
- **User Awareness**: Full prompt interaction

## Severity Levels

**critical** - Blocks parent workflow completion (e.g., build-breaking bug, data corruption risk)
**high** - Significant issue, should resolve before parent completion
**medium** - Notable issue, can defer to post-completion queue
**low** - Minor issue, optional resolution
**informational** - Observation only, no action required

**Auto-Classification Rules**:
```
IF issue contains "build error|compilation failed|syntax error" THEN
  severity = "critical"
ELSE IF issue contains "test failure|regression|breaking change" THEN
  severity = "high"
ELSE IF issue contains "deprecated|code smell|refactor needed" THEN
  severity = "medium"
ELSE IF issue contains "typo|formatting|minor bug" THEN
  severity = "low"
ELSE
  severity = "informational"
END IF
```

## Core Behavior

### 1. Primary Key Context
- Every workflow tracked under unique **key** (e.g., `key-main`, `key-session42`)
- All reasoning/output/context bound to active key
- Key acts as **anchor** for all drifts and stack operations

### 2. Drift Creation (Dual-Mode)

**Agent Auto-Detection** (silent, non-blocking):
When agent detects unrelated issue during work:
- **Create drift key** with automatic naming: `drift-{topic-or-timestamp}`
- **Classify severity** using auto-classification rules
- **Register silently** via commit (no user interruption)
- **Track in parent state.json**:
  ```powershell
  Update-StateDriftKey -ParentKey $parent_key -DriftKey $drift_key -Severity $severity -Description $drift_description
  ```
- **Queue for resolution** after parent completion
- **Log to work-log.md**: "🔍 Drift detected: {drift-key} (severity: {level})"
- **Continue parent work** without blocking

**User Manual Invocation** (interactive):
User executes: `@workspace /drift key:{parent} description:{issue} [severity:{level}]`
- **Create drift key** from description or user-provided
- **Classify severity** (user-specified or auto-classified)
- **Track in parent state.json**:
  ```powershell
  Update-StateDriftKey -ParentKey $parent_key -DriftKey $drift_key -Severity $severity -Description $drift_description
  ```
- **Present confirmation**:
  ```
  Drift: {drift-key}
  Parent: {parent-key}
  Severity: {level}
  
  A. Work on drift now
  B. Queue for post-completion
  C. Cancel
  ```
- **Register based on user choice**

**Naming Rules** (both modes):
- If NO key provided → `drift-{topic-or-timestamp}`
- If key provided WITHOUT "drift-" prefix → `drift-{providedKey}`
- If key ALREADY has "drift-" → keep as-is

### 3. Drift Stack Management
- Maintain **stack of max 3 levels**
- Each drift knows its **parent key**
- Track **drift count per parent** (max 10 auto-detected)
- Resolution workflow:
  - **Auto-commit** drift resolution
  - **Pop previous key** from stack
  - **Resume parent context** with full continuity
  - **Repeat** until stack empty

### 4. Queue Overflow Protection

**Max Auto-Detected Drifts**: 10 per parent key

**Overflow Detection**:
```
autoDriftCount = CountAutoDrifts(parentKey)

IF autoDriftCount >= 10 THEN
  LogWarning("⚠️ Drift queue full for {parentKey}")
  
  PRESENT_USER_CHOICE:
    A. Pause work and review drift queue now
    B. Increase limit to 20 (one-time override)
    C. Stop auto-detection for this key
    D. Continue (ignore new drifts, risk accepted)
  
  BASED_ON_CHOICE:
    IF choice == A THEN PauseWork(), ShowDriftQueue()
    IF choice == B THEN IncreaseLimitOnce()
    IF choice == C THEN DisableAutoDrift(parentKey)
    IF choice == D THEN ContinueWork(), IgnoreNewDrifts()
END IF
```

**Manual Drifts**: No limit (user explicitly invokes)

### 5. Context Integrity (Always Aware Of)
- **Active key** (current context)
- **Drift stack state** (pending keys above/below)
- **Drift count per parent** (track auto-detected vs manual)
- **Key lineage** (parent-child relationships)
- **Restoration rules** when switching contexts

### Completion Handling & Drift Summary
When all drifts resolved and stack empty:
- **Mark original key complete**
- **Generate comprehensive drift summary** (see format below)
- **Create completion checkpoint commit**

### Drift Summary Format (3-Column Layout)

```markdown
## 🔍 Drift Summary for {parent-key}

**Total Drifts**: {count} ({auto} auto-detected, {manual} manual)
**Resolution Time**: {duration}

### Resolved Drifts

| Drift Key | Severity | Triggered By | Status |
|-----------|----------|--------------|--------|
| drift-spelling-fix | low | auto | ✅ Resolved |
| drift-test-flakiness | high | auto | ✅ Resolved |  
| drift-accessibility | medium | manual | ✅ Resolved |

### Remaining Drifts (Deferred)

| Drift Key | Severity | Reason | Defer Until |
|-----------|----------|--------|-------------|
| drift-refactor-db | medium | Out of scope | Post-v1.0 |

### Impact Analysis

**Files Modified**: {count}
**Tests Added**: {count}
**Commits Created**: {count}
```

**Drift Summary Format**:
```markdown
## 📋 Drift Summary for {parent-key}

**Total Drifts Detected**: {count}

**By Severity**:
- Critical: {count}
- High: {count}
- Medium: {count}
- Low: {count}
- Informational: {count}

**By Source**:
- plan.prompt.md: {count}
- task.prompt.md: {count}
- test-generation.prompt.md: {count}
- healthcheck.prompt.md: {count}
- user (manual): {count}

**By Status**:
- Resolved: {count}
- Queued: {count}
- Deferred: {count}

**Unresolved Drifts** (if any):
1. {drift-key-1} (severity: {level}, source: {agent}) - {description}
2. {drift-key-2} (severity: {level}, source: {agent}) - {description}
...

**Resolved Drifts**:
1. {drift-key-1} (severity: {level}) - {description} ✅
2. {drift-key-2} (severity: {level}) - {description} ✅
...
```

## Integration with todo.prompt.md

### Drift Queue Detection
When `todo.prompt.md` completes current work:
1. **Check drift stack** for pending drifts
2. **If drifts exist** → hand off to `plan.prompt.md`
3. **Plan creates** execution plan for oldest unresolved drift
4. **Execute drift** → auto-commit → pop stack
5. **Repeat** until stack empty

### Handoff Command Format
```
@workspace /plan key:{drift-key} parent:{parent-key} stack-depth:{N}
Resume drift: {drift-description}
```

## Commit Protocol (MANDATORY)

### Drift Registration Commit (Auto-Detection)
```
drift({parent-key}): Register {drift-key} - {one-line-description}
Mode: auto | Severity: {critical|high|medium|low|informational}
Triggered by: {plan|task|test-generation|healthcheck}.prompt.md
Phase: {current-phase-if-applicable}
```

### Drift Registration Commit (Manual Invocation)
```
drift({parent-key}): Register {drift-key} - {one-line-description}
Mode: manual | Severity: {user-specified or auto-classified}
Triggered by: user
Context: {user-provided-context}
```

### Drift Resolution Commit
```
ckpt({drift-key}): Resolved - {one-line-summary}
Parent: {parent-key} | Remaining: {count} drifts
Severity: {level} | Mode: {auto|manual}
```

**After drift resolution commit:**
```powershell
# Mark drift as resolved in parent state.json
Update-StateDriftKey -ParentKey $parent_key -DriftKey $drift_key -Resolved $true

# Log the resolution commit
Update-StateCommit -Key $drift_key -Sha (git rev-parse --short HEAD) -Message "ckpt({drift-key}): Resolved - {summary}" -CheckpointType "drift-resolution"
```

### Stack Empty Commit
```
ckpt({original-key}): All drifts resolved - workflow complete
Drift chain: {drift-1} → {drift-2} → {drift-3}
```

## Output Format (STRICT)

### Drift Registration
🧠 Analysis (≤5 bullets):
- Parent key, drift trigger, severity, mode (auto/manual), stack depth

📌 Summary (≤10 bullets):
1. Drift: {drift-key} | Parent: {parent-key}
2. Mode: {auto|manual} | Severity: {level}
3. Triggered by: {agent|user}
4. Stack: {current-depth}/{max-depth} | Queue: {count}/{limit}
5. Context: Preserved via {mechanism}
6. Auto-commit: {yes/no}
7. Lineage: {parent} → {current-drift}
8. Resolution: {planned-approach}
9. Impact: {how-affects-parent}
10. Timeline: {estimated-effort}

📊 Final:
- Status | Drift Key | Parent | Severity | Mode | Next

## 🎯 What Would You Like To Do Next?

**Current Drift Key**: `{drift-key}`  
**Parent Key**: `{parent-key}`

**A.** Execute Drift Now  
**B.** Queue for Post-Completion  
**C.** Review Drift Queue  
**D.** Cancel Drift Registration

### Drift Resolution
🧠 Analysis (≤5 bullets):
- Drift resolved, outcome, severity addressed, stack pop, parent resume

📌 Summary (≤10 bullets):
1. Resolved: {drift-key} (severity: {level}, mode: {auto|manual})
2. Outcome: {what-was-fixed}
3. Commit: {commit-hash}
4. Stack: Popped to {parent-key}
5. Remaining: {count} drifts in queue
6. Next Drift: {next-drift-key or "none"}
7. Context: Restored to {parent-context}
8. Files: {count} modified
9. Tests: {passed/failed}
10. Impact: {how-resolution-helps-parent}

📊 Final:
- Status | Resolved Drift | Parent Key | Remaining | Next

## 🎯 What Would You Like To Do Next?

**Resolved Drift**: `{drift-key}`  
**Parent Key**: `{parent-key}`  
**Remaining Drifts**: `{count}`

**A.** Resume Parent Work (auto-resumes {parent-key})  
**B.** Review Drift Queue ({count} remaining)  
**C.** Resolve Next Drift  
**D.** Mark Parent Complete (accept drift risk)

## Stack Depth Enforcement

### Max Depth: 3 Levels
```
main-key
  └── drift-issue-1
        └── drift-bugfix
              └── drift-schema-fix ← MAX DEPTH REACHED
```

### Overflow Handling
If depth > 3:
- **Block new drift creation**
- **Force resolution** of deepest drift first
- **Present warning** to user
- **Suggest consolidation** if pattern detected

## Future Enhancements (DEFERRED)

### Priority Levels (Not Implemented Yet)
- `critical` - Blocks parent workflow
- `blocking` - Must resolve before parent completion
- `informational` - Optional/deferred resolution

### Timestamps (Not Implemented Yet)
- Drift creation time
- Resolution time
- Total drift duration

### Context Memory Limits (Not Implemented Yet)
- Archive old drifts after N days
- Summarize resolved drift chains
- Prune stack history

## Example Workflow

```
1. Start: key-main
   │
2. Detect schema issue → drift-database-schema
   │ (Push key-main to stack)
   │
3. While fixing schema, detect bug → drift-bugfix-1
   │ (Push drift-database-schema to stack)
   │
4. Resolve bug
   │ → Auto-commit: ckpt(drift-bugfix-1): Resolved
   │ → Pop to drift-database-schema
   │
5. Finish schema fix
   │ → Auto-commit: ckpt(drift-database-schema): Resolved
   │ → Pop to key-main
   │
6. Main workflow resumes
   │ → Final commit: ckpt(key-main): Complete
   │ → Drift summary generated
```

## Error Handling

### Stack Corruption
- Detect via lineage validation
- Reconstruct from git commit history
- Present recovery options to user

### Missing Parent Key
- Search git history for parent context
- Ask user to specify parent if not found
- Option to create orphan drift (no parent)

### Circular Dependencies
- Detect via lineage graph analysis
- Block creation of circular drift
- Suggest alternative drift structure

## Success Criteria
- Drift keys properly named and registered
- Stack maintains parent-child relationships
- Auto-commits created at each resolution
- Context preserved across drift switches
- All drifts resolved before parent completion
- Clean handoff between continue/plan/drift agents