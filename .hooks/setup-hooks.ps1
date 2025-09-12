# NOOR Canvas Git Hooks Setup Script
# Installs Git hooks for automated testing workflow

param(
    [switch]$Uninstall,
    [switch]$Force
)

$WorkspaceRoot = "D:\PROJECTS\NOOR CANVAS"
$HooksDir = "$WorkspaceRoot\.hooks"
$GitHooksDir = "$WorkspaceRoot\.git\hooks"

function Write-Section {
    param([string]$Title)
    Write-Host ""
    Write-Host "▶ $Title" -ForegroundColor Yellow
}

if ($Uninstall) {
    Write-Section "Uninstalling Git Hooks"
    
    $hookFiles = @("pre-commit", "post-commit")
    foreach ($hook in $hookFiles) {
        $hookPath = "$GitHooksDir\$hook"
        if (Test-Path $hookPath) {
            Remove-Item $hookPath -Force
            Write-Host "✅ Removed $hook hook" -ForegroundColor Green
        }
    }
    
    Write-Host "✅ Git hooks uninstalled successfully" -ForegroundColor Green
    exit 0
}

Write-Section "Installing NOOR Canvas Git Hooks"

# Ensure .git/hooks directory exists
if (-not (Test-Path $GitHooksDir)) {
    New-Item -ItemType Directory -Path $GitHooksDir -Force | Out-Null
}

# Install pre-commit hook
$preCommitContent = @'
#!/bin/sh
# NOOR Canvas Pre-Commit Hook
# Automatically runs tests before commit

echo "Running pre-commit tests..."
pwsh -ExecutionPolicy Bypass -File "D:\PROJECTS\NOOR CANVAS\.hooks\pre-commit-test.ps1"
exit $?
'@

$preCommitPath = "$GitHooksDir\pre-commit"
if ((Test-Path $preCommitPath) -and -not $Force) {
    Write-Host "⚠️ pre-commit hook already exists. Use -Force to overwrite." -ForegroundColor Yellow
} else {
    Set-Content -Path $preCommitPath -Value $preCommitContent -NoNewline
    Write-Host "✅ Installed pre-commit hook" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 Git hooks installation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Automated Testing Workflow:" -ForegroundColor Cyan
Write-Host "  📋 After Build: Tests run automatically" -ForegroundColor White
Write-Host "  🔍 Before Commit: Tests run only if code changed" -ForegroundColor White
Write-Host "  💾 Smart Caching: Skips redundant test runs" -ForegroundColor White
Write-Host ""
Write-Host "Usage:" -ForegroundColor Cyan
Write-Host "  Build: Tests run automatically after successful build" -ForegroundColor White
Write-Host "  Commit: Tests run automatically before git commit" -ForegroundColor White
Write-Host "  Manual: Run .hooks\pre-commit-test.ps1 -Force for manual testing" -ForegroundColor White
