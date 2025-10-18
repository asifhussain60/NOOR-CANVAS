# TranscriptCanvas Schema Migration Analysis Report
**Generated:** October 18, 2025  
**Purpose:** Identify required database migrations for TranscriptCanvas feature  
**Databases Compared:** KSESSIONS_DEV (Development) vs KSESSIONS (Production)

---

## Executive Summary

### ✅ Status: **Migration Script Required**

The comparison between KSESSIONS_DEV and KSESSIONS databases reveals **1 missing table** that needs to be migrated to production to support the TranscriptCanvas functionality.

---

## Schema Comparison Results

### Tables in KSESSIONS_DEV (Canvas Schema)
1. ✅ `canvas.AssetLookup` - Present in both
2. ✅ `canvas.Sessions` - Present in both  
3. ✅ `canvas.Participants` - Present in both
4. ✅ `canvas.SessionData` - Present in both
5. ⚠️ **`canvas.Annotations`** - **MISSING IN PRODUCTION**

### Tables in KSESSIONS (Canvas Schema)
1. ✅ `canvas.AssetLookup`
2. ✅ `canvas.Sessions`
3. ✅ `canvas.Participants`
4. ✅ `canvas.SessionData`

---

## Missing Table Details

### 🔴 `canvas.Annotations` (CRITICAL)

**Status:** Missing in KSESSIONS (Production)  
**Impact:** TranscriptCanvas annotation feature will not work without this table  
**Created By:** `Scripts/create-annotations-table.sql`

#### Table Structure (from KSESSIONS_DEV):
```sql
CREATE TABLE [canvas].[Annotations] (
    [AnnotationId] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [SessionId] INT NOT NULL,
    [CreatedBy] NVARCHAR(100) NOT NULL,
    [AnnotationData] NVARCHAR(MAX) NOT NULL,
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
    [IsDeleted] BIT NOT NULL DEFAULT 0,
    
    INDEX IX_Annotations_SessionId ([SessionId]),
    INDEX IX_Annotations_CreatedAt ([CreatedAt])
)
```

#### Columns:
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `AnnotationId` | `BIGINT IDENTITY` | NOT NULL | Primary key |
| `SessionId` | `INT` | NOT NULL | Foreign key reference (no FK constraint) |
| `CreatedBy` | `NVARCHAR(100)` | NOT NULL | User identifier |
| `AnnotationData` | `NVARCHAR(MAX)` | NOT NULL | JSON annotation data |
| `CreatedAt` | `DATETIME2` | NOT NULL | Timestamp with default |
| `IsDeleted` | `BIT` | NOT NULL | Soft delete flag with default (0) |

#### Indexes:
- **IX_Annotations_SessionId** - Performance index on SessionId
- **IX_Annotations_CreatedAt** - Performance index on CreatedAt

---

## ContentBroadcasts Table Analysis

### 🟡 `canvas.ContentBroadcasts` (NOT YET IN DEV OR PROD)

**Status:** Table was **removed from Entity Framework model**  
**Location:** Previously defined in `Scripts/create-content-broadcasts-table.sql`  
**Current State:** 
- ❌ NOT in KSESSIONS_DEV database
- ❌ NOT in KSESSIONS database
- ❌ NOT in Entity Framework `CanvasDbContext.cs` (DbSet removed with comment: `[DEBUG-WORKITEM:canvascleanup:impl] ContentBroadcast DbSet removed ;CLEANUP_OK`)

**Conclusion:** This table was part of an experimental approach that was later refactored out. **No migration needed** for ContentBroadcasts.

---

## Existing Tables - Column Comparison

### ✅ All 4 Common Tables Match Perfectly

Based on the schema comparison CSV (`schema-comparison.csv`), all existing canvas tables have **identical column structures** between DEV and PROD:

- **canvas.AssetLookup** - 6 columns match
- **canvas.Sessions** - 13 columns match  
- **canvas.Participants** - 8 columns match
- **canvas.SessionData** - 7 columns match

**Total Columns Compared:** 77 rows in comparison file  
**Schema Differences:** 0 column mismatches

---

## Migration Script Requirements

### Required Actions:

1. **Create `canvas.Annotations` table in KSESSIONS (Production)**
   - Table structure defined in `Scripts/create-annotations-table.sql`
   - Includes 2 performance indexes
   - No foreign key constraints (by design)
   - Supports soft deletes with `IsDeleted` flag

### Migration Script Location:

**Existing Script:** `Scripts/create-annotations-table.sql`

This script is **idempotent** and safe to run multiple times:
- Checks if schema exists before creating
- Checks if table exists before creating
- Includes verification query at the end

---

## Migration Execution Plan

### Step 1: Review the Migration Script
```powershell
# Open the script for review
code D:\PROJECTS\NOOR` CANVAS\Scripts\create-annotations-table.sql
```

### Step 2: Execute on KSESSIONS (Production)
```sql
-- Connect to KSESSIONS database
USE [KSESSIONS]
GO

-- Execute the script
-- File: Scripts/create-annotations-table.sql
-- (Run the entire script from the file)
```

### Step 3: Verify Table Creation
```sql
-- Verify table exists
SELECT * 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'canvas' 
AND TABLE_NAME = 'Annotations'

-- Verify column structure
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'canvas' 
AND TABLE_NAME = 'Annotations'
ORDER BY ORDINAL_POSITION

-- Verify indexes
SELECT 
    i.name AS IndexName,
    c.name AS ColumnName
FROM sys.indexes i
INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
WHERE i.object_id = OBJECT_ID('canvas.Annotations')
```

---

## Risk Assessment

### ⬇️ Low Risk Migration

**Why This is Low Risk:**
1. ✅ New table only - no modifications to existing tables
2. ✅ No foreign key constraints to existing tables
3. ✅ Idempotent script - safe to run multiple times
4. ✅ No data to migrate - table will be empty
5. ✅ No impact on existing functionality
6. ✅ Can be rolled back easily with `DROP TABLE`

### Rollback Plan:
```sql
-- If needed, rollback is simple
USE [KSESSIONS]
GO

DROP TABLE IF EXISTS [canvas].[Annotations]
GO
```

---

## Post-Migration Validation

After migration, verify TranscriptCanvas functionality:

1. **Database Verification:**
   ```sql
   -- Check table exists
   SELECT OBJECT_ID('canvas.Annotations')
   
   -- Test insert
   INSERT INTO canvas.Annotations (SessionId, CreatedBy, AnnotationData, CreatedAt, IsDeleted)
   VALUES (999, 'test-user', '{"type":"highlight","color":"yellow"}', GETUTCDATE(), 0)
   
   -- Test select
   SELECT * FROM canvas.Annotations WHERE SessionId = 999
   
   -- Cleanup test
   DELETE FROM canvas.Annotations WHERE SessionId = 999
   ```

2. **Application Testing:**
   - Load TranscriptCanvas page
   - Create an annotation
   - Verify annotation persists in database
   - Test annotation retrieval

---

## Additional Schema Notes

### Column-Level Observations:

**KSESSIONS_DEV Only:**
- `canvas.AssetLookup.CreatedAt` column exists in DEV

This discrepancy was noted but is not blocking for TranscriptCanvas. The AssetLookup table is used for different functionality.

---

## Conclusion

### ✅ Migration Required: YES

**Action Item:** Execute `Scripts/create-annotations-table.sql` against KSESSIONS (Production) database to enable TranscriptCanvas annotation functionality.

**Estimated Time:** < 5 minutes  
**Downtime Required:** None (new table, no dependencies)  
**Testing Required:** Post-migration validation of annotation CRUD operations

---

## References

- **Migration Script:** `D:\PROJECTS\NOOR CANVAS\Scripts\create-annotations-table.sql`
- **Comparison Tool:** `D:\PROJECTS\NOOR CANVAS\Workspaces\Scripts\compare-canvas-schemas-simple.ps1`
- **Schema History:** `D:\PROJECTS\NOOR CANVAS\Workspaces\Scripts\schema-comparison.csv`
- **Migration Guide:** `D:\PROJECTS\NOOR CANVAS\Scripts\migrate-annotations-id-to-bigint.sql` (for future INT to BIGINT migration if needed)

---

**Report Generated By:** GitHub Copilot Schema Comparison Analysis  
**Database Connection:** AHHOME SQL Server  
**Analysis Date:** October 18, 2025
