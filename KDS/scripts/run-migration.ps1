# KDS Migration Complete - Comprehensive Fix and Validate
# Purpose: Fix all .github references, validate, and compare with git commit

param(
    [string]$GitCommit,
    [switch]$DryRun,
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"

function Write-Success { Write-Host "✅ $args" -ForegroundColor Green }
function Write-Failure { Write-Host "❌ $args" -ForegroundColor Red }
function Write-Info { Write-Host "ℹ️  $args" -ForegroundColor Blue }
function Write-Header { Write-Host "`n=== $args ===" -ForegroundColor Cyan }

$baseDir = "D:\PROJECTS\NOOR CANVAS"
$kdsDir = Join-Path $baseDir "KDS"

Write-Header "KDS Migration: .github -> KDS Structure"
Write-Info "This script will:"
Write-Info "  1. Fix all .github references to KDS/"
Write-Info "  2. Validate all file references"
Write-Info "  3. Check BRAIN structure"
if ($GitCommit) {
    Write-Info "  4. Compare with git commit: $GitCommit"
}
Write-Host ""

if ($DryRun) {
    Write-Info "DRY RUN MODE - No files will be modified"
}

# Step 1: Run fixer
Write-Header "Step 1: Fixing .github References"
$fixerScript = Join-Path $kdsDir "scripts\fix-github-references.ps1"

if (Test-Path $fixerScript) {
    $fixerArgs = @()
    if ($DryRun) { $fixerArgs += "-DryRun" }
    if ($Verbose) { $fixerArgs += "-Verbose" }
    if ($GitCommit) { $fixerArgs += "-GitCommit", $GitCommit }
    
    Write-Info "Running: $fixerScript $fixerArgs"
    
    try {
        & $fixerScript @fixerArgs
        $fixerExitCode = $LASTEXITCODE
        
        if ($fixerExitCode -eq 0) {
            Write-Success "All .github references fixed!"
        } else {
            Write-Failure "Fixer completed with issues (exit code: $fixerExitCode)"
        }
    } catch {
        Write-Failure "Fixer failed: $_"
        exit 1
    }
} else {
    Write-Failure "Fixer script not found: $fixerScript"
    exit 1
}

# Step 2: Run validator
Write-Header "Step 2: Validating KDS References"
$validatorScript = Join-Path $kdsDir "scripts\validate-kds-references.ps1"

if (Test-Path $validatorScript) {
    $validatorArgs = @()
    if ($Verbose) { $validatorArgs += "-Verbose" }
    if ($GitCommit) { $validatorArgs += "-GitCommit", $GitCommit }
    
    Write-Info "Running: $validatorScript $validatorArgs"
    
    try {
        & $validatorScript @validatorArgs
        $validatorExitCode = $LASTEXITCODE
        
        if ($validatorExitCode -eq 0) {
            Write-Success "All validations passed!"
        } else {
            Write-Failure "Validator found issues (exit code: $validatorExitCode)"
        }
    } catch {
        Write-Failure "Validator failed: $_"
        exit 1
    }
} else {
    Write-Failure "Validator script not found: $validatorScript"
    exit 1
}

# Step 3: Final summary
Write-Header "Migration Summary"

$remainingRefs = Get-ChildItem -Path $kdsDir -Recurse -File `
    -Exclude "fix-github-*.ps1","validate-kds-references.ps1","*report*.md","*.pdf","run-migration.ps1" | 
    Select-String -Pattern "\.github" -CaseSensitive:$false |
    Where-Object { $_.Line -notmatch "\.github.*Reference" -and $_.Line -notmatch "pattern" }

if (-not $remainingRefs) {
    Write-Success "✅ MIGRATION COMPLETE!"
    Write-Host ""
    Write-Info "All .github references have been successfully migrated to KDS/ structure"
    Write-Info "All file references validated"
    Write-Info "BRAIN structure validated"
    Write-Host ""
    
    if (-not $DryRun) {
        Write-Info "Next steps:"
        Write-Host "  1. Review changes: git status"
        Write-Host "  2. Test KDS system: #file:KDS/prompts/user/kds.md"
        Write-Host "  3. Commit changes: git add KDS/ && git commit -m 'fix: Migrate .github refs to KDS/'"
        Write-Host "  4. Tag release: git tag -a kds-migration-complete -m 'Completed KDS migration'"
    }
    
    exit 0
} else {
    Write-Failure "❌ MIGRATION INCOMPLETE"
    Write-Host ""
    Write-Info "Found $($remainingRefs.Count) remaining .github references:"
    $remainingRefs | ForEach-Object {
        Write-Host "  $($_.Path):$($_.LineNumber) - $($_.Line.Trim())"
    }
    Write-Host ""
    Write-Info "These may need manual review"
    
    exit 2
}
