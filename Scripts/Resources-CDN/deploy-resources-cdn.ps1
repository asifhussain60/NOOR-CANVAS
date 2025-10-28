<#
.SYNOPSIS
    Complete deployment script for KSESSIONS Resources CDN

.DESCRIPTION
    Orchestrates the complete setup process:
    1. Configure IIS site with CORS and caching
    2. Install Cloudflare tunnel as Windows service
    3. Verify setup and connectivity
    4. Display next steps

.PARAMETER SkipIIS
    Skip IIS configuration (if already done)

.PARAMETER SkipTunnel
    Skip Cloudflare tunnel installation (if already done)

.EXAMPLE
    .\deploy-resources-cdn.ps1
    Complete deployment
    
.EXAMPLE
    .\deploy-resources-cdn.ps1 -SkipIIS
    Only install tunnel (IIS already configured)

.NOTES
    Requires: Administrator privileges
    Last Updated: 2025-10-26
#>

#Requires -RunAsAdministrator

[CmdletBinding()]
param(
    [switch]$SkipIIS,
    [switch]$SkipTunnel
)

$ErrorActionPreference = "Stop"

$scriptDir = $PSScriptRoot

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                                ║" -ForegroundColor Cyan
Write-Host "║        KSESSIONS Resources CDN Deployment                      ║" -ForegroundColor Cyan
Write-Host "║        Target: https://resources.kashkole.com                  ║" -ForegroundColor Cyan
Write-Host "║                                                                ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$startTime = Get-Date

# Step 1: Configure IIS
if (-not $SkipIIS) {
    Write-Host "═══ STEP 1/3: Configure IIS Site ═══" -ForegroundColor Yellow
    Write-Host ""
    
    $iisScript = Join-Path $scriptDir "setup-resources-cdn.ps1"
    if (-not (Test-Path $iisScript)) {
        Write-Host "ERROR: IIS setup script not found: $iisScript" -ForegroundColor Red
        exit 1
    }
    
    try {
        & $iisScript
        if ($LASTEXITCODE -ne 0) {
            throw "IIS configuration failed with exit code $LASTEXITCODE"
        }
    } catch {
        Write-Host "ERROR: IIS configuration failed: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "═══ STEP 1/3: Configure IIS Site [SKIPPED] ═══" -ForegroundColor Gray
}

Write-Host ""

# Step 2: Install Cloudflare Tunnel Service
if (-not $SkipTunnel) {
    Write-Host "═══ STEP 2/3: Install Cloudflare Tunnel Service ═══" -ForegroundColor Yellow
    Write-Host ""
    
    $tunnelScript = Join-Path $scriptDir "install-cloudflare-resources-service.ps1"
    if (-not (Test-Path $tunnelScript)) {
        Write-Host "ERROR: Tunnel setup script not found: $tunnelScript" -ForegroundColor Red
        exit 1
    }
    
    try {
        & $tunnelScript
        if ($LASTEXITCODE -ne 0) {
            throw "Tunnel installation failed with exit code $LASTEXITCODE"
        }
    } catch {
        Write-Host "ERROR: Tunnel installation failed: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "═══ STEP 2/3: Install Cloudflare Tunnel Service [SKIPPED] ═══" -ForegroundColor Gray
}

Write-Host ""

# Step 3: Verification
Write-Host "═══ STEP 3/3: Verification ═══" -ForegroundColor Yellow
Write-Host ""

# Test IIS
Write-Host "[1/3] Testing IIS site..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:80" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Write-Host "  ✓ IIS responding (HTTP $($response.StatusCode))" -ForegroundColor Green
    
    # Check CORS header
    $corsHeader = $response.Headers['Access-Control-Allow-Origin']
    if ($corsHeader) {
        Write-Host "  ✓ CORS headers configured" -ForegroundColor Green
    }
} catch {
    Write-Host "  ⚠ IIS test inconclusive: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "    (This may be normal if no default document exists)" -ForegroundColor Gray
}

# Check Cloudflare service
Write-Host "`n[2/3] Checking Cloudflare tunnel service..." -ForegroundColor Cyan
$service = Get-Service -Name "CloudflareResourcesTunnel" -ErrorAction SilentlyContinue
if ($service) {
    if ($service.Status -eq "Running") {
        Write-Host "  ✓ Service running" -ForegroundColor Green
        Write-Host "  ✓ Startup type: $($service.StartType)" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ Service exists but not running: $($service.Status)" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ⚠ Service not found" -ForegroundColor Yellow
}

# Test external URL (if DNS is configured)
Write-Host "`n[3/3] Testing external URL..." -ForegroundColor Cyan
try {
    $externalResponse = Invoke-WebRequest -Uri "https://resources.kashkole.com" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    Write-Host "  ✓ External URL accessible (HTTP $($externalResponse.StatusCode))" -ForegroundColor Green
    
    # Check CDN header
    $cdnHeader = $externalResponse.Headers['X-CDN-Server']
    if ($cdnHeader -eq 'KSESSIONS-Resources') {
        Write-Host "  ✓ CDN header verified" -ForegroundColor Green
    }
} catch {
    Write-Host "  ⚠ External URL not accessible yet" -ForegroundColor Yellow
    Write-Host "    This is normal if DNS propagation is in progress" -ForegroundColor Gray
    Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Gray
}

$endTime = Get-Date
$duration = $endTime - $startTime

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                                                                ║" -ForegroundColor Green
Write-Host "║                   DEPLOYMENT COMPLETE                          ║" -ForegroundColor Green
Write-Host "║                                                                ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "Time taken: $($duration.TotalSeconds) seconds" -ForegroundColor Gray
Write-Host ""
Write-Host "Resources CDN: https://resources.kashkole.com" -ForegroundColor Cyan
Write-Host "Backend: http://localhost:80 (IIS KashkoleResources)" -ForegroundColor Cyan
Write-Host ""

Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  1. Verify Cloudflare DNS Configuration" -ForegroundColor White
Write-Host "     - Ensure CNAME: resources.kashkole.com -> [tunnel-id].cfargotunnel.com" -ForegroundColor Gray
Write-Host "     - Check Cloudflare dashboard > DNS" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Test CORS from Production Apps" -ForegroundColor White
Write-Host "     curl -H `"Origin: https://noorcanvas.kashkole.com`" https://resources.kashkole.com" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. Run Full Verification Tests" -ForegroundColor White
Write-Host "     .\test-resources-cdn.ps1" -ForegroundColor Gray
Write-Host ""
Write-Host "  4. Update Application Code" -ForegroundColor White
Write-Host "     - FlagService.cs: Use https://resources.kashkole.com/images/flags/" -ForegroundColor Gray
Write-Host "     - UnifiedHtmlTransformService.cs: Update resource URLs" -ForegroundColor Gray
Write-Host ""

Write-Host "MONITORING:" -ForegroundColor Yellow
Write-Host "  Service status: Get-Service CloudflareResourcesTunnel" -ForegroundColor Gray
Write-Host "  View logs: Get-EventLog -LogName Application -Source cloudflared -Newest 20" -ForegroundColor Gray
Write-Host ""
