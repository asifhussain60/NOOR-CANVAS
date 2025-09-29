# Participant Name Display Test Suite Runner
# ==========================================
#
# This script runs comprehensive tests to validate the fixes for:
# 1. Q&A badges showing "Anonymous" instead of participant names
# 2. Welcome message showing "Participant" instead of actual names
#
# The tests cover:
# - SessionCanvas GetCurrentParticipantName() method enhancements
# - HostControlPanel ResolveParticipantName() method implementation
# - API integration and participant data flow
# - End-to-end user experience validation

param(
    [string]$Browser = "chromium",
    [switch]$Headed = $false,
    [switch]$Debug = $false,
    [string]$TestPattern = "*participant*"
)

Write-Host "🧪 Participant Name Display Test Suite" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Testing fixes for:" -ForegroundColor Yellow
Write-Host "• Q&A badges showing participant names instead of 'Anonymous'" -ForegroundColor White
Write-Host "• Welcome message showing actual names instead of 'Participant'" -ForegroundColor White
Write-Host "• Enhanced participant lookup with fallback logic" -ForegroundColor White
Write-Host ""

# Configuration
$ConfigFile = "playwright.config.participant-names.ts"
$OutputDir = "test-results/participant-names"
$TestFiles = @(
    "Tests/UI/participant-name-display.spec.ts",
    "Tests/UI/qa-participant-names.spec.ts", 
    "Tests/UI/welcome-message-personalization.spec.ts"
)

# Create output directory if it doesn't exist
if (!(Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

# Build Playwright command
$PlaywrightArgs = @(
    "test"
    "--config", $ConfigFile
    "--project", $Browser
    "--reporter", "html"
    "--reporter", "line"
)

if ($Headed) {
    $PlaywrightArgs += "--headed"
}

if ($Debug) {
    $PlaywrightArgs += "--debug"
    Write-Host "🐛 Debug mode enabled - tests will run with browser developer tools" -ForegroundColor Magenta
}

# Add test files
$PlaywrightArgs += $TestFiles

Write-Host "📋 Configuration:" -ForegroundColor Green
Write-Host "   Browser: $Browser" -ForegroundColor White
Write-Host "   Config: $ConfigFile" -ForegroundColor White
Write-Host "   Output: $OutputDir" -ForegroundColor White
Write-Host "   Headed: $Headed" -ForegroundColor White
Write-Host ""

Write-Host "🚀 Starting tests..." -ForegroundColor Green
Write-Host "Command: npx playwright $($PlaywrightArgs -join ' ')" -ForegroundColor Gray
Write-Host ""

# Set environment variables
$env:PLAYWRIGHT_HTML_REPORT = $OutputDir
$env:NODE_ENV = "test"

try {
    # Run the tests
    $process = Start-Process -FilePath "npx" -ArgumentList ("playwright", $PlaywrightArgs) -Wait -PassThru -NoNewWindow
    
    Write-Host ""
    Write-Host "=======================================" -ForegroundColor Cyan
    
    if ($process.ExitCode -eq 0) {
        Write-Host "All participant name tests passed!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Test Results Summary:" -ForegroundColor Green
        Write-Host "• Welcome message personalization working" -ForegroundColor White
        Write-Host "• Q&A participant name resolution working" -ForegroundColor White  
        Write-Host "• GetCurrentParticipantName method enhanced" -ForegroundColor White
        Write-Host "• ResolveParticipantName method implemented" -ForegroundColor White
        Write-Host "• API integration providing correct participant data" -ForegroundColor White
    }
    else {
        Write-Host "Some participant name tests failed!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Common issues to check:" -ForegroundColor Yellow
        Write-Host "• NoorCanvas application running on https://localhost:9091" -ForegroundColor White
        Write-Host "• Test session KJAHA99L exists with participant data" -ForegroundColor White
        Write-Host "• Participant names are properly loaded from database" -ForegroundColor White
        Write-Host "• UI selectors match current application structure" -ForegroundColor White
        Write-Host "• GetCurrentParticipantName logic working correctly" -ForegroundColor White
    }
    
    Write-Host ""
    Write-Host "📊 Detailed Results:" -ForegroundColor Cyan
    Write-Host "   HTML Report: $OutputDir/index.html" -ForegroundColor White
    Write-Host "   Screenshots: test-results/ (on failures)" -ForegroundColor White
    
    Write-Host ""
    Write-Host "🔧 Debug Information:" -ForegroundColor Cyan
    Write-Host "   Session Token (participants): KJAHA99L" -ForegroundColor White
    Write-Host "   Host Token (control panel): PQ9N5YWW" -ForegroundColor White
    Write-Host "   Expected participants: Wade Wilson, Erik Lehnsherr, Asif Hussain" -ForegroundColor White
    
    if ($Debug) {
        Write-Host ""
        Write-Host "🐛 Debug Mode Tips:" -ForegroundColor Magenta
        Write-Host "• Use browser dev tools to inspect participant data loading" -ForegroundColor White
        Write-Host "• Check console logs for GetCurrentParticipantName debug messages" -ForegroundColor White
        Write-Host "• Verify API responses in Network tab" -ForegroundColor White
        Write-Host "• Test participant lookup logic manually" -ForegroundColor White
    }
    
    # Open HTML report if tests passed and not in debug mode
    if ($process.ExitCode -eq 0 -and !$Debug) {
        Write-Host ""
        Write-Host "🌐 Opening test report..." -ForegroundColor Green
        Start-Process "$OutputDir/index.html"
    }
    
    exit $process.ExitCode
}
catch {
    Write-Host "Failed to run tests: $_" -ForegroundColor Red
    exit 1
}

# Usage examples:
# .\run-participant-name-tests.ps1                    # Run with default settings
# .\run-participant-name-tests.ps1 -Browser firefox   # Run with Firefox
# .\run-participant-name-tests.ps1 -Headed            # Run with browser visible
# .\run-participant-name-tests.ps1 -Debug             # Run in debug mode