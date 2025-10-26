<#
.SYNOPSIS
    Creates a scheduled task as fallback to start Cloudflare tunnel service

.DESCRIPTION
    Enhancement D: Creates a Windows scheduled task that:
    - Runs at system startup
    - Starts the CloudflareResourcesTunnel service if not running
    - Provides redundancy if service auto-start fails
    - Runs with SYSTEM privileges

.PARAMETER TaskName
    Name of the scheduled task (default: StartCloudflareResourcesTunnel)

.PARAMETER ServiceName
    Name of the Windows service to start (default: CloudflareResourcesTunnel)

.PARAMETER Remove
    Remove the scheduled task instead of creating it

.EXAMPLE
    .\create-startup-task.ps1
    
.EXAMPLE
    .\create-startup-task.ps1 -Remove

.NOTES
    Requires: Administrator privileges
    Last Updated: 2025-10-26
#>

#Requires -RunAsAdministrator

[CmdletBinding()]
param(
    [string]$TaskName = "StartCloudflareResourcesTunnel",
    [string]$ServiceName = "CloudflareResourcesTunnel",
    [switch]$Remove
)

$ErrorActionPreference = "Stop"

if ($Remove) {
    Write-Host "`nRemoving scheduled task: $TaskName" -ForegroundColor Yellow
    try {
        Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
        Write-Host "✓ Task removed successfully" -ForegroundColor Green
    } catch {
        Write-Host "Task not found or already removed" -ForegroundColor Gray
    }
    exit 0
}

Write-Host "`n=== Creating Cloudflare Tunnel Startup Task ===" -ForegroundColor Cyan
Write-Host "Task: $TaskName" -ForegroundColor White
Write-Host "Service: $ServiceName`n" -ForegroundColor White

# Remove existing task if present
$existingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($existingTask) {
    Write-Host "[1/3] Removing existing task..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    Write-Host "  ✓ Existing task removed" -ForegroundColor Green
} else {
    Write-Host "[1/3] No existing task found" -ForegroundColor Gray
}

# Create the action - PowerShell script to start service if not running
Write-Host "`n[2/3] Creating task action..." -ForegroundColor Yellow

$scriptBlock = @"
`$service = Get-Service -Name '$ServiceName' -ErrorAction SilentlyContinue
if (`$service -and `$service.Status -ne 'Running') {
    Start-Service -Name '$ServiceName' -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 3
    `$newStatus = (Get-Service -Name '$ServiceName').Status
    Write-EventLog -LogName Application -Source 'CloudflareTunnelTask' -EventId 1001 -EntryType Information -Message "Started $ServiceName service via scheduled task. Status: `$newStatus"
}
"@

$encodedCommand = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($scriptBlock))
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-NoProfile -WindowStyle Hidden -EncodedCommand $encodedCommand"

Write-Host "  ✓ Task action created" -ForegroundColor Green

# Create trigger - at system startup with 2 minute delay
Write-Host "`n[3/3] Creating task trigger and settings..." -ForegroundColor Yellow
$trigger = New-ScheduledTaskTrigger -AtStartup -RandomDelay (New-TimeSpan -Minutes 2)

# Task settings
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 1)

# Create event source for logging
try {
    New-EventLog -LogName Application -Source "CloudflareTunnelTask" -ErrorAction SilentlyContinue
} catch {
    # Source might already exist
}

# Register task to run as SYSTEM
Write-Host "  Registering task..." -ForegroundColor Yellow
Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -User "SYSTEM" `
    -RunLevel Highest `
    -Description "Fallback startup task for Cloudflare Resources Tunnel. Ensures service starts if auto-start fails." | Out-Null

Write-Host "  ✓ Task registered" -ForegroundColor Green

# Verify task creation
$task = Get-ScheduledTask -TaskName $TaskName
if ($task) {
    Write-Host "`n=== Startup Task Created Successfully ===" -ForegroundColor Green
    Write-Host "`nTask Details:" -ForegroundColor Cyan
    Write-Host "  Name: $($task.TaskName)" -ForegroundColor White
    Write-Host "  State: $($task.State)" -ForegroundColor White
    Write-Host "  User: SYSTEM" -ForegroundColor White
    Write-Host "  Trigger: At system startup (+2min delay)" -ForegroundColor White
    Write-Host "  Action: Start $ServiceName if not running" -ForegroundColor White
    
    Write-Host "`nTask Management:" -ForegroundColor Yellow
    Write-Host "  View: Get-ScheduledTask -TaskName '$TaskName'" -ForegroundColor Gray
    Write-Host "  Remove: .\create-startup-task.ps1 -Remove" -ForegroundColor Gray
    Write-Host "  Test: Start-ScheduledTask -TaskName '$TaskName'`n" -ForegroundColor Gray
} else {
    Write-Host "`nERROR: Task creation failed" -ForegroundColor Red
    exit 1
}
