---
title: retrosync — Requirements & Reality Reconciler
version: 2.3.0
appliesTo: /retrosync
updated: 2025-09-26
---

# /retrosync — Requirements & Reality Reconciler (2.3.0)

Aligns code and tests with `Requirements-{key}.md`, proposes coverage, and records self‑review.

## Steps
1. Parse `Workspaces/copilot/state/{key}/Requirements-{key}.md`; enumerate requirements.
2. Map each requirement to one or more specs under `Workspaces/copilot/Tests/Playwright/{key}/`.
3. Propose missing specs and add them, following Iterative Accumulation.
4. Update `SelfReview-{key}.md` and create a timestamped snapshot in `reviews/`.
5. Provide a summary with Terminal Evidence for any observed runtime divergence.

## Notes
- Respect launch rules (nc/ncb) and env‑driven baseURL.
- Do not modify secrets or appsettings unless explicitly asked.
