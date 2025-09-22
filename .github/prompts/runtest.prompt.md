---
mode: agent
name: runtest
alias: /runtest
description: >
  Execute Playwright tests for Noor Canvas in strict headless mode (no UI),
  with robust pre-flight checks, clean port management, and rich logs/artifacts.
  Honor project playwright.config.*, but override any UI drift.
  Run against a pre-running, healthy app instance.

parameters:
  - name: name
    required: true
    description: Test or describe title substring to run with -g.
  - name: notes
    required: false
    description: >
      key:value hints parsed into ENV (token, sessionId, user/email, tenant, route, env, mode:headed/headless, verbose).

# ─────────────────────────
# 📖 Usage Examples
# ─────────────────────────
# /runtest name:"Session" notes:"sessionId:212 headless verbose"
# /runtest name:"Host Control Panel" notes:"token:VNBPRVII route:/host/control-panel"
# /runtest name:"Smoke" notes:"tenant:dev user:qa@noor.app"

# ─────────────────────────
# 🎯 Mission
# ─────────────────────────
# • Force silent, no-UI execution: headless=true, no --ui, do not allow headed unless explicitly requested.
# • Pre-flight: verify app is running & healthy; confirm ports; confirm Playwright install; verify tokens.
# • Smart notes→ENV mapping; echo final runtime config.
# • Single worker; artifacts retained on failure; HTML+JSON reports.

precheck:
  - infra_workflow: >
      Assume app is started externally with validated infra. If not, instruct to run:
        nc-cleanup; nc  # uses enhanced port manager & dynamic ports
      Confirm ports 9090/9091 (or dynamic) are bound and healthy (/healthz if exposed).
      # Based on PLAYWRIGHT-EXECUTION-GUARDRAILS + PORT-BINDING-SOLUTION
  - headless_enforced: true          # hard requirement; fail if UI is requested implicitly
  - forbid_ui_flag: true             # fail if --ui is detected anywhere
  - single_worker: true
  - reporters: [list, json]          # REGRESSION FIX: NEVER include html - causes localhost:9323 blocking
  - artifacts_dirs: ["PlayWright/reports","PlayWright/results","PlayWright/artifacts"]
  - retrospective_checks:            # NEW: Based on Sept 22, 2025 analysis
      - scan_for_html_reporter: true # Abort if HTML reporter found in any config
      - validate_ssl_method: true    # Ensure https module usage for infrastructure
      - check_blazor_selectors: true # Warn about generic selectors in test files
      - validate_incremental_patterns: true # Check for character-by-character input simulation
      - verify_fallback_selectors: true     # Ensure 3+ selector strategies for critical elements
  - healthcheck:
      base_url_env: "BASE_URL"       # optional override; otherwise http://localhost:9090
      default_url: "http://localhost:9090"
      verify:
        - "title ~ /Noor Canvas|NOOR CANVAS/"
      warmup_seconds: 30
  - respect_project_config: true      # do not override retries/trace/webServer if set

notes_parsing:
  keys: [token, sessionId, user, email, tenant, route, env, mode, verbose]
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
    token: "VNBPRVII"     # host
    userToken: "DPH42JR5" # user
  validate:
    token_regex: "^[A-Z0-9]{8}$"
  status_echo:
    - "NOOR_SESSION_ID"
    - "CANVAS_TEST_TOKEN"
    - "CANVAS_TEST_USER"
    - "CANVAS_TENANT"
    - "CANVAS_TEST_ROUTE"

run:
  echo_config: true
  command:
    base: "npx playwright test"
    args:
      - "--grep" "${name}"
      - "--project" "chromium"
      - "--workers" "1"
      # DO NOT add --ui. DO NOT add --headed.
  env:
    # Force headless; slam doors on UI/debug modes:
    CI: "1"                # Playwright treats CI as headless by default
    PWDEBUG: "0"           # disables inspector
    PWTEST_HEADED: "0"     # internal guard against headed
    PLAYWRIGHT_HEADLESS: "1"
    DEBUG: "pw:api,pw:test"
    # RETROSPECTIVE ENVIRONMENT CONTROLS (Sept 22, 2025):
    PLAYWRIGHT_HTML_REPORT: "0"     # Prevent HTML reporter activation
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: "0" # Ensure browsers available
    NODE_TLS_REJECT_UNAUTHORIZED: "0"      # SSL bypass for self-signed certs
  artifacts_policy:
    trace: "on-retry"
    screenshots: "only-on-failure"
    video: "retain-on-failure"
  respect_webServer: true   # if config has webServer, do not start app here
  if_no_webServer:
    autostart:
      # Prefer your port manager wrapper for clean ports 9090/9091 or dynamic:
      command: "powershell -NoProfile -Command \"nc-cleanup; nc\""
      wait_seconds: 25
      verify_url: "http://localhost:9090"

guardrails:
  - [headless] If config or env attempts to set headed/ui, override to headless and WARN+CONTINUE.
  - [ui-flag] Abort if `--ui` is present in any computed args; print correction hint.
  - [ports] Validate ports via nc/nc-cleanup tools; if 9091 reserved, allow dynamic ports and echo effective baseURL.
  - [health] Must pass warmup + title check; otherwise stop and print pre-flight steps.
  - [single-worker] Always 1 worker to avoid cross-session crosstalk.
  - [tokens] Validate tokens or fallback; redact when logging.
  - [artifacts] Ensure dirs exist; never commit artifacts; respect .gitignore.
  - [config-honor] Do not override project retries/trace/webServer; only enforce UI bans and headless.
  
  # RETROSPECTIVE REGRESSION PREVENTION (Sept 22, 2025):
  - [html-reporter-detection] Scan test files and config for HTML reporter; ABORT with error if found - causes localhost:9323 blocking.
  - [ssl-validation-method] Verify infrastructure uses https module with rejectUnauthorized: false - fetch() fails with self-signed certs.
  - [blazor-selector-validation] Pre-scan test files for generic selectors (input[type="text"], input[placeholder*="token" i]); WARN about potential failures.
  - [source-code-alignment] If test targets specific Razor components, remind to examine component source for exact placeholders.
  - [url-parameter-awareness] For token entry tests, ensure navigation to base URLs without token parameters.
  - [infrastructure-fail-fast] Infrastructure validation must fail immediately if unhealthy - don't proceed with broken setup.

alignment:
  - "PLAYWRIGHT-EXECUTION-GUARDRAILS.md — pre-flight, health, validated workflow"  :contentReference[oaicite:2]{index=2}
  - "PORT-BINDING-SOLUTION.md — nc/nc-cleanup, dynamic ports, launch settings update"  :contentReference[oaicite:3]{index=3}
  - "NOOR-CANVAS-DESIGN.MD, ncImplementationTracker.MD, INFRASTRUCTURE-FIXES-REPORT.md, copilot_instructions.md"
  
retrospective_integration:
  date: "September 22, 2025" 
  source: "Playwright Multi-Instance Test Development Retrospective"
  prevention_rules:
    html_reporter_elimination: "Scan all configs for HTML reporter; ABORT if found - causes localhost:9323 blocking"
    ssl_infrastructure_pattern: "Require https module with rejectUnauthorized: false for SSL validation"
    blazor_selector_specificity: "Use exact InputText placeholders from component source, not generic selectors"
    url_parameter_flow_awareness: "Navigate to base URLs for token entry testing - avoid auto-population"
  false_fixed_patterns:
    - "HTML reporter issue claimed fixed multiple times but repeatedly reoccurred"
    - "Infrastructure validation with multiple failing approaches"
    - "Element selectors with timeout failures despite 'improvements'"
  commands_to_stop_trying:
    - "fetch() for HTTPS localhost with self-signed certificates"
    - "input[type='text'] or input[placeholder*='token' i] generic selectors"
    - "HTML reporter in any configuration mode or override"
    - "Immediate validation without Blazor state propagation time"

output:
  - Effective config echo (headless, workers, reporters, grep)
  - Healthcheck result (url used, warmup ms)
  - Resolved ENV (redacted tokens)
  - Paths to HTML/JSON report, trace, screenshots, video
  - Short failure synopsis if any (first failing test + location)
