# Portable AI Agent System

A complete, self-contained AI agent infrastructure that can be deployed to any software project.

---

## 🚀 Quick Start

1. **Copy this folder** to your project root
2. **Run setup**: `setup.bat` (Windows) or `./setup.ps1` (PowerShell/Linux/Mac)
3. **Follow prompts** to configure for your project
4. **Start using**: `@workspace /question What agents are available?`

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
- Deep project analysis
- Template population
- Infrastructure documentation
- **Use when:** After setup.bat to fully customize AI system

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

### Automated Setup (Recommended)

**Windows:**
```cmd
setup.bat
```

**PowerShell/Linux/Mac:**
```bash
./setup.ps1
```

The setup script will:
1. Detect your project type
2. Prompt for configuration
3. Generate customized files
4. Create workspace structure
5. Produce setup summary

### Manual Setup

1. Copy all files from `.github/_Portable/` to your project's `.github/` folder
2. Manually replace `{{VARIABLE}}` placeholders in template files
3. Remove `.template` extensions
4. Create workspace folders (see structure below)

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

All template files use `{{VARIABLE}}` placeholders that setup.ps1 replaces:

**Project Identity:**
- `{{PROJECT_NAME}}` - Your project name
- `{{PROJECT_TYPE}}` - .NET, Node.js, Python, etc.
- `{{LANGUAGES}}` - Programming languages
- `{{FRAMEWORKS}}` - Framework names

**Build & Test:**
- `{{BUILD_COMMAND}}` - Build command
- `{{TEST_COMMAND}}` - Test command
- `{{RUN_COMMAND}}` - Run command
- `{{LINT_COMMAND}}` - Linting command

**Database:**
- `{{DATABASE_NAME}}` - Primary database
- `{{DATABASE_SERVER}}` - Database server
- `{{DATABASE_TYPE}}` - Database type
- `{{SCHEMA_PRIMARY}}` - Writable schema
- `{{SCHEMA_READONLY}}` - Read-only schemas

**Infrastructure:**
- `{{API_BASE_URL}}` - API base URL
- `{{APP_PORT}}` - Application port
- `{{REALTIME_TECH}}` - Real-time technology
- `{{UI_FRAMEWORK}}` - UI framework

See `QUICK-REFERENCE.md` for complete list.

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

**PowerShell execution policy error:**
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy Bypass
```

**Template variables not replaced:**
- Run setup.bat/setup.ps1 again
- Check for .template extensions on files
- Manually edit files if needed

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

- **v1.0.0** (Initial Release)
  - Complete portable system
  - 8 specialized agents
  - Learning infrastructure
  - Multi-language support
  - Automated setup

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
- **Project Setup**: See `PROJECT-SETUP-SUMMARY.md` (generated after setup)

---

**Ready to get started? Run `setup.bat` or `./setup.ps1` now!**
