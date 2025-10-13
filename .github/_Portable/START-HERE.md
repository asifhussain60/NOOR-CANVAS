# START HERE - Portable AI Agent System

**Welcome!** This guide will get you from zero to fully operational in under 10 minutes.

---

## ⚡ Super Quick Start (3 Steps)

```powershell
# Step 1: Navigate to this folder
cd .github\_Portable

# Step 2: Run setup
.\setup.bat

# Step 3: Test it works
# In VS Code, type: @workspace /question "What agents are available?"
```

**Done!** Skip to [Using the Agents](#using-the-agents) below.

---

## 📋 What Just Happened?

The setup script:
1. ✅ Detected your project type (.NET, Node.js, Python, etc.)
2. ✅ Created workspace folders
3. ✅ Generated 6 AI agent configurations
4. ✅ Installed development tools (Roslynator, Playwright, etc.)
5. ✅ Created PROJECT-SETUP-SUMMARY.md in your project root

---

## 🤖 Meet Your 6 AI Agents

### 1. Task Executor (`@workspace /task`)
**What**: Builds features, fixes bugs, implements changes  
**When**: Any development work  
**Example**:
```
@workspace /task key=auth tasks="Add login button to homepage"
```

**Key Features**:
- Progressive documentation (updates after each sub-task)
- Automatic test generation for UI changes
- Zero errors/warnings enforcement
- Git commit tracking

---

### 2. Refactor Agent (`@workspace /refactor`)
**What**: Improves code quality without changing behavior  
**When**: Technical debt, code smells, duplication  
**Example**:
```
@workspace /refactor scope=UserService tasks="Extract validation logic"
```

**Key Features**:
- Warning-free commits (0E/0W policy)
- Systematic refactoring workflow
- Pattern extraction to learning library

---

### 3. Sync Agent (`@workspace /sync`)
**What**: Keeps documentation in sync with code  
**When**: After major changes, before releases  
**Example**:
```
@workspace /sync key=auth
```

**Key Features**:
- Validates documentation matches implementation
- Updates cross-references automatically
- Detects stale information

---

### 4. Health Check Agent (`@workspace /healthcheck`)
**What**: Validates entire system integrity  
**When**: Before commits, after major changes, weekly  
**Example**:
```
@workspace /healthcheck
```

**Key Features**:
- 6-level validation pipeline
- Build, analyzers, tests, contracts, E2E, docs
- Comprehensive reporting

---

### 5. Question Agent (`@workspace /question`)
**What**: Answers questions about your codebase  
**When**: Understanding architecture, finding patterns  
**Example**:
```
@workspace /question "How does user authentication work?"
```

**Key Features**:
- Context-aware responses
- Searches code and documentation
- Learns from your project patterns

---

### 6. Test Generation Agent (`@workspace /test-generation`)
**What**: Creates end-to-end tests  
**When**: New features, bug fixes, integration testing  
**Example**:
```
@workspace /test-generation feature=login scenario=success-flow multiUser=true
```

**Key Features**:
- Playwright/Selenium integration
- Multi-browser testing support
- Follows proven patterns

---

## 📁 Understanding the Workspace

Your project now has this structure:

```
Your Project/
├── .github/
│   ├── _Portable/              ← This folder (keep for updates)
│   ├── prompts/                ← Agent configurations (generated)
│   └── instructions/           ← System rules (generated)
│
├── Workspaces/
│   ├── Copilot/
│   │   ├── _DOCS/             ← Summaries and analysis
│   │   ├── config/            ← Agent settings
│   │   ├── learning/          ← Pattern library
│   │   └── prompts.keys/      ← Work tracking (one folder per feature)
│   ├── CodeQuality/           ← Analysis reports
│   └── TEMP/                  ← Temporary test files
│
└── PROJECT-SETUP-SUMMARY.md   ← Your project configuration
```

**Key Concepts**:

### Keys (`key=myfeature`)
Think of keys as "feature folders" for tracking work:
- `key=auth` → All authentication work
- `key=dashboard` → All dashboard work
- `key=bugfix` → Bug fixes

Each key gets its own folder in `.github/prompts.keys/{key}/` containing:
- `{key}.md` - Metadata and file mappings
- `work-log.md` - Detailed work history with git SHAs
- Test files and documentation

### Progressive Documentation
Agents update `work-log.md` **after every sub-task**, not just at completion:
- Timestamped entries
- Git commit references
- File change history
- Cumulative audit trail

### Zero-Tolerance Quality
All agents enforce:
- 0 compilation errors
- 0 compiler warnings  
- 0 analyzer warnings
- **Automatic rollback** if violations persist after 3 retries

---

## 🎯 Using the Agents

### Basic Task Workflow

```
# 1. Start a new feature
@workspace /task key=myfeature tasks="Implement user profile page"

# Agent will:
# - Create checkpoint commit
# - Verify previous work (if any)
# - Present implementation plan
# - Wait for your approval

# 2. Approve the plan
# Type: "yes" or "approved"

# Agent will:
# - Implement changes
# - Generate tests (if UI changes)
# - Update documentation
# - Commit with git SHA tracking

# 3. Mark complete when done
@workspace /task key=myfeature tasks="mark complete"

# Agent will:
# - Document final workflow across all layers
# - Remove debug logging and obsolete info
# - Mark key as complete
```

### Multi-Step Tasks

Use `---` to separate phases:

```
@workspace /task key=api tasks="Add new endpoint
---
Update API documentation
---
Create integration tests"

# Each phase:
# - Implemented separately
# - Documented progressively
# - Validated independently
```

### Resuming Work

Keys track work across sessions:

```
# Day 1
@workspace /task key=dashboard tasks="Add charts"
# ... work happens ...

# Day 2 (same key)
@workspace /task key=dashboard tasks="Add filters"
# Agent remembers previous work, continues same context
```

---

## 🔍 Common Scenarios

### Scenario 1: Fix a Bug

```
@workspace /task key=bugfix tasks="Fix login redirect issue on homepage"

# Agent will:
# - Analyze the issue
# - Propose fix
# - Generate E2E test to prevent regression
# - Update documentation
```

### Scenario 2: Improve Code Quality

```
@workspace /refactor scope=AuthService tasks="Extract password validation logic to shared utility"

# Agent will:
# - Create checkpoint
# - Extract logic without changing behavior
# - Ensure 0 warnings/errors
# - Update callers
# - Document pattern in learning library
```

### Scenario 3: Add New Feature with Tests

```
@workspace /task key=notifications tasks="Add email notification system
---
Create E2E tests for email sending
---
Update architecture documentation"

# Each phase done sequentially with validation
```

### Scenario 4: Validate Before Release

```
@workspace /healthcheck

# Runs full validation:
# Level 1: Build (0E/0W)
# Level 2: Analyzers (Roslynator, ESLint)
# Level 3: Unit tests
# Level 4: API contracts
# Level 5: E2E tests
# Level 6: Documentation sync
```

---

## ⚙️ Configuration

### Verbosity Control

```
# Concise output (default)
@workspace /task key=auth tasks="..."

# Detailed output (full execution details)
@workspace /task key=auth verbosity=detailed tasks="..."
```

### Debug Logging

```
# No debug markers (default, production-ready)
@workspace /task key=auth tasks="..."

# Simple debug markers for troubleshooting
@workspace /task key=auth debug-level=simple tasks="..."

# Comprehensive debug markers
@workspace /task key=auth debug-level=trace tasks="..."

# Remove all debug markers
@workspace /task key=auth debug-level=cleanup tasks="Remove debug logging"
```

---

## 📚 Next Steps

### 1. Verify Setup
```
@workspace /question "What agents are available?"
```
Should list all 6 agents.

### 2. Review Your Configuration
Open `PROJECT-SETUP-SUMMARY.md` in your project root to see:
- Detected project type
- Build/test commands
- Agent configurations

### 3. Try a Simple Task
```
@workspace /task key=test tasks="Add a comment to README explaining this is a test"
```

### 4. Explore Documentation
- **[QUICK-REFERENCE.md](QUICK-REFERENCE.md)** - Command cheat sheet
- **[docs/AGENT-REFERENCE.md](docs/AGENT-REFERENCE.md)** - Detailed agent docs
- **[.github/prompts/task.prompt.md](..prompts/task.prompt.md)** - Full task agent specification

---

## 🆘 Troubleshooting

### "Agents don't respond"
1. Check `.github/prompts/` folder exists
2. Restart VS Code
3. Verify Copilot is enabled

### "Build validation fails"
1. Run your build command manually: `dotnet build` or `npm run build`
2. Fix all errors and warnings
3. Agents enforce strict 0E/0W policy

### "Can't find key metadata"
Keys are created automatically on first use. If key folder missing:
1. Let agent create it
2. Or manually create: `.github/prompts.keys/{key}/`

**More help**: [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)

---

## 💡 Pro Tips

### Tip 1: Use Descriptive Keys
```
✅ key=user-authentication
❌ key=feature1
```

### Tip 2: Break Down Large Tasks
```
@workspace /task key=dashboard tasks="Add chart component
---
Connect to API
---
Add filters
---
Create tests"
```

### Tip 3: Mark Complete When Done
```
@workspace /task key=myfeature tasks="mark complete"
```
This documents final state and cleans up obsolete info.

### Tip 4: Learn from Patterns
Check `Workspaces/Copilot/learning/` for proven patterns from your project.

### Tip 5: Use Version Control
All changes are git-tracked. You can always rollback:
```powershell
git log --oneline  # Find checkpoint commit
git reset --hard <sha>  # Rollback if needed
```

---

## 🎓 Learning More

### Deep Dives
- **Task Agent**: `.github/prompts/task.prompt.md` - Complete specification with all features
- **Refactor Agent**: `.github/prompts/refactor.prompt.md` - Systematic refactoring workflow
- **Validation Framework**: `.github/instructions/ValidationFramework.md` - 6-level validation details

### Advanced Topics
- **[docs/ADVANCED-USAGE.md](docs/ADVANCED-USAGE.md)** - Advanced patterns and workflows
- **[docs/AGENT-REFERENCE.md](docs/AGENT-REFERENCE.md)** - Complete agent reference

---

## ✅ Quick Start Checklist

- [ ] Ran `.\setup.bat` successfully
- [ ] Saw PROJECT-SETUP-SUMMARY.md created
- [ ] Tested with `@workspace /question "What agents are available?"`
- [ ] Reviewed `.github/prompts/` folder
- [ ] Tried a simple task
- [ ] Read QUICK-REFERENCE.md

**All checked?** You're ready to build! 🚀

---

**Questions?** Try: `@workspace /question "How do I..."`

**Problems?** See: [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)

**Ready for more?** See: [docs/ADVANCED-USAGE.md](docs/ADVANCED-USAGE.md)
