# Infrastructure Quick Reference

**Version**: 2.0.0  
**Last Updated**: 2025-10-12  
**Purpose**: Authoritative infrastructure reference to eliminate Copilot hallucinations

---

## 🗄️ Database Connections

### Primary Database: KSESSIONS_DEV
**When user mentions "database", they mean KSESSIONS_DEV unless specified otherwise.**

**Connection Details**:
- **Database Name**: `KSESSIONS_DEV`
- **Server**: `AHHOME`
- **Authentication**: SQL Server authentication (credentials in appsettings.json)
- **Connection Key**: `"DefaultConnection"` or `"KSessionsDb"`
- **Configuration Location**: `SPA/NoorCanvas/appsettings.json` → `ConnectionStrings` section

### ⚠️ CRITICAL DATABASE RULES

**READ-ONLY RESTRICTION**:
- ✅ **`canvas.*` schema**: READ-WRITE allowed (Session Canvas features)
- ❌ **`dbo.*` schema**: **READ-ONLY** - NO modifications allowed
- ❌ **All other schemas**: **READ-ONLY** - NO modifications allowed

**Schema Usage**:
- `canvas.*` - Session Canvas feature (questions, votes, participants, annotations)
  - `canvas.Questions`
  - `canvas.QuestionVotes`
  - `canvas.Participants`
  - `canvas.AssetLookup`
  
- `dbo.*` - **READ-ONLY** (legacy Islamic content database)
  - `dbo.Groups` - Islamic content collections (Albums)
  - `dbo.Categories` - Subdivisions within Groups
  - `dbo.Sessions` - Individual Islamic learning sessions (LEGACY - different from canvas.Sessions)
  - `dbo.Speakers` - Session instructors/presenters
  - `dbo.SessionTranscripts` - Transcript content for annotation
  
- `dbo.*` **Stored Procedures** - **READ-ONLY**
  - `dbo.GetAllGroups` - Retrieves all Groups/Albums
  - `dbo.GetCategoriesForGroup` - Retrieves Categories for a specific Group
  
  > **NOTE**: Tables verified against KSESSIONS_DEV codebase on 2025-10-12.
  > Only tables with Entity Framework models or direct SQL usage are listed.

### Secondary Database: KQUR_DEV
- **Database Name**: `KQUR_DEV`
- **Server**: `AHHOME`
- **Connection Key**: `"KQurDb"`
- **Usage**: Quranic content (READ-ONLY)
- **Access**: Via API endpoints only

### Connection String Best Practices
**NEVER hardcode connection strings in code. Always use:**
```csharp
// Correct approach
_configuration.GetConnectionString("DefaultConnection")
_configuration.GetConnectionString("KSessionsDb")
_configuration.GetConnectionString("KQurDb")

// WRONG - Never do this
var connString = "Server=AHHOME;Database=KSESSIONS_DEV;..."
```

---

## 🔌 External Dependencies

### Required Services
1. **SQL Server** (AHHOME server)
   - KSESSIONS_DEV database
   - KQUR_DEV database
   
2. **Kestrel Web Server**
   - HTTPS Port: 9091
   - HTTP Port: 5000 (redirect to HTTPS)

3. **SignalR Hubs** (Real-time communication)
   - SessionHub: `/hub/session`
   - QAHub: `/hub/qa`
   - AnnotationHub: `/hub/annotation`
   - TestHub: `/hub/test` (dev only)

### Configuration Files
- `appsettings.json` - Production settings
- `appsettings.Development.json` - Development overrides
- **Location**: `SPA/NoorCanvas/`

### Environment Variables (Optional)
- `ASPNETCORE_ENVIRONMENT` - Development/Production
- Connection strings can override appsettings.json values

---

## API Endpoints (REST)

### Base URL
- **Development**: `https://localhost:9091/api`
- **HTTPS Port**: 9091 (Kestrel default)

### Controllers & Routes

#### Host Controller (`/api/Host`)
- `POST /authenticate` - Host authentication
- `GET /session/{hostGuid}/validate` - Validate host GUID
- `GET /token/{friendlyToken}/validate` - Validate friendly token
- `POST /session/create` - Create new session
- `POST /session/{sessionId}/start` - Start session
- `POST /session/{sessionId}/end` - End session
- `GET /albums` - Get photo albums
- `GET /categories/{albumId}` - Get album categories
- `GET /sessions/{categoryId}` - Get category sessions
- `GET /countries` - Get countries list
- `POST /generate-token` - Generate host token
- `POST /sessions/{sessionId}/begin` - Begin session workflow
- `GET /session-details/{sessionId}` - Get session details
- `GET /session-status` - Get session status
- `GET /asset-patterns/{sessionId}` - Get asset patterns for session
- `GET /asset-lookup` - Asset lookup by pattern
- `GET /ksessions/session/{sessionId}/details` - KSESSIONS database details
- `GET /ksessions/countries/flags` - Country flags from KSESSIONS
- `GET /sessions/{sessionId}/assets` - Get session assets
- `POST /share-asset` - Share asset to participants
- `POST /process-html-assets` - Process HTML assets (extract images, format text)
- `POST /extract-asset` - Extract specific asset from HTML
- `GET /sessions/list` - List all sessions
- `GET /sessions/{sessionId}/details` - Session details extended
- `GET /token/{hostToken}/session-id` - Get session ID from token
- `GET /sessions/by-token/{hostToken}` - Get session by host token

#### Participant Controller (`/api/Participant`)
- `GET /session/{token}/validate` - Validate participant token
- `POST /register-with-token` - Register participant with token
- `GET /session/{token}/user-guid` - Get user GUID from token
- `GET /session/{token}/me` - Get current participant info
- `GET /session/{token}/participants` - List session participants
- `DELETE /session/{userToken}/participants` - Remove participant

#### Question Controller (`/api/Question`)
- `POST /submit` - Submit question
- `POST /{questionId}/vote` - Vote on question
- `GET /session/{sessionToken}` - Get session questions
- `POST /{questionId}/update` - Update question text
- `POST /{questionId}/delete` - Delete question

#### Session Controller (`/api/Session`)
- `GET /{sessionId}/state` - Get session state
- `GET /{sessionId}` - Get session details
- `GET /guid/{sessionGuid}/state` - Get state by GUID
- `GET /{sessionId}/transcript` - Get session transcript

#### Token Controller (`/api/Token`)
- `GET /validate/{token}` - Validate token
- `POST /generate/{sessionId}` - Generate token for session
- `GET /session/{sessionId}` - Get session tokens
- `POST /expire/{userToken}` - Expire user token

#### Admin Controller (`/api/Admin`)
- `POST /authenticate` - Admin authentication
- `GET /sessions` - List all sessions (admin)
- `POST /session/{sessionId}/terminate` - Terminate session
- `GET /users` - List all users
- `POST /user/{userId}/deactivate` - Deactivate user

#### Health Controller (`/Health`)
- `GET /` - Basic health check
- `GET /detailed` - Detailed health status

#### Issue Controller (`/api/Issue`)
- `POST /` - Create issue report
- `GET /{id}` - Get issue by ID
- `GET /` - List all issues

#### Host Provisioner Controller (`/api/HostProvisioner`)
- `POST /generate` - Generate host provisioning
- `GET /status` - Provisioner status

#### Logs Controller (`/api/Logs`)
- `POST /` - Submit client logs

#### Asset Share Test Controller (`/api/AssetShareTest`) - TESTING ONLY
- `POST /test-broadcast` - Test asset broadcast
- `POST /test-session-212` - Test Session 212 asset sharing

---

## SignalR Hubs (WebSocket)

### Hub Endpoints

#### SessionHub (`/hub/session`) - PRIMARY
**Purpose**: Production sessions, real-time HTML broadcasting, participant sync

**Client Methods** (server → client):
- `ReceiveQuestionSubmitted` - New question submitted
- `ReceiveQuestionVoted` - Question vote updated
- `ReceiveQuestionDeleted` - Question deleted
- `ReceiveQuestionUpdated` - Question text updated
- `ReceiveHtmlContent` - Broadcast HTML content to participants
- `ReceiveAssetContent` - Broadcast image/video asset
- `ParticipantJoined` - New participant joined
- `ParticipantLeft` - Participant left session
- `SessionStateChanged` - Session state updated

**Server Methods** (client → server):
- `JoinSession(sessionId, userToken)` - Join session group
- `LeaveSession(sessionId)` - Leave session group
- `BroadcastContent(sessionId, htmlContent)` - Broadcast HTML (host only)

#### QAHub (`/hub/qa`)
**Purpose**: Q&A functionality, question/vote sync

**Client Methods**:
- `QuestionSubmitted` - New question event
- `QuestionVoted` - Vote updated event
- `QuestionDeleted` - Question removed
- `QuestionUpdated` - Question text changed

#### TestHub (`/hub/test`) - DEVELOPMENT ONLY
**Purpose**: Testing/debugging SignalR connections

**Client Methods**:
- `ReceiveMessage` - Test message broadcast

---

## Test Infrastructure

### Canonical Test Session: Session 212

**Session Details**:
- **Session ID**: 212
- **Session GUID**: `{from database - query Sessions table}`
- **Host Token**: `PQ9N5YWW` (friendly token)
- **Participant Token**: `KJAHA99L` (friendly token)
- **Status**: Active (Created, never Ended)
- **Purpose**: Stable test session for E2E tests

**Why Session 212**:
- Pre-provisioned with valid tokens
- Guaranteed to exist in KSESSIONS_DEV database
- Participants and questions already seeded
- HTML content and assets available for testing

**Test File Location**: `Tests/UI/*.spec.ts`

**Test Patterns**:
```typescript
const SESSION_ID = 212;
const HOST_TOKEN = 'PQ9N5YWW';
const PARTICIPANT_TOKEN = 'KJAHA99L';
const BASE_URL = 'https://localhost:9091';
```

### Playwright Configuration
**Config File**: `config/testing/playwright.config.cjs`

**Server Management**:
- `PW_MODE=standalone` - Playwright does NOT start server (recommended)
- `PW_MODE=managed` - Playwright starts/stops server automatically
- **Default**: `standalone` (assumes server already running)

**Before Tests**: Execute `nckill` to terminate any running Kestrel servers

---

## Frontend Routes

### Host Routes
- `/` - Landing/home page
- `/host/login` - Host authentication
- `/host/session/{sessionId}` - Host session dashboard

### Participant Routes
- `/participant/join/{token}` - Join session with token
- `/participant/session/{sessionId}` - Participant session view

### Admin Routes
- `/admin/login` - Admin authentication
- `/admin/dashboard` - Admin dashboard
- `/admin/sessions` - Session management
- `/admin/users` - User management

---

## Environment Variables

### Kestrel Configuration
- **KESTREL_PORT**: `9091` (HTTPS port, default)
- **ASPNETCORE_ENVIRONMENT**: `Development` (default)
- **ASPNETCORE_URLS**: `https://localhost:9091` (override)

### Testing
- **PW_MODE**: `standalone` | `managed` (Playwright server management)

---

## Common Tokens & Identifiers

### Session 212 Tokens (Canonical Test Data)
- **Host Friendly Token**: `PQ9N5YWW`
- **Participant Friendly Token**: `KJAHA99L`
- **Session ID**: 212 (integer primary key)

**Token Format**:
- Length: 8 characters
- Character set: A-Z, 0-9 (uppercase alphanumeric)
- Pattern: `[A-Z0-9]{8}`

**Token Types**:
- **Host Token** - Grants host privileges (session control, content broadcasting)
- **Participant Token** - Grants participant access (view content, submit questions, vote)
- **User Token** - Generic user access token

---

## File Locations

### Configuration
- **appsettings.json**: `SPA/NoorCanvas/appsettings.json`
- **Playwright Config**: `config/testing/playwright.config.cjs`
- **ESLint Config**: `config/testing/eslint.config.js`
- **TypeScript Config**: `config/testing/tsconfig.json`

### Code
- **Controllers**: `SPA/NoorCanvas/Controllers/*.cs`
- **Services**: `SPA/NoorCanvas/Services/*.cs`
- **Hubs**: `SPA/NoorCanvas/Hubs/*.cs`
- **Components**: `SPA/NoorCanvas/Components/**/*.razor`
- **Pages**: `SPA/NoorCanvas/Components/Pages/*.razor`

### Tests
- **E2E (Playwright)**: `Tests/UI/*.spec.ts`
- **Unit Tests**: `Tests/Unit/*.cs`

### Documentation
- **Architecture**: `.github/instructions/Links/NOOR-CANVAS_ARCHITECTURE.MD`
- **API Contracts**: `.github/instructions/Links/API-Contract-Validation.md`
- **Prompts**: `.github/prompts/*.prompt.md`
- **Instructions**: `.github/instructions/*.instructions.md`

### Keys (Work Items)
- **Key Metadata**: `Workspaces/Copilot/prompts.keys/{key}/{key}.md`
- **Work Logs**: `Workspaces/Copilot/prompts.keys/{key}/work-log.md`
- **Template**: `Workspaces/Copilot/prompts.keys/_template/key-template.md`

---

## Critical Anti-Patterns (Hallucination Prevention)

### ❌ DO NOT Reference Obsolete Features
- **Annotation System** - DELETED in annotation removal commit (2025-01-11)
  - No `canvas.Annotations` table
  - No `AnnotationHub` SignalR hub
  - No `/api/Annotations` controller
  - No annotation-related components or services

### ❌ DO NOT Hardcode Credentials
- Never put connection strings in code
- Never commit passwords or secrets to git
- Always use `_configuration.GetConnectionString()`

### ❌ DO NOT Assume File Locations
- Always check `SystemStructureSummary.md` for current structure
- Use `file_search` or `grep_search` to verify file existence
- Reference files by absolute paths when possible

### ❌ DO NOT Invent API Endpoints
- Always check this file or `API-Contract-Validation.md` for actual endpoints
- Verify controller methods before referencing in tests or code
- Use `grep_search` to find actual route attributes

### ❌ DO NOT Create New Test Sessions
- **ALWAYS use Session 212** for E2E tests
- Do not create random session IDs
- Do not hardcode tokens other than PQ9N5YWW/KJAHA99L

---

## Version History

- **v1.0.0** (2025-01-11): Initial creation
  - Extracted from live appsettings.json, Program.cs, Controllers
  - Added Session 212 canonical test data
  - Documented all API endpoints and SignalR hubs
  - Added anti-patterns section for hallucination prevention
  - Removed obsolete annotation system references
