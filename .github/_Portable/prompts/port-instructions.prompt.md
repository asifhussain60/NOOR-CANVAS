# port-instructions.prompt.md

---
mode: agent
---

## Role
You are the **Portability Agent** - responsible for creating generic, reusable templates from the current project's AI agent infrastructure.

---

## Parameters

### prompt *(optional)*
Specify a single prompt file to port instead of regenerating the entire _Portable folder.

**Format:** Prompt filename (e.g., `task.prompt.md`, `refactor.prompt.md`)

**Behavior:**
- **Not provided (default):** Full regeneration - delete and recreate entire `_Portable` folder
- **Provided:** Selective update - port only the specified prompt and its dependencies

**Example:**
```
@workspace /port-instructions prompt=task.prompt.md
@workspace /port-instructions prompt=refactor
```

**What Gets Updated (Selective Mode):**
- The specified prompt template (`.github/_Portable/prompts/{prompt}.template`)
- All shared files referenced by the prompt
- Related learning files (if prompt has dedicated lessons)
- Meta-prompts (port-instructions, total-recall) are always updated
- Documentation files are NOT updated in selective mode

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
# Full regeneration (default)
@workspace /port-instructions

# Selective update for specific prompt
@workspace /port-instructions prompt=task.prompt.md
@workspace /port-instructions prompt=refactor
```

### Expected Outcomes

**Full Regeneration Mode (no prompt parameter):**
- ✅ Complete deletion and recreation of `.github/_Portable/` folder
- ✅ Generic templates for all prompts and instructions
- ✅ Template variables replacing project-specific values
- ✅ Working `setup.bat` and `setup.ps1` scripts
- ✅ Comprehensive documentation (README, START-HERE, QUICK-REFERENCE)
- ✅ Preserved learning infrastructure structure
- ✅ Ready-to-copy portable system

**Selective Update Mode (prompt parameter provided):**
- ✅ Updated template for specified prompt only
- ✅ Updated shared files referenced by the prompt
- ✅ Updated related learning files (if applicable)
- ✅ Meta-prompts (port-instructions, total-recall) always updated
- ✅ Existing documentation and other prompts preserved
- ✅ Faster execution (no full rebuild)

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

### Step 0: Mode Selection (MANDATORY FIRST STEP)

**Determine execution mode based on `prompt` parameter:**

#### Mode 1: Full Regeneration (Default - No prompt parameter)
- **Trigger:** `prompt` parameter NOT provided
- **Action:** Proceed to Step 1 (Destructive Cleanup)
- **Scope:** Entire `_Portable` folder recreated from scratch
- **Use Case:** Major updates, periodic refresh, initial setup

#### Mode 2: Selective Update (prompt parameter provided)
- **Trigger:** `prompt` parameter IS provided (e.g., `prompt=task.prompt.md`)
- **Action:** Skip to Step 0.5 (Selective Update Protocol)
- **Scope:** Only specified prompt + dependencies updated
- **Use Case:** Single prompt improvements, quick updates, iterative development

---

### Step 0.5: Selective Update Protocol (CONDITIONAL - Only if prompt parameter provided)

**Executed ONLY when `prompt` parameter is provided. Skips full regeneration.**

#### 0.5.1: Normalize Prompt Name
```powershell
# Accept various formats
# Input: "task", "task.prompt.md", "task.prompt"
# Output: "task.prompt.md"

$promptName = $prompt -replace '\.prompt(\.md)?$', ''  # Remove extensions
$promptFile = "$promptName.prompt.md"  # Add standard extension
```

#### 0.5.2: Validate Prompt Exists
```powershell
$sourcePath = ".github/prompts/$promptFile"
if (!(Test-Path $sourcePath)) {
    Write-Error "❌ Prompt not found: $sourcePath"
    Write-Host "Available prompts:"
    Get-ChildItem ".github/prompts/*.prompt.md" | ForEach-Object { Write-Host "  - $($_.Name)" }
    EXIT
}
```

#### 0.5.3: Identify Dependencies

**Analyze source prompt to find referenced files:**

```powershell
# Read prompt content
$content = Get-Content $sourcePath -Raw

# Extract file references
$sharedRefs = [regex]::Matches($content, '`\.github/prompts/shared/([^`]+)`') | 
    ForEach-Object { $_.Groups[1].Value }

$learningRefs = [regex]::Matches($content, '`\.github/learning/([^`]+)`') | 
    ForEach-Object { $_.Groups[1].Value }

# Deduplicate
$sharedFiles = $sharedRefs | Select-Object -Unique
$learningFiles = $learningRefs | Select-Object -Unique
```

**Output to User:**
```
🔍 Analyzing: $promptFile

Dependencies Found:
  📁 Shared Files: $($sharedFiles.Count)
    - $sharedFile1
    - $sharedFile2
  📁 Learning Files: $($learningFiles.Count)
    - $learningFile1
```

#### 0.5.4: Update Specified Prompt Template

**Create templated version:**

1. Read source: `.github/prompts/$promptFile`
2. Extract project-specific values (same extraction logic as Step 2)
3. Replace with template variables (same replacement logic as Step 3.2)
4. Add template header
5. Write to: `.github/_Portable/prompts/$promptFile.template`

**Output:**
```
✅ Updated: prompts/$promptFile.template
```

#### 0.5.5: Update Referenced Shared Files

**For each shared file found in 0.5.3:**

```powershell
foreach ($sharedFile in $sharedFiles) {
    $sourcePath = ".github/prompts/shared/$sharedFile"
    $destPath = ".github/_Portable/prompts/shared/$sharedFile"
    
    if (Test-Path $sourcePath) {
        # Copy as-is (shared files are already generic)
        Copy-Item $sourcePath $destPath -Force
        Write-Host "✅ Updated: prompts/shared/$sharedFile"
    }
}
```

#### 0.5.6: Update Referenced Learning Files

**For each learning file found in 0.5.3:**

```powershell
foreach ($learningFile in $learningFiles) {
    $sourcePath = ".github/learning/$learningFile"
    $destPath = ".github/_Portable/learning/$learningFile"
    
    if (Test-Path $sourcePath) {
        # Determine if templating needed
        if ($learningFile -match '\.(json|md)$') {
            # Copy with potential templating
            # (Most learning files are generic, copy as-is)
            Copy-Item $sourcePath $destPath -Force
            Write-Host "✅ Updated: learning/$learningFile"
        }
    }
}
```

#### 0.5.7: Always Update Meta-Prompts

**Meta-prompts are always updated regardless of selective mode:**

```powershell
# Update port-instructions.prompt.md
Copy-Item ".github/_Portable/prompts/port-instructions.prompt.md" `
          ".github/_Portable/prompts/port-instructions.prompt.md" -Force

# Update total-recall.prompt.md
Copy-Item ".github/_Portable/prompts/total-recall.prompt.md" `
          ".github/_Portable/prompts/total-recall.prompt.md" -Force

Write-Host "✅ Updated: Meta-prompts (port-instructions, total-recall)"
```

**Rationale:** Meta-prompts manage the system itself and should always be current.

#### 0.5.8: Generate Selective Update Summary

**Output to User:**
```
✅ SELECTIVE UPDATE COMPLETE

Updated Files:
==============
📝 Prompt Template:
  - prompts/$promptFile.template

📁 Shared Files ($($sharedFiles.Count)):
  - prompts/shared/$sharedFile1
  - prompts/shared/$sharedFile2

📁 Learning Files ($($learningFiles.Count)):
  - learning/$learningFile1

🔄 Meta-Prompts (always updated):
  - prompts/port-instructions.prompt.md
  - prompts/total-recall.prompt.md

Skipped (Preserved):
===================
- All other prompt templates
- Instructions templates
- Setup scripts (setup.bat, setup.ps1)
- Documentation (README, START-HERE, etc.)

Next Steps:
===========
1. Review changes in .github/_Portable/
2. Test the updated template
3. Commit changes: git add .github/_Portable/
4. Run full regeneration if needed: @workspace /port-instructions
```

**EXIT:** After Step 0.5.8, skip all remaining steps (Steps 1-7) and complete execution.

---

### Step 1: Destructive Cleanup (MANDATORY FIRST STEP - Full Regeneration Only)

**ONLY executed in Full Regeneration Mode (no `prompt` parameter provided).**

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

### Step 2: Source Analysis (Full Regeneration Only)

**ONLY executed in Full Regeneration Mode.**

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

### Step 3: Template Creation (Full Regeneration Only)

**ONLY executed in Full Regeneration Mode.**

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

### Step 4: Setup Script Creation (Full Regeneration Only)

**ONLY executed in Full Regeneration Mode.**

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

### Step 5: Documentation Creation (Full Regeneration Only)

**ONLY executed in Full Regeneration Mode.**

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

### Step 6: Validation (Full Regeneration Only)

**ONLY executed in Full Regeneration Mode.**

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

**Execution Mode Determines Summary Format:**

#### Full Regeneration Mode Summary

**Generate Report:**

```markdown
# Port Instructions Execution Summary

**Date:** [Current Date]
**Mode:** Full Regeneration
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

#### Selective Update Mode Summary

**NOTE:** This summary is shown in Step 0.5.8, not Step 7 (which is skipped in selective mode).

**Generate Report:**

```markdown
# Port Instructions Execution Summary (Selective Update)

**Date:** [Current Date]
**Mode:** Selective Update
**Target Prompt:** {promptFile}
**Scope:** Single prompt + dependencies

## Actions Taken

### 1. Prompt Template Updated
- ✅ Analyzed source: .github/prompts/{promptFile}
- ✅ Replaced project-specific values with template variables
- ✅ Updated: .github/_Portable/prompts/{promptFile}.template

### 2. Shared Files Updated ({X} files)
- ✅ {sharedFile1}
- ✅ {sharedFile2}
- ... (list all)

### 3. Learning Files Updated ({X} files)
- ✅ {learningFile1}
- ... (list all)

### 4. Meta-Prompts Updated (Always)
- ✅ port-instructions.prompt.md
- ✅ total-recall.prompt.md

## Files Preserved (Not Modified)
- All other prompt templates
- All instruction templates
- Setup scripts (setup.bat, setup.ps1)
- Documentation (README, START-HERE, QUICK-REFERENCE, STATUS, COMPLETE)
- Other shared files not referenced by this prompt
- Other learning files not referenced by this prompt

## Validation Results
- ✅ Template validated (no hardcoded values)
- ✅ Dependencies complete
- ✅ Meta-prompts current

## Usage Instructions

**To apply this update to a new project:**
1. Copy .github/_Portable/ to new project (entire folder)
2. Run setup.bat or setup.ps1
3. The updated {promptFile} template will be deployed

**To update other prompts:**
```
@workspace /port-instructions prompt=refactor.prompt.md
@workspace /port-instructions prompt=sync.prompt.md
```

**To perform full regeneration:**
```
@workspace /port-instructions
```

## Next Steps
- Review changes in .github/_Portable/prompts/{promptFile}.template
- Test template with setup.bat in a test project
- Commit changes to repository
- Run full regeneration periodically to sync all files
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
