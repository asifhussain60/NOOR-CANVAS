#!/usr/bin/env pwsh
<#
.SYNOPSIS
    KDS Tooling Setup Script - Portable across projects
    
.DESCRIPTION
    Automatically detects project type, validates existing tooling, and installs
    missing dependencies required for KDS to function efficiently.
    
    This script is part of the KDS (Key Data Streams) framework and should work
    on ANY project without modification.
    
.PARAMETER SkipNodePackages
    Skip Node.js package installation
    
.PARAMETER SkipDotNetPackages
    Skip .NET package installation
    
.PARAMETER SkipValidation
    Skip final validation checks
    
.PARAMETER Force
    Force reinstall even if packages exist
    
.EXAMPLE
    .\setup-kds-tooling.ps1
    
.EXAMPLE
    .\setup-kds-tooling.ps1 -SkipNodePackages
    
.NOTES
    Version: 1.0.0
    Date: 2025-11-02
    Part of: KDS v4.4.0
    
.LINK
    https://github.com/asifhussain60/NOOR-CANVAS
#>

[CmdletBinding()]
param(
    [switch]$SkipNodePackages,
    [switch]$SkipDotNetPackages,
    [switch]$SkipValidation,
    [switch]$Force
)

$ErrorActionPreference = "Stop"
$script:ToolingIssues = @()
$script:InstalledPackages = @()
$script:SkippedPackages = @()

#region Helper Functions

function Write-Header {
    param([string]$Text)
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  $Text" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Section {
    param([string]$Text)
    Write-Host ""
    Write-Host "───────────────────────────────────────────────────────────" -ForegroundColor DarkCyan
    Write-Host "  $Text" -ForegroundColor White
    Write-Host "───────────────────────────────────────────────────────────" -ForegroundColor DarkCyan
}

function Write-Success {
    param([string]$Text)
    Write-Host "✅ $Text" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Text)
    Write-Host "⚠️  $Text" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Text)
    Write-Host "❌ $Text" -ForegroundColor Red
}

function Write-Info {
    param([string]$Text)
    Write-Host "ℹ️  $Text" -ForegroundColor Cyan
}

function Test-CommandExists {
    param([string]$Command)
    $null = Get-Command $Command -ErrorAction SilentlyContinue
    return $?
}

#endregion

#region Project Detection

function Get-ProjectType {
    Write-Section "Detecting Project Type"
    
    $projectTypes = @()
    
    # Check for .NET
    if (Test-Path "*.sln" -PathType Leaf) {
        $projectTypes += ".NET"
        Write-Success "Detected .NET project (solution file found)"
    }
    
    # Check for Node.js
    if (Test-Path "package.json" -PathType Leaf) {
        $projectTypes += "Node.js"
        Write-Success "Detected Node.js project (package.json found)"
    }
    
    # Check for Python
    if (Test-Path "requirements.txt" -PathType Leaf) {
        $projectTypes += "Python"
        Write-Success "Detected Python project (requirements.txt found)"
    }
    
    # Check for Java
    if ((Test-Path "pom.xml") -or (Test-Path "build.gradle")) {
        $projectTypes += "Java"
        Write-Success "Detected Java project (Maven/Gradle found)"
    }
    
    if ($projectTypes.Count -eq 0) {
        Write-Warning "No standard project type detected"
        $projectTypes += "Unknown"
    }
    
    return $projectTypes
}

#endregion

#region Core Dependency Validation

function Test-CoreDependencies {
    Write-Section "Validating Core Dependencies"
    
    $allValid = $true
    
    # Git
    if (Test-CommandExists "git") {
        $gitVersion = git --version
        Write-Success "Git installed: $gitVersion"
    } else {
        Write-Error "Git not found - REQUIRED for KDS version control"
        $script:ToolingIssues += "Git is not installed"
        $allValid = $false
    }
    
    # PowerShell
    $psVersion = $PSVersionTable.PSVersion
    if ($psVersion.Major -ge 5) {
        Write-Success "PowerShell installed: $($psVersion.ToString())"
    } else {
        Write-Warning "PowerShell version $($psVersion.ToString()) is old (5.1+ recommended)"
    }
    
    # Node.js (if Node project detected)
    if (Test-Path "package.json") {
        if (Test-CommandExists "node") {
            $nodeVersion = node --version
            Write-Success "Node.js installed: $nodeVersion"
        } else {
            Write-Error "Node.js not found - REQUIRED for this project"
            $script:ToolingIssues += "Node.js is not installed"
            $allValid = $false
        }
        
        if (Test-CommandExists "npm") {
            $npmVersion = npm --version
            Write-Success "NPM installed: v$npmVersion"
        } else {
            Write-Error "NPM not found - REQUIRED for package management"
            $script:ToolingIssues += "NPM is not installed"
            $allValid = $false
        }
    }
    
    # .NET (if .NET project detected)
    if (Test-Path "*.sln") {
        if (Test-CommandExists "dotnet") {
            $dotnetVersion = dotnet --version
            Write-Success ".NET SDK installed: $dotnetVersion"
        } else {
            Write-Error ".NET SDK not found - REQUIRED for this project"
            $script:ToolingIssues += ".NET SDK is not installed"
            $allValid = $false
        }
    }
    
    return $allValid
}

#endregion

#region Node.js Package Management

function Get-InstalledNodePackages {
    if (-not (Test-Path "package.json")) {
        return @{}
    }
    
    try {
        $packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
        $installed = @{}
        
        if ($packageJson.PSObject.Properties["devDependencies"]) {
            foreach ($pkg in $packageJson.devDependencies.PSObject.Properties) {
                $installed[$pkg.Name] = $pkg.Value
            }
        }
        
        if ($packageJson.PSObject.Properties["dependencies"]) {
            foreach ($pkg in $packageJson.dependencies.PSObject.Properties) {
                $installed[$pkg.Name] = $pkg.Value
            }
        }
        
        return $installed
    } catch {
        Write-Warning "Failed to parse package.json: $_"
        return @{}
    }
}

function Install-NodePackages {
    if ($SkipNodePackages) {
        Write-Info "Skipping Node.js package installation (flag set)"
        return
    }
    
    if (-not (Test-Path "package.json")) {
        Write-Info "No package.json found - skipping Node.js packages"
        return
    }
    
    Write-Section "Installing Node.js Packages"
    
    $requiredPackages = @{
        # E2E Testing
        "@playwright/test" = "^1.56.1"
        "playwright" = "^1.56.1"
        
        # Visual Regression
        "@percy/cli" = "^1.31.4"
        "@percy/playwright" = "^1.0.9"
        
        # Linting
        "eslint" = "^9.36.0"
        "@typescript-eslint/eslint-plugin" = "^8.44.1"
        "@typescript-eslint/parser" = "^8.44.1"
        "eslint-plugin-playwright" = "^2.2.2"
        "eslint-config-prettier" = "^10.1.8"
        
        # Formatting
        "prettier" = "^3.6.2"
        
        # CSS Linting
        "stylelint" = "^16.25.0"
        "stylelint-config-standard" = "^39.0.1"
        "postcss-html" = "^1.8.0"
        
        # TypeScript
        "typescript" = "^5.9.2"
        "ts-node" = "^10.9.2"
        "@types/node" = "^24.5.2"
    }
    
    $installed = Get-InstalledNodePackages
    $toInstall = @()
    
    foreach ($pkg in $requiredPackages.Keys) {
        if ($installed.ContainsKey($pkg)) {
            if ($Force) {
                Write-Info "Forcing reinstall: $pkg"
                $toInstall += "$pkg@$($requiredPackages[$pkg])"
            } else {
                Write-Success "Already installed: $pkg ($($installed[$pkg]))"
                $script:SkippedPackages += $pkg
            }
        } else {
            Write-Warning "Missing: $pkg"
            $toInstall += "$pkg@$($requiredPackages[$pkg])"
        }
    }
    
    if ($toInstall.Count -gt 0) {
        Write-Info "Installing $($toInstall.Count) packages..."
        try {
            $packages = $toInstall -join " "
            $cmd = "npm install --save-dev $packages"
            Write-Host "  Running: $cmd" -ForegroundColor DarkGray
            Invoke-Expression $cmd
            
            $script:InstalledPackages += $toInstall
            Write-Success "Installed $($toInstall.Count) Node.js packages"
        } catch {
            Write-Error "Failed to install Node.js packages: $_"
            $script:ToolingIssues += "Node.js package installation failed"
        }
    } else {
        Write-Success "All Node.js packages already installed"
    }
}

#endregion

#region .NET Package Management

function Install-DotNetPackages {
    if ($SkipDotNetPackages) {
        Write-Info "Skipping .NET package installation (flag set)"
        return
    }
    
    if (-not (Test-Path "*.sln")) {
        Write-Info "No solution file found - skipping .NET packages"
        return
    }
    
    Write-Section "Installing .NET Analyzer Packages"
    
    $requiredPackages = @{
        "Roslynator.Analyzers" = "4.12.9"
        "StyleCop.Analyzers" = "1.2.0-beta.556"
        "Microsoft.CodeAnalysis.NetAnalyzers" = "9.0.0"
    }
    
    # Find the main project file (usually in SPA/NoorCanvas or similar)
    $projectFiles = Get-ChildItem -Path . -Recurse -Filter "*.csproj" | Where-Object {
        $_.FullName -notmatch "\\obj\\" -and 
        $_.FullName -notmatch "\\bin\\" -and
        $_.FullName -notmatch "\\Tools\\"
    }
    
    if ($projectFiles.Count -eq 0) {
        Write-Warning "No .csproj files found"
        return
    }
    
    foreach ($projectFile in $projectFiles) {
        Write-Info "Checking project: $($projectFile.Name)"
        
        $projectContent = Get-Content $projectFile.FullName -Raw
        
        foreach ($pkg in $requiredPackages.Keys) {
            if ($projectContent -match $pkg) {
                Write-Success "Already referenced: $pkg"
                $script:SkippedPackages += $pkg
            } else {
                Write-Warning "Missing: $pkg"
                
                if (-not $Force) {
                    Write-Info "Adding package: $pkg@$($requiredPackages[$pkg])"
                    try {
                        $cmd = "dotnet add `"$($projectFile.FullName)`" package $pkg --version $($requiredPackages[$pkg])"
                        Write-Host "  Running: $cmd" -ForegroundColor DarkGray
                        Invoke-Expression $cmd
                        
                        $script:InstalledPackages += $pkg
                        Write-Success "Added: $pkg"
                    } catch {
                        Write-Error "Failed to add $pkg : $_"
                        $script:ToolingIssues += "Failed to add $pkg"
                    }
                }
            }
        }
    }
}

#endregion

#region Config File Management

function Test-ConfigFiles {
    Write-Section "Validating Configuration Files"
    
    $configFiles = @(
        "config/testing/playwright.config.cjs",
        "config/testing/eslint.config.js",
        "config/testing/.prettierrc",
        "config/testing/stylelint.config.cjs",
        "config/testing/tsconfig.json"
    )
    
    $results = @{}
    $allExist = $true
    
    foreach ($file in $configFiles) {
        if (Test-Path $file) {
            Write-Success "Found: $file"
            $results[$file] = $true
        } else {
            Write-Warning "Missing: $file"
            $results[$file] = $false
            $allExist = $false
        }
    }
    
    if (-not $allExist) {
        Write-Info "Some config files are missing - templates should be in project"
    }
    
    return $results
}

#endregion

#region Playwright Browser Installation

function Install-PlaywrightBrowsers {
    if (-not (Test-CommandExists "npx")) {
        Write-Warning "npx not available - cannot install Playwright browsers"
        return
    }
    
    Write-Section "Installing Playwright Browsers"
    
    try {
        Write-Info "Installing Chromium, Firefox, and WebKit..."
        npx playwright install
        Write-Success "Playwright browsers installed"
    } catch {
        Write-Warning "Failed to install Playwright browsers: $_"
        $script:ToolingIssues += "Playwright browser installation failed"
    }
}

#endregion

#region Final Validation

function Invoke-FinalValidation {
    if ($SkipValidation) {
        Write-Info "Skipping final validation (flag set)"
        return
    }
    
    Write-Section "Final Validation"
    
    # Test Playwright
    if (Test-Path "node_modules/@playwright/test") {
        try {
            $version = npx playwright --version
            Write-Success "Playwright ready: $version"
        } catch {
            Write-Warning "Playwright installed but not responding"
        }
    }
    
    # Test TypeScript
    if (Test-Path "node_modules/typescript") {
        try {
            $version = npx tsc --version
            Write-Success "TypeScript ready: $version"
        } catch {
            Write-Warning "TypeScript installed but not responding"
        }
    }
    
    # Test ESLint
    if (Test-Path "node_modules/eslint") {
        try {
            $version = npx eslint --version
            Write-Success "ESLint ready: $version"
        } catch {
            Write-Warning "ESLint installed but not responding"
        }
    }
    
    # Test dotnet (if .NET project)
    if (Test-Path "*.sln") {
        try {
            $packages = dotnet list package
            Write-Success ".NET packages validated"
        } catch {
            Write-Warning ".NET package list failed"
        }
    }
}

#endregion

#region Summary Report

function Write-SummaryReport {
    Write-Header "KDS Tooling Setup Summary"
    
    Write-Host "Project Type(s):" -ForegroundColor Cyan
    $projectTypes = Get-ProjectType
    foreach ($type in $projectTypes) {
        Write-Host "  • $type" -ForegroundColor White
    }
    
    if ($script:InstalledPackages.Count -gt 0) {
        Write-Host ""
        Write-Host "Newly Installed Packages:" -ForegroundColor Green
        foreach ($pkg in $script:InstalledPackages) {
            Write-Host "  ✅ $pkg" -ForegroundColor Green
        }
    }
    
    if ($script:SkippedPackages.Count -gt 0) {
        Write-Host ""
        Write-Host "Already Installed (Skipped):" -ForegroundColor DarkGray
        Write-Host "  $($script:SkippedPackages.Count) packages already present" -ForegroundColor DarkGray
    }
    
    if ($script:ToolingIssues.Count -gt 0) {
        Write-Host ""
        Write-Host "Issues Detected:" -ForegroundColor Red
        foreach ($issue in $script:ToolingIssues) {
            Write-Host "  ❌ $issue" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
    
    if ($script:ToolingIssues.Count -eq 0) {
        Write-Success "KDS tooling setup complete!"
        Write-Host ""
        Write-Info "Next steps:"
        Write-Host "  1. Run tests: npm run test" -ForegroundColor White
        Write-Host "  2. Run linting: npm run lint" -ForegroundColor White
        Write-Host "  3. Check build: npm run build:tests" -ForegroundColor White
    } else {
        Write-Warning "Setup completed with issues - please review above"
        Write-Host ""
        Write-Info "Manual actions may be required to resolve issues"
    }
    
    Write-Host ""
}

#endregion

#region Database Analysis

function Show-DatabaseAnalysis {
    Write-Header "KDS Database Analysis"
    
    Write-Host "Question: Should KDS use a dedicated lightweight database?" -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "CURRENT STATE:" -ForegroundColor Cyan
    Write-Host "  • Session state: JSON files (KDS/sessions/)" -ForegroundColor White
    Write-Host "  • Knowledge base: Markdown files (KDS/knowledge/)" -ForegroundColor White
    Write-Host "  • Work logs: Text files (plan.md, work-log.md)" -ForegroundColor White
    Write-Host "  • Version control: Git" -ForegroundColor White
    Write-Host ""
    
    Write-Host "PROS of Adding Database:" -ForegroundColor Green
    Write-Host "  ✅ Structured queries across sessions" -ForegroundColor Green
    Write-Host "  ✅ Faster pattern matching and retrieval" -ForegroundColor Green
    Write-Host "  ✅ Analytics on KDS usage/performance" -ForegroundColor Green
    Write-Host "  ✅ Better concurrent session management" -ForegroundColor Green
    Write-Host "  ✅ Portable across projects (SQLite)" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "CONS of Adding Database:" -ForegroundColor Red
    Write-Host "  ❌ Added complexity (setup, migration)" -ForegroundColor Red
    Write-Host "  ❌ Binary files not git-friendly" -ForegroundColor Red
    Write-Host "  ❌ Requires backup strategy" -ForegroundColor Red
    Write-Host "  ❌ Another dependency to manage" -ForegroundColor Red
    Write-Host "  ❌ Breaks 'git as source of truth' philosophy" -ForegroundColor Red
    Write-Host ""
    
    Write-Host "RECOMMENDATION:" -ForegroundColor Yellow
    Write-Host "  📋 START WITHOUT DATABASE" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Rationale:" -ForegroundColor White
    Write-Host "  1. Current JSON/Markdown approach aligns with git-first design" -ForegroundColor White
    Write-Host "  2. KDS already has session resumption working" -ForegroundColor White
    Write-Host "  3. Can add database later if queries become slow" -ForegroundColor White
    Write-Host "  4. Simpler deployment (no DB setup required)" -ForegroundColor White
    Write-Host ""
    Write-Host "  Future Enhancement:" -ForegroundColor White
    Write-Host "  • Consider SQLite if pattern library grows > 1000 entries" -ForegroundColor White
    Write-Host "  • Use for analytics ONLY (not primary storage)" -ForegroundColor White
    Write-Host "  • Keep JSON as source of truth, DB as cache" -ForegroundColor White
    Write-Host ""
}

#endregion

#region Main Execution

function Main {
    Write-Header "KDS Tooling Setup v1.0.0"
    
    Write-Host "This script will:" -ForegroundColor White
    Write-Host "  1. Detect project type" -ForegroundColor White
    Write-Host "  2. Validate core dependencies" -ForegroundColor White
    Write-Host "  3. Install missing Node.js packages" -ForegroundColor White
    Write-Host "  4. Install missing .NET packages" -ForegroundColor White
    Write-Host "  5. Validate configuration files" -ForegroundColor White
    Write-Host "  6. Install Playwright browsers" -ForegroundColor White
    Write-Host "  7. Run final validation" -ForegroundColor White
    Write-Host ""
    
    # Detect project
    $projectTypes = Get-ProjectType
    
    # Validate core dependencies
    $coreValid = Test-CoreDependencies
    
    if (-not $coreValid) {
        Write-Error "Core dependencies missing - please install required tools"
        Write-Host ""
        Write-Host "Installation guides:" -ForegroundColor Yellow
        Write-Host "  • Git: https://git-scm.com/" -ForegroundColor White
        Write-Host "  • Node.js: https://nodejs.org/" -ForegroundColor White
        Write-Host "  • .NET SDK: https://dotnet.microsoft.com/" -ForegroundColor White
        Write-Host ""
        return 1
    }
    
    # Install packages
    Install-NodePackages
    Install-DotNetPackages
    
    # Validate configs
    Test-ConfigFiles
    
    # Install browsers
    if ($projectTypes -contains "Node.js") {
        Install-PlaywrightBrowsers
    }
    
    # Final validation
    Invoke-FinalValidation
    
    # Show summary
    Write-SummaryReport
    
    # Show database analysis
    Show-DatabaseAnalysis
    
    return 0
}

# Execute
try {
    $exitCode = Main
    exit $exitCode
} catch {
    Write-Error "Unhandled error: $_"
    Write-Host $_.ScriptStackTrace -ForegroundColor Red
    exit 1
}

#endregion
