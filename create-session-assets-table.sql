-- =============================================
-- NOOR Canvas SessionAssets Lookup Table Migration
-- Generated: September 20, 2025
-- Purpose: Simple lookup table for asset detection and share button injection
-- Context: Replaces client-side regex parsing with server-side asset catalog
-- =============================================

USE KSESSIONS_DEV;
GO

PRINT '=====================================================';
PRINT '🎯 Creating SessionAssets Lookup Table...';
PRINT 'Database: KSESSIONS_DEV';
PRINT 'Date: ' + CONVERT(VARCHAR, GETDATE(), 120);
PRINT '=====================================================';

-- =============================================
-- Create SessionAssets Lookup Table
-- =============================================

-- Check if table exists first
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SessionAssets' AND schema_id = SCHEMA_ID('canvas'))
BEGIN
    CREATE TABLE [canvas].[SessionAssets] (
        -- Primary Key
        [AssetId] BIGINT IDENTITY(1,1) PRIMARY KEY,
        
        -- Foreign Key to Sessions
        [SessionId] BIGINT NOT NULL,
        
        -- Asset Classification
        [AssetType] NVARCHAR(50) NOT NULL,        -- 'etymology-card', 'ahadees-container', 'ayah-card', 'image-asset', 'table-asset'
        [AssetSelector] NVARCHAR(200) NOT NULL,   -- Unique identifier for targeting (e.g., 'ayah-2-255', 'hadees-bukhari-123')
        
        -- Asset Positioning & Metadata
        [Position] INT NULL,                      -- Order in transcript for reliable injection
        [CssPattern] NVARCHAR(500) NULL,          -- Regex pattern used for detection (for re-targeting)
        
        -- Asset Lifecycle
        [SharedAt] DATETIME2 NULL,                -- NULL = detected but not shared yet
        [IsActive] BIT NOT NULL DEFAULT 1,        -- Soft delete flag
        [DetectedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        
        -- Basic auditing
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [CreatedBy] NVARCHAR(100) NULL,
        
        -- Foreign Key Constraint
        CONSTRAINT [FK_SessionAssets_Sessions] 
            FOREIGN KEY ([SessionId]) REFERENCES [canvas].[Sessions]([SessionId]) 
            ON DELETE CASCADE
    );
    
    PRINT '✓ SessionAssets table created successfully';
END
ELSE
BEGIN
    PRINT '⚠️ SessionAssets table already exists - skipping creation';
END

-- =============================================
-- Create Performance Indexes
-- =============================================

-- Primary lookup index (most common query)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SessionAssets_SessionId' AND object_id = OBJECT_ID('[canvas].[SessionAssets]'))
BEGIN
    CREATE INDEX [IX_SessionAssets_SessionId] ON [canvas].[SessionAssets]([SessionId]);
    PRINT '✓ Created index: IX_SessionAssets_SessionId';
END

-- Type-based filtering index
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SessionAssets_Type_Session' AND object_id = OBJECT_ID('[canvas].[SessionAssets]'))
BEGIN
    CREATE INDEX [IX_SessionAssets_Type_Session] ON [canvas].[SessionAssets]([SessionId], [AssetType]);
    PRINT '✓ Created index: IX_SessionAssets_Type_Session';
END

-- Shared assets lookup index
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SessionAssets_Shared' AND object_id = OBJECT_ID('[canvas].[SessionAssets]'))
BEGIN
    CREATE INDEX [IX_SessionAssets_Shared] ON [canvas].[SessionAssets]([IsActive], [SharedAt]) WHERE [SharedAt] IS NOT NULL;
    PRINT '✓ Created index: IX_SessionAssets_Shared';
END

-- Position-based ordering index
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SessionAssets_Position' AND object_id = OBJECT_ID('[canvas].[SessionAssets]'))
BEGIN
    CREATE INDEX [IX_SessionAssets_Position] ON [canvas].[SessionAssets]([SessionId], [Position]) WHERE [Position] IS NOT NULL;
    PRINT '✓ Created index: IX_SessionAssets_Position';
END

-- =============================================
-- Sample Data for Session 212 (Testing)
-- =============================================

-- Only insert if table is empty (avoid duplicates)
IF NOT EXISTS (SELECT 1 FROM [canvas].[SessionAssets] WHERE [SessionId] = 212)
BEGIN
    PRINT '';
    PRINT '📝 Inserting sample assets for Session 212 (testing)...';
    
    INSERT INTO [canvas].[SessionAssets] ([SessionId], [AssetType], [AssetSelector], [Position], [CssPattern]) VALUES 
    -- Etymology assets
    (212, 'etymology-derivative-card', 'etymology-rasul-rsl', 1, '<div[^>]*class="[^"]*etymology-derivative-card[^"]*"[^>]*>'),
    
    -- Ahadees assets  
    (212, 'ahadees-container', 'hadees-bukhari-129', 2, '<div[^>]*class="[^"]*(?:inserted-hadees|ks-ahadees-container|ahadees-content)[^"]*"[^>]*>'),
    (212, 'ahadees-container', 'hadees-unknown-130', 3, '<div[^>]*class="[^"]*(?:inserted-hadees|ks-ahadees-container|ahadees-content)[^"]*"[^>]*>'),
    
    -- Ayah card assets
    (212, 'ayah-card', 'ayah-14-34', 4, '<div[^>]*class="[^"]*ayah-card[^"]*"[^>]*>'),
    (212, 'ayah-card', 'ayah-30-7', 5, '<div[^>]*class="[^"]*ayah-card[^"]*"[^>]*>'),
    (212, 'ayah-card', 'ayah-3-83', 6, '<div[^>]*class="[^"]*ayah-card[^"]*"[^>]*>'),
    (212, 'ayah-card', 'ayah-57-11', 7, '<div[^>]*class="[^"]*ayah-card[^"]*"[^>]*>'),
    (212, 'ayah-card', 'ayah-82-6', 8, '<div[^>]*class="[^"]*ayah-card[^"]*"[^>]*>'),
    (212, 'ayah-card', 'ayah-6-160', 9, '<div[^>]*class="[^"]*ayah-card[^"]*"[^>]*>');
    
    PRINT '✓ Inserted 9 sample assets for Session 212';
END
ELSE
BEGIN
    PRINT '⚠️ Sample data already exists for Session 212 - skipping insertion';
END

-- =============================================
-- Verification
-- =============================================
PRINT '';
PRINT '🔍 Verification Results:';
PRINT '========================';

DECLARE @TableExists BIT = CASE WHEN EXISTS (SELECT * FROM sys.tables WHERE name = 'SessionAssets' AND schema_id = SCHEMA_ID('canvas')) THEN 1 ELSE 0 END;
DECLARE @IndexCount INT = (SELECT COUNT(*) FROM sys.indexes WHERE object_id = OBJECT_ID('[canvas].[SessionAssets]') AND name LIKE 'IX_%');
DECLARE @SampleCount INT = ISNULL((SELECT COUNT(*) FROM [canvas].[SessionAssets] WHERE [SessionId] = 212), 0);

PRINT 'Table Created: ' + CASE WHEN @TableExists = 1 THEN '✓ YES' ELSE '✗ NO' END;
PRINT 'Indexes Created: ' + CAST(@IndexCount AS VARCHAR) + ' indexes';
PRINT 'Sample Assets: ' + CAST(@SampleCount AS VARCHAR) + ' assets for Session 212';

IF @TableExists = 1 AND @IndexCount >= 4 AND @SampleCount > 0
BEGIN
    PRINT '';
    PRINT '🎉 SessionAssets table setup completed successfully!';
    PRINT '📊 Ready for asset detection and share button injection.';
END
ELSE
BEGIN
    PRINT '';
    PRINT '❌ Setup incomplete. Please review errors above.';
END

PRINT '=====================================================';
GO