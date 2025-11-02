# Rule: Playwright Orchestration

**ID:** `playwright-orchestration`  
**Version:** 1.0.0  
**Created:** 2025-10-30  
**Category:** testing  
**Severity:** critical  
**Applies To:** plan, task (test-related work)

---

## Rule Statement

**Summary:** Use dotnet orchestration scripts for Playwright tests; NEVER use nested PowerShell processes or deprecated standalone mode.

**Detailed Description:**
This rule enforces proper app orchestration for Playwright end-to-end tests by requiring dedicated PowerShell scripts that launch the application in a separate window using direct `dotnet.exe` invocation. This eliminates nested process hierarchies, provides faster health checks, and ensures reliable cleanup.

**Why This Matters:**
- **Process isolation**: App runs in separate window, not nested in PowerShell
- **Faster health checks**: Direct HTTP checks vs. waiting for port binding
- **Reliable cleanup**: Process handle enables forced termination
- **Debugging**: Separate window shows app logs during test failures
- **Resource management**: Prevents orphaned processes consuming ports

---

## 🎯 Protocol

**Launch app in SEPARATE WINDOW using dotnet orchestration scripts:**

### Step 1: Use Orchestration Scripts ✅

**Pattern:** `Scripts/run-{feature}-tests.ps1`

**Examples:**
- `Scripts/run-hcp-fab-button-tests.ps1`
- `Scripts/run-debug-panel-percy-tests.ps1`
- `Scripts/run-transcript-canvas-visual-tests.ps1`

**NOT:**
- `npx playwright test` directly in terminal
- `dotnet run` in terminal before tests
- Ad-hoc PowerShell commands

### Step 2: Launch App with Direct dotnet.exe ✅

**Correct:**
```powershell
$appProcess = Start-Process -FilePath "dotnet" `
                            -ArgumentList "run" `
                            -WorkingDirectory "SPA\NoorCanvas" `
                            -WindowStyle Normal `
                            -PassThru
```

**Why:**
- Uses `dotnet.exe` directly (no PowerShell nesting)
- Returns process handle for cleanup
- Opens separate window for visibility

**NOT:**
- `Start-Job { dotnet run }` (PowerShell job)
- `& dotnet run` (background operator)
- `dotnet run` in terminal (blocks execution)

### Step 3: Health Check with Port Binding + HTTP ✅

**Correct:**
```powershell
$appReady = $false
$attempt = 0
while (-not $appReady -and $attempt -lt 30) {
    $attempt++
    try {
        $response = Invoke-WebRequest -Uri "https://localhost:9091" `
                                      -SkipCertificateCheck `
                                      -TimeoutSec 2 `
                                      -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) { 
            $appReady = $true 
        }
    } catch {
        Start-Sleep -Seconds 2
    }
}

if (-not $appReady) {
    Write-Error "App failed to start within timeout"
    $appProcess | Stop-Process -Force
    exit 1
}
```

**Why:**
- HTTP check confirms app actually responding (not just port bound)
- `-SkipCertificateCheck` handles local HTTPS
- Timeout prevents infinite waiting
- Cleanup on failure

**NOT:**
- `Start-Sleep -Seconds 15` (arbitrary wait)
- Port check only (no HTTP validation)
- No timeout handling

### Step 4: Support Flags ✅

**Required Flags:**
- `-Headed`: Run tests with visible browser (debugging)
- `-KeepAppRunning`: Leave app running after tests (manual verification)

**Implementation:**
```powershell
param(
    [switch]$Headed,
    [switch]$KeepAppRunning
)

# Use flag in Playwright command
if ($Headed) {
    npx playwright test {file} --headed --reporter=list
} else {
    npx playwright test {file} --reporter=list
}

# Use flag for cleanup
if (-not $KeepAppRunning) {
    $appProcess | Stop-Process -Force
}
```

### Step 5: Prohibited Patterns ❌

**NEVER use:**
- `dotnet run` in terminal (blocks, no cleanup)
- `PW_MODE=standalone` (deprecated)
- `webServer` config in playwright.config.ts (deprecated)
- `Start-Job` (nested PowerShell process)
- PowerShell background operator `&` (no handle)
- `npx playwright test` without orchestration

---

## 🔍 Validation Algorithm

**Function Name:** `ValidatePlaywrightOrchestration(testCommand)`

```
FUNCTION ValidatePlaywrightOrchestration(testCommand):
  
  # Step 1: Check if using orchestration script
  orchestrationPattern = "Scripts/run-.*-tests?.ps1"
  
  IF NOT testCommand.Matches(orchestrationPattern) THEN
    
    # Step 2: Check for prohibited patterns
    prohibitedPatterns = [
      "dotnet run",
      "PW_MODE=standalone",
      "webServer",
      "Start-Job",
      "& dotnet",
      "npx playwright test" (without orchestration script context)
    ]
    
    FOR EACH pattern IN prohibitedPatterns:
      IF testCommand.Contains(pattern) THEN
        RETURN {
          violation: true,
          type: "PROHIBITED_PATTERN",
          pattern: pattern,
          command: testCommand,
          message: "Using prohibited Playwright launch pattern"
        }
      END IF
    END FOR
    
    RETURN {
      violation: true,
      type: "NO_ORCHESTRATION_SCRIPT",
      command: testCommand,
      message: "Not using Scripts/run-{feature}-tests.ps1 orchestration"
    }
  END IF
  
  # Step 3: Validate orchestration script uses dotnet.exe directly
  scriptPath = ExtractScriptPath(testCommand)
  script = ReadFile(scriptPath)
  
  IF NOT script.Contains("Start-Process -FilePath \"dotnet\"") THEN
    RETURN {
      violation: true,
      type: "MISSING_DIRECT_DOTNET",
      script: scriptPath,
      message: "Orchestration script not using direct dotnet.exe launch"
    }
  END IF
  
  # Step 4: Validate health check with SSL skip
  IF NOT script.Contains("-SkipCertificateCheck") THEN
    RETURN {
      violation: true,
      type: "MISSING_SSL_SKIP",
      script: scriptPath,
      message: "Health check not using -SkipCertificateCheck"
    }
  END IF
  
  # Step 5: Validate health check has timeout
  IF NOT script.Contains("while (-not $appReady -and $attempt -lt") THEN
    RETURN {
      violation: true,
      type: "MISSING_HEALTH_TIMEOUT",
      script: scriptPath,
      message: "Health check missing timeout logic"
    }
  END IF
  
  # Step 6: Validate cleanup logic
  IF NOT script.Contains("Stop-Process") THEN
    RETURN {
      violation: true,
      type: "MISSING_CLEANUP",
      script: scriptPath,
      message: "Orchestration script missing cleanup logic"
    }
  END IF
  
  # Step 7: Validate flag support
  IF NOT script.Contains("param(") OR NOT script.Contains("[switch]$Headed") THEN
    WARN("Orchestration script should support -Headed flag")
  END IF
  
  IF NOT script.Contains("[switch]$KeepAppRunning") THEN
    WARN("Orchestration script should support -KeepAppRunning flag")
  END IF
  
  RETURN { violation: false }
  
END FUNCTION
```

---

## 🛑 Enforcement Action

**Auto-Fix Available:** no (requires manual script creation)

```
IF ValidatePlaywrightOrchestration(command).violation THEN
  
  # Step 1: Log violation
  LogViolation(".github/audits/mandate-violations.log", {
    timestamp: Now(),
    rule: "PLAYWRIGHT_ORCHESTRATION",
    command: command,
    violation: validationResult,
    violationType: validationResult.type
  })
  
  # Step 2: HALT execution
  SHOW_ERROR("MANDATE VIOLATION: Not using Playwright orchestration script")
  SHOW_FIX("Use: Scripts/run-{feature}-tests.ps1 (see PlaywrightTestOrchestration.md)")
  
  # Step 3: Show specific fix based on violation type
  IF validationResult.type == "NO_ORCHESTRATION_SCRIPT" THEN
    SHOW_INFO("Create orchestration script: Scripts/run-{feature}-tests.ps1")
    SHOW_TEMPLATE(OrchestrationScriptTemplate)
    
  ELSE IF validationResult.type == "PROHIBITED_PATTERN" THEN
    SHOW_INFO("Prohibited pattern: " + validationResult.pattern)
    SHOW_FIX("Replace with orchestration script pattern")
    
  ELSE IF validationResult.type == "MISSING_DIRECT_DOTNET" THEN
    SHOW_INFO("Update script: Use Start-Process -FilePath \"dotnet\"")
    SHOW_EXAMPLE("$appProcess = Start-Process -FilePath \"dotnet\" -ArgumentList \"run\" -PassThru")
    
  ELSE IF validationResult.type == "MISSING_SSL_SKIP" THEN
    SHOW_INFO("Update health check: Add -SkipCertificateCheck")
    SHOW_EXAMPLE("Invoke-WebRequest -Uri \"https://localhost:9091\" -SkipCertificateCheck")
    
  END IF
  
  # Step 4: Block execution
  EXIT 1
  
END IF
```

---

## 📄 Orchestration Script Template

**File:** `Scripts/run-{feature}-tests.ps1`

```powershell
<#
.SYNOPSIS
    Orchestrates Playwright tests for {feature} by launching app in separate window.

.DESCRIPTION
    This script:
    1. Cleans up existing NoorCanvas processes
    2. Launches app in separate window (visible for debugging)
    3. Waits for app to be healthy (HTTP check with SSL skip)
    4. Runs Playwright tests
    5. Cleans up app process (unless -KeepAppRunning)

.PARAMETER Headed
    Run tests with visible browser (for debugging).

.PARAMETER KeepAppRunning
    Leave app running after tests complete (for manual verification).

.EXAMPLE
    .\run-{feature}-tests.ps1
    Runs tests headless, kills app after.

.EXAMPLE
    .\run-{feature}-tests.ps1 -Headed -KeepAppRunning
    Runs tests with visible browser, leaves app running.
#>

param(
    [switch]$Headed,
    [switch]$KeepAppRunning
)

# === 1. CLEANUP EXISTING PROCESSES ===
Write-Host "Cleaning up existing NoorCanvas processes..." -ForegroundColor Cyan
Get-Process -Name "NoorCanvas" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# === 2. LAUNCH APP (SEPARATE WINDOW) ===
Write-Host "Launching NoorCanvas in separate window..." -ForegroundColor Cyan

$appProcess = Start-Process -FilePath "dotnet" `
                            -ArgumentList "run" `
                            -WorkingDirectory "$PSScriptRoot\..\SPA\NoorCanvas" `
                            -WindowStyle Normal `
                            -PassThru

Write-Host "App launched (PID: $($appProcess.Id))" -ForegroundColor Green

# === 3. HEALTH CHECK (PORT + HTTP) ===
Write-Host "Waiting for app to be healthy..." -ForegroundColor Cyan

$appReady = $false
$attempt = 0
$maxAttempts = 30

while (-not $appReady -and $attempt -lt $maxAttempts) {
    $attempt++
    Write-Host "  Attempt $attempt/$maxAttempts..." -NoNewline
    
    try {
        $response = Invoke-WebRequest -Uri "https://localhost:9091" `
                                      -SkipCertificateCheck `
                                      -TimeoutSec 2 `
                                      -ErrorAction SilentlyContinue
        
        if ($response.StatusCode -eq 200) {
            $appReady = $true
            Write-Host " Ready!" -ForegroundColor Green
        }
    } catch {
        Write-Host " Not ready" -ForegroundColor Yellow
        Start-Sleep -Seconds 2
    }
}

if (-not $appReady) {
    Write-Host "ERROR: App failed to start within timeout" -ForegroundColor Red
    $appProcess | Stop-Process -Force
    exit 1
}

# === 4. RUN PLAYWRIGHT TESTS ===
Write-Host "Running Playwright tests..." -ForegroundColor Cyan

$testArgs = @("playwright", "test", "Tests/UI/{test-file}.spec.ts", "--reporter=list")

if ($Headed) {
    $testArgs += "--headed"
    Write-Host "  Mode: Headed (browser visible)" -ForegroundColor Yellow
}

try {
    npx @testArgs
    $testExitCode = $LASTEXITCODE
} catch {
    Write-Host "ERROR: Test execution failed" -ForegroundColor Red
    $testExitCode = 1
}

# === 5. CLEANUP ===
if (-not $KeepAppRunning) {
    Write-Host "Stopping app..." -ForegroundColor Cyan
    $appProcess | Stop-Process -Force
    Write-Host "App stopped" -ForegroundColor Green
} else {
    Write-Host "App left running (PID: $($appProcess.Id))" -ForegroundColor Yellow
    Write-Host "  Navigate to: https://localhost:9091" -ForegroundColor Cyan
}

# === 6. EXIT WITH TEST RESULT ===
exit $testExitCode
```

---

## Related Documentation

**Related Rules:**
- [document-first](../document-first/rule.md) - Document test strategy before creating tests

**Implementation Docs:**
- `.github/instructions/Links/PlaywrightTestOrchestration.md` - Complete orchestration guide

**Example Scripts:**
- `Scripts/run-hcp-fab-button-tests.ps1`
- `Scripts/run-debug-panel-percy-tests.ps1`
- `Scripts/run-transcript-canvas-visual-tests.ps1`

**Examples:**
- See [examples.md](examples.md) in this folder

---

**This rule is SOURCE OF TRUTH until user explicitly changes it.**

**Last Updated:** 2025-10-30  
**Version:** 1.0.0
