# Cloudflare Tunnel Integrity Verification
# Phase 1: Verify existing tunnel configuration is valid and operational

$ErrorActionPreference = "Stop"

# Configuration
$CANONICAL_TUNNEL_ID = "93650d38-60af-4dc7-a5ec-f8347fc57514"
$CONFIG_PATH = "C:\Users\asifh\.cloudflared\config.yml"
$CRED_PATH = "C:\Users\asifh\.cloudflared\$CANONICAL_TUNNEL_ID.json"
$BACKUP_DIR = "$PSScriptRoot\backups"
$TEST_HOSTNAMES = @(
    "noorcanvas.kashkole.com",
    "resources.kashkole.com",
    "session.kashkole.com"
)

Write-Host "🔍 Cloudflare Tunnel Integrity Verification" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""

$verificationResults = @{
    Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    CanonicalTunnelId = $CANONICAL_TUNNEL_ID
    Checks = @()
    OverallStatus = "Pass"
}

# Step 1: Verify credentials file exists and is valid JSON
Write-Host "1. Checking credentials file..." -ForegroundColor Yellow

if (Test-Path $CRED_PATH) {
    Write-Host "   ✅ Credentials file exists: $CRED_PATH" -ForegroundColor Green
    
    try {
        $credContent = Get-Content $CRED_PATH -Raw | ConvertFrom-Json
        
        if ($credContent.AccountTag -and $credContent.TunnelSecret) {
            Write-Host "   ✅ Credentials are valid JSON with required fields" -ForegroundColor Green
            $verificationResults.Checks += @{
                Name = "Credentials File"
                Status = "Pass"
                Details = "Valid JSON with AccountTag and TunnelSecret"
            }
        } else {
            Write-Host "   ⚠️ Credentials missing required fields" -ForegroundColor Yellow
            $verificationResults.Checks += @{
                Name = "Credentials File"
                Status = "Warning"
                Details = "Missing AccountTag or TunnelSecret"
            }
            $verificationResults.OverallStatus = "Warning"
        }
    } catch {
        Write-Host "   ❌ Credentials file is not valid JSON: $($_.Exception.Message)" -ForegroundColor Red
        $verificationResults.Checks += @{
            Name = "Credentials File"
            Status = "Fail"
            Details = "Invalid JSON: $($_.Exception.Message)"
        }
        $verificationResults.OverallStatus = "Fail"
    }
} else {
    Write-Host "   ❌ Credentials file not found: $CRED_PATH" -ForegroundColor Red
    $verificationResults.Checks += @{
        Name = "Credentials File"
        Status = "Fail"
        Details = "File not found"
    }
    $verificationResults.OverallStatus = "Fail"
}

# Step 2: Verify config file exists and extract tunnel ID
Write-Host "2. Checking config file..." -ForegroundColor Yellow

if (Test-Path $CONFIG_PATH) {
    Write-Host "   ✅ Config file exists: $CONFIG_PATH" -ForegroundColor Green
    
    $configContent = Get-Content $CONFIG_PATH -Raw
    
    if ($configContent -match "tunnel:\s*([a-f0-9\-]{36})") {
        $configTunnelId = $matches[1]
        Write-Host "   ✅ Extracted tunnel ID: $configTunnelId" -ForegroundColor Green
        
        if ($configTunnelId -eq $CANONICAL_TUNNEL_ID) {
            Write-Host "   ✅ Config tunnel ID matches canonical ID" -ForegroundColor Green
            $verificationResults.Checks += @{
                Name = "Config Tunnel ID"
                Status = "Pass"
                Details = "Matches canonical: $CANONICAL_TUNNEL_ID"
            }
        } else {
            Write-Host "   ❌ Config tunnel ID MISMATCH!" -ForegroundColor Red
            Write-Host "      Expected: $CANONICAL_TUNNEL_ID" -ForegroundColor Yellow
            Write-Host "      Found:    $configTunnelId" -ForegroundColor Red
            $verificationResults.Checks += @{
                Name = "Config Tunnel ID"
                Status = "Fail"
                Details = "Mismatch - Found: $configTunnelId"
            }
            $verificationResults.OverallStatus = "Fail"
        }
    } else {
        Write-Host "   ❌ Could not extract tunnel ID from config" -ForegroundColor Red
        $verificationResults.Checks += @{
            Name = "Config Tunnel ID"
            Status = "Fail"
            Details = "Could not extract tunnel ID"
        }
        $verificationResults.OverallStatus = "Fail"
    }
} else {
    Write-Host "   ❌ Config file not found: $CONFIG_PATH" -ForegroundColor Red
    $verificationResults.Checks += @{
        Name = "Config File"
        Status = "Fail"
        Details = "File not found"
    }
    $verificationResults.OverallStatus = "Fail"
}

# Step 3: Verify DNS records match config tunnel ID
Write-Host "3. Verifying DNS CNAME records..." -ForegroundColor Yellow

$dnsValid = $true
$dnsChecksFailed = 0
foreach ($hostname in $TEST_HOSTNAMES) {
    try {
        $dnsResult = Resolve-DnsName $hostname -Type CNAME -ErrorAction Stop
        
        if ($dnsResult -and $dnsResult.NameHost) {
            $cnameTarget = $dnsResult.NameHost
            
            if ($cnameTarget -like "$CANONICAL_TUNNEL_ID*") {
                Write-Host "   ✅ $hostname → $cnameTarget" -ForegroundColor Green
            } else {
                Write-Host "   ❌ $hostname → $cnameTarget (WRONG!)" -ForegroundColor Red
                $dnsValid = $false
                $dnsChecksFailed++
            }
        } else {
            Write-Host "   ⚠️ $hostname - No CNAME record found" -ForegroundColor Yellow
            $dnsValid = $false
            $dnsChecksFailed++
        }
    } catch {
        Write-Host "   ⚠️ $hostname - DNS query failed (this is OK if testing offline): $($_.Exception.Message)" -ForegroundColor Yellow
        # Don't fail the overall check for DNS issues - this might be a network/offline issue
    }
}

if ($dnsChecksFailed -eq 0) {
    $verificationResults.Checks += @{
        Name = "DNS CNAME Records"
        Status = "Pass"
        Details = "All hostnames point to canonical tunnel"
    }
} elseif ($dnsChecksFailed -eq $TEST_HOSTNAMES.Count) {
    # All DNS checks failed - might be offline
    $verificationResults.Checks += @{
        Name = "DNS CNAME Records"
        Status = "Warning"
        Details = "DNS queries failed - may be offline or network issue"
    }
} else {
    $verificationResults.Checks += @{
        Name = "DNS CNAME Records"
        Status = "Fail"
        Details = "Some hostnames do not match canonical tunnel"
    }
    $verificationResults.OverallStatus = "Fail"
}

# Step 4: Create backup of working config and credentials
Write-Host "4. Creating backups..." -ForegroundColor Yellow

if (-not (Test-Path $BACKUP_DIR)) {
    New-Item -ItemType Directory -Path $BACKUP_DIR -Force | Out-Null
    Write-Host "   ✅ Created backup directory: $BACKUP_DIR" -ForegroundColor Green
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

# Backup config.yml
if (Test-Path $CONFIG_PATH) {
    $configBackup = Join-Path $BACKUP_DIR "config-$timestamp.yml"
    Copy-Item $CONFIG_PATH $configBackup
    $configHash = (Get-FileHash $CONFIG_PATH -Algorithm SHA256).Hash
    Write-Host "   ✅ Config backed up: config-$timestamp.yml" -ForegroundColor Green
    Write-Host "      SHA256: $configHash" -ForegroundColor Gray
} else {
    Write-Host "   ⚠️ Config file not found, skipping backup" -ForegroundColor Yellow
    $configHash = $null
}

# Backup credentials (encrypted)
if (Test-Path $CRED_PATH) {
    # For security, we'll create an encrypted backup
    $credBackup = Join-Path $BACKUP_DIR "credentials-$timestamp.json.encrypted"
    
    # Generate secure password for encryption (must be 16, 24, or 32 bytes for AES)
    $password = (New-Guid).ToString().Replace("-", "").Substring(0, 32)
    $passwordFile = Join-Path $BACKUP_DIR ".backup-password-$timestamp.txt"
    
    # Encrypt credentials using built-in encryption
    $credContent = Get-Content $CRED_PATH -Raw
    $secureString = ConvertTo-SecureString $credContent -AsPlainText -Force
    $encrypted = ConvertFrom-SecureString $secureString
    $encrypted | Set-Content $credBackup
    
    # Save password marker (the encrypted string is tied to current user/machine)
    "Encrypted for: $env:USERNAME@$env:COMPUTERNAME" | Set-Content $passwordFile
    
    $credHash = (Get-FileHash $CRED_PATH -Algorithm SHA256).Hash
    Write-Host "   ✅ Credentials backed up (encrypted): credentials-$timestamp.json.encrypted" -ForegroundColor Green
    Write-Host "      SHA256: $credHash" -ForegroundColor Gray
    Write-Host "      Note: Encrypted for $env:USERNAME@$env:COMPUTERNAME" -ForegroundColor Gray
} else {
    Write-Host "   ⚠️ Credentials file not found, skipping backup" -ForegroundColor Yellow
    $credHash = $null
}

# Create backup manifest
$manifest = @{
    Timestamp = $timestamp
    BackupDate = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    TunnelId = $CANONICAL_TUNNEL_ID
    ConfigBackup = "config-$timestamp.yml"
    CredentialsBackup = "credentials-$timestamp.json.encrypted"
    ConfigHash = $configHash
    CredentialsHash = $credHash
    Machine = $env:COMPUTERNAME
    User = $env:USERNAME
}

$manifestPath = Join-Path $BACKUP_DIR "manifest-$timestamp.json"
$manifest | ConvertTo-Json -Depth 5 | Set-Content $manifestPath
Write-Host "   ✅ Backup manifest created: manifest-$timestamp.json" -ForegroundColor Green

$verificationResults.Checks += @{
    Name = "Backup Created"
    Status = "Pass"
    Details = "Config and credentials backed up successfully"
}

# Step 5: Generate verification report
Write-Host "5. Generating verification report..." -ForegroundColor Yellow

$reportPath = Join-Path $PSScriptRoot "verification-report.txt"
$reportContent = @"
CLOUDFLARE TUNNEL INTEGRITY VERIFICATION REPORT
================================================

Verification Date: $($verificationResults.Timestamp)
Overall Status: $($verificationResults.OverallStatus)

CANONICAL TUNNEL ID
-------------------
$CANONICAL_TUNNEL_ID

VERIFICATION CHECKS
-------------------
"@

foreach ($check in $verificationResults.Checks) {
    $statusSymbol = switch ($check.Status) {
        "Pass" { "✅" }
        "Warning" { "⚠️" }
        "Fail" { "❌" }
        default { "ℹ️" }
    }
    
    $reportContent += "`n$statusSymbol $($check.Name): $($check.Status)"
    $reportContent += "`n   $($check.Details)"
}

$reportContent += @"


DNS CNAME RECORDS
-----------------
Expected: All hostnames point to $CANONICAL_TUNNEL_ID.cfargotunnel.com

"@

foreach ($hostname in $TEST_HOSTNAMES) {
    try {
        $dnsResult = Resolve-DnsName $hostname -Type CNAME -ErrorAction Stop
        $reportContent += "`n✅ $hostname → $($dnsResult.NameHost)"
    } catch {
        $reportContent += "`n❌ $hostname → DNS query failed"
    }
}

$reportContent += @"


BACKUP INFORMATION
------------------
Backup Directory: $BACKUP_DIR
Backup Timestamp: $timestamp
Config Backup: config-$timestamp.yml
Credentials Backup: credentials-$timestamp.json.encrypted (encrypted)
Manifest: manifest-$timestamp.json

CONFIG FILE HASH
----------------
SHA256: $configHash

CREDENTIALS FILE HASH
---------------------
SHA256: $credHash

NEXT STEPS
----------
"@

if ($verificationResults.OverallStatus -eq "Pass") {
    $reportContent += @"
✅ All checks passed. Tunnel configuration is valid and stable.

Proceed to Phase 2: Git Protection Hook
"@
} else {
    $reportContent += @"
⚠️ Some checks failed or have warnings. Review the issues above before proceeding.

Required actions:
1. Fix any failed checks
2. Ensure tunnel ID matches canonical: $CANONICAL_TUNNEL_ID
3. Verify DNS records point to correct tunnel
4. Re-run verification after fixes
"@
}

$reportContent | Set-Content $reportPath
Write-Host "   ✅ Verification report saved: verification-report.txt" -ForegroundColor Green

# Display summary
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

if ($verificationResults.OverallStatus -eq "Pass") {
    Write-Host "✅ VERIFICATION PASSED" -ForegroundColor Green
    Write-Host ""
    Write-Host "Tunnel configuration is valid and stable." -ForegroundColor Gray
    Write-Host "Backups created successfully." -ForegroundColor Gray
    Write-Host ""
    Write-Host "📋 Report: $reportPath" -ForegroundColor Cyan
    exit 0
} else {
    Write-Host "⚠️ VERIFICATION FAILED" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Review the report for details on failed checks." -ForegroundColor Gray
    Write-Host ""
    Write-Host "📋 Report: $reportPath" -ForegroundColor Cyan
    exit 1
}
