# AI Agent System - Portable Template

**Version:** 2.5.0  
**Last Updated:** October 21, 2025  
**Status:** Production Ready

---

## Overview

This is a **drop-in ready** AI agent system that provides intelligent coding assistance through specialized agents. The system uses GitHub Copilot with custom prompts to enable sophisticated workflows like feature planning, task execution, code refactoring, test generation, and more.

### Key Features

✅ **10+ Specialized Agents** - Each agent handles specific workflows  
✅ **Automatic Configuration** - Run `@workspace /total-recall` to configure  
✅ **Learning System** - Agents learn from patterns and improve over time  
✅ **Cross-Agent Coordination** - Agents work together seamlessly  
✅ **Technology Agnostic** - Supports .NET, Node.js, Python, Java, Ruby, Go, PHP  
✅ **Production Tested** - Battle-tested in real-world projects

---

## Quick Start (3 Steps)

### 1. Copy to Your Project
```powershell
# Copy this entire folder to your project
cp -r .github/_Portable/* your-project/.github/
```

### 2. Run Configuration
```powershell
# In your project, invoke total-recall agent
@workspace /total-recall
```

**What total-recall does:**
- Scans your project structure (package.json, *.csproj, requirements.txt, etc.)
- Detects technology stack, frameworks, build tools
- Replaces all `{{TEMPLATE_VARIABLES}}` with project-specific values
- Creates configured `.github/` folder ready to use

### 3. Start Using Agents
```powershell
# Ask what agents are available
@workspace /question "What agents are available?"

# Or jump right in with feature planning
@workspace /feature key=my-feature user_request="Add user authentication"
```

---

## Technology Compatibility

| Technology | Status | Notes |
|-----------|--------|-------|
| **.NET** (C#, F#) | ✅ Full Support | ASP.NET Core, Blazor, Entity Framework |
| **Node.js** (JavaScript, TypeScript) | ✅ Full Support | React, Vue, Express, NestJS |
| **Python** | ✅ Full Support | Django, Flask, FastAPI, SQLAlchemy |
| **Java** | ✅ Full Support | Spring Boot, Maven, Gradle |
| **Ruby** | ✅ Full Support | Rails, Sinatra, Bundler |
| **Go** | ✅ Full Support | Gin, Echo, go modules |
| **PHP** | ✅ Full Support | Laravel, Symfony, Composer |

---

## Agent Overview

### Planning & Coordination
- **`/feature`** - Feature planning agent (creates implementation plans)
- **`/question`** - Q&A agent (answers questions about codebase/agents)

### Development
- **`/task`** - Task execution agent (implements features phase-by-phase)
- **`/refactor`** - Code refactoring agent (improves code quality)
- **`/commit`** - Commit message generator (creates conventional commits)

### Testing & Quality
- **`/test-generation`** - Test generation agent (creates E2E/unit tests)
- **`/healthcheck`** - System health validation (checks agent system integrity)
- **`/sync`** - Documentation synchronization (keeps docs up-to-date)

### Analysis & Learning
- **`/analyze-learning`** - Learning extraction (analyzes patterns from work)
- **`/cohesion-review`** - Prompt cohesion audit (validates agent consistency)

### Maintenance
- **`/cleanup`** - Workspace cleanup (removes temporary artifacts)
- **`/port-instructions`** - Template generation (creates portable versions)
- **`/total-recall`** - Configuration agent (THIS PROMPT - configures templates)

---

## Template Variables

The system uses standardized template variables that total-recall replaces:

### Project Identity
- `{{PROJECT_NAME}}` - Your project name
- `{{PROJECT_TYPE}}` - Project type (.NET, Node.js, Python, etc.)
- `{{LANGUAGES}}` - Programming languages
- `{{FRAMEWORKS}}` - Frameworks and libraries

### Build & Test
- `{{BUILD_COMMAND}}` - Build command (e.g., `npm run build`)
- `{{TEST_COMMAND}}` - Test command (e.g., `npm test`)
- `{{RUN_COMMAND}}` - Run command (e.g., `npm start`)
- `{{LINT_COMMAND}}` - Linting command (e.g., `npm run lint`)

### Database
- `{{DATABASE_TYPE}}` - Database type and ORM
- `{{DATABASE_NAME}}` - Primary database name
- `{{DATABASE_SERVER}}` - Database server
- `{{SCHEMA_PRIMARY}}` - Primary writable schema
- `{{SCHEMA_READONLY}}` - Read-only schemas

### Infrastructure
- `{{API_BASE_URL}}` - API base URL
- `{{UI_FRAMEWORK}}` - UI framework
- `{{REALTIME_TECH}}` - Real-time technology (SignalR, Socket.IO, etc.)
- `{{AUTH_TYPE}}` - Authentication type

### Paths
- `{{SOURCE_PATH}}` - Main source code path
- `{{TEST_PATH}}` - Test files path
- `{{CONFIG_PATH}}` - Configuration files path
- `{{WORKSPACE_PATH}}` - Workspace folder path

### Tools & Quality
- `{{ANALYZER_TOOLS}}` - Code analysis tools
- `{{TEST_FRAMEWORK}}` - Testing framework
- `{{PACKAGE_MANAGER}}` - Package manager

---

## Directory Structure

```
.github/
├── instructions/
│   ├── SelfAwareness.instructions.md       - Global operating rules
│   └── Links/
│       ├── SystemIndex.md                   - System documentation index
│       ├── Architecture.md                  - Architecture patterns
│       ├── InfrastructureQuickRef.md       - Infrastructure reference
│       ├── PlaywrightQuickRef.md           - Testing reference
│       └── ... (other reference docs)
├── prompts/
│   ├── feature.prompt.md                    - Feature planning agent
│   ├── task.prompt.md                       - Task execution agent
│   ├── refactor.prompt.md                   - Refactoring agent
│   ├── test-generation.prompt.md           - Test generation agent
│   ├── ... (other agent prompts)
│   └── shared/
│       ├── commit-message-format.md        - Commit conventions
│       ├── execution-flow.md               - Agent workflows
│       └── ... (shared guidelines)
└── learning/
    ├── README.md                            - Learning system docs
    ├── PATTERN_SCHEMA.md                    - Pattern structure
    ├── patterns/                            - Reusable patterns
    ├── insights/                            - Technology insights
    └── recommendations/                     - Active recommendations
```

---

## Troubleshooting

### "Template variables still present after running total-recall"
- **Cause:** total-recall couldn't detect project type
- **Solution:** Manually specify project type:
  ```
  @workspace /total-recall project-type=".NET"
  ```

### "Agent not found" error
- **Cause:** Prompt file not in `.github/prompts/`
- **Solution:** Verify all `.template` files were copied and renamed

### "Agent behaving incorrectly"
- **Cause:** Configuration may be incomplete
- **Solution:** Re-run total-recall with explicit parameters:
  ```
  @workspace /total-recall project-type=".NET" frameworks="ASP.NET Core, Blazor"
  ```

### Need help?
- Run: `@workspace /question "How do I use the task agent?"`
- Check: `START-HERE.md` for quick start examples
- Review: `QUICK-REFERENCE.md` for agent syntax

---

## What's Next?

1. ✅ Read **START-HERE.md** for detailed examples
2. ✅ Check **QUICK-REFERENCE.md** for agent syntax
3. ✅ Review **STATUS.md** for version info and limitations
4. ✅ Try creating a feature: `@workspace /feature key=test user_request="Add hello world endpoint"`

---

**Welcome to the AI Agent System!** 🚀
