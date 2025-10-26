#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Comprehensive Health Check for Cloudflare Tunnel
.DESCRIPTION
    Validates all aspects of tunnel health:
    - Windows service status
    - Process existence
    - Tunnel connections
    - Configuration files
    - Website accessibility
.PARAMETER TunnelId
    Tunnel ID (default: 5be8b5a1-5d1f-4a9c-803d-e3a1d4383ee1)
.PARAMETER CloudflaredPath
    Path to cloudflared.exe (default: D:\PROJECTS\__CLOUDFLARE\cloudflared.exe)
.PARAMETER ConfigPath
    Path to config.yml (default: C:\Users\asifh\.cloudflared\config.yml)
.PARAMETER TestUrls
    URLs to test (default: noorcanvas.kashkole.com, session.kashkole.com)
.EXAMPLE
    .\check-tunnel-health.ps1
#>

param(
    [string]$TunnelId = "5be8b5a1-5d1f-4a9c-803d-e3a1d4383ee1",
    [string]$CloudflaredPath = "D:\PROJECTS\__CLOUDFLARE\cloudflared.exe",
    [string]$ConfigPath = "C:\Users\asifh\.cloudflared\config.yml",
    [string[]]$TestUrls = @("https://noorcanvas.kashkole.com", "https://session.kashkole.com")
)

$ErrorActionPreference = "Stop"
$HealthStatus = @{
    Service = $false
    Process = $false
    Connections = $false
    ConfigFiles = $false
    Websites = $false
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "Cloudflare Tunnel Health Check" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# 1. Check service status
Write-Host "🔧 SERVICE STATUS" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
$service = Get-Service cloudflared -ErrorAction SilentlyContinue
if ($service) {
    $status = $service.Status
    $startType = $service.StartType
    if ($status -eq "Running") {
        Write-Host "   ✓ Status: $status" -ForegroundColor Green
        $HealthStatus.Service = $true
    } else {
        Write-Host "   ✗ Status: $status" -ForegroundColor Red
    }
    Write-Host "   • Start Type: $startType" -ForegroundColor Cyan
} else {
    Write-Host "   ✗ Service not found" -ForegroundColor Red
}
Write-Host ""

# 2. Check process
Write-Host "⚙️  PROCESS STATUS" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
$process = Get-Process cloudflared -ErrorAction SilentlyContinue
if ($process) {
    Write-Host "   ✓ Process ID: $($process.Id)" -ForegroundColor Green
    Write-Host "   • CPU Time: $($process.CPU)" -ForegroundColor Cyan
    Write-Host "   • Memory: $([math]::Round($process.WorkingSet64 / 1MB, 2)) MB" -ForegroundColor Cyan
    $HealthStatus.Process = $true
} else {
    Write-Host "   ✗ Process not running" -ForegroundColor Red
}
Write-Host ""

# 3. Check tunnel connections
Write-Host "🔗 TUNNEL CONNECTIONS" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
if (Test-Path $CloudflaredPath) {
    $tunnelInfo = & $CloudflaredPath tunnel info $TunnelId 2>&1
    $tunnelInfoStr = $tunnelInfo | Out-String
    
    # Check for connection count
    if ($tunnelInfoStr -match "(\d+)\s+connection") {
        $connCount = [int]$matches[1]
        if ($connCount -ge 4) {
            Write-Host "   ✓ Connections: $connCount" -ForegroundColor Green
            $HealthStatus.Connections = $true
        } else {
            Write-Host "   ⚠ Connections: $connCount (expected 4)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   ✗ No connections detected" -ForegroundColor Red
    }
    
    Write-Host "   • Tunnel ID: $TunnelId" -ForegroundColor Cyan
} else {
    Write-Host "   ✗ cloudflared.exe not found at $CloudflaredPath" -ForegroundColor Red
}
Write-Host ""

# 4. Check configuration files
Write-Host "📄 CONFIGURATION FILES" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
$credentialsPath = "C:\Users\asifh\.cloudflared\$TunnelId.json"
$configExists = Test-Path $ConfigPath
$credentialsExist = Test-Path $credentialsPath
$cloudflaredExists = Test-Path $CloudflaredPath

if ($configExists -and $credentialsExist -and $cloudflaredExists) {
    Write-Host "   ✓ config.yml: Found" -ForegroundColor Green
    Write-Host "   ✓ credentials: Found" -ForegroundColor Green
    Write-Host "   ✓ cloudflared.exe: Found" -ForegroundColor Green
    $HealthStatus.ConfigFiles = $true
} else {
    if (-not $configExists) { Write-Host "   ✗ config.yml: Missing" -ForegroundColor Red }
    if (-not $credentialsExist) { Write-Host "   ✗ credentials: Missing" -ForegroundColor Red }
    if (-not $cloudflaredExists) { Write-Host "   ✗ cloudflared.exe: Missing" -ForegroundColor Red }
}
Write-Host ""

# 5. Test website accessibility
Write-Host "🌐 WEBSITE ACCESSIBILITY" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
$allSitesOk = $true
foreach ($url in $TestUrls) {
    try {
        $response = Invoke-WebRequest -Uri $url -Method HEAD -UseBasicParsing -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Host "   ✓ $url (HTTP $($response.StatusCode))" -ForegroundColor Green
        } else {
            Write-Host "   ⚠ $url (HTTP $($response.StatusCode))" -ForegroundColor Yellow
            $allSitesOk = $false
        }
    } catch {
        Write-Host "   ✗ $url (Error: $($_.Exception.Message))" -ForegroundColor Red
        $allSitesOk = $false
    }
}
$HealthStatus.Websites = $allSitesOk
Write-Host ""

# Summary
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "HEALTH CHECK SUMMARY" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
$totalChecks = $HealthStatus.Count
$passedChecks = ($HealthStatus.Values | Where-Object { $_ -eq $true }).Count
$healthPercentage = [math]::Round(($passedChecks / $totalChecks) * 100, 0)

Write-Host "Service:       $($HealthStatus.Service -eq $true ? '✓' : '✗')" -ForegroundColor ($HealthStatus.Service ? "Green" : "Red")
Write-Host "Process:       $($HealthStatus.Process -eq $true ? '✓' : '✗')" -ForegroundColor ($HealthStatus.Process ? "Green" : "Red")
Write-Host "Connections:   $($HealthStatus.Connections -eq $true ? '✓' : '✗')" -ForegroundColor ($HealthStatus.Connections ? "Green" : "Red")
Write-Host "Config Files:  $($HealthStatus.ConfigFiles -eq $true ? '✓' : '✗')" -ForegroundColor ($HealthStatus.ConfigFiles ? "Green" : "Red")
Write-Host "Websites:      $($HealthStatus.Websites -eq $true ? '✓' : '✗')" -ForegroundColor ($HealthStatus.Websites ? "Green" : "Red")
Write-Host ""
Write-Host "Overall Health: $passedChecks/$totalChecks ($healthPercentage%)" -ForegroundColor $(if ($healthPercentage -eq 100) { "Green" } elseif ($healthPercentage -ge 80) { "Yellow" } else { "Red" })
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Exit with appropriate code
if ($passedChecks -eq $totalChecks) {
    Write-Host "✅ All checks passed!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "⚠️  Some checks failed. Review the output above." -ForegroundColor Yellow
    exit 1
}
