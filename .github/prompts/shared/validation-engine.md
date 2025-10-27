# validation-engine.md (Shared Validation Index)

---
purpose: Canonical index for validation-related shared guidance; avoid duplication by linking to authoritative documents
lastUpdated: 2025-10-27
---

## Purpose
Provide a single reference point for all validation guidance used by agents, consolidating links to existing canonical docs without copying content.

## Canonical References
- `.github/prompts/shared/prompt-test-validation-framework.md` — End-to-end validation algorithm and quality scoring for prompts
- `.github/prompts/shared/validation-handoff-protocol.md` — How validation results drive handoffs between agents
- `.github/prompts/shared/framework-validation-checklists.md` — Structured checklists for syntax, cross-ref, rules, conflicts, full levels

## Usage Notes
- Agents should reference this index instead of repeating validation pseudocode.
- Keep this file link-only; do not duplicate or inline large sections from the canonical docs.
- When validation scope expands, add links here in alphabetical order.

## Maintenance
- Update the `lastUpdated` date when adding or removing links.
- Ensure all referenced paths resolve correctly under `.github/prompts/shared/`.
