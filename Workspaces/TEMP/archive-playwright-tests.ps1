# Safe archival script for PlayWright tests
# Usage: .\archive-playwright-tests.ps1

$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$archiveRoot = Join-Path $PSScriptRoot "PlayWright-archived\$timestamp"
New-Item -ItemType Directory -Force -Path $archiveRoot | Out-Null

$keepers = @(
    'PlayWright/tests/user-registration-multi-instance.spec.ts',
    'PlayWright/tests/participant-sync-signalr-test.spec.ts',
    'PlayWright/tests/complete-user-experience.spec.ts'
)

Write-Host "Archive root: $archiveRoot"

# Move tracked files with git mv to preserve history
$tracked = git ls-files 'PlayWright/tests/*.spec.ts' 2>$null
if ($tracked) {
    $tracked | ForEach-Object {
        $file = $_.Trim()
        if ($keepers -notcontains $file) {
            $dest = Join-Path $archiveRoot (Split-Path $file -Leaf)
            Write-Host "git mv $file -> $dest"
            git mv $file $dest
        }
    }
} else {
    Write-Host "No tracked PlayWright spec files found."
}

# Move any remaining spec files (untracked) under PlayWright/tests
Get-ChildItem -Path 'PlayWright\tests' -Filter '*.spec.ts' -Recurse | ForEach-Object {
    $full = $_.FullName.Substring((Get-Location).Path.Length + 1)
    if ($keepers -notcontains $full) {
        $dest = Join-Path $archiveRoot $_.Name
        Write-Host "Move-Item $full -> $dest"
        Move-Item -Path $full -Destination $dest -Force
    }
}

# Also move Tests/UI spec files if any
Get-ChildItem -Path 'Tests\UI' -Filter '*.spec.ts' -Recurse -ErrorAction SilentlyContinue | ForEach-Object {
    $dest = Join-Path $archiveRoot $_.Name
    Write-Host "Move-Item UI test: $_ -> $dest"
    Move-Item -Path $_.FullName -Destination $dest -Force
}

Write-Host "Archival complete. Current git status:" 
git status --porcelain

Write-Host "Done. Review changes and commit: git add -A; git commit -m 'chore(tests): archive PlayWright spec files except core keepers'" 
