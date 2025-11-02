# Prompt State Integration Plan

**Key:** `prompt-state-integration`  
**Status:** Planning  
**Branch:** `feature/plist-state-tracking`  
**Estimated Duration:** 3-4 hours

---

## 🎯 Objective

Integrate state tracking into all prompt files so they automatically log:
- User requests (original + additional)
- Prompt-to-prompt handoffs
- Git commits associated with work

This enables the new `plist` commands (`-timeline`, `-graph`, `-requests`, `-commits`) to show real execution data.

---

## 📐 Architecture

### State Tracking Flow
```
User Request
    ↓
route.prompt.md (logs request → state.json)
    ↓ (logs handoff)
plan.prompt.md (logs request → state.json)
    ↓ (logs handoff)
task.prompt.md (logs execution → state.json)
    ↓ (logs commit after ckpt)
state.json updated
```

### State Tracker Utility
**Location:** `.github/prompts/shared/state-tracker.ps1`

**Functions:**
- `Update-StateRequest` - Adds user request to requests[] array
- `Update-StateHandoff` - Adds prompt transition to promptHandoffs[] array
- `Update-StateCommit` - Adds git commit to commits[] array
- `Get-StateFile` - Auto-discovers state.json path for key

---

## 🏗️ Implementation Phases

### Phase 1: Create State Tracking Utility (45 min)
**Risk:** Low

**Deliverables:**
- `.github/prompts/shared/state-tracker.ps1`
- PowerShell module with 4 core functions
- JSON validation against state.schema.json
- Auto-discovery of key data stream paths

**Example Usage:**
```powershell
# In route.prompt.md
. .github/prompts/shared/state-tracker.ps1

Update-StateRequest -Key "zoom-integration" `
                    -Type "original" `
                    -UserRequest "Integrate Zoom REST API" `
                    -PromptChain @("route", "plan")

Update-StateHandoff -Key "zoom-integration" `
                    -From "route" `
                    -To "plan" `
                    -Parameters @{ key = "zoom-integration" }
```

---

### Phase 2: Update Route Prompt (30 min)
**Risk:** Medium (entry point for all workflows)

**Changes to `route.prompt.md`:**
1. Add state-tracker import
2. Log original user request on entry
3. Record handoff when routing to target agent
4. Update version to 1.6.0
5. Add metadata: `stateTracking: enabled`

**Testing:**
```powershell
# Test routing workflow
@workspace /route "test state tracking"

# Verify state.json updated
plist -requests -k <generated-key>
plist -timeline -k <generated-key>
```

---

### Phase 3: Update Main Agent Prompts (1.5 hours)
**Risk:** Medium

**Prompts to Update:**
- `plan.prompt.md` → Log requests, handoffs to task/test-generation
- `task.prompt.md` → Log task execution, handoffs to test-generation
- `todo.prompt.md` → Log quick tasks (no handoffs)
- `test-generation.prompt.md` → Log test creation, handoffs back to task
- `ask.prompt.md` → Log questions, handoffs to plan/task/todo

**Pattern:**
```powershell
# At start of each prompt
. .github/prompts/shared/state-tracker.ps1

# Log incoming request
Update-StateRequest -Key $key `
                    -Type "additional" `
                    -UserRequest $user_request `
                    -PromptChain @($from_prompt, $current_prompt)

# After completing work and calling ckpt()
$commitSha = git rev-parse HEAD
Update-StateCommit -Key $key `
                   -Sha $commitSha `
                   -Message "ckpt($key): Phase X complete" `
                   -Phase $phaseNumber

# Before handing off to next prompt
Update-StateHandoff -Key $key `
                    -From $current_prompt `
                    -To $target_prompt `
                    -Parameters @{ key = $key; phase = $phaseNumber }
```

---

### Phase 4: Update Specialized Prompts (45 min)
**Risk:** Low

**Prompts to Update:**
- `healthcheck.prompt.md` → Log healthcheck requests
- `drift.prompt.md` → Log drift detection, create drift keys
- `cohesion.prompt.md` → Log cohesion audits
- All `internal/*.prompt.md` files

**Drift Key Integration:**
```powershell
# In drift.prompt.md when creating drift key
Update-StateDriftKey -ParentKey $original_key `
                     -DriftKey $drift_key `
                     -Severity "medium" `
                     -Description "Auto-detected drift"
```

---

### Phase 5: Testing & Documentation (30 min)
**Risk:** Low

**Test Cases:**
1. **Full Workflow Test:**
   ```powershell
   @workspace /route plan "Test full state tracking workflow"
   # Verify: plist -requests -k <key> shows request
   # Verify: plist -timeline -k <key> shows handoffs
   # Verify: plist -commits -k <key> shows commits
   # Verify: plist -graph -k <key> shows prompt chain
   ```

2. **Drift Detection Test:**
   ```powershell
   @workspace /route drift "Test drift key creation"
   # Verify: Parent key has driftKeys[] populated
   ```

3. **Multi-Request Test:**
   ```powershell
   @workspace /route plan "Original request"
   # ... user adds additional request ...
   # Verify: requests[] has both original + additional
   ```

**Documentation:**
- Create `PROMPT-STATE-TRACKING.md` guide
- Update `.github/prompts/README.md`
- Add examples to each prompt's frontmatter

---

## 🎨 State Tracker Implementation Details

### state-tracker.ps1 Structure
```powershell
# State Tracker Utility v1.0.0
# Auto-updates state.json with request/handoff/commit tracking

function Get-StateFile {
    param([string]$Key)
    # Auto-discover state.json path
    $paths = @(
        ".github/key-data-streams/$Key/$Key.state.json",
        "Workspaces/Copilot/KeyDataStreams/$Key/$Key.state.json"
    )
    foreach ($p in $paths) {
        if (Test-Path $p) { return $p }
    }
    throw "State file not found for key: $Key"
}

function Update-StateRequest {
    param(
        [string]$Key,
        [string]$Type,      # original|additional|clarification|modification
        [string]$UserRequest,
        [string[]]$PromptChain,
        [string[]]$Commits = @()
    )
    
    $stateFile = Get-StateFile -Key $Key
    $state = Get-Content $stateFile | ConvertFrom-Json -AsHashtable
    
    $request = @{
        timestamp = (Get-Date).ToString("o")
        type = $Type
        userRequest = $UserRequest
        promptChain = $PromptChain
        commits = $Commits
        outcome = "in-progress"
    }
    
    $state.requests += $request
    $state.lastUpdated = (Get-Date).ToString("o")
    
    $state | ConvertTo-Json -Depth 10 | Set-Content $stateFile
}

function Update-StateHandoff {
    param(
        [string]$Key,
        [string]$From,
        [string]$To,
        [hashtable]$Parameters
    )
    
    $stateFile = Get-StateFile -Key $Key
    $state = Get-Content $stateFile | ConvertFrom-Json -AsHashtable
    
    $handoff = @{
        from = $From
        to = $To
        timestamp = (Get-Date).ToString("o")
        parameters = $Parameters
        reason = "Standard workflow handoff"
    }
    
    $state.promptHandoffs += $handoff
    $state.lastUpdated = (Get-Date).ToString("o")
    
    $state | ConvertTo-Json -Depth 10 | Set-Content $stateFile
}

function Update-StateCommit {
    param(
        [string]$Key,
        [string]$Sha,
        [string]$Message,
        [int]$Phase = $null
    )
    
    $stateFile = Get-StateFile -Key $Key
    $state = Get-Content $stateFile | ConvertFrom-Json -AsHashtable
    
    $commit = @{
        sha = $Sha
        message = $Message
        timestamp = (Get-Date).ToString("o")
        author = git config user.name
        phase = $Phase
        checkpointType = "intermediate"
        filesChanged = @()
    }
    
    $state.commits += $commit
    $state.lastUpdated = (Get-Date).ToString("o")
    
    $state | ConvertTo-Json -Depth 10 | Set-Content $stateFile
}
```

---

## 🔍 Verification Checklist

After implementation, verify:

- [ ] `plist -requests -k <key>` shows all user requests chronologically
- [ ] `plist -commits -k <key>` shows all git commits
- [ ] `plist -timeline -k <key>` shows merged requests + commits + handoffs
- [ ] `plist -graph -k <key>` shows accurate prompt execution path
- [ ] `plist -prompts` shows updated prompt graph with relationships
- [ ] State.json validates against state.schema.json
- [ ] No breaking changes to existing prompt execution
- [ ] All 24 prompts updated with state tracking

---

## 📊 Success Metrics

- **Coverage:** 100% of prompts logging state data
- **Accuracy:** All handoffs match actual prompt execution path
- **Performance:** State updates add <100ms to prompt execution
- **Reliability:** 0 JSON serialization errors in production
- **Usability:** Developers can trace any key's full history via plist

---

## 🚀 Rollout Strategy

1. **Phase 1-2:** Core infrastructure (state-tracker + route)
2. **Test:** Validate route → plan → task workflow
3. **Phase 3:** Main agents (plan, task, todo, test-generation, ask)
4. **Test:** Validate complex multi-agent workflows
5. **Phase 4:** Specialized agents (healthcheck, drift, cohesion)
6. **Phase 5:** Documentation + final testing
7. **Commit:** All changes on `feature/plist-state-tracking` branch
8. **Merge:** After user testing approval

---

## 🛠️ Tools Available

- ✅ `state.schema.json` - JSON validation
- ✅ `plist.ps1 v2.0` - All lookup commands ready
- ✅ `migrate-keys-to-state.ps1` - Backfill existing keys
- ⏳ `state-tracker.ps1` - To be created (Phase 1)

---

## 🎯 Next Action

Ready to proceed with Phase 1: Create State Tracking Utility?
