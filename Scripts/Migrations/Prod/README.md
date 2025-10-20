# Production Migration System

## Overview

This directory manages production database migrations for the NOOR Canvas application. Migrations are automatically executed during deployment via `ncdeploy.ps1` and provide a safe, auditable way to evolve the production database schema.

---

## Directory Structure

```
Scripts/Migrations/Prod/
├── pending/              # Migrations waiting to be deployed
│   ├── migration-20251020-143000-user-landing-add-canvastype.sql
│   └── migration-20251020-150000-session-tracking-add-indexes.sql
├── archived/             # Successfully deployed migrations
│   └── 2025-10-20/
│       └── migration-20251020-120000-participant-guid-column.sql
├── rollback/             # Rollback scripts for each migration
│   ├── rollback-20251020-143000-user-landing-add-canvastype.sql
│   └── rollback-20251020-150000-session-tracking-add-indexes.sql
├── init-migration-history.sql  # One-time: Creates MigrationHistory table
└── README.md             # This file
```

---

## Migration Lifecycle

### 1. **Creation** (Automatic - GitHub Copilot Agents)

When agents (plan/task) detect database changes in a phase, they automatically generate:

- **Migration Script**: `pending/migration-{YYYYMMDD-HHMMSS}-{key}-{description}.sql`
- **Rollback Script**: `rollback/rollback-{YYYYMMDD-HHMMSS}-{key}-{description}.sql`

**Example**:
```
pending/migration-20251020-143000-user-landing-add-canvastype.sql
rollback/rollback-20251020-143000-user-landing-add-canvastype.sql
```

### 2. **Validation** (Automatic - ncdeploy.ps1)

Before deployment, `ncdeploy.ps1` validates all pending migrations:

```powershell
# Dry-run mode
.\Scripts\ncdeploy.ps1 -DryRun

# Output:
# [DRY-RUN] Validating migration syntax...
#   Validating: migration-20251020-143000-user-landing-add-canvastype.sql
#   ✅ Syntax valid
```

### 3. **Execution** (Automatic - ncdeploy.ps1)

Migrations execute in **alphabetical order** during deployment:

```powershell
.\Scripts\ncdeploy.ps1

# Output:
# === Step 3: Database Migrations ===
#   Found 2 pending migration(s)
#   Executing: migration-20251020-143000-user-landing-add-canvastype.sql
#   ✅ Migration successful
#   📁 Archived to: archived/2025-10-20/
```

### 4. **Archival** (Automatic - ncdeploy.ps1)

After successful execution, migrations move to `archived/{YYYY-MM-DD}/`:

```
Before:  pending/migration-20251020-143000-user-landing-add-canvastype.sql
After:   archived/2025-10-20/migration-20251020-143000-user-landing-add-canvastype.sql
```

### 5. **Rollback** (Automatic on Failure)

If a migration fails, `ncdeploy.ps1` automatically executes the corresponding rollback script:

```powershell
# Output:
#   ❌ Migration failed: migration-20251020-143000-user-landing-add-canvastype.sql
#   Attempting rollback: rollback-20251020-143000-user-landing-add-canvastype.sql
#   ✅ Rollback successful
#   Deployment aborted due to migration failure
```

---

## Migration Script Template

### Forward Migration

```sql
-- ============================================================================
-- Production Migration Script
-- ============================================================================
-- Migration ID: 20251020-143000
-- Key: user-landing
-- Description: Add CanvasType column to track host selection
-- Created: 2025-10-20T14:30:00Z
-- Author: GitHub Copilot (Agent: task)
-- Database: KSESSIONS (Production)
-- Schema: canvas
-- ============================================================================

-- SAFETY CHECKS
-- ============================================================================
IF DB_NAME() != 'KSESSIONS'
BEGIN
    RAISERROR('ERROR: This migration must run against KSESSIONS database only!', 16, 1)
    RETURN
END
GO

-- Check if migration already applied
IF EXISTS (SELECT 1 FROM canvas.MigrationHistory WHERE MigrationId = '20251020-143000')
BEGIN
    PRINT 'Migration 20251020-143000 already applied - skipping'
    RETURN
END
GO

-- MIGRATION LOGIC
-- ============================================================================
BEGIN TRANSACTION MigrationTrans;

BEGIN TRY
    PRINT 'Starting migration: Add CanvasType column'
    
    -- Add column if not exists
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
                   WHERE TABLE_SCHEMA = 'canvas' 
                   AND TABLE_NAME = 'Sessions' 
                   AND COLUMN_NAME = 'CanvasType')
    BEGIN
        ALTER TABLE [canvas].[Sessions]
        ADD [CanvasType] NVARCHAR(20) NULL DEFAULT 'asset';
        
        PRINT '  ✅ Added CanvasType column'
    END
    ELSE
    BEGIN
        PRINT '  ⏭️  CanvasType column already exists - skipping'
    END
    
    -- Update existing rows
    UPDATE [canvas].[Sessions]
    SET [CanvasType] = 'asset'
    WHERE [CanvasType] IS NULL;
    
    PRINT '  ✅ Updated existing sessions with default value'
    
    -- Record migration in history
    INSERT INTO canvas.MigrationHistory (MigrationId, Description, AppliedAt, AppliedBy)
    VALUES ('20251020-143000', 'Add CanvasType column to track host selection', GETUTCDATE(), SYSTEM_USER);
    
    COMMIT TRANSACTION MigrationTrans;
    PRINT '✅ Migration 20251020-143000 completed successfully'
    
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION MigrationTrans;
    
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    
    PRINT '❌ Migration 20251020-143000 failed: ' + @ErrorMessage
    
    RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
END CATCH
GO
```

### Rollback Migration

```sql
-- ============================================================================
-- Production Migration Rollback Script
-- ============================================================================
-- Migration ID: 20251020-143000
-- Key: user-landing
-- Description: Rollback CanvasType column addition
-- Created: 2025-10-20T14:30:00Z
-- Author: GitHub Copilot (Agent: task)
-- Database: KSESSIONS (Production)
-- Schema: canvas
-- ============================================================================

-- SAFETY CHECKS
-- ============================================================================
IF DB_NAME() != 'KSESSIONS'
BEGIN
    RAISERROR('ERROR: This rollback must run against KSESSIONS database only!', 16, 1)
    RETURN
END
GO

-- ROLLBACK LOGIC
-- ============================================================================
BEGIN TRANSACTION RollbackTrans;

BEGIN TRY
    PRINT 'Starting rollback: Remove CanvasType column'
    
    -- Drop column if exists
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_SCHEMA = 'canvas' 
               AND TABLE_NAME = 'Sessions' 
               AND COLUMN_NAME = 'CanvasType')
    BEGIN
        ALTER TABLE [canvas].[Sessions]
        DROP COLUMN [CanvasType];
        
        PRINT '  ✅ Dropped CanvasType column'
    END
    ELSE
    BEGIN
        PRINT '  ⏭️  CanvasType column does not exist - skipping'
    END
    
    -- Update migration history
    UPDATE canvas.MigrationHistory
    SET RolledBackAt = GETUTCDATE(),
        RolledBackBy = SYSTEM_USER
    WHERE MigrationId = '20251020-143000';
    
    COMMIT TRANSACTION RollbackTrans;
    PRINT '✅ Rollback 20251020-143000 completed successfully'
    
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION RollbackTrans;
    
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    
    PRINT '❌ Rollback 20251020-143000 failed: ' + @ErrorMessage
    
    RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
END CATCH
GO
```

---

## Naming Convention

**Format**: `migration-{YYYYMMDD-HHMMSS}-{key}-{description}.sql`

**Components**:
- `YYYYMMDD-HHMMSS`: Timestamp (ensures unique ID and execution order)
- `{key}`: Implementation key (e.g., `user-landing`, `session-tracking`)
- `{description}`: Brief kebab-case description (e.g., `add-canvastype-column`)

**Examples**:
- `migration-20251020-143000-user-landing-add-canvastype-column.sql`
- `migration-20251020-150000-session-tracking-add-performance-indexes.sql`
- `migration-20251021-090000-participant-auth-create-guid-table.sql`

**Rollback Naming**: Replace `migration-` with `rollback-` (same timestamp and description)

---

## Migration History Table

**Table**: `canvas.MigrationHistory`

**Schema**:
```sql
CREATE TABLE [canvas].[MigrationHistory] (
    [MigrationId] NVARCHAR(50) NOT NULL PRIMARY KEY,      -- Timestamp from filename
    [Description] NVARCHAR(500) NOT NULL,                 -- Human-readable description
    [AppliedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),  -- When applied
    [AppliedBy] NVARCHAR(128) NOT NULL DEFAULT SYSTEM_USER, -- Who applied it
    [RolledBackAt] DATETIME2 NULL,                        -- When rolled back (if applicable)
    [RolledBackBy] NVARCHAR(128) NULL                     -- Who rolled it back
);
```

**Usage**:
```sql
-- View all migrations
SELECT * FROM canvas.MigrationHistory ORDER BY AppliedAt DESC;

-- Check if specific migration applied
SELECT * FROM canvas.MigrationHistory WHERE MigrationId = '20251020-143000';

-- View rolled back migrations
SELECT * FROM canvas.MigrationHistory WHERE RolledBackAt IS NOT NULL;
```

---

## Manual Migration Workflow

### Create Migration Manually (Rare)

1. **Generate timestamp**:
   ```powershell
   Get-Date -Format "yyyyMMdd-HHmmss"
   # Output: 20251020-143000
   ```

2. **Create migration file**:
   ```
   pending/migration-20251020-143000-my-feature-description.sql
   ```

3. **Create rollback file**:
   ```
   rollback/rollback-20251020-143000-my-feature-description.sql
   ```

4. **Use template** from section above

5. **Test with dry-run**:
   ```powershell
   .\Scripts\ncdeploy.ps1 -DryRun
   ```

6. **Deploy**:
   ```powershell
   .\Scripts\ncdeploy.ps1
   ```

---

## Deployment Integration

### ncdeploy.ps1 Behavior

**Step 3: Database Migrations** (runs before code deployment):

1. **Detect** pending migrations in `pending/`
2. **Validate** SQL syntax (dry-run mode)
3. **Execute** in alphabetical order
4. **Archive** successful migrations to `archived/{YYYY-MM-DD}/`
5. **Rollback** on failure (automatic)

**Parameters**:
```powershell
# Normal deployment (executes migrations)
.\Scripts\ncdeploy.ps1

# Dry-run (validates without executing)
.\Scripts\ncdeploy.ps1 -DryRun
```

---

## Best Practices

### ✅ DO

- **Always generate rollback scripts** (even for simple changes)
- **Test migrations in development** before production
- **Use idempotent checks** (IF NOT EXISTS, IF EXISTS)
- **Include descriptive comments** in migration scripts
- **Keep migrations small and focused** (one logical change per migration)
- **Use transactions** (BEGIN TRANSACTION...COMMIT/ROLLBACK)
- **Record in MigrationHistory** table

### ❌ DON'T

- **Never edit archived migrations** (they're historical records)
- **Don't delete rollback scripts** (needed for emergency rollbacks)
- **Avoid destructive operations without backups** (DROP TABLE, TRUNCATE)
- **Don't skip dry-run validation** before production deployment
- **Never commit directly to production** (always use ncdeploy.ps1)

---

## Common Migration Patterns

### Add Column
```sql
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_SCHEMA = 'canvas' AND TABLE_NAME = 'Sessions' AND COLUMN_NAME = 'NewColumn')
BEGIN
    ALTER TABLE [canvas].[Sessions] ADD [NewColumn] NVARCHAR(50) NULL;
    PRINT '  ✅ Added NewColumn'
END
```

### Add Index
```sql
IF NOT EXISTS (SELECT 1 FROM sys.indexes 
               WHERE name = 'IX_Sessions_NewColumn' AND object_id = OBJECT_ID('canvas.Sessions'))
BEGIN
    CREATE INDEX IX_Sessions_NewColumn ON [canvas].[Sessions] ([NewColumn]);
    PRINT '  ✅ Created index IX_Sessions_NewColumn'
END
```

### Add Foreign Key
```sql
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Sessions_SomeTable')
BEGIN
    ALTER TABLE [canvas].[Sessions]
    ADD CONSTRAINT FK_Sessions_SomeTable 
    FOREIGN KEY ([SomeId]) REFERENCES [canvas].[SomeTable]([Id]);
    PRINT '  ✅ Created FK_Sessions_SomeTable'
END
```

### Update Data
```sql
UPDATE [canvas].[Sessions]
SET [Status] = 'Active'
WHERE [Status] IS NULL;

PRINT '  ✅ Updated ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' rows'
```

---

## Troubleshooting

### Migration Failed During Deployment

1. **Check error message** in ncdeploy.ps1 output
2. **Verify rollback completed** successfully
3. **Fix migration script** in `pending/`
4. **Test with dry-run**: `.\Scripts\ncdeploy.ps1 -DryRun`
5. **Redeploy**: `.\Scripts\ncdeploy.ps1`

### Rollback Failed

1. **Check MigrationHistory table**:
   ```sql
   SELECT * FROM canvas.MigrationHistory WHERE MigrationId = 'XXXXXX-XXXXXX';
   ```

2. **Manually run rollback script**:
   ```powershell
   sqlcmd -S localhost -d KSESSIONS -U sa -P [password] -i "rollback/rollback-XXXXXX-XXXXXX.sql"
   ```

3. **Verify database state** after rollback

### Duplicate Migration

If migration already applied:
```sql
-- Migration script checks this automatically
IF EXISTS (SELECT 1 FROM canvas.MigrationHistory WHERE MigrationId = 'XXXXXX-XXXXXX')
BEGIN
    PRINT 'Migration already applied - skipping'
    RETURN
END
```

---

## Support

For issues or questions about the migration system:

1. Review this README
2. Check `.github/prompts.keys/deployment-migration/deployment-migration.plan.md`
3. Review agent documentation: `.github/prompts/MIGRATION_WORKFLOW.md`
4. Check ncdeploy.ps1 migration section (Step 3)

---

**Last Updated**: 2025-10-20  
**Migration System Version**: 1.0  
**Status**: Active
