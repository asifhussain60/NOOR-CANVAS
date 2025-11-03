param(
    [ValidateSet('add','start','end','tail','clear')]
    [string]$Command = 'tail',
    [string]$Message,
    [string]$Intent,
    [string]$SessionId,
    [string]$ContextRef,
    [int]$Last = 5,
    [string]$Title
)

# Paths
$KdsBrain = Join-Path $PSScriptRoot '..' | Join-Path -ChildPath 'kds-brain'
$ContextPath = Join-Path $KdsBrain 'conversation-context.jsonl'
$HistoryPath = Join-Path $KdsBrain 'conversation-history.jsonl'
$ActivePath  = Join-Path $KdsBrain 'conversation-active.json'

function Ensure-STMFiles {
    if (-not (Test-Path $KdsBrain)) { New-Item -ItemType Directory -Path $KdsBrain -Force | Out-Null }
    if (-not (Test-Path $ContextPath)) { New-Item -ItemType File -Path $ContextPath -Force | Out-Null }
    if (-not (Test-Path $HistoryPath)) { New-Item -ItemType File -Path $HistoryPath -Force | Out-Null }
}

function Get-NowIso {
    return (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
}

function Get-RecentMessages([int]$count=10) {
    if (-not (Test-Path $ContextPath)) { return @() }
    $lines = Get-Content $ContextPath -ErrorAction SilentlyContinue
    if (-not $lines) { return @() }
    return $lines | Select-Object -Last $count | ForEach-Object { $_ | ConvertFrom-Json }
}

function Rotate-Context([int]$max=10) {
    $lines = Get-Content $ContextPath -ErrorAction SilentlyContinue
    if (-not $lines) { return }
    if ($lines.Count -gt $max) {
        $toKeep = $lines | Select-Object -Last $max
        Set-Content -Path $ContextPath -Value ($toKeep -join [Environment]::NewLine)
    }
}

function Add-Message {
    param([string]$Message,[string]$Intent,[string]$SessionId,[string]$ContextRef)
    Ensure-STMFiles
    $entry = [ordered]@{
        timestamp    = Get-NowIso
        user_message = $Message
        intent       = $Intent
        session_id   = $SessionId
    }
    if ($ContextRef) { $entry.context_ref = $ContextRef }
    $json = ($entry | ConvertTo-Json -Compress)
    Add-Content -Path $ContextPath -Value $json
    Rotate-Context -max 10
}

function Start-Conversation {
    param([string]$Title)
    Ensure-STMFiles
    if (Test-Path $ActivePath) { Remove-Item $ActivePath -Force -ErrorAction SilentlyContinue }
    $convId = "conv-" + (Get-Date).ToString('yyyyMMdd-HHmmss')
    $obj = [ordered]@{
        conversation_id = $convId
        title           = ($Title | ForEach-Object { $_ })
        started         = Get-NowIso
        active          = $true
        message_count   = 0
        messages        = @()
    }
    ($obj | ConvertTo-Json -Depth 6) | Set-Content -Path $ActivePath
    return $convId
}

function Append-ActiveMessage {
    param([string]$Message,[string]$Intent,[string]$SessionId,[string]$ContextRef)
    if (-not (Test-Path $ActivePath)) { Start-Conversation -Title 'Untitled Conversation' | Out-Null }
    $active = Get-Content $ActivePath -Raw | ConvertFrom-Json
    $msg = [ordered]@{
        id        = "msg-" + ([guid]::NewGuid().ToString('N').Substring(0,8))
        timestamp = Get-NowIso
        user      = 'User'
        intent    = $Intent
        entities  = @()
        context_ref = $ContextRef
        text      = $Message
        session_id = $SessionId
    }
    $active.messages += $msg
    $active.message_count = ($active.message_count + 1)
    ($active | ConvertTo-Json -Depth 8) | Set-Content -Path $ActivePath
}

function Enforce-HistoryFifo {
    param([int]$Max=20)
    $lines = Get-Content $HistoryPath -ErrorAction SilentlyContinue
    if (-not $lines) { return }
    if ($lines.Count -gt $Max) {
        $toKeep = $lines | Select-Object -Last $Max
        Set-Content -Path $HistoryPath -Value ($toKeep -join [Environment]::NewLine)
    }
}

function End-Conversation {
    Ensure-STMFiles
    if (-not (Test-Path $ActivePath)) { return }
    $active = Get-Content $ActivePath -Raw | ConvertFrom-Json
    # Ensure properties exist, then set
    if ($null -eq $active.PSObject.Properties['active'])  { $active | Add-Member -NotePropertyName 'active'  -NotePropertyValue $true }
    if ($null -eq $active.PSObject.Properties['ended'])   { $active | Add-Member -NotePropertyName 'ended'   -NotePropertyValue (Get-NowIso) }
    if ($null -eq $active.PSObject.Properties['outcome']) { $active | Add-Member -NotePropertyName 'outcome' -NotePropertyValue 'completed' }
    $active.active = $false
    $active.ended  = Get-NowIso
    $active.outcome = 'completed'
    $json = ($active | ConvertTo-Json -Depth 8 -Compress)
    Add-Content -Path $HistoryPath -Value $json
    Remove-Item $ActivePath -Force -ErrorAction SilentlyContinue
    Enforce-HistoryFifo -Max 20
}

function Clear-Context {
    Ensure-STMFiles
    Clear-Content -Path $ContextPath -ErrorAction SilentlyContinue
    if (Test-Path $ActivePath) { Remove-Item $ActivePath -Force -ErrorAction SilentlyContinue }
}

function Tail-Requests([int]$N) {
    Ensure-STMFiles
    $entries = Get-RecentMessages -count $N
    $entries | ForEach-Object { $_.user_message }
}

# Dispatch
switch ($Command) {
    'add'   { Add-Message -Message $Message -Intent $Intent -SessionId $SessionId -ContextRef $ContextRef; Append-ActiveMessage -Message $Message -Intent $Intent -SessionId $SessionId -ContextRef $ContextRef }
    'start' { $id = Start-Conversation -Title $Title; Write-Output $id }
    'end'   { End-Conversation }
    'tail'  { Tail-Requests -N $Last }
    'clear' { Clear-Context }
}
