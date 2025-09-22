---
mode: agent
name: gentest
alias: /gentest
description: >
  Generate production-grade Playwright E2E tests for Noor Canvas with rock-solid, CI-stable patterns:
  enforce headless (no UI), Blazor-safe input handling, enabled-before-click checks, realistic health checks,
  token/session fallbacks, and artifact-rich reporting. Tests MUST target a pre-running, stable app instance
  per the validated infra workflow and port binding solution.

parameters:
  - name: name
    required: true
    description: Descriptive test name for suite title and kebab-case filename.
  - name: targets
    required: true
    description: >
      Artifacts to analyze (Razor views/components, controllers, routes). Accepts #file:, dirs, globs.
  - name: notes
    required: false
    description: >
      Scenario hints: key:value pairs like token, sessionId, user/email, tenant, route, env, headed/headless, verbose.
      Example: "sessionId:212 headless verbose"

# ──────────────────────────────────────────────
# 📖 Usage Examples
# ──────────────────────────────────────────────
# /gentest name:"User joins with 8-char token" targets:"#file:UserLanding.razor" notes:"negative-testing"
# /gentest name:"Host Experience Flow" targets:"#file:Host-SessionOpener.razor, /src/Server/Controllers" notes:"sessionId:212 headless verbose"

# ──────────────────────────────────────────────
# 🎯 Mission
# ──────────────────────────────────────────────
# Emit PlayWright/tests/{kebab-case(name)}.spec.ts that:
# • Runs headless-only (no --ui, no headed) and logs verbosely.
# • Uses Blazor-safe helpers: dispatch 'input' + 'change' and verify enabled before clicks.
# • Health-checks a pre-running app on :9090/:9091 with generous warmup.
# • Validates 8-char tokens; supports Session 212 fallbacks.
# • Captures artifacts: HTML+JSON report, trace on retry, screenshots/video on failure.
# • Includes at least one negative path.

analysis:
  - From ${targets}, extract:
      - @page routes, navigation order, guards
      - @bind-Value inputs (require dispatch), button enablement rules
      - Controller routes, DTO in/out, validators & expected 4xx
      - Async/SignalR or cascading dropdown waits
  - Build a journey map (entry → assertions → success; plus ≥1 negative)
  - Parse ${notes} into env/fixtures; default to headless; prefer Session 212 fallback

emit:
  file: "PlayWright/tests/{kebab-case(NAME)}.spec.ts"
  structure:
    - Header banner: generated timestamp, NAME, TARGETS, parsed NOTES (redacted)
    - Imports: { test, expect, Page } from '@playwright/test'
    - Enforce headless at file-level (belt & suspenders):
        - `test.use({ headless: true });`  # do NOT remove; prevents accidental UI from config
    - Inline helpers (must emit):
        - fillBlazorInput(page, selector, value)  # dispatch 'input' & 'change' + wait
        - clickEnabledButton(page, selector, timeout=10000)  # expect enabled before click
        - redact(value)  # mask 8-char tokens in logs
    - Fixtures (beforeEach):
        - Resolve CANVAS_TEST_TOKEN / CANVAS_USER_TOKEN or fallback (VNBPRVII / DPH42JR5)
        - Expect /^[A-Z0-9]{8}$/ for tokens
        - Health check: goto http://localhost:9090 (or env BASE_URL) with networkidle, 30s timeout
        - Expect title /Noor Canvas|NOOR CANVAS/
        - Log config echo (headless=true, 1 worker, reporters)
    - Tests:
        - Primary happy path from journey map
        - ≥1 negative path (invalid token, empty input, server 4xx)
    - Logging: breadcrumbs with secrets redacted
    - Teardown: none (respect project config)

snippets:
  fillBlazorInput_ts: |
    async function fillBlazorInput(page: Page, selector: string, value: string) {
      const input = page.locator(selector);
      await input.clear();
      await input.fill(value);
      await input.dispatchEvent('input');
      await input.dispatchEvent('change');
      await page.waitForTimeout(2000);
    }
  clickEnabledButton_ts: |
    async function clickEnabledButton(page: Page, selector: string, timeout = 10000) {
      const button = page.locator(selector);
      await expect(button).toBeEnabled({ timeout });
      await button.click();
    }
  redact_ts: |
    function redact(v?: string) {
      if (!v) return v;
      return v.replace(/[A-Z0-9]{8}/g, '********');
    }
  headless_enforce_ts: |
    // Hard stop against accidental UI runs:
    test.use({ headless: true });  // prevents headed/--ui even if config drifts
  
  # RETROSPECTIVE-DRIVEN PATTERNS (Sept 22, 2025):
  validateInfrastructureSSL_ts: |
    async function validateInfrastructure() {
      console.log('🔍 Validating infrastructure with SSL support...');
      try {
        // REGRESSION FIX: Use https module instead of fetch() for SSL bypass
        const https = require('https');
        const { URL } = require('url');
        const url = new URL('https://localhost:9091/healthz');
        const options = {
          hostname: url.hostname,
          port: url.port,
          path: url.pathname,
          method: 'HEAD',
          rejectUnauthorized: false, // CRITICAL: Required for self-signed certs
          timeout: 10000
        };
        const response = await new Promise<{ ok: boolean; status: number }>((resolve, reject) => {
          const req = https.request(options, (res: any) => {
            resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode });
          });
          req.on('error', reject);
          req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
          req.end();
        });
        if (!response.ok) throw new Error(`Health check failed: ${response.status}`);
        console.log('✅ Application running on https://localhost:9091');
      } catch (error) {
        throw new Error(`❌ Infrastructure validation failed: ${error}`);
      }
    }
  
  blazorSelectors_ts: |
    // REGRESSION PREVENTION: Use exact placeholders from Blazor components
    class BlazorSelectors {
      static TOKEN_INPUT = 'input[placeholder="Enter your Unique User Token"]';
      static NAME_INPUT = 'input[placeholder="Enter your name"]';
      static EMAIL_INPUT = 'input[placeholder="Enter your email"]';
      static COUNTRY_SELECT = 'select'; // Blazor InputSelect generates standard select
      // AVOID: input[type="text"], input[placeholder*="token" i] - these fail
    }

guardrails:
  - [headless] Enforce `test.use({ headless: true })`; never emit --ui; never rely on config for headless.
  - [single-worker] Assume 1 worker; avoid cross-test state.
  - [health] App must be pre-running & healthy on :9090/:9091; use BASE_URL if provided.
  - [tokens] Validate tokens, fallback to Session 212 when missing.
  - [blazor] Use fillBlazorInput; no raw page.fill without dispatch; verify enabled before click.
  - [artifacts] Trace on retry; screenshots/video on failure; HTML+JSON reporters.
  - [security] Redact tokens; no secrets in logs.
  - [config-honor] Do not self-boot if project `webServer` is defined; rely on external startup flow.
  
  # REGRESSION PREVENTION (from Sept 22, 2025 Retrospective):
  - [source-code-first] ALWAYS examine target Razor component source before writing selectors - NEVER guess.
  - [exact-placeholders] Use exact Blazor InputText placeholders from component source (e.g., 'input[placeholder="Enter your Unique User Token"]').
  - [html-reporter-ban] NEVER include HTML reporter in any test - causes blocking at localhost:9323 in headless mode.
  - [ssl-infrastructure] Use Node.js https module with rejectUnauthorized: false for SSL validation - fetch() fails with self-signed certs.
  - [url-parameter-flow] Navigate to base URL (/user/landing) for token entry testing - URL with token skips manual entry panel.
  - [blazor-state-timing] Allow 2-3 seconds for Blazor state changes after token validation before proceeding to registration form.
  - [avoid-generic-selectors] NEVER use input[type="text"], input[placeholder*="token" i] - these fail with Blazor components.

alignment:
  - "PLAYWRIGHT-EXECUTION-GUARDRAILS.md — pre-flight & stable infra workflow"  :contentReference[oaicite:0]{index=0}
  - "PORT-BINDING-SOLUTION.md — port cleanup, dynamic selection, launch settings"  :contentReference[oaicite:1]{index=1}
  - "NOOR-CANVAS-DESIGN.MD, ncImplementationTracker.MD, INFRASTRUCTURE-FIXES-REPORT.md, copilot_instructions.md"
  
retrospective_integration:
  date: "September 22, 2025"
  source: "Playwright Multi-Instance Test Development Retrospective"
  critical_lessons:
    - "HTML Reporter = Test Death: Never enable in any mode - causes localhost:9323 blocking"
    - "Read Source Code First: Don't guess at selectors - examine Razor component for exact placeholders"
    - "SSL Requires https Module: fetch() fails with self-signed certs in Node.js"
    - "Blazor State Management: URL parameters affect component rendering - use base URLs for manual testing"
    - "Generic Selectors Fail: input[type='text'] unreliable with Blazor InputText components"
  commands_that_dont_work:
    - "fetch() for SSL validation → Use Node.js https.request()"
    - "Generic input selectors → Use exact placeholder text"
    - "HTML reporters in any form → Stick to list + json only"
    - "URL with token for token entry testing → Use base URL"
    - "Immediate validation after config changes → Allow Blazor state time"

quality_checklist:
  - "[ ] test.use({ headless: true }) present"
  - "[ ] No --ui, no headed paths"
  - "[ ] Health check passes (title + networkidle)"
  - "[ ] Inputs use fillBlazorInput(); buttons checked enabled"
  - "[ ] ≥1 negative test included"
  - "[ ] Tokens validated; logs redacted"
  - "[ ] Artifacts enabled (trace/screenshots/video, HTML+JSON)"
  
  # RETROSPECTIVE QUALITY GATES (Sept 22, 2025):
  - "[ ] Target Razor component source examined for exact selectors"
  - "[ ] NO HTML reporter included (causes localhost:9323 blocking)"
  - "[ ] SSL validation uses https module with rejectUnauthorized: false"
  - "[ ] Base URL navigation for manual token entry testing"
  - "[ ] Exact Blazor InputText placeholders used (not generic selectors)"
  - "[ ] 2-3 second waits after Blazor state changes"
  - "[ ] Infrastructure validation fails fast if unhealthy"
