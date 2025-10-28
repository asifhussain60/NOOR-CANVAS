# Playwright Test Orchestration Protocol

**Purpose:** Standardized pattern for launching app, running Playwright tests, and cleanup  
**Created:** 2025-10-28  
**Source:** Extracted from successful hcp-fab-button test orchestration  
**Related:** PlaywrightQuickRef.md, PlaywrightTestPaths.MD

---

## Overview

Orchestrated testing pattern for tests requiring live app instance:
1. Cleanup existing processes
2. Launch app in new window
3. Health check (wait for app ready)
4. Run Playwright tests
5. Cleanup or keep running (for debugging)

**Use Cases:**
- Host Control Panel tests
- Session Canvas tests
- Full workflow tests requiring SignalR connections
- Visual regression tests with Percy

---

## PowerShell Orchestrator Template

### Basic Structure

```powershell
param(
    [switch]$KeepAppRunning,
    [string]$TestPattern = "your-test.spec.ts",
    [switch]$Headed
)

$ErrorActionPreference = "Stop"
$appProcess = $null
$appUrl = "https://localhost:9091"
$testPath = "Tests/UI/$TestPattern"

try {
    # Step 1: Cleanup
    # Step 2: Launch app
    # Step 3: Health check
    # Step 4: Run tests
    # Step 5: Cleanup
} catch {
    # Emergency cleanup
} finally {
    # Ensure cleanup
}
```

### Complete Example

See: `Scripts/run-hcp-fab-button-tests.ps1` for full implementation

---

## Implementation Patterns

### 1. Process Cleanup

```powershell
Write-Host "`n📍 Step 1: Cleaning up existing processes..." -ForegroundColor Cyan
$existingProcesses = Get-Process -Name "NoorCanvas" -ErrorAction SilentlyContinue
if ($existingProcesses) {
    Write-Host "   Found $($existingProcesses.Count) existing NoorCanvas process(es)" -ForegroundColor Yellow
    $existingProcesses | Stop-Process -Force
    Start-Sleep -Seconds 2
    Write-Host "   ✅ Existing processes terminated" -ForegroundColor Green
} else {
    Write-Host "   ✅ No existing processes found" -ForegroundColor Green
}
```

**Why:** Prevents port conflicts, ensures clean state

---

### 2. App Launch

```powershell
Write-Host "`n📍 Step 2: Launching NoorCanvas app..." -ForegroundColor Cyan
$appPath = "SPA\NoorCanvas"

Write-Host "   Starting app in new window..." -ForegroundColor Yellow
$appProcess = Start-Process -FilePath "dotnet" `
                            -ArgumentList "run" `
                            -WorkingDirectory $appPath `
                            -WindowStyle Normal `
                            -PassThru

if ($appProcess) {
    Write-Host "   ✅ App launched (PID: $($appProcess.Id))" -ForegroundColor Green
} else {
    throw "Failed to launch app"
}
```

**Key Points:**
- `-WindowStyle Normal` - Visible window for debugging
- `-PassThru` - Returns process object for cleanup
- Store `$appProcess` for later cleanup

---

### 3. Health Check with SSL Certificate Skip

```powershell
Write-Host "`n📍 Step 3: Waiting for app to be ready..." -ForegroundColor Cyan
$maxAttempts = 30
$attempt = 0
$appReady = $false

while (-not $appReady -and $attempt -lt $maxAttempts) {
    $attempt++
    Write-Host "   Attempt $attempt/$maxAttempts..." -ForegroundColor Gray
    
    try {
        # Use -SkipCertificateCheck for localhost HTTPS (PowerShell 7+)
        $response = Invoke-WebRequest -Uri $appUrl `
                                      -Method GET `
                                      -TimeoutSec 2 `
                                      -UseBasicParsing `
                                      -SkipCertificateCheck `
                                      -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $appReady = $true
            Write-Host "   ✅ App is ready! (HTTP 200)" -ForegroundColor Green
        }
    } catch {
        Start-Sleep -Seconds 2
    }
}

if (-not $appReady) {
    throw "App failed to start after $maxAttempts attempts"
}

# Additional wait for full initialization
Write-Host "   Waiting additional 5 seconds for full initialization..." -ForegroundColor Gray
Start-Sleep -Seconds 5
```

**SSL Certificate Handling:**
- ✅ **Use:** `-SkipCertificateCheck` (PowerShell 7+ feature)
- ❌ **Don't use:** `ICertificatePolicy` (deprecated)
- ❌ **Don't use:** `ServerCertificateValidationCallback` (obsolete - SYSLIB0014)

**Health Check Parameters:**
- Max attempts: 30 (60 seconds total)
- Interval: 2 seconds
- Extra wait: 5 seconds for SignalR, Blazor initialization

---

### 4. Run Playwright Tests

```powershell
Write-Host "`n📍 Step 4: Running Playwright tests..." -ForegroundColor Cyan
Write-Host "   Test: $testPath" -ForegroundColor Yellow

$testArgs = @("playwright", "test", $testPath, "--reporter=list")
if ($Headed) {
    $testArgs += "--headed"
}

Write-Host "   Command: npx $($testArgs -join ' ')" -ForegroundColor Gray

$testResult = & npx @testArgs
$testExitCode = $LASTEXITCODE

Write-Host ""
if ($testExitCode -eq 0) {
    Write-Host "   ✅ Tests passed!" -ForegroundColor Green
} else {
    Write-Host "   ❌ Tests failed (exit code: $testExitCode)" -ForegroundColor Red
}
```

**Flags:**
- `--reporter=list` - Console output
- `--reporter=html` - HTML report (for detailed debugging)
- `--headed` - Visible browser (for debugging)

---

### 5. Cleanup

```powershell
# Step 5: Cleanup or keep running
if ($KeepAppRunning) {
    Write-Host "`n📍 Step 5: Keeping app running for manual verification..." -ForegroundColor Cyan
    Write-Host "   App URL: $appUrl" -ForegroundColor Yellow
    Write-Host "   PID: $($appProcess.Id)" -ForegroundColor Yellow
    Write-Host "   Press Ctrl+C to stop the app when done" -ForegroundColor Yellow
    
    # Wait indefinitely
    Wait-Process -Id $appProcess.Id
} else {
    Write-Host "`n📍 Step 5: Cleaning up..." -ForegroundColor Cyan
    if ($appProcess -and -not $appProcess.HasExited) {
        Write-Host "   Stopping app (PID: $($appProcess.Id))..." -ForegroundColor Yellow
        $appProcess | Stop-Process -Force
        Start-Sleep -Seconds 2
        Write-Host "   ✅ App stopped" -ForegroundColor Green
    }
}
```

**Emergency Cleanup:**

```powershell
} catch {
    Write-Host "`n❌ ERROR: $_" -ForegroundColor Red
    Write-Host $_.ScriptStackTrace -ForegroundColor Gray
    
    # Emergency cleanup
    if ($appProcess -and -not $appProcess.HasExited) {
        Write-Host "`nEmergency cleanup: Stopping app..." -ForegroundColor Yellow
        $appProcess | Stop-Process -Force
    }
    
    exit 1
}
```

---

## Usage Examples

### Basic Test Run
```powershell
.\Scripts\run-your-test.ps1
```

### Debugging Mode (Visible Browser + Keep App Running)
```powershell
.\Scripts\run-your-test.ps1 -Headed -KeepAppRunning
```

### Custom Test Pattern
```powershell
.\Scripts\run-your-test.ps1 -TestPattern "specific-test.spec.ts"
```

---

## Common Patterns

### Test with Percy Visual Regression

```powershell
# Add PERCY_TOKEN environment variable check
if (-not $env:PERCY_TOKEN) {
    Write-Host "⚠️  Warning: PERCY_TOKEN not set. Snapshots will not be uploaded." -ForegroundColor Yellow
}

# Run with Percy CLI
$testArgs = @("percy", "exec", "--", "playwright", "test", $testPath)
if ($Headed) {
    $testArgs += "--headed"
}

& npx @testArgs
```

### Test with Specific Browser

```powershell
$testArgs = @("playwright", "test", $testPath, "--project=chromium", "--reporter=list")
```

### Test with Retries

```powershell
$testArgs = @("playwright", "test", $testPath, "--retries=2", "--reporter=list")
```

---

## Best Practices

### 1. Process Management
- Always store `$appProcess` for cleanup
- Use `-PassThru` with `Start-Process`
- Check `HasExited` before `Stop-Process`
- Wait 2 seconds after process stop for cleanup

### 2. Health Check
- Use generous timeout (30+ attempts for large apps)
- Add extra wait after HTTP 200 (5 seconds for SignalR/Blazor)
- Use `-SkipCertificateCheck` for localhost HTTPS
- Handle SSL errors gracefully

### 3. Error Handling
- Set `$ErrorActionPreference = "Stop"` for fail-fast
- Use try/catch for error handling
- Emergency cleanup in catch block
- Log errors with stack trace

### 4. User Experience
- Use emoji for visual cues (📍 ✅ ❌ ⚠️)
- Color-code output (Cyan/Yellow/Green/Red)
- Show progress (Attempt X/Y)
- Provide clear next steps

### 5. Debugging Support
- `-Headed` flag for visible browser
- `-KeepAppRunning` flag to inspect app after tests
- Log PID for manual process management
- Show full command being executed

---

## Playwright Test Patterns

### Console Logging Integration

```typescript
test.beforeEach(async ({ page }) => {
    // Enable console logging for debugging
    page.on('console', msg => {
        if (msg.text().includes('[YOUR-DEBUG-PREFIX]')) {
            console.log(`🔍 ${msg.text()}`);
        }
    });
});
```

### Authentication Handling

```typescript
// For Host Control Panel tests requiring authentication
const tokenInput = page.locator('input[placeholder*="token" i]').first();
await tokenInput.fill('TESTHOST'); // Test token
await tokenInput.press('Enter');
await page.waitForTimeout(2000); // Wait for auth
```

### Waiting for SignalR Connection

```typescript
// Wait for SignalR connection to establish
await page.waitForFunction(() => {
    return window.hubConnection && window.hubConnection.state === 'Connected';
}, { timeout: 10000 });
```

---

## Troubleshooting

### App Fails to Start
- Check for port conflicts (9091 already in use)
- Verify working directory is correct
- Check build errors in app output window
- Increase health check attempts

### SSL Certificate Errors
- Ensure using `-SkipCertificateCheck` (PowerShell 7+)
- Don't use deprecated `ICertificatePolicy`
- Verify `https://localhost:9091` is correct URL

### Tests Fail with Timeouts
- Increase `maxAttempts` in health check
- Add longer wait after HTTP 200 (10+ seconds for large apps)
- Check authentication requirements
- Use `-Headed` to see what's happening

### Process Not Cleaning Up
- Verify `$appProcess` is stored correctly
- Check `HasExited` before `Stop-Process`
- Use `-Force` flag with `Stop-Process`
- Add 2-second sleep after stop

---

## Related Documentation

- **PlaywrightQuickRef.md** - Playwright test authoring guide
- **PlaywrightTestPaths.MD** - Test file organization
- **PlaywrightConfig.MD** - Playwright configuration
- **InfrastructureQuickRef.md** - App architecture overview

---

## Examples in Codebase

- `Scripts/run-hcp-fab-button-tests.ps1` - Host Control Panel test orchestrator
- `Scripts/run-debug-panel-percy-tests.ps1` - Percy visual regression orchestrator
- `Scripts/run-transcript-canvas-visual-tests.ps1` - Transcript Canvas orchestrator

---

**Last Updated:** 2025-10-28  
**Maintainer:** GitHub Copilot  
**Version:** 1.0
