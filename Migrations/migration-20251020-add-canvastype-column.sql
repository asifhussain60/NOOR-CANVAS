-- =============================================
-- Migration: Add CanvasType Column to canvas.Sessions
-- Database: KSESSIONS_DEV
-- Date: 2025-10-20
-- Author: GitHub Copilot (user-landing key)
-- Protocol: deployment-migration v1.0
-- =============================================
-- Purpose: Persist host's canvas selection (Asset Share vs Section Share)
--          to enable intelligent routing on UserLanding.razor
-- =============================================

USE [KSESSIONS_DEV];
GO

SET NOCOUNT ON;
PRINT '';
PRINT '========================================';
PRINT 'Add CanvasType to canvas.Sessions';
PRINT 'Database: ' + DB_NAME();
PRINT 'Date: ' + CONVERT(VARCHAR, GETDATE(), 120);
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
DECLARE @UpdatedCount INT = 0;
SELECT @RecordCount = COUNT(*) FROM [canvas].[Sessions];
PRINT '  ℹ️  Current sessions count: ' + CAST(@RecordCount AS VARCHAR);

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
    -- Note: Most rows will already have 'asset' from DEFAULT constraint
    UPDATE [canvas].[Sessions]
    SET [CanvasType] = 'asset'
    WHERE [CanvasType] IS NULL;
    
    SET @UpdatedCount = @@ROWCOUNT;
    PRINT '  ✅ Updated ' + CAST(@UpdatedCount AS VARCHAR) + ' existing sessions to ''asset''';
    
    IF @UpdatedCount = 0
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
PRINT '✅ Migration Completed Successfully';
PRINT '========================================';
PRINT '';
PRINT 'Summary:';
PRINT '  - Column: canvas.Sessions.CanvasType';
PRINT '  - Type: NVARCHAR(20) NULL DEFAULT ''asset''';
PRINT '  - Records Updated: ' + CAST(@UpdatedCount AS VARCHAR);
PRINT '  - Index: IX_Sessions_CanvasType';
PRINT '';
PRINT 'Next Steps:';
PRINT '  1. Verify column exists: SELECT TOP 5 SessionId, CanvasType FROM canvas.Sessions';
PRINT '  2. Test API: Update HostController.StartSession to save CanvasType';
PRINT '  3. Test routing: Update UserLanding.razor to read CanvasType';
PRINT '  4. Run E2E tests: Scripts/run-user-landing-routing-tests.ps1';
PRINT '';
PRINT 'Rollback:';
PRINT '  If needed, run: rollback-20251020-add-canvastype-column.sql';
PRINT '';
PRINT '========================================';
GO
