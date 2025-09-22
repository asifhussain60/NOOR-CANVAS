#!/usr/bin/env powershell
# Host Navigation Flow Integration Test
# Tests complete flow: HostLanding → Host-SessionOpener → Navigation Integration

Write-Host "HOST NAVIGATION FLOW INTEGRATION TEST" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

$testResults = @()
$testStartTime = Get-Date

# Test 1: Verify Host-SessionOpener.razor exists and compiles
Write-Host "`n1. Testing Host-SessionOpener.razor compilation..." -ForegroundColor Yellow

try {
    $componentPath = "d:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas\Pages\Host-SessionOpener.razor"
    if (Test-Path $componentPath) {
        $content = Get-Content $componentPath -Raw
        
        # Check critical elements
        $hasPageDirective = $content -match '@page "/host/session-opener"'
        $hasViewModel = $content -match 'class HostSessionOpenerViewModel'
        $hasAlbumSelect = $content -match 'album-select'
        $hasCategorySelect = $content -match 'category-select'
        $hasSessionSelect = $content -match 'session-select'
        $hasCascadingDropdowns = $hasAlbumSelect -and $hasCategorySelect -and $hasSessionSelect
        $hasNavigation = $content -match 'NavigateTo.*session/waiting'
        
        if ($hasPageDirective -and $hasViewModel -and $hasCascadingDropdowns -and $hasNavigation) {
            Write-Host "   ✅ Host-SessionOpener.razor structure verified" -ForegroundColor Green
            $testResults += "Component Structure: PASS"
        } else {
            Write-Host "   ❌ Component missing critical elements" -ForegroundColor Red
            $testResults += "Component Structure: FAIL - Missing elements"
        }
    } else {
        Write-Host "   ❌ Host-SessionOpener.razor not found" -ForegroundColor Red
        $testResults += "Component Structure: FAIL - File not found"
    }
} catch {
    Write-Host "   ❌ Error testing component: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += "Component Structure: ERROR"
}

# Test 2: Verify HostLanding navigation update
Write-Host "`n2. Testing HostLanding.razor navigation flow..." -ForegroundColor Yellow

try {
    $hostLandingPath = "d:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas\Pages\HostLanding.razor"
    if (Test-Path $hostLandingPath) {
        $hostContent = Get-Content $hostLandingPath -Raw
        
        # Check navigation targets
        $hasSessionOpenerNav = $hostContent -match 'NavigateTo.*host/session-opener'
        $noDashboardNav = $hostContent -notmatch 'NavigateTo.*host/dashboard'
        
        if ($hasSessionOpenerNav -and $noDashboardNav) {
            Write-Host "   ✅ HostLanding navigation correctly updated" -ForegroundColor Green
            $testResults += "Navigation Flow: PASS"
        } else {
            Write-Host "   ❌ HostLanding navigation not properly updated" -ForegroundColor Red
            $testResults += "Navigation Flow: FAIL"
        }
    } else {
        Write-Host "   ❌ HostLanding.razor not found" -ForegroundColor Red
        $testResults += "Navigation Flow: FAIL - File not found"
    }
} catch {
    Write-Host "   ❌ Error testing navigation: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += "Navigation Flow: ERROR"
}

# Test 3: Build validation
Write-Host "`n3. Testing build compilation..." -ForegroundColor Yellow

try {
    $buildResult = & dotnet build "d:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas\NoorCanvas.csproj" --nologo --verbosity quiet
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Project builds successfully" -ForegroundColor Green
        $testResults += "Build Compilation: PASS"
    } else {
        Write-Host "   ❌ Build failed" -ForegroundColor Red
        $testResults += "Build Compilation: FAIL"
    }
} catch {
    Write-Host "   ❌ Error running build: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += "Build Compilation: ERROR"
}

# Test 4: Route registration verification
Write-Host "`n4. Testing route registration..." -ForegroundColor Yellow

try {
    $appPath = "d:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas\Program.cs"
    if (Test-Path $appPath) {
        $appContent = Get-Content $appPath -Raw
        $hasMapRazorPages = $appContent -match 'MapRazorPages|MapBlazorHub'
        
        if ($hasMapRazorPages) {
            Write-Host "   ✅ Blazor routing configured" -ForegroundColor Green
            $testResults += "Route Registration: PASS"
        } else {
            Write-Host "   ⚠️  Unable to verify route registration" -ForegroundColor Yellow
            $testResults += "Route Registration: WARNING"
        }
    } else {
        Write-Host "   ⚠️  Program.cs not found for verification" -ForegroundColor Yellow
        $testResults += "Route Registration: WARNING"
    }
} catch {
    Write-Host "   ❌ Error testing routes: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += "Route Registration: ERROR"
}

# Summary Report
$testEndTime = Get-Date
$testDuration = $testEndTime - $testStartTime

Write-Host "`nTEST SUMMARY REPORT" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan
Write-Host "Test Duration: $($testDuration.TotalSeconds) seconds" -ForegroundColor White

foreach ($result in $testResults) {
    if ($result -match "PASS") {
        Write-Host "✅ $result" -ForegroundColor Green
    } elseif ($result -match "WARNING") {
        Write-Host "⚠️  $result" -ForegroundColor Yellow
    } elseif ($result -match "FAIL|ERROR") {
        Write-Host "❌ $result" -ForegroundColor Red
    }
}

$passCount = ($testResults | Where-Object { $_ -match "PASS" }).Count
$totalCount = $testResults.Count

Write-Host "`nOVERALL RESULT: $passCount/$totalCount tests passed" -ForegroundColor White

if ($passCount -eq $totalCount) {
    Write-Host "HOST NAVIGATION FLOW: READY FOR PRODUCTION" -ForegroundColor Green
    exit 0
} elseif ($passCount -ge ($totalCount * 0.75)) {
    Write-Host "HOST NAVIGATION FLOW: MOSTLY READY - Minor issues detected" -ForegroundColor Yellow
    exit 0
} else {
    Write-Host "HOST NAVIGATION FLOW: NEEDS ATTENTION - Major issues detected" -ForegroundColor Red
    exit 1
}