# START HERE - Portable AI Agent System

**3-Step Quick Start** → Ready in 5 minutes!

---

## Step 1: Run Setup (2 minutes)

### Windows
```cmd
setup.bat
```

### PowerShell/Linux/Mac
```bash
./setup.ps1
```

**What happens:**
- Detects your project type automatically
- Asks configuration questions
- Generates customized files
- Creates workspace structure
- Produces summary document

---

## Step 2: Review Setup (2 minutes)

Open and review:
- `PROJECT-SETUP-SUMMARY.md` - Configuration details
- `.github/instructions/SelfAwareness.instructions.md` - Operating rules
- `.github/instructions/Links/SystemIndex.md` - Navigation hub

---

## Step 3: Try Your First Agent (1 minute)

```
@workspace /question What agents are available?
```

**Success!** You're now ready to use all 8 AI agents.

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

### 🔍 Total Recall Agent - Populate Templates (Meta)
```
@workspace /total-recall
```

**Use for:** Analyzing a new project and populating all templates with project data  
**Note:** Run this AFTER setup.bat to fully customize the system for your project

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

### Setup Failed
- Check PowerShell execution policy
- Run as administrator if needed
- Verify project structure matches expected type

### Agents Not Working
- Ensure SelfAwareness.instructions.md exists
- Check agent prompt files present
- Verify workspace structure created

### Documentation Issues
- Run `/sync` to update docs
- Check SystemIndex.md for navigation
- Review generated template files

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
