# Auto-generated execution script for cleanup-procedure-universal-token-reset
# Created: 2025-10-26
# Phases: 2

$ErrorActionPreference = "Stop"
$key = "cleanup-procedure-universal-token-reset"
$totalPhases = 2

Write-Host "🚀 Starting auto-execution: $key" -ForegroundColor Cyan
Write-Host "📋 Total phases: $totalPhases" -ForegroundColor Gray
Write-Host ""

FOR ($phase = 1; $phase -le $totalPhases; $phase++) {
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Host "📍 Phase $phase/$totalPhases" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Host ""
    
    # Execute phase via task.prompt.md
    Write-Host "Invoking: @workspace /task key:$key phase:$phase" -ForegroundColor Gray
    
    # User break (10 seconds to interrupt)
    Write-Host ""
    Write-Host "⏸️  10-second pause - Press Ctrl+C to stop or add modifications" -ForegroundColor Cyan
    FOR ($i = 10; $i -gt 0; $i--) {
        Write-Host "   $i..." -NoNewline
        Start-Sleep -Seconds 1
    }
    Write-Host " ✓" -ForegroundColor Green
    Write-Host ""
    
    # Note: Actual @workspace invocation happens manually
    # Agent outputs command for user to execute
    Write-Host "Execute this command:" -ForegroundColor Yellow
    Write-Host "  @workspace /task key:$key phase:$phase auto-chain:true" -ForegroundColor White
    Write-Host ""
    
    Read-Host "Press ENTER when phase $phase completes (or Ctrl+C to abort)"
}

Write-Host ""
Write-Host "✅ All phases complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  @workspace /task key:$key tasks='mark complete'" -ForegroundColor White
