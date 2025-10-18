# Phase 1: Debug Marker Cleanup Script
# Safely removes debug markers with CLEANUP_OK suffix from TranscriptCanvas.razor

$filePath = "d:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas\Pages\TranscriptCanvas.razor"
$content = Get-Content $filePath -Raw

Write-Host "Original file size: $($content.Length) characters" -ForegroundColor Cyan

# Pattern 1: Remove standalone CSS comment lines with debug markers
$content = $content -replace '(?m)^\s*/\*\s*\[(?:DEBUG-WORKITEM|DIAGNOSTIC|TRACE-WORKITEM):[^\]]+\][^\*]*\*/\s*$', ''

# Pattern 2: Remove inline CSS comments with ;CLEANUP_OK suffix
$content = $content -replace '/\*\s*\[(?:DEBUG-WORKITEM|DIAGNOSTIC|TRACE-WORKITEM):[^\*]+;CLEANUP_OK\s*\*/', ''

# Pattern 3: Remove HTML comment lines with debug markers  
$content = $content -replace '(?m)^\s*<!--\s*\[(?:DEBUG-WORKITEM|DIAGNOSTIC|TRACE-WORKITEM):[^\]]+\][^>]*-->\s*$', ''

# Pattern 4: Remove C# single-line comments with debug markers
$content = $content -replace '(?m)^\s*//\s*\[(?:DEBUG-WORKITEM|DIAGNOSTIC|TRACE-WORKITEM):[^\r\n]+;CLEANUP_OK[^\r\n]*$', ''

# Pattern 5: Remove Razor comments with debug markers
$content = $content -replace '(?m)^\s*@\*\s*\[(?:DEBUG-WORKITEM|DIAGNOSTIC|TRACE-WORKITEM):[^\]]+\][^\*]*\*@\s*$', ''

# Pattern 6: Clean up ;CLEANUP_OK from Logger.Log statements
$content = $content -replace '\s*;CLEANUP_OK(?=\s*")', ''

# Pattern 7: Clean up remaining ;CLEANUP_OK suffixes in inline comments
$content = $content -replace '\s*;CLEANUP_OK\s*\*/', ' */'
$content = $content -replace '\s*;CLEANUP_OK\s*-->', ' -->'

# Pattern 8: Clean up @* DiagnosticLogger comment but keep the component line
$content = $content -replace '@\*\s*\[DIAGNOSTIC-COMPONENT\][^\*]*\*@\s*\r?\n\s*(<DiagnosticLogger)', '$1'

# Pattern 9: Clean diagnostic console.error markers in JavaScript onerror attributes
$content = $content -replace "console\.error\('\[DIAGNOSTIC:[^\]]+\][^']+'\)", "console.error('CDN failed, loading local fallback')"

Write-Host "Cleaned file size: $($content.Length) characters" -ForegroundColor Cyan

# Save cleaned content
$content | Set-Content $filePath -NoNewline

Write-Host "✅ Phase 1 Complete: Debug markers removed from TranscriptCanvas.razor" -ForegroundColor Green
Write-Host "Running build validation..." -ForegroundColor Yellow
