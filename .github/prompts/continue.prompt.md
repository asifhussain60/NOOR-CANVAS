---
mode: agent

# ─────────────────────────────────────────────────────────
# ▶️ Usage
# ─────────────────────────────────────────────────────────
name: continue
alias: /continue
description: >
  Recover context from chat thread history, #Workspaces, and #terminalLastCommand to identify the latest
  active work key and the precise step in progress. If Copilot drifted, stop the wrong direction,
  reconcile with the plan/state, and continue the correct next step using phased, low-risk changes.
  No parameters; detects key, mode, and next action automatically.

parameters: []
usage:
  prerequisites:
    - Ensure the repo is present and the app can launch:
        • .\Workspaces\Global\nc.ps1
        • .\Workspaces\Global\ncb.ps1
    - Leave recent context intact: do not delete state under NOOR CANVAS\Workspaces\Copilot\

  run_examples:
    - Recover & continue the last active item:
        • /continue
    - Nudge with a corrective message first (optional), then:
        • "Stop chasing perf; revert to UI bug scope." → /continue

  outputs:
    - Detected key, current phase/step, and rationale.
    - Next step plan (tight, incremental), structured diffs, and artifacts.
    - Updated state and Worklog in `.github/Workitem-{key}.MD`.

# ─────────────────────────────────────────────────────────
# 🧭 Context Boot (Autodetect the active key & step)
# ─────────────────────────────────────────────────────────
context_boot:
  discover_key_and_scope:
    - Inspect chat thread (latest → older) for:
        • explicit mentions like "key:NC-xxx" or "Requirements-NC-xxx.MD"
        • /workitem, /imgreq, /pwtest, /retrosync invocations
        • operator corrections ("wrong direction", "phase 1 only")
    - Parse **#Workspaces**:
        • Recently modified under NOOR CANVAS\Workspaces\Copilot\{key}\**
        • Presence of { run.json, plan.json, progress.log.jsonl, checkpoint.json, artifacts.json }
    - Read **#terminalLastCommand** for nc.ps1/ncb.ps1, npx playwright, git, etc.
    - If multiple keys, pick the one with the newest checkpoint/progress entry.

  confirm_state:
    - Load state for the detected key.
  - context_index:
      discover:
        - Prefer `NOOR CANVAS\Workspaces\Copilot\{key}\index\context.idx.json` for planning.
        - If missing/stale → build or delta-build per SelfAwareness rules.
      prefer_for_planning: true
      record_delta:
        - After run, update `context.delta.json` and `context.sources.json`.
  - Read SelfAwareness; ingest `Requirements-{key}.MD` if present.
  - Skim `.github/Workitem-{key}.MD`, `.github/Test-{key}.MD`, Cleanup-<key>.MD if present.

# ─────────────────────────────────────────────────────────
# 💾 State & Checkpoints (for continue itself)
# ─────────────────────────────────────────────────────────
state_store:
  root: "NOOR CANVAS\\Workspaces\\Copilot\\continue\\{key}\\"
  files: { run_manifest: run.json, plan_manifest: plan.json, progress_log: progress.log.jsonl, checkpoint: checkpoint.json, artifacts_idx: artifacts.json }
  includes_index:
    path: "NOOR CANVAS\\Workspaces\\Copilot\\{key}\\index\\"
    files: [ "context.idx.json", "context.pack.jsonl", "context.delta.json", "context.sources.json" ]
  io: { write_mode: append_minimal, compress: true, atomic_writes: true, debounce_ms: 150 }
  retention: { ttl_hours: 24, cleanup_on_approval: true }

# ─────────────────────────────────────────────────────────
# 🎯 Objectives
# ─────────────────────────────────────────────────────────
objectives:
  - Detect correct {key} and last completed step.
  - Reconcile plan vs current actions; stop drift.
  - Produce a **Next Minimal Step** plan aligned with Requirements-{key}.MD and current phase.
  - Apply changes **incrementally** via Phased Apply; verify minimally.
  - Update docs/state/index; present approval gate.

# ─────────────────────────────────────────────────────────
# 🔁 Phased Apply (for corrections & continuation)
# ─────────────────────────────────────────────────────────
phased_apply:
  rules:
    - Keep blast radius small; one slice at a time; feature flags if needed.
    - If a phase fails, fix forward inside the phase; otherwise resume next.
    - After each phase, checkpoint + append Worklog to `.github/Workitem-{key}.MD`.

  phases:
    - phase_0_scaffold: restore minimal wiring; confirm app launch.
    - phase_1_minimal_viable_change: one thin vertical slice + tiny tests.
    - phase_2_expand_coverage: edge cases, validation, a11y.
    - phase_3_full_convergence: finalize per requirements; remove temp logs `[DEBUG-WORKITEM:{key}:{layer}]`.

# ─────────────────────────────────────────────────────────
# 🛠️ Methods
# ─────────────────────────────────────────────────────────
methods:
  detect:
    - Rank candidate keys (evidence: thread hits, state timestamps, commands).
  reconcile:
    - Compare checkpoint.step_id with plan.json; write a tiny reconciliation plan (plan-v{n}.json).
  apply:
    - Run `.\\Workspaces\\Global\\ncb.ps1` if build needed, else `.\\Workspaces\\Global\\nc.ps1`.
    - Execute the next **phased_apply** step; run minimal tests if needed.
    - Append a Worklog entry to `.github/Workitem-{key}.MD`.
  correct_direction:
    - If previous direction was wrong:
      • Stash/revert partial changes; document rollback in Worklog.
      • Proceed with Next Minimal Step.

# ─────────────────────────────────────────────────────────
# 🐶 Watchdog — Self-Recovery
# ─────────────────────────────────────────────────────────
watchdog:
  idle_seconds_threshold: 120
  graceful_stop_timeout_seconds: 10
  max_retries: 1
  monitored_steps: [ "detect", "reconcile", "apply" ]
  behavior:
    - Detect idle → capture tails & snapshot; graceful stop → force kill; record event.
    - Retry idempotently once; else fail with `watchdog_hang`.

# ─────────────────────────────────────────────────────────
# 🔗 Alignment
# ─────────────────────────────────────────────────────────
alignment:
  - .github/instructions/SelfAwareness.instructions.md
  - Requirements-{key}.MD
  - D:\PROJECTS\NOOR CANVAS\.github\*.MD
  - .github/prompts/workitem.prompt.md
  - .github/prompts/pwtest.prompt.md
  - Cleanup-<key>.MD

# ─────────────────────────────────────────────────────────
# 🧯 Error Handling (Git History First-Aid)
# ─────────────────────────────────────────────────────────
errors:
  on_drift_or_failure:
    - Regression vs new code; restore LKG or fix forward; document evidence.

# ─────────────────────────────────────────────────────────
# 🚦 Guardrails
# ─────────────────────────────────────────────────────────
guardrails:
  - **No parameters**: never prompt the operator for key; detect it.
  - Structured diffs only.
  - Requirements-{key}.MD is authoritative.
  - Use Tailwind + Font Awesome only if restyling is already in-scope.
  - Logs use `[DEBUG-WORKITEM:{key}:{layer}]` and are removable by `/cleanup`.
  - Keep state and index current.

# ─────────────────────────────────────────────────────────
# 🧩 Output Shape
# ─────────────────────────────────────────────────────────
output:
  - detected: { key, rationale, last_checkpoint }
  - next_minimal_step: { description, files_to_touch, tests_to_run }
  - diffs: [structured changes]
  - artifacts: [paths]
  - docs_updated: [ ".github/Workitem-{key}.MD" (Worklog appended) ]
  - watchdog_events: [ { step, idle_secs, action_taken, retry } ]
  - approval_gate:
      message: "Continue is ready on {key}. Approve to execute the Next Minimal Step?"
      on_approval: Execute step + checkpoint
      on_no_approval: Halt; summarize alternatives
