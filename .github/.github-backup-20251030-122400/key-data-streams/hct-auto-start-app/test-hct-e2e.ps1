# HCT End-to-End Validation Test
# Tests the complete flow: app start, token generation, validation, and URL access

param(
    [Parameter(Mandatory=$false)]
    [int]$SessionId = 2343,
    
    [Parameter(Mandatory=$false)]
    [string]$BaseUrl = "https://localhost:9091"
)

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  HCT End-to-End Validation Test" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Test 1: Run hct and capture output
Write-Host "Test 1: Running hct $SessionId..." -ForegroundColor Yellow
$tempFile = [System.IO.Path]::GetTempFileName()
hct $SessionId 2>&1 | Tee-Object -FilePath $tempFile | Out-Null
$hctExitCode = $LASTEXITCODE
$hctOutput = Get-Content $tempFile

if ($hctExitCode -ne 0) {
    Write-Host "❌ hct command failed with exit code: $hctExitCode" -ForegroundColor Red
    exit 1
}

Write-Host "✅ hct command succeeded" -ForegroundColor Green

# Extract tokens from output - look for "Token: XXXXXXXX" pattern
$hostTokenLine = $hctOutput | Where-Object { $_ -match "🎫 Host Access" } | Select-Object -First 1 -Skip 0
$userTokenLine = $hctOutput | Where-Object { $_ -match "👥 Participant Access" } | Select-Object -First 1

if (-not $hostTokenLine -or -not $userTokenLine) {
    Write-Host "❌ Failed to find token sections in output" -ForegroundColor Red
    exit 1
}

# Get the next lines after the markers
$hostTokenIndex = [array]::IndexOf($hctOutput, $hostTokenLine)
$userTokenIndex = [array]::IndexOf($hctOutput, $userTokenLine)

$hostToken = ($hctOutput[$hostTokenIndex + 1] -replace '.*Token:\s+', '').Trim()
$userToken = ($hctOutput[$userTokenIndex + 1] -replace '.*Token:\s+', '').Trim()

Remove-Item $tempFile -ErrorAction SilentlyContinue

if ([string]::IsNullOrEmpty($hostToken) -or [string]::IsNullOrEmpty($userToken)) {
    Write-Host "❌ Tokens are empty after extraction" -ForegroundColor Red
    Write-Host "Host token: '$hostToken'" -ForegroundColor Gray
    Write-Host "User token: '$userToken'" -ForegroundColor Gray
    exit 1
}

Write-Host "   Host Token: $hostToken" -ForegroundColor White
Write-Host "   User Token: $userToken" -ForegroundColor White
Write-Host ""

# Test 2: Validate host token via API
Write-Host "Test 2: Validating host token via API..." -ForegroundColor Yellow
try {
    $apiUrl = "$BaseUrl/api/host/token/$hostToken/validate"
    $response = Invoke-RestMethod -Uri $apiUrl -Method GET -SkipCertificateCheck -ErrorAction Stop
    
    if ($response.valid -eq $true -and $response.sessionId -eq $SessionId) {
        Write-Host "✅ Host token validation successful" -ForegroundColor Green
        Write-Host "   Session ID: $($response.sessionId)" -ForegroundColor White
        Write-Host "   Title: $($response.session.title)" -ForegroundColor White
    }
    else {
        Write-Host "❌ Token validation failed (valid=$($response.valid), sessionId=$($response.sessionId))" -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host "❌ API validation failed: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Test 3: Load host landing page
Write-Host "Test 3: Loading host landing page..." -ForegroundColor Yellow
try {
    $landingUrl = "$BaseUrl/host/$hostToken"
    $pageResponse = Invoke-WebRequest -Uri $landingUrl -Method GET -SkipCertificateCheck -ErrorAction Stop
    
    if ($pageResponse.StatusCode -eq 200) {
        if ($pageResponse.Content -like "*Invalid Token*") {
            Write-Host "❌ Page shows 'Invalid Token' error" -ForegroundColor Red
            exit 1
        }
        else {
            Write-Host "✅ Page loaded successfully" -ForegroundColor Green
        }
    }
    else {
        Write-Host "❌ Page returned status code: $($pageResponse.StatusCode)" -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host "❌ Page load failed: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Test 4: Verify app is still running
Write-Host "Test 4: Verifying app is still running..." -ForegroundColor Yellow
try {
    $healthCheck = Invoke-WebRequest -Uri $BaseUrl -Method HEAD -SkipCertificateCheck -ErrorAction Stop
    if ($healthCheck.StatusCode -eq 200) {
        Write-Host "✅ App is still running" -ForegroundColor Green
    }
}
catch {
    Write-Host "❌ App not responding" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Success summary
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "  ✅ ALL TESTS PASSED" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  • App auto-started successfully" -ForegroundColor White
Write-Host "  • Tokens generated and saved to database" -ForegroundColor White
Write-Host "  • Token validation API working" -ForegroundColor White
Write-Host "  • Host landing page accessible" -ForegroundColor White
Write-Host "  • App remains running for development" -ForegroundColor White
Write-Host ""
Write-Host "Test URLs:" -ForegroundColor Cyan
Write-Host "  Host:  $BaseUrl/host/$hostToken" -ForegroundColor Blue
Write-Host "  User:  $BaseUrl/user/landing/$userToken" -ForegroundColor Blue
Write-Host ""
