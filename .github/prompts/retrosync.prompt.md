---
mode: agent

# ─────────────────────────────────────────────────────────
# ▶️ Usage
# ─────────────────────────────────────────────────────────
name: retrosync
alias: /retrosync
description: >
  Retrospective + Synchronization for Noor Canvas.
  Perform an evidence-based retrospective of recent work (commits, chats, terminal logs, debug logs, per-key state),
  then synchronize design docs, trackers, and SelfAwareness so the docs match reality.
  Back-compat: also respond if invoked as /sync.

parameters:
  - name: notes
    required: false
    description: >
      Optional hints or priorities to focus the retrospective/sync.
      Examples: "focus on SharedAssets schema drift" --- "close SessionWaiting bug" --- "review Playwright gaps"

  usage:
  prerequisites:
    - Ensure repo is clean or on a throwaway branch for doc updates.
    - Ensure app can launch if verification steps require it:
        • .\Workspaces\Global\nc.ps1
        • .\Workspaces\Global\ncb.ps1
  run_examples:
    - Evidence-based retro with priorities:
        • /retrosync notes:"focus on SharedAssets schema drift --- review Playwright gaps"
        • /sync notes:"close SessionWaiting bug"    # back-compat
    - After multiple /workitem applies:
        • /retrosync
  outputs:
    - Structured diffs to design docs, trackers, instructions.
    - Test plan suggestions derived from observed changes.
    - State and artifacts for auditability.

# ─────────────────────────────────────────────────────────
# 🧭 Context Boot
# ─────────────────────────────────────────────────────────
context_boot:
  - Load prior state for relevant keys:
      • Inspect **NOOR CANVAS\Workspaces\Copilot\*** for keys referenced in notes or recent activity.
      • For each key: read run.json, plan.json, progress.log.jsonl, checkpoint.json, artifacts.json.
      • Reconstruct “what was done” and avoid rework.
  - context_index (per detected key):
      discover:
        - Look for `NOOR CANVAS\Workspaces\Copilot\{key}\index\context.idx.json`.
        - If present → prefer `context.pack.jsonl` to drive the retrospective.
        - If absent/stale → build/delta-build per SelfAwareness rules.
      prefer_for_planning: true
      record_delta:
        - After run, write `context.delta.json` (new docs, updated refs) and update `context.sources.json`.
  - Review debug logs across UI/API/SQL for reported issues.
  - Read `.github/instructions/SelfAwareness.instructions.md`.
  - Skim last 10 relevant commits/chats/logs.
  - Confirm environment (ports 9090/9091, Canvas writable, KSESSIONS_DEV read-only).
  - If Requirements-{key}.MD exists:
      • Treat as authoritative for functional requirements.
      • Align design docs and trackers to it.
      • Link requirements to Project Ledger and SelfAwareness.

# ─────────────────────────────────────────────────────────
# 💾 Durable State & Checkpoints
# ─────────────────────────────────────────────────────────
state_store:
  root: "NOOR CANVAS\\Workspaces\\Copilot\\retrosync\\"
  files: { run_manifest: run.json, plan_manifest: plan.json, progress_log: progress.log.jsonl, checkpoint: checkpoint.json, artifacts_idx: artifacts.json }
  includes_index:
    path: "NOOR CANVAS\\Workspaces\\Copilot\\{key}\\index\\"
    files: [ "context.idx.json", "context.pack.jsonl", "context.delta.json", "context.sources.json" ]
  io: { write_mode: append_minimal, compress: true, atomic_writes: true, debounce_ms: 150 }
  load_policy:
    - Resume from checkpoint if plan_hash matches; else write new plan-v{n}.json and resume.
  save_policy:
    - Update checkpoint + progress + artifacts after each step.
  retention: { ttl_hours: 24, cleanup_on_approval: true }

# ─────────────────────────────────────────────────────────
# 🎯 Objectives
# ─────────────────────────────────────────────────────────
objectives:
  - Parse commits, chats, terminal sessions, requirements, and per-key state.
  - Derive high-level (stakeholder) and technical (developer) updates.
  - Update docs:
      • NOOR-CANVAS-DESIGN.MD → plain requirements
      • ncImplementationTracker.MD → UI/API/DB/Infra/Tests details
      • ncIssueTracker.MD → align open/closed issues
      • SelfAwareness.instructions.md → guardrails, obsolete cleanup, ledger, lessons
      • Requirements-{key}.MD → authoritative requirements from /imgreq
      • D:\PROJECTS\NOOR CANVAS\.github\*.MD → technical deep-dives
      • Cleanup-<key>.MD → integrated into alignment
  - Capture “successful patterns” for reuse.
  - Provide a structured test plan.
  - Leave retrosync state **up to date**.

# ─────────────────────────────────────────────────────────
# 🐶 Watchdog — Self-Recovery
# ─────────────────────────────────────────────────────────
watchdog:
  idle_seconds_threshold: 120
  graceful_stop_timeout_seconds: 10
  max_retries: 1
  monitored_steps: [ "gather_inputs", "diff_generation", "doc_updates" ]
  behavior:
    - Detect idle → capture last logs + partial diffs; graceful stop → force kill; record event.
    - Retry idempotently once; else fail with “watchdog_hang”.

# ─────────────────────────────────────────────────────────
# 🔗 Alignment
# ─────────────────────────────────────────────────────────
alignment:
  - .github/instructions/SelfAwareness.instructions.md
  - Workspaces/Documentation/IMPLEMENTATIONS/NOOR-CANVAS-DESIGN.MD
  - Workspaces/Documentation/IMPLEMENTATIONS/ncImplementationTracker.MD
  - IssueTracker/ncIssueTracker.MD
  - Requirements-{key}.MD
  - D:\PROJECTS\NOOR CANVAS\.github\*.MD
  - Cleanup-<key>.MD

# ─────────────────────────────────────────────────────────
# 🛠️ Methods
# ─────────────────────────────────────────────────────────
methods:

  analyze:
    - Gather commits/diffs, chat, terminal logs, requirements, and per-key index/state.
    - Compare against design, trackers, and SelfAwareness.
    - Report mismatches and obsolete entries.
    - **Contract Drift Audit**:
        • Extract consumer-used fields vs producer DTO for each hub/endpoint touched by this key.
        • List missing/extra/renamed fields, nullable/type issues, and version drift.
        • Map each finding to files/lines and affected tests; propose DTO/producer/consumer deltas.
  apply:
    - Update design/trackers/instructions with structured diffs and evidence.
    - Generate new `.github` doc(s) for significant fixes.
    - Provide structured test plan.
    - Update checkpoint + artifacts index; present approval gate.

# ─────────────────────────────────────────────────────────
# 🧯 Error Handling (Git History First-Aid)
# ─────────────────────────────────────────────────────────
errors:
  on_reported_error_or_test_failure:
    - Regression vs new functionality; act and document accordingly.
  on_watchdog_hang:
    - Include log tails, partial diffs, and step metadata; reference Ops-Watchdog.

# ─────────────────────────────────────────────────────────
# 🧪 Test Plan Contract
# ─────────────────────────────────────────────────────────
test_plan_contract:
  required_fields:
    - routes_endpoints
    - tokens_credentials (placeholders)
    - setup_instructions (env vars, DB state)
    - validation_steps
    - expected_outputs

# ─────────────────────────────────────────────────────────
# 🚦 Guardrails
# ─────────────────────────────────────────────────────────
guardrails:
  - Structured diffs only.
  - Do not remove SelfAwareness entries without approval.
  - Keep high-level vs technical docs separated.
  - Requirements-{key}.MD remains authoritative.
  - Debug logs: `[DEBUG-WORKITEM:{key}:{layer}]`.
  - Keep state under `NOOR CANVAS\Workspaces\Copilot\…`; purge via `/cleanup`.
  - Record index delta.

# ─────────────────────────────────────────────────────────
# 🧩 Output Shape
# ─────────────────────────────────────────────────────────
output:
  - state updated
  - plan: steps taken to retrospect + sync
  - evidence: commits, chats, logs, file refs
  - mismatches & diffs: [design, trackers, SelfAwareness, Requirements, .github docs]
  - successful_patterns: [list]
  - watchdog_events: [ { step, idle_secs, action_taken, retry } ]
  - approval_gate:
      message: "Retrosync is ready. Review diffs and approve."
      on_approval: Apply diffs; request `/cleanup` for `retrosync\` state
      on_no_approval: Keep docs unchanged; summarize deltas

# ─────────────────────────────────────────────────────────
# 📝 Self-Review
# ─────────────────────────────────────────────────────────
self_review:
  - Per-key index consulted (`context.pack.jsonl`).
  - Requirements alignment confirmed.
  - Watchdog events recorded.
  - State resumable; minimal diffs.

# ─────────────────────────────────────────────────────────
# 📦 Final Summary
# ─────────────────────────────────────────────────────────
final_summary:
  - What was asked.
  - What changed and why.
  - Diffs applied and docs updated.
  - Resume Info:
      • **State path: NOOR CANVAS\Workspaces\Copilot\retrosync\**
      • Last completed step: {checkpoint.step_id}
