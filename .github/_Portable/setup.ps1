# Portable AI Agent System Setup Script
# PowerShell Version (Cross-platform)

param(
    [string]$ProjectName = "",
    [switch]$AutoDetect = $true,
    [switch]$DryRun = $false
)

# Color output functions
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }
function Write-Error { Write-Host $args -ForegroundColor Red }

# Clear screen and show banner
Clear-Host
Write-Info "========================================"
Write-Info " Portable AI Agent System Setup"
Write-Info "========================================"
Write-Host ""

# Detect project root (parent of .github\_Portable)
$scriptPath = $PSScriptRoot
$portableDir = $scriptPath
$githubDir = Split-Path $portableDir -Parent
$projectRoot = Split-Path $githubDir -Parent

Write-Info "Project Root: $projectRoot"
Write-Info "Portable Templates: $portableDir"
Write-Host ""

#region Project Type Detection

function Detect-ProjectType {
    Write-Info "🔍 Detecting project type..."
    
    $projectTypes = @()
    
    # .NET Detection
    if ((Get-ChildItem -Path $projectRoot -Filter "*.sln" -ErrorAction SilentlyContinue) -or
        (Get-ChildItem -Path $projectRoot -Filter "*.csproj" -Recurse -ErrorAction SilentlyContinue)) {
        $projectTypes += ".NET"
    }
    
    # Node.js Detection
    if (Test-Path (Join-Path $projectRoot "package.json")) {
        $projectTypes += "Node.js"
    }
    
    # Python Detection
    if ((Test-Path (Join-Path $projectRoot "requirements.txt")) -or
        (Test-Path (Join-Path $projectRoot "setup.py")) -or
        (Test-Path (Join-Path $projectRoot "pyproject.toml"))) {
        $projectTypes += "Python"
    }
    
    # Java Detection
    if ((Test-Path (Join-Path $projectRoot "pom.xml")) -or
        (Test-Path (Join-Path $projectRoot "build.gradle"))) {
        $projectTypes += "Java"
    }
    
    # Ruby Detection
    if (Test-Path (Join-Path $projectRoot "Gemfile")) {
        $projectTypes += "Ruby"
    }
    
    # Go Detection
    if (Test-Path (Join-Path $projectRoot "go.mod")) {
        $projectTypes += "Go"
    }
    
    # PHP Detection
    if (Test-Path (Join-Path $projectRoot "composer.json")) {
        $projectTypes += "PHP"
    }
    
    if ($projectTypes.Count -eq 0) {
        $projectTypes += "Other"
    }
    
    Write-Success "✅ Detected: $($projectTypes -join ', ')"
    return $projectTypes
}

#endregion

#region Interactive Configuration

function Get-ProjectConfig {
    param([string[]]$DetectedTypes)
    
    Write-Info ""
    Write-Info "📝 Project Configuration"
    Write-Info "========================"
    Write-Host ""
    
    $config = @{}
    
    # Project Name
    if ([string]::IsNullOrWhiteSpace($ProjectName)) {
        $defaultName = (Get-Item $projectRoot).Name
        $config.PROJECT_NAME = Read-Host "Project Name [$defaultName]"
        if ([string]::IsNullOrWhiteSpace($config.PROJECT_NAME)) {
            $config.PROJECT_NAME = $defaultName
        }
    } else {
        $config.PROJECT_NAME = $ProjectName
    }
    
    # Project Type
    Write-Host ""
    Write-Host "Detected project types: $($DetectedTypes -join ', ')"
    $config.PROJECT_TYPE = Read-Host "Primary project type [$($DetectedTypes[0])]"
    if ([string]::IsNullOrWhiteSpace($config.PROJECT_TYPE)) {
        $config.PROJECT_TYPE = $DetectedTypes[0]
    }
    
    # Language and Framework Detection
    switch ($config.PROJECT_TYPE) {
        ".NET" {
            $config.LANGUAGES = "C#"
            $config.FRAMEWORKS = Read-Host "Frameworks (e.g., ASP.NET Core, Blazor) [ASP.NET Core]"
            if ([string]::IsNullOrWhiteSpace($config.FRAMEWORKS)) {
                $config.FRAMEWORKS = "ASP.NET Core"
            }
            $config.BUILD_COMMAND = "dotnet build"
            $config.TEST_COMMAND = "dotnet test"
            $config.RUN_COMMAND = "dotnet run"
            $config.LINT_COMMAND = "dotnet format --verify-no-changes"
            $config.ANALYZER_TOOLS = "Roslynator, StyleCop"
            $config.TEST_FRAMEWORK = "xUnit, Playwright"
            $config.PACKAGE_MANAGER = "NuGet"
        }
        "Node.js" {
            $config.LANGUAGES = "JavaScript, TypeScript"
            $config.FRAMEWORKS = Read-Host "Frameworks (e.g., Express, React, Vue) [Express]"
            if ([string]::IsNullOrWhiteSpace($config.FRAMEWORKS)) {
                $config.FRAMEWORKS = "Express"
            }
            $config.BUILD_COMMAND = "npm run build"
            $config.TEST_COMMAND = "npm test"
            $config.RUN_COMMAND = "npm start"
            $config.LINT_COMMAND = "npm run lint"
            $config.ANALYZER_TOOLS = "ESLint, Prettier"
            $config.TEST_FRAMEWORK = "Jest, Playwright"
            $config.PACKAGE_MANAGER = "npm"
        }
        "Python" {
            $config.LANGUAGES = "Python"
            $config.FRAMEWORKS = Read-Host "Frameworks (e.g., Django, Flask, FastAPI) [Flask]"
            if ([string]::IsNullOrWhiteSpace($config.FRAMEWORKS)) {
                $config.FRAMEWORKS = "Flask"
            }
            $config.BUILD_COMMAND = "python -m build"
            $config.TEST_COMMAND = "pytest"
            $config.RUN_COMMAND = "python app.py"
            $config.LINT_COMMAND = "flake8"
            $config.ANALYZER_TOOLS = "flake8, pylint, black"
            $config.TEST_FRAMEWORK = "pytest"
            $config.PACKAGE_MANAGER = "pip"
        }
        "Java" {
            $config.LANGUAGES = "Java"
            $config.FRAMEWORKS = Read-Host "Frameworks (e.g., Spring Boot, Jakarta EE) [Spring Boot]"
            if ([string]::IsNullOrWhiteSpace($config.FRAMEWORKS)) {
                $config.FRAMEWORKS = "Spring Boot"
            }
            $config.BUILD_COMMAND = "mvn clean install"
            $config.TEST_COMMAND = "mvn test"
            $config.RUN_COMMAND = "mvn spring-boot:run"
            $config.LINT_COMMAND = "mvn checkstyle:check"
            $config.ANALYZER_TOOLS = "Checkstyle, SpotBugs"
            $config.TEST_FRAMEWORK = "JUnit, Selenium"
            $config.PACKAGE_MANAGER = "Maven"
        }
        default {
            $config.LANGUAGES = Read-Host "Programming Languages"
            $config.FRAMEWORKS = Read-Host "Frameworks/Libraries"
            $config.BUILD_COMMAND = Read-Host "Build Command"
            $config.TEST_COMMAND = Read-Host "Test Command"
            $config.RUN_COMMAND = Read-Host "Run Command"
            $config.LINT_COMMAND = Read-Host "Lint Command"
            $config.ANALYZER_TOOLS = Read-Host "Analysis Tools"
            $config.TEST_FRAMEWORK = Read-Host "Testing Framework"
            $config.PACKAGE_MANAGER = Read-Host "Package Manager"
        }
    }
    
    # Database Configuration
    Write-Host ""
    Write-Info "Database Configuration"
    $config.DATABASE_NAME = Read-Host "Primary Database Name"
    $config.DATABASE_SERVER = Read-Host "Database Server"
    $config.DATABASE_TYPE = Read-Host "Database Type (e.g., SQL Server, PostgreSQL, MongoDB)"
    $config.SCHEMA_PRIMARY = Read-Host "Primary Writable Schema [dbo]"
    if ([string]::IsNullOrWhiteSpace($config.SCHEMA_PRIMARY)) {
        $config.SCHEMA_PRIMARY = "dbo"
    }
    $config.SCHEMA_READONLY = Read-Host "Read-Only Schemas (comma-separated)"
    $config.CONNECTION_STRING_KEY = Read-Host "Connection String Key [DefaultConnection]"
    if ([string]::IsNullOrWhiteSpace($config.CONNECTION_STRING_KEY)) {
        $config.CONNECTION_STRING_KEY = "DefaultConnection"
    }
    
    # Infrastructure Configuration
    Write-Host ""
    Write-Info "Infrastructure Configuration"
    $config.API_BASE_URL = Read-Host "API Base URL (e.g., https://localhost:5001/api)"
    $config.APP_PORT = Read-Host "Application Port [5000]"
    if ([string]::IsNullOrWhiteSpace($config.APP_PORT)) {
        $config.APP_PORT = "5000"
    }
    
    # Real-time Technology
    $config.REALTIME_TECH = Read-Host "Real-time Technology (SignalR, Socket.IO, WebSockets, None) [None]"
    if ([string]::IsNullOrWhiteSpace($config.REALTIME_TECH)) {
        $config.REALTIME_TECH = "None"
    }
    
    # UI Framework
    $config.UI_FRAMEWORK = Read-Host "UI Framework (Blazor, React, Vue, Angular, None) [None]"
    if ([string]::IsNullOrWhiteSpace($config.UI_FRAMEWORK)) {
        $config.UI_FRAMEWORK = "None"
    }
    
    # Branch Strategy
    Write-Host ""
    Write-Info "Branch Strategy"
    $config.PRODUCTION_BRANCH = Read-Host "Production Branch Name [master]"
    if ([string]::IsNullOrWhiteSpace($config.PRODUCTION_BRANCH)) {
        $config.PRODUCTION_BRANCH = "master"
    }
    $config.DEVELOPMENT_BRANCH = Read-Host "Development Branch Name [development]"
    if ([string]::IsNullOrWhiteSpace($config.DEVELOPMENT_BRANCH)) {
        $config.DEVELOPMENT_BRANCH = "development"
    }
    
    # Paths
    $config.SOURCE_PATH = Read-Host "Source Code Path (relative to project root)"
    $config.TEST_PATH = Read-Host "Test Files Path (relative to project root)"
    $config.CONFIG_PATH = Read-Host "Configuration Files Path (relative to project root)"
    
    # Additional Settings
    $config.API_COUNT = Read-Host "Initial API Endpoint Count [0]"
    if ([string]::IsNullOrWhiteSpace($config.API_COUNT)) {
        $config.API_COUNT = "0"
    }
    $config.SERVICE_COUNT = Read-Host "Initial Service Count [0]"
    if ([string]::IsNullOrWhiteSpace($config.SERVICE_COUNT)) {
        $config.SERVICE_COUNT = "0"
    }
    
    # Scripts
    $config.LAUNCH_SCRIPT = Read-Host "Launch Script (relative path)"
    $config.BUILD_LAUNCH_SCRIPT = Read-Host "Build+Launch Script (relative path)"
    $config.DEPLOYMENT_SCRIPT = Read-Host "Deployment Script (relative path)"
    
    return $config
}

#endregion

#region Template Processing

function Process-Templates {
    param($Config)
    
    Write-Info ""
    Write-Info "🔨 Processing Templates..."
    Write-Info "=========================="
    Write-Host ""
    
    $filesProcessed = 0
    
    # Get all template files
    $templateFiles = Get-ChildItem -Path $portableDir -Filter "*.template" -Recurse
    
    foreach ($template in $templateFiles) {
        $relativePath = $template.FullName.Substring($portableDir.Length + 1)
        $outputPath = $template.FullName -replace '\.template$', ''
        $outputPath = $outputPath -replace '\\\_Portable\\', '\\'
        
        # Read template content
        $content = Get-Content -Path $template.FullName -Raw
        
        # Replace all template variables
        foreach ($key in $Config.Keys) {
            $content = $content -replace "\{\{$key\}\}", $Config[$key]
        }
        
        # Determine output location (move from _Portable to .github)
        $targetPath = $outputPath -replace [regex]::Escape($portableDir), $githubDir
        $targetDir = Split-Path $targetPath -Parent
        
        # Create target directory if needed
        if (!(Test-Path $targetDir)) {
            New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
        }
        
        if (!$DryRun) {
            # Write processed file
            Set-Content -Path $targetPath -Value $content -NoNewline
        }
        
        Write-Success "✅ $relativePath -> $(Split-Path $targetPath -Leaf)"
        $filesProcessed++
    }
    
    Write-Host ""
    Write-Success "Processed $filesProcessed template files"
}

#endregion

#region Folder Structure Creation

function Create-WorkspaceFolders {
    Write-Info ""
    Write-Info "📁 Creating Workspace Structure..."
    Write-Info "=================================="
    Write-Host ""
    
    $folders = @(
        "Workspaces\Copilot\_DOCS\summaries",
        "Workspaces\Copilot\_DOCS\analysis",
        "Workspaces\Copilot\_DOCS\configs",
        "Workspaces\Copilot\_DOCS\migrations",
        "Workspaces\Copilot\artifacts",
        "Workspaces\Copilot\config",
        "Workspaces\Copilot\prompts.keys",
        "Workspaces\Copilot\learning",
        "Workspaces\CodeQuality\Analysis\Config",
        "Workspaces\CodeQuality\Analysis\Reports",
        "Workspaces\CodeQuality\Analysis\Logs",
        "Workspaces\Documentation",
        "Workspaces\TEMP"
    )
    
    foreach ($folder in $folders) {
        $fullPath = Join-Path $projectRoot $folder
        if (!(Test-Path $fullPath)) {
            if (!$DryRun) {
                New-Item -ItemType Directory -Path $fullPath -Force | Out-Null
            }
            Write-Success "✅ Created: $folder"
        } else {
            Write-Info "   Exists: $folder"
        }
    }
}

#endregion

#region Summary Generation

function Generate-SetupSummary {
    param($Config)
    
    Write-Info ""
    Write-Info "📄 Generating Setup Summary..."
    Write-Info "=============================="
    Write-Host ""
    
    $summary = @"
# Project Setup Summary

**Date**: $(Get-Date -Format "yyyy-MM-DD HH:mm:ss")
**Project**: $($Config.PROJECT_NAME)
**Type**: $($Config.PROJECT_TYPE)

---

## Configuration

### Project Identity
- **Name**: $($Config.PROJECT_NAME)
- **Type**: $($Config.PROJECT_TYPE)
- **Languages**: $($Config.LANGUAGES)
- **Frameworks**: $($Config.FRAMEWORKS)

### Build & Test
- **Build Command**: ``$($Config.BUILD_COMMAND)``
- **Test Command**: ``$($Config.TEST_COMMAND)``
- **Run Command**: ``$($Config.RUN_COMMAND)``
- **Lint Command**: ``$($Config.LINT_COMMAND)``

### Database
- **Primary Database**: $($Config.DATABASE_NAME)
- **Server**: $($Config.DATABASE_SERVER)
- **Type**: $($Config.DATABASE_TYPE)
- **Writable Schema**: $($Config.SCHEMA_PRIMARY)
- **Read-Only Schemas**: $($Config.SCHEMA_READONLY)
- **Connection Key**: $($Config.CONNECTION_STRING_KEY)

### Infrastructure
- **API Base URL**: $($Config.API_BASE_URL)
- **Port**: $($Config.APP_PORT)
- **Real-time Technology**: $($Config.REALTIME_TECH)
- **UI Framework**: $($Config.UI_FRAMEWORK)

### Branch Strategy
- **Production Branch**: $($Config.PRODUCTION_BRANCH)
- **Development Branch**: $($Config.DEVELOPMENT_BRANCH)

### Tools
- **Analyzers**: $($Config.ANALYZER_TOOLS)
- **Testing**: $($Config.TEST_FRAMEWORK)
- **Package Manager**: $($Config.PACKAGE_MANAGER)

---

## Installed Components

### AI Agent System
✅ Core instruction files
✅ Agent prompt definitions
✅ Shared documentation
✅ Learning infrastructure

### Workspace Structure
✅ Copilot workspace (documentation, artifacts, configs)
✅ CodeQuality workspace (analysis tools)
✅ TEMP workspace (temporary files)

### Documentation
✅ Architecture.md
✅ InfrastructureQuickRef.md
✅ SystemIndex.md
✅ API Contract Validation
✅ Validation Framework
✅ Functionality Registry

---

## Next Steps

### 1. Verify Documentation
Review generated documentation in ``.github/instructions/Links/`` and update with project-specific details.

### 2. Configure Database
Update ``InfrastructureQuickRef.md`` with actual database connection details (keep secrets in config files, not documentation).

### 3. Start Using Agents
Try the question agent to explore available functionality:
``````
@workspace /question What agents are available?
``````

### 4. Customize Templates
Review and customize generated files to match your specific project needs.

### 5. Initialize Learning System
The learning system will populate automatically as you use the agents. Run your first task:
``````
@workspace /task key=setup tasks="Verify setup is complete"
``````

---

## Available Agents

### Task Agent (``/task``)
Execute features, bug fixes, and implementations

### Refactor Agent (``/refactor``)
Safe code quality improvements

### Sync Agent (``/sync``)
Keep documentation synchronized with code

### Healthcheck Agent (``/healthcheck``)
Validate system health

### Question Agent (``/question``)
Answer questions about the project

### Test Generation Agent (``/test``)
Generate comprehensive test suites

### Learning Analysis Agent (``/analyze-learning``)
Analyze patterns and generate insights

### Cohesion Review Agent (``/cohesion-review``)
Review code quality and architecture

---

## Support

For questions or issues:
1. Review ``SystemIndex.md`` for navigation
2. Check agent prompts in ``.github/prompts/``
3. Consult ``SelfAwareness.instructions.md`` for operating rules

---

**Setup completed successfully!**
"@

    if (!$DryRun) {
        $summaryPath = Join-Path $projectRoot "PROJECT-SETUP-SUMMARY.md"
        Set-Content -Path $summaryPath -Value $summary
        Write-Success "✅ Summary saved to: PROJECT-SETUP-SUMMARY.md"
    }
    
    return $summary
}

#endregion

#region Main Execution

try {
    # Step 1: Detect project type
    $detectedTypes = Detect-ProjectType
    
    # Step 2: Get configuration
    $config = Get-ProjectConfig -DetectedTypes $detectedTypes
    
    # Step 3: Show configuration summary
    Write-Info ""
    Write-Info "Configuration Summary"
    Write-Info "===================="
    foreach ($key in $config.Keys | Sort-Object) {
        Write-Host "  $key = $($config[$key])"
    }
    Write-Host ""
    
    # Step 4: Confirm
    $confirm = Read-Host "Proceed with setup? (Y/N) [Y]"
    if ($confirm -ne "" -and $confirm -ne "Y" -and $confirm -ne "y") {
        Write-Warning "Setup cancelled."
        exit 0
    }
    
    # Step 5: Process templates
    Process-Templates -Config $config
    
    # Step 6: Create workspace folders
    Create-WorkspaceFolders
    
    # Step 7: Generate summary
    $summary = Generate-SetupSummary -Config $config
    
    # Step 8: Final output
    Write-Host ""
    Write-Success "========================================"
    Write-Success " Setup Complete!"
    Write-Success "========================================"
    Write-Host ""
    Write-Info "Next Steps:"
    Write-Host "  1. Review PROJECT-SETUP-SUMMARY.md"
    Write-Host "  2. Update documentation with project-specific details"
    Write-Host "  3. Try: @workspace /question What agents are available?"
    Write-Host ""
    
} catch {
    Write-Error ""
    Write-Error "Setup failed with error:"
    Write-Error $_.Exception.Message
    Write-Error ""
    Write-Error "Stack Trace:"
    Write-Error $_.ScriptStackTrace
    exit 1
}

#endregion
