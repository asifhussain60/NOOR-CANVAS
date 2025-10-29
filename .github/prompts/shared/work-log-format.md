# Work-Log Format Specification

**Version**: 1.0.0  
**Last Updated**: 2025-01-19  
**Purpose**: Canonical format for work-log.md entries across all agents

---

## Overview

The `work-log.md` file is the chronological execution history for all work under a key. It is **append-only** and provides a complete audit trail of agent actions, decisions, and outcomes.

---

## Critical Rules

### Append-Only Policy

- ✅ **APPEND** new entries to end of file
- ❌ **NEVER** rewrite or truncate existing content
- ❌ **NEVER** modify historical entries (except via collapse-keys merge)
- ✅ **VERIFY** file size increased after append (Document First protocol)

### Atomic Operations

All work-log appends must be atomic:
1. Read current file size
2. Append new entry
3. Verify file size increased
4. HALT if unchanged

**Verification Example** (PowerShell):
```powershell
$beforeSize = (Get-Item "work-log.md").Length
# ... append entry ...
$afterSize = (Get-Item "work-log.md").Length
if ($afterSize -le $beforeSize) {
    throw "work-log.md append FAILED - file size unchanged"
}
```

---

## Entry Format

### Session Entry Template

```markdown
## Session: {ISO-8601-date} {HH:MM} ({agent-name})

**Action**: {Brief description of what was done}
**Status**: {Current status after action}
**Next**: {What happens next}

{Optional details section}

---
```

### Field Specifications

**Session Header**:
- Format: `## Session: YYYY-MM-DD HH:MM (agent-name)`
- Date: ISO-8601 format (YYYY-MM-DD)
- Time: 24-hour format (HH:MM)
- Agent: Lowercase name (plan, task, todo, test-generation, drift, etc.)

**Action** (Required):
- One-sentence summary of execution
- Use past tense
- Be specific but concise

**Status** (Required):
- Current state after this session
- Examples: "Plan approved by user", "Phase 1 complete", "Tests passing"

**Next** (Required):
- What should happen in next session
- Examples: "Handoff to task agent", "Phase 2 - Backend", "User review"

**Details** (Optional):
- Expanded context if needed
- Bullet lists acceptable
- Keep concise (avoid walls of text)

---

## Examples by Agent

### plan.prompt.md Entry

```markdown
## Session: 2025-01-19 14:30 (plan)

**Action**: Created comprehensive plan for user-landing feature with 4 phases
**Status**: Plan approved by user
**Next**: Handoff to task agent for execution

**Plan Summary**:
- Phase 1: Database schema (canvas.UserPreferences)
- Phase 2: Backend persistence (UserPreferenceService)
- Phase 3: Frontend routing (AssetCanvasRouter.razor)
- Phase 4: E2E testing

---
```

---

### task.prompt.md Entry (Phase Completion)

```markdown
## Session: 2025-01-19 15:00 (task)

**Action**: Executed Phase 1 - Database schema migration
**Status**: Phase 1 complete, checkpoint committed (a1b2c3d)
**Next**: Phase 2 - Backend Persistence

**Changes**:
- Added canvas.UserPreferences table
- Migration: 20250119-add-user-preferences.sql
- EF model: UserPreference.cs
- Validated schema in KSESSIONS_DEV

**Tests**: Migration validated successfully

---
```

---

### todo.prompt.md Entry (Extension)

```markdown
## Session: 2025-01-19 16:00 (todo)

**Action**: Extended user-landing work to fix button alignment in AssetCanvasRouter
**Status**: UI fix applied, visual test passing
**Next**: User review and approval

**Details**:
- Fixed CSS flexbox alignment in .canvas-selector
- Updated visual regression test
- Percy snapshot captured

---
```

---

### test-generation.prompt.md Entry

```markdown
## Session: 2025-01-19 17:00 (test-generation)

**Action**: Generated E2E test for user-landing routing logic
**Status**: Test created and passing
**Next**: User can run test suite to validate

**Test Created**:
- File: Tests/UI/user-landing-routing.spec.ts
- Scenario: User selects asset canvas → routed correctly
- Type: Functional E2E
- Registry: Updated tests/test-registry.md

---
```

---

### drift.prompt.md Entry

```markdown
## Session: 2025-01-19 18:00 (drift)

**Action**: Detected 3 drift violations during user-landing work
**Status**: Drift queue created in work-log
**Next**: User can run @workspace /drift to process queue

**Violations**:
1. Database write to dbo.Sessions (READ-ONLY schema) - CRITICAL
2. Missing migration file for schema change - HIGH
3. No rollback script provided - MEDIUM

---
```

---

### collapse-keys.prompt.md Entry (Merge)

```markdown
## Session: 2025-01-19 19:00 (collapse-keys)

**Action**: Merged 3 prompt-* keys into prompt-merged
**Status**: Consolidation complete, source folders archived
**Next**: Use consolidated key for future prompt work

**Merged Keys**:
- prompt-enhancements (work-log: 45 entries)
- prompt-refactor (work-log: 12 entries)
- prompt-cleanup (work-log: 8 entries)

**Result**: Single canonical work-log.md with 65 chronological entries

<!-- Merged from work-log_prompt-enhancements.md on 2025-01-19 -->
<!-- Merged from work-log_prompt-refactor.md on 2025-01-19 -->
<!-- Merged from work-log_prompt-cleanup.md on 2025-01-19 -->

---
```

---

## Merge Markers

When collapse-keys merges multiple work-log files:

### Merge Marker Format

```markdown
<!-- Merged from {source-file} on {YYYY-MM-DD} -->
```

**Placement**: After merged content, before separator

**Example**:
```markdown
## Session: 2025-01-15 10:00 (task)
**Action**: Fixed button layout
**Status**: Complete
**Next**: User testing

<!-- Merged from work-log_prompt-enhancements.md on 2025-01-19 -->

---
```

---

## Section Markers

### Phase Markers (Optional)

For long work-logs spanning many phases:

```markdown
# ═══════════════════════════════════════════════════════
# PHASE 1: Database Schema
# ═══════════════════════════════════════════════════════

## Session: 2025-01-19 15:00 (task)
...

---

# ═══════════════════════════════════════════════════════
# PHASE 2: Backend Persistence
# ═══════════════════════════════════════════════════════

## Session: 2025-01-19 16:00 (task)
...

---
```

**When to Use**:
- Multi-phase work with >10 sessions
- Clear separation needed for readability
- User explicitly requests phase grouping

---

## Timestamp Format

### ISO-8601 Compliance

**Date**: YYYY-MM-DD (e.g., 2025-01-19)

**Time**: HH:MM (24-hour, e.g., 14:30)

**Combined**: `2025-01-19 14:30`

**Do NOT use**:
- ❌ MM/DD/YYYY (US format)
- ❌ 12-hour with AM/PM
- ❌ Abbreviated dates (Jan 19)

---

## File Size Verification

### Document First Protocol Integration

**Before Append**:
```powershell
$workLogPath = ".github/key-data-streams/{key}/work-log.md"
$sizeBefore = (Get-Item $workLogPath).Length
```

**After Append**:
```powershell
$sizeAfter = (Get-Item $workLogPath).Length
if ($sizeAfter -le $sizeBefore) {
    Write-Error "CRITICAL: work-log.md append FAILED"
    Write-Error "Expected size > $sizeBefore bytes, got $sizeAfter bytes"
    throw "Document First protocol violation"
}
```

**Enforcement**:
- plan.prompt.md: Step 5.5
- task.prompt.md: Step 8.25
- todo.prompt.md: Execution section

---

## Chronological Ordering

### Merge Chronology

When collapse-keys merges multiple work-logs:

1. Read all source work-log_*.md files
2. Extract session entries with timestamps
3. Sort by timestamp (oldest → newest)
4. Merge into single chronological sequence
5. Add merge markers after each source's content

**Example Order**:
```
Session: 2025-01-15 10:00 (from work-log_key-a.md)
Session: 2025-01-16 14:00 (from work-log_key-b.md)
Session: 2025-01-17 09:00 (from work-log_key-a.md)
Session: 2025-01-18 11:00 (from work-log_key-b.md)
```

---

## Validation Checklist

**Per Entry**:
- ✅ Session header with ISO-8601 date/time
- ✅ Agent name in lowercase
- ✅ Action, Status, Next fields present
- ✅ Separator `---` after entry
- ✅ No trailing whitespace

**Per File**:
- ✅ Entries in chronological order (oldest → newest)
- ✅ No duplicate session timestamps
- ✅ File ends with separator `---`
- ✅ No empty sessions (all fields populated)
- ✅ Append-only (no historical modifications)

---

## Integration with Other Files

### work-log ↔ plan.json

**Relationship**: work-log provides narrative, plan.json provides structure

**When Phase Completes**:
1. task agent appends to work-log.md
2. task agent updates plan.json phase status
3. Both must succeed atomically

**Example**:
```markdown
## Session: 2025-01-19 15:00 (task)
**Action**: Executed Phase 1 - Database Schema
**Status**: Phase 1 complete
```

```json
{
  "phases": [
    {
      "phaseNumber": 1,
      "status": "completed",
      "completedAt": "2025-01-19T15:00:00Z"
    }
  ]
}
```

---

### work-log ↔ rollback-index

**Relationship**: work-log documents work, rollback-index enables undo

**When Checkpoint Created**:
1. task agent commits checkpoint
2. task agent appends to work-log.md (narrative)
3. task agent appends to rollback-index.md (commit SHA)

**Example**:
```markdown
## Session: 2025-01-19 15:00 (task)
**Action**: Phase 1 checkpoint committed (a1b2c3d)
**Status**: Pre-Phase 2 checkpoint created
```

```markdown
# Rollback Index
| 2025-01-19 15:00 | ckpt | Pre-Phase 2 checkpoint | a1b2c3d |
```

---

## Anti-Patterns

### ❌ Rewriting Historical Entries

**NEVER** do this:
```markdown
## Session: 2025-01-15 10:00 (task)
~~**Status**: Complete~~
**Status**: FAILED - reverted  # DON'T MODIFY HISTORY
```

**CORRECT** approach:
```markdown
## Session: 2025-01-15 10:00 (task)
**Status**: Complete

---

## Session: 2025-01-19 14:00 (task)
**Action**: Reverted Phase 1 due to test failures
**Status**: Phase 1 rolled back to checkpoint a1b2c3d
**Next**: Re-execute Phase 1 with fixes
```

---

### ❌ Verbose Details

**AVOID** walls of text:
```markdown
## Session: 2025-01-19 15:00 (task)
**Action**: Implemented database schema
**Details**:
Here's the complete SQL migration script:
CREATE TABLE canvas.UserPreferences (
    UserId INT NOT NULL,
    ...
[200 lines of SQL]
```

**CORRECT** approach:
```markdown
## Session: 2025-01-19 15:00 (task)
**Action**: Implemented database schema migration
**Status**: Complete
**Next**: Backend persistence

**Changes**:
- Migration: 20250119-add-user-preferences.sql
- Table: canvas.UserPreferences (4 columns)
- Validated in KSESSIONS_DEV
```

---

### ❌ Missing Separator

**INCORRECT**:
```markdown
## Session: 2025-01-19 15:00 (task)
**Action**: Phase 1 complete
**Status**: Done
## Session: 2025-01-19 16:00 (task)  # Missing ---
```

**CORRECT**:
```markdown
## Session: 2025-01-19 15:00 (task)
**Action**: Phase 1 complete
**Status**: Done

---

## Session: 2025-01-19 16:00 (task)
```

---

## Related Documentation

- **README.md** - KDS schema overview
- **json-tracking-schema.md** - plan.json/state.json specifications
- **file-finalization-verifier.md** - Document First protocol algorithm
- **agent-handoff-protocol.md** - How agents use work-log for context

---

## Version History

### v1.0.0 (2025-01-19)
- Initial work-log format specification
- Defined session entry template
- Documented append-only policy and verification
- Added examples for all 9 agents
- Specified merge markers and chronological ordering
