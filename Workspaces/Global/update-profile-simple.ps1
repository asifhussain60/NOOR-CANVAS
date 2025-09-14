# NOOR Canvas PowerShell Profile Updater
# Updates the PowerShell profile to include iiskill in global commands message

param(
    [switch]$WhatIf
)

$profilePath = $PROFILE

Write-Host "NOOR Canvas Profile Updater" -ForegroundColor Cyan
Write-Host "Profile Path: $profilePath" -ForegroundColor Gray
Write-Host ""

if (-not (Test-Path $profilePath)) {
    Write-Host "PowerShell profile not found at: $profilePath" -ForegroundColor Yellow
    Write-Host "No profile exists to update." -ForegroundColor Yellow
    return
}

$profileContent = Get-Content $profilePath -Raw

if ($profileContent -like "*nc, nct, ncdoc*" -and $profileContent -notlike "*iiskill*") {
    if ($WhatIf) {
        Write-Host "Would update profile to include 'iiskill' in global commands message" -ForegroundColor Yellow
        Write-Host "Change: nc, nct, ncdoc -> nc, nct, ncdoc, iiskill" -ForegroundColor Green
    } else {
        Write-Host "Updating profile to include 'iiskill'..." -ForegroundColor Yellow
        $updatedContent = $profileContent -replace "nc, nct, ncdoc", "nc, nct, ncdoc, iiskill"
        $updatedContent | Set-Content $profilePath -Encoding UTF8
        Write-Host "Profile updated successfully!" -ForegroundColor Green
        Write-Host "Restart your PowerShell session to see the updated message." -ForegroundColor Cyan
    }
} elseif ($profileContent -like "*iiskill*") {
    Write-Host "Profile already includes 'iiskill' in the global commands message" -ForegroundColor Green
} else {
    Write-Host "Could not find the expected global commands message in profile" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Current profile content:" -ForegroundColor Cyan
Write-Host "------------------------" -ForegroundColor Gray
Write-Host $profileContent -ForegroundColor White
