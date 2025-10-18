# NoorCanvas Testing Framework v2.0

## 🎯 Purpose

A **robust, centralized framework** for running Playwright and Percy tests against NoorCanvas, solving the chronic issues with test orchestration:

- ✅ **Correct PowerShell syntax** for environment variables
- ✅ **Unified app lifecycle** management (start → test → stop)
- ✅ **Exponential backoff** health checks
- ✅ **Automatic cleanup** on success/failure
- ✅ **Clear error diagnostics**
- ✅ **Support for Percy** visual regression tests

## 🏗️ Architecture

```
Scripts/
├── Test-Framework/
│   ├── Start-NoorCanvasForTests.ps1    # App launcher with health checks
│   ├── Stop-NoorCanvasForTests.ps1     # Graceful shutdown
│   └── Invoke-PlaywrightTest.ps1       # Universal test runner
│
├── run-debug-panel-percy-tests-v2.ps1   # Example: Debug panel tests
├── run-transcript-canvas-percy-tests-v2.ps1  # Example: Transcript tests
└── ... (other test runners)
```

### Core Components

#### 1. `Start-NoorCanvasForTests.ps1`
**Single Responsibility**: Start NoorCanvas and wait for readiness.

**Features**:
- Kills existing processes (clean slate)
- Creates startup script with **correct PowerShell syntax** (`$env:VAR = 'value'`)
- Launches app in separate window
- Performs health checks with exponential backoff
- Returns structured process information

**Fixed Issue**: Original scripts used shell syntax (`Production = 'Development'`) which caused PowerShell parse errors.

#### 2. `Stop-NoorCanvasForTests.ps1`
**Single Responsibility**: Stop NoorCanvas gracefully.

**Features**:
- Target specific PID or all NoorCanvas processes
- Graceful vs forced shutdown
- Cleanup temporary startup scripts
- Validation that processes actually stopped

#### 3. `Invoke-PlaywrightTest.ps1`
**Single Responsibility**: Orchestrate complete test lifecycle.

**Workflow**:
1. Build application (optional)
2. Start application
3. Configure test environment (Percy, session tokens, etc.)
4. Run Playwright tests
5. Stop application
6. Return exit code

**Features**:
- Percy integration
- Session token injection
- Headed/headless modes
- Custom Playwright arguments
- Keep-app-running mode for debugging

## 📖 Usage

### Basic Test Execution

```powershell
# Run debug panel Percy tests
.\Scripts\run-debug-panel-percy-tests-v2.ps1

# Run in headed mode (visible browser)
.\Scripts\run-debug-panel-percy-tests-v2.ps1 -Headed

# Keep app running for manual inspection
.\Scripts\run-debug-panel-percy-tests-v2.ps1 -Headed -KeepAppRunning
```

### Direct Framework Usage

```powershell
# Use the universal test runner directly
.\Scripts\Test-Framework\Invoke-PlaywrightTest.ps1 `
    -TestFile "Tests/UI/my-test.spec.ts" `
    -Headed `
    -Percy

# With session authentication
.\Scripts\Test-Framework\Invoke-PlaywrightTest.ps1 `
    -TestFile "Tests/UI/auth-required-test.spec.ts" `
    -SessionToken "KJAHA99L" `
    -Headed
```

### Creating New Test Runners

```powershell
# Scripts/run-my-feature-tests.ps1

[CmdletBinding()]
param(
    [switch]$Headed,
    [switch]$SkipBuild,
    [switch]$KeepAppRunning
)

$testRunnerPath = Join-Path $PSScriptRoot "Test-Framework\Invoke-PlaywrightTest.ps1"

& $testRunnerPath `
    -TestFile "Tests/UI/my-feature.spec.ts" `
    -Headed:$Headed `
    -SkipBuild:$SkipBuild `
    -KeepAppRunning:$KeepAppRunning

exit $LASTEXITCODE
```

## 🔧 Configuration

### Environment Variables

**Percy Tests**:
```powershell
$env:PERCY_TOKEN = "your-percy-token"  # Set via setup-percy.ps1
```

**Session Authentication**:
```powershell
$env:PW_SESSION_TOKEN = "KJAHA99L"  # Set automatically by runner
```

**Application Settings**:
```powershell
$env:ASPNETCORE_ENVIRONMENT = "Development"
$env:ASPNETCORE_URLS = "https://localhost:9091"
```

### Health Check Configuration

Edit `Start-NoorCanvasForTests.ps1`:

```powershell
$params = @{
    MaxHealthCheckAttempts = 20              # Max retry attempts
    HealthCheckIntervalSeconds = 2           # Base delay
    UseExponentialBackoff = $true            # 2s, 4s, 8s, 16s, 5s...
}
```

## 🐛 Troubleshooting

### Issue: "Production is not recognized as cmdlet"

**Root Cause**: Incorrect syntax in startup script.

**OLD (BROKEN)**:
```powershell
Production = 'Development'  # Shell syntax, NOT PowerShell!
```

**NEW (FIXED)**:
```powershell
$env:ASPNETCORE_ENVIRONMENT = 'Development'  # Correct PowerShell syntax
```

**Solution**: Use the new `Start-NoorCanvasForTests.ps1` which generates correct syntax.

### Issue: Health Check Timeouts

**Symptoms**: App takes too long to start, health checks fail.

**Solutions**:
1. Increase `MaxHealthCheckAttempts`:
   ```powershell
   & $startScript -MaxHealthCheckAttempts 30
   ```

2. Check app logs in the separate PowerShell window

3. Verify port 9091 is not blocked by firewall

4. Run app manually first to verify it works:
   ```powershell
   cd "SPA\NoorCanvas"
   $env:ASPNETCORE_URLS = "https://localhost:9091"
   dotnet run
   ```

### Issue: Zombie Processes

**Symptoms**: Port 9091 already in use, app won't start.

**Solution**:
```powershell
# Use the cleanup script
.\Scripts\Test-Framework\Stop-NoorCanvasForTests.ps1 -Force -CleanupTempFiles

# Or manually kill all
Get-Process -Name "NoorCanvas" | Stop-Process -Force
```

### Issue: Percy Token Not Set

**Symptoms**: Tests fail with "PERCY_TOKEN not set"

**Solution**:
```powershell
# Run Percy setup
.\setup-percy.ps1

# Or set manually
$env:PERCY_TOKEN = "your-token-here"
```

## 🧪 Testing the Framework

### Verify App Launcher

```powershell
# Test app startup only
$appInfo = .\Scripts\Test-Framework\Start-NoorCanvasForTests.ps1

# Should return:
# ProcessId, Url, StartTime, HealthCheckAttempts, Success

# Cleanup
.\Scripts\Test-Framework\Stop-NoorCanvasForTests.ps1 -ProcessId $appInfo.ProcessId -Force
```

### Verify Test Runner

```powershell
# Run a simple test
.\Scripts\Test-Framework\Invoke-PlaywrightTest.ps1 `
    -TestFile "Tests/UI/simple-test.spec.ts" `
    -Headed `
    -KeepAppRunning

# Check app is still running
Get-Process -Name "NoorCanvas"

# Cleanup
.\Scripts\Test-Framework\Stop-NoorCanvasForTests.ps1 -Force
```

## 📊 Migration Guide

### Migrating Old Test Scripts

**BEFORE** (Legacy pattern):
```powershell
# Complex, fragile orchestration
$startupScript = @"
cd 'd:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas'
Production = 'Development'  # BROKEN!
dotnet run
"@
$startupScript | Out-File "$env:TEMP\noorcanvas-startup.ps1" -Encoding UTF8
Start-Process powershell -ArgumentList "-File","$env:TEMP\noorcanvas-startup.ps1"

# Manual health checks...
# Manual cleanup...
```

**AFTER** (New framework):
```powershell
# Simple, robust
.\Scripts\Test-Framework\Invoke-PlaywrightTest.ps1 `
    -TestFile "Tests/UI/my-test.spec.ts" `
    -Headed

# Framework handles:
# - App lifecycle
# - Health checks
# - Cleanup
# - Error handling
```

### Steps to Migrate

1. **Identify test script** in `Scripts/run-*.ps1`

2. **Create new version**:
   ```powershell
   # Scripts/run-my-test-v2.ps1
   
   [CmdletBinding()]
   param([switch]$Headed, [switch]$KeepAppRunning)
   
   & "$PSScriptRoot\Test-Framework\Invoke-PlaywrightTest.ps1" `
       -TestFile "Tests/UI/my-test.spec.ts" `
       -Headed:$Headed `
       -KeepAppRunning:$KeepAppRunning
   
   exit $LASTEXITCODE
   ```

3. **Test new version**:
   ```powershell
   .\Scripts\run-my-test-v2.ps1 -Headed
   ```

4. **Replace old script** once verified

## 🔒 Best Practices

### ✅ DO

- Use `Invoke-PlaywrightTest.ps1` for all test orchestration
- Pass test-specific parameters through wrapper scripts
- Use `-KeepAppRunning` for debugging test failures
- Check exit codes from test runners
- Clean up temp files periodically

### ❌ DON'T

- Run `npx playwright test` directly without orchestration
- Create custom startup scripts (use framework)
- Hardcode URLs or paths (use parameters)
- Leave zombie processes running
- Ignore health check failures

## 📝 Example: Complete Test Flow

```powershell
# 1. Setup Percy (one-time)
.\setup-percy.ps1

# 2. Run visual regression test
.\Scripts\run-debug-panel-percy-tests-v2.ps1 -Headed

# Behind the scenes:
# ✅ Kills existing processes
# ✅ Builds app (Debug config)
# ✅ Creates startup script with correct syntax
# ✅ Launches app in separate window
# ✅ Health checks with exponential backoff
# ✅ Sets Percy environment variables
# ✅ Runs Playwright tests with Percy wrapper
# ✅ Stops app gracefully
# ✅ Cleans up temp files
# ✅ Returns exit code (0 = pass, 1+ = fail)

# 3. Check results
if ($LASTEXITCODE -eq 0) {
    Write-Host "Tests passed!" -ForegroundColor Green
} else {
    Write-Host "Tests failed!" -ForegroundColor Red
}
```

## 🚀 Future Enhancements

- [ ] Parallel test execution
- [ ] Docker containerization for isolated testing
- [ ] Automated screenshot comparison (beyond Percy)
- [ ] Test result aggregation and reporting
- [ ] Integration with CI/CD pipelines
- [ ] Database snapshot/restore for test isolation
- [ ] Performance benchmarking integration

## 📚 Related Documentation

- `.github/prompts/test-generation.prompt.md` - Test generation patterns
- `Docs/VISUAL_REGRESSION_TESTING.md` - Percy setup and usage
- `Scripts/setup-percy.ps1` - Percy configuration

## 🆘 Support

If you encounter issues:

1. Check temp script syntax:
   ```powershell
   Get-ChildItem $env:TEMP -Filter "noorcanvas-test-startup-*.ps1" | 
       Select-Object -First 1 | 
       Get-Content
   ```

2. Review app launch logs (in separate PowerShell window)

3. Verify health check endpoint:
   ```powershell
   Invoke-WebRequest -Uri "https://localhost:9091" -SkipCertificateCheck
   ```

4. Check for port conflicts:
   ```powershell
   netstat -ano | findstr :9091
   ```

---

**Version**: 2.0.0  
**Last Updated**: October 18, 2025  
**Author**: GitHub Copilot  
**Status**: Production Ready ✅
