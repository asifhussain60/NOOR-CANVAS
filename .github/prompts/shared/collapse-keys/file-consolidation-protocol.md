# File Consolidation Protocol

**Version**: 1.0.0  
**Purpose**: Algorithm for consolidating work-logs, plans, and JSON files within target folders  
**Used By**: collapse-keys.prompt.md (Both modes - Phase 2)

---

## When This Module is Loaded

**Always Executed**: Both Folder Merge Mode and Internal-Only Mode

**Applies To**:
- **Folder Merge Mode**: Files in newly created merged folder (after Phase 1)
- **Internal-Only Mode**: Files in each matching folder independently

---

## Work-Log Consolidation

### Detection and Merging

```powershell
FUNCTION ConsolidateWorkLogs($targetFolders, $mode) {
    $stats = @{
        TotalProcessed = 0
        TotalMerged = 0
        SessionsMerged = 0
    }
    
    foreach ($folder in $targetFolders) {
        $workLogFiles = @(Get-ChildItem -Path $folder -Filter "work-log*.md" -File)
        $keyName = Split-Path -Leaf $folder
        
        # Skip if already consolidated
        if ($workLogFiles.Count -eq 1 -and $workLogFiles[0].Name -eq "work-log.md") {
            Write-Host "✓ $keyName`: work-log.md already consolidated"
            continue
        }
        
        # Sort chronologically by file creation time (oldest first)
        $workLogFiles = $workLogFiles | Sort-Object CreationTime
        
        # Build merged content
        $mergedContent = "# Work Log: $keyName`n`n"
        
        if ($mode -eq "internal-only") {
            $mergedContent += "**Last Consolidated**: $(Get-Date -Format 'yyyy-MM-dd HH:mm') (Internal-Only Mode)`n`n"
            $mergedContent += "---`n`n"
        }
        
        $sessionCount = 0
        foreach ($logFile in $workLogFiles) {
            $mergedContent += "<!-- Merged from $($logFile.Name) on $(Get-Date -Format 'yyyy-MM-dd') -->`n"
            
            $content = Get-Content $logFile.FullName -Raw
            # Count sessions (## Session: markers)
            $sessions = ([regex]::Matches($content, '## Session:')).Count
            $sessionCount += $sessions
            
            $mergedContent += $content
            $mergedContent += "`n`n---`n`n"
        }
        
        # Write consolidated work-log
        $workLogPath = Join-Path $folder "work-log.md"
        Set-Content -Path $workLogPath -Value $mergedContent -NoNewline
        
        # Archive originals
        foreach ($logFile in $workLogFiles) {
            if ($logFile.Name -ne "work-log.md") {
                $archivePath = Join-Path $folder "_ARCHIVE/work-logs/$($logFile.Name)"
                $archiveDir = Split-Path -Parent $archivePath
                
                if (-not (Test-Path $archiveDir)) {
                    New-Item -Path $archiveDir -ItemType Directory -Force | Out-Null
                }
                
                Copy-Item -Path $logFile.FullName -Destination $archivePath -Force
                Remove-Item -Path $logFile.FullName -Force
            }
        }
        
        $stats.TotalProcessed++
        $stats.TotalMerged += $workLogFiles.Count
        $stats.SessionsMerged += $sessionCount
        
        Write-Host "✓ $keyName`: Consolidated $($workLogFiles.Count) work-log files ($sessionCount sessions)"
    }
    
    return $stats
}
```

### Chronological Ordering Rules

**Sort Priority**:
1. File creation timestamp (oldest → newest)
2. If timestamps identical: Filename alphabetically
3. Preserve internal session chronology within each file

**Merge Markers**:
```markdown
<!-- Merged from work-log_prompt-enhancements.md on 2025-01-19 -->

[Original file content]

---

<!-- Merged from work-log_prompt-port.md on 2025-01-19 -->

[Original file content]

---
```

**See**: `shared/work-log-format.md` for complete format specification

---

## Plan File Consolidation

### Detection and Selection

```powershell
FUNCTION ConsolidatePlans($targetFolders, $mode) {
    $stats = @{
        TotalProcessed = 0
        TotalMerged = 0
    }
    
    foreach ($folder in $targetFolders) {
        $planFiles = @(Get-ChildItem -Path $folder -Filter "*.plan.md" -File | 
                      Where-Object { $_.FullName -notlike "*_ARCHIVE*" })
        $keyName = Split-Path -Leaf $folder
        
        # Skip if already consolidated
        if ($planFiles.Count -eq 1 -and $planFiles[0].Name -eq "$keyName.plan.md") {
            Write-Host "✓ $keyName`: $keyName.plan.md already consolidated"
            continue
        }
        
        # Sort by last write time (newest first for plans)
        $planFiles = $planFiles | Sort-Object LastWriteTime -Descending
        
        # Select most recent as primary
        $primaryPlan = $planFiles[0]
        $primaryContent = Get-Content $primaryPlan.FullName -Raw
        
        # Update key name in content
        $primaryContent = $primaryContent -replace '# Plan: .*', "# Plan: $keyName"
        
        # Add consolidation note if internal-only
        if ($mode -eq "internal-only") {
            $consolidationNote = "`n**Last Consolidated**: $(Get-Date -Format 'yyyy-MM-dd HH:mm') (Internal-Only Mode)`n`n"
            # Insert after first header
            $primaryContent = $primaryContent -replace '(# Plan: [^\n]+\n)', "`$1$consolidationNote"
        }
        
        # Add merged-from section if multiple plans
        if ($planFiles.Count -gt 1) {
            $mergedFromSection = "`n## Merged From`n`n"
            foreach ($plan in $planFiles) {
                $mergedFromSection += "- ``$($plan.Name)`` (last modified: $($plan.LastWriteTime.ToString('yyyy-MM-dd HH:mm')))`n"
            }
            $mergedFromSection += "`n---`n`n"
            
            # Insert before first major section
            $primaryContent = $primaryContent -replace '(##\s+[^M])', "$mergedFromSection`$1"
        }
        
        # Write consolidated plan
        $planPath = Join-Path $folder "$keyName.plan.md"
        Set-Content -Path $planPath -Value $primaryContent -NoNewline
        
        # Archive non-primary plans
        foreach ($plan in $planFiles) {
            if ($plan.FullName -ne $planPath) {
                $archivePath = Join-Path $folder "_ARCHIVE/plans/$($plan.Name)"
                $archiveDir = Split-Path -Parent $archivePath
                
                if (-not (Test-Path $archiveDir)) {
                    New-Item -Path $archiveDir -ItemType Directory -Force | Out-Null
                }
                
                Copy-Item -Path $plan.FullName -Destination $archivePath -Force
                Remove-Item -Path $plan.FullName -Force
            }
        }
        
        $stats.TotalProcessed++
        $stats.TotalMerged += $planFiles.Count
        
        Write-Host "✓ $keyName`: Consolidated $($planFiles.Count) plan files (primary: $($primaryPlan.Name))"
    }
    
    return $stats
}
```

### Selection Criteria

**Primary Plan Selection**:
- Most recent file by `LastWriteTime`
- Highest version number if multiple recent files
- Largest file size as tiebreaker

**Metadata Updates**:
- Key name: Match folder name
- Version: Increment or mark as "merged"
- Add "Merged From" section with source plans

---

## JSON Tracking Consolidation

### plan.json Merging

```powershell
FUNCTION ConsolidatePlanJson($targetFolders) {
    $stats = @{ TotalProcessed = 0 }
    
    foreach ($folder in $targetFolders) {
        $jsonFiles = @(Get-ChildItem -Path $folder -Filter "*.plan.json" -File |
                      Where-Object { $_.FullName -notlike "*_ARCHIVE*" })
        $keyName = Split-Path -Leaf $folder
        
        if ($jsonFiles.Count -eq 0) {
            continue
        }
        
        if ($jsonFiles.Count -eq 1 -and $jsonFiles[0].Name -eq "$keyName.plan.json") {
            Write-Verbose "✓ $keyName`: $keyName.plan.json already consolidated"
            continue
        }
        
        # Merge all JSON files
        $mergedPhases = @()
        $latestTimestamp = [DateTime]::MinValue
        
        foreach ($jsonFile in $jsonFiles) {
            $json = Get-Content $jsonFile.FullName -Raw | ConvertFrom-Json
            
            # Collect phases
            foreach ($phase in $json.phases) {
                $mergedPhases += $phase
            }
            
            # Track latest update
            $updateTime = [DateTime]::Parse($json.updatedAt)
            if ($updateTime -gt $latestTimestamp) {
                $latestTimestamp = $updateTime
            }
        }
        
        # Deduplicate phases by phaseNumber
        $uniquePhases = $mergedPhases | 
            Sort-Object phaseNumber -Unique | 
            Sort-Object phaseNumber
        
        # Create consolidated JSON
        $consolidated = @{
            key = $keyName
            status = if ($uniquePhases | Where-Object { $_.status -eq "in-progress" }) { "in-progress" } 
                    elseif ($uniquePhases | Where-Object { $_.status -eq "completed" }) { "completed" }
                    else { "not-started" }
            createdAt = ($jsonFiles | Sort-Object CreationTime | Select-Object -First 1).CreationTime.ToString("o")
            updatedAt = $latestTimestamp.ToString("o")
            branch = "development"  # Default
            phases = $uniquePhases
        }
        
        # Write consolidated JSON
        $jsonPath = Join-Path $folder "$keyName.plan.json"
        $consolidated | ConvertTo-Json -Depth 10 | Set-Content -Path $jsonPath
        
        # Archive original JSONs
        foreach ($jsonFile in $jsonFiles) {
            if ($jsonFile.Name -ne "$keyName.plan.json") {
                $archivePath = Join-Path $folder "_ARCHIVE/json/$($jsonFile.Name)"
                $archiveDir = Split-Path -Parent $archivePath
                
                if (-not (Test-Path $archiveDir)) {
                    New-Item -Path $archiveDir -ItemType Directory -Force | Out-Null
                }
                
                Copy-Item -Path $jsonFile.FullName -Destination $archivePath -Force
                Remove-Item -Path $jsonFile.FullName -Force
            }
        }
        
        $stats.TotalProcessed++
        Write-Host "✓ $keyName`: Consolidated $($jsonFiles.Count) plan.json files"
    }
    
    return $stats
}
```

### state.json Merging

```powershell
FUNCTION ConsolidateStateJson($targetFolders) {
    foreach ($folder in $targetFolders) {
        $stateFiles = @(Get-ChildItem -Path $folder -Filter "state*.json" -File |
                       Where-Object { $_.FullName -notlike "*_ARCHIVE*" })
        $keyName = Split-Path -Leaf $folder
        
        if ($stateFiles.Count -le 1) {
            continue
        }
        
        # Use most recent state file
        $latestState = $stateFiles | Sort-Object LastWriteTime -Descending | Select-Object -First 1
        $stateContent = Get-Content $latestState.FullName -Raw | ConvertFrom-Json
        
        # Update key name
        $stateContent.key = $keyName
        $stateContent.lastUpdated = (Get-Date).ToString("o")
        $stateContent.lastAgent = "collapse-keys"
        
        # Write consolidated state
        $statePath = Join-Path $folder "state.json"
        $stateContent | ConvertTo-Json -Depth 5 | Set-Content -Path $statePath
        
        # Archive others
        foreach ($stateFile in $stateFiles) {
            if ($stateFile.FullName -ne $statePath) {
                $archivePath = Join-Path $folder "_ARCHIVE/json/$($stateFile.Name)"
                $archiveDir = Split-Path -Parent $archivePath
                
                if (-not (Test-Path $archiveDir)) {
                    New-Item -Path $archiveDir -ItemType Directory -Force | Out-Null
                }
                
                Copy-Item -Path $stateFile.FullName -Destination $archivePath -Force
                Remove-Item -Path $stateFile.FullName -Force
            }
        }
        
        Write-Host "✓ $keyName`: Consolidated $($stateFiles.Count) state.json files"
    }
}
```

**See**: `shared/json-tracking-schema.md` for JSON structure specifications

---

## Duplicate File Handling

### Detection and Archiving

```powershell
FUNCTION HandleDuplicateFiles($targetFolders, $noArchive = $false) {
    $stats = @{ FilesArchived = 0, FilesDeleted = 0 }
    
    foreach ($folder in $targetFolders) {
        # Find all files except canonical ones
        $canonicalFiles = @("work-log.md", "*.plan.md", "*.plan.json", "state.json", "rollback-index.md", "README.md")
        $allFiles = Get-ChildItem -Path $folder -File -Recurse |
                   Where-Object { $_.FullName -notlike "*_ARCHIVE*" }
        
        # Identify duplicates (files not matching canonical patterns)
        $duplicates = $allFiles | Where-Object {
            $name = $_.Name
            -not ($canonicalFiles | Where-Object { $name -like $_ })
        }
        
        foreach ($dup in $duplicates) {
            if ($noArchive) {
                Remove-Item -Path $dup.FullName -Force
                $stats.FilesDeleted++
                Write-Verbose "Deleted duplicate: $($dup.Name)"
            } else {
                $archivePath = Join-Path $folder "_ARCHIVE/duplicates/$($dup.Name)"
                $archiveDir = Split-Path -Parent $archivePath
                
                if (-not (Test-Path $archiveDir)) {
                    New-Item -Path $archiveDir -ItemType Directory -Force | Out-Null
                }
                
                Copy-Item -Path $dup.FullName -Destination $archivePath -Force
                Remove-Item -Path $dup.FullName -Force
                $stats.FilesArchived++
                Write-Verbose "Archived duplicate: $($dup.Name)"
            }
        }
        
        $keyName = Split-Path -Leaf $folder
        if ($stats.FilesArchived -gt 0 -or $stats.FilesDeleted -gt 0) {
            Write-Host "✓ $keyName`: Handled $($stats.FilesArchived + $stats.FilesDeleted) duplicate files"
        }
    }
    
    return $stats
}
```

---

## Rollback Index Consolidation

### Merge Checkpoint History

```powershell
FUNCTION ConsolidateRollbackIndex($targetFolders) {
    foreach ($folder in $targetFolders) {
        $rollbackFiles = @(Get-ChildItem -Path $folder -Filter "rollback*.md" -File |
                          Where-Object { $_.FullName -notlike "*_ARCHIVE*" })
        $keyName = Split-Path -Leaf $folder
        
        if ($rollbackFiles.Count -le 1) {
            continue
        }
        
        # Merge all rollback entries chronologically
        $mergedContent = "# Rollback Index: $keyName`n`n"
        $mergedContent += "| Timestamp | Type | Description | Commit |`n"
        $mergedContent += "|-----------|------|-------------|--------|`n"
        
        $allEntries = @()
        foreach ($rbFile in $rollbackFiles) {
            $content = Get-Content $rbFile.FullName -Raw
            # Extract table rows (skip header)
            $rows = $content -split "`n" | Where-Object { $_ -match '^\|.*\|$' -and $_ -notmatch '^\|-' }
            $allEntries += $rows[1..($rows.Count - 1)]
        }
        
        # Sort chronologically (newest first)
        $sortedEntries = $allEntries | Sort-Object -Descending
        foreach ($entry in $sortedEntries) {
            $mergedContent += "$entry`n"
        }
        
        # Write consolidated rollback index
        $rbPath = Join-Path $folder "rollback-index.md"
        Set-Content -Path $rbPath -Value $mergedContent -NoNewline
        
        # Archive originals
        foreach ($rbFile in $rollbackFiles) {
            if ($rbFile.Name -ne "rollback-index.md") {
                $archivePath = Join-Path $folder "_ARCHIVE/rollback/$($rbFile.Name)"
                $archiveDir = Split-Path -Parent $archivePath
                
                if (-not (Test-Path $archiveDir)) {
                    New-Item -Path $archiveDir -ItemType Directory -Force | Out-Null
                }
                
                Copy-Item -Path $rbFile.FullName -Destination $archivePath -Force
                Remove-Item -Path $rbFile.FullName -Force
            }
        }
        
        Write-Host "✓ $keyName`: Consolidated $($rollbackFiles.Count) rollback-index files"
    }
}
```

---

## Final Structure Enforcement

### Standardize Directory Layout

```powershell
FUNCTION EnforceFinalStructure($targetFolders) {
    foreach ($folder in $targetFolders) {
        $keyName = Split-Path -Leaf $folder
        
        # Ensure canonical files exist
        $requiredFiles = @{
            "work-log.md" = "# Work Log: $keyName`n"
            "$keyName.plan.md" = "# Plan: $keyName`n"
        }
        
        foreach ($file in $requiredFiles.Keys) {
            $filePath = Join-Path $folder $file
            if (-not (Test-Path $filePath)) {
                Set-Content -Path $filePath -Value $requiredFiles[$file]
                Write-Warning "Created missing canonical file: $file"
            }
        }
        
        # Ensure archive directories exist
        $archiveDirs = @("_ARCHIVE/work-logs", "_ARCHIVE/plans", "_ARCHIVE/json", "_ARCHIVE/duplicates", "_ARCHIVE/rollback")
        foreach ($dir in $archiveDirs) {
            $dirPath = Join-Path $folder $dir
            if (-not (Test-Path $dirPath)) {
                New-Item -Path $dirPath -ItemType Directory -Force | Out-Null
            }
        }
        
        # Count root files (should be ≤10)
        $rootFiles = @(Get-ChildItem -Path $folder -File | Where-Object { $_.Name -ne "README.md" })
        if ($rootFiles.Count -gt 10) {
            Write-Warning "$keyName`: Root directory has $($rootFiles.Count) files (recommended ≤10)"
        }
    }
}
```

---

## Statistics Tracking

### Consolidation Summary

```powershell
FUNCTION GenerateConsolidationStats($workLogStats, $planStats, $jsonStats, $duplicateStats) {
    $summary = @{
        TotalFoldersProcessed = $workLogStats.TotalProcessed
        WorkLogsConsolidated = $workLogStats.TotalMerged
        SessionsMerged = $workLogStats.SessionsMerged
        PlansConsolidated = $planStats.TotalMerged
        JsonFilesConsolidated = $jsonStats.TotalProcessed
        FilesArchived = $duplicateStats.FilesArchived
        FilesDeleted = $duplicateStats.FilesDeleted
    }
    
    Write-Host "`n=== Consolidation Summary ===" -ForegroundColor Cyan
    Write-Host "Folders Processed: $($summary.TotalFoldersProcessed)" -ForegroundColor Green
    Write-Host "Work-Logs: $($summary.WorkLogsConsolidated) files → canonical work-log.md" -ForegroundColor Green
    Write-Host "  Sessions Merged: $($summary.SessionsMerged)" -ForegroundColor Gray
    Write-Host "Plans: $($summary.PlansConsolidated) files → {key}.plan.md" -ForegroundColor Green
    Write-Host "JSON Files: $($summary.JsonFilesConsolidated) consolidated" -ForegroundColor Green
    Write-Host "Files Archived: $($summary.FilesArchived)" -ForegroundColor Yellow
    if ($summary.FilesDeleted -gt 0) {
        Write-Host "Files Deleted: $($summary.FilesDeleted)" -ForegroundColor Red
    }
    
    return $summary
}
```

---

## Integration Points

**Called By**: collapse-keys.prompt.md (Step 2)

**Depends On**:
- work-log-format.md (chronological ordering, merge markers)
- json-tracking-schema.md (JSON structure validation)

**Calls**:
- validation-checklist.md (post-consolidation validation)

---

## Related Modules

- **folder-merge-protocol.md** - Phase 1 folder merging
- **validation-checklist.md** - Phase 4 validation rules
- **work-log-format.md** - Work-log entry format
- **json-tracking-schema.md** - JSON structure specifications

---

## Version History

### v1.0.0 (2025-01-19)
- Initial file consolidation protocol extraction
- Work-log, plan, JSON, duplicate handling algorithms
- Rollback index consolidation
- Statistics tracking and reporting
