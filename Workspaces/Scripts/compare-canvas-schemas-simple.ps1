# Compare canvas schema between KSESSIONS_DEV and KSESSIONS databases
# For TranscriptCanvas migration validation

$ErrorActionPreference = "Stop"

"========================================"
"Canvas Schema Comparison Tool"
"Comparing KSESSIONS_DEV vs KSESSIONS"
"========================================"
""

# Database connection details
$server = "AHHOME"
$username = "sa"
$password = "adf4961glo"

# Query to get canvas schema tables
$tableQuery = @"
SELECT t.name 
FROM sys.tables t
INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
WHERE s.name = 'canvas'
ORDER BY t.name
"@

"Querying KSESSIONS_DEV canvas tables..."
$devTables = sqlcmd -S $server -d KSESSIONS_DEV -U $username -P $password -Q $tableQuery -h -1 | Where-Object { $_.Trim() -ne "" }

"Querying KSESSIONS canvas tables..."
$prodTables = sqlcmd -S $server -d KSESSIONS -U $username -P $password -Q $tableQuery -h -1 | Where-Object { $_.Trim() -ne "" }

""
"========================================"
"Table Comparison Results"
"========================================"
""

"DEV Tables ($($devTables.Count)):"
$devTables | ForEach-Object { "  - canvas.$($_.Trim())" }
""

"PROD Tables ($($prodTables.Count)):"
$prodTables | ForEach-Object { "  - canvas.$($_.Trim())" }
""

# Find missing tables
$devTableNames = $devTables | ForEach-Object { $_.Trim() }
$prodTableNames = $prodTables | ForEach-Object { $_.Trim() }

$missingInProd = $devTableNames | Where-Object { $_ -notin $prodTableNames }
$extraInProd = $prodTableNames | Where-Object { $_ -notin $devTableNames }

if ($missingInProd.Count -gt 0) {
    "========================================"
    "MIGRATION REQUIRED: Tables Missing in PROD"
    "========================================"
    foreach ($table in $missingInProd) {
        "  WARNING: canvas.$table"
    }
    ""
}

if ($extraInProd.Count -gt 0) {
    "========================================"
    "Extra Tables in PROD (not in DEV)"
    "========================================"
    foreach ($table in $extraInProd) {
        "  INFO: canvas.$table"
    }
    ""
}

if ($missingInProd.Count -eq 0 -and $extraInProd.Count -eq 0) {
    "SUCCESS: All tables exist in both databases"
    ""
}

# Now check specific TranscriptCanvas-related tables
""
"========================================"
"TranscriptCanvas Feature Check"
"========================================"
""

$transcriptCanvasTables = @("ContentBroadcasts", "Annotations")

foreach ($table in $transcriptCanvasTables) {
    $inDev = $devTableNames -contains $table
    $inProd = $prodTableNames -contains $table
    
    "$table :"
    "  DEV: $(if($inDev){'EXISTS'}else{'MISSING'})"
    "  PROD: $(if($inProd){'EXISTS'}else{'MISSING'})"
    ""
}

# Export report
$reportFile = "D:\PROJECTS\NOOR CANVAS\Workspaces\Scripts\canvas-schema-comparison-report.txt"
@"
Canvas Schema Comparison Report
Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
========================================

DEV Tables: $($devTables.Count)
PROD Tables: $($prodTables.Count)

Missing in PROD: $($missingInProd.Count)
$(if($missingInProd.Count -gt 0){($missingInProd | ForEach-Object {"  - canvas.$_"}) -join "`n"}else{"  None"})

Extra in PROD: $($extraInProd.Count)
$(if($extraInProd.Count -gt 0){($extraInProd | ForEach-Object {"  - canvas.$_"}) -join "`n"}else{"  None"})

TranscriptCanvas Feature Tables:
$(foreach($table in $transcriptCanvasTables){"  - $table : DEV=$(if($devTableNames -contains $table){'YES'}else{'NO'}) | PROD=$(if($prodTableNames -contains $table){'YES'}else{'NO'})"})
"@ | Out-File -FilePath $reportFile -Encoding UTF8

""
"Report saved to: $reportFile"
""
