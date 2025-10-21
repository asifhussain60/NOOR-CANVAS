# Action 02: Add plan.prompt.md to SystemIndex.md

**Priority**: High  
**Effort**: 1 SP  
**Status**: Not Started  
**Created**: 2025-10-20  

---

## Description

plan.prompt.md is a major new agent (3740 lines) added 2025-10-20 but not documented in SystemIndex.md. This makes the planning agent non-discoverable for users.

---

## Problem

**Current State**:
- SystemIndex.md lists 8 primary agents
- plan.prompt.md not included despite being comprehensive (3740 lines)
- Users don't know planning orchestrator exists
- No mention in "Quick Navigation" or "Active Prompt Agents"

**Impact**: Medium - planning agent not discoverable

---

## Implementation Steps

### Step 1: Add to "Active Prompt Agents" Section

**File**: .github/instructions/Links/SystemIndex.md  
**Location**: "Active Prompt Agents" → "Primary Agents" (after task.prompt.md, before question.prompt.md)

**Add**:
```markdown
- **plan.prompt.md** - Planning Orchestrator
  - Interactive planning agent for complex implementations
  - Refines user requests into phased, testable plans
  - Includes test specification generation
  - User approval gate before execution
  - Hands off to task.prompt.md for implementation
  - Image analysis support for visual requirements (Step 0.6)
  - **WHEN TO USE**: Complex multi-phase work, unclear requirements, need test plan
  - **HANDOFF**: Generates comprehensive plan → invokes task.prompt.md
  - **KEY FEATURES**:
    - Interactive refinement with user
    - Phase-based breakdown
    - Test specification generation
    - Enhancement suggestions
    - Branch strategy recommendation
```

### Step 2: Add to Quick Navigation

**File**: .github/instructions/Links/SystemIndex.md  
**Location**: "Quick Navigation" → "Architecture & Infrastructure" section (create new "Planning" subsection)

**Add** (new subsection before "Architecture & Infrastructure"):
```markdown
### Planning & Orchestration
- **plan.prompt.md** ⭐ - Interactive planning for complex implementations (requirement refinement, phased execution, test plans)
```

### Step 3: Add to Workflow Documentation

**File**: .github/instructions/Links/SystemIndex.md  
**Location**: After "Quick Navigation", create new section if doesn't exist

**Add**:
```markdown
### Recommended Workflows

#### Complex Feature Implementation
1. **plan.prompt.md** - Refine requirements, generate phased plan
2. **User approval** - Review and approve plan
3. **task.prompt.md** - Execute phases (invoked by plan)
4. **test-generation.prompt.md** - Generate E2E tests (invoked by task)
5. **healthcheck.prompt.md** - Validate implementation

#### Simple Task Implementation
1. **task.prompt.md** - Direct execution (skip planning)
2. **test-generation.prompt.md** - Generate tests if needed
3. **healthcheck.prompt.md** - Validate

#### Code Quality Improvement
1. **refactor.prompt.md** - Improve structure
2. **healthcheck.prompt.md** - Validate no behavior change
```

### Step 4: Update Agent Count

**File**: .github/instructions/Links/SystemIndex.md  
**Location**: Top of file, metadata section

**Update**:
```markdown
**Active Agents**: 9 (was 8)
- task, plan, question, test-generation, refactor, healthcheck, analyze-learning, sync, cohesion-review
```

---

## Validation

### Pre-Implementation Checks
- [ ] Read current SystemIndex.md
- [ ] Verify plan.prompt.md is not already documented
- [ ] Identify best location for new entry

### Post-Implementation Checks
- [ ] plan.prompt.md in "Active Prompt Agents" section
- [ ] plan.prompt.md in "Quick Navigation" section
- [ ] Workflow documentation includes plan usage
- [ ] Agent count updated to 9
- [ ] Build succeeds
- [ ] No markdown lint errors
- [ ] Cross-references valid

### User Acceptance
- [ ] Users can find planning agent in SystemIndex.md
- [ ] Clear when to use plan vs task directly
- [ ] Workflow guidance is helpful

---

## Dependencies

**Blocked By**: None (can be done independently)

**Blocks**: None (but recommended after Action 01 completes)

---

## Files Affected

1. `.github/instructions/Links/SystemIndex.md` - Add 3 sections (~50 lines)

---

## Estimated Time

- Read existing SystemIndex.md: 10 minutes
- Add to Active Prompt Agents: 10 minutes
- Add to Quick Navigation: 5 minutes
- Add workflow documentation: 10 minutes
- Validation: 5 minutes

**Total**: ~40 minutes (1 SP)

---

## Related Action Items

- Action 01: Integrate plan.prompt.md with task.prompt.md
- Action 03: Extract shared modules from plan.prompt.md
