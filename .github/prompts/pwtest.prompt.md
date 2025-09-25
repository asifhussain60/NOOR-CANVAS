---
mode: agent

# ─────────────────────────────────────────────────────────
# ▶️ Usage
# ─────────────────────────────────────────────────────────
name: pwtest
alias: /pwtest
description: >
  Generate and run Playwright test suites for Noor Canvas work items.
  Tests must run HEADLESS and cover UI, API, and DB layers where applicable.
  Integrates with workitem and sync flows (test:true), but can also be invoked directly.
  Includes a watchdog that detects hung generation/run steps and self-recovers.

parameters:
  - name: key
    required: true
    description: >
      Work item key the tests belong to (same as workitem key).

  - name: mode
    required: true
    description: >
      Execution mode:
        • "test" → Generate Playwright test spec(s) only.
        • "run"  → Execute existing specs headlessly.
        • "all"  → Generate + run immediately.

  - name: notes
    required: false
    description: >
      Additional test scope (negative paths, tokens, scenarios).
      Multiple notes may be provided separated by '---'.

usage:
  prerequisites:
    - Node and Playwright installed; repo ready to run.
    - App can launch if e2e flows require it:
      • D:\PROJECTS\NOOR CANVAS\Workspaces\Global\nc.ps1     # simple launch
      • D:\PROJECTS\NOOR CANVAS\Workspaces\Global\ncb.ps1    # build and launch
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
      • Read **NOOR CANVAS\Workspaces\Copilot\{key}\** (if present) for context/evidence.
      • Use to avoid re-generating identical tests or re-running unchanged scopes.
  - Read .github/instructions/SelfAwareness.instructions.md for DB/schema restrictions and ledger.
  - Review debug logs for this key across UI/API/SQL to identify coverage gaps.
  - Skim last 10 commits/chats for context relevant to this key.
  - If Requirements-{key}.MD exists (from imgreq runs):
      • Ingest its requirements as authoritative acceptance criteria.
      • Ensure all numbered requirements are tested across UI/API/DB layers.

# ─────────────────────────────────────────────────────────
# 💾 Durable State & Checkpoints (kept current)
# ─────────────────────────────────────────────────────────
state_store:
  root: "NOOR CANVAS\\Workspaces\\Copilot\\pwtest\\{key}\\"
  files:
    run_manifest:   "run.json"
    plan_manifest:  "plan.json"
    progress_log:   "progress.log.jsonl"
    checkpoint:     "checkpoint.json"
    artifacts_idx:  "artifacts.json"
  io: { write_mode: append_minimal, compress: true, atomic_writes: true, debounce_ms: 150 }
  load_policy:
    - Resume from checkpoint if plan_hash matches; else write plan-v{n}.json and resume.
  save_policy:
    - After each step: update checkpoint + append one progress line + update artifacts index.
  retention: { ttl_hours: 24, cleanup_on_approval: true }

# ─────────────────────────────────────────────────────────
# 🎯 Objectives
# ─────────────────────────────────────────────────────────
objectives:
  test:
    - Generate Playwright specs covering:
        • Core flows (UI navigation, API requests, DB assertions)
        • At least one negative path
    - Ensure tests explicitly validate Requirements-{key}.MD when present.
    - Save specs under: Tests/Playwright/{key}/
    - Generate new .MD doc in `.github` describing test coverage and rationale; add to alignment.
    - Leave pwtest state **up to date**.
  run:
    - Execute tests headlessly (`--headed` disallowed).
    - Collect traces, screenshots, videos for failures.
    - Update trackers with outcomes.
    - Leave pwtest state **up to date**.
  all:
    - Do both: generate specs and run them.

# ─────────────────────────────────────────────────────────
# 🔗 Alignment
# ─────────────────────────────────────────────────────────
alignment:
  - .github/instructions/SelfAwareness.instructions.md
  - Requirements-{key}.MD (from imgreq runs)
  - D:\PROJECTS\NOOR CANVAS\.github\*.MD
  - Cleanup-{key}.MD (from cleanup runs, for alignment)

# ─────────────────────────────────────────────────────────
# 🛠️ Methods
# ─────────────────────────────────────────────────────────
methods:
  test:
    - Scaffold spec files under Tests/Playwright/{key}/
    - Include UI interactions, API validation, DB-visible effects.
    - Use placeholders for secrets/tokens.
    - Validate specs against Requirements-{key}.MD when available.
    - Write/update `.github/Test-{key}.MD` documenting coverage and rationale.
  run:
    - Execute: `npx playwright test --reporter=line --headless`
    - Collect artifacts: { trace.zip, screenshots/, videos/ } for failed specs.
    - Append a run summary with pass/fail + artifact paths into `.github/Test-{key}.MD`.
  all:
    - Do test + run in sequence.

# ─────────────────────────────────────────────────────────
# 🐶 Watchdog — Self-Recovery from Hung Tests
# ─────────────────────────────────────────────────────────
watchdog:
  idle_seconds_threshold: 120
  graceful_stop_timeout_seconds: 10
  max_retries: 1
  monitored_steps:
    - "spec_generation"    # long file writes, dependency installs, codegen
    - "test_execution"     # `npx playwright test --headless`
  behavior:
    - Detect idle:
        • If no new stdout/stderr and no file growth in {trace, screenshots, videos, junit, .playwright} for `idle_seconds_threshold`, mark as "hung".
    - On hang:
        • Capture last 2000 bytes of stdout/stderr (log tail) and current process list → save to artifacts.
        • Attempt graceful stop (SIGINT/CTRL+C equivalent) and wait `graceful_stop_timeout_seconds`.
        • If still running → force kill (SIGKILL/taskkill /F).
        • Record watchdog event in progress_log.jsonl and artifacts_idx.
    - Retry policy:
        • If retries < max_retries:
            – For test_execution: retry the entire `npx playwright test --reporter=line --headless` once.
            – For spec_generation: re-run generation step idempotently (do not duplicate files).
        • If still hung after retry: fail fast with explicit “watchdog_hang” status and point to artifacts for triage.

# ─────────────────────────────────────────────────────────
# 🧯 Error Handling (Git History First-Aid)
# ─────────────────────────────────────────────────────────
errors:
  on_test_failure_or_error:
    - Determine if failing behavior existed and worked before (git log/annotate/blame).
    - If regression → diff commits, align to last-known-good behavior.
    - If new feature → ignore history; fix forward.
    - Document decision and evidence in `.github/Test-{key}.MD` + trackers.
  on_watchdog_hang:
    - Include log tails, process tree, and step metadata in `.github/Test-{key}.MD`.
    - Suggest remedies referencing `.github/instructions/Ops-Watchdog-Troubleshooting.md`.
    - Keep state resumable; do not discard partial artifacts.

# ─────────────────────────────────────────────────────────
# 🧪 Test Plan Contract
# ─────────────────────────────────────────────────────────
test_plan_contract:
  required_fields:
    - test_paths
    - setup_instructions (env vars, DB state)
    - validation_steps
    - expected_outputs
    - artifacts (traces, screenshots, videos)
    - requirements_coverage (mapping to Requirements-{key}.MD when present)

# ─────────────────────────────────────────────────────────
# 🚦 Guardrails
# ─────────────────────────────────────────────────────────
guardrails:
  - Always run Playwright in headless mode.
  - Specs must include at least one negative path.
  - Secrets/tokens must be placeholders only.
  - Requirements-{key}.MD must be validated when present.
  - **State lives only under NOOR CANVAS\Workspaces\Copilot\pwtest\{key}\ and must be kept current; purge after approval via /cleanup.**
  - Watchdog must be enabled for spec generation and test execution; record all events.

# ─────────────────────────────────────────────────────────
# 🧩 Output Shape
# ─────────────────────────────────────────────────────────
output:
  - state:
      store: "NOOR CANVAS\\Workspaces\\Copilot\\pwtest\\{key}\\"
      run_manifest: "run.json"
      plan_manifest: "plan.json"
      checkpoint:   "checkpoint.json"
      artifacts_idx: "artifacts.json"
  - specs: paths to generated Playwright test files
  - run_results: outcomes of headless runs
  - artifacts:
      traces: [paths]
      screenshots: [paths]
      videos: [paths]
      watchdog_events: [ { step, first_observed, idle_secs, action_taken, retry, tail_log_path, proc_snapshot_path } ]
  - docs: `.github/Test-{key}.MD` created/updated (coverage, failures, artifacts)
  - test_plan: per `test_plan_contract`
  - approval_gate:
      message: >
        Playwright tests complete for {key}. Review specs, results, and artifacts (incl. watchdog events).
      on_approval:
        - Mark tests approved and request /cleanup purge of state
      on_no_approval:
        - Keep state, summarize failures/hangs, and next steps

# ─────────────────────────────────────────────────────────
# 📝 Self-Review
# ─────────────────────────────────────────────────────────
self_review:
  - Consulted per-key state; avoided duplicate generation/runs.
  - Verified SelfAwareness consulted for DB/schema rules.
  - Ensured Playwright ran headless only.
  - Captured negative paths in test specs.
  - Validated specs against Requirements-{key}.MD when available.
  - Watchdog recorded, recovered, and documented any hangs.
  - Documented failures as regression vs new-feature with git evidence.
  - Kept pwtest state up to date and resumable.

# ─────────────────────────────────────────────────────────
# 📦 Final Summary
# ─────────────────────────────────────────────────────────
final_summary:
  - What the user asked.
  - What Copilot implemented.
    • Specs generated and run (paths listed).
    • Files created/updated and added to alignment:
      – D:\PROJECTS\NOOR CANVAS\.github\Test-{key}.MD
      – Requirements-{key}.MD (validated)
      – Cleanup-<key>.MD
  - The Fix and why it should work.
  - Detailed Test Plan for user to try out the tests.
  - Resume Info:
      • **State path: NOOR CANVAS\Workspaces\Copilot\pwtest\{key}\**
      • Last completed step: {checkpoint.step_id}
