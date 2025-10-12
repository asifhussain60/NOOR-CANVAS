-- =============================================
-- Script: Fix canvas.Sessions.SessionId Schema
-- Database: KSESSIONS_DEV and KSESSIONS (Production)
-- Author: GitHub Copilot
-- Date: 2025-10-12
-- Description: Remove IDENTITY from canvas.Sessions.SessionId and add FK to dbo.Sessions.SessionID
-- =============================================
-- CRITICAL: canvas.Sessions.SessionId should reference dbo.Sessions.SessionID (Islamic learning sessions)
-- NOT be an auto-increment identity column
-- =============================================

USE KSESSIONS_DEV; -- Change to KSESSIONS for production
GO

SET NOCOUNT ON;
GO

PRINT '';
PRINT '========================================';
PRINT 'Fix canvas.Sessions.SessionId Schema';
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
    DECLARE @DbName NVARCHAR(128) = DB_NAME();
    RAISERROR('ERROR: canvas schema does not exist in database %s', 16, 1, @DbName);
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

-- Check if dbo.Sessions table exists
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE schema_id = SCHEMA_ID('dbo') AND name = 'Sessions')
BEGIN
    RAISERROR('ERROR: dbo.Sessions table does not exist - cannot create FK', 16, 1);
    RETURN;
END
PRINT '  ✅ dbo.Sessions table exists';

-- Check current SessionId column definition
DECLARE @IsIdentity BIT;
DECLARE @CurrentDataType NVARCHAR(50);

SELECT 
    @IsIdentity = c.is_identity,
    @CurrentDataType = t.name + 
        CASE 
            WHEN t.name IN ('varchar', 'nvarchar', 'char', 'nchar') 
            THEN '(' + CASE WHEN c.max_length = -1 THEN 'MAX' ELSE CAST(c.max_length AS VARCHAR) END + ')'
            WHEN t.name IN ('decimal', 'numeric')
            THEN '(' + CAST(c.precision AS VARCHAR) + ',' + CAST(c.scale AS VARCHAR) + ')'
            ELSE ''
        END
FROM sys.columns c
INNER JOIN sys.types t ON c.user_type_id = t.user_type_id
WHERE c.object_id = OBJECT_ID('canvas.Sessions')
AND c.name = 'SessionId';

PRINT '  Current SessionId configuration:';
PRINT '    - Data Type: ' + @CurrentDataType;
PRINT '    - IDENTITY: ' + CASE WHEN @IsIdentity = 1 THEN 'YES (NEEDS FIX)' ELSE 'NO (Already correct)' END;

-- Check if FK already exists
IF EXISTS (
    SELECT 1 
    FROM sys.foreign_keys 
    WHERE name = 'FK_canvas_Sessions_dbo_Sessions'
    AND parent_object_id = OBJECT_ID('canvas.Sessions')
)
BEGIN
    PRINT '';
    PRINT '✅ Foreign key FK_canvas_Sessions_dbo_Sessions already exists';
    PRINT '   Schema is already correct. No changes needed.';
    PRINT '';
    RETURN;
END

-- If not IDENTITY and no FK, warn
IF @IsIdentity = 0
BEGIN
    PRINT '';
    PRINT '⚠️  WARNING: SessionId is not IDENTITY but FK is missing';
    PRINT '   Will add FK to dbo.Sessions';
    PRINT '';
END

-- =============================================
-- STEP 2: Check for Existing Data
-- =============================================
PRINT '';
PRINT '>> STEP 2: Data Validation';
PRINT '';

DECLARE @CanvasSessionCount INT;
DECLARE @ParticipantCount INT;
DECLARE @SessionDataCount INT;
DECLARE @InvalidReferences INT = 0;

SELECT @CanvasSessionCount = COUNT(*) FROM canvas.Sessions;
SELECT @ParticipantCount = COUNT(*) FROM canvas.Participants;
SELECT @SessionDataCount = COUNT(*) FROM canvas.SessionData;

PRINT '  Current data counts:';
PRINT '    - canvas.Sessions: ' + CAST(@CanvasSessionCount AS VARCHAR);
PRINT '    - canvas.Participants: ' + CAST(@ParticipantCount AS VARCHAR);
PRINT '    - canvas.SessionData: ' + CAST(@SessionDataCount AS VARCHAR);

-- Check if existing SessionId values reference valid dbo.Sessions records
IF @CanvasSessionCount > 0
BEGIN
    SELECT @InvalidReferences = COUNT(*)
    FROM canvas.Sessions cs
    LEFT JOIN dbo.Sessions ds ON cs.SessionId = ds.SessionID
    WHERE ds.SessionID IS NULL;
    
    IF @InvalidReferences > 0
    BEGIN
        PRINT '';
        PRINT '❌ ERROR: Found ' + CAST(@InvalidReferences AS VARCHAR) + ' canvas.Sessions records with invalid dbo.Sessions references';
        PRINT '   These SessionId values do not exist in dbo.Sessions:';
        
        SELECT cs.SessionId, cs.Status, cs.CreatedAt
        FROM canvas.Sessions cs
        LEFT JOIN dbo.Sessions ds ON cs.SessionId = ds.SessionID
        WHERE ds.SessionID IS NULL;
        
        PRINT '';
        PRINT '⚠️  MANUAL ACTION REQUIRED:';
        PRINT '   1. Update invalid SessionId values to reference valid dbo.Sessions.SessionID';
        PRINT '   2. Or DELETE canvas.Sessions records with invalid references';
        PRINT '   3. Then re-run this script';
        PRINT '';
        RAISERROR('Cannot proceed with invalid FK references', 16, 1);
        RETURN;
    END
    ELSE
    BEGIN
        PRINT '  ✅ All canvas.Sessions.SessionId values reference valid dbo.Sessions.SessionID';
    END
END

PRINT '';

-- =============================================
-- STEP 3: Schema Modification
-- =============================================
PRINT '>> STEP 3: Schema Modification';
PRINT '';

BEGIN TRY
    BEGIN TRANSACTION SchemaFix;
    
    -- STEP 3.1: Drop dependent foreign keys temporarily
    PRINT '  [3.1] Dropping dependent foreign keys...';
    
    DECLARE @DropFKSQL NVARCHAR(MAX) = '';
    DECLARE @RecreateFK TABLE (
        ConstraintName NVARCHAR(128),
        ParentTable NVARCHAR(128),
        ParentColumn NVARCHAR(128),
        DeleteRule NVARCHAR(20)
    );
    
    -- Store FK definitions for recreation
    INSERT INTO @RecreateFK (ConstraintName, ParentTable, ParentColumn, DeleteRule)
    SELECT 
        fk.name,
        OBJECT_NAME(fk.parent_object_id),
        COL_NAME(fkc.parent_object_id, fkc.parent_column_id),
        CASE fk.delete_referential_action
            WHEN 0 THEN 'NO ACTION'
            WHEN 1 THEN 'CASCADE'
            WHEN 2 THEN 'SET NULL'
            WHEN 3 THEN 'SET DEFAULT'
        END
    FROM sys.foreign_keys fk
    INNER JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
    WHERE fk.referenced_object_id = OBJECT_ID('canvas.Sessions')
    AND COL_NAME(fk.referenced_object_id, fkc.referenced_column_id) = 'SessionId';
    
    -- Drop FKs
    DECLARE @FKName NVARCHAR(128);
    DECLARE @TableName NVARCHAR(128);
    
    DECLARE fk_cursor CURSOR FOR
    SELECT ConstraintName, ParentTable FROM @RecreateFK;
    
    OPEN fk_cursor;
    FETCH NEXT FROM fk_cursor INTO @FKName, @TableName;
    
    WHILE @@FETCH_STATUS = 0
    BEGIN
        SET @DropFKSQL = 'ALTER TABLE [canvas].[' + @TableName + '] DROP CONSTRAINT [' + @FKName + ']';
        EXEC sp_executesql @DropFKSQL;
        PRINT '    ✅ Dropped FK: ' + @FKName;
        
        FETCH NEXT FROM fk_cursor INTO @FKName, @TableName;
    END
    
    CLOSE fk_cursor;
    DEALLOCATE fk_cursor;
    
    -- STEP 3.2: Rebuild canvas.Sessions table with correct schema
    PRINT '';
    PRINT '  [3.2] Rebuilding canvas.Sessions with correct schema...';
    
    -- Only rebuild if IDENTITY is currently enabled
    IF @IsIdentity = 1
    BEGIN
        -- Create temp table with exact structure
        CREATE TABLE [canvas].[Sessions_Temp] (
            [SessionId] INT NOT NULL,  -- Changed from BIGINT IDENTITY to INT (matches dbo.Sessions.SessionID)
            [AlbumId] UNIQUEIDENTIFIER NOT NULL DEFAULT ('00000000-0000-0000-0000-000000000000'),
            [HostToken] NVARCHAR(8) NOT NULL DEFAULT (''),
            [UserToken] NVARCHAR(8) NOT NULL DEFAULT (''),
            [Status] NVARCHAR(20) NOT NULL DEFAULT ('Active'),
            [CreatedAt] DATETIME2 NOT NULL DEFAULT (GETUTCDATE()),
            [ModifiedAt] DATETIME2 NOT NULL DEFAULT (GETUTCDATE()),
            [StartedAt] DATETIME2 NULL,
            [EndedAt] DATETIME2 NULL,
            [ExpiresAt] DATETIME2 NULL,
            [ParticipantCount] INT NULL DEFAULT ((0)),
            [MaxParticipants] INT NULL,
            [ScheduledDate] NVARCHAR(20) NULL,
            [ScheduledDuration] NVARCHAR(10) NULL,
            [ScheduledTime] NVARCHAR(20) NULL,
            CONSTRAINT [PK_canvas_Sessions_Temp] PRIMARY KEY CLUSTERED ([SessionId])
        );
        PRINT '    ✅ Created temp table canvas.Sessions_Temp';
        
        -- Copy existing data
        IF @CanvasSessionCount > 0
        BEGIN
            SET IDENTITY_INSERT [canvas].[Sessions_Temp] OFF; -- No IDENTITY in temp table
            
            INSERT INTO [canvas].[Sessions_Temp] (
                SessionId, AlbumId, HostToken, UserToken, Status,
                CreatedAt, ModifiedAt, StartedAt, EndedAt, ExpiresAt,
                ParticipantCount, MaxParticipants, ScheduledDate, ScheduledDuration, ScheduledTime
            )
            SELECT 
                CAST(SessionId AS INT), -- Convert BIGINT to INT
                AlbumId, HostToken, UserToken, Status,
                CreatedAt, ModifiedAt, StartedAt, EndedAt, ExpiresAt,
                ParticipantCount, MaxParticipants, ScheduledDate, ScheduledDuration, ScheduledTime
            FROM [canvas].[Sessions];
            
            PRINT '    ✅ Copied ' + CAST(@CanvasSessionCount AS VARCHAR) + ' records to temp table';
        END
        
        -- Drop original table
        DROP TABLE [canvas].[Sessions];
        PRINT '    ✅ Dropped original canvas.Sessions table';
        
        -- Rename temp table
        EXEC sp_rename '[canvas].[Sessions_Temp]', 'Sessions';
        EXEC sp_rename '[canvas].[PK_canvas_Sessions_Temp]', 'PK__Sessions__C9F49290FD14F53B', 'OBJECT';
        PRINT '    ✅ Renamed temp table to canvas.Sessions';
    END
    ELSE
    BEGIN
        PRINT '    ℹ️  SessionId is already non-IDENTITY - skipping table rebuild';
    END
    
    -- STEP 3.3: Add FK to dbo.Sessions
    PRINT '';
    PRINT '  [3.3] Adding foreign key to dbo.Sessions...';
    
    ALTER TABLE [canvas].[Sessions]
    ADD CONSTRAINT [FK_canvas_Sessions_dbo_Sessions]
    FOREIGN KEY ([SessionId]) REFERENCES [dbo].[Sessions]([SessionID])
    ON DELETE NO ACTION;  -- READ-ONLY dbo schema - no cascading deletes
    
    PRINT '    ✅ Added FK: FK_canvas_Sessions_dbo_Sessions';
    
    -- STEP 3.4: Recreate dependent foreign keys
    PRINT '';
    PRINT '  [3.4] Recreating dependent foreign keys...';
    
    DECLARE @RecreateFKSQL NVARCHAR(MAX);
    DECLARE @ParentTable NVARCHAR(128);
    DECLARE @ParentColumn NVARCHAR(128);
    DECLARE @DeleteRule NVARCHAR(20);
    
    DECLARE recreate_cursor CURSOR FOR
    SELECT ConstraintName, ParentTable, ParentColumn, DeleteRule FROM @RecreateFK;
    
    OPEN recreate_cursor;
    FETCH NEXT FROM recreate_cursor INTO @FKName, @ParentTable, @ParentColumn, @DeleteRule;
    
    WHILE @@FETCH_STATUS = 0
    BEGIN
        SET @RecreateFKSQL = 
            'ALTER TABLE [canvas].[' + @ParentTable + '] ' +
            'ADD CONSTRAINT [' + @FKName + '] ' +
            'FOREIGN KEY ([' + @ParentColumn + ']) ' +
            'REFERENCES [canvas].[Sessions]([SessionId]) ' +
            'ON DELETE ' + @DeleteRule;
        
        EXEC sp_executesql @RecreateFKSQL;
        PRINT '    ✅ Recreated FK: ' + @FKName + ' (ON DELETE ' + @DeleteRule + ')';
        
        FETCH NEXT FROM recreate_cursor INTO @FKName, @ParentTable, @ParentColumn, @DeleteRule;
    END
    
    CLOSE recreate_cursor;
    DEALLOCATE recreate_cursor;
    
    COMMIT TRANSACTION SchemaFix;
    
    PRINT '';
    PRINT '✅ Schema modification complete!';
    
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION SchemaFix;
    
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorNumber INT = ERROR_NUMBER();
    DECLARE @ErrorLine INT = ERROR_LINE();
    
    PRINT '';
    PRINT '========================================';
    PRINT 'ERROR: Schema modification failed';
    PRINT '========================================';
    PRINT 'Error Number: ' + CAST(@ErrorNumber AS VARCHAR);
    PRINT 'Error Line: ' + CAST(@ErrorLine AS VARCHAR);
    PRINT 'Error Message: ' + @ErrorMessage;
    PRINT '';
    PRINT 'Transaction rolled back. No changes made.';
    PRINT '';
    
    RAISERROR('Schema modification failed: %s', 16, 1, @ErrorMessage);
    RETURN;
END CATCH;

-- =============================================
-- STEP 4: Verification
-- =============================================
PRINT '';
PRINT '>> STEP 4: Verification';
PRINT '';

-- Verify SessionId is no longer IDENTITY
SELECT @IsIdentity = c.is_identity
FROM sys.columns c
WHERE c.object_id = OBJECT_ID('canvas.Sessions')
AND c.name = 'SessionId';

IF @IsIdentity = 1
BEGIN
    PRINT '❌ ERROR: SessionId is still IDENTITY - verification failed';
END
ELSE
BEGIN
    PRINT '  ✅ SessionId is NOT IDENTITY';
END

-- Verify FK exists
IF EXISTS (
    SELECT 1 
    FROM sys.foreign_keys 
    WHERE name = 'FK_canvas_Sessions_dbo_Sessions'
)
BEGIN
    PRINT '  ✅ FK FK_canvas_Sessions_dbo_Sessions exists';
    
    -- Show FK details
    SELECT 
        '    FK: ' + fk.name AS ForeignKey,
        '    Referencing: canvas.Sessions.SessionId → dbo.Sessions.SessionID' AS Relationship,
        '    Delete Rule: ' + 
            CASE fk.delete_referential_action
                WHEN 0 THEN 'NO ACTION'
                WHEN 1 THEN 'CASCADE'
            END AS DeleteBehavior
    FROM sys.foreign_keys fk
    WHERE fk.name = 'FK_canvas_Sessions_dbo_Sessions';
END
ELSE
BEGIN
    PRINT '❌ ERROR: FK FK_canvas_Sessions_dbo_Sessions not found';
END

-- Verify dependent FKs recreated
DECLARE @ExpectedFKs INT;
DECLARE @ActualFKs INT;

SELECT @ExpectedFKs = COUNT(*) FROM @RecreateFK;
SELECT @ActualFKs = COUNT(*)
FROM sys.foreign_keys fk
WHERE fk.referenced_object_id = OBJECT_ID('canvas.Sessions')
AND COL_NAME(fk.referenced_object_id, fk.object_id) = 'SessionId';

PRINT '  Dependent FKs: ' + CAST(@ActualFKs AS VARCHAR) + ' of ' + CAST(@ExpectedFKs AS VARCHAR) + ' recreated';

-- Final data count
SELECT @CanvasSessionCount = COUNT(*) FROM canvas.Sessions;
PRINT '  Final canvas.Sessions count: ' + CAST(@CanvasSessionCount AS VARCHAR) + ' records';

PRINT '';
PRINT '========================================';
PRINT 'Schema Fix Complete!';
PRINT '========================================';
PRINT '';
PRINT 'Summary:';
PRINT '  ✅ canvas.Sessions.SessionId is now INT (not IDENTITY)';
PRINT '  ✅ FK to dbo.Sessions.SessionID added';
PRINT '  ✅ All dependent FKs recreated';
PRINT '  ✅ Data integrity preserved';
PRINT '';
PRINT 'Next Steps:';
PRINT '  1. Run this script on KSESSIONS (production) database';
PRINT '  2. Update migration scripts to reflect correct schema';
PRINT '  3. Verify HostProvisioner tool works correctly';
PRINT '  4. Test session creation with explicit SessionId values';
PRINT '';

GO
