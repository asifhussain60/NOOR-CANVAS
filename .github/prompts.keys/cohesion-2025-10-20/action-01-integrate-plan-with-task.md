# Action 01: Integrate plan.prompt.md with task.prompt.md

**Priority**: High  
**Effort**: 3 SP  
**Status**: Not Started  
**Created**: 2025-10-20  

---

## Description

plan.prompt.md (added 2025-10-20, 3740 lines) is a new planning orchestrator agent that hands off to task.prompt.md. However, task.prompt.md doesn't document receiving handoffs from plan.prompt.md, creating confusion for users.

---

## Problem

**Current State**:
- plan.prompt.md generates comprehensive plans and invokes task.prompt.md
- task.prompt.md has no documentation about plan handoffs
- No mention of plan.prompt.md in task.prompt.md's "Integration with Other Agents" section
- Users don't know when to use plan vs task directly

**Impact**: Medium - confusing for users, incomplete integration

---

## Implementation Steps

### Step 1: Document Plan Handoff in task.prompt.md

**File**: .github/prompts/task.prompt.md  
**Location**: "Integration with Other Agents" section (around line 150)

**Add**:
```markdown
### Integration with Other Agents
- **Called By**: 
  - **plan.prompt.md** (planning orchestrator) - Receives comprehensive execution plans
    - Plan includes: phased tasks, test specifications, branch strategy, constraints
    - Handoff format: `key`, `tasks`, `github-branch`, `debug-level`, `verbosity`
    - task agent executes phases sequentially per plan
  - Direct user invocation (for simple tasks without planning)
  
- **When to Use**:
  - **Use plan.prompt.md first** if:
    - Complex multi-phase implementation
    - Need comprehensive test plan
    - Want interactive planning with user approval
    - Requirements unclear or need refinement
  - **Use task.prompt.md directly** if:
    - Simple, well-defined task
    - Already have clear plan
    - Quick fix or minor change
    - Continuing existing work
```

### Step 2: Add Plan Handoff Protocol Documentation

**File**: .github/prompts/task.prompt.md  
**Location**: After "Parameters" section, before "Execution Workflow"

**Add**:
```markdown
### Plan Agent Handoff Protocol

When invoked by plan.prompt.md, task agent receives:

**Standard Parameters**:
- `key`: Task identifier (maps to key data stream)
- `tasks`: Multi-line list of subtasks from plan phases
- `github-branch`: Target branch for implementation (typically `development`)
- `debug-level`: Debug logging level (from plan defaults)
- `verbosity`: Output detail level (from plan defaults)

**Plan Context** (automatically loaded from key data stream):
- `.github/prompts.keys/{key}/{key}.plan.md` - Complete plan specification
- `.github/prompts.keys/{key}/work-log.md` - Execution history
- `.github/prompts.keys/{key}/{key}.plan.json` - Structured plan metadata

**Execution Flow**:
1. Load plan context from key data stream
2. Validate tasks match plan phases
3. Execute phases sequentially
4. Update work-log.md with progress
5. Mark phases complete in {key}.plan.json
6. Report completion back to user (plan agent monitors)
```

### Step 3: Update Example Section

**File**: .github/prompts/task.prompt.md  
**Location**: "How to Invoke" section

**Add example**:
```markdown
### Example: Via Plan Agent Handoff

**User initiates planning**:
```
@workspace /plan key=canvas-sharing user_request="Add share button to canvas" github-branch=development
```

**Plan agent generates plan, user approves, plan invokes task**:
```
Follow instructions in task.prompt.md.
key: canvas-sharing
github-branch: development
tasks:
Phase 1: Add ShareButton component
Phase 2: Implement share API endpoint
Phase 3: Create E2E test for sharing
```

**Task agent executes phases sequentially per plan.**
```

### Step 4: Create Shared Module for Handoff Protocol

**File**: .github/prompts/shared/agent-handoff-protocol.md

**Content**:
```markdown
# Agent Handoff Protocol

**Version**: 1.0.0  
**Purpose**: Standardize agent-to-agent handoffs

---

## plan.prompt.md → task.prompt.md Handoff

**When**: After user approves plan and says "proceed"

**Handoff Format**:
```
Follow instructions in task.prompt.md.
key: {key-identifier}
github-branch: {branch-name}
tasks:
{multi-line-task-list}
debug-level: {none|simple|trace}
verbosity: {concise|detailed}
```

**Context Carried**:
- Plan specification: `.github/prompts.keys/{key}/{key}.plan.md`
- Execution log: `.github/prompts.keys/{key}/work-log.md`
- Plan metadata: `.github/prompts.keys/{key}/{key}.plan.json`

**Responsibilities**:
- **plan.prompt.md**: Creates plan, gets approval, initiates handoff
- **task.prompt.md**: Loads plan context, executes phases, updates logs

---

## Other Handoff Patterns (Future)

- task.prompt.md → test-generation.prompt.md
- task.prompt.md → refactor.prompt.md
- refactor.prompt.md → healthcheck.prompt.md
- sync.prompt.md → healthcheck.prompt.md
```

---

## Validation

### Pre-Implementation Checks
- [ ] Read task.prompt.md "Integration with Other Agents" section
- [ ] Read plan.prompt.md handoff section (Step 6)
- [ ] Identify current gaps in documentation

### Post-Implementation Checks
- [ ] task.prompt.md documents plan handoff in "Integration" section
- [ ] task.prompt.md has "Plan Agent Handoff Protocol" section
- [ ] Example shows plan → task flow
- [ ] shared/agent-handoff-protocol.md created
- [ ] Build succeeds: `dotnet build`
- [ ] No markdown lint errors
- [ ] Cross-references valid (no broken links)

### User Acceptance
- [ ] Users can understand when to use plan vs task
- [ ] Handoff format is clear
- [ ] Context loading is documented

---

## Dependencies

**Blocked By**: None

**Blocks**: 
- Action 02 (Add plan to SystemIndex.md) - should document integration after implementation

---

## Files Affected

1. `.github/prompts/task.prompt.md` - Add 3 sections (~100 lines)
2. `.github/prompts/shared/agent-handoff-protocol.md` - Create new file (~80 lines)

---

## Estimated Time

- Read existing documentation: 15 minutes
- Write integration section: 20 minutes
- Write handoff protocol section: 20 minutes
- Create shared module: 15 minutes
- Update examples: 10 minutes
- Validation: 10 minutes

**Total**: ~90 minutes (3 SP)

---

## Related Action Items

- Action 02: Add plan.prompt.md to SystemIndex.md
- Action 03: Extract shared modules from plan.prompt.md
