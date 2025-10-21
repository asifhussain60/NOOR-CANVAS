# Portable AI Agent System

A complete, self-contained AI agent infrastructure that can be deployed to any software project.

---

## 🚀 Quick Start (Drop-In Setup)

**3 Simple Steps:**

1. **Copy** `.github/_Portable/` folder to your project → `.github/`
2. **Run** `@workspace /total-recall` to scan and configure
3. **Start using** `@workspace /question What agents are available?`

**That's it!** No scripts, no manual configuration. total-recall intelligently detects your project and populates all templates automatically.

### What Happens During Setup

**Step 1: Copy**
```bash
# Copy the portable system to your project
cp -r .github/_Portable/ /path/to/your/project/.github/
```

**Step 2: Run total-recall**
```
@workspace /total-recall
```
total-recall will:
- 🔍 Scan your project structure (detects .NET, Node.js, Python, Java, etc.)
- 📝 Extract configuration (database, ports, build commands)
- 🎯 Populate all 35+ template variables
- ✨ Remove `.template` extensions
- ✅ Validate setup completeness

**Step 3: Use agents**
```
@workspace /question What can you help me with?
@workspace /task key=my-feature user_request="Add login feature"
@workspace /refactor scope=services
```

---

## 📋 What's Included

### AI Agent System
- **8 Specialized Agents** for development tasks
- **2 Meta-Agents** for system management
- **Smart Learning System** that improves over time
- **Comprehensive Documentation** framework
- **Automated Testing** integration
- **Code Quality** enforcement

### Complete Infrastructure
- ✅ Agent prompt definitions
- ✅ Instruction files
- ✅ Learning infrastructure
- ✅ Workspace organization
- ✅ Template variables system
- ✅ Setup automation

---

## 🤖 Available Agents

### Task Agent (`/task`)
Execute features, bug fixes, and incremental work
- Phase-based processing
- Automatic test generation
- Git integration
- Progress tracking

### Refactor Agent (`/refactor`)
Safe code quality improvements and architectural refactoring
- Preserves functionality
- Maintains test coverage
- Analyzer integration

### Sync Agent (`/sync`)
Keep documentation synchronized with code
- Architecture updates
- API contract validation
- Cross-reference checking

### Healthcheck Agent (`/healthcheck`)
Validate system health and configuration
- Build verification
- Dependency checking
- Database connectivity
- Code quality metrics

### Question Agent (`/question`)
Answer questions about the project
- Context-aware responses
- Code examples
- Documentation references

### Test Generation Agent (`/test`)
Generate comprehensive automated tests
- Unit tests
- Integration tests
- E2E tests
- Coverage tracking

### Learning Analysis Agent (`/analyze-learning`)
Extract patterns and generate insights
- Success pattern identification
- Failure pattern avoidance
- Performance optimization
- Recommendation generation

### Cohesion Review Agent (`/cohesion-review`)
Review code quality and architectural alignment
- Quality metrics
- Architecture compliance
- Technical debt tracking
- Improvement recommendations

### Port Instructions Agent (`/port-instructions`) - Meta
Regenerate the portable system with latest improvements
- Creates/updates _Portable folder
- Extracts templates from current project
- Maintains portability
- **Use when:** Updating portable system with improvements

### Total Recall Agent (`/total-recall`) - Meta
Analyze project and populate all templates with project data
- Deep project analysis (detects .NET, Node.js, Python, Java, etc.)
- Automatic template population (35+ variables)
- Template processing (removes .template extensions)
- Infrastructure documentation
- **Use when:** Immediately after copying _Portable to configure for your project

---

## 💾 Technology Compatibility

### Supported Project Types

**Fully Tested:**
- ✅ .NET (C#, ASP.NET Core, Blazor)
- ✅ Node.js (JavaScript, TypeScript, Express, React, Vue)
- ✅ Python (Django, Flask, FastAPI)
- ✅ Java (Spring Boot, Jakarta EE)

**Community Supported:**
- 🔶 Ruby (Rails, Sinatra)
- 🔶 Go (any framework)
- 🔶 PHP (Laravel, Symfony)
- 🔶 Other (custom configuration required)

### Database Support
- SQL Server
- PostgreSQL
- MySQL/MariaDB
- MongoDB
- Oracle
- SQLite

### Testing Frameworks
- Playwright
- Selenium
- Jest
- xUnit/NUnit
- pytest
- JUnit
- RSpec

---

## 📦 Installation

### Drop-In Setup (Recommended)

**Single Command:**
```bash
# After copying .github/_Portable/ to your project
@workspace /total-recall
```

The total-recall agent will:
1. 🔍 Detect your project type (.NET, Node.js, Python, Java, etc.)
2. 📝 Extract configuration (solution files, package.json, requirements.txt, etc.)
3. 🎯 Populate 35+ template variables automatically
4. ✨ Process all .template files (replace variables, remove extensions)
5. ✅ Validate completeness (no unpopulated variables remain)

**Complete in 30 seconds** - no manual input required!

### Manual Setup (Not Recommended)

If you cannot use total-recall for some reason:

1. Copy all files from `.github/_Portable/` to your project's `.github/` folder
2. Manually find and replace all 35+ `{{VARIABLE}}` placeholders in .template files
3. Remove `.template` extensions from all files
4. Create workspace folders (see structure below)
5. Validate no {{VARIABLES}} remain

⚠️ **Warning:** Manual setup is error-prone and time-consuming. Use total-recall instead.

---

## 🗂️ Workspace Structure

After setup, your project will have:

```
.github/
├── instructions/          # Core operating instructions
│   ├── SelfAwareness.instructions.md
│   └── Links/            # Reference documentation
├── prompts/              # Agent definitions
│   └── shared/          # Reusable documentation
├── learning/            # Learning system
│   ├── patterns/       # Learned patterns
│   ├── insights/       # Insights
│   └── recommendations/  # Improvements
└── reports/            # Agent reports

Workspaces/
├── Copilot/           # Agent workspace
│   ├── _DOCS/        # Documentation
│   ├── artifacts/    # Build artifacts
│   ├── config/       # Configurations
│   └── prompts.keys/ # Work tracking
├── CodeQuality/      # Code analysis
└── TEMP/            # Temporary files
```

---

## 🎯 Common Workflows

### Implementing a Feature
```
@workspace /task key=feature-name tasks="Implement user authentication"
```

### Fixing a Bug
```
@workspace /task key=bug-123 tasks="Fix login redirect issue
---
Add test for redirect
---
Update documentation"
```

### Improving Code Quality
```
@workspace /refactor key=cleanup scope=service
```

### Generating Tests
```
@workspace /test target=src/services/UserService.ts
```

### Checking System Health
```
@workspace /healthcheck
```

### Updating Documentation
```
@workspace /sync
```

### Asking Questions
```
@workspace /question How does authentication work in this project?
```

---

## 🔧 Configuration

### Template Variables

All template files use `{{VARIABLE}}` placeholders that total-recall automatically populates:

**Project Identity:**
- `{{PROJECT_NAME}}` - Your project name (from .sln, package.json, etc.)
- `{{PROJECT_TYPE}}` - .NET, Node.js, Python, etc. (auto-detected)
- `{{LANGUAGES}}` - Programming languages (scanned from file extensions)
- `{{FRAMEWORKS}}` - Framework names (detected from dependencies)

**Build & Test:**
- `{{BUILD_COMMAND}}` - Build command (extracted from scripts)
- `{{TEST_COMMAND}}` - Test command (detected from test frameworks)
- `{{RUN_COMMAND}}` - Run command (from package.json, .csproj, etc.)
- `{{LINT_COMMAND}}` - Linting command (if configured)

**Database:**
- `{{DATABASE_NAME}}` - Primary database (from connection strings)
- `{{DATABASE_SERVER}}` - Database server (from appsettings.json, .env, etc.)
- `{{DATABASE_TYPE}}` - Database type (SQL Server, PostgreSQL, etc.)
- `{{SCHEMA_PRIMARY}}` - Writable schema (dbo, public, etc.)
- `{{SCHEMA_READONLY}}` - Read-only schemas (if configured)

**Infrastructure:**
- `{{API_BASE_URL}}` - API base URL (from configuration files)
- `{{APP_PORT}}` - Application port (from launch settings)
- `{{REALTIME_TECH}}` - Real-time technology (SignalR, WebSocket, etc.)
- `{{UI_FRAMEWORK}}` - UI framework (React, Blazor, Vue, etc.)

**35+ variables total** - All populated automatically by total-recall!

See `QUICK-REFERENCE.md` for complete list with detection methods.

---

## 📚 Documentation

- **START-HERE.md** - Quick start guide
- **QUICK-REFERENCE.md** - Command reference
- **COMPLETE.md** - Setup completion checklist
- **STATUS.md** - Version and compatibility info

---

## 🌟 Features

### Smart Learning System
- Captures successful patterns
- Avoids known failures
- Improves over time
- Generates recommendations

### Automated Testing
- Test generation per phase
- Multiple test types
- Coverage tracking
- Integration with CI/CD

### Code Quality
- Analyzer integration
- Linting enforcement
- Quality metrics
- Technical debt tracking

### Git Integration
- Checkpoint commits
- Rollback support
- Traceability
- Clean history

### Documentation Sync
- Automatic updates
- Cross-reference validation
- API contract checking
- Architecture alignment

---

## 🆘 Troubleshooting

### Setup Issues

**Template variables not replaced:**
- Ensure you ran `@workspace /total-recall` after copying _Portable folder
- Check for .template extensions still present (total-recall should remove these)
- Manually run total-recall again if files weren't processed

**total-recall not detecting project type:**
- Verify project has standard files (.sln, package.json, requirements.txt, pom.xml)
- Check if project structure is non-standard (may need manual configuration)
- Run with verbose logging to see detection results

**Variables still showing {{VARIABLE}} after total-recall:**
- Some variables may require manual configuration if not auto-detectable
- Check `QUICK-REFERENCE.md` for which variables support auto-detection
- Edit files manually to replace remaining placeholders

### Agent Issues

**Agent not responding:**
- Check SelfAwareness.instructions.md is in place
- Verify agent prompt file exists
- Review SystemIndex.md for correct structure

**Build/test failures:**
- Review error messages carefully
- Check InfrastructureQuickRef.md configuration
- Run healthcheck: `@workspace /healthcheck`

---

## 📊 Version History

- **v2.0.0** (Drop-In Release)
  - **Removed setup.bat/setup.ps1** - No more scripts!
  - **Added total-recall agent** - AI-powered configuration
  - **Auto-detection** - 35+ variables populated automatically
  - **Drop-in workflow** - Copy folder, run one command, done
  - **Faster setup** - 30 seconds vs 5+ minutes manual setup

- **v1.0.0** (Initial Release)
  - Complete portable system
  - 8 specialized agents
  - Learning infrastructure
  - Multi-language support
  - Script-based setup (deprecated)

---

## 🤝 Contributing

This portable system improves based on real-world usage:

1. **Report Issues** - Document problems encountered
2. **Share Patterns** - Contribute learned patterns
3. **Suggest Improvements** - Propose enhancements
4. **Update Templates** - Improve template quality

---

## 📄 License

This AI agent infrastructure is provided as-is for use in software projects. Customize freely for your needs.

---

## 🔗 Links

- **Documentation**: See `.github/instructions/Links/`
- **Agent Prompts**: See `.github/prompts/`
- **Learning System**: See `.github/learning/`
- **Variable Reference**: See `QUICK-REFERENCE.md`
- **Setup Guide**: See `START-HERE.md`

---

**Ready to get started? Run `setup.bat` or `./setup.ps1` now!**
