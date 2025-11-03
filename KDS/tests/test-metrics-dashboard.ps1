#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Test script for KDS Metrics Dashboard functionality
.DESCRIPTION
    Validates that:
    1. API server is running and responsive
    2. /api/health endpoint returns valid data
    3. /api/metrics endpoint returns valid data with all required fields
    4. Dashboard HTML file exists and contains all required elements
    5. Chart.js library is properly loaded
    6. All metric chart canvas elements exist
.PARAMETER Headless
    Run browser tests in headless mode (for CI/CD)
.EXAMPLE
    .\test-metrics-dashboard.ps1
    .\test-metrics-dashboard.ps1 -Headless
#>

param(
    [switch]$Headless
)

$ErrorActionPreference = "Stop"
$testResults = @{
    Passed = 0
    Failed = 0
    Warnings = 0
    Details = @()
}

function Write-TestResult {
    param(
        [string]$TestName,
        [string]$Status,  # "PASS", "FAIL", "WARN"
        [string]$Message
    )
    
    $icon = switch ($Status) {
        "PASS" { "✅" }
        "FAIL" { "❌" }
        "WARN" { "⚠️" }
    }
    
    Write-Host "$icon $TestName" -ForegroundColor $(
        switch ($Status) {
            "PASS" { "Green" }
            "FAIL" { "Red" }
            "WARN" { "Yellow" }
        }
    )
    
    if ($Message) {
        Write-Host "   $Message" -ForegroundColor Gray
    }
    
    $testResults.Details += @{
        Test = $TestName
        Status = $Status
        Message = $Message
        Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    }
    
    switch ($Status) {
        "PASS" { $testResults.Passed++ }
        "FAIL" { $testResults.Failed++ }
        "WARN" { $testResults.Warnings++ }
    }
}

Write-Host "`n🧪 KDS Metrics Dashboard Test Suite" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""

# Test 1: Check if API server is running
Write-Host "`n📡 Testing API Server..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8765/api/status" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-TestResult "API Server Running" "PASS" "Status code: 200"
    } else {
        Write-TestResult "API Server Running" "FAIL" "Status code: $($response.StatusCode)"
    }
} catch {
    Write-TestResult "API Server Running" "FAIL" "Cannot connect to http://localhost:8765 - Is the API server running?"
    Write-Host "`n💡 Start the API server with: .\KDS\scripts\launch-dashboard.ps1`n" -ForegroundColor Yellow
    exit 1
}

# Test 2: Validate /api/health endpoint
Write-Host "`n🏥 Testing /api/health endpoint..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "http://localhost:8765/api/health" -Method Get -TimeoutSec 10
    
    if ($healthResponse) {
        Write-TestResult "Health Endpoint Responds" "PASS" "Received response"
    } else {
        Write-TestResult "Health Endpoint Responds" "FAIL" "Empty response"
    }
    
    # Check required fields
    $requiredFields = @('timestamp', 'stats', 'categories')
    foreach ($field in $requiredFields) {
        if ($healthResponse.PSObject.Properties.Name -contains $field) {
            Write-TestResult "Health Data: $field" "PASS" "Field present"
        } else {
            Write-TestResult "Health Data: $field" "FAIL" "Field missing"
        }
    }
    
    # Check optional fields
    if ($healthResponse.PSObject.Properties.Name -contains 'status') {
        $statusValue = if ($healthResponse.status) { $healthResponse.status } else { "null" }
        Write-TestResult "Health Data: status" "PASS" "Field present (value: $statusValue)"
    }
    
    # Validate stats structure
    if ($healthResponse.stats) {
        $statsFields = @('passed', 'warnings', 'totalChecks')
        foreach ($field in $statsFields) {
            if ($healthResponse.stats.PSObject.Properties.Name -contains $field) {
                Write-TestResult "Health Stats: $field" "PASS" "Value: $($healthResponse.stats.$field)"
            } else {
                Write-TestResult "Health Stats: $field" "FAIL" "Field missing"
            }
        }
    }
    
} catch {
    Write-TestResult "/api/health Endpoint" "FAIL" $_.Exception.Message
}

# Test 3: Validate /api/metrics endpoint
Write-Host "`n📊 Testing /api/metrics endpoint..." -ForegroundColor Yellow
try {
    $metricsResponse = Invoke-RestMethod -Uri "http://localhost:8765/api/metrics" -Method Get -TimeoutSec 10
    
    if ($metricsResponse) {
        Write-TestResult "Metrics Endpoint Responds" "PASS" "Received response"
    } else {
        Write-TestResult "Metrics Endpoint Responds" "FAIL" "Empty response"
    }
    
    # Check required metric categories
    $requiredMetrics = @('brainHealth', 'routingAccuracy', 'knowledgeGraph', 'fileHotspots', 'eventActivity', 'testSuccess')
    foreach ($metric in $requiredMetrics) {
        if ($metricsResponse.PSObject.Properties.Name -contains $metric) {
            Write-TestResult "Metric Category: $metric" "PASS" "Present"
        } else {
            Write-TestResult "Metric Category: $metric" "FAIL" "Missing"
        }
    }
    
    # Validate brainHealth structure
    if ($metricsResponse.brainHealth) {
        $score = [int]$metricsResponse.brainHealth.score
        if ($null -ne $score -and $score -ge 0 -and $score -le 100) {
            Write-TestResult "BRAIN Health Score" "PASS" "Score: ${score}%"
        } else {
            Write-TestResult "BRAIN Health Score" "FAIL" "Invalid score value: $($metricsResponse.brainHealth.score)"
        }
        
        if ($metricsResponse.brainHealth.status) {
            Write-TestResult "BRAIN Health Status" "PASS" "Status: $($metricsResponse.brainHealth.status)"
        } else {
            Write-TestResult "BRAIN Health Status" "FAIL" "Missing status"
        }
    }
    
    # Validate routingAccuracy structure
    if ($metricsResponse.routingAccuracy) {
        $overall = $metricsResponse.routingAccuracy.overall
        if ($null -ne $overall) {
            Write-TestResult "Routing Accuracy Overall" "PASS" "Accuracy: ${overall}%"
        } else {
            Write-TestResult "Routing Accuracy Overall" "FAIL" "Missing overall accuracy"
        }
        
        if ($metricsResponse.routingAccuracy.byIntent) {
            $intentCount = ($metricsResponse.routingAccuracy.byIntent.PSObject.Properties | Measure-Object).Count
            Write-TestResult "Routing Accuracy by Intent" "PASS" "Tracking $intentCount intent types"
        } else {
            Write-TestResult "Routing Accuracy by Intent" "WARN" "No intent breakdown available"
        }
    }
    
    # Validate knowledgeGraph structure
    if ($metricsResponse.knowledgeGraph) {
        $totalEntries = $metricsResponse.knowledgeGraph.totalEntries
        if ($null -ne $totalEntries) {
            Write-TestResult "Knowledge Graph Entries" "PASS" "Total entries: $totalEntries"
        } else {
            Write-TestResult "Knowledge Graph Entries" "FAIL" "Missing total entries"
        }
    }
    
    # Validate eventActivity structure
    if ($metricsResponse.eventActivity) {
        $total = $metricsResponse.eventActivity.total
        if ($null -ne $total) {
            Write-TestResult "Event Activity Total" "PASS" "Total events: $total"
        } else {
            Write-TestResult "Event Activity Total" "FAIL" "Missing total events"
        }
    }
    
} catch {
    Write-TestResult "/api/metrics Endpoint" "FAIL" $_.Exception.Message
}

# Test 4: Validate dashboard HTML file
Write-Host "`n📄 Testing Dashboard HTML..." -ForegroundColor Yellow
$dashboardPath = Join-Path $PSScriptRoot "..\kds-dashboard.html"
if (Test-Path $dashboardPath) {
    Write-TestResult "Dashboard File Exists" "PASS" $dashboardPath
    
    $htmlContent = Get-Content $dashboardPath -Raw
    
    # Check for Chart.js library
    if ($htmlContent -match 'chart\.js') {
        Write-TestResult "Chart.js Library Included" "PASS" "CDN reference found"
    } else {
        Write-TestResult "Chart.js Library Included" "FAIL" "Chart.js not found in HTML"
    }
    
    # Check for Metrics tab
    if ($htmlContent -match 'tab-metrics' -or $htmlContent -match 'Metrics') {
        Write-TestResult "Metrics Tab Present" "PASS" "Metrics section found"
    } else {
        Write-TestResult "Metrics Tab Present" "FAIL" "Metrics tab not found"
    }
    
    # Check for all required chart canvases
    $requiredCanvases = @(
        'brainHealthChart',
        'routingAccuracyChart',
        'knowledgeGrowthChart',
        'fileHotspotsChart',
        'eventActivityChart',
        'testSuccessChart'
    )
    
    foreach ($canvas in $requiredCanvases) {
        if ($htmlContent -match $canvas) {
            Write-TestResult "Canvas Element: $canvas" "PASS" "Element found"
        } else {
            Write-TestResult "Canvas Element: $canvas" "FAIL" "Element missing"
        }
    }
    
    # Check for loadMetrics function
    if ($htmlContent -match 'function loadMetrics' -or $htmlContent -match 'async function loadMetrics') {
        Write-TestResult "loadMetrics() Function" "PASS" "Function defined"
    } else {
        Write-TestResult "loadMetrics() Function" "FAIL" "Function not found"
    }
    
    # Check for chart render functions
    $renderFunctions = @(
        'renderBRAINHealthChart',
        'renderRoutingAccuracyChart',
        'renderKnowledgeGrowthChart',
        'renderFileHotspotsChart',
        'renderEventActivityChart',
        'renderTestSuccessChart'
    )
    
    foreach ($func in $renderFunctions) {
        if ($htmlContent -match $func) {
            Write-TestResult "Function: $func" "PASS" "Function defined"
        } else {
            Write-TestResult "Function: $func" "FAIL" "Function missing"
        }
    }
    
} else {
    Write-TestResult "Dashboard File Exists" "FAIL" "File not found: $dashboardPath"
}

# Test 5: Performance check
Write-Host "`n⚡ Testing API Performance..." -ForegroundColor Yellow
try {
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    $null = Invoke-RestMethod -Uri "http://localhost:8765/api/metrics" -Method Get
    $stopwatch.Stop()
    
    $responseTime = $stopwatch.ElapsedMilliseconds
    if ($responseTime -lt 500) {
        Write-TestResult "Metrics API Response Time" "PASS" "${responseTime}ms (target: <500ms)"
    } elseif ($responseTime -lt 1000) {
        Write-TestResult "Metrics API Response Time" "WARN" "${responseTime}ms (target: <500ms)"
    } else {
        Write-TestResult "Metrics API Response Time" "FAIL" "${responseTime}ms (target: <500ms)"
    }
} catch {
    Write-TestResult "Metrics API Response Time" "FAIL" $_.Exception.Message
}

# Test Summary
Write-Host "`n" + ("=" * 60) -ForegroundColor Cyan
Write-Host "📊 Test Summary" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Cyan
Write-Host ""
Write-Host "  ✅ Passed:  $($testResults.Passed)" -ForegroundColor Green
Write-Host "  ❌ Failed:  $($testResults.Failed)" -ForegroundColor Red
Write-Host "  ⚠️  Warnings: $($testResults.Warnings)" -ForegroundColor Yellow
Write-Host ""

$totalTests = $testResults.Passed + $testResults.Failed + $testResults.Warnings
if ($totalTests -gt 0) {
    $passRate = [math]::Round(($testResults.Passed / $totalTests) * 100, 1)
    Write-Host "  Pass Rate: $passRate%" -ForegroundColor $(if ($passRate -ge 90) { "Green" } elseif ($passRate -ge 70) { "Yellow" } else { "Red" })
}

Write-Host ""

# Save test results
$resultsPath = Join-Path $PSScriptRoot "..\reports\metrics-dashboard-test-results.json"
$resultsDir = Split-Path $resultsPath -Parent
if (-not (Test-Path $resultsDir)) {
    New-Item -ItemType Directory -Path $resultsDir -Force | Out-Null
}

$testResults | ConvertTo-Json -Depth 10 | Out-File $resultsPath -Encoding UTF8
Write-Host "📝 Test results saved to: $resultsPath" -ForegroundColor Gray
Write-Host ""

# Exit with appropriate code
if ($testResults.Failed -gt 0) {
    Write-Host "❌ Tests FAILED" -ForegroundColor Red
    exit 1
} elseif ($testResults.Warnings -gt 0) {
    Write-Host "⚠️  Tests PASSED with warnings" -ForegroundColor Yellow
    exit 0
} else {
    Write-Host "✅ All tests PASSED" -ForegroundColor Green
    exit 0
}
