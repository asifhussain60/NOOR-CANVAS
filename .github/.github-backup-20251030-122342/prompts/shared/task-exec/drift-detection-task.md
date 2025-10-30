# Drift Detection Protocol (Task Execution)

**Purpose:** Auto-detect and register unrelated issues during task execution for post-completion resolution

**Referenced by:** task.prompt.md (embedded throughout Steps 2-8)

**Scope:** Task-specific drift detection (complements plan.prompt.md drift detection during planning phase)

---

## Detection Triggers

### Context Gathering (Step 2)
- File errors unrelated to current task (missing imports, broken references)
- Test failures in unrelated test suites
- Configuration mismatches discovered during validation
- Architecture violations found during Step 2.8 analysis

### Execution Phase (Step 5)
- Dead code or unused imports in modified files
- Security vulnerabilities in code paths
- Performance bottlenecks unrelated to current work
- Documentation inconsistencies discovered during implementation

### Validation Phase (Step 6)
- Unexpected test failures in unrelated tests
- Build warnings in other modules
- Integration issues outside current scope

---

## Auto-Registration Algorithm

```javascript
FUNCTION TaskDetectDrift(currentKey, issue, phase, severity)
  
  // Check if issue blocks current task
  IF severity == "critical" THEN
    HALT_TASK()
    PRESENT_USER_CHOICE(
      options: [
        "Fix now (switches to drift key)",
        "Continue anyway (risky)",
        "Abort task (rollback to checkpoint)"
      ]
    )
    AWAIT_USER_DECISION()
  END IF
  
  // For non-critical issues, register silently
  IF IsUnrelatedToCurrentTask(issue, currentKey) THEN
    driftKey = GenerateDriftKey(issue)
    
    RegisterDrift(
      parentKey: currentKey,
      driftKey: driftKey,
      description: issue,
      severity: severity,
      mode: "auto",
      triggeredBy: "task.prompt.md",
      phase: phase  // "context-gathering" | "execution" | "validation"
    )
    
    LogToWorkLog("🔍 Drift detected: {driftKey} (severity: {severity}, phase: {phase})")
    CONTINUE_TASK()
  END IF
  
END FUNCTION
```

---

## Critical Drift Blocking

**Trigger:** When `severity=critical`, execution **MUST HALT** until user decides

**Presentation Format:**

```
⚠️ CRITICAL ISSUE DETECTED (blocks task execution)

Issue: {description}
Severity: CRITICAL
Detected in: {phase}

This issue may affect task success. Choose one:
1️⃣ Fix now (pause current task, switch to drift resolution)
2️⃣ Continue anyway (risky - may cause failures)
3️⃣ Abort task (rollback to checkpoint from Step 1)

Your choice (1/2/3):
```

**User Choice Handling:**

1. **Fix now:**
   - Register drift with `mode: "user-critical"`
   - Pause current task (save state to work-log.md)
   - Switch to drift key
   - Resume parent after resolution

2. **Continue anyway:**
   - Register drift with `mode: "auto-deferred"`
   - Log warning in work-log.md
   - Proceed with task
   - Add note in Step 8 work-log summary

3. **Abort task:**
   - Rollback using checkpoint from Step 1
   - Present drift as standalone work item
   - Exit task execution

---

## Severity Classification

| Severity | Examples | Action |
|----------|----------|--------|
| **critical** | Build-breaking errors, null reference risks, security holes | HALT required - user choice |
| **high** | Failing tests, broken integrations, performance degradation | Register, log, continue |
| **medium** | Code smells, documentation gaps, minor bugs | Register silently |
| **low** | Formatting issues, unused code | Register silently |
| **informational** | Suggestions, observations | Register silently |

---

## Drift Commit Format

```
drift({parent-key}): Register {drift-key} - {one-line-description}

Mode: auto | user-critical | auto-deferred
Severity: {level}
Triggered by: task.prompt.md
Phase: {context-gathering|execution|validation}

Parent Key: {parent-key}
Drift Key: {drift-key}
```

**Example:**

```
drift(key-108): Register key-108-drift-001 - Missing null check in SessionService.GetById

Mode: auto
Severity: high
Triggered by: task.prompt.md
Phase: execution

Parent Key: key-108
Drift Key: key-108-drift-001
```

---

## Silent Logging

**During Task** (no chat interruption):

1. **Append to `{key}.plan.md` (if exists):**
   ```markdown
   ## Drift Items Detected During Execution
   
   - 🔍 key-108-drift-001: Missing null check in SessionService.GetById (severity: high, phase: execution)
   - 🔍 key-108-drift-002: Unused import in SessionCanvas.razor (severity: low, phase: validation)
   ```

2. **Append to `work-log.md`:**
   ```markdown
   ## Drift Detection Log
   
   ### key-108-drift-001
   - **Detected At**: 2025-10-29T14:23:15Z
   - **Phase**: execution
   - **Severity**: high
   - **Description**: Missing null check in SessionService.GetById (line 42)
   - **Context**: While implementing delete confirmation, noticed GetById can return null but callers don't handle it
   - **Impact**: Potential NullReferenceException in production
   - **Suggested Fix**: Add null coalescing or guard clause
   ```

---

## At Step 9 Completion

**Present drift summary with severity-sorted list:**

```
✅ Task {key} completed

📊 Drift Items Detected (3):

HIGH Priority:
- key-108-drift-001: Missing null check in SessionService.GetById

MEDIUM Priority:
- key-108-drift-002: Documentation outdated in SessionCanvas.razor
- key-108-drift-003: Code smell in DeleteQuestion method (too many params)

LOW Priority:
- key-108-drift-004: Unused import in SessionCanvas.razor

Options:
1️⃣ Create keys for high-priority items (recommended)
2️⃣ Defer all to backlog
3️⃣ Ignore (not recommended for HIGH severity)

Your choice:
```

**User decides resolution order or defers all**

---

## Integration Points

**Step 2 (Context Gathering):**
- Check for unrelated errors during file analysis
- Detect architecture violations in Step 2.8
- Register drift for mismatched configurations

**Step 5 (Execution):**
- Monitor code quality during implementation
- Detect security issues in modified files
- Flag performance bottlenecks

**Step 6 (Validation):**
- Track unexpected test failures
- Monitor build warnings in other modules
- Detect integration issues

**Step 8 (Work-Log):**
- Summarize all drift items
- Present severity-sorted list
- Append to work-log.md

**Step 9 (Completion):**
- Present drift summary with options
- Create keys for user-selected items
- Update backlog for deferred items
