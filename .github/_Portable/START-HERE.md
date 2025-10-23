# START HERE - Portable AI Agent System

**Quick setup in 3 steps. Then start working with AI agents.**

---

## ⚡ Super Quick Start

### Step 1: Copy Files
```bash
# Copy this folder to your project
cp -r .github/_Portable your-project/.github/
```

### Step 2: Configure
```
# In VS Code, open your project
# Press Ctrl+Shift+P (Cmd+Shift+P on Mac)
# Type: @workspace /total-recall
```

### Step 3: Deploy
```bash
# Windows
Copy-Item -Path ".github\_Portable\_Configured\*" -Destination ".github\" -Recurse -Force

# Mac/Linux
cp -r .github/_Portable/_Configured/* .github/
```

**Done!** Now try your first task:
```
@workspace /handoff "Create a new API endpoint for user profiles"
```

---

## 🤖 Available Agents

### Primary Agents (Use These)

#### `/handoff` - Your Main Entry Point
**Use this for**: Any work request

```
@workspace /handoff "Fix the login bug"
@workspace /handoff "Add dark mode toggle"
@workspace /handoff "Optimize database queries"
```

**What it does:**
- Analyzes your request
- Routes to appropriate specialized agent
- Manages workflow start-to-finish

---

#### `/create-plan` - Plan Before Executing
**Use this for**: Complex, multi-step work

```
@workspace /create-plan "Implement user authentication system"
@workspace /create-plan "Migrate from REST to GraphQL"
```

**What it does:**
- Breaks work into phases
- Identifies dependencies
- Generates execution plan
- Presents handoff commands for you to run

**When to use**: 
- Complex features (3+ steps)
- Architectural changes
- Migrations
- When you want to review before executing

---

#### `/test-generation` - Generate Tests
**Use this for**: Creating Playwright or unit tests

```
@workspace /test-generation feature="login" framework=playwright
@workspace /test-generation file="UserService.cs" framework=xunit
```

**What it does:**
- Generates test files
- Follows project conventions
- Includes assertions and scenarios
- Validates test runs

---

#### `/healthcheck` - System Validation
**Use this for**: Verifying everything works

```
@workspace /healthcheck
```

**What it does:**
- Checks agent configuration
- Validates file structure
- Tests key system components
- Reports issues

---

### When to Use Each Agent

| Scenario | Agent | Example |
|----------|-------|---------|
| Quick bug fix | `/handoff` | `@workspace /handoff "Fix null reference in login"` |
| Feature addition | `/handoff` | `@workspace /handoff "Add export to CSV button"` |
| Complex feature | `/create-plan` | `@workspace /create-plan "Add multi-tenant support"` |
| Need to review first | `/create-plan` | `@workspace /create-plan "Refactor authentication"` |
| Generate tests | `/test-generation` | `@workspace /test-generation feature="checkout"` |
| Check system | `/healthcheck` | `@workspace /healthcheck` |

---

## 📋 Common Workflows

### Workflow 1: Implement a Feature

```
# Option A: Direct execution
@workspace /handoff "Add user profile page with avatar upload"

# Option B: Plan first, then execute
@workspace /create-plan "Add user profile page with avatar upload"
# Review the plan
# Copy and run the provided handoff command
```

---

### Workflow 2: Fix a Bug

```
@workspace /handoff "Login button not working on mobile devices"
```

The agent will:
1. Analyze the issue
2. Locate relevant code
3. Implement fix
4. Update tests
5. Create commit

---

### Workflow 3: Generate Tests

```
# For a specific feature
@workspace /test-generation feature="shopping cart" framework=playwright

# For a specific file
@workspace /test-generation file="OrderService.cs" framework=xunit include_edge_cases=true
```

---

### Workflow 4: Refactor Code

```
@workspace /handoff "Refactor UserController to use service pattern"
```

Or with a plan:
```
@workspace /create-plan "Refactor entire authentication system"
```

---

### Workflow 5: Database Changes

```
@workspace /handoff "Add 'LastLoginDate' column to Users table with migration"
```

The agent will:
- Check database schema rules
- Respect READ-ONLY schemas
- Create migration scripts
- Update entity models

---

## 🎯 Tips for Success

### 1. Be Specific
❌ **Bad**: "Fix the bug"  
✅ **Good**: "Fix null reference exception in LoginController.cs line 45"

### 2. Use create-plan for Complex Work
❌ **Bad**: Handoff with 10 different requirements  
✅ **Good**: Use create-plan to break it into phases

### 3. Let Agents Commit
Agents create checkpoint commits automatically. Don't interrupt them.

### 4. Review Learning
Check `.github/learning/recommendations/active-recommendations.md` periodically for system insights.

### 5. Trust the Routing
Use `/handoff` - it knows which specialized agent to use.

---

## 🛡 Database Safety

The system protects your database with schema rules:

- ✅ **Writable schemas**: Defined in `{{SCHEMA_PRIMARY}}`
- ❌ **Read-only schemas**: Defined in `{{SCHEMA_READONLY}}`

Example configuration (from total-recall):
```markdown
## Database Access Rules

**PRIMARY DATABASE: {{DATABASE_NAME}}**

**SCHEMA ACCESS CONTROL**:
- ✅ **`app.*` schema**: READ-WRITE allowed
- ❌ **`legacy.*` schema**: READ-ONLY - NO modifications
```

---

## ⚙ Configuration

### Auto-Configuration (Recommended)

Run `@workspace /total-recall` and let it detect:
- Project type (.NET, Node.js, Python, etc.)
- Languages and frameworks
- Build commands
- Database connections
- File paths

### Manual Override

If auto-detection isn't perfect:
1. Run `@workspace /total-recall`
2. Edit files in `.github/_Portable/_Configured/`
3. Fix any `{{VARIABLES}}` that weren't detected
4. Copy to `.github/`

---

## 📖 Learn More

### Documentation Files

| File | Purpose |
|------|---------|
| **README.md** | Complete system overview |
| **START-HERE.md** | This file - quick start |
| **QUICK-REFERENCE.md** | Command reference |
| **STATUS.md** | Compatibility info |
| **COMPLETE.md** | Setup checklist |

### Key Configuration Files (After Setup)

| File | Purpose |
|------|---------|
| `.github/instructions/SelfAwareness.instructions.md` | Global agent rules |
| `.github/instructions/Links/InfrastructureQuickRef.md` | Database and infrastructure |
| `.github/instructions/Links/Architecture.md` | System architecture |
| `.github/prompts/handoff.prompt.md` | Main entry agent |
| `.github/prompts/task.prompt.md` | Task execution agent |

---

## 🐛 Troubleshooting

### "Agent not found"
- Verify files copied to `.github/` (not `_Portable/`)
- Check file names match exactly (case-sensitive on Mac/Linux)

### "Database connection failed"
- Edit `InfrastructureQuickRef.md`
- Check `{{DATABASE_NAME}}` and `{{DATABASE_SERVER}}`
- Verify connection string in your app config

### "Build command not found"
- Edit `SelfAwareness.instructions.md`
- Check `{{BUILD_COMMAND}}` and `{{TEST_COMMAND}}`
- Test commands manually in terminal

### "Template variables not replaced"
- Re-run `@workspace /total-recall`
- Check for errors in output
- Manually fix remaining `{{VARIABLES}}` in configured files

---

## ✅ Quick Validation

After setup, test each agent:

```bash
# 1. Health check
@workspace /healthcheck

# 2. Simple handoff
@workspace /handoff "Add a comment to README.md"

# 3. Create a plan
@workspace /create-plan "Add a new utility function"

# 4. Generate a test (if applicable)
@workspace /test-generation feature="example" framework=playwright
```

If all work, you're ready! 🎉

---

## 🚀 Next Steps

1. ✅ **Setup Complete** - If you followed steps 1-3
2. 📖 **Read** - Check `QUICK-REFERENCE.md` for all commands
3. 🎯 **Try It** - Run your first `@workspace /handoff` task
4. 📚 **Learn** - Explore `.github/learning/recommendations/`
5. 🔄 **Iterate** - Agents learn from your project over time

---

## 💡 Pro Tips

### Shortcut: Skip create-plan
If you're confident, go straight to handoff:
```
@workspace /handoff "Implement JWT refresh token rotation"
```

### Shortcut: Background Cleanup
If terminals pile up, the system auto-cleans. But you can force:
```
# Cleanup agent runs automatically, but internally
# Usually you don't need to invoke it manually
```

### Shortcut: Sync Files
If you suspect files are out of sync:
```
# Sync agent also runs automatically
# Invoked internally when needed
```

### Learning Review
Periodically check:
```
@workspace /analyze-learning
```
This reviews patterns and generates recommendations.

---

## 📞 Need Help?

1. **Check** `QUICK-REFERENCE.md` for syntax
2. **Run** `@workspace /healthcheck` for diagnostics
3. **Review** error messages in agent responses
4. **Validate** template variables are all replaced
5. **Re-run** `@workspace /total-recall` if needed

---

**Ready to go? Try this:**

```
@workspace /handoff "Add a test utility function that generates random user data"
```

The agent will handle the rest! 🚀
