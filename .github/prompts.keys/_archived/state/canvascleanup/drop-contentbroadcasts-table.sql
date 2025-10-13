-- [DEBUG-WORKITEM:canvascleanup:impl] Drop ContentBroadcasts table from KSESSIONS_DEV database ;CLEANUP_OK
-- Created: 2024 for canvascleanup workitem - Phase 1 cleanup
-- Purpose: Remove ContentBroadcasts table and all related data as part of system cleanup

USE KSESSIONS_DEV;
GO

-- Check if table exists and drop it
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'ContentBroadcasts')
BEGIN
    PRINT 'Dropping ContentBroadcasts table...';
    DROP TABLE ContentBroadcasts;
    PRINT 'ContentBroadcasts table dropped successfully.';
END
ELSE
BEGIN
    PRINT 'ContentBroadcasts table does not exist.';
END
GO

-- Verify table was dropped
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'ContentBroadcasts')
BEGIN
    PRINT 'Verification: ContentBroadcasts table successfully removed from database.';
END
ELSE
BEGIN
    PRINT 'WARNING: ContentBroadcasts table still exists!';
END
GO