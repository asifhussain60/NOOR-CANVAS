---
mode: agent

# ─────────────────────────────────────────────────────────
# ▶️ Usage
# ─────────────────────────────────────────────────────────
name: pwtest
alias: /pwtest
description: >
  Generate and/or run Playwright test suites for Noor Canvas work items.
  Tests run HEADLESS and should cover UI, API, and (where applicable) DB-visible effects.
  Integrates with workitem and retrosync flows (test:true), or can be invoked directly.
  Includes a watchdog that detects hung generation/run steps and self-recovers.

parameters:
  - name: key
    required: true
    description: >
      Work item key the tests belong to (same as workitem key), e.g., NC-145 or hostcanvas.

  - name: mode
    required: true
    description: >
      Execution mode:
        • test → Generate Playwright test spec(s) only (no execution).
        • run  → Execute existing specs headlessly.
        • all  → Generate + run immediately.

  - name: notes
    required: false
    description: >
      Additional test scope (negative paths, tokens, scenarios).
      Multiple notes may be provided separated by '---'.

usage:
  prerequisites:
    - Node and Playwright installed; repo ready to run.
    - If e2e flows require the app, **always** start/refresh using the build+run script:
        • .\Workspaces\Global\ncb.ps1     # builds and launches; REQUIRED (do not use dotnet run / nc.ps1)
    - Confirm environment assumptions (ports 9090/9091, Canvas writable, KSESSIONS_DEV read-only).

  run_examples:
    - Generate specs only:
        • /pwtest key:NC-145 mode:test notes:"cover error toast --- validate a11y roles"
    - Run existing specs headless:
        • /pwtest key:NC-145 mode:run
    - Generate + run:
        • /pwtest key:NC-145 mode:all

  outputs:
    - test: specs under Tests/Playwright/{key}/ and `.github/Test-{key}.MD` coverage doc.
    - run/all: headless results + artifacts (traces/screenshots/videos) and doc updates.

# ─────────────────────────────────────────────────────────
# 🧭 Context Boot
# ─────────────────────────────────────────────────────────
context_boot:
  - Load prior state for this key:
      • Read **NOOR CANVAS\Workspaces\Copilot\{key}\** for context/evidence.
      • Avoid re-generating identical tests or re-running unchanged scopes.
  - context_index:
      discover:
        - Look for `NOOR CANVAS\Workspaces\Copilot\{key}\index\context.idx.json`.
        - If present → prefer `context.pack.jsonl` to select test targets and coverage.
        - If absent/stale → build or delta-build per SelfAwareness rules.
      prefer_for_planning: true
      record_delta:
        - After run, write `context.delta.json` and update `context.sources.json`.
  - Read `.github/instructions/SelfAwareness.instructions.md` for DB/schema restrictions and ledger.
  - Review debug logs for this key across UI/API/SQL to identify coverage gaps.
  - Skim last 10 commits/chats for context relevant to this key.
  - If `Requirements-{key}.MD` exists:
      • Treat as authoritative acceptance criteria.
      • Ensure numbered requirements are tested across UI/API/DB layers.

# ─────────────────────────────────────────────────────────
# 💾 Durable State & Checkpoints
# ─────────────────────────────────────────────────────────
state_store:
  root: "NOOR CANVAS\\Workspaces\\Copilot\\pwtest\\{key}\\"
  files:
    run_manifest:   "run.json"
    plan_manifest:  "plan.json"
    progress_log:   "progress.log.jsonl"
    checkpoint:     "checkpoint.json"
    artifacts_idx:  "artifacts.json"
  includes_index:
    path: "NOOR CANVAS\\Workspaces\\Copilot\\{key}\\index\\"
    files: [ "context.idx.json", "context.pack.jsonl", "context.delta.json", "context.sources.json" ]
  io: { write_mode: append_minimal, compress: true, atomic_writes: true, debounce_ms: 150 }
  load_policy:
    - Resume from checkpoint if plan_hash matches; else write plan-v{n}.json and resume.
  save_policy:
    - Update checkpoint + append progress + update artifacts after each step.
  retention: { ttl_hours: 24, cleanup_on_approval: true }

# ─────────────────────────────────────────────────────────
# 🎯 Objectives
# ─────────────────────────────────────────────────────────
objectives:
  test:
    - Scaffold Playwright specs under `Tests/Playwright/{key}/`.
    - Cover core flows (UI navigation, API requests, DB-visible effects).
    - Include at least one negative path.
    - Validate against `Requirements-{key}.MD` when present.
    - Write/update `.github/Test-{key}.MD` documenting coverage and rationale.
  run:
    - Ensure the app is running via `.\Workspaces\Global\ncb.ps1` if end-to-end is required.
    - Execute tests HEADLESS; collect traces/screenshots/videos on failures.
    - Update `.github/Test-{key}.MD` with outcomes and artifact paths.
  all:
    - Do both: generate specs and run them headlessly.

# ─────────────────────────────────────────────────────────
# 🔗 Alignment
# ─────────────────────────────────────────────────────────
alignment:
  - .github/instructions/SelfAwareness.instructions.md
  - Requirements-{key}.MD
  - D:\PROJECTS\NOOR CANVAS\.github\*.MD
  - Cleanup-<key}.MD

# ─────────────────────────────────────────────────────────
# 🛠️ Methods
# ─────────────────────────────────────────────────────────
methods:
  test:
    - Create spec files in `Tests/Playwright/{key}/`.
    - Include UI interactions, API validation, DB-visible effects.
    - Use placeholders for secrets/tokens.
    - Validate specs against `Requirements-{key}.MD` when available.
    - Add **signalr.contract.spec.ts** (or **api.contract.spec.ts**) that:
        • connects to the hub/endpoint,
        • triggers the minimal producer path (test hook or fixture),
        • asserts the payload includes all **consumer-required** fields,
        • asserts DOM renders content for fields like `testContent` (sanitized HTML).
    - Update `.github/Test-{key}.MD` with coverage rationale and spec list.

  run:
    - If e2e flows are needed, **always run** `.\\Workspaces\\Global\\ncb.ps1` (build + run) beforehand.
      Do not call `dotnet run` directly; do not substitute `nc.ps1`.
    - Execute: `npx playwright test --reporter=line --headless`.
    - On failures, collect artifacts and write paths into `.github/Test-{key}.MD`.

  all:
    - Execute `methods.test` then `methods.run`.

# ─────────────────────────────────────────────────────────
# 🐶 Watchdog — Self-Recovery from Hung Tests
# ─────────────────────────────────────────────────────────
watchdog:
  idle_seconds_threshold: 120
  graceful_stop_timeout_seconds: 10
  max_retries: 1
  monitored_steps: [ "spec_generation", "test_execution" ]
  behavior:
    - Detect idle → capture tails & process list; graceful stop → force kill; record event.
    - Retry once idempotently; else fail with `watchdog_hang`.

# ─────────────────────────────────────────────────────────
# 🧯 Error Handling (Git History First-Aid)
# ─────────────────────────────────────────────────────────
errors:
  on_test_failure_or_error:
    - Classify regression vs new feature; act accordingly.
    - Document evidence in `.github/Test-{key}.MD`.
  on_watchdog_hang:
    - Include log tails, process tree, and step metadata in the doc.
    - Reference Ops-Watchdog-Troubleshooting; keep state resumable.

# ─────────────────────────────────────────────────────────
# 🧪 Test Plan Contract
# ─────────────────────────────────────────────────────────
test_plan_contract:
  required_fields:
    - test_paths
    - setup_instructions
    - validation_steps
    - expected_outputs
    - artifacts
    - requirements_coverage

# ─────────────────────────────────────────────────────────
# 🚦 Guardrails
# ─────────────────────────────────────────────────────────
guardrails:
  - Always run Playwright headless.
  - If app execution is required, **must use** `.\\Workspaces\\Global\\ncb.ps1`; never `dotnet run`; never prefer `nc.ps1`.
  - Include at least one negative path.
  - Secrets/tokens as placeholders only.
  - Validate against `Requirements-{key}.MD` when present.
  - Keep state under `NOOR CANVAS\Workspaces\Copilot\pwtest\{key}\`; purge via `/cleanup`.
  - Record index delta after runs.

# ─────────────────────────────────────────────────────────
# 🧩 Output Shape
# ─────────────────────────────────────────────────────────
output:
  - state & index delta updated
  - specs: [paths]
  - run_results: pass/fail summary
  - artifacts: traces/screenshots/videos (on failures)
  - docs: `.github/Test-{key}.MD`
  - approval_gate:
      message: "Playwright tests complete. Approve?"
      on_approval: mark approved, recommend `/cleanup` for stale traces if desired
      on_no_approval: keep state; summarize failures/next steps

# ─────────────────────────────────────────────────────────
# 📝 Self-Review
# ─────────────────────────────────────────────────────────
self_review:
  - Consulted **context.pack.jsonl** and Requirements-{key}.MD.
  - Avoided duplicate generation/runs.
  - Headless-only confirmed.
  - Negative paths included.
  - Index delta written; state resumable.
