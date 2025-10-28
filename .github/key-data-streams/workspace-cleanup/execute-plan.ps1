#!/usr/bin/env pwsh
# Workspace Cleanup Execution Script
# Generated from workspace-cleanup plan v1.0
# Created: 2025-10-26

[CmdletBinding()]
param(
    [Parameter(HelpMessage="Cleanup mode: default, aggressive, or custom")]
    [ValidateSet("default", "aggressive", "custom")]
    [string]$Mode = "default",
    
    [Parameter(HelpMessage="Perform dry run without deleting files")]
    [switch]$DryRun,
    
    [Parameter(HelpMessage="Skip questionnaire and use defaults")]
    [switch]$UseDefaults,
    
    [Parameter(HelpMessage="Create backup before cleanup")]
    [switch]$CreateBackup,
    
    [Parameter(HelpMessage="Skip confirmation prompts")]
    [switch]$Force
)

$ErrorActionPreference = "Stop"
$WorkspaceRoot = "d:\PROJECTS\NOOR CANVAS"
$CleanupReportPath = "$WorkspaceRoot\Workspaces\Maintenance"
$Timestamp = Get-Date -Format "yyyy-MM-dd-HHmmss"

# Ensure Maintenance folder exists
New-Item -ItemType Directory -Path $CleanupReportPath -Force | Out-Null

# Color scheme
$Colors = @{
    Header = "Cyan"
    Success = "Green"
    Warning = "Yellow"
    Error = "Red"
    Info = "White"
}

function Write-Header {
    param([string]$Message)
    Write-Host "`n$('=' * 80)" -ForegroundColor $Colors.Header
    Write-Host $Message -ForegroundColor $Colors.Header
    Write-Host $('=' * 80) -ForegroundColor $Colors.Header
}

function Write-Phase {
    param([string]$Message)
    Write-Host "`n>>> $Message" -ForegroundColor $Colors.Info
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor $Colors.Success
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor $Colors.Warning
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor $Colors.Error
}

# Configuration
$CleanupConfig = @{
    default = @{
        PreserveLogDays = 7
        PreserveTestResults = $true
        PreserveLastRun = $true
        DeleteDemoFiles = $false
        ArchiveCompletedPlans = $true
        DocumentationReorg = $true
    }
    aggressive = @{
        PreserveLogDays = 0
        PreserveTestResults = $false
        PreserveLastRun = $false
        DeleteDemoFiles = $true
        ArchiveCompletedPlans = $true
        DocumentationReorg = $true
    }
}

# Load questionnaire answers if not using defaults
function Read-QuestionnaireAnswers {
    $questionnairePath = "$WorkspaceRoot\.github\key-data-streams\workspace-cleanup\questionnaire.md"
    
    if (-not (Test-Path $questionnairePath)) {
        Write-Warning "Questionnaire not found. Using default settings."
        return $null
    }
    
    $content = Get-Content $questionnairePath -Raw
    $answers = @{}
    
    # Parse questionnaire answers (looking for [X] marks)
    if ($content -match '\[X\].*?A\..*?Default Mode') {
        $answers.Mode = 'default'
    } elseif ($content -match '\[X\].*?B\..*?Aggressive Mode') {
        $answers.Mode = 'aggressive'
    }
    
    if ($content -match 'Q2.*?\[X\].*?A\..*?Preserve Last Run') {
        $answers.PreserveLastRun = $true
    } elseif ($content -match 'Q2.*?\[X\].*?B\..*?Delete All') {
        $answers.PreserveLastRun = $false
    }
    
    # Add more parsing for other questions
    
    return $answers
}

# Phase 1: Analysis and Inventory
function Invoke-AnalysisPhase {
    Write-Header "Phase 1: Analysis and Inventory"
    
    $inventory = @{
        BuildArtifacts = @()
        TestResults = @()
        TempFiles = @()
        LogFiles = @()
        DocsToReorganize = @()
        TotalSize = 0
    }
    
    Write-Phase "Scanning for build artifacts..."
    $binObjDirs = Get-ChildItem -Path $WorkspaceRoot -Include bin,obj,.vs -Recurse -Directory -ErrorAction SilentlyContinue
    foreach ($dir in $binObjDirs) {
        if ($dir.FullName -notmatch '\\node_modules\\|\\packages\\') {
            $size = (Get-ChildItem $dir.FullName -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
            $inventory.BuildArtifacts += @{
                Path = $dir.FullName
                Size = $size
            }
            $inventory.TotalSize += $size
        }
    }
    Write-Success "Found $($inventory.BuildArtifacts.Count) build artifact directories"
    
    Write-Phase "Scanning for test results..."
    $testDirs = Get-ChildItem -Path $WorkspaceRoot -Include "test-results","playwright-report" -Recurse -Directory -ErrorAction SilentlyContinue
    foreach ($dir in $testDirs) {
        $size = (Get-ChildItem $dir.FullName -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
        $inventory.TestResults += @{
            Path = $dir.FullName
            Size = $size
        }
        $inventory.TotalSize += $size
    }
    Write-Success "Found $($inventory.TestResults.Count) test result directories"
    
    Write-Phase "Scanning for temporary files..."
    $tempPatterns = @("*.tmp", "*.temp", "*.bak", "*.backup", "Thumbs.db", ".DS_Store")
    foreach ($pattern in $tempPatterns) {
        $tempFiles = Get-ChildItem -Path $WorkspaceRoot -Filter $pattern -Recurse -File -ErrorAction SilentlyContinue
        foreach ($file in $tempFiles) {
            $inventory.TempFiles += @{
                Path = $file.FullName
                Size = $file.Length
            }
            $inventory.TotalSize += $file.Length
        }
    }
    Write-Success "Found $($inventory.TempFiles.Count) temporary files"
    
    Write-Phase "Scanning for log files..."
    $logFiles = Get-ChildItem -Path $WorkspaceRoot -Filter "*.log" -Recurse -File -ErrorAction SilentlyContinue
    $cutoffDate = (Get-Date).AddDays(-$CleanupConfig[$Mode].PreserveLogDays)
    foreach ($log in $logFiles) {
        if ($log.LastWriteTime -lt $cutoffDate) {
            $inventory.LogFiles += @{
                Path = $log.FullName
                Size = $log.Length
                Age = ((Get-Date) - $log.LastWriteTime).Days
            }
            $inventory.TotalSize += $log.Length
        }
    }
    Write-Success "Found $($inventory.LogFiles.Count) old log files"
    
    Write-Phase "Scanning for documentation files..."
    $docsToMove = @()
    # Find MD files not in proper locations
    $mdFiles = Get-ChildItem -Path $WorkspaceRoot -Filter "*.md" -Recurse -File -ErrorAction SilentlyContinue
    foreach ($md in $mdFiles) {
        $relativePath = $md.FullName.Replace($WorkspaceRoot, "").TrimStart('\')
        
        # Skip properly located files
        if ($relativePath -match '^Workspaces\\Documentation\\' -or
            $relativePath -match '^\.github\\key-data-streams\\.*\\.*\.md$' -or
            $relativePath -match '^README\.md$' -or
            $relativePath -match '^CHANGELOG\.md$' -or
            $relativePath -match '^node_modules\\' -or
            $relativePath -match '^packages\\') {
            continue
        }
        
        # Categorize for reorganization
        $category = "General"
        if ($md.Name -match 'implementation|summary') { $category = "Implementation" }
        elseif ($md.Name -match 'architecture|diagram|overview') { $category = "Architecture" }
        elseif ($md.Name -match 'config|setup|install') { $category = "Configuration" }
        elseif ($md.Name -match 'quick|reference|cheat') { $category = "QuickReference" }
        elseif ($md.Name -match 'tool|utility|script') { $category = "Tools" }
        
        $docsToMove += @{
            Source = $md.FullName
            Category = $category
            RelativePath = $relativePath
        }
    }
    $inventory.DocsToReorganize = $docsToMove
    Write-Success "Found $($docsToMove.Count) documentation files to reorganize"
    
    # Generate report
    $sizeInMB = [math]::Round($inventory.TotalSize / 1MB, 2)
    Write-Header "Analysis Complete"
    Write-Host "Total items to clean: $($inventory.BuildArtifacts.Count + $inventory.TestResults.Count + $inventory.TempFiles.Count + $inventory.LogFiles.Count)"
    Write-Host "Space to reclaim: $sizeInMB MB"
    Write-Host "Documentation files to reorganize: $($inventory.DocsToReorganize.Count)"
    
    # Save detailed report
    $reportPath = "$CleanupReportPath\cleanup-report-$Timestamp.md"
    $report = @"
# Workspace Cleanup Report
**Generated**: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
**Mode**: $Mode
**Dry Run**: $DryRun

## Summary
- **Total Space to Reclaim**: $sizeInMB MB
- **Build Artifacts**: $($inventory.BuildArtifacts.Count) directories
- **Test Results**: $($inventory.TestResults.Count) directories
- **Temporary Files**: $($inventory.TempFiles.Count) files
- **Old Log Files**: $($inventory.LogFiles.Count) files (>$($CleanupConfig[$Mode].PreserveLogDays) days)
- **Documentation to Reorganize**: $($inventory.DocsToReorganize.Count) files

## Build Artifacts
$($inventory.BuildArtifacts | ForEach-Object { "- $($_.Path) ($([math]::Round($_.Size / 1MB, 2)) MB)" } | Out-String)

## Test Results
$($inventory.TestResults | ForEach-Object { "- $($_.Path) ($([math]::Round($_.Size / 1MB, 2)) MB)" } | Out-String)

## Documentation Files to Reorganize
$($inventory.DocsToReorganize | ForEach-Object { "- [$($_.Category)] $($_.RelativePath)" } | Out-String)

## Actions Taken
"@
    
    $report | Out-File -FilePath $reportPath -Encoding UTF8
    Write-Success "Detailed report saved to: $reportPath"
    
    return $inventory
}

# Phase 2: Safe Cleanup
function Invoke-SafeCleanup {
    param([hashtable]$Inventory)
    
    Write-Header "Phase 2: Safe Cleanup"
    
    $deletedCount = 0
    $freedSpace = 0
    
    # Clean build artifacts
    Write-Phase "Cleaning build artifacts..."
    foreach ($artifact in $Inventory.BuildArtifacts) {
        if ($DryRun) {
            Write-Host "  [DRY RUN] Would delete: $($artifact.Path)"
        } else {
            try {
                Remove-Item -Path $artifact.Path -Recurse -Force -ErrorAction Stop
                $deletedCount++
                $freedSpace += $artifact.Size
                Write-Host "  Deleted: $($artifact.Path)"
            } catch {
                Write-Warning "Failed to delete: $($artifact.Path) - $_"
            }
        }
    }
    
    # Clean test results
    if (-not $CleanupConfig[$Mode].PreserveTestResults) {
        Write-Phase "Cleaning test results..."
        foreach ($testDir in $Inventory.TestResults) {
            if ($CleanupConfig[$Mode].PreserveLastRun -and $testDir.Path -match '\.last-run\.json$') {
                Write-Host "  Preserving: $($testDir.Path)"
                continue
            }
            
            if ($DryRun) {
                Write-Host "  [DRY RUN] Would delete: $($testDir.Path)"
            } else {
                try {
                    Remove-Item -Path $testDir.Path -Recurse -Force -ErrorAction Stop
                    $deletedCount++
                    $freedSpace += $testDir.Size
                    Write-Host "  Deleted: $($testDir.Path)"
                } catch {
                    Write-Warning "Failed to delete: $($testDir.Path) - $_"
                }
            }
        }
    }
    
    # Clean temporary files
    Write-Phase "Cleaning temporary files..."
    foreach ($temp in $Inventory.TempFiles) {
        if ($DryRun) {
            Write-Host "  [DRY RUN] Would delete: $($temp.Path)"
        } else {
            try {
                Remove-Item -Path $temp.Path -Force -ErrorAction Stop
                $deletedCount++
                $freedSpace += $temp.Size
                Write-Host "  Deleted: $($temp.Path)"
            } catch {
                Write-Warning "Failed to delete: $($temp.Path) - $_"
            }
        }
    }
    
    # Clean old logs
    Write-Phase "Cleaning old log files..."
    foreach ($log in $Inventory.LogFiles) {
        if ($DryRun) {
            Write-Host "  [DRY RUN] Would delete: $($log.Path) ($(log.Age) days old)"
        } else {
            try {
                Remove-Item -Path $log.Path -Force -ErrorAction Stop
                $deletedCount++
                $freedSpace += $log.Size
                Write-Host "  Deleted: $($log.Path)"
            } catch {
                Write-Warning "Failed to delete: $($log.Path) - $_"
            }
        }
    }
    
    $freedMB = [math]::Round($freedSpace / 1MB, 2)
    Write-Success "Deleted $deletedCount items, freed $freedMB MB"
}

# Phase 3: Documentation Organization
function Invoke-DocumentationReorganization {
    param([array]$DocsToMove)
    
    if (-not $CleanupConfig[$Mode].DocumentationReorg) {
        Write-Warning "Documentation reorganization skipped (disabled in mode: $Mode)"
        return
    }
    
    Write-Header "Phase 3: Documentation Organization"
    
    $docBase = "$WorkspaceRoot\Workspaces\Documentation"
    $categories = @("Implementation", "Architecture", "Configuration", "QuickReference", "Tools", "General")
    
    # Create directory structure
    foreach ($category in $categories) {
        $categoryPath = "$docBase\$category"
        if (-not (Test-Path $categoryPath)) {
            if ($DryRun) {
                Write-Host "  [DRY RUN] Would create: $categoryPath"
            } else {
                New-Item -ItemType Directory -Path $categoryPath -Force | Out-Null
                Write-Success "Created: $categoryPath"
            }
        }
    }
    
    $movedCount = 0
    foreach ($doc in $DocsToMove) {
        $destination = "$docBase\$($doc.Category)\$(Split-Path -Leaf $doc.Source)"
        
        if ($DryRun) {
            Write-Host "  [DRY RUN] Would move: $($doc.Source) -> $destination"
        } else {
            try {
                Move-Item -Path $doc.Source -Destination $destination -Force
                $movedCount++
                Write-Host "  Moved: $(Split-Path -Leaf $doc.Source) -> $($doc.Category)/"
            } catch {
                Write-Warning "Failed to move: $($doc.Source) - $_"
            }
        }
    }
    
    Write-Success "Reorganized $movedCount documentation files"
}

# Phase 4: .github Cleanup
function Invoke-GithubCleanup {
    Write-Header "Phase 4: .github Folder Cleanup"
    
    $githubPath = "$WorkspaceRoot\.github\key-data-streams"
    $archivePath = "$WorkspaceRoot\Workspaces\Archive\CompletedPlans"
    
    if (-not (Test-Path $archivePath)) {
        if ($DryRun) {
            Write-Host "  [DRY RUN] Would create: $archivePath"
        } else {
            New-Item -ItemType Directory -Path $archivePath -Force | Out-Null
        }
    }
    
    # Find completed plans (those with status: completed in plan.json)
    $completedPlans = @()
    Get-ChildItem -Path $githubPath -Directory | ForEach-Object {
        $planJsonPath = Join-Path $_.FullName "$($_.Name).plan.json"
        if (Test-Path $planJsonPath) {
            $planJson = Get-Content $planJsonPath -Raw | ConvertFrom-Json
            if ($planJson.status -eq "completed") {
                $completedPlans += $_.FullName
            }
        }
    }
    
    if ($completedPlans.Count -gt 0 -and $CleanupConfig[$Mode].ArchiveCompletedPlans) {
        Write-Phase "Archiving $($completedPlans.Count) completed plans..."
        foreach ($plan in $completedPlans) {
            $planName = Split-Path -Leaf $plan
            $archiveDest = Join-Path $archivePath $planName
            
            if ($DryRun) {
                Write-Host "  [DRY RUN] Would archive: $planName"
            } else {
                Move-Item -Path $plan -Destination $archiveDest -Force
                Write-Success "Archived: $planName"
            }
        }
    }
}

# Phase 6: Validation
function Invoke-Validation {
    Write-Header "Phase 6: Validation"
    
    Write-Phase "Running build test..."
    Push-Location $WorkspaceRoot
    try {
        if ($DryRun) {
            Write-Host "  [DRY RUN] Would run: dotnet build"
        } else {
            $buildResult = dotnet build --verbosity quiet 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Build test passed"
            } else {
                Write-Error "Build test failed"
                Write-Host $buildResult
            }
        }
    } finally {
        Pop-Location
    }
    
    Write-Phase "Checking git status..."
    $gitStatus = git status --short
    if ($gitStatus) {
        Write-Warning "Git working directory has changes"
    } else {
        Write-Success "Git working directory clean"
    }
}

# Main execution
try {
    Write-Header "Noor Canvas Workspace Cleanup v1.0"
    Write-Host "Mode: $Mode"
    Write-Host "Dry Run: $DryRun"
    Write-Host ""
    
    if (-not $UseDefaults) {
        $answers = Read-QuestionnaireAnswers
        if ($answers -and $answers.Mode) {
            $Mode = $answers.Mode
            Write-Host "Using questionnaire answers (Mode: $Mode)"
        }
    }
    
    if (-not $Force -and -not $DryRun) {
        Write-Warning "This will permanently delete files. Press Ctrl+C to cancel, or"
        Read-Host "Press Enter to continue"
    }
    
    # Execute phases
    $inventory = Invoke-AnalysisPhase
    
    if (-not $DryRun -or ($DryRun -and (Read-Host "`nProceed with cleanup? (y/n)") -eq 'y')) {
        Invoke-SafeCleanup -Inventory $inventory
        Invoke-DocumentationReorganization -DocsToMove $inventory.DocsToReorganize
        Invoke-GithubCleanup
        Invoke-Validation
    }
    
    Write-Header "Cleanup Complete!"
    Write-Host "`nReport saved to: $CleanupReportPath\cleanup-report-$Timestamp.md"
    
} catch {
    Write-Error "Cleanup failed: $_"
    Write-Host $_.ScriptStackTrace
    exit 1
}
