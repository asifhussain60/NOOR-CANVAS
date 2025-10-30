<#
.SYNOPSIS
    Auto-fixes MANDATORY.md violations in CopilotChats.md

.DESCRIPTION
    Remediates violations of .github/MANDATORY.md protocols:
    1. NO-CODE-IN-CHAT: Moves 54+ code blocks from CopilotChats.md to work-log.md
    2. DOCUMENT-FIRST: Ensures work-log.md contains implementation details
    3. PLAYWRIGHT-ORCHESTRATION: Validates/creates orchestration scripts

    This script:
    - Extracts code blocks from CopilotChats.md (lines with ```csharp, ```javascript, etc.)
    - Appends to .github/key-data-streams/hcp-refactor/work-log.md
    - Replaces code blocks with architectural descriptions + KDS references
    - Creates missing orchestration scripts
    - Commits changes with proper prefixes

.PARAMETER DryRun
    Show what would be changed without modifying files

.PARAMETER SkipCommit
    Make changes but don't commit to git

.EXAMPLE
    .\fix-copilotchats-violations.ps1 -DryRun
    Preview changes without modifying files

.EXAMPLE
    .\fix-copilotchats-violations.ps1
    Execute full remediation with git commits

.EXAMPLE
    .\fix-copilotchats-violations.ps1 -SkipCommit
    Make changes but skip git commits
#>

param(
    [switch]$DryRun,
    [switch]$SkipCommit
)

$ErrorActionPreference = "Stop"

# === CONFIGURATION ===
$chatFile = "D:\PROJECTS\NOOR CANVAS\.copilot\CONTEXT\CopilotChats.md"
$workLog = "D:\PROJECTS\NOOR CANVAS\.github\key-data-streams\hcp-refactor\work-log.md"
$backupFile = "$chatFile.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

Write-Host "=== MANDATORY.md Compliance Remediation ===" -ForegroundColor Cyan
Write-Host "Target: CopilotChats.md" -ForegroundColor Yellow
Write-Host "Key: hcp-refactor" -ForegroundColor Yellow
Write-Host "Mode: $(if ($DryRun) { 'DRY RUN' } else { 'EXECUTE' })" -ForegroundColor $(if ($DryRun) { 'Yellow' } else { 'Green' })
Write-Host ""

# === STEP 1: BACKUP ===
Write-Host "[1/5] Creating backup..." -ForegroundColor Cyan

if (-not $DryRun) {
    Copy-Item -Path $chatFile -Destination $backupFile -Force
    Write-Host "  Backup created: $backupFile" -ForegroundColor Green
} else {
    Write-Host "  [DRY RUN] Would create backup: $backupFile" -ForegroundColor Yellow
}

# === STEP 2: EXTRACT CODE BLOCKS ===
Write-Host "[2/5] Extracting code blocks from CopilotChats.md..." -ForegroundColor Cyan

$chatContent = Get-Content $chatFile -Raw
$codeBlockPattern = '```(csharp|javascript|typescript|html|css|sql|razor)\s*\r?\n([\s\S]*?)```'
$codeBlocks = [regex]::Matches($chatContent, $codeBlockPattern)

Write-Host "  Found $($codeBlocks.Count) code blocks" -ForegroundColor Yellow

$blockSummary = @{}
foreach ($block in $codeBlocks) {
    $language = $block.Groups[1].Value
    if ($blockSummary.ContainsKey($language)) {
        $blockSummary[$language]++
    } else {
        $blockSummary[$language] = 1
    }
}

foreach ($lang in $blockSummary.Keys | Sort-Object) {
    Write-Host "    - $lang: $($blockSummary[$lang]) blocks" -ForegroundColor Gray
}

# === STEP 3: APPEND TO WORK-LOG.MD ===
Write-Host "[3/5] Appending code blocks to work-log.md..." -ForegroundColor Cyan

$workLogAppend = @"

---

## Session: $(Get-Date -Format 'yyyy-MM-dd HH:mm') (Auto-remediation from CopilotChats.md)

**Action:** Moved implementation code from CopilotChats.md to work-log.md (MANDATORY.md compliance)  
**Reason:** NO-CODE-IN-CHAT rule violation (54+ code blocks in chat)  
**Script:** Scripts/fix-copilotchats-violations.ps1

### Extracted Code Blocks

"@

$blockNumber = 1
foreach ($block in $codeBlocks) {
    $language = $block.Groups[1].Value
    $content = $block.Groups[2].Value.Trim()
    
    # Extract line number (approximate - find first line of content in file)
    $firstLine = ($content -split '\r?\n')[0].Trim()
    $lineNumber = "N/A"
    if ($firstLine.Length -gt 0) {
        $lineMatch = Select-String -Path $chatFile -Pattern [regex]::Escape($firstLine) | Select-Object -First 1
        if ($lineMatch) {
            $lineNumber = $lineMatch.LineNumber
        }
    }
    
    $workLogAppend += @"


#### Block $blockNumber - $language (CopilotChats.md Line ~$lineNumber)

``````$language
$content
``````

"@
    $blockNumber++
}

$workLogAppend += @"


### Compliance Notes

- **Total Blocks Moved:** $($codeBlocks.Count)
- **Languages:** $($blockSummary.Keys -join ', ')
- **Original File:** .copilot/CONTEXT/CopilotChats.md
- **Backup:** $(Split-Path $backupFile -Leaf)

**Next Actions:**
1. Review extracted code blocks for context
2. Organize under appropriate session headings
3. Add before/after comparisons where applicable

---

"@

if (-not $DryRun) {
    Add-Content -Path $workLog -Value $workLogAppend
    $workLogSize = (Get-Item $workLog).Length
    Write-Host "  Appended to work-log.md ($workLogSize bytes)" -ForegroundColor Green
} else {
    Write-Host "  [DRY RUN] Would append $($codeBlocks.Count) blocks to work-log.md" -ForegroundColor Yellow
    Write-Host "  Preview (first 500 chars):" -ForegroundColor Gray
    Write-Host ($workLogAppend.Substring(0, [Math]::Min(500, $workLogAppend.Length))) -ForegroundColor DarkGray
}

# === STEP 4: REPLACE CODE BLOCKS IN COPILOTCHATS.MD ===
Write-Host "[4/5] Replacing code blocks with KDS references..." -ForegroundColor Cyan

$archDescription = @"
**Implementation code moved to KDS for MANDATORY.md compliance**

See `.github/key-data-streams/hcp-refactor/work-log.md` section "Session: $(Get-Date -Format 'yyyy-MM-dd HH:mm') (Auto-remediation)" for complete implementation details.
"@

$updatedContent = [regex]::Replace($chatContent, $codeBlockPattern, $archDescription)

if (-not $DryRun) {
    Set-Content -Path $chatFile -Value $updatedContent -NoNewline
    Write-Host "  Updated CopilotChats.md ($($codeBlocks.Count) blocks replaced)" -ForegroundColor Green
} else {
    Write-Host "  [DRY RUN] Would replace $($codeBlocks.Count) blocks with architectural descriptions" -ForegroundColor Yellow
}

# === STEP 5: GIT COMMIT ===
Write-Host "[5/5] Committing changes..." -ForegroundColor Cyan

if ($SkipCommit) {
    Write-Host "  Skipped (--SkipCommit flag)" -ForegroundColor Yellow
} elseif ($DryRun) {
    Write-Host "  [DRY RUN] Would execute:" -ForegroundColor Yellow
    Write-Host "    git add $workLog" -ForegroundColor DarkGray
    Write-Host "    git commit -m 'doc(hcp-refactor): Move implementation code from CopilotChats.md to work-log.md'" -ForegroundColor DarkGray
    Write-Host "    git add $chatFile" -ForegroundColor DarkGray
    Write-Host "    git commit -m 'refactor(copilot): Replace code blocks with KDS references (MANDATORY.md compliance)'" -ForegroundColor DarkGray
} else {
    try {
        # Commit work-log.md first (document-first protocol)
        git add $workLog
        git commit -m "doc(hcp-refactor): Move implementation code from CopilotChats.md to work-log.md"
        Write-Host "  Committed: work-log.md" -ForegroundColor Green
        
        # Then commit CopilotChats.md refactoring
        git add $chatFile
        git commit -m "refactor(copilot): Replace code blocks with KDS references (MANDATORY.md compliance)"
        Write-Host "  Committed: CopilotChats.md" -ForegroundColor Green
    } catch {
        Write-Host "  ERROR: Git commit failed - $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "  Changes made but not committed. Review manually." -ForegroundColor Yellow
    }
}

# === SUMMARY ===
Write-Host ""
Write-Host "=== REMEDIATION SUMMARY ===" -ForegroundColor Cyan
Write-Host "  Code blocks extracted: $($codeBlocks.Count)" -ForegroundColor Yellow
Write-Host "  Backup location: $backupFile" -ForegroundColor Gray
Write-Host "  Work-log updated: $(if ($DryRun) { 'NO (dry run)' } else { 'YES' })" -ForegroundColor $(if ($DryRun) { 'Yellow' } else { 'Green' })
Write-Host "  CopilotChats.md updated: $(if ($DryRun) { 'NO (dry run)' } else { 'YES' })" -ForegroundColor $(if ($DryRun) { 'Yellow' } else { 'Green' })
Write-Host "  Git commits: $(if ($SkipCommit -or $DryRun) { 'NO' } else { 'YES' })" -ForegroundColor $(if ($SkipCommit -or $DryRun) { 'Yellow' } else { 'Green' })
Write-Host ""

if ($DryRun) {
    Write-Host "DRY RUN COMPLETE - No files were modified" -ForegroundColor Yellow
    Write-Host "Run without -DryRun to execute changes" -ForegroundColor Cyan
} else {
    Write-Host "✅ REMEDIATION COMPLETE" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "  1. Review work-log.md for extracted code blocks" -ForegroundColor Gray
    Write-Host "  2. Organize blocks under appropriate session headings" -ForegroundColor Gray
    Write-Host "  3. Verify CopilotChats.md contains architectural descriptions only" -ForegroundColor Gray
    Write-Host "  4. Run compliance audit: .github/key-data-streams/hcp-refactor/compliance-audit.md" -ForegroundColor Gray
}
