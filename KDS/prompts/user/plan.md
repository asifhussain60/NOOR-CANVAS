# KDS User Command: Plan

**Purpose:** Start new feature work by creating a multi-phase implementation plan.

**Version:** 4.5  
**Loaded By:** Universal entry point or direct usage

---

## 🎯 How to Use

```markdown
#file:KDS/prompts/user/plan.md

I want to [describe your feature in natural language]
```

**Or use the universal entry point:**
```markdown
#file:KDS/prompts/user/kds.md

I want to [describe your feature]
```

---

## 📋 What Happens

When you use this command, KDS will:

1. **Load the Work Planner Agent**
   ```
   #file:KDS/prompts/internal/work-planner.md
   ```

2. **Analyze Your Request**
   - Extract feature requirements
   - Identify affected layers (UI, API, Database, Tests)
   - Determine complexity
   - Check for existing work

3. **Create Multi-Phase Plan**
   - Break feature into phases
   - Break phases into tasks
   - Define success criteria
   - Estimate effort

4. **Save Session State**
   - Create new session in `KDS/sessions/current-session.json`
   - Generate unique session ID
   - Initialize work log

5. **Provide Next Steps**
   - Tell you exactly what to do next
   - Usually: `#file:KDS/prompts/user/execute.md`

---

## 💡 Examples

### Example 1: Simple Feature
```markdown
#file:KDS/prompts/user/plan.md

I want to add a pulse animation to the FAB button when new questions arrive
```

**KDS Response:**
```
✅ 3-Phase Plan Created

Session: fab-button-animation
Branch: features/fab-button
Key: KDS/keys/fab-button-animation/

Phase 1: UI Animation (3 tasks)
  1.1 Add CSS pulse animation
  1.2 Add JavaScript trigger
  1.3 Add SignalR event listener

Phase 2: Testing (2 tasks)
  2.1 Create Percy visual tests
  2.2 Create interaction tests

Phase 3: Validation (2 tasks)
  3.1 Run all tests
  3.2 Code quality check

Next: #file:KDS/prompts/user/execute.md
```

### Example 2: Complex Feature
```markdown
#file:KDS/prompts/user/plan.md

I want to add a session export feature that generates PDFs with annotations,
participant lists, and timestamps
```

**KDS Response:**
```
✅ 5-Phase Plan Created

Session: session-export-to-pdf
Branch: features/session-export
Key: KDS/keys/session-export-to-pdf/

Phase 1: API Layer (4 tasks)
  1.1 Create /api/sessions/{id}/export endpoint
  1.2 Create PDF generation service
  1.3 Aggregate annotations data
  1.4 Format participant data

Phase 2: Backend Services (3 tasks)
  2.1 Install PDF library (QuestPDF)
  2.2 Implement PDF template
  2.3 Add watermarking

Phase 3: UI Layer (3 tasks)
  3.1 Add export button to Host Control Panel
  3.2 Create export modal dialog
  3.3 Add progress indicator

Phase 4: Testing (4 tasks)
  4.1 Unit tests for PDF service
  4.2 Integration tests for API endpoint
  4.3 UI tests for export button
  4.4 Visual tests for modal

Phase 5: Validation (2 tasks)
  5.1 Run all tests
  5.2 Code quality check

Next: #file:KDS/prompts/user/execute.md
```

### Example 3: Multi-Intent (Plan + Test)
```markdown
#file:KDS/prompts/user/plan.md

I want to add dark mode toggle and create comprehensive Percy visual tests
```

**KDS Response:**
```
✅ 4-Phase Plan Created (includes testing requirements)

Session: dark-mode-toggle
Branch: features/dark-mode
Key: KDS/keys/dark-mode-toggle/

Phase 1: Theme System (4 tasks)
  1.1 Create CSS variables
  1.2 Create theme toggle component
  1.3 Implement theme switching logic
  1.4 Add localStorage persistence

Phase 2: UI Integration (3 tasks)
  2.1 Add toggle to navigation
  2.2 Update all components
  2.3 Test color contrast

Phase 3: Percy Visual Tests (3 tasks)  ← Automatically included!
  3.1 Capture light mode screenshots
  3.2 Capture dark mode screenshots
  3.3 Create toggle interaction tests

Phase 4: Validation (2 tasks)
  4.1 Run all tests
  4.2 Code quality check

Next: #file:KDS/prompts/user/execute.md
```

---

## ⚠️ Important Notes

### Check for Existing Session
If you already have an active session:
```
⚠️ Active session exists: fab-button-animation
   Progress: 3 of 8 tasks complete (38%)
   
Options:
  1. Complete current session first: "continue"
  2. Pause current and start new (will save progress)
  
What would you like to do?
```

### Session Naming
KDS auto-generates session IDs:
```
Format: session-YYYY-MM-DD-{feature-slug}
Example: session-2025-11-02-fab-button-animation
```

### Branch Alignment
KDS checks current git branch:
```
Current branch: features/fab-button
Recommended: Continue on this branch or create new?
```

---

## 🔧 Behind the Scenes

### This Prompt Loads:
```markdown
#file:KDS/prompts/internal/work-planner.md
```

### Work Planner Reads:
```markdown
#file:KDS/sessions/current-session.json (check existing)
#file:KDS/governance/rules.md (validation rules)
#file:KDS/knowledge/workflows/ (similar patterns)
```

### Work Planner Creates:
```
KDS/keys/{feature-name}/
  ├── plan.md (complete implementation plan)
  ├── work-log.md (activity tracking)
  └── handoffs/ (agent communication)

KDS/sessions/current-session.json (session state)
```

---

## ✅ Success Criteria

**Planning succeeds when:**
- ✅ Multi-phase plan created
- ✅ Tasks are specific and actionable
- ✅ Success criteria defined
- ✅ Session state saved
- ✅ User knows exactly what to do next

---

## 🚀 What's Next

After planning completes:
```markdown
#file:KDS/prompts/user/execute.md
```

Repeat execution until phase complete, then KDS guides you to next phase.

---

**Ready to plan your feature!** 🎯
