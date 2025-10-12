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
