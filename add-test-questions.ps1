#!/usr/bin/env pwsh
# Script to add test questions to the database

$connectionString = "Server=AHHOME;Database=KSESSIONS_DEV;Trusted_Connection=true;TrustServerCertificate=true;"

Write-Host "Adding test questions to session 212..." -ForegroundColor Green

try {
    # Simple JSON content for testing
    $questions = @(
        @{
            Content = '{"text":"What is the main theme of today discussion?","questionId":"test-q1","createdBy":"user1-guid-test","userName":"Ahmed Hassan"}'
            CreatedBy = "user1-guid-test"
        },
        @{
            Content = '{"text":"Can you explain the concept in more detail?","questionId":"test-q2","createdBy":"user2-guid-test","userName":"Sarah Mohamed"}'
            CreatedBy = "user2-guid-test"
        },
        @{
            Content = '{"text":"How does this relate to our previous lessons?","questionId":"test-q3","createdBy":"user1-guid-test","userName":"Ahmed Hassan"}'
            CreatedBy = "user1-guid-test"
        }
    )
    
    foreach ($q in $questions) {
        $query = @"
INSERT INTO canvas.SessionData (SessionId, DataType, Content, CreatedBy) 
VALUES (212, 'Question', N'$($q.Content)', '$($q.CreatedBy)')
"@
        
        Invoke-Sqlcmd -ConnectionString $connectionString -Query $query -ErrorAction Stop
        $questionText = ($q.Content | ConvertFrom-Json).text
        Write-Host "✓ Added: $questionText" -ForegroundColor Cyan
    }
    
    Write-Host "`n✅ Successfully added all test questions!" -ForegroundColor Green
    
    # Verify the questions were added
    $verifyQuery = "SELECT COUNT(*) as QuestionCount FROM canvas.SessionData WHERE SessionId = 212 AND DataType = 'Question'"
    $result = Invoke-Sqlcmd -ConnectionString $connectionString -Query $verifyQuery
    Write-Host "📊 Total questions in session 212: $($result.QuestionCount)" -ForegroundColor Yellow
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}