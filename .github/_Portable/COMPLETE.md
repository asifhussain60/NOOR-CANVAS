# COMPLETE - Setup Verification Checklist

Use this checklist to verify your AI Agent System is configured correctly.

---

## ✅ Configuration Checklist

### Step 1: Folder Structure
- [ ] `.github/` folder exists in project root
- [ ] `.github/instructions/` contains instruction files
- [ ] `.github/instructions/Links/` contains reference docs
- [ ] `.github/prompts/` contains agent prompt files
- [ ] `.github/prompts/shared/` contains shared modules
- [ ] `.github/learning/` contains learning system files

### Step 2: Template Replacement
- [ ] NO files contain `{{PROJECT_NAME}}` template variables
- [ ] NO files contain `{{DATABASE_NAME}}` template variables
- [ ] NO files contain `{{BUILD_COMMAND}}` template variables
- [ ] All `.template` extensions removed from files

### Step 3: Agent Availability
Test each agent:

```powershell
# Feature agent
@workspace /feature key=test user_request="test feature"
# Should respond with plan draft

# Question agent
@workspace /question "What agents are available?"
# Should list all agents

# Health check
@workspace /healthcheck
# Should show system status
```

- [ ] Feature agent responds
- [ ] Question agent responds
- [ ] Health check runs successfully

### Step 4: Project-Specific Configuration

Verify project values are correctly set:

- [ ] Project name appears in SelfAwareness.instructions.md
- [ ] Build commands match your project in prompts
- [ ] Database references match your database in InfrastructureQuickRef.md
- [ ] Test framework matches your project in PlaywrightQuickRef.md

---

## 🧪 Functional Tests

### Test 1: Question Agent
```
@workspace /question "What is the project name?"
```
**Expected:** Should return your actual project name, not `{{PROJECT_NAME}}`

### Test 2: Feature Planning
```
@workspace /feature key=test-feature user_request="Add a simple hello world endpoint"
```
**Expected:** 
- Shows plan draft (30-50 lines)
- Lists 2-4 phases
- Asks for approval
- **DOES NOT execute automatically**

### Test 3: Health Check
```
@workspace /healthcheck
```
**Expected:**
- All prompts validated ✅
- All instructions validated ✅
- No missing files ❌
- Configuration complete ✅

### Test 4: Handoff Protocol
```
# After feature agent shows plan, say:
proceed
```
**Expected:**
- Feature agent writes plan files
- Feature agent OUTPUTS a command like: `@workspace /task key=test-feature ...`
- Feature agent tells you: "Copy the command above and run it to begin execution."
- Feature agent **STOPS** (does not execute the command itself)

---

## ⚠️ Common Issues & Fixes

### Issue: "Template variables still present"
**Symptom:** Files contain `{{PROJECT_NAME}}` or similar  
**Cause:** total-recall didn't run or couldn't detect project type  
**Fix:**
```
@workspace /total-recall project-type=".NET" frameworks="ASP.NET Core"
```

### Issue: "Agent not found"
**Symptom:** Error: "Unknown command /feature"  
**Cause:** Prompt files not in `.github/prompts/`  
**Fix:** Verify all files copied correctly, `.template` extensions removed

### Issue: "Feature agent executing automatically"
**Symptom:** Feature agent runs task commands without asking  
**Cause:** Old version of feature.prompt.md (before October 21, 2025 fix)  
**Fix:** Re-run port-instructions:
```
@workspace /port-instructions prompt=feature.prompt.md
```

### Issue: "Build commands don't work"
**Symptom:** Agent tries wrong build command (e.g., `dotnet build` in Node.js project)  
**Cause:** Incorrect project type detection  
**Fix:** Explicitly set project type:
```
@workspace /total-recall project-type="Node.js" frameworks="Express, React"
```

### Issue: "Database references incorrect"
**Symptom:** Agent references wrong database or schema  
**Cause:** total-recall couldn't detect database configuration  
**Fix:** Manually update `.github/instructions/InfrastructureQuickRef.md` with your database details

---

## 📋 Final Verification

Run this comprehensive check:

```powershell
# 1. Health check
@workspace /healthcheck detailed=true

# 2. List agents
@workspace /question "What agents are available?"

# 3. Test feature planning
@workspace /feature key=verification-test user_request="Add a test endpoint"

# 4. Verify handoff (should NOT auto-execute)
# Say "proceed" after reviewing plan
# Feature agent should OUTPUT command, not execute it

# 5. Clean up test
@workspace /cleanup
```

**All checks passed?** ✅ Your system is ready!

---

## 🚀 Ready to Use!

Your AI Agent System is configured and ready. Here's what to do next:

### Immediate Next Steps
1. ✅ Create your first real feature:
   ```
   @workspace /feature key=my-first-feature user_request="[Your feature description]"
   ```

2. ✅ Explore capabilities:
   ```
   @workspace /question "What are some advanced features I should know about?"
   ```

3. ✅ Review documentation:
   - `README.md` - Full system overview
   - `START-HERE.md` - Quick start guide
   - `QUICK-REFERENCE.md` - Syntax reference

### Recommended First Features
- **Simple endpoint**: Good for learning the workflow
- **UI component**: Tests visual regression capabilities
- **Database migration**: Demonstrates full-stack coordination
- **Refactoring task**: Shows code improvement abilities

### Learning Resources
```
@workspace /question "How do I...?"
@workspace /question "Show me examples of...?"
@workspace /question "What's the best practice for...?"
```

---

## 📊 Success Metrics

Track these to measure effectiveness:

### Short Term (First Week)
- [ ] Completed 3+ features using feature → task workflow
- [ ] Generated tests for 2+ features
- [ ] Used refactor agent 2+ times
- [ ] Asked question agent 10+ questions
- [ ] Zero template variable errors

### Medium Term (First Month)
- [ ] Feature completion time reduced by 30%
- [ ] Test coverage increased
- [ ] Code quality metrics improved
- [ ] Learning patterns accumulated (10+ patterns)
- [ ] All team members trained on agent usage

### Long Term (First Quarter)
- [ ] 50+ features implemented via agents
- [ ] Comprehensive pattern library built
- [ ] Team productivity metrics show improvement
- [ ] System customized to project needs
- [ ] Contributing improvements back to templates

---

## 🎯 Optimization Opportunities

After using the system for a while:

1. **Analyze Learning Patterns**
   ```
   @workspace /analyze-learning key=recent-feature
   ```

2. **Review Agent Cohesion**
   ```
   @workspace /cohesion-review
   ```

3. **Update Templates**
   - Capture proven patterns
   - Update shared modules
   - Enhance instructions with project-specific learnings

4. **Share Improvements**
   - Export your learning patterns
   - Update portable templates
   - Help others avoid your mistakes

---

## ✅ COMPLETE

**Congratulations!** Your AI Agent System is fully configured and verified.

**Need help?** `@workspace /question "I need help with..."`

**Ready to build?** `@workspace /feature key=next-feature user_request="..."`

---

**Happy coding!** 🚀
