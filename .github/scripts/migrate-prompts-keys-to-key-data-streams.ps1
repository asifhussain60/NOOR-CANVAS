# migrate-prompts-keys-to-key-data-streams.ps1
# Migrates .github/prompts.keys/ → .github/key-data-streams/
# Preserves git history via git mv

[CmdletBinding()]
param(
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  Key Data Streams Migration Script" -ForegroundColor Cyan
Write-Host "  prompts.keys → key-data-streams" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Paths
$sourcePath = ".github/prompts.keys"
$targetPath = ".github/key-data-streams"

# Step 1: Verify source exists
Write-Host "[1/7] Verifying source directory..." -ForegroundColor Yellow
if (-not (Test-Path $sourcePath)) {
    Write-Host "✗ Source directory not found: $sourcePath" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Source directory exists" -ForegroundColor Green

# Step 2: Verify target doesn't exist
Write-Host "[2/7] Checking target directory..." -ForegroundColor Yellow
if (Test-Path $targetPath) {
    Write-Host "✗ Target directory already exists: $targetPath" -ForegroundColor Red
    Write-Host "  Migration may have already been performed." -ForegroundColor Red
    exit 1
}
Write-Host "✓ Target directory available" -ForegroundColor Green

# Step 3: Count key folders
Write-Host "[3/7] Counting key folders..." -ForegroundColor Yellow
$keyFolders = Get-ChildItem -Path $sourcePath -Directory
$keyCount = $keyFolders.Count
Write-Host "✓ Found $keyCount key folders to migrate" -ForegroundColor Green

# Step 4: Create checkpoint
Write-Host "[4/7] Creating pre-migration checkpoint..." -ForegroundColor Yellow
if (-not $DryRun) {
    git add -A
    git commit -m "ckpt(auto-drift-detection): pre-migration checkpoint before folder reorganization" -ErrorAction SilentlyContinue
    $checkpoint = (git rev-parse --short HEAD).Trim()
    Write-Host "✓ Checkpoint created: $checkpoint" -ForegroundColor Green
} else {
    Write-Host "⊘ Dry run - skipping checkpoint" -ForegroundColor Gray
}

# Step 5: Migrate folder with git mv
Write-Host "[5/7] Migrating folder (preserving git history)..." -ForegroundColor Yellow
if (-not $DryRun) {
    git mv $sourcePath $targetPath
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Git mv failed" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Folder migrated successfully" -ForegroundColor Green
} else {
    Write-Host "⊘ Dry run - would execute: git mv $sourcePath $targetPath" -ForegroundColor Gray
}

# Step 6: Verify migration
Write-Host "[6/7] Verifying migration..." -ForegroundColor Yellow
if (-not $DryRun) {
    if (-not (Test-Path $targetPath)) {
        Write-Host "✗ Migration verification failed - target not found" -ForegroundColor Red
        exit 1
    }
    
    $migratedFolders = Get-ChildItem -Path $targetPath -Directory
    if ($migratedFolders.Count -ne $keyCount) {
        Write-Host "✗ Migration verification failed - folder count mismatch" -ForegroundColor Red
        Write-Host "  Expected: $keyCount, Found: $($migratedFolders.Count)" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✓ Migration verified ($($migratedFolders.Count) folders)" -ForegroundColor Green
} else {
    Write-Host "⊘ Dry run - skipping verification" -ForegroundColor Gray
}

# Step 7: Generate migration report
Write-Host "[7/7] Generating migration report..." -ForegroundColor Yellow
$reportPath = ".github/key-data-streams/MIGRATION-REPORT-$(Get-Date -Format 'yyyyMMdd-HHmm').md"
if (-not $DryRun) {
    $reportContent = @"
# Key Data Streams Migration Report

**Date**: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
**Operation**: Move .github/prompts.keys/ → .github/key-data-streams/
**Method**: git mv (history preserved)

## Summary

- **Total Keys Migrated**: $keyCount
- **Source Path**: $sourcePath
- **Target Path**: $targetPath
- **Checkpoint Commit**: $checkpoint

## Migrated Keys

$($migratedFolders | ForEach-Object { "- $($_.Name)" } | Out-String)

## Next Steps

1. Update path references in 17 files (8 prompts + 6 shared + 2 archive + 1 index)
2. Commit migration: ``git commit -m "refactor: Move prompts.keys → key-data-streams"``
3. Update and rename index file: prompts.keys → key-data-streams/index.md
4. Run validation: ``@workspace /cohesion scope=prompts``

## Rollback

If migration needs to be reverted:
``````powershell
git mv .github/key-data-streams .github/prompts.keys
git commit -m "revert: Restore prompts.keys folder structure"
``````
"@
    
    Set-Content -Path $reportPath -Value $reportContent
    Write-Host "✓ Migration report saved: $reportPath" -ForegroundColor Green
} else {
    Write-Host "⊘ Dry run - skipping report generation" -ForegroundColor Gray
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
if ($DryRun) {
    Write-Host "  DRY RUN COMPLETE - No changes made" -ForegroundColor Yellow
} else {
    Write-Host "  MIGRATION COMPLETE" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Next: Update path references in 17 files" -ForegroundColor Cyan
    Write-Host "  Run: .github/scripts/update-path-references.ps1" -ForegroundColor Cyan
}
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
