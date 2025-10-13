# Quick Reference - AI Agent Commands

**Fast lookup for common agent commands and patterns.**

---

## Core Agents

### Task Executor
```
@workspace /task key=<feature> tasks="<description>"
@workspace /task key=<feature> verbosity=detailed tasks="<description>"
@workspace /task key=<feature> debug-level=simple tasks="<description>"
@workspace /task key=<feature> tasks="mark complete"
```

### Refactor Agent
```
@workspace /refactor scope=<ComponentName> tasks="<description>"
@workspace /refactor scope=<ComponentName> verbosity=detailed tasks="<description>"
```

### Sync Agent
```
@workspace /sync key=<feature>
@workspace /sync
```

### Health Check
```
@workspace /healthcheck
@workspace /healthcheck level=3
```

### Question Agent
```
@workspace /question "<your question>"
@workspace /question "How does <feature> work?"
```

### Test Generation
```
@workspace /test-generation feature=<name> scenario=<description>
@workspace /test-generation feature=<name> scenario=<description> multiUser=true
```

---

## Common Parameters

| Parameter | Values | Description |
|-----------|--------|-------------|
| `key` | Any string | Feature/work identifier (e.g., `auth`, `dashboard`) |
| `verbosity` | `concise`, `detailed` | Output detail level (default: `concise`) |
| `debug-level` | `none`, `simple`, `trace`, `cleanup` | Debug logging in code (default: `none`) |
| `tasks` | Multi-line string | Tasks to perform (use `---` to separate phases) |
| `scope` | Component/class name | Refactoring target |
| `feature` | Feature name | Test generation target |
| `scenario` | Scenario description | Test scenario |
| `multiUser` | `true`, `false` | Multi-browser testing |

---

## Common Workflows

### Start New Feature
```
@workspace /task key=notifications tasks="Implement email notification system"
```

### Fix Bug with Test
```
@workspace /task key=bugfix tasks="Fix login redirect
---
Add regression test"
```

### Multi-Phase Implementation
```
@workspace /task key=api tasks="Create new endpoint
---
Add validation
---
Update documentation
---
Generate tests"
```

### Code Quality Improvement
```
@workspace /refactor scope=AuthService tasks="Extract password validation
---
Consolidate error handling"
```

### Complete Work on Feature
```
@workspace /task key=notifications tasks="mark complete"
```

### Validate System
```
@workspace /healthcheck
```

### Sync Documentation
```
@workspace /sync key=notifications
```

### Ask About Code
```
@workspace /question "How does authentication work in this project?"
```

---

## Multi-Phase Tasks

Use `---` on its own line to separate phases:

```
@workspace /task key=dashboard tasks="Phase 1: Add chart component
---
Phase 2: Connect to backend API
---
Phase 3: Add filtering controls
---
Phase 4: Create E2E tests"
```

Each phase:
- Implemented separately
- Validated independently  
- Documented progressively
- Can be rolled back individually

---

## Debug Levels

### none (default)
Production-ready code, no debug logging.

### simple
Basic debug markers for troubleshooting:
```csharp
Logger.LogInformation("[DEBUG-WORKITEM:auth:Login] User logged in ;CLEANUP_OK");
```

### trace
Comprehensive debug markers with state:
```csharp
Logger.LogDebug("[DEBUG-WORKITEM:auth:Login] Before: user={User}, state={State} ;CLEANUP_OK", user, state);
// operation
Logger.LogDebug("[DEBUG-WORKITEM:auth:Login] After: user={User}, state={State} ;CLEANUP_OK", user, state);
```

### cleanup
Remove all debug markers:
```
@workspace /task key=auth debug-level=cleanup tasks="Remove debug logging"
```

---

## Verbosity Levels

### concise (default)
Brief summaries, essential information only.

**Output**:
- ✓ Plan summary
- ✓ Progress markers
- ✓ Success/failure status
- ✗ Detailed file contents
- ✗ Step-by-step analysis

### detailed
Full execution details and verbose analysis.

**Output**:
- ✓ Complete plan with all steps
- ✓ Detailed file analysis
- ✓ Step-by-step execution logs
- ✓ Full context dumps
- ✓ Verbose error messages

---

## Git Integration

### Checkpoint Commits
Agents automatically create rollback points:
```bash
git log --oneline  # View checkpoints
git reset --hard <sha>  # Rollback if needed
```

Pattern: `checkpoint: pre-{agent} {key}`

### Work Tracking
All commits referenced in `work-log.md` with full SHA:
```markdown
### Changes Made
- `a1b2c3d4` - feat(auth): Add login button
- `e5f6g7h8` - test(auth): Add login E2E test
```

Quick access:
```bash
git show a1b2c3d4  # View specific change
git checkout a1b2c3d4 -- path/to/file  # Restore specific file
```

---

## Workspace Structure

```
.github/prompts.keys/
├── {key1}/
│   ├── {key1}.md          # Metadata and file mappings
│   └── work-log.md        # Detailed work history
├── {key2}/
│   ├── {key2}.md
│   └── work-log.md
└── ...

Workspaces/Copilot/_DOCS/
├── summaries/             # Completion summaries
├── analysis/              # Technical analysis
└── configs/               # Configuration docs

Workspaces/CodeQuality/
└── Analyzer/
    ├── Reports/          # Analysis reports
    └── Logs/             # Execution logs

Workspaces/TEMP/          # Temporary test files
```

---

## Quick Checks

### View Available Keys
```powershell
ls .github/prompts.keys/
```

### View Work Log
```powershell
cat .github/prompts.keys/{key}/work-log.md
```

### View Recent Commits
```bash
git log --oneline -10
```

### Check Build Status
```bash
# .NET
dotnet build

# Node.js
npm run build

# Python
python manage.py check  # Django
```

### Find Debug Markers
```bash
grep -r "DEBUG-WORKITEM.*CLEANUP_OK" --include="*.cs" --include="*.js"
```

---

## Validation Pipeline

### Level 1: Build
Zero errors, zero warnings enforcement.

### Level 2: Analyzers
Code quality analysis (Roslynator, ESLint, Pylint).

### Level 3: Unit Tests
All unit tests must pass.

### Level 4: API Contracts
Cross-layer contract validation (UI ↔ API ↔ DB).

### Level 5: E2E Tests
End-to-end integration tests.

### Level 6: Documentation
Documentation sync validation.

Run all levels:
```
@workspace /healthcheck
```

Run specific level:
```
@workspace /healthcheck level=3
```

---

## Error Recovery

### Build Fails
1. Agent retries up to 3 times automatically
2. If still failing, rolls back to checkpoint
3. Review error in terminal output

### Persistent Warnings
1. Agent attempts fixes (3 retries)
2. Escalates to user if unresolved
3. Manual fix required

### Lost Context
```
@workspace /task key={key} tasks="Resume previous work"
# Agent reads work-log.md and continues
```

---

## Best Practices

### ✅ Do This
```
# Descriptive keys
@workspace /task key=user-authentication tasks="..."

# Break down large tasks
@workspace /task key=dashboard tasks="Step 1
---
Step 2
---
Step 3"

# Mark complete when done
@workspace /task key=feature tasks="mark complete"

# Use verbosity=detailed for learning
@workspace /task key=test verbosity=detailed tasks="..."
```

### ❌ Avoid This
```
# Vague keys
@workspace /task key=stuff tasks="..."

# Massive single-phase tasks
@workspace /task key=everything tasks="Build entire application"

# Leaving work incomplete
# (Always mark complete or document why stopping)

# Ignoring validation failures
# (Fix errors/warnings before proceeding)
```

---

## Platform-Specific Commands

### .NET
```powershell
# Build
dotnet build

# Test
dotnet test

# Restore
dotnet restore

# Run analyzers
dotnet build /p:RunAnalyzers=true
```

### Node.js
```bash
# Build
npm run build

# Test
npm test

# Install
npm install

# Lint
npm run lint
```

### Python
```bash
# Django
python manage.py check
python manage.py test
python manage.py migrate

# Flask
pytest
flask run
```

---

## Keyboard Shortcuts (in VS Code)

| Action | Shortcut |
|--------|----------|
| Open command palette | `Ctrl+Shift+P` |
| Trigger Copilot | `Ctrl+I` or `@workspace` |
| Accept suggestion | `Tab` |
| Dismiss suggestion | `Esc` |
| View file | `Ctrl+P` then type filename |
| Search workspace | `Ctrl+Shift+F` |
| Git commit | `Ctrl+Enter` (in source control) |

---

## Emergency Commands

### Rollback Everything
```bash
git log --oneline  # Find checkpoint
git reset --hard <checkpoint-sha>
```

### Kill Running Servers
```powershell
# .NET
Get-Process -Name dotnet | Stop-Process -Force

# Node.js
Get-Process -Name node | Stop-Process -Force

# Python
Get-Process -Name python | Stop-Process -Force
```

### Clean Workspace
```bash
# .NET
dotnet clean

# Node.js
rm -rf node_modules
npm install

# Python
find . -type d -name __pycache__ -exec rm -rf {} +
```

### Remove All Debug Markers
```
@workspace /task key=cleanup debug-level=cleanup tasks="Remove all debug logging"
```

---

## Getting Help

### In-Agent Help
```
@workspace /question "How do I use the task agent?"
@workspace /question "What parameters does refactor agent support?"
@workspace /question "How do I mark a task as complete?"
```

### Documentation
- **START-HERE.md** - Getting started guide
- **docs/AGENT-REFERENCE.md** - Complete agent documentation
- **docs/TROUBLESHOOTING.md** - Common issues
- **.github/prompts/{agent}.prompt.md** - Full agent specifications

### Validate Setup
```
@workspace /question "What agents are available?"
```

---

**Bookmark this page for quick reference!**

**Need more details?** See [START-HERE.md](START-HERE.md) or [docs/AGENT-REFERENCE.md](docs/AGENT-REFERENCE.md)
