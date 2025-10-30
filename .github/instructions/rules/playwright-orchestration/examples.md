# Examples: Playwright Orchestration

## ✅ Compliant Examples

### Example 1: Standard Orchestration Script

**Context:** Creating tests for HCP FAB button feature

**Compliant Approach:**

**File:** `Scripts/run-hcp-fab-button-tests.ps1`

```powershell
param(
    [switch]$Headed,
    [switch]$KeepAppRunning
)

# Cleanup
Get-Process -Name "NoorCanvas" -ErrorAction SilentlyContinue | Stop-Process -Force

# Launch app (separate window)
$appProcess = Start-Process -FilePath "dotnet" `
                            -ArgumentList "run" `
                            -WorkingDirectory "$PSScriptRoot\..\SPA\NoorCanvas" `
                            -WindowStyle Normal `
                            -PassThru

# Health check
$appReady = $false
$attempt = 0
while (-not $appReady -and $attempt -lt 30) {
    $attempt++
    try {
        $response = Invoke-WebRequest -Uri "https://localhost:9091" `
                                      -SkipCertificateCheck `
                                      -TimeoutSec 2 `
                                      -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) { $appReady = $true }
    } catch {
        Start-Sleep -Seconds 2
    }
}

if (-not $appReady) {
    $appProcess | Stop-Process -Force
    exit 1
}

# Run tests
$testArgs = @("playwright", "test", "Tests/UI/hcp-fab-button.spec.ts", "--reporter=list")
if ($Headed) { $testArgs += "--headed" }

npx @testArgs
$exitCode = $LASTEXITCODE

# Cleanup
if (-not $KeepAppRunning) {
    $appProcess | Stop-Process -Force
}

exit $exitCode
```

**Run:**
```powershell
.\Scripts\run-hcp-fab-button-tests.ps1
```

**Why Compliant:**
- Uses orchestration script (not ad-hoc commands)
- Direct `dotnet.exe` launch (no Start-Job)
- HTTP health check with `-SkipCertificateCheck`
- Supports `-Headed` and `-KeepAppRunning` flags
- Proper cleanup logic

---

### Example 2: Visual Regression Testing (Percy)

**Context:** Percy visual regression tests for debug panel

**Compliant Approach:**

**File:** `Scripts/run-debug-panel-percy-tests.ps1`

```powershell
param(
    [switch]$KeepAppRunning
)

# Cleanup
Get-Process -Name "NoorCanvas" -ErrorAction SilentlyContinue | Stop-Process -Force

# Launch app
Write-Host "Launching app for Percy tests..." -ForegroundColor Cyan
$appProcess = Start-Process -FilePath "dotnet" `
                            -ArgumentList "run" `
                            -WorkingDirectory "$PSScriptRoot\..\SPA\NoorCanvas" `
                            -WindowStyle Normal `
                            -PassThru

# Health check (same as Example 1)
# ... health check code ...

# Run Percy tests
Write-Host "Running Percy visual regression tests..." -ForegroundColor Cyan
$env:PERCY_TOKEN = "your-percy-token"
npx percy exec -- npx playwright test Tests/UI/debug-panel-percy.spec.ts --reporter=list

$exitCode = $LASTEXITCODE

# Cleanup
if (-not $KeepAppRunning) {
    Write-Host "Stopping app..." -ForegroundColor Cyan
    $appProcess | Stop-Process -Force
}

exit $exitCode
```

**Why Compliant:**
- Orchestration script for visual tests
- Percy integration properly scoped
- Same health check pattern
- Process cleanup

---

### Example 3: Multiple Test Files (Suite)

**Context:** Running all transcript canvas tests

**Compliant Approach:**

**File:** `Scripts/run-transcript-canvas-visual-tests.ps1`

```powershell
param(
    [switch]$Headed,
    [switch]$KeepAppRunning
)

# Cleanup and launch (same as Example 1)
# ...

# Run multiple test files
Write-Host "Running transcript canvas test suite..." -ForegroundColor Cyan

$testFiles = @(
    "Tests/UI/transcript-canvas-basic.spec.ts",
    "Tests/UI/transcript-canvas-interactions.spec.ts",
    "Tests/UI/transcript-canvas-visual.spec.ts"
)

$allPassed = $true

foreach ($testFile in $testFiles) {
    Write-Host "  Running: $testFile" -ForegroundColor Yellow
    
    $testArgs = @("playwright", "test", $testFile, "--reporter=list")
    if ($Headed) { $testArgs += "--headed" }
    
    npx @testArgs
    
    if ($LASTEXITCODE -ne 0) {
        $allPassed = $false
        Write-Host "    FAILED" -ForegroundColor Red
    } else {
        Write-Host "    PASSED" -ForegroundColor Green
    }
}

# Cleanup
if (-not $KeepAppRunning) {
    $appProcess | Stop-Process -Force
}

exit ($allPassed ? 0 : 1)
```

**Why Compliant:**
- Single app launch for multiple test files
- Orchestration script handles suite
- Aggregated exit code

---

## ❌ Non-Compliant Examples

### Example 1: Using `dotnet run` in Terminal (VIOLATION)

**Context:** Trying to run tests manually

**Violation:**

```powershell
# Terminal 1: Start app
cd SPA\NoorCanvas
dotnet run

# Terminal 2: Run tests (in another window)
cd Tests/UI
npx playwright test hcp-fab-button.spec.ts
```

**Why Non-Compliant:**
- No orchestration script
- Manual terminal management
- `dotnet run` blocks terminal (can't run other commands)
- No automatic cleanup
- Hard to integrate into CI/CD

**Validation Result:**
```json
{
  "violation": true,
  "type": "PROHIBITED_PATTERN",
  "pattern": "dotnet run",
  "message": "Using prohibited Playwright launch pattern"
}
```

**Fix:**
Create `Scripts/run-hcp-fab-button-tests.ps1` with proper orchestration.

---

### Example 2: Using Start-Job (VIOLATION)

**Context:** Attempting background app launch

**Violation:**

**File:** `run-tests-bad.ps1`

```powershell
# Start app in background job
Start-Job -ScriptBlock {
    cd SPA\NoorCanvas
    dotnet run
}

# Wait a bit
Start-Sleep -Seconds 15

# Run tests
npx playwright test Tests/UI/test.spec.ts

# Cleanup (doesn't work - job still running)
Get-Job | Stop-Job
```

**Why Non-Compliant:**
- Uses `Start-Job` (nested PowerShell process)
- No process handle for cleanup
- Arbitrary sleep (not health check)
- Job cleanup unreliable

**Validation Result:**
```json
{
  "violation": true,
  "type": "PROHIBITED_PATTERN",
  "pattern": "Start-Job",
  "message": "Using prohibited Playwright launch pattern"
}
```

**Fix:**
Use `Start-Process -FilePath "dotnet"` with `-PassThru` to get process handle.

---

### Example 3: Using PW_MODE=standalone (VIOLATION)

**Context:** Old deprecated approach

**Violation:**

**File:** `run-tests-old.ps1`

```powershell
# Set Playwright standalone mode (DEPRECATED)
$env:PW_MODE = "standalone"

# Run tests (Playwright manages app lifecycle)
npx playwright test Tests/UI/test.spec.ts
```

**playwright.config.ts:**
```typescript
export default {
  webServer: {  // DEPRECATED
    command: 'cd SPA/NoorCanvas && dotnet run',
    port: 9091,
    timeout: 60000
  }
}
```

**Why Non-Compliant:**
- Uses deprecated `PW_MODE=standalone`
- Uses deprecated `webServer` config
- No visibility into app launch
- Nested process hierarchy
- Poor error diagnostics

**Validation Result:**
```json
{
  "violation": true,
  "type": "PROHIBITED_PATTERN",
  "pattern": "PW_MODE=standalone",
  "message": "Using prohibited Playwright launch pattern"
}
```

**Fix:**
Remove `PW_MODE` and `webServer`. Create orchestration script.

---

### Example 4: No Health Check (VIOLATION)

**Context:** Script launches app but doesn't verify readiness

**Violation:**

**File:** `Scripts/run-tests-incomplete.ps1`

```powershell
# Launch app
$appProcess = Start-Process -FilePath "dotnet" `
                            -ArgumentList "run" `
                            -WorkingDirectory "SPA\NoorCanvas" `
                            -PassThru

# Just wait arbitrary time (NO HEALTH CHECK)
Start-Sleep -Seconds 15

# Run tests (app might not be ready!)
npx playwright test Tests/UI/test.spec.ts

# Cleanup
$appProcess | Stop-Process -Force
```

**Why Non-Compliant:**
- No health check (arbitrary 15-second wait)
- Tests might run before app ready
- No validation of app health
- Flaky tests (race conditions)

**Validation Result:**
```json
{
  "violation": true,
  "type": "MISSING_HEALTH_TIMEOUT",
  "message": "Health check missing timeout logic"
}
```

**Fix:**
Add HTTP health check with timeout loop.

---

### Example 5: Missing SSL Skip (VIOLATION)

**Context:** Health check fails on local HTTPS

**Violation:**

**File:** `Scripts/run-tests-ssl-issue.ps1`

```powershell
# Health check WITHOUT -SkipCertificateCheck
while (-not $appReady -and $attempt -lt 30) {
    $attempt++
    try {
        # MISSING -SkipCertificateCheck
        $response = Invoke-WebRequest -Uri "https://localhost:9091" `
                                      -TimeoutSec 2
        if ($response.StatusCode -eq 200) { $appReady = $true }
    } catch {
        # Fails due to self-signed cert!
        Start-Sleep -Seconds 2
    }
}
```

**Why Non-Compliant:**
- Missing `-SkipCertificateCheck`
- Health check always fails (self-signed cert error)
- Times out, kills app, exit 1

**Validation Result:**
```json
{
  "violation": true,
  "type": "MISSING_SSL_SKIP",
  "message": "Health check not using -SkipCertificateCheck"
}
```

**Fix:**
Add `-SkipCertificateCheck` to `Invoke-WebRequest`.

---

## 🔍 Edge Cases

### Edge Case 1: App Already Running

**Situation:**
App left running from previous test run (manual or crashed).

**Decision:**
ALWAYS cleanup first (compliant).

**Rationale:**
Old app process might bind port, preventing new launch.

**Pattern:**
```powershell
# ALWAYS start with cleanup
Get-Process -Name "NoorCanvas" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2  # Let port release

# Then launch new instance
$appProcess = Start-Process -FilePath "dotnet" ...
```

---

### Edge Case 2: Multiple Apps (Different Ports)

**Situation:**
Testing microservices (e.g., NoorCanvas + HostProvisioner both needed).

**Decision:**
COMPLIANT - Orchestrate both apps.

**Pattern:**
```powershell
# Launch NoorCanvas
$ncProcess = Start-Process -FilePath "dotnet" -ArgumentList "run" `
                           -WorkingDirectory "SPA\NoorCanvas" -PassThru

# Launch HostProvisioner
$hpProcess = Start-Process -FilePath "dotnet" -ArgumentList "run" `
                           -WorkingDirectory "Tools\HostProvisioner\HostProvisioner" -PassThru

# Health check BOTH apps
# ... check https://localhost:9091 (NoorCanvas)
# ... check https://localhost:5001 (HostProvisioner)

# Run tests

# Cleanup BOTH
$ncProcess | Stop-Process -Force
$hpProcess | Stop-Process -Force
```

---

### Edge Case 3: CI/CD Environment (Headless Only)

**Situation:**
Running tests in CI pipeline (no GUI).

**Decision:**
COMPLIANT - Orchestration script works headless.

**Pattern:**
```yaml
# GitHub Actions / Azure Pipelines
steps:
  - name: Run Playwright Tests
    run: |
      pwsh -File Scripts/run-hcp-fab-button-tests.ps1
    # No -Headed flag = headless mode (default)
```

**Why Compliant:**
- Same orchestration script
- Headless by default (no -Headed flag)
- CI agents have pwsh

---

### Edge Case 4: Debugging Failed Test

**Situation:**
Test failing, need to keep app running for investigation.

**Decision:**
COMPLIANT - Use `-KeepAppRunning` flag.

**Pattern:**
```powershell
# Run with KeepAppRunning
.\Scripts\run-hcp-fab-button-tests.ps1 -Headed -KeepAppRunning

# Test runs (fails), app left running
# Manually navigate to https://localhost:9091
# Inspect app state, reproduce issue

# When done, manually kill app
Get-Process -Name "NoorCanvas" | Stop-Process -Force
```

---

## 📊 Common Patterns

### Pattern 1: Create New Orchestration Script

**When to Use:**
Adding Playwright tests for new feature.

**Steps:**
1. Copy existing orchestration script as template
2. Update test file path
3. Update script name and description
4. Test locally with `-Headed` flag
5. Commit script with tests

**Example:**
```powershell
# Copy template
Copy-Item Scripts\run-hcp-fab-button-tests.ps1 `
          Scripts\run-new-feature-tests.ps1

# Edit: Update test file path
# Line: npx playwright test Tests/UI/hcp-fab-button.spec.ts
# →
# Line: npx playwright test Tests/UI/new-feature.spec.ts

# Test
.\Scripts\run-new-feature-tests.ps1 -Headed

# Commit
git add Scripts\run-new-feature-tests.ps1
git add Tests\UI\new-feature.spec.ts
git commit -m "test(new-feature): Add Playwright tests with orchestration"
```

---

### Pattern 2: Add to VS Code Tasks

**When to Use:**
Make orchestration script runnable from VS Code.

**Steps:**
1. Open `.vscode/tasks.json`
2. Add task for orchestration script
3. Use `run_task` tool

**Example:**
```json
{
  "label": "test-new-feature",
  "type": "shell",
  "command": "powershell.exe",
  "args": [
    "-NoProfile",
    "-ExecutionPolicy", "Bypass",
    "-File", "${workspaceFolder}/Scripts/run-new-feature-tests.ps1"
  ],
  "group": "test"
}
```

**Usage:**
```markdown
Run task: test-new-feature
```

---

### Pattern 3: Integration with Percy

**When to Use:**
Visual regression tests need Percy integration.

**Pattern:**
```powershell
# In orchestration script, before running tests:

# Set Percy token (from environment or secret)
if ($env:PERCY_TOKEN) {
    Write-Host "Percy token found, running with visual snapshots" -ForegroundColor Green
    
    # Run with Percy
    npx percy exec -- npx playwright test Tests/UI/visual.spec.ts --reporter=list
} else {
    Write-Host "No Percy token, skipping visual snapshots" -ForegroundColor Yellow
    
    # Run without Percy (local dev)
    npx playwright test Tests/UI/visual.spec.ts --reporter=list
}
```

---

### Pattern 4: Parallel Test Execution

**When to Use:**
Multiple independent test files can run in parallel.

**Pattern:**
```powershell
# Launch app once
$appProcess = Start-Process -FilePath "dotnet" ...

# Health check
# ...

# Run tests in parallel (Playwright handles workers)
npx playwright test Tests/UI/ --workers=4 --reporter=list

# Cleanup
$appProcess | Stop-Process -Force
```

**Note:** Playwright manages parallelism; orchestration script launches app once.
