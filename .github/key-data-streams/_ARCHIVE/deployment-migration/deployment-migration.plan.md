# deployment-migration Implementation Plan

**Key**: `deployment-migration`  
**Branch**: `development`  
**Created**: 2025-10-20T00:00:00Z  
**Status**: Ready for Implementation

---

## Overview

Implement automated production migration script lifecycle management integrated with agent workflows and ncdeploy deployment pipeline.

### Selected Enhancements

- ✅ A. Migration rollback scripts (Medium effort) - Auto-generate rollback for safety
- ✅ B. Migration validation (Low effort) - Syntax check before deployment
- ✅ C. Deployment dry-run mode (Low effort) - Test without executing

---

## System Context Pack

### Migration Script Lifecycle

**Directory Structure**:
```
Scripts/Migrations/Prod/
├── pending/                          # Pending migrations (executed on next deployment)
│   ├── migration-20251020-143000-user-landing-add-canvastype.sql
│   └── migration-20251020-150000-session-tracking-add-indexes.sql
├── archived/                         # Completed migrations (moved after successful deployment)
│   └── 2025-10-20/
│       └── migration-20251020-120000-participant-guid-column.sql
└── rollback/                         # Auto-generated rollback scripts
    └── rollback-20251020-143000-user-landing-add-canvastype.sql
```

### Naming Convention

**Migration Script**: `migration-{YYYYMMDD-HHMMSS}-{key}-{description}.sql`  
**Rollback Script**: `rollback-{YYYYMMDD-HHMMSS}-{key}-{description}.sql`

**Example**:
- Forward: `migration-20251020-143000-user-landing-add-canvastype-column.sql`
- Rollback: `rollback-20251020-143000-user-landing-add-canvastype-column.sql`

### Migration Script Template

```sql
-- ============================================================================
-- Production Migration Script
-- ============================================================================
-- Migration ID: {YYYYMMDD-HHMMSS}
-- Key: {key}
-- Description: {description}
-- Created: {ISO-8601-timestamp}
-- Author: GitHub Copilot (Agent: {agent-name})
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
IF EXISTS (SELECT 1 FROM canvas.MigrationHistory WHERE MigrationId = '{YYYYMMDD-HHMMSS}')
BEGIN
    PRINT 'Migration {YYYYMMDD-HHMMSS} already applied - skipping'
    RETURN
END
GO

-- MIGRATION LOGIC
-- ============================================================================
BEGIN TRANSACTION MigrationTrans;

BEGIN TRY
    PRINT 'Starting migration: {description}'
    
    -- Example: Add column
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
    VALUES ('{YYYYMMDD-HHMMSS}', '{description}', GETUTCDATE(), SYSTEM_USER);
    
    COMMIT TRANSACTION MigrationTrans;
    PRINT '✅ Migration {YYYYMMDD-HHMMSS} completed successfully'
    
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION MigrationTrans;
    
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    
    PRINT '❌ Migration {YYYYMMDD-HHMMSS} failed: ' + @ErrorMessage
    
    RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
END CATCH
GO
```

### Rollback Script Template

```sql
-- ============================================================================
-- Production Migration Rollback Script
-- ============================================================================
-- Migration ID: {YYYYMMDD-HHMMSS}
-- Key: {key}
-- Description: Rollback {description}
-- Created: {ISO-8601-timestamp}
-- Author: GitHub Copilot (Agent: {agent-name})
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
    PRINT 'Starting rollback: {description}'
    
    -- Example: Drop column
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
    
    -- Remove migration history record
    DELETE FROM canvas.MigrationHistory WHERE MigrationId = '{YYYYMMDD-HHMMSS}';
    
    COMMIT TRANSACTION RollbackTrans;
    PRINT '✅ Rollback {YYYYMMDD-HHMMSS} completed successfully'
    
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION RollbackTrans;
    
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    
    PRINT '❌ Rollback {YYYYMMDD-HHMMSS} failed: ' + @ErrorMessage
    
    RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
END CATCH
GO
```

### Migration History Table Schema

```sql
-- Create canvas.MigrationHistory table if not exists
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES 
               WHERE TABLE_SCHEMA = 'canvas' 
               AND TABLE_NAME = 'MigrationHistory')
BEGIN
    CREATE TABLE [canvas].[MigrationHistory] (
        [MigrationId] NVARCHAR(50) NOT NULL PRIMARY KEY,
        [Description] NVARCHAR(500) NOT NULL,
        [AppliedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [AppliedBy] NVARCHAR(128) NOT NULL DEFAULT SYSTEM_USER,
        [RolledBackAt] DATETIME2 NULL,
        [RolledBackBy] NVARCHAR(128) NULL
    );
    
    CREATE INDEX IX_MigrationHistory_AppliedAt ON [canvas].[MigrationHistory] ([AppliedAt]);
    
    PRINT 'Created canvas.MigrationHistory table'
END
GO
```

---

## Architecture Analysis

### Affected Layers

- **Agent Protocols**: feature.prompt.md, task.prompt.md, test-generation.prompt.md
- **Deployment Infrastructure**: ncdeploy.ps1
- **Database**: canvas.MigrationHistory table (new)
- **File System**: Scripts/Migrations/Prod/ directory structure

### Dependencies

**Files to Modify**:
- `.github/prompts/feature.prompt.md` (add migration protocol)
- `.github/prompts/task.prompt.md` (add migration creation logic)
- `.github/prompts/test-generation.prompt.md` (add migration testing)
- `Scripts/ncdeploy.ps1` (add migration execution)

**Files to Create**:
- `Scripts/Migrations/Prod/README.md` (migration workflow docs)
- `Scripts/Migrations/Prod/pending/.gitkeep`
- `Scripts/Migrations/Prod/archived/.gitkeep`
- `Scripts/Migrations/Prod/rollback/.gitkeep`

### Infrastructure

- **Database**: SQL Server (KSESSIONS production)
- **Deployment**: PowerShell 5.1+ (ncdeploy.ps1)
- **Version Control**: Git (track migrations in pending/, archive after deployment)

---

## Phase 1: Migration Script Protocol Definition

### Objectives

1. Define migration script standard format
2. Create directory structure
3. Create MigrationHistory table
4. Document migration workflow

### Implementation Tasks (TODO Items)

- [ ] **Task 1.1**: Create migration directory structure
  - Expected: `Scripts/Migrations/Prod/{pending,archived,rollback}/` directories
  
- [ ] **Task 1.2**: Create README.md with migration workflow documentation
  - Expected: Complete migration lifecycle documented
  
- [ ] **Task 1.3**: Create SQL script to initialize MigrationHistory table
  - Expected: `Scripts/Migrations/Prod/init-migration-history.sql`
  
- [ ] **Task 1.4**: Create migration and rollback script templates
  - Expected: Templates for agents to use when generating migrations

### Validation Checklist

- [ ] Directory structure created
- [ ] README.md written with workflow examples
- [ ] MigrationHistory table script created
- [ ] Templates documented
- [ ] Commit: {SHA}
- [ ] Tag: checkpoint/deployment-migration/phase1

### Commit Format

```
[deployment-migration] Phase 1: Migration Script Protocol Definition

Created production migration infrastructure:
- Directory structure: Scripts/Migrations/Prod/{pending,archived,rollback}/
- Migration workflow documentation
- MigrationHistory table initialization script
- Migration and rollback templates

Debug: [DEBUG-WORKITEM:deployment-migration:phase1:protocol];CLEANUP_OK
```

---

## Phase 2: Update Agent Prompts

### Objectives

1. Update feature.prompt.md to detect database changes
2. Update task.prompt.md to create migration scripts
3. Update test-generation.prompt.md to validate migrations
4. Add migration lifecycle to agent protocols

### Implementation Tasks (TODO Items)

- [ ] **Task 2.1**: Update feature.prompt.md Step 0.5 (Technology Stack Discovery)
  - Expected: Add database change detection logic
  
- [ ] **Task 2.2**: Add new section to feature.prompt.md: "Database Migration Protocol"
  - Expected: Instructions for when/how to create production migrations
  
- [ ] **Task 2.3**: Update task.prompt.md to create migration scripts
  - Expected: Auto-generate migration + rollback when DB changes detected
  
- [ ] **Task 2.4**: Update test-generation.prompt.md
  - Expected: Add migration validation test generation

### Validation Checklist

- [ ] feature.prompt.md updated with database detection
- [ ] Migration protocol documented in feature.prompt.md
- [ ] task.prompt.md creates migrations automatically
- [ ] test-generation.prompt.md validates migrations
- [ ] Commit: {SHA}
- [ ] Tag: checkpoint/deployment-migration/phase2

### Commit Format

```
[deployment-migration] Phase 2: Update Agent Prompts

Enhanced agent protocols with migration support:
- feature.prompt.md: Database change detection + migration protocol
- task.prompt.md: Auto-generate migration + rollback scripts
- test-generation.prompt.md: Migration validation tests

Agents now automatically create production migrations when DB changes detected.

Debug: [DEBUG-WORKITEM:deployment-migration:phase2:agents];CLEANUP_OK
```

---

## Phase 3: Enhance ncdeploy.ps1

### Objectives

1. Add migration detection logic
2. Add migration validation (syntax check)
3. Add migration execution with transaction support
4. Add archival logic after successful deployment
5. Add dry-run mode
6. Add rollback on failure

### Implementation Tasks (TODO Items)

- [ ] **Task 3.1**: Add migration detection
  - Expected: Detect scripts in `Scripts/Migrations/Prod/pending/`
  
- [ ] **Task 3.2**: Add migration validation
  - Expected: SQL syntax check using `sqlcmd -n` (dry-run)
  
- [ ] **Task 3.3**: Add migration execution logic
  - Expected: Execute migrations in alphabetical order with transaction support
  
- [ ] **Task 3.4**: Add archival logic
  - Expected: Move completed migrations to `archived/{YYYY-MM-DD}/`
  
- [ ] **Task 3.5**: Add dry-run mode (`-DryRun` parameter)
  - Expected: Show what would be executed without running
  
- [ ] **Task 3.6**: Add rollback on failure
  - Expected: Auto-execute rollback script if migration fails

### Validation Checklist

- [ ] Migration detection working
- [ ] Validation catches syntax errors
- [ ] Migrations execute in order
- [ ] Successful migrations archived
- [ ] Dry-run mode functional
- [ ] Rollback on failure tested
- [ ] Commit: {SHA}
- [ ] Tag: checkpoint/deployment-migration/phase3

### ncdeploy.ps1 Enhancement Specification

**Add New Section: Migration Execution (before code deployment)**

```powershell
# ============================================================================
# STEP 3: Execute Production Migrations
# ============================================================================

Write-Host "`n=== Step 3: Database Migrations ===" -ForegroundColor Cyan

$migrationPath = "D:\PROJECTS\NOOR CANVAS\Scripts\Migrations\Prod\pending"
$archivedPath = "D:\PROJECTS\NOOR CANVAS\Scripts\Migrations\Prod\archived"
$rollbackPath = "D:\PROJECTS\NOOR CANVAS\Scripts\Migrations\Prod\rollback"

# Detect pending migrations
$pendingMigrations = Get-ChildItem -Path $migrationPath -Filter "migration-*.sql" -ErrorAction SilentlyContinue | Sort-Object Name

if ($pendingMigrations.Count -eq 0) {
    Write-Host "  No pending migrations found - skipping" -ForegroundColor Green
}
else {
    Write-Host "  Found $($pendingMigrations.Count) pending migration(s):" -ForegroundColor Yellow
    $pendingMigrations | ForEach-Object { Write-Host "    - $($_.Name)" -ForegroundColor White }
    
    # Dry-run mode validation
    if ($DryRun) {
        Write-Host "`n  [DRY-RUN] Validating migration syntax..." -ForegroundColor Cyan
        foreach ($migration in $pendingMigrations) {
            Write-Host "    Validating: $($migration.Name)" -ForegroundColor White
            
            # SQL syntax validation (dry-run)
            $validateResult = & sqlcmd -S $productionServer -d KSESSIONS -U sa -P $saPassword -i $migration.FullName -n
            
            if ($LASTEXITCODE -ne 0) {
                Write-Host "    ❌ Syntax error in $($migration.Name)" -ForegroundColor Red
                Write-Host "    Deployment aborted - fix migration syntax" -ForegroundColor Red
                exit 1
            }
            
            Write-Host "    ✅ Syntax valid" -ForegroundColor Green
        }
        
        Write-Host "`n  [DRY-RUN] All migrations validated - deployment would continue" -ForegroundColor Green
    }
    else {
        # Execute migrations
        Write-Host "`n  Executing migrations..." -ForegroundColor Cyan
        
        foreach ($migration in $pendingMigrations) {
            Write-Host "    Executing: $($migration.Name)" -ForegroundColor White
            
            # Execute migration
            $executeResult = & sqlcmd -S $productionServer -d KSESSIONS -U sa -P $saPassword -i $migration.FullName -b
            
            if ($LASTEXITCODE -ne 0) {
                Write-Host "    ❌ Migration failed: $($migration.Name)" -ForegroundColor Red
                Write-Host "    Error output:" -ForegroundColor Red
                Write-Host $executeResult -ForegroundColor Red
                
                # Attempt rollback
                $rollbackFile = Join-Path $rollbackPath ($migration.Name -replace "^migration-", "rollback-")
                
                if (Test-Path $rollbackFile) {
                    Write-Host "`n    Attempting rollback: $($rollbackFile | Split-Path -Leaf)" -ForegroundColor Yellow
                    
                    $rollbackResult = & sqlcmd -S $productionServer -d KSESSIONS -U sa -P $saPassword -i $rollbackFile -b
                    
                    if ($LASTEXITCODE -eq 0) {
                        Write-Host "    ✅ Rollback successful" -ForegroundColor Green
                    }
                    else {
                        Write-Host "    ❌ Rollback failed - manual intervention required!" -ForegroundColor Red
                    }
                }
                else {
                    Write-Host "    ⚠️  No rollback script found - manual intervention required!" -ForegroundColor Yellow
                }
                
                Write-Host "`n  Deployment aborted due to migration failure" -ForegroundColor Red
                exit 1
            }
            
            Write-Host "    ✅ Migration successful" -ForegroundColor Green
            
            # Archive successful migration
            $archiveDate = Get-Date -Format "yyyy-MM-dd"
            $archiveDatePath = Join-Path $archivedPath $archiveDate
            
            if (-not (Test-Path $archiveDatePath)) {
                New-Item -ItemType Directory -Path $archiveDatePath -Force | Out-Null
            }
            
            Move-Item -Path $migration.FullName -Destination $archiveDatePath -Force
            Write-Host "    📁 Archived to: archived\$archiveDate\$($migration.Name)" -ForegroundColor Gray
        }
        
        Write-Host "`n  ✅ All migrations completed successfully" -ForegroundColor Green
    }
}
```

### Commit Format

```
[deployment-migration] Phase 3: Enhance ncdeploy.ps1 with Migration Support

Added production migration pipeline to ncdeploy.ps1:
- Migration detection from Scripts/Migrations/Prod/pending/
- SQL syntax validation before execution
- Sequential execution in alphabetical order
- Transaction support with automatic rollback on failure
- Dry-run mode for testing (-DryRun parameter)
- Automatic archival after successful deployment

Migration workflow now integrated with deployment pipeline.

Debug: [DEBUG-WORKITEM:deployment-migration:phase3:ncdeploy];CLEANUP_OK
```

---

## Phase 4: Testing & Validation

### Objectives

1. Test complete migration lifecycle (create → validate → deploy → archive)
2. Test rollback on failure
3. Test dry-run mode
4. Test multiple pending migrations
5. Validate MigrationHistory tracking

### Implementation Tasks (TODO Items)

- [ ] **Task 4.1**: Create test migration script
  - Expected: Valid test migration in pending/
  
- [ ] **Task 4.2**: Test dry-run mode
  - Expected: Validation passes, no execution
  
- [ ] **Task 4.3**: Test successful deployment
  - Expected: Migration executed, archived, history recorded
  
- [ ] **Task 4.4**: Test rollback on failure
  - Expected: Failed migration triggers rollback automatically
  
- [ ] **Task 4.5**: Test multiple migrations
  - Expected: All execute in order, all archived

### Validation Checklist

- [ ] Test migration created
- [ ] Dry-run mode validated
- [ ] Successful deployment tested
- [ ] Rollback on failure tested
- [ ] Multiple migrations tested
- [ ] MigrationHistory populated correctly
- [ ] Commit: {SHA}
- [ ] Tag: checkpoint/deployment-migration/phase4

### Test Migration Script Example

**File**: `Scripts/Migrations/Prod/pending/migration-20251020-test-migration-history.sql`

```sql
-- Test migration to validate migration system
-- This can be deleted after successful test

BEGIN TRANSACTION TestMigrationTrans;

BEGIN TRY
    PRINT 'Test migration: Verifying MigrationHistory table'
    
    -- Verify table exists
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES 
                   WHERE TABLE_SCHEMA = 'canvas' 
                   AND TABLE_NAME = 'MigrationHistory')
    BEGIN
        RAISERROR('MigrationHistory table does not exist!', 16, 1)
    END
    
    -- Insert test record
    INSERT INTO canvas.MigrationHistory (MigrationId, Description, AppliedAt, AppliedBy)
    VALUES ('20251020-test', 'Test migration system', GETUTCDATE(), SYSTEM_USER);
    
    COMMIT TRANSACTION TestMigrationTrans;
    PRINT '✅ Test migration successful'
    
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION TestMigrationTrans;
    THROW;
END CATCH
GO
```

### Commit Format

```
[deployment-migration] Phase 4: Testing & Validation

Validated complete migration lifecycle:
- Created test migration scripts
- Tested dry-run mode (validation without execution)
- Tested successful deployment and archival
- Tested automatic rollback on failure
- Tested multiple migration execution order
- Verified MigrationHistory tracking

Migration system ready for production use.

Debug: [DEBUG-WORKITEM:deployment-migration:phase4:testing];CLEANUP_OK
```

---

## Phase 5: Documentation

### Objectives

1. Create migration workflow documentation
2. Update ncdeploy.ps1 usage documentation
3. Document agent migration protocol
4. Create examples and best practices

### Implementation Tasks (TODO Items)

- [ ] **Task 5.1**: Create comprehensive README.md in Scripts/Migrations/Prod/
  - Expected: Complete migration workflow with examples
  
- [ ] **Task 5.2**: Update Scripts/ncdeploy.ps1 header documentation
  - Expected: Document migration parameters and behavior
  
- [ ] **Task 5.3**: Create MIGRATION_WORKFLOW.md in .github/prompts/
  - Expected: Agent-specific migration creation guidelines
  
- [ ] **Task 5.4**: Create migration examples
  - Expected: Example migrations for common scenarios (ADD COLUMN, CREATE INDEX, etc.)

### Validation Checklist

- [ ] README.md created with examples
- [ ] ncdeploy.ps1 documentation updated
- [ ] Agent guidelines documented
- [ ] Examples created
- [ ] Commit: {SHA}
- [ ] Tag: checkpoint/deployment-migration/phase5

### Commit Format

```
[deployment-migration] Phase 5: Documentation Complete

Created comprehensive migration documentation:
- Scripts/Migrations/Prod/README.md (workflow guide)
- Updated ncdeploy.ps1 header (migration parameters)
- .github/prompts/MIGRATION_WORKFLOW.md (agent guidelines)
- Example migrations for common scenarios

Migration system fully documented and ready for use.

Debug: [DEBUG-WORKITEM:deployment-migration:phase5:docs];CLEANUP_OK
```

---

## Progress Tracker

- [ ] **Phase 1**: Migration Script Protocol Definition
  - Status: Not Started
  - Commit: -
  - Tag: -

- [ ] **Phase 2**: Update Agent Prompts
  - Status: Not Started
  - Commit: -
  - Tag: -

- [ ] **Phase 3**: Enhance ncdeploy.ps1
  - Status: Not Started
  - Commit: -
  - Tag: -

- [ ] **Phase 4**: Testing & Validation
  - Status: Not Started
  - Commit: -
  - Tag: -

- [ ] **Phase 5**: Documentation
  - Status: Not Started
  - Commit: -
  - Tag: -

---

## Execution Protocol

**When you say "proceed" after plan approval:**

I will begin implementing Phase 1 immediately. At the end of each phase:
- Summarize what was completed
- Update deployment-migration.plan.json with phase status
- When you say "proceed", I automatically begin the next phase

**No manual commands needed** - just say "proceed" to continue through all phases sequentially.

**Final Phase:** After completing Phase 5, I will provide:
1. Complete implementation summary
2. All changes made during this key
3. Migration system usage instructions

---

**END OF PLAN DOCUMENT**

