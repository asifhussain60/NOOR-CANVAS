# Deploy Key - Production Database Migration & Configuration

## Metadata
- **Key**: deploy
- **Status**: in-progress
- **Created**: 2025-10-12
- **Last Updated**: 2025-10-12 07:51 UTC
- **Agent**: task
- **Priority**: high

## Objective
Prepare and validate production deployment for Noor Canvas application with proper database configuration and environment indicators.

## File Mappings

### Database
- `Workspaces/Scripts/KSESSIONS_Canvas_Migration_Script.sql` - Complete canvas schema & data migration script (KSESSIONS_DEV → KSESSIONS)
- `Workspaces/Scripts/KSESSIONS_DDL_Migration_20251012.sql` - CASCADE DELETE validation and configuration
- `Scripts/TruncateCanvasSessions.sql` - Safe truncation of canvas.Sessions for fresh start (production: KSESSIONS)
- `Scripts/canvas.CleanCanvas.sql` - Stored procedure for canvas schema cleanup (development: KSESSIONS_DEV)

### Configuration
- `SPA/NoorCanvas/appsettings.Production.json` - Production connection strings (KSESSIONS, KQUR)
- `publish-temp/web.Release.config` - IIS web.config transformation for production
- `SPA/NoorCanvas/appsettings.json` - Development connection strings (KSESSIONS_DEV, KQUR_DEV)

### Deployment
- `ncdeploy.ps1` - Production deployment script with automatic wwwroot cleanup
- `cleanup-production-wwwroot.ps1` - Manual production wwwroot cleanup script
- `ncrollback.ps1` - Deployment rollback script

### Frontend (Components)
- `SPA/NoorCanvas/Components/Production/ProductionInfoPanel.razor` - Production-safe database info display (NEW)
- `SPA/NoorCanvas/Components/Development/DebugPanel.razor` - Enhanced with database connection display

### Frontend (Views)
- `SPA/NoorCanvas/Pages/HostLanding.razor` - Integrated environment-aware info panels

## Work Log

---
## [2025-10-12 07:51 UTC] - task
**Status**: in-progress | **Phase**: execution | **Commit**: 10621cb
**Work**: 
- Fixed SQL syntax errors in migration script:
  * Replaced EXEC with sp_executesql for OUTPUT parameters
  * Added column aliases to subqueries (SELECT 1 AS cnt)
- Executed migration script against KSESSIONS database:
  * Created canvas schema with 4 tables (AssetLookup, Sessions, Participants, SessionData)
  * Migrated 20 total records from KSESSIONS_DEV
  * Created 9 constraints, 17 indexes, 2 foreign keys
  * Zero errors, zero warnings, zero data integrity issues
- Updated appsettings.Production.json with KSESSIONS connection strings
- Created ProductionInfoPanel.razor component (database info without debug controls)
- Enhanced DebugPanel.razor with database connection display
- Integrated environment-aware info panels into HostLanding.razor

**Files**: 9 modified | **Tests**: N/A (database migration) | **Build**: PASS (1 pre-existing warning)
**Next**: Validate production deployment and database connectivity
---

---
## [2025-10-12 12:00 UTC] - task
**Status**: in-progress | **Phase**: ddl-migration-and-cleanup | **Commit**: a881612
**Work**:
- Analyzed KSESSIONS_DEV schema for changes
  * Both databases already have CASCADE DELETE configured on foreign keys
  * FK_Participants_Sessions_SessionId: ON DELETE CASCADE ✓
  * FK_SessionData_Sessions_SessionId: ON DELETE CASCADE ✓
  * canvas.AssetLookup excluded (no FK to Sessions)
- Created DDL migration script (KSESSIONS_DDL_Migration_20251012.sql)
  * Validates CASCADE DELETE configuration
  * Idempotent with automatic fix if needed
  * Executed successfully: No DDL changes required
- Cleaned up appsettings.Production.json:
  * Removed KSessionsDb connection string
  * Removed KQurDb connection string
  * Kept only DefaultConnection (KSESSIONS)
- Created nct-prod.ps1 script:
  * Production token generation connecting to KSESSIONS
  * Sets ASPNETCORE_ENVIRONMENT=Production
  * No automatic app launch (production safety)
  * Parallel with nct.ps1 (dev) using KSESSIONS_DEV
- Cleaned production wwwroot folder:
  * Removed 8 test/documentation files
  * Removed testing/ folder
  * Production deployment ready

**Files**: 7 modified/created | **Tests**: N/A | **Build**: PASS
**Next**: Deploy to production, test nct-prod.ps1
---

---
## [2025-10-12 16:30 UTC] - task
**Status**: in-progress | **Phase**: deployment-automation | **Commit**: pending
**Work**:
- Enhanced ncdeploy.ps1 deployment script:
  * Added automatic exclusion of dev/test files during deployment
  * Excluded files: FONT-SYSTEM-SUMMARY.md, test-*.html, session-transcript-*.html, testing/ folder
  * Prevents dev artifacts from reaching production
  * Automatic cleanup of production wwwroot after deployment
  * Cleaner production deployment with reduced disk footprint
- Created TruncateCanvasSessions.sql script:
  * Safely truncates canvas.Sessions table in KSESSIONS (production)
  * Comprehensive safety checks: database validation, CASCADE DELETE verification, dbo schema isolation
  * Truncates canvas.Sessions, canvas.Participants, canvas.SessionData
  * Preserves canvas.AssetLookup (no FK dependency)
  * Verifies dbo.Sessions and all dbo tables remain untouched
  * Transaction-safe with automatic rollback on error
  * Ready for fresh session creation without affecting legacy Islamic content

**Files**: 2 modified (ncdeploy.ps1, Scripts/TruncateCanvasSessions.sql) | **Tests**: Pending manual validation | **Build**: N/A
**Next**: Test deployment script, validate canvas.Sessions truncation in production
---

## Migration Results
```
KSESSIONS CANVAS MIGRATION SCRIPT v2.0.0
Execution ID: 0F48F640-0530-4FA9-9891-64A374289441
Duration: 0 seconds
Warnings: 0
Errors: 0

FINAL DATA COUNTS:
  AssetLookup: 11 records
  Sessions: 6 records
  Participants: 3 records
  SessionData: 0 records

DATA INTEGRITY:
  ✅ No orphaned participants
  ✅ No orphaned session data
  ✅ No duplicate host tokens
  ✅ No duplicate user tokens
```

## Environment Configuration

### Development Mode
- **Database**: KSESSIONS_DEV
- **Server**: AHHOME
- **Info Panel**: DebugPanel (with debug controls + database info)
- **Connection String**: Defined in appsettings.json

### Production Mode
- **Database**: KSESSIONS
- **Server**: AHHOME
- **Info Panel**: ProductionInfoPanel (database info only, no debug controls)
- **Connection String**: Defined in appsettings.Production.json (overrides base settings)
- **Web.config Transform**: web.Release.config applies KSESSIONS connection strings

## Dependencies
- canvas schema tables must exist in KSESSIONS database
- Migration script is idempotent (safe to re-run)
- IDevModeService must be registered in DI container
- Configuration service required for connection string parsing

## Known Issues
None

## Next Steps
1. Deploy application to IIS with Production configuration
2. Validate KSESSIONS database connectivity
3. Verify ProductionInfoPanel displays correct database name
4. Test canvas functionality with production data
5. Monitor application logs for database connection issues
