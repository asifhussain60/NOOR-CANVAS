# Agent Handoff Protocol

**Version**: 1.1.0  
**Last Updated**: 2025-10-27  
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

## build.prompt.md → todo.prompt.md Handoff

**Purpose**: Hand off single-task work to todo agent for extension of existing work

**When**: After build agent analyzes request, detects single task, and user approves handoff

### Handoff Format

**Standard Invocation**:
```
@workspace /todo from-build=true key={key-identifier} {user-request}
```

**Parameters**:
- `from-build` *(required)*: Set to `true` to indicate handoff from build agent
  - Signals todo agent to skip 5s auto-execute countdown
  - Build agent already showed analysis and received approval
  - Prevents dual approval gates
- `key` *(auto-detected if not provided)*: Task identifier
- Additional request text passed as-is to todo agent

### Approval Flow

**Build Agent Responsibilities**:
1. ✅ Analyze request and detect single task
2. ✅ Display 🧠 Analysis + 📌 Summary with A/B/C/D options
3. ✅ Wait for user approval (option A)
4. ✅ Set `from-build=true` parameter
5. ✅ Invoke todo agent with constructed parameters

**Todo Agent Responsibilities**:
1. ✅ Detect `from-build=true` parameter
2. ✅ Skip 5s auto-execute countdown (approval already received)
3. ✅ Require explicit "proceed" instead of countdown
4. ✅ Load existing plan from key data stream
5. ✅ Extend work and execute

### Example Handoff

**User Flow**:
```
User: @workspace /build "Fix the button layout in Header.razor"

[Build agent analyzes and routes to todo]

Build Agent: 
## 🧠 Analysis
- Request Type: Bug fix
- Target Agent: `todo` prompt
- Key: `header-button-layout`
- Complexity: Simple
- Context: Text-based request

## 📌 Summary

**Handoff Plan:**
- Will load `.github/prompts/todo.prompt.md`
- Agent will receive request with key `header-button-layout`
- Todo agent will extend existing work under this key
- Changes tracked in work-log.md

**What would you like to do next?**

**A.** Proceed with handoff to `todo` agent (execute plan)
**B.** Change target agent (switch to different prompt)
**C.** Modify key or parameters (adjust before handoff)
**D.** Cancel (stop and return to normal chat)

User: A

Build Agent: [Sets from-build=true]
Build Agent: @workspace /todo from-build=true key=header-button-layout "Fix the button layout in Header.razor"

[Todo agent takes over]

Todo Agent: "✅ Loaded key: header-button-layout from git history"
Todo Agent: "Current Status: Phase 2 of 3 complete"
Todo Agent: "Extension: Fix button layout"
Todo Agent: "What would you like to do next?"
Todo Agent: "Say 'proceed' to execute (no countdown - approval already received)"

User: "proceed"

[Todo agent executes work]
```

### Benefits

- ✅ **No dual approval**: Build shows plan once, todo respects that approval
- ✅ **Clear UX**: User knows approval was already given
- ✅ **Consistent workflow**: Same approval pattern across all build handoffs
- ✅ **Key preservation**: Todo extends existing work without creating new keys

---

## task.prompt.md → test-generation.prompt.md Handoff

**Purpose**: Hand off UI changes to automated test generation after implementation

**When**: After task completes Step 6 (implementation), before Step 7 (validation)

**Status**: Partially implemented (task Step 6.1 invokes test-generation)

### Handoff Format

**Standard Invocation**:
```
@workspace /test-generation key={key} phase={phase} scope={ui-files-changed} test-type={e2e|unit|integration}
```

**Parameters**:
- `key` *(required)*: Current work key (inherited from task)
- `phase` *(required)*: Current phase number (for test organization)
- `scope` *(required)*: Files modified in this phase (determines test coverage)
- `test-type` *(optional, auto-detected)*: Type of tests to generate based on layer affected
  - `e2e` - UI components changed (Razor files)
  - `unit` - Services/DTOs changed (C# classes)
  - `integration` - API endpoints changed (controllers)

### Context Carried

**Automatically loaded by test-generation agent**:
1. Task execution results from `work-log.md`
2. Modified file list from git diff
3. Technology stack from `{key}.plan.md` (if exists)
4. Phase objectives from `{key}.plan.json`
5. Test data from System Context Pack (if available)

### Handoff Workflow

**Task Agent Responsibilities** (Step 6.1):
1. ✅ Complete phase implementation
2. ✅ Identify files modified in this phase (git diff)
3. ✅ Determine test type based on layer affected
4. ✅ Construct test-generation invocation with parameters
5. ✅ **AUTOMATICALLY send** `@workspace /test-generation key={key} phase={phase} ...` command
6. ✅ Inform user: "✓ Phase {N} implementation complete. Generating tests..."

**Test-Generation Agent Responsibilities**:
1. ✅ Detect `key` parameter → Check for `{key}.plan.md` and `work-log.md`
2. ✅ Load phase context (objectives, deliverables, files modified)
3. ✅ Generate appropriate tests based on `test-type` and `scope`
4. ✅ Update test-registry.md with new tests
5. ✅ Execute tests and report results
6. ✅ Update `work-log.md` with test generation summary

### Example Handoff

**User Flow**:
```
User: @workspace /task key=user-landing tasks="Phase 1: Database Schema\n---\nPhase 2: Frontend Routing"

[Task agent executes Phase 1]

Task Agent: "✓ Phase 1 complete: Database schema implemented"
Task Agent: "Files modified: SessionCanvas.razor, HostSessionHub.cs"
Task Agent: "✓ Phase 1 implementation complete. Generating tests..."
Task Agent: @workspace /test-generation key=user-landing phase=1 scope="SessionCanvas.razor,HostSessionHub.cs" test-type=e2e

[Test-generation agent takes over]

Test-Generation Agent: "✅ Loaded key: user-landing (Phase 1)"
Test-Generation Agent: "Scope: E2E tests for SessionCanvas.razor, HostSessionHub.cs"
Test-Generation Agent: "✅ Generated 3 E2E tests in Tests/UI/session-canvas-routing.spec.ts"
Test-Generation Agent: "✅ All tests passing"
Test-Generation Agent: "✓ Test generation complete. Returning to task agent..."

[Task agent resumes]

Task Agent: "✅ Phase 1 complete with tests"
Task Agent: "What's next: Phase 2 will implement frontend routing..."

User: "proceed"

[Task agent continues Phase 2]
```

### Benefits

- ✅ **Automatic test coverage**: Tests generated immediately after implementation
- ✅ **Context-aware**: Uses phase objectives and modified files
- ✅ **Consistent patterns**: Same test generation approach across all tasks
- ✅ **Validation before completion**: Phase not marked complete until tests pass

---

## SELF_INVOKE Patterns

**Purpose**: Agent calls itself for iterative refinement or continuation

**When**: Multi-part work requiring same agent repeatedly

**Supported Agents**: plan, todo, test-generation, healthcheck

### SELF_INVOKE Scenarios

#### 1. Plan Refinement (plan → plan)

**Purpose**: Iterative plan improvement based on user feedback

**Format**:
```
@workspace /plan key={key} user_request="Refine {section} based on feedback: {feedback}"
```

**Example**:
```
User: @workspace /plan key=user-landing user_request="Add authentication to landing page"

[Plan agent creates draft v1.0]

User: "Add Phase 4 for role-based access control"

Plan Agent: @workspace /plan key=user-landing user_request="Refine plan: Add Phase 4 for role-based access control"

[Plan agent creates draft v1.1 with additional phase]
```

**Parameters Inherited**: key, github-branch, debug-level, scope, constraints

**Context Preserved**:
- Existing plan phases (plan.md)
- Previous draft versions
- User feedback history (work-log.md)

#### 2. Todo Continuation (todo → todo)

**Purpose**: Sequential todo item execution under same key

**Format**:
```
@workspace /todo key={key} "{next-todo-item}"
```

**Example**:
```
User: @workspace /todo "Fix button layout in Header.razor"

[Todo agent fixes layout]

User: @workspace /todo "Add responsive styles"

[Todo agent extends same key with responsive work]
```

**Parameters Inherited**: key, auto-chain, from-build

**Context Preserved**:
- Current phase (from work-log.md)
- Existing plan structure
- Previous commit history

#### 3. Test Coverage Expansion (test-generation → test-generation)

**Purpose**: Add additional tests to existing test suite

**Format**:
```
@workspace /test-generation key={key} phase={phase} scope={additional-files} test-type={type}
```

**Example**:
```
User: @workspace /test-generation key=user-landing phase=2 scope="Header.razor" test-type=e2e

[Test-generation agent creates header tests]

User: "Also add tests for error states"

Test-Generation Agent: @workspace /test-generation key=user-landing phase=2 scope="Header.razor" test-type=e2e notes="Focus on error states"

[Test-generation agent adds error state tests to existing suite]
```

**Parameters Inherited**: key, phase, test-type

**Context Preserved**:
- Existing test registry
- Test coverage data
- Previous test results

#### 4. Healthcheck Re-validation (healthcheck → healthcheck)

**Purpose**: Re-run validation after fixes applied

**Format**:
```
@workspace /healthcheck scope={scope} notes="Re-validate after {fix-description}"
```

**Example**:
```
User: @workspace /healthcheck scope=all

[Healthcheck finds contract mismatches]

User: [Fixes mismatches]

User: @workspace /healthcheck scope=all notes="Re-validate after contract fixes"

[Healthcheck re-validates and confirms fixes]
```

**Parameters Inherited**: level, verbosity

**Context Preserved**:
- Previous validation results
- Known issues from work-log.md

### SELF_INVOKE Best Practices

1. **Always preserve key**: Don't create new keys for refinement
2. **Inherit parameters**: Pass through original parameters when possible
3. **Update context**: Each invocation appends to work-log.md
4. **Version tracking**: Increment version for plan refinements
5. **Clear user communication**: Explain why SELF_INVOKE is happening

---

## Test Context Passing

**Purpose**: Pass test execution results and coverage data between agents

**Mechanism**: Test registry in key data stream

**Structure**:
```
.github/key-data-streams/{key}/tests/
├── test-registry.md          # Test inventory and status
├── coverage-report.json      # Coverage data (optional)
├── run-all-tests.ps1         # Execution script
├── run-phase-{N}-tests.ps1   # Phase-specific execution
└── {test-name}.spec.ts       # Individual test files (refs)
```

### Test Registry Format

**File**: `.github/key-data-streams/{key}/tests/test-registry.md`

```markdown
# Test Registry: {key}

**Created**: {date}  
**Total Tests**: {count}  
**Last Updated**: {timestamp}

---

## Phase 1: Database Schema

### Unit Tests
- ✅ `test-user-table-schema.cs` - PASSED (2025-10-29 14:30)
  - Validates user table structure
  - Execution: `dotnet test Tests/Unit/UserTableTests.cs`

### Integration Tests
- ✅ `test-database-migration.cs` - PASSED (2025-10-29 14:32)
  - Validates migration scripts
  - Execution: `dotnet test Tests/Integration/MigrationTests.cs`

**Phase Coverage**: 95% (19/20 test cases)

---

## Phase 2: Frontend Routing

### E2E Tests
- ✅ `session-canvas-routing.spec.ts` - PASSED (2025-10-29 15:15)
  - Validates route to session canvas
  - Execution: `npx playwright test Tests/UI/session-canvas-routing.spec.ts`

- ⚠️ `error-state-handling.spec.ts` - FLAKY (2025-10-29 15:20)
  - Validates error state display
  - Issue: Timing-dependent assertions
  - Execution: `npx playwright test Tests/UI/error-state-handling.spec.ts`

**Phase Coverage**: 87% (13/15 test cases)

---

## Execution Commands

**All Tests**:
```powershell
.github/key-data-streams/{key}/tests/run-all-tests.ps1
```

**Phase-Specific**:
```powershell
.github/key-data-streams/{key}/tests/run-phase-1-tests.ps1
.github/key-data-streams/{key}/tests/run-phase-2-tests.ps1
```

**Coverage Report**:
```powershell
dotnet test /p:CollectCoverage=true /p:CoverletOutputFormat=json
```

---

## Test Status Legend

- ✅ PASSED - Test executed successfully
- ❌ FAILED - Test failed (blocking)
- ⚠️ FLAKY - Test intermittently fails (non-blocking)
- ⏸️ SKIPPED - Test temporarily disabled
- 🔄 RUNNING - Test currently executing

---

*Auto-generated by test-generation.prompt.md*  
*Last updated: {timestamp}*
```

### Consuming Agents

#### healthcheck.prompt.md

**Purpose**: Validate test coverage and execution status

**Usage**:
```powershell
# Read test-registry.md
$registry = Get-Content ".github/key-data-streams/{key}/tests/test-registry.md"

# Validate all tests have PASSED status
$failed = $registry | Select-String "❌ FAILED"
$flaky = $registry | Select-String "⚠️ FLAKY"

# Report issues
IF ($failed.Count -gt 0) THEN
  REPORT "Critical: {count} tests failing"
END IF
```

#### task.prompt.md (Auto-Chain Mode)

**Purpose**: Ensure tests pass before proceeding to next phase

**Usage**:
```powershell
# Execute phase tests before continuing
& ".github/key-data-streams/{key}/tests/run-phase-{N}-tests.ps1"

# Parse test results
$registry = Get-Content ".github/key-data-streams/{key}/tests/test-registry.md"

# Check for failures
IF ($registry -match "❌ FAILED") THEN
  HALT_AUTO_CHAIN()
  PROMPT_USER("Phase {N} tests failing. Fix before proceeding?")
END IF
```

#### plan.prompt.md

**Purpose**: Define acceptance criteria based on test coverage

**Usage**:
```markdown
## Phase {N} Acceptance Criteria

**Tests Required** (from test-registry.md):
- Unit tests: {count} required (95% coverage)
- Integration tests: {count} required
- E2E tests: {count} required

**Validation**:
- All tests must show ✅ PASSED status
- No ❌ FAILED tests blocking phase
- ⚠️ FLAKY tests documented with issues
```

### Test Context Lifecycle

1. **Plan Phase**: plan.prompt.md creates test-registry structure
2. **Implementation**: task.prompt.md executes phases
3. **Test Generation**: test-generation.prompt.md populates registry
4. **Execution**: Tests run, registry updated with ✅/❌/⚠️ status
5. **Validation**: task.prompt.md (auto-chain) checks registry before next phase
6. **Healthcheck**: healthcheck.prompt.md validates comprehensive coverage
7. **Completion**: Final test summary appended to work-log.md

---

## route → * Handoff

**Purpose**: Generic routing from route.prompt.md to any specialized agent

**When**: After route.prompt.md classifies request and user approves target agent

### Handoff Format

**Standard Invocation**:
```
@workspace /{target-agent} from-route=true {original-request-parameters}
```

**Parameters**:
- `from-route` *(boolean, auto-set)*: Set to `true` to indicate routing origin
- **Original parameters**: All parameters from user request passed through unchanged

**Supported Target Agents**:
- plan, task, todo, test-generation, healthcheck, cohesion, drift, collapse-keys, ask

### Handoff Workflow

**Route Agent Responsibilities** (Step 4: User Approval):
1. ✅ Analyze request and detect requirements
2. ✅ Classify request → determine target agent
3. ✅ Present classification with 🧠 Analysis + 📌 Summary
4. ✅ Show options: **A.** Proceed with {target} | **B.** Change target | **C.** Modify | **D.** Cancel
5. ✅ Wait for user approval (option A)
6. ✅ Set `from-route=true` parameter
7. ✅ Construct target agent invocation with all original parameters
8. ✅ **AUTOMATICALLY send** handoff command
9. ✅ Inform user: "✓ Routing to {target-agent}..."

**Target Agent Responsibilities**:
1. ✅ Detect `from-route=true` parameter (if supported)
2. ✅ Skip redundant request classification (route already analyzed)
3. ✅ Load context from route agent's analysis (if needed)
4. ✅ Execute specialized workflow
5. ✅ Update work-log.md with handoff source

### Example Handoffs

#### route → plan

**User Request**: "Add authentication to landing page"

```
User: @workspace /route "Add authentication to landing page"

Route Agent (Analysis):
- Complexity: Multi-phase (database, backend, frontend)
- Layers affected: 3 (UI, API, Database)
- Recommendation: Use plan.prompt.md for comprehensive planning

Route Agent (Summary):
**What would you like to do next?**
**A.** Route to plan agent (recommended)
**B.** Route to task agent (skip planning)
**C.** Modify request before routing
**D.** Cancel

User: A

Route Agent: @workspace /plan from-route=true key=auth-landing user_request="Add authentication to landing page"

[Plan agent takes over]

Plan Agent: "✅ Routed from route.prompt.md"
Plan Agent: "Analyzing request: Add authentication to landing page"
Plan Agent: [Creates comprehensive plan]
```

#### route → todo

**User Request**: "Fix button spacing in Header.razor"

```
User: @workspace /route "Fix button spacing in Header.razor"

Route Agent (Analysis):
- Complexity: Single task (UI styling fix)
- Files affected: 1 (Header.razor)
- Recommendation: Use todo.prompt.md for quick fix

Route Agent (Summary):
**What would you like to do next?**
**A.** Route to todo agent (recommended)
**B.** Route to task agent (more structure)
**C.** Modify request before routing
**D.** Cancel

User: A

Route Agent: @workspace /todo from-route=true from-build=false "Fix button spacing in Header.razor"

[Todo agent takes over]

Todo Agent: "✅ Routed from route.prompt.md"
Todo Agent: "Auto-detected key: header-improvements"
Todo Agent: "Extension: Fix button spacing"
Todo Agent: "Proceeding in 5 seconds... (say 'review' or 'cancel' to abort)"
[5s countdown]
[Todo agent executes fix]
```

#### route → ask

**User Request**: "How does the canvas selection work?"

```
User: @workspace /route "How does the canvas selection work?"

Route Agent (Analysis):
- Type: Question (no implementation needed)
- Scope: Architecture/documentation query
- Recommendation: Use ask.prompt.md for explanation

Route Agent (Summary):
**What would you like to do next?**
**A.** Route to ask agent (recommended)
**B.** Route to healthcheck (validation query)
**C.** Modify question before routing
**D.** Cancel

User: A

Route Agent: @workspace /ask from-route=true "How does the canvas selection work?"

[Ask agent takes over]

Ask Agent: "✅ Routed from route.prompt.md"
Ask Agent: [Provides comprehensive explanation]
```

### Approval Flow Consistency

**All route handoffs follow same pattern**:

1. **Classification**: route.prompt.md analyzes request
2. **Presentation**: Shows 🧠 Analysis + 📌 Summary + A/B/C/D options
3. **User Approval**: Waits for option A
4. **Handoff**: Sets `from-route=true` and invokes target
5. **Target Execution**: Target agent respects pre-classification

**Benefits**:
- ✅ Single approval gate (route shows classification, target executes)
- ✅ Consistent UX across all routing scenarios
- ✅ Target agents can skip redundant analysis
- ✅ Clear audit trail (from-route parameter in work-log)

---

## Future Handoff Patterns

### task.prompt.md → refactor.prompt.md

**Purpose**: Hand off to code quality improvements post-implementation

**Status**: Manual invocation only

**Future Enhancement**: Automatic refactor suggestion after implementation completes

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

### v2.0.0 (2025-10-29) - COMPREHENSIVE HANDOFF DOCUMENTATION
- Added task → test-generation handoff protocol (automatic test generation)
- Added SELF_INVOKE patterns for 4 agents (plan, todo, test-generation, healthcheck)
- Added test context passing specification (test-registry.md format and usage)
- Added route → * generic handoff pattern (from-route parameter)
- Documented approval flow consistency across all handoffs
- Moved 3 patterns from "Future" to "Implemented" status
- Complete coverage: 6 of 6 handoff patterns documented

### v1.1.0 (2025-10-27)
- Added build → todo handoff protocol
- Documented `from-build` parameter to prevent dual approval gates
- Added approval flow diagram for build handoffs
- Updated best practices for build agent integration

### v1.0.0 (2025-10-21)
- Initial creation
- Documented plan → task handoff protocol
- Added context passing specification
- Added workflow examples
- Added future handoff patterns
- Extracted from cohesion review action item 01


