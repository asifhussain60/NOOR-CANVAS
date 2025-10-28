# Validate-Production-URLs.ps1
# Validates all app.config files have correct BaseUrl values
# Part of host-provisioner-domain-fix plan

$ErrorActionPreference = "Stop"

Write-Host "🔍 Validating Host Provisioner Production URLs..." -ForegroundColor Cyan
Write-Host ""

$errors = @()
$warnings = @()
$validated = 0

# Expected values
$expectedProdUrl = "https://noorcanvas.kashkole.com"
$expectedDevUrl = "https://localhost:9091"

# Find all app.config files in HostProvisioner directory
$configFiles = Get-ChildItem -Path "$PSScriptRoot\..\..\..\..\Tools\HostProvisioner" -Filter "app.config" -Recurse -File

foreach ($file in $configFiles) {
    $relativePath = $file.FullName -replace [regex]::Escape($PSScriptRoot), '.'
    Write-Host "Checking: $relativePath" -ForegroundColor Gray
    
    try {
        [xml]$xml = Get-Content $file.FullName
        
        # Check Production URL
        $prodUrlNode = $xml.SelectSingleNode("//configuration/appSettings/add[@key='BaseUrl_Production']")
        if ($prodUrlNode) {
            $prodUrl = $prodUrlNode.GetAttribute("value")
            
            if ($prodUrl -ne $expectedProdUrl) {
                $errors += "  ❌ Wrong Production URL: $prodUrl (expected: $expectedProdUrl)"
                $errors += "     File: $($file.FullName)"
            } else {
                Write-Host "  ✅ Production URL: $prodUrl" -ForegroundColor Green
                $validated++
            }
        } else {
            $warnings += "  ⚠️  No BaseUrl_Production found in $($file.Name)"
        }
        
        # Check Development URL
        $devUrlNode = $xml.SelectSingleNode("//configuration/appSettings/add[@key='BaseUrl_Development']")
        if ($devUrlNode) {
            $devUrl = $devUrlNode.GetAttribute("value")
            
            if ($devUrl -ne $expectedDevUrl) {
                $errors += "  ❌ Wrong Development URL: $devUrl (expected: $expectedDevUrl)"
                $errors += "     File: $($file.FullName)"
            } else {
                Write-Host "  ✅ Development URL: $devUrl" -ForegroundColor Green
            }
        } else {
            $warnings += "  ⚠️  No BaseUrl_Development found in $($file.Name)"
        }
        
    } catch {
        $errors += "  ❌ Failed to parse XML: $($file.FullName)"
        $errors += "     Error: $($_.Exception.Message)"
    }
    
    Write-Host ""
}

# Display summary
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "📊 Validation Summary" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""

if ($errors.Count -eq 0 -and $warnings.Count -eq 0) {
    Write-Host "✅ All URLs valid!" -ForegroundColor Green
    Write-Host "   Production: $expectedProdUrl" -ForegroundColor Gray
    Write-Host "   Development: $expectedDevUrl" -ForegroundColor Gray
    Write-Host "   Files validated: $validated" -ForegroundColor Gray
    exit 0
} else {
    if ($errors.Count -gt 0) {
        Write-Host "❌ Validation Failed" -ForegroundColor Red
        Write-Host ""
        foreach ($errMsg in $errors) {
            Write-Host $errMsg -ForegroundColor Red
        }
    }
    
    if ($warnings.Count -gt 0) {
        Write-Host ""
        Write-Host "⚠️  Warnings" -ForegroundColor Yellow
        Write-Host ""
        foreach ($warnMsg in $warnings) {
            Write-Host $warnMsg -ForegroundColor Yellow
        }
    }
    
    Write-Host ""
    exit 1
}
