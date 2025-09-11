# GitHub Copilot — NOOR CANVAS Workspace Instructions

## 1. Project Context & Core Technologies

- **Workspace Root:** `D:\PROJECTS\NOOR CANVAS`
- **Main Application:** Islamic Content Sharing Platform (NOOR CANVAS) - Real-time annotation system
- **Backend:** ASP.NET Core 8.0, Entity Framework Core, SignalR (WebSocket real-time communication)
- **Frontend:** McBeatch Theme integration, Blazor Server/WASM or React with TypeScript
- **Database:** SQL Server with dedicated "canvas" schema + cross-application "dbo" read access
- **Security:** GUID-based session validation (UUIDv4), no traditional authentication required
- **Real-time:** SignalR Hubs for live annotations, Q&A, participant management
- **Development:** IIS Express x64 on localhost:9090 (ASP.NET Core hosting only - no npm/python servers)
- **Production:** IIS deployment with dedicated application pool configuration
- **Timeline:** 20-week phased implementation (6 major phases)

## 2. Development Server Requirements

### **MANDATORY Development Environment**
- **Server Technology:** IIS Express x64 ONLY
- **Port Configuration:** localhost:9090 (fixed port for all development)
- **Framework Hosting:** ASP.NET Core 8.0 built-in hosting pipeline
- **FORBIDDEN Alternatives:** 
  - ❌ npm serve, npm start, npm run dev
  - ❌ python -m http.server, python -m SimpleHTTPServer  
  - ❌ Node.js static file servers (http-server, live-server, etc.)
  - ❌ webpack-dev-server, vite dev server
  - ❌ Any non-IIS development servers

### **Development Workflow**
```powershell
# Correct way to run the application
dotnet run --project "D:\PROJECTS\NOOR CANVAS\SPA" --urls "https://localhost:9090"

# Or via Visual Studio
# Launch Profile: IIS Express x64
# Application URL: https://localhost:9090
```

### **Port Verification**
```powershell
# Verify correct port is in use
netstat -ano | findstr ":9090"
# Should show IIS Express process binding to port 9090
```

## 3. Critical Project Files & Documentation

### **Master Implementation Plan**
- **Primary Document:** `Workspaces/Documentation/IMPLEMENTATIONS/NOOR-CANVAS-DESIGN.MD`
  - Complete 20-week implementation roadmap
  - Technical architecture specifications
  - Database schema definitions (canvas + dbo integration)
  - IIS deployment instructions
  - Phase-by-phase development timeline

### **Issue Tracking System** 
- **Main Tracker:** `IssueTracker/NC-ISSUE-TRACKER.MD`
- **Usage Guide:** `IssueTracker/USAGE-GUIDE.MD`
- **Folder Structure:**
  - `IssueTracker/COMPLETED/` — Resolved issues
  - `IssueTracker/NOT STARTED/` — Pending issues
- **Commands:**
  - `Add an issue: [Title] - [Description] - [Priority] - [Category]`
  - `Mark issue X as [Completed|Pending|In Progress]`
  - `Remove issue X`

### **NOOR Observer Debugging System**
- **Comprehensive Telemetry:** Serilog + Application Insights integration
- **Real-time Diagnostics:** SignalR connection monitoring, session tracking
- **Performance Metrics:** Database query performance, annotation rendering speed
- **Error Tracking:** Automatic exception capture with Islamic content context
- **Environment Detection:** Development/Staging/Production configuration awareness

## 4. Database Architecture & Integration

### **Canvas Schema (NOOR CANVAS)**
```sql
canvas.Sessions (id, album_id, category_id, guid, host_token, status, created_at, expires_at)
canvas.SessionTranscripts (id, session_id, html_content, created_at)
canvas.Registrations (id, session_id, name, country, city, fingerprint_hash, ip_hash, join_time)
canvas.Questions (id, session_id, participant_id, question_text, answer_text, status, created_at)
canvas.Annotations (id, session_id, participant_id, annotation_data, created_at)
```

### **Cross-Application Integration**
- **Read Access:** NOOR CANVAS → Beautiful Islam dbo schema
- **Image Assets:** Reference existing paths (D:\PROJECTS\KSESSIONS\Source Code\Sessions.Spa\Resources\IMAGES)
- **SQL Account:** `noor_canvas_app` with proper schema permissions
- **No Data Duplication:** Asset referencing strategy, not copying

## 5. McBeatch Theme Integration

### **Styling Framework**
- **Location:** `McBeatch/` folder contains complete theme assets
- **Components:** Bootstrap-based responsive grid, Open Sans typography
- **Color Variants:** Red, blue, brown, green, orange, yellow themes
- **Assets:** CSS, fonts, images, JavaScript components
- **Integration:** All NOOR CANVAS views must use McBeatch styling

### **Multi-Platform Design**
- **Desktop:** Beautiful modern interface with advanced features
- **Mobile:** Responsive touch-friendly annotation tools
- **Languages:** Arabic (RTL), English (LTR), Urdu (RTL) support

## 6. Development Phases & Timeline

### **Phase 1: Foundation (Weeks 1-3)**
- ASP.NET Core 8.0 project setup
- Database schema implementation
- Basic SignalR hub configuration
- NOOR Observer system integration

### **Phase 2: Core Platform (Weeks 4-8)**
- Session management system
- Participant registration
- Basic annotation framework
- McBeatch theme integration

### **Phase 3: Advanced Features (Weeks 9-12)**
- Real-time annotation tools
- Q&A system implementation
- Mobile responsiveness
- Performance optimization

### **Phase 4: Content & Styling (Weeks 13-16)**
- Islamic content integration
- Beautiful Islam asset integration
- Advanced styling and themes
- Multi-language support

### **Phase 5: Testing & Optimization (Weeks 17-18)**
- Load testing and performance tuning
- Cross-browser compatibility
- Security hardening
- Quality assurance

### **Phase 6: Deployment (Weeks 19-20)**
- IIS production setup
- Database migration
- Go-live preparation
- Documentation completion

## 7. Issue Management Workflow

### **Priority System**
- 🔴 **HIGH:** Blocks development, breaks core functionality
- 🟡 **MEDIUM:** Important UX issues, performance problems
- 🟢 **LOW:** Cosmetic improvements, documentation updates

### **Categories**
- 🐛 **Bug:** Application defects, SignalR issues, database problems
- ✨ **Feature:** New functionality (annotations, Q&A, mobile tools)
- 🔧 **Enhancement:** Performance, security, accessibility improvements
- 📖 **Documentation:** Guides, API docs, deployment instructions

### **Status Tracking**
- **Pending:** Issue identified, awaiting implementation
- **In Progress:** Currently being developed
- **Completed:** Resolved and verified

## 8. NOOR Observer Debugging Commands

### **Diagnostic Levels**
```csharp
// Development: Full diagnostics
logger.LogDebug("NOOR-DEBUG: SignalR connection established for session {SessionId}", sessionId);

// Production: Essential only
logger.LogInformation("NOOR-INFO: Session {SessionId} started with {ParticipantCount} participants", sessionId, count);

// Critical errors
logger.LogError("NOOR-ERROR: Database connection failed for canvas schema: {Error}", exception.Message);
```

### **Performance Monitoring**
- **SignalR Metrics:** Connection count, message throughput, latency
- **Database Performance:** Query execution times, connection pool status
- **Annotation Rendering:** Drawing performance, canvas optimization
- **Memory Usage:** Real-time memory consumption, garbage collection

## 9. Working Commands & Development Tools

### **Project Management**
- **Issue Tracking:** Use natural language commands listed in Section 2
- **Documentation:** Always reference master implementation plan
- **Phase Tracking:** Monitor progress against 20-week timeline

### **Repository Cleanup & Maintenance**
**Automatic Cleanup Command:** `Clean up and commit`

**ESSENTIAL CONTEXT - TEMP Folder Usage:**
- **TEMP Folder Purpose**: `Workspaces/TEMP/` is the designated workspace for ALL test files, debug files, experimental code, and temporary development artifacts
- **Preserve Structure**: Never delete the TEMP folder itself - only empty its contents
- **Development Practice**: All non-production files MUST be created in TEMP folder

**Cleanup Procedures (Execute in order):**
```powershell
# 1. Empty TEMP folder contents (preserve folder structure)
Get-ChildItem "D:\PROJECTS\NOOR CANVAS\Workspaces\TEMP\*" -Recurse | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue
Write-Host "TEMP folder emptied - ready for new development artifacts"

# 2. Remove other temporary files and folders
Remove-Item "D:\PROJECTS\NOOR CANVAS\**\*.tmp" -Force -ErrorAction SilentlyContinue
Remove-Item "D:\PROJECTS\NOOR CANVAS\**\.DS_Store" -Force -ErrorAction SilentlyContinue

# 3. Remove build artifacts (when development starts)
Remove-Item "D:\PROJECTS\NOOR CANVAS\Source\bin" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "D:\PROJECTS\NOOR CANVAS\Source\obj" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "D:\PROJECTS\NOOR CANVAS\**\node_modules" -Recurse -Force -ErrorAction SilentlyContinue

# 4. Remove log files older than 7 days
Get-ChildItem "D:\PROJECTS\NOOR CANVAS" -Recurse -Filter "*.log" | Where-Object {$_.LastWriteTime -lt (Get-Date).AddDays(-7)} | Remove-Item -Force

# 5. Clean Visual Studio/VS Code temp files
Remove-Item "D:\PROJECTS\NOOR CANVAS\**\.vs" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "D:\PROJECTS\NOOR CANVAS\**\.vscode\settings.json" -Force -ErrorAction SilentlyContinue
```

**Git Commit Procedure:**
```bash
# 5. Verify no unprofessional filenames exist
Get-ChildItem "D:\PROJECTS\NOOR CANVAS" -Recurse -File | Where-Object {$_.Name -match "_Fixed|_Clean|_New|_Updated|_Final|_Modified|_Corrected|_Refactored|Sample|Test"} | Select-Object FullName

# 6. Stage all changes
git add .

# 7. Commit with standardized message
git commit -m "chore: cleanup temp files and maintain project structure - $(Get-Date -Format 'yyyy-MM-dd')"

# 8. Push to remote
git push origin master
```

**Essential Folders to Preserve:**
- `Workspaces/Documentation/` - All design and implementation docs
- `IssueTracker/` - Issue tracking system
- `McBeatch/` - Theme assets and styling
- `Workspaces/Global/` - Copilot instructions and global configs
- `Workspaces/TEMP/` - **ESSENTIAL**: Designated workspace for test files, debug files, experimental code

**Folders Safe to Remove:**
- `bin/`, `obj/` - Build artifacts (recreated on build)
- `node_modules/` - NPM dependencies (recreated on npm install)
- `.vs/`, `.vscode/settings.json` - IDE temp files

**TEMP Folder Contents (Safe to Empty):**
- Test files, debug scripts, experimental code
- Sample data files, mock implementations
- Development artifacts, temporary references
- Any non-production code or files

### **Database Operations**
```sql
-- Check canvas schema objects
SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'canvas';

-- Verify cross-schema access
SELECT * FROM dbo.Users; -- Should work with noor_canvas_app account
```

### **Development Server Operations**
```powershell
# Start application (IIS Express x64 on port 9090)
dotnet run --project "D:\PROJECTS\NOOR CANVAS\SPA" --urls "https://localhost:9090"

# Verify server is running on correct port
netstat -ano | findstr ":9090"

# Check IIS Express processes
Get-Process | Where-Object {$_.ProcessName -like "*iisexpress*"}
```

### **SignalR Testing**
```javascript
// Test hub connection
const connection = new signalR.HubConnectionBuilder()
    .withUrl("/annotationHub")
    .build();
```

## 10. Commands That May Fail (Troubleshooting Guide)

### **Development Server Issues**
- **Symptom:** Application not accessible on localhost:9090
- **Solution:** Verify IIS Express x64 is running and binding to correct port
- **Command:** Check `netstat -ano | findstr ":9090"` and restart IIS Express if needed

### **Database Connection Issues**
- **Symptom:** Canvas schema access denied
- **Solution:** Verify noor_canvas_app SQL account permissions
- **Command:** Check connection string in appsettings.json

### **SignalR Connection Problems**
- **Symptom:** Real-time features not working
- **Solution:** Verify WebSocket protocol enabled in IIS
- **Command:** Check browser developer tools for WebSocket errors

### **McBeatch Theme Issues**
- **Symptom:** Styling not applying correctly
- **Solution:** Verify CSS file paths and Bootstrap integration
- **Command:** Check browser developer tools for 404 CSS errors

## 11. Essential Context & Best Practices

### **TEMP Folder Development Workspace - CRITICAL**
**Location:** `Workspaces/TEMP/`  
**Purpose:** Designated workspace for ALL non-production development artifacts

**MANDATORY Usage Rules:**
- **Test Files**: All test implementations, sample code, proof-of-concepts
- **Debug Files**: Debug scripts, diagnostic tools, troubleshooting files
- **Experimental Code**: Feature experiments, architecture tests, prototypes
- **Temporary References**: Downloaded samples, reference implementations
- **Development Artifacts**: Mock data, test configurations, temporary assets

**Examples of Files That BELONG in TEMP:**
```
Workspaces/TEMP/
├── test-signalr-connection.js
├── debug-database-schema.sql
├── sample-annotation-data.json
├── experimental-canvas-renderer.ts
├── mock-session-data.xml
├── prototype-mobile-ui.html
├── reference-implementations/
└── debugging-tools/
```

**Examples of Files That NEVER Belong in TEMP:**
- Production controllers, services, models
- Final application views and components
- Configuration files for production
- Documentation (belongs in Documentation/)
- Issue tracking files (belongs in IssueTracker/)

**Cleanup Behavior:**
- **TEMP Folder Structure**: Always preserved
- **TEMP Contents**: Emptied during cleanup to maintain clean workspace
- **Development Cycle**: Use TEMP freely, clean regularly

### **Professional File Naming Standards**
**CRITICAL:** All application files MUST use professional, production-ready names

**❌ NEVER Use These Naming Patterns:**
- `SampleFilename_Fixed.cs`
- `SampleFilename_Clean.js`
- `TestFile_Updated.md`
- `ComponentName_New.tsx`
- `ControllerName_Modified.cs`
- `ViewName_Final.cshtml`
- `ModelName_Corrected.cs`
- `ServiceName_Refactored.cs`

**✅ ALWAYS Use Professional Names:**
- `SessionController.cs`
- `AnnotationHub.cs`
- `ParticipantRegistration.js`
- `CanvasComponent.tsx`
- `SessionManagement.cshtml`
- `AnnotationService.cs`
- `SessionTranscript.cs`
- `QuestionAnswer.cs`

**Naming Convention Rules:**
1. **PascalCase for C# files**: `SessionController.cs`, `AnnotationHub.cs`
2. **camelCase for JavaScript/TypeScript**: `sessionManager.js`, `annotationRenderer.ts`
3. **kebab-case for CSS/HTML**: `session-styles.css`, `participant-view.html`
4. **Descriptive and Purpose-Clear**: Name should indicate function/purpose
5. **No Temporary Suffixes**: Never use _Fixed, _Clean, _New, _Updated, _Final
6. **Production Ready**: Names should be appropriate for production deployment

Folder Case Rule: Always create folders using Proper Case (PascalCase / Title Case). Examples: `Tools`, `Workspaces`, `IssueTracker`, `HostProvisioner`, `McBeatch`.

**File Organization by Type:**
```
Controllers/
├── SessionController.cs
├── ParticipantController.cs
├── AnnotationController.cs
└── QuestionController.cs

Services/
├── SessionService.cs
├── AnnotationService.cs
├── ParticipantService.cs
└── NotificationService.cs

Models/
├── Session.cs
├── Participant.cs
├── Annotation.cs
└── Question.cs

Views/
├── Session/
│   ├── Create.cshtml
│   ├── Manage.cshtml
│   └── Participate.cshtml
└── Shared/
    ├── Layout.cshtml
    └── Navigation.cshtml
```

**Refactoring Command**: When creating files, if temporary names are used during development, they MUST be renamed to professional names before any commit.

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

## 12. Quick Reference Commands

```bash
# Development Server
dotnet run --project "D:\PROJECTS\NOOR CANVAS\SPA" --urls "https://localhost:9090"
Get-Process | Where-Object {$_.ProcessName -like "*iisexpress*"}

# Issue Management
Add an issue: Database timeout - Connection drops after 30 seconds - High - Bug
Mark issue 1 as In Progress
Remove issue 2

# Repository Maintenance
Clean up and commit

# Development Workflow
dotnet publish -c Release -r win-x64 --self-contained false -o "./publish"
dotnet ef database update --context CanvasDbContext

# IIS Management
iisreset
netstat -ano | findstr ":9090"

# Project Structure Verification
Get-ChildItem "D:\PROJECTS\NOOR CANVAS" -Directory | Select-Object Name, LastWriteTime
```

---
**Last updated:** September 9, 2025  
**Project Status:** Day Zero - Ready for Phase 1 Development  
**Next Milestone:** Foundation & Infrastructure (Week 1-3)
