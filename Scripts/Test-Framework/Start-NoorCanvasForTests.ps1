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
    param([string]$TargetUrl)
    
    try {
        # Use -SkipCertificateCheck for PowerShell 6+ or bypass validation for PowerShell 5
        if ($PSVersionTable.PSVersion.Major -ge 6) {
            $response = Invoke-WebRequest -Uri $TargetUrl -Method HEAD -UseBasicParsing -TimeoutSec 5 -SkipCertificateCheck -ErrorAction Stop
        }
        else {
            # PowerShell 5.1: Disable SSL validation
            [System.Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }
            [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12
            
            $response = Invoke-WebRequest -Uri $TargetUrl -Method HEAD -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        }
        
        return ($response.StatusCode -eq 200)
    }
    catch {
        return $false
    }
}

function Get-BackoffDelay {
    param([int]$Attempt)
    
    if (-not $UseExponentialBackoff) {
        return $HealthCheckIntervalSeconds
    }
    
    # Exponential backoff: 2s, 4s, 8s, 16s, then cap at 5s
    $delay = [Math]::Min([Math]::Pow(2, $Attempt), 5)
    return [int]$delay
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

# Check for both NoorCanvas.exe AND dotnet.exe running the project
$existingProcesses = @()

# Check for compiled executable
$noorCanvasExe = Get-Process -Name "NoorCanvas" -ErrorAction SilentlyContinue
if ($noorCanvasExe) {
    $existingProcesses += $noorCanvasExe
}

# Check for dotnet run instances (manual testing windows)
$dotnetProcesses = Get-Process -Name "dotnet" -ErrorAction SilentlyContinue
if ($dotnetProcesses) {
    foreach ($proc in $dotnetProcesses) {
        try {
            $cmdLine = (Get-CimInstance Win32_Process -Filter "ProcessId = $($proc.Id)").CommandLine
            # Check if this dotnet process is running NoorCanvas project
            if ($cmdLine -and ($cmdLine -like "*NoorCanvas*" -or $cmdLine -like "*SPA\NoorCanvas*")) {
                Write-TestLog "Found dotnet.exe running NoorCanvas (PID: $($proc.Id))" -Level Warning
                $existingProcesses += $proc
            }
        }
        catch {
            # Skip if can't read command line (access denied, etc.)
            continue
        }
    }
}

if ($existingProcesses.Count -gt 0) {
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
# STEP 3: LAUNCH APPLICATION DIRECTLY (NO NESTED POWERSHELL)
# ============================================================================

Write-TestLog "Launching application..." -Level Info
Write-TestLog "  URL: $Url" -Level Info
Write-TestLog "  Environment: $Environment" -Level Info

try {
    # Launch dotnet.exe DIRECTLY in separate window for reliable PID tracking
    # Previous approach used nested PowerShell which caused health check delays
    $processArgs = @{
        FilePath = "dotnet"
        ArgumentList = @(
            "run",
            "--urls", $Url
        )
        WorkingDirectory = $fullProjectPath
        PassThru = $true
        WindowStyle = "Normal"
    }
    
    # Set environment variables for the new process
    $env:ASPNETCORE_ENVIRONMENT = $Environment
    $env:ASPNETCORE_URLS = $Url
    
    $appProcess = Start-Process @processArgs
    
    if (-not $appProcess) {
        throw "Failed to start application process"
    }
    
    Write-TestLog "Application launched (PID: $($appProcess.Id))" -Level Success
    $startTime = Get-Date
}
catch {
    Write-TestLog "Failed to launch application: $_" -Level Error
    throw
}

# ============================================================================
# STEP 5: HEALTH CHECK WITH EXPONENTIAL BACKOFF
# ============================================================================

Write-TestLog "Performing health checks (max $MaxHealthCheckAttempts attempts)..." -Level Info

$attempt = 0
$appReady = $false

while ($attempt -lt $MaxHealthCheckAttempts -and -not $appReady) {
    $attempt++
    $delay = Get-BackoffDelay -Attempt $attempt
    
    Write-Host "  [Attempt $attempt/$MaxHealthCheckAttempts] " -NoNewline -ForegroundColor Gray
    
    $appReady = Test-AppHealthCheck -TargetUrl $Url
    
    if ($appReady) {
        Write-Host "✅ Application is ready!" -ForegroundColor Green
        $healthCheckTime = (Get-Date) - $startTime
        Write-TestLog "Health check succeeded after $([Math]::Round($healthCheckTime.TotalSeconds, 1))s" -Level Success
    }
    else {
        Write-Host "⏳ Waiting ${delay}s..." -ForegroundColor Yellow
        
        # Check if process is still running
        $processStillRunning = Get-Process -Id $appProcess.Id -ErrorAction SilentlyContinue
        if (-not $processStillRunning) {
            Write-TestLog "Application process terminated unexpectedly!" -Level Error
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
}

Write-Host ""
Write-TestLog "Application ready for testing!" -Level Success
Write-Host ""
Write-Host "  Process ID:    $($result.ProcessId)" -ForegroundColor White
Write-Host "  URL:           $($result.Url)" -ForegroundColor White
Write-Host "  Health Checks: $($result.HealthCheckAttempts)" -ForegroundColor White
Write-Host ""

return $result
