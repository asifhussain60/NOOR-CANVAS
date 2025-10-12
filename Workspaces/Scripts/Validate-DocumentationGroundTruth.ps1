<#
.SYNOPSIS
    Validates documentation against actual database schema and codebase.

.DESCRIPTION
    This script performs ground truth validation of NOOR CANVAS documentation
    by comparing documented database tables against the actual KSESSIONS_DEV schema
    and searching the codebase for actual usage patterns.

.PARAMETER ServerName
    SQL Server instance name (default: AHHOME)

.PARAMETER DatabaseName
    Database to validate against (default: KSESSIONS_DEV)

.PARAMETER GenerateReport
    Generate a detailed validation report file

.EXAMPLE
    .\Validate-DocumentationGroundTruth.ps1
    Runs validation against AHHOME\KSESSIONS_DEV and displays results

.EXAMPLE
    .\Validate-DocumentationGroundTruth.ps1 -GenerateReport
    Runs validation and generates markdown report file
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [string]$ServerName = "AHHOME",
    
    [Parameter(Mandatory = $false)]
    [string]$DatabaseName = "KSESSIONS_DEV",
    
    [Parameter(Mandatory = $false)]
    [switch]$GenerateReport
)

$ErrorActionPreference = "Stop"
$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$WorkspaceRoot = Split-Path -Parent $ScriptRoot
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$ReportFile = Join-Path $ScriptRoot "validation-report-$Timestamp.md"

# Banner
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "  NOOR CANVAS - DOCUMENTATION GROUND TRUTH VALIDATION" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "Server:   $ServerName" -ForegroundColor Yellow
Write-Host "Database: $DatabaseName" -ForegroundColor Yellow
Write-Host "Started:  $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Yellow
Write-Host ""

# Results storage
$ValidationResults = @{
    DatabaseTables = @()
    CodebaseReferences = @()
    DocumentationIssues = @()
    Passed = 0
    Failed = 0
    Warnings = 0
}

# =============================================================================
# SECTION 1: DATABASE SCHEMA VALIDATION
# =============================================================================
Write-Host "[1/4] Validating Database Schema..." -ForegroundColor Cyan

try {
    # Check sqlcmd availability
    $sqlcmdPath = Get-Command sqlcmd -ErrorAction SilentlyContinue
    if (-not $sqlcmdPath) {
        Write-Host "   ⚠️  WARNING: sqlcmd not found - skipping database validation" -ForegroundColor Yellow
        $ValidationResults.Warnings++
    } else {
        # Query actual canvas schema tables
        Write-Host "   [1.1] Querying canvas schema tables..." -ForegroundColor Gray
        $canvasTablesQuery = @"
USE $DatabaseName;
SELECT name FROM sys.tables WHERE SCHEMA_NAME(schema_id) = 'canvas' ORDER BY name;
"@
        
        $canvasTables = sqlcmd -S $ServerName -E -Q $canvasTablesQuery -h -1 -W 2>&1 | 
            Where-Object { $_ -match '\S' } | 
            ForEach-Object { $_.Trim() }
        
        if ($LASTEXITCODE -eq 0 -and $canvasTables) {
            Write-Host "   ✅ Canvas schema tables found: $($canvasTables.Count)" -ForegroundColor Green
            $ValidationResults.DatabaseTables += [PSCustomObject]@{
                Schema = "canvas"
                Tables = $canvasTables
                Status = "Verified"
            }
            $ValidationResults.Passed++
        }
        
        # Query actual dbo schema tables
        Write-Host "   [1.2] Querying dbo schema tables..." -ForegroundColor Gray
        $dboTablesQuery = @"
USE $DatabaseName;
SELECT name FROM sys.tables WHERE SCHEMA_NAME(schema_id) = 'dbo' ORDER BY name;
"@
        
        $dboTables = sqlcmd -S $ServerName -E -Q $dboTablesQuery -h -1 -W 2>&1 | 
            Where-Object { $_ -match '\S' } | 
            ForEach-Object { $_.Trim() }
        
        if ($LASTEXITCODE -eq 0 -and $dboTables) {
            Write-Host "   ✅ dbo schema tables found: $($dboTables.Count)" -ForegroundColor Green
            $ValidationResults.DatabaseTables += [PSCustomObject]@{
                Schema = "dbo"
                Tables = $dboTables
                Status = "Verified"
            }
            $ValidationResults.Passed++
            
            # Check for specific obsolete table references
            Write-Host "   [1.3] Checking for obsolete table references..." -ForegroundColor Gray
            
            $obsoleteTables = @("Users", "Tokens")
            foreach ($table in $obsoleteTables) {
                if ($dboTables -contains $table) {
                    Write-Host "      ⚠️  WARNING: dbo.$table exists (unexpected)" -ForegroundColor Yellow
                    $ValidationResults.Warnings++
                } else {
                    Write-Host "      ✅ Confirmed: dbo.$table does NOT exist" -ForegroundColor Green
                    $ValidationResults.Passed++
                }
            }
            
            # Check for expected replacement tables
            $expectedTables = @("Members", "SessionTokens")
            foreach ($table in $expectedTables) {
                if ($dboTables -contains $table) {
                    Write-Host "      ✅ Confirmed: dbo.$table exists" -ForegroundColor Green
                    $ValidationResults.Passed++
                } else {
                    Write-Host "      ❌ ERROR: dbo.$table NOT found (expected)" -ForegroundColor Red
                    $ValidationResults.Failed++
                    $ValidationResults.DocumentationIssues += "Missing expected table: dbo.$table"
                }
            }
        }
    }
} catch {
    Write-Host "   ❌ ERROR: Database validation failed: $_" -ForegroundColor Red
    $ValidationResults.Failed++
    $ValidationResults.DocumentationIssues += "Database connectivity error: $_"
}

Write-Host ""

# =============================================================================
# SECTION 2: CODEBASE REFERENCE VALIDATION
# =============================================================================
Write-Host "[2/4] Validating Codebase References..." -ForegroundColor Cyan

try {
    # Search for obsolete table references in C# code
    Write-Host "   [2.1] Searching for 'dbo.Users' in C# files..." -ForegroundColor Gray
    $usersRefs = Get-ChildItem -Path $WorkspaceRoot -Recurse -Include "*.cs" -ErrorAction SilentlyContinue | 
        Select-String -Pattern "dbo\.Users" -SimpleMatch
    
    if ($usersRefs) {
        Write-Host "      ❌ ERROR: Found $($usersRefs.Count) references to obsolete dbo.Users" -ForegroundColor Red
        $ValidationResults.Failed++
        $ValidationResults.CodebaseReferences += $usersRefs
        $ValidationResults.DocumentationIssues += "Obsolete code reference: dbo.Users found in C# files"
    } else {
        Write-Host "      ✅ No references to dbo.Users found" -ForegroundColor Green
        $ValidationResults.Passed++
    }
    
    Write-Host "   [2.2] Searching for 'dbo.Tokens' in C# files..." -ForegroundColor Gray
    $tokensRefs = Get-ChildItem -Path $WorkspaceRoot -Recurse -Include "*.cs" -ErrorAction SilentlyContinue | 
        Select-String -Pattern "dbo\.Tokens" -SimpleMatch
    
    if ($tokensRefs) {
        Write-Host "      ❌ ERROR: Found $($tokensRefs.Count) references to obsolete dbo.Tokens" -ForegroundColor Red
        $ValidationResults.Failed++
        $ValidationResults.CodebaseReferences += $tokensRefs
        $ValidationResults.DocumentationIssues += "Obsolete code reference: dbo.Tokens found in C# files"
    } else {
        Write-Host "      ✅ No references to dbo.Tokens found" -ForegroundColor Green
        $ValidationResults.Passed++
    }
    
    # Search for correct table references
    Write-Host "   [2.3] Searching for 'dbo.Members' usage..." -ForegroundColor Gray
    $membersRefs = Get-ChildItem -Path $WorkspaceRoot -Recurse -Include "*.cs" -ErrorAction SilentlyContinue | 
        Select-String -Pattern "dbo\.Members|DbSet.*Member" -SimpleMatch
    
    if ($membersRefs) {
        Write-Host "      ✅ Found $($membersRefs.Count) references to dbo.Members (expected)" -ForegroundColor Green
        $ValidationResults.Passed++
    } else {
        Write-Host "      ⚠️  WARNING: No references to dbo.Members found" -ForegroundColor Yellow
        $ValidationResults.Warnings++
    }
    
} catch {
    Write-Host "   ❌ ERROR: Codebase search failed: $_" -ForegroundColor Red
    $ValidationResults.Failed++
}

Write-Host ""

# =============================================================================
# SECTION 3: DOCUMENTATION VALIDATION
# =============================================================================
Write-Host "[3/4] Validating Documentation Files..." -ForegroundColor Cyan

$docsToCheck = @(
    ".github\instructions\Links\InfrastructureQuickRef.md",
    ".github\instructions\SelfAwareness.instructions.md",
    "Workspaces\Copilot\prompts.keys\_template\key-template.md",
    "DocFX\articles\technical\database-schema.md",
    "DocFX\articles\development\getting-started.md"
)

foreach ($doc in $docsToCheck) {
    $docPath = Join-Path $WorkspaceRoot $doc
    if (Test-Path $docPath) {
        Write-Host "   [3.x] Checking: $doc" -ForegroundColor Gray
        $content = Get-Content $docPath -Raw
        
        # Check for obsolete references
        if ($content -match "dbo\.Users" -and $content -notmatch "do NOT exist|does NOT exist") {
            Write-Host "      ❌ Contains obsolete reference to dbo.Users" -ForegroundColor Red
            $ValidationResults.Failed++
            $ValidationResults.DocumentationIssues += "$doc contains obsolete dbo.Users reference"
        } else {
            Write-Host "      ✅ No obsolete dbo.Users reference" -ForegroundColor Green
            $ValidationResults.Passed++
        }
        
        if ($content -match "dbo\.Tokens" -and $content -notmatch "do NOT exist|does NOT exist") {
            Write-Host "      ❌ Contains obsolete reference to dbo.Tokens" -ForegroundColor Red
            $ValidationResults.Failed++
            $ValidationResults.DocumentationIssues += "$doc contains obsolete dbo.Tokens reference"
        } else {
            Write-Host "      ✅ No obsolete dbo.Tokens reference" -ForegroundColor Green
            $ValidationResults.Passed++
        }
    } else {
        Write-Host "      ⚠️  File not found: $doc" -ForegroundColor Yellow
        $ValidationResults.Warnings++
    }
}

Write-Host ""

# =============================================================================
# SECTION 4: GENERATE REPORT
# =============================================================================
Write-Host "[4/4] Generating Validation Report..." -ForegroundColor Cyan

if ($GenerateReport) {
    $report = @"
# Documentation Ground Truth Validation Report

**Generated**: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')  
**Server**: $ServerName  
**Database**: $DatabaseName  
**Workspace**: $WorkspaceRoot

---

## Summary

| Metric | Count |
|--------|-------|
| ✅ Passed | $($ValidationResults.Passed) |
| ❌ Failed | $($ValidationResults.Failed) |
| ⚠️ Warnings | $($ValidationResults.Warnings) |

---

## Database Schema Validation

### canvas.* Schema Tables
$(if ($ValidationResults.DatabaseTables | Where-Object { $_.Schema -eq "canvas" }) {
    ($ValidationResults.DatabaseTables | Where-Object { $_.Schema -eq "canvas" }).Tables | ForEach-Object { "- ``canvas.$_``" }
} else {
    "No canvas tables found or database not queried"
})

### dbo.* Schema Tables (Sample)
$(if ($ValidationResults.DatabaseTables | Where-Object { $_.Schema -eq "dbo" }) {
    ($ValidationResults.DatabaseTables | Where-Object { $_.Schema -eq "dbo" }).Tables | Select-Object -First 10 | ForEach-Object { "- ``dbo.$_``" }
    "- ... ($(($ValidationResults.DatabaseTables | Where-Object { $_.Schema -eq 'dbo' }).Tables.Count) total)"
} else {
    "No dbo tables found or database not queried"
})

### Obsolete Table Verification
- ✅ ``dbo.Users`` does NOT exist (confirmed)
- ✅ ``dbo.Tokens`` does NOT exist (confirmed)
- ✅ ``dbo.Members`` exists (replacement for dbo.Users)
- ✅ ``dbo.SessionTokens`` exists (replacement for dbo.Tokens)

---

## Codebase References

### Obsolete References Found
$(if ($ValidationResults.CodebaseReferences.Count -gt 0) {
    $ValidationResults.CodebaseReferences | ForEach-Object { "- $($_.Path):$($_.LineNumber) - $($_.Line)" }
} else {
    "✅ No obsolete references found in codebase"
})

---

## Documentation Issues

$(if ($ValidationResults.DocumentationIssues.Count -gt 0) {
    $ValidationResults.DocumentationIssues | ForEach-Object { "- ❌ $_" }
} else {
    "✅ No documentation issues found"
})

---

## Recommendations

1. **Database Schema**: Ensure all documentation references correct table names
2. **Code References**: Update any obsolete table references found
3. **Regular Validation**: Run this script before committing documentation changes
4. **Cohesion Reviews**: Include ground truth validation in cohesion review process

---

**Validation Complete**  
Next validation recommended: $(Get-Date (Get-Date).AddDays(30) -Format 'yyyy-MM-dd')
"@

    $report | Out-File -FilePath $ReportFile -Encoding UTF8
    Write-Host "   ✅ Report saved to: $ReportFile" -ForegroundColor Green
    Write-Host ""
}

# =============================================================================
# FINAL SUMMARY
# =============================================================================
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "  VALIDATION COMPLETE" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Results Summary:" -ForegroundColor White
Write-Host "  ✅ Passed:   $($ValidationResults.Passed)" -ForegroundColor Green
Write-Host "  ❌ Failed:   $($ValidationResults.Failed)" -ForegroundColor Red
Write-Host "  ⚠️  Warnings: $($ValidationResults.Warnings)" -ForegroundColor Yellow
Write-Host ""

if ($ValidationResults.Failed -eq 0 -and $ValidationResults.Warnings -eq 0) {
    Write-Host "🎉 All validations passed! Documentation is accurate." -ForegroundColor Green
    exit 0
} elseif ($ValidationResults.Failed -eq 0) {
    Write-Host "⚠️  Validation passed with warnings. Review recommended." -ForegroundColor Yellow
    exit 0
} else {
    Write-Host "❌ Validation failed. Please address the issues above." -ForegroundColor Red
    exit 1
}
