---
mode: agent
name: implement
alias: /implement
description: >
  Implement new Noor Canvas requirements using proven Blazor Server, ASP.NET Core, EF Core, and SignalR patterns.
  Enforce View→Route→API→DTO→SQL integrity, respect KSESSIONS_DEV (read-only) vs Canvas (writable),
  and verify changes with automated tests. Align with NOOR-CANVAS-DESIGN, ncImplementationTracker,
  INFRASTRUCTURE-FIXES-REPORT, PLAYWRIGHT-EXECUTION-GUARDRAILS, and PORT-BINDING-SOLUTION.
  E2E must be executed in strict headless mode (no UI) via gentest + runtest contracts.

parameters:
  - name: requirement
    required: true
    description: >
      The user’s requested feature or fix in plain English.
      Example: "Add participant list with real-time updates to SessionWaiting.razor"
  - name: targets
    required: false
    description: >
      Optional seeded scope to examine (#file:, folders, globs) to accelerate mapping.
      Example: "#file:SessionWaiting.razor, /src/Server/Controllers, /src/Database"
  - name: notes
    required: false
    description: >
      Constraints or context: performance goals, negative paths, security, or test hints
      (e.g., "sessionId:212", "token:VNBPRVII", "negative-testing").

# ─────────────────────────────────────────────────────────
# 📖 Usage Examples
# ─────────────────────────────────────────────────────────
# /implement requirement:"Enhance HostControlPanel to auto-detect SharedAssets and share to clients"
# /implement requirement:"Trace sessionId→albumId→categoryId on Host-SessionOpener save" targets:"#file:Host-SessionOpener.razor,/src/Server/Controllers"
# /implement requirement:"Fix dropdown cascade timing; ensure SetCascadingDefaultValuesAsync is awaited" notes:"performance, negative-testing"

# ─────────────────────────────────────────────────────────
# 🎯 Objectives
# ─────────────────────────────────────────────────────────
# • Translate requirement into a concrete plan aligned with NOOR-CANVAS-DESIGN phases.
# • Implement with Blazor View Builder discipline (clean rebuild over risky incremental edits).
# • Preserve data boundaries (Canvas writable; KSESSIONS_DEV read-only).
# • Validate end-to-end with headless Playwright: generate tests using /gentest; run via /runtest.
# • Update trackers/docs; request explicit approval to finalize.

# ─────────────────────────────────────────────────────────
# 🔗 Alignment Hooks (must be consulted up front)
# ─────────────────────────────────────────────────────────
alignment:
  - "NOOR-CANVAS-DESIGN.MD — architecture, phases, UX/branding, RTL"
  - "ncImplementationTracker.MD — patterns, milestones, lessons, ports/tokens"
  - "INFRASTRUCTURE-FIXES-REPORT.md — test stability, binding, artifacts"
  - "PLAYWRIGHT-EXECUTION-GUARDRAILS.md — pre-flight, health checks, CI expectations"
  - "PORT-BINDING-SOLUTION.md — nc-cleanup, dynamic ports, launch settings"
  - "copilot_instructions.md — self-learning and approval discipline"

# ─────────────────────────────────────────────────────────
# 🧭 Implementation Flow (do these in order)
# ─────────────────────────────────────────────────────────
steps:
  - title: Requirement Triage & Scope
    details: |
      • Restate requirement; list acceptance criteria.
      • Map impacted layers: View, Route, Controller/API, DTO, SQL, SignalR, Config.
      • If targets provided, inventory files; link acceptance criteria to artifacts.

  - title: Architecture Verification
    details: |
      • Check NOOR-CANVAS-DESIGN for relevant phase & UX/RTL rules.
      • Confirm patterns in ncImplementationTracker (e.g., SharedAssets selector system, tokens).
      • Note deviations requiring design confirmation before coding.

  - title: Data Contracts & Routing Map
    details: |
      • Map View→Route→API→DTO→SQL for each criterion.
      • Ensure param names/types match across layers (JSON camelCase ↔ C# PascalCase).
      • Add/adjust DTOs and model binding to eliminate casing drift.

  - title: Blazor View Builder (UI Layer)
    details: |
      • Prefer clean reconstruction with clear regions (Header/Inputs/Actions/Lists/State/Footer).
      • Bind via @bind-Value; validation attributes mirror server rules.
      • Respect RTL/branding; ensure a11y roles and tab order.
      • Wrap async state changes in InvokeAsync(StateHasChanged) for Blazor Server safety.

  - title: API/Controller & Service Layer
    details: |
      • Add/adjust endpoints; use [Authorize] and validation as needed.
      • Services DI-friendly, cancellation-aware; log with correlationId.
      • Return precise 4xx for validation errors (UI can assert).

  - title: Database & Query Layer
    details: |
      • EF Core for Canvas writes; Dapper/EF for reads; parameterize queries.
      • KSESSIONS_DEV is read-only; migrations/indices only for Canvas schema.

  - title: Token & Auth Integration
    details: |
      • Use 8-char SecureTokens; never hardcode secrets.
      • Validate via existing service endpoints; redact tokens in logs.

  - title: SignalR & Real-time
    details: |
      • Subscribe to SessionHub/AnnotationHub/QAHub (“Session_{sessionId}”).
      • Ensure idempotent handlers and duplicate-submit guards; use InvokeAsync for UI updates.

  - title: Error Handling & UX States
    details: |
      • Distinguish validation vs system errors; surface friendly messages.
      • Enforce disabled/enabled logic coherence; no ghost clicks.

  - title: Performance & Readiness
    details: |
      • Add micro-benchmarks if perf-sensitive; measure DB latency/call counts.
      • Confirm readiness (title, key selectors) after launch.

  - title: Testing & Verification (Headless-Only Contracts)
    details: |
      • Generate tests with /gentest (the generator injects test.use({ headless: true }) and Blazor helpers).
      • Execute with /runtest which enforces:
          - No UI flags: CI=1, PWDEBUG=0, PWTEST_HEADED=0, PLAYWRIGHT_HEADLESS=1
          - Single worker, trace-on-retry, screenshots/video on failure, HTML+JSON reports
          - Pre-flight infra checks: app pre-running via nc-cleanup;nc, health/title verified, ports validated
      • Include ≥1 negative path. Attach artifacts to evidence.

  - title: Documentation & Tracker Sync
    details: |
      • Update ncImplementationTracker with changes and references.
      • Update docs in Workspaces/Documentation if standards changed.
      • Do NOT mark issues resolved without explicit user approval.

  - title: Handoff & Approval
    details: |
      • Present acceptance checklist + evidence (build logs, screenshots, report links).
      • Ask for explicit approval to merge/resolve.

# ─────────────────────────────────────────────────────────
# 🛡️ Regression Guards
# ─────────────────────────────────────────────────────────
guardrails:
  - [blazor] Use View Builder; wrap async UI updates in InvokeAsync.
  - [dto-casing] JSON camelCase ↔ C# PascalCase alignment must be explicit.
  - [routes] @page params must match controller action names/types.
  - [time] No hard-coded dates; derive “now” from server/DB UTC with TZ/DST notes.
  - [db] KSESSIONS_DEV read-only; writes only via Canvas schema.
  - [tokens] 8-char SecureTokens; validate via service; never log raw values.
  - [signalr] Idempotent handlers; duplicate-submit guards.
  - [playwright-headless] E2E must use gentest + runtest; forbid —ui/—headed; enforce headless.
  - [infra] Honor PLAYWRIGHT-EXECUTION-GUARDRAILS and PORT-BINDING-SOLUTION (nc-cleanup; nc; dynamic ports).
  - [security] No secrets in logs; use IConfiguration/IOptions.
  - [duplication] Search for near-duplicates before adding helpers; extract shared code.

# ─────────────────────────────────────────────────────────
# ✅ Quality Checklist (emit in output)
# ─────────────────────────────────────────────────────────
quality_checklist:
  - "[ ] Acceptance criteria mapped to artifacts"
  - "[ ] NOOR-CANVAS-DESIGN & ncImplementationTracker consulted"
  - "[ ] DTO/route/SQL mappings aligned (names/casing/types)"
  - "[ ] Blazor UI rebuilt or cleanly patched; a11y & RTL verified"
  - "[ ] Controller/service validators & error handling present"
  - "[ ] Canvas writes only; KSESSIONS_DEV reads respected"
  - "[ ] SignalR handlers idempotent; InvokeAsync used"
  - "[ ] E2E generated with /gentest, executed with /runtest (headless-only) + artifacts attached"
  - "[ ] Docs updated; explicit approval requested"

# ─────────────────────────────────────────────────────────
# 📤 Output
# ─────────────────────────────────────────────────────────
output:
  - plan: phased steps with owners/time estimates (S/M/L)
  - changes: files with line refs; diffs or code blocks
  - tests: unit/integration/E2E results + artifact paths
  - evidence: screenshots, logs, build output, health checks
  - docs: updates to ncImplementationTracker & docs
  - approval_gate: explicit approval request to finalize
