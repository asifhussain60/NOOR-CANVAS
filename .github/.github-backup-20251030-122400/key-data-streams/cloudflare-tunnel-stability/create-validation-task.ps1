# Create Scheduled Task for Cloudflare Tunnel Validation
# This script creates a scheduled task that runs daily validation

$ErrorActionPreference = "Stop"

Write-Host "📅 Creating Scheduled Task for Cloudflare Tunnel Validation" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
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

$scriptPath = Join-Path $PSScriptRoot "validate-config.ps1"

if (-not (Test-Path $scriptPath)) {
    Write-Host "❌ Validation script not found: $scriptPath" -ForegroundColor Red
    exit 1
}

# Task configuration
$taskName = "CloudflareTunnelValidation"
$description = "Daily validation of Cloudflare tunnel configuration (Tunnel ID: 93650d38-60af-4dc7-a5ec-f8347fc57514)"

# Create task action
$action = New-ScheduledTaskAction -Execute "pwsh.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`" -FailOnMismatch"

# Create task trigger (daily at 8:00 AM)
$trigger = New-ScheduledTaskTrigger -Daily -At "08:00AM"

# Create task settings
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -RunOnlyIfNetworkAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries

# Create task principal (run as current user)
$taskPrincipal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType S4U

# Remove existing task if present
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existingTask) {
    Write-Host "ℹ️ Removing existing scheduled task..." -ForegroundColor Gray
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
    Write-Host "✅ Existing task removed" -ForegroundColor Green
}

# Create task
Write-Host "📝 Creating scheduled task..." -ForegroundColor Yellow

Register-ScheduledTask -TaskName $taskName `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Principal $taskPrincipal `
    -Description $description | Out-Null

Write-Host "✅ Scheduled task created successfully" -ForegroundColor Green
Write-Host ""

# Display task information
$task = Get-ScheduledTask -TaskName $taskName
$taskInfo = Get-ScheduledTaskInfo -TaskName $taskName

Write-Host "Task Details:" -ForegroundColor Cyan
Write-Host "  Name:          $taskName" -ForegroundColor Gray
Write-Host "  State:         $($task.State)" -ForegroundColor Gray
Write-Host "  Schedule:      Daily at 8:00 AM" -ForegroundColor Gray
Write-Host "  Script:        $scriptPath" -ForegroundColor Gray
Write-Host "  User:          $env:USERNAME" -ForegroundColor Gray
Write-Host "  Last Run:      $($taskInfo.LastRunTime)" -ForegroundColor Gray
Write-Host "  Next Run:      $($taskInfo.NextRunTime)" -ForegroundColor Gray
Write-Host ""

Write-Host "Useful Commands:" -ForegroundColor Cyan
Write-Host "  Test task now:       Start-ScheduledTask -TaskName '$taskName'" -ForegroundColor Gray
Write-Host "  View task info:      Get-ScheduledTask -TaskName '$taskName' | Get-ScheduledTaskInfo" -ForegroundColor Gray
Write-Host "  Disable task:        Disable-ScheduledTask -TaskName '$taskName'" -ForegroundColor Gray
Write-Host "  Enable task:         Enable-ScheduledTask -TaskName '$taskName'" -ForegroundColor Gray
Write-Host "  Remove task:         Unregister-ScheduledTask -TaskName '$taskName'" -ForegroundColor Gray
Write-Host ""

# Offer to run the task now
$runNow = Read-Host "Run validation task now? (y/N)"
if ($runNow -eq "y" -or $runNow -eq "Y") {
    Write-Host ""
    Write-Host "▶️ Running validation task..." -ForegroundColor Yellow
    Start-ScheduledTask -TaskName $taskName
    Start-Sleep -Seconds 2
    
    # Show result
    $result = Get-ScheduledTaskInfo -TaskName $taskName
    Write-Host "✅ Task executed" -ForegroundColor Green
    Write-Host "   Last Result: $($result.LastTaskResult)" -ForegroundColor Gray
    Write-Host ""
}

exit 0
