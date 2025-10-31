# Build Validation Gate Algorithm

**Rule:** #14 (Build State Validation)  
**Used by:** task.prompt.md, todo.prompt.md, plan.prompt.md, test-generation.prompt.md  
**Purpose:** Ensure application is left in built state with zero errors  
**Version:** 1.0.0

---

## Algorithm: ValidateBuildState

**Trigger Points:**
- After task completion (before final output)
- After phase completion (before phase handoff)
- Before git commit
- Before handoff to next task

**Input:**
- None (runs in current workspace)

**Output:**
- buildSuccess: boolean
- errorCount: number
- warningCount: number
- buildOutput: string

**Process:**

### Step 1: Execute Build Command

Run dotnet build with no incremental compilation:

```
Command: dotnet build --no-incremental
Cwd: {workspaceRoot}
Timeout: 120 seconds
```

### Step 2: Parse Build Output

Extract metrics from build output:
- Exit code (0 = success, non-zero = failure)
- Error count (must be 0)
- Warning count (acceptable, informational only)
- Failed projects (if any)

### Step 3: Evaluate Success Criteria

**SUCCESS if:**
- Exit code === 0
- Error count === 0
- (Warning count > 0 is acceptable)

**FAILURE if:**
- Exit code !== 0
- Error count > 0

### Step 4: Handle Build Result

**On SUCCESS:**
- Log success to work-log.md
- Continue with normal flow (output to user, handoff, etc.)
- No user intervention needed

**On FAILURE:**
- HALT execution immediately
- Present error details
- Show resolution options
- Wait for user choice

---

## Algorithm: HandleBuildFailure

**Input:**
- errorCount: number
- buildOutput: string
- currentTask: string

**Output:**
- User-facing error report with resolution options

**Process:**

### Step 1: Extract Error Details

Parse build output for:
- File paths with errors
- Line numbers
- Error codes (CS####)
- Error messages

### Step 2: Generate Error Report

Format for user display:

```
## ⚠️ Build Validation Failed

**Task:** {currentTask}  
**Errors:** {errorCount}  
**Warnings:** {warningCount}

**Error Details:**
- {file}({line}): {errorCode} - {message}
- {file}({line}): {errorCode} - {message}
...

**Build Output:**
{truncated output showing errors only}
```

### Step 3: Present Resolution Options

```
**Resolution Options:**

**A.** Rollback Changes (git reset to last successful state)  
**B.** Fix Errors Immediately (continue work to resolve)  
**C.** Create Drift Key (separate build fix from current work)  
**D.** Show Full Build Output (detailed diagnostics)

**Reply:** A, B, C, or D
```

### Step 4: Execute User Choice

**Option A - Rollback:**
- Run: `git reset --hard HEAD~1` (if committed) OR `git restore .` (if uncommitted)
- Validate build succeeds after rollback
- Report rollback success
- Resume previous work state

**Option B - Fix Immediately:**
- Keep current state
- Allow user to make fixes
- Re-run build validation after fixes
- Continue when build succeeds

**Option C - Create Drift Key:**
- Stash current work
- Create drift key: `{parent-key}-build-fix`
- Route to drift.prompt.md with build errors
- Parent work remains stashed

**Option D - Show Full Output:**
- Display complete build output
- Re-present options A/B/C
- Wait for user choice

---

## Integration Points

### task.prompt.md Integration

**Location:** After Step 8 (Task Execution), before Step 9 (Final Output)

**New Step 8.5: Build Validation Gate**

**Process:**
1. Task execution completes
2. Run ValidateBuildState algorithm
3. If SUCCESS: Proceed to Step 9 (Final Output)
4. If FAILURE: Run HandleBuildFailure algorithm, HALT

**Pseudo-integration:**
```
Step 8: Execute task
  ↓
Step 8.5: Build Validation Gate ← NEW
  - Run: dotnet build --no-incremental
  - Check: errors === 0
  - On failure: HALT with options
  ↓
Step 9: Final output (only if build succeeds)
```

---

### todo.prompt.md Integration

**Location:** After work completion, before final output

**Process:**
1. Todo work completes
2. Run ValidateBuildState
3. If SUCCESS: Proceed to output
4. If FAILURE: HALT with options

---

### plan.prompt.md Integration

**Location:** In Success Criteria section

**Process:**
1. Add to acceptance criteria template
2. Each phase must pass build validation
3. Document in phase handoff JSON

**Success Criteria Addition:**
```
- ✅ Build succeeds with zero errors (dotnet build --no-incremental)
- ✅ Warnings reviewed (acceptable if informational)
```

---

### test-generation.prompt.md Integration

**Location:** After test file creation, before execution

**Process:**
1. Test file created
2. Run ValidateBuildState
3. If FAILURE: Test has compilation errors
4. Fix test syntax before execution

---

## Exception Handling

### Exception: Refactoring WIP

**Scenario:** Mid-refactor state where build is intentionally broken temporarily

**Detection:**
- Commit message contains "refactor-wip" OR "wip"
- OR explicit flag: `skipBuildValidation=true`

**Behavior:**
- Skip build validation
- Log warning to work-log.md
- Require explicit re-enable for next task

**Warning Message:**
```
⚠️ Build validation SKIPPED (refactor-wip mode)
Next task will require clean build state.
```

---

## Performance Optimization

### Caching Strategy

**Problem:** Repeated builds slow down workflow

**Solution:**
- Use `--no-incremental` for accuracy
- Build once per task (not per file change)
- Cache build result for 60 seconds
- Re-validate if files changed

### Parallel Execution

**Problem:** Build blocks other work

**Solution:**
- Run build in background during final cleanup
- Continue preparing output while build runs
- HALT only if build fails

---

## Error Patterns & Auto-Fix

### Common Build Errors

**Pattern 1: Missing using directive**
```
Error: CS0246 - Type or namespace not found
Auto-fix: Search file for type usage, suggest import
```

**Pattern 2: Syntax error**
```
Error: CS1002 - ; expected
Auto-fix: Show line context, highlight missing semicolon
```

**Pattern 3: Null reference**
```
Error: CS8602 - Possible null reference
Auto-fix: Suggest null-conditional operator (?)
```

---

## Logging & Metrics

### Log Entry Format

**In work-log.md:**
```
#### Build Validation ✅
- Command: dotnet build --no-incremental
- Exit Code: 0
- Errors: 0
- Warnings: 3 (acceptable)
- Duration: 12.4s
```

**On Failure:**
```
#### Build Validation ❌
- Command: dotnet build --no-incremental
- Exit Code: 1
- Errors: 2
- Error Details:
  - HostControlPanel.razor(1852): CS0246 - HubException not found
  - SessionCanvas.razor(245): CS1002 - ; expected
- Resolution: Option B selected (Fix Immediately)
```

---

## Testing the Validation Gate

### Manual Test

1. Make intentional syntax error
2. Run task completion
3. Verify build validation triggers
4. Verify options presented
5. Verify rollback works

### Automated Test

Create test task that:
1. Introduces build error
2. Validates gate triggers
3. Selects Option A (rollback)
4. Verifies clean state restored

---

**Version:** 1.0.0  
**Created:** 2025-10-31  
**Rule:** #14 (Build State Validation)  
**Integration:** task, todo, plan, test-generation prompts

