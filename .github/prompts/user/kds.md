# KDS Universal Entry Point

**Purpose:** Single command for ALL KDS interactions. You don't need to remember multiple commands - just use this one and KDS figures out what you need.

**Version:** 4.5  
**Status:** ACTIVE

---

## 🎯 The ONLY Command You Need to Remember

```markdown
#file:.github/prompts/user/kds.md

[Tell KDS what you want in natural language]
```

That's it! KDS will automatically:
- ✅ Analyze your request (intent detection)
- ✅ Route to the appropriate specialist agent
- ✅ Execute the correct workflow
- ✅ Handle multi-step operations
- ✅ Maintain session state

---

## 📋 What You Can Say

### Start New Work
```markdown
#file:.github/prompts/user/kds.md

I want to add a FAB button pulse animation when questions arrive
```
→ Routes to: **plan.md** → work-planner.md

### Continue Existing Work
```markdown
#file:.github/prompts/user/kds.md

Continue working on the current task
```
→ Routes to: **execute.md** → code-executor.md

### Resume After Break
```markdown
#file:.github/prompts/user/kds.md

Show me where I left off
```
→ Routes to: **resume.md** → work-planner.md

### Fix Copilot's Mistake
```markdown
#file:.github/prompts/user/kds.md

You're modifying the wrong file. The FAB button is in HostControlPanelContent.razor
```
→ Routes to: **correct.md** → code-executor.md

### Create Tests
```markdown
#file:.github/prompts/user/kds.md

Create visual regression tests for the share button
```
→ Routes to: **test.md** → test-generator.md

### Check System Health
```markdown
#file:.github/prompts/user/kds.md

Run all validations and show me the health status
```
→ Routes to: **validate.md** → health-validator.md

### Ask Questions
```markdown
#file:.github/prompts/user/kds.md

How do I use Playwright to test the canvas element?
```
→ Routes to: **ask-kds.md** → knowledge-retriever.md

### Review KDS Changes
```markdown
#file:.github/prompts/user/kds.md

I updated the test-generator to support Percy visual testing
```
→ Routes to: **govern.md** → change-governor.md

---

## 🤖 How It Works

### Step 1: Intent Detection
When you use `kds.md`, it loads the **Intent Router** agent which analyzes your request.

**Router reads:**
```yaml
keywords:
  plan: ["I want to", "add a", "create a", "build a", "implement"]
  execute: ["continue", "next task", "keep going", "proceed"]
  resume: ["where was I", "show progress", "left off", "resume"]
  correct: ["wrong file", "not what I", "actually", "correction"]
  test: ["test", "visual regression", "playwright", "unit test"]
  validate: ["health", "validate", "check", "run all", "status"]
  ask: ["how do I", "what is", "explain", "tell me about"]
  govern: ["I updated KDS", "I modified .github", "review my changes"]
```

### Step 2: Routing Decision
```
User: "I want to add dark mode"
  ↓
Intent Router: Detects "I want to add" = PLAN intent
  ↓
Routes to: plan.md → work-planner.md
  ↓
Creates multi-phase plan, saves session state
```

### Step 3: Execution
The appropriate specialist agent executes:
- **Planner:** Breaks work into phases/tasks
- **Executor:** Implements code changes
- **Tester:** Creates and runs tests
- **Validator:** Checks system health
- **Governor:** Reviews KDS modifications
- **Knowledge Retriever:** Answers questions

### Step 4: Handoff (If Multi-Step)
For complex requests like "Add dark mode and test it":
```
User: "I want to add dark mode and test it"
  ↓
Intent Router: Detects TWO intents (PLAN + TEST)
  ↓
Routes to: plan.md → work-planner.md
  ↓
Planner creates plan with testing phase
  ↓
Tells you: "Next: #file:.github/prompts/user/kds.md continue"
  ↓
You: "continue"
  ↓
Routes to: execute.md → code-executor.md
  ↓
Implements code → Routes to: test.md → test-generator.md
  ↓
Creates tests → Validates → Complete
```

---

## 🎯 Intent Detection Rules

**LOAD:** `#file:.github/prompts/internal/intent-router.md`

The router uses these patterns:

### PRIMARY INTENT (Choose One)

**PLAN** - Starting new feature work
```
Patterns: "I want to", "add a", "create a", "build", "implement"
Examples: 
  - "I want to add a share button"
  - "Create a PDF export feature"
  - "Build a dark mode toggle"
```

**EXECUTE** - Continue active session
```
Patterns: "continue", "next", "keep going", "proceed", "execute"
Examples:
  - "Continue working"
  - "Next task"
  - "Keep going"
```

**RESUME** - Pickup after interruption
```
Patterns: "resume", "where was I", "show progress", "left off", "status"
Examples:
  - "Show me where I left off"
  - "What's the current status?"
  - "Resume work"
```

**CORRECT** - Fix Copilot error
```
Patterns: "wrong", "not that", "actually", "correction", "fix"
Examples:
  - "You're working on the wrong file"
  - "That's not what I meant"
  - "Actually, use SignalR not polling"
```

**TEST** - Create or run tests
```
Patterns: "test", "playwright", "visual regression", "unit test"
Examples:
  - "Create visual tests for the button"
  - "Run all Playwright tests"
  - "Add unit tests for the service"
```

**VALIDATE** - System health check
```
Patterns: "validate", "health", "check", "run all", "quality"
Examples:
  - "Check system health"
  - "Validate all changes"
  - "Run quality checks"
```

**ASK** - Question about KDS/codebase
```
Patterns: "how do I", "what is", "explain", "tell me", "?"
Examples:
  - "How do I test canvas elements?"
  - "What test patterns exist?"
  - "Explain the session state"
```

**GOVERN** - Review KDS changes
```
Patterns: "I updated KDS", "modified .github", "review", "KDS change"
Examples:
  - "I updated the test-generator"
  - "Review my KDS modifications"
  - "I changed the rules"
```

### SECONDARY INTENTS (Can Combine)

**If multiple intents detected:**
```
"I want to add dark mode and test it"
  ↓
Primary: PLAN
Secondary: TEST
  ↓
Planner includes testing phase in plan
```

---

## 🔄 Complete Workflow Examples

### Example 1: New Feature (Simple)
```
You: #file:.github/prompts/user/kds.md
     I want to add a pulse animation to the FAB button

Router: PLAN intent detected
   ↓
Planner: Creates 3-phase plan
   ↓
Output: ✅ Session created: fab-button-animation
        Next: #file:.github/prompts/user/kds.md continue
```

### Example 2: Continue Work
```
You: #file:.github/prompts/user/kds.md
     continue

Router: EXECUTE intent detected
   ↓
Executor: Implements next task
   ↓
Output: ✅ Task 1.1 complete: CSS animation added
        Next: #file:.github/prompts/user/kds.md continue
```

### Example 3: Resume After Break
```
(New chat next day)

You: #file:.github/prompts/user/kds.md
     where was I?

Router: RESUME intent detected
   ↓
Planner: Loads current session
   ↓
Output: Session: fab-button-animation
        Progress: 3/8 tasks (38%)
        Next: #file:.github/prompts/user/kds.md continue
```

### Example 4: Correction Mid-Work
```
You: #file:.github/prompts/user/kds.md
     continue

Executor: Modifying HostControlPanel.razor...

You: #file:.github/prompts/user/kds.md
     Wrong file! The FAB is in HostControlPanelContent.razor

Router: CORRECT intent detected
   ↓
Executor: STOPS, re-analyzes, corrects
   ↓
Output: ✅ Corrected. Modifying HostControlPanelContent.razor instead.
        Next: #file:.github/prompts/user/kds.md continue
```

### Example 5: Multi-Intent Request
```
You: #file:.github/prompts/user/kds.md
     I want to add dark mode toggle and create Percy visual tests for it

Router: PLAN + TEST intents detected
   ↓
Planner: Creates plan with dedicated test phase
   ↓
Output: ✅ 4-phase plan created (includes visual testing)
        Phase 4: Percy visual regression tests
        Next: #file:.github/prompts/user/kds.md continue
```

---

## ✅ Benefits of Universal Entry Point

### User Experience
- ✅ **One command to remember** (`kds.md`)
- ✅ **Natural language** - say what you want
- ✅ **No cognitive load** - don't need to know which specialist to call
- ✅ **Forgiving** - works even if you're vague

### Technical Benefits
- ✅ **Intelligent routing** - right agent for the job
- ✅ **Multi-intent handling** - complex requests work
- ✅ **Context preservation** - session state maintained
- ✅ **Automatic workflows** - no manual orchestration

### Comparison

**Before (7 commands to remember):**
```
plan.md → for new features
execute.md → for continuing work
resume.md → after breaks
correct.md → for fixing errors
test.md → for creating tests
validate.md → for health checks
ask-kds.md → for questions
govern.md → for KDS changes
```

**After (1 command):**
```
kds.md → for EVERYTHING
```

---

## 🚫 When Routing Fails

**If intent is ambiguous:**
```
You: #file:.github/prompts/user/kds.md
     do something

Router: ❓ Intent unclear. Did you mean:
        1. Continue current work? (execute)
        2. Check progress? (resume)
        3. Validate changes? (validate)
        
        Please clarify.
```

**If no active session and you say "continue":**
```
You: #file:.github/prompts/user/kds.md
     continue

Router: ❌ No active session found.
        Did you mean to start new work?
        Use: "I want to [describe feature]"
```

---

## 📊 Does This Hurt KDS Design?

### Answer: NO - It Enhances It!

**Design Principle:**
- ✅ **Specialist agents still exist** (plan, execute, test, etc.)
- ✅ **Single Responsibility maintained** (each agent has one job)
- ✅ **Routing layer is separate** (intent-router.md)
- ✅ **You can still call specialists directly** (if you want)

**Architecture:**
```
User Interface Layer:
  kds.md (universal) ────────┐
  plan.md (direct)   ────────┤
  execute.md (direct) ───────┤
  test.md (direct)    ───────┤  All route through
  ...                        ├─→ intent-router.md
                             │
Internal Agent Layer:        │
  work-planner.md     ←──────┤
  code-executor.md    ←──────┤
  test-generator.md   ←──────┤
  health-validator.md ←──────┤
  change-governor.md  ←──────┘
```

**Flexibility:**
```
Option 1 (Easy): Use kds.md universal entry point
Option 2 (Explicit): Call specific prompts directly

Both work! Universal is for convenience.
```

---

## 🎓 Quick Reference Card

**For everything:**
```
#file:.github/prompts/user/kds.md
[what you want in natural language]
```

**What it detects:**
- "I want to..." → plan
- "Continue..." → execute  
- "Where was I..." → resume
- "Wrong..." → correct
- "Test..." → test
- "Validate..." → validate
- "How do I..." → ask
- "I updated KDS..." → govern

**That's all you need to know!** 🚀

---

## 🔗 Technical Implementation

**This prompt loads:**
```markdown
#file:.github/prompts/internal/intent-router.md
```

**Which analyzes your request and loads one of:**
```
#file:.github/prompts/user/plan.md → #file:.github/prompts/internal/work-planner.md
#file:.github/prompts/user/execute.md → #file:.github/prompts/internal/code-executor.md
#file:.github/prompts/user/test.md → #file:.github/prompts/internal/test-generator.md
#file:.github/prompts/user/validate.md → #file:.github/prompts/internal/health-validator.md
#file:.github/prompts/user/govern.md → #file:.github/prompts/internal/change-governor.md
#file:.github/prompts/user/ask-kds.md → #file:.github/prompts/internal/knowledge-retriever.md
#file:.github/prompts/user/correct.md → #file:.github/prompts/internal/code-executor.md
#file:.github/prompts/user/resume.md → #file:.github/prompts/internal/work-planner.md
```

---

## ✨ Summary

**You asked:**
> "I won't be able to remember this. Can there be an entry prompt for anything and everything?"

**Answer: YES! Use `kds.md` for EVERYTHING.**

**Will this hurt KDS design?**
> **NO! It enhances it with a convenience layer while preserving the specialist architecture.**

**What you need to remember:**
```
#file:.github/prompts/user/kds.md
[describe what you want]
```

**That's it. KDS handles the rest.** 🎯
