# NOOR Canvas Comprehensive Healthcheck with DocFX Implementation Refresh
# Validates workspace state and updates documentation to reflect current progress
# Author: GitHub Copilot | Date: September 15, 2025

param(
    [switch]$RefreshDocFX,
    [switch]$Verbose,
    [switch]$UpdateImplementationDocs,
    [string]$LogPath = ".\healthcheck-with-docfx.log"
)

Write-Host "🏥 NOOR Canvas Comprehensive Healthcheck" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

function Write-HealthLog {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    
    if ($Verbose) { Write-Host $logEntry -ForegroundColor Gray }
    Add-Content -Path $LogPath -Value $logEntry
}

# Test 1: Workspace Structure Validation
Write-Host "`n🔍 Validating workspace structure..." -ForegroundColor Yellow
Write-HealthLog "Starting workspace structure validation" "INFO"

$workspaceRoot = "D:\PROJECTS\NOOR CANVAS"
$requiredPaths = @{
    "SPA/NoorCanvas" = "Main application directory"
    "Workspaces/IMPLEMENTATION-TRACKER.MD" = "Implementation tracking document"
    "DocFX/articles/implementation" = "DocFX implementation documentation"
    "Tests" = "Test directory"
    "Tools/HostProvisioner" = "Host provisioner tool"
}

$structureOK = $true
foreach ($path in $requiredPaths.Keys) {
    $fullPath = Join-Path $workspaceRoot $path
    if (Test-Path $fullPath) {
        Write-Host "  ✅ $path" -ForegroundColor Green
        Write-HealthLog "Found required path: $path" "INFO"
    } else {
        Write-Host "  ❌ $path - MISSING" -ForegroundColor Red
        Write-HealthLog "Missing required path: $path" "ERROR"
        $structureOK = $false
    }
}

# Test 2: Codebase Component Validation
Write-Host "`n🏗️ Validating codebase components..." -ForegroundColor Yellow

$componentCounts = @{}

# Controllers
$controllersPath = Join-Path $workspaceRoot "SPA\NoorCanvas\Controllers"
if (Test-Path $controllersPath) {
    $controllers = Get-ChildItem $controllersPath -Filter "*.cs"
    $componentCounts["Controllers"] = $controllers.Count
    Write-Host "  📁 Controllers: $($controllers.Count) (Expected: 8)" -ForegroundColor $(if($controllers.Count -eq 8) {"Green"} else {"Yellow"})
    Write-HealthLog "Controllers found: $($controllers.Count)" "INFO"
} else {
    Write-Host "  ❌ Controllers directory not found" -ForegroundColor Red
    $componentCounts["Controllers"] = 0
}

# SignalR Hubs
$hubsPath = Join-Path $workspaceRoot "SPA\NoorCanvas\Hubs"
if (Test-Path $hubsPath) {
    $hubs = Get-ChildItem $hubsPath -Filter "*.cs"
    $componentCounts["Hubs"] = $hubs.Count
    Write-Host "  📡 SignalR Hubs: $($hubs.Count) (Expected: 3)" -ForegroundColor $(if($hubs.Count -eq 3) {"Green"} else {"Yellow"})
    Write-HealthLog "SignalR Hubs found: $($hubs.Count)" "INFO"
} else {
    Write-Host "  ❌ Hubs directory not found" -ForegroundColor Red
    $componentCounts["Hubs"] = 0
}

# Models
$modelsPath = Join-Path $workspaceRoot "SPA\NoorCanvas\Models"
if (Test-Path $modelsPath) {
    $models = Get-ChildItem $modelsPath -Filter "*.cs"
    $componentCounts["Models"] = $models.Count
    Write-Host "  📊 Models: $($models.Count) (Expected: 13+)" -ForegroundColor $(if($models.Count -ge 13) {"Green"} else {"Yellow"})
    Write-HealthLog "Models found: $($models.Count)" "INFO"
} else {
    Write-Host "  ❌ Models directory not found" -ForegroundColor Red
    $componentCounts["Models"] = 0
}

# Test 3: Global Commands Validation
Write-Host "`n⚙️ Testing global commands..." -ForegroundColor Yellow

$globalCommands = @("nc", "nct", "ncdoc")
$commandResults = @{}

foreach ($cmd in $globalCommands) {
    try {
        $helpOutput = & $cmd -Help 2>&1
        if ($LASTEXITCODE -eq 0 -or $helpOutput -match "help|usage|command") {
            Write-Host "  ✅ $cmd - Working" -ForegroundColor Green
            $commandResults[$cmd] = "Working"
            Write-HealthLog "Global command $cmd is functional" "INFO"
        } else {
            Write-Host "  ⚠️ $cmd - Issues detected" -ForegroundColor Yellow
            $commandResults[$cmd] = "Issues"
            Write-HealthLog "Global command $cmd has issues" "WARN"
        }
    } catch {
        Write-Host "  ❌ $cmd - Failed" -ForegroundColor Red
        $commandResults[$cmd] = "Failed"
        Write-HealthLog "Global command $cmd failed: $($_.Exception.Message)" "ERROR"
    }
}

# Test 4: DocFX Implementation Documentation Status
Write-Host "`n📚 Checking DocFX implementation documentation..." -ForegroundColor Yellow

$docfxImplPath = Join-Path $workspaceRoot "DocFX\articles\implementation"
$implementationDocs = @{
    "project-status-overview.md" = "Project status and progress overview"
    "phase4-current-progress.md" = "Current Phase 4 progress details"
    "issues-todo-tracking.md" = "Issues and TODO tracking"
}

$docStatus = @{}
foreach ($doc in $implementationDocs.Keys) {
    $docPath = Join-Path $docfxImplPath $doc
    if (Test-Path $docPath) {
        $lastWrite = (Get-Item $docPath).LastWriteTime
        $daysSince = (Get-Date) - $lastWrite
        
        if ($daysSince.Days -eq 0) {
            Write-Host "  ✅ $doc - Updated today" -ForegroundColor Green
            $docStatus[$doc] = "Current"
        } elseif ($daysSince.Days -le 2) {
            Write-Host "  🟡 $doc - Updated $($daysSince.Days) days ago" -ForegroundColor Yellow  
            $docStatus[$doc] = "Recent"
        } else {
            Write-Host "  🔄 $doc - Updated $($daysSince.Days) days ago (may need refresh)" -ForegroundColor Cyan
            $docStatus[$doc] = "Needs Update"
        }
        Write-HealthLog "Documentation file $doc status: $($docStatus[$doc])" "INFO"
    } else {
        Write-Host "  ❌ $doc - Missing" -ForegroundColor Red
        $docStatus[$doc] = "Missing"
        Write-HealthLog "Documentation file $doc is missing" "ERROR"
    }
}

# Test 5: Implementation Progress Validation
Write-Host "`n📈 Validating implementation progress..." -ForegroundColor Yellow

$implTrackerPath = Join-Path $workspaceRoot "Workspaces\IMPLEMENTATION-TRACKER.MD"
if (Test-Path $implTrackerPath) {
    $trackerContent = Get-Content $implTrackerPath -Raw
    
    # Check for key progress indicators
    $progressIndicators = @{
        "Backend.*95%" = "Backend completion status"
        "Frontend.*70%" = "Frontend completion status"
        "Phase 4" = "Current phase information"
        "Issue-53" = "Critical issue tracking"
        "TODO-1.*COMPLETED" = "Recent TODO completions"
    }
    
    foreach ($pattern in $progressIndicators.Keys) {
        if ($trackerContent -match $pattern) {
            Write-Host "  ✅ $($progressIndicators[$pattern]) - Found" -ForegroundColor Green
            Write-HealthLog "Found progress indicator: $($progressIndicators[$pattern])" "INFO"
        } else {
            Write-Host "  ⚠️ $($progressIndicators[$pattern]) - Not found or outdated" -ForegroundColor Yellow
            Write-HealthLog "Missing or outdated progress indicator: $($progressIndicators[$pattern])" "WARN"
        }
    }
} else {
    Write-Host "  ❌ IMPLEMENTATION-TRACKER.MD not found" -ForegroundColor Red
    Write-HealthLog "IMPLEMENTATION-TRACKER.MD file missing" "ERROR"
}

# Test 6: DocFX Server Status
Write-Host "`n🌐 Checking DocFX server status..." -ForegroundColor Yellow

try {
    $docfxResponse = Invoke-WebRequest -Uri "http://localhost:8050" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    Write-Host "  ✅ DocFX server responding (Status: $($docfxResponse.StatusCode))" -ForegroundColor Green
    Write-HealthLog "DocFX server is responsive" "INFO"
} catch {
    Write-Host "  🔄 DocFX server not running - use 'ncdoc' to start" -ForegroundColor Cyan
    Write-HealthLog "DocFX server not accessible: $($_.Exception.Message)" "WARN"
}

# Optional: Refresh DocFX Implementation Documentation
if ($RefreshDocFX -or $UpdateImplementationDocs) {
    Write-Host "`n🔄 Refreshing DocFX implementation documentation..." -ForegroundColor Yellow
    Write-HealthLog "Starting DocFX documentation refresh" "INFO"
    
    try {
        # Start DocFX server if not running
        if ($commandResults["ncdoc"] -eq "Working") {
            Write-Host "  🚀 Starting DocFX server..." -ForegroundColor Cyan
            & ncdoc -Force
            Start-Sleep -Seconds 3
            Write-Host "  ✅ DocFX server restarted with latest documentation" -ForegroundColor Green
            Write-HealthLog "DocFX server restarted successfully" "INFO"
        } else {
            Write-Host "  ⚠️ ncdoc command not working - manual DocFX restart needed" -ForegroundColor Yellow
            Write-HealthLog "ncdoc command not functional for auto-restart" "WARN"
        }
    } catch {
        Write-Host "  ❌ Failed to restart DocFX: $($_.Exception.Message)" -ForegroundColor Red
        Write-HealthLog "DocFX restart failed: $($_.Exception.Message)" "ERROR"
    }
}

# Summary Report
Write-Host "`n📊 Health Check Summary" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan

$overallHealth = "HEALTHY"
$issues = @()

# Workspace structure
if (-not $structureOK) {
    $overallHealth = "NEEDS ATTENTION"
    $issues += "Workspace structure incomplete"
}

# Component counts
if ($componentCounts["Controllers"] -ne 8) {
    $issues += "Controller count mismatch (Expected: 8, Found: $($componentCounts['Controllers']))"
}
if ($componentCounts["Hubs"] -ne 3) {
    $issues += "SignalR Hub count mismatch (Expected: 3, Found: $($componentCounts['Hubs']))"
}

# Global commands
$failedCommands = $commandResults.Keys | Where-Object { $commandResults[$_] -eq "Failed" }
if ($failedCommands.Count -gt 0) {
    $overallHealth = "NEEDS ATTENTION"
    $issues += "Failed global commands: $($failedCommands -join ', ')"
}

# Documentation status
$outdatedDocs = $docStatus.Keys | Where-Object { $docStatus[$_] -in @("Needs Update", "Missing") }
if ($outdatedDocs.Count -gt 0) {
    if ($overallHealth -eq "HEALTHY") { $overallHealth = "DOCUMENTATION LAG" }
    $issues += "Outdated documentation: $($outdatedDocs -join ', ')"
}

# Final status
$statusColor = switch ($overallHealth) {
    "HEALTHY" { "Green" }
    "DOCUMENTATION LAG" { "Yellow" }
    "NEEDS ATTENTION" { "Red" }
    default { "Gray" }
}

Write-Host "`n🏥 Overall Health: " -NoNewline
Write-Host $overallHealth -ForegroundColor $statusColor

if ($issues.Count -gt 0) {
    Write-Host "`n⚠️ Issues to Address:" -ForegroundColor Yellow
    foreach ($issue in $issues) {
        Write-Host "  • $issue" -ForegroundColor Yellow
    }
}

Write-Host "`n📝 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Address any failed global commands" -ForegroundColor White
Write-Host "  2. Update outdated documentation if needed" -ForegroundColor White  
Write-Host "  3. Verify DocFX implementation section at http://localhost:8050" -ForegroundColor White
Write-Host "  4. Review IMPLEMENTATION-TRACKER.MD for accuracy" -ForegroundColor White

Write-HealthLog "Health check completed with status: $overallHealth" "INFO"
Write-Host "`n📋 Detailed log saved to: $LogPath" -ForegroundColor Gray
