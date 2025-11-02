# NOOR CANVAS System Registry

**Last Updated:** 2025-10-28  
**Purpose:** Comprehensive registry of all prompts, tools, frameworks, and technology stack configured in the application.  
**Maintenance:** Auto-updated by `enhance-prompts`, `healthcheck`, `project-enhancement` prompts and on-demand via `#update-registry` prompt.

---

## Table of Contents
1. [Prompt System](#prompt-system)
   - [User-Facing Prompts](#user-facing-prompts)
   - [Internal Prompts](#internal-prompts)
   - [Shared Infrastructure](#shared-infrastructure)
2. [Technology Stack](#technology-stack)
   - [Backend Framework](#backend-framework)
   - [Frontend Framework](#frontend-framework)
   - [Testing Infrastructure](#testing-infrastructure)
   - [Code Quality Tools](#code-quality-tools)
   - [External Services](#external-services)
3. [Development Tools](#development-tools)
4. [Infrastructure](#infrastructure)

---

## Prompt System

### User-Facing Prompts
Located in `.github/prompts/`

| Prompt | File | Purpose | Usage | Calls |
|--------|------|---------|-------|-------|
| **ask** | `ask.prompt.md` | Entry-point for asking application questions; routes to internal question agent | `#ask <question>` with optional context, depth, verbosity | `question.prompt.md`, optionally `plan`, `todo`, `task`, `test-generation` |
| **plan** | `plan.prompt.md` | Interactive planning agent that refines requests into executable, testable plans | `#plan key=<key> user_request="<request>"` with optional scope, constraints | `task.prompt.md`, `test-generation.prompt.md` |
| **todo** | `todo.prompt.md` | Task list management and tracking | `#todo` with operations like add, list, complete | N/A |
| **task** | `task.prompt.md` | Executes individual tasks from plans | `#task key=<key> task_id=<id>` | Various based on task type |
| **route** | `route.prompt.md` | Routes user requests to appropriate prompt agents | `#route <request>` | All prompts based on request type |
| **drift** | `drift.prompt.md` | Detects drift between plans and actual implementation | `#drift key=<key>` | `plan.prompt.md` if re-planning needed |
| **cohesion** | `cohesion.prompt.md` | Validates project cohesion and consistency | `#cohesion scope=<scope>` | `enhance-prompts.prompt.md` for fixes |
| **healthcheck** | `healthcheck.prompt.md` | Read-only system health auditor and prompt optimization analyzer | `#healthcheck scope=<scope> level=<level>` | Validation tools only |
| **test-generation** | `test-generation.prompt.md` | Generates automated tests for features | `#test-generation key=<key>` with test type specifications | Test frameworks |
| **test-prep** | `test-prep.prompt.md` | Prepares components for test generation via interaction logging | `#test-prep action=<prep\|review\|generate\|cleanup>` | `test-generation.prompt.md` |
| **ui-map** | `ui-map.prompt.md` | Analyzes UI components and generates clickable element ID maps for Playwright tests | `#ui-map <component-name>` or `#ui-map #file:Component.razor` | KDS handoff system |
| **project-enhancement** | `project-enhancement.prompt.md` | Analyzes entire application stack and recommends tooling improvements | `#project-enhancement scope=<scope>` | Analysis tools |

### Internal Prompts
Located in `.github/prompts/internal/`

#### Communication (`comm/`)
| Prompt | File | Purpose | Called By |
|--------|------|---------|-----------|
| **question** | `question.prompt.md` | Processes questions and provides concise, bulletted answers | `ask.prompt.md` |

#### Knowledge Management (`knowledge/`)
| Prompt | File | Purpose | Called By |
|--------|------|---------|-----------|
| **total-recall** | `total-recall.prompt.md` | Retrieves comprehensive historical context from key-data-streams | Various agents needing context |
| **analyze-learning** | `analyze-learning.prompt.md` | Analyzes learning patterns and generates insights | `cohesion.prompt.md`, knowledge workflows |

#### Operations (`ops/`)
| Prompt | File | Purpose | Called By |
|--------|------|---------|-----------|
| **commit** | `commit.prompt.md` | Manages git commit operations with standardized messages | Workflow completion steps |
| **sync** | `sync.prompt.md` | Synchronizes state and ensures consistency | State management workflows |

#### Quality Assurance (`quality/`)
| Prompt | File | Purpose | Called By |
|--------|------|---------|-----------|
| **refactor** | `refactor.prompt.md` | Performs code refactoring operations | `cohesion.prompt.md`, code quality workflows |
| **cohesion-review** | `cohesion-review.prompt.md` | Deep cohesion analysis and violation detection | `cohesion.prompt.md` |

#### Utilities (`util/`)
| Prompt | File | Purpose | Called By |
|--------|------|---------|-----------|
| **cleanup** | `cleanup.prompt.md` | Cleans up temporary files and resources | Workflow cleanup phases |
| **enhance-prompts** | `enhance-prompts.prompt.md` | Non-destructive enhancement of prompt/instruction files | `cohesion.prompt.md` in auto-fix paths |

### Shared Infrastructure
Located in `.github/prompts/shared/`

| Component | File | Purpose |
|-----------|------|---------|
| **Agent Handoff Protocol** | `agent-handoff-protocol.md` | Defines how agents hand off work to each other |
| **Commit Checkpoint Protocol** | `commit-checkpoint-protocol.md` | Git commit workflow and checkpoint standards |
| **Commit Message Format** | `commit-message-format.md` | Standardized commit message formatting |
| **Completion Workflow Template** | `completion-workflow-template.md` | Template for task completion workflows |
| **Mandatory Rules** | `MANDATORY.md` | Critical rules: No Code in Chat, Document First, Playwright Orchestration |
| **Context Gathering Phases** | `context-gathering-phases.md` | Structured context collection process |
| **Context Loader** | `context-loader.md` | Context loading and management utilities |
| **Debug Logging Mandate** | `debug-logging-mandate.md` | Standards for debug logging insertion |
| **Execution Flow** | `execution-flow.md` | Agent execution flow patterns |
| **Framework Validation Checklists** | `framework-validation-checklists.md` | Validation checklists for various frameworks |
| **High Priority Task Detection** | `high-priority-task-detection.md` | Identifies critical/high-priority tasks |
| **Image Analysis Protocol** | `image-analysis-protocol.md` | Standards for image analysis tasks |
| **Integration Protocol** | `integration-protocol.md` | Inter-agent integration standards |
| **Loop Prevention** | `loop-prevention.md` | Prevents infinite loops in agent workflows |
| **Mac Development Environment** | `mac-development-environment.md` | macOS-specific development setup |
| **Mandatory Lint Validation** | `mandatory-lint-validation.md` | Linting requirements and enforcement |
| **Output Validator** | `output-validator.md` | Validates agent output compliance |
| **Pattern Library Update Guide** | `pattern-library-update-guide.md` | Guides for updating pattern libraries |
| **Phase Breakdown Patterns** | `phase-breakdown-patterns.md` | Patterns for breaking work into phases |
| **Playwright Test Generation** | `playwright-test-generation.md` | Playwright-specific test generation guide |
| **Pre-Analysis Cleanup** | `pre-analysis-cleanup.md` | Pre-work cleanup checklist |
| **Prompt Test Validation Framework** | `prompt-test-validation-framework.md` | Framework for validating prompt behavior |
| **Request Analyzer** | `request-analyzer.md` | Analyzes and classifies user requests |
| **State Tracker** | `state-tracker.ps1` | PowerShell script for state tracking and logging |
| **Task Detector** | `task-detector.md` | Detects tasks from user input |
| **Task Parameters Reference** | `task-parameters-reference.md` | Reference for task parameter schemas |
| **Test Orchestration Patterns** | `test-orchestration-patterns.md` | Patterns for orchestrating test execution |
| **UI Debugging Protocol** | `ui-debugging-protocol.md` | UI debugging workflow and standards |
| **User Dictionary** | `UserDictionary.md` | Custom terminology and definitions |
| **Validation Engine** | `validation-engine.md` | Core validation logic and rules |
| **Validation Handoff Protocol** | `validation-handoff-protocol.md` | Validation handoff between agents |
| **Warning Handling Mandate** | `warning-handling-mandate.md` | Treats warnings as errors, retry logic |
| **Work Classifier** | `work-classifier.md` | Classifies work types and routing |

---

## Technology Stack

### Backend Framework
| Technology | Version | Purpose | Package/Reference |
|------------|---------|---------|-------------------|
| **.NET** | 8.0 | Primary backend framework | `Microsoft.NET.Sdk.Web` |
| **ASP.NET Core** | 8.0 | Web application framework | Built into .NET 8.0 |
| **Entity Framework Core** | 8.0.11 | ORM and database access | `Microsoft.EntityFrameworkCore.SqlServer` |
| **SQL Server** | Latest | Primary database | Connection via EF Core |
| **SignalR** | 8.0.0 | Real-time communication | `Microsoft.AspNetCore.SignalR.Client` |
| **Serilog** | 8.0.0 | Structured logging | `Serilog.AspNetCore`, `Serilog.Sinks.File`, `Serilog.Sinks.Console` |

### Frontend Framework
| Technology | Version | Purpose | Package/Reference |
|------------|---------|---------|-------------------|
| **Blazor** | 8.0 | UI framework | Built into ASP.NET Core |
| **MudBlazor** | 8.13.0 | Component library | `MudBlazor` |
| **HtmlAgilityPack** | 1.12.3 | HTML parsing | `HtmlAgilityPack` |
| **AngleSharp** | 1.0.7 | HTML/CSS parsing | `AngleSharp` |

### Testing Infrastructure
| Technology | Version | Purpose | Package/Reference |
|------------|---------|---------|-------------------|
| **Playwright** | 1.56.1 | E2E browser testing | `@playwright/test`, `playwright` |
| **Percy** | 1.31.4 | Visual regression testing | `@percy/cli`, `@percy/playwright` |
| **TypeScript** | 5.9.2 | Type-safe test authoring | `typescript` |
| **ts-node** | 10.9.2 | TypeScript execution for Node.js | `ts-node` |
| **MSSQL** | 11.0.1 | Database testing utilities | `mssql`, `@types/mssql` |

### Code Quality Tools
| Technology | Version | Purpose | Package/Reference |
|------------|---------|---------|-------------------|
| **Roslynator** | 4.12.4 | C# code analysis | `Roslynator.Analyzers` |
| **StyleCop** | 1.2.0-beta.507 | C# code style enforcement | `StyleCop.Analyzers` |
| **Microsoft .NET Analyzers** | 8.0.0 | .NET code quality | `Microsoft.CodeAnalysis.NetAnalyzers` |
| **ESLint** | 9.36.0 | JavaScript/TypeScript linting | `eslint`, `@typescript-eslint/*` |
| **Prettier** | 3.6.2 | Code formatting | `prettier` |
| **Stylelint** | 16.25.0 | CSS/Razor linting | `stylelint`, `stylelint-config-standard` |

### External Services
| Service | Purpose | Configuration |
|---------|---------|---------------|
| **Azure OpenAI** | AI/ML capabilities | `Azure.AI.OpenAI` (v2.1.0) |
| **Cloudflare CDN** | Content delivery | `https://resources.kashkole.com` |
| **Cloudflare Tunnel** | Secure tunneling | Configured via `.guards/` scripts |

---

## Development Tools

### Package Managers
- **NuGet**: .NET package management
- **npm**: Node.js package management (v1.0.0 project)

### Build Tools
- **dotnet CLI**: Primary build tool for .NET
- **MSBuild**: Visual Studio build system
- **TypeScript Compiler**: `tsc` for TypeScript compilation

### Development Environment
- **Visual Studio Code**: Primary IDE
- **PowerShell**: Scripting and automation (pwsh.exe)
- **Git**: Version control with LFS support

### UI Mapping & Test Preparation
- **ui-map.prompt.md**: Interactive UI element mapping for Playwright tests
- **analyze-ui-elements.ps1**: Automated PowerShell script for batch element analysis
- **Element Maps**: Published to `.github/key-data-streams/{key}/handoffs/`
- **Test Integration**: Maps used by test-prep and test-generation prompts

### Testing Tools
- **Playwright Test Runner**: E2E test execution
- **Percy CLI**: Visual regression test execution
- **Playwright Codegen**: Test generation tool
- **Playwright UI Mode**: Interactive test debugging

---

## Infrastructure

### Database
| Component | Details |
|-----------|---------|
| **Development DB** | `KSESSIONS_DEV` on AHHOME (Windows) / 192.168.1.58 (macOS) |
| **Production DB** | `KSESSIONS` on AHHOME |
| **Connection Pooling** | Enabled via `MultipleActiveResultSets=true` |
| **Timeout** | 3600 seconds |

### CDN Configuration
| Environment | Base URL | CORS |
|-------------|----------|------|
| **Development** | `https://resources.kashkole.com` | Configured for localhost |
| **Production** | `https://resources.kashkole.com` | Production domains only |

### Deployment Tools
| Tool | Location | Purpose |
|------|----------|---------|
| **ncdeploy** | `Scripts/ncdeploy.ps1` | Production deployment script |
| **ncrollback** | `Scripts/ncrollback.ps1` | Rollback utility |
| **Host Provisioner** | `Tools/HostProvisioner/` | Session provisioning tool |
| **NCList** | `Tools/NCList/` | CLI session listing utility |

### Guard Scripts
Located in `.guards/`
- `Issue-67-Protection.ps1`: Validation for issue #67
- `Issue-80-Protection.ps1`: Validation for issue #80
- `test-guard-system.ps1`: Guard system testing

### Post-Build Hooks
Located in `.hooks/`
- `run-post-build.ps1`: Post-build validation
- `pre-commit`: Git pre-commit hook
- `validate-tunnel-id.ps1`: Tunnel ID validation

---

## VS Code Tasks

### Build Tasks
- `build`: Build main NoorCanvas project
- `build-protected`: Build with Issue-67 protection validation
- `build-with-iiskill`: Build with IIS termination
- `build-host-provisioner`: Build Host Provisioner tool

### Test Tasks
- `validate-issue-67-protection`: Run Issue-67 guards
- `validate-issue-80-protection`: Run Issue-80 guards
- `test-guard-system`: Test guard infrastructure
- `run-post-build-tests`: Execute post-build validation
- `test-session-title-fix`: UI test for session title fix
- `test-debug-panel-percy`: Percy visual regression for debug panel
- `test-plain-text-button-removal`: UI test for button removal
- `run-transcript-canvas-visual-tests`: Transcript canvas visual tests

### Run Tasks
- `run-noorcanvas`: Start application
- `run-with-iiskill`: Start with IIS cleanup
- `run-host-provisioner-session-215`: Test Host Provisioner
- `start-noor-canvas`: Background app startup

### Analysis Tasks
- `run-roslynator-analysis`: Comprehensive code quality analysis
- `run-roslynator-analysis-and-open`: Analysis with auto-open report

---

## Configuration Files

### Root Level
- `package.json`: npm configuration and test scripts
- `NoorCanvas.sln`: Visual Studio solution
- `Directory.Build.props`: Shared MSBuild properties

### Config Directory (`config/`)
- `sharedsettings.json`: Shared application settings
- `sharedsettings.local.json`: Local overrides (not committed)
- `README_LOCAL_OVERRIDES.md`: Local override documentation
- `testing/playwright.config.cjs`: Playwright configuration
- `testing/tsconfig.json`: TypeScript configuration
- `testing/eslint.config.js`: ESLint configuration
- `testing/.prettierrc`: Prettier configuration

### GitHub Configuration (`.github/`)
- `instructions/`: Application-specific instructions
- `prompts/`: Prompt system
- `key-data-streams/`: Work tracking and state
- `hooks/`: Git hooks

---

## npm Scripts Reference

### Test Execution
```bash
npm test                    # Run all tests
npm run test:headed        # Run with browser UI
npm run test:debug         # Debug mode
npm run test:ui-mode       # Interactive UI mode
npm run test:percy         # Visual regression tests
npm run test:report        # Show test report
```

### Code Quality
```bash
npm run lint               # Lint TypeScript files
npm run lint:css           # Lint CSS/Razor files
npm run lint:css:fix       # Auto-fix CSS issues
npm run format             # Format with Prettier
npm run format:check       # Check formatting
npm run build:tests        # Type-check tests
```

### Specialized Tests
```bash
npm run test:host          # Host authentication tests
npm run test:cascading     # Cascading dropdown tests
npm run test:user          # User authentication tests
npm run test:api           # API integration tests
npm run test:codegen       # Generate tests via Playwright codegen
```

---

## Documentation

### DocFX Documentation
- `DocFX/docfx.json`: Main DocFX configuration
- `DocFX/docfx-articles-only.json`: Articles-only build
- `DocFX/_site/`: Generated documentation

### Project Documentation (`Docs/`)
- `ANNOTATION-QUICK-REF.md`: Annotation system reference
- `CDN-DEVELOPMENT-CORS.md`: CDN CORS configuration
- `DEPLOYMENT-VALIDATION-CHECKLIST.md`: Deployment checklist
- `LOGGING-ENHANCEMENT-SUMMARY.md`: Logging system docs
- `PRODUCTION-LOGGING-DEPLOYMENT-20251026.md`: Production logging
- `TESTING_FRAMEWORK_V2_SUMMARY.md`: Testing framework v2
- `VISUAL_REGRESSION_TESTING.md`: Visual regression testing guide
- `ZOOM-INTEGRATION-DOCUMENTATION.md`: Zoom integration

---

## Maintenance Instructions

### Auto-Update This Registry
This file is automatically updated by the following prompts when they detect changes to:
- Prompt files (`.github/prompts/**/*.md`)
- Package dependencies (`package.json`, `*.csproj`)
- Configuration files (`config/`, `.github/`)
- Infrastructure scripts (`Scripts/`, `.guards/`, `.hooks/`)

**Prompts that update this registry:**
1. `enhance-prompts.prompt.md` - When enhancing prompt infrastructure
2. `healthcheck.prompt.md` - During system health audits
3. `project-enhancement.prompt.md` - When analyzing/recommending stack improvements

### Manual Update
Use the on-demand update prompt:
```
#update-registry scope=<scope>
```

**Scopes:**
- `prompts` - Update only prompt listings
- `stack` - Update only technology stack
- `tools` - Update only development tools
- `all` - Full registry update (default)

---

## Version History

| Version | Date | Changes | Updated By |
|---------|------|---------|------------|
| 1.0.0 | 2025-10-28 | Initial registry creation | System initialization |

---

**Note:** This is a living document. All changes to prompts, dependencies, or infrastructure should be reflected here automatically or via manual update using `#update-registry`.
