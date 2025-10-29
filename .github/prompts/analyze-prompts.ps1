# Comprehensive Prompt System Analysis

Write-Host "`n=== PROMPT SYSTEM ANALYSIS ===" -ForegroundColor Cyan

# Root prompts (agent files)
$rootPrompts = Get-ChildItem -Filter "*.prompt.md"
Write-Host "`n📋 Root Agent Prompts: $($rootPrompts.Count)" -ForegroundColor Yellow
$rootPrompts | Sort-Object Name | ForEach-Object {
    $lines = (Get-Content $_.FullName).Count
    $name = $_.Name.PadRight(35)
    Write-Host "  $name - $lines lines" -ForegroundColor White
}

# Shared modules
$sharedModules = Get-ChildItem -Path "shared" -Filter "*.md" -Recurse
Write-Host "`n📦 Shared Modules: $($sharedModules.Count)" -ForegroundColor Yellow
Write-Host "  task-exec/: $((Get-ChildItem -Path 'shared/task-exec' -Filter '*.md').Count) modules" -ForegroundColor Gray
Write-Host "  test-gen/: $((Get-ChildItem -Path 'shared/test-gen' -Filter '*.md' -Recurse).Count) modules" -ForegroundColor Gray
Write-Host "  Other: $(($sharedModules | Where-Object { $_.DirectoryName -notlike '*task-exec*' -and $_.DirectoryName -notlike '*test-gen*' }).Count) files" -ForegroundColor Gray

# Internal prompts
$internalPrompts = Get-ChildItem -Path "internal" -Filter "*.md" -Recurse -ErrorAction SilentlyContinue
Write-Host "`n🔧 Internal Prompts: $($internalPrompts.Count)" -ForegroundColor Yellow

# Large files (>500 lines)
Write-Host "`n📏 Large Prompts (>500 lines):" -ForegroundColor Yellow
Get-ChildItem -Filter "*.prompt.md" | ForEach-Object {
    $lines = (Get-Content $_.FullName).Count
    if ($lines -gt 500) {
        Write-Host "  $($_.Name.PadRight(35)) - $lines lines" -ForegroundColor Red
    }
}

# Module references
Write-Host "`n🔗 Module Loading Pattern Usage:" -ForegroundColor Yellow
$withModules = Get-ChildItem -Filter "*.prompt.md" | Where-Object {
    (Get-Content $_.FullName -Raw) -match 'LOAD MODULE:'
}
Write-Host "  Prompts using 'LOAD MODULE:' pattern: $($withModules.Count)" -ForegroundColor Green
$withModules | ForEach-Object {
    $count = (Select-String -Path $_.FullName -Pattern 'LOAD MODULE:').Count
    Write-Host "    $($_.Name): $count references" -ForegroundColor Gray
}

# Total stats
$totalMd = (Get-ChildItem -Recurse -Filter "*.md").Count
Write-Host "`n📊 Total Statistics:" -ForegroundColor Cyan
Write-Host "  Total .md files: $totalMd" -ForegroundColor White
Write-Host "  Root agents: $($rootPrompts.Count)" -ForegroundColor White
Write-Host "  Shared modules: $($sharedModules.Count)" -ForegroundColor White
Write-Host "  Internal: $($internalPrompts.Count)" -ForegroundColor White

# Key data stream integration check
Write-Host "`n🔑 Key Data Stream Integration:" -ForegroundColor Yellow
$keyReferences = Get-ChildItem -Filter "*.prompt.md" | Where-Object {
    (Get-Content $_.FullName -Raw) -match 'key-data-streams'
}
Write-Host "  Prompts referencing key-data-streams: $($keyReferences.Count)" -ForegroundColor Green
$keyReferences | ForEach-Object {
    Write-Host "    - $($_.Name)" -ForegroundColor Gray
}
