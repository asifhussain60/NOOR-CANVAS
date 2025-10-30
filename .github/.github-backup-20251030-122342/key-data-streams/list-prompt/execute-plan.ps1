#Requires -Version 7.0
<#
.SYNOPSIS
    Auto-execution orchestration script for list-prompt implementation.

.DESCRIPTION
    Executes all 5 phases of the list-prompt plan with automatic phase-to-phase
    chaining, 10-second user break points, and comprehensive error handling.

.PARAMETER SkipPause
    Skip 10-second pause between phases (for CI/CD environments).

.PARAMETER StartPhase
    Start execution from specific phase (1-5).

.PARAMETER EndPhase
    End execution at specific phase (1-5).

.EXAMPLE
    .\execute-plan.ps1
    # Execute all phases with 10-second pauses

.EXAMPLE
    .\execute-plan.ps1 -SkipPause
    # Execute all phases without pauses (CI/CD mode)

.EXAMPLE
    .\execute-plan.ps1 -StartPhase 3 -EndPhase 5
    # Execute only phases 3, 4, and 5

.NOTES
    Created by: plan.prompt.md (Auto-Execution Handoff Protocol)
    Key: list-prompt
    Total Phases: 5
    Auto-Chain: Enabled
#>

[CmdletBinding()]
param(
    [switch]$SkipPause,
    [ValidateRange(1, 5)]
    [int]$StartPhase = 1,
    [ValidateRange(1, 5)]
    [int]$EndPhase = 5
)

$ErrorActionPreference = "Stop"
$key = "list-prompt"
$totalPhases = 5

# Phase definitions
$phases = @(
    @{
        Number = 1
        Name = "Core List Infrastructure"
        Description = "Parameter parsing, natural sort, base handlers"
    },
    @{
        Number = 2
        Name = "Enhanced Search & Filtering"
        Description = "Fuzzy matching, match quality scoring"
    },
    @{
        Number = 3
        Name = "Git Integration & Key-Specific Queries"
        Description = "ShowGitCommits, ParseCommitMessage, FormatCommitTable"
    },
    @{
        Number = 4
        Name = "Workspace Intelligence & Output Formats"
        Description = "Workspace stats, caching system (5min TTL)"
    },
    @{
        Number = 5
        Name = "Testing & Documentation"
        Description = "Success criteria, test specifications"
    }
)

# Validate phase range
if ($StartPhase -gt $EndPhase) {
    Write-Error "StartPhase ($StartPhase) cannot be greater than EndPhase ($EndPhase)"
    exit 1
}

# Header
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Auto-Execution: list-prompt                                 ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Total phases: $totalPhases" -ForegroundColor Gray
Write-Host "🎯 Executing phases: $StartPhase - $EndPhase" -ForegroundColor Gray
Write-Host "⚙️  Auto-chain: Enabled" -ForegroundColor Gray
Write-Host "⏸️  Pause mode: $(if ($SkipPause) { 'Disabled' } else { '10 seconds' })" -ForegroundColor Gray
Write-Host ""

# Execution loop
for ($phase = $StartPhase; $phase -le $EndPhase; $phase++) {
    $phaseInfo = $phases[$phase - 1]
    
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Host "📍 Phase ${phase}/${totalPhases}: $($phaseInfo.Name)" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "Description: $($phaseInfo.Description)" -ForegroundColor Gray
    Write-Host ""
    
    # User break point (10 seconds to interrupt)
    if (-not $SkipPause) {
        Write-Host "⏸️  10-second pause - Press Ctrl+C to stop or add modifications" -ForegroundColor Cyan
        for ($i = 10; $i -gt 0; $i--) {
            Write-Host "   $i..." -NoNewline -ForegroundColor DarkGray
            Start-Sleep -Seconds 1
        }
        Write-Host " ✓" -ForegroundColor Green
        Write-Host ""
    }
    
    # Execute phase via task.prompt.md with auto-chain
    Write-Host "🚀 Invoking: @workspace /task key:${key} phase:${phase} auto-chain:true" -ForegroundColor Cyan
    Write-Host ""
    
    # NOTE: This script is a template for manual execution demonstration
    # In actual auto-execution, the agent would self-invoke via:
    # SELF_INVOKE: @workspace /task key:list-prompt phase:$phase auto-chain:true
    
    # For manual execution, output command for user
    Write-Host "╭─────────────────────────────────────────────────────────────╮" -ForegroundColor DarkGray
    Write-Host "│ Manual Execution Command:                                   │" -ForegroundColor White
    Write-Host "│ @workspace /task key:${key} phase:${phase} auto-chain:true      │" -ForegroundColor Yellow
    Write-Host "╰─────────────────────────────────────────────────────────────╯" -ForegroundColor DarkGray
    Write-Host ""
    
    # In auto-execution mode, agent would continue automatically
    # For manual mode, wait for user confirmation
    if ($phase -lt $EndPhase) {
        Write-Host "Press ENTER when phase ${phase} completes (or Ctrl+C to abort)..." -ForegroundColor Cyan
        Read-Host
        Write-Host ""
    }
}

# Completion
Write-Host ""
Write-Host "✅ All phases complete! (${StartPhase} - ${EndPhase})" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  @workspace /task key:${key} tasks='mark complete'" -ForegroundColor White
Write-Host ""
Write-Host "Or verify implementation:" -ForegroundColor Cyan
Write-Host "  Get-Content .github\prompts\list.prompt.md" -ForegroundColor White
Write-Host ""
