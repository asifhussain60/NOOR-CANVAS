-- ============================================================================
-- Database Schema Synchronization Script
-- Purpose: Ensure KSESSIONS (Production) matches KSESSIONS_DEV (Development)
-- Date: 2025-10-12
-- ============================================================================

USE KSESSIONS;
GO

PRINT 'Starting schema synchronization from KSESSIONS_DEV to KSESSIONS...';
PRINT '';

-- ============================================================================
-- ISSUE #1: AssetLookup.CreatedAt Column Missing
-- ============================================================================
PRINT 'Checking AssetLookup.CreatedAt column...';

IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns c
    INNER JOIN sys.tables t ON c.object_id = t.object_id
    INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
    WHERE s.name = 'canvas' 
    AND t.name = 'AssetLookup' 
    AND c.name = 'CreatedAt'
)
BEGIN
    PRINT '  ❌ Missing: Adding CreatedAt column to canvas.AssetLookup...';
    ALTER TABLE [canvas].[AssetLookup] 
    ADD [CreatedAt] DATETIME2 NULL;
    PRINT '  ✅ Added: CreatedAt column';
END
ELSE
BEGIN
    PRINT '  ✅ Exists: CreatedAt column already present';
END

PRINT '';

-- ============================================================================
-- Verification: Compare canvas schema between databases
-- ============================================================================
PRINT 'Verifying canvas schema consistency...';
PRINT '';

DECLARE @MissingInProd INT;
DECLARE @MissingInDev INT;
DECLARE @MismatchedTypes INT;

-- Count missing columns in PROD
SELECT @MissingInProd = COUNT(*)
FROM KSESSIONS_DEV.sys.tables dev_t
INNER JOIN KSESSIONS_DEV.sys.columns dev_c ON dev_t.object_id = dev_c.object_id
INNER JOIN KSESSIONS_DEV.sys.schemas dev_s ON dev_t.schema_id = dev_s.schema_id
WHERE dev_s.name = 'canvas'
AND NOT EXISTS (
    SELECT 1 
    FROM KSESSIONS.sys.tables prod_t
    INNER JOIN KSESSIONS.sys.columns prod_c ON prod_t.object_id = prod_c.object_id
    INNER JOIN KSESSIONS.sys.schemas prod_s ON prod_t.schema_id = prod_s.schema_id
    WHERE prod_s.name = 'canvas'
    AND prod_t.name = dev_t.name
    AND prod_c.name = dev_c.name
);

-- Count missing columns in DEV
SELECT @MissingInDev = COUNT(*)
FROM KSESSIONS.sys.tables prod_t
INNER JOIN KSESSIONS.sys.columns prod_c ON prod_t.object_id = prod_c.object_id
INNER JOIN KSESSIONS.sys.schemas prod_s ON prod_t.schema_id = prod_s.schema_id
WHERE prod_s.name = 'canvas'
AND NOT EXISTS (
    SELECT 1 
    FROM KSESSIONS_DEV.sys.tables dev_t
    INNER JOIN KSESSIONS_DEV.sys.columns dev_c ON dev_t.object_id = dev_c.object_id
    INNER JOIN KSESSIONS_DEV.sys.schemas dev_s ON dev_t.schema_id = dev_s.schema_id
    WHERE dev_s.name = 'canvas'
    AND dev_t.name = prod_t.name
    AND dev_c.name = dev_c.name
);

PRINT '📊 Schema Verification Results:';
PRINT '  - Columns missing in PROD: ' + CAST(ISNULL(@MissingInProd, 0) AS VARCHAR);
PRINT '  - Columns missing in DEV: ' + CAST(ISNULL(@MissingInDev, 0) AS VARCHAR);
PRINT '';

IF @MissingInProd = 0 AND @MissingInDev = 0
BEGIN
    PRINT '✅ SUCCESS: Canvas schemas are synchronized!';
END
ELSE
BEGIN
    PRINT '⚠️ WARNING: Schema differences detected!';
    PRINT '  Run the comparison query to see details.';
END

PRINT '';
PRINT 'Schema synchronization complete.';
PRINT '============================================================================';

GO
