# Prompt State Tracking Guide

**Last Updated:** 2025-10-28  
**Version:** 1.0.0

## Overview

All prompt agents now integrate with the **state-tracker.ps1** utility to automatically log execution requests, handoffs, and commits to `state.json` files within key data streams. This enables:

- **Timeline Reconstruction**: View complete workflow history via `plist -timeline -k {key}`
- **Cross-Prompt Coordination**: Track handoffs between route → plan → task → test-generation
- **Commit Tracking**: Automatically log all checkpoint commits with phase association
- **Drift Management**: Track unrelated issues discovered during work
- **Audit Trail**: Complete history of who requested what, when, and how it was executed

## Quick Start

### For Prompt Developers

All prompts with `stateTracking: enabled` should follow this pattern:

**Step -1: Initialize State Tracking (EXECUTE FIRST)**
```powershell
# Source the state-tracker utility
. .github/prompts/shared/state-tracker.ps1

# Log the incoming request
Update-StateRequest -Key $key -Type "original" -UserRequest $request -PromptChain @("route", "plan")
```

**Before Handoff:**
```powershell
Update-StateHandoff -Key $key -From "plan" -To "task" -Parameters @{ key = $key; phase = 1 } -Reason "Plan approved, beginning execution"
```

**After Checkpoint Commit:**
```powershell
Update-StateCommit -Key $key -Sha (git rev-parse --short HEAD) -Message "ckpt({key}): Phase {N} - {summary}" -Phase $phase -CheckpointType "intermediate"
```

### For Users

View state tracking data using `plist.ps1` commands:

```powershell
# View all requests for a key
plist -requests -k my-feature

# View all commits for a key
plist -commits -k my-feature

# View complete timeline (requests + handoffs + commits)
plist -timeline -k my-feature

# View comprehensive key information
plist -lookup -k my-feature
```

## State Tracker Functions

### Update-StateRequest

Logs user requests to track original and follow-up work.

**Parameters:**
- `Key` - The key identifier (kebab-case)
- `Type` - Request type: `original`, `refinement`, `continuation`, `execution`, `question`, `test-generation`
- `UserRequest` - The actual user request text
- `PromptChain` - Array of prompts involved (e.g., `@("route", "plan")`)
- `Commits` - (Optional) Array of commit SHAs associated with this request
- `Outcome` - (Optional) Request outcome: `in-progress`, `completed`, `blocked`, `cancelled`

**Example:**
```powershell
Update-StateRequest -Key 'my-feature' -Type 'original' -UserRequest 'Add share button to canvas' -PromptChain @('route', 'plan', 'task')
```

**Request Types:**
- `original` - First request from user (typically via route.prompt.md)
- `refinement` - Plan refinement or adjustment (plan.prompt.md)
- `continuation` - Extending existing work (todo.prompt.md)
- `execution` - Task execution request (task.prompt.md)
- `question` - Investigation or question (ask.prompt.md)
- `test-generation` - Test creation request (test-generation.prompt.md)

### Update-StateHandoff

Logs prompt-to-prompt transitions for workflow tracking.

**Parameters:**
- `Key` - The key identifier
- `From` - Source prompt name (e.g., "route", "plan", "task")
- `To` - Target prompt name
- `Parameters` - Hashtable of parameters passed to target prompt
- `Reason` - (Optional) Reason for handoff

**Example:**
```powershell
Update-StateHandoff -Key 'my-feature' -From 'plan' -To 'task' -Parameters @{ key = 'my-feature'; phase = 1; auto_chain = 'true' } -Reason 'Plan approved, starting Phase 1 execution'
```

### Update-StateCommit

Logs git commits for checkpoint tracking and rollback capability.

**Parameters:**
- `Key` - The key identifier
- `Sha` - Git commit SHA (short or long)
- `Message` - Commit message
- `Phase` - (Optional) Phase number associated with commit
- `CheckpointType` - (Optional) Type of checkpoint: `pre-task`, `intermediate`, `completion`, `drift-resolution`, `test-generation`
- `FilesChanged` - (Optional) Array of file paths modified in commit

**Example:**
```powershell
Update-StateCommit -Key 'my-feature' -Sha (git rev-parse --short HEAD) -Message 'ckpt(my-feature): Phase 1 - UI components added' -Phase 1 -CheckpointType 'intermediate'
```

**Deduplication:** Automatically prevents duplicate commit entries (same SHA + key).

### Update-StateDriftKey

Tracks drift keys (unrelated issues discovered during work) in parent key's state.

**Parameters:**
- `ParentKey` - The original work key that spawned the drift
- `DriftKey` - The drift key identifier (typically prefixed with "drift-")
- `Severity` - Drift severity: `critical`, `high`, `medium`, `low`, `informational`
- `Description` - Brief description of the drift issue
- `Resolved` - (Optional) Boolean indicating if drift is resolved (default: `$false`)

**Example:**
```powershell
# When drift is detected
Update-StateDriftKey -ParentKey 'my-feature' -DriftKey 'drift-button-alignment' -Severity 'low' -Description 'Share button misaligned in mobile view'

# When drift is resolved
Update-StateDriftKey -ParentKey 'my-feature' -DriftKey 'drift-button-alignment' -Resolved $true
```

### Update-StatePhase

Updates phase status in multi-phase work plans.

**Parameters:**
- `Key` - The key identifier
- `PhaseNumber` - Phase number (1-based)
- `Status` - Phase status: `not-started`, `in-progress`, `completed`, `blocked`
- `StartedAt` - (Optional) DateTime when phase started
- `CompletedAt` - (Optional) DateTime when phase completed

**Example:**
```powershell
Update-StatePhase -Key 'my-feature' -PhaseNumber 2 -Status 'in-progress' -StartedAt (Get-Date)
```

**Note:** Phases must be defined in the plan JSON before they can be updated. This function is typically used by plan.prompt.md and task.prompt.md.

### Get-StateFile

Auto-discovers state.json file path for a key.

**Parameters:**
- `Key` - The key identifier

**Returns:** Absolute path to state.json file

**Example:**
```powershell
$stateFile = Get-StateFile -Key 'my-feature'
# Returns: D:\PROJECTS\NOOR CANVAS\.github\key-data-streams\my-feature\my-feature.state.json
```

**Search Locations (in order):**
1. `.github/key-data-streams/{key}/{key}.state.json`
2. `Workspaces/Copilot/KeyDataStreams/{key}/{key}.state.json`
3. `.copilot/keys/{key}/{key}.state.json`

**Auto-Creation:** If key directory exists but state.json doesn't, creates minimal state.json with key and initial metadata.

## Prompt Integration Patterns

### Route Prompt (route.prompt.md)

**Responsibility:** Log original user request and handoff to target agent

```powershell
# Step -2: Initialize State Tracking
. .github/prompts/shared/state-tracker.ps1
Update-StateRequest -Key $key -Type "original" -UserRequest $request -PromptChain @("route")

# Before handoff (after key determination)
Update-StateHandoff -Key $key -From "route" -To $targetAgent -Parameters @{ key = $key; auto_execute = $autoExecute } -Reason "Routing based on work classification"
```

### Plan Prompt (plan.prompt.md)

**Responsibility:** Log refinement requests and handoff to task agent

```powershell
# Step -1: Initialize State Tracking
. .github/prompts/shared/state-tracker.ps1
Update-StateRequest -Key $key -Type "refinement" -UserRequest $user_request -PromptChain @("route", "plan")

# Before handoff to task agent
Update-StateHandoff -Key $key -From "plan" -To "task" -Parameters @{ key = $key; phase = 1 } -Reason "Plan approved, beginning Phase 1 execution"
```

### Task Prompt (task.prompt.md)

**Responsibility:** Log execution requests and all checkpoint commits

```powershell
# Step -1: Initialize State Tracking
. .github/prompts/shared/state-tracker.ps1
Update-StateRequest -Key $key -Type "execution" -UserRequest $tasks -PromptChain @("route", "plan", "task")

# After each checkpoint commit
Update-StateCommit -Key $key -Sha (git rev-parse --short HEAD) -Message "ckpt({key}): Phase {N} - {summary}" -Phase $phase -CheckpointType "intermediate"
```

### Todo Prompt (todo.prompt.md)

**Responsibility:** Log continuation requests and commits

```powershell
# Step -1: Initialize State Tracking
. .github/prompts/shared/state-tracker.ps1
Update-StateRequest -Key $key -Type "continuation" -UserRequest $request -PromptChain @("route", "todo")

# After each phase commit
Update-StateCommit -Key $key -Sha (git rev-parse --short HEAD) -Message "ckpt({key}): Phase {N} - {summary}" -Phase $phase -CheckpointType "intermediate"
```

### Test-Generation Prompt (test-generation.prompt.md)

**Responsibility:** Log test generation requests and test commits

```powershell
# Step -1: Initialize State Tracking
. .github/prompts/shared/state-tracker.ps1
Update-StateRequest -Key $key -Type "test-generation" -UserRequest $scenario -PromptChain @("route", "test-generation")

# After test file commit
Update-StateCommit -Key $key -Sha (git rev-parse --short HEAD) -Message "test({key}): Generated {type} test for {scenario}" -CheckpointType "test-generation"
```

### Ask Prompt (ask.prompt.md)

**Responsibility:** Log questions and handoffs to actionable agents

```powershell
# Step -1: Initialize State Tracking
. .github/prompts/shared/state-tracker.ps1
Update-StateRequest -Key "ask-session" -Type "question" -UserRequest $question -PromptChain @("route", "ask")

# If user converts question to action
Update-StateHandoff -Key $targetKey -From "ask" -To $targetAgent -Parameters @{ question = $question } -Reason "Converting question to actionable work"
```

### Drift Prompt (drift.prompt.md)

**Responsibility:** Log drift detection and track in parent state.json

```powershell
# When drift is detected/created
Update-StateDriftKey -ParentKey $parent_key -DriftKey $drift_key -Severity $severity -Description $description

# After drift resolution
Update-StateDriftKey -ParentKey $parent_key -DriftKey $drift_key -Resolved $true
Update-StateCommit -Key $drift_key -Sha (git rev-parse --short HEAD) -Message "ckpt({drift-key}): Resolved - {summary}" -CheckpointType "drift-resolution"
```

## Viewing State Data

### Timeline View

Shows chronological sequence of requests, handoffs, and commits:

```powershell
plist -timeline -k my-feature
```

**Example Output:**
```
Timeline: my-feature

  [2025-10-28 09:15:23] Request    [original] Add share button to canvas
  [2025-10-28 09:15:45] Handoff    route → plan
  [2025-10-28 09:16:12] Handoff    plan → task
  [2025-10-28 09:17:34] Commit     a3b2c1d - ckpt(my-feature): Phase 1 - UI components
  [2025-10-28 09:19:47] Commit     e4f5g6h - ckpt(my-feature): Phase 2 - Event handlers
```

### Requests View

Shows all user requests for a key:

```powershell
plist -requests -k my-feature
```

**Example Output:**
```
Request History: my-feature

  1. [original] 2025-10-28 09:15:23
     Add share button to canvas with copy-to-clipboard functionality
     
  2. [refinement] 2025-10-28 14:23:11
     Also add share via email option
```

### Commits View

Shows all commits associated with a key:

```powershell
plist -commits -k my-feature
```

**Example Output:**
```
Commits: my-feature

  1. [2025-10-28] a3b2c1d [Phase 1]
     ckpt(my-feature): Phase 1 - UI components added
     
  2. [2025-10-28] e4f5g6h [Phase 2]
     ckpt(my-feature): Phase 2 - Event handlers implemented
```

### Lookup View

Shows comprehensive key information including state tracking data:

```powershell
plist -lookup -k my-feature
```

**Example Output:**
```
Key Lookup: my-feature

  Status: in-progress
  Created: 10/28/2025 9:15:23 AM
  Phases: 2/4
  Requests: 2
  Commits: 2
  Branch: feature/share-button
  Location: .\.github\key-data-streams\my-feature
```

## State.json Schema

All state.json files follow the schema defined in `.github/key-data-streams/_SCHEMA/state.schema.json`.

**Key Fields:**
- `key` - Kebab-case key identifier
- `status` - Work status: `planning`, `in-progress`, `completed`, `blocked`, `cancelled`
- `branch` - Associated git branch
- `requests[]` - Array of user requests
- `promptHandoffs[]` - Array of prompt-to-prompt transitions
- `commits[]` - Array of git commits
- `driftKeys[]` - Array of drift keys spawned from this work
- `phases[]` - Array of phase definitions and status
- `currentPhase` - Current active phase number
- `completedPhases` - Count of completed phases
- `lastUpdated` - ISO 8601 timestamp of last state update

## Troubleshooting

### State Tracker Not Found

**Error:** `state-tracker.ps1` not found or cannot be sourced

**Solution:**
```powershell
# Verify file exists
Test-Path 'd:\PROJECTS\NOOR CANVAS\.github\prompts\shared\state-tracker.ps1'

# Use absolute path
. 'd:\PROJECTS\NOOR CANVAS\.github\prompts\shared\state-tracker.ps1'
```

### Duplicate Commits

State tracker automatically prevents duplicate commit entries (same SHA + key). If you see duplicates, the state.json file may have been manually edited incorrectly.

**Solution:**
```powershell
# Reload state.json and verify schema
$state = Get-Content '.github/key-data-streams/my-feature/my-feature.state.json' | ConvertFrom-Json
$state.commits | Group-Object sha | Where-Object Count -gt 1
```

### DateTime Formatting Issues

plist.ps1 handles both DateTime objects and ISO 8601 strings. If you see formatting errors:

**Solution:** State tracker always uses ISO 8601 format (`2025-10-28T09:15:23.456-04:00`). plist.ps1 automatically converts for display.

### Missing State File

If `Get-StateFile` returns null, the key directory may not exist.

**Solution:**
```powershell
# Create key directory first
mkdir '.github/key-data-streams/my-feature'

# Then Get-StateFile will auto-create minimal state.json
$stateFile = Get-StateFile -Key 'my-feature'
```

## Best Practices

1. **Always source state-tracker.ps1 in Step -1** of prompt execution
2. **Log original requests immediately** upon prompt entry (before any analysis)
3. **Log handoffs before transitioning** to target agent (not after)
4. **Log commits after git commit** completes successfully
5. **Use consistent request types** for similar operations across prompts
6. **Include prompt chain** to track complete workflow path
7. **Set appropriate checkpoint types** to enable filtering and analysis
8. **Mark drifts as resolved** when work completes
9. **Test state tracking** by running `plist -timeline` after changes

## Version History

**1.0.0** (2025-10-28)
- Initial documentation
- Complete state tracker function reference
- Prompt integration patterns for all main agents
- plist.ps1 viewing command examples
- Troubleshooting guide

## Related Files

- `.github/prompts/shared/state-tracker.ps1` - State tracking utility (v1.0.0)
- `.github/key-data-streams/_SCHEMA/state.schema.json` - State.json schema definition
- `Workspaces/Global/plist.ps1` - Key data stream CLI (v2.0.0)
- `.github/prompts/route.prompt.md` - Route agent (v1.6.0)
- `.github/prompts/plan.prompt.md` - Plan agent (v1.5.0)
- `.github/prompts/task.prompt.md` - Task agent (updated for state tracking)
- `.github/prompts/todo.prompt.md` - Todo agent (v2.2.0)
- `.github/prompts/test-generation.prompt.md` - Test generation agent (v1.3.0)
- `.github/prompts/ask.prompt.md` - Ask agent (v1.1.0)
- `.github/prompts/drift.prompt.md` - Drift management agent (v1.3.0)
