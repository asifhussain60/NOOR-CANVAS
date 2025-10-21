# QUICK REFERENCE - AI Agent Syntax

**Fast lookup for agent invocations and parameters**

---

## Agent Invocation Syntax

### Feature Planning Agent
```
@workspace /feature key={unique-id} user_request="{description}" [github-branch=development] [context="{background}"] [scope="{boundaries}"] [constraints="{limits}"] [include_suggestions=true]
```

**Parameters:**
- `key` (required) - Unique identifier for this work
- `user_request` (required) - What you want to implement
- `github-branch` (optional, default=development) - Target branch
- `context` (optional) - Additional background info
- `scope` (optional) - Boundaries (UI only, full-stack, etc.)
- `constraints` (optional) - Deadlines, compatibility requirements
- `include_suggestions` (optional, default=true) - Propose enhancements

**Example:**
```
@workspace /feature key=dark-mode user_request="Add dark mode toggle to application" scope="UI + state management" constraints="Must work on mobile"
```

---

### Task Execution Agent
```
@workspace /task key={id} github-branch={branch} tasks="{Phase 1: ...\n---\nPhase 2: ...}" [debug-level=simple] [verbosity=concise]
```

**Parameters:**
- `key` (required) - Work identifier (matches feature key)
- `github-branch` (required) - Target branch for commits
- `tasks` (required) - Phase descriptions separated by `\n---\n`
- `debug-level` (optional) - simple|detailed|none
- `verbosity` (optional) - concise|detailed

**Example:**
```
@workspace /task key=dark-mode github-branch=development debug-level=simple tasks="Phase 1: Add theme state management\n---\nPhase 2: Create toggle component\n---\nPhase 3: Apply theme to components"
```

---

### Refactor Agent
```
@workspace /refactor target="{file-path}" focus="{what-to-refactor}" [scope="{boundaries}"] [preserve="{must-keep}"]
```

**Parameters:**
- `target` (required) - File or directory path
- `focus` (required) - What to refactor (extract method, simplify, etc.)
- `scope` (optional) - Boundaries of refactoring
- `preserve` (optional) - What must not change

**Example:**
```
@workspace /refactor target="src/services/UserService.cs" focus="Extract validation logic to separate validator class" preserve="Public API must stay the same"
```

---

### Test Generation Agent
```
@workspace /test-generation feature="{feature-name}" scenario="{test-scenario}" [endpoints="{api-endpoints}"] [tokens="{test-tokens}"] [key={work-id}] [percy=true] [headed=true]
```

**Parameters:**
- `feature` (required) - Feature being tested
- `scenario` (required) - Test scenario description
- `endpoints` (optional) - API endpoints to test
- `tokens` (optional) - Test tokens (format: "Host=ABC,User=XYZ")
- `key` (optional) - Associated work identifier
- `percy` (optional, default=false) - Include Percy visual tests
- `headed` (optional, default=false) - Run in headed mode

**Example:**
```
@workspace /test-generation feature=login scenario="User logs in with valid credentials" endpoints="/api/auth/login" tokens="Host=PQ9N5YWW,User=KJAHA99L" percy=true
```

---

### Question Agent
```
@workspace /question "{your-question}"
```

**Parameters:**
- Question text (required) - Your question in natural language

**Examples:**
```
@workspace /question "How do I use the database context?"
@workspace /question "What agents are available?"
@workspace /question "Show me examples of SignalR hub usage"
@workspace /question "What's the authentication flow?"
```

---

### Commit Agent
```
@workspace /commit [scope="{scope}"] [breaking=true]
```

**Parameters:**
- `scope` (optional) - Commit scope (api, ui, database, etc.)
- `breaking` (optional) - Mark as breaking change

**Example:**
```
@workspace /commit scope=api
@workspace /commit breaking=true
```

---

### Health Check Agent
```
@workspace /healthcheck [detailed=true]
```

**Parameters:**
- `detailed` (optional, default=false) - Show detailed diagnostics

**Example:**
```
@workspace /healthcheck
@workspace /healthcheck detailed=true
```

---

### Cleanup Agent
```
@workspace /cleanup [aggressive=false] [dry-run=false]
```

**Parameters:**
- `aggressive` (optional, default=false) - Remove more artifacts
- `dry-run` (optional, default=false) - Show what would be removed

**Example:**
```
@workspace /cleanup
@workspace /cleanup aggressive=true dry-run=true
```

---

### Sync Agent
```
@workspace /sync [target="{documentation-file}"] [validate=true]
```

**Parameters:**
- `target` (optional) - Specific file to sync
- `validate` (optional, default=true) - Validate after sync

**Example:**
```
@workspace /sync
@workspace /sync target="README.md"
```

---

### Analyze Learning Agent
```
@workspace /analyze-learning key={work-id} [extract-patterns=true]
```

**Parameters:**
- `key` (required) - Work identifier to analyze
- `extract-patterns` (optional, default=true) - Extract reusable patterns

**Example:**
```
@workspace /analyze-learning key=dark-mode
```

---

### Cohesion Review Agent
```
@workspace /cohesion-review [fix=false]
```

**Parameters:**
- `fix` (optional, default=false) - Auto-fix cohesion issues

**Example:**
```
@workspace /cohesion-review
@workspace /cohesion-review fix=true
```

---

### Port Instructions Agent
```
@workspace /port-instructions [prompt="{prompt-file}"]
```

**Parameters:**
- `prompt` (optional) - Specific prompt to port (selective update)

**Examples:**
```
@workspace /port-instructions
@workspace /port-instructions prompt=task.prompt.md
```

---

### Total Recall Agent
```
@workspace /total-recall [project-type="{type}"] [frameworks="{list}"] [database-type="{type}"]
```

**Parameters:**
- `project-type` (optional) - .NET, Node.js, Python, Java, Ruby, Go, PHP
- `frameworks` (optional) - Comma-separated framework list
- `database-type` (optional) - Database and ORM type

**Examples:**
```
@workspace /total-recall
@workspace /total-recall project-type=".NET" frameworks="ASP.NET Core, Blazor"
@workspace /total-recall project-type="Node.js" frameworks="Express, React" database-type="PostgreSQL + Sequelize"
```

---

## Template Variables Reference

### Project Identity
- `{{PROJECT_NAME}}` - Project name
- `{{PROJECT_TYPE}}` - Project type
- `{{LANGUAGES}}` - Programming languages
- `{{FRAMEWORKS}}` - Frameworks/libraries

### Build & Test
- `{{BUILD_COMMAND}}` - Build command
- `{{TEST_COMMAND}}` - Test command
- `{{RUN_COMMAND}}` - Run command
- `{{LINT_COMMAND}}` - Lint command

### Database
- `{{DATABASE_TYPE}}` - Database type
- `{{DATABASE_NAME}}` - Database name
- `{{DATABASE_SERVER}}` - Server address
- `{{SCHEMA_PRIMARY}}` - Primary schema
- `{{SCHEMA_READONLY}}` - Read-only schemas
- `{{CONNECTION_STRING_KEY}}` - Config key

### Infrastructure
- `{{API_BASE_URL}}` - API base URL
- `{{UI_FRAMEWORK}}` - UI framework
- `{{REALTIME_TECH}}` - Real-time tech
- `{{AUTH_TYPE}}` - Auth type

### Paths
- `{{SOURCE_PATH}}` - Source code path
- `{{TEST_PATH}}` - Test files path
- `{{CONFIG_PATH}}` - Config files path
- `{{WORKSPACE_PATH}}` - Workspace path

### Tools & Quality
- `{{ANALYZER_TOOLS}}` - Analysis tools
- `{{TEST_FRAMEWORK}}` - Test framework
- `{{PACKAGE_MANAGER}}` - Package manager

---

## Common Patterns

### Full Feature Workflow
```
# 1. Plan
@workspace /feature key=feature-x user_request="Description"

# 2. Review plan (feature agent outputs this)
# ... review the plan ...

# 3. User says "proceed"
# Feature agent outputs handoff command

# 4. Execute (copy command from feature agent)
@workspace /task key=feature-x github-branch=development tasks="..."

# 5. Generate tests
@workspace /test-generation feature=feature-x scenario="main flow"

# 6. Commit
@workspace /commit scope=feature-x
```

### Quick Fix Workflow
```
# 1. Refactor
@workspace /refactor target="src/buggy-file.cs" focus="Fix null reference"

# 2. Test
@workspace /test-generation feature=bugfix scenario="verify fix"

# 3. Commit
@workspace /commit scope=bugfix
```

### Exploration Workflow
```
# 1. Ask questions
@workspace /question "How does feature X work?"

# 2. Review agent response

# 3. Try implementing
@workspace /feature key=exploration ...
```

---

## Tips

1. **Use consistent keys** across feature → task → test-generation
2. **Always specify github-branch** (defaults to development)
3. **Review plans before proceeding** - feature agent waits for approval
4. **Break large features** into smaller phases
5. **Use question agent liberally** for learning

---

**Need help?** Run: `@workspace /question "How do I ...?"`
