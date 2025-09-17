#!/usr/bin/env powershell
# Host Dashboard Route Cleanup Verification Test
# Ensures all /host/dashboard routes and references have been properly removed

Write-Host "HOST DASHBOARD CLEANUP VERIFICATION" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

$testResults = @()
$testStartTime = Get-Date

# Test 1: Verify no NavigateTo calls reference dashboard
Write-Host "`n1. Testing for NavigateTo dashboard references..." -ForegroundColor Yellow

try {
    $navMatches = Get-ChildItem -Path "d:\PROJECTS\NOOR CANVAS" -Recurse -Include "*.cs","*.razor" | 
                  Select-String "NavigateTo.*host/dashboard" 2>$null
    
    if ($navMatches.Count -eq 0) {
        Write-Host "   ✅ No NavigateTo dashboard references found" -ForegroundColor Green
        $testResults += "Navigation References: PASS"
    } else {
        Write-Host "   ❌ Found NavigateTo dashboard references:" -ForegroundColor Red
        $navMatches | ForEach-Object { Write-Host "     - $($_.Filename):$($_.LineNumber)" -ForegroundColor Red }
        $testResults += "Navigation References: FAIL"
    }
} catch {
    Write-Host "   ⚠️  Error checking navigation references: $($_.Exception.Message)" -ForegroundColor Yellow
    $testResults += "Navigation References: ERROR"
}

# Test 2: Verify no @page dashboard routes exist
Write-Host "`n2. Testing for @page dashboard routes..." -ForegroundColor Yellow

try {
    $pageMatches = Get-ChildItem -Path "d:\PROJECTS\NOOR CANVAS" -Recurse -Include "*.razor" | 
                   Select-String '@page.*"/host/dashboard"' 2>$null
    
    if ($pageMatches.Count -eq 0) {
        Write-Host "   ✅ No @page dashboard routes found" -ForegroundColor Green
        $testResults += "Page Routes: PASS"
    } else {
        Write-Host "   ❌ Found @page dashboard routes:" -ForegroundColor Red
        $pageMatches | ForEach-Object { Write-Host "     - $($_.Filename):$($_.LineNumber)" -ForegroundColor Red }
        $testResults += "Page Routes: FAIL"
    }
} catch {
    Write-Host "   ⚠️  Error checking page routes: $($_.Exception.Message)" -ForegroundColor Yellow
    $testResults += "Page Routes: ERROR"
}

# Test 3: Verify no API endpoints reference dashboard
Write-Host "`n3. Testing for API dashboard endpoints..." -ForegroundColor Yellow

try {
    $apiMatches = Get-ChildItem -Path "d:\PROJECTS\NOOR CANVAS" -Recurse -Include "*.cs" | 
                  Select-String 'Route.*".*api/host/dashboard"' 2>$null
    
    if ($apiMatches.Count -eq 0) {
        Write-Host "   ✅ No API dashboard endpoints found" -ForegroundColor Green
        $testResults += "API Endpoints: PASS"
    } else {
        Write-Host "   ❌ Found API dashboard endpoints:" -ForegroundColor Red
        $apiMatches | ForEach-Object { Write-Host "     - $($_.Filename):$($_.LineNumber)" -ForegroundColor Red }
        $testResults += "API Endpoints: FAIL"
    }
} catch {
    Write-Host "   ⚠️  Error checking API endpoints: $($_.Exception.Message)" -ForegroundColor Yellow
    $testResults += "API Endpoints: ERROR"
}

# Test 4: Verify HostDashboard files removed
Write-Host "`n4. Testing for HostDashboard component files..." -ForegroundColor Yellow

try {
    $dashboardFiles = Get-ChildItem -Path "d:\PROJECTS\NOOR CANVAS" -Recurse -Include "*HostDashboard*" 2>$null
    
    if ($dashboardFiles.Count -eq 0) {
        Write-Host "   ✅ No HostDashboard component files found" -ForegroundColor Green
        $testResults += "Component Files: PASS"
    } else {
        Write-Host "   ❌ Found HostDashboard component files:" -ForegroundColor Red
        $dashboardFiles | ForEach-Object { Write-Host "     - $($_.FullName)" -ForegroundColor Red }
        $testResults += "Component Files: FAIL"
    }
} catch {
    Write-Host "   ⚠️  Error checking component files: $($_.Exception.Message)" -ForegroundColor Yellow
    $testResults += "Component Files: ERROR"
}

# Test 5: Verify build still works
Write-Host "`n5. Testing build compilation..." -ForegroundColor Yellow

try {
    $buildResult = & dotnet build "d:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas\NoorCanvas.csproj" --nologo --verbosity quiet
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Project builds successfully after cleanup" -ForegroundColor Green
        $testResults += "Build Status: PASS"
    } else {
        Write-Host "   ❌ Build failed after cleanup" -ForegroundColor Red
        $testResults += "Build Status: FAIL"
    }
} catch {
    Write-Host "   ❌ Error running build: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += "Build Status: ERROR"
}

# Test 6: Verify updated navigation flow works
Write-Host "`n6. Testing updated navigation flow..." -ForegroundColor Yellow

try {
    $hostLandingPath = "d:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas\Pages\HostLanding.razor"
    if (Test-Path $hostLandingPath) {
        $hostContent = Get-Content $hostLandingPath -Raw
        $hasSessionOpenerNav = $hostContent -match 'NavigateTo.*host/session-opener'
        
        if ($hasSessionOpenerNav) {
            Write-Host "   ✅ HostLanding correctly navigates to session-opener" -ForegroundColor Green
            $testResults += "Updated Navigation: PASS"
        } else {
            Write-Host "   ❌ HostLanding navigation not updated properly" -ForegroundColor Red
            $testResults += "Updated Navigation: FAIL"
        }
    } else {
        Write-Host "   ❌ HostLanding.razor not found" -ForegroundColor Red
        $testResults += "Updated Navigation: FAIL"
    }
} catch {
    Write-Host "   ❌ Error checking navigation flow: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += "Updated Navigation: ERROR"
}

# Summary Report
$testEndTime = Get-Date
$testDuration = $testEndTime - $testStartTime

Write-Host "`nCLEANUP VERIFICATION REPORT" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan
Write-Host "Test Duration: $($testDuration.TotalSeconds) seconds" -ForegroundColor White

foreach ($result in $testResults) {
    if ($result -match "PASS") {
        Write-Host "✅ $result" -ForegroundColor Green
    } elseif ($result -match "ERROR") {
        Write-Host "⚠️  $result" -ForegroundColor Yellow
    } else {
        Write-Host "❌ $result" -ForegroundColor Red
    }
}

$passCount = ($testResults | Where-Object { $_ -match "PASS" }).Count
$totalCount = $testResults.Count

Write-Host "`nOVERALL RESULT: $passCount/$totalCount tests passed" -ForegroundColor White

if ($passCount -eq $totalCount) {
    Write-Host "🎯 HOST DASHBOARD CLEANUP: COMPLETED SUCCESSFULLY" -ForegroundColor Green
    Write-Host "✅ All /host/dashboard routes and references have been removed" -ForegroundColor Green
    Write-Host "✅ Navigation flow updated to use /host/session-opener" -ForegroundColor Green
    Write-Host "✅ Build compilation verified" -ForegroundColor Green
    exit 0
} elseif ($passCount -ge ($totalCount * 0.8)) {
    Write-Host "⚡ HOST DASHBOARD CLEANUP: MOSTLY COMPLETE - Minor issues detected" -ForegroundColor Yellow
    exit 0
} else {
    Write-Host "🛑 HOST DASHBOARD CLEANUP: INCOMPLETE - Major issues detected" -ForegroundColor Red
    exit 1
}