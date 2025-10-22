# Prompt System Cohesion Review
Date: 2025-10-22
Reviewer: GitHub Copilot (cohesion-review.prompt.md v1.2.0)
Scope: prompts-only
Mode: incremental

---

## Executive Summary
- Prompts and instructions reviewed with focus on shared-library reuse and conflict reduction.
- Redundancies: Minimal; core protocols are correctly centralized in shared/.
- Gaps: Version/Changelog sections missing in some core prompts; healthcheck lacks a short enhancement banner and explicit shared-doc cross-links in a couple sections; no prompt linter in CI.
- Conflicts: None detected in quick scan.
- Overall Cohesion: Strong; system follows two-tier architecture (core prompts + shared library).

Top items
1. Add Version/Changelog sections to task, test-generation, and healthcheck prompts.
2. Add a short optimization banner + shared-doc links in healthcheck (Prompt Optimization Mode pointers already present but can be surfaced earlier).
3. Define a lightweight prompt linter spec and wire into CI (front matter, links, step numbering checks).

---

## Detailed Findings

### 1. Redundancy Detection
- Status: Acceptable
- Notes: Core procedures (UI debugging, framework checks, Playwright orchestration) are referenced from shared/ rather than duplicated.
- Recommendation: Continue migrating any remaining inline references to shared docs when encountered.

### 2. Gap Analysis
- Versioning: `task.prompt.md`, `test-generation.prompt.md`, and `healthcheck.prompt.md` do not expose a Version/Changelog header. Add for traceability.
- Healthcheck banner: Add a brief, early banner that points to Prompt Optimization Mode and key shared docs (execution-flow, output-style-mandate) to reduce scrolling and improve discoverability.
- Prompt linter: No CI lint present for prompts (front matter keys, working links, step numbering uniqueness). Add a simple checker.

### 3. Conflict Detection
- No competing defaults or contradictory rules detected in quick scan.

### 4. Efficiency Opportunities
- Shared-library usage is good. Ensure all new guidance lands in shared/ and prompts link to it.

### 5. Consistency, Documentation, Integration
- Output style mandate: Referenced by core prompts; ensure consistent wording.
- Integration: Handoff/task/test-generation cross-reference patterns are present and healthy.

---

## Prioritized Recommendations

High Priority (Week 1)
1. Add Version/Changelog sections to task, test-generation, healthcheck prompts (behavior-preserving metadata).
2. Add healthcheck banner with concise pointers to Prompt Optimization Mode and key shared references.

Medium Priority (Week 2-3)
1. Author a lightweight prompt linter spec and integrate with CI.
2. Audit other prompts (handoff, create-plan, port-instructions) for Version/Changelog headers and consistent output-style references.

Low Priority (Backlog)
1. Extend cohesion-review to capture simple link integrity checks automatically.

---

## File Change Log (Incremental)
Changed (this session):
- `.github/prompts/task.prompt.md` — added shared references for Step 2.5 and 2.7
- `.github/prompts/test-generation.prompt.md` — added canonical Playwright guidance references
- `.github/prompts/internal/quality/cohesion-review.prompt.md` — v1.2.0 with Prompt Enhancement Synthesis

Unchanged (reviewed superficially):
- `.github/prompts/healthcheck.prompt.md` — pending banner/link enhancement
- `.github/prompts/handoff.prompt.md`, `.github/prompts/create-plan.prompt.md`, `.github/prompts/port-instructions.prompt.md` — appear consistent

---

## Prompt Enhancement Recommendations (Synthesis)
For each item, keep edits minimal and behavior-preserving; prefer linking to shared over duplicating.

- task.prompt.md
  - Add Version/Changelog header for traceability.
  - Continue referencing shared modules for Step 2 sub-phases.

- test-generation.prompt.md
  - Add Version/Changelog header.
  - Keep canonical guidance under shared/ and link to it (already added).

- healthcheck.prompt.md
  - Add a short banner near the top: “Prompt Optimization Mode available — see sections below; shared references: execution-flow, output-style-mandate.”
  - Add Version/Changelog header.

- System-wide
  - Add a prompt-linter CI step: front matter presence, link validation, unique step numbering.

---

## Appendices (Minimal)
- Inventory (representative): core prompts [task, test-generation, healthcheck, handoff, create-plan, port-instructions]; internal modules [internal/*]; shared library [shared/*].
- Metrics: Omitted to avoid approximations; future CI linter can produce accurate counts and hashes.
