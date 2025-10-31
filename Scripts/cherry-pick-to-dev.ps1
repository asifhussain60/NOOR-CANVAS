<#
.SYNOPSIS
    Cherry-pick commits from feature branch to development branch
    
.DESCRIPTION
    Automates the process of cherry-picking commits from current feature branch
    to the development branch. Supports individual commits, commit ranges, or
    pattern-based selection (e.g., all kds-related commits).
    
.PARAMETER Commits
    Array of commit hashes to cherry-pick
    
.PARAMETER Pattern
    Grep pattern to find commits (e.g., "kds", "fix", "feat")
    
.PARAMETER Since
    Cherry-pick all commits since this commit hash
    
.PARAMETER Count
    Number of recent commits to cherry-pick (default: 1)
    
.PARAMETER DryRun
    Show what would be cherry-picked without making changes
    
.PARAMETER Auto
    Run automatically without prompting for confirmations (auto-stash, auto-skip conflicts)
    
.EXAMPLE
    .\cherry-pick-to-dev.ps1 -Commits @("abc123", "def456")
    Cherry-pick specific commits
    
.EXAMPLE
    .\cherry-pick-to-dev.ps1 -Pattern "kds" -Count 5
    Cherry-pick last 5 commits matching "kds"
    
.EXAMPLE
    .\cherry-pick-to-dev.ps1 -Since abc123
    Cherry-pick all commits after abc123
    
.EXAMPLE
    .\cherry-pick-to-dev.ps1 -DryRun -Pattern "kds"
    Preview KDS commits without applying
    
.EXAMPLE
    .\cherry-pick-to-dev.ps1 -Pattern "kds" -Count 10 -Auto
    Automatically cherry-pick last 10 KDS commits without prompts
#>

param(
    [Parameter(ParameterSetName="Direct")]
    [string[]]$Commits,
    
    [Parameter(ParameterSetName="Pattern")]
    [string]$Pattern,
    
    [Parameter(ParameterSetName="Range")]
    [string]$Since,
    
    [Parameter(ParameterSetName="Pattern")]
    [int]$Count = 1,
    
    [switch]$DryRun,
    
    [switch]$Auto
)

# Configuration
$TargetBranch = "development"
$ErrorActionPreference = "Stop"

function Write-Info($message) {
    Write-Host "ℹ️  $message" -ForegroundColor Cyan
}

function Write-Success($message) {
    Write-Host "✅ $message" -ForegroundColor Green
}

function Write-Error-Custom($message) {
    Write-Host "❌ $message" -ForegroundColor Red
}

function Write-Warning-Custom($message) {
    Write-Host "⚠️  $message" -ForegroundColor Yellow
}

try {
    # Verify we're in a git repository
    $gitRoot = git rev-parse --show-toplevel 2>$null
    if (-not $gitRoot) {
        throw "Not in a git repository"
    }
    
    Write-Info "Git repository: $gitRoot"
    
    # Get current branch
    $currentBranch = git branch --show-current
    Write-Info "Current branch: $currentBranch"
    
    # Check for uncommitted changes
    $status = git status --porcelain
    if ($status) {
        Write-Warning-Custom "Uncommitted changes detected:"
        Write-Host $status
        if (-not $Auto) {
            $response = Read-Host "Stash changes and continue? (y/N)"
            if ($response -ne 'y') {
                throw "Aborted by user"
            }
        }
        else {
            Write-Info "Auto mode: Stashing changes automatically"
        }
        git stash push -m "Auto-stash before cherry-pick to $TargetBranch"
        Write-Success "Changes stashed"
    }
    
    # Determine commits to cherry-pick
    $commitsToPickle = @()
    
    if ($Commits) {
        $commitsToPickle = $Commits
        Write-Info "Using provided commits: $($Commits -join ', ')"
    }
    elseif ($Pattern) {
        Write-Info "Finding commits matching pattern: $Pattern"
        $foundCommits = git log --oneline --grep="$Pattern" -$Count --format="%H"
        $commitsToPickle = $foundCommits -split "`n" | Where-Object { $_ }
        Write-Info "Found $($commitsToPickle.Count) commits"
    }
    elseif ($Since) {
        Write-Info "Finding commits since: $Since"
        $foundCommits = git log --oneline "$Since..HEAD" --format="%H"
        $commitsToPickle = $foundCommits -split "`n" | Where-Object { $_ }
        Write-Info "Found $($commitsToPickle.Count) commits"
    }
    else {
        # Default: last commit
        $commitsToPickle = @(git log -1 --format="%H")
        Write-Info "Using last commit (default)"
    }
    
    if ($commitsToPickle.Count -eq 0) {
        throw "No commits found to cherry-pick"
    }
    
    # Show commits with details
    Write-Info "`nCommits to cherry-pick:"
    Write-Host "----------------------------------------"
    foreach ($commit in $commitsToPickle) {
        $commitInfo = git log -1 --format="%h %s" $commit
        Write-Host "  $commitInfo"
    }
    Write-Host "----------------------------------------`n"
    
    # Dry run mode - stop here
    if ($DryRun) {
        Write-Warning-Custom "DRY RUN MODE - No changes made"
        Write-Info "Command that would be executed:"
        Write-Host "  git checkout $TargetBranch"
        Write-Host "  git cherry-pick $($commitsToPickle -join ' ')"
        Write-Host "  git checkout $currentBranch"
        exit 0
    }
    
    # Confirm with user
    if (-not $Auto) {
        $response = Read-Host "`nCherry-pick these commits to $TargetBranch? (y/N)"
        if ($response -ne 'y') {
            throw "Aborted by user"
        }
    }
    else {
        Write-Info "Auto mode: Proceeding with cherry-pick automatically"
    }
    
    # Switch to target branch
    Write-Info "Switching to $TargetBranch..."
    git checkout $TargetBranch
    
    # Pull latest changes
    Write-Info "Pulling latest changes..."
    git pull origin $TargetBranch
    
    # Cherry-pick commits (in reverse order to maintain chronology)
    [array]::Reverse($commitsToPickle)
    
    $successCount = 0
    $failedCommits = @()
    
    foreach ($commit in $commitsToPickle) {
        $commitMsg = git log -1 --format="%s" $commit
        Write-Info "Cherry-picking: $commit - $commitMsg"
        
        try {
            git cherry-pick $commit
            $successCount++
            Write-Success "  ✓ Success"
        }
        catch {
            Write-Error-Custom "  ✗ Failed - Conflict detected"
            $failedCommits += $commit
            
            if (-not $Auto) {
                Write-Warning-Custom "Conflict in cherry-pick. Options:"
                Write-Host "  1. Resolve conflicts manually, then: git cherry-pick --continue"
                Write-Host "  2. Skip this commit: git cherry-pick --skip"
                Write-Host "  3. Abort cherry-pick: git cherry-pick --abort"
                
                $response = Read-Host "Abort remaining cherry-picks? (y/N)"
                if ($response -eq 'y') {
                    git cherry-pick --abort
                    break
                }
            }
            else {
                Write-Warning-Custom "Auto mode: Skipping conflicted commit"
                git cherry-pick --skip
            }
        }
    }
    
    # Summary
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "Cherry-pick Summary" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Success "Successfully cherry-picked: $successCount commits"
    
    if ($failedCommits.Count -gt 0) {
        Write-Error-Custom "Failed commits: $($failedCommits.Count)"
        foreach ($failed in $failedCommits) {
            $failedMsg = git log -1 --format="%h %s" $failed
            Write-Host "  $failedMsg"
        }
    }
    
    # Check if we're still on target branch (might be in conflict state)
    $currentBranchAfter = git branch --show-current
    if ($currentBranchAfter -eq $TargetBranch) {
        Write-Info "`nSwitching back to original branch: $currentBranch"
        git checkout $currentBranch
    }
    
    # Restore stash if needed
    $stashList = git stash list
    if ($stashList -match "Auto-stash before cherry-pick") {
        Write-Info "Restoring stashed changes..."
        git stash pop
        Write-Success "Stash restored"
    }
    
    Write-Success "`nCherry-pick operation completed!"
    Write-Info "Don't forget to push $TargetBranch when ready:"
    Write-Host "  git checkout $TargetBranch"
    Write-Host "  git push origin $TargetBranch"
    
}
catch {
    Write-Error-Custom "`nError: $_"
    Write-Info "Attempting to restore original state..."
    
    # Try to get back to original branch
    try {
        git checkout $currentBranch 2>$null
    }
    catch {
        Write-Warning-Custom "Could not switch back to $currentBranch"
    }
    
    exit 1
}
