---

mode: agent
name: runtest
alias: /runtest
description: >
Execute Playwright tests for NOOR Canvas with headless-first discipline, rich artifacts,
robust health checks, and smart notes→env parsing. Honor project playwright.config.\*,
run single-worker to avoid session cross-talk, and never self-boot if webServer is configured.
CRITICAL: Integrate PLAYWRIGHT-EXECUTION-GUARDRAILS infrastructure validation for stable test execution.
Align with NOOR-CANVAS-DESIGN, ncImplementationTracker, Infra Fixes, and Copilot protocols.

parameters:

- name: name
  required: true
  description: >
  Test or describe title (substring) to run with -g filter. Example: "Login Flow", "Session", "Smoke: Dashboard".
- name: notes
  required: false
  description: >
  Free-form hints parsed into runtime context:
  token:VNBPRVII, sessionId:212, user:qa@noor.app, tenant:dev, route:/host/control-panel, headless, verbose,
  multi-user, 5-instances. Infrastructure stability validated for concurrent browser sessions.

# ─────────────────────────

# 📖 Usage Examples

# ─────────────────────────

# /runtest name:"Session" notes:"sessionId:212 headless verbose"

# /runtest name:"Host Control Panel" notes:"token:VNBPRVII route:/host/control-panel"

# /runtest name:"Smoke" notes:"tenant:dev user:qa@noor.app"

# ─────────────────────────

# 🎯 Mission

# ─────────────────────────

# Run Playwright tests matching ${name} with:

# • Headless Chromium, 1 worker, configured retries, trace-on-retry

# • HTML + JSON reports, screenshots/video on failure

# • App health checks on :9090 (and :9091 when applicable)

# • Notes→ENV parsing for token/session/user/tenant/route, with 212 fallbacks

# • Strict echo of effective config before execution

# ─────────────────────────

# 🚦 Pre-Execution Validation (CRITICAL - Infrastructure Validated)

# ─────────────────────────

precheck:

- headless_enforced: true
- single_worker: true
- reporters: [html, json, line]
- artifacts_dirs: ["PlayWright/reports","PlayWright/results","PlayWright/artifacts"]
- healthcheck:
  urls: ["https://localhost:9091", "http://localhost:9090"]
  verify: - "title ~ /Noor Canvas|NOOR CANVAS/"
  warmup_seconds: 20
- infrastructure_validation:
  - application_running: "dotnet process active on ports 9090/9091"
  - clean_startup_logs: "single log messages confirm infrastructure fixes"
  - signalr_circuits: "WebSocket connections established for multi-user tests"
  - database_connection: "KSESSIONS_DEV accessible via application logs"
- respect_project_config: true # never override trace/retries/webServer if set
- concurrent_support: true # infrastructure validated for 2+ browser instances

# ─────────────────────────

# 🧭 Notes → Runtime Context

# ─────────────────────────

notes_parsing:
keys: [token, sessionId, user, email, tenant, route, env, mode]
env_map:
token: CANVAS_TEST_TOKEN
sessionId: NOOR_SESSION_ID
user: CANVAS_TEST_USER
email: CANVAS_TEST_USER
tenant: CANVAS_TENANT
route: CANVAS_TEST_ROUTE
env: ASPNETCORE_ENVIRONMENT
fallbacks:
sessionId: "212"
token: "VNBPRVII" # host
userToken: "DPH42JR5" # user when needed
validate:
token_regex: "^[A-Z0-9]{8}$"
status_echo: - "NOOR_SESSION_ID" - "CANVAS_TEST_TOKEN" - "CANVAS_TEST_USER" - "CANVAS_TENANT" - "CANVAS_TEST_ROUTE"

# ─────────────────────────

# 🧪 Execution

# ─────────────────────────

run:
echo_config: true # print mode/headless, reporters, workers, grep filter
command:
base: "npx playwright test"
args: - "--grep" "${name}" - "--project" "chromium" - "--workers" "1" # headless is enforced via config/env; do not pass --headed unless notes explicitly say 'headed'
env:
DEBUG: "pw:api,pw:test"
artifacts_policy:
trace: "on-retry"
screenshots: "only-on-failure"
video: "retain-on-failure"
respect_webServer: true # if config has webServer, do not start app here
if_no_webServer:
autostart:
command: "powershell -NoProfile -Command \"cd 'd:\\PROJECTS\\NOOR CANVAS\\SPA\\NoorCanvas'; dotnet run\""
wait_seconds: 20
verify_url: "http://localhost:9090"

# ─────────────────────────

# 🛡️ Guardrails

# ─────────────────────────

guardrails:

- [headless] Default headless; require explicit 'headed' in notes to change.
- [single-worker] Always 1 worker to prevent token/session cross-talk.
- [health] Perform pre-run health check; fail fast if app not reachable.
- [artifacts] Ensure PlayWright/reports, results, artifacts exist; never commit these.
- [tokens] Validate tokens against /^[A-Z0-9]{8}$/; use 212 fallbacks if none provided.
- [security] Redact tokens in logs; never print secrets.
- [config-honor] Do not override playwright.config.\* trace/retries/webServer if present.

# ─────────────────────────

# 📤 Output (Runner Summary)

# ─────────────────────────

output:

- Effective config (mode, workers, reporters, grep)
- Healthcheck result and timing
- Resolved ENV (redacted token)
- Paths to HTML/JSON report, trace, screenshots, video
- Short failure synopsis if any (first failing test title + location)

# ─────────────────────────

# 🔗 Alignment Hooks (must reflect)

# ─────────────────────────

alignment:

- "NOOR-CANVAS-DESIGN.MD — architecture & phases"
- "ncImplementationTracker.MD — latest implementation state"
- "INFRASTRUCTURE-FIXES-REPORT.md — Playwright stability fixes"
- "copilot_instructions.md — self-learning & approval discipline"
