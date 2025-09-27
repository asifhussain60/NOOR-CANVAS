---
mode: agent
---

# /workitem — Implementation Agent (v3.0.0)

Implements scoped changes for `{key}` and stabilizes with analyzers, tests, and structured validation.

**Core Mandate:** Follow `.github/instructions/SelfAwareness.instructions.md` for all operating guardrails.

## Parameters
- **key:** Work stream identifier - auto-inferred if not provided
- **log:** Debug behavior (`none`, `simple`, `trace`) - default: `simple`
- **commit:** Commit control (`true`, `false`, `force`) - subject to quality gates
- **mode:** Operation mode (`analyze`, `apply`, `test`) - default: `apply`
- **notes:** Work description (scope, files, constraints)

## Context & Inputs
- **MANDATORY:** `.github/instructions/SelfAwareness.instructions.md` (operating guardrails)
- **Architecture:** `.github/instructions/NOOR-CANVAS_ARCHITECTURE.MD`
- `Workspaces/Copilot/prompts.keys/{key}/` work stream files
- `#getTerminalOutput` for execution evidence

## Operating Protocols
**Reference:** SelfAwareness.instructions.md for complete launch, database, analyzer, linter, and commit rules.

### Documentation Placement
- **CRITICAL:** All documentation in `Workspaces/Copilot/_DOCS/` subdirectories
- **NEVER** create analysis/summary files in project root
- Follow SelfAwareness File Organization Rules

## Operation Modes

### Test Mode (`mode: test`)
**Create temporary validation tests only when explicitly specified:**

When `mode: test` is specified, execute ALL of `apply` mode functionality PLUS these additional steps:

1. **Execute Apply Mode**: Complete all requested work exactly as per `apply` mode
2. **Create Temporary Test**: Generate a headless, silent Playwright test:
   - Location: `Workspaces/TEMP/workitem-{key}-{RUN_ID}.spec.ts`
   - Must be headless and silent (no browser UI)
   - Test should validate the specific changes made
3. **Run and Validate**: Execute the temporary test and ensure it passes (retry up to 3 times if needed)
4. **Mark Complete**: Log completion: `[DEBUG-WORKITEM:{key}:impl:{RUN_ID}] test_mode_validation_complete ;CLEANUP_OK`
5. **Cleanup**: Remove the temporary test file after successful validation
6. **Final Checks**: Run full analyzer/linter/test suite as per normal protocol

**Note**: If `mode` is `analyze` or `apply`, do NOT create any temporary tests.

## Phase Prompt Handling
When user input contains `---` separators, treat each section as a separate todo item:

1. **Parse Phases**: Split input on `---` delimiters to identify individual todo items
2. **Sequential Processing**: Process each phase in order:
   - Make the required change
   - Create a headless, silent Playwright test in `Workspaces/TEMP/phase-{phase_number}-{key}-{RUN_ID}.spec.ts`
   - Ensure the test passes (retry up to 3 times if needed)
   - Mark the todo complete with debug log: `[DEBUG-WORKITEM:{key}:impl:{RUN_ID}] phase_{phase_number}_complete ;CLEANUP_OK`
   - Move to next phase
3. **Test Requirements**: 
   - Tests must be headless and silent (no browser UI)
   - Use `Workspaces/TEMP/` directory for temporary phase tests only
   - Follow proper Playwright structure for permanent tests as per config files
   - Clean up temporary tests after all phases complete (unless `commit:false`)
4. **Completion**: After all phases complete, run full analyzer/linter/test suite before final commit

## Inputs (read)
- `.github/instructions/SelfAwareness.instructions.md`
- `Workspaces/Copilot/prompts.keys/{key}/workitem/Requirements-{key}.md`
- `Workspaces/Copilot/prompts.keys/{key}/workitem/SelfReview-{key}.md`
- `Workspaces/Copilot/prompts.keys/{key}/workitem/Cleanup-{key}.md` (optional overrides)
- (Optional, read-only) `Workspaces/Copilot/infra/infra.manifest.yaml` for non-secret endpoints/DB names
- `#getTerminalOutput` and `#terminalLastCommand` for runtime evidence

## Launch Policy

### For Development Work
- **Never** use `dotnet run` or any variant for development.
- Launch only via:
  - `./Workspaces/Global/nc.ps1`  (launch only)
  - `./Workspaces/Global/ncb.ps1` (clean, build, then launch)
- If you stop or restart the app, self-attribute in logs:  
  `[DEBUG-WORKITEM:{key}:lifecycle:{RUN_ID}] agent_initiated_shutdown=true reason=<text> ;CLEANUP_OK`

### For Playwright Testing (when mode: test)
- **Use Playwright's webServer configuration** for automatic app lifecycle management
- **Set `PW_MODE=standalone`** to enable webServer startup
- **Never** use PowerShell scripts during test execution
- Playwright handles `dotnet run` via webServer config in `config/testing/playwright.config.cjs`

## Debug Logging Rules
- Marker: `[DEBUG-WORKITEM:{key}:{layer}:{RUN_ID}] message ;CLEANUP_OK`
- `{layer}` values: `impl`, `tests`, `pwtest`, `retrosync`, `refactor`, `cleanup`, `lifecycle`
- `RUN_ID`: short unique id (timestamp + suffix)
- Modes:
  - **none**: no debug lines
  - **simple**: logs only for key lifecycle events and checks
  - **trace**: logs for every step, including intermediate calculations and branching

### Quality Gates
- **Stop on violations:** Analyzers or linters must pass before proceeding
- **Reference:** SelfAwareness.instructions.md for complete rules

### Application Context
- **NOOR Canvas:** ASP.NET Core 8.0 + Blazor Server + SignalR
- **Node.js Role:** Test-only, exclusively for Playwright E2E
- **Test Execution:** Use `$env:PW_MODE="standalone"` for webServer management
- **Config:** `config/testing/playwright.config.cjs`

## Execution Protocol
1. **Incremental Implementation:** Smallest viable changes with validation cycles
2. **Quality Validation:** Analyzer → Linter → Playwright test execution per change
3. **Debug Markers:** Temporary diagnostics marked with `;CLEANUP_OK`
4. **Commit Process:** 
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