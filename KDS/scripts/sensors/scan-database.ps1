<#
.SYNOPSIS
    KDS Database Sensor - Scans DbContext files and appsettings.json for database schema knowledge

.DESCRIPTION
    Extracts database tables, relationships, connection strings, and environment-specific 
    configurations from C# DbContext files and appsettings.json files.
    
    Part of KDS v5.0 Brain System - Week 2: Database Sensor

.PARAMETER Mode
    Scan mode: 'Full' (all files) or 'Incremental' (only changed files since last scan)

.PARAMETER OutputPath
    Path to output database.json file (default: KDS/context/database.json)

.EXAMPLE
    .\scan-database.ps1 -Mode Incremental
    .\scan-database.ps1 -Mode Full

.NOTES
    Version: 1.0.0
    Author: KDS Brain System
    Created: 2025-11-02 (Week 2)
#>

param(
    [Parameter(Mandatory = $false)]
    [ValidateSet('Full', 'Incremental')]
    [string]$Mode = 'Incremental',

    [Parameter(Mandatory = $false)]
    [string]$OutputPath = 'KDS/context/database.json'
)

$ErrorActionPreference = 'Stop'
$startTime = Get-Date

Write-Host "🧠 KDS Database Sensor v1.0.0" -ForegroundColor Cyan
Write-Host "Mode: $Mode" -ForegroundColor Gray
Write-Host ""

# ===========================
# STEP 1: Load Existing Data
# ===========================

$lastScan = $null
$existingData = @{
    connections = @{}
    tables = @()
}

$fullOutputPath = if ([System.IO.Path]::IsPathRooted($OutputPath)) { $OutputPath } else { Join-Path $PSScriptRoot "..\..\..\$OutputPath" }

if (Test-Path $fullOutputPath) {
    try {
        $existing = Get-Content $fullOutputPath -Raw | ConvertFrom-Json
        $lastScan = $existing.last_scan
        if ($existing.connections) { $existingData.connections = $existing.connections }
        if ($existing.tables) { $existingData.tables = $existing.tables }
        Write-Host "✅ Loaded existing database.json (last scan: $lastScan)" -ForegroundColor Green
    }
    catch {
        Write-Host "⚠️  Could not parse existing database.json, starting fresh" -ForegroundColor Yellow
    }
}

# ===========================
# STEP 2: Find Files to Scan
# ===========================

Write-Host "🔍 Discovering database-related files..." -ForegroundColor Cyan

# Determine workspace root (go up 3 levels from KDS/scripts/sensors)
$workspaceRoot = Split-Path (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent) -Parent
Write-Host "   Workspace: $workspaceRoot" -ForegroundColor Gray

# Find DbContext files
$dbContextFiles = Get-ChildItem -Path "$workspaceRoot\SPA\NoorCanvas" -Filter "*DbContext.cs" -Recurse -ErrorAction SilentlyContinue

# Find appsettings files
$appsettingsFiles = Get-ChildItem -Path "$workspaceRoot\SPA\NoorCanvas" -Filter "appsettings*.json" -Recurse -ErrorAction SilentlyContinue

# Combine all files
$allFiles = @()
$allFiles += $dbContextFiles
$allFiles += $appsettingsFiles

if ($allFiles.Count -eq 0) {
    Write-Host "❌ No database files found!" -ForegroundColor Red
    exit 1
}

# Incremental filtering
$filesToScan = $allFiles
if ($Mode -eq 'Incremental' -and $lastScan) {
    $lastScanDate = [DateTime]::Parse($lastScan)
    $filesToScan = $allFiles | Where-Object { $_.LastWriteTime -gt $lastScanDate }
    
    if ($filesToScan.Count -eq 0) {
        Write-Host "✅ No database files changed since last scan. Using cached data." -ForegroundColor Green
        
        # Return existing data with updated timestamp
        $output = @{
            last_scan = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
            scan_metadata = @{
                sensor_version = "1.0.0"
                scan_mode = $Mode
                changed_files = @()
            }
            total_connections = $existingData.connections.Count
            total_tables = $existingData.tables.Count
            connections = $existingData.connections
            tables = $existingData.tables
            scan_duration_ms = ((Get-Date) - $startTime).TotalMilliseconds
        }
        
        $output | ConvertTo-Json -Depth 10 | Out-File $fullOutputPath -Encoding UTF8
        Write-Host "✅ Database sensor complete (no changes)" -ForegroundColor Green
        exit 0
    }
    
    Write-Host "📝 Incremental mode: Scanning $($filesToScan.Count) changed file(s)" -ForegroundColor Yellow
}
else {
    Write-Host "📝 Full scan mode: Scanning $($filesToScan.Count) file(s)" -ForegroundColor Yellow
}

# ===========================
# STEP 3: Extract Connections
# ===========================

Write-Host "🔌 Extracting database connections..." -ForegroundColor Cyan

$connections = @{}

foreach ($file in ($filesToScan | Where-Object { $_.Name -like "appsettings*.json" })) {
    try {
        $content = Get-Content $file.FullName -Raw | ConvertFrom-Json
        
        if ($content.ConnectionStrings) {
            foreach ($prop in $content.ConnectionStrings.PSObject.Properties) {
                $connName = $prop.Name
                $connString = $prop.Value
                
                # Parse connection string
                $server = if ($connString -match 'Server=([^;]+)') { $matches[1] } else { "unknown" }
                $database = if ($connString -match 'Database=([^;]+)') { $matches[1] } else { "unknown" }
                
                # Determine environment from filename
                $environment = @()
                if ($file.Name -match 'Development') { $environment += "development" }
                elseif ($file.Name -match 'Production') { $environment += "production" }
                elseif ($file.Name -eq 'appsettings.json') { $environment += "default" }
                
                # Store connection info
                if (-not $connections.ContainsKey($connName)) {
                    $connections[$connName] = @{
                        server = $server
                        database = $database
                        environments = $environment
                        source_file = $file.Name
                        confidence = 1.0
                    }
                }
                else {
                    # Merge environments
                    $existing = $connections[$connName].environments
                    $connections[$connName].environments = ($existing + $environment) | Select-Object -Unique
                }
            }
        }
    }
    catch {
        Write-Host "⚠️  Error parsing $($file.Name): $_" -ForegroundColor Yellow
    }
}

Write-Host "✅ Found $($connections.Count) connection string(s)" -ForegroundColor Green

# ===========================
# STEP 4: Extract Table Schema
# ===========================

Write-Host "📊 Extracting database tables from DbContext..." -ForegroundColor Cyan

$tables = @()

foreach ($file in ($filesToScan | Where-Object { $_.Name -like "*DbContext.cs" })) {
    try {
        $content = Get-Content $file.FullName -Raw
        
        # Extract DbContext class name
        $contextName = if ($content -match 'class\s+(\w+DbContext)') { $matches[1] } else { "UnknownContext" }
        
        # Extract DbSet<T> properties
        $dbSetMatches = [regex]::Matches($content, 'public\s+DbSet<(\w+)>\s+(\w+)\s*\{\s*get;\s*set;\s*\}')
        
        foreach ($match in $dbSetMatches) {
            $entityType = $match.Groups[1].Value
            $dbSetName = $match.Groups[2].Value
            
            # Extract relationships (navigation properties)
            $relationships = @()
            
            # Find the entity class definition (simple approach)
            $entityPattern = "class\s+$entityType[\s\S]*?\{([\s\S]*?)\n\s*\}"
            if ($content -match $entityPattern) {
                $entityBody = $matches[1]
                
                # Look for navigation properties (ICollection, List, virtual properties)
                $navMatches = [regex]::Matches($entityBody, 'public\s+(?:virtual\s+)?(?:ICollection<(\w+)>|List<(\w+)>)\s+(\w+)')
                
                foreach ($navMatch in $navMatches) {
                    $targetType = if ($navMatch.Groups[1].Value) { $navMatch.Groups[1].Value } else { $navMatch.Groups[2].Value }
                    $navProp = $navMatch.Groups[3].Value
                    
                    $relationships += @{
                        type = "one-to-many"
                        target = $targetType
                        property = $navProp
                    }
                }
            }
            
            $tables += @{
                name = $entityType
                dbset = $dbSetName
                context = $contextName
                file = $file.FullName.Replace("$workspaceRoot\", "").Replace("\", "/")
                relationships = $relationships
                confidence = 1.0
            }
        }
    }
    catch {
        Write-Host "⚠️  Error parsing $($file.Name): $_" -ForegroundColor Yellow
    }
}

Write-Host "✅ Found $($tables.Count) database table(s)" -ForegroundColor Green

# ===========================
# STEP 5: Build Output
# ===========================

Write-Host "📦 Building database.json..." -ForegroundColor Cyan

$changedFiles = $filesToScan | ForEach-Object { $_.FullName.Replace("$workspaceRoot\", "").Replace("\", "/") }

$output = @{
    last_scan = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
    scan_metadata = @{
        sensor_version = "1.0.0"
        scan_mode = $Mode
        changed_files = $changedFiles
    }
    total_connections = $connections.Count
    total_tables = $tables.Count
    connections = $connections
    tables = $tables
    scan_duration_ms = ((Get-Date) - $startTime).TotalMilliseconds
}

# ===========================
# STEP 6: Save Output
# ===========================

$fullOutputPath = if ([System.IO.Path]::IsPathRooted($OutputPath)) { $OutputPath } else { Join-Path $workspaceRoot $OutputPath }
$outputDir = Split-Path $fullOutputPath -Parent
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

$output | ConvertTo-Json -Depth 10 | Out-File $fullOutputPath -Encoding UTF8

Write-Host ""
Write-Host "✅ Database sensor complete!" -ForegroundColor Green
Write-Host "   Components: $($connections.Count)" -ForegroundColor Gray
Write-Host "   Tables: $($tables.Count)" -ForegroundColor Gray
Write-Host "   Duration: $([math]::Round($output.scan_duration_ms, 0))ms" -ForegroundColor Gray
Write-Host "   Output: $fullOutputPath" -ForegroundColor Gray
Write-Host ""
