---
mode: agent
---

# /continue — Continuation Agent (v3.0.0)

## Role
Use `/continue` when a Copilot task was stopped before completion.
This may happen because:
- The process was interrupted.
- The user provided clarification.
- The user supplied additional details after the original request.

`/continue` resumes the unfinished work for the same `key`, incorporating any new context or instructions.

Resumes partially completed work for `{key}`, ensuring quality gates pass before proceeding.

**Core Mandate:** Follow `.github/instructions/SelfAwareness.instructions.md` for all operating guardrails.

## Parameters
- **key:** Work stream identifier - auto-inferred if not provided
- **debug-level:** Debug behavior (`none`, `simple`, `trace`) - default: `simple`
- **mode:** Operation mode (`analyze`, `apply`, `test`, `rollback`) - default: `apply`
- **notes:** Continuation description (context, files, constraints)

## Operation Modes

### Test Mode (`mode: test`)
Perform `apply` mode work PLUS create temporary validation ONLY when `mode: test` is explicitly specified:
1. Execute continuation work
2. **ONLY if `mode: test`**: Generate headless Playwright test: `Workspaces/TEMP/continue-{key}-{RUN_ID}.spec.ts`
3. **ONLY if `mode: test`**: Execute test using proper command:
   ```powershell
   Start-Sleep -Seconds 15; netstat -an | findstr :9091; $env:PW_MODE="standalone"; npx playwright test "Workspaces/TEMP/continue-{key}-{RUN_ID}.spec.ts"
   ```
4. **ONLY if `mode: test`**: Validate test passes (3 retry limit)
5. **ONLY if `mode: test`**: Cleanup temporary test post-validation

**CRITICAL**: If `mode` is `analyze` or `apply`, do NOT create any temporary tests.

### Phase Processing (`---` Delimited Input)
**Reference:** SelfAwareness.instructions.md Phase Prompt Processing for complete workflow.
- Parse phases on `---` delimiters
- Sequential processing with temporary test per phase **ONLY when `mode: test`**
- **ONLY if `mode: test`**: Create temporary tests using proper execution:
  ```powershell
  Start-Sleep -Seconds 15; netstat -an | findstr :9091; $env:PW_MODE="standalone"; npx playwright test "Workspaces/TEMP/phase-{N}-{key}-{RUN_ID}.spec.ts"
  ```
- **NEVER** use `dotnet run`, `dotnet build`, `nc`, or `ncb` during test execution
- Cleanup after all phases complete (unless explicitly deferred)

## Context & Inputs
- **MANDATORY:** `.github/instructions/SelfAwareness.instructions.md` (operating guardrails)
- **MANDATORY:** `.github/instructions/SystemStructureSummary.md` (architectural mappings and structural orientation)
- **Architecture:** `.github/instructions/NOOR-CANVAS_ARCHITECTURE.MD`
- `Workspaces/Copilot/prompts.keys/{key}/` work stream files
- **Terminal State Analysis:**
  - `#getTerminalOutput` for current buffer contents
  - `#terminalLastCommand` for execution context
  - Exit codes, error states, working directory context

## Operating Protocols
**Reference:** SelfAwareness.instructions.md for complete launch, database, analyzer, and linter rules.
**Reference:** SystemStructureSummary.md for architectural mappings, component relationships, and API/database context.

### Quality Gates
- Continuation proceeds only when: analyzers green, linters clean, tests passing
- Override available via explicit user request (manual use only)
- Debug marker: `[DEBUG-WORKITEM:{key}:{layer}:{RUN_ID}] message ;CLEANUP_OK`

## Continuation Protocol
1. **Load Context**: Read requirements, self-review, and prior changes
2. **Load Architectural Context**: Use `SystemStructureSummary.md` to understand component relationships and API mappings for the `{key}`
3. **Analyze Terminal State**: Use `#getTerminalOutput` and `#terminalLastCommand` to assess:
   - Last command executed and its exit code
   - Current working directory context
   - Any error messages or warnings in recent output
   - Previous analyzer/linter/test results
3. **Identify Last Good State**: Determine checkpoint based on terminal evidence:
   - Successful build outputs (exit code 0)
   - Passing test runs (no failures in output)
   - Clean linter results (no warnings/errors)
4. **Resume Implementation**: Continue from verified checkpoint
5. **After Each Incremental Change**:
   - Run analyzers and capture terminal output
   - Run lints and analyze results in terminal
   - Run tests for this `{key}` and review output
   - Factor terminal results into next decision
6. **Record Evidence**: Include terminal output snippets in debug logs

## Cleanup Protocol (when explicit approval received)
1. **Pre-commit validation**: Ensure all checks pass (unless explicitly overridden)
2. **Stage relevant changes**: `git add .` for all continuation work
3. **Handle uncommitted artifacts**:
   - Progress logs → Keep in `Workspaces/Copilot/continue/{key}/`
   - Checkpoint files → Update and commit with work
   - Temporary test files → Remove or move to appropriate directories
   - Debug outputs → Clean up or add to `.gitignore`
4. **Commit with continuation attribution**: Include `{key}` and continuation context
5. **Verify clean working tree**: No uncommitted changes should remain
6. **Update checkpoint state** to reflect completed continuation

## Iterative Testing
- Use Playwright tests in `Workspaces/Copilot/prompts.keys/{key}/tests/`
- **Always use `PW_MODE=standalone`** for webServer automatic app management
- Ensure global config (`config/testing/playwright.config.cjs`) points to correct testDir and baseURL
- **NEVER manually start .NET app** - let Playwright's webServer handle it
- **NEVER use `dotnet run`, `dotnet build`, `nc`, or `ncb`** during test execution
- Add/extend tests for resumed work
- Run cumulative suite to ensure nothing regresses

### Correct Test Execution for Continuation
```powershell
# Always start with sleep timer and port check
Start-Sleep -Seconds 15; netstat -an | findstr :9091
# Set standalone mode and run tests
$env:PW_MODE="standalone"; npx playwright test "test-file.spec.ts"
# For full suite with config
$env:PW_MODE="standalone"; npx playwright test --config=config/testing/playwright.config.cjs
```

## Terminal Evidence (Enhanced Analysis)

### Required Terminal Analysis
- **Before Changes**: Capture current terminal state using `#getTerminalOutput`
  - Last command executed and exit code
  - Working directory context
  - Any pending error states or warnings
- **During Implementation**: Monitor terminal feedback after each step:
  - Analyzer results (build warnings/errors)
  - Linter output (formatting/style issues)
  - Test execution results (pass/fail status)
- **After Changes**: Document final terminal state
  - Clean exit codes (0 = success)
  - No remaining errors in output
  - Successful completion messages

### Terminal Output Integration
- Use `#terminalLastCommand` to understand what was attempted previously
- Analyze exit codes: 0 (success), 1 (failure), other codes (specific errors)
- Parse error messages from terminal output to guide problem resolution
- Include 10-20 lines of relevant terminal output in continuation summary
- **Never ignore terminal warnings** - address before proceeding

### Decision Making Based on Terminal Output
- **Exit Code 0**: Proceed with confidence, previous step succeeded
- **Exit Code 1**: Investigate failure reason before continuing
- **Build Errors**: Must resolve before making additional changes
- **Test Failures**: Analyze failure patterns to inform implementation strategy

## Commit Policy
- Do not commit unless:
  - `dotnet build --no-restore --warnaserror` succeeds with 0 warnings, AND  
  - `npm run lint` passes with 0 warnings (using `config/testing/eslint.config.js`), AND  
  - `npm run format:check` passes with 0 formatting issues (using `config/testing/.prettierrc`), AND  
  - All relevant Playwright tests for `{key}` pass (using `config/testing/playwright.config.cjs`).  
- Commits must be blocked if any analyzers, lints, or tests fail.  
- Bypass is only allowed if user explicitly requests it.  
- All commit messages must reference the `{key}` they belong to.
- **When committing after explicit approval**: Clean up uncommitted files:
  - Add all relevant modified files: `git add .`
  - Reset/ignore untracked files that shouldn't be committed
  - Ensure clean working tree after commit: `git status --porcelain` should be empty
  - If conflicts arise, resolve by either committing or explicitly ignoring via `.gitignore`  

## Output & Approval Flow
Summaries must include:
- **Continuation Context**: What was resumed and why (based on terminal analysis)
- **Terminal State Analysis**: 
  - Previous command results and exit codes
  - Current working directory and environment state
  - Any error conditions discovered in terminal output
- **Files Updated**: List with rationale based on terminal feedback
- **Analyzer/Linter Results**: 
  - Terminal output showing build success/failure
  - Linting results with specific error counts
  - Resolution of any terminal-reported issues
- **Tests Updated**: Current state with terminal evidence
  - Test execution output (pass/fail counts)
  - Any test failures with terminal error details
  - Performance metrics from terminal (execution time)
- **Terminal Evidence**: 
  - Before: Initial terminal state
  - During: Key command outputs during implementation
  - After: Final clean terminal state
  - Command sequence that led to current state

### Approval Requirements
- All terminal outputs show successful completion (exit code 0)
- No unresolved errors or warnings in terminal history
- Clean analyzer/linter/test results confirmed via terminal evidence

## Guardrails

## Database Guardrails
**See SelfAwareness.instructions.md for complete database connectivity and port management protocols.**

---

_Note: This file depends on the central `SystemStructureSummary.md`. If structural changes are made, update that summary._


---

_Important: When suggesting or implementing changes, you must **only commit** after the implementation is complete **and explicit approval is received from the User**._


---

### Approval Checklist (required before commit)
- [ ] User has reviewed the proposed changes
- [ ] User has explicitly approved the commit
- [ ] All instructions in SystemStructureSummary.md are respected
- [ ] No conflicts remain with other prompts or instruction files

_Do not commit until all items are checked and explicit approval is confirmed._

## Change Tracking
- Resume or append structured log entries under the same ChangeID when continuing work.
- Record key, files, APIs, SQL objects, timestamp, and commit hash.
- Ensure undo path is maintained for surgical rollback.

## Undo Tracking Behavior
- Do not create a new log; always extend the one tied to the key.

### Rollback Mode (`mode: rollback`)
- Identify the active key (use last open workitem if none provided).
- Retrieve undo logs for that key from the database.
- Reset repository to last backup commit with `git reset --hard <hash>`.
- Summarize rollback actions.
- Keep the key open for further work.

## Git Backup Discipline
- In apply/test modes, always run:
  `git add -A && git commit -m "Backup before continue <key>"`
- Record commit hash in undo log.