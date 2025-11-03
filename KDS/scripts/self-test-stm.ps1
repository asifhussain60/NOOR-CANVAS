Write-Host "Running STM self-test..." -ForegroundColor Cyan

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$stm = Join-Path $here 'conversation-stm.ps1'

# 1) Reset and start fresh conversation
& $stm -Command clear | Out-Null
$convId = & $stm -Command start -Title 'STM Self Test'
Write-Host "Started conversation: $convId" -ForegroundColor DarkCyan

# 2) Append test messages (simulate typical flow)
$session = 'stm-self-test'
& $stm -Command add -Message 'I want to add a FAB button' -Intent 'PLAN'    -SessionId $session
& $stm -Command add -Message 'Make it purple'            -Intent 'EXECUTE' -SessionId $session -ContextRef 'FAB button'
& $stm -Command add -Message 'Add a pulse animation'     -Intent 'PLAN'    -SessionId $session -ContextRef 'FAB button'
& $stm -Command add -Message 'Put it in the header'      -Intent 'EXECUTE' -SessionId $session -ContextRef 'FAB button'
& $stm -Command add -Message 'continue'                  -Intent 'EXECUTE' -SessionId $session

# 3) End conversation → Tier 1 append + FIFO
& $stm -Command end

# 4) Show last 5 requests
Write-Host "Last 5 requests:" -ForegroundColor Green
$last = & $stm -Command tail -Last 5
$idx = 1
foreach ($msg in $last) {
  Write-Host ("{0}. {1}" -f $idx, $msg) -ForegroundColor White
  $idx++
}
