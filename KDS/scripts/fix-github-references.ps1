# KDS .github Reference Fixer
# Version: 2.0
# Purpose: Recursively find and fix all .github references in KDS folder until none remain

param(
    [switch]$DryRun,
    [switch]$Verbose,
    [string]$GitCommit,
    [int]$MaxIterations = 10
)

$ErrorActionPreference = "Stop"

# Colors for output
function Write-FixHeader { Write-Host "`n=== $args ===" -ForegroundColor Cyan }
function Write-FixSuccess { Write-Host "✅ $args" -ForegroundColor Green }
function Write-FixFailure { Write-Host "❌ $args" -ForegroundColor Red }
function Write-FixWarning { Write-Host "⚠️ $args" -ForegroundColor Yellow }
function Write-FixInfo { Write-Host "ℹ️  $args" -ForegroundColor Blue }

# Track results
$script:Results = @{
    Iterations = 0
    TotalReferencesFound = 0
    TotalReferencesFixed = 0
    FilesModified = @()
    StartTime = Get-Date
}

# Find all .github references
function Find-GitHubReferences {
    Write-FixHeader "Scanning for .github References"
    
    $kdsPath = "D:\PROJECTS\NOOR CANVAS\KDS"
    
    $results = Get-ChildItem -Path $kdsPath -Recurse -File | 
        Select-String -Pattern "\.github" -CaseSensitive:$false |
        Select-Object Path, LineNumber, Line
    
    if ($results) {
        Write-FixWarning "Found $($results.Count) references to .github"
        
        if ($Verbose) {
            $results | ForEach-Object {
                Write-Host "  $($_.Path):$($_.LineNumber) - $($_.Line.Trim())"
            }
        }
    } else {
        Write-FixSuccess "No .github references found!"
    }
    
    return $results
}

# Fix references in a file
function Repair-FileReferences {
    param(
        [string]$FilePath
    )
    
    Write-FixInfo "Processing: $(Split-Path $FilePath -Leaf)"
    
    $content = Get-Content -Path $FilePath -Raw
    $originalContent = $content
    $replacementCount = 0
    
    # Define replacement patterns (most specific first)
    $patterns = @(
        @{ From = '\.\\\KDS\\prompts\\user\\kds\.md'; To = 'KDS\prompts\user\kds.md' }
        @{ From = '\KDS\\prompts\\user\\kds\.md'; To = 'KDS\prompts\user\kds.md' }
        @{ From = '\KDS/prompts/user/kds\.md'; To = 'KDS/prompts/user/kds.md' }
        
        @{ From = '\.\\\KDS\\scripts\\run-kds-comprehensive-test\.ps1'; To = 'KDS\tests\run-comprehensive-test.ps1' }
        @{ From = '\KDS\\scripts\\run-kds-comprehensive-test\.ps1'; To = 'KDS\tests\run-comprehensive-test.ps1' }
        @{ From = '\KDS/scripts/run-kds-comprehensive-test\.ps1'; To = 'KDS/tests/run-comprehensive-test.ps1' }
        
        @{ From = '\.\\\KDS\\scripts\\brain-reset\.ps1'; To = 'KDS\scripts\brain-reset.ps1' }
        @{ From = '\KDS\\scripts\\brain-reset\.ps1'; To = 'KDS\scripts\brain-reset.ps1' }
        @{ From = '\KDS/scripts/brain-reset\.ps1'; To = 'KDS/scripts/brain-reset.ps1' }
        
        @{ From = '\.\\\KDS\\kds-brain\\events\.jsonl'; To = 'KDS\kds-brain\events.jsonl' }
        @{ From = '\KDS\\kds-brain\\events\.jsonl'; To = 'KDS\kds-brain\events.jsonl' }
        @{ From = '\KDS/kds-brain/events\.jsonl'; To = 'KDS/kds-brain/events.jsonl' }
        
        @{ From = '\.\\\KDS\\kds-brain\\knowledge-graph\.yaml'; To = 'KDS\kds-brain\knowledge-graph.yaml' }
        @{ From = '\KDS\\kds-brain\\knowledge-graph\.yaml'; To = 'KDS\kds-brain\knowledge-graph.yaml' }
        @{ From = '\KDS/kds-brain/knowledge-graph\.yaml'; To = 'KDS/kds-brain/knowledge-graph.yaml' }
        
        @{ From = '\.\\\KDS\\kds-brain'; To = 'KDS\kds-brain' }
        @{ From = '\KDS\\kds-brain'; To = 'KDS\kds-brain' }
        @{ From = '\KDS/kds-brain'; To = 'KDS/kds-brain' }
        
        @{ From = '\.\\\KDS\\prompts'; To = 'KDS\prompts' }
        @{ From = '\KDS\\prompts'; To = 'KDS\prompts' }
        @{ From = '\KDS/prompts'; To = 'KDS/prompts' }
        
        @{ From = '\.\\\KDS\\scripts'; To = 'KDS\scripts' }
        @{ From = '\KDS\\scripts'; To = 'KDS\scripts' }
        @{ From = '\KDS/scripts'; To = 'KDS/scripts' }
        
        # Generic patterns (last resort)
        @{ From = '\.\\\KDS\\'; To = 'KDS\' }
        @{ From = '\KDS\\'; To = 'KDS\' }
        @{ From = '\.\\\KDS/'; To = 'KDS/' }
        @{ From = '\KDS/'; To = 'KDS/' }
    )
    
    # Apply replacements
    foreach ($pattern in $patterns) {
        $foundMatches = [regex]::Matches($content, $pattern.From)
        
        if ($foundMatches.Count -gt 0) {
            if ($Verbose) {
                Write-FixInfo "  Replacing '$($pattern.From)' -> '$($pattern.To)' ($($foundMatches.Count) occurrences)"
            }
            
            $content = $content -replace $pattern.From, $pattern.To
            $replacementCount += $foundMatches.Count
        }
    }
    
    # Check if content changed
    if ($content -ne $originalContent) {
        if (-not $DryRun) {
            Set-Content -Path $FilePath -Value $content -NoNewline
            Write-FixSuccess "  Fixed $replacementCount references"
        } else {
            Write-FixWarning "  [DRY RUN] Would fix $replacementCount references"
        }
        
        $script:Results.TotalReferencesFixed += $replacementCount
        if ($script:Results.FilesModified -notcontains $FilePath) {
            $script:Results.FilesModified += $FilePath
        }
        
        return $true
    } else {
        if ($Verbose) {
            Write-FixInfo "  No changes needed"
        }
        return $false
    }
}

# Generate fix report
function New-FixReport {
    Write-FixHeader "Fix Report"
    
    $endTime = Get-Date
    $duration = $endTime - $script:Results.StartTime
    
    $report = @"
# KDS .github Reference Fix Report

**Generated:** $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')  
**Duration:** $($duration.ToString('hh\:mm\:ss'))  
**Status:** $(if ($script:Results.TotalReferencesFound -eq 0) { "✅ CLEAN" } else { "⚠️ REFERENCES FOUND" })  
**Mode:** $(if ($DryRun) { "DRY RUN" } else { "LIVE" })

---

## Summary

| Metric | Value |
|--------|-------|
| **Iterations** | $($script:Results.Iterations) |
| **Total References Found** | $($script:Results.TotalReferencesFound) |
| **References Fixed** | $($script:Results.TotalReferencesFixed) |
| **Files Modified** | $($script:Results.FilesModified.Count) |

---

## Files Modified

$(if ($script:Results.FilesModified.Count -gt 0) {
    $script:Results.FilesModified | ForEach-Object { 
        $relativePath = $_ -replace [regex]::Escape("D:\PROJECTS\NOOR CANVAS\"), ""
        "- ``$relativePath``" 
    } | Out-String
} else {
    "✅ No files modified"
})

---

## Next Steps

$(if ($script:Results.TotalReferencesFound -eq 0) {
    @"
✅ All .github references have been fixed!

**Recommendations:**
1. Commit the changes to git
2. Run KDS self-test to verify functionality
3. Update documentation with new paths
4. Create git tag for this milestone

**Git Commands:**
``````powershell
git add KDS/
git commit -m "fix: Update all .github references to KDS/ structure"
git tag -a kds-migration-complete -m "Completed migration from .github to KDS"
``````
"@
} else {
    @"
⚠️ Some references may still exist. Action required:

**Immediate Actions:**
1. Review remaining references manually
2. Check if patterns need to be added to the script
3. Re-run this script with -Verbose for details

**Manual Check:**
``````powershell
Get-ChildItem -Path "D:\PROJECTS\NOOR CANVAS\KDS" -Recurse -File | 
    Select-String -Pattern "\.github" -CaseSensitive:`$false
``````
"@
})

---

**Script Version:** 2.0  
**KDS Version:** 5.0 (SOLID + BRAIN)  
**Workspace:** D:\PROJECTS\NOOR CANVAS
"@
    
    # Save report
    $reportPath = "D:\PROJECTS\NOOR CANVAS\KDS\tests\reports\fix-github-refs-$(Get-Date -Format 'yyyy-MM-dd-HHmmss').md"
    $reportDir = Split-Path $reportPath -Parent
    
    if (-not (Test-Path $reportDir)) {
        New-Item -ItemType Directory -Path $reportDir -Force | Out-Null
    }
    
    Set-Content -Path $reportPath -Value $report
    Write-FixSuccess "Report saved: $reportPath"
    
    # Display summary
    Write-Host "`n" -NoNewline
    Write-Host "=" * 80
    Write-Host $report
    Write-Host "=" * 80
    
    return $reportPath
}

# Main execution loop
function Start-FixLoop {
    Write-FixHeader "KDS .github Reference Fixer v2.0"
    
    if ($DryRun) {
        Write-FixWarning "DRY RUN MODE - No files will be modified"
    }
    
    $iteration = 0
    $allFixed = $false
    
    while ($iteration -lt $MaxIterations -and -not $allFixed) {
        $iteration++
        $script:Results.Iterations = $iteration
        
        Write-FixHeader "Iteration $iteration of $MaxIterations"
        
        # Step 1: Find references
        $references = Find-GitHubReferences
        
        if ($references) {
            $script:Results.TotalReferencesFound = $references.Count
        } else {
            $script:Results.TotalReferencesFound = 0
        }
        
        if (-not $references) {
            Write-FixSuccess "No .github references found!"
            $allFixed = $true
            break
        }
        
        # Step 2: Group by file and fix
        $fileGroups = $references | Group-Object -Property Path
        
        foreach ($group in $fileGroups) {
            $filePath = $group.Name
            $refCount = $group.Count
            
            Write-FixInfo "File: $(Split-Path $filePath -Leaf) - $refCount references"
            
            # Fix references
            Repair-FileReferences -FilePath $filePath
        }
        
        # Step 3: Check if all fixed
        $remainingRefs = Find-GitHubReferences
        
        if (-not $remainingRefs) {
            Write-FixSuccess "All references fixed in iteration $iteration!"
            $allFixed = $true
        } else {
            Write-FixWarning "Still have $($remainingRefs.Count) references after iteration $iteration"
            
            if ($iteration -ge $MaxIterations) {
                Write-FixFailure "Max iterations reached. Some references may need manual fixing."
            }
        }
    }
    
    # Step 4: Generate report
    $reportPath = New-FixReport
    
    # Final status
    if ($allFixed) {
        Write-FixSuccess "`n✅ SUCCESS: All .github references fixed!"
        Write-FixInfo "Report: $reportPath"
        return 0
    } else {
        Write-FixFailure "`n❌ FAILURE: Some references could not be fixed automatically"
        Write-FixInfo "Report: $reportPath"
        return 2
    }
}

# Execute
try {
    $exitCode = Start-FixLoop
    exit $exitCode
} catch {
    Write-FixFailure "Fatal error: $_"
    Write-Host $_.ScriptStackTrace
    exit 99
}
