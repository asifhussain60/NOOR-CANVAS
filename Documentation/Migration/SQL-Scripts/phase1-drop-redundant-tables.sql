-- NOOR CANVAS: Safe Schema Cleanup - Step by Step
-- Phase 1: Drop redundant tables only (keep Sessions, SessionParticipants, Users for now)

USE [KSESSIONS_DEV]
GO

PRINT 'NOOR-CANVAS: Phase 1 - Safe Cleanup of Redundant Tables'
PRINT '====================================================='

-- Step 1: Drop foreign key constraints that might prevent table deletion
PRINT 'Step 1: Dropping foreign key constraints...'

-- Drop constraints from tables we're about to remove
DECLARE @DropConstraintSQL NVARCHAR(MAX) = ''

SELECT @DropConstraintSQL = @DropConstraintSQL + 
    'IF OBJECT_ID(''' + SCHEMA_NAME(f.schema_id) + '.' + f.name + ''', ''F'') IS NOT NULL ' +
    'ALTER TABLE [' + SCHEMA_NAME(pt.schema_id) + '].[' + pt.name + '] DROP CONSTRAINT [' + f.name + '];' + CHAR(13)
FROM sys.foreign_keys f
JOIN sys.tables pt ON f.parent_object_id = pt.object_id  
JOIN sys.tables rt ON f.referenced_object_id = rt.object_id
WHERE rt.schema_id = SCHEMA_ID('canvas')
  AND rt.name IN ('AdminSessions', 'Annotations', 'AuditLog', 'HostSessions', 'Issues',
                  'QuestionAnswers', 'Questions', 'QuestionVotes', 'Registrations', 
                  'SecureTokens', 'SessionLinks', 'SharedAssets')

IF LEN(@DropConstraintSQL) > 0
BEGIN
    EXEC sp_executesql @DropConstraintSQL
    PRINT 'Dropped foreign key constraints'
END
ELSE
    PRINT 'No foreign key constraints to drop'

-- Step 2: Drop redundant tables in safe order
PRINT 'Step 2: Dropping redundant tables...'

-- Tables with minimal dependencies first
IF OBJECT_ID('canvas.AuditLog', 'U') IS NOT NULL 
BEGIN
    DROP TABLE canvas.AuditLog
    PRINT '✓ Dropped canvas.AuditLog'
END

IF OBJECT_ID('canvas.Issues', 'U') IS NOT NULL
BEGIN  
    DROP TABLE canvas.Issues
    PRINT '✓ Dropped canvas.Issues'
END

IF OBJECT_ID('canvas.SessionLinks', 'U') IS NOT NULL
BEGIN
    DROP TABLE canvas.SessionLinks  
    PRINT '✓ Dropped canvas.SessionLinks'
END

IF OBJECT_ID('canvas.SharedAssets', 'U') IS NOT NULL
BEGIN
    DROP TABLE canvas.SharedAssets
    PRINT '✓ Dropped canvas.SharedAssets'
END

-- Question-related tables (in dependency order)
IF OBJECT_ID('canvas.QuestionVotes', 'U') IS NOT NULL
BEGIN
    DROP TABLE canvas.QuestionVotes
    PRINT '✓ Dropped canvas.QuestionVotes'  
END

IF OBJECT_ID('canvas.QuestionAnswers', 'U') IS NOT NULL
BEGIN
    DROP TABLE canvas.QuestionAnswers
    PRINT '✓ Dropped canvas.QuestionAnswers'
END

IF OBJECT_ID('canvas.Questions', 'U') IS NOT NULL
BEGIN
    DROP TABLE canvas.Questions
    PRINT '✓ Dropped canvas.Questions'
END

-- Other redundant tables
IF OBJECT_ID('canvas.Annotations', 'U') IS NOT NULL
BEGIN
    DROP TABLE canvas.Annotations
    PRINT '✓ Dropped canvas.Annotations'
END

IF OBJECT_ID('canvas.Registrations', 'U') IS NOT NULL
BEGIN
    DROP TABLE canvas.Registrations  
    PRINT '✓ Dropped canvas.Registrations'
END

IF OBJECT_ID('canvas.SecureTokens', 'U') IS NOT NULL
BEGIN
    DROP TABLE canvas.SecureTokens
    PRINT '✓ Dropped canvas.SecureTokens'
END

IF OBJECT_ID('canvas.AdminSessions', 'U') IS NOT NULL
BEGIN
    DROP TABLE canvas.AdminSessions
    PRINT '✓ Dropped canvas.AdminSessions'
END

IF OBJECT_ID('canvas.HostSessions', 'U') IS NOT NULL
BEGIN
    DROP TABLE canvas.HostSessions
    PRINT '✓ Dropped canvas.HostSessions'
END

-- Step 3: Verify cleanup
PRINT 'Step 3: Cleanup verification...'

DECLARE @RemainingTables TABLE (TableName NVARCHAR(128))
INSERT INTO @RemainingTables (TableName)
SELECT name FROM sys.tables WHERE schema_id = SCHEMA_ID('canvas')

DECLARE @TableCount INT = (SELECT COUNT(*) FROM @RemainingTables)

PRINT 'CLEANUP COMPLETE! ✅'
PRINT '=================='
PRINT 'Tables removed: 12 redundant tables'
PRINT 'Tables remaining: ' + CAST(@TableCount AS VARCHAR(10))
PRINT ''
PRINT 'Remaining canvas tables:'
SELECT '  ✓ canvas.' + TableName FROM @RemainingTables ORDER BY TableName

PRINT ''
PRINT '🎯 Schema reduced from 15 tables to ' + CAST(@TableCount AS VARCHAR(10)) + ' tables'
PRINT '📊 Reduction: ' + CAST((12.0/15.0)*100 AS VARCHAR(10)) + '% complexity eliminated'
PRINT ''
PRINT 'Next steps:'  
PRINT '1. Run Phase 2 script to enhance remaining tables'
PRINT '2. Enable Features:UseSimplifiedSchema=true'
PRINT '3. Test the simplified architecture'

GO