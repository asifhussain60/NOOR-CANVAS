# Quick Reference Card

**Portable AI Agent System v1.0.0**

---

## 🚀 Installation (2 Steps)

```powershell
# 1. Copy folder
Copy-Item ".github\_Portable" -Destination "YourProject\.github\_Portable" -Recurse

# 2. Run setup
cd YourProject\.github\_Portable; .\setup.bat
```

⏱️ **Time:** 5 minutes  
✅ **Result:** Fully configured AI agent system

---

## 🤖 Available Agents

| Command | What It Does | Modifies Code? |
|---------|-------------|----------------|
| `@workspace /task` | Implement features, fix bugs | ✅ Yes |
| `@workspace /refactor` | Improve code quality | ✅ Yes |
| `@workspace /healthcheck` | Validate system health | ❌ No (safe) |
| `@workspace /sync` | Update documentation | ⚠️ Docs only |
| `@workspace /question` | Answer questions | ❌ No (safe) |
| `@workspace /learning` | Analyze patterns | ❌ No (safe) |

---

## 📋 Common Commands

### Daily Work
```
@workspace /healthcheck mode=quick
@workspace /task key=feature-123 tasks="Add login button"
@workspace /sync target=comments
```

### Bug Fix
```
@workspace /question "Why does login fail?"
@workspace /task key=bugfix-456 tasks="Fix login error"
```

### Code Quality
```
@workspace /healthcheck mode=full
@workspace /refactor scope=Services/ mode=patterns
```

### Weekly Review
```
@workspace /learning action=report scope=all
@workspace /healthcheck mode=deep
```

---

## 🎯 Task Agent Examples

```
# Simple feature
@workspace /task key=welcome tasks="Add welcome message to home page"

# Bug fix
@workspace /task key=issue-123 tasks="Fix null reference in UserService"

# Specific layers
@workspace /task key=api tasks="Create user profile endpoint" layers="Controllers,Services"

# With annotated image (UI changes)
@workspace /task key=ui-update tasks="Implement new header" annotated_image="design.png"
```

---

## 🔍 Question Agent Examples

```
# General questions
@workspace /question "What agents are available?"
@workspace /question "How does authentication work?"

# Specific context
@workspace /question "What does this method do?" context=Services/UserService.cs

# Debugging
@workspace /question "Why might users fail to login?"
```

---

## 🏥 Health Check Modes

```
@workspace /healthcheck                          # Quick (default)
@workspace /healthcheck mode=standard            # Common issues
@workspace /healthcheck mode=full                # Comprehensive
@workspace /healthcheck mode=deep focus=security # Deep dive
```

---

## 🔧 Refactor Modes

```
@workspace /refactor scope=FILE.cs mode=readability   # Improve clarity
@workspace /refactor scope=FILE.cs mode=patterns      # Apply design patterns
@workspace /refactor scope=FILE.cs mode=performance   # Optimize speed
@workspace /refactor scope=project mode=comprehensive # Everything
```

---

## 📚 Sync Targets

```
@workspace /sync target=docs      # API documentation
@workspace /sync target=comments  # Code comments
@workspace /sync target=readme    # README files
@workspace /sync target=all       # Everything
```

---

## 📊 Learning Actions

```
@workspace /learning action=analyze              # Review recent patterns
@workspace /learning action=report scope=all     # Generate insights
@workspace /learning action=trends               # Show trends
```

---

## 📁 Key Files

### After Setup
- `PROJECT-SETUP-SUMMARY.md` - Your configuration
- `.github/prompts/` - Agent prompts (configured)
- `.github/instructions/` - Operating rules
- `Workspaces/Copilot/learning/patterns/` - Pattern storage

### Documentation
- `START-HERE.md` - Entry point
- `docs/AGENT-REFERENCE.md` - Complete agent guide
- `docs/TROUBLESHOOTING.md` - Problem solving
- `docs/ADVANCED-USAGE.md` - Power features

---

## 🛡️ Safety Features

✅ **Automatic Checkpoint** - Before every code change  
✅ **Zero Tolerance** - Must have 0 errors, 0 warnings  
✅ **Auto Rollback** - After 3 failed attempts  
✅ **Debug Markers** - Temporary logging (auto-cleaned)  
✅ **Test Validation** - All tests must pass  

---

## ⚙️ Setup Script Options

```powershell
# Normal setup
.\setup.ps1

# Skip tool installation
.\setup.ps1 -SkipToolInstall

# Preview without changes
.\setup.ps1 -DryRun

# Verbose output
.\setup.ps1 -Verbose
```

---

## 🔥 Workflow Examples

### Feature Development
```
1. @workspace /question "How is the user system structured?"
2. @workspace /healthcheck mode=quick
3. @workspace /task key=feature-789 tasks="Add user preferences"
4. @workspace /refactor scope=Services/UserService.cs mode=patterns
5. @workspace /sync target=docs
6. @workspace /healthcheck mode=full
```

### Emergency Bug Fix
```
1. @workspace /question "What causes the login error?"
2. @workspace /task key=hotfix-urgent tasks="Fix login crash"
3. @workspace /healthcheck mode=standard focus=security
```

### Code Quality Sprint
```
1. @workspace /healthcheck mode=deep
2. @workspace /refactor scope=project mode=comprehensive
3. @workspace /sync target=all
4. @workspace /learning action=report scope=refactoring
```

---

## 🎨 Agent Coordination

Agents work together automatically:

```
Task Agent → Creates code
    ↓
Validation → Ensures quality
    ↓
Refactor Agent → Improves code (if needed)
    ↓
Sync Agent → Updates docs
    ↓
Health Check → Validates everything
    ↓
Learning Agent → Records patterns
```

---

## 🚨 Troubleshooting Quick Fixes

### Agents don't respond?
```powershell
# Check files exist
Test-Path .github\prompts\task.prompt.md

# Reload VS Code
Ctrl+Shift+P → "Reload Window"
```

### Build fails?
```powershell
# Test build independently
dotnet build          # .NET
npm run build         # Node.js
mvn clean install     # Java
```

### Tools not found?
```powershell
# Re-run setup
.\setup.ps1

# Or install manually
dotnet tool install -g roslynator.dotnet.cli
npm install -g @playwright/test
```

**Full troubleshooting:** `docs/TROUBLESHOOTING.md`

---

## 📞 Getting Help

1. Check `PROJECT-SETUP-SUMMARY.md` - Your configuration
2. Read `docs/AGENT-REFERENCE.md` - Agent details
3. Review `docs/TROUBLESHOOTING.md` - Common issues
4. Run dry setup: `.\setup.ps1 -DryRun` - Preview changes

---

## 💡 Pro Tips

✅ **Use specific keys:** `key=issue-123` better than `key=bug`  
✅ **Break large tasks:** Multiple small tasks > one huge task  
✅ **Run health checks:** Before and after major changes  
✅ **Review patterns:** Check learning reports monthly  
✅ **Sync regularly:** After implementing features  
✅ **Ask questions:** Before making changes  

---

## 📊 Quality Standards

All agents enforce:
- ✅ **0 Build Errors** - Must compile cleanly
- ✅ **0 Warnings** - Zero-tolerance policy
- ✅ **All Tests Pass** - No exceptions
- ✅ **Code Analysis** - Analyzer rules satisfied
- ✅ **Linting** - ESLint/Prettier compliant
- ✅ **Contracts** - API contracts validated

---

## 🎯 Success Criteria

After setup, you should be able to:

```
✅ @workspace /question "What agents are available?"
   → Lists all 6 agents

✅ @workspace /healthcheck
   → Reports system health

✅ @workspace /task key=test tasks="Add comment to README"
   → Successfully modifies README with 0 errors

✅ Review PROJECT-SETUP-SUMMARY.md
   → Shows your project configuration
```

---

## 🚀 You're Ready!

**Installation:** ✅ Complete (5 minutes)  
**Configuration:** ✅ Automatic  
**Agents:** ✅ All 6 available  
**Quality Tools:** ✅ Installed  
**Learning System:** ✅ Active  

**Start using:**
```
@workspace /question "What should I build first?"
```

---

*Quick Reference Card - Portable AI Agent System v1.0.0*  
*For full documentation: START-HERE.md*
