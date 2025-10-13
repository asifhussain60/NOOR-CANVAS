-- =========================================================================
-- Session-Ended Feature Migration Script
-- Database: KSESSIONS (Production)
-- Date: 2025-10-12
-- Author: GitHub Copilot
-- 
-- Purpose: No schema changes required - canvas.Sessions table already has:
--   - Status (nvarchar(50)) - Will be set to 'Ended'
--   - EndedAt (datetime2) - Will be populated with end timestamp
--   - ExpiresAt (datetime2) - Will be set to current time to expire token
--
-- This script is for documentation purposes only. The application handles
-- session ending through the API endpoint: POST /api/session/{id}/end
-- =========================================================================

USE [KSESSIONS];
GO

-- Verify schema is ready for session-ended feature
PRINT '=== Verifying canvas.Sessions schema for session-ended feature ===';

-- Check Status column exists
IF EXISTS (
    SELECT 1 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'canvas' 
    AND TABLE_NAME = 'Sessions' 
    AND COLUMN_NAME = 'Status'
)
BEGIN
    PRINT '✅ Status column exists in canvas.Sessions';
END
ELSE
BEGIN
    PRINT '❌ ERROR: Status column missing from canvas.Sessions';
    RAISERROR('Required column Status not found in canvas.Sessions', 16, 1);
    RETURN;
END

-- Check EndedAt column exists
IF EXISTS (
    SELECT 1 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'canvas' 
    AND TABLE_NAME = 'Sessions' 
    AND COLUMN_NAME = 'EndedAt'
)
BEGIN
    PRINT '✅ EndedAt column exists in canvas.Sessions';
END
ELSE
BEGIN
    PRINT '❌ ERROR: EndedAt column missing from canvas.Sessions';
    RAISERROR('Required column EndedAt not found in canvas.Sessions', 16, 1);
    RETURN;
END

-- Check ExpiresAt column exists
IF EXISTS (
    SELECT 1 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'canvas' 
    AND TABLE_NAME = 'Sessions' 
    AND COLUMN_NAME = 'ExpiresAt'
)
BEGIN
    PRINT '✅ ExpiresAt column exists in canvas.Sessions';
END
ELSE
BEGIN
    PRINT '❌ ERROR: ExpiresAt column missing from canvas.Sessions';
    RAISERROR('Required column ExpiresAt not found in canvas.Sessions', 16, 1);
    RETURN;
END

PRINT '';
PRINT '=== Schema verification complete ===';
PRINT 'All required columns exist in canvas.Sessions';
PRINT '';
PRINT '=== Session-Ended Feature Ready ===';
PRINT 'The application will use the following SQL when ending a session:';
PRINT '';
PRINT 'UPDATE canvas.Sessions';
PRINT 'SET Status = ''Ended'',';
PRINT '    EndedAt = GETUTCDATE(),';
PRINT '    ExpiresAt = GETUTCDATE(),';
PRINT '    ModifiedAt = GETUTCDATE()';
PRINT 'WHERE SessionId = @SessionId;';
PRINT '';
PRINT '=== Example: Query ended sessions ===';
PRINT '';

-- Note: Title and Description columns don't exist in KSESSIONS production
-- Session metadata is stored in dbo.Sessions (KSESSIONS legacy schema)
SELECT TOP 10
    SessionId,
    Status,
    StartedAt,
    EndedAt,
    ExpiresAt,
    ModifiedAt,
    CreatedAt
FROM canvas.Sessions
WHERE Status = 'Ended'
ORDER BY EndedAt DESC;

PRINT '';
PRINT '=== Migration Complete ===';
PRINT 'Schema verified - all required columns exist.';
PRINT 'Session-ended feature ready for deployment.';
GO
