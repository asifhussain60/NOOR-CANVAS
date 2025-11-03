---
Trilogy-Version: 2025-11-03
Title: KDS Technical Reference (PR-Intelligence Edition)
Includes-PR-Intelligence: true
Generated-By: kds.md document
Generated-At: 2025-11-03T00:00:00Z
---

# KDS Technical Reference (PR-Intelligence Edition)

This reference consolidates the KDS architecture, agents, abstractions, and BRAIN tiers, and documents the new PR Intelligence capability implemented via local Git analysis.

## 1. Overview

- One Door: `KDS/prompts/user/kds.md` — the universal entry.
- Router/Agents: intent-driven SOLID specialists.
- Abstractions (DIP): `session-loader`, `test-runner`, `file-accessor`, `brain-query`.
- BRAIN (Tiered Memory):
  - Tier 1: `conversation-history.jsonl`
  - Tier 2: `knowledge-graph.yaml`
  - Tier 3: `development-context.yaml`
- Events: `events.jsonl` and `brain-updater.md`/`development-context-collector.md`.

## 2. Agents and Contracts

- Router (`intent-router.md`): routes to agents.
- Planner (`work-planner.md`): defines plan and acceptance criteria.
- Executor (`code-executor.md`): implements deltas.
- Tester (`test-generator.md`): generates and runs checks.
- Validator (`health-validator.md`): health and guard checks.
- Governor (`change-governor.md`): reviews KDS changes.
- Error Corrector (`error-corrector.md`): halts/reverts on mistakes.
- Session Resumer (`session-resumer.md`): resumes work.
- Screenshot Analyzer (`screenshot-analyzer.md`): extracts UI requirements.
- Commit Handler (`commit-handler.md`): semantic commits/tags.

Contract highlights (inputs/outputs):
- Inputs: intent, context, file system, BRAIN query.
- Outputs: file edits, tests, events, commits, BRAIN updates (indirect).
- Error modes: misroutes, failing health checks, missing tests, schema violations.

## 3. Abstractions (DIP)

- session-loader: loads session context.
- test-runner: executes tests and returns pass/fail + reports.
- file-accessor: read/write with guardrails.
- brain-query: read-only access to BRAIN (Tier 1–3).

## 4. BRAIN (Three Tiers)

- Tier 1 — Conversation History: rolling queue of last 20 conversations.
- Tier 2 — Knowledge Graph: patterns, relationships, workflows.
- Tier 3 — Development Context: metrics, aggregates, correlations; throttled collector.

## 5. PR Intelligence (Local, Opt-In)

- Config: `KDS/config/team-intelligence.yaml` (enable, team_auto_detect, anonymize_authors, throttle_minutes, max_history_days).
- Schema: `KDS/kds-brain/schemas/pr-intelligence-schema.yaml` (Tier 2 pr_patterns, Tier 3 pr_metrics, validation notes).
- Collector: `KDS/scripts/collect-pr-intelligence.ps1` (supports -DryRun, -Verbose, -Force).
- Storage:
  - Tier 2: `knowledge-graph.yaml`/`pr_patterns`
  - Tier 3: `development-context.yaml`/`pr_metrics`
- Privacy: optional anonymization of authors; local-only analysis; zero external APIs.
- Throttling: Tier 3 collection only if last_collection > 1 hour.

### 5.1 Detected Entities

- PR Records: id/title/authors/files/lines_added/lines_deleted/date.
- Patterns (Tier 2): high rework files; collaboration hotspots; quality indicators.
- Metrics (Tier 3): volume, size buckets, review dynamics, file impact, risk alerts.

### 5.2 Agent Integrations

- Router: hotspot-aware routing.
- Planner: effort estimates via PR size/rework trends.
- Executor: churn warnings and guardrails.
- Tester: focus on flaky/high-risk areas.
- Validator: size/complexity gates.
- Commit Handler: semantic PR tag suggestions.

### 5.3 Governance & Protections

- Validations: schema checks before write.
- Guards: enable/anonymize/throttle respected.
- Tasks to wire: can be invoked pre-build or as a guard script.

## 6. API and File Schemas

- events.jsonl: append-only event stream.
- knowledge-graph.yaml: includes `pr_patterns` entries.
- development-context.yaml: includes `pr_metrics` snapshot fields.
- team-intelligence.yaml: configuration keys and defaults.
- pr-intelligence-schema.yaml: authoritative shape for PR data.

## 7. State Machines (selected)

- Brain Updater: Idle → Triggered → Process Events (T1/T2) → Maybe Trigger Collector (T3) → Idle.
- Collector: Idle → Eligible? → Scan Git → Extract PRs → Compute Patterns/Metrics → Validate → Write Snapshot → Update last_collection → Idle.

## 8. Performance

- Git scan window: default 30 days; configurable.
- Collection: O(N commits in window) + file stats.
- Throttle: minimize write frequency to Tier 3.
- Impact: lightweight; no external calls.

## 9. Security & Privacy

- Local-only; no network calls.
- Anonymization toggle for authors.
- Scoped history window.
- Output constrained by schema.

## 10. Troubleshooting

- No PRs detected: verify patterns in commit messages and team detection.
- Schema failures: check `pr-intelligence-schema.yaml` and script version.
- Stale metrics: throttle gate may be active; force run with `-Force`.

## 11. Diagrams Index

- See Trilogy Image-Prompts for Prompts 1–23 covering Router/Agents/BRAIN and PR Intelligence visuals.

## 12. Appendix

- Example config snippets from `team-intelligence.yaml`.
- Example Tier 2/3 fragments and recommended thresholds.
