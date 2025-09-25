---
mode: agent

# ─────────────────────────────────────────────────────────
# ▶️ Usage
# ─────────────────────────────────────────────────────────
name: cleanup
alias: /cleanup
description: >
  Remove or neutralize temporary debug logs and artifacts introduced by workitem, sync, or pwtest runs.
  Learn from per-key state/artifacts (including watchdog outputs) to improve future efficiency.
  Cleanup preserves functional code and updates .github/instructions with operational lessons.
  Includes a watchdog that detects hung analysis/removal steps and self-recovers.

parameters:
  - name: key
    required: false
    description: >
      Work item key. If provided, cleanup is scoped; if omitted, cleanup applies globally.

  - name: cleanlogs
    required: false
    default: true
    description: >
      When true (default), remove all debug logs tagged with the canonical format.
      When false, retain debug logs but still remove all temporary state, artifacts, and orphaned files.

usage:
  prerequisites:
    - Ensure no uncommitted work would be lost by deletions.
  run_examples:
    - Scoped purge and log removal:
        • /cleanup key:NC-145 cleanlogs:true
    - Global artifact purge but keep logs for forensics:
        • /cleanup cleanlogs:false
  outputs:
    - Structured list of removed logs/files and instruction diffs.
    - Cleanup report `.github/Cleanup-<key>.MD` (or Cleanup-Global.MD).

# ─────────────────────────────────────────────────────────
# 🧭 Context Boot
# ─────────────────────────────────────────────────────────
context_boot:
  - Discover scope of prior work:
      • If key provided: NOOR CANVAS\Workspaces\Copilot\{key}\
      • Else: enumerate NOOR CANVAS\Workspaces\Copilot\* and summarize per key.
      • Read run.json, plan.json, progress.log.jsonl, checkpoint.json, artifacts.json for each key.
      • Use these to reconstruct what was done and to target cleanup precisely.
  - Read .github/instructions/SelfAwareness.instructions.md for DB/schema restrictions.
  - If key is provided, review debug logs across UI/API/SQL for that scope.
  - Confirm canonical log tag presence: `[DEBUG-WORKITEM:{key}:{layer}]`.
  - If Requirements-{key}.MD exists, preserve it (authoritative).

# ─────────────────────────────────────────────────────────
# 💾 State & Checkpoints (kept current until purge)
# ─────────────────────────────────────────────────────────
state_store:
  root: "NOOR CANVAS\\Workspaces\\Copilot\\cleanup\\"
  files: { run_manifest: run.json, plan_manifest: plan.json, progress_log: progress.log.jsonl, checkpoint: checkpoint.json, artifacts_idx: artifacts.json }
  io: { write_mode: append_minimal, compress: true, atomic_writes: true, debounce_ms: 150 }
  save_policy:
    - Update checkpoint/progress/artifacts after each phase (analysis, instruction updates, removals).
  retention: { ttl_hours: 24 }

# ─────────────────────────────────────────────────────────
# 🎯 Objectives
# ─────────────────────────────────────────────────────────
objectives:
  - If cleanlogs:true → remove all `[DEBUG-WORKITEM:{key}:{layer}]` logs via structured diffs.
  - If cleanlogs:false → preserve logs; still purge TEMP/state artifacts.
  - Analyze per-key state/artifacts (including watchdog outputs) to extract lessons; update instructions accordingly.
  - Purge artifacts, traces, and state dirs in **NOOR CANVAS\Workspaces\Copilot\{key}\** (or all keys) **after approval**.
  - Ensure no functional code breakage.
  - Generate Cleanup-<key>.MD (or Cleanup-Global.MD) in `.github` and add to alignment.
  - Leave cleanup’s own state files up to date until purge.

# ─────────────────────────────────────────────────────────
# 🐶 Watchdog — Self-Recovery for Cleanup
# ─────────────────────────────────────────────────────────
watchdog:
  idle_seconds_threshold: 120
  graceful_stop_timeout_seconds: 10
  max_retries: 1
  monitored_steps:
    - "scan_state"
    - "instruction_updates"
    - "artifact_removals"
  behavior:
    - Detect idle → mark as hung; capture log tail + pending list.
    - Graceful stop → force kill if needed; record watchdog event.
    - Retry once idempotently; else fail with watchdog_hang and pointers.

# ─────────────────────────────────────────────────────────
# 🔗 Alignment Targets
# ─────────────────────────────────────────────────────────
alignment:
  - .github/instructions/SelfAwareness.instructions.md
  - .github/instructions/Ops-Watchdog-Troubleshooting.md
  - ncImplementationTracker.MD
  - Requirements-{key}.MD
  - D:\PROJECTS\NOOR CANVAS\.github\*.MD
  - Cleanup-<key>.MD

# ─────────────────────────────────────────────────────────
# 🛠️ Methods
# ─────────────────────────────────────────────────────────
methods:
  analyze:
    - Parse progress.log.jsonl, checkpoint.json, artifacts.json for durations/failures.
    - Draft instruction updates (SelfAwareness + Ops-Watchdog).
  apply:
    - Update instruction files via structured diffs (show before/after).
    - Remove logs conditionally (cleanlogs flag); show file:line previews.
    - Purge per-key state dirs only after approval; keep cleanup state current until then.
    - Document results in Cleanup-<key>.MD and add to alignment.

# ─────────────────────────────────────────────────────────
# 🚦 Guardrails
# ─────────────────────────────────────────────────────────
guardrails:
  - Only remove canonical logs if cleanlogs:true.
  - Show diffs/snippets for instruction edits and log removals.
  - Preserve build validity.
  - Do not purge **NOOR CANVAS\Workspaces\Copilot\** until approval gate passes.
  - Requirements-{key}.MD must remain untouched; authoritative.
  - Watchdog must be enabled for long-running cleanup steps; record all events.

# ─────────────────────────────────────────────────────────
# 🧩 Output Shape
# ─────────────────────────────────────────────────────────
output:
  - learnings: { hang_signatures, flaky_steps, common_failures, recommendations }
  - instruction_diffs: [ SelfAwareness.instructions.md, Ops-Watchdog-Troubleshooting.md ]
  - removed_logs: include_if_cleanlogs_true [file:line…]
  - purged_artifacts: [ state dirs/files ]
  - watchdog_events: [ { step, first_observed, idle_secs, action_taken, retry, tail_log_path, pending_list_path } ]
  - docs: created_or_updated: [ Cleanup-<key>.MD or Cleanup-Global.MD ]
  - approval_gate:
      message: "Cleanup ready (key:{key}, cleanlogs:{cleanlogs}). Approve to finalize."
      on_approval:
        - Apply removals and mark cleanup complete
      on_no_approval:
        - Keep state intact; summarize pending deletions

# ─────────────────────────────────────────────────────────
# 📝 Self-Review
# ─────────────────────────────────────────────────────────
self_review:
  - Consulted per-key state before actions; kept cleanup state current.
  - Updated SelfAwareness + Ops-Watchdog with concrete improvements.
  - Respected cleanlogs flag; build remains valid.
  - Preserved Requirements-{key}.MD.
  - Watchdog recorded, recovered, and documented any hangs.
  - Prepared precise purge list gated by approval.

# ─────────────────────────────────────────────────────────
# 📦 Final Summary
# ─────────────────────────────────────────────────────────
final_summary:
  - What the user asked.
  - What Copilot implemented.
  - Cleanup report: logs removed, artifacts purged, instruction updates.
  - Documentation created/updated: Cleanup-<key>.MD.
  - Resume info:
      • **State path: NOOR CANVAS\Workspaces\Copilot\cleanup\**
      • Last checkpoint: {checkpoint.step_id}
