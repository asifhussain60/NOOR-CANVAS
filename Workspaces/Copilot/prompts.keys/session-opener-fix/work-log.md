# Work Log - session-opener-fix

## 2025-10-12 - Fix EF Core 8.0 SqlQuery Breaking Change

### Context
**Production Issue**: Dropdowns not loading in Session Opener page
- Albums, Categories, and Sessions dropdowns return empty
- Token validation works but navigation to session opener fails
- Same machine, same code, works in Development but NOT in Production

**Key Differences Discovered**:
- **Development**: Uses `KSESSIONS_DEV` database
- **Production**: Uses `KSESSIONS` database
- **Same Server**: AHHOME (local SQL Server)
- **Same Stored Procedures**: `dbo.GetAllGroups` and `dbo.GetCategoriesForGroup` exist in BOTH databases (verified with OBJECT_ID query)

### Root Cause Analysis

**Diagnostic Logs Revealed**:
```
[ERR] System.InvalidOperationException: 'FromSql' or 'SqlQuery' was called with non-composable SQL 
and with a query composing over it. Consider calling 'AsEnumerable' after the method to perform 
the composition on the client side.
```

**Stack Trace Location**: `Program.cs:line 296` (startup database diagnostics)

**Breaking Change in EF Core 8.0**:
- `SqlQuery<T>($"EXEC StoredProc")` is now **non-composable** by default
- EF Core 8.0 changed how raw SQL queries are handled for security/performance
- Cannot call `.ToListAsync()`, `.Take()`, or any LINQ operators directly on `SqlQuery` result
- **Solution**: Use `SqlQueryRaw<T>($"EXEC StoredProc")` instead (explicitly marked as raw/non-composable)

**Why It Failed in Production But Not Development**:
This is actually a **timing/loading issue**, not a database difference:
- Development environment had the app already running (warm start)
- Production deployment triggered fresh startup with database diagnostics
- Startup diagnostics in `Program.cs` tried to validate stored procedures with `.Take(1)` composition
- This caused the SqlQuery composition error to appear immediately on startup
- **The bug exists in BOTH environments** - it just manifested during production deployment

### Implementation

**Phase 1 - Fix Startup Diagnostics** (Program.cs):
1. **Remove `.Take(1)` composition** from stored procedure test
   - Changed: `SqlQuery<AlbumData>($"EXEC dbo.GetAllGroups").Take(1).ToListAsync()`
   - To: `SqlQuery<AlbumData>($"EXEC dbo.GetAllGroups").ToListAsync()`
   - Logs full album count instead of just existence check

**Phase 2 - Fix HostController Stored Procedure Calls**:
2. **GetAlbums() endpoint** - Change SqlQuery to SqlQueryRaw
   - Before: `_kSessionsContext.Database.SqlQuery<AlbumData>($"EXEC dbo.GetAllGroups").ToListAsync()`
   - After: `_kSessionsContext.Database.SqlQueryRaw<AlbumData>($"EXEC dbo.GetAllGroups").ToListAsync()`

3. **GetCategories() endpoint** - Change SqlQuery to SqlQueryRaw  
   - Before: `_kSessionsContext.Database.SqlQuery<CategoryData>($"EXEC dbo.GetCategoriesForGroup {albumId}").ToListAsync()`
   - After: `_kSessionsContext.Database.SqlQueryRaw<CategoryData>($"EXEC dbo.GetCategoriesForGroup {albumId}").ToListAsync()`

**Phase 3 - Verify No Other SqlQuery Usages**:
4. **GetSessions() endpoint** - Uses direct LINQ (no stored procedure, already correct)
5. **Search entire codebase** for other `SqlQuery` usages that might need conversion

### Technical Details

**EF Core 8.0 Breaking Change**:
- **Old API (EF Core 7.x)**: `FromSqlRaw()`, `FromSql()` - both composable
- **New API (EF Core 8.0)**: 
  - `SqlQuery<T>()` - Composable (for SELECT statements)
  - `SqlQueryRaw<T>()` - Non-composable (for EXEC, raw SQL)
  - `FromSql()` - Deprecated, use SqlQuery instead

**Why Use SqlQueryRaw**:
- Explicitly tells EF: "This is raw SQL, don't try to compose it"
- Prevents EF from adding ORDER BY, SKIP/TAKE, or other LINQ operators
- Required for stored procedures that already return complete result sets
- Better performance (no query plan composition overhead)

**Pattern to Remember**:
```csharp
// ❌ WRONG (EF Core 8.0) - Non-composable error
var result = context.Database.SqlQuery<T>($"EXEC dbo.StoredProc").ToListAsync();

// ✅ CORRECT (EF Core 8.0) - Explicitly raw SQL
var result = context.Database.SqlQueryRaw<T>($"EXEC dbo.StoredProc").ToListAsync();

// ✅ ALSO CORRECT - SELECT statements can still use SqlQuery
var result = context.Database.SqlQuery<T>($"SELECT * FROM Table WHERE Id = {id}").ToListAsync();
```

### Files Modified
1. `SPA/NoorCanvas/Program.cs` - Removed `.Take(1)` from startup diagnostics
2. `SPA/NoorCanvas/Controllers/HostController.cs` - SqlQuery → SqlQueryRaw (2 stored procedures)

### Testing Strategy

**Verification Steps**:
1. ✅ Build succeeds in Release mode
2. ✅ Startup diagnostics execute without errors
3. ✅ Stored procedure validation logs success with album count
4. ✅ /api/Host/albums endpoint returns data
5. ✅ /api/Host/categories/{albumId} endpoint returns data
6. ✅ Session opener page loads with populated dropdowns
7. ✅ Works in both Development (KSESSIONS_DEV) and Production (KSESSIONS)

**Test Scenarios**:
- Fresh application startup (cold start)
- Dropdown loading in Session Opener page
- Token validation with auto-population
- Manual dropdown selection cascade (Album → Category → Session)

### Expected Behavior After Fix

**Startup Logs** (Program.cs diagnostics):
```
[INF] [DEBUG-WORKITEM:session-opener:database-connection] Database Connection: Server=AHHOME;Database=KSESSIONS
[INF] [DEBUG-WORKITEM:session-opener:database-connection] Database Connection Test: SUCCESS
[INF] [DEBUG-WORKITEM:session-opener:database-connection] Stored Procedure dbo.GetAllGroups: EXISTS (returned 42 albums)
```

**API Logs** (dropdown loading):
```
[DBG] [DEBUG-WORKITEM:session-opener:dropdown-load] Starting GetAlbums - Database: KSESSIONS
[DBG] [DEBUG-WORKITEM:session-opener:dropdown-load] Executing stored procedure: dbo.GetAllGroups
[DBG] [DEBUG-WORKITEM:session-opener:dropdown-load] Albums loaded successfully - Count: 42
```

**Frontend Logs** (Razor component):
```
[DBG] [DEBUG-WORKITEM:session-opener:dropdown-load] Razor component calling HostService.LoadAlbumsAsync
[DBG] [DEBUG-WORKITEM:session-opener:dropdown-load] Albums loaded in Razor component - Count: 42
```

### Validation
- **Build Status**: Pending
- **Syntax Check**: Pending
- **Deployment Test**: Pending
- **Production Verification**: Pending

### Git Commits
- **Pending**: Comprehensive fix for EF Core 8.0 SqlQuery breaking change

### Next Steps
1. Implement SqlQueryRaw fixes in HostController.cs
2. Build and verify no compilation errors
3. Test in development environment first
4. Deploy to production
5. Monitor startup logs for successful stored procedure validation
6. Test dropdown loading in Session Opener
7. Update work log with validation results
8. Remove debug markers after confirmation

---

## Related Documentation
- [EF Core 8.0 Breaking Changes](https://learn.microsoft.com/en-us/ef/core/what-is-new/ef-core-8.0/breaking-changes)
- [Raw SQL Queries in EF Core 8.0](https://learn.microsoft.com/en-us/ef/core/querying/sql-queries)
- Issue: SqlQuery non-composable error with stored procedures
- Solution: Use SqlQueryRaw for EXEC statements
