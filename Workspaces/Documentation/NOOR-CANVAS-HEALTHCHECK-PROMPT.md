# NOOR Canvas Comprehensive System Healthcheck Prompt

**Purpose**: Comprehensive workspace validation including issue cleanup, code verification, documentation alignment, and global command functionality  
**Usage**: Triggered by command "Run NOOR Canvas healthcheck" - executes complete systematic verification  
**Last Updated**: September 14, 2025  
**Version**: v2.0 - Enhanced with Issue Validation & Code Verification

---

**Context**: You are GitHub Copilot working on NOOR Canvas (Islamic content sharing platform) on September 14, 2025. Recent work included major issue tracker cleanup (37+ files deleted), Phase 4 preparation, and Host Dashboard elimination.

## **Recent Context (September 14, 2025)**
- **Major Cleanup**: Removed 40+ obsolete issues from Phase 1-3 that were completed
- **Phase 4 Preparation**: Host Dashboard elimination complete, branding integration ready
- **Code Quality**: Host UX streamlining implemented (direct CreateSession routing)
- **Documentation**: All implementation work consolidated in IMPLEMENTATION-TRACKER.MD (single source of truth)
- **Git Status**: Clean commit (3dbc420) with 37 files changed, build successful, all tests passing

## **Healthcheck Objectives**

### **1. Issue Tracker Cleanup & Validation**
**Systematically clean up obsolete issues and validate claimed fixes against actual code:**

**Required Actions**:
- **Review NC-ISSUE-TRACKER.MD**: Identify issues marked as COMPLETED but may not actually be resolved
- **Code Verification**: For each COMPLETED issue, verify the fix exists in actual codebase
- **Test Runner Validation**: Run relevant tests to confirm claimed fixes actually work
- **Status Reversion**: If fixes don't exist or don't work, move issues back to NOT STARTED or IN PROGRESS
- **Remove Obsolete Issues**: Delete issue files for problems that are genuinely resolved and no longer relevant
- **Consolidate Duplicates**: Merge duplicate or overlapping issues into single tracking items

**Systematic Issue Validation Process**:
```
For each COMPLETED issue in IssueTracker/COMPLETED/:
1. Read issue description and claimed resolution from .md file
2. Identify specific code changes that should exist based on resolution
3. Use grep_search to find relevant code patterns in codebase
4. Use read_file to verify actual implementation matches claimed fix
5. Run applicable tests to confirm functionality works
6. Manual validation: Test actual behavior if automated tests unavailable

Validation Decision Matrix:
✅ KEEP AS COMPLETED: Fix exists in code, functionality verified, tests pass
🔄 REVERT TO NOT STARTED: Fix doesn't exist or doesn't work as claimed
🔄 REVERT TO IN PROGRESS: Partial fix exists but incomplete implementation
🗑️ DELETE ISSUE: Problem genuinely resolved/obsolete, no longer relevant

Documentation Updates Required:
- Move issue files between status folders based on validation results
- Update NC-ISSUE-TRACKER.MD status icons and counts
- Add verification notes to issues that fail validation
- Update IMPLEMENTATION-TRACKER.MD if phase completion affected
```

**High-Priority Issues for Validation**:
- **Host Authentication Issues**: Verify authentication actually works end-to-end
- **Database Connectivity Issues**: Confirm database operations function correctly  
- **API Endpoint Issues**: Validate endpoints exist and return expected responses
- **Routing Issues**: Test actual navigation and page loading functionality
- **Build/Compilation Issues**: Verify builds succeed without claimed errors

**Code Verification Examples**:
```powershell
# Host Dashboard removal verification
grep_search -query "HostDashboard" -includePattern "**/*.razor" 
# Should return no results if properly removed

# Host authentication endpoint verification  
read_file "SPA/NoorCanvas/Controllers/HostController.cs" 1 50
# Should contain authenticate endpoint

# CreateSession HttpClient pattern verification
grep_search -query "HttpClientFactory" -includePattern "SPA/NoorCanvas/Pages/CreateSession.razor"
# Should show HttpClientFactory usage if Issue-53 resolved
```

### **2. Implementation Reality Verification**
**Verify actual codebase against claimed implementations in IMPLEMENTATION-TRACKER.MD:**

**Required Actions**:
- **Controller Verification**: Count and validate actual controllers exist (should be 8: Admin, Annotations, Health, Host, HostProvisioner, Issue, Logs, Participant)
- **SignalR Hub Verification**: Confirm 3 hubs exist and are functional (SessionHub, AnnotationHub, QAHub)  
- **Database Schema Verification**: Validate 13 canvas tables exist and migrations applied
- **Host UX Verification**: Confirm Host Dashboard removal and direct CreateSession routing works
- **Test Coverage Verification**: Count actual test files and validate claimed 120+ test cases
- **API Endpoint Verification**: Ensure documented endpoints actually exist and return expected responses

**Code Reality Checks**:
```
✅ VERIFY: Host Dashboard removed (no HostDashboard.razor)
✅ VERIFY: Host.razor routes to /host/session/create?guid={guid}
✅ VERIFY: HostController has no /dashboard endpoint  
✅ VERIFY: CreateSession.razor uses HttpClientFactory pattern
✅ VERIFY: All 8 controllers exist and compile
✅ VERIFY: All 3 SignalR hubs exist and have proper methods
```

### **3. Document Alignment & Code Synchronization**
**Ensure all documentation matches actual implementation (no aspirational claims):**

**Required Actions**:
- **IMPLEMENTATION-TRACKER.MD Accuracy**: Update completion percentages based on verified reality
- **Phase Status Accuracy**: Ensure Phase 1-3 completion claims match actual implementation
- **Remove Aspirational Content**: Delete any documentation that describes unimplemented features
- **Consolidate All Implementation Docs**: Ensure everything is in IMPLEMENTATION-TRACKER.MD (single source of truth)
- **API Documentation Accuracy**: Ensure documented API endpoints match actual controller methods

### **4. Global Commands Functionality Assessment**
**Test and repair all global commands with actual verification:**

**Commands to Verify with Execution Tests**:
- **`nc -Help`** - NOOR Canvas application runner (verify help output and port management)
- **`nct -Help`** - Host token generator (verify interactive functionality)
- **`ncdoc -Help`** - Documentation server (verify DocFX site launching)
- **`iiskill -Help`** - IIS Express process killer (**KNOWN ISSUE**: Missing from PowerShell profile)

**Comprehensive Command Testing**:
```powershell
# Test each command and validate actual functionality
nc -Help        # Should display usage information
nct -Help       # Should show token generation help
ncdoc -Help     # Should show DocFX documentation help  
iiskill -Help   # Should show process killer help (likely missing)
```

**Required Fixes Based on Test Results**:
- **Fix `iiskill` global command**: Add missing function to PowerShell profile
- **Verify PowerShell profile**: Validate all 4 commands load correctly on startup
- **Test actual functionality**: Don't just check help - test real command execution
- **Update setup script**: Run `Workspaces/Global/setup-global-commands.ps1` if repairs needed

**Profile Validation & Auto-Repair**:
```powershell
# Check current profile and repair if needed
Get-Content $PROFILE | Select-String "function nc"    # Should exist
Get-Content $PROFILE | Select-String "function nct"   # Should exist  
Get-Content $PROFILE | Select-String "function ncdoc" # Should exist
Get-Content $PROFILE | Select-String "function iiskill" # Likely missing
```

## **Execution Instructions**

**Phase 1: Issue Tracker Validation & Cleanup**
1. **Audit COMPLETED issues**: Review each completed issue against actual codebase
2. **Verify claimed fixes exist**: Use `grep_search` and `read_file` to confirm code changes
3. **Test actual functionality**: Run tests or manual validation for critical fixes
4. **Revert false completions**: Move incorrectly marked issues back to NOT STARTED/IN PROGRESS
5. **Remove obsolete issues**: Delete issue files for genuinely resolved problems
6. **Update issue statistics**: Ensure tracker statistics reflect accurate counts after cleanup

**Phase 2: Implementation Reality Check** 
1. **Count actual components**: Verify controllers (8), hubs (3), database tables (13)
2. **Validate key functionality**: Test Host authentication → CreateSession direct routing
3. **Verify Host Dashboard removal**: Confirm no HostDashboard.razor or /dashboard endpoints exist
4. **Check test coverage**: Count actual test files in Tests/NoorCanvas.Core.Tests/
5. **Validate API endpoints**: Ensure documented endpoints actually exist and respond correctly

**Phase 3: Documentation Alignment**
1. **Update IMPLEMENTATION-TRACKER.MD**: Correct completion percentages based on verified reality
2. **Remove aspirational content**: Delete documentation for unimplemented features  
3. **Consolidate implementation docs**: Ensure all implementation work is in IMPLEMENTATION-TRACKER.MD only
4. **Validate phase status**: Ensure Phase 1-3 completion claims match actual implementation
5. **Update current status**: Reflect accurate Phase 4 readiness and requirements

**Phase 4: Global Commands Repair & Testing**
1. **Test all global commands**: Execute `nc -Help`, `nct -Help`, `ncdoc -Help`, `iiskill -Help`
2. **Identify missing commands**: Determine which commands fail (likely iiskill)
3. **Fix PowerShell profile**: Add missing function definitions and reload profile
4. **Verify functionality**: Test actual command execution, not just help text
5. **Run setup script**: Execute `Workspaces/Global/setup-global-commands.ps1` if needed

**Phase 5: Build & Test Validation**
1. **Run full build**: Execute `dotnet build` and ensure successful compilation
2. **Execute test suite**: Run automated tests and verify pass rates
3. **Validate application startup**: Test `nc` command launches application successfully
4. **Check health endpoints**: Verify `/healthz` responds correctly
5. **Test critical user flows**: Validate Host authentication → CreateSession workflow works

**Phase 6: Project Cleanup & Space Recovery**
1. **Safety Commit**: Create git commit before cleanup for recovery capability
2. **Remove Build Artifacts**: Use PowerShell to recursively remove bin/ and obj/ directories
3. **Clean DocFX Generated Files**: Remove entire DocFX/_site/ directory contents  
4. **Eliminate Duplicate Commands**: Remove .cmd/.bat wrapper files, keep .ps1 implementations
5. **Log File Cleanup**: Remove old development logs (keep most recent 8 files)
6. **Remove Backup/Temporary Files**: Delete .backup configs, stale PID files, temp artifacts
7. **Verify Functionality**: Test build, global commands, and application startup after cleanup

**Cleanup Commands Reference**:
```powershell
# Build artifacts cleanup
Get-ChildItem -Recurse -Directory | Where-Object { $_.Name -eq "bin" -or $_.Name -eq "obj" } | Remove-Item -Recurse -Force -Verbose

# DocFX site cleanup  
Remove-Item 'DocFX\_site\*' -Recurse -Force -Verbose

# Duplicate command files cleanup
Remove-Item 'Workspaces/Global/*.cmd' -Force -Verbose
Remove-Item 'Workspaces/Global/*.bat' -Force -Verbose

# Log file cleanup (keep recent 8, remove older)
Get-ChildItem "Workspaces/Global/logs/" -Filter "*.log" | Sort-Object LastWriteTime -Descending | Select-Object -Skip 8 | Remove-Item -Force -Verbose

# Backup file cleanup
Remove-Item 'SPA/NoorCanvas/Properties/launchSettings.json.backup' -Force -ErrorAction SilentlyContinue
```

**Phase 6: Project Cleanup & Space Recovery**
1. **Remove Build Artifacts**: Clean all bin/ and obj/ directories across solution to recover disk space
2. **Clean Generated Files**: Remove DocFX _site/ directory and other auto-generated content
3. **Remove Duplicate Files**: Eliminate redundant .cmd/.bat wrapper files keeping only .ps1 implementations
4. **Clean Development Logs**: Keep most recent 8 log files, remove older development logs
5. **Remove Backup Files**: Delete .backup configuration files and stale PID files
6. **Post-Cleanup Testing**: Verify all functionality works after cleanup (build, global commands, application startup)

**Phase 7: Implementation Documentation Synchronization**
1. **Update ncImplementationTracker.MD**: Reflect live application state using git history commits for accuracy
2. **Align NOOR-CANVAS-DESIGN.MD**: Synchronize design documentation with current implementation tracker state
3. **Optimize blazor-view-builder-strategy.md**: Streamline view building strategy documentation for current architecture
4. **Optimize copilot_instructions.md**: Update AI assistant instructions to reflect current project state and patterns

**Expected Outcomes After Healthcheck**:
- **Issue Tracker**: Clean, accurate status with verified completions and removed obsolete issues
- **Code-Documentation Alignment**: All documentation reflects actual codebase (no false claims)
- **Global Commands**: All 4 commands (nc, nct, ncdoc, iiskill) functional via PowerShell profile
- **Implementation Reality**: Accurate Phase 1-3 completion status and Phase 4 readiness assessment
- **Build Quality**: Clean build with passing tests and functional application startup
- **Project Cleanup**: Removed duplicate files, build artifacts, and old logs with significant disk space recovery
- **Functionality Preservation**: All cleanup verified to maintain complete system functionality
- **Git History**: Proper commit messages for any fixes applied during healthcheck

**Context Files for Healthcheck Execution**:
- **Primary**: `IssueTracker/NC-ISSUE-TRACKER.MD` (issue validation)
- **Primary**: `Workspaces/IMPLEMENTATION-TRACKER.MD` (implementation validation)  
- **Codebase**: `SPA/NoorCanvas/` (Controllers/, Pages/, Hubs/, Models/, Data/)
- **Testing**: `Tests/NoorCanvas.Core.Tests/` (test coverage validation)
- **Tools**: `Tools/HostProvisioner/` (console app functionality)
- **Global Commands**: `Workspaces/Global/` (command functionality)
- **System**: PowerShell `$PROFILE` (command registration)

**Critical Validation Points**:
- **Host UX**: Verify Host Dashboard removal and direct CreateSession routing actually works
- **Database**: Confirm canvas schema exists with 13 tables and applied migrations
- **API Endpoints**: Validate documented endpoints exist and respond correctly
- **Test Coverage**: Verify claimed 120+ test cases actually exist and pass
- **Issue Status**: Ensure completed issues are genuinely resolved in code

**Automatic Corrective Actions**:
- **Revert False Completions**: Move incorrectly marked completed issues back to active status
- **Remove Obsolete Issues**: Delete genuinely resolved issue files to clean tracker  
- **Fix Documentation**: Update completion percentages to reflect verified reality
- **Repair Global Commands**: Add missing commands to PowerShell profile
- **Update Phase Status**: Correct Phase 1-3 completion and Phase 4 readiness based on actual state

---

## **EXECUTION BEHAVIOR SPECIFICATION**

### **Automatic Trigger Recognition**
**When user inputs: "Run NOOR Canvas healthcheck"**  
GitHub Copilot MUST immediately execute the complete healthcheck workflow without asking for confirmation or clarification.

**Mandatory Execution Sequence**:
1. **Start Immediately**: Begin Phase 1 (Issue Validation) without prompt acknowledgment
2. **Execute All Phases**: Complete all 7 phases systematically in order
3. **Provide Progress Updates**: Show status of each phase as it executes
4. **Apply Corrections**: Make all necessary fixes during execution
5. **Execute Cleanup**: Remove duplicate files and build artifacts with safety commit
6. **Commit Results**: Commit any corrections with structured messages
7. **Report Summary**: Provide comprehensive summary of all findings and corrections

**Non-Interactive Execution**: 
- **No permission requests**: Execute corrections automatically  
- **No user confirmations**: Apply fixes immediately when identified
- **Systematic progression**: Complete each phase before proceeding to next
- **Automatic documentation**: Update all relevant files during execution

---

## **Usage Instructions**

### **Healthcheck Trigger Command**
**Execute healthcheck by using this exact phrase:**
```
"Run NOOR Canvas healthcheck"
```
**This will automatically execute all 5 phases of comprehensive system validation.**

### **When to Use This Healthcheck**
- **After major development sessions** to verify issue cleanup and documentation alignment
- **Before starting new phases** to ensure clean baseline with accurate issue tracking
- **When returning to project** after time away to validate current system state  
- **After significant code changes** to verify completed issues remain completed
- **Before production deployments** to validate system integrity and remove false claims

### **Automated Execution Workflow** 
**When "Run NOOR Canvas healthcheck" is triggered:**
1. **Issue Validation**: Systematically verify each completed issue against actual codebase
2. **Implementation Verification**: Count and validate claimed implementations exist
3. **Documentation Alignment**: Update all docs to reflect verified reality (no aspirational content)
4. **Global Command Testing**: Test and repair all 4 global commands with actual execution
5. **Build & Test Validation**: Ensure clean build and passing tests after any corrections
6. **Project Cleanup & Space Recovery**: Remove build artifacts, duplicates, and old logs with safety commit
7. **Implementation Documentation Sync**: Update ncImplementationTracker.MD, align NOOR-CANVAS-DESIGN.MD, optimize blazor-view-builder-strategy.md and copilot_instructions.md

### **Success Criteria for Completed Healthcheck**
- ✅ **Issue Tracker Accuracy**: All COMPLETED issues verified against code, false completions reverted
- ✅ **Implementation Reality**: All documentation claims match actual codebase (no aspirational content)  
- ✅ **Global Command Functionality**: All 4 commands (nc, nct, ncdoc, iiskill) work via PowerShell profile
- ✅ **Code Quality**: Clean build with passing tests and functional application startup
- ✅ **Phase Accuracy**: Phase 1-3 completion and Phase 4 readiness reflect actual implementation state
- ✅ **Single Source of Truth**: All implementation documentation consolidated in IMPLEMENTATION-TRACKER.MD
- ✅ **Documentation Synchronization**: All key documentation files aligned with current implementation state and optimized

### **Automatic Corrective Behaviors**
**During healthcheck execution, GitHub Copilot will automatically:**
- **Revert False Issue Completions**: Move issues back to active status if fixes don't exist in code
- **Remove Obsolete Issues**: Delete issue files for genuinely resolved problems  
- **Update Completion Percentages**: Correct phase completion based on verified implementation reality
- **Repair Global Commands**: Add missing commands to PowerShell profile and test functionality
- **Consolidate Documentation**: Move any separate implementation docs into IMPLEMENTATION-TRACKER.MD
- **Synchronize Implementation Tracker**: Update ncImplementationTracker.MD with live application state using git history
- **Align Design Documentation**: Synchronize NOOR-CANVAS-DESIGN.MD with implementation tracker reality
- **Optimize Strategy Documentation**: Streamline blazor-view-builder-strategy.md and copilot_instructions.md for current patterns
- **Clean Git History**: Commit corrections with structured messages documenting healthcheck results

### **Maintenance & Updates**
- **Version Updates**: Increment version number when healthcheck procedures are enhanced
- **New Validation Points**: Add verification steps as architecture evolves
- **Command Updates**: Modify when new global commands are added
- **Issue Categories**: Expand validation as new types of issues are identified
