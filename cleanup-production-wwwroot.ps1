##
## NOOR Canvas Production wwwroot Cleanup Script
## Removes test files and documentation from production deployment
##

param(
    [string]$TargetPath = "D:\Websites\NOOR-CANVAS\wwwroot",
    [switch]$DryRun,
    [switch]$Force
)

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "NOOR Canvas wwwroot Production Cleanup" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $TargetPath)) {
    Write-Host "❌ ERROR: Target path not found: $TargetPath" -ForegroundColor Red
    exit 1
}

Write-Host "Target: $TargetPath" -ForegroundColor White
Write-Host "Mode: $(if ($DryRun) { 'DRY RUN (no changes)' } else { 'EXECUTE (will delete files)' })" -ForegroundColor $(if ($DryRun) { 'Yellow' } else { 'Red' })
Write-Host ""

# Define files and folders to remove
$filesToRemove = @(
    "FONT-SYSTEM-SUMMARY.md",
    "session-transcript-redirect.html",
    "session-transcript-styling.html", 
    "session-transcript-viewer.html",
    "test-css.html",
    "test-fonts.html",
    "test-harness-demo.html",
    "test-issue-106.html"
)

$foldersToRemove = @(
    "testing"
)

# Scan for files matching patterns
$testPatternFiles = Get-ChildItem -Path $TargetPath -File -Recurse | Where-Object {
    $_.Name -like "test-*" -or 
    $_.Extension -eq ".md" -or
    ($_.Name -like "session-transcript-*" -and $_.Extension -eq ".html")
}

Write-Host "Cleanup Summary:" -ForegroundColor Yellow
Write-Host "=================" -ForegroundColor Yellow
Write-Host ""

# Files in root
$rootFilesFound = @()
foreach ($file in $filesToRemove) {
    $fullPath = Join-Path $TargetPath $file
    if (Test-Path $fullPath) {
        $rootFilesFound += $fullPath
        $item = Get-Item $fullPath
        $sizeKB = [math]::Round($item.Length/1024, 2)
        $sizeText = "$sizeKB" + " KB"
        Write-Host "  📄 $file ($sizeText)" -ForegroundColor White
    }
}

# Folders
Write-Host ""
$foldersFound = @()
foreach ($folder in $foldersToRemove) {
    $fullPath = Join-Path $TargetPath $folder
    if (Test-Path $fullPath) {
        $foldersFound += $fullPath
        $folderSize = (Get-ChildItem -Path $fullPath -Recurse -File | Measure-Object -Property Length -Sum).Sum
        $sizeKB = [math]::Round($folderSize/1024, 2)
        $sizeText = "$sizeKB" + " KB"
        Write-Host "  📁 $folder\ ($sizeText)" -ForegroundColor White
        
        # List files in folder
        Get-ChildItem -Path $fullPath -Recurse -File | ForEach-Object {
            Write-Host "     - $($_.Name)" -ForegroundColor DarkGray
        }
    }
}

Write-Host ""
Write-Host "Total items to remove:" -ForegroundColor Yellow
Write-Host "  Files: $($rootFilesFound.Count)" -ForegroundColor White
Write-Host "  Folders: $($foldersFound.Count)" -ForegroundColor White

if ($rootFilesFound.Count -eq 0 -and $foldersFound.Count -eq 0) {
    Write-Host ""
    Write-Host "✅ No cleanup needed - production wwwroot is already clean" -ForegroundColor Green
    exit 0
}

Write-Host ""

if ($DryRun) {
    Write-Host "🔍 DRY RUN MODE - No files will be deleted" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Run without -DryRun to execute cleanup:" -ForegroundColor White
    Write-Host "  .\cleanup-production-wwwroot.ps1" -ForegroundColor Cyan
    Write-Host "  .\cleanup-production-wwwroot.ps1 -Force  # Skip confirmation" -ForegroundColor Cyan
    exit 0
}

# Confirmation prompt (unless -Force)
if (-not $Force) {
    Write-Host "⚠️  WARNING: This will permanently delete the files and folders listed above" -ForegroundColor Red
    Write-Host ""
    $confirmation = Read-Host "Continue with cleanup? (yes/no)"
    
    if ($confirmation -ne "yes") {
        Write-Host ""
        Write-Host "Cleanup cancelled" -ForegroundColor Yellow
        exit 0
    }
}

Write-Host ""
Write-Host "Executing cleanup..." -ForegroundColor Green
Write-Host ""

$deletedCount = 0
$errorCount = 0

# Delete files
foreach ($filePath in $rootFilesFound) {
    try {
        Remove-Item -Path $filePath -Force -ErrorAction Stop
        Write-Host "  ✅ Deleted: $(Split-Path $filePath -Leaf)" -ForegroundColor Green
        $deletedCount++
    }
    catch {
        Write-Host "  ❌ Failed: $(Split-Path $filePath -Leaf) - $($_.Exception.Message)" -ForegroundColor Red
        $errorCount++
    }
}

# Delete folders
foreach ($folderPath in $foldersFound) {
    try {
        Remove-Item -Path $folderPath -Recurse -Force -ErrorAction Stop
        Write-Host "  ✅ Deleted folder: $(Split-Path $folderPath -Leaf)\" -ForegroundColor Green
        $deletedCount++
    }
    catch {
        Write-Host "  ❌ Failed: $(Split-Path $folderPath -Leaf)\ - $($_.Exception.Message)" -ForegroundColor Red
        $errorCount++
    }
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Cleanup Complete" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Deleted: $deletedCount items" -ForegroundColor Green
if ($errorCount -gt 0) {
    Write-Host "  Errors: $errorCount items" -ForegroundColor Red
}
Write-Host ""

if ($errorCount -eq 0) {
    Write-Host "✅ Production wwwroot cleanup successful" -ForegroundColor Green
} else {
    Write-Host "⚠️  Cleanup completed with errors - review above" -ForegroundColor Yellow
}

Write-Host ""
