mode: agent
name: retrosync
alias: /retrosync
description: >
  Evidence-based retrospective + synchronization across docs/trackers/requirements,
  grounded in commits, chats, terminal output, debug logs, and per-key state.

parameters:
  - name: notes
    required: false

usage:
  prerequisites:
    - Repo clean or throwaway branch for doc edits.
    - **Never** run via `dotnet run` or `cd …; dotnet run`.
- Use only:
    • `.\Workspaces\Global
c.ps1`  # launch only
    • `.\Workspaces\Global
cb.ps1` # clean, build, and launch
  run_examples:
    - /retrosync notes:"review Playwright gaps --- close SessionWaiting bug"

context_boot:
  - Inspect per-key state under Copilot\*; gather run/plan/progress/checkpoint/artifacts.
  - Prefer context index for planning; delta after run.
  - Read SelfAwareness; review {"#getTerminalOutput"} and debug logs.
  - If Requirements-{key}.MD exists, align to it.

objectives:
  - Derive diffs for design docs, trackers, SelfAwareness.
  - Contract drift audit (producer↔consumer).
  - Structured test plan suggestions.
  - Leave retrosync state current.

methods:
  analyze:
    - Gather commits/diffs/logs/state; compare to design/trackers/requirements.
  apply:
    - Apply doc diffs with approval gate; write new .github docs as needed.

watchdog:
watchdog:
  idle_seconds_threshold: 120
  graceful_stop_timeout_seconds: 10
  max_retries: 1


guardrails:
  - Structured diffs only; do not remove SelfAwareness without approval.
  - Requirements-{key}.MD authoritative.
  - Record index delta; keep state under Copilot.

output:
  - plan
  - diffs
  - evidence
  - successful_patterns
  - watchdog_events
  - approval_gate
