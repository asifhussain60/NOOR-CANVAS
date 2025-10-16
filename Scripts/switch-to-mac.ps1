# Switch Database Connection Strings to macOS
# Replaces AHHOME with 192.168.1.58,1433 for remote SQL Server access

param(
    [switch]$WhatIf
)

$rootPath = "D:\PROJECTS\NOOR CANVAS"
$files = @(
    "config\sharedsettings.json",
    "SPA\NoorCanvas\appsettings.json",
    "SPA\NoorCanvas\appsettings.Development.json",
    "SPA\NoorCanvas\appsettings.Production.json",
    "Tools\HostProvisioner\HostProvisioner\appsettings.json",
    "Tools\HostProvisioner\HostProvisioner\appsettings.Development.json",
    "Tools\HostProvisioner\HostProvisioner\appsettings.Production.json",
    "Tools\HostProvisioner\HostProvisioner.WinForms\appsettings.json",
    "Tools\HostProvisioner\HostProvisioner.WinForms\appsettings.Development.json",
    "Tools\HostProvisioner\HostProvisioner.WinForms\appsettings.Production.json",
    "Tools\HostProvisioner\HostProvisioner.WinForms\app.config",
    "Scripts\publish-hostprovisioner.ps1"
)

Write-Host "`n🔄 Switching to macOS configuration (192.168.1.58,1433)...`n" -ForegroundColor Cyan

$updatedCount = 0

foreach ($file in $files) {
    $fullPath = Join-Path $rootPath $file
    
    if (Test-Path $fullPath) {
        $content = Get-Content $fullPath -Raw
        $newContent = $content -replace 'Server=AHHOME', 'Server=192.168.1.58,1433'
        
        if ($content -ne $newContent) {
            if ($WhatIf) {
                Write-Host "  [WOULD UPDATE] $file" -ForegroundColor Yellow
            } else {
                Set-Content -Path $fullPath -Value $newContent -NoNewline
                Write-Host "  ✅ Updated: $file" -ForegroundColor Green
                $updatedCount++
            }
        } else {
            Write-Host "  ⏭️  No change: $file (already configured)" -ForegroundColor Gray
        }
    } else {
        Write-Host "  ⚠️  Not found: $file" -ForegroundColor Yellow
    }
}

if ($WhatIf) {
    Write-Host "`n🔍 Dry run complete. Use without -WhatIf to apply changes.`n" -ForegroundColor Cyan
} else {
    Write-Host "`n✅ Updated $updatedCount file(s) for macOS" -ForegroundColor Green
    Write-Host "⚠️  Keep these changes LOCAL - do NOT commit to Git!`n" -ForegroundColor Yellow
}
