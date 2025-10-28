# Plan Generator Algorithm

**Purpose:** Generate comprehensive technical plan from analyzed requirements

**Used by:** plan.prompt.md (Step 2)

---

## Algorithm

**Input:** requirements, context_package, complexity, key

**Output:** plan_document { phases[], files[], tests[], rollback }

---

## Plan Structure

**1. Overview Section**
- Work description (1-2 sentences)
- Key assignment
- Complexity level
- Affected layers

**2. Phase Breakdown**
- Phase number and name
- Phase goal (1 sentence)
- Steps (3-7 per phase)
- Files modified
- Success criteria

**3. File Impact List**
- File path
- Change type (create, modify, delete)
- Purpose of change
- Dependencies

**4. Test Strategy**
- Test types needed (unit, E2E, visual)
- Test scenarios
- Coverage requirements
- Percy snapshots (if UI)

**5. Rollback Plan**
- Commit checkpoints
- Rollback commands
- Safe rollback points
- Data migration reversals

---

## Phase Breakdown Rules

**Single phase work (score ≤ 4):**
- All changes in one phase
- Quick implementation
- Minimal risk

**Multi-phase work (score 5-10):**
- 2-3 phases
- Logical grouping
- Phase dependencies clear

**Complex work (score > 10):**
- 3-5 phases
- Build incrementally
- Test after each phase
- Commit checkpoints mandatory

---

## Phase Organization Patterns

**By Layer (multi-layer changes):**
- Phase 1: Database/Models
- Phase 2: Services/API
- Phase 3: UI Components
- Phase 4: SignalR/Real-time
- Phase 5: Testing

**By Feature (horizontal changes):**
- Phase 1: Core functionality
- Phase 2: Validation/Error handling
- Phase 3: UI/UX polish
- Phase 4: Testing
- Phase 5: Documentation

**By Risk (high-risk changes):**
- Phase 1: Non-breaking changes
- Phase 2: New features (opt-in)
- Phase 3: Breaking changes (controlled)
- Phase 4: Migration/cleanup
- Phase 5: Validation

---

## File Impact Analysis

**For each file:**
- Detect change type
- Identify dependencies
- Note testing requirements
- Flag breaking changes

**Example:**
```
SPA/NoorCanvas/Pages/SessionCanvas.razor
  Change: Modify
  Purpose: Add share button UI
  Dependencies: ShareAssetHub.cs
  Testing: E2E + Percy visual
  Breaking: No
```

---

## Test Strategy Generation

**Based on work type:**
- UI changes → Percy visual regression
- API changes → Unit + integration tests
- SignalR changes → E2E multi-client tests
- Database changes → Migration tests

**Test coverage requirements:**
- Critical paths: 100%
- New features: 90%
- Bug fixes: Add regression test
- Refactors: Maintain existing coverage

---

## Success Criteria Definition

**Per phase:**
- Functional criteria (feature works)
- Quality criteria (no errors, warnings)
- Performance criteria (if applicable)
- UX criteria (user can complete flow)

**Example:**
```
Phase 1 Success Criteria:
✓ Share button renders in SessionCanvas toolbar
✓ Button shows hover animation
✓ No console errors
✓ Percy snapshot matches design
```

---

## Rollback Strategy

**Commit checkpoints:**
- After each phase completion
- Before risky changes
- After database migrations
- After configuration updates

**Rollback commands:**
```
git reset --hard {checkpoint-commit-hash}
dotnet ef database update {previous-migration}
```

---

## Output Format

```markdown
# {key} Plan

## Overview
Work: {one-liner}
Key: {key}
Complexity: {level} ({score}/15)
Layers: {UI|API|Service|DB|SignalR}

## Phases

### Phase 1: {name}
Goal: {one-sentence}

Steps:
1. {step-description} - {file-path}
2. {step-description} - {file-path}

Success: {criteria}

### Phase 2: {name}
...

## Files Affected ({count})
1. {file-path} - {change-type} - {purpose}

## Testing Strategy
- E2E: {scenarios}
- Percy: {snapshot-points}
- Unit: {coverage}

## Rollback
Checkpoints: After Phase 1, 2, 3
Command: git reset --hard {hash}
```

---

## See Also

- `../plan.prompt.md` - Step 2 implementation
- `phase-breakdown-patterns.md` - Common patterns
- `test-strategist.md` - Test planning
