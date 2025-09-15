# NOOR Canvas Tracker Validation & Cleanup System
# Validates consistency between tracker files and issue folder locations
# Automatically fixes common issues and ensures clean state before commits

param(
    [switch]$Fix = $false,        # Apply fixes automatically
    [switch]$WhatIf = $false,     # Show what would be fixed without making changes
    [switch]$Verbose = $false     # Show detailed output
)

$ErrorActionPreference = "Stop"

# Define paths
$IssueTrackerRoot = "d:\PROJECTS\NOOR CANVAS\IssueTracker"
$IssueTrackerFile = "$IssueTrackerRoot\NC-ISSUE-TRACKER.MD"
$ImplementationTrackerFile = "d:\PROJECTS\NOOR CANVAS\Workspaces\IMPLEMENTATION-TRACKER.MD"

# Issue folder paths
$Folders = @{
    "NOT STARTED" = "$IssueTrackerRoot\NOT STARTED"
    "IN PROGRESS" = "$IssueTrackerRoot\IN PROGRESS"
    "AWAITING_CONFIRMATION" = "$IssueTrackerRoot\AWAITING_CONFIRMATION"
    "COMPLETED" = "$IssueTrackerRoot\COMPLETED"
}

function Write-Log {
    param($Message, $Color = "White")
    if ($Verbose) {
        Write-Host "[LOG] $Message" -ForegroundColor $Color
    }
}

function Write-Issue {
    param($Message, $Color = "Yellow")
    Write-Host "[ISSUE] $Message" -ForegroundColor $Color
}

function Write-Fix {
    param($Message)
    Write-Host "[FIX] $Message" -ForegroundColor Green
}

function Get-IssueFiles {
    $IssueFiles = @{}
    
    foreach ($status in $Folders.Keys) {
        $folder = $Folders[$status]
        if (Test-Path $folder) {
            $files = Get-ChildItem $folder -Filter "Issue-*.md" | ForEach-Object { 
                @{
                    Name = $_.Name
                    FullPath = $_.FullPath
                    Status = $status
                }
            }
            $IssueFiles[$status] = $files
        } else {
            Write-Issue "Folder not found: $folder"
            $IssueFiles[$status] = @()
        }
    }
    
    return $IssueFiles
}

function Get-TrackerEntries {
    if (-not (Test-Path $IssueTrackerFile)) {
        Write-Issue "Issue tracker file not found: $IssueTrackerFile"
        return @{}
    }
    
    $content = Get-Content $IssueTrackerFile -Raw
    $entries = @{}
    # Line-based parsing to avoid unicode/encoding issues
    $lines = $content -split "\r?\n"
    foreach ($line in $lines) {
        # Pattern: - [icon] **Issue-123** — [Title](PATH)
        if ($line -match '^\s*-\s*(?<icon>[^\s]*)\s*\*\*Issue-(?<num>\d+)\*\*\s*—\s*\[(?<title>[^\]]+)\]\((?<path>[^)]+)\)') {
            $issueNumber = $Matches['num']
            $title = $Matches['title']
            $path = $Matches['path']
            $icon = $Matches['icon'] -replace '\s', ''

            # Derive status from icon, fallback to path folder name
            $status = 'UNKNOWN'
            if ($icon -match '[❌]') { $status = 'NOT STARTED' }
            elseif ($icon -match '[⚡]') { $status = 'IN PROGRESS' }
            elseif ($icon -match '[⏳]') { $status = 'AWAITING_CONFIRMATION' }
            elseif ($icon -match '[✅]') { $status = 'COMPLETED' }

            if ($status -eq 'UNKNOWN') {
                if ($path -match '^(COMPLETED|IN PROGRESS|NOT STARTED|AWAITING_CONFIRMATION)/') {
                    $prefix = $Matches[1]
                    switch ($prefix) {
                        'COMPLETED' { $status = 'COMPLETED' }
                        'IN PROGRESS' { $status = 'IN PROGRESS' }
                        'NOT STARTED' { $status = 'NOT STARTED' }
                        'AWAITING_CONFIRMATION' { $status = 'AWAITING_CONFIRMATION' }
                    }
                }
            }

            $entries["Issue-$issueNumber"] = @{
                Status = $status
                Title = $title
                Path = $path
                Icon = $icon
            }
        }
    }
    
    return $entries
}

function Validate-TrackerConsistency {
    Write-Host "Validating NOOR Canvas Tracker Consistency..." -ForegroundColor Cyan
    
    $issueFiles = Get-IssueFiles
    $trackerEntries = Get-TrackerEntries
    
    $inconsistencies = @()
    $statistics = @{
        "NOT STARTED" = 0
        "IN PROGRESS" = 0
        "AWAITING_CONFIRMATION" = 0
        "COMPLETED" = 0
    }
    
    # Check files that exist but aren't in tracker
    foreach ($status in $issueFiles.Keys) {
        $statistics[$status] = $issueFiles[$status].Count
        
        foreach ($file in $issueFiles[$status]) {
            $fileName = $file.Name -replace '\.md$', ''
            
            if (-not $trackerEntries.ContainsKey($fileName)) {
                $inconsistencies += @{
                    Type = "MissingFromTracker"
                    File = $fileName
                    ActualStatus = $status
                    Message = "File exists in $status but not in tracker"
                }
            } elseif ($trackerEntries[$fileName].Status -ne $status) {
                $inconsistencies += @{
                    Type = "StatusMismatch"
                    File = $fileName
                    ActualStatus = $status
                    TrackerStatus = $trackerEntries[$fileName].Status
                    Message = "Status mismatch: File is in $status but tracker shows $($trackerEntries[$fileName].Status)"
                }
            }
        }
    }
    
    # Check tracker entries that don't have corresponding files
    foreach ($entry in $trackerEntries.Keys) {
        $expectedStatus = $trackerEntries[$entry].Status
        $expectedFolder = $Folders[$expectedStatus]
        $expectedPath = "$expectedFolder\$entry.md"
        
        if (-not (Test-Path $expectedPath)) {
            $inconsistencies += @{
                Type = "MissingFile"
                File = $entry
                TrackerStatus = $expectedStatus
                Message = "Tracker references $entry in $expectedStatus but file doesn't exist"
            }
        }
    }
    
    # Report findings
    Write-Host ""
    Write-Host "Current Statistics:" -ForegroundColor Cyan
    $total = 0
    foreach ($status in $statistics.Keys) {
        $count = $statistics[$status]
        $total += $count
    Write-Host "  ${status}: $count issues"
    }
    Write-Host "  TOTAL: $total issues"
    Write-Host ""
    
    if ($inconsistencies.Count -eq 0) {
        Write-Host "✅ All tracker entries are consistent with file locations!" -ForegroundColor Green
        return $true
    } else {
    Write-Host "Found $($inconsistencies.Count) inconsistencies:" -ForegroundColor Yellow
        Write-Host ""
        
        foreach ($issue in $inconsistencies) {
            Write-Issue $issue.Message
            
            if ($Fix -and -not $WhatIf) {
                try {
                    switch ($issue.Type) {
                        "StatusMismatch" {
                            # Move file to correct folder based on tracker status
                            $currentPath = "$($Folders[$issue.ActualStatus])\$($issue.File).md"
                            $correctPath = "$($Folders[$issue.TrackerStatus])\$($issue.File).md"
                            
                            Move-Item $currentPath $correctPath -Force
                            Write-Fix "Moved $($issue.File) from $($issue.ActualStatus) to $($issue.TrackerStatus)"
                        }
                        "MissingFromTracker" {
                            Write-Issue "Manual intervention needed: Add $($issue.File) to tracker"
                        }
                        "MissingFile" {
                            Write-Issue "Manual intervention needed: Create file for $($issue.File) or remove from tracker"
                        }
                    }
                } catch {
                    Write-Issue "Failed to fix $($issue.File): $($_.Exception.Message)"
                }
            } elseif ($WhatIf) {
                Write-Host "    Would fix: $($issue.Message)" -ForegroundColor Gray
            }
        }
        
        return $false
    }
}

function Update-TrackerStatistics {
    if (-not (Test-Path $IssueTrackerFile)) {
        Write-Issue "Issue tracker file not found: $IssueTrackerFile"
        return
    }
    
    $issueFiles = Get-IssueFiles
    $statistics = @{
        "NOT STARTED" = $issueFiles["NOT STARTED"].Count
        "IN PROGRESS" = $issueFiles["IN PROGRESS"].Count
        "AWAITING_CONFIRMATION" = $issueFiles["AWAITING_CONFIRMATION"].Count
        "COMPLETED" = $issueFiles["COMPLETED"].Count
    }
    
    $total = $statistics.Values | Measure-Object -Sum | Select-Object -ExpandProperty Sum
    
    $content = Get-Content $IssueTrackerFile -Raw
    
    # Update statistics section
    $oldStatsPattern = '- \*\*Total Issues:\*\* \d+\s+- \*\*Not Started:\*\* \d+[^\r\n]*\s+- \*\*In Progress:\*\* \d+[^\r\n]*\s+- \*\*Awaiting Confirmation:\*\* \d+[^\r\n]*\s+- \*\*Completed:\*\* \d+[^\r\n]*'
    
    $newStats = @"
- **Total Issues:** $total
- **Not Started:** $($statistics["NOT STARTED"]) (Phase 4-6 deployment and enhancement issues)
- **In Progress:** $($statistics["IN PROGRESS"]) (Active development work)
- **Awaiting Confirmation:** $($statistics["AWAITING_CONFIRMATION"]) (Fixed, awaiting user verification)
- **Completed:** $($statistics["COMPLETED"]) (Phase 1-3 issues + UX enhancements + critical bug fixes resolved)
"@
    
    if ($content -match $oldStatsPattern) {
        $newContent = $content -replace $oldStatsPattern, $newStats
        
    if ($Fix -and -not $WhatIf) {
            Set-Content $IssueTrackerFile -Value $newContent -Encoding UTF8
            Write-Fix "Updated tracker statistics: $total total issues"
        } elseif ($WhatIf) {
            Write-Host "Would update statistics to: $total total issues" -ForegroundColor Gray
        }
    } else {
        Write-Log "Statistics section pattern not found in tracker" "Yellow"
    }
}

function Clean-ImplementationTracker {
    Write-Host "Checking Implementation Tracker for contradictions..." -ForegroundColor Cyan
    
    if (-not (Test-Path $ImplementationTrackerFile)) {
        Write-Issue "Implementation tracker file not found: $ImplementationTrackerFile"
        return
    }
    
    $content = Get-Content $ImplementationTrackerFile -Raw
    
    # Check for architectural contradictions
    $hasCurrentLanding = $content -match "current landing page"
    $hasDualURL = $content -match "Dual URL System"
    $hasPhaseContradictions = $content -match "Phase 3.*100%.*Complete" -and $content -match "Phase 4.*IN PROGRESS"
    
    if ($hasCurrentLanding -and $hasDualURL) {
        Write-Issue "Implementation Tracker contains contradictory architecture decisions (current landing page vs dual URL system)"
        
        if ($Fix -and -not $WhatIf) {
            Write-Issue "Manual intervention needed: Choose either current landing page OR dual URL system"
        }
    }
    
    if ($hasPhaseContradictions) {
        Write-Issue "Implementation Tracker shows contradictory phase completion status"
        
        if ($Fix -and -not $WhatIf) {
            Write-Issue "Manual intervention needed: Clarify actual phase completion percentages"
        }
    }
}

# Main execution
Write-Host "NOOR Canvas Tracker Validation System" -ForegroundColor Magenta
Write-Host "=========================================" -ForegroundColor Magenta
Write-Host ""

$isConsistent = Validate-TrackerConsistency

if ($Fix -or $WhatIf) {
    Write-Host ""
    Update-TrackerStatistics
    Clean-ImplementationTracker
}

Write-Host ""
if ($isConsistent) {
    Write-Host "All systems clean! Trackers are ready for commit." -ForegroundColor Green
    exit 0
} else {
    if ($Fix) {
    Write-Host "Applied available fixes. Some issues may require manual intervention." -ForegroundColor Yellow
        exit 1
    } else {
    Write-Host "Run with -Fix to apply automatic fixes, or -WhatIf to preview changes." -ForegroundColor Cyan
        exit 1
    }
}
