<#
.SYNOPSIS
    Diagnose and fix IIS configuration issues for NoorCanvas

.DESCRIPTION
    This script checks for common IIS configuration problems and attempts to fix them.
#>

#Requires -RunAsAdministrator

Write-Host "NoorCanvas IIS Diagnostic Tool" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Gray

# Check 1: ASP.NET Core Module
Write-Host "`n[CHECK 1] ASP.NET Core Hosting Bundle..." -ForegroundColor Yellow

$ancmPath = "$env:ProgramFiles\IIS\Asp.Net Core Module\V2\aspnetcorev2.dll"
if (Test-Path $ancmPath) {
    Write-Host "[OK] ASP.NET Core Module V2 found" -ForegroundColor Green
    Write-Host "  Path: $ancmPath" -ForegroundColor Gray
} else {
    Write-Host "[ERROR] ASP.NET Core Module V2 NOT found!" -ForegroundColor Red
    Write-Host "`nThe ASP.NET Core Hosting Bundle is not installed." -ForegroundColor Yellow
    Write-Host "This is required to run ASP.NET Core applications in IIS.`n" -ForegroundColor Yellow
    
    Write-Host "SOLUTION:" -ForegroundColor Cyan
    Write-Host "1. Download the .NET 8.0 Hosting Bundle from:" -ForegroundColor White
    Write-Host "   https://dotnet.microsoft.com/download/dotnet/8.0" -ForegroundColor Gray
    Write-Host "2. Look for: 'Hosting Bundle' (not just Runtime)" -ForegroundColor White
    Write-Host "3. Install it" -ForegroundColor White
    Write-Host "4. Restart IIS: iisreset" -ForegroundColor White
    Write-Host "5. Re-run this diagnostic script`n" -ForegroundColor White
    
    $openBrowser = Read-Host "Open download page in browser? (Y/N)"
    if ($openBrowser -eq "Y" -or $openBrowser -eq "y") {
        Start-Process "https://dotnet.microsoft.com/download/dotnet/8.0"
    }
    
    exit 1
}

# Check 2: .NET Runtime
Write-Host "`n[CHECK 2] .NET 8.0 Runtime..." -ForegroundColor Yellow

$runtimes = & dotnet --list-runtimes | Select-String "Microsoft.AspNetCore.App 8"
if ($runtimes) {
    Write-Host "[OK] .NET 8.0 Runtime found" -ForegroundColor Green
    $runtimes | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
} else {
    Write-Host "[ERROR] .NET 8.0 Runtime NOT found!" -ForegroundColor Red
}

# Check 3: IIS Website
Write-Host "`n[CHECK 3] IIS Website Configuration..." -ForegroundColor Yellow

Import-Module WebAdministration -ErrorAction SilentlyContinue

$site = Get-Website -Name "NoorCanvas" -ErrorAction SilentlyContinue
if ($site) {
    Write-Host "[OK] Website exists" -ForegroundColor Green
    Write-Host "  Name: $($site.name)" -ForegroundColor Gray
    Write-Host "  State: $($site.state)" -ForegroundColor Gray
    Write-Host "  Path: $($site.physicalPath)" -ForegroundColor Gray
    
    $bindings = $site.bindings.Collection
    Write-Host "  Bindings:" -ForegroundColor Gray
    foreach ($binding in $bindings) {
        Write-Host "    - $($binding.protocol)://$($binding.bindingInformation)" -ForegroundColor Gray
    }
} else {
    Write-Host "[ERROR] Website 'NoorCanvas' not found!" -ForegroundColor Red
}

# Check 4: Application Pool
Write-Host "`n[CHECK 4] Application Pool..." -ForegroundColor Yellow

$pool = Get-WebAppPoolState -Name "NoorCanvas" -ErrorAction SilentlyContinue
if ($pool) {
    Write-Host "[OK] App Pool exists" -ForegroundColor Green
    Write-Host "  State: $($pool.Value)" -ForegroundColor Gray
    
    $poolConfig = Get-Item "IIS:\AppPools\NoorCanvas"
    Write-Host "  Runtime: $($poolConfig.managedRuntimeVersion)" -ForegroundColor Gray
    Write-Host "  Pipeline: $($poolConfig.managedPipelineMode)" -ForegroundColor Gray
} else {
    Write-Host "[ERROR] App Pool 'NoorCanvas' not found!" -ForegroundColor Red
}

# Check 5: web.config
Write-Host "`n[CHECK 5] web.config..." -ForegroundColor Yellow

$webConfigPath = "D:\Websites\NOOR-CANVAS\web.config"
if (Test-Path $webConfigPath) {
    Write-Host "[OK] web.config exists" -ForegroundColor Green
    
    try {
        [xml]$webConfig = Get-Content $webConfigPath
        Write-Host "[OK] web.config is valid XML" -ForegroundColor Green
        
        $module = $webConfig.configuration.location.'system.webServer'.handlers.add.modules
        Write-Host "  Module: $module" -ForegroundColor Gray
        
        $hostingModel = $webConfig.configuration.location.'system.webServer'.aspNetCore.hostingModel
        Write-Host "  Hosting Model: $hostingModel" -ForegroundColor Gray
    } catch {
        Write-Host "[ERROR] web.config is invalid XML!" -ForegroundColor Red
        Write-Host "  Error: $_" -ForegroundColor Red
    }
} else {
    Write-Host "[ERROR] web.config not found!" -ForegroundColor Red
}

# Check 6: Application Files
Write-Host "`n[CHECK 6] Application Files..." -ForegroundColor Yellow

$dllPath = "D:\Websites\NOOR-CANVAS\NoorCanvas.dll"
if (Test-Path $dllPath) {
    Write-Host "[OK] NoorCanvas.dll found" -ForegroundColor Green
} else {
    Write-Host "[ERROR] NoorCanvas.dll NOT found!" -ForegroundColor Red
}

$appsettings = "D:\Websites\NOOR-CANVAS\appsettings.json"
if (Test-Path $appsettings) {
    Write-Host "[OK] appsettings.json found" -ForegroundColor Green
} else {
    Write-Host "[WARN] appsettings.json NOT found" -ForegroundColor Yellow
}

# Check 7: Logs Directory
Write-Host "`n[CHECK 7] Logs Directory..." -ForegroundColor Yellow

$logsPath = "D:\Websites\NOOR-CANVAS\logs"
if (Test-Path $logsPath) {
    Write-Host "[OK] Logs directory exists" -ForegroundColor Green
    
    $stdoutLogs = Get-ChildItem "$logsPath\stdout*.log" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending
    if ($stdoutLogs) {
        Write-Host "  Recent stdout logs:" -ForegroundColor Gray
        $stdoutLogs | Select-Object -First 3 | ForEach-Object {
            Write-Host "    - $($_.Name) ($($_.LastWriteTime))" -ForegroundColor Gray
        }
        
        Write-Host "`n  Latest log content:" -ForegroundColor Cyan
        $latestLog = $stdoutLogs[0]
        Get-Content $latestLog.FullName -Tail 20 | ForEach-Object {
            Write-Host "    $_" -ForegroundColor White
        }
    } else {
        Write-Host "  [INFO] No stdout logs yet" -ForegroundColor Gray
    }
} else {
    Write-Host "[WARN] Logs directory does not exist" -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $logsPath -Force | Out-Null
    Write-Host "  Created logs directory" -ForegroundColor Green
}

# Check 8: Event Log
Write-Host "`n[CHECK 8] Recent Application Event Log Errors..." -ForegroundColor Yellow

$events = Get-EventLog -LogName Application -Source "IIS*" -Newest 5 -EntryType Error -ErrorAction SilentlyContinue
if ($events) {
    Write-Host "[WARN] Recent IIS errors found:" -ForegroundColor Yellow
    $events | ForEach-Object {
        Write-Host "  [$($_.TimeGenerated)] $($_.Message.Substring(0, [Math]::Min(100, $_.Message.Length)))..." -ForegroundColor Gray
    }
} else {
    Write-Host "[OK] No recent IIS errors in Event Log" -ForegroundColor Green
}

# Summary
Write-Host "`n" -NoNewline
Write-Host "=" * 50 -ForegroundColor Gray
Write-Host "DIAGNOSTIC COMPLETE" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Gray

Write-Host "`nIf the ASP.NET Core Hosting Bundle is missing, you MUST install it." -ForegroundColor Yellow
Write-Host "After installing, run: iisreset" -ForegroundColor Yellow
Write-Host "Then try accessing: http://localhost:9090" -ForegroundColor Cyan
