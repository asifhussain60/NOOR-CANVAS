-- Canvas.Sessions Schema Update Script
-- Purpose: Rename KSessionsId to SessionId (new PK), remove old SessionId, GroupId, HostGuid
-- Date: 2025-09-20
-- WARNING: This will break existing functionality that relies on GroupId and HostGuid

USE KSESSIONS_DEV;
GO

PRINT 'Starting canvas.Sessions schema update...';
PRINT 'WARNING: This will remove GroupId and HostGuid columns which may break authentication!';

-- Step 1: Check current data and structure
PRINT 'Current canvas.Sessions structure:';
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE, 
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'canvas' AND TABLE_NAME = 'Sessions' 
ORDER BY ORDINAL_POSITION;

-- Step 2: Show current data before changes
PRINT 'Current data in canvas.Sessions:';
SELECT SessionId, KSessionsId, GroupId, HostGuid, Title FROM canvas.Sessions;

-- Step 3: Check for foreign key references to SessionId
PRINT 'Checking foreign key references to canvas.Sessions.SessionId:';
SELECT 
    fk.name AS FK_Name,
    tp.name AS Parent_Table,
    cp.name AS Parent_Column,
    tr.name AS Referenced_Table,
    cr.name AS Referenced_Column
FROM sys.foreign_keys fk
INNER JOIN sys.tables tp ON fk.parent_object_id = tp.object_id
INNER JOIN sys.tables tr ON fk.referenced_object_id = tr.object_id
INNER JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
INNER JOIN sys.columns cp ON fkc.parent_column_id = cp.column_id AND fkc.parent_object_id = cp.object_id
INNER JOIN sys.columns cr ON fkc.referenced_column_id = cr.column_id AND fkc.referenced_object_id = cr.object_id
WHERE tr.name = 'Sessions' AND SCHEMA_NAME(tr.schema_id) = 'canvas' AND cr.name = 'SessionId';

-- Step 4: Disable foreign key constraints temporarily
PRINT 'Disabling foreign key constraints...';
DECLARE @sql NVARCHAR(MAX) = '';
SELECT @sql = @sql + 'ALTER TABLE ' + SCHEMA_NAME(fk.schema_id) + '.' + OBJECT_NAME(fk.parent_object_id) + ' NOCHECK CONSTRAINT ' + fk.name + ';' + CHAR(13)
FROM sys.foreign_keys fk
INNER JOIN sys.tables tr ON fk.referenced_object_id = tr.object_id
WHERE tr.name = 'Sessions' AND SCHEMA_NAME(tr.schema_id) = 'canvas';

IF @sql != ''
BEGIN
    PRINT 'Executing FK disable commands:';
    PRINT @sql;
    EXEC sp_executesql @sql;
END
ELSE
    PRINT 'No foreign keys found to disable.';

-- Step 5: Drop the current primary key constraint
PRINT 'Dropping current primary key constraint...';
ALTER TABLE canvas.Sessions DROP CONSTRAINT PK_Sessions;

-- Step 6: Create temporary column to hold the new SessionId values
PRINT 'Adding temporary column for new SessionId...';
ALTER TABLE canvas.Sessions ADD TempSessionId bigint NOT NULL DEFAULT 0;

-- Step 7: Copy KSessionsId values to the temporary column
PRINT 'Copying KSessionsId values to temporary column...';
UPDATE canvas.Sessions 
SET TempSessionId = ISNULL(KSessionsId, 0)
WHERE KSessionsId IS NOT NULL;

-- Verify the copy
PRINT 'Verifying data copy...';
SELECT COUNT(*) as Updated_Rows FROM canvas.Sessions WHERE TempSessionId > 0;

-- Step 8: Drop the columns we don't want
PRINT 'Dropping unwanted columns: SessionId, GroupId, HostGuid...';
ALTER TABLE canvas.Sessions DROP COLUMN SessionId;
ALTER TABLE canvas.Sessions DROP COLUMN KSessionsId;
ALTER TABLE canvas.Sessions DROP COLUMN GroupId;
ALTER TABLE canvas.Sessions DROP COLUMN HostGuid;

-- Step 9: Rename TempSessionId to SessionId
PRINT 'Renaming TempSessionId to SessionId...';
EXEC sp_rename 'canvas.Sessions.TempSessionId', 'SessionId', 'COLUMN';

-- Step 10: Add primary key constraint on new SessionId
PRINT 'Adding primary key constraint on new SessionId...';
ALTER TABLE canvas.Sessions ADD CONSTRAINT PK_Sessions PRIMARY KEY (SessionId);

-- Step 11: Update foreign key constraints to reference new SessionId structure
PRINT 'Updating foreign key constraints...';
-- Note: This will need manual adjustment based on existing FK relationships
-- Foreign keys will need to be recreated to match the new SessionId values

-- Step 12: Verify final structure
PRINT 'Final canvas.Sessions structure:';
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE, 
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'canvas' AND TABLE_NAME = 'Sessions' 
ORDER BY ORDINAL_POSITION;

-- Step 13: Show final data
PRINT 'Final data in canvas.Sessions:';
SELECT SessionId, Title, Status, CreatedAt FROM canvas.Sessions;

PRINT 'Schema update completed successfully!';
PRINT 'IMPORTANT: Update your application code to remove references to GroupId and HostGuid!';

GO