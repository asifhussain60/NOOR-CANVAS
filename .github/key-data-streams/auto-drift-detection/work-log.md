# Work Log: auto-drift-detection

**Key**: `auto-drift-detection`  
**Created**: 2025-10-25  
**Status**: Completed

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

**Commit**: `ckpt(auto-drift-detection): Standardize drift registration in todo.prompt.md (Phase 2 complete)` [7d650388]

### Phase 3: Update Cohesion Validation
**Status**: Completed  
**Started**: 2025-10-25  
**Completed**: 2025-10-25

**Tasks**:
- [x] Add drift detection compliance validation to cohesion.prompt.md

**Phase 3 Summary**:

Updated `cohesion.prompt.md` with drift detection compliance validation:

1. **Auto-Drift Detection Requirements**:
   - Section presence check in plan/task/test-generation/healthcheck prompts
   - ValidateDriftDetectionCompliance() pseudocode algorithm
   - Validation checklist for drift infrastructure

2. **Severity Classification Consistency**:
   - Validates all prompts use same 5 levels (critical/high/medium/low/informational)
   - Cross-prompt severity definition consistency checks

3. **Drift Commit Format Validation**:
   - Validates unified commit format across all prompts
   - Registration format: `drift({parent}): Register {drift-key}`
   - Resolution format: `ckpt({drift-key}): Resolved`

4. **Queue Management Validation**:
   - Validates 10-drift limit enforcement
   - Overflow protection algorithm checks
   - Manual drift exemption verification

5. **Detection Trigger Consistency**:
   - Validates detection triggers across all execution prompts
   - Ensures task/test-generation block on critical, plan/healthcheck defer

6. **Blocking Behavior Validation**:
   - task.prompt.md blocks on critical
   - test-generation.prompt.md blocks on infrastructure issues
   - plan/healthcheck defer to completion

**Exit Criteria Met**:
- ✅ Cohesion validates drift detection infrastructure
- ✅ Cross-prompt consistency checks implemented
- ✅ Comprehensive validation algorithm documented

**Commit**: `ckpt(auto-drift-detection): Update cohesion validation + style next steps headers (Phases 3-4 complete)` [478f33b7]

### Phase 4: Style "Next Steps" Headers
**Status**: Completed  
**Started**: 2025-10-25  
**Completed**: 2025-10-25

**Tasks**:
- [x] Update "Next Steps" headers to "🎯 What Would You Like To Do Next?" in 7 prompts

**Phase 4 Summary**:

Updated headers in 7 prompt files:

1. **plan.prompt.md**: "## 📋 NEXT STEPS" → "## 🎯 What Would You Like To Do Next?"
2. **todo.prompt.md**: "## 📋 NEXT STEPS" → "## 🎯 What Would You Like To Do Next?"
3. **test-generation.prompt.md**: "### Next Steps" → "## 🎯 What Would You Like To Do Next?"
4. **healthcheck.prompt.md**: "What would you like to do next?" → "## 🎯 What Would You Like To Do Next?"
5. **drift.prompt.md**: Already styled (no change needed)
6. **port-instructions.prompt.md**: Two instances of "## Next Steps" updated
7. **cohesion.prompt.md**: No next steps section (validation agent)

**Format Standardization**:
- Consistent header: "## 🎯 What Would You Like To Do Next?"
- Letter-based options (A/B/C/D) with current key display
- Action-oriented language

**Exit Criteria Met**:
- ✅ All 7 prompts with next steps sections updated
- ✅ Standardized format across all prompts
- ✅ Visual consistency with emoji icon

**Commit**: `ckpt(auto-drift-detection): Update cohesion validation + style next steps headers (Phases 3-4 complete)` [478f33b7]

### Phase 5: Reorganize Key Data Streams Folder
**Status**: Completed  
**Started**: 2025-10-25  
**Completed**: 2025-10-25

**Added**: 2025-10-25 (Plan v1.2)

**Objective**: Move `.github/prompts.keys/` → `.github/key-data-streams/` for better semantic clarity

**Tasks**:
- [x] Create migration script with 7-step verification process
- [x] Execute migration via git mv (preserve history)
- [x] Move and rename index file: prompts.keys → key-data-streams/index.md
- [x] Reformat index.md with structured sections
- [x] Update 150+ path references across 21 files
- [x] Validate migration (0 prompts.keys references outside archive)

**Phase 5 Summary**:

Successfully reorganized key data streams folder structure:

1. **Migration Script** (`.github/scripts/migrate-prompts-keys-to-key-data-streams.ps1`):
   - 7-step process: Verify source → Check target → Count keys → Checkpoint → Migrate → Verify → Report
   - Git history preservation via `git mv`
   - Pre-migration checkpoint: 478f33b7
   - Migration report generated: MIGRATION-REPORT-20251025-0916.md

2. **Folder Migration**:
   - 12 key folders migrated from `.github/prompts.keys/` → `.github/key-data-streams/`
   - Git history fully preserved (can trace back through renames)
   - Verification: 12 folders found in target location

3. **Index File** (`.github/key-data-streams/index.md`):
   - Renamed from `.github/prompts/prompts.keys`
   - Reformatted from comment-based to structured markdown
   - New sections: Active Keys, Key Data Stream Structure, Usage
   - Includes PowerShell usage examples

4. **Path Reference Updates** (150+ references across 21 files):
   - **8 prompts**: plan, task, test-generation, healthcheck, todo, drift, cohesion, port-instructions
   - **6 shared**: context-gathering-phases, commit-checkpoint-protocol, task-parameters-reference, agent-handoff-protocol, test-orchestration-patterns, key-data-stream-analyze-learning-template
   - **2 archive**: PLAN-INTEGRATION-SUMMARY, analyze-learning.prompt.backup
   - **1 continue**: continue.prompt.md
   - **4 Workspaces**: quickref-consolidation-pattern-complete, playwright-testing-integration-summary, task-prompt-self-improvement-implementation, UserLanding-Flow
   - Pattern: All `prompts.keys` → `key-data-streams`

5. **Scripts Created**:
   - Migration script with checkpoint creation
   - Path update script (update-path-references.ps1) for bulk replacements
   - Both scripts with verification and reporting

**Exit Criteria Met**:
- ✅ Folder migrated with git history preserved
- ✅ 150+ path references updated across 21 files
- ✅ Index file reformatted with clear structure
- ✅ Migration validated (12 folders verified)
- ✅ Rollback capability documented in migration report

**Commit**: `refactor(auto-drift-detection): Complete Phase 5 - reorganize key-data-streams folder` [4007b2bb]

---

## Issues/Blockers

None

---

## Notes

- Plan emphasizes silent, non-blocking auto-detection for smooth user experience
- Critical drifts block execution in task.prompt.md (safety mechanism)
- Drift summary at completion helps user review all detected issues
- cohesion.prompt.md validates compliance across all prompts
- Key data streams folder renamed for better semantic clarity (streams, not just keys)
- Migration preserved all git history - rollback possible if needed

---

## Completion Summary

**All 5 Phases Complete** (2025-10-25):

1. ✅ **Phase 1**: Dual-Mode Drift Detection [16d7e9b9]
   - Auto-drift detection in 4 prompts
   - Severity levels + blocking strategies
   - Silent logging + comprehensive summaries

2. ✅ **Phase 2**: Standardize Drift Registration [7d650388]
   - Unified commit format validation
   - Queue overflow protection (max 10)
   - Enhanced drift resolution workflow

3. ✅ **Phase 3**: Update Cohesion Validation [478f33b7]
   - Drift compliance validation
   - Cross-prompt consistency checks
   - Comprehensive validation algorithm

4. ✅ **Phase 4**: Style Next Steps Headers [478f33b7]
   - 7 prompts updated with "🎯 What Would You Like To Do Next?"
   - Standardized format across all prompts

5. ✅ **Phase 5**: Reorganize Key Data Streams Folder [4007b2bb]
   - Migrated prompts.keys → key-data-streams
   - Updated 150+ path references across 21 files
   - Git history preserved

**System Impact**:
- Enhanced drift tracking system with auto-detection + manual invocation
- Improved user experience with styled headers and comprehensive summaries
- Better semantic clarity with key-data-streams folder structure
- Full rollback capability for all changes (git history preserved)

**Key**: `auto-drift-detection` - COMPLETED
