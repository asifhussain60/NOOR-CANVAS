# ========================================================================
# PRE-BUILD VALIDATION - Issue-67 Protection Integration
# ========================================================================
# Purpose: Integrate Issue-67 protection into build pipeline
# Triggered: Before any build/publish operation
# Status: ACTIVE PROTECTION
# ========================================================================

Write-Host ""
Write-Host "🔒 PRE-BUILD VALIDATION: Issue-67 Protection Check" -ForegroundColor Cyan
Write-Host "───────────────────────────────────────────────────────" -ForegroundColor Gray

# Execute Issue-67 protection validation
$protectionScript = Join-Path $PSScriptRoot ".guards\Issue-67-Protection.ps1"

if (Test-Path $protectionScript) {
    try {
        $result = & powershell -ExecutionPolicy Bypass -File $protectionScript -Mode validate
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Issue-67 Protection: PASSED" -ForegroundColor Green
            Write-Host "🛡️  Two-Step UX Workflow integrity confirmed" -ForegroundColor Green
        } else {
            Write-Host "❌ Issue-67 Protection: FAILED" -ForegroundColor Red
            Write-Host "🚨 Build blocked due to UX workflow violations" -ForegroundColor Red
            Write-Host ""
            Write-Host "To resolve:" -ForegroundColor Yellow
            Write-Host "1. Review protection report: .\\.guards\\Issue-67-Protection.ps1 -Mode report" -ForegroundColor Yellow
            Write-Host "2. Ensure two-step workflow structure is preserved" -ForegroundColor Yellow
            Write-Host "3. Verify both host-card and participant-card elements exist" -ForegroundColor Yellow
            Write-Host "4. Check GetCardClasses method implementation" -ForegroundColor Yellow
            
            exit 1
        }
    } catch {
        Write-Host "⚠️  Issue-67 Protection script error: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host "🔄 Continuing build with warning..." -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  Issue-67 Protection script not found: $protectionScript" -ForegroundColor Yellow
    Write-Host "🔄 Continuing build without protection validation..." -ForegroundColor Yellow
}

Write-Host "───────────────────────────────────────────────────────" -ForegroundColor Gray
Write-Host ""
