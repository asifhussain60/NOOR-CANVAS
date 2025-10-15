# Action Item 02: Define Agent Handoff Protocol

**Priority**: HIGH (Phase 1 - Week 1)  
**Effort**: 2 Story Points  
**Impact**: Enable seamless multi-agent workflows, eliminate ambiguous integration

---

## Description

Create standardized protocol for how agents invoke each other, pass context, and coordinate workflows. Currently, prompts reference "route to X" without specifying HOW, leading to ambiguous integration and potential workflow failures.

---

## Files Affected

**New Files to Create**:
- `.github/prompts/shared/agent-protocols.md` - Canonical agent interaction specification

**Prompts to Update**:
- `.github/prompts/task.prompt.md` - Add agent invocation examples
- `.github/prompts/question.prompt.md` - Update test-generation routing with protocol
- `.github/prompts/refactor.prompt.md` - Update healthcheck triggering with protocol
- `.github/prompts/sync.prompt.md` - Update healthcheck triggering with protocol
- `.github/prompts/SelfAwareness.instructions.md` - Reference agent protocols

---

## Implementation Steps

### Step 1: Create Agent Protocols Document

**File**: `.github/prompts/shared/agent-protocols.md`

**Content**:

```markdown
# Agent Handoff and Integration Protocols

**Version**: 1.0.0  
**Last Updated**: 2025-10-11  
**Purpose**: Standardize how agents invoke, coordinate, and hand off work to each other

---

## 1. Agent Invocation Syntax

### 1.1 Direct User Invocation
When user directly invokes an agent:

```
Follow instructions in {agent-name}.prompt.md.
key: {key-name}
{parameter1}: {value1}
{parameter2}: {value2}
```

**Example**:
```
Follow instructions in task.prompt.md.
key: canvas
tasks: Fix submit button styling
verbosity: detailed
```

### 1.2 Agent-to-Agent Invocation
When one agent needs to invoke another:

**Routing Response Format**:
```markdown
## 🔄 Routing to {Agent Name}

This task requires specialized handling by the **{Agent Name}**.

### Recommended Invocation:
Follow instructions in {agent-file}.prompt.md.
key: {current-key}
{specific-parameters}

### Context Being Passed:
- Current key: {key-name}
- Work completed so far: {summary}
- Reason for handoff: {explanation}

### Expected Output:
{what the target agent should produce}

**Next Step**: {What user should do or what will happen automatically}
```

**Example (question → test-generation routing)**:
```markdown
## 🔄 Routing to Test Generation Agent

Your question about testing the debug panel requires creating a new Playwright test. This should be handled by the **Test Generation Agent**.

### Recommended Invocation:
Follow instructions in test-generation.prompt.md.
key: debug-panel
feature: islamic-questions-broadcast
scenario: verify random question appears on participant view

### Context Being Passed:
- Current key: debug-panel
- Feature implemented: Random Islamic question selection and broadcast
- API endpoint: POST /api/host/broadcast-random-islamic-question
- Work completed: Implementation done, needs E2E test validation

### Expected Output:
- Test file: `Tests/UI/debug-panel-islamic-questions-broadcast.spec.ts`
- Multi-browser test (host + participant contexts)
- Validation of SignalR broadcast

**Next Step**: Invoke test-generation.prompt.md with above parameters, or I can draft the test if you prefer.
```

---

## 2. Context Passing Mechanism

### 2.1 Key Metadata as Common Context
All agents share context via key metadata files:
- `Workspaces/Copilot/prompts.keys/{key}/{key}.md` - Key metadata
- `Workspaces/Copilot/prompts.keys/{key}/work-log.md` - Historical context

**Protocol**:
1. Invoking agent documents work completed in work-log.md
2. Target agent reads work-log.md for context
3. Target agent adds its work to work-log.md
4. Target agent updates key metadata status

### 2.2 Parameters as Explicit Context
When agent invokes another, pass context via parameters:

```
Follow instructions in {target-agent}.prompt.md.
key: {shared-key}
context: "{summary of work so far}"
handoff-reason: "{why routing to this agent}"
expected-output: "{what should be produced}"
```

**Example**:
```
Follow instructions in healthcheck.prompt.md.
key: hcp
context: "Refactored HtmlParsingService, consolidated patterns"
handoff-reason: "Validate no contract breakage after refactor"
expected-output: "Healthcheck report confirming API contracts intact"
```

### 2.3 File References as Context
Use file mappings from key metadata for automatic context loading:

```
Follow instructions in test-generation.prompt.md.
key: canvas
# Key metadata auto-loads:
# - SPA/NoorCanvas/Pages/SessionCanvas.razor
# - SPA/NoorCanvas/Controllers/QuestionController.cs
# - Tests/UI/canvas-session-212-full-test.spec.ts (reference)
```

---

## 3. Workflow Orchestration Patterns

### 3.1 Sequential Workflow (task → test → validate)
**Pattern**: task.prompt.md completes implementation → routes to test-generation → routes to healthcheck

**Implementation**:
1. **task.prompt.md Step 6.1**: Instead of generating test inline, route to test-generation.prompt.md
2. **test-generation.prompt.md**: Create test, update work-log, route to healthcheck
3. **healthcheck.prompt.md**: Validate system, report results, complete

**User Experience**:
- User invokes task.prompt.md once
- Agent suggests: "Next, invoke test-generation.prompt.md with [parameters]"
- User can accept routing or skip

### 3.2 Parallel Workflows (multiple independent agents)
**Pattern**: Run healthcheck and analyze-learning simultaneously

**Implementation**:
- Agents operate independently
- Share context via key metadata
- No coordination needed (read-only operations)

### 3.3 Conditional Routing (question agent routing)
**Pattern**: question.prompt.md analyzes question → routes to appropriate agent if needed

**Implementation**:
```markdown
IF question about testing
  THEN route to test-generation.prompt.md
ELSE IF question about architecture
  THEN answer directly using NOOR-CANVAS_ARCHITECTURE.MD
ELSE
  THEN investigate and answer
END IF
```

---

## 4. Return Value Conventions

### 4.1 Success Response
When agent completes successfully:

```markdown
## ✅ {Agent Name} Completed Successfully

**Key**: {key-name}  
**Work Completed**: {summary}  
**Files Modified**: {count} files  
**Validation**: {PASS | with warnings}  
**Commit**: {commit-sha} - {commit-message}

### Deliverables
- {deliverable 1}
- {deliverable 2}

### Next Steps
{What should happen next, if anything}
```

### 4.2 Failure Response
When agent encounters blocking issue:

```markdown
## ❌ {Agent Name} Failed

**Key**: {key-name}  
**Reason**: {error description}  
**Failed Step**: {which step failed}  
**Error Details**: {stack trace or diagnostic info}

### Rollback Performed
- Reverted to checkpoint: {commit-sha}
- System state: {clean | with artifacts}

### Recommended Action
{What user should do to resolve}
```

### 4.3 Routing Response
When agent routes to another agent (see Section 1.2)

---

## 5. Agent Registry

### 5.1 Registry Purpose
Map agent capabilities to enable intelligent routing and dependency tracking.

### 5.2 Registry Structure
**File**: `.github/prompts/agents.json`

```json
{
  "agents": {
    "task": {
      "file": "task.prompt.md",
      "role": "Task Executor",
      "capabilities": [
        "implementation",
        "testing",
        "commit",
        "key-management"
      ],
      "can_invoke": [
        "test-generation",
        "refactor",
        "healthcheck"
      ],
      "parameters": {
        "required": ["key"],
        "optional": ["debug-level", "verbosity", "tasks", "annotate"]
      }
    },
    "question": {
      "file": "question.prompt.md",
      "role": "Knowledge Agent",
      "capabilities": [
        "investigation",
        "analysis",
        "routing"
      ],
      "routes_to": [
        "test-generation"
      ],
      "parameters": {
        "required": [],
        "optional": ["depth", "context", "verbosity"]
      }
    },
    "test-generation": {
      "file": "test-generation.prompt.md",
      "role": "Test Creator",
      "capabilities": [
        "playwright-test-creation",
        "multi-browser-tests",
        "api-validation"
      ],
      "can_invoke": [
        "healthcheck"
      ],
      "parameters": {
        "required": ["feature", "scenario"],
        "optional": ["endpoints", "tokens", "multiUser"]
      }
    },
    "refactor": {
      "file": "refactor.prompt.md",
      "role": "Structural Integrity",
      "capabilities": [
        "code-quality-improvement",
        "architecture-cleanup",
        "naming-standardization"
      ],
      "can_invoke": [
        "healthcheck"
      ],
      "parameters": {
        "required": ["scope"],
        "optional": ["key", "notes", "verbosity"]
      }
    },
    "healthcheck": {
      "file": "healthcheck.prompt.md",
      "role": "System Validator",
      "capabilities": [
        "read-only-validation",
        "contract-verification",
        "architecture-audit"
      ],
      "can_invoke": [],
      "parameters": {
        "required": [],
        "optional": ["scope", "verbosity", "notes"]
      }
    },
    "sync": {
      "file": "sync.prompt.md",
      "role": "Synchronization and Cleanup",
      "capabilities": [
        "documentation-sync",
        "configuration-updates",
        "cleanup"
      ],
      "can_invoke": [
        "healthcheck"
      ],
      "parameters": {
        "required": ["key"],
        "optional": ["notes", "verbosity"]
      }
    },
    "analyze-learning": {
      "file": "analyze-learning.prompt.md",
      "role": "Pattern Analysis",
      "capabilities": [
        "pattern-extraction",
        "success-analysis",
        "efficiency-recommendations"
      ],
      "can_invoke": [],
      "parameters": {
        "required": ["scope"],
        "optional": ["analysis-type", "verbosity"]
      }
    },
    "cohesion-review": {
      "file": "cohesion-review.prompt.md",
      "role": "System Cohesion Auditor",
      "capabilities": [
        "redundancy-detection",
        "gap-analysis",
        "conflict-detection",
        "efficiency-analysis"
      ],
      "can_invoke": [],
      "parameters": {
        "required": [],
        "optional": ["scope", "verbosity", "output-format", "auto-fix", "create-action-items"]
      }
    }
  }
}
```

### 5.3 Registry Usage
- **Routing Logic**: question agent checks registry to find test-generation capabilities
- **Capability Discovery**: User asks "which agent can create tests?" → query registry
- **Dependency Tracking**: Understand agent relationships and workflows

---

## 6. Multi-Agent Collaboration

### 6.1 Coordination via Work Log
**Pattern**: Multiple agents working on same key

**Protocol**:
1. Agent A: Check work-log.md for conflicts (is another agent active?)
2. Agent A: Add entry to work-log.md: "Starting {task} at {timestamp}"
3. Agent A: Perform work
4. Agent A: Update work-log.md: "Completed {task} at {timestamp}, commit {sha}"
5. Agent B: Read work-log.md to see Agent A's work
6. Agent B: Continue from Agent A's final state

### 6.2 Handoff Checklist
When handing off to another agent:
- [ ] Document work completed in work-log.md
- [ ] Update key metadata status
- [ ] Provide clear routing response to user
- [ ] Specify expected output from target agent
- [ ] Include all necessary context in handoff parameters

---

## 7. Error Handling and Rollback

### 7.1 Agent Failure Mid-Workflow
**If agent fails during multi-agent workflow**:
1. Agent performs rollback to checkpoint commit
2. Agent documents failure in work-log.md
3. Agent returns failure response (Section 4.2)
4. Workflow halts (does NOT continue to next agent)
5. User must resolve issue before re-attempting

### 7.2 Orphaned Work
**If agent invoked but previous agent didn't complete**:
1. Check work-log.md for incomplete entries
2. Check git status for uncommitted changes
3. If found, warn user: "Previous work incomplete, recommend completing or rolling back first"
4. User can choose to continue or abort

---

## 8. Examples

### Example 1: task → test-generation → healthcheck
```
# User invokes task
Follow instructions in task.prompt.md.
key: canvas
tasks: Add delete button to questions

# task.prompt.md completes implementation, routes:
## 🔄 Routing to Test Generation Agent
Follow instructions in test-generation.prompt.md.
key: canvas
feature: question-delete
scenario: verify delete button removes question

# User invokes test-generation
Follow instructions in test-generation.prompt.md.
key: canvas
feature: question-delete
scenario: verify delete button removes question

# test-generation completes, routes:
## 🔄 Routing to Healthcheck Agent
Follow instructions in healthcheck.prompt.md.
key: canvas
context: "Added delete feature + E2E test"

# User invokes healthcheck
Follow instructions in healthcheck.prompt.md.
key: canvas
scope: all

# healthcheck validates, workflow complete ✅
```

### Example 2: question routing to test-generation
```
# User asks question
@workspace /question "How do I test the share asset feature?"

# question.prompt.md recognizes test-related question, routes:
## 🔄 Routing to Test Generation Agent
Follow instructions in test-generation.prompt.md.
key: hcp
feature: share-asset
scenario: verify asset broadcast to participants

# User invokes test-generation (or question agent can draft test)
```

---

## Version History

- **v1.0.0** (2025-10-11): Initial protocol definition
  - Agent invocation syntax
  - Context passing mechanism
  - Workflow orchestration patterns
  - Return value conventions
  - Agent registry structure
  - Multi-agent collaboration protocols
```

---

## Validation

### Success Criteria

1. ✅ agent-protocols.md created with all 8 sections
2. ✅ agents.json registry created with all 8 agents
3. ✅ All prompts updated to reference protocols
4. ✅ Routing examples updated in question.prompt.md
5. ✅ SelfAwareness.instructions.md references protocols
6. ✅ Test multi-agent workflow (task → test → healthcheck)

### Testing

1. **Test routing**: question.prompt.md → test-generation.prompt.md
2. **Test context passing**: Verify work-log.md shared between agents
3. **Test registry**: Query capabilities from agents.json
4. **Test workflow**: Complete task → test → healthcheck sequence

---

## Dependencies

- None (independent action item)

---

## Estimated Timeline

- **Analysis**: 15 minutes (review existing routing patterns)
- **Protocol Design**: 45 minutes (write agent-protocols.md)
- **Registry Creation**: 30 minutes (write agents.json)
- **Prompt Updates**: 30 minutes (update 5 prompts with protocol references)
- **Testing**: 30 minutes (test multi-agent workflows)
- **Total**: ~2.5 hours (2 story points)

---

## ROI

**Immediate Benefits**:
- Clear standard for agent invocation (no more ambiguity)
- Seamless multi-agent workflows
- Better error handling and rollback
- Improved user experience (clear routing responses)

**Long-Term Benefits**:
- Future agents can plug into existing protocol
- Enables intelligent routing (router agent)
- Better workflow orchestration
- Reduced integration bugs

**Risk Reduction**:
- Prevents broken agent handoffs
- Reduces orphaned work
- Better failure recovery

---

## Notes

- **Agent Registry**: Foundation for future router agent implementation
- **Version Control**: Protocol is versioned to track breaking changes
- **Extensibility**: Easy to add new agents to registry
- **Documentation**: Comprehensive examples ensure clear understanding
