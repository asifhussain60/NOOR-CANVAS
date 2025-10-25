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
**Status**: Completed  
**Started**: 2025-10-25  
**Completed**: 2025-01-20  
**Commit**: 16d7e9b9

**Tasks**:
- [x] Update drift.prompt.md with dual-mode support, severity levels, queue limits
- [x] Update plan.prompt.md with auto-drift detection section
- [x] Update task.prompt.md with auto-drift detection + critical blocking
- [x] Update test-generation.prompt.md with auto-drift detection
- [x] Update healthcheck.prompt.md with auto-drift detection

**Phase 1 Summary**:

Added comprehensive auto-drift detection to all execution prompts:

1. **plan.prompt.md**: Detection during evidence gathering/planning, silent logging, drift summary at completion
2. **task.prompt.md**: Context/execution/validation detection, **critical blocking** (HALT on severity=critical), user choice handling
3. **test-generation.prompt.md**: Test infrastructure detection, **infrastructure blocking** (HALT on critical infrastructure issues)
4. **healthcheck.prompt.md**: System-wide analysis, **non-blocking** (read-only), organized drift queues

**Key Features**:
- ✅ Shared severity classification (critical/high/medium/low/informational)
- ✅ Blocking strategy: task/test-generation block on critical, plan/healthcheck defer
- ✅ User choice handling for critical issues (fix now / continue / abort)
- ✅ Silent logging to work-log.md (no chat interruption)
- ✅ Comprehensive drift summary at completion
- ✅ Standardized drift commit format with mode/severity/phase

**Commit**: `ckpt(auto-drift-detection): Add auto-drift detection to all prompts (Phase 1 complete)` [16d7e9b9]

### Phase 2: Standardize Drift Registration
**Status**: Completed  
**Started**: 2025-10-25  
**Completed**: 2025-10-25

**Tasks**:
- [x] Add comprehensive drift summary to todo.prompt.md
- [x] Implement unified commit format validation
- [x] Add queue overflow protection (max 10 auto drifts)

**Phase 2 Summary**:

Updated `todo.prompt.md` with comprehensive drift management:

1. **Drift Summary Generation**:
   - Severity-sorted presentation (critical → high → medium → low → informational)
   - Auto/manual mode distinction in summary
   - Queue status display ({count}/10 drifts)
   - User choice handling (A: critical only, B: all, C: specific, D: defer)

2. **Unified Commit Format Validation**:
   - Drift registration format: `drift({parent}): Register {drift-key}` with mode/severity/triggered-by
   - Drift resolution format: `ckpt({drift-key}): Resolved` with parent/remaining/severity/mode
   - Validation algorithm with format checking
   - 4 valid modes: auto, manual, user-critical, auto-deferred
   - 5 valid severity levels: critical, high, medium, low, informational

3. **Queue Overflow Protection**:
   - Max 10 auto-detected drifts per parent key
   - Overflow handling: remove oldest low-priority drift or block if all medium/high/critical
   - Manual drifts exempt from limit (user explicitly registered)
   - Warning at 9/10 capacity

4. **Enhanced Drift Resolution Workflow**:
   - Selective resolution (critical only, all, specific drifts, or defer)
   - Severity-based ordering
   - Drift depth enforcement (max 3 levels)
   - Comprehensive git query examples

**Exit Criteria Met**:
- ✅ Unified commit format documented and validated
- ✅ Queue overflow protection implemented with pseudocode
- ✅ Drift summary format defined with severity sorting
- ✅ todo.prompt.md generates comprehensive drift summary at completion

### Phase 3: Update Cohesion Validation
**Status**: Not Started

### Phase 4: Style "Next Steps" Headers
**Status**: Not Started

### Phase 5: Reorganize Key Data Streams Folder
**Status**: Not Started

**Added**: 2025-10-25 (Plan v1.2)

**Objective**: Move `.github/prompts.keys/` → `.github/key-data-streams/` for better semantic clarity

**Scope**:
- Create migration script with git history preservation
- Update 150+ path references across 17 files (prompts, shared, archive, index)
- Review and standardize index file format
- Validation: 0 prompts.keys references outside archive

---

## Issues/Blockers

None

---

## Notes

- Plan emphasizes silent, non-blocking auto-detection for smooth user experience
- Critical drifts block execution in task.prompt.md (safety mechanism)
- Drift summary at completion helps user review all detected issues
- cohesion.prompt.md will validate compliance across all prompts
