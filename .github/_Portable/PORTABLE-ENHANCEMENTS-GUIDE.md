# Portable AI Agent System - Enhancement Guide

**Version**: 1.0.0  
**Created**: October 24, 2025  
**Source Project**: NOOR CANVAS  
**Purpose**: Document all enhancements made to `.github` infrastructure for porting to other projects

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Directory Structure](#directory-structure)
3. [Core Enhancements](#core-enhancements)
4. [Agent System](#agent-system)
5. [Learning Infrastructure](#learning-infrastructure)
6. [Shared Protocols](#shared-protocols)
7. [Configuration System](#configuration-system)
8. [Porting Instructions](#porting-instructions)

---

## Overview

This document catalogs all enhancements made to the `.github` directory infrastructure that enable sophisticated AI agent workflows. These enhancements are **100% portable** and can be applied to any project (any language, any framework).

### What You Get

- ✅ **Multi-Agent System** - 14+ specialized agents for different task types
- ✅ **Auto-Configuration** - Detects project type and configures automatically
- ✅ **Learning System** - Accumulates patterns from successes and failures
- ✅ **Database Protection** - Schema-level access control
- ✅ **Testing Integration** - Playwright and unit test generation
- ✅ **Code Quality** - Lint and analyzer integration
- ✅ **Git Integration** - Automatic checkpoint commits
- ✅ **Error Recovery** - Rollback and retry mechanisms
- ✅ **Template System** - Variable substitution for any tech stack

### Technology Support

**Fully Tested:**
- .NET (C#, F#, ASP.NET Core, Blazor, Entity Framework)
- JavaScript/TypeScript (React, Vue, Angular, Node.js, Express)

**Supported (Template Ready):**
- Python (Flask, Django, FastAPI)
- Java (Spring Boot, Jakarta EE)
- Ruby (Rails, Sinatra)
- Go (standard library, Gin, Echo)
- PHP (Laravel, Symfony)

---

## Directory Structure

```
.github/
├── _Portable/                          # 🆕 PORTABLE SYSTEM
│   ├── README.md                       # Quick start guide
│   ├── START-HERE.md                   # 3-step setup instructions
│   ├── QUICK-REFERENCE.md              # Command cheat sheet
│   ├── STATUS.md                       # Compatibility matrix
│   ├── COMPLETE.md                     # Setup verification checklist
│   ├── generate-templates.ps1          # Template generation script
│   └── instructions/                   # Template instruction files
│       └── Links/                      # Template link files
│
├── instructions/                       # 🔧 PROJECT INSTRUCTIONS
│   ├── SelfAwareness.instructions.md   # Global operating rules (v2.5.0)
│   ├── DatabaseEnvironmentGuard.md     # Database protection rules
│   ├── HostProvisioner-Environment.md  # Environment-specific rules
│   └── Links/                          # Quick reference documentation
│       ├── SystemIndex.md              # Central navigation hub
│       ├── Architecture.md             # System architecture
│       ├── InfrastructureQuickRef.md   # Database & API reference
│       ├── PlaywrightQuickRef.md       # Testing guide
│       ├── ValidationFramework.md      # Quality pipeline
│       ├── API-Contract-Validation.md  # Contract validation
│       ├── FunctionalityRegistry.md    # Feature tracking
│       └── PromptEnhancementLibraries.md # Enhancement docs
│
├── prompts/                            # 🤖 AGENT PROMPTS
│   ├── handoff.prompt.md               # Main entry point agent
│   ├── create-plan.prompt.md           # Planning agent
│   ├── task.prompt.md                  # Task execution agent
│   ├── test-generation.prompt.md       # Test generator agent
│   ├── healthcheck.prompt.md           # System validation agent
│   ├── port-instructions.prompt.md     # Template updater agent
│   ├── continue.prompt.md              # Continue workflow agent
│   ├── README.md                       # Prompt system documentation
│   │
│   ├── internal/                       # Internal agents (called by others)
│   │   ├── comm/                       # Communication agents
│   │   │   └── ask.prompt.md           # Clarifying questions
│   │   ├── knowledge/                  # Knowledge management
│   │   │   ├── analyze-learning.prompt.md  # Pattern analysis
│   │   │   └── total-recall.prompt.md  # Project configuration
│   │   ├── ops/                        # Operations agents
│   │   │   ├── commit.prompt.md        # Git operations
│   │   │   └── sync.prompt.md          # File synchronization
│   │   ├── quality/                    # Quality agents
│   │   │   ├── refactor.prompt.md      # Code refactoring
│   │   │   └── cohesion-review.prompt.md # Architecture review
│   │   └── util/                       # Utility agents
│   │       └── cleanup.prompt.md       # Process cleanup
│   │
│   ├── shared/                         # 🔗 SHARED PROTOCOLS
│   │   ├── agent-handoff-protocol.md   # Agent-to-agent handoff spec
│   │   ├── commit-checkpoint-protocol.md # Git checkpoint rules
│   │   ├── commit-message-format.md    # Commit conventions
│   │   ├── clean-exit-guarantee.md     # Clean termination rules
│   │   ├── completion-workflow-template.md # Task completion template
│   │   ├── CONCISE-MANDATE.md          # Output brevity rules
│   │   ├── context-gathering-phases.md # Context discovery phases
│   │   ├── debug-logging-mandate.md    # Debug marker rules
│   │   ├── execution-flow.md           # Execution flow patterns
│   │   ├── framework-validation-checklists.md # Framework checks
│   │   ├── high-priority-task-detection.md # Priority detection
│   │   ├── image-analysis-protocol.md  # Image processing rules
│   │   ├── learning-analysis-report-template.md # Learning reports
│   │   ├── mac-development-environment.md # macOS support
│   │   ├── mandatory-lint-validation.md # Code quality checks
│   │   ├── optimization-report-template.md # Optimization reports
│   │   ├── output-style-mandate.md     # User-facing format
│   │   ├── pattern-library-update-guide.md # Pattern maintenance
│   │   ├── phase-breakdown-patterns.md # Phase planning
│   │   ├── playwright-test-generation.md # Test generation
│   │   ├── pre-analysis-cleanup.md     # Pre-task cleanup
│   │   ├── step-0-server-cleanup.md    # Server cleanup
│   │   ├── step-1-checkpoint.md        # Initial checkpoint
│   │   ├── task-parameters-reference.md # Parameter reference
│   │   ├── test-orchestration-patterns.md # Test patterns
│   │   ├── ui-debugging-protocol.md    # UI debug rules
│   │   ├── UserDictionary.md           # Shortcut expansion
│   │   └── warning-handling-mandate.md # Warning handling
│   │
│   └── workitems/                      # (Project-specific work items)
│
├── learning/                           # 🧠 LEARNING SYSTEM
│   ├── README.md                       # Learning infrastructure docs
│   ├── PATTERN_SCHEMA.md               # Pattern file schemas
│   ├── error-patterns.json             # Known error patterns
│   ├── task-agent-lessons.md           # Agent lessons learned
│   ├── refactor-patterns-data.json     # Refactor pattern data
│   │
│   ├── patterns/                       # Success patterns
│   │   ├── task-patterns.json          # Task execution patterns
│   │   ├── refactor-patterns.json      # Refactoring patterns
│   │   ├── validation-patterns.json    # Validation patterns
│   │   ├── cleanup-patterns.json       # Cleanup patterns
│   │   ├── analyze-learning-patterns.json # Learning patterns
│   │   ├── integration-patterns.json   # Integration patterns
│   │   └── ui-layout-patterns.json     # UI patterns
│   │
│   └── recommendations/                # Improvement suggestions
│       ├── active-recommendations.md   # Current suggestions
│       └── implemented-recommendations.md # Applied learnings
│
└── prompts.keys/                       # 📊 KEY DATA STREAMS
    └── {key}/                          # Per-task tracking
        ├── {key}.plan.md               # Task plan
        ├── {key}.plan.json             # Plan metadata
        ├── work-log.md                 # Execution log
        └── rollback-index.md           # Checkpoint history
```

---

## Core Enhancements

### 1. SelfAwareness.instructions.md (v2.5.0)

**Purpose**: Global operating rules for all agents

**Key Features:**
- **Branch Strategy** - Enforces `development` branch for all work, `master` for production
- **Database Access Control** - Schema-level permissions (READ-WRITE vs READ-ONLY)
- **Shortcut Expansion** - Automatic expansion of user shortcuts via UserDictionary.md
- **Required Reading** - Mandates consultation of Architecture.md, SystemIndex.md before changes
- **Scope Definition** - Governs all agents and workflows

**Template Variables Used:**
- `{{PROJECT_NAME}}` - Project name
- `{{DATABASE_NAME}}` - Primary database
- `{{DATABASE_SERVER}}` - Database server
- `{{SCHEMA_PRIMARY}}` - Read-write schema
- `{{SCHEMA_READONLY}}` - Read-only schema

**Portability**: 100% - Auto-configured by total-recall agent

---

### 2. SystemIndex.md (v3.2.0)

**Purpose**: Central navigation hub for all architectural and configuration references

**Key Features:**
- **Auto-Update** - Automatically maintained by sync agent
- **Database Rules** - Quick reference to primary database and schema rules
- **Agent Catalog** - Lists all available agents with status
- **Quick Navigation** - Organized links to Architecture, Infrastructure, Testing, Validation docs
- **Version Tracking** - Maintains version history

**Template Variables Used:**
- `{{PROJECT_NAME}}` - Project name
- `{{DATABASE_NAME}}` - Database name
- `{{DATABASE_SERVER}}` - Database server

**Portability**: 100% - Auto-configured by total-recall agent

---

### 3. Architecture.md

**Purpose**: Comprehensive application architecture documentation

**Key Features:**
- **API Endpoint Catalog** - Complete list of all controllers and endpoints
- **Razor Pages Inventory** - All pages and components
- **Service Architecture** - Service layer documentation
- **SignalR Hub Documentation** - Real-time communication layer
- **Data Model Catalog** - Database schemas and entities
- **Authentication Flows** - Security patterns
- **Integration Patterns** - Common workflows

**Template Variables Used:**
- `{{PROJECT_NAME}}` - Project name
- `{{PROJECT_TYPE}}` - Framework type
- `{{API_BASE_URL}}` - API base URL
- `{{UI_FRAMEWORK}}` - UI framework
- `{{REALTIME_TECH}}` - Real-time technology

**Portability**: 100% - Auto-generated by total-recall agent from project structure

---

### 4. InfrastructureQuickRef.md

**Purpose**: Database connections, API endpoints, and test data reference

**Key Features:**
- **Database Connection Details** - Server, database, connection string key
- **Schema Documentation** - Schema-level access rules
- **API Endpoint List** - Quick reference for all endpoints
- **Test Data** - Known test sessions, tokens, users
- **Environment Variables** - Configuration keys

**Template Variables Used:**
- `{{DATABASE_TYPE}}` - Database type (SQL Server, PostgreSQL, etc.)
- `{{DATABASE_NAME}}` - Database name
- `{{DATABASE_SERVER}}` - Database server
- `{{CONNECTION_STRING_KEY}}` - Connection string key in config
- `{{SCHEMA_PRIMARY}}` - Primary schema
- `{{SCHEMA_READONLY}}` - Read-only schema
- `{{API_BASE_URL}}` - API base URL

**Portability**: 100% - Auto-configured by total-recall agent

---

### 5. ValidationFramework.md

**Purpose**: 6-level validation pipeline documentation

**Key Features:**
- **Level 1**: Build validation
- **Level 2**: Analyzer validation (Roslynator, ESLint, etc.)
- **Level 3**: Unit tests
- **Level 4**: Integration tests
- **Level 5**: Playwright E2E tests
- **Level 6**: Visual regression (Percy)

**Template Variables Used:**
- `{{BUILD_COMMAND}}` - Build command
- `{{TEST_COMMAND}}` - Test command
- `{{LINT_COMMAND}}` - Lint command
- `{{ANALYZER_TOOLS}}` - Code quality tools

**Portability**: 100% - Auto-configured by total-recall agent

---

## Agent System

### Entry Point Agents

#### 1. handoff.prompt.md

**Purpose**: Main entry point - routes work requests to specialized agents

**Key Features:**
- Request classification and routing
- Automatic key generation
- Plan creation and execution
- Auto-execute after 5 seconds (unless user says "review" or "cancel")
- Multi-agent orchestration
- Checkpoint commits after each phase
- Self-review loop (max 3 iterations)
- Final healthcheck validation

**Usage:**
```
@workspace /handoff "Your task description"
@workspace /handoff "Fix the login bug"
@workspace /handoff "Add dark mode toggle"
```

**Output Format:**
- 🧠 Analysis (5 bullets max)
- 📌 Summary (10 bullets max)
- 📊 Final status with Next Actions (A, B, C, D options)

**Portability**: 100% - No project-specific dependencies

---

#### 2. create-plan.prompt.md

**Purpose**: Interactive planning for complex, multi-step implementations

**Key Features:**
- Requirement refinement through questions
- Technology stack analysis
- Architecture layer identification
- Phased execution plan
- Test specifications per phase
- System Context Pack (APIs, schemas, SignalR)
- Risk assessment
- Enhancement recommendations
- **Automatic handoff to task agent** after approval

**Usage:**
```
@workspace /create-plan "Implement JWT authentication with refresh tokens"
@workspace /create-plan "Migrate from monolith to microservices"
```

**Output Files:**
- `.github/prompts.keys/{key}/{key}.plan.md` - Complete plan
- `.github/prompts.keys/{key}/{key}.plan.json` - Plan metadata
- `.github/prompts.keys/{key}/work-log.md` - Execution log

**Portability**: 100% - Auto-configures for detected tech stack

---

#### 3. task.prompt.md

**Purpose**: Task execution agent - implements work in phases

**Key Features:**
- Phase-by-phase execution
- Automatic checkpoint commits
- Error pattern matching (from learning system)
- Test generation and validation
- Self-review loop
- Rollback capability
- Work-log maintenance
- Plan integration (loads from create-plan output)

**Usage:**
```
@workspace /task key={key} github-branch=development tasks="Phase 1: ...\n---\nPhase 2: ..."
```

**Parameters:**
- `key` (required) - Task identifier
- `github-branch` (required) - Target branch
- `debug-level` (optional) - none, simple, trace
- `verbosity` (optional) - concise, detailed
- `tasks` (required) - Multi-line phase list

**Portability**: 100% - No project-specific dependencies

---

#### 4. test-generation.prompt.md

**Purpose**: Generate Playwright or unit tests for features or files

**Key Features:**
- Multi-framework support (Playwright, xUnit, NUnit, Jest, Pytest, JUnit)
- Feature-based or file-based generation
- Edge case inclusion option
- Custom output path
- Follows project conventions
- Validates test runs

**Usage:**
```
@workspace /test-generation feature="login" framework=playwright
@workspace /test-generation file="UserService.cs" framework=xunit include_edge_cases=true
```

**Parameters:**
- `feature` OR `file` (required) - What to test
- `framework` (required) - Test framework
- `include_edge_cases` (optional) - Boolean
- `output_path` (optional) - Custom path

**Supported Frameworks:**
- `playwright` - UI tests
- `xunit`, `nunit` - .NET unit tests
- `jest` - JavaScript unit tests
- `pytest` - Python unit tests
- `junit` - Java unit tests

**Portability**: 100% - Auto-detects project test framework

---

#### 5. healthcheck.prompt.md

**Purpose**: Validate AI agent system configuration and health

**Key Features:**
- Agent configuration validation
- Template variable replacement check
- Database connection rule verification
- File structure integrity
- Learning system status
- Build and test validation

**Usage:**
```
@workspace /healthcheck
```

**Checks:**
- Agent prompt files exist
- Template variables replaced
- Database rules configured
- Learning patterns present
- Build succeeds
- Tests pass

**Portability**: 100% - Validates portable system integrity

---

#### 6. port-instructions.prompt.md

**Purpose**: Update portable templates from current project improvements

**Key Features:**
- Full regeneration or selective update
- Extracts project-specific values
- Replaces with template variables
- Generates configured templates
- Maintains template header
- Version tracking

**Usage:**
```
@workspace /port-instructions
@workspace /port-instructions prompt=task.prompt.md
```

**Parameters:**
- `prompt` (optional) - Specific prompt to update

**Template Variable Mappings:**
- Project identity: `{{PROJECT_NAME}}`, `{{PROJECT_TYPE}}`, `{{LANGUAGES}}`, `{{FRAMEWORKS}}`
- Commands: `{{BUILD_COMMAND}}`, `{{TEST_COMMAND}}`, `{{RUN_COMMAND}}`, `{{LINT_COMMAND}}`
- Database: `{{DATABASE_NAME}}`, `{{DATABASE_SERVER}}`, `{{SCHEMA_PRIMARY}}`, etc.
- Paths: `{{SOURCE_PATH}}`, `{{TEST_PATH}}`, `{{CONFIG_PATH}}`, `{{WORKSPACE_PATH}}`

**Portability**: 100% - Core mechanism for portability

---

### Internal Agents

#### 7. total-recall.prompt.md (Knowledge Management)

**Purpose**: Project configuration discovery and template population

**Key Features:**
- Auto-detect tech stack from project files
- Scan codebase structure
- Populate all template variables
- Generate configured files
- Technology-agnostic detection logic

**Detection Logic:**
1. **Project Identity** - Scan for `*.csproj`, `package.json`, `pyproject.toml`, `pom.xml`, etc.
2. **Commands** - Parse project manifests for build/test/run/lint commands
3. **Database** - Detect ORM configs (EF Core, Sequelize, SQLAlchemy, Hibernate)
4. **Infrastructure** - Identify UI framework, real-time tech, auth type

**Usage:**
```
@workspace /total-recall
@workspace /total-recall run_mode=apply
```

**Parameters:**
- `project_type` (optional) - Override detection
- `languages` (optional) - Comma-separated list
- `frameworks` (optional) - Comma-separated list
- `run_mode` (optional) - dry-run (default) or apply
- `paths` (optional) - Override paths

**Output Files:**
- `.github/_Portable/_Configured/instructions/` - Configured instruction files
- `.github/_Portable/_Configured/prompts/` - Configured prompt files
- `Workspaces/Copilot/_DOCS/summaries/total-recall-configuration-{timestamp}.md`

**Portability**: 100% - **THIS IS THE CORE AUTO-CONFIGURATION AGENT**

---

#### 8. refactor.prompt.md (Quality)

**Purpose**: Code refactoring with pattern application

**Key Features:**
- Loads refactor patterns from learning system
- Applies best practices
- Maintains functionality
- Includes tests
- Documents changes

**Portability**: 100% - Language-agnostic patterns

---

#### 9. cohesion-review.prompt.md (Quality)

**Purpose**: Architectural review and cohesion analysis

**Key Features:**
- Review service boundaries
- Identify tight coupling
- Suggest architectural improvements
- Generate cohesion report

**Portability**: 100% - Architecture-agnostic review

---

#### 10. analyze-learning.prompt.md (Knowledge)

**Purpose**: Review learning patterns and generate recommendations

**Key Features:**
- Analyze success/failure patterns
- Identify trends
- Generate improvement suggestions
- Update pattern library

**Portability**: 100% - Meta-learning capability

---

#### 11. sync.prompt.md (Operations)

**Purpose**: Keep files synchronized across workspace

**Key Features:**
- Synchronize SystemIndex.md with actual files
- Update architecture documentation
- Maintain link files
- Version tracking

**Portability**: 100% - File synchronization logic

---

#### 12. commit.prompt.md (Operations)

**Purpose**: Git commit operations with standardized format

**Key Features:**
- Checkpoint commits
- Conventional commit format
- Work item tracking
- Phase tracking

**Portability**: 100% - Git operations

---

#### 13. ask.prompt.md (Communication)

**Purpose**: Ask clarifying questions to user

**Key Features:**
- Identify ambiguities
- Request missing information
- Offer suggestions
- Guide decision-making

**Portability**: 100% - Communication patterns

---

#### 14. cleanup.prompt.md (Utility)

**Purpose**: Background process cleanup (servers, watchers, etc.)

**Key Features:**
- Detect running processes
- Graceful shutdown
- Port release
- Resource cleanup

**Portability**: 100% - Process management

---

## Learning Infrastructure

### Learning System (v2.0)

**Location**: `.github/learning/`

**Key Features:**
- **Error Pattern Library** - `error-patterns.json` with known error patterns and solutions
- **Success Patterns** - JSON files categorizing successful approaches
- **Recommendations** - Active and implemented improvement suggestions
- **Self-Improvement Loop** - Agents update patterns after successful resolutions
- **Pattern Schema** - Standardized format for all patterns

**Pattern Categories:**
1. **Task Patterns** - Task execution approaches
2. **Refactor Patterns** - Code refactoring best practices
3. **Validation Patterns** - Common validation solutions
4. **Cleanup Patterns** - Cleanup workflow patterns
5. **Integration Patterns** - Integration approaches
6. **UI Layout Patterns** - UI design patterns
7. **Analyze Learning Patterns** - Meta-learning patterns

**Error Pattern Structure:**
```json
{
  "pattern_id": "FP-001",
  "name": "Pattern Name",
  "category": "category",
  "description": "What happens",
  "symptoms": ["symptom 1", "symptom 2"],
  "root_cause": "Why it happens",
  "solution": "How to fix",
  "prevention": "How to avoid",
  "instances": [
    {
      "date": "2025-10-20",
      "context": "When it happened",
      "resolution_time_minutes": 45
    }
  ]
}
```

**Success Pattern Structure:**
```json
{
  "pattern_id": "tp-001",
  "name": "Pattern Name",
  "category": "category",
  "description": "Approach description",
  "context": "When to use",
  "approach": "How to implement",
  "success_indicators": ["indicator 1", "indicator 2"],
  "learned_from": ["task-1", "task-2"],
  "success_rate": 0.95,
  "last_updated": "2025-10-09T10:00:00Z"
}
```

**Auto-Update Integration:**
- task.prompt.md Step 2.7 queries error patterns
- task.prompt.md Step 10.2 adds new patterns after resolutions
- analyze-learning agent extracts patterns from workspace docs

**Portability**: 100% - Language-agnostic pattern library

---

## Shared Protocols

### 1. agent-handoff-protocol.md

**Purpose**: Standardize agent-to-agent handoffs

**Key Handoff:** create-plan → task

**Handoff Format:**
```
@workspace /task key={key} github-branch={branch} debug-level={level} verbosity={verbosity} tasks="{tasks}"
```

**Context Carried:**
- `{key}.plan.md` - Complete plan specification
- `{key}.plan.json` - Plan metadata
- `work-log.md` - Execution history

**Responsibilities:**
- **Planning Agent**: Write plan files, auto-send task command
- **Task Agent**: Load plan, execute phases, update JSON tracking

**Portability**: 100%

---

### 2. commit-checkpoint-protocol.md

**Purpose**: Mandatory git commits after each phase

**Rules:**
- Checkpoint after each phase completion
- Checkpoint before next phase
- Checkpoint after self-review passes
- Checkpoint before final healthcheck

**Commit Format:**
```
ckpt({key}): Phase {N} - {one-line-summary}

- Specific change 1
- Specific change 2
- Specific change 3

Workitem: {key}
Phase: {N}/{total-phases}
```

**PowerShell Snippet:**
```powershell
git add -A
git commit -m "ckpt({key}): Phase {N} - {brief-description}

- {change-1}
- {change-2}

Workitem: {key}
Phase: {N}/{total}"
```

**Portability**: 100%

---

### 3. commit-message-format.md

**Purpose**: Conventional commit message format

**Format:**
```
type(scope): subject

body

footer
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `refactor` - Code refactoring
- `test` - Test changes
- `docs` - Documentation
- `chore` - Maintenance
- `ckpt` - Checkpoint commit

**Portability**: 100%

---

### 4. clean-exit-guarantee.md

**Purpose**: Ensure clean termination of all processes

**Rules:**
- List all started processes
- Clean up before exit
- Release ports
- Remove temp files

**Portability**: 100%

---

### 5. CONCISE-MANDATE.md

**Purpose**: Output brevity rules

**Rules:**
- MAX 15 bullets per response
- Use 🧠 Analysis and 📌 Summary sections
- Always end with Next Actions (A, B, C, D)
- Never create unnecessary docs

**Portability**: 100%

---

### 6. output-style-mandate.md

**Purpose**: Standardize user-facing output format

**Structure:**
```
🧠 Copilot Analysis
- Bullet 1
- Bullet 2

📌 Summary for You
1. Work Requested: {key} | {description}
2. Affected Areas: {areas}
3. Plan: {phases}
4. Next Actions:
   A. {option}
   B. {option}
   C. {option}

**What would you like to do next?**
```

**Rules:**
- NO code in user-facing sections
- Always provide Next Actions
- Always ask "What would you like to do next?"

**Portability**: 100%

---

### 7. UserDictionary.md

**Purpose**: Shortcut expansion for common terms

**Usage:**
- User says "hcp" → Expands to "Host Control Panel → #file:HostControlPanel.razor"
- Prompts auto-load UserDictionary.md during analysis
- Shortcuts resolved before scope determination

**Categories:**
- Views (Blazor Components)
- API Controllers
- SignalR Hubs
- Services
- Data/DbContext
- Routes/Flows
- Testing & Config
- Scripts & Tasks
- Migrations & Data
- Tools
- Documentation

**Example Entry:**
```markdown
- hcp: Host Control Panel — view: #file:HostControlPanel.razor
```

**Portability**: 100% - Replace with project-specific shortcuts

---

### 8. Other Shared Protocols

All these protocols are 100% portable:

- **completion-workflow-template.md** - Task completion checklist
- **context-gathering-phases.md** - Context discovery phases
- **debug-logging-mandate.md** - Debug marker rules
- **execution-flow.md** - Execution flow patterns
- **framework-validation-checklists.md** - Framework-specific checks
- **high-priority-task-detection.md** - Detect urgent tasks
- **image-analysis-protocol.md** - Image processing rules
- **learning-analysis-report-template.md** - Learning report format
- **mac-development-environment.md** - macOS support
- **mandatory-lint-validation.md** - Code quality enforcement
- **optimization-report-template.md** - Optimization report format
- **pattern-library-update-guide.md** - Pattern maintenance
- **phase-breakdown-patterns.md** - How to break down work
- **playwright-test-generation.md** - Playwright test generation
- **pre-analysis-cleanup.md** - Pre-task cleanup checklist
- **step-0-server-cleanup.md** - Server cleanup before work
- **step-1-checkpoint.md** - Initial checkpoint rules
- **task-parameters-reference.md** - Parameter reference
- **test-orchestration-patterns.md** - Test execution patterns
- **ui-debugging-protocol.md** - UI debugging approach
- **warning-handling-mandate.md** - How to handle warnings

---

## Configuration System

### Template Variable System

**Purpose**: Replace project-specific values with variables for portability

**Variable Categories:**

#### 1. Project Identity
- `{{PROJECT_NAME}}` - Project name (e.g., "MyProject")
- `{{PROJECT_TYPE}}` - Project type (.NET, Node.js, Python, etc.)
- `{{LANGUAGES}}` - Programming languages (e.g., "C#, JavaScript")
- `{{FRAMEWORKS}}` - Frameworks/libraries (e.g., "ASP.NET Core, React")

#### 2. Build & Test
- `{{BUILD_COMMAND}}` - Build command (e.g., "dotnet build")
- `{{TEST_COMMAND}}` - Test command (e.g., "dotnet test")
- `{{RUN_COMMAND}}` - Run command (e.g., "dotnet run")
- `{{LINT_COMMAND}}` - Lint command (e.g., "dotnet format")

#### 3. Database
- `{{DATABASE_TYPE}}` - Database type (e.g., "SQL Server")
- `{{DATABASE_NAME}}` - Database name (e.g., "MyDatabase")
- `{{DATABASE_SERVER}}` - Database server (e.g., "localhost")
- `{{SCHEMA_PRIMARY}}` - Read-write schema (e.g., "app")
- `{{SCHEMA_READONLY}}` - Read-only schema (e.g., "dbo")
- `{{CONNECTION_STRING_KEY}}` - Connection string key (e.g., "DefaultConnection")

#### 4. Infrastructure
- `{{API_BASE_URL}}` - API base URL (e.g., "https://localhost:5001")
- `{{UI_FRAMEWORK}}` - UI framework (e.g., "Blazor Server")
- `{{REALTIME_TECH}}` - Real-time technology (e.g., "SignalR")
- `{{AUTH_TYPE}}` - Authentication type (e.g., "JWT")

#### 5. Paths
- `{{SOURCE_PATH}}` - Source code path (e.g., "src/")
- `{{TEST_PATH}}` - Test path (e.g., "tests/")
- `{{CONFIG_PATH}}` - Config path (e.g., "config/")
- `{{WORKSPACE_PATH}}` - Workspace root path

#### 6. Tools & Quality
- `{{ANALYZER_TOOLS}}` - Code quality tools (e.g., "Roslynator")
- `{{TEST_FRAMEWORK}}` - Test framework (e.g., "Playwright")
- `{{PACKAGE_MANAGER}}` - Package manager (e.g., "NuGet")

---

### Auto-Configuration Process

**Agent**: total-recall.prompt.md

**Process:**
1. **Detect Project Type** - Scan for project files (*.csproj, package.json, etc.)
2. **Extract Metadata** - Parse manifests for project info
3. **Detect Commands** - Identify build/test/run/lint commands
4. **Detect Database** - Find ORM configs and connection details
5. **Detect Infrastructure** - Identify UI framework, real-time tech, auth
6. **Populate Variables** - Replace all template variables
7. **Write Configured Files** - Output to `.github/_Portable/_Configured/`

**Output:**
- Configured instruction files
- Configured prompt files
- Configured link files
- Configuration summary report

---

## Porting Instructions

### Quick Start (3 Steps)

#### Step 1: Copy Files
```bash
# Copy the _Portable folder to your new project
cp -r .github/_Portable your-new-project/.github/
```

#### Step 2: Configure
```
# In VS Code, open your new project
# Run the auto-configuration agent:
@workspace /total-recall
```

The agent will:
- Detect your project type
- Scan your codebase
- Populate all template variables
- Write configured files to `.github/_Portable/_Configured/`

#### Step 3: Deploy
```bash
# Windows PowerShell
Copy-Item -Path ".github\_Portable\_Configured\*" -Destination ".github\" -Recurse -Force

# macOS/Linux
cp -r .github/_Portable/_Configured/* .github/
```

**Done!** Start using agents:
```
@workspace /handoff "Your first task"
```

---

### Manual Configuration (If Needed)

If total-recall doesn't detect everything correctly:

1. **Review Configured Files**
   - Open `.github/_Portable/_Configured/instructions/SelfAwareness.instructions.md`
   - Search for `{{` to find unreplaced variables
   - Manually replace with correct values

2. **Update Database Rules** (if applicable)
   - Edit `InfrastructureQuickRef.md`
   - Set database name, server, schema rules

3. **Update Commands**
   - Edit `SelfAwareness.instructions.md`
   - Set build/test/run commands

4. **Update UserDictionary.md**
   - Replace NOOR CANVAS shortcuts with your project shortcuts
   - Map to your file structure

5. **Deploy**
   - Copy configured files to `.github/`

---

### Verification Checklist

After deployment, verify:

- [ ] Run `@workspace /healthcheck` - Should pass
- [ ] Run `@workspace /handoff "Add comment to README"` - Should execute
- [ ] Check `.github/instructions/SelfAwareness.instructions.md` - No `{{VARIABLES}}`
- [ ] Check `.github/instructions/Links/SystemIndex.md` - Exists and populated
- [ ] Check `.github/prompts/handoff.prompt.md` - Exists
- [ ] Check `.github/learning/` - Pattern files exist

---

### Testing the System

1. **Simple Task Test**
   ```
   @workspace /handoff "Create a test function in README"
   ```
   - Should complete successfully
   - Should create git commit

2. **Planning Test**
   ```
   @workspace /create-plan "Add new API endpoint for users"
   ```
   - Should ask clarifying questions
   - Should generate plan
   - Should auto-execute after approval

3. **Test Generation Test** (if applicable)
   ```
   @workspace /test-generation feature="example" framework=playwright
   ```
   - Should generate test file
   - Should follow project conventions

---

### Customization

#### Add New Shortcuts
Edit `.github/prompts/shared/UserDictionary.md`:
```markdown
- myshortcut: My Component — view: #file:MyComponent.tsx
```

#### Add New Patterns
Edit `.github/learning/patterns/task-patterns.json`:
```json
{
  "pattern_id": "tp-999",
  "name": "My Pattern",
  "category": "execution",
  "description": "How it works",
  "approach": "Steps to implement",
  "success_indicators": ["indicator 1"],
  "success_rate": 0.9
}
```

#### Add Error Patterns
Edit `.github/learning/error-patterns.json`:
```json
{
  "pattern_id": "FP-999",
  "name": "My Error",
  "symptoms": ["symptom 1"],
  "root_cause": "Why it happens",
  "solution": "How to fix"
}
```

---

## Advanced Features

### Key Data Streams

**Location**: `.github/prompts.keys/{key}/`

**Files per Task:**
- `{key}.plan.md` - Complete plan (from create-plan agent)
- `{key}.plan.json` - Plan metadata (JSON tracking)
- `work-log.md` - Execution history
- `rollback-index.md` - Checkpoint history

**Purpose:**
- Maintain task history
- Enable rollback
- Track progress
- Share context between agents

---

### Multi-Agent Workflows

**Example: Complex Feature Implementation**

1. User runs: `@workspace /create-plan "Add authentication system"`
2. Planning agent asks clarifying questions
3. User provides answers
4. Planning agent generates comprehensive plan
5. User approves plan
6. Planning agent **automatically** invokes task agent
7. Task agent loads plan and executes phases
8. Task agent creates checkpoint commits after each phase
9. Task agent runs self-review loop
10. Task agent runs final healthcheck
11. Task agent reports completion

**All automatic - no manual handoffs needed!**

---

### Self-Review Loop

**Feature**: Agents validate their own work before completion

**Steps:**
1. Implementation completes
2. Agent performs self-review:
   - Design review
   - Functionality review
   - Code quality review
   - Test coverage review
   - Documentation review
3. If issues found:
   - Update plan with remediation
   - Re-execute affected phases
   - Repeat self-review
4. Max 3 iterations (escalate to user after 3rd)
5. Pass criteria:
   - All acceptance criteria met
   - All tests passing
   - Build succeeds (zero errors, zero warnings)
   - Code quality meets standards
   - Documentation complete

**Result**: Higher quality output, fewer regressions

---

### Error Recovery

**Feature**: Automatic error pattern matching and resolution

**Process:**
1. Error occurs during execution
2. Agent queries `.github/learning/error-patterns.json`
3. If pattern match found:
   - Apply documented solution
   - Continue execution
4. If no match:
   - Attempt standard troubleshooting
   - Document new pattern if resolved
5. After successful resolution:
   - Update error-patterns.json
   - Improve learning system

**Result**: Faster error resolution, accumulated knowledge

---

### Learning Loop

**Feature**: System improves from experience

**Components:**
1. **Error Pattern Library** - Known errors and solutions
2. **Success Pattern Library** - Proven approaches
3. **Recommendations** - Improvement suggestions
4. **Auto-Update** - Agents update patterns after success

**Workflow:**
1. Agent encounters situation
2. Agent queries pattern library
3. Agent applies pattern
4. If successful:
   - Increment success count
   - Update last_updated timestamp
5. If new approach works:
   - Add new pattern to library
   - Share with all agents

**Result**: Continuously improving AI system

---

## Best Practices

### 1. Always Run total-recall First

Before using any agents in a new project:
```
@workspace /total-recall
```

This ensures all template variables are populated correctly.

---

### 2. Use create-plan for Complex Work

For anything with 3+ steps:
```
@workspace /create-plan "Your complex feature"
```

The planning agent will help you think through the implementation.

---

### 3. Let Agents Auto-Execute

Don't micromanage. Agents will:
- Create checkpoint commits
- Run self-review
- Fix their own mistakes (up to 3 iterations)
- Only escalate if truly stuck

---

### 4. Keep UserDictionary Updated

Add shortcuts as you discover them:
```markdown
- mycomp: My Component — #file:components/MyComponent.tsx
```

This makes future requests faster and clearer.

---

### 5. Review Learning Patterns Periodically

Check `.github/learning/patterns/` monthly:
- Remove outdated patterns
- Update success rates
- Consolidate duplicates

---

### 6. Run healthcheck After Major Changes

After updating dependencies, frameworks, or configurations:
```
@workspace /healthcheck
```

This validates the AI system still works correctly.

---

## Troubleshooting

### Agent Not Found

**Symptom**: `@workspace /handoff` doesn't work

**Solution**:
1. Verify `.github/prompts/handoff.prompt.md` exists
2. Check file has `---\nmode: agent\n---` header
3. Restart VS Code
4. Re-run total-recall

---

### Template Variables Not Replaced

**Symptom**: Files contain `{{PROJECT_NAME}}` etc.

**Solution**:
1. Run `@workspace /total-recall run_mode=apply`
2. Check `.github/_Portable/_Configured/` for output
3. Manually replace remaining variables
4. Copy to `.github/`

---

### Database Rules Not Working

**Symptom**: Agent tries to modify read-only schema

**Solution**:
1. Edit `.github/instructions/SelfAwareness.instructions.md`
2. Update schema access rules:
   ```markdown
   - ✅ **`myapp.*`** - READ-WRITE
   - ❌ **`dbo.*`** - **READ-ONLY**
   ```
3. Edit `.github/instructions/Links/InfrastructureQuickRef.md`
4. Update database connection details

---

### Learning Patterns Not Loading

**Symptom**: Agent doesn't use known patterns

**Solution**:
1. Verify `.github/learning/patterns/` exists
2. Check JSON files are valid (run through JSON validator)
3. Verify pattern schema matches `PATTERN_SCHEMA.md`
4. Re-run analyze-learning agent

---

## Version History

### v1.0.0 (October 24, 2025)
- Initial portable release
- 14 agents (6 entry point, 8 internal)
- Learning system v2.0
- Template variable system
- Auto-configuration via total-recall
- Comprehensive documentation

**Source Project**: NOOR CANVAS  
**Tested On**: .NET 8 + Blazor Server + SignalR + SQL Server

---

## Support & Contribution

### Getting Help

1. Run `@workspace /healthcheck` to diagnose issues
2. Check `.github/_Portable/README.md` for quick start
3. Review `.github/_Portable/START-HERE.md` for setup steps
4. Read this guide for advanced features

### Contributing Improvements

If you enhance the agent system:

1. **Document Your Changes**
   - Update relevant `.md` files
   - Add to learning patterns if applicable

2. **Update Templates**
   - Run `@workspace /port-instructions`
   - Review generated templates
   - Commit to `.github/_Portable/`

3. **Share Back** (optional)
   - Create a PR to share improvements
   - Help make the system better for everyone

---

## Conclusion

This portable AI agent system represents months of refinement and testing on real-world projects. It's designed to:

- **Work Out of the Box** - 3-step setup, then productive immediately
- **Adapt to Any Stack** - .NET, Node, Python, Java, Ruby, Go, PHP
- **Improve Over Time** - Learning system accumulates knowledge
- **Save You Time** - Let AI handle routine tasks while you focus on architecture

**Start here:**
1. Copy `.github/_Portable/` to your project
2. Run `@workspace /total-recall`
3. Deploy configured files
4. Start building: `@workspace /handoff "Your first task"`

Welcome to the future of AI-assisted development! 🚀

---

**Document Version**: 1.0.0  
**Created**: October 24, 2025  
**For Questions**: Reference `.github/_Portable/README.md` or run `@workspace /healthcheck`
