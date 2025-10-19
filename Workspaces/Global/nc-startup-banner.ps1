# NOOR Canvas Startup Banner
# Displays available global commands when PowerShell starts in NOOR Canvas context

function Show-NoorCanvasBanner {
    $currentPath = Get-Location
    
    # Check if we're in NOOR CANVAS directory or subdirectory
    $isNoorCanvas = $false
    $checkPath = $currentPath
    
    while ($checkPath -and $checkPath.Path -ne [System.IO.Path]::GetPathRoot($checkPath.Path)) {
        if (Test-Path (Join-Path $checkPath "NoorCanvas.sln")) {
            $isNoorCanvas = $true
            break
        }
        $checkPath = $checkPath.Parent
    }
    
    # Also check common NOOR Canvas locations
    if (-not $isNoorCanvas) {
        $noorCanvasPaths = @(
            "D:\PROJECTS\NOOR CANVAS",
            "C:\PROJECTS\NOOR CANVAS"
        )
        
        foreach ($path in $noorCanvasPaths) {
            if ($currentPath.Path -like "$path*") {
                $isNoorCanvas = $true
                break
            }
        }
    }
    
    if ($isNoorCanvas) {
        Write-Host ""
        Write-Host "✅ NOOR Canvas Global Commands Loaded" -ForegroundColor Green
        Write-Host ""
        Write-Host "Available Commands:" -ForegroundColor Cyan
        Write-Host "  nc               " -NoNewline -ForegroundColor White
        Write-Host "- Start NOOR Canvas application" -ForegroundColor Gray
        Write-Host "  nct              " -NoNewline -ForegroundColor White
        Write-Host "- Generate host/user tokens for sessions" -ForegroundColor Gray
        Write-Host "  ncb              " -NoNewline -ForegroundColor White
        Write-Host "- Build NOOR Canvas project" -ForegroundColor Gray
        Write-Host "  ncdoc            " -NoNewline -ForegroundColor White
        Write-Host "- Start documentation server" -ForegroundColor Gray
        Write-Host "  iiskill          " -NoNewline -ForegroundColor White
        Write-Host "- Kill IIS Express processes" -ForegroundColor Gray
        Write-Host "  nc-prockill      " -NoNewline -ForegroundColor White
        Write-Host "- Kill NOOR Canvas processes" -ForegroundColor Gray
        Write-Host "  nc-build         " -NoNewline -ForegroundColor White
        Write-Host "- Advanced build with options" -ForegroundColor Gray
        Write-Host "  nc-cleanup       " -NoNewline -ForegroundColor White
        Write-Host "- Clean build artifacts" -ForegroundColor Gray
        Write-Host "  ncdeploy         " -NoNewline -ForegroundColor White
        Write-Host "- Deploy to production" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Type '<command> -Help' for detailed usage" -ForegroundColor Yellow
        Write-Host ""
    }
}

# Auto-run on profile load
Show-NoorCanvasBanner
