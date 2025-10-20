-- ============================================================================
-- Production Migration Rollback Script (TEST)
-- ============================================================================
-- Migration ID: 20251020-134236
-- Key: deployment-migration
-- Description: Rollback - Remove TestMigrationColumn from Sessions table
-- Created: 2025-10-20T13:42:36Z
-- Author: GitHub Copilot (Agent: task)
-- Database: KSESSIONS (Production)
-- Schema: canvas
-- ============================================================================
-- NOTE: This rollback script removes the test column added by the forward migration.
-- ============================================================================

-- SAFETY CHECKS
IF DB_NAME() != 'KSESSIONS'
BEGIN
    RAISERROR('ERROR: This rollback must run against KSESSIONS database only!', 16, 1)
    RETURN
END
GO

-- ROLLBACK LOGIC
BEGIN TRANSACTION RollbackTrans;

BEGIN TRY
    PRINT 'Starting rollback: Remove TestMigrationColumn from Sessions table'
    
    -- Remove test column (idempotent check)
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('canvas.Sessions') AND name = 'TestMigrationColumn')
    BEGIN
        ALTER TABLE [canvas].[Sessions] DROP COLUMN [TestMigrationColumn];
        PRINT '  ✅ Dropped TestMigrationColumn column'
    END
    ELSE
    BEGIN
        PRINT '  ⚠️  TestMigrationColumn does not exist - skipping'
    END
    
    -- Update history
    UPDATE canvas.MigrationHistory
    SET RolledBackAt = GETUTCDATE(), RolledBackBy = SYSTEM_USER
    WHERE MigrationId = '20251020-134236';
    
    COMMIT TRANSACTION RollbackTrans;
    PRINT '✅ Rollback 20251020-134236 completed successfully'
    
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION RollbackTrans;
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    PRINT '❌ Rollback failed: ' + @ErrorMessage
    RAISERROR(@ErrorMessage, 16, 1);
END CATCH
GO
