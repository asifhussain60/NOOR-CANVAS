# Key Data Streams - System Documentation

**Version**: 1.0.0  
**Last Updated**: 2025-01-19  
**Purpose**: Define canonical structure and usage patterns for key data stream folders

---

## Overview

The `.github/key-data-streams/` directory provides persistent, structured state tracking for all AI agent work. Each key represents a distinct work effort with its own folder containing execution history, plans, and tracking metadata.

---

## Folder Structure

### Canonical Structure

```
.github/key-data-streams/{key}/
├── {key}.plan.md              # Comprehensive plan (created by plan agent)
├── {key}.plan.json            # JSON phase tracking (created by plan, updated by task)
├── work-log.md                # Execution history (appended by all agents)
├── state.json                 # Current state metadata
├── rollback-index.md          # Checkpoint history (task/test agents)
├── tests/
│   └── test-registry.md       # Test inventory (test-generation agent)
└── _ARCHIVE/                  # Historical files (collapse-keys migrations)
    ├── work-logs/             # Merged work-log variants
    └── plans/                 # Superseded plan files
```

---

## Required Files by Agent

| Agent | Creates | Updates | Reads |
|-------|---------|---------|-------|
| **plan** | plan.md, plan.json, work-log.md, state.json | - | - |
| **task** | work-log.md, rollback-index.md | plan.json, state.json | plan.md, plan.json |
| **todo** | work-log.md | state.json | plan.md |
| **test-generation** | work-log.md, rollback-index.md, tests/test-registry.md | - | plan.md |
| **collapse-keys** | work-log.md (merged) | - | All files |
| **drift** | work-log.md | - | plan.md |
| **route** | - | - | index.md, plan.md |
| **cohesion** | - | - | All files (validation) |
| **healthcheck** | - | - | All files (validation) |

---

## File Specifications

### 1. {key}.plan.md

**Purpose**: Comprehensive plan specification for multi-phase work

**Created By**: plan.prompt.md (Step 5)

**Format**:
```markdown
# Plan: {key}

## Metadata
- **Key**: {key}
- **Created**: {ISO-8601 timestamp}
- **Status**: {not-started|in-progress|completed}
- **Branch**: {git-branch}

## Technology Stack Analysis
[UI framework, API patterns, database schemas detected]

## Phases
### Phase 1: {Title}
**Objective**: ...
**Deliverables**: ...
**Tests**: ...

[Repeat for each phase]

## System Context Pack
[APIs, database schemas, SignalR hubs, test data]
```

**Usage**: Loaded by task agent (Plan Integration Protocol) to execute phases

---

### 2. {key}.plan.json

**Purpose**: Structured JSON tracking for programmatic queries

**Created By**: plan.prompt.md (Step 5)

**Updated By**: task.prompt.md (after each phase completion)

**Schema**:
```json
{
  "key": "string",
  "status": "not-started|in-progress|completed",
  "createdAt": "ISO-8601 timestamp",
  "updatedAt": "ISO-8601 timestamp",
  "branch": "string",
  "phases": [
    {
      "phaseNumber": 1,
      "title": "string",
      "status": "not-started|in-progress|completed",
      "commit": "string|null",
      "startedAt": "ISO-8601 timestamp|null",
      "completedAt": "ISO-8601 timestamp|null"
    }
  ]
}
```

**Querying Examples**:
```powershell
# Get current phase
$plan = Get-Content ".github/key-data-streams/{key}/{key}.plan.json" | ConvertFrom-Json
$currentPhase = $plan.phases | Where-Object { $_.status -eq "in-progress" }

# Get completion percentage
$completed = ($plan.phases | Where-Object { $_.status -eq "completed" }).Count
$total = $plan.phases.Count
$percentage = ($completed / $total) * 100
```

---

### 3. work-log.md

**Purpose**: Chronological execution history for all work under this key

**Created By**: First agent to initialize key (plan, task, todo, etc.)

**Appended By**: All agents during execution

**CRITICAL RULES**:
- ✅ APPEND ONLY - Never rewrite or truncate
- ✅ Use canonical name: `work-log.md` (not work-log_*.md variants)
- ✅ Verify file size increased after append (Document First protocol)
- ✅ Include session markers for each execution

**Format**: See `shared/work-log-format.md` for complete specification

**Example Structure**:
```markdown
# Work Log: {key}

## Session: 2025-01-19 14:30 (plan agent)
**Action**: Created comprehensive plan with 4 phases
**Status**: Plan approved by user
**Next**: Handoff to task agent

---

## Session: 2025-01-19 15:00 (task agent)
**Action**: Executed Phase 1 - Database Schema
**Commit**: a1b2c3d
**Status**: Phase 1 complete
**Next**: Phase 2 - Backend Persistence

---
```

---

### 4. state.json

**Purpose**: Current state metadata for quick status checks

**Created By**: plan.prompt.md

**Updated By**: task.prompt.md, todo.prompt.md

**Schema**:
```json
{
  "key": "string",
  "status": "not-started|in-progress|completed",
  "currentPhase": 1,
  "lastUpdated": "ISO-8601 timestamp",
  "lastAgent": "plan|task|todo|test|etc",
  "branch": "string"
}
```

---

### 5. rollback-index.md

**Purpose**: Checkpoint history for git rollback operations

**Created By**: task.prompt.md (checkpoint-protocol.md)

**Format**:
```markdown
# Rollback Index: {key}

| Timestamp | Type | Description | Commit |
|-----------|------|-------------|--------|
| 2025-01-19 14:30 | ckpt | Pre-Phase 1 checkpoint | a1b2c3d |
| 2025-01-19 15:00 | ckpt | Pre-Phase 2 checkpoint | b2c3d4e |
| 2025-01-19 15:30 | test | Pre-test checkpoint | c3d4e5f |
```

**Querying Last Checkpoint**:
```powershell
$lastCheckpoint = (Get-Content ".github/key-data-streams/{key}/rollback-index.md" | 
  Select-String -Pattern '\| .* \| ckpt \| .* \| ([0-9a-f]{7,8}) \|' -AllMatches | 
  Select-Object -Last 1).Matches.Groups[1].Value
```

---

### 6. tests/test-registry.md

**Purpose**: Test inventory for this key

**Created By**: test-generation.prompt.md

**Format**:
```markdown
# Test Registry: {key}

| Test File | Scenario | Type | Status | Created |
|-----------|----------|------|--------|---------|
| verify-feature.spec.ts | Happy path | E2E | ✅ Passing | 2025-01-19 |
| visual-regression.spec.ts | UI consistency | Visual | ✅ Passing | 2025-01-19 |
```

---

## Key Lifecycle States

### State Transitions

```
not-started → in-progress → completed
     ↑             ↓
     └─────────────┘ (resume after pause)
```

**not-started**:
- Key folder exists
- plan.md and state.json created
- No execution yet

**in-progress**:
- Active work happening
- work-log.md being appended
- Phases progressing (plan.json updating)

**completed**:
- All phases done
- Final work-log entry
- state.json status = "completed"

---

## Integration Patterns

### Document First Protocol

**MANDATORY**: All agents must verify file finalization before showing user output

**Algorithm** (from shared/file-finalization-verifier.md):

```
1. Before execution: Record work-log.md file size
2. Execute work (append to work-log.md)
3. After execution: Verify work-log.md size increased
4. HALT if unchanged (append failed)
5. Only then show user response
```

**Enforcement Points**:
- plan.prompt.md: Step 5.5 (blocks Step 6 handoff)
- task.prompt.md: Step 8.25 (blocks Step 8.6 response)
- todo.prompt.md: Execution section (blocks response validation)

---

### Agent Handoff Context

**Context Carried Between Agents**:

When plan → task handoff:
1. ✅ Plan files automatically loaded by task agent
2. ✅ Technology stack analysis reused (no rediscovery)
3. ✅ Phase specifications guide execution
4. ✅ System Context Pack provides APIs/schemas

When task → test handoff:
1. ✅ UI changes detected from git diff
2. ✅ Test scenarios extracted from plan.md
3. ✅ Authentication requirements from plan

---

## File Naming Conventions

### Canonical Names (ENFORCED)

- ✅ `work-log.md` (singular, hyphenated)
- ✅ `{key}.plan.md` (key prefix)
- ✅ `{key}.plan.json` (matches .md name)
- ✅ `state.json` (no key prefix)
- ✅ `rollback-index.md` (singular)

### Legacy Names (DEPRECATED)

- ❌ `work-log_*.md` variants (only during collapse-keys migration)
- ❌ `*.plan.md` without key prefix
- ❌ Multiple plan files (should archive to _ARCHIVE/plans/)

**Migration**: collapse-keys.prompt.md handles legacy→canonical conversion

---

## Validation Checklist

**Required for All Keys**:
- ✅ Folder name matches key pattern: `[a-z0-9-]+`
- ✅ `work-log.md` exists and is append-only
- ✅ If plan exists: `{key}.plan.md` AND `{key}.plan.json` both present
- ✅ `state.json` status matches plan.json status
- ✅ No orphaned files (all files serve documented purpose)

**Phase-Specific**:
- ✅ If status=in-progress: work-log has recent entries (<24h)
- ✅ If status=completed: all phases in plan.json marked complete
- ✅ If tests exist: tests/test-registry.md present

---

## Troubleshooting

### Common Issues

**Issue**: Multiple work-log files (`work-log_*.md`)

**Fix**: Run collapse-keys with `--internal-only`:
```
@workspace /collapse-keys Key:{key} --internal-only:true
```

---

**Issue**: plan.json out of sync with plan.md

**Fix**: task agent updates plan.json after each phase. If manual fix needed:
```powershell
$plan = Get-Content "{key}.plan.json" | ConvertFrom-Json
$plan.status = "in-progress"
$plan.phases[0].status = "completed"
$plan | ConvertTo-Json -Depth 10 | Set-Content "{key}.plan.json"
```

---

**Issue**: state.json missing or corrupted

**Fix**: Regenerate from plan.json:
```powershell
$plan = Get-Content "{key}.plan.json" | ConvertFrom-Json
@{
  key = $plan.key
  status = $plan.status
  currentPhase = ($plan.phases | Where-Object {$_.status -eq "in-progress"})[0].phaseNumber
  lastUpdated = (Get-Date).ToString("o")
  lastAgent = "manual-fix"
  branch = $plan.branch
} | ConvertTo-Json | Set-Content "state.json"
```

---

## Related Documentation

- **work-log-format.md** - Complete work-log entry specification
- **json-tracking-schema.md** - Detailed JSON schemas for plan.json/state.json
- **agent-handoff-protocol.md** - How agents pass context via KDS files
- **file-finalization-verifier.md** - Document First protocol algorithm
- **collapse-keys.prompt.md** - Key consolidation and cleanup

---

## Version History

### v1.0.0 (2025-01-19)
- Initial KDS schema documentation
- Defined canonical structure for all 9 agents
- Documented file specifications and lifecycle states
- Added validation checklist and troubleshooting guide
- Established naming conventions and integration patterns
