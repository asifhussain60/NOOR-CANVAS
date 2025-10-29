# JSON Tracking Schema

**Version**: 1.0.0  
**Last Updated**: 2025-01-19  
**Purpose**: Define JSON schemas for plan.json and state.json tracking files

---

## Overview

JSON tracking files provide structured, machine-readable state for programmatic queries and agent coordination. Unlike work-log.md (narrative history), JSON files enable precise status checks, phase tracking, and automated workflow decisions.

---

## {key}.plan.json

### Purpose

Structured phase tracking for multi-phase work created by plan agent and updated by task agent.

### Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["key", "status", "createdAt", "updatedAt", "branch", "phases"],
  "properties": {
    "key": {
      "type": "string",
      "pattern": "^[a-z0-9-]+$",
      "description": "Unique key identifier matching folder name"
    },
    "status": {
      "type": "string",
      "enum": ["not-started", "in-progress", "completed"],
      "description": "Overall plan status"
    },
    "createdAt": {
      "type": "string",
      "format": "date-time",
      "description": "ISO-8601 timestamp when plan was created"
    },
    "updatedAt": {
      "type": "string",
      "format": "date-time",
      "description": "ISO-8601 timestamp of last update"
    },
    "branch": {
      "type": "string",
      "description": "Git branch for this work (development|master)"
    },
    "phases": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "required": ["phaseNumber", "title", "status"],
        "properties": {
          "phaseNumber": {
            "type": "integer",
            "minimum": 1,
            "description": "Sequential phase number (1, 2, 3, ...)"
          },
          "title": {
            "type": "string",
            "description": "Human-readable phase title"
          },
          "status": {
            "type": "string",
            "enum": ["not-started", "in-progress", "completed"],
            "description": "Phase-specific status"
          },
          "commit": {
            "type": ["string", "null"],
            "pattern": "^[0-9a-f]{7,40}$",
            "description": "Git commit SHA when phase completed (null if not done)"
          },
          "startedAt": {
            "type": ["string", "null"],
            "format": "date-time",
            "description": "ISO-8601 timestamp when phase started (null if not started)"
          },
          "completedAt": {
            "type": ["string", "null"],
            "format": "date-time",
            "description": "ISO-8601 timestamp when phase completed (null if not done)"
          }
        }
      }
    }
  }
}
```

### Example

```json
{
  "key": "user-landing",
  "status": "in-progress",
  "createdAt": "2025-01-19T14:30:00Z",
  "updatedAt": "2025-01-19T15:00:00Z",
  "branch": "development",
  "phases": [
    {
      "phaseNumber": 1,
      "title": "Database Schema",
      "status": "completed",
      "commit": "a1b2c3d",
      "startedAt": "2025-01-19T14:45:00Z",
      "completedAt": "2025-01-19T15:00:00Z"
    },
    {
      "phaseNumber": 2,
      "title": "Backend Persistence",
      "status": "in-progress",
      "commit": null,
      "startedAt": "2025-01-19T15:05:00Z",
      "completedAt": null
    },
    {
      "phaseNumber": 3,
      "title": "Frontend Routing",
      "status": "not-started",
      "commit": null,
      "startedAt": null,
      "completedAt": null
    },
    {
      "phaseNumber": 4,
      "title": "E2E Testing",
      "status": "not-started",
      "commit": null,
      "startedAt": null,
      "completedAt": null
    }
  ]
}
```

### Lifecycle Management

**Created By**: plan.prompt.md (Step 5)

**Updated By**: task.prompt.md (after each phase)

**Update Rules**:
1. ✅ ONLY update phase status (not-started → in-progress → completed)
2. ✅ ONLY set commit/startedAt/completedAt when status changes
3. ✅ ALWAYS update updatedAt timestamp on root object
4. ❌ NEVER delete or reorder phases
5. ❌ NEVER change key or createdAt

**Status Calculation**:
```javascript
// Overall plan status derived from phases
if (all phases completed) {
  status = "completed"
} else if (any phase in-progress or completed) {
  status = "in-progress"
} else {
  status = "not-started"
}
```

### Query Examples

**PowerShell - Get Current Phase**:
```powershell
$plan = Get-Content ".github/key-data-streams/{key}/{key}.plan.json" | ConvertFrom-Json
$currentPhase = $plan.phases | Where-Object { $_.status -eq "in-progress" } | Select-Object -First 1

Write-Host "Current Phase: $($currentPhase.phaseNumber) - $($currentPhase.title)"
```

**PowerShell - Get Completion Percentage**:
```powershell
$plan = Get-Content ".github/key-data-streams/{key}/{key}.plan.json" | ConvertFrom-Json
$completed = ($plan.phases | Where-Object { $_.status -eq "completed" }).Count
$total = $plan.phases.Count
$percentage = [math]::Round(($completed / $total) * 100, 1)

Write-Host "Progress: $percentage% ($completed/$total phases complete)"
```

**PowerShell - Get Next Phase**:
```powershell
$plan = Get-Content ".github/key-data-streams/{key}/{key}.plan.json" | ConvertFrom-Json
$nextPhase = $plan.phases | Where-Object { $_.status -eq "not-started" } | Select-Object -First 1

if ($nextPhase) {
    Write-Host "Next Phase: $($nextPhase.phaseNumber) - $($nextPhase.title)"
} else {
    Write-Host "All phases complete!"
}
```

**PowerShell - Get Last Checkpoint Commit**:
```powershell
$plan = Get-Content ".github/key-data-streams/{key}/{key}.plan.json" | ConvertFrom-Json
$lastCommit = $plan.phases | 
    Where-Object { $_.commit -ne $null } | 
    Select-Object -Last 1 | 
    Select-Object -ExpandProperty commit

Write-Host "Last checkpoint: $lastCommit"
```

---

## state.json

### Purpose

Lightweight current state snapshot for quick status checks without parsing full plan.json.

### Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["key", "status", "lastUpdated", "lastAgent", "branch"],
  "properties": {
    "key": {
      "type": "string",
      "pattern": "^[a-z0-9-]+$",
      "description": "Unique key identifier"
    },
    "status": {
      "type": "string",
      "enum": ["not-started", "in-progress", "completed"],
      "description": "Current overall status"
    },
    "currentPhase": {
      "type": ["integer", "null"],
      "minimum": 1,
      "description": "Current phase number (null if no plan)"
    },
    "lastUpdated": {
      "type": "string",
      "format": "date-time",
      "description": "ISO-8601 timestamp of last update"
    },
    "lastAgent": {
      "type": "string",
      "enum": ["plan", "task", "todo", "test-generation", "drift", "collapse-keys", "cohesion", "healthcheck", "route"],
      "description": "Agent that last updated this key"
    },
    "branch": {
      "type": "string",
      "description": "Git branch for this work"
    }
  }
}
```

### Example

```json
{
  "key": "user-landing",
  "status": "in-progress",
  "currentPhase": 2,
  "lastUpdated": "2025-01-19T15:05:00Z",
  "lastAgent": "task",
  "branch": "development"
}
```

### Lifecycle Management

**Created By**: plan.prompt.md (Step 5)

**Updated By**: task.prompt.md, todo.prompt.md (after each session)

**Update Rules**:
1. ✅ ALWAYS update lastUpdated timestamp
2. ✅ ALWAYS update lastAgent to current agent name
3. ✅ Update currentPhase when phase changes
4. ✅ Update status when overall status changes
5. ❌ NEVER change key

**Synchronization with plan.json**:
```javascript
// state.json should always reflect plan.json
state.status = plan.status
state.currentPhase = plan.phases.find(p => p.status === "in-progress")?.phaseNumber || null
```

### Query Examples

**PowerShell - Quick Status Check**:
```powershell
$state = Get-Content ".github/key-data-streams/{key}/state.json" | ConvertFrom-Json

Write-Host "Key: $($state.key)"
Write-Host "Status: $($state.status)"
Write-Host "Current Phase: $($state.currentPhase)"
Write-Host "Last Updated: $($state.lastUpdated) by $($state.lastAgent)"
```

**PowerShell - Check if Work is Stale**:
```powershell
$state = Get-Content ".github/key-data-streams/{key}/state.json" | ConvertFrom-Json
$lastUpdated = [DateTime]::Parse($state.lastUpdated)
$hoursSinceUpdate = ((Get-Date) - $lastUpdated).TotalHours

if ($hoursSinceUpdate -gt 24) {
    Write-Warning "Work may be stale - last updated $([math]::Round($hoursSinceUpdate, 1)) hours ago"
}
```

---

## Integration Patterns

### plan.json ↔ state.json Synchronization

**When to Update Both**:

1. **Phase Status Change** (task agent):
   ```powershell
   # Update plan.json phase
   $plan.phases[0].status = "completed"
   $plan.phases[0].completedAt = (Get-Date).ToString("o")
   $plan.updatedAt = (Get-Date).ToString("o")
   $plan | ConvertTo-Json -Depth 10 | Set-Content "{key}.plan.json"
   
   # Update state.json
   $state.status = "in-progress"  # Overall still in-progress
   $state.currentPhase = 2         # Now on phase 2
   $state.lastUpdated = (Get-Date).ToString("o")
   $state.lastAgent = "task"
   $state | ConvertTo-Json | Set-Content "state.json"
   ```

2. **Plan Completion** (task agent):
   ```powershell
   # Update plan.json
   $plan.status = "completed"
   $plan.updatedAt = (Get-Date).ToString("o")
   $plan | ConvertTo-Json -Depth 10 | Set-Content "{key}.plan.json"
   
   # Update state.json
   $state.status = "completed"
   $state.currentPhase = $null     # No current phase when done
   $state.lastUpdated = (Get-Date).ToString("o")
   $state.lastAgent = "task"
   $state | ConvertTo-Json | Set-Content "state.json"
   ```

---

### work-log.md ↔ JSON Tracking

**Complementary Relationship**:

- **work-log.md**: Narrative history ("what happened and why")
- **plan.json**: Structured tracking ("current state and progress")
- **state.json**: Quick lookup ("status right now")

**Example Synchronization**:

```markdown
## Session: 2025-01-19 15:00 (task)
**Action**: Executed Phase 1 - Database Schema
**Status**: Phase 1 complete, checkpoint committed (a1b2c3d)
**Next**: Phase 2 - Backend Persistence
```

```json
// plan.json
{
  "phases": [
    {
      "phaseNumber": 1,
      "status": "completed",
      "commit": "a1b2c3d",
      "completedAt": "2025-01-19T15:00:00Z"
    }
  ]
}
```

```json
// state.json
{
  "status": "in-progress",
  "currentPhase": 2,
  "lastUpdated": "2025-01-19T15:00:00Z",
  "lastAgent": "task"
}
```

---

## Validation

### plan.json Validation

**Required Checks**:
```powershell
$plan = Get-Content "{key}.plan.json" | ConvertFrom-Json

# 1. Key matches folder name
if ($plan.key -ne $keyName) {
    throw "plan.json key mismatch: expected $keyName, got $($plan.key)"
}

# 2. Phases are sequential
$expectedPhase = 1
foreach ($phase in $plan.phases) {
    if ($phase.phaseNumber -ne $expectedPhase) {
        throw "Phase numbering gap: expected $expectedPhase, got $($phase.phaseNumber)"
    }
    $expectedPhase++
}

# 3. Status consistency
$completedCount = ($plan.phases | Where-Object { $_.status -eq "completed" }).Count
$inProgressCount = ($plan.phases | Where-Object { $_.status -eq "in-progress" }).Count
$totalCount = $plan.phases.Count

if ($completedCount -eq $totalCount -and $plan.status -ne "completed") {
    throw "All phases complete but plan status is $($plan.status)"
}

if ($inProgressCount -eq 0 -and $completedCount -eq 0 -and $plan.status -ne "not-started") {
    throw "No phases started but plan status is $($plan.status)"
}

# 4. Timestamp ordering
foreach ($phase in $plan.phases | Where-Object { $_.completedAt -ne $null }) {
    $started = [DateTime]::Parse($phase.startedAt)
    $completed = [DateTime]::Parse($phase.completedAt)
    if ($completed -lt $started) {
        throw "Phase $($phase.phaseNumber) completed before it started"
    }
}
```

### state.json Validation

**Required Checks**:
```powershell
$state = Get-Content "state.json" | ConvertFrom-Json
$plan = Get-Content "{key}.plan.json" | ConvertFrom-Json

# 1. Keys match
if ($state.key -ne $plan.key) {
    throw "state.json and plan.json key mismatch"
}

# 2. Status matches
if ($state.status -ne $plan.status) {
    throw "state.json status ($($state.status)) doesn't match plan.json ($($plan.status))"
}

# 3. Current phase exists
if ($state.currentPhase -ne $null) {
    $phaseExists = $plan.phases | Where-Object { $_.phaseNumber -eq $state.currentPhase }
    if (-not $phaseExists) {
        throw "state.json references non-existent phase $($state.currentPhase)"
    }
}

# 4. Current phase is actually in-progress
if ($state.currentPhase -ne $null) {
    $currentPhase = $plan.phases | Where-Object { $_.phaseNumber -eq $state.currentPhase }
    if ($currentPhase.status -ne "in-progress") {
        throw "state.json currentPhase $($state.currentPhase) is not in-progress in plan.json"
    }
}
```

---

## Migration & Recovery

### Regenerate state.json from plan.json

If state.json is missing or corrupted:

```powershell
$plan = Get-Content "{key}.plan.json" | ConvertFrom-Json

$inProgressPhase = $plan.phases | Where-Object { $_.status -eq "in-progress" } | Select-Object -First 1

$state = @{
    key = $plan.key
    status = $plan.status
    currentPhase = if ($inProgressPhase) { $inProgressPhase.phaseNumber } else { $null }
    lastUpdated = (Get-Date).ToString("o")
    lastAgent = "recovery-script"
    branch = $plan.branch
}

$state | ConvertTo-Json | Set-Content "state.json"
Write-Host "✅ state.json regenerated from plan.json"
```

---

## Related Documentation

- **README.md** - KDS schema overview and file relationships
- **work-log-format.md** - Narrative history format
- **agent-handoff-protocol.md** - How agents use JSON tracking
- **file-finalization-verifier.md** - Document First protocol

---

## Version History

### v1.0.0 (2025-01-19)
- Initial JSON tracking schema documentation
- Defined plan.json and state.json schemas
- Added lifecycle management rules
- Provided PowerShell query examples
- Documented validation and recovery procedures
