# NOOR Canvas Simple Test Runner
# Basic test pipeline for PowerShell 5.1 compatibility

param(
    [switch]$SkipLint,
    [switch]$Verbose,
    [switch]$Help
)

if ($Help) {
    Write-Host "NOOR Canvas Test Runner v2.0" -ForegroundColor Cyan
    Write-Host "Usage: .\simple-test-runner.ps1 [-SkipLint] [-Verbose]" -ForegroundColor Gray
    exit 0
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path "$scriptDir\..\..\..\"
$solutionPath = Join-Path $repoRoot "NoorCanvas.sln"

Write-Host "🚀 NOOR Canvas Test Runner v2.0" -ForegroundColor Cyan
Write-Host "Repository: $repoRoot" -ForegroundColor Gray

$exitCode = 0
$startTime = Get-Date
# Phase 1: Verify completed issue test coverage
Write-Host "`n[$(Get-Date -Format 'HH:mm:ss')] Phase 1 - Verifying test coverage" -ForegroundColor Cyan
& "$scriptDir\verify-completed-tests.ps1"
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ All completed issues have test stubs" -ForegroundColor Green
} else {
    Write-Host "❌ Test verification failed" -ForegroundColor Red
    $exitCode = 1
}

# Phase 2: Build solution (only if Phase 1 succeeded)
if ($exitCode -eq 0) {
    Write-Host "`n[$(Get-Date -Format 'HH:mm:ss')] Phase 2 - Building solution" -ForegroundColor Cyan
    Set-Location $repoRoot
    
    Write-Host "📦 Restoring packages..." -ForegroundColor Gray
    dotnet restore $solutionPath --verbosity quiet
    if ($LASTEXITCODE -ne 0) { 
        Write-Host "❌ Package restore failed" -ForegroundColor Red
        $exitCode = 1
    } else {
        Write-Host "🏗️  Building..." -ForegroundColor Gray
        dotnet build $solutionPath --no-restore --verbosity quiet
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Solution built successfully" -ForegroundColor Green
        } else {
            Write-Host "❌ Build failed" -ForegroundColor Red
            $exitCode = 1
        }
    }
}

# Phase 3: Run tests (only if build succeeded)
if ($exitCode -eq 0) {
    Write-Host "`n[$(Get-Date -Format 'HH:mm:ss')] Phase 3 - Running tests" -ForegroundColor Cyan
    
    $testProjects = @(
        "Tests\NoorCanvas.Core.Tests\NoorCanvas.Core.Tests.csproj",
        "Tests\NC-ImplementationTests\NC-ImplementationTests.csproj"
    )
    
    $testsRun = $false
    
    foreach ($testProject in $testProjects) {
        $projectPath = Join-Path $repoRoot $testProject
        if (Test-Path $projectPath) {
            Write-Host "🧪 Running tests: $(Split-Path -Leaf $testProject)" -ForegroundColor Gray
            dotnet test $projectPath --no-build --verbosity quiet
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Tests passed: $(Split-Path -Leaf $testProject)" -ForegroundColor Green
                $testsRun = $true
            } else {
                Write-Host "❌ Tests failed: $(Split-Path -Leaf $testProject)" -ForegroundColor Red
                $exitCode = 1
            }
        } else {
            Write-Host "⚠️  Test project not found: $testProject" -ForegroundColor Yellow
        }
    }
    
    if ($testsRun -and $exitCode -eq 0) {
        Write-Host "✅ All tests completed successfully" -ForegroundColor Green
    } elseif (-not $testsRun) {
        Write-Host "⚠️  No tests were executed" -ForegroundColor Yellow
    }
}

# Results summary
$duration = (Get-Date) - $startTime
Write-Host "`n📊 Test Results Summary" -ForegroundColor Cyan
Write-Host "Duration: $($duration.ToString('mm\:ss'))" -ForegroundColor Gray
Write-Host "Result: $(if ($exitCode -eq 0) { 'PASSED ✅' } else { 'FAILED ❌' })" -ForegroundColor $(if ($exitCode -eq 0) { 'Green' } else { 'Red' })

exit $exitCode
