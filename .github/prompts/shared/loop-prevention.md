# loop-prevention.md (Agent Loop Prevention Protocol)

---
purpose: Prevent infinite loops and circular handoffs in agent-to-agent workflows
lastUpdated: 2025-10-27
---

## Purpose
Ensure agents terminate properly and don't create infinite handoff loops, duplicate work, or repetitive analysis cycles.

---

## Critical Loop Scenarios

### 1. Circular Handoff Loop
**Risk:** Agent A → Agent B → Agent A → Agent B (infinite)

**Example:**
```
build → plan → build (re-analyze) → plan (re-plan) → LOOP
```

**Prevention:**
```
RULE: Each agent invocation MUST include handoff chain history
RULE: If agent detects itself in chain twice → TERMINATE with error

handoffChain = [build, plan]
IF currentAgent IN handoffChain THEN
  TERMINATE("Loop detected: " + currentAgent + " already in chain")
END IF
```

### 2. Duplicate Key Creation Loop
**Risk:** Agent creates new key when existing key already handles the work

**Example:**
```
User: "Add feature X"
build → plan (creates key:feature-x)
User: "Continue with feature X" 
build → plan (creates key:feature-x-2) ← DUPLICATE
```

**Prevention:**
```
RULE: Step 0 (Key Consultation) is MANDATORY and BLOCKING
RULE: If related key found → HALT, present to user, wait for choice

existingKeys = SearchKeyDataStreams(request)
IF existingKeys.length > 0 THEN
  PresentOptionsToUser(existingKeys)
  HALT_AND_WAIT()
END IF
```

### 3. Infinite Re-Analysis Loop
**Risk:** Agent keeps re-analyzing same context without progressing

**Example:**
```
plan → analyze Architecture.md
plan → analyze Architecture.md (AGAIN)
plan → analyze Architecture.md (AGAIN) ← LOOP
```

**Prevention:**
```
RULE: Track loaded context in session state
RULE: Skip re-loading if already loaded in current invocation

sessionContext = {
  architectureLoaded: false,
  infrastructureLoaded: false
}

IF sessionContext.architectureLoaded THEN
  SKIP_LOAD("Architecture.md already loaded")
ELSE
  LoadArchitecture()
  sessionContext.architectureLoaded = true
END IF
```

### 4. Questionnaire Re-Generation Loop
**Risk:** Plan agent keeps generating questionnaires instead of proceeding

**Example:**
```
plan → generate questionnaire
User: "Skip questionnaire"
plan → generate questionnaire AGAIN ← LOOP
```

**Prevention:**
```
RULE: Questionnaire generation is ONE-TIME only
RULE: If user skips or completes → Mark as done, never regenerate

questionnaireState = {
  generated: false,
  completed: false,
  skipped: false
}

IF questionnaireState.generated THEN
  IF questionnaireState.skipped THEN
    PROCEED_TO_PLAN_GENERATION()
  ELSE IF questionnaireState.completed THEN
    PROCEED_TO_PLAN_GENERATION()
  ELSE
    WAIT_FOR_USER_RESPONSE()
  END IF
ELSE
  GenerateQuestionnaire()
  questionnaireState.generated = true
END IF
```

### 5. Auto-Chain Infinite Loop
**Risk:** todo/task agent auto-chains to itself indefinitely

**Example:**
```
todo → task-1 → auto-chain to task-2 → auto-chain to task-3 → ∞
```

**Prevention:**
```
RULE: Auto-chain depth limited to plan's total phase count
RULE: If current phase >= totalPhases → STOP, don't auto-chain

IF auto-chain == true THEN
  IF currentPhase >= totalPhases THEN
    TERMINATE_AUTO_CHAIN("All phases complete")
  ELSE
    INVOKE_NEXT_PHASE(currentPhase + 1)
  END IF
END IF
```

---

## Agent-Specific Loop Guards

### build.prompt.md

**Loop Risk:** User invokes build repeatedly for same work

**Guard:**
```
FUNCTION ExecuteBuildPrompt(request)
  
  // Check if this exact request was just processed
  recentInvocations = GetRecentBuildInvocations(limit: 3)
  
  FOR EACH invocation IN recentInvocations
    IF SimilarityScore(request, invocation.request) > 0.9 THEN
      WARN_USER("Similar request processed recently. Results:")
      SHOW_PREVIOUS_RESULT(invocation)
      
      OPTIONS:
        A. Use previous result (no re-processing)
        B. Force re-process anyway
        C. Cancel
      
      HALT_AND_WAIT()
    END IF
  END FOR
  
  // Proceed with build workflow
  ...
END FUNCTION
```

**Handoff Limit:**
```
RULE: build.prompt.md can ONLY handoff once per invocation
RULE: After handoff → TERMINATE, do not continue processing

handoffComplete = false

IF NOT handoffComplete THEN
  PerformHandoff(targetAgent, parameters)
  handoffComplete = true
  TERMINATE("Handoff complete to " + targetAgent)
END IF
```

### plan.prompt.md

**Loop Risk:** Re-planning same key repeatedly

**Guard:**
```
FUNCTION ExecutePlanPrompt(key, request)
  
  // Check if plan already exists for this key
  existingPlan = LoadPlan(key)
  
  IF existingPlan != null THEN
    SHOW_EXISTING_PLAN(existingPlan)
    
    OPTIONS:
      A. Resume existing plan (use todo.prompt.md)
      B. Revise plan (increment version, modify phases)
      C. Replace plan (archive old, create new)
      D. Cancel
    
    HALT_AND_WAIT()
  END IF
  
  // Proceed with new plan creation
  ...
END FUNCTION
```

**Questionnaire Loop Guard:**
```
questionnaireFile = `.github/key-data-streams/{key}/questionnaire-*.md`

IF FileExists(questionnaireFile) THEN
  IF NOT FileContains(questionnaireFile, "ANSWERED") THEN
    SHOW_EXISTING_QUESTIONNAIRE()
    HALT_AND_WAIT("Please answer questionnaire before proceeding")
  ELSE
    LOAD_ANSWERS(questionnaireFile)
    SKIP_QUESTIONNAIRE_GENERATION()
  END IF
END IF
```

**Handoff Loop Guard:**
```
RULE: plan.prompt.md → task.prompt.md handoff is FINAL
RULE: After handoff, plan agent TERMINATES

planComplete = WritePlanFiles(key)
IF planComplete THEN
  HandoffToTaskAgent(key, phases)
  TERMINATE("Plan complete. Task agent invoked.")
END IF
```

### todo.prompt.md

**Loop Risk:** Infinite auto-chain execution

**Guard:**
```
FUNCTION ExecuteTodoPrompt(key, auto-chain)
  
  plan = LoadPlan(key)
  
  IF auto-chain == true THEN
    // Enforce phase limit
    maxIterations = plan.totalPhases + 1  // +1 for safety
    currentIteration = GetCurrentPhaseNumber(key)
    
    IF currentIteration > maxIterations THEN
      TERMINATE("Safety limit reached: " + currentIteration + "/" + maxIterations)
    END IF
  END IF
  
  // Execute task
  ExecuteTask(key, currentPhase)
  
  // Check if more work remains
  IF auto-chain AND HasNextPhase() THEN
    InvokeNextPhase()
  ELSE
    TERMINATE("Work complete or manual continuation required")
  END IF
END FUNCTION
```

**Key Detection Loop Guard:**
```
RULE: If key auto-detection fails 3 times → STOP, request manual key

detectionAttempts = 0
maxAttempts = 3

WHILE key == null AND detectionAttempts < maxAttempts
  key = DetectActiveKeyFromGitHistory()
  detectionAttempts++
END WHILE

IF key == null THEN
  REQUEST_USER_INPUT("Cannot auto-detect key. Please specify: @workspace /todo key={your-key}")
  TERMINATE()
END IF
```

### task.prompt.md

**Loop Risk:** Re-executing same phase repeatedly

**Guard:**
```
FUNCTION ExecuteTaskPrompt(key, phase)
  
  planJson = LoadPlanJson(key)
  currentPhase = planJson.phases[phase]
  
  // Check if phase already complete
  IF currentPhase.status == "completed" THEN
    WARN_USER("Phase " + phase + " already completed")
    
    OPTIONS:
      A. Skip to next phase
      B. Re-execute anyway (mark as revised)
      C. Cancel
    
    HALT_AND_WAIT()
  END IF
  
  // Execute phase
  ExecutePhase(key, phase)
  MarkPhaseComplete(key, phase)
  
  // Single execution per invocation
  TERMINATE("Phase " + phase + " complete")
END FUNCTION
```

---

## Handoff Chain Tracking

**Implement global handoff chain tracker:**

```
GLOBAL handoffChain = []

FUNCTION RecordHandoff(fromAgent, toAgent, key, reason)
  handoff = {
    from: fromAgent,
    to: toAgent,
    key: key,
    reason: reason,
    timestamp: NOW()
  }
  
  handoffChain.add(handoff)
  
  // Loop detection
  IF CountOccurrences(handoffChain, toAgent) > 2 THEN
    ERROR("Loop detected: " + toAgent + " invoked " + CountOccurrences(handoffChain, toAgent) + " times")
    TERMINATE()
  END IF
  
  // Chain length limit
  IF handoffChain.length > 5 THEN
    ERROR("Handoff chain too deep: " + handoffChain.length + " levels")
    TERMINATE()
  END IF
END FUNCTION

FUNCTION GetHandoffChain()
  RETURN handoffChain.map(h => h.from + "→" + h.to).join(" → ")
END FUNCTION
```

**Example usage:**
```
build.prompt.md:
  RecordHandoff("user", "build", null, "initial request")
  RecordHandoff("build", "plan", "my-feature", "multiple tasks detected")
  
plan.prompt.md:
  IF "plan" IN GetHandoffChain() THEN
    ERROR("Loop: plan already in chain: " + GetHandoffChain())
  END IF
  RecordHandoff("plan", "task", "my-feature", "plan complete")
  
task.prompt.md:
  IF "task" IN GetHandoffChain() THEN
    ERROR("Loop: task already in chain: " + GetHandoffChain())
  END IF
  ExecutePhases()
```

---

## Termination Conditions (MANDATORY)

**Every agent MUST have clear termination:**

### build.prompt.md Termination
```
TERMINATE_WHEN:
  - Handoff to target agent complete
  - User cancels
  - Invalid target specified (after warning)
```

### plan.prompt.md Termination
```
TERMINATE_WHEN:
  - Plan files written + handoff to task agent complete
  - User chooses existing key (redirect to todo/task)
  - User cancels during questionnaire
```

### todo.prompt.md Termination
```
TERMINATE_WHEN:
  - Task execution complete (auto-chain=false)
  - All phases complete (auto-chain=true)
  - Safety limit reached (max iterations)
  - User cancels
```

### task.prompt.md Termination
```
TERMINATE_WHEN:
  - Current phase complete
  - All phases complete
  - User requests stop
  - Error encountered (with checkpoint)
```

### ask.prompt.md Termination
```
TERMINATE_WHEN:
  - Answer provided
  - User chooses next action (handoff to other agent)
  - User cancels
```

---

## Session State Tracking

**Prevent redundant work within single session:**

```
SESSION_STATE = {
  contextLoaded: {
    architecture: false,
    infrastructure: false,
    testing: false
  },
  
  questionnairesGenerated: [],
  
  plansCreated: [],
  
  phasesExecuted: [],
  
  handoffs: []
}

FUNCTION MarkContextLoaded(contextType)
  SESSION_STATE.contextLoaded[contextType] = true
END FUNCTION

FUNCTION IsContextLoaded(contextType)
  RETURN SESSION_STATE.contextLoaded[contextType]
END FUNCTION

FUNCTION MarkQuestionnaireGenerated(key)
  SESSION_STATE.questionnairesGenerated.add(key)
END FUNCTION

FUNCTION IsQuestionnaireGenerated(key)
  RETURN SESSION_STATE.questionnairesGenerated.contains(key)
END FUNCTION
```

---

## User Override Protocol

**Allow user to break loops manually:**

```
USER_COMMANDS = {
  "force": "Bypass loop detection, proceed anyway",
  "reset": "Clear session state, start fresh",
  "cancel": "Terminate current workflow",
  "debug": "Show handoff chain and session state"
}

FUNCTION HandleUserOverride(command)
  SWITCH command
    CASE "force":
      CLEAR_LOOP_GUARDS()
      PROCEED()
    
    CASE "reset":
      CLEAR_SESSION_STATE()
      CLEAR_HANDOFF_CHAIN()
      RESTART()
    
    CASE "cancel":
      TERMINATE("User cancelled")
    
    CASE "debug":
      SHOW_HANDOFF_CHAIN()
      SHOW_SESSION_STATE()
      HALT_AND_WAIT()
  END SWITCH
END FUNCTION
```

---

## Monitoring & Alerts

**Log potential loops for monitoring:**

```
FUNCTION LogPotentialLoop(scenario, details)
  logEntry = {
    timestamp: NOW(),
    scenario: scenario,
    details: details,
    handoffChain: GetHandoffChain(),
    sessionState: SESSION_STATE
  }
  
  WriteToFile(".github/prompts/logs/loop-warnings.jsonl", logEntry)
  
  // Alert user if critical
  IF scenario.severity == "critical" THEN
    WARN_USER("⚠️ Potential infinite loop detected: " + scenario.description)
    SHOW_HANDOFF_CHAIN()
    OPTIONS:
      A. Continue anyway (at your own risk)
      B. Debug (show full state)
      C. Cancel
    HALT_AND_WAIT()
  END IF
END FUNCTION
```

---

## Testing Loop Prevention

**Test cases for loop detection:**

```
TEST_CASE: "Circular handoff detection"
  build → plan → build → SHOULD_TERMINATE("Loop detected")

TEST_CASE: "Duplicate key creation prevention"
  plan(key=X) → plan(key=X) → SHOULD_HALT("Key exists")

TEST_CASE: "Auto-chain depth limit"
  todo(auto-chain=true, phase=1→2→3→4→5) → SHOULD_STOP_AT(phase=5)

TEST_CASE: "Questionnaire re-generation prevention"
  plan → questionnaire → questionnaire → SHOULD_SKIP_SECOND()

TEST_CASE: "Context re-loading prevention"
  plan → loadArchitecture() → loadArchitecture() → SHOULD_SKIP_SECOND()
```

---

## See Also
- `.github/prompts/shared/agent-handoff-protocol.md` - Handoff formats and workflows
- `.github/prompts/shared/execution-flow.md` - Normal execution patterns
- `.github/prompts/shared/clean-exit-guarantee.md` - Graceful termination protocols
- `.github/prompts/build.prompt.md` - Build agent handoff logic
- `.github/prompts/plan.prompt.md` - Plan agent termination conditions
- `.github/prompts/todo.prompt.md` - Auto-chain loop prevention
