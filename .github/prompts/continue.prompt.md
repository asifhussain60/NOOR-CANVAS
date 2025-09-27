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
- `#getTerminalOutput` and `#terminalLastCommand` for runtime evidence

## Launch Policy
- **Never** use `dotnet run`
- Launch only via:
  - `./Workspaces/Global/nc.ps1`
  - `./Workspaces/Global/ncb.ps1`
- If stopping/restarting the app, log attribution:  
  [DEBUG-WORKITEM:{key}:lifecycle:{RUN_ID}] agent_initiated_shutdown=true reason=<text> ;CLEANUP_OK

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
1. Load context from requirements, self-review, and prior changes
2. Identify the last verified good state (analyzers, lints, tests passing)
3. Resume implementation from that checkpoint
4. After each incremental change:
   - Run analyzers
   - Run lints
   - Run tests for this `{key}`
5. Record debug logs and evidence inline with changes

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
- Ensure global config points to correct testDir and baseURL
- Add/extend tests for resumed work
- Run cumulative suite to ensure nothing regresses

## Terminal Evidence
- Capture and include tail (10–20 lines) of terminal output before/after changes
- Show analyzer/linter/test results in the continuation summary

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
- What was resumed and why
- Files updated
- Analyzer/linter results
- Tests updated and their current state
- Terminal Evidence

Approval:

## Guardrails

## Database Guardrails
**See SelfAwareness.instructions.md for complete database connectivity and port management protocols.**