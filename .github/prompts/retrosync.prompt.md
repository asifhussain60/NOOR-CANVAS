---
mode: agent
---
# /retrosync — Requirements & Reality Reconciler (2.3.0)

Align code and tests with `Requirements-{key}.md`, surface gaps, add missing coverage, and record a self-review with terminal-grounded evidence.

## Inputs (read)
- `.github/prompts/SelfAwareness.instructions.v2.md`
- `Workspaces/copilot/state/{key}/Requirements-{key}.md`
- `Workspaces/copilot/state/{key}/Cleanup-{key}.md`
- (Optional, read-only) `Workspaces/copilot/infra/infra.manifest.yaml` for non-secret endpoints/DB names
- `#getTerminalOutput` and `#terminalLastCommand` (mandatory for evidence)

## Launch Policy
- **Never** use `dotnet run`.
- Use only:
  - `./Workspaces/copilot/Global/nc.ps1`  # launch
  - `./Workspaces/copilot/Global/ncb.ps1` # clean, build, then launch
- If you stop/restart the app, self-attribute it:
  `[DEBUG-WORKITEM:{key}:lifecycle] agent_initiated_shutdown=true reason=<text> ;CLEANUP_OK`

## Reconciliation Steps
1. **Parse requirements:** Extract concrete, testable behaviors from `Requirements-{key}.md` (routes, DTOs, UI states, validation, auth).
2. **Map to tests:** For each requirement, find matching specs under `Workspaces/copilot/Tests/Playwright/{key}/`. Note missing or ambiguous coverage.
3. **Plan minimal deltas:** Propose the smallest changes to code and/or specs to satisfy each unmet requirement. Respect existing contracts.
4. **Apply incrementally:** Implement one change at a time, then update/add exactly one spec for that change.
5. **Iterative Accumulation:** After each spec addition, run the suite cumulatively (1 → 1+2 → 1+2+3 …) until **all** scoped specs are green.
6. **Self-Review:** Update `Workspaces/copilot/state/{key}/SelfReview-{key}.md` and create a timestamped snapshot in `Workspaces/copilot/state/{key}/reviews/`.

## Testing Canon
- Specs live at: `Workspaces/copilot/Tests/Playwright/{key}/`
- Global config: `Workspaces/copilot/config/playwright.config.ts` must set:
  - `testDir: "Workspaces/copilot/Tests/Playwright"`
  - `baseURL` from `APP_URL` env var (do **not** hardcode URLs)
  - Reporter output to `Workspaces/copilot/artifacts/playwright/report`
- Tag specs with `@{key}`; allow filtering via `PW_GREP`.

## Terminal Evidence (mandatory)
- Include a short, relevant tail from `#getTerminalOutput` in every summary.
- Do not claim shutdowns without evidence. If **you** initiated it, state so and include the structured line.

## Output
Provide a structured summary containing:
- **Requirements coverage matrix:** requirement → spec(s) → status (covered / missing / flaky)
- **Changes applied:** files and rationale
- **Specs added/updated:** names and current pass/fail
- **Terminal Evidence:** last 10–20 relevant lines with timestamps
- **Next steps:** remaining unaddressed requirements (if any)

## Guardrails
- Do not modify `Workspaces/copilot/config/environments/appsettings.*.json` or secrets unless explicitly requested.
- Respect canonical layout; do not create new roots outside `Workspaces/copilot/` (except `.github/`).
- Temporary diagnostics must end with `;CLEANUP_OK` for safe removal by `/cleanup`.
