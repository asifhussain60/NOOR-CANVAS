param(
    [string]$Root = (Resolve-Path ".\").Path
)

$ErrorCount = 0

function Write-Issue($file, $message) {
    Write-Host "::error file=$file::$message"
    $script:ErrorCount++
}

# Collect prompt files (.prompt.md only)
$promptFiles = @()
$promptFiles += Get-ChildItem -Path (Join-Path $Root ".github/prompts") -Recurse -File -Include *.prompt.md 2>$null

foreach ($file in $promptFiles) {
    $content = Get-Content -Raw -Path $file.FullName
    $lines = $content -split "\r?\n"

    # Rule 1: Front matter keys 'mode' and 'description'
    $frontMatterStart = ($lines | Select-String -Pattern '^---\s*$' -SimpleMatch | Select-Object -First 1).LineNumber
    $frontMatterEnd = ($lines | Select-String -Pattern '^---\s*$' -SimpleMatch | Select-Object -Skip 1 -First 1).LineNumber
    if ($frontMatterStart -and $frontMatterEnd -and $frontMatterEnd -gt $frontMatterStart) {
        $frontMatter = $lines[($frontMatterStart) .. ($frontMatterEnd-2)] -join "`n"
        if ($frontMatter -notmatch '(?im)^mode:\s*\S+') {
            Write-Issue $file.FullName "Missing front matter key: mode"
        }
        if ($frontMatter -notmatch '(?im)^description:\s*\S+') {
            Write-Issue $file.FullName "Missing front matter key: description"
        }
    } else {
        Write-Issue $file.FullName "Missing or malformed front matter ('---' delimiters)"
    }

    # Rule 2: Version/Changelog section present (first 250 lines)
    $top = $lines | Select-Object -First 250 -Join "`n"
    if ($top -notmatch '(?im)\*\*Version:\*\*\s*\S+') {
        Write-Issue $file.FullName "Missing Version block near top"
    }
    if ($top -notmatch '(?im)\*\*Changelog:\*\*') {
        Write-Issue $file.FullName "Missing Changelog block near top"
    }

    # Rule 3: Unique primary step headings (### Step N: ...)
    $stepMatches = Select-String -InputObject $content -Pattern '(?m)^###\s+Step\s+(\d+):' | ForEach-Object { $_.Matches } | ForEach-Object { $_.Groups[1].Value }
    if ($stepMatches.Count -gt 0) {
        $dups = $stepMatches | Group-Object | Where-Object { $_.Count -gt 1 } | Select-Object -ExpandProperty Name
        foreach ($d in $dups) {
            Write-Issue $file.FullName "Duplicate primary step heading detected: Step $d"
        }
    }

    # Rule 4: Shared link targets exist (basic path check)
    $sharedLinks = Select-String -InputObject $content -Pattern '(?i)\.github\/prompts\/shared\/[A-Za-z0-9\-\._]+\.md' -AllMatches | ForEach-Object { $_.Matches } | ForEach-Object { $_.Value } | Select-Object -Unique
    foreach ($link in $sharedLinks) {
        $rel = $link -replace '\\', '/'
        $path = Join-Path $Root $rel
        if (-not (Test-Path $path)) {
            Write-Issue $file.FullName "Broken shared link (file not found): $link"
        }
    }
}

if ($ErrorCount -gt 0) {
    Write-Host "Prompt lint found $ErrorCount issue(s)."
    exit 1
} else {
    Write-Host "Prompt lint passed with no issues."
}
