# Compare canvas schema between KSESSIONS_DEV and KSESSIONS databases
# For TranscriptCanvas migration validation

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Canvas Schema Comparison Tool" -ForegroundColor Cyan
Write-Host "Comparing KSESSIONS_DEV vs KSESSIONS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Database connection details
$server = "AHHOME"
$username = "sa"
$password = "adf4961glo"

# Query to get canvas schema tables and columns
$schemaQuery = @"
SELECT 
    s.name as SchemaName,
    t.name as TableName,
    c.name as ColumnName,
    ty.name as DataType,
    c.max_length as MaxLength,
    c.precision as Precision,
    c.scale as Scale,
    c.is_nullable as IsNullable,
    c.is_identity as IsIdentity,
    ISNULL(dc.definition, '') as DefaultValue
FROM sys.tables t
INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
INNER JOIN sys.columns c ON t.object_id = c.object_id
INNER JOIN sys.types ty ON c.user_type_id = ty.user_type_id
LEFT JOIN sys.default_constraints dc ON c.default_object_id = dc.object_id
WHERE s.name = 'canvas'
ORDER BY s.name, t.name, c.column_id
"@

# Get KSESSIONS_DEV schema
Write-Host "📊 Querying KSESSIONS_DEV canvas schema..." -ForegroundColor Yellow
$devSchemaFile = "D:\PROJECTS\NOOR CANVAS\Workspaces\Scripts\dev-canvas-schema.csv"
sqlcmd -S $server -d KSESSIONS_DEV -U $username -P $password -Q $schemaQuery -s "," -W -h -1 | Out-File -FilePath $devSchemaFile -Encoding UTF8
Write-Host "✅ KSESSIONS_DEV schema exported to: $devSchemaFile" -ForegroundColor Green

# Get KSESSIONS schema
Write-Host "📊 Querying KSESSIONS canvas schema..." -ForegroundColor Yellow
$prodSchemaFile = "D:\PROJECTS\NOOR CANVAS\Workspaces\Scripts\prod-canvas-schema.csv"
sqlcmd -S $server -d KSESSIONS -U $username -P $password -Q $schemaQuery -s "," -W -h -1 | Out-File -FilePath $prodSchemaFile -Encoding UTF8
Write-Host "✅ KSESSIONS schema exported to: $prodSchemaFile" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Analyzing Differences..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Read and parse the schema files
$devSchema = Get-Content $devSchemaFile | Where-Object { $_ -match "^canvas," }
$prodSchema = Get-Content $prodSchemaFile | Where-Object { $_ -match "^canvas," }

# Find tables in DEV but not in PROD
$devTables = ($devSchema | ForEach-Object { ($_ -split ',')[1] }) | Select-Object -Unique | Sort-Object
$prodTables = ($prodSchema | ForEach-Object { ($_ -split ',')[1] }) | Select-Object -Unique | Sort-Object

$missingInProd = $devTables | Where-Object { $_ -notin $prodTables }
$extraInProd = $prodTables | Where-Object { $_ -notin $devTables }

Write-Host "📋 Tables Summary:" -ForegroundColor Magenta
Write-Host "  DEV tables: $($devTables.Count)" -ForegroundColor White
Write-Host "  PROD tables: $($prodTables.Count)" -ForegroundColor White
Write-Host ""

if ($missingInProd.Count -gt 0) {
    Write-Host "⚠️  TABLES MISSING IN PRODUCTION:" -ForegroundColor Red
    foreach ($table in $missingInProd) {
        Write-Host "  - canvas.$table" -ForegroundColor Yellow
    }
    Write-Host ""
}

if ($extraInProd.Count -gt 0) {
    Write-Host "⚠️  EXTRA TABLES IN PRODUCTION (not in DEV):" -ForegroundColor Red
    foreach ($table in $extraInProd) {
        Write-Host "  - canvas.$table" -ForegroundColor Yellow
    }
    Write-Host ""
}

if ($missingInProd.Count -eq 0 -and $extraInProd.Count -eq 0) {
    Write-Host "✅ All tables match between DEV and PROD" -ForegroundColor Green
    Write-Host ""
}

# Check for column differences
Write-Host "🔍 Checking column-level differences..." -ForegroundColor Magenta
Write-Host ""

$columnDifferences = @()

foreach ($table in $devTables) {
    $devColumns = $devSchema | Where-Object { $_ -match "^canvas,$table," }
    $prodColumns = $prodSchema | Where-Object { $_ -match "^canvas,$table," }
    
    foreach ($devCol in $devColumns) {
        $devParts = $devCol -split ','
        $columnName = $devParts[2]
        
        $matchingProdCol = $prodColumns | Where-Object { ($_ -split ',')[2] -eq $columnName }
        
        if (-not $matchingProdCol) {
            $columnDifferences += [PSCustomObject]@{
                Table = $table
                Column = $columnName
                Issue = "Missing in PROD"
                DevDefinition = $devCol
                ProdDefinition = ""
            }
        }
        elseif ($devCol -ne $matchingProdCol) {
            $columnDifferences += [PSCustomObject]@{
                Table = $table
                Column = $columnName
                Issue = "Schema mismatch"
                DevDefinition = $devCol
                ProdDefinition = $matchingProdCol
            }
        }
    }
}

if ($columnDifferences.Count -gt 0) {
    Write-Host "⚠️  COLUMN DIFFERENCES FOUND: $($columnDifferences.Count)" -ForegroundColor Red
    Write-Host ""
    
    $columnDifferences | Format-Table -AutoSize
    
    # Export to file
    $diffFile = "D:\PROJECTS\NOOR CANVAS\Workspaces\Scripts\canvas-schema-differences.csv"
    $columnDifferences | Export-Csv -Path $diffFile -NoTypeInformation
    Write-Host "📄 Detailed differences exported to: $diffFile" -ForegroundColor Yellow
}
else {
    Write-Host "✅ All columns match perfectly between DEV and PROD" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Comparison Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
