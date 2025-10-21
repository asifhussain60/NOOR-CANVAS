# prompts.keys Directory

This directory stores per-key work logs, temporary tests/scripts, and checkpoint metadata referenced by prompts.

Structure:

```
.github/prompts.keys/
  .checkpoints/           # Lightweight logs for checkpoint tags
  {key}/
    work-log.md           # Append-only log of plans and work
    tests/                # Temporary test files (to be promoted/cleaned)
    scripts/              # Temporary orchestration scripts for tests
    {key}.lock            # Present when an agent is actively modifying key
```

Policies:
- Do not commit secrets or environment-specific tokens here.
- Keep entries append-only; prefer consolidation over deletion.
- Maintain at most 28 checkpoints per key (see task.prompt.md Step 8.4).
