---
mode: agent
---
# /continue — Progressor Agent (2.3.0)

Advances a partially completed `/workitem` using the same rails, without resetting context or contracts. Continue *exactly* where the last successful step left off.

## Inputs (read)
- `.github/prompts/SelfAwareness.instructions.v2.md`
- `Workspaces/copilot/state/{key}/Requirements-{key}.md`
- `Workspaces/copilot/state/{key}/Cleanup-{key}.md`
- (Optional, read-only) `Workspaces/copilot/infra/infra.manifest.yaml` for non-secret endpoints/DB names
- `#getTerminalOutput` and `#terminalLastCommand` (always factor evidence into analysis)

## Launch Policy
- **Never** use `dotnet run`.
- Use only:
  - `./Workspaces/copilot/Global/nc.ps1`  # launch
  - `./Workspaces/copilot/Global/ncb.ps1` # clean, build, then launch
- If you stop/restart the app, self-attribute it:
  `[DEBUG-WORKITEM:{key}:lifecycle] agent_initiated_shutdown=true reason=<text> ;CLEANUP_OK`

## Continuation Protocol
- Do **not** refactor the plan; pick up the next smallest change from the prior `/workitem` summary.
- Make **one** change at a time; run tests and review terminal evidence before proceeding.
- Keep temporary diagnostics minimal and always end such lines with `;CLEANUP_OK`.

## Testing
- Specs live at: `Workspaces/copilot/Tests/Playwright/{key}/`
- Global config must be at `Workspaces/copilot/config/playwright.config.ts` with:
  - `testDir: "Workspaces/copilot/Tests/Playwright"`
  - `baseURL` from `APP_URL` env var (do **not** hardcode URLs)
  - HTML report to `Workspaces/copilot/artifacts/playwright/report`
- Follow the **Iterative Accumulation Policy**:
  - After each new change/spec, run all prior specs cumulatively (1 → 1+2 → 1+2+3 …) and fix failures before moving on.

## Terminal Evidence (mandatory)
- Before/after significant steps, capture a short tail from `#getTerminalOutput`.
- Don’t claim shutdowns without evidence. If **you** initiated a restart/stop, state it explicitly and include the log line.

## Output & Approval Flow
- Provide: delta summary, files changed, specs added/updated, pass/fail state, and a **Terminal Evidence** block.
- Do **not** ask the user for approval until **all** identified tests for this scope are green.
- After a fully green run, ask the user to perform **one manual run**, then request approval to mark complete.

## Logging Conventions
- Implementation/continuation diagnostics:
  `[DEBUG-WORKITEM:{key}:continue] message ;CLEANUP_OK`
- Lifecycle events:
  `[DEBUG-WORKITEM:{key}:lifecycle] agent_initiated_shutdown=true reason=<text> ;CLEANUP_OK`

## Guardrails
- Do not modify `Workspaces/copilot/config/environments/appsettings.*.json` or secrets unless explicitly requested.
- Respect the canonical layout; do not create new roots outside `Workspaces/copilot/` (except `.github/`).
