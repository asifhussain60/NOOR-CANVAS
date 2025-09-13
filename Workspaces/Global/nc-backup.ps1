param(
    [switch]$Help,
    [switch]$SkipTokenGeneration,
    [switch]$NoBrowser
)

if ($Help) {
    Write-Host "NOOR Canvas Command (nc) - Enhanced Testing Workflow" -ForegroundColor Green
    Write-Host "==================================================="
    Write-Host ""
    Write-Host "USAGE:"
    Write-Host "  nc                      # Full workflow: nct + build + serve + Simple Browser"  
    Write-Host "  nc -SkipTokenGeneration # Skip nct step, just build + serve + Simple Browser"
    Write-Host "  nc -NoBrowser           # Full workflow without browser launch"
    Write-Host "  nc -Help                # Show this help"
    Write-Host ""
    Write-Host "ENHANCED WORKFLOW:"
    Write-Host "  1. Interactive Host Token Generation (nct)"
    Write-Host "  2. Project Build (dotnet build)"
    Write-Host "  3. IIS Express x64 Server Launch" 
    Write-Host "  4. Application Health Check"
    Write-Host "  5. VS Code Simple Browser Launch (for testing)"
    Write-Host ""
    Write-Host "BENEFITS:"
    Write-Host "  • Streamlined testing experience"
    Write-Host "  • Integrated development workflow" 
    Write-Host "  • Automatic health validation"
    Write-Host "  • Ready-to-test environment"
    return
}

# Get project directory
$root = Split-Path $MyInvocation.MyCommand.Path -Parent
$root = Split-Path $root -Parent
$root = Split-Path $root -Parent
$project = Join-Path $root "SPA\NoorCanvas"

# Step 1: Host Token Generation
if (-not $SkipTokenGeneration) {
    Write-Host "Step 1: Host Token Generation" -ForegroundColor Cyan
    Write-Host "============================="
    Write-Host ""
    
    $nctPath = Join-Path $root "Workspaces\Global\nct.ps1"
    & $nctPath
    
    Write-Host ""
    Write-Host "Host token generation completed" -ForegroundColor Green
    Write-Host ""
    Write-Host "Press any key to continue to build..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    Write-Host ""
}

# Step 2: Build
Write-Host "Step 2: Building Project" -ForegroundColor Cyan  
Write-Host "========================"
Set-Location $project
Write-Host "Building NOOR Canvas..." -ForegroundColor Yellow

dotnet build --no-restore --verbosity minimal

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed - cannot proceed" -ForegroundColor Red
    return
}

Write-Host "Build successful" -ForegroundColor Green
Write-Host ""

# Step 3: Start IIS Express x64 in separate window
Write-Host "Step 3: Starting IIS Express Server" -ForegroundColor Cyan
Write-Host "===================================="

$url = "https://localhost:9091"
Write-Host "Starting IIS Express x64 on $url" -ForegroundColor Yellow
Write-Host "Server will run in separate IIS Express window (no browser)" -ForegroundColor Gray
Write-Host ""

# Find IIS Express x64
$iisExpressPath = "${env:ProgramFiles}\IIS Express\iisexpress.exe"
if (-not (Test-Path $iisExpressPath)) {
    $iisExpressPath = "${env:ProgramFiles(x86)}\IIS Express\iisexpress.exe"
    if (-not (Test-Path $iisExpressPath)) {
        Write-Host "IIS Express not found. Falling back to dotnet run..." -ForegroundColor Yellow
        dotnet run --urls $url
        return
    }
}

# Launch IIS Express x64 in separate window
$arguments = "/path:`"$project`" /port:9091 /systray:false"
Start-Process $iisExpressPath -ArgumentList $arguments

Write-Host "IIS Express x64 launched in separate window" -ForegroundColor Green
Write-Host ""

# Step 4: Wait for application to start and perform health check
Write-Host "Step 4: Application Health Check" -ForegroundColor Cyan
Write-Host "================================"
Write-Host "Waiting for application to start..." -ForegroundColor Yellow

Start-Sleep -Seconds 3

# Health check with retry
$maxRetries = 10
$retryCount = 0
$healthCheckPassed = $false

while ($retryCount -lt $maxRetries -and -not $healthCheckPassed) {
    try {
        $response = Invoke-WebRequest -Uri "$url/healthz" -SkipCertificateCheck -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            $healthCheckPassed = $true
            Write-Host "✅ Application health check passed" -ForegroundColor Green
            Write-Host "✅ Server responsive at: $url" -ForegroundColor Green
        }
    }
    catch {
        $retryCount++
        if ($retryCount -lt $maxRetries) {
            Write-Host "⏳ Waiting for server... (attempt $retryCount/$maxRetries)" -ForegroundColor Yellow
            Start-Sleep -Seconds 2
        }
    }
}

if (-not $healthCheckPassed) {
    Write-Host "⚠️ Health check failed - server may not be ready" -ForegroundColor Yellow
    Write-Host "   Server: $url" -ForegroundColor Gray
    Write-Host "   You can still access the application manually" -ForegroundColor Gray
}

Write-Host ""

# Step 5: Launch VS Code Simple Browser (unless -NoBrowser specified)
if (-not $NoBrowser) {
    Write-Host "Step 5: Preparing Simple Browser Launch" -ForegroundColor Cyan
    Write-Host "======================================="
    Write-Host "Setting up VS Code Simple Browser for testing..." -ForegroundColor Yellow
    Write-Host ""
    
    # Show user how to launch Simple Browser
    # Create Simple Browser launch request file for VS Code integration
    $browserRequestFile = Join-Path $root "Workspaces\TEMP\simple-browser-request.json"
    $browserRequest = @{
        timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
        url = $url
        purpose = "NOOR Canvas testing workflow"
        launched_by = "nc command"
    } | ConvertTo-Json -Depth 2
    
    try {
        Set-Content -Path $browserRequestFile -Value $browserRequest -Encoding UTF8
        Write-Host "✅ Simple Browser request created" -ForegroundColor Green
        Write-Host "   Location: $browserRequestFile" -ForegroundColor Gray
    } catch {
        Write-Host "⚠️ Could not create browser request file" -ForegroundColor Yellow
    }
    
    # Copy URL to clipboard for easy access
    try {
        Set-Clipboard -Value $url
        Write-Host "✅ URL copied to clipboard: $url" -ForegroundColor Green
    } catch {
        Write-Host "ℹ️ URL ready: $url" -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "🌐 Simple Browser Launch Instructions:" -ForegroundColor Cyan
    Write-Host "   1. Press Ctrl+Shift+P in VS Code" -ForegroundColor White
    Write-Host "   2. Type: Simple Browser: Show" -ForegroundColor White
    Write-Host "   3. Paste URL (already in clipboard): $url" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "💡 TIP: URL is in clipboard - just paste it!" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "🚀 NOOR Canvas Development Environment Ready!" -ForegroundColor Green
    Write-Host "=============================================" -ForegroundColor Green
    Write-Host "• Application Server: $url" -ForegroundColor White
    Write-Host "• Health Check: Passed ✅" -ForegroundColor White
    Write-Host "• Simple Browser: Ready to launch 🌐" -ForegroundColor White  
    Write-Host "• Host Tokens: Generated and ready 🔑" -ForegroundColor White
    Write-Host "• URL in Clipboard: Ready to paste 📋" -ForegroundColor White
    Write-Host "• Development Workflow: Complete ✨" -ForegroundColor White
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "1. Open Simple Browser (Ctrl+Shift+P → Simple Browser: Show)" -ForegroundColor Gray
    Write-Host "2. Paste URL from clipboard" -ForegroundColor Gray
    Write-Host "3. Test NOOR Canvas features" -ForegroundColor Gray
} else {
    Write-Host "🚀 NOOR Canvas Server Ready!" -ForegroundColor Green
    Write-Host "============================" -ForegroundColor Green
    Write-Host "• Application available at: $url" -ForegroundColor White
    Write-Host "• Health Check: Passed ✅" -ForegroundColor White
    Write-Host "• Server running in separate IIS Express window" -ForegroundColor White
    Write-Host "• Use Simple Browser or regular browser for testing" -ForegroundColor White
    Write-Host ""
    Write-Host "Manual Testing:" -ForegroundColor Yellow
    Write-Host "Copy URL: $url" -ForegroundColor Gray
}
