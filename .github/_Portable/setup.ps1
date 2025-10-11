#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Automated setup for Portable AI Agent System

.DESCRIPTION
    This script automatically configures the AI agent orchestration system for any project.
    It detects your project type, installs required tools, creates workspace structure,
    and configures all agent prompts and instructions with your project-specific details.

.PARAMETER ProjectRoot
    Root directory of your project (defaults to parent of _Portable folder)

.PARAMETER SkipToolInstall
    Skip automatic tool installation (Roslynator, Playwright, etc.)

.PARAMETER DryRun
    Show what would be done without making changes

.EXAMPLE
    .\setup.ps1
    # Full automatic setup

.EXAMPLE
    .\setup.ps1 -SkipToolInstall
    # Setup without installing tools

.EXAMPLE
    .\setup.ps1 -DryRun
    # Preview changes without applying them

.NOTES
    Author: Generated from NOOR CANVAS Production System
    Version: 1.0.0
    Date: October 11, 2025
#>

[CmdletBinding()]
param(
    [string]$ProjectRoot,
    [switch]$SkipToolInstall,
    [switch]$DryRun
)

# ============================================================================
# CONFIGURATION
# ============================================================================

$ErrorActionPreference = "Stop"
$PortableRoot = $PSScriptRoot

if (-not $ProjectRoot) {
    # Assume _Portable is in .github folder
    $ProjectRoot = Split-Path (Split-Path $PortableRoot -Parent) -Parent
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host " Portable AI Agent System - Automated Setup" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[INFO] Project Root: $ProjectRoot" -ForegroundColor Green
Write-Host "[INFO] Portable Root: $PortableRoot" -ForegroundColor Green
Write-Host ""

if ($DryRun) {
    Write-Host "[DRY RUN MODE] No changes will be made" -ForegroundColor Yellow
    Write-Host ""
}

# ============================================================================
# PHASE 1: PROJECT DETECTION
# ============================================================================

Write-Host "Phase 1: Detecting Project Type..." -ForegroundColor Cyan

$ProjectInfo = @{
    Name = Split-Path $ProjectRoot -Leaf
    Type = "Unknown"
    Languages = @()
    Frameworks = @()
    BuildCommand = ""
    TestCommand = ""
    ServerCleanup = ""
    HasGit = Test-Path (Join-Path $ProjectRoot ".git")
}

# Detect .NET
if (Test-Path (Join-Path $ProjectRoot "*.sln") -or 
    (Get-ChildItem -Path $ProjectRoot -Filter "*.csproj" -Recurse -Depth 3 -ErrorAction SilentlyContinue).Count -gt 0) {
    $ProjectInfo.Type = ".NET"
    $ProjectInfo.Languages += "C#"
    $ProjectInfo.BuildCommand = "dotnet build"
    $ProjectInfo.TestCommand = "dotnet test"
    $ProjectInfo.ServerCleanup = "Stop-Process -Name 'dotnet' -Force -ErrorAction SilentlyContinue"
    
    # Detect framework
    $csproj = Get-ChildItem -Path $ProjectRoot -Filter "*.csproj" -Recurse -Depth 3 | Select-Object -First 1
    if ($csproj) {
        $content = Get-Content $csproj.FullName -Raw
        if ($content -match '<Project Sdk="Microsoft.NET.Sdk.Web">') {
            $ProjectInfo.Frameworks += "ASP.NET Core"
        }
        if ($content -match 'Microsoft\.AspNetCore\.Components\.WebAssembly') {
            $ProjectInfo.Frameworks += "Blazor WebAssembly"
        }
    }
}

# Detect Node.js
if (Test-Path (Join-Path $ProjectRoot "package.json")) {
    if ($ProjectInfo.Type -eq "Unknown") { $ProjectInfo.Type = "Node.js" }
    $ProjectInfo.Languages += "JavaScript/TypeScript"
    
    $packageJson = Get-Content (Join-Path $ProjectRoot "package.json") -Raw | ConvertFrom-Json
    
    # Detect framework
    if ($packageJson.dependencies.PSObject.Properties.Name -contains "react") {
        $ProjectInfo.Frameworks += "React"
    }
    if ($packageJson.dependencies.PSObject.Properties.Name -contains "vue") {
        $ProjectInfo.Frameworks += "Vue"
    }
    if ($packageJson.dependencies.PSObject.Properties.Name -contains "@angular/core") {
        $ProjectInfo.Frameworks += "Angular"
    }
    if ($packageJson.dependencies.PSObject.Properties.Name -contains "next") {
        $ProjectInfo.Frameworks += "Next.js"
    }
    
    # Build/test commands
    if ($packageJson.scripts.build) {
        $ProjectInfo.BuildCommand = "npm run build"
    }
    if ($packageJson.scripts.test) {
        $ProjectInfo.TestCommand = "npm test"
    }
    $ProjectInfo.ServerCleanup = "Stop-Process -Name 'node' -Force -ErrorAction SilentlyContinue"
}

# Detect Python
$pythonFiles = Get-ChildItem -Path $ProjectRoot -Filter "*.py" -Recurse -Depth 2 -ErrorAction SilentlyContinue
if ($pythonFiles.Count -gt 0) {
    if ($ProjectInfo.Type -eq "Unknown") { $ProjectInfo.Type = "Python" }
    $ProjectInfo.Languages += "Python"
    
    # Detect framework
    if (Test-Path (Join-Path $ProjectRoot "manage.py")) {
        $ProjectInfo.Frameworks += "Django"
    }
    if (Test-Path (Join-Path $ProjectRoot "app.py") -or Test-Path (Join-Path $ProjectRoot "application.py")) {
        $ProjectInfo.Frameworks += "Flask"
    }
    
    $ProjectInfo.BuildCommand = "python -m pip install -r requirements.txt"
    $ProjectInfo.TestCommand = "pytest"
    $ProjectInfo.ServerCleanup = "Stop-Process -Name 'python' -Force -ErrorAction SilentlyContinue"
}

# Detect Java
if (Test-Path (Join-Path $ProjectRoot "pom.xml") -or Test-Path (Join-Path $ProjectRoot "build.gradle")) {
    if ($ProjectInfo.Type -eq "Unknown") { $ProjectInfo.Type = "Java" }
    $ProjectInfo.Languages += "Java"
    
    if (Test-Path (Join-Path $ProjectRoot "pom.xml")) {
        $ProjectInfo.Frameworks += "Maven"
        $ProjectInfo.BuildCommand = "mvn clean install"
        $ProjectInfo.TestCommand = "mvn test"
    } else {
        $ProjectInfo.Frameworks += "Gradle"
        $ProjectInfo.BuildCommand = "gradle build"
        $ProjectInfo.TestCommand = "gradle test"
    }
    $ProjectInfo.ServerCleanup = "Stop-Process -Name 'java' -Force -ErrorAction SilentlyContinue"
}

# Detect Ruby
if (Test-Path (Join-Path $ProjectRoot "Gemfile")) {
    if ($ProjectInfo.Type -eq "Unknown") { $ProjectInfo.Type = "Ruby" }
    $ProjectInfo.Languages += "Ruby"
    $ProjectInfo.Frameworks += "Bundler"
    $ProjectInfo.BuildCommand = "bundle install"
    $ProjectInfo.TestCommand = "bundle exec rspec"
    $ProjectInfo.ServerCleanup = "Stop-Process -Name 'ruby' -Force -ErrorAction SilentlyContinue"
}

Write-Host "  ✓ Project Type: $($ProjectInfo.Type)" -ForegroundColor Green
Write-Host "  ✓ Languages: $($ProjectInfo.Languages -join ', ')" -ForegroundColor Green
if ($ProjectInfo.Frameworks.Count -gt 0) {
    Write-Host "  ✓ Frameworks: $($ProjectInfo.Frameworks -join ', ')" -ForegroundColor Green
}
Write-Host "  ✓ Build Command: $($ProjectInfo.BuildCommand)" -ForegroundColor Green
Write-Host "  ✓ Test Command: $($ProjectInfo.TestCommand)" -ForegroundColor Green
Write-Host ""

# ============================================================================
# PHASE 2: WORKSPACE STRUCTURE
# ============================================================================

Write-Host "Phase 2: Creating Workspace Structure..." -ForegroundColor Cyan

$WorkspaceDirs = @(
    "Workspaces\Copilot\learning\patterns",
    "Workspaces\Copilot\learning\completed-features",
    "Workspaces\Copilot\validation",
    "Workspaces\Copilot\issues",
    "Workspaces\Documentation",
    "Workspaces\Testing\results",
    "Workspaces\Scripts"
)

foreach ($dir in $WorkspaceDirs) {
    $fullPath = Join-Path $ProjectRoot $dir
    if (-not (Test-Path $fullPath)) {
        if (-not $DryRun) {
            New-Item -Path $fullPath -ItemType Directory -Force | Out-Null
        }
        Write-Host "  ✓ Created: $dir" -ForegroundColor Green
    } else {
        Write-Host "  ○ Exists: $dir" -ForegroundColor Gray
    }
}

# Initialize pattern files
$patternFiles = @{
    "Workspaces\Copilot\learning\patterns\successful-patterns.json" = @{
        metadata = @{
            project = $ProjectInfo.Name
            created = Get-Date -Format "yyyy-MM-dd"
            version = "1.0.0"
        }
        patterns = @()
    }
    "Workspaces\Copilot\learning\patterns\failed-approaches.json" = @{
        metadata = @{
            project = $ProjectInfo.Name
            created = Get-Date -Format "yyyy-MM-dd"
        }
        failures = @()
    }
    "Workspaces\Copilot\learning\patterns\refactoring-wins.json" = @{
        metadata = @{
            project = $ProjectInfo.Name
            created = Get-Date -Format "yyyy-MM-dd"
        }
        refactorings = @()
    }
}

foreach ($file in $patternFiles.Keys) {
    $fullPath = Join-Path $ProjectRoot $file
    if (-not (Test-Path $fullPath)) {
        if (-not $DryRun) {
            $patternFiles[$file] | ConvertTo-Json -Depth 5 | Set-Content $fullPath
        }
        Write-Host "  ✓ Created: $file" -ForegroundColor Green
    }
}

Write-Host ""

# ============================================================================
# PHASE 3: TOOL INSTALLATION
# ============================================================================

Write-Host "Phase 3: Installing Development Tools..." -ForegroundColor Cyan

if ($SkipToolInstall) {
    Write-Host "  [SKIPPED] Tool installation disabled" -ForegroundColor Yellow
    Write-Host ""
} else {
    $toolsToInstall = @()
    
    # .NET tools
    if ($ProjectInfo.Type -eq ".NET" -or $ProjectInfo.Languages -contains "C#") {
        $toolsToInstall += @{
            Name = "Roslynator"
            Check = { dotnet tool list -g | Select-String "roslynator.dotnet.cli" }
            Install = { dotnet tool install -g roslynator.dotnet.cli }
        }
    }
    
    # Node.js tools (for all projects - E2E testing)
    if ($ProjectInfo.Type -ne "Unknown") {
        $toolsToInstall += @{
            Name = "Playwright"
            Check = { npm list -g @playwright/test 2>$null }
            Install = { 
                npm install -g @playwright/test
                npx playwright install
            }
        }
        
        $toolsToInstall += @{
            Name = "ESLint"
            Check = { npm list -g eslint 2>$null }
            Install = { npm install -g eslint }
        }
        
        $toolsToInstall += @{
            Name = "Prettier"
            Check = { npm list -g prettier 2>$null }
            Install = { npm install -g prettier }
        }
    }
    
    foreach ($tool in $toolsToInstall) {
        try {
            $exists = & $tool.Check
            if ($exists) {
                Write-Host "  ○ Already installed: $($tool.Name)" -ForegroundColor Gray
            } else {
                if (-not $DryRun) {
                    Write-Host "  → Installing: $($tool.Name)..." -ForegroundColor Yellow
                    & $tool.Install
                }
                Write-Host "  ✓ Installed: $($tool.Name)" -ForegroundColor Green
            }
        } catch {
            Write-Host "  ✗ Failed to install: $($tool.Name)" -ForegroundColor Red
            Write-Host "    Error: $_" -ForegroundColor Red
        }
    }
    
    Write-Host ""
}

# ============================================================================
# PHASE 4: PLACEHOLDER REPLACEMENT
# ============================================================================

Write-Host "Phase 4: Configuring Agent Prompts..." -ForegroundColor Cyan

# Build placeholder replacement map
$placeholders = @{
    "{{PROJECT_NAME}}" = $ProjectInfo.Name
    "{{PROJECT_TYPE}}" = $ProjectInfo.Type
    "{{PLACEHOLDER_PRIMARY_LANGUAGE}}" = $ProjectInfo.Languages[0]
    "{{PLACEHOLDER_BUILD_COMMAND}}" = $ProjectInfo.BuildCommand
    "{{PLACEHOLDER_TEST_COMMAND}}" = $ProjectInfo.TestCommand
    "{{PLACEHOLDER_SERVER_CLEANUP_COMMAND}}" = $ProjectInfo.ServerCleanup
    "{{PLACEHOLDER_DATE}}" = Get-Date -Format "MMMM d, yyyy"
    "{{PLACEHOLDER_YEAR}}" = Get-Date -Format "yyyy"
}

# Add framework-specific placeholders
if ($ProjectInfo.Type -eq ".NET") {
    $placeholders["{{PLACEHOLDER_PROJECT_LAYERS}}"] = "Controllers, Services, Data, Models, Shared"
    $placeholders["{{PLACEHOLDER_ARCHITECTURE}}"] = "ASP.NET Core MVC/Razor/Blazor with layered architecture"
    $placeholders["{{PLACEHOLDER_ANALYZER_COMMAND}}"] = "roslynator analyze --output results.xml"
}

if ($ProjectInfo.Languages -contains "JavaScript/TypeScript") {
    $placeholders["{{PLACEHOLDER_LINTER_COMMAND}}"] = "eslint . --ext .js,.ts,.jsx,.tsx"
    $placeholders["{{PLACEHOLDER_FORMATTER_COMMAND}}"] = "prettier --check ."
}

# Process all template files
$promptTemplates = Get-ChildItem -Path (Join-Path $PortableRoot "prompts") -Filter "*.template" -Recurse
$instructionTemplates = Get-ChildItem -Path (Join-Path $PortableRoot "instructions") -Filter "*.template" -Recurse -ErrorAction SilentlyContinue

$allTemplates = $promptTemplates + $instructionTemplates

foreach ($template in $allTemplates) {
    $content = Get-Content $template.FullName -Raw
    
    # Replace all placeholders
    foreach ($placeholder in $placeholders.Keys) {
        $content = $content -replace [regex]::Escape($placeholder), $placeholders[$placeholder]
    }
    
    # Determine output path
    $relativePath = $template.FullName.Replace($PortableRoot, "").TrimStart('\')
    $outputPath = Join-Path $ProjectRoot ".github" ($relativePath -replace '\.template$', '')
    
    # Create output directory
    $outputDir = Split-Path $outputPath -Parent
    if (-not (Test-Path $outputDir)) {
        if (-not $DryRun) {
            New-Item -Path $outputDir -ItemType Directory -Force | Out-Null
        }
    }
    
    # Write configured file
    if (-not $DryRun) {
        Set-Content -Path $outputPath -Value $content
    }
    
    $shortPath = $relativePath -replace '\.template$', ''
    Write-Host "  ✓ Configured: $shortPath" -ForegroundColor Green
}

# Copy shared modules (no placeholders needed)
$sharedModules = Get-ChildItem -Path (Join-Path $PortableRoot "prompts\shared") -Filter "*.md"
foreach ($module in $sharedModules) {
    $outputPath = Join-Path $ProjectRoot ".github\prompts\shared" $module.Name
    $outputDir = Split-Path $outputPath -Parent
    
    if (-not (Test-Path $outputDir)) {
        if (-not $DryRun) {
            New-Item -Path $outputDir -ItemType Directory -Force | Out-Null
        }
    }
    
    if (-not $DryRun) {
        Copy-Item $module.FullName -Destination $outputPath -Force
    }
    
    Write-Host "  ✓ Copied: prompts\shared\$($module.Name)" -ForegroundColor Green
}

Write-Host ""

# ============================================================================
# PHASE 5: VALIDATION
# ============================================================================

Write-Host "Phase 5: Running Validation Checks..." -ForegroundColor Cyan

$validationResults = @{
    GitRepository = $ProjectInfo.HasGit
    WorkspaceStructure = Test-Path (Join-Path $ProjectRoot "Workspaces\Copilot")
    PromptsInstalled = Test-Path (Join-Path $ProjectRoot ".github\prompts")
    InstructionsInstalled = Test-Path (Join-Path $ProjectRoot ".github\instructions")
    BuildCommandSet = $ProjectInfo.BuildCommand -ne ""
}

$allPassed = $true
foreach ($check in $validationResults.Keys) {
    if ($validationResults[$check]) {
        Write-Host "  ✓ $check" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $check" -ForegroundColor Red
        $allPassed = $false
    }
}

Write-Host ""

if (-not $allPassed) {
    Write-Host "[WARNING] Some validation checks failed. System may not work correctly." -ForegroundColor Yellow
    Write-Host ""
}

# ============================================================================
# PHASE 6: GENERATE PROJECT SUMMARY
# ============================================================================

Write-Host "Phase 6: Generating Setup Summary..." -ForegroundColor Cyan

$summaryPath = Join-Path $ProjectRoot "PROJECT-SETUP-SUMMARY.md"

$summary = @"
# AI Agent System - Setup Summary

**Project:** $($ProjectInfo.Name)  
**Setup Date:** $(Get-Date -Format "MMMM d, yyyy HH:mm")  
**Setup Version:** 1.0.0

---

## Project Detection Results

- **Type:** $($ProjectInfo.Type)
- **Languages:** $($ProjectInfo.Languages -join ', ')
- **Frameworks:** $($ProjectInfo.Frameworks -join ', ')
- **Build Command:** ``$($ProjectInfo.BuildCommand)``
- **Test Command:** ``$($ProjectInfo.TestCommand)``

---

## Installed Components

### Workspace Structure
- ✅ ``Workspaces/Copilot/learning/patterns`` - Pattern storage
- ✅ ``Workspaces/Copilot/validation`` - Validation reports
- ✅ ``Workspaces/Documentation`` - Generated documentation
- ✅ ``Workspaces/Testing`` - Test results

### Agent Prompts
$(if ($promptTemplates.Count -gt 0) {
    $promptTemplates | ForEach-Object { "- ✅ ``.github/prompts/$($_.Name -replace '\.template$', '')``" }
} else {
    "- ⚠️ No prompt templates found"
})

### Shared Modules
$(if ($sharedModules.Count -gt 0) {
    $sharedModules | ForEach-Object { "- ✅ ``.github/prompts/shared/$($_.Name)``" }
} else {
    "- ⚠️ No shared modules found"
})

### Development Tools
$($toolsToInstall | ForEach-Object { "- $($_.Name)" } | Out-String)

---

## Next Steps

### 1. Test Basic Functionality
``````
@workspace /question "What agents are available?"
``````

### 2. Create Your First Feature
``````
@workspace /task key=welcome tasks="Add a welcome message to the home page"
``````

### 3. Run Health Check
``````
@workspace /healthcheck mode=full
``````

### 4. Review Documentation
- Read ``.github/prompts/task.prompt.md`` to understand task execution
- Review ``.github/instructions/SelfAwareness.instructions.md`` for operating rules
- Check ``Workspaces/Copilot/learning/patterns`` for learning system

---

## Configuration Details

### Placeholders Replaced
$(foreach ($key in $placeholders.Keys | Sort-Object) {
    "- ``$key`` → ``$($placeholders[$key])``"
})

---

## Troubleshooting

### If agents don't respond:
1. Ensure GitHub Copilot is active
2. Check ``.github/prompts`` files exist
3. Verify workspace structure created

### If build fails:
1. Run: ``$($ProjectInfo.BuildCommand)``
2. Check for compilation errors
3. Ensure all dependencies installed

### If tests fail:
1. Run: ``$($ProjectInfo.TestCommand)``
2. Review test output
3. Check test configuration

---

## Support Resources

- **Documentation:** ``D:\PROJECTS\NOOR CANVAS\.github\_Portable\docs\``
- **Troubleshooting:** ``D:\PROJECTS\NOOR CANVAS\.github\_Portable\docs\TROUBLESHOOTING.md``
- **Advanced Usage:** ``D:\PROJECTS\NOOR CANVAS\.github\_Portable\docs\ADVANCED-USAGE.md``

---

*Generated by Portable AI Agent System Setup v1.0.0*
"@

if (-not $DryRun) {
    Set-Content -Path $summaryPath -Value $summary
}

Write-Host "  ✓ Created: PROJECT-SETUP-SUMMARY.md" -ForegroundColor Green
Write-Host ""

# ============================================================================
# COMPLETION
# ============================================================================

Write-Host "============================================" -ForegroundColor Green
Write-Host " Setup Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Project configured successfully for: $($ProjectInfo.Name)" -ForegroundColor Cyan
Write-Host ""
Write-Host "Quick Start:" -ForegroundColor Yellow
Write-Host "  1. Open VS Code in this directory" -ForegroundColor White
Write-Host "  2. Review: PROJECT-SETUP-SUMMARY.md" -ForegroundColor White
Write-Host "  3. Test: @workspace /question `"What agents are available?`"" -ForegroundColor White
Write-Host ""
Write-Host "Full Documentation: .github/_Portable/docs/" -ForegroundColor Gray
Write-Host ""

if ($DryRun) {
    Write-Host "[DRY RUN] No files were modified" -ForegroundColor Yellow
    Write-Host "Run without -DryRun to apply changes" -ForegroundColor Yellow
}
