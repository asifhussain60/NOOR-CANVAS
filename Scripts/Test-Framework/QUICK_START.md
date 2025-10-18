# Quick Start: New Testing Framework

## 🚀 Running Tests (New Way)

### Debug Panel Percy Tests
```powershell
.\Scripts\run-debug-panel-percy-tests-v2.ps1

# With visible browser
.\Scripts\run-debug-panel-percy-tests-v2.ps1 -Headed

# Keep app running for inspection
.\Scripts\run-debug-panel-percy-tests-v2.ps1 -Headed -KeepAppRunning
```

### Transcript Canvas Percy Tests
```powershell
.\Scripts\run-transcript-canvas-percy-tests-v2.ps1 -Headed
```

### Any Playwright Test
```powershell
.\Scripts\Test-Framework\Invoke-PlaywrightTest.ps1 `
    -TestFile "Tests/UI/your-test.spec.ts" `
    -Headed
```

## 📝 Creating New Test Scripts

**Template**: `Scripts/run-{feature}-tests-v2.ps1`

```powershell
[CmdletBinding()]
param(
    [switch]$Headed,
    [switch]$SkipBuild,
    [switch]$KeepAppRunning
)

$testRunnerPath = Join-Path $PSScriptRoot "Test-Framework\Invoke-PlaywrightTest.ps1"

& $testRunnerPath `
    -TestFile "Tests/UI/{feature}-test.spec.ts" `
    -Percy `           # Include for Percy tests
    -Headed:$Headed `
    -SkipBuild:$SkipBuild `
    -KeepAppRunning:$KeepAppRunning

exit $LASTEXITCODE
```

## 🔧 Common Scenarios

### Run Test with Session Token
```powershell
.\Scripts\Test-Framework\Invoke-PlaywrightTest.ps1 `
    -TestFile "Tests/UI/auth-test.spec.ts" `
    -SessionToken "KJAHA99L" `
    -Headed
```

### Debug Failed Test
```powershell
# Keep app running to inspect manually
.\Scripts\run-debug-panel-percy-tests-v2.ps1 -Headed -KeepAppRunning

# App stays running at https://localhost:9091
# Open browser and inspect
# When done: Stop-NoorCanvasForTests.ps1 -Force
```

### Cleanup Zombie Processes
```powershell
.\Scripts\Test-Framework\Stop-NoorCanvasForTests.ps1 -Force -CleanupTempFiles
```

## ⚠️ Troubleshooting

### Health Check Timeouts
Increase timeout attempts:
```powershell
$app = .\Scripts\Test-Framework\Start-NoorCanvasForTests.ps1 -MaxHealthCheckAttempts 25
```

### Port Already In Use
```powershell
# Kill all NoorCanvas processes
Get-Process -Name "NoorCanvas" -ErrorAction SilentlyContinue | Stop-Process -Force

# Or use framework
.\Scripts\Test-Framework\Stop-NoorCanvasForTests.ps1 -Force
```

### Percy Token Not Set
```powershell
# Run Percy setup
.\setup-percy.ps1

# Or set manually
$env:PERCY_TOKEN = "your-token-here"
```

## 📚 Full Documentation
See `Scripts/Test-Framework/README.md` for complete details.
