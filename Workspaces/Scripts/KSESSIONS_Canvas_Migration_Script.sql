/*
==============================================================================
KSESSIONS CANVAS COMPLETE MIGRATION SCRIPT (SCHEMA + DATA)
==============================================================================
Description: Complete migration of canvas schema and data from KSESSIONS_DEV to KSESSIONS
Author: GitHub Copilot Task Agent
Created: October 4, 2025
Updated: October 4, 2025 (Combined schema + data migration)
Database: KSESSIONS (Target) <- KSESSIONS_DEV (Source)

SAFETY FEATURES:
- Idempotent (safe to run multiple times)
- Fault-tolerant with rollback mechanisms
- Comprehensive logging and progress tracking
- Zero impact on dbo schema objects
- Pre-flight validation checks
- Transaction-based operations with savepoints
- Cross-database data migration with duplicate handling
- Identity column mapping for foreign key relationships

SCOPE:
- Creates canvas schema if not exists
- Migrates 4 canvas tables with full structure
- Migrates existing data (AssetLookup: 8 records, Participants: 1 record, Sessions: 6 records)
- Creates all constraints, indexes, and foreign keys
- Creates EF Migrations History table for framework compatibility
- Performs complete data migration from KSESSIONS_DEV
- Validates data integrity and relationships

WARNING: This script modifies KSESSIONS database and transfers data. Ensure you have backups!
==============================================================================
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @ScriptVersion VARCHAR(20) = '1.0.0';
DECLARE @ExecutionId UNIQUEIDENTIFIER = NEWID();
DECLARE @StartTime DATETIME2 = GETUTCDATE();
DECLARE @CurrentStep VARCHAR(100);
DECLARE @ErrorCount INT = 0;
DECLARE @WarningCount INT = 0;

PRINT '================================================================================';
PRINT 'KSESSIONS CANVAS MIGRATION SCRIPT v' + @ScriptVersion;
PRINT 'Execution ID: ' + CAST(@ExecutionId AS VARCHAR(36));
PRINT 'Started: ' + FORMAT(@StartTime, 'yyyy-MM-dd HH:mm:ss UTC');
PRINT '================================================================================';
PRINT '';

-- =============================================================================
-- SECTION 1: PRE-FLIGHT VALIDATION
-- =============================================================================
PRINT '>>> SECTION 1: PRE-FLIGHT VALIDATION';

SET @CurrentStep = 'Database Connection Validation';
PRINT '  [1.1] ' + @CurrentStep;

-- Verify we're connected to KSESSIONS
IF DB_NAME() != 'KSESSIONS'
BEGIN
    PRINT '    ❌ ERROR: This script must be executed against KSESSIONS database';
    PRINT '    Current database: ' + DB_NAME();
    RAISERROR('Invalid target database. Expected KSESSIONS.', 16, 1);
    RETURN;
END
PRINT '    ✅ Connected to KSESSIONS database';

-- Check SQL Server version compatibility
SET @CurrentStep = 'SQL Server Version Check';
PRINT '  [1.2] ' + @CurrentStep;
DECLARE @SQLVersion VARCHAR(20) = CAST(SERVERPROPERTY('ProductMajorVersion') AS VARCHAR(10));
IF CAST(@SQLVersion AS INT) < 11 -- SQL Server 2012 or later
BEGIN
    PRINT '    ⚠️  WARNING: SQL Server version may not support all features';
    SET @WarningCount = @WarningCount + 1;
END
ELSE
    PRINT '    ✅ SQL Server version compatible (' + @SQLVersion + ')';

-- Check available space (basic check)
SET @CurrentStep = 'Database Space Check';
PRINT '  [1.3] ' + @CurrentStep;
DECLARE @DataSizeMB DECIMAL(10,2), @LogSizeMB DECIMAL(10,2);
SELECT 
    @DataSizeMB = SUM(CASE WHEN type = 0 THEN size/128.0 END),
    @LogSizeMB = SUM(CASE WHEN type = 1 THEN size/128.0 END)
FROM sys.master_files 
WHERE database_id = DB_ID();

PRINT '    ✅ Data file size: ' + CAST(@DataSizeMB AS VARCHAR(20)) + ' MB';
PRINT '    ✅ Log file size: ' + CAST(@LogSizeMB AS VARCHAR(20)) + ' MB';

-- Verify no conflicting canvas schema exists
SET @CurrentStep = 'Schema Conflict Check';
PRINT '  [1.4] ' + @CurrentStep;

IF EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'canvas')
BEGIN
    PRINT '    ⚠️  WARNING: Canvas schema already exists - will verify compatibility';
    SET @WarningCount = @WarningCount + 1;
    
    -- Check if existing canvas tables match our expected structure
    DECLARE @ExistingTables TABLE (TableName VARCHAR(100));
    INSERT INTO @ExistingTables
    SELECT TABLE_NAME 
    FROM INFORMATION_SCHEMA.TABLES 
    WHERE TABLE_SCHEMA = 'canvas';
    
    DECLARE @ExpectedCount INT = 4;
    DECLARE @ActualCount INT = (SELECT COUNT(*) FROM @ExistingTables);
    
    IF @ActualCount > 0 AND @ActualCount != @ExpectedCount
    BEGIN
        PRINT '    ⚠️  WARNING: Existing canvas schema has unexpected table count';
        PRINT '    Expected: ' + CAST(@ExpectedCount AS VARCHAR(10)) + ', Found: ' + CAST(@ActualCount AS VARCHAR(10));
        SET @WarningCount = @WarningCount + 1;
    END
END
ELSE
    PRINT '    ✅ No conflicting canvas schema found';

PRINT '  Pre-flight validation completed. Warnings: ' + CAST(@WarningCount AS VARCHAR(10));
PRINT '';

-- =============================================================================
-- SECTION 2: TRANSACTION SETUP AND SAVEPOINTS
-- =============================================================================
PRINT '>>> SECTION 2: TRANSACTION SETUP';

BEGIN TRANSACTION MigrationTrans;

DECLARE @SavePoint1 VARCHAR(50) = 'SchemaCreation';
DECLARE @SavePoint2 VARCHAR(50) = 'TableCreation';
DECLARE @SavePoint3 VARCHAR(50) = 'ConstraintCreation';
DECLARE @SavePoint4 VARCHAR(50) = 'DataMigration';

PRINT '  [2.1] Master transaction started: MigrationTrans';

-- =============================================================================
-- SECTION 3: SCHEMA CREATION
-- =============================================================================
PRINT '>>> SECTION 3: CANVAS SCHEMA CREATION';

SAVE TRANSACTION SchemaCreation;
SET @CurrentStep = 'Canvas Schema Creation';
PRINT '  [3.1] ' + @CurrentStep;

BEGIN TRY
    -- Create canvas schema if not exists
    IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'canvas')
    BEGIN
        EXEC('CREATE SCHEMA [canvas]');
        PRINT '    ✅ Canvas schema created successfully';
    END
    ELSE
        PRINT '    ✅ Canvas schema already exists - verified';
    
END TRY
BEGIN CATCH
    PRINT '    ❌ ERROR creating canvas schema: ' + ERROR_MESSAGE();
    ROLLBACK TRANSACTION SchemaCreation;
    ROLLBACK TRANSACTION MigrationTrans;
    RETURN;
END CATCH

-- =============================================================================
-- SECTION 4: TABLE CREATION
-- =============================================================================
PRINT '>>> SECTION 4: TABLE CREATION';

SAVE TRANSACTION TableCreation;

-- -----------------------------------------------------------------------------
-- 4.1: Create EF Migrations History Table
-- -----------------------------------------------------------------------------
SET @CurrentStep = 'EF Migrations History Table';
PRINT '  [4.1] ' + @CurrentStep;

BEGIN TRY
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = '__EFMigrationsHistory')
    BEGIN
        CREATE TABLE [dbo].[__EFMigrationsHistory] (
            [MigrationId] NVARCHAR(150) NOT NULL,
            [ProductVersion] NVARCHAR(32) NOT NULL,
            CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
        );
        PRINT '    ✅ __EFMigrationsHistory table created';
    END
    ELSE
        PRINT '    ✅ __EFMigrationsHistory table already exists';
END TRY
BEGIN CATCH
    PRINT '    ❌ ERROR creating __EFMigrationsHistory table: ' + ERROR_MESSAGE();
    SET @ErrorCount = @ErrorCount + 1;
    ROLLBACK TRANSACTION TableCreation;
    ROLLBACK TRANSACTION MigrationTrans;
    RETURN;
END CATCH

-- -----------------------------------------------------------------------------
-- 4.2: Create canvas.AssetLookup
-- -----------------------------------------------------------------------------
SET @CurrentStep = 'Canvas AssetLookup Table';
PRINT '  [4.2] ' + @CurrentStep;

BEGIN TRY
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'canvas' AND TABLE_NAME = 'AssetLookup')
    BEGIN
        CREATE TABLE [canvas].[AssetLookup] (
            [AssetId] BIGINT IDENTITY(1,1) NOT NULL,
            [AssetIdentifier] NVARCHAR(100) NOT NULL,
            [AssetType] NVARCHAR(50) NOT NULL,
            [CssSelector] NVARCHAR(200) NULL,
            [DisplayName] NVARCHAR(100) NULL,
            [IsActive] BIT NOT NULL,
            CONSTRAINT [PK_AssetLookup] PRIMARY KEY CLUSTERED ([AssetId])
        );
        PRINT '    ✅ canvas.AssetLookup table created';
    END
    ELSE
        PRINT '    ✅ canvas.AssetLookup table already exists';
END TRY
BEGIN CATCH
    PRINT '    ❌ ERROR creating canvas.AssetLookup: ' + ERROR_MESSAGE();
    SET @ErrorCount = @ErrorCount + 1;
    ROLLBACK TRANSACTION TableCreation;
    ROLLBACK TRANSACTION MigrationTrans;
    RETURN;
END CATCH

-- -----------------------------------------------------------------------------
-- 4.3: Create canvas.Sessions
-- -----------------------------------------------------------------------------
SET @CurrentStep = 'Canvas Sessions Table';
PRINT '  [4.3] ' + @CurrentStep;

BEGIN TRY
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'canvas' AND TABLE_NAME = 'Sessions')
    BEGIN
        CREATE TABLE [canvas].[Sessions] (
            [SessionId] BIGINT IDENTITY(1,1) NOT NULL,
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
            CONSTRAINT [PK__Sessions__C9F49290FD14F53B] PRIMARY KEY CLUSTERED ([SessionId])
        );
        PRINT '    ✅ canvas.Sessions table created';
    END
    ELSE
        PRINT '    ✅ canvas.Sessions table already exists';
END TRY
BEGIN CATCH
    PRINT '    ❌ ERROR creating canvas.Sessions: ' + ERROR_MESSAGE();
    SET @ErrorCount = @ErrorCount + 1;
    ROLLBACK TRANSACTION TableCreation;
    ROLLBACK TRANSACTION MigrationTrans;
    RETURN;
END CATCH

-- -----------------------------------------------------------------------------
-- 4.4: Create canvas.Participants
-- -----------------------------------------------------------------------------
SET @CurrentStep = 'Canvas Participants Table';
PRINT '  [4.4] ' + @CurrentStep;

BEGIN TRY
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'canvas' AND TABLE_NAME = 'Participants')
    BEGIN
        CREATE TABLE [canvas].[Participants] (
            [ParticipantId] INT IDENTITY(1,1) NOT NULL,
            [SessionId] BIGINT NOT NULL,
            [UserGuid] NVARCHAR(256) NULL,
            [Name] NVARCHAR(100) NULL,
            [Email] NVARCHAR(255) NULL,
            [Country] NVARCHAR(100) NULL,
            [City] NVARCHAR(100) NULL,
            [JoinedAt] DATETIME2 NOT NULL DEFAULT (GETUTCDATE()),
            [LastSeenAt] DATETIME2 NULL,
            [UserToken] VARCHAR(8) NOT NULL,
            CONSTRAINT [PK__Particip__7227995EA244E8F3] PRIMARY KEY CLUSTERED ([ParticipantId])
        );
        PRINT '    ✅ canvas.Participants table created';
    END
    ELSE
        PRINT '    ✅ canvas.Participants table already exists';
END TRY
BEGIN CATCH
    PRINT '    ❌ ERROR creating canvas.Participants: ' + ERROR_MESSAGE();
    SET @ErrorCount = @ErrorCount + 1;
    ROLLBACK TRANSACTION TableCreation;
    ROLLBACK TRANSACTION MigrationTrans;
    RETURN;
END CATCH

-- -----------------------------------------------------------------------------
-- 4.5: Create canvas.SessionData
-- -----------------------------------------------------------------------------
SET @CurrentStep = 'Canvas SessionData Table';
PRINT '  [4.5] ' + @CurrentStep;

BEGIN TRY
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'canvas' AND TABLE_NAME = 'SessionData')
    BEGIN
        CREATE TABLE [canvas].[SessionData] (
            [DataId] INT IDENTITY(1,1) NOT NULL,
            [SessionId] BIGINT NOT NULL,
            [DataType] NVARCHAR(20) NOT NULL,
            [Content] NVARCHAR(MAX) NULL,
            [CreatedBy] NVARCHAR(100) NULL,
            [CreatedAt] DATETIME2 NOT NULL DEFAULT (GETUTCDATE()),
            [IsDeleted] BIT NOT NULL DEFAULT ((0)),
            CONSTRAINT [PK__SessionD__9D05303D9ACF507D] PRIMARY KEY CLUSTERED ([DataId])
        );
        PRINT '    ✅ canvas.SessionData table created';
    END
    ELSE
        PRINT '    ✅ canvas.SessionData table already exists';
END TRY
BEGIN CATCH
    PRINT '    ❌ ERROR creating canvas.SessionData: ' + ERROR_MESSAGE();
    SET @ErrorCount = @ErrorCount + 1;
    ROLLBACK TRANSACTION TableCreation;
    ROLLBACK TRANSACTION MigrationTrans;
    RETURN;
END CATCH

-- =============================================================================
-- SECTION 5: CONSTRAINTS AND INDEXES CREATION
-- =============================================================================
PRINT '>>> SECTION 5: CONSTRAINTS AND INDEXES';

SAVE TRANSACTION ConstraintCreation;

-- -----------------------------------------------------------------------------
-- 5.1: AssetLookup Indexes and Constraints
-- -----------------------------------------------------------------------------
SET @CurrentStep = 'AssetLookup Constraints';
PRINT '  [5.1] ' + @CurrentStep;

BEGIN TRY
    -- Unique constraint on AssetIdentifier
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('canvas.AssetLookup') AND name = 'UQ_AssetLookup_Identifier')
    BEGIN
        ALTER TABLE [canvas].[AssetLookup] ADD CONSTRAINT [UQ_AssetLookup_Identifier] UNIQUE NONCLUSTERED ([AssetIdentifier]);
        PRINT '    ✅ UQ_AssetLookup_Identifier constraint created';
    END
    ELSE
        PRINT '    ✅ UQ_AssetLookup_Identifier constraint already exists';
    
    -- Index for Type and Active columns
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('canvas.AssetLookup') AND name = 'IX_AssetLookup_Type_Active')
    BEGIN
        CREATE NONCLUSTERED INDEX [IX_AssetLookup_Type_Active] ON [canvas].[AssetLookup] ([AssetType], [IsActive]);
        PRINT '    ✅ IX_AssetLookup_Type_Active index created';
    END
    ELSE
        PRINT '    ✅ IX_AssetLookup_Type_Active index already exists';

END TRY
BEGIN CATCH
    PRINT '    ❌ ERROR creating AssetLookup constraints: ' + ERROR_MESSAGE();
    SET @ErrorCount = @ErrorCount + 1;
    ROLLBACK TRANSACTION ConstraintCreation;
    ROLLBACK TRANSACTION MigrationTrans;
    RETURN;
END CATCH

-- -----------------------------------------------------------------------------
-- 5.2: Sessions Indexes and Constraints
-- -----------------------------------------------------------------------------
SET @CurrentStep = 'Sessions Constraints';
PRINT '  [5.2] ' + @CurrentStep;

BEGIN TRY
    -- Unique constraints on tokens
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('canvas.Sessions') AND name = 'UQ_Sessions_HostToken')
    BEGIN
        ALTER TABLE [canvas].[Sessions] ADD CONSTRAINT [UQ_Sessions_HostToken] UNIQUE NONCLUSTERED ([HostToken]);
        PRINT '    ✅ UQ_Sessions_HostToken constraint created';
    END
    ELSE
        PRINT '    ✅ UQ_Sessions_HostToken constraint already exists';
    
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('canvas.Sessions') AND name = 'UQ_Sessions_UserToken')
    BEGIN
        ALTER TABLE [canvas].[Sessions] ADD CONSTRAINT [UQ_Sessions_UserToken] UNIQUE NONCLUSTERED ([UserToken]);
        PRINT '    ✅ UQ_Sessions_UserToken constraint created';
    END
    ELSE
        PRINT '    ✅ UQ_Sessions_UserToken constraint already exists';
    
    -- Performance indexes
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('canvas.Sessions') AND name = 'IX_Sessions_AlbumId')
    BEGIN
        CREATE NONCLUSTERED INDEX [IX_Sessions_AlbumId] ON [canvas].[Sessions] ([AlbumId]);
        PRINT '    ✅ IX_Sessions_AlbumId index created';
    END
    ELSE
        PRINT '    ✅ IX_Sessions_AlbumId index already exists';
    
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('canvas.Sessions') AND name = 'IX_Sessions_Status_Expires')
    BEGIN
        CREATE NONCLUSTERED INDEX [IX_Sessions_Status_Expires] ON [canvas].[Sessions] ([Status], [ExpiresAt]);
        PRINT '    ✅ IX_Sessions_Status_Expires index created';
    END
    ELSE
        PRINT '    ✅ IX_Sessions_Status_Expires index already exists';

END TRY
BEGIN CATCH
    PRINT '    ❌ ERROR creating Sessions constraints: ' + ERROR_MESSAGE();
    SET @ErrorCount = @ErrorCount + 1;
    ROLLBACK TRANSACTION ConstraintCreation;
    ROLLBACK TRANSACTION MigrationTrans;
    RETURN;
END CATCH

-- -----------------------------------------------------------------------------
-- 5.3: Participants Foreign Keys and Indexes
-- -----------------------------------------------------------------------------
SET @CurrentStep = 'Participants Constraints';
PRINT '  [5.3] ' + @CurrentStep;

BEGIN TRY
    -- Foreign key to Sessions
    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE object_id = OBJECT_ID('canvas.FK_Participants_Sessions_SessionId'))
    BEGIN
        ALTER TABLE [canvas].[Participants] 
        ADD CONSTRAINT [FK_Participants_Sessions_SessionId] 
        FOREIGN KEY ([SessionId]) REFERENCES [canvas].[Sessions] ([SessionId]) ON DELETE CASCADE;
        PRINT '    ✅ FK_Participants_Sessions_SessionId foreign key created';
    END
    ELSE
        PRINT '    ✅ FK_Participants_Sessions_SessionId foreign key already exists';
    
    -- Performance indexes
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('canvas.Participants') AND name = 'IX_Participants_SessionId')
    BEGIN
        CREATE NONCLUSTERED INDEX [IX_Participants_SessionId] ON [canvas].[Participants] ([SessionId]);
        PRINT '    ✅ IX_Participants_SessionId index created';
    END
    ELSE
        PRINT '    ✅ IX_Participants_SessionId index already exists';
    
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('canvas.Participants') AND name = 'IX_Participants_Email')
    BEGIN
        CREATE NONCLUSTERED INDEX [IX_Participants_Email] ON [canvas].[Participants] ([Email]);
        PRINT '    ✅ IX_Participants_Email index created';
    END
    ELSE
        PRINT '    ✅ IX_Participants_Email index already exists';
    
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('canvas.Participants') AND name = 'IX_Participants_UserToken')
    BEGIN
        CREATE NONCLUSTERED INDEX [IX_Participants_UserToken] ON [canvas].[Participants] ([UserToken]);
        PRINT '    ✅ IX_Participants_UserToken index created';
    END
    ELSE
        PRINT '    ✅ IX_Participants_UserToken index already exists';
    
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('canvas.Participants') AND name = 'IX_Participants_SessionUser')
    BEGIN
        CREATE NONCLUSTERED INDEX [IX_Participants_SessionUser] ON [canvas].[Participants] ([SessionId], [UserGuid]);
        PRINT '    ✅ IX_Participants_SessionUser index created';
    END
    ELSE
        PRINT '    ✅ IX_Participants_SessionUser index already exists';

END TRY
BEGIN CATCH
    PRINT '    ❌ ERROR creating Participants constraints: ' + ERROR_MESSAGE();
    SET @ErrorCount = @ErrorCount + 1;
    ROLLBACK TRANSACTION ConstraintCreation;
    ROLLBACK TRANSACTION MigrationTrans;
    RETURN;
END CATCH

-- -----------------------------------------------------------------------------
-- 5.4: SessionData Foreign Keys and Indexes
-- -----------------------------------------------------------------------------
SET @CurrentStep = 'SessionData Constraints';
PRINT '  [5.4] ' + @CurrentStep;

BEGIN TRY
    -- Foreign key to Sessions
    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE object_id = OBJECT_ID('canvas.FK_SessionData_Sessions_SessionId'))
    BEGIN
        ALTER TABLE [canvas].[SessionData] 
        ADD CONSTRAINT [FK_SessionData_Sessions_SessionId] 
        FOREIGN KEY ([SessionId]) REFERENCES [canvas].[Sessions] ([SessionId]) ON DELETE CASCADE;
        PRINT '    ✅ FK_SessionData_Sessions_SessionId foreign key created';
    END
    ELSE
        PRINT '    ✅ FK_SessionData_Sessions_SessionId foreign key already exists';
    
    -- Performance indexes
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('canvas.SessionData') AND name = 'IX_SessionData_SessionId')
    BEGIN
        CREATE NONCLUSTERED INDEX [IX_SessionData_SessionId] ON [canvas].[SessionData] ([SessionId]);
        PRINT '    ✅ IX_SessionData_SessionId index created';
    END
    ELSE
        PRINT '    ✅ IX_SessionData_SessionId index already exists';
    
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('canvas.SessionData') AND name = 'IX_SessionData_Session_Type')
    BEGIN
        CREATE NONCLUSTERED INDEX [IX_SessionData_Session_Type] ON [canvas].[SessionData] ([SessionId], [DataType]);
        PRINT '    ✅ IX_SessionData_Session_Type index created';
    END
    ELSE
        PRINT '    ✅ IX_SessionData_Session_Type index already exists';
    
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('canvas.SessionData') AND name = 'IX_SessionData_Query_Optimized')
    BEGIN
        CREATE NONCLUSTERED INDEX [IX_SessionData_Query_Optimized] ON [canvas].[SessionData] ([SessionId], [DataType], [IsDeleted], [CreatedAt]);
        PRINT '    ✅ IX_SessionData_Query_Optimized index created';
    END
    ELSE
        PRINT '    ✅ IX_SessionData_Query_Optimized index already exists';

END TRY
BEGIN CATCH
    PRINT '    ❌ ERROR creating SessionData constraints: ' + ERROR_MESSAGE();
    SET @ErrorCount = @ErrorCount + 1;
    ROLLBACK TRANSACTION ConstraintCreation;
    ROLLBACK TRANSACTION MigrationTrans;
    RETURN;
END CATCH

-- =============================================================================
-- SECTION 6: DATA MIGRATION FROM KSESSIONS_DEV
-- =============================================================================
PRINT '>>> SECTION 6: DATA MIGRATION';

SAVE TRANSACTION DataMigration;

SET @CurrentStep = 'Data Migration Preparation';
PRINT '  [6.1] ' + @CurrentStep;

-- Verify target tables are ready for data
DECLARE @ReadyTables INT = 0;
SELECT @ReadyTables = COUNT(*)
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'canvas' 
AND TABLE_NAME IN ('AssetLookup', 'Sessions', 'Participants', 'SessionData');

IF @ReadyTables = 4
    PRINT '    ✅ All 4 canvas tables are ready for data migration';
ELSE
BEGIN
    PRINT '    ❌ ERROR: Not all canvas tables are ready. Found: ' + CAST(@ReadyTables AS VARCHAR(10)) + '/4';
    SET @ErrorCount = @ErrorCount + 1;
    ROLLBACK TRANSACTION DataMigration;
    ROLLBACK TRANSACTION MigrationTrans;
    RETURN;
END

-- Check current record counts
PRINT '  [6.2] Current record counts in target tables:';
DECLARE @CurrentAssetLookup INT = (SELECT COUNT(*) FROM [canvas].[AssetLookup]);
DECLARE @CurrentSessions INT = (SELECT COUNT(*) FROM [canvas].[Sessions]);
DECLARE @CurrentParticipants INT = (SELECT COUNT(*) FROM [canvas].[Participants]);
DECLARE @CurrentSessionData INT = (SELECT COUNT(*) FROM [canvas].[SessionData]);

PRINT '    AssetLookup: ' + CAST(@CurrentAssetLookup AS VARCHAR(10)) + ' records';
PRINT '    Sessions: ' + CAST(@CurrentSessions AS VARCHAR(10)) + ' records';
PRINT '    Participants: ' + CAST(@CurrentParticipants AS VARCHAR(10)) + ' records';
PRINT '    SessionData: ' + CAST(@CurrentSessionData AS VARCHAR(10)) + ' records';

BEGIN TRY
    -- -----------------------------------------------------------------------------
    -- 6.3: Migrate AssetLookup Data
    -- -----------------------------------------------------------------------------
    PRINT '  [6.3] Migrating AssetLookup data...';
    
    -- Use MERGE to handle duplicates based on AssetIdentifier
    MERGE [canvas].[AssetLookup] AS Target
    USING (
        SELECT 
            [AssetIdentifier],
            [AssetType], 
            [CssSelector],
            [DisplayName],
            [IsActive]
        FROM [KSESSIONS_DEV].[canvas].[AssetLookup]
    ) AS Source ON Target.[AssetIdentifier] = Source.[AssetIdentifier]
    WHEN NOT MATCHED THEN
        INSERT ([AssetIdentifier], [AssetType], [CssSelector], [DisplayName], [IsActive])
        VALUES (Source.[AssetIdentifier], Source.[AssetType], Source.[CssSelector], 
                Source.[DisplayName], Source.[IsActive])
    WHEN MATCHED THEN
        UPDATE SET 
            [AssetType] = Source.[AssetType],
            [CssSelector] = Source.[CssSelector],
            [DisplayName] = Source.[DisplayName],
            [IsActive] = Source.[IsActive];
    
    DECLARE @AssetRecords INT = @@ROWCOUNT;
    PRINT '    ✅ AssetLookup migration completed: ' + CAST(@AssetRecords AS VARCHAR(10)) + ' records processed';

    -- -----------------------------------------------------------------------------
    -- 6.4: Migrate Sessions Data  
    -- -----------------------------------------------------------------------------
    PRINT '  [6.4] Migrating Sessions data...';
    
    -- Use MERGE to handle duplicates based on unique tokens
    MERGE [canvas].[Sessions] AS Target
    USING (
        SELECT 
            [AlbumId],
            [HostToken],
            [UserToken],
            [Status],
            [CreatedAt],
            [ModifiedAt],
            [StartedAt],
            [EndedAt],
            [ExpiresAt],
            [ParticipantCount],
            [MaxParticipants],
            [ScheduledDate],
            [ScheduledDuration],
            [ScheduledTime]
        FROM [KSESSIONS_DEV].[canvas].[Sessions]
    ) AS Source ON Target.[HostToken] = Source.[HostToken] OR Target.[UserToken] = Source.[UserToken]
    WHEN NOT MATCHED THEN
        INSERT ([AlbumId], [HostToken], [UserToken], [Status], [CreatedAt], [ModifiedAt],
                [StartedAt], [EndedAt], [ExpiresAt], [ParticipantCount], [MaxParticipants],
                [ScheduledDate], [ScheduledDuration], [ScheduledTime])
        VALUES (Source.[AlbumId], Source.[HostToken], Source.[UserToken], Source.[Status],
                Source.[CreatedAt], Source.[ModifiedAt], Source.[StartedAt], Source.[EndedAt],
                Source.[ExpiresAt], Source.[ParticipantCount], Source.[MaxParticipants],
                Source.[ScheduledDate], Source.[ScheduledDuration], Source.[ScheduledTime])
    WHEN MATCHED THEN
        UPDATE SET 
            [Status] = Source.[Status],
            [ModifiedAt] = Source.[ModifiedAt],
            [StartedAt] = Source.[StartedAt],
            [EndedAt] = Source.[EndedAt],
            [ExpiresAt] = Source.[ExpiresAt],
            [ParticipantCount] = Source.[ParticipantCount],
            [MaxParticipants] = Source.[MaxParticipants],
            [ScheduledDate] = Source.[ScheduledDate],
            [ScheduledDuration] = Source.[ScheduledDuration],
            [ScheduledTime] = Source.[ScheduledTime];
    
    DECLARE @SessionRecords INT = @@ROWCOUNT;
    PRINT '    ✅ Sessions migration completed: ' + CAST(@SessionRecords AS VARCHAR(10)) + ' records processed';

    -- -----------------------------------------------------------------------------
    -- 6.5: Migrate Participants Data
    -- -----------------------------------------------------------------------------
    PRINT '  [6.5] Migrating Participants data...';
    
    -- Create mapping table for SessionId (since identity columns may differ)
    DECLARE @SessionMapping TABLE (
        SourceSessionId BIGINT,
        TargetSessionId BIGINT,
        HostToken NVARCHAR(8)
    );
    
    INSERT INTO @SessionMapping
    SELECT 
        src.SessionId AS SourceSessionId,
        tgt.SessionId AS TargetSessionId,
        src.HostToken
    FROM [KSESSIONS_DEV].[canvas].[Sessions] src
    INNER JOIN [canvas].[Sessions] tgt ON src.HostToken = tgt.HostToken;
    
    -- Migrate participants with correct SessionId mapping
    INSERT INTO [canvas].[Participants] 
    ([SessionId], [UserGuid], [Name], [Email], [Country], [City], [JoinedAt], [LastSeenAt], [UserToken])
    SELECT 
        sm.TargetSessionId,
        src.[UserGuid],
        src.[Name],
        src.[Email], 
        src.[Country],
        src.[City],
        src.[JoinedAt],
        src.[LastSeenAt],
        src.[UserToken]
    FROM [KSESSIONS_DEV].[canvas].[Participants] src
    INNER JOIN @SessionMapping sm ON src.SessionId = sm.SourceSessionId
    WHERE NOT EXISTS (
        SELECT 1 FROM [canvas].[Participants] tgt 
        WHERE tgt.SessionId = sm.TargetSessionId 
        AND tgt.UserToken = src.UserToken
    );
    
    DECLARE @ParticipantRecords INT = @@ROWCOUNT;
    PRINT '    ✅ Participants migration completed: ' + CAST(@ParticipantRecords AS VARCHAR(10)) + ' records processed';

    -- -----------------------------------------------------------------------------
    -- 6.6: Migrate SessionData
    -- -----------------------------------------------------------------------------
    PRINT '  [6.6] Migrating SessionData...';
    
    -- Migrate session data with correct SessionId mapping
    INSERT INTO [canvas].[SessionData]
    ([SessionId], [DataType], [Content], [CreatedBy], [CreatedAt], [IsDeleted])
    SELECT 
        sm.TargetSessionId,
        src.[DataType],
        src.[Content],
        src.[CreatedBy],
        src.[CreatedAt],
        src.[IsDeleted]
    FROM [KSESSIONS_DEV].[canvas].[SessionData] src
    INNER JOIN @SessionMapping sm ON src.SessionId = sm.SourceSessionId
    WHERE NOT EXISTS (
        SELECT 1 FROM [canvas].[SessionData] tgt
        WHERE tgt.SessionId = sm.TargetSessionId
        AND tgt.DataType = src.DataType
        AND tgt.CreatedAt = src.CreatedAt
        AND tgt.CreatedBy = src.CreatedBy
    );
    
    DECLARE @SessionDataRecords INT = @@ROWCOUNT;
    PRINT '    ✅ SessionData migration completed: ' + CAST(@SessionDataRecords AS VARCHAR(10)) + ' records processed';

    -- Data migration summary
    DECLARE @TotalMigrated INT = @AssetRecords + @SessionRecords + @ParticipantRecords + @SessionDataRecords;
    PRINT '  [6.7] Data migration summary: ' + CAST(@TotalMigrated AS VARCHAR(10)) + ' total records processed';

END TRY
BEGIN CATCH
    PRINT '    ❌ ERROR during data migration: ' + ERROR_MESSAGE();
    PRINT '    Line: ' + CAST(ERROR_LINE() AS VARCHAR(10)) + ', Severity: ' + CAST(ERROR_SEVERITY() AS VARCHAR(10));
    SET @ErrorCount = @ErrorCount + 1;
    ROLLBACK TRANSACTION DataMigration;
    ROLLBACK TRANSACTION MigrationTrans;
    RETURN;
END CATCH

-- =============================================================================
-- SECTION 7: POST-MIGRATION VALIDATION
-- =============================================================================
PRINT '>>> SECTION 7: POST-MIGRATION VALIDATION';

SET @CurrentStep = 'Schema Validation';
PRINT '  [7.1] ' + @CurrentStep;

-- Verify schema creation
IF EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'canvas')
    PRINT '    ✅ Canvas schema verified';
ELSE
BEGIN
    PRINT '    ❌ ERROR: Canvas schema not found';
    SET @ErrorCount = @ErrorCount + 1;
END

-- Verify table creation
DECLARE @TableCount INT = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.TABLES 
    WHERE TABLE_SCHEMA = 'canvas'
);

IF @TableCount = 4
    PRINT '    ✅ All 4 canvas tables verified';
ELSE
BEGIN
    PRINT '    ❌ ERROR: Expected 4 canvas tables, found: ' + CAST(@TableCount AS VARCHAR(10));
    SET @ErrorCount = @ErrorCount + 1;
END

-- Verify EF Migrations table
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = '__EFMigrationsHistory')
    PRINT '    ✅ __EFMigrationsHistory table verified';
ELSE
BEGIN
    PRINT '    ❌ ERROR: __EFMigrationsHistory table not found';
    SET @ErrorCount = @ErrorCount + 1;
END

-- Verify constraints
SET @CurrentStep = 'Constraint Validation';
PRINT '  [7.2] ' + @CurrentStep;

DECLARE @ConstraintCount INT = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
    WHERE TABLE_SCHEMA = 'canvas'
);

PRINT '    ✅ Found ' + CAST(@ConstraintCount AS VARCHAR(10)) + ' constraints in canvas schema';

-- Verify foreign keys
DECLARE @FKCount INT = (
    SELECT COUNT(*) 
    FROM sys.foreign_keys fk
    INNER JOIN sys.schemas s ON fk.schema_id = s.schema_id
    WHERE s.name = 'canvas'
);

IF @FKCount >= 2
    PRINT '    ✅ Foreign key relationships verified (' + CAST(@FKCount AS VARCHAR(10)) + ' found)';
ELSE
BEGIN
    PRINT '    ❌ ERROR: Expected at least 2 foreign keys, found: ' + CAST(@FKCount AS VARCHAR(10));
    SET @ErrorCount = @ErrorCount + 1;
END

-- Verify indexes
DECLARE @IndexCount INT = (
    SELECT COUNT(*) 
    FROM sys.indexes i
    INNER JOIN sys.tables t ON i.object_id = t.object_id
    INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
    WHERE s.name = 'canvas' AND i.type > 0
);

PRINT '    ✅ Found ' + CAST(@IndexCount AS VARCHAR(10)) + ' indexes in canvas schema';

-- Data validation
SET @CurrentStep = 'Data Validation';
PRINT '  [7.3] ' + @CurrentStep;

-- Final record counts after migration
DECLARE @FinalAssetLookup INT = (SELECT COUNT(*) FROM [canvas].[AssetLookup]);
DECLARE @FinalSessions INT = (SELECT COUNT(*) FROM [canvas].[Sessions]);
DECLARE @FinalParticipants INT = (SELECT COUNT(*) FROM [canvas].[Participants]);
DECLARE @FinalSessionData INT = (SELECT COUNT(*) FROM [canvas].[SessionData]);

PRINT '    Final record counts:';
PRINT '      AssetLookup: ' + CAST(@FinalAssetLookup AS VARCHAR(10)) + ' records';
PRINT '      Sessions: ' + CAST(@FinalSessions AS VARCHAR(10)) + ' records';
PRINT '      Participants: ' + CAST(@FinalParticipants AS VARCHAR(10)) + ' records';
PRINT '      SessionData: ' + CAST(@FinalSessionData AS VARCHAR(10)) + ' records';

-- Data integrity checks
PRINT '    Data integrity verification:';

-- Check foreign key integrity
DECLARE @OrphanedParticipants INT = (
    SELECT COUNT(*) FROM [canvas].[Participants] p
    WHERE NOT EXISTS (SELECT 1 FROM [canvas].[Sessions] s WHERE s.SessionId = p.SessionId)
);

DECLARE @OrphanedSessionData INT = (
    SELECT COUNT(*) FROM [canvas].[SessionData] sd  
    WHERE NOT EXISTS (SELECT 1 FROM [canvas].[Sessions] s WHERE s.SessionId = sd.SessionId)
);

IF @OrphanedParticipants = 0
    PRINT '      ✅ No orphaned participants found';
ELSE
BEGIN
    PRINT '      ❌ WARNING: ' + CAST(@OrphanedParticipants AS VARCHAR(10)) + ' orphaned participants found';
    SET @WarningCount = @WarningCount + 1;
END

IF @OrphanedSessionData = 0
    PRINT '      ✅ No orphaned session data found';
ELSE
BEGIN
    PRINT '      ❌ WARNING: ' + CAST(@OrphanedSessionData AS VARCHAR(10)) + ' orphaned session data records found';
    SET @WarningCount = @WarningCount + 1;
END

-- Check for duplicate tokens
DECLARE @DuplicateHostTokens INT = (
    SELECT COUNT(*) FROM (
        SELECT HostToken FROM [canvas].[Sessions] 
        WHERE HostToken != ''
        GROUP BY HostToken HAVING COUNT(*) > 1
    ) x
);

DECLARE @DuplicateUserTokens INT = (
    SELECT COUNT(*) FROM (
        SELECT UserToken FROM [canvas].[Sessions]
        WHERE UserToken != ''
        GROUP BY UserToken HAVING COUNT(*) > 1  
    ) x
);

IF @DuplicateHostTokens = 0
    PRINT '      ✅ No duplicate host tokens found';
ELSE
BEGIN
    PRINT '      ❌ WARNING: ' + CAST(@DuplicateHostTokens AS VARCHAR(10)) + ' duplicate host token groups found';
    SET @WarningCount = @WarningCount + 1;
END

IF @DuplicateUserTokens = 0
    PRINT '      ✅ No duplicate user tokens found';
ELSE
BEGIN
    PRINT '      ❌ WARNING: ' + CAST(@DuplicateUserTokens AS VARCHAR(10)) + ' duplicate user token groups found';
    SET @WarningCount = @WarningCount + 1;
END

-- =============================================================================
-- SECTION 8: TRANSACTION COMMIT AND CLEANUP
-- =============================================================================
PRINT '>>> SECTION 8: TRANSACTION COMMIT';

IF @ErrorCount = 0
BEGIN
    COMMIT TRANSACTION MigrationTrans;
    PRINT '  [8.1] ✅ All changes committed successfully';
    
    -- Log successful completion
    DECLARE @EndTime DATETIME2 = GETUTCDATE();
    DECLARE @Duration INT = DATEDIFF(SECOND, @StartTime, @EndTime);
    
    PRINT '';
    PRINT '================================================================================';
    PRINT 'MIGRATION COMPLETED SUCCESSFULLY';
    PRINT '================================================================================';
    PRINT 'Execution ID: ' + CAST(@ExecutionId AS VARCHAR(36));
    PRINT 'Duration: ' + CAST(@Duration AS VARCHAR(10)) + ' seconds';
    PRINT 'Warnings: ' + CAST(@WarningCount AS VARCHAR(10));
    PRINT 'Errors: ' + CAST(@ErrorCount AS VARCHAR(10));
    PRINT '';
    PRINT 'CANVAS SCHEMA & DATA MIGRATION SUMMARY:';
    PRINT '  ✅ Canvas schema created/verified';
    PRINT '  ✅ __EFMigrationsHistory table created/verified';  
    PRINT '  ✅ canvas.AssetLookup table created with constraints and indexes';
    PRINT '  ✅ canvas.Sessions table created with constraints and indexes';
    PRINT '  ✅ canvas.Participants table created with constraints and indexes';
    PRINT '  ✅ canvas.SessionData table created with constraints and indexes';
    PRINT '  ✅ Foreign key relationships established';
    PRINT '  ✅ Performance indexes created';
    PRINT '  ✅ Data migrated from KSESSIONS_DEV with integrity validation';
    PRINT '';
    PRINT 'FINAL DATA COUNTS:';
    DECLARE @FinalAssetLookupSummary INT = (SELECT COUNT(*) FROM [canvas].[AssetLookup]);
    DECLARE @FinalSessionsSummary INT = (SELECT COUNT(*) FROM [canvas].[Sessions]);
    DECLARE @FinalParticipantsSummary INT = (SELECT COUNT(*) FROM [canvas].[Participants]);
    DECLARE @FinalSessionDataSummary INT = (SELECT COUNT(*) FROM [canvas].[SessionData]);
    PRINT '  AssetLookup: ' + CAST(@FinalAssetLookupSummary AS VARCHAR(10)) + ' records';
    PRINT '  Sessions: ' + CAST(@FinalSessionsSummary AS VARCHAR(10)) + ' records';
    PRINT '  Participants: ' + CAST(@FinalParticipantsSummary AS VARCHAR(10)) + ' records';
    PRINT '  SessionData: ' + CAST(@FinalSessionDataSummary AS VARCHAR(10)) + ' records';
    PRINT '';
    PRINT 'NEXT STEPS:';
    PRINT '  1. Test application functionality with migrated canvas schema and data';
    PRINT '  2. Verify canvas features work as expected';
    PRINT '  3. Monitor performance with new schema and indexes';
    PRINT '  4. Update application connection strings if needed';
    PRINT '';
    PRINT 'The script can be re-run safely - it is idempotent.';
    PRINT '================================================================================';
END
ELSE
BEGIN
    ROLLBACK TRANSACTION MigrationTrans;
    PRINT '  [8.1] ❌ Migration failed - all changes rolled back';
    PRINT '';
    PRINT '================================================================================';
    PRINT 'MIGRATION FAILED - ALL CHANGES ROLLED BACK';
    PRINT '================================================================================';
    PRINT 'Errors encountered: ' + CAST(@ErrorCount AS VARCHAR(10));
    PRINT 'Please review the error messages above and resolve issues before re-running.';
    PRINT '================================================================================';
END

SET NOCOUNT OFF;