# GitHub Copilot Instructions - NOOR CANVAS

## Project Overview
**Islamic Content Sharing Platform** - Real-time collaborative learning system with live annotations, Q&A, and session management.

**Stack:** ASP.NET Core 8.0 + Blazor Server + SignalR + SQL Server  
**Main App:** `SPA/NoorCanvas/` | **Dev Ports:** HTTP 9090, HTTPS 9091 (Never use 8080)

## Quick Start

### Essential Commands (`Workspaces/Global/`)
```powershell
nc 215                    # Session-specific: token + build + launch
nc                        # Generic: token + build + launch  
nct create 123            # Standalone token generation
ncdoc                     # Documentation (port 8050)
iiskill                   # Process cleanup
```

**Standard Workflow:** `nc <sessionId>` → Press ENTER (not "exit") → App launches on https://localhost:9091

## Architecture Essentials

### Database (Dual-Schema)
- **`canvas.*`** - App data (Sessions, Registrations, Questions, Annotations) 
- **`KSESSIONS.dbo.*`** - Islamic content (Groups→Categories→Sessions) READ-ONLY
- **Dev Environment:** KSESSIONS_DEV (mandatory) | **Prod:** KSESSIONS (forbidden in dev)

### SignalR Hubs (3 Active)
- **SessionHub** - Lifecycle (join/leave, broadcast session events)
- **AnnotationHub** - Real-time drawing (broadcast annotations, coordinates)  
- **QAHub** - Q&A system (questions, voting, queue management)

**Hub Pattern:**
```csharp
// Standard group naming: "Session_{sessionId}"
await Groups.AddToGroupAsync(Context.ConnectionId, $"Session_{sessionId}");
_logger.LogInformation("NOOR-HUB: {Action} for {UserId} in {SessionId}", action, userId, sessionId);
await Clients.Group($"Session_{sessionId}").SendAsync("EventName", data);
```

## Development Guidelines

### File Management
- **Professional Names Only:** `SessionController.cs` (never `Session_Fixed.cs`, `Session-NEW.cs`)
- **TEMP Workspace:** `Workspaces/TEMP/` for all experimental/debug files
- **No PowerShell Emojis:** ASCII only in `.ps1` files (encoding issues)

### PowerShell Best Practices
```powershell
# ✅ Correct command chaining
cd "path"; dotnet build

# ❌ Wrong (bash syntax)  
cd "path" && dotnet build
```

### Core Patterns
- **Logging:** Always use `"NOOR-{COMPONENT}: {message}"` format with structured logging
- **Database:** Development = KSESSIONS_DEV mandatory, Production = forbidden
- **Sessions:** GUID-based tokens, no traditional auth
- **File Cleanup:** TEMP contents cleared during maintenance, structure preserved

## Debugging & Testing

### Issue Resolution Workflow
1. **Document First:** Add to `IssueTracker/ncIssueTracker.MD` before fixing
2. **Investigate:** Use available tools (terminal output, file contents, compilation errors)
3. **Test in TEMP:** Place diagnostic scripts in `Workspaces/TEMP/tests/`
4. **Fix & Update:** Implement solution, mark issue completed
5. **Validate Consistency:** Run tracker validation before commit attempt

**CRITICAL:** Never bypass validation hooks without user approval - they prevent repository inconsistencies and maintain project quality

### What Copilot Can Access
- Terminal output, file contents, build errors, code search
- **User Must Provide:** Browser console errors, UI issues, performance observations

### Testing Strategy
- **Temporary tests:** `TEMP/tests/` (cleaned during maintenance)
- **Permanent tests:** `Tests/` directory
- **Naming:** `{component}-diagnostic.ps1`, `{issue-description}-test.ps1`

### TODO Tracking
- **TODO prompts:** Track in `Workspaces/IMPLEMENTATION-TRACKER.MD` 
- **Issues/Bugs:** Track in `IssueTracker/NC-ISSUE-TRACKER.MD`
- **Lifecycle:** ❌ Not Started → ⚡ In Progress → ⏳ Awaiting → ✅ Completed
- **Preserve history:** Don't delete completed items

## Quality Control & Validation

### Issue Tracker Consistency (MANDATORY)
**Purpose:** Ensures synchronization between issue files and tracker documentation  
**Hook Location:** `.hooks/validate-tracker-consistency.ps1` (runs pre-commit)  
**Command:** `.\Workspaces\Global\validate-tracker-consistency.ps1 -Verbose`

**Workflow:**
1. **Check Status:** Run validation script before any commit attempt
2. **Fix Issues:** Use `validate-tracker-consistency.ps1 -Fix` to auto-resolve when possible  
3. **Manual Resolution:** Address inconsistencies that require human intervention
4. **Commit Only When Clean:** Zero inconsistencies required for commit approval

**Common Inconsistencies:**
- Issue files exist in folders but missing from `ncIssueTracker.MD`
- Issues marked completed but files still in `IN PROGRESS` folder
- Tracker references non-existent issue files

**Known Script Issues (Sep 16, 2025):**
- Validation script references deleted `project-implementation-tracker.md` (should reference `ncImplementationTracker.MD`)
- Script hardcoded path needs update: Line 16 in `validate-tracker-consistency.ps1`

**Emergency Override:** Use `git commit --no-verify` ONLY with explicit user permission and documented justification

## Common Issues & Solutions

### NCDOC Python Error
**Problem:** "Python was not found" when running `ncdoc`  
**Solution:** Use direct DocFX: `cd DocFX; docfx serve _site --port 9093`

### PowerShell Best Practices
- **Avoid built-in parameter names:** Use `VerboseLogging` not `Verbose`
- **Console errors during git:** Display issues only, operations still succeed
- **Script reliability:** Test parameters in clean PowerShell session

### HTML/UI Standards
- **Colors:** Preserve NOOR Canvas scheme (blue #3B82F6, purple #8B5CF6)
- **Typography:** Inter font, clean hierarchy, modern minimalistic design
- **CSS:** Use `.noor-*` prefix, avoid Tailwind conflicts, responsive design

### Mock-to-View Implementation
- **CRITICAL:** Always reference `.github/NOOR-Canvas-Mock-Implementation-Guide.md` for UI work
- **Mandatory Header:** Every view MUST include NOOR Canvas branding header with logo
- **Pixel-Perfect:** Follow exact measurements, colors, spacing from implementation guide
- **Template:** Use standardized Razor template with `nc-` prefixed CSS classes

### Continuous Learning Protocol
- **Adaptation Trigger:** When user says "implement this moving forward" or "update instructions"
- **Action Required:** Update `.github/NOOR-Canvas-Mock-Implementation-Guide.md` with new requirements ensuring you do not create any conflicts.
- **Documentation:** Add new patterns, standards, or corrections to prevent future issues
- **Version Control:** Always commit instruction updates with descriptive messages

### Process Management
```powershell
# Process cleanup
Get-Process -Name "*dotnet*" -ErrorAction SilentlyContinue | Stop-Process -Force
iiskill  # Or use global command

# Build validation workflow
dotnet build --verbosity quiet  # Check compilation before launch
```

### Performance Targets
- **Build:** <2s incremental | **Startup:** <10s on localhost:9091 | **Guard validation:** <5s

## Implementation Standards

### Automatic Logging (Serilog)
- **Always include:** `_logger.LogInformation("NOOR-{COMPONENT}: {action}", params)`
- **Never ask about logging** - it's automatically configured in Program.cs
- **Pattern:** Structured logging with consistent NOOR-prefixed messages

### Blazor View Builder Strategy (Razor Views)
When building Blazor `.razor` views from HTML mocks, follow this comprehensive strategy:

**Core Objectives:**
1. **Complete replacement:** Replace ENTIRE existing markup with provided HTML mock
2. **Blazor adaptation:** Convert to valid Razor/Blazor (components, bindings, events)
3. **Data binding:** Replace placeholders with strongly-typed Blazor bindings
4. **Logo integration:** Insert centered `<div class="noor-canvas-logo">` at `<!-- Logo -->` markers
5. **Inline styles only:** All styling must be inline to prevent cross-view conflicts
6. **Syntax validation:** Ensure clean Razor compilation with no analyzer errors

**Detailed Implementation:**
- **Replace entire view:** Overwrite target `.razor` file completely, preserve structure from mock
- **Blazor conversion:** Fix self-closing elements, convert `onclick` to `@onclick`, use Blazor components (`<InputText>`, `<EditForm>`)
- **Data binding:** Detect placeholders (`{{Name}}`, `[[Name]]`, `data-bind="Name"`), replace with `@Model.Property` or `@Property`
- **Model creation:** Create strongly-typed backing model with `[Parameter] public MyViewModel? Model { get; set; }`
- **Demo data seeding:** If `Model` is null, seed demo data in `OnInitialized()` for design-time rendering
- **Logo block insertion:** At `<!-- Logo -->` comment, insert:
  ```html
  <div class="noor-canvas-logo" style="display:flex;align-items:center;justify-content:center;text-align:center;">
      <span>@(Model?.LogoText ?? "Noor Canvas")</span>
  </div>
  ```
- **Inline styling:** Use `style="..."` attributes only, no global CSS modifications
- **Asset handling:** Ensure relative paths resolve under `wwwroot`, add TODO comments for uncertain paths
- **Accessibility:** Add basic ARIA attributes and semantic roles where straightforward

**Quality Checklist:**
- ✅ File compiles with no errors/warnings
- ✅ All `@using`/`@inject` statements present
- ✅ Event handlers exist in `@code` block
- ✅ Nullable annotations respected with null checks
- ✅ No unresolved paths or broken loops
- ✅ Recommend: `dotnet build` and `dotnet format` validation

**Output Requirements:**
- Return complete `.razor` file content (markup + `@code` block)
- Include view model class inline or as separate `.cs` file
- Provide "What Changed" summary (replaced markup, bindings added, handlers added, logo insertion)

### Testing & Git Workflow
- **Automated:** `.hooks/post-build.ps1` runs tests after successful builds
- **Quality Gate:** Pre-commit validation via `validate-tracker-consistency.ps1` prevents commits with inconsistencies
- **Standard commits:** `git add . ; git commit -m "message"` (validation hook enforced)
- **Emergency bypass:** `git commit --no-verify -m "message"` (ONLY with explicit user permission)
- **Cleanup triggers:** "Clean up and commit" → TEMP clear → build verify → **validate consistency** → commit

### Repository Maintenance
1. Empty TEMP contents (preserve structure)
2. Remove build artifacts (bin/, obj/)  
3. Verify compilation before commit
4. **MANDATORY:** Run `validate-tracker-consistency.ps1` and fix all inconsistencies before commit
5. Use professional file names only
6. **Never bypass validation hooks** without explicit user approval

### Security & Performance
- **Auth:** GUID-based session tokens (no traditional login)
- **Database:** Parameterized queries, indexed on session_id/participant_id
- **SignalR:** Minimize message size, JSON protocol only
- **Content:** RTL support for Arabic/Urdu, cultural sensitivity required

## Quick Reference

### Port Reservations
- **8080:** Beautiful Islam app (reserved)
- **8050:** Documentation (ncdoc)  
- **9090/9091:** NOOR Canvas HTTP/HTTPS

### Key Commands
```powershell
nc <sessionId>           # Full workflow: cleanup → token → build → launch
ncdoc -Force             # Restart documentation server  
.\Tests\HealthCheck.ps1  # Validate workspace
```

### Project Status (Sept 2025)
- **Backend:** 95% complete (10 controllers, 3 hubs active)
- **Frontend:** 70% complete (Blazor + SignalR integration)
- **Phase 4:** NOOR Canvas branding integration in progress

---
*Updated: September 15, 2025 | Focus: Efficient AI agent guidance*
