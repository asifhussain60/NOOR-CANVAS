# KDS User Command: Execute

**Purpose:** Continue working on the current active session by executing the next task.

**Version:** 4.5  
**Loaded By:** Universal entry point or direct usage

---

## 🎯 How to Use

```markdown
#file:.github/prompts/user/execute.md
```

**Or use the universal entry point:**
```markdown
#file:.github/prompts/user/kds.md

continue
```

That's it! No additional input needed.

---

## 📋 What Happens

When you use this command, KDS will:

1. **Load Session State**
   ```
   #file:.github/sessions/current-session.json
   ```

2. **Identify Next Task**
   - Reads current phase and task number
   - Loads task details from plan
   - Checks dependencies

3. **Execute Task**
   - Implements code changes
   - Follows test-first workflow (Rule #8)
   - Documents changes in work-log

4. **Validate**
   - Runs affected tests
   - Checks build status
   - Verifies no errors introduced

5. **Update State**
   - Marks task complete
   - Updates session progress
   - Saves handoff data

6. **Report & Guide**
   - Shows what was done
   - Shows files modified
   - Tells you what to do next

---

## 💡 Examples

### Example 1: First Execution
```markdown
(After planning)

You: #file:.github/prompts/user/execute.md

KDS:
✅ Task 1.1 Complete: Add CSS pulse animation

Files Modified:
  - wwwroot/css/host-control-panel.css (added .fab-pulse animation)

Changes:
  - Added @keyframes fab-pulse
  - Defined animation timing
  - Added trigger class

Tests: ✅ 0 new tests (CSS only)
Build: ✅ Passing

Next: #file:.github/prompts/user/execute.md
Progress: 1/8 tasks (13%)
```

### Example 2: Continuing Work
```markdown
You: #file:.github/prompts/user/execute.md

KDS:
✅ Task 1.2 Complete: Add JavaScript trigger

Files Modified:
  - Pages/Host/HostControlPanelContent.razor (added JS function)
  - wwwroot/js/fab-handler.js (new file)

Changes:
  - Created triggerFabPulse() function
  - Added DOM manipulation logic
  - Linked to CSS animation

Tests: ✅ 0 new tests (next task: create tests)
Build: ✅ Passing

Next: #file:.github/prompts/user/execute.md
Progress: 2/8 tasks (25%)
```

### Example 3: Phase Completion
```markdown
You: #file:.github/prompts/user/execute.md

KDS:
✅ Task 1.3 Complete: Add SignalR event listener

Files Modified:
  - Services/NotificationHub.cs (added OnQuestionReceived event)
  - Pages/Host/HostControlPanelContent.razor (added event handler)

Changes:
  - Subscribed to SignalR OnQuestionReceived
  - Triggered fab-pulse animation on event
  - Added logging

Tests: ✅ All passing (3/3)
Build: ✅ Passing

🎉 Phase 1 Complete: UI Animation (3/3 tasks)

Next Phase: Phase 2 - Testing
Next: #file:.github/prompts/user/execute.md

Progress: 3/8 tasks (38%)
```

### Example 4: Test-First Workflow
```markdown
You: #file:.github/prompts/user/execute.md

KDS:
✅ Task 2.1 Complete: Create Percy visual tests

Test-First Workflow:
  1. Created failing test (expected pulse animation)
  2. Ran test → FAILED (as expected)
  3. Implementation already exists (from Phase 1)
  4. Ran test → PASSED ✅

Files Created:
  - Tests/UI/fab-pulse-animation.spec.ts

Tests Added:
  - "FAB pulse animation on new question" (PASSED)
  - "FAB pulse stops after 2 seconds" (PASSED)
  - "Multiple questions queue pulses" (PASSED)

Percy: ✅ Snapshots captured (3 scenarios)
Build: ✅ Passing

Next: #file:.github/prompts/user/execute.md
Progress: 4/8 tasks (50%)
```

---

## ⚠️ Error Handling

### No Active Session
```
You: #file:.github/prompts/user/execute.md

KDS:
❌ No active session found.

To start new work:
  #file:.github/prompts/user/plan.md
  I want to [describe feature]

To resume previous work:
  #file:.github/prompts/user/resume.md
```

### Build Failure
```
You: #file:.github/prompts/user/execute.md

KDS:
❌ Task 1.2 Failed: Build errors detected

Files Modified:
  - Pages/Host/HostControlPanelContent.razor

Errors:
  Line 157: Syntax error - missing semicolon
  Line 203: Undefined variable 'fabButton'

Build: ❌ FAILED

Action Required:
  Fix build errors before continuing.
  
After fixing, run:
  #file:.github/prompts/user/execute.md
```

### Test Failure
```
You: #file:.github/prompts/user/execute.md

KDS:
⚠️ Task 2.1 Complete with Test Failures

Files Modified:
  - Tests/UI/fab-pulse-tests.spec.ts

Tests:
  ✅ 2 passing
  ❌ 1 failing: "FAB pulse stops after 2 seconds"
  
Failure:
  Expected pulse class to be removed after 2000ms
  Actual: Pulse class still present after 2500ms

Build: ✅ Passing

Options:
  1. Fix test failure: I'll debug and fix
  2. Continue anyway: Mark as known issue
  
What would you like to do?
```

---

## 🔄 Execution Patterns

### Rapid Iteration
```markdown
# Keep executing to make progress:
#file:.github/prompts/user/execute.md
(task 1.1 complete)

#file:.github/prompts/user/execute.md
(task 1.2 complete)

#file:.github/prompts/user/execute.md
(task 1.3 complete - Phase 1 done!)

#file:.github/prompts/user/execute.md
(task 2.1 starting - Phase 2 begins)
```

### Execution with Corrections
```markdown
You: #file:.github/prompts/user/execute.md
(KDS starts working...)

You: #file:.github/prompts/user/correct.md
     Wrong file! Use HostControlPanelContent.razor

KDS: ✅ Corrected. Restarting task with correct file.

(Auto-continues execution with correction)

KDS: ✅ Task 1.2 Complete (after correction)
```

### Execution After Break
```markdown
(Day 1 - complete 3 tasks)
You: #file:.github/prompts/user/execute.md
You: #file:.github/prompts/user/execute.md
You: #file:.github/prompts/user/execute.md

(Close chat, next day)

(Day 2 - new chat)
You: #file:.github/prompts/user/resume.md

KDS: Progress: 3/8 tasks (38%)
     Next: #file:.github/prompts/user/execute.md

You: #file:.github/prompts/user/execute.md
(continues from task 4)
```

---

## 🔧 Behind the Scenes

### This Prompt Loads:
```markdown
#file:.github/prompts/internal/code-executor.md
```

### Code Executor Reads:
```markdown
#file:.github/sessions/current-session.json (current state)
#file:.github/keys/{feature}/plan.md (implementation plan)
#file:.github/keys/{feature}/work-log.md (activity history)
#file:.github/governance/rules.md (validation rules)
#file:.github/prompts/shared/test-first.md (TDD workflow)
```

### Code Executor Updates:
```markdown
#file:.github/keys/{feature}/work-log.md (logs changes)
#file:.github/keys/{feature}/handoffs/execute-{N}.json (handoff data)
#file:.github/sessions/current-session.json (progress update)
```

---

## 📊 Progress Tracking

### Session State Updates
```json
{
  "session_id": "fab-button-animation",
  "status": "ACTIVE",
  "current_phase": 2,
  "current_task": "2.1",
  "tasks_complete": 4,
  "tasks_total": 8,
  "progress_percent": 50,
  "files_modified": [
    "wwwroot/css/host-control-panel.css",
    "Pages/Host/HostControlPanelContent.razor",
    "wwwroot/js/fab-handler.js",
    "Services/NotificationHub.cs"
  ]
}
```

### Work Log Entry
```markdown
### Task 1.2: Add JavaScript trigger

**Status:** COMPLETE
**Started:** 2025-11-02 10:15:32
**Completed:** 2025-11-02 10:18:45
**Duration:** 3m 13s

**Changes:**
- Created triggerFabPulse() function in fab-handler.js
- Added DOM manipulation to apply pulse class
- Integrated with SignalR event system

**Files Modified:**
- Pages/Host/HostControlPanelContent.razor
- wwwroot/js/fab-handler.js (new file)

**Tests:**
- No new tests (CSS/JS implementation)
- Existing tests still passing (12/12)

**Build:** ✅ PASSING
**Next Task:** 1.3 - Add SignalR event listener
```

---

## ✅ Success Criteria

**Execution succeeds when:**
- ✅ Task implementation complete
- ✅ Code follows test-first workflow (when applicable)
- ✅ Build passing
- ✅ Affected tests passing
- ✅ Work log updated
- ✅ Session state saved
- ✅ User knows what to do next

---

## 🚀 What's Next

**After each execution:**
- Keep running `execute.md` until phase complete
- KDS guides you through all phases
- Final execution triggers validation

**When all phases complete:**
```
✅ All Phases Complete!

Session: fab-button-animation
Tasks: 8/8 (100%)
Files Modified: 6 files
Tests: 15 passing
Build: ✅ PASSING

Ready to commit:
  git add [modified files]
  git commit -m "feat: Add FAB pulse animation on new questions"

Next: #file:.github/prompts/user/validate.md (final check)
```

---

**Keep executing to make progress!** 🚀
