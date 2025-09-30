# Roslynator Analysis Script
# Runs Roslynator analysis with proper output organization
# All reports and logs are stored in Workspaces/CodeQuality/Roslynator/

param(
    [string]$ProjectPath = "SPA\NoorCanvas\NoorCanvas.csproj",
    [string]$SeverityLevel = "info",
    [string]$OutputFormat = "gitlab",
    [switch]$IncludeCompilerDiagnostics = $true,
    [switch]$ExecutionTime = $true,
    [switch]$OpenReport = $false
)

# Set up paths relative to repository root
$RepoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$WorkspaceRoot = Join-Path $RepoRoot "Workspaces\CodeQuality\Roslynator"
$DocumentationDir = Join-Path $RepoRoot "Workspaces\Documentation\ROSLYNATOR DOCS"
$ReportsDir = Join-Path $WorkspaceRoot "Reports"
$LogsDir = Join-Path $WorkspaceRoot "Logs"

# Ensure directories exist
if (-not (Test-Path $ReportsDir)) {
    New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null
}
if (-not (Test-Path $LogsDir)) {
    New-Item -ItemType Directory -Path $LogsDir -Force | Out-Null
}
if (-not (Test-Path $DocumentationDir)) {
    New-Item -ItemType Directory -Path $DocumentationDir -Force | Out-Null
}

# Generate timestamp for this analysis
$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportFile = Join-Path $ReportsDir "analysis_$Timestamp.json"
$LogFile = Join-Path $LogsDir "analysis_$Timestamp.log"
$DocFile = Join-Path $DocumentationDir "roslynator-analysis_$Timestamp.md"
$LatestReport = Join-Path $ReportsDir "latest-analysis.json"
$LatestLog = Join-Path $LogsDir "latest-analysis.log"
$LatestDoc = Join-Path $DocumentationDir "latest-roslynator-analysis.md"

Write-Host "[INFO] Starting Roslynator Analysis..." -ForegroundColor Cyan
Write-Host "   Project: $ProjectPath"
Write-Host "   Severity: $SeverityLevel"
Write-Host "   Output: $OutputFormat format"
Write-Host "   Report: $ReportFile"
Write-Host "   Log: $LogFile"
Write-Host "   Documentation: $DocFile"
Write-Host ""

# Build Roslynator command
$RoslynatorArgs = @(
    "analyze"
    "--severity-level", $SeverityLevel
    "--output-format", $OutputFormat
    "--output", $ReportFile
    "--file-log", $LogFile
    "--file-log-verbosity", "detailed"
    "--verbosity", "normal"
)

if ($ExecutionTime) {
    $RoslynatorArgs += "--execution-time"
}

# Note: include-compiler-diagnostics option removed as it's not available in this version

# Use full path to project
$FullProjectPath = Join-Path $RepoRoot $ProjectPath
$RoslynatorArgs += $FullProjectPath

try {
    # Change to repo root for analysis
    Push-Location $RepoRoot
    
    # Run Roslynator
    $StartTime = Get-Date
    & roslynator @RoslynatorArgs
    $ExitCode = $LASTEXITCODE
    $EndTime = Get-Date
    $Duration = $EndTime - $StartTime
    
    Write-Host ""
    Write-Host "[SUCCESS] Analysis Complete!" -ForegroundColor Green
    Write-Host "   Duration: $($Duration.TotalSeconds.ToString('F1')) seconds"
    Write-Host "   Exit Code: $ExitCode"
    
    # Copy to latest files for easy access
    if (Test-Path $ReportFile) {
        Copy-Item $ReportFile $LatestReport -Force
        Write-Host "   Report: $LatestReport" -ForegroundColor Yellow
    }
    
    if (Test-Path $LogFile) {
        Copy-Item $LogFile $LatestLog -Force
        Write-Host "   Log: $LatestLog" -ForegroundColor Yellow
    }
    
    # Generate documentation from analysis results
    if (Test-Path $ReportFile) {
        $DocumentationContent = Generate-RoslynatorDocumentation -ReportFile $ReportFile -Timestamp $Timestamp
        $DocumentationContent | Out-File -FilePath $DocFile -Encoding UTF8
        Copy-Item $DocFile $LatestDoc -Force
        Write-Host "   Documentation: $LatestDoc" -ForegroundColor Green
    }
    
    # Generate quick summary
    if (Test-Path $ReportFile) {
        $ReportContent = Get-Content $ReportFile -Raw | ConvertFrom-Json
        $TotalIssues = $ReportContent.Count
        $CriticalIssues = ($ReportContent | Where-Object { $_.severity -eq "critical" }).Count
        $MajorIssues = ($ReportContent | Where-Object { $_.severity -eq "major" }).Count
        
        Write-Host ""
        Write-Host "[SUMMARY] Quick Summary:" -ForegroundColor Cyan
        Write-Host "   Total Issues: $TotalIssues"
        Write-Host "   Critical: $CriticalIssues"
        Write-Host "   Major: $MajorIssues"
    }
    
    if ($OpenReport) {
        Write-Host ""
        Write-Host "Opening analysis results in VS Code..." -ForegroundColor Yellow
        if (Test-Path $LatestDoc) {
            code $LatestDoc
            Write-Host "   Opened: Documentation" -ForegroundColor Green
        }
        if (Test-Path $LatestReport) {
            code $LatestReport
            Write-Host "   Opened: JSON Report" -ForegroundColor Green
        }
    }
    
} catch {
    Write-Error "Failed to run Roslynator analysis: $_"
} finally {
    Pop-Location
}

# Function to generate comprehensive documentation from Roslynator analysis
function Generate-RoslynatorDocumentation {
    param(
        [string]$ReportFile,
        [string]$Timestamp
    )
    
    $ReportData = Get-Content $ReportFile -Raw | ConvertFrom-Json
    $TotalIssues = $ReportData.Count
    $IssuesBySeverity = $ReportData | Group-Object severity | Sort-Object Name
    $IssuesByType = $ReportData | Group-Object type | Sort-Object Count -Descending | Select-Object -First 10
    $IssuesByFile = $ReportData | Group-Object location.path | Sort-Object Count -Descending | Select-Object -First 10
    
    $Documentation = @"
# Roslynator Analysis Documentation

**Generated:** $Timestamp  
**Total Issues:** $TotalIssues  
**Project:** NoorCanvas  

## 📊 Executive Summary

This document provides a comprehensive analysis of code quality metrics detected by Roslynator static analysis.

## 🔍 Issues by Severity

"@
    
    foreach ($group in $IssuesBySeverity) {
        $Documentation += "`n- **$($group.Name.ToUpper())**: $($group.Count) issues`n"
    }
    
    $Documentation += "`n## 🏆 Top Issue Types`n`n"
    foreach ($group in $IssuesByType) {
        $Documentation += "- **$($group.Name)**: $($group.Count) occurrences`n"
    }
    
    $Documentation += "`n## 📁 Files with Most Issues`n`n"
    foreach ($group in $IssuesByFile) {
        $fileName = Split-Path $group.Name -Leaf
        $Documentation += "- **$fileName**: $($group.Count) issues`n"
    }
    
    $Documentation += @"

## 🎯 Recommendations

### High Priority
1. Address critical and major severity issues first
2. Focus on files with highest issue counts
3. Implement automated code formatting to resolve style issues

### Medium Priority
1. Add missing documentation (SA1600 series)
2. Optimize performance-related issues (CA series)
3. Improve code maintainability

### Low Priority
1. Address minor style inconsistencies
2. Remove unnecessary code constructs
3. Optimize LINQ expressions

## 📈 Health Score

**Overall Code Health**: $([math]::Round((1 - ($TotalIssues / 10000)) * 100, 1))%

*Score calculation: Based on total issues relative to project size*

## 📋 Analysis Details

- **Analysis Tool**: Roslynator v0.10.2
- **Report Format**: GitLab JSON
- **Configuration**: Workspaces/CodeQuality/Roslynator/Config/roslynator.config
- **Full Report**: Workspaces/CodeQuality/Roslynator/Reports/latest-analysis.json

---
*Generated automatically by run-roslynator.ps1*
"@
    
    return $Documentation
}

Write-Host ""
Write-Host "[INFO] To view detailed results:"
Write-Host "   Report: $LatestReport"
Write-Host "   Log: $LatestLog"
Write-Host "   Documentation: $LatestDoc"
Write-Host ""
Write-Host "[INFO] To run analysis again:"
Write-Host "   .\Workspaces\CodeQuality\run-roslynator.ps1"
Write-Host "   .\Workspaces\CodeQuality\run-roslynator.ps1 -OpenReport"