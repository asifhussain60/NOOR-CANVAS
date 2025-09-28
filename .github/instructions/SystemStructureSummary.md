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

#### waitingroom (`SessionWaiting.razor`) - **RECENTLY UPDATED**
- **APIs**: 
  - `GET /api/participant/session/{token}/validate` - validates session token and returns session details
  - `GET /api/participant/session/{token}/participants` - fetches participant list with country flag integration
- **Tables**: `canvas.Sessions`, `canvas.Participants`, `dbo.Countries` (flag lookup via ISO2)
- **SignalR**: SessionHub (`/hub/session`) - real-time participant updates, group: `usertoken_{token}`
- **Key Features**: Real-time participant list, countdown timer, session details display, country flag service integration
- **Performance**: Optimized debug logging removal completed (90% log volume reduction)
- **Purpose**: Pre-session waiting room with participant list and countdown timer

#### hostcanvas (`HostControlPanel.razor`) - **RECENTLY UPDATED**
- **APIs**: 
  - `GET /api/question/session/{userToken}` - fetch session Q&A
  - `POST /api/host/session/{sessionId}/start` - start session
  - `GET /api/host/sessions/{sessionId}/assets` - fetch available assets
  - `POST /api/host/share-asset` - broadcast content to participants
  - `GET /api/participant/session/{token}/participants` - fetch participant list with country flags
- **Tables**: `canvas.Sessions` (ScheduledDate, ScheduledTime, ScheduledDuration fields), `canvas.Questions`, `canvas.AssetLookup`, `KSESSIONS.Sessions`, `KSESSIONS.SessionTranscripts`, `KSESSIONS.Countries`
- **Direct DB**: SimplifiedCanvasDb, KSessionsDb contexts (bypasses API layer)
- **SignalR**: SessionHub, QAHub, AnnotationHub - groups: `session_{sessionId}`, `host_{hostToken}`
- **Key Features**: Enhanced UI with session timing cards, centered session name/description styling, clean borderless transcript display, real-time participant management
- **UI Enhancements**: Session time/duration cards in SESSION CONTROLS panel, improved typography, removed dotted borders for cleaner appearance
- **Purpose**: Host session management, Q&A moderation, real-time content broadcasting, and enhanced session timing display

#### canvas (`SessionCanvas.razor`) - **RECENTLY UPDATED**
- **APIs**: 
  - `GET /api/participant/session/{token}/validate` - validate participant session
  - `GET /api/participant/session/{token}/participants` - fetch session participants  
  - `POST /api/Question/Submit` - submit new question
  - `POST /api/Question/Vote` - vote on question
  - `DELETE /api/Question/Delete/{questionId}?userGuid={guid}` - delete own question
- **Tables**: `canvas.Sessions`, `canvas.Participants`, `canvas.Questions`, `canvas.QuestionVotes`
- **SignalR**: SessionHub (`/hub/session`), QAHub (`/hub/qa`) - groups: `session_{sessionId}`, `usertoken_{token}`
- **Key Features**: Enhanced UI with reduced header padding (10px), session description display with Lato font, removed metadata cards for cleaner interface
- **UI Enhancements**: Optimized header layout, standardized 200px logo sizing, enhanced canvas height (75vh-150px), maintained pulse animation for placeholder text
- **Data Model**: Extended SessionCanvasViewModel with SessionDescription property for enhanced session information display
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

## File Locations

- **/instructions**:  
  Contains high-level behavioral guides. Example:  
  - `SelfAwareness.instructions.md`: central meta-instruction.  
  - `API-Contract-Validation.md`: API-specific validations.  

- **/prompts**:  
  Contains task-specific operational prompts. Example:  
  - `refactor.prompt.md`: deep code restructuring guidance.  
  - `retrosync.prompt.md`: alignment checks across layers.  
  - `workitem.prompt.md`: generating or managing discrete dev tasks.  

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

4. **Keep Summary Synced**  
   - Any new prompt or instruction must be added here with its key and purpose.  
   - If file locations or naming conventions change, update this summary immediately.  
   - Update architecture mappings when views or APIs change.

---

*Last updated: September 28, 2025 - Waitingroom task completed with debug logging optimization and performance improvements.*  
