# Infrastructure Quick Reference

**Version**: 2.0.0  
**Last Updated**: October 18, 2025  
**Purpose**: Authoritative infrastructure reference for KSESSIONS project

---

## 🗄️ Database Connections

### Primary Database: KSESSIONS_DEV
**When user mentions "database", they mean KSESSIONS_DEV unless specified otherwise.**

**Connection Details**:
- **Database Name**: `KSESSIONS_DEV`
- **Server**: `AHHOME`
- **Authentication**: SQL Server authentication (sa/password)
- **Connection Key**: `"DefaultDb"`
- **Configuration Location**: `Source Code/Sessions.Spa/Web.config` → `<connectionStrings>` section
- **Connection String**: `Data Source=AHHOME;Initial Catalog=KSESSIONS_DEV;User Id=sa;Password=adf4961glo;Connection Timeout=3600;MultipleActiveResultSets=true`

### Secondary Database: KQUR_DEV
**Connection Details**:
- **Database Name**: `KQUR_DEV`
- **Server**: `AHHOME`
- **Connection Key**: `"QuranDb"`
- **Usage**: Quranic content with etymology and translation features
- **Access**: Via DataRepository and QuranRepository
- **Connection String**: `Data Source=AHHOME;Initial Catalog=KQUR_DEV;User Id=sa;Password=adf4961glo;Connection Timeout=3600;MultipleActiveResultSets=true`

### ⚠️ CRITICAL DATABASE RULES

**Schema Guidelines**:
- Most tables use `dbo` schema
- Access patterns determined by repository layer
- Use Dapper ORM for database operations
- Always use stored procedures for complex operations

**Primary Tables in KSESSIONS_DEV** (dbo schema):
- `Groups` - Collections of Islamic content (Albums)
- `Categories` - Subdivisions within Groups
- `Sessions` - Individual Islamic learning sessions with audio/transcripts
- `SessionTranscripts` - Transcript content with timestamps
- `Speakers` - Session instructors/presenters
- `Countries` - Country reference data
- `Users` - User accounts with Auth0 integration
- `UserProfiles` - Extended user information

**Primary Tables in KQUR_DEV**:
- `Verses` - Quranic verses
- `Translations` - Verse translations
- `EtymologyRoots` - Arabic root words
- `EtymologyDerivatives` - Word derivatives from roots
- `Surahs` - Quran chapters

### Connection String Best Practices
**Always retrieve from configuration:**
```csharp
// Correct approach - from Web.config
var connString = ConfigurationManager.ConnectionStrings["DefaultDb"].ConnectionString;
var quranConnString = ConfigurationManager.ConnectionStrings["QuranDb"].ConnectionString;

// WRONG - Never hardcode
var connString = "Server=AHHOME;Database=KSESSIONS_DEV;..."
```

---

## 🔌 External Dependencies

### Required Services
1. **SQL Server** (AHHOME server)
   - KSESSIONS_DEV database
   - KQUR_DEV database
   
2. **IIS Express**
   - Port: 8080 (default development port via ksrun)
   - Port: 3000+ (API testing via ksiis)
   - Configured in `.vs/config/applicationhost.config`

3. **Auth0 Authentication**
   - Domain: `kashkole.auth0.com`
   - Client ID: `M5roSwzIx3NPOLI62njZR9SnjGnXMhWP`
   - **CRITICAL**: Only works on port 8080 in development
   - JWT tokens configured with extended lifetime for development

4. **SignalR Hub** (Real-time communication)
   - ImageHub: Real-time image broadcasting
   - Route: `/signalr` (standard SignalR endpoint)

### Configuration Files
- `Web.config` - Main configuration
- `Web.Debug.config` - Development overrides
- `Web.Release.config` - Production overrides
- **Location**: `Source Code/Sessions.Spa/`

### Environment Variables
- `ExecutionEnv` - Development/Production (in Web.config appSettings)
- `Development:ExtendedTokenLifetime` - JWT expiration extension for dev

---

## 🌐 API Endpoints (REST)

### Base URL
- **Development (Main)**: `http://localhost:8080/api` (via `ksrun`)
- **Development (API Testing)**: `http://localhost:3000/api` (via `ksiis 3000`)

### Controllers & Routes

#### AccountController (`/api/Account`)
- `GET /UserInfo` - Get current user information
- `POST /Logout` - User logout

#### AhadeesController (`/api/Ahadees`)
**Purpose**: Hadith (Islamic traditions) management and search
- Endpoints: GET/POST for hadith data

#### AdminController (`/api/Admin`)
**Purpose**: Administrative operations
- Session management
- User administration
- System monitoring

#### AdminUtilityController (`/api/AdminUtility`)
**Purpose**: Admin utilities and maintenance operations
- System diagnostics
- Data cleanup operations

#### DatabaseTestController (`/api/DatabaseTest`)
**Purpose**: Database connectivity testing and diagnostics

#### DocsController (`/api/Docs`)
**Purpose**: Documentation endpoints
- API documentation
- System documentation

#### EtymologyController (`/api/etymology`)
**Purpose**: Arabic etymology and root word analysis system
- `GET/POST /search` - Search etymology data
- `GET /test` - Etymology system diagnostics
- `GET /connection-info` - Database connection status
- `GET /roots` - List Arabic root words
- `GET /roots/{rootId}` - Get specific root details
- `GET /roots/{rootId}/derivatives` - Get word derivatives
- `POST /roots/save` - Save root word data
- `POST /find-derivatives` - Find derivatives for a word
- `GET /diagnostics` - System diagnostics
- `GET /derivatives/id/{derivativeId}` - Get derivative by ID
- `GET /derivatives/transliteral/{transliteral}` - Get by transliteration
- `POST /roots/{rootId}/derivatives/save` - Save derivative
- `DELETE /roots/{rootId}/delete` - Delete root
- `DELETE /derivatives/{derivativeId}/delete` - Delete derivative
- `POST /arabic/unbrace` - Process Arabic text formatting

#### FileController (`/api/File`)
**Purpose**: File upload and management
- Audio file uploads for sessions
- Document management

#### GitController (`/api/git`)
**Purpose**: Git operations from within the application
- `GET /status` - Get git repository status
- `POST /commit` - Commit changes
- `POST /push` - Push to remote
- `POST /commit-and-push` - Combined commit and push

#### GroupController (`/api/Group`)
**Purpose**: Group/Album management
- CRUD operations for Groups
- Category associations

#### H2TranscriptTestController (`/api/h2test`)
**Purpose**: Testing transcript parsing and splitting
- `GET /session/{sessionId}/transcript` - Get transcript
- `GET /session/{sessionId}/test-split` - Test transcript splitting
- `POST /test-custom-content` - Test custom content parsing
- `GET /sample-transcript` - Get sample transcript

#### LoggingController (`/api/Logging`)
**Purpose**: Client-side logging endpoints

#### LogsController (`/api/logs`)
**Purpose**: Server log management and retrieval

#### PublicController (`/api/Public`)
**Purpose**: Public endpoints (no authentication required)

#### QuranController (`/api/Quran`)
**Purpose**: Quranic content management
- Verse retrieval
- Translation management
- Surah information

#### RegistrationController (`/api/Registration`)
**Purpose**: User registration workflows

#### SearchController (`/api/Search`)
**Purpose**: Global search functionality across content types

#### SessionController (`/api/Session`)
**Purpose**: Session management (Islamic learning sessions)
- CRUD operations for Sessions
- Transcript management
- Audio playback coordination

#### TestController (`/api/Test`)
**Purpose**: Development testing endpoints

#### TokenController (`/api/Token`)
**Purpose**: JWT token management and validation

#### ValuesController (`/api/Values`)
**Purpose**: Sample API controller (default Web API template)

---

## 🔄 SignalR Hubs (Real-time)

### ImageHub
**Route**: `/signalr/hubs` (auto-generated by SignalR)
**Purpose**: Real-time image broadcasting and client synchronization

**Server Methods** (client → server):
- Connection management
- Group subscriptions

**Client Events** (server → client):
- `broadcastImage` - Image broadcast to all clients
- Real-time updates

**Usage**:
```javascript
// Client-side SignalR connection
var hub = $.connection.imageHub;
hub.client.broadcastImage = function(imageData) {
    // Handle received image
};
$.connection.hub.start();
```

---

## 📦 Data Access Layer

### Repositories

#### DataRepository (Sessions.Data)
**Interface**: `IDataRepository`
**Purpose**: Generic data access for KSESSIONS_DEV
**Location**: `Source Code/Sessions.Data/Repos/DataRepository.cs`
**Key Methods**:
- Database query execution
- Stored procedure calls
- Transaction management

#### AhadeesRepository (Sessions.Data)
**Interface**: `IAhadeesRepository`
**Purpose**: Hadith data access
**Location**: `Source Code/Sessions.Data/Repos/AhadeesRepository.cs`

#### QuranRepository (Sessions.Data)
**Interface**: `IQuranRepository`
**Purpose**: Quranic content access (KQUR_DEV)
**Location**: `Source Code/Sessions.Data/Repos/QuranRepository.cs`
**Key Features**:
- Verse retrieval
- Translation queries
- Etymology data access

### Services

#### SessionService (Sessions.Business)
**Interface**: `ISessionService`
**Purpose**: Business logic for session management
**Location**: `Source Code/Sessions.Business/SessionService.cs`
**Dependencies**: DataRepository

#### EmailService (Sessions.Business)
**Interface**: `IEmailService`
**Purpose**: Email notifications and communications
**Location**: `Source Code/Sessions.Business/EmailService.cs`

#### LogService (Sessions.Data)
**Purpose**: NLog integration and structured logging
**Location**: `Source Code/Sessions.Data/Services/LogService.cs`

---

## 🧪 Testing Infrastructure

### Test Project: Sessions.Tests
**Framework**: NUnit
**Location**: `Source Code/Sessions.Tests/`
**Configuration**: `App.config` with test connection strings

**Test Connection Strings**:
- DefaultDb: `KSESSIONS_TEST` database
- QuranDb: `KQUR_TEST` database

**Test Categories**:
- API tests
- Database tests
- Business logic tests
- Frontend tests (Karma/Jasmine)
- Integration tests
- Performance tests
- Security tests

**Test Commands**:
```bash
# Run all tests (from solution root)
dotnet test Sessions.Tests.csproj

# Run specific category
dotnet test --filter "Category=API"
```

---

## 🔧 Build Configuration

### Development Commands

#### Main Development Server (Auth0 enabled)
```powershell
# From repository root or via tasks
ksrun
# Port: 8080
# Purpose: Full-stack development with authentication
```

#### API Testing Server
```powershell
# From repository root
ksiis 3000
# Port: 3000 (or custom)
# Purpose: Backend API testing without Auth0
```

#### Build Tasks (VS Code)
- **Build KSESSIONS Solution** - Full build with IIS Express launch
- **Build Only (No Run)** - Build without starting server
- **Quick Build (No Clean)** - Incremental build
- **Restart IIS Express** - Restart development server
- **MSBuild Clean via Script** - Clean solution
- **MSBuild Build via Script** - Direct MSBuild build

### Build Tools
- **MSBuild** (`C:\Program Files\Microsoft Visual Studio\2022\Community\MSBuild\Current\Bin\MSBuild.exe`)
- **Solution File**: `KSESSIONS.sln`
- **Target Framework**: .NET Framework 4.8
- **Configuration**: Debug (default for development)

---

## 📁 Project Structure

```
KSESSIONS/
├── Source Code/
│   ├── Sessions.Spa/              # Main web application
│   │   ├── Controllers/           # Web API controllers
│   │   │   ├── Api/              # API controllers
│   │   │   └── HomeController.cs # MVC controller
│   │   ├── Scripts/              # JavaScript/AngularJS
│   │   ├── Views/                # Razor views
│   │   ├── Hubs/                 # SignalR hubs
│   │   └── Web.config            # Configuration
│   ├── Sessions.Business/         # Business logic layer
│   │   ├── SessionService.cs
│   │   └── EmailService.cs
│   ├── Sessions.Data/             # Data access layer
│   │   ├── Repos/                # Repositories
│   │   └── Services/             # Data services
│   ├── Sessions.Domain/           # Domain models/entities
│   ├── Sessions.Tests/            # Test project
│   └── IssueTrackerApp/          # Separate Issue Tracker app
│       └── Api/                  # .NET 8.0 API
├── Database/                      # SQL scripts and migrations
├── Documentation/                 # Project documentation
├── Workspaces/                   # Development workspaces
│   ├── SCRIPTS/                  # Build and utility scripts
│   └── Testing/                  # Testing resources
└── .github/                      # GitHub and AI agent configs
    ├── instructions/             # AI agent instructions
    ├── prompts/                  # AI agent prompts
    └── learning/                 # Pattern learning data
```

---

## 🚀 Technology Stack Summary

### Backend
- **Language**: C#
- **Framework**: ASP.NET Web API (.NET Framework 4.8)
- **ORM**: Dapper (lightweight ORM)
- **Real-time**: SignalR 2.2.1
- **Authentication**: Auth0 + JWT tokens
- **Logging**: NLog 4.3.8

### Frontend
- **Framework**: AngularJS 1.8.2
- **UI Libraries**: Bootstrap, jQuery
- **Real-time**: SignalR JavaScript client
- **Build**: MSBuild (no separate frontend build)

### Database
- **Type**: SQL Server
- **Databases**: KSESSIONS_DEV, KQUR_DEV
- **Access**: Dapper + Stored Procedures

### Development Tools
- **IDE**: Visual Studio 2022 Community / VS Code
- **Build**: MSBuild
- **Server**: IIS Express
- **Version Control**: Git

### Testing
- **Unit Tests**: NUnit
- **Frontend Tests**: Karma + Jasmine (configured)
- **Integration**: NUnit with test databases

---

## 🔐 Authentication & Authorization

### Auth0 Configuration
- **Domain**: `kashkole.auth0.com`
- **Client ID**: `M5roSwzIx3NPOLI62njZR9SnjGnXMhWP`
- **Client Secret**: (in Web.config)
- **Callback URL**: `http://localhost:8080/` (development)

### JWT Token Configuration
- **Development**: Extended lifetime for convenience
- **Production**: Secure, short expiration
- **Storage**: Client-side (localStorage/sessionStorage)
- **Transmission**: Authorization header: `Bearer {token}`

### Authorization Patterns
- Role-based access control
- Token validation on each API request
- Auth0 integration for user management

---

## ⚠️ Critical Development Rules

### Port Usage
- ✅ **Port 8080**: Main development with Auth0 (via `ksrun`)
- ✅ **Port 3000+**: API testing without Auth0 (via `ksiis`)
- ❌ **NEVER**: Use port 8080 for API testing (Auth0 conflict)

### Database Access
- ✅ Always use connection strings from Web.config
- ✅ Use repositories for data access
- ✅ Prefer stored procedures for complex queries
- ❌ Never hardcode connection strings
- ❌ Never bypass repository layer

### Build Process
- ✅ Use `ksrun` for main development
- ✅ Use VS Code tasks for automated builds
- ✅ Test on port 8080 for Auth0 features
- ❌ Don't modify MSBuild scripts without documentation

---

**Last Verification**: October 18, 2025  
**Verified Against**: KSESSIONS solution files, Web.config, project structure
