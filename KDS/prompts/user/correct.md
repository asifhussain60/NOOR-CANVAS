# KDS User Command: Correct

**Purpose:** Override Copilot's incorrect assumptions, hallucinations, or misunderstandings during active work.

**When to Use:**
- Copilot is working on the wrong file
- Copilot misunderstood your requirements
- Copilot is implementing something incorrectly
- Copilot made false assumptions about your codebase
- Copilot is hallucinating features/files that don't exist

---

## 🎯 Command Format

```markdown
#file:KDS/prompts/user/correct.md

[Explain what Copilot got wrong and what the correct approach should be]
```

---

## 📝 How to Use

### Example 1: Wrong File
```markdown
#file:KDS/prompts/user/correct.md

You're modifying HostControlPanel.razor but the FAB button is actually 
in HostControlPanelContent.razor. Please update the correct file.
```

### Example 2: Misunderstood Requirements
```markdown
#file:KDS/prompts/user/correct.md

I didn't ask for a full redesign of the panel. I only want to add a 
pulse animation to the existing FAB button, keeping everything else 
the same.
```

### Example 3: Hallucinated API
```markdown
#file:KDS/prompts/user/correct.md

There is no /api/sessions/export endpoint. You need to CREATE it first 
in SessionsController.cs before implementing the UI that calls it.
```

### Example 4: Wrong Test Framework
```markdown
#file:KDS/prompts/user/correct.md

We use Playwright for UI tests, not Selenium. Please rewrite the tests 
using Playwright's getByTestId() selectors.
```

### Example 5: Incorrect Assumption About Architecture
```markdown
#file:KDS/prompts/user/correct.md

The app uses SignalR for real-time updates, not polling. Please implement 
the notification system using the existing SignalR hub instead of HTTP polling.
```

---

## 🔧 What Happens When You Use This Command

1. **Copilot Stops Current Work**
   - Halts execution of current task
   - Does NOT commit or save incorrect changes

2. **Copilot Re-analyzes Context**
   - Reads your correction carefully
   - Reviews actual project files (not assumptions)
   - Updates internal understanding

3. **Copilot Proposes Corrected Approach**
   - Shows you what it NOW understands
   - Asks for confirmation before proceeding
   - Explains the correction in work-log

4. **Session State Updated**
   - Logs the correction in work-log.md
   - Marks what was incorrect
   - Documents correct approach for future reference

---

## ⚠️ Important Notes

### User Override is ALLOWED
Per KDS Rule #1 (Governance):
- Your correction will be accepted
- But it will be logged with your rationale
- KDS learns from the correction for future work

### Copilot Will Validate Your Correction
Before proceeding, Copilot will:
- ✅ Check that files you mention actually exist
- ✅ Verify your correction aligns with codebase
- ✅ Confirm the corrected approach is feasible
- ✅ Ask clarifying questions if needed

### Continue After Correction
Once corrected:
```markdown
#file:KDS/prompts/user/execute.md
```
This continues execution with the corrected understanding.

---

## 🎯 Correction Workflow

```
┌─────────────────────────────────────┐
│ You: #file:KDS/prompts/user/    │
│      execute.md                     │
└─────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│ Copilot starts modifying wrong file │
│ or implementing wrong approach      │
└─────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│ You: #file:KDS/prompts/user/    │
│      correct.md                     │
│                                     │
│ You're working on the wrong file.   │
│ The FAB button is in Content.razor  │
└─────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│ Copilot: STOPS current work         │
│ Reads actual Content.razor file     │
│ Updates understanding               │
└─────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│ Copilot: ✓ Understood. I see the    │
│ FAB button is at line 157 in        │
│ HostControlPanelContent.razor.      │
│ I'll modify that file instead.      │
└─────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│ You: #file:KDS/prompts/user/    │
│      execute.md                     │
└─────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│ Copilot continues with CORRECT      │
│ understanding                       │
└─────────────────────────────────────┘
```

---

## 📊 Logged in Work Log

When you use `correct.md`, the work log will show:

```markdown
### Task 2.1: Add FAB Animation

**Status:** CORRECTED
**Initial Approach:** Modify HostControlPanel.razor
**Issue:** User correction - working on wrong file
**User Input:** "FAB button is in HostControlPanelContent.razor"
**Corrected Approach:** Modify HostControlPanelContent.razor instead
**Outcome:** ✅ Implemented correctly after user override

Files Modified:
- SPA/NoorCanvas/Pages/Host/HostControlPanelContent.razor (line 157)
```

---

## 🎓 When NOT to Use This

**Don't use `correct.md` for:**

### 1. Asking Questions
```markdown
❌ BAD:
#file:KDS/prompts/user/correct.md
Which file should I modify?

✅ GOOD:
#file:KDS/prompts/user/ask-kds.md
Which file contains the FAB button?
```

### 2. Requesting New Features
```markdown
❌ BAD:
#file:KDS/prompts/user/correct.md
Actually, let's add a tooltip to the FAB button too.

✅ GOOD:
#file:KDS/prompts/user/plan.md
I want to add a tooltip to the FAB button.
```

### 3. Checking Progress
```markdown
❌ BAD:
#file:KDS/prompts/user/correct.md
Show me what you've done so far.

✅ GOOD:
#file:KDS/prompts/user/resume.md
```

### 4. Validating Work
```markdown
❌ BAD:
#file:KDS/prompts/user/correct.md
Did the tests pass?

✅ GOOD:
#file:KDS/prompts/user/validate.md
```

---

## ✅ Summary

**Use `correct.md` when:**
- ✅ Copilot is hallucinating
- ✅ Copilot misunderstood requirements
- ✅ Copilot is working on wrong files
- ✅ Copilot made incorrect assumptions
- ✅ You need to override current approach

**What happens:**
1. Copilot STOPS current work
2. Re-analyzes with your correction
3. Proposes corrected approach
4. Logs the correction in work-log
5. You continue with `execute.md`

**Format:**
```markdown
#file:KDS/prompts/user/correct.md

[Clear explanation of what's wrong and what's correct]
```

---

**Your correction is always accepted. KDS learns from it.** ✨
