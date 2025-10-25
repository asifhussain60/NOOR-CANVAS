# Work Log: auto-drift-detection

**Key**: `auto-drift-detection`  
**Created**: 2025-10-25  
**Status**: In Progress

---

## User Request

"Update prompts such that if copilot identifies an unrelated issue (not related to the work at hand), internally use drift.prompt.md to track changes and include it in the plan for AFTER the primary task is completed. This should be analyzed by all other prompts. Objective is to not lose track of drift items. Update cohesion prompt to ensure this rule. Update prompts so that 'What would you like to do next?' appears with icons and color as a header."

**Additional Context**:
- drift.prompt.md should support both agent auto-detection AND user manual invocation
- Auto-detected drifts should have severity levels (critical, high, medium, low, informational)
- Max auto-detected drifts per key: 10 (queue overflow protection)
- User gets summary of auto-detected drifts at completion

---

## Plan Approval

**Plan Version**: v1.1  
**Approved**: 2025-10-25  
**Approver**: User (confirmed all open questions: yes to all)

---

## Execution Log

### Phase 1: Dual-Mode Drift Detection
**Status**: In Progress  
**Started**: 2025-10-25

**Tasks**:
- [ ] Update drift.prompt.md with dual-mode support, severity levels, queue limits
- [ ] Update plan.prompt.md with auto-drift detection section
- [ ] Update task.prompt.md with auto-drift detection + critical blocking
- [ ] Update test-generation.prompt.md with auto-drift detection
- [ ] Update healthcheck.prompt.md with auto-drift detection

### Phase 2: Standardize Drift Registration
**Status**: Not Started

### Phase 3: Update Cohesion Validation
**Status**: Not Started

### Phase 4: Style "Next Steps" Headers
**Status**: Not Started

---

## Issues/Blockers

None

---

## Notes

- Plan emphasizes silent, non-blocking auto-detection for smooth user experience
- Critical drifts block execution in task.prompt.md (safety mechanism)
- Drift summary at completion helps user review all detected issues
- cohesion.prompt.md will validate compliance across all prompts
