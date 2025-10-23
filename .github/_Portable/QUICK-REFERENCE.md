# Quick Reference - AI Agent Commands

**Fast lookup for all agent invocations and parameters.**

---

## 🚀 Entry Point Agents

### `/handoff` - Main Entry Point

**Purpose**: Route any work request to the appropriate specialized agent.

**Syntax**:
```
@workspace /handoff "Your task description"
```

**Examples**:
```
@workspace /handoff "Fix the login bug on mobile"
@workspace /handoff "Add dark mode toggle to settings page"
@workspace /handoff "Optimize database query performance"
@workspace /handoff "Refactor UserService to use dependency injection"
```

**Parameters**: None (just provide task description in quotes)

---

### `/create-plan` - Planning Agent

**Purpose**: Create detailed execution plan for complex, multi-step work.

**Syntax**:
```
@workspace /create-plan "Goal description"
```

**Examples**:
```
@workspace /create-plan "Implement JWT authentication with refresh tokens"
@workspace /create-plan "Migrate from monolith to microservices"
@workspace /create-plan "Add real-time notifications system"
```

**Output**: Generates execution plan with phases and handoff commands for you to run.

**When to Use**: Complex features (3+ steps), architectural changes, migrations.

---

### `/test-generation` - Test Generator

**Purpose**: Generate Playwright or unit tests for features or files.

**Syntax**:
```
@workspace /test-generation feature="feature_name" framework=test_framework [options]
@workspace /test-generation file="FilePath.ext" framework=test_framework [options]
```

**Required Parameters**:
- `feature` OR `file`: What to test
- `framework`: Test framework to use

**Optional Parameters**:
- `include_edge_cases=true|false` (default: false)
- `output_path="custom/path"` (default: auto-detected)

**Supported Frameworks**:
- `playwright` - UI tests
- `xunit` - .NET unit tests
- `nunit` - .NET unit tests
- `jest` - JavaScript unit tests
- `pytest` - Python unit tests
- `junit` - Java unit tests

**Examples**:
```
@workspace /test-generation feature="login" framework=playwright
@workspace /test-generation file="UserService.cs" framework=xunit include_edge_cases=true
@workspace /test-generation feature="checkout" framework=jest output_path="tests/integration"
```

---

### `/healthcheck` - System Validation

**Purpose**: Validate AI agent system configuration and health.

**Syntax**:
```
@workspace /healthcheck
```

**What It Checks**:
- Agent configuration files
- Template variable replacement
- Database connection rules
- File structure integrity
- Learning system status

**No parameters required.**

---

### `/port-instructions` - Template Updater

**Purpose**: Update portable templates from current project improvements.

**Syntax**:
```
# Full regeneration (default)
@workspace /port-instructions

# Selective update for specific prompt
@workspace /port-instructions prompt=task.prompt.md
@workspace /port-instructions prompt=refactor
```

**Parameters**:
- `prompt` (optional): Specific prompt file to update

**When to Use**: After major improvements to AI system, periodic maintenance.

---

## 🔧 Internal Agents

*These agents are called by other agents. You typically don't invoke them directly.*

### Knowledge Management

#### `/analyze-learning`
**Purpose**: Review learning patterns and generate recommendations.  
**Invoked By**: Periodic reviews, handoff agent.

#### `/total-recall`
**Purpose**: Project configuration and template population.  
**Invoked By**: Setup, configuration updates.  
**Can Invoke Directly**: Yes, during initial setup or reconfiguration.

**Syntax**:
```
@workspace /total-recall
```

---

### Quality & Refactoring

#### `/refactor`
**Purpose**: Code refactoring with pattern detection.  
**Invoked By**: handoff agent when refactoring requested.

#### `/cohesion-review`
**Purpose**: Architectural and cohesion analysis.  
**Invoked By**: handoff agent for architectural reviews.

---

### Operations

#### `/sync`
**Purpose**: Synchronize files across project.  
**Invoked By**: Automatic, when file sync needed.

#### `/commit`
**Purpose**: Create checkpoint commits with standardized messages.  
**Invoked By**: task agent after each phase.

---

### Communication

#### `/ask`
**Purpose**: Ask clarifying questions to user.  
**Invoked By**: Any agent needing clarification.

---

### Utility

#### `/cleanup`
**Purpose**: Clean up background processes (terminals, servers).  
**Invoked By**: Automatic at agent completion.

---

## 📋 Common Task Patterns

### Pattern 1: Quick Bug Fix
```
@workspace /handoff "Fix null reference exception in LoginController line 45"
```

### Pattern 2: Feature Implementation (Simple)
```
@workspace /handoff "Add export to CSV button on reports page"
```

### Pattern 3: Feature Implementation (Complex)
```
# Step 1: Create plan
@workspace /create-plan "Implement user role-based access control system"

# Step 2: Review plan output
# Step 3: Copy and run provided handoff command
```

### Pattern 4: Refactoring
```
@workspace /handoff "Refactor OrderService to use repository pattern"
```

### Pattern 5: Database Changes
```
@workspace /handoff "Add IsActive column to Users table with migration script"
```

### Pattern 6: Test Generation
```
# For feature
@workspace /test-generation feature="user-registration" framework=playwright

# For specific file
@workspace /test-generation file="PaymentService.cs" framework=xunit include_edge_cases=true
```

### Pattern 7: Performance Optimization
```
@workspace /handoff "Optimize database queries in DashboardController"
```

### Pattern 8: System Health Check
```
@workspace /healthcheck
```

---

## 🎯 Parameter Reference

### Test Generation Parameters

| Parameter | Type | Required | Values | Default |
|-----------|------|----------|--------|---------|
| `feature` | string | Yes* | Feature name | - |
| `file` | string | Yes* | File path | - |
| `framework` | string | Yes | See frameworks below | - |
| `include_edge_cases` | boolean | No | true, false | false |
| `output_path` | string | No | Custom path | Auto-detected |

*Either `feature` OR `file` required, not both.

### Supported Test Frameworks

| Framework | Language | Type | Example |
|-----------|----------|------|---------|
| `playwright` | JavaScript/TypeScript | UI | E2E browser tests |
| `xunit` | C# | Unit | .NET unit tests |
| `nunit` | C# | Unit | .NET unit tests |
| `jest` | JavaScript | Unit | JS/TS unit tests |
| `pytest` | Python | Unit | Python tests |
| `junit` | Java | Unit | Java tests |

### Port Instructions Parameters

| Parameter | Type | Required | Values | Default |
|-----------|------|----------|--------|---------|
| `prompt` | string | No | Prompt filename | - (full regen) |

---

## 📦 Template Variables

When running `/total-recall`, these variables are auto-populated:

### Project Identity
- `{{PROJECT_NAME}}` - Project name
- `{{PROJECT_TYPE}}` - Technology stack
- `{{LANGUAGES}}` - Programming languages
- `{{FRAMEWORKS}}` - Frameworks/libraries

### Build & Test
- `{{BUILD_COMMAND}}` - Build command
- `{{TEST_COMMAND}}` - Test command
- `{{RUN_COMMAND}}` - Run command
- `{{LINT_COMMAND}}` - Lint command

### Database
- `{{DATABASE_TYPE}}` - Database system
- `{{DATABASE_NAME}}` - Database name
- `{{DATABASE_SERVER}}` - Server name
- `{{SCHEMA_PRIMARY}}` - Writable schema
- `{{SCHEMA_READONLY}}` - Read-only schemas
- `{{CONNECTION_STRING_KEY}}` - Config key

### Infrastructure
- `{{API_BASE_URL}}` - API URL
- `{{UI_FRAMEWORK}}` - UI framework
- `{{REALTIME_TECH}}` - Real-time tech
- `{{AUTH_TYPE}}` - Authentication

### Paths
- `{{SOURCE_PATH}}` - Source code path
- `{{TEST_PATH}}` - Test files path
- `{{CONFIG_PATH}}` - Config files path
- `{{WORKSPACE_PATH}}` - Workspace root

### Tools
- `{{ANALYZER_TOOLS}}` - Code analyzers
- `{{TEST_FRAMEWORK}}` - Testing framework
- `{{PACKAGE_MANAGER}}` - Package manager

---

## 🔍 Troubleshooting Commands

### Check System Health
```
@workspace /healthcheck
```

### Reconfigure Project
```
@workspace /total-recall
```

### Test Simple Task
```
@workspace /handoff "Add a comment to README.md"
```

### Validate Database Config
Check `.github/instructions/Links/InfrastructureQuickRef.md` for database settings.

### Validate Build Commands
Check `.github/instructions/SelfAwareness.instructions.md` for command settings.

---

## 💡 Tips

### Tip 1: Be Specific
More specific task descriptions = better results.

❌ Bad: "Fix the bug"  
✅ Good: "Fix null reference in UserController.cs GetProfile method"

### Tip 2: Use create-plan for Complex Work
Don't overwhelm handoff with multi-step requirements. Use create-plan first.

### Tip 3: Let Agents Commit
Agents create checkpoint commits automatically. Don't interrupt the workflow.

### Tip 4: Review Learning
Check `.github/learning/recommendations/active-recommendations.md` periodically.

### Tip 5: Start with Handoff
When unsure which agent to use, start with `/handoff`. It routes correctly.

---

## 📖 Documentation Files

| File | Purpose |
|------|---------|
| `README.md` | System overview |
| `START-HERE.md` | Quick start guide |
| `QUICK-REFERENCE.md` | This file |
| `STATUS.md` | Compatibility status |
| `COMPLETE.md` | Setup checklist |

---

## 🎓 Learning More

### Review Agent Source
Agents are defined in `.github/prompts/`. Read them to understand behavior.

### Check Learning Patterns
`.github/learning/patterns/` contains accumulated patterns from project work.

### Read Architecture
`.github/instructions/Links/Architecture.md` explains the system design.

### Explore Shared Docs
`.github/prompts/shared/` contains reusable documentation referenced by agents.

---

**Quick Start**: Try this command first:

```
@workspace /handoff "Add a test function that prints 'Hello, AI Agents!'"
```

Then explore other agents as needed! 🚀
