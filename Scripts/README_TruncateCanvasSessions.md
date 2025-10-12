# TruncateCanvasSessions.sql - Safe Canvas Schema Reset

## Overview

This script safely truncates the `canvas.Sessions` table and its dependent child tables in the **KSESSIONS** (production) database without affecting the `dbo` schema or any legacy Islamic content data.

## Purpose

Use this script when you need to:
- Start fresh with canvas sessions in production
- Clear all session data without affecting dbo tables
- Reset the canvas schema to empty state
- Prepare for new session creation after deployment

## Database Context

- **Target Database**: `KSESSIONS` (Production)
- **Server**: `AHHOME`
- **Schema**: `canvas` only
- **Protected Schemas**: `dbo` (READ-ONLY, never modified)

## What Gets Truncated

### Tables Affected (canvas schema only):
1. **canvas.SessionData** - All session-specific data (questions, annotations, etc.)
2. **canvas.Participants** - All session participants
3. **canvas.Sessions** - All canvas sessions

### Tables Preserved:
- **canvas.AssetLookup** - Asset mapping reference (no FK dependency on Sessions)
- **dbo.*** - All dbo schema tables remain untouched (Sessions, Groups, Categories, Speakers, etc.)

## Safety Features

### 1. Database Validation
- Confirms execution against KSESSIONS database
- Prevents accidental execution on KSESSIONS_DEV or other databases

### 2. CASCADE DELETE Verification
- Validates foreign keys have CASCADE DELETE configured:
  - `FK_Participants_Sessions_SessionId`
  - `FK_SessionData_Sessions_SessionId`
- Halts execution if CASCADE DELETE not configured

### 3. dbo Schema Isolation Check
- Verifies no foreign keys from dbo schema to canvas.Sessions
- Confirms safe truncation without affecting legacy content
- Lists any canvas → dbo references (expected and safe)

### 4. Transaction Safety
- All operations wrapped in transaction
- Automatic rollback on error
- No partial truncation possible

### 5. Comprehensive Reporting
- Before/after data counts
- Verification that dbo.Sessions unchanged
- Detailed error messages on failure

## Usage

### Prerequisites
1. CASCADE DELETE must be configured on canvas foreign keys
   - Run `KSESSIONS_DDL_Migration_20251012.sql` first if needed
2. SQL Server Management Studio or sqlcmd access
3. Appropriate permissions on KSESSIONS database

### Execution

#### Option 1: SQL Server Management Studio (SSMS)
```sql
-- 1. Open TruncateCanvasSessions.sql in SSMS
-- 2. Ensure "KSESSIONS" is selected in database dropdown
-- 3. Execute (F5)
```

#### Option 2: sqlcmd Command Line
```powershell
sqlcmd -S AHHOME -d KSESSIONS -i "d:\PROJECTS\NOOR CANVAS\Scripts\TruncateCanvasSessions.sql"
```

#### Option 3: PowerShell
```powershell
$scriptPath = "d:\PROJECTS\NOOR CANVAS\Scripts\TruncateCanvasSessions.sql"
Invoke-Sqlcmd -ServerInstance "AHHOME" -Database "KSESSIONS" -InputFile $scriptPath -Verbose
```

## Expected Output

### Success Output:
```
========================================
Truncate canvas.Sessions - Fresh Start
========================================

✅ Database context: KSESSIONS (Production)

✅ canvas schema exists

✅ canvas.Sessions table exists

Current data counts (BEFORE truncation):
----------------------------------------
  canvas.Sessions: 6 records
  canvas.Participants: 3 records
  canvas.SessionData: 0 records
  canvas.AssetLookup: 11 records

Validating CASCADE DELETE configuration:
----------------------------------------
  ✅ canvas.Participants → canvas.Sessions (ON DELETE CASCADE)
  ✅ canvas.SessionData → canvas.Sessions (ON DELETE CASCADE)

Safety check: Ensuring dbo schema isolation:
---------------------------------------------
  ✅ No foreign keys from dbo schema to canvas.Sessions

  ℹ️  canvas schema references dbo schema (expected - read-only references)

✅ Safety check passed: dbo schema will NOT be affected

Executing truncation:
--------------------
  ✅ Truncated canvas.SessionData
  ✅ Truncated canvas.Participants
  ✅ Truncated canvas.Sessions
  ℹ️  canvas.AssetLookup retained (no dependency on Sessions)

✅ Truncation successful!

Final data counts (AFTER truncation):
-------------------------------------
  canvas.Sessions: 0 records
  canvas.Participants: 0 records
  canvas.SessionData: 0 records
  canvas.AssetLookup: 11 records (unchanged)

Verifying dbo schema integrity:
-------------------------------
  dbo.Sessions: 1234 records (unchanged)
  ✅ dbo schema NOT affected

========================================
canvas.Sessions truncation complete!
Ready for fresh session creation.
========================================
```

### Error Scenarios:

#### Wrong Database:
```
ERROR: This script must run against KSESSIONS database. Current database: KSESSIONS_DEV
```
**Solution**: Change database context to KSESSIONS

#### Missing CASCADE DELETE:
```
❌ ERROR: FK_Participants_Sessions_SessionId does not have CASCADE DELETE
ERROR: CASCADE DELETE not configured correctly. Run KSESSIONS_DDL_Migration_20251012.sql first.
```
**Solution**: Run KSESSIONS_DDL_Migration_20251012.sql to configure CASCADE DELETE

#### Schema Not Found:
```
ERROR: canvas schema does not exist in KSESSIONS database
```
**Solution**: Run KSESSIONS_Canvas_Migration_Script.sql to create canvas schema

## Post-Execution Verification

After running the script, verify:

1. **canvas tables are empty**:
   ```sql
   SELECT COUNT(*) FROM canvas.Sessions;       -- Should be 0
   SELECT COUNT(*) FROM canvas.Participants;   -- Should be 0
   SELECT COUNT(*) FROM canvas.SessionData;    -- Should be 0
   ```

2. **canvas.AssetLookup preserved**:
   ```sql
   SELECT COUNT(*) FROM canvas.AssetLookup;    -- Should be unchanged (e.g., 11)
   ```

3. **dbo schema untouched**:
   ```sql
   SELECT COUNT(*) FROM dbo.Sessions;          -- Should be unchanged (e.g., 1234)
   SELECT COUNT(*) FROM dbo.Groups;            -- Should be unchanged
   SELECT COUNT(*) FROM dbo.Categories;        -- Should be unchanged
   ```

## When to Use This Script

### ✅ Appropriate Use Cases:
- After deploying new version to production
- When testing new canvas features from scratch
- Clearing out test/demo sessions
- Resetting production canvas data without affecting legacy content
- Preparing for major canvas feature updates

### ❌ Do NOT Use When:
- You need to preserve existing canvas sessions
- Running on KSESSIONS_DEV (use canvas.CleanCanvas stored procedure instead)
- Unsure about CASCADE DELETE configuration (validate first)
- Production sessions contain valuable user data that must be preserved

## Related Scripts

- **KSESSIONS_Canvas_Migration_Script.sql** - Initial canvas schema creation and data migration
- **KSESSIONS_DDL_Migration_20251012.sql** - CASCADE DELETE configuration validation
- **canvas.CleanCanvas.sql** - Development canvas cleanup (KSESSIONS_DEV only)

## Maintenance

This script is designed to be:
- **Idempotent**: Safe to run multiple times
- **Self-documenting**: Comprehensive output messages
- **Fail-safe**: Transaction-protected with rollback on error
- **Production-safe**: Extensive validation before modification

## Support

For issues or questions:
1. Check error messages for specific failure reasons
2. Verify database context (must be KSESSIONS)
3. Ensure CASCADE DELETE configured (run DDL migration script)
4. Review safety check output for any schema conflicts

---

**Version**: 1.0.0  
**Last Updated**: 2025-10-12  
**Author**: GitHub Copilot  
**Database**: KSESSIONS (Production)
