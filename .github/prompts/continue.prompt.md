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
        • .\Workspaces\Global\nc.ps1     # simple launch
        • .\Workspaces\Global\ncb.ps1    # clean, build, and launch
    - Leave recent context intact: do not delete state under NOOR CANVAS\Workspaces\Copilot\

  run_examples:
    - Recover & continue the last active item:
        • /continue
    - Nudge with a corrective message first (optional), then:
        • "Stop chasing perf; revert to UI bug scope." → /continue

  outputs:
    - Detected key, current phase/step, and rationale.
    - Next step plan (tight, incremental), structured diffs, and artifacts.
    - Updated state and a minimal Worklog appended to `.github/Workitem-{key}.MD`.

# ─────────────────────────────────────────────────────────
# 🧭 Context Boot (Autodetect the active key & step)
# ─────────────────────────────────────────────────────────
context_boot:
  discover_key_and_scope:
    - Inspect chat thread history (latest → older) for:
        • explicit mentions like "key:NC-xxx" or "Requirements-NC-xxx.MD"
        • /workitem, /imgreq, /pwtest, /sync invocations
        • operator corrections ("wrong direction", "roll back", "phase 1 only")
    - Parse **#Workspaces** snapshot:
        • Recently modified files under NOOR CANVAS\Workspaces\Copilot\{key}\**
        • Presence of { run.json, plan.json, progress.log.jsonl, checkpoint.json, artifacts.json }
    - Read **#terminalLastCommand**:
        • Look for nc.ps1/ncb.ps1 runs, npx playwright, git commands, or build logs
        • Infer last successful/failed action
    - If multiple candidate keys:
        • Choose the most recent key that has a newer checkpoint or a more recent progress.log.jsonl entry

  confirm_state:
    - Load state for the detected key:
        • NOOR CANVAS\Workspaces\Copilot\{key}\{run.json, plan.json, progress.log.jsonl, checkpoint.json, artifacts.json}
    - Read `.github/instructions/SelfAwareness.instructions.md`
    - If present: ingest `Requirements-{key}.MD` (authoritative)
    - Optional evidence: look at `.github/Workitem-{key}.MD`, `.github/Test-{key}.MD`, Cleanup-<key>.MD

# ─────────────────────────────────────────────────────────
# 💾 State & Checkpoints (for continue itself)
# ─────────────────────────────────────────────────────────
state_store:
  root: "NOOR CANVAS\\Workspaces\\Copilot\\continue\\{key}\\"
  files:
    run_manifest:   "run.json"
    plan_manifest:  "plan.json"              # lightweight reconciliation plan
    progress_log:   "progress.log.jsonl"
    checkpoint:     "checkpoint.json"
    artifacts_idx:  "artifacts.json"
  io: { write_mode: append_minimal, compress: true, atomic_writes: true, debounce_ms: 150 }
  retention: { ttl_hours: 24, cleanup_on_approval: true }

# ─────────────────────────────────────────────────────────
# 🎯 Objectives
# ─────────────────────────────────────────────────────────
objectives:
  - Detect the correct {key} and last completed step from checkpoint/progress logs
  - Reconcile **what should be happening** vs **what is happening**; stop drift
  - Produce a **Next Minimal Step** plan aligned with Requirements-{key}.MD and the current phase
  - Apply changes **incrementally** using Phased Apply (Phase 0→3), never big-bang
  - If tests are relevant, invoke the minimal pwtest scope necessary to verify the step
  - Update docs minimally and keep all state current; prepare an approval gate

# ─────────────────────────────────────────────────────────
# 🔁 Phased Apply (for corrections & continuation)
# ─────────────────────────────────────────────────────────
phased_apply:
  rules:
    - Keep blast radius small: narrow diffs, feature flags if needed, one slice at a time
    - If the last step failed: fix forward inside the same phase; otherwise resume from the next phase
    - After each phase, checkpoint + update `.github/Workitem-{key}.MD` Worklog section

  phases:
    - phase_0_scaffold:
        goal: "Recreate minimal scaffolding/context without changing behavior"
        actions:
          - Verify build/launch with nc.ps1 (or ncb.ps1 if needed)
          - Restore missing wiring, env placeholders, and route/component stubs
        verify:
          - App launches; smoke checks pass

    - phase_1_minimal_viable_change:
        goal: "One thin vertical slice working end-to-end"
        actions:
          - Implement the smallest fix/feature slice (UI→API→DB if applicable)
          - Add or repair the smallest relevant Playwright spec(s)
        verify:
          - Headless run green; traces/screens/tests stored

    - phase_2_expand_coverage:
        goal: "Edge cases, validation, and a11y"
        actions:
          - Add empty/loading/error states, form validation, aria roles/labels
          - Negative tests & boundary conditions
        verify:
          - Headless run green; artifacts captured

    - phase_3_full_convergence:
        goal: "Complete requirement scope; remove temp flags/logs"
        actions:
          - Replace temporary code paths; remove `[DEBUG-WORKITEM:{key}:{layer}]` logs
          - Performance tidy-ups if discovered during tests
        verify:
          - Full suite green; prepare cleanup purge

# ─────────────────────────────────────────────────────────
# 🛠️ Methods
# ─────────────────────────────────────────────────────────
methods:
  detect:
    - Produce a ranked list of candidate keys (evidence: files, timestamps, thread hits)
    - Select the top candidate and echo the rationale
  reconcile:
    - Compare checkpoint.step_id with plan.json
    - Determine drift: wrong file focus, wrong layer, or extraneous scope
    - Write a tiny reconciliation plan (plan-v{n}.json) with the **Next Minimal Step**
  apply:
    - Execute the appropriate **phased_apply** step
    - Run `.\\Workspaces\\Global\\ncb.ps1` when build changes are needed; otherwise `.\\Workspaces\\Global\\nc.ps1`
    - If tests exist or are needed for the slice, call the smallest `/pwtest` scope (equivalent behavior inline)
    - Append a Worklog entry to `.github/Workitem-{key}.MD` (what/why/evidence)
  correct_direction:
    - If the last direction was wrong:
      • Stash or revert partial changes (git) with a clean commit message
      • Document the rollback note in `.github/Workitem-{key}.MD`
      • Proceed with the Next Minimal Step

# ─────────────────────────────────────────────────────────
# 🐶 Watchdog — Self-Recovery
# ─────────────────────────────────────────────────────────
watchdog:
  idle_seconds_threshold: 120
  graceful_stop_timeout_seconds: 10
  max_retries: 1
  monitored_steps:
    - "detect"
    - "reconcile"
    - "apply"
  behavior:
    - Detect idle → capture log tail + process snapshot
    - Attempt graceful stop; force kill if needed
    - Record watchdog event in progress_log and artifacts_idx
    - Retry once idempotently; else fail with status `watchdog_hang`

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
    - Classify as regression vs new code
    - If regression → diff to last-known-good; restore or cherry-pick
    - If new → fix forward with the smallest viable change
    - Always document the evidence and decision in Worklog

# ─────────────────────────────────────────────────────────
# 🚦 Guardrails
# ─────────────────────────────────────────────────────────
guardrails:
  - **No parameters**: never prompt the operator for key; you must detect it
  - Structured diffs only; never overwrite entire files
  - Respect Requirements-{key}.MD as authoritative
  - Use Tailwind + Font Awesome only when restyling is already in-scope
  - Logs must follow `[DEBUG-WORKITEM:{key}:{layer}]` and be removable by /cleanup
  - Keep all state current under NOOR CANVAS\Workspaces\Copilot\{key}\ and continue\{key}\

# ─────────────────────────────────────────────────────────
# 🧪 Minimal Test Contract (when tests are needed)
# ─────────────────────────────────────────────────────────
test_plan_contract:
  required_fields:
    - narrow_test_paths
    - setup_instructions (placeholders ok)
    - validation_steps
    - expected_outputs
    - artifacts (trace/screenshot/video paths)

# ─────────────────────────────────────────────────────────
# 🧩 Output Shape
# ─────────────────────────────────────────────────────────
output:
  - detected:
      key: "{key}"
      rationale: "why this key was chosen (thread hits, state timestamps, commands)"
      last_checkpoint: "{checkpoint.step_id}"
  - next_minimal_step:
      description: "the smallest safe action that advances the goal"
      files_to_touch: [list]
      tests_to_run: [list]
  - diffs: [structured changes]
  - artifacts: [paths to traces/screens/logs]
  - docs_updated:
      - ".github/Workitem-{key}.MD" (Worklog appended)
  - watchdog_events: [ { step, first_observed, idle_secs, action_taken, retry } ]
  - approval_gate:
      message: "Continue is ready to proceed on {key} with the Next Minimal Step. Approve?"
      on_approval:
        - Execute the step and checkpoint
      on_no_approval:
        - Halt; summarize alternatives

# ─────────────────────────────────────────────────────────
# 📝 Self-Review
# ─────────────────────────────────────────────────────────
self_review:
  - Key detection was evidence-based and unambiguous
  - Phase selection matches checkpoint and plan
  - Next step is minimal, testable, and reversible
  - State and docs updated; artifacts captured

# ─────────────────────────────────────────────────────────
# 📦 Final Summary
# ─────────────────────────────────────────────────────────
final_summary:
  - What was drifting and how we corrected it
  - Detected key and current phase/step
  - The Next Minimal Step and why it’s the safest advance
  - Files touched, tests run, and artifacts
  - Resume info:
      • **State path (key)**: NOOR CANVAS\Workspaces\Copilot\{key}\
      • **Continue state**:   NOOR CANVAS\Workspaces\Copilot\continue\{key}\
      • Last checkpoint: {checkpoint.step_id}
