---
mode: agent


# ─────────────────────────────────────────────────────────
# ▶️ Usage
# ─────────────────────────────────────────────────────────
name: imgreq
alias: /imgreq
description: >
  Convert annotated UI screenshots into an implementation-ready requirements spec.
  Supports "analyze" (spec only) and "apply" (merge into project docs/ledger and hand off to /workitem).
  Includes a watchdog for long runs and durable state for resumability.

parameters:
  - name: key
    required: true
    description: >
      Work item or issue memory key (ID or slug). Multiple keys allowed, separated by '---'.
      Used to associate the generated requirements with the same project ledger as /workitem.

  - name: mode
    required: true
    description: >
      Execution mode:
        • "analyze" → Generate the requirements spec only (no file updates).
        • "apply"   → Generate the spec and integrate it into the repo docs/trackers, ready for /workitem.

  - name: notes
    required: false
    description: >
      Optional hints or constraints. Examples:
        • platform scope (“web only”, “desktop+mobile”, “RTL”)
        • deferrals (“ignore backend changes”)
        • extra acceptance details (“keyboard only flow”, “aria-live for toasts”)
      Multiple notes may be separated by '---'.
usage:
  prerequisites:
    - Ensure the app can launch with:
        • .\Workspaces\Global\nc.ps1     # simple launch
        • .\Workspaces\Global\ncb.ps1    # clean, build, and launch
    - Place input screenshots (PNG/JPG/PDF pages) in an accessible path.

  run_examples:
    - Chat invocation (spec only):
        • /imgreq key:NC-102 mode:analyze notes:"web only --- enforce aria-live for toasts"
    - Chat invocation (spec + write Requirements file and link trackers):
        • /imgreq key:NC-102 mode:apply notes:"desktop+mobile --- ignore backend changes"
    - Multiple keys (merged spec per key, separated by '---'):
        • /imgreq key:"NC-200---NC-201" mode:apply
    - After apply, hand off to work implementation:
        • /workitem key:NC-102 mode:apply test:true

  inputs:
    - One or more images attached to the chat (or referenced paths).
    - Optional short notes for constraints/clarifications.

  outputs:
    - analyze: Markdown spec only (returned in-chat and in state artifacts).
    - apply: Creates/updates Requirements-{key}.MD, adds .github/Handoff-{key}.MD, and links trackers.

# ─────────────────────────────────────────────────────────
# 🧭 Context Boot
# ─────────────────────────────────────────────────────────
context_boot:
  - For each {key}:
      • Inspect **NOOR CANVAS\Workspaces\Copilot\imgreq\{key}\** (if present) for prior runs.
      • Load any existing **Requirements-{key}.MD** to avoid duplicating content and to diff changes.
  - Scan provided image files (PNG/JPG/PDF pages) and any notes/captions.
  - Read `.github/instructions/SelfAwareness.instructions.md` to honor global guardrails.
  - Skim recent commits/chats for this key to understand prior design intent or unresolved questions.

# ─────────────────────────────────────────────────────────
# 💾 Durable State & Checkpoints (kept current)
# ─────────────────────────────────────────────────────────
state_store:
  root: "NOOR CANVAS\\Workspaces\\Copilot\\imgreq\\{key}\\"
  files:
    run_manifest:   "run.json"
    plan_manifest:  "plan.json"               # extraction plan & mapping of markers → requirements
    progress_log:   "progress.log.jsonl"      # step-by-step status + watchdog events
    checkpoint:     "checkpoint.json"         # last completed step id
    artifacts_idx:  "artifacts.json"          # images processed, OCR snippets, deltas
  io: { write_mode: append_minimal, compress: true, atomic_writes: true, debounce_ms: 150 }
  load_policy:
    - Resume from checkpoint if plan_hash matches; else write new plan-v{n}.json and continue safely.
  save_policy:
    - After each phase (ingest, extract, spec, diff/apply) update checkpoint + progress + artifacts.
  retention: { ttl_hours: 24, cleanup_on_approval: true }

# ─────────────────────────────────────────────────────────
# 🎯 Objectives
# ─────────────────────────────────────────────────────────
objectives:
  analyze:
    - Produce a **single Markdown requirements spec** per {key} following the strict output structure below.
    - Ensure each visible/annotated UI element is mapped to a numbered requirement with Given/When/Then.
    - Capture copy verbatim and include accessibility & telemetry expectations.
    - Identify conflicts, ambiguities, and missing details → list under **Open Questions**.
  apply:
    - All from **analyze**, then:
      • Create or update **Requirements-{key}.MD** under the repo (authoritative).
      • Link this spec into design/trackers for discoverability.
      • Emit a lightweight **handoff brief** for `/workitem` with scope highlights and risk notes.
      • Leave imgreq state **up to date** for auditability.

# ─────────────────────────────────────────────────────────
# 🔗 Alignment
# ─────────────────────────────────────────────────────────
alignment:
  - .github/instructions/SelfAwareness.instructions.md
  - Workspaces/Documentation/IMPLEMENTATIONS/NOOR-CANVAS-DESIGN.MD
  - Workspaces/Documentation/IMPLEMENTATIONS/ncImplementationTracker.MD
  - IssueTracker/ncIssueTracker.MD
  - Requirements-{key}.MD (this file will be created/updated in apply mode)
  - D:\PROJECTS\NOOR CANVAS\.github\*.MD
  - Cleanup-<key>.MD (from /cleanup runs, for historical lessons)

# ─────────────────────────────────────────────────────────
# 🧠 Extraction Heuristics (how to “read” annotated screenshots)
# ─────────────────────────────────────────────────────────
heuristics:
  - Arrows: A → B means “Action on A causes change/visibility/state on B.”
  - Numbered labels/badges: Each number maps to a requirement (R1, R2, …).
  - X / ✓ marks: X = remove/hide/replace; ✓ = keep/confirm/success states.
  - Encircled numerals: Required fields, tab order, or step sequences.
  - Explicit notes: “Should be displayed entirely” → enforce no truncation/wrapping rules.
  - Repeated text: Must remain consistent across screens/sections.
  - Counters/badges with numbers: Define empty/min/max/overflow states.
  - Timers/durations: Specify format, cadence, and source of truth.
  - **Heuristic Extension (self-updating)**:
      1) If a new annotation type appears, record it in **Appendix**.
      2) Infer intent and create a requirement.
      3) Add a *New Annotation Rule* with: Marker, Interpretation, Transformation.
      4) Carry the new rule forward (append to this section in future prompt revisions).

# ─────────────────────────────────────────────────────────
# 🛠️ Methods
# ─────────────────────────────────────────────────────────
methods:
  ingest:
    - Enumerate provided images; OCR text where helpful.
    - Normalize annotation markers (arrows, numbers, badges, callouts).
    - Build a raw observations list (filename → bullets).
  extract:
    - Transform observations into numbered **Requirements (R1, R2, …)** with **Given/When/Then**.
    - Define **Navigation & Routing**, **Data & Validation**, **Visual & Layout**, **Accessibility**, **Telemetry**.
    - Record **Open Questions** when evidence is insufficient—don’t guess.
  spec:
    - Produce one Markdown document with the **Strict Output Structure** (see below).
    - Include at least one Gherkin block per requirement.
  diff_apply (mode: apply):
    - If **Requirements-{key}.MD** exists, compute a structured diff and explain deltas.
    - Otherwise create it and link from design/trackers.
    - Emit **Handoff-{key}.MD** under `.github/` summarizing scope & risks for `/workitem`.

# ─────────────────────────────────────────────────────────
# 🐶 Watchdog — Self-Recovery
# ─────────────────────────────────────────────────────────
watchdog:
  idle_seconds_threshold: 120
  graceful_stop_timeout_seconds: 10
  max_retries: 1
  monitored_steps:
    - "ingest"         # large image sets/OCR
    - "extract"        # heavy text generation
    - "diff_apply"     # repo writes/diffing
  behavior:
    - Detect idle:
        • If no new stdout/stderr and no file growth in spec/diff artifacts for `idle_seconds_threshold`, mark as "hung".
    - On hang:
        • Capture last 2000 bytes of logs and a snapshot of partial outputs → save to artifacts.
        • Attempt graceful stop; wait `graceful_stop_timeout_seconds`.
        • If still running → force kill; record a watchdog event to progress_log.jsonl and artifacts_idx.
    - Retry policy:
        • Retry the step idempotently once (never duplicate edits/creates).
        • If still hung: fail fast with status **watchdog_hang** and point to artifacts for triage.

# ─────────────────────────────────────────────────────────
# 🚦 Guardrails
# ─────────────────────────────────────────────────────────
guardrails:
  - Never invent features not evidenced by screenshots or notes; put uncertainties in **Open Questions**.
  - Quote visible UI copy verbatim (preserve casing and punctuation).
  - Acceptance criteria must be testable and unambiguous.
  - Structured diffs only; never overwrite entire files blindly.
  - **Requirements-{key}.MD** is authoritative for this key post-apply.
  - Logs use canonical tag `[DEBUG-WORKITEM:{key}:{layer}]` if any are produced.
  - State must be updated each step under **NOOR CANVAS\Workspaces\Copilot\imgreq\{key}\**; purge via /cleanup approval.

# ─────────────────────────────────────────────────────────
# 🧩 Output Shape
# ─────────────────────────────────────────────────────────
output:
  - state:
      store: "NOOR CANVAS\\Workspaces\\Copilot\\imgreq\\{key}\\"
      run_manifest: "run.json"
      plan_manifest: "plan.json"
      checkpoint:   "checkpoint.json"
      artifacts_idx: "artifacts.json"
  - spec_markdown: a single requirements document (see **Strict Output Structure**)
  - diffs (apply-mode): structured changes to Requirements-{key}.MD + links added in trackers
  - docs_created_or_updated (apply-mode):
      - Requirements-{key}.MD
      - .github/Handoff-{key}.MD
  - evidence: [image filenames, OCR snippets, line refs]
  - watchdog_events: [ { step, first_observed, idle_secs, action_taken, retry, tail_log_path, partial_output_path } ]
  - approval_gate (apply-mode):
      message: "imgreq is ready for {key}. Approve to write/update Requirements-{key}.MD and link trackers."
      on_approval:
        - Apply diffs; leave state resumable
      on_no_approval:
        - Keep repo unchanged; summarize deltas and open questions

# ─────────────────────────────────────────────────────────
# 📝 Self-Review
# ─────────────────────────────────────────────────────────
self_review:
  - Observations faithfully reflect the screenshots (no speculation).
  - Every annotation is mapped to a requirement or an **Open Question**.
  - Requirements include Given/When/Then and reference visible UI text.
  - Accessibility and telemetry are covered explicitly.
  - Spec adheres to the strict output structure.
  - Diffs are minimal and explain rationale.

# ─────────────────────────────────────────────────────────
# 📦 Final Summary
# ─────────────────────────────────────────────────────────
final_summary:
  - What the user asked.
  - What imgreq extracted from the screenshots.
  - The resulting requirements and why they’re correct.
  - Files created/updated and where they live:
      • Requirements-{key}.MD
      • .github/Handoff-{key}.MD
  - Resume info:
      • **State path: NOOR CANVAS\Workspaces\Copilot\imgreq\{key}\**
      • Last completed step: {checkpoint.step_id}

# ─────────────────────────────────────────────────────────
# 📄 Strict Output Structure (the spec you must emit)
# ─────────────────────────────────────────────────────────
spec_structure:
  - "## Summary"
  - "## Scope"
  - "## Requirements (numbered)"
  - "## Navigation & Routing"
  - "## Data & Validation"
  - "## Visual & Layout Notes"
  - "## Accessibility"
  - "## Telemetry"
  - "## Open Questions"
  - "## Non-Functional"
  - "## Appendix: Raw Observations"

# ─────────────────────────────────────────────────────────
# ✍️ Prompt (what the model should do at run time)
# ─────────────────────────────────────────────────────────
prompt:
  - Read all screenshots and notes carefully; list raw observations in **Appendix** (by filename).
  - Use the **Extraction Heuristics** to convert observations to numbered requirements (R1, R2, …).
  - Include at least one Gherkin block per requirement with Given/When/Then.
  - Call out accessibility and telemetry needs explicitly.
  - If you encounter a new annotation style, add a *New Annotation Rule* and use it consistently.
  - Emit one Markdown spec using the **Strict Output Structure**.
  - Do not guess—add uncertainties to **Open Questions** and proceed.
