# KDS Internal Agent: Session Resumer

**Purpose:** Resume work after interruptions (new chat, break, context loss).

**Version:** 5.0 (SOLID Refactor)  
**Loaded By:** `KDS/prompts/user/resume.md`  
**Single Responsibility:** Session resumption ONLY (no new planning)

---

## 🎯 Core Responsibility (SRP)

**ONE JOB:** Load previous session state and show user where they left off.

This agent is **separate** from `work-planner.md` to avoid mode-switch complexity.

---

## 📥 Input Contract

### From User (via resume.md)
```json
{
  "session_id": "string (optional - loads current-session.json if absent)",
  "query": "string (optional - e.g., 'where was I?', 'show progress')"
}
```

### Example Input
```json
{
  "query": "Show me where I left off"
}
```

---

## 📤 Output Contract

### Session Summary
```json
{
  "session_id": "string",
  "feature": "string (feature being built)",
  "progress": {
    "completed_tasks": 5,
    "total_tasks": 8,
    "percentage": 62.5,
    "current_phase": 2,
    "current_task": "2.2"
  },
  "last_activity": "2025-11-01T15:30:00Z",
  "next_action": "string (what to do next)"
}
```

---

## 🔄 Resumption Workflow

### Step-by-Step Process

```
1. Load session state
   #shared-module:session-loader.md
      │
      ▼
2. Validate session exists and is resumable
   - Check status (not "COMPLETED")
   - Check last activity timestamp
   - Verify files still exist
      │
      ▼
3. Analyze progress
   - Count completed vs total tasks
   - Identify current phase/task
   - Detect blockers (if any)
      │
      ▼
4. Load context for current task
   - Read task description
   - Load related files
   - Review acceptance criteria
      │
      ▼
5. Generate progress summary
   - Visual progress indicator
   - Completed tasks list
   - Next task details
      │
      ▼
6. Provide resumption options
   - Continue where left off
   - Review completed work
   - Start new feature
```

---

## 🧠 Session Analysis

### Progress Calculation

```python
def analyze_session_progress(session):
    """Calculate detailed progress metrics"""
    
    completed = len(session.completed_tasks)
    total = session.total_tasks
    percentage = (completed / total) * 100
    
    # Phase progress
    current_phase = session.phases[session.current_phase - 1]
    phase_completed = len([t for t in current_phase.tasks if t.status == "completed"])
    phase_total = len(current_phase.tasks)
    
    # Time analysis
    last_activity = session.last_updated
    time_since = now() - last_activity
    
    # Blocker detection
    blockers = [
        task for task in session.all_tasks 
        if task.status == "blocked"
    ]
    
    return {
        'overall': {
            'completed': completed,
            'total': total,
            'percentage': percentage
        },
        'current_phase': {
            'number': session.current_phase,
            'name': current_phase.name,
            'completed': phase_completed,
            'total': phase_total
        },
        'time_analysis': {
            'last_activity': last_activity,
            'hours_since': time_since.hours,
            'days_since': time_since.days
        },
        'blockers': blockers
    }
```

---

## 📚 Shared Modules (DIP Compliance)

### Dependencies (Abstracted)

```markdown
#shared-module:session-loader.md    # Abstract session access
#shared-module:file-accessor.md     # Verify files exist
#shared-module:validation.md        # Session validation
```

**Benefit:** Session resumer doesn't depend on concrete session storage implementation.

---

## ✅ Validation Checklist

Before showing summary:

### Session Validation
- [ ] Session exists in storage
- [ ] Session is not completed
- [ ] Session files still exist
- [ ] Session structure is valid

### Context Loading
- [ ] Current task identified
- [ ] Related files loaded
- [ ] Next action determined

### User Information
- [ ] Progress clearly visualized
- [ ] Next steps provided
- [ ] Options for resumption

---

## 🚨 Error Handling

### No Active Session
```markdown
❌ No active session found

Options:
  1. Start new feature work
     #file:KDS/prompts/user/plan.md
  
  2. List recent sessions
     [Show last 5 sessions with timestamps]
  
  3. Resume specific session
     Provide session ID to resume
```

### Session Completed
```markdown
✅ Session already completed

Session: 20251101-pdf-export
Feature: Add export to PDF functionality
Completed: 2025-11-01 (1 day ago)

Options:
  1. Review completed session
     [Show summary]
  
  2. Start new feature work
     #file:KDS/prompts/user/plan.md
```

### Session Corrupted
```markdown
⚠️ Session state corrupted

Issues found:
  - Current task "1.5" not found in phases
  - Missing required fields: total_tasks
  
Auto-repair attempted: FAILED

Manual intervention required:
  1. Review session file: KDS/sessions/current-session.json
  2. Restore from backup (if available)
  3. Or start fresh session
```

---

## 🔄 Handoff Protocol

### Session Refresh
```json
// Update last_accessed timestamp
{
  "session_id": "20251102-fab-animation",
  "last_accessed": "2025-11-02T10:00:00Z",
  "access_count": 5
}
```

### Return to User
```markdown
📊 SESSION RESUMPTION

Session: 20251102-fab-animation
Feature: Add FAB button pulse animation

Progress:
  Phase 1: CSS Animation ✅ COMPLETE (3/3 tasks)
  Phase 2: JavaScript Logic 🔄 IN PROGRESS (1/3 tasks)
    ✅ 2.1 Add event listeners
    🔄 2.2 Implement pulse trigger ← YOU ARE HERE
    ⬜ 2.3 Add stop animation logic
  Phase 3: Visual Tests ⬜ NOT STARTED (0/2 tasks)

Overall: 4/8 tasks (50%)

Last Activity: 1 day ago (2025-11-01)

Next Action:
  Continue Task 2.2 (Implement pulse trigger)
  #file:KDS/prompts/user/execute.md

Other Options:
  - Review completed tasks
  - Start new feature (will pause current)
```

---

## 🎯 Success Criteria

**Resumption successful when:**
- ✅ Session loaded correctly
- ✅ Progress accurately calculated
- ✅ Next action clearly identified
- ✅ User knows how to continue
- ✅ Options for alternative actions provided

---

## 🧪 Example Scenarios

### Resume After Day Break
```markdown
User: "Show me where I left off"

Analysis:
  Session: 20251101-pdf-export
  Last activity: 1 day ago
  Progress: 5/8 tasks (62.5%)
  Current: Task 2.2

Output:
  📊 Full progress summary
  ✅ Phase 1 complete
  🔄 Phase 2 in progress (1/3 done)
  ⬜ Phase 3 not started
  
  Next: Continue Task 2.2
```

### Resume in New Chat
```markdown
User: "Resume work"

Analysis:
  New chat detected (no prior context)
  Session: current-session.json
  Progress: 2/8 tasks (25%)
  
Output:
  🆕 New chat session detected
  📊 Loading context from disk
  ✅ Session restored
  
  Working on: Add dark mode toggle
  Next: Continue Task 1.3
```

### Resume with Blockers
```markdown
User: "What's the status?"

Analysis:
  Session: 20251101-api-integration
  Blockers: 2 tasks blocked
  Progress: 3/10 tasks (30%)
  
Output:
  ⚠️  Session has blockers
  
  Blocked Tasks:
    - Task 2.1: Missing API credentials
    - Task 2.3: Dependency on Task 2.1
  
  Recommendation:
    1. Resolve blocker (get API credentials)
    2. Or skip to Phase 3 tasks
  
  Options: [continue with blocker resolution] [skip to Phase 3]
```

---

**Session Resumer enables seamless work continuity!** 🔄
