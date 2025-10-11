# Agent Reference Guide

Complete reference for all 6 AI agents in the Portable AI Agent System.

---

## Quick Reference

| Agent | Command | Purpose | Safety Level |
|-------|---------|---------|--------------|
| Task Executor | `@workspace /task` | Feature development, bug fixes | 🔴 Modifies code |
| Refactor Agent | `@workspace /refactor` | Code quality improvements | 🔴 Modifies code |
| Health Check | `@workspace /healthcheck` | System validation | 🟢 Read-only |
| Sync Agent | `@workspace /sync` | Documentation updates | 🟡 Modifies docs |
| Question Agent | `@workspace /question` | Knowledge queries | 🟢 Read-only |
| Learning Agent | `@workspace /learning` | Pattern analysis | 🟢 Read-only |

---

## 1. Task Executor Agent

**Purpose:** Primary development agent for implementing features and fixing bugs

**Command:**
```
@workspace /task key=UNIQUE_KEY tasks="Description of work" [layers="specific,layers"]
```

**Parameters:**
- `key` (required): Unique identifier for this task (e.g., `issue-123`, `feature-auth`)
- `tasks` (required): Clear description of what needs to be done
- `layers` (optional): Specific project layers to modify (e.g., `Controllers,Services`)
- `annotated_image` (optional): Path to image with annotations for UI changes

**Examples:**
```
# Simple feature
@workspace /task key=welcome tasks="Add a welcome message to the home page"

# Bug fix
@workspace /task key=issue-456 tasks="Fix null reference exception in user login"

# UI change with image
@workspace /task key=ui-redesign tasks="Implement new header design" annotated_image="design.png"

# Specific layers
@workspace /task key=api-endpoint tasks="Create user profile endpoint" layers="Controllers,Services,Data"
```

**Workflow:**
1. Creates checkpoint commit
2. Analyzes requirements
3. Implements changes layer by layer
4. Runs build validation (must pass)
5. Runs analyzer validation (0 warnings)
6. Runs tests
7. Commits if successful, or rolls back if failed
8. Records patterns for learning

**Safety Features:**
- ✅ Automatic checkpoint before changes
- ✅ Zero-tolerance: 0 errors, 0 warnings
- ✅ Automatic rollback on persistent failures (3 attempts)
- ✅ Git history preserved
- ✅ Debug markers for temporary logging

**When to Use:**
- Implementing new features
- Fixing bugs
- Adding endpoints/pages/components
- Modifying business logic

**When NOT to Use:**
- Large-scale refactoring (use `/refactor`)
- Knowledge questions (use `/question`)
- System validation (use `/healthcheck`)

---

## 2. Refactor Agent

**Purpose:** Improve code quality, maintainability, and architecture

**Command:**
```
@workspace /refactor scope=TARGET mode=APPROACH
```

**Parameters:**
- `scope` (required): What to refactor (file path, class name, or `project`)
- `mode` (required): Refactoring approach
  - `patterns` - Apply design patterns
  - `performance` - Optimize performance
  - `readability` - Improve clarity
  - `architecture` - Structural improvements
  - `comprehensive` - All of the above

**Examples:**
```
# Refactor specific file
@workspace /refactor scope=Controllers/UserController.cs mode=readability

# Apply design patterns
@workspace /refactor scope=Services/PaymentService.cs mode=patterns

# Optimize performance
@workspace /refactor scope=Data/QueryHelpers.cs mode=performance

# Comprehensive project refactor
@workspace /refactor scope=project mode=comprehensive
```

**Workflow:**
1. Analyzes code quality issues
2. Creates refactoring plan
3. Creates checkpoint
4. Applies improvements incrementally
5. Validates after each change
6. Records successful refactorings
7. Commits or rolls back

**Safety Features:**
- ✅ Incremental changes with validation
- ✅ Preserves functionality (tests must pass)
- ✅ Records refactoring wins for learning
- ✅ Automatic rollback if tests fail

**When to Use:**
- Code smells detected
- Poor maintainability scores
- Performance bottlenecks
- After Roslynator analysis
- Before major features

**When NOT to Use:**
- Adding new functionality (use `/task`)
- Fixing bugs (use `/task`)
- Emergency hotfixes

---

## 3. Health Check Agent

**Purpose:** Validate system health, configuration, and best practices

**Command:**
```
@workspace /healthcheck [mode=LEVEL] [focus=AREA]
```

**Parameters:**
- `mode` (optional): Depth of validation
  - `quick` - Fast checks (default)
  - `standard` - Common issues
  - `full` - Comprehensive analysis
  - `deep` - Deep dive with suggestions
- `focus` (optional): Specific area
  - `build` - Build configuration
  - `tests` - Test coverage
  - `security` - Security issues
  - `performance` - Performance concerns
  - `architecture` - Design compliance

**Examples:**
```
# Quick health check
@workspace /healthcheck

# Full system validation
@workspace /healthcheck mode=full

# Focus on security
@workspace /healthcheck mode=standard focus=security

# Deep performance analysis
@workspace /healthcheck mode=deep focus=performance
```

**Checks Performed:**
- ✅ Project builds without errors
- ✅ No compiler warnings
- ✅ Tests pass
- ✅ Code analyzer rules satisfied
- ✅ Dependencies up to date
- ✅ Configuration valid
- ✅ Security vulnerabilities
- ✅ Performance issues
- ✅ Code quality metrics

**Output:**
- Detailed report in `Workspaces/Copilot/validation/`
- Issue severity (Critical/Warning/Info)
- Actionable recommendations
- Trend analysis (if historical data exists)

**When to Use:**
- Before major releases
- After large refactorings
- Weekly/daily as routine check
- After dependency updates
- When debugging mysterious issues

**Safety:**
- 🟢 **Read-only** - Never modifies code
- Safe to run anytime

---

## 4. Sync Agent

**Purpose:** Keep documentation, comments, and metadata in sync with code

**Command:**
```
@workspace /sync target=WHAT [verify=true]
```

**Parameters:**
- `target` (required): What to sync
  - `docs` - API documentation
  - `comments` - Code comments
  - `readme` - README files
  - `contracts` - API contracts
  - `all` - Everything
- `verify` (optional): Validate after sync (default: true)

**Examples:**
```
# Sync API documentation
@workspace /sync target=docs

# Update code comments
@workspace /sync target=comments

# Sync everything
@workspace /sync target=all

# Sync without verification
@workspace /sync target=readme verify=false
```

**Workflow:**
1. Scans code for changes
2. Identifies outdated documentation
3. Generates updated docs
4. Updates README sections
5. Validates consistency
6. Commits changes

**What Gets Synced:**
- API endpoint documentation
- XML documentation comments
- README.md sections
- OpenAPI/Swagger specs
- Architecture diagrams
- Code examples

**When to Use:**
- After implementing features
- Before releases
- When docs feel stale
- After refactoring
- Before writing blog posts

**Safety:**
- 🟡 **Modifies non-code files** (docs, comments)
- Safe but review changes before committing

---

## 5. Question Agent

**Purpose:** Answer questions about the codebase, architecture, and functionality

**Command:**
```
@workspace /question "Your question here" [context=PATH]
```

**Parameters:**
- `question` (required): What you want to know
- `context` (optional): Specific file/folder to focus on

**Examples:**
```
# General questions
@workspace /question "What agents are available?"
@workspace /question "How does authentication work?"
@workspace /question "What databases are configured?"

# Specific context
@workspace /question "What does this controller do?" context=Controllers/UserController.cs

# Architecture questions
@workspace /question "What is the data flow for user registration?"

# Debugging help
@workspace /question "Why might users fail to login?"
```

**Question Types:**
- **How** - "How does X work?"
- **What** - "What is the purpose of Y?"
- **Where** - "Where is Z implemented?"
- **Why** - "Why was this approach chosen?"
- **When** - "When does this code execute?"
- **Who** - "Who calls this method?"

**Output:**
- Clear explanations
- Code references with line numbers
- Architecture diagrams (if relevant)
- Related files/classes
- Suggestions for improvement

**When to Use:**
- Learning the codebase
- Onboarding new developers
- Before making changes
- Understanding bugs
- Architecture reviews

**Safety:**
- 🟢 **Read-only** - Never modifies anything
- Fastest agent, safe for any query

---

## 6. Learning Agent

**Purpose:** Analyze patterns, improve agent effectiveness, generate insights

**Command:**
```
@workspace /learning action=WHAT [scope=AREA]
```

**Parameters:**
- `action` (required): What to analyze
  - `analyze` - Review recent patterns
  - `report` - Generate insights report
  - `optimize` - Suggest improvements
  - `trends` - Show trends over time
- `scope` (optional): Focus area
  - `refactoring` - Refactoring patterns
  - `failures` - Failed approaches
  - `performance` - Performance patterns
  - `all` - Everything

**Examples:**
```
# Analyze recent work
@workspace /learning action=analyze

# Generate insights report
@workspace /learning action=report scope=all

# Focus on refactoring wins
@workspace /learning action=analyze scope=refactoring

# Show trends
@workspace /learning action=trends
```

**Data Sources:**
- `Workspaces/Copilot/learning/patterns/successful-patterns.json`
- `Workspaces/Copilot/learning/patterns/failed-approaches.json`
- `Workspaces/Copilot/learning/patterns/refactoring-wins.json`
- Git commit history
- Validation reports

**Insights Generated:**
- Most effective patterns
- Common failure modes
- Refactoring success rates
- Agent performance trends
- Recommendations for improvement

**When to Use:**
- Weekly/monthly reviews
- After major milestones
- When optimizing workflow
- Training new team members
- Retrospectives

**Safety:**
- 🟢 **Read-only** - Analyzes existing data
- Generates reports, never modifies code

---

## Agent Coordination

### Typical Workflow

1. **Start with Question**
   ```
   @workspace /question "How does the payment system work?"
   ```

2. **Health Check**
   ```
   @workspace /healthcheck mode=quick
   ```

3. **Implement Feature**
   ```
   @workspace /task key=payment-refund tasks="Add refund capability"
   ```

4. **Refactor if Needed**
   ```
   @workspace /refactor scope=Services/PaymentService.cs mode=patterns
   ```

5. **Sync Documentation**
   ```
   @workspace /sync target=docs
   ```

6. **Final Health Check**
   ```
   @workspace /healthcheck mode=full
   ```

7. **Review Learning**
   ```
   @workspace /learning action=report
   ```

---

## Best Practices

### For Task Executor
- ✅ Use specific, descriptive `key` values
- ✅ Break large tasks into smaller chunks
- ✅ Provide clear, unambiguous task descriptions
- ✅ Use annotated images for UI work
- ✅ Specify layers when targeting specific areas

### For Refactor Agent
- ✅ Run health check first
- ✅ Start with small scopes
- ✅ Use specific modes
- ✅ Review changes before committing
- ✅ Ensure tests pass

### For Health Check
- ✅ Run regularly (daily/weekly)
- ✅ Use `quick` for routine checks
- ✅ Use `full` before releases
- ✅ Address Critical issues immediately
- ✅ Track trends over time

### For Sync Agent
- ✅ Run after feature implementation
- ✅ Review generated docs
- ✅ Keep API contracts updated
- ✅ Use before external releases

### For Question Agent
- ✅ Ask specific questions
- ✅ Provide context when possible
- ✅ Use for learning, not debugging code
- ✅ Follow up with related questions

### For Learning Agent
- ✅ Review insights monthly
- ✅ Share reports with team
- ✅ Act on recommendations
- ✅ Track improvements

---

## Common Patterns

### Daily Routine
```
@workspace /healthcheck mode=quick
@workspace /task key=daily-feature tasks="Today's work"
@workspace /sync target=comments
```

### Weekly Review
```
@workspace /healthcheck mode=full
@workspace /learning action=report scope=all
@workspace /refactor scope=project mode=readability
```

### Before Release
```
@workspace /healthcheck mode=deep
@workspace /sync target=all
@workspace /learning action=analyze
```

### Bug Fix
```
@workspace /question "What causes this bug?"
@workspace /task key=bugfix-123 tasks="Fix the issue"
@workspace /healthcheck mode=standard focus=tests
```

---

## Troubleshooting Agents

### Agent Doesn't Respond
1. Check GitHub Copilot is active
2. Verify `.github/prompts/` files exist
3. Ensure no `{{PLACEHOLDER}}` markers remain
4. Reload VS Code window

### Agent Reports Errors
1. Check `PROJECT-SETUP-SUMMARY.md` configuration
2. Verify build command works independently
3. Review agent-specific troubleshooting below

### Task Agent Issues
- **Build fails:** Run `dotnet build` (or equivalent) manually
- **Tests fail:** Run `dotnet test` to see actual errors
- **Rollback occurs:** Check git log for checkpoint, review error messages

### Refactor Agent Issues
- **No suggestions:** Code may already be optimal
- **Changes too aggressive:** Use specific `mode` instead of `comprehensive`
- **Tests fail:** Refactoring broke functionality, will auto-rollback

### Health Check Issues
- **Too many warnings:** Normal for new projects, prioritize Critical
- **False positives:** Configure analyzer rules in project settings
- **Slow execution:** Use `quick` or `standard` mode

---

## Advanced Usage

See [`ADVANCED-USAGE.md`](ADVANCED-USAGE.md) for:
- Custom agent configuration
- Multi-agent workflows
- Integration with CI/CD
- Team collaboration patterns
- Performance optimization

---

*Last Updated: October 11, 2025*
