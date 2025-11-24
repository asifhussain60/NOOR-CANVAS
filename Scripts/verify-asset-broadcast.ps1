# Asset Broadcasting Manual Verification Script
# Phase 6.1 of Asset Broadcasting Fix Implementation Plan
#
# Purpose: Interactive manual testing with step-by-step guidance
# Usage: .\Scripts\verify-asset-broadcast.ps1

param(
    [switch]$SkipAppStart = $false,
    [switch]$HeadedMode = $false
)

$ErrorActionPreference = "Stop"
$WorkspaceRoot = Split-Path -Parent $PSScriptRoot

Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "    Asset Broadcasting Manual Verification Script" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Step 1: Start application (optional)
if (-not $SkipAppStart) {
    Write-Host "[Step 1/5] Starting NoorCanvas application..." -ForegroundColor Yellow
    
    $appProcess = Start-Process -FilePath "dotnet" `
        -ArgumentList "run", "--project", "$WorkspaceRoot/SPA/NoorCanvas/NoorCanvas.csproj" `
        -WorkingDirectory "$WorkspaceRoot/SPA/NoorCanvas" `
        -PassThru `
        -WindowStyle Normal
    
    Write-Host "  ✓ App started (PID: $($appProcess.Id))" -ForegroundColor Green
    Write-Host "  ⏳ Waiting 15 seconds for app to initialize..." -ForegroundColor Gray
    Start-Sleep -Seconds 15
} else {
    Write-Host "[Step 1/5] Skipping app start (assuming already running)" -ForegroundColor Yellow
}

# Step 2: Open browser windows
Write-Host ""
Write-Host "[Step 2/5] Opening browser windows..." -ForegroundColor Yellow
Write-Host "  📝 Instructions:" -ForegroundColor Cyan
Write-Host "     1. Window 1 (Admin): Create a new session" -ForegroundColor White
Write-Host "     2. Window 2 (Participant 1): Join as SessionCanvas viewer" -ForegroundColor White
Write-Host "     3. Window 3 (Participant 2): Join as TranscriptCanvas viewer" -ForegroundColor White
Write-Host ""

# Detect default browser
$browserPath = $null
$browserPaths = @(
    "C:\Program Files\Google\Chrome\Application\chrome.exe",
    "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    "C:\Program Files\Mozilla Firefox\firefox.exe",
    "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
)

foreach ($path in $browserPaths) {
    if (Test-Path $path) {
        $browserPath = $path
        break
    }
}

if ($browserPath) {
    Write-Host "  🌐 Detected browser: $browserPath" -ForegroundColor Gray
    
    # Open admin window
    Start-Process -FilePath $browserPath -ArgumentList "--new-window", "--incognito", "https://localhost:9091/admin"
    Start-Sleep -Seconds 2
    
    # Open participant windows
    Start-Process -FilePath $browserPath -ArgumentList "--new-window", "--incognito", "https://localhost:9091"
    Start-Sleep -Seconds 2
    Start-Process -FilePath $browserPath -ArgumentList "--new-window", "--incognito", "https://localhost:9091"
    
    Write-Host "  ✓ 3 browser windows opened" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Could not detect browser, please open manually:" -ForegroundColor Yellow
    Write-Host "     - https://localhost:9091/admin" -ForegroundColor White
    Write-Host "     - https://localhost:9091 (x2 for participants)" -ForegroundColor White
}

Write-Host ""
Write-Host "  ⏸️  Press ENTER after windows are open and session is created..." -ForegroundColor Cyan
Read-Host

# Step 3: Session setup verification
Write-Host ""
Write-Host "[Step 3/5] Verifying session setup..." -ForegroundColor Yellow
Write-Host ""
Write-Host "  📋 Checklist - Confirm the following:" -ForegroundColor Cyan
Write-Host "     [ ] Admin window shows HostControlPanel with transcript" -ForegroundColor White
Write-Host "     [ ] Participant 1 shows SessionCanvas with Q&A panel" -ForegroundColor White
Write-Host "     [ ] Participant 2 shows TranscriptCanvas with transcript view" -ForegroundColor White
Write-Host "     [ ] All 3 windows show 'SignalR: Connected' status" -ForegroundColor White
Write-Host ""

$setupConfirmed = Read-Host "  ✓ All checks passed? (Y/N)"
if ($setupConfirmed -ne "Y" -and $setupConfirmed -ne "y") {
    Write-Host "  ❌ Setup not confirmed. Exiting." -ForegroundColor Red
    exit 1
}

# Step 4: Asset sharing test
Write-Host ""
Write-Host "[Step 4/5] Testing asset broadcast..." -ForegroundColor Yellow
Write-Host ""
Write-Host "  📝 Instructions:" -ForegroundColor Cyan
Write-Host "     1. In HostControlPanel (admin window), find an ayah card" -ForegroundColor White
Write-Host "     2. Click the purple 'Share' button on any ayah" -ForegroundColor White
Write-Host "     3. Observe:" -ForegroundColor White
Write-Host "        - Host window: Success toast appears" -ForegroundColor Gray
Write-Host "        - Participant 1: Asset appears in canvas content area" -ForegroundColor Gray
Write-Host "        - Participant 2: Same asset appears in transcript canvas" -ForegroundColor Gray
Write-Host ""

Write-Host "  ⏸️  Press ENTER after clicking Share button..." -ForegroundColor Cyan
Read-Host

# Step 5: Verification questions
Write-Host ""
Write-Host "[Step 5/5] Manual verification results..." -ForegroundColor Yellow
Write-Host ""

$results = @{}

Write-Host "  Q1: Did the host window show 'ayah-card shared successfully' toast?" -ForegroundColor Cyan
$results.HostToast = Read-Host "     (Y/N)"

Write-Host ""
Write-Host "  Q2: Did Participant 1 (SessionCanvas) display the asset HTML?" -ForegroundColor Cyan
$results.Participant1Display = Read-Host "     (Y/N)"

Write-Host ""
Write-Host "  Q3: Did Participant 2 (TranscriptCanvas) display the asset HTML?" -ForegroundColor Cyan
$results.Participant2Display = Read-Host "     (Y/N)"

Write-Host ""
Write-Host "  Q4: Approximate latency from click to display (in seconds):" -ForegroundColor Cyan
$results.Latency = Read-Host "     (Enter number, e.g., 0.5)"

Write-Host ""
Write-Host "  Q5: Check browser console (F12). Any errors or warnings?" -ForegroundColor Cyan
$results.ConsoleErrors = Read-Host "     (Y/N)"

# Results summary
Write-Host ""
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "    Verification Results Summary" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$allPassed = $true

if ($results.HostToast -eq "Y" -or $results.HostToast -eq "y") {
    Write-Host "  ✓ Host toast: PASS" -ForegroundColor Green
} else {
    Write-Host "  ✗ Host toast: FAIL" -ForegroundColor Red
    $allPassed = $false
}

if ($results.Participant1Display -eq "Y" -or $results.Participant1Display -eq "y") {
    Write-Host "  ✓ SessionCanvas display: PASS" -ForegroundColor Green
} else {
    Write-Host "  ✗ SessionCanvas display: FAIL" -ForegroundColor Red
    $allPassed = $false
}

if ($results.Participant2Display -eq "Y" -or $results.Participant2Display -eq "y") {
    Write-Host "  ✓ TranscriptCanvas display: PASS" -ForegroundColor Green
} else {
    Write-Host "  ✗ TranscriptCanvas display: FAIL" -ForegroundColor Red
    $allPassed = $false
}

try {
    $latencyNum = [double]$results.Latency
    if ($latencyNum -le 1.0) {
        Write-Host "  ✓ Latency: PASS ($latencyNum seconds)" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Latency: WARN ($latencyNum seconds - exceeds 1s threshold)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ⚠️  Latency: UNKNOWN (invalid input)" -ForegroundColor Yellow
}

if ($results.ConsoleErrors -eq "N" -or $results.ConsoleErrors -eq "n") {
    Write-Host "  ✓ Console errors: NONE" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Console errors: PRESENT (review F12 console)" -ForegroundColor Yellow
    $allPassed = $false
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan

if ($allPassed) {
    Write-Host "  🎉 OVERALL: PASS - Asset broadcasting works correctly!" -ForegroundColor Green
    $exitCode = 0
} else {
    Write-Host "  ❌ OVERALL: FAIL - Issues detected, review logs" -ForegroundColor Red
    $exitCode = 1
}

Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Cleanup prompt
Write-Host "  🧹 Clean up?" -ForegroundColor Cyan
Write-Host "     - Close browser windows manually" -ForegroundColor Gray
if (-not $SkipAppStart -and $appProcess) {
    $stopApp = Read-Host "     - Stop NoorCanvas app? (Y/N)"
    if ($stopApp -eq "Y" -or $stopApp -eq "y") {
        Stop-Process -Id $appProcess.Id -Force
        Write-Host "     ✓ App stopped" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "  📝 Next steps:" -ForegroundColor Cyan
Write-Host "     - If PASS: Proceed to Phase 7 cleanup" -ForegroundColor White
Write-Host "     - If FAIL: Review Workspaces/AssetBroadcast/IMPLEMENTATION-PLAN.md" -ForegroundColor White
Write-Host ""

exit $exitCode
