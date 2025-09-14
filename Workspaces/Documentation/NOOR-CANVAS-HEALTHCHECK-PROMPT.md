# NOOR Canvas Comprehensive System Healthcheck Prompt

**Purpose**: Comprehensive workspace validation to ensure documentation-code alignment and global command functionality  
**Usage**: Copy and paste this entire prompt to GitHub Copilot for systematic workspace verification  
**Last Updated**: September 14, 2025  
**Version**: v1.0

---

**Context**: You are GitHub Copilot working on NOOR Canvas (Islamic content sharing platform) on September 14, 2025. Recent work included comprehensive reality verification of implementation status, document synchronization, and critical issue identification.

## **Previous Context**
- **Recent Work**: Completed document alignment between IMPLEMENTATION-TRACKER.MD and NOOR-CANVAS-DESIGN.MD
- **Reality Audit**: Verified actual codebase implementation against documentation claims (commits a725967, b8f12ba)
- **Critical Issue**: Issue-53 (CreateSession HttpClient BaseAddress) blocks session creation workflow
- **Implementation Status**: Backend 95% complete, Frontend 70% complete (blocked), Tools 90% complete

## **Healthcheck Objectives**

### **1. Document Alignment & Code Synchronization**
**Verify and fix document-code alignment issues:**

**Required Actions**:
- **Check IMPLEMENTATION-TRACKER.MD** against actual codebase (`SPA/NoorCanvas/Controllers/`, `Models/`, `Data/`, `Pages/`, `Hubs/`)
- **Verify NOOR-CANVAS-DESIGN.MD** architecture section matches verified implementation (8 controllers, 3 SignalR hubs, 13 database tables)
- **Validate API contracts** in design document match actual controller endpoints
- **Update phase completion percentages** if any new implementation discovered since September 14
- **Cross-reference Issue Tracker** (IssueTracker/NC-ISSUE-TRACKER.MD) with actual code issues
- **Git diff analysis**: Review commits since b8f12ba to identify any new implementations requiring documentation updates

**Specific Verification Points**:
- Controllers count (should be 8: Admin, Annotations, Health, Host, HostProvisioner, Issue, Logs, Participant)
- SignalR Hubs count (should be 3: SessionHub, AnnotationHub, QAHub)  
- Database migrations applied (check Data/Migrations folder)
- HostProvisioner console app functionality (Tools/HostProvisioner/Program.cs)
- Test coverage (Tests/NoorCanvas.Core.Tests/ - should have 120+ test cases)

### **2. Global Commands Functionality Assessment**
**Test and repair all global commands:**

**Commands to Verify**:
- **`nc`** - NOOR Canvas application runner (should show port manager help)
- **`nct`** - Host token generator (should show interactive session ID prompt)
- **`ncdoc`** - Documentation server (should serve on localhost:9093)
- **`iiskill`** - IIS Express process killer (**KNOWN ISSUE**: Missing from PowerShell profile)

**Required Fixes**:
- **Fix `iiskill` global command**: Currently missing from PowerShell profile (only nc, nct, ncdoc are loaded)
- **Verify PowerShell profile**: Check `$PROFILE` contains all 4 commands with proper function definitions
- **Test command functionality**: Run each command with `-Help` parameter to verify full functionality
- **Update setup script**: Run `Workspaces/Global/setup-global-commands.ps1` if needed to restore missing commands

**Profile Requirements** (check and fix if missing):
```powershell
function nc { & "D:\PROJECTS\NOOR CANVAS\Workspaces\Global\nc.ps1" @args }
function nct { & "D:\PROJECTS\NOOR CANVAS\Workspaces\Global\nct.ps1" @args }
function ncdoc { & "D:\PROJECTS\NOOR CANVAS\Workspaces\Global\ncdoc.ps1" @args }
function iiskill { & "D:\PROJECTS\NOOR CANVAS\Workspaces\Global\iiskill.ps1" @args }
```

## **Execution Instructions**

**Phase 1: Document Verification**
1. **Audit current codebase** structure using `list_dir` and `read_file` on key directories
2. **Compare against IMPLEMENTATION-TRACKER.MD** - verify claimed implementations exist
3. **Check NOOR-CANVAS-DESIGN.MD** architecture matches actual controller/hub/model counts
4. **Update any outdated completion percentages** or implementation claims
5. **Commit any documentation fixes** with clear messages

**Phase 2: Global Commands Repair** 
1. **Test all 4 global commands** (nc, nct, ncdoc, iiskill) with `-Help` parameter
2. **Identify missing commands** from PowerShell profile (known issue: iiskill missing)
3. **Fix PowerShell profile** by adding missing function definitions
4. **Verify command functionality** after profile fixes
5. **Test full workflow**: `nc`, `nct`, `ncdoc`, `iiskill` should all execute properly

**Phase 3: Critical Issues Assessment**
1. **Review Issue-53 status** - CreateSession HttpClient BaseAddress configuration  
2. **Check for new blocking issues** since September 14 commits
3. **Update issue tracker** with any newly discovered problems
4. **Prioritize resolution path** for critical blockers

**Expected Outcomes**:
- All documentation accurately reflects codebase reality (no aspirational claims)
- All 4 global commands working from any directory via PowerShell profile
- Critical issues documented and prioritized for resolution
- Clean git history with proper commit messages for any fixes

**Context Files to Reference**:
- `Workspaces/Documentation/IMPLEMENTATIONS/IMPLEMENTATION-TRACKER.MD`
- `Workspaces/Documentation/IMPLEMENTATIONS/NOOR-CANVAS-DESIGN.MD`  
- `IssueTracker/NC-ISSUE-TRACKER.MD`
- `SPA/NoorCanvas/` (actual implementation)
- `Workspaces/Global/` (global commands)
- PowerShell `$PROFILE` (global command registration)

**Known Issues to Address**:
- Issue-53: CreateSession HttpClient BaseAddress (critical blocker)
- Missing `iiskill` from PowerShell profile (confirmed in healthcheck)
- Potential new implementation gaps since September 14 documentation sync

---

## **Usage Instructions**

### **When to Use This Healthcheck**
- **After major development sessions** to verify documentation alignment
- **Before starting new phases** to ensure clean baseline
- **When returning to project** after time away
- **After team handoffs** to verify workspace integrity
- **Before production deployments** to validate system state

### **How to Execute**
1. **Copy this entire prompt** (from "Context" through "Known Issues")
2. **Paste to GitHub Copilot** in VS Code
3. **Let Copilot execute** all verification phases
4. **Review results** and address any identified issues
5. **Commit fixes** with proper documentation

### **Success Criteria**
- ✅ All documentation matches actual codebase implementation
- ✅ All 4 global commands (nc, nct, ncdoc, iiskill) work properly
- ✅ No critical issues blocking development progress
- ✅ Git history clean with recent verification commits
- ✅ Issue tracker reflects current reality

### **Maintenance**
- **Update this prompt** when new global commands are added
- **Revise verification points** as architecture evolves
- **Add new known issues** as they are discovered
- **Update version number** and last updated date after changes
