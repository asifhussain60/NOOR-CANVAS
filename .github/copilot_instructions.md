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
1. **Document First:** Add to `IssueTracker/NC-ISSUE-TRACKER.MD` before fixing
2. **Investigate:** Use available tools (terminal output, file contents, compilation errors)
3. **Test in TEMP:** Place diagnostic scripts in `Workspaces/TEMP/tests/`
4. **Fix & Update:** Implement solution, mark issue completed

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

### Testing & Git Workflow
- **Automated:** `.hooks/post-build.ps1` runs tests after successful builds
- **Manual commits:** `git add . ; git commit -m "message"` (no pre-commit hooks)
- **Cleanup triggers:** "Clean up and commit" → TEMP clear → build verify → commit

### Repository Maintenance
1. Empty TEMP contents (preserve structure)
2. Remove build artifacts (bin/, obj/)  
3. Verify compilation before commit
4. Use professional file names only

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
