-- =============================================
-- SessionAssets → SessionAssetsLookup Migration
-- Date: September 20, 2025
-- Purpose: Replace individual asset tracking with class-based flexible matching
-- =============================================

USE KSESSIONS_DEV;
GO

-- Step 1: Backup existing SessionAssets data
PRINT 'Step 1: Creating backup of existing SessionAssets table...';
IF OBJECT_ID('canvas.SessionAssets_Backup_20250920', 'U') IS NOT NULL
    DROP TABLE canvas.SessionAssets_Backup_20250920;

SELECT * 
INTO canvas.SessionAssets_Backup_20250920 
FROM canvas.SessionAssets;

PRINT 'Backup completed. Rows backed up: ' + CAST(@@ROWCOUNT AS VARCHAR(10));

-- Step 2: Drop existing SessionAssets table
PRINT 'Step 2: Dropping existing SessionAssets table...';
IF OBJECT_ID('canvas.SessionAssets', 'U') IS NOT NULL
    DROP TABLE canvas.SessionAssets;
PRINT 'SessionAssets table dropped successfully.';

-- Step 3: Create new SessionAssetsLookup table
PRINT 'Step 3: Creating SessionAssetsLookup table...';
CREATE TABLE canvas.SessionAssetsLookup (
    AssetId bigint IDENTITY(1,1) PRIMARY KEY,
    SessionId bigint NOT NULL,
    
    -- Primary asset identification
    AssetClass nvarchar(100) NOT NULL,           -- Primary CSS class (imgResponsive, ayah-card)
    AlternateClasses nvarchar(500) NULL,         -- Secondary classes found (fr-fic, fr-dib, etc.)
    
    -- Instance and quality tracking
    InstanceCount int NOT NULL DEFAULT 1,        -- Number of instances found
    ClassScore int NOT NULL DEFAULT 1,           -- Match confidence (1-5)
    
    -- Positioning and metadata
    Position int NULL,                           -- First occurrence position in transcript
    CssPattern nvarchar(1000) NULL,             -- Pattern used for detection
    
    -- Sharing tracking
    SharedAt datetime2(7) NULL,
    SharedCount int NOT NULL DEFAULT 0,          -- How many times this class was shared
    
    -- Status and audit
    IsActive bit NOT NULL DEFAULT 1,
    DetectedAt datetime2(7) NOT NULL DEFAULT GETDATE(),
    CreatedAt datetime2(7) NOT NULL DEFAULT GETDATE(),
    CreatedBy nvarchar(100) NULL DEFAULT 'AssetDetectionService',
    ModifiedAt datetime2(7) NULL,
    ModifiedBy nvarchar(100) NULL,
    
    -- Constraints
    CONSTRAINT UQ_SessionAssetsLookup_SessionClass 
        UNIQUE (SessionId, AssetClass),
        
    CONSTRAINT CK_SessionAssetsLookup_InstanceCount 
        CHECK (InstanceCount > 0),
        
    CONSTRAINT CK_SessionAssetsLookup_ClassScore 
        CHECK (ClassScore BETWEEN 1 AND 5)
);

-- Step 4: Create performance indexes
PRINT 'Step 4: Creating indexes...';
CREATE INDEX IX_SessionAssetsLookup_SessionId 
    ON canvas.SessionAssetsLookup (SessionId, IsActive);

CREATE INDEX IX_SessionAssetsLookup_AssetClass 
    ON canvas.SessionAssetsLookup (AssetClass, ClassScore DESC);

CREATE INDEX IX_SessionAssetsLookup_DetectedAt 
    ON canvas.SessionAssetsLookup (DetectedAt DESC);

-- Step 5: Migrate existing data with consolidation
PRINT 'Step 5: Migrating and consolidating existing asset data...';

-- Consolidate duplicate asset types from backup
INSERT INTO canvas.SessionAssetsLookup (
    SessionId, AssetClass, AlternateClasses, InstanceCount, ClassScore, 
    Position, SharedAt, SharedCount, IsActive, DetectedAt, CreatedAt, CreatedBy
)
SELECT 
    SessionId,
    -- Map old AssetType to new AssetClass
    CASE 
        WHEN AssetType = 'etymology-derivative-card' THEN 'etymology-card'
        WHEN AssetType = 'ahadees-container' THEN 'inserted-hadees' 
        ELSE AssetType 
    END AS AssetClass,
    
    -- Store original AssetType in AlternateClasses if different
    CASE 
        WHEN AssetType IN ('etymology-derivative-card', 'ahadees-container') THEN AssetType
        ELSE NULL 
    END AS AlternateClasses,
    
    COUNT(*) AS InstanceCount,                    -- Consolidate duplicates
    
    -- Calculate quality score based on asset selector complexity
    CASE 
        WHEN AVG(LEN(ISNULL(AssetSelector, ''))) > 20 THEN 5  -- Complex selectors = high confidence
        WHEN AVG(LEN(ISNULL(AssetSelector, ''))) > 10 THEN 4  
        WHEN AVG(LEN(ISNULL(AssetSelector, ''))) > 5 THEN 3   
        ELSE 2 
    END AS ClassScore,
    
    MIN(Position) AS Position,                    -- First occurrence position
    MAX(SharedAt) AS SharedAt,                    -- Last share time
    COUNT(CASE WHEN SharedAt IS NOT NULL THEN 1 END) AS SharedCount, -- Count shared instances
    
    MAX(CAST(IsActive AS int)) AS IsActive,       -- Active if any instance is active
    MIN(DetectedAt) AS DetectedAt,                -- First detection time
    MIN(CreatedAt) AS CreatedAt,                  -- First creation time
    'MigrationService' AS CreatedBy
FROM canvas.SessionAssets_Backup_20250920
WHERE SessionId IS NOT NULL
GROUP BY 
    SessionId,
    CASE 
        WHEN AssetType = 'etymology-derivative-card' THEN 'etymology-card'
        WHEN AssetType = 'ahadees-container' THEN 'inserted-hadees' 
        ELSE AssetType 
    END;

PRINT 'Data migration completed. Consolidated rows: ' + CAST(@@ROWCOUNT AS VARCHAR(10));

-- Step 6: Add missing asset types for Session 212 (from analysis)
PRINT 'Step 6: Adding missing asset types for Session 212...';

-- Add missing etymology-card (standalone, not derivative)
IF NOT EXISTS (SELECT 1 FROM canvas.SessionAssetsLookup WHERE SessionId = 212 AND AssetClass = 'etymology-card')
BEGIN
    INSERT INTO canvas.SessionAssetsLookup (SessionId, AssetClass, InstanceCount, ClassScore, Position, CreatedBy)
    VALUES (212, 'etymology-card', 1, 3, 2, 'Migration-Enhancement');
    PRINT 'Added missing etymology-card for Session 212';
END

-- Add missing esotericBlock
IF NOT EXISTS (SELECT 1 FROM canvas.SessionAssetsLookup WHERE SessionId = 212 AND AssetClass = 'esotericBlock')
BEGIN
    INSERT INTO canvas.SessionAssetsLookup (SessionId, AssetClass, InstanceCount, ClassScore, Position, CreatedBy)
    VALUES (212, 'esotericBlock', 1, 4, 5, 'Migration-Enhancement');
    PRINT 'Added missing esotericBlock for Session 212';
END

-- Add missing verse-container
IF NOT EXISTS (SELECT 1 FROM canvas.SessionAssetsLookup WHERE SessionId = 212 AND AssetClass = 'verse-container')
BEGIN
    INSERT INTO canvas.SessionAssetsLookup (SessionId, AssetClass, InstanceCount, ClassScore, Position, CreatedBy)
    VALUES (212, 'verse-container', 1, 3, 6, 'Migration-Enhancement');
    PRINT 'Added missing verse-container for Session 212';
END

-- Add missing table asset
IF NOT EXISTS (SELECT 1 FROM canvas.SessionAssetsLookup WHERE SessionId = 212 AND AssetClass = 'table')
BEGIN
    INSERT INTO canvas.SessionAssetsLookup (SessionId, AssetClass, InstanceCount, ClassScore, Position, CreatedBy)
    VALUES (212, 'table', 1, 4, 7, 'Migration-Enhancement');
    PRINT 'Added missing table for Session 212';
END

-- Add missing imgResponsive (with alternate classes)
IF NOT EXISTS (SELECT 1 FROM canvas.SessionAssetsLookup WHERE SessionId = 212 AND AssetClass = 'imgResponsive')
BEGIN
    INSERT INTO canvas.SessionAssetsLookup (SessionId, AssetClass, AlternateClasses, InstanceCount, ClassScore, Position, CreatedBy)
    VALUES (212, 'imgResponsive', 'fr-fic,fr-dib,fr-bordered', 3, 5, 8, 'Migration-Enhancement');
    PRINT 'Added missing imgResponsive for Session 212';
END

-- Step 7: Validation and summary
PRINT 'Step 7: Validation and summary...';

SELECT 
    'MIGRATION SUMMARY' AS [Report Section],
    '' as [Details]
UNION ALL
SELECT 
    'Original SessionAssets rows', 
    CAST(COUNT(*) AS VARCHAR(10))
FROM canvas.SessionAssets_Backup_20250920
UNION ALL
SELECT 
    'New SessionAssetsLookup rows', 
    CAST(COUNT(*) AS VARCHAR(10))
FROM canvas.SessionAssetsLookup
UNION ALL
SELECT 
    'Session 212 asset classes', 
    CAST(COUNT(*) AS VARCHAR(10))
FROM canvas.SessionAssetsLookup 
WHERE SessionId = 212
UNION ALL
SELECT 
    'Total asset instances tracked', 
    CAST(SUM(InstanceCount) AS VARCHAR(10))
FROM canvas.SessionAssetsLookup;

-- Show Session 212 details
SELECT 
    'SESSION 212 ASSETS' AS [Asset Summary],
    AssetClass,
    InstanceCount,
    ClassScore,
    AlternateClasses,
    CreatedBy
FROM canvas.SessionAssetsLookup 
WHERE SessionId = 212 
ORDER BY Position;

PRINT 'Migration completed successfully!';
PRINT 'Next steps:';
PRINT '1. Update Entity Framework model to use SessionAssetsLookup';
PRINT '2. Update AssetDetectionService for flexible class matching';
PRINT '3. Update HostController APIs';
PRINT '4. Update HostControlPanel frontend';