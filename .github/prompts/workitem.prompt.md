mode: agent
name: workitem
alias: /workitem
alt_aliases: [/fixissue]
description: >
  Unified agent for Noor Canvas tasks. The mode determines behavior:
    • "analyze": architecture/issue review with evidence and an implementation-ready plan.
    • "apply": implement/patch, add standardized debug logging across all layers,
      verify with automated tests, and present an approval gate.
  ALWAYS begin by consulting SelfAwareness.instructions.md and recent context to prevent repeat mistakes
  and to update the Project Ledger (stack, ports, DBs, tokens, testing rules).
  Never declare completion without explicit user approval and concrete evidence.

parameters:
  - name: key
    required: true
    description: >
      Work item or issue memory key (ID or slug). Multiple keys allowed, separated by '---'.
      Each key binds to `workitem-context:<KEY>` and must be processed sequentially with separate outputs.

  - name: mode
    required: true
    description: >
      Execution mode (functional role):
        • "analyze" → Perform systematic review/checklist; no code changes.
        • "apply"   → Make changes, add standardized debug logging, run tests, collect artifacts, update trackers.

  - name: notes
    required: false
    description: >
      Free-form scope: requirements, targets (files/dirs/globs/screenshots), constraints, hypotheses, repro steps.
      Multiple notes may be provided separated by '---'.
      Each note is bound to the same key and mode as the first.

# ─────────────────────────────────────────────────────────
# 📖 Usage Syntax (Cheat Sheet)
# ─────────────────────────────────────────────────────────
# /workitem
#   key:[key-name or key1 --- key2 --- key3]
#   mode:[analyze | apply]
#   notes:[note text or note1 --- note2 --- note3]

# Examples:
# /workitem
#   key:"116"
#   mode:"analyze"
#   notes:"review SessionWaiting behavior --- check DTO casing drift in Host API"
#
# /workitem
#   key:"feat-shared-assets"
#   mode:"apply"
#   notes:"#file:Host-SessionOpener.razor --- implement SharedAssets autodetect --- run headless E2E tests"

# ─────────────────────────────────────────────────────────
# 🧭 Context-First Boot (MANDATORY)
# ─────────────────────────────────────────────────────────
context_boot:
  - Read SelfAwareness.instructions.md and update the Project Ledger snapshot.
  - Skim recent chat/workspace history for this key; avoid previously failed patterns.
  - Confirm environment (ports 9090/9091), DB boundaries (Canvas writable; KSESSIONS_DEV read-only).
  - Record context evidence (file:lines) used for decisions.

# ─────────────────────────────────────────────────────────
# 🎯 Objectives by Mode
# ─────────────────────────────────────────────────────────
objectives:
  analyze:
    - Perform systematic review across View → Route → API → DTO → SQL.
    - Enumerate use cases; build end-to-end traces; validate naming/typing/auth/status codes.
    - Surface mismatches, risks, unknowns; include concrete file:line evidence.
    - For multiple notes, analyze each one sequentially under the same key + mode.
    - Produce an implementation-ready plan with effort sizing and acceptance checks.
  apply:
    - Translate notes into a concrete plan aligned with NOOR-CANVAS-DESIGN phases.
    - Implement with Blazor View Builder discipline; keep DTO/route/SQL alignment explicit.
    - **Add standardized debug logging across layers (UI, API, DB, Infra) to accelerate diagnosis.**
    - Enforce environment safety and UTC time rules; add scoped diagnostics as needed.
    - For multiple notes, implement each sequentially under the same key + mode.
    - Verify with strict headless Playwright (trace/screenshots/video on failure).
    - Update trackers/docs; present approval gate before marking complete.

# ─────────────────────────────────────────────────────────
# 🔗 Alignment Hooks (consult up front)
# ─────────────────────────────────────────────────────────
alignment:
  - NOOR-CANVAS-DESIGN.MD
  - ncImplementationTracker.MD
  - SelfAwareness.instructions.md

# ─────────────────────────────────────────────────────────
# 🛠️ Methods
# ─────────────────────────────────────────────────────────
methods:
  analyze:
    - "Gather Context":
        - Reference design/trackers and recent attempts tied to the key.
        - From notes, interpret each item (split by ---) as a distinct analysis task.
    - "Enumerate Use Cases":
        - List visible/conditional actions; map expected routes/APIs.
    - "Trace Map":
        - Build View → Route → API/Action → DTO In/Out → SQL; note missing links as “—”.
    - "Validation Matrix":
        - DTO casing, names & types; nullable fidelity; auth/validate attributes; status codes vs UI.
    - "Mismatches & Risks":
        - Concurrency (Blazor/SignalR), timers/time-source, environment gaps, error boundaries.
    - "Plan (Deferred)":
        - Sequenced remediation with acceptance checks and effort sizing; request approval to proceed.

  apply:
    - "Plan & Scaffold":
        - Restate acceptance criteria from notes (split by --- into distinct sub-tasks).
        - Map requirement to affected View→Route→API→DTO→SQL for the key.

    - "Implementation with Standardized Debug Logging":
        - Insert concise, meaningful logs that follow ONE format everywhere to enable fast grep/remove:
            # Standard tag: [DEBUG-WORKITEM:{key}:{layer}]
            # Layers: UI | API | DB | INFRA
            # Examples:
            #   UI (Razor/Blazor):    console.debug("[DEBUG-WORKITEM:{key}:UI] {context} {value}")
            #   API (C#):             logger.LogDebug("[DEBUG-WORKITEM:{key}:API] {Context} {@Payload}")
            #   DB (T-SQL):           PRINT '[DEBUG-WORKITEM:{key}:DB] {Context} {Id}';
            #   Infra (PS/Bash):      Write-Host "[DEBUG-WORKITEM:{key}:INFRA] {Step} {Status}"
        - Scope:
            - Add at entry/exit of critical flows, around async transitions, and before/after external calls.
            - Include correlation IDs or key parameters (redact secrets).
            - Keep messages short; prefer structured values over prose.
        - Hygiene:
            - Centralize any helper macros if available.
            - Keep all logs easily discoverable via the tag; no ad-hoc prefixes.
            - Document where logs were added (file:line) in the output manifest.

    - "Verify":
        - Start/confirm app health (9090/9091); run headless Playwright (/pwtest with ui_mode=headless).
        - Assert that debug logs appear in execution output where expected.
        - Attach HTML/JSON reports, trace, screenshots, video on failure.

    - "Handoff":
        - Update ncImplementationTracker.MD with:
            - Files changed and rationale
            - Where debug logs were added (file:line), and removal guidance
            - Evidence artifacts and outcomes
        - Present approval gate; do not mark resolved without explicit user confirmation.

# ─────────────────────────────────────────────────────────
# 🧱 Structured Debug Logging (shared with cleanup)
# ─────────────────────────────────────────────────────────
debug_logging:
  tag_format: "[DEBUG-WORKITEM:{key}:{layer}]"
  layers: [UI, API, DB, INFRA]
  placement:
    - Entry/exit of critical flows
    - Before/after async transitions and network/DB calls
    - Around deserialization/DTO mapping and auth/validation
  content_guidelines:
    - Short, structured messages; redact secrets/tokens
    - Include correlation IDs or key parameters where helpful
  discoverability:
    - Single canonical prefix (no variants)
    - Greppable: `\\[DEBUG-WORKITEM:{key}:`
  cleanup_hint:
    - Use /cleanup prompt to strip all matching lines safely
    - Keep a manifest of inserted logs for audit and removal

# ─────────────────────────────────────────────────────────
# 🚦 Guardrails (Unified)
# ─────────────────────────────────────────────────────────
guardrails:
  - Always tie findings, evidence, and outputs back to the active key.
  - Multiple keys ("---") must be processed in order; produce separate outputs per key.
  - Multiple notes ("---") must be processed sequentially under the same key + mode.
  - [approval] Never mark resolved without explicit user approval.
  - [history] Treat each run as continuation for its key; summarize prior attempts & contradictions.
  - [readiness] Verify app is healthy before UI/E2E tests.
  - [logging] Scoped "COPILOT-DEBUG:" logs for narrative plus standardized tag logs for grep/removal.
  - [debug-tag] All temporary debug logs MUST use `[DEBUG-WORKITEM:{key}:{layer}]` exactly.
  - [dto-casing] JSON camelCase ↔ C# PascalCase alignment explicit at each layer.
  - [time] No hard-coded dates; prefer server/DB UTC; document TZ/DST handling.
  - [env] KSESSIONS_DEV read-only; never prod; log branch/env.
  - [duplication] Scan for near-duplicates before adding helpers.
  - [concurrency] Validate async flows; SignalR initialization: Connect → Load State → Join Groups.
  - [evidence] Provide before/after logs, screenshots, test results tied to memory_key.
  - [ui-standards] Preserve NOOR Canvas design (Inter, #3B82F6/#8B5CF6, rounded corners, RTL).
  - [playwright] Headless only; artifacts on failure.

# ─────────────────────────────────────────────────────────
# 🧪 Playwright Contracts
# ─────────────────────────────────────────────────────────
playwright:
  mode_default: headless
  reporters: [html, json, line]
  artifacts: [trace on retry, screenshots on failure, video on failure]
  helpers:
    fillBlazorInput: |
      async function fillBlazorInput(page, selector, value) {
        const input = page.locator(selector);
        await input.clear();
        await input.fill(value);
        await input.dispatchEvent('input');
        await input.dispatchEvent('change');
        await page.waitForTimeout(2000);
      }
    clickEnabledButton: |
      async function clickEnabledButton(page, selector, timeout = 10000) {
        const button = page.locator(selector);
        await expect(button).toBeEnabled({ timeout });
        await button.click();
      }

# ─────────────────────────────────────────────────────────
# 🧩 Output Shape
# ─────────────────────────────────────────────────────────
output:
  - memory_key: workitem-context:<KEY>
  - plan: step-by-step actions or review sequence
  - evidence: file:line refs, logs, screenshots, test reports
  - findings: (analyze) executive summary, narrative, trace table, validation matrix, gaps, risks
  - implementation: (apply) diffs/commands, build output, artifacts
  - debug_logging_manifest:
      - files_with_logs: [path:line...]
      - layers: [UI | API | DB | INFRA]
      - removal_hint: >
          Remove by grepping the tag: \[DEBUG-WORKITEM:{key}:
  - docs: tracker/doc updates with key references
  - approval_gate:
      message: >
        Work for {memory_key} is complete in mode:{mode}. Review evidence and approve to mark resolved.
      on_approval:
        - Mark key RESOLVED with resolution notes.
      on_no_approval:
        - Keep status unchanged; summarize deltas and next checks.

# ─────────────────────────────────────────────────────────
# 📝 Self-Review Footer
# ─────────────────────────────────────────────────────────
self_review:
  - Confirmed SelfAwareness.instructions.md consulted and Project Ledger updated.
  - Avoided previously failed patterns for this key; documented changes.
  - Captured explicit evidence; flagged any mock data usage; listed next-step recommendations.
  - Verified that multiple notes were processed sequentially under the same key + mode.
  - **Confirmed all temporary debug logs use the standardized tag and are documented for cleanup.**

# ─────────────────────────────────────────────────────────
# 📦 Final Summary (to always show at end)
# ─────────────────────────────────────────────────────────
final_summary:
  - Restate clearly what the user asked for (scope, key(s), mode, notes).
  - Summarize what was done in response (analysis steps, fixes applied, tests run).
  - Provide a compact manifest of changes:
      • files touched or reviewed
      • actions taken
      • key outcomes
      • where debug logs were inserted (tagged for easy cleanup)
  - Format must be eloquent but concise — a neat executive recap.
