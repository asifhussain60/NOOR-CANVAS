# Rollback to Checkpoint Commit
# 
# Purpose: Automatically rollback to the most recent checkpoint commit for a given key and agent.
# Usage: .\Workspaces\Global\rollback.ps1 -Key <key-name> -Agent <agent-name>
#
# This script provides safe rollback capability when validation fails or execution encounters
# unrecoverable errors. It locates the most recent checkpoint commit and resets the working
# tree to that state.

param(
    [Parameter(Mandatory=$true)]
    [string]$Key,
    
    [Parameter(Mandatory=$false)]
    [string]$Agent = "task",
    
    [Parameter(Mandatory=$false)]
    [switch]$DryRun,
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose
)

# Set error action preference
$ErrorActionPreference = "Stop"

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $color = switch ($Level) {
        "ERROR" { "Red" }
        "WARNING" { "Yellow" }
        "SUCCESS" { "Green" }
        default { "White" }
    }
    
    Write-Host "[$timestamp] [$Level] $Message" -ForegroundColor $color
}

function Get-CheckpointCommit {
    param([string]$Key, [string]$Agent)
    
    # Construct checkpoint message pattern
    $checkpointMessage = "checkpoint: pre-$Agent $Key"
    
    if ($Verbose) {
        Write-Log "Searching for checkpoint: $checkpointMessage" "INFO"
    }
    
    # Find most recent checkpoint commit
    $commitHash = git log --all --grep="$checkpointMessage" --format="%H" -n 1 2>$null
    
    if ($LASTEXITCODE -ne 0) {
        Write-Log "Git log command failed. Ensure you are in a git repository." "ERROR"
        return $null
    }
    
    return $commitHash
}

function Get-CommitDetails {
    param([string]$CommitHash)
    
    if (-not $CommitHash) {
        return $null
    }
    
    $details = @{}
    
    # Get commit message
    $details.Message = git log --format=%B -n 1 $CommitHash 2>$null
    
    # Get commit author
    $details.Author = git log --format=%an -n 1 $CommitHash 2>$null
    
    # Get commit date
    $details.Date = git log --format=%ai -n 1 $CommitHash 2>$null
    
    # Get short hash
    $details.ShortHash = $CommitHash.Substring(0, 8)
    
    return $details
}

function Show-WorkingTreeStatus {
    Write-Log "Current working tree status:" "INFO"
    git status --short
}

function Confirm-Rollback {
    param([string]$CommitHash, [hashtable]$Details)
    
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "                    ROLLBACK CONFIRMATION" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Checkpoint Found:" -ForegroundColor Yellow
    Write-Host "    Hash:    $($Details.ShortHash) ($CommitHash)" -ForegroundColor White
    Write-Host "    Message: $($Details.Message)" -ForegroundColor White
    Write-Host "    Author:  $($Details.Author)" -ForegroundColor White
    Write-Host "    Date:    $($Details.Date)" -ForegroundColor White
    Write-Host ""
    Write-Host "  WARNING: This will reset your working tree to the checkpoint state." -ForegroundColor Red
    Write-Host "  All uncommitted changes will be LOST." -ForegroundColor Red
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    
    $response = Read-Host "Proceed with rollback? (yes/no)"
    return ($response -eq "yes")
}

function Invoke-Rollback {
    param([string]$CommitHash)
    
    Write-Log "Executing rollback to $CommitHash..." "INFO"
    
    # Reset to checkpoint commit
    git reset --hard $CommitHash 2>&1 | Out-Null
    
    if ($LASTEXITCODE -ne 0) {
        Write-Log "Git reset failed. Please check repository state manually." "ERROR"
        return $false
    }
    
    Write-Log "Rollback complete. Working tree restored to checkpoint state." "SUCCESS"
    return $true
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "              AUTOMATED CHECKPOINT ROLLBACK" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Key:   $Key" -ForegroundColor White
Write-Host "  Agent: $Agent" -ForegroundColor White
Write-Host ""

try {
    # Verify we're in a git repository
    $gitRoot = git rev-parse --show-toplevel 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Log "Not a git repository. Cannot perform rollback." "ERROR"
        exit 1
    }
    
    if ($Verbose) {
        Write-Log "Git repository root: $gitRoot" "INFO"
    }
    
    # Show current working tree status
    if ($Verbose) {
        Show-WorkingTreeStatus
        Write-Host ""
    }
    
    # Find checkpoint commit
    Write-Log "Searching for checkpoint commit..." "INFO"
    $commitHash = Get-CheckpointCommit -Key $Key -Agent $Agent
    
    if (-not $commitHash) {
        Write-Log "No checkpoint found for: checkpoint: pre-$Agent $Key" "ERROR"
        Write-Log "Cannot rollback without a checkpoint commit." "ERROR"
        Write-Host ""
        Write-Host "Available checkpoints for key '$Key':" -ForegroundColor Yellow
        git log --all --grep="checkpoint:.*$Key" --oneline -n 5
        exit 1
    }
    
    # Get commit details
    $commitDetails = Get-CommitDetails -CommitHash $commitHash
    
    if ($DryRun) {
        Write-Log "DRY RUN MODE - No changes will be made" "WARNING"
        Write-Host ""
        Write-Host "Would rollback to:" -ForegroundColor Yellow
        Write-Host "  Hash:    $($commitDetails.ShortHash)" -ForegroundColor White
        Write-Host "  Message: $($commitDetails.Message)" -ForegroundColor White
        Write-Host "  Date:    $($commitDetails.Date)" -ForegroundColor White
        Write-Host ""
        exit 0
    }
    
    # Confirm rollback with user
    $confirmed = Confirm-Rollback -CommitHash $commitHash -Details $commitDetails
    
    if (-not $confirmed) {
        Write-Log "Rollback cancelled by user." "WARNING"
        exit 0
    }
    
    # Perform rollback
    $success = Invoke-Rollback -CommitHash $commitHash
    
    if ($success) {
        Write-Host ""
        Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
        Write-Host "                  ROLLBACK SUCCESSFUL" -ForegroundColor Green
        Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
        Write-Host ""
        Write-Host "Working tree has been restored to checkpoint state." -ForegroundColor Green
        Write-Host "Checkpoint: $($commitDetails.ShortHash) - $($commitDetails.Message)" -ForegroundColor White
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "  1. Review the failure that triggered this rollback" -ForegroundColor White
        Write-Host "  2. Update the approach or fix the root cause" -ForegroundColor White
        Write-Host "  3. Do NOT retry without addressing the failure" -ForegroundColor White
        Write-Host ""
        exit 0
    } else {
        Write-Log "Rollback failed. Please check repository state manually." "ERROR"
        exit 1
    }
    
} catch {
    Write-Log "Unexpected error during rollback: $_" "ERROR"
    Write-Log "Stack trace: $($_.ScriptStackTrace)" "ERROR"
    exit 1
}
