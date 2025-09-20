-- Canvas.Sessions Schema Update - Step by Step
-- Purpose: Rename KSessionsId to SessionId (new PK), remove old SessionId, GroupId, HostGuid
-- Date: 2025-09-20

USE KSESSIONS_DEV;
GO

PRINT 'Step 1: Disable foreign key constraints that reference canvas.Sessions.SessionId';

-- Disable FK_Participants_Sessions_SessionId
ALTER TABLE canvas.Participants NOCHECK CONSTRAINT FK_Participants_Sessions_SessionId;
PRINT 'Disabled FK_Participants_Sessions_SessionId';

-- Disable FK_SessionData_Sessions_SessionId  
ALTER TABLE canvas.SessionData NOCHECK CONSTRAINT FK_SessionData_Sessions_SessionId;
PRINT 'Disabled FK_SessionData_Sessions_SessionId';

PRINT 'Step 2: Show current data before changes';
SELECT SessionId AS Old_Canvas_SessionId, KSessionsId AS New_SessionId_Value, GroupId, HostGuid, Title 
FROM canvas.Sessions;

GO