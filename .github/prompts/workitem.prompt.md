mode: agent
name: workitem
alias: /workitem
description: >
  Analyze/apply/review changes for a work item key. Enforces iterative fix + test loop,
  Playwright alignment, terminal-log grounded analysis, and contract reconciliation.

parameters:
  - name: key
    required: true
    description: e.g., NC-145 or hostcanvas
  - name: mode
    required: true
    description: [analyze | apply | review]
  - name: test
    required: false
    default: false
  - name: notes
    required: false

usage:
  prerequisites:
    - **Never** run via `dotnet run` or `cd …; dotnet run`.
- Use only:
    • `.\Workspaces\Global
c.ps1`  # launch only
    • `.\Workspaces\Global
cb.ps1` # clean, build, and launch
    - Confirm environment (9090/9091), Canvas writable, KSESSIONS_DEV read-only.
  run_examples:
    - /workitem key:hostcanvas mode:apply test:true notes:"headed"

context_boot:
  - Load per-key state if present.
  - Load context index (prefer pack.jsonl); delta-record after run.
  - Read SelfAwareness; review UI/API/SQL logs; read {"#terminalLastCommand", "#getTerminalOutput"}.
  - If Requirements-{key}.MD exists → treat as authoritative.

objectives:
  analyze:
    - No code changes; produce layered findings (UI/.NET/API/SignalR/SQL) + tables.
    - Contract reconciliation (dry-run) and proposed DTO patches.
  apply:
    - Phased apply with verification per phase; respect restyle notes (Tailwind + Font Awesome).
    - If test:true → generate+run Playwright specs.
  review:
    - Summarize attempts, outcomes, rationale, next steps.

phased_apply:
  - phase_0_contract_reconciliation
  - phase_1_minimal_viable_change
  - phase_2_expand_coverage
  - phase_3_full_convergence

iterative_fix_and_test:
  rules:
    - Make **one change at a time**, then run tests.
    - After fixing the first issue, rerun that test + the new one; keep accumulating until all green.
    - Use `[DEBUG-WORKITEM:{key}:{layer}]` logs (safe to remove via /cleanup).
    - Dedicated stabilization key supported: **hostcanvas**.


playwright:
  rules:
- Playwright tests live under `Tests/Playwright/{key}/`.
- Configure `playwright.config.ts` with: `testDir: "Tests/Playwright"`.
- Default execution is **headless**; allow headed via notes/overrides.
- Always run with `npx playwright test --reporter=line` (append `--headed` if needed).

methods:
  analyze:
    - Gather evidence (index, state, commits, {"#getTerminalOutput"}, requirements).
    - Produce endpoint maps, DTO matrices, SignalR maps, SQL snapshots, risks, effort.
  apply:
    - Run scripts (nc/ncb); execute phases; structured diffs; update docs.
    - If test:true, call `/pwtest` with key and mode=all.
  review:
    - Summarize and recommend next steps.

errors:
  on_failure: regression vs new; restore LKG or fix forward; document.
  on_watchdog_hang: capture tails/metadata; retry once.

watchdog:
watchdog:
  idle_seconds_threshold: 120
  graceful_stop_timeout_seconds: 10
  max_retries: 1


alignment:
  - .github/instructions/SelfAwareness.instructions.md
  - Requirements-{key}.MD
  - .github/prompts/pwtest.prompt.md
  - Cleanup-<key>.MD
  - .github/*{key}*.MD

guardrails:
  - Strict mode contract (analyze/apply/review only).
  - Use scripts only; never dotnet run.
  - Structured diffs; logs use canonical tag; state updated each step.
  - Tests run headless unless headed explicitly requested.

output:
  - state
  - analyze_report / diffs
  - docs created_or_updated
  - artifacts

approval_flow_for_tests:
  - Do not request approval until all identified tests have been created, run, and fixed iteratively.
  - After final green suite, request user to manually run tests once.
  - Only then ask for approval to mark the work/test complete.
