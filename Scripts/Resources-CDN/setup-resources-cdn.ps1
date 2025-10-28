<#
.SYNOPSIS
    Configure KSESSIONS Resources IIS site for CDN delivery via Cloudflare

.DESCRIPTION
    Sets up the KashkoleResources IIS site with:
    - CORS headers for noorcanvas.kashkole.com and session.kashkole.com
    - 1-year cache headers for static assets
    - Static compression
    - Security headers

.PARAMETER SiteName
    IIS site name (default: KashkoleResources)

.PARAMETER PhysicalPath
    Physical path to resources (default: D:\Websites\KSESSIONS\Resources)

.PARAMETER IncludeDevelopment
    Include localhost origins for development CORS access

.EXAMPLE
    .\setup-resources-cdn.ps1
    Production-only CORS (default)

.EXAMPLE
    .\setup-resources-cdn.ps1 -IncludeDevelopment
    Include localhost:5000, localhost:5001, and https://localhost:5001 for development
    
.NOTES
    Requires: Administrator privileges
    Last Updated: 2025-10-26
#>

#Requires -RunAsAdministrator

[CmdletBinding()]
param(
    [string]$SiteName = "KashkoleResources",
    [string]$PhysicalPath = "D:\Websites\KSESSIONS\Resources",
    [switch]$IncludeDevelopment
)

$ErrorActionPreference = "Stop"

# Determine CORS origins based on mode
if ($IncludeDevelopment) {
    $corsOrigins = @(
        "https://noorcanvas.kashkole.com",
        "https://session.kashkole.com",
        "http://localhost:5000",
        "http://localhost:5001",
        "https://localhost:5001"
    )
    $modeLabel = "Development + Production"
    $modeColor = "Cyan"
} else {
    $corsOrigins = @(
        "https://noorcanvas.kashkole.com",
        "https://session.kashkole.com"
    )
    $modeLabel = "Production Only"
    $modeColor = "Green"
}

$corsValue = $corsOrigins -join ","

Write-Host "`n=== Configuring KSESSIONS Resources CDN ===" -ForegroundColor Cyan
Write-Host "Site: $SiteName" -ForegroundColor White
Write-Host "Path: $PhysicalPath" -ForegroundColor White
Write-Host "Mode: $modeLabel ($($corsOrigins.Count) origins)" -ForegroundColor $modeColor
$corsOrigins | ForEach-Object { Write-Host "  - $_" -ForegroundColor Gray }
Write-Host ""

# Verify physical path exists
if (-not (Test-Path $PhysicalPath)) {
    Write-Host "ERROR: Physical path not found: $PhysicalPath" -ForegroundColor Red
    exit 1
}

# Import WebAdministration module
Import-Module WebAdministration -ErrorAction SilentlyContinue

# Verify site exists
Write-Host "[1/4] Checking IIS site..." -ForegroundColor Yellow
$site = Get-Website -Name $SiteName -ErrorAction SilentlyContinue
if (-not $site) {
    Write-Host "  Site '$SiteName' not found. Creating..." -ForegroundColor Yellow
    New-Website -Name $SiteName -PhysicalPath $PhysicalPath -Port 80 -Force
    Write-Host "  ✓ Site created" -ForegroundColor Green
} else {
    Write-Host "  ✓ Site exists" -ForegroundColor Green
}

# Ensure site is on port 80
$binding = Get-WebBinding -Name $SiteName -Protocol "http" -Port 80 -ErrorAction SilentlyContinue
if (-not $binding) {
    Write-Host "  Adding HTTP binding on port 80..." -ForegroundColor Yellow
    New-WebBinding -Name $SiteName -Protocol "http" -Port 80 -IPAddress "*"
}

# Create web.config with CORS and caching
Write-Host "`n[2/4] Creating web.config..." -ForegroundColor Yellow

$webConfig = @"
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    
    <!-- CORS Headers for NoorCanvas and Sessions -->
    <httpProtocol>
      <customHeaders>
        <!-- Allow requests from configured origins -->
        <add name="Access-Control-Allow-Origin" value="$corsValue" />
        <add name="Access-Control-Allow-Methods" value="GET, HEAD, OPTIONS" />
        <add name="Access-Control-Allow-Headers" value="Content-Type, Accept, Origin" />
        <add name="Access-Control-Max-Age" value="86400" />
        
        <!-- Security Headers -->
        <add name="X-Content-Type-Options" value="nosniff" />
        <add name="X-Frame-Options" value="SAMEORIGIN" />
        <add name="Referrer-Policy" value="strict-origin-when-cross-origin" />
        
        <!-- CDN Identification -->
        <add name="X-CDN-Server" value="KSESSIONS-Resources" />
      </customHeaders>
    </httpProtocol>

    <!-- 1-Year Cache for Static Assets -->
    <staticContent>
      <clientCache cacheControlMode="UseMaxAge" cacheControlMaxAge="365.00:00:00" />
      
      <!-- MIME Types -->
      <mimeMap fileExtension=".json" mimeType="application/json" />
      <mimeMap fileExtension=".woff" mimeType="font/woff" />
      <mimeMap fileExtension=".woff2" mimeType="font/woff2" />
      <mimeMap fileExtension=".ttf" mimeType="font/ttf" />
      <mimeMap fileExtension=".eot" mimeType="application/vnd.ms-fontobject" />
      <mimeMap fileExtension=".svg" mimeType="image/svg+xml" />
      <mimeMap fileExtension=".webp" mimeType="image/webp" />
    </staticContent>

    <!-- Static Compression -->
    <urlCompression doStaticCompression="true" doDynamicCompression="false" />
    
    <!-- Directory Browsing -->
    <directoryBrowse enabled="false" />

    <!-- Handle CORS Preflight Requests -->
    <rewrite>
      <rules>
        <rule name="CORS Preflight" stopProcessing="true">
          <match url=".*" />
          <conditions>
            <add input="{REQUEST_METHOD}" pattern="OPTIONS" />
          </conditions>
          <action type="CustomResponse" statusCode="200" statusReason="OK" statusDescription="CORS Preflight" />
        </rule>
      </rules>
    </rewrite>

  </system.webServer>
</configuration>
"@

$webConfigPath = Join-Path $PhysicalPath "web.config"
try {
    Set-Content -Path $webConfigPath -Value $webConfig -Force -Encoding UTF8
    Write-Host "  ✓ web.config created" -ForegroundColor Green
} catch {
    Write-Host "  ERROR: Failed to create web.config: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Start the site if not running
Write-Host "`n[3/4] Starting IIS site..." -ForegroundColor Yellow
$siteState = (Get-Website -Name $SiteName).State
if ($siteState -ne "Started") {
    Start-Website -Name $SiteName
    Start-Sleep -Seconds 2
    Write-Host "  ✓ Site started" -ForegroundColor Green
} else {
    # Restart to apply changes
    Stop-Website -Name $SiteName
    Start-Sleep -Seconds 1
    Start-Website -Name $SiteName
    Start-Sleep -Seconds 2
    Write-Host "  ✓ Site restarted" -ForegroundColor Green
}

# Test local access
Write-Host "`n[4/4] Testing local access..." -ForegroundColor Yellow
try {
    $testUrl = "http://localhost:80"
    $response = Invoke-WebRequest -Uri $testUrl -UseBasicParsing -TimeoutSec 5
    Write-Host "  ✓ HTTP $($response.StatusCode) - Site responding" -ForegroundColor Green
    
    # Check for CORS header
    $corsHeader = $response.Headers['Access-Control-Allow-Origin']
    if ($corsHeader) {
        Write-Host "  ✓ CORS header present" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ CORS header not found in response" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ⚠ Local test failed: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "    This may be normal if site has no default document" -ForegroundColor Gray
}

Write-Host "`n=== IIS Configuration Complete ===" -ForegroundColor Green
Write-Host "Site: $SiteName" -ForegroundColor Cyan
Write-Host "URL: http://localhost:80" -ForegroundColor Cyan
Write-Host "`nNext: Run install-cloudflare-resources-service.ps1 to set up tunnel`n" -ForegroundColor Yellow
