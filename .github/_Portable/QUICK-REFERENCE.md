# Quick Reference - AI Agent System

Fast lookup for agent commands, parameters, and workflows.

---

## Agent Invocation Syntax

### Basic Pattern
```
@workspace /agent-name [parameters]
```

### With Parameters
```
@workspace /agent-name param1=value param2=value
```

### Multi-line Tasks
```
@workspace /task key=name tasks="Task 1
---
Task 2
---
Task 3"
```

---

## Agents & Commands

### Task Agent
```bash
# Basic task
@workspace /task key=feature-name tasks="Implement feature"

# Multi-phase task
@workspace /task key=feature tasks="Phase 1
---
Phase 2"

# Mark complete
@workspace /task key=feature tasks="mark complete"

# With debug logging
@workspace /task key=feature debug-level=trace tasks="..."
```

**Parameters:**
- `key` - Task identifier (required)
- `debug-level` - `none`, `simple`, `trace` (optional)
- `verbosity` - `concise`, `detailed` (optional)
- `tasks` - Task description or multi-phase list (optional)

---

### Refactor Agent
```bash
# Basic refactor
@workspace /refactor key=cleanup

# Scoped refactor
@workspace /refactor key=cleanup scope=module

# File-specific
@workspace /refactor key=cleanup scope=file
```

**Parameters:**
- `key` - Refactor identifier (required)
- `scope` - `file`, `module`, `service`, `global` (optional)
- `debug-level` - Debug output level (optional)

---

### Sync Agent
```bash
# Sync all documentation
@workspace /sync

# Sync specific docs
@workspace /sync target=architecture
@workspace /sync target=api
```

**Parameters:**
- `target` - `architecture`, `api`, `all` (optional)

---

### Healthcheck Agent
```bash
# Full health check
@workspace /healthcheck
```

**No parameters** - Runs complete system validation

---

### Question Agent
```bash
# Ask a question
@workspace /question How does authentication work?
@workspace /question Where is the API defined?
@workspace /question What testing framework do we use?
```

**No parameters** - Just ask your question

---

### Test Generation Agent
```bash
# Generate tests for a file
@workspace /test target=src/services/UserService.ts

# Specific test type
@workspace /test target=src/api/UserController.cs test-type=integration

# All test types
@workspace /test target=components/Login.tsx test-type=all
```

**Parameters:**
- `target` - File/module to test (required)
- `test-type` - `unit`, `integration`, `e2e`, `all` (optional)

---

### Learning Analysis Agent
```bash
# Analyze all learning
@workspace /analyze-learning

# Specific period
@workspace /analyze-learning period=last-week
```

**Parameters:**
- `period` - Analysis timeframe (optional)

---

### Cohesion Review Agent
```bash
# Review entire project
@workspace /cohesion-review

# Review specific scope
@workspace /cohesion-review scope=module-name
```

**Parameters:**
- `scope` - What to review (optional)

---

### Port Instructions Agent (Meta)
```bash
# Regenerate the _Portable folder
@workspace /port-instructions
```

**No parameters** - Creates/updates entire portable system  
**Use when:** You've made improvements to prompts/instructions and want to update the portable template

---

### Total Recall Agent (Meta)
```bash
# Scan project and populate templates
@workspace /total-recall
```

**No parameters** - Performs intelligent project analysis and populates all 35+ templates automatically  
**Use when:** Immediately after copying _Portable folder to a new project (first-time setup)  
**What it does:**
- Detects project type (.NET, Node.js, Python, Java)
- Extracts configuration from standard files (.sln, package.json, appsettings.json, etc.)
- Populates all {{VARIABLE}} placeholders
- Removes .template extensions
- Validates completeness

---

## Template Variables Reference

**Auto-Population:** total-recall automatically detects and populates these variables from your project.

### Project Identity
| Variable | Description | Example | Auto-Detected From |
|----------|-------------|---------|---------------------|
| `{{PROJECT_NAME}}` | Project name | "MyProject" | .sln, package.json, pom.xml |
| `{{PROJECT_TYPE}}` | Project type | ".NET", "Node.js" | File extensions, dependencies |
| `{{LANGUAGES}}` | Languages | "C#, JavaScript" | File extensions scan |
| `{{FRAMEWORKS}}` | Frameworks | "ASP.NET Core, React" | .csproj, package.json dependencies |

### Build & Test
| Variable | Description | Example | Auto-Detected From |
|----------|-------------|---------|---------------------|
| `{{BUILD_COMMAND}}` | Build command | "dotnet build" | Project type detection |
| `{{TEST_COMMAND}}` | Test command | "npm test" | package.json scripts, test frameworks |
| `{{RUN_COMMAND}}` | Run command | "dotnet run" | Project type, launch settings |
| `{{LINT_COMMAND}}` | Lint command | "npm run lint" | package.json scripts, .eslintrc |

### Database
| Variable | Description | Example | Auto-Detected From |
|----------|-------------|---------|---------------------|
| `{{DATABASE_NAME}}` | Database name | "MyApp_DB" | Connection strings, appsettings.json |
| `{{DATABASE_SERVER}}` | Server | "localhost" | Connection strings, .env |
| `{{DATABASE_TYPE}}` | Type | "SQL Server" | Connection string format, packages |
| `{{SCHEMA_PRIMARY}}` | Writable schema | "dbo" | Default conventions, migrations |
| `{{SCHEMA_READONLY}}` | Read-only schemas | "ref, legacy" | Manual (rarely auto-detectable) |
| `{{CONNECTION_STRING_KEY}}` | Config key | "DefaultConnection" | appsettings.json, .env |

### Infrastructure
| Variable | Description | Example | Auto-Detected From |
|----------|-------------|---------|---------------------|
| `{{API_BASE_URL}}` | API base URL | "https://localhost:5001/api" | launchSettings.json, .env |
| `{{APP_PORT}}` | App port | "5000" | launchSettings.json, package.json |
| `{{REALTIME_TECH}}` | Real-time tech | "SignalR" | Dependencies, hub files |
| `{{UI_FRAMEWORK}}` | UI framework | "React" | package.json, .csproj |
| `{{AUTH_TYPE}}` | Auth type | "JWT" | Middleware, packages |

### Paths
| Variable | Description | Example | Auto-Detected From |
|----------|-------------|---------|---------------------|
| `{{SOURCE_PATH}}` | Source path | "src/" | Directory structure scan |
| `{{TEST_PATH}}` | Test path | "tests/" | Test framework detection |
| `{{CONFIG_PATH}}` | Config path | "config/" | Configuration file locations |
| `{{WORKSPACE_PATH}}` | Workspace | "Workspaces/" | Convention or creation |

### Tools & Quality
| Variable | Description | Example | Auto-Detected From |
|----------|-------------|---------|---------------------|
| `{{ANALYZER_TOOLS}}` | Analyzers | "Roslynator, StyleCop" | .editorconfig, package references |
| `{{TEST_FRAMEWORK}}` | Testing | "xUnit, Playwright" | Package dependencies |
| `{{PACKAGE_MANAGER}}` | Packages | "NuGet", "npm" | Project type detection |

### Branch Strategy
| Variable | Description | Example | Auto-Detected From |
|----------|-------------|---------|---------------------|
| `{{PRODUCTION_BRANCH}}` | Prod branch | "master" | Git config, convention |
| `{{DEVELOPMENT_BRANCH}}` | Dev branch | "development" | Git branch list |
| `{{DEPLOYMENT_SCRIPT}}` | Deploy script | "Scripts/deploy.ps1" | Script directory scan |

### Additional
| Variable | Description | Example | Auto-Detected From |
|----------|-------------|---------|---------------------|
| `{{API_COUNT}}` | API count | "52" | Controller/route scanning |
| `{{SERVICE_COUNT}}` | Service count | "17" | Service class scanning |
| `{{LAUNCH_SCRIPT}}` | Launch script | "./run.ps1" | Script directory scan |
| `{{BUILD_LAUNCH_SCRIPT}}` | Build+Launch | "./build-and-run.ps1" | Script directory scan |

**Total:** 35+ template variables automatically populated by total-recall!

---

## Common Patterns

### Implementing a Feature
```bash
# 1. Create implementation
@workspace /task key=login tasks="Implement login form"

# 2. Add tests
@workspace /test target=src/auth/Login.tsx

# 3. Check health
@workspace /healthcheck

# 4. Mark complete
@workspace /task key=login tasks="mark complete"
```

### Fixing a Bug
```bash
# 1. Fix bug with test
@workspace /task key=bug-123 tasks="Fix null ref
---
Add regression test"

# 2. Validate
@workspace /healthcheck

# 3. Update docs
@workspace /sync
```

### Code Cleanup
```bash
# 1. Refactor
@workspace /refactor key=cleanup scope=service

# 2. Review quality
@workspace /cohesion-review

# 3. Extract learnings
@workspace /analyze-learning
```

---

## Keyboard Shortcuts

### VS Code
- `Ctrl+I` or `Cmd+I` - Open Copilot Chat
- `Ctrl+Shift+I` or `Cmd+Shift+I` - Inline Chat
- Type `@workspace` to invoke agents

### Chat Shortcuts
- `@workspace` - Workspace agent
- `/task` - Task execution
- `/question` - Ask questions
- `---` - Phase separator in multi-line

---

## File Locations Reference

### Core Instructions
```
.github/instructions/SelfAwareness.instructions.md
.github/instructions/Links/SystemIndex.md
.github/instructions/Links/Architecture.md
.github/instructions/Links/InfrastructureQuickRef.md
```

### Agent Prompts
```
.github/prompts/task.prompt.md
.github/prompts/refactor.prompt.md
.github/prompts/sync.prompt.md
.github/prompts/healthcheck.prompt.md
.github/prompts/question.prompt.md
.github/prompts/test-generation.prompt.md
.github/prompts/analyze-learning.prompt.md
.github/prompts/cohesion-review.prompt.md
```

### Shared Documentation
```
.github/prompts/shared/*.md
```

### Learning System
```
.github/learning/README.md
.github/learning/PATTERN_SCHEMA.md
.github/learning/patterns/*.json
.github/learning/insights/*.json
.github/learning/recommendations/*.md
```

### Workspaces
```
Workspaces/Copilot/_DOCS/
Workspaces/Copilot/prompts.keys/
Workspaces/CodeQuality/
Workspaces/TEMP/
```

---

## Validation Commands

### Build
```bash
# .NET
dotnet build

# Node.js
npm run build

# Python
python -m build

# Java
mvn clean install
```

### Test
```bash
# .NET
dotnet test

# Node.js
npm test

# Python
pytest

# Java
mvn test
```

### Lint
```bash
# .NET
dotnet format --verify-no-changes

# Node.js
npm run lint

# Python
flake8

# Java
mvn checkstyle:check
```

---

## Troubleshooting Quick Fixes

### Setup Issues
```powershell
# Fix execution policy
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy Bypass

# Re-run setup
./setup.ps1
```

### Build Failures
```bash
# Check healthcheck
@workspace /healthcheck

# Review errors
@workspace /question Why is the build failing?
```

### Test Failures
```bash
# Regenerate tests
@workspace /test target=[failing-module]

# Check patterns
.github/learning/error-patterns.json
```

### Documentation Out of Sync
```bash
# Sync everything
@workspace /sync

# Sync specific
@workspace /sync target=architecture
```

---

## Best Practices

### ✅ Do
- Use descriptive key names
- Create checkpoint commits
- Run healthcheck before completion
- Update learning system regularly
- Keep documentation synchronized

### ❌ Don't
- Skip branch verification
- Ignore build warnings
- Commit without tests
- Skip documentation updates
- Ignore failed validations

---

## Getting More Help

### Documentation
- **README.md** - System overview
- **START-HERE.md** - Getting started
- **COMPLETE.md** - Setup checklist
- **STATUS.md** - Version info

### In-Chat Help
```
@workspace /question [your specific question]
```

---

**Quick Reference v1.0.0** | Always keep this handy!
