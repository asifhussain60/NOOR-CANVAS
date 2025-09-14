# NOOR Canvas Global Commands Setup
# Run this script once to add the Global commands to your system PATH

param(
    [switch]$Help,
    [switch]$Remove
)

if ($Help) {
    Write-Host "NOOR Canvas Global Commands Setup" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "USAGE:" -ForegroundColor Yellow
    Write-Host "  .\setup-global-commands.ps1        # Add Global folder to PATH"
    Write-Host "  .\setup-global-commands.ps1 -Remove # Remove from PATH"
    Write-Host ""
    Write-Host "This script modifies the user PATH environment variable to include"
    Write-Host "the Global commands folder, allowing you to run 'nc' from anywhere."
    return
}

$globalDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Write-Host "🔧 NOOR Canvas Global Commands Setup" -ForegroundColor Cyan
Write-Host "Global Directory: $globalDir" -ForegroundColor Gray

# Get current user PATH
$currentPath = [Environment]::GetEnvironmentVariable("PATH", "User")
$pathExists = $currentPath -like "*$globalDir*"

if ($Remove) {
    if ($pathExists) {
        Write-Host "🗑️  Removing from PATH..." -ForegroundColor Yellow
        $newPath = ($currentPath -split ';' | Where-Object { $_ -ne $globalDir }) -join ';'
        [Environment]::SetEnvironmentVariable("PATH", $newPath, "User")
        Write-Host "✅ Removed from PATH. Restart your terminal to apply changes." -ForegroundColor Green
    } else {
        Write-Host "ℹ️  Global directory not found in PATH" -ForegroundColor Yellow
    }
} else {
    if ($pathExists) {
        Write-Host "ℹ️  Global directory already in PATH" -ForegroundColor Yellow
        Write-Host "✅ nc command should be available from anywhere" -ForegroundColor Green
    } else {
        Write-Host "➕ Adding to PATH..." -ForegroundColor Yellow
        $newPath = if ($currentPath) { "$currentPath;$globalDir" } else { $globalDir }
        [Environment]::SetEnvironmentVariable("PATH", $newPath, "User")
        Write-Host "✅ Added to PATH. Restart your terminal to apply changes." -ForegroundColor Green
        Write-Host ""
        Write-Host "AVAILABLE COMMANDS:" -ForegroundColor Cyan
        Write-Host "  nc              # Start NOOR Canvas application"
        Write-Host "  nc -Help        # Show detailed usage help"
        Write-Host "  nct create 123  # Create host token for session 123"
        Write-Host "  nct -Help       # Show token provisioner help"
        Write-Host "  iiskill         # Kill all IIS Express processes (silent)"
        Write-Host "  iiskill -Verbose # Kill IIS processes with detailed output"
        Write-Host "  ksrun -Test     # Launch app with testing suite"
        Write-Host "  ksrun -Help     # Show testing launcher options"
    }
}

Write-Host ""
Write-Host "📝 Usage after restart:" -ForegroundColor Cyan
Write-Host "  nc                       # Quick start NOOR Canvas"
Write-Host "  nc -Build                # Build and run"
Write-Host "  nc -Https                # Run with HTTPS"
Write-Host "  nc -Help                 # Show all options"
Write-Host "  nct create 123           # Create host token for session 123"
Write-Host "  nct rotate 456           # Rotate existing host token"
Write-Host "  nct -Help                # Show token provisioner help"
Write-Host "  iiskill                  # Kill all IIS Express processes (silent)"
Write-Host "  iiskill -Verbose         # Kill IIS processes with detailed output"
Write-Host "  iiskill -Help            # Show IIS kill command help"
Write-Host "  ksrun -Test              # Launch with testing suite"
Write-Host "  ksrun -Build -Test       # Build, run, and test"
