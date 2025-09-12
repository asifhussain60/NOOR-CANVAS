# NOOR Canvas Test Runner - PowerShell 5.1 Compatible
param([switch]$Help)

if ($Help) {
    Write-Host "NOOR Canvas Test Runner" -ForegroundColor Cyan
    exit 0
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path "$scriptDir\..\..\..\"

Write-Host "🚀 NOOR Canvas Test Runner" -ForegroundColor Cyan
$startTime = Get-Date

# Phase 1: Verify test coverage
Write-Host "`nPhase 1: Verifying test coverage" -ForegroundColor Cyan
& "$scriptDir\verify-completed-tests.ps1"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Test verification failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Test verification passed" -ForegroundColor Green

# Phase 2: Build solution  
Write-Host "`nPhase 2: Building solution" -ForegroundColor Cyan
Set-Location $repoRoot
dotnet restore "NoorCanvas.sln" --verbosity quiet
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Package restore failed" -ForegroundColor Red
    exit 1
}

dotnet build "NoorCanvas.sln" --no-restore --verbosity quiet
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build successful" -ForegroundColor Green

# Phase 3: Run tests
Write-Host "`nPhase 3: Running tests" -ForegroundColor Cyan

Write-Host "Testing: NoorCanvas.Core.Tests" -ForegroundColor Gray
dotnet test "Tests\NoorCanvas.Core.Tests\NoorCanvas.Core.Tests.csproj" --no-build --verbosity quiet
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Core tests failed" -ForegroundColor Red
    exit 1
}

Write-Host "Testing: NC-ImplementationTests" -ForegroundColor Gray  
dotnet test "Tests\NC-ImplementationTests\NC-ImplementationTests.csproj" --no-build --verbosity quiet
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Implementation tests failed" -ForegroundColor Red
    exit 1
}

# Summary
$duration = (Get-Date) - $startTime
Write-Host "`n✅ All tests passed!" -ForegroundColor Green
Write-Host "Duration: $($duration.ToString('mm\:ss'))" -ForegroundColor Gray
exit 0
