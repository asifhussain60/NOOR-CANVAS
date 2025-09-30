# NOOR-CANVAS_ARCHITECTURE.MD

## Purpose
This document contains the **detailed system design and architecture** for the project.  
It serves as the authoritative reference for developers and Copilot when a deep understanding of the system is required.

**Last Updated:** September 30, 2025 via Retrosync Protocol  
**Current System Status:** 11 Controllers, 4 SignalR Hubs, 17+ Services, API-First Architecture

---

## Contents

### 1. API Contracts
- Full descriptions of all exposed APIs (52+ endpoints across 11 controllers)
- Request/response formats
- Authentication/authorization flows
- KSESSIONS database integration endpoints

### 2. Data Transfer Objects (DTOs)
- Complete DTO schemas with September 2025 additions
- Field-level details, types, and constraints
- New KSESSIONS integration DTOs

### 3. Database Schema
- SQL tables with columns, datatypes, indexes, and relationships
- Canvas and KSESSIONS database integration
- Stored procedures, triggers, and views
- Data integrity rules

### 4. Application Architecture
- Razor views and their dependencies (15+ pages, 10+ components)
- Services and components (17+ services)
- SignalR real-time communication (4 hubs)
- Integration between layers

### 5. Interactions and Dependencies
- How API, DTOs, and SQL objects interact
- Known coupling points and contracts
- API-First architectural patterns

---

## API Controllers Architecture (Current: 11 Controllers)

### Core Controllers

#### AdminController
- **Purpose**: Administrative functions and user management
- **Key Endpoints**: 
  - `GET /api/admin/sessions` - Session management
  - `GET /api/admin/users` - User administration
  - `POST /api/admin/user/{userId}/block` - User moderation
- **Features**: User administration, session oversight, system monitoring

#### HostController  
- **Purpose**: Session management, authentication, cascading dropdowns, asset processing
- **Key Endpoints**:
  - `POST /api/host/authenticate` - Host authentication
  - `GET /api/host/token/{friendlyToken}/validate` - 8-character token validation
  - `GET /api/host/albums` - Islamic content albums
  - `GET /api/host/categories/{albumId}` - Categories by album
  - `GET /api/host/sessions/{categoryId}` - Sessions by category
  - `POST /api/host/session/create` - Session creation
  - `POST /api/host/session/{sessionId}/start` - Start session
  - `POST /api/host/session/{sessionId}/end` - End session
  - `GET /api/host/sessions/list` - Host sessions list
  - `GET /api/host/sessions/{sessionId}/details` - Session details
  - `POST /api/host/share-asset` - Asset broadcasting
  - `POST /api/host/extract-asset` - Asset extraction
- **Architecture**: API-First with comprehensive SignalR integration

#### ParticipantController
- **Purpose**: User registration, session joining, country flag integration
- **Key Endpoints**:
  - `GET /api/participant/session/{token}/validate` - Token validation
  - `POST /api/participant/register-with-token` - User registration
  - `GET /api/participant/session/{token}/participants` - Participant list
  - `GET /api/participant/session/{token}/user-guid` - User GUID retrieval
  - `DELETE /api/participant/session/{userToken}/participants` - Participant cleanup
- **Features**: Two-phase user flow, country selection, real-time participant management

#### QuestionController
- **Purpose**: Q&A system functionality, real-time question management  
- **Key Endpoints**:
  - `POST /api/question/submit` - Submit question
  - `POST /api/question/{questionId}/vote` - Vote on question
  - `GET /api/question/session/{sessionToken}` - Get session Q&A
  - `POST /api/question/{questionId}/delete` - Delete question
- **Features**: Real-time Q&A, voting system, SignalR broadcasting

#### SessionController
- **Purpose**: Session lifecycle management
- **Key Endpoints**:
  - `GET /api/session/{sessionId}/state` - Session state
  - `GET /api/session/{sessionId}` - Session details
  - `GET /api/session/guid/{sessionGuid}/state` - Session state by GUID
- **Features**: Session state tracking, lifecycle management

#### AnnotationsController
- **Purpose**: Real-time annotation processing
- **Key Endpoints**:
  - `POST /api/annotations` - Create annotation
  - `GET /api/annotations/{sessionId}` - Get session annotations
- **Features**: Real-time drawing, annotation synchronization

#### HealthController
- **Purpose**: System monitoring and health checks
- **Key Endpoints**:
  - `GET /api/health` - Basic health check
  - `GET /api/health/detailed` - Comprehensive health metrics
  - `GET /healthz` - Kubernetes-style health endpoint
- **Features**: Database connectivity validation, service status monitoring

#### TokenController
- **Purpose**: Token validation and management
- **Key Endpoints**:
  - `GET /api/token/validate/{token}` - Token validation
  - `POST /api/token/generate/{sessionId}` - Generate tokens
  - `GET /api/token/session/{sessionId}` - Get session tokens
  - `POST /api/token/expire/{userToken}` - Expire token
- **Features**: Secure token operations, validation workflows

#### HostProvisionerController
- **Purpose**: Console tool integration for session provisioning
- **Key Endpoints**:
  - `POST /api/hostprovisioner/generate` - Generate host token
  - `GET /api/hostprovisioner/status` - Provisioner status
- **Features**: Programmatic session creation, automation support

#### IssueController  
- **Purpose**: Error tracking and issue management system
- **Key Endpoints**:
  - `POST /api/issue` - Create issue
  - `GET /api/issue/{id}` - Get issue
  - `GET /api/issue` - List issues
- **Features**: Error tracking, debugging support

#### LogsController
- **Purpose**: Client-side error logging
- **Key Endpoints**:
  - `POST /api/logs` - Log client error
- **Features**: Client-side error capture, debugging support

---

## New API Endpoints (September 2025)

### Enhanced KSESSIONS API Integration
As part of architecture modernization, new APIs have been created to eliminate direct database access violations:

#### GET /api/host/ksessions/session/{sessionId}/details
- **Purpose**: Enhanced session details with transcript from KSESSIONS database
- **Response**: `EnhancedSessionDetailsResponse` containing `SessionDetailsDto`
- **Features**: Includes session metadata, transcript content, and navigation data (Group, Category, Speaker)
- **Usage**: Replaces direct KSessionsDb access in HostControlPanel.razor

#### GET /api/host/ksessions/countries/flags
- **Purpose**: Country flag mappings from KSESSIONS database
- **Query Parameters**: `countryCodes[]` (optional) - filter by specific ISO2 codes
- **Response**: `CountryFlagsResponse` with dictionary mapping ISO2 → lowercase flag codes
- **Usage**: Replaces direct database queries for participant country flag display

#### GET /api/host/asset-lookup
- **Purpose**: Asset lookup definitions for database-driven asset detection
- **Response**: `AssetLookupResponse` containing array of `AssetLookupDto`
- **Features**: Active asset definitions with CSS selectors and display metadata
- **Usage**: Dynamic asset detection in transcript processing

### Related DTOs
- `SessionDetailsDto`: Complete session information with transcript
- `EnhancedSessionDetailsResponse`: Standardized API response wrapper
- `CountryFlagDto`: Country flag mapping with ISO codes
- `CountryFlagsResponse`: Response wrapper for country operations
- `AssetLookupDto`: Asset definition with detection metadata
- `AssetLookupResponse`: Response wrapper for asset lookup operations

---

## SignalR Hubs Architecture (Current: 4 Hubs)

### SessionHub (`/hub/session`)
- **Purpose**: Real-time session management and coordination
- **Groups**: `session_{sessionId}`, `host_{hostToken}`, `usertoken_{token}`
- **Client Events**:
  - `ParticipantJoined` - New participant notification
  - `ParticipantLeft` - Participant departure
  - `SessionStarted` - Session initialization
  - `SessionEnded` - Session termination
  - `AssetShared` - Content broadcasting
- **Server Methods**:
  - `JoinSessionGroup(sessionId)` - Join session group
  - `LeaveSessionGroup(sessionId)` - Leave session group
  - `BroadcastToSession(sessionId, message)` - Broadcast to all participants
- **Integration**: Connected to HostController, ParticipantController

### QAHub (`/hub/qa`)
- **Purpose**: Q&A system real-time communication
- **Groups**: `session_{sessionId}`, `qa_{sessionId}`
- **Client Events**:
  - `QuestionReceived` - New question notification
  - `QuestionVoted` - Vote update
  - `QuestionDeleted` - Question removal
- **Server Methods**:
  - `JoinQAGroup(sessionId)` - Join Q&A group
  - `BroadcastQuestion(questionData)` - Broadcast new question
- **Integration**: Connected to QuestionController, real-time voting

### AnnotationHub (`/hub/annotation`)
- **Purpose**: Live annotation synchronization and canvas updates
- **Groups**: `annotation_{sessionId}`
- **Client Events**:
  - `AnnotationAdded` - New annotation
  - `AnnotationUpdated` - Annotation modification
  - `AnnotationDeleted` - Annotation removal
- **Server Methods**:
  - `JoinAnnotationGroup(sessionId)` - Join annotation group
  - `BroadcastAnnotation(annotationData)` - Sync annotation
- **Integration**: Connected to AnnotationsController, real-time drawing

### TestHub (`/hub/test`)
- **Purpose**: Development and debugging (development environment only)
- **Groups**: `test_{connectionId}`
- **Client Events**:
  - `TestMessage` - Development testing
  - `DebugInfo` - Debug information
- **Server Methods**:
  - `SendTestMessage(message)` - Test messaging
- **Integration**: Development tools, debugging support

---

## Services Architecture (Current: 17+ Services)

### Core Business Services

#### AssetHtmlProcessingService
- **Purpose**: HTML asset processing with HtmlAgilityPack
- **Key Methods**: `ProcessHtmlAsync()`, `InjectShareButtons()`, `DetectAssets()`
- **Integration**: HostController asset sharing, database-driven asset detection
- **Features**: Dynamic asset detection, share button injection, HTML transformation

#### HostSessionService  
- **Purpose**: Host session management and orchestration
- **Key Methods**: 
  - `LoadAlbumsAsync(hostToken)` - Fetch KSESSIONS albums
  - `LoadCategoriesAsync(albumId, hostToken)` - Fetch categories
  - `LoadSessionsAsync(categoryId, hostToken)` - Fetch sessions
  - `CreateSessionAndGenerateTokensAsync(model)` - Create session with tokens
- **Integration**: Host-SessionOpener.razor, cascading dropdowns
- **Features**: KSESSIONS integration, session creation workflow

#### SimplifiedTokenService
- **Purpose**: Streamlined token operations and validation
- **Key Methods**: `ValidateTokenAsync()`, `GenerateTokenAsync()`, `InvalidateTokenAsync()`
- **Integration**: All controllers requiring token validation
- **Features**: Secure token handling, validation workflows

#### SessionStateService
- **Purpose**: Session state management and synchronization
- **Key Methods**: `GetSessionStateAsync()`, `UpdateSessionStateAsync()`, `NotifyStateChange()`
- **Integration**: SessionController, SignalR hubs
- **Features**: Real-time state synchronization, session lifecycle tracking

### UI and Experience Services

#### ConfigurableLoadingService
- **Purpose**: Enhanced loading UI with configuration
- **Key Methods**: `ShowLoading()`, `HideLoading()`, `ConfigureSpinner()`
- **Integration**: All Blazor components, enhanced user experience
- **Features**: Configurable spinners, loading state management

#### SafeHtmlRenderingService
- **Purpose**: Secure HTML rendering and sanitization
- **Key Methods**: `SanitizeHtml()`, `RenderSecureHtml()`, `ValidateContent()`
- **Integration**: Content broadcasting, asset sharing
- **Features**: XSS prevention, secure content rendering

#### FlagService
- **Purpose**: Country flag processing and management
- **Key Methods**: `GetFlagByCountryCode()`, `LoadCountryFlags()`, `MapISOToFlag()`
- **Integration**: ParticipantController, country selection
- **Features**: Country flag mapping, ISO code processing

### Development and Debugging Services

#### DevModeService
- **Purpose**: Development mode features and debugging
- **Key Methods**: `IsDevMode()`, `GetDebugInfo()`, `EnableFeature()`
- **Integration**: Development tools, testing harness
- **Features**: Feature flags, development tooling

#### TestDataService
- **Purpose**: Development test data generation
- **Key Methods**: `GenerateTestSession()`, `CreateMockParticipants()`, `SeedDatabase()`
- **Integration**: Development workflow, testing
- **Features**: Test data generation, development support

#### DebugService
- **Purpose**: Development debugging support
- **Key Methods**: `LogDebugInfo()`, `CaptureState()`, `GenerateReport()`
- **Integration**: Debug panels, development tools
- **Features**: Debugging utilities, state inspection

### Data and Processing Services

#### AssetDetectionService & AssetDetectorService
- **Purpose**: Asset processing and detection algorithms
- **Key Methods**: `DetectAssets()`, `ProcessContent()`, `AnalyzeHtml()`
- **Integration**: Content analysis, asset extraction
- **Features**: Content detection, asset identification

#### HtmlParsingService
- **Purpose**: HTML processing utilities
- **Key Methods**: `ParseHtml()`, `ExtractElements()`, `TransformContent()`
- **Integration**: Content processing, HTML manipulation
- **Features**: HTML parsing, content transformation

#### AnnotationService
- **Purpose**: Annotation business logic and processing
- **Key Methods**: `CreateAnnotation()`, `ProcessAnnotation()`, `SyncAnnotations()`
- **Integration**: AnnotationsController, AnnotationHub
- **Features**: Real-time annotation processing, synchronization

### Infrastructure Services

#### LoadingService & DialogService
- **Purpose**: UI state management and user interaction
- **Key Methods**: `ShowDialog()`, `ManageLoadingState()`, `HandleUserInteraction()`
- **Integration**: All UI components, user experience
- **Features**: Dialog management, loading state coordination

#### SecureTokenService
- **Purpose**: Advanced token security processing
- **Key Methods**: `EncryptToken()`, `ValidateSignature()`, `GenerateSecureToken()`
- **Integration**: Security layer, token management
- **Features**: Enhanced security, cryptographic operations

---

## Razor Components Architecture (Current: 15+ Pages, 10+ Components)

### Key Pages and Routes

#### HostControlPanel.razor (`/host/control-panel/{hostToken}`)
- **Purpose**: Primary host interface for session management
- **APIs**: Enhanced session details, asset lookup, country flags from KSESSIONS
- **SignalR**: SessionHub, QAHub, AnnotationHub integration
- **Features**: Session control, Q&A moderation, real-time content broadcasting
- **Architecture**: API-First (no direct DbContext injection)

#### SessionCanvas.razor (`/session-canvas/{token}`)
- **Purpose**: Main participant session interface
- **APIs**: Participant validation, session data, Q&A submission
- **SignalR**: SessionHub, QAHub real-time updates
- **Features**: Q&A interaction, voting, real-time content reception

#### SessionWaiting.razor (`/session-waiting/{token}`)
- **Purpose**: Pre-session waiting room with participant list
- **APIs**: Token validation, participant list, country flags
- **SignalR**: SessionHub participant updates
- **Features**: Countdown timer, participant list, real-time updates

#### Host-SessionOpener.razor (`/host/session-opener/{hostToken}`)
- **Purpose**: Host session creation with cascading dropdowns
- **Service**: HostSessionService (wraps KSESSIONS APIs)
- **Features**: Album→Category→Session selection, custom scheduling

#### HostControlRedirect.razor (`/host/control/{hostToken}`)  
- **Purpose**: Backward compatibility redirect for old routing
- **Features**: Automatic navigation from old route to new canonical route
- **Implementation**: NavigationManager injection for seamless redirection

#### UserLanding.razor (`/user/landing/{token?}`)
- **Purpose**: Two-phase user flow - token validation and registration
- **APIs**: Token validation, country selection, participant registration
- **Features**: Country dropdown, registration form, debug panel integration

#### HostLanding.razor (`/host/landing/{hostToken?}`)
- **Purpose**: Host authentication using 8-character friendly tokens
- **APIs**: Host token validation, session URL generation
- **Features**: Host authentication, user registration URL generation

### Component Dependencies and Integration
- **API-First Architecture**: All components use HTTP APIs, no direct database access
- **SignalR Integration**: Real-time updates across all interactive components
- **Service Layer**: Comprehensive service injection for business logic
- **State Management**: SessionStateService coordination across components

---

## Database Architecture

### Canvas Database Schema
- **Sessions**: Session management and tokens
- **Participants**: User registration and session membership
- **Questions**: Q&A system data
- **QuestionVotes**: Voting system
- **Annotations**: Real-time drawing data
- **Issues**: Error tracking
- **AssetLookup**: Database-driven asset detection definitions

### KSESSIONS Database Integration
- **Groups**: Islamic content albums
- **Categories**: Content categorization
- **Sessions**: Session content and transcripts
- **Countries**: Country and flag mappings
- **SessionTranscripts**: Content transcripts for processing

### Data Access Patterns
- **API-First**: All database access via HTTP APIs
- **No Direct DbContext**: Components use HTTP clients, not direct database injection
- **Real-time Sync**: SignalR for live data updates
- **Cross-Database**: Canvas and KSESSIONS integration via new API endpoints

---

## Authentication and Security Architecture

### Token-Based Authentication
- **Host Tokens**: 8-character friendly tokens for host authentication
- **User Tokens**: Long-form tokens for participant sessions
- **Session Tokens**: Secure session identification
- **API Keys**: Service-to-service authentication

### Security Features
- **Secure Token Service**: Cryptographic token operations
- **Safe HTML Rendering**: XSS prevention and content sanitization
- **API Validation**: Comprehensive input validation across all endpoints
- **HTTPS Enforcement**: TLS encryption for all communications

---

## Update Rules
- Whenever the system architecture changes (new API, altered DTO, schema migration, or new component), update this file.  
- Ensure **SystemStructureSummary.md** contains a summarized snapshot of changes for quick access.  
- **Retrosync Protocol**: Regular synchronization between requirements, implementation, and documentation  
