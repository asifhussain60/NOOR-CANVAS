-- Create canvas.Annotations table for annotation demo system
-- Schema: canvas (READ/WRITE allowed per database access rules)

IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'canvas')
BEGIN
    EXEC('CREATE SCHEMA canvas')
    PRINT 'Created schema: canvas'
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Annotations' AND schema_id = SCHEMA_ID('canvas'))
BEGIN
    CREATE TABLE canvas.Annotations
    (
        AnnotationId BIGINT IDENTITY(1,1) PRIMARY KEY,
        SessionId INT NOT NULL,
        CreatedBy NVARCHAR(100) NOT NULL,
        AnnotationData NVARCHAR(MAX) NOT NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        IsDeleted BIT NOT NULL DEFAULT 0,
        
        INDEX IX_Annotations_SessionId (SessionId),
        INDEX IX_Annotations_CreatedAt (CreatedAt)
    )
    
    PRINT 'Created table: canvas.Annotations'
END
ELSE
BEGIN
    PRINT 'Table canvas.Annotations already exists'
END
GO

-- Verify table structure
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'canvas' 
  AND TABLE_NAME = 'Annotations'
ORDER BY ORDINAL_POSITION
GO
