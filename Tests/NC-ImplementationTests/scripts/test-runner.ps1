# NOOR Canvas Test Runner
# Comprehensive test pipeline: lint → verify → build → test → integration

param(
    [switch]$Integration,
    [switch]$SkipLint,
    [switch]$Verbose,
    [switch]$Help
)

if ($Help) {
    Write-Host @"
NOOR Canvas Test Runner v2.0

Usage:
    .\test-runner.ps1                    # Standard pipeline
    .\test-runner.ps1 -Integration       # Include integration tests
    .\test-runner.ps1 -SkipLint         # Skip linting phase
    .\test-runner.ps1 -Verbose          # Detailed output

"@
    exit 0
}

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path "$scriptDir\..\..\..\"
$solutionPath = Join-Path $repoRoot "NoorCanvas.sln"

function Write-Phase {
    param($Phase, $Message, $Color = "Cyan")
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "[$timestamp] Phase $Phase - $Message" -ForegroundColor $Color
}

function Write-Success { 
    param($Message)
    Write-Host "✅ $Message" -ForegroundColor Green 
}

function Write-Warning { 
    param($Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow 
}

function Write-TestError { 
    param($Message)
    Write-Host "❌ $Message" -ForegroundColor Red 
}

function Write-Info { 
    param($Message)
    if ($Verbose) {
        Write-Host "ℹ️  $Message" -ForegroundColor Blue
    }
}

# Test result tracking
$testResults = @{
    Lint = @{ Status = "Pending"; Details = "" }
    Verify = @{ Status = "Pending"; Details = "" }
    Build = @{ Status = "Pending"; Details = "" }
    Tests = @{ Status = "Pending"; Details = "" }
    Integration = @{ Status = "Skipped"; Details = "Not requested" }
    StartTime = Get-Date
}

Write-Phase "START" "NOOR Canvas Test Runner v2.0"
Write-Info "Repository Root: $repoRoot"
Write-Info "Solution Path: $solutionPath"

try {
    # Phase 0: Linting
    if (-not $SkipLint) {
        Write-Phase "0" "Linting HTML documentation and project files"
        
        $trackerHtml = Join-Path $repoRoot "Workspaces\Documentation\IMPLEMENTATIONS\IMPLEMENTATION-TRACKER.html"
        if (Test-Path $trackerHtml) {
            Write-Info "Linting: $trackerHtml"
            & "$scriptDir\lint-html.ps1" -Path $trackerHtml
            if ($LASTEXITCODE -eq 0) {
                Write-Success "HTML documentation passed linting"
                $testResults.Lint.Status = "Passed"
            } else {
                throw "HTML lint failed with exit code $LASTEXITCODE"
            }
        } else {
            Write-Warning "Implementation tracker HTML not found - skipping HTML lint"
            $testResults.Lint.Status = "Skipped"
            $testResults.Lint.Details = "HTML file not found"
        }
    } else {
        Write-Warning "Linting phase skipped by user request"
        $testResults.Lint.Status = "Skipped"
        $testResults.Lint.Details = "Skipped by -SkipLint flag"
    }

    # Phase 1: Verify completed issue test coverage
    Write-Phase "1" "Verifying completed issues have test coverage"
    & "$scriptDir\verify-completed-tests.ps1"
    if ($LASTEXITCODE -eq 0) {
        Write-Success "All completed issues have test stubs"
        $testResults.Verify.Status = "Passed"
    } else {
        throw "Test verification failed with exit code $LASTEXITCODE"
    }

    # Phase 2: Build solution
    Write-Phase "2" "Building solution"
    Set-Location $repoRoot
    
    Write-Info "Restoring NuGet packages..."
    dotnet restore $solutionPath --verbosity minimal
    if ($LASTEXITCODE -ne 0) { throw "Package restore failed" }
    
    Write-Info "Building solution..."
    dotnet build $solutionPath --no-restore --verbosity minimal
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Solution built successfully"
        $testResults.Build.Status = "Passed"
    } else {
        throw "Solution build failed with exit code $LASTEXITCODE"
    }

    # Phase 3: Run unit and component tests
    Write-Phase "3" "Running xUnit and bUnit test suites"
    
    $testProjects = @(
        "Tests\NoorCanvas.Core.Tests\NoorCanvas.Core.Tests.csproj",
        "Tests\NC-ImplementationTests\NC-ImplementationTests.csproj"
    )
    
    $totalTests = 0
    $passedTests = 0
    $failedTests = 0
    
    foreach ($testProject in $testProjects) {
        $projectPath = Join-Path $repoRoot $testProject
        if (Test-Path $projectPath) {
            Write-Info "Running tests: $testProject"
            $testOutput = dotnet test $projectPath --no-build --verbosity minimal --logger "console;verbosity=minimal" 2>&1
            
            if ($LASTEXITCODE -eq 0) {
                # Parse test results from output
                $testOutput | ForEach-Object {
                    if ($_ -match "Passed!\s+\-\s+Failed:\s+(\d+),\s+Passed:\s+(\d+),\s+Skipped:\s+(\d+),\s+Total:\s+(\d+)") {
                        $failedTests += [int]$matches[1]
                        $passedTests += [int]$matches[2] 
                        $totalTests += [int]$matches[4]
                    }
                }
                Write-Success "Tests passed: $testProject"
            } else {
                Write-TestError "Tests failed: $testProject"
                $testOutput | Write-Host
                throw "Unit tests failed for $testProject"
            }
        } else {
            Write-Warning "Test project not found: $testProject"
        }
    }
    
    if ($totalTests -gt 0) {
        Write-Success "Unit tests completed - Passed: $passedTests, Failed: $failedTests, Total: $totalTests"
        $testResults.Tests.Status = "Passed"
        $testResults.Tests.Details = "Passed: $passedTests, Failed: $failedTests, Total: $totalTests"
    } else {
        Write-Warning "No tests executed"
        $testResults.Tests.Status = "Warning"
        $testResults.Tests.Details = "No tests found to execute"
    }

    # Phase 4: Integration tests (optional)
    if ($Integration) {
        Write-Phase "4" "Running integration tests"
        Write-Warning "Integration tests not yet fully implemented"
        $testResults.Integration.Status = "NotImplemented"
        $testResults.Integration.Details = "Integration test framework pending"
    }

} catch {
    Write-TestError "Test pipeline failed: $($_.Exception.Message)"
    
    # Mark current phase as failed
    foreach ($phase in $testResults.Keys) {
        if ($testResults[$phase].Status -eq "Pending") {
            $testResults[$phase].Status = "Failed"
            $testResults[$phase].Details = $_.Exception.Message
            break
        }
    }
    
    # Exit code will be set at the end
} finally {
    # Phase 5: Report results
    Write-Phase "REPORT" "Test pipeline results summary"
    
    $duration = (Get-Date) - $testResults.StartTime
    Write-Host "`n📊 NOOR Canvas Test Results" -ForegroundColor Cyan
    Write-Host "Duration: $($duration.ToString('mm\:ss'))" -ForegroundColor Gray
    Write-Host "Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
    
    Write-Host "`nPhase Results:" -ForegroundColor Cyan
    foreach ($phase in @("Lint", "Verify", "Build", "Tests", "Integration")) {
        $result = $testResults[$phase]
        $status = $result.Status
        $details = if ($result.Details) { " - $($result.Details)" } else { "" }
        
        $color = switch ($status) {
            "Passed" { "Green" }
            "Failed" { "Red" }
            "Warning" { "Yellow" }
            "Skipped" { "Gray" }
            "NotImplemented" { "DarkYellow" }
            "Pending" { "Yellow" }
        }
        
        $icon = switch ($status) {
            "Passed" { "✅" }
            "Failed" { "❌" }
            "Warning" { "⚠️ " }
            "Skipped" { "⏭️ " }
            "NotImplemented" { "🚧" }
            "Pending" { "⏳" }
        }
        
        Write-Host "$icon $phase`: $status$details" -ForegroundColor $color
    }
    
    # Overall result
    $overallStatus = if ($testResults.Values | Where-Object { $_.Status -eq "Failed" }) { 
        "FAILED" 
    } elseif ($testResults.Values | Where-Object { $_.Status -eq "Warning" }) { 
        "WARNING" 
    } else { 
        "PASSED" 
    }
    
    Write-Host "`n🎯 Overall Result: $overallStatus" -ForegroundColor $(if ($overallStatus -eq "PASSED") { "Green" } elseif ($overallStatus -eq "WARNING") { "Yellow" } else { "Red" })
    
    if ($overallStatus -eq "FAILED") {
        exit 1
    } else {
        exit 0
    }
}
