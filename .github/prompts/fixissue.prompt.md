---

mode: agent
name: fixissue
alias: /fixissue
description: >
Diagnose and fix issues for Noor Canvas with strict evidence, repeatable guardrails,
and explicit-approval workflow. Never mark resolved without user authorization.
Validate app readiness, add scoped debug logging, verify with Playwright (headless),
and document everything. Align with NOOR-CANVAS-DESIGN, ncImplementationTracker.MD,
and INFRASTRUCTURE-FIXES-REPORT.

parameters:

- name: issue
  required: true
  description: >
  The issue text or existing Issue-<ID> reference. If multiple issues are provided,
  separate with '---' to process sequentially.
- name: notes
  required: false
  description: Optional hints/context (e.g., "affects SessionWaiting; timer uses stale date").
- name: mode
  required: false
  description: Execution hints: "dry-run", "apply", or "propose-diff". Default: "propose-diff".

# ───────────────────────────

# 📖 Usage Examples

# ───────────────────────────

# 1) New issue text (create proposal; await approval)

# /fixissue issue:"Clicking Continue stays disabled on UserLanding when token filled"

#

# 2) Existing issue (do not change status; collect evidence & fix)

# /fixissue issue:"116 Blazor input binding causes disabled buttons"

#

# 3) Multiple issues

# /fixissue issue:"A) Session dropdown empty after token --- B) Timer uses old KSESSIONS date"

# ───────────────────────────

# 🧭 Input Interpretation Rules

# - If the issue begins with an integer → treat as Issue-<ID>; NEVER change its status without explicit approval.

# - If no ID → draft a concise Title, Repro steps, Acceptance criteria, and propose Issue-<NEXT>.

# - If multiple blocks separated by '---', process in order with separate evidence bundles.

# (Status discipline per Copilot Self-Learning Protocol.) # Never mark resolved without explicit user approval

# (See also: Approval Gate at end.)

# 🔗 Alignment Hooks (Must Read/Sync)

alignment:

- NOOR-CANVAS-DESIGN.MD # architecture & phases
- ncImplementationTracker.MD # current progress & lessons
- INFRASTRUCTURE-FIXES-REPORT.md # latest Playwright framework fixes
- copilot_instructions.md # global behavior & approval protocol

# 🚦 Guardrails (Global)

guardrails:

- [approval] Never mark an issue as resolved or completed without explicit user approval. # critical rule
- [readiness] Validate app is running on :9090/:9091 before any UI test; do not proceed until healthy.
- [logging] Use scoped, structured logs with "COPILOT-DEBUG:" prefix; redact secrets; remove after fix.
- [playwright] Run tests headless by default; echo mode; capture verbose logs, trace/screenshots/video, HTML/JSON reports.
- [blazor] Use proven event-dispatch pattern for @bind-Value; verify button enablement before clicks.
- [time] For timers/dates, disallow hard-coded historical constants; assert single UTC source of truth.
- [env] Print branch/commit/env; confirm dev DB (KSESSIONS_DEV), never prod; refuse unknown environments.
- [duplication] Scan for duplicate code introduced by fix; refactor or record follow-up.
- [concurrency] Review async/await, cancellation tokens, idempotency; add duplicate-click guards where needed.
- [evidence] Every change must include “before vs after” logs, screenshots, and passing tests.

# 🛠️ Fixing Protocol (Required Order)

steps:

- title: Application Startup Validation (MANDATORY)
  details: |
  • Ping http://localhost:9090 (and/or https://localhost:9091). If down, start via repo task and wait until
  "Now listening…" appears, then perform a lightweight health check (title/role selectors).
  • Record outcome in evidence.
- title: Scoped Debug Logging
  details: |
  • Add structured logs at UI/API/service/data layers with "COPILOT-DEBUG:" prefix.
  • Include timestamp, correlationId, route, key params (no PII/secrets), elapsed ms, and result status.
  • Commit logs separately so they can be reverted after resolution.
- title: Diagnose → Fix → Verify (Iterative Loop)
  details: |
  • Reproduce → log → patch → measure → test → repeat until stable; keep a timestamped iteration log.
- title: Self-Testing Protocol
  details: |
  • Create minimal repro scaffolding under Workspaces/TEMP/; remove before completion.
  • Record clear repro steps, expected vs actual behavior.
- title: Playwright Verification (MANDATORY)
  details: |
  • E2E tests must run headless, sequential (1 worker), verbose output, trace-on-retry, artifacts on failure.
  • Respect configured baseURL/timeouts; do not self-boot app inside tests if config specifies webServer.
  • Use Blazor-safe helpers: `fillBlazorInput()` (dispatch input/change + brief wait) and `expect(button).toBeEnabled()` before click.
  • Provide report links/paths and attach HTML/JSON report excerpts in evidence.
- title: Pre-Build Integrity Checks
  details: |
  • Duplicate scan in touched scope; basic HTML/.razor validation; TypeScript: `tsc --noEmit` if relevant; ESLint on changed files.
  • Block completion until these pass.
- title: Data & Environment Protocols
  details: |
  • Use KSESSIONS_DEV and Canvas; never prod. Respect EF vs Dapper boundaries; parameterize queries.
  • Do not log tokens, passwords, or raw connection strings.
- title: Concurrency & Resilience
  details: |
  • Validate async flows and SignalR subscriptions; add idempotency/duplicate-submit guards.
  • Add log markers to detect races (thread/task ids).
- title: Evidence Bundle
  details: |
  • Include: failing repro evidence, fix diff, passing test outputs, selective logs (pre/post), and screenshots/video artifacts.

# 🧪 Playwright Contracts (Enforced)

playwright:
mode_default: headless
reporters: [html, json, line]
artifacts: ["trace on retry", "screenshots on failure", "video on failure"]
helpers: - fillBlazorInput(selector, value) # dispatch 'input' and 'change', then small wait - expectEnabledBeforeClick(selector)
healthcheck: - goto '/' - expect title ~ /Noor Canvas|NOOR CANVAS/
notes_parsing: - keys: [token, sessionId, user, email, tenant, route, env] - export_env: [CANVAS_TEST_TOKEN, NOOR_SESSION_ID, CANVAS_TEST_USER, CANVAS_TENANT, CANVAS_TEST_ROUTE]
tokens_fallback: - session212_fallback: true - validation_regex: "^[A-Z0-9]{8}$"

# 🧩 Output Shape

output:

- Plan — concise steps to execute
- Context Evidence — files/lines/logs referenced
- Action — idempotent commands/patches
- Tests — commands + results (summarized)
- Risks — remaining unknowns, next steps
- Approval Gate — explicit prompt for user approval before changing status to RESOLVED

# ✅ Approval Gate (Do Not Bypass)

approval_gate:
message: >
Technical work complete and verified with evidence. Do you approve marking this issue as RESOLVED?
(Accepted phrases: “mark as resolved”, “approve this resolution”, “this is complete”, “close this issue”.)
on_approval: - Update issue status from ACTIVE → RESOLVED with resolution date and links to evidence.
on_no_approval: - Keep status unchanged; provide summary & wait for direction.

# 📎 References (authoritative)

references:

- NOOR-CANVAS-DESIGN.MD
- ncImplementationTracker.MD
- INFRASTRUCTURE-FIXES-REPORT.md
- copilot_instructions.md
