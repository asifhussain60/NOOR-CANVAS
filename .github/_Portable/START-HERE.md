# START HERE - Portable AI Agent System

**Drop-In Setup** → Ready in 30 seconds!

---

## 🚀 Quick Setup (3 Steps)

### Step 1: Copy _Portable Folder (10 seconds)

Copy the entire `.github/_Portable/` folder to your project:

```bash
# From this project
cp -r .github/_Portable/ /path/to/your/project/.github/

# Or on Windows
xcopy /E /I .github\_Portable\ C:\path\to\your\project\.github\
```

**Result:** Your project now has `.github/` folder with prompts, instructions, and learning infrastructure.

---

### Step 2: Run total-recall (15 seconds)

Open your project in VS Code with GitHub Copilot, then run:

```
@workspace /total-recall
```

**What total-recall does automatically:**
- 🔍 **Scans** your project structure
- 🎯 **Detects** project type (.NET, Node.js, Python, Java, etc.)
- 📝 **Extracts** configuration (database, ports, build commands, etc.)
- ✨ **Populates** all 35+ template variables
- 🧹 **Processes** .template files (replaces variables, removes extensions)
- ✅ **Validates** completeness (ensures no {{VARIABLES}} remain)

**No manual configuration required!**

---

### Step 3: Verify Setup (5 seconds)

Test that agents are ready:

```
@workspace /question What agents are available?
```

**Expected Response:** List of 8 specialized agents + 2 meta-agents

**Success!** You're now ready to use all AI agents.

---

## 🎯 Understanding the System

### What You Just Installed

**8 Specialized Agents:**
- 💼 **Task Agent** - Execute features, bug fixes, incremental work
- 🔧 **Refactor Agent** - Improve code quality and architecture
- 🔄 **Sync Agent** - Keep documentation synchronized
- 🏥 **Healthcheck Agent** - Validate system health
- ❓ **Question Agent** - Answer questions about your project
- 🧪 **Test Agent** - Generate test suites
- 📊 **Learning Agent** - Extract success patterns
- 🎯 **Cohesion Agent** - Review quality and architecture

**2 Meta-Agents:**
- 🔄 **Port Instructions** - Regenerate portable system
- 🔍 **Total Recall** - Configure system for new projects

**Infrastructure:**
- Learning system (patterns, insights, recommendations)
- Workspace structure (organized work areas)
- Self-awareness (core operating instructions)
- Documentation sync (automatic updates)

---

## Agent Quick Reference

### 💼 Task Agent - Execute Work
```
@workspace /task key=feature-name tasks="Implement X
---
Add tests for X
---
Update docs"
```

**Use for:** Features, bug fixes, incremental work

---

### 🔧 Refactor Agent - Improve Code
```
@workspace /refactor key=cleanup scope=module
```

**Use for:** Code quality, architecture improvements

---

### 🔄 Sync Agent - Update Docs
```
@workspace /sync
```

**Use for:** Keeping documentation current

---

### 🏥 Healthcheck Agent - Validate System
```
@workspace /healthcheck
```

**Use for:** Build verification, system validation

---

### ❓ Question Agent - Get Answers
```
@workspace /question How does [feature] work?
```

**Use for:** Learning about the project

---

### 🧪 Test Agent - Generate Tests
```
@workspace /test target=src/MyService.cs
```

**Use for:** Creating test suites

---

### 📊 Learning Agent - Extract Patterns
```
@workspace /analyze-learning
```

**Use for:** Continuous improvement

---

### 🎯 Cohesion Agent - Review Quality
```
@workspace /cohesion-review
```

**Use for:** Architecture compliance, quality audits

---

### 🔄 Port Instructions Agent - Create Portable System (Meta)
```
@workspace /port-instructions
```

**Use for:** Regenerating the _Portable folder with latest improvements  
**Note:** This is a meta-agent that creates the portable system itself

---

### 🔍 Total Recall Agent - Configure for New Projects (Meta)
```
@workspace /total-recall
```

**Use for:** First-time setup after copying _Portable to a new project  
**What it does:** Scans project, detects configuration, populates all templates automatically  
**When to run:** Immediately after copying _Portable folder (Step 2 of setup)

---

## Common Workflows

### New Feature
```
# 1. Implement feature
@workspace /task key=login tasks="Add login functionality"

# 2. Generate tests
@workspace /test target=src/auth/LoginService

# 3. Check quality
@workspace /healthcheck

# 4. Mark complete
@workspace /task key=login tasks="mark complete"
```

### Bug Fix
```
# 1. Fix the bug
@workspace /task key=bug-123 tasks="Fix null reference in User.cs"

# 2. Add regression test
@workspace /task key=bug-123 tasks="Add test for null case"

# 3. Update docs
@workspace /sync
```

### Code Quality
```
# 1. Refactor code
@workspace /refactor key=cleanup-services scope=service

# 2. Check improvements
@workspace /cohesion-review

# 3. Extract learnings
@workspace /analyze-learning
```

---

## Pro Tips

### 📌 Phase-Based Tasks
Use `---` to separate phases:
```
@workspace /task key=feature tasks="Phase 1: Create component
---
Phase 2: Add styling
---
Phase 3: Wire up API"
```

Each phase gets its own test and validation.

### 🔖 Learning System
The system learns as you work:
- Captures successful patterns
- Avoids known failures
- Generates recommendations
- Improves efficiency

Run `/analyze-learning` weekly to extract insights.

### 📝 Documentation Sync
Keep docs current automatically:
```
@workspace /sync target=architecture
```

Syncs Architecture.md with actual codebase.

### 🎯 Debug Logging
Control debug output:
```
@workspace /task key=feature debug-level=trace tasks="..."
```

Options: `none`, `simple`, `trace`

---

## Next Steps

### Customize Your Setup
1. Review `.github/instructions/Links/InfrastructureQuickRef.md`
2. Update with actual database details
3. Add project-specific information
4. Configure code quality tools

### Learn the System
1. Read `SelfAwareness.instructions.md` - Core rules
2. Browse `.github/prompts/` - Agent capabilities
3. Check `.github/learning/` - Learning system
4. Review `SystemIndex.md` - Navigation

### Start Working
1. Create your first task
2. Let agents generate tests
3. Watch the learning system grow
4. Enjoy increased productivity!

---

## Troubleshooting

## Troubleshooting

### total-recall Not Responding
- Ensure `.github/` folder copied correctly from _Portable
- Verify GitHub Copilot is active in VS Code
- Try running again: `@workspace /total-recall`

### Template Variables Not Replaced
- Check if total-recall completed successfully
- Look for .template files still present (should be removed)
- Some variables may require manual configuration if project structure is non-standard

### Agents Not Working
- Ensure SelfAwareness.instructions.md exists in `.github/instructions/`
- Check agent prompt files present in `.github/prompts/`
- Verify workspace structure created (Workspaces/Copilot/)

### Project Type Not Detected
- Ensure project has standard files (.sln for .NET, package.json for Node.js, etc.)
- Check if project structure matches expected patterns
- May need to manually configure some variables in template files

---

## Getting Help

### Documentation
- **README.md** - Overview and features
- **QUICK-REFERENCE.md** - Command syntax
- **COMPLETE.md** - Setup checklist
- **STATUS.md** - Version info

### In-System Help
```
@workspace /question [your question]
```

The Question agent can answer project-specific questions.

---

**Ready to build amazing things? Start with your first task!**

```
@workspace /task key=getting-started tasks="Verify setup is complete"
```
