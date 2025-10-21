# Warning Handling Mandate

**Version**: 1.0.0  
**Last Updated**: 2025-10-11  
**Purpose**: Enforce zero-tolerance policy for build warnings and errors

---

## Overview

Warnings must be treated as **BLOCKING ERRORS** — the system must be 100% clean with **ZERO errors and ZERO warnings**.

This mandate ensures:
- Production-quality code at all times
- No technical debt accumulation
- Immediate detection and resolution of issues
- Clear success/failure criteria

---

## Core Principles

### 1. ZERO TOLERANCE
- **ZERO errors** - No compilation errors allowed
- **ZERO warnings** - No compiler/analyzer warnings allowed
- **NO PARTIAL SUCCESS** - "Mostly clean" or "minor warnings" are NOT acceptable
- **NO EXCEPTIONS** - This policy applies to ALL code changes

### 2. MANDATORY VALIDATION
- Run **full build validation** after EVERY change
- Check build status **after each file modification**, not just at the end
- Use `dotnet build` and verify output contains "0 Error(s), 0 Warning(s)"

### 3. RETRY POLICY
If warnings/errors are detected:
- **Attempt 1**: Fix issues and rebuild
- **Attempt 2**: If still present, analyze and fix again
- **Attempt 3**: Final attempt with different approach
- **Escalation**: If warnings persist after 3 attempts, **STOP and raise for manual resolution**

### 4. ROLLBACK TRIGGER
- Any persistent warning/error after retries triggers **immediate rollback** to checkpoint commit
- Document what was attempted and why it failed
- Preserve attempted changes in stash or separate branch for investigation

---

## Validation Workflow

### After Each File Modification

```bash
# Build the project
dotnet build

# Verify output
# ✅ REQUIRED: "Build succeeded. 0 Error(s), 0 Warning(s)"
# ❌ FAILURE: Any count > 0 for errors or warnings
```

### Full Validation Pipeline

1. **Build Validation** (MANDATORY)
   ```bash
   dotnet build
   ```
   Expected: `0 Error(s), 0 Warning(s)`

2. **Analyzer Validation** (if applicable)
   ```bash
   dotnet build /p:RunAnalyzers=true
   ```
   Expected: No analyzer warnings

3. **Get Errors Check**
   Use `get_errors` tool to check for any IDE-detected issues
   Expected: Empty list

4. **Success Criteria**
   ALL three checks must pass with ZERO issues

---

## Error Detection and Resolution

### Common Warning Sources

1. **Unused Variables/Parameters**
   ```csharp
   // ❌ Warning CS0168: Variable 'result' is declared but never used
   var result = ProcessData();
   
   // ✅ Fix: Use or remove
   var result = ProcessData();
   return result;
   ```

2. **Nullable Reference Warnings**
   ```csharp
   // ❌ Warning CS8600: Converting null literal or possible null value to non-nullable type
   string name = GetName(); // GetName() may return null
   
   // ✅ Fix: Handle null
   string? name = GetName();
   if (name != null) { /* use name */ }
   ```

3. **Async Method Without Await**
   ```csharp
   // ❌ Warning CS1998: Async method lacks 'await' operators
   public async Task<int> GetCount() { return 42; }
   
   // ✅ Fix: Remove async or add await
   public Task<int> GetCount() { return Task.FromResult(42); }
   ```

4. **Obsolete API Usage**
   ```csharp
   // ❌ Warning CS0618: 'OldMethod()' is obsolete
   OldMethod();
   
   // ✅ Fix: Use recommended alternative
   NewMethod();
   ```

5. **Dead Code**
   ```csharp
   // ❌ Warning CS0162: Unreachable code detected
   return true;
   Console.WriteLine("Never executes");
   
   // ✅ Fix: Remove unreachable code
   return true;
   ```

### Resolution Strategy

**For each warning**:
1. **Read warning message carefully** - Understand root cause
2. **Fix properly** - Don't suppress warnings, fix the underlying issue
3. **Rebuild immediately** - Verify fix resolves warning
4. **Check for new warnings** - Ensure fix didn't introduce new issues

**Suppression is NOT allowed** unless:
- Explicitly approved by user
- Documented with clear justification
- Limited to specific instances (not global)

---

## Retry Workflow

### Attempt 1 (Initial Fix)
```markdown
1. Build and capture warnings
2. Analyze each warning
3. Apply fixes
4. Rebuild
5. IF clean → proceed
   ELSE → Attempt 2
```

### Attempt 2 (Alternative Approach)
```markdown
1. Review warnings still present
2. Try different fix strategy
3. Rebuild
4. IF clean → proceed
   ELSE → Attempt 3
```

### Attempt 3 (Final Attempt)
```markdown
1. Deep analysis of persistent warnings
2. Consider refactoring if needed
3. Rebuild
4. IF clean → proceed
   ELSE → ESCALATE
```

### Escalation
```markdown
1. STOP all work immediately
2. Rollback to checkpoint commit:
   git reset --hard {checkpoint-sha}
3. Document failure:
   - What warnings persisted
   - What fixes were attempted
   - Why they didn't work
4. Raise to user for manual resolution
5. Optionally: Stash attempted changes for investigation
   git stash push -m "Failed attempt: {description}"
```

---

## Build Output Interpretation

### ✅ SUCCESS Example
```
Build succeeded.
    0 Warning(s)
    0 Error(s)

Time Elapsed 00:00:15.23
```

**Action**: Proceed to next step

---

### ❌ FAILURE Example (Warnings)
```
Build succeeded.
    3 Warning(s)
    0 Error(s)

Warning CS0168: Variable 'result' is declared but never used [SomeFile.cs(42)]
Warning CS8600: Converting null literal to non-nullable type [OtherFile.cs(58)]
Warning CS1998: Async method lacks 'await' operators [ThirdFile.cs(120)]

Time Elapsed 00:00:15.23
```

**Action**: Fix all 3 warnings, rebuild, retry up to 3 times, rollback if unresolved

---

### ❌ FAILURE Example (Errors)
```
Build FAILED.
    0 Warning(s)
    2 Error(s)

Error CS0103: The name 'nonExistent' does not exist [SomeFile.cs(42)]
Error CS1061: 'string' does not contain a definition for 'NonExistentMethod' [OtherFile.cs(58)]

Time Elapsed 00:00:08.45
```

**Action**: Fix all 2 errors, rebuild, retry up to 3 times, rollback if unresolved

---

## Integration with Workflows

### Refactor Agent
- Check after **each file modification**
- Rollback entire phase if warnings persist
- Document clean build in commit message: `refactor({scope}): {description} (0E/0W)`

### Task Agent
- Check after implementation complete (Step 6)
- Check after test generation (Step 7)
- Rollback to checkpoint if warnings persist

### Sync Agent
- Check after documentation sync
- Check after configuration updates
- Rollback if warnings introduced

---

## Usage

**Reference this module** in your prompt:
```markdown
## Warning Handling Mandate
**See**: [Warning Handling Mandate](shared/warning-handling-mandate.md)

Treat warnings as BLOCKING ERRORS. Zero tolerance policy enforced.
```

OR **Include inline**:
```markdown
## Warning Handling Mandate
ZERO errors, ZERO warnings policy. Retry 3 times, then rollback.
See shared/warning-handling-mandate.md for details.
```

---

## Commit Message Convention

When changes pass validation:
```
{type}({scope}): {description} (0E/0W)
```

**Examples**:
```
refactor(HtmlParsingService): Consolidate pattern matching logic (0E/0W)
feat(canvas): Add delete button to questions (0E/0W)
fix(voting): Handle null vote values (0E/0W)
```

The `(0E/0W)` suffix confirms zero errors, zero warnings validation passed.

---

## Troubleshooting

### "Build succeeded but warnings exist"
- Do NOT accept this state
- Warnings indicate code quality issues
- Apply retry workflow until clean

### "Cannot fix warning without breaking functionality"
- This indicates design problem
- Consider refactoring approach
- Escalate if needed - don't compromise

### "Warning seems minor/harmless"
- No such thing as "minor" warning
- All warnings must be resolved
- Technical debt accumulates quickly

### "Suppression seems easier"
- Suppression masks problems, doesn't solve them
- Only suppress with explicit approval
- Document justification clearly

---

## Examples by Warning Type

### Nullable Reference Warnings
```csharp
// ❌ Before (warning)
public string GetName(User user)
{
    return user.Name; // CS8602: Dereference of possibly null reference
}

// ✅ After (clean)
public string GetName(User? user)
{
    return user?.Name ?? "Unknown";
}
```

### Unused Variable Warnings
```csharp
// ❌ Before (warning)
public void ProcessData()
{
    var data = LoadData(); // CS0168: Variable declared but never used
    SaveResults();
}

// ✅ After (clean)
public void ProcessData()
{
    var data = LoadData();
    SaveResults(data);
}
// OR remove if truly unused
public void ProcessData()
{
    SaveResults();
}
```

### Async Without Await Warnings
```csharp
// ❌ Before (warning)
public async Task<int> GetCount() // CS1998: Lacks await
{
    return _context.Items.Count();
}

// ✅ After (clean)
public async Task<int> GetCount()
{
    return await _context.Items.CountAsync();
}
// OR remove async if not needed
public Task<int> GetCount()
{
    return Task.FromResult(_context.Items.Count());
}
```

---

## Version History

- **v1.0.0** (2025-10-11): Initial extraction from refactor.prompt.md
  - Zero tolerance policy
  - 3-attempt retry workflow
  - Rollback triggers
  - Build output interpretation
  - Warning type examples
  - Integration with agents
