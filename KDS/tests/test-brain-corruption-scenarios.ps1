# KDS BRAIN Corruption Detection Test
# Purpose: Verify that test-brain-integrity.ps1 correctly detects various corruption scenarios
# Usage: .\test-brain-corruption-scenarios.ps1

param(
    [switch]$Verbose = $false
)

$ErrorActionPreference = 'Stop'

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🧪 BRAIN Corruption Detection Test" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$kdsRoot = Split-Path $PSScriptRoot -Parent
$brainRoot = Join-Path $kdsRoot "kds-brain"
$backupRoot = Join-Path $PSScriptRoot "temp-backup-corruption-test"
$testScript = Join-Path $PSScriptRoot "test-brain-integrity.ps1"

# Backup current BRAIN files
Write-Host "Step 1: Backing up current BRAIN files..." -ForegroundColor Yellow
if (Test-Path $backupRoot) {
    Remove-Item -Path $backupRoot -Recurse -Force
}
New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null

$brainFiles = @(
    "conversation-history.jsonl",
    "knowledge-graph.yaml",
    "development-context.yaml",
    "events.jsonl"
)

foreach ($file in $brainFiles) {
    $sourcePath = Join-Path $brainRoot $file
    $backupPath = Join-Path $backupRoot $file
    if (Test-Path $sourcePath) {
        Copy-Item -Path $sourcePath -Destination $backupPath -Force
        Write-Host "  ✅ Backed up: $file" -ForegroundColor Green
    }
}
Write-Host ""

# Test scenarios
$scenarios = @(
    @{
        Name = "Missing File (events.jsonl)"
        Setup = {
            $eventsPath = Join-Path $brainRoot "events.jsonl"
            Rename-Item -Path $eventsPath -NewName "events.jsonl.backup" -Force
        }
        Cleanup = {
            $eventsPath = Join-Path $brainRoot "events.jsonl.backup"
            if (Test-Path $eventsPath) {
                Rename-Item -Path $eventsPath -NewName "events.jsonl" -Force
            }
        }
        ExpectedFailures = @("File Existence")
    },
    @{
        Name = "Invalid JSON in conversation-history.jsonl"
        Setup = {
            $convPath = Join-Path $brainRoot "conversation-history.jsonl"
            Add-Content -Path $convPath -Value '{"invalid": "json" missing brace'
        }
        Cleanup = {
            $backupPath = Join-Path $backupRoot "conversation-history.jsonl"
            $convPath = Join-Path $brainRoot "conversation-history.jsonl"
            Copy-Item -Path $backupPath -Destination $convPath -Force
        }
        ExpectedFailures = @("JSONL Syntax", "Conversation FIFO")
    },
    @{
        Name = "Confidence score out of range (2.5)"
        Setup = {
            $kgPath = Join-Path $brainRoot "knowledge-graph.yaml"
            $content = Get-Content $kgPath -Raw
            $content = $content -replace "confidence: 0.95", "confidence: 2.5"
            $content | Out-File -FilePath $kgPath -Encoding UTF8 -Force
        }
        Cleanup = {
            $backupPath = Join-Path $backupRoot "knowledge-graph.yaml"
            $kgPath = Join-Path $brainRoot "knowledge-graph.yaml"
            Copy-Item -Path $backupPath -Destination $kgPath -Force
        }
        ExpectedFailures = @("Confidence Scores")
    },
    @{
        Name = "Too many conversations (>20)"
        Setup = {
            $convPath = Join-Path $brainRoot "conversation-history.jsonl"
            for ($i = 1; $i -le 20; $i++) {
                $conv = @{
                    conversation_id = "test-overflow-$i"
                    title = "Test Overflow $i"
                    started = (Get-Date).ToString("o")
                    active = $false
                    message_count = 1
                } | ConvertTo-Json -Compress
                Add-Content -Path $convPath -Value $conv
            }
        }
        Cleanup = {
            $backupPath = Join-Path $backupRoot "conversation-history.jsonl"
            $convPath = Join-Path $brainRoot "conversation-history.jsonl"
            Copy-Item -Path $backupPath -Destination $convPath -Force
        }
        ExpectedFailures = @("Conversation FIFO")
    },
    @{
        Name = "Duplicate conversation IDs"
        Setup = {
            $convPath = Join-Path $brainRoot "conversation-history.jsonl"
            $conv = @{
                conversation_id = "conv-bootstrap"  # Duplicate ID
                title = "Duplicate Test"
                started = (Get-Date).ToString("o")
                active = $false
                message_count = 1
            } | ConvertTo-Json -Compress
            Add-Content -Path $convPath -Value $conv
        }
        Cleanup = {
            $backupPath = Join-Path $backupRoot "conversation-history.jsonl"
            $convPath = Join-Path $brainRoot "conversation-history.jsonl"
            Copy-Item -Path $backupPath -Destination $convPath -Force
        }
        ExpectedFailures = @("Conversation FIFO")
    },
    @{
        Name = "YAML with tabs (invalid)"
        Setup = {
            $kgPath = Join-Path $brainRoot "knowledge-graph.yaml"
            $content = Get-Content $kgPath -Raw
            $content = $content -replace "  confidence: 0.95", "`tconfidence: 0.95"
            $content | Out-File -FilePath $kgPath -Encoding UTF8 -Force -NoNewline
        }
        Cleanup = {
            $backupPath = Join-Path $backupRoot "knowledge-graph.yaml"
            $kgPath = Join-Path $brainRoot "knowledge-graph.yaml"
            Copy-Item -Path $backupPath -Destination $kgPath -Force
        }
        ExpectedFailures = @("YAML Syntax")
    }
)

# Run each scenario
$passedScenarios = 0
$failedScenarios = 0

foreach ($scenario in $scenarios) {
    Write-Host "Scenario: $($scenario.Name)" -ForegroundColor Yellow
    Write-Host "  Setting up corruption..." -ForegroundColor Gray
    
    try {
        # Setup corruption
        & $scenario.Setup
        
        # Run integrity test
        $result = & $testScript -JsonOutput | ConvertFrom-Json
        
        # Verify test detected the corruption
        $failedCategories = $result.checks | Where-Object { $_.status -eq "FAIL" } | Select-Object -ExpandProperty category -Unique
        
        $allExpectedFound = $true
        foreach ($expectedFailure in $scenario.ExpectedFailures) {
            if ($expectedFailure -notin $failedCategories) {
                $allExpectedFound = $false
                Write-Host "  ❌ Expected failure in '$expectedFailure' not detected!" -ForegroundColor Red
            }
        }
        
        if ($result.failed -gt 0 -and $allExpectedFound) {
            Write-Host "  ✅ Corruption detected correctly ($($result.failed) failures)" -ForegroundColor Green
            $passedScenarios++
        } else {
            Write-Host "  ❌ Corruption NOT detected!" -ForegroundColor Red
            Write-Host "     Expected failures: $($scenario.ExpectedFailures -join ', ')" -ForegroundColor Gray
            Write-Host "     Actual failures: $($failedCategories -join ', ')" -ForegroundColor Gray
            $failedScenarios++
        }
        
        # Cleanup
        & $scenario.Cleanup
        
    } catch {
        Write-Host "  ❌ Scenario failed with error: $($_.Exception.Message)" -ForegroundColor Red
        $failedScenarios++
        & $scenario.Cleanup
    }
    
    Write-Host ""
}

# Restore backup and cleanup
Write-Host "Step 2: Restoring original BRAIN files..." -ForegroundColor Yellow
foreach ($file in $brainFiles) {
    $backupPath = Join-Path $backupRoot $file
    $sourcePath = Join-Path $brainRoot $file
    if (Test-Path $backupPath) {
        Copy-Item -Path $backupPath -Destination $sourcePath -Force
        Write-Host "  ✅ Restored: $file" -ForegroundColor Green
    }
}
Remove-Item -Path $backupRoot -Recurse -Force
Write-Host ""

# Final verification
Write-Host "Step 3: Verifying BRAIN integrity after cleanup..." -ForegroundColor Yellow
$finalResult = & $testScript -JsonOutput | ConvertFrom-Json
if ($finalResult.overall_status -eq "PASS") {
    Write-Host "  ✅ BRAIN restored to healthy state" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  WARNING: BRAIN still showing issues after restore!" -ForegroundColor Yellow
}
Write-Host ""

# Summary
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Corruption Detection Summary" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Total Scenarios:    $($scenarios.Count)" -ForegroundColor White
Write-Host "  ✅ Passed:           $passedScenarios" -ForegroundColor Green
Write-Host "  ❌ Failed:           $failedScenarios" -ForegroundColor Red
Write-Host ""

if ($failedScenarios -eq 0) {
    Write-Host "  ✅ ALL CORRUPTION SCENARIOS DETECTED CORRECTLY" -ForegroundColor Green
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    exit 0
} else {
    Write-Host "  ❌ SOME CORRUPTION SCENARIOS FAILED" -ForegroundColor Red
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}
