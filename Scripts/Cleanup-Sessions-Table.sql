-- NOOR CANVAS: Sessions Table Cleanup Script
-- Purpose: Remove unused columns from canvas.Sessions table 
-- Date: $(date)
-- Analysis: 4 token-related columns identified as unused in business logic

-- SAFETY CHECKS SECTION
PRINT '=== NOOR CANVAS SESSIONS TABLE CLEANUP ==='
PRINT 'Starting safety checks...'

-- Check if we're in the correct database
IF DB_NAME() != 'KSESSIONS_DEV'
BEGIN
    RAISERROR('ERROR: This script must be run against KSESSIONS_DEV database only!', 16, 1)
    RETURN
END

-- Check if canvas.Sessions table exists
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'canvas' AND TABLE_NAME = 'Sessions')
BEGIN
    RAISERROR('ERROR: canvas.Sessions table not found!', 16, 1)
    RETURN
END

-- BACKUP SECTION
PRINT 'Creating backup table...'

-- Create backup table with timestamp
DECLARE @BackupTableName NVARCHAR(128)
SET @BackupTableName = 'Sessions_Backup_' + FORMAT(GETDATE(), 'yyyyMMdd_HHmmss')

DECLARE @BackupSQL NVARCHAR(MAX)
SET @BackupSQL = 'SELECT * INTO canvas.' + @BackupTableName + ' FROM canvas.Sessions'

PRINT 'Backup table name: canvas.' + @BackupTableName
EXEC sp_executesql @BackupSQL

-- Verify backup
DECLARE @BackupCount INT
DECLARE @OriginalCount INT
DECLARE @BackupCountSQL NVARCHAR(MAX)

SELECT @OriginalCount = COUNT(*) FROM canvas.Sessions

SET @BackupCountSQL = N'SELECT @Count = COUNT(*) FROM canvas.' + @BackupTableName
EXEC sp_executesql @BackupCountSQL, N'@Count INT OUTPUT', @Count = @BackupCount OUTPUT

IF @BackupCount != @OriginalCount
BEGIN
    RAISERROR('ERROR: Backup verification failed! Original: %d, Backup: %d', 16, 1, @OriginalCount, @BackupCount)
    RETURN
END

PRINT 'Backup created successfully: ' + CAST(@BackupCount AS VARCHAR) + ' rows backed up.'

-- PRE-CLEANUP ANALYSIS
PRINT 'Analyzing columns to be removed...'

-- Check current data in columns to be removed
SELECT 
    'TokenExpiresAt' as ColumnName,
    COUNT(*) as TotalRows,
    COUNT(TokenExpiresAt) as NonNullRows,
    CASE WHEN COUNT(TokenExpiresAt) = 0 THEN 'SAFE TO REMOVE' ELSE 'CONTAINS DATA' END as Status
FROM canvas.Sessions

UNION ALL

SELECT 
    'TokenAccessCount',
    COUNT(*),
    COUNT(CASE WHEN TokenAccessCount != 0 THEN 1 END),
    CASE WHEN COUNT(CASE WHEN TokenAccessCount != 0 THEN 1 END) = 0 THEN 'SAFE TO REMOVE' ELSE 'CONTAINS DATA' END
FROM canvas.Sessions

UNION ALL

SELECT 
    'TokenCreatedByIp',
    COUNT(*),
    COUNT(TokenCreatedByIp),
    CASE WHEN COUNT(TokenCreatedByIp) = 0 THEN 'SAFE TO REMOVE' ELSE 'CONTAINS DATA' END
FROM canvas.Sessions

UNION ALL

SELECT 
    'TokenLastAccessedAt',
    COUNT(*),
    COUNT(TokenLastAccessedAt),
    CASE WHEN COUNT(TokenLastAccessedAt) = 0 THEN 'SAFE TO REMOVE' ELSE 'CONTAINS DATA' END
FROM canvas.Sessions

-- COLUMN REMOVAL SECTION
PRINT 'Starting column removal...'

BEGIN TRANSACTION CleanupTransaction

BEGIN TRY
    -- Remove TokenExpiresAt column
    PRINT 'Removing TokenExpiresAt column...'
    ALTER TABLE canvas.Sessions DROP COLUMN TokenExpiresAt
    
    -- Remove TokenAccessCount column  
    PRINT 'Removing TokenAccessCount column...'
    ALTER TABLE canvas.Sessions DROP COLUMN TokenAccessCount
    
    -- Remove TokenCreatedByIp column
    PRINT 'Removing TokenCreatedByIp column...'
    ALTER TABLE canvas.Sessions DROP COLUMN TokenCreatedByIp
    
    -- Remove TokenLastAccessedAt column
    PRINT 'Removing TokenLastAccessedAt column...'
    ALTER TABLE canvas.Sessions DROP COLUMN TokenLastAccessedAt
    
    -- Verify final table structure
    PRINT 'Verifying final table structure...'
    
    SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        COLUMN_DEFAULT
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'canvas' AND TABLE_NAME = 'Sessions'
    ORDER BY ORDINAL_POSITION
    
    -- Commit transaction
    COMMIT TRANSACTION CleanupTransaction
    PRINT 'SUCCESS: All unused columns removed successfully!'
    PRINT 'Backup table preserved as: canvas.' + @BackupTableName
    
END TRY
BEGIN CATCH
    -- Rollback on error
    ROLLBACK TRANSACTION CleanupTransaction
    
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE()
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY()
    DECLARE @ErrorState INT = ERROR_STATE()
    
    PRINT 'ERROR: Column removal failed!'
    PRINT 'Error Message: ' + @ErrorMessage
    PRINT 'Backup table preserved as: canvas.' + @BackupTableName
    
    RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState)
END CATCH

-- FINAL VERIFICATION
PRINT 'Final verification...'
PRINT 'Columns remaining in canvas.Sessions:'

SELECT 
    ORDINAL_POSITION as [Order],
    COLUMN_NAME as [Column], 
    DATA_TYPE as [Type],
    IS_NULLABLE as [Nullable]
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'canvas' AND TABLE_NAME = 'Sessions'
ORDER BY ORDINAL_POSITION

PRINT 'Expected remaining columns: 15 (removed 4 unused token columns)'

-- ROLLBACK INSTRUCTIONS (for reference)
PRINT '=== ROLLBACK INSTRUCTIONS (if needed) ==='
PRINT 'If you need to restore the original table structure:'
PRINT '1. DROP TABLE canvas.Sessions'  
PRINT '2. SELECT * INTO canvas.Sessions FROM canvas.' + @BackupTableName
PRINT '3. Recreate primary key and constraints as needed'
PRINT '=== END CLEANUP SCRIPT ==='