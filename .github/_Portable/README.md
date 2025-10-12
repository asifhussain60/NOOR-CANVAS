# Portable AI Agent System

**Version:** 2.0.0  
**Created:** October 12, 2025  
**Purpose:** Universal AI agent framework for any software project  
**Setup Time:** 5 minutes

---

## 🚀 Quick Start

**Two commands. That's it.**

```powershell
# 1. Copy this folder to your project
Copy-Item "_Portable" -Destination "C:\YourProject\.github\_Portable" -Recurse

# 2. Run setup
cd C:\YourProject\.github\_Portable
.\setup.bat
```

**Done!** In 5 minutes you have:
- ✅ 6 specialized AI agents configured for your project
- ✅ Workspace structure created
- ✅ Quality tools configured
- ✅ Learning system initialized
- ✅ Project-specific documentation generated

**Next:** `@workspace /question "What agents are available?"`

---

## What This System Provides

### 6 Specialized AI Agents

1. **Task Executor** (`/task`)
   - Feature development and bug fixes
   - Progressive documentation with git integration
   - Automatic test generation
   - Zero errors/warnings policy

2. **Refactor Agent** (`/refactor`)
   - Code quality improvements
   - Technical debt reduction
   - Pattern extraction and reuse

3. **Sync Agent** (`/sync`)
   - Documentation synchronization
   - Cross-reference validation
   - Automated updates

4. **Health Check Agent** (`/healthcheck`)
   - System integrity validation
   - 6-level validation pipeline
   - Comprehensive reporting

5. **Question Agent** (`/question`)
   - Codebase knowledge queries
   - Architecture explanations
   - Pattern discovery

6. **Test Generation Agent** (`/test-generation`)
   - End-to-end test creation
   - Multi-browser testing
   - Proven test patterns

### Universal Compatibility

- ✅ **.NET** (C#, ASP.NET Core, Blazor, Entity Framework)
- ✅ **JavaScript/TypeScript** (React, Vue, Angular, Next.js, Node.js)
- ✅ **Python** (Django, Flask, FastAPI)
- ✅ **Java** (Spring Boot, Maven, Gradle)
- ✅ **Ruby** (Rails)
- ✅ **Go**, **PHP**, and more via auto-detection

### Quality & Safety

- 🛡️ **Zero-tolerance**: 0 errors, 0 warnings
- 🔄 **Automatic rollback** on failures
- ✅ **6-level validation** pipeline
- 📊 **Learning from patterns**
- 🧪 **Automatic test generation**
- 📝 **Progressive documentation**

---

## Installation

### Option 1: Automated Setup (Recommended - 5 minutes)

**Windows:**
```cmd
.\setup.bat
```

**PowerShell/Linux/Mac:**
```powershell
.\setup.ps1
```

**What it does:**
1. Detects your project type automatically
2. Creates workspace structure
3. Generates project-specific agent configurations
4. Installs required tools (optional)
5. Creates PROJECT-SETUP-SUMMARY.md with your configuration

### Option 2: Manual Setup (60 minutes)

For advanced users who need customization:

1. Copy template files to `.github/` folder
2. Replace `{{PROJECT_NAME}}` placeholders manually
3. Create workspace directories
4. Install tools based on your stack

**Full guide:** [docs/INSTALLATION-GUIDE.md](docs/INSTALLATION-GUIDE.md)

---

## Documentation Structure

### Essential (Read First)
- **[START-HERE.md](START-HERE.md)** - Complete getting started guide
- **PROJECT-SETUP-SUMMARY.md** - Auto-generated after setup (in your project root)

### Reference (As Needed)
- **[QUICK-REFERENCE.md](QUICK-REFERENCE.md)** - Command cheat sheet
- **[QUICK-START-CHECKLIST.md](QUICK-START-CHECKLIST.md)** - Setup verification
- **[docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)** - Common issues and solutions

### Advanced
- **[docs/AGENT-REFERENCE.md](docs/AGENT-REFERENCE.md)** - Detailed agent documentation
- **[docs/ADVANCED-USAGE.md](docs/ADVANCED-USAGE.md)** - Advanced patterns and workflows
- **[FILE-INDEX.md](FILE-INDEX.md)** - Complete file directory

---

## Quick Examples

### Start a New Feature
```
@workspace /task key=auth tasks="Add user authentication"
```

### Fix a Bug
```
@workspace /task key=bugfix tasks="Fix login redirect issue"
```

### Improve Code Quality
```
@workspace /refactor scope=UserService tasks="Extract validation logic"
```

### Generate Tests
```
@workspace /test-generation feature=login scenario=success-flow multiUser=true
```

### Ask Questions
```
@workspace /question "How does the database connection work?"
```

### Validate System
```
@workspace /healthcheck
```

---

## Key Features

### Progressive Documentation
Every task automatically creates and updates work logs with:
- Git commit SHAs for traceability
- File change history
- Test coverage documentation
- Timestamp-based audit trail

### Automatic Test Generation
When implementing UI changes, agents automatically:
- Detect need for end-to-end tests
- Generate Playwright/Selenium tests
- Follow proven patterns
- Validate implementation

### Zero-Tolerance Quality
All agents enforce:
- 0 compilation errors
- 0 compiler warnings
- 0 analyzer warnings
- Automatic rollback on violations

### Learning System
Agents continuously:
- Learn from successful patterns
- Avoid repeating mistakes
- Share knowledge across features
- Improve over time

---

## Architecture

```
Your Project Root/
├── .github/
│   ├── _Portable/              # This folder (portable system)
│   ├── prompts/                # Agent prompt files (generated)
│   │   ├── task.prompt.md
│   │   ├── refactor.prompt.md
│   │   ├── sync.prompt.md
│   │   └── shared/            # Shared modules
│   └── instructions/           # System guidelines (generated)
│       ├── SelfAwareness.instructions.md
│       └── Links/             # Reference docs
│
├── Workspaces/
│   ├── Copilot/               # Agent workspace
│   │   ├── _DOCS/            # Analysis and summaries
│   │   ├── config/           # Agent configurations
│   │   ├── learning/         # Pattern library
│   │   └── prompts.keys/     # Work tracking by feature
│   ├── CodeQuality/          # Analysis tools
│   └── TEMP/                 # Temporary files
│
├── PROJECT-SETUP-SUMMARY.md   # Your configuration (generated)
└── Your project files...
```

---

## Requirements

### Minimum
- **PowerShell** 5.1+ (Windows) or PowerShell Core 7+ (cross-platform)
- **Git** (for version control integration)
- **GitHub Copilot** in VS Code (or compatible IDE)

### Recommended
- **.NET SDK** 6.0+ (for C# projects)
- **Node.js** 16+ (for JavaScript/TypeScript projects)
- **Python** 3.8+ (for Python projects)
- **Roslynator** (for .NET code analysis)
- **Playwright** (for E2E testing)

*Note: Setup script auto-installs tools based on detected project type*

---

## Configuration

After setup, customize your installation:

### Agent Behavior
Edit `.github/prompts/task.prompt.md` (and other prompt files) to:
- Adjust verbosity levels
- Modify validation rules
- Add project-specific guidelines
- Configure debug logging behavior

### Validation Rules
Edit `.github/instructions/ValidationFramework.md` to:
- Define custom validation levels
- Configure analyzer rules
- Set quality thresholds

### Learning Patterns
Edit `Workspaces/Copilot/learning/` files to:
- Add proven patterns
- Document anti-patterns
- Share team knowledge

---

## Compatibility Matrix

| Technology | Support | Features Available |
|------------|---------|-------------------|
| .NET (C#, ASP.NET Core, Blazor) | ✅ Full | All agents, Roslynator analysis, automatic refactoring |
| JavaScript/TypeScript (React, Vue, Angular) | ✅ Full | All agents, ESLint analysis, Playwright tests |
| Python (Django, Flask) | ✅ Full | All agents, Pylint analysis |
| Java (Spring Boot) | ✅ Good | All agents, basic analysis |
| Ruby (Rails) | ✅ Good | All agents, basic analysis |
| Go | ✅ Good | All agents, basic analysis |
| PHP | ✅ Good | All agents, basic analysis |
| Other | ⚠️ Experimental | Core agents work, limited analysis |

---

## Updates

### Checking for Updates
```powershell
# Compare your version with latest
cat .github\_Portable\README.md | Select-String "Version:"
```

### Upgrading
1. Download latest `_Portable` folder
2. Backup your `.github/prompts/` and `.github/instructions/` folders
3. Run setup again
4. Merge any custom changes back

---

## Troubleshooting

### Setup fails with "PowerShell not found"
**Solution**: Install PowerShell Core from https://github.com/PowerShell/PowerShell/releases

### Agents don't respond or give errors
**Solution**: 
1. Verify `.github/prompts/` folder exists
2. Check PROJECT-SETUP-SUMMARY.md was created
3. Restart your IDE

### Build validation keeps failing
**Solution**:
1. Run your build command manually
2. Fix all errors and warnings
3. Agents enforce 0E/0W policy strictly

**More solutions**: [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)

---

## Contributing

This is a portable system extracted from production use. Improvements welcome!

### Share Your Patterns
Add successful patterns to `Workspaces/Copilot/learning/` and they'll be reused.

### Report Issues
Document issues in your project's issue tracker or adapt the system to your needs.

---

## License

This system is provided as-is for use in any project. Modify and distribute freely.

---

## Version History

- **v2.0.0** (2025-10-12)
  - Complete rewrite for universal portability
  - Removed all project-specific references
  - Added automatic project detection
  - Enhanced template system
  - Improved documentation structure

- **v1.0.0** (2025-10-11)
  - Initial portable extraction
  - Basic template support
  - Manual configuration required

---

**Ready to start?** Run `.\setup.bat` now! 🚀
