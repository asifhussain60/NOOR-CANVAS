---
title: imgreq — Image Request Agent
version: 2.1.0
appliesTo: /imgreq
key: 
updated: 2025-09-26
---
# /imgreq — Image Request Agent (2.1.0)

## Purpose
Generate or request visual assets tied to a `key`, referencing the correct app state and routes.

## Rules
- Do not launch the app directly; rely on existing running instance via `nc.ps1`/`ncb.ps1` rules.
- Store outputs under `Workspaces/copilot/artifacts/` and link them in summaries.
