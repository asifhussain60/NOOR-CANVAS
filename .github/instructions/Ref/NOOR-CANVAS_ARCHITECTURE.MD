# NOOR-CANVAS ARCHITECTURE

## Purpose
This document contains the **complete system architecture** for the NOOR Canvas application.  
It serves as the authoritative reference for developers and Copilot when implementing features or understanding system behavior.

**Last Updated**: September 29, 2025  
**Build Status**: ✅ Passing (Clean build)  
**Framework**: ASP.NET Core 8.0 + Blazor Server + SignalR
**Controllers**: 11 operational controllers
**API Endpoints**: 40+ endpoints across all controllers

---

# 1. API ENDPOINTS CATALOG

## 1.1 Question Controller (`/api/question`)
- **POST /api/question/submit** - Submit new question to session
- **POST /api/question/{questionId}/vote** - Vote on existing question  
- **GET /api/question/session/{sessionToken}** - Get all questions for session
- **POST /api/question/{questionId}/delete** - Delete user's own question

## 1.2 Participant Controller (`/api/participant`)
- **GET /api/participant/session/{token}/validate** - Validate session token and get details
- **POST /api/participant/register-with-token** - Register participant with validated token
- **GET /api/participant/session/{token}/user-guid** - Get UserGuid for authenticated participant
- **GET /api/participant/session/{token}/participants** - Get participant list with country flags
- **DELETE /api/participant/session/{userToken}/participants** - Clear participants (host only)

## 1.3 Host Controller (`/api/host`)
- **POST /api/host/authenticate** - Host authentication with GUID tokens
- **GET /api/host/session/{hostGuid}/validate** - Validate host GUID token
- **GET /api/host/token/{friendlyToken}/validate** - Validate 8-character host token
- **POST /api/host/session/create** - Create new session with tokens
- **POST /api/host/session/{sessionId}/start** - Start active session
- **POST /api/host/session/{sessionId}/end** - End active session
- **GET /api/host/albums** - Get KSESSIONS albums for session creation
- **GET /api/host/categories/{albumId}** - Get categories for album
- **GET /api/host/sessions/{categoryId}** - Get sessions for category
- **GET /api/host/countries** - Get countries list for registration
- **POST /api/host/generate-token** - Generate host session tokens

## 1.4 Session Controller (`/api/session`)
- **GET /api/session/{sessionId}/state** - Get session state and status
- **GET /api/session/{sessionId}** - Get session details by ID
- **GET /api/session/guid/{sessionGuid}/state** - Get session state by GUID

## 1.5 Annotations Controller (`/api/annotations`)
- **GET /api/annotations/session/{sessionId}** - Get session annotations
- **GET /api/annotations/{id}** - Get specific annotation by ID
- **PUT /api/annotations/{id}** - Update annotation
- **DELETE /api/annotations/{id}** - Delete annotation
- **DELETE /api/annotations/session/{sessionId}/clear** - Clear all session annotations

## 1.6 Host Provisioner Controller (`/api/hostprovisioner`)
- **POST /api/hostprovisioner/generate** - Generate host provisioning data
- **GET /api/hostprovisioner/status** - Get provisioner status

## 1.7 Token Controller (`/api/token`)
- **GET /api/token/validate/{token}** - Validate friendly tokens (host/user) with comprehensive logging
  - Query Parameter: `isHost` (boolean) - Specify if validating host token
  - Returns: Token validation result with session details and expiration
  - Features: Request tracking, IP logging, comprehensive error handling

## 1.8 Health Controller (`/health`)
- **GET /health** - System health check with database connectivity validation
  - Returns: Health status, database connectivity, canvas schema validation
  - Features: Environment detection, table count verification, error logging
  - Purpose: Monitoring, DevOps integration, system diagnostics

## 1.9 Logs Controller (`/api/logs`)
- **POST /api/logs** - Receive and process browser-side log entries
  - Body: JsonElement with browser log data (level, component, message, sessionId, userId, url, data)
  - Features: Structured logging, session correlation, user tracking
  - Purpose: Client-side error tracking and debugging support

---

# 2. RAZOR PAGES & COMPONENTS

## 2.1 Core Application Pages
### SessionCanvas.razor (`/session/{token}`)
- **Purpose**: Main participant interface for live sessions
- **APIs**: Question submission, voting, participant list
- **SignalR**: SessionHub (question reception), QAHub (voting updates)
- **Features**: Real-time Q&A, voting, content reception, authentication handling
- **Database**: Sessions, Participants, Questions, QuestionVotes tables
- **Recent Updates**: Enhanced UI with reduced header padding, session description display

### HostControlPanel.razor (`/host/control-panel/{hostToken}`)
- **Purpose**: Host session management and moderation interface
- **APIs**: Session control, Q&A management, asset sharing, participant monitoring
- **SignalR**: SessionHub (content broadcasting), QAHub (Q&A moderation)
- **Features**: Session timing cards, Q&A moderation, real-time participant management, asset sharing
- **Database**: Sessions, Questions, AssetLookup, SessionTranscripts
- **Recent Updates**: Session timing enhancements, borderless transcript display, enhanced UI styling

### SessionWaiting.razor (`/waiting/{token}`)  
- **Purpose**: Pre-session waiting room with participant list and countdown
- **APIs**: Session validation, participant list with country flags
- **SignalR**: SessionHub (real-time participant updates)
- **Features**: Country flag integration, countdown timer, real-time participant list
- **Database**: Sessions, Participants, Countries (flag lookup)
- **Performance**: 90% debug log reduction completed

### UserLanding.razor (`/user/landing/{token}`)
- **Purpose**: Two-phase user authentication and registration
- **APIs**: Token validation, participant registration, country selection
- **Features**: JsonElement-based registration response handling, country dropdown
- **Database**: Sessions, Participants, Countries
- **Recent Updates**: Fixed RuntimeBinderException with proper JSON parsing

### HostLanding.razor (`/host/landing/{hostToken}`)
- **Purpose**: Host authentication using friendly 8-character tokens
- **APIs**: Host token validation, user token generation
- **Features**: Host authentication, user registration URL generation
- **Database**: Sessions (HostToken, UserToken mapping)

### Host-SessionOpener.razor (`/host/session-opener`)
- **Purpose**: Host session creation with cascading dropdowns
- **Service**: HostSessionService (wraps KSESSIONS integration APIs)
- **Features**: Album→Category→Session selection, custom scheduling
- **Database**: KSESSIONS.Groups, KSESSIONS.Categories, KSESSIONS.Sessions, canvas.Sessions

## 2.2 Development & Testing Pages
- **AnnotationDemo.razor** - Annotation system demonstration
- **SimpleSignalRTest.razor** - Basic SignalR connectivity testing
- **SignalRTest.razor** - Advanced SignalR functionality testing
- **CreateSession.razor** - Session creation interface
- **ParticipantRegister.razor** - Participant registration interface
- **HostSessionManager.razor** - Host session management

---

# 3. SIGNALR HUBS & REAL-TIME COMMUNICATION

## 3.1 SessionHub (`/hub/session`)
### Client Methods (Send to Clients):
- **UserJoined(connectionId, role, timestamp)** - User joins session notification
- **UserLeft(connectionId, timestamp)** - User leaves session notification  
- **AssetShared(assetData, broadcastId, timestamp)** - Content asset broadcasting
- **QuestionReceived(questionData)** - New question for participants
- **HostQuestionAlert(questionData)** - New question alert for hosts
- **VoteUpdateReceived(questionText, voteCount)** - Vote count updates
- **QuestionAnswered(questionId, timestamp)** - Question marked as answered
- **Pong()** - Heartbeat response

### Server Methods (Receive from Clients):
- **JoinSession(sessionId, role)** - Join session group
- **LeaveSession(sessionId)** - Leave session group
- **ShareAsset(sessionId, assetData)** - Broadcast content asset
- **BroadcastQuestion(sessionId, questionData)** - Broadcast new question
- **BroadcastVoteUpdate(sessionId, voteData)** - Broadcast vote updates
- **MarkQuestionAnswered(sessionId, questionId)** - Mark question answered
- **JoinHostGroup(sessionId)** - Join host-specific group
- **LeaveHostGroup(sessionId)** - Leave host-specific group
- **JoinGroup(groupName)** - Generic group join
- **LeaveGroup(groupName)** - Generic group leave
- **Ping()** - Connection heartbeat

### Group Patterns:
- **session_{sessionId}** - All session participants
- **Host_{sessionId}** - Host-only notifications
- **usertoken_{token}** - Individual user targeting

## 3.2 QAHub (`/hub/qa`)
- **Purpose**: Dedicated Q&A real-time communication
- **Integration**: Works with SessionHub for comprehensive Q&A flow
- **Features**: Question submission, voting, moderation

## 3.3 AnnotationHub (`/hub/annotation`) 
### Server Methods:
- **JoinSession(sessionId, userId)** - Join annotation session
- **LeaveSession(sessionId, userId)** - Leave annotation session
- **BroadcastAnnotation(sessionId, userId, annotationData)** - Create annotation
- **BroadcastAnnotationUpdate(sessionId, annotationId, userId, annotationData)** - Update annotation
- **BroadcastAnnotationDeletion(sessionId, annotationId, userId)** - Delete annotation
- **BroadcastClearAnnotations(sessionId, userId)** - Clear all annotations

### Client Methods:
- **AnnotationReceived(annotationData)** - New annotation notification
- **AnnotationUpdated(annotationData)** - Annotation update notification
- **AnnotationDeleted(annotationId)** - Annotation deletion notification
- **AnnotationsCleared()** - All annotations cleared notification

## 3.4 TestHub (`/hub/test`)
- **SendMessage(message)** - Basic message broadcasting
- **JoinHtmlTestSession(sessionId)** - Join HTML test session
- **BroadcastHtml(sessionId, htmlContent, contentType)** - Broadcast HTML content
- **Echo(message)** - Echo test functionality

---

# 4. DATABASE ARCHITECTURE

## 4.1 Simplified Canvas Database (`SimplifiedCanvasDbContext`)
Ultra-minimal 4-table design (75% reduction from original 15 tables):

### Sessions Table
```sql
SessionId (bigint, PK, Identity)
HostToken (nvarchar(8), Unique) -- 8-character friendly host token
UserToken (nvarchar(450), Unique) -- GUID-based user token  
Status (nvarchar(50)) -- Active, Waiting, Ended
CreatedAt (datetime2)
ExpiresAt (datetime2)
MaxParticipants (int)
ScheduledDate (nvarchar(50)) -- e.g., "2025-09-28"
ScheduledTime (nvarchar(50)) -- e.g., "14:30"  
ScheduledDuration (nvarchar(50)) -- e.g., "60" (minutes)
SessionDescription (nvarchar(max)) -- Session description for display
```

### Participants Table  
```sql
ParticipantId (bigint, PK, Identity)
SessionId (bigint, FK → Sessions.SessionId)
UserGuid (uniqueidentifier) -- Authentication tracking
Name (nvarchar(450))
CountryCode (nvarchar(10)) -- ISO2 country code for flag lookup
CreatedAt (datetime2)
ConnectionId (nvarchar(450)) -- SignalR connection tracking
```

### SessionData Table
```sql
DataId (bigint, PK, Identity) 
SessionId (bigint, FK → Sessions.SessionId)
QuestionText (nvarchar(max))
UserName (nvarchar(450))
UserGuid (uniqueidentifier)
Votes (int, default 0)
IsAnswered (bit, default 0)
SubmittedAt (datetime2)
```

### AssetLookup Table
```sql
AssetId (bigint, PK, Identity)
AssetType (nvarchar(100)) -- 'video', 'audio', 'hadith', etc.
CssSelector (nvarchar(500)) -- CSS selector for HTML detection
DisplayName (nvarchar(200)) -- Human-readable asset name
IsActive (bit, default 1)
CreatedAt (datetime2)
```

### Indexes & Constraints:
- **UQ_Sessions_HostToken** - Unique host tokens
- **UQ_Sessions_UserToken** - Unique user tokens
- **IX_Sessions_Status_Expires** - Performance index for session queries
- **IX_Participants_SessionId** - Participant lookup optimization
- **IX_Participants_SessionUser** - Session-user composite index

## 4.2 Canvas Database (`CanvasDbContext`) - Legacy Schema
Comprehensive 15-table design with full audit trails and complex relationships:
- Sessions, Participants, Questions, QuestionVotes, Annotations
- UserSessions, SessionLinks, HostSessions, AdminSessions
- SharedAssets, AuditLogs, Issues, Registrations
- SecureTokens, Users

## 4.3 KSESSIONS Database (`KSessionsDbContext`) - External Integration
Integration with existing KSESSIONS system:
```sql
Groups -- Albums for session content organization
Categories -- Content categories within albums  
Sessions -- Available sessions for host selection
Countries -- Country lookup with ISO2 codes and flags
SessionTranscripts -- Session content and transcripts
```

---

# 5. SERVICES ARCHITECTURE

## 5.1 Core Services
### SecureTokenService
- **Purpose**: Core token validation and session management for TokenController
- **Key Methods**: `ValidateTokenAsync(string token, bool isHost)` - validates friendly tokens
- **Database**: Direct access to canvas.Sessions table for token lookup
- **Integration**: Used by TokenController API for authentication flows
- **Features**: Request tracking, comprehensive logging, error handling

### SimplifiedTokenService
- **Purpose**: Token validation and management for 4-table simplified schema
- **Key Methods**: Token validation, session lookup, expiration handling
- **Database**: Simplified canvas schema integration

### SessionStateService
- **Purpose**: Client-side session state persistence via localStorage
- **Key Methods**: Session state save/load, cross-component state management
- **Integration**: Used by HostControlPanel and SessionCanvas for state persistence

### HostSessionService
- **Purpose**: Host session creation with KSESSIONS integration APIs
- **Key Methods**: `LoadAlbumsAsync()`, `CreateSessionAndGenerateTokensAsync()`
- **Database**: KSESSIONS integration for album/category/session hierarchies
- **Features**: Cascading dropdown support, custom scheduling

## 5.2 Content & Security Services
### SafeHtmlRenderingService
- **Purpose**: Secure HTML content processing and XSS prevention
- **Key Methods**: HTML sanitization, Blazor-safe content wrapping
- **Security**: Prevents malicious script injection in dynamic content
- **Integration**: Used by transcript display and content broadcasting

### HtmlParsingService
- **Purpose**: Advanced HTML parsing with safety validation
- **Key Methods**: Content parsing, asset detection, safety checks
- **Integration**: Works with AssetDetectionService for content analysis

### AssetDetectionService / AssetDetectorService
- **Purpose**: Content asset detection and classification
- **Key Methods**: Asset type detection, CSS selector matching
- **Database**: AssetLookup table for asset definitions
- **Features**: Video/audio/hadith content recognition

## 5.3 Integration & Utility Services
### FlagService
- **Purpose**: Country flag integration for participant display
- **Key Methods**: ISO2 to flag mapping, country flag resolution
- **Database**: Integration with Countries table for flag lookup
- **Performance**: Caching for optimal flag resolution

### AnnotationService
- **Purpose**: Annotation creation and management
- **Key Methods**: Create, update, delete annotations
- **SignalR**: Integration with AnnotationHub for real-time updates
- **Database**: Annotations table management

### DialogService
- **Purpose**: Modal dialog management across Blazor components
- **Key Methods**: Show/hide dialogs, confirmation dialogs
- **Integration**: Cross-component dialog coordination

### DebugService
- **Purpose**: Development environment debugging utilities
- **Key Methods**: Debug logging, development diagnostics
- **Environment**: Development-only functionality

---

# 6. AUTHENTICATION & SECURITY

## 6.1 Token-Based Authentication
### Host Authentication:
- **8-Character Tokens**: Human-friendly host tokens (e.g., "AB12CD34")
- **GUID Tokens**: Secure host session tokens for API access
- **Validation Flow**: Friendly token → GUID token → session access

### User Authentication:
- **Session Tokens**: GUID-based user tokens for participant access
- **UserGuid**: Individual user tracking within sessions
- **Two-Phase Flow**: Token validation → participant registration → session access

## 6.2 Authorization Patterns
- **Session-Based**: Users can only access their registered sessions
- **Role-Based**: Hosts have elevated permissions for session management
- **Token Validation**: All API endpoints validate tokens before processing
- **Q&A Authorization**: Users can only vote/delete their own content

---

# 7. RECENT IMPLEMENTATIONS & FIXES

## 7.1 Canvas-QA Authentication Fix (September 2025)
- **Issue**: RuntimeBinderException in UserLanding.razor preventing Q&A access
- **Fix**: Replaced `ReadFromJsonAsync<dynamic>()` with `ReadFromJsonAsync<JsonElement>()`
- **Impact**: Proper JSON parsing, type-safe UserGuid extraction, eliminated authentication loops
- **Files**: UserLanding.razor, SessionCanvas.razor (401 redirect handling)

## 7.2 Q&A Bidirectional SignalR Broadcasting
- **Feature**: Complete real-time Q&A flow between participants and hosts
- **Implementation**: QuestionReceived and HostQuestionAlert event handlers
- **Components**: SessionCanvas.razor, HostControlPanel.razor, QuestionController.cs
- **SignalR**: Enhanced SessionHub with proper JSON serialization

## 7.3 Host Control Panel UI Enhancements
- **Session Timing Cards**: Elegant time/duration display in SESSION CONTROLS
- **Typography**: Centered session name/description with Lato font styling  
- **Clean Design**: Removed dotted borders for borderless transcript display
- **Real-time Updates**: Enhanced participant monitoring and Q&A moderation

## 7.4 Debug Log Cleanup Initiative
- **Scope**: Removed 90+ lines of DEBUG-WORKITEM:canvas-qa trace logging
- **Files**: SessionCanvas.razor, HostControlPanel.razor, QuestionController.cs, UserLanding.razor
- **Impact**: Cleaner codebase, reduced log volume, maintained functionality
- **Status**: ✅ Complete - All debug markers cleaned from source files

---

# 8. TECHNOLOGY STACK

## 8.1 Backend Framework
- **ASP.NET Core 8.0** - Web framework and API hosting
- **Blazor Server** - Server-side rendering with SignalR communication
- **Entity Framework Core** - Database ORM with multiple contexts
- **SignalR** - Real-time bidirectional communication

## 8.2 Frontend Technologies  
- **Blazor Components** - Server-side rendered UI components
- **Tailwind CSS** - Utility-first CSS framework with purple theme
- **JavaScript Interop** - Client-side functionality and browser APIs
- **CSS Grid/Flexbox** - Modern layout systems

## 8.3 Database Technologies
- **SQL Server** - Primary database engine
- **Multiple Contexts** - SimplifiedCanvas, Canvas, KSESSIONS databases
- **EF Migrations** - Schema versioning and deployment
- **Performance Indexes** - Optimized query performance

## 8.4 Development & Testing
- **Playwright** - End-to-end testing framework with TypeScript
- **StyleCop** - C# code style analysis and enforcement
- **ESLint** - JavaScript/TypeScript code quality
- **Prettier** - Code formatting and consistency

---

# 9. QUALITY GATES & STANDARDS

## 9.1 Build Requirements
- ✅ **Build Success**: `dotnet build --no-restore --warnaserror` (0 warnings)
- ✅ **Linting**: `npm run lint` passes with 0 warnings
- ✅ **Formatting**: `npm run format:check` passes
- ✅ **Tests**: Playwright test suite passes

## 9.2 Documentation Standards  
- **XML Documentation**: All public APIs and methods documented
- **Architecture Updates**: Changes reflected in this document
- **Code Comments**: Complex logic explained with inline comments
- **Change Tracking**: All modifications logged with rationale

## 9.3 Performance Standards
- **Build Time**: Target <6 seconds for clean builds
- **Response Time**: API endpoints <200ms average
- **Real-time**: SignalR message delivery <100ms
- **Memory**: Efficient resource usage with proper disposal

---

**Document Version**: 1.1.0  
**Last Sync**: September 29, 2025  
**Next Review**: December 2025 or after major feature releases  


---
### Patch: Architecture Guidance
- Ensure all prompt workflows follow naming conventions.
- Added requirement for centralized error handling in sync/migrate operations.