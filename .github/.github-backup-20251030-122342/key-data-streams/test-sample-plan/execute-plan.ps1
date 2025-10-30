# Auto-generated execution script for test-sample-plan
# Created: 2025-10-25
# Phases: 4

$ErrorActionPreference = "Stop"
$key = "test-sample-plan"
$totalPhases = 4

Write-Host "🚀 Starting auto-execution: $key" -ForegroundColor Cyan
Write-Host "📋 Total phases: $totalPhases" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  VALIDATION TEST - This demonstrates the new auto-execution workflow" -ForegroundColor Yellow
Write-Host ""

for ($phase = 1; $phase -le $totalPhases; $phase++) {
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Host "📍 Phase $phase/$totalPhases" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Host ""
    
    # Display phase name
    $phaseName = switch ($phase) {
        1 { "Create Simple Test Component" }
        2 { "Add Backend API Endpoint" }
        3 { "Connect Frontend to Backend" }
        4 { "Visual Regression Testing" }
    }
    Write-Host "Phase: $phaseName" -ForegroundColor White
    Write-Host ""
    
    # Execute phase via task.prompt.md
    Write-Host "Invoking: @workspace /task key:$key phase:$phase auto-chain:true" -ForegroundColor Gray
    Write-Host ""
    
    # User break (10 seconds to interrupt)
    Write-Host "⏸️  10-second pause - Press Ctrl+C to stop or add modifications" -ForegroundColor Cyan
    for ($i = 10; $i -gt 0; $i--) {
        Write-Host "   $i..." -NoNewline
        Start-Sleep -Seconds 1
    }
    Write-Host " ✓" -ForegroundColor Green
    Write-Host ""
    
    # Note: Actual @workspace invocation happens manually
    # This script demonstrates the workflow
    Write-Host "To execute this phase, run:" -ForegroundColor Yellow
    Write-Host "  @workspace /task key:$key phase:$phase auto-chain:true" -ForegroundColor White
    Write-Host ""
    
    $response = Read-Host "Press ENTER when phase $phase completes (or type 'skip' to continue demo, 'stop' to exit)"
    
    if ($response -eq "stop") {
        Write-Host ""
        Write-Host "⏹️  Execution stopped by user" -ForegroundColor Yellow
        exit 0
    }
    
    if ($response -ne "skip") {
        Write-Host ""
        Write-Host "ℹ️  In production, task.prompt.md would auto-chain to next phase" -ForegroundColor Cyan
        Write-Host ""
    }
}

Write-Host ""
Write-Host "✅ All phases complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  @workspace /task key:$key tasks='mark complete'" -ForegroundColor White
Write-Host ""
Write-Host "This completes the v2.0 auto-execution workflow demonstration!" -ForegroundColor Green
