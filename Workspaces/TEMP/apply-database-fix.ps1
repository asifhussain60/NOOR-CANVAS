# COPILOT-DEBUG: Apply Database Fix for Session Description
# Fix Issue: nosessiondesc - Update canvas.Sessions.Description from KSESSIONS source

Write-Host "=== COPILOT-DEBUG: Applying Database Fix for Session 212 ===" -ForegroundColor Green
Write-Host "BEFORE: Description = 'Album: 14, Category: 52'" -ForegroundColor Red
Write-Host "AFTER:  Description = 'we look at the purpose of sending messengers, and their role in our spiritual awakening.'" -ForegroundColor Green
Write-Host ""

# Create SQL script to fix the description
$sqlScript = @"
-- COPILOT-DEBUG: Fix session description for Session 212
-- Update canvas.Sessions.Description from KSESSIONS_DEV.dbo.Sessions source

UPDATE canvas.Sessions 
SET Description = (
    SELECT TOP 1 Description 
    FROM dbo.Sessions 
    WHERE SessionId = 212
)
WHERE SessionId = 212;

-- Verify the update
SELECT SessionId, Title, Description, Status
FROM canvas.Sessions 
WHERE SessionId = 212;
"@

# Save SQL script to temp file
$sqlFile = "d:\PROJECTS\NOOR CANVAS\Workspaces\TEMP\fix-session-212-description.sql"
$sqlScript | Out-File -FilePath $sqlFile -Encoding UTF8

Write-Host "✅ SQL Fix Script Created: $sqlFile" -ForegroundColor Green
Write-Host ""
Write-Host "SQL Script Content:" -ForegroundColor Cyan
Write-Host $sqlScript -ForegroundColor Yellow
Write-Host ""

Write-Host "NEXT STEPS:" -ForegroundColor Cyan
Write-Host "1. Execute the SQL script above in SSMS on KSESSIONS_DEV database" -ForegroundColor White
Write-Host "2. Restart the NoorCanvas application" -ForegroundColor White  
Write-Host "3. Test with token: 3SVQYLWC" -ForegroundColor White
Write-Host "4. Verify SessionWaiting.razor shows proper description" -ForegroundColor White