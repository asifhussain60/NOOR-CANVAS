# Quick Start Checklist - Portable AI Agent System

**For:** Installing and running the AI Agent System in a NEW project  
**Time Required:** 30-60 minutes (first-time setup)  
**Difficulty:** Easy to Moderate

---

## ✅ Pre-Installation Checklist

### Prerequisites

- [ ] **Git installed** - Required for checkpoints and version control
  ```bash
  git --version  # Should show version 2.x or higher
  ```

- [ ] **VS Code installed** - Your development environment
  ```bash
  code --version
  ```

- [ ] **Your project runtime installed** (.NET, Node.js, Python, Java, etc.)
  ```bash
  # Examples:
  dotnet --version      # For .NET projects
  node --version        # For Node.js projects
  python --version      # For Python projects
  java -version         # For Java projects
  ```

- [ ] **Your project builds successfully** (baseline verification)
  ```bash
  # Run your project's build command
  dotnet build          # .NET
  npm run build         # Node.js
  python setup.py build # Python
  mvn clean install     # Java
  ```

- [ ] **Git repository initialized** in your project
  ```bash
  # If not initialized:
  git init
  git add .
  git commit -m "Initial commit before AI agent system"
  ```

---

## 📦 Step 1: Copy Portable System to Your Project

### Option A: Copy Entire _Portable Folder

```powershell
# From NOOR CANVAS directory
Copy-Item "D:\PROJECTS\NOOR CANVAS\.github\_Portable" `
          -Destination "C:\YourProject\.github\_Portable" `
          -Recurse
```

**Checklist:**
- [ ] `_Portable` folder exists in your project's `.github` directory
- [ ] All subfolders copied (prompts, instructions)
- [ ] All markdown files present (check FILE-INDEX.md)

### Option B: Download/Clone (if distributed separately)

```bash
# If available as separate repository
git clone https://github.com/yourusername/ai-agent-portable.git .github/_Portable
```

---

## 📖 Step 2: Read Documentation (15 minutes)

**In this order:**

- [ ] **Read:** `.github/_Portable/START-HERE.md` (10 min)
  - Understand what the system does
  - Review architecture diagram
  - Check completion status

- [ ] **Skim:** `.github/_Portable/README.md` (5 min)
  - Benefits and features
  - Technology compatibility
  - Usage examples

- [ ] **Reference:** `.github/_Portable/FILE-INDEX.md`
  - Bookmark for later navigation

---

## 🎯 Step 3: Choose Installation Method

### Method 1: Fully Automated Setup (Recommended)

**When to use:** You want complete automation, templates are finished

**Checklist:**
- [ ] Verify SETUP.prompt.md exists
- [ ] Open your project in VS Code
- [ ] Open Copilot Chat
- [ ] Run setup command:
  ```
  @workspace Use the file at .github/_Portable/SETUP.prompt.md to initialize the AI agent system for this project. Analyze my complete application and configure all agents.
  ```
- [ ] Wait 15-30 minutes for setup to complete
- [ ] Review setup report at `Workspaces/Copilot/_DOCS/setup/SETUP-COMPLETE.md`

**Skip to Step 7 (Verification) if using this method**

---

### Method 2: Manual Installation

**When to use:** You want control, or automated setup isn't complete

#### 2.1: Copy Shared Modules (Universal - No Changes Needed)

```powershell
# Create prompts directory
New-Item -Path "YourProject\.github\prompts\shared" -ItemType Directory -Force

# Copy shared modules
Copy-Item "D:\PROJECTS\NOOR CANVAS\.github\_Portable\prompts\shared\*" `
          -Destination "YourProject\.github\prompts\shared\" `
          -Recurse
```

**Checklist:**
- [ ] `commit-message-format.md` copied
- [ ] `debug-logging-mandate.md` copied
- [ ] `warning-handling-mandate.md` copied
- [ ] `step-0-server-cleanup.md` copied
- [ ] `step-1-checkpoint.md` copied

#### 2.2: Copy and Customize Task Agent

```powershell
# Copy task agent template
Copy-Item "D:\PROJECTS\NOOR CANVAS\.github\_Portable\prompts\task.prompt.md.template" `
          -Destination "YourProject\.github\prompts\task.prompt.md"
```

**Checklist:**
- [ ] File copied to `.github/prompts/task.prompt.md`
- [ ] Open file in editor
- [ ] Find and replace placeholders (see Step 4)

#### 2.3: Copy Other Agent Templates (from NOOR CANVAS originals)

**If you need other agents immediately:**

```powershell
# Copy from NOOR CANVAS originals
Copy-Item "D:\PROJECTS\NOOR CANVAS\.github\prompts\refactor.prompt.md" `
          -Destination "YourProject\.github\prompts\"
Copy-Item "D:\PROJECTS\NOOR CANVAS\.github\prompts\healthcheck.prompt.md" `
          -Destination "YourProject\.github\prompts\"
Copy-Item "D:\PROJECTS\NOOR CANVAS\.github\prompts\question.prompt.md" `
          -Destination "YourProject\.github\prompts\"
Copy-Item "D:\PROJECTS\NOOR CANVAS\.github\prompts\sync.prompt.md" `
          -Destination "YourProject\.github\prompts\"
```

**Checklist:**
- [ ] Agents copied based on your needs
- [ ] Ready to customize in Step 4

#### 2.4: Copy Instructions (from NOOR CANVAS originals)

```powershell
# Create instructions directory
New-Item -Path "YourProject\.github\instructions\Links" -ItemType Directory -Force

# Copy instruction files
Copy-Item "D:\PROJECTS\NOOR CANVAS\.github\instructions\SelfAwareness.instructions.md" `
          -Destination "YourProject\.github\instructions\"
Copy-Item "D:\PROJECTS\NOOR CANVAS\.github\instructions\Links\*" `
          -Destination "YourProject\.github\instructions\Links\"
```

**Checklist:**
- [ ] `SelfAwareness.instructions.md` copied
- [ ] `SystemStructureSummary.md` copied
- [ ] `ValidationFramework.md` copied
- [ ] Other instruction files copied as needed

---

## 🔧 Step 4: Replace Placeholders (Manual Installation Only)

### 4.1: Identify Your Project Details

**Fill out this information:**

```
Project Name: _______________________
Language/Framework: _______________________
Build Command: _______________________
Test Command: _______________________
Server Cleanup: _______________________
Main Port: _______________________
```

### 4.2: Replace in task.prompt.md

**Open:** `YourProject\.github\prompts\task.prompt.md`

**Find and replace:**

| Find This | Replace With | Example |
|-----------|--------------|---------|
| `{{PROJECT_NAME}}` | Your project name | "MyAwesomeApp" |
| `{{SETUP_DATE}}` | Today's date | "2025-10-11" |
| `{{PLACEHOLDER_BUILD_COMMAND}}` | Your build command | `npm run build` |
| `{{PLACEHOLDER_TEST_COMMAND}}` | Your test command | `npm test` |
| `{{PLACEHOLDER_SERVER_CLEANUP_COMMAND}}` | Server kill command | `pkill -f "node"` |
| `{{PLACEHOLDER_FULL_TEST_COMMAND}}` | Full test suite | `npm test` |
| `{{PLACEHOLDER_PROJECT_LAYERS}}` | Your architecture | "UI, API, Database" |

**Checklist:**
- [ ] All `{{PLACEHOLDER_*}}` markers replaced
- [ ] Save file
- [ ] No template markers remain

### 4.3: Customize Other Files (if copied from NOOR CANVAS)

**In each copied file, find and replace:**

| Find This | Replace With |
|-----------|--------------|
| `NOOR CANVAS` | Your project name |
| `NoorCanvas` | YourProjectName |
| `noor-canvas` | your-project-name |
| `9091` | Your port number |
| `.NET 8` | Your framework version |
| `Blazor` | Your UI framework |

**Files to update:**
- [ ] `SelfAwareness.instructions.md`
- [ ] `SystemStructureSummary.md`
- [ ] `ValidationFramework.md`
- [ ] All agent prompts

---

## 🏗️ Step 5: Create Workspace Structure

### 5.1: Create Directories

```powershell
# Navigate to your project root
cd "C:\YourProject"

# Create workspace structure
New-Item -Path "Workspaces\Copilot\prompts.keys\_template" -ItemType Directory -Force
New-Item -Path "Workspaces\Copilot\learning\patterns" -ItemType Directory -Force
New-Item -Path "Workspaces\Copilot\config" -ItemType Directory -Force
New-Item -Path "Workspaces\Copilot\_DOCS\summaries" -ItemType Directory -Force
New-Item -Path "Workspaces\Copilot\_DOCS\analysis" -ItemType Directory -Force
New-Item -Path "Workspaces\Copilot\_DOCS\configs" -ItemType Directory -Force
New-Item -Path "Workspaces\Copilot\_DOCS\setup" -ItemType Directory -Force
New-Item -Path "Workspaces\Copilot\artifacts" -ItemType Directory -Force
New-Item -Path "Workspaces\CodeQuality" -ItemType Directory -Force
New-Item -Path "Workspaces\Documentation\ANALYSIS_DOCS" -ItemType Directory -Force
New-Item -Path "Workspaces\Global" -ItemType Directory -Force
New-Item -Path "Workspaces\TEMP" -ItemType Directory -Force
```

**Checklist:**
- [ ] All directories created
- [ ] Verify with: `Get-ChildItem Workspaces -Recurse -Directory`

### 5.2: Initialize Learning Infrastructure

**Create pattern files:**

```powershell
# task-patterns.json
@"
{
  "version": "1.0.0",
  "lastUpdated": "$(Get-Date -Format 'yyyy-MM-ddTHH:mm:ssZ')",
  "successPatterns": [],
  "failurePatterns": [],
  "efficiencyInsights": []
}
"@ | Out-File "Workspaces\Copilot\learning\patterns\task-patterns.json" -Encoding UTF8

# refactor-patterns.json
@"
{
  "version": "1.0.0",
  "lastUpdated": "$(Get-Date -Format 'yyyy-MM-ddTHH:mm:ssZ')",
  "structuralPatterns": [],
  "namingPatterns": [],
  "performancePatterns": []
}
"@ | Out-File "Workspaces\Copilot\learning\patterns\refactor-patterns.json" -Encoding UTF8

# validation-patterns.json
@"
{
  "version": "1.0.0",
  "lastUpdated": "$(Get-Date -Format 'yyyy-MM-ddTHH:mm:ssZ')",
  "commonIssues": [],
  "knownFixes": [],
  "contractPatterns": []
}
"@ | Out-File "Workspaces\Copilot\learning\patterns\validation-patterns.json" -Encoding UTF8

# integration-patterns.json
@"
{
  "version": "1.0.0",
  "lastUpdated": "$(Get-Date -Format 'yyyy-MM-ddTHH:mm:ssZ')",
  "apiPatterns": [],
  "databasePatterns": [],
  "externalServicePatterns": []
}
"@ | Out-File "Workspaces\Copilot\learning\patterns\integration-patterns.json" -Encoding UTF8
```

**Checklist:**
- [ ] All 4 pattern files created
- [ ] Valid JSON format
- [ ] Located in `Workspaces\Copilot\learning\patterns\`

---

## 🛠️ Step 6: Install Required Tools

### 6.1: Determine What You Need

**Based on your project type:**

| Project Type | Tools Needed |
|--------------|--------------|
| **.NET** | Roslynator |
| **Web Application** | Playwright |
| **JavaScript/TypeScript** | ESLint, Prettier |
| **Python** | Pylint, Pytest |
| **Java** | SpotBugs, Checkstyle |

### 6.2: Install Tools

**For .NET projects:**
```powershell
# Install Roslynator CLI globally
dotnet tool install -g roslynator.dotnet.cli

# Verify
dotnet roslynator --version
```

**For Web Applications:**
```bash
# Install Playwright
npm install -D @playwright/test

# Install browsers
npx playwright install

# Verify
npx playwright --version
```

**For JavaScript/TypeScript:**
```bash
# Install ESLint
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin

# Install Prettier
npm install -D prettier

# Verify
npx eslint --version
npx prettier --version
```

**For Python:**
```bash
# Install Pylint
pip install pylint

# Install Pytest
pip install pytest

# Verify
pylint --version
pytest --version
```

**Checklist:**
- [ ] Required tools identified
- [ ] All tools installed successfully
- [ ] Versions verified

### 6.3: Create Tool Configuration Files

**For Roslynator (.NET):**
```powershell
# Create directory
New-Item -Path "Workspaces\CodeQuality\Roslynator\Config" -ItemType Directory -Force

# Create basic config (you'll customize later)
@"
# Roslynator Configuration
# Add rules here
"@ | Out-File "Workspaces\CodeQuality\Roslynator\Config\roslynator.config" -Encoding UTF8
```

**For ESLint (JS/TS):**
```bash
# Generate config
npx eslint --init
```

**For Prettier (JS/TS):**
```json
// Create .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

**Checklist:**
- [ ] Configuration files created
- [ ] Basic rules defined
- [ ] Tools can run successfully

---

## ✅ Step 7: Verify Installation

### 7.1: Check File Structure

```powershell
# Verify prompts
Test-Path ".github\prompts\task.prompt.md"          # Should be True
Test-Path ".github\prompts\shared\*.md"              # Should find 5 files

# Verify instructions
Test-Path ".github\instructions\SelfAwareness.instructions.md"  # Should be True

# Verify workspace
Test-Path "Workspaces\Copilot\learning\patterns\*.json"  # Should find 4 files
```

**Checklist:**
- [ ] All prompt files exist
- [ ] All shared modules exist
- [ ] Instructions exist
- [ ] Workspace structure created
- [ ] Pattern files initialized

### 7.2: Verify Build Works

```bash
# Run your build command
dotnet build        # .NET
npm run build       # Node.js
python setup.py     # Python

# Should complete with 0 errors, 0 warnings
```

**Checklist:**
- [ ] Build succeeds
- [ ] 0 errors
- [ ] 0 warnings (or document baseline)

### 7.3: Verify Tools Work

```bash
# Test Roslynator (.NET)
dotnet roslynator analyze YourProject.sln

# Test ESLint (JS/TS)
npx eslint .

# Test Prettier (JS/TS)
npx prettier --check .

# Test Pylint (Python)
pylint **/*.py
```

**Checklist:**
- [ ] Tools run without errors
- [ ] Output is readable
- [ ] Baseline issues documented (if any)

---

## 🎯 Step 8: First Test Run

### 8.1: Test Question Agent (Read-Only)

**In VS Code, open Copilot Chat and run:**

```
@workspace /question "What agents are available in this AI agent system?" depth=comprehensive
```

**Expected result:**
- Agent should read prompts directory
- List available agents
- Explain their purposes

**Checklist:**
- [ ] Command executed successfully
- [ ] Response received
- [ ] Agents listed correctly

### 8.2: Test Health Check (Read-Only)

```
@workspace /healthcheck scope=all
```

**Expected result:**
- System analysis performed
- No modifications made
- Report generated

**Checklist:**
- [ ] Command executed
- [ ] Analysis completed
- [ ] No errors encountered

### 8.3: Test Simple Task (First Real Work)

```
@workspace /task key=test-drive tasks="Add a comment to the main entry point explaining this is using the AI agent system" debug-level=none verbosity=concise
```

**Expected result:**
- Checkpoint commit created
- File modified
- Build validated
- Changes committed

**Checklist:**
- [ ] Task executed
- [ ] File modified correctly
- [ ] Build still works
- [ ] Commit created
- [ ] Key data stream created in `Workspaces/Copilot/prompts.keys/test-drive/`

---

## 📚 Step 9: Create Project Documentation

### 9.1: Document Installation

**Create:** `Workspaces/Copilot/_DOCS/setup/installation-log.md`

```markdown
# AI Agent System Installation Log

**Date:** 2025-10-11
**Project:** YourProjectName
**Installed By:** Your Name

## Installation Method
- [ ] Automated (SETUP.prompt.md)
- [x] Manual

## Tools Installed
- Roslynator: v4.x
- Playwright: v1.x
- ESLint: v8.x
- Prettier: v3.x

## Customizations Made
- Build command: npm run build
- Test command: npm test
- Server port: 3000

## Baseline Issues
- 0 build warnings
- 5 ESLint warnings (documented)

## Next Steps
- Train team on agent usage
- Create first real task
- Set up CI/CD integration
```

**Checklist:**
- [ ] Installation documented
- [ ] Tools versions recorded
- [ ] Customizations noted
- [ ] Baseline established

### 9.2: Create Usage Guide for Team

**Create:** `docs/AI-AGENT-USAGE.md`

```markdown
# AI Agent System - Team Usage Guide

## Quick Reference

### Implementing Features
@workspace /task key=feature-name tasks="description"

### Improving Code
@workspace /refactor scope=all

### Getting Help
@workspace /question "your question" depth=comprehensive

## Common Workflows
[Add your team's common patterns]

## Troubleshooting
[Add project-specific troubleshooting]
```

**Checklist:**
- [ ] Team guide created
- [ ] Common commands documented
- [ ] Examples added

---

## 🎓 Step 10: Team Training (Optional)

### 10.1: Training Checklist

**For each team member:**

- [ ] Review START-HERE.md
- [ ] Understand agent purposes
- [ ] Practice with question agent
- [ ] Try simple task
- [ ] Review commit message format
- [ ] Understand debug levels
- [ ] Know rollback procedure

### 10.2: Create Training Tasks

**Practice tasks for learning:**

1. **Question Agent:**
   ```
   @workspace /question "How do I use the task agent?" depth=standard
   ```

2. **Simple Task:**
   ```
   @workspace /task key=training tasks="Add your name to CONTRIBUTORS.md"
   ```

3. **Health Check:**
   ```
   @workspace /healthcheck scope=all
   ```

**Checklist:**
- [ ] Training plan created
- [ ] Practice tasks defined
- [ ] Team members trained

---

## 🚀 Step 11: Production Readiness

### 11.1: Pre-Production Checklist

- [ ] All agents tested
- [ ] Build validation works
- [ ] Tests passing
- [ ] Documentation complete
- [ ] Team trained
- [ ] Rollback tested
- [ ] Learning infrastructure working
- [ ] CI/CD integration (optional)

### 11.2: Create Rollback Script

**Create:** `Workspaces/Global/rollback.ps1`

```powershell
param(
    [string]$Key,
    [string]$Agent = "task"
)

Write-Host "Finding checkpoint for agent: $Agent"
$Checkpoint = git log --oneline --grep="checkpoint: pre-$Agent" -1 --format="%H"

if (-not $Checkpoint) {
    Write-Error "No checkpoint found for agent: $Agent"
    exit 1
}

Write-Host "Rolling back to: $Checkpoint"
git reset --hard $Checkpoint
Write-Host "Rollback complete"
```

**Checklist:**
- [ ] Rollback script created
- [ ] Script tested
- [ ] Permissions set

### 11.3: Final Validation

```powershell
# Full system check
dotnet build                    # Build
dotnet test                     # Tests
.\Workspaces\CodeQuality\...    # Analyzers
git status                      # Clean state
```

**Checklist:**
- [ ] Build: PASS
- [ ] Tests: PASS
- [ ] Analyzers: PASS
- [ ] Git: Clean

---

## ✅ Final Checklist

### Installation Complete When:

- [x] **Files copied** - All prompts, instructions, shared modules
- [x] **Placeholders replaced** - All {{PLACEHOLDER}} markers updated
- [x] **Workspace created** - Directory structure in place
- [x] **Tools installed** - Roslynator, Playwright, etc.
- [x] **Patterns initialized** - Learning infrastructure ready
- [x] **Build works** - 0 errors, 0 warnings
- [x] **Agents tested** - Question, Task, HealthCheck
- [x] **Documentation created** - Installation log, usage guide
- [x] **Team trained** - All members can use system
- [x] **Production ready** - All validations passing

---

## 📊 Time Estimates

| Task | Estimated Time |
|------|----------------|
| **Pre-installation** | 10 minutes |
| **Copy files** | 5 minutes |
| **Read documentation** | 15 minutes |
| **Manual customization** | 20-30 minutes |
| **Create workspace** | 10 minutes |
| **Install tools** | 15-20 minutes |
| **Verify installation** | 10 minutes |
| **First tests** | 10 minutes |
| **Documentation** | 15 minutes |
| **Team training** | 30-60 minutes (per person) |
| **Total (solo)** | **~90 minutes** |
| **Total (team of 5)** | **~3-4 hours** |

---

## 🆘 Troubleshooting

### Common Issues

**Issue:** Placeholder markers still in files
**Fix:** Search for `{{` and replace all markers

**Issue:** Build fails after installation
**Fix:** Verify you didn't change any code, only added agent system

**Issue:** Agent doesn't respond
**Fix:** Check prompt files exist in `.github/prompts/`

**Issue:** Tools not found
**Fix:** Verify PATH, reinstall tools globally

**Issue:** Workspace structure missing
**Fix:** Re-run Step 5.1 to create directories

---

## 📞 Getting Help

1. **Read documentation:** `.github/_Portable/INSTALLATION-GUIDE.md`
2. **Check status:** `.github/_Portable/STATUS-AND-SUMMARY.md`
3. **Use question agent:** `@workspace /question "installation issue description"`
4. **Review NOOR CANVAS:** Original working examples

---

## 🎉 Success!

**When you see:**
- ✅ Agents responding correctly
- ✅ Tasks executing successfully
- ✅ Builds passing with 0 warnings
- ✅ Learning patterns accumulating
- ✅ Team using system confidently

**You're ready for production AI-assisted development!**

---

**Quick Start Summary:**

```powershell
# 1. Copy files
Copy-Item ".github\_Portable" -Destination "YourProject\.github\_Portable" -Recurse

# 2. Copy shared modules
Copy-Item ".github\_Portable\prompts\shared\*" -Destination ".github\prompts\shared\" -Recurse

# 3. Customize task agent
Copy-Item ".github\_Portable\prompts\task.prompt.md.template" -Destination ".github\prompts\task.prompt.md"
# Replace {{PLACEHOLDER}} markers

# 4. Create workspace
New-Item -Path "Workspaces\Copilot\learning\patterns" -ItemType Directory -Force
# (Full structure from Step 5)

# 5. Install tools
dotnet tool install -g roslynator.dotnet.cli    # .NET
npm install -D @playwright/test                  # Web apps

# 6. Test
@workspace /question "What agents are available?"
@workspace /task key=test tasks="hello world"

# 7. Success! 🚀
```

---

**Last Updated:** October 11, 2025  
**Version:** 1.0.0  
**For:** Portable AI Agent System
