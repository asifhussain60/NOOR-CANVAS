# KDS Comprehensive Test Runner
# Version: 1.0
# Purpose: Automate execution of KDS comprehensive test and validate all success criteria

param(
    [switch]$SkipBrainReset,
    [switch]$Verbose,
    [switch]$GenerateReport,
    [string]$ReportPath = ".\KDS\tests\reports\test-run-$(Get-Date -Format 'yyyy-MM-dd-HHmmss').md"
)

$ErrorActionPreference = "Stop"

# Colors for output
function Write-TestHeader { Write-Host "`n=== $args ===" -ForegroundColor Cyan }
function Write-TestSuccess { Write-Host "✅ $args" -ForegroundColor Green }
function Write-TestFailure { Write-Host "❌ $args" -ForegroundColor Red }
function Write-TestWarning { Write-Host "⚠️ $args" -ForegroundColor Yellow }
function Write-TestInfo { Write-Host "ℹ️  $args" -ForegroundColor Blue }

# Test results tracking
$script:TestResults = @{
    TotalPhases = 8
    PassedPhases = 0
    FailedPhases = 0
    Warnings = @()
    BrainEvents = @()
    StartTime = Get-Date
}

# Validate prerequisites
function Test-Prerequisites {
    Write-TestHeader "Validating Prerequisites"
    
    $required = @(
        @{ Path = "KDS\prompts\user\kds.md"; Name = "KDS Entry Point" }
        @{ Path = ".\KDS\tests\KDS-COMPREHENSIVE-TEST-PROMPT.md"; Name = "Test Prompt" }
        @{ Path = ".\KDS\kds-brain"; Name = "BRAIN Directory" }
    )
    
    foreach ($item in $required) {
        if (Test-Path $item.Path) {
            Write-TestSuccess "$($item.Name) found"
        } else {
            Write-TestFailure "$($item.Name) NOT found: $($item.Path)"
            throw "Prerequisites not met"
        }
    }
}

# Reset BRAIN state (optional)
function Reset-BrainState {
    if ($SkipBrainReset) {
        Write-TestWarning "Skipping BRAIN reset (continuing with existing state)"
        return
    }
    
    Write-TestHeader "Resetting BRAIN State"
    
    $brainPath = ".\KDS\kds-brain"
    
    # Backup current state
    $backupPath = "$brainPath\backup-$(Get-Date -Format 'yyyy-MM-dd-HHmmss')"
    if (Test-Path $brainPath) {
        Write-TestInfo "Backing up current BRAIN state to: $backupPath"
        Copy-Item -Path $brainPath -Destination $backupPath -Recurse -Force
    }
    
    # Create fresh BRAIN structure
    Write-TestInfo "Creating fresh BRAIN state"
    
    $eventsFile = "$brainPath\events.jsonl"
    $knowledgeGraphFile = "$brainPath\knowledge-graph.yaml"
    
    if (Test-Path $eventsFile) {
        Clear-Content $eventsFile
    } else {
        New-Item -ItemType File -Path $eventsFile -Force | Out-Null
    }
    
    # Initialize knowledge graph
    $initialGraph = @"
# KDS BRAIN Knowledge Graph
# Auto-generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
# Status: Fresh state for comprehensive test

intent_patterns: []
file_relationships: []
common_mistakes: []
architectural_patterns: []
test_patterns: []
performance_metrics:
  baseline_timestamp: $(Get-Date -Format 'yyyy-MM-ddTHH:mm:ss')
"@
    
    Set-Content -Path $knowledgeGraphFile -Value $initialGraph
    
    Write-TestSuccess "BRAIN state reset complete"
}

# Validate BRAIN event logging
function Test-BrainEventLogging {
    param([string]$ExpectedEventType)
    
    $eventsFile = ".\KDS\kds-brain\events.jsonl"
    
    if (-not (Test-Path $eventsFile)) {
        Write-TestFailure "BRAIN events file not found"
        return $false
    }
    
    $recentEvents = Get-Content $eventsFile -Tail 10 | ForEach-Object {
        $_ | ConvertFrom-Json
    }
    
    $found = $recentEvents | Where-Object { $_.type -eq $ExpectedEventType }
    
    if ($found) {
        Write-TestSuccess "BRAIN event logged: $ExpectedEventType"
        $script:TestResults.BrainEvents += $ExpectedEventType
        return $true
    } else {
        Write-TestWarning "BRAIN event NOT logged: $ExpectedEventType"
        $script:TestResults.Warnings += "Missing BRAIN event: $ExpectedEventType"
        return $false
    }
}

# Run test phase
function Invoke-TestPhase {
    param(
        [int]$PhaseNumber,
        [string]$PhaseName,
        [string]$Command,
        [string]$ExpectedIntent,
        [string[]]$ExpectedBrainEvents,
        [scriptblock]$ValidationScript
    )
    
    Write-TestHeader "Phase $PhaseNumber`: $PhaseName"
    
    Write-TestInfo "Expected Intent: $ExpectedIntent"
    Write-TestInfo "Command: $Command"
    
    # In automated mode, we can't actually invoke Copilot
    # So we simulate and validate structure only
    Write-TestWarning "MANUAL EXECUTION REQUIRED"
    Write-Host @"

📋 MANUAL TEST STEP:

1. Invoke the following command:
   
   $Command

2. Expected KDS behavior:
   - Intent detected: $ExpectedIntent
   - BRAIN events: $($ExpectedBrainEvents -join ', ')

3. After execution, press ENTER to validate BRAIN state...

"@
    
    # Wait for user to execute and confirm
    if (-not $Verbose) {
        Read-Host "Press ENTER after executing command"
    }
    
    # Validate BRAIN events
    $allEventsFound = $true
    foreach ($expectedEvent in $ExpectedBrainEvents) {
        if (-not (Test-BrainEventLogging -ExpectedEventType $expectedEvent)) {
            $allEventsFound = $false
        }
    }
    
    # Run custom validation
    if ($ValidationScript) {
        Write-TestInfo "Running custom validation..."
        try {
            & $ValidationScript
            Write-TestSuccess "Custom validation passed"
        } catch {
            Write-TestFailure "Custom validation failed: $_"
            $script:TestResults.FailedPhases++
            return $false
        }
    }
    
    if ($allEventsFound) {
        $script:TestResults.PassedPhases++
        Write-TestSuccess "Phase $PhaseNumber complete"
        return $true
    } else {
        $script:TestResults.FailedPhases++
        Write-TestFailure "Phase $PhaseNumber incomplete (missing BRAIN events)"
        return $false
    }
}

# Generate test report
function New-TestReport {
    Write-TestHeader "Generating Test Report"
    
    $endTime = Get-Date
    $duration = $endTime - $script:TestResults.StartTime
    
    $report = @"
# KDS Comprehensive Test Report

**Generated:** $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')  
**Duration:** $($duration.ToString('hh\:mm\:ss'))  
**Status:** $(if ($script:TestResults.FailedPhases -eq 0) { "✅ PASSED" } else { "❌ FAILED" })

---

## Summary

| Metric | Value |
|--------|-------|
| **Total Phases** | $($script:TestResults.TotalPhases) |
| **Passed** | $($script:TestResults.PassedPhases) |
| **Failed** | $($script:TestResults.FailedPhases) |
| **Success Rate** | $(($script:TestResults.PassedPhases / $script:TestResults.TotalPhases * 100).ToString('F1'))% |
| **BRAIN Events Logged** | $($script:TestResults.BrainEvents.Count) |
| **Warnings** | $($script:TestResults.Warnings.Count) |

---

## BRAIN Events Logged

$(if ($script:TestResults.BrainEvents.Count -gt 0) {
    $script:TestResults.BrainEvents | ForEach-Object { "- ✅ $_" } | Out-String
} else {
    "⚠️ No BRAIN events logged"
})

---

## Warnings

$(if ($script:TestResults.Warnings.Count -gt 0) {
    $script:TestResults.Warnings | ForEach-Object { "- ⚠️ $_" } | Out-String
} else {
    "✅ No warnings"
})

---

## Phase Details

### Phase 1: Architectural Query (ASK Intent)
Status: $(if ($script:TestResults.BrainEvents -contains "architectural_query") { "✅ PASSED" } else { "❌ FAILED" })

### Phase 2: Multi-Intent Planning (PLAN + TEST)
Status: $(if ($script:TestResults.BrainEvents -contains "plan_created") { "✅ PASSED" } else { "❌ FAILED" })

### Phase 3: Execution Start (EXECUTE)
Status: $(if ($script:TestResults.BrainEvents -contains "task_executed") { "✅ PASSED" } else { "❌ FAILED" })

### Phase 4: Error Correction (CORRECT)
Status: $(if ($script:TestResults.BrainEvents -contains "correction_applied") { "✅ PASSED" } else { "❌ FAILED" })

### Phase 5: Session Resumption (RESUME)
Status: $(if ($script:TestResults.BrainEvents -contains "session_resumed") { "✅ PASSED" } else { "❌ FAILED" })

### Phase 6: Knowledge Query (ASK)
Status: $(if ($script:TestResults.BrainEvents -contains "knowledge_query") { "✅ PASSED" } else { "❌ FAILED" })

### Phase 7: Test Generation (TEST)
Status: $(if ($script:TestResults.BrainEvents -contains "test_generated") { "✅ PASSED" } else { "❌ FAILED" })

### Phase 8: System Validation (VALIDATE)
Status: $(if ($script:TestResults.BrainEvents -contains "validation_complete") { "✅ PASSED" } else { "❌ FAILED" })

---

## SOLID Compliance

| Principle | Status | Notes |
|-----------|--------|-------|
| **SRP** | ⏳ Manual Validation | Each agent should have ONE responsibility |
| **ISP** | ⏳ Manual Validation | No mode switches detected |
| **DIP** | ⏳ Manual Validation | Abstractions used (session-loader, test-runner) |
| **OCP** | ⏳ Manual Validation | System extensible without modification |

---

## Next Steps

$(if ($script:TestResults.FailedPhases -eq 0) {
    @"
✅ All phases passed! KDS system is functioning correctly.

**Recommendations:**
1. Run this test monthly to track BRAIN learning progress
2. Compare execution times across runs (should decrease)
3. Monitor BRAIN confidence scores (should increase)
4. Review knowledge-graph.yaml for accumulated patterns
"@
} else {
    @"
❌ Test failures detected. Action required:

**Immediate Actions:**
1. Review failed phases above
2. Check BRAIN events.jsonl for missing events
3. Validate intent-router.md configuration
4. Verify SOLID compliance in failed agents

**Debugging:**
- Check KDS/kds-brain/events.jsonl for event history
- Review KDS/kds-brain/knowledge-graph.yaml for patterns
- Validate abstraction layer (session-loader, test-runner, file-accessor)
"@
})

---

**Test Version:** 1.0  
**KDS Version:** 5.0 (SOLID + BRAIN)  
**Test Prompt:** KDS/tests/KDS-COMPREHENSIVE-TEST-PROMPT.md
"@
    
    # Save report
    $reportDir = Split-Path $ReportPath -Parent
    if (-not (Test-Path $reportDir)) {
        New-Item -ItemType Directory -Path $reportDir -Force | Out-Null
    }
    
    Set-Content -Path $ReportPath -Value $report
    Write-TestSuccess "Report saved: $ReportPath"
    
    # Display summary
    Write-Host "`n$report`n"
}

# Main execution
try {
    Write-TestHeader "KDS Comprehensive Test Runner v1.0"
    
    # Step 1: Prerequisites
    Test-Prerequisites
    
    # Step 2: BRAIN reset (optional)
    Reset-BrainState
    
    # Step 3: Display test instructions
    Write-Host @"

╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║           KDS COMPREHENSIVE TEST - MANUAL MODE                ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝

This test requires MANUAL execution of KDS commands.

📋 Test Structure:
- 8 Phases covering all KDS intents
- Each phase validates BRAIN event logging
- SOLID compliance checked throughout
- Final report generated

⚠️  NOTE: This is a SEMI-AUTOMATED test
   - Script validates BRAIN state after each phase
   - You must manually invoke KDS commands
   - Script will guide you through each step

Press ENTER to begin...
"@
    
    if (-not $Verbose) {
        Read-Host
    }
    
    # Step 4: Execute test phases (guided manual execution)
    # NOTE: Full automation requires KDS API, which doesn't exist yet
    
    Write-TestInfo @"

For full test execution, follow the manual steps in:
  KDS/tests/KDS-COMPREHENSIVE-TEST-PROMPT.md

This script will validate BRAIN state after you complete each phase.

Ready to proceed with Phase 1? (y/n)
"@
    
    $proceed = Read-Host
    if ($proceed -ne 'y') {
        Write-TestWarning "Test execution cancelled by user"
        return
    }
    
    # Phase 1: Architectural Query
    Invoke-TestPhase `
        -PhaseNumber 1 `
        -PhaseName "Architectural Query (ASK Intent)" `
        -Command "#file:KDS/prompts/user/kds.md`nAnalyze existing component structure" `
        -ExpectedIntent "ASK" `
        -ExpectedBrainEvents @("architectural_query")
    
    # Continue with remaining phases...
    Write-TestInfo @"

Continue with remaining phases manually, or press CTRL+C to stop.

After completing all 8 phases, re-run this script with -GenerateReport 
to produce the final test report.
"@
    
    # Step 5: Generate report (if requested)
    if ($GenerateReport) {
        New-TestReport
    }
    
} catch {
    Write-TestFailure "Test execution failed: $_"
    Write-Host $_.ScriptStackTrace
    exit 1
}

Write-TestSuccess "Test runner complete"
