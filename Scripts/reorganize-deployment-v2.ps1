<#
.SYNOPSIS
    Reorganize NoorCanvas deployment structure for cleaner organization.

.DESCRIPTION
    This script takes a standard dotnet publish output and reorganizes it into
    a cleaner structure with proper folder organization.
    
.PARAMETER SourcePath
    The path containing the published application.
    
.PARAMETER TargetPath
    The path where the reorganized structure should be created.
    
.PARAMETER SeparateHostProvisioner
    If specified, deploys HostProvisioner to a separate location.
    
.PARAMETER HostProvisionerPath
    Target path for HostProvisioner if deploying separately.
    
.PARAMETER DryRun
    Show what would be done without making changes.

.EXAMPLE
    .\reorganize-deployment.ps1 -SourcePath ".\publish" -TargetPath "D:\Websites\NOOR-CANVAS" -DryRun
#>

param(
    [Parameter(Mandatory = $true)]
    [string]$SourcePath,
    
    [Parameter(Mandatory = $true)]
    [string]$TargetPath,
    
    [switch]$SeparateHostProvisioner,
    
    [string]$HostProvisionerPath = "D:\Tools\HostProvisioner",
    
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

function Write-Step { param([string]$Message); Write-Host "`n[STEP] $Message" -ForegroundColor Cyan }
function Write-Success { param([string]$Message); Write-Host "[OK] $Message" -ForegroundColor Green }
function Write-Warning { param([string]$Message); Write-Host "[WARN] $Message" -ForegroundColor Yellow }
function Write-Info { param([string]$Message); Write-Host "[INFO] $Message" -ForegroundColor Gray }
function Write-DryRun { param([string]$Message); Write-Host "[DRY-RUN] $Message" -ForegroundColor Magenta }

try {
    Write-Host "`n========================================" -ForegroundColor Magenta
    Write-Host "  Deployment Reorganization Script" -ForegroundColor Magenta
    Write-Host "  Source: $SourcePath" -ForegroundColor Magenta
    Write-Host "  Target: $TargetPath" -ForegroundColor Magenta
    if ($SeparateHostProvisioner) {
        Write-Host "  HostProvisioner: $HostProvisionerPath" -ForegroundColor Magenta
    }
    if ($DryRun) {
        Write-Host "  MODE: DRY RUN" -ForegroundColor Yellow
    }
    Write-Host "========================================`n" -ForegroundColor Magenta

    # Validate source
    if (-not (Test-Path $SourcePath)) {
        throw "Source path does not exist: $SourcePath"
    }

    # Create directory structure
    Write-Step "Creating directory structure..."
    $directories = @(
        $TargetPath,
        "$TargetPath\bin",
        "$TargetPath\bin\Dependencies",
        "$TargetPath\bin\Resources",
        "$TargetPath\wwwroot",
        "$TargetPath\logs"
    )
    
    if (-not $SeparateHostProvisioner) {
        $directories += "$TargetPath\Tools\HostProvisioner"
    }
    
    foreach ($dir in $directories) {
        if ($DryRun) {
            Write-DryRun "Would create: $dir"
        } else {
            if (-not (Test-Path $dir)) {
                New-Item -ItemType Directory -Path $dir -Force | Out-Null
                Write-Info "Created: $dir"
            }
        }
    }
    Write-Success "Directory structure ready"

    # Copy main application files
    Write-Step "Copying main application files..."
    $mainFiles = @("NoorCanvas.dll", "NoorCanvas.exe", "NoorCanvas.pdb", 
                   "NoorCanvas.deps.json", "NoorCanvas.runtimeconfig.json", 
                   "NoorCanvas.staticwebassets.endpoints.json")
    $copiedAppFiles = 0
    
    foreach ($file in $mainFiles) {
        $source = Join-Path $SourcePath $file
        if (Test-Path $source) {
            $target = Join-Path $TargetPath $file
            if ($DryRun) {
                Write-DryRun "Would copy: $file"
            } else {
                Copy-Item -Path $source -Destination $target -Force
                Write-Info "Copied: $file"
            }
            $copiedAppFiles++
        }
    }
    Write-Success "Copied $copiedAppFiles application files"

    # Copy configuration files
    Write-Step "Copying configuration files..."
    $configFiles = @("appsettings.json", "appsettings.Development.json", 
                     "appsettings.Production.json", "web.config", 
                     "web.Debug.config", "web.Release.config")
    $copiedConfigFiles = 0
    
    foreach ($file in $configFiles) {
        $source = Join-Path $SourcePath $file
        if (Test-Path $source) {
            $target = Join-Path $TargetPath $file
            if ($DryRun) {
                Write-DryRun "Would copy: $file"
            } else {
                Copy-Item -Path $source -Destination $target -Force
                Write-Info "Copied: $file"
            }
            $copiedConfigFiles++
        }
    }
    Write-Success "Copied $copiedConfigFiles configuration files"

    # Copy dependency DLLs
    Write-Step "Organizing dependency DLLs..."
    $dllFiles = Get-ChildItem -Path $SourcePath -Filter "*.dll" -File | Where-Object { $_.Name -ne "NoorCanvas.dll" }
    $copiedDlls = 0
    
    foreach ($dll in $dllFiles) {
        $target = Join-Path "$TargetPath\bin\Dependencies" $dll.Name
        if ($DryRun) {
            if ($copiedDlls -lt 5) {
                Write-DryRun "Would copy: $($dll.Name) -> bin\Dependencies\"
            }
        } else {
            Copy-Item -Path $dll.FullName -Destination $target -Force
        }
        $copiedDlls++
    }
    if ($DryRun -and $copiedDlls -gt 5) {
        Write-DryRun "Would copy: ... and $($copiedDlls - 5) more DLLs"
    }
    Write-Success "Organized $copiedDlls dependency DLLs"

    # Copy language resource folders
    Write-Step "Organizing language resources..."
    $languageFolders = @("cs", "de", "es", "fr", "it", "ja", "ko", 
                        "pl", "pt-BR", "ru", "tr", "zh-Hans", "zh-Hant")
    $copiedLanguages = 0
    
    foreach ($lang in $languageFolders) {
        $source = Join-Path $SourcePath $lang
        if (Test-Path $source) {
            $target = Join-Path "$TargetPath\bin\Resources" $lang
            if ($DryRun) {
                Write-DryRun "Would copy: $lang\ -> bin\Resources\$lang\"
            } else {
                Copy-Item -Path $source -Destination $target -Recurse -Force
                Write-Info "Copied: $lang\"
            }
            $copiedLanguages++
        }
    }
    Write-Success "Organized $copiedLanguages language folders"

    # Copy runtimes folder
    Write-Step "Organizing runtime binaries..."
    $sourceRuntimes = Join-Path $SourcePath "runtimes"
    if (Test-Path $sourceRuntimes) {
        $targetRuntimes = Join-Path "$TargetPath\bin" "runtimes"
        if ($DryRun) {
            Write-DryRun "Would copy: runtimes\ -> bin\runtimes\"
        } else {
            Copy-Item -Path $sourceRuntimes -Destination $targetRuntimes -Recurse -Force
            Write-Success "Copied runtimes folder"
        }
    } else {
        Write-Warning "No runtimes folder found"
    }

    # Copy wwwroot folder
    Write-Step "Copying web content (wwwroot)..."
    $sourceWwwroot = Join-Path $SourcePath "wwwroot"
    if (Test-Path $sourceWwwroot) {
        $targetWwwroot = Join-Path $TargetPath "wwwroot"
        if ($DryRun) {
            Write-DryRun "Would copy: wwwroot\ -> wwwroot\"
        } else {
            if (Test-Path $targetWwwroot) {
                Remove-Item -Path $targetWwwroot -Recurse -Force
            }
            Copy-Item -Path $sourceWwwroot -Destination $targetWwwroot -Recurse -Force
            Write-Success "Copied wwwroot folder"
        }
    } else {
        Write-Warning "No wwwroot folder found"
    }

    # Handle HostProvisioner
    $sourceHostProv = Join-Path $SourcePath "HostProvisioner"
    if (Test-Path $sourceHostProv) {
        if ($SeparateHostProvisioner) {
            Write-Step "Deploying HostProvisioner separately..."
            
            if ($DryRun) {
                Write-DryRun "Would deploy HostProvisioner to: $HostProvisionerPath"
            } else {
                if (-not (Test-Path $HostProvisionerPath)) {
                    New-Item -ItemType Directory -Path $HostProvisionerPath -Force | Out-Null
                }
                Copy-Item -Path "$sourceHostProv\*" -Destination $HostProvisionerPath -Recurse -Force
                Write-Success "HostProvisioner deployed to: $HostProvisionerPath"
            }
        } else {
            Write-Step "Including HostProvisioner in Tools folder..."
            
            if ($DryRun) {
                Write-DryRun "Would copy: HostProvisioner\ -> Tools\HostProvisioner\"
            } else {
                $targetHostProv = Join-Path $TargetPath "Tools\HostProvisioner"
                Copy-Item -Path "$sourceHostProv\*" -Destination $targetHostProv -Recurse -Force
                Write-Success "HostProvisioner copied to Tools\HostProvisioner"
            }
        }
    } else {
        Write-Warning "No HostProvisioner folder found"
    }

    # Summary
    Write-Step "Deployment Summary"
    Write-Host "`nTarget Structure:" -ForegroundColor Cyan
    Write-Host "  $TargetPath\" -ForegroundColor White
    Write-Host "  +-- bin\" -ForegroundColor White
    Write-Host "      +-- Dependencies\ ($copiedDlls DLLs)" -ForegroundColor Gray
    Write-Host "      +-- Resources\ ($copiedLanguages languages)" -ForegroundColor Gray
    Write-Host "      +-- runtimes\" -ForegroundColor Gray
    Write-Host "  +-- wwwroot\" -ForegroundColor White
    Write-Host "  +-- logs\" -ForegroundColor White
    if (-not $SeparateHostProvisioner) {
        Write-Host "  +-- Tools\HostProvisioner\" -ForegroundColor Gray
    }
    Write-Host "  +-- $copiedAppFiles application files" -ForegroundColor Gray
    Write-Host "  +-- $copiedConfigFiles configuration files" -ForegroundColor Gray
    
    if ($SeparateHostProvisioner) {
        Write-Host "`nSeparate Deployment:" -ForegroundColor Cyan
        Write-Host "  $HostProvisionerPath\" -ForegroundColor White
    }

    if ($DryRun) {
        Write-Host "`nDRY RUN COMPLETE - No changes were made" -ForegroundColor Yellow
        Write-Host "Run without -DryRun to apply changes" -ForegroundColor Yellow
    }

    Write-Host "`n========================================" -ForegroundColor Green
    Write-Host "  Reorganization Complete!" -ForegroundColor Green
    Write-Host "========================================`n" -ForegroundColor Green

} catch {
    Write-Host "`n========================================" -ForegroundColor Red
    Write-Host "  ERROR DURING REORGANIZATION" -ForegroundColor Red
    Write-Host "========================================`n" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host "Stack: $($_.ScriptStackTrace)" -ForegroundColor Red
    exit 1
}
