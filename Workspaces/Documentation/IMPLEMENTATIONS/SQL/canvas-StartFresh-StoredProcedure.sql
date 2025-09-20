-- =============================================
-- NOOR Canvas StartFresh Stored Procedure
-- Purpose: Truncate all tables in canvas schema for fresh start
-- Author: GitHub Copilot
-- Created: September 20, 2025
-- Database: KSESSIONS_DEV (Development Only - NEVER run in Production)
-- =============================================

-- WARNING: This procedure will DELETE ALL DATA in canvas schema tables
-- Only use in development environment with KSESSIONS_DEV database
-- NEVER run this in production KSESSIONS database

USE [KSESSIONS_DEV]
GO

-- Drop existing procedure if it exists
IF OBJECT_ID('canvas.StartFresh', 'P') IS NOT NULL
    DROP PROCEDURE [canvas].[StartFresh]
GO

CREATE PROCEDURE [canvas].[StartFresh]
    @ConfirmationToken NVARCHAR(50) = NULL,
    @DryRun BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Safety check: Ensure we're in development database
    DECLARE @DatabaseName NVARCHAR(128) = DB_NAME()
    IF @DatabaseName != 'KSESSIONS_DEV'
    BEGIN
        RAISERROR('SECURITY VIOLATION: StartFresh can only be executed in KSESSIONS_DEV database. Current database: %s', 16, 1, @DatabaseName)
        RETURN
    END
    
    -- Require confirmation token for actual execution
    IF @DryRun = 0 AND (@ConfirmationToken IS NULL OR @ConfirmationToken != 'NOOR_CANVAS_START_FRESH')
    BEGIN
        RAISERROR('SAFETY CHECK: To execute StartFresh, provide @ConfirmationToken = ''NOOR_CANVAS_START_FRESH'' and @DryRun = 0', 16, 1)
        RETURN
    END
    
    DECLARE @StartTime DATETIME2 = GETUTCDATE()
    DECLARE @TableCount INT = 0
    DECLARE @RowsDeleted BIGINT = 0
    
    BEGIN TRY
        BEGIN TRANSACTION
        
        PRINT 'NOOR-CANVAS-STARTFRESH: Starting canvas schema cleanup at ' + CONVERT(NVARCHAR, @StartTime, 120)
        
        IF @DryRun = 1
        BEGIN
            PRINT 'NOOR-CANVAS-STARTFRESH: DRY RUN MODE - No data will be deleted'
        END
        ELSE
        BEGIN
            PRINT 'NOOR-CANVAS-STARTFRESH: LIVE MODE - Data will be permanently deleted!'
        END
        
        -- Get initial row counts for reporting
        DECLARE @InitialCounts TABLE (TableName NVARCHAR(128), TableRowCount BIGINT)
        INSERT INTO @InitialCounts
        SELECT 
            t.TABLE_NAME,
            ISNULL(p.rows, 0)
        FROM INFORMATION_SCHEMA.TABLES t
        LEFT JOIN sys.tables st ON st.name = t.TABLE_NAME AND st.schema_id = SCHEMA_ID('canvas')
        LEFT JOIN sys.partitions p ON st.object_id = p.object_id AND p.index_id IN (0, 1)
        WHERE t.TABLE_SCHEMA = 'canvas' 
        AND t.TABLE_TYPE = 'BASE TABLE'
        AND t.TABLE_NAME != '__EFMigrationsHistory'
        
        -- Show what would be affected
        PRINT 'NOOR-CANVAS-STARTFRESH: Tables to be truncated:'
        DECLARE @TableName NVARCHAR(128), @CurrentRowCount BIGINT
        DECLARE table_cursor CURSOR FOR 
            SELECT TableName, TableRowCount FROM @InitialCounts ORDER BY TableName
        
        OPEN table_cursor
        FETCH NEXT FROM table_cursor INTO @TableName, @CurrentRowCount
        WHILE @@FETCH_STATUS = 0
        BEGIN
            PRINT '  - canvas.' + @TableName + ' (' + CAST(@CurrentRowCount as NVARCHAR) + ' rows)'
            SET @RowsDeleted = @RowsDeleted + @CurrentRowCount
            SET @TableCount = @TableCount + 1
            FETCH NEXT FROM table_cursor INTO @TableName, @CurrentRowCount
        END
        CLOSE table_cursor
        DEALLOCATE table_cursor
        
        PRINT 'NOOR-CANVAS-STARTFRESH: Total tables: ' + CAST(@TableCount as NVARCHAR) + ', Total rows: ' + CAST(@RowsDeleted as NVARCHAR)
        
        IF @DryRun = 0
        BEGIN
            -- Temporarily disable foreign key constraints
            PRINT 'NOOR-CANVAS-STARTFRESH: Disabling foreign key constraints...'
            EXEC sp_MSforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT ALL', '?'
            
            -- Truncate tables in dependency order (child tables first)
            -- Level 3: Tables with FK to Questions
            IF EXISTS (SELECT 1 FROM canvas.QuestionAnswers)
            BEGIN
                TRUNCATE TABLE [canvas].[QuestionAnswers]
                PRINT 'NOOR-CANVAS-STARTFRESH: Truncated canvas.QuestionAnswers'
            END
            
            IF EXISTS (SELECT 1 FROM canvas.QuestionVotes)
            BEGIN
                TRUNCATE TABLE [canvas].[QuestionVotes]
                PRINT 'NOOR-CANVAS-STARTFRESH: Truncated canvas.QuestionVotes'
            END
            
            -- Level 2: Tables with FK to Sessions/Users (but not to Questions)
            IF EXISTS (SELECT 1 FROM canvas.Annotations)
            BEGIN
                TRUNCATE TABLE [canvas].[Annotations]
                PRINT 'NOOR-CANVAS-STARTFRESH: Truncated canvas.Annotations'
            END
            
            IF EXISTS (SELECT 1 FROM canvas.HostSessions)
            BEGIN
                TRUNCATE TABLE [canvas].[HostSessions]
                PRINT 'NOOR-CANVAS-STARTFRESH: Truncated canvas.HostSessions'
            END
            
            IF EXISTS (SELECT 1 FROM canvas.SessionLinks)
            BEGIN
                TRUNCATE TABLE [canvas].[SessionLinks]
                PRINT 'NOOR-CANVAS-STARTFRESH: Truncated canvas.SessionLinks'
            END
            
            IF EXISTS (SELECT 1 FROM canvas.SharedAssets)
            BEGIN
                TRUNCATE TABLE [canvas].[SharedAssets]
                PRINT 'NOOR-CANVAS-STARTFRESH: Truncated canvas.SharedAssets'
            END
            
            IF EXISTS (SELECT 1 FROM canvas.Questions)
            BEGIN
                TRUNCATE TABLE [canvas].[Questions]
                PRINT 'NOOR-CANVAS-STARTFRESH: Truncated canvas.Questions'
            END
            
            IF EXISTS (SELECT 1 FROM canvas.Registrations)
            BEGIN
                TRUNCATE TABLE [canvas].[Registrations]
                PRINT 'NOOR-CANVAS-STARTFRESH: Truncated canvas.Registrations'
            END
            
            IF EXISTS (SELECT 1 FROM canvas.Issues)
            BEGIN
                TRUNCATE TABLE [canvas].[Issues]
                PRINT 'NOOR-CANVAS-STARTFRESH: Truncated canvas.Issues'
            END
            
            IF EXISTS (SELECT 1 FROM canvas.AuditLog)
            BEGIN
                TRUNCATE TABLE [canvas].[AuditLog]
                PRINT 'NOOR-CANVAS-STARTFRESH: Truncated canvas.AuditLog'
            END
            
            -- Level 1: Parent tables (Sessions, Users)
            IF EXISTS (SELECT 1 FROM canvas.Sessions)
            BEGIN
                TRUNCATE TABLE [canvas].[Sessions]
                PRINT 'NOOR-CANVAS-STARTFRESH: Truncated canvas.Sessions'
            END
            
            IF EXISTS (SELECT 1 FROM canvas.Users)
            BEGIN
                TRUNCATE TABLE [canvas].[Users]
                PRINT 'NOOR-CANVAS-STARTFRESH: Truncated canvas.Users'
            END
            
            -- Re-enable foreign key constraints
            PRINT 'NOOR-CANVAS-STARTFRESH: Re-enabling foreign key constraints...'
            EXEC sp_MSforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT ALL', '?'
            
            -- Reset IDENTITY seeds to start from 1
            PRINT 'NOOR-CANVAS-STARTFRESH: Resetting identity seeds...'
            DBCC CHECKIDENT('canvas.Sessions', RESEED, 0)
            DBCC CHECKIDENT('canvas.Annotations', RESEED, 0)
            DBCC CHECKIDENT('canvas.HostSessions', RESEED, 0)
            DBCC CHECKIDENT('canvas.SessionLinks', RESEED, 0)
            DBCC CHECKIDENT('canvas.SharedAssets', RESEED, 0)
            DBCC CHECKIDENT('canvas.AuditLog', RESEED, 0)
            DBCC CHECKIDENT('canvas.Issues', RESEED, 0)
            DBCC CHECKIDENT('canvas.Questions', RESEED, 0)
            DBCC CHECKIDENT('canvas.Registrations', RESEED, 0)
            DBCC CHECKIDENT('canvas.QuestionAnswers', RESEED, 0)
            DBCC CHECKIDENT('canvas.QuestionVotes', RESEED, 0)
            
            PRINT 'NOOR-CANVAS-STARTFRESH: Identity seeds reset to 1'
        END
        
        COMMIT TRANSACTION
        
        DECLARE @EndTime DATETIME2 = GETUTCDATE()
        DECLARE @Duration INT = DATEDIFF(MILLISECOND, @StartTime, @EndTime)
        
        PRINT 'NOOR-CANVAS-STARTFRESH: Completed successfully at ' + CONVERT(NVARCHAR, @EndTime, 120)
        PRINT 'NOOR-CANVAS-STARTFRESH: Duration: ' + CAST(@Duration as NVARCHAR) + 'ms'
        PRINT 'NOOR-CANVAS-STARTFRESH: Tables processed: ' + CAST(@TableCount as NVARCHAR)
        
        IF @DryRun = 0
        BEGIN
            PRINT 'NOOR-CANVAS-STARTFRESH: Total rows deleted: ' + CAST(@RowsDeleted as NVARCHAR)
            PRINT 'NOOR-CANVAS-STARTFRESH: Canvas schema is now clean and ready for fresh start'
        END
        ELSE
        BEGIN
            PRINT 'NOOR-CANVAS-STARTFRESH: Would have deleted ' + CAST(@RowsDeleted as NVARCHAR) + ' rows (DRY RUN)'
        END
        
    END TRY
    BEGIN CATCH
        -- Rollback transaction on error
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION
            
        -- Re-enable constraints in case of error
        BEGIN TRY
            EXEC sp_MSforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT ALL', '?'
        END TRY
        BEGIN CATCH
            PRINT 'NOOR-CANVAS-STARTFRESH: WARNING - Error re-enabling constraints'
        END CATCH
        
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE()
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY()
        DECLARE @ErrorState INT = ERROR_STATE()
        
        PRINT 'NOOR-CANVAS-STARTFRESH: ERROR - ' + @ErrorMessage
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState)
    END CATCH
END
GO

-- Grant execute permission (adjust as needed for your security model)
-- GRANT EXECUTE ON [canvas].[StartFresh] TO [your_role_here]

PRINT 'NOOR-CANVAS-STARTFRESH: Stored procedure canvas.StartFresh created successfully'
PRINT ''
PRINT 'USAGE EXAMPLES:'
PRINT '-- Dry run (safe, shows what would be deleted):'
PRINT 'EXEC canvas.StartFresh @DryRun = 1'
PRINT ''
PRINT '-- Actual execution (PERMANENT DATA DELETION):'
PRINT 'EXEC canvas.StartFresh @ConfirmationToken = ''NOOR_CANVAS_START_FRESH'', @DryRun = 0'
PRINT ''
PRINT 'SAFETY FEATURES:'
PRINT '- Only works in KSESSIONS_DEV database (not production)'
PRINT '- Requires confirmation token for actual execution'
PRINT '- DryRun mode shows impact without deleting data'
PRINT '- Proper transaction management and error handling'
PRINT '- Foreign key constraint management'
PRINT '- Identity seed reset to start fresh'

GO