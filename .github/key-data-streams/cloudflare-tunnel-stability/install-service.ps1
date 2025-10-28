# Cloudflared Windows Service Installation Script
# Installs cloudflared as a Windows Service with auto-recovery

param(
    [string]$CloudflaredPath = "D:\PROJECTS\__CLOUDFLARE\cloudflared.exe",
    [string]$ConfigPath = "C:\Users\asifh\.cloudflared\config.yml",
    [switch]$SkipStart
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Cloudflared Windows Service Installation" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""

# Check if running as administrator
$currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "❌ This script must be run as Administrator" -ForegroundColor Red
    Write-Host ""
    Write-Host "   Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# Step 1: Verify cloudflared.exe exists
Write-Host "1. Checking cloudflared.exe..." -ForegroundColor Yellow

if (-not (Test-Path $CloudflaredPath)) {
    Write-Host "   ❌ cloudflared.exe not found at: $CloudflaredPath" -ForegroundColor Red
    Write-Host ""
    Write-Host "   Please specify the correct path using -CloudflaredPath parameter" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host "   ✅ Found: $CloudflaredPath" -ForegroundColor Green

# Get cloudflared version
try {
    $versionOutput = & $CloudflaredPath --version 2>&1
    Write-Host "   ℹ️ Version: $versionOutput" -ForegroundColor Gray
} catch {
    Write-Host "   ⚠️ Could not get version info" -ForegroundColor Yellow
}

# Step 2: Verify config file exists
Write-Host "2. Checking config file..." -ForegroundColor Yellow

if (-not (Test-Path $ConfigPath)) {
    Write-Host "   ❌ Config file not found at: $ConfigPath" -ForegroundColor Red
    Write-Host ""
    Write-Host "   Please specify the correct path using -ConfigPath parameter" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host "   ✅ Found: $ConfigPath" -ForegroundColor Green

# Validate tunnel ID in config
$configContent = Get-Content $ConfigPath -Raw
$CANONICAL_TUNNEL_ID = "93650d38-60af-4dc7-a5ec-f8347fc57514"

if ($configContent -match "tunnel:\s*([a-f0-9\-]{36})") {
    $tunnelId = $matches[1]
    
    if ($tunnelId -eq $CANONICAL_TUNNEL_ID) {
        Write-Host "   ✅ Tunnel ID is canonical: $CANONICAL_TUNNEL_ID" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️ Tunnel ID mismatch!" -ForegroundColor Yellow
        Write-Host "      Expected: $CANONICAL_TUNNEL_ID" -ForegroundColor Yellow
        Write-Host "      Found:    $tunnelId" -ForegroundColor Red
        Write-Host ""
        $continue = Read-Host "   Continue anyway? (y/N)"
        if ($continue -ne "y" -and $continue -ne "Y") {
            Write-Host "   Installation cancelled" -ForegroundColor Yellow
            exit 1
        }
    }
}

# Step 3: Stop and remove existing service if present
Write-Host "3. Checking for existing service..." -ForegroundColor Yellow

$existingService = Get-Service -Name "cloudflared" -ErrorAction SilentlyContinue

if ($existingService) {
    Write-Host "   ℹ️ Existing service found" -ForegroundColor Gray
    
    if ($existingService.Status -eq "Running") {
        Write-Host "   ⏸️ Stopping existing service..." -ForegroundColor Yellow
        Stop-Service -Name "cloudflared" -Force
        Start-Sleep -Seconds 2
        Write-Host "   ✅ Service stopped" -ForegroundColor Green
    }
    
    Write-Host "   🗑️ Removing existing service..." -ForegroundColor Yellow
    & sc.exe delete cloudflared | Out-Null
    Start-Sleep -Seconds 2
    Write-Host "   ✅ Service removed" -ForegroundColor Green
} else {
    Write-Host "   ℹ️ No existing service found" -ForegroundColor Gray
}

# Step 4: Install service
Write-Host "4. Installing cloudflared as Windows Service..." -ForegroundColor Yellow

try {
    & $CloudflaredPath service install --config=$ConfigPath
    Write-Host "   ✅ Service installed successfully" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Service installation failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 5: Configure auto-recovery (restart on failure)
Write-Host "5. Configuring service auto-recovery..." -ForegroundColor Yellow

# Set recovery options: restart after 1 minute on failure (3 attempts)
& sc.exe failure cloudflared reset= 86400 actions= restart/60000/restart/60000/restart/60000 | Out-Null
Write-Host "   ✅ Auto-recovery configured (3 restart attempts)" -ForegroundColor Green

# Set service to start automatically
& sc.exe config cloudflared start= auto | Out-Null
Write-Host "   ✅ Service set to Automatic start" -ForegroundColor Green

# Set service description
$description = "Cloudflare Tunnel for kashkole.com (noorcanvas, resources, session). Tunnel ID: $CANONICAL_TUNNEL_ID"
& sc.exe description cloudflared $description | Out-Null
Write-Host "   ✅ Service description set" -ForegroundColor Green

# Step 6: Start service (unless skipped)
if (-not $SkipStart) {
    Write-Host "6. Starting cloudflared service..." -ForegroundColor Yellow
    
    try {
        Start-Service -Name "cloudflared"
        Start-Sleep -Seconds 3
        
        $service = Get-Service -Name "cloudflared"
        if ($service.Status -eq "Running") {
            Write-Host "   ✅ Service is running" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️ Service status: $($service.Status)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "   ❌ Failed to start service: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
        Write-Host "   Check Event Viewer for details:" -ForegroundColor Yellow
        Write-Host "   - Open Event Viewer" -ForegroundColor Gray
        Write-Host "   - Navigate to: Windows Logs → Application" -ForegroundColor Gray
        Write-Host "   - Look for cloudflared errors" -ForegroundColor Gray
        Write-Host ""
    }
} else {
    Write-Host "6. Starting service skipped (use -SkipStart to skip)" -ForegroundColor Gray
}

# Step 7: Display service information
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "✅ INSTALLATION COMPLETE" -ForegroundColor Green
Write-Host ""

$service = Get-Service -Name "cloudflared"
Write-Host "Service Configuration:" -ForegroundColor Cyan
Write-Host "  Name:         cloudflared" -ForegroundColor Gray
Write-Host "  Display Name: $($service.DisplayName)" -ForegroundColor Gray
Write-Host "  Status:       $($service.Status)" -ForegroundColor Gray
Write-Host "  Start Type:   $($service.StartType)" -ForegroundColor Gray
Write-Host "  Recovery:     Restart on failure (3 attempts, 1 min delay)" -ForegroundColor Gray
Write-Host "  Config:       $ConfigPath" -ForegroundColor Gray
Write-Host "  Tunnel ID:    $CANONICAL_TUNNEL_ID" -ForegroundColor Gray
Write-Host ""

Write-Host "Useful Commands:" -ForegroundColor Cyan
Write-Host "  Check status:    Get-Service cloudflared" -ForegroundColor Gray
Write-Host "  Start service:   Start-Service cloudflared" -ForegroundColor Gray
Write-Host "  Stop service:    Stop-Service cloudflared" -ForegroundColor Gray
Write-Host "  Restart service: Restart-Service cloudflared" -ForegroundColor Gray
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Test URLs are accessible:" -ForegroundColor Gray
Write-Host "     - https://noorcanvas.kashkole.com" -ForegroundColor Gray
Write-Host "     - https://resources.kashkole.com" -ForegroundColor Gray
Write-Host "     - https://session.kashkole.com" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Test auto-recovery:" -ForegroundColor Gray
Write-Host "     Stop-Service cloudflared -Force" -ForegroundColor DarkGray
Write-Host "     Start-Sleep -Seconds 65" -ForegroundColor DarkGray
Write-Host "     Get-Service cloudflared  # Should be Running" -ForegroundColor DarkGray
Write-Host ""

exit 0
