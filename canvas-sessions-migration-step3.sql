-- Canvas.Sessions Schema Update - Step 3
-- Purpose: Perform the actual schema changes

USE KSESSIONS_DEV;
GO

PRINT 'Step 3: Performing schema changes on canvas.Sessions';

-- Drop the current primary key constraint
PRINT 'Dropping current primary key constraint...';
ALTER TABLE canvas.Sessions DROP CONSTRAINT PK_Sessions;

-- Add temporary column to hold KSessionsId values
PRINT 'Adding temporary column for new SessionId...';
ALTER TABLE canvas.Sessions ADD NewSessionId bigint;

-- Copy KSessionsId to NewSessionId
PRINT 'Copying KSessionsId values to NewSessionId...';
UPDATE canvas.Sessions 
SET NewSessionId = ISNULL(KSessionsId, 0);

-- Verify the copy
SELECT 'Before dropping columns' AS Status, SessionId AS Old_SessionId, KSessionsId, NewSessionId, Title 
FROM canvas.Sessions;

-- Drop unwanted columns
PRINT 'Dropping columns: SessionId, KSessionsId, GroupId, HostGuid...';
ALTER TABLE canvas.Sessions DROP COLUMN SessionId;
ALTER TABLE canvas.Sessions DROP COLUMN KSessionsId; 
ALTER TABLE canvas.Sessions DROP COLUMN GroupId;
ALTER TABLE canvas.Sessions DROP COLUMN HostGuid;

-- Rename NewSessionId to SessionId
PRINT 'Renaming NewSessionId to SessionId...';
EXEC sp_rename 'canvas.Sessions.NewSessionId', 'SessionId', 'COLUMN';

-- Make SessionId NOT NULL
PRINT 'Making SessionId NOT NULL...';
ALTER TABLE canvas.Sessions ALTER COLUMN SessionId bigint NOT NULL;

-- Add primary key constraint
PRINT 'Adding primary key constraint on SessionId...';
ALTER TABLE canvas.Sessions ADD CONSTRAINT PK_Sessions PRIMARY KEY (SessionId);

-- Show final result
PRINT 'Schema update completed! Final structure:';
SELECT SessionId, Title, Status, CreatedAt FROM canvas.Sessions;

GO