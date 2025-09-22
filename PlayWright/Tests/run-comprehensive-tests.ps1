# ====================================================================
# NOOR Canvas Comprehensive Test Runner
# Executes all test suites and provides detailed reporting
# ====================================================================

param(
    [switch]$Controllers,     # Run only controller tests
    [switch]$Services,        # Run only service tests
    [switch]$Models,          # Run only model tests  
    [switch]$Integration,     # Run only integration tests
    [switch]$Coverage,        # Generate coverage report
    [switch]$Verbose,         # Verbose output
    [switch]$FailFast,        # Stop on first failure
    [string]$Filter = "",     # Test filter
    [string]$Output = "console" # Output format: console, xml, trx
)

# Script configuration
$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"

# Paths
$WorkspaceRoot = "D:\PROJECTS\NOOR CANVAS"
$TestProject = "$WorkspaceRoot\Tests\NoorCanvas.Core.Tests"
$MainProject = "$WorkspaceRoot\SPA\NoorCanvas"
$OutputDir = "$WorkspaceRoot\Tests\TestResults"

# Colors for output
$Green = "Green"
$Red = "Red"
$Yellow = "Yellow"
$Cyan = "Cyan"
$Magenta = "Magenta"

function Write-Header {
    param([string]$Title)
    
    Write-Host ""
    Write-Host "═" * 80 -ForegroundColor $Cyan
    Write-Host " $Title" -ForegroundColor $Cyan
    Write-Host "═" * 80 -ForegroundColor $Cyan
}

function Write-Section {
    param([string]$Title)
    
    Write-Host ""
    Write-Host "▶ $Title" -ForegroundColor $Yellow
    Write-Host "─" * 60 -ForegroundColor $Yellow
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor $Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor $Red
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor $Yellow
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor $Cyan
}

# Initialize test results
$TestResults = @{
    Controllers = @{ Passed = 0; Failed = 0; Skipped = 0; Total = 0 }
    Services = @{ Passed = 0; Failed = 0; Skipped = 0; Total = 0 }
    Models = @{ Passed = 0; Failed = 0; Skipped = 0; Total = 0 }
    Integration = @{ Passed = 0; Failed = 0; Skipped = 0; Total = 0 }
    Overall = @{ Passed = 0; Failed = 0; Skipped = 0; Total = 0 }
    StartTime = Get-Date
    EndTime = $null
    Duration = $null
}

function Initialize-TestEnvironment {
    Write-Section "Initializing Test Environment"
    
    # Create output directory
    if (-not (Test-Path $OutputDir)) {
        New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
        Write-Success "Created test results directory: $OutputDir"
    }
    
    # Verify projects exist
    if (-not (Test-Path $TestProject)) {
        Write-Error "Test project not found: $TestProject"
        exit 1
    }
    
    if (-not (Test-Path $MainProject)) {
        Write-Error "Main project not found: $MainProject"
        exit 1
    }
    
    Write-Success "Test environment initialized"
}

function Build-Projects {
    Write-Section "Building Projects"
    
    # Build main project
    Write-Info "Building main project..."
    Push-Location $MainProject
    try {
        $buildResult = dotnet build --no-restore --verbosity minimal
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Main project built successfully"
        } else {
            Write-Error "Main project build failed"
            Write-Host $buildResult -ForegroundColor $Red
            return $false
        }
    }
    finally {
        Pop-Location
    }
    
    # Build test project
    Write-Info "Building test project..."
    Push-Location $TestProject
    try {
        $buildResult = dotnet build --no-restore --verbosity minimal
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Test project built successfully"
            return $true
        } else {
            Write-Error "Test project build failed"
            Write-Host $buildResult -ForegroundColor $Red
            return $false
        }
    }
    finally {
        Pop-Location
    }
}

function Run-TestCategory {
    param(
        [string]$Category,
        [string]$DisplayName,
        [string]$TestFilter
    )
    
    Write-Section "Running $DisplayName Tests"
    
    Push-Location $TestProject
    try {
        $testArgs = @(
            "test"
            "--no-build"
            "--verbosity", $(if ($Verbose) { "detailed" } else { "normal" })
            "--logger", "console;verbosity=normal"
        )
        
        if ($Coverage) {
            $testArgs += "--collect", "XPlat Code Coverage"
        }
        
        if ($FailFast) {
            $testArgs += "--logger", "trx", "--results-directory", $OutputDir
        }
        
        if ($TestFilter) {
            $testArgs += "--filter", $TestFilter
        }
        
        if ($Output -eq "xml") {
            $testArgs += "--logger", "junit;LogFilePath=$OutputDir\$Category-results.xml"
        }
        
        Write-Info "Executing: dotnet $($testArgs -join ' ')"
        
        $output = & dotnet @testArgs 2>&1
        $exitCode = $LASTEXITCODE
        
        if ($Verbose) {
            Write-Host $output
        }
        
        # Parse results from output
        $passed = 0
        $failed = 0
        $skipped = 0
        
        if ($output -match "Passed!\s+-\s+Failed:\s+(\d+),\s+Passed:\s+(\d+),\s+Skipped:\s+(\d+)") {
            $failed = [int]$matches[1]
            $passed = [int]$matches[2]
            $skipped = [int]$matches[3]
        } elseif ($output -match "(\d+) passed.*?(\d+) failed.*?(\d+) skipped") {
            $passed = [int]$matches[1]
            $failed = [int]$matches[2]
            $skipped = [int]$matches[3]
        } elseif ($output -match "Total tests: (\d+).*?Passed: (\d+).*?Failed: (\d+).*?Skipped: (\d+)") {
            $passed = [int]$matches[2]
            $failed = [int]$matches[3]
            $skipped = [int]$matches[4]
        }
        
        $total = $passed + $failed + $skipped
        
        # Update results
        $TestResults[$Category].Passed = $passed
        $TestResults[$Category].Failed = $failed
        $TestResults[$Category].Skipped = $skipped
        $TestResults[$Category].Total = $total
        
        # Update overall results
        $TestResults.Overall.Passed += $passed
        $TestResults.Overall.Failed += $failed
        $TestResults.Overall.Skipped += $skipped
        $TestResults.Overall.Total += $total
        
        # Display results
        if ($failed -eq 0) {
            Write-Success "$DisplayName: $passed passed, $skipped skipped"
        } else {
            Write-Error "$DisplayName: $failed failed, $passed passed, $skipped skipped"
        }
        
        return $exitCode -eq 0
    }
    finally {
        Pop-Location
    }
}

function Generate-TestReport {
    Write-Section "Test Execution Summary"
    
    $TestResults.EndTime = Get-Date
    $TestResults.Duration = $TestResults.EndTime - $TestResults.StartTime
    
    # Summary table
    Write-Host ""
    Write-Host "┌─" + ("─" * 15) + "┬─" + ("─" * 8) + "┬─" + ("─" * 8) + "┬─" + ("─" * 8) + "┬─" + ("─" * 8) + "┐"
    Write-Host "│ Test Category   │ Passed │ Failed │ Skipped│ Total  │"
    Write-Host "├─" + ("─" * 15) + "┼─" + ("─" * 8) + "┼─" + ("─" * 8) + "┼─" + ("─" * 8) + "┼─" + ("─" * 8) + "┤"
    
    foreach ($category in @("Controllers", "Services", "Models", "Integration")) {
        $result = $TestResults[$category]
        if ($result.Total -gt 0) {
            $categoryPadded = $category.PadRight(15)
            $passedPadded = $result.Passed.ToString().PadLeft(8)
            $failedPadded = $result.Failed.ToString().PadLeft(8)
            $skippedPadded = $result.Skipped.ToString().PadLeft(8)
            $totalPadded = $result.Total.ToString().PadLeft(8)
            
            Write-Host "│ $categoryPadded│$passedPadded│$failedPadded│$skippedPadded│$totalPadded│"
        }
    }
    
    Write-Host "├─" + ("─" * 15) + "┼─" + ("─" * 8) + "┼─" + ("─" * 8) + "┼─" + ("─" * 8) + "┼─" + ("─" * 8) + "┤"
    
    $overall = $TestResults.Overall
    $overallPadded = "TOTAL".PadRight(15)
    $passedPadded = $overall.Passed.ToString().PadLeft(8)
    $failedPadded = $overall.Failed.ToString().PadLeft(8)
    $skippedPadded = $overall.Skipped.ToString().PadLeft(8)
    $totalPadded = $overall.Total.ToString().PadLeft(8)
    
    Write-Host "│ $overallPadded│$passedPadded│$failedPadded│$skippedPadded│$totalPadded│" -ForegroundColor $Cyan
    Write-Host "└─" + ("─" * 15) + "┴─" + ("─" * 8) + "┴─" + ("─" * 8) + "┴─" + ("─" * 8) + "┴─" + ("─" * 8) + "┘"
    
    Write-Host ""
    Write-Host "Execution Time: $($TestResults.Duration.ToString('mm\:ss\.fff'))" -ForegroundColor $Magenta
    
    # Success/failure summary
    if ($overall.Failed -eq 0) {
        Write-Success "All tests passed! 🎉"
        Write-Host ""
        Write-Info "Coverage: $(if ($Coverage) { "Generated" } else { "Not requested" })"
        Write-Info "Test Results: $OutputDir"
        return $true
    } else {
        Write-Error "Some tests failed! 😞"
        Write-Warning "Please review the failed tests and fix any issues."
        return $false
    }
}

function Show-Usage {
    Write-Host ""
    Write-Host "NOOR Canvas Test Runner" -ForegroundColor $Cyan
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor $Yellow
    Write-Host "  .\run-comprehensive-tests.ps1 [options]" -ForegroundColor $Green
    Write-Host ""
    Write-Host "Options:" -ForegroundColor $Yellow
    Write-Host "  -Controllers    Run only controller tests"
    Write-Host "  -Services       Run only service tests"
    Write-Host "  -Models         Run only model tests"
    Write-Host "  -Integration    Run only integration tests"
    Write-Host "  -Coverage       Generate code coverage report"
    Write-Host "  -Verbose        Enable verbose output"
    Write-Host "  -FailFast       Stop on first test failure"
    Write-Host "  -Filter         Apply test filter (e.g. 'Category=Unit')"
    Write-Host "  -Output         Output format: console, xml, trx"
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor $Yellow
    Write-Host "  .\run-comprehensive-tests.ps1                    # Run all tests"
    Write-Host "  .\run-comprehensive-tests.ps1 -Controllers       # Run only controller tests"
    Write-Host "  .\run-comprehensive-tests.ps1 -Coverage -Verbose # Run with coverage and verbose output"
    Write-Host "  .\run-comprehensive-tests.ps1 -Filter 'Method=CreateSession' # Run specific tests"
}

# Main execution
try {
    Write-Header "NOOR Canvas Comprehensive Test Suite"
    
    # Check for help
    if ($args -contains "-h" -or $args -contains "--help" -or $args -contains "help") {
        Show-Usage
        exit 0
    }
    
    # Initialize environment
    Initialize-TestEnvironment
    
    # Build projects
    Write-Info "Building projects before running tests..."
    if (-not (Build-Projects)) {
        Write-Error "Build failed - cannot run tests"
        exit 1
    }
    
    # Determine which tests to run
    $runAll = -not ($Controllers -or $Services -or $Models -or $Integration)
    
    # Run test categories
    $allPassed = $true
    
    if ($runAll -or $Controllers) {
        $testFilter = if ($Filter) { "Category=HostController|Category=ParticipantController|$Filter" } else { "Category=HostController|Category=ParticipantController" }
        $passed = Run-TestCategory "Controllers" "Controller" $testFilter
        $allPassed = $allPassed -and $passed
    }
    
    if ($runAll -or $Services) {
        $testFilter = if ($Filter) { "Category=AnnotationService|Category=DialogService|$Filter" } else { "Category=AnnotationService|Category=DialogService" }
        $passed = Run-TestCategory "Services" "Service" $testFilter
        $allPassed = $allPassed -and $passed
    }
    
    if ($runAll -or $Models) {
        $testFilter = if ($Filter) { "Category=Models|Category=BusinessLogic|$Filter" } else { "Category=Models|Category=BusinessLogic" }
        $passed = Run-TestCategory "Models" "Model/Entity" $testFilter
        $allPassed = $allPassed -and $passed
    }
    
    if ($runAll -or $Integration) {
        $testFilter = if ($Filter) { "Category=DatabaseIntegration|Category=ApiIntegration|Category=ApiPerformance|$Filter" } else { "Category=DatabaseIntegration|Category=ApiIntegration|Category=ApiPerformance" }
        $passed = Run-TestCategory "Integration" "Integration" $testFilter
        $allPassed = $allPassed -and $passed
    }
    
    # Generate final report
    $success = Generate-TestReport
    
    if ($success -and $allPassed) {
        Write-Host ""
        Write-Success "NOOR Canvas test suite completed successfully!"
        exit 0
    } else {
        Write-Host ""
        Write-Error "NOOR Canvas test suite completed with failures."
        exit 1
    }
}
catch {
    Write-Error "Test execution failed: $($_.Exception.Message)"
    Write-Host $_.ScriptStackTrace -ForegroundColor $Red
    exit 1
}
