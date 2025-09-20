# Schema Simplification Validation Scripts

This folder contains SQL scripts to validate the schema simplification migration from 15 tables to 3 tables.

## Pre-Migration Validation

Run these scripts **before** starting the migration to establish baseline counts:

```sql
-- Get baseline counts of original schema
SELECT 'Original Sessions' as TableName, COUNT(*) as RecordCount FROM [canvas].[Sessions]
UNION ALL
SELECT 'Original Users', COUNT(*) FROM [canvas].[Users] 
UNION ALL
SELECT 'Original Registrations', COUNT(*) FROM [canvas].[Registrations]
UNION ALL
SELECT 'Original SecureTokens', COUNT(*) FROM [canvas].[SecureTokens]
UNION ALL
SELECT 'Original SharedAssets', COUNT(*) FROM [canvas].[SharedAssets]
UNION ALL
SELECT 'Original Annotations', COUNT(*) FROM [canvas].[Annotations] WHERE IsDeleted = 0
UNION ALL
SELECT 'Original Questions', COUNT(*) FROM [canvas].[Questions]
UNION ALL
SELECT 'Original QuestionAnswers', COUNT(*) FROM [canvas].[QuestionAnswers]
UNION ALL
SELECT 'Original SessionLinks', COUNT(*) FROM [canvas].[SessionLinks]
UNION ALL
SELECT 'Original HostSessions', COUNT(*) FROM [canvas].[HostSessions]
ORDER BY TableName;
```

## Post-Migration Validation

Run these scripts **after** the migration to ensure data integrity:

### 1. Record Count Validation
```sql
-- Compare record counts between old and new schemas
WITH OriginalCounts AS (
    SELECT 
        (SELECT COUNT(*) FROM [canvas].[Sessions]) as Sessions,
        (SELECT COUNT(*) FROM [canvas].[Users] u INNER JOIN [canvas].[Registrations] r ON u.UserId = r.UserId) as Participants,
        (SELECT COUNT(*) FROM [canvas].[SharedAssets]) + 
        (SELECT COUNT(*) FROM [canvas].[Annotations] WHERE IsDeleted = 0) + 
        (SELECT COUNT(*) FROM [canvas].[Questions]) +
        (SELECT COUNT(*) FROM [canvas].[QuestionAnswers]) as ContentItems
),
NewCounts AS (
    SELECT 
        (SELECT COUNT(*) FROM [canvas].[Sessions_New]) as Sessions,
        (SELECT COUNT(*) FROM [canvas].[Participants_New]) as Participants,
        (SELECT COUNT(*) FROM [canvas].[SessionData_New]) as ContentItems
)
SELECT 
    'Sessions' as DataType,
    o.Sessions as OriginalCount,
    n.Sessions as MigratedCount,
    CASE WHEN o.Sessions = n.Sessions THEN '✅ MATCH' ELSE '❌ MISMATCH' END as Status
FROM OriginalCounts o, NewCounts n

UNION ALL

SELECT 
    'Participants' as DataType,
    o.Participants as OriginalCount, 
    n.Participants as MigratedCount,
    CASE WHEN o.Participants = n.Participants THEN '✅ MATCH' ELSE '❌ MISMATCH' END as Status
FROM OriginalCounts o, NewCounts n

UNION ALL

SELECT 
    'Content Items' as DataType,
    o.ContentItems as OriginalCount,
    n.ContentItems as MigratedCount, 
    CASE WHEN o.ContentItems = n.ContentItems THEN '✅ MATCH' ELSE '❌ MISMATCH' END as Status
FROM OriginalCounts o, NewCounts n;
```

### 2. Data Quality Validation
```sql
-- Validate data quality in migrated tables

-- Check for missing host/user tokens
SELECT 'Missing Tokens' as Issue, COUNT(*) as Count
FROM [canvas].[Sessions_New] 
WHERE HostToken IS NULL OR UserToken IS NULL OR HostToken = '' OR UserToken = '';

-- Check for duplicate tokens
SELECT 'Duplicate Host Tokens' as Issue, COUNT(*) - COUNT(DISTINCT HostToken) as Count
FROM [canvas].[Sessions_New]
UNION ALL
SELECT 'Duplicate User Tokens' as Issue, COUNT(*) - COUNT(DISTINCT UserToken) as Count  
FROM [canvas].[Sessions_New];

-- Check for orphaned participants
SELECT 'Orphaned Participants' as Issue, COUNT(*) as Count
FROM [canvas].[Participants_New] p
LEFT JOIN [canvas].[Sessions_New] s ON s.SessionId = p.SessionId
WHERE s.SessionId IS NULL;

-- Check for invalid JSON in SessionData
SELECT 'Invalid JSON Content' as Issue, COUNT(*) as Count
FROM [canvas].[SessionData_New] 
WHERE Content IS NOT NULL 
  AND Content != ''
  AND ISJSON(Content) = 0
  AND DataType IN ('SharedAsset', 'Question', 'QuestionAnswer');

-- Check SessionData type distribution
SELECT 
    DataType,
    COUNT(*) as Count,
    AVG(LEN(Content)) as AvgContentSize,
    MAX(LEN(Content)) as MaxContentSize
FROM [canvas].[SessionData_New]
GROUP BY DataType
ORDER BY Count DESC;
```

### 3. Business Logic Validation
```sql
-- Validate business rules are preserved

-- Check session token uniqueness
SELECT 'Token Uniqueness Violations' as ValidationRule,
    CASE 
        WHEN EXISTS (
            SELECT HostToken FROM [canvas].[Sessions_New] 
            GROUP BY HostToken HAVING COUNT(*) > 1
        ) OR EXISTS (
            SELECT UserToken FROM [canvas].[Sessions_New]
            GROUP BY UserToken HAVING COUNT(*) > 1  
        ) THEN '❌ FAILED'
        ELSE '✅ PASSED'
    END as Status;

-- Check all active sessions have valid expiry dates
SELECT 'Session Expiry Logic' as ValidationRule,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM [canvas].[Sessions_New] 
            WHERE Status = 'Active' AND (ExpiresAt IS NULL OR ExpiresAt < CreatedAt)
        ) THEN '❌ FAILED'
        ELSE '✅ PASSED' 
    END as Status;

-- Check participant names are preserved
SELECT 'Participant Data Integrity' as ValidationRule,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM [canvas].[Participants_New]
            WHERE (Name IS NULL OR Name = '') AND UserGuid IS NOT NULL
        ) THEN '⚠️ WARNING - Some participants missing names'
        ELSE '✅ PASSED'
    END as Status;

-- Validate content migration completeness  
WITH ContentTypeCounts AS (
    SELECT 
        'SharedAsset' as DataType,
        (SELECT COUNT(*) FROM [canvas].[SharedAssets]) as OriginalCount,
        (SELECT COUNT(*) FROM [canvas].[SessionData_New] WHERE DataType = 'SharedAsset') as MigratedCount
    UNION ALL
    SELECT 
        'Annotation' as DataType, 
        (SELECT COUNT(*) FROM [canvas].[Annotations] WHERE IsDeleted = 0) as OriginalCount,
        (SELECT COUNT(*) FROM [canvas].[SessionData_New] WHERE DataType = 'Annotation' AND IsDeleted = 0) as MigratedCount
    UNION ALL
    SELECT
        'Question' as DataType,
        (SELECT COUNT(*) FROM [canvas].[Questions]) as OriginalCount, 
        (SELECT COUNT(*) FROM [canvas].[SessionData_New] WHERE DataType = 'Question') as MigratedCount
)
SELECT 
    'Content Migration Completeness' as ValidationRule,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM ContentTypeCounts WHERE OriginalCount != MigratedCount
        ) THEN '❌ FAILED - Content count mismatch detected'
        ELSE '✅ PASSED'
    END as Status;
```

### 4. Performance Validation
```sql
-- Test query performance on new schema

-- Test session lookup by host token (most common operation)
SET STATISTICS IO ON;
SET STATISTICS TIME ON;

SELECT s.SessionId, s.Title, s.Status, COUNT(p.ParticipantId) as ParticipantCount
FROM [canvas].[Sessions_New] s
LEFT JOIN [canvas].[Participants_New] p ON p.SessionId = s.SessionId  
WHERE s.HostToken = 'TESTHOST' -- Replace with actual token
GROUP BY s.SessionId, s.Title, s.Status;

-- Test content retrieval for session (second most common)
SELECT DataType, COUNT(*) as ItemCount, AVG(LEN(Content)) as AvgSize
FROM [canvas].[SessionData_New]
WHERE SessionId = 1 -- Replace with actual session ID
  AND IsDeleted = 0
GROUP BY DataType;

SET STATISTICS IO OFF;
SET STATISTICS TIME OFF;

-- Check index usage
SELECT 
    i.name as IndexName,
    s.user_seeks + s.user_scans as Usage,
    s.user_lookups as Lookups,
    s.last_user_seek,
    s.last_user_scan
FROM sys.dm_db_index_usage_stats s
INNER JOIN sys.indexes i ON i.object_id = s.object_id AND i.index_id = s.index_id
INNER JOIN sys.objects o ON o.object_id = s.object_id  
WHERE o.name IN ('Sessions_New', 'Participants_New', 'SessionData_New')
  AND s.database_id = DB_ID()
ORDER BY Usage DESC;
```

## Expected Results

After a successful migration, you should see:

### ✅ Success Criteria
- **Record Counts**: All validation queries show "✅ MATCH" 
- **Data Quality**: Zero issues found in quality checks
- **Business Rules**: All validation rules show "✅ PASSED"
- **Performance**: Query times < 100ms for typical operations
- **JSON Content**: All SessionData content is valid JSON where expected

### ⚠️ Warning Signs  
- Participant count mismatches (may indicate registration data issues)
- Invalid JSON content (indicates serialization problems)
- Missing session expiry dates (business logic errors)

### ❌ Failure Conditions
- Session count mismatches (critical data loss)
- Duplicate or missing tokens (authentication will fail)  
- Orphaned participants (referential integrity violations)
- Content migration failures (feature functionality loss)

## Rollback Criteria

If any ❌ failure conditions are detected:

1. **STOP** the migration immediately
2. **DO NOT** proceed to schema removal phase
3. **RESTORE** from pre-migration database backup
4. **INVESTIGATE** root cause before retry

## Post-Validation Cleanup

Once all validations pass, you can optionally run cleanup:

```sql  
-- Remove validation comments and temporary data (optional)
-- Only run after 100% validation success

-- This step is covered in the RemoveOriginalComplexSchema migration
-- Do not run manually unless using phased approach
```