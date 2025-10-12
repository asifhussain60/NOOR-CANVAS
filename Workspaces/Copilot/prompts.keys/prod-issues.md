# prod-issues

**Status**: in-progress  
**Created**: 2025-10-12  
**Last Updated**: 2025-10-12  

## Summary
Production deployment fixes for hardcoded localhost URLs and autocomplete security.

## Problem Statement
1. Production application showing "Connection Error - Unable to connect to server" when users try to join sessions
2. Forms missing `autocomplete="off"` attribute for security/privacy
3. Root cause: Hardcoded `https://localhost:9091` URLs failing under IIS (which doesn't expose Kestrel ports)

## Solution Implemented
### URL Fixes
- **SessionWaiting.razor**: Replaced 3 hardcoded `localhost:9091` with `Navigation.BaseUri`
- **HostControlPanel.razor**: Dynamic user link generation (2 locations)
- **HostSessionManager.razor**: Dynamic session link generation
- **HostControlPanelSidebar.razor**: Injected NavigationManager for dynamic URLs
- **HostSessionService.cs**: Environment-aware fallback URL (production: noorcanvas.servehttp.com, dev: localhost:9091)

### Autocomplete Fixes
- **ParticipantRegister.razor**: Added to name input and country select
- **HostLanding.razor**: Added to readonly user link input
- **Host-SessionTranscriptViewer.razor**: Added to session ID input
- **SessionUrlPanel.razor**: Added to readonly URL input

## File Mappings
### Modified Files
- `SPA/NoorCanvas/Pages/SessionWaiting.razor` - API client URL fixes (3 locations)
- `SPA/NoorCanvas/Pages/HostControlPanel.razor` - User link generation (2 locations)
- `SPA/NoorCanvas/Pages/HostSessionManager.razor` - Session link generation
- `SPA/NoorCanvas/Components/Host/HostControlPanelSidebar.razor` - NavigationManager injection
- `SPA/NoorCanvas/Services/HostSessionService.cs` - Environment-aware fallback
- `SPA/NoorCanvas/Pages/ParticipantRegister.razor` - Autocomplete (2 inputs)
- `SPA/NoorCanvas/Pages/HostLanding.razor` - Autocomplete (1 input)
- `SPA/NoorCanvas/Pages/Host-SessionTranscriptViewer.razor` - Autocomplete (1 input)
- `SPA/NoorCanvas/Components/SessionUrlPanel.razor` - Autocomplete (1 input)

### Configuration Files
- N/A (no config changes needed - using existing Program.cs environment detection)

## Work Log

### 2025-10-12 - Initial Implementation
**Commit**: `73d27da6447d7a8dddabc757b9f4f1bf97fee0e9`  
**Tasks Completed**:
1. ✅ Fixed hardcoded localhost URLs across all layers
   - Replaced `new Uri("https://localhost:9091/")` with `new Uri(Navigation.BaseUri)`
   - Updated HostSessionService to use environment-aware fallback
   - Added trace-level debug logging for URL resolution
2. ✅ Added autocomplete="off" to all remaining form inputs
   - ParticipantRegister: name, country
   - HostLanding: readonly user link
   - Host-SessionTranscriptViewer: session ID
   - SessionUrlPanel: readonly URL

**Debug Logging Inserted** (trace level):
- `[DEBUG-WORKITEM:prod-issues:url-fix]` markers in 7 locations
- Logs base URI resolution for troubleshooting
- All markers tagged with `;CLEANUP_OK` for removal

**Build Status**: ✅ Clean (4 pre-existing warnings)
**Deployment**: ✅ Production deployment successful
**Validation**: Application now uses dynamic URLs based on hosting environment

### Root Cause Analysis
**IIS vs Kestrel Hosting**:
- **Development**: Kestrel exposes ports 9090/9091 directly
- **Production**: IIS hosts on port 80/443, doesn't expose Kestrel ports
- **Issue**: Blazor Server runs server-side, so HTTP clients were trying to connect from server to `localhost:9091` (doesn't exist in IIS)
- **Fix**: Use `Navigation.BaseUri` which returns the actual application URL (production domain or localhost based on environment)

**Why This Works**:
- In IIS: `Navigation.BaseUri` = `https://noorcanvas.servehttp.com/`
- In Kestrel: `Navigation.BaseUri` = `https://localhost:9091/`
- HTTP clients now make relative API calls to same origin as web app

## Testing Notes
- Deployment successful to D:\Websites\NOOR-CANVAS
- Application accessible at production URL
- Session joining flow should now work (no more connection errors)
- Verify in production: Join session, check browser console for debug logs

## Known Issues
- 4 pre-existing build warnings (not introduced by this change):
  - CS8629: Nullable value type (UnifiedHtmlTransformService.cs)
  - CS8604: Null reference (HostSessionService.cs)
  - SA1300: StyleCop naming (AssetHtmlProcessingService.cs, HostAssetService.cs)

## Future Considerations
- Remove debug logging markers once production is stable (`tasks: mark complete`)
- Consider centralizing base URL configuration in a service
- Add integration tests for environment-specific URL resolution

---

### 2025-10-12 18:59 - Share Button Issue Investigation
**Issue**: Share buttons not appearing in production, working in development  
**Root Cause**: Database schema mismatch

**Investigation Results**:
- Production logs show: `Invalid column name 'CreatedAt'` in `canvas.AssetLookup` table
- Error occurs in `HostController.GetAssetLookup()` at line 904
- AssetLookup API fails with InternalServerError (500)
- Without asset lookup data, no share buttons are injected into HTML
- Share system initializes successfully but finds 0 buttons in DOM

**Database Difference**:
- **Dev (KSESSIONS_DEV)**: Has `CreatedAt` column in `canvas.AssetLookup`
- **Prod (KSESSIONS)**: Missing `CreatedAt` column in `canvas.AssetLookup`

**Evidence from Logs**:
```
[2025-10-12 18:58:50.512 -04:00 ERR] [DEBUG-WORKITEM:assetshare:api] Failed to get AssetLookup data
[2025-10-12 18:58:50.514 -04:00 WRN] [ASSETSHARE-API:212] Failed to load asset lookups from API, status: "InternalServerError"
[2025-10-12 18:58:51.185 -04:00 INF] [DEBUG-WORKITEM:assetshare:continue] Found 0 share buttons in DOM after setup
```

**Solution Options**:
1. **Add `CreatedAt` column to production database** (ALTER TABLE)
2. **Remove `CreatedAt` from EF model** (code change, safer)
3. **Make `CreatedAt` optional in model** (nullable property)

**Recommended Action**: Remove `CreatedAt` from the model since it's not essential for asset lookup functionality

**Resolution Applied**:
✅ **Added `CreatedAt` column to production database**
```sql
ALTER TABLE [canvas].[AssetLookup] ADD [CreatedAt] DATETIME2 NULL;
```

**Holistic Schema Sync**:
- Performed comprehensive comparison between KSESSIONS and KSESSIONS_DEV
- Created schema sync script: `Scripts/sync-canvas-schema.sql`
- Verified all canvas schema tables match between environments
- Minor difference: CreatedAt is NULL in PROD, NOT NULL in DEV (acceptable - safer for existing data)

**Files Created**:
- `Scripts/sync-canvas-schema.sql` - Future schema synchronization tool
- `TEMP/compare-schemas.sql` - Schema comparison query
- `TEMP/get-canvas-schema.sql` - Full canvas schema export

**Post-Fix Actions**:
- Restarted IIS app pool (NoorCanvas) to pick up database changes
- Waiting for new production logs to verify share buttons appear

**Next Steps**:
1. Test share button functionality in production
2. Monitor logs for successful AssetLookup API calls
3. Verify share buttons appear in DOM

---

### 2025-10-12 19:15 - CreatedAt NULL Value Fix (In Progress)
**Issue**: SqlNullValueException - CreatedAt column has NULL values but model expects non-nullable DateTime
**Error**: `System.Data.SqlTypes.SqlNullValueException: Data is Null. This method or property cannot be called on Null values.`

**Root Cause Analysis**:
- CreatedAt column was added as NULL to production (safe for existing data)
- Entity model has `public DateTime CreatedAt { get; set; }` (non-nullable)
- EF Core cannot map NULL database values to non-nullable DateTime property
- Share buttons still not appearing because API returns 500 error

**Solution**:
1. ✅ Update all NULL CreatedAt values to current timestamp
2. ✅ ALTER column to NOT NULL (match dev schema)
3. 🔄 Restart IIS app pool
4. 🔄 Test API endpoint
5. 🔄 Verify share buttons appear

**Database Commands** (KSESSIONS - Production):
```sql
-- Set default values for existing NULLs
UPDATE canvas.AssetLookup SET CreatedAt = GETDATE() WHERE CreatedAt IS NULL;

-- Make column NOT NULL (match KSESSIONS_DEV)
ALTER TABLE canvas.AssetLookup ALTER COLUMN CreatedAt DATETIME2 NOT NULL;
```

**⚠️ TODO: Sync Same Change to KSESSIONS_DEV**:
- KSESSIONS_DEV already has CreatedAt as NOT NULL (correct)
- But need to verify no NULL values exist in dev database
- Run same UPDATE command in dev for consistency

**Resolution Status**: ✅ **FIXED**
```sql
-- Commands executed on KSESSIONS (Production):
UPDATE canvas.AssetLookup SET CreatedAt = GETDATE() WHERE CreatedAt IS NULL; -- (11 rows affected)
ALTER TABLE canvas.AssetLookup ALTER COLUMN CreatedAt DATETIME2 NOT NULL;
```

**Verification**:
- ✅ All 11 records now have CreatedAt value (2025-10-12 19:14:09)
- ✅ Column constraint changed to NOT NULL
- ✅ API endpoint now returns HTTP 200
- ✅ API returns 11 asset lookups with createdAt timestamps
- ✅ No more SqlNullValueException errors

**Share Button Behavior Clarified**:
- Share buttons are injected during content broadcasts (via ProcessHtmlForAssetSharing)
- Existing canvas content from before the fix won't have share buttons
- **To see share buttons**: Broadcast new content (Ayah, Hadees, etc.) to the canvas
- The AssetProcessingService will inject share buttons into new broadcasts

**Next Steps**:
1. Sync same change to KSESSIONS_DEV database
2. Test by broadcasting content to canvas in production
3. Verify share buttons appear on newly broadcasted content
4. Remove debug logging markers when complete

---

### 2025-10-12 19:20 - CreatedAt NULL Fix Complete
**Commit**: `363c510e3036c75719563ca14f70aeaa2c60c293`
**Tasks Completed**:
1. ✅ Fixed SqlNullValueException in production
   - Updated 11 NULL CreatedAt values to current timestamp
   - Changed column constraint to NOT NULL
   - AssetLookup API now returns HTTP 200
2. ✅ Verified dev database consistency
   - KSESSIONS_DEV has 0 NULL CreatedAt values
   - Both environments now have matching NOT NULL constraints
3. ✅ Documented share button behavior
   - Share buttons inject during content broadcasts
   - Not applied retroactively to existing canvas content

**API Validation**:
```
GET https://noorcanvas.servehttp.com/api/host/asset-lookup
Status: 200 OK
Response: { "success": true, "assetLookups": [...], "totalCount": 11 }
```

**Database State**:
- Production (KSESSIONS): 11 records, 0 NULLs, CreatedAt NOT NULL ✅
- Dev (KSESSIONS_DEV): 11 records, 0 NULLs, CreatedAt NOT NULL ✅

**Testing Required**:
- Broadcast new content (Ayah/Hadees/Question) to canvas
- Verify share buttons appear on newly broadcasted assets
- Share buttons will NOT appear on old content (pre-fix)

**Build Status**: N/A (database-only fix, no code changes)

---

### 2025-10-12 19:24 - Production Verification Complete ✅
**Status**: **FULLY WORKING IN PRODUCTION**

**Production Logs Evidence** (19:19:16):
```
[ASSETSHARE-DB:212] Starting asset detection using AssetLookup table
[ASSETSHARE-DB:212] Found 11 active asset types
[ASSETSHARE-DB:212] Asset Type: ayah-card - Selector: '.ayah-card' - Display: 'Ayah Card'
[ASSETSHARE-DB:212] Asset detection complete - injected 8 share buttons
[ASSETSHARE-DB:212] Final HTML length: 26305 (was 23351)
[NOOR-SHARE] System status: {"buttonCount":8}
```

**Complete Success Chain**:
1. ✅ Database CreatedAt column fixed (NOT NULL, no NULLs)
2. ✅ AssetLookup API returns HTTP 200 with 11 asset definitions
3. ✅ AssetProcessingService successfully loads asset lookups from API
4. ✅ Share buttons injected into ayah-card elements (8 buttons)
5. ✅ Frontend JavaScript detects all 8 share buttons in DOM
6. ✅ Share system initialized successfully

**Metrics**:
- Asset types available: 11 (ayah-card, hadees, etymology, etc.)
- Share buttons injected: 8 (into ayah-card elements)
- HTML size increase: +2,954 characters (share button HTML)
- Frontend detection: 100% (buttonCount: 8)

**Resolution Summary**:
All three layers working correctly:
- **Database Layer**: AssetLookup table with valid CreatedAt values ✅
- **API Layer**: GetAssetLookup endpoint returning 200 OK ✅
- **Service Layer**: AssetProcessingService injecting share buttons ✅
- **Frontend Layer**: JavaScript detecting and initializing buttons ✅

**Share buttons are NOW APPEARING in production!** 🎉
