# Populate BRAIN from Existing Sessions
# Scans KDS/sessions/ and extracts historical patterns

param(
    [string]$SessionsPath = "KDS/sessions",
    [string]$BrainPath = "KDS/kds-brain"
)

Write-Host "🧠 KDS BRAIN Population Script" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Check if sessions directory exists
if (-not (Test-Path $SessionsPath)) {
    Write-Host "❌ Sessions directory not found: $SessionsPath" -ForegroundColor Red
    exit 1
}

# Check if brain directory exists
if (-not (Test-Path $BrainPath)) {
    Write-Host "⚠️ Creating BRAIN directory: $BrainPath" -ForegroundColor Yellow
    New-Item -Path $BrainPath -ItemType Directory -Force | Out-Null
}

$eventsFile = Join-Path $BrainPath "events.jsonl"
$knowledgeGraphFile = Join-Path $BrainPath "knowledge-graph.yaml"

Write-Host "📁 Scanning sessions in: $SessionsPath" -ForegroundColor Gray
Write-Host "📝 Writing events to: $eventsFile`n" -ForegroundColor Gray

# Initialize counters
$totalSessions = 0
$totalEvents = 0
$fileModifications = @{}

# Scan all JSON session files
Get-ChildItem -Path $SessionsPath -Filter "*.json" | ForEach-Object {
    $sessionFile = $_.FullName
    Write-Host "📄 Processing: $($_.Name)" -ForegroundColor Gray
    
    try {
        $session = Get-Content $sessionFile -Raw | ConvertFrom-Json
        $totalSessions++
        
        # Extract session data
        $sessionId = $session.sessionId
        $feature = $session.feature
        $status = $session.status
        $createdAt = $session.createdAt
        
        # Log session start event
        $eventData = @{
            timestamp = $createdAt
            event = "session_started"
            session_id = $sessionId
            feature = $feature
        } | ConvertTo-Json -Compress
        
        Add-Content -Path $eventsFile -Value $eventData
        $totalEvents++
        
        # Extract completed tasks (file modifications)
        if ($session.completedTasks) {
            $session.completedTasks | ForEach-Object {
                $taskDescription = $_
                
                # Extract file mentions from task descriptions
                # Pattern: file names typically have extensions
                $fileMatches = [regex]::Matches($taskDescription, '([a-zA-Z0-9\-_]+\.(razor|cs|css|js|ts|json|sql|ps1|md))')
                
                foreach ($match in $fileMatches) {
                    $fileName = $match.Groups[1].Value
                    
                    # Track file modification
                    if (-not $fileModifications.ContainsKey($fileName)) {
                        $fileModifications[$fileName] = 0
                    }
                    $fileModifications[$fileName]++
                    
                    # Log file modification event
                    $eventData = @{
                        timestamp = $createdAt
                        event = "file_modified"
                        file = $fileName
                        session = $sessionId
                        task = $taskDescription
                    } | ConvertTo-Json -Compress
                    
                    Add-Content -Path $eventsFile -Value $eventData
                    $totalEvents++
                }
            }
        }
        
        # Log session completion event
        if ($status -eq "COMPLETED") {
            $eventData = @{
                timestamp = $session.lastUpdated
                event = "session_completed"
                session_id = $sessionId
                feature = $feature
                total_tasks = $session.completedTasks.Count
            } | ConvertTo-Json -Compress
            
            Add-Content -Path $eventsFile -Value $eventData
            $totalEvents++
        }
        
    } catch {
        Write-Host "  ⚠️ Failed to parse session: $_" -ForegroundColor Yellow
    }
}

Write-Host "`n✅ Scan Complete!" -ForegroundColor Green
Write-Host "`n📊 Statistics:" -ForegroundColor Cyan
Write-Host "  Sessions scanned: $totalSessions" -ForegroundColor Gray
Write-Host "  Events logged: $totalEvents" -ForegroundColor Gray
Write-Host "  Unique files: $($fileModifications.Count)" -ForegroundColor Gray

# Display top modified files
Write-Host "`n🔥 Top Modified Files:" -ForegroundColor Cyan
$fileModifications.GetEnumerator() | 
    Sort-Object -Property Value -Descending | 
    Select-Object -First 10 | 
    ForEach-Object {
        Write-Host "  $($_.Key): $($_.Value) modifications" -ForegroundColor Gray
    }

Write-Host "`n🧠 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Run BRAIN updater to process events:" -ForegroundColor Gray
Write-Host "     #file:KDS/prompts/internal/brain-updater.md" -ForegroundColor White
Write-Host "`n  2. Or manually trigger update:" -ForegroundColor Gray
Write-Host "     #file:KDS/prompts/user/kds.md Update BRAIN with all events" -ForegroundColor White

Write-Host "`n✨ BRAIN is ready to learn from $totalEvents historical events!" -ForegroundColor Green
