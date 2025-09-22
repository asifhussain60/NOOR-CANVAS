---

mode: agent
name: gentest
alias: /gentest
description: >
Generate production-ready Playwright E2E tests for NOOR Canvas using proven Blazor Server patterns:
headless-first execution, safe helpers for @bind-Value, button enablement checks, realistic
startup/awaits, and session/token setup with graceful fallbacks. Output must be CI-stable and align
with NOOR-CANVAS-DESIGN and ncImplementationTracker. CRITICAL: Integrate PLAYWRIGHT-EXECUTION-GUARDRAILS
infrastructure stability requirements for multi-user concurrent testing.

parameters:

- name: name
  required: true
  description: Descriptive test name (used for suite title and kebab-case filename).
- name: targets
  required: true
  description: >
  Files to analyze (Razor pages/components, controllers, routes). Accepts #file: paths, globs, dirs.
  Used to extract navigation, bindings, and validation patterns automatically.
- name: notes
  required: false
  description: >
  Extra constraints or scenarios: e.g., "negative-testing", "multi-user", "performance",
  "sessionId:212", "token:VNBPRVII", "headless verbose", "5-instances", "superhero-data".
  Multi-user scenarios must validate participant synchronization across browser instances.

# ──────────────────────────────

# 📖 Usage Examples

# ──────────────────────────────

# /gentest name:"Host Experience Flow" targets:"#file:Host-SessionOpener.razor, /src/Server/Controllers" notes:"sessionId:212 headless verbose"

# /gentest name:"User joins with 8-char token" targets:"#file:UserLanding.razor" notes:"negative-testing"

# /gentest name:"Host Control Panel smoke" targets:"#file:HostControlPanel.razor, /src/Server/Controllers" notes:"performance"

# ──────────────────────────────

# 🎯 Mission

# ──────────────────────────────

# Produce a single TypeScript file at PlayWright/tests/{kebab-case(name)}.spec.ts that:

# • Runs reliably in headless CI with verbose logs, trace/screenshots/video on failure, and HTML/JSON reports.

# • Uses Blazor-safe input & button patterns (dispatch 'input' and 'change', verify enabled before click).

# • Performs realistic health checks and timing around app startup/routes.

# • Supports DB token/session fallbacks (Session 212), with 8-char token validation.

# • Contains clear arrange-act-assert blocks derived from ${targets}.

# 🔍 Analysis → Plan

analysis:

- Extract routes, bindings, validation from ${targets}.
- Build journey map: entry → success → negative flows.
- Parse ${notes} into env/fixtures; fallback to Session 212 tokens.

# ✍️ Generation Rules

emit:
file: "PlayWright/tests/{kebab-case(NAME)}.spec.ts"
structure: - Header block with NAME, TARGETS, NOTES. - Imports: { test, expect, Page } and DatabaseTokenManager. - Helpers inline: - fillBlazorInput() # dispatch input/change, await - clickEnabledButton() # verify enabled, then click - Fixtures (beforeEach): tokens/session resolution, 8-char validation, 30s startup check. - At least one happy path + one negative path. - Console breadcrumbs; redact secrets.

# 🛡️ Guardrails

guardrails:

- [blazor] All inputs use fillBlazorInput().
- [button] All clicks use expect(button).toBeEnabled() before click.
- [health] Always run 30s startup health check with title match.
- [tokens] Validate tokens /^[A-Z0-9]{8}$/; fallback to Session 212 if missing.
- [artifacts] Always enable trace-on-retry, screenshots/video on failure, HTML+JSON reports.
- [headless] Default headless unless notes explicitly say "headed".
- [security] Never log tokens/secrets.
- [infrastructure] Include PLAYWRIGHT-EXECUTION-GUARDRAILS pre-flight checks for application availability on https://localhost:9091.
- [multi-user] For concurrent testing: validate SignalR WebSocket connections, database isolation, participant synchronization across browser instances.
- [stability] Leverage infrastructure fixes: stable Serilog configuration, enhanced Kestrel server, validated 2+ concurrent browser support.

# ✅ Quality Checklist

quality_checklist:

- "[ ] Inputs use fillBlazorInput()"
- "[ ] Buttons guarded with toBeEnabled()"
- "[ ] Startup health check passes"
- "[ ] Tokens validated (8-char, fallbacks present)"
- "[ ] Negative test included"
- "[ ] Headless by default; config echoed"
- "[ ] Artifacts (trace, screenshots, video, reports) present"
- "[ ] No secrets logged"

# 🔗 Alignment

alignment:

- "NOOR-CANVAS-DESIGN.MD"
- "ncImplementationTracker.MD"
- "INFRASTRUCTURE-FIXES-REPORT.md"
- "copilot_instructions.md"

# 📤 Output

output:

- File path
- Extracted flows & assertions summary
- Resolved env/fixtures (tokens redacted)
- Reminder: run with /runtest headless, single-worker
