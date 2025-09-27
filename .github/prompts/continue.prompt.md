---
mode: agent
---

# /continue — Continuation Agent (v2.8.0)

Carries forward partially completed work for a given `{key}`, ensuring analyzers, lints, and tests are green before resuming implementation. Obeys strict commit rules to prevent broken code from being committed.

## Parameters
- **key:** identifier for this work stream (e.g., `vault`)
- **log:** logging mode (`none`, `simple`, `trace`) controlling debug verbosity - default: `simple`
- **commit:** controls whether changes are committed
  - `true` → commit after analyzers, lints, and tests succeed  
  - `false` → do not commit  
  - `force` → bypass analyzer/linter/test checks (manual override only)
- **mode:** operation mode (`analyze`, `apply`, `test`)
  - **analyze** → analyze continuation plan and document in MD file
  - **apply** → (default) continue work without docs, no temporary tests
  - **test** → perform all `apply` work PLUS create temporary validation test + cleanup
- **notes:** freeform description of the requested continuation (context, files, details, edge cases)

## Test Mode Protocol (ONLY when mode: test)
**IMPORTANT**: Temporary tests are ONLY created when `mode: test` is explicitly specified.

When `mode: test` is specified, execute ALL of `apply` mode functionality PLUS these additional steps:

1. **Execute Apply Mode**: Resume all requested work exactly as per `apply` mode from last checkpoint
2. **Create Temporary Test**: Generate a headless, silent Playwright test:
   - Location: `Workspaces/TEMP/continue-{key}-{RUN_ID}.spec.ts`
   - Must be headless and silent (no browser UI)
   - Test should validate the specific continuation changes made
3. **Run and Validate**: Execute the temporary test and ensure it passes (retry up to 3 times if needed)
4. **Mark Complete**: Log completion: `[DEBUG-WORKITEM:{key}:impl:{RUN_ID}] test_mode_validation_complete ;CLEANUP_OK`
5. **Cleanup**: Remove the temporary test file after successful validation
6. **Final Checks**: Run full analyzer/linter/test suite as per normal protocol

**Note**: If `mode` is `analyze` or `apply`, do NOT create any temporary tests.

## Phase Prompt Handling
When continuation input contains `---` separators, treat each section as a separate todo item:

1. **Parse Phases**: Split continuation input on `---` delimiters to identify individual todo items
2. **Sequential Processing**: Process each phase in order:
   - Resume/continue the required change from last checkpoint
   - Create a headless, silent Playwright test in `Workspaces/TEMP/continue-phase-{phase_number}-{key}-{RUN_ID}.spec.ts`
   - Ensure the test passes (retry up to 3 times if needed)
   - Mark the todo complete with debug log: `[DEBUG-WORKITEM:{key}:impl:{RUN_ID}] continue_phase_{phase_number}_complete ;CLEANUP_OK`
   - Update checkpoint state
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
- Existing code and tests under `Workspaces/Copilot/prompts.keys/{key}/`
- **Terminal State Analysis** (CRITICAL):
  - `#getTerminalOutput` for current terminal buffer contents
  - `#terminalLastCommand` for last executed command context
  - Exit codes and error states from previous operations
  - Working directory context and environment variables
  - Recent command history to understand implementation sequence

## Launch Policy

### For Development Work
- **Never** use `dotnet run` for development
- Launch only via:
  - `./Workspaces/Global/nc.ps1`
  - `./Workspaces/Global/ncb.ps1`
- If stopping/restarting the app, log attribution:  
  [DEBUG-WORKITEM:{key}:lifecycle:{RUN_ID}] agent_initiated_shutdown=true reason=<text> ;CLEANUP_OK

### For Playwright Testing (when mode: test)
- **Use Playwright's webServer configuration** for automatic app lifecycle management
- **Set `PW_MODE=standalone`** to enable webServer startup
- **Never** use PowerShell scripts during test execution
- Playwright handles `dotnet run` via webServer config in `config/testing/playwright.config.cjs`

## Analyzer & Linter Enforcement
**See SelfAwareness.instructions.md for complete analyzer and linter rules.**

Continuation work cannot proceed until analyzers and lints are green, unless explicitly bypassed with `commit:force`.

## Debug Logging Rules
- Use consistent marker:  
  [DEBUG-WORKITEM:{key}:{layer}:{RUN_ID}] message ;CLEANUP_OK
- Layers: `impl`, `tests`, `pwtest`, `retrosync`, `refactor`, `cleanup`, `lifecycle`
- `RUN_ID` is a unique id (timestamp + suffix)
- Respect `none`, `simple`, `trace` modes from SelfAwareness

## Continuation Protocol
1. **Load Context**: Read requirements, self-review, and prior changes
2. **Analyze Terminal State**: Use `#getTerminalOutput` and `#terminalLastCommand` to assess:
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

## Cleanup Protocol (when `commit:true` or `commit:force`)
1. **Pre-commit validation**: Ensure all checks pass (unless `force`)
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
- **Never manually start .NET app** - let Playwright's webServer handle it
- Add/extend tests for resumed work
- Run cumulative suite to ensure nothing regresses

### Correct Test Execution for Continuation
```powershell
# Set standalone mode
$env:PW_MODE="standalone"
# Run tests with webServer management
npx playwright test --config=config/testing/playwright.config.cjs
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
- Bypass is only allowed if user explicitly sets `commit:force`.  
- All commit messages must reference the `{key}` they belong to.
- **When `commit:true` or `commit:force`**: Clean up uncommitted files:
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