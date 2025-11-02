# KDS Reference Validator
# Purpose: Validate that all file references in KDS system are correct and point to existing files

param(
    [string]$GitCommit,
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"

function Write-TestSuccess { Write-Host "✅ $args" -ForegroundColor Green }
function Write-TestFailure { Write-Host "❌ $args" -ForegroundColor Red }
function Write-TestInfo { Write-Host "ℹ️  $args" -ForegroundColor Blue }
function Write-TestHeader { Write-Host "`n=== $args ===" -ForegroundColor Cyan }

$baseDir = "D:\PROJECTS\NOOR CANVAS"
$kdsDir = Join-Path $baseDir "KDS"
$errors = @()
$warnings = @()
$validated = 0

Write-TestHeader "KDS Reference Validator"

# Test 1: Check kds.md entry point
Write-TestInfo "Test 1: Validating KDS entry point..."
$kdsEntryPoint = Join-Path $kdsDir "prompts\user\kds.md"
if (Test-Path $kdsEntryPoint) {
    Write-TestSuccess "KDS entry point exists: $kdsEntryPoint"
    $validated++
} else {
    Write-TestFailure "KDS entry point NOT found: $kdsEntryPoint"
    $errors += "Missing: KDS/prompts/user/kds.md"
}

# Test 2: Check all references in kds.md
Write-TestInfo "Test 2: Validating all file references in kds.md..."
$kdsContent = Get-Content $kdsEntryPoint -Raw

# Extract file references (KDS/... patterns)
$fileReferences = [regex]::Matches($kdsContent, 'KDS[/\\][\w/\\.-]+\.(md|ps1|yaml|jsonl|json)')

Write-TestInfo "Found $($fileReferences.Count) file references in kds.md"

foreach ($match in $fileReferences) {
    $reference = $match.Value
    $fullPath = Join-Path $baseDir $reference
    $fullPath = $fullPath -replace '/', '\'
    
    if (Test-Path $fullPath) {
        if ($Verbose) {
            Write-TestSuccess "  Valid: $reference"
        }
        $validated++
    } else {
        Write-TestFailure "  Invalid: $reference (file not found)"
        $errors += "Missing: $reference"
    }
}

# Test 3: Check for any remaining .github references
Write-TestInfo "Test 3: Checking for .github references..."
$githubRefs = Get-ChildItem -Path $kdsDir -Recurse -File -Exclude "fix-github-*.ps1","validate-kds-references.ps1","*report*.md","*.pdf" | 
    Select-String -Pattern "\.github" -CaseSensitive:$false |
    Where-Object { $_.Line -notmatch "\.github.*Reference" -and $_.Line -notmatch "report" -and $_.Line -notmatch "\.github.*pattern" }

if ($githubRefs) {
    Write-TestFailure "Found $($githubRefs.Count) .github references!"
    $githubRefs | ForEach-Object {
        Write-Host "  $($_.Path):$($_.LineNumber) - $($_.Line.Trim())"
        $errors += ".github reference in $($_.Path):$($_.LineNumber)"
    }
} else {
    Write-TestSuccess "No .github references found"
    $validated++
}

# Test 4: Check BRAIN structure
Write-TestInfo "Test 4: Validating BRAIN structure..."
$brainDir = Join-Path $kdsDir "kds-brain"
$eventsFile = Join-Path $brainDir "events.jsonl"
$knowledgeFile = Join-Path $brainDir "knowledge-graph.yaml"

if ((Test-Path $brainDir) -and (Test-Path $eventsFile) -and (Test-Path $knowledgeFile)) {
    Write-TestSuccess "BRAIN structure valid"
    $validated++
} else {
    Write-TestFailure "BRAIN structure incomplete"
    if (-not (Test-Path $brainDir)) { $errors += "Missing: KDS/kds-brain/" }
    if (-not (Test-Path $eventsFile)) { $errors += "Missing: KDS/kds-brain/events.jsonl" }
    if (-not (Test-Path $knowledgeFile)) { $errors += "Missing: KDS/kds-brain/knowledge-graph.yaml" }
}

# Test 5: Compare with git commit (if specified)
if ($GitCommit) {
    Write-TestInfo "Test 5: Comparing with git commit $GitCommit..."
    
    try {
        $changedFiles = git diff --name-only $GitCommit HEAD -- "KDS/*"
        
        if ($changedFiles) {
            Write-TestInfo "Files changed since $GitCommit`:"
            $changedFiles | ForEach-Object {
                Write-Host "  - $_"
            }
            
            # Verify no .github refs in changed files
            $hasGithubRefs = $false
            foreach ($file in $changedFiles) {
                $fullPath = Join-Path $baseDir $file
                if (Test-Path $fullPath) {
                    $content = Get-Content $fullPath -Raw -ErrorAction SilentlyContinue
                    if ($content -match '\.github(?!.*Reference)') {
                        Write-TestFailure "  ❌ $file contains .github references"
                        $hasGithubRefs = $true
                    }
                }
            }
            
            if (-not $hasGithubRefs) {
                Write-TestSuccess "No .github references in changed files"
                $validated++
            } else {
                $errors += "Changed files contain .github references"
            }
        } else {
            Write-TestInfo "No files changed since $GitCommit"
            $validated++
        }
    } catch {
        Write-TestFailure "Git comparison failed: $_"
        $warnings += "Could not compare with git commit"
    }
} else {
    Write-TestInfo "Test 5: Skipped (no git commit specified)"
}

# Generate report
Write-TestHeader "Validation Report"

Write-Host ""
Write-Host "Validated Items: $validated"
Write-Host "Errors: $($errors.Count)"
Write-Host "Warnings: $($warnings.Count)"

if ($errors.Count -gt 0) {
    Write-Host "`nErrors:" -ForegroundColor Red
    $errors | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
}

if ($warnings.Count -gt 0) {
    Write-Host "`nWarnings:" -ForegroundColor Yellow
    $warnings | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
}

Write-Host ""

# Exit code
if ($errors.Count -eq 0) {
    Write-TestSuccess "✅ ALL VALIDATIONS PASSED!"
    exit 0
} else {
    Write-TestFailure "❌ VALIDATION FAILED - $($errors.Count) errors found"
    exit 1
}
