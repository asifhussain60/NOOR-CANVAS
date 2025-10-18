-- Migrate canvas.Annotations.AnnotationId from INT to BIGINT
-- Fixes InvalidCastException: Cannot cast System.Int32 to System.Int64
-- Schema: canvas (READ/WRITE allowed per database access rules)

USE KSESSIONS_DEV
GO

PRINT 'Starting migration: INT to BIGINT for canvas.Annotations.AnnotationId'
GO

-- Step 1: Check if table exists
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Annotations' AND schema_id = SCHEMA_ID('canvas'))
BEGIN
    PRINT 'Table canvas.Annotations found. Proceeding with migration...'
    
    -- Step 2: Check current data type
    DECLARE @CurrentType NVARCHAR(50)
    SELECT @CurrentType = TYPE_NAME(system_type_id)
    FROM sys.columns
    WHERE object_id = OBJECT_ID('canvas.Annotations')
    AND name = 'AnnotationId'
    
    PRINT 'Current AnnotationId type: ' + @CurrentType
    
    IF @CurrentType = 'int'
    BEGIN
        PRINT 'Altering AnnotationId from INT to BIGINT...'
        
        -- Step 3a: Find and drop the primary key constraint
        DECLARE @PkConstraint NVARCHAR(200)
        SELECT @PkConstraint = name
        FROM sys.key_constraints
        WHERE type = 'PK'
        AND parent_object_id = OBJECT_ID('canvas.Annotations')
        
        IF @PkConstraint IS NOT NULL
        BEGIN
            DECLARE @DropPkSql NVARCHAR(500) = 'ALTER TABLE canvas.Annotations DROP CONSTRAINT ' + QUOTENAME(@PkConstraint)
            EXEC sp_executesql @DropPkSql
            PRINT '✓ Dropped primary key constraint: ' + @PkConstraint
        END
        
        -- Step 3b: Alter the column type
        -- This is safe because BIGINT (8 bytes) can hold all INT (4 bytes) values
        ALTER TABLE canvas.Annotations
        ALTER COLUMN AnnotationId BIGINT NOT NULL
        
        PRINT '✓ Successfully altered AnnotationId to BIGINT'
        
        -- Step 3c: Recreate the primary key constraint
        ALTER TABLE canvas.Annotations
        ADD CONSTRAINT PK_Annotations_AnnotationId PRIMARY KEY (AnnotationId)
        
        PRINT '✓ Recreated primary key constraint'
        
        -- Step 4: Verify the change
        DECLARE @NewType NVARCHAR(50)
        SELECT @NewType = TYPE_NAME(system_type_id)
        FROM sys.columns
        WHERE object_id = OBJECT_ID('canvas.Annotations')
        AND name = 'AnnotationId'
        
        PRINT 'Verified new type: ' + @NewType
        
        -- Step 5: Display current row count
        DECLARE @RowCount INT
        SELECT @RowCount = COUNT(*) FROM canvas.Annotations
        PRINT 'Existing rows preserved: ' + CAST(@RowCount AS NVARCHAR(10))
    END
    ELSE IF @CurrentType = 'bigint'
    BEGIN
        PRINT 'AnnotationId is already BIGINT. No migration needed.'
    END
    ELSE
    BEGIN
        PRINT 'WARNING: Unexpected type ' + @CurrentType + '. Manual review required.'
    END
END
ELSE
BEGIN
    PRINT 'ERROR: Table canvas.Annotations does not exist. Run create-annotations-table.sql first.'
END
GO

PRINT 'Migration completed successfully.'
GO
