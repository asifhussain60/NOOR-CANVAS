# KDS Internal Agent: Error Corrector

**Purpose:** Handle Copilot errors, hallucinations, and user corrections mid-task.

**Version:** 5.0 (SOLID Refactor)  
**Loaded By:** `KDS/prompts/user/correct.md`  
**Single Responsibility:** Error correction ONLY (no normal execution)

---

## 🎯 Core Responsibility (SRP)

**ONE JOB:** Stop current work and correct Copilot's mistake.

This agent is **separate** from `code-executor.md` to avoid mode-switch complexity.

---

## 📥 Input Contract

### From User (via correct.md)
```json
{
  "correction": "string (user's correction message)",
  "session_id": "string (optional - loads from current-session.json)",
  "current_task": "string (task being corrected)"
}
```

### Example Input
```json
{
  "correction": "Wrong file! The FAB button is in HostControlPanelContent.razor",
  "session_id": "20251102-fab-animation",
  "current_task": "1.2"
}
```

---

## 📤 Output Contract

### Correction Complete
```json
{
  "correction_applied": true,
  "original_intent": "string (what Copilot was trying to do)",
  "corrected_intent": "string (what user actually wanted)",
  "actions_taken": ["array of corrections"],
  "resumption_point": "string (task_id to resume from)"
}
```

---

## 🔄 Correction Workflow

### Step-by-Step Process

```
1. HALT current work immediately
      │
      ▼
2. Load session state
   #shared-module:session-loader.md
      │
      ▼
3. Analyze user correction
   - Extract intent (file, approach, assumption)
   - Identify what Copilot got wrong
      │
      ▼
4. Undo incorrect changes (if possible)
   - Revert uncommitted file changes
   - Delete incorrect test files
   - Restore previous state
      │
      ▼
5. Re-analyze task with correction
   - Update task understanding
   - Load correct files
   - Adjust approach
      │
      ▼
6. Update session with correction
   - Log correction in work-log.md
   - Reset task status to "ready"
      │
      ▼
7. Return to user with corrected plan
```

---

## 🧠 Correction Analysis

### Intent Extraction

```python
def extract_correction_intent(correction_message):
    """Parse user correction to understand what's wrong"""
    
    # File corrections
    if "wrong file" in correction_message.lower():
        return {
            'type': 'FILE_MISMATCH',
            'incorrect': extract_current_file(),
            'correct': extract_mentioned_file(correction_message)
        }
    
    # Approach corrections
    if "use" in correction_message and "not" in correction_message:
        return {
            'type': 'APPROACH_CHANGE',
            'incorrect': extract_rejected_approach(correction_message),
            'correct': extract_suggested_approach(correction_message)
        }
    
    # Assumption corrections
    if "actually" in correction_message.lower():
        return {
            'type': 'ASSUMPTION_ERROR',
            'incorrect': extract_copilot_assumption(),
            'correct': extract_user_clarification(correction_message)
        }
    
    # Generic correction
    return {
        'type': 'GENERIC_CORRECTION',
        'message': correction_message
    }
```

---

## 📚 Shared Modules (DIP Compliance)

### Dependencies (Abstracted)

```markdown
#shared-module:session-loader.md    # Abstract session access
#shared-module:file-accessor.md     # Abstract file operations
#shared-module:validation.md        # Rule validation
```

**Benefit:** Error corrector doesn't need to know WHERE session is stored or HOW files are accessed.

---

## ✅ Validation Checklist

Before returning to user:

### Correction Applied
- [ ] Incorrect changes reverted (if possible)
- [ ] Correct files identified
- [ ] Approach adjusted based on correction
- [ ] Task understanding updated

### Session Updated
- [ ] Correction logged in work-log.md
- [ ] Task status reset to appropriate state
- [ ] Next action clearly defined

### User Informed
- [ ] What was wrong (acknowledged)
- [ ] What was corrected (actions taken)
- [ ] How to proceed (next command)

---

## 🚨 Error Handling

### Cannot Undo Changes
```markdown
⚠️ Cannot fully revert changes

Reverted: 2 uncommitted file changes
Cannot revert: 1 committed change (requires git revert)

Recommendation:
  Manual revert required: git revert {commit_hash}
  Or continue with partial correction
```

### Ambiguous Correction
```markdown
❓ Correction unclear

User said: "That's not right"

Need clarification:
  1. Which file is incorrect?
  2. What approach should be used instead?
  3. What assumption was wrong?

Please provide more specific correction.
```

---

## 🔄 Handoff Protocol

### Update Session
```json
// KDS/sessions/current-session.json
{
  "task_id": "1.2",
  "status": "correction_applied",
  "correction": {
    "original_intent": "Modify HostControlPanel.razor",
    "corrected_intent": "Modify HostControlPanelContent.razor",
    "correction_timestamp": "2025-11-02T10:45:00Z"
  }
}
```

### Return to User
```markdown
✅ Correction Applied

What Was Wrong:
  Copilot was modifying: HostControlPanel.razor
  User correction: Use HostControlPanelContent.razor instead

Actions Taken:
  ✅ Reverted changes to HostControlPanel.razor
  ✅ Updated task to target HostControlPanelContent.razor
  ✅ Re-analyzed component structure

Next: Continue with corrected understanding
  #file:KDS/prompts/user/execute.md
```

---

## 🎯 Success Criteria

**Correction successful when:**
- ✅ User correction understood correctly
- ✅ Incorrect changes reverted (where possible)
- ✅ Correct approach identified
- ✅ Session updated with correction
- ✅ Clear next action provided

---

## 🧪 Example Scenarios

### File Correction
```markdown
User: "Wrong file! The FAB is in HostControlPanelContent.razor"

Analysis:
  Type: FILE_MISMATCH
  Incorrect: HostControlPanel.razor
  Correct: HostControlPanelContent.razor

Actions:
  1. Revert HostControlPanel.razor changes
  2. Load HostControlPanelContent.razor
  3. Update task file reference
  4. Continue with correct file
```

### Approach Correction
```markdown
User: "Use SignalR for notifications, not polling"

Analysis:
  Type: APPROACH_CHANGE
  Incorrect: Polling-based notifications
  Correct: SignalR real-time notifications

Actions:
  1. Delete polling implementation
  2. Research SignalR setup
  3. Update task approach
  4. Create new plan for SignalR
```

### Assumption Correction
```markdown
User: "Actually, the canvas uses fabric.js not native canvas"

Analysis:
  Type: ASSUMPTION_ERROR
  Incorrect: Assumed native HTML5 canvas
  Correct: Fabric.js library

Actions:
  1. Update understanding of canvas implementation
  2. Research fabric.js API
  3. Adjust test strategy (fabric.js methods)
  4. Continue with correct assumption
```

---

**Error Corrector ensures Copilot learns from mistakes!** 🔧
