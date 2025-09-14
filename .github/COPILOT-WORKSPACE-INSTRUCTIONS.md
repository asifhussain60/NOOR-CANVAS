# GitHub Copilot — NOOR CANVAS Workspace Instructions

## 1. Project Context & Core Technologies

- **Workspace Root:** `D:\PROJECTS\NOOR CANVAS`
- **Main Application:** Islamic Content Sharing Platform (NOOR CANVAS) - Real-time annotation system
- **Backend:** ASP.NET Core 8.0, Entity Framework Core, SignalR (WebSocket real-time communication)
- **Frontend:** Blazor Server with McBeatch Theme integration
- **Database:** SQL Server with "canvas" schema + KSESSIONS database integration
- **Database Environment Strategy:**
  - **Development:** KSESSIONS_DEV, KQUR_DEV databases
  - **Production:** KSESSIONS, KQUR databases
  - **Connection:** sa user with password `adf4961glo`, 1-hour timeout for long operations
- **Security:** GUID-based session validation (UUIDv4), no traditional authentication required
- **Real-time:** SignalR Hubs for live annotations, Q&A, participant management
- **Development:** ASP.NET Core hosting on localhost:9090 (HTTP) / localhost:9091 (HTTPS)
- **Production:** IIS deployment with dedicated application pool configuration
- **Project Path:** `D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas\` (main application)

## 2. Development Server & Global Commands

### **CRITICAL PORT RESERVATIONS - DO NOT CHANGE**
- **Port 8080**: RESERVED for Beautiful Islam application - NEVER use for NOOR Canvas
- **Port 9090**: NOOR Canvas HTTP (development)
- **Port 9091**: NOOR Canvas HTTPS (primary development)

### **Global Commands - NOOR Canvas Command Suite**
**Location:** `Workspaces/Global/` - Complete command suite

**Available Commands:**
```powershell
nc                             # Primary application runner with token generation
nc 215                         # Generate token for session ID 215 + launch app
nct                           # Host token generator (standalone)
ncdoc                         # DocFX documentation site launcher
iiskill                       # Process killer for cleanup
```

### **NC Command - Enhanced Application Launcher**
**Location:** `Workspaces/Global/nc.ps1` - Complete workflow automation

**Usage:**
```powershell
nc                             # Full workflow: iiskill + nct + build + launch
nc 215                         # Session-specific token generation for session 215
nc -SkipTokenGeneration        # Skip token generation step
nc -Help                       # Display usage information
```

**Workflow:**
1. **iiskill** - Clean existing processes
2. **nct [sessionId]** - Generate Host GUID (session-specific if provided)
3. **Press ENTER** - Continue to build (not "exit")
4. **dotnet build** - Build application
5. **dotnet run** - Start server on https://localhost:9091

### **Development Workflow**
```powershell
# Recommended: Use nc command
nc 213                         # For session-specific development

# Manual alternative (from project directory)
cd "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas"
dotnet run --urls "https://localhost:9091;http://localhost:9090"
```

## 3. Database Architecture & Integration

### **Canvas Schema (NOOR CANVAS)**
```sql
-- Development Database: KSESSIONS_DEV
-- Production Database: KSESSIONS
canvas.Sessions (id, album_id, category_id, guid, host_token, status, created_at, expires_at)
canvas.SessionTranscripts (id, session_id, html_content, created_at)
canvas.Registrations (id, session_id, name, country, city, fingerprint_hash, ip_hash, join_time)
canvas.Questions (id, session_id, participant_id, question_text, answer_text, status, created_at)
canvas.Annotations (id, session_id, participant_id, annotation_data, created_at)
```

### **KSESSIONS Database Integration**
**CRITICAL IMPLEMENTATION REQUIREMENT**: All dropdown data (Albums, Categories, Sessions) MUST load from KSESSIONS database, NOT mock data.

**Database Tables (Read-Only Access):**
- **KSESSIONS.dbo.Groups (Albums)** - Islamic content collections
- **KSESSIONS.dbo.Categories** - Subdivisions within Groups  
- **KSESSIONS.dbo.Sessions** - Individual Islamic learning sessions

**Hierarchical Relationship**: Groups → Categories → Sessions (cascading dropdowns)

## 4. Implementation Progress & Documentation

### **Current Status (September 2025):**
- **Phase 1-3**: ✅ COMPLETED (Backend, Core Platform, Advanced Features)
- **Phase 4**: 🔄 IN PROGRESS (NOOR Canvas Branding Integration)
- **Backend**: 95% complete (8 controllers, 3 SignalR hubs, database complete)
- **Frontend**: 70% complete (Host UX streamlined, participant features pending)
- **Testing**: Automated testing workflow implemented

### **Issue Tracking System** 
- **Main Tracker:** `IssueTracker/NC-ISSUE-TRACKER.MD`
- **Status Folders:** `NOT STARTED/`, `IN PROGRESS/`, `AWAITING_CONFIRMATION/`, `COMPLETED/`
- **Commands:**
  - `Add an issue: [Title] - [Description] - [Priority] - [Category]`
  - `Mark issue X as [Completed|Pending|In Progress]`

### **TODO vs ISSUE Management - CRITICAL DISTINCTION**
**TODO Section (Temporary Work Tracking):**
- **Purpose:** Simple checklist for work items in flight
- **Format:** `- [ ] **Brief Title** - Description`
- **Lifecycle:** Add → Work → Complete → **DELETE** (remove entirely when done)
- **Location:** Top of NC-ISSUE-TRACKER.MD file
- **Scope:** Simple actionable items without need for detailed documentation

**ISSUE Section (Permanent Problem Tracking):**
- **Purpose:** Bugs, defects, feature requests requiring detailed documentation
- **Format:** `- [Icon] **Issue-X** — [Title](PATH/file.md)`
- **Lifecycle:** NOT STARTED → IN PROGRESS → AWAITING CONFIRMATION → COMPLETED
- **Files:** Each issue has dedicated .md file in appropriate status folder
- **Icons:** ❌ Not Started | ⚡ In Progress | ⏳ Awaiting Confirmation | ✅ Completed

**NEVER mix TODOs and Issues - they serve different purposes and have different lifecycles.**

### **Implementation Tracker System - SINGLE SOURCE OF TRUTH**
- **Master Tracker:** `Workspaces/IMPLEMENTATION-TRACKER.MD`
- **Purpose:** Comprehensive development progress tracking AND all implementation-related documentation
- **CRITICAL RULE:** ALL implementation work, technical specifications, user guides, API documentation, and process documentation MUST be consolidated in IMPLEMENTATION-TRACKER.MD
- **NO SEPARATE FILES:** Do not create separate DocFX files, user guides, technical references, or process documentation for implementation work

## 5. File Management & Best Practices

### **Professional File Naming Standards**
**❌ NEVER Use These Naming Patterns:**
- `SampleFilename_Fixed.cs`, `TestFile_Updated.md`, `ComponentName_New.tsx`
- `-NEW`, `-OLD`, `-DEBUG`, `-TEMP`, `-BACKUP`, `-COPY`, `-DUPLICATE`
- `_backup`, `_copy`, `_old`, `_new`, `_temp`, `_debug`, `_working`, `_draft`

**✅ ALWAYS Use Professional Names:**
- `SessionController.cs`, `AnnotationHub.cs`, `ParticipantRegistration.js`

### **TEMP Folder Development Workspace**
**Location:** `Workspaces/TEMP/`  
**Purpose:** Designated workspace for ALL non-production development artifacts

**MANDATORY Usage Rules:**
- **Test Files**: All test implementations, sample code, proof-of-concepts
- **Debug Files**: Debug scripts, diagnostic tools, troubleshooting files
- **Experimental Code**: Feature experiments, architecture tests, prototypes

**Cleanup Behavior:**
- **TEMP Folder Structure**: Always preserved
- **TEMP Contents**: Emptied during cleanup to maintain clean workspace

## 6. PowerShell & Command Guidelines

### **PowerShell Command Guidelines**
```powershell
# ✅ CORRECT: Use semicolon for command separation
cd "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas"; dotnet build --no-restore

# ❌ WRONG: Do not use && (bash syntax)
cd "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas" && dotnet build --no-restore
```

### **Global Commands File Management**
**CRITICAL FILE INTEGRITY RULES:**
- **Never create empty files**: Always verify file content after creation
- **Avoid encoding issues**: Remove all emojis and special characters from PowerShell scripts
- **Test after modification**: Always run `nc -Help` to verify functionality
- **Backup before major changes**: Keep working copies in TEMP folder

### **PowerShell Emoji Policy**
To avoid encoding and script parsing issues on Windows PowerShell, DO NOT use emojis or non-ASCII glyphs inside PowerShell scripts or batch wrappers. GitHub Copilot (or any automation) must never inject emoji characters into `.ps1`, `.cmd`, or `.bat` files. Use plain ASCII text and simple bullets (`-`) for lists.

## 7. Database Connection Requirements

### **CRITICAL DATABASE ENVIRONMENT REQUIREMENTS**
**MANDATORY DEVELOPMENT RULE**: All development work MUST use development databases only.

**Development Databases (REQUIRED):**
- `KSESSIONS_DEV` - Primary NOOR Canvas database with canvas schema
- `KQUR_DEV` - Quranic content database for cross-application integration
- **Account**: `sa` user with password `adf4961glo`
- **Connection Timeout**: 3600 seconds (1 hour) for long operations

**Production Databases (FORBIDDEN in development):**
- `KSESSIONS` - Production database - **DO NOT TOUCH until deployment**
- `KQUR` - Production database - **DO NOT TOUCH until deployment**

## 8. Debugging & Issue Resolution

### **Copilot's Debugging Capabilities**
**What GitHub Copilot CAN Access Automatically:**
- **Terminal Output:** `get_terminal_output` - All command results and errors
- **File Contents:** `read_file` - Any file in the workspace for analysis
- **Compilation Errors:** `get_errors` - Build and lint errors directly
- **Code Search:** `grep_search`, `semantic_search` - Find code patterns and issues

**What User Must Provide:**
- **Browser Console Errors:** Developer tools messages, JavaScript errors
- **Visual UI Issues:** Layout problems, styling issues
- **Performance Observations:** Slow loading, memory usage issues

### **Issue Documentation Protocol**
**CRITICAL REQUIREMENT:** Before fixing any issue, GitHub Copilot MUST first document it in the issue tracker.

**Issue Documentation Workflow:**
1. **Document in NC-ISSUE-TRACKER.MD** immediately
2. **Investigation** → Use available debugging tools to diagnose
3. **Resolution** → Implement fix with proper testing
4. **Update Status** → Mark issue as completed in tracker

## 9. Automatic Logging Implementation

### **Server-Side Automatic Logging (Serilog Integration)**
**Implementation Pattern:** Every controller action, service method, and SignalR hub automatically includes:
```csharp
// Automatically added to controllers
private readonly ILogger<ControllerName> _logger;

// Automatic structured logging in all actions
_logger.LogInformation("NOOR-INFO: {Action} executed for session {SessionId}", nameof(ActionName), sessionId);
```

**Why This Happens Automatically:**
- Serilog is pre-configured in `Program.cs` with console + file outputs
- All services are registered with ILogger<T> dependency injection
- Structured logging format (`NOOR-[LEVEL]: {Message}`) is the established pattern

### **Copilot Implementation Guidelines**
- **NEVER ask** "Should I add logging?" — It's automatically included
- **ALWAYS include** structured logging in every method you write
- **ASSUME logging exists** when debugging or troubleshooting

## 10. Automated Testing Workflow

### **Complete Automated Testing System**
**Implementation**: Comprehensive automated testing workflow eliminates manual test execution

**Automatic Test Execution After Every Build**
- **Implementation**: `.hooks/post-build.ps1`
- **Trigger**: Every successful `dotnet build` command
- **Smart Detection**: Only runs tests if build output actually changed

**Pre-Commit Test Validation with Smart Caching**
- **Implementation**: `.hooks/pre-commit-test.ps1` + Git pre-commit hook
- **Trigger**: Every `git commit` command
- **Smart Caching**: Skips redundant tests if no code changes since last test run

### **Git Commit Guidelines - BYPASS TEST SUITE**

**CRITICAL: Do NOT run test suite during commits**
- **Use**: `git commit --no-verify` to bypass pre-commit hooks
- **Reason**: Pre-commit tests can cause delays and terminal issues
- **Alternative**: Run tests manually when needed using dedicated test commands
- **Best Practice**: Focus on clean, fast commits without automated test execution

**Standard Commit Procedure:**
```powershell
git add .
git commit --no-verify -m "Your commit message"
```

## 11. Repository Cleanup & Maintenance

### **Automatic Cleanup Command**
**Triggers**: `Clean up and commit` OR `Cleanup, Commit changes and push to origin`

**MANDATORY Cleanup Procedure:**
1. **Empty TEMP folder contents** (preserve folder structure)
2. **Remove build artifacts** (bin, obj folders)
3. **Remove temporary/working files** (files with unprofessional naming patterns)
4. **MANDATORY BUILD VERIFICATION** (ensure project compiles before commit)
5. **Stage all changes** (`git add .`)
6. **Commit with timestamp**
7. **Push to origin** (if specifically requested)

## 12. Essential Context & Best Practices

### **Islamic Content Considerations**
- **RTL Support:** Arabic and Urdu text rendering
- **Cultural Sensitivity:** Appropriate Islamic terminology and presentation
- **Content Types:** Qur'an, Hadith, Etymology, Islamic Poetry support

### **Performance Guidelines**
- **Real-time Optimization:** Minimize SignalR message size
- **Database Efficiency:** Use indexes on session_id and participant_id
- **Asset Management:** Reference existing images, don't duplicate

### **Security Best Practices**
- **Session Validation:** GUID-based tokens with expiration
- **SQL Injection Prevention:** Use parameterized queries
- **Cross-Schema Access:** Minimal permissions principle

---

## 13. CRITICAL NC COMMAND FIXES (September 2025)

### **Known Issues & Recent Fixes:**
- **Issue-55**: ✅ NC Simple Browser Integration - Instructions added
- **Issue-56**: ✅ NC Session ID Parameter Support - `nc 215` functionality 
- **Issue-57**: ✅ NC Continuation Prompt Fix - Press ENTER (not "exit")

### **File Management Issues:**
- **Empty nc.ps1 files**: Always verify file creation with `Get-Item -Path "file.ps1" | Select-Object Length`
- **Encoding issues**: Remove all emojis and special characters
- **PowerShell profile**: Ensure global commands are properly registered

### **NC Command Structure (Final):**
```powershell
# Session-specific workflow
nc 213                         # Generate token for session 213 + launch

# Standard workflow  
nc                             # Generic token + launch
nc -SkipTokenGeneration        # Skip token step
nc -Help                       # Display options
```

**Expected Output:**
1. ✅ iiskill - Clean processes
2. ✅ Host token generation (session-specific if provided)
3. ✅ Press ENTER prompt (not "exit")
4. ✅ Build successful
5. ✅ Application starts on https://localhost:9091

---

**Last updated:** September 14, 2025  
**Project Status:** Phase 4 In Progress - NC Command Enhanced  
**Next Focus:** Phase 4 NOOR Canvas Branding Implementation
