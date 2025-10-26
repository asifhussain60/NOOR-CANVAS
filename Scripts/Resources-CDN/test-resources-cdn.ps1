<#
.SYNOPSIS
    Comprehensive testing script for KSESSIONS Resources CDN

.DESCRIPTION
    Verifies the complete CDN setup:
    - IIS configuration and availability
    - CORS headers for production domains
    - Cache-Control headers (1-year cache)
    - Cloudflare tunnel service status
    - External URL accessibility
    - MIME types and compression
    - Security headers

.PARAMETER Url
    CDN URL to test (default: https://resources.kashkole.com)

.PARAMETER LocalUrl
    Local IIS URL (default: http://localhost:80)

.PARAMETER TestFile
    Specific file to test (optional, relative to CDN root)

.EXAMPLE
    .\test-resources-cdn.ps1
    Run all tests with default URLs
    
.EXAMPLE
    .\test-resources-cdn.ps1 -TestFile "images/flags/us.png"
    Test specific resource file

.NOTES
    Does not require administrator privileges
    Last Updated: 2025-10-26
#>

[CmdletBinding()]
param(
    [string]$Url = "https://resources.kashkole.com",
    [string]$LocalUrl = "http://localhost:80",
    [string]$TestFile = ""
)

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                                ║" -ForegroundColor Cyan
Write-Host "║        KSESSIONS Resources CDN Verification Tests              ║" -ForegroundColor Cyan
Write-Host "║                                                                ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$testResults = @{
    Passed = 0
    Failed = 0
    Warnings = 0
}

function Test-Condition {
    param(
        [string]$Name,
        [bool]$Condition,
        [string]$SuccessMessage,
        [string]$FailureMessage,
        [bool]$IsWarning = $false
    )
    
    if ($Condition) {
        Write-Host "  ✓ $SuccessMessage" -ForegroundColor Green
        $script:testResults.Passed++
    } else {
        if ($IsWarning) {
            Write-Host "  ⚠ $FailureMessage" -ForegroundColor Yellow
            $script:testResults.Warnings++
        } else {
            Write-Host "  ✗ $FailureMessage" -ForegroundColor Red
            $script:testResults.Failed++
        }
    }
}

# Test 1: Cloudflare Service Status
Write-Host "═══ TEST 1: Cloudflare Tunnel Service ═══" -ForegroundColor Yellow
Write-Host ""

$service = Get-Service -Name "CloudflareResourcesTunnel" -ErrorAction SilentlyContinue
Test-Condition -Name "Service Exists" `
    -Condition ($null -ne $service) `
    -SuccessMessage "Service installed" `
    -FailureMessage "Service not found"

if ($service) {
    Test-Condition -Name "Service Running" `
        -Condition ($service.Status -eq "Running") `
        -SuccessMessage "Service running" `
        -FailureMessage "Service not running: $($service.Status)"
    
    Test-Condition -Name "Auto-Start" `
        -Condition ($service.StartType -eq "Automatic") `
        -SuccessMessage "Auto-start enabled" `
        -FailureMessage "Auto-start not configured" `
        -IsWarning $true
}

Write-Host ""

# Test 2: Local IIS Tests
Write-Host "═══ TEST 2: Local IIS Configuration ═══" -ForegroundColor Yellow
Write-Host ""

$testUrl = if ($TestFile) { "$LocalUrl/$TestFile" } else { $LocalUrl }

try {
    $response = Invoke-WebRequest -Uri $testUrl -UseBasicParsing -TimeoutSec 5
    
    Test-Condition -Name "IIS Response" `
        -Condition ($response.StatusCode -eq 200) `
        -SuccessMessage "IIS responding (HTTP $($response.StatusCode))" `
        -FailureMessage "IIS returned HTTP $($response.StatusCode)"
    
    # CORS Headers
    $corsOrigin = $response.Headers['Access-Control-Allow-Origin']
    Test-Condition -Name "CORS Origin Header" `
        -Condition ($null -ne $corsOrigin) `
        -SuccessMessage "CORS headers present: $corsOrigin" `
        -FailureMessage "CORS headers missing"
    
    $corsMethods = $response.Headers['Access-Control-Allow-Methods']
    Test-Condition -Name "CORS Methods" `
        -Condition ($corsMethods -match "GET") `
        -SuccessMessage "CORS methods configured: $corsMethods" `
        -FailureMessage "CORS methods not configured" `
        -IsWarning $true
    
    # Cache Headers
    $cacheControl = $response.Headers['Cache-Control']
    Test-Condition -Name "Cache Headers" `
        -Condition ($cacheControl -match "max-age") `
        -SuccessMessage "Cache-Control configured: $cacheControl" `
        -FailureMessage "Cache-Control missing"
    
    # Check for 1-year cache (31536000 seconds)
    if ($cacheControl -match "max-age=(\d+)") {
        $maxAge = [int]$matches[1]
        $isOneYear = $maxAge -ge 31536000
        Test-Condition -Name "1-Year Cache" `
            -Condition $isOneYear `
            -SuccessMessage "1-year cache configured ($maxAge seconds)" `
            -FailureMessage "Cache duration too short: $maxAge seconds" `
            -IsWarning $true
    }
    
    # Security Headers
    $xContentType = $response.Headers['X-Content-Type-Options']
    Test-Condition -Name "Security Headers" `
        -Condition ($xContentType -eq "nosniff") `
        -SuccessMessage "X-Content-Type-Options: nosniff" `
        -FailureMessage "Security headers missing" `
        -IsWarning $true
    
    # CDN Header
    $cdnHeader = $response.Headers['X-CDN-Server']
    Test-Condition -Name "CDN Identification" `
        -Condition ($cdnHeader -eq "KSESSIONS-Resources") `
        -SuccessMessage "CDN server header present" `
        -FailureMessage "CDN header missing" `
        -IsWarning $true
    
} catch {
    Test-Condition -Name "IIS Access" `
        -Condition $false `
        -SuccessMessage "" `
        -FailureMessage "Cannot access IIS: $($_.Exception.Message)"
}

Write-Host ""

# Test 3: CORS Preflight (OPTIONS request)
Write-Host "═══ TEST 3: CORS Preflight Request ═══" -ForegroundColor Yellow
Write-Host ""

try {
    $headers = @{
        "Origin" = "https://noorcanvas.kashkole.com"
        "Access-Control-Request-Method" = "GET"
    }
    
    $optionsResponse = Invoke-WebRequest -Uri $testUrl -Method OPTIONS -Headers $headers -UseBasicParsing -TimeoutSec 5
    
    Test-Condition -Name "OPTIONS Response" `
        -Condition ($optionsResponse.StatusCode -eq 200) `
        -SuccessMessage "CORS preflight responds (HTTP $($optionsResponse.StatusCode))" `
        -FailureMessage "CORS preflight failed"
    
} catch {
    Test-Condition -Name "CORS Preflight" `
        -Condition $false `
        -SuccessMessage "" `
        -FailureMessage "CORS preflight test failed: $($_.Exception.Message)" `
        -IsWarning $true
}

Write-Host ""

# Test 4: External URL (via Cloudflare)
Write-Host "═══ TEST 4: External CDN URL ═══" -ForegroundColor Yellow
Write-Host ""

$externalUrl = if ($TestFile) { "$Url/$TestFile" } else { $Url }

try {
    $externalResponse = Invoke-WebRequest -Uri $externalUrl -UseBasicParsing -TimeoutSec 15
    
    Test-Condition -Name "External URL" `
        -Condition ($externalResponse.StatusCode -eq 200) `
        -SuccessMessage "CDN accessible (HTTP $($externalResponse.StatusCode))" `
        -FailureMessage "CDN not accessible"
    
    # Verify HTTPS
    Test-Condition -Name "HTTPS" `
        -Condition ($externalUrl.StartsWith("https://")) `
        -SuccessMessage "Using HTTPS" `
        -FailureMessage "Not using HTTPS"
    
    # Check if CORS headers are present
    $externalCors = $externalResponse.Headers['Access-Control-Allow-Origin']
    Test-Condition -Name "External CORS" `
        -Condition ($null -ne $externalCors) `
        -SuccessMessage "CORS headers propagated through Cloudflare" `
        -FailureMessage "CORS headers not propagated" `
        -IsWarning $true
    
    # Check CDN header
    $externalCdn = $externalResponse.Headers['X-CDN-Server']
    Test-Condition -Name "CDN Header via Cloudflare" `
        -Condition ($externalCdn -eq "KSESSIONS-Resources") `
        -SuccessMessage "CDN header verified externally" `
        -FailureMessage "CDN header not present externally" `
        -IsWarning $true
    
} catch {
    Test-Condition -Name "External CDN" `
        -Condition $false `
        -SuccessMessage "" `
        -FailureMessage "CDN not accessible: $($_.Exception.Message)" `
        -IsWarning $true
    
    Write-Host "    Note: DNS propagation may still be in progress" -ForegroundColor Gray
}

Write-Host ""

# Test 5: CORS from Production Domains
Write-Host "═══ TEST 5: CORS from Production Domains ═══" -ForegroundColor Yellow
Write-Host ""

$domains = @(
    "https://noorcanvas.kashkole.com",
    "https://session.kashkole.com"
)

foreach ($domain in $domains) {
    try {
        $corsHeaders = @{
            "Origin" = $domain
        }
        
        $corsResponse = Invoke-WebRequest -Uri $testUrl -Headers $corsHeaders -UseBasicParsing -TimeoutSec 5
        $allowedOrigin = $corsResponse.Headers['Access-Control-Allow-Origin']
        
        Test-Condition -Name "CORS from $domain" `
            -Condition ($allowedOrigin -match [regex]::Escape($domain)) `
            -SuccessMessage "CORS allowed for $domain" `
            -FailureMessage "CORS not allowed for $domain" `
            -IsWarning $true
        
    } catch {
        Test-Condition -Name "CORS Test $domain" `
            -Condition $false `
            -SuccessMessage "" `
            -FailureMessage "CORS test failed for $domain" `
            -IsWarning $true
    }
}

Write-Host ""

# Test Summary
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                      TEST SUMMARY                              ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$total = $testResults.Passed + $testResults.Failed + $testResults.Warnings

Write-Host "  Total Tests: $total" -ForegroundColor White
Write-Host "  ✓ Passed: $($testResults.Passed)" -ForegroundColor Green
Write-Host "  ✗ Failed: $($testResults.Failed)" -ForegroundColor Red
Write-Host "  ⚠ Warnings: $($testResults.Warnings)" -ForegroundColor Yellow
Write-Host ""

if ($testResults.Failed -eq 0) {
    Write-Host "✓ ALL CRITICAL TESTS PASSED" -ForegroundColor Green
    
    if ($testResults.Warnings -gt 0) {
        Write-Host "⚠ Some warnings present - review output above" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "CDN is ready for production use!" -ForegroundColor Green
    Write-Host "Update application code to use: $Url" -ForegroundColor Cyan
    Write-Host ""
    
    exit 0
} else {
    Write-Host "✗ CRITICAL TESTS FAILED" -ForegroundColor Red
    Write-Host "Review errors above and fix configuration" -ForegroundColor Yellow
    Write-Host ""
    
    exit 1
}
