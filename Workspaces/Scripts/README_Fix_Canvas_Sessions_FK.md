# Fix canvas.Sessions.SessionId Schema - README

## Overview

This script fixes a fundamental schema design issue where `canvas.Sessions.SessionId` was incorrectly defined as an auto-incrementing IDENTITY column. It should actually be a foreign key referencing `dbo.Sessions.SessionID` (Islamic learning sessions from the legacy database).

## Problem Statement

**Original (Incorrect) Schema:**
```sql
CREATE TABLE canvas.Sessions (
    SessionId BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    -- ... other columns
);
```

**Issues:**
- SessionId was auto-generated (IDENTITY)
- Used BIGINT instead of INT
- No relationship to `dbo.Sessions.SessionID`
- HostProvisioner tool couldn't insert specific SessionId values

**Correct Schema:**
```sql
CREATE TABLE canvas.Sessions (
    SessionId INT NOT NULL PRIMARY KEY,
    -- ... other columns
    CONSTRAINT FK_canvas_Sessions_dbo_Sessions 
        FOREIGN KEY (SessionId) REFERENCES dbo.Sessions(SessionID)
);
```

**Fixes:**
- SessionId is now INT (matches `dbo.Sessions.SessionID` type)
- No IDENTITY - allows explicit SessionId values
- Foreign key ensures referential integrity with Islamic learning sessions
- HostProvisioner can now provision sessions by SessionID

## What This Script Does

1. **Validates environment** - Confirms canvas and dbo schemas exist
2. **Checks existing data** - Verifies all SessionId values reference valid `dbo.Sessions.SessionID`
3. **Drops dependent FKs** - Temporarily removes FKs from Participants and SessionData
4. **Rebuilds canvas.Sessions** - Creates new table without IDENTITY, adds FK to dbo.Sessions
5. **Migrates data** - Copies existing records (converts BIGINT→INT)
6. **Recreates dependent FKs** - Restores Participants and SessionData foreign keys
7. **Verifies schema** - Confirms SessionId is no longer IDENTITY and FK exists

## Prerequisites

- SQL Server access to KSESSIONS_DEV or KSESSIONS databases
- **IMPORTANT**: All existing `canvas.Sessions.SessionId` values MUST exist in `dbo.Sessions.SessionID`
- CASCADE DELETE must already be configured on dependent tables (use `KSESSIONS_DDL_Migration_20251012.sql` if needed)

## Execution

### Development Database (KSESSIONS_DEV)
```sql
-- 1. Open Fix_Canvas_Sessions_FK_20251012.sql in SSMS
-- 2. Change line 11:
USE KSESSIONS_DEV;  -- Already set for dev
-- 3. Execute (F5)
```

### Production Database (KSESSIONS)
```sql
-- 1. Open Fix_Canvas_Sessions_FK_20251012.sql in SSMS
-- 2. Change line 11:
USE KSESSIONS;  -- Change from KSESSIONS_DEV
-- 3. Execute (F5)
```

### Command Line
```powershell
# Development
sqlcmd -S AHHOME -d KSESSIONS_DEV -i "Workspaces\Scripts\Fix_Canvas_Sessions_FK_20251012.sql"

# Production
sqlcmd -S AHHOME -d KSESSIONS -i "Workspaces\Scripts\Fix_Canvas_Sessions_FK_20251012.sql"
```

## Expected Output

```
========================================
Fix canvas.Sessions.SessionId Schema
Database: KSESSIONS_DEV
Date: 2025-10-12 ...
========================================

>> STEP 1: Validation Checks

  ✅ canvas schema exists
  ✅ canvas.Sessions table exists
  ✅ dbo.Sessions table exists
  Current SessionId configuration:
    - Data Type: bigint
    - IDENTITY: YES (NEEDS FIX)

>> STEP 2: Data Validation

  Current data counts:
    - canvas.Sessions: 6 records
    - canvas.Participants: 3 records
    - canvas.SessionData: 0 records
  ✅ All canvas.Sessions.SessionId values reference valid dbo.Sessions.SessionID

>> STEP 3: Schema Modification

  [3.1] Dropping dependent foreign keys...
    ✅ Dropped FK: FK_Participants_Sessions_SessionId
    ✅ Dropped FK: FK_SessionData_Sessions_SessionId

  [3.2] Rebuilding canvas.Sessions with correct schema...
    ✅ Created temp table canvas.Sessions_Temp
    ✅ Copied 6 records to temp table
    ✅ Dropped original canvas.Sessions table
    ✅ Renamed temp table to canvas.Sessions

  [3.3] Adding foreign key to dbo.Sessions...
    ✅ Added FK: FK_canvas_Sessions_dbo_Sessions

  [3.4] Recreating dependent foreign keys...
    ✅ Recreated FK: FK_Participants_Sessions_SessionId (ON DELETE CASCADE)
    ✅ Recreated FK: FK_SessionData_Sessions_SessionId (ON DELETE CASCADE)

✅ Schema modification complete!

>> STEP 4: Verification

  ✅ SessionId is NOT IDENTITY
  ✅ FK FK_canvas_Sessions_dbo_Sessions exists
    FK: FK_canvas_Sessions_dbo_Sessions
    Referencing: canvas.Sessions.SessionId → dbo.Sessions.SessionID
    Delete Rule: NO ACTION
  Dependent FKs: 2 of 2 recreated
  Final canvas.Sessions count: 6 records

========================================
Schema Fix Complete!
========================================

Summary:
  ✅ canvas.Sessions.SessionId is now INT (not IDENTITY)
  ✅ FK to dbo.Sessions.SessionID added
  ✅ All dependent FKs recreated
  ✅ Data integrity preserved
```

## Error Scenarios

### Invalid References
```
❌ ERROR: Found 2 canvas.Sessions records with invalid dbo.Sessions references
   These SessionId values do not exist in dbo.Sessions:
SessionId    Status    CreatedAt
---------    ------    ---------
999          Active    2025-10-12 10:00:00
1000         Active    2025-10-12 11:00:00

⚠️  MANUAL ACTION REQUIRED:
   1. Update invalid SessionId values to reference valid dbo.Sessions.SessionID
   2. Or DELETE canvas.Sessions records with invalid references
   3. Then re-run this script
```

**Solution**: 
```sql
-- Option 1: Delete invalid records
DELETE FROM canvas.Sessions WHERE SessionId NOT IN (SELECT SessionID FROM dbo.Sessions);

-- Option 2: Update to valid SessionID
UPDATE canvas.Sessions SET SessionId = 212 WHERE SessionId = 999;  -- Replace with valid ID
```

### FK Already Exists
```
✅ Foreign key FK_canvas_Sessions_dbo_Sessions already exists
   Schema is already correct. No changes needed.
```

**Solution**: Script is idempotent - safe to run multiple times

## Post-Execution Verification

1. **Verify Schema**:
   ```sql
   -- Check SessionId is INT (not BIGINT)
   SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
   FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = 'canvas' 
   AND TABLE_NAME = 'Sessions'
   AND COLUMN_NAME = 'SessionId';
   -- Expected: DATA_TYPE = 'int'
   
   -- Check IDENTITY is removed
   SELECT name, is_identity
   FROM sys.columns
   WHERE object_id = OBJECT_ID('canvas.Sessions')
   AND name = 'SessionId';
   -- Expected: is_identity = 0
   
   -- Check FK exists
   SELECT name, delete_referential_action_desc
   FROM sys.foreign_keys
   WHERE name = 'FK_canvas_Sessions_dbo_Sessions';
   -- Expected: 1 row, delete_referential_action_desc = 'NO_ACTION'
   ```

2. **Test HostProvisioner**:
   ```powershell
   cd Tools\HostProvisioner\HostProvisioner
   dotnet run -- create --session-id 212 --created-by "Test User" --dry-run false
   # Should succeed without "cannot insert explicit value for identity column" error
   ```

3. **Verify Data Integrity**:
   ```sql
   -- All canvas.Sessions.SessionId must exist in dbo.Sessions.SessionID
   SELECT cs.SessionId, cs.Status, ds.SessionName
   FROM canvas.Sessions cs
   INNER JOIN dbo.Sessions ds ON cs.SessionId = ds.SessionID;
   -- Should return all canvas sessions with their dbo.Sessions details
   ```

## Related Files

- **Migration Script**: `Workspaces/Scripts/KSESSIONS_Canvas_Migration_Script.sql` - Updated with correct schema
- **C# Models**: 
  - `SPA/NoorCanvas/Models/Simplified/Session.cs` - Changed from `long` to `int`
  - `SPA/NoorCanvas/Models/Simplified/Participant.cs` - SessionId FK updated
  - `SPA/NoorCanvas/Models/Simplified/SessionData.cs` - SessionId FK updated
- **Services**: All service methods updated to use `int sessionId` instead of `long`
- **HostProvisioner**: `Tools/HostProvisioner/HostProvisioner/Program.cs` - Updated to use `int`

## Rollback

If needed, rollback using git:
```powershell
git revert c2b31f7e
```

Then manually revert database changes:
```sql
-- Drop FK
ALTER TABLE canvas.Sessions DROP CONSTRAINT FK_canvas_Sessions_dbo_Sessions;

-- Rebuild with IDENTITY (not recommended - breaks HostProvisioner)
-- Better to fix data and re-run this script
```

## Important Notes

- **dbo.Sessions is READ-ONLY** - The FK is configured with `ON DELETE NO ACTION`
- **Canvas sessions MUST reference valid Islamic learning sessions** - This is by design
- **HostProvisioner creates canvas sessions for specific dbo.Sessions.SessionID values**
- **Data migration converts BIGINT→INT** - Ensure all SessionId values fit in INT range (max 2,147,483,647)

---

**Version**: 1.0.0  
**Last Updated**: 2025-10-12  
**Author**: GitHub Copilot  
**Commit**: c2b31f7e
