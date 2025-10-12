# Canvas Migration - Quick Start Guide

## ⚡ Quick Run Instructions

### Prerequisites
- [ ] **BACKUP KSESSIONS DATABASE FIRST!**
- [ ] Verify access to both KSESSIONS and KSESSIONS_DEV databases
- [ ] Ensure no active canvas operations in production

### Run the Script

#### Using SQL Server Management Studio (SSMS)
```sql
-- Step 1: Connect to KSESSIONS database
USE KSESSIONS;
GO

-- Step 2: Open and execute the migration script
-- File: Workspaces/Scripts/KSESSIONS_Canvas_Migration_Script.sql
-- Press F5 to execute
```

#### Using PowerShell + sqlcmd
```powershell
# Navigate to project root
cd "D:\PROJECTS\NOOR CANVAS"

# Run migration and save log
sqlcmd -S "localhost" -d KSESSIONS -E `
  -i "Workspaces\Scripts\KSESSIONS_Canvas_Migration_Script.sql" `
  -o "Workspaces\Scripts\migration_log_$(Get-Date -Format 'yyyyMMdd_HHmmss').txt"

# View the log
notepad "Workspaces\Scripts\migration_log_*.txt"
```

## ✅ Success Indicators

You should see:
```
✅ Canvas schema created successfully
✅ All 4 canvas tables verified
✅ Foreign key relationships verified
✅ AssetLookup migration completed
✅ Sessions migration completed
✅ Participants migration completed
✅ SessionData migration completed
MIGRATION COMPLETED SUCCESSFULLY
```

## 🔄 Running Multiple Times

**Safe to re-run!** The script will:
- ✅ Skip creating existing schema objects
- ✅ Only insert NEW records
- ✅ Update CHANGED records
- ✅ Never duplicate existing data

Example output on 2nd run (no changes):
```
AssetLookup migration completed:
   Inserted: 0 | Updated: 0 | Total processed: 0
```

## 📊 Quick Verification

After migration, verify data:
```sql
USE KSESSIONS;

-- Check all canvas tables
SELECT 'AssetLookup' AS [Table], COUNT(*) AS [Records] FROM canvas.AssetLookup
UNION ALL
SELECT 'Sessions', COUNT(*) FROM canvas.Sessions
UNION ALL  
SELECT 'Participants', COUNT(*) FROM canvas.Participants
UNION ALL
SELECT 'SessionData', COUNT(*) FROM canvas.SessionData;
```

## ⚠️ If Something Goes Wrong

The script automatically rolls back on errors. Your database remains unchanged.

**To manually rollback if needed:**
```sql
USE KSESSIONS;

-- Remove canvas schema and all tables
DROP TABLE IF EXISTS canvas.SessionData;
DROP TABLE IF EXISTS canvas.Participants;
DROP TABLE IF EXISTS canvas.Sessions;
DROP TABLE IF EXISTS canvas.AssetLookup;
DROP SCHEMA IF EXISTS canvas;
```

**Or restore from backup:**
```sql
RESTORE DATABASE KSESSIONS 
FROM DISK = 'C:\Backups\KSESSIONS_PreMigration.bak'
WITH REPLACE;
```

## 📖 Full Documentation

See `CANVAS_MIGRATION_README.md` for:
- Detailed feature explanations
- Comprehensive troubleshooting
- Data validation queries
- Post-migration steps
- FAQ section

## 🚀 Next Steps After Migration

1. ✅ Verify record counts match expectations
2. ✅ Test canvas features in your application
3. ✅ Monitor for any errors in application logs
4. ✅ Consider running again to sync any new DEV data

---

**Script Location**: `Workspaces/Scripts/KSESSIONS_Canvas_Migration_Script.sql`  
**Version**: 2.0.0 (Idempotent Production-Ready)
