---
mode: agent
---
name: fixissue
description: Track and fix issues by reviewing IS10. **Te11. **Self12. **Mandatory Playwright Test Creation Protocol:**
    - **PREREQUISITE:** Ensure NoorCanvas application is running (see Applicati### Actions Based on Interpretation
---


You are tasked with addressing the following input:

**User Input:**  
{{issue}}

---

## Input Interpretation Rules (policy; not code conditionals)
- **Multiple issues:** If input contains '---', split and process each block sequentially.
- **Existing issue (numeric-leading):** First integer is **Issue-<ID>**; remainder is feedback/context. Do **not** change status without explicit permission.
- **New issue (text-leading):** Draft a proposed title + short description (minimal repro + acceptance criteria). Determine next issue number by scanning `ncIssueTracker.md` and propose entry under **NOT STARTED**. Await approval before creating files or changing status.

---

## Core Instructions
- Record work concisely in `ISSUE-TRACKER` and cross-check `COMPLETED/` for prior art.
- Do **not** mark any item as resolved without explicit approval.
- **Numbering discipline:** Identify highest Issue/TODO numbers in `ncIssueTracker.md` before creating new entries; increment without gaps.

---

## Fixing Protocol (follow in order)
1) **Application Startup Validation (MANDATORY FIRST):**
   - Verify NoorCanvas is running at `https://localhost:9091` and `http://localhost:9090`.
   - If not, start it using the appropriate task and wait for “Now listening on …” in logs.
   - Run a basic health check before any testing.

2) **Comprehensive, Layered Debug Logging (UPDATED):**
   - Add structured logs with correlation IDs across **UI (Razor/JS), API/controllers, services, data/SQL**.
   - Use **standardized log markers**: prefix every debug entry with `COPILOT-DEBUG:`.
     - Example: `logger.LogDebug("COPILOT-DEBUG: [UserLanding:43] Correlation {CorrelationId} User {UserId} Session {SessionId}", ...)`
   - Include: timestamp, correlationId, user/session (if applicable), route/method, key params, payload size (not secrets), elapsed ms, result status.
   - Redact secrets/PII; never log tokens, passwords, or raw connection strings.
   - Prefer logger abstractions (`ILogger`, `Serilog`) with scopes; avoid `Console.WriteLine`.
   - After each change, **capture evidence**: snippets of relevant logs demonstrating the observed behavior and the post-fix behavior.
   - All logs added for debugging must be easily identifiable by the `COPILOT-DEBUG:` marker so they can be automatically removed later without affecting functional logs.

3) **Iterative Verification Loop:**
   - **Repeat** diagnose → fix → log/measure → test until **logs and tests** show no regressions and all acceptance criteria pass.
   - Do not proceed to build/deploy while logs show warnings/errors related to the scope being fixed.
   - Maintain a short “iteration log” in the issue detail file (timestamped notes + links to test artifacts).

4) **Self-Testing Protocol:**
   - Reproduce locally when possible.
   - For each fix, add minimal self-test scaffolding (temporary) under `Workspaces/TEMP/` and remove before completion.
   - Record repro steps and expected vs. actual behavior.

5) **Playwright Test Creation (MANDATORY):**
   - For every fix, create/update Playwright tests under `Tests/UI/` using `issue-{ID}-{slug}.spec.ts`.
   - Include positive/negative paths, boundary cases, and references to the issue ID.
   - Provide execution evidence (report/screenshot/video) **before** requesting resolution.

6) **Pre-Build Integrity Checks (MANDATORY):**
   - **Duplicate code scan:** Identify obvious duplication introduced or touched by the fix; refactor or note a follow-up item with pointers.
   - **Syntax/quality gates for modified files only:**
     - Razor/CS: compile checks; nullable warnings reviewed.
     - **HTML validation** (for changed .razor/.html): run an HTML validator or equivalent linter.
     - **JS/TS** touched by the fix: run `tsc --noEmit` (if TS) and ESLint on modified files.
   - Block any build if these checks fail; report failures inline in the issue detail file with file:line pointers.

7) **Data & Environment Protocols:**
   - Use `KSESSIONS_DEV` for DB tests; never touch `KSESSIONS` (prod).
   - If EF Core, verify entities/relationships/migrations support the scenario; if Dapper/raw SQL, validate parameterization and row-count expectations.
   - Use environment-based connection settings; never log secrets.

8) **Concurrency & Resilience Checks:**
   - Validate async/await usage, cancellation tokens, idempotency, and duplicate-click/duplicate-submit guards.
   - Add log markers that reveal race conditions (task id/thread id + correlationId).

9) **UI Test Runner Protocol (VS Code):**
   - Use the Playwright Test Explorer UI (not ad-hoc CLI) for execution/debug screenshots and artifacts saved to TEMP folders.

10) **Debug Debris Cleanup (UPDATED):**
   - As fixes are approved, remove all `COPILOT-DEBUG:` logs and hardcoded values.
   - Ensure removal of these debug entries does not affect functional logging or code flow.
   - Leave TODO markers only where explicitly requested to remain.

---

## Multiple Issues Handling
- Process each block in order using the protocol above.
- Reuse a single running app instance for all UI tests in the batch.
- Produce a **consolidated summary** plus per-issue notes and evidence.

---

## Required Output (strict structure)
1. **Issue Interpretation:** existing/new; IDs assigned or referenced.
2. **Startup Validation Evidence:** brief note with timestamps/ports.
3. **Iteration Log:** bullet list of each diagnose→fix→test loop with **log excerpts** (redacted) and test outcomes.
4. **Changes Summary:** files touched, rationale, and risk assessment.
5. **Pre-Build Integrity Report:** duplicate code findings + HTML/JS/TS/Razor checks (pass/fail with file:line).
6. **Playwright Evidence:** tests added/updated, run results, and artifacts.
7. **Next Steps / Approval Gate:** what remains or confirm ready for user approval.

---

# 📌 Output Requirements (add-on)
- Always prepend the content of 'fixissue-checklist.prompt.md'
  at the top of each generated issue detail file.
- Fill in the checklist items as progress is made.
- Treat the checklist as a “do not skip” sequence.
