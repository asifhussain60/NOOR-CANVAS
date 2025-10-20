-- ============================================================================
-- Initialize Production Migration History Table
-- ============================================================================
-- Purpose: Create canvas.MigrationHistory table to track all production migrations
-- Database: KSESSIONS (Production)
-- Schema: canvas
-- Created: 2025-10-20
-- ============================================================================

-- SAFETY CHECKS
-- ============================================================================
IF DB_NAME() != 'KSESSIONS'
BEGIN
    RAISERROR('ERROR: This script must run against KSESSIONS database only!', 16, 1)
    RETURN
END
GO

-- CREATE MIGRATION HISTORY TABLE
-- ============================================================================
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES 
               WHERE TABLE_SCHEMA = 'canvas' 
               AND TABLE_NAME = 'MigrationHistory')
BEGIN
    PRINT 'Creating canvas.MigrationHistory table...'
    
    CREATE TABLE [canvas].[MigrationHistory] (
        [MigrationId] NVARCHAR(50) NOT NULL PRIMARY KEY,
        [Description] NVARCHAR(500) NOT NULL,
        [AppliedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [AppliedBy] NVARCHAR(128) NOT NULL DEFAULT SYSTEM_USER,
        [RolledBackAt] DATETIME2 NULL,
        [RolledBackBy] NVARCHAR(128) NULL
    );
    
    PRINT '  ✅ Table created successfully'
    
    -- Create index for performance
    CREATE INDEX IX_MigrationHistory_AppliedAt 
    ON [canvas].[MigrationHistory] ([AppliedAt] DESC);
    
    PRINT '  ✅ Index created on AppliedAt column'
    
    PRINT ''
    PRINT 'Migration history tracking initialized successfully!'
    PRINT ''
    PRINT 'Table: canvas.MigrationHistory'
    PRINT 'Columns:'
    PRINT '  - MigrationId (PK): Unique identifier (YYYYMMDD-HHMMSS format)'
    PRINT '  - Description: Migration description'
    PRINT '  - AppliedAt: When migration was applied'
    PRINT '  - AppliedBy: Who applied the migration'
    PRINT '  - RolledBackAt: When migration was rolled back (if applicable)'
    PRINT '  - RolledBackBy: Who rolled back the migration (if applicable)'
    PRINT ''
END
ELSE
BEGIN
    PRINT 'canvas.MigrationHistory table already exists - skipping creation'
    
    -- Display existing migrations
    DECLARE @migrationCount INT
    SELECT @migrationCount = COUNT(*) FROM [canvas].[MigrationHistory]
    
    PRINT ''
    PRINT 'Existing migrations: ' + CAST(@migrationCount AS VARCHAR(10))
    
    IF @migrationCount > 0
    BEGIN
        PRINT ''
        PRINT 'Recent migrations (last 10):'
        
        SELECT TOP 10
            MigrationId,
            Description,
            AppliedAt,
            AppliedBy,
            CASE 
                WHEN RolledBackAt IS NOT NULL THEN 'ROLLED BACK'
                ELSE 'ACTIVE'
            END AS Status
        FROM [canvas].[MigrationHistory]
        ORDER BY AppliedAt DESC
    END
END
GO
