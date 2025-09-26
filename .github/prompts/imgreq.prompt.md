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
  Includes a watchdog for long runs, durable state, and per-key Context Indexing for efficiency.

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
        • analyze → Generate the requirements spec only (no file updates).
        • apply   → Generate the spec and integrate it into the repo docs/trackers, ready for /workitem.

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
    - If any verification step requires the app, **always** start/refresh using the build+run script:
        • .\Workspaces\Global\ncb.ps1     # builds and launches; REQUIRED (do not use dotnet run / nc.ps1)
    - Place input screenshots (PNG/JPG/PDF pages) in an accessible path.

  run_examples:
    - Spec only:
        • /imgreq key:NC-102 mode:analyze notes:"web only --- enforce aria-live for toasts"
    - Spec + write Requirements + link trackers:
        • /imgreq key:NC-102 mode:apply notes:"desktop+mobile --- ignore backend changes"
    - Multiple keys:
        • /imgreq key:"NC-200---NC-201" mode:apply
    - Handoff:
        • /workitem key:NC-102 mode:apply test:true

  outputs:
    - analyze: Markdown spec only (returned in-chat and in state artifacts).
    - apply: Creates/updates Requirements-{key}.MD, adds .github/Handoff-{key}.MD, and links trackers.

# ─────────────────────────────────────────────────────────
# 🧭 Context Boot
# ─────────────────────────────────────────────────────────
context_boot:
  - For each {key}:
      • Inspect **NOOR CANVAS\Workspaces\Copilot\imgreq\{key}\** (if present) for prior runs.
      • Load any existing **Requirements-{key}.MD** to avoid duplication and to diff changes.
  - context_index:
      discover:
        - Look for `NOOR CANVAS\Workspaces\Copilot\{key}\index\context.idx.json`.
        - If present → load manifest and prefer `context.pack.jsonl` for planning.
        - If absent or stale → build/delta-build per SelfAwareness Context Indexing rules.
      prefer_for_planning: true
      record_delta:
        - After run, write `context.delta.json` and update `context.sources.json`.
  - Scan provided images (PNG/JPG/PDF) and any notes/captions.
  - Read `.github/instructions/SelfAwareness.instructions.md` to honor global guardrails.
  - Skim recent commits/chats for this key to understand design intent/unresolved questions.

# ─────────────────────────────────────────────────────────
# 💾 Durable State & Checkpoints (kept current)
# ─────────────────────────────────────────────────────────
state_store:
  root: "NOOR CANVAS\\Workspaces\\Copilot\\imgreq\\{key}\\"
  files:
    run_manifest:   "run.json"
    plan_manifest:  "plan.json"
    progress_log:   "progress.log.jsonl"
    checkpoint:     "checkpoint.json"
    artifacts_idx:  "artifacts.json"
  includes_index:
    path: "NOOR CANVAS\\Workspaces\\Copilot\\{key}\\index\\"
    files: [ "context.idx.json", "context.pack.jsonl", "context.delta.json", "context.sources.json" ]
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
    - Produce a **single Markdown requirements spec** per {key} using the strict structure.
    - Map every annotated UI element to a numbered requirement with Given/When/Then.
    - Capture copy verbatim; include accessibility & telemetry expectations.
    - List conflicts/ambiguities as **Open Questions**.
    - When UI annotations imply payload fields, add a **Contract Requirements** subsection naming required DTO fields.
  apply:
    - All from **analyze**, then:
      • Create or update **Requirements-{key}.MD** (authoritative).
      • Link spec into design/trackers for discoverability.
      • Emit `.github/Handoff-{key}.MD` for `/workitem`.
      • Leave imgreq state **up to date**.

# ─────────────────────────────────────────────────────────
# 🔗 Alignment
# ─────────────────────────────────────────────────────────
alignment:
  - .github/instructions/SelfAwareness.instructions.md
  - Workspaces/Documentation/IMPLEMENTATIONS/NOOR-CANVAS-DESIGN.MD
  - Workspaces/Documentation/IMPLEMENTATIONS/ncImplementationTracker.MD
  - IssueTracker/ncIssueTracker.MD
  - Requirements-{key}.MD
  - D:\PROJECTS\NOOR CANVAS\.github\*.MD
  - Cleanup-<key>.MD

# ─────────────────────────────────────────────────────────
# 🧠 Extraction Heuristics
# ─────────────────────────────────────────────────────────
heuristics:
  - Arrows: A → B means “Action on A causes change/visibility/state on B.”
  - Numbered labels/badges: Each number maps to a requirement (R1, R2, …).
  - X / ✓ marks: X = remove/hide/replace; ✓ = keep/confirm/success states.
  - Encircled numerals: Required fields, tab order, or step sequences.
  - Explicit notes: “Should be displayed entirely” → enforce no truncation/wrapping rules.
  - Repeated text: Must remain consistent across screens.
  - Counters/badges with numbers: Define empty/min/max/overflow states.
  - Timers/durations: Specify format, cadence, and source of truth.
  - **Heuristic Extension**: when encountering new annotation types, define a *New Annotation Rule* (Marker, Interpretation, Transformation) and carry it forward.

# ─────────────────────────────────────────────────────────
# 🛠️ Methods
# ─────────────────────────────────────────────────────────
methods:
  ingest:
    - Enumerate images; OCR text where helpful.
    - Normalize annotation markers.
    - Build raw observations per filename.
  extract:
    - Transform observations into numbered **Requirements (R1, R2, …)** with **Given/When/Then**.
    - Define **Navigation & Routing**, **Data & Validation**, **Visual & Layout**, **Accessibility**, **Telemetry**.
    - Record **Open Questions** when evidence is insufficient—don’t guess.
  spec:
    - Produce one Markdown document with the **Strict Output Structure** (see below).
  diff_apply (mode: apply):
    - If **Requirements-{key}.MD** exists, compute a structured diff and explain deltas.
    - Otherwise create it and link from design/trackers.
    - Emit **.github/Handoff-{key}.MD** for `/workitem`.

# ─────────────────────────────────────────────────────────
# 🐶 Watchdog — Self-Recovery
# ─────────────────────────────────────────────────────────
watchdog:
  idle_seconds_threshold: 120
  graceful_stop_timeout_seconds: 10
  max_retries: 1
  monitored_steps: [ "ingest", "extract", "diff_apply" ]
  behavior:
    - Detect idle → capture last logs + partial outputs; graceful stop → force kill if needed; record event.
    - Retry idempotently once; else fail with status **watchdog_hang** and pointers to artifacts.

# ─────────────────────────────────────────────────────────
# 🚦 Guardrails
# ─────────────────────────────────────────────────────────
guardrails:
  - Never invent features not evidenced by screenshots/notes; uncertainties go to **Open Questions**.
  - Quote visible UI copy verbatim.
  - Acceptance criteria must be testable and unambiguous.
  - Structured diffs only.
  - **Requirements-{key}.MD** is authoritative post-apply.
  - Keep state & index current; purge via `/cleanup`.
  - **Execution**: if the app must run for verification, **must use** `.\\Workspaces\\Global\\ncb.ps1`; never `dotnet run`; never prefer `nc.ps1`.

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
  - spec_markdown: single requirements document (strict structure)
  - diffs (apply): structured changes to Requirements-{key}.MD + tracker links
  - docs_created_or_updated (apply): [ Requirements-{key}.MD, .github/Handoff-{key}.MD ]
  - evidence: [image filenames, OCR snippets]
  - watchdog_events: [ { step, idle_secs, action_taken, retry } ]
  - approval_gate (apply):
      message: "imgreq is ready for {key}. Approve to write/update Requirements-{key}.MD and link trackers."
      on_approval: Apply diffs; leave state resumable
      on_no_approval: Keep repo unchanged; summarize deltas & open questions

# ─────────────────────────────────────────────────────────
# 📝 Self-Review
# ─────────────────────────────────────────────────────────
self_review:
  - Observations faithfully reflect the screenshots (no speculation).
  - Every annotation maps to a requirement or an **Open Question**.
  - Requirements include Given/When/Then and reference visible UI text.
  - Accessibility and telemetry are explicit.
  - Spec adheres to strict structure.
  - Index delta written; state updated.

# ─────────────────────────────────────────────────────────
# 📦 Final Summary
# ─────────────────────────────────────────────────────────
final_summary:
  - What was asked and extracted.
  - Why the requirements are correct.
  - Files created/updated:
      • Requirements-{key}.MD
      • .github/Handoff-{key}.MD
  - Resume info:
      • **State path: NOOR CANVAS\Workspaces\Copilot\imgreq\{key}\**
      • Last completed step: {checkpoint.step_id}

# ─────────────────────────────────────────────────────────
# 📄 Strict Output Structure
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
