---
mode: agent
name: implement
alias: /implement
description: >
  Implement new Noor Canvas requirements using proven Blazor, EF Core, and SignalR patterns.
  Always align with NOOR-CANVAS-DESIGN, ncImplementationTracker, and Infra Fixes.
  Strictly follow Blazor View Builder strategy, ensure zero-compilation errors,
  validate runtime success, and track updates in implementation docs.

parameters:
  - name: requirement
    required: true
    description: >
      Detailed implementation request. Example:
      "Add participant list with real-time updates to SessionWaiting.razor"
  - name: notes
    required: false
    description: Optional context (edge cases, performance hints, related issues).

# ──────────────────────────────
# 📖 Usage Examples
# ──────────────────────────────
# /implement requirement:"Enhance HostControlPanel.razor to auto-load SharedAssets"
# /implement requirement:"Trace sessionId back to albumId and categoryId in Host-SessionOpener"
# /implement requirement:"Fix dropdown cascade timing with SetCascadingDefaultValuesAsync" notes:"performance"

# ──────────────────────────────
# 🎯 Mission
# ──────────────────────────────
# • Parse requirement → break down into tasks.
# • Confirm architectural alignment with NOOR-CANVAS-DESIGN.
# • Cross-reference ncImplementationTracker for patterns & timing.
# • Apply Blazor View Builder protocol for Razor files (delete & replace with mock).
# • Implement database & token integration respecting read-only vs writable boundaries.
# • Ensure build + runtime success, update docs, and prepare Playwright verification.

# ──────────────────────────────
# 🧭 Implementation Flow
# ──────────────────────────────
steps:
  - title: Requirement Analysis
    details: |
      Parse requirement → scope UI/API/DB impact.
      Classify complexity: Simple (≤2h), Moderate (3–4h), Complex (5h+).
      Map dependencies: affected files, DB tables, API endpoints.

  - title: Architecture Verification
    details: |
      Check NOOR-CANVAS-DESIGN for current phase & constraints.
      Verify similar cases in ncImplementationTracker.
      Cross-check related issues in ncIssueTracker.
      Confirm real-time hub impact (SessionHub, AnnotationHub, QAHub).

  - title: Protocol Selection
    details: |
      • Razor → Blazor View Builder strategy (delete/replace, inline CSS, logo integration).
      • Database → EF Core patterns, KSESSIONS (read-only) vs Canvas (writable).
      • Token → SecureTokens chain, validation endpoints, 8-char system.
      • SignalR → integrate hub events & InvokeAsync for thread safety.

  - title: Implementation
    details: |
      Apply selected patterns. For Razor: complete rebuild from HTML mock, bind inputs,
      inject services, connect APIs, and validate with inline CSS.
      For DB/API: add endpoints, queries, error handling, token validation.
      For real-time: subscribe hubs, update UI with InvokeAsync-wrapped StateHasChanged().

  - title: Validation
    details: |
      • Build with dotnet (0 errors/warnings).
      • Launch app → verify new flow end-to-end.
      • Match visuals 100% to mocks.
      • Run Playwright test (via /gentest + /runtest) for automation proof.
      • Add negative paths and performance validation if notes require.

  - title: Documentation Sync
    details: |
      Update ncImplementationTracker with new implementation details.
      Note time taken vs estimated.
      Flag related issues in ncIssueTracker.
      Ensure consistency with NOOR-CANVAS-DESIGN phase notes.

# ──────────────────────────────
# 🛡️ Regression Guards
# ──────────────────────────────
guardrails:
  - [blazor] Always follow Blazor View Builder strategy; never partial Razor edits.
  - [tokens] 8-char SecureTokens only; validate via endpoints; never hardcode.
  - [db] Respect KSESSIONS as read-only; only write via Canvas schema.
  - [threads] Wrap UI updates with InvokeAsync() for Blazor Server safety.
  - [playwright] Prepare Playwright coverage; default headless mode.
  - [naming] Enforce PascalCase for C#/Razor, kebab-case for tests.
  - [time] No hard-coded dates; source time from DB/server UTC.
  - [duplication] Search repo for similar fixes; refactor shared code.

# ──────────────────────────────
# 📤 Output
# ──────────────────────────────
output:
  - Step plan with time estimates
  - File + line references touched
  - Code snippets or diffs
  - Build/test results
  - Risks/unknowns
  - Documentation updates (ncImplementationTracker, issues)

# ──────────────────────────────
# 🔗 Alignment
# ──────────────────────────────
alignment:
  - "NOOR-CANVAS-DESIGN.MD — architecture & phases"
  - "ncImplementationTracker.MD — implementation state & patterns"
  - "INFRASTRUCTURE-FIXES-REPORT.md — Playwright fixes to respect"
  - "copilot_instructions.md — self-learning & approval discipline"
