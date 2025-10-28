# migrate-legacy-keys.ps1
# Migrate all legacy key data files to .github/key-data-streams/

param(
    [switch]$DryRun = $false
)

$ErrorActionPreference = "Stop"
$workspaceRoot = "d:\PROJECTS\NOOR CANVAS"
$targetBase = ".github\key-data-streams"

Write-Host "=== LEGACY KEY DATA MIGRATION ===" -ForegroundColor Cyan
Write-Host "Mode: $(if ($DryRun) { 'DRY RUN (no changes)' } else { 'EXECUTE' })" -ForegroundColor $(if ($DryRun) { 'Yellow' } else { 'Green' })
Write-Host ""

# Track migration stats
$stats = @{
    Moved = 0
    Skipped = 0
    Errors = 0
}

# Function to extract key name from filename
function Get-KeyFromFilename {
    param([string]$Filename)
    
    if ($Filename -match '^(.+)\.plan\.md$') {
        return $matches[1]
    }
    elseif ($Filename -match '^(.+)\.md$') {
        return $matches[1]
    }
    return $null
}

# Function to migrate a file
function Migrate-File {
    param(
        [string]$SourcePath,
        [string]$Key,
        [string]$Reason
    )
    
    $targetDir = Join-Path $workspaceRoot (Join-Path $targetBase $Key)
    $targetFile = Join-Path $targetDir (Split-Path $SourcePath -Leaf)
    
    Write-Host "[$Reason]" -ForegroundColor Magenta
    Write-Host "  Source: $SourcePath" -ForegroundColor Gray
    Write-Host "  Target: $targetFile" -ForegroundColor Gray
    
    # Check if target already exists
    if (Test-Path $targetFile) {
        Write-Host "  Status: SKIPPED (target exists)" -ForegroundColor Yellow
        $stats.Skipped++
        Write-Host ""
        return
    }
    
    if (-not $DryRun) {
        try {
            # Create target directory if needed
            if (-not (Test-Path $targetDir)) {
                New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
                Write-Host "  Created directory: $targetDir" -ForegroundColor Green
            }
            
            # Move file
            Move-Item -Path $SourcePath -Destination $targetFile -Force
            Write-Host "  Status: MOVED" -ForegroundColor Green
            $stats.Moved++
        }
        catch {
            Write-Host "  Status: ERROR - $_" -ForegroundColor Red
            $stats.Errors++
        }
    }
    else {
        Write-Host "  Status: WOULD MOVE (dry run)" -ForegroundColor Yellow
        $stats.Moved++
    }
    
    Write-Host ""
}

# 1. Migrate legacy plan files from Workspaces/Copilot/_DOCS/configs
Write-Host "1. Migrating from Workspaces/Copilot/_DOCS/configs..." -ForegroundColor Cyan
$configPlans = Get-ChildItem (Join-Path $workspaceRoot "Workspaces\Copilot\_DOCS\configs\*.plan.md") -ErrorAction SilentlyContinue
foreach ($file in $configPlans) {
    $key = Get-KeyFromFilename $file.Name
    if ($key) {
        Migrate-File -SourcePath $file.FullName -Key $key -Reason "Legacy Config Plan"
    }
}

# 2. Migrate legacy plan files from Workspaces/Copilot/_DOCS/summaries
Write-Host "2. Migrating from Workspaces/Copilot/_DOCS/summaries..." -ForegroundColor Cyan
$summaryPlans = Get-ChildItem (Join-Path $workspaceRoot "Workspaces\Copilot\_DOCS\summaries\*.plan.md") -ErrorAction SilentlyContinue
foreach ($file in $summaryPlans) {
    $key = Get-KeyFromFilename $file.Name
    if ($key) {
        Migrate-File -SourcePath $file.FullName -Key $key -Reason "Legacy Summary Plan"
    }
}

# 3. Migrate key data stream files from Workspaces/Copilot/KeyDataStreams
Write-Host "3. Migrating from Workspaces/Copilot/KeyDataStreams..." -ForegroundColor Cyan
$keyDataFiles = Get-ChildItem (Join-Path $workspaceRoot "Workspaces\Copilot\KeyDataStreams\*.md") -ErrorAction SilentlyContinue
foreach ($file in $keyDataFiles) {
    $key = Get-KeyFromFilename $file.Name
    if ($key) {
        # Rename to work-log.md if it's a general key file (not a plan)
        $targetFilename = if ($file.Name -notmatch '\.plan\.md$') { "work-log.md" } else { $file.Name }
        $targetDir = Join-Path $workspaceRoot (Join-Path $targetBase $key)
        $targetFile = Join-Path $targetDir $targetFilename
        
        Write-Host "[Legacy KeyDataStream]" -ForegroundColor Magenta
        Write-Host "  Source: $($file.FullName)" -ForegroundColor Gray
        Write-Host "  Target: $targetFile" -ForegroundColor Gray
        
        if (Test-Path $targetFile) {
            Write-Host "  Status: SKIPPED (target exists)" -ForegroundColor Yellow
            $stats.Skipped++
            Write-Host ""
            continue
        }
        
        if (-not $DryRun) {
            try {
                if (-not (Test-Path $targetDir)) {
                    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
                    Write-Host "  Created directory: $targetDir" -ForegroundColor Green
                }
                
                Move-Item -Path $file.FullName -Destination $targetFile -Force
                Write-Host "  Status: MOVED" -ForegroundColor Green
                $stats.Moved++
            }
            catch {
                Write-Host "  Status: ERROR - $_" -ForegroundColor Red
                $stats.Errors++
            }
        }
        else {
            Write-Host "  Status: WOULD MOVE (dry run)" -ForegroundColor Yellow
            $stats.Moved++
        }
        
        Write-Host ""
    }
}

# Summary
Write-Host "=== MIGRATION SUMMARY ===" -ForegroundColor Cyan
Write-Host "Moved: $($stats.Moved)" -ForegroundColor Green
Write-Host "Skipped: $($stats.Skipped)" -ForegroundColor Yellow
Write-Host "Errors: $($stats.Errors)" -ForegroundColor $(if ($stats.Errors -gt 0) { 'Red' } else { 'Green' })

if ($DryRun) {
    Write-Host "`nRun without -DryRun to execute migration" -ForegroundColor Yellow
}
