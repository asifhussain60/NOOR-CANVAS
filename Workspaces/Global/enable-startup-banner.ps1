# Enable NOOR Canvas Startup Banner
# Replaces the [suppressed] comment with actual banner loader

param(
    [switch]$Help,
    [switch]$Disable
)

if ($Help) {
    Write-Host "NOOR Canvas Startup Banner Enabler" -ForegroundColor Cyan
    Write-Host "===================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "USAGE:" -ForegroundColor Yellow
    Write-Host "  .\enable-startup-banner.ps1           # Enable startup banner"
    Write-Host "  .\enable-startup-banner.ps1 -Disable  # Disable startup banner"
    Write-Host "  .\enable-startup-banner.ps1 -Help     # Show this help"
    Write-Host ""
    Write-Host "DESCRIPTION:" -ForegroundColor Green
    Write-Host "  Adds/removes the NOOR Canvas startup banner that displays available"
    Write-Host "  global commands when opening PowerShell in NOOR Canvas directory."
    Write-Host ""
    Write-Host "SIMILAR TO:" -ForegroundColor Cyan
    Write-Host "  KSESSIONS displays its global commands on startup"
    Write-Host "  NOOR Canvas will now show: nc, nct, ncb, ncdoc, iiskill, etc."
    return
}

$profilePath = $PROFILE
$bannerScriptPath = "D:\PROJECTS\NOOR CANVAS\Workspaces\Global\nc-startup-banner.ps1"

Write-Host "NOOR Canvas Startup Banner Configuration" -ForegroundColor Cyan
Write-Host "Profile: $profilePath" -ForegroundColor Gray
Write-Host ""

if (-not (Test-Path $profilePath)) {
    Write-Host "ERROR: PowerShell profile not found" -ForegroundColor Red
    Write-Host "Profile should exist at: $profilePath" -ForegroundColor Yellow
    return
}

$profileContent = Get-Content $profilePath -Raw

if ($Disable) {
    # Replace banner loader with suppressed comment
    $oldPattern = "# Load NOOR Canvas startup banner\r?\nif \(Test-Path '$bannerScriptPath'\) \{\r?\n    \. '$bannerScriptPath'\r?\n\}"
    $newText = "# [suppressed] NOOR Canvas banner"
    
    if ($profileContent -match $oldPattern) {
        $updatedContent = $profileContent -replace $oldPattern, $newText
        $updatedContent | Set-Content $profilePath -Encoding UTF8
        Write-Host "[OK] Startup banner DISABLED" -ForegroundColor Green
        Write-Host ""
        Write-Host "Restart PowerShell to apply changes" -ForegroundColor Yellow
    } else {
        Write-Host "Startup banner is already disabled or not found" -ForegroundColor Yellow
    }
} else {
    # Replace suppressed comment with banner loader
    $oldText = "# [suppressed] NOOR Canvas banner"
    $newText = @"
# Load NOOR Canvas startup banner
if (Test-Path '$bannerScriptPath') {
    . '$bannerScriptPath'
}
"@
    
    if ($profileContent -match [regex]::Escape($oldText)) {
        $updatedContent = $profileContent -replace [regex]::Escape($oldText), $newText
        $updatedContent | Set-Content $profilePath -Encoding UTF8
        Write-Host "[OK] Startup banner ENABLED" -ForegroundColor Green
        Write-Host ""
        Write-Host "Banner will display when opening PowerShell in NOOR Canvas directory" -ForegroundColor Cyan
        Write-Host "Similar to KSESSIONS global commands message" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Restart PowerShell or run: . `$PROFILE" -ForegroundColor Yellow
    } elseif ($profileContent -match "nc-startup-banner\.ps1") {
        Write-Host "Startup banner is already enabled" -ForegroundColor Green
    } else {
        Write-Host "Could not find insertion point in profile" -ForegroundColor Red
        Write-Host "Manual edit may be required" -ForegroundColor Yellow
    }
}
