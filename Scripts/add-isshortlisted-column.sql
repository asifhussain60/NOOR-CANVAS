-- Migration: Add IsShortListed column to KSESSIONS.Countries table
-- Date: 2025-10-12
-- Purpose: Add missing IsShortListed column that should have been migrated from KSESSIONS_DEV

USE KSESSIONS;
GO

-- Step 1: Add the column if it doesn't exist
IF NOT EXISTS (
    SELECT 1 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'Countries' 
    AND COLUMN_NAME = 'IsShortListed'
)
BEGIN
    PRINT 'Adding IsShortListed column to Countries table...';
    
    -- Step 2: Add the column with default value of 0 (not shortlisted)
    ALTER TABLE Countries
    ADD IsShortListed BIT NOT NULL DEFAULT 0;
    
    PRINT 'IsShortListed column added successfully.';
END
ELSE
BEGIN
    PRINT 'IsShortListed column already exists.';
END
GO

-- Step 3: Update shortlisted countries based on KSESSIONS_DEV values
PRINT 'Updating shortlisted countries...';

UPDATE Countries SET IsShortListed = 1 WHERE CountryID = 13;  -- Australia
UPDATE Countries SET IsShortListed = 1 WHERE CountryID = 17;  -- Bahrain
UPDATE Countries SET IsShortListed = 1 WHERE CountryID = 99;  -- India
UPDATE Countries SET IsShortListed = 1 WHERE CountryID = 161; -- Oman
UPDATE Countries SET IsShortListed = 1 WHERE CountryID = 162; -- Pakistan
UPDATE Countries SET IsShortListed = 1 WHERE CountryID = 224; -- United Arab Emirates
UPDATE Countries SET IsShortListed = 1 WHERE CountryID = 225; -- United Kingdom
UPDATE Countries SET IsShortListed = 1 WHERE CountryID = 226; -- United States

PRINT 'Shortlisted countries updated successfully.';
GO

-- Step 4: Verify the changes
PRINT 'Current shortlisted countries:';
SELECT 
    CountryID,
    CountryName,
    IsShortListed
FROM Countries
WHERE IsShortListed = 1
ORDER BY CountryName;

PRINT 'Migration completed successfully.';
GO
