# Update Session 212 in database with fixed HTML
$ErrorActionPreference = "Stop"

Write-Host "=== UPDATE SESSION 212 DATABASE ===" -ForegroundColor Cyan

$fixedHtmlFile = "d:\PROJECTS\NOOR CANVAS\.github\prompts.keys\hcp-tcanvas\Session212.txt"
$fixedHtml = Get-Content $fixedHtmlFile -Raw -Encoding UTF8

Write-Host "HTML length: $($fixedHtml.Length) chars" -ForegroundColor Gray

# Escape single quotes for SQL
$sqlSafe = $fixedHtml -replace "'", "''"

$server = "AHHOME"
$database = "KSESSIONS_DEV"

# Split into manageable chunks and use UPDATETEXT or simpler approach
# For large text, use SqlCommand with parameters

$connectionString = "Server=$server;Database=$database;Integrated Security=True;TrustServerCertificate=True"

try {
    $connection = New-Object System.Data.SqlClient.SqlConnection($connectionString)
    $connection.Open()
    
    Write-Host "Connected to database..." -ForegroundColor Green
    
    # Use parameterized query for large text
    $query = "UPDATE dbo.SessionTranscripts SET Transcript = @html WHERE SessionId = 212"
    
    $command = New-Object System.Data.SqlClient.SqlCommand($query, $connection)
    $parameter = $command.Parameters.AddWithValue("@html", $fixedHtml)
    $parameter.SqlDbType = [System.Data.SqlDbType]::NVarChar
    $parameter.Size = -1  # MAX
    
    $rowsAffected = $command.ExecuteNonQuery()
    
    Write-Host "Rows updated: $rowsAffected" -ForegroundColor Green
    
    # Verify
    $verifyQuery = "SELECT SessionId, LEN(Transcript) as Len FROM dbo.SessionTranscripts WHERE SessionId = 212"
    $verifyCommand = New-Object System.Data.SqlClient.SqlCommand($verifyQuery, $connection)
    $reader = $verifyCommand.ExecuteReader()
    
    if ($reader.Read()) {
        Write-Host "SessionId: $($reader["SessionId"]), Length: $($reader["Len"])" -ForegroundColor Cyan
    }
    $reader.Close()
    
    $connection.Close()
    
    Write-Host ""
    Write-Host "SUCCESS: Database updated!" -ForegroundColor Green
    
} catch {
    Write-Host "ERROR: $_" -ForegroundColor Red
    if ($connection) {
        $connection.Close()
    }
}
