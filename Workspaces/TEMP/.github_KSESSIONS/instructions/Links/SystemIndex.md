# KSESSIONS System Index

**Version**: 1.0.0  
**Last Updated**: October 18, 2025  
**Total Recall Run**: October 18, 2025

---

## 📊 Quick Statistics

| Category | Count | Status |
|----------|-------|--------|
| **API Controllers** | 22 | ✅ Active |
| **Services** | 3 | ✅ Active |
| **Repositories** | 3 | ✅ Active |
| **SignalR Hubs** | 1 | ✅ Active |
| **Databases** | 2 | ✅ Connected |
| **Test Projects** | 1 | ✅ Configured |
| **Solution Projects** | 5 | ✅ Building |

---

## 🗂️ Quick Navigation

### By Layer
- [Controllers (API)](#api-controllers-22) - 22 controllers
- [Services (Business Logic)](#business-services-3) - 3 services
- [Repositories (Data Access)](#repositories-3) - 3 repositories
- [SignalR Hubs (Real-time)](#signalr-hubs-1) - 1 hub
- [Database Schema](#database-schema) - 2 databases

### By Feature Domain
- [Session Management](#session-management-feature) - Core feature
- [Etymology System](#etymology-system-feature) - Arabic analysis
- [Quran Study](#quran-study-feature) - Verse management
- [Hadith Collections](#hadith-collections-feature) - Islamic traditions
- [Administration](#administration-feature) - System management
- [Authentication](#authentication-feature) - User security

### By Technology
- [Database](#database-infrastructure) - SQL Server setup
- [Real-Time](#real-time-communication) - SignalR configuration
- [Authentication](#authentication-infrastructure) - Auth0 integration
- [Testing](#testing-infrastructure) - Test frameworks

---

## 🎮 API Controllers (22)

### Core Application Controllers

#### 1. **HomeController** (MVC)
- **Route**: `/`
- **Type**: MVC Controller (not Web API)
- **File**: `Source Code/Sessions.Spa/Controllers/HomeController.cs`
- **Purpose**: Serve main SPA HTML page
- **Returns**: AngularJS bootstrap view

#### 2. **AccountController**
- **Route**: `/api/Account`
- **File**: `Source Code/Sessions.Spa/Controllers/AccountController.cs`
- **Purpose**: User authentication and profile
- **Integration**: Auth0 JWT validation
- **Endpoints**:
  - `GET /UserInfo` - Get current user
  - `POST /Logout` - User logout

#### 3. **SessionController**
- **Route**: `/api/Session`
- **File**: `Source Code/Sessions.Spa/Controllers/Api/SessionController.cs`
- **Purpose**: Islamic session CRUD operations
- **Database**: KSESSIONS_DEV.dbo.Sessions
- **Features**:
  - Session management
  - Transcript coordination
  - Audio playback

#### 4. **GroupController**
- **Route**: `/api/Group`
- **File**: `Source Code/Sessions.Spa/Controllers/Api/GroupController.cs`
- **Purpose**: Content collections (Albums)
- **Hierarchy**: Groups → Categories → Sessions
- **Database**: KSESSIONS_DEV.dbo.Groups

#### 5. **AdminController**
- **Route**: `/api/Admin`
- **File**: `Source Code/Sessions.Spa/Controllers/Api/AdminController.cs`
- **Purpose**: Administrative operations
- **Authorization**: Admin role required
- **Features**: System monitoring, user management

#### 6. **AdminUtilityController**
- **Route**: `/api/AdminUtility`
- **File**: `Source Code/Sessions.Spa/Controllers/Api/AdminUtilityController.cs`
- **Purpose**: Maintenance utilities
- **Authorization**: Admin only
- **Features**: Data cleanup, diagnostics

### Content Management Controllers

#### 7. **QuranController**
- **Route**: `/api/Quran`
- **File**: `Source Code/Sessions.Spa/Controllers/Api/QuranController.cs`
- **Purpose**: Quranic verse management
- **Database**: KQUR_DEV
- **Repository**: QuranRepository
- **Features**:
  - Verse retrieval
  - Translation management
  - Surah navigation

#### 8. **AhadeesController**
- **Route**: `/api/Ahadees`
- **File**: `Source Code/Sessions.Spa/Controllers/Api/AhadeesController.cs`
- **Purpose**: Hadith management
- **Repository**: AhadeesRepository
- **Features**:
  - Hadith search
  - Collection management
  - Reference validation

#### 9. **EtymologyController** ⭐
- **Route**: `/api/etymology`
- **File**: `Source Code/Sessions.Spa/Controllers/Api/EtymologyController.cs`
- **Purpose**: Arabic etymology analysis system
- **Database**: KQUR_DEV.EtymologyRoots/Derivatives
- **Major Endpoints**:
  - `GET/POST /search` - Search etymology data
  - `GET /test` - System diagnostics
  - `GET /connection-info` - DB connection status
  - `GET /roots` - List root words
  - `GET /roots/{id}` - Root details
  - `GET /roots/{id}/derivatives` - Get derivatives
  - `POST /roots/save` - Save root
  - `POST /find-derivatives` - Find derivatives
  - `GET /diagnostics` - Full diagnostics
  - `GET /derivatives/id/{id}` - Get derivative
  - `GET /derivatives/transliteral/{text}` - Get by transliteration
  - `POST /roots/{id}/derivatives/save` - Save derivative
  - `DELETE /roots/{id}/delete` - Delete root
  - `DELETE /derivatives/{id}/delete` - Delete derivative
  - `POST /arabic/unbrace` - Arabic text processing

### Integration Controllers

#### 10. **GitController**
- **Route**: `/api/git`
- **File**: `Source Code/Sessions.Spa/Controllers/Api/GitController.cs`
- **Purpose**: In-app Git operations
- **Endpoints**:
  - `GET /status` - Repository status
  - `POST /commit` - Commit changes
  - `POST /push` - Push to remote
  - `POST /commit-and-push` - Combined operation
- **Use Case**: Version control without leaving app

#### 11. **FileController**
- **Route**: `/api/File`
- **File**: `Source Code/Sessions.Spa/Controllers/Api/FileController.cs`
- **Purpose**: File upload and management
- **Primary Use**: Audio file uploads for sessions
- **Features**: Storage, retrieval, metadata

#### 12. **SearchController**
- **Route**: `/api/Search`
- **File**: `Source Code/Sessions.Spa/Controllers/SearchController.cs`
- **Purpose**: Global search across content
- **Scope**: Sessions, Groups, Quran, Hadith
- **Method**: Cross-database search

#### 13. **TokenController**
- **Route**: `/api/Token`
- **File**: `Source Code/Sessions.Spa/Controllers/TokenController.cs`
- **Purpose**: JWT token management
- **Integration**: Auth0
- **Features**: Token generation, validation, refresh

### Utility & Support Controllers

#### 14. **LoggingController**
- **Route**: `/api/Logging`
- **File**: `Source Code/Sessions.Spa/Controllers/Api/LoggingController.cs`
- **Purpose**: Client-side error logging
- **Integration**: NLog
- **Use**: JavaScript error reporting

#### 15. **LogsController**
- **Route**: `/api/logs`
- **File**: `Source Code/Sessions.Spa/Controllers/Api/LogsController.cs`
- **Purpose**: Server log management
- **Features**: Log retrieval, filtering, download
- **Authorization**: Admin only

#### 16. **DocsController**
- **Route**: `/api/Docs`
- **File**: `Source Code/Sessions.Spa/Controllers/Api/DocsController.cs`
- **Purpose**: API documentation
- **Features**: Swagger-like docs, endpoint discovery

### Testing & Diagnostics Controllers

#### 17. **DatabaseTestController**
- **Route**: `/api/DatabaseTest`
- **File**: `Source Code/Sessions.Spa/Controllers/Api/DatabaseTestController.cs`
- **Purpose**: Database connectivity testing
- **Environment**: Development only
- **Tests**: Connection strings, queries, schema

#### 18. **TestController**
- **Route**: `/api/Test`
- **File**: `Source Code/Sessions.Spa/Controllers/Api/TestController.cs`
- **Purpose**: Feature prototyping and testing
- **Environment**: Development only
- **Status**: Not deployed to production

#### 19. **H2TranscriptTestController**
- **Route**: `/api/h2test`
- **File**: `Source Code/Sessions.Spa/Controllers/Api/H2TranscriptTestController.cs`
- **Purpose**: Transcript parsing validation
- **Endpoints**:
  - `GET /session/{id}/transcript` - Get transcript
  - `GET /session/{id}/test-split` - Test splitting
  - `POST /test-custom-content` - Custom parsing
  - `GET /sample-transcript` - Sample data
- **Use**: Validate transcript format processing

### Additional Controllers

#### 20. **PublicController**
- **Route**: `/api/Public`
- **File**: `Source Code/Sessions.Spa/Controllers/Api/PublicController.cs`
- **Purpose**: Public endpoints (no auth)
- **Use**: Landing page data, public content

#### 21. **RegistrationController**
- **Route**: `/api/Registration`
- **File**: `Source Code/Sessions.Spa/Controllers/Api/RegistrationController.cs`
- **Purpose**: User registration workflows
- **Integration**: Auth0 user creation

#### 22. **ValuesController**
- **Route**: `/api/Values`
- **File**: `Source Code/Sessions.Spa/Controllers/ValuesController.cs`
- **Purpose**: Sample controller (Web API template)
- **Status**: Can be removed in production

---

## 💼 Business Services (3)

### 1. **SessionService**
- **Interface**: `ISessionService`
- **File**: `Source Code/Sessions.Business/SessionService.cs`
- **Project**: Sessions.Business
- **Purpose**: Session management business logic
- **Dependencies**:
  - IDataRepository (data access)
  - Configuration (appsettings)
- **Responsibilities**:
  - Session lifecycle management
  - Audio playback coordination
  - Transcript synchronization
  - Business rule enforcement
- **Key Methods**:
  - CreateSession
  - UpdateSession
  - GetSessionDetails
  - ManageTranscripts
- **Used By**:
  - SessionController
  - AdminController

### 2. **EmailService**
- **Interface**: `IEmailService`
- **File**: `Source Code/Sessions.Business/EmailService.cs`
- **Project**: Sessions.Business
- **Purpose**: Email notification system
- **Dependencies**:
  - SMTP configuration (Web.config)
- **Features**:
  - User registration emails
  - Session notifications
  - Admin alerts
  - Template-based emails
- **Used By**:
  - RegistrationController
  - AccountController
  - AdminController

### 3. **LogService**
- **File**: `Source Code/Sessions.Data/Services/LogService.cs`
- **Project**: Sessions.Data
- **Purpose**: NLog integration and structured logging
- **Features**:
  - Structured JSON logging
  - Performance tracking
  - Error logging with context
  - Log file management
- **Log Targets**:
  - GeneralLog - All logs
  - ErrorLog - Errors only
  - StructuredLog - JSON format
  - PerformanceLog - Performance metrics
- **Used By**: All layers (cross-cutting concern)

---

## 🗃️ Repositories (3)

### 1. **DataRepository**
- **Interface**: `IDataRepository`
- **File**: `Source Code/Sessions.Data/Repos/DataRepository.cs`
- **Project**: Sessions.Data
- **Purpose**: Generic data access for KSESSIONS_DEV
- **ORM**: Dapper
- **Connection**: DefaultDb (KSESSIONS_DEV)
- **Responsibilities**:
  - Execute parameterized queries
  - Call stored procedures
  - Transaction management
  - Connection lifetime
- **Key Methods**:
  - `QueryAsync<T>` - Parameterized query
  - `ExecuteAsync` - Non-query operations
  - `QuerySingleAsync<T>` - Single result query
- **Used By**:
  - SessionService
  - SessionController
  - GroupController
  - AdminController

### 2. **AhadeesRepository**
- **Interface**: `IAhadeesRepository`
- **File**: `Source Code/Sessions.Data/Repos/AhadeesRepository.cs`
- **Project**: Sessions.Data
- **Purpose**: Hadith-specific data operations
- **Connection**: DefaultDb (KSESSIONS_DEV)
- **Features**:
  - Hadith search with filters
  - Collection management
  - Reference validation
  - Arabic text normalization
- **Used By**:
  - AhadeesController

### 3. **QuranRepository**
- **Interface**: `IQuranRepository`
- **File**: `Source Code/Sessions.Data/Repos/QuranRepository.cs`
- **Project**: Sessions.Data
- **Purpose**: Quranic content access from KQUR_DEV
- **Connection**: QuranDb (KQUR_DEV)
- **Key Operations**:
  - Verse retrieval by surah/ayah
  - Translation queries (multi-language)
  - Etymology data integration
  - Surah metadata access
- **Etymology Integration**:
  - Root word lookups
  - Derivative analysis
  - Verse-root cross-references
- **Used By**:
  - QuranController
  - EtymologyController (indirect)

---

## 🔄 SignalR Hubs (1)

### ImageHub
- **File**: `Source Code/Sessions.Spa/Hubs/ImageHub.cs`
- **Route**: `/signalr` (auto-generated SignalR endpoint)
- **Purpose**: Real-time image broadcasting
- **Architecture**: Hub-and-spoke model
  ```
  Host/Presenter → ImageHub → All Connected Clients
  ```
- **Server Methods** (Client → Server):
  - Connection lifecycle management
  - Group join/leave operations
- **Client Events** (Server → Client):
  - `broadcastImage` - Broadcast image to all
  - Real-time sync signals
- **Usage Scenario**:
  1. Presenter uploads/shares image during session
  2. ImageHub broadcasts to all participants
  3. Participants receive and display in real-time
- **Client Connection**:
  ```javascript
  var hub = $.connection.imageHub;
  hub.client.broadcastImage = function(imageData) {
      // Display image
  };
  $.connection.hub.start();
  ```
- **Used By**:
  - Session presenter interface
  - Participant viewing interface

---

## 🗄️ Database Schema

### Primary Database: KSESSIONS_DEV
**Server**: AHHOME  
**Connection Key**: DefaultDb  
**Schema**: dbo (default)

#### Tables
- **Groups** - Content collections (Albums)
- **Categories** - Group subdivisions
- **Sessions** - Learning sessions with audio
- **SessionTranscripts** - Timestamped transcripts
- **Speakers** - Session instructors
- **Users** - User accounts (Auth0 integration)
- **UserProfiles** - Extended user information
- **Countries** - Country reference data

#### Access Pattern
- Accessed via: DataRepository, AhadeesRepository
- ORM: Dapper
- Connection pooling: MultipleActiveResultSets

### Secondary Database: KQUR_DEV
**Server**: AHHOME  
**Connection Key**: QuranDb  
**Schema**: dbo (default)

#### Tables
**Quranic Content**:
- **Verses** - Quranic verses
- **Translations** - Multi-language translations
- **Surahs** - Chapter metadata

**Etymology System**:
- **EtymologyRoots** - Arabic root words
- **EtymologyDerivatives** - Word derivatives
- Root-derivative relationship tables

#### Stored Procedures
- Etymology search procedures
- Translation query procedures
- Complex analysis operations

#### Access Pattern
- Accessed via: QuranRepository
- Direct SQL for etymology (via EtymologyController)
- ORM: Dapper

---

## 🎨 Frontend Components (AngularJS)

### AngularJS Modules
**Framework**: AngularJS 1.8.2  
**Location**: `Source Code/Sessions.Spa/Scripts/`

### Module Organization
1. **Main App Module** - Application bootstrap
2. **Session Module** - Session management UI
3. **Etymology Module** - Arabic analysis interface
4. **Quran Module** - Verse study interface
5. **Admin Module** - Administrative UI

### Key Directories
- `Scripts/angular*.js` - Framework files
- `Scripts/app/` - Application code
  - `controllers/` - View controllers
  - `services/` - Business services
  - `directives/` - Custom directives
  - `filters/` - Custom filters

### Page Types
1. **SPA Views** - AngularJS templates via routing
2. **MVC Views** - Razor views (initial load)
3. **Partial Views** - Reusable components

---

## 🧪 Testing Infrastructure

### Test Project
**Name**: Sessions.Tests  
**Framework**: NUnit  
**Location**: `Source Code/Sessions.Tests/`  
**Configuration**: App.config

### Test Databases
- **KSESSIONS_TEST** - Test application data
- **KQUR_TEST** - Test Quranic content

### Test Categories
1. **API** - Controller endpoint tests
2. **Database** - Repository and query tests
3. **Business** - Service logic tests
4. **Integration** - End-to-end workflows
5. **Performance** - Load testing
6. **Security** - Auth/Authorization tests
7. **Frontend** - Karma/Jasmine (configured)

### Test Execution
```bash
# All tests
dotnet test Sessions.Tests.csproj

# Specific category
dotnet test --filter "Category=API"
```

---

## 🔗 Integration Points

### External Integrations
1. **Auth0** - User authentication (localhost:8080)
2. **Git** - Version control (via GitController)
3. **SMTP** - Email notifications (via EmailService)

### Internal Integrations
1. **KSESSIONS_DEV** - Primary database
2. **KQUR_DEV** - Quranic content
3. **SignalR** - Real-time communication
4. **NLog** - Structured logging

---

## 📦 Solution Projects (5)

### 1. **Sessions.Spa**
**Type**: ASP.NET Web Application  
**Path**: `Source Code/Sessions.Spa/`  
**Purpose**: Main web application  
**Contains**:
- Web API controllers
- AngularJS frontend
- SignalR hubs
- MVC views

### 2. **Sessions.Business**
**Type**: Class Library  
**Path**: `Source Code/Sessions.Business/`  
**Purpose**: Business logic layer  
**Contains**:
- SessionService
- EmailService
- Business interfaces

### 3. **Sessions.Data**
**Type**: Class Library  
**Path**: `Source Code/Sessions.Data/`  
**Purpose**: Data access layer  
**Contains**:
- Repositories
- LogService
- Data interfaces

### 4. **Sessions.Domain**
**Type**: Class Library  
**Path**: `Source Code/Sessions.Domain/`  
**Purpose**: Domain models and entities  
**Contains**:
- Entity models
- DTOs
- Enums

### 5. **Sessions.Tests**
**Type**: NUnit Test Project  
**Path**: `Source Code/Sessions.Tests/`  
**Purpose**: Test suite  
**Contains**:
- Unit tests
- Integration tests
- Test configurations

### Bonus Project (Separate Solution)

#### **IssueTracker.Api**
**Type**: ASP.NET Core Web API (.NET 8.0)  
**Path**: `Source Code/IssueTrackerApp/Api/`  
**Purpose**: Issue tracking system for KSESSIONS  
**Contains**:
- Issue management API
- SQLite database (issuetracker.db)
- EF Core data context
- Swagger documentation

---

## 🏗️ Build Dependencies

### Build Order
1. Sessions.Domain (no dependencies)
2. Sessions.Data (depends on: Domain)
3. Sessions.Business (depends on: Domain, Data)
4. Sessions.Spa (depends on: all above)
5. Sessions.Tests (depends on: all above)

### Package Dependencies
- **Dapper** 1.50.2 - ORM
- **SignalR** 2.2.1 - Real-time
- **NLog** 4.3.8 - Logging
- **Newtonsoft.Json** 9.0.1 - JSON serialization
- **OWIN** 3.0.1 - Security middleware
- **NUnit** (Tests) - Testing framework

---

## 📍 Quick Access by Feature

### Session Management Feature
- **Controllers**: SessionController, GroupController
- **Services**: SessionService
- **Repositories**: DataRepository
- **Database**: KSESSIONS_DEV.Sessions, Groups, Categories
- **UI**: Session management views (AngularJS)

### Etymology System Feature
- **Controllers**: EtymologyController
- **Repositories**: QuranRepository (indirect)
- **Database**: KQUR_DEV.EtymologyRoots, EtymologyDerivatives
- **UI**: Etymology analysis interface

### Quran Study Feature
- **Controllers**: QuranController
- **Repositories**: QuranRepository
- **Database**: KQUR_DEV.Verses, Translations, Surahs
- **UI**: Quran reading interface

### Hadith Collections Feature
- **Controllers**: AhadeesController
- **Repositories**: AhadeesRepository
- **Database**: KSESSIONS_DEV.Hadith tables
- **UI**: Hadith browsing interface

### Administration Feature
- **Controllers**: AdminController, AdminUtilityController
- **Services**: All services (admin access)
- **Authorization**: Admin role required
- **UI**: Admin dashboard

### Authentication Feature
- **Controllers**: AccountController, TokenController, RegistrationController
- **Services**: EmailService (registration emails)
- **Integration**: Auth0
- **Authorization**: JWT validation via OWIN

---

## 🔍 Search Helpers

### Find by Route
Use this index to locate controllers by their API routes:
- `/api/Account` → AccountController
- `/api/Session` → SessionController
- `/api/etymology` → EtymologyController
- `/api/Quran` → QuranController
- `/api/Ahadees` → AhadeesController
- `/api/Admin` → AdminController
- `/api/git` → GitController
- (See full list in [API Controllers](#api-controllers-22) section)

### Find by File
Controllers in `Source Code/Sessions.Spa/Controllers/`:
- `Api/` subfolder - Web API controllers
- Root folder - MVC controllers

Services in `Source Code/Sessions.Business/`:
- `SessionService.cs`
- `EmailService.cs`

Repositories in `Source Code/Sessions.Data/Repos/`:
- `DataRepository.cs`
- `AhadeesRepository.cs`
- `QuranRepository.cs`

### Find by Feature
Use the [Quick Access by Feature](#quick-access-by-feature) section above to locate all components related to a specific business feature.

---

## 📝 Maintenance Notes

### Adding New Controller
1. Create in `Source Code/Sessions.Spa/Controllers/Api/`
2. Inherit from `ApiController`
3. Add `[Route("api/[name]")]` attribute
4. Update this index
5. Add to API-Contract-Validation.md
6. Add to FunctionalityRegistry.md

### Adding New Service
1. Create interface in `Sessions.Business/Contracts/`
2. Implement in `Sessions.Business/`
3. Register in dependency injection (Startup/WebApiConfig)
4. Update this index
5. Document dependencies

### Adding New Repository
1. Create interface in `Sessions.Data/Contracts/`
2. Implement in `Sessions.Data/Repos/`
3. Configure connection string
4. Update this index
5. Document data access patterns

---

**Index Last Updated**: October 18, 2025  
**Total Recall Analysis**: Complete  
**Next Review**: On major feature additions
