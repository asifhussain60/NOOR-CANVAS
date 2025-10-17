# Test Syntax Validation Script
# Purpose: Validate TypeScript/JavaScript test files for syntax errors before execution
# Usage: .\validate-test-syntax.ps1 -TestFile "path\to\test.spec.ts"

param(
    [Parameter(Mandatory=$true)]
    [string]$TestFile,
    
    [switch]$ShowDebug
)

$ErrorActionPreference = "Stop"

Write-Host "`n[Test Syntax Validator]" -ForegroundColor Cyan
Write-Host "Validating: $TestFile" -ForegroundColor Gray

# Verify file exists
if (-not (Test-Path $TestFile)) {
    Write-Host "[X] Test file not found: $TestFile" -ForegroundColor Red
    exit 1
}

$testFileResolved = Resolve-Path $TestFile
Write-Host "Resolved path: $testFileResolved" -ForegroundColor Gray

# Determine test directory (Tests\UI or Workspaces\TEMP)
$testDir = Split-Path -Parent $testFileResolved
Write-Host "Test directory: $testDir" -ForegroundColor Gray

# Check for ESLint configuration
$eslintConfigPaths = @(
    (Join-Path $testDir ".eslintrc.js"),
    (Join-Path $testDir ".eslintrc.json"),
    (Join-Path (Split-Path -Parent $testDir) ".eslintrc.js"),  # Parent directory
    "D:\PROJECTS\NOOR CANVAS\PlayWright\.eslintrc.js"  # Fallback to PlayWright config
)

$eslintConfig = $null
foreach ($configPath in $eslintConfigPaths) {
    if (Test-Path $configPath) {
        $eslintConfig = $configPath
        Write-Host "[+] Found ESLint config: $eslintConfig" -ForegroundColor Green
        break
    }
}

if (-not $eslintConfig) {
    Write-Host "[!] WARNING: No ESLint config found, skipping lint check" -ForegroundColor Yellow
    Write-Host "   Searched locations:" -ForegroundColor Gray
    foreach ($path in $eslintConfigPaths) {
        Write-Host "   - $path" -ForegroundColor Gray
    }
    
    # Fall back to TypeScript compiler check
    Write-Host "`n[*] Attempting TypeScript syntax check..." -ForegroundColor Yellow
    
    $tscResult = & npx tsc --noEmit --skipLibCheck $testFileResolved 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[X] TypeScript syntax errors detected:" -ForegroundColor Red
        Write-Host $tscResult -ForegroundColor Red
        exit 1
    }
    
    Write-Host "[+] TypeScript syntax check passed" -ForegroundColor Green
    exit 0
}

# Run ESLint
Write-Host "`n[*] Running ESLint..." -ForegroundColor Yellow

$eslintArgs = @(
    "eslint",
    $testFileResolved,
    "--config", $eslintConfig,
    "--format", "stylish"
)

if ($ShowDebug) {
    $eslintArgs += "--debug"
}

Write-Host "Command: npx $($eslintArgs -join ' ')" -ForegroundColor Gray

$eslintOutput = & npx @eslintArgs 2>&1
$eslintExitCode = $LASTEXITCODE

if ($eslintExitCode -eq 0) {
    Write-Host "[+] ESLint validation passed - No syntax errors" -ForegroundColor Green
    exit 0
} else {
    Write-Host "[X] ESLint validation FAILED - Syntax errors detected:" -ForegroundColor Red
    Write-Host $eslintOutput -ForegroundColor Red
    Write-Host ""
    Write-Host "[!] Fix syntax errors before running tests" -ForegroundColor Yellow
    exit 1
}
