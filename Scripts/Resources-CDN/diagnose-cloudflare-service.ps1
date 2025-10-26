<#
.SYNOPSIS
    Comprehensive diagnostic tool for Cloudflare tunnel service

.DESCRIPTION
    Enhancement E: Performs detailed diagnostics including:
    - Service registration and status
    - Binary and configuration validation
    - Windows Event Log analysis
    - Network connectivity tests
    - Scheduled task verification
    - Recovery configuration check
    - Generates detailed report

.PARAMETER ServiceName
    Windows service name (default: CloudflareResourcesTunnel)

.PARAMETER ExportReport
    Export diagnostic report to file

.EXAMPLE
    .\diagnose-cloudflare-service.ps1
    
.EXAMPLE
    .\diagnose-cloudflare-service.ps1 -ExportReport

.NOTES
    Last Updated: 2025-10-26
#>

[CmdletBinding()]
param(
    [string]$ServiceName = "CloudflareResourcesTunnel",
    [string]$CloudflaredPath = "D:\PROJECTS\__CLOUDFLARE\cloudflared.exe",
    [string]$ConfigPath = "D:\PROJECTS\__CLOUDFLARE\config-resources.yml",
    [string]$TaskName = "StartCloudflareResourcesTunnel",
    [switch]$ExportReport
)

$ErrorActionPreference = "Continue"
$diagnosticResults = @()

function Add-DiagnosticResult {
    param(
        [string]$Category,
        [string]$Test,
        [string]$Status,  # PASS, FAIL, WARNING, INFO
        [string]$Message,
        [string]$Details = ""
    )
    
    $script:diagnosticResults += [PSCustomObject]@{
        Category = $Category
        Test = $Test
        Status = $Status
        Message = $Message
        Details = $Details
        Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    }
    
    $color = switch ($Status) {
        "PASS" { "Green" }
        "FAIL" { "Red" }
        "WARNING" { "Yellow" }
        default { "White" }
    }
    
    $icon = switch ($Status) {
        "PASS" { "✓" }
        "FAIL" { "✗" }
        "WARNING" { "⚠" }
        default { "•" }
    }
    
    Write-Host "  $icon $Test : $Message" -ForegroundColor $color
    if ($Details) {
        Write-Host "    $Details" -ForegroundColor Gray
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Cloudflare Tunnel Service Diagnostics" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Service: $ServiceName" -ForegroundColor White
Write-Host "Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor White
Write-Host "Computer: $env:COMPUTERNAME" -ForegroundColor White
Write-Host "User: $env:USERNAME`n" -ForegroundColor White

# ============================================================================
# 1. SERVICE REGISTRATION
# ============================================================================
Write-Host "[1] SERVICE REGISTRATION" -ForegroundColor Yellow
Write-Host "=" * 40 -ForegroundColor Gray

$service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($service) {
    Add-DiagnosticResult -Category "Service" -Test "Registration" -Status "PASS" `
        -Message "Service is registered" `
        -Details "Display Name: $($service.DisplayName)"
    
    Add-DiagnosticResult -Category "Service" -Test "Status" -Status $(if ($service.Status -eq "Running") { "PASS" } else { "WARNING" }) `
        -Message "Service status: $($service.Status)" `
        -Details "Start Type: $($service.StartType)"
    
    # Get service details via WMI for more info
    $wmiService = Get-WmiObject -Class Win32_Service -Filter "Name='$ServiceName'" -ErrorAction SilentlyContinue
    if ($wmiService) {
        Add-DiagnosticResult -Category "Service" -Test "Account" -Status "INFO" `
            -Message "Service account: $($wmiService.StartName)" `
            -Details "Path: $($wmiService.PathName)"
    }
} else {
    Add-DiagnosticResult -Category "Service" -Test "Registration" -Status "FAIL" `
        -Message "Service is NOT registered in Windows Service Manager"
}

# ============================================================================
# 2. BINARY VALIDATION
# ============================================================================
Write-Host "`n[2] BINARY VALIDATION" -ForegroundColor Yellow
Write-Host "=" * 40 -ForegroundColor Gray

if (Test-Path $CloudflaredPath) {
    Add-DiagnosticResult -Category "Binary" -Test "Existence" -Status "PASS" `
        -Message "cloudflared.exe found" `
        -Details "Path: $CloudflaredPath"
    
    try {
        $version = & $CloudflaredPath --version 2>&1
        Add-DiagnosticResult -Category "Binary" -Test "Version" -Status "PASS" `
            -Message "Version check successful" `
            -Details "$version"
    } catch {
        Add-DiagnosticResult -Category "Binary" -Test "Version" -Status "WARNING" `
            -Message "Could not get version" `
            -Details $_.Exception.Message
    }
    
    $fileInfo = Get-Item $CloudflaredPath
    Add-DiagnosticResult -Category "Binary" -Test "File Info" -Status "INFO" `
        -Message "File size: $([math]::Round($fileInfo.Length/1MB, 2)) MB" `
        -Details "Last modified: $($fileInfo.LastWriteTime)"
} else {
    Add-DiagnosticResult -Category "Binary" -Test "Existence" -Status "FAIL" `
        -Message "cloudflared.exe NOT found" `
        -Details "Expected path: $CloudflaredPath"
}

# ============================================================================
# 3. CONFIGURATION VALIDATION
# ============================================================================
Write-Host "`n[3] CONFIGURATION VALIDATION" -ForegroundColor Yellow
Write-Host "=" * 40 -ForegroundColor Gray

if (Test-Path $ConfigPath) {
    Add-DiagnosticResult -Category "Config" -Test "Existence" -Status "PASS" `
        -Message "Config file found" `
        -Details "Path: $ConfigPath"
    
    $configContent = Get-Content $ConfigPath -Raw
    
    if ($configContent -match '<TUNNEL_ID>|<CREDENTIALS_FILE>') {
        Add-DiagnosticResult -Category "Config" -Test "Placeholders" -Status "FAIL" `
            -Message "Config contains placeholders" `
            -Details "Config needs to be properly configured"
    } else {
        Add-DiagnosticResult -Category "Config" -Test "Placeholders" -Status "PASS" `
            -Message "No placeholders found"
    }
    
    # Parse YAML and check key fields
    if ($configContent -match 'tunnel:\s*([a-f0-9\-]+)') {
        Add-DiagnosticResult -Category "Config" -Test "Tunnel ID" -Status "PASS" `
            -Message "Tunnel ID present" `
            -Details "ID: $($Matches[1])"
    }
    
    if ($configContent -match 'credentials-file:\s*(.+)') {
        $credFile = $Matches[1].Trim()
        if (Test-Path $credFile) {
            Add-DiagnosticResult -Category "Config" -Test "Credentials" -Status "PASS" `
                -Message "Credentials file exists" `
                -Details "Path: $credFile"
        } else {
            Add-DiagnosticResult -Category "Config" -Test "Credentials" -Status "FAIL" `
                -Message "Credentials file NOT found" `
                -Details "Path: $credFile"
        }
    }
    
    # Check ingress rules
    $ingressCount = ([regex]::Matches($configContent, 'hostname:')).Count
    Add-DiagnosticResult -Category "Config" -Test "Ingress Rules" -Status "INFO" `
        -Message "$ingressCount ingress rule(s) configured"
        
} else {
    Add-DiagnosticResult -Category "Config" -Test "Existence" -Status "FAIL" `
        -Message "Config file NOT found" `
        -Details "Expected path: $ConfigPath"
}

# ============================================================================
# 4. SERVICE RECOVERY CONFIGURATION
# ============================================================================
Write-Host "`n[4] RECOVERY CONFIGURATION" -ForegroundColor Yellow
Write-Host "=" * 40 -ForegroundColor Gray

if ($service) {
    try {
        $scOutput = sc.exe qfailure $ServiceName 2>&1 | Out-String
        if ($scOutput -match "RESTART") {
            Add-DiagnosticResult -Category "Recovery" -Test "Auto-Restart" -Status "PASS" `
                -Message "Service configured for auto-restart" `
                -Details "Recovery actions are configured"
        } else {
            Add-DiagnosticResult -Category "Recovery" -Test "Auto-Restart" -Status "WARNING" `
                -Message "Auto-restart may not be configured" `
                -Details "Run install script to configure recovery"
        }
    } catch {
        Add-DiagnosticResult -Category "Recovery" -Test "Auto-Restart" -Status "WARNING" `
            -Message "Could not check recovery config"
    }
}

# ============================================================================
# 5. SCHEDULED TASK CHECK
# ============================================================================
Write-Host "`n[5] SCHEDULED TASK (FALLBACK)" -ForegroundColor Yellow
Write-Host "=" * 40 -ForegroundColor Gray

$task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($task) {
    Add-DiagnosticResult -Category "Task" -Test "Registration" -Status "PASS" `
        -Message "Fallback startup task exists" `
        -Details "State: $($task.State)"
    
    $taskInfo = Get-ScheduledTaskInfo -TaskName $TaskName -ErrorAction SilentlyContinue
    if ($taskInfo) {
        Add-DiagnosticResult -Category "Task" -Test "Last Run" -Status "INFO" `
            -Message "Last run: $($taskInfo.LastRunTime)" `
            -Details "Next run: $($taskInfo.NextRunTime)"
    }
} else {
    Add-DiagnosticResult -Category "Task" -Test "Registration" -Status "WARNING" `
        -Message "Fallback startup task NOT found" `
        -Details "Run create-startup-task.ps1 to create it"
}

# ============================================================================
# 6. WINDOWS EVENT LOG
# ============================================================================
Write-Host "`n[6] WINDOWS EVENT LOG" -ForegroundColor Yellow
Write-Host "=" * 40 -ForegroundColor Gray

try {
    $recentEvents = Get-EventLog -LogName Application -Source "cloudflared" -Newest 10 -After (Get-Date).AddDays(-1) -ErrorAction SilentlyContinue
    if ($recentEvents) {
        $errorCount = ($recentEvents | Where-Object { $_.EntryType -eq "Error" }).Count
        $warningCount = ($recentEvents | Where-Object { $_.EntryType -eq "Warning" }).Count
        
        Add-DiagnosticResult -Category "Events" -Test "Recent Logs" -Status "INFO" `
            -Message "Found $($recentEvents.Count) events (last 24h)" `
            -Details "Errors: $errorCount, Warnings: $warningCount"
        
        if ($errorCount -gt 0) {
            $latestError = $recentEvents | Where-Object { $_.EntryType -eq "Error" } | Select-Object -First 1
            Add-DiagnosticResult -Category "Events" -Test "Latest Error" -Status "WARNING" `
                -Message "Error at $($latestError.TimeGenerated)" `
                -Details $latestError.Message.Substring(0, [Math]::Min(200, $latestError.Message.Length))
        }
    } else {
        Add-DiagnosticResult -Category "Events" -Test "Recent Logs" -Status "INFO" `
            -Message "No cloudflared events in last 24 hours"
    }
} catch {
    Add-DiagnosticResult -Category "Events" -Test "Event Log Access" -Status "WARNING" `
        -Message "Could not access Event Log" `
        -Details $_.Exception.Message
}

# ============================================================================
# 7. NETWORK CONNECTIVITY
# ============================================================================
Write-Host "`n[7] NETWORK CONNECTIVITY" -ForegroundColor Yellow
Write-Host "=" * 40 -ForegroundColor Gray

# Test Cloudflare API
try {
    $response = Invoke-WebRequest -Uri "https://api.cloudflare.com/client/v4" -Method GET -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Add-DiagnosticResult -Category "Network" -Test "Cloudflare API" -Status "PASS" `
        -Message "Can reach Cloudflare API" `
        -Details "Status: $($response.StatusCode)"
} catch {
    Add-DiagnosticResult -Category "Network" -Test "Cloudflare API" -Status "FAIL" `
        -Message "Cannot reach Cloudflare API" `
        -Details $_.Exception.Message
}

# Test public tunnel URL
try {
    $response = Invoke-WebRequest -Uri "https://resources.kashkole.com" -Method HEAD -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    Add-DiagnosticResult -Category "Network" -Test "Tunnel URL" -Status "PASS" `
        -Message "resources.kashkole.com is reachable" `
        -Details "Status: $($response.StatusCode)"
} catch {
    Add-DiagnosticResult -Category "Network" -Test "Tunnel URL" -Status "WARNING" `
        -Message "resources.kashkole.com not reachable" `
        -Details $_.Exception.Message
}

# Test localhost backend
try {
    $response = Invoke-WebRequest -Uri "http://localhost:80" -Method HEAD -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Add-DiagnosticResult -Category "Network" -Test "IIS Backend" -Status "PASS" `
        -Message "localhost:80 (IIS) is responding" `
        -Details "Status: $($response.StatusCode)"
} catch {
    Add-DiagnosticResult -Category "Network" -Test "IIS Backend" -Status "WARNING" `
        -Message "localhost:80 not responding" `
        -Details $_.Exception.Message
}

# ============================================================================
# SUMMARY
# ============================================================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  DIAGNOSTIC SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$passCount = ($diagnosticResults | Where-Object { $_.Status -eq "PASS" }).Count
$failCount = ($diagnosticResults | Where-Object { $_.Status -eq "FAIL" }).Count
$warnCount = ($diagnosticResults | Where-Object { $_.Status -eq "WARNING" }).Count
$infoCount = ($diagnosticResults | Where-Object { $_.Status -eq "INFO" }).Count

Write-Host "Passed:   $passCount" -ForegroundColor Green
Write-Host "Failed:   $failCount" -ForegroundColor Red
Write-Host "Warnings: $warnCount" -ForegroundColor Yellow
Write-Host "Info:     $infoCount" -ForegroundColor White

if ($failCount -gt 0) {
    Write-Host "`nCritical Issues:" -ForegroundColor Red
    $diagnosticResults | Where-Object { $_.Status -eq "FAIL" } | ForEach-Object {
        Write-Host "  • [$($_.Category)] $($_.Test): $($_.Message)" -ForegroundColor Red
    }
}

if ($warnCount -gt 0) {
    Write-Host "`nWarnings:" -ForegroundColor Yellow
    $diagnosticResults | Where-Object { $_.Status -eq "WARNING" } | ForEach-Object {
        Write-Host "  • [$($_.Category)] $($_.Test): $($_.Message)" -ForegroundColor Yellow
    }
}

# Overall health assessment
Write-Host "`nOverall Health: " -NoNewline
if ($failCount -eq 0 -and $warnCount -eq 0) {
    Write-Host "EXCELLENT" -ForegroundColor Green
    Write-Host "All systems operational" -ForegroundColor Green
} elseif ($failCount -eq 0) {
    Write-Host "GOOD" -ForegroundColor Yellow
    Write-Host "Service operational with minor warnings" -ForegroundColor Yellow
} elseif ($failCount -le 2) {
    Write-Host "DEGRADED" -ForegroundColor Red
    Write-Host "Some issues detected, manual intervention may be needed" -ForegroundColor Red
} else {
    Write-Host "CRITICAL" -ForegroundColor Red
    Write-Host "Multiple critical issues detected, service may not work" -ForegroundColor Red
}

# Export report if requested
if ($ExportReport) {
    $reportPath = "$PSScriptRoot\diagnostic-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
    $diagnosticResults | ConvertTo-Json -Depth 3 | Out-File -FilePath $reportPath -Encoding UTF8
    Write-Host "`nReport exported to: $reportPath" -ForegroundColor Cyan
}

Write-Host "`n" 
