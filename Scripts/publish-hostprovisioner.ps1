# ========================================
# HostProvisioner - Publish Script
# Creates self-contained executable
# ========================================

param(
    [string]$TargetPath = "D:\Websites\NOOR-CANVAS\HostProvisioner",
    [switch]$SelfContained = $true,
    [string]$Runtime = "win-x64"
)

$ErrorActionPreference = "Stop"
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  HostProvisioner - Publish Script" -ForegroundColor White
Write-Host "  Mode: $(if($SelfContained){'Self-Contained'}else{'Framework-Dependent'})" -ForegroundColor White
Write-Host "  Target: $TargetPath" -ForegroundColor White
Write-Host "  Runtime: $Runtime" -ForegroundColor White
Write-Host "  Time: $timestamp" -ForegroundColor White
Write-Host "========================================`n" -ForegroundColor Cyan

# Paths
$projectRoot = "D:\PROJECTS\NOOR CANVAS"
$projectPath = Join-Path $projectRoot "Tools\HostProvisioner\HostProvisioner\HostProvisioner.csproj"
$publishTemp = Join-Path $projectRoot "Workspaces\hostprovisioner-publish"

# Validate project exists
if (-not (Test-Path $projectPath)) {
    Write-Host "[ERROR] HostProvisioner project not found at: $projectPath" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] HostProvisioner project found" -ForegroundColor Green

# Clean previous publish output
Write-Host "`n[STEP] Cleaning previous publish output..." -ForegroundColor Yellow
if (Test-Path $publishTemp) {
    Remove-Item $publishTemp -Recurse -Force
    Write-Host "[INFO] Cleaned: $publishTemp" -ForegroundColor Gray
}

# Build publish command
$publishArgs = @(
    "publish"
    $projectPath
    "-c", "Release"
    "-o", $publishTemp
    "-r", $Runtime
)

if ($SelfContained) {
    $publishArgs += "--self-contained", "true"
    $publishArgs += "/p:PublishSingleFile=true"
    $publishArgs += "/p:IncludeNativeLibrariesForSelfExtract=true"
    $publishArgs += "/p:PublishTrimmed=false"  # Keep full app for reliability
} else {
    $publishArgs += "--no-self-contained"
}

# Publish
Write-Host "`n[STEP] Publishing HostProvisioner..." -ForegroundColor Yellow
Write-Host "[INFO] Command: dotnet $($publishArgs -join ' ')" -ForegroundColor Gray

try {
    $buildOutput = & dotnet $publishArgs 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Publish failed!" -ForegroundColor Red
        Write-Host $buildOutput -ForegroundColor Red
        exit 1
    }
    Write-Host $buildOutput -ForegroundColor Gray
    Write-Host "[OK] Published successfully" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Publish failed: $_" -ForegroundColor Red
    exit 1
}

# Prepare deployment location
Write-Host "`n[STEP] Preparing deployment location..." -ForegroundColor Yellow

# Backup existing if present
if (Test-Path $TargetPath) {
    $backupPath = "$TargetPath-backup-$timestamp"
    Write-Host "[INFO] Creating backup: $backupPath" -ForegroundColor Gray
    Copy-Item $TargetPath $backupPath -Recurse -Force
    Write-Host "[OK] Backup created" -ForegroundColor Green
    
    # Clear deployment folder but preserve appsettings and batch files
    $preserveFiles = @("appsettings.json", "*.bat", "README.txt", "SETUP-COMPLETE.md")
    $tempPreserve = Join-Path $env:TEMP "hostprovisioner-preserve-$timestamp"
    New-Item -ItemType Directory -Path $tempPreserve -Force | Out-Null
    
    foreach ($pattern in $preserveFiles) {
        Get-ChildItem $TargetPath -Filter $pattern -ErrorAction SilentlyContinue | ForEach-Object {
            Copy-Item $_.FullName $tempPreserve -Force
            Write-Host "[INFO] Preserved: $($_.Name)" -ForegroundColor Gray
        }
    }
    
    Remove-Item "$TargetPath\*" -Recurse -Force -Exclude "*.bat", "README.txt", "SETUP-COMPLETE.md", "appsettings.json"
} else {
    New-Item -ItemType Directory -Path $TargetPath -Force | Out-Null
    Write-Host "[INFO] Created: $TargetPath" -ForegroundColor Gray
}

# Deploy published files
Write-Host "`n[STEP] Deploying files to $TargetPath..." -ForegroundColor Yellow

$deployedFiles = 0
Get-ChildItem $publishTemp -Recurse | ForEach-Object {
    $targetItem = Join-Path $TargetPath $_.FullName.Substring($publishTemp.Length)
    if ($_.PSIsContainer) {
        if (-not (Test-Path $targetItem)) {
            New-Item -ItemType Directory -Path $targetItem -Force | Out-Null
        }
    } else {
        Copy-Item $_.FullName $targetItem -Force
        $deployedFiles++
    }
}
Write-Host "[OK] Deployed $deployedFiles files" -ForegroundColor Green

# Restore preserved files if they exist
if (Test-Path $tempPreserve) {
    Get-ChildItem $tempPreserve | ForEach-Object {
        Copy-Item $_.FullName (Join-Path $TargetPath $_.Name) -Force
        Write-Host "[INFO] Restored: $($_.Name)" -ForegroundColor Gray
    }
    Remove-Item $tempPreserve -Recurse -Force
}

# Configure connection string based on deployment location
Write-Host "`n[STEP] Configuring database connection..." -ForegroundColor Yellow
$appsettingsPath = Join-Path $TargetPath "appsettings.json"
$appsettingsConfig = Get-Content $appsettingsPath -Raw | ConvertFrom-Json

# Determine environment based on target path
$isProduction = $TargetPath -match "D:\\Websites"
$database = if ($isProduction) { "KSESSIONS" } else { "KSESSIONS_DEV" }
$environment = if ($isProduction) { "Production" } else { "Development" }

# Update connection string
if (-not $appsettingsConfig.ConnectionStrings) {
    $appsettingsConfig | Add-Member -MemberType NoteProperty -Name "ConnectionStrings" -Value ([PSCustomObject]@{})
}

$connectionString = "Server=192.168.1.58,1433;Database=$database;User ID=sa;Password=adf4961glo;Connection Timeout=3600;MultipleActiveResultSets=true;TrustServerCertificate=True;Encrypt=False;"
$appsettingsConfig.ConnectionStrings | Add-Member -MemberType NoteProperty -Name "DefaultConnection" -Value $connectionString -Force

# Save updated configuration
$appsettingsConfig | ConvertTo-Json -Depth 10 | Set-Content $appsettingsPath
Write-Host "[OK] Configured for $environment environment" -ForegroundColor Green
Write-Host "[INFO] Database: $database on 192.168.1.58" -ForegroundColor Gray

# Verify critical files
Write-Host "`n[STEP] Verifying deployment..." -ForegroundColor Yellow
$criticalFiles = @("HostProvisioner.exe", "appsettings.json")
$allPresent = $true

foreach ($file in $criticalFiles) {
    $filePath = Join-Path $TargetPath $file
    if (Test-Path $filePath) {
        $fileInfo = Get-Item $filePath
        Write-Host "[OK] $file ($([math]::Round($fileInfo.Length / 1MB, 2)) MB)" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Missing: $file" -ForegroundColor Red
        $allPresent = $false
    }
}

if (-not $allPresent) {
    Write-Host "`n[ERROR] Deployment incomplete - missing critical files!" -ForegroundColor Red
    exit 1
}

# Test executable
Write-Host "`n[STEP] Testing executable..." -ForegroundColor Yellow
try {
    Push-Location $TargetPath
    $testOutput = & .\HostProvisioner.exe --version 2>&1
    if ($LASTEXITCODE -eq 0 -or $testOutput -match "HostProvisioner|version|Host") {
        Write-Host "[OK] Executable runs successfully" -ForegroundColor Green
        Write-Host "[INFO] Output: $testOutput" -ForegroundColor Gray
    } else {
        Write-Host "[WARN] Executable ran but output unexpected" -ForegroundColor Yellow
        Write-Host "[INFO] Output: $testOutput" -ForegroundColor Gray
    }
} catch {
    Write-Host "[WARN] Could not test executable: $_" -ForegroundColor Yellow
} finally {
    Pop-Location
}

# Get deployment size
$totalSize = (Get-ChildItem $TargetPath -Recurse | Measure-Object -Property Length -Sum).Sum
$sizeMB = [math]::Round($totalSize / 1MB, 2)

# Display summary
Write-Host "`n[STEP] Deployment Summary" -ForegroundColor Yellow
Write-Host "`nDeployment Details:" -ForegroundColor White
Write-Host "  Location: $TargetPath" -ForegroundColor Gray
Write-Host "  Files Deployed: $deployedFiles" -ForegroundColor Gray
Write-Host "  Total Size: $sizeMB MB" -ForegroundColor Gray
Write-Host "  Mode: $(if($SelfContained){'Self-Contained (includes .NET runtime)'}else{'Framework-Dependent (requires .NET runtime)'})" -ForegroundColor Gray
Write-Host "  Runtime: $Runtime" -ForegroundColor Gray

Write-Host "`nKey Files:" -ForegroundColor White
Write-Host "  - HostProvisioner.exe (Main executable)" -ForegroundColor Gray
Write-Host "  - appsettings.json (Configuration)" -ForegroundColor Gray
if (Test-Path (Join-Path $TargetPath "create-host.bat")) {
    Write-Host "  - create-host.bat (Quick create wrapper)" -ForegroundColor Gray
}
if (Test-Path (Join-Path $TargetPath "rotate-host.bat")) {
    Write-Host "  - rotate-host.bat (Quick rotate wrapper)" -ForegroundColor Gray
}

Write-Host "`nUsage:" -ForegroundColor White
Write-Host "  Navigate to: $TargetPath" -ForegroundColor Gray
Write-Host "  Run commands:" -ForegroundColor Gray
Write-Host "    .\HostProvisioner.exe --help" -ForegroundColor Green
Write-Host "    .\HostProvisioner.exe create --session-id 123 --created-by 'User Name'" -ForegroundColor Green
Write-Host "    .\create-host.bat 123 'User Name' (if batch file exists)" -ForegroundColor Green

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Deployment Complete!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

# Cleanup temp publish folder
if (Test-Path $publishTemp) {
    Remove-Item $publishTemp -Recurse -Force
}

exit 0
