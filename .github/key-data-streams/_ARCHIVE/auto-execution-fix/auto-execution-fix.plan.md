# Auto-Execution Fix - Drift Resolution Plan

**Version**: 1.0  
**Parent Key**: list-prompt  
**Drift Key**: auto-execution-fix  
**Severity**: high  
**Mode**: manual  
**Triggered By**: User observation  
**Created**: 2025-10-26

---

## Problem Statement

plan.prompt.md documented the Auto-Execution Handoff Protocol (Step 4) but did not **enforce** its execution. After user said "proceed", the agent:

1. ✅ Created plan files (Step 3)
2. ❌ **SKIPPED** execute-plan.ps1 generation (Step 4)
3. ✅ Proceeded to STOP (Step 5)

**Result**: User had to manually say "continue" after each phase instead of automatic phase-to-phase chaining.

---

## Root Cause Analysis

### Documentation vs. Enforcement Gap

**What was documented:**
- Auto-Execution Handoff Protocol (lines 655-835 in plan.prompt.md)
- execute-plan.ps1 template with full PowerShell script
- Auto-chaining protocol in task.prompt.md (lines 1525-1600)

**What was missing:**
- **MANDATORY enforcement checkpoint** after Step 3
- **Blocking check** before STOP to verify execute-plan.ps1 exists
- **Self-check algorithm** to validate file creation

### Agent Behavior

Agent treated Step 4 as "nice to have" instead of "MUST DO":
- Step 3: Write files → ✅ Completed
- Step 4: Generate auto-execution handoff → ⚠️ Skipped (no enforcement)
- Step 5: STOP → ✅ Executed

### Impact

- **Manual intervention required** between phases
- **No unassisted e2e execution** as documented
- **User frustration** - expected automation, got manual orchestration

---

## Solution Design

### Phase 1: Add Step 4 Enforcement to plan.prompt.md

**File**: `.github/prompts/plan.prompt.md`

**Changes**:
1. Add `🔒 STEP 4: AUTO-EXECUTION HANDOFF ENFORCEMENT (MANDATORY)` section after Process
2. Add self-check algorithm that HALTS if execute-plan.ps1 doesn't exist
3. Add blocking checkpoint before STOP
4. Mark Step 4 as **[MANDATORY - BLOCKING CHECKPOINT]** in Process section

**Algorithm**:
```
FUNCTION ExecuteStep4(key, totalPhases)
  scriptPath = `.github/key-data-streams/{key}/execute-plan.ps1`
  
  IF FileExists(scriptPath) THEN
    SKIP_WITH_LOG("execute-plan.ps1 already exists")
    RETURN
  END IF
  
  scriptContent = GenerateExecutePlanScript(key, totalPhases)
  WriteFile(scriptPath, scriptContent)
  
  IF NOT FileExists(scriptPath) THEN
    HALT_WITH_ERROR("Failed to create execute-plan.ps1 - cannot proceed to STOP")
  END IF
  
  OUTPUT: "✅ Created execute-plan.ps1"
  CONTINUE_TO_STEP_5()
END FUNCTION
```

**Self-Check Before STOP**:
```
1. ✅ {key}.plan.md exists
2. ✅ {key}.plan.json exists
3. ✅ work-log.md exists
4. ✅ tests/test-registry.md exists
5. ✅ execute-plan.ps1 exists ← CRITICAL (new check)

IF any file missing → HALT and create it before STOP
```

### Phase 2: Verify auto-chain Implementation in task.prompt.md

**File**: `.github/prompts/task.prompt.md`

**Status**: ✅ Already implemented (lines 1525-1600)

**Features**:
- `auto-chain` parameter defined (lines 29-37)
- Auto-Chain Protocol algorithm (lines 1525-1600)
- Test registry integration
- Phase-to-phase self-invocation
- Error handling with rollback options

**No changes needed** - implementation is complete and correct.

### Phase 3: Add auto-chain to todo.prompt.md

**File**: `.github/prompts/todo.prompt.md`

**Changes**:
1. Add Parameters section with `auto-chain` and `task-id` parameters
2. Add Auto-Chain Protocol section with task-to-task chaining algorithm
3. Document integration with execute-plan.ps1

**Algorithm**:
```
IF auto-chain == true AND task-id IS NOT NULL THEN
  IF CurrentTaskStatus != "complete" THEN
    HALT("Task {task-id} incomplete")
  END IF
  
  taskList = LoadTaskList(key)
  nextTaskId = task-id + 1
  
  IF nextTaskId <= taskList.totalTasks THEN
    SELF_INVOKE: @workspace /todo task-id:{nextTaskId} auto-chain:true
  ELSE
    STOP_AUTO_CHAIN()
  END IF
END IF
```

### Phase 4: Add auto-chain to test-generation.prompt.md

**File**: `.github/prompts/test-generation.prompt.md`

**Changes**:
1. Add Parameters section with `auto-chain`, `auto-execute`, `scenario`, `phase` parameters
2. Add Auto-Chain Protocol section with test generation → execution → validation chaining
3. Document integration with task.prompt.md auto-chain flow

**Algorithm**:
```
IF auto-chain == true THEN
  GenerateTests(key, scenario, phase)
  
  IF auto-execute == true THEN
    result = ExecuteTests(orchestrationScript)
    UpdateTestRegistry(key, scenario, result)
    
    IF result.status == "failed" THEN
      HALT("Tests failed")
    END IF
  END IF
  
  scenarioList = GetScenariosForPhase(plan, phase)
  nextScenario = scenarioList[currentIndex + 1]
  
  IF nextScenario EXISTS THEN
    SELF_INVOKE: @workspace /test-gen key:{key} scenario:{nextScenario} phase:{phase} auto-chain:true auto-execute:true
  ELSE
    STOP_AUTO_CHAIN()
  END IF
END IF
```

### Phase 5: Create execute-plan.ps1 for list-prompt (Demonstration)

**File**: `.github/key-data-streams/list-prompt/execute-plan.ps1`

**Purpose**: Demonstrate correct auto-execution orchestration script

**Features**:
- Loops through all 5 phases
- 10-second user break points between phases
- Outputs command: `@workspace /task key:list-prompt phase:{N} auto-chain:true`
- Error handling with Ctrl+C abort
- Parameters: `-SkipPause`, `-StartPhase`, `-EndPhase`

**Usage**:
```powershell
# Manual execution (demonstrates flow)
.\.github\key-data-streams\list-prompt\execute-plan.ps1

# CI/CD mode (no pauses)
.\.github\key-data-streams\list-prompt\execute-plan.ps1 -SkipPause

# Execute specific phases
.\.github\key-data-streams\list-prompt\execute-plan.ps1 -StartPhase 3 -EndPhase 5
```

---

## Success Criteria

### plan.prompt.md Enforcement
- [ ] Step 4 marked as **[MANDATORY - BLOCKING CHECKPOINT]** in Process section
- [ ] `🔒 STEP 4: AUTO-EXECUTION HANDOFF ENFORCEMENT` section added
- [ ] Self-check algorithm halts if execute-plan.ps1 missing before STOP
- [ ] Output format shows execute-plan.ps1 in file creation list

### task.prompt.md Verification
- [x] auto-chain parameter defined (already exists)
- [x] Auto-Chain Protocol implemented (already exists)
- [x] Test registry integration (already exists)
- [x] Phase-to-phase self-invocation (already exists)

### todo.prompt.md Implementation
- [ ] Parameters section added with auto-chain and task-id
- [ ] Auto-Chain Protocol section added
- [ ] Task-to-task chaining algorithm implemented
- [ ] Integration with execute-plan.ps1 documented

### test-generation.prompt.md Implementation
- [ ] Parameters section added with auto-chain, auto-execute, scenario, phase
- [ ] Auto-Chain Protocol section added
- [ ] Test generation → execution → validation chaining implemented
- [ ] Integration with task.prompt.md documented

### execute-plan.ps1 Demonstration
- [x] Created for list-prompt key
- [x] Loops through 5 phases
- [x] 10-second user break points
- [x] Outputs proper @workspace /task commands
- [x] Error handling and parameters

---

## Testing Plan

### Test 1: plan.prompt.md Enforcement

**Scenario**: Create new plan and verify execute-plan.ps1 generation

**Steps**:
1. `@workspace /plan key:test-auto-exec create simple 2-phase plan`
2. User says "proceed"
3. Verify agent creates execute-plan.ps1 automatically
4. Verify agent shows execute-plan.ps1 in completion message

**Expected**: execute-plan.ps1 created before STOP

### Test 2: task.prompt.md Auto-Chain (Already Working)

**Scenario**: Execute plan with auto-chain=true

**Steps**:
1. `@workspace /task key:test-auto-exec phase:1 auto-chain:true`
2. Phase 1 completes
3. Verify agent automatically invokes Phase 2 without user intervention

**Expected**: Phase 2 auto-invoked via `SELF_INVOKE`

### Test 3: todo.prompt.md Auto-Chain

**Scenario**: Execute task list with auto-chain=true

**Steps**:
1. Create key with multiple tasks
2. `@workspace /todo task-id:1 auto-chain:true`
3. Task 1 completes
4. Verify agent automatically invokes task-id:2

**Expected**: Task 2 auto-invoked without manual "continue"

### Test 4: test-generation.prompt.md Auto-Chain

**Scenario**: Generate and execute tests with auto-chain=true

**Steps**:
1. `@workspace /test-gen key:test-auto-exec scenario:test-1 auto-chain:true auto-execute:true`
2. Tests generated and executed
3. If multiple scenarios exist, verify agent chains to next scenario

**Expected**: Scenario 2 auto-invoked if exists

### Test 5: execute-plan.ps1 Manual Execution

**Scenario**: Run list-prompt execute-plan.ps1 script

**Steps**:
1. Navigate to `.github\key-data-streams\list-prompt\`
2. Run `.\execute-plan.ps1`
3. Observe 10-second pause before each phase
4. Verify proper phase command output

**Expected**: Script displays all 5 phases with proper formatting

---

## Rollback Plan

If auto-execution enforcement causes issues:

### Revert plan.prompt.md Changes
```bash
git revert <commit-sha-for-plan-prompt-enforcement>
```

### Disable auto-chain by Default
Change task.prompt.md, todo.prompt.md, test-generation.prompt.md:
```
auto-chain *(default=`false`)*  # Already false by default
```

### Manual Execution Fallback
If execute-plan.ps1 fails, user can always manually invoke:
```
@workspace /task key:{key} phase:1
# Then manually say "continue" after each phase
```

---

## Documentation Updates

### README or Prompt Usage Guide

Add section explaining auto-execution:

**Auto-Execution Workflow:**

1. **Planning**: `@workspace /plan key:my-feature create feature plan`
2. **Approval**: User says "proceed"
3. **Auto-Execution**: Agent creates `execute-plan.ps1` and starts Phase 1
4. **Auto-Chaining**: Phase 1 → Phase 2 → Phase 3 automatically (no manual "continue")
5. **Completion**: All phases complete, user can mark complete

**Manual Control Points:**
- 10-second pause between phases (press Ctrl+C to abort)
- Set `auto-chain:false` to require manual approval between phases
- Test failures halt auto-chain with rollback options

---

## Implementation Timeline

- **Phase 1**: plan.prompt.md enforcement - 15 minutes
- **Phase 2**: task.prompt.md verification - 5 minutes (already done)
- **Phase 3**: todo.prompt.md auto-chain - 15 minutes
- **Phase 4**: test-generation.prompt.md auto-chain - 15 minutes
- **Phase 5**: execute-plan.ps1 demonstration - 10 minutes

**Total Estimated Time**: 60 minutes

---

## Completion Checklist

- [x] Phase 1: plan.prompt.md enforcement added
- [x] Phase 2: task.prompt.md verified (already complete)
- [x] Phase 3: todo.prompt.md auto-chain added
- [x] Phase 4: test-generation.prompt.md auto-chain added
- [x] Phase 5: execute-plan.ps1 created for list-prompt
- [ ] Test 1: plan.prompt.md enforcement validated
- [ ] Test 2: task.prompt.md auto-chain validated
- [ ] Test 3: todo.prompt.md auto-chain validated
- [ ] Test 4: test-generation.prompt.md auto-chain validated
- [ ] Test 5: execute-plan.ps1 manual execution validated
- [ ] Documentation updated
- [ ] Commit with drift resolution message
- [ ] Work log updated
