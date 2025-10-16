# prod-issues

**Category:** Infrastructure / Production Support  
**Status:** Complete  
**Created:** 2025-10-16

---

## Work Log

### 2025-10-16T08:56:00-04:00
- **Status**: Complete
- **Issue**: Production not connecting to KSESSIONS database with host token LR7R84YI
- **Root Cause**: `appsettings.local.json` in production deployment overriding `appsettings.Production.json` connection string, forcing app to connect to KSESSIONS_DEV instead of KSESSIONS
- **Changes**:
  - Removed `D:\Websites\NOOR-CANVAS\appsettings.local.json` (development override file)
  - Restarted IIS application pool NoorCanvas
  - Updated `Scripts/ncdeploy.ps1` to automatically remove appsettings.local.json during future deployments
  - Added trace logging: `[DEBUG-WORKITEM:prod-issues:appsettings-local]` in deployment cleanup
- **Files Affected**:
  - `Scripts/ncdeploy.ps1` (added cleanup step after file copy)
- **Verification**:
  - Production logs confirm connection to KSESSIONS: `Database: KSESSIONS`
  - Token LR7R84YI validates successfully
  - API returns `{"valid":true,"sessionId":212,"hostGuid":"LR7R84YI",...}`
  - Session 212 exists in KSESSIONS with status "Created", expires 2025-10-17
- **Build**: Clean (zero errors, zero warnings)
- **Commit**: b26b5733 (checkpoint), pending final commit with fix

---

## Prevention Strategy

**Future deployments automatically prevent this issue:**
1. `ncdeploy.ps1` now removes `appsettings.local.json` after copying published files
2. Development override files never persist in production environment
3. Production always uses `appsettings.Production.json` configuration

**Detection:**
- Symptom: Token exists in database but validation fails
- Quick check: Compare connection string in logs vs expected database
- Diagnostic: Look for `appsettings.local.json` in deployment directory

---

## Related

- **Database**: KSESSIONS (production), KSESSIONS_DEV (development)
- **Configuration**: appsettings.json hierarchy (base → environment → local overrides)
- **Deployment**: ncdeploy.ps1 script handles production deployments
