# KDS User Command: Validate

**Purpose:** Check system health, run all validations, and verify quality.

**Version:** 4.5  
**Loaded By:** Universal entry point or direct usage

---

## 🎯 How to Use

```markdown
#file:KDS/prompts/user/validate.md
```

**Or use the universal entry point:**
```markdown
#file:KDS/prompts/user/kds.md

Validate system health
```

No additional input needed - runs comprehensive checks.

---

## 📋 What Happens

When you use this command, KDS will:

1. **Load Health Validator Agent**
   ```
   #file:KDS/prompts/internal/health-validator.md
   ```

2. **Run Build**
   - Execute `dotnet build`
   - Check for compilation errors
   - Report build status

3. **Run All Tests**
   - Playwright UI tests
   - xUnit unit tests
   - Integration tests
   - Report pass/fail counts

4. **Check Code Quality**
   - Run Roslynator analysis (if available)
   - Check for warnings
   - Report complexity metrics

5. **Validate File Structure**
   - Verify no missing files
   - Check git status
   - Validate session state

6. **Generate Health Report**
   - Overall status (HEALTHY / DEGRADED / CRITICAL)
   - Detailed findings
   - Actionable recommendations

---

## 💡 Examples

### Example 1: Healthy System
```markdown
You: #file:KDS/prompts/user/validate.md

KDS:
✅ SYSTEM HEALTH: HEALTHY

Build:
  ✅ PASSING (0 errors, 2 warnings)
  Duration: 4.2s

Tests:
  ✅ Playwright: 47/47 passing
  ✅ Unit Tests: 123/123 passing
  ✅ Integration: 18/18 passing
  Total: 188/188 (100%)

Code Quality:
  ✅ Roslynator: 0 critical issues
  ⚠️  2 suggestions (low priority)
  Complexity: Average 4.2 (target: <10)

Git Status:
  ✅ Clean working tree
  Branch: features/fab-button
  Ahead: 3 commits

Session:
  ✅ ACTIVE: fab-button-animation
  Progress: 8/8 tasks (100%)
  Status: Ready to commit

Recommendations:
  1. Consider addressing 2 Roslynator suggestions
  2. Ready to commit changes
  3. All validation checks passed

Next: git commit -m "feat: FAB pulse animation"
```

### Example 2: Build Failure
```markdown
You: #file:KDS/prompts/user/validate.md

KDS:
❌ SYSTEM HEALTH: CRITICAL

Build:
  ❌ FAILED (3 errors, 5 warnings)
  Duration: 2.1s

Errors:
  1. HostControlPanelContent.razor(157,34): Syntax error - missing semicolon
  2. FabService.cs(42,12): Cannot resolve symbol 'PulseAnimation'
  3. NotificationHub.cs(89,5): Method 'OnQuestionReceived' not found

Tests: SKIPPED (build must pass first)

Git Status:
  ⚠️  Modified: 6 files
  Branch: features/fab-button

Action Required:
  Fix build errors before continuing.
  
After fixing:
  #file:KDS/prompts/user/validate.md

Next: Fix build errors listed above
```

### Example 3: Test Failures
```markdown
You: #file:KDS/prompts/user/validate.md

KDS:
⚠️ SYSTEM HEALTH: DEGRADED

Build:
  ✅ PASSING (0 errors, 0 warnings)

Tests:
  ⚠️  Playwright: 45/47 passing (2 failures)
  ✅ Unit Tests: 123/123 passing
  ✅ Integration: 18/18 passing
  Total: 186/188 (99%)

Failed Tests:
  1. fab-pulse-animation.spec.ts
     "FAB pulse stops after 2 seconds"
     Expected: Pulse class removed
     Actual: Pulse still active
     
  2. share-button-visual.spec.ts
     "Share button hover state"
     Percy: Visual diff detected
     Changed pixels: 234 (1.2%)

Code Quality:
  ✅ Roslynator: 0 critical issues

Git Status:
  ⚠️  Modified: 6 files
  Branch: features/fab-button

Recommendations:
  1. Fix 2 failing Playwright tests
  2. Review Percy visual diff (may be intentional)
  3. Then re-validate

Next: Fix failing tests, then run validate again
```

---

## 🔍 Validation Categories

### 1. Build Validation
```yaml
checks:
  - Compilation succeeds
  - No critical warnings
  - Dependencies resolved
  - Assets bundled

tools:
  - dotnet build
```

### 2. Test Validation
```yaml
checks:
  - All Playwright tests pass
  - All unit tests pass
  - All integration tests pass
  - No flaky tests

tools:
  - npx playwright test
  - dotnet test
```

### 3. Code Quality
```yaml
checks:
  - No critical Roslynator issues
  - Complexity under threshold
  - No code smells

tools:
  - Roslynator (if available)
  - Custom analyzers
```

### 4. File Structure
```yaml
checks:
  - Required files exist
  - Session state valid
  - Git status clean

tools:
  - File system checks
  - JSON validation
```

### 5. Performance (Optional)
```yaml
checks:
  - Build time reasonable
  - Test execution time acceptable
  - No memory leaks detected

tools:
  - dotnet build --time
  - Playwright --reporter=html
```

---

## 🎯 Health Status Levels

### ✅ HEALTHY
```
All checks passing:
  - Build: ✅ PASSING
  - Tests: ✅ 100% passing
  - Quality: ✅ No critical issues
  - Git: ✅ Clean (or staged changes only)
  
Action: Ready to commit!
```

### ⚠️ DEGRADED
```
Minor issues detected:
  - Build: ✅ PASSING (with warnings)
  - Tests: ⚠️  >95% passing (some failures)
  - Quality: ⚠️  Non-critical issues
  - Git: ⚠️  Uncommitted changes
  
Action: Fix warnings/failures before committing
```

### ❌ CRITICAL
```
Major issues detected:
  - Build: ❌ FAILED
  - Tests: ❌ <95% passing
  - Quality: ❌ Critical issues
  - Git: ❌ Conflicts or corruption
  
Action: STOP and fix critical issues immediately
```

---

## ⏱️ When to Validate

### Before Committing (Always)
```markdown
(Feature work complete)

You: #file:KDS/prompts/user/validate.md
(Check health)

If HEALTHY:
  git commit -m "feat: ..."
  
If DEGRADED or CRITICAL:
  Fix issues first
```

### After Major Changes
```markdown
(Refactored large component)

You: #file:KDS/prompts/user/validate.md
(Ensure nothing broke)
```

### Debugging Issues
```markdown
(Something seems wrong)

You: #file:KDS/prompts/user/validate.md
(Get comprehensive status)
```

### After Resuming Work
```markdown
(New chat, resuming yesterday's work)

You: #file:KDS/prompts/user/resume.md
You: #file:KDS/prompts/user/validate.md
(Ensure system still healthy)
```

---

## 🔧 Behind the Scenes

### This Prompt Loads:
```markdown
#file:KDS/prompts/internal/health-validator.md
```

### Health Validator Runs:
```bash
# Build
dotnet build SPA/NoorCanvas/NoorCanvas.csproj

# Tests
npx playwright test
dotnet test

# Quality (if available)
pwsh Workspaces/CodeQuality/run-roslynator.ps1

# Git status
git status
```

### Health Validator Reads:
```markdown
#file:KDS/sessions/current-session.json (session state)
#file:KDS/governance/rules.md (validation rules)
#file:KDS/tooling/tooling-inventory.json (available tools)
```

---

## 📊 Detailed Reports

### Build Report
```
=== BUILD REPORT ===

Project: SPA/NoorCanvas/NoorCanvas.csproj
Status: ✅ PASSING
Duration: 4.2s

Warnings:
  - HostService.cs(45): Unused variable 'result'
  - ParticipantService.cs(92): Obsolete method usage

Errors: None

Restore: ✅ All packages restored
Publish: Ready
```

### Test Report
```
=== TEST REPORT ===

Playwright Tests:
  ✅ 47/47 passing (100%)
  Duration: 12.3s
  
Unit Tests:
  ✅ 123/123 passing (100%)
  Coverage: 87%
  Duration: 3.1s
  
Integration Tests:
  ✅ 18/18 passing (100%)
  Duration: 8.7s

Total: 188/188 (100%)
Total Duration: 24.1s
```

### Quality Report
```
=== CODE QUALITY REPORT ===

Roslynator Analysis:
  ✅ 0 errors
  ✅ 0 warnings
  ⚠️  2 suggestions
  
Suggestions:
  1. HostService.cs(67): Use 'var' instead of explicit type
  2. SessionController.cs(123): Simplify LINQ expression

Complexity Metrics:
  Average: 4.2 (target: <10)
  Max: 12 (SessionController.ExportToPdf)
  Files >10: 1

Code Smells: None detected
```

---

## ✅ Success Criteria

**Validation succeeds when:**
- ✅ Build passing
- ✅ All tests passing (or >95% with explanation)
- ✅ No critical quality issues
- ✅ Git status clean or intentionally modified
- ✅ Session state valid (if applicable)

---

## 🚀 After Validation

### If HEALTHY
```markdown
✅ System ready to commit!

Next:
  git add [files]
  git commit -m "feat: [feature description]"
  git push origin [branch]
```

### If DEGRADED
```markdown
⚠️ Fix non-critical issues:

1. Address test failures
2. Fix warnings (if time permits)
3. Re-validate

Next: #file:KDS/prompts/user/validate.md
```

### If CRITICAL
```markdown
❌ STOP and fix critical issues:

1. Fix build errors (blocking)
2. Fix failing tests
3. Resolve git conflicts
4. Re-validate

Next: Fix issues, then #file:KDS/prompts/user/validate.md
```

---

**Validate before every commit!** ✅
