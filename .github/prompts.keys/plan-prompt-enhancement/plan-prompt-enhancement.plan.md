# plan-prompt-enhancement - Implementation Plan

**Key**: `plan-prompt-enhancement`  
**Branch**: `development`  
**Created**: 2025-10-20T00:00:00Z  
**Status**: Ready for Implementation  

---

## Overview

Transform plan.prompt.md into a comprehensive phased execution orchestrator that generates detailed implementation plans with built-in tracking, testing, and validation.

### Selected Enhancements

✅ **A.** Phase Rollback Strategy  
✅ **B.** Test Flakiness Detection  
✅ **C.** Interactive Phase Approval with Preview  
✅ **D.** Automated Test Selector Strategy  
✅ **E.** Percy Baseline Management  
✅ **G.** Cross-Key Dependency Detection  

---

## Architecture Analysis

### Affected Layers

- **Documentation Layer**: plan.prompt.md, {key}.plan.md templates
- **Workflow Layer**: Phase breakdown algorithm, task prompt generation
- **Testing Layer**: Playwright test generation, orchestration scripts
- **Tracking Layer**: Progress checklists, work-log integration

### Dependencies

**Files to Modify**:
- `.github/prompts/plan.prompt.md` (primary target)

**Files to Reference**:
- `.github/prompts/task.prompt.md` (task execution patterns)
- `.github/prompts/test-generation.prompt.md` (test generation patterns)
- `.github/prompts/shared/execution-flow.md` (workflow steps)
- `.github/prompts/shared/playwright-test-generation.md` (test type decisions)
- `.github/prompts/shared/test-orchestration-patterns.md` (PowerShell patterns)
- `.github/instructions/SelfAwareness.instructions.md` (global rules)
- `.github/instructions/Links/PlaywrightQuickRef.md` (Playwright best practices)
- `.github/instructions/Links/InfrastructureQuickRef.md` (database rules)

**Reference Implementations**:
- `Workspaces/Data/CopilotContext.txt` (userlanding phased execution example)
- `.github/prompts.keys/hcp/work-log.md` (work log patterns)
- `.github/prompts.keys/userlanding/` (comprehensive key structure)

### Infrastructure

- **Technology Stack**: ASP.NET Core 8.0, Blazor Server, Playwright 1.40.0, Percy
- **Database**: SQL Server (KSESSIONS_DEV)
- **Build Tools**: dotnet CLI, npm
- **Code Quality**: Roslynator 4.12.4, StyleCop.Analyzers

### References

- PlaywrightQuickRef.md (mandatory for test creation)
- InfrastructureQuickRef.md (database access rules)
- test-orchestration-patterns.md (PowerShell script patterns)

---

## Phase 1: Parameter Enhancement & Stack Discovery

### Objectives

1. Add `github-branch` parameter to plan.prompt.md
2. Implement Step 0.5 Technology Stack Discovery (scan .csproj, package.json)
3. Add framework version compatibility validation
4. Implement architecture layer detection (UI/API/Services/Database/SignalR)
5. **[G] Implement cross-key dependency detection**

### Context

**Files to Analyze**:
- `.github/prompts/plan.prompt.md` (lines 1-350)
- `SPA/NoorCanvas/NoorCanvas.csproj` (package references)
- `package.json` (npm dependencies)
- `.github/prompts.keys/*/work-log.md` (existing key patterns)

**Previous Phase Dependencies**: None (initial phase)

### Implementation Tasks (TODO Items)

- [ ] **Task 1.1**: Add `github-branch` parameter to Parameters section
  - Expected outcome: New parameter documented with default value `development`
  
- [ ] **Task 1.2**: Implement Technology Stack Discovery in Step 0.5
  - Scan `.csproj` files for NuGet packages and target framework
  - Scan `package.json` for npm dependencies and scripts
  - Extract framework name, version, major libraries, build tools, test frameworks
  - Expected outcome: Technology context displayed before planning begins
  
- [ ] **Task 1.3**: Implement compatibility validation
  - Check recommended library compatibility with current framework version
  - Flag incompatible suggestions with warnings
  - Expected outcome: No incompatible library recommendations
  
- [ ] **Task 1.4**: Add architecture layer detection
  - Analyze user request and context to identify affected layers
  - Detect: UI (Blazor components), API (endpoints), Services (business logic), Database (migrations), SignalR (hubs)
  - Expected outcome: Clear layer identification in plan draft
  
- [ ] **Task 1.5**: **[G] Implement cross-key dependency scanner**
  - Scan `.github/prompts.keys/*/work-log.md` for similar work patterns
  - Detect reusable tests in `.github/prompts.keys/*/tests/`
  - Detect reusable orchestration scripts in `.github/prompts.keys/*/scripts/`
  - Identify files modified by multiple keys (potential conflicts)
  - Expected outcome: Cross-key analysis report showing reusable patterns and conflicts

### Validation Checklist

- [ ] Build passes (N/A - documentation only)
- [ ] Lint validation passes (N/A - documentation only)
- [ ] Manual validation: Technology stack correctly detected from sample project
- [ ] Manual validation: Cross-key scanner identifies patterns from existing keys
- [ ] Manual validation: Compatibility warnings shown for incompatible libraries

### Playwright Test Specification

**Test File**: N/A (documentation-only phase)

**Validation Method**: Manual testing with sample project analysis

### Orchestration Script Specification

**Script File**: N/A (documentation-only phase)

### Commit Format

```
[plan-prompt-enhancement] Phase 1: Parameter Enhancement & Stack Discovery

Add github-branch parameter and technology stack scanning to plan.prompt.md
- Added github-branch parameter with default value 'development'
- Implemented Step 0.5: Technology Stack Discovery
  * Scans .csproj for NuGet packages and target framework
  * Scans package.json for npm dependencies
  * Extracts framework, libraries, build tools, test frameworks
- Added compatibility validation (flags incompatible library versions)
- Added architecture layer detection (UI/API/Services/Database/SignalR)
- [G] Implemented cross-key dependency scanner
  * Detects similar work patterns in existing keys
  * Identifies reusable tests and orchestration scripts
  * Flags conflicting file modifications across keys

Debug: N/A (documentation-only)
```

### Debug Markers

N/A (documentation-only phase)

### Approval Gate

**User must explicitly approve**: "proceed to phase 2" or "begin phase 2"

---

## Phase 2: {key}.plan.md Document Generation with Preview

### Objectives

1. Create {key}.plan.md template structure
2. Implement phase breakdown algorithm
3. Design individualized task prompt template per phase
4. Create TODO item structure for subtasks
5. Add phase dependency tracking
6. Implement work-log.md awareness (bidirectional references)
7. **[C] Implement interactive phase preview system**
8. **[A] Generate rollback instructions per phase**

### Context

**Files to Analyze**:
- `.github/prompts/plan.prompt.md` (current state from Phase 1)
- `.github/prompts.keys/hcp/work-log.md` (work log patterns)
- `.github/prompts.keys/userlanding/` (comprehensive key structure)
- `Workspaces/Data/CopilotContext.txt` (phased execution example)

**Previous Phase Dependencies**: 
- Technology stack scanner (Phase 1, Task 1.2)
- Architecture layer detection (Phase 1, Task 1.4)
- Cross-key scanner (Phase 1, Task 1.5)

### Implementation Tasks (TODO Items)

- [ ] **Task 2.1**: Create {key}.plan.md template structure
  - Sections: Overview, Architecture Analysis, Phases, Progress Checklist, Test Plan, Final Validation
  - Include technology stack (from Phase 1)
  - Include cross-key analysis report (from Phase 1)
  - Expected outcome: Complete template with all sections
  
- [ ] **Task 2.2**: Implement phase breakdown algorithm
  - Analyze user request → identify concepts → map to affected layers
  - Create phases with concrete deliverables (3-7 phases preferred)
  - Detect phase dependencies (Phase N requires Phase M output)
  - Expected outcome: Logical phase sequence with dependency tree
  
- [ ] **Task 2.3**: Design individualized task prompt template per phase
  - Include: Phase header, context, implementation tasks (TODO items), validation checklist, test specification, orchestration script spec, commit format, debug markers, approval gate
  - Expected outcome: Complete task prompt template
  
- [ ] **Task 2.4**: Create TODO item structure
  - Format: `- [ ] **Task N.M**: {Action} - Expected outcome: {Observable result}`
  - Group by logical subtask boundaries
  - Expected outcome: Clear, actionable TODO items per phase
  
- [ ] **Task 2.5**: Add phase dependency validation
  - Each phase lists "Previous Phase Dependencies" with specific outputs required
  - Validation step checks for required files/commits before starting
  - Expected outcome: Dependency validation prevents premature phase execution
  
- [ ] **Task 2.6**: Implement work-log.md awareness
  - {key}.plan.md references work-log.md for execution details
  - work-log.md references {key}.plan.md for plan context
  - Plan remains immutable unless user requests changes
  - Expected outcome: Bidirectional references, clear separation of plan vs execution
  
- [ ] **Task 2.7**: **[C] Implement interactive phase preview system**
  - Before phase execution, show:
    * Files to be modified (with line ranges)
    * Estimated lines of code to change
    * Estimated completion time (based on complexity)
  - User can adjust scope before proceeding
  - Expected outcome: Preview mode allows informed phase approval
  
- [ ] **Task 2.8**: **[A] Generate rollback instructions per phase**
  - Each phase includes git commands to revert to previous checkpoint
  - Format: `git reset --hard checkpoint/{key}/{timestamp}` or `git revert {commit-sha}`
  - Rollback guide consolidated in Phase 6
  - Expected outcome: One-command rollback capability per phase

### Validation Checklist

- [ ] Build passes (N/A - documentation only)
- [ ] Lint validation passes (N/A - documentation only)
- [ ] Manual validation: Generate sample {key}.plan.md with 5 phases
- [ ] Manual validation: Preview mode shows accurate file modification estimates
- [ ] Manual validation: Rollback instructions work for test rollback scenario
- [ ] Manual validation: Phase dependency validation prevents out-of-order execution

### Playwright Test Specification

**Test File**: N/A (documentation-only phase)

**Validation Method**: Manual testing with sample key generation and preview simulation

### Orchestration Script Specification

**Script File**: N/A (documentation-only phase)

### Commit Format

```
[plan-prompt-enhancement] Phase 2: {key}.plan.md Document Generation with Preview

Implement comprehensive plan document generation with interactive preview
- Created {key}.plan.md template structure
  * Sections: Overview, Architecture Analysis, Phases, Progress Checklist, Test Plan, Final Validation
  * Includes technology stack and cross-key analysis
- Implemented phase breakdown algorithm
  * Analyzes user request → identifies concepts → maps to layers
  * Creates 3-7 phases with concrete deliverables
  * Detects phase dependencies
- Designed individualized task prompt template per phase
  * Includes: objectives, context, TODO items, validation, tests, orchestration, commit format, approval gate
- Created TODO item structure (actionable with expected outcomes)
- Added phase dependency validation (checks required outputs before starting)
- Implemented work-log.md awareness (bidirectional references, immutable plan)
- [C] Implemented interactive phase preview system
  * Shows files to modify, LOC estimates, completion time
  * User can adjust scope before execution
- [A] Generated rollback instructions per phase
  * Git commands to revert to previous checkpoint
  * Consolidated rollback guide in final phase

Debug: N/A (documentation-only)
```

### Debug Markers

N/A (documentation-only phase)

### Approval Gate

**User must explicitly approve**: "proceed to phase 3" or "begin phase 3"

---

## Phase 3: Test Generation Integration & Orchestration Library

### Objectives

1. Integrate test-generation.prompt.md invocation per phase
2. Implement test type decision matrix (functional E2E vs Percy visual regression)
3. Generate per-phase orchestration scripts
4. Create shared orchestration function library
5. Add browser log validation strategy
6. Implement headed vs headless mode decision logic
7. **[D] Implement automated test selector strategy**
8. **[E] Implement Percy baseline management**
9. **[B] Implement test flakiness detection**

### Context

**Files to Analyze**:
- `.github/prompts/plan.prompt.md` (current state from Phase 2)
- `.github/prompts/test-generation.prompt.md` (test generation patterns)
- `.github/prompts/shared/playwright-test-generation.md` (test type decisions)
- `.github/prompts/shared/test-orchestration-patterns.md` (PowerShell patterns)
- `.github/instructions/Links/PlaywrightQuickRef.md` (Playwright best practices)
- `Scripts/run-debug-panel-e2e-visual-test.ps1` (reference orchestration script)

**Previous Phase Dependencies**:
- {key}.plan.md template (Phase 2, Task 2.1)
- Phase breakdown algorithm (Phase 2, Task 2.2)
- Task prompt template (Phase 2, Task 2.3)

### Implementation Tasks (TODO Items)

- [ ] **Task 3.1**: Integrate test-generation.prompt.md invocation
  - Each phase specifies test type (functional E2E, Percy visual, or none)
  - Generate test-generation invocation string for task agent
  - Expected outcome: Automatic test creation per phase
  
- [ ] **Task 3.2**: Implement test type decision matrix
  - IF (UI component OR CSS OR layout changes) → Percy Visual Regression + Functional E2E, headed mode
  - ELSE IF (API OR navigation OR form submission) → Functional E2E only, headless mode
  - ELSE → None (documentation/logging only)
  - Expected outcome: Correct test type selected based on change type
  
- [ ] **Task 3.3**: Generate per-phase orchestration scripts
  - Script name: `Scripts/run-{key}-phase{N}-test.ps1`
  - Store in `.github/prompts.keys/{key}/scripts/` during development
  - Copy to `Scripts/` when phase finalized
  - Expected outcome: Orchestration script per phase test
  
- [ ] **Task 3.4**: Create shared orchestration function library
  - File: `.github/prompts.keys/{key}/scripts/Invoke-TestOrchestration.ps1`
  - Functions: `Start-AppProcess`, `Wait-AppReady`, `Stop-AppProcess`, `Invoke-PlaywrightTest`
  - All phase scripts import and use shared functions
  - Expected outcome: Zero script duplication, consistent patterns
  
- [ ] **Task 3.5**: Add browser log validation strategy
  - Distinguish server-side logs (Logger.LogInformation/LogWarning) vs client-side (console.log)
  - Document: Server-side debug markers WON'T appear in browser console
  - Verify functionality through behavior (redirects, data, state), not log messages
  - Expected outcome: Tests validate behavior, not log presence
  
- [ ] **Task 3.6**: Implement headed vs headless mode decision logic
  - Headed: Visual changes require human verification during development
  - Headless: Behavior-only tests, CI/CD environments
  - Default: Headed for Percy tests, headless for functional E2E
  - Expected outcome: Appropriate mode selected per test type
  
- [ ] **Task 3.7**: **[D] Implement automated test selector strategy**
  - Analyze component framework from .razor files (Blazor InputText vs HTML input)
  - Generate correct selectors automatically:
    * Blazor components: Use `#id` or `.css-class` selectors
    * HTML elements: Use `input[name="..."]` or `button[type="submit"]`
  - Include wait strategies: `await page.waitForSelector('#id', { state: 'visible', timeout: 15000 })`
  - Expected outcome: Framework-aware selectors, zero trial-and-error
  
- [ ] **Task 3.8**: **[E] Implement Percy baseline management**
  - After each phase completes, create Percy baseline: `percy snapshot {phase-name}`
  - In subsequent phases, compare against phase-specific baseline
  - If visual regression detected, identify which phase introduced it
  - Store baseline metadata in {key}.plan.md Progress Checklist
  - Expected outcome: Incremental visual validation, clear regression source
  
- [ ] **Task 3.9**: **[B] Implement test flakiness detection**
  - Run each phase test 3 times automatically
  - Track pass/fail patterns: 3/3 = stable, 2/3 or 1/3 = flaky, 0/3 = failing
  - Flag flaky tests with warning in test output
  - Report flakiness in Progress Checklist (e.g., "Test passing: 5/6 scenarios, 1 flaky")
  - Expected outcome: Unreliable tests identified early

### Validation Checklist

- [ ] Build passes (N/A - documentation only)
- [ ] Lint validation passes (N/A - documentation only)
- [ ] Manual validation: Generate sample test with auto-selectors (Blazor component)
- [ ] Manual validation: Orchestration script using shared library executes successfully
- [ ] Manual validation: Percy baseline created and subsequent test detects regression
- [ ] Manual validation: Flakiness detection runs test 3x and flags inconsistent results
- [ ] Manual validation: Browser log validation strategy correctly handles server vs client logs

### Playwright Test Specification

**Test File**: N/A (documentation-only phase, but test generation logic implemented)

**Validation Method**: Manual testing with sample test generation and orchestration execution

### Orchestration Script Specification

**Script File**: `.github/prompts.keys/plan-prompt-enhancement/scripts/Invoke-TestOrchestration.ps1` (shared library)

**Script Structure**:
```powershell
# Invoke-TestOrchestration.ps1 - Shared orchestration functions

function Start-AppProcess {
    param(
        [string]$AppPath,
        [string]$WorkingDirectory,
        [hashtable]$EnvironmentVariables = @{}
    )
    
    # Kill existing processes
    Get-Process -Name "dotnet" -ErrorAction SilentlyContinue | 
        Where-Object { $_.MainWindowTitle -like '*Kestrel*' } | 
        Stop-Process -Force
    
    # Launch app with Start-Process -PassThru
    $envVars = ($EnvironmentVariables.GetEnumerator() | ForEach-Object { "`$env:$($_.Key) = '$($_.Value)'" }) -join '; '
    
    $app = Start-Process "dotnet" `
        -ArgumentList "run" `
        -WorkingDirectory $WorkingDirectory `
        -PassThru -WindowStyle Minimized
    
    return $app
}

function Wait-AppReady {
    param(
        [string]$HealthCheckUrl = "https://localhost:9091",
        [int]$TimeoutSeconds = 60
    )
    
    Write-Host "Waiting for app to be ready..." -ForegroundColor Yellow
    $startTime = Get-Date
    $appReady = $false
    
    do {
        Start-Sleep -Milliseconds 500
        try {
            $response = Invoke-WebRequest -Uri $HealthCheckUrl -SkipCertificateCheck -TimeoutSec 2 -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                $appReady = $true
                Write-Host "[OK] App ready" -ForegroundColor Green
            }
        }
        catch { }
        
        $elapsed = ((Get-Date) - $startTime).TotalSeconds
        if ($elapsed -gt $TimeoutSeconds) {
            Write-Host "[ERROR] Timeout waiting for app" -ForegroundColor Red
            return $false
        }
    } while (-not $appReady)
    
    return $true
}

function Stop-AppProcess {
    param([System.Diagnostics.Process]$AppProcess)
    
    if ($AppProcess -and -not $AppProcess.HasExited) {
        Stop-Process -Id $AppProcess.Id -Force -ErrorAction SilentlyContinue
        Write-Host "[OK] App stopped" -ForegroundColor Green
    }
}

function Invoke-PlaywrightTest {
    param(
        [string]$TestFile,
        [string]$Mode = "headed",
        [bool]$UsePercy = $false,
        [int]$FlakinessRuns = 1
    )
    
    $modeArg = if ($Mode -eq "headed") { "--headed" } else { "" }
    $results = @()
    
    for ($i = 1; $i -le $FlakinessRuns; $i++) {
        if ($FlakinessRuns -gt 1) {
            Write-Host "[Run $i/$FlakinessRuns] Testing for flakiness..." -ForegroundColor Cyan
        }
        
        if ($UsePercy) {
            $output = npx percy exec -- npx playwright test $TestFile --reporter=list $modeArg 2>&1
        } else {
            $output = npx playwright test $TestFile --reporter=list $modeArg 2>&1
        }
        
        $exitCode = $LASTEXITCODE
        $results += @{ Run = $i; ExitCode = $exitCode; Output = $output }
    }
    
    # Analyze flakiness
    $passCount = ($results | Where-Object { $_.ExitCode -eq 0 }).Count
    $flakinessRatio = "$passCount/$FlakinessRuns"
    
    if ($FlakinessRuns -gt 1) {
        if ($passCount -eq $FlakinessRuns) {
            Write-Host "[OK] Test stable ($flakinessRatio passes)" -ForegroundColor Green
        } elseif ($passCount -gt 0) {
            Write-Host "[WARNING] Test flaky ($flakinessRatio passes)" -ForegroundColor Yellow
        } else {
            Write-Host "[ERROR] Test failing ($flakinessRatio passes)" -ForegroundColor Red
        }
    }
    
    return @{ Results = $results; FlakinessRatio = $flakinessRatio; IsFlaky = ($passCount -gt 0 -and $passCount -lt $FlakinessRuns) }
}

Export-ModuleMember -Function Start-AppProcess, Wait-AppReady, Stop-AppProcess, Invoke-PlaywrightTest
```

### Commit Format

```
[plan-prompt-enhancement] Phase 3: Test Generation Integration & Orchestration Library

Implement comprehensive test generation with automation and shared orchestration
- Integrated test-generation.prompt.md invocation per phase
- Implemented test type decision matrix (E2E vs Percy based on change type)
- Generated per-phase orchestration scripts (stored in .github/prompts.keys/{key}/scripts/)
- Created shared orchestration function library (Invoke-TestOrchestration.ps1)
  * Functions: Start-AppProcess, Wait-AppReady, Stop-AppProcess, Invoke-PlaywrightTest
  * Eliminates script duplication across phases
- Added browser log validation strategy
  * Distinguishes server-side (Logger) vs client-side (console.log)
  * Tests validate behavior, not log presence
- Implemented headed vs headless mode decision logic
  * Headed: Visual changes, Percy tests
  * Headless: Behavior-only, CI/CD
- [D] Implemented automated test selector strategy
  * Analyzes Blazor components vs HTML elements
  * Generates framework-aware selectors automatically
  * Includes wait strategies (waitForSelector with visibility)
- [E] Implemented Percy baseline management
  * Creates baseline after each phase
  * Compares subsequent phases against phase-specific baseline
  * Identifies which phase introduced visual regression
- [B] Implemented test flakiness detection
  * Runs each test 3x automatically
  * Tracks pass/fail patterns (3/3 stable, 2/3 or 1/3 flaky, 0/3 failing)
  * Flags flaky tests in output and Progress Checklist

Debug: N/A (documentation-only)
```

### Debug Markers

N/A (documentation-only phase)

### Approval Gate

**User must explicitly approve**: "proceed to phase 4" or "begin phase 4"

---

## Phase 4: Progress Tracking & Dependency Validation

### Objectives

1. Implement dynamic progress checklist in {key}.plan.md
2. Create checklist update protocol for task agent
3. Add phase completion verification
4. Track test pass/fail counts per phase
5. Integrate flakiness detection results into checklist
6. Implement phase dependency validation step

### Context

**Files to Analyze**:
- `.github/prompts/plan.prompt.md` (current state from Phase 3)
- `.github/prompts/task.prompt.md` (task execution workflow)
- `Workspaces/Data/CopilotContext.txt` (progress tracker example)

**Previous Phase Dependencies**:
- {key}.plan.md template (Phase 2, Task 2.1)
- Phase dependency tracking (Phase 2, Task 2.5)
- Flakiness detection (Phase 3, Task 3.9)

### Implementation Tasks (TODO Items)

- [ ] **Task 4.1**: Implement dynamic progress checklist in {key}.plan.md
  - Template format:
    ```markdown
    ## Progress Tracker
    
    - [ ] **Phase N**: {Title}
      - [ ] Implementation complete
      - [ ] Build passes (0 errors, 0 warnings)
      - [ ] Lint validation passes
      - [ ] Playwright test created: `{test-file}.spec.ts`
      - [ ] Test passing: {N}/{M} scenarios, {X} flaky
      - [ ] Percy baseline: {baseline-id}
      - [ ] Commit: {SHA}
      - [ ] Tag: checkpoint/{key}/{timestamp}
      - [ ] User approved next phase
    ```
  - Expected outcome: Complete checklist template in {key}.plan.md
  
- [ ] **Task 4.2**: Create checklist update protocol for task agent
  - After phase completion, task agent reads {key}.plan.md
  - Updates specific phase checklist items (marks ✅, fills in SHA, test results)
  - Writes updated {key}.plan.md back to disk
  - User sees: "Phase N complete (3/8 phases done)" message only
  - Expected outcome: Silent checklist updates, concise user messages
  
- [ ] **Task 4.3**: Add phase completion verification
  - Before marking phase complete, verify:
    * All TODO items checked off
    * Build passes (zero errors, zero warnings)
    * Lint validation passes
    * Playwright tests created and passing (or marked as flaky with justification)
    * Commit created with correct format
    * Git tag created (checkpoint/{key}/{timestamp})
  - If any item fails, halt and request user action
  - Expected outcome: Complete phase validation before proceeding
  
- [ ] **Task 4.4**: Track test pass/fail counts per phase
  - Parse Playwright test output: "N passed, M failed"
  - Include flakiness status: "5/6 scenarios passing, 1 flaky"
  - Record in Progress Checklist
  - Expected outcome: Clear test status visibility per phase
  
- [ ] **Task 4.5**: Integrate flakiness detection results
  - After flakiness detection runs (3x per test), capture results
  - Format: "Test stable (3/3)" or "Test flaky (2/3)" or "Test failing (0/3)"
  - Include in Progress Checklist test status
  - Expected outcome: Flaky tests flagged and tracked
  
- [ ] **Task 4.6**: Implement phase dependency validation step
  - Before starting phase N, check "Previous Phase Dependencies"
  - Verify required files exist (from previous phases)
  - Verify required commits exist (checkpoint tags)
  - Verify required tests pass (from previous phases)
  - If dependencies not met, halt and show error with resolution steps
  - Expected outcome: No out-of-order phase execution

### Validation Checklist

- [ ] Build passes (N/A - documentation only)
- [ ] Lint validation passes (N/A - documentation only)
- [ ] Manual validation: Checklist update protocol correctly modifies {key}.plan.md
- [ ] Manual validation: Phase completion verification catches missing TODO items
- [ ] Manual validation: Test pass/fail counts accurately parsed and recorded
- [ ] Manual validation: Flakiness detection results integrated into checklist
- [ ] Manual validation: Dependency validation prevents out-of-order execution

### Playwright Test Specification

**Test File**: N/A (documentation-only phase)

**Validation Method**: Manual testing with simulated phase completion and checklist updates

### Orchestration Script Specification

**Script File**: N/A (documentation-only phase)

### Commit Format

```
[plan-prompt-enhancement] Phase 4: Progress Tracking & Dependency Validation

Implement dynamic progress tracking and phase dependency validation
- Implemented dynamic progress checklist in {key}.plan.md
  * Template includes: implementation status, build/lint, tests, Percy baseline, commit, tag, approval
  * Updated silently by task agent after each phase
- Created checklist update protocol for task agent
  * Task agent reads {key}.plan.md, updates specific phase items, writes back
  * User sees concise message: "Phase N complete (3/8 phases done)"
- Added phase completion verification
  * Verifies: TODO items, build, lint, tests, commit, tag before marking complete
  * Halts if any item fails
- Tracked test pass/fail counts per phase
  * Parses Playwright output: "N passed, M failed"
  * Includes flakiness status: "5/6 scenarios, 1 flaky"
- Integrated flakiness detection results into checklist
  * Formats: "Test stable (3/3)", "Test flaky (2/3)", "Test failing (0/3)"
- Implemented phase dependency validation step
  * Checks "Previous Phase Dependencies" before starting
  * Verifies required files, commits, and passing tests
  * Halts with resolution steps if dependencies not met

Debug: N/A (documentation-only)
```

### Debug Markers

N/A (documentation-only phase)

### Approval Gate

**User must explicitly approve**: "proceed to phase 5" or "begin phase 5"

---

## Phase 5: Final Validation Phase with Regression Detection

### Objectives

1. Create comprehensive test suite that runs all phase tests
2. Generate master orchestration script using shared library
3. Implement incremental breakage detection
4. Integrate Percy regression tracking across phases
5. Generate flakiness summary report

### Context

**Files to Analyze**:
- `.github/prompts/plan.prompt.md` (current state from Phase 4)
- `.github/prompts.keys/{key}/scripts/Invoke-TestOrchestration.ps1` (shared library from Phase 3)
- `.github/prompts.keys/{key}/tests/*.spec.ts` (all phase tests)

**Previous Phase Dependencies**:
- Shared orchestration library (Phase 3, Task 3.4)
- Percy baseline management (Phase 3, Task 3.8)
- Flakiness detection (Phase 3, Task 3.9)
- Progress checklist (Phase 4, Task 4.1)

### Implementation Tasks (TODO Items)

- [ ] **Task 5.1**: Create comprehensive test suite
  - File: `Tests/UI/{key}-comprehensive-suite.spec.ts`
  - Import and run all phase tests sequentially
  - Include cross-phase integration tests (test interactions between phases)
  - Expected outcome: Single test file that validates all phases
  
- [ ] **Task 5.2**: Generate master orchestration script
  - File: `Scripts/run-{key}-full-regression.ps1`
  - Import shared orchestration library (Invoke-TestOrchestration.ps1)
  - Run comprehensive test suite
  - Report: Total tests run, passed, failed, flaky, duration
  - Exit with code 1 if ANY test fails (except flaky with > 50% pass rate)
  - Expected outcome: One-command full regression validation
  
- [ ] **Task 5.3**: Implement incremental breakage detection
  - Run each phase test independently (Phase 1 test, Phase 2 test, ..., Phase N test)
  - If Phase 1 test passes initially but fails during full regression, identify culprit phase
  - Report: "Phase X broke Phase Y functionality"
  - Expected outcome: Clear identification of which phase introduced breakage
  
- [ ] **Task 5.4**: **[E] Integrate Percy regression tracking**
  - Compare current screenshots against phase-specific Percy baselines
  - If visual regression detected, identify which phase introduced it
  - Report: "Visual regression in Phase Y introduced by Phase X changes"
  - Generate Percy regression report with side-by-side comparisons
  - Expected outcome: Clear visual regression source identification
  
- [ ] **Task 5.5**: **[B] Generate flakiness summary report**
  - Aggregate flakiness data from all phase tests
  - Report format:
    ```
    Flakiness Summary:
    - Phase 1: 3 tests (3 stable, 0 flaky, 0 failing)
    - Phase 2: 5 tests (4 stable, 1 flaky, 0 failing)
    - Phase 3: 2 tests (2 stable, 0 flaky, 0 failing)
    Total: 10 tests (9 stable, 1 flaky, 0 failing)
    Flaky Tests: Phase 2 - scenario "form submission with rapid clicks"
    ```
  - Expected outcome: Clear flakiness visibility across all phases

### Validation Checklist

- [ ] Build passes (N/A - documentation only)
- [ ] Lint validation passes (N/A - documentation only)
- [ ] Manual validation: Comprehensive test suite runs all phase tests
- [ ] Manual validation: Master orchestration script correctly uses shared library
- [ ] Manual validation: Incremental breakage detection identifies culprit phase
- [ ] Manual validation: Percy regression tracking identifies visual changes
- [ ] Manual validation: Flakiness summary report shows aggregate data

### Playwright Test Specification

**Test File**: `Tests/UI/{key}-comprehensive-suite.spec.ts`

**Location**: `.github/prompts.keys/{key}/tests/` (copy to Tests/UI/ when ready)

**Test Structure**:
```typescript
import { test, expect } from '@playwright/test';

test.describe('Comprehensive Regression Suite - plan-prompt-enhancement', () => {
  test.describe('Phase 1 Tests', () => {
    // Re-run phase 1 tests
    test('Technology stack detection works correctly', async ({ page }) => {
      // Test implementation
    });
  });
  
  test.describe('Phase 2 Tests', () => {
    // Re-run phase 2 tests
    test('Plan document generation creates correct structure', async ({ page }) => {
      // Test implementation
    });
  });
  
  test.describe('Phase 3 Tests', () => {
    // Re-run phase 3 tests
    test('Test generation creates valid Playwright tests', async ({ page }) => {
      // Test implementation
    });
  });
  
  test.describe('Phase 4 Tests', () => {
    // Re-run phase 4 tests
    test('Progress checklist updates correctly', async ({ page }) => {
      // Test implementation
    });
  });
  
  test.describe('Phase 5 Tests', () => {
    // Re-run phase 5 tests
    test('Comprehensive test suite runs all tests', async ({ page }) => {
      // Test implementation
    });
  });
  
  test.describe('Integration Tests', () => {
    test('Phase 2 plan references Phase 1 technology stack', async ({ page }) => {
      // Cross-phase integration test
    });
    
    test('Phase 3 tests use Phase 2 task prompts', async ({ page }) => {
      // Cross-phase integration test
    });
    
    test('Phase 4 checklist reflects Phase 3 test results', async ({ page }) => {
      // Cross-phase integration test
    });
  });
});
```

### Orchestration Script Specification

**Script File**: `Scripts/run-{key}-full-regression.ps1`

**Location**: `.github/prompts.keys/{key}/scripts/` (copy to Scripts/ when ready)

**Script Structure**:
```powershell
# run-plan-prompt-enhancement-full-regression.ps1
# Comprehensive regression suite for plan-prompt-enhancement

# Import shared orchestration library
. "$PSScriptRoot/../.github/prompts.keys/plan-prompt-enhancement/scripts/Invoke-TestOrchestration.ps1"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Comprehensive Regression Suite" -ForegroundColor Cyan
Write-Host "Key: plan-prompt-enhancement" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

try {
    # Start app
    $app = Start-AppProcess -AppPath "dotnet" -WorkingDirectory "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas"
    
    # Wait for app ready
    $ready = Wait-AppReady -HealthCheckUrl "https://localhost:9091" -TimeoutSeconds 60
    if (-not $ready) {
        Write-Host "[ERROR] App failed to start" -ForegroundColor Red
        exit 1
    }
    
    # Run comprehensive test suite with flakiness detection (3 runs)
    Write-Host "`n[INFO] Running comprehensive test suite..." -ForegroundColor Cyan
    $result = Invoke-PlaywrightTest -TestFile "Tests/UI/plan-prompt-enhancement-comprehensive-suite.spec.ts" -Mode "headed" -UsePercy $true -FlakinessRuns 3
    
    # Display results
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "Test Results Summary" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Flakiness Ratio: $($result.FlakinessRatio)" -ForegroundColor $(if ($result.IsFlaky) { "Yellow" } else { "Green" })
    
    # Check for failures
    $failureCount = ($result.Results | Where-Object { $_.ExitCode -ne 0 }).Count
    if ($failureCount -gt 0) {
        Write-Host "[ERROR] $failureCount test run(s) failed" -ForegroundColor Red
        exit 1
    }
    
    # Check for flakiness
    if ($result.IsFlaky) {
        Write-Host "[WARNING] Tests are flaky - investigate inconsistencies" -ForegroundColor Yellow
    }
    
    Write-Host "[OK] All tests passed" -ForegroundColor Green
}
finally {
    # Stop app
    Stop-AppProcess -AppProcess $app
}
```

### Commit Format

```
[plan-prompt-enhancement] Phase 5: Final Validation Phase with Regression Detection

Implement comprehensive test suite with regression and flakiness tracking
- Created comprehensive test suite (plan-prompt-enhancement-comprehensive-suite.spec.ts)
  * Runs all phase tests sequentially
  * Includes cross-phase integration tests
- Generated master orchestration script (run-plan-prompt-enhancement-full-regression.ps1)
  * Uses shared orchestration library (Invoke-TestOrchestration.ps1)
  * Reports: total tests, passed, failed, flaky, duration
  * Exits with code 1 if any test fails
- Implemented incremental breakage detection
  * Runs each phase test independently
  * Identifies which phase broke earlier functionality
  * Reports: "Phase X broke Phase Y functionality"
- [E] Integrated Percy regression tracking
  * Compares against phase-specific baselines
  * Identifies which phase introduced visual regression
  * Generates side-by-side comparison report
- [B] Generated flakiness summary report
  * Aggregates flakiness data from all phases
  * Reports: stable/flaky/failing counts per phase
  * Lists specific flaky tests with phase context

Debug: N/A (documentation-only)
```

### Debug Markers

N/A (documentation-only phase)

### Approval Gate

**User must explicitly approve**: "proceed to phase 6" or "begin phase 6"

---

## Phase 6: Documentation & User-Facing Summary

### Objectives

1. Generate user-facing plan summary template (succinct, no code)
2. Consolidate final {key}.plan.md
3. Create testing guidelines document (lessons learned)
4. Create rollback guide (consolidated from all phases)
5. Document interactive preview mode usage
6. Generate cross-key analysis report
7. Archive test results

### Context

**Files to Analyze**:
- `.github/prompts/plan.prompt.md` (current state from Phase 5)
- `.github/prompts.keys/{key}/{key}.plan.md` (complete plan document)
- All phase commits and checkpoints

**Previous Phase Dependencies**:
- Complete {key}.plan.md (all phases documented)
- All phase tests passing (Phase 5 validation)
- Rollback instructions per phase (Phase 2, Task 2.8)
- Interactive preview system (Phase 2, Task 2.7)
- Cross-key analysis (Phase 1, Task 1.5)

### Implementation Tasks (TODO Items)

- [ ] **Task 6.1**: Generate user-facing plan summary template
  - Sections: Overview, Technology Stack, Phases (title + deliverables only), Testing Strategy, Next Steps
  - NO code samples, NO detailed task prompts, NO orchestration scripts
  - Essential information only: phase objectives, deliverables, effort estimates
  - Expected outcome: Succinct summary template for user presentation
  
- [ ] **Task 6.2**: Consolidate final {key}.plan.md
  - Verify all sections complete: Overview, Architecture Analysis, all 6 phases, Progress Checklist, Test Plan, Final Validation
  - Mark all phases complete in Progress Checklist
  - Add final commit SHA and completion timestamp
  - Expected outcome: Complete, finalized {key}.plan.md
  
- [ ] **Task 6.3**: Create testing guidelines document
  - File: `.github/prompts.keys/{key}/testing-guidelines.md`
  - Sections: Lessons Learned, Common Pitfalls, Best Practices, Selector Strategies, Log Validation, Flakiness Mitigation
  - Based on CopilotContext.txt critical testing guidelines
  - Expected outcome: Reusable testing knowledge for future keys
  
- [ ] **Task 6.4**: **[A] Create consolidated rollback guide**
  - File: `.github/prompts.keys/{key}/rollback-guide.md`
  - List all phase checkpoints with rollback commands
  - Example: "To rollback Phase 3: `git reset --hard checkpoint/plan-prompt-enhancement/20251020-120000`"
  - Include safety checks: verify current state, backup uncommitted changes
  - Expected outcome: One-stop rollback reference
  
- [ ] **Task 6.5**: **[C] Document interactive preview mode usage**
  - File: `.github/prompts.keys/{key}/preview-mode-guide.md`
  - How to trigger preview: plan agent shows preview before phase execution
  - What preview shows: files to modify, LOC estimates, completion time
  - How to adjust scope: user feedback before proceeding
  - Expected outcome: Clear preview mode documentation
  
- [ ] **Task 6.6**: **[G] Generate cross-key analysis report**
  - File: `.github/prompts.keys/{key}/cross-key-analysis.md`
  - Sections: Similar Patterns Found, Reusable Tests, Reusable Scripts, Conflicting Changes, Recommendations
  - Based on Phase 1 cross-key scan results
  - Expected outcome: Actionable insights from existing keys
  
- [ ] **Task 6.7**: Archive test results
  - Copy all test results to `.github/prompts.keys/{key}/test-results/`
  - Include: Playwright HTML reports, Percy snapshots, flakiness reports
  - Create index.md linking to all results
  - Expected outcome: Complete test result archive

### Validation Checklist

- [ ] Build passes (N/A - documentation only)
- [ ] Lint validation passes (N/A - documentation only)
- [ ] Manual validation: User-facing summary is succinct and clear
- [ ] Manual validation: Final {key}.plan.md is complete and accurate
- [ ] Manual validation: Testing guidelines document is comprehensive
- [ ] Manual validation: Rollback guide has correct checkpoint references
- [ ] Manual validation: Preview mode guide is clear and actionable
- [ ] Manual validation: Cross-key analysis report provides useful insights
- [ ] Manual validation: Test results properly archived and indexed

### Playwright Test Specification

**Test File**: N/A (documentation-only phase)

**Validation Method**: Manual review of all documentation artifacts

### Orchestration Script Specification

**Script File**: N/A (documentation-only phase)

### Commit Format

```
[plan-prompt-enhancement] Phase 6: Documentation & User-Facing Summary

Finalize documentation and create user-facing summaries
- Generated user-facing plan summary template
  * Sections: Overview, Technology Stack, Phases (titles only), Testing Strategy, Next Steps
  * NO code samples, essential information only
- Consolidated final {key}.plan.md
  * All 6 phases complete, Progress Checklist finalized
  * Final commit SHA and completion timestamp added
- Created testing guidelines document (testing-guidelines.md)
  * Lessons Learned, Common Pitfalls, Best Practices, Selector Strategies, Log Validation, Flakiness Mitigation
  * Based on CopilotContext.txt patterns
- [A] Created consolidated rollback guide (rollback-guide.md)
  * All phase checkpoints with rollback commands
  * Safety checks: verify state, backup uncommitted changes
- [C] Documented interactive preview mode usage (preview-mode-guide.md)
  * How to trigger, what preview shows, how to adjust scope
- [G] Generated cross-key analysis report (cross-key-analysis.md)
  * Similar patterns, reusable tests/scripts, conflicting changes, recommendations
- Archived test results
  * Playwright HTML reports, Percy snapshots, flakiness reports
  * Created index.md linking to all results

Debug: N/A (documentation-only)
```

### Debug Markers

N/A (documentation-only phase)

### Approval Gate

**User must explicitly approve**: "mark complete" or "finalize implementation"

---

## Progress Tracker

- [ ] **Phase 1**: Parameter Enhancement & Stack Discovery
  - [ ] Implementation complete
  - [ ] Build passes (N/A - documentation only)
  - [ ] Lint validation passes (N/A - documentation only)
  - [ ] Manual validation: Technology stack correctly detected
  - [ ] Manual validation: Cross-key scanner identifies patterns
  - [ ] Commit: [pending]
  - [ ] Tag: checkpoint/plan-prompt-enhancement/[timestamp]
  - [ ] User approved next phase

- [ ] **Phase 2**: {key}.plan.md Document Generation with Preview
  - [ ] Implementation complete
  - [ ] Build passes (N/A - documentation only)
  - [ ] Lint validation passes (N/A - documentation only)
  - [ ] Manual validation: Sample {key}.plan.md generated with 5 phases
  - [ ] Manual validation: Preview mode shows accurate estimates
  - [ ] Manual validation: Rollback instructions work
  - [ ] Commit: [pending]
  - [ ] Tag: checkpoint/plan-prompt-enhancement/[timestamp]
  - [ ] User approved next phase

- [ ] **Phase 3**: Test Generation Integration & Orchestration Library
  - [ ] Implementation complete
  - [ ] Build passes (N/A - documentation only)
  - [ ] Lint validation passes (N/A - documentation only)
  - [ ] Manual validation: Sample test with auto-selectors generated
  - [ ] Manual validation: Orchestration script using shared library works
  - [ ] Manual validation: Percy baseline created and regression detected
  - [ ] Manual validation: Flakiness detection runs 3x and flags inconsistencies
  - [ ] Commit: [pending]
  - [ ] Tag: checkpoint/plan-prompt-enhancement/[timestamp]
  - [ ] User approved next phase

- [ ] **Phase 4**: Progress Tracking & Dependency Validation
  - [ ] Implementation complete
  - [ ] Build passes (N/A - documentation only)
  - [ ] Lint validation passes (N/A - documentation only)
  - [ ] Manual validation: Checklist update protocol modifies {key}.plan.md
  - [ ] Manual validation: Phase completion verification catches missing items
  - [ ] Manual validation: Dependency validation prevents out-of-order execution
  - [ ] Commit: [pending]
  - [ ] Tag: checkpoint/plan-prompt-enhancement/[timestamp]
  - [ ] User approved next phase

- [ ] **Phase 5**: Final Validation Phase with Regression Detection
  - [ ] Implementation complete
  - [ ] Build passes (N/A - documentation only)
  - [ ] Lint validation passes (N/A - documentation only)
  - [ ] Manual validation: Comprehensive test suite runs all tests
  - [ ] Manual validation: Incremental breakage detection identifies culprit phase
  - [ ] Manual validation: Percy regression tracking identifies visual changes
  - [ ] Commit: [pending]
  - [ ] Tag: checkpoint/plan-prompt-enhancement/[timestamp]
  - [ ] User approved next phase

- [ ] **Phase 6**: Documentation & User-Facing Summary
  - [ ] Implementation complete
  - [ ] Build passes (N/A - documentation only)
  - [ ] Lint validation passes (N/A - documentation only)
  - [ ] Manual validation: User-facing summary is succinct and clear
  - [ ] Manual validation: All documentation artifacts complete
  - [ ] Commit: [pending]
  - [ ] Tag: checkpoint/plan-prompt-enhancement/[timestamp]
  - [ ] User approved completion

- [ ] **Final Validation**: Comprehensive Test Suite
  - [ ] All phase tests passing
  - [ ] Full regression suite passing
  - [ ] No incremental breakage detected
  - [ ] Ready for merge

---

## Test Plan

### Functional E2E Tests

N/A - This is a meta-planning enhancement (documentation-only changes to plan.prompt.md)

### Visual Regression Tests

N/A - No UI changes

### Validation Strategy

**Manual Validation Per Phase**:
1. Phase 1: Technology stack detection, cross-key scanning
2. Phase 2: Sample {key}.plan.md generation, preview mode, rollback instructions
3. Phase 3: Test generation with auto-selectors, orchestration scripts, Percy baselines, flakiness detection
4. Phase 4: Checklist updates, dependency validation
5. Phase 5: Comprehensive test suite, regression detection
6. Phase 6: Documentation completeness and clarity

**Comprehensive Validation**:
- Generate full sample key with multiple phases
- Execute all phases using generated task prompts
- Verify all enhancements working (A, B, C, D, E, G)
- Confirm documentation is complete and accurate

---

## Final Validation

### Comprehensive Test Suite Execution

**Script**: `Scripts/run-plan-prompt-enhancement-full-regression.ps1`

**Expected Results**:
- All manual validations pass
- Sample key generation works end-to-end
- All enhancements function as specified
- Documentation is complete and user-friendly

**Success Criteria**:
- ✅ plan.prompt.md successfully generates {key}.plan.md for sample key
- ✅ Technology stack correctly detected (ASP.NET Core 8.0, Playwright 1.40.0)
- ✅ Cross-key analysis identifies patterns from existing keys
- ✅ Preview mode shows accurate file and LOC estimates
- ✅ Rollback instructions work for sample rollback
- ✅ Test generation creates valid Playwright tests with auto-selectors
- ✅ Orchestration scripts use shared library (zero duplication)
- ✅ Percy baseline management tracks regressions across phases
- ✅ Flakiness detection identifies unstable tests
- ✅ Progress checklist updates silently
- ✅ Dependency validation prevents out-of-order execution
- ✅ User-facing summaries are succinct and clear

---

## References

### Required Reading

- `.github/instructions/SelfAwareness.instructions.md` (global operating guardrails)
- `.github/prompts/task.prompt.md` (task execution workflow)
- `.github/prompts/test-generation.prompt.md` (test generation patterns)
- `.github/prompts/shared/execution-flow.md` (step-by-step workflow)
- `.github/prompts/shared/playwright-test-generation.md` (test type decisions)
- `.github/prompts/shared/test-orchestration-patterns.md` (PowerShell patterns)
- `.github/instructions/Links/PlaywrightQuickRef.md` (Playwright best practices)
- `.github/instructions/Links/InfrastructureQuickRef.md` (database rules)

### Reference Implementations

- `Workspaces/Data/CopilotContext.txt` (userlanding key - phased execution example)
- `.github/prompts.keys/hcp/work-log.md` (work log patterns)
- `.github/prompts.keys/userlanding/` (comprehensive key structure)
- `Scripts/run-debug-panel-e2e-visual-test.ps1` (orchestration script reference)

---

## Enhancement Implementation Details

### [A] Phase Rollback Strategy

**Implementation**: Each phase in {key}.plan.md includes rollback instructions in commit format section
**Consolidated Guide**: `.github/prompts.keys/{key}/rollback-guide.md` created in Phase 6
**Usage**: `git reset --hard checkpoint/{key}/{timestamp}` or `git revert {commit-sha}`

### [B] Test Flakiness Detection

**Implementation**: `Invoke-PlaywrightTest` function in shared library runs tests 3x
**Results**: "Test stable (3/3)", "Test flaky (2/3)", "Test failing (0/3)"
**Integration**: Flakiness status included in Progress Checklist and summary report (Phase 5)

### [C] Interactive Phase Approval with Preview

**Implementation**: Before phase execution, plan agent displays:
- Files to be modified (with line ranges)
- Estimated lines of code to change
- Estimated completion time
**User Control**: User can adjust scope before proceeding
**Documentation**: `.github/prompts.keys/{key}/preview-mode-guide.md` created in Phase 6

### [D] Automated Test Selector Strategy

**Implementation**: Analyze component framework from .razor files:
- Blazor components → `#id` or `.css-class` selectors + `waitForSelector` with visibility
- HTML elements → `input[name="..."]` or `button[type="submit"]`
**Output**: Framework-aware selectors in generated Playwright tests
**Benefit**: Zero trial-and-error, tests work on first run

### [E] Percy Baseline Management

**Implementation**:
- After each phase completes, create Percy baseline: `percy snapshot {phase-name}`
- In subsequent phases, compare against phase-specific baseline
- If regression detected, identify which phase introduced it
**Integration**: Percy baseline ID tracked in Progress Checklist
**Report**: Percy regression report with side-by-side comparisons (Phase 5)

### [G] Cross-Key Dependency Detection

**Implementation**: Scan `.github/prompts.keys/*/` for:
- Similar work patterns (work-log.md analysis)
- Reusable tests (tests/*.spec.ts comparison)
- Reusable orchestration scripts (scripts/*.ps1 comparison)
- Conflicting file changes (same files modified by multiple keys)
**Output**: Cross-key analysis report in {key}.plan.md and cross-key-analysis.md (Phase 6)
**Benefit**: Learn from previous implementations, avoid conflicts, reuse proven patterns

---

## Lessons Learned (To Be Documented in Phase 6)

*This section will be populated during implementation based on challenges encountered*

---

## Git Summary Line

```
Enhanced plan.prompt.md with phased execution, test automation, and comprehensive tracking (Enhancements: A,B,C,D,E,G)
```

---

**END OF PLAN DOCUMENT**

*This comprehensive plan is stored in `.github/prompts.keys/plan-prompt-enhancement/plan-prompt-enhancement.plan.md`*  
*User sees only the succinct summary during planning phase*  
*Task agent reads this document to execute each phase with complete context*
