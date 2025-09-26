---
title: imgreq — Image Request Agent
version: 2.3.0
appliesTo: /imgreq
updated: 2025-09-26
---

# /imgreq — Image Request Agent (2.3.0)

Generates or requests visual assets for a `key` while respecting runtime state.

## Rules
- Do not launch the app directly; rely on the running instance via nc/ncb.
- Store outputs under `Workspaces/copilot/artifacts/` and reference them in summaries.
- If screenshots are involved, capture via Playwright helpers and attach to artifacts.
