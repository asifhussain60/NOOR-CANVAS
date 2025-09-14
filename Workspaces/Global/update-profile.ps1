# NOOR Canvas PowerShell Profile Updater
# Updates the PowerShell profile to include iiskill in global commands message

param(
    [switch]$Help,
    [switch]$WhatIf
)

if ($Help) {
    Write-Host "NOOR Canvas PowerShell Profile Updater" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "USAGE:" -ForegroundColor Yellow
    Write-Host "  .\update-profile.ps1        # Update the profile to include iiskill"
    Write-Host "  .\update-profile.ps1 -WhatIf # Show what would be changed without making changes"
    Write-Host ""
    Write-Host "This script updates the PowerShell profile to include 'iiskill' in the"
    Write-Host "global commands loaded message."
    return
}

# Get the PowerShell profile path
$profilePath = $PROFILE

Write-Host "🔧 NOOR Canvas Profile Updater" -ForegroundColor Cyan
Write-Host "Profile Path: $profilePath" -ForegroundColor Gray

# Check if profile exists
if (-not (Test-Path $profilePath)) {
    Write-Host "ℹ️  PowerShell profile not found at: $profilePath" -ForegroundColor Yellow
    Write-Host "Run setup-global-commands.ps1 first to create the profile." -ForegroundColor Yellow
    return
}

# Read the current profile content
$profileContent = Get-Content $profilePath -Raw

# Check if the old message exists
$oldMessage = "nc, nct, ncdoc"
$newMessage = "nc, nct, ncdoc, iiskill"

if ($profileContent -like "*$oldMessage*" -and $profileContent -notlike "*iiskill*") {
    if ($WhatIf) {
        Write-Host "Would update profile to include 'iiskill' in global commands message" -ForegroundColor Yellow
        Write-Host "Old: nc, nct, ncdoc" -ForegroundColor Red
        Write-Host "New: nc, nct, ncdoc, iiskill" -ForegroundColor Green
    } else {
        Write-Host "Updating profile to include 'iiskill'..." -ForegroundColor Yellow
        $updatedContent = $profileContent -replace $oldMessage, $newMessage
        $updatedContent | Set-Content $profilePath -Encoding UTF8
        Write-Host "Profile updated successfully!" -ForegroundColor Green
        Write-Host "Restart your PowerShell session to see the updated message." -ForegroundColor Cyan
    }
} elseif ($profileContent -like "*iiskill*") {
    Write-Host "Profile already includes 'iiskill' in the global commands message" -ForegroundColor Green
} else {
    Write-Host "Could not find the expected global commands message in profile" -ForegroundColor Yellow
    Write-Host "Profile may need manual updating or recreation." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Current profile content:" -ForegroundColor Cyan
Write-Host $profileContent -ForegroundColor Gray
