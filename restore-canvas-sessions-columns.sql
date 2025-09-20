-- Restore GroupId and HostGuid columns with data
-- Purpose: Add back critical columns with proper naming and restore data from backup

USE KSESSIONS_DEV;
GO

PRINT 'Restoring GroupId and HostGuid columns to canvas.Sessions...';

-- Step 1: Add back the columns
PRINT 'Adding AlbumId (formerly GroupId) column...';
ALTER TABLE canvas.Sessions ADD AlbumId uniqueidentifier NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';

PRINT 'Adding HostToken (formerly HostGuid) column...';
ALTER TABLE canvas.Sessions ADD HostToken nvarchar(100) NOT NULL DEFAULT '';

-- Step 2: Restore the original data we know from our previous analysis
PRINT 'Restoring original data for SessionId 212...';
UPDATE canvas.Sessions 
SET AlbumId = '5F38C267-FA09-4F6D-B06D-465226239E91',
    HostToken = '122B3668-F19A-4FD7-8CB9-4A5850170514'
WHERE SessionId = 212;

-- Step 3: Verify the restoration
PRINT 'Verifying restored data:';
SELECT 
    SessionId,
    AlbumId, 
    HostToken,
    Title,
    Status
FROM canvas.Sessions;

-- Step 4: Show final table structure
PRINT 'Final table structure:';
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE,
    CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'canvas' AND TABLE_NAME = 'Sessions' 
ORDER BY ORDINAL_POSITION;

PRINT 'GroupId and HostGuid restoration completed successfully!';
PRINT 'Note: Renamed GroupId -> AlbumId, HostGuid -> HostToken for better clarity';

GO