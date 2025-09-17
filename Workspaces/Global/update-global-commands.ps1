# NOOR Canvas Global Commands Profile Updater
# Adds new global commands to the PowerShell profile message

param(
    [Parameter(Position=0)]
    [string]$NewCommand,
    [string]$RemoveCommand,
    [switch]$Help,
    [switch]$List,
    [switch]$WhatIf
)

if ($Help) {
    Write-Host "NOOR Canvas Global Commands Profile Updater" -ForegroundColor Cyan
    Write-Host "===========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "USAGE:" -ForegroundColor Yellow
    Write-Host "  .\update-global-commands.ps1 ncs       # Add 'ncs' to global commands list"
    Write-Host "  .\update-global-commands.ps1 -List     # Show current global commands"
    Write-Host "  .\update-global-commands.ps1 -WhatIf   # Preview what would be changed"
    Write-Host "  .\update-global-commands.ps1 -Help     # Show this help"
    Write-Host ""
    Write-Host "DESCRIPTION:" -ForegroundColor Green
    Write-Host "  Updates the PowerShell profile to include new commands in the"
    Write-Host "  'NOOR Canvas global commands loaded' message that appears when"
    Write-Host "  starting new PowerShell sessions."
    Write-Host ""
    Write-Host "EXAMPLES:" -ForegroundColor Green
    Write-Host "  .\update-global-commands.ps1 ncs       # Adds 'ncs' to the list"
    Write-Host "  .\update-global-commands.ps1 iiskill   # Adds 'iiskill' to the list"
    return
}

# Get the PowerShell profile path
$profilePath = $PROFILE

Write-Host "NOOR Canvas Global Commands Updater" -ForegroundColor Cyan
Write-Host "Profile Path: $profilePath" -ForegroundColor Gray
Write-Host ""

# Check if profile exists
if (-not (Test-Path $profilePath)) {
    Write-Host "PowerShell profile not found at: $profilePath" -ForegroundColor Red
    Write-Host "Create a PowerShell profile first." -ForegroundColor Yellow
    return
}

# Read the current profile content
$profileContent = Get-Content $profilePath -Raw

# Extract current commands list
$pattern = 'NOOR Canvas global commands loaded: ([^"]+)'
if ($profileContent -match $pattern) {
    $currentCommands = $matches[1]
    Write-Host "Current global commands: $currentCommands" -ForegroundColor Green
} else {
    Write-Host "Global commands message not found in profile" -ForegroundColor Red
    return
}

if ($List) {
    Write-Host ""
    Write-Host "Current Global Commands:" -ForegroundColor Cyan
    $commandArray = $currentCommands -split ', '
    foreach ($cmd in $commandArray) {
        Write-Host "  - $cmd" -ForegroundColor White
    }
    Write-Host ""
    Write-Host "Total: $($commandArray.Count) commands" -ForegroundColor Gray
    return
}

# Handle removal
if ($RemoveCommand) {
    $commandArray = $currentCommands -split ', '
    if ($commandArray -contains $RemoveCommand) {
        $commandArray = $commandArray | Where-Object { $_ -ne $RemoveCommand }
        $newCommandsList = $commandArray -join ', '
        
        if ($WhatIf) {
            Write-Host "Would remove '$RemoveCommand' from global commands list:" -ForegroundColor Yellow
            Write-Host "Old: $currentCommands" -ForegroundColor Red
            Write-Host "New: $newCommandsList" -ForegroundColor Green
        } else {
            Write-Host "Removing '$RemoveCommand' from global commands list..." -ForegroundColor Yellow
            $updatedContent = $profileContent -replace [regex]::Escape($currentCommands), $newCommandsList
            $updatedContent | Set-Content $profilePath -Encoding UTF8
            Write-Host ""
            Write-Host "✅ Profile updated successfully!" -ForegroundColor Green
            Write-Host "New global commands: $newCommandsList" -ForegroundColor Green
        }
    } else {
        Write-Host "Command '$RemoveCommand' not found in global commands list" -ForegroundColor Red
    }
    return
}

if (-not $NewCommand) {
    Write-Host "Please specify a command to add/remove, or use -List to see current commands" -ForegroundColor Yellow
    Write-Host "Examples:" -ForegroundColor Gray
    Write-Host "  Add:    .\update-global-commands.ps1 ncs" -ForegroundColor Gray
    Write-Host "  Remove: .\update-global-commands.ps1 -RemoveCommand ncs" -ForegroundColor Gray
    return
}

# Check if command already exists
if ($currentCommands -like "*$NewCommand*") {
    Write-Host "Command '$NewCommand' is already in the global commands list" -ForegroundColor Yellow
    return
}

# Add the new command
$commandArray = $currentCommands -split ', '
$commandArray += $NewCommand
$newCommandsList = $commandArray -join ', '

if ($WhatIf) {
    Write-Host "Would update global commands list:" -ForegroundColor Yellow
    Write-Host "Old: $currentCommands" -ForegroundColor Red
    Write-Host "New: $newCommandsList" -ForegroundColor Green
} else {
    Write-Host "Adding '$NewCommand' to global commands list..." -ForegroundColor Yellow
    $updatedContent = $profileContent -replace [regex]::Escape($currentCommands), $newCommandsList
    $updatedContent | Set-Content $profilePath -Encoding UTF8
    Write-Host ""
    Write-Host "✅ Profile updated successfully!" -ForegroundColor Green
    Write-Host "New global commands: $newCommandsList" -ForegroundColor Green
    Write-Host ""
    Write-Host "💡 Restart PowerShell or run '. `$PROFILE' to see the updated message" -ForegroundColor Cyan
}
