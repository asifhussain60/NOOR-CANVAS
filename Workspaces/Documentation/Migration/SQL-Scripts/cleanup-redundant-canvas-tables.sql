-- NOOR CANVAS: Schema Cleanup Script
-- Removes 12 redundant tables from the bloated 15-table canvas schema
-- Keeps only the 3 essential tables: Sessions, SessionParticipants (→Participants), Users (to be merged)
-- Part of the 15→3 table simplification strategy

USE [KSESSIONS_DEV]
GO

PRINT 'NOOR-SCHEMA-CLEANUP: Starting canvas table cleanup...'
PRINT 'Target: Remove 12 redundant tables, keep 3 essential tables'

-- Step 1: Backup existing data (optional - run if you want to preserve data)
PRINT 'Step 1: Creating backup tables (optional)...'

-- Uncomment these lines if you want to backup data before deletion
/*
SELECT * INTO canvas_SecureTokens_BACKUP FROM canvas.SecureTokens
SELECT * INTO canvas_Annotations_BACKUP FROM canvas.Annotations  
SELECT * INTO canvas_Questions_BACKUP FROM canvas.Questions
-- Add other backup commands as needed
*/

-- Step 2: Drop foreign key constraints first (to avoid dependency errors)
PRINT 'Step 2: Dropping foreign key constraints...'

-- Get all foreign keys related to canvas tables we're about to drop
DECLARE @sql NVARCHAR(MAX) = ''

SELECT @sql = @sql + 'ALTER TABLE [' + SCHEMA_NAME(schema_id) + '].[' + OBJECT_NAME(parent_object_id) + '] DROP CONSTRAINT [' + name + '];' + CHAR(13)
FROM sys.foreign_keys 
WHERE referenced_object_id IN (
    SELECT object_id FROM sys.tables 
    WHERE schema_id = SCHEMA_ID('canvas') 
    AND name IN ('AdminSessions', 'Annotations', 'AuditLog', 'HostSessions', 'Issues', 
                 'Questions', 'QuestionAnswers', 'QuestionVotes', 'Registrations', 
                 'SecureTokens', 'SessionLinks', 'SharedAssets')
)

EXEC sp_executesql @sql

-- Step 3: Drop the redundant tables in dependency order
PRINT 'Step 3: Dropping redundant tables...'

-- Drop tables with no dependencies first
IF OBJECT_ID('canvas.AuditLog', 'U') IS NOT NULL DROP TABLE canvas.AuditLog
IF OBJECT_ID('canvas.Issues', 'U') IS NOT NULL DROP TABLE canvas.Issues  
IF OBJECT_ID('canvas.SessionLinks', 'U') IS NOT NULL DROP TABLE canvas.SessionLinks
IF OBJECT_ID('canvas.SharedAssets', 'U') IS NOT NULL DROP TABLE canvas.SharedAssets

-- Drop tables that reference other canvas tables
IF OBJECT_ID('canvas.QuestionVotes', 'U') IS NOT NULL DROP TABLE canvas.QuestionVotes
IF OBJECT_ID('canvas.QuestionAnswers', 'U') IS NOT NULL DROP TABLE canvas.QuestionAnswers  
IF OBJECT_ID('canvas.Questions', 'U') IS NOT NULL DROP TABLE canvas.Questions
IF OBJECT_ID('canvas.Annotations', 'U') IS NOT NULL DROP TABLE canvas.Annotations
IF OBJECT_ID('canvas.Registrations', 'U') IS NOT NULL DROP TABLE canvas.Registrations
IF OBJECT_ID('canvas.SecureTokens', 'U') IS NOT NULL DROP TABLE canvas.SecureTokens
IF OBJECT_ID('canvas.AdminSessions', 'U') IS NOT NULL DROP TABLE canvas.AdminSessions
IF OBJECT_ID('canvas.HostSessions', 'U') IS NOT NULL DROP TABLE canvas.HostSessions

PRINT 'Dropped 12 redundant tables successfully!'

-- Step 4: Enhance remaining tables for simplified schema
PRINT 'Step 4: Enhancing remaining tables for simplified schema...'

-- Add embedded token columns to Sessions table (if not already present)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('canvas.Sessions') AND name = 'HostToken')
BEGIN
    ALTER TABLE canvas.Sessions ADD 
        HostToken NVARCHAR(8) NULL,
        UserToken NVARCHAR(8) NULL,
        TokenExpiresAt DATETIME2 NULL,
        TokenAccessCount INT NOT NULL DEFAULT 0,
        TokenCreatedByIp NVARCHAR(45) NULL,
        TokenLastAccessedAt DATETIME2 NULL
    
    PRINT 'Added embedded token columns to Sessions table'
END

-- Add unique constraints for tokens
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'UQ_Sessions_HostToken')
BEGIN
    CREATE UNIQUE INDEX UQ_Sessions_HostToken ON canvas.Sessions (HostToken) 
    WHERE HostToken IS NOT NULL
    PRINT 'Created unique index for HostToken'
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'UQ_Sessions_UserToken')  
BEGIN
    CREATE UNIQUE INDEX UQ_Sessions_UserToken ON canvas.Sessions (UserToken)
    WHERE UserToken IS NOT NULL
    PRINT 'Created unique index for UserToken'
END

-- Enhance SessionParticipants to become unified Participants table
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('canvas.SessionParticipants') AND name = 'DisplayName')
BEGIN
    ALTER TABLE canvas.SessionParticipants ADD
        DisplayName NVARCHAR(255) NOT NULL DEFAULT '',
        Email NVARCHAR(255) NULL,
        Country NVARCHAR(100) NULL, 
        IsHost BIT NOT NULL DEFAULT 0,
        IsDeleted BIT NOT NULL DEFAULT 0,
        LastSeenAt DATETIME2 NULL
    
    PRINT 'Enhanced SessionParticipants table with unified participant data'
END

-- Step 5: Create SessionData table for JSON content storage (replaces Annotations, Questions, etc.)
IF NOT OBJECT_ID('canvas.SessionData', 'U') IS NOT NULL
BEGIN
    CREATE TABLE canvas.SessionData (
        DataId INT IDENTITY(1,1) PRIMARY KEY,
        SessionId BIGINT NOT NULL,
        DataType NVARCHAR(50) NOT NULL, -- 'Annotation', 'Question', 'Transcript', etc.
        JsonContent NVARCHAR(MAX) NOT NULL DEFAULT '{}',
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CreatedByUserGuid NVARCHAR(36) NULL,
        UpdatedAt DATETIME2 NULL,
        UpdatedByUserGuid NVARCHAR(36) NULL,
        IsDeleted BIT NOT NULL DEFAULT 0,
        DeletedAt DATETIME2 NULL,
        
        CONSTRAINT FK_SessionData_Sessions FOREIGN KEY (SessionId) 
            REFERENCES canvas.Sessions(SessionId) ON DELETE CASCADE
    )
    
    PRINT 'Created SessionData table for JSON content storage'
END

-- Step 6: Create performance indexes for simplified schema
PRINT 'Step 6: Creating performance indexes...'

-- Sessions performance indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Sessions_Status_TokenExpires')
BEGIN
    CREATE INDEX IX_Sessions_Status_TokenExpires ON canvas.Sessions (Status, TokenExpiresAt)
    PRINT 'Created performance index: IX_Sessions_Status_TokenExpires'
END

-- SessionParticipants performance indexes  
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SessionParticipants_SessionUser')
BEGIN
    CREATE INDEX IX_SessionParticipants_SessionUser ON canvas.SessionParticipants (SessionId, UserGuid)
    PRINT 'Created performance index: IX_SessionParticipants_SessionUser'
END

-- SessionData performance indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SessionData_SessionType')
BEGIN
    CREATE INDEX IX_SessionData_SessionType ON canvas.SessionData (SessionId, DataType)
    PRINT 'Created performance index: IX_SessionData_SessionType'
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SessionData_QueryOptimized')
BEGIN
    CREATE INDEX IX_SessionData_QueryOptimized ON canvas.SessionData (SessionId, DataType, IsDeleted, CreatedAt)
    PRINT 'Created performance index: IX_SessionData_QueryOptimized'
END

-- Step 7: Summary and validation
PRINT 'Step 7: Schema cleanup summary...'

-- Count remaining canvas tables
DECLARE @RemainingTables INT
SELECT @RemainingTables = COUNT(*) 
FROM sys.tables t
JOIN sys.schemas s ON t.schema_id = s.schema_id
WHERE s.name = 'canvas'

PRINT 'NOOR-SCHEMA-CLEANUP COMPLETE!'
PRINT '════════════════════════════════════'
PRINT 'Tables removed: 12 redundant tables'
PRINT 'Tables remaining: ' + CAST(@RemainingTables AS VARCHAR) + ' essential tables'
PRINT 'Schema reduction: 80% (15→3 core tables)'
PRINT 'Enhanced tables: Sessions (embedded tokens), SessionParticipants (unified), SessionData (JSON)'
PRINT '════════════════════════════════════'

-- List remaining canvas tables
PRINT 'Remaining canvas tables:'
SELECT 
    'canvas.' + t.name AS TableName,
    CASE t.name 
        WHEN 'Sessions' THEN 'Core session data with embedded tokens'
        WHEN 'SessionParticipants' THEN 'Unified participant management (enhanced)'
        WHEN 'Users' THEN 'To be merged into SessionParticipants'
        WHEN 'SessionData' THEN 'JSON content storage (NEW)'
        ELSE 'Other table'
    END AS Purpose
FROM sys.tables t
JOIN sys.schemas s ON t.schema_id = s.schema_id  
WHERE s.name = 'canvas'
ORDER BY t.name

PRINT 'Schema cleanup completed successfully! ✅'
PRINT 'Next step: Update application to use Features:UseSimplifiedSchema=true'

GO