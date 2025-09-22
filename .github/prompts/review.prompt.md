---
mode: agent
name: analyze
alias: /analyze
description: >
  Perform a systematic architecture review of specified Noor Canvas artifacts (Razor views, controllers,
  routes, DTOs, SQL, and supporting assets). Enumerate use cases, trace end-to-end flows, validate
  naming/typing consistency (e.g., DTO casing), surface risks, and propose an implementation plan.
  Do NOT change code. This review must align with NOOR-CANVAS-DESIGN.MD, ncImplementationTracker.MD,
  and INFRASTRUCTURE-FIXES-REPORT.md to prevent repeat mistakes.

parameters:
  - name: targets
    required: true
    description: >
      Comma- or newline-separated list of artifacts to examine (files, directories, globs, or screenshots).
      Supports #file: syntax and glob-like patterns.
      Examples:
        #file:UserLanding.razor
        #file:SessionWaiting.razor
        /src/Server/Controllers
        /src/Database
        screenshots/landing/*.png
  - name: notes
    required: false
    description: >
      Optional free-text notes to emphasize concerns or hypotheses during the review.
      Examples:
        "Focus on async lifecycle methods; suspect race conditions."
        "Check DTOs are camelCase vs PascalCase consistently; we had bugs before."
        "Confirm routes match controller signatures; 400s seen in logs."

# ──────────────────────────────────────────────────────────────────────────────
# 📖 Usage Examples
# ──────────────────────────────────────────────────────────────────────────────
# /analyze targets:"#file:UserLanding.razor, /src/Server/Controllers" notes:"DTO casing drift between API and UI"
# /analyze targets:"/src/Database, #file:Host-SessionOpener.razor" notes:"trace sessionId→GroupId→CategoryId mapping"
# /analyze targets:"screenshots/landing/*.png, /src/Server" notes:"route mismatches; verify auth/validate attributes"
# ──────────────────────────────────────────────────────────────────────────────

# 🎯 Objective
# Provide a pre-implementation review that captures current behavior, gaps, and risks across:
#   View → Route → API → DTO → SQL
# so that implementation can proceed with minimal rework and zero surprise regressions.

# ✅ Deliverables (in order; do not omit)
deliverables:
  - Executive Summary:
      bullets: 5-10
      content: >
        What was reviewed, key use cases discovered, top risks, highest-impact recommendations,
        and explicit alignment notes with NOOR-CANVAS-DESIGN.MD and ncImplementationTracker.MD.
  - Plain-English Narrative:
      paragraphs: 2-4
      content: >
        Coherent story of findings (flows, constraints, implications), including how patterns align
        or drift from the design architecture; specific improvement recommendations.
  - TODO: Use Case Inventory:
      format: checklist
      content: >
        Every distinct user flow (links/buttons/forms/conditions) with a one-line intent and source file refs.
  - End-to-End Trace Table:
      columns: [Use Case, View/File:Line, Route, API/Action, DTO In/Out, SQL/Proc, Notes]
      content: >
        At least one trace per use case; include missing links as "—" with explanation.
  - Validation Matrix:
      checks:
        - DTO naming consistency (camelCase vs PascalCase)
        - Nullable/typing fidelity across layers
        - Auth/Authorize/Validate attributes vs actual requirements
        - Error-handling & status codes vs UI expectations
  - Mismatches & Gaps:
      content: >
        Broken routes, parameter name drift, DTO shape mismatches, missing mapping logic, ambiguous time sources.
  - Risks & Unknowns:
      content: >
        Unverified assumptions, hidden dependencies (SignalR, timers), environment differences (dev vs prod).
  - Implementation Plan (Deferred):
      content: >
        Sequenced steps to remediate, with effort sizing (S/M/L), owner hints, and dependency order.
  - Approval Gate:
      content: "Awaiting approval to implement."

# 🧭 Method (do this in order)
method:
  - Gather Context:
      steps:
        - Read NOOR-CANVAS-DESIGN.MD for architecture/phase constraints.
        - Read ncImplementationTracker.MD for prior patterns, time estimates, and lessons learned.
        - (If applicable) skim INFRASTRUCTURE-FIXES-REPORT.md for Playwright-related reliability constraints.
        - Inventory relevant code: Razor, Controllers, DTOs/Models, EF/SQL/stored procedures, route maps.
  - Enumerate Use Cases:
      steps:
        - From each View/Component, list visible/conditional actions (buttons, links, forms).
        - Note guards (disabled conditions, auth checks, validation attributes).
        - Map expected navigation or API calls implied by the UI.
  - Build the Flow Map:
      steps:
        - Trace each use case: View → Route → API/Action → DTO In/Out → SQL/Proc.
        - Record parameter names and types at each layer; flag differences.
        - Identify required preconditions (tokens, sessionId, group/category).
  - Validate Consistency:
      steps:
        - Casing and naming: DTOs, JSON payloads, and binding properties must align.
        - Status codes vs UI: confirm expected 2xx/4xx/5xx per scenario and UI messaging.
        - Auth/Authorize: controller attributes vs routes used by the UI.
  - Identify Risks:
      steps:
        - Concurrency in Blazor Server (InvokeAsync, StateHasChanged usage).
        - Timer/date logic source-of-truth (no hard-coded dates; UTC alignment).
        - SignalR hub event expectations vs actual handlers.
        - Error boundary coverage and user-visible messaging.
  - Propose Plan:
      steps:
        - Present a pragmatic, minimal-change plan with phases, estimates, and acceptance checks.
        - Explicitly defer code edits until approval is given.

# 🚦 Regression Guards (baked into the review; call out violations explicitly)
regression_guards:
  - [time]:
      rules:
        - Disallow stale date constants in any timer/expiry logic.
        - Enforce a single source of truth for "now" (prefer server/DB UTC) and document timezone/DST handling.
  - [env]:
      rules:
        - Verify environment-specific configs (KSESSIONS_DEV vs Canvas), never prod DB usage in dev flows.
        - Document required env vars/secrets and their presence.
  - [dto-casing]:
      rules:
        - Confirm camelCase JSON payloads vs PascalCase C# DTOs; specify exact binding expectations per layer.
  - [routes]:
      rules:
        - Ensure @page routes match controller/action parameter names and types; list divergences with file:line.
  - [playwright-alignment]:
      rules:
        - Surface UI behaviors dependent on Blazor @bind-Value event dispatch (for test generation later).
        - Call out buttons which require enabled-state verification pre-click.
  - [concurrency]:
      rules:
        - Identify async flows requiring InvokeAsync in Blazor; note any duplicate-submit guards missing.
  - [evidence]:
      rules:
        - Reference concrete files/lines for each claim; include minimal snippets only when necessary.

# ─────────────────────────────────────────────────────────
# 🔄 RETROSPECTIVE INTEGRATION (Sept 22, 2025)
# ─────────────────────────────────────────────────────────
context_first_protocol:
  - title: "Read Self-Awareness Instructions First"  
    details: |
      • ALWAYS read .github/instructions/SelfAwareness.instructions.md before analysis
      • Review recent conversation history for architectural context and decisions
      • Check ncImplementationTracker.MD for patterns, lessons learned, and pitfalls
      • Maintain awareness of current technical state and active development

analysis_efficiency_patterns:
  - title: "Systematic Architecture Review"
    details: |
      • Analyze artifacts in logical layers: View → Route → API → DTO → SQL
      • Use incremental validation with checkpoint reviews at each layer
      • Apply robust pattern recognition for common architectural issues
      • Document technical decision reasoning with clear evidence trails

  - title: "Evidence-Based Assessment"
    details: |
      • Reference concrete files and line numbers for each architectural claim
      • Validate consistency across layers with measurable criteria
      • Include both positive patterns and anti-patterns discovered
      • Provide actionable recommendations with effort estimates

progressive_refinement:
  - title: "Iterative Review Process"
    details: |
      • Acknowledge when initial analysis reveals complexity requiring deeper review
      • Use progressive refinement vs. claiming comprehensive coverage upfront
      • Maintain debugging context for architectural decisions and trade-offs
      • Focus on high-impact findings vs. exhaustive enumeration

# 🔗 Alignment Hooks (must reference in the report)
alignment:
  - "NOOR-CANVAS-DESIGN.MD — authoritative architecture & phases"
  - "ncImplementationTracker.MD — implementation history & lessons"
  - "INFRASTRUCTURE-FIXES-REPORT.md — testing stability patterns (if tests are discussed)"

# 🧪 Output Shape (exact order)
output:
  - plan: >
      Short list of what was reviewed and in what sequence (files/dirs/globs).
  - evidence:
      include:
        - file_and_line_references: true
        - minimal_snippets: only when necessary to show mismatch
  - findings:
      include: [executive_summary, narrative, use_case_inventory, trace_table, validation_matrix, gaps, risks]
  - proposal:
      include: [implementation_plan_deferred, acceptance_checks]
  - approval_gate:
      message: "Awaiting approval to implement."

# 📝 Notes for the Reviewer (internal rubric; include in final if helpful)
notes_for_reviewer:
  - Prefer specificity over volume: every flagged issue must point to a file:line.
  - If an assumption is made (e.g., route param comes from token), label it clearly as an assumption.
  - If you cannot trace a link (e.g., View→API), add it to Mismatches & Gaps with a hypothesis.
  - Keep a strict separation between review (this prompt) and any code change (implement prompt).
