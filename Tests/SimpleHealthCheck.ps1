# Simple Health Check Test for Issue-26
# Tests the basic health detection functionality

Write-Host "🏥 NOOR Canvas Simple Health Check" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

# Test 1: Process Detection
Write-Host "`n🔄 Checking for application processes..." -NoNewline
$dotnetProcs = Get-Process | Where-Object {$_.ProcessName -eq "dotnet"}
$iisProcs = Get-Process | Where-Object {$_.ProcessName -like "*iisexpress*"}

if ($dotnetProcs -or $iisProcs) {
    Write-Host " ✅ FOUND" -ForegroundColor Green
    foreach ($proc in ($dotnetProcs + $iisProcs)) {
        Write-Host "  • $($proc.ProcessName) (PID: $($proc.Id))" -ForegroundColor Gray
    }
} else {
    Write-Host " ❌ NO PROCESSES" -ForegroundColor Red
}

# Test 2: Port Binding Check
Write-Host "`n🔌 Checking port bindings..." -NoNewline
$netstatOutput = netstat -ano | Select-String ":909"
if ($netstatOutput) {
    Write-Host " ✅ PORTS BOUND" -ForegroundColor Green
    foreach ($line in $netstatOutput) {
        Write-Host "  • $($line.ToString().Trim())" -ForegroundColor Gray
    }
} else {
    Write-Host " ❌ NO BINDING" -ForegroundColor Red
}

# Test 3: Simple Connectivity Test  
Write-Host "`n🌐 Testing connectivity..." -NoNewline
try {
    $testUrl = "http://localhost:9090"
    $response = Invoke-WebRequest -Uri $testUrl -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    Write-Host " ✅ RESPONSIVE" -ForegroundColor Green
    Write-Host "  • HTTP Status: $($response.StatusCode)" -ForegroundColor Gray
} catch {
    Write-Host " ❌ NOT RESPONSIVE" -ForegroundColor Red
    Write-Host "  • Error: $($_.Exception.Message)" -ForegroundColor Gray
}

Write-Host "`n📊 Health check completed!" -ForegroundColor Cyan
