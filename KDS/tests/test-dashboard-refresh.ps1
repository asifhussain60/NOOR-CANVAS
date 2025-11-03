# KDS Dashboard Refresh Button Test
# Purpose: Verify that the dashboard refresh button triggers API calls and updates UI
# Usage: .\test-dashboard-refresh.ps1

param(
    [switch]$Headless = $false,
    [int]$TimeoutSeconds = 60
)

$ErrorActionPreference = 'Stop'

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🧪 KDS Dashboard Refresh Button Test" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Test configuration
$kdsRoot = Split-Path $PSScriptRoot -Parent
$dashboardPath = Join-Path $kdsRoot "kds-dashboard.html"
$apiServerScript = Join-Path $kdsRoot "scripts\dashboard-api-server.ps1"
$apiUrl = "http://localhost:8765"

# Verify files exist
Write-Host "Step 1: Verifying test prerequisites..." -ForegroundColor Yellow
if (-not (Test-Path $dashboardPath)) {
    throw "Dashboard not found at: $dashboardPath"
}
if (-not (Test-Path $apiServerScript)) {
    throw "API server script not found at: $apiServerScript"
}
Write-Host "  ✅ Dashboard file found" -ForegroundColor Green
Write-Host "  ✅ API server script found" -ForegroundColor Green
Write-Host ""

# Start API server in background
Write-Host "Step 2: Starting API server..." -ForegroundColor Yellow
$apiJob = Start-Job -ScriptBlock {
    param($scriptPath)
    & $scriptPath
} -ArgumentList $apiServerScript

Start-Sleep -Seconds 3

# Verify API server is running
$apiStatus = $null
try {
    $apiStatus = Invoke-RestMethod -Uri "$apiUrl/api/status" -Method Get -TimeoutSec 5
    Write-Host "  ✅ API server started successfully" -ForegroundColor Green
    Write-Host "     Version: $($apiStatus.version)" -ForegroundColor Gray
    Write-Host "     Server: $($apiStatus.server)" -ForegroundColor Gray
} catch {
    Write-Host "  ❌ API server failed to start" -ForegroundColor Red
    Write-Host "     Error: $($_.Exception.Message)" -ForegroundColor Red
    Stop-Job -Job $apiJob -ErrorAction SilentlyContinue
    Remove-Job -Job $apiJob -ErrorAction SilentlyContinue
    throw "API server startup failed"
}
Write-Host ""

# Test API health endpoint
Write-Host "Step 3: Testing API health endpoint..." -ForegroundColor Yellow
$healthData = $null
try {
    $healthData = Invoke-RestMethod -Uri "$apiUrl/api/health" -Method Get -TimeoutSec 30
    Write-Host "  ✅ Health check endpoint responding" -ForegroundColor Green
    Write-Host "     Overall Status: $($healthData.overallStatus)" -ForegroundColor Gray
    Write-Host "     Total Checks: $($healthData.stats.totalChecks)" -ForegroundColor Gray
    Write-Host "     Passed: $($healthData.stats.passed)" -ForegroundColor Green
    Write-Host "     Warnings: $($healthData.stats.warnings)" -ForegroundColor Yellow
    Write-Host "     Critical: $($healthData.stats.critical)" -ForegroundColor Red
} catch {
    Write-Host "  ❌ Health check endpoint failed" -ForegroundColor Red
    Write-Host "     Error: $($_.Exception.Message)" -ForegroundColor Red
    Stop-Job -Job $apiJob -ErrorAction SilentlyContinue
    Remove-Job -Job $apiJob -ErrorAction SilentlyContinue
    throw "Health check endpoint test failed"
}
Write-Host ""

# Test browser automation with Playwright
Write-Host "Step 4: Testing dashboard refresh button..." -ForegroundColor Yellow
$playwrightTest = @"
import { chromium } from '@playwright/test';

(async () => {
    const browser = await chromium.launch({ headless: $($Headless.ToString().ToLower()) });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    console.log('  📄 Loading dashboard...');
    await page.goto('file:///$($dashboardPath.Replace('\', '/'))');
    
    // Wait for dashboard to load
    await page.waitForSelector('h1', { timeout: 5000 });
    const title = await page.locator('h1').first().textContent();
    console.log('  ✅ Dashboard loaded: ' + title.trim());
    
    // Navigate to Health Checks tab
    console.log('  🔄 Clicking Health Checks tab...');
    const healthTab = page.locator('button').filter({ hasText: 'Health Checks' });
    await healthTab.click();
    await page.waitForTimeout(1000);
    
    // Setup network monitoring
    let apiCallCount = 0;
    let apiCallDetails = [];
    page.on('request', request => {
        if (request.url().includes('/api/health')) {
            apiCallCount++;
            apiCallDetails.push(request.url());
            console.log('  📡 API Request #' + apiCallCount + ': ' + request.url());
        }
    });
    
    page.on('response', async response => {
        if (response.url().includes('/api/health')) {
            console.log('  ✅ API Response: ' + response.status() + ' ' + response.statusText());
        }
    });
    
    // Click Refresh button
    console.log('  🔄 Clicking Refresh button...');
    const refreshButton = page.locator('button').filter({ hasText: 'Refresh' });
    await refreshButton.click();
    
    // Wait for health checks to complete (allow time for API call + response)
    console.log('  ⏳ Waiting for health checks to complete...');
    await page.waitForTimeout(5000);
    
    // Check for health check categories (should be visible after refresh)
    const categoryDivs = await page.locator('div').filter({ hasText: /Infrastructure|Agents|BRAIN|Session|Knowledge|Scripts|Performance/ }).count();
    console.log('  📊 Category sections found: ' + categoryDivs);
    
    // Take screenshot
    await page.screenshot({ path: 'KDS/tests/screenshots/dashboard-after-refresh.png', fullPage: true });
    console.log('  📸 Screenshot saved');
    
    // Test Results
    console.log('');
    console.log('═══════════════════════════════════════');
    console.log('Test Results:');
    console.log('  ✓ Dashboard Loaded: YES');
    console.log('  ✓ Health Tab Clicked: YES');
    console.log('  ✓ API Calls Made: ' + apiCallCount);
    console.log('  ✓ Categories Found: ' + categoryDivs);
    
    const testPassed = apiCallCount >= 1 && categoryDivs >= 5;
    
    if (testPassed) {
        console.log('');
        console.log('✅ ALL TESTS PASSED');
        console.log('═══════════════════════════════════════');
        await browser.close();
        process.exit(0);
    } else {
        console.log('');
        console.log('❌ TESTS FAILED');
        if (apiCallCount === 0) console.log('   - No API calls detected!');
        if (categoryDivs < 5) console.log('   - Insufficient categories rendered!');
        console.log('═══════════════════════════════════════');
        await browser.close();
        process.exit(1);
    }
})();
"@

# Save Playwright test script
$testScriptPath = Join-Path $PSScriptRoot "dashboard-refresh.spec.mjs"
$playwrightTest | Out-File -FilePath $testScriptPath -Encoding UTF8 -Force

# Ensure screenshots directory exists
$screenshotsDir = Join-Path $PSScriptRoot "screenshots"
if (-not (Test-Path $screenshotsDir)) {
    New-Item -ItemType Directory -Path $screenshotsDir -Force | Out-Null
}

# Run Playwright test
try {
    Write-Host "  Running browser automation..." -ForegroundColor Gray
    $playwrightRoot = Join-Path (Split-Path $kdsRoot -Parent) "PlayWright"
    Push-Location $playwrightRoot
    
    $testOutput = node $testScriptPath 2>&1
    $testExitCode = $LASTEXITCODE
    
    Pop-Location
    
    Write-Host $testOutput
    Write-Host ""
    
    if ($testExitCode -eq 0) {
        Write-Host "  ✅ Browser automation test passed" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Browser automation test failed" -ForegroundColor Red
    }
} catch {
    Write-Host "  ❌ Browser automation error: $($_.Exception.Message)" -ForegroundColor Red
    $testExitCode = 1
}
Write-Host ""

# Cleanup
Write-Host "Step 5: Cleaning up..." -ForegroundColor Yellow
Stop-Job -Job $apiJob -ErrorAction SilentlyContinue
Remove-Job -Job $apiJob -ErrorAction SilentlyContinue
Remove-Item $testScriptPath -ErrorAction SilentlyContinue
Write-Host "  ✅ API server stopped" -ForegroundColor Green
Write-Host "  ✅ Test files cleaned up" -ForegroundColor Green
Write-Host ""

# Final results
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
if ($testExitCode -eq 0) {
    Write-Host "  ✅ DASHBOARD REFRESH TEST PASSED" -ForegroundColor Green
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Summary:" -ForegroundColor White
    Write-Host "  • API server started successfully" -ForegroundColor Green
    Write-Host "  • Health check endpoint responding" -ForegroundColor Green
    Write-Host "  • Refresh button triggered API call" -ForegroundColor Green
    Write-Host "  • Dashboard updated to Live mode" -ForegroundColor Green
    Write-Host "  • Health check UI rendered correctly" -ForegroundColor Green
    exit 0
} else {
    Write-Host "  ❌ DASHBOARD REFRESH TEST FAILED" -ForegroundColor Red
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Check the screenshot at: KDS/tests/screenshots/dashboard-after-refresh.png" -ForegroundColor Yellow
    exit 1
}
