---
mode: agent

# ─────────────────────────────────────────────────────────
# ▶️ Usage
# ─────────────────────────────────────────────────────────
name: workitem
alias: /workitem
description: >
  Implement a work item in Noor Canvas based on key, mode, and notes.
  Capable of applying fixes, enhancements, styling redesigns, tests, and documentation.
  Includes watchdog self-recovery, git-history first-aid, alignment with requirements and instructions,
  and a phased, incremental application strategy to avoid risky large-scale changes.

parameters:
  - name: key
    required: true
    description: >
      Work item key.

  - name: mode
    required: true
    description: >
      Execution mode: plan | apply | review

  - name: test
    required: false
    default: false
    description: >
      If true, follow pwtest.prompt to generate + run headless Playwright tests spanning all layers.

  - name: notes
    required: false
    description: >
      Freeform notes from user. May contain directives such as "fix SignalR", "restyle page",
      or "optimize query". Multiple notes can be separated with '---'.

usage:
  prerequisites:
    - Ensure the app can launch with:
        • .\Workspaces\Global\nc.ps1     # simple launch
        • .\Workspaces\Global\ncb.ps1    # clean, build, and launch
    - Confirm environment assumptions (ports 9090/9091, Canvas writable, KSESSIONS_DEV read-only).
    - If available, attach or reference Requirements-{key}.MD and any screenshots/notes.

  run_examples:
    - Plan only:
        • /workitem key:NC-145 mode:plan notes:"introduce optimistic UI for save --- keep API unchanged"
    - Incremental apply with tests:
        • /workitem key:NC-145 mode:apply test:true notes:"restyle dashboard with Tailwind + Font Awesome"
    - Review what happened:
        • /workitem key:NC-145 mode:review

  outputs:
    - plan: plan.json or plan-v{n}.json with step-by-step approach.
    - apply: structured diffs, docs, artifacts, and (optionally) Playwright results.
    - review: summary of actions, rationale, failures, and next steps.

# ─────────────────────────────────────────────────────────
# 🧭 Context Boot
# ─────────────────────────────────────────────────────────
context_boot:
  - Load prior state for this key from **NOOR CANVAS\Workspaces\Copilot\{key}\** if present.
  - Consult .github/instructions/SelfAwareness.instructions.md for DB/schema restrictions and ledger.
  - Review debug logs across UI/API/SQL for reported issues.
  - Skim last 10 commits/chats relevant to this key.
  - If Requirements-{key}.MD exists (from imgreq runs):
      • Ingest and treat as authoritative functional requirements.
      • Map acceptance criteria to its numbered requirements.

# ─────────────────────────────────────────────────────────
# 💾 State & Checkpoints
# ─────────────────────────────────────────────────────────
state_store:
  root: "NOOR CANVAS\\Workspaces\\Copilot\\{key}\\"
  files: { run_manifest: run.json, plan_manifest: plan.json, progress_log: progress.log.jsonl, checkpoint: checkpoint.json, artifacts_idx: artifacts.json }
  io: { write_mode: append_minimal, compress: true, atomic_writes: true, debounce_ms: 150 }
  load_policy:
    - Resume from checkpoint if plan_hash matches; else write new plan-v{n}.json and resume.
  save_policy:
    - After each step: update checkpoint + append to progress log + update artifacts index.
  retention: { ttl_hours: 24, cleanup_on_approval: true }

# ─────────────────────────────────────────────────────────
# 🎯 Objectives
# ─────────────────────────────────────────────────────────
objectives:
  plan:
    - Generate a detailed technical plan (UI, API, DB, infra).
    - Align plan with Requirements-{key}.MD if exists.
    - Output plan-v{n}.json in state.
  apply:
    - Implement changes **incrementally** via Phased Apply (see below), with verification between phases.
    - If notes include "restyle" or "redesign":
        • Apply modern UI/UX styling.
        • Use Tailwind CSS classes for styling.
        • Use Font Awesome icons where appropriate to enhance visual clarity and dynamics.
        • Ensure resulting view is clean, elegant, and consistent with modern practices.
    - Always run app with .\nc.ps1 (or .\ncb.ps1 then .\nc.ps1 if build required).
    - Generate/update technical .MD docs in `.github` describing the implementation.
    - Add new docs to alignment for SelfAwareness.
    - Trigger Playwright tests if test:true.
    - Keep state files current.
  review:
    - Summarize what was attempted, what succeeded/failed, and why.
    - Provide next-step recommendations.
    - Keep state files current.

# ─────────────────────────────────────────────────────────
# 🔁 Phased Apply (Incremental Changes, Guardrails On)
# ─────────────────────────────────────────────────────────
phased_apply:
  phases:
    - phase_0_scaffold:
        goal: "Safe scaffolding with no behavior change."
        actions:
          - Introduce feature flags/toggles where useful (default: off).
          - Add minimal interfaces/types, placeholder components, and route stubs.
          - Write tiny smoke test (component render / route mounts).
        verify:
          - App launches (`.\nc.ps1`), existing flows untouched.
          - Headless smoke test passes; no regressions spotted in crucial routes.

    - phase_1_minimal_viable_change:
        goal: "Wire the smallest functional slice end-to-end."
        actions:
          - Implement narrow UI path + API call + DB-visible effect (if applicable).
          - Add Gherkin-aligned tests for that slice (pwtest).
          - Log under canonical tag `[DEBUG-WORKITEM:{key}:ui|api|db]` if temporary diagnostics are needed.
        verify:
          - Run targeted Playwright spec(s) headless; collect traces/screenshots for failures.
          - Update `.github/Workitem-{key}.MD` with results and rationale.

    - phase_2_expand_coverage:
        goal: "Broaden functionality and edge cases."
        actions:
          - Add remaining UI states (empty/loading/error), validation, and accessibility bits.
          - Extend tests to negative paths and boundary values.
        verify:
          - Re-run tests; review artifacts.
          - Update docs and close Open Questions where evidence exists.

    - phase_3_full_convergence:
        goal: "Complete scope per Requirements-{key}.MD; remove temp flags/logs."
        actions:
          - Replace flagged paths with final implementations; remove temporary logs.
          - Optimize queries and performance hotspots identified during testing.
        verify:
          - Full headless suite green; watchdog shows no hangs.
          - Prepare cleanup gate (state purge via /cleanup).

  rules:
    - Never skip a phase; if a phase fails, fix forward or rollback within the same phase.
    - Commit or checkpoint after each phase; document deltas in `.github/Workitem-{key}.MD`.
    - Keep risk surface small: small diffs, local blast radius, feature flags if crossing module boundaries.

# ─────────────────────────────────────────────────────────
# 🐶 Watchdog — Self-Recovery
# ─────────────────────────────────────────────────────────
watchdog:
  idle_seconds_threshold: 120
  graceful_stop_timeout_seconds: 10
  max_retries: 1
  monitored_steps:
    - "build"
    - "run"
    - "compile"
    - "test"
  behavior:
    - Detect idle → capture log tail + process snapshot.
    - Attempt graceful stop; force kill if unresponsive.
    - Log event into artifacts and progress log.
    - Retry once; if still hung, fail with status watchdog_hang.

# ─────────────────────────────────────────────────────────
# 🔗 Alignment
# ─────────────────────────────────────────────────────────
alignment:
  - .github/instructions/SelfAwareness.instructions.md
  - Requirements-{key}.MD (from imgreq runs)
  - .github/Workitem-{key}.MD
  - .github/prompts/pwtest.prompt.md
  - Cleanup-{key}.MD

# ─────────────────────────────────────────────────────────
# 🛠️ Methods
# ─────────────────────────────────────────────────────────
methods:
  plan:
    - Derive steps from notes and prior state.
    - Output plan.json (or plan-v{n}.json) with evidence.
  apply:
    - Run ncb.ps1 if build required, else nc.ps1.
    - Execute **phased_apply** phases 0→3; checkpoint and verify after each phase.
    - Apply structured diffs to UI/API/DB.
    - Respect "restyle"/"redesign" instructions for UI (Tailwind + Font Awesome).
    - Generate/update .MD doc in `.github` (Workitem-{key}.MD).
    - Keep state up to date.
  review:
    - Summarize outcomes.
    - Capture logs and diffs.
    - Document blockers.

# ─────────────────────────────────────────────────────────
# 🧯 Error Handling (Git History First-Aid)
# ─────────────────────────────────────────────────────────
errors:
  on_failure:
    - Determine if feature previously worked.
    - If regression → diff commits, restore last-known-good.
    - If new → fix forward with tests.
    - Document decision and evidence in .MD docs + state.
  on_watchdog_hang:
    - Include log tails and metadata in artifacts.
    - Reference Ops-Watchdog-Troubleshooting.md.
    - Retry once; if still hung, fail safe.

# ─────────────────────────────────────────────────────────
# 🧪 Test Plan Contract
# ─────────────────────────────────────────────────────────
test_plan_contract:
  required_fields:
    - routes_endpoints
    - tokens_credentials (placeholders)
    - setup_instructions
    - validation_steps
    - expected_outputs
    - requirements_coverage (if Requirements-{key}.MD exists)

# ─────────────────────────────────────────────────────────
# 🚦 Guardrails
# ─────────────────────────────────────────────────────────
guardrails:
  - Use Tailwind and Font Awesome when restyling/redesigning.
  - Structured diffs only; never overwrite entire files blindly.
  - Requirements-{key}.MD is authoritative.
  - Logs must follow canonical tag and be removable by /cleanup.
  - **State must be updated each step under NOOR CANVAS\Workspaces\Copilot\{key}\; purge only via /cleanup approval.**
  - Tests must run headless when test:true.

# ─────────────────────────────────────────────────────────
# 🧩 Output Shape
# ─────────────────────────────────────────────────────────
output:
  - state: { run_manifest, plan_manifest, checkpoint, artifacts_idx }
  - plan: plan.json or plan-v{n}.json
  - diffs: [files updated]
  - docs: new/updated Workitem-{key}.MD in .github
  - artifacts: logs, screenshots, traces, videos
  - test_plan: per contract
  - approval_gate:
      message: "Workitem complete for {key}. Review docs, diffs, test plan, and approve."
      on_approval:
        - Finalize docs + request /cleanup purge
      on_no_approval:
        - Keep state intact; summarize pending actions

# ─────────────────────────────────────────────────────────
# 📝 Self-Review
# ─────────────────────────────────────────────────────────
self_review:
  - Resumed from per-key state if available.
  - Consulted SelfAwareness and Requirements-{key}.MD.
  - Verified Tailwind + Font Awesome used for restyle/redesign.
  - Confirmed watchdog active.
  - Documented regression vs new-feature decisions.
  - Updated state and artifacts.
  - Wrote Workitem-{key}.MD into .github and added to alignment.

# ─────────────────────────────────────────────────────────
# 📦 Final Summary
# ─────────────────────────────────────────────────────────
final_summary:
  - What the user asked.
  - What Copilot implemented.
  - The Fix and why it should work.
  - Detailed Test Plan for user validation.
  - Files created/updated and aligned:
      • D:\PROJECTS\NOOR CANVAS\.github\Workitem-{key}.MD
      • Requirements-{key}.MD (if present)
      • Cleanup-<key}.MD
  - Resume info:
      • **State path: NOOR CANVAS\Workspaces\Copilot\{key}\**
      • Last checkpoint: {checkpoint.step_id}
