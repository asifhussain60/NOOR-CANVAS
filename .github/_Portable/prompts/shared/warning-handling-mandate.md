# Warning Handling Mandate

**Version**: 1.0.0  
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
- Verify output contains "0 Error(s), 0 Warning(s)" or language-specific equivalent

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

### Language-Specific Build Commands

**C# / .NET:**
```bash
dotnet build
# Expected: "Build succeeded. 0 Error(s), 0 Warning(s)"
```

**JavaScript / TypeScript:**
```bash
npm run build
# Expected: No errors, no warnings in output
```

**Python:**
```bash
python -m py_compile **/*.py
# Expected: No output (silence means success)
```

**Java:**
```bash
mvn clean compile
# or
gradle build
# Expected: BUILD SUCCESS with no warnings
```

**Go:**
```bash
go build ./...
# Expected: No output (silence means success)
```

### Full Validation Pipeline

1. **Build Validation** (MANDATORY)
   ```bash
   # Run build command for your language
   ```
   Expected: `0 Error(s), 0 Warning(s)` or equivalent

2. **Analyzer Validation** (if applicable)
   ```bash
   # Run static analysis tools
   # Examples: Roslynator (.NET), ESLint (JS/TS), Pylint (Python)
   ```
   Expected: No analyzer warnings

3. **Error Check**
   Use editor/IDE error detection
   Expected: Empty list

4. **Success Criteria**
   ALL checks must pass with ZERO issues

---

## Error Detection and Resolution

### Common Warning Sources

#### 1. Unused Variables/Parameters

**C#:**
```csharp
// ❌ Warning CS0168: Variable 'result' is declared but never used
var result = ProcessData();

// ✅ Fix: Use or remove
var result = ProcessData();
return result;
```

**JavaScript:**
```javascript
// ❌ Warning: 'result' is assigned but never used
const result = processData();

// ✅ Fix: Use or remove
const result = processData();
return result;
```

**Python:**
```python
# ❌ Warning: Variable 'result' is assigned but never used
result = process_data()

# ✅ Fix: Use or remove
result = process_data()
return result
```

#### 2. Nullable Reference Warnings

**C#:**
```csharp
// ❌ Warning CS8600: Converting null literal to non-nullable type
string? value = GetValue();
string result = value;  // Warning here

// ✅ Fix: Null check or null-forgiving operator
string result = value ?? "default";
// or
string result = value!;  // If you're certain it's not null
```

**TypeScript:**
```typescript
// ❌ Type 'string | null' is not assignable to type 'string'
const value: string | null = getValue();
const result: string = value;  // Error here

// ✅ Fix: Null check or type assertion
const result: string = value ?? "default";
// or
const result: string = value!;  // If you're certain it's not null
```

#### 3. Unreachable Code

**C#:**
```csharp
// ❌ Warning CS0162: Unreachable code detected
return result;
Console.WriteLine("Done");  // This line is unreachable

// ✅ Fix: Remove unreachable code
return result;
```

**JavaScript:**
```javascript
// ❌ Warning: Unreachable code
return result;
console.log("Done");  // This line is unreachable

// ✅ Fix: Remove unreachable code
return result;
```

#### 4. Missing await

**C#:**
```csharp
// ❌ Warning CS4014: Call is not awaited
SaveDataAsync();

// ✅ Fix: Add await
await SaveDataAsync();
```

**JavaScript:**
```javascript
// ❌ Warning: Promise returned is not awaited
saveDataAsync();

// ✅ Fix: Add await
await saveDataAsync();
```

**Python:**
```python
# ❌ Warning: Coroutine not awaited
save_data_async()

# ✅ Fix: Add await
await save_data_async()
```

#### 5. Type Mismatches

**C#:**
```csharp
// ❌ Warning CS0219: Variable is assigned but never used
int count = items.Count();
string value = count;  // Type mismatch

// ✅ Fix: Correct type or convert
string value = count.ToString();
```

**Python:**
```python
# ❌ Type mismatch warning (if using type hints)
def process(value: int) -> str:
    return value  # Returns int, expects str

# ✅ Fix: Convert properly
def process(value: int) -> str:
    return str(value)
```

---

## Retry Strategy

### Attempt 1: Direct Fix
1. Identify warning from build output
2. Apply standard fix pattern (see above)
3. Rebuild immediately
4. If clean: proceed
5. If warnings remain: continue to Attempt 2

### Attempt 2: Deeper Analysis
1. Review context around warning
2. Check for related warnings
3. Apply comprehensive fix
4. Rebuild
5. If clean: proceed
6. If warnings remain: continue to Attempt 3

### Attempt 3: Alternative Approach
1. Consider different implementation
2. Review language/framework best practices
3. Apply alternative solution
4. Rebuild
5. If clean: proceed
6. If warnings persist: **ESCALATE**

### Escalation
If warnings persist after 3 attempts:

1. **Stop all work immediately**
2. **Document the issue:**
   ```markdown
   ## Warning Escalation
   
   **Warning:** [Warning message]
   **File:** [File path]
   **Line:** [Line number]
   
   **Attempts Made:**
   1. [What was tried]
   2. [What was tried]
   3. [What was tried]
   
   **Context:** [Why standard fixes didn't work]
   
   **Next Steps:** [Recommendations for manual resolution]
   ```
3. **Rollback to checkpoint:**
   ```bash
   git reset --hard <checkpoint-sha>
   ```
4. **Stash attempted changes:**
   ```bash
   git stash push -m "Failed attempts to fix [warning]"
   ```
5. **Report to user for manual intervention**

---

## Build Output Interpretation

### Success Indicators

**C# / .NET:**
```
Build succeeded.
    0 Warning(s)
    0 Error(s)
```
✅ PASS

**npm (JavaScript/TypeScript):**
```
> build

webpack compiled successfully
```
✅ PASS (if no warning lines appear)

**Python (silence = success):**
```
$ python -m py_compile **/*.py
$ 
```
✅ PASS (no output)

**Java (Maven):**
```
[INFO] BUILD SUCCESS
```
✅ PASS (and no [WARNING] lines)

### Failure Indicators

**Any of these = FAILURE:**
- Error count > 0
- Warning count > 0
- "BUILD FAILED" message
- Exception traces
- Compilation errors listed

---

## Language-Specific Tools

### C# / .NET
```bash
# Standard build
dotnet build

# With analyzer enforcement
dotnet build /p:TreatWarningsAsErrors=true

# Clean build (recommended)
dotnet clean && dotnet build
```

### JavaScript / TypeScript
```bash
# Standard build
npm run build

# TypeScript strict mode
tsc --strict --noEmit

# ESLint with warnings as errors
npx eslint . --max-warnings=0
```

### Python
```bash
# Compile check
python -m py_compile **/*.py

# Pylint (fail on warnings)
pylint **/*.py --fail-under=10.0

# MyPy (type checking)
mypy . --strict
```

### Java
```bash
# Maven with strict warnings
mvn clean compile -Dmaven.compiler.showWarnings=true -Werror

# Gradle with strict warnings
gradle clean build --warning-mode=all
```

---

## Integration with Agents

### Task Agent
- Validates after EVERY file modification
- Retries on warnings (up to 3 attempts)
- Rolls back if warnings persist

### Refactor Agent
- **CRITICAL** - Must maintain zero warnings
- Validates continuously during refactoring
- Immediate rollback on any warning introduction

### Sync Agent
- Validates after configuration changes
- Ensures documentation updates don't break build

---

## Continuous Validation

### After Each File Modification

**Workflow:**
1. Modify file
2. Save
3. **Immediately run build**
4. Check output
5. If warnings: fix immediately before continuing
6. If clean: proceed to next change

**Why continuous validation?**
- Catch issues early when context is fresh
- Avoid cascading problems
- Faster debugging (know exactly what caused issue)
- Prevents "warning debt" accumulation

### Before Commit

**Pre-Commit Checklist:**
```bash
# 1. Clean build
dotnet clean && dotnet build  # or language equivalent

# 2. Run tests
dotnet test  # or language equivalent

# 3. Run analyzers
# (language-specific static analysis)

# 4. Check git status
git status

# 5. Commit only if ALL checks pass
git commit -m "..."
```

---

## Rollback Procedure

If warnings persist after 3 attempts:

### Step 1: Identify Checkpoint
```bash
git log --oneline -10
# Find most recent: "checkpoint: pre-{agent} {context}"
```

### Step 2: Verify Checkpoint
```bash
git show <checkpoint-sha>
# Ensure this is the correct safe point
```

### Step 3: Rollback
```bash
# Hard reset (discards all changes)
git reset --hard <checkpoint-sha>

# Verify clean state
git status
dotnet build  # Should succeed with 0 warnings
```

### Step 4: Document Failure
Create file: `Workspaces/Copilot/_DOCS/analysis/rollback-{timestamp}.md`

```markdown
# Rollback Report

**Date:** {timestamp}
**Agent:** {agent-name}
**Key:** {key-name}

## Reason
Persistent warnings after 3 fix attempts.

## Warning Details
[Warning message and location]

## Attempted Fixes
1. [Approach 1] - Still had warnings
2. [Approach 2] - Still had warnings
3. [Approach 3] - Still had warnings

## Rollback
Reset to checkpoint: {checkpoint-sha}

## Recommendations
[How to approach this manually]
```

---

## Exception Handling

### Acceptable Baseline Warnings

**If project has existing warnings before agent work:**

1. **Document baseline:**
   ```bash
   dotnet build > baseline-warnings.txt
   ```

2. **Agent rule:**
   - DO NOT introduce NEW warnings
   - MAY fix existing warnings (bonus)
   - MUST NOT increase warning count

3. **Validation:**
   ```bash
   # Current warnings
   dotnet build | grep "Warning(s)"
   # Compare to baseline
   ```

**Goal:** Zero NEW warnings, path toward zero TOTAL warnings

### Suppressed Warnings

**If project intentionally suppresses warnings:**

1. **Document suppressions** in `AnalyzerConfig.md`
2. **Justify each suppression** (why needed)
3. **Plan removal** (technical debt tracking)

**Agent rule:** Respect documented suppressions, but question new ones

---

## Best Practices

1. **Validate early, validate often** - Don't accumulate warnings
2. **Fix immediately** - Warnings compound over time
3. **Understand the warning** - Don't just silence it
4. **Learn patterns** - Same warning types have same fixes
5. **Use tools** - IDE quick-fixes often correct
6. **Document exceptions** - If baseline exists, explain why
7. **Clean builds** - Sometimes cached state causes false warnings

---

## Troubleshooting

**Q: Build says 0 warnings but IDE shows warnings?**
A: Restart IDE, clean build, check for cached state

**Q: Warning only appears sometimes?**
A: May be race condition or environment-specific - investigate thoroughly

**Q: Can't figure out how to fix warning?**
A: Document for escalation, don't guess or suppress without understanding

**Q: Warning from third-party code?**
A: Document as baseline, suppress with justification if necessary

**Q: Build takes too long to validate every change?**
A: Consider incremental build options, but don't skip validation

---

## Summary

| Principle | Enforcement |
|-----------|-------------|
| Zero Errors | Mandatory |
| Zero Warnings | Mandatory |
| Retry Policy | 3 attempts maximum |
| Rollback | Automatic on failure |
| Continuous Validation | After every change |
| Clean Build | Before every commit |

**Remember:** Warnings today become errors tomorrow. Fix immediately.
