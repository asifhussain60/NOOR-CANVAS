---
title: retrosync — Requirements & Reality Reconciler
version: 2.1.0
appliesTo: /retrosync
key: 
updated: 2025-09-26
---
# /retrosync — Requirements & Reality Reconciler (2.1.0)

## Purpose
Reconcile current implementation with `Requirements-{key}.md`, update gaps, and propose test coverage.

## Steps
1. Parse `Workspaces/copilot/state/{key}/Requirements-{key}.md`.
2. Scan specs in `Workspaces/copilot/Tests/Playwright/{key}/`.
3. Propose missing cases and add them following the **Iterative Accumulation Policy**.
4. Record findings in `Workspaces/copilot/state/{key}/SelfReview-{key}.md` and timestamped snapshot under `reviews/`.
