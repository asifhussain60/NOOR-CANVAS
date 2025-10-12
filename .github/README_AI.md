# NOOR CANVAS Prompts - The Holy Grail 📜

**Last Updated**: 2025-10-10  
**Purpose**: Comprehensive index of all AI agent prompts in the NOOR CANVAS system  
**Audience**: GitHub Copilot, ChatGPT, Gemini, and any AI model working within this codebase

---

## 🎯 Critical Instructions for AI Models

**ALWAYS KEEP THIS FILE UPDATED** - When any prompt file is created, modified, or deleted, you **MUST** update this README_AI.md to reflect those changes. This file is the single source of truth for understanding the AI agent ecosystem.

**Before starting ANY work**, read this file to understand:
1. Which agent handles which type of task
2. How agents coordinate and trigger each other
3. What each agent reads from and writes to
4. Expected outcomes and validation requirements

---

## 📚 Prompt File Summaries

### 1. task.prompt.md
**File**: `.github/prompts/task.prompt.md`  
**Agent Name**: Task Executor Agent  
**Primary Role**: Central execution hub for all development tasks

**Purpose**:
The Task Executor is the canonical engine that breaks down development requests into structured, validated steps while maintaining a living audit trail through progressive key data stream updates. It handles feature implementation, bug fixes, incremental work, and task completion with full traceability.

**What It Does**:
- Breaks complex requests into sequential subtasks
- Verifies key data stream context BEFORE planning (prevents duplicate work)
- Creates checkpoint commits for rollback safety
- Executes work with mandatory approval gates
- Automatically generates Playwright tests for UI changes (Step 6.1)
- Updates key data stream AFTER every sub-task completion
- Records full git commit SHA hashes for quick code access
- Handles task lifecycle (new → in-progress → complete → reopened)
- Performs comprehensive cross-layer documentation on "mark complete"
- Removes obsolete information during completion workflow
- Enforces zero errors, zero warnings policy (mandatory clean build)

**Key Features**:
- **Step 2**: Key Data Stream Verification - Builds context from previous work
- **Step 6.1**: Automatic Playwright Tests - UI changes auto-generate test coverage
- **Step 8**: Progressive Documentation - Updates after every sub-task with git commits
- **Step 9**: Completion Workflow - Cross-layer documentation + cleanup when tasks="mark complete"
- **Resumption Protocol**: Completed keys automatically revert to in-progress when new tasks arrive

**When to Use**:
- Feature implementation (UI, API, services, database)
- Bug fixes across any layer
- Multi-step incremental work
- Marking work complete with comprehensive documentation
- Resuming previously completed tasks

**Triggers**: pwtest (auto), refactor (post-implementation), healthcheck (validation)  
**Reads From**: `Workspaces/Copilot/learning/task-patterns.json`, `Workspaces/Copilot/prompts.keys/{key}/`  
**Writes To**: `Workspaces/Copilot/prompts.keys/{key}/work-log.md`, `Workspaces/TEMP/` (Playwright tests)

**Invocation Examples**:
```
@workspace /task key=hcp tasks="Fix hadees token removal in SessionCanvas"
@workspace /task key=canvas tasks="Add share button\n---\nCreate Playwright test"
@workspace /task key=hcp tasks="mark complete"
```

---

### 2. refactor.prompt.md
**File**: `.github/prompts/refactor.prompt.md`  
**Agent Name**: Structural Integrity Agent  
**Primary Role**: Code quality and maintainability improvement without changing functionality

**Purpose**:
The Structural Integrity Agent improves code maintainability, readability, and consistency through holistic refactoring while preserving existing functionality and enforcing absolute zero-tolerance for errors and warnings.

**What It Does**:
- Improves code readability and reduces complexity
- Consolidates duplicate code across layers
- Standardizes naming conventions
- Optimizes performance without behavior changes
- Enforces Roslynator, StyleCop, and .NET Analyzer compliance
- Validates API/Database/UI contract preservation
- Performs continuous build validation after every file modification
- Automatic rollback on persistent warnings (3 retry attempts)
- Documents structural improvements in learning patterns

**Key Features**:
- **Checkpoint Commit**: Mandatory pre-refactor snapshot
- **Zero Tolerance Policy**: ABSOLUTELY zero errors, zero warnings
- **Continuous Validation**: Build check after every change
- **Contract Preservation**: Cross-layer validation ensures no breaking changes
- **Immediate Rollback**: Any warning triggers retry or rollback
- **Comprehensive Validation**: ALL 6 levels of ValidationFramework.md mandatory

**When to Use**:
- Code quality improvement initiatives
- Post-implementation cleanup
- Analyzer violation remediation
- Naming standardization efforts
- Pre-deployment quality assurance
- Architecture cleanup (duplicate code, separation of concerns)

**Triggers**: healthcheck (post-refactor validation)  
**Triggered By**: task (post-implementation), sync (periodic improvements)  
**Reads From**: `Workspaces/Copilot/learning/refactor-patterns.json`, AnalyzerConfig.MD, API-Contract-Validation.md  
**Writes To**: `refactor-patterns.json`, key data stream

**Invocation Examples**:
```
@workspace /refactor key=hcp scope=all notes="consolidate duplicate parsing logic"
@workspace /refactor scope=current notes="improve naming conventions"
@workspace /refactor key=canvas scope=SessionCanvas.razor notes="reduce complexity"
```

---

### 3. sync.prompt.md
**File**: `.github/prompts/sync.prompt.md`  
**Agent Name**: Synchronization and Cleanup Agent (sync + janitor)  
**Primary Role**: System hygiene through documentation sync and cleanup operations

**Purpose**:
The Synchronization and Cleanup Agent maintains system hygiene by synchronizing prompts/instructions/configurations and performing janitor duties (removing unused files, eliminating duplicates, normalizing formatting).

**What It Does**:
- Synchronizes SystemStructureSummary.md with repository reality
- Updates NOOR-CANVAS_ARCHITECTURE.MD after architectural changes
- Refreshes configuration files (AnalyzerConfig.MD, PlaywrightConfig.MD, ValidationFramework.md)
- Removes unused files, components, services, and DTOs
- Eliminates duplicate code and consolidates logic
- Normalizes formatting (Prettier, StyleCop)
- Cleans up temporary test files in `Workspaces/TEMP/`
- Archives deprecated artifacts to `.archive/`
- Updates learning patterns with sync improvements

**Key Features**:
- **Dual Role**: Both synchronizer and janitor
- **Documentation Sync**: Keeps all instruction files current
- **Configuration Management**: Updates analyzer and test configurations
- **Cleanup Operations**: Removes obsolete code and artifacts
- **Post-Refactor Cleanup**: Cleans up temporary files

**When to Use**:
- Documentation sync after architectural changes
- Configuration updates (analyzer, test, validation)
- Cleanup operations (unused files, duplicates)
- Post-refactor cleanup
- Periodic system hygiene (weekly/monthly)
- Pre-deployment documentation verification

**Triggers**: healthcheck (post-sync validation)  
**Called By**: refactor (post-cleanup), task (documentation updates)  
**Updates**: SystemStructureSummary.md, all `.github/instructions/Links/*.MD`, `Workspaces/Copilot/learning/`

**Invocation Examples**:
```
@workspace /sync key=system-docs notes="update architecture documentation"
@workspace /sync key=cleanup notes="remove unused components and services"
@workspace /sync key=config-refresh notes="update analyzer configurations"
```

---

### 4. healthcheck.prompt.md
**File**: `.github/prompts/healthcheck.prompt.md`  
**Agent Name**: System Health Auditor Agent (healthcheck)  
**Primary Role**: Read-only comprehensive validation across all system layers

**Purpose**:
The System Health Auditor performs comprehensive, read-only validation of project integrity and consistency across all layers (UI → API → Services → DTOs → Database), surfacing mismatches, drift, and violations without making changes.

**What It Does**:
- Validates UI ↔ API ↔ Database contract alignment
- Detects architectural drift (code vs documentation)
- Verifies SystemStructureSummary.md reflects repository reality
- Confirms NOOR-CANVAS_ARCHITECTURE.MD matches code structure
- Validates API contract consistency (API-Contract-Validation.md)
- Checks analyzer/linter compliance (AnalyzerConfig.MD)
- Verifies test coverage (PlaywrightConfig.MD)
- Reports violations categorized by severity (read-only)
- Updates validation-patterns.json with newly discovered issues
- Provides clear remediation recommendations

**Key Features**:
- **Read-Only Mode**: Never modifies code/configs (unless explicit override)
- **Cross-Layer Validation**: All 6 levels of ValidationFramework.md
- **Contract Verification**: Ensures UI/API/Database alignment
- **Documentation Sync Check**: Verifies docs match reality
- **Zero Changes Default**: Surfaces issues without fixing them

**When to Use**:
- Pre-deployment system health verification
- Post-refactor architectural integrity validation
- Contract verification after API/database changes
- Periodic system audits (weekly/monthly)
- Troubleshooting architectural inconsistencies
- Documentation sync validation

**Triggers**: sync agent (for remediation of discovered issues)  
**Triggered By**: refactor (post-structural changes), sync (periodic audits)  
**Reads From**: NOOR-CANVAS_ARCHITECTURE.MD, API-Contract-Validation.md, SystemStructureSummary.md  
**Writes To**: `Workspaces/Copilot/learning/validation-patterns.json`

**Invocation Examples**:
```
@workspace /healthcheck scope=all
@workspace /healthcheck scope=SessionCanvas.razor notes="verify SignalR integration"
@workspace /healthcheck scope=HostSessionService notes="check API contracts"
```

---

### 5. question.prompt.md
**File**: `.github/prompts/question.prompt.md`  
**Agent Name**: Application Knowledge Agent (question)  
**Primary Role**: Expert-level answers about any aspect of NOOR CANVAS

**Purpose**:
The Application Knowledge Agent provides comprehensive, evidence-based answers about any aspect of NOOR CANVAS through cross-layer analysis, serving as the one-stop solution for feature functionality, styling, configuration, and troubleshooting questions.

**What It Does**:
- Investigates feature functionality with cross-layer analysis
- Traces event flows from UI → API → Services → Database
- Identifies styling controls and configuration settings
- Troubleshoots errors with diagnostic depth
- Analyzes library versions and dependencies
- Maps architecture workflows and integration points
- Provides code references (file paths, line numbers, methods)
- Identifies gaps in implementation
- Offers actionable recommendations with specific solutions
- Surfaces follow-up investigation opportunities

**Key Features**:
- **Comprehensive Analysis**: Examines all relevant layers (UI, API, Services, DB, Config)
- **Evidence-Based**: Uses actual code inspection, not assumptions
- **Gap Identification**: Highlights missing implementations or inconsistencies
- **Actionable Output**: Specific, implementable recommendations
- **Depth Levels**: quick, standard, comprehensive, diagnostic

**When to Use**:
- Feature understanding ("How does X work?")
- Troubleshooting ("Why is X not working?")
- Styling questions ("What controls the appearance of X?")
- Configuration queries ("What version of X?", "How is Y configured?")
- Architecture exploration (workflows, data flow, integration)
- Knowledge discovery without code diving

**Supports**: All agents (provides knowledge and investigation)  
**Reads From**: NOOR-CANVAS_ARCHITECTURE.MD (52 API endpoints, 15+ services, 4 hubs), SystemStructureSummary.md, all code layers  
**Writes To**: None (read-only analysis)

**Invocation Examples**:
```
@workspace /question "How does session management work?" depth=comprehensive
@workspace /question "Why is the share button not appearing?" context="SessionCanvas.razor" depth=diagnostic
@workspace /question "What controls the canvas styling?" depth=quick
@workspace /question "What version of SignalR are we using?" depth=standard
```

---

### 6. analyze-learning.prompt.md
**File**: `.github/prompts/analyze-learning.prompt.md`  
**Agent Name**: Self-Learning Analysis Agent (analyze-learning)  
**Primary Role**: Continuous system improvement through historical pattern analysis

**Purpose**:
The Self-Learning Analysis Agent transforms NOOR CANVAS from a static instruction set into a continuously improving, self-optimizing AI agent ecosystem by analyzing historical task outcomes, identifying patterns, and updating system knowledge automatically.

**What It Does**:
- Analyzes historical task outcomes from key data streams
- Identifies success patterns for reuse across future tasks
- Documents anti-patterns to avoid repeated failures
- Tracks efficiency metrics (execution durations, bottlenecks)
- Monitors code quality trends over time
- Updates pattern libraries (task-patterns.json, refactor-patterns.json, validation-patterns.json)
- Provides workflow optimization recommendations
- Extracts lessons from completed/failed keys
- Generates trend reports showing continuous improvement

**Key Features**:
- **Read-Only Mode**: Analyzes data without modifying code
- **Pattern Extraction**: Success/failure patterns from work history
- **Learning Infrastructure**: Updates `Workspaces/Copilot/learning/` files
- **Analysis Types**: success-patterns, failure-patterns, efficiency, quality-trends, comprehensive
- **Scheduled Execution**: Weekly or after every 10 completed keys

**When to Use**:
- Scheduled analysis (weekly or after 10 completed keys)
- Pattern discovery from recent work
- Efficiency optimization initiatives
- Quality trend monitoring
- Knowledge base refresh operations

**Reads From**: All agent key data streams in `Workspaces/Copilot/prompts.keys/`  
**Writes To**: `Workspaces/Copilot/learning/{agent}-patterns.json`  
**Supports**: All agents (benefits all through extracted patterns)

**Invocation Examples**:
```
@workspace /analyze-learning scope=recent analysis-type=comprehensive
@workspace /analyze-learning scope=all analysis-type=success-patterns
@workspace /analyze-learning scope=key=hcp analysis-type=failure-patterns
```

---

## 🔗 Agent Coordination Map

```
┌─────────────────────────────────────────────────────────────┐
│                    NOOR CANVAS AI ECOSYSTEM                 │
└─────────────────────────────────────────────────────────────┘

[task] (Central Execution Hub)
  ├─► Triggers: pwtest (auto UI tests), refactor (cleanup), healthcheck (validation)
  ├─► Reads: task-patterns.json, key data streams
  └─► Writes: work-log.md, Playwright tests in TEMP/

[refactor] (Structural Integrity)
  ├─► Triggered By: task (post-implementation), sync (periodic)
  ├─► Triggers: healthcheck (post-refactor validation)
  ├─► Reads: refactor-patterns.json, AnalyzerConfig.MD, API-Contract-Validation.md
  └─► Writes: refactor-patterns.json, key data stream

[sync] (Synchronization & Cleanup)
  ├─► Called By: refactor (cleanup), task (documentation)
  ├─► Triggers: healthcheck (post-sync validation)
  └─► Updates: SystemStructureSummary.md, all Links/*.MD, learning/

[healthcheck] (System Health Auditor)
  ├─► Triggered By: refactor, sync, task (validation)
  ├─► Reports To: sync (for remediation)
  ├─► Reads: NOOR-CANVAS_ARCHITECTURE.MD, API-Contract-Validation.md, SystemStructureSummary.md
  └─► Writes: validation-patterns.json

[question] (Application Knowledge)
  ├─► Supports: ALL agents (knowledge provider)
  ├─► Reads: NOOR-CANVAS_ARCHITECTURE.MD, SystemStructureSummary.md, all code layers
  └─► Writes: None (read-only)

[analyze-learning] (Self-Learning)
  ├─► Reads: All key data streams in prompts.keys/
  ├─► Writes: learning/{agent}-patterns.json
  └─► Supports: ALL agents (pattern extraction)
```

---

## 📋 Common Workflows

### Feature Implementation Workflow
```
1. @workspace /task key=feature tasks="Implement X\n---\nCreate tests"
   ├─► Executes implementation
   ├─► Auto-generates Playwright tests (Step 6.1)
   ├─► Updates key data stream progressively
   └─► Triggers healthcheck for validation

2. @workspace /refactor key=feature scope=all notes="cleanup and optimize"
   ├─► Improves code quality
   ├─► Enforces zero warnings
   └─► Triggers healthcheck

3. @workspace /task key=feature tasks="mark complete"
   ├─► Cross-layer documentation (Step 9)
   ├─► Removes obsolete information
   └─► Marks key as complete
```

### Troubleshooting Workflow
```
1. @workspace /question "Why is X not working?" depth=diagnostic
   └─► Provides detailed analysis with code references

2. @workspace /healthcheck scope=X notes="verify contracts"
   └─► Identifies mismatches or drift

3. @workspace /task key=fix-x tasks="Fix identified issue"
   └─► Implements solution with validation
```

### System Maintenance Workflow
```
1. @workspace /analyze-learning scope=recent analysis-type=comprehensive
   └─► Extracts patterns from recent work

2. @workspace /sync key=system-maintenance notes="documentation and cleanup"
   └─► Updates docs, removes unused files

3. @workspace /healthcheck scope=all
   └─► Validates system integrity
```

---

## 🔑 Key Data Stream System

All agents maintain work history in:
```
Workspaces/Copilot/prompts.keys/{key}/work-log.md
```

**Key Lifecycle**:
- `new` → First time key is used
- `in-progress` → Active work happening
- `complete` → Work finished (via "mark complete")
- `reopened` → Completed key with new tasks (auto-reverts to in-progress)
- `failed` → Task execution failed
- `locked` → Key locked by another agent/user

**Progressive Documentation**:
- Updated AFTER every sub-task completion (mandatory)
- Includes full git commit SHA hashes
- Maintains cumulative history (append-only)
- Records files modified, tests created, validation results

---

## 🎓 Learning Infrastructure

All agents contribute to and read from:
```
Workspaces/Copilot/learning/
├── task-patterns.json          (successful implementation patterns)
├── refactor-patterns.json      (proven structural improvements)
├── validation-patterns.json    (known issues and solutions)
└── PATTERN_SCHEMA.md          (pattern file format specification)
```

**Pattern Extraction**:
- Successful task completions → task-patterns.json
- Effective refactorings → refactor-patterns.json
- Validation discoveries → validation-patterns.json

**Pattern Usage**:
- task agent queries before execution
- refactor agent applies proven approaches
- healthcheck agent validates against known issues

---

## ⚠️ Critical Operating Rules

### For ALL AI Models Working in NOOR CANVAS:

1. **ALWAYS Read This File First** - Before starting any work, understand which agent to use

2. **Keep This File Updated** - When prompts change, update this README_AI.md immediately

3. **Follow the Agent Coordination Map** - Don't bypass established workflows

4. **Respect Key Data Streams** - Always verify and update key context

5. **Enforce Zero Tolerance** - Zero errors, zero warnings (mandatory clean build)

6. **Use Learning Infrastructure** - Query patterns before execution, update after success

7. **Validate Comprehensively** - Follow ValidationFramework.md for all agents

8. **Document Progressively** - Update key data stream after EVERY sub-task

9. **Preserve Git History** - Always record full commit SHA hashes

10. **Maintain Cross-Layer Alignment** - Verify UI ↔ API ↔ Database contracts

---

## 📖 Additional Resources

### Prompts (.github/prompts/)
All agent prompt files that define AI agent behavior and workflows.

#### Main Prompts (Alphabetical)
- **analyze-learning.prompt.md** - Self-Learning Analysis Agent - Analyzes historical task patterns, extracts success/failure lessons, updates learning infrastructure
- **cohesion-review.prompt.md** - Prompt Architecture Auditor - Reviews prompt system for redundancies, gaps, conflicts, consolidates similar files
- **healthcheck.prompt.md** - System Health Auditor - Read-only validation of cross-layer contracts (UI ↔ API ↔ Database), detects drift
- **question.prompt.md** - Application Knowledge Agent - Expert-level answers about NOOR CANVAS features, styling, config, troubleshooting
- **refactor.prompt.md** - Structural Integrity Agent - Code quality improvements, zero-tolerance for warnings, preserves contracts
- **sync.prompt.md** - Synchronization & Cleanup Agent - Maintains documentation sync, removes unused files, consolidates similar data streams
- **task.prompt.md** - Task Executor Agent - Central execution hub for features, bugs, incremental work, automatic test generation
- **test-generation.prompt.md** - Test Generation Agent - Creates Playwright E2E tests for UI changes with Session 212 patterns

#### Shared Files (.github/prompts/shared/)
Common instructions referenced by multiple prompts to reduce duplication.

- **commit-message-format.md** - Conventional Commits v1.0.0 standard with type, scope, subject format
- **debug-logging-mandate.md** - Standardized debug marker patterns for code insertion and cleanup (`[DEBUG-WORKITEM:*] ;CLEANUP_OK`)
- **step-0-server-cleanup.md** - Kill running Kestrel servers to prevent port conflicts (referenced by cohesion-review, removed from task)
- **step-1-checkpoint.md** - Mandatory checkpoint commit workflow (`git commit -m "checkpoint: pre-{agent} {key}"`)
- **warning-handling-mandate.md** - Zero-tolerance policy for build warnings, retry logic, rollback triggers

---

### Instructions (.github/instructions/)
Global guardrails and operational rules for all AI agents.

- **SelfAwareness.instructions.md** - Global operating guardrails for all agents - database rules, file organization, runtime rules, Roslynator integration

#### Links (.github/instructions/Links/)
Quick reference files for architecture, configuration, and system knowledge.

- **AnalyzerConfig.MD** - Roslynator, StyleCop, .NET Analyzer configurations, baseline suppressions, ruleset customizations
- **API-Contract-Validation.md** - Cross-layer contract validation rules ensuring UI → API → Database alignment
- **Architecture.md** - Complete system architecture - 52 API endpoints, 15+ services, 4 SignalR hubs, database schemas, auth flows
- **FunctionalityRegistry.md** - Regression prevention system tracking core behaviors, file/method watch lists, test coverage mapping
- **InfrastructureQuickRef.md** ⭐ - **MANDATORY for database ops** - KSESSIONS_DEV connection details, schema access rules (canvas.* vs dbo.*), API endpoints
- **PlaywrightConfig.MD** - Detailed E2E test configuration reference, execution modes (standalone, temp, CI), browser settings
- **PlaywrightQuickRef.md** ⭐ - **MANDATORY for test creation** - Complete testing guide, Session 212 patterns (KJAHA99L/PQ9N5YWW), test writing patterns
- **PlaywrightTestPaths.MD** - Canonical test file locations, naming conventions, test data patterns
- **SystemIndex.md** - Central navigation hub for all architectural references, agent coordination, system snapshots, quick lookups
- **ValidationFramework.md** - Standard 6-level validation pipeline (build → analyzers → linters → contracts → E2E → docs)

---

## � File Organization Summary

### Prompts System Structure
```
.github/
├── prompts/                    # 8 agent prompt files
│   ├── shared/                 # 5 common instruction files
│   │   ├── commit-message-format.md
│   │   ├── debug-logging-mandate.md
│   │   ├── step-0-server-cleanup.md
│   │   ├── step-1-checkpoint.md
│   │   └── warning-handling-mandate.md
│   ├── analyze-learning.prompt.md
│   ├── cohesion-review.prompt.md
│   ├── healthcheck.prompt.md
│   ├── question.prompt.md
│   ├── refactor.prompt.md
│   ├── sync.prompt.md
│   ├── task.prompt.md
│   └── test-generation.prompt.md
└── instructions/               # Global guardrails
    ├── SelfAwareness.instructions.md
    └── Links/                  # 10 quick reference files
        ├── AnalyzerConfig.MD
        ├── API-Contract-Validation.md
        ├── Architecture.md
        ├── FunctionalityRegistry.md
        ├── InfrastructureQuickRef.md ⭐
        ├── PlaywrightConfig.MD
        ├── PlaywrightQuickRef.md ⭐
        ├── PlaywrightTestPaths.MD
        ├── SystemIndex.md
        └── ValidationFramework.md
```

### Critical File Markers
- ⭐ **InfrastructureQuickRef.md** - MANDATORY before ANY database operations
- ⭐ **PlaywrightQuickRef.md** - MANDATORY before creating ANY Playwright tests
- **Architecture.md** - Reference for understanding system design (52 endpoints, 15+ services)
- **SelfAwareness.instructions.md** - Global operating rules ALL agents must follow
- **SystemIndex.md** - Navigation hub for quick architectural lookups

---

## ⚠️ Critical Operating Rules

### For ALL AI Models Working in NOOR CANVAS:

1. **ALWAYS Read This File First** - Before starting any work, understand which agent to use

2. **Keep This File Updated** - When prompts change, update this README_AI.md immediately

3. **Follow the Agent Coordination Map** - Don't bypass established workflows

4. **Respect Key Data Streams** - Always verify and update key context

5. **Enforce Zero Tolerance** - Zero errors, zero warnings (mandatory clean build)

6. **Use Learning Infrastructure** - Query patterns before execution, update after success

7. **Validate Comprehensively** - Follow ValidationFramework.md for all agents

8. **Document Progressively** - Update key data stream after EVERY sub-task

9. **Preserve Git History** - Always record full commit SHA hashes

10. **Maintain Cross-Layer Alignment** - Verify UI ↔ API ↔ Database contracts

11. **Consult QuickRef Files** - Use InfrastructureQuickRef.md (database) and PlaywrightQuickRef.md (testing) before operations

12. **Check Architecture.md** - Review before implementing new features to avoid duplication

---

## 🎓 Learning Infrastructure

All agents contribute to and read from:
```
Workspaces/Copilot/learning/
├── task-patterns.json          (successful implementation patterns)
├── refactor-patterns.json      (proven structural improvements)
├── validation-patterns.json    (known issues and solutions)
└── PATTERN_SCHEMA.md          (pattern file format specification)
```

**Pattern Extraction**:
- Successful task completions → task-patterns.json
- Effective refactorings → refactor-patterns.json
- Validation discoveries → validation-patterns.json

**Pattern Usage**:
- task agent queries before execution
- refactor agent applies proven approaches
- healthcheck agent validates against known issues

---

## 🔄 Version History

| Date | Version | Change | Updated By |
|------|---------|--------|------------|
| 2025-10-12 | 2.0.0 | Added comprehensive file listings with descriptions - Prompts, Instructions, Links, Shared files all documented alphabetically | GitHub Copilot |
| 2025-10-10 | 1.0.0 | Initial creation - Comprehensive prompt documentation | GitHub Copilot |

---

**Remember**: This file is the holy grail of prompts. Keep it current, keep it comprehensive, and keep it accessible to all AI models working in this codebase.