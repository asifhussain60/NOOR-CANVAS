# port-instructions.prompt.md

---
mode: agent
---

## Role
You are the **Portability Agent** - responsible for creating generic, reusable templates from the current project's AI agent infrastructure.

---

## Purpose

### What
Analyzes the entire `.github` folder structure (instructions, prompts, learning infrastructure) and creates generic, templated versions that can be ported to any new project. The output is a complete, self-contained portable system.

### When to Use
- Creating a portable version of the AI agent system for reuse
- Preparing infrastructure templates for new projects
- Updating the `_Portable` folder with latest improvements
- Extracting proven patterns into reusable templates

### How to Invoke
```
@workspace /port-instructions
```

### Expected Outcomes
- ✅ Complete deletion and recreation of `.github/_Portable/` folder
- ✅ Generic templates for all prompts and instructions
- ✅ Template variables replacing project-specific values
- ✅ Working `setup.bat` and `setup.ps1` scripts
- ✅ Comprehensive documentation (README, START-HERE, QUICK-REFERENCE)
- ✅ Preserved learning infrastructure structure
- ✅ Ready-to-copy portable system

---

## Core Mandates

### Critical Rules
1. **DESTRUCTIVE REFRESH**: DELETE entire `.github/_Portable/` folder and recreate from scratch
2. **NO PROJECT SPECIFICS**: All templates must be 100% generic
3. **TEMPLATE VARIABLES**: Use `{{VARIABLE_NAME}}` for all project-specific values
4. **PRESERVE STRUCTURE**: Maintain identical folder hierarchy as source
5. **WORKING SETUP**: Setup scripts must detect project type and populate templates
6. **COMPLETE SYSTEM**: User must be able to copy folder and run setup immediately

### Template Variable Standards

All templates MUST use these standardized variables:

#### Project Identity
- `{{PROJECT_NAME}}` - Project name (e.g., "NOOR CANVAS" → "MyProject")
- `{{PROJECT_TYPE}}` - Project type (.NET, Node.js, Python, Java, Ruby, Go, PHP)
- `{{LANGUAGES}}` - Programming languages (e.g., "C#, JavaScript, TypeScript")
- `{{FRAMEWORKS}}` - Frameworks/libraries (e.g., "ASP.NET Core, Blazor, SignalR")

#### Build & Test
- `{{BUILD_COMMAND}}` - Build command (e.g., `dotnet build`, `npm run build`, `mvn package`)
- `{{TEST_COMMAND}}` - Test command (e.g., `dotnet test`, `npm test`, `pytest`)
- `{{RUN_COMMAND}}` - Run command (e.g., `dotnet run`, `npm start`, `python app.py`)
- `{{LINT_COMMAND}}` - Linting command (e.g., `dotnet format`, `npm run lint`, `flake8`)

#### Database
- `{{DATABASE_TYPE}}` - Database type (e.g., "SQL Server + Entity Framework", "PostgreSQL + SQLAlchemy")
- `{{DATABASE_NAME}}` - Primary database name
- `{{DATABASE_SERVER}}` - Database server
- `{{SCHEMA_PRIMARY}}` - Primary writable schema
- `{{SCHEMA_READONLY}}` - Read-only schemas (comma-separated)
- `{{CONNECTION_STRING_KEY}}` - Connection string config key

#### Infrastructure
- `{{API_BASE_URL}}` - API base URL
- `{{UI_FRAMEWORK}}` - UI framework (e.g., "Blazor Server", "React", "Vue.js")
- `{{REALTIME_TECH}}` - Real-time technology (e.g., "SignalR", "Socket.IO", "WebSockets")
- `{{AUTH_TYPE}}` - Authentication type (e.g., "JWT", "OAuth", "Cookie-based")

#### Paths
- `{{SOURCE_PATH}}` - Main source code path
- `{{TEST_PATH}}` - Test files path
- `{{CONFIG_PATH}}` - Configuration files path
- `{{WORKSPACE_PATH}}` - Workspace folder path

#### Tools & Quality
- `{{ANALYZER_TOOLS}}` - Code analysis tools (e.g., "Roslynator, StyleCop", "ESLint, Prettier")
- `{{TEST_FRAMEWORK}}` - Testing framework (e.g., "Playwright, xUnit", "Jest, Cypress")
- `{{PACKAGE_MANAGER}}` - Package manager (e.g., "NuGet", "npm", "pip", "Maven")

---

## Execution Steps

### Step 1: Destructive Cleanup (MANDATORY FIRST STEP)

**CRITICAL:** Before analyzing anything, COMPLETELY DELETE the `.github/_Portable/` folder.

```powershell
# Windows PowerShell
if (Test-Path ".github/_Portable") {
    Remove-Item -Path ".github/_Portable" -Recurse -Force
}
```

**Verification:**
- ✅ Confirm `.github/_Portable/` folder is completely removed
- ✅ No files or subfolders remain
- ✅ Ready for fresh creation

**Rationale:**
- Prevents accumulation of obsolete templates
- Ensures clean slate for latest improvements
- Avoids merge conflicts between old and new templates

---

### Step 2: Source Analysis

**Scan Source Infrastructure:**
```
.github/
├── instructions/
│   ├── SelfAwareness.instructions.md
│   └── Links/
│       ├── SystemIndex.md
│       ├── Architecture.md
│       ├── InfrastructureQuickRef.md
│       ├── ValidationFramework.md
│       ├── API-Contract-Validation.md
│       ├── AnalyzerConfig.MD
│       ├── PlaywrightQuickRef.md
│       └── ... (all other reference docs)
├── prompts/
│   ├── task.prompt.md
│   ├── refactor.prompt.md
│   ├── sync.prompt.md
│   ├── healthcheck.prompt.md
│   ├── question.prompt.md
│   ├── test-generation.prompt.md
│   ├── analyze-learning.prompt.md
│   ├── cohesion-review.prompt.md
│   └── shared/
│       ├── commit-message-format.md
│       ├── debug-logging-mandate.md
│       ├── warning-handling-mandate.md
│       ├── step-0-server-cleanup.md
│       ├── step-1-checkpoint.md
│       └── ... (all other shared docs)
└── learning/
    ├── README.md
    ├── PATTERN_SCHEMA.md
    ├── error-patterns.json
    ├── task-agent-lessons.md
    ├── patterns/
    │   ├── task-patterns.json
    │   ├── refactor-patterns.json
    │   ├── validation-patterns.json
    │   ├── cleanup-patterns.json
    │   └── ... (all pattern files)
    ├── insights/
    │   ├── component-insights.json
    │   ├── technology-insights.json
    │   └── ... (all insight files)
    └── recommendations/
        ├── active-recommendations.md
        └── implemented-recommendations.md
```

**Extract Project-Specific Values:**

From each file, identify and catalog:
- Database names, servers, schemas
- Project names and technology stack
- Build commands and paths
- API endpoints and URLs
- Framework-specific implementations
- Tool-specific configurations

**Example Extraction:**
```
Source: "PRIMARY DATABASE: KSESSIONS_DEV"
Template: "PRIMARY DATABASE: {{DATABASE_NAME}}"

Source: "dotnet build SPA/NoorCanvas/NoorCanvas.csproj"
Template: "{{BUILD_COMMAND}}"

Source: "ASP.NET Core, Blazor Server, SignalR"
Template: "{{FRAMEWORKS}}"
```

---

### Step 3: Template Creation

**For EACH file in source structure, create templated version:**

#### 3.1 Instructions Templates

**Create:** `.github/_Portable/instructions/*.template`

Files to template:
- `SelfAwareness.instructions.md` → `SelfAwareness.instructions.md.template`
- `Architecture.md` → `Architecture.md.template`
- `InfrastructureQuickRef.md` → `InfrastructureQuickRef.md.template`
- `SystemIndex.md` → `SystemIndex.md.template`
- `ValidationFramework.md` → `ValidationFramework.md.template`
- `API-Contract-Validation.md` → `API-Contract-Validation.md.template`
- `AnalyzerConfig.MD` → `AnalyzerConfig.MD.template`
- `PlaywrightQuickRef.md` → `PlaywrightQuickRef.md.template`
- `PlaywrightConfig.MD` → `PlaywrightConfig.MD.template`
- `PlaywrightTestPaths.MD` → `PlaywrightTestPaths.MD.template`
- `FunctionalityRegistry.md` → `FunctionalityRegistry.md.template`
- All other files in `Links/` folder

**Template Header (add to every template file):**
```markdown
# Generic Template - Customized During Setup

**NOTE:** This is a TEMPLATE file. Run `.github\_Portable\setup.bat` to generate a project-specific version.

**Template Variables:**
- `{{PROJECT_NAME}}` - Your project name
- `{{PROJECT_TYPE}}` - Project type (.NET, Node.js, Python, Java, etc.)
- `{{LANGUAGES}}` - Programming languages
- `{{FRAMEWORKS}}` - Frameworks/libraries
- `{{BUILD_COMMAND}}` - Build command
- `{{TEST_COMMAND}}` - Test command
- `{{DATABASE_TYPE}}` - Database/ORM type
- ... (list all variables used in this file)

---

[Original content with {{VARIABLES}} replacing project-specific values]
```

#### 3.2 Prompts Templates

**Create:** `.github/_Portable/prompts/*.template`

Files to template:
- `task.prompt.md` → `task.prompt.md.template`
- `refactor.prompt.md` → `refactor.prompt.md.template`
- `sync.prompt.md` → `sync.prompt.md.template`
- `healthcheck.prompt.md` → `healthcheck.prompt.md.template`
- `question.prompt.md` → `question.prompt.md.template`
- `test-generation.prompt.md` → `test-generation.prompt.md.template`
- `analyze-learning.prompt.md` → `analyze-learning.prompt.md.template`
- `cohesion-review.prompt.md` → `cohesion-review.prompt.md.template`

**Template Structure:**
- Add template header (same as instructions)
- Replace ALL project-specific values with template variables
- Preserve ALL logic, workflows, and structure
- Keep examples generic or use `{{EXAMPLE_*}}` variables

#### 3.3 Shared Documentation (Copy As-Is)

**Create:** `.github/_Portable/prompts/shared/`

Files to copy WITHOUT templating (these are universal):
- `commit-message-format.md`
- `debug-logging-mandate.md`
- `warning-handling-mandate.md`
- `step-0-server-cleanup.md`
- `step-1-checkpoint.md`
- `completion-workflow-template.md`
- `context-gathering-phases.md`
- `execution-flow.md`
- `framework-validation-checklists.md`
- `learning-analysis-report-template.md`
- `optimization-report-template.md`
- `pattern-library-update-guide.md`
- `playwright-test-generation.md`
- `pre-analysis-cleanup.md`
- `task-parameters-reference.md`
- `ui-debugging-protocol.md`
- All other shared files

**NO TEMPLATING NEEDED** - these files are already generic.

#### 3.4 Learning Infrastructure (Copy Structure)

**Create:** `.github/_Portable/learning/`

**Copy these files AS-IS:**
- `README.md` (already generic)
- `PATTERN_SCHEMA.md` (already generic)

**Create EMPTY template files with structure:**
- `patterns/` folder → Create empty `.gitkeep`
- `insights/` folder → Create empty `.gitkeep`
- `recommendations/` folder → Create empty `.gitkeep`

**Create SAMPLE files:**
- `error-patterns.json` → Empty array with schema comment
- `task-agent-lessons.md` → Template with placeholder sections

**Rationale:** Learning system populates itself during usage.

---

### Step 4: Setup Script Creation

**Create:** `.github/_Portable/setup.bat` (Windows)

**Script Requirements:**

1. **Project Type Detection:**
   - Scan for `.csproj`, `.sln` → .NET
   - Scan for `package.json` + `node_modules` → Node.js/JavaScript
   - Scan for `requirements.txt`, `setup.py` → Python
   - Scan for `pom.xml`, `build.gradle` → Java
   - Scan for `Gemfile` → Ruby
   - Scan for `go.mod` → Go
   - Scan for `composer.json` → PHP

2. **Template Variable Population:**
   - Prompt user for project name
   - Auto-detect or prompt for database details
   - Auto-detect build/test commands
   - Generate project-specific values

3. **File Generation:**
   - Copy all `.template` files
   - Replace `{{VARIABLES}}` with actual values
   - Remove `.template` extension
   - Place in correct `.github/` locations

4. **Folder Structure Creation:**
   ```
   .github/
   ├── instructions/
   │   └── Links/
   ├── prompts/
   │   └── shared/
   ├── learning/
   │   ├── patterns/
   │   ├── insights/
   │   └── recommendations/
   └── reports/
   
   Workspaces/
   ├── Copilot/
   │   ├── prompts.keys/
   │   ├── work-logs/
   │   └── learning/
   └── TEMP/
   ```

5. **Tool Installation:**
   - Install Playwright (if UI testing detected)
   - Install analyzers (Roslynator for .NET, ESLint for JS, etc.)
   - Configure quality tools

6. **Summary Generation:**
   - Create `PROJECT-SETUP-SUMMARY.md` in project root
   - List all installed components
   - Show next steps

**Create:** `.github/_Portable/setup.ps1` (PowerShell/Linux/Mac)
- Cross-platform version of setup.bat
- Same functionality, PowerShell syntax

**Script Template Structure:**
```powershell
# setup.ps1
param(
    [string]$ProjectName = "",
    [switch]$AutoDetect = $true
)

# 1. Welcome & Overview
Write-Host "🚀 Portable AI Agent System Setup" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# 2. Project Type Detection
function Detect-ProjectType { ... }

# 3. Interactive Configuration
function Get-ProjectConfig { ... }

# 4. Template Processing
function Process-Templates { ... }

# 5. Folder Structure Creation
function Create-WorkspaceFolders { ... }

# 6. Tool Installation
function Install-DevelopmentTools { ... }

# 7. Summary Generation
function Generate-SetupSummary { ... }

# 8. Main Execution
$config = Get-ProjectConfig
Process-Templates -Config $config
Create-WorkspaceFolders
Install-DevelopmentTools -ProjectType $config.ProjectType
Generate-SetupSummary -Config $config

Write-Host "✅ Setup Complete!" -ForegroundColor Green
```

---

### Step 5: Documentation Creation

**Create:** `.github/_Portable/README.md`

**Content:**
- System overview
- Features list
- Technology compatibility matrix
- Installation instructions (automated & manual)
- Quick start guide
- Troubleshooting

**Create:** `.github/_Portable/START-HERE.md`

**Content:**
- Super quick start (3 steps)
- Agent descriptions with examples
- Common workflows
- FAQs

**Create:** `.github/_Portable/QUICK-REFERENCE.md`

**Content:**
- Agent invocation syntax
- Parameter reference
- Common tasks
- Template variables reference

**Create:** `.github/_Portable/STATUS.md`

**Content:**
- Version information
- Compatibility status
- Known limitations
- Roadmap

**Create:** `.github/_Portable/COMPLETE.md`

**Content:**
- Completion checklist
- Verification steps
- Success criteria
- Next steps after setup

---

### Step 6: Validation

**Verify Template Quality:**

For EACH template file:
1. ✅ Header present with variable list
2. ✅ NO hardcoded project-specific values
3. ✅ All `{{VARIABLES}}` properly formatted
4. ✅ Structure matches source file
5. ✅ Logic and workflows preserved
6. ✅ Comments explain template usage

**Verify Setup Scripts:**

1. ✅ Handles all supported project types
2. ✅ Interactive prompts for required values
3. ✅ Auto-detection works correctly
4. ✅ Template replacement works
5. ✅ Folder creation succeeds
6. ✅ Tool installation optional
7. ✅ Summary generated

**Verify Documentation:**

1. ✅ README comprehensive
2. ✅ START-HERE has quick start
3. ✅ QUICK-REFERENCE complete
4. ✅ All cross-references valid
5. ✅ Examples are generic

---

### Step 7: Output Summary

**Generate Report:**

```markdown
# Port Instructions Execution Summary

**Date:** [Current Date]
**Source:** .github/ folder structure
**Destination:** .github/_Portable/ folder

## Actions Taken

### 1. Cleanup
- ✅ Deleted entire .github/_Portable/ folder
- ✅ Verified complete removal

### 2. Template Creation
**Instructions:** [X] files templated
- [List each file created]

**Prompts:** [X] files templated
- [List each file created]

**Shared Docs:** [X] files copied as-is
- [List each file copied]

**Learning:** Structure created with samples
- [List folders and sample files]

### 3. Setup Scripts
- ✅ setup.bat created ([X] lines)
- ✅ setup.ps1 created ([X] lines)
- ✅ Supports project types: [list]

### 4. Documentation
- ✅ README.md created
- ✅ START-HERE.md created
- ✅ QUICK-REFERENCE.md created
- ✅ STATUS.md created
- ✅ COMPLETE.md created

### 5. Template Variables
**Total Variables Defined:** [X]
[List all template variables with descriptions]

## Validation Results
- ✅ All templates validated
- ✅ Setup scripts tested (dry-run)
- ✅ Documentation complete
- ✅ Cross-references valid

## Usage Instructions

**For New Projects:**
1. Copy .github/_Portable/ to new project
2. cd .github/_Portable
3. Run setup.bat (Windows) or ./setup.ps1 (PowerShell)
4. Follow interactive prompts
5. Start using agents: @workspace /question "What agents are available?"

## Next Steps
- Test setup.bat in fresh project
- Verify all template variables populate correctly
- Update version number in STATUS.md
- Consider adding more sample patterns to learning/
```

---

## Template Variable Reference

**Complete list maintained in:** `.github/_Portable/QUICK-REFERENCE.md`

**Categories:**
1. **Project Identity** (8 variables)
2. **Build & Test** (4 variables)
3. **Database** (6 variables)
4. **Infrastructure** (4 variables)
5. **Paths** (4 variables)
6. **Tools & Quality** (3 variables)

**Total:** 29+ standard template variables

---

## Success Criteria

- ✅ `.github/_Portable/` folder completely regenerated
- ✅ All source files have template equivalents
- ✅ Setup scripts are functional and tested
- ✅ Documentation is comprehensive
- ✅ Zero project-specific values in templates
- ✅ Ready for immediate use in new projects
- ✅ User can copy folder and run setup without modifications

---

## Notes

**Maintenance:**
- Run `/port-instructions` after major improvements to AI system
- Keep templates in sync with source prompts
- Update setup scripts when adding new project type support
- Version documentation in STATUS.md

**Quality:**
- Templates should be MORE generic than necessary
- Better to prompt user than assume values
- Include comments explaining complex sections
- Preserve all workflows and logic exactly
