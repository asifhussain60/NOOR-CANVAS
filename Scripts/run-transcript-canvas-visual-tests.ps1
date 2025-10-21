param(
    [switch]$KeepAppRunning
)

$ErrorActionPreference = 'Stop'

Write-Host '=== TranscriptCanvas Visual Tests ===' -ForegroundColor Cyan

# Start app
Write-Host 'Starting NoorCanvas app...' -ForegroundColor Yellow
$appJob = Start-Job -ScriptBlock {
    Set-Location 'D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas'
    dotnet run
}

Write-Host 'Waiting 20s for startup...' -ForegroundColor Yellow
Start-Sleep -Seconds 20

try {
    Set-Location 'D:\PROJECTS\NOOR CANVAS'
    if (-not $env:PERCY_TOKEN) {
        Write-Warning 'PERCY_TOKEN not set; Percy snapshots will fail to upload. Set PERCY_TOKEN to enable Percy.'
    }

    # Run tests (headed for reliable visuals)
    npx percy exec -- npx playwright test Tests/UI/transcript-canvas-width-visual.spec.ts --headed
}
finally {
    if (-not $KeepAppRunning) {
        Write-Host 'Stopping app...' -ForegroundColor Yellow
        Stop-Job -Job $appJob -ErrorAction SilentlyContinue
        Remove-Job -Job $appJob -ErrorAction SilentlyContinue
    } else {
        Write-Host "App still running (Job Id: $($appJob.Id))" -ForegroundColor Green
    }
}

Write-Host '=== Done ===' -ForegroundColor Cyan
