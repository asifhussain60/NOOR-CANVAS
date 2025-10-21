# KSESSIONS Architecture

**Version**: 1.0.0  
**Last Updated**: October 18, 2025  
**Project**: KSESSIONS - Islamic Education Sessions Management

---

## 🎯 System Overview

**KSESSIONS** is a comprehensive Islamic education platform built on ASP.NET Web API (.NET Framework 4.8) with an AngularJS frontend. The system manages audio-recorded Islamic learning sessions with synchronized transcripts, etymology analysis for Arabic texts, Quranic verse study, and Hadith collections.

### Core Features
1. **Session Management** - Audio sessions with timestamped transcripts
2. **Etymology System** - Arabic root word analysis and derivatives
3. **Quran Study** - Verse-by-verse translation and etymology
4. **Hadith Collections** - Islamic tradition management
5. **Real-time Broadcasting** - SignalR-powered image sharing
6. **Admin Tools** - Content management and system monitoring
7. **Git Integration** - In-app version control operations

---

## 🏗️ Technology Stack

### Backend Stack
| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Language** | C# | 8.0 | Primary backend language |
| **Framework** | ASP.NET Web API | .NET 4.8 | REST API framework |
| **ORM** | Dapper | 1.50.2 | Lightweight data access |
| **Real-time** | SignalR | 2.2.1 | WebSocket communication |
| **Authentication** | Auth0 + JWT | - | User authentication |
| **Logging** | NLog | 4.3.8 | Structured logging |
| **Security** | OWIN | 3.0.1 | Security middleware |

### Frontend Stack
| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Framework** | AngularJS | 1.8.2 | SPA framework |
| **UI Library** | Bootstrap | - | Responsive UI |
| **jQuery** | jQuery | - | DOM manipulation |
| **Real-time Client** | SignalR JS | 2.2.1 | WebSocket client |
| **Build** | MSBuild | - | Bundling via .NET |

### Database Stack
| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Primary DB** | SQL Server (KSESSIONS_DEV) | Application data |
| **Secondary DB** | SQL Server (KQUR_DEV) | Quranic content |
| **Access Pattern** | Dapper + Stored Procedures | Data queries |
| **Connection Pooling** | MultipleActiveResultSets | Performance |

### Development Stack
| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Build System** | MSBuild | Solution compilation |
| **Web Server** | IIS Express | Development hosting |
| **IDE** | VS 2022 / VS Code | Development environment |
| **Testing** | NUnit | Unit/integration tests |
| **Version Control** | Git | Source control |

---

## 🏛️ Architecture Pattern

### Layered Architecture (4-Tier)

```
┌─────────────────────────────────────────────────────────┐
│              Presentation Layer                         │
│  (AngularJS SPA + ASP.NET MVC Views + Web API)         │
│  - Controllers/Api/* (17 API controllers)              │
│  - Controllers/HomeController.cs (MVC views)           │
│  - Scripts/* (AngularJS modules and services)          │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              Business Logic Layer                       │
│            (Sessions.Business)                          │
│  - SessionService.cs (Session orchestration)           │
│  - EmailService.cs (Email notifications)               │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              Data Access Layer                          │
│              (Sessions.Data)                            │
│  - DataRepository.cs (Generic data access)             │
│  - AhadeesRepository.cs (Hadith data)                  │
│  - QuranRepository.cs (Quranic content)                │
│  - LogService.cs (Logging infrastructure)              │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              Domain Models Layer                        │
│            (Sessions.Domain)                            │
│  - Entity models and DTOs                              │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                    Database Layer                       │
│  - KSESSIONS_DEV (Application data)                    │
│  - KQUR_DEV (Quranic content + Etymology)              │
└─────────────────────────────────────────────────────────┘
```

---

## 🎮 Controllers (API Layer)

### Controller Inventory (17 Controllers)

#### Core Application Controllers

**1. AccountController** (`/api/Account`)
- **Purpose**: User authentication and profile management
- **Auth0 Integration**: JWT token validation
- **Key Endpoints**: UserInfo, Logout

**2. SessionController** (`/api/Session`)
- **Purpose**: Islamic session management (CRUD)
- **Features**: Audio playback coordination, transcript synchronization
- **Data Source**: KSESSIONS_DEV.dbo.Sessions

**3. GroupController** (`/api/Group`)
- **Purpose**: Content collections (Albums) management
- **Hierarchy**: Groups → Categories → Sessions
- **Data Source**: KSESSIONS_DEV.dbo.Groups

**4. AdminController** (`/api/Admin`)
- **Purpose**: Administrative operations
- **Authorization**: Admin role required
- **Features**: System monitoring, user management

**5. AdminUtilityController** (`/api/AdminUtility`)
- **Purpose**: Maintenance and diagnostic utilities
- **Features**: Data cleanup, system health checks
- **Access**: Admin-only

#### Content Controllers

**6. QuranController** (`/api/Quran`)
- **Purpose**: Quranic verse management
- **Data Source**: KQUR_DEV database
- **Features**: Verse retrieval, translation management, surah navigation

**7. AhadeesController** (`/api/Ahadees`)
- **Purpose**: Hadith (Islamic traditions) management
- **Repository**: AhadeesRepository
- **Features**: Search, categorization, reference validation

**8. EtymologyController** (`/api/etymology`)
- **Purpose**: Arabic etymology analysis system
- **Data Source**: KQUR_DEV.EtymologyRoots/Derivatives
- **Key Features**:
  - Root word search (`/search`)
  - Derivative analysis (`/roots/{id}/derivatives`)
  - Arabic text processing (`/arabic/unbrace`)
  - Database diagnostics (`/diagnostics`)
  - CRUD operations for roots and derivatives

#### Integration Controllers

**9. GitController** (`/api/git`)
- **Purpose**: In-application Git operations
- **Features**: 
  - Repository status (`/status`)
  - Commit changes (`/commit`)
  - Push to remote (`/push`)
  - Combined operations (`/commit-and-push`)
- **Use Case**: Version control without leaving the application

**10. FileController** (`/api/File`)
- **Purpose**: File upload and management
- **Primary Use**: Audio file uploads for sessions
- **Features**: File storage, retrieval, metadata management

#### Real-time & Communication

**11. SearchController** (`/api/Search`)
- **Purpose**: Global search across all content types
- **Scope**: Sessions, Groups, Quran verses, Hadith

**12. TokenController** (`/api/Token`)
- **Purpose**: JWT token generation and validation
- **Auth Integration**: Auth0 token management
- **Features**: Token refresh, expiration handling

#### Utility Controllers

**13. LoggingController** (`/api/Logging`)
- **Purpose**: Client-side error logging endpoint
- **Integration**: NLog structured logging
- **Use**: JavaScript error reporting to server

**14. LogsController** (`/api/logs`)
- **Purpose**: Server log management and retrieval
- **Features**: Log file access, filtering, download

**15. DocsController** (`/api/Docs`)
- **Purpose**: API documentation endpoints
- **Features**: Swagger-like documentation, endpoint discovery

**16. DatabaseTestController** (`/api/DatabaseTest`)
- **Purpose**: Database connectivity diagnostics
- **Use**: Development/troubleshooting only
- **Tests**: Connection strings, query execution, schema validation

**17. TestController** (`/api/Test`)
- **Purpose**: Development testing endpoints
- **Use**: Feature prototyping, integration testing
- **Status**: Development only (not deployed to production)

#### Additional Testing Controllers

**18. H2TranscriptTestController** (`/api/h2test`)
- **Purpose**: Transcript parsing and splitting tests
- **Use**: Validate transcript format processing
- **Key Endpoints**:
  - `/session/{id}/transcript` - Retrieve transcript
  - `/session/{id}/test-split` - Test splitting logic
  - `/test-custom-content` - Custom parsing tests

**19. ValuesController** (`/api/Values`)
- **Purpose**: Sample API controller (Web API template default)
- **Status**: Can be removed in production

**20. PublicController** (`/api/Public`)
- **Purpose**: Public endpoints (no authentication)
- **Use**: Landing page data, public content access

**21. RegistrationController** (`/api/Registration`)
- **Purpose**: User registration workflows
- **Integration**: Auth0 user creation

**22. HomeController** (MVC Controller)
- **Purpose**: Serve main SPA view
- **Route**: `/` (root)
- **Returns**: AngularJS bootstrap page

---

## 🔄 SignalR Hubs (Real-time Communication)

### ImageHub
**File**: `Source Code/Sessions.Spa/Hubs/ImageHub.cs`
**Purpose**: Real-time image broadcasting to connected clients

**Architecture**:
```
Host/Presenter → ImageHub → All Connected Participants
```

**Server Methods** (Client → Server):
- Connection lifecycle management
- Group join/leave operations

**Client Events** (Server → Client):
- `broadcastImage` - Broadcast image to all clients
- Real-time synchronization signals

**Usage Scenario**:
1. Presenter uploads/shares image during session
2. ImageHub broadcasts to all connected participants
3. Participants receive and display image in real-time

**Connection**:
```javascript
// Client-side connection
var hub = $.connection.imageHub;
hub.client.broadcastImage = function(imageData) {
    // Display image
};
$.connection.hub.start();
```

---

## 🗃️ Data Access Layer

### Repository Pattern Implementation

#### 1. DataRepository (`Sessions.Data`)
**Interface**: `IDataRepository`
**File**: `Source Code/Sessions.Data/Repos/DataRepository.cs`
**Purpose**: Generic data access for KSESSIONS_DEV database

**Responsibilities**:
- Execute parameterized queries via Dapper
- Call stored procedures
- Transaction management
- Connection lifetime management

**Connection**: Uses `DefaultDb` connection string

**Key Methods Pattern**:
```csharp
public interface IDataRepository
{
    Task<IEnumerable<T>> QueryAsync<T>(string sql, object param);
    Task<int> ExecuteAsync(string sql, object param);
    Task<T> QuerySingleAsync<T>(string sql, object param);
}
```

#### 2. AhadeesRepository (`Sessions.Data`)
**Interface**: `IAhadeesRepository`
**File**: `Source Code/Sessions.Data/Repos/AhadeesRepository.cs`
**Purpose**: Hadith-specific data operations

**Features**:
- Hadith search with filters
- Collection management
- Reference validation
- Text normalization for Arabic

#### 3. QuranRepository (`Sessions.Data`)
**Interface**: `IQuranRepository`
**File**: `Source Code/Sessions.Data/Repos/QuranRepository.cs`
**Purpose**: Quranic content access from KQUR_DEV

**Connection**: Uses `QuranDb` connection string

**Key Operations**:
- Verse retrieval by surah/ayah
- Translation queries (multiple languages)
- Etymology data integration
- Surah metadata access

**Etymology Integration**:
- Root word lookups
- Derivative analysis
- Cross-references between verses and roots

---

## 💼 Business Logic Layer

### Service Inventory

#### 1. SessionService (`Sessions.Business`)
**Interface**: `ISessionService`
**File**: `Source Code/Sessions.Business/SessionService.cs`

**Responsibilities**:
- Session lifecycle management
- Audio playback coordination
- Transcript synchronization
- Business rule enforcement

**Dependencies**:
- `IDataRepository` - Data access
- Configuration for session rules

**Key Operations**:
- CreateSession
- UpdateSession
- GetSessionDetails
- ManageTranscripts

#### 2. EmailService (`Sessions.Business`)
**Interface**: `IEmailService`
**File**: `Source Code/Sessions.Business/EmailService.cs`

**Purpose**: Email notification system

**Features**:
- User registration emails
- Session notifications
- Admin alerts
- Template-based emails

**Configuration**: SMTP settings from Web.config

#### 3. LogService (`Sessions.Data`)
**File**: `Source Code/Sessions.Data/Services/LogService.cs`

**Purpose**: NLog integration and structured logging

**Features**:
- Structured JSON logging
- Performance tracking
- Error logging with context
- Log file management

**Log Targets** (from Web.config):
- GeneralLog - All application logs
- ErrorLog - Error-level logs only
- StructuredLog - JSON format for analysis
- PerformanceLog - Performance metrics

---

## 🎨 Frontend Architecture (AngularJS)

### AngularJS Structure

**Framework Version**: AngularJS 1.8.2

**Application Structure**:
```
Scripts/
├── angular.js              # AngularJS framework
├── angular-route.js        # Routing module
├── angular-aria.js         # Accessibility
├── app/                    # Application code
│   ├── controllers/        # View controllers
│   ├── services/           # Business services
│   ├── directives/         # Custom directives
│   └── filters/            # Custom filters
└── vendor/                 # Third-party libraries
```

### Key AngularJS Modules
1. **Main App Module** - Application bootstrap
2. **Session Module** - Session management UI
3. **Etymology Module** - Arabic analysis UI
4. **Quran Module** - Verse study interface
5. **Admin Module** - Administrative interface

### Page Types
1. **SPA Views** - AngularJS templates served via routing
2. **MVC Views** - Razor views for initial page load
3. **Partial Views** - Reusable UI components

---

## 🔐 Authentication & Authorization Architecture

### Auth0 Integration

**Provider**: Auth0 (kashkole.auth0.com)
**Strategy**: JWT Bearer Token Authentication

**Flow**:
```
1. User → Auth0 Login Page
2. Auth0 → Validates Credentials
3. Auth0 → Returns JWT Token
4. Client → Stores Token (localStorage)
5. Client → Includes Token in API Requests (Authorization: Bearer {token})
6. API → Validates Token via OWIN Middleware
7. API → Processes Authorized Request
```

**Token Configuration**:
- **Development**: Extended lifetime for convenience (`Development:ExtendedTokenLifetime`)
- **Production**: Short expiration (15-60 minutes)
- **Refresh**: Token refresh logic in client

**Authorization Levels**:
1. **Anonymous** - Public endpoints (PublicController)
2. **Authenticated** - Requires valid JWT token
3. **Admin** - Requires admin role claim in token

### OWIN Security Middleware
**Package**: Microsoft.Owin.Security
**Configuration**: Startup.cs (OWIN startup class)

**Middleware Chain**:
```
OWIN Pipeline:
  → JWT Bearer Authentication
  → Authorization
  → Web API Controllers
```

---

## 🔧 Build & Deployment Architecture

### Build System

**Primary Tool**: MSBuild
**Solution**: KSESSIONS.sln
**Target Framework**: .NET Framework 4.8

**Build Configuration**:
- **Debug** - Development with debug symbols
- **Release** - Production optimized build

**Projects Build Order**:
1. Sessions.Domain (entity models)
2. Sessions.Data (data access)
3. Sessions.Business (business logic)
4. Sessions.Spa (web application)
5. Sessions.Tests (test suite)

### Development Server

**Primary Method**: IIS Express via `ksrun` script
**Port**: 8080 (Auth0 configured callback)
**Script**: `Workspaces/SCRIPTS/VSCODE/ksrun.ps1`

**Alternative**: `ksiis` script for API-only testing
**Ports**: 3000+ (configurable, no Auth0)

### VS Code Tasks
Defined in `.vscode/tasks.json`:
- **Build KSESSIONS Solution** - Full build + launch
- **Build Only (No Run)** - Build without server start
- **Quick Build (No Clean)** - Incremental build
- **Restart IIS Express** - Server restart
- **MSBuild Clean** - Clean solution
- **MSBuild Build** - Direct MSBuild

---

## 🧪 Testing Architecture

### Test Project Structure
**Project**: Sessions.Tests
**Framework**: NUnit
**Location**: `Source Code/Sessions.Tests/`

### Test Infrastructure
**Configuration**: App.config with test databases
- **Test DB**: KSESSIONS_TEST
- **Test Quran DB**: KQUR_TEST

### Test Categories
1. **API Tests** - Controller endpoint validation
2. **Database Tests** - Repository and query tests
3. **Business Tests** - Service logic validation
4. **Integration Tests** - End-to-end workflows
5. **Performance Tests** - Load and performance metrics
6. **Security Tests** - Authorization and authentication

### Frontend Testing (Configured)
**Framework**: Karma + Jasmine
**Config**: `karma.conf.js`, `jasmine.config.js`
**Port**: 9876 (Karma server)
**Status**: Configured but tests need implementation

### Test Execution
```bash
# All tests
dotnet test Sessions.Tests.csproj

# Specific category
dotnet test --filter "Category=API"

# Granular execution enabled
# Individual test execution supported
```

---

## 📊 Database Schema Architecture

### KSESSIONS_DEV Database

**Schema**: dbo (default)

**Core Tables**:

**1. Content Hierarchy**:
```
Groups (Albums)
  └─ Categories (Subdivisions)
      └─ Sessions (Individual sessions)
          └─ SessionTranscripts (Timestamped text)
```

**2. User Management**:
- `Users` - User accounts (Auth0 integration)
- `UserProfiles` - Extended user data
- `Speakers` - Session presenters/instructors

**3. Reference Data**:
- `Countries` - Country reference
- Additional lookup tables

### KQUR_DEV Database (Quranic Content)

**Schema**: dbo (default)

**Etymology Tables**:
- `EtymologyRoots` - Arabic root words
- `EtymologyDerivatives` - Word derivatives from roots
- Root-derivative relationships

**Quranic Content**:
- `Verses` - Quranic verses
- `Translations` - Multi-language translations
- `Surahs` - Chapter metadata

**Stored Procedures**:
- Etymology search procedures
- Translation query procedures
- Complex analysis procedures

---

## 🔗 Integration Points

### External Integrations

**1. Auth0**
- User authentication
- JWT token issuance
- User profile management
- **Critical**: Only works on localhost:8080

**2. Git Integration**
- In-app Git operations via GitController
- Status checks, commits, pushes
- Local repository management

**3. Email System**
- SMTP integration via EmailService
- Configuration in Web.config

### Internal Integrations

**1. Database Connectivity**
- KSESSIONS_DEV (primary application data)
- KQUR_DEV (Quranic content and etymology)
- Connection pooling and timeout management

**2. SignalR Real-time**
- ImageHub for image broadcasting
- Client-server bidirectional communication

**3. Logging Infrastructure**
- NLog for structured logging
- Multiple log targets (files, JSON)
- Performance tracking

---

## 📈 Performance Considerations

### Database Optimization
- Connection pooling (`MultipleActiveResultSets=true`)
- Dapper for lightweight ORM (faster than Entity Framework)
- Stored procedures for complex queries
- Indexed primary and foreign keys

### Caching Strategy
- Application-level caching (to be implemented)
- Static content caching via IIS Express
- Browser caching for AngularJS assets

### Real-time Performance
- SignalR connection management
- Group-based broadcasting (reduces overhead)
- Client-side buffering for images

---

## 🛡️ Security Architecture

### Security Layers

**1. Authentication (Auth0)**
- JWT token validation
- Secure token transmission (HTTPS in production)
- Token expiration enforcement

**2. Authorization**
- Role-based access control
- Endpoint-level authorization attributes
- Resource ownership validation

**3. Data Security**
- Parameterized queries (SQL injection prevention)
- Connection string encryption (Web.config)
- Password hashing (Auth0 managed)

**4. Transport Security**
- HTTPS in production
- Secure cookie flags
- CORS configuration

**5. Input Validation**
- Server-side validation on all inputs
- AngularJS form validation
- SQL injection prevention via Dapper

---

## 🚀 Deployment Architecture

### Development Environment
- **Server**: IIS Express
- **Port**: 8080 (main), 3000+ (API testing)
- **Database**: Local SQL Server (AHHOME)
- **Auth**: Auth0 development tenant

### Production Environment (Future)
- **Server**: IIS or Azure App Service
- **Database**: Production SQL Server
- **Auth**: Auth0 production tenant
- **HTTPS**: SSL certificate required
- **Monitoring**: NLog + centralized logging

---

## 🔄 Data Flow Patterns

### Typical Request Flow

**1. User Interaction**:
```
User (Browser)
  → AngularJS Controller
  → AngularJS Service (HTTP)
  → API Controller
  → Business Service
  → Repository
  → Database
  ← Response flows back
```

**2. Real-time Flow** (SignalR):
```
Client A → ImageHub.SendImage()
  → Hub processes
  → Broadcasts to Group/All Clients
  → Client B receives via hub.client.broadcastImage()
```

**3. Authentication Flow**:
```
Login Request
  → Auth0 (external)
  → JWT Token returned
  → Stored client-side
  → Attached to API requests
  → OWIN validates token
  → Request processed
```

---

## 📝 Configuration Management

### Configuration Hierarchy
1. **Web.config** - Base configuration
2. **Web.Debug.config** - Development overrides (XDT transforms)
3. **Web.Release.config** - Production overrides (XDT transforms)
4. **Environment Variables** - Runtime overrides (optional)

### Key Configuration Sections
- **connectionStrings** - Database connections
- **appSettings** - Application settings
- **nlog** - Logging configuration
- **system.web** - ASP.NET settings
- **system.webServer** - IIS settings

---

## 🎯 Architecture Decisions

### Why Dapper over Entity Framework?
- **Performance**: Lighter weight, faster query execution
- **Control**: Direct SQL control when needed
- **Simplicity**: Less overhead for this project size

### Why AngularJS 1.x?
- **Legacy**: Project started with AngularJS
- **Stability**: Mature, well-understood framework
- **Integration**: Works well with ASP.NET Web API
- **Future**: Consider migration to Angular (modern) or React

### Why ASP.NET Web API (.NET Framework)?
- **Compatibility**: Enterprise SQL Server integration
- **Tooling**: Visual Studio integration
- **Stability**: Mature framework for production
- **Future**: Consider migration to ASP.NET Core

---

**Architecture Review Date**: October 18, 2025  
**Next Review**: Quarterly or on major feature additions
