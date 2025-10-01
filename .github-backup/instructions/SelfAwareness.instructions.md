# SelfAwareness.instructions.md

## Operating Rules
- Follow architectural guardrails. Minimize risk.
- **Checkpoint First:** Any prompt that modifies code MUST begin by creating a Git checkpoint commit for rollback safety.
- Prefer smallest-possible changes that achieve the goal. Avoid churn.
- Keep outputs deterministic and reproducible (record decisions, commands, and results).
- When in doubt, read `.github/instructions/Links/*` to ground your understanding in the project's REAL state (kept fresh by `sync`).

## Safety & Observability
- Log each phase succinctly. Surgical tracing only (avoid log spam).
- On failure, surface the *smallest reproducible example* and propose remedies with trade-offs.
- Never delete user data without explicit instruction and a backup reference.
