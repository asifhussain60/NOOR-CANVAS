-- Canvas.Sessions Schema Update - Step 2
-- Purpose: Update foreign key references to use KSessionsId values instead of SessionId

USE KSESSIONS_DEV;
GO

PRINT 'Step 2: Update foreign key references to use KSessionsId (212) instead of SessionId (1)';

-- Update Participants table references
PRINT 'Updating canvas.Participants.SessionId references...';
UPDATE p 
SET p.SessionId = s.KSessionsId
FROM canvas.Participants p
INNER JOIN canvas.Sessions s ON p.SessionId = s.SessionId
WHERE s.KSessionsId IS NOT NULL;

SELECT 'Participants' AS TableName, COUNT(*) AS UpdatedRows
FROM canvas.Participants WHERE SessionId = 212;

-- Update SessionData table references  
PRINT 'Updating canvas.SessionData.SessionId references...';
UPDATE sd 
SET sd.SessionId = s.KSessionsId
FROM canvas.SessionData sd
INNER JOIN canvas.Sessions s ON sd.SessionId = s.SessionId
WHERE s.KSessionsId IS NOT NULL;

SELECT 'SessionData' AS TableName, COUNT(*) AS UpdatedRows
FROM canvas.SessionData WHERE SessionId = 212;

PRINT 'Foreign key reference updates completed.';

GO