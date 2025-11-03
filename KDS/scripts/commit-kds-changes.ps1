# KDS Smart Commit Handler
# Purpose: Intelligently commit KDS changes and achieve zero uncommitted files
# Usage: .\commit-kds-changes.ps1 [-Message "commit message"] [-DryRun]

param(
    [string]$Message,
    [switch]$DryRun,
    [switch]$Interactive = $true
)

$ErrorActionPreference = 'Stop'

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🧠 KDS Smart Commit Handler" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Get workspace root
$workspaceRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
Push-Location $workspaceRoot

try {
    # Step 1: Analyze uncommitted files
    Write-Host "Step 1: Analyzing uncommitted files..." -ForegroundColor Yellow
    $gitStatus = git status --short
    
    if (-not $gitStatus) {
        Write-Host "  ✅ No uncommitted files found!" -ForegroundColor Green
        Write-Host ""
        exit 0
    }
    
    # Parse git status
    $modifiedFiles = @()
    $untrackedFiles = @()
    $stagedFiles = @()
    
    foreach ($line in $gitStatus) {
        $status = $line.Substring(0, 2)
        $file = $line.Substring(3).Trim()
        
        if ($status -match '^M ') { $stagedFiles += $file }
        elseif ($status -match '^ M') { $modifiedFiles += $file }
        elseif ($status -match '^\?\?') { $untrackedFiles += $file }
    }
    
    Write-Host "  Modified files: $($modifiedFiles.Count)" -ForegroundColor Gray
    Write-Host "  Untracked files: $($untrackedFiles.Count)" -ForegroundColor Gray
    Write-Host "  Already staged: $($stagedFiles.Count)" -ForegroundColor Gray
    Write-Host ""
    
    # Step 2: Categorize files for intelligent handling
    Write-Host "Step 2: Categorizing files..." -ForegroundColor Yellow
    
    # KDS BRAIN files (auto-generated, should be in .gitignore)
    $brainFiles = @(
        'KDS/kds-brain/conversation-context.jsonl',
        'KDS/kds-brain/conversation-history.jsonl',
        'KDS/kds-brain/development-context.yaml'
    )
    
    # KDS internal prompts (auto-updated by system)
    $internalPrompts = $modifiedFiles + $untrackedFiles | Where-Object { $_ -match 'KDS/prompts/internal/' }
    
    # KDS user prompts (user-edited, should be committed)
    $userPrompts = $modifiedFiles + $untrackedFiles | Where-Object { $_ -match 'KDS/prompts/user/' }
    
    # KDS documentation and knowledge
    $kdsDocumentation = $untrackedFiles | Where-Object { 
        $_ -match 'KDS/docs/' -or 
        $_ -match 'KDS/knowledge/' -or 
        $_ -match 'KDS/reports/' -or
        $_ -match 'KDS/tests/reports/'
    }
    
    # Temporary/generated files that should be ignored
    $tempFiles = $untrackedFiles | Where-Object {
        $_ -match 'TEMP/' -or
        $_ -match '\.tmp$' -or
        $_ -match '\.backup$' -or
        $_ -match 'playwright-artifacts/' -or
        $_ -match 'test-results/'
    }
    
    # Step 3: Update .gitignore if needed
    Write-Host "Step 3: Updating .gitignore..." -ForegroundColor Yellow
    
    $gitignorePath = Join-Path $workspaceRoot ".gitignore"
    $gitignoreContent = Get-Content $gitignorePath -Raw
    $gitignoreUpdated = $false
    $gitignoreAdditions = @()
    
    # Add KDS BRAIN files to gitignore (auto-generated state files)
    if ($brainFiles | Where-Object { $_ -in $modifiedFiles -or $_ -in $untrackedFiles }) {
        $patterns = @(
            'KDS/kds-brain/conversation-context.jsonl',
            'KDS/kds-brain/conversation-history.jsonl',
            'KDS/kds-brain/development-context.yaml'
        )
        
        foreach ($pattern in $patterns) {
            if ($gitignoreContent -notmatch [regex]::Escape($pattern)) {
                $gitignoreAdditions += $pattern
                $gitignoreUpdated = $true
            }
        }
    }
    
    # Add KDS internal prompts to gitignore (auto-updated by system)
    if ($internalPrompts.Count -gt 0) {
        $pattern = 'KDS/prompts/internal/*.md'
        if ($gitignoreContent -notmatch [regex]::Escape($pattern)) {
            $gitignoreAdditions += $pattern
            $gitignoreUpdated = $true
        }
    }
    
    # Add KDS reports to gitignore (auto-generated)
    if ($untrackedFiles | Where-Object { $_ -match 'KDS/reports/monitoring/' -or $_ -match 'KDS/reports/self-review/' }) {
        $patterns = @('KDS/reports/monitoring/', 'KDS/reports/self-review/')
        foreach ($pattern in $patterns) {
            if ($gitignoreContent -notmatch [regex]::Escape($pattern)) {
                $gitignoreAdditions += $pattern
                $gitignoreUpdated = $true
            }
        }
    }
    
    # Add KDS test reports to gitignore (auto-generated)
    if ($untrackedFiles | Where-Object { $_ -match 'KDS/tests/reports/.*-test-report-.*\.md' }) {
        $pattern = 'KDS/tests/reports/*-test-report-*.md'
        if ($gitignoreContent -notmatch [regex]::Escape($pattern.Replace('*', '\*'))) {
            $gitignoreAdditions += $pattern
            $gitignoreUpdated = $true
        }
    }
    
    # Add PlayWright KDS artifacts
    if ($untrackedFiles | Where-Object { $_ -match 'PlayWright/KDS/' }) {
        $pattern = 'PlayWright/KDS/'
        if ($gitignoreContent -notmatch [regex]::Escape($pattern)) {
            $gitignoreAdditions += $pattern
            $gitignoreUpdated = $true
        }
    }
    
    if ($gitignoreUpdated) {
        Write-Host "  Adding to .gitignore:" -ForegroundColor Cyan
        foreach ($addition in $gitignoreAdditions) {
            Write-Host "    + $addition" -ForegroundColor Gray
        }
        
        if (-not $DryRun) {
            # Add KDS section to gitignore
            $kdsSection = @"

# ═══════════════════════════════════════════════════════════════
# KDS (Knowledge Development System) - Auto-generated files
# Updated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
# ═══════════════════════════════════════════════════════════════

# KDS BRAIN state files (auto-generated during conversations)
KDS/kds-brain/conversation-context.jsonl
KDS/kds-brain/conversation-history.jsonl
KDS/kds-brain/development-context.yaml

# KDS internal prompts (auto-updated by system)
KDS/prompts/internal/*.md

# KDS reports (auto-generated)
KDS/reports/monitoring/
KDS/reports/self-review/
KDS/tests/reports/*-test-report-*.md

# KDS test artifacts
PlayWright/KDS/
KDS/tests/screenshots/*.png
!KDS/tests/screenshots/README.md

# KDS temporary files
KDS/tests/*.mjs
KDS/tests/dashboard-refresh.spec.*
"@
            
            # Check if KDS section already exists
            if ($gitignoreContent -notmatch 'KDS \(Knowledge Development System\)') {
                Add-Content -Path $gitignorePath -Value $kdsSection
                Write-Host "  ✅ .gitignore updated with KDS patterns" -ForegroundColor Green
            } else {
                Write-Host "  ℹ️  KDS section already exists in .gitignore" -ForegroundColor Gray
            }
        }
    } else {
        Write-Host "  ✅ .gitignore is up to date" -ForegroundColor Green
    }
    Write-Host ""
    
    # Step 4: Reset files that should be ignored
    Write-Host "Step 4: Resetting auto-generated files..." -ForegroundColor Yellow
    
    $filesToReset = @()
    $filesToReset += $brainFiles | Where-Object { $_ -in $modifiedFiles }
    $filesToReset += $internalPrompts | Where-Object { $_ -in $modifiedFiles }
    
    if ($filesToReset.Count -gt 0) {
        Write-Host "  Resetting:" -ForegroundColor Cyan
        foreach ($file in $filesToReset) {
            Write-Host "    - $file" -ForegroundColor Gray
            if (-not $DryRun) {
                git checkout -- $file 2>$null
            }
        }
        Write-Host "  ✅ Reset $($filesToReset.Count) auto-generated files" -ForegroundColor Green
    } else {
        Write-Host "  ✅ No files to reset" -ForegroundColor Green
    }
    Write-Host ""
    
    # Step 5: Determine files to commit
    Write-Host "Step 5: Preparing commit..." -ForegroundColor Yellow
    
    $filesToCommit = @()
    
    # Add user prompts
    $filesToCommit += $userPrompts
    
    # Add KDS documentation (if user wants it)
    if ($kdsDocumentation.Count -gt 0 -and $Interactive) {
        Write-Host "  Found KDS documentation files:" -ForegroundColor Cyan
        foreach ($file in $kdsDocumentation) {
            Write-Host "    • $file" -ForegroundColor Gray
        }
        $response = Read-Host "  Include KDS documentation? (Y/n)"
        if ($response -ne 'n') {
            $filesToCommit += $kdsDocumentation
        }
    } elseif ($kdsDocumentation.Count -gt 0) {
        # Non-interactive: include all documentation
        $filesToCommit += $kdsDocumentation
    }
    
    # Add other modified files (excluding auto-generated)
    $otherModified = $modifiedFiles | Where-Object { 
        $_ -notin $brainFiles -and 
        $_ -notin $internalPrompts -and
        $_ -notmatch 'KDS/prompts/internal/'
    }
    $filesToCommit += $otherModified
    
    # Add .gitignore if updated
    if ($gitignoreUpdated) {
        $filesToCommit += '.gitignore'
    }
    
    # Remove duplicates
    $filesToCommit = $filesToCommit | Select-Object -Unique
    
    if ($filesToCommit.Count -eq 0) {
        Write-Host "  ℹ️  No files to commit after filtering" -ForegroundColor Yellow
        Write-Host ""
        exit 0
    }
    
    Write-Host "  Files to commit: $($filesToCommit.Count)" -ForegroundColor Cyan
    foreach ($file in $filesToCommit) {
        Write-Host "    + $file" -ForegroundColor Gray
    }
    Write-Host ""
    
    # Step 6: Stage and commit
    if (-not $DryRun) {
        Write-Host "Step 6: Staging files..." -ForegroundColor Yellow
        foreach ($file in $filesToCommit) {
            git add $file
        }
        Write-Host "  ✅ Files staged" -ForegroundColor Green
        Write-Host ""
        
        # Get commit message
        if (-not $Message) {
            if ($Interactive) {
                Write-Host "Enter commit message (or press Enter for auto-generated):" -ForegroundColor Cyan
                $Message = Read-Host
            }
            
            if (-not $Message) {
                # Auto-generate commit message
                $Message = "chore(kds): Update KDS system files`n`n"
                $Message += "Updated files:`n"
                foreach ($file in $filesToCommit) {
                    $Message += "- $file`n"
                }
            }
        }
        
        Write-Host "Step 7: Committing..." -ForegroundColor Yellow
        git commit -m $Message
        Write-Host "  ✅ Changes committed" -ForegroundColor Green
        Write-Host ""
        
        # Check final status
        $finalStatus = git status --short
        if (-not $finalStatus) {
            Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
            Write-Host "  ✅ SUCCESS: Zero uncommitted files!" -ForegroundColor Green
            Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
        } else {
            Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Yellow
            Write-Host "  ⚠️  Remaining uncommitted files:" -ForegroundColor Yellow
            Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Yellow
            Write-Host ""
            git status --short
        }
    } else {
        Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
        Write-Host "  DRY RUN - No changes made" -ForegroundColor Cyan
        Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
    }
    
} finally {
    Pop-Location
}
