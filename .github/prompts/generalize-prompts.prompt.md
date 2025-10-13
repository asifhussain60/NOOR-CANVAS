---
mode: agent
---

## Role
You are the **Prompt Generalization Agent**.

---

## Parameters
- **output-dir** *(optional, default=`.github/prompts/_Portable`)*  
  Target directory for generic prompt/instruction files.
  Example: `.github/prompts/_Portable`

- **project-name** *(optional, default=`PROJECT_NAME`)*  
  Placeholder name to use in generic files.
  Example: `MY_PROJECT`, `YOUR_APP`

- **create-setup** *(optional, default=`true`)*  
  Create SETUP.BAT automation script.
  Options: `true`, `false`

- **include-history** *(optional, default=`false`)*  
  Include git history comments in generic files.
  Options: `true`, `false`

---

# generalize-prompts.prompt.md

## Purpose

### What
The **Prompt Generalization Agent** creates portable, generic versions of all prompts and instructions from NOOR CANVAS that can be adapted to any software project. It generates a complete self-bootstrapping system with a SETUP.BAT that automates the population of project-specific details.

### When to Use
- **Creating Portable Templates**: Generate generic versions for distribution
- **Project Scaffolding**: Create reusable prompt system for new projects
- **Documentation Export**: Share NOOR CANVAS prompt methodology with other teams
- **System Migration**: Move prompt infrastructure to different codebases

### How to Invoke
```
@workspace /generalize-prompts
@workspace /generalize-prompts output-dir=".github/prompts/_Portable" project-name="MY_APP"
@workspace /generalize-prompts create-setup=true include-history=false
```

### Integration with Other Agents
- **Reads From**: 
  - All files in `.github/prompts/` (8 prompts + 5 shared files)
  - All files in `.github/instructions/` (SelfAwareness + 10 Links files)
  - Project structure metadata (SPA, Tools, Tests, etc.)
- **Writes To**: 
  - `.github/prompts/_Portable/` - Generic prompts
  - `.github/prompts/_Portable/instructions/` - Generic instructions
  - `.github/prompts/_Portable/shared/` - Generic shared files
  - `.github/prompts/_Portable/SETUP.BAT` - Automation script
  - `.github/prompts/_Portable/README.md` - Usage guide

### Expected Outcomes
- **Complete Portable System**: All prompts/instructions genericized
- **Automated Setup**: SETUP.BAT handles project-specific population
- **Self-Documenting**: README.md explains setup and customization
- **Technology Agnostic**: Works with any tech stack after setup
- **Single Command Execution**: Run SETUP.BAT once to configure

---

## Execution Steps

### Step 0: Server Cleanup (Mandatory)
**See**: [Step 0: Server Cleanup](shared/step-0-server-cleanup.md)

Stop all running .NET servers to prevent lock conflicts:

```powershell
Get-Process -Name dotnet -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2
```

---

### Step 1: Checkpoint Commit
**See**: [Step 1: Checkpoint](shared/step-1-checkpoint.md)

Create checkpoint before generalization begins:

```bash
git add -A
git commit -m "checkpoint: pre-generalize-prompts" --allow-empty
```

---

### Step 2: Analyze Source Files
**Inventory all prompts and instructions to be generalized.**

#### 2.1. Scan Prompts Directory
```powershell
# DEBUG-WORKITEM:generalize:scan-prompts Inventory prompt files ;CLEANUP_OK
$promptFiles = Get-ChildItem ".github/prompts" -Recurse -Include *.md | 
               Where-Object { $_.FullName -notmatch '_Portable' }

Write-Host "📋 Prompt Files Discovered: $($promptFiles.Count)"
$promptFiles | ForEach-Object { Write-Host "  - $($_.Name)" }
```

**Expected Files**:
- `analyze-learning.prompt.md`
- `cohesion-review.prompt.md`
- `commit.prompt.md` (NEW)
- `healthcheck.prompt.md`
- `question.prompt.md`
- `refactor.prompt.md`
- `sync.prompt.md`
- `task.prompt.md`
- `test-generation.prompt.md`
- `shared/commit-message-format.md`
- `shared/debug-logging-mandate.md`
- `shared/step-0-server-cleanup.md`
- `shared/step-1-checkpoint.md`
- `shared/warning-handling-mandate.md`

#### 2.2. Scan Instructions Directory
```powershell
# DEBUG-WORKITEM:generalize:scan-instructions Inventory instruction files ;CLEANUP_OK
$instructionFiles = Get-ChildItem ".github/instructions" -Recurse -Include *.md, *.MD

Write-Host "📋 Instruction Files Discovered: $($instructionFiles.Count)"
$instructionFiles | ForEach-Object { Write-Host "  - $($_.Name)" }
```

**Expected Files**:
- `SelfAwareness.instructions.md`
- `Links/AnalyzerConfig.MD`
- `Links/API-Contract-Validation.md`
- `Links/Architecture.md`
- `Links/FunctionalityRegistry.md`
- `Links/InfrastructureQuickRef.md`
- `Links/PlaywrightConfig.MD`
- `Links/PlaywrightQuickRef.md`
- `Links/PlaywrightTestPaths.MD`
- `Links/SystemIndex.md`
- `Links/ValidationFramework.md`

**Total Files to Generalize**: ~24 files

---

### Step 3: Extract Project-Specific Patterns
**Identify all NOOR CANVAS-specific references that need genericization.**

#### 3.1. Build Replacement Dictionary
**Create mapping of specific → generic terms:**

```json
{
  "project_name": {
    "specific": "NOOR CANVAS",
    "generic": "{{PROJECT_NAME}}"
  },
  "solution_file": {
    "specific": "NoorCanvas.sln",
    "generic": "{{SOLUTION_FILE}}"
  },
  "main_project": {
    "specific": "SPA/NoorCanvas",
    "generic": "{{MAIN_PROJECT_PATH}}"
  },
  "database_name": {
    "specific": "KSESSIONS_DEV",
    "generic": "{{DATABASE_NAME}}"
  },
  "database_server": {
    "specific": "AHHOME",
    "generic": "{{DATABASE_SERVER}}"
  },
  "connection_string_key": {
    "specific": "DefaultConnection",
    "generic": "{{CONNECTION_STRING_KEY}}"
  },
  "base_url": {
    "specific": "https://localhost:9091",
    "generic": "{{BASE_URL}}"
  },
  "test_session_id": {
    "specific": "212",
    "generic": "{{TEST_SESSION_ID}}"
  },
  "test_host_token": {
    "specific": "PQ9N5YWW",
    "generic": "{{TEST_HOST_TOKEN}}"
  },
  "test_user_token": {
    "specific": "KJAHA99L",
    "generic": "{{TEST_USER_TOKEN}}"
  },
  "signalr_hubs": {
    "specific": ["QuestionHub", "BroadcastHub", "SessionHub"],
    "generic": ["{{HUB_1}}", "{{HUB_2}}", "{{HUB_3}}"]
  },
  "controllers": {
    "specific": ["QuestionController", "SessionController", "HostControlPanelController"],
    "generic": ["{{CONTROLLER_1}}", "{{CONTROLLER_2}}", "{{CONTROLLER_3}}"]
  },
  "pages": {
    "specific": ["SessionCanvas.razor", "HostControlPanel.razor", "UserLanding.razor"],
    "generic": ["{{PAGE_1}}", "{{PAGE_2}}", "{{PAGE_3}}"]
  },
  "schemas": {
    "specific": {
      "read_write": "canvas.*",
      "read_only": "dbo.*"
    },
    "generic": {
      "read_write": "{{SCHEMA_READ_WRITE}}",
      "read_only": "{{SCHEMA_READ_ONLY}}"
    }
  },
  "tech_stack": {
    "specific": {
      "frontend": "Blazor Server",
      "backend": "ASP.NET Core 8.0",
      "database": "SQL Server",
      "realtime": "SignalR",
      "testing": "Playwright"
    },
    "generic": {
      "frontend": "{{FRONTEND_FRAMEWORK}}",
      "backend": "{{BACKEND_FRAMEWORK}}",
      "database": "{{DATABASE_TYPE}}",
      "realtime": "{{REALTIME_TECH}}",
      "testing": "{{TESTING_FRAMEWORK}}"
    }
  },
  "workspace_paths": {
    "specific": {
      "root": "D:\\PROJECTS\\NOOR CANVAS",
      "scripts": "Scripts/",
      "tests": "Tests/UI",
      "tools": "Tools/HostProvisioner"
    },
    "generic": {
      "root": "{{WORKSPACE_ROOT}}",
      "scripts": "{{SCRIPTS_PATH}}",
      "tests": "{{TESTS_PATH}}",
      "tools": "{{TOOLS_PATH}}"
    }
  },
  "external_dependencies": {
    "specific": ["DocFX", "Roslynator", "StyleCop", "ESLint"],
    "generic": ["{{DOC_GENERATOR}}", "{{CODE_ANALYZER_1}}", "{{CODE_ANALYZER_2}}", "{{LINTER}}"]
  }
}
```

#### 3.2. Identify Context-Specific Sections
**Mark sections that require complete rewrite:**

- **Database Schema Rules**: Entire section needs project-specific schema definitions
- **API Endpoint Catalog**: Complete rewrite with actual project endpoints
- **SignalR Hub Documentation**: Replace with actual hub names and methods
- **Playwright Test Paths**: Replace Session 212 data with project test data
- **Architecture.md**: Complete application architecture (controllers, services, pages)
- **InfrastructureQuickRef.md**: Entire infrastructure reference

**Strategy**: For these sections, insert placeholder comments:
```markdown
<!-- SETUP_REQUIRED: Replace this section with your project's [specific content type] -->
<!-- See SETUP.BAT Step X for automated population -->
```

---

### Step 4: Create _Portable Directory Structure
**Prepare output directory and subdirectories.**

```powershell
# DEBUG-WORKITEM:generalize:create-structure Create _Portable directory structure ;CLEANUP_OK
$portableRoot = ".github/prompts/_Portable"

# Delete existing _Portable directory if exists
if (Test-Path $portableRoot) {
    Remove-Item $portableRoot -Recurse -Force
    Write-Host "✓ Deleted existing _Portable directory"
}

# Create fresh directory structure
New-Item -ItemType Directory -Path "$portableRoot" -Force | Out-Null
New-Item -ItemType Directory -Path "$portableRoot/instructions" -Force | Out-Null
New-Item -ItemType Directory -Path "$portableRoot/instructions/Links" -Force | Out-Null
New-Item -ItemType Directory -Path "$portableRoot/shared" -Force | Out-Null

Write-Host "✓ Created fresh _Portable directory structure"
```

**Expected Structure**:
```
.github/prompts/_Portable/
├── README.md (usage guide)
├── SETUP.BAT (automation script)
├── shared/
│   ├── commit-message-format.md
│   ├── debug-logging-mandate.md
│   ├── step-0-server-cleanup.md
│   ├── step-1-checkpoint.md
│   └── warning-handling-mandate.md
├── instructions/
│   ├── SelfAwareness.instructions.md
│   └── Links/
│       ├── AnalyzerConfig.MD
│       ├── API-Contract-Validation.md
│       ├── Architecture.md
│       ├── FunctionalityRegistry.md
│       ├── InfrastructureQuickRef.md
│       ├── PlaywrightConfig.MD
│       ├── PlaywrightQuickRef.md
│       ├── PlaywrightTestPaths.MD
│       ├── SystemIndex.md
│       └── ValidationFramework.md
├── analyze-learning.prompt.md
├── cohesion-review.prompt.md
├── commit.prompt.md
├── healthcheck.prompt.md
├── question.prompt.md
├── refactor.prompt.md
├── sync.prompt.md
├── task.prompt.md
└── test-generation.prompt.md
```

---

### Step 5: Generalize Prompt Files
**Apply genericization to all prompt files.**

#### 5.1. Process Each Prompt File
**For each prompt in `.github/prompts/`:**

```powershell
# DEBUG-WORKITEM:generalize:process-prompts Apply genericization to prompts ;CLEANUP_OK
foreach ($promptFile in $promptFiles) {
    $content = Get-Content $promptFile.FullName -Raw
    
    # Apply all replacements from dictionary (Step 3.1)
    $genericContent = $content
    foreach ($pattern in $replacementDictionary.GetEnumerator()) {
        $genericContent = $genericContent -replace $pattern.specific, $pattern.generic
    }
    
    # Add header comment
    $header = @"
<!--
GENERIC PROMPT TEMPLATE - Portable Version
Source: $($promptFile.Name)
Generated: $(Get-Date -Format 'yyyy-MM-dd')

SETUP REQUIRED: Run SETUP.BAT to populate project-specific values.
All {{PLACEHOLDER}} tokens must be replaced with actual values.
-->

"@
    
    $genericContent = $header + $genericContent
    
    # Write to _Portable directory
    $outputPath = Join-Path $portableRoot $promptFile.Name
    Set-Content -Path $outputPath -Value $genericContent
    
    Write-Host "✓ Generalized: $($promptFile.Name)"
}
```

#### 5.2. Handle Special Cases
**Prompts requiring additional modifications:**

- **task.prompt.md**: 
  - Replace Core Mandates section with placeholder
  - Keep workflow structure intact
  - Add SETUP_REQUIRED markers for database rules
  
- **test-generation.prompt.md**:
  - Replace Session 212 data with {{TEST_SESSION_ID}}, etc.
  - Keep test generation patterns
  
- **sync.prompt.md**:
  - Keep sync logic, genericize file paths
  
- **commit.prompt.md** (NEW):
  - Keep orchestration logic intact
  - Genericize agent references if needed

---

### Step 6: Generalize Instruction Files
**Apply genericization to all instruction files.**

#### 6.1. Process SelfAwareness.instructions.md
**Most critical file - requires careful generalization:**

```powershell
# DEBUG-WORKITEM:generalize:process-selfawareness Generalize SelfAwareness ;CLEANUP_OK
$selfAwareness = Get-Content ".github/instructions/SelfAwareness.instructions.md" -Raw

# Replace database-specific sections
$selfAwareness = $selfAwareness -replace 'KSESSIONS_DEV', '{{DATABASE_NAME}}'
$selfAwareness = $selfAwareness -replace 'AHHOME', '{{DATABASE_SERVER}}'
$selfAwareness = $selfAwareness -replace 'canvas\.\*', '{{SCHEMA_READ_WRITE}}'
$selfAwareness = $selfAwareness -replace 'dbo\.\*', '{{SCHEMA_READ_ONLY}}'

# Add database schema setup marker
$dbSection = @"
## 🗄️ Database Access Rules (MANDATORY)

<!-- SETUP_REQUIRED: Define your project's database schema access rules -->
<!-- Run SETUP.BAT to populate database connection details and schema rules -->

**PRIMARY DATABASE: {{DATABASE_NAME}}**
- Server: {{DATABASE_SERVER}}
- Connection: Always use ``_configuration.GetConnectionString("{{CONNECTION_STRING_KEY}}")``

**SCHEMA ACCESS CONTROL**:
- ✅ **``{{SCHEMA_READ_WRITE}}``**: READ-WRITE allowed
  - [List your read-write tables here]
  
- ❌ **``{{SCHEMA_READ_ONLY}}``**: **READ-ONLY ONLY**
  - [List your read-only tables here]

<!-- END SETUP_REQUIRED -->
"@

# Replace existing database section
$selfAwareness = $selfAwareness -replace '## 🗄️ Database Access Rules.*?(?=##)', $dbSection

Set-Content -Path "$portableRoot/instructions/SelfAwareness.instructions.md" -Value $selfAwareness
Write-Host "✓ Generalized: SelfAwareness.instructions.md"
```

#### 6.2. Process Links Files
**For each file in `.github/instructions/Links/`:**

```powershell
# DEBUG-WORKITEM:generalize:process-links Generalize Links files ;CLEANUP_OK
foreach ($linkFile in $instructionFiles | Where-Object { $_.Directory.Name -eq 'Links' }) {
    $content = Get-Content $linkFile.FullName -Raw
    
    # Apply replacements
    $genericContent = $content
    foreach ($pattern in $replacementDictionary.GetEnumerator()) {
        $genericContent = $genericContent -replace [regex]::Escape($pattern.specific), $pattern.generic
    }
    
    # Add markers for content-heavy files
    if ($linkFile.Name -in @('Architecture.md', 'InfrastructureQuickRef.md', 'PlaywrightTestPaths.MD')) {
        $setupMarker = @"

<!-- SETUP_REQUIRED: This file requires complete rewrite with your project's architecture -->
<!-- Run SETUP.BAT and follow prompts to analyze your codebase and populate this file -->
<!-- The automation will:
  1. Scan your project structure
  2. Inventory controllers, services, pages
  3. Extract API endpoints from your code
  4. Document SignalR hubs (if applicable)
  5. Generate canonical test data
-->

"@
        $genericContent = $setupMarker + $genericContent
    }
    
    Set-Content -Path "$portableRoot/instructions/Links/$($linkFile.Name)" -Value $genericContent
    Write-Host "✓ Generalized: Links/$($linkFile.Name)"
}
```

---

### Step 7: Generalize Shared Files
**Process shared files in prompts/shared/.**

```powershell
# DEBUG-WORKITEM:generalize:process-shared Generalize shared files ;CLEANUP_OK
$sharedFiles = Get-ChildItem ".github/prompts/shared" -Include *.md

foreach ($sharedFile in $sharedFiles) {
    $content = Get-Content $sharedFile.FullName -Raw
    
    # Apply replacements (most shared files are already generic)
    $genericContent = $content -replace 'NOOR CANVAS', '{{PROJECT_NAME}}'
    
    # Special handling for step-0-server-cleanup.md
    if ($sharedFile.Name -eq 'step-0-server-cleanup.md') {
        $genericContent = $genericContent -replace 'dotnet', '{{SERVER_PROCESS_NAME}}'
        $genericContent = $genericContent -replace 'Kestrel', '{{SERVER_NAME}}'
        $genericContent = $genericContent -replace '9091', '{{SERVER_PORT}}'
    }
    
    Set-Content -Path "$portableRoot/shared/$($sharedFile.Name)" -Value $genericContent
    Write-Host "✓ Generalized: shared/$($sharedFile.Name)"
}
```

---

### Step 8: Create SETUP.BAT Automation Script
**Generate self-bootstrapping setup script.**

```powershell
# DEBUG-WORKITEM:generalize:create-setup Create SETUP.BAT automation ;CLEANUP_OK
$setupScript = @'
@echo off
REM ============================================================================
REM NOOR CANVAS Portable Prompts System - Setup Automation
REM ============================================================================
REM This script automates the population of project-specific values in generic
REM prompt and instruction files. It replaces {{PLACEHOLDER}} tokens with actual
REM values from your project.
REM
REM Generated: {{GENERATION_DATE}}
REM ============================================================================

echo.
echo ========================================================================
echo  NOOR CANVAS Portable Prompts System - Setup
echo ========================================================================
echo.
echo This setup will populate project-specific values in all prompt files.
echo.

REM Step 1: Collect Project Information
echo Step 1: Collecting Project Information
echo ----------------------------------------
set /p PROJECT_NAME="Enter project name (e.g., My Project): "
set /p SOLUTION_FILE="Enter solution file name (e.g., MyProject.sln): "
set /p MAIN_PROJECT_PATH="Enter main project path (e.g., src/MyProject): "
set /p WORKSPACE_ROOT="Enter workspace root path (e.g., C:\Projects\MyProject): "
echo.

REM Step 2: Collect Database Information
echo Step 2: Collecting Database Information
echo ----------------------------------------
set /p DATABASE_TYPE="Enter database type (e.g., SQL Server, PostgreSQL, MySQL): "
set /p DATABASE_NAME="Enter database name: "
set /p DATABASE_SERVER="Enter database server: "
set /p CONNECTION_STRING_KEY="Enter connection string key (default: DefaultConnection): "
if "%CONNECTION_STRING_KEY%"=="" set CONNECTION_STRING_KEY=DefaultConnection
echo.

REM Step 3: Collect Tech Stack Information
echo Step 3: Collecting Tech Stack Information
echo ----------------------------------------
set /p FRONTEND_FRAMEWORK="Enter frontend framework (e.g., Blazor, React, Angular): "
set /p BACKEND_FRAMEWORK="Enter backend framework (e.g., ASP.NET Core, Node.js): "
set /p TESTING_FRAMEWORK="Enter testing framework (e.g., Playwright, Selenium): "
echo.

REM Step 4: Collect Schema Rules
echo Step 4: Defining Database Schema Access Rules
echo ----------------------------------------
set /p SCHEMA_READ_WRITE="Enter READ-WRITE schema pattern (e.g., app.*): "
set /p SCHEMA_READ_ONLY="Enter READ-ONLY schema pattern (e.g., dbo.*): "
echo.

REM Step 5: Collect Test Configuration
echo Step 5: Collecting Test Configuration
echo ----------------------------------------
set /p BASE_URL="Enter base URL for testing (e.g., https://localhost:5001): "
set /p TEST_SESSION_ID="Enter test session ID (e.g., 1): "
set /p TEST_HOST_TOKEN="Enter test host token (e.g., ABCD1234): "
set /p TEST_USER_TOKEN="Enter test user token (e.g., EFGH5678): "
echo.

REM Step 6: Replace Placeholders in All Files
echo Step 6: Populating Files with Collected Values
echo ----------------------------------------
echo Processing prompt files...

REM Use PowerShell for robust string replacement
powershell -Command ^
    "$files = Get-ChildItem -Path '.' -Include *.md,*.MD -Recurse; " ^
    "$replacements = @{ " ^
    "    '{{PROJECT_NAME}}' = '%PROJECT_NAME%'; " ^
    "    '{{SOLUTION_FILE}}' = '%SOLUTION_FILE%'; " ^
    "    '{{MAIN_PROJECT_PATH}}' = '%MAIN_PROJECT_PATH%'; " ^
    "    '{{WORKSPACE_ROOT}}' = '%WORKSPACE_ROOT%'; " ^
    "    '{{DATABASE_TYPE}}' = '%DATABASE_TYPE%'; " ^
    "    '{{DATABASE_NAME}}' = '%DATABASE_NAME%'; " ^
    "    '{{DATABASE_SERVER}}' = '%DATABASE_SERVER%'; " ^
    "    '{{CONNECTION_STRING_KEY}}' = '%CONNECTION_STRING_KEY%'; " ^
    "    '{{FRONTEND_FRAMEWORK}}' = '%FRONTEND_FRAMEWORK%'; " ^
    "    '{{BACKEND_FRAMEWORK}}' = '%BACKEND_FRAMEWORK%'; " ^
    "    '{{TESTING_FRAMEWORK}}' = '%TESTING_FRAMEWORK%'; " ^
    "    '{{SCHEMA_READ_WRITE}}' = '%SCHEMA_READ_WRITE%'; " ^
    "    '{{SCHEMA_READ_ONLY}}' = '%SCHEMA_READ_ONLY%'; " ^
    "    '{{BASE_URL}}' = '%BASE_URL%'; " ^
    "    '{{TEST_SESSION_ID}}' = '%TEST_SESSION_ID%'; " ^
    "    '{{TEST_HOST_TOKEN}}' = '%TEST_HOST_TOKEN%'; " ^
    "    '{{TEST_USER_TOKEN}}' = '%TEST_USER_TOKEN%' " ^
    "}; " ^
    "foreach ($file in $files) { " ^
    "    $content = Get-Content $file.FullName -Raw; " ^
    "    foreach ($key in $replacements.Keys) { " ^
    "        $content = $content -replace [regex]::Escape($key), $replacements[$key]; " ^
    "    } " ^
    "    Set-Content -Path $file.FullName -Value $content; " ^
    "    Write-Host \"Processed: $($file.Name)\"; " ^
    "}"

echo.
echo ✓ All files populated successfully
echo.

REM Step 7: Trigger GitHub Copilot Analysis
echo Step 7: Instructing GitHub Copilot to Review Infrastructure
echo ----------------------------------------
echo.
echo IMPORTANT: The final step requires GitHub Copilot to review your project
echo infrastructure and update the following files with project-specific details:
echo.
echo   - instructions/Links/Architecture.md
echo   - instructions/Links/InfrastructureQuickRef.md
echo   - instructions/Links/PlaywrightTestPaths.MD
echo.
echo To complete setup, open this folder in VS Code and run the following command:
echo.
echo   @workspace Please review the following and update all instruction and prompt files:
echo     - Project structure and folder organization
echo     - Technology stack (frameworks, libraries, NuGet/npm packages)
echo     - Database connection strings and schema definitions
echo     - API endpoints (controllers and routes)
echo     - SignalR hubs (if applicable)
echo     - Razor pages and components
echo     - Service architecture
echo     - External dependencies
echo     - Test configuration and canonical test data
echo.
echo Press any key to open instructions for Copilot analysis...
pause > nul

REM Create Copilot instruction file
echo @workspace Please review the infrastructure of %PROJECT_NAME% and update all instruction and prompt files appropriately. > COPILOT_REVIEW_INSTRUCTIONS.txt
echo. >> COPILOT_REVIEW_INSTRUCTIONS.txt
echo Analyze the following: >> COPILOT_REVIEW_INSTRUCTIONS.txt
echo - Project structure: %MAIN_PROJECT_PATH% >> COPILOT_REVIEW_INSTRUCTIONS.txt
echo - Technology stack: %FRONTEND_FRAMEWORK% frontend, %BACKEND_FRAMEWORK% backend >> COPILOT_REVIEW_INSTRUCTIONS.txt
echo - Database: %DATABASE_TYPE% (%DATABASE_NAME% on %DATABASE_SERVER%) >> COPILOT_REVIEW_INSTRUCTIONS.txt
echo - Testing: %TESTING_FRAMEWORK% with base URL %BASE_URL% >> COPILOT_REVIEW_INSTRUCTIONS.txt
echo. >> COPILOT_REVIEW_INSTRUCTIONS.txt
echo Update the following files with project-specific details: >> COPILOT_REVIEW_INSTRUCTIONS.txt
echo 1. instructions/Links/Architecture.md - Document all controllers, services, pages, DTOs, SignalR hubs >> COPILOT_REVIEW_INSTRUCTIONS.txt
echo 2. instructions/Links/InfrastructureQuickRef.md - API endpoints, database schemas, external dependencies >> COPILOT_REVIEW_INSTRUCTIONS.txt
echo 3. instructions/Links/PlaywrightTestPaths.MD - Canonical test data for Session %TEST_SESSION_ID% >> COPILOT_REVIEW_INSTRUCTIONS.txt
echo 4. instructions/SelfAwareness.instructions.md - Verify database schema access rules are correct >> COPILOT_REVIEW_INSTRUCTIONS.txt

echo.
echo ✓ Created COPILOT_REVIEW_INSTRUCTIONS.txt
echo.
echo ========================================================================
echo  Setup Complete!
echo ========================================================================
echo.
echo Next steps:
echo   1. Review COPILOT_REVIEW_INSTRUCTIONS.txt
echo   2. Copy the command and paste into GitHub Copilot in VS Code
echo   3. Wait for Copilot to analyze and update all files
echo   4. Review updated files and commit changes
echo.
echo Press any key to exit...
pause > nul
'@

# Replace {{GENERATION_DATE}} placeholder
$setupScript = $setupScript -replace '{{GENERATION_DATE}}', (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

Set-Content -Path "$portableRoot/SETUP.BAT" -Value $setupScript
Write-Host "✓ Created: SETUP.BAT"
```

---

### Step 9: Create README.md Usage Guide
**Document setup process and usage patterns.**

```powershell
# DEBUG-WORKITEM:generalize:create-readme Create README.md usage guide ;CLEANUP_OK
$readme = @'
# NOOR CANVAS Portable Prompts System

## Overview
This directory contains generic, portable versions of all prompts and instructions from the NOOR CANVAS project. These files can be adapted to any software project by running the automated setup script.

## What's Included
- **8 Prompt Files**: Complete agent ecosystem (task, question, refactor, sync, etc.)
- **11 Instruction Files**: SelfAwareness + 10 Links documentation files
- **5 Shared Files**: Common prompt components (debug logging, checkpoints, etc.)
- **SETUP.BAT**: Automated setup script for project-specific population
- **README.md**: This file

## Quick Start

### 1. Copy _Portable Folder
Copy this entire `_Portable` folder to your project:
```bash
cp -r .github/prompts/_Portable /path/to/your/project/.github/prompts
```

### 2. Run SETUP.BAT
Navigate to the copied folder and run the setup script:
```bash
cd .github/prompts/_Portable
SETUP.BAT
```

### 3. Follow Setup Wizard
The script will prompt you for:
- Project name and structure
- Database configuration (type, server, name, schemas)
- Technology stack (frontend, backend, testing frameworks)
- Test configuration (base URL, canonical test data)

### 4. Review Generated Files
After SETUP.BAT completes, review the populated files:
- All `{{PLACEHOLDER}}` tokens replaced with your values
- Database schema rules customized
- Test configuration populated

### 5. Run GitHub Copilot Review
Open the folder in VS Code and run the command from `COPILOT_REVIEW_INSTRUCTIONS.txt`:
```
@workspace Please review the infrastructure of [YOUR_PROJECT] and update all instruction and prompt files appropriately.

Analyze:
- Project structure and folder organization
- Technology stack (frameworks, libraries, packages)
- Database connection strings and schemas
- API endpoints (controllers, routes)
- SignalR hubs (if applicable)
- Service architecture
- Test configuration

Update these files with project-specific details:
1. instructions/Links/Architecture.md
2. instructions/Links/InfrastructureQuickRef.md
3. instructions/Links/PlaywrightTestPaths.MD
4. instructions/SelfAwareness.instructions.md
```

### 6. Verify and Commit
Review Copilot's updates, make any necessary adjustments, and commit the customized prompt system to your repository.

## File Structure
```
_Portable/
├── README.md                              # This file
├── SETUP.BAT                              # Automated setup script
├── COPILOT_REVIEW_INSTRUCTIONS.txt        # Created by SETUP.BAT
├── shared/                                # Common prompt components
│   ├── commit-message-format.md
│   ├── debug-logging-mandate.md
│   ├── step-0-server-cleanup.md
│   ├── step-1-checkpoint.md
│   └── warning-handling-mandate.md
├── instructions/                          # Global operating rules
│   ├── SelfAwareness.instructions.md
│   └── Links/                            # Reference documentation
│       ├── AnalyzerConfig.MD
│       ├── API-Contract-Validation.md
│       ├── Architecture.md
│       ├── FunctionalityRegistry.md
│       ├── InfrastructureQuickRef.md
│       ├── PlaywrightConfig.MD
│       ├── PlaywrightQuickRef.md
│       ├── PlaywrightTestPaths.MD
│       ├── SystemIndex.md
│       └── ValidationFramework.md
├── analyze-learning.prompt.md             # Self-learning analysis agent
├── cohesion-review.prompt.md              # Prompt system auditor
├── commit.prompt.md                       # Commit orchestrator
├── healthcheck.prompt.md                  # System health validator
├── question.prompt.md                     # Answer engine
├── refactor.prompt.md                     # Code refactoring agent
├── sync.prompt.md                         # Synchronization agent
├── task.prompt.md                         # Task executor (main agent)
└── test-generation.prompt.md              # Playwright test generator
```

## Customization Requirements

### Critical Files Requiring Manual Updates
After running SETUP.BAT, these files need detailed project-specific content:

1. **Architecture.md**
   - Document all controllers and API endpoints
   - List all services with responsibilities
   - Catalog Razor pages and components
   - Document SignalR hubs (if applicable)
   - Define data models and DTOs

2. **InfrastructureQuickRef.md**
   - Complete API endpoint catalog with routes
   - Database schema documentation
   - External dependencies and integrations
   - SignalR hub methods and events
   - Canonical test data (Session IDs, tokens)

3. **PlaywrightTestPaths.MD**
   - Define canonical test session data
   - Document test user accounts and tokens
   - Specify test URLs and endpoints
   - Provide proven test patterns

### Files That Auto-Populate
These files are fully populated by SETUP.BAT:
- SelfAwareness.instructions.md (database rules)
- All prompt files (project name, paths, URLs)
- Shared files (server cleanup, checkpoints)

## Agent Ecosystem

### Core Agents
- **task**: Main execution engine for feature implementation and bug fixes
- **question**: Answer engine for technical queries
- **refactor**: Code quality and refactoring agent
- **sync**: Documentation and configuration synchronization
- **healthcheck**: System validation and integrity checks

### Workflow Agents
- **commit**: Orchestrates cohesion-review → sync → analyze-learning → commit → push
- **test-generation**: Automated Playwright test creation
- **cohesion-review**: Prompt system auditor
- **analyze-learning**: Pattern extraction and learning agent

### Usage Patterns
```bash
# Execute a task
@workspace /task key=feature tasks="Implement new feature"

# Ask a question
@workspace /question query="How does authentication work?"

# Refactor code
@workspace /refactor key=cleanup scope=service target="UserService.cs"

# Run health check
@workspace /healthcheck scope=api

# Commit workflow
@workspace /commit key=feature
```

## Maintenance

### Updating Prompts
1. Make changes to prompt files in `.github/prompts/`
2. Run cohesion-review to validate changes
3. Run sync to update documentation
4. Commit changes with proper message format

### Learning System
The analyze-learning agent extracts patterns from completed work:
```bash
@workspace /analyze-learning scope=recent analysis-type=comprehensive
```

### Cohesion Validation
Run cohesion-review periodically to ensure prompt system health:
```bash
@workspace /cohesion-review key=system verbosity=detailed
```

## Requirements
- GitHub Copilot (for initial setup and ongoing usage)
- Git (for version control and commit workflow)
- PowerShell (for SETUP.BAT automation)
- Your project's technology stack (as configured in setup)

## Support
This portable prompt system is derived from NOOR CANVAS. For questions or issues:
1. Review the comprehensive documentation in `instructions/Links/`
2. Check prompt file headers for usage guidance
3. Consult the original NOOR CANVAS project for reference implementations

## License
[Specify your license here]

## Credits
Portable Prompts System derived from NOOR CANVAS project.
Generated: {{GENERATION_DATE}}
'@

$readme = $readme -replace '{{GENERATION_DATE}}', (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

Set-Content -Path "$portableRoot/README.md" -Value $readme
Write-Host "✓ Created: README.md"
```

---

### Step 10: Validate Generated Files
**Verify all files created successfully and are well-formed.**

```powershell
# DEBUG-WORKITEM:generalize:validate Validate generated files ;CLEANUP_OK
$expectedFiles = @(
    'README.md',
    'SETUP.BAT',
    'analyze-learning.prompt.md',
    'cohesion-review.prompt.md',
    'commit.prompt.md',
    'healthcheck.prompt.md',
    'question.prompt.md',
    'refactor.prompt.md',
    'sync.prompt.md',
    'task.prompt.md',
    'test-generation.prompt.md',
    'shared/commit-message-format.md',
    'shared/debug-logging-mandate.md',
    'shared/step-0-server-cleanup.md',
    'shared/step-1-checkpoint.md',
    'shared/warning-handling-mandate.md',
    'instructions/SelfAwareness.instructions.md',
    'instructions/Links/AnalyzerConfig.MD',
    'instructions/Links/API-Contract-Validation.md',
    'instructions/Links/Architecture.md',
    'instructions/Links/FunctionalityRegistry.md',
    'instructions/Links/InfrastructureQuickRef.md',
    'instructions/Links/PlaywrightConfig.MD',
    'instructions/Links/PlaywrightQuickRef.md',
    'instructions/Links/PlaywrightTestPaths.MD',
    'instructions/Links/SystemIndex.md',
    'instructions/Links/ValidationFramework.md'
)

$missingFiles = @()
foreach ($file in $expectedFiles) {
    $filePath = Join-Path $portableRoot $file
    if (-not (Test-Path $filePath)) {
        $missingFiles += $file
    }
}

if ($missingFiles.Count -eq 0) {
    Write-Host "`n✅ All $($expectedFiles.Count) files created successfully" -ForegroundColor Green
} else {
    Write-Host "`n❌ Missing files detected:" -ForegroundColor Red
    $missingFiles | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    exit 1
}

# Verify no specific NOOR CANVAS references remain (sample check)
$sampleFile = Get-Content "$portableRoot/task.prompt.md" -Raw
if ($sampleFile -match 'KSESSIONS_DEV' -or $sampleFile -match 'PQ9N5YWW') {
    Write-Host "⚠ Warning: Specific NOOR CANVAS references detected in generic files" -ForegroundColor Yellow
}
```

---

### Step 11: Summary Report
**Provide comprehensive generation summary.**

```
✅ Generalization Complete

📋 Generation Summary:
- **Source Files Processed**: 24 (8 prompts, 11 instructions, 5 shared)
- **Generic Files Created**: 24 (100% coverage)
- **Output Directory**: .github/prompts/_Portable
- **Total Size**: {X} KB
- **Placeholders Created**: 15+ {{PLACEHOLDER}} tokens
- **Automation Script**: SETUP.BAT (complete)
- **Documentation**: README.md (comprehensive)

🎯 Generalization Details:
- Project-specific values: Replaced with {{PLACEHOLDERS}}
- Database references: Genericized (KSESSIONS_DEV → {{DATABASE_NAME}})
- API endpoints: Marked for project-specific population
- Test data: Replaced with generic tokens
- File paths: Converted to relative/generic patterns
- Tech stack: Framework-agnostic placeholders

📦 Deliverables:
✓ Generic prompt files (8)
✓ Generic instruction files (11)
✓ Generic shared files (5)
✓ SETUP.BAT automation script
✓ README.md usage guide
✓ Directory structure preserved

🚀 Next Steps for Users:
1. Copy _Portable folder to target project
2. Run SETUP.BAT and provide project details
3. Review COPILOT_REVIEW_INSTRUCTIONS.txt
4. Run Copilot analysis to populate Architecture.md, InfrastructureQuickRef.md
5. Verify and commit customized prompt system

🔍 Validation:
✓ All expected files created
✓ Directory structure intact
✓ SETUP.BAT validated
✓ README.md comprehensive
✓ No NOOR CANVAS-specific references in generic files
```

---

## Guardrails
- **ALWAYS delete existing _Portable directory** before creating new one (Step 4)
- **ALWAYS preserve directory structure** (prompts/shared/, instructions/Links/)
- **ALWAYS create SETUP.BAT** - this is the critical automation piece
- **NEVER commit project-specific values** to generic files
- **ALWAYS validate placeholder replacement** in generated files
- **ALWAYS create README.md** with comprehensive setup instructions
- If file count doesn't match expected (24 files), abort and report error

---

## Clean Exit Guarantee
At the end of generalization:
- All 24 files must exist in _Portable directory
- SETUP.BAT must be executable and well-formed
- README.md must be comprehensive and accurate
- No NOOR CANVAS-specific references in generic files (except examples)
- Directory structure must match source structure
- All {{PLACEHOLDER}} tokens must be documented in README.md

If any of these conditions fail, the workflow must report failure and provide remediation steps.
