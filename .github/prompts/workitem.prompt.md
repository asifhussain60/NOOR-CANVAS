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
  - context_index:
      discover:
        - Look for `NOOR CANVAS\Workspaces\Copilot\{key}\index\context.idx.json`.
        - If present → load manifest and use `context.pack.jsonl` as primary planning input.
        - If absent or stale → build or delta-build per SelfAwareness Context Indexing rules.
      prefer_for_planning: true
      record_delta:
        - After run, write `context.delta.json` with added/removed/changed refs and update `context.sources.json`.
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
  includes_index:
    path: "NOOR CANVAS\\Workspaces\\Copilot\\{key}\\index\\"
    files: [ "context.idx.json", "context.pack.jsonl", "context.delta.json", "context.sources.json" ]
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
    - Always run app with .\Workspaces\Global\nc.ps1 (or .\Workspaces\Global\ncb.ps1 then .\Workspaces\Global\nc.ps1 if build required).
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
    - phase_0_contract_reconciliation:
        goal: "Make producer↔consumer contracts explicit and green before code changes."
        actions:
          - Identify all consumers for this key (UI .razor/.tsx, API endpoints, SignalR handlers).
          - Extract **fields used** by consumers (AST/regex: property/JSON access, bindings, data-testid).
          - Load DTOs from Shared/Contracts; diff **used vs provided**:
              • missing fields (required by UI but absent in DTO/producer)
              • extra fields (sent but unused)
              • type/nullable mismatches
              • version drift (consumer expects ≠ producer sends)
          - Propose DTO patch (add fields, rename with [Obsolete]/map, set `SchemaVersion` bump).
          - Write golden fixture(s) under `Tests/Fixtures/<DTO>/` that include all required fields.
        verify:
          - Checklist saved to `.github/Workitem-{key}.MD` (section: Contract Reconciliation).
          - `checkpoint.json` updated with `step_id:"contract_reconciliation"` and `plan_hash`.
          - If **missing required fields** remain → **STOP** and request approval to apply DTO patch.

    - phase_1_minimal_viable_change:
        goal: "Wire the smallest producer change so the consumer-required fields exist."
        actions:
          - Implement DTO patch in Shared/Contracts (non-breaking when possible).
          - Update producer(s) to populate newly required fields (e.g., `TestContent` HTML).
          - Add server-side validation (FluentValidation/data annotations) enforcing required fields.
        verify:
          - Unit test(s) pass against golden fixture; hub/API sends contain required fields.
          - Minimal Playwright spec proves UI receives and renders the field(s).

    - phase_2_expand_coverage:
        goal: "Edge cases, validation, a11y, and consumer parity."
        actions:
          - Update consumer(s) to read new fields; keep temporary shims/feature flags if renames occurred.
          - Extend Playwright and integration tests (negative paths, boundary cases).
        verify:
          - Headless suite green; invalid payloads rejected with clear reason.

    - phase_3_full_convergence:
        goal: "Remove shims/flags; finalize contract and telemetry."
        actions:
          - Remove obsolete code paths and temporary logs `[DEBUG-WORKITEM:{key}:{layer}]`.
          - Update Contracts-Registry and Requirements with final field names + version.
        verify:
          - Full suite green; retrosync finds no contract mismatches.


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
  - D:\PROJECTS\NOOR CANVAS\.github\*.MD
  - .github/prompts/pwtest.prompt.md
  - Cleanup-<key>.MD

# ─────────────────────────────────────────────────────────
# 🛠️ Methods
# ─────────────────────────────────────────────────────────
methods:
  plan:
    - Derive steps from notes, **context.pack.jsonl**, and prior state.
    - Output plan.json (or plan-v{n}.json) with evidence.
  apply:
    - Run ncb.ps1 if build required, else nc.ps1.
    - Execute **phased_apply** phases 0→3; checkpoint and verify after each phase.
    - Apply structured diffs to UI/API/DB.
    - Respect "restyle"/"redesign" instructions for UI (Tailwind + Font Awesome).
    - Generate/update `.github/Workitem-{key}.MD`.
    - Keep state and index up to date (write `context.delta.json`).
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
  - Consulted **context.pack.jsonl** and Requirements-{key}.MD.
  - Verified Tailwind + Font Awesome used when restyling/redesigning.
  - Confirmed watchdog active.
  - Documented regression vs new-feature decisions.
  - Updated state, index delta, and artifacts.
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
