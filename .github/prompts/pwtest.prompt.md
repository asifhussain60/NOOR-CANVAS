---
mode: agent
name: pwtest
alias: /pwtest
alt_aliases: [/gentest, /runtest]
description: >
  Unified Playwright E2E test generator & runner for Noor Canvas with self-learning.
  Modes:
    • "test": create a production-grade, CI-stable Playwright spec, verbose by default.
    • "run":  execute the test; if not found, auto-switch to "test", then run.
  The agent continuously learns from successes and failures, proposing refined
  instructions to improve future stability, speed, and signal.

parameters:
  - name: key
    required: true
    description: >
      Test name or identifier. In "test", becomes suite title + kebab-case filename.
      In "run", used as grep/name. Multiple keys allowed via '---' (processed sequentially).
      Each run binds to `pwtest-context:<KEY>`.

  - name: mode
    required: true
    description: >
      Execution mode:
        • "test" → generate the test noted by `key`
        • "run"  → run the test named by `key` (auto-generate if missing, then run)

  - name: ui_mode
    required: false
    default: headless
    description: >
      Browser UI mode:
        • "headless" (default) → enforce headless mode with verbose logs + rich artifacts
        • "headed"            → allow windowed browser, still verbose + artifacts

  - name: notes
    required: false
    description: >
      Free-form scope (targets #file:/dirs/globs/screenshots, env hints, tokens/sessionId,
      routes, negative paths, perf considerations). Multiple notes may be separated by '---';
      each note inherits the same key and mode.

# ─────────────────────────────────────────────────────────
# 📖 Usage Syntax (Cheat Sheet)
# ─────────────────────────────────────────────────────────
# /pwtest
#   key:[test-name or key1 --- key2 --- key3]
#   mode:[run | test]
#   ui_mode:[headless | headed]
#   notes:[note text or note1 --- note2 --- note3]
#
# Examples:
# /pwtest
#   key:"Host Experience Flow"
#   mode:"test"
#   ui_mode:"headless"
#   notes:"#file:Host-SessionOpener.razor --- sessionId:212 negative-testing"
#
# /pwtest
#   key:"Smoke"
#   mode:"run"
#   ui_mode:"headed"
#   notes:"tenant:dev user:qa@noor.app"

# ─────────────────────────────────────────────────────────
# 🎯 Mission
# ─────────────────────────────────────────────────────────
mission:
  - Default headless (`ui_mode=headless`) with verbose logs and artifact-rich reporting.
  - If `ui_mode=headed`, still enforce verbose logs and artifacts.
  - Blazor-safe input (dispatch 'input' + 'change'); verify enabled-before-click.
  - Pre-flight health on :9090/:9091 or BASE_URL with warmup + title check.
  - Token/session fallbacks (8-char tokens; Session 212), redacted in logs.
  - Include at least one negative path per generated suite.
  - Continuous improvement: after execution, analyze outcomes and propose prompt refinements.

# ─────────────────────────────────────────────────────────
# 🔗 Alignment Hooks
# ─────────────────────────────────────────────────────────
alignment:
  - NOOR-CANVAS-DESIGN.MD
  - ncImplementationTracker.MD
  - .github/instructions/SelfAwareness.instructions.md
  - .github/prompts/pwtest.prompt.md   # target for self-update (proposed patch)

# ─────────────────────────────────────────────────────────
# 🧭 Context-First Boot (MANDATORY)
# ─────────────────────────────────────────────────────────
context_boot:
  - Consult SelfAwareness.instructions.md; refresh Project Ledger (stack, ports, tokens, tests).
  - Skim recent chat/workspace history for this key; avoid failed patterns.
  - Determine base URL via port-binding; warmup; assert title /Noor Canvas|NOOR CANVAS/.
  - Parse notes (split by ---) into scoped tasks and environment hints.

# ─────────────────────────────────────────────────────────
# 🛠️ Methods by Mode
# ─────────────────────────────────────────────────────────
methods:
  test:
    - "Analyze Targets & Flows":
        - Infer targets from notes: #file:, directories, globs, screenshots.
        - Extract @page routes, input bindings, controller routes/DTOs, guards, waits.
    - "Emit Spec":
        - Path: PlayWright/tests/{kebab-case(key)}.spec.ts
        - `test.use({ headless: ui_mode == "headless" })` inside file.
        - Always enable verbose step logging and console capture.
        - Inline helpers: fillBlazorInput(), clickEnabledButton(), redact().
        - Fixtures:
            - Resolve CANVAS_TEST_TOKEN / user token; validate /^[A-Z0-9]{8}$/ or fallback.
            - Health-check base URL; echo config (ui_mode, 1 worker, reporters).
        - Tests:
            - Primary journey (entry → assert → success).
            - ≥1 negative path (invalid input, 4xx, guard rails).
        - Logging: structured breadcrumbs; secrets redacted.
    - "Quality Gates":
        - Prefer robust selectors from Razor source.
        - Deterministic waits post-Blazor state changes.
        - Reporters: list + json (HTML disabled unless explicitly required elsewhere).

  run:
    - "Pre-flight":
        - Echo effective config; respect ui_mode; force 1 worker; verbose logs on.
        - Forbid `--ui` flag; only `ui_mode` governs headed/headless.
        - Validate infra & warmup; assert title.
    - "Find-or-Create":
        - If spec matching `key` not found:
            - Switch to "test" to generate spec using notes.
            - Return to "run" and execute.
    - "Execute":
        - Command: `npx playwright test --grep "${key}" --project chromium --workers 1`
        - ENV:
            - CI=1, DEBUG="pw:api,pw:test"
            - PLAYWRIGHT_HEADLESS=1 if ui_mode=headless, else 0
        - Artifacts: trace on retry; screenshots only-on-failure; video retain-on-failure.
    - "Report":
        - Emit paths for list/json reports, trace, screenshots, videos.
        - If failures: show first failing test + location synopsis.

# ─────────────────────────────────────────────────────────
# 🤖 Self-Learning & Prompt Self-Update
# ─────────────────────────────────────────────────────────
self_learning:
  - "Outcome Analysis" (every run or generation):
      - Classify steps as SUCCESS/FAILED/FLAKY with reasons (selector brittleness, timing, env).
      - Record stability hints: selectors used, wait strategies, retries applied, network conditions.
  - "Patterns":
      - success_patterns:
          - selectors that proved resilient
          - wait heuristics that stabilized flows
          - token/fixture practices that avoided flakes
      - failure_patterns:
          - selectors/waits that regularly failed
          - recurring infra misconfig (wrong base URL, app not running)
          - anti-patterns (implicit waits, generic locators)
  - "Self-Update Proposal":
      - Generate a minimal, structured diff to **.github/prompts/pwtest.prompt.md**:
          • Tighten/relax wait rules, selector guidance, retries/timeouts
          • Adjust fixture checks (health, tokens)
          • Refine negative-path requirements and artifact policies
      - Also propose updates to SelfAwareness.instructions.md when behavioral guardrails are implicated.
  - "Safety":
      - Never auto-apply; surface diffs via approval gate.
      - Keep changes focused and reversible; explain rationale tied to evidence.

# ─────────────────────────────────────────────────────────
# 🚦 Guardrails
# ─────────────────────────────────────────────────────────
guardrails:
  - [ui_mode] Default headless; headed only if explicitly set; both are verbose.
  - [verbose] Always enable detailed Playwright debug logging.
  - [single-worker] Use 1 worker to reduce crosstalk.
  - [health] App must be running & healthy; echo base URL actually used.
  - [blazor] Use fillBlazorInput(); verify enabled before clicks; avoid generic selectors.
  - [artifacts] Keep trace/screenshots/video on failure; list+json reporters ONLY by default.
  - [security] Never log secrets; redact tokens.
  - [diffs] For self-updates, present diffs; never blind-write.

# ─────────────────────────────────────────────────────────
# 🧪 Snippets (embed in generated specs)
# ─────────────────────────────────────────────────────────
snippets:
  headless_enforce_ts: |
    // Enforce desired UI mode from prompt:
    test.use({ headless: process.env.PLAYWRIGHT_HEADLESS === "1" });
  fillBlazorInput_ts: |
    async function fillBlazorInput(page, selector, value) {
      const input = page.locator(selector);
      await input.clear();
      await input.fill(value);
      await input.dispatchEvent('input');
      await input.dispatchEvent('change');
      await page.waitForTimeout(2000);
    }
  clickEnabledButton_ts: |
    async function clickEnabledButton(page, selector, timeout = 10000) {
      const button = page.locator(selector);
      await expect(button).toBeEnabled({ timeout });
      await button.click();
    }
  redact_ts: |
    function redact(v) {
      if (!v) return v;
      return v.replace(/[A-Z0-9]{8}/g, '********');
    }

# ─────────────────────────────────────────────────────────
# 🧩 Output Shape
# ─────────────────────────────────────────────────────────
output:
  - memory_key: pwtest-context:<KEY>
  - mode: test | run (with auto-generate fallback in run)
  - plan: generated or executed actions
  - evidence:
      - headless_enforced: true/false
      - healthcheck: url used + result + warmup ms
      - env_echo: redacted token/session/user/tenant/route
      - artifacts: report/json/trace/screenshots/video paths
  - lessons:
      - success_patterns: [ ... ]
      - failure_patterns: [ ... ]
      - recommended_changes: rationale tied to evidence
  - proposed_prompt_patch:
      - target: .github/prompts/pwtest.prompt.md
      - diff: |
          # minimal unified diff (what to insert/edit/remove)
      - also_update_self_awareness: true/false
      - self_awareness_diff: |
          # optional diff for SelfAwareness.instructions.md
  - generation:
      include_if_mode_test_or_autogen: path to emitted spec + summary
  - execution:
      include_if_mode_run: grep used, summary, first failing test (if any)
  - approval_gate:
      message: >
        Proposed improvements to pwtest prompt (and optionally SelfAwareness) are ready.
        Review diffs and approve to apply.
      on_approval:
        - Apply diffs and record changelog entry with rationale/evidence.
      on_no_approval:
        - Keep prompts unchanged; retain lessons for next run.

# ─────────────────────────────────────────────────────────
# 📝 Self-Review Footer
# ─────────────────────────────────────────────────────────
self_review:
  - Consulted SelfAwareness; avoided prior failed patterns for this key.
  - Verified ui_mode handling; ensured verbose logging and artifacts.
  - Captured concrete evidence; redacted secrets; recorded flake/root causes.
  - Produced minimal, reversible diffs for prompt improvements; awaiting approval.

# ─────────────────────────────────────────────────────────
# 📦 Final Summary (always at end)
# ─────────────────────────────────────────────────────────
final_summary:
  - Restate what was requested (key, mode, ui_mode, notes).
  - Summarize what was done (test created/ran, infra validated, artifacts collected).
  - Lessons learned:
      • top success patterns
      • top failure patterns
      • targeted improvements
  - Compact manifest:
      • spec files created/updated
      • execution outcomes
      • artifact paths
      • proposed prompt changes (yes/no)
  - Eloquent, concise, executive-readable.
