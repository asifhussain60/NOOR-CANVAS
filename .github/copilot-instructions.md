# GitHub Copilot — NOOR CANVAS Workspace Instructions

## 1. Project Context & Core Technologies

- **Workspace Root:** `D:\PROJECTS\NOOR CANVAS`
- **Main Application:** Islamic Content Sharing Platform (NOOR CANVAS) - Real-time annotation system
- **Backend:** ASP.NET Core 8.0, Entity Framework Core, SignalR (WebSocket real-time communication)
- **Frontend:** McBeatch Theme integration, Blazor Server/WASM or React with TypeScript
- **Database:** SQL Server AHHOME with dedicated "canvas" schema + cross-application "dbo" read access
- **Database Environment Strategy:**
  - **Development:** KSESSIONS_DEV, KQUR_DEV databases
  - **Production:** KSESSIONS, KQUR databases
  - **Connection:** sa user with full access, 1-hour timeout for long operations
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

### **Implementation Tracker System**
- **Master Tracker:** `Workspaces/IMPLEMENTATION-TRACKER.MD`
- **Purpose:** Comprehensive 20-week development progress tracking
- **Structure:** 6 phases with detailed task lists and test cases
- **Usage Commands:**
  - `Update tracker progress for Phase X`
  - `Mark task X as complete in Implementation Tracker`
  - `Add test case for Phase X functionality`
  - `Review Phase X completion status`
- **Progress Tracking:** Automated percentage calculations, milestone tracking, dependency management
- **Testing Integration:** 120+ test cases across all phases with validation criteria

## 3A. Automatic Logging Implementation — CRITICAL CONTEXT

### **How Automatic Logging Works Without Prompting**
GitHub Copilot automatically implements comprehensive logging in NOOR Canvas based on the following embedded patterns and architectural decisions:

#### **1. Server-Side Automatic Logging (Serilog Integration)**
**Implementation Pattern:** Every controller action, service method, and SignalR hub automatically includes:
```csharp
// Automatically added to controllers
private readonly ILogger<ControllerName> _logger;

// Automatic structured logging in all actions
_logger.LogInformation("NOOR-INFO: {Action} executed for session {SessionId}", nameof(ActionName), sessionId);

// Automatic error boundary logging
try { /* action logic */ }
catch (Exception ex) 
{
    _logger.LogError(ex, "NOOR-ERROR: {Action} failed with {Error}", nameof(ActionName), ex.Message);
    throw;
}
```

**Why This Happens Automatically:**
- Serilog is pre-configured in `Program.cs` with console + file outputs
- All services are registered with ILogger<T> dependency injection
- Structured logging format (`NOOR-[LEVEL]: {Message}`) is the established pattern
- Exception handling middleware automatically captures unhandled errors

#### **2. Client-Side Automatic Logging (Browser Integration)**
**Implementation Pattern:** All Blazor components and JavaScript interactions automatically include:
```javascript
// Automatically available in all pages via _Host.cshtml
window.NoorLogger = {
    info: (component, message, data) => { /* structured browser logging */ },
    error: (component, message, data) => { /* auto-transmit to server */ }
};

// Automatic error boundary for unhandled exceptions
window.addEventListener('error', function(event) {
    NoorLogger.error('UNHANDLED-ERROR', event.message, errorContext);
});
```

**Why This Happens Automatically:**
- `noor-logging.js` is included in base layout (`_Host.cshtml`)
- Error boundaries are automatically set up on page load
- WARN+ level logs are automatically transmitted to server via `/api/logs`
- Session/User context is automatically included in all log entries

#### **3. SignalR Automatic Logging (Real-time Event Tracking)**
**Implementation Pattern:** All hub connections and events automatically include:
```csharp
// Automatically added to all SignalR hubs
public override async Task OnConnectedAsync()
{
    _logger.LogInformation("NOOR-SIGNALR: Client connected to {HubName} - ConnectionId: {ConnectionId}", 
        GetType().Name, Context.ConnectionId);
    await base.OnConnectedAsync();
}

// Automatic hub method logging
public async Task SendMessage(string message)
{
    _logger.LogDebug("NOOR-HUB: {Method} called with message length {Length}", 
        nameof(SendMessage), message.Length);
    // method implementation
}
```

**Why This Happens Automatically:**
- Base hub class includes logging infrastructure
- Connection lifecycle events are automatically logged
- Hub method calls are automatically traced
- Client-side SignalR errors are captured by browser logging

#### **4. Development Behavior Expectations**
When you develop any feature, the system automatically adds:
- **Entry/Exit Logging:** Every method gets entry/exit logs with parameters
- **Performance Timing:** Database queries, SignalR calls, and API responses include timing
- **Error Context:** All exceptions include session ID, user context, and full stack traces
- **User Actions:** Button clicks, navigation, form submissions are automatically logged
- **Debug Information:** Development environment includes verbose SQL queries and connection details

#### **5. Production Behavior**
In production, logging automatically:
- Filters to INFO level and above (no DEBUG spam)
- Includes structured fields for Application Insights integration
- Automatically sanitizes sensitive data (passwords, tokens)
- Compresses and rotates log files daily
- Transmits critical errors to monitoring systems

### **Copilot Implementation Guidelines**
- **NEVER ask** "Should I add logging?" — It's automatically included
- **ALWAYS include** structured logging in every method you write
- **AUTOMATICALLY add** browser-side logging for user interactions
- **ASSUME logging exists** when debugging or troubleshooting
- **REFERENCE existing patterns** from Phase 1 implementation

### **Example: How Automatic Logging Works in Practice**
When you create any new controller or service, Copilot automatically adds comprehensive logging:

**Before (what you might write):**
```csharp
public class SessionController : ControllerBase
{
    public IActionResult CreateSession(CreateSessionRequest request)
    {
        var session = new Session { /* properties */ };
        _context.Sessions.Add(session);
        _context.SaveChanges();
        return Ok(session);
    }
}
```

**After (what Copilot automatically implements):**
```csharp
public class SessionController : ControllerBase
{
    private readonly ILogger<SessionController> _logger;
    private readonly CanvasDbContext _context;

    public SessionController(ILogger<SessionController> logger, CanvasDbContext context)
    {
        _logger = logger;
        _context = context;
    }

    [HttpPost("create")]
    public async Task<IActionResult> CreateSession(CreateSessionRequest request)
    {
        using (_logger.BeginScope(new Dictionary<string, object> 
        { 
            ["Action"] = nameof(CreateSession),
            ["RequestType"] = request.GetType().Name 
        }))
        {
            try
            {
                _logger.LogInformation("NOOR-INFO: Creating new session for request {RequestId}", request.Id);
                
                var session = new Session 
                {
                    Id = Guid.NewGuid(),
                    CreatedAt = DateTime.UtcNow,
                    /* other properties */
                };
                
                _context.Sessions.Add(session);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation("NOOR-SUCCESS: Session {SessionId} created successfully", session.Id);
                return Ok(session);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NOOR-ERROR: Failed to create session for request {RequestId}", request.Id);
                return StatusCode(500, new { error = "Failed to create session" });
            }
        }
    }
}
```

**This happens automatically because:**
1. Dependency injection for ILogger<T> is standard pattern
2. Structured logging with NOOR- prefixes is the established convention
3. Error boundaries with try-catch are automatically added
4. Performance scoping and contextual data inclusion is standard
5. All database operations get automatic logging

**Browser-side logging is also automatic:**
```javascript
// This gets automatically added to any user interaction
function createSession() {
    NoorLogger.info('SESSION-CREATION', 'User initiated session creation', { timestamp: new Date() });
    
    fetch('/api/session/create', { /* request */ })
        .then(response => {
            NoorLogger.info('SESSION-API', 'Session creation completed', { status: response.status });
        })
        .catch(error => {
            NoorLogger.error('SESSION-ERROR', 'Session creation failed', { error: error.message });
        });
}
```

### **NOOR Observer Debugging System**
- **Comprehensive Telemetry:** Serilog + Application Insights integration
- **Real-time Diagnostics:** SignalR connection monitoring, session tracking
- **Performance Metrics:** Database query performance, annotation rendering speed
- **Error Tracking:** Automatic exception capture with Islamic content context
- **Environment Detection:** Development/Staging/Production configuration awareness

## 4. Database Architecture & Integration

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

### **Cross-Application Integration**
- **Read Access:** NOOR CANVAS → Beautiful Islam dbo schema
- **Development:** KQUR_DEV database for Quranic content
- **Production:** KQUR database for Quranic content
- **Image Assets:** Reference existing paths (D:\PROJECTS\KSESSIONS\Source Code\Sessions.Spa\Resources\IMAGES)
- **SQL Account:** `sa` user with full permissions and 1-hour timeout
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

## 7A. Tracker Systems Usage Guide

### **Issue Tracker Commands & Operations**
**Location:** `IssueTracker/NC-ISSUE-TRACKER.MD`

**Adding Issues:**
```
Add an issue: Database timeout during session creation - Connection drops after 30 seconds - High - Bug
Add an issue: Mobile annotation tools missing touch support - Touch gestures not responsive - Medium - Feature
Add an issue: McBeatch theme colors inconsistent - Blue theme has wrong accent colors - Low - Enhancement
```

**Managing Issue Status:**
```
Mark issue 1 as In Progress
Mark issue 3 as Completed
Mark issue 5 as Pending
Remove issue 2
```

**Issue Structure:**
- **Title**: Brief, descriptive problem/feature summary
- **Description**: Detailed explanation of issue or requirements
- **Priority**: High (🔴) / Medium (🟡) / Low (🟢)
- **Category**: Bug (🐛) / Feature (✨) / Enhancement (🔧) / Documentation (📖)

**Folder Management:**
- Issues automatically move to appropriate folders based on status
- `NOT STARTED/` → New issues awaiting development
- `COMPLETED/` → Resolved and verified issues

### **Implementation Tracker Commands & Operations**
**Location:** `Workspaces/IMPLEMENTATION-TRACKER.MD`

**Progress Tracking Commands:**
```
Update tracker progress for Phase 1
Update tracker progress for Phase 2
Mark task "Health endpoint implementation" as complete in Implementation Tracker
Mark task "SignalR hub setup" as complete in Implementation Tracker
Add test case for Phase 2 functionality
Review Phase 1 completion status
```

**Test Case Management:**
```
Mark test T1.5 as passed in tracker
Mark test T2.3 as failed with database connectivity issue
Add test case T1.11 for server-side logging validation
Update test results for Phase 1 completion
```

**Phase Management:**
- **Phase Status Updates**: Automatically calculated from task completion
- **Milestone Tracking**: Key deliverables and target dates
- **Dependency Management**: Task prerequisites and blockers
- **Testing Integration**: 120+ test cases with pass/fail tracking

**Progress Statistics:**
- **Automatic Calculation**: Task completion percentages
- **Phase Completion**: Overall phase progress tracking
- **Test Coverage**: Validation test pass/fail ratios
- **Timeline Monitoring**: Actual vs. planned completion dates

### **Tracker Integration Workflow**
1. **Development Issues** → Issue Tracker (`Add an issue`)
2. **Implementation Tasks** → Implementation Tracker (Phase-based tracking)
3. **Testing Validation** → Implementation Tracker (Test case execution)
4. **Bug Resolution** → Issue Tracker → Implementation Tracker update
5. **Feature Completion** → Implementation Tracker → Issue Tracker closure

### **Copilot Tracker Usage Guidelines**
- **AUTOMATICALLY update trackers** when completing development work
- **REFERENCE tracker status** when starting new tasks
- **MAINTAIN consistency** between Issue Tracker and Implementation Tracker
- **UPDATE test results** after validating functionality
- **TRACK dependencies** when working on interconnected features

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
**Automatic Cleanup Command:** `Clean up and commit` OR `Cleanup, Commit changes and push to origin`

**When user prompts with cleanup commands, execute the following procedure:**

**ESSENTIAL CONTEXT - TEMP Folder Usage:**
- **TEMP Folder Purpose**: `Workspaces/TEMP/` is the designated workspace for ALL test files, debug files, experimental code, and temporary development artifacts
- **Preserve Structure**: Never delete the TEMP folder itself - only empty its contents
- **Development Practice**: All non-production files MUST be created in TEMP folder

**MANDATORY Cleanup Procedure (Execute in order):**
```powershell
# 1. Empty TEMP folder contents completely (preserve folder structure)
Get-ChildItem "D:\PROJECTS\NOOR CANVAS\Workspaces\TEMP\*" -Recurse -Force | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue
Write-Host "✅ TEMP folder emptied - all test/debug files removed"

# 2. Remove other temporary files and artifacts
Remove-Item "D:\PROJECTS\NOOR CANVAS\**\*.tmp" -Force -ErrorAction SilentlyContinue
Remove-Item "D:\PROJECTS\NOOR CANVAS\**\.DS_Store" -Force -ErrorAction SilentlyContinue

# 3. Remove build artifacts (preserve source code)
Remove-Item "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas\bin" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas\obj" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "D:\PROJECTS\NOOR CANVAS\Tools\**\bin" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "D:\PROJECTS\NOOR CANVAS\Tools\**\obj" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "D:\PROJECTS\NOOR CANVAS\**\node_modules" -Recurse -Force -ErrorAction SilentlyContinue

# 4. Remove log files older than 7 days (keep recent logs)
Get-ChildItem "D:\PROJECTS\NOOR CANVAS" -Recurse -Filter "*.log" | Where-Object {$_.LastWriteTime -lt (Get-Date).AddDays(-7)} | Remove-Item -Force

# 5. Clean Visual Studio/VS Code temp files
Remove-Item "D:\PROJECTS\NOOR CANVAS\**\.vs" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "D:\PROJECTS\NOOR CANVAS\**\.vscode\settings.json" -Force -ErrorAction SilentlyContinue

Write-Host "🧹 Repository cleanup completed"
```

**Git Commit Procedure (After cleanup):**
```bash
# 6. Verify no unprofessional filenames exist
$unprofessionalFiles = Get-ChildItem "D:\PROJECTS\NOOR CANVAS" -Recurse -File | Where-Object {$_.Name -match "_Fixed|_Clean|_New|_Updated|_Final|_Modified|_Corrected|_Refactored|Sample|Test"}
if ($unprofessionalFiles) {
    Write-Warning "⚠️ Found unprofessional filenames: $($unprofessionalFiles.FullName -join ', ')"
    Write-Host "Please rename these files before committing"
} else {
    Write-Host "✅ All filenames are professional"
}

# 7. Stage all changes
git add .

# 8. Commit with standardized message
git commit -m "chore: cleanup temp files and maintain project structure - $(Get-Date -Format 'yyyy-MM-dd HH:mm')"

# 9. Push to remote (if requested)
git push origin master

Write-Host "🚀 Changes committed and pushed successfully"
```

**Files and Folders to Clean:**
- **Workspaces/TEMP/**: ALL contents deleted (folder preserved)
- **bin/**, **obj/**: Build artifacts (recreated on build)
- **node_modules/**: NPM dependencies (recreated on npm install)
- **.vs/**, **.vscode/settings.json**: IDE temp files
- **Logs older than 7 days**: Cleanup old development logs

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

**Essential Folders to ALWAYS Preserve:**
- `Workspaces/Documentation/` - All design and implementation docs
- `IssueTracker/` - Issue tracking system
- `McBeatch/` - Theme assets and styling
- `SPA/` - Main application source code
- `Tools/` - Console applications source code
- `.github/` - GitHub configuration and instructions

**Folders Safe to Remove (Contents):**
- `Workspaces/TEMP/` - **COMPLETELY EMPTY** (preserve folder structure)
- `bin/`, `obj/` - Build artifacts (recreated on build)
- `node_modules/` - NPM dependencies (recreated on npm install)
- `.vs/`, `.vscode/settings.json` - IDE temp files
- `logs/` - Old log files (older than 7 days)

**TEMP Folder Cleanup Rules:**
- **ALWAYS EMPTY**: Remove ALL files and subfolders from TEMP
- **PRESERVE STRUCTURE**: Keep the TEMP folder itself  
- **NO EXCEPTIONS**: All test files, debug scripts, experimental code gets deleted
- **DEVELOPMENT CYCLE**: Use TEMP freely during development, clean completely on commit

### **Database Operations**
```sql
-- Check canvas schema objects (Development)
USE KSESSIONS_DEV;
SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'canvas';

-- Verify cross-schema access (Development)
USE KQUR_DEV;
SELECT * FROM dbo.Users; -- Should work with sa account

-- Production equivalents
USE KSESSIONS;
USE KQUR;
```

### **Development Server Operations**
```powershell
# Start application (IIS Express x64 on port 9090)
dotnet run --project "D:\PROJECTS\NOOR CANVAS\SPA" --urls "https://localhost:9090"

# Verify server is running on correct port
netstat -ano | findstr ":9090"

# Check IIS Express processes
Get-Process | Where-Object {$_.ProcessName -like "*iisexpress*"}

# Test endpoints (use Invoke-WebRequest, not curl)
Invoke-WebRequest -Uri "https://localhost:9090/healthz" -SkipCertificateCheck
Invoke-WebRequest -Uri "https://localhost:9090/health/detailed" -SkipCertificateCheck
```

### **SignalR Testing**
```powershell
# Test hub connections using PowerShell (not curl)
$headers = @{ "Content-Type" = "application/json" }
Invoke-WebRequest -Uri "https://localhost:9090/hub/session" -Headers $headers -SkipCertificateCheck

# Test health endpoint
Invoke-WebRequest -Uri "https://localhost:9090/healthz" -SkipCertificateCheck | Select-Object -ExpandProperty Content
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

### **Cleanup Commands (Automatic Recognition)**
**Triggers**: Any of these user prompts automatically execute full cleanup procedure:
- `Clean up and commit`
- `Cleanup, Commit changes and push to origin`  
- `Clean repository and push changes`
- `Cleanup and commit`
- `Clean up temp files and commit`

**Automatic Actions Performed:**
1. **Empty TEMP folder completely** (preserve folder structure)
2. **Remove build artifacts** (bin, obj folders)
3. **Clean development logs** (older than 7 days)
4. **Remove IDE temp files** (.vs, .vscode settings)
5. **Verify professional filenames** (no _Fixed, _Test, etc.)
6. **Stage all changes** (`git add .`)
7. **Commit with timestamp** (standard cleanup message)
8. **Push to origin** (if specifically requested)

```bash
# Development Server
dotnet run --project "D:\PROJECTS\NOOR CANVAS\SPA" --urls "https://localhost:9090"
Get-Process | Where-Object {$_.ProcessName -like "*iisexpress*"}
Invoke-WebRequest -Uri "https://localhost:9090/healthz" -SkipCertificateCheck

# Issue Management
Add an issue: Database timeout - Connection drops after 30 seconds - High - Bug
Mark issue 1 as In Progress
Remove issue 2

# Repository Maintenance (AUTOMATED CLEANUP)
Clean up and commit                    # Executes full cleanup + commit
Cleanup, Commit changes and push to origin    # Executes full cleanup + commit + push

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
**Last updated:** September 11, 2025  
**Project Status:** Phase 1 Complete - Ready for Phase 2 Development  
**Next Milestone:** Host & Participant Core (Phase 2)
