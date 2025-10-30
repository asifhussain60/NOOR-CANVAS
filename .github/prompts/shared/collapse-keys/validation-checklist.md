# Validation Checklist

**Version**: 1.0.0  
**Purpose**: Post-consolidation validation rules for collapse-keys operations  
**Used By**: collapse-keys.prompt.md (Phase 4)

---

## Overview

This module defines comprehensive validation checks to ensure data integrity after folder merge and file consolidation operations. All checks must pass before declaring success.

---

## Folder Merge Mode Validation

### Required Checks

```powershell
FUNCTION ValidateFolderMerge($mergedKeyPath, $sourceKeys, $stats) {
    $issues = @()
    $keyName = Split-Path -Leaf $mergedKeyPath
    
    Write-Host "`n=== Validating Folder Merge: $keyName ===" -ForegroundColor Cyan
    
    # Check 1: Canonical work-log.md exists
    $workLogPath = Join-Path $mergedKeyPath "work-log.md"
    if (-not (Test-Path $workLogPath)) {
        $issues += "CRITICAL: work-log.md missing"
    } else {
        Write-Host "✓ work-log.md exists" -ForegroundColor Green
    }
    
    # Check 2: No work-log variants in root
    $workLogVariants = @(Get-ChildItem -Path $mergedKeyPath -Filter "work-log_*.md" -File)
    if ($workLogVariants.Count -gt 0) {
        $issues += "ERROR: Found $($workLogVariants.Count) work-log_*.md variants (should be archived)"
    } else {
        Write-Host "✓ No work-log_*.md variants in root" -ForegroundColor Green
    }
    
    # Check 3: Primary plan exists
    $planPath = Join-Path $mergedKeyPath "$keyName.plan.md"
    if (-not (Test-Path $planPath)) {
        $issues += "CRITICAL: $keyName.plan.md missing"
    } else {
        Write-Host "✓ $keyName.plan.md exists" -ForegroundColor Green
    }
    
    # Check 4: All historical work-logs archived
    $archiveWorkLogs = @(Get-ChildItem -Path "$mergedKeyPath/_ARCHIVE/work-logs" -Filter "*.md" -File -ErrorAction SilentlyContinue)
    $expectedArchiveCount = $stats.WorkLogsConsolidated - 1  # -1 for canonical
    if ($archiveWorkLogs.Count -ne $expectedArchiveCount) {
        $issues += "WARNING: Expected $expectedArchiveCount archived work-logs, found $($archiveWorkLogs.Count)"
    } else {
        Write-Host "✓ All historical work-logs archived ($($archiveWorkLogs.Count) files)" -ForegroundColor Green
    }
    
    # Check 5: Root directory file count (≤10 recommended)
    $rootFiles = @(Get-ChildItem -Path $mergedKeyPath -File)
    if ($rootFiles.Count -gt 10) {
        $issues += "WARNING: Root has $($rootFiles.Count) files (recommended ≤10)"
    } else {
        Write-Host "✓ Root directory clean ($($rootFiles.Count) files)" -ForegroundColor Green
    }
    
    # Check 6: No duplicate content in work-log
    $workLogContent = Get-Content $workLogPath -Raw
    $sessions = [regex]::Matches($workLogContent, '## Session:')
    $uniqueSessions = ($workLogContent -split '## Session:' | Select-Object -Skip 1 | Select-Object -Unique).Count
    if ($sessions.Count -ne $uniqueSessions) {
        $issues += "WARNING: Possible duplicate sessions in work-log.md"
    } else {
        Write-Host "✓ No duplicate sessions detected ($($sessions.Count) unique)" -ForegroundColor Green
    }
    
    # Check 7: All source folders deleted
    $remainingSourceFolders = @()
    foreach ($sourceKey in $sourceKeys) {
        if (Test-Path $sourceKey.FullName) {
            $remainingSourceFolders += $sourceKey.Name
        }
    }
    if ($remainingSourceFolders.Count -gt 0) {
        $issues += "CRITICAL: Source folders not deleted: $($remainingSourceFolders -join ', ')"
    } else {
        Write-Host "✓ All source folders deleted ($($sourceKeys.Count) folders)" -ForegroundColor Green
    }
    
    # Check 8: README.md generated
    $readmePath = Join-Path $mergedKeyPath "README.md"
    if (-not (Test-Path $readmePath)) {
        $issues += "WARNING: README.md not created"
    } else {
        Write-Host "✓ README.md generated" -ForegroundColor Green
    }
    
    # Check 9: File count matches (no data loss)
    $totalSourceFiles = 0
    foreach ($sourceKey in $sourceKeys) {
        # Can't check after deletion, rely on stats
        $totalSourceFiles += $sourceKey.Metadata.TotalFileCount
    }
    $mergedFiles = @(Get-ChildItem -Path $mergedKeyPath -Recurse -File).Count
    # Allow for consolidation (multiple files → one)
    if ($mergedFiles -lt ($totalSourceFiles * 0.5)) {
        $issues += "CRITICAL: Merged file count too low ($mergedFiles vs ~$totalSourceFiles expected)"
    } else {
        Write-Host "✓ File count reasonable ($mergedFiles files)" -ForegroundColor Green
    }
    
    return $issues
}
```

---

## Internal-Only Mode Validation

### Per-Folder Checks

```powershell
FUNCTION ValidateInternalConsolidation($targetFolders, $stats) {
    $allIssues = @{}
    
    Write-Host "`n=== Validating Internal Consolidation ===" -ForegroundColor Cyan
    
    foreach ($folder in $targetFolders) {
        $keyName = Split-Path -Leaf $folder
        $issues = @()
        
        Write-Host "`n--- Folder: $keyName ---" -ForegroundColor Yellow
        
        # Check 1: work-log.md exists
        $workLogPath = Join-Path $folder "work-log.md"
        if (-not (Test-Path $workLogPath)) {
            $issues += "work-log.md missing"
        } else {
            Write-Host "✓ work-log.md exists" -ForegroundColor Green
        }
        
        # Check 2: No work-log variants in root
        $workLogVariants = @(Get-ChildItem -Path $folder -Filter "work-log_*.md" -File)
        if ($workLogVariants.Count -gt 0) {
            $issues += "Found $($workLogVariants.Count) work-log_*.md variants"
        } else {
            Write-Host "✓ No work-log_*.md variants" -ForegroundColor Green
        }
        
        # Check 3: {key}.plan.md exists (if plans were present)
        $planPath = Join-Path $folder "$keyName.plan.md"
        $anyPlans = @(Get-ChildItem -Path $folder -Filter "*.plan.md" -File -ErrorAction SilentlyContinue).Count -gt 0
        $archivedPlans = @(Get-ChildItem -Path "$folder/_ARCHIVE/plans" -Filter "*.plan.md" -File -ErrorAction SilentlyContinue).Count -gt 0
        
        if ($anyPlans -or $archivedPlans) {
            if (-not (Test-Path $planPath)) {
                $issues += "$keyName.plan.md missing"
            } else {
                Write-Host "✓ $keyName.plan.md exists" -ForegroundColor Green
            }
        }
        
        # Check 4: Root directory clean (≤10 files)
        $rootFiles = @(Get-ChildItem -Path $folder -File)
        if ($rootFiles.Count -gt 10) {
            $issues += "Root has $($rootFiles.Count) files (recommended ≤10)"
        } else {
            Write-Host "✓ Root directory clean ($($rootFiles.Count) files)" -ForegroundColor Green
        }
        
        # Check 5: All folders intact (no deletion)
        if (-not (Test-Path $folder)) {
            $issues += "CRITICAL: Folder deleted unexpectedly"
        } else {
            Write-Host "✓ Folder intact (internal-only preserved)" -ForegroundColor Green
        }
        
        # Check 6: README.md updated
        $readmePath = Join-Path $folder "README.md"
        if (Test-Path $readmePath) {
            $readmeContent = Get-Content $readmePath -Raw
            if ($readmeContent -match 'Last Consolidated') {
                Write-Host "✓ README.md updated with consolidation note" -ForegroundColor Green
            } else {
                $issues += "README.md exists but not updated"
            }
        }
        
        if ($issues.Count -gt 0) {
            $allIssues[$keyName] = $issues
        }
    }
    
    return $allIssues
}
```

---

## Content Validation

### Work-Log Integrity

```powershell
FUNCTION ValidateWorkLogIntegrity($workLogPath) {
    $issues = @()
    
    if (-not (Test-Path $workLogPath)) {
        return @("File not found")
    }
    
    $content = Get-Content $workLogPath -Raw
    
    # Check 1: Has header
    if ($content -notmatch '^# Work Log:') {
        $issues += "Missing work-log header"
    }
    
    # Check 2: Sessions are properly formatted
    $sessionMatches = [regex]::Matches($content, '## Session: (\d{4}-\d{2}-\d{2} \d{2}:\d{2})')
    if ($sessionMatches.Count -eq 0) {
        $issues += "No properly formatted session entries"
    }
    
    # Check 3: Merge markers present (if consolidated)
    $mergeMarkers = [regex]::Matches($content, '<!-- Merged from .* on \d{4}-\d{2}-\d{2} -->')
    if ($mergeMarkers.Count -gt 0) {
        # Has merge markers - verify chronology
        $timestamps = $sessionMatches | ForEach-Object { [DateTime]::Parse($_.Groups[1].Value) }
        $sorted = $timestamps | Sort-Object
        
        $chronological = $true
        for ($i = 0; $i -lt $timestamps.Count - 1; $i++) {
            if ($timestamps[$i] -gt $timestamps[$i + 1]) {
                $chronological = $false
                break
            }
        }
        
        if (-not $chronological) {
            $issues += "Sessions not in chronological order"
        }
    }
    
    # Check 4: Proper separators
    $separators = [regex]::Matches($content, '^\-\-\-$', [Text.RegularExpressions.RegexOptions]::Multiline)
    if ($separators.Count -lt ($sessionMatches.Count - 1)) {
        $issues += "Missing session separators"
    }
    
    return $issues
}
```

### Plan File Integrity

```powershell
FUNCTION ValidatePlanIntegrity($planPath, $expectedKeyName) {
    $issues = @()
    
    if (-not (Test-Path $planPath)) {
        return @("File not found")
    }
    
    $content = Get-Content $planPath -Raw
    
    # Check 1: Header matches key name
    if ($content -notmatch "^# Plan: $expectedKeyName") {
        $issues += "Plan header doesn't match key name"
    }
    
    # Check 2: Has phases (if multi-phase plan)
    if ($content -match '## Phase \d+:' -or $content -match '### Phase \d+') {
        # Has phases - verify numbering
        $phaseMatches = [regex]::Matches($content, '##\s+Phase (\d+):')
        $phaseNumbers = $phaseMatches | ForEach-Object { [int]$_.Groups[1].Value }
        
        for ($i = 0; $i -lt $phaseNumbers.Count - 1; $i++) {
            if ($phaseNumbers[$i + 1] -ne ($phaseNumbers[$i] + 1)) {
                $issues += "Phase numbering gap detected"
                break
            }
        }
    }
    
    # Check 3: Merged-from section present (if consolidated)
    if ($content -match '<!-- Merged from .* -->') {
        if ($content -notmatch '## Merged From') {
            $issues += "Has merge markers but no 'Merged From' section"
        }
    }
    
    return $issues
}
```

### JSON Schema Validation

```powershell
FUNCTION ValidateJsonIntegrity($jsonPath, $expectedKeyName) {
    $issues = @()
    
    if (-not (Test-Path $jsonPath)) {
        return @()  # JSON files optional
    }
    
    try {
        $json = Get-Content $jsonPath -Raw | ConvertFrom-Json
        
        # Check 1: Key matches
        if ($json.key -ne $expectedKeyName) {
            $issues += "JSON key '$($json.key)' doesn't match expected '$expectedKeyName'"
        }
        
        # Check 2: Has required fields
        $requiredFields = @('key', 'status', 'createdAt', 'updatedAt')
        foreach ($field in $requiredFields) {
            if (-not $json.PSObject.Properties[$field]) {
                $issues += "Missing required field: $field"
            }
        }
        
        # Check 3: Status is valid
        $validStatuses = @('not-started', 'in-progress', 'completed')
        if ($json.status -notin $validStatuses) {
            $issues += "Invalid status: $($json.status)"
        }
        
        # Check 4: Phases are sequential (if present)
        if ($json.phases) {
            $phaseNumbers = $json.phases | ForEach-Object { $_.phaseNumber }
            for ($i = 0; $i -lt $phaseNumbers.Count - 1; $i++) {
                if ($phaseNumbers[$i + 1] -ne ($phaseNumbers[$i] + 1)) {
                    $issues += "Phase numbering gap in JSON"
                    break
                }
            }
        }
        
    } catch {
        $issues += "JSON parse error: $($_.Exception.Message)"
    }
    
    return $issues
}
```

---

## Archive Validation

### Verify Archiving Completeness

```powershell
FUNCTION ValidateArchiveStructure($targetFolder) {
    $issues = @()
    $keyName = Split-Path -Leaf $targetFolder
    
    # Check archive directories exist
    $requiredArchiveDirs = @(
        "_ARCHIVE/work-logs",
        "_ARCHIVE/plans"
    )
    
    foreach ($dir in $requiredArchiveDirs) {
        $dirPath = Join-Path $targetFolder $dir
        $files = @(Get-ChildItem -Path $dirPath -File -ErrorAction SilentlyContinue)
        
        if ($files.Count -gt 0) {
            # Archive dir exists and has files - verify structure
            if (-not (Test-Path $dirPath)) {
                $issues += "Archive directory missing: $dir"
            }
        }
    }
    
    # Check no archived files in root
    $rootArchivedFiles = @(Get-ChildItem -Path $targetFolder -File |
                          Where-Object { $_.Name -match '_archive|_old|_backup' })
    
    if ($rootArchivedFiles.Count -gt 0) {
        $issues += "Found $($rootArchivedFiles.Count) archive-like files in root (should be in _ARCHIVE/)"
    }
    
    return $issues
}
```

---

## Summary Report

### Generate Validation Report

```powershell
FUNCTION GenerateValidationReport($folderMergeIssues, $internalIssues, $mode) {
    Write-Host "`n=== Validation Report ===" -ForegroundColor Cyan
    
    $criticalCount = 0
    $errorCount = 0
    $warningCount = 0
    
    if ($mode -eq "folder-merge") {
        foreach ($issue in $folderMergeIssues) {
            if ($issue -match '^CRITICAL:') {
                Write-Host "  🔴 $issue" -ForegroundColor Red
                $criticalCount++
            } elseif ($issue -match '^ERROR:') {
                Write-Host "  🟠 $issue" -ForegroundColor Yellow
                $errorCount++
            } else {
                Write-Host "  🟡 $issue" -ForegroundColor DarkYellow
                $warningCount++
            }
        }
    } else {
        foreach ($keyName in $internalIssues.Keys) {
            Write-Host "`n--- $keyName ---" -ForegroundColor Yellow
            foreach ($issue in $internalIssues[$keyName]) {
                if ($issue -match '^CRITICAL:') {
                    Write-Host "  🔴 $issue" -ForegroundColor Red
                    $criticalCount++
                } elseif ($issue -match '^ERROR:') {
                    Write-Host "  🟠 $issue" -ForegroundColor Yellow
                    $errorCount++
                } else {
                    Write-Host "  🟡 $issue" -ForegroundColor DarkYellow
                    $warningCount++
                }
            }
        }
    }
    
    Write-Host "`n--- Summary ---" -ForegroundColor Cyan
    Write-Host "Critical Issues: $criticalCount" -ForegroundColor $(if ($criticalCount -gt 0) { 'Red' } else { 'Green' })
    Write-Host "Errors: $errorCount" -ForegroundColor $(if ($errorCount -gt 0) { 'Yellow' } else { 'Green' })
    Write-Host "Warnings: $warningCount" -ForegroundColor $(if ($warningCount -gt 0) { 'DarkYellow' } else { 'Green' })
    
    $passed = ($criticalCount -eq 0 -and $errorCount -eq 0)
    
    if ($passed) {
        Write-Host "`n✅ VALIDATION PASSED" -ForegroundColor Green
    } else {
        Write-Host "`n❌ VALIDATION FAILED" -ForegroundColor Red
        throw "Validation failed with $criticalCount critical issues and $errorCount errors"
    }
    
    return @{
        Passed = $passed
        CriticalCount = $criticalCount
        ErrorCount = $errorCount
        WarningCount = $warningCount
    }
}
```

---

## Integration Points

**Called By**: collapse-keys.prompt.md (Phase 4)

**Depends On**:
- work-log-format.md (session format validation)
- json-tracking-schema.md (JSON structure validation)

**Output**: Validation report with pass/fail status

---

## Related Modules

- **folder-merge-protocol.md** - Folder merging operations to validate
- **file-consolidation-protocol.md** - File operations to validate
- **.github/key-data-streams/README.md** - KDS schema requirements

---

## Version History

### v1.0.0 (2025-01-19)
- Initial validation checklist extraction
- Folder merge and internal-only validation rules
- Content integrity checks (work-log, plan, JSON)
- Archive structure validation
- Summary report generation
