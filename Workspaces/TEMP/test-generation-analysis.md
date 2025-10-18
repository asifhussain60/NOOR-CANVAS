# Test Generation Prompt Analysis & Updates

## Date: October 18, 2025

---

## Question 1: Does test-generation.prompt.md enforce orchestration script requirements?

### Answer: YES, with clarifications

**Current Enforcement (Lines 15-100):**
- Section: "ABSOLUTE MANDATE: ALL PLAYWRIGHT TESTS REQUIRE ORCHESTRATION SCRIPTS"
- Explicitly states: "Direct execution of `npx playwright test` is PROHIBITED"
- Provides complete PowerShell orchestration script template
- Documents WHY orchestration is mandatory (environment isolation, DevMode setup, health checks)

**Two Approved Approaches:**

1. **PowerShell Orchestration Scripts** (Preferred for E2E Tests with DevMode)
   - Launches app in SEPARATE elevated PowerShell window
   - Visible window with app logs
   - Explicit `ASPNETCORE_ENVIRONMENT=Development` environment variable control
   - Health check retry logic
   - Runs Playwright tests in current terminal
   - **Separation Achieved**: App in separate window, tests in terminal

2. **Playwright's webServer Config** (For Visual Regression / Simple Tests)
   - Runs `dotnet run` as invisible background subprocess within Node.js
   - Automatic lifecycle management (start → wait → test → stop)
   - **Limitation**: Cannot set environment variables properly for DevMode
   - **Separation Achieved**: App in background process, tests in terminal

**CRITICAL UPDATE MADE:**
- Added "PowerShell Script Character Encoding Rules" section (Line ~58)
- Mandates ASCII-only characters in generated PowerShell scripts
- No emojis, Unicode, or special characters
- Provides ASCII alternatives: `[OK]`, `[FAIL]`, `[WARN]`, etc.

---

## Question 2: Do all prompts know to hand off test requests to test-generation.prompt.md?

### Answer: PARTIALLY - Updated to make explicit

**Current State:**

### task.prompt.md
- **Before Update**: Referenced `shared/playwright-test-generation.md` but didn't explicitly say to invoke test-generation.prompt.md
- **After Update (Line 451-475)**: Added explicit "Delegation Protocol" with parameters to pass:
  ```
  1. Detect if task involves UI changes
  2. Invoke test-generation.prompt.md with parameters
  3. Receive generated test files
  4. Document in key-data-stream
  ```

### question.prompt.md
- **Status**: ALREADY COMPLIANT (Lines 18-48)
- Has explicit "Test Generation Routing Mandate" section
- Routes to test-generation.prompt.md when user asks "how do I test X?"
- Provides formatted handoff instructions with parameters

### refactor.prompt.md
- **Status**: CORRECTLY DOES NOT DELEGATE
- Refactoring is behavior-preserving (shouldn't require new tests)
- Mentions running existing tests for validation
- This is correct - refactor doesn't generate new tests

### Other Prompts
- `analyze-learning.prompt.md`: Read-only analysis, doesn't create tests ✓
- `commit.prompt.md`: Documentation, doesn't create tests ✓
- `healthcheck.prompt.md`: Validation, doesn't create tests ✓
- `sync.prompt.md`: Code synchronization, doesn't create tests ✓

**Verdict**: All prompts that SHOULD hand off to test-generation now DO SO explicitly.

---

## Question 3: Update test-generation.prompt.md to never use emojis/special characters in PowerShell scripts

### Answer: COMPLETED

**Changes Made:**

1. **New Section Added (Line ~58)**: "CRITICAL: PowerShell Script Character Encoding Rules"
   - Mandates ASCII characters ONLY
   - No emojis, Unicode, or special characters
   - Lists ASCII alternatives for visual indicators
   - Explains reasons (encoding issues, portability)

2. **Template Updated (Line 43)**:
   - Changed: `Write-Host "✓ App Ready"` 
   - To: `Write-Host "[OK] App Ready"`

3. **Documentation Updated (Lines 64-73)**:
   - Changed: `✅ Separate PowerShell window...`
   - To: `[YES] Separate PowerShell window...`
   - Changed: `❌ Direct npx playwright test...`
   - To: `[NO] Direct npx playwright test...`
   - Changed: `⚠️ CRITICAL CLARIFICATION`
   - To: `WARNING: CRITICAL CLARIFICATION`

4. **Success Criteria Updated (Lines 487-495)**:
   - Changed: `✅ Uses canonical Session 212...`
   - To: `[PASS] Uses canonical Session 212...`

**ASCII Alternatives Guide Added:**
```
✓ → [OK], [PASS], [YES]
✗ → [FAIL], [ERROR], [NO]
⚠ → WARNING:, [WARN], CAUTION:
● → -, *
```

---

## Updated Workflow Integration (Lines 499-530)

**Enhanced Handoff Documentation:**

### Parameters Received:
- `feature`: Feature name (e.g., "debug-panel-islamic-questions")
- `scenario`: Test scenario (e.g., "random-question-broadcast")
- `endpoints`: API endpoints involved
- `tokens`: Session 212 defaults or overrides
- `multiUser`: Boolean for multi-browser tests
- `testType`: "functional" | "visual" | "both"

### Artifacts Generated:
1. TypeScript test file: `Workspaces/TEMP/{feature}-{test-type}.spec.ts`
2. PowerShell orchestration script: `Scripts/run-{feature}-e2e-test.ps1` (ASCII-only)
3. Execution instructions
4. Server management guidance

### Key Data Stream Template:
```markdown
## Test Coverage
- **Test File**: Workspaces/TEMP/{feature}-{test-type}.spec.ts
- **Orchestration Script**: Scripts/run-{feature}-e2e-test.ps1
- **Test Type**: {Functional E2E | Visual Regression | Both}
- **Session Data**: Session 212 (Host: PQ9N5YWW, User: KJAHA99L)
- **Execution**: `.\Scripts\run-{feature}-e2e-test.ps1`
- **Expected Result**: {description}
```

---

## Summary of Updates

### Files Modified:
1. ✓ `.github/prompts/test-generation.prompt.md`
   - Added PowerShell ASCII character encoding mandate
   - Removed all emojis from templates and documentation
   - Enhanced workflow integration section
   - Updated output format to include orchestration script generation

2. ✓ `.github/prompts/task.prompt.md`
   - Added explicit delegation protocol to test-generation.prompt.md
   - Documented parameters to pass during handoff
   - Clarified when to skip test generation

### Verification:
- [PASS] Orchestration script requirements enforced
- [PASS] Separation requirement met (app in separate window OR background process)
- [PASS] All relevant prompts know to delegate test requests
- [PASS] ASCII-only mandate for PowerShell scripts
- [PASS] Clear handoff protocol documented

---

## Recommended Next Steps

1. **Test the updates**: Generate a new test using task.prompt.md to verify:
   - Proper delegation to test-generation.prompt.md
   - ASCII-only PowerShell script generation
   - Orchestration script works correctly

2. **Update existing scripts**: Review `Scripts/run-*.ps1` files for emoji usage:
   ```powershell
   # Find scripts with potential emoji issues
   Get-ChildItem "D:\PROJECTS\NOOR CANVAS\Scripts\*.ps1" | 
     Select-String -Pattern "[\u2713\u2717\u26A0]" -List
   ```

3. **Document in shared library**: Add ASCII alternatives to `shared/playwright-test-generation.md`

---

## Reference Implementation

**Example ASCII-only Orchestration Script:**

```powershell
# Scripts/run-feature-e2e-test.ps1

# Step 1: Kill existing processes
Get-Process -Name "NoorCanvas" -ErrorAction SilentlyContinue | Stop-Process -Force

# Step 2: Launch app in separate window
$startupScript = @"
cd 'd:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas'
`$env:ASPNETCORE_ENVIRONMENT = 'Development'
dotnet run
"@
$startupScript | Out-File "$env:TEMP\noorcanvas-startup.ps1" -Encoding UTF8
Start-Process powershell -ArgumentList "-NoProfile","-ExecutionPolicy","Bypass","-File","$env:TEMP\noorcanvas-startup.ps1" -Verb RunAs

# Step 3: Health check (ASCII-only)
$healthCheckRetries = 10
for ($i = 1; $i -le $healthCheckRetries; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "https://localhost:9091" -Method HEAD -SkipCertificateCheck -TimeoutSec 5
        Write-Host "[OK] App Ready" -ForegroundColor Green
        break
    }
    catch {
        Write-Host "  Waiting for app ($i/$healthCheckRetries)..." -ForegroundColor Gray
        Start-Sleep -Seconds 3
    }
}

# Step 4: Execute tests
npx playwright test Tests/UI/feature.spec.ts --reporter=list --headed

# Step 5: Cleanup
Get-Process -Name "NoorCanvas" -ErrorAction SilentlyContinue | Stop-Process -Force
```

---

End of Analysis
