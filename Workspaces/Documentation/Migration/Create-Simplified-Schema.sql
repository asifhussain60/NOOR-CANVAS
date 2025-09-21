-- NOOR Canvas Simplified Schema Creation Script
-- Creates the 3-table simplified architecture to replace the 15-table legacy schema
-- Run this script to enable the simplified Host Provisioner

USE KSESSIONS_DEV;
GO

-- Create the simplified Sessions table with embedded tokens
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Sessions' AND schema_id = SCHEMA_ID('canvas'))
BEGIN
    CREATE TABLE canvas.Sessions (
        SessionId int IDENTITY(1,1) PRIMARY KEY,
        KSessionsId bigint NULL,  -- Reference to KSESSIONS database SessionId
        HostToken nvarchar(8) NOT NULL DEFAULT '',
        UserToken nvarchar(8) NOT NULL DEFAULT '',
        Title nvarchar(200) NULL,
        Description nvarchar(500) NULL,
        Status nvarchar(20) NOT NULL DEFAULT 'Active',
        CreatedAt datetime2(7) NOT NULL DEFAULT GETUTCDATE(),
        ExpiresAt datetime2(7) NULL,
        CreatedBy nvarchar(100) NULL
    );
    
    -- Create indexes for performance
    CREATE NONCLUSTERED INDEX IX_Sessions_KSessionsId ON canvas.Sessions (KSessionsId);
    CREATE NONCLUSTERED INDEX IX_Sessions_HostToken ON canvas.Sessions (HostToken);
    CREATE NONCLUSTERED INDEX IX_Sessions_UserToken ON canvas.Sessions (UserToken);
    CREATE NONCLUSTERED INDEX IX_Sessions_Status ON canvas.Sessions (Status);
    
    PRINT 'Created canvas.Sessions table with embedded tokens';
END
ELSE
BEGIN
    PRINT 'canvas.Sessions table already exists';
END
GO

-- Create the simplified Participants table (replaces Users, SessionParticipants, Registrations)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Participants' AND schema_id = SCHEMA_ID('canvas'))
BEGIN
    CREATE TABLE canvas.Participants (
        ParticipantId int IDENTITY(1,1) PRIMARY KEY,
        SessionId bigint NOT NULL,
        UserGuid nvarchar(256) NULL,
        Name nvarchar(100) NULL,
        Country nvarchar(100) NULL,
        City nvarchar(100) NULL,
        JoinedAt datetime2(7) NOT NULL DEFAULT GETUTCDATE(),
        LastSeenAt datetime2(7) NULL,
        
        -- Foreign key to Sessions
        CONSTRAINT FK_Participants_SessionId FOREIGN KEY (SessionId) REFERENCES canvas.Sessions(SessionId)
    );
    
    -- Create indexes for performance
    CREATE NONCLUSTERED INDEX IX_Participants_SessionId ON canvas.Participants (SessionId);
    CREATE NONCLUSTERED INDEX IX_Participants_UserGuid ON canvas.Participants (UserGuid);
    CREATE NONCLUSTERED INDEX IX_Participants_JoinedAt ON canvas.Participants (JoinedAt);
    
    PRINT 'Created canvas.Participants table';
END
ELSE
BEGIN
    PRINT 'canvas.Participants table already exists';
END
GO

-- Create the simplified SessionData table (replaces Annotations, Questions, SharedAssets)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SessionData' AND schema_id = SCHEMA_ID('canvas'))
BEGIN
    CREATE TABLE canvas.SessionData (
        DataId int IDENTITY(1,1) PRIMARY KEY,
        SessionId bigint NOT NULL,
        DataType nvarchar(20) NOT NULL,  -- 'SharedAsset', 'Annotation', 'Question', 'QuestionAnswer'
        Content nvarchar(max) NULL,      -- JSON blob for flexible storage
        CreatedBy nvarchar(100) NULL,
        CreatedAt datetime2(7) NOT NULL DEFAULT GETUTCDATE(),
        IsDeleted bit NOT NULL DEFAULT 0,
        
        -- Foreign key to Sessions
        CONSTRAINT FK_SessionData_SessionId FOREIGN KEY (SessionId) REFERENCES canvas.Sessions(SessionId)
    );
    
    -- Create indexes for performance
    CREATE NONCLUSTERED INDEX IX_SessionData_SessionId ON canvas.SessionData (SessionId);
    CREATE NONCLUSTERED INDEX IX_SessionData_DataType ON canvas.SessionData (DataType);
    CREATE NONCLUSTERED INDEX IX_SessionData_CreatedAt ON canvas.SessionData (CreatedAt);
    CREATE NONCLUSTERED INDEX IX_SessionData_IsDeleted ON canvas.SessionData (IsDeleted);
    
    PRINT 'Created canvas.SessionData table';
END
ELSE
BEGIN
    PRINT 'canvas.SessionData table already exists';
END
GO

PRINT '✅ Simplified Schema Creation Complete!';
PRINT '';
PRINT '📊 Schema Summary:';
PRINT '  → canvas.Sessions (with embedded HostToken/UserToken)';
PRINT '  → canvas.Participants (consolidated user management)'; 
PRINT '  → canvas.SessionData (JSON-based flexible storage)';
PRINT '';
PRINT '🎯 Ready for simplified Host Provisioner!';
PRINT '   Run: nct 212 to test token generation';