---
mode: agent

# ─────────────────────────────────────────────────────────
# ▶️ Usage
# ─────────────────────────────────────────────────────────

name: sync
alias: /sync
description: >
  Synchronize Noor Canvas design docs, trackers, and SelfAwareness instructions by reverse-engineering actual work.
  Review git commits, chat context, terminal logs, debug logs, requirement specs (imgreq), and prior per-key state to determine:
    • Completed work items/bugs
    • Requirements added/removed/changed
    • Technical solutions that proved successful
  Apply changes so documentation and instruction files reflect reality.
  Includes a watchdog that detects hung analysis/apply steps and self-recovers.

parameters:
  - name: notes
    required: false
    description: >
      Optional hints or priorities to focus sync.
      Examples: "focus on SharedAssets schema drift" --- "close SessionWaiting bug" --- "review Playwright gaps"

usage:
  prerequisites:
    - Ensure repo is clean or on a throwaway branch for doc updates.
    - Ensure app can launch if verification steps require it:
        • .\Workspaces\Global\nc.ps1     # simple launch
        • .\Workspaces\Global\ncb.ps1    # build and launch
  run_examples:
    - Light sweep with priorities:
        • /sync notes:"focus on SharedAssets schema drift --- review Playwright gaps"
    - After a burst of /workitem applies:
        • /sync
  outputs:
    - Structured diffs to design docs, trackers, and instructions.
    - Test plan suggestions.
    - State and artifacts for auditability.

# ─────────────────────────────────────────────────────────
# 🧭 Context Boot
# ─────────────────────────────────────────────────────────
context_boot:
  - Load prior state for relevant keys:
      • Inspect **NOOR CANVAS\Workspaces\Copilot\*** for keys referenced in notes or recent activity.
      • For each key: read run.json, plan.json, progress.log.jsonl, checkpoint.json, artifacts.json.
      • Use these to reconstruct “what was done” and avoid rework.
  - Review debug logs across UI/API/SQL for reported issues before syncing.
  - Read .github/instructions/SelfAwareness.instructions.md for DB/schema restrictions.
  - Skim last 10 relevant commits/chats/logs.
  - Confirm environment (ports 9090/9091, Canvas writable, KSESSIONS_DEV read-only).
  - If Requirements-{key}.MD exists (from imgreq runs):
      • Treat it as authoritative for functional requirements.
      • Align design docs and trackers to it.
      • Link requirements to Project Ledger and SelfAwareness.

# ─────────────────────────────────────────────────────────
# 💾 Durable State & Checkpoints (kept current)
# ─────────────────────────────────────────────────────────
state_store:
  root: "NOOR CANVAS\\Workspaces\\Copilot\\sync\\"
  files: { run_manifest: run.json, plan_manifest: plan.json, progress_log: progress.log.jsonl, checkpoint: checkpoint.json, artifacts_idx: artifacts.json }
  io: { write_mode: append_minimal, compress: true, atomic_writes: true, debounce_ms: 150 }
  load_policy:
    - Resume from checkpoint if plan_hash matches; else write new plan-v{n}.json and resume where safe.
  save_policy:
    - After each step: update checkpoint + append one progress line + update artifacts index.
  retention: { ttl_hours: 24, cleanup_on_approval: true }

# ─────────────────────────────────────────────────────────
# 🎯 Objectives
# ─────────────────────────────────────────────────────────
objectives:
  - Parse commits, chat logs, terminal sessions, requirements, and prior per-key state.
  - Derive high-level (stakeholder) and technical (developer) updates.
  - Update docs:
      • NOOR-CANVAS-DESIGN.MD → plain requirements
      • ncImplementationTracker.MD → UI/API/DB/Infra/Tests details
      • ncIssueTracker.MD → align open/closed issues
      • SelfAwareness.instructions.md → guardrails, obsolete cleanup, ledger, lessons
      • Requirements-{key}.MD → authoritative requirements from /imgreq
      • .github\*.MD → new technical deep-dives
      • Cleanup-<key>.MD (from cleanup runs) → integrated into alignment
  - Capture “successful patterns” for reuse.
  - Provide a structured test plan for validation.
  - Leave sync state files **up to date**.

# ─────────────────────────────────────────────────────────
# 🐶 Watchdog — Self-Recovery from Hung Sync Tasks
# ─────────────────────────────────────────────────────────
watchdog:
  idle_seconds_threshold: 120
  graceful_stop_timeout_seconds: 10
  max_retries: 1
  monitored_steps:
    - "gather_inputs"        # scanning logs/commits/large files
    - "diff_generation"      # computing structured diffs
    - "doc_updates"          # writing/updating large MD files
  behavior:
    - Detect idle:
        • If no new stdout/stderr and no file growth in temporary diff outputs or doc targets for `idle_seconds_threshold`, mark as "hung".
    - On hang:
        • Capture last 2000 bytes of stdout/stderr and a snapshot of partial diffs → save to artifacts.
        • Attempt graceful stop; wait `graceful_stop_timeout_seconds`.
        • If still running → force kill; record a watchdog event to progress_log.jsonl and artifacts_idx.
    - Retry policy:
        • If retries < max_retries: retry the step idempotently (never duplicate file edits).
        • If still hung after retry: fail fast with “watchdog_hang” and point to artifacts for triage.

# ─────────────────────────────────────────────────────────
# 🔗 Alignment
# ─────────────────────────────────────────────────────────
alignment:
  - .github/instructions/SelfAwareness.instructions.md
  - Workspaces/Documentation/IMPLEMENTATIONS/NOOR-CANVAS-DESIGN.MD
  - Workspaces/Documentation/IMPLEMENTATIONS/ncImplementationTracker.MD
  - IssueTracker/ncIssueTracker.MD
  - Requirements-{key}.MD (from imgreq runs)
  - .github/*.MD
  - Cleanup-<key>.MD (from cleanup runs)

# ─────────────────────────────────────────────────────────
# 🛠️ Methods
# ─────────────────────────────────────────────────────────
methods:
  analyze:
    - Gather commits/diffs, chat, terminal logs, requirements, and per-key state.
    - Compare against design, trackers, and SelfAwareness.
    - Report mismatches and obsolete entries.
  apply:
    - Update design/trackers/instructions with structured diffs and evidence.
    - Generate new .MD doc in `.github` for significant technical fixes.
    - Provide structured test plan.
    - Update sync checkpoint + artifacts index; present approval gate before completion.

# ─────────────────────────────────────────────────────────
# 🧯 Error Handling (Git History First-Aid)
# ─────────────────────────────────────────────────────────
errors:
  on_reported_error_or_test_failure:
    - Determine if the feature existed and worked previously (git log/annotate/blame).
    - If it previously worked → regression: diff commits, align to last-known-good.
    - If new functionality → ignore history; proceed with fresh fix/tests.
    - Document findings in .github MD + ncImplementationTracker.MD.
  on_watchdog_hang:
    - Include log tails, partial diffs, and step metadata in the sync output + artifacts.
    - Reference `.github/instructions/Ops-Watchdog-Troubleshooting.md`.

# ─────────────────────────────────────────────────────────
# 🧪 Test Plan Contract
# ─────────────────────────────────────────────────────────
test_plan_contract:
  required_fields:
    - routes_endpoints
    - tokens_credentials (placeholders if needed)
    - setup_instructions (env vars, DB state)
    - validation_steps
    - expected_outputs

# ─────────────────────────────────────────────────────────
# 🚦 Guardrails
# ─────────────────────────────────────────────────────────
guardrails:
  - Structured diffs only; never overwrite entire files blindly.
  - Do not remove SelfAwareness entries without approval.
  - Keep high-level vs technical docs separated.
  - Requirements-{key}.MD must remain authoritative when present.
  - Debug logs must use `[DEBUG-WORKITEM:{key}:{layer}]`.
  - **State lives under NOOR CANVAS\Workspaces\Copilot\ and must be kept current; purge after approval via /cleanup.**
  - Watchdog must be enabled for long-running sync steps; record all events.

# ─────────────────────────────────────────────────────────
# 🧩 Output Shape
# ─────────────────────────────────────────────────────────
output:
  - state:
      store: "NOOR CANVAS\\Workspaces\\Copilot\\sync\\"
      run_manifest: "run.json"
      plan_manifest: "plan.json"
      checkpoint:   "checkpoint.json"
      artifacts_idx: "artifacts.json"
  - plan: steps taken to sync
  - evidence: commits, chat, terminal logs, file:line refs
  - mismatches: design vs implementation vs SelfAwareness vs requirements
  - diffs:
      - NOUR-CANVAS-DESIGN.MD
      - ncImplementationTracker.MD
      - ncIssueTracker.MD
      - SelfAwareness.instructions.md
      - Requirements-{key}.MD
      - D:\PROJECTS\NOOR CANVAS\.github\*.MD
      - Cleanup-<key>.MD
  - successful_patterns: [UI/API/DB/Infra/test practices that worked]
  - watchdog_events: [ { step, first_observed, idle_secs, action_taken, retry, tail_log_path, partial_diff_path } ]
  - approval_gate:
      message: "Sync is ready. Review diffs, test plan, and approve to apply."
      on_approval:
        - Apply diffs; request /cleanup to purge: **NOOR CANVAS\Workspaces\Copilot\sync\**
      on_no_approval:
        - Keep docs unchanged; summarize deltas

# ─────────────────────────────────────────────────────────
# 📝 Self-Review
# ─────────────────────────────────────────────────────────
self_review:
  - Reviewed per-key state and debug logs before syncing.
  - Confirmed SelfAwareness consulted; ledger updated.
  - Obsolete instructions cleaned.
  - Technical .MD docs created/updated in .github.
  - Requirements-{key}.MD aligned with implementation.
  - Watchdog recorded, recovered, and documented any hangs.
  - Documented regression vs new-feature decisions with git evidence.
  - Kept sync state up to date and resumable.

# ─────────────────────────────────────────────────────────
# 📦 Final Summary
# ─────────────────────────────────────────────────────────
final_summary:
  - What the user asked.
  - What Copilot implemented.
    • Files created/updated and added to alignment:
      – Requirements-{key}.MD
      – Cleanup-<key>.MD
      – D:\PROJECTS\NOOR CANVAS\.github\<filename>.MD
      – (plus any trackers/docs touched)
  - The Fix and why it should work.
  - Detailed Test Plan for user to try out the sync.
  - Resume Info:
      • **State path: NOOR CANVAS\Workspaces\Copilot\sync\**
      • Last completed step: {checkpoint.step_id}
