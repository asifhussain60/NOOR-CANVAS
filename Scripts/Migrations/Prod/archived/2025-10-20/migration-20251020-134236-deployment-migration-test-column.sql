-- ============================================================================
-- Production Migration Script (TEST)
-- ============================================================================
-- Migration ID: 20251020-134236
-- Key: deployment-migration
-- Description: Add TestMigrationColumn to Sessions table (test migration)
-- Created: 2025-10-20T13:42:36Z
-- Author: GitHub Copilot (Agent: task)
-- Database: KSESSIONS (Production)
-- Schema: canvas
-- ============================================================================
-- NOTE: This is a TEST migration to validate the deployment-migration system.
--       It adds a temporary column that can be safely removed.
-- ============================================================================

-- SAFETY CHECKS
IF DB_NAME() != 'KSESSIONS'
BEGIN
    RAISERROR('ERROR: This migration must run against KSESSIONS database only!', 16, 1)
    RETURN
END
GO

-- Check if already applied
IF EXISTS (SELECT 1 FROM canvas.MigrationHistory WHERE MigrationId = '20251020-134236')
BEGIN
    PRINT 'Migration 20251020-134236 already applied - skipping'
    RETURN
END
GO

-- MIGRATION LOGIC
BEGIN TRANSACTION MigrationTrans;

BEGIN TRY
    PRINT 'Starting migration: Add TestMigrationColumn to Sessions table'
    
    -- Add test column (idempotent check)
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('canvas.Sessions') AND name = 'TestMigrationColumn')
    BEGIN
        ALTER TABLE [canvas].[Sessions] ADD [TestMigrationColumn] NVARCHAR(50) NULL DEFAULT 'test-value';
        PRINT '  ✅ Added TestMigrationColumn column'
    END
    ELSE
    BEGIN
        PRINT '  ⚠️  TestMigrationColumn already exists - skipping'
    END
    
    -- Record in history
    INSERT INTO canvas.MigrationHistory (MigrationId, Description, AppliedAt, AppliedBy)
    VALUES ('20251020-134236', 'Add TestMigrationColumn to Sessions table (test migration)', GETUTCDATE(), SYSTEM_USER);
    
    COMMIT TRANSACTION MigrationTrans;
    PRINT '✅ Migration 20251020-134236 completed successfully'
    
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION MigrationTrans;
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    PRINT '❌ Migration failed: ' + @ErrorMessage
    RAISERROR(@ErrorMessage, 16, 1);
END CATCH
GO
