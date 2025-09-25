---
mode: agent

# ─────────────────────────────────────────────────────────
# ▶️ Usage
# ─────────────────────────────────────────────────────────
name: cleanup
alias: /cleanup
description: >
  Remove or neutralize temporary debug logs and artifacts introduced by workitem, retrosync, pwtest, or imgreq runs.
  Manage the per-key Context Index lifecycle (optional purge by TTL or date) to force safe reindexing on next runs.
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
      When true (default), remove all debug logs tagged with the canonical marker
      [DEBUG-WORKITEM:{key}:{layer}]. When false, retain debug logs but still remove
      temporary state, artifacts, and orphaned files.

  - name: purge_index
    required: false
    description: >
      Optional instruction to purge the per-key Context Index to force reindexing on next runs.
      Accepted values:
        • "all"                  → purge index for the scope (key or all keys)
        • "ttl:<days>"           → purge index if its built_at is older than <days>
        • "before:<YYYY-MM-DD>"  → purge index if built_at is before the given date
        • omitted or "none"      → do not purge index

usage:
  prerequisites:
    - Ensure no uncommitted work would be lost by deletions.

  run_examples:
    - Scoped purge and log removal:
        • /cleanup key:NC-145 cleanlogs:true
    - Global artifact purge but keep logs for forensics:
        • /cleanup cleanlogs:false
    - Force reindex for a single key (delete index now):
        • /cleanup key:NC-145 purge_index:all
    - Purge stale indexes older than 14 days across all keys:
        • /cleanup purge_index:ttl:14
    - Purge indexes built before Sept 1, 2025:
        • /cleanup purge_index:before:2025-09-01

  outputs:
    - Structured list of removed logs/files and instruction diffs.
    - Index purge report (what was removed and why).
    - Cleanup report `.github/Cleanup-<key>.MD` (or Cleanup-Global.MD).

# ─────────────────────────────────────────────────────────
# 🧭 Context Boot
# ─────────────────────────────────────────────────────────
context_boot:
  - Discover scope of prior work:
      • If key provided: NOOR CANVAS\Workspaces\Copilot\{key}\
      • Else: enumerate NOOR CANVAS\Workspaces\Copilot\* and summarize per key.
      • Read run.json, plan.json, progress.log.jsonl, checkpoint.json, artifacts.json for each key.
  - Index discovery (per key in scope):
      • Look for NOOR CANVAS\Workspaces\Copilot\{key}\index\context.idx.json
      • If present, read `built_at` to evaluate TTL/date rules.
  - Read .github/instructions/SelfAwareness.instructions.md for guardrails.
  - If key provided, review debug logs across UI/API/SQL for that scope.
  - Confirm canonical log tag presence: `[DEBUG-WORKITEM:{key}:{layer}]`.
  - Preserve Requirements-{key}.MD (authoritative).

# ─────────────────────────────────────────────────────────
# 💾 State & Checkpoints (kept current until purge)
# ─────────────────────────────────────────────────────────
state_store:
  root: "NOOR CANVAS\\Workspaces\\Copilot\\cleanup\\"
  files:
    run_manifest: "run.json"
    plan_manifest: "plan.json"
    progress_log: "progress.log.jsonl"
    checkpoint:   "checkpoint.json"
    artifacts_idx:"artifacts.json"
  io: { write_mode: append_minimal, compress: true, atomic_writes: true, debounce_ms: 150 }
  retention: { ttl_hours: 24 }

# ─────────────────────────────────────────────────────────
# 🎯 Objectives
# ─────────────────────────────────────────────────────────
objectives:
  - If cleanlogs:true → remove all `[DEBUG-WORKITEM:{key}:{layer}]` logs via structured diffs.
  - If cleanlogs:false → preserve logs; still purge TEMP/state artifacts.
  - Manage Context Index lifecycle:
      • `purge_index:all` → delete NOOR CANVAS\Workspaces\Copilot\{key}\index\ (or all keys)
      • `purge_index:ttl:D` → delete index if `built_at` older than D days
      • `purge_index:before:DATE` → delete index if `built_at` < DATE
  - Extract lessons from watchdog outputs; propose instruction updates.
  - Purge artifacts, traces, and state dirs under **NOOR CANVAS\Workspaces\Copilot\{key}\** (or all keys) **after approval**.
  - Ensure no functional code breakage.
  - Generate Cleanup-<key>.MD (or Cleanup-Global.MD) in `.github` and add to alignment.

# ─────────────────────────────────────────────────────────
# 🛠️ Methods
# ─────────────────────────────────────────────────────────
methods:
  analyze:
    - Parse progress.log.jsonl, checkpoint.json, artifacts.json for durations/failures.
    - Draft instruction updates (SelfAwareness + Ops-Watchdog).
    - Build index purge candidate list per `purge_index` rule:
        • For ttl → compare `now - built_at > days`
        • For before → `built_at < date`
        • For all → include current scope regardless of age
  apply:
    - Update instruction files via structured diffs (show before/after).
    - Remove logs conditionally (cleanlogs flag); show file:line previews.
    - Purge artifacts/state dirs only after approval.
    - Purge Context Index folders selected during analyze:
        • Delete files: context.idx.json, context.pack.jsonl, context.delta.json, context.sources.json
        • Remove the empty `index\` directory if no files remain
    - Write index purge results into Cleanup report.
    - Document results in Cleanup-<key>.MD and add to alignment.

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
    - "index_purge"
  behavior:
    - Detect idle → mark as hung; capture log tail + pending list.
    - Graceful stop → force kill if needed; record watchdog event.
    - Retry once idempotently; else fail with `watchdog_hang` and pointers.

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
# 🚦 Guardrails
# ─────────────────────────────────────────────────────────
guardrails:
  - Only remove canonical logs if cleanlogs:true.
  - Show diffs/snippets for instruction edits and log removals.
  - Preserve build validity.
  - Do not purge **NOOR CANVAS\Workspaces\Copilot\** state or indexes until the approval gate passes.
  - **Never delete Requirements-{key}.MD** or other authoritative docs.
  - Context Index purge affects only `NOOR CANVAS\Workspaces\Copilot\{key}\index\` (safe to rebuild later).

# ─────────────────────────────────────────────────────────
# 🧩 Output Shape
# ─────────────────────────────────────────────────────────
output:
  - learnings: { hang_signatures, flaky_steps, common_failures, recommendations }
  - instruction_diffs: [ SelfAwareness.instructions.md, Ops-Watchdog-Troubleshooting.md ]
  - removed_logs: include_if_cleanlogs_true [file:line…]
  - purged_artifacts: [ state dirs/files ]
  - purged_index:
      - keys_scanned: [list]
      - keys_purged: [list]
      - rule: "all | ttl:<days> | before:<date> | none"
      - evidence: [ { key, built_at, reason } ]
  - watchdog_events: [ { step, first_observed, idle_secs, action_taken, retry, tail_log_path, pending_list_path } ]
  - docs: created_or_updated: [ Cleanup-<key>.MD or Cleanup-Global.MD ]
  - approval_gate:
      message: >
        Cleanup ready (key:{key or 'ALL'}, cleanlogs:{cleanlogs}, purge_index:{purge_index or 'none'}).
        Approve to remove selected logs, artifacts, and indexes.
      on_approval:
        - Apply removals and mark cleanup complete
      on_no_approval:
        - Keep state intact; summarize pending deletions

# ─────────────────────────────────────────────────────────
# 📝 Self-Review
# ─────────────────────────────────────────────────────────
self_review:
  - Consulted per-key state/index before actions; built correct candidate lists.
  - Updated SelfAwareness + Ops-Watchdog with concrete improvements.
  - Respected cleanlogs flag; build remains valid.
  - Preserved Requirements-{key}.MD and other authoritative docs.
  - Watchdog recorded, recovered, and documented any hangs.
  - Approval gate guarded all deletions.

# ─────────────────────────────────────────────────────────
# 📦 Final Summary
# ─────────────────────────────────────────────────────────
final_summary:
  - What the user asked.
  - What Copilot implemented.
  - Cleanup report: logs removed, artifacts purged, and index purges (with reasons).
  - Documentation created/updated: Cleanup-<key>.MD (or Cleanup-Global.MD).
  - Resume info:
      • **State path: NOOR CANVAS\Workspaces\Copilot\cleanup\**
      • Last checkpoint: {checkpoint.step_id}
