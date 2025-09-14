# Automated Testing Technical Reference

## Architecture Overview

The NOOR Canvas automated testing system provides comprehensive test automation through a multi-layered approach combining build integration, Git hooks, and intelligent caching. The system is designed to maximize code quality while minimizing developer friction.

## Core Components

### 1. Post-Build Test Integration

**Implementation**: `.hooks/post-build.ps1`

The post-build testing system automatically executes tests after successful compilation, using build artifact hashing to determine when tests are needed.

```powershell
# Core build artifact detection
function Get-BuildArtifactHash {
    param([string]$Configuration = "Debug")
    
    $artifactPaths = @(
        "SPA\NoorCanvas\bin\$Configuration\net8.0\*.dll",
        "SPA\NoorCanvas\bin\$Configuration\net8.0\*.exe"
    )
    
    $files = Get-ChildItem $artifactPaths -ErrorAction SilentlyContinue
    if (-not $files) { return $null }
    
    $hashInput = ($files | ForEach-Object { 
        "$($_.Name):$($_.LastWriteTime.Ticks):$($_.Length)" 
    }) -join "|"
    
    return [System.Security.Cryptography.SHA256]::Create().ComputeHash([System.Text.Encoding]::UTF8.GetBytes($hashInput)) | ForEach-Object { $_.ToString("x2") } | Join-String
}

# Cache management
$cacheDir = ".build-cache"
$lastHashFile = Join-Path $cacheDir "last-build-hash.txt"

$currentHash = Get-BuildArtifactHash -Configuration $Configuration
$lastHash = if (Test-Path $lastHashFile) { Get-Content $lastHashFile -Raw } else { "" }

if ($currentHash -eq $lastHash -and -not $Force) {
    Write-Host "⚡ Tests skipped - build artifacts unchanged" -ForegroundColor Yellow
    return 0
}
```

### 2. Pre-Commit Test Validation

**Implementation**: `.hooks/pre-commit-test.ps1` + Git pre-commit hook

Pre-commit testing prevents broken code from entering the repository by validating all changes before commits are accepted.

```powershell
# Source code hash calculation
function Get-SourceCodeHash {
    $sourceExtensions = @("*.cs", "*.cshtml", "*.razor", "*.js", "*.ts")
    $excludePaths = @("bin", "obj", "node_modules", ".git", "_site")
    
    $allFiles = @()
    foreach ($ext in $sourceExtensions) {
        $files = Get-ChildItem -Recurse -Include $ext -ErrorAction SilentlyContinue |
                Where-Object { 
                    $path = $_.FullName
                    -not ($excludePaths | Where-Object { $path -like "*\$_\*" })
                }
        $allFiles += $files
    }
    
    if (-not $allFiles) { return "" }
    
    # Create deterministic hash from file contents and paths
    $hashInput = ($allFiles | Sort-Object FullName | ForEach-Object {
        $relativePath = $_.FullName -replace [Regex]::Escape((Get-Location).Path), ""
        $content = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
        "$relativePath|$($_.LastWriteTime.Ticks)|$($content.GetHashCode())"
    }) -join "`n"
    
    $hasher = [System.Security.Cryptography.SHA256]::Create()
    $hashBytes = $hasher.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($hashInput))
    return [System.BitConverter]::ToString($hashBytes) -replace '-', ''
}

# Git hook integration
$hookPath = ".git\hooks\pre-commit"
if (-not (Test-Path $hookPath)) {
    Write-Host "⚠️  Installing Git pre-commit hook..." -ForegroundColor Yellow
    Install-GitHook
}
```

### 3. Smart Caching System

The caching system prevents redundant test execution while ensuring comprehensive validation.

#### Cache Architecture

```
.test-cache/                    # Pre-commit test cache
├── last-test-hash.txt         # SHA256 of source files from last test
├── last-test-result.txt       # PASS/FAIL status of last test
└── last-test-timestamp.txt    # When tests were last executed

.build-cache/                   # Post-build test cache  
├── last-build-hash.txt        # SHA256 of build artifacts
└── last-build-timestamp.txt   # When build tests were last run
```

#### Cache Validation Logic

```powershell
function Test-CacheValid {
    param(
        [string]$CurrentHash,
        [string]$CacheType = "test"
    )
    
    $cacheDir = ".$CacheType-cache"
    $hashFile = Join-Path $cacheDir "last-$CacheType-hash.txt"
    $resultFile = Join-Path $cacheDir "last-$CacheType-result.txt"
    
    # Cache is valid if:
    # 1. Hash file exists and matches current hash
    # 2. Result file exists and shows PASS
    # 3. Cache timestamp is recent (within 24 hours)
    
    if (-not (Test-Path $hashFile) -or -not (Test-Path $resultFile)) {
        return $false
    }
    
    $cachedHash = Get-Content $hashFile -Raw
    $cachedResult = Get-Content $resultFile -Raw
    
    return ($cachedHash -eq $CurrentHash) -and ($cachedResult -eq "PASS")
}

function Update-TestCache {
    param(
        [string]$Hash,
        [string]$Result,
        [string]$CacheType = "test"
    )
    
    $cacheDir = ".$CacheType-cache"
    if (-not (Test-Path $cacheDir)) {
        New-Item -ItemType Directory -Path $cacheDir -Force | Out-Null
    }
    
    Set-Content -Path (Join-Path $cacheDir "last-$CacheType-hash.txt") -Value $Hash
    Set-Content -Path (Join-Path $cacheDir "last-$CacheType-result.txt") -Value $Result
    Set-Content -Path (Join-Path $cacheDir "last-$CacheType-timestamp.txt") -Value (Get-Date -Format "o")
}
```

### 4. Test Execution Engine

#### Test Discovery and Execution

```powershell
function Invoke-TestSuite {
    param(
        [string]$Configuration = "Debug",
        [switch]$Verbose
    )
    
    $testProjects = @(
        "Tests\NoorCanvas.Core.Tests\NoorCanvas.Core.Tests.csproj",
        "Tests\NC-ImplementationTests\NC-ImplementationTests.csproj"
    )
    
    $totalTests = 0
    $passedTests = 0
    $failedTests = 0
    
    foreach ($project in $testProjects) {
        if (Test-Path $project) {
            Write-Host "🧪 Running tests: $(Split-Path $project -Leaf)" -ForegroundColor Cyan
            
            $testArgs = @(
                "test", $project,
                "--configuration", $Configuration,
                "--no-build",
                "--logger", "console;verbosity=minimal"
            )
            
            if ($Verbose) {
                $testArgs += "--logger", "console;verbosity=detailed"
            }
            
            $testResult = & dotnet $testArgs 2>&1
            $testExitCode = $LASTEXITCODE
            
            # Parse test results
            $resultMatch = $testResult | Select-String "Total tests: (\d+). Passed: (\d+). Failed: (\d+)"
            if ($resultMatch) {
                $total = [int]$resultMatch.Matches[0].Groups[1].Value
                $passed = [int]$resultMatch.Matches[0].Groups[2].Value  
                $failed = [int]$resultMatch.Matches[0].Groups[3].Value
                
                $totalTests += $total
                $passedTests += $passed
                $failedTests += $failed
            }
            
            if ($testExitCode -ne 0) {
                Write-Host "❌ Tests failed in $project" -ForegroundColor Red
                if ($Verbose) {
                    Write-Host $testResult -ForegroundColor Gray
                }
            }
        }
    }
    
    # Summary reporting
    if ($failedTests -gt 0) {
        Write-Host "❌ Test Summary: $passedTests passed, $failedTests failed ($totalTests total)" -ForegroundColor Red
        return 1
    } else {
        Write-Host "✅ Test Summary: All $passedTests tests passed" -ForegroundColor Green
        return 0
    }
}
```

### 5. Git Hook Integration

#### Pre-Commit Hook Implementation

```bash
#!/bin/sh
# .git/hooks/pre-commit

# Execute PowerShell pre-commit tests
if command -v pwsh >/dev/null 2>&1; then
    pwsh -ExecutionPolicy Bypass -File ".hooks/pre-commit-test.ps1"
elif command -v powershell >/dev/null 2>&1; then
    powershell -ExecutionPolicy Bypass -File ".hooks/pre-commit-test.ps1"
else
    echo "❌ PowerShell not found - cannot run pre-commit tests"
    exit 1
fi

exit $?
```

#### Hook Installation and Management

```powershell
function Install-GitHook {
    param([string]$HookType = "pre-commit")
    
    $hooksDir = ".git\hooks"
    $hookPath = Join-Path $hooksDir $HookType
    
    if (-not (Test-Path $hooksDir)) {
        Write-Error "Not in a Git repository (.git/hooks not found)"
        return $false
    }
    
    $hookContent = @"
#!/bin/sh
# Auto-generated NOOR Canvas $HookType hook

if command -v pwsh >/dev/null 2>&1; then
    pwsh -ExecutionPolicy Bypass -File ".hooks/$HookType-test.ps1"
elif command -v powershell >/dev/null 2>&1; then  
    powershell -ExecutionPolicy Bypass -File ".hooks/$HookType-test.ps1"
else
    echo "❌ PowerShell not found - cannot run $HookType tests"
    exit 1
fi

exit $?
"@
    
    Set-Content -Path $hookPath -Value $hookContent -Encoding ASCII
    
    # Make executable on Unix systems
    if ($IsLinux -or $IsMacOS) {
        chmod +x $hookPath
    }
    
    Write-Host "✅ Installed Git $HookType hook" -ForegroundColor Green
    return $true
}

function Remove-GitHook {
    param([string]$HookType = "pre-commit")
    
    $hookPath = ".git\hooks\$HookType"
    if (Test-Path $hookPath) {
        Remove-Item $hookPath -Force
        Write-Host "✅ Removed Git $HookType hook" -ForegroundColor Green
    }
}
```

### 6. VS Code Integration

#### Task Configuration

```json
{
    "version": "2.0.0",
    "tasks": [
        {
            "label": "build-with-tests",
            "type": "process",
            "command": "dotnet",
            "args": [
                "build",
                "${workspaceFolder}/SPA/NoorCanvas/NoorCanvas.csproj"
            ],
            "group": {
                "kind": "build",
                "isDefault": true
            },
            "dependsOn": "run-post-build-tests",
            "presentation": {
                "echo": true,
                "reveal": "always",
                "focus": false,
                "panel": "shared"
            }
        },
        {
            "label": "run-post-build-tests",
            "type": "shell", 
            "command": "powershell.exe",
            "args": [
                "-NoProfile",
                "-ExecutionPolicy", "Bypass",
                "-File", "${workspaceFolder}/.hooks/post-build.ps1",
                "-Configuration", "Debug"
            ],
            "group": "test",
            "presentation": {
                "echo": false,
                "reveal": "always", 
                "focus": false,
                "panel": "shared"
            }
        }
    ]
}
```

### 7. Performance Optimization

#### Parallel Test Execution

```powershell
function Invoke-ParallelTests {
    param([string[]]$TestProjects)
    
    $jobs = @()
    
    foreach ($project in $TestProjects) {
        $job = Start-Job -ScriptBlock {
            param($ProjectPath)
            
            $result = & dotnet test $ProjectPath --logger "console;verbosity=minimal" 2>&1
            return @{
                Project = $ProjectPath
                ExitCode = $LASTEXITCODE
                Output = $result
            }
        } -ArgumentList $project
        
        $jobs += $job
    }
    
    # Wait for all tests to complete
    $results = $jobs | Wait-Job | Receive-Job
    $jobs | Remove-Job
    
    return $results
}
```

#### Incremental Testing

```powershell
function Get-ChangedTestProjects {
    param([string[]]$ChangedFiles)
    
    $testProjects = @()
    
    foreach ($file in $ChangedFiles) {
        # Determine which test projects need to run based on changed files
        switch -Regex ($file) {
            "Controllers/" { $testProjects += "Tests\NoorCanvas.Core.Tests" }
            "Models/" { $testProjects += "Tests\NoorCanvas.Core.Tests" }
            "Services/" { $testProjects += "Tests\NoorCanvas.Core.Tests" }
            "Tools/HostProvisioner/" { $testProjects += "Tests\NC-ImplementationTests" }
        }
    }
    
    return $testProjects | Sort-Object -Unique
}
```

### 8. Error Handling and Recovery

#### Test Failure Analysis

```powershell
function Analyze-TestFailures {
    param([string]$TestOutput)
    
    $failures = @()
    
    # Parse common failure patterns
    $patterns = @{
        "DatabaseConnection" = ".*connection.*timeout.*|.*cannot connect.*database.*"
        "ApiEndpoint" = ".*HTTP.*404.*|.*endpoint.*not found.*"
        "SignalR" = ".*SignalR.*connection.*failed.*|.*hub.*not available.*"
        "Authentication" = ".*unauthorized.*|.*token.*invalid.*"
    }
    
    foreach ($category in $patterns.Keys) {
        if ($TestOutput -match $patterns[$category]) {
            $failures += @{
                Category = $category
                Pattern = $patterns[$category]
                Suggestion = Get-FailureSuggestion -Category $category
            }
        }
    }
    
    return $failures
}

function Get-FailureSuggestion {
    param([string]$Category)
    
    switch ($Category) {
        "DatabaseConnection" { 
            return "Check database server status and connection strings in appsettings.json"
        }
        "ApiEndpoint" {
            return "Verify API controller routes and ensure application is running"
        }
        "SignalR" {
            return "Check SignalR hub registration and WebSocket configuration"
        }
        "Authentication" {
            return "Regenerate host tokens using 'nct' command"
        }
        default {
            return "Review test output and check recent code changes"
        }
    }
}
```

#### Automatic Recovery Mechanisms

```powershell
function Invoke-TestRecovery {
    param([string]$FailureCategory)
    
    switch ($FailureCategory) {
        "DatabaseConnection" {
            Write-Host "🔄 Attempting database recovery..." -ForegroundColor Yellow
            
            # Test database connectivity
            $connectionTest = Test-DatabaseConnection
            if (-not $connectionTest) {
                Write-Host "💡 Try: Restart SQL Server service or check connection string" -ForegroundColor Cyan
            }
        }
        
        "ApiEndpoint" {
            Write-Host "🔄 Attempting application restart..." -ForegroundColor Yellow
            
            # Kill existing processes and restart
            & iiskill
            Start-Sleep -Seconds 3
            & nc -SkipTokenGeneration
        }
        
        "Authentication" {
            Write-Host "🔄 Regenerating authentication tokens..." -ForegroundColor Yellow
            
            # Generate new tokens
            & nct
        }
    }
}
```

### 9. Reporting and Metrics

#### Test Result Reporting

```powershell
function Generate-TestReport {
    param(
        [hashtable]$TestResults,
        [string]$OutputFormat = "Console"
    )
    
    switch ($OutputFormat) {
        "Console" {
            Write-TestConsoleReport -Results $TestResults
        }
        "JUnit" {
            Write-TestJUnitReport -Results $TestResults
        }
        "Html" {
            Write-TestHtmlReport -Results $TestResults
        }
    }
}

function Write-TestConsoleReport {
    param([hashtable]$Results)
    
    Write-Host "`n📊 Test Execution Summary" -ForegroundColor Cyan
    Write-Host "═══════════════════════════" -ForegroundColor Cyan
    
    $total = $Results.Passed + $Results.Failed + $Results.Skipped
    $successRate = if ($total -gt 0) { [math]::Round(($Results.Passed / $total) * 100, 1) } else { 0 }
    
    Write-Host "✅ Passed: $($Results.Passed)" -ForegroundColor Green
    Write-Host "❌ Failed: $($Results.Failed)" -ForegroundColor Red
    Write-Host "⏭️  Skipped: $($Results.Skipped)" -ForegroundColor Yellow
    Write-Host "📈 Success Rate: $successRate%" -ForegroundColor Cyan
    Write-Host "⏱️  Duration: $($Results.Duration)" -ForegroundColor Gray
}
```

#### Performance Metrics Collection

```powershell
function Collect-TestMetrics {
    param([hashtable]$TestResults)
    
    $metrics = @{
        Timestamp = Get-Date -Format "o"
        TestCount = $TestResults.Passed + $TestResults.Failed
        SuccessRate = ($TestResults.Passed / ($TestResults.Passed + $TestResults.Failed)) * 100
        Duration = $TestResults.Duration
        CacheHitRate = $TestResults.CacheHits / $TestResults.TotalRuns * 100
        FailureCategories = $TestResults.FailureCategories
    }
    
    # Store metrics for trending analysis
    $metricsFile = ".test-cache\metrics.json"
    $allMetrics = if (Test-Path $metricsFile) { 
        Get-Content $metricsFile | ConvertFrom-Json 
    } else { @() }
    
    $allMetrics += $metrics
    
    # Keep only last 100 entries
    if ($allMetrics.Count -gt 100) {
        $allMetrics = $allMetrics[-100..-1]
    }
    
    $allMetrics | ConvertTo-Json -Depth 3 | Set-Content $metricsFile
}
```

## Configuration and Customization

### Test Configuration Files

```powershell
# .hooks/test-config.json
{
    "testProjects": [
        "Tests/NoorCanvas.Core.Tests/NoorCanvas.Core.Tests.csproj",
        "Tests/NC-ImplementationTests/NC-ImplementationTests.csproj"
    ],
    "cacheDuration": "24:00:00",
    "parallelExecution": true,
    "maxRetries": 3,
    "timeoutMinutes": 10,
    "reportFormats": ["console", "junit"],
    "excludePatterns": [
        "**/bin/**",
        "**/obj/**",
        "**/.git/**"
    ]
}
```

### Environment-Specific Settings

```powershell
function Get-TestConfiguration {
    param([string]$Environment = "Development")
    
    $configs = @{
        "Development" = @{
            DatabaseTimeout = 30
            ParallelTests = $true
            VerboseOutput = $true
            CachingEnabled = $true
        }
        "CI" = @{
            DatabaseTimeout = 60
            ParallelTests = $true
            VerboseOutput = $false
            CachingEnabled = $false
        }
        "Production" = @{
            DatabaseTimeout = 120
            ParallelTests = $false
            VerboseOutput = $false
            CachingEnabled = $false
        }
    }
    
    return $configs[$Environment]
}
```

For user-friendly information about using the automated testing system, see the [Automated Testing User Guide](../user-guides/automated-testing-user-guide.md).
