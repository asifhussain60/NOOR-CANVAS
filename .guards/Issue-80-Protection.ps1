# Issue-80 Protection Guard
# Prevents PowerShell profile directory conflicts and ensures safe application startup
# Created: September 14, 2025
# Purpose: Protect against directory context issues that caused Issue-80

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("validate", "fix", "monitor")]
    [string]$Mode = "validate",
    
    [Parameter(Mandatory=$false)]
    [switch]$StrictMode,
    
    [Parameter(Mandatory=$false)]
    [switch]$VerboseLogging
)

# Global configuration
$script:ProjectRoot = "D:\PROJECTS\NOOR CANVAS"
$script:ProjectPath = "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas"
$script:ProjectFile = "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas\NoorCanvas.csproj"
$script:RequiredPorts = @(9090, 9091)
$script:GuardResults = @()

function Write-GuardLog {
    param(
        [string]$Message,
        [ValidateSet("INFO", "SUCCESS", "WARNING", "ERROR", "DEBUG")]
        [string]$Level = "INFO"
    )
    
    $timestamp = Get-Date -Format "HH:mm:ss"
    $colors = @{
        "INFO" = "White"
        "SUCCESS" = "Green" 
        "WARNING" = "Yellow"
        "ERROR" = "Red"
        "DEBUG" = "Gray"
    }
    
    if ($VerboseLogging -or $Level -ne "DEBUG") {
        Write-Host "[$timestamp] [ISSUE-80-GUARD] $Message" -ForegroundColor $colors[$Level]
    }
}

function Test-DirectoryContext {
    Write-GuardLog "Testing directory context safety..." "INFO"
    
    $currentDir = Get-Location
    $issues = @()
    
    # Check if we're in the correct project directory when running dotnet commands
    if ($currentDir.Path -ne $script:ProjectPath) {
        $issues += @{
            Severity = "HIGH"
            Issue = "Working directory is '$($currentDir.Path)' instead of '$script:ProjectPath'"
            Recommendation = "Use 'cd `"$script:ProjectPath`"' or full project path in dotnet commands"
            AutoFix = "Set-Location `"$script:ProjectPath`""
        }
    }
    
    # Verify project file exists
    if (-not (Test-Path $script:ProjectFile)) {
        $issues += @{
            Severity = "CRITICAL"
            Issue = "Project file not found at '$script:ProjectFile'"
            Recommendation = "Verify project structure and paths"
            AutoFix = $null
        }
    }
    
    $script:GuardResults += $issues
    
    if ($issues.Count -eq 0) {
        Write-GuardLog "✅ Directory context validation passed" "SUCCESS"
        return $true
    } else {
        Write-GuardLog "❌ Found $($issues.Count) directory context issues" "WARNING"
        return $false
    }
}

function Test-PowerShellProfileInterference {
    Write-GuardLog "Testing PowerShell profile interference..." "INFO"
    
    $issues = @()
    
    # Check if NOOR Canvas global commands are loaded
    $globalCommandsLoaded = $false
    if (Get-Command "nc" -ErrorAction SilentlyContinue) {
        $globalCommandsLoaded = $true
        Write-GuardLog "NOOR Canvas global commands detected (nc command found)" "DEBUG"
    }
    
    # Test if profile changes working directory automatically
    $initialDir = Get-Location
    
    # Simulate opening a new PowerShell session (if profile exists)
    if ($PROFILE -and (Test-Path $PROFILE)) {
        Write-GuardLog "PowerShell profile detected at '$PROFILE'" "DEBUG"
        
        # Check if profile contains directory changing commands
        $profileContent = Get-Content $PROFILE -Raw -ErrorAction SilentlyContinue
        if ($profileContent -and ($profileContent -match "Set-Location|cd\s|Push-Location")) {
            $issues += @{
                Severity = "MEDIUM"
                Issue = "PowerShell profile contains directory changing commands"
                Recommendation = "Review profile for automatic directory changes that could interfere with dotnet commands"
                AutoFix = $null
            }
        }
        
        if ($profileContent -and ($profileContent -match "NOOR|nc.*nct.*ncdoc")) {
            $globalCommandsLoaded = $true
            Write-GuardLog "NOOR Canvas global commands found in profile" "DEBUG"
        }
    }
    
    if ($globalCommandsLoaded) {
        $issues += @{
            Severity = "LOW"
            Issue = "NOOR Canvas global commands are active"
            Recommendation = "Be aware that 'nc' command changes directory context. Use full project paths in dotnet commands when necessary"
            AutoFix = $null
        }
    }
    
    $script:GuardResults += $issues
    
    if ($issues.Count -eq 0) {
        Write-GuardLog "✅ PowerShell profile interference check passed" "SUCCESS"
        return $true
    } else {
        Write-GuardLog "⚠️ Found $($issues.Count) potential profile interference issues" "WARNING"
        return $false
    }
}

function Test-DotnetCommandSafety {
    Write-GuardLog "Testing dotnet command execution safety..." "INFO"
    
    $issues = @()
    
    # Test if dotnet commands work from current directory
    $currentDir = Get-Location
    
    try {
        # Test dotnet build without explicit project path
        $buildTest = & dotnet build --dry-run --verbosity quiet 2>&1
        if ($LASTEXITCODE -ne 0) {
            $issues += @{
                Severity = "HIGH"
                Issue = "dotnet build fails from current directory '$($currentDir.Path)'"
                Recommendation = "Use explicit project path: dotnet build `"$script:ProjectFile`""
                AutoFix = "cd `"$script:ProjectPath`""
            }
        }
    } catch {
        $issues += @{
            Severity = "HIGH"
            Issue = "dotnet command execution failed: $($_.Exception.Message)"
            Recommendation = "Ensure .NET SDK is installed and project file is accessible"
            AutoFix = $null
        }
    }
    
    # Test project file accessibility
    try {
        $projectContent = Get-Content $script:ProjectFile -ErrorAction Stop
        if (-not ($projectContent -match "Microsoft.NET.Sdk.Web")) {
            $issues += @{
                Severity = "MEDIUM"
                Issue = "Project file may not be a valid ASP.NET Core project"
                Recommendation = "Verify project file structure and dependencies"
                AutoFix = $null
            }
        }
    } catch {
        $issues += @{
            Severity = "CRITICAL"
            Issue = "Cannot read project file: $($_.Exception.Message)"
            Recommendation = "Check file permissions and path validity"
            AutoFix = $null
        }
    }
    
    $script:GuardResults += $issues
    
    if ($issues.Count -eq 0) {
        Write-GuardLog "✅ Dotnet command safety check passed" "SUCCESS"
        return $true
    } else {
        Write-GuardLog "❌ Found $($issues.Count) dotnet command safety issues" "ERROR"
        return $false
    }
}

function Test-PortAvailability {
    Write-GuardLog "Testing port availability..." "INFO"
    
    $issues = @()
    
    foreach ($port in $script:RequiredPorts) {
        $portInUse = netstat -an | Select-String ":$port\s" -Quiet
        if ($portInUse) {
            $processes = netstat -ano | Select-String ":$port\s" | ForEach-Object {
                $parts = $_.ToString().Split(' ', [System.StringSplitOptions]::RemoveEmptyEntries)
                if ($parts.Count -ge 5) {
                    $processId = $parts[4]
                    try {
                        $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
                        return "$($process.ProcessName) (PID: $processId)"
                    } catch {
                        return "PID: $processId"
                    }
                }
            }
            
            $issues += @{
                Severity = "MEDIUM"
                Issue = "Port $port is in use by: $($processes -join ', ')"
                Recommendation = "Stop conflicting processes or use alternative ports"
                AutoFix = "Stop-Process -Name `"*dotnet*`", `"*iisexpress*`" -Force -ErrorAction SilentlyContinue"
            }
        }
    }
    
    $script:GuardResults += $issues
    
    if ($issues.Count -eq 0) {
        Write-GuardLog "✅ Port availability check passed" "SUCCESS"
        return $true
    } else {
        Write-GuardLog "⚠️ Found $($issues.Count) port conflicts" "WARNING"
        return $false
    }
}

function Invoke-AutoFix {
    param([array]$Issues)
    
    Write-GuardLog "Attempting to auto-fix $($Issues.Count) issues..." "INFO"
    
    $fixedCount = 0
    foreach ($issue in $Issues) {
        if ($issue.AutoFix) {
            try {
                Write-GuardLog "Fixing: $($issue.Issue)" "INFO"
                Invoke-Expression $issue.AutoFix
                $fixedCount++
                Write-GuardLog "✅ Fixed: $($issue.Issue)" "SUCCESS"
            } catch {
                Write-GuardLog "❌ Failed to fix: $($issue.Issue) - $($_.Exception.Message)" "ERROR"
            }
        }
    }
    
    Write-GuardLog "Auto-fixed $fixedCount out of $($Issues.Count) issues" "INFO"
    return $fixedCount
}

function Show-GuardResults {
    if ($script:GuardResults.Count -eq 0) {
        Write-GuardLog "🎉 All guard checks passed! Application startup should be safe." "SUCCESS"
        return
    }
    
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Red
    Write-Host "   ISSUE-80 PROTECTION GUARD REPORT" -ForegroundColor Red
    Write-Host "=========================================" -ForegroundColor Red
    Write-Host ""
    
    $criticalCount = ($script:GuardResults | Where-Object { $_.Severity -eq "CRITICAL" }).Count
    $highCount = ($script:GuardResults | Where-Object { $_.Severity -eq "HIGH" }).Count
    $mediumCount = ($script:GuardResults | Where-Object { $_.Severity -eq "MEDIUM" }).Count
    $lowCount = ($script:GuardResults | Where-Object { $_.Severity -eq "LOW" }).Count
    
    Write-Host "Issues Summary:" -ForegroundColor Yellow
    Write-Host "  CRITICAL: $criticalCount" -ForegroundColor Red
    Write-Host "  HIGH: $highCount" -ForegroundColor Red
    Write-Host "  MEDIUM: $mediumCount" -ForegroundColor Yellow
    Write-Host "  LOW: $lowCount" -ForegroundColor Green
    Write-Host ""
    
    foreach ($issue in $script:GuardResults) {
        $color = switch ($issue.Severity) {
            "CRITICAL" { "Red" }
            "HIGH" { "Red" }
            "MEDIUM" { "Yellow" }
            "LOW" { "Green" }
        }
        
        Write-Host "[$($issue.Severity)] $($issue.Issue)" -ForegroundColor $color
        Write-Host "  Recommendation: $($issue.Recommendation)" -ForegroundColor White
        if ($issue.AutoFix) {
            Write-Host "  Auto-fix: $($issue.AutoFix)" -ForegroundColor Cyan
        }
        Write-Host ""
    }
    
    if ($criticalCount -gt 0 -or $highCount -gt 0) {
        Write-Host "⚠️  HIGH/CRITICAL issues detected. Application startup may fail." -ForegroundColor Red
        Write-Host "   Recommended solution: dotnet run --project `"$script:ProjectFile`" --urls=`"https://localhost:9091;http://localhost:9090`"" -ForegroundColor Yellow
    }
}

# Main execution
Write-GuardLog "Issue-80 Protection Guard Starting (Mode: $Mode)" "INFO"
Write-GuardLog "Target Project: $script:ProjectPath" "DEBUG"

$allPassed = $true

# Run all validation tests
$allPassed = (Test-DirectoryContext) -and $allPassed
$allPassed = (Test-PowerShellProfileInterference) -and $allPassed
$allPassed = (Test-DotnetCommandSafety) -and $allPassed
$allPassed = (Test-PortAvailability) -and $allPassed

# Handle different modes
switch ($Mode) {
    "validate" {
        Show-GuardResults
        if (-not $allPassed -and $StrictMode) {
            Write-GuardLog "Strict mode: Exiting with error due to failed validations" "ERROR"
            exit 1
        }
    }
    "fix" {
        $fixableIssues = $script:GuardResults | Where-Object { $_.AutoFix }
        if ($fixableIssues.Count -gt 0) {
            Invoke-AutoFix -Issues $fixableIssues
            
            # Re-run validation after fixes
            $script:GuardResults = @()
            $allPassed = $true
            $allPassed = (Test-DirectoryContext) -and $allPassed
            $allPassed = (Test-PowerShellProfileInterference) -and $allPassed
            $allPassed = (Test-DotnetCommandSafety) -and $allPassed
            $allPassed = (Test-PortAvailability) -and $allPassed
        }
        Show-GuardResults
    }
    "monitor" {
        Write-GuardLog "Monitor mode: Watching for changes..." "INFO"
        while ($true) {
            $script:GuardResults = @()
            Test-DirectoryContext | Out-Null
            Test-PowerShellProfileInterference | Out-Null
            
            if ($script:GuardResults.Count -gt 0) {
                Write-GuardLog "Changes detected that could cause Issue-80!" "WARNING"
                Show-GuardResults
            }
            
            Start-Sleep -Seconds 30
        }
    }
}

Write-GuardLog "Issue-80 Protection Guard completed" "INFO"
