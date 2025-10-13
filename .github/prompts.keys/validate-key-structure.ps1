<#
.SYNOPSIS
    Validates the structure of key folders in the prompts.keys directory.

.DESCRIPTION
    This script checks all key folders to ensure:
    - Required key.json file exists
    - File count follows complexity guidelines
    - Folder naming conventions are followed
    - No orphaned files exist in the root prompts.keys directory

.PARAMETER KeysPath
    Path to the prompts.keys directory. Defaults to current script location.

.PARAMETER StrictMode
    Enable strict validation (warnings become errors).

.EXAMPLE
    .\validate-key-structure.ps1
    
.EXAMPLE
    .\validate-key-structure.ps1 -StrictMode
#>

param(
    [string]$KeysPath = $PSScriptRoot,
    [switch]$StrictMode
)

# Initialize counters
$totalKeys = 0
$validKeys = 0
$warningCount = 0
$errorCount = 0

# Define complexity file count limits
$complexityLimits = @{
    'simple' = @{ Min = 1; Max = 1; Recommended = @('key.json') }
    'standard' = @{ Min = 1; Max = 3; Recommended = @('key.json', 'notes.md') }
    'complex' = @{ Min = 3; Max = 10; Recommended = @('key.json', 'notes.md', 'plan.md', 'analysis.md') }
    'epic' = @{ Min = 10; Max = [int]::MaxValue; Recommended = @('key.json', 'notes.md', 'plan.md', 'analysis.md') }
}

Write-Host "=== Key Data Stream Structure Validation ===" -ForegroundColor Cyan
Write-Host "Keys Path: $KeysPath" -ForegroundColor Gray
Write-Host "Strict Mode: $StrictMode" -ForegroundColor Gray
Write-Host ""

# Get all directories in prompts.keys
$keyFolders = Get-ChildItem -Path $KeysPath -Directory | Where-Object { 
    $_.Name -ne 'node_modules' -and $_.Name -ne '.git' 
}

if ($keyFolders.Count -eq 0) {
    Write-Host "No key folders found in $KeysPath" -ForegroundColor Red
    exit 1
}

Write-Host "Found $($keyFolders.Count) key folders to validate" -ForegroundColor Cyan
Write-Host ""

foreach ($folder in $keyFolders) {
    $totalKeys++
    $keyName = $folder.Name
    $keyPath = $folder.FullName
    $keyJsonPath = Join-Path $keyPath "key.json"
    
    Write-Host "Validating: $keyName" -ForegroundColor White
    
    # Check 1: Required key.json exists
    if (-not (Test-Path $keyJsonPath)) {
        Write-Host "  ERROR: Missing required key.json file" -ForegroundColor Red
        $errorCount++
        continue
    }
    
    # Check 2: Parse key.json
    try {
        $keyData = Get-Content $keyJsonPath -Raw | ConvertFrom-Json
    }
    catch {
        Write-Host "  ERROR: Invalid JSON in key.json - $_" -ForegroundColor Red
        $errorCount++
        continue
    }
    
    # Check 3: Validate required fields
    $requiredFields = @('key', 'status', 'mode', 'phases', 'tasks', 'files_modified', 'commits', 'warnings', 'errors', 'notes')
    $missingFields = @()
    
    foreach ($field in $requiredFields) {
        if (-not ($keyData.PSObject.Properties.Name -contains $field)) {
            $missingFields += $field
        }
    }
    
    if ($missingFields.Count -gt 0) {
        Write-Host "  ERROR: Missing required fields: $($missingFields -join ', ')" -ForegroundColor Red
        $errorCount++
        continue
    }
    
    # Check 4: Validate key name matches folder name
    if ($keyData.key -ne $keyName) {
        Write-Host "  WARNING: Key name mismatch - folder: '$keyName', key.json: '$($keyData.key)'" -ForegroundColor Yellow
        $warningCount++
        if ($StrictMode) {
            $errorCount++
            continue
        }
    }
    
    # Check 5: Count files and check against complexity
    $files = Get-ChildItem -Path $keyPath -File
    $fileCount = $files.Count
    $complexity = if ($keyData.PSObject.Properties.Name -contains 'complexity') { $keyData.complexity } else { 'unknown' }
    
    Write-Host "  Files: $fileCount | Complexity: $complexity" -ForegroundColor Gray
    
    # Validate file count against complexity
    if ($complexity -ne 'unknown' -and $complexityLimits.ContainsKey($complexity)) {
        $limits = $complexityLimits[$complexity]
        
        if ($fileCount -lt $limits.Min) {
            Write-Host "  WARNING: File count ($fileCount) below minimum for '$complexity' complexity (min: $($limits.Min))" -ForegroundColor Yellow
            $warningCount++
        }
        
        if ($fileCount -gt $limits.Max -and $limits.Max -ne [int]::MaxValue) {
            Write-Host "  WARNING: File count ($fileCount) exceeds maximum for '$complexity' complexity (max: $($limits.Max))" -ForegroundColor Yellow
            Write-Host "     Consider using subtask folders for better organization" -ForegroundColor Gray
            $warningCount++
        }
    }
    
    # Check 6: Validate folder naming convention (lowercase with hyphens)
    if ($keyName -cmatch '[A-Z]' -or $keyName -match '_') {
        Write-Host "  WARNING: Folder name should use lowercase with hyphens" -ForegroundColor Yellow
        $warningCount++
    }
    
    # Check 7: List files for review
    if ($files.Count -gt 1) {
        Write-Host "  Files:" -ForegroundColor Gray
        foreach ($file in $files) {
            $fileType = if ($file.Name -eq 'key.json') { '[REQ]' } else { '[OPT]' }
            Write-Host "     $fileType $($file.Name)" -ForegroundColor DarkGray
        }
    }
    
    Write-Host "  Valid" -ForegroundColor Green
    $validKeys++
    Write-Host ""
}

# Check for orphaned files in root prompts.keys directory
Write-Host "Checking for orphaned files in root directory..." -ForegroundColor Cyan
$rootFiles = Get-ChildItem -Path $KeysPath -File | Where-Object { 
    $_.Name -notin @('README.md', 'active.keys.log', 'notes.template.md', 'plan.template.md', 'analysis.template.md', 'validate-key-structure.ps1') 
}

if ($rootFiles.Count -gt 0) {
    Write-Host "WARNING: Found orphaned files in root directory (should be in folders):" -ForegroundColor Yellow
    foreach ($file in $rootFiles) {
        Write-Host "  - $($file.Name)" -ForegroundColor Yellow
    }
    $warningCount += $rootFiles.Count
    Write-Host ""
}

# Summary
Write-Host "=== Validation Summary ===" -ForegroundColor Cyan
Write-Host "Total Keys Checked: $totalKeys" -ForegroundColor White
Write-Host "Valid Keys: $validKeys" -ForegroundColor Green
Write-Host "Warnings: $warningCount" -ForegroundColor $(if ($warningCount -gt 0) { 'Yellow' } else { 'Green' })
Write-Host "Errors: $errorCount" -ForegroundColor $(if ($errorCount -gt 0) { 'Red' } else { 'Green' })
Write-Host ""

# Exit code
if ($errorCount -gt 0) {
    Write-Host "Validation FAILED with $errorCount errors" -ForegroundColor Red
    exit 1
}
elseif ($StrictMode -and $warningCount -gt 0) {
    Write-Host "Validation FAILED (strict mode): $warningCount warnings treated as errors" -ForegroundColor Red
    exit 1
}
elseif ($warningCount -gt 0) {
    Write-Host "Validation PASSED with warnings" -ForegroundColor Yellow
    exit 0
}
else {
    Write-Host "Validation PASSED - All keys are properly structured" -ForegroundColor Green
    exit 0
}
