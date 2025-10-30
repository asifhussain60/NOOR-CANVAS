# State Manager (File-Based State Tracking)

**Purpose:** Replace PowerShell state-tracker.ps1 with file-based tracking that Copilot can execute

**Version:** 1.0.0  
**Created:** 2025-10-29  
**Replaces:** `.github/prompts/shared/state-tracker.ps1` (PowerShell - cannot execute in Copilot)

---

## Problem Statement

The original `state-tracker.ps1` uses PowerShell functions (`Update-StateRequest`, `Update-StateHandoff`, etc.) that **cannot execute in Copilot's context**. While all prompts reference these functions, they remain non-functional, resulting in:

- Zero `state.json` files created in `.github/key-data-streams/`
- No request/handoff/commit tracking
- Lost timeline reconstruction capability

---

## Solution: File-Based State Tracking

Replace PowerShell function calls with **direct file creation instructions** using Copilot's `create_file` tool.

---

## State.json Structure

```json
{
  "key": "feature-name",
  "version": "2.0",
  "status": "in-progress",
  "created": "2025-10-29T10:30:00Z",
  "lastUpdated": "2025-10-29T11:45:00Z",
  "requests": [
    {
      "timestamp": "2025-10-29T10:30:00Z",
      "type": "original",
      "userRequest": "Add share button to Host Control Panel",
      "promptChain": ["route", "plan"],
      "commits": [],
      "outcome": "in-progress"
    }
  ],
  "commits": [
    {
      "timestamp": "2025-10-29T11:00:00Z",
      "sha": "abc123def",
      "message": "ckpt(feature-name): Implemented share button",
      "phase": 1,
      "filesModified": ["HostControlPanel.razor", "host-control-panel.css"]
    }
  ],
  "phases": [
    {
      "id": 1,
      "title": "Add FAB Button UI",
      "status": "complete",
      "checkpoint": "abc123def",
      "duration": "PT15M"
    }
  ],
  "filesModified": ["HostControlPanel.razor", "host-control-panel.css"],
  "promptHandoffs": [
    {
      "timestamp": "2025-10-29T10:45:00Z",
      "from": "plan",
      "to": "task",
      "parameters": {"key": "feature-name", "phase": 1},
      "reason": "Plan approved, beginning Phase 1 execution"
    }
  ],
  "totalPhases": 3,
  "completedPhases": 1,
  "currentPhase": 2,
  "branch": "development",
  "driftKeys": [],
  "tags": {},
  "estimatedTotalDuration": "PT45M",
  "userDecisions": {
    "Q1": "A - Use existing API",
    "Q2": "B - Add new component"
  }
}
```

---

## Usage in Prompts

### Step -1: Initialize State Tracking (ALL PROMPTS)

**OLD (PowerShell - Non-Functional):**
```powershell
. .github/prompts/shared/state-tracker.ps1
Update-StateRequest -Key $key -Type "original" -UserRequest $request -PromptChain @("route")
```

**NEW (File-Based - Functional):**
```markdown
## Step -1: Initialize State Tracking

**Create state.json if it doesn't exist:**

1. Check if `.github/key-data-streams/{key}/state.json` exists
2. If NOT exists, create it using `create_file` tool:

**Template:**
```json
{
  "key": "{key}",
  "version": "2.0",
  "status": "in-progress",
  "created": "{ISO8601_timestamp}",
  "lastUpdated": "{ISO8601_timestamp}",
  "requests": [
    {
      "timestamp": "{ISO8601_timestamp}",
      "type": "original|refinement|continuation|test-generation",
      "userRequest": "{user_request_text}",
      "promptChain": ["route", "plan"],
      "commits": [],
      "outcome": "in-progress"
    }
  ],
  "commits": [],
  "phases": [],
  "filesModified": [],
  "promptHandoffs": [],
  "totalPhases": 0,
  "completedPhases": 0,
  "currentPhase": null,
  "branch": "{git_branch}",
  "driftKeys": [],
  "tags": {},
  "estimatedTotalDuration": null,
  "userDecisions": null
}
```

3. If EXISTS, update `requests[]` array by:
   - Reading existing state.json
   - Appending new request object
   - Writing updated JSON back to file
```

---

## Function Equivalents

### Update-StateRequest → Append to requests[]

**Purpose:** Log user request with timestamp and prompt chain

**Implementation:**
1. Read `.github/key-data-streams/{key}/state.json`
2. Parse JSON
3. Append to `requests[]` array:
   ```json
   {
     "timestamp": "2025-10-29T11:00:00Z",
     "type": "refinement",
     "userRequest": "Add hover animation to button",
     "promptChain": ["route", "todo"],
     "commits": [],
     "outcome": "in-progress"
   }
   ```
4. Update `lastUpdated` field
5. Write JSON back using `replace_string_in_file`

---

### Update-StateHandoff → Append to promptHandoffs[]

**Purpose:** Log prompt-to-prompt handoffs

**Implementation:**
1. Read state.json
2. Append to `promptHandoffs[]`:
   ```json
   {
     "timestamp": "2025-10-29T11:15:00Z",
     "from": "plan",
     "to": "task",
     "parameters": {"key": "feature-name", "phase": 1},
     "reason": "Plan approved, beginning Phase 1"
   }
   ```
3. Write back

---

### Update-StateCommit → Append to commits[]

**Purpose:** Log git commits with phase association

**Implementation:**
1. Read state.json
2. Append to `commits[]`:
   ```json
   {
     "timestamp": "2025-10-29T11:30:00Z",
     "sha": "abc123def",
     "message": "ckpt(feature-name): Phase 1 complete",
     "phase": 1,
     "filesModified": ["File1.cs", "File2.razor"]
   }
   ```
3. Update `phases[].checkpoint` if phase commit
4. Write back

---

### Update-StateDriftKey → Append to driftKeys[]

**Purpose:** Track drift keys spawned from parent key

**Implementation:**
1. Read state.json
2. Append to `driftKeys[]`:
   ```json
   {
     "driftKey": "feature-name-drift-1",
     "severity": "medium",
     "description": "Fix unrelated bug in validation",
     "status": "resolved",
     "createdAt": "2025-10-29T11:45:00Z"
   }
   ```
3. Write back

---

## Integration Points

### plan.prompt.md Step -1
```markdown
Create `.github/key-data-streams/{key}/state.json` with initial request
Type: "original" or "refinement" (if routed from route.prompt)
```

### route.prompt.md Step -2
```markdown
Create state.json before routing
Type: "original"
Log handoff to target agent in promptHandoffs[]
```

### task.prompt.md Step -1
```markdown
Update requests[] with execution request
Type: "execution"
Log commits after each phase in commits[]
```

### todo.prompt.md Step -1
```markdown
Update requests[] with continuation request
Type: "continuation"
Append to existing key's state.json
```

### test-generation.prompt.md Step -1
```markdown
Update requests[] with test generation request
Type: "test-generation"
```

### drift.prompt.md
```markdown
Create new drift key state.json
Update parent key's driftKeys[] array
```

---

## Validation

**After Step -1 execution, verify:**
1. `.github/key-data-streams/{key}/state.json` exists
2. `requests[]` array contains current request
3. `lastUpdated` timestamp is current
4. `branch` field matches git branch

**If validation fails:**
- HALT execution
- Log error: "State tracking initialization failed"
- Request manual state.json creation

---

## See Also

- `.github/prompts/plan.prompt.md` - Step -1 implementation
- `.github/prompts/route.prompt.md` - Step -2 implementation
- `.github/prompts/task.prompt.md` - Commit tracking
- `.github/prompts/loop-prevention.md` - State tracking for cycle detection
