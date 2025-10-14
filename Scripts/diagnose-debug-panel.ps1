# Debug Panel Diagnostic Script
# Purpose: Diagnose why debug panels are not showing
# Usage: .\diagnose-debug-panel.ps1

Write-Host "=== Debug Panel Diagnostic ===" -ForegroundColor Cyan
Write-Host ""

# 1. Check ASPNETCORE_ENVIRONMENT
Write-Host "1. Environment Variable Check:" -ForegroundColor Yellow
$env = $env:ASPNETCORE_ENVIRONMENT
if ($env) {
    Write-Host "   ASPNETCORE_ENVIRONMENT = $env" -ForegroundColor Green
} else {
    Write-Host "   ❌ ASPNETCORE_ENVIRONMENT is NOT SET!" -ForegroundColor Red
    Write-Host "   This is likely the issue. Setting it now..." -ForegroundColor Yellow
    $env:ASPNETCORE_ENVIRONMENT = "Development"
    Write-Host "   ✅ Set to: Development" -ForegroundColor Green
}
Write-Host ""

# 2. Check appsettings.Development.json
Write-Host "2. Configuration File Check:" -ForegroundColor Yellow
$appSettingsPath = "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas\appsettings.Development.json"
if (Test-Path $appSettingsPath) {
    Write-Host "   ✅ appsettings.Development.json exists" -ForegroundColor Green
    $content = Get-Content $appSettingsPath -Raw | ConvertFrom-Json
    $showPanels = $content.Development.ShowDevPanels
    $enableDebug = $content.Development.EnableDebugFeatures
    Write-Host "   ShowDevPanels: $showPanels" -ForegroundColor $(if ($showPanels) { "Green" } else { "Red" })
    Write-Host "   EnableDebugFeatures: $enableDebug" -ForegroundColor $(if ($enableDebug) { "Green" } else { "Red" })
} else {
    Write-Host "   ❌ appsettings.Development.json NOT FOUND" -ForegroundColor Red
}
Write-Host ""

# 3. Check launchSettings.json
Write-Host "3. Launch Settings Check:" -ForegroundColor Yellow
$launchSettingsPath = "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas\Properties\launchSettings.json"
if (Test-Path $launchSettingsPath) {
    Write-Host "   ✅ launchSettings.json exists" -ForegroundColor Green
    $launchSettings = Get-Content $launchSettingsPath -Raw | ConvertFrom-Json
    $noorCanvasEnv = $launchSettings.profiles.NoorCanvas.environmentVariables.ASPNETCORE_ENVIRONMENT
    Write-Host "   NoorCanvas profile ASPNETCORE_ENVIRONMENT: $noorCanvasEnv" -ForegroundColor Green
} else {
    Write-Host "   ❌ launchSettings.json NOT FOUND" -ForegroundColor Red
}
Write-Host ""

# 4. Check DevModeService registration
Write-Host "4. Service Registration Check:" -ForegroundColor Yellow
$programPath = "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas\Program.cs"
if (Test-Path $programPath) {
    $programContent = Get-Content $programPath -Raw
    if ($programContent -match "IDevModeService.*DevModeService") {
        Write-Host "   ✅ DevModeService is registered in Program.cs" -ForegroundColor Green
    } else {
        Write-Host "   ❌ DevModeService registration NOT FOUND in Program.cs" -ForegroundColor Red
    }
} else {
    Write-Host "   ❌ Program.cs NOT FOUND" -ForegroundColor Red
}
Write-Host ""

# 5. Check DebugPanel component
Write-Host "5. DebugPanel Component Check:" -ForegroundColor Yellow
$debugPanelPath = "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas\Components\Development\DebugPanel.razor"
if (Test-Path $debugPanelPath) {
    Write-Host "   ✅ DebugPanel.razor exists" -ForegroundColor Green
    $debugPanelContent = Get-Content $debugPanelPath -Raw
    if ($debugPanelContent -match "@if \(DevModeService\.ShowDevPanels\)") {
        Write-Host "   ✅ DebugPanel checks DevModeService.ShowDevPanels" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  DebugPanel may have different visibility logic" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ❌ DebugPanel.razor NOT FOUND" -ForegroundColor Red
}
Write-Host ""

# 6. Summary and Recommendations
Write-Host "=== Summary and Recommendations ===" -ForegroundColor Cyan
Write-Host ""

if (-not $env) {
    Write-Host "⚠️  PRIMARY ISSUE: ASPNETCORE_ENVIRONMENT not set in current session" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "SOLUTIONS:" -ForegroundColor Yellow
    Write-Host "  1. Run app via: dotnet run (uses launchSettings.json)" -ForegroundColor White
    Write-Host "  2. Set manually before running:" -ForegroundColor White
    Write-Host "     `$env:ASPNETCORE_ENVIRONMENT = 'Development'" -ForegroundColor Cyan
    Write-Host "     dotnet run" -ForegroundColor Cyan
    Write-Host "  3. Use VS Code launch profile (uses launchSettings.json)" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "✅ Environment is configured correctly!" -ForegroundColor Green
    Write-Host ""
    Write-Host "If debug panel still not showing:" -ForegroundColor Yellow
    Write-Host "  1. Clear browser cache (Ctrl+Shift+Delete)" -ForegroundColor White
    Write-Host "  2. Check browser console for JavaScript errors (F12)" -ForegroundColor White
    Write-Host "  3. Verify CSS file loaded: wwwroot/css/debug-panel.css" -ForegroundColor White
    Write-Host "  4. Check z-index conflicts with other elements" -ForegroundColor White
    Write-Host ""
}

Write-Host "=== Diagnostic Complete ===" -ForegroundColor Cyan
