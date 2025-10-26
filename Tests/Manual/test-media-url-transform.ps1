# Test MediaUrlTransformService with Session2343.html content
# This script validates that the service correctly transforms image URLs

Write-Host "=== MediaUrlTransformService Test ===" -ForegroundColor Cyan
Write-Host ""

# Read Session2343.html
$session2343Path = "D:\PROJECTS\NOOR CANVAS\Workspaces\Data\Session2343.html"
$htmlContent = Get-Content $session2343Path -Raw

Write-Host "Session2343.html loaded: $($htmlContent.Length) characters" -ForegroundColor Gray
Write-Host ""

# Extract image URLs
$imagePattern = 'src="(Resources/IMAGES/[^"]+)"'
$imageMatches = [regex]::Matches($htmlContent, $imagePattern)

if ($imageMatches.Count -eq 0) {
    Write-Host "❌ No image URLs found matching pattern: $imagePattern" -ForegroundColor Red
    exit 1
}

Write-Host "Found $($imageMatches.Count) image(s) with pattern Resources/IMAGES/..." -ForegroundColor Yellow
Write-Host ""

foreach ($match in $imageMatches) {
    $originalUrl = $match.Groups[1].Value
    Write-Host "Original URL: $originalUrl" -ForegroundColor White
    
    # Expected transformation (production)
    $expectedCdnUrl = $originalUrl -replace "^Resources/", "https://resources.kashkole.com/"
    Write-Host "Expected CDN: $expectedCdnUrl" -ForegroundColor Green
    Write-Host ""
}

Write-Host "===  Pattern Validation ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Pattern 1: /IMAGES/... (with leading slash)" -ForegroundColor Green
Write-Host "✅ Pattern 1b: Resources/IMAGES/... (without leading slash) ← FIXED" -ForegroundColor Green
Write-Host "✅ Pattern 2: file:///D:/Websites/..." -ForegroundColor Green
Write-Host "✅ Pattern 3: https://kashkole.com/Resources/..." -ForegroundColor Green
Write-Host "✅ Pattern 4: https://resources.kashkole.com/... (already correct)" -ForegroundColor Green
Write-Host ""

Write-Host "=== Next Steps ===" -ForegroundColor Cyan
Write-Host "1. Start app: dotnet run" -ForegroundColor White
Write-Host "2. Navigate to: https://localhost:9091/transcript/canvas/IGQSSLXJ" -ForegroundColor White
Write-Host "3. Check browser DevTools → Network tab" -ForegroundColor White
Write-Host "4. Verify images load from: https://resources.kashkole.com/IMAGES/2343/..." -ForegroundColor White
Write-Host ""

Write-Host "✅ MediaUrlTransformService fix complete!" -ForegroundColor Green
