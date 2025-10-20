# Rollback Scripts

This directory contains rollback scripts for production migrations.

**Purpose**: Emergency rollback capability  
**Execution**: Automatic on migration failure OR manual when needed  
**Pairing**: Each migration has a corresponding rollback

---

## How Rollbacks Work

### Automatic Rollback (Migration Failure)

If a migration fails during `ncdeploy.ps1`:

1. **Deployment stops immediately**
2. **ncdeploy.ps1 finds** corresponding rollback script
3. **Executes rollback** automatically
4. **Updates MigrationHistory** table

### Manual Rollback (Emergency)

If you need to manually rollback a migration:

```powershell
# Execute rollback script directly
sqlcmd -S localhost -d KSESSIONS -U sa -P [password] -i "rollback/rollback-{timestamp}-{key}-{description}.sql"
```

---

## File Pairing

Each migration has a rollback:

```
Migration:  pending/migration-20251020-143000-user-landing-add-canvastype.sql
Rollback:   rollback/rollback-20251020-143000-user-landing-add-canvastype.sql
```

**Naming**: Same timestamp and description, replace `migration-` with `rollback-`

---

## Rollback Script Requirements

Every rollback script must:

- ✅ **Reverse all changes** from the migration
- ✅ **Use transactions** (BEGIN TRANSACTION...COMMIT/ROLLBACK)
- ✅ **Include safety checks** (DB_NAME validation)
- ✅ **Update MigrationHistory** (set RolledBackAt, RolledBackBy)
- ✅ **Be idempotent** (can run multiple times safely)

---

## Example Rollback

```sql
-- Rollback for: Add CanvasType column
BEGIN TRANSACTION RollbackTrans;

BEGIN TRY
    -- Drop column if exists
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_SCHEMA = 'canvas' AND TABLE_NAME = 'Sessions' AND COLUMN_NAME = 'CanvasType')
    BEGIN
        ALTER TABLE [canvas].[Sessions] DROP COLUMN [CanvasType];
        PRINT '  ✅ Dropped CanvasType column'
    END
    
    -- Update history
    UPDATE canvas.MigrationHistory
    SET RolledBackAt = GETUTCDATE(), RolledBackBy = SYSTEM_USER
    WHERE MigrationId = '20251020-143000';
    
    COMMIT TRANSACTION RollbackTrans;
    PRINT '✅ Rollback completed successfully'
    
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION RollbackTrans;
    THROW;
END CATCH
GO
```

---

## ⚠️ Important Rules

- **Never delete rollback scripts** - Even after archival
- **Always test rollbacks** in development
- **Keep rollback logic simple** - Reverse operations only
- **Don't assume data state** - Check before dropping/altering

---

**See**: `../README.md` for complete migration system documentation
