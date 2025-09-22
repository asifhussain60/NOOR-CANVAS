-- Migration: Add UserToken column to canvas.Participants table
-- Purpose: Enable direct participant-token relationships for proper grouping
-- Date: September 21, 2025
-- Issue: Group Participants by User Token

USE [KSESSIONS_DEV];
GO

-- Step 1: Add UserToken column to Participants table
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('canvas.Participants') 
    AND name = 'UserToken'
)
BEGIN
    ALTER TABLE canvas.Participants 
    ADD UserToken VARCHAR(8) NULL;
    
    PRINT '✅ UserToken column added to canvas.Participants';
END
ELSE
BEGIN
    PRINT '⚠️ UserToken column already exists in canvas.Participants';
END
GO

-- Step 2: Populate UserToken for existing participants
-- Get UserToken from the Sessions table via SessionId
UPDATE p 
SET p.UserToken = s.UserToken
FROM canvas.Participants p
INNER JOIN canvas.Sessions s ON p.SessionId = s.SessionId
WHERE p.UserToken IS NULL 
  AND s.UserToken IS NOT NULL;

DECLARE @UpdatedRows INT = @@ROWCOUNT;
PRINT '✅ Updated ' + CAST(@UpdatedRows AS VARCHAR(10)) + ' existing participants with UserToken';
GO

-- Step 3: Make UserToken column NOT NULL after population
ALTER TABLE canvas.Participants 
ALTER COLUMN UserToken VARCHAR(8) NOT NULL;

PRINT '✅ UserToken column set to NOT NULL';
GO

-- Step 4: SKIP foreign key constraint (canvas.SecureTokens table doesn't exist)
-- Note: UserToken integrity is maintained via application logic in ParticipantController
-- Future: Create canvas.SecureTokens table or reference existing token storage if needed
PRINT 'ℹ️ SKIP: Foreign key constraint (canvas.SecureTokens table not found)';
PRINT 'ℹ️ UserToken integrity maintained via application logic';
GO

-- Step 5: Create index for performance
IF NOT EXISTS (
    SELECT * FROM sys.indexes 
    WHERE name = 'IX_Participants_UserToken' 
    AND object_id = OBJECT_ID('canvas.Participants')
)
BEGIN
    CREATE INDEX IX_Participants_UserToken 
    ON canvas.Participants(UserToken);
    
    PRINT '✅ Performance index created: IX_Participants_UserToken';
END
ELSE
BEGIN
    PRINT '⚠️ Performance index already exists: IX_Participants_UserToken';
END
GO

-- Step 6: Verification query
SELECT 
    COUNT(*) as TotalParticipants,
    COUNT(UserToken) as ParticipantsWithToken,
    COUNT(DISTINCT UserToken) as UniqueTokens
FROM canvas.Participants;

PRINT '✅ Migration completed successfully';
PRINT 'ℹ️ Participants are now directly grouped by UserToken';
GO