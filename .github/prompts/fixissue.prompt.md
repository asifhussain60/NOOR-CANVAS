---
mode: agent
name: fixissue
alias: /fixissue
description: >
  Diagnose and fix Noor Canvas issues with strict evidence, structured logs, 
  reliable verification, and explicit approval gates. 
  Never mark issues as resolved without explicit user approval. 
  Always review prior conversation history and Copilot’s earlier attempts 
  to confirm whether a fix was truly effective before proceeding.
  All work must align with NOOR-CANVAS-DESIGN, ncImplementationTracker, 
  INFRASTRUCTURE-FIXES-REPORT, and Copilot self-learning protocols.

parameters:
  - name: issue
    required: true
    description: >
      Issue description or reference (Issue-<ID>). Multiple issues may be provided
      separated by '---' to process sequentially.
  - name: notes
    required: false
    description: >
      Optional hints or context (e.g., "affects SessionWaiting; timer uses stale date").
  - name: mode
    required: false
    description: >
      Execution mode: "propose-diff" (default), "dry-run", or "apply".

# ──────────────────────────────
# 📖 Usage Examples
# ──────────────────────────────
# /fixissue issue:"Button disabled after token entry" notes:"UserLanding.razor"
# /fixissue issue:"116 Blazor binding issue" mode:"dry-run"
# /fixissue issue:"Timer drift --- Token validation fails" notes:"sessionId 212"

# ──────────────────────────────
# 🧭 Input Interpretation
# ──────────────────────────────
# • If starts with integer → treat as Issue-<ID>; do not change status.
# • If plain text → draft Issue-<NEXT> with title, repro steps, acceptance criteria.
# • If multiple (---) → handle in order, bundle evidence per issue.
# • Status advancement always requires explicit user approval.

# ──────────────────────────────
# 🔗 Alignment Hooks
# ──────────────────────────────
alignment:
  - NOOR-CANVAS-DESIGN.MD
  - ncImplementationTracker.MD
  - INFRASTRUCTURE-FIXES-REPORT.md
  - copilot_instructions.md

# ──────────────────────────────
# 🚦 Global Guardrails
# ──────────────────────────────
guardrails:
  - [approval] Never mark an issue as resolved or complete without explicit approval.
  - [history] Always review the current chat history before diagnosing or patching.
      - Look for past attempts Copilot made on the same issue.
      - Identify whether prior fixes failed, regressed, or were incomplete.
      - Summarize history findings in the Evidence Bundle.
  - [readiness] Verify app running on :9090/:9091 before UI tests.
  - [logging] Add scoped logs with "COPILOT-DEBUG:" prefix; redact secrets.
  - [playwright] Always headless; capture trace/screenshots/video, HTML+JSON reports.
  - [blazor] Use fillBlazorInput() + enabled-button check before click.
  - [time] Ban hard-coded dates; enforce UTC DB/server time source.
  - [env] Confirm dev DB (KSESSIONS_DEV); never prod; log branch/env.
  - [duplication] Scan for duplicate code; refactor or record follow-up.
  - [concurrency] Review async/await, cancellation tokens, and SignalR safety.
  - [evidence] Provide before/after logs, screenshots, test results.

# ──────────────────────────────
# 🛠️ Fix Protocol
# ──────────────────────────────
steps:
  - title: Chat History Review (NEW)
    details: |
      • Parse recent conversation and Workspaces logs for this issue.
      • Identify prior fixes attempted and whether they worked.
      • Flag contradictions (e.g., Copilot said "fixed" but issue persisted).
      • Document this review in the Evidence Bundle.
  - title: Startup Validation
    details: |
      Check http://localhost:9090 or https://localhost:9091.
      If not running, start via repo script; wait for "Now listening…".
      Record readiness in evidence.
  - title: Scoped Logging
    details: |
      Add temporary "COPILOT-DEBUG:" logs with timestamps, correlationIds, key params.
      Remove after resolution.
  - title: Diagnose → Fix → Verify
    details: |
      Reproduce → log → patch → measure → retest until stable.
      Keep a timestamped iteration log.
  - title: Self-Test
    details: |
      Build minimal repro under Workspaces/TEMP; remove before completion.
      Document steps clearly.
  - title: Playwright Verification
    details: |
      Run headless tests with verbose logs, 1 worker, trace on retry.
      Use Blazor helpers:
        - fillBlazorInput(selector, value)
        - clickEnabledButton(selector)
      Attach HTML/JSON reports and artifacts.
  - title: Integrity Checks
    details: |
      Scan for duplicates; lint/format code; run build (0 errors).
      Validate HTML/.razor syntax and TypeScript if touched.
  - title: Data & Env Safety
    details: |
      Use Canvas schema for writes, KSESSIONS_DEV for reads.
      Do not log secrets/tokens.
  - title: Concurrency/Resilience
    details: |
      Validate async flows, idempotency, and SignalR events.
      Add duplicate-submit guards if missing.
  - title: Evidence Bundle
    details: |
      Must include:
        • Summary of chat history review (what was tried before, what failed)
        • Repro steps
        • Patch/diff
        • Logs (before/after)
        • Screenshots + Playwright reports

# ──────────────────────────────
# 🧪 Playwright Contracts
# ──────────────────────────────
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

# ──────────────────────────────
# 🧩 Output Shape
# ──────────────────────────────
output:
  - plan: step-by-step actions
  - evidence: files/lines/logs/screenshots
  - history_review: summary of past attempts & contradictions
  - action: idempotent diffs/commands
  - tests: playwright run results
  - risks: remaining gaps/unknowns
  - approval_gate: explicit prompt before marking resolved

# ──────────────────────────────
# ✅ Approval Gate
# ──────────────────────────────
approval_gate:
  message: >
    Technical work complete and verified, with chat history reviewed. 
    Do you approve marking this issue as RESOLVED?
  on_approval:
    - Update status ACTIVE → RESOLVED with resolution notes.
  on_no_approval:
    - Keep status unchanged; summarize and await user.
