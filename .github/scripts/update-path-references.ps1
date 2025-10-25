# update-path-references.ps1
# Updates all prompts.keys references → key-data-streams

$ErrorActionPreference = "Stop"

Write-Host "Updating path references: prompts.keys → key-data-streams" -ForegroundColor Cyan

# Files to update (17 total)
$files = @(
    # Prompts (8 files)
    ".github/prompts/plan.prompt.md",
    ".github/prompts/task.prompt.md",
    ".github/prompts/test-generation.prompt.md",
    ".github/prompts/healthcheck.prompt.md",
    ".github/prompts/todo.prompt.md",
    ".github/prompts/drift.prompt.md",
    ".github/prompts/cohesion.prompt.md",
    ".github/prompts/port-instructions.prompt.md",
    
    # Shared (6 files)
    ".github/prompts/shared/context-gathering-phases.md",
    ".github/prompts/shared/commit-checkpoint-protocol.md",
    ".github/prompts/shared/task-parameters-reference.md",
    ".github/prompts/shared/agent-handoff-protocol.md",
    ".github/prompts/shared/test-orchestration-patterns.md",
    ".github/prompts/shared/key-data-stream-analyze-learning-template.md",
    
    # Archive (2 files)
    ".github/prompts/shared/archive/PLAN-INTEGRATION-SUMMARY.md",
    ".github/prompts/shared/archive/analyze-learning.prompt.backup.md"
)

$updatedCount = 0
$totalReplacements = 0

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        $originalContent = $content
        
        # Replace all variants of prompts.keys with key-data-streams
        $content = $content -replace '\.github/prompts\.keys/', '.github/key-data-streams/'
        $content = $content -replace 'prompts\.keys/', 'key-data-streams/'
        $content = $content -replace 'prompts\.keys', 'key-data-streams'
        
        if ($content -ne $originalContent) {
            Set-Content -Path $file -Value $content -NoNewline
            $matches = ([regex]::Matches($originalContent, 'prompts\.keys')).Count
            $totalReplacements += $matches
            $updatedCount++
            Write-Host "✓ Updated: $file ($matches replacements)" -ForegroundColor Green
        } else {
            Write-Host "○ No changes: $file" -ForegroundColor Gray
        }
    } else {
        Write-Host "✗ Not found: $file" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "- Files updated: $updatedCount/$($files.Count)" -ForegroundColor Green
Write-Host "- Total replacements: $totalReplacements" -ForegroundColor Green
Write-Host ""
Write-Host "Next: Commit changes and run validation" -ForegroundColor Yellow
