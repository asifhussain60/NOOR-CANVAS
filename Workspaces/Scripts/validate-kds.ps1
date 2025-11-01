# KDS Compliance Validation Script
# Validates all active keys have required plan.md and work-log.md

$basePath = "d:\PROJECTS\NOOR CANVAS\.github\key-data-streams"
Set-Location $basePath

# Get all directories (excluding _ARCHIVE, _SCHEMA, _template)
$allDirs = Get-ChildItem -Directory | Where-Object { $_.Name -notmatch "^_" }

Write-Host "`n🔍 KDS COMPLIANCE VALIDATION" -ForegroundColor Cyan
Write-Host "=" * 80

$violations = @()
$compliant = @()

foreach ($dir in $allDirs) {
    $key = $dir.Name
    $planFile = "$key/$key.plan.md"
    $planJson = "$key/$key.plan.json"
    $workLog = "$key/work-log.md"
    
    $hasPlanMd = Test-Path $planFile
    $hasPlanJson = Test-Path $planJson
    $hasWorkLog = Test-Path $workLog
    
    # Key is compliant if it has (plan.md OR plan.json) AND work-log.md
    $isCompliant = ($hasPlanMd -or $hasPlanJson) -and $hasWorkLog
    
    if ($isCompliant) {
        $compliant += [PSCustomObject]@{
            Key = $key
            PlanMd = $hasPlanMd
            PlanJson = $hasPlanJson
            WorkLog = $hasWorkLog
        }
    } else {
        $violations += [PSCustomObject]@{
            Key = $key
            PlanMd = $hasPlanMd
            PlanJson = $hasPlanJson
            WorkLog = $hasWorkLog
            Missing = @(
                if (-not $hasPlanMd -and -not $hasPlanJson) { "plan" }
                if (-not $hasWorkLog) { "work-log.md" }
            ) -join ", "
        }
    }
}

# Results
Write-Host "`n📊 RESULTS:" -ForegroundColor Yellow
Write-Host "-" * 80

$totalKeys = $allDirs.Count
$compliantCount = $compliant.Count
$violationCount = $violations.Count
$compliancePercent = [math]::Round(($compliantCount / $totalKeys) * 100, 1)

Write-Host "Total Active Keys: $totalKeys" -ForegroundColor White
Write-Host "Compliant Keys: $compliantCount" -ForegroundColor Green
Write-Host "Violation Keys: $violationCount" -ForegroundColor $(if ($violationCount -eq 0) { "Green" } else { "Red" })
Write-Host "Compliance Rate: $compliancePercent%" -ForegroundColor $(if ($compliancePercent -eq 100) { "Green" } else { "Yellow" })

if ($violationCount -gt 0) {
    Write-Host "`n❌ KDS VIOLATIONS DETECTED:" -ForegroundColor Red
    Write-Host "-" * 80
    $violations | Format-Table -AutoSize
    
    Write-Host "`nRECOMMENDATIONS:" -ForegroundColor Yellow
    foreach ($v in $violations) {
        Write-Host "  - $($v.Key): Missing $($v.Missing)" -ForegroundColor Red
    }
} else {
    Write-Host "`n✅ PERFECT KDS COMPLIANCE!" -ForegroundColor Green
    Write-Host "All $compliantCount keys have required files:" -ForegroundColor Green
    Write-Host "  - plan.md OR plan.json" -ForegroundColor Gray
    Write-Host "  - work-log.md" -ForegroundColor Gray
}

Write-Host "`n" + ("=" * 80)
Write-Host "Health Score: $(if ($compliancePercent -eq 100) { "A+ (100%)" } elseif ($compliancePercent -ge 90) { "A ($compliancePercent%)" } elseif ($compliancePercent -ge 80) { "B ($compliancePercent%)" } else { "C ($compliancePercent%)" })" -ForegroundColor $(if ($compliancePercent -eq 100) { "Green" } elseif ($compliancePercent -ge 80) { "Yellow" } else { "Red" })
Write-Host ""

# Return exit code
exit $violationCount
