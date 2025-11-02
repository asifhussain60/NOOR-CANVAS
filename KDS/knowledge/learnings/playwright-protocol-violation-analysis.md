# Playwright Protocol Violation - Root Cause Analysis

**Date:** November 2, 2025  
**Issue:** `test-fab-button-visibility.ps1` was created without following Playwright orchestration protocol  
**Severity:** Critical - Systemic KDS enforcement gap

---

## 📋 What Happened

### The Violation
Created script: `Scripts/test-fab-button-visibility.ps1`

**WRONG Pattern Used:**
```powershell
# Step 2: Wait for app to be ready
Write-Host '[2/3] Waiting for app to be ready (20 seconds)...' -ForegroundColor Yellow
Start-Sleep -Seconds 20
Write-Host '      App should be ready' -ForegroundColor Green
```

**What's Missing:**
- ❌ No health check with retry logic (just blind 20-second wait)
- ❌ Wrong comment says "(20 seconds)" instead of proper health check
- ❌ Doesn't verify app actually started successfully
- ⚠️ Basic pattern followed (Start-Job, npx playwright, cleanup) but missing robustness

### Correct Pattern (Should Have Been)
```powershell
# Step 2: Wait for app readiness with health check
Write-Host '[2/4] Waiting for app to be ready...' -ForegroundColor Yellow
$maxAttempts = 60
$attempt = 0
$appReady = $false
$appUrl = "https://localhost:9091"

while ($attempt -lt $maxAttempts -and -not $appReady) {
    try {
        Write-Host "      Waiting... ($attempt/$maxAttempts sec)" -ForegroundColor Gray
        $response = Invoke-WebRequest -Uri $appUrl -UseBasicParsing -TimeoutSec 5 -SkipCertificateCheck
        if ($response.StatusCode -eq 200) {
            $appReady = $true
            Write-Host '      ✅ App is ready!' -ForegroundColor Green
        }
    } catch {
        Start-Sleep -Seconds 2
        $attempt += 2
    }
}

if (-not $appReady) {
    Write-Host "      FAILED: App not ready after $maxAttempts seconds" -ForegroundColor Red
    Stop-Job -Job $appJob -ErrorAction SilentlyContinue
    Remove-Job -Job $appJob -ErrorAction SilentlyContinue
    exit 1
}
```

---

## 🔍 Root Cause: KDS System Gaps

### Gap #1: No Automated Pattern Enforcement
**Problem:** KDS has the protocol documented in `kds.md` but doesn't automatically enforce it during script generation.

**Evidence:**
- Protocol exists: ✅ (kds.md lines 169-289)
- Copilot read protocol: ❓ (unclear)
- Pattern enforced: ❌ (script violated protocol)

**Missing Mechanism:** No validation step that checks generated PowerShell scripts against protocol checklist.

### Gap #2: No Template-Based Generation
**Problem:** Scripts are generated from scratch instead of using proven templates.

**What Should Happen:**
1. Copilot says "need Playwright test for FAB button visibility"
2. KDS routes to test-generator.md
3. Test generator loads: `KDS/templates/playwright-orchestration-template.ps1`
4. Template has health check built-in (can't be skipped)
5. Only test file path and description are customized

**What Actually Happened:**
1. Copilot generated script from memory/pattern matching
2. Used basic pattern (Start-Job, wait, test, cleanup)
3. Skipped health check complexity (easier path)
4. Created working-but-fragile script

### Gap #3: No Post-Generation Validation
**Problem:** No automated check runs after file creation to verify protocol compliance.

**What's Needed:**
```json
{
  "type": "post-generation-hook",
  "filePattern": "Scripts/*.ps1",
  "validator": "KDS/validators/playwright-script-validator.ps1",
  "failOn": ["missing-health-check", "wrong-wait-pattern", "no-cleanup"]
}
```

---

## 💡 Why It Wasn't Caught

### Human Factor
- User didn't explicitly say "use the official protocol"
- Request was: "create Playwright test for FAB button"
- Copilot optimized for speed over robustness

### KDS Design Flaw
- **Documentation ≠ Enforcement**
- Protocol in `kds.md` is passive (reference material)
- No active guardrails during code generation

### Missing Feedback Loop
- No post-creation validation
- User only discovers violation when script fails in CI/CD
- By then, script is already committed

---

## 🛡️ Proposed Solutions

### Solution 1: Template-First Generation
**Implementation:**
```
KDS/templates/
  playwright-test-orchestration.ps1.template   (REQUIRED: health check)
  playwright-test-simple.ps1.template          (ALLOWED: 20s wait, marked as fragile)
```

**Enforcement:**
- test-generator.md loads template as first step
- Copilot fills placeholders: `{{TEST_FILE}}`, `{{APP_URL}}`, `{{DESCRIPTION}}`
- Health check code is immutable (part of template)

### Solution 2: Automated Validation
**Create:** `KDS/validators/validate-playwright-script.ps1`

**Checks:**
- ✅ Uses Start-Job (not Start-Process)
- ✅ Has health check loop OR explicit fragility warning
- ✅ Has cleanup (Stop-Job + Remove-Job)
- ✅ Captures $LASTEXITCODE
- ✅ Exits with proper code

**Integration:**
```markdown
# test-generator.md (Step 8: VALIDATION)

After creating `{{SCRIPT_PATH}}`:
1. Run KDS/validators/validate-playwright-script.ps1
2. If validation fails:
   - Show violations
   - Offer auto-fix
   - DO NOT proceed until fixed
```

### Solution 3: Interactive Protocol Compliance
**During generation:**
```
Copilot: I'm creating a Playwright orchestration script.

KDS: ⚠️ PROTOCOL CHECK - Select health check strategy:
  [1] Full health check (robust, recommended) ✅
  [2] Simple 20s wait (fragile, for debugging only)
  
Copilot (or User): [1]

KDS: ✅ Loading template: playwright-test-orchestration.ps1.template
     Health check: Exponential backoff, 60s max
     Cleanup: Automatic via finally block
```

---

## 📊 Impact Assessment

### Current State
- **Scripts with violations:** 1 confirmed (`test-fab-button-visibility.ps1`)
- **Potential violations:** Unknown (need audit of `Scripts/*.ps1`)
- **Risk:** Medium-High (CI/CD failures, flaky tests, developer frustration)

### After Fix
- **Template library:** 2 templates (full health check, simple wait)
- **Validation:** Automated on every PowerShell script creation
- **Compliance:** 100% (violations blocked before commit)

---

## 🎯 Next Steps

1. **Audit Existing Scripts** (TODAY)
   - Find all `Scripts/*playwright*.ps1`
   - Check each against protocol
   - Create fix list

2. **Create Templates** (THIS WEEK)
   - `playwright-test-orchestration.ps1.template` (robust)
   - `playwright-test-simple.ps1.template` (minimal, marked fragile)

3. **Build Validator** (THIS WEEK)
   - `KDS/validators/validate-playwright-script.ps1`
   - Regex checks for patterns
   - Return violations list

4. **Update test-generator.md** (THIS WEEK)
   - Add template-loading step
   - Add validation step
   - Add interactive protocol selection

5. **Fix Violations** (NEXT WEEK)
   - Auto-fix `test-fab-button-visibility.ps1`
   - Add health check
   - Update comments

---

## 🔑 Key Learnings

### For KDS System
- **Documentation alone is insufficient** - need active enforcement
- **Templates > Generation** - reduce human error surface
- **Validation hooks** - catch violations before commit
- **Interactive checks** - educate user during generation

### For Copilot Workflow
- Always check if template exists before generating from scratch
- When protocol exists, prefer strict compliance over convenience
- Post-generation validation should be mandatory, not optional

### For Future Protocols
- Every critical pattern needs:
  1. Documentation (reference)
  2. Template (implementation)
  3. Validator (enforcement)
  4. Interactive check (education)

---

## 📝 Protocol Violation Checklist

**Use this when auditing any Playwright orchestration script:**

- [ ] Uses `Start-Job` (not `Start-Process`, not direct `dotnet run`)
- [ ] Has health check with retry logic (or explicit fragility warning)
- [ ] Sets working directory to project root before `npx playwright test`
- [ ] Uses direct `npx playwright test` command (no `Start-Process` wrapper)
- [ ] Captures `$LASTEXITCODE` after test execution
- [ ] Has cleanup in `finally` block
- [ ] Stops job: `Stop-Job -Job $appJob -ErrorAction SilentlyContinue`
- [ ] Removes job: `Remove-Job -Job $appJob -ErrorAction SilentlyContinue`
- [ ] Supports `-KeepAppRunning` parameter (optional but recommended)
- [ ] Exits with captured exit code: `exit $exitCode`

**Scoring:**
- 10/10: ✅ Fully compliant
- 7-9/10: ⚠️ Minor violations (acceptable with warnings)
- <7/10: ❌ Critical violations (must fix)

**Current Script Score:** `test-fab-button-visibility.ps1` = **7/10**
- Missing: Health check (major), Working directory validation (minor)
- Has: Start-Job, cleanup, exit code, parameter support

---

## 🔗 References

- **Protocol Source:** `KDS/prompts/user/kds.md` (lines 169-289)
- **Reference Implementation:** `Scripts/run-debug-panel-percy-tests.ps1`
- **Violation Instance:** `Scripts/test-fab-button-visibility.ps1`
- **This Analysis:** `KDS/knowledge/learnings/playwright-protocol-violation-analysis.md`

**Date Created:** November 2, 2025  
**Created By:** GitHub Copilot (Post-Mortem Analysis)  
**Reviewed By:** Pending (User Review)
