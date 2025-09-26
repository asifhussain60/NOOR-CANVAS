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
  Accepts an optional key override and optional notes to steer scope and priorities.

parameters:
  - name: key
    required: false
    description: >
      Optional key override (e.g., NC-145 or hostcanvas). When provided, /continue operates on this key directly.
      When omitted, /continue autodetects the active key from evidence (chat, state, terminal).

  - name: notes
    required: false
    description: >
      Optional guidance to steer continuation (e.g., "phase 1 only", "revert styling", "focus on SignalR contract").
      Multiple directives may be separated with '---'. Notes influence detection, planning, and the next minimal step.

usage:
  prerequisites:
    - Always start/refresh the app using the build+run script:
        • .\Workspaces\Global\ncb.ps1     # builds and launches; REQUIRED (do not use dotnet run / nc.ps1)
    - Leave recent context intact: do not delete state under NOOR CANVAS\Workspaces\Copilot\

  run_examples:
    - Recover & continue the last active item (autodetect):
        • /continue
    - Force working on a specific key:
        • /continue key:NC-145
    - Nudge scope and priorities:
        • /continue key:NC-145 notes:"phase 1 only --- stop chasing perf --- fix SignalR payload"

  outputs:
    - Detected/resolved key, current phase/step, and rationale.
    - Next step plan (tight, incremental), structured diffs, and artifacts.
    - Updated state and Worklog in `.github/Workitem-{key}.MD`.

# ─────────────────────────────────────────────────────────
# 🧭 Context Boot (Resolve key, scope & step)
# ─────────────────────────────────────────────────────────
context_boot:
  resolve_key_and_scope:
    - If parameter `key` is provided:
        • Use that key directly and validate state presence:
            ◦ Check NOOR CANVAS\Workspaces\Copilot\{key}\ for { run.json, plan.json, progress.log.jsonl, checkpoint.json, artifacts.json }.
            ◦ If missing, proceed but initialize minimal state on first checkpoint.
    - Else (no key provided):
        • Inspect chat thread (latest → older) for:
            ◦ explicit mentions like "key:NC-xxx" or "Requirements-NC-xxx.MD"
            ◦ /workitem, /imgreq, /pwtest, /retrosync invocations
            ◦ operator corrections ("wrong direction", "phase 1 only")
        • Parse **#Workspaces**:
            ◦ Recently modified under NOOR CANVAS\Workspaces\Copilot\{key}\**
            ◦ Presence/freshness of state files listed above
        • Read **#terminalLastCommand** for ncb.ps1, npx playwright, git, etc.
        • If multiple candidates, pick the one with the newest checkpoint/progress entry.

  apply_notes:
    - If `notes` provided:
        • Record notes into `progress.log.jsonl` and include in rationale.
        • Treat '---' as hard separators and derive constraints:
            ◦ examples: "phase 1 only", "contract reconciliation required", "revert last styling", "skip tests", "focus on API errors".
        • Adjust detection filters, target files, and next step selection accordingly.

  confirm_state:
    - Load state for the resolved {key}; record last checkpoint + plan hash.

  context_index:
    discover:
      - Prefer `NOOR CANVAS\Workspaces\Copilot\{key}\index\context.idx.json` for planning.
      - If missing/stale → build or delta-build per SelfAwareness rules.
    prefer_for_planning: true
    record_delta:
      - After run, update `context.delta.json` and `context.sources.json`.

  ingest_context:
    - Read SelfAwareness guardrails; ingest `Requirements-{key}.MD` if present.
    - Skim `.github/Workitem-{key}.MD`, `.github/Test-{key}.MD`, `Cleanup-<key}.MD`, and any recent contract/retro docs.

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
  - Resolve {key} (parameter overrides autodetect) and last completed step.
  - Respect `notes` to constrain or steer the continuation.
  - Reconcile plan vs current actions; stop drift immediately.
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
    - Always re-run **phase_0_contract_reconciliation** when prior run ended during producer/consumer refactor or when logs show dropped/invalid messages.
    - If `notes` include "phase 1 only" or similar → cap at the specified phase and output a resume plan.

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
    - If key param provided → skip detection and validate state/index.
    - Else → rank candidate keys (evidence: thread hits, state timestamps, commands).
    - Apply `notes` filters to prefer evidence that matches the intent (e.g., contract logs if notes mention contracts).
    - If #terminalLastCommand or recent events include failed hub/API validations → set next step = phase_0_contract_reconciliation.

  reconcile:
    - Compare checkpoint.step_id with plan.json; write a tiny reconciliation plan (plan-v{n}.json).
    - If `notes` include "revert", prefer rollback-first steps; if "skip tests", omit non-critical tests.

  apply:
    - **Always run** `.\\Workspaces\\Global\\ncb.ps1` (build + run) before verification steps.
      Do not call `dotnet run` directly; do not substitute `nc.ps1`.
    - Execute the next **phased_apply** step; run minimal tests if needed.
    - **Insert cleanup-safe debug logs** for any code changes using `[DEBUG-WORKITEM:{key}:{layer}]`
      via a central helper/wrapper; logs must be removable by `/cleanup` and have no functional side effects.
    - Append a Worklog entry to `.github/Workitem-{key}.MD`.

  correct_direction:
    - If previous direction was wrong:
      • Stash/revert partial changes; document rollback in Worklog.
      • Proceed with Next Minimal Step consistent with `notes`.

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
  - Cleanup-<key}.MD
  - .github/Workitem-{key}.MD
  - .github/Test-{key}.MD

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
  - Parameters:
      • `key` is optional; when provided, it overrides autodetection.
      • `notes` guide scope; never contradict SelfAwareness safety rules.
  - **Execution**: must use `.\\Workspaces\\Global\\ncb.ps1` to run app; never `dotnet run`; never prefer `nc.ps1`.
  - **Logging**: when continuation includes code changes, auto-insert `[DEBUG-WORKITEM:{key}:{layer}]` logs via a centralized helper;
    logs must be removable by `/cleanup` and have no functional side effects.
  - Structured diffs only.
  - Requirements-{key}.MD is authoritative.
  - Use Tailwind + Font Awesome only if restyling is already in-scope.
  - Keep state and index current.

# ─────────────────────────────────────────────────────────
# 🧩 Output Shape
# ─────────────────────────────────────────────────────────
output:
  - detected: { key, rationale, last_checkpoint, notes_applied: [list] }
  - next_minimal_step: { description, files_to_touch, tests_to_run, constraints_from_notes: [list] }
  - diffs: [structured changes]
  - artifacts: [paths]
  - docs_updated: [ ".github/Workitem-{key}.MD" (Worklog appended) ]
  - watchdog_events: [ { step, idle_secs, action_taken, retry } ]
  - approval_gate:
      message: "Continue is ready on {key}. Summary prepared. Approve to execute the Next Minimal Step?"
      on_approval: Execute step + checkpoint + update docs/state/index
      on_no_approval: Halt; summarize alternatives

# ─────────────────────────────────────────────────────────
# 📝 Self-Review
# ─────────────────────────────────────────────────────────
self_review:
  - Resolved key correctly (or honored override).
  - Applied notes faithfully without violating guardrails.
  - Consulted **context.pack.jsonl** and Requirements-{key}.MD.
  - Kept blast radius small; phased apply respected.
  - Confirmed watchdog active; state and index updated.
