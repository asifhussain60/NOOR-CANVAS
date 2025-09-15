param(
    [Parameter(Position=0)]
    [int]$SessionId,
    [switch]$Help
)

Clear-Host

if ($Help) {
    Write-Host "NOOR Canvas Token (nct) - Interactive Host Provisioner" -ForegroundColor Cyan
    Write-Host "====================================================="
    Write-Host ""
    Write-Host "DESCRIPTION:"
    Write-Host "  Interactive tool to generate Host GUIDs for NOOR Canvas sessions"
    Write-Host ""
    Write-Host "USAGE:"
    Write-Host "  nct                    # Launch interactive Host Provisioner"
    Write-Host "  nct 215                # Generate token for session ID 215"
    Write-Host "  nct [sessionId]        # Generate token for specific session"
    Write-Host "  nct -Help              # Show this help"
    Write-Host ""
    Write-Host "FEATURES:"
    Write-Host "  - Interactive session ID input OR direct session parameter"
    Write-Host "  - Automatic Host and User GUID generation"
    Write-Host "  - Participant session link creation with User GUID attachment"
    Write-Host "  - Ready-to-use Host GUIDs for authentication"
    Write-Host "  - Complete session setup including participant access"
    Write-Host ""
    Write-Host "EXAMPLE OUTPUT:"
    Write-Host "  Session ID: 123"
    Write-Host "  Host GUID: 12345678-1234-1234-1234-123456789abc"
    Write-Host "  User Session GUID: 87654321-4321-4321-4321-210987654321"
    Write-Host "  Participant URL: https://localhost:9091/join/{link}?userGuid={guid}"
    return
}

if ($SessionId -gt 0) {
    Write-Host "NOOR Canvas Token (nct) - Session-Specific Host GUID Generator" -ForegroundColor Green
    Write-Host "===============================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Generating Host GUID for Session ID: $SessionId" -ForegroundColor Cyan
    Write-Host ""

    $originalLocation = Get-Location
    try {
        Set-Location "D:\PROJECTS\NOOR CANVAS\Tools\HostProvisioner\HostProvisioner"
        $provisionerOutput = & dotnet run -- create --session-id $SessionId --created-by "NC Global Command" --dry-run false --create-user 2>&1 | Out-String
        
        # Extract Host GUID from output
        $hostGuid = $null
        if ($provisionerOutput -match "Host GUID:\s*([a-fA-F0-9\-]{36})") {
            $hostGuid = $matches[1]
        }

        # Extract User GUID from HostProvisioner logs
        $userGuid = $null
        if ($provisionerOutput -match "User GUID:\s*([0-9a-fA-F\-]{36})") {
            $userGuid = $matches[1]
        }

        # Extract Participant URL from HostProvisioner logs
        $participantUrl = $null
        if ($provisionerOutput -match "Participant URL:\s*(https?://[^\s]+)") {
            $participantUrl = $matches[1]
        }

        Write-Host $provisionerOutput

        if ($LASTEXITCODE -ne 0) {
            Write-Host ""
            Write-Host "Host Provisioner failed for Session ID: $SessionId" -ForegroundColor Red
            Write-Host "Try building the project first or check if session ID exists" -ForegroundColor Yellow
        } else {
            Write-Host ""
            Write-Host "=========================================" -ForegroundColor Green
            Write-Host "   Session Setup Complete" -ForegroundColor Green
            Write-Host "=========================================" -ForegroundColor Green
            Write-Host ""
            
            if ($hostGuid) {
                Write-Host "Host Session GUID: " -ForegroundColor White -NoNewline
                Write-Host $hostGuid -ForegroundColor Green -BackgroundColor Black
            }
            
            if ($userGuid) {
                Write-Host "User Session GUID: " -ForegroundColor White -NoNewline
                Write-Host $userGuid -ForegroundColor Green -BackgroundColor Black
            }
            
            if ($participantUrl) {
                Write-Host ""
                Write-Host "Participant Session Link: " -ForegroundColor White -NoNewline
                Write-Host $participantUrl -ForegroundColor Cyan
            }
            
            Write-Host ""
            Write-Host "Instructions:" -ForegroundColor Yellow
            Write-Host "1. Use Host GUID for authentication in the application" -ForegroundColor White
            Write-Host "2. Share the Participant Session Link with users to join" -ForegroundColor White
            Write-Host "3. All GUIDs are stored securely in the database" -ForegroundColor White
            Write-Host ""
        }
    }
    finally {
        Set-Location $originalLocation
    }
} else {
    Write-Host "NOOR Canvas Token (nct) - Host GUID Generator" -ForegroundColor Green
    Write-Host "============================================="
    Write-Host ""
    Write-Host "Launching Interactive Host Provisioner..." -ForegroundColor Yellow
    Write-Host ""

    $originalLocation = Get-Location
    try {
        Set-Location "D:\PROJECTS\NOOR CANVAS\Tools\HostProvisioner\HostProvisioner"
        & dotnet run
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host ""
            Write-Host "Host Provisioner failed to start" -ForegroundColor Red
            Write-Host "Try building the project first"
        }
    }
    finally {
        Set-Location $originalLocation
    }
}

Write-Host ""
Write-Host "Tip: Use 'nct -Help' to see all available options" -ForegroundColor Cyan
