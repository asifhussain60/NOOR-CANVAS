# Portable AI Agent System

**Version**: 1.0.0  
**Last Updated**: October 22, 2025  
**Source Project**: Generic Template

---

## 📋 Overview

This is a **complete, drop-in ready AI agent infrastructure** for GitHub Copilot. It provides:

- ✅ Specialized agents for tasks, refactoring, testing, analysis
- ✅ Learning system that improves from project experience
- ✅ Comprehensive prompt library with best practices
- ✅ Project-aware configuration through total-recall agent
- ✅ Database-aware operation with schema protection
- ✅ Full testing integration (Playwright, unit tests)
- ✅ Code quality enforcement (linting, analyzers)

---

## 🚀 Quick Start (3 Steps)

### 1. Copy to Your Project

```bash
# Copy this entire _Portable folder to your project's .github directory
cp -r .github/_Portable your-project/.github/
```

### 2. Run total-recall Configuration

```bash
# In VS Code, open your project and run:
@workspace /total-recall

# The agent will:
# - Auto-detect your project type (.NET, Node.js, Python, etc.)
# - Scan your codebase structure
# - Populate all template variables
# - Write configured files to .github/_Portable/_Configured/
```

### 3. Review and Deploy

```bash
# Review the configured files in .github/_Portable/_Configured/
# When satisfied, copy them to your .github/ folder:

# Windows PowerShell
Copy-Item -Path ".github\_Portable\_Configured\*" -Destination ".github\" -Recurse -Force

# macOS/Linux
cp -r .github/_Portable/_Configured/* .github/
```

**That's it!** Your AI agent system is ready. Start with:
```
@workspace /handoff "Your task description"
```

---

## 🎯 What You Get

### Entry Point Agents (Invoke Directly)

| Agent | Command | Purpose |
|-------|---------|---------|
| **handoff** | `@workspace /handoff "task"` | Main entry point for all work requests |
| **create-plan** | `@workspace /create-plan "goal"` | Creates multi-phase execution plan |
| **test-generation** | `@workspace /test-generation ...` | Generate Playwright or unit tests |
| **healthcheck** | `@workspace /healthcheck` | Validate system health |
| **port-instructions** | `@workspace /port-instructions` | Update portable templates |

### Internal Agents (Called by Other Agents)

| Category | Agent | Purpose |
|----------|-------|---------|
| **Knowledge** | analyze-learning | Analyze learning patterns |
| | total-recall | Project configuration |
| **Quality** | refactor | Code refactoring |
| | cohesion-review | Architectural review |
| **Ops** | sync | Keep files synchronized |
| | commit | Git commit operations |
| **Communication** | ask | Clarifying questions |
| **Utility** | cleanup | Background process cleanup |

---

## 📚 Template Variables

All template files use these standardized variables:

### Project Identity
- `{{PROJECT_NAME}}` - Project name (e.g., "MyProject")
- `{{PROJECT_TYPE}}` - Project type (.NET, Node.js, Python, Java, Ruby, Go, PHP)
- `{{LANGUAGES}}` - Programming languages (e.g., "C#, JavaScript, TypeScript")
- `{{FRAMEWORKS}}` - Frameworks/libraries (e.g., "ASP.NET Core, React, Entity Framework")

### Build & Test
- `{{BUILD_COMMAND}}` - Build command (e.g., `dotnet build`, `npm run build`)
- `{{TEST_COMMAND}}` - Test command (e.g., `dotnet test`, `npm test`)
- `{{RUN_COMMAND}}` - Run command (e.g., `dotnet run`, `npm start`)
- `{{LINT_COMMAND}}` - Linting command (e.g., `dotnet format`, `npm run lint`)

### Database
- `{{DATABASE_TYPE}}` - Database type (e.g., "SQL Server + Entity Framework")
- `{{DATABASE_NAME}}` - Primary database name
- `{{DATABASE_SERVER}}` - Database server
- `{{SCHEMA_PRIMARY}}` - Primary writable schema
- `{{SCHEMA_READONLY}}` - Read-only schemas (comma-separated)
- `{{CONNECTION_STRING_KEY}}` - Connection string config key

### Infrastructure
- `{{API_BASE_URL}}` - API base URL
- `{{UI_FRAMEWORK}}` - UI framework (e.g., "Blazor", "React", "Vue.js")
- `{{REALTIME_TECH}}` - Real-time technology (e.g., "SignalR", "WebSockets")
- `{{AUTH_TYPE}}` - Authentication type (e.g., "JWT", "OAuth", "Cookie-based")

### Paths
- `{{SOURCE_PATH}}` - Main source code path
- `{{TEST_PATH}}` - Test files path
- `{{CONFIG_PATH}}` - Configuration files path
- `{{WORKSPACE_PATH}}` - Workspace folder path

### Tools & Quality
- `{{ANALYZER_TOOLS}}` - Code analysis tools (e.g., "Roslynator, StyleCop")
- `{{TEST_FRAMEWORK}}` - Testing framework (e.g., "Playwright, xUnit")
- `{{PACKAGE_MANAGER}}` - Package manager (e.g., "NuGet", "npm", "pip")

---

## 🛠 Technology Compatibility

| Project Type | Status | Notes |
|--------------|--------|-------|
| **.NET** (C#) | ✅ Fully Tested | ASP.NET Core, Blazor, Entity Framework |
| **Node.js** | ✅ Supported | Express, React, Vue, Angular |
| **Python** | ✅ Supported | Flask, Django, FastAPI |
| **Java** | ✅ Supported | Spring Boot, Maven, Gradle |
| **Ruby** | ✅ Supported | Rails, Sinatra |
| **Go** | ✅ Supported | Standard library, popular frameworks |
| **PHP** | ✅ Supported | Laravel, Symfony |

**Database Support**: SQL Server, PostgreSQL, MySQL, SQLite, MongoDB

**Testing Frameworks**: Playwright, Selenium, Jest, xUnit, pytest, JUnit

---

## 📖 Documentation Structure

After configuration, your `.github` folder will contain:

```
.github/
├── instructions/
│   ├── SelfAwareness.instructions.md  # Global rules
│   └── Links/
│       ├── SystemIndex.md              # Navigation hub
│       ├── Architecture.md             # System design
│       ├── InfrastructureQuickRef.md   # DB and infrastructure
│       └── ...                         # Other references
├── prompts/
│   ├── handoff.prompt.md               # Entry point
│   ├── task.prompt.md                  # Task execution
│   ├── create-plan.prompt.md           # Planning
│   ├── test-generation.prompt.md       # Test generation
│   ├── internal/                       # Internal agents
│   └── shared/                         # Shared documentation
└── learning/
    ├── patterns/                       # Pattern library
    └── recommendations/                # Improvement tracking
```

---

## 🔧 Customization

### Modify Template Variables

If auto-detection doesn't fit your project, edit the configured files in `.github/_Portable/_Configured/` before copying to `.github/`.

### Add Custom Agents

1. Create your prompt file: `.github/prompts/your-agent.prompt.md`
2. Follow the structure of existing prompts
3. Reference shared documentation: `.github/prompts/shared/`

### Extend Learning System

The learning system automatically tracks:
- Successful patterns
- Common errors
- Performance optimizations
- Recommendations

Add custom patterns in `.github/learning/patterns/`.

---

## 🐛 Troubleshooting

### "Database not found"
- Check `{{DATABASE_NAME}}` in `InfrastructureQuickRef.md`
- Verify connection string in your config file
- Ensure database server is running

### "Command not found" (build/test)
- Verify `{{BUILD_COMMAND}}` and `{{TEST_COMMAND}}` match your project
- Check paths in template variables
- Run commands manually to confirm they work

### "Agent not responding"
- Check for syntax errors in prompt files
- Verify all `{{VARIABLES}}` are replaced (no curly braces left)
- Review agent invocation syntax in `QUICK-REFERENCE.md`

### Configuration Issues
- Re-run `@workspace /total-recall`
- Check for error messages during configuration
- Manually inspect generated files in `_Configured/`

---

## 📞 Support

### Documentation
- **START-HERE.md** - Quick start guide
- **QUICK-REFERENCE.md** - Command reference
- **STATUS.md** - Compatibility and version info
- **COMPLETE.md** - Completion checklist

### Common Questions

**Q: Do I need to configure manually?**  
A: No! The total-recall agent auto-detects your project and configures everything.

**Q: Can I use this with multiple projects?**  
A: Yes! Each project gets its own configured copy. The templates remain unchanged.

**Q: What if my project uses multiple languages?**  
A: total-recall detects all languages and frameworks. List them in `{{LANGUAGES}}` and `{{FRAMEWORKS}}`.

**Q: How do I update the portable system?**  
A: Pull updates from the source repository, re-run total-recall, and review changes.

---

## 🎓 Learning More

### Example Workflows

**1. Implement a Feature**
```
@workspace /handoff "Add user authentication to login page"
```

**2. Create a Plan First**
```
@workspace /create-plan "Implement JWT authentication with refresh tokens"
# Review plan, then execute phases
```

**3. Generate Tests**
```
@workspace /test-generation feature="login" framework=playwright
```

**4. Refactor Code**
```
@workspace /refactor file="UserService.cs" focus="Extract common patterns"
```

**5. Health Check**
```
@workspace /healthcheck
```

### Best Practices

1. **Start with handoff** - It routes to the right agent
2. **Use create-plan for complex work** - Break down big tasks
3. **Let agents commit** - They create checkpoint commits
4. **Review learning** - Check `.github/learning/recommendations/`
5. **Update templates** - Run `/port-instructions` after system improvements

---

## 📊 System Status

- ✅ Ready for immediate use
- ✅ Zero manual configuration required
- ✅ Supports 7+ programming languages
- ✅ Includes 10+ specialized agents
- ✅ Learning system included
- ✅ Testing framework integration
- ✅ Database schema protection

---

## 🔄 Updates

To update this system:

1. **Source Repository**: Pull latest changes
2. **Re-run Configuration**: `@workspace /total-recall`
3. **Review Changes**: Check `_Configured/` folder
4. **Deploy**: Copy to `.github/` when ready
5. **Test**: Run `@workspace /healthcheck`

---

## 📝 License

This portable system inherits the license of your project. The templates are provided as-is for use with GitHub Copilot.

---

## 🙏 Credits

Generated from the NOOR CANVAS AI agent infrastructure.  
Designed for drop-in portability across any project.

---

**Next Steps:**
1. Read `START-HERE.md` for quick start
2. Run `@workspace /total-recall` to configure
3. Try `@workspace /handoff "your first task"`

**Questions?** Check `QUICK-REFERENCE.md` for command syntax.
