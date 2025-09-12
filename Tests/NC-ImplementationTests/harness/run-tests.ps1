# Run all tests in the NC Implementation Test Suite
# This script does not build the application. It runs tests (dotnet test) where test projects are present.

$testsRoot = "$(Split-Path -Parent $MyInvocation.MyCommand.Path)\..\tests"
Write-Host "Running NC Implementation Test Suite..."

# Discover test projects (csproj) under tests folder
$testProjects = Get-ChildItem -Path $testsRoot -Recurse -Include *.csproj -ErrorAction SilentlyContinue

if (-not $testProjects) {
    Write-Host "No .csproj test projects found under $testsRoot. Create test projects under tests/unit, tests/integration, or tests/e2e."
    exit 0
}

$allPassed = $true
foreach ($proj in $testProjects) {
    Write-Host "Running tests in $($proj.FullName)"
    dotnet test $proj.FullName --no-build --nologo
    if ($LASTEXITCODE -ne 0) { $allPassed = $false }
}

if ($allPassed) {
    Write-Host "All tests passed"
    exit 0
} else {
    Write-Host "Some tests failed"
    exit 1
}
