# Prompt Key Data Streams

This directory contains JSON files tracking the lifecycle of task, refactor, and sync operations executed through GitHub Copilot prompts.

## Purpose

The key data stream system provides:
- **Persistent State Tracking**: Keys maintain state across conversation sessions
- **Lifecycle Management**: Track progression through execution phases
- **Historical Record**: Maintain history of completed tasks
- **Resume Capability**: Resume interrupted workflows
- **Alphabetical Organization**: Keys are automatically sorted alphabetically

## Structure

Each key is stored as a JSON file: `{key-name}.json`

Example:
```
prompts.keys/
├── README.md                          # This file
├── _template.json                     # Template for creating new keys
├── doc.json                           # Documentation tasks
├── hcp.json                           # Host Control Panel tasks
└── session-transcript-css.json        # Session transcript styling tasks
```

## Key Lifecycle States

1. **not-started** - Key created but not yet executed
2. **in-progress** - Key execution in progress
3. **completed** - Key execution completed successfully
4. **validated** - Key execution validated with zero errors/warnings
5. **failed** - Key execution failed and requires manual intervention

## Execution Phases Tracked

Each key tracks the following phases:

### 1. Checkpoint Phase
- Create safety checkpoint commit before execution
- Ensures rollback capability
- Format: `checkpoint: pre-task {key}`

### 2. Plan Phase
- Parse parameters (key, debug-level, tasks)
- Generate step-by-step execution plan
- Identify dependencies and validation requirements
- Present plan for approval

### 3. Execute Phase
- Carry out subtasks in sequence
- Apply guardrails from SelfAwareness
- Run analyzers, linters, and tests
- Validate API contracts if applicable
- Respect debug-level for logging verbosity

### 4. Validate Phase
- Ensure acceptance criteria met
- Confirm no architectural drift
- Verify zero errors and zero warnings
- Ensure analyzer/linter checks pass
- Confirm all relevant tests pass

### 5. Confirm Phase
- Provide human-readable summary
- Restate key and keylock status
- Report success or failure details
- Update key data stream file

## Key Data Structure

Each key JSON file contains:

```json
{
  "key": "example-key-name",
  "status": "in-progress",
  "mode": "task",
  "debug_level": "simple",
  "created": "2025-10-09T10:00:00Z",
  "updated": "2025-10-09T15:30:00Z",
  "phases": {
    "checkpoint": {
      "status": "completed",
      "duration": "35s",
      "timestamp": "2025-10-09T10:01:00Z"
    },
    "plan": {
      "status": "completed",
      "duration": "2m15s",
      "timestamp": "2025-10-09T10:03:00Z"
    },
    "execute": {
      "status": "in-progress",
      "duration": "8m15s",
      "timestamp": "2025-10-09T10:12:00Z"
    },
    "validate": {
      "status": "pending",
      "duration": null,
      "timestamp": null
    },
    "confirm": {
      "status": "pending",
      "duration": null,
      "timestamp": null
    }
  },
  "tasks": [
    "Task 1 description",
    "Task 2 description"
  ],
  "files_modified": [
    "path/to/file1.cs",
    "path/to/file2.razor"
  ],
  "commits": [
    {
      "hash": "abc12345",
      "message": "commit message",
      "timestamp": "2025-10-09T14:45:00Z"
    }
  ],
  "warnings": [],
  "errors": [],
  "notes": [
    "Important note about execution"
  ]
}
```

## Prompts Using Key Parameter

| Prompt File | Mode | Key Required | Purpose |
|-------------|------|--------------|---------|
| task.prompt.md | agent | Yes (if available) | Track task execution lifecycle |
| refactor.prompt.md | agent | Yes (if available) | Track refactoring operations |
| sync.prompt.md | sync | Yes (if available) | Track synchronization operations |
| question.prompt.md | ask | No | Question answering only |
| healthcheck.prompt.md | agent | No | System validation only |

## Key Management Rules

### Creation
- Keys are created automatically when first referenced in a prompt
- If no key is provided, infer from context (thread history, workspace, terminal)
- If inference is uncertain, halt and request clarification

### Updating
- Keys are updated after each phase completion
- Status transitions are tracked with timestamps
- All file modifications are recorded
- All commits are logged with hash and message

### Completion
- Keys transition to `completed` only when explicitly instructed by user
- Default state is `in-progress` until completion is confirmed
- Keys remain in the system for historical tracking

### Alphabetical Sorting
- All keys in this directory must remain alphabetically sorted
- Use lowercase with hyphens for multi-word keys
- Example: `doc`, `hcp`, `session-transcript-css`

## Clean Exit Guarantee

At the end of every key execution:
- Solution must build with **zero errors and zero warnings**
- All analyzers, linters, and Roslynator checks must pass
- All relevant automated tests must pass
- All contracts (API, DTO, DB) must remain intact
- No obsolete or broken paths may remain

If any condition fails, the key must be marked **Incomplete** and reported.

## Agent Handoff

When a task requires follow-up by other agents:
- Document clear handoff instructions in key notes
- Specify which agents should be invoked next
- Include parameters for seamless continuation
- Preserve all context needed for continuation

## Related Documentation

- [task.prompt.md](../../.github/prompts/task.prompt.md) - Task execution agent
- [refactor.prompt.md](../../.github/prompts/refactor.prompt.md) - Refactoring agent
- [sync.prompt.md](../../.github/prompts/sync.prompt.md) - Synchronization agent
- [SelfAwareness.instructions.md](../../.github/instructions/SelfAwareness.instructions.md) - Operating guardrails
- [SystemStructureSummary.md](../../.github/instructions/Links/SystemStructureSummary.md) - System architecture

---

**Last Updated:** October 9, 2025  
**Maintainer:** GitHub Copilot (Task Agent)
