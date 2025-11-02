<#
.SYNOPSIS
    KDS Sensor Orchestrator - Runs all context sensors

.DESCRIPTION
    Master script to run all KDS context sensors in sequence:
    - Route Sensor (API endpoints)
    - Database Sensor (DB schema, connections)
    - UI Component Sensor (Blazor components, test IDs)
    - Knowledge Graph Builder (Relationship mapping - Week 3)
    
    Part of KDS v5.0 Brain System

.PARAMETER Mode
    Scan mode: 'Full' (all files) or 'Incremental' (only changed files since last scan)

.PARAMETER SkipSensors
    Comma-separated list of sensors to skip (e.g., 'routes,database')

.EXAMPLE
    .\run-all-sensors.ps1 -Mode Incremental
    .\run-all-sensors.ps1 -Mode Full
    .\run-all-sensors.ps1 -Mode Full -SkipSensors routes

.NOTES
    Version: 1.1.0
    Author: KDS Brain System
    Created: 2025-11-02 (Week 2)
    Updated: 2025-11-02 (Week 3 - Added Knowledge Graph Builder)
#>

param(
    [Parameter(Mandatory = $false)]
    [ValidateSet('Full', 'Incremental')]
    [string]$Mode = 'Incremental',

    [Parameter(Mandatory = $false)]
    [string[]]$SkipSensors = @()
)

$ErrorActionPreference = 'Stop'
$startTime = Get-Date

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "🧠 KDS CONTEXT SENSOR ORCHESTRATOR" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Mode: $Mode" -ForegroundColor Gray
Write-Host "Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host ""

# ===========================
# SENSOR DEFINITIONS
# ===========================

$sensors = @(
    @{
        Name = "routes"
        DisplayName = "Route Sensor"
        Script = "scan-routes.ps1"
        Description = "API endpoints from Controllers"
        Icon = "🛣️"
    },
    @{
        Name = "database"
        DisplayName = "Database Sensor"
        Script = "scan-database.ps1"
        Description = "DB schema from DbContext"
        Icon = "🗄️"
    },
    @{
        Name = "ui"
        DisplayName = "UI Component Sensor"
        Script = "scan-ui.ps1"
        Description = "Blazor components & test IDs"
        Icon = "🎨"
    },
    @{
        Name = "graph"
        DisplayName = "Knowledge Graph Builder"
        Script = "build-knowledge-graph.ps1"
        Description = "Relationship map from sensor outputs"
        Icon = "🧠"
    }
)

# ===========================
# RUN SENSORS
# ===========================

$results = @()

foreach ($sensor in $sensors) {
    if ($sensor.Name -in $SkipSensors) {
        Write-Host "$($sensor.Icon) $($sensor.DisplayName): SKIPPED" -ForegroundColor Yellow
        Write-Host ""
        continue
    }

    Write-Host "$($sensor.Icon) Running $($sensor.DisplayName)..." -ForegroundColor Cyan
    Write-Host "   $($sensor.Description)" -ForegroundColor Gray
    Write-Host ""

    $sensorStart = Get-Date
    
    try {
        $scriptPath = Join-Path $PSScriptRoot $sensor.Script
        
        if (-not (Test-Path $scriptPath)) {
            Write-Host "   ❌ Script not found: $scriptPath" -ForegroundColor Red
            $results += @{
                Sensor = $sensor.DisplayName
                Status = "FAILED"
                Error = "Script not found"
                Duration = 0
            }
            continue
        }

        # Run the sensor
        & $scriptPath -Mode $Mode
        
        $sensorDuration = ((Get-Date) - $sensorStart).TotalMilliseconds
        
        Write-Host "   ✅ $($sensor.DisplayName) complete ($([math]::Round($sensorDuration, 0))ms)" -ForegroundColor Green
        Write-Host ""
        
        $results += @{
            Sensor = $sensor.DisplayName
            Status = "SUCCESS"
            Error = $null
            Duration = $sensorDuration
        }
    }
    catch {
        Write-Host "   ❌ $($sensor.DisplayName) failed: $_" -ForegroundColor Red
        Write-Host ""
        
        $results += @{
            Sensor = $sensor.DisplayName
            Status = "FAILED"
            Error = $_.Exception.Message
            Duration = ((Get-Date) - $sensorStart).TotalMilliseconds
        }
    }
}

# ===========================
# SUMMARY
# ===========================

$totalDuration = ((Get-Date) - $startTime).TotalMilliseconds

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "📊 SENSOR RUN SUMMARY" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

foreach ($result in $results) {
    $statusColor = if ($result.Status -eq "SUCCESS") { "Green" } else { "Red" }
    $statusIcon = if ($result.Status -eq "SUCCESS") { "✅" } else { "❌" }
    
    Write-Host "$statusIcon $($result.Sensor): $($result.Status)" -ForegroundColor $statusColor
    if ($result.Error) {
        Write-Host "   Error: $($result.Error)" -ForegroundColor Red
    }
    Write-Host "   Duration: $([math]::Round($result.Duration, 0))ms" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Total Duration: $([math]::Round($totalDuration, 0))ms" -ForegroundColor Gray
Write-Host ""

# ===========================
# EXIT CODE
# ===========================

$failedSensors = $results | Where-Object { $_.Status -eq "FAILED" }
if ($failedSensors.Count -gt 0) {
    Write-Host "❌ $($failedSensors.Count) sensor(s) failed!" -ForegroundColor Red
    exit 1
}
else {
    Write-Host "✅ All sensors completed successfully!" -ForegroundColor Green
    exit 0
}
