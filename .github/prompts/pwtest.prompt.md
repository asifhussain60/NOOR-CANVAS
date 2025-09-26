mode: agent
name: pwtest
alias: /pwtest
description: >
  Generate and/or run Playwright tests for a key. Enforces folder/config alignment,
  headless-by-default execution, iterative accumulation of tests, and terminal-log awareness.

parameters:
  - name: key
    required: true
  - name: mode
    required: true
    description: [test | run | all]
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
    - Node/Playwright installed.
  run_examples:
    - /pwtest key:hostcanvas mode:all notes:"headed"

context_boot:
  - Load per-key state and context index; delta after run.
  - Read SelfAwareness; scan debug logs and {"#getTerminalOutput"}.
  - If Requirements-{key}.MD exists → treat as acceptance source.

objectives:
  test:
    - Scaffold specs under `Tests/Playwright/{key}/` with at least one negative path.
    - Add `signalr.contract.spec.ts` or `api.contract.spec.ts` to assert consumer-required fields.
    - Update `.github/Test-{key}.MD` with coverage & rationale.
  run:
    - Ensure app via ncb.ps1 if needed.
    - Run headless (add --headed if notes specify); collect artifacts.
    - Update `.github/Test-{key}.MD` with outcomes and paths.
  all:
    - test then run.

playwright:
  rules:
- Playwright tests live under `Tests/Playwright/{key}/`.
- Configure `playwright.config.ts` with: `testDir: "Tests/Playwright"`.
- Default execution is **headless**; allow headed via notes/overrides.
- Always run with `npx playwright test --reporter=line` (append `--headed` if needed).

iterative:
  - Accumulate tests as issues are fixed (1st test → green, then add 2nd, rerun both, etc.).

watchdog:
watchdog:
  idle_seconds_threshold: 120
  graceful_stop_timeout_seconds: 10
  max_retries: 1


guardrails:
  - Secrets/tokens as placeholders only.
  - Keep state under `NOOR CANVAS\Workspaces\Copilot\pwtest\{key}\`; purge via /cleanup.
  - Record index delta.

output:
  - specs
  - run_results
  - artifacts
  - docs_updated

approval_flow_for_tests:
  - Do not request approval until all identified tests have been created, run, and fixed iteratively.
  - After final green suite, request user to manually run tests once.
  - Only then ask for approval to mark the work/test complete.
