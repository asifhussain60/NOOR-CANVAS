# SelfAwareness – Global Operating Guardrails (2.5.0)

> Canonical operating rules for all agents. Keep **.github/prompts/** as the source of truth.  
> Everything else lives under **Workspaces/Copilot/**.

## 🔀 Branch Strategy (CRITICAL)

**BRANCH STRUCTURE**:
- **`master`** - Production branch (PROTECTED)
  - ALWAYS represents what's currently deployed in production
  - NEVER commit directly to master
  - Only receives merges from `development` after testing
  - Production deployments happen from this branch
  
- **`development`** - Active development branch (DEFAULT)
  - ALL development work happens here
  - ALL feature implementations
  - ALL bug fixes
  - ALL testing and experimentation
  - Agents should ALWAYS work in this branch

**WORKFLOW**:
1. **Development**: All work done in `development` branch
2. **Testing**: Validate changes thoroughly in development
3. **Merge**: When ready for production, merge `development` → `master`
4. **Deploy**: Production deployment scripts deploy from `master` branch
5. **Continue**: Resume development work in `development` branch

**ENFORCEMENT**:
- ⚠️ **NEVER** modify `master` branch directly
- ✅ **ALWAYS** create commits in `development` branch
- ✅ **ALWAYS** verify you're in `development` before starting work:
  ```bash
  git branch --show-current  # Should return: development
  ```
- ❌ If on `master`, switch immediately:
  ```bash
  git checkout development
  ```

**RATIONALE**:
- Production stability: `master` only contains tested, deployable code
- Safe experimentation: `development` allows iteration without affecting production
- Clear deployment path: Deployment scripts know to deploy from `master`
- Easy rollback: Can revert `master` without losing development work

## Scope
Governs `/workitem`, `/continue`, `/pwtest`, `/cleanup`, `/retrosync`, `/imgreq`, `/refactor`, `/migrate`, `/promptsync`.

## Required Reading
**CRITICAL:** Before making any architectural decisions, implementing new features, or modifying existing code, agents **MUST** consult:
- **`.github/instructions/Links/SystemIndex.md`** - Central navigation hub for all architectural references, agent coordination, and system snapshots
- **`.github/instructions/Links/InfrastructureQuickRef.md`** - **MANDATORY** for database operations - contains KSESSIONS_DEV connection details and schema access rules
- **`.github/instructions/Links/Architecture.md`** - Comprehensive application architecture documentation including:
  - Complete API endpoint catalog
  - UI pages and component inventory
  - Service architecture with responsibilities
  - Real-time communication documentation
  - Data model catalog and database schemas
  - Authentication flows and security patterns
  - Integration patterns and common workflows

**Purpose:** This prevents duplication of existing functionality and ensures new implementations follow established architectural patterns.

## 🗄️ Database Access Rules (MANDATORY)

**PRIMARY DATABASE: KSESSIONS_DEV**
- When user mentions "database", assume **KSESSIONS_DEV** unless specified otherwise
- Server: AHHOME
- Connection Key: "DefaultDb" (in Web.config)
- Main schema: dbo (default)

**SECONDARY DATABASE: KQUR_DEV**
- Quranic content and etymology system
- Server: AHHOME
- Connection Key: "QuranDb" (in Web.config)
- Main schema: dbo (default)

**ACCESS RULES**:
- ✅ **READ-WRITE**: All tables in both databases (via appropriate repositories)
- ✅ Use Dapper ORM for all database operations
- ✅ Use stored procedures for complex operations
- ❌ **NEVER** hardcode connection strings - always use Web.config
- ❌ **NEVER** bypass repository layer

**CRITICAL**:
- Always retrieve connection strings from configuration:
  ```csharp
  var connString = ConfigurationManager.ConnectionStrings["DefaultDb"].ConnectionString;
  var quranConnString = ConfigurationManager.ConnectionStrings["QuranDb"].ConnectionString;
  ```

## 🏗️ Project Structure & Conventions

**PROJECT: KSESSIONS**
- **Type**: ASP.NET Web API (.NET Framework 4.8)
- **UI Framework**: AngularJS 1.8.2
- **Real-time**: SignalR 2.2.1
- **Source Path**: `Source Code/Sessions.Spa/`
- **Solution**: `KSESSIONS.sln`

**LAYERED ARCHITECTURE**:
1. **Presentation**: `Sessions.Spa` (API controllers + AngularJS)
2. **Business Logic**: `Sessions.Business` (Services)
3. **Data Access**: `Sessions.Data` (Repositories)
4. **Domain**: `Sessions.Domain` (Models/Entities)

**BUILD & RUN**:
- **Build**: MSBuild via VS Code tasks or `msbuild KSESSIONS.sln`
- **Run (Main)**: `ksrun` script (port 8080 with Auth0)
- **Run (API Test)**: `ksiis 3000` script (port 3000 without Auth0)
- **Test**: NUnit via `dotnet test Sessions.Tests.csproj`

**DEVELOPMENT SERVER**:
- **Primary Port**: 8080 (Auth0 callback configured)
- **API Testing Port**: 3000+ (no Auth0)
- **Server**: IIS Express
- **CRITICAL**: Auth0 only works on port 8080

## 🧪 Testing Framework

**TEST PROJECT**: Sessions.Tests
- **Framework**: NUnit
- **Test Databases**: KSESSIONS_TEST, KQUR_TEST
- **Categories**: API, Database, Business, Integration, Performance, Security
- **Frontend**: Karma + Jasmine (configured)

**TEST EXECUTION**:
```bash
# Run all tests
dotnet test Sessions.Tests.csproj

# Run by category
dotnet test --filter "Category=API"
```

## 🔧 Code Quality Tools

**ANALYZERS**:
- EditorConfig for style enforcement
- MSBuild code analysis
- NLog for logging standards

**BEST PRACTICES**:
- Follow existing code patterns
- Use dependency injection
- Implement proper error handling
- Log all errors via LogService
- Validate inputs server-side

## 🎯 API Development Guidelines

**ENDPOINTS**:
- **Base URL**: `http://localhost:8080/api` (development)
- **Pattern**: `/api/[Controller]/[Action]`
- **Auth**: JWT Bearer tokens in Authorization header
- **Response**: JSON format

**NEW CONTROLLER CHECKLIST**:
1. Inherit from `ApiController`
2. Add route attributes
3. Implement proper error handling
4. Add authorization attributes where needed
5. Document in API-Contract-Validation.md
6. Add to SystemIndex.md
7. Create corresponding tests

## 🔐 Authentication & Authorization

**PROVIDER**: Auth0
Security note:
- Client IDs are public, but never commit secrets (client secret, signing keys) to the repo.
- Store secrets securely (user secrets, environment variables, or deployment slots). Never hardcode.

**JWT TOKENS**:
- Development: Extended lifetime
- Production: Short expiration (15-60 min)
**Pre-flight: Ports & Execution Policy**
- Ensure PowerShell can run scripts:
  - Start VS Code as Administrator if needed
  - ExecutionPolicy Bypass is already used by tasks
- Verify port 8080 is free before `ksrun` (Auth0 requires 8080)
**ROLES**:
- `User` - Standard authenticated user
- `Admin` - Administrative access

**AUTHORIZATION PATTERN**:
```csharp
[Authorize] // Requires authentication
[Authorize(Roles = "Admin")] // Requires admin role
```

## 🌐 Frontend Development Guidelines

**FRAMEWORK**: AngularJS 1.8.2

**STRUCTURE**:
- **Location**: `Source Code/Sessions.Spa/Scripts/`
- **Modules**: Organized by feature
- **Services**: API communication
- **Controllers**: View logic
- **Directives**: Reusable components

**SIGNALR CLIENT**:
```javascript
var hub = $.connection.imageHub;
hub.client.broadcastImage = function(imageData) {
    // Handle real-time data
};
$.connection.hub.start();
```

## 📝 Logging Standards

**LOGGER**: NLog 4.3.8

**LOG LEVELS**:
- **Trace**: Detailed diagnostic
- **Debug**: Development debugging
- **Info**: General information
- **Warn**: Warning conditions
- **Error**: Error conditions
- **Fatal**: Critical failures

**LOG TARGETS** (Web.config):
- GeneralLog - All logs
- ErrorLog - Errors only
- StructuredLog - JSON format
- PerformanceLog - Performance metrics

**USAGE**:
```csharp
private static readonly Logger logger = LogManager.GetCurrentClassLogger();
logger.Info("Operation completed successfully");
logger.Error(exception, "Operation failed");
```

## 🔄 SignalR Real-time Communication

**HUB**: ImageHub
- **Route**: `/signalr` (auto-generated)
- **Purpose**: Real-time image broadcasting
- **Pattern**: Hub-and-spoke (presenter → all participants)

**SERVER METHODS**: Connection management
**CLIENT EVENTS**: `broadcastImage`

## 📦 Dependency Management

**PACKAGE MANAGER**: NuGet

**KEY DEPENDENCIES**:
- Dapper 1.50.2 - ORM
- SignalR 2.2.1 - Real-time
- NLog 4.3.8 - Logging
- Newtonsoft.Json 9.0.1 - JSON
- OWIN 3.0.1 - Security middleware

**PACKAGE RESTORE**:
- Automatic on build
- Manual: `nuget restore KSESSIONS.sln`

## 🚀 Deployment Considerations

**DEVELOPMENT**:
- Server: IIS Express
- Port: 8080 (main), 3000+ (API testing)
- Database: Local SQL Server (AHHOME)
- Auth: Auth0 development tenant

**PRODUCTION** (when applicable):
- Server: IIS or Azure App Service
- HTTPS: Required for Auth0
- Database: Production SQL Server
- Config transforms: Web.Release.config
- Auth: Auth0 production tenant

## ⚠️ Critical Rules Summary

**NEVER**:
- ❌ Commit directly to `master` branch
- ❌ Hardcode connection strings
- ❌ Bypass repository layer for data access
- ❌ Use port 8080 for API testing (Auth0 conflict)
- ❌ Skip authentication on sensitive endpoints
- ❌ Ignore existing architectural patterns

**ALWAYS**:
- ✅ Work in `development` branch
- ✅ Consult SystemIndex.md before implementing features
- ✅ Use connection strings from Web.config
- ✅ Access data via repositories
- ✅ Use `ksrun` for Auth0-enabled development
- ✅ Use `ksiis 3000` for API-only testing
- ✅ Follow layered architecture (Presentation → Business → Data)
- ✅ Log errors via LogService
- ✅ Validate inputs server-side
- ✅ Document new APIs in API-Contract-Validation.md

## 📚 Documentation Requirements

**WHEN ADDING/MODIFYING FEATURES**:
1. Update SystemIndex.md with new components
2. Document API contracts in API-Contract-Validation.md
3. Add to FunctionalityRegistry.md
4. Update Architecture.md if architecture changes
5. Add tests to Sessions.Tests
6. Update InfrastructureQuickRef.md if infrastructure changes

## 🔍 Troubleshooting Quick Reference

**Database Connection Issues**:
- Check Web.config connectionStrings
- Verify SQL Server is running (AHHOME)
- Test with DatabaseTestController endpoints

**Auth0 Issues**:
- Ensure running on port 8080
- Check Web.config Auth0 settings
- Verify token in Authorization header

**Build Issues**:
- Restore NuGet packages
- Clean solution before rebuild
- Check MSBuild output for errors

**SignalR Issues**:
- Check browser console for connection errors
- Verify SignalR JavaScript included
- Test hub connectivity

**Port Conflicts**:
- Stop other instances of IIS Express
- Use task manager to kill stuck processes
- Try alternative port with `ksiis [port]`

## 📍 Key File Locations

**Configuration**:
- `Source Code/Sessions.Spa/Web.config` - Main configuration
- `Source Code/Sessions.Spa/Web.Debug.config` - Dev overrides
- `Source Code/Sessions.Spa/Web.Release.config` - Prod overrides

**Documentation**:
- `.github/instructions/Links/SystemIndex.md` - System navigation
- `.github/instructions/Links/InfrastructureQuickRef.md` - Database & API reference
- `.github/instructions/Links/Architecture.md` - Architecture details
- `.github/instructions/Links/API-Contract-Validation.md` - API contracts
- `.github/instructions/Links/FunctionalityRegistry.md` - Feature catalog

**Scripts**:
- `Workspaces/SCRIPTS/VSCODE/ksrun.ps1` - Main development server
- `Workspaces/SCRIPTS/VSCODE/ksiis.ps1` - API testing server

**Tests**:
- `Source Code/Sessions.Tests/` - Test project directory

---

**Last Updated**: October 18, 2025  
**Version**: 2.5.0 (KSESSIONS-specific)  
**Generated By**: Total Recall Analysis
