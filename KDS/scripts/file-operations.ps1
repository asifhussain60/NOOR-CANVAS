# KDS File Accessor - File Operations Implementation
# Purpose: Implement file-accessor.md abstraction using local file system
# Version: 5.0 (SOLID Refactor - DIP Compliance)
# Dependencies: ZERO external (PowerShell built-ins only)

<#
.SYNOPSIS
Abstracted file operations for KDS (read, write, exists, list).

.DESCRIPTION
Implements the file-accessor.md abstraction interface using PowerShell built-ins.
Provides category-based path resolution and optional caching/backups.

.PARAMETER Operation
The operation to perform: read, write, exists, list

.PARAMETER FilePath
Relative file path within category

.PARAMETER Category
File category for path resolution (prompts, governance, sessions, knowledge, tests)

.PARAMETER Content
(For write) Content to write to file

.PARAMETER CreateBackup
(For write) Whether to create backup before writing (default: $true)

.PARAMETER Pattern
(For list) Glob pattern for file listing

.EXAMPLE
# Read file
.\file-operations.ps1 -Operation read -FilePath "rules.md" -Category "governance"

.EXAMPLE
# Write file with backup
.\file-operations.ps1 -Operation write -FilePath "current-session.json" -Category "sessions" -Content $json

.EXAMPLE
# List files
.\file-operations.ps1 -Operation list -Pattern "*.md" -Category "knowledge/test-patterns"
#>

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('read', 'write', 'exists', 'list')]
    [string]$Operation,
    
    [Parameter(Mandatory=$false)]
    [string]$FilePath,
    
    [Parameter(Mandatory=$false)]
    [string]$Category,
    
    [Parameter(Mandatory=$false)]
    [string]$Content,
    
    [Parameter(Mandatory=$false)]
    [bool]$CreateBackup = $true,
    
    [Parameter(Mandatory=$false)]
    [string]$Pattern
)

# === Category-Based Path Resolution ===
$script:CategoryPaths = @{
    "prompts/user" = "KDS/prompts/user"
    "prompts/internal" = "KDS/prompts/internal"
    "prompts/shared" = "KDS/prompts/shared"
    "governance" = "KDS/governance"
    "sessions" = "KDS/sessions"
    "knowledge/test-patterns" = "KDS/knowledge/test-patterns"
    "knowledge/test-data" = "KDS/knowledge/test-data"
    "knowledge/ui-mappings" = "KDS/knowledge/ui-mappings"
    "knowledge/workflows" = "KDS/knowledge/workflows"
    "tests" = "Tests"
    "scripts" = "KDS/scripts"
    "root" = "KDS"
    "kds-brain" = "KDS/kds-brain"
}

# === Find workspace root ===
function Get-WorkspaceRoot {
    $current = $PSScriptRoot
    while ($current) {
        if (Test-Path (Join-Path $current "KDS")) {
            return $current
        }
        $parent = Split-Path $current -Parent
        if ($parent -eq $current) { break }
        $current = $parent
    }
    # Fallback: assume script is in KDS/scripts/
    return Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
}

$script:WorkspaceRoot = Get-WorkspaceRoot

# === Resolve Path ===
function Resolve-CategoryPath {
    param(
        [string]$File,
        [string]$Cat
    )
    
    if (-not $script:CategoryPaths.ContainsKey($Cat)) {
        $validCategories = $script:CategoryPaths.Keys -join ", "
        Write-Error "INVALID_CATEGORY: $Cat (valid: $validCategories)"
        return $null
    }
    
    $basePath = Join-Path $script:WorkspaceRoot $script:CategoryPaths[$Cat]
    $fullPath = Join-Path $basePath $File
    
    return $fullPath
}

# === Read File ===
function Read-KDSFile {
    param(
        [string]$File,
        [string]$Cat
    )
    
    $resolvedPath = Resolve-CategoryPath -File $File -Cat $Cat
    if (-not $resolvedPath) { return $null }
    
    if (-not (Test-Path $resolvedPath)) {
        Write-Error "FILE_NOT_FOUND: $resolvedPath"
        return $null
    }
    
    try {
        $content = Get-Content -Path $resolvedPath -Raw -ErrorAction Stop
        Write-Output $content
    } catch {
        Write-Error "READ_ERROR: $($_.Exception.Message)"
        return $null
    }
}

# === Write File ===
function Write-KDSFile {
    param(
        [string]$File,
        [string]$Cat,
        [string]$FileContent,
        [bool]$Backup
    )
    
    $resolvedPath = Resolve-CategoryPath -File $File -Cat $Cat
    if (-not $resolvedPath) { return $false }
    
    # Create directory if needed
    $directory = Split-Path $resolvedPath -Parent
    if (-not (Test-Path $directory)) {
        New-Item -ItemType Directory -Path $directory -Force | Out-Null
    }
    
    # Create backup if requested and file exists
    if ($Backup -and (Test-Path $resolvedPath)) {
        $backupPath = "$resolvedPath.backup"
        Copy-Item -Path $resolvedPath -Destination $backupPath -Force
    }
    
    # Write file
    try {
        Set-Content -Path $resolvedPath -Value $FileContent -Force -ErrorAction Stop
        Write-Output $true
    } catch {
        Write-Error "WRITE_ERROR: $($_.Exception.Message)"
        return $false
    }
}

# === File Exists ===
function Test-KDSFileExists {
    param(
        [string]$File,
        [string]$Cat
    )
    
    $resolvedPath = Resolve-CategoryPath -File $File -Cat $Cat
    if (-not $resolvedPath) { return $false }
    
    return (Test-Path $resolvedPath)
}

# === List Files ===
function Get-KDSFiles {
    param(
        [string]$FilePattern,
        [string]$Cat
    )
    
    if (-not $script:CategoryPaths.ContainsKey($Cat)) {
        Write-Error "INVALID_CATEGORY: $Cat"
        return @()
    }
    
    $basePath = Join-Path $script:WorkspaceRoot $script:CategoryPaths[$Cat]
    
    if (-not (Test-Path $basePath)) {
        Write-Output @()
        return
    }
    
    try {
        $searchPath = Join-Path $basePath $FilePattern
        $files = Get-ChildItem -Path $searchPath -File -ErrorAction SilentlyContinue |
                 Select-Object -ExpandProperty Name
        
        Write-Output $files
    } catch {
        Write-Error "LIST_ERROR: $($_.Exception.Message)"
        return @()
    }
}

# === Main Execution ===
switch ($Operation) {
    'read' {
        if (-not $FilePath -or -not $Category) {
            Write-Error "FILEPATH_AND_CATEGORY_REQUIRED"
            exit 1
        }
        $result = Read-KDSFile -File $FilePath -Cat $Category
        if ($result) {
            Write-Output $result
        }
    }
    
    'write' {
        if (-not $FilePath -or -not $Category -or -not $Content) {
            Write-Error "FILEPATH_CATEGORY_CONTENT_REQUIRED"
            exit 1
        }
        $success = Write-KDSFile -File $FilePath -Cat $Category -FileContent $Content -Backup $CreateBackup
        Write-Output $success
    }
    
    'exists' {
        if (-not $FilePath -or -not $Category) {
            Write-Error "FILEPATH_AND_CATEGORY_REQUIRED"
            exit 1
        }
        $exists = Test-KDSFileExists -File $FilePath -Cat $Category
        Write-Output $exists
    }
    
    'list' {
        if (-not $Pattern -or -not $Category) {
            Write-Error "PATTERN_AND_CATEGORY_REQUIRED"
            exit 1
        }
        $files = Get-KDSFiles -FilePattern $Pattern -Cat $Category
        $files | ConvertTo-Json
    }
    
    default {
        Write-Error "UNKNOWN_OPERATION: $Operation"
        exit 1
    }
}

exit 0
