mode: agent
name: cleanup
alias: /cleanup
description: >
  Remove or neutralize temporary debug logs and artifacts (including Playwright traces/videos),
  manage Context Index lifecycle, and capture watchdog learnings. Safe, reversible by PR.

parameters:
  - name: key
    required: false
  - name: cleanlogs
    required: false
    default: true
  - name: purge_index
    required: false

usage:
  prerequisites:
    - Ensure no uncommitted work will be lost.
  run_examples:
    - /cleanup key:hostcanvas cleanlogs:true
    - /cleanup purge_index:ttl:14

context_boot:
  - Discover scope (key or ALL) via Copilot\* state.
  - Inspect index timestamps to evaluate TTL/date rules.
  - Read SelfAwareness; review debug logs and {"#getTerminalOutput"}.
  - Preserve Requirements-{key}.MD.

objectives:
  - Remove `[DEBUG-WORKITEM:{key}:{layer}]` logs if cleanlogs:true.
  - Purge stale Context Index folders by rule (all | ttl:D | before:DATE | none).
  - Identify and purge stale Playwright artifacts after approval.
  - Emit Cleanup-<key>.MD (or Global).

methods:
  analyze:
    - Parse progress/checkpoint/artifacts; draft instruction updates.
    - Build purge candidates; list file previews for approval.
  apply:
    - Apply diffs/removals after approval and document results.

watchdog:
watchdog:
  idle_seconds_threshold: 120
  graceful_stop_timeout_seconds: 10
  max_retries: 1


alignment:
  - .github/instructions/SelfAwareness.instructions.md
  - .github/instructions/Ops-Watchdog-Troubleshooting.md
  - Requirements-{key}.MD
  - D:\PROJECTS\NOOR CANVAS\.github\*.MD

guardrails:
  - Show diffs/snippets; preserve build validity.
  - Do not delete authoritative docs.
  - Purge Copilot state/index only after approval.

output:
  - instruction_diffs
  - removed_logs
  - purged_artifacts
  - purged_index
  - watchdog_events
  - docs_created_or_updated
  - approval_gate
