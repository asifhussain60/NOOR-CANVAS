# Prompt System Refactoring - Reality vs Documentation

**Date:** 2025-10-31  
**Purpose:** Align prompt documentation with actual Copilot capabilities  
**Source:** HANDOFF-FAILURE-ANALYSIS.md findings

---

## Core Problem Identified

**Current Documentation (route.prompt.md):**
> "The handoff is NOT simulated - it actually invokes the target prompt... EXECUTE AS AGENT → Follow target agent's instructions"

**Reality:**
- GitHub Copilot Workspace **CANNOT** programmatically invoke other prompts
- Copilot **CANNOT** "execute as agent" or "load and run" plan.prompt.md
- route.prompt.md can only create preparation files and show user what to do next

---

## Actual Copilot Capabilities

### ✅ What Copilot CAN Do

1. **Read and follow instructions** from prompt files
2. **Create files** in the workspace (markdown, JSON, code)
3. **Search and analyze** existing files
4. **Show formatted output** to the user
5. **Create handoff documentation** (JSON files with parameters)
6. **Update work logs** and key data streams
7. **Respond to user commands** (one command at a time)

### ❌ What Copilot CANNOT Do

1. **Programmatically invoke other prompts** (no `@workspace /plan` from code)
2. **Chain multiple prompt executions** automatically
3. **Load and execute** plan.prompt.md as a subroutine
4. **Transition control** to another agent
5. **Auto-execute** the next command without user input

---

## Correct Prompt System Architecture

### **Route's ACTUAL Role**

```
route.prompt.md PURPOSE:
├── Analyze user request
├── Detect complexity (single task vs multi-phase)
├── Determine target prompt (plan/task/todo/ask/test-generation)
├── Create handoff preparation files:
│   ├── .github/key-data-streams/{key}/handoffs/route-to-{target}.json
│   ├── .github/key-data-streams/{key}/work-log.md (initial entry)
│   └── .github/key-data-streams/{key}/context.json
├── Show user the NEXT COMMAND to execute
└── HALT (user executes next command manually)
```

**Key Point:** route creates handoff files, user invokes target prompt

---

### **Plan's ACTUAL Role**

```
plan.prompt.md PURPOSE:
├── Load handoff context from route (if exists)
├── Generate comprehensive plan with phases/tasks
├── Create plan files:
│   ├── {key}.plan.md (phased breakdown)
│   ├── {key}.plan.json (metadata)
│   └── handoffs/phase-{N}-{type}.json (for task/todo/test-generation)
├── Show user the plan summary
├── Offer auto-execute option (but CANNOT auto-invoke task.prompt.md)
└── User manually invokes task.prompt.md for execution
```

**Key Point:** plan creates task handoff files, user invokes task prompt

---

### **Task's ACTUAL Role**

```
task.prompt.md PURPOSE:
├── Load handoff JSON from plan (if exists)
├── Execute implementation tasks
├── Create checkpoints after each task
├── Update work-log.md progressively
├── Create test handoff JSONs (for test-generation)
├── Show completion summary
└── User manually invokes test-generation or next phase
```

**Key Point:** task executes work, user invokes test-generation if needed

---

## Refactored Workflow

### **User Journey (Corrected)**

```
Step 1: User runs route
@workspace /route key=hcp "comprehensive cleanup"

Step 2: route.prompt.md executes
- Analyzes request
- Detects multi-phase work
- Creates handoff files
- Shows output:
  ✅ Handoff prepared
  📁 Files created:
     - .github/key-data-streams/hcp/handoffs/route-to-plan.json
     - .github/key-data-streams/hcp/work-log.md
  
  📌 Next Command:
  @workspace /plan key=hcp

Step 3: User MANUALLY copies and executes
@workspace /plan key=hcp

Step 4: plan.prompt.md executes
- Loads route-to-plan.json for context
- Generates 8-phase plan
- Creates plan.md, plan.json, phase handoff JSONs
- Shows output:
  ✅ Plan created
  📁 Files created:
     - hcp.plan.md (8 phases)
     - hcp.plan.json
     - handoffs/phase-1-test.json
     - handoffs/phase-1-todo-1.json
     [...24 more handoff files]
  
  📌 Next Command:
  @workspace /test-generation #file:handoffs/phase-1-test.json

Step 5: User MANUALLY copies and executes
@workspace /test-generation #file:handoffs/phase-1-test.json

Step 6: test-generation.prompt.md executes
- Loads handoff JSON for parameters
- Generates test file
- Shows output with next command
  
  📌 Next Command:
  @workspace /todo #file:handoffs/phase-1-todo-1.json

Step 7-N: User continues executing handoff JSONs manually
```

**Key Insight:** User is the "executor" - they invoke each prompt based on recommendations

---

## Handoff JSON Format (Standard)

### **route-to-plan.json**
```json
{
  "handoffType": "route-to-plan",
  "from": "route",
  "to": "plan",
  "key": "hcp",
  "timestamp": "2025-10-31T...",
  "userRequest": "comprehensive cleanup of HostControlPanel",
  "analysis": {
    "complexity": "complex",
    "estimatedPhases": 8,
    "affectedLayers": ["UI"],
    "workType": "refactor"
  },
  "recommendedParams": {
    "auto-chain": true,
    "include-suggestions": "lightweight-mode"
  },
  "nextCommand": "@workspace /plan key=hcp auto-chain=true"
}
```

### **plan-to-task.json** (Phase 1)
```json
{
  "handoffType": "plan-to-task",
  "from": "plan",
  "to": "task",
  "key": "hcp",
  "phase": 1,
  "timestamp": "2025-10-31T...",
  "tasks": [
    {
      "id": "1a",
      "type": "test-generation",
      "description": "Create baseline test",
      "handoffFile": "handoffs/phase-1-test.json"
    },
    {
      "id": "1b",
      "type": "todo",
      "description": "Remove InjectAssetShareButtonsHubBased",
      "handoffFile": "handoffs/phase-1-todo-1.json"
    }
  ],
  "nextCommand": "@workspace /test-generation #file:handoffs/phase-1-test.json"
}
```

### **phase-1-test.json** (Leaf handoff)
```json
{
  "handoffType": "test-generation",
  "key": "hcp",
  "phase": 1,
  "scenario": "Baseline test for orphaned methods cleanup",
  "testFile": "tests/phase-1-baseline.spec.ts",
  "coverage": {
    "components": ["HostControlPanel"],
    "methods": ["InjectAssetShareButtonsHubBased", "CreateRedShareButtonHtml"]
  },
  "nextCommand": "@workspace /todo #file:handoffs/phase-1-todo-1.json"
}
```

---

## Updated Prompt Responsibilities

### **route.prompt.md (Analyzer & Router)**

**DOES:**
- ✅ Analyze request complexity
- ✅ Determine target prompt
- ✅ Create route-to-{target}.json handoff file
- ✅ Create initial work-log.md entry
- ✅ Show user next command

**DOES NOT:**
- ❌ Execute target prompt
- ❌ Transition control
- ❌ Auto-invoke plan/task/todo
- ❌ Generate plans or tasks (that's plan's job)

**Output Template:**
```markdown
## ✅ Routing Complete

**Key:** hcp
**Target:** plan.prompt.md
**Complexity:** Complex (8 phases estimated)

📁 **Handoff Files Created:**
- .github/key-data-streams/hcp/handoffs/route-to-plan.json
- .github/key-data-streams/hcp/work-log.md

📌 **Next Command (copy and execute):**
```
@workspace /plan key=hcp auto-chain=true
```

**What plan will do:**
- Generate 8-phase cleanup plan
- Create 24 handoff JSON files
- Estimate ~3-4 hours work
```

---

### **plan.prompt.md (Planner & Task Generator)**

**DOES:**
- ✅ Load route-to-plan.json if exists
- ✅ Generate comprehensive plan with phases
- ✅ Create {key}.plan.md and {key}.plan.json
- ✅ Create handoff JSONs for each task (phase-N-test.json, phase-N-todo-M.json)
- ✅ Show user next command (first phase)

**DOES NOT:**
- ❌ Execute tasks
- ❌ Auto-invoke task/todo/test-generation
- ❌ Run tests

**Output Template:**
```markdown
## ✅ Plan Created

**Key:** hcp
**Phases:** 8
**Tasks:** 24
**Estimated Duration:** 3-4 hours

📁 **Plan Files Created:**
- hcp.plan.md (detailed phase breakdown)
- hcp.plan.json (metadata)
- handoffs/phase-1-test.json
- handoffs/phase-1-todo-1.json
[...22 more handoff files]

📌 **Start Execution (Phase 1 - Create Baseline Test):**
```
@workspace /test-generation #file:.github/key-data-streams/hcp/handoffs/phase-1-test.json
```

**Execution Chain:**
Phase 1: test → todo-1 → todo-2 → validate → checkpoint
Phase 2: test → todo-3 → todo-4 → validate → checkpoint
[...continues through Phase 8]
```

---

### **task.prompt.md (Executor)**

**DOES:**
- ✅ Load handoff JSON for parameters
- ✅ Execute implementation tasks
- ✅ Create git checkpoints
- ✅ Update work-log.md
- ✅ Run validation
- ✅ Show next command

**DOES NOT:**
- ❌ Generate plans
- ❌ Auto-invoke next task
- ❌ Execute tests (delegates to test-generation)

---

### **todo.prompt.md (Single Task Executor)**

**DOES:**
- ✅ Load handoff JSON for parameters
- ✅ Execute single task
- ✅ Update work-log.md
- ✅ Create checkpoint
- ✅ Show next command (if auto-chain enabled)

**DOES NOT:**
- ❌ Generate multi-task plans
- ❌ Auto-invoke next task
- ❌ Replace plan (extends only)

---

### **test-generation.prompt.md (Test Creator)**

**DOES:**
- ✅ Load handoff JSON for parameters
- ✅ Generate test files
- ✅ Create orchestration scripts
- ✅ Show next command (implementation task)

**DOES NOT:**
- ❌ Run tests (user does that manually)
- ❌ Auto-invoke todo for implementation

---

## Updated Documentation Requirements

### **1. route.prompt.md Changes**

**Remove these sections:**
- ❌ "EXECUTE AS AGENT"
- ❌ "TRANSITION CONTROL"
- ❌ "actually invokes the target prompt"
- ❌ "Loads the target prompt file"

**Add these sections:**
- ✅ "Creates handoff preparation files"
- ✅ "Shows user next command to execute"
- ✅ "User manually invokes target prompt"

**Update Step 7:**
```markdown
## Step 7: Handoff Preparation

1. Create handoff JSON file:
   - .github/key-data-streams/{key}/handoffs/route-to-{target}.json
   - Contains: context, analysis, recommended params, next command

2. Create initial work-log entry:
   - .github/key-data-streams/{key}/work-log.md
   - Status: "Routing complete, awaiting plan"

3. Show user output with next command:
   - Display handoff summary
   - Show exact command to copy and execute
   - Explain what target prompt will do
   
4. HALT - wait for user to execute next command
```

---

### **2. plan.prompt.md Changes**

**Add Step 0.1: Load Handoff Context**
```markdown
## Step 0.1: Load Handoff Context (if exists)

handoffFile = ".github/key-data-streams/{key}/handoffs/route-to-plan.json"
IF exists(handoffFile) THEN
  context = loadJSON(handoffFile)
  userRequest = context.userRequest
  analysis = context.analysis
  // Use for plan generation
END IF
```

**Update Step 6: Handoff Preparation**
```markdown
## Step 6: Create Task Handoff Files

For each phase, create handoff JSONs:
1. phase-{N}-test.json → test-generation.prompt.md
2. phase-{N}-todo-{M}.json → todo.prompt.md

Show user first command to start execution:
@workspace /test-generation #file:handoffs/phase-1-test.json

User manually executes, then follows chain.
```

---

### **3. All Prompts Add Step 0: Load Handoff JSON**

**Standard pattern for task/todo/test-generation:**
```markdown
## Step 0: Load Handoff Context

handoffFile = ".github/key-data-streams/{key}/handoffs/{expected-file}.json"
IF exists(handoffFile) THEN
  params = loadJSON(handoffFile)
  // Use params for execution
ELSE
  // Use command-line parameters
END IF
```

---

## Benefits of Refactored System

### **1. Honest Documentation**
- No false promises of "auto-execution"
- Clear about user's role in workflow
- Matches Copilot's actual capabilities

### **2. Traceable Handoffs**
- Every handoff documented in JSON
- Complete audit trail in KDS
- Easy to resume after interruption

### **3. Flexible Execution**
- User can skip phases if needed
- User can modify handoff JSONs before executing
- User controls pace of execution

### **4. Debugging Support**
- Each prompt logs to work-log.md
- Handoff JSONs show exact parameters used
- Easy to identify where workflow failed

### **5. Consistent Pattern**
- All prompts follow same handoff protocol
- Load JSON → Execute → Update log → Show next command
- Predictable user experience

---

## Implementation Checklist

### **Phase 1: Update route.prompt.md**
- [ ] Remove "EXECUTE AS AGENT" language
- [ ] Add "Create handoff files" section
- [ ] Update Step 7 to "Handoff Preparation"
- [ ] Add output template with "Next Command"

### **Phase 2: Update plan.prompt.md**
- [ ] Add Step 0.1: Load Handoff Context
- [ ] Update Step 6 to create task handoff files
- [ ] Add "Next Command" to output template
- [ ] Remove "auto-execute" language

### **Phase 3: Update task.prompt.md**
- [ ] Add Step 0: Load Handoff JSON
- [ ] Add "Next Command" to output template
- [ ] Update work-log append with "next command" reference

### **Phase 4: Update todo.prompt.md**
- [ ] Add Step 0: Load Handoff JSON
- [ ] Add "Next Command" to output template (if auto-chain)
- [ ] Reference handoff JSON in work-log

### **Phase 5: Update test-generation.prompt.md**
- [ ] Add Step 0: Load Handoff JSON
- [ ] Add "Next Command" to output template
- [ ] Show implementation task command

### **Phase 6: Create kds-handoff-protocol.md**
- [ ] Document standard handoff JSON format
- [ ] Provide examples for each prompt type
- [ ] Document user workflow pattern

### **Phase 7: Update MANDATORY.md**
- [ ] Add "Manual Prompt Invocation" rule
- [ ] Reference kds-handoff-protocol.md
- [ ] Update Document-First protocol

---

## Testing Strategy

### **Test 1: route → plan handoff**
```bash
# Execute route
@workspace /route key=test-handoff "multi-phase test"

# Verify files created:
.github/key-data-streams/test-handoff/handoffs/route-to-plan.json ✓
.github/key-data-streams/test-handoff/work-log.md ✓

# User copies command from output
@workspace /plan key=test-handoff

# Verify plan loads route context ✓
```

### **Test 2: plan → task handoff**
```bash
# Execute plan
@workspace /plan key=test-handoff

# Verify files created:
test-handoff.plan.md ✓
test-handoff.plan.json ✓
handoffs/phase-1-test.json ✓
handoffs/phase-1-todo-1.json ✓

# User copies command from output
@workspace /test-generation #file:handoffs/phase-1-test.json

# Verify test-generation loads handoff JSON ✓
```

### **Test 3: Full workflow (route → plan → test → todo)**
- [ ] route creates handoff
- [ ] plan loads route handoff
- [ ] test-generation loads plan handoff
- [ ] todo loads test-generation handoff
- [ ] All work-log entries correct
- [ ] No auto-invocation attempts

---

## Conclusion

**Key Changes:**
1. **Removed false promises** - No more "EXECUTE AS AGENT"
2. **Added handoff files** - Standard JSON format for all handoffs
3. **User is executor** - Each prompt shows "Next Command"
4. **Traceable workflow** - Complete audit trail in KDS
5. **Honest documentation** - Matches Copilot's actual capabilities

**Result:**
- Clear user workflow
- Predictable behavior
- Maintainable system
- Accurate documentation

**Next Step:** Implement Phase 1 (update route.prompt.md)
