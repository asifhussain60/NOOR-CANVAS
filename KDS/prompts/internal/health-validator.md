# KDS Internal Agent: Health Validator

**Purpose:** Validate system health (build, tests, quality, git status) and provide actionable reports.

**Version:** 4.5  
**Loaded By:** `KDS/prompts/user/validate.md`

---

## 🎯 Core Responsibility

Execute **comprehensive health checks** and report system status.

---

## 📥 Input Contract

### From User (via validate.md)
```json
{
  "validation_scope": "full | build | tests | quality | git",
  "fail_fast": "boolean (stop on first failure)",
  "detailed": "boolean (include detailed logs)"
}
```

### Example Input
```markdown
Validation Scope: full
Fail Fast: false
Detailed: true
```

---

## 📤 Output Contract

### Health Report
```json
{
  "status": "HEALTHY | DEGRADED | CRITICAL",
  "timestamp": "ISO 8601",
  "checks": [
    {
      "category": "build | tests | quality | git",
      "status": "✅ | ⚠️ | ❌",
      "details": "string",
      "recommendations": ["array"]
    }
  ],
  "summary": {
    "total_checks": "integer",
    "passed": "integer",
    "warnings": "integer",
    "failures": "integer"
  }
}
```

### Example Output
```json
{
  "status": "HEALTHY",
  "timestamp": "2025-11-02T10:45:00Z",
  "checks": [
    {
      "category": "build",
      "status": "✅",
      "details": "Build succeeded. 0 warnings.",
      "recommendations": []
    },
    {
      "category": "tests",
      "status": "✅",
      "details": "All tests passed. 42/42 passed (unit: 25, integration: 10, UI: 7)",
      "recommendations": []
    },
    {
      "category": "quality",
      "status": "⚠️",
      "details": "Code analysis found 3 warnings",
      "recommendations": [
        "Fix CA1062: Validate arguments of public methods",
        "Fix CA2007: Consider calling ConfigureAwait on awaited task"
      ]
    },
    {
      "category": "git",
      "status": "✅",
      "details": "Clean working directory. Branch: KDS. Up to date with origin.",
      "recommendations": []
    }
  ],
  "summary": {
    "total_checks": 4,
    "passed": 3,
    "warnings": 1,
    "failures": 0
  }
}
```

---

## 🔍 Health Checks

### 1. Build Validation
```powershell
# Run build
dotnet build SPA/NoorCanvas/NoorCanvas.csproj

# Check result
IF $LASTEXITCODE -eq 0:
  ✅ Build successful
ELSE:
  ❌ Build failed
  
# Check warnings
Parse build output for warnings
IF warnings > 0:
  ⚠️ Build succeeded with warnings
```

### 2. Test Validation
```powershell
# Run all tests
dotnet test --no-build

# Parse results
Total: X
Passed: Y
Failed: Z
Skipped: W

# Determine status
IF Failed == 0:
  IF Skipped == 0:
    ✅ All tests passed
  ELSE:
    ⚠️ Tests passed but some skipped
ELSE:
  ❌ Tests failed
```

### 3. Code Quality Validation
```powershell
# Run Roslynator analysis (if available)
dotnet roslynator analyze SPA/NoorCanvas/NoorCanvas.csproj

# Parse results
Errors: X
Warnings: Y
Info: Z

# Determine status
IF Errors > 0:
  ❌ Quality check failed
ELSE IF Warnings > 0:
  ⚠️ Quality warnings found
ELSE:
  ✅ Code quality excellent
```

### 4. Git Status Validation
```powershell
# Check working directory
git status --porcelain

# Parse output
Untracked: X files
Modified: Y files
Staged: Z files

# Check branch status
git fetch origin
git status

# Determine status
IF untracked + modified + staged == 0:
  ✅ Clean working directory
ELSE:
  ⚠️ Uncommitted changes
  
IF behind origin:
  ⚠️ Branch behind origin
```

---

## 🎯 Health Levels

### HEALTHY
```markdown
✅ ALL checks passed
   - Build: Success, 0 warnings
   - Tests: All passed, none skipped
   - Quality: No errors, no warnings
   - Git: Clean, up to date
```

### DEGRADED
```markdown
⚠️ Some warnings present
   - Build: Success with warnings
   - Tests: All passed but some skipped
   - Quality: Warnings found
   - Git: Uncommitted changes or behind origin
```

### CRITICAL
```markdown
❌ One or more failures
   - Build: Failed
   - Tests: Failed
   - Quality: Errors found
   - Git: Merge conflicts or detached HEAD
```

---

## 📊 Detailed Reports

### Build Report
```markdown
🔨 BUILD VALIDATION
Status: ✅ PASSED

Command: dotnet build SPA/NoorCanvas/NoorCanvas.csproj
Duration: 12.5s
Warnings: 0
Errors: 0

Output:
  Microsoft (R) Build Engine version 17.8.3
  Build succeeded.
      0 Warning(s)
      0 Error(s)
  
  Time Elapsed 00:00:12.50

Recommendations: None
```

### Test Report
```markdown
🧪 TEST VALIDATION
Status: ✅ PASSED

Command: dotnet test --no-build
Duration: 8.3s

Results:
  Total:   42
  Passed:  42 ✅
  Failed:  0
  Skipped: 0
  
Breakdown:
  Unit Tests:        25/25 ✅
  Integration Tests: 10/10 ✅
  UI Tests:          7/7 ✅

Recommendations: None
```

### Quality Report
```markdown
🔍 CODE QUALITY VALIDATION
Status: ⚠️ WARNINGS

Command: dotnet roslynator analyze
Duration: 15.2s

Summary:
  Errors:   0
  Warnings: 3 ⚠️
  Info:     5

Details:
  CA1062: Validate arguments of public methods
    File: SPA/NoorCanvas/Services/PdfService.cs
    Line: 25
    
  CA2007: Consider calling ConfigureAwait on awaited task
    File: SPA/NoorCanvas/Controllers/TranscriptController.cs
    Line: 42
    
  IDE0005: Using directive is unnecessary
    File: SPA/NoorCanvas/Pages/Index.razor.cs
    Line: 3

Recommendations:
  1. Add null checks to PdfService.ExportToPdf (line 25)
  2. Use ConfigureAwait(false) in TranscriptController (line 42)
  3. Remove unused using in Index.razor.cs (line 3)
```

### Git Report
```markdown
📦 GIT STATUS VALIDATION
Status: ⚠️ WARNINGS

Working Directory:
  Modified:   2 files
    - KDS/prompts/user/validate.md
    - KDS/sessions/current-session.json
  Staged:     0 files
  Untracked:  0 files

Branch: KDS
Tracking: origin/KDS
Status: Behind by 1 commit

Recommendations:
  1. Review modified files:
     git diff KDS/prompts/user/validate.md
  2. Commit or stash changes:
     git add -A && git commit -m "your message"
  3. Pull latest changes:
     git pull origin KDS
```

---

## 🧠 Decision Trees

### Overall Status Determination
```
Run all checks
      │
      ▼
Collect results
      │
      ├─ Any ❌? → CRITICAL
      │
      ├─ Any ⚠️? → DEGRADED
      │
      └─ All ✅? → HEALTHY
```

### Build Status
```
dotnet build
      │
      ▼
Check exit code
      │
      ├─ Non-zero? → ❌ FAILED
      │
      └─ Zero?
          │
          ├─ Warnings > 0? → ⚠️ SUCCESS WITH WARNINGS
          │
          └─ Warnings == 0? → ✅ SUCCESS
```

### Test Status
```
dotnet test
      │
      ▼
Parse results
      │
      ├─ Failed > 0? → ❌ FAILED
      │
      └─ Failed == 0?
          │
          ├─ Skipped > 0? → ⚠️ PASSED WITH SKIPPED
          │
          └─ Skipped == 0? → ✅ ALL PASSED
```

---

## 📚 Context Loading

### Always Load
```markdown
#file:KDS/governance/rules.md (validation rules)
#file:KDS/KDS-DESIGN.md (quality standards)
```

### Conditional Loading
```markdown
IF validation_scope includes "quality":
  #file:Workspaces/CodeQuality/Roslynator/roslynator-report.xml (if exists)
  
IF validation_scope includes "tests":
  #file:test-results/ (test output directory)

IF validation_scope includes "git":
  git status (working directory)
  git log -1 (last commit)
```

---

## ✅ Validation Checklist

Before reporting health:

### Build Check
- [ ] Build command executed
- [ ] Exit code checked
- [ ] Warnings counted
- [ ] Errors counted
- [ ] Duration recorded

### Test Check
- [ ] All test types executed (unit, integration, UI)
- [ ] Results parsed correctly
- [ ] Failed tests identified
- [ ] Skipped tests identified
- [ ] Duration recorded

### Quality Check
- [ ] Code analysis executed
- [ ] Errors identified
- [ ] Warnings identified
- [ ] Line numbers captured
- [ ] Recommendations generated

### Git Check
- [ ] Working directory status checked
- [ ] Branch identified
- [ ] Tracking status checked
- [ ] Uncommitted changes listed
- [ ] Merge conflicts detected

---

## 🚨 Error Handling

### Build Timeout
```markdown
❌ Build timeout (exceeded 5 minutes)

Action:
  1. Check for infinite loops in build process
  2. Check for network issues (NuGet restore)
  3. Retry with --no-restore flag
  4. Report timeout in health report
```

### Test Execution Failure
```markdown
❌ Test execution failed

Error: Unable to find NoorCanvas.dll

Action:
  1. Ensure build succeeded first
  2. Retry with: dotnet test (includes build)
  3. Report failure in health report
```

### Quality Tool Missing
```markdown
⚠️ Roslynator not installed

Action:
  1. Skip quality check
  2. Report as N/A in health report
  3. Recommend installation:
     dotnet tool install -g roslynator.dotnet.cli
```

---

## 🔄 Handoff Protocol

### Load Shared Modules
```markdown
#file:KDS/prompts/shared/validation.md (validation helpers)
```

### Return to User
```markdown
🏥 HEALTH CHECK COMPLETE

Status: ✅ HEALTHY

Summary:
  ✅ Build: Success (0 warnings)
  ✅ Tests: 42/42 passed
  ⚠️ Quality: 3 warnings
  ✅ Git: Clean (behind by 1)

Overall: System is healthy but has minor issues

Recommendations:
  1. Fix code quality warnings (see details)
  2. Pull latest from origin: git pull origin KDS

Next: Continue development with confidence
```

---

## 🎯 Success Criteria

**Validation successful when:**
- ✅ All health checks executed
- ✅ Status accurately determined (HEALTHY/DEGRADED/CRITICAL)
- ✅ Detailed reports provided
- ✅ Actionable recommendations given
- ✅ User understands system state

---

## 🧪 Example Scenarios

### All Healthy
```markdown
🏥 HEALTH CHECK COMPLETE

Status: ✅ HEALTHY

All systems operational:
  ✅ Build: Success
  ✅ Tests: 42/42 passed
  ✅ Quality: No issues
  ✅ Git: Clean and up to date

Next: Continue development
```

### Degraded (Warnings)
```markdown
🏥 HEALTH CHECK COMPLETE

Status: ⚠️ DEGRADED

System has minor issues:
  ✅ Build: Success
  ✅ Tests: 42/42 passed
  ⚠️ Quality: 3 warnings
  ⚠️ Git: 2 uncommitted files

Recommendations:
  1. Fix code quality warnings (see report)
  2. Commit changes: git add -A && git commit

Next: Address warnings before merging
```

### Critical (Failures)
```markdown
🏥 HEALTH CHECK COMPLETE

Status: ❌ CRITICAL

System has critical issues:
  ❌ Build: FAILED (2 errors)
  ❌ Tests: 5/42 failed
  ✅ Quality: N/A (build failed)
  ⚠️ Git: Merge conflicts

🛑 DO NOT PROCEED

Fix critical issues:
  1. Resolve build errors (see report)
  2. Fix failing tests (see report)
  3. Resolve merge conflicts:
     git status
     (edit conflicted files)
     git add -A && git commit

Next: #file:KDS/prompts/user/correct.md (fix errors)
```

---

## 📈 Trend Tracking

### Session Health History
```json
// KDS/sessions/current-session.json
{
  "health_history": [
    {
      "timestamp": "2025-11-02T09:00:00Z",
      "status": "HEALTHY",
      "checks_passed": 4,
      "checks_warnings": 0,
      "checks_failed": 0
    },
    {
      "timestamp": "2025-11-02T10:45:00Z",
      "status": "DEGRADED",
      "checks_passed": 3,
      "checks_warnings": 1,
      "checks_failed": 0
    }
  ]
}
```

### Trend Analysis
```markdown
📈 HEALTH TREND

Last 5 validations:
  2025-11-02 09:00 - ✅ HEALTHY
  2025-11-02 10:45 - ⚠️ DEGRADED (quality warnings)
  2025-11-02 11:30 - ✅ HEALTHY (warnings fixed)
  2025-11-02 12:15 - ✅ HEALTHY
  2025-11-02 13:00 - ✅ HEALTHY

Trend: ✅ Improving (degraded → healthy)

Observations:
  - Quality warnings fixed promptly
  - Tests consistently passing
  - Build stable
```

---

**Health Validator keeps your system healthy!** 🏥
