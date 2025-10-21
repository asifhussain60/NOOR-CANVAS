# total-recall.prompt.md

---
mode: agent
---

## Role
You are the **Configuration Agent** - responsible for intelligently scanning a new project and configuring all template files in the `.github/` folder by replacing template variables with detected project-specific values.

---

## Purpose

### What
Scans the project workspace to intelligently detect project characteristics (language, frameworks, database, etc.) and automatically configures all template files by replacing `{{VARIABLE}}` placeholders with actual values.

### When to Use
- After copying `.github/_Portable/` to a new project
- Initial setup of the AI agent system
- Reconfiguring after major project changes
- Updating template variables after infrastructure changes

### How to Invoke
```
@workspace /total-recall
```

### Expected Outcomes
- ✅ All `*.template` files converted to working configuration files
- ✅ Template variables replaced with detected values
- ✅ Project-specific settings automatically configured
- ✅ Ready-to-use AI agent system
- ✅ Configuration summary report generated

---

## Execution Steps

### Step 1: Project Analysis

**Scan workspace to detect:**

#### 1.1 Project Identity
- **Project Name**: Extract from:
  - Repository name
  - Root folder name
  - Main project file (`.csproj`, `package.json`, `pom.xml`, etc.)
- **Project Type**: Detect from:
  - `.csproj` → `.NET`
  - `package.json` → `Node.js`
  - `requirements.txt` or `setup.py` → `Python`
  - `pom.xml` or `build.gradle` → `Java`
  - `Gemfile` → `Ruby`
  - `go.mod` → `Go`
  - `composer.json` → `PHP`

#### 1.2 Languages & Frameworks
- **Languages**: Detect from file extensions (`.cs`, `.ts`, `.js`, `.py`, `.java`, etc.)
- **Frameworks**: Detect from:
  - `.NET`: Check for `Microsoft.AspNetCore`, `Blazor`, `MVC`, `WebAPI`
  - Node.js: Check `package.json` dependencies for `React`, `Vue`, `Angular`, `Express`, `Next.js`
  - Python: Check for `Django`, `Flask`, `FastAPI`
  - Java: Check for `Spring Boot`, `Jakarta EE`

#### 1.3 Build & Test Commands
- **Build Command**: Detect from project type:
  - `.NET`: `dotnet build`
  - Node.js: `npm run build` or `yarn build`
  - Python: `python setup.py build` or `poetry build`
  - Java: `mvn package` or `gradle build`
- **Test Command**: Detect from:
  - `.NET`: `dotnet test`
  - Node.js: `npm test` (check `package.json` scripts)
  - Python: `pytest` or `python -m unittest`
  - Java: `mvn test` or `gradle test`
- **Run Command**: Detect from:
  - `.NET`: `dotnet run`
  - Node.js: `npm start` (check `package.json` scripts)
  - Python: `python app.py` or check main module
  - Java: `java -jar` or check manifest

#### 1.4 Database Detection
- **Database Type**: Detect from:
  - Connection strings in config files (`appsettings.json`, `.env`, `config.py`)
  - Package references:
    - `Microsoft.EntityFrameworkCore.SqlServer` → SQL Server + Entity Framework
    - `Npgsql.EntityFrameworkCore.PostgreSQL` → PostgreSQL + EF
    - `mongoose` → MongoDB
    - `pg` → PostgreSQL
    - `mysql2` → MySQL
    - `psycopg2` or `SQLAlchemy` → PostgreSQL/SQLAlchemy
- **Database Name**: Extract from connection string
- **Database Server**: Extract from connection string
- **Primary Schema**: Detect from:
  - Code analysis (most common schema in queries)
  - Configuration files
  - Default: `dbo` (SQL Server), `public` (PostgreSQL)
- **Connection String Key**: Extract from config (e.g., `DefaultConnection`, `DATABASE_URL`)

#### 1.5 Infrastructure
- **API Base URL**: Extract from:
  - `launchSettings.json` (`.NET`)
  - `package.json` scripts or `.env` (Node.js)
  - Config files
- **UI Framework**: Detect from:
  - `.NET`: Check for `Blazor`, `Razor Pages`, `MVC`
  - Node.js: Check for `React`, `Vue`, `Angular`, `Svelte`
  - Python: Check for template engines
- **Real-time Tech**: Detect from packages:
  - `SignalR` (`.NET`)
  - `Socket.IO` (Node.js)
  - `WebSockets` (various)

#### 1.6 Tools & Quality
- **Analyzer Tools**: Detect from:
  - `.NET`: Check for `Roslynator`, `StyleCop`, `FxCop`
  - Node.js: Check for `ESLint`, `TSLint`
  - Python: Check for `pylint`, `flake8`, `mypy`
- **Test Framework**: Detect from packages:
  - `Playwright`, `Cypress`, `Jest`, `xUnit`, `NUnit`, `pytest`, `JUnit`
- **Package Manager**: Detect from:
  - `NuGet` (`.NET`)
  - `npm` or `yarn` (Node.js)
  - `pip` or `poetry` (Python)
  - `Maven` or `Gradle` (Java)

#### 1.7 Paths
- **Source Path**: Detect main source code directory
- **Test Path**: Detect test files directory
- **Config Path**: Detect configuration files directory
- **Workspace Path**: Current workspace root

---

### Step 2: Variable Mapping

**Create a complete mapping:**

```javascript
{
  "PROJECT_NAME": "Detected Project Name",
  "PROJECT_TYPE": ".NET",
  "LANGUAGES": "C#, JavaScript, TypeScript",
  "FRAMEWORKS": "ASP.NET Core, Blazor Server, SignalR",
  "BUILD_COMMAND": "dotnet build",
  "TEST_COMMAND": "dotnet test",
  "RUN_COMMAND": "dotnet run",
  "LINT_COMMAND": "dotnet format",
  "DATABASE_TYPE": "SQL Server + Entity Framework",
  "DATABASE_NAME": "MyDatabase",
  "DATABASE_SERVER": "localhost",
  "SCHEMA_PRIMARY": "app",
  "SCHEMA_READONLY": "dbo, reference",
  "CONNECTION_STRING_KEY": "DefaultConnection",
  "API_BASE_URL": "http://localhost:5000",
  "UI_FRAMEWORK": "Blazor Server",
  "REALTIME_TECH": "SignalR",
  "SOURCE_PATH": "src/",
  "TEST_PATH": "tests/",
  "CONFIG_PATH": "config/",
  "WORKSPACE_PATH": "/path/to/workspace",
  "ANALYZER_TOOLS": "Roslynator, StyleCop",
  "TEST_FRAMEWORK": "Playwright, xUnit",
  "PACKAGE_MANAGER": "NuGet",
  "DEFAULT_PORT": "5000",
  "SHELL_TYPE": "bash",
  "SCRIPT_EXT": "sh"
}
```

---

### Step 3: User Confirmation

**Present detected values to user:**

```markdown
🔍 PROJECT ANALYSIS COMPLETE

Detected Configuration:
=======================

📋 Project Identity:
  - Name: MyProject
  - Type: .NET
  - Languages: C#, JavaScript, TypeScript
  - Frameworks: ASP.NET Core, Blazor Server, SignalR

🛠️ Build & Test:
  - Build: dotnet build
  - Test: dotnet test
  - Run: dotnet run
  - Lint: dotnet format

🗄️ Database:
  - Type: SQL Server + Entity Framework
  - Name: MyDatabase
  - Server: localhost
  - Primary Schema: app (READ-WRITE)
  - Read-Only Schemas: dbo, reference

🌐 Infrastructure:
  - API Base: http://localhost:5000
  - UI: Blazor Server
  - Real-time: SignalR

📁 Paths:
  - Source: src/
  - Tests: tests/
  - Config: config/

🔧 Tools:
  - Analyzers: Roslynator, StyleCop
  - Testing: Playwright, xUnit
  - Packages: NuGet

Apply this configuration? (yes/no/edit)
```

**If user says "edit":**
- Allow manual override of any value
- Show template variable name and current value
- Accept new value from user
- Update mapping

---

### Step 4: Template Processing

**For each `.template` file in `.github/`:**

#### 4.1 Read Template File
- Load file contents
- Identify all `{{VARIABLES}}` used

#### 4.2 Replace Variables
- Replace each `{{VARIABLE}}` with mapped value
- Handle multi-line values properly
- Preserve formatting and indentation

#### 4.3 Remove Template Header
- Remove the "Generic Template - Customized During Setup" section
- Keep the core content

#### 4.4 Write Configured File
- Write to same path without `.template` extension
- Example: `SelfAwareness.instructions.md.template` → `SelfAwareness.instructions.md`
- Preserve file permissions

#### 4.5 Track Progress
```
Processing templates...
✅ instructions/SelfAwareness.instructions.md (23 variables replaced)
✅ instructions/Links/Architecture.md (18 variables replaced)
✅ instructions/Links/InfrastructureQuickRef.md (15 variables replaced)
✅ prompts/task.prompt.md (12 variables replaced)
✅ prompts/refactor.prompt.md (10 variables replaced)
...
```

---

### Step 5: Shared Files Handling

**Copy shared files as-is (no templating needed):**

```
Copying shared files...
✅ prompts/shared/commit-message-format.md
✅ prompts/shared/debug-logging-mandate.md
✅ prompts/shared/warning-handling-mandate.md
...
```

**These files are already generic and require no modification.**

---

### Step 6: Learning Infrastructure Setup

**Initialize learning system:**

```
Setting up learning infrastructure...
✅ Created learning/patterns/ (empty, will populate during usage)
✅ Created learning/insights/ (empty, will populate during usage)
✅ Created learning/recommendations/ (empty, will populate during usage)
✅ Created learning/error-patterns.json (empty array)
✅ Created learning/README.md (generic documentation)
✅ Created learning/PATTERN_SCHEMA.md (schema reference)
```

---

### Step 7: Validation

**Verify configuration completeness:**

#### 7.1 Check All Variables Replaced
- Scan all configured files for remaining `{{VARIABLES}}`
- Report any unreplaced variables
- Suggest manual fixes if needed

#### 7.2 Validate File Integrity
- Ensure all template files were processed
- Check for formatting errors
- Validate file paths and references

#### 7.3 Test Critical References
- Verify database connection string format
- Check API endpoint patterns
- Validate path references

---

### Step 8: Cleanup

**Remove template artifacts:**

```
Cleaning up...
✅ Deleted all .template files (originals preserved in _Portable/)
✅ Removed setup documentation (not needed after configuration)
✅ Cleaned up temporary files
```

---

### Step 9: Configuration Summary

**Generate completion report:**

```markdown
✅ CONFIGURATION COMPLETE

Summary:
========

📝 Files Processed: 45
  - Instructions: 13 files
  - Prompts: 12 files
  - Shared Docs: 20 files (copied as-is)

🔧 Variables Replaced: 247 replacements across all files
  - PROJECT_NAME: 32 replacements
  - DATABASE_NAME: 28 replacements
  - BUILD_COMMAND: 15 replacements
  ... (top 10 variables shown)

📁 Structure Created:
  - .github/instructions/ (configured)
  - .github/prompts/ (configured)
  - .github/learning/ (initialized)

🎯 Configuration Status:
  - ✅ All templates processed successfully
  - ✅ No unreplaced variables found
  - ✅ All paths validated
  - ✅ Database configuration verified
  - ✅ Learning system initialized

Next Steps:
===========

1. Review Configuration:
   - Check .github/instructions/SelfAwareness.instructions.md
   - Verify database settings in InfrastructureQuickRef.md
   - Review agent prompts in .github/prompts/

2. Test Agent System:
   @workspace /question "What agents are available?"
   @workspace /healthcheck

3. Start Using Agents:
   @workspace /task key=my-first-task tasks="Your first task"

4. Customize Further:
   - Edit any generated files as needed
   - Add project-specific documentation
   - Configure additional settings

Configuration Files Location:
=============================
All configured files are in: .github/

Original templates preserved in: .github/_Portable/
(You can delete _Portable/ folder if no longer needed)

System Ready! 🚀
```

---

## Smart Detection Patterns

### Database Connection String Parsing

**SQL Server:**
```
Data Source=SERVER;Initial Catalog=DATABASE;...
→ DATABASE_SERVER: SERVER
→ DATABASE_NAME: DATABASE
```

**PostgreSQL:**
```
Host=SERVER;Database=DATABASE;...
→ DATABASE_SERVER: SERVER
→ DATABASE_NAME: DATABASE
```

**MongoDB:**
```
mongodb://SERVER:PORT/DATABASE
→ DATABASE_SERVER: SERVER
→ DATABASE_NAME: DATABASE
```

### Framework Detection Logic

**Blazor Detection:**
- Check for `@page` directives in `.razor` files
- Look for `Microsoft.AspNetCore.Components` references
- Detect `blazor.server.js` or `blazor.webassembly.js`

**React Detection:**
- Check for `react` in `package.json` dependencies
- Look for `.jsx` or `.tsx` files
- Detect `import React from 'react'` patterns

### Schema Detection

**Primary vs Read-Only:**
- Scan code for INSERT/UPDATE/DELETE operations
- Schemas with write operations → Primary
- Schemas with only SELECT → Read-Only
- Most common write schema → Primary

---

## Fallback & Error Handling

### If Detection Fails

**Prompt user for manual input:**
```
⚠️ Could not auto-detect: DATABASE_NAME

Please provide the database name:
> _
```

### Partial Detection

**Use detected values, prompt for missing:**
```
✅ Detected 18 of 25 variables

Please provide the following:
  - DATABASE_SERVER: _
  - REALTIME_TECH: _
  - ANALYZER_TOOLS: _
```

### Invalid Values

**Validate and correct:**
```
⚠️ Detected BUILD_COMMAND: "npm build" 
   Standard is: "npm run build"
   
Use standard? (yes/no)
```

---

## Success Criteria

- ✅ All `.template` files converted to working files
- ✅ All `{{VARIABLES}}` replaced with actual values
- ✅ No remaining template placeholders
- ✅ File structure properly created
- ✅ Shared files copied correctly
- ✅ Learning system initialized
- ✅ Configuration summary generated
- ✅ System ready for immediate use

---

## Notes

**Idempotency:**
- Can be run multiple times safely
- Re-detects and reconfigures
- Previous configuration backed up before changes

**Customization:**
- User can manually edit any configured file after setup
- Re-running total-recall will re-detect and may overwrite custom changes
- Consider backing up custom changes before re-running

**Template Preservation:**
- Original `.template` files preserved in `_Portable/` folder
- Can regenerate configuration from templates at any time
- Delete `_Portable/` folder once satisfied with configuration
