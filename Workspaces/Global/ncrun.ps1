# DEPRECATED: ncrun command has been removed
# Use 'nc' command instead

Write-Host "⚠️  DEPRECATED: ncrun command has been removed" -ForegroundColor Yellow
Write-Host "🔄 Use 'nc' command instead:" -ForegroundColor Cyan
Write-Host "   nc           # Start NOOR Canvas"
Write-Host "   nc -Test     # Start with Testing Suite"  
Write-Host "   nc -Help     # Show all options"
Write-Host ""

# Redirect to nc command
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ncPath = Join-Path $scriptDir "nc.ps1"

if (Test-Path $ncPath) {
    Write-Host "🔄 Redirecting to nc command..." -ForegroundColor Gray
    & $ncPath @args
} else {
    Write-Error "❌ nc.ps1 not found. Please use the nc command directly."
}

return

param(
    [switch]$Help,
    [switch]$Build,
    [switch]$NoBrowser,
    [string]$Port = "9090",
    [switch]$Https,
    [switch]$Test
)

if ($Help) {
    Write-Host "NOOR Canvas Run Command (ncrun) - The Single Development Command" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "USAGE:" -ForegroundColor Yellow
    Write-Host "  ncrun                    # Run app and open browser"
    Write-Host "  ncrun -Build             # Build first, then run"
    Write-Host "  ncrun -NoBrowser         # Run without opening browser"
    Write-Host "  ncrun -Https             # Use HTTPS on port 9091"
    Write-Host "  ncrun -Port 8080         # Use custom port"
    Write-Host "  ncrun -Test              # Build + Launch app + testing suite with auto token"
    Write-Host ""
    Write-Host "EXAMPLES:" -ForegroundColor Green
    Write-Host "  ncrun                    # Quick start"
    Write-Host "  ncrun -Build             # Clean build and run"
    Write-Host "  ncrun -Test              # Complete testing workflow"
    Write-Host "  ncrun -Test -Https       # Testing with HTTPS"
    Write-Host ""
    Write-Host "NOTES:" -ForegroundColor Magenta
    Write-Host "  • -Test mode automatically builds the application"
    Write-Host "  • Testing suite includes auto host token generation"
    Write-Host "  • Use Ctrl+C to stop the development server"
    return
}

Write-Host "🚀 NOOR Canvas Launcher - Single Development Command" -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Split-Path -Parent (Split-Path -Parent $scriptDir)
$targetDir = Join-Path $rootDir "SPA\NoorCanvas"
$testingSuiteFile = Join-Path $rootDir "SPA\NoorCanvas\wwwroot\testing\index.html"

if (-not (Test-Path $targetDir)) {
    Write-Error "Target not found: $targetDir"
    return 1
}

Set-Location $targetDir
Write-Host "📁 Changed to: $(Get-Location)" -ForegroundColor Green

# Auto-build in Test mode or when explicitly requested
if ($Test -or $Build) {
    if ($Test) {
        Write-Host "🧪 Test Mode: Building application..." -ForegroundColor Magenta
    } else {
        Write-Host "🔨 Building..." -ForegroundColor Yellow
    }
    
    # Ensure packages are restored
    dotnet restore --verbosity quiet
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Package restore failed"
        return $LASTEXITCODE
    }
    
    dotnet build --no-restore
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Build failed"
        return $LASTEXITCODE
    }
    Write-Host "✅ Build successful" -ForegroundColor Green
}

if ($Https) {
    $urls = "https://localhost:9091"
    $browserUrl = "https://localhost:9091"
} else {
    $urls = "http://localhost:$Port"
    $browserUrl = "http://localhost:$Port"
}

Write-Host "🌐 Starting: $urls" -ForegroundColor Cyan

if (-not $NoBrowser) {
    if ($Test) {
        Write-Host "🧪 Test Mode: Opening app + testing suite..." -ForegroundColor Magenta
        
        # Verify testing suite file exists
        if (-not (Test-Path $testingSuiteFile)) {
            Write-Warning "Testing suite not found at: $testingSuiteFile"
            Write-Host "Opening application only..." -ForegroundColor Yellow
        }
        
        # Generate testing suite URL based on server URL
        $testingSuiteUrl = if ($Https) {
            "https://localhost:9091/testing/"
        } else {
            "http://localhost:$Port/testing/"
        }
        
        Start-Job -ScriptBlock {
            param($appUrl, $testUrl)
            # Wait for app to start
            Start-Sleep -Seconds 3
            
            # Open the application
            Write-Host "🌐 Opening NOOR Canvas application..."
            Start-Process $appUrl
            
            # Open testing suite via web server
            Start-Sleep -Seconds 1
            Write-Host "🧪 Opening manual testing suite via web server..."
            Start-Process $testUrl
        } -ArgumentList $browserUrl, $testingSuiteUrl | Out-Null
        
        Write-Host "📋 Testing Suite Features:" -ForegroundColor Cyan
        Write-Host "   • Automatic host token generation" -ForegroundColor Green
        Write-Host "   • 5 comprehensive test use cases" -ForegroundColor Green
        Write-Host "   • 20 detailed test steps with validation" -ForegroundColor Green
        Write-Host "   • Real-time progress tracking" -ForegroundColor Green
    } else {
        Write-Host "🌐 Opening browser..." -ForegroundColor Green
        Start-Job -ScriptBlock {
            param($url)
            Start-Sleep -Seconds 3
            Start-Process $url
        } -ArgumentList $browserUrl | Out-Null
    }
}

Write-Host "▶️ Starting NOOR Canvas..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow

dotnet run --urls $urls
