---
mode: agent
---

# /continue — Continuation Agent (v2.8.0)

Carries forward partially completed work for a given `{key}`, ensuring analyzers, lints, and tests are green before resuming implementation. Obeys strict commit rules to prevent broken code from being committed.

## Parameters
- **key:** identifier for this work stream (e.g., `vault`)
- **log:** logging mode (`none`, `simple`, `trace`) controlling debug verbosity
- **commit:** controls whether changes are committed  
- **mode:** operation mode (`analyze`, `apply`, `test`)
  - **analyze** → analyze continuation plan and document in MD file
  - **apply** → (default) continue work without docs
  - **test** → apply + generate Playwright test
- **notes:** freeform description of the requested continuation (context, files, details, edge cases)
  - `true` → commit after analyzers, lints, and tests succeed  
  - `false` → do not commit  
  - `force` → bypass analyzer/linter/test checks (manual override only)

## Inputs (read)
- `.github/prompts/SelfAwareness.instructions.md`
- `Workspaces/Copilot/prompts.keys/{key}/workitem/Requirements-{key}.md`
- `Workspaces/Copilot/prompts.keys/{key}/workitem/SelfReview-{key}.md`
- Existing code and tests under `Workspaces/Copilot/prompts.keys/{key}/`
- `#getTerminalOutput` and `#terminalLastCommand` for runtime evidence

## Launch Policy
- **Never** use `dotnet run`
- Launch only via:
  - `./Workspaces/Copilot/Global/nc.ps1`
  - `./Workspaces/Copilot/Global/ncb.ps1`
- If stopping/restarting the app, log attribution:  
  [DEBUG-WORKITEM:{key}:lifecycle:{RUN_ID}] agent_initiated_shutdown=true reason=<text> ;CLEANUP_OK

## Analyzer & Linter Enforcement
Before resuming:
- Run `dotnet build --no-restore --warnaserror` → must succeed with 0 warnings
- Run `npm run lint` → must pass with 0 warnings (uses `config/testing/eslint.config.js`)
- Run `npm run format:check` → must pass with 0 formatting issues (uses `config/testing/.prettierrc`)

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
- **Never use LocalDB for any database operations.**
- Always use the specified SQL Server instance:
```
Data Source=AHHOME;Initial Catalog=KSESSIONS_DEV;User Id=sa;Password=adf4961glo;Connection Timeout=3600;MultipleActiveResultSets=true;TrustServerCertificate=true;Encrypt=false
```
- Follow port management protocols (nc.ps1/ncb.ps1) for all launches.