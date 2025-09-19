-- Query canvas schema to understand what test data exists for session 212 and token 79ESAWLD
-- This will help us identify what's missing for Host Control Panel data loading
-- Database: KSESSIONS_DEV

-- Check if Session 212 exists in canvas.Sessions
SELECT 'Session 212 in canvas.Sessions:' as Query, * FROM canvas.Sessions WHERE SessionId = 212;

-- Check if host token 79ESAWLD exists in canvas.SecureTokens
SELECT 'Host token 79ESAWLD in canvas.SecureTokens:' as Query, * FROM canvas.SecureTokens WHERE HostToken = '79ESAWLD';

-- Check what SecureTokens exist for session 212
SELECT 'SecureTokens for session 212:' as Query, * FROM canvas.SecureTokens WHERE SessionId = 212;

-- Check if any HostSessions exist for session 212
SELECT 'HostSessions for session 212:' as Query, * FROM canvas.HostSessions WHERE SessionId = 212;

-- Check what exists in KSESSIONS_DEV.dbo.Sessions for session 212
SELECT 'KSESSIONS data for session 212:' as Query, s.SessionId, s.SessionName, s.Description, s.GroupId, s.CategoryId, s.IsActive
FROM dbo.Sessions s WHERE s.SessionId = 212;

-- Also check if session 212 exists and what album/category it belongs to
SELECT 'Session 212 with Album/Category info:' as Query, 
       s.SessionId, s.SessionName, s.Description, s.GroupId, s.CategoryId,
       c.CategoryName, g.GroupName as AlbumName
FROM dbo.Sessions s 
LEFT JOIN dbo.Categories c ON s.CategoryId = c.CategoryID
LEFT JOIN dbo.Groups g ON c.GroupID = g.GroupID
WHERE s.SessionId = 212;

-- Count total records in each table to understand current state
SELECT 'Canvas Sessions count' as TableInfo, COUNT(*) as RecordCount FROM canvas.Sessions
UNION ALL
SELECT 'Canvas SecureTokens count', COUNT(*) FROM canvas.SecureTokens  
UNION ALL
SELECT 'Canvas HostSessions count', COUNT(*) FROM canvas.HostSessions
UNION ALL
SELECT 'KSESSIONS Sessions count', COUNT(*) FROM dbo.Sessions;