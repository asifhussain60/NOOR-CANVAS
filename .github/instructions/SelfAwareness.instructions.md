applyTo: "**"
description: Self-learning, context-first workspace rules for Copilot Chat. Tailored for Noor Canvas.
---

# SelfAwareness — Global Operating Guardrails

## Scope
Governs `/workitem`, `/retrosync`, `/cleanup`, `/pwtest`, `/imgreq`, `/continue`.

## Mandatory Inputs
- Per-key state under `NOOR CANVAS\Workspaces\Copilot\{key}\`.
- Requirements-{key}.MD.
- Cleanup-<key>.MD.
- Design & trackers (.MD).
- This file.
- Always consult **#terminalLastCommand** and **#getTerminalOutput** during detection/analysis to ground decisions in actual runtime logs.

## Execution
- **Never** run via `dotnet run` or `cd …; dotnet run`.
- Use only:
    • `.\Workspaces\Global
c.ps1`  # launch only
    • `.\Workspaces\Global
cb.ps1` # clean, build, and launch
- Ports 9090/9091 assumed; secrets as placeholders only.
- Canonical debug tag: `[DEBUG-WORKITEM:{key}:{layer}]`.

## Testing
- Prefer headless Playwright; capture artifacts on failure.
- Map tests to numbered requirements when present.

## Context Indexing
- Maintain per-key index at `...\index\` (context.idx.json, pack.jsonl, delta, sources).

## Contract Compliance Workflow (All agents)
1) Detect consumer usage vs producer DTOs.
2) Contract reconciliation gate (missing/extra/type/nullable/version drift).
3) Checkpoint.
4) Incremental apply phases 0→3.
5) Golden fixtures + Playwright specs.

## Watchdog (All agents)
watchdog:
  idle_seconds_threshold: 120
  graceful_stop_timeout_seconds: 10
  max_retries: 1


## Approval & Summary
Every run presents an approval gate and emits a final summary (what, why, files, tests, resume info).
