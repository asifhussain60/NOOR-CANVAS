# Cloudflare Tunnel Stability Plan

**Key**: `cloudflare-tunnel-stability`  
**Version**: 1.0  
**Status**: Ready for implementation  
**Created**: 2025-10-26  
**Branch**: `development`

---

## Executive Summary

**Objective**: Ensure Cloudflare tunnel ID `93650d38-60af-4dc7-a5ec-f8347fc57514` remains stable and never changes, with automated protection mechanisms and comprehensive monitoring.

**Problem**: Documentation references 3 different tunnel IDs while DNS records point to a 4th ID, creating confusion and risk of accidental tunnel recreation.

**Solution**: Implement git guardrails, Windows Service with auto-recovery, validation scripts, and update all documentation to canonical tunnel ID.

**Scope**: 7 phases covering integrity verification, protection mechanisms, service installation, monitoring, and documentation synchronization.

---

## Configuration Evidence

### Current State (Validated 2025-10-26)

**Canonical Tunnel ID**: `93650d38-60af-4dc7-a5ec-f8347fc57514`

**Cloudflare DNS Records (kashkole.com)**:
```
Type    Name         Content (Target)
CNAME   noorcanvas   93650d38-60af-4dc7-a5ec-f8347fc57514.cfargotunnel.com
CNAME   resources    93650d38-60af-4dc7-a5ec-f8347fc57514.cfargotunnel.com
CNAME   session      93650d38-60af-4dc7-a5ec-f8347fc57514.cfargotunnel.com
```

**Proxy Status**: Proxied (Orange cloud enabled)  
**TTL**: Auto  
**DNS Setup**: Full (not partial)

**Local Configuration Files**:
- Config: `C:\Users\asifh\.cloudflared\config.yml`
- Credentials: `C:\Users\asifh\.cloudflared\93650d38-60af-4dc7-a5ec-f8347fc57514.json`
- External tools: `D:\PROJECTS\__CLOUDFLARE\`

**Current config.yml**:
```yaml
tunnel: 93650d38-60af-4dc7-a5ec-f8347fc57514
credentials-file: C:\Users\asifh\.cloudflared\93650d38-60af-4dc7-a5ec-f8347fc57514.json

ingress:
  - hostname: resources.kashkole.com
    service: https://127.0.0.1:443
    originRequest:
      noTLSVerify: true
      httpHostHeader: resources.kashkole.com
  - hostname: noorcanvas.kashkole.com
    service: http://127.0.0.1:80
    originRequest:
      noTLSVerify: true
      httpHostHeader: noorcanvas.kashkole.com
  - hostname: session.kashkole.com
    service: http://127.0.0.1:8080
  - service: http_status:404
```

### Documentation Drift (Current State)

**Incorrect tunnel IDs in documentation**:
- ❌ `D:\PROJECTS\__CLOUDFLARE\README.md`: `5474d3b4-50ea-4588-8763-5fc7da533d6c`
- ❌ `.github/instructions/IIS-Configuration.md`: `4e2266b5-48ed-429d-b9d3-e235186e9dca`
- ❌ `.github/instructions/CDN-Architecture.md`: `5474d3b4-50ea-4588-8763-5fc7da533d6c`

**Correct references**:
- ✅ `C:\Users\asifh\.cloudflared\config.yml`: `93650d38-60af-4dc7-a5ec-f8347fc57514`
- ✅ Cloudflare DNS CNAME records: `93650d38-60af-4dc7-a5ec-f8347fc57514`

---

## Assumptions Validated

**@workspace - Configuration Files**:
- Config file exists at `C:\Users\asifh\.cloudflared\config.yml` with correct tunnel ID
- Credentials file exists at `C:\Users\asifh\.cloudflared\93650d38-60af-4dc7-a5ec-f8347fc57514.json`
- No cloudflared services currently running (verified via Get-Service, Get-Process)
- External cloudflare tools directory exists at `D:\PROJECTS\__CLOUDFLARE`

**@cloudflare-dns - DNS Configuration**:
- All 3 production subdomains use CNAME records pointing to `93650d38-...cfargotunnel.com`
- Proxy status is enabled (orange cloud)
- DNS is in Full mode (not partial)

**@workspace - Documentation State**:
- IIS-Configuration.md exists in `.github/instructions/`
- CDN-Architecture.md exists in `.github/instructions/`
- External README.md exists in `D:\PROJECTS\__CLOUDFLARE\`
- All 3 docs reference incorrect/outdated tunnel IDs

**@codebase - Git History**:
- Recent CDN implementation (commit be6c0c4e) may have caused tunnel confusion
- No git hooks currently exist for config validation
- No protection against tunnel ID changes in config.yml

---

## Root Cause Analysis

### Problem Statement

**Multiple tunnel IDs scattered across system** creating risk of:
1. Accidental tunnel recreation with wrong ID
2. DNS mismatch if config changes
3. Service failures after documentation-driven changes
4. Loss of production connectivity

### Why Tunnel IDs Change

**Common scenarios**:
1. Running `cloudflared tunnel create` commands from outdated documentation
2. Copy-pasting config examples with embedded tunnel IDs
3. Restoring from backups with old tunnel IDs
4. Following setup guides that create new tunnels instead of using existing

### Impact of Tunnel ID Change

**If tunnel ID changes in config.yml**:
- ❌ DNS CNAME records become invalid (still point to old tunnel)
- ❌ All 3 production URLs return DNS_PROBE_FINISHED_NXDOMAIN
- ❌ Requires manual DNS updates in Cloudflare dashboard
- ❌ Production downtime until DNS propagates (up to 5 minutes)

**Current risk level**: **HIGH** - Documentation contains 3 wrong IDs

---

## Implementation Phases

### Phase 1: Verify Tunnel Integrity

**Objective**: Confirm existing tunnel configuration is valid and operational

**Tasks**:
1. Verify credentials file exists and is valid JSON
2. Test tunnel connectivity (local validation)
3. Verify DNS records match config tunnel ID
4. Document current working state as baseline
5. Create backup of working config and credentials

**Validation**:
```powershell
# Verify credentials file exists
Test-Path "C:\Users\asifh\.cloudflared\93650d38-60af-4dc7-a5ec-f8347fc57514.json"

# Verify config tunnel ID matches DNS
$configId = (Get-Content "C:\Users\asifh\.cloudflared\config.yml" | Select-String "^tunnel:").ToString().Split(":")[1].Trim()
$dnsTarget = (Resolve-DnsName noorcanvas.kashkole.com -Type CNAME).NameHost

# They should match
if ($dnsTarget -like "$configId*") {
    Write-Host "✅ Config and DNS match" -ForegroundColor Green
} else {
    Write-Host "❌ MISMATCH!" -ForegroundColor Red
}
```

**Success Criteria**:
- ✅ Credentials file is valid JSON
- ✅ Config tunnel ID matches DNS CNAME targets
- ✅ All 3 hostnames resolve correctly
- ✅ Backup created successfully

**Files Created**:
- `.github/key-data-streams/cloudflare-tunnel-stability/backups/config.yml.backup`
- `.github/key-data-streams/cloudflare-tunnel-stability/backups/credentials.json.backup.encrypted`
- `.github/key-data-streams/cloudflare-tunnel-stability/verification-report.txt`

---

### Phase 2: Git Protection Hook

**Objective**: Prevent accidental tunnel ID changes via git pre-commit hook

**Implementation**:

Create `.git/hooks/pre-commit` (PowerShell-based):

```powershell
#!/usr/bin/env pwsh
# Pre-commit hook: Validate Cloudflare tunnel ID immutability
# Location: .git/hooks/pre-commit

$ErrorActionPreference = "Stop"

# Canonical tunnel ID (from DNS records)
$CANONICAL_TUNNEL_ID = "93650d38-60af-4dc7-a5ec-f8347fc57514"

# Files to check
$configFiles = @(
    "C:\Users\asifh\.cloudflared\config.yml"
)

Write-Host "🔍 Validating Cloudflare tunnel configuration..." -ForegroundColor Cyan

foreach ($file in $configFiles) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        
        # Extract tunnel ID from config
        if ($content -match "tunnel:\s*([a-f0-9\-]{36})") {
            $tunnelId = $matches[1]
            
            if ($tunnelId -ne $CANONICAL_TUNNEL_ID) {
                Write-Host "" -ForegroundColor Red
                Write-Host "❌ COMMIT REJECTED: Tunnel ID changed!" -ForegroundColor Red
                Write-Host "" -ForegroundColor Red
                Write-Host "   Expected: $CANONICAL_TUNNEL_ID" -ForegroundColor Yellow
                Write-Host "   Found:    $tunnelId" -ForegroundColor Red
                Write-Host "" -ForegroundColor Red
                Write-Host "   DNS CNAME records point to $CANONICAL_TUNNEL_ID" -ForegroundColor Yellow
                Write-Host "   Changing tunnel ID will break production URLs!" -ForegroundColor Red
                Write-Host "" -ForegroundColor Red
                Write-Host "   To fix: Revert changes to $file" -ForegroundColor Yellow
                Write-Host "" -ForegroundColor Red
                exit 1
            }
        }
    }
}

Write-Host "✅ Tunnel ID validation passed" -ForegroundColor Green
exit 0
```

**Additional Protection**: Create workspace-level git hook

Location: `.github/hooks/validate-tunnel-id.ps1`

```powershell
# Workspace-level validation (can be run manually or in CI)
param(
    [string]$ConfigPath = "C:\Users\asifh\.cloudflared\config.yml"
)

$CANONICAL_ID = "93650d38-60af-4dc7-a5ec-f8347fc57514"

if (-not (Test-Path $ConfigPath)) {
    Write-Host "⚠️ Config file not found: $ConfigPath" -ForegroundColor Yellow
    exit 0  # Skip if config doesn't exist
}

$content = Get-Content $ConfigPath -Raw

if ($content -match "tunnel:\s*([a-f0-9\-]{36})") {
    $foundId = $matches[1]
    
    if ($foundId -ne $CANONICAL_ID) {
        Write-Host "❌ Tunnel ID mismatch detected!" -ForegroundColor Red
        Write-Host "   Expected: $CANONICAL_ID" -ForegroundColor Yellow
        Write-Host "   Found:    $foundId" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Tunnel ID is correct: $CANONICAL_ID" -ForegroundColor Green
exit 0
```

**Success Criteria**:
- ✅ Pre-commit hook installed in `.git/hooks/`
- ✅ Hook is executable (chmod +x on Unix, verify on Windows)
- ✅ Test commit with wrong tunnel ID is rejected
- ✅ Test commit with correct tunnel ID is allowed
- ✅ Workspace validation script works independently

**Files Created**:
- `.git/hooks/pre-commit` (PowerShell script)
- `.github/hooks/validate-tunnel-id.ps1` (workspace-level validator)
- `.github/hooks/README.md` (hook documentation)

---

### Phase 3: Windows Service Installation

**Objective**: Install cloudflared as Windows Service with auto-recovery

**Service Configuration**:

```powershell
# Service installation script
# Location: .github/key-data-streams/cloudflare-tunnel-stability/install-service.ps1

param(
    [string]$CloudflaredPath = "D:\PROJECTS\__CLOUDFLARE\cloudflared.exe",
    [string]$ConfigPath = "C:\Users\asifh\.cloudflared\config.yml"
)

$ErrorActionPreference = "Stop"

# Verify cloudflared.exe exists
if (-not (Test-Path $CloudflaredPath)) {
    throw "cloudflared.exe not found at $CloudflaredPath"
}

# Verify config exists
if (-not (Test-Path $ConfigPath)) {
    throw "Config file not found at $ConfigPath"
}

# Stop and remove existing service if present
$existingService = Get-Service -Name "cloudflared" -ErrorAction SilentlyContinue
if ($existingService) {
    Write-Host "Stopping existing cloudflared service..." -ForegroundColor Yellow
    Stop-Service -Name "cloudflared" -Force
    
    Write-Host "Removing existing service..." -ForegroundColor Yellow
    & sc.exe delete cloudflared
    Start-Sleep -Seconds 2
}

# Install service with auto-recovery
Write-Host "Installing cloudflared as Windows Service..." -ForegroundColor Cyan

& $CloudflaredPath service install --config=$ConfigPath

# Configure auto-recovery (restart on failure)
Write-Host "Configuring service auto-recovery..." -ForegroundColor Cyan

& sc.exe failure cloudflared reset= 86400 actions= restart/60000/restart/60000/restart/60000
& sc.exe config cloudflared start= auto

# Set service description
& sc.exe description cloudflared "Cloudflare Tunnel for kashkole.com (noorcanvas, resources, session)"

Write-Host "✅ Service installed successfully" -ForegroundColor Green

# Start service
Write-Host "Starting cloudflared service..." -ForegroundColor Cyan
Start-Service -Name "cloudflared"

# Verify service status
$service = Get-Service -Name "cloudflared"
if ($service.Status -eq "Running") {
    Write-Host "✅ Service is running" -ForegroundColor Green
} else {
    Write-Host "⚠️ Service status: $($service.Status)" -ForegroundColor Yellow
}

# Display service info
Write-Host ""
Write-Host "Service Configuration:" -ForegroundColor Cyan
Write-Host "  Name: cloudflared" -ForegroundColor Gray
Write-Host "  Status: $($service.Status)" -ForegroundColor Gray
Write-Host "  StartType: $($service.StartType)" -ForegroundColor Gray
Write-Host "  Recovery: Restart on failure (3 attempts)" -ForegroundColor Gray
Write-Host "  Config: $ConfigPath" -ForegroundColor Gray
Write-Host "  Tunnel ID: 93650d38-60af-4dc7-a5ec-f8347fc57514" -ForegroundColor Gray
```

**Service Recovery Configuration**:
- First failure: Restart after 1 minute
- Second failure: Restart after 1 minute
- Subsequent failures: Restart after 1 minute
- Reset failure count: After 24 hours

**Success Criteria**:
- ✅ Service installed as "cloudflared"
- ✅ Start Type set to Automatic
- ✅ Service starts successfully
- ✅ Auto-recovery configured (3 restart attempts)
- ✅ Service survives machine reboot
- ✅ Service restarts on manual stop

**Files Created**:
- `.github/key-data-streams/cloudflare-tunnel-stability/install-service.ps1`
- `.github/key-data-streams/cloudflare-tunnel-stability/uninstall-service.ps1`
- `.github/key-data-streams/cloudflare-tunnel-stability/restart-service.ps1`

**Testing**:
```powershell
# Test auto-recovery
Stop-Service cloudflared -Force
Start-Sleep -Seconds 65  # Wait for auto-restart
$status = (Get-Service cloudflared).Status
if ($status -eq "Running") {
    Write-Host "✅ Auto-recovery works" -ForegroundColor Green
}

# Test reboot persistence
Restart-Computer -Confirm
# After reboot:
$service = Get-Service cloudflared
if ($service.Status -eq "Running") {
    Write-Host "✅ Service started after reboot" -ForegroundColor Green
}
```

---

### Phase 4: Config Validation Script

**Objective**: Automated script to verify config.yml matches DNS records

**Implementation**:

Create `.github/key-data-streams/cloudflare-tunnel-stability/validate-config.ps1`:

```powershell
# Cloudflare Tunnel Configuration Validator
# Verifies config.yml tunnel ID matches DNS CNAME records

param(
    [switch]$Verbose,
    [switch]$FailOnMismatch
)

$ErrorActionPreference = "Stop"

# Configuration
$CANONICAL_TUNNEL_ID = "93650d38-60af-4dc7-a5ec-f8347fc57514"
$CONFIG_PATH = "C:\Users\asifh\.cloudflared\config.yml"
$TEST_HOSTNAMES = @(
    "noorcanvas.kashkole.com",
    "resources.kashkole.com",
    "session.kashkole.com"
)

Write-Host "🔍 Cloudflare Tunnel Configuration Validator" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""

# Step 1: Validate config file exists
Write-Host "1. Checking config file..." -ForegroundColor Yellow
if (-not (Test-Path $CONFIG_PATH)) {
    Write-Host "   ❌ Config file not found: $CONFIG_PATH" -ForegroundColor Red
    exit 1
}
Write-Host "   ✅ Config file exists" -ForegroundColor Green

# Step 2: Extract tunnel ID from config
Write-Host "2. Extracting tunnel ID from config..." -ForegroundColor Yellow
$configContent = Get-Content $CONFIG_PATH -Raw
if ($configContent -match "tunnel:\s*([a-f0-9\-]{36})") {
    $configTunnelId = $matches[1]
    Write-Host "   ✅ Found: $configTunnelId" -ForegroundColor Green
} else {
    Write-Host "   ❌ Could not extract tunnel ID from config" -ForegroundColor Red
    exit 1
}

# Step 3: Verify tunnel ID matches canonical
Write-Host "3. Verifying tunnel ID..." -ForegroundColor Yellow
if ($configTunnelId -ne $CANONICAL_TUNNEL_ID) {
    Write-Host "   ❌ MISMATCH!" -ForegroundColor Red
    Write-Host "      Expected: $CANONICAL_TUNNEL_ID" -ForegroundColor Yellow
    Write-Host "      Found:    $configTunnelId" -ForegroundColor Red
    
    if ($FailOnMismatch) {
        exit 1
    }
} else {
    Write-Host "   ✅ Tunnel ID is canonical" -ForegroundColor Green
}

# Step 4: Verify DNS CNAME records
Write-Host "4. Validating DNS CNAME records..." -ForegroundColor Yellow
$dnsValid = $true

foreach ($hostname in $TEST_HOSTNAMES) {
    try {
        $dnsResult = Resolve-DnsName $hostname -Type CNAME -ErrorAction Stop
        $cnameTarget = $dnsResult.NameHost
        
        if ($cnameTarget -like "$CANONICAL_TUNNEL_ID*") {
            Write-Host "   ✅ $hostname → $cnameTarget" -ForegroundColor Green
        } else {
            Write-Host "   ❌ $hostname → $cnameTarget (WRONG!)" -ForegroundColor Red
            $dnsValid = $false
        }
    } catch {
        Write-Host "   ⚠️ $hostname - DNS query failed: $($_.Exception.Message)" -ForegroundColor Yellow
        $dnsValid = $false
    }
}

# Step 5: Verify credentials file exists
Write-Host "5. Checking credentials file..." -ForegroundColor Yellow
$credPath = "C:\Users\asifh\.cloudflared\$CANONICAL_TUNNEL_ID.json"
if (Test-Path $credPath) {
    Write-Host "   ✅ Credentials file exists" -ForegroundColor Green
    
    # Validate JSON
    try {
        $credContent = Get-Content $credPath -Raw | ConvertFrom-Json
        if ($credContent.AccountTag -and $credContent.TunnelSecret) {
            Write-Host "   ✅ Credentials are valid JSON" -ForegroundColor Green
        }
    } catch {
        Write-Host "   ⚠️ Credentials file is not valid JSON" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ❌ Credentials file not found: $credPath" -ForegroundColor Red
}

# Step 6: Test service status (if installed)
Write-Host "6. Checking service status..." -ForegroundColor Yellow
$service = Get-Service -Name "cloudflared" -ErrorAction SilentlyContinue
if ($service) {
    if ($service.Status -eq "Running") {
        Write-Host "   ✅ Service is running" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️ Service status: $($service.Status)" -ForegroundColor Yellow
    }
    
    if ($service.StartType -eq "Automatic") {
        Write-Host "   ✅ Service set to auto-start" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️ Service StartType: $($service.StartType)" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ℹ️ Service not installed" -ForegroundColor Gray
}

# Summary
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
if ($configTunnelId -eq $CANONICAL_TUNNEL_ID -and $dnsValid) {
    Write-Host "✅ VALIDATION PASSED" -ForegroundColor Green
    Write-Host "   Tunnel ID is stable and matches DNS records" -ForegroundColor Gray
    exit 0
} else {
    Write-Host "⚠️ VALIDATION WARNINGS" -ForegroundColor Yellow
    Write-Host "   Review issues above" -ForegroundColor Gray
    
    if ($FailOnMismatch) {
        exit 1
    }
    exit 0
}
```

**Scheduled Task** (runs daily at 8 AM):

```powershell
# Create scheduled task for daily validation
$action = New-ScheduledTaskAction -Execute "pwsh.exe" -Argument "-NoProfile -File `"$PSScriptRoot\validate-config.ps1`" -FailOnMismatch"
$trigger = New-ScheduledTaskTrigger -Daily -At "08:00AM"
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType S4U

Register-ScheduledTask -TaskName "CloudflareTunnelValidation" `
    -Action $action `
    -Trigger $trigger `
    -Principal $principal `
    -Description "Daily validation of Cloudflare tunnel configuration"
```

**Success Criteria**:
- ✅ Script validates config tunnel ID
- ✅ Script checks DNS CNAME records
- ✅ Script verifies credentials file
- ✅ Script checks service status
- ✅ Scheduled task runs daily
- ✅ Email alert on validation failure (optional)

**Files Created**:
- `.github/key-data-streams/cloudflare-tunnel-stability/validate-config.ps1`
- `.github/key-data-streams/cloudflare-tunnel-stability/create-validation-task.ps1`

---

### Phase 5: Credential Backup System

**Objective**: Encrypted backup of tunnel credentials with recovery procedure

**Implementation**:

Create `.github/key-data-streams/cloudflare-tunnel-stability/backup-credentials.ps1`:

```powershell
# Cloudflare Tunnel Credential Backup System
# Creates encrypted backups of config and credentials

param(
    [string]$BackupLocation = ".github/key-data-streams/cloudflare-tunnel-stability/backups",
    [string]$Password
)

$ErrorActionPreference = "Stop"

# Configuration
$TUNNEL_ID = "93650d38-60af-4dc7-a5ec-f8347fc57514"
$CONFIG_PATH = "C:\Users\asifh\.cloudflared\config.yml"
$CRED_PATH = "C:\Users\asifh\.cloudflared\$TUNNEL_ID.json"

Write-Host "🔐 Cloudflare Tunnel Backup System" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""

# Create backup directory
if (-not (Test-Path $BackupLocation)) {
    New-Item -ItemType Directory -Path $BackupLocation -Force | Out-Null
    Write-Host "✅ Created backup directory: $BackupLocation" -ForegroundColor Green
}

# Generate timestamp
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

# Backup config.yml (plaintext - no secrets)
Write-Host "1. Backing up config.yml..." -ForegroundColor Yellow
$configBackup = Join-Path $BackupLocation "config-$timestamp.yml"
Copy-Item $CONFIG_PATH $configBackup
Write-Host "   ✅ Saved: $configBackup" -ForegroundColor Green

# Backup credentials (encrypted)
Write-Host "2. Backing up credentials (encrypted)..." -ForegroundColor Yellow

if (-not $Password) {
    # Generate secure password
    $securePassword = (New-Guid).ToString() + (Get-Random -Maximum 99999)
    $Password = $securePassword
    
    # Save password to secure file (for recovery)
    $passwordFile = Join-Path $BackupLocation ".backup-password-$timestamp.txt"
    $Password | ConvertTo-SecureString -AsPlainText -Force | ConvertFrom-SecureString | Set-Content $passwordFile
    
    Write-Host "   ℹ️ Generated backup password (stored securely)" -ForegroundColor Gray
}

# Encrypt credentials using AES
$credContent = Get-Content $CRED_PATH -Raw
$secureString = ConvertTo-SecureString $credContent -AsPlainText -Force
$encrypted = ConvertFrom-SecureString $secureString -SecureKey (ConvertTo-SecureString $Password -AsPlainText -Force)

$credBackup = Join-Path $BackupLocation "credentials-$timestamp.json.encrypted"
$encrypted | Set-Content $credBackup

Write-Host "   ✅ Saved: $credBackup" -ForegroundColor Green

# Create backup manifest
Write-Host "3. Creating backup manifest..." -ForegroundColor Yellow
$manifest = @{
    Timestamp = $timestamp
    TunnelId = $TUNNEL_ID
    ConfigBackup = $configBackup
    CredentialsBackup = $credBackup
    ConfigHash = (Get-FileHash $CONFIG_PATH -Algorithm SHA256).Hash
    CredentialsHash = (Get-FileHash $CRED_PATH -Algorithm SHA256).Hash
    BackupDate = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Machine = $env:COMPUTERNAME
    User = $env:USERNAME
}

$manifestPath = Join-Path $BackupLocation "manifest-$timestamp.json"
$manifest | ConvertTo-Json | Set-Content $manifestPath
Write-Host "   ✅ Saved: $manifestPath" -ForegroundColor Green

# Cleanup old backups (keep last 10)
Write-Host "4. Cleaning up old backups..." -ForegroundColor Yellow
$allBackups = Get-ChildItem $BackupLocation -Filter "manifest-*.json" | Sort-Object LastWriteTime -Descending

if ($allBackups.Count -gt 10) {
    $toDelete = $allBackups | Select-Object -Skip 10
    foreach ($old in $toDelete) {
        $oldTimestamp = $old.BaseName -replace "manifest-", ""
        
        Remove-Item (Join-Path $BackupLocation "config-$oldTimestamp.yml") -ErrorAction SilentlyContinue
        Remove-Item (Join-Path $BackupLocation "credentials-$oldTimestamp.json.encrypted") -ErrorAction SilentlyContinue
        Remove-Item (Join-Path $BackupLocation ".backup-password-$oldTimestamp.txt") -ErrorAction SilentlyContinue
        Remove-Item $old.FullName
    }
    Write-Host "   ✅ Removed $($toDelete.Count) old backups" -ForegroundColor Green
} else {
    Write-Host "   ℹ️ No cleanup needed ($($allBackups.Count) backups)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "✅ Backup complete!" -ForegroundColor Green
Write-Host "   Manifest: $manifestPath" -ForegroundColor Gray
```

**Recovery Script**:

Create `.github/key-data-streams/cloudflare-tunnel-stability/restore-credentials.ps1`:

```powershell
# Cloudflare Tunnel Credential Recovery
# Restores config and credentials from encrypted backup

param(
    [Parameter(Mandatory)]
    [string]$BackupTimestamp,
    
    [string]$BackupLocation = ".github/key-data-streams/cloudflare-tunnel-stability/backups",
    
    [string]$Password
)

$ErrorActionPreference = "Stop"

Write-Host "🔓 Cloudflare Tunnel Recovery System" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""

# Load manifest
$manifestPath = Join-Path $BackupLocation "manifest-$BackupTimestamp.json"
if (-not (Test-Path $manifestPath)) {
    throw "Manifest not found: $manifestPath"
}

$manifest = Get-Content $manifestPath | ConvertFrom-Json
Write-Host "📋 Backup Information:" -ForegroundColor Cyan
Write-Host "   Tunnel ID: $($manifest.TunnelId)" -ForegroundColor Gray
Write-Host "   Backup Date: $($manifest.BackupDate)" -ForegroundColor Gray
Write-Host "   Machine: $($manifest.Machine)" -ForegroundColor Gray
Write-Host ""

# Restore config.yml
Write-Host "1. Restoring config.yml..." -ForegroundColor Yellow
$configBackup = Join-Path $BackupLocation "config-$BackupTimestamp.yml"
if (Test-Path $configBackup) {
    Copy-Item $configBackup "C:\Users\asifh\.cloudflared\config.yml" -Force
    Write-Host "   ✅ Config restored" -ForegroundColor Green
} else {
    throw "Config backup not found: $configBackup"
}

# Restore credentials
Write-Host "2. Restoring credentials..." -ForegroundColor Yellow
$credBackup = Join-Path $BackupLocation "credentials-$BackupTimestamp.json.encrypted"
if (-not (Test-Path $credBackup)) {
    throw "Credentials backup not found: $credBackup"
}

# Get password if not provided
if (-not $Password) {
    $passwordFile = Join-Path $BackupLocation ".backup-password-$BackupTimestamp.txt"
    if (Test-Path $passwordFile) {
        $encryptedPassword = Get-Content $passwordFile | ConvertTo-SecureString
        $Password = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto(
            [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($encryptedPassword)
        )
    } else {
        $Password = Read-Host "Enter backup password" -AsSecureString
        $Password = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto(
            [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($Password)
        )
    }
}

# Decrypt credentials
$encrypted = Get-Content $credBackup
$secureString = $encrypted | ConvertTo-SecureString -SecureKey (ConvertTo-SecureString $Password -AsPlainText -Force)
$credContent = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureString)
)

# Write decrypted credentials
$TUNNEL_ID = $manifest.TunnelId
$credPath = "C:\Users\asifh\.cloudflared\$TUNNEL_ID.json"
$credContent | Set-Content $credPath -Force

Write-Host "   ✅ Credentials restored" -ForegroundColor Green

# Verify restoration
Write-Host "3. Verifying restoration..." -ForegroundColor Yellow
$configHash = (Get-FileHash "C:\Users\asifh\.cloudflared\config.yml" -Algorithm SHA256).Hash
$credHash = (Get-FileHash $credPath -Algorithm SHA256).Hash

if ($configHash -eq $manifest.ConfigHash) {
    Write-Host "   ✅ Config hash matches" -ForegroundColor Green
} else {
    Write-Host "   ⚠️ Config hash mismatch" -ForegroundColor Yellow
}

if ($credHash -eq $manifest.CredentialsHash) {
    Write-Host "   ✅ Credentials hash matches" -ForegroundColor Green
} else {
    Write-Host "   ⚠️ Credentials hash mismatch" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Recovery complete!" -ForegroundColor Green
Write-Host "   Restart cloudflared service to apply changes" -ForegroundColor Gray
```

**Success Criteria**:
- ✅ Backup script creates encrypted credentials backup
- ✅ Config backup created (plaintext)
- ✅ Backup manifest with hashes
- ✅ Old backups auto-deleted (keep last 10)
- ✅ Recovery script can restore from backup
- ✅ Hash verification on restore

**Files Created**:
- `.github/key-data-streams/cloudflare-tunnel-stability/backup-credentials.ps1`
- `.github/key-data-streams/cloudflare-tunnel-stability/restore-credentials.ps1`
- `.github/key-data-streams/cloudflare-tunnel-stability/backups/` (directory)
- `.github/key-data-streams/cloudflare-tunnel-stability/RECOVERY.md` (recovery documentation)

---

### Phase 6: Health Monitoring & Alerting

**Objective**: Automated health checks with email/log alerts on failures

**Implementation**:

Create `.github/key-data-streams/cloudflare-tunnel-stability/health-check.ps1`:

```powershell
# Cloudflare Tunnel Health Monitor
# Checks tunnel connectivity, service status, and DNS resolution

param(
    [switch]$SendAlert,
    [string]$AlertEmail,
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"

# Configuration
$TUNNEL_ID = "93650d38-60af-4dc7-a5ec-f8347fc57514"
$TEST_URLS = @(
    @{ Name = "NoorCanvas"; Url = "https://noorcanvas.kashkole.com"; ExpectedStatus = 200 },
    @{ Name = "Resources CDN"; Url = "https://resources.kashkole.com/IMAGES/test.jpg"; ExpectedStatus = 200 },
    @{ Name = "Session"; Url = "https://session.kashkole.com"; ExpectedStatus = 200 }
)

$results = @{
    Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    OverallHealth = "Healthy"
    Checks = @()
    Failures = @()
}

Write-Host "🏥 Cloudflare Tunnel Health Check" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""

# Check 1: Service Status
Write-Host "1. Checking Windows Service..." -ForegroundColor Yellow
$service = Get-Service -Name "cloudflared" -ErrorAction SilentlyContinue

if ($service) {
    if ($service.Status -eq "Running") {
        Write-Host "   ✅ Service is running" -ForegroundColor Green
        $results.Checks += @{ Name = "Service Status"; Status = "Pass"; Details = "Running" }
    } else {
        Write-Host "   ❌ Service not running: $($service.Status)" -ForegroundColor Red
        $results.Checks += @{ Name = "Service Status"; Status = "Fail"; Details = $service.Status }
        $results.Failures += "Service not running"
        $results.OverallHealth = "Unhealthy"
    }
} else {
    Write-Host "   ⚠️ Service not installed" -ForegroundColor Yellow
    $results.Checks += @{ Name = "Service Status"; Status = "Warning"; Details = "Not installed" }
}

# Check 2: Process Running
Write-Host "2. Checking cloudflared process..." -ForegroundColor Yellow
$process = Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue

if ($process) {
    $runtime = (Get-Date) - $process.StartTime
    Write-Host "   ✅ Process running (uptime: $($runtime.Hours)h $($runtime.Minutes)m)" -ForegroundColor Green
    $results.Checks += @{ Name = "Process Status"; Status = "Pass"; Details = "Uptime: $($runtime.TotalHours.ToString('F2'))h" }
} else {
    Write-Host "   ❌ Process not running" -ForegroundColor Red
    $results.Checks += @{ Name = "Process Status"; Status = "Fail"; Details = "Not running" }
    $results.Failures += "cloudflared process not running"
    $results.OverallHealth = "Unhealthy"
}

# Check 3: Config File Integrity
Write-Host "3. Validating config file..." -ForegroundColor Yellow
$configPath = "C:\Users\asifh\.cloudflared\config.yml"

if (Test-Path $configPath) {
    $config = Get-Content $configPath -Raw
    
    if ($config -match "tunnel:\s*$TUNNEL_ID") {
        Write-Host "   ✅ Config has correct tunnel ID" -ForegroundColor Green
        $results.Checks += @{ Name = "Config Integrity"; Status = "Pass"; Details = "Tunnel ID correct" }
    } else {
        Write-Host "   ❌ Config has wrong tunnel ID!" -ForegroundColor Red
        $results.Checks += @{ Name = "Config Integrity"; Status = "Fail"; Details = "Tunnel ID mismatch" }
        $results.Failures += "Config tunnel ID mismatch"
        $results.OverallHealth = "Critical"
    }
} else {
    Write-Host "   ❌ Config file not found" -ForegroundColor Red
    $results.Checks += @{ Name = "Config Integrity"; Status = "Fail"; Details = "File not found" }
    $results.Failures += "Config file missing"
    $results.OverallHealth = "Critical"
}

# Check 4: DNS Resolution
Write-Host "4. Testing DNS resolution..." -ForegroundColor Yellow
$dnsPass = $true

foreach ($test in $TEST_URLS) {
    $hostname = ([System.Uri]$test.Url).Host
    
    try {
        $dnsResult = Resolve-DnsName $hostname -Type CNAME -ErrorAction Stop
        $target = $dnsResult.NameHost
        
        if ($target -like "$TUNNEL_ID*") {
            Write-Host "   ✅ $hostname → correct tunnel" -ForegroundColor Green
        } else {
            Write-Host "   ❌ $hostname → wrong tunnel!" -ForegroundColor Red
            $dnsPass = $false
            $results.Failures += "DNS mismatch for $hostname"
        }
    } catch {
        Write-Host "   ❌ $hostname → DNS query failed" -ForegroundColor Red
        $dnsPass = $false
        $results.Failures += "DNS query failed for $hostname"
    }
}

$results.Checks += @{ 
    Name = "DNS Resolution"
    Status = if ($dnsPass) { "Pass" } else { "Fail" }
    Details = "All hostnames checked"
}

if (-not $dnsPass) {
    $results.OverallHealth = "Critical"
}

# Check 5: URL Connectivity
Write-Host "5. Testing URL connectivity..." -ForegroundColor Yellow
$urlsPass = $true

foreach ($test in $TEST_URLS) {
    try {
        $response = Invoke-WebRequest -Uri $test.Url -Method Head -TimeoutSec 10 -ErrorAction Stop
        
        if ($response.StatusCode -eq $test.ExpectedStatus) {
            Write-Host "   ✅ $($test.Name) - HTTP $($response.StatusCode)" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️ $($test.Name) - HTTP $($response.StatusCode) (expected $($test.ExpectedStatus))" -ForegroundColor Yellow
            $urlsPass = $false
        }
    } catch {
        Write-Host "   ❌ $($test.Name) - $($_.Exception.Message)" -ForegroundColor Red
        $urlsPass = $false
        $results.Failures += "$($test.Name) unreachable"
    }
}

$results.Checks += @{
    Name = "URL Connectivity"
    Status = if ($urlsPass) { "Pass" } else { "Fail" }
    Details = "$($TEST_URLS.Count) URLs tested"
}

if (-not $urlsPass) {
    if ($results.OverallHealth -eq "Healthy") {
        $results.OverallHealth = "Degraded"
    }
}

# Summary
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

switch ($results.OverallHealth) {
    "Healthy" {
        Write-Host "✅ SYSTEM HEALTHY" -ForegroundColor Green
        $exitCode = 0
    }
    "Degraded" {
        Write-Host "⚠️ SYSTEM DEGRADED" -ForegroundColor Yellow
        Write-Host "   Some checks failed but core functionality works" -ForegroundColor Gray
        $exitCode = 1
    }
    "Unhealthy" {
        Write-Host "❌ SYSTEM UNHEALTHY" -ForegroundColor Red
        Write-Host "   Critical components not functioning" -ForegroundColor Gray
        $exitCode = 2
    }
    "Critical" {
        Write-Host "🔴 CRITICAL FAILURE" -ForegroundColor Red
        Write-Host "   Immediate attention required" -ForegroundColor Gray
        $exitCode = 3
    }
}

if ($results.Failures.Count -gt 0) {
    Write-Host ""
    Write-Host "Failed Checks:" -ForegroundColor Red
    foreach ($failure in $results.Failures) {
        Write-Host "   • $failure" -ForegroundColor Gray
    }
}

# Write results to log
$logPath = ".github/key-data-streams/cloudflare-tunnel-stability/logs"
if (-not (Test-Path $logPath)) {
    New-Item -ItemType Directory -Path $logPath -Force | Out-Null
}

$logFile = Join-Path $logPath "health-$(Get-Date -Format 'yyyyMMdd').log"
$results | ConvertTo-Json -Depth 5 | Add-Content $logFile

# Send alert if requested and unhealthy
if ($SendAlert -and $results.OverallHealth -ne "Healthy") {
    Write-Host ""
    Write-Host "📧 Sending alert..." -ForegroundColor Cyan
    
    # TODO: Implement email alert via Send-MailMessage or webhook
    # For now, write to alert log
    $alertLog = Join-Path $logPath "alerts.log"
    "[$($results.Timestamp)] $($results.OverallHealth): $($results.Failures -join ', ')" | Add-Content $alertLog
    
    Write-Host "   ✅ Alert logged" -ForegroundColor Green
}

exit $exitCode
```

**Scheduled Task** (runs every 5 minutes):

```powershell
# Create scheduled task for health monitoring
$action = New-ScheduledTaskAction -Execute "pwsh.exe" -Argument "-NoProfile -File `"$PSScriptRoot\health-check.ps1`" -SendAlert"
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 5) -RepetitionDuration ([TimeSpan]::MaxValue)
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType S4U

Register-ScheduledTask -TaskName "CloudflareTunnelHealthMonitor" `
    -Action $action `
    -Trigger $trigger `
    -Principal $principal `
    -Description "Monitors Cloudflare tunnel health every 5 minutes"
```

**Success Criteria**:
- ✅ Health check validates service status
- ✅ Health check validates process running
- ✅ Health check validates config integrity
- ✅ Health check tests DNS resolution
- ✅ Health check tests URL connectivity
- ✅ Scheduled task runs every 5 minutes
- ✅ Logs written to daily log files
- ✅ Alerts logged on failures

**Files Created**:
- `.github/key-data-streams/cloudflare-tunnel-stability/health-check.ps1`
- `.github/key-data-streams/cloudflare-tunnel-stability/create-health-monitor-task.ps1`
- `.github/key-data-streams/cloudflare-tunnel-stability/logs/` (directory)

---

### Phase 7: Documentation Synchronization

**Objective**: Update all documentation to reference canonical tunnel ID

**Files to Update**:

1. **`.github/instructions/IIS-Configuration.md`**
   - Update tunnel ID from `4e2266b5-48ed-429d-b9d3-e235186e9dca` to `93650d38-60af-4dc7-a5ec-f8347fc57514`
   - Update all references to tunnel configuration
   - Add warning about tunnel ID immutability

2. **`.github/instructions/CDN-Architecture.md`**
   - Update tunnel ID from `5474d3b4-50ea-4588-8763-5fc7da533d6c` to `93650d38-60af-4dc7-a5ec-f8347fc57514`
   - Update Cloudflare tunnel section
   - Add reference to stability guardrails

3. **`D:\PROJECTS\__CLOUDFLARE\README.md`** (external)
   - Update tunnel ID from `5474d3b4-50ea-4588-8763-5fc7da533d6c` to `93650d38-60af-4dc7-a5ec-f8347fc57514`
   - Add section on tunnel ID stability
   - Reference workspace guardrails

**Documentation Template Addition**:

Add to each file's Cloudflare section:

```markdown
## ⚠️ Tunnel ID Stability

**CANONICAL TUNNEL ID**: `93650d38-60af-4dc7-a5ec-f8347fc57514`

**DO NOT change this tunnel ID!** DNS CNAME records for all production URLs point to this tunnel. Changing the tunnel ID will break:
- noorcanvas.kashkole.com
- resources.kashkole.com
- session.kashkole.com

**Protection mechanisms**:
- Git pre-commit hook prevents tunnel ID changes
- Daily validation script (`.github/key-data-streams/cloudflare-tunnel-stability/validate-config.ps1`)
- Health monitoring every 5 minutes
- Encrypted credential backups

**To verify tunnel stability**:
```powershell
.\.github\key-data-streams\cloudflare-tunnel-stability\validate-config.ps1
```

**If tunnel must be changed** (emergency only):
1. Update DNS CNAME records in Cloudflare dashboard FIRST
2. Wait for DNS propagation (5-10 minutes)
3. Update config.yml with new tunnel ID
4. Update credentials file
5. Restart cloudflared service
6. Update all documentation
7. Run validation script to confirm
```

**Create Documentation Index**:

Create `.github/key-data-streams/cloudflare-tunnel-stability/DOCUMENTATION-INDEX.md`:

```markdown
# Cloudflare Tunnel Documentation Index

**Canonical Tunnel ID**: `93650d38-60af-4dc7-a5ec-f8347fc57514`

## Configuration Files

| File | Location | Purpose |
|------|----------|---------|
| config.yml | `C:\Users\asifh\.cloudflared\config.yml` | Tunnel configuration and ingress rules |
| credentials.json | `C:\Users\asifh\.cloudflared\93650d38-....json` | Tunnel authentication credentials |

## Documentation Files (Tunnel ID References)

| File | Status | Last Updated |
|------|--------|--------------|
| `.github/instructions/IIS-Configuration.md` | ✅ Synchronized | 2025-10-26 |
| `.github/instructions/CDN-Architecture.md` | ✅ Synchronized | 2025-10-26 |
| `D:\PROJECTS\__CLOUDFLARE\README.md` | ✅ Synchronized | 2025-10-26 |

## Protection Scripts

| Script | Purpose | Schedule |
|--------|---------|----------|
| `validate-config.ps1` | Config validation | Daily 8:00 AM |
| `health-check.ps1` | Health monitoring | Every 5 minutes |
| `backup-credentials.ps1` | Credential backup | Weekly |
| `.git/hooks/pre-commit` | Git protection | On commit |

## DNS Records (Cloudflare Dashboard)

All CNAME records point to: `93650d38-60af-4dc7-a5ec-f8347fc57514.cfargotunnel.com`

- noorcanvas.kashkole.com
- resources.kashkole.com
- session.kashkole.com

## Service Configuration

**Windows Service**: `cloudflared`
- Start Type: Automatic
- Recovery: Restart on failure (3 attempts)
- Config: `C:\Users\asifh\.cloudflared\config.yml`

## Validation Commands

### Quick Health Check
```powershell
.\.github\key-data-streams\cloudflare-tunnel-stability\health-check.ps1
```

### Full Validation
```powershell
.\.github\key-data-streams\cloudflare-tunnel-stability\validate-config.ps1 -Verbose
```

### Service Status
```powershell
Get-Service cloudflared | Select-Object Name, Status, StartType
```

### Test URLs
```powershell
curl -I https://noorcanvas.kashkole.com
curl -I https://resources.kashkole.com
curl -I https://session.kashkole.com
```

## Emergency Recovery

If tunnel breaks:

1. **Check service status**:
   ```powershell
   Get-Service cloudflared
   Restart-Service cloudflared
   ```

2. **Validate configuration**:
   ```powershell
   .\.github\key-data-streams\cloudflare-tunnel-stability\validate-config.ps1
   ```

3. **Restore from backup** (if config corrupted):
   ```powershell
   # List available backups
   Get-ChildItem .github/key-data-streams/cloudflare-tunnel-stability/backups -Filter "manifest-*.json"
   
   # Restore (use timestamp from manifest filename)
   .\.github\key-data-streams\cloudflare-tunnel-stability\restore-credentials.ps1 -BackupTimestamp "20251026-120000"
   ```

4. **Check DNS** (if URLs unreachable):
   ```powershell
   nslookup noorcanvas.kashkole.com
   # Should resolve to Cloudflare IPs with CNAME to 93650d38-....cfargotunnel.com
   ```

## Links

- Cloudflare Dashboard: https://dash.cloudflare.com/
- Tunnel ID: `93650d38-60af-4dc7-a5ec-f8347fc57514`
- Plan: `.github/key-data-streams/cloudflare-tunnel-stability/cloudflare-tunnel-stability.plan.md`
```

**Success Criteria**:
- ✅ All 3 documentation files updated with correct tunnel ID
- ✅ Tunnel ID stability warnings added to each file
- ✅ Documentation index created
- ✅ Links between docs verified
- ✅ External README.md synchronized
- ✅ Git commit with documentation updates

**Files Updated**:
- `.github/instructions/IIS-Configuration.md`
- `.github/instructions/CDN-Architecture.md`
- `D:\PROJECTS\__CLOUDFLARE\README.md` (external)

**Files Created**:
- `.github/key-data-streams/cloudflare-tunnel-stability/DOCUMENTATION-INDEX.md`

---

## Testing Strategy

### Phase 1 Tests
- ✅ Credentials file exists and is valid JSON
- ✅ Config tunnel ID matches DNS CNAME records
- ✅ Backup created successfully with correct hash

### Phase 2 Tests
- ✅ Pre-commit hook rejects tunnel ID changes
- ✅ Pre-commit hook allows unrelated changes
- ✅ Workspace validation script detects mismatches

### Phase 3 Tests
- ✅ Service installs successfully
- ✅ Service starts automatically
- ✅ Service survives reboot
- ✅ Auto-recovery works after manual stop

### Phase 4 Tests
- ✅ Validation script detects config issues
- ✅ Validation script checks DNS records
- ✅ Scheduled task runs daily

### Phase 5 Tests
- ✅ Backup creates encrypted credentials
- ✅ Restore recovers from backup
- ✅ Hash verification works
- ✅ Old backups are cleaned up

### Phase 6 Tests
- ✅ Health check detects service issues
- ✅ Health check validates DNS
- ✅ Health check tests URL connectivity
- ✅ Alerts trigger on failures

### Phase 7 Tests
- ✅ All documentation references correct tunnel ID
- ✅ No references to old tunnel IDs remain
- ✅ Documentation index is complete

---

## Commit Strategy

Each phase creates a checkpoint commit:

**Phase 1**: `plan(cloudflare-tunnel-stability): Phase 1 - Verify tunnel integrity`  
**Phase 2**: `plan(cloudflare-tunnel-stability): Phase 2 - Git protection hooks`  
**Phase 3**: `plan(cloudflare-tunnel-stability): Phase 3 - Windows service with auto-recovery`  
**Phase 4**: `plan(cloudflare-tunnel-stability): Phase 4 - Config validation automation`  
**Phase 5**: `plan(cloudflare-tunnel-stability): Phase 5 - Encrypted credential backups`  
**Phase 6**: `plan(cloudflare-tunnel-stability): Phase 6 - Health monitoring system`  
**Phase 7**: `plan(cloudflare-tunnel-stability): Phase 7 - Documentation synchronization`  

**Final commit**: `plan(cloudflare-tunnel-stability): Complete - Tunnel stability guaranteed`

---

## Risk Mitigation

### Risk 1: Service Installation Failure
**Mitigation**: Verify cloudflared.exe exists before installation, provide detailed error messages

### Risk 2: DNS Propagation Delay
**Mitigation**: No DNS changes required - existing CNAME records already point to correct tunnel ID

### Risk 3: Backup Encryption Issues
**Mitigation**: Store backup password securely, test restore procedure immediately after backup

### Risk 4: Git Hook Bypass
**Mitigation**: Add workspace-level validation that runs in CI/CD, educate team on tunnel stability

### Risk 5: Documentation Drift
**Mitigation**: Auto-generate documentation from config.yml using validation script, regular audits

---

## Success Criteria

**Phase-specific criteria listed in each phase above.**

**Overall plan success**:
- ✅ Single canonical tunnel ID across all systems
- ✅ Git hooks prevent accidental changes
- ✅ Windows service with auto-recovery installed
- ✅ Automated validation runs daily
- ✅ Encrypted backups created weekly
- ✅ Health monitoring every 5 minutes
- ✅ All documentation synchronized
- ✅ No references to old tunnel IDs
- ✅ Production URLs remain stable across reboots

---

## Maintenance

### Daily
- Health check runs automatically (scheduled task)
- Logs reviewed for failures

### Weekly
- Credential backup runs
- Old backups cleaned up (automatic)

### Monthly
- Review health check logs
- Verify service recovery settings
- Test restore procedure

### Quarterly
- Full documentation audit
- Verify all tunnel IDs match canonical
- Update scripts if Cloudflare API changes

---

## Appendix: Tunnel ID History

**Timeline of tunnel ID confusion**:

1. **Original tunnel** (unknown date): `5474d3b4-50ea-4588-8763-5fc7da533d6c`
   - Documented in `__CLOUDFLARE\README.md`
   - Documented in `CDN-Architecture.md`
   - No longer in use

2. **Second tunnel** (unknown date): `4e2266b5-48ed-429d-b9d3-e235186e9dca`
   - Documented in `IIS-Configuration.md`
   - No longer in use

3. **Current tunnel** (active): `93650d38-60af-4dc7-a5ec-f8347fc57514`
   - DNS CNAME records point here
   - Active config.yml uses this ID
   - Credentials file exists for this ID
   - **This is the canonical tunnel - MUST NOT change**

**Lessons learned**:
- Multiple tunnel creations led to ID instability
- Documentation diverged from reality
- Need automated validation to prevent drift
- Git protection critical for stability

---

## References

- Cloudflare Tunnel Documentation: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/
- Windows Service Recovery: https://docs.microsoft.com/en-us/windows/win32/services/service-recovery
- PowerShell Encryption: https://docs.microsoft.com/en-us/powershell/module/microsoft.powershell.security/

---

**Plan Version**: 1.0  
**Last Updated**: 2025-10-26  
**Status**: Ready for implementation  
**Estimated Completion**: 3-4 hours
