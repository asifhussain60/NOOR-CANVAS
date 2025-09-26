mode: agent
name: imgreq
alias: /imgreq
description: >
  Convert annotated screenshots into an implementation-ready requirements spec,
  or integrate it, or derive a Playwright plan and auto-handoff to /pwtest.

parameters:
  - name: key
    required: true
  - name: mode
    required: true
    description: [analyze | apply | pwtest]
  - name: notes
    required: false
    description: Include "headed" to run headed in pwtest mode; default headless, always verbose.

usage:
  prerequisites:
    - **Never** run via `dotnet run` or `cd …; dotnet run`.
- Use only:
    • `.\Workspaces\Global
c.ps1`  # launch only
    • `.\Workspaces\Global
cb.ps1` # clean, build, and launch
    - Place screenshots (PNG/JPG/PDF) in an accessible path.
  run_examples:
    - /imgreq key:NC-102 mode:analyze
    - /imgreq key:NC-102 mode:apply
    - /imgreq key:hostcanvas mode:pwtest notes:"headed"

context_boot:
  - Inspect imgreq state and Requirements-{key}.MD to avoid duplication.
  - Prefer per-key context index; delta-update after run.
  - Read SelfAwareness and recent commits/chats.

objectives:
  analyze:
    - Produce strict-structure Markdown spec with Given/When/Then per annotated element.
    - Include Accessibility, Telemetry, and Contract Requirements subsections.
  apply:
    - Create/update Requirements-{key}.MD + .github/Handoff-{key}.MD.
  pwtest:
    - Derive Playwright test plan from the spec.
    - Default headless, override via notes; always verbose.
    - Auto-handoff to /pwtest with aligned scope.

methods:
  ingest: enumerate files; OCR when useful; normalize markers.
  extract: map evidence → Requirements (R1, R2, …); record Open Questions.
  spec: produce a single Markdown document.
  diff_apply: structured diff into Requirements-{key}.MD and trackers.
  pwtest: map requirements → scenarios; forward to /pwtest.

guardrails:
  - No speculation beyond evidence; uncertainties go to Open Questions.
  - Quote visible UI copy verbatim.
  - Structured diffs only. Requirements-{key}.MD authoritative post-apply.
  - Execution uses scripts only.
  - Keep state/index current; purge via /cleanup.

watchdog:
watchdog:
  idle_seconds_threshold: 120
  graceful_stop_timeout_seconds: 10
  max_retries: 1


output:
  - spec_markdown (and diffs if apply)
  - pwtest_plan (if mode=pwtest) + auto-handoff details
  - evidence
  - watchdog_events
  - approval_gate
