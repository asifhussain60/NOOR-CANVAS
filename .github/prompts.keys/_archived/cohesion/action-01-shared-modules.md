# Action Item 01: Create Shared Modules System

**Priority**: HIGH (Phase 1 - Week 1)  
**Effort**: 3 Story Points  
**Impact**: Eliminate 180 lines of duplicate code, improve maintainability

---

## Description

Extract common sections (Step 0, Step 1, debug logging mandate, warning handling mandate) that are duplicated across multiple prompts into shared module files. This will eliminate ~180 lines of duplicate code and ensure consistency across all prompts.

---

## Files Affected

**New Files to Create**:
- `.github/prompts/shared/step-0-server-cleanup.md`
- `.github/prompts/shared/step-1-checkpoint.md`
- `.github/prompts/shared/debug-logging-mandate.md`
- `.github/prompts/shared/warning-handling-mandate.md`

**Prompts to Update** (replace duplicates with includes):
- `.github/prompts/task.prompt.md`
- `.github/prompts/refactor.prompt.md`
- `.github/prompts/sync.prompt.md`
- `.github/prompts/healthcheck.prompt.md`
- `.github/prompts/cohesion-review.prompt.md`
- `.github/prompts/question.prompt.md` (warning handling only)
- `.github/prompts/analyze-learning.prompt.md` (debug logging only)
- `.github/prompts/test-generation.prompt.md` (add debug logging)

---

## Implementation Steps

### Step 1: Create Shared Modules Directory
```powershell
New-Item -Path ".github/prompts/shared" -ItemType Directory
```

### Step 2: Extract Step 0 (Server Cleanup)
**Source**: task.prompt.md lines 325-365  
**Target**: `.github/prompts/shared/step-0-server-cleanup.md`

**Content**:
```markdown
## Step 0: Kill Running Kestrel Servers (Mandatory)

Before any code changes, ensure clean server state to prevent port conflicts and file locks.

### 0.1. Execute nckill Command

```powershell
nckill
```

This PowerShell alias kills all `dotnet.exe` processes, ensuring:
- No port 9091 conflicts (HTTPS already in use errors)
- No file lock issues during build/compilation
- No stale server instances serving outdated code
- No test failures from multiple server instances

### 0.2. Verify Clean State

- Confirm terminal output shows processes terminated successfully
- If `nckill` command not found, use fallback:

```powershell
Get-Process -Name dotnet -ErrorAction SilentlyContinue | Where-Object { 
    $_.MainWindowTitle -like '*Kestrel*' -or $_.Path -like '*NoorCanvas*' 
} | Stop-Process -Force
```

**Rationale**: Prevents "address already in use" errors on port 9091 and ensures the latest compiled code is served. This step is mandatory for all task executions.
```

### Step 3: Extract Step 1 (Checkpoint)
**Source**: task.prompt.md Step 1  
**Target**: `.github/prompts/shared/step-1-checkpoint.md`

**Content**:
```markdown
## Step 1: Checkpoint Commit (Mandatory)

After killing servers (if applicable), create a checkpoint commit to enable easy rollback if issues arise.

### 1.1. Create Checkpoint

```bash
git add -A
git commit -m "checkpoint: pre-task {key}" --allow-empty
```

Replace `{key}` with the actual key name (e.g., `checkpoint: pre-task hcp`).

### 1.2. Purpose

- Enables instant rollback via `git reset --hard HEAD~1`
- Preserves clean state before modifications
- Provides recovery point if task fails
- Required for all agents that modify code

**Rationale**: Safety mechanism ensuring every task can be cleanly rolled back if needed.
```

### Step 4: Extract Debug Logging Mandate
**Source**: task.prompt.md lines 40-60  
**Target**: `.github/prompts/shared/debug-logging-mandate.md`

**Content**:
```markdown
## Debug Logging Mandate (Code Insertion)

**The `debug-level` parameter controls debug logging code inserted INTO source files, NOT agent output verbosity.**

### Parameter Values

- **`none` (default)**: Write production-ready code with no debug logging
- **`simple`**: Insert basic debug markers (e.g., `Logger.LogInformation("[DEBUG-WORKITEM:...]")`)
- **`trace`**: Insert comprehensive debug markers with detailed state tracking
- **`cleanup`**: Detect and remove existing debug logs using standardized markers

### Debug Marker Patterns

All debug markers must include `;CLEANUP_OK` suffix for automatic detection and removal.

**C# Logging**:
```csharp
Logger.LogInformation("[DEBUG-WORKITEM:scope:context] message ;CLEANUP_OK");
```

**JavaScript**:
```javascript
console.log("[DEBUG-WORKITEM:scope:context] message ;CLEANUP_OK");
```

**Comments**:
```csharp
// DEBUG-WORKITEM: description ;CLEANUP_OK
```

### Read-Only Agents

For agents that perform analysis without modifying code (question, healthcheck, analyze-learning), the debug-level parameter is **not applicable**.
```

### Step 5: Extract Warning Handling Mandate
**Source**: refactor.prompt.md lines 18-30 (most comprehensive version)  
**Target**: `.github/prompts/shared/warning-handling-mandate.md`

**Content**:
```markdown
## Warning Handling Mandate

**CRITICAL**: Warnings must be treated as BLOCKING ERRORS — the system must be 100% clean with zero errors and zero warnings.

### Mandatory Requirements

- ✅ **ZERO TOLERANCE**: Absolutely zero compilation errors and zero warnings
- ✅ **IMMEDIATE VALIDATION**: Run full build check after EVERY file modification
- ✅ **RETRY POLICY**: If warnings detected, automatically retry fixes up to 2 additional attempts (3 total tries)
- ✅ **ESCALATION**: If warnings persist after retries, IMMEDIATELY stop and escalate to user with specific details
- ✅ **NO PARTIAL SUCCESS**: Do not accept "mostly clean" or "minor warnings"

### Validation Commands

```powershell
dotnet build --configuration Release --verbosity normal
dotnet build --configuration Debug --verbosity normal
```

Both must complete with zero errors and zero warnings.

### Retry Logic

1. **First attempt**: Make changes, validate build
2. **If warnings**: Attempt automatic fixes, validate again (attempt 2)
3. **If still warnings**: Review and retry fixes (attempt 3)
4. **If still warnings**: STOP and escalate to user

**Rollback Trigger**: Any persistent warning triggers immediate rollback to checkpoint commit.

### Read-Only Agents

For read-only agents (question, healthcheck, analyze-learning), this mandate applies to system validation but does not involve code changes.
```

### Step 6: Update Prompts to Use Shared Modules

Replace duplicate sections in each prompt with includes:

**Example for task.prompt.md**:
```markdown
### Step 0: Kill Running Kestrel Servers

[!INCLUDE [](shared/step-0-server-cleanup.md)]

---

### Step 1: Checkpoint Commit

[!INCLUDE [](shared/step-1-checkpoint.md)]
```

**Note**: Markdown include syntax may vary by renderer. Alternative approaches:
- Use HTML comments: `<!-- include: shared/step-0-server-cleanup.md -->`
- Use build-time preprocessing
- For Copilot prompts, may need manual duplication but keep shared/ as source of truth

---

## Validation

### Success Criteria

1. ✅ All 4 shared module files created in `.github/prompts/shared/`
2. ✅ All 8 prompts updated to reference shared modules
3. ✅ No duplicate content remains in individual prompts
4. ✅ All prompts render correctly (test by invoking each)
5. ✅ Shared modules maintain identical content to original (no functionality lost)
6. ✅ Documentation updated with shared module usage guidelines

### Testing

1. **Invoke each prompt** to ensure includes work correctly
2. **Verify content**: Compare rendered output to original
3. **Check consistency**: All prompts use identical Step 0, Step 1 logic
4. **Maintenance test**: Update shared/step-0-server-cleanup.md and verify all prompts reflect change

---

## Dependencies

- None (independent action item)

---

## Estimated Timeline

- **Analysis**: 30 minutes (identify all duplicates, extract canonical versions)
- **Implementation**: 90 minutes (create shared files, update 8 prompts)
- **Testing**: 30 minutes (invoke all prompts, verify includes)
- **Total**: ~2.5 hours (3 story points)

---

## ROI

**Immediate Benefits**:
- 180 lines of code eliminated (3% reduction in codebase)
- Single source of truth for common workflows
- Easier maintenance (update once, applies to all prompts)
- Guaranteed consistency across all agents

**Long-Term Benefits**:
- Future prompts can reuse shared modules
- Reduced risk of drift between prompts
- Faster prompt creation (plug in shared modules)
- Better documentation (shared modules have detailed explanations)

**Risk Reduction**:
- Server cleanup logic bugs fixed once, applies everywhere
- Checkpoint workflow improvements benefit all agents
- Debug logging standards enforced consistently

---

## Notes

- **Include Syntax**: May need to adapt based on Copilot's markdown rendering capabilities
- **Versioning**: Consider versioning shared modules (v1.0.0) to track breaking changes
- **Testing**: Critical to test all 8 prompts after migration to ensure no functionality lost
- **Documentation**: Update SelfAwareness.instructions.md to reference shared module system
