# NOOR Canvas Application Architecture

> **Last Updated:** September 27, 2025  
> **Purpose:** Comprehensive architectural overview for AI assistants to prevent duplication and understand system structure

## 🏗️ System Overview

**NOOR Canvas** is an ASP.NET Core Blazor Server application that provides an interactive Islamic education platform with real-time collaboration features. The system uses a hybrid architecture with two databases and supports host-controlled sessions with participant interaction.

### Key Technologies
- **Framework:** ASP.NET Core 8.0 with Blazor Server
- **Database:** SQL Server (dual-database architecture)
- **Real-time:** SignalR hubs
- **Frontend:** Razor components with Blazor
- **Authentication:** Token-based (Host/User tokens)

---

## 📊 Database Architecture

### 1. Simplified Canvas Database (`SimplifiedCanvasDbContext`)
**Purpose:** Ultra-minimal 4-table design for session management

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `Sessions` | Active sessions | `SessionId`, `HostToken`, `UserToken`, `Status`, `AlbumId` |
| `Participants` | Session participants | `SessionId`, `UserGuid`, `Email`, `Country` |
| `SessionData` | JSON session data | `SessionId`, `Data` (JSON), `CreatedAt` |
| `AssetLookup` | Global asset definitions | `AssetType`, `Selector`, `IsActive` |

### 2. KSESSIONS Database (`KSessionsDbContext`) 
**Purpose:** Read-only Islamic content repository

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `Sessions` | Islamic content sessions | `SessionId`, `SessionName`, `GroupId`, `CategoryId` |
| `SessionTranscripts` | Session transcripts | `SessionId`, `Transcript` |
| `Groups` | Content albums | `Id`, `Name`, `Description`, `IsActive` |
| `Categories` | Content categories | `CategoryId`, `CategoryName`, `GroupId` |
| `Countries` | Country lookup | `CountryId`, `CountryName`, `ISO2`, `IsShortListed` |

---

## 🌐 API Endpoints

### Host Controller (`/api/host`)
Primary API for host operations and session management.

| Method | Endpoint | Purpose | Returns |
|--------|----------|---------|---------|
| POST | `/authenticate` | Host authentication | `HostAuthResponse` |
| GET | `/validate/{hostGuid}` | Validate host session | Session status |
| GET | `/token/{friendlyToken}/validate` | Validate host token | `HostSessionValidationResponse` |
| POST | `/session/create` | Create new session | `CreateSessionResponse` |
| POST | `/sessions/{sessionId}/start` | Start session | Session status |
| POST | `/sessions/{sessionId}/end` | End session | Session status |
| GET | `/albums` | Get content albums | `AlbumData[]` |
| GET | `/categories/{albumId}` | Get categories | `CategoryData[]` |
| GET | `/sessions/{categoryId}` | Get sessions | `HostSessionData[]` |
| GET | `/countries` | Get countries | `CountryData[]` |
| POST | `/generate-token` | Generate session token | Token data |
| GET | `/session-details/{sessionId}` | Get session details | Session + transcript |
| GET | `/session-status` | Get current status | Session status |
| GET | `/asset-patterns/{sessionId}` | Get asset patterns | Asset pattern definitions |
| GET | `/sessions/{sessionId}/assets` | Get session assets | Asset list |
| POST | `/share-asset` | Share asset | Success response |

### Session Controller (`/api/session`)
Session state and information management.

| Method | Endpoint | Purpose | Returns |
|--------|----------|---------|---------|
| GET | `/{sessionId}/state` | Get session state | Session state |
| GET | `/{sessionId}/info` | Get session info | Session information |
| GET | `/guid/{sessionGuid}/state` | Get state by GUID | Session state |

### Participant Controller (`/api/participant`)
User participation and registration.

| Method | Endpoint | Purpose | Returns |
|--------|----------|---------|---------|
| GET | `/validate/{token}` | Validate session token | Validation result |
| POST | `/register` | Register participant | Registration result |
| GET | `/{token}/guid` | Get user GUID | User GUID |
| GET | `/{token}/participants` | Get participants | Participant list |
| DELETE | `/{userToken}` | Remove participant | Success response |

### Question Controller (`/api/question`)
Q&A functionality for sessions.

| Method | Endpoint | Purpose | Returns |
|--------|----------|---------|---------|
| POST | `/submit` | Submit question | Question ID |
| POST | `/{questionId}/vote` | Vote on question | Vote result |
| GET | `/{sessionToken}` | Get questions | Question list |
| DELETE | `/{questionId}` | Delete question | Success response |

### Token Controller (`/api/token`)
Token validation and management.

| Method | Endpoint | Purpose | Returns |
|--------|----------|---------|---------|
| GET | `/validate/{token}` | Validate token | Validation result |
| POST | `/generate/{sessionId}` | Generate token pair | Token pair |
| GET | `/{sessionId}/session-token` | Get session token | Session token |
| POST | `/{userToken}/expire` | Expire user token | Success response |

### Annotations Controller (`/api/annotations`)
Session annotation management.

| Method | Endpoint | Purpose | Returns |
|--------|----------|---------|---------|
| GET | `/{sessionId}` | Get annotations | Annotation list |
| POST | `/` | Create annotation | Annotation ID |
| GET | `/{id}` | Get annotation | Annotation data |
| PUT | `/{id}` | Update annotation | Updated annotation |
| DELETE | `/{id}` | Delete annotation | Success response |
| DELETE | `/{sessionId}/clear` | Clear all annotations | Success response |

### Admin Controller (`/api/admin`)
Administrative functions.

| Method | Endpoint | Purpose | Returns |
|--------|----------|---------|---------|
| POST | `/authenticate` | Admin authentication | Admin auth response |
| GET | `/sessions` | Get all sessions | Session list |
| POST | `/sessions/{sessionId}/terminate` | Terminate session | Success response |
| GET | `/users` | Get all users | User list |
| POST | `/users/{userId}/deactivate` | Deactivate user | Success response |

### Health Controller (`/health`)
System health monitoring.

| Method | Endpoint | Purpose | Returns |
|--------|----------|---------|---------|
| GET | `/` | Basic health check | Health status |
| GET | `/detailed` | Detailed health | Detailed status |

### Host Provisioner Controller (`/api/hostprovisioner`)
Host token provisioning.

| Method | Endpoint | Purpose | Returns |
|--------|----------|---------|---------|
| POST | `/generate` | Generate host token | Host token |
| GET | `/status` | Get provisioner status | Status info |

### Issue Controller (`/api/issue`)
Issue tracking and reporting.

| Method | Endpoint | Purpose | Returns |
|--------|----------|---------|---------|
| POST | `/` | Create issue | Issue ID |
| GET | `/{id}` | Get issue | Issue data |
| GET | `/` | Get issues | Issue list |

### Logs Controller (`/api/logs`)
Browser log collection.

| Method | Endpoint | Purpose | Returns |
|--------|----------|---------|---------|
| POST | `/` | Receive browser log | Success response |

---

## 🎨 Razor Pages & Components

### Pages (`/Pages`)

| Page | Route | Purpose | Layout |
|------|-------|---------|---------|
| `Host-SessionOpener.razor` | `/host/session-opener/{token?}` | Host session creation | `EmptyLayout` |
| `HostLanding.razor` | `/host` | Host dashboard | `MainLayout` |
| `HostSessionManager.razor` | `/host/session-manager` | Session management | `MainLayout` |
| `HostControlPanel.razor` | `/host/control-panel/{token}` | Session control | `EmptyLayout` |
| `UserLanding.razor` | `/join/{token?}` | User entry point | `EmptyLayout` |
| `ParticipantRegister.razor` | `/register/{token}` | User registration | `EmptyLayout` |
| `SessionWaiting.razor` | `/waiting/{token}` | Waiting room | `EmptyLayout` |
| `SessionCanvas.razor` | `/session/{token}` | Main session experience | `EmptyLayout` |
| `CreateSession.razor` | `/create-session` | Session creation | `MainLayout` |
| `AnnotationDemo.razor` | `/annotation-demo` | Annotation testing | `MainLayout` |

### Test & Debug Pages

| Page | Route | Purpose |
|------|-------|---------|
| `SignalRTest.razor` | `/signalr-test` | SignalR testing |
| `SimpleSignalRTest.razor` | `/simple-signalr-test` | Basic SignalR test |
| `SessionTestHarness.razor` | `/test/session-harness` | Session testing |
| `VisualDemo.razor` | `/test/visual-demo` | Visual component demo |

### Shared Components (`/Shared`)

| Component | Purpose |
|-----------|---------|
| `MainLayout.razor` | Primary app layout with navigation |
| `EmptyLayout.razor` | Clean layout for session pages |
| `NavMenu.razor` | Navigation menu component |

### Components (`/Components`)

| Component | Purpose | Dependencies |
|-----------|---------|--------------|
| `AnnotationCanvas.razor` | Canvas annotation overlay | SignalR, Canvas API |
| `SessionUrlPanel.razor` | Session URL display/copy | Clipboard API |
| `SignalRDebugPanel.razor` | SignalR debugging tools | SignalR Hub |
| `FlagIcon.razor` | Country flag display | Flag service |

### Dialog Components (`/Components/Dialogs`)

| Component | Purpose |
|-----------|---------|
| `ConfirmDialog.razor` | Confirmation dialogs |
| `AlertDialog.razor` | Alert notifications |

### Development Components (`/Components/Development`)

| Component | Purpose |
|-----------|---------|
| `DevPanel.razor` | Development tools panel |
| `DebugPanel.razor` | Debug information display |

---

## 🔧 Services (`/Services`)

### Core Services

| Service | Purpose | Key Methods |
|---------|---------|-------------|
| `HostSessionService` | Host session operations | `LoadAlbumsAsync()`, `LoadCategoriesAsync()`, `CreateSessionAsync()` |
| `SimplifiedTokenService` | Token validation/generation | `ValidateTokenAsync()`, `GenerateTokenPairAsync()` |
| `SessionStateService` | Session state management | `GetSessionStateAsync()`, `UpdateSessionAsync()` |
| `AnnotationService` | Annotation CRUD operations | `CreateAnnotationAsync()`, `GetAnnotationsAsync()` |

### Utility Services

| Service | Purpose | Key Methods |
|---------|---------|-------------|
| `DialogService` | Modal dialog management | `ShowConfirmAsync()`, `ShowAlertAsync()` |
| `AssetDetectionService` | Asset pattern detection | `DetectAssetsAsync()`, `GetAssetPatterns()` |
| `HtmlParsingService` | HTML content parsing | `ParseHtmlAsync()`, `ExtractElements()` |
| `SafeHtmlRenderingService` | Safe HTML rendering | `SanitizeHtmlAsync()` |
| `FlagService` | Country flag utilities | `GetFlagUrl()`, `GetCountryInfo()` |

### Development Services (`/Services/Development`)

| Service | Purpose | Key Methods |
|---------|---------|-------------|
| `DevModeService` | Development mode tools | `IsDevModeEnabled()`, `GetDevSettings()` |
| `TestDataService` | Test data generation | `GenerateTestSession()`, `GetMockData()` |
| `DebugService` | Debug utilities | `LogDebugInfo()`, `CaptureState()` |

### Security Services

| Service | Purpose | Key Methods |
|---------|---------|-------------|
| `SecureTokenService` | Secure token operations | `GenerateSecureToken()`, `ValidateToken()` |
| `SecureSessionTokenService` | Session token security | `CreateSessionToken()`, `ValidateSessionToken()` |

---

## 📡 SignalR Hubs (`/Hubs`)

### SessionHub
**Purpose:** Real-time session coordination and participant communication

| Method | Purpose | Parameters |
|--------|---------|------------|
| `JoinSession(token)` | Join session group | `string token` |
| `LeaveSession(token)` | Leave session group | `string token` |
| `ShareAsset(request)` | Share asset with participants | `ShareAssetRequest` |
| `SendMessage(message)` | Send chat message | `string message` |
| `UpdateParticipant(data)` | Update participant info | `object data` |

**Client Events:** `ParticipantJoined`, `ParticipantLeft`, `AssetShared`, `MessageReceived`, `SessionStarted`, `SessionEnded`

### AnnotationHub
**Purpose:** Real-time annotation synchronization

| Method | Purpose | Parameters |
|--------|---------|------------|
| `JoinAnnotationGroup(sessionId)` | Join annotation group | `long sessionId` |
| `CreateAnnotation(request)` | Create new annotation | `CreateAnnotationRequest` |
| `UpdateAnnotation(id, data)` | Update annotation | `long id, object data` |
| `DeleteAnnotation(id)` | Delete annotation | `long id` |

**Client Events:** `AnnotationCreated`, `AnnotationUpdated`, `AnnotationDeleted`

### QAHub
**Purpose:** Question & Answer functionality

| Method | Purpose | Parameters |
|--------|---------|------------|
| `JoinQAGroup(sessionId)` | Join Q&A group | `long sessionId` |
| `SubmitQuestion(question)` | Submit question | `string question` |
| `VoteQuestion(questionId, vote)` | Vote on question | `int questionId, bool vote` |

**Client Events:** `QuestionSubmitted`, `QuestionVoted`, `QuestionAnswered`

### TestHub
**Purpose:** Development and testing

| Method | Purpose | Parameters |
|--------|---------|------------|
| `SendTestMessage(message)` | Send test message | `string message` |
| `JoinTestGroup(groupName)` | Join test group | `string groupName` |

---

## 📋 Data Models (`/Models`)

### Core Models

| Model | Purpose | Key Properties |
|-------|---------|----------------|
| `Session` | Session entity | `SessionId`, `HostToken`, `UserToken`, `Status`, `AlbumId` |
| `Participant` | Session participant | `SessionId`, `UserGuid`, `Email`, `Country` |
| `Annotation` | Canvas annotation | `SessionId`, `X`, `Y`, `Content`, `CreatedBy` |
| `Question` | Q&A question | `SessionId`, `Content`, `Votes`, `Status` |

### Request/Response Models

| Model | Purpose | Used In |
|-------|---------|---------|
| `HostAuthRequest` | Host authentication | Host login |
| `CreateSessionRequest` | Session creation | Session creation API |
| `CreateAnnotationRequest` | Annotation creation | Annotation API |
| `ShareAssetRequest` | Asset sharing | Asset sharing API |

### KSESSIONS Models (`/Models/KSESSIONS`)

| Model | Purpose | Key Properties |
|-------|---------|----------------|
| `KSessionsSession` | Content session | `SessionId`, `SessionName`, `GroupId`, `CategoryId` |
| `KSessionsSessionTranscript` | Session transcript | `SessionId`, `Transcript` |
| `KSessionsCountry` | Country data | `CountryId`, `CountryName`, `ISO2`, `IsShortListed` |

### Simplified Models (`/Models/Simplified`)

| Model | Purpose | Key Properties |
|-------|---------|----------------|
| `Session` | Simplified session | `SessionId`, `HostToken`, `UserToken`, `Status` |
| `SessionData` | JSON session data | `SessionId`, `Data`, `CreatedAt` |
| `AssetLookup` | Asset definitions | `AssetType`, `Selector`, `IsActive` |

### View Models (`/ViewModels`)

| Model | Purpose | Key Properties |
|-------|---------|----------------|
| `HostSessionOpenerViewModel` | Session creation form | `SelectedAlbum`, `SelectedCategory`, `SelectedSession` |

---

## 🔐 Authentication & Security

### Token Types
1. **Host Token (Friendly)** - 8-character alphanumeric (e.g., `PQ9N5YWW`)
2. **User Token** - GUID format for participants
3. **Session Token** - GUID format for session access

### Security Flow
1. Host authenticates with GUID → receives friendly token
2. Host creates session → generates user token
3. Participants join with user token → validated against session
4. All API calls require appropriate token validation

### Token Validation Services
- `SimplifiedTokenService` - Primary token validation
- `SecureTokenService` - Enhanced security operations
- `SecureSessionTokenService` - Session-specific tokens

---

## 🌊 Application Flow

### Host Workflow
1. **Authentication** → `POST /api/host/authenticate`
2. **Session Creation** → Navigate to `/host/session-opener/{token}`
3. **Content Selection** → Album → Category → Session (cascade dropdowns)
4. **Session Start** → `POST /api/host/session/create`
5. **Control Panel** → Navigate to `/host/control-panel/{token}`
6. **Asset Sharing** → `POST /api/host/share-asset`

### Participant Workflow
1. **Join Link** → Navigate to `/join/{token}`
2. **Registration** → Navigate to `/register/{token}` → `POST /api/participant/register`
3. **Waiting Room** → Navigate to `/waiting/{token}`
4. **Session Canvas** → Navigate to `/session/{token}`
5. **Interaction** → Annotations, Q&A via SignalR

### Real-time Communication
- **SignalR Groups** → `session_{sessionId}` for participants
- **Asset Sharing** → Broadcast via SessionHub
- **Annotations** → Sync via AnnotationHub
- **Q&A** → Manage via QAHub

---

## 🏗️ Key Architectural Patterns

### 1. Dual Database Strategy
- **Canvas DB** - Lightweight session management (4 tables)
- **KSESSIONS DB** - Rich Islamic content (read-only)

### 2. Token-Based Security
- No traditional authentication system
- Token-based access control for all operations
- Friendly tokens for hosts, GUIDs for participants

### 3. SignalR Real-time Architecture
- Hub-based real-time communication
- Group-based message routing
- Event-driven client updates

### 4. Blazor Server Components
- Server-side rendering with real-time UI updates
- Component-based architecture
- Minimal client-side JavaScript

### 5. Simplified Schema Design
- JSON storage in SessionData for flexibility
- Asset lookup patterns for content injection
- Ultra-minimal table structure

---

## 🚀 Deployment Architecture

### Application Structure
```
NoorCanvas/
├── Controllers/     # Web API endpoints
├── Pages/          # Razor pages/components  
├── Components/     # Reusable UI components
├── Services/       # Business logic services
├── Models/         # Data models & DTOs
├── Hubs/          # SignalR real-time hubs
├── Data/          # Entity Framework contexts
└── wwwroot/       # Static assets
```

### Configuration
- **Database:** SQL Server connection strings
- **SignalR:** Hub configuration with timeouts
- **Kestrel:** Performance-optimized server settings
- **Logging:** Serilog with structured logging

### Key URLs (Development)
- **HTTP:** `http://localhost:9090`
- **HTTPS:** `https://localhost:9091`
- **Health:** `https://localhost:9091/health`

---

## 📚 Dependencies & Libraries

### Core Dependencies
- ASP.NET Core 8.0
- Entity Framework Core
- SignalR
- Serilog (Logging)
- System.Text.Json

### Development Dependencies
- Playwright (E2E Testing)
- DocFX (Documentation)
- PowerShell Scripts (Build automation)

---

## 🔍 Common Integration Patterns

### API Call Pattern
```csharp
// Typical service injection and API call
@inject HostSessionService HostService

var albums = await HostService.LoadAlbumsAsync(token);
```

### SignalR Integration
```csharp
// Join session group and listen for events
await hubConnection.InvokeAsync("JoinSession", token);
hubConnection.On<object>("AssetShared", OnAssetReceived);
```

### Token Validation
```csharp
// Validate token in controller
var validation = await _tokenService.ValidateTokenAsync(token);
if (!validation.IsValid) return Unauthorized();
```

---

This architecture document provides a comprehensive overview of the NOOR Canvas application structure. Use this reference to understand existing functionality before implementing new features or making architectural changes.