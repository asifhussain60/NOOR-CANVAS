# KDS Shared Module: Handoff

**Purpose:** Standardized protocol for passing control between KDS agents with context preservation.

**Version:** 4.5  
**Loaded By:** All internal agents and user prompts

---

## 🎯 Core Responsibility

Ensure **seamless transitions** between agents with complete context transfer.

---

## 📋 Handoff Protocol

### 1. Intent Router → Specialist Agent

#### Handoff Structure
```json
{
  "from": "intent-router",
  "to": "work-planner | code-executor | test-generator | health-validator | change-governor",
  "intent": "PLAN | EXECUTE | TEST | VALIDATE | GOVERN | ...",
  "context": {
    "user_request": "string (original request)",
    "extracted_entities": {
      "feature": "string",
      "files": ["array"],
      "test_type": "visual | unit | integration | e2e",
      "scope": "full | build | tests | ..."
    },
    "session_state": "object (current session if exists)",
    "loaded_files": ["array of #file: paths already loaded"]
  },
  "instructions": {
    "priority": "high | normal | low",
    "fail_fast": "boolean",
    "detailed": "boolean"
  }
}
```

#### Example: Router → Planner
```markdown
From: intent-router.md
To: work-planner.md

Intent: PLAN

Context:
  User Request: "Add export to PDF functionality"
  
  Extracted Entities:
    Feature: "PDF export"
    Files: [
      "SPA/NoorCanvas/Pages/Transcripts/TranscriptCanvas.razor",
      "SPA/NoorCanvas/wwwroot/js/canvas-operations.js"
    ]
  
  Session State: null (no active session)
  
  Loaded Files:
    - .github/governance/rules.md
    - .github/KDS-DESIGN.md

Instructions:
  Priority: normal
  Fail Fast: false
  Detailed: true
```

---

### 2. Specialist Agent → User

#### Return Structure
```json
{
  "from": "work-planner | code-executor | test-generator | health-validator | change-governor",
  "to": "user",
  "status": "success | partial | failure",
  "result": {
    "summary": "string (brief overview)",
    "details": "string (comprehensive info)",
    "artifacts": ["array of created/modified files"]
  },
  "next_action": {
    "prompt": "#file: path to next prompt",
    "description": "string (what user should do next)"
  },
  "state_changes": {
    "session_updated": "boolean",
    "files_modified": ["array"],
    "tests_created": ["array"]
  }
}
```

#### Example: Planner → User
```markdown
From: work-planner.md
To: user

Status: success

Result:
  Summary: "Created 3-phase plan with 8 tasks for PDF export"
  
  Details:
    Session ID: 20251102-export-pdf
    Phases:
      - Phase 1: Backend API (3 tasks)
      - Phase 2: UI Integration (3 tasks)
      - Phase 3: Feature Flag (2 tasks)
  
  Artifacts:
    - .github/sessions/current-session.json

Next Action:
  Prompt: #file:.github/prompts/user/execute.md
  Description: "Start working on Phase 1, Task 1.1"

State Changes:
  Session Updated: true
  Files Modified: [".github/sessions/current-session.json"]
  Tests Created: []
```

---

### 3. Code Executor → Test Generator

#### Handoff Structure
```json
{
  "from": "code-executor",
  "to": "test-generator",
  "trigger": "task_requires_test",
  "context": {
    "task": "object (current task details)",
    "implementation_complete": "boolean",
    "test_type": "visual | unit | integration | e2e",
    "target": {
      "component": "string",
      "files": ["array"]
    }
  }
}
```

#### Example: Executor → Test Generator
```markdown
From: code-executor.md
To: test-generator.md

Trigger: task_requires_test

Context:
  Task:
    ID: 2.1
    Description: "Add Export to PDF button"
    Files: ["SPA/NoorCanvas/Pages/Transcripts/TranscriptCanvas.razor"]
  
  Implementation Complete: false (test-first: create test FIRST)
  
  Test Type: visual (UI component)
  
  Target:
    Component: TranscriptCanvas
    Files: ["SPA/NoorCanvas/Pages/Transcripts/TranscriptCanvas.razor"]
```

---

### 4. Test Generator → Code Executor

#### Return Structure
```json
{
  "from": "test-generator",
  "to": "code-executor",
  "status": "test_created",
  "result": {
    "test_file": "string (path)",
    "test_status": "failing (RED)",
    "test_framework": "Playwright | MSTest | Jest"
  },
  "next_step": "implement_code_to_pass_test"
}
```

#### Example: Test Generator → Executor
```markdown
From: test-generator.md
To: code-executor.md

Status: test_created

Result:
  Test File: "Tests/UI/transcript-canvas-pdf-export.spec.ts"
  Test Status: failing (RED) ❌
  Test Framework: Playwright + Percy

Next Step: implement_code_to_pass_test
  
  Action: Add Export to PDF button to TranscriptCanvas.razor
```

---

### 5. Health Validator → User (Critical Status)

#### Alert Structure
```json
{
  "from": "health-validator",
  "to": "user",
  "status": "CRITICAL",
  "alert": {
    "severity": "critical",
    "message": "Build failed - DO NOT PROCEED",
    "failures": ["array of critical issues"]
  },
  "next_action": {
    "prompt": "#file:.github/prompts/user/correct.md",
    "description": "Fix critical issues before continuing"
  }
}
```

#### Example: Validator → User (CRITICAL)
```markdown
From: health-validator.md
To: user

Status: CRITICAL

Alert:
  Severity: critical
  Message: "Build failed - DO NOT PROCEED"
  
  Failures:
    - Build: ❌ 2 errors (TranscriptController.cs)
    - Tests: ❌ 5/42 failed
    - Git: ⚠️ Merge conflicts

Next Action:
  Prompt: #file:.github/prompts/user/correct.md
  Description: "Fix build errors and resolve merge conflicts"

🛑 STOP: Do not execute or validate until issues resolved
```

---

## 🔄 Session State Handoff

### Save Session Before Handoff
```typescript
async function prepareHandoff(fromAgent: string, toAgent: string, sessionState: any) {
    // Update session metadata
    sessionState.last_agent = fromAgent;
    sessionState.next_agent = toAgent;
    sessionState.updated_at = new Date().toISOString();
    
    // Save to disk
    await saveSession(sessionState);
    
    return sessionState;
}
```

### Load Session After Handoff
```typescript
async function receiveHandoff(fromAgent: string) {
    // Load session
    const sessionState = await loadSession();
    
    // Verify handoff
    if (sessionState.last_agent !== fromAgent) {
        console.warn(`Expected handoff from ${fromAgent}, got ${sessionState.last_agent}`);
    }
    
    return sessionState;
}
```

---

## 🧠 Context Preservation

### What to Include in Handoff

#### Always Include
```markdown
✅ Original user request
✅ Current session state
✅ Files already loaded (#file: paths)
✅ Applicable rules
✅ Previous agent's output
```

#### Conditionally Include
```markdown
IF handing off to test-generator:
  ✅ Implementation details
  ✅ Test type required
  ✅ Target component/files

IF handing off to health-validator:
  ✅ Expected health level
  ✅ Validation scope

IF handing off to change-governor:
  ✅ Files modified
  ✅ Change rationale
```

---

## 🚨 Error Handling in Handoffs

### Failed Handoff
```typescript
function handleFailedHandoff(error: any) {
    return {
        status: 'handoff_failed',
        error: {
            code: 'HANDOFF_001',
            message: 'Failed to transfer control to next agent',
            details: error,
            recovery: 'Retry handoff or escalate to user'
        }
    };
}
```

### Incomplete Context
```typescript
function validateHandoffContext(context: any): ValidationResult {
    const required = ['user_request', 'session_state', 'loaded_files'];
    const missing = required.filter(field => !context[field]);
    
    if (missing.length > 0) {
        return {
            valid: false,
            errors: missing.map(f => `Missing required context: ${f}`)
        };
    }
    
    return { valid: true, errors: [] };
}
```

---

## 📊 Handoff Chain Examples

### PLAN → EXECUTE → TEST → EXECUTE → VALIDATE

#### Chain Flow
```
User: "Add PDF export"
    │
    ▼
kds.md → intent-router.md
    │
    ▼ [PLAN intent detected]
work-planner.md
    │ [Creates session with 8 tasks]
    ▼
User: "Continue"
    │
    ▼
execute.md → code-executor.md
    │ [Task 1.1: Create test]
    ▼
test-generator.md
    │ [Creates failing test]
    ▼
code-executor.md
    │ [Implements code, test passes]
    ▼
User: "Validate"
    │
    ▼
validate.md → health-validator.md
    │ [Runs health checks]
    ▼
User (report: ✅ HEALTHY)
```

---

### EXECUTE → CORRECT → EXECUTE

#### Error Recovery Chain
```
execute.md → code-executor.md
    │ [Test fails after 3 attempts]
    ▼
User: "Fix this"
    │
    ▼
kds.md → intent-router.md
    │ [CORRECT intent detected - highest priority]
    ▼
code-executor.md (correction mode)
    │ [Analyzes error, fixes implementation]
    ▼
test-generator.md (re-run test)
    │ [Test now passes ✅]
    ▼
User (report: Task complete)
```

---

## 🎯 Handoff Best Practices

### 1. Always Save State
```markdown
Before handing off:
  ✅ Save session state
  ✅ Update metadata
  ✅ Commit if necessary
```

### 2. Include Complete Context
```markdown
Don't assume next agent has context:
  ✅ Pass original user request
  ✅ Pass loaded files
  ✅ Pass intermediate results
```

### 3. Specify Next Action Clearly
```markdown
User should know what to do:
  ✅ Specific prompt to use
  ✅ Description of next step
  ✅ Why this step is next
```

### 4. Handle Failures Gracefully
```markdown
If handoff fails:
  ✅ Log error with details
  ✅ Suggest recovery action
  ✅ Don't lose user's progress
```

---

## 📝 Handoff Templates

### Template: Planner → User
```markdown
✅ PLAN CREATED

Session: {session_id}
Phases: {phase_count}
Tasks: {task_count}

Next: #file:.github/prompts/user/execute.md
  Start with Phase {current_phase}, Task {current_task}
```

### Template: Executor → User
```markdown
✅ TASK {task_id} COMPLETE

Changes:
  Created: {files_created}
  Modified: {files_modified}
  
Tests: {test_status}

Next: #file:.github/prompts/user/execute.md (continue)
  OR
Next: #file:.github/prompts/user/validate.md (health check)
```

### Template: Validator → User (Healthy)
```markdown
✅ HEALTH CHECK COMPLETE

Status: HEALTHY

Summary:
  ✅ Build: Success
  ✅ Tests: All passed
  ✅ Quality: No issues
  ✅ Git: Clean

Next: Continue development with confidence
```

### Template: Governor → User (Rejected)
```markdown
❌ KDS CHANGE REJECTED

Issues:
  {issues}

Recommendations:
  {recommendations}

Next: Fix issues and re-submit to govern.md
  OR
Next: Override (provide rationale)
```

---

## 🧪 Testing Handoffs

### Handoff Validation Test
```typescript
function testHandoff() {
    // 1. Prepare context
    const context = {
        user_request: "Add PDF export",
        session_state: { /* ... */ },
        loaded_files: []
    };
    
    // 2. Validate context complete
    const validation = validateHandoffContext(context);
    assert(validation.valid);
    
    // 3. Execute handoff
    const result = prepareHandoff('intent-router', 'work-planner', context.session_state);
    
    // 4. Verify state saved
    const loaded = receiveHandoff('intent-router');
    assert(loaded.last_agent === 'intent-router');
    assert(loaded.next_agent === 'work-planner');
}
```

---

**Handoff protocol ensures seamless agent transitions!** 🔄
