# KDS Internal Agent: Code Executor

**Purpose:** Execute tasks from active session with test-first workflow and progress tracking.

**Version:** 5.1 (Context-Brain Integration)  
**Loaded By:** `KDS/prompts/user/execute.md`  
**Uses:** `#shared-module:session-loader.md`, `#shared-module:execution-tracer.md`, `#file:KDS/prompts/internal/context-brain.md`

---

## 🎯 Core Responsibility

Execute the **next task** in the active session using **test-first** workflow.

---

## 📥 Input Contract

### From User (via execute.md)
```json
{
  "session_id": "string (optional - loads from current-session.json if absent)",
  "task_override": "string (optional - execute specific task instead of next)"
}
```

### Session State
```json
// KDS/sessions/current-session.json
{
  "session_id": "20251102-export-pdf",
  "status": "in_progress",
  "current_phase": 1,
  "current_task": "1.2",
  "phases": [
    {
      "phase_number": 1,
      "tasks": [
        {
          "task_id": "1.1",
          "status": "completed"
        },
        {
          "task_id": "1.2",
          "status": "in_progress"
        }
      ]
    }
  ]
}
```

---

## 📤 Output Contract

### Task Completion
```json
{
  "task_id": "string",
  "status": "completed",
  "changes": {
    "files_created": ["array"],
    "files_modified": ["array"],
    "tests_created": ["array"],
    "tests_passed": "boolean"
  },
  "next_task": "string or null"
}
```

### Example Output
```json
{
  "task_id": "1.2",
  "status": "completed",
  "changes": {
    "files_created": ["SPA/NoorCanvas/Services/PdfService.cs"],
    "files_modified": [],
    "tests_created": ["Tests/Unit/Services/PdfServiceTests.cs"],
    "tests_passed": true
  },
  "next_task": "1.3"
}
```

---

## 🔄 Test-First Workflow

### Mandatory Sequence
```
1. Load task details from session
      │
      ▼
2. Load #file:KDS/prompts/shared/test-first.md
      │
      ▼
3. Create failing test FIRST
      │
      ▼
4. Verify test fails (RED)
      │
      ▼
5. Implement code to pass test
      │
      ▼
6. Verify test passes (GREEN)
      │
      ▼
7. Update session state
      │
      ▼
8. Return next task
```

### Example Execution
```markdown
Task 1.2: Implement PdfService

Step 1: Load Test-First
  #file:KDS/prompts/shared/test-first.md

Step 2: Create Failing Test
  #create_file Tests/Unit/Services/PdfServiceTests.cs
  
  [TestMethod]
  public void ExportToPdf_WithValidTranscript_ReturnsPdfBytes()
  {
      // Arrange
      var pdfService = new PdfService();
      var transcript = new Transcript { /* ... */ };
      
      // Act
      var result = pdfService.ExportToPdf(transcript);
      
      // Assert
      Assert.IsNotNull(result);
      Assert.IsTrue(result.Length > 0);
  }

Step 3: Run Test (expect RED)
  #run_in_terminal
  dotnet test --filter "ExportToPdf_WithValidTranscript"
  
  ❌ FAILED: PdfService does not exist

Step 4: Implement Code
  #create_file SPA/NoorCanvas/Services/PdfService.cs
  
  public class PdfService : IPdfService
  {
      public byte[] ExportToPdf(Transcript transcript)
      {
          // Implementation using QuestPDF
          return GeneratePdf(transcript);
      }
  }

Step 5: Run Test (expect GREEN)
  #run_in_terminal
  dotnet test --filter "ExportToPdf_WithValidTranscript"
  
  ✅ PASSED: All tests passed

Step 6: Update Session
  #replace_string_in_file KDS/sessions/current-session.json
  "task_id": "1.2",
  "status": "in_progress"
  →
  "task_id": "1.2",
  "status": "completed"

Step 7: Return Next
  ✅ Task 1.2 complete
  Next: Task 1.3 (Add ExportPdf API endpoint)
```

---

## 🧠 Decision Trees

### Task Identification
```
User runs execute.md
      │
      ▼
Load current-session.json
      │
      ├─ No session? → ERROR: No active session
      │
      ├─ User specified task_override?
      │   └─ Yes → Execute that task
      │
      └─ No override?
          └─ Execute next "not_started" task
```

### Test Strategy Selection
```
Task: "Add Export button"
      │
      ▼
Check file type
      │
      ├─ .razor → UI test (Playwright)
      ├─ .cs → Unit test (MSTest)
      ├─ .js → Integration test (Jest or Playwright)
      └─ API → Integration test (MSTest + WebApplicationFactory)
      │
      ▼
Check for visual changes
      │
      ├─ Yes → Add Percy snapshot
      └─ No → Standard functional test
```

### Code Implementation
```
Test fails
      │
      ▼
Analyze failure
      │
      ├─ Missing file? → Create file
      ├─ Missing method? → Add method
      ├─ Wrong logic? → Fix implementation
      └─ Missing dependency? → Add dependency (validate Rule #18)
      │
      ▼
Implement minimal code to pass test
      │
      ▼
Re-run test
      │
      ├─ Still fails? → Debug and retry
      └─ Passes? → DONE
```

---

## 📚 Context Loading

### ⚡ STEP 1: Activate Contextual Intelligence (NEW - Week 4)

**BEFORE executing task, invoke Context Brain:**

```markdown
#file:KDS/prompts/internal/context-brain.md
user_request: "{current task description}"
agent_type: "executor"
current_files: ["{files from task}"]
```

**Context Brain will provide:**
- ⚠️ **File Confusion Warnings** (e.g., HostControlPanel vs HostControlPanelContent)
- 🔗 **Related Files** (commonly modified together)
- 💡 **Pattern Suggestions** (reuse existing patterns)
- 🎨 **Test ID Patterns** (follow naming conventions)
- 🔍 **API/Database Context** (related endpoints/tables)

**Critical: Use warnings to PREVENT mistakes:**
```yaml
Example Warning:
  "⚠️ FAB buttons are in HostControlPanelContent.razor, not HostControlPanel.razor"
  
Action:
  - VERIFY file choice before modifying
  - If warning is relevant, switch to suggested file
  - Confirm with user if uncertain
```

---

### STEP 2: Load Required Files

```markdown
#shared-module:session-loader.md (session state - DIP compliant)
#file:KDS/prompts/shared/test-first.md (TDD workflow)
#file:KDS/governance/rules.md (validation rules)
```

---

### STEP 3: Task-Specific Loading (As Needed)

```markdown
IF task involves UI:
  #file:KDS/prompts/internal/test-generator.md (visual tests)
  #semantic_search "Percy visual testing"

IF task involves API:
  #grep_search "WebApplicationFactory" (integration test patterns)

IF task involves database:
  #grep_search "DbContext" (EF Core patterns)
```

---

## ✅ Validation Checklist

Before marking task complete:

### Test Coverage
- [ ] Test created BEFORE implementation
- [ ] Test initially failed (RED)
- [ ] Test now passes (GREEN)
- [ ] Test covers acceptance criteria
- [ ] No skipped tests

### Code Quality
- [ ] Follows naming conventions (Rule #2)
- [ ] No hardcoded values (use config)
- [ ] Error handling present
- [ ] Logging added (Rule #6)
- [ ] Comments for complex logic

### Rule Compliance
- [ ] Rule #8 (Test-First) followed
- [ ] Rule #15 (UI Identifiers) if applicable
- [ ] Rule #18 (Dependencies) validated
- [ ] No new violations introduced

### Session State
- [ ] Task status updated to "completed"
- [ ] current_task advanced
- [ ] current_phase updated if phase complete
- [ ] Session saved

### Automatic Post-Implementation Review (NEW v5.2)
```markdown
After task completion, AUTOMATICALLY invoke:
#file:KDS/prompts/internal/post-implementation-reviewer.md

This runs silently in background to:
- ✅ Check TDD compliance
- ✅ Verify error handling
- ✅ Validate logging patterns
- ✅ Confirm architectural alignment
- ✅ Auto-fix safe violations
- ⚠️ Flag critical issues (if any)

Review runs in < 2 seconds for simple changes.
User notified ONLY if critical violations found.
```

**Invocation Point:**
```
Task implementation completed
    ↓
Run tests (verify GREEN)
    ↓
Update session state
    ↓
>>> INVOKE post-implementation-reviewer.md (AUTOMATIC) <<<
    ↓
IF reviewer.status == "CRITICAL_VIOLATIONS":
    HALT and display violations
ELSE:
    Continue to handoff generation
```

---

## 🔍 Progress Tracking

### After Each Task
```markdown
✅ Task 1.2 completed

Progress:
  Phase 1: Backend API
    ✅ 1.1 Create IPdfService interface
    ✅ 1.2 Implement PdfService
    ⬜ 1.3 Add ExportPdf endpoint
  
  Phase 2: UI Integration (0/3)
  Phase 3: Feature Flag (0/2)

Overall: 2/8 tasks (25%)

Next: Task 1.3 (Add ExportPdf API endpoint)
```

### Phase Completion
```markdown
✅ Phase 1 complete!

Summary:
  ✅ 1.1 IPdfService interface
  ✅ 1.2 PdfService implementation
  ✅ 1.3 ExportPdf endpoint
  
Tests:
  ✅ All unit tests passing (3/3)
  ✅ All integration tests passing (1/1)
  
Next: Phase 2 (UI Integration)
```

### Session Completion
```markdown
🎉 SESSION COMPLETE!

Feature: Export to PDF
Tasks: 8/8 (100%)
Phases: 3/3 (100%)

Tests Created:
  ✅ Unit: 5
  ✅ Integration: 2
  ✅ UI: 3
  ✅ Visual: 2

Files Created:
  - SPA/NoorCanvas/Services/PdfService.cs
  - SPA/NoorCanvas/Controllers/TranscriptController.cs
  - Tests/Unit/Services/PdfServiceTests.cs
  - Tests/UI/transcript-canvas-pdf-export.spec.ts

Next: 
  #file:KDS/prompts/user/validate.md (health check)
  #file:KDS/prompts/shared/publish.md (publish patterns)
```

---

## 🚨 Error Handling

### Test Fails to Pass
```markdown
❌ Test still failing after implementation

Test: ExportToPdf_WithValidTranscript_ReturnsPdfBytes
Error: Expected byte array, got null

Action:
  1. Analyze failure message
  2. Check implementation logic
  3. Verify test expectations correct
  4. Debug: print values, check nulls
  5. Re-implement and retry
  
If 3+ failures:
  #file:KDS/prompts/user/correct.md
  (escalate to correction workflow)
```

### Missing Dependency
```markdown
❌ Required dependency not found

Error: Package 'QuestPDF' not found

Action:
  1. Check Rule #18 (allowed dependencies)
  2. If allowed:
     dotnet add package QuestPDF
  3. If not allowed:
     Suggest alternative
  4. Update task notes with decision
```

### Session State Corruption
```markdown
❌ Session state invalid

Error: current_task "1.5" not found in phases

Action:
  1. Load #file:KDS/prompts/shared/validation.md
  2. Attempt auto-repair:
     - Find last completed task
     - Advance to next not_started
  3. If cannot repair:
     Ask user to clarify state
```

---

## 🔄 Handoff Protocol

### Load Shared Modules
```markdown
#file:KDS/prompts/shared/test-first.md (TDD workflow)
#file:KDS/prompts/shared/handoff.md (handoff protocol)
#file:KDS/prompts/shared/validation.md (validation helpers)
```

### Update Session
```json
// Before
{
  "task_id": "1.2",
  "status": "in_progress"
}

// After
{
  "task_id": "1.2",
  "status": "completed",
  "completed_at": "2025-11-02T10:45:00Z"
},
{
  "task_id": "1.3",
  "status": "not_started"
}
```

### Return to User
```markdown
✅ Task 1.2 complete

Changes:
  Created: SPA/NoorCanvas/Services/PdfService.cs
  Created: Tests/Unit/Services/PdfServiceTests.cs
  
Tests: ✅ All passing

Next: #file:KDS/prompts/user/execute.md (continue)
```

---

## 🎯 Success Criteria

**Task execution successful when:**
- ✅ Test created before implementation
- ✅ Test initially failed (RED)
- ✅ Implementation makes test pass (GREEN)
- ✅ All applicable rules followed
- ✅ Session state updated correctly
- ✅ Next task identified

---

## 🧪 Example Scenarios

### Unit Test Task
```markdown
Task: "Implement PdfService"

Workflow:
  1. Create PdfServiceTests.cs (FIRST)
  2. Run test → ❌ FAILS (no PdfService)
  3. Create PdfService.cs
  4. Run test → ✅ PASSES
  5. Update session
```

### UI Task with Visual Test
```markdown
Task: "Add Export button"

Workflow:
  1. Create transcript-canvas-pdf-export.spec.ts (FIRST)
  2. Add Percy snapshot expectation
  3. Run test → ❌ FAILS (no button)
  4. Add button to TranscriptCanvas.razor
  5. Run test → ✅ PASSES
  6. Percy → ✅ No regressions
  7. Update session
```

### API Integration Task
```markdown
Task: "Add ExportPdf endpoint"

Workflow:
  1. Create TranscriptControllerTests.cs (FIRST)
  2. Setup WebApplicationFactory
  3. Run test → ❌ FAILS (no endpoint)
  4. Add endpoint to TranscriptController.cs
  5. Run test → ✅ PASSES
  6. Update session
```

---

**Code Executor ensures test-first execution!** ⚙️
