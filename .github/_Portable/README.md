# Portable AI Agent System

**Version:** 1.0.0  
**Created:** October 11, 2025  
**Purpose:** Generic, portable AI agent framework adaptable to any application  
**Setup Time:** 5 minutes

---

## 🚀 Super Quick Start

**Two steps. That's it.**

```powershell
# 1. Copy this folder to your project
Copy-Item ".github\_Portable" -Destination "C:\YourProject\.github\_Portable" -Recurse

# 2. Run setup
cd C:\YourProject\.github\_Portable
.\setup.bat
```

**Done!** In 5 minutes you have:
- ✅ 6 intelligent AI agents configured for your project
- ✅ All quality tools installed (Roslynator, Playwright, ESLint)
- ✅ Workspace structure created
- ✅ Learning system initialized
- ✅ Project-specific documentation generated

**Next:** `@workspace /question "What agents are available?"`

**More details:** See [START-HERE.md](START-HERE.md)

---

## What This System Provides

### 6 Specialized AI Agents
1. **Task Executor** - Feature development, bug fixes (0 errors/warnings policy)
2. **Refactor Agent** - Code quality improvements
3. **Health Check Agent** - System validation
4. **Sync Agent** - Documentation maintenance
5. **Question Agent** - Knowledge queries
6. **Learning Agent** - Pattern analysis & continuous improvement

### Universal Compatibility
- ✅ .NET (C#, ASP.NET Core, Blazor)
- ✅ JavaScript/TypeScript (React, Vue, Angular, Node.js)
- ✅ Python (Django, Flask, FastAPI)
- ✅ Java (Spring Boot, Maven, Gradle)
- ✅ Ruby (Rails)
- ✅ Go, PHP, and more via auto-detection

### Quality & Safety
- 🛡️ Zero-tolerance: 0 errors, 0 warnings
- 🔄 Automatic rollback on failures
- ✅ 6-level validation pipeline
- 📊 Learning from patterns
- 🧪 Automatic test generation

---

## Installation Options

### Recommended: Automated Setup (5 minutes)

**Windows:**
```cmd
.\setup.bat
```

**PowerShell:**
```powershell
.\setup.ps1
```

**What it does:**
- Detects your project type automatically
- Installs required tools
- Configures all agents with your project details
- Creates workspace structure
- Generates PROJECT-SETUP-SUMMARY.md

**Full guide:** [START-HERE.md](START-HERE.md)

### Alternative: Manual Setup (60 minutes)

For users who prefer manual control or need customization:

**Guide:** [INSTALLATION-GUIDE.md](INSTALLATION-GUIDE.md)

---

## Documentation

### Essential (Read First)
- **[START-HERE.md](START-HERE.md)** - Single entry point, quick start
- **PROJECT-SETUP-SUMMARY.md** - Auto-generated for your project after setup

### Reference (As Needed)
- **[docs/AGENT-REFERENCE.md](docs/AGENT-REFERENCE.md)** - How to use each agent
- **[docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)** - Common issues
- **[docs/ADVANCED-USAGE.md](docs/ADVANCED-USAGE.md)** - Power user features

### Optional (Deep Dives)
- **[INSTALLATION-GUIDE.md](INSTALLATION-GUIDE.md)** - Detailed manual setup
- **[docs/SIMPLIFIED-INSTALLATION-VISUAL.md](docs/SIMPLIFIED-INSTALLATION-VISUAL.md)** - Visual guide
- **[docs/SIMPLIFICATION-SUMMARY.md](docs/SIMPLIFICATION-SUMMARY.md)** - How we made it simple

### Option 2: Manual Installation

If you prefer manual control:

1. **Copy Base Files**
   ```powershell
   # Copy to your project root
   Copy-Item ".github\_Portable\prompts" -Destination "YourProject\.github\prompts" -Recurse
   Copy-Item ".github\_Portable\instructions" -Destination "YourProject\.github\instructions" -Recurse
   ```

2. **Run Setup Prompt**
   ```
   @workspace Run setup analysis from .github/_Portable/SETUP.prompt.md
   ```

3. **Review Generated Files**
   The setup will create customized versions in:
   - `.github/prompts/` - All agent prompts
   - `.github/instructions/` - Project-specific documentation
   - `Workspaces/Copilot/` - Agent state and learning infrastructure

---

## System Architecture

### Agent Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                     USER INTERACTIONS                        │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Question   │    │     Task     │    │   Refactor   │
│    Agent     │    │   Executor   │    │    Agent     │
│  (Read-Only) │    │  (Primary)   │    │  (Quality)   │
└──────────────┘    └──────────────┘    └──────────────┘
        │                   │                   │
        │                   ▼                   │
        │           ┌──────────────┐           │
        └──────────▶│ Health Check │◀──────────┘
                    │    Agent     │
                    │ (Validation) │
                    └──────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│     Sync     │    │   Learning   │    │ Test Gen     │
│    Agent     │    │    Agent     │    │   Agent      │
│  (Cleanup)   │    │  (Analysis)  │    │ (Optional)   │
└──────────────┘    └──────────────┘    └──────────────┘
```

### Agent Responsibilities

| Agent | Purpose | Mode | Modifies Code |
|-------|---------|------|---------------|
| **Task** | Feature implementation, bug fixes | Primary | ✅ Yes |
| **Refactor** | Code quality improvement | Quality | ✅ Yes |
| **Health Check** | System integrity validation | Read-Only | ❌ No |
| **Sync** | Documentation and cleanup | Maintenance | ✅ Limited |
| **Question** | Knowledge and investigation | Read-Only | ❌ No |
| **Learning** | Pattern analysis | Read-Only | ❌ No (updates patterns only) |
| **Test Generation** | E2E test creation | Optional | ✅ Yes (tests only) |

---

## Key Features

### 1. Phase-Based Execution
Break complex tasks into sequential phases with automatic validation:
```
Task 1: Implement feature A
---
Task 2: Add tests for feature A
---
Task 3: Update documentation
```

### 2. Debug Logging Control
Insert debug markers for troubleshooting, then automatically remove:
```
debug-level=trace    # Comprehensive debugging
debug-level=cleanup  # Remove all debug markers
```

### 3. Key Management System
Track all work under unique keys with complete history:
- Status tracking (new → in-progress → complete)
- File modification tracking
- Phase execution logs
- Test coverage mapping

### 4. Cross-Agent Learning
Agents learn from past executions:
- Success patterns → Reuse proven approaches
- Failure patterns → Avoid repeated mistakes
- Efficiency insights → Optimize workflows

### 5. Zero-Tolerance Quality
Mandatory clean builds:
- 0 compilation errors
- 0 compilation warnings
- Full analyzer compliance
- All tests passing

---

## Technology Stack Supported

### Currently Optimized For
- **.NET** (C#, ASP.NET Core, Blazor, Razor)
- **JavaScript/TypeScript** (Node.js, React, Vue, Angular)
- **Python** (Django, Flask, FastAPI)
- **Database** (SQL Server, PostgreSQL, MySQL)
- **Testing** (Playwright, xUnit, NUnit, Jest, Pytest)

### Extensible To
Any language or framework - the setup prompt detects your stack automatically.

---

## Tool Requirements

### Mandatory Tools
These will be installed automatically by the setup prompt:

- **Git** - Version control (for checkpoints and rollbacks)
- **Your Language Runtime** - .NET, Node.js, Python, etc.

### Optional Tools (Auto-Detected & Configured)
- **Roslynator** - C# code analysis (if .NET project)
- **Playwright** - E2E testing (if web application)
- **ESLint** - JavaScript linting (if JS/TS project)
- **Prettier** - Code formatting (if JS/TS project)

---

## Workspace Structure

After setup, your project will have:

```
YourProject/
├── .github/
│   ├── prompts/                    # All agent prompts
│   │   ├── task.prompt.md
│   │   ├── refactor.prompt.md
│   │   ├── healthcheck.prompt.md
│   │   ├── sync.prompt.md
│   │   ├── question.prompt.md
│   │   ├── analyze-learning.prompt.md
│   │   └── shared/                 # Shared modules
│   │       ├── commit-message-format.md
│   │       ├── debug-logging-mandate.md
│   │       ├── warning-handling-mandate.md
│   │       ├── step-0-server-cleanup.md
│   │       └── step-1-checkpoint.md
│   └── instructions/               # Project documentation
│       ├── SelfAwareness.instructions.md
│       └── Links/
│           ├── SystemStructureSummary.md
│           ├── ProjectArchitecture.md
│           ├── AnalyzerConfig.md
│           ├── ValidationFramework.md
│           └── APIContractValidation.md
│
├── Workspaces/
│   └── Copilot/                    # Agent workspace
│       ├── prompts.keys/           # Key tracking
│       ├── learning/               # Pattern files
│       │   ├── task-patterns.json
│       │   ├── refactor-patterns.json
│       │   └── validation-patterns.json
│       ├── config/                 # Agent configurations
│       └── _DOCS/                  # Analysis documents
│
└── [Your existing project files]
```

---

## Usage Examples

### Implementing a Feature
```
@workspace /task key=user-auth tasks="Add login page\n---\nImplement authentication API\n---\nAdd tests"
```

### Improving Code Quality
```
@workspace /refactor scope=all notes="improve naming conventions and reduce complexity"
```

### Checking System Health
```
@workspace /healthcheck scope=all
```

### Getting Answers
```
@workspace /question "How does the authentication flow work?" depth=comprehensive
```

### Syncing Documentation
```
@workspace /sync key=docs notes="update architecture documentation after refactor"
```

### Analyzing Patterns
```
@workspace /analyze-learning scope=recent analysis-type=success-patterns
```

---

## Benefits

### For Development Teams
- **Consistency** - All team members follow same patterns
- **Quality** - Zero-tolerance policy prevents technical debt
- **Knowledge** - Agents provide instant application knowledge
- **Efficiency** - Automated testing, validation, and cleanup
- **Learning** - System improves from every task

### For Solo Developers
- **Pair Programming** - Intelligent agents assist with everything
- **Documentation** - System self-documents automatically
- **Testing** - Automatic test generation and validation
- **Refactoring** - Safe, validated code improvements
- **Knowledge Base** - Never forget how your app works

### For AI/Copilot Users
- **Structured** - Clear agent boundaries and responsibilities
- **Reliable** - Validation prevents breaking changes
- **Intelligent** - Learns from patterns and improves
- **Comprehensive** - Covers entire development lifecycle
- **Portable** - Works across any project

---

## Migration Path

### From Manual Development
1. Run setup prompt to initialize system
2. Start with `/task` for feature work
3. Use `/healthcheck` to validate existing code
4. Gradually adopt other agents

### From Other AI Systems
1. Review generated prompts and customize
2. Import existing patterns into learning infrastructure
3. Map your workflows to agent responsibilities
4. Leverage cross-agent coordination

---

## Customization

All prompts and instructions are markdown files - easily customizable:

1. **Agent Behavior** - Edit prompt files in `.github/prompts/`
2. **Validation Rules** - Modify `ValidationFramework.md`
3. **Code Standards** - Update `AnalyzerConfig.md`
4. **Learning Patterns** - Adjust pattern files in `Workspaces/Copilot/learning/`

---

## Support & Documentation

### Generated Documentation
After setup, see:
- `.github/instructions/SelfAwareness.instructions.md` - Global rules
- `.github/instructions/Links/SystemStructureSummary.md` - Agent overview
- `.github/instructions/Links/ProjectArchitecture.md` - Your app architecture

### Agent-Specific Help
Each agent prompt has comprehensive documentation of:
- Parameters
- Execution steps
- Integration points
- Expected outcomes

---

## Version History

- **v1.0.0** (2025-10-11) - Initial portable release
  - Extracted from NOOR CANVAS production system
  - Generalized for any application
  - Automated setup prompt
  - Complete documentation

---

## License

This system is provided as-is for use in your projects. Customize freely.

---

## Next Steps

**Ready to get started?**

1. Run the setup prompt: `.github/_Portable/SETUP.prompt.md`
2. Review generated files in `.github/prompts/` and `.github/instructions/`
3. Try your first task: `@workspace /task key=test-drive tasks="explore agent system"`
4. Read the generated documentation to understand your new AI-powered workflow

**Questions?**

Ask the Question Agent after setup:
```
@workspace /question "How do I use the AI agent system?" depth=comprehensive
```
