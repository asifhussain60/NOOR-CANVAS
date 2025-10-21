# Action 03: Extract Shared Modules from plan.prompt.md

**Priority**: High  
**Effort**: 5 SP  
**Status**: Not Started  
**Created**: 2025-10-20  

---

## Description

plan.prompt.md is 3740 lines (largest prompt in system). Extract reusable sections to shared modules to improve maintainability and enable reuse across other agents.

---

## Problem

**Current State**:
- plan.prompt.md: 3740 lines (too large)
- Contains sections that could be reused by other agents
- Violates recommended max prompt size (2000 lines)
- Maintenance burden increases with size

**Target State**:
- plan.prompt.md: ~2500 lines (after extraction)
- Shared modules: 3 new files (~400 lines each)
- Better reusability across agents

**Impact**: High - improves maintainability, enables reuse

---

## Implementation Steps

### Step 1: Extract Image Analysis Protocol

**Source**: plan.prompt.md, Step 0.6 (Image Analysis via Vision API)  
**Lines**: ~150-200 lines  
**Target**: .github/prompts/shared/image-analysis-protocol.md

**Content to Extract**:
- Vision API invocation patterns
- Screenshot analysis workflow
- Annotated mockup interpretation
- Requirement extraction from images
- HTML documentation generation
- Test specification generation from visuals

**Usage**:
- plan.prompt.md references for Step 0.6
- task.prompt.md can reference if image analysis needed during execution
- test-generation.prompt.md can reference for visual test generation

**New File Structure**:
```markdown
# Image Analysis Protocol

**Version**: 1.0.0  
**Purpose**: Standardize AI-powered image analysis for requirement extraction

## When to Use
- User provides screenshots or mockups
- Visual requirements need interpretation
- Need to generate HTML from design
- Need to extract test specifications from visuals

## Workflow
1. Validate image files exist
2. Invoke vision API with appropriate prompt
3. Extract structured requirements
4. Generate HTML documentation or test specs
5. Present to user for approval

## Integration Points
- plan.prompt.md Step 0.6
- task.prompt.md (deprecated `annotate` parameter)
- test-generation.prompt.md (future)

## Examples
[Include examples from plan.prompt.md]
```

### Step 2: Extract Phase Breakdown Patterns

**Source**: plan.prompt.md, Step 2-4 (Phase breakdown, dependencies, test planning)  
**Lines**: ~200-250 lines  
**Target**: .github/prompts/shared/phase-breakdown-patterns.md

**Content to Extract**:
- How to break work into phases
- Phase dependency analysis
- Test planning per phase
- Validation checkpoints
- Success criteria definition
- Risk assessment per phase

**Usage**:
- plan.prompt.md references for Step 2-4
- task.prompt.md can reference for multi-phase execution
- refactor.prompt.md can use for large refactoring projects

**New File Structure**:
```markdown
# Phase Breakdown Patterns

**Version**: 1.0.0  
**Purpose**: Standardize multi-phase work planning

## Phase Identification
- How to identify natural phase boundaries
- Dependencies between phases
- Validation gates

## Test Planning
- Tests per phase
- Integration testing strategy
- E2E test coverage

## Success Criteria
- Phase completion definition
- Rollback triggers
- Progress tracking

## Examples
[Include examples from plan.prompt.md]
```

### Step 3: Consolidate Agent Handoff Protocol (Already in Action 01)

**Source**: plan.prompt.md, Step 6 (Handoff to task.prompt.md)  
**Lines**: ~100 lines  
**Target**: .github/prompts/shared/agent-handoff-protocol.md

**Note**: This is already being created in Action 01, so coordinate with that work.

**Content to Extract**:
- Handoff format specification
- Context passing mechanism
- Parameter mapping
- Invocation examples

### Step 4: Update plan.prompt.md with References

After extraction, update plan.prompt.md to reference shared modules:

**Replace Step 0.6**:
```markdown
### Step 0.6: Image Analysis (Optional)
**See**: [Image Analysis Protocol](shared/image-analysis-protocol.md)

If `annotate` parameter provided, invoke vision API for requirement extraction.
```

**Replace Step 2-4 sections**:
```markdown
### Step 2-4: Phase Breakdown and Planning
**See**: [Phase Breakdown Patterns](shared/phase-breakdown-patterns.md)

Break user request into logical phases with dependencies, tests, and success criteria.
```

**Replace Step 6**:
```markdown
### Step 6: Handoff to Task Agent
**See**: [Agent Handoff Protocol](shared/agent-handoff-protocol.md)

Generate task invocation with complete plan context.
```

### Step 5: Validate Extraction

- [ ] plan.prompt.md reduced from 3740 to ~2500 lines
- [ ] 3 new shared modules created (~1200 lines total)
- [ ] All references updated correctly
- [ ] No broken links
- [ ] Build succeeds
- [ ] Markdown lint passes

---

## Validation

### Pre-Implementation Checks
- [ ] Read plan.prompt.md in full
- [ ] Identify extraction candidates
- [ ] Verify no overlap with existing shared modules

### Post-Implementation Checks
- [ ] plan.prompt.md size: ~2500 lines (was 3740)
- [ ] image-analysis-protocol.md created (~400 lines)
- [ ] phase-breakdown-patterns.md created (~400 lines)
- [ ] agent-handoff-protocol.md updated (from Action 01)
- [ ] All references in plan.prompt.md valid
- [ ] Build succeeds
- [ ] No markdown lint errors

### Reusability Check
- [ ] task.prompt.md can reference image-analysis-protocol.md
- [ ] refactor.prompt.md can reference phase-breakdown-patterns.md
- [ ] Other agents can use agent-handoff-protocol.md

---

## Dependencies

**Blocked By**: None

**Blocks**: None

**Coordinates With**: Action 01 (agent-handoff-protocol.md)

---

## Files Affected

1. `.github/prompts/plan.prompt.md` - Reduce ~1200 lines, add 3 references
2. `.github/prompts/shared/image-analysis-protocol.md` - Create (~400 lines)
3. `.github/prompts/shared/phase-breakdown-patterns.md` - Create (~400 lines)
4. `.github/prompts/shared/agent-handoff-protocol.md` - Update (coordinate with Action 01)

---

## Estimated Time

- Analyze plan.prompt.md: 30 minutes
- Extract image-analysis-protocol.md: 45 minutes
- Extract phase-breakdown-patterns.md: 45 minutes
- Update agent-handoff-protocol.md: 20 minutes
- Update plan.prompt.md references: 30 minutes
- Validation and testing: 30 minutes

**Total**: ~3 hours (5 SP)

---

## Related Action Items

- Action 01: Integrate plan.prompt.md with task.prompt.md
- Action 02: Add plan.prompt.md to SystemIndex.md
