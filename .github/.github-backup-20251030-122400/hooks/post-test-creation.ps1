# Post-Test Creation Hook
# Automatically updates the global test registry when new tests are created
# This should be called after creating any new Playwright test

param(
    [Parameter(Mandatory=$false)]
    [string]$TestFile,
    
    [Parameter(Mandatory=$false)]
    [switch]$Silent
)

$ErrorActionPreference = "Continue"

# Get workspace root
$workspaceRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent

# Path to rebuild script
$rebuildScript = Join-Path $workspaceRoot ".github\scripts\rebuild-test-index.ps1"

if (-not $Silent) {
    Write-Host "`nUpdating global test registry..." -ForegroundColor Cyan
}

try {
    # Run the rebuild script
    & $rebuildScript
    
    if ($LASTEXITCODE -eq 0) {
        if (-not $Silent) {
            Write-Host "Test registry updated successfully" -ForegroundColor Green
        }
        
        # Auto-stage the updated test-index.json if we're in a git repo
        $testIndexPath = Join-Path $workspaceRoot ".github\tests\test-index.json"
        if (Test-Path $testIndexPath) {
            Push-Location $workspaceRoot
            try {
                git add $testIndexPath 2>$null
                if (-not $Silent) {
                    Write-Host "test-index.json staged for commit" -ForegroundColor Gray
                }
            }
            finally {
                Pop-Location
            }
        }
    }
}
catch {
    if (-not $Silent) {
        Write-Warning "Failed to update test registry: $_"
    }
}
