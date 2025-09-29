---
mode: agent
---

# /workitem — Implementation Agent (v3.0.0)

Implements scoped changes for `{key}` and stabilizes with analyzers, tests, and structured validation.

**Core Mandate:** Follow `.github/instructions/SelfAwareness.instructions.md` for all operating guardrails.

## Parameters
- **key:** Work stream identifier - auto-inferred if not provided
- **debug-level:** Debug behavior (`none`, `simple`, `trace`) - default: `simple`
- **mode:** Operation mode (`analyze`, `apply`, `test`) - default: `apply`
- **notes:** Work description (scope, files, constraints)

## Task Analysis & Planning
**MANDATORY:** Before beginning any work, agents must:

### 1. Parse and Summarize User Request
- **Parse Input**: Identify if user input contains `---` delimited phases or is a single task
- **Extract Requirements**: Clearly identify what changes/features are being requested
- **Identify Scope**: Determine files, components, and systems that will be affected
- **Assess Complexity**: Estimate effort level and potential risks

### 2. Phase Breakdown (if `---` delimited input)
- **Phase Count**: Report total number of phases detected
- **Phase Summary**: For each phase, provide:
  - Phase number and brief description
  - Expected files to be modified
  - Key technical changes required
  - Dependencies on previous phases
- **Execution Order**: Confirm the logical sequence of phase execution

### 3. Requested Work Analysis
**Present to user in this format:**
```

📋 REQUESTED WORK Analysis
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Key: {key}
Mode: {mode}
Request: {brief_description}

🎯 WORK REQUEST UNDERSTANDING
• Primary objective: {main_feature_or_change_requested}
• User requirements: {specific_requirements_identified}
• Expected outcome: {what_user_wants_to_achieve}
• Context provided: {any_context_or_constraints_given}

📝 TASK BREAKDOWN
{single_task_description OR phase_by_phase_list}

⚠️  DEPENDENCIES & RISKS
• Prerequisites: {any_requirements}
• Potential issues: {risk_assessment}
• Architectural considerations: {alignment_with_existing_patterns}

🚀 EXECUTION PLAN
• Quality gates: {analyzer/linter/test_strategy}
• Testing approach: {test_strategy_if_mode_test}
• Commit strategy: {commit_approach}
• Validation criteria: {how_success_will_be_measured}

Proceed with implementation? (Y/N)
```

### 4. User Confirmation
- **Wait for Approval**: Do not begin implementation until user confirms
- **Handle Modifications**: If user requests changes to the plan, update and re-summarize
- **Document Changes**: Record any plan modifications in debug logs

## Context & Inputs
- **MANDATORY:** `.github/instructions/SelfAwareness.instructions.md` (operating guardrails)
- **MANDATORY:** `.github/instructions/Ref/SystemStructureSummary.md` (architectural mappings and structural orientation)
- **Architecture:** `.github/instructions/Ref/NOOR-CANVAS_ARCHITECTURE.MD`
- `Workspaces/Copilot/prompts.keys/{key}/` work stream files
- `#getTerminalOutput` for execution evidence

## Operating Protocols
**Reference:** SelfAwareness.instructions.md for complete launch, database, analyzer, linter, and commit rules.
**Reference:** Ref/SystemStructureSummary.md for architectural mappings, component relationships, and API/database context.

### Documentation Placement
**Reference:** SelfAwareness.instructions.md File Organization Rules for complete documentation placement protocols.

## Operation Modes

### Test Mode (`mode: test`)
**Create temporary validation tests ONLY when `mode: test` is explicitly specified:**

When `mode: test` is specified, execute ALL of `apply` mode functionality PLUS these additional steps:

1. **Execute Apply Mode**: Complete all requested work exactly as per `apply` mode
2. **Create Temporary Test**: Generate a headless, silent Playwright test:
   - Location: `Workspaces/TEMP/workitem-{key}-{RUN_ID}.spec.ts`
   - Must be headless and silent (no browser UI)
   - Test should validate the specific changes made
3. **Run and Validate**: Execute the temporary test using proper command:
   ```powershell
   Start-Sleep -Seconds 15; netstat -an | findstr :9091; $env:PW_MODE="standalone"; npx playwright test "Workspaces/TEMP/workitem-{key}-{RUN_ID}.spec.ts"
   ```
   - Retry up to 3 times if needed
4. **Mark Complete**: Log completion: `[DEBUG-WORKITEM:{key}:impl:{RUN_ID}] test_mode_validation_complete ;CLEANUP_OK`
5. **Cleanup**: Remove the temporary test file after successful validation
6. **Final Checks**: Run full analyzer/linter/test suite as per normal protocol

**CRITICAL**: If `mode` is `analyze` or `apply`, do NOT create any temporary tests. Only `mode: test` creates temporary validation tests.

## Phase Prompt Handling
When user input contains `---` separators, treat each section as a separate todo item:

1. **Parse Phases**: Split input on `---` delimiters to identify individual todo items
2. **Sequential Processing**: Process each phase in order:
   - Make the required change
   - **ONLY if `mode: test`**: Create a headless, silent Playwright test in `Workspaces/TEMP/phase-{phase_number}-{key}-{RUN_ID}.spec.ts`
   - **ONLY if `mode: test`**: Execute test using proper command:
     ```powershell
     Start-Sleep -Seconds 15; netstat -an | findstr :9091; $env:PW_MODE="standalone"; npx playwright test "Workspaces/TEMP/phase-{phase_number}-{key}-{RUN_ID}.spec.ts"
     ```
   - **ONLY if `mode: test`**: Ensure the test passes (retry up to 3 times if needed)
   - Mark the todo complete with debug log: `[DEBUG-WORKITEM:{key}:impl:{RUN_ID}] phase_{phase_number}_complete ;CLEANUP_OK`
   - Move to next phase
3. **Test Requirements** (ONLY when `mode: test`):
   - Tests must be headless and silent (no browser UI)
   - Use `Workspaces/TEMP/` directory for temporary phase tests only
   - Never use `dotnet run`, `nc`, or `ncb` commands during test execution
   - Always use sleep timer and netstat check before test execution
   - Follow proper Playwright structure for permanent tests as per config files
   - Clean up temporary tests after all phases complete (unless explicitly deferred)
4. **Completion**: After all phases complete, run full analyzer/linter/test suite before final commit

## Inputs (read)
- `.github/instructions/SelfAwareness.instructions.md`
- `Workspaces/Copilot/prompts.keys/{key}/workitem/Requirements-{key}.md`
- `Workspaces/Copilot/prompts.keys/{key}/workitem/SelfReview-{key}.md`
- `Workspaces/Copilot/prompts.keys/{key}/workitem/Cleanup-{key}.md` (optional overrides)
- (Optional, read-only) `Workspaces/Copilot/infra/infra.manifest.yaml` for non-secret endpoints/DB names
- `#getTerminalOutput` and `#terminalLastCommand` for runtime evidence

## Launch Policy
**Reference:** SelfAwareness.instructions.md for complete launch protocols, database connectivity, and port management rules.

### Key Points for Implementation Work
- **Development:** Use `ncb.ps1` for final builds, `nc.ps1` for quick restarts
- **Testing:** Playwright webServer manages app lifecycle via `PW_MODE=standalone`
- **Never mix:** Don't use PowerShell scripts during test execution

## Debug Logging Rules
- Marker: `[DEBUG-WORKITEM:{key}:{layer}:{RUN_ID}] message ;CLEANUP_OK`
- `{layer}` values: `impl`, `tests`, `pwtest`, `retrosync`, `refactor`, `cleanup`, `lifecycle`
- `RUN_ID`: short unique id (timestamp + suffix)
- Modes:
  - **none**: no debug lines
  - **simple**: logs only for key lifecycle events and checks
  - **trace**: logs for every step, including intermediate calculations and branching

### Quality Gates
- **Completion Criteria:** Quality gates complete only when: analyzers green, linters clean, tests passing
- **Reference:** SelfAwareness.instructions.md for complete analyzer and linter rules

### Application Context
- **NOOR Canvas:** ASP.NET Core 8.0 + Blazor Server + SignalR
- **Node.js Role:** Test-only, exclusively for Playwright E2E
- **Test Execution:** Use `$env:PW_MODE="standalone"` for webServer management
- **Config:** `config/testing/playwright.config.cjs`

## Execution Protocol
1. **Load Architectural Context:** Use `Ref/SystemStructureSummary.md` to understand Razor view mappings, APIs, and database relationships for the `{key}`
2. **Incremental Implementation:** Smallest viable changes with validation cycles
3. **Quality Validation:** Analyzer → Linter → Playwright test execution per change
4. **Debug Markers:** Temporary diagnostics marked with `;CLEANUP_OK`
5. **Commit Process:** 
   - Pre-commit validation (unless `force`)
   - Stage changes: `git add .`
   - Handle untracked files (ignore or remove appropriately)
   - Commit with `{key}` and `RUN_ID` attribution
   - Verify clean state: `git status --porcelain` empty

## Test Organization
- **Spec Location:** `Workspaces/Copilot/prompts.keys/{key}/tests/`
- **Config:** Use centralized `config/testing/playwright.config.cjs` or key-specific config
- **Base URL:** Dynamic from APP_URL (never hardcode)

## Completion Criteria
- All quality gates passed (analyzers, linters, tests)
- Terminal evidence captured (10-20 lines)
- Clean git status (if applicable)
- Documentation properly placed in `Workspaces/Copilot/_DOCS/`
  - HTML report → `Workspaces/Copilot/artifacts/playwright/report`
- **Final Step**: Run `./Workspaces/Global/ncb.ps1` to ensure application is clean, built, and ready for manual testing

- Follow incremental accumulation:
  1. Implement change + spec → analyzers + lints → run spec1
  2. Add second change + spec → analyzers + lints → run spec1+spec2
  3. Add third change + spec → analyzers + lints → run spec1+spec2+spec3
  … continue until all pass

## Key Implementation Patterns (Migrated from IssueTracker)

### Authentication & Routing Implementation
- **Route Disambiguation**: Always verify @page directives don't create ambiguous routes
- **Token Validation**: Use appropriate API endpoints based on token format (GUID vs friendly tokens)
- **Error Handling**: Implement user-friendly error messages for authentication failures
- **Multi-route Support**: Support multiple route patterns with proper parameter handling

### Database Integration Standards
- **Connection Strings**: Use standardized connection strings with proper timeout configuration
- **Entity Framework**: Handle DbContext initialization issues with retry patterns
- **KSESSIONS Integration**: Support both database lookup and fallback patterns for data display
- **Foreign Key Constraints**: Implement proper validation for session and participant relationships

### UI/UX Implementation Standards
- **CSS Framework**: Use Tailwind CSS with consistent purple theme throughout
- **Responsive Design**: Implement proper centering and sizing for all authentication components
- **Animation Support**: Include smooth transitions and loading states where appropriate
- **Visual Consistency**: Maintain consistent padding, spacing, and component sizing

### SignalR & Real-time Features
- **Message Serialization**: Handle InvalidDataException during data parsing appropriately
- **Connection Management**: Implement proper connection lifecycle management
- **Participant Updates**: Support real-time participant list updates without connection drops
- **Error Recovery**: Implement graceful degradation for SignalR connection failures

---

_Note: This file depends on the central `Ref/SystemStructureSummary.md`. If structural changes are made, update that summary._


---

_Important: When suggesting or implementing changes, you must **only commit** after the implementation is complete **and explicit approval is received from the User**._


---

### Approval Checklist (required before commit)
- [ ] User has reviewed the proposed changes
- [ ] User has explicitly approved the commit
- [ ] All instructions in Ref/SystemStructureSummary.md are respected
- [ ] No conflicts remain with other prompts or instruction files

_Do not commit until all items are checked and explicit approval is confirmed._

## Change Tracking
- Before applying modifications, create a structured log entry in `Workspaces/Copilot/change_log/`.
- Include key, files, APIs, SQL objects, timestamp, and commit hash.
- Append updates if multiple passes occur.
- Ensure undo path (commit hash or backup) is recorded.

## Undo Tracking Behavior
- All changes are logged under this file until the key is closed by `/keylock`.

## Git Backup Discipline
- Before applying changes, always run:
  `git add -A && git commit -m "Backup before workitem <key>"`
- Record the commit hash in the undo log for rollback.

---
### Patch: Workitem Dual Integrity Design
- Begin with full key data stream audit (structure, consistency, quality, alignment, timeliness).
- Report audit results before any analysis.
- Output in structured bullet format under sections: Current State, Work Request Understanding, Task Breakdown, Dependencies & Risks, Execution Plan.
- Update key data stream with verified results.
- End with targeted integrity check (only modified/added tasks) to confirm no duplicates or contradictions.
