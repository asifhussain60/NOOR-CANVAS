# System Structure Summary

This file explains how Copilot should use and navigate the prompts and instructions.  
It is the **single source of truth** for system usage and must be updated if the structure changes.

---

## Key & Indexing

- **Primary Key**: Each prompt/instruction file is identified by its filename.  
  - Example: `refactor.prompt.md` → key = `refactor`.  
- **Index File**: This summary acts as the top-level index.  
  - Copilot should always check here first to know which prompts exist and their roles.  

---

## Razor View Architecture Mapping

### Key-to-View Mappings
- **waitingroom** = `SessionWaiting.razor`
- **hostcanvas** = `HostControlPanel.razor`, `SessionCanvas.razor`
- **canvas** = `SessionCanvas.razor`
- **debug** = Debug panel used on `UserLanding.razor`
- **userauth** = `UserLanding.razor`
- **hostauth** = `HostLanding.razor`
- **sessionopener** = `Host-SessionOpener.razor`

### API & Database Architecture

#### waitingroom (`SessionWaiting.razor`)
- **APIs**: 
  - `GET /api/participant/session/{token}/validate` - validates session token
  - `GET /api/participant/session/{token}/participants` - fetches participant list
- **Tables**: `canvas.Sessions`, `canvas.Participants`, `dbo.Countries` (flag lookup via ISO2)
- **SignalR**: SessionHub (`/hub/session`) - real-time participant updates, group: `usertoken_{token}`
- **Purpose**: Pre-session waiting room with participant list and countdown timer

#### hostcanvas (`HostControlPanel.razor`)  
- **Route**: `/host/control-panel/{hostToken}` ✅ **FIXED** (was `/host/control/{hostToken}`)
- **APIs**: 
  - `GET /api/question/session/{userToken}` - fetch session Q&A
  - `POST /api/host/session/{sessionId}/start` - start session
  - `GET /api/host/sessions/{sessionId}/assets` - fetch available assets
  - `POST /api/host/share-asset` - broadcast content to participants
  - `GET /api/host/asset-lookup` - fetch asset lookup definitions (database-driven asset detection)
  - `GET /api/host/ksessions/session/{sessionId}/details` - enhanced session details with transcript from KSESSIONS
  - `GET /api/host/ksessions/countries/flags` - country flag mappings from KSESSIONS database
  - `GET /api/host/sessions/list` - host sessions list with token validation
  - `GET /api/host/sessions/{sessionId}/details` - session with scheduling information
- **Tables**: `canvas.Sessions`, `canvas.Questions`, `canvas.AssetLookup`, `KSESSIONS.Sessions`, `KSESSIONS.SessionTranscripts`, `KSESSIONS.Countries`
- **Architecture**: ✅ **API-First** - All database access via HTTP APIs (no direct DbContext injection)
- **SignalR**: SessionHub, QAHub, AnnotationHub - groups: `session_{sessionId}`, `host_{hostToken}`
- **Backward Compatibility**: HostControlRedirect.razor handles old `/host/control/{hostToken}` route
- **Purpose**: Host session management, Q&A moderation, and real-time content broadcasting

#### canvas (`SessionCanvas.razor`)
- **APIs**: 
  - `GET /api/participant/session/{token}/validate` - validate participant session
  - `GET /api/participant/session/{token}/participants` - fetch session participants  
  - `POST /api/Question/Submit` - submit new question
  - `POST /api/Question/Vote` - vote on question
  - `DELETE /api/Question/Delete/{questionId}?userGuid={guid}` - delete own question
- **Tables**: `canvas.Sessions`, `canvas.Participants`, `canvas.Questions`, `canvas.QuestionVotes`
- **SignalR**: SessionHub (`/hub/session`), QAHub (`/hub/qa`) - groups: `session_{sessionId}`, `usertoken_{token}`
- **Purpose**: Main participant session interface with Q&A, voting, and real-time content reception

#### userauth (`UserLanding.razor`)
- **APIs**: 
  - `GET /api/participant/session/{token}/validate` - validate user session token
  - `POST /api/participant/register-with-token` - register participant with validated token
  - `GET /api/host/countries?guid={userGuid}` - fetch countries for registration dropdown
- **Tables**: `canvas.Sessions`, `canvas.Participants`, `dbo.Countries` (ISO2, CountryName fields)
- **Debug Panel**: TestDataService integration for development workflow
- **Purpose**: Two-phase user flow: token validation → participant registration with country selection

#### hostauth (`HostLanding.razor`)
- **APIs**: 
  - `GET /api/host/token/{friendlyToken}/validate` - validate 8-character host token
  - `GET /api/session/{sessionId}/usertoken` - fetch corresponding user token for session link
- **Tables**: `canvas.Sessions` (HostToken, UserToken, SessionId fields)
- **Purpose**: Host authentication using 8-character friendly tokens, generates user registration URLs

#### sessionopener (`Host-SessionOpener.razor`)
- **Service**: `HostSessionService` (wraps multiple internal APIs)
- **Service Methods**: 
  - `LoadAlbumsAsync(hostToken)` - fetch KSESSIONS albums
  - `LoadCategoriesAsync(albumId, hostToken)` - fetch categories for album
  - `LoadSessionsAsync(categoryId, hostToken)` - fetch sessions for category
  - `CreateSessionAndGenerateTokensAsync(model)` - create session with tokens
- **Tables**: `KSESSIONS.Groups` (Albums), `KSESSIONS.Categories`, `KSESSIONS.Sessions`, `canvas.Sessions` (token storage)
- **Purpose**: Host session creation with cascading dropdowns (Album→Category→Session) and custom scheduling

---

## Current Architecture Status (September 30, 2025)

### System Scale
- **Controllers**: 11 operational (AdminController, HostController, ParticipantController, QuestionController, SessionController, AnnotationsController, HealthController, TokenController, HostProvisionerController, IssueController, LogsController)
- **SignalR Hubs**: 4 operational (SessionHub, QAHub, AnnotationHub, TestHub)
- **Services**: 17+ operational (AssetHtmlProcessingService, HostSessionService, SimplifiedTokenService, SessionStateService, ConfigurableLoadingService, etc.)
- **API Endpoints**: 52+ across all controllers
- **Razor Components**: 15+ pages, 10+ components

### Recent Changes (September 2025)
- ✅ **KSESSIONS Integration**: New API endpoints for enhanced session details and country flags
- ✅ **Routing Fix**: HostControlPanel.razor route standardization with backward compatibility
- ✅ **API-First Architecture**: Eliminated direct database access violations
- ✅ **Asset Detection**: Database-driven asset lookup system
- ✅ **Service Layer**: Comprehensive service architecture with 17+ services

### Architecture Quality Gates
- ✅ **Build Status**: Clean compilation
- ❌ **Linter Status**: 49 TypeScript/JavaScript lint errors (mostly `@typescript-eslint/no-explicit-any`)
- ✅ **Database Connectivity**: Canvas and KSESSIONS databases operational
- ✅ **SignalR Infrastructure**: 4 hubs operational with proper routing
- ✅ **API Endpoints**: Core endpoints responding correctly

---

## File Locations

- **/instructions**:  
  Contains high-level behavioral guides. Example:  
  - `SelfAwareness.instructions.md`: central meta-instruction.  
  - `API-Contract-Validation.md`: API-specific validations.  
  - `NOOR-CANVAS_ARCHITECTURE.MD`: comprehensive system architecture (updated September 30, 2025)

- **/prompts**:  
  Contains task-specific operational prompts. Example:  
  - `refactor.prompt.md`: deep code restructuring guidance.
  - `retrosync.prompt.md`: requirements/test synchronization protocol  
  - `retrosync.prompt.md`: alignment checks across layers.  
  - `workitem.prompt.md`: generating or managing discrete dev tasks.  

---

## Development Tools & Code Quality

### Roslynator Code Analysis Configuration
**Location**: `Workspaces/CodeQuality/`  
**Purpose**: Comprehensive C# code quality analysis with organized artifact storage

**Key Components**:
- **Execution Script**: `run-roslynator.ps1` - Automated analysis with timestamped artifacts
- **Configuration**: `Roslynator/Config/roslynator.config` - Centralized Roslynator settings
- **Reports**: `Roslynator/Reports/` - GitLab-format JSON reports for CI/CD integration
- **Logs**: `Roslynator/Logs/` - Detailed execution logs with performance metrics
- **VS Code Tasks**: Integrated tasks for easy execution ("run-roslynator-analysis")

**Usage Rules**:
- **NEVER** run `roslynator` commands directly in project root
- **ALWAYS** use: `.\Workspaces\CodeQuality\run-roslynator.ps1`
- **Latest Results**: `Workspaces/CodeQuality/Roslynator/Reports/latest-analysis.json`
- **Documentation**: `Workspaces/CodeQuality/README.md` for comprehensive usage guide

**Integration**:
- **.gitignore**: Configured to prevent analysis artifact pollution in repository
- **Health Metrics**: Provides quantitative code quality scores and trend analysis
- **CI-Ready**: GitLab Code Climate format for automated quality gates

---

## Usage Rules for Copilot

1. **Start with SelfAwareness**  
   - Always load `SelfAwareness.instructions.md` first.  
   - Follow its reference to this file for structural orientation.  

2. **Locate by Task Key**  
   - When the user requests a task (e.g. "refactor services"), Copilot should map the task → key → file in `/prompts`.  
   - Use the Razor View Architecture Mapping to understand component relationships.

3. **Combine with Layer Rules**  
   - When reviewing across layers (razor views, services, API contracts, SQL), Copilot should pull in `retrosync.prompt.md` or `refactor.prompt.md` plus any supporting instruction files.  
   - Reference the API & Database Architecture section for impact analysis.

4. **Code Quality Integration**  
   - Before major refactoring, run code analysis: `.\Workspaces\CodeQuality\run-roslynator.ps1`
   - Reference latest analysis results for identifying improvement opportunities
   - Use health metrics to prioritize refactoring efforts (critical/major issues first)

5. **Keep Summary Synced**  
   - Any new prompt or instruction must be added here with its key and purpose.  
   - If file locations or naming conventions change, update this summary immediately.  
   - Update architecture mappings when views or APIs change.

---

*Last updated: September 28, 2025 - Comprehensive architectural reference for key-based prompts.*  
