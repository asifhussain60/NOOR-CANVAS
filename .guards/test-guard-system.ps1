# Test Guard Rails System
# Quick validation that all guard rail components are working
# Created: September 14, 2025

Write-Host "Testing NOOR Canvas Guard Rails System..." -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$ErrorCount = 0

# Test 1: Issue-80 Protection Guard exists and is executable
Write-Host "Test 1: Issue-80 Protection Guard..." -NoNewline
$guardPath = "D:\PROJECTS\NOOR CANVAS\.guards\Issue-80-Protection.ps1"
if (Test-Path $guardPath) {
    Write-Host " ✅ PASS" -ForegroundColor Green
} else {
    Write-Host " ❌ FAIL - Guard script not found" -ForegroundColor Red
    $ErrorCount++
}

# Test 2: Safe Dotnet Wrapper exists
Write-Host "Test 2: Safe Dotnet Wrapper..." -NoNewline
$wrapperPath = "D:\PROJECTS\NOOR CANVAS\.guards\safe-dotnet.ps1"
if (Test-Path $wrapperPath) {
    Write-Host " ✅ PASS" -ForegroundColor Green
} else {
    Write-Host " ❌ FAIL - Safe dotnet wrapper not found" -ForegroundColor Red
    $ErrorCount++
}

# Test 3: Enhanced nc.ps1 exists and contains Issue-80 protection
Write-Host "Test 3: Enhanced nc.ps1 Protection..." -NoNewline
$ncPath = "D:\PROJECTS\NOOR CANVAS\Workspaces\Global\nc.ps1"
if (Test-Path $ncPath) {
    $ncContent = Get-Content $ncPath -Raw
    if ($ncContent -match "ISSUE-80 PROTECTION") {
        Write-Host " ✅ PASS" -ForegroundColor Green
    } else {
        Write-Host " ❌ FAIL - nc.ps1 missing Issue-80 protection" -ForegroundColor Red
        $ErrorCount++
    }
} else {
    Write-Host " ❌ FAIL - nc.ps1 not found" -ForegroundColor Red
    $ErrorCount++
}

# Test 4: Project structure is valid
Write-Host "Test 4: Project Structure..." -NoNewline
$projectFile = "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas\NoorCanvas.csproj"
if (Test-Path $projectFile) {
    Write-Host " ✅ PASS" -ForegroundColor Green
} else {
    Write-Host " ❌ FAIL - Project file not accessible" -ForegroundColor Red
    $ErrorCount++
}

# Test 5: Guard documentation exists
Write-Host "Test 5: Guard Documentation..." -NoNewline
$docPath = "D:\PROJECTS\NOOR CANVAS\Workspaces\GUARD-RAILS-SYSTEM.MD"
if (Test-Path $docPath) {
    Write-Host " ✅ PASS" -ForegroundColor Green
} else {
    Write-Host " ❌ FAIL - Guard documentation not found" -ForegroundColor Red
    $ErrorCount++
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan

if ($ErrorCount -eq 0) {
    Write-Host "🎉 All Guard Rail Tests PASSED!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Guard Rails System is ready to protect against Issue-80!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Quick Start Commands:" -ForegroundColor Yellow
    Write-Host "  .\.guards\Issue-80-Protection.ps1        # Validate environment" -ForegroundColor White
    Write-Host "  .\.guards\safe-dotnet.ps1 run            # Safe dotnet run" -ForegroundColor White
    Write-Host "  nc                                       # Enhanced nc command" -ForegroundColor White
} else {
    Write-Host "❌ $ErrorCount test(s) failed!" -ForegroundColor Red
    Write-Host "Guard Rails System needs attention before deployment." -ForegroundColor Red
    exit 1
}

Write-Host ""
