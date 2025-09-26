
# SelfAwareness - Global Operating Guardrails (2.3.0)

> Canonical operating rules for all agents. Keep **.github/prompts/** as the source of truth.
> Everything else lives under **Workspaces/copilot/**.

## Scope
Governs `/workitem`, `/continue`, `/pwtest`, `/cleanup`, `/retrosync`, `/imgreq`.

## Core Principles
- **Deterministic rails**: follow these rules exactly; do not invent new flows.
- **Single source of truth**: prompts here; configs and state under `Workspaces/copilot/`.
- **Evidence-first**: factor terminal logs and artifacts into analysis and summaries.
- **Small steps**: change one thing at a time, accumulate tests, and stabilize before moving on.

## Absolute Runtime Rules
- **Never** launch with `dotnet run` or any variant.
- Launch only via PowerShell scripts:
  - `./Workspaces/copilot/Global/nc.ps1`  (launch only)
  - `./Workspaces/copilot/Global/ncb.ps1` (clean, build, then launch)
- If the agent initiates a stop/restart, **self-attribute** in logs and summaries:
  - `[DEBUG-WORKITEM:{key}:lifecycle] agent_initiated_shutdown=true reason=<text> ;CLEANUP_OK`

## Enhanced Processor for DOM Issues (Blazor appendChild Fix)
- **Use enhanced processor approach** for large HTML content rendering in Blazor Server
- **Never use Blazor RenderTreeBuilder.AddMarkupContent()** for large HTML (>20KB)
- **Bypass appendChild errors** with pure JavaScript innerHTML assignment:
  - Log with `[DEBUG-WORKITEM:{key}:bypass] Enhanced processor activated ;CLEANUP_OK`
  - Use container.innerHTML = content instead of DOM tree operations
  - Implement fallback text-only mode for DOM constraints
- **Enhanced processor tags**: `[ENHANCED-PROCESSOR]` for console logs and error handling

## Terminal-Log Grounding (Mandatory)
- Always call **`#getTerminalOutput`** and consider **`#terminalLastCommand`** when diagnosing.
- Before claiming “app is shutting down”:
  - Inspect the last 10–20 relevant lines; identify initiator.
  - If **you** initiated it, say so explicitly (see self-attribution line above).
- Summaries include a **Terminal Evidence** section with a small, timestamped tail.

## Playwright Canon
- Global config: `Workspaces/copilot/config/playwright.config.ts` with:
  - `testDir: "Workspaces/copilot/Tests/Playwright"`
  - `baseURL` from `APP_URL` env var; **do not hardcode** URLs in specs.
  - HTML report to `Workspaces/copilot/artifacts/playwright/report`.
- Specs live at: `Workspaces/copilot/Tests/Playwright/{key}/`.
- Use tags like `@{key}` for quick filtering via `PW_GREP`.

## Iterative Accumulation Policy (Global)
1. Create **one** change and **one** test; run that test.
2. Add a second change + test; run **test1+test2**.
3. Add a third; run **test1+test2+test3**…  
Continue until **all** scoped tests are green.
- Do **not** ask the user for approval until all identified tests for the scope are green.
- After a fully green run, prompt the user for **one manual run**, then ask for approval to mark complete.

## Debug Logging & Cleanup Discipline
- Temporary diagnostics end with the **cleanup marker** `;CLEANUP_OK`.
- Use structured tags everywhere:
  - `[DEBUG-WORKITEM:{key}:impl]`, `[DEBUG-WORKITEM:{key}:continue]`, `[DEBUG-WORKITEM:{key}:lifecycle]`.
- `/cleanup` removes only marked lines/files or aged artifacts; real logs remain.

## Infra Awareness (Non-Secret)
- Non-secret infra map: `Workspaces/copilot/infra/infra.manifest.yaml`
- Environment appsettings: `Workspaces/copilot/config/environments/`
- **Never** embed secrets in code or prompts. Only edit appsettings when explicitly asked.

## Per-Key State & Indexing
- Per-key directory: `Workspaces/copilot/state/{key}/`
  - `Requirements-{key}.md`, `Cleanup-{key}.md`, `SelfReview-{key}.md`, `reviews/` snapshots
  - `index/` for any context indices (e.g., `context.idx.json`, `pack.jsonl`, `sources/`)

## Contract Compliance Workflow (All Agents)
1) Detect consumer vs producer contracts (DTOs, routes, schemas).  
2) Reconcile mismatches (missing/extra/type/nullability/version drift).  
3) Checkpoint.  
4) Incremental apply (phase 0→3).  
5) Golden fixtures + Playwright specs per requirement.

## Watchdog
- `idle_seconds_threshold: 120`
- `graceful_stop_timeout_seconds: 10`
- `max_retries: 1`

## Required Summary Sections (All Agents)
- What changed, why, and where (files).
- Tests created/updated and their pass/fail state.
- Terminal Evidence (last lines with timestamps).
- Next steps / resume instructions.
