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
    Author: Portable AI Agent System
    Version: 2.0.0
    Date: October 12, 2025
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
    DatabaseType = "None"
    DatabaseName = ""
    ApiEndpoints = @()
}

# Detect .NET
if (Test-Path (Join-Path $ProjectRoot "*.sln")) {
    $ProjectInfo.Type = ".NET"
    $ProjectInfo.Languages += "C#"
    $ProjectInfo.BuildCommand = "dotnet build"
    $ProjectInfo.TestCommand = "dotnet test"
    $ProjectInfo.ServerCleanup = "Get-Process -Name dotnet -ErrorAction SilentlyContinue | Stop-Process -Force"
    
    # Detect framework
    $csproj = Get-ChildItem -Path $ProjectRoot -Filter "*.csproj" -Recurse | Select-Object -First 1
    if ($csproj) {
        $content = Get-Content $csproj.FullName -Raw
        if ($content -match '<Project Sdk="Microsoft.NET.Sdk.Web">') {
            $ProjectInfo.Frameworks += "ASP.NET Core"
        }
        if ($content -match 'Microsoft\.AspNetCore\.Components\.WebAssembly') {
            $ProjectInfo.Frameworks += "Blazor WebAssembly"
        }
        if ($content -match 'Microsoft\.EntityFrameworkCore') {
            $ProjectInfo.DatabaseType = "Entity Framework Core"
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
    $ProjectInfo.ServerCleanup = "Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force"
}

# Detect Python
if ((Get-ChildItem -Path $ProjectRoot -Filter "*.py" -Recurse -Depth 2 -ErrorAction SilentlyContinue).Count -gt 0) {
    if ($ProjectInfo.Type -eq "Unknown") { $ProjectInfo.Type = "Python" }
    $ProjectInfo.Languages += "Python"
    
    if (Test-Path (Join-Path $ProjectRoot "manage.py")) {
        $ProjectInfo.Frameworks += "Django"
        $ProjectInfo.BuildCommand = "python manage.py migrate"
        $ProjectInfo.TestCommand = "python manage.py test"
    }
    elseif (Test-Path (Join-Path $ProjectRoot "app.py")) {
        $ProjectInfo.Frameworks += "Flask"
        $ProjectInfo.TestCommand = "pytest"
    }
    $ProjectInfo.ServerCleanup = "Get-Process -Name python -ErrorAction SilentlyContinue | Stop-Process -Force"
}

Write-Host "  [✓] Project Type: $($ProjectInfo.Type)" -ForegroundColor Green
Write-Host "  [✓] Languages: $($ProjectInfo.Languages -join ', ')" -ForegroundColor Green
Write-Host "  [✓] Frameworks: $($ProjectInfo.Frameworks -join ', ')" -ForegroundColor Green
Write-Host ""

# ============================================================================
# PHASE 2: WORKSPACE STRUCTURE CREATION
# ============================================================================

Write-Host "Phase 2: Creating Workspace Structure..." -ForegroundColor Cyan

$WorkspaceDirs = @(
    ".github/prompts/shared",
    ".github/instructions/Links",
    "Workspaces/Copilot/_DOCS/summaries",
    "Workspaces/Copilot/_DOCS/analysis",
    "Workspaces/Copilot/_DOCS/configs",
    "Workspaces/Copilot/artifacts",
    "Workspaces/Copilot/config",
    "Workspaces/Copilot/prompts.keys",
    "Workspaces/Copilot/learning",
    "Workspaces/CodeQuality/Analyzer/Config",
    "Workspaces/CodeQuality/Analyzer/Reports",
    "Workspaces/CodeQuality/Analyzer/Logs",
    "Workspaces/TEMP"
)

foreach ($dir in $WorkspaceDirs) {
    $fullPath = Join-Path $ProjectRoot $dir
    if (-not (Test-Path $fullPath)) {
        if (-not $DryRun) {
            New-Item -ItemType Directory -Path $fullPath -Force | Out-Null
        }
        Write-Host "  [✓] Created: $dir" -ForegroundColor Green
    }
    else {
        Write-Host "  [→] Exists: $dir" -ForegroundColor Gray
    }
}

Write-Host ""

# ============================================================================
# PHASE 3: TEMPLATE PROCESSING
# ============================================================================

Write-Host "Phase 3: Processing Templates..." -ForegroundColor Cyan

# Template replacement function
function Expand-Template {
    param(
        [string]$Content,
        [hashtable]$Variables
    )
    
    $result = $Content
    foreach ($key in $Variables.Keys) {
        $result = $result -replace "\{\{$key\}\}", $Variables[$key]
    }
    return $result
}

# Define replacement variables
$TemplateVars = @{
    "PROJECT_NAME" = $ProjectInfo.Name
    "PROJECT_TYPE" = $ProjectInfo.Type
    "LANGUAGES" = ($ProjectInfo.Languages -join ", ")
    "FRAMEWORKS" = ($ProjectInfo.Frameworks -join ", ")
    "BUILD_COMMAND" = $ProjectInfo.BuildCommand
    "TEST_COMMAND" = $ProjectInfo.TestCommand
    "SERVER_CLEANUP" = $ProjectInfo.ServerCleanup
    "DATABASE_TYPE" = $ProjectInfo.DatabaseType
    "HAS_GIT" = if ($ProjectInfo.HasGit) { "Yes" } else { "No" }
}

# Process template files
$templateFiles = Get-ChildItem -Path $PortableRoot -Filter "*.template" -Recurse

foreach ($template in $templateFiles) {
    $content = Get-Content $template.FullName -Raw
    $expandedContent = Expand-Template -Content $content -Variables $TemplateVars
    
    # Determine destination path
    $relativePath = $template.FullName.Substring($PortableRoot.Length + 1)
    $destinationPath = $relativePath -replace "\.template$", ""
    $destinationPath = $destinationPath -replace "^prompts\\", ".github\prompts\"
    $destinationPath = $destinationPath -replace "^instructions\\", ".github\instructions\"
    $fullDestPath = Join-Path $ProjectRoot $destinationPath
    
    if (-not $DryRun) {
        $destDir = Split-Path $fullDestPath -Parent
        if (-not (Test-Path $destDir)) {
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        }
        Set-Content -Path $fullDestPath -Value $expandedContent -Encoding UTF8
    }
    
    Write-Host "  [✓] Generated: $destinationPath" -ForegroundColor Green
}

# Copy shared files (no templating needed)
$sharedFiles = Get-ChildItem -Path (Join-Path $PortableRoot "prompts\shared") -File
foreach ($file in $sharedFiles) {
    $destPath = Join-Path $ProjectRoot ".github\prompts\shared\$($file.Name)"
    if (-not $DryRun) {
        Copy-Item -Path $file.FullName -Destination $destPath -Force
    }
    Write-Host "  [✓] Copied: .github/prompts/shared/$($file.Name)" -ForegroundColor Green
}

Write-Host ""

# ============================================================================
# PHASE 4: TOOL INSTALLATION (Optional)
# ============================================================================

if (-not $SkipToolInstall) {
    Write-Host "Phase 4: Installing Development Tools..." -ForegroundColor Cyan
    
    # Install based on project type
    switch ($ProjectInfo.Type) {
        ".NET" {
            Write-Host "  [→] Installing Roslynator..." -ForegroundColor Yellow
            if (-not $DryRun) {
                dotnet tool install -g Roslynator.DotNet.Cli 2>&1 | Out-Null
            }
            Write-Host "  [✓] Roslynator installed" -ForegroundColor Green
        }
        "Node.js" {
            Write-Host "  [→] Installing Playwright..." -ForegroundColor Yellow
            if (-not $DryRun) {
                npm install -D @playwright/test 2>&1 | Out-Null
                npx playwright install 2>&1 | Out-Null
            }
            Write-Host "  [✓] Playwright installed" -ForegroundColor Green
        }
    }
    
    Write-Host ""
}
else {
    Write-Host "Phase 4: Skipping Tool Installation (--SkipToolInstall)" -ForegroundColor Yellow
    Write-Host ""
}

# ============================================================================
# PHASE 5: GENERATE PROJECT SUMMARY
# ============================================================================

Write-Host "Phase 5: Generating Project Summary..." -ForegroundColor Cyan

$summaryContent = @"
# Project Setup Summary

**Generated**: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")  
**Project**: $($ProjectInfo.Name)  
**Type**: $($ProjectInfo.Type)  
**Portable AI Agent System**: v2.0.0

---

## Project Configuration

### Detected Information
- **Languages**: $($ProjectInfo.Languages -join ', ')
- **Frameworks**: $($ProjectInfo.Frameworks -join ', ')
- **Database**: $($ProjectInfo.DatabaseType)
- **Git Repository**: $($ProjectInfo.HasGit)

### Build & Test Commands
- **Build**: ``$($ProjectInfo.BuildCommand)``
- **Test**: ``$($ProjectInfo.TestCommand)``
- **Server Cleanup**: ``$($ProjectInfo.ServerCleanup)``

---

## Installed Agents

### 1. Task Executor (`/task`)
- **Purpose**: Feature implementation, bug fixes, general development
- **Key Features**: Progressive documentation, automatic test generation, 0E/0W policy
- **Usage**: ``@workspace /task key=myfeature tasks="Implement new feature"``

### 2. Refactor Agent (`/refactor`)
- **Purpose**: Code quality improvements, technical debt reduction
- **Key Features**: Warning-free commits, systematic refactoring, pattern extraction
- **Usage**: ``@workspace /refactor scope=MyService tasks="Extract common logic"``

### 3. Sync Agent (`/sync`)
- **Purpose**: Keep documentation in sync with code
- **Key Features**: Cross-reference validation, automated updates
- **Usage**: ``@workspace /sync key=myfeature``

### 4. Health Check Agent (`/healthcheck`)
- **Purpose**: Validate system integrity and architectural compliance
- **Key Features**: 6-level validation pipeline, comprehensive reporting
- **Usage**: ``@workspace /healthcheck``

### 5. Question Agent (`/question`)
- **Purpose**: Answer questions about codebase, architecture, patterns
- **Key Features**: Context-aware responses, learning integration
- **Usage**: ``@workspace /question "How does authentication work?"``

### 6. Test Generation Agent (`/test-generation`)
- **Purpose**: Create comprehensive E2E tests
- **Key Features**: Multi-browser support, proven patterns
- **Usage**: ``@workspace /test-generation feature=login scenario=success``

---

## Workspace Structure

\`\`\`
.github/
├── prompts/              # Agent prompt files
│   └── shared/          # Shared modules
└── instructions/        # System guidelines
    └── Links/          # Reference documentation

Workspaces/
├── Copilot/
│   ├── _DOCS/          # Analysis and summaries
│   ├── config/         # Agent configurations
│   ├── learning/       # Pattern library
│   └── prompts.keys/   # Key-based work tracking
├── CodeQuality/        # Analysis tools and reports
└── TEMP/               # Temporary test files
\`\`\`

---

## Next Steps

1. **Test the System**
   \`\`\`
   @workspace /question "What agents are available?"
   \`\`\`

2. **Start Your First Task**
   \`\`\`
   @workspace /task key=setup tasks="Verify setup complete"
   \`\`\`

3. **Review Documentation**
   - [.github/prompts/task.prompt.md](.github/prompts/task.prompt.md) - Task agent guide
   - [.github/instructions/SelfAwareness.instructions.md](.github/instructions/SelfAwareness.instructions.md) - Global rules

4. **Configure Your Environment**
   - Update database connection strings (if applicable)
   - Configure API keys (if using AI features)
   - Set up your preferred IDE integrations

---

## Support

For issues or questions:
1. Check [.github/_Portable/docs/TROUBLESHOOTING.md](../_Portable/docs/TROUBLESHOOTING.md)
2. Review agent-specific prompt files in `.github/prompts/`
3. Consult system documentation in `.github/instructions/`

---

**Setup completed successfully!** 🎉
"@

$summaryPath = Join-Path $ProjectRoot "PROJECT-SETUP-SUMMARY.md"
if (-not $DryRun) {
    Set-Content -Path $summaryPath -Value $summaryContent -Encoding UTF8
}

Write-Host "  [✓] Created: PROJECT-SETUP-SUMMARY.md" -ForegroundColor Green
Write-Host ""

# ============================================================================
# COMPLETION
# ============================================================================

Write-Host "============================================" -ForegroundColor Green
Write-Host " Setup Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Review the generated PROJECT-SETUP-SUMMARY.md for details." -ForegroundColor Cyan
Write-Host ""
Write-Host "Test your setup with:" -ForegroundColor Yellow
Write-Host "  @workspace /question `"What agents are available?`"" -ForegroundColor White
Write-Host ""
