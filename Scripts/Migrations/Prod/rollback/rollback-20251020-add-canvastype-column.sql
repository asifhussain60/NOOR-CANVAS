-- =============================================
-- Rollback: Remove CanvasType Column from canvas.Sessions
-- Database: KSESSIONS_DEV / KSESSIONS (specify via sqlcmd -d parameter)
-- Date: 2025-10-20
-- Author: GitHub Copilot (user-landing key)
-- Protocol: deployment-migration v1.0
-- =============================================
-- Purpose: Rollback CanvasType column migration if needed
-- Usage: sqlcmd -S AHHOME -d {database} -E -i rollback-20251020-add-canvastype-column.sql
-- =============================================

-- Specify database via sqlcmd -d parameter
-- Example DEV: sqlcmd -S AHHOME -d KSESSIONS_DEV -E -i rollback-20251020-add-canvastype-column.sql
-- Example PROD: sqlcmd -S AHHOME -d KSESSIONS -U sa -P <password> -i rollback-20251020-add-canvastype-column.sql

SET NOCOUNT ON;
PRINT '';
PRINT '========================================';
PRINT 'Rollback: Remove CanvasType Column';
PRINT 'Database: ' + DB_NAME();
PRINT 'Date: ' + CONVERT(VARCHAR, GETDATE(), 120);
PRINT '========================================';
PRINT '';

-- =============================================
-- STEP 1: Validation
-- =============================================
PRINT '>> STEP 1: Validation Checks';
PRINT '';

-- Confirm database
DECLARE @DbName NVARCHAR(128) = DB_NAME();
IF @DbName NOT IN ('KSESSIONS_DEV', 'KSESSIONS')
BEGIN
    PRINT '  ❌ ERROR: Invalid database: ' + @DbName;
    PRINT '           Expected: KSESSIONS_DEV or KSESSIONS';
    RAISERROR('Rollback aborted - wrong database', 16, 1);
    RETURN;
END
PRINT '  ✅ Database confirmed: ' + @DbName;

-- Check if canvas schema exists
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'canvas')
BEGIN
    PRINT '  ⚠️  canvas schema does not exist - nothing to rollback';
    RETURN;
END
PRINT '  ✅ canvas schema exists';

-- Check if canvas.Sessions table exists
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE schema_id = SCHEMA_ID('canvas') AND name = 'Sessions')
BEGIN
    PRINT '  ⚠️  canvas.Sessions table does not exist - nothing to rollback';
    RETURN;
END
PRINT '  ✅ canvas.Sessions table exists';

-- Check if CanvasType column exists
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'canvas' 
    AND TABLE_NAME = 'Sessions' 
    AND COLUMN_NAME = 'CanvasType'
)
BEGIN
    PRINT '  ⚠️  CanvasType column does not exist - nothing to rollback';
    PRINT '';
    PRINT '========================================';
    PRINT '✅ Rollback not needed (column not found)';
    PRINT '========================================';
    RETURN;
END
PRINT '  ✅ CanvasType column found - rollback needed';

-- Display record count
DECLARE @RecordCount INT;
SELECT @RecordCount = COUNT(*) FROM [canvas].[Sessions];
PRINT '  ℹ️  Sessions affected: ' + CAST(@RecordCount AS VARCHAR);

-- Production safety warning
IF @DbName = 'KSESSIONS'
BEGIN
    PRINT '';
    PRINT '  ⚠️⚠️⚠️  PRODUCTION ROLLBACK WARNING  ⚠️⚠️⚠️';
    PRINT '  This will remove the CanvasType column from PRODUCTION';
    PRINT '  All host canvas selections will be lost';
    PRINT '  UserLanding routing will revert to SessionCanvas only';
    PRINT '';
    PRINT '  Press Ctrl+C within 10 seconds to abort...';
    WAITFOR DELAY '00:00:10';
    PRINT '  Proceeding with production rollback...';
END

-- =============================================
-- STEP 2: Drop Index
-- =============================================
PRINT '';
PRINT '>> STEP 2: Drop Performance Index';
PRINT '';

BEGIN TRY
    IF EXISTS (
        SELECT 1 FROM sys.indexes 
        WHERE name = 'IX_Sessions_CanvasType' 
        AND object_id = OBJECT_ID('canvas.Sessions')
    )
    BEGIN
        DROP INDEX IX_Sessions_CanvasType ON [canvas].[Sessions];
        PRINT '  ✅ Dropped index IX_Sessions_CanvasType';
    END
    ELSE
    BEGIN
        PRINT '  ℹ️  Index IX_Sessions_CanvasType does not exist';
    END
END TRY
BEGIN CATCH
    PRINT '  ❌ ERROR dropping index: ' + ERROR_MESSAGE();
    PRINT '  ⚠️  Continuing with column removal...';
    -- Continue even if index drop fails
END CATCH

-- =============================================
-- STEP 3: Drop CanvasType Column
-- =============================================
PRINT '';
PRINT '>> STEP 3: Drop CanvasType Column';
PRINT '';

BEGIN TRY
    -- Backup data for safety (optional - commented out by default)
    -- SELECT SessionId, CanvasType INTO canvas.Sessions_CanvasType_Backup FROM canvas.Sessions;
    -- PRINT '  ℹ️  Data backed up to canvas.Sessions_CanvasType_Backup';
    
    ALTER TABLE [canvas].[Sessions]
    DROP COLUMN [CanvasType];
    
    PRINT '  ✅ Dropped CanvasType column';
    PRINT '     - All canvas type data removed';
    PRINT '     - Host selections lost';
END TRY
BEGIN CATCH
    PRINT '  ❌ ERROR dropping column: ' + ERROR_MESSAGE();
    RAISERROR('Rollback failed at STEP 3', 16, 1);
    RETURN;
END CATCH

-- =============================================
-- STEP 4: Verification
-- =============================================
PRINT '';
PRINT '>> STEP 4: Verification';
PRINT '';

-- Verify column removed
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'canvas' 
    AND TABLE_NAME = 'Sessions' 
    AND COLUMN_NAME = 'CanvasType'
)
    PRINT '  ✅ CanvasType column successfully removed';
ELSE
BEGIN
    PRINT '  ❌ ERROR: CanvasType column still exists';
    RAISERROR('Rollback verification failed', 16, 1);
    RETURN;
END

-- Verify index removed
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = 'IX_Sessions_CanvasType' 
    AND object_id = OBJECT_ID('canvas.Sessions')
)
    PRINT '  ✅ Index successfully removed';
ELSE
    PRINT '  ⚠️  Warning: Index may still exist (manual removal needed)';

-- =============================================
-- STEP 5: Rollback Summary
-- =============================================
PRINT '';
PRINT '========================================';
PRINT '✅ Rollback Completed Successfully';
PRINT '========================================';
PRINT '';
PRINT 'Summary:';
PRINT '  - Database: ' + @DbName;
PRINT '  - Column Removed: canvas.Sessions.CanvasType';
PRINT '  - Index Removed: IX_Sessions_CanvasType';
PRINT '  - Sessions Affected: ' + CAST(@RecordCount AS VARCHAR);
PRINT '';
PRINT 'Post-Rollback Actions:';
PRINT '  1. Revert code changes to UserLanding.razor';
PRINT '  2. Revert code changes to HostController.cs';
PRINT '  3. Redeploy application without CanvasType logic';
PRINT '  4. Verify routing defaults to SessionCanvas';
PRINT '';
PRINT 'To Restore (if needed):';
PRINT '  1. Run migration script: migration-20251020-add-canvastype-column.sql';
PRINT '  2. Redeploy application with CanvasType logic';
PRINT '';
IF @DbName = 'KSESSIONS'
    PRINT '⚠️  PRODUCTION: Monitor application logs for routing issues';
PRINT '';
PRINT '========================================';
GO
