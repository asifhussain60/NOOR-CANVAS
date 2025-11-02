# plan.prompt.md - Commands & Scripts Reference

This file contains all PowerShell commands and bash examples extracted from `plan.prompt.md` for Rule #1 compliance (no code blocks in user-facing sections).

**JSON schemas preserved inline** (data structure exception per KDS Review Handoff JSON).

---

## Command 1: State Tracking Initialization (PowerShell)

**Source:** Step -1: INITIALIZE STATE TRACKING

**Purpose:** Load state-tracker utility and log incoming request

```powershell
# Source the state-tracker utility
. .github/prompts/shared/state-tracker.ps1

# Log the incoming request (if this is an original request routed from route.prompt)
# OR log as a refinement request if this is a follow-up
Update-StateRequest -Key $key -Type "refinement" -UserRequest $user_request -PromptChain @("route", "plan")
```

**Usage Context:**
- Execute FIRST before any planning activity
- `Type "original"` if invoked directly without route
- `Type "refinement"` if routed from route.prompt

**References:**
- State Tracker: `.github/prompts/shared/state-tracker.ps1`

---

## Command 2: Handoffs Directory Setup (PowerShell)

**Source:** Step 4.25: GENERATE HANDOFF JSON FILES

**Purpose:** Create handoffs directory for JSON parameter files

```powershell
# Create handoffs directory
$keyPath = ".github/key-data-streams/{key}"
New-Item -ItemType Directory -Path "$keyPath/handoffs" -Force
```

**Usage Context:**
- Run before generating handoff JSON files
- Creates nested directory structure automatically
- Idempotent (safe to run multiple times)

---

## Command 3: Handoff JSON Generation Loop (PowerShell)

**Source:** Step 4.25: GENERATE HANDOFF JSON FILES

**Purpose:** Generate and save handoff JSON files for all phases

```powershell
# Generate and save each handoff JSON
foreach ($phase in $phases) {
  # Test handoff
  $testHandoff = Generate-TestHandoff -Phase $phase -Key $key
  Save-Json -Path "$keyPath/handoffs/phase-$($phase.id)-test.json" -Content $testHandoff
  
  # Todo handoffs (one per implementation task)
  foreach ($task in $phase.tasks) {
    $todoHandoff = Generate-TodoHandoff -Phase $phase -Task $task -Key $key
    Save-Json -Path "$keyPath/handoffs/phase-$($phase.id)-todo-$($task.id).json" -Content $todoHandoff
  }
}
```

**Usage Context:**
- Execute after plan generation (Step 4)
- Saves handoff files BEFORE user approval
- Creates traceable parameter chain for automated execution

**Output:**
- Test handoffs: `handoffs/phase-{N}-test.json`
- Todo handoffs: `handoffs/phase-{N}-todo-{task}.json`

---

## Command 4: State Handoff Logging Example (PowerShell)

**Source:** Step 6: HANDOFF PREPARATION

**Purpose:** Log handoff to state tracking (file-based)

```powershell
# Update state.json with handoff metadata
Update-StateHandoff -Key $key -From "plan" -To "test-generation" -HandoffFile "handoffs/phase-1-test.json"

# Append to promptHandoffs[] array in state.json
{
  "timestamp": "2025-10-30T...",
  "from": "plan",
  "to": "test-generation",
  "handoffFile": "handoffs/phase-1-test.json",
  "reason": "Plan approved, creating Phase 1 test"
}
```

**Usage Context:**
- Execute before invoking downstream agent
- Enables handoff chain reconstruction
- Required for state tracking validation

---
