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

# If no session ID provided, prompt user for input
if ($SessionId -eq 0) {
    Write-Host "NOOR Canvas Token (nct) - Interactive Host Provisioner" -ForegroundColor Green
    Write-Host "=====================================================" -ForegroundColor Green
    Write-Host ""
    
    do {
        $sessionInput = Read-Host "Enter Session ID"
        if ([int]::TryParse($sessionInput, [ref]$SessionId) -and $SessionId -gt 0) {
            break
        }
        Write-Host "Please enter a valid Session ID (positive number)" -ForegroundColor Red
    } while ($true)
    
    # Clear terminal after getting session ID interactively
    Clear-Host
}

if ($SessionId -gt 0) {
    # Only clear terminal if SessionID was provided as parameter (not interactively)
    if ($args.Count -gt 0) {
        Clear-Host
    }
    
    Write-Host "NOOR Canvas Token (nct) - Session-Specific Host GUID Generator" -ForegroundColor Green
    Write-Host "===============================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Generating Host GUID for Session ID: $SessionId" -ForegroundColor Cyan
    Write-Host ""

    $originalLocation = Get-Location
    try {
        Set-Location "D:\PROJECTS\NOOR CANVAS\Tools\HostProvisioner\HostProvisioner"
        $provisionerOutput = & dotnet run -- create --session-id $SessionId --created-by "NC Global Command" --dry-run false --create-user 2>&1 | Out-String
        
        # Extract 8-character Host Token from friendly token logs
        $hostToken = $null
        if ($provisionerOutput -match "Host Token:\s*([A-Z0-9]{8})") {
            $hostToken = $matches[1]
        }

        # Extract 8-character User Token from friendly token logs
        $userToken = $null
        if ($provisionerOutput -match "User Token:\s*([A-Z0-9]{8})") {
            $userToken = $matches[1]
        }

        # Extract Host URL from friendly token logs
        $hostUrl = $null
        if ($provisionerOutput -match "Host URL:\s*(https?://[^\s]+)") {
            $hostUrl = $matches[1]
        }

        # Extract Participant URL from friendly token logs
        $participantUrl = $null
        if ($provisionerOutput -match "Participant URL:\s*(https?://[^\s]+)") {
            $participantUrl = $matches[1]
        }

        # Extract Session IDs for reference
        $ksessionsId = $null
        if ($provisionerOutput -match "KSESSIONS Session ID:\s*(\d+)") {
            $ksessionsId = $matches[1]
        }
        
        $canvasSessionId = $null
        if ($provisionerOutput -match "Canvas Session ID:\s*(\d+)") {
            $canvasSessionId = $matches[1]
        }

        Write-Host $provisionerOutput

        if ($LASTEXITCODE -ne 0) {
            Write-Host ""
            Write-Host "Host Provisioner failed for Session ID: $SessionId" -ForegroundColor Red
            Write-Host "Try building the project first or check if session ID exists" -ForegroundColor Yellow
        } else {
            Write-Host ""
            Write-Host "Session Tokens Generated Successfully!" -ForegroundColor Green
            Write-Host "===========================================" -ForegroundColor Green
            
            if ($ksessionsId -and $canvasSessionId) {
                Write-Host "KSESSIONS Session ID: $ksessionsId" -ForegroundColor White
                Write-Host "Canvas Session ID: $canvasSessionId" -ForegroundColor White
                Write-Host "Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') UTC" -ForegroundColor White
                Write-Host ""
            }
            
            if ($userToken -and $participantUrl) {
                Write-Host "======================================" -ForegroundColor Cyan
                Write-Host "USER AUTHENTICATION:" -ForegroundColor Cyan
                Write-Host "======================================" -ForegroundColor Cyan
                Write-Host "   Participant Token: " -NoNewline -ForegroundColor White
                Write-Host $userToken -ForegroundColor Yellow
                Write-Host "   Participant URL: " -NoNewline -ForegroundColor White  
                Write-Host $participantUrl -ForegroundColor Cyan
                Write-Host ""
            }
            
            if ($hostToken -and $hostUrl) {
                Write-Host "======================================" -ForegroundColor Yellow
                Write-Host "HOST AUTHENTICATION:" -ForegroundColor Yellow
                Write-Host "======================================" -ForegroundColor Yellow
                Write-Host "   Host Token: " -NoNewline -ForegroundColor White
                Write-Host $hostToken -ForegroundColor Green
                Write-Host "   Host URL: " -NoNewline -ForegroundColor White
                Write-Host $hostUrl -ForegroundColor Cyan
                Write-Host ""
            }
            
            Write-Host "======================================" -ForegroundColor Green
            Write-Host "DATABASE:" -ForegroundColor Green
            Write-Host "======================================" -ForegroundColor Green
            Write-Host "   Saved to: canvas.HostSessions, canvas.SecureTokens" -ForegroundColor White
            if ($canvasSessionId) {
                Write-Host "   Host Session ID: $canvasSessionId" -ForegroundColor White
            }
            Write-Host ""
            
            # Display highlighted Host URL for easy access
            if ($hostToken) {
                Write-Host ""
                Write-Host "HOST ACCESS READY:" -ForegroundColor Green -BackgroundColor Black
                Write-Host "==================" -ForegroundColor Green -BackgroundColor Black
                Write-Host "   https://localhost:9091/host/$hostToken" -ForegroundColor Cyan -BackgroundColor Black
                Write-Host ""
                Write-Host "Click the link above to access the host interface, then press any key to launch NOOR Canvas..." -ForegroundColor Yellow
                $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
                
                # Execute ncb (NOOR Canvas Build)
                Write-Host ""
                Write-Host "Launching NOOR Canvas Build (ncb)..." -ForegroundColor Green
                & ncb
                
                # After ncb completes, launch the host URL in browser
                if ($LASTEXITCODE -eq 0) {
                    Write-Host ""
                    Write-Host "Opening host interface in browser..." -ForegroundColor Green
                    Start-Process "https://localhost:9091/host/$hostToken"
                } else {
                    Write-Host ""
                    Write-Host "ncb failed to launch. Please start the application manually and then visit:" -ForegroundColor Red
                    Write-Host "https://localhost:9091/host/$hostToken" -ForegroundColor Cyan
                }
            } else {
                Write-Host "Host Token not found in output. Please check the provisioner logs above." -ForegroundColor Red
            }
        }
    }
    finally {
        Set-Location $originalLocation
    }
}

Write-Host ""
