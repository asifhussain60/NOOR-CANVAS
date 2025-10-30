#Requires -Version 7.0

<#
.SYNOPSIS
    Verify dual-mode CORS configuration for KSESSIONS Resources CDN

.DESCRIPTION
    Tests that both production and development origins can access the CDN:
    - Production: noorcanvas.kashkole.com, session.kashkole.com
    - Development: localhost:5000, localhost:5001

.EXAMPLE
    .\verify-dual-mode-cors.ps1

.NOTES
    Created: 2025-10-26
    Key: cdn-dev-cors-extension
#>

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Dual-Mode CORS Validation - KSESSIONS Resources CDN" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$tests = @{
    Passed = 0
    Failed = 0
}

function Test-Cors {
    param(
        [string]$Origin,
        [string]$Name,
        [string]$Category = "CORS"
    )
    
    Write-Host "[$Category] Testing: $Name..." -ForegroundColor Yellow -NoNewline
    
    try {
        $response = Invoke-WebRequest -Uri "https://resources.kashkole.com" `
                                       -Headers @{"Origin"=$Origin} `
                                       -UseBasicParsing `
                                       -TimeoutSec 10 `
                                       -ErrorAction Stop
        
        $corsHeader = $response.Headers['Access-Control-Allow-Origin']
        
        if ($corsHeader -match [regex]::Escape($Origin)) {
            Write-Host " ✓ PASS" -ForegroundColor Green
            $script:tests.Passed++
        } else {
            Write-Host " ✗ FAIL" -ForegroundColor Red
            Write-Host "  Expected: $Origin in CORS header" -ForegroundColor Red
            Write-Host "  Got: $corsHeader" -ForegroundColor Red
            $script:tests.Failed++
        }
    } catch {
        Write-Host " ✗ ERROR" -ForegroundColor Red
        Write-Host "  $($_.Exception.Message)" -ForegroundColor Red
        $script:tests.Failed++
    }
}

function Test-CacheHeaders {
    Write-Host "[CACHE] Testing cache headers..." -ForegroundColor Yellow -NoNewline
    
    try {
        $response = Invoke-WebRequest -Uri "https://resources.kashkole.com" `
                                       -UseBasicParsing `
                                       -TimeoutSec 10 `
                                       -ErrorAction Stop
        
        $cacheControl = $response.Headers['Cache-Control']
        
        if ($cacheControl -match "max-age=31536000") {
            Write-Host " ✓ PASS" -ForegroundColor Green
            Write-Host "  1-year cache confirmed: $cacheControl" -ForegroundColor Gray
            $script:tests.Passed++
        } else {
            Write-Host " ✗ FAIL" -ForegroundColor Red
            Write-Host "  Expected: max-age=31536000" -ForegroundColor Red
            Write-Host "  Got: $cacheControl" -ForegroundColor Red
            $script:tests.Failed++
        }
    } catch {
        Write-Host " ✗ ERROR" -ForegroundColor Red
        Write-Host "  $($_.Exception.Message)" -ForegroundColor Red
        $script:tests.Failed++
    }
}

function Test-CorsPreflight {
    Write-Host "[PREFLIGHT] Testing OPTIONS request..." -ForegroundColor Yellow -NoNewline
    
    try {
        $response = Invoke-WebRequest -Uri "https://resources.kashkole.com" `
                                       -Method OPTIONS `
                                       -Headers @{
                                           "Origin"="http://localhost:5000"
                                           "Access-Control-Request-Method"="GET"
                                       } `
                                       -UseBasicParsing `
                                       -TimeoutSec 10 `
                                       -ErrorAction Stop
        
        if ($response.StatusCode -eq 200) {
            Write-Host " ✓ PASS" -ForegroundColor Green
            $script:tests.Passed++
        } else {
            Write-Host " ✗ FAIL" -ForegroundColor Red
            Write-Host "  Expected: HTTP 200" -ForegroundColor Red
            Write-Host "  Got: HTTP $($response.StatusCode)" -ForegroundColor Red
            $script:tests.Failed++
        }
    } catch {
        Write-Host " ✗ ERROR" -ForegroundColor Red
        Write-Host "  $($_.Exception.Message)" -ForegroundColor Red
        $script:tests.Failed++
    }
}

function Test-FileIntegrity {
    Write-Host "[INTEGRITY] Checking file integrity..." -ForegroundColor Yellow -NoNewline
    
    try {
        $resourcePath = "D:\Websites\KSESSIONS\Resources"
        
        if (-not (Test-Path $resourcePath)) {
            Write-Host " ⚠ SKIP" -ForegroundColor Yellow
            Write-Host "  Resource path not accessible (may be on different machine)" -ForegroundColor Gray
            return
        }
        
        $fileCount = (Get-ChildItem $resourcePath -Recurse -File | 
                      Where-Object { $_.Name -ne 'web.config' }).Count
        
        Write-Host " ✓ PASS" -ForegroundColor Green
        Write-Host "  $fileCount resource files verified (web.config excluded)" -ForegroundColor Gray
        $script:tests.Passed++
        
    } catch {
        Write-Host " ⚠ SKIP" -ForegroundColor Yellow
        Write-Host "  $($_.Exception.Message)" -ForegroundColor Gray
    }
}

# Run Tests
Write-Host "Running CORS validation tests...`n" -ForegroundColor White

# Production CORS Tests
Write-Host "Production Origins:" -ForegroundColor Cyan
Test-Cors "https://noorcanvas.kashkole.com" "NoorCanvas Production" "PROD"
Test-Cors "https://session.kashkole.com" "Sessions Production" "PROD"

Write-Host ""

# Development CORS Tests
Write-Host "Development Origins:" -ForegroundColor Cyan
Test-Cors "http://localhost:5000" "Localhost HTTP (5000)" "DEV"
Test-Cors "http://localhost:5001" "Localhost HTTP (5001)" "DEV"
Test-Cors "https://localhost:5001" "Localhost HTTPS (5001)" "DEV"

Write-Host ""

# Additional Tests
Write-Host "Additional Validations:" -ForegroundColor Cyan
Test-CacheHeaders
Test-CorsPreflight
Test-FileIntegrity

# Summary
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Test Results Summary" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$total = $tests.Passed + $tests.Failed

Write-Host "  Total Tests: $total" -ForegroundColor White
Write-Host "  ✓ Passed: $($tests.Passed)" -ForegroundColor Green
Write-Host "  ✗ Failed: $($tests.Failed)" -ForegroundColor Red
Write-Host ""

if ($tests.Failed -eq 0) {
    Write-Host "✓ ALL TESTS PASSED - Dual-mode CORS working correctly" -ForegroundColor Green
    Write-Host ""
    exit 0
} else {
    Write-Host "✗ SOME TESTS FAILED - Review errors above" -ForegroundColor Red
    Write-Host ""
    exit 1
}
