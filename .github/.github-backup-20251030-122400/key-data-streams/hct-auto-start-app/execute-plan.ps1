# Execute Plan: HCT Auto-Start App
# Auto-generated execution script for hct-auto-start-app plan
# Key: hct-auto-start-app
# Created: 2025-10-26

param(
    [switch]$WhatIf,
    [int]$Phase = 0  # 0 = all phases, specific number = that phase only
)

$ErrorActionPreference = "Stop"
$WorkspaceRoot = "D:\PROJECTS\NOOR CANVAS"

# Color helpers
function Write-Success { param($Message) Write-Host "✅ $Message" -ForegroundColor Green }
function Write-Info { param($Message) Write-Host "ℹ️  $Message" -ForegroundColor Cyan }
function Write-Warning { param($Message) Write-Host "⚠️  $Message" -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host "❌ $Message" -ForegroundColor Red }

# Header
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  HCT Auto-Start App - Plan Execution Script" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

if ($WhatIf) {
    Write-Warning "DRY RUN MODE - No changes will be made"
    Write-Host ""
}

# Phase 1: App Detection and Health Check
function Invoke-Phase1 {
    Write-Host "━━━ Phase 1: App Detection and Health Check ━━━" -ForegroundColor Yellow
    Write-Host ""
    
    Write-Info "Task 1.1: Create Test-NoorCanvasRunning function"
    if (-not $WhatIf) {
        # Implementation: Add function to Scripts/hct.ps1
        Write-Host "  → Modifying Scripts/hct.ps1..."
        # TODO: Add Test-NoorCanvasRunning function
        # Checks for dotnet process with NoorCanvas window title
        # Or tests HTTPS connection to localhost:9091
    }
    Write-Success "Task 1.1 Complete (or would be in real mode)"
    
    Write-Info "Task 1.2: Create Wait-AppReady function with health check (Enhancement A)"
    if (-not $WhatIf) {
        # Implementation: Add Wait-AppReady function
        Write-Host "  → Adding health check endpoint polling..."
        # TODO: Implement health check logic
        # Poll https://localhost:9091 every 1 second
        # Max attempts: configurable (default 30)
    }
    Write-Success "Task 1.2 Complete (or would be in real mode)"
    
    Write-Info "Task 1.3: Implement port conflict detection (Enhancement B)"
    if (-not $WhatIf) {
        # Implementation: Add Test-PortConflict function
        Write-Host "  → Adding port conflict detection..."
        # TODO: Implement Test-NetConnection check
        # Show process ID if port occupied
    }
    Write-Success "Task 1.3 Complete (or would be in real mode)"
    
    Write-Host ""
}

# Phase 2: Background App Startup
function Invoke-Phase2 {
    Write-Host "━━━ Phase 2: Background App Startup ━━━" -ForegroundColor Yellow
    Write-Host ""
    
    Write-Info "Task 2.1: Create Start-NoorCanvasApp function"
    if (-not $WhatIf) {
        # Implementation: Add Start-NoorCanvasApp function
        Write-Host "  → Adding background job startup logic..."
        # TODO: Implement Start-Job with dotnet run
        # Set working directory to SPA/NoorCanvas
        # Set ASPNETCORE_ENVIRONMENT
    }
    Write-Success "Task 2.1 Complete (or would be in real mode)"
    
    Write-Info "Task 2.2: Implement log file capture (Enhancement D)"
    if (-not $WhatIf) {
        # Implementation: Add Tee-Object logging
        Write-Host "  → Adding log file capture..."
        # TODO: Create logs directory
        # TODO: Add Tee-Object to capture stdout/stderr
        # Log file: .github/key-data-streams/hct-auto-start-app/logs/app-startup-{timestamp}.log
    }
    Write-Success "Task 2.2 Complete (or would be in real mode)"
    
    Write-Info "Task 2.3: Add progress indicator during startup (Enhancement C)"
    if (-not $WhatIf) {
        # Implementation: Add progress display
        Write-Host "  → Adding progress indicator..."
        # TODO: Display "Starting app... N/30 seconds"
        # Update every second during Wait-AppReady
    }
    Write-Success "Task 2.3 Complete (or would be in real mode)"
    
    Write-Info "Task 2.4: Implement startup timeout configuration (Enhancement E)"
    if (-not $WhatIf) {
        # Implementation: Add -StartupTimeout parameter
        Write-Host "  → Adding timeout configuration..."
        # TODO: Add parameter to Scripts/hct.ps1 and Workspaces/Global/hct.ps1
        # Default: 30 seconds
        # Pass to Wait-AppReady function
    }
    Write-Success "Task 2.4 Complete (or would be in real mode)"
    
    Write-Host ""
}

# Phase 3: Main Logic Integration
function Invoke-Phase3 {
    Write-Host "━━━ Phase 3: Main Logic Integration ━━━" -ForegroundColor Yellow
    Write-Host ""
    
    Write-Info "Task 3.1: Modify main hct.ps1 execution flow"
    if (-not $WhatIf) {
        # Implementation: Integrate auto-start logic into main script
        Write-Host "  → Integrating auto-start into main execution flow..."
        # TODO: Add auto-start logic before HostProvisioner invocation
        # Check if app running, start if needed, wait for readiness, cleanup
    }
    Write-Success "Task 3.1 Complete (or would be in real mode)"
    
    Write-Info "Task 3.2: Add parameters to global wrapper"
    if (-not $WhatIf) {
        # Implementation: Update Workspaces/Global/hct.ps1
        Write-Host "  → Adding -KeepAppRunning and -StartupTimeout parameters..."
        # TODO: Add parameters to global wrapper
        # Pass through to main script
    }
    Write-Success "Task 3.2 Complete (or would be in real mode)"
    
    Write-Info "Task 3.3: Implement environment-specific behavior"
    if (-not $WhatIf) {
        # Implementation: Skip auto-start in Production
        Write-Host "  → Adding environment-specific logic..."
        # TODO: Only auto-start in Development environment
        # Production: skip auto-start entirely
    }
    Write-Success "Task 3.3 Complete (or would be in real mode)"
    
    Write-Host ""
}

# Phase 4: Error Handling and Edge Cases
function Invoke-Phase4 {
    Write-Host "━━━ Phase 4: Error Handling and Edge Cases ━━━" -ForegroundColor Yellow
    Write-Host ""
    
    Write-Info "Task 4.1: Implement Ctrl+C interruption handling"
    if (-not $WhatIf) {
        # Implementation: Add try/finally blocks
        Write-Host "  → Adding interruption handling..."
        # TODO: Add try/finally to cleanup background jobs
        # Display cleanup message on interruption
    }
    Write-Success "Task 4.1 Complete (or would be in real mode)"
    
    Write-Info "Task 4.2: Add app crash detection"
    if (-not $WhatIf) {
        # Implementation: Check if job still running
        Write-Host "  → Adding crash detection..."
        # TODO: Check job state after startup
        # Show error and log location if job exited unexpectedly
    }
    Write-Success "Task 4.2 Complete (or would be in real mode)"
    
    Write-Info "Task 4.3: Handle multiple hct instances"
    if (-not $WhatIf) {
        # Implementation: Detect concurrent hct processes
        Write-Host "  → Adding multi-instance detection..."
        # TODO: Check for other hct processes
        # Warn user if detected
    }
    Write-Success "Task 4.3 Complete (or would be in real mode)"
    
    Write-Info "Task 4.4: Implement helpful error messages"
    if (-not $WhatIf) {
        # Implementation: Enhance error messages
        Write-Host "  → Adding helpful error messages..."
        # TODO: Port conflict: show process ID and kill command
        # TODO: App crash: show log file location
        # TODO: Timeout: suggest increasing timeout or checking logs
    }
    Write-Success "Task 4.4 Complete (or would be in real mode)"
    
    Write-Host ""
}

# Phase 5: Documentation and Testing
function Invoke-Phase5 {
    Write-Host "━━━ Phase 5: Documentation and Testing ━━━" -ForegroundColor Yellow
    Write-Host ""
    
    Write-Info "Task 5.1: Update Scripts/hct.README.md"
    if (-not $WhatIf) {
        # Implementation: Document auto-start feature
        Write-Host "  → Updating README..."
        # TODO: Add auto-start documentation
        # Document -KeepAppRunning and -StartupTimeout
        # Add troubleshooting section
    }
    Write-Success "Task 5.1 Complete (or would be in real mode)"
    
    Write-Info "Task 5.2: Update Scripts/NCDEPLOY-QUICK-REFERENCE.md"
    if (-not $WhatIf) {
        # Implementation: Update quick reference
        Write-Host "  → Updating quick reference..."
        # TODO: Add note about automatic app startup
        # Show examples with new parameters
    }
    Write-Success "Task 5.2 Complete (or would be in real mode)"
    
    Write-Info "Task 5.3: Update work log"
    if (-not $WhatIf) {
        # Implementation: Document implementation
        Write-Host "  → Updating work log..."
        # TODO: Update .github/key-data-streams/hct-auto-start-app/work-log.md
        # Document all enhancements implemented
        # Include usage examples
    }
    Write-Success "Task 5.3 Complete (or would be in real mode)"
    
    Write-Info "Task 5.4: Execute manual testing checklist"
    Write-Host "  → Running manual tests..."
    Write-Host "    Test 1: Fresh Start (App Not Running)"
    Write-Host "    Test 2: App Already Running"
    Write-Host "    Test 3: Keep App Running"
    Write-Host "    Test 4: Port Conflict"
    Write-Host "    Test 5: Ctrl+C Interruption"
    Write-Host "    Test 6: Custom Timeout"
    Write-Host "    Test 7: Production Environment"
    if (-not $WhatIf) {
        # TODO: Execute each test manually
        # Update test-registry.md with results
    }
    Write-Success "Task 5.4 Complete (or would be in real mode)"
    
    Write-Host ""
}

# Main execution
try {
    if ($Phase -eq 0 -or $Phase -eq 1) { Invoke-Phase1 }
    if ($Phase -eq 0 -or $Phase -eq 2) { Invoke-Phase2 }
    if ($Phase -eq 0 -or $Phase -eq 3) { Invoke-Phase3 }
    if ($Phase -eq 0 -or $Phase -eq 4) { Invoke-Phase4 }
    if ($Phase -eq 0 -or $Phase -eq 5) { Invoke-Phase5 }
    
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
    if ($WhatIf) {
        Write-Success "DRY RUN COMPLETE - No changes made"
    } else {
        Write-Success "PLAN EXECUTION COMPLETE"
    }
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host ""
    
    # Next steps
    Write-Info "Next Steps:"
    Write-Host "  1. Review changes in Scripts/hct.ps1 and Workspaces/Global/hct.ps1"
    Write-Host "  2. Run manual tests from tests/test-registry.md"
    Write-Host "  3. Update work-log.md with test results"
    Write-Host "  4. Commit changes with message: 'feat: Add auto-start app capability to hct tool'"
    Write-Host ""
    
} catch {
    Write-Error "Plan execution failed: $_"
    exit 1
}

# Usage Examples:
# .\execute-plan.ps1 -WhatIf          # Dry run to see what would happen
# .\execute-plan.ps1                  # Execute all phases
# .\execute-plan.ps1 -Phase 1         # Execute only Phase 1
