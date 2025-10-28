# NoorCanvas Prompt System

**Last Updated:** 2025-10-28

## Overview

The NoorCanvas prompt system provides a comprehensive AI agent infrastructure for planning, executing, testing, and maintaining work through specialized prompt agents. All agents coordinate via key data streams and state tracking for complete workflow visibility.

## Quick Reference

### Main Agents

| Prompt | Command | Purpose |
|--------|---------|---------|
| **route.prompt.md** | `/route` | Entry point - analyzes requests and routes to appropriate agent |
| **plan.prompt.md** | `/plan` | Multi-phase planning and architecture design |
| **task.prompt.md** | `/task` | Execute planned work with checkpoint commits |
| **todo.prompt.md** | `/todo` | Extend current work with same key |
| **ask.prompt.md** | `/ask` | Answer questions with actionable handoff options |
| **test-generation.prompt.md** | `/test` | Generate Playwright tests with orchestration |

### Specialized Agents

| Prompt | Command | Purpose |
|--------|---------|---------|
| **drift.prompt.md** | `/drift` | Manage unrelated issues discovered during work |
| **healthcheck.prompt.md** | `/healthcheck` | System health audits and validation |
| **cohesion.prompt.md** | `/cohesion` | Validate prompt system consistency |

## Workflow Patterns

### Simple Task (Auto-Approved)

```bash
@workspace /route "Add share button to canvas"
# Routes to 'todo' → auto-executes immediately
```

### Multi-Phase Feature (Requires Approval)

```bash
@workspace /route plan "Implement real-time collaboration with SignalR"
# Routes to 'plan' → generates plan → waits for approval
# After approval: handoff to 'task' → executes phases
```

### Question First, Then Action

```bash
@workspace /route ask "How does session management work?"
# Routes to 'ask' → answers question → offers handoff to plan/todo/task
```

### Test Generation

```bash
@workspace /route test "Create visual regression test for debug panel"
# Routes to 'test-generation' → generates Playwright test → offers execution
```

## State Tracking

**All prompts integrate with state-tracker.ps1** to log execution history:

- **Requests**: Track user requests (original, refinement, continuation)
- **Handoffs**: Log prompt-to-prompt transitions
- **Commits**: Associate git commits with phases and keys
- **Drifts**: Track unrelated issues spawned during work

**View state data:**
```powershell
# Complete timeline
plist -timeline -k my-feature

# All requests
plist -requests -k my-feature

# All commits
plist -commits -k my-feature

# Comprehensive lookup
plist -lookup -k my-feature
```

**See:** [PROMPT-STATE-TRACKING.md](./PROMPT-STATE-TRACKING.md) for complete guide

## Key Data Streams

All work is organized under key data streams in `.github/key-data-streams/{key}/`:

- `{key}.plan.md` - Work plan with phases and tasks
- `{key}.plan.json` - Structured plan metadata
- `{key}.state.json` - State tracking data (requests, handoffs, commits)
- `work-log.md` - Execution log and session history
- `tests/` - Generated Playwright tests
- `scripts/` - Test orchestration scripts

**Key Naming:** kebab-case (e.g., `session-canvas-share`, `drift-button-alignment`)

## Shared Components

### Algorithms & Validation

- `shared/invocation-parser.md` - Parameter extraction
- `shared/context-analyzer.md` - Multi-context analysis
- `shared/task-detector.md` - Multi-task detection
- `shared/work-classifier.md` - Work type classification
- `shared/complexity-assessor.md` - Complexity scoring
- `shared/key-consultation.md` - Existing key search
- `shared/output-validator.md` - Response validation
- `shared/validation-engine.md` - Test validation framework

### Execution & Coordination

- `shared/execution-flow.md` - Standard execution patterns
- `shared/handoff-protocol.md` - Handoff parameter construction
- `shared/loop-prevention.md` - Auto-chain depth limits
- `shared/integration-protocol.md` - Cross-prompt coordination
- `shared/commit-message-format.md` - Checkpoint commit standards

### Output & Style

- `shared/CONCISE-MANDATE.md` - MAX 15 bullets rule
- `shared/output-style-mandate.md` - 🧠/📌 format

### Testing

- `shared/playwright-test-generation.md` - Test generation patterns
- `shared/test-orchestration-patterns.md` - Orchestration script templates
- `shared/prompt-test-validation-framework.md` - Prompt validation

### State Tracking

- `shared/state-tracker.ps1` - State tracking utility (v1.0.0)
- `.github/key-data-streams/_SCHEMA/state.schema.json` - State.json schema

## Internal Agents

Located in `.github/prompts/internal/`:

- `comm/question.prompt.md` - Question answering engine (called by ask.prompt.md)
- `enhance-prompts.prompt.md` - Prompt optimization and enhancement

## Agent Metadata

All agents include standardized metadata:

```markdown
---
mode: agent
description: Brief description
---

<!-- Metadata (non-frontmatter, lint-safe) -->
> purpose: Detailed purpose
> inputs: parameter1, parameter2, -test
> outputs: Output description
> lastUpdated: 2025-10-28
> stateTracking: enabled
> acceptsFrom: [route, plan, ask]
> calls: [task, test-generation]
```

## Validation & Testing

### Post-Execution Validation

All prompts support the `-test` flag:

```bash
@workspace /route plan -test "Add annotation system"
# Executes plan workflow
# Then runs validation checks
# Generates quality report (0-100 score)
```

**Validation checks:**
- Output format compliance (max 15 bullets, no code blocks)
- Required sections present
- Handoff protocols followed
- State tracking executed
- Commit checkpoints created

**See:** `shared/prompt-test-validation-framework.md`

### System Health

```bash
@workspace /healthcheck scope=prompts level=full
# Validates all prompt files
# Reports violations by severity
# Suggests optimization opportunities
```

### Cohesion Validation

```bash
@workspace /cohesion scope=all
# Validates all prompts and instructions
# Reports conflicts and inconsistencies
# Recommends harmonization fixes
```

## Commit Conventions

All prompts follow standardized commit formats:

**Checkpoint commits:**
```
ckpt({key}): Phase {N} - {summary}
```

**Test commits:**
```
test({key}): Generated {type} test for {scenario}
```

**Drift resolution:**
```
ckpt({drift-key}): Resolved - {summary}
Parent: {parent-key} | Remaining: {count} drifts
```

**See:** `shared/commit-message-format.md`

## Development Workflow

### Adding a New Prompt

1. Create prompt file in `.github/prompts/` or `.github/prompts/internal/`
2. Add frontmatter metadata (mode, description)
3. Add lint-safe metadata (purpose, inputs, outputs, etc.)
4. Add `stateTracking: enabled` if prompt should log execution
5. Add Step -1 for state tracking initialization
6. Log handoffs before transitioning to other prompts
7. Log commits after checkpoint operations
8. Update README.md with new prompt reference
9. Test with `-test` flag for validation
10. Run `/cohesion` to validate system-wide consistency

### Modifying Existing Prompts

1. Read current prompt version and changelog
2. Increment version number
3. Add changelog entry with changes
4. Update `lastUpdated` metadata
5. Test changes with `-test` flag
6. Run `/cohesion` to validate no conflicts introduced
7. Commit with `ckpt(prompt-system): Updated {prompt} - {summary}`

## Troubleshooting

### Prompt Not Found

Ensure prompt file is in `.github/prompts/` or subdirectory. Route prompt searches:
- `.github/prompts/{name}.prompt.md`
- `.github/prompts/internal/{name}.prompt.md`

### State Tracking Errors

Verify state-tracker.ps1 is sourced:
```powershell
. .github/prompts/shared/state-tracker.ps1
```

View available functions:
```powershell
# Should list: Get-StateFile, Update-StateRequest, Update-StateHandoff, Update-StateCommit, Update-StateDriftKey, Update-StatePhase
```

### Key Not Found

Check if key exists in key data streams:
```powershell
plist -list  # View all keys
plist -lookup -k my-feature  # Check specific key
```

### Validation Failures

Use `-test` flag to see detailed validation report:
```bash
@workspace /route plan -test "my request"
```

Review violations and recommendations in generated report.

## Version History

**1.0.0** (2025-10-28)
- Initial comprehensive README
- Complete agent reference
- State tracking integration
- Shared component documentation
- Development workflow guide

## Related Documentation

- [PROMPT-STATE-TRACKING.md](./PROMPT-STATE-TRACKING.md) - Complete state tracking guide
- [shared/CONCISE-MANDATE.md](./shared/CONCISE-MANDATE.md) - MAX 15 bullets rule
- [shared/output-style-mandate.md](./shared/output-style-mandate.md) - Output formatting
- [shared/prompt-test-validation-framework.md](./shared/prompt-test-validation-framework.md) - Validation framework
- `.github/key-data-streams/_SCHEMA/state.schema.json` - State.json schema
- `Workspaces/Global/plist.ps1` - Key data stream CLI documentation
