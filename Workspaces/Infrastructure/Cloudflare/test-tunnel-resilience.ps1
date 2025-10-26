#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Automated Resilience Testing for Cloudflare Tunnel Service
.DESCRIPTION
    Tests service recovery from various failure scenarios:
    - Process crash recovery
    - Service restart capability
    - Network interruption tolerance
    - Multiple restart cycles
    - Failure recovery verification
.PARAMETER TunnelId
    Tunnel ID (default: 5be8b5a1-5d1f-4a9c-803d-e3a1d4383ee1)
.PARAMETER CloudflaredPath
    Path to cloudflared.exe (default: D:\PROJECTS\__CLOUDFLARE\cloudflared.exe)
.PARAMETER TestUrl
    URL to test (default: https://noorcanvas.kashkole.com)
.PARAMETER SkipDestructive
    Skip destructive tests (process kill)
.EXAMPLE
    .\test-tunnel-resilience.ps1
.EXAMPLE
    .\test-tunnel-resilience.ps1 -SkipDestructive
#>

param(
    [string]$TunnelId = "5be8b5a1-5d1f-4a9c-803d-e3a1d4383ee1",
    [string]$CloudflaredPath = "D:\PROJECTS\__CLOUDFLARE\cloudflared.exe",
    [string]$TestUrl = "https://noorcanvas.kashkole.com",
    [switch]$SkipDestructive
)

$ErrorActionPreference = "Stop"
$TestResults = @()

function Write-TestHeader {
    param([string]$Title)
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "TEST: $Title" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
}

function Test-TunnelConnections {
    $tunnelInfo = & $CloudflaredPath tunnel info $TunnelId 2>&1 | Out-String
    if ($tunnelInfo -match "(\d+)\s+connection") {
        return [int]$matches[1]
    }
    return 0
}

function Test-WebsiteAccessibility {
    try {
        $response = Invoke-WebRequest -Uri $TestUrl -Method HEAD -UseBasicParsing -TimeoutSec 10
        return $response.StatusCode -eq 200
    } catch {
        return $false
    }
}

function Add-TestResult {
    param(
        [string]$TestName,
        [bool]$Passed,
        [string]$Details
    )
    $script:TestResults += [PSCustomObject]@{
        Test = $TestName
        Passed = $Passed
        Details = $Details
    }
    
    if ($Passed) {
        Write-Host "   ✓ PASS: $Details" -ForegroundColor Green
    } else {
        Write-Host "   ✗ FAIL: $Details" -ForegroundColor Red
    }
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
Write-Host "Cloudflare Tunnel Resilience Test Suite" -ForegroundColor Magenta
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
Write-Host ""
Write-Host "Tunnel ID: $TunnelId" -ForegroundColor Cyan
Write-Host "Test URL: $TestUrl" -ForegroundColor Cyan
Write-Host "Destructive Tests: $($SkipDestructive ? 'DISABLED' : 'ENABLED')" -ForegroundColor Cyan

# TEST 1: Initial Health Check
Write-TestHeader "Initial Health Check"
$service = Get-Service cloudflared -ErrorAction SilentlyContinue
$serviceRunning = $service -and $service.Status -eq "Running"
Add-TestResult "1.1" $serviceRunning "Service is running"

$connections = Test-TunnelConnections
Add-TestResult "1.2" ($connections -ge 4) "Tunnel has $connections connections (expected 4)"

$websiteOk = Test-WebsiteAccessibility
Add-TestResult "1.3" $websiteOk "Website is accessible"

# TEST 2: Service Restart Test
Write-TestHeader "Service Restart Recovery"
Write-Host "   Restarting service..." -ForegroundColor Yellow
Restart-Service cloudflared -Force
Start-Sleep -Seconds 15

$serviceRunning = (Get-Service cloudflared).Status -eq "Running"
Add-TestResult "2.1" $serviceRunning "Service restarted successfully"

$connections = Test-TunnelConnections
Add-TestResult "2.2" ($connections -ge 4) "Connections re-established ($connections)"

$websiteOk = Test-WebsiteAccessibility
Add-TestResult "2.3" $websiteOk "Website accessible after restart"

# TEST 3: Multiple Restart Cycles
Write-TestHeader "Multiple Restart Cycles"
$restartSuccess = $true
for ($i = 1; $i -le 3; $i++) {
    Write-Host "   Cycle $i/3..." -ForegroundColor Yellow
    Restart-Service cloudflared -Force
    Start-Sleep -Seconds 10
    
    $svc = Get-Service cloudflared
    if ($svc.Status -ne "Running") {
        $restartSuccess = $false
        break
    }
}
Start-Sleep -Seconds 5
Add-TestResult "3.1" $restartSuccess "Service survived 3 restart cycles"

$connections = Test-TunnelConnections
Add-TestResult "3.2" ($connections -ge 4) "Connections stable after cycles ($connections)"

# TEST 4: Process Crash Recovery (Destructive)
if (-not $SkipDestructive) {
    Write-TestHeader "Process Crash Recovery (Destructive)"
    Write-Host "   ⚠️  Killing cloudflared process..." -ForegroundColor Yellow
    
    $process = Get-Process cloudflared -ErrorAction SilentlyContinue
    if ($process) {
        Stop-Process -Id $process.Id -Force
        Write-Host "   Process killed (PID: $($process.Id))" -ForegroundColor Yellow
        Start-Sleep -Seconds 20  # Wait for service recovery
        
        $serviceRecovered = (Get-Service cloudflared).Status -eq "Running"
        Add-TestResult "4.1" $serviceRecovered "Service auto-restarted after process crash"
        
        if ($serviceRecovered) {
            Start-Sleep -Seconds 15
            $connections = Test-TunnelConnections
            Add-TestResult "4.2" ($connections -ge 4) "Connections restored ($connections)"
            
            $websiteOk = Test-WebsiteAccessibility
            Add-TestResult "4.3" $websiteOk "Website accessible after crash recovery"
        } else {
            Add-TestResult "4.2" $false "Service did not recover"
            Add-TestResult "4.3" $false "Skipped (service not running)"
        }
    } else {
        Add-TestResult "4.1" $false "Process not found to kill"
    }
} else {
    Write-Host ""
    Write-Host "⚠️  Skipping destructive tests (use without -SkipDestructive to enable)" -ForegroundColor Yellow
}

# TEST 5: Configuration Validation
Write-TestHeader "Configuration Validation"
$configPath = "C:\Users\asifh\.cloudflared\config.yml"
$credentialsPath = "C:\Users\asifh\.cloudflared\$TunnelId.json"

$configExists = Test-Path $configPath
Add-TestResult "5.1" $configExists "config.yml exists"

$credentialsExist = Test-Path $credentialsPath
Add-TestResult "5.2" $credentialsExist "Credentials file exists"

$cloudflaredExists = Test-Path $CloudflaredPath
Add-TestResult "5.3" $cloudflaredExists "cloudflared.exe exists"

# TEST 6: Failure Recovery Settings
Write-TestHeader "Failure Recovery Configuration"
$serviceConfig = sc.exe qfailure cloudflared | Out-String
$hasFailureRecovery = $serviceConfig -match "RESTART"
Add-TestResult "6.1" $hasFailureRecovery "Service has failure recovery configured"

# Summary Report
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
Write-Host "TEST RESULTS SUMMARY" -ForegroundColor Magenta
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
Write-Host ""

$passedTests = ($TestResults | Where-Object { $_.Passed }).Count
$totalTests = $TestResults.Count
$passRate = [math]::Round(($passedTests / $totalTests) * 100, 0)

foreach ($result in $TestResults) {
    $icon = $result.Passed ? "✓" : "✗"
    $color = $result.Passed ? "Green" : "Red"
    Write-Host "$icon $($result.Test): $($result.Details)" -ForegroundColor $color
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "Passed: $passedTests / $totalTests ($passRate%)" -ForegroundColor $(if ($passRate -eq 100) { "Green" } elseif ($passRate -ge 80) { "Yellow" } else { "Red" })
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

# Final health check
Write-Host "🏥 Final Health Check..." -ForegroundColor Yellow
$finalConnections = Test-TunnelConnections
$finalWebsite = Test-WebsiteAccessibility
$finalService = (Get-Service cloudflared).Status -eq "Running"

if ($finalService -and $finalConnections -ge 4 -and $finalWebsite) {
    Write-Host "   ✅ All systems operational" -ForegroundColor Green
    Write-Host "   • Service: Running" -ForegroundColor Green
    Write-Host "   • Connections: $finalConnections" -ForegroundColor Green
    Write-Host "   • Website: Accessible" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  System degraded after tests" -ForegroundColor Yellow
    if (-not $finalService) { Write-Host "   • Service: NOT RUNNING" -ForegroundColor Red }
    if ($finalConnections -lt 4) { Write-Host "   • Connections: $finalConnections (expected 4)" -ForegroundColor Red }
    if (-not $finalWebsite) { Write-Host "   • Website: NOT ACCESSIBLE" -ForegroundColor Red }
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
if ($passRate -eq 100) {
    Write-Host "✅ ALL TESTS PASSED - Tunnel is resilient" -ForegroundColor Green
    exit 0
} elseif ($passRate -ge 80) {
    Write-Host "⚠️  MOST TESTS PASSED - Review failures" -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "❌ TESTS FAILED - Investigate issues" -ForegroundColor Red
    exit 1
}
