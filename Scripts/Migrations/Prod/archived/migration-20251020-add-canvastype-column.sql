-- =============================================
-- Migration: Add CanvasType Column to canvas.Sessions
-- Database: KSESSIONS (PRODUCTION)
-- Date: 2025-10-20
-- Author: GitHub Copilot (user-landing key)
-- Protocol: deployment-migration v1.0
-- =============================================
-- Purpose: Persist host's canvas selection (Asset Share vs Section Share)
--          to enable intelligent routing on UserLanding.razor
-- =============================================
-- PRODUCTION DEPLOYMENT: This script targets KSESSIONS (production database)
-- =============================================

USE [KSESSIONS];
GO

SET NOCOUNT ON;
PRINT '';
PRINT '========================================';
PRINT 'Add CanvasType to canvas.Sessions';
PRINT 'Database: ' + DB_NAME();
PRINT 'Date: ' + CONVERT(VARCHAR, GETDATE(), 120);
PRINT 'Environment: PRODUCTION';
PRINT '========================================';
PRINT '';

-- =============================================
-- STEP 1: Validation Checks
-- =============================================
PRINT '>> STEP 1: Validation Checks';
PRINT '';

-- Check if canvas schema exists
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'canvas')
BEGIN
    RAISERROR('ERROR: canvas schema does not exist', 16, 1);
    RETURN;
END
PRINT '  ✅ canvas schema exists';

-- Check if canvas.Sessions table exists
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE schema_id = SCHEMA_ID('canvas') AND name = 'Sessions')
BEGIN
    RAISERROR('ERROR: canvas.Sessions table does not exist', 16, 1);
    RETURN;
END
PRINT '  ✅ canvas.Sessions table exists';

-- Check if column already exists (idempotency check)
IF EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'canvas' 
    AND TABLE_NAME = 'Sessions' 
    AND COLUMN_NAME = 'CanvasType'
)
BEGIN
    PRINT '  ⚠️  CanvasType column already exists - migration skipped';
    PRINT '';
    PRINT '========================================';
    PRINT '✅ Migration already applied (idempotent)';
    PRINT '========================================';
    RETURN;
END
PRINT '  ✅ CanvasType column does not exist - migration needed';

-- Display current record count
DECLARE @RecordCount INT;
SELECT @RecordCount = COUNT(*) FROM [canvas].[Sessions];
PRINT '  ℹ️  Current sessions count: ' + CAST(@RecordCount AS VARCHAR);

-- Production safety check
IF @RecordCount > 1000
BEGIN
    PRINT '  ⚠️  WARNING: Large dataset detected (' + CAST(@RecordCount AS VARCHAR) + ' records)';
    PRINT '              Migration will update all existing rows to ''asset''';
    PRINT '              Estimated time: ' + CAST((@RecordCount / 1000) AS VARCHAR) + ' seconds';
END

-- =============================================
-- STEP 2: Add CanvasType Column
-- =============================================
PRINT '';
PRINT '>> STEP 2: Add CanvasType Column';
PRINT '';

BEGIN TRY
    ALTER TABLE [canvas].[Sessions]
    ADD [CanvasType] NVARCHAR(20) NULL DEFAULT 'asset';
    
    PRINT '  ✅ Added CanvasType column';
    PRINT '     - Data Type: NVARCHAR(20)';
    PRINT '     - Nullable: YES (backward compatible)';
    PRINT '     - Default: ''asset''';
    PRINT '     - Allowed Values: ''asset'' | ''transcript''';
END TRY
BEGIN CATCH
    PRINT '  ❌ ERROR adding column: ' + ERROR_MESSAGE();
    RAISERROR('Migration failed at STEP 2', 16, 1);
    RETURN;
END CATCH

-- =============================================
-- STEP 3: Update Existing Sessions
-- =============================================
PRINT '';
PRINT '>> STEP 3: Update Existing Sessions';
PRINT '';

BEGIN TRY
    -- Update NULL values to 'asset' (default behavior)
    -- For production, update in batches to avoid lock escalation
    DECLARE @BatchSize INT = 1000;
    DECLARE @UpdatedCount INT = 0;
    DECLARE @TotalUpdated INT = 0;
    
    WHILE 1 = 1
    BEGIN
        UPDATE TOP (@BatchSize) [canvas].[Sessions]
        SET [CanvasType] = 'asset'
        WHERE [CanvasType] IS NULL;
        
        SET @UpdatedCount = @@ROWCOUNT;
        SET @TotalUpdated = @TotalUpdated + @UpdatedCount;
        
        IF @UpdatedCount = 0
            BREAK;
            
        IF @TotalUpdated % 5000 = 0
            PRINT '  ℹ️  Progress: Updated ' + CAST(@TotalUpdated AS VARCHAR) + ' rows...';
    END
    
    PRINT '  ✅ Updated ' + CAST(@TotalUpdated AS VARCHAR) + ' existing sessions to ''asset''';
    
    IF @TotalUpdated = 0
        PRINT '     (No sessions needed update - all have default value)';
END TRY
BEGIN CATCH
    PRINT '  ❌ ERROR updating existing rows: ' + ERROR_MESSAGE();
    RAISERROR('Migration failed at STEP 3', 16, 1);
    RETURN;
END CATCH

-- =============================================
-- STEP 4: Create Performance Index
-- =============================================
PRINT '';
PRINT '>> STEP 4: Create Performance Index';
PRINT '';

BEGIN TRY
    -- Check if index already exists
    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes 
        WHERE name = 'IX_Sessions_CanvasType' 
        AND object_id = OBJECT_ID('canvas.Sessions')
    )
    BEGIN
        CREATE NONCLUSTERED INDEX IX_Sessions_CanvasType 
        ON [canvas].[Sessions]([CanvasType])
        INCLUDE ([SessionId], [UserToken], [Status]);
        
        PRINT '  ✅ Created index IX_Sessions_CanvasType';
        PRINT '     - Type: NONCLUSTERED';
        PRINT '     - Key Column: CanvasType';
        PRINT '     - Included: SessionId, UserToken, Status';
        PRINT '     - Purpose: Optimize UserLanding.razor queries';
    END
    ELSE
    BEGIN
        PRINT '  ⚠️  Index IX_Sessions_CanvasType already exists';
    END
END TRY
BEGIN CATCH
    PRINT '  ❌ ERROR creating index: ' + ERROR_MESSAGE();
    PRINT '  ⚠️  Warning: Migration succeeded but index creation failed';
    PRINT '             Manual index creation recommended for performance';
    -- Don't fail migration - index is optional optimization
END CATCH

-- =============================================
-- STEP 5: Verification & Summary
-- =============================================
PRINT '';
PRINT '>> STEP 5: Verification';
PRINT '';

-- Verify column structure
SELECT 
    COLUMN_NAME as [Column],
    DATA_TYPE as [Type],
    CHARACTER_MAXIMUM_LENGTH as [MaxLength],
    IS_NULLABLE as [Nullable],
    COLUMN_DEFAULT as [Default]
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'canvas' 
AND TABLE_NAME = 'Sessions'
AND COLUMN_NAME = 'CanvasType';

-- Verify data distribution
PRINT '';
PRINT '  Data Distribution:';
SELECT 
    ISNULL([CanvasType], '(NULL)') as [CanvasType],
    COUNT(*) as [SessionCount]
FROM [canvas].[Sessions]
GROUP BY [CanvasType]
ORDER BY [CanvasType];

-- Verify index
PRINT '';
IF EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = 'IX_Sessions_CanvasType' 
    AND object_id = OBJECT_ID('canvas.Sessions')
)
    PRINT '  ✅ Index verified: IX_Sessions_CanvasType';
ELSE
    PRINT '  ⚠️  Index not found (manual creation needed)';

-- =============================================
-- STEP 6: Migration Summary
-- =============================================
PRINT '';
PRINT '========================================';
PRINT '✅ PRODUCTION Migration Completed';
PRINT '========================================';
PRINT '';
PRINT 'Summary:';
PRINT '  - Environment: PRODUCTION (KSESSIONS)';
PRINT '  - Column: canvas.Sessions.CanvasType';
PRINT '  - Type: NVARCHAR(20) NULL DEFAULT ''asset''';
PRINT '  - Records Updated: ' + CAST(@TotalUpdated AS VARCHAR);
PRINT '  - Index: IX_Sessions_CanvasType';
PRINT '';
PRINT 'Post-Deployment Verification:';
PRINT '  1. Check recent sessions: SELECT TOP 5 SessionId, CanvasType, Status FROM canvas.Sessions ORDER BY CreatedAt DESC';
PRINT '  2. Monitor application logs for [user-landing] entries';
PRINT '  3. Test Asset Share flow: Host creates session → User registers → Routes to SessionCanvas';
PRINT '  4. Test Section Share flow: Host creates session → User registers → Routes to TranscriptCanvas';
PRINT '';
PRINT 'Rollback (if needed):';
PRINT '  sqlcmd -S AHHOME -d KSESSIONS -U sa -P <password> -i rollback-20251020-add-canvastype-column.sql';
PRINT '';
PRINT '========================================';
GO
