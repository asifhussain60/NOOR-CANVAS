# Portable AI Agent System - Installation & Usage Guide

**Created:** October 11, 2025  
**Version:** 1.0.0  
**Source:** NOOR CANVAS Production System

---

## What You Have

This portable package contains a complete AI agent orchestration system extracted from a production application and generalized for use with ANY software project.

---

## Package Contents

```
.github/_Portable/
├── README.md                           # Overview and benefits
├── SETUP.prompt.md                     # One-time automated setup
├── INSTALLATION-GUIDE.md               # This file
│
├── prompts/                            # Agent prompt templates
│   ├── task.prompt.md.template         # Task executor agent
│   ├── refactor.prompt.md.template     # Code quality agent
│   ├── healthcheck.prompt.md.template  # System validation agent
│   ├── sync.prompt.md.template         # Documentation sync agent
│   ├── question.prompt.md.template     # Knowledge agent
│   ├── analyze-learning.prompt.md.template # Pattern analysis agent
│   ├── test-generation.prompt.md.template  # Test creation agent
│   │
│   └── shared/                         # Shared modules
│       ├── commit-message-format.md
│       ├── debug-logging-mandate.md
│       ├── warning-handling-mandate.md
│       ├── step-0-server-cleanup.md
│       └── step-1-checkpoint.md
│
└── instructions/                       # Instruction templates
    ├── SelfAwareness.instructions.md.template
    │
    └── Links/
        ├── SystemStructureSummary.md.template
        ├── ProjectArchitecture.md.template
        ├── AnalyzerConfig.md.template
        ├── ValidationFramework.md.template
        ├── TestingConfig.md.template
        └── APIContractValidation.md.template
```

---

## Quick Installation

### Option 1: Fully Automated (Recommended)

1. **Copy this folder to your target project:**
   ```powershell
   Copy-Item "D:\PROJECTS\NOOR CANVAS\.github\_Portable" -Destination "YourProject\.github\_Portable" -Recurse
   ```

2. **Open your target project in VS Code**

3. **Run the setup prompt:**
   ```
   @workspace Use the file at .github/_Portable/SETUP.prompt.md to initialize the AI agent system for this project. Analyze the complete application and configure all agents.
   ```

4. **Wait 15-30 minutes** while the setup agent:
   - Analyzes your application structure
   - Detects technology stack
   - Installs required tools
   - Generates customized prompts
   - Creates workspace structure
   - Performs initial validation

5. **Review generated files** in:
   - `.github/prompts/` - Your customized agent prompts
   - `.github/instructions/` - Your project documentation
   - `Workspaces/Copilot/` - Agent workspace and learning infrastructure

6. **Start using agents!**

---

### Option 2: Manual Installation

If you prefer more control:

1. **Copy portable folder** to your project

2. **Review templates** in `.github/_Portable/prompts/` and `.github/_Portable/instructions/`

3. **Manually replace placeholders:**
   - Search for `{{PLACEHOLDER}}` markers
   - Replace with your project-specific values
   - See "Placeholder Guide" section below

4. **Create workspace structure:**
   ```
   Workspaces/
   ├── Copilot/
   │   ├── prompts.keys/
   │   ├── learning/patterns/
   │   ├── config/
   │   ├── _DOCS/
   │   └── artifacts/
   ├── CodeQuality/
   ├── Documentation/
   ├── Global/
   └── TEMP/
   ```

5. **Install tools manually:**
   - Roslynator (if .NET): `dotnet tool install -g roslynator.dotnet.cli`
   - Playwright (if web app): `npm install -D @playwright/test`
   - ESLint (if JS/TS): `npm install -D eslint`
   - Prettier (if JS/TS): `npm install -D prettier`

6. **Copy templates** from `_Portable/prompts/` to `.github/prompts/`

7. **Copy templates** from `_Portable/instructions/` to `.github/instructions/`

8. **Remove** `.template` extensions from all files

9. **Test** by running: `@workspace /question "What agents are available?"`

---

## Placeholder Guide

If manually installing, replace these placeholders in template files:

### In All Prompt Files

| Placeholder | Replace With | Example |
|-------------|--------------|---------|
| `{{PROJECT_NAME}}` | Your project name | "MyAwesomeApp" |
| `{{SETUP_DATE}}` | Setup date | "2025-10-11" |
| `{{PLACEHOLDER_BUILD_COMMAND}}` | Your build command | `dotnet build` or `npm run build` |
| `{{PLACEHOLDER_TEST_COMMAND}}` | Your test command | `dotnet test` or `npm test` |
| `{{PLACEHOLDER_SERVER_CLEANUP_COMMAND}}` | How to kill your dev server | `pkill -f "dotnet"` |

### In Task Prompt Template

| Placeholder | Replace With | Example |
|-------------|--------------|---------|
| `{{PLACEHOLDER_PROJECT_LAYERS}}` | Your architecture layers | "UI, API, Services, Data, Database" |
| `{{PLACEHOLDER_IMPLEMENTATION_PATTERNS}}` | Your coding patterns | "Follow MVC pattern, use dependency injection" |
| `{{PLACEHOLDER_TEST_EXTENSION}}` | Your test file extension | `.spec.ts` or `Tests.cs` |
| `{{PLACEHOLDER_TEST_EXECUTION_COMMAND}}` | How to run tests | `npx playwright test` or `dotnet test` |
| `{{PLACEHOLDER_ANALYZER_COMMAND}}` | Your analyzer command | `npx eslint .` or `.\run-roslynator.ps1` |
| `{{PLACEHOLDER_LINTER_COMMAND}}` | Your linter command | `npx prettier --check .` |
| `{{PLACEHOLDER_FULL_TEST_COMMAND}}` | Run all tests | `npm test` or `dotnet test` |

### In Refactor Prompt Template

| Placeholder | Replace With | Example |
|-------------|--------------|---------|
| `{{PLACEHOLDER_ANALYZERS}}` | Your static analysis tools | "Roslynator, ESLint, StyleCop" |
| `{{PLACEHOLDER_CODE_STYLE}}` | Your style guide | "Microsoft C# conventions" |

### In Health Check Prompt Template

| Placeholder | Replace With | Example |
|-------------|--------------|---------|
| `{{PLACEHOLDER_LAYERS}}` | Layers to validate | "Frontend, Backend, Database" |
| `{{PLACEHOLDER_CONTRACTS}}` | Contract types | "API DTOs, Database Models" |

### In Instructions

| Placeholder | Replace With | Example |
|-------------|--------------|---------|
| `{{PLACEHOLDER_ARCHITECTURE}}` | Your architecture description | "3-tier web application with React frontend and .NET backend" |
| `{{PLACEHOLDER_TECH_STACK}}` | Your technology stack | ".NET 8, React 18, SQL Server, SignalR" |
| `{{PLACEHOLDER_COMPONENTS}}` | Your main components | "AuthService, DataService, UIComponents" |

---

## What Gets Created

After setup (automated or manual), your project will have:

### 1. Agent Prompts (`.github/prompts/`)
- `task.prompt.md` - Your primary development agent
- `refactor.prompt.md` - Code quality improvement agent
- `healthcheck.prompt.md` - System validation agent
- `sync.prompt.md` - Documentation and cleanup agent
- `question.prompt.md` - Application knowledge agent
- `analyze-learning.prompt.md` - Pattern analysis agent
- `test-generation.prompt.md` - E2E test creation agent (if web app)
- `shared/` - Shared modules (commit format, debug logging, etc.)

### 2. Instructions (`.github/instructions/`)
- `SelfAwareness.instructions.md` - Global operating rules
- `Links/SystemStructureSummary.md` - Agent coordination map
- `Links/ProjectArchitecture.md` - Your application architecture
- `Links/AnalyzerConfig.md` - Code quality tools config
- `Links/ValidationFramework.md` - 6-level validation pipeline
- `Links/TestingConfig.md` - Test framework configuration
- `Links/APIContractValidation.md` - API contract validation (if web app)

### 3. Workspace Structure (`Workspaces/`)
```
Workspaces/
├── Copilot/                    # Agent operational workspace
│   ├── prompts.keys/           # Work tracking by feature key
│   │   └── _template/          # Template for new keys
│   ├── learning/               # Continuous improvement
│   │   └── patterns/
│   │       ├── task-patterns.json
│   │       ├── refactor-patterns.json
│   │       ├── validation-patterns.json
│   │       └── integration-patterns.json
│   ├── config/                 # Agent configurations
│   ├── _DOCS/                  # Analysis documents
│   │   ├── summaries/
│   │   ├── analysis/
│   │   ├── configs/
│   │   └── setup/
│   └── artifacts/              # Build/test artifacts
│
├── CodeQuality/                # Code analysis tools
│   ├── README.md
│   ├── run-analyzer.ps1/.sh   # Your analyzer runner
│   └── [Tool-specific dirs]    # Roslynator/, ESLint/, etc.
│
├── Documentation/              # Generated documentation
│   └── ANALYSIS_DOCS/
│
├── Global/                     # Global utility scripts
│   ├── rollback.ps1/.sh       # Automatic rollback
│   └── cleanup.ps1/.sh        # Cleanup utilities
│
└── TEMP/                       # Temporary files (auto-cleaned)
```

### 4. Configuration Files
- `.vscode/tasks.json` - VS Code tasks for building, testing, analyzing
- Tool-specific configs (`.eslintrc`, `.prettierrc`, `roslynator.config`, etc.)

---

## First Steps After Installation

### 1. Verify Installation

**Check that files were created:**
```powershell
# Check prompts
Get-ChildItem .github\prompts\*.md

# Check instructions
Get-ChildItem .github\instructions\Links\*.md

# Check workspace
Get-ChildItem Workspaces\Copilot\ -Recurse
```

**Read the setup report:**
```
Workspaces/Copilot/_DOCS/setup/SETUP-COMPLETE.md
```

### 2. Test Agents

**Ask a question:**
```
@workspace /question "What agents are available and what do they do?" depth=comprehensive
```

**Check system health:**
```
@workspace /healthcheck scope=all
```

**Try a simple task:**
```
@workspace /task key=welcome tasks="Create a welcome message in the code"
```

### 3. Review Documentation

**Read these in order:**
1. `.github/instructions/SelfAwareness.instructions.md` - The rules
2. `.github/instructions/Links/SystemStructureSummary.md` - Agent overview
3. `.github/instructions/Links/ProjectArchitecture.md` - Your app architecture
4. `.github/prompts/task.prompt.md` - How to use the task agent

### 4. Customize (Optional)

**Adjust agent behavior:**
- Edit prompt files in `.github/prompts/`
- Modify parameters, add project-specific rules
- Update execution steps for your workflow

**Adjust validation rules:**
- Edit `.github/instructions/Links/ValidationFramework.md`
- Add/remove validation levels
- Adjust thresholds

**Adjust code standards:**
- Edit `.github/instructions/Links/AnalyzerConfig.md`
- Configure tool-specific rules
- Add suppressions if needed

---

## Usage Examples

### Implementing a Feature

```
@workspace /task key=user-profile tasks="Add user profile page
---
Create profile edit form
---
Add profile photo upload
---
Implement save functionality
---
Add tests for profile features"
```

### Fixing a Bug

```
@workspace /task key=bug-123 tasks="Fix null reference exception in login handler"
```

### Improving Code Quality

```
@workspace /refactor scope=all notes="improve naming conventions and reduce complexity"
```

### Validating System Health

```
@workspace /healthcheck scope=all
```

### Syncing Documentation

```
@workspace /sync key=docs notes="update architecture documentation after database changes"
```

### Getting Application Knowledge

```
@workspace /question "How does the authentication flow work from login button click to session creation?" depth=comprehensive
```

### Analyzing Patterns

```
@workspace /analyze-learning scope=recent analysis-type=comprehensive
```

### Using Annotated Images

```
@workspace /task key=ui-redesign annotate="mockup-v1.png,mockup-v2.png" tasks="Implement new UI design from mockups"
```

---

## Agent Invocation Reference

### Task Agent
```
@workspace /task key={identifier} tasks="{task}\n---\n{task2}" debug-level=none verbosity=concise
```

### Refactor Agent
```
@workspace /refactor key={identifier} scope=all notes="{context}" debug-level=none verbosity=concise
```

### Health Check Agent
```
@workspace /healthcheck scope=all verbosity=concise
```

### Sync Agent
```
@workspace /sync key={identifier} notes="{context}"
```

### Question Agent
```
@workspace /question "{your question}" depth=comprehensive context="{optional-context}"
```

### Analyze Learning Agent
```
@workspace /analyze-learning scope=recent analysis-type=comprehensive
```

---

## Learning & Continuous Improvement

The system learns from every task:

### Pattern Files

**Location:** `Workspaces/Copilot/learning/patterns/`

**Contents:**
- `task-patterns.json` - Successful task approaches
- `refactor-patterns.json` - Effective refactoring strategies
- `validation-patterns.json` - Common issues and fixes
- `integration-patterns.json` - API/database patterns

### How Learning Works

1. **Agents query patterns** before starting work
2. **Successful approaches are recorded** after completion
3. **Failures are documented** to avoid repeating mistakes
4. **Patterns are shared** across all agents
5. **analyze-learning agent** extracts insights periodically

### Triggering Analysis

**Manually:**
```
@workspace /analyze-learning scope=recent
```

**Scheduled:**
- Weekly or after every 10 completed tasks
- Setup can configure automatic analysis

---

## Troubleshooting

### Setup Failed

**Check:**
- Setup report in `Workspaces/Copilot/_DOCS/setup/`
- Look for errors in setup log
- Verify tool installations manually
- Try manual installation if automated failed

### Agent Not Working

**Verify:**
- Prompt file exists in `.github/prompts/`
- Instructions exist in `.github/instructions/`
- Workspace structure created
- No syntax errors in markdown files

### Build Failures

**Check:**
- Your build command in prompt templates is correct
- Paths are correct for your project structure
- Tools are installed (compiler, runtime, etc.)

### Validation Failures

**Review:**
- ValidationFramework.md matches your project
- All 6 levels configured correctly
- Analyzer/linter tools installed and configured

### Can't Find Documentation

**Check:**
- `.github/instructions/` directory
- `Workspaces/Copilot/_DOCS/` directory
- Setup report for generation errors

---

## Updating the System

### Adding New Agents

1. Create prompt file: `.github/prompts/new-agent.prompt.md`
2. Follow existing prompt structure
3. Add to SystemStructureSummary.md
4. Test with simple invocation

### Modifying Existing Agents

1. Edit prompt file in `.github/prompts/`
2. Update SystemStructureSummary.md if responsibilities change
3. Test thoroughly before relying on changes

### Updating Learning Patterns

Patterns update automatically, but you can manually edit:
```
Workspaces/Copilot/learning/patterns/*.json
```

Follow the schema defined in `PATTERN_SCHEMA.md`

---

## Migration from Other Systems

### From Manual Development

1. Install agent system
2. Let agents document your existing code via question agent
3. Start using task agent for new work
4. Gradually refactor existing code with refactor agent

### From Other AI Tools

1. Review your existing AI workflows
2. Map them to agent responsibilities
3. Import any patterns into learning infrastructure
4. Adjust prompts to match your preferences

---

## Best Practices

### 1. Use Keys for Feature Work
```
@workspace /task key=user-auth tasks="..."
```
Tracks all work under one identifier

### 2. Phase Complex Tasks
```
@workspace /task key=feature tasks="Phase 1\n---\nPhase 2\n---\nPhase 3"
```
Automatic validation at each phase

### 3. Leverage Learning
```
@workspace /analyze-learning scope=recent
```
Run weekly to extract patterns

### 4. Validate Frequently
```
@workspace /healthcheck scope=all
```
Catch issues early

### 5. Ask Questions
```
@workspace /question "How does X work?"
```
Build application knowledge

### 6. Clean Up Regularly
```
@workspace /sync key=cleanup
```
Maintain project hygiene

### 7. Use Debug Levels Strategically
- Development: `debug-level=trace`
- Troubleshooting: `debug-level=simple`
- Production: `debug-level=cleanup`

---

## Advanced Features

### Functionality Registry

Track core behaviors that must never break:
- Located in key data streams
- Automatic regression prevention
- Test mapping for validation

### Cross-Agent Coordination

Agents work together automatically:
- Task → HealthCheck (validation)
- Refactor → HealthCheck (integrity check)
- Any agent → Question (knowledge queries)
- All agents → Learning (pattern contribution)

### Automatic Rollback

Safety mechanism triggers on:
- Persistent build warnings (3 attempts)
- Validation failures (3 attempts)
- Test failures (3 attempts)

### Debug Marker System

Temporary logging for troubleshooting:
- `debug-level=simple` - Basic markers
- `debug-level=trace` - Comprehensive markers
- `debug-level=cleanup` - Remove all markers

---

## Support Resources

### Generated Documentation
- `SelfAwareness.instructions.md` - Operating rules
- `SystemStructureSummary.md` - Agent map
- `ProjectArchitecture.md` - Your app structure
- `SETUP-COMPLETE.md` - Setup report

### Agent Help
Each prompt has comprehensive documentation:
- Parameters
- Execution steps
- Integration points
- Examples

### Ask the Question Agent
```
@workspace /question "How do I [task]?" depth=comprehensive
```
Your AI-powered knowledge base

---

## What's Next?

1. **✅ Installation complete** - System is ready to use
2. **📖 Read documentation** - Understand how agents work
3. **🎯 Try agents** - Start with simple tasks
4. **🔧 Customize** - Adjust prompts for your workflow
5. **📈 Learn** - System improves with every task
6. **🚀 Scale** - Use across all development work

---

## Success Metrics

You'll know the system is working when:

✅ Tasks complete with zero warnings
✅ Tests generated automatically
✅ Documentation stays synchronized
✅ Code quality improves over time
✅ Agents provide accurate application knowledge
✅ Patterns accumulate and get reused
✅ Development velocity increases
✅ Technical debt decreases

---

## License & Credits

**Source:** Extracted from NOOR CANVAS production system  
**License:** Use freely in your projects  
**Customization:** Encouraged and supported  
**Attribution:** Optional but appreciated

---

## Version History

- **v1.0.0** (2025-10-11)
  - Initial portable release
  - Complete agent system
  - Automated setup
  - Cross-language support
  - Learning infrastructure
  - Comprehensive documentation

---

**Ready to transform your development workflow? Run the setup prompt and get started!**
