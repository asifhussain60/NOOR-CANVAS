-- NOOR CANVAS: Simple Phase 2 - Direct Enhancement
-- Direct SQL commands to enhance remaining tables

USE [KSESSIONS_DEV]
GO

PRINT 'NOOR-CANVAS: Simple Phase 2 Enhancement'
PRINT '======================================='

-- Step 1: Add embedded token columns to Sessions table
PRINT 'Step 1: Adding token columns to Sessions...'

ALTER TABLE canvas.Sessions ADD 
    HostToken NVARCHAR(8) NULL,
    UserToken NVARCHAR(8) NULL,
    TokenExpiresAt DATETIME2 NULL,
    TokenAccessCount INT NOT NULL DEFAULT 0,
    TokenCreatedByIp NVARCHAR(45) NULL,
    TokenLastAccessedAt DATETIME2 NULL

PRINT '✅ Added embedded token columns to Sessions'

-- Step 2: Add unique indexes for tokens
PRINT 'Step 2: Creating token indexes...'

CREATE UNIQUE INDEX UQ_Sessions_HostToken ON canvas.Sessions (HostToken) 
WHERE HostToken IS NOT NULL

CREATE UNIQUE INDEX UQ_Sessions_UserToken ON canvas.Sessions (UserToken)
WHERE UserToken IS NOT NULL

PRINT '✅ Created unique token indexes'

-- Step 3: Enhance SessionParticipants table
PRINT 'Step 3: Enhancing SessionParticipants...'

ALTER TABLE canvas.SessionParticipants ADD
    Email NVARCHAR(255) NULL,
    Country NVARCHAR(100) NULL,
    IsHost BIT NOT NULL DEFAULT 0,
    IsDeleted BIT NOT NULL DEFAULT 0,
    LastSeenAt DATETIME2 NULL,
    UserGuid NVARCHAR(36) NULL

PRINT '✅ Enhanced SessionParticipants table'

-- Step 4: Create SessionData table
PRINT 'Step 4: Creating SessionData table...'

CREATE TABLE canvas.SessionData (
    DataId INT IDENTITY(1,1) PRIMARY KEY,
    SessionId BIGINT NOT NULL,
    DataType NVARCHAR(50) NOT NULL,
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

PRINT '✅ Created SessionData table'

-- Step 5: Create performance indexes
PRINT 'Step 5: Creating performance indexes...'

CREATE INDEX IX_Sessions_Status_TokenExpires ON canvas.Sessions (Status, TokenExpiresAt)
CREATE INDEX IX_SessionParticipants_SessionUser ON canvas.SessionParticipants (SessionId, UserId)
CREATE INDEX IX_SessionData_SessionType ON canvas.SessionData (SessionId, DataType)
CREATE INDEX IX_SessionData_QueryOptimized ON canvas.SessionData (SessionId, DataType, IsDeleted, CreatedAt)

PRINT '✅ Created performance indexes'

-- Step 6: Summary
PRINT 'Step 6: Summary of changes...'

SELECT COUNT(*) AS [Total canvas tables] FROM sys.tables WHERE schema_id = SCHEMA_ID('canvas')

PRINT ''
PRINT 'ENHANCEMENT COMPLETE! ✅'
PRINT '======================'
PRINT 'Enhanced 3-table simplified schema:'
PRINT '  📊 canvas.Sessions - Core sessions with embedded tokens'
PRINT '  📊 canvas.SessionParticipants - Unified participant management' 
PRINT '  📊 canvas.SessionData - JSON content storage'
PRINT ''
PRINT '🎯 Ready to enable Features:UseSimplifiedSchema=true!'

GO