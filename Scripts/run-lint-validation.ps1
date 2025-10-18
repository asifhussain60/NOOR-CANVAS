# Lint Validation Script
# Purpose: Validate all modified files before commit
# Usage: .\Scripts\run-lint-validation.ps1 [-AutoFix]

param(
    [switch]$AutoFix = $false
)

$ErrorActionPreference = "Stop"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Mandatory Lint Validation" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Step 1: Detect modified files
Write-Host "[1/5] Detecting modified files..." -ForegroundColor Yellow
$modifiedFiles = git diff --name-only HEAD

if ($modifiedFiles.Count -eq 0) {
    Write-Host "[LINT] No modified files to validate" -ForegroundColor Green
    exit 0
}

Write-Host "  Found $($modifiedFiles.Count) modified file(s)" -ForegroundColor Gray

# Step 2: Group files by type
Write-Host "`n[2/5] Grouping files by type..." -ForegroundColor Yellow
$csFiles = $modifiedFiles | Where-Object { $_ -match '\.(cs|cshtml|razor)$' }
$jsFiles = $modifiedFiles | Where-Object { $_ -match '\.(js|ts|tsx)$' }
$cssFiles = $modifiedFiles | Where-Object { $_ -match '\.(css|razor)$' }
$psFiles = $modifiedFiles | Where-Object { $_ -match '\.ps1$' }
$jsonFiles = $modifiedFiles | Where-Object { $_ -match '\.json$' }

Write-Host "  C# Files: $($csFiles.Count)" -ForegroundColor Gray
Write-Host "  JS/TS Files: $($jsFiles.Count)" -ForegroundColor Gray
Write-Host "  CSS Files: $($cssFiles.Count)" -ForegroundColor Gray
Write-Host "  PowerShell: $($psFiles.Count)" -ForegroundColor Gray
Write-Host "  JSON Files: $($jsonFiles.Count)" -ForegroundColor Gray

$lintFailed = $false
$lintResults = @()

# Step 3: Run linters
Write-Host "`n[3/5] Running linters..." -ForegroundColor Yellow

# C# Files (Roslynator + Roslyn Analyzers)
if ($csFiles.Count -gt 0) {
    Write-Host "`n  [C#] Validating $($csFiles.Count) C# files..." -ForegroundColor Cyan
    
    # Run build with analyzers
    $buildOutput = dotnet build /p:RunAnalyzers=true 2>&1
    
    # Check for warnings
    $warnings = $buildOutput | Select-String "warning"
    
    if ($warnings.Count -gt 0) {
        Write-Host "  [FAIL] Found $($warnings.Count) analyzer warning(s)" -ForegroundColor Red
        $warnings | ForEach-Object { Write-Host "    $_" -ForegroundColor Red }
        $lintFailed = $true
        $lintResults += "[FAIL] C# Files: $($warnings.Count) warnings"
    } else {
        Write-Host "  [PASS] C# Files validated (0 warnings)" -ForegroundColor Green
        $lintResults += "[PASS] C# Files: $($csFiles.Count) files, 0 warnings"
    }
}

# JavaScript/TypeScript Files (ESLint)
if ($jsFiles.Count -gt 0) {
    Write-Host "`n  [JS/TS] Validating $($jsFiles.Count) JS/TS files..." -ForegroundColor Cyan
    
    # Check if ESLint is installed
    if (Test-Path "node_modules/eslint") {
        if ($AutoFix) {
            npm run lint -- --fix 2>&1 | Out-Null
        }
        
        $eslintOutput = npm run lint 2>&1
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  [FAIL] ESLint errors detected" -ForegroundColor Red
            $eslintOutput | ForEach-Object { Write-Host "    $_" -ForegroundColor Red }
            $lintFailed = $true
            $lintResults += "[FAIL] JS/TS Files: ESLint errors"
        } else {
            Write-Host "  [PASS] JS/TS Files validated (0 errors)" -ForegroundColor Green
            $lintResults += "[PASS] JS/TS Files: $($jsFiles.Count) files, 0 errors"
        }
    } else {
        Write-Host "  [WARN] ESLint not installed, skipping JS/TS validation" -ForegroundColor Yellow
        Write-Host "  Install with: npm install --save-dev eslint" -ForegroundColor Gray
        $lintResults += "[SKIP] JS/TS Files: ESLint not installed"
    }
}

# CSS Files (Stylelint)
if ($cssFiles.Count -gt 0) {
    Write-Host "`n  [CSS] Validating $($cssFiles.Count) CSS/Razor files..." -ForegroundColor Cyan
    
    # Check if Stylelint is installed
    if (Test-Path "node_modules/stylelint") {
        if ($AutoFix) {
            npm run lint:css:fix 2>&1 | Out-Null
        }
        
        $stylelintOutput = npm run lint:css 2>&1
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  [FAIL] Stylelint errors detected" -ForegroundColor Red
            $stylelintOutput | ForEach-Object { Write-Host "    $_" -ForegroundColor Red }
            $lintFailed = $true
            $lintResults += "[FAIL] CSS Files: Stylelint errors"
        } else {
            Write-Host "  [PASS] CSS Files validated (0 errors)" -ForegroundColor Green
            $lintResults += "[PASS] CSS Files: $($cssFiles.Count) files, 0 errors"
        }
    } else {
        Write-Host "  [WARN] Stylelint not installed, skipping CSS validation" -ForegroundColor Yellow
        Write-Host "  Install with: npm install --save-dev stylelint stylelint-config-standard" -ForegroundColor Gray
        $lintResults += "[SKIP] CSS Files: Stylelint not installed"
    }
}

# PowerShell Scripts (PSScriptAnalyzer)
if ($psFiles.Count -gt 0) {
    Write-Host "`n  [PS1] Validating $($psFiles.Count) PowerShell files..." -ForegroundColor Cyan
    
    # Check if PSScriptAnalyzer is installed
    $hasPSScriptAnalyzer = Get-Module -ListAvailable -Name PSScriptAnalyzer
    
    if ($hasPSScriptAnalyzer) {
        $psErrors = 0
        
        foreach ($file in $psFiles) {
            $results = Invoke-ScriptAnalyzer -Path $file -Severity Warning,Error 2>&1
            
            if ($results.Count -gt 0) {
                Write-Host "  [FAIL] $file has issues:" -ForegroundColor Red
                $results | ForEach-Object { 
                    Write-Host "    Line $($_.Line): $($_.Message)" -ForegroundColor Red 
                }
                $psErrors += $results.Count
                $lintFailed = $true
            }
        }
        
        if ($psErrors -eq 0) {
            Write-Host "  [PASS] PowerShell files validated (0 warnings)" -ForegroundColor Green
            $lintResults += "[PASS] PowerShell: $($psFiles.Count) files, 0 warnings"
        } else {
            $lintResults += "[FAIL] PowerShell: $psErrors warning(s)"
        }
    } else {
        Write-Host "  [WARN] PSScriptAnalyzer not installed, skipping PowerShell validation" -ForegroundColor Yellow
        Write-Host "  Install with: Install-Module -Name PSScriptAnalyzer -Scope CurrentUser -Force" -ForegroundColor Gray
        $lintResults += "[SKIP] PowerShell: PSScriptAnalyzer not installed"
    }
}

# JSON Files (Syntax Validation)
if ($jsonFiles.Count -gt 0) {
    Write-Host "`n  [JSON] Validating $($jsonFiles.Count) JSON files..." -ForegroundColor Cyan
    
    $jsonErrors = 0
    
    foreach ($file in $jsonFiles) {
        try {
            Get-Content $file -Raw | ConvertFrom-Json | Out-Null
            Write-Host "  [PASS] $file is valid JSON" -ForegroundColor Green
        }
        catch {
            Write-Host "  [FAIL] $file has invalid JSON syntax:" -ForegroundColor Red
            Write-Host "    $($_.Exception.Message)" -ForegroundColor Red
            $jsonErrors++
            $lintFailed = $true
        }
    }
    
    if ($jsonErrors -eq 0) {
        $lintResults += "[PASS] JSON: $($jsonFiles.Count) files, valid syntax"
    } else {
        $lintResults += "[FAIL] JSON: $jsonErrors file(s) with syntax errors"
    }
}

# Step 4: Report summary
Write-Host "`n[4/5] Lint Summary" -ForegroundColor Yellow
Write-Host "======================================" -ForegroundColor Cyan

foreach ($result in $lintResults) {
    if ($result -match "\[PASS\]") {
        Write-Host "  $result" -ForegroundColor Green
    } elseif ($result -match "\[FAIL\]") {
        Write-Host "  $result" -ForegroundColor Red
    } elseif ($result -match "\[SKIP\]") {
        Write-Host "  $result" -ForegroundColor Yellow
    }
}

# Step 5: Exit with appropriate code
Write-Host "`n[5/5] Final Result" -ForegroundColor Yellow

if ($lintFailed) {
    Write-Host "`n[LINT FAIL] Validation failed. Fix errors and retry." -ForegroundColor Red
    
    if (-not $AutoFix) {
        Write-Host "`nTip: Run with -AutoFix flag to attempt automatic fixes:" -ForegroundColor Yellow
        Write-Host "  .\Scripts\run-lint-validation.ps1 -AutoFix" -ForegroundColor Gray
    }
    
    exit 1
} else {
    Write-Host "`n[LINT PASS] All files validated successfully." -ForegroundColor Green
    exit 0
}
