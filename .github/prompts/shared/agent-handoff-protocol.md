# Agent Handoff Protocol

**Version**: 1.0.0  
**Last Updated**: 2025-10-21  
**Purpose**: Standardize agent-to-agent handoffs for consistent workflow execution

---

## Overview

This document defines the standard protocol for agent-to-agent handoffs in the NOOR CANVAS prompt system. Handoffs enable complex workflows where one agent (e.g., planning) hands off execution to another agent (e.g., task execution).

---

## plan.prompt.md → task.prompt.md Handoff

**Purpose**: Hand off from interactive planning to phased execution

**When**: After user approves plan and says "proceed", "begin implementation", "ready to implement", or similar

### Handoff Format

**Standard Invocation**:
```
@workspace /task key={key-identifier} github-branch={branch-name} debug-level={level} verbosity={verbosity} tasks="{multi-line-task-list}"
```

**Parameters**:
- `key` *(required)*: Task identifier matching plan key
- `github-branch` *(required)*: Target branch (validated in plan Step 0.1)
  - `development` (default) - All development work
  - `master` (rare) - Production hotfixes only (requires explicit approval)
- `debug-level` *(optional, default=simple)*: Debug logging level
  - `none` - Production code
  - `simple` - Basic debug markers
  - `trace` - Comprehensive markers
- `verbosity` *(optional, default=concise)*: Output detail level
  - `concise` - Work summary + next phase preview
  - `detailed` - Full analysis and context
- `tasks` *(required)*: Multi-line phase list (delimited by `\n---\n`)
  - Format: `Phase 1: {Title}\n---\nPhase 2: {Title}\n---\nPhase 3: {Title}`

### Context Carried

**Plan Files** (automatically loaded by task agent):
1. `.github/key-data-streams/{key}/{key}.plan.md` - Complete plan specification
   - Technology stack analysis
   - Architecture layers affected
   - Phase specifications with objectives, deliverables, tests
   - Enhancement recommendations
   - Risk assessments
   - System Context Pack (APIs, database schemas, SignalR hubs, test data)

2. `.github/key-data-streams/{key}/{key}.plan.json` - Structured plan metadata (JSON tracking)
   ```json
   {
     "key": "user-landing",
     "status": "in-progress",
     "phases": [
       {
         "phaseNumber": 1,
         "title": "Database Schema",
         "status": "not-started",
         "commit": null,
         "startedAt": null,
         "completedAt": null
       }
     ]
   }
   ```

3. `.github/key-data-streams/{key}/work-log.md` - Execution history
   - Key data stream entry
   - User request summary
   - Plan approval record
   - Phase completion logs

### Handoff Workflow

**feature planning agent Responsibilities** (Step 6):
1. ✅ Write `{key}.plan.md` with complete plan specification
2. ✅ Write `{key}.plan.json` with JSON tracking structure
3. ✅ Write `work-log.md` with key data stream entry
4. ✅ **AUTOMATICALLY send** `@workspace /task key={key} github-branch={branch} ...` command
5. ✅ Inform user: "✓ Plan finalized. Invoking task agent now..."

**Task Agent Responsibilities** (Plan Integration Protocol):
1. ✅ Detect `key` parameter → Check for `{key}.plan.md`
2. ✅ If plan exists:
   - Load complete phase details from `{key}.plan.md`
   - Load JSON tracking from `{key}.plan.json`
   - Use plan's technology stack analysis (skip redundant discovery)
   - Reference plan's architecture layers
   - Follow plan's test specifications
   - Update `{key}.plan.json` after each phase
   - Apply plan's System Context Pack
3. ✅ If plan missing:
   - Use lightweight planning (current behavior)
   - Warn user: "⚠️ No comprehensive plan found. Consider running @workspace /feature first."
4. ✅ Execute phases sequentially per plan
5. ✅ Update `work-log.md` with progress
6. ✅ Report completion with summary

### Example Handoff

**User Flow**:
```
User: @workspace /feature key=user-landing user_request="Route users to asset or transcript canvas based on host selection"

[feature planning agent creates comprehensive plan]

feature planning agent: "## Plan Draft v1.0 ..."

User: "proceed"

feature planning agent: [Writes {key}.plan.md, {key}.plan.json, work-log.md]
feature planning agent: "✓ Plan finalized. Invoking task agent now..."
feature planning agent: @workspace /task key=user-landing github-branch=development debug-level=simple verbosity=concise tasks="Phase 1: Database Schema\n---\nPhase 2: Backend Persistence\n---\nPhase 3: Frontend Routing\n---\nPhase 4: Testing"

[Task agent takes over]

Task Agent: [Loads plan from {key}.plan.md]
Task Agent: "✅ Loaded comprehensive plan from .github/key-data-streams/user-landing/user-landing.plan.md"
Task Agent: "Phase 1: Database Schema - {objectives}"
Task Agent: [Executes Phase 1]
Task Agent: "✅ Phase 1 complete. What's next: Phase 2 will implement ..."

User: "proceed"

[Task agent continues phases 2-4]
```

### Benefits

- ✅ **No redundant analysis**: Technology stack already discovered by feature planning agent
- ✅ **Consistent implementation**: Follows approved architecture
- ✅ **Progress tracking**: JSON enables programmatic queries
- ✅ **Pre-gathered context**: APIs, database schemas, test data reused
- ✅ **Clear user experience**: Simple "proceed" triggers without manual commands

---

## Future Handoff Patterns

### task.prompt.md → test-generation.prompt.md

**Purpose**: Hand off UI changes to automated test generation

**Status**: Partially implemented (task Step 6.1 invokes test-generation)

**Future Enhancement**: Standardize test context passing

### task.prompt.md → refactor.prompt.md

**Purpose**: Hand off to code quality improvements post-implementation

**Status**: Manual invocation only

**Future Enhancement**: Automatic refactor suggestion after implementation

### refactor.prompt.md → healthcheck.prompt.md

**Purpose**: Validate no behavior change after refactoring

**Status**: Manual invocation recommended

**Future Enhancement**: Automatic healthcheck after refactor

### sync.prompt.md → healthcheck.prompt.md

**Purpose**: Validate system after synchronization/cleanup

**Status**: Manual invocation recommended

**Future Enhancement**: Automatic healthcheck after sync

---

## Handoff Best Practices

1. **Always include required parameters**: `key`, `github-branch`
2. **Use validated branch**: Pass through branch from initial validation
3. **Write files before handoff**: Plan/context files must exist
4. **Automatic execution**: Planning agent sends command, doesn't just document it
5. **Clear user communication**: "✓ Plan finalized. Invoking task agent now..."
6. **Context loading**: Receiving agent MUST check for and load plan files
7. **Progress tracking**: Update JSON tracking after each phase
8. **Summary reporting**: Provide work summary + next phase preview

---

## Integration with SelfAwareness.instructions.md

**Branch Strategy**: Always respect SelfAwareness branch rules
- `development` - All development work (default)
- `master` - Production only (requires explicit override)

**Checkpoint Commits**: Both agents create checkpoint commits before work

**Validation**: Both agents follow ValidationFramework.md

**Documentation**: Both agents update key data streams

---

## Related Files

- **plan.prompt.md** - Feature Planning Agent (Step 6: Handoff Protocol)
- **task.prompt.md** - Task executor (Plan Integration Protocol)
- **SelfAwareness.instructions.md** - Global operating guardrails
- **SystemIndex.md** - Agent coordination documentation

---

## Changelog

### v1.0.0 (2025-10-21)
- Initial creation
- Documented plan → task handoff protocol
- Added context passing specification
- Added workflow examples
- Added future handoff patterns
- Extracted from cohesion review action item 01


