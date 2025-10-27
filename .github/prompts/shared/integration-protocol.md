# integration-protocol.md (Shared Integration Index)

---
purpose: Canonical index for agent integration/handoff guidance; centralizes references to prevent duplication
lastUpdated: 2025-10-27
---

## Purpose
Index the core documents that define agent handoffs, execution flow, and output expectations, so prompt files can reference this single source instead of duplicating text.

## Canonical References
- `.github/prompts/shared/agent-handoff-protocol.md` — Required handoff structure and context preservation rules
- `.github/prompts/shared/execution-flow.md` — Standard execution phases and checkpoints for implementation agents
- `.github/prompts/shared/output-style-mandate.md` — User-facing output format, icons, sections, and bullet constraints
- `.github/prompts/shared/commit-checkpoint-protocol.md` — Checkpoint commit requirements and examples

## Usage Notes
- Reference this index from prompts when describing cross-agent flows or handoff requirements.
- Keep content link-only; no large inline duplication.
- Maintain alphabetical ordering in the list above.

## Maintenance
- Update `lastUpdated` when references change.
- Validate all links resolve under `.github/prompts/shared/`.
