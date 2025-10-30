# Fix Session 212 HTML - Convert mixed th/td tags to consistent td tags in tbody
# Root cause: <tbody> row has <td>...<td>1</td><th>2</th><th>... which causes Blazor appendChild error

$ErrorActionPreference = "Stop"

Write-Host "=== FIX SESSION 212 MALFORMED HTML ===" -ForegroundColor Cyan
Write-Host "Problem: Mixed <td> and <th> tags in same <tbody> row" -ForegroundColor Yellow
Write-Host ""

# Read the HTML from file
$htmlFile = "d:\PROJECTS\NOOR CANVAS\.github\prompts.keys\hcp-tcanvas\Session212.txt"
$htmlContent = Get-Content $htmlFile -Raw -Encoding UTF8

Write-Host "Original HTML length: $($htmlContent.Length) chars" -ForegroundColor Gray

# Use regex to fix the malformed table
# Pattern: Find <tbody> rows that have <td> followed by <th> tags
$fixedHtml = $htmlContent

# Fix the specific malformed table row
# Pattern: <td>...</td><th>...</th> in tbody
$pattern = '(<tbody><tr>(?:<td[^>]*>.*?</td>)*<td[^>]*>)(.*?)(</td>)(<th[^>]*>)'
$fixedHtml = $fixedHtml -replace '<th style="text-align:center; vertical-align:middle;">([^<]+)</th>(?=<th|<td|</tr>)', '<td style="text-align:center; vertical-align:middle;">$1</td>'

# Specifically target the problematic row - convert ALL <th> to <td> in <tbody> context
$fixedHtml = $fixedHtml -replace '(<tbody>[\s\S]*?)<th style="text-align:center; vertical-align:middle;">([^<]+)</th>([\s\S]*?</tbody>)', '$1<td style="text-align:center; vertical-align:middle;">$2</td>$3'

# More aggressive: Find all <th> tags inside <tbody> (not in <thead>) and convert to <td>
# Split by tables and process each
$tables = [regex]::Matches($fixedHtml, '<table>.*?</table>', [System.Text.RegularExpressions.RegexOptions]::Singleline)

foreach ($table in $tables) {
    $tableHtml = $table.Value
    $originalTableHtml = $tableHtml
    
    # Check if this table has a tbody
    if ($tableHtml -match '<tbody>') {
        # Extract tbody content
        $tbodyMatch = [regex]::Match($tableHtml, '<tbody>(.*?)</tbody>', [System.Text.RegularExpressions.RegexOptions]::Singleline)
        if ($tbodyMatch.Success) {
            $tbodyContent = $tbodyMatch.Groups[1].Value
            $fixedTbodyContent = $tbodyContent -replace '<th([^>]*)>', '<td$1>' -replace '</th>', '</td>'
            
            $tableHtml = $tableHtml.Replace($tbodyMatch.Value, "<tbody>$fixedTbodyContent</tbody>")
            
            # Replace in main HTML
            $fixedHtml = $fixedHtml.Replace($originalTableHtml, $tableHtml)
        }
    }
}

Write-Host "Fixed HTML length: $($fixedHtml.Length) chars" -ForegroundColor Green
Write-Host ""

# Validate the fix
$thInTbodyPattern = '<tbody>[\s\S]*?<th[\s\S]*?</tbody>'
$thInTbodyCount = ([regex]::Matches($fixedHtml, $thInTbodyPattern)).Count
Write-Host "Remaining TH tags in TBODY: $thInTbodyCount" -ForegroundColor $(if ($thInTbodyCount -eq 0) { 'Green' } else { 'Red' })

if ($thInTbodyCount -gt 0) {
    Write-Host "WARNING: Still has TH tags in TBODY!" -ForegroundColor Red
    Write-Host "Showing first occurrence:" -ForegroundColor Yellow
    $matchPattern = '<tbody>[\s\S]{0,200}<th[\s\S]{0,100}'
    $match = [regex]::Match($fixedHtml, $matchPattern, [System.Text.RegularExpressions.RegexOptions]::Singleline)
    Write-Host $match.Value -ForegroundColor Yellow
} else {
    Write-Host "SUCCESS: All TH tags in TBODY converted to TD!" -ForegroundColor Green
}

Write-Host ""

# Save fixed HTML to file
$fixedHtmlFile = "d:\PROJECTS\NOOR CANVAS\.github\prompts.keys\hcp-tcanvas\Session212-FIXED.txt"
$fixedHtml | Out-File -FilePath $fixedHtmlFile -Encoding UTF8 -NoNewline

Write-Host "Fixed HTML saved to: $fixedHtmlFile" -ForegroundColor Cyan
Write-Host ""

# Update database
Write-Host "=== UPDATING DATABASE ===" -ForegroundColor Cyan

# Escape single quotes for SQL
$sqlSafeHtml = $fixedHtml -replace "'", "''"

$updateQuery = @"
UPDATE dbo.SessionTranscripts 
SET Transcript = '$sqlSafeHtml'
WHERE SessionId = 212
"@

$server = "AHHOME"
$database = "KSESSIONS_DEV"

try {
    # Execute SQL
    Invoke-Sqlcmd -ServerInstance $server -Database $database -Query $updateQuery -QueryTimeout 30
    
    Write-Host "✓ Database updated successfully!" -ForegroundColor Green
    Write-Host ""
    
    # Verify update
    $verifyQuery = @"
SELECT 
    SessionId,
    LEN(Transcript) as TranscriptLength,
    CASE 
        WHEN Transcript LIKE '%<tbody>%<th%</tbody>%' THEN 'HAS_TH_IN_TBODY'
        ELSE 'CLEAN'
    END as HTMLStatus
FROM dbo.SessionTranscripts 
WHERE SessionId = 212
"@
    
    Write-Host "=== VERIFICATION ===" -ForegroundColor Cyan
    $result = Invoke-Sqlcmd -ServerInstance $server -Database $database -Query $verifyQuery
    $result | Format-Table -AutoSize
    
    if ($result.HTMLStatus -eq 'CLEAN') {
        Write-Host "SUCCESS: HTML is now CLEAN - no TH tags in TBODY!" -ForegroundColor Green
    } else {
        Write-Host "WARNING: HTML still has issues!" -ForegroundColor Red
    }
    
} catch {
    Write-Host "ERROR updating database: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "You can manually run this SQL:" -ForegroundColor Yellow
    Write-Host "USE KSESSIONS_DEV" -ForegroundColor Gray
    Write-Host "GO" -ForegroundColor Gray
    Write-Host "-- Copy content from $fixedHtmlFile and update manually" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=== NEXT STEPS ===" -ForegroundColor Cyan
Write-Host "1. Replace content in Session212.txt with content from Session212-FIXED.txt" -ForegroundColor Yellow
Write-Host "2. Test the app to verify no appendChild errors" -ForegroundColor Yellow
Write-Host "3. Check browser console for [TRACE:hcp-tcanvas] logs" -ForegroundColor Yellow
