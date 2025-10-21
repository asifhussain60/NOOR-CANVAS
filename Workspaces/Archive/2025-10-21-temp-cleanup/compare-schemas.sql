-- Compare canvas schema tables between KSESSIONS_DEV and KSESSIONS
-- Find columns that exist in DEV but not in PROD

-- Columns in DEV but not in PROD
SELECT 
    'Missing in PROD' AS Issue,
    dev_t.name AS TableName,
    dev_c.name AS ColumnName,
    dev_ty.name AS DataType,
    dev_c.max_length AS MaxLength,
    dev_c.is_nullable AS IsNullable
FROM KSESSIONS_DEV.sys.tables dev_t
INNER JOIN KSESSIONS_DEV.sys.columns dev_c ON dev_t.object_id = dev_c.object_id
INNER JOIN KSESSIONS_DEV.sys.types dev_ty ON dev_c.user_type_id = dev_ty.user_type_id
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
)

UNION ALL

-- Columns in PROD but not in DEV
SELECT 
    'Missing in DEV' AS Issue,
    prod_t.name AS TableName,
    prod_c.name AS ColumnName,
    prod_ty.name AS DataType,
    prod_c.max_length AS MaxLength,
    prod_c.is_nullable AS IsNullable
FROM KSESSIONS.sys.tables prod_t
INNER JOIN KSESSIONS.sys.columns prod_c ON prod_t.object_id = prod_c.object_id
INNER JOIN KSESSIONS.sys.types prod_ty ON prod_c.user_type_id = prod_ty.user_type_id
INNER JOIN KSESSIONS.sys.schemas prod_s ON prod_t.schema_id = prod_s.schema_id
WHERE prod_s.name = 'canvas'
AND NOT EXISTS (
    SELECT 1 
    FROM KSESSIONS_DEV.sys.tables dev_t
    INNER JOIN KSESSIONS_DEV.sys.columns dev_c ON dev_t.object_id = dev_c.object_id
    INNER JOIN KSESSIONS_DEV.sys.schemas dev_s ON dev_t.schema_id = dev_s.schema_id
    WHERE dev_s.name = 'canvas'
    AND dev_t.name = prod_t.name
    AND dev_c.name = prod_c.name
)

UNION ALL

-- Tables in DEV but not in PROD
SELECT 
    'Table Missing in PROD' AS Issue,
    dev_t.name AS TableName,
    '' AS ColumnName,
    '' AS DataType,
    0 AS MaxLength,
    0 AS IsNullable
FROM KSESSIONS_DEV.sys.tables dev_t
INNER JOIN KSESSIONS_DEV.sys.schemas dev_s ON dev_t.schema_id = dev_s.schema_id
WHERE dev_s.name = 'canvas'
AND NOT EXISTS (
    SELECT 1 
    FROM KSESSIONS.sys.tables prod_t
    INNER JOIN KSESSIONS.sys.schemas prod_s ON prod_t.schema_id = prod_s.schema_id
    WHERE prod_s.name = 'canvas'
    AND prod_t.name = dev_t.name
)

UNION ALL

-- Tables in PROD but not in DEV
SELECT 
    'Table Missing in DEV' AS Issue,
    prod_t.name AS TableName,
    '' AS ColumnName,
    '' AS DataType,
    0 AS MaxLength,
    0 AS IsNullable
FROM KSESSIONS.sys.tables prod_t
INNER JOIN KSESSIONS.sys.schemas prod_s ON prod_t.schema_id = prod_s.schema_id
WHERE prod_s.name = 'canvas'
AND NOT EXISTS (
    SELECT 1 
    FROM KSESSIONS_DEV.sys.tables dev_t
    INNER JOIN KSESSIONS_DEV.sys.schemas dev_s ON dev_t.schema_id = dev_s.schema_id
    WHERE dev_s.name = 'canvas'
    AND dev_t.name = prod_t.name
)

ORDER BY TableName, ColumnName;
