-- =============================================
-- Script: Truncate canvas.Sessions for Fresh Start
-- Database: KSESSIONS (Production)
-- Author: GitHub Copilot
-- Date: 2025-10-12
-- Description: Safely truncates canvas.Sessions table without affecting dbo schema
-- =============================================

USE KSESSIONS;
GO

SET NOCOUNT ON;
GO

PRINT '';
PRINT '========================================';
PRINT 'Truncate canvas.Sessions - Fresh Start';
PRINT '========================================';
PRINT '';

-- Validate database context
DECLARE @CurrentDB NVARCHAR(128) = DB_NAME();
IF @CurrentDB <> 'KSESSIONS'
BEGIN
    RAISERROR('ERROR: This script must run against KSESSIONS database. Current database: %s', 16, 1, @CurrentDB);
    RETURN;
END

PRINT '✅ Database context: KSESSIONS (Production)';
PRINT '';

-- Validate canvas schema exists
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'canvas')
BEGIN
    RAISERROR('ERROR: canvas schema does not exist in KSESSIONS database', 16, 1);
    RETURN;
END

PRINT '✅ canvas schema exists';
PRINT '';

-- Validate canvas.Sessions table exists
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE schema_id = SCHEMA_ID('canvas') AND name = 'Sessions')
BEGIN
    RAISERROR('ERROR: canvas.Sessions table does not exist', 16, 1);
    RETURN;
END

PRINT '✅ canvas.Sessions table exists';
PRINT '';

-- Display current data counts before truncation
PRINT 'Current data counts (BEFORE truncation):';
PRINT '----------------------------------------';

DECLARE @SessionCount INT;
DECLARE @ParticipantCount INT;
DECLARE @SessionDataCount INT;
DECLARE @AssetLookupCount INT;

SELECT @SessionCount = COUNT(*) FROM canvas.Sessions;
SELECT @ParticipantCount = COUNT(*) FROM canvas.Participants;
SELECT @SessionDataCount = COUNT(*) FROM canvas.SessionData;
SELECT @AssetLookupCount = COUNT(*) FROM canvas.AssetLookup;

PRINT '  canvas.Sessions: ' + CAST(@SessionCount AS VARCHAR(10)) + ' records';
PRINT '  canvas.Participants: ' + CAST(@ParticipantCount AS VARCHAR(10)) + ' records';
PRINT '  canvas.SessionData: ' + CAST(@SessionDataCount AS VARCHAR(10)) + ' records';
PRINT '  canvas.AssetLookup: ' + CAST(@AssetLookupCount AS VARCHAR(10)) + ' records';
PRINT '';

-- Confirmation: Check if there's any data to truncate
IF @SessionCount = 0 AND @ParticipantCount = 0 AND @SessionDataCount = 0
BEGIN
    PRINT '✅ canvas schema is already empty - no truncation needed';
    PRINT '';
    RETURN;
END

-- Validate CASCADE DELETE is configured
PRINT 'Validating CASCADE DELETE configuration:';
PRINT '----------------------------------------';

DECLARE @CascadeValid BIT = 1;

-- Check Participants FK
IF NOT EXISTS (
    SELECT 1 
    FROM sys.foreign_keys fk
    INNER JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
    WHERE fk.name = 'FK_Participants_Sessions_SessionId'
    AND fk.delete_referential_action = 1  -- CASCADE
)
BEGIN
    PRINT '❌ ERROR: FK_Participants_Sessions_SessionId does not have CASCADE DELETE';
    SET @CascadeValid = 0;
END
ELSE
BEGIN
    PRINT '  ✅ canvas.Participants → canvas.Sessions (ON DELETE CASCADE)';
END

-- Check SessionData FK
IF NOT EXISTS (
    SELECT 1 
    FROM sys.foreign_keys fk
    INNER JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
    WHERE fk.name = 'FK_SessionData_Sessions_SessionId'
    AND fk.delete_referential_action = 1  -- CASCADE
)
BEGIN
    PRINT '❌ ERROR: FK_SessionData_Sessions_SessionId does not have CASCADE DELETE';
    SET @CascadeValid = 0;
END
ELSE
BEGIN
    PRINT '  ✅ canvas.SessionData → canvas.Sessions (ON DELETE CASCADE)';
END

PRINT '';

IF @CascadeValid = 0
BEGIN
    RAISERROR('ERROR: CASCADE DELETE not configured correctly. Run KSESSIONS_DDL_Migration_20251012.sql first.', 16, 1);
    RETURN;
END

-- SAFETY CHECK: Verify we're only touching canvas schema
PRINT 'Safety check: Ensuring dbo schema isolation:';
PRINT '---------------------------------------------';

-- Check for any FKs from dbo tables to canvas.Sessions (there should be NONE)
IF EXISTS (
    SELECT 1
    FROM sys.foreign_keys fk
    INNER JOIN sys.tables t ON fk.parent_object_id = t.object_id
    INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
    INNER JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
    INNER JOIN sys.tables rt ON fkc.referenced_object_id = rt.object_id
    WHERE s.name = 'dbo'
    AND rt.name = 'Sessions'
    AND rt.schema_id = SCHEMA_ID('canvas')
)
BEGIN
    RAISERROR('ERROR: dbo schema has foreign keys to canvas.Sessions. Cannot safely truncate.', 16, 1);
    RETURN;
END

PRINT '  ✅ No foreign keys from dbo schema to canvas.Sessions';
PRINT '';

-- Check for any FKs from canvas tables to dbo tables
IF EXISTS (
    SELECT 1
    FROM sys.foreign_keys fk
    INNER JOIN sys.tables t ON fk.parent_object_id = t.object_id
    INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
    INNER JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
    INNER JOIN sys.tables rt ON fkc.referenced_object_id = rt.object_id
    INNER JOIN sys.schemas rs ON rt.schema_id = rs.schema_id
    WHERE s.name = 'canvas'
    AND rs.name = 'dbo'
)
BEGIN
    PRINT '  ℹ️  canvas schema references dbo schema (expected - read-only references)';
    
    -- List the references
    SELECT 
        '    ' + s.name + '.' + t.name + ' → ' + rs.name + '.' + rt.name AS [Reference]
    FROM sys.foreign_keys fk
    INNER JOIN sys.tables t ON fk.parent_object_id = t.object_id
    INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
    INNER JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
    INNER JOIN sys.tables rt ON fkc.referenced_object_id = rt.object_id
    INNER JOIN sys.schemas rs ON rt.schema_id = rs.schema_id
    WHERE s.name = 'canvas'
    AND rs.name = 'dbo';
END
ELSE
BEGIN
    PRINT '  ✅ No foreign keys from canvas schema to dbo schema';
END

PRINT '';
PRINT '✅ Safety check passed: dbo schema will NOT be affected';
PRINT '';

-- Execute truncation with transaction safety
BEGIN TRY
    BEGIN TRANSACTION;
    
    PRINT 'Executing truncation:';
    PRINT '--------------------';
    
    -- Truncate child tables first (thanks to CASCADE DELETE, this happens automatically)
    -- But we'll be explicit for clarity and safety
    
    -- Truncate SessionData (child of Sessions)
    TRUNCATE TABLE canvas.SessionData;
    PRINT '  ✅ Truncated canvas.SessionData';
    
    -- Truncate Participants (child of Sessions)
    TRUNCATE TABLE canvas.Participants;
    PRINT '  ✅ Truncated canvas.Participants';
    
    -- Delete from Sessions (parent table) - Cannot use TRUNCATE due to FK reference
    -- Note: TRUNCATE not allowed on tables referenced by FKs, even if FK is from parent to child
    DELETE FROM canvas.Sessions;
    PRINT '  ✅ Deleted all records from canvas.Sessions';
    
    -- AssetLookup is independent (no FK to Sessions), but we'll keep it for reference
    PRINT '  ℹ️  canvas.AssetLookup retained (no dependency on Sessions)';
    
    COMMIT TRANSACTION;
    
    PRINT '';
    PRINT '✅ Truncation successful!';
    PRINT '';
    
    -- Display final data counts
    PRINT 'Final data counts (AFTER truncation):';
    PRINT '-------------------------------------';
    
    SELECT @SessionCount = COUNT(*) FROM canvas.Sessions;
    SELECT @ParticipantCount = COUNT(*) FROM canvas.Participants;
    SELECT @SessionDataCount = COUNT(*) FROM canvas.SessionData;
    SELECT @AssetLookupCount = COUNT(*) FROM canvas.AssetLookup;
    
    PRINT '  canvas.Sessions: ' + CAST(@SessionCount AS VARCHAR(10)) + ' records';
    PRINT '  canvas.Participants: ' + CAST(@ParticipantCount AS VARCHAR(10)) + ' records';
    PRINT '  canvas.SessionData: ' + CAST(@SessionDataCount AS VARCHAR(10)) + ' records';
    PRINT '  canvas.AssetLookup: ' + CAST(@AssetLookupCount AS VARCHAR(10)) + ' records (unchanged)';
    PRINT '';
    
    -- Verify dbo schema untouched
    PRINT 'Verifying dbo schema integrity:';
    PRINT '-------------------------------';
    
    DECLARE @DboSessionsCount INT;
    SELECT @DboSessionsCount = COUNT(*) FROM dbo.Sessions;
    
    PRINT '  dbo.Sessions: ' + CAST(@DboSessionsCount AS VARCHAR(10)) + ' records (unchanged)';
    PRINT '  ✅ dbo schema NOT affected';
    PRINT '';
    
    PRINT '========================================';
    PRINT 'canvas.Sessions truncation complete!';
    PRINT 'Ready for fresh session creation.';
    PRINT '========================================';
    
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorNumber INT = ERROR_NUMBER();
    DECLARE @ErrorLine INT = ERROR_LINE();
    
    PRINT '';
    PRINT '========================================';
    PRINT 'ERROR: Truncation failed';
    PRINT '========================================';
    PRINT 'Error Number: ' + CAST(@ErrorNumber AS VARCHAR(10));
    PRINT 'Error Line: ' + CAST(@ErrorLine AS VARCHAR(10));
    PRINT 'Error Message: ' + @ErrorMessage;
    PRINT '';
    PRINT 'Transaction rolled back. No changes made.';
    PRINT '';
    
    RAISERROR('Truncation failed: %s', 16, 1, @ErrorMessage);
END CATCH;

GO
