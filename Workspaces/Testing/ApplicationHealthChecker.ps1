# NOOR Canvas Application Health Checker
# Comprehensive diagnostic system for detecting application loading issues
# Author: GitHub Copilot | Date: September 12, 2025

param(
    [switch]$Verbose,
    [switch]$AutoRecover,
    [switch]$MonitorMode,
    [int]$TimeoutSeconds = 10,
    [string]$LogPath = ".\health-check.log"
)

# Configuration
$Config = @{
    HttpsUrl = "https://localhost:9091"
    HttpUrl = "http://localhost:9090" 
    HealthEndpoint = "/healthz"
    ProcessName = "iisexpress"
    ProjectPath = "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas"
    ExpectedPorts = @(9090, 9091)
}

# Logging function
function Write-HealthLog {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    
    if ($Verbose) { Write-Host $logEntry }
    Add-Content -Path $LogPath -Value $logEntry
}

# Test 1: Process Detection and Analysis
function Test-ProcessHealth {
    Write-HealthLog "Starting process health check..." "INFO"
    
    $processes = Get-Process | Where-Object {$_.ProcessName -like "*iisexpress*" -or $_.ProcessName -eq "dotnet"}
    $result = @{
        ProcessesFound = $processes.Count
        Processes = @()
        Status = "UNKNOWN"
        Issues = @()
    }
    
    foreach ($proc in $processes) {
        $processInfo = @{
            Id = $proc.Id
            Name = $proc.ProcessName
            StartTime = $proc.StartTime
            WorkingSet = [math]::Round($proc.WorkingSet64 / 1MB, 2)
        }
        $result.Processes += $processInfo
        Write-HealthLog "Found process: $($proc.ProcessName) (PID: $($proc.Id))" "INFO"
    }
    
    if ($result.ProcessesFound -eq 0) {
        $result.Status = "NO_PROCESSES"
        $result.Issues += "No IIS Express or dotnet processes found"
    } elseif ($result.ProcessesFound -gt 2) {
        $result.Status = "TOO_MANY_PROCESSES" 
        $result.Issues += "Multiple processes detected - potential conflicts"
    } else {
        $result.Status = "PROCESSES_OK"
    }
    
    return $result
}

# Test 2: Port Binding Analysis
function Test-PortBinding {
    Write-HealthLog "Starting port binding analysis..." "INFO"
    
    $result = @{
        PortBindings = @()
        Status = "UNKNOWN"
        Issues = @()
    }
    
    foreach ($port in $Config.ExpectedPorts) {
        try {
            $netstat = netstat -ano | Select-String ":$port\s"
            if ($netstat) {
                foreach ($line in $netstat) {
                    if ($line -match "\s+TCP\s+\S+:$port\s+\S+\s+(\w+)\s+(\d+)") {
                        $binding = @{
                            Port = $port
                            State = $matches[1]
                            PID = $matches[2]
                        }
                        $result.PortBindings += $binding
                        Write-HealthLog "Port $port bound to PID $($binding.PID) in state $($binding.State)" "INFO"
                    }
                }
            } else {
                Write-HealthLog "Port $port is not bound to any process" "WARN"
                $result.Issues += "Port $port not bound"
            }
        } catch {
            Write-HealthLog "Error checking port $port`: $($_.Exception.Message)" "ERROR"
            $result.Issues += "Error checking port $port"
        }
    }
    
    # Analyze binding health
    $httpsBinding = $result.PortBindings | Where-Object {$_.Port -eq 9091}
    $httpBinding = $result.PortBindings | Where-Object {$_.Port -eq 9090}
    
    if ($httpsBinding -and $httpBinding) {
        if ($httpsBinding.PID -eq $httpBinding.PID) {
            $result.Status = "PORTS_OK"
        } else {
            $result.Status = "PORT_PID_MISMATCH"
            $result.Issues += "HTTP and HTTPS ports bound to different processes"
        }
    } elseif ($httpsBinding -or $httpBinding) {
        $result.Status = "PARTIAL_BINDING"
        $result.Issues += "Only one port is bound"
    } else {
        $result.Status = "NO_BINDING"
        $result.Issues += "No ports bound"
    }
    
    return $result
}

# Test 3: HTTP/HTTPS Connectivity
function Test-Connectivity {
    Write-HealthLog "Starting connectivity tests..." "INFO"
    
    $result = @{
        HttpsConnectivity = $false
        HttpConnectivity = $false
        HttpsResponse = $null
        HttpResponse = $null
        Status = "UNKNOWN"
        Issues = @()
    }
    
    # Test HTTPS
    try {
        [System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}
        $httpsResponse = Invoke-WebRequest -Uri $Config.HttpsUrl -TimeoutSec $TimeoutSeconds -UseBasicParsing
        $result.HttpsConnectivity = $true
        $result.HttpsResponse = @{
            StatusCode = $httpsResponse.StatusCode
            StatusDescription = $httpsResponse.StatusDescription
        }
        Write-HealthLog "HTTPS connectivity successful: $($httpsResponse.StatusCode)" "INFO"
    } catch {
        $result.HttpsConnectivity = $false
        $result.Issues += "HTTPS connection failed: $($_.Exception.Message)"
        Write-HealthLog "HTTPS connection failed: $($_.Exception.Message)" "ERROR"
    }
    
    # Test HTTP
    try {
        $httpResponse = Invoke-WebRequest -Uri $Config.HttpUrl -TimeoutSec $TimeoutSeconds -UseBasicParsing
        $result.HttpConnectivity = $true
        $result.HttpResponse = @{
            StatusCode = $httpResponse.StatusCode
            StatusDescription = $httpResponse.StatusDescription
        }
        Write-HealthLog "HTTP connectivity successful: $($httpResponse.StatusCode)" "INFO"
    } catch {
        $result.HttpConnectivity = $false
        $result.Issues += "HTTP connection failed: $($_.Exception.Message)"
        Write-HealthLog "HTTP connection failed: $($_.Exception.Message)" "ERROR"
    }
    
    # Determine overall connectivity status
    if ($result.HttpsConnectivity -and $result.HttpConnectivity) {
        $result.Status = "CONNECTIVITY_OK"
    } elseif ($result.HttpsConnectivity -or $result.HttpConnectivity) {
        $result.Status = "PARTIAL_CONNECTIVITY"
    } else {
        $result.Status = "NO_CONNECTIVITY"
    }
    
    return $result
}

# Test 4: Health Endpoint Validation
function Test-HealthEndpoint {
    Write-HealthLog "Testing health endpoint..." "INFO"
    
    $result = @{
        HealthEndpointResponsive = $false
        HealthResponse = $null
        Status = "UNKNOWN"
        Issues = @()
    }
    
    $healthUrls = @(
        "$($Config.HttpsUrl)$($Config.HealthEndpoint)",
        "$($Config.HttpUrl)$($Config.HealthEndpoint)"
    )
    
    foreach ($url in $healthUrls) {
        try {
            [System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}
            $response = Invoke-WebRequest -Uri $url -TimeoutSec $TimeoutSeconds -UseBasicParsing
            
            if ($response.StatusCode -eq 200) {
                $result.HealthEndpointResponsive = $true
                $result.HealthResponse = @{
                    Url = $url
                    StatusCode = $response.StatusCode
                    Content = $response.Content
                }
                $result.Status = "HEALTH_OK"
                Write-HealthLog "Health endpoint responsive: $url" "INFO"
                break
            }
        } catch {
            Write-HealthLog "Health endpoint failed: $url - $($_.Exception.Message)" "WARN"
        }
    }
    
    if (-not $result.HealthEndpointResponsive) {
        $result.Status = "HEALTH_FAILED"
        $result.Issues += "Health endpoint not responsive on any URL"
    }
    
    return $result
}

# Comprehensive Health Assessment
function Get-ComprehensiveHealthReport {
    Write-HealthLog "=== Starting NOOR Canvas Application Health Check ===" "INFO"
    
    $report = @{
        Timestamp = Get-Date
        ProcessHealth = Test-ProcessHealth
        PortHealth = Test-PortBinding  
        ConnectivityHealth = Test-Connectivity
        EndpointHealth = Test-HealthEndpoint
        OverallStatus = "UNKNOWN"
        Severity = "UNKNOWN"
        RecommendedActions = @()
    }
    
    # Determine overall health status
    $criticalIssues = 0
    $warningIssues = 0
    
    # Analyze each component
    if ($report.ProcessHealth.Status -eq "NO_PROCESSES") {
        $criticalIssues++
        $report.RecommendedActions += "Start the application using 'nc' command or 'dotnet run'"
    }
    
    if ($report.PortHealth.Status -eq "NO_BINDING") {
        $criticalIssues++
        $report.RecommendedActions += "Restart application - no port bindings detected"
    }
    
    if ($report.ConnectivityHealth.Status -eq "NO_CONNECTIVITY") {
        $criticalIssues++
        $report.RecommendedActions += "Application not responding - restart required"
    }
    
    if ($report.EndpointHealth.Status -eq "HEALTH_FAILED") {
        $criticalIssues++
        $report.RecommendedActions += "Health endpoint not responsive - check application startup"
    }
    
    if ($report.ProcessHealth.Status -eq "TOO_MANY_PROCESSES") {
        $warningIssues++
        $report.RecommendedActions += "Multiple processes detected - consider stopping stale processes"
    }
    
    if ($report.PortHealth.Status -eq "PORT_PID_MISMATCH") {
        $warningIssues++
        $report.RecommendedActions += "Port binding mismatch - restart application"
    }
    
    if ($report.ConnectivityHealth.Status -eq "PARTIAL_CONNECTIVITY") {
        $warningIssues++
        $report.RecommendedActions += "Partial connectivity - check HTTPS certificate configuration"
    }
    
    # Set overall status and severity
    if ($criticalIssues -gt 0) {
        $report.OverallStatus = "CRITICAL"
        $report.Severity = "HIGH"
    } elseif ($warningIssues -gt 0) {
        $report.OverallStatus = "WARNING" 
        $report.Severity = "MEDIUM"
    } else {
        $report.OverallStatus = "HEALTHY"
        $report.Severity = "LOW"
    }
    
    Write-HealthLog "Health check completed. Status: $($report.OverallStatus)" "INFO"
    return $report
}

# Display Health Report
function Show-HealthReport {
    param([object]$Report)
    
    Write-Host "`n🏥 NOOR Canvas Application Health Report" -ForegroundColor Cyan
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host "Timestamp: $($Report.Timestamp)" -ForegroundColor Gray
    Write-Host "Overall Status: " -NoNewline
    
    switch ($Report.OverallStatus) {
        "HEALTHY" { Write-Host "✅ HEALTHY" -ForegroundColor Green }
        "WARNING" { Write-Host "⚠️ WARNING" -ForegroundColor Yellow }
        "CRITICAL" { Write-Host "❌ CRITICAL" -ForegroundColor Red }
        default { Write-Host "❓ UNKNOWN" -ForegroundColor Gray }
    }
    
    Write-Host "Severity: $($Report.Severity)" -ForegroundColor Gray
    Write-Host ""
    
    # Process Health
    Write-Host "🔄 Process Health: " -NoNewline
    switch ($Report.ProcessHealth.Status) {
        "PROCESSES_OK" { Write-Host "✅ OK ($($Report.ProcessHealth.ProcessesFound) processes)" -ForegroundColor Green }
        "NO_PROCESSES" { Write-Host "❌ NO PROCESSES" -ForegroundColor Red }
        "TOO_MANY_PROCESSES" { Write-Host "⚠️ TOO MANY ($($Report.ProcessHealth.ProcessesFound))" -ForegroundColor Yellow }
        default { Write-Host "❓ UNKNOWN" -ForegroundColor Gray }
    }
    
    # Port Health  
    Write-Host "🔌 Port Binding: " -NoNewline
    switch ($Report.PortHealth.Status) {
        "PORTS_OK" { Write-Host "✅ OK" -ForegroundColor Green }
        "NO_BINDING" { Write-Host "❌ NO BINDING" -ForegroundColor Red }
        "PARTIAL_BINDING" { Write-Host "⚠️ PARTIAL" -ForegroundColor Yellow }
        "PORT_PID_MISMATCH" { Write-Host "⚠️ PID MISMATCH" -ForegroundColor Yellow }
        default { Write-Host "❓ UNKNOWN" -ForegroundColor Gray }
    }
    
    # Connectivity Health
    Write-Host "🌐 Connectivity: " -NoNewline
    switch ($Report.ConnectivityHealth.Status) {
        "CONNECTIVITY_OK" { Write-Host "✅ OK (HTTP + HTTPS)" -ForegroundColor Green }
        "PARTIAL_CONNECTIVITY" { Write-Host "⚠️ PARTIAL" -ForegroundColor Yellow }
        "NO_CONNECTIVITY" { Write-Host "❌ FAILED" -ForegroundColor Red }
        default { Write-Host "❓ UNKNOWN" -ForegroundColor Gray }
    }
    
    # Health Endpoint
    Write-Host "🏥 Health Endpoint: " -NoNewline
    switch ($Report.EndpointHealth.Status) {
        "HEALTH_OK" { Write-Host "✅ RESPONSIVE" -ForegroundColor Green }
        "HEALTH_FAILED" { Write-Host "❌ NOT RESPONSIVE" -ForegroundColor Red }
        default { Write-Host "❓ UNKNOWN" -ForegroundColor Gray }
    }
    
    # Recommended Actions
    if ($Report.RecommendedActions.Count -gt 0) {
        Write-Host "`n🛠️ Recommended Actions:" -ForegroundColor Cyan
        foreach ($action in $Report.RecommendedActions) {
            Write-Host "  • $action" -ForegroundColor Yellow
        }
    }
    
    Write-Host ""
}

# Auto-Recovery Function (Basic Implementation)
function Start-AutoRecovery {
    param([object]$Report)
    
    if (-not $AutoRecover) {
        Write-Host "Auto-recovery not enabled. Use -AutoRecover to enable automatic fixes." -ForegroundColor Yellow
        return
    }
    
    Write-Host "`n🔧 Starting Auto-Recovery..." -ForegroundColor Cyan
    Write-HealthLog "Starting auto-recovery process" "INFO"
    
    # Stop stale processes
    if ($Report.ProcessHealth.Status -eq "TOO_MANY_PROCESSES") {
        Write-Host "Stopping stale processes..." -ForegroundColor Yellow
        Get-Process | Where-Object {$_.ProcessName -like "*iisexpress*"} | Stop-Process -Force -ErrorAction SilentlyContinue
        Write-HealthLog "Stopped stale IIS Express processes" "INFO"
        Start-Sleep 2
    }
    
    # Restart application if critical issues detected
    if ($Report.OverallStatus -eq "CRITICAL") {
        Write-Host "Critical issues detected. Restarting application..." -ForegroundColor Red
        
        try {
            Set-Location $Config.ProjectPath
            Write-Host "Starting application with dotnet run..." -ForegroundColor Yellow
            
            # Start application in background
            $job = Start-Job -ScriptBlock {
                Set-Location $using:Config.ProjectPath
                dotnet run --urls "https://localhost:9091;http://localhost:9090"
            }
            
            # Wait for startup
            Start-Sleep 10
            
            # Re-test health
            Write-Host "Re-testing application health..." -ForegroundColor Yellow
            $newReport = Get-ComprehensiveHealthReport
            
            if ($newReport.OverallStatus -eq "HEALTHY") {
                Write-Host "✅ Auto-recovery successful!" -ForegroundColor Green
                Write-HealthLog "Auto-recovery completed successfully" "INFO"
            } else {
                Write-Host "❌ Auto-recovery failed. Manual intervention required." -ForegroundColor Red
                Write-HealthLog "Auto-recovery failed" "ERROR"
            }
            
        } catch {
            Write-Host "❌ Auto-recovery error: $($_.Exception.Message)" -ForegroundColor Red
            Write-HealthLog "Auto-recovery error: $($_.Exception.Message)" "ERROR"
        }
    }
}

# Main Execution
try {
    Write-HealthLog "Application Health Checker started with parameters: Verbose=$Verbose, AutoRecover=$AutoRecover, MonitorMode=$MonitorMode" "INFO"
    
    if ($MonitorMode) {
        Write-Host "🔍 Starting Health Monitor Mode (Ctrl+C to stop)..." -ForegroundColor Cyan
        while ($true) {
            $report = Get-ComprehensiveHealthReport
            Show-HealthReport -Report $report
            
            if ($report.OverallStatus -ne "HEALTHY") {
                Start-AutoRecovery -Report $report
            }
            
            Start-Sleep 30
        }
    } else {
        # Single health check
        $report = Get-ComprehensiveHealthReport
        Show-HealthReport -Report $report
        
        if ($AutoRecover -and $report.OverallStatus -ne "HEALTHY") {
            Start-AutoRecovery -Report $report
        }
    }
    
} catch {
    Write-Host "❌ Health checker error: $($_.Exception.Message)" -ForegroundColor Red
    Write-HealthLog "Health checker error: $($_.Exception.Message)" "ERROR"
    exit 1
}

Write-HealthLog "Application Health Checker completed" "INFO"
