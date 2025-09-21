-- SessionAssets Schema Migration: Class-Based Asset Tracking
-- Migration Script for Issue: Duplicate asset entries, use class-based tracking
-- Date: 2025-09-20

USE KSESSIONS_DEV;
GO

-- Step 1: Create backup table
IF OBJECT_ID('canvas.SessionAssets_Backup_20250920', 'U') IS NOT NULL
    DROP TABLE canvas.SessionAssets_Backup_20250920;

SELECT * INTO canvas.SessionAssets_Backup_20250920 FROM canvas.SessionAssets;
PRINT 'Backup created: canvas.SessionAssets_Backup_20250920';

-- Step 2: Drop existing constraints and indexes
IF EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID('canvas.SessionAssets') AND name = 'IX_SessionAssets_SessionId_AssetType')
    DROP INDEX IX_SessionAssets_SessionId_AssetType ON canvas.SessionAssets;

-- Step 3: Add new columns
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'canvas' AND TABLE_NAME = 'SessionAssets' AND COLUMN_NAME = 'AssetClass')
    ALTER TABLE canvas.SessionAssets ADD AssetClass nvarchar(100) NULL;

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'canvas' AND TABLE_NAME = 'SessionAssets' AND COLUMN_NAME = 'InstanceCount')
    ALTER TABLE canvas.SessionAssets ADD InstanceCount int NULL DEFAULT 1;

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'canvas' AND TABLE_NAME = 'SessionAssets' AND COLUMN_NAME = 'ShareId')
    ALTER TABLE canvas.SessionAssets ADD ShareId nvarchar(50) NULL;

PRINT 'New columns added: AssetClass, InstanceCount, ShareId';

-- Step 4: Migrate existing data to new schema
UPDATE canvas.SessionAssets 
SET 
    AssetClass = CASE 
        WHEN AssetType = 'etymology-derivative-card' THEN 'etymology-derivative-card'
        WHEN AssetType = 'ahadees-container' THEN 'inserted-hadees'
        WHEN AssetType = 'ayah-card' THEN 'ayah-card'
        ELSE AssetType
    END,
    InstanceCount = 1,
    ShareId = 'share-' + CAST(AssetId AS nvarchar(10))
WHERE AssetClass IS NULL;

PRINT 'Data migration completed';

-- Step 5: Remove duplicate ayah-card entries (keep first occurrence, update instance count)
DECLARE @SessionId bigint = 212;

-- Count ayah-card instances for Session 212
DECLARE @AyahCount int = (SELECT COUNT(*) FROM canvas.SessionAssets WHERE SessionId = @SessionId AND AssetClass = 'ayah-card');

-- Keep the first ayah-card entry and update its instance count
UPDATE canvas.SessionAssets 
SET InstanceCount = @AyahCount
WHERE AssetId = (
    SELECT MIN(AssetId) 
    FROM canvas.SessionAssets 
    WHERE SessionId = @SessionId AND AssetClass = 'ayah-card'
);

-- Delete duplicate ayah-card entries
DECLARE @KeepAssetId bigint = (
    SELECT MIN(AssetId) 
    FROM canvas.SessionAssets 
    WHERE SessionId = @SessionId AND AssetClass = 'ayah-card'
);

DELETE FROM canvas.SessionAssets 
WHERE SessionId = @SessionId 
  AND AssetClass = 'ayah-card' 
  AND AssetId != @KeepAssetId;

PRINT 'Duplicate ayah-card entries consolidated';

-- Step 6: Add missing asset types for Session 212
INSERT INTO canvas.SessionAssets (SessionId, AssetType, AssetClass, AssetSelector, InstanceCount, ShareId, Position, IsActive, DetectedAt, CreatedAt)
SELECT 212, 'etymology-card', 'etymology-card', 'etymology-card-1', 1, 'share-etymology-card', 2, 1, GETDATE(), GETDATE()
WHERE NOT EXISTS (SELECT 1 FROM canvas.SessionAssets WHERE SessionId = 212 AND AssetClass = 'etymology-card');

INSERT INTO canvas.SessionAssets (SessionId, AssetType, AssetClass, AssetSelector, InstanceCount, ShareId, Position, IsActive, DetectedAt, CreatedAt)
SELECT 212, 'esotericBlock', 'esotericBlock', 'esoteric-block-1', 1, 'share-esoteric-block', 5, 1, GETDATE(), GETDATE()
WHERE NOT EXISTS (SELECT 1 FROM canvas.SessionAssets WHERE SessionId = 212 AND AssetClass = 'esotericBlock');

INSERT INTO canvas.SessionAssets (SessionId, AssetType, AssetClass, AssetSelector, InstanceCount, ShareId, Position, IsActive, DetectedAt, CreatedAt)
SELECT 212, 'verse-container', 'verse-container', 'verse-container-1', 1, 'share-verse-container', 6, 1, GETDATE(), GETDATE()
WHERE NOT EXISTS (SELECT 1 FROM canvas.SessionAssets WHERE SessionId = 212 AND AssetClass = 'verse-container');

INSERT INTO canvas.SessionAssets (SessionId, AssetType, AssetClass, AssetSelector, InstanceCount, ShareId, Position, IsActive, DetectedAt, CreatedAt)
SELECT 212, 'table', 'table', 'data-table-1', 1, 'share-table', 7, 1, GETDATE(), GETDATE()
WHERE NOT EXISTS (SELECT 1 FROM canvas.SessionAssets WHERE SessionId = 212 AND AssetClass = 'table');

INSERT INTO canvas.SessionAssets (SessionId, AssetType, AssetClass, AssetSelector, InstanceCount, ShareId, Position, IsActive, DetectedAt, CreatedAt)
SELECT 212, 'imgResponsive', 'imgResponsive', 'image-responsive', 3, 'share-images', 8, 1, GETDATE(), GETDATE()
WHERE NOT EXISTS (SELECT 1 FROM canvas.SessionAssets WHERE SessionId = 212 AND AssetClass = 'imgResponsive');

PRINT 'Missing asset types added for Session 212';

-- Step 7: Create new constraints and indexes
-- Make AssetClass required for new entries
ALTER TABLE canvas.SessionAssets ALTER COLUMN AssetClass nvarchar(100) NOT NULL;

-- Create unique constraint for SessionId + AssetClass combination
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID('canvas.SessionAssets') AND name = 'UX_SessionAssets_SessionId_AssetClass')
    ALTER TABLE canvas.SessionAssets ADD CONSTRAINT UX_SessionAssets_SessionId_AssetClass UNIQUE (SessionId, AssetClass);

-- Create index for ShareId lookups
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID('canvas.SessionAssets') AND name = 'IX_SessionAssets_ShareId')
    CREATE INDEX IX_SessionAssets_ShareId ON canvas.SessionAssets (ShareId);

PRINT 'New constraints and indexes created';

-- Step 8: Verify migration results
PRINT '--- MIGRATION RESULTS ---';
PRINT 'Session 212 Assets (Class-based):';
SELECT AssetClass, InstanceCount, ShareId, Position, CreatedAt
FROM canvas.SessionAssets 
WHERE SessionId = 212 
ORDER BY Position;

PRINT 'Total asset types for Session 212: ' + CAST((SELECT COUNT(*) FROM canvas.SessionAssets WHERE SessionId = 212) AS nvarchar(10));
PRINT 'Migration completed successfully!';