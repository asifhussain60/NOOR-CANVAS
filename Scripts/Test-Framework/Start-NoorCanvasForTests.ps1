<#
.SYNOPSIS
    Robust application launcher for Playwright/Percy tests with proper lifecycle management.

.DESCRIPTION
    This is the CANONICAL way to start NoorCanvas for automated testing:
    
    1. ✅ Kills existing NoorCanvas processes (clean slate)
    2. ✅ Launches app with correct environment variables
    3. ✅ Performs robust health checks with exponential backoff
    4. ✅ Returns process information for cleanup
    5. ✅ Handles all error scenarios gracefully
    
    DESIGN PRINCIPLES:
    - Single Responsibility: Only manages app lifecycle
    - Fail-Fast: Exits immediately on critical errors
    - Observable: Clear logging of all operations
    - Testable: Returns structured data for verification

.PARAMETER Url
    Application URL. Default: https://localhost:9091

.PARAMETER Environment
    ASP.NET Core environment. Default: Development

.PARAMETER ProjectPath
    Path to NoorCanvas project. Default: SPA\NoorCanvas (relative to workspace root)

.PARAMETER MaxHealthCheckAttempts
    Maximum health check retry attempts. Default: 15

.PARAMETER HealthCheckIntervalSeconds
    Seconds between health check attempts. Default: 2

.PARAMETER UseExponentialBackoff
    Use exponential backoff for health checks (2s, 4s, 8s, 16s, then 5s). Default: $true

.EXAMPLE
    $appInfo = .\Start-NoorCanvasForTests.ps1
    # ... run tests ...
    Stop-Process -Id $appInfo.ProcessId -Force

.EXAMPLE
    # Custom configuration
    $appInfo = .\Start-NoorCanvasForTests.ps1 -Url "https://localhost:5001" -MaxHealthCheckAttempts 20

.OUTPUTS
    PSCustomObject with properties:
    - ProcessId: Int32
    - Url: String
    - StartTime: DateTime
    - HealthCheckAttempts: Int32
    - Success: Boolean
#>

[CmdletBinding()]
param(
    [string]$Url = "https://localhost:9091",
    [string]$Environment = "Development",
    [string]$ProjectPath = "SPA\NoorCanvas",
    [int]$MaxHealthCheckAttempts = 15,
    [int]$HealthCheckIntervalSeconds = 2,
    [bool]$UseExponentialBackoff = $true
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

function Write-TestLog {
    param(
        [string]$Message,
        [ValidateSet('Info', 'Success', 'Warning', 'Error')]
        [string]$Level = 'Info'
    )
    
    $timestamp = Get-Date -Format 'HH:mm:ss.fff'
    $prefix = switch ($Level) {
        'Info'    { "[INFO]" }
        'Success' { "[OK]" }
        'Warning' { "[WARN]" }
        'Error'   { "[ERROR]" }
    }
    
    $color = switch ($Level) {
        'Info'    { 'Cyan' }
        'Success' { 'Green' }
        'Warning' { 'Yellow' }
        'Error'   { 'Red' }
    }
    
    Write-Host "[$timestamp] $prefix $Message" -ForegroundColor $color
}

function Test-AppHealthCheck {
    param(
        [string]$TargetUrl,
        [int]$Port
    )
    
    # PHASE 1: Check if port is bound (faster than HTTP ping)
    # v3.0 Enhancement: Port binding check eliminates false negatives
    try {
        $portBound = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
        
        if (-not $portBound) {
            # Port not bound yet - app still starting
            return $false
        }
        
        Write-Verbose "Port $Port is bound - attempting HTTP verification..."
    }
    catch {
        # Port check failed - app not ready
        return $false
    }
    
    # PHASE 2: Verify HTTP response (confirms app is fully initialized)
    try {
        # Use -SkipCertificateCheck for PowerShell 6+ or bypass validation for PowerShell 5
        if ($PSVersionTable.PSVersion.Major -ge 6) {
            $response = Invoke-WebRequest -Uri $TargetUrl -Method HEAD -UseBasicParsing -TimeoutSec 2 -SkipCertificateCheck -ErrorAction Stop
        }
        else {
            # PowerShell 5.1: Disable SSL validation
            [System.Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }
            [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12
            
            $response = Invoke-WebRequest -Uri $TargetUrl -Method HEAD -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        }
        
        return ($response.StatusCode -eq 200)
    }
    catch {
        # Port bound but HTTP not ready yet - continue polling
        Write-Verbose "Port bound but HTTP check failed: $_"
        return $false
    }
}

function Get-BackoffDelay {
    param([int]$Attempt)
    
    if (-not $UseExponentialBackoff) {
        return $HealthCheckIntervalSeconds
    }
    
    # v3.0 Optimized backoff for direct dotnet launch (faster than nested PowerShell)
    # Direct launch: 500ms, 1s, 2s, 3s (cap at 3s)
    # vs Old nested: 2s, 4s, 8s, 16s, 5s
    switch ($Attempt) {
        1 { return 0.5 }  # First check almost immediate
        2 { return 1 }    # Second check after 1s
        3 { return 2 }    # Third check after 2s
        default { return 3 }  # Cap at 3s for subsequent checks
    }
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

Write-Host ""
Write-Host "===================================================================" -ForegroundColor Magenta
Write-Host "  NoorCanvas Test Application Launcher v2.0" -ForegroundColor Magenta
Write-Host "===================================================================" -ForegroundColor Magenta
Write-Host ""

$workspaceRoot = Split-Path $PSScriptRoot -Parent
$workspaceRoot = Split-Path $workspaceRoot -Parent
$fullProjectPath = Join-Path $workspaceRoot $ProjectPath

# ============================================================================
# STEP 1: CLEANUP EXISTING PROCESSES
# ============================================================================

Write-TestLog "Cleaning up existing NoorCanvas processes..." -Level Info

$existingProcesses = Get-Process -Name "NoorCanvas" -ErrorAction SilentlyContinue
if ($existingProcesses) {
    Write-TestLog "Found $($existingProcesses.Count) existing process(es)" -Level Warning
    $existingProcesses | ForEach-Object {
        Write-TestLog "  Killing PID $($_.Id)..." -Level Warning
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 2
    Write-TestLog "Cleanup complete" -Level Success
} else {
    Write-TestLog "No existing processes found" -Level Info
}

# ============================================================================
# STEP 2: VALIDATE PROJECT PATH
# ============================================================================

Write-TestLog "Validating project path: $fullProjectPath" -Level Info

if (-not (Test-Path $fullProjectPath)) {
    Write-TestLog "Project path not found: $fullProjectPath" -Level Error
    throw "Project directory does not exist"
}

$csprojPath = Join-Path $fullProjectPath "NoorCanvas.csproj"
if (-not (Test-Path $csprojPath)) {
    Write-TestLog "NoorCanvas.csproj not found at: $csprojPath" -Level Error
    throw "Project file does not exist"
}

Write-TestLog "Project validated" -Level Success

# ============================================================================
# STEP 4: LAUNCH APPLICATION DIRECTLY (V3.0 PATTERN - ENHANCED)
# ============================================================================
# IMPROVEMENT: Direct dotnet.exe launch eliminates nested PowerShell hierarchy
# BENEFITS: Faster health checks (1-3 attempts vs 5-15), reliable cleanup, proper ENV isolation

Write-TestLog "Launching application with direct dotnet.exe (v3.0)..." -Level Info
Write-TestLog "  URL: $Url" -Level Info
Write-TestLog "  Environment: $Environment" -Level Info
Write-TestLog "  Working Directory: $fullProjectPath" -Level Info

try {
    # Build dotnet arguments
    $dotnetArgs = @(
        "run",
        "--project", $fullProjectPath,
        "--urls", $Url,
        "--no-launch-profile"  # Prevent launchSettings.json override
    )
    
    # Set environment variables for the process
    $env:ASPNETCORE_ENVIRONMENT = $Environment
    $env:ASPNETCORE_URLS = $Url
    
    # Launch dotnet.exe directly (single process, no nesting)
    $appProcess = Start-Process -FilePath "dotnet" `
        -ArgumentList $dotnetArgs `
        -WorkingDirectory $fullProjectPath `
        -PassThru `
        -WindowStyle Normal
    
    if (-not $appProcess) {
        throw "Failed to start dotnet process"
    }
    
    Write-TestLog "Application launched (PID: $($appProcess.Id), Process: dotnet.exe)" -Level Success
    Write-TestLog "  v3.0 Direct Launch: Eliminated nested PowerShell wrapper" -Level Info
    $startTime = Get-Date
}
catch {
    Write-TestLog "Failed to launch application: $_" -Level Error
    throw
}

# ============================================================================
# STEP 5: HEALTH CHECK WITH PORT BINDING VALIDATION (V3.0 ENHANCED)
# ============================================================================
# v3.0 Improvement: Port binding check before HTTP ping (faster detection)

Write-TestLog "Performing health checks (max $MaxHealthCheckAttempts attempts)..." -Level Info

# Extract port from URL for port binding checks
$port = if ($Url -match ':(\d+)') { [int]$matches[1] } else { 443 }
Write-TestLog "  Target port: $port" -Level Info
Write-TestLog "  Using v3.0 enhanced health checks (port binding + HTTP)" -Level Info

$attempt = 0
$appReady = $false

while ($attempt -lt $MaxHealthCheckAttempts -and -not $appReady) {
    $attempt++
    $delay = Get-BackoffDelay -Attempt $attempt
    
    Write-Host "  [Attempt $attempt/$MaxHealthCheckAttempts] " -NoNewline -ForegroundColor Gray
    
    $appReady = Test-AppHealthCheck -TargetUrl $Url -Port $port
    
    if ($appReady) {
        Write-Host "✅ Application is ready!" -ForegroundColor Green
        $healthCheckTime = (Get-Date) - $startTime
        Write-TestLog "Health check succeeded after $([Math]::Round($healthCheckTime.TotalSeconds, 1))s (attempt $attempt)" -Level Success
    }
    else {
        Write-Host "⏳ Waiting ${delay}s..." -ForegroundColor Yellow
        
        # Check if process is still running
        $processStillRunning = Get-Process -Id $appProcess.Id -ErrorAction SilentlyContinue
        if (-not $processStillRunning) {
            Write-TestLog "Application process (PID: $($appProcess.Id)) terminated unexpectedly!" -Level Error
            throw "Application process exited before becoming ready"
        }
        
        Start-Sleep -Seconds $delay
    }
}

# ============================================================================
# STEP 6: VALIDATE SUCCESS
# ============================================================================

if (-not $appReady) {
    Write-TestLog "Health check failed after $MaxHealthCheckAttempts attempts" -Level Error
    Write-TestLog "Cleaning up failed process (PID: $($appProcess.Id))..." -Level Warning
    
    Stop-Process -Id $appProcess.Id -Force -ErrorAction SilentlyContinue
    
    throw "Application failed to become ready within timeout period"
}

# ============================================================================
# STEP 7: RETURN PROCESS INFORMATION
# ============================================================================

$result = [PSCustomObject]@{
    ProcessId = $appProcess.Id
    Url = $Url
    Environment = $Environment
    ProjectPath = $fullProjectPath
    StartTime = $startTime
    HealthCheckAttempts = $attempt
    Success = $true
    LaunchPattern = "v3.0-direct-dotnet"  # Track launch pattern version
}

Write-Host ""
Write-TestLog "Application ready for testing!" -Level Success
Write-Host ""
Write-Host "  Process ID:    $($result.ProcessId)" -ForegroundColor White
Write-Host "  URL:           $($result.Url)" -ForegroundColor White
Write-Host "  Health Checks: $($result.HealthCheckAttempts)" -ForegroundColor White
Write-Host "  Launch Pattern: v3.0 Direct dotnet.exe (enhanced)" -ForegroundColor Cyan
Write-Host ""

return $result
