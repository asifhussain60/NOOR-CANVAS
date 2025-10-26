# Test Token Validation for HCT Tool
# Verifies that tokens are properly saved and validated

param(
    [Parameter(Mandatory=$true)]
    [int]$SessionId,
    
    [Parameter(Mandatory=$true)]
    [string]$HostToken,
    
    [Parameter(Mandatory=$false)]
    [string]$BaseUrl = "https://localhost:9091"
)

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  HCT Token Validation Test" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "Session ID:  $SessionId" -ForegroundColor White
Write-Host "Host Token:  $HostToken" -ForegroundColor Yellow
Write-Host "Base URL:    $BaseUrl" -ForegroundColor White
Write-Host ""

# Test 1: Check token in database using Python
Write-Host "━━━ Test 1: Database Verification ━━━" -ForegroundColor Yellow
Write-Host ""

$pythonScript = @"
import pyodbc
import sys

try:
    conn = pyodbc.connect('DRIVER={ODBC Driver 17 for SQL Server};SERVER=(localdb)\\MSSQLLocalDB;DATABASE=KSESSIONS_DEV;Trusted_Connection=yes;')
    cursor = conn.cursor()
    
    # Check if session exists with this token
    cursor.execute("""
        SELECT SessionId, HostToken, UserToken, Status, CreatedAt, ExpiresAt 
        FROM canvas.Sessions 
        WHERE SessionId = ?
    """, ($args[0],))
    
    row = cursor.fetchone()
    if row:
        print(f"✅ Session found in database:")
        print(f"   SessionId:  {row.SessionId}")
        print(f"   HostToken:  {row.HostToken if row.HostToken else 'NULL'}")
        print(f"   UserToken:  {row.UserToken if row.UserToken else 'NULL'}")
        print(f"   Status:     {row.Status}")
        print(f"   ExpiresAt:  {row.ExpiresAt}")
        
        if row.HostToken == '$args[1]':
            print(f"✅ HostToken matches!")
            sys.exit(0)
        else:
            print(f"❌ HostToken mismatch!")
            print(f"   Expected: $args[1]")
            print(f"   Got:      {row.HostToken if row.HostToken else 'NULL'}")
            sys.exit(1)
    else:
        print(f"❌ Session $args[0] not found in database")
        sys.exit(1)
        
except Exception as e:
    print(f"❌ Database error: {e}")
    sys.exit(1)
finally:
    if 'conn' in locals():
        conn.close()
"@

try {
    $pythonScript | python - $SessionId $HostToken
    $dbCheck = $LASTEXITCODE -eq 0
}
catch {
    Write-Host "❌ Database check failed: $_" -ForegroundColor Red
    $dbCheck = $false
}

Write-Host ""

# Test 2: Validate token via API
Write-Host "━━━ Test 2: API Token Validation ━━━" -ForegroundColor Yellow
Write-Host ""

try {
    $apiUrl = "$BaseUrl/api/host/token/$HostToken/validate"
    Write-Host "Calling API: $apiUrl" -ForegroundColor Gray
    
    $response = Invoke-RestMethod -Uri $apiUrl -Method GET -SkipCertificateCheck -ErrorAction Stop
    
    if ($response.valid -eq $true) {
        Write-Host "✅ API validation successful!" -ForegroundColor Green
        Write-Host "   Session ID: $($response.sessionId)" -ForegroundColor White
        Write-Host "   Title:      $($response.session.title)" -ForegroundColor White
        $apiCheck = $true
    }
    else {
        Write-Host "❌ API validation failed (valid=false)" -ForegroundColor Red
        $apiCheck = $false
    }
}
catch {
    Write-Host "❌ API call failed: $_" -ForegroundColor Red
    Write-Host "   Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    $apiCheck = $false
}

Write-Host ""

# Test 3: Load host landing page
Write-Host "━━━ Test 3: Host Landing Page Load ━━━" -ForegroundColor Yellow
Write-Host ""

try {
    $landingUrl = "$BaseUrl/host/$HostToken"
    Write-Host "Loading page: $landingUrl" -ForegroundColor Gray
    
    $pageResponse = Invoke-WebRequest -Uri $landingUrl -Method GET -SkipCertificateCheck -ErrorAction Stop
    
    if ($pageResponse.StatusCode -eq 200) {
        # Check if page contains "Invalid Token" error
        if ($pageResponse.Content -like "*Invalid Token*") {
            Write-Host "❌ Page loaded but shows 'Invalid Token' error" -ForegroundColor Red
            $pageCheck = $false
        }
        else {
            Write-Host "✅ Page loaded successfully (HTTP 200)" -ForegroundColor Green
            $pageCheck = $true
        }
    }
    else {
        Write-Host "⚠️ Page returned status code: $($pageResponse.StatusCode)" -ForegroundColor Yellow
        $pageCheck = $false
    }
}
catch {
    Write-Host "❌ Page load failed: $_" -ForegroundColor Red
    $pageCheck = $false
}

Write-Host ""

# Summary
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  Test Summary" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "Database Check:  $(if ($dbCheck) { '✅ PASS' } else { '❌ FAIL' })" -ForegroundColor $(if ($dbCheck) { 'Green' } else { 'Red' })
Write-Host "API Validation:  $(if ($apiCheck) { '✅ PASS' } else { '❌ FAIL' })" -ForegroundColor $(if ($apiCheck) { 'Green' } else { 'Red' })
Write-Host "Page Load:       $(if ($pageCheck) { '✅ PASS' } else { '❌ FAIL' })" -ForegroundColor $(if ($pageCheck) { 'Green' } else { 'Red' })
Write-Host ""

$allPassed = $dbCheck -and $apiCheck -and $pageCheck

if ($allPassed) {
    Write-Host "🎉 All tests PASSED - Token validation working correctly!" -ForegroundColor Green
    exit 0
}
else {
    Write-Host "❌ Some tests FAILED - Token validation has issues" -ForegroundColor Red
    exit 1
}
