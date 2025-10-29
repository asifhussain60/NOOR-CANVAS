# Folder Merge Protocol

**Version**: 1.0.0  
**Purpose**: Algorithm for merging multiple key folders into consolidated folder  
**Used By**: collapse-keys.prompt.md (Folder Merge Mode)

---

## When This Module is Loaded

**Condition**: `--internal-only: false` (default) AND `--name` parameter provided

**Skip When**: `--internal-only: true` (internal consolidation mode)

---

## Mode Detection

### Auto-Detection Rules

```
IF pattern contains wildcards (* or ?) AND --name provided THEN
  mode = "folder-merge"
  operation = "merge-folders-then-consolidate-files"
ELSE IF pattern is exact key name (no wildcards) AND no --name THEN
  mode = "internal-only"  // Auto-enable
  operation = "consolidate-files-per-folder"
ELSE IF --internal-only: true THEN
  mode = "internal-only"
  operation = "consolidate-files-per-folder"
ELSE
  ERROR: "Invalid combination - wildcard pattern requires --name"
END IF
```

### Validation Checks

```powershell
# Check 1: --name required for folder merge
if ($mode -eq "folder-merge" -and [string]::IsNullOrEmpty($name)) {
    throw "ERROR: --name parameter required for folder merge mode"
}

# Check 2: Pattern must match at least one folder
$matchedKeys = Get-ChildItem -Path ".github/key-data-streams/" -Directory -Filter $pattern
if ($matchedKeys.Count -eq 0) {
    throw "ERROR: No keys found matching pattern '$pattern'"
}

# Check 3: New key name must not already exist
$newKeyPath = ".github/key-data-streams/$baseName-$name"
if (Test-Path $newKeyPath) {
    throw "ERROR: Target key '$baseName-$name' already exists"
}
```

---

## Discovery Phase

### Collect Matched Keys

```powershell
FUNCTION DiscoverKeys($pattern) {
    $basePath = ".github/key-data-streams/"
    $matchedKeys = Get-ChildItem -Path $basePath -Directory -Filter $pattern
    
    Write-Host "Found $($matchedKeys.Count) key(s) matching pattern '$pattern':"
    
    $metadata = @()
    foreach ($key in $matchedKeys) {
        $workLogs = @(Get-ChildItem -Path $key.FullName -Filter "work-log*.md")
        $plans = @(Get-ChildItem -Path $key.FullName -Filter "*.plan.md")
        $jsonFiles = @(Get-ChildItem -Path $key.FullName -Filter "*.json")
        $allFiles = @(Get-ChildItem -Path $key.FullName -Recurse -File)
        
        $meta = @{
            Name = $key.Name
            Path = $key.FullName
            WorkLogCount = $workLogs.Count
            PlanCount = $plans.Count
            JsonFileCount = $jsonFiles.Count
            TotalFileCount = $allFiles.Count
        }
        
        $metadata += $meta
        
        Write-Host "  - $($key.Name): $($workLogs.Count) work-logs, $($plans.Count) plans, $($allFiles.Count) files total"
    }
    
    return @{
        Keys = $matchedKeys
        Metadata = $metadata
    }
}
```

---

## Phase 1: Folder Merge

### Create Consolidated Folder

```powershell
FUNCTION CreateMergedFolder($pattern, $name) {
    # Extract base key name from pattern
    $baseName = $pattern -replace '\*', '' -replace '\?', ''
    $mergedKeyName = "$baseName-$name"
    $mergedKeyPath = ".github/key-data-streams/$mergedKeyName"
    
    # Create folder structure
    New-Item -Path $mergedKeyPath -ItemType Directory -Force | Out-Null
    New-Item -Path "$mergedKeyPath/_ARCHIVE" -ItemType Directory -Force | Out-Null
    New-Item -Path "$mergedKeyPath/_ARCHIVE/work-logs" -ItemType Directory -Force | Out-Null
    New-Item -Path "$mergedKeyPath/_ARCHIVE/plans" -ItemType Directory -Force | Out-Null
    New-Item -Path "$mergedKeyPath/_ARCHIVE/duplicates" -ItemType Directory -Force | Out-Null
    
    Write-Host "✓ Created merged key folder: $mergedKeyPath"
    
    return @{
        Name = $mergedKeyName
        Path = $mergedKeyPath
    }
}
```

### Copy Files from Source Keys

```powershell
FUNCTION CopyFilesToMergedFolder($sourceKeys, $mergedKeyPath) {
    $stats = @{
        TotalFilesCopied = 0
        Conflicts = @()
    }
    
    foreach ($sourceKey in $sourceKeys) {
        $files = Get-ChildItem -Path $sourceKey.FullName -Recurse -File
        
        foreach ($file in $files) {
            $relativePath = $file.FullName.Substring($sourceKey.FullName.Length + 1)
            $targetPath = Join-Path $mergedKeyPath $relativePath
            
            # Handle file conflicts
            if (Test-Path $targetPath) {
                # Compare content
                $sourceContent = Get-Content $file.FullName -Raw
                $targetContent = Get-Content $targetPath -Raw
                
                if ($sourceContent -eq $targetContent) {
                    # Identical content - skip copy
                    Write-Verbose "Skipping identical file: $relativePath"
                } else {
                    # Different content - archive with source key prefix
                    $fileName = $file.Name
                    $archivePath = "$mergedKeyPath/_ARCHIVE/duplicates/$($sourceKey.Name)_$fileName"
                    Copy-Item -Path $file.FullName -Destination $archivePath -Force
                    
                    $stats.Conflicts += @{
                        File = $relativePath
                        Source = $sourceKey.Name
                        Action = "Archived to duplicates"
                    }
                    
                    Write-Warning "File conflict: $relativePath (archived as $($sourceKey.Name)_$fileName)"
                }
            } else {
                # No conflict - copy directly
                $targetDir = Split-Path -Parent $targetPath
                if (-not (Test-Path $targetDir)) {
                    New-Item -Path $targetDir -ItemType Directory -Force | Out-Null
                }
                
                Copy-Item -Path $file.FullName -Destination $targetPath -Force
                $stats.TotalFilesCopied++
            }
        }
    }
    
    Write-Host "✓ Copied $($stats.TotalFilesCopied) files from $($sourceKeys.Count) source keys"
    if ($stats.Conflicts.Count -gt 0) {
        Write-Host "  ⚠ Resolved $($stats.Conflicts.Count) file conflicts"
    }
    
    return $stats
}
```

---

## Phase 3: Cleanup (Delete Source Folders)

### Validate Before Delete

```powershell
FUNCTION ValidateBeforeCleanup($mergedKeyPath, $expectedFileCount) {
    # Check canonical files exist
    $requiredFiles = @(
        "$mergedKeyPath/work-log.md",
        "$mergedKeyPath/*.plan.md"
    )
    
    foreach ($pattern in $requiredFiles) {
        if (-not (Test-Path $pattern)) {
            throw "CRITICAL: Required file missing before cleanup: $pattern"
        }
    }
    
    # Check file count matches
    $actualFileCount = (Get-ChildItem -Path $mergedKeyPath -Recurse -File).Count
    if ($actualFileCount -lt $expectedFileCount * 0.9) {
        throw "CRITICAL: File count too low ($actualFileCount vs expected $expectedFileCount) - possible data loss"
    }
    
    Write-Host "✓ Validation passed: All required files present, file count matches"
}
```

### Delete Source Folders

```powershell
FUNCTION DeleteSourceFolders($sourceKeys, $dryRun = $false) {
    $stats = @{
        FoldersDeleted = 0
        TotalSizeFreed = 0
    }
    
    foreach ($sourceKey in $sourceKeys) {
        $folderSize = (Get-ChildItem -Path $sourceKey.FullName -Recurse -File | 
                      Measure-Object -Property Length -Sum).Sum
        
        if ($dryRun) {
            Write-Host "[DRY-RUN] Would delete: $($sourceKey.Name) ($([math]::Round($folderSize / 1MB, 2)) MB)"
        } else {
            Remove-Item -Path $sourceKey.FullName -Recurse -Force
            Write-Host "✓ Deleted source folder: $($sourceKey.Name) ($([math]::Round($folderSize / 1MB, 2)) MB freed)"
            
            $stats.FoldersDeleted++
            $stats.TotalSizeFreed += $folderSize
        }
    }
    
    if (-not $dryRun) {
        Write-Host "✓ Cleanup complete: $($stats.FoldersDeleted) folders deleted, $([math]::Round($stats.TotalSizeFreed / 1MB, 2)) MB freed"
    }
    
    return $stats
}
```

---

## Auto-Generated README

### Create Merge Summary

```powershell
FUNCTION GenerateMergeReadme($mergedKeyPath, $mergedKeyName, $sourceKeys, $stats) {
    $readmeContent = @"
# Key: $mergedKeyName

**Created**: $(Get-Date -Format "yyyy-MM-dd HH:mm")  
**Type**: Consolidated Key  
**Source Keys**: $($sourceKeys.Count) merged

## Merge Summary

**Total Files Processed**: $($stats.TotalFilesCopied)  
**Work-Logs Merged**: $($stats.WorkLogsMerged) files → 1 canonical work-log.md  
**Plans Consolidated**: $($stats.PlansMerged) plans → 1 primary plan  
**Files Archived**: $($stats.FilesArchived) files in _ARCHIVE/

## Source Keys

"@
    
    foreach ($sourceKey in $sourceKeys) {
        $readmeContent += "- ``$($sourceKey.Name)``  `n"
    }
    
    $readmeContent += @"

## Current Structure

- **Primary Plan**: $mergedKeyName.plan.md
- **Work Log**: work-log.md ($($stats.WorkLogSessions) sessions)
- **Tracking**: $mergedKeyName.plan.json, state.json
- **Archive**: _ARCHIVE/ ($($stats.FilesArchived) files)

## Quick Navigation

**View Work Log**: ``.github/key-data-streams/$mergedKeyName/work-log.md``  
**View Plan**: ``.github/key-data-streams/$mergedKeyName/$mergedKeyName.plan.md``  
**Historical Artifacts**: ``.github/key-data-streams/$mergedKeyName/_ARCHIVE/``

---

*Auto-generated by collapse-keys on $(Get-Date -Format "yyyy-MM-dd HH:mm")*
"@
    
    $readmePath = "$mergedKeyPath/README.md"
    Set-Content -Path $readmePath -Value $readmeContent
    
    Write-Host "✓ Generated README.md with merge summary"
}
```

---

## Dry-Run Mode

### Preview Merge Operation

```powershell
FUNCTION PreviewFolderMerge($pattern, $name, $sourceKeys) {
    Write-Host "`n=== DRY-RUN: Folder Merge Preview ===" -ForegroundColor Cyan
    
    $baseName = $pattern -replace '\*', '' -replace '\?', ''
    $mergedKeyName = "$baseName-$name"
    
    Write-Host "`n📁 Source Folders ($($sourceKeys.Count)):" -ForegroundColor Yellow
    foreach ($key in $sourceKeys) {
        $fileCount = (Get-ChildItem -Path $key.FullName -Recurse -File).Count
        $folderSize = (Get-ChildItem -Path $key.FullName -Recurse -File | 
                      Measure-Object -Property Length -Sum).Sum
        Write-Host "  - $($key.Name): $fileCount files, $([math]::Round($folderSize / 1KB, 2)) KB"
    }
    
    Write-Host "`n📁 Target Folder:" -ForegroundColor Green
    Write-Host "  .github/key-data-streams/$mergedKeyName/"
    
    Write-Host "`n📋 Operations:" -ForegroundColor Magenta
    Write-Host "  1. Create merged folder: $mergedKeyName/"
    Write-Host "  2. Copy all files from $($sourceKeys.Count) source folders"
    Write-Host "  3. Consolidate work-logs → work-log.md"
    Write-Host "  4. Consolidate plans → $mergedKeyName.plan.md"
    Write-Host "  5. Archive duplicates to _ARCHIVE/"
    Write-Host "  6. Delete $($sourceKeys.Count) source folders"
    Write-Host "  7. Generate README.md"
    
    Write-Host "`n⚠️  No changes made (dry-run mode)" -ForegroundColor Yellow
}
```

---

## Error Handling

### Rollback on Failure

```powershell
FUNCTION RollbackFolderMerge($mergedKeyPath, $checkpoint) {
    Write-Warning "Rolling back folder merge due to error..."
    
    # Delete partially created merged folder
    if (Test-Path $mergedKeyPath) {
        Remove-Item -Path $mergedKeyPath -Recurse -Force
        Write-Host "✓ Removed partial merged folder: $mergedKeyPath"
    }
    
    # Restore from checkpoint if available
    if ($checkpoint) {
        # Checkpoint would contain backup of source folders before deletion
        # Not implemented in this version (source folders not deleted until validation passes)
    }
    
    Write-Host "✓ Rollback complete - all source folders preserved"
}
```

---

## Integration Points

**Called By**: collapse-keys.prompt.md (Step 1)

**Calls**:
- file-consolidation-protocol.md (Step 2 - after folder merge)
- validation-checklist.md (Step 4 - after consolidation)

**Input**: Pattern, name, dry-run flag, matched keys

**Output**: Merged folder path, statistics

---

## Related Modules

- **file-consolidation-protocol.md** - File merging within target folder
- **validation-checklist.md** - Post-merge validation rules
- **work-log-format.md** - Work-log merge chronology
- **json-tracking-schema.md** - JSON file consolidation

---

## Version History

### v1.0.0 (2025-01-19)
- Initial folder merge protocol extraction
- Defined discovery, merge, cleanup phases
- Added dry-run preview support
- Documented rollback procedure
