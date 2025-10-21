# Production Issues Resolution - Share Buttons Fix

**Date**: 2025-10-12  
**Key**: prod-issues  
**Status**: Resolved  

## Summary

Share buttons were not appearing in production despite working in development. Root cause was a database schema mismatch between KSESSIONS_DEV and KSESSIONS databases.

## Issues Resolved

### 1. Hardcoded localhost URLs (Initial Issue)
**Problem**: Application used `https://localhost:9091` URLs that don't exist under IIS  
**Solution**: Changed to dynamic `Navigation.BaseUri` across 6 files  
**Status**: ✅ Fixed and deployed

### 2. Share Buttons Not Appearing (New Issue)
**Problem**: AssetLookup API failing with "Invalid column name 'CreatedAt'"  
**Root Cause**: Production database missing `CreatedAt` column in `canvas.AssetLookup` table  
**Solution**: Added column to production database  
**Status**: ✅ Fixed

## Technical Details

### Database Schema Mismatch

**Error in Production**:
```
Microsoft.Data.SqlClient.SqlException (0x80131904): Invalid column name 'CreatedAt'.
SELECT [a].[AssetId], [a].[AssetIdentifier], [a].[AssetType], [a].[CssSelector], 
       [a].[DisplayName], [a].[IsActive], [a].[CreatedAt]
FROM [canvas].[AssetLookup] AS [a]
```

**Impact Chain**:
1. AssetLookup API returns 500 Internal Server Error
2. AssetProcessingService can't load asset metadata
3. Share buttons not injected into HTML
4. JavaScript finds 0 buttons in DOM

**Fix Applied**:
```sql
ALTER TABLE [canvas].[AssetLookup] ADD [CreatedAt] DATETIME2 NULL;
```

### Why It Worked in Dev But Not Prod

- **Same code deployed** to both environments ✅
- **Different database schemas** ❌
  - KSESSIONS_DEV: Had `CreatedAt` column
  - KSESSIONS: Missing `CreatedAt` column

## Files Modified

### Code Changes (First Issue)
- `SPA/NoorCanvas/Pages/SessionWaiting.razor` - 3 URL fixes
- `SPA/NoorCanvas/Pages/HostControlPanel.razor` - 2 URL fixes  
- `SPA/NoorCanvas/Pages/HostSessionManager.razor` - 1 URL fix
- `SPA/NoorCanvas/Components/Host/HostControlPanelSidebar.razor` - NavigationManager injection
- `SPA/NoorCanvas/Services/HostSessionService.cs` - Environment-aware fallback
- `SPA/NoorCanvas/Pages/ParticipantRegister.razor` - Autocomplete
- `SPA/NoorCanvas/Pages/HostLanding.razor` - Autocomplete
- `SPA/NoorCanvas/Pages/Host-SessionTranscriptViewer.razor` - Autocomplete
- `SPA/NoorCanvas/Components/SessionUrlPanel.razor` - Autocomplete

### Database Changes (Second Issue)
- Production database: Added `CreatedAt` column to `canvas.AssetLookup`

### New Tools Created
- `Scripts/sync-canvas-schema.sql` - Automated schema synchronization script
- `TEMP/compare-schemas.sql` - Schema comparison query
- `TEMP/get-canvas-schema.sql` - Full schema export query

## Verification Steps

### Immediate Verification
```powershell
# Check column exists
sqlcmd -S AHHOME -d KSESSIONS -E -Q "SELECT c.name FROM sys.columns c INNER JOIN sys.tables t ON c.object_id = t.object_id WHERE t.name = 'AssetLookup' AND c.name = 'CreatedAt';"

# Restart IIS app pool
Stop-WebAppPool -Name "NoorCanvas"
Start-WebAppPool -Name "NoorCanvas"
```

### Production Testing
1. Navigate to production HostControlPanel
2. Start a session
3. Verify share buttons appear for assets (Hadees, Ayahs, etc.)
4. Check logs for successful AssetLookup API calls (no more "Invalid column" errors)

## Commits

1. **73d27da6** - Fixed hardcoded localhost URLs + autocomplete
2. **d3288d4c** - Added CreatedAt column + schema sync tools

## Lessons Learned

1. **Always sync database schemas** between dev and prod
2. **Schema changes need deployment scripts** - created `sync-canvas-schema.sql`
3. **Database differences can cause identical code to fail** 
4. **Comprehensive logging revealed root cause** - checked production logs
5. **Environment-specific issues require environment comparison** - not just code review

## Future Prevention

1. Use `sync-canvas-schema.sql` before deployments
2. Add schema validation to deployment checklist
3. Consider EF Core migrations for schema changes
4. Monitor for "Invalid column name" errors in production logs
5. Document all schema changes in deployment notes

## References

- Production logs: `D:\Websites\NOOR-CANVAS\logs\noor-canvas-prod-20251012.txt`
- Key documentation: `Workspaces/Copilot/prompts.keys/prod-issues.md`
- Schema sync script: `Scripts/sync-canvas-schema.sql`
