# Auto-generated execution script for nclist-cli-utility
# Created: 2025-10-26
# Phases: 7

$ErrorActionPreference = "Stop"
$key = "nclist-cli-utility"
$totalPhases = 7

Write-Host "🚀 Starting auto-execution: $key" -ForegroundColor Cyan
Write-Host "📋 Total phases: $totalPhases" -ForegroundColor Gray
Write-Host ""

for ($phase = 1; $phase -le $totalPhases; $phase++) {
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Host "📍 Phase $phase/$totalPhases" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Host ""
    
    # Display phase name
    $phaseName = switch ($phase) {
        1 { "Core CLI Framework" }
        2 { "List Operations" }
        3 { "Filtering & Search" }
        4 { "Git Integration" }
        5 { "Output Formatters" }
        6 { "Caching System" }
        7 { "Testing & Documentation" }
    }
    
    Write-Host "📦 $phaseName" -ForegroundColor Cyan
    Write-Host ""
    
    # Execute phase via task.prompt.md
    Write-Host "Invoking: @workspace /task key:$key phase:$phase" -ForegroundColor Gray
    
    # User break (10 seconds to interrupt)
    Write-Host ""
    Write-Host "⏸️  10-second pause - Press Ctrl+C to stop or add modifications" -ForegroundColor Cyan
    for ($i = 10; $i -gt 0; $i--) {
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
