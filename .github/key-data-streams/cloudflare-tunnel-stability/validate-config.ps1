# Cloudflare Tunnel Configuration Validator
# Verifies config.yml tunnel ID matches DNS CNAME records

param(
    [switch]$Verbose,
    [switch]$FailOnMismatch,
    [switch]$CreateScheduledTask
)

$ErrorActionPreference = "Stop"

# Configuration
$CANONICAL_TUNNEL_ID = "93650d38-60af-4dc7-a5ec-f8347fc57514"
$CONFIG_PATH = "C:\Users\asifh\.cloudflared\config.yml"
$CRED_PATH = "C:\Users\asifh\.cloudflared\$CANONICAL_TUNNEL_ID.json"
$TEST_HOSTNAMES = @(
    "noorcanvas.kashkole.com",
    "resources.kashkole.com",
    "session.kashkole.com"
)

if ($CreateScheduledTask) {
    # Create scheduled task for daily validation
    Write-Host "📅 Creating Scheduled Task for Daily Validation" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Host ""
    
    # Check if running as administrator
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
        Write-Host "❌ Creating scheduled tasks requires Administrator privileges" -ForegroundColor Red
        Write-Host ""
        Write-Host "   Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
        Write-Host ""
        exit 1
    }
    
    $scriptPath = $PSCommandPath
    $action = New-ScheduledTaskAction -Execute "pwsh.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`" -FailOnMismatch"
    $trigger = New-ScheduledTaskTrigger -Daily -At "08:00AM"
    $settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -RunOnlyIfNetworkAvailable
    $taskPrincipal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType S4U
    
    # Remove existing task if present
    $existingTask = Get-ScheduledTask -TaskName "CloudflareTunnelValidation" -ErrorAction SilentlyContinue
    if ($existingTask) {
        Write-Host "ℹ️ Removing existing scheduled task..." -ForegroundColor Gray
        Unregister-ScheduledTask -TaskName "CloudflareTunnelValidation" -Confirm:$false
    }
    
    # Create task
    Register-ScheduledTask -TaskName "CloudflareTunnelValidation" `
        -Action $action `
        -Trigger $trigger `
        -Settings $settings `
        -Principal $taskPrincipal `
        -Description "Daily validation of Cloudflare tunnel configuration (Tunnel ID: $CANONICAL_TUNNEL_ID)" | Out-Null
    
    Write-Host "✅ Scheduled task created successfully" -ForegroundColor Green
    Write-Host ""
    Write-Host "Task Details:" -ForegroundColor Cyan
    Write-Host "  Name:        CloudflareTunnelValidation" -ForegroundColor Gray
    Write-Host "  Schedule:    Daily at 8:00 AM" -ForegroundColor Gray
    Write-Host "  Script:      $scriptPath" -ForegroundColor Gray
    Write-Host "  User:        $env:USERNAME" -ForegroundColor Gray
    Write-Host ""
    Write-Host "To test the task:" -ForegroundColor Cyan
    Write-Host "  Start-ScheduledTask -TaskName 'CloudflareTunnelValidation'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "To view task history:" -ForegroundColor Cyan
    Write-Host "  Get-ScheduledTask -TaskName 'CloudflareTunnelValidation' | Get-ScheduledTaskInfo" -ForegroundColor Gray
    Write-Host ""
    
    exit 0
}

Write-Host "🔍 Cloudflare Tunnel Configuration Validator" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""

$validationResults = @{
    Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Checks = @()
    Issues = @()
    OverallStatus = "Pass"
}

# Step 1: Validate config file exists
Write-Host "1. Checking config file..." -ForegroundColor Yellow
if (-not (Test-Path $CONFIG_PATH)) {
    Write-Host "   ❌ Config file not found: $CONFIG_PATH" -ForegroundColor Red
    $validationResults.Issues += "Config file not found"
    $validationResults.OverallStatus = "Fail"
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
    $validationResults.Issues += "Could not extract tunnel ID"
    $validationResults.OverallStatus = "Fail"
    
    if ($FailOnMismatch) {
        exit 1
    }
}

# Step 3: Verify tunnel ID matches canonical
Write-Host "3. Verifying tunnel ID..." -ForegroundColor Yellow
if ($configTunnelId -ne $CANONICAL_TUNNEL_ID) {
    Write-Host "   ❌ MISMATCH!" -ForegroundColor Red
    Write-Host "      Expected: $CANONICAL_TUNNEL_ID" -ForegroundColor Yellow
    Write-Host "      Found:    $configTunnelId" -ForegroundColor Red
    $validationResults.Issues += "Tunnel ID mismatch"
    $validationResults.OverallStatus = "Fail"
    $validationResults.Checks += @{
        Name = "Tunnel ID"
        Status = "Fail"
        Expected = $CANONICAL_TUNNEL_ID
        Found = $configTunnelId
    }
    
    if ($FailOnMismatch) {
        exit 1
    }
} else {
    Write-Host "   ✅ Tunnel ID is canonical" -ForegroundColor Green
    $validationResults.Checks += @{
        Name = "Tunnel ID"
        Status = "Pass"
        Value = $CANONICAL_TUNNEL_ID
    }
}

# Step 4: Verify DNS CNAME records
Write-Host "4. Validating DNS CNAME records..." -ForegroundColor Yellow
$dnsValid = $true
$dnsResults = @()

foreach ($hostname in $TEST_HOSTNAMES) {
    try {
        $dnsResult = Resolve-DnsName $hostname -Type CNAME -ErrorAction Stop
        
        if ($dnsResult -and $dnsResult.NameHost) {
            $cnameTarget = $dnsResult.NameHost
            
            if ($cnameTarget -like "$CANONICAL_TUNNEL_ID*") {
                Write-Host "   ✅ $hostname → $cnameTarget" -ForegroundColor Green
                $dnsResults += @{
                    Hostname = $hostname
                    Target = $cnameTarget
                    Status = "Pass"
                }
            } else {
                Write-Host "   ❌ $hostname → $cnameTarget (WRONG!)" -ForegroundColor Red
                $dnsValid = $false
                $validationResults.Issues += "DNS mismatch for $hostname"
                $dnsResults += @{
                    Hostname = $hostname
                    Target = $cnameTarget
                    Status = "Fail"
                }
            }
        }
    } catch {
        if ($Verbose) {
            Write-Host "   ⚠️ $hostname - DNS query failed: $($_.Exception.Message)" -ForegroundColor Yellow
        } else {
            Write-Host "   ⚠️ $hostname - DNS query failed (may be offline)" -ForegroundColor Yellow
        }
    }
}

$validationResults.Checks += @{
    Name = "DNS CNAME Records"
    Status = if ($dnsValid) { "Pass" } else { "Fail" }
    Details = $dnsResults
}

if (-not $dnsValid) {
    $validationResults.OverallStatus = "Fail"
}

# Step 5: Verify credentials file exists
Write-Host "5. Checking credentials file..." -ForegroundColor Yellow
if (Test-Path $CRED_PATH) {
    Write-Host "   ✅ Credentials file exists" -ForegroundColor Green
    
    # Validate JSON
    try {
        $credContent = Get-Content $CRED_PATH -Raw | ConvertFrom-Json
        if ($credContent.AccountTag -and $credContent.TunnelSecret) {
            Write-Host "   ✅ Credentials are valid JSON" -ForegroundColor Green
            $validationResults.Checks += @{
                Name = "Credentials File"
                Status = "Pass"
            }
        }
    } catch {
        Write-Host "   ⚠️ Credentials file is not valid JSON" -ForegroundColor Yellow
        $validationResults.Issues += "Invalid credentials JSON"
        $validationResults.Checks += @{
            Name = "Credentials File"
            Status = "Warning"
            Details = "Invalid JSON"
        }
    }
} else {
    Write-Host "   ❌ Credentials file not found: $CRED_PATH" -ForegroundColor Red
    $validationResults.Issues += "Credentials file not found"
    $validationResults.OverallStatus = "Fail"
    $validationResults.Checks += @{
        Name = "Credentials File"
        Status = "Fail"
    }
}

# Step 6: Test service status (if installed)
Write-Host "6. Checking service status..." -ForegroundColor Yellow
$service = Get-Service -Name "cloudflared" -ErrorAction SilentlyContinue
if ($service) {
    if ($service.Status -eq "Running") {
        Write-Host "   ✅ Service is running" -ForegroundColor Green
        $validationResults.Checks += @{
            Name = "Service Status"
            Status = "Pass"
            Value = "Running"
        }
    } else {
        Write-Host "   ⚠️ Service status: $($service.Status)" -ForegroundColor Yellow
        $validationResults.Issues += "Service not running"
        $validationResults.Checks += @{
            Name = "Service Status"
            Status = "Warning"
            Value = $service.Status
        }
    }
    
    if ($service.StartType -eq "Automatic") {
        Write-Host "   ✅ Service set to auto-start" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️ Service StartType: $($service.StartType)" -ForegroundColor Yellow
        $validationResults.Checks += @{
            Name = "Service StartType"
            Status = "Warning"
            Value = $service.StartType
        }
    }
} else {
    Write-Host "   ℹ️ Service not installed" -ForegroundColor Gray
    $validationResults.Checks += @{
        Name = "Service Status"
        Status = "Info"
        Value = "Not installed"
    }
}

# Summary
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

$exitCode = 0

if ($validationResults.OverallStatus -eq "Pass") {
    Write-Host "✅ VALIDATION PASSED" -ForegroundColor Green
    Write-Host "   Tunnel ID is stable and matches DNS records" -ForegroundColor Gray
} else {
    Write-Host "⚠️ VALIDATION WARNINGS" -ForegroundColor Yellow
    Write-Host "   Review issues above" -ForegroundColor Gray
    
    if ($validationResults.Issues.Count -gt 0) {
        Write-Host ""
        Write-Host "Issues Found:" -ForegroundColor Yellow
        foreach ($issue in $validationResults.Issues) {
            Write-Host "   • $issue" -ForegroundColor Red
        }
    }
    
    if ($FailOnMismatch) {
        $exitCode = 1
    }
}

# Write results to log (if log directory exists)
$logDir = "$PSScriptRoot\logs"
if (Test-Path $logDir) {
    $logFile = Join-Path $logDir "validation-$(Get-Date -Format 'yyyyMMdd').log"
    $validationResults | ConvertTo-Json -Depth 5 | Add-Content $logFile
}

Write-Host ""
exit $exitCode
