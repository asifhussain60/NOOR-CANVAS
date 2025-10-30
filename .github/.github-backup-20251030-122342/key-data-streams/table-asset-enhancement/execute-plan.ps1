# execute-plan.ps1 - table-asset-enhancement
# Auto-generated execution script for phased implementation
# Run from project root: .github/key-data-streams/table-asset-enhancement/execute-plan.ps1

param(
    [int]$StartPhase = 1,
    [int]$EndPhase = 6,
    [switch]$DryRun,
    [switch]$SkipTests
)

$ErrorActionPreference = "Stop"
$keyName = "table-asset-enhancement"
$keyPath = ".github/key-data-streams/$keyName"
$projectRoot = "D:\PROJECTS\NOOR CANVAS"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  table-asset-enhancement Execution" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Load plan tracking
$trackingPath = Join-Path $keyPath "$keyName.plan.json"
if (!(Test-Path $trackingPath)) {
    Write-Error "Tracking file not found: $trackingPath"
    exit 1
}

$tracking = Get-Content $trackingPath | ConvertFrom-Json
Write-Host "Plan Version: $($tracking.version)" -ForegroundColor Green
Write-Host "Status: $($tracking.status)" -ForegroundColor Yellow
Write-Host "Total Phases: $($tracking.phases.Count)" -ForegroundColor Green
Write-Host ""

# Phase execution function
function Execute-Phase {
    param(
        [int]$PhaseNumber,
        [object]$Phase
    )
    
    Write-Host "========================================" -ForegroundColor Magenta
    Write-Host "  Phase $PhaseNumber: $($Phase.name)" -ForegroundColor Magenta
    Write-Host "========================================" -ForegroundColor Magenta
    
    if ($Phase.conditional -and $Phase.condition) {
        Write-Host "⚠️  CONDITIONAL PHASE: $($Phase.condition)" -ForegroundColor Yellow
        $proceed = Read-Host "Execute this phase? (y/n)"
        if ($proceed -ne 'y') {
            Write-Host "⏭️  Skipping conditional phase" -ForegroundColor Yellow
            return
        }
    }
    
    Write-Host ""
    Write-Host "Tasks:" -ForegroundColor Cyan
    foreach ($task in $Phase.tasks) {
        Write-Host "  [$($task.id)] $($task.description)" -ForegroundColor White
    }
    Write-Host ""
    
    if ($DryRun) {
        Write-Host "🔍 DRY RUN: Would execute phase $PhaseNumber" -ForegroundColor Yellow
        return
    }
    
    # Phase-specific execution
    switch ($PhaseNumber) {
        1 {
            Write-Host "📋 Phase 1: Database Verification & CSS Selector Analysis" -ForegroundColor Green
            Write-Host ""
            Write-Host "Manual Steps Required:" -ForegroundColor Yellow
            Write-Host "1. Connect to KSESSIONS_DEV database" -ForegroundColor White
            Write-Host "2. Run query: SELECT * FROM canvas.AssetLookup WHERE AssetIdentifier = 'table'" -ForegroundColor White
            Write-Host "3. Analyze sample transcripts for table HTML patterns" -ForegroundColor White
            Write-Host "4. Document findings in work-log.md" -ForegroundColor White
            Write-Host ""
            $completed = Read-Host "Mark Phase 1 as complete? (y/n)"
            if ($completed -eq 'y') {
                Update-PhaseStatus -PhaseId 1 -Status "completed"
            }
        }
        
        2 {
            Write-Host "📋 Phase 2: CSS Selector Update (Conditional)" -ForegroundColor Green
            Write-Host ""
            Write-Host "⚠️  This phase is conditional - only execute if Phase 1 revealed selector mismatch" -ForegroundColor Yellow
            Write-Host ""
            $needsUpdate = Read-Host "Does CSS selector need updating? (y/n)"
            if ($needsUpdate -ne 'y') {
                Write-Host "⏭️  Skipping selector update - current selector is compatible" -ForegroundColor Yellow
                Update-PhaseStatus -PhaseId 2 -Status "skipped"
                return
            }
            
            Write-Host "Manual Steps Required:" -ForegroundColor Yellow
            Write-Host "1. Choose optimal selector (e.g., 'table' or 'table[style*=\""width\""]')" -ForegroundColor White
            Write-Host "2. Execute UPDATE: UPDATE canvas.AssetLookup SET CssSelector = '{new-selector}' WHERE AssetIdentifier = 'table'" -ForegroundColor White
            Write-Host "3. Verify selector matches sample transcripts" -ForegroundColor White
            Write-Host "4. Document selector change in work-log.md" -ForegroundColor White
            Write-Host ""
            $completed = Read-Host "Mark Phase 2 as complete? (y/n)"
            if ($completed -eq 'y') {
                Update-PhaseStatus -PhaseId 2 -Status "completed"
            }
        }
        
        3 {
            Write-Host "📋 Phase 3: Asset Processing Verification" -ForegroundColor Green
            Write-Host ""
            Write-Host "Manual Steps Required:" -ForegroundColor Yellow
            Write-Host "1. Review AssetProcessingService.cs code" -ForegroundColor White
            Write-Host "2. Test API: GET https://localhost:9091/api/host/asset-lookup" -ForegroundColor White
            Write-Host "3. Manual test: Load HostControlPanel and verify share buttons appear for tables" -ForegroundColor White
            Write-Host "4. Capture screenshot of share buttons" -ForegroundColor White
            Write-Host ""
            $completed = Read-Host "Mark Phase 3 as complete? (y/n)"
            if ($completed -eq 'y') {
                Update-PhaseStatus -PhaseId 3 -Status "completed"
            }
        }
        
        4 {
            Write-Host "📋 Phase 4: Broadcasting & Reception E2E Test" -ForegroundColor Green
            Write-Host ""
            Write-Host "Manual Steps Required:" -ForegroundColor Yellow
            Write-Host "1. Open HostControlPanel in tab 1" -ForegroundColor White
            Write-Host "2. Open SessionCanvas in tab 2 (as participant)" -ForegroundColor White
            Write-Host "3. Click table share button in tab 1" -ForegroundColor White
            Write-Host "4. Verify table appears in tab 2 SessionCanvas" -ForegroundColor White
            Write-Host "5. Inspect SignalR payload in Network tab" -ForegroundColor White
            Write-Host "6. Capture before/after screenshots" -ForegroundColor White
            Write-Host ""
            $completed = Read-Host "Mark Phase 4 as complete? (y/n)"
            if ($completed -eq 'y') {
                Update-PhaseStatus -PhaseId 4 -Status "completed"
            }
        }
        
        5 {
            Write-Host "📋 Phase 5: Playwright Automated Test" -ForegroundColor Green
            Write-Host ""
            Write-Host "Tasks:" -ForegroundColor Yellow
            Write-Host "1. Create PlayWright/Tests/table-asset-share-e2e.spec.ts" -ForegroundColor White
            Write-Host "2. Implement test with assertions" -ForegroundColor White
            Write-Host "3. Run test locally: npx playwright test table-asset-share-e2e.spec.ts --headed" -ForegroundColor White
            Write-Host ""
            
            if (!$SkipTests) {
                Write-Host "Would you like to run the Playwright test now? (y/n)" -ForegroundColor Cyan
                $runTest = Read-Host
                if ($runTest -eq 'y') {
                    Push-Location "$projectRoot\PlayWright"
                    try {
                        npx playwright test table-asset-share-e2e.spec.ts --headed
                    } finally {
                        Pop-Location
                    }
                }
            }
            
            $completed = Read-Host "Mark Phase 5 as complete? (y/n)"
            if ($completed -eq 'y') {
                Update-PhaseStatus -PhaseId 5 -Status "completed"
            }
        }
        
        6 {
            Write-Host "📋 Phase 6: Documentation & Cleanup" -ForegroundColor Green
            Write-Host ""
            Write-Host "Tasks:" -ForegroundColor Yellow
            Write-Host "1. Update Workspaces/Documentation/KSESSIONS-HUB.MD (add table verification note)" -ForegroundColor White
            Write-Host "2. Complete work-log.md with all phase records" -ForegroundColor White
            Write-Host "3. Create VERIFICATION-REPORT.md" -ForegroundColor White
            Write-Host "4. Update .github/key-data-streams/index.md" -ForegroundColor White
            Write-Host ""
            $completed = Read-Host "Mark Phase 6 as complete? (y/n)"
            if ($completed -eq 'y') {
                Update-PhaseStatus -PhaseId 6 -Status "completed"
            }
        }
    }
    
    Write-Host ""
}

function Update-PhaseStatus {
    param(
        [int]$PhaseId,
        [string]$Status
    )
    
    $tracking = Get-Content $trackingPath | ConvertFrom-Json
    $phase = $tracking.phases | Where-Object { $_.id -eq $PhaseId }
    
    if ($phase) {
        $phase.status = $Status
        if ($Status -eq "completed") {
            $phase.completedAt = (Get-Date).ToString("o")
        } elseif ($Status -eq "in-progress") {
            $phase.startedAt = (Get-Date).ToString("o")
        }
        
        $tracking | ConvertTo-Json -Depth 10 | Set-Content $trackingPath
        Write-Host "✅ Phase $PhaseId marked as $Status" -ForegroundColor Green
    }
}

# Main execution loop
for ($i = $StartPhase; $i -le $EndPhase; $i++) {
    $phase = $tracking.phases | Where-Object { $_.id -eq $i }
    
    if (!$phase) {
        Write-Warning "Phase $i not found in tracking"
        continue
    }
    
    if ($phase.status -eq "completed") {
        Write-Host "⏭️  Phase $i already completed, skipping..." -ForegroundColor Gray
        continue
    }
    
    Execute-Phase -PhaseNumber $i -Phase $phase
    
    Write-Host ""
    Write-Host "Continue to next phase? (y/n/q to quit)" -ForegroundColor Cyan
    $continue = Read-Host
    if ($continue -eq 'q') {
        Write-Host "Execution stopped by user" -ForegroundColor Yellow
        break
    } elseif ($continue -ne 'y') {
        Write-Host "Pausing execution - run script again with -StartPhase $($i + 1) to continue" -ForegroundColor Yellow
        break
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Execution Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
$tracking = Get-Content $trackingPath | ConvertFrom-Json
$completedCount = ($tracking.phases | Where-Object { $_.status -eq "completed" }).Count
$totalCount = $tracking.phases.Count
Write-Host "Completed: $completedCount / $totalCount phases" -ForegroundColor Green
Write-Host ""

if ($completedCount -eq $totalCount) {
    Write-Host "🎉 All phases complete!" -ForegroundColor Green
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Review VERIFICATION-REPORT.md" -ForegroundColor White
    Write-Host "  2. Run @workspace /healthcheck for validation" -ForegroundColor White
    Write-Host "  3. Commit changes to development branch" -ForegroundColor White
}
