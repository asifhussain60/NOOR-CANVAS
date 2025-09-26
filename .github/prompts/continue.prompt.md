---
title: continue — Progressor Agent
version: 2.1.0
appliesTo: /continue
key: 
updated: 2025-09-26
---
# /continue — Progressor Agent (2.1.0)

## Purpose
Moves a partially completed workitem forward using the same rails as `/workitem`.

## Rules
- Same Launch Policy as `/workitem` (nc.ps1/ncb.ps1 only).
- Same Terminal Awareness and self-attribution of restarts.
- Continue the **Iterative Accumulation Policy** until the full set of known issues/tests is green.
- No approval prompts until **everything** is green for the scope; then ask for one manual run and final approval.

## Testing
- Tests live at `Workspaces/copilot/Tests/Playwright/{key}/`.
- Keep specs structured and named by concern (`token-length.spec.ts`, etc.).

## Debug Logging
- Use `[DEBUG-WORKITEM:{key}:continue] … ;CLEANUP_OK` for temp diagnostics.
