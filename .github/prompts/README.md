# Copilot Prompts — Simplified Entry Points

This folder now distinguishes between user-facing entry points and internal modular prompts to reduce clutter and improve usability.

## Use these (entry points)
- handoff.prompt.md — Ask-style router that turns a work request into a composed Copilot prompt (creates task + conditionally calls test-generation, create-plan, analyze-learning, sync, etc.).
- task.prompt.md — Primary execution prompt for scoped work with acceptance criteria and validation.
- create-plan.prompt.md — Planning prompt to break down complex or high-risk work into small, verifiable steps.
- test-generation.prompt.md — Generate tests (unit/integration/e2e/visual) with correct frameworks/fixtures.
- healthcheck.prompt.md — Run build/lint/test validation and summarize PASS/FAIL with next steps.
- port-instructions.prompt.md — Guidance for porting across stacks/platforms and keeping artifacts in sync.

## Internal (do not call directly)
Internal prompts are being consolidated under `internal/` to keep this folder clean. These are orchestrated automatically by entry points.

- internal/knowledge/analyze-learning.prompt.md
- internal/util/cleanup.prompt.md
- internal/ops/sync.prompt.md
- internal/quality/cohesion-review.prompt.md
- internal/quality/refactor.prompt.md
- internal/comm/commit.prompt.md
- internal/util/question.prompt.md
- internal/comm/ask.prompt.md
- internal/knowledge/total-recall.prompt.md

## Why this structure
- Smaller surface area for daily use
- Clear routing via `handoff` with minimal decision-making
- Internal prompts remain available for orchestration but out of the way

## What’s next (plan)
- Normalize prompt headers (YAML front matter) to supported keys only: `mode`, `description`
- Add a simple prompt linter check (CI) for mandatory sections and valid links

If you depend on direct paths to internal prompts, prefer using `handoff.prompt.md` or `task.prompt.md` to avoid breakage.
