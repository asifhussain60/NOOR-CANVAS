---
mode: agent

# ─────────────────────────────────────────────────────────
# ▶️ Usage
# ─────────────────────────────────────────────────────────
name: workitem
alias: /workitem
description: >
  Implement or analyze a work item in Noor Canvas based on key, mode, and notes.
  Capable of deep cross-layer analysis, incremental application of fixes/enhancements,
  styling/redesigns, tests, and documentation. Includes watchdog self-recovery,
  git-history first-aid, alignment with requirements and instructions, and a phased,
  incremental apply strategy to avoid risky large-scale changes.

parameters:
  - name: key
    required: true
    description: >
      Work item key (ID or slug), e.g., NC-145 or hostcanvas.

  - name: mode
    required: true
    description: >
      Execution mode:
        • analyze → Perform a detailed, comprehensive analysis across all layers (Blazor, .NET Core, API, SQL)
                    and report back using easy-to-read summaries and tabular structures. No code changes.
        • apply   → Perform the requested work (incremental, phased) and report back in the same structure
                    as analyze (summaries + tables) with diffs, artifacts, and validation results.
        • review  → Summarize what happened for this key (attempted, succeeded/failed, rationale, next steps).

  - name: test
    required: false
    default: false
    description: >
      If true (only relevant to apply), follow pwtest.prompt to generate + run headless Playwright tests
      spanning UI, API, and (where applicable) DB contracts.

  - name: notes
    required: false
    description: >
      Freeform directives such as "fix SignalR", "restyle page", "optimize query".
      Multiple notes can be separated with '---'. These guide both analyze and apply scopes.

usage:
  prerequisites:
    - Ensure the app can launch with:
        • .\Workspaces\Global\nc.ps1     # simple launch
        • .\Workspaces\Global\ncb.ps1    # clean, build, and launch
    - Confirm environment assumptions (ports 9090/9091, Canvas writable, KSESSIONS_DEV read-only).
    - If available, attach or reference Requirements-{key}.MD and any screenshots/notes.

  run_examples:
    - Analysis only (no code changes):
        • /workitem key:NC-145 mode:analyze notes:"audit hostcanvas contracts --- list risks"
    - Incremental apply with tests:
        • /workitem key:NC-145 mode:apply test:true notes:"restyle dashboard with Tailwind + Font Awesome"
    - Post-run summary:
        • /workitem key:NC-145 mode:review

  outputs:
    - analyze: Analysis report with layered findings (Blazor/.NET/API/SQL), risk matrix, effort estimates,
               contract reconciliation (dry-run), and tables (endpoints, DTO fields, schema, tests).
    - apply:   Structured diffs, updated docs, artifacts, (optional) Playwright results, and an analysis-style
               summary & tables of what changed + validation outcomes.
    - review:  Summary of actions, rationale, failures, and next steps.

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
        - After runs, write `context.delta.json` with added/removed/changed refs and update `context.sources.json`.
  - Consult `.github/instructions/SelfAwareness.instructions.md` for DB/schema restrictions and ledger.
  - Review debug logs across UI/API/SQL for reported issues.
  - Skim last 10 commits/chats relevant to this key.
  - If `Requirements-{key}.MD` exists (from imgreq runs):
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
  analyze:
    - Perform **no-code-change** analysis across:
        • Blazor/UI (components, bindings, routing, a11y)
        • .NET Core backend (services, validators, logging)
        • API endpoints (routes, verbs, status codes, payloads)
        • SignalR hubs/channels (producer/consumer fields, group naming)
        • SQL/EF schema (tables, views, indexes, nullable/constraints)
    - Run **Contract Reconciliation (dry-run)**:
        • Detect consumer-used fields vs producer DTOs; list missing/extra/type/nullable/version drift.
        • Produce recommended DTO patch and version bump (no code changes applied).
    - Produce **analysis artifacts**:
        • Endpoint Map (table)
        • DTO Field Matrix (table: field | type | nullable | producer | consumer(s) | notes)
        • SignalR Contract Map (table: message | fields | producer | consumers | status)
        • SQL Schema Snapshot & Drift (table: entity | column | type | null | source | notes)
        • Risk Matrix (probability × impact) + mitigation plan
        • Effort & Phase Estimates (P0-P2) with dependencies
        • Test Coverage Gaps & Proposed Specs (UI/API/contract)
    - Write `.github/Analysis-{key}.MD` and update state with references.
    - Present an **Approval Gate** to proceed (e.g., convert recommended patches into apply plan).

  apply:
    - Implement changes **incrementally** via Phased Apply (see below), with verification between phases.
    - If notes include "restyle" or "redesign":
        • Apply modern UI/UX styling.
        • Use Tailwind CSS classes for styling.
        • Use Font Awesome icons where appropriate to enhance visual clarity and dynamics.
        • Ensure resulting view is clean, elegant, and consistent with modern practices.
    - Always run app with `.\\Workspaces\\Global\\nc.ps1` (or `.\\Workspaces\\Global\\ncb.ps1` then `nc.ps1` if build required).
    - Generate/update technical .MD docs in `.github` describing the implementation.
    - Add new docs to alignment for SelfAwareness.
    - Trigger Playwright tests if `test:true`.
    - Keep state files current. Also emit an **analysis-style report** of what changed (tables + summary).

  review:
    - Summarize what was attempted, what succeeded/failed, and why.
    - Provide next-step recommendations (including corrective phases and tests).
    - Keep state files current.

# ─────────────────────────────────────────────────────────
# 🔁 Phased Apply (Incremental Changes, Guardrails On)
# ─────────────────────────────────────────────────────────
phased_apply:
  phases:
    - phase_0_contract_reconciliation:
        goal: "Make producer↔consumer contracts explicit and green before behavior changes."
        actions:
          - Identify all consumers for this key (UI .razor/.tsx, API endpoints, SignalR handlers).
          - Extract **fields used** by consumers (AST/regex: property/JSON access, bindings, data-testid).
          - Load DTOs from Shared/Contracts; diff **used vs provided**:
              • missing fields (required by UI but absent in DTO/producer)
              • extra fields (sent but unused)
              • type/nullable mismatches
              • version drift (consumer expects ≠ producer sends)
          - Propose and **apply** DTO patch (for apply mode) with `SchemaVersion` bump and shims as needed.
          - Write golden fixture(s) under `Tests/Fixtures/<DTO>/` that include all required fields.
        verify:
          - Checklist saved to `.github/Workitem-{key}.MD` (section: Contract Reconciliation).
          - `checkpoint.json` updated with `step_id:"contract_reconciliation"` and `plan_hash`.
          - If **missing required fields** remain → **STOP** and request approval to apply DTO patch.

    - phase_1_minimal_viable_change:
        goal: "Wire the smallest producer change so the consumer-required fields exist."
        actions:
          - Implement server-side changes to populate newly required fields.
          - Add validation (FluentValidation/data annotations) enforcing required fields.
        verify:
          - Unit test(s) pass against golden fixture; hub/API sends contain required fields.
          - Minimal Playwright spec proves UI receives and renders the field(s).

    - phase_2_expand_coverage:
        goal: "Edge cases, validation, a11y, and consumer parity."
        actions:
          - Update consumers to read new fields; keep shims/feature flags if renames occurred.
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
    - "analyze"     # ensure analysis hangs are caught too
  behavior:
    - Detect idle → capture log tail + process snapshot.
    - Attempt graceful stop; force kill if unresponsive.
    - Log event into artifacts and progress log.
    - Retry once; if still hung, fail with status `watchdog_hang`.

# ─────────────────────────────────────────────────────────
# 🔗 Alignment
# ─────────────────────────────────────────────────────────
alignment:
  - .github/instructions/SelfAwareness.instructions.md
  - Requirements-{key}.MD (from imgreq runs)
  - D:\PROJECTS\NOOR CANVAS\.github\*.MD
  - .github/prompts/pwtest.prompt.md
  - Cleanup-<key>.MD
  - .github/Contracts-Registry.MD
  - .github/Analysis-{key}.MD
  - .github/Workitem-{key}.MD
  - .github/Test-{key}.MD

# ─────────────────────────────────────────────────────────
# 🛠️ Methods
# ─────────────────────────────────────────────────────────
methods:
  analyze:
    - Gather evidence: context index, prior state, commits, logs, Requirements-{key}.MD.
    - Inspect UI (Blazor): component hierarchy, routes, data flow, bindings, a11y roles.
    - Inspect backend (.NET Core): services, validators, controllers, logging patterns.
    - Inspect API: endpoints, request/response schemas, status codes, error shapes.
    - Inspect SignalR: hubs, group naming, message payloads, consumer expectations.
    - Inspect SQL/EF: entities, migrations, constraints, indexes; detect drift and performance risks.
    - Perform **Contract Reconciliation (dry-run)**; produce recommended DTO patches with `SchemaVersion`.
    - Produce tables (CSV/Markdown) for Endpoints, DTO fields, SignalR messages, SQL entities.
    - Produce Risk Matrix, Mitigations, and Effort/Phase estimates.
    - Write `.github/Analysis-{key}.MD`; attach artifacts to `artifacts.json`.
    - Present Approval Gate with actionable recommendations.

  apply:
    - Run `ncb.ps1` if build required, else `nc.ps1`.
    - Execute **phased_apply** phases 0→3; checkpoint and verify after each phase.
    - Apply structured diffs to UI/API/DB/SignalR; keep changes minimal per phase.
    - Respect "restyle"/"redesign" instructions (Tailwind + Font Awesome).
    - If `test:true`, generate and run headless Playwright specs; attach results.
    - Generate/update `.github/Workitem-{key}.MD` and update Contracts-Registry if contracts changed.
    - Update context delta; keep state current.
    - Emit an analysis-style post-change report (tables + summary of validations).

  review:
    - Summarize outcomes, diffs, and artifacts produced in previous runs.
    - Provide a next-step plan (including tests and doc updates if gaps remain).

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
  - **Strict mode contract**:
      • Only {analyze, apply, review} are accepted.
      • Any other value → error out with a clear message; do not default to apply.
  - Use Tailwind and Font Awesome when restyling/redesigning.
  - Structured diffs only; never overwrite entire files blindly.
  - Requirements-{key}.MD is authoritative for functional behavior.
  - Logs must follow canonical tag and be removable by `/cleanup`.
  - **State must be updated each step under NOOR CANVAS\Workspaces\Copilot\{key}\; purge only via /cleanup approval.**
  - Tests must run headless when `test:true`.
  - Analyze mode MUST NOT change code or data; produce reports only.

# ─────────────────────────────────────────────────────────
# 🧩 Output Shape
# ─────────────────────────────────────────────────────────
output:
  - state: { run_manifest, plan_manifest, checkpoint, artifacts_idx }
  - analyze_report: ".github/Analysis-{key}.MD" (summary + tables + recommendations)
  - diffs: [files updated]            # apply only
  - docs:
      created_or_updated:
        - .github/Workitem-{key}.MD   # apply and review append
        - .github/Analysis-{key}.MD   # analyze (and apply for post-change summary)
        - Requirements-{key}.MD       # if present, cross-referenced only (analyze) or updated (apply)
  - artifacts: logs, screenshots, traces, videos, CSV/MD tables
  - test_plan: per contract (apply with test:true)
  - approval_gate:
      message: >
        Workitem {mode} ready for {key}.
        Summary & tables prepared. Approve to proceed with the next step.
      on_approval:
        - For analyze: confirm conversion of recommended patches into an apply plan.
        - For apply: finalize changes, update docs, request `/cleanup` purge if needed.
      on_no_approval:
        - Keep state intact; summarize pending actions and alternatives.

# ─────────────────────────────────────────────────────────
# 📝 Self-Review
# ─────────────────────────────────────────────────────────
self_review:
  - Resumed from per-key state if available.
  - Consulted **context.pack.jsonl** and Requirements-{key}.MD.
  - For analyze: produced layered findings, dry-run contract reconciliation, and clear tables.
  - For apply: verified Tailwind + Font Awesome used when restyling/redesigning.
  - Confirmed watchdog active.
  - Documented regression vs new-feature decisions.
  - Updated state, index delta, and artifacts.
  - Wrote Analysis/Workitem docs into `.github` and added to alignment.

# ─────────────────────────────────────────────────────────
# 📦 Final Summary
# ─────────────────────────────────────────────────────────
final_summary:
  - What the user asked.
  - What was analyzed and/or implemented, and why.
  - The Fix (if apply) and why it should work.
  - Detailed Validation Summary (tests run, endpoints verified, contract checks).
  - Files created/updated and aligned:
      • .github/Analysis-{key}.MD
      • D:\PROJECTS\NOOR CANVAS\.github\Workitem-{key}.MD
      • Requirements-{key}.MD (if present/updated)
      • Cleanup-<key>.MD
  - Resume info:
      • **State path: NOOR CANVAS\Workspaces\Copilot\{key}\**
      • Last checkpoint: {checkpoint.step_id}
