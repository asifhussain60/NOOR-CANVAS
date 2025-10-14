# Percy Setup Script for NOOR CANVAS
# Run this script to set up Percy visual regression testing

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Percy Visual Regression Testing Setup" -ForegroundColor Cyan
Write-Host "NOOR CANVAS - Week 1 Implementation" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Percy token is set
if ($env:PERCY_TOKEN) {
    Write-Host "✓ Percy token is already set" -ForegroundColor Green
} else {
    Write-Host "⚠ Percy token not found" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To set up Percy:" -ForegroundColor White
    Write-Host "1. Sign up at https://percy.io (free tier)" -ForegroundColor White
    Write-Host "2. Create a new project: 'NOOR-CANVAS'" -ForegroundColor White
    Write-Host "3. Copy your Percy token from Settings" -ForegroundColor White
    Write-Host "4. Set environment variable:" -ForegroundColor White
    Write-Host "   `$env:PERCY_TOKEN='your_percy_token_here'" -ForegroundColor Cyan
    Write-Host ""
    
    $setToken = Read-Host "Do you want to set Percy token now? (y/n)"
    if ($setToken -eq 'y') {
        $token = Read-Host "Enter your Percy token"
        $env:PERCY_TOKEN = $token
        Write-Host "✓ Percy token set for this session" -ForegroundColor Green
        Write-Host ""
        Write-Host "To persist for future sessions, add to your PowerShell profile:" -ForegroundColor Yellow
        Write-Host "  `$env:PERCY_TOKEN='$token'" -ForegroundColor Cyan
    } else {
        Write-Host "Skipping Percy token setup. You can set it later." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Checking Dependencies" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
Write-Host "Checking Node.js..." -ForegroundColor White
$nodeVersion = node --version 2>$null
if ($nodeVersion) {
    Write-Host "✓ Node.js installed: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "✗ Node.js not found. Please install from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Check npm
Write-Host "Checking npm..." -ForegroundColor White
$npmVersion = npm --version 2>$null
if ($npmVersion) {
    Write-Host "✓ npm installed: $npmVersion" -ForegroundColor Green
} else {
    Write-Host "✗ npm not found" -ForegroundColor Red
    exit 1
}

# Check if Percy packages are installed
Write-Host ""
Write-Host "Checking Percy packages..." -ForegroundColor White
$percyInstalled = Test-Path "node_modules/@percy/cli"
if ($percyInstalled) {
    Write-Host "✓ Percy CLI installed" -ForegroundColor Green
} else {
    Write-Host "⚠ Percy CLI not found. Installing..." -ForegroundColor Yellow
    npm install --save-dev @percy/cli @percy/playwright
    Write-Host "✓ Percy packages installed" -ForegroundColor Green
}

# Check if Stylelint is installed
Write-Host "Checking Stylelint..." -ForegroundColor White
$stylelintInstalled = Test-Path "node_modules/stylelint"
if ($stylelintInstalled) {
    Write-Host "✓ Stylelint installed" -ForegroundColor Green
} else {
    Write-Host "⚠ Stylelint not found. Installing..." -ForegroundColor Yellow
    npm install --save-dev stylelint stylelint-config-standard postcss-html
    Write-Host "✓ Stylelint packages installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Available Commands" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Visual Regression Testing (Percy):" -ForegroundColor Yellow
Write-Host "  npm run test:percy:visual    - Run orange card visual test" -ForegroundColor White
Write-Host "  npm run test:percy:headed    - Run all tests with Percy (headed mode)" -ForegroundColor White
Write-Host "  npm run test:percy           - Run all tests with Percy (headless)" -ForegroundColor White
Write-Host ""

Write-Host "CSS Quality (Stylelint):" -ForegroundColor Yellow
Write-Host "  npm run lint:css             - Check for CSS violations" -ForegroundColor White
Write-Host "  npm run lint:css:fix         - Auto-fix CSS violations" -ForegroundColor White
Write-Host ""

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Quick Start" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Run visual regression test:" -ForegroundColor White
Write-Host "   npm run test:percy:visual" -ForegroundColor Cyan
Write-Host ""

Write-Host "2. View results in Percy dashboard:" -ForegroundColor White
Write-Host "   https://percy.io/your-org/NOOR-CANVAS" -ForegroundColor Cyan
Write-Host ""

Write-Host "3. Check CSS quality:" -ForegroundColor White
Write-Host "   npm run lint:css" -ForegroundColor Cyan
Write-Host ""

Write-Host "4. Read documentation:" -ForegroundColor White
Write-Host "   Docs/VISUAL_REGRESSION_TESTING.md" -ForegroundColor Cyan
Write-Host ""

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
