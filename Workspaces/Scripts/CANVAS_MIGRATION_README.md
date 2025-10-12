# Canvas Schema Migration Script

## Overview
This SQL migration script safely copies the canvas schema and data from `KSESSIONS_DEV` (development database) to `KSESSIONS` (production database).

## File Location
`Workspaces/Scripts/KSESSIONS_Canvas_Migration_Script.sql`

## Key Features

### ✅ **Truly Idempotent**
- **Safe to run multiple times** without any risk of data duplication
- Only migrates new or changed data on subsequent runs
- Existing records are preserved and not duplicated

### 🛡️ **Production-Safe**
- Transaction-based with automatic rollback on errors
- Pre-flight validation checks
- Comprehensive error handling
- Zero impact on existing `dbo` schema objects

### 📊 **Smart Data Handling**
- **AssetLookup**: Uses `MERGE` based on `AssetIdentifier` (updates if changed)
- **Sessions**: Uses `MERGE` based on `HostToken`/`UserToken` (updates status, participant count, etc.)
- **Participants**: Inserts only new participants (checks SessionId + UserToken + Email)
- **SessionData**: Inserts only new data records (checks SessionId + DataType + CreatedAt + CreatedBy)

### 📝 **Comprehensive Logging**
- Detailed progress tracking
- Insert/Update counts for each table
- Validation results
- Data integrity checks

## What Gets Migrated

### Schema Objects
1. **canvas** schema (if not exists)
2. **__EFMigrationsHistory** table (dbo schema)
3. **canvas.AssetLookup** table
4. **canvas.Sessions** table  
5. **canvas.Participants** table
6. **canvas.SessionData** table
7. All **constraints** (Primary Keys, Foreign Keys, Unique)
8. All **indexes** (for optimal performance)

### Data
- All records from `KSESSIONS_DEV.canvas.*` tables
- Smart deduplication using unique keys
- Automatic SessionId mapping for foreign keys
- Only new/changed records on re-runs

## Prerequisites

### Database Access
- SQL Server 2012 or later
- Access to both `KSESSIONS_DEV` and `KSESSIONS` databases
- **Required Permissions**:
  - `CREATE SCHEMA` on KSESSIONS
  - `CREATE TABLE` on KSESSIONS
  - `SELECT` on KSESSIONS_DEV.canvas.*
  - `INSERT`, `UPDATE`, `DELETE` on KSESSIONS.canvas.*

### Pre-Migration Checklist
- [ ] Verify both databases are accessible
- [ ] **Take a backup of KSESSIONS database** (critical!)
- [ ] Verify KSESSIONS_DEV has the source data
- [ ] Ensure no active canvas operations in production
- [ ] Review current record counts (optional)

## How to Run

### Option 1: SQL Server Management Studio (SSMS)
```sql
-- 1. Connect to KSESSIONS database
USE KSESSIONS;
GO

-- 2. Open the migration script file
-- File > Open > File... > Select KSESSIONS_Canvas_Migration_Script.sql

-- 3. Execute the script
-- Press F5 or click Execute button
```

### Option 2: Azure Data Studio
```sql
-- 1. Connect to KSESSIONS database
-- 2. Open KSESSIONS_Canvas_Migration_Script.sql
-- 3. Click "Run" button
```

### Option 3: Command Line (sqlcmd)
```powershell
sqlcmd -S YourServerName -d KSESSIONS -i "d:\PROJECTS\NOOR CANVAS\Workspaces\Scripts\KSESSIONS_Canvas_Migration_Script.sql" -o migration_log.txt
```

## Expected Output

### First Run
```
================================================================================
KSESSIONS CANVAS MIGRATION SCRIPT v2.0.0
Execution ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
Started: 2025-10-12 10:30:00 UTC
Mode: IDEMPOTENT (Safe for repeated execution)
================================================================================

>>> SECTION 1: PRE-FLIGHT VALIDATION
  [1.1] Database Connection Validation
    ✅ Connected to KSESSIONS database
  [1.2] SQL Server Version Check
    ✅ SQL Server version compatible (16)
  ...

>>> SECTION 6: DATA MIGRATION
  [6.3] Migrating AssetLookup data...
    Source records in KSESSIONS_DEV.canvas.AssetLookup: 8
    ✅ AssetLookup migration completed:
       Inserted: 8 | Updated: 0 | Total processed: 8
       
  [6.4] Migrating Sessions data...
    Source records in KSESSIONS_DEV.canvas.Sessions: 6
    ✅ Sessions migration completed: 6 records processed (inserted/updated)
    
  [6.5] Migrating Participants data...
    Source records in KSESSIONS_DEV.canvas.Participants: 1
    Session mapping created: 6 sessions mapped
    ✅ Participants migration completed: 1 new records inserted
    
  [6.6] Migrating SessionData...
    Source records in KSESSIONS_DEV.canvas.SessionData: 0
    ✅ SessionData migration completed: 0 new records inserted

================================================================================
MIGRATION COMPLETED SUCCESSFULLY
================================================================================
Duration: 3 seconds
Warnings: 0
Errors: 0
```

### Subsequent Runs (No Changes)
```
>>> SECTION 6: DATA MIGRATION
  [6.3] Migrating AssetLookup data...
    Source records in KSESSIONS_DEV.canvas.AssetLookup: 8
    ✅ AssetLookup migration completed:
       Inserted: 0 | Updated: 0 | Total processed: 0
       
  [6.4] Migrating Sessions data...
    Source records in KSESSIONS_DEV.canvas.Sessions: 6
    ✅ Sessions migration completed: 0 records processed (inserted/updated)
    
  [6.5] Migrating Participants data...
    ✅ Participants migration completed: 0 new records inserted
    
  [6.6] Migrating SessionData...
    ✅ SessionData migration completed: 0 new records inserted
    
  [6.7] Data migration summary:
    Total records processed across all tables: 0
    NOTE: On subsequent runs, only NEW or CHANGED data is migrated.
```

### Subsequent Runs (With New Data)
If you add 2 new sessions and 5 new assets in DEV:
```
  [6.3] Migrating AssetLookup data...
    ✅ AssetLookup migration completed:
       Inserted: 5 | Updated: 0 | Total processed: 5
       
  [6.4] Migrating Sessions data...
    ✅ Sessions migration completed: 2 records processed (inserted/updated)
```

## Validation

The script automatically validates:
- ✅ Schema creation
- ✅ All tables created (expects 4 canvas tables)
- ✅ Constraints and foreign keys
- ✅ Indexes
- ✅ Data integrity (no orphaned records)
- ✅ No duplicate tokens

## Troubleshooting

### Error: "This script must be executed against KSESSIONS database"
**Solution**: Make sure you're connected to the KSESSIONS database, not KSESSIONS_DEV

```sql
USE KSESSIONS;
GO
-- Then run the migration script
```

### Error: "Could not find database 'KSESSIONS_DEV'"
**Solution**: Verify KSESSIONS_DEV database exists on the same server

```sql
-- Check available databases
SELECT name FROM sys.databases WHERE name LIKE '%KSESSIONS%';
```

### Warning: "Canvas schema already exists"
**Solution**: This is expected on re-runs. The script will verify compatibility and continue.

### Duplicate Token Warnings
**Solution**: Review the source data in KSESSIONS_DEV. Sessions should have unique HostToken and UserToken values.

```sql
-- Check for duplicates in DEV
USE KSESSIONS_DEV;
SELECT HostToken, COUNT(*) 
FROM canvas.Sessions 
GROUP BY HostToken 
HAVING COUNT(*) > 1;
```

## Rollback

If you need to rollback the migration:

### Option 1: Restore from Backup (Recommended)
```sql
-- Restore from your pre-migration backup
RESTORE DATABASE KSESSIONS 
FROM DISK = 'C:\Backups\KSESSIONS_PreMigration.bak'
WITH REPLACE;
```

### Option 2: Manual Cleanup (Use with caution!)
```sql
USE KSESSIONS;
GO

-- Drop all canvas tables (CASCADE will handle foreign keys)
DROP TABLE IF EXISTS canvas.SessionData;
DROP TABLE IF EXISTS canvas.Participants;
DROP TABLE IF EXISTS canvas.Sessions;
DROP TABLE IF EXISTS canvas.AssetLookup;

-- Drop canvas schema
DROP SCHEMA IF EXISTS canvas;

-- Optionally remove EF Migrations History entries
-- DELETE FROM dbo.__EFMigrationsHistory WHERE MigrationId LIKE '%Canvas%';
```

## Post-Migration Steps

1. **Verify Data**
   ```sql
   USE KSESSIONS;
   
   -- Check record counts
   SELECT 'AssetLookup' AS TableName, COUNT(*) AS RecordCount FROM canvas.AssetLookup
   UNION ALL
   SELECT 'Sessions', COUNT(*) FROM canvas.Sessions
   UNION ALL
   SELECT 'Participants', COUNT(*) FROM canvas.Participants
   UNION ALL
   SELECT 'SessionData', COUNT(*) FROM canvas.SessionData;
   
   -- Verify no orphaned records
   SELECT 'Orphaned Participants' AS Issue, COUNT(*) AS Count
   FROM canvas.Participants p
   WHERE NOT EXISTS (SELECT 1 FROM canvas.Sessions s WHERE s.SessionId = p.SessionId)
   UNION ALL
   SELECT 'Orphaned SessionData', COUNT(*)
   FROM canvas.SessionData sd
   WHERE NOT EXISTS (SELECT 1 FROM canvas.Sessions s WHERE s.SessionId = sd.SessionId);
   ```

2. **Update Application Configuration**
   - Verify connection strings point to KSESSIONS
   - Test canvas features in production environment
   - Monitor application logs for any issues

3. **Performance Monitoring**
   - All performance indexes are created automatically
   - Monitor query performance for canvas operations
   - Consider adding additional indexes if needed

## FAQ

### Q: Can I run this script multiple times?
**A:** Yes! The script is fully idempotent. It will only add new data and update changed records. No duplicates will be created.

### Q: What happens to existing data in KSESSIONS.canvas?
**A:** Existing data is preserved. The script uses MERGE statements and duplicate detection to avoid overwriting or duplicating data.

### Q: Will this script affect my dbo schema tables?
**A:** No. The only change to the dbo schema is creating `__EFMigrationsHistory` table if it doesn't exist. All other changes are in the canvas schema.

### Q: How long does the migration take?
**A:** Typically 2-10 seconds depending on data volume. First run is slower due to schema creation.

### Q: Can I run this during business hours?
**A:** The script uses transactions and is relatively fast. However, it's recommended to:
- Run during low-traffic periods
- Ensure no active canvas operations
- Have a backup ready
- Test in a staging environment first

### Q: What if the script fails midway?
**A:** All changes are automatically rolled back. The database will be in the same state as before the script ran.

## Version History

### v2.0.0 (October 12, 2025)
- Enhanced idempotency for production deployment
- Added detailed insert/update statistics
- Improved duplicate detection logic
- Added source record count logging
- Enhanced validation checks
- Better documentation and error messages

### v1.0.0 (October 4, 2025)
- Initial release
- Combined schema + data migration
- Basic idempotency support
- Transaction-based operations

## Support

For issues or questions:
1. Review the troubleshooting section above
2. Check the script output for specific error messages
3. Verify prerequisites are met
4. Contact the development team with the Execution ID from the failed run

---

**Last Updated**: October 12, 2025  
**Script Version**: 2.0.0  
**Author**: GitHub Copilot Task Agent
