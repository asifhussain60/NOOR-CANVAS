mode: agent
name: retrospect
alias: /retrospect
version: 1.0

# ──────────────────────────────────────────────────────────────────────────────

# Retrospective Prompt – Usage Examples

#

# This prompt runs a retrospective on the current thread, extracting lessons and adding

# guardrails to fixissue/implement prompt files. It ensures alignment with

# NOOR-CANVAS-DESIGN.MD and nc-Implementation.md.

#

# Examples:

#

# 1. Dry run (review diffs first, don’t apply automatically):

# /retrospect notes: "Timer used old KSESSIONS date 2020-10-26; check time formatting functions" auto_apply: false

#

# 2. Apply directly to both fixissue and implement prompt files:

# /retrospect notes: "Generalize from neighboring commands too" filesToUpdate: "#file:fixissue.prompt.md,#file:implement.prompt.md" auto_apply: true

#

# 3. Limit lookback to last 72 hours:

# /retrospect notes: "Investigate environment variable mismatch" lookback: "72h"

#

# 4. Use only implement prompt file and wait for approval:

# /retrospect notes: "Check cache-busting rules" filesToUpdate: "#file:implement.prompt.md" auto_apply: false

# ──────────────────────────────────────────────────────────────────────────────

description: |
Run a focused retrospective on this thread. Read thread history, #Workspaces, and #terminalLastCommand
to reconstruct what happened (esp. around time/date bugs). Identify why issues were missed, extract
improvement rules, and update local prompt files with repeatable guardrails. Ensure all findings and
improvement rules are aligned with the architectural and implementation guidance defined in
**NOOR-CANVAS-DESIGN.MD** and **nc-Implementation.md**.

parameters:

- name: notes
  description: >
  Optional free-text notes or seed examples to scrutinize (e.g.,
  "timer used old KSESSIONS date 2020-10-26"). Can be a list.
- name: filesToUpdate
  description: Comma-separated list of #file: targets to update with prevention rules.
  default: "#file:fixissue.prompt.md, #file:implement.prompt.md"
- name: auto_apply
  description: >
  If true, write changes directly; if false, propose diffs and wait for explicit approval.
  default: false
- name: lookback
  description: How far back to read (e.g., "all", "72h", "100 messages").
  default: "all"

# ──────────────────────────────────────────────────────────────────────────────

# EXECUTION PLAN

# ──────────────────────────────────────────────────────────────────────────────

steps:

- title: Gather context
  run: |
  1. Read the conversation/thread history (respect {lookback}).
  2. Open #Workspaces state and recent entries.
  3. Inspect #terminalLastCommand and surrounding commands.
  4. Collect artifacts: linked diffs, stack traces, logs, timestamps, environment notes.
  5. Build a concise timeline of key actions and observations (UTC and local time).
  6. Cross-check assumptions with **NOOR-CANVAS-DESIGN.MD** and **nc-Implementation.md**.

- title: Reconstruct the incident
  run: |
  1. Identify the primary failure(s) and when they first appeared.
  2. For the timer example (if present in {notes} or history):
     - Detect use of stale constants (e.g., KSESSIONS date 2020-10-26).
     - Trace time formatting/parsing functions used.
     - Map data sources (server time, client time, DB time, TZ offsets, DST rules).
  3. List _signals we ignored_ (warnings, odd logs, mismatched timestamps, failing health checks).
  4. Validate if design/implementation guidance was followed per **NOOR-CANVAS-DESIGN.MD** and **nc-Implementation.md**.

- title: Root-cause + why-we-missed-it analysis
  run: |
  For each failure, answer:
  - What was the immediate cause?
  - What systemic gap allowed it through? (missing guardrail, weak test, poor checklist, unclear owner)
  - What _earlier clue_ should have triggered an investigation?
  - What practice would have caught it at PR time or at run time?
  - Were any relevant design principles or implementation standards from **NOOR-CANVAS-DESIGN.MD** or **nc-Implementation.md** overlooked?

- title: Learn from adjacent commands
  run: |
  Scan neighboring commands / actions in history to generalize patterns:
  - Stale env/config reuse after re-deploy or branch switch
  - Assumptions about default locale/timezone
  - Caching of computed dates or feature flags
  - Flaky readiness/race due to missing health checks

- title: Produce Improvement Rules (actionable)
  run: |
  Output a deduplicated checklist + snippets. Each rule must be:
  - Specific (exact command, assertion, or code snippet)
  - Automatable (test, CI check, lint, or preflight script)
  - Tagged (e.g., [time], [env], [readiness], [cache])
  - Explicitly aligned with **NOOR-CANVAS-DESIGN.MD** and **nc-Implementation.md** where applicable.

- title: Update prompt files
  run: |
  For each file in {filesToUpdate}: 1) Insert or update a section "## Regression Guards – Time & Configuration". 2) Append the new rules beneath, ensuring idempotent anchors (do not duplicate rules). 3) Add a short "Rationale" with a one-paragraph incident summary. 4) Note explicitly how the updates align with **NOOR-CANVAS-DESIGN.MD** and **nc-Implementation.md**.
  If {auto_apply} is false, generate unified diffs for approval instead of writing.

- title: Deliverables
  run: |
  - Retrospective Summary (300–600 words): what happened, why we missed it, key lessons.
  - Timeline table with clock times, TZ, and source of truth (client/server/DB).
  - Improvement Rules checklist (ready to paste into prompt files).
  - Either (A) Diffs to apply, or (B) Confirmation of applied changes with anchors.
  - Explicit alignment notes referencing **NOOR-CANVAS-DESIGN.MD** and **nc-Implementation.md**.

# ──────────────────────────────────────────────────────────────────────────────

# HEURISTICS & GUARDS (to paste into target files when applicable)

# ──────────────────────────────────────────────────────────────────────────────

rule_templates:

- tag: [time]
  title: Enforce a single Time Source of Truth
  body: |
  - Always derive "now" from the agreed source (e.g., server DB `UTC_NOW`)—never from hard-coded dates.
  - Explicitly annotate timezone and DST handling in code and tests.
  - For timers: verify start, end, and _computation base_ are from the same source.
  - Ensure this approach is consistent with **NOOR-CANVAS-DESIGN.MD** guidelines.
- tag: [time]
  title: Assert no stale constants in time logic
  body: |
  - Disallow constants matching date patterns in timer/expiry code via lint/grep in CI.
  - Add unit tests that fail if a fixed historical date is used for current comparisons.
  - Confirm enforcement aligns with **nc-Implementation.md** standards.
- tag: [env]
  title: Environment sanity check before reproduce/fix
  body: |
  - Print branch, commit, build time, NODE_ENV/ASPNETCORE_ENVIRONMENT, and app version.
  - Diff `.env*` against sample; ensure secrets loaded; log clock skew between client and server.
  - Follow environmental practices noted in **NOOR-CANVAS-DESIGN.MD**.
- tag: [readiness]
  title: Lightweight readiness checks in tests
  body: |
  - After launch, wait for health endpoints and key selectors; assert expected title/role present.
  - Fail fast on missing migrations or 5xx in console logs.
  - Cross-reference readiness strategies in **nc-Implementation.md**.
- tag: [cache]
  title: Bust caches when time is central
  body: |
  - Clear local/session storage; disable HTTP cache in test; include cache-busting query for static assets.
  - Validate caching policy with **NOOR-CANVAS-DESIGN.MD** principles.

# ──────────────────────────────────────────────────────────────────────────────

# OUTPUT FORMAT

# ──────────────────────────────────────────────────────────────────────────────

outputs:

- name: retrospective_summary
  description: Paragraph summary of findings and recommendations in plain English.
- name: timeline
  description: Markdown table with event, local time, UTC time, source (client/server/DB), and evidence link.
- name: improvement_rules
  description: Markdown list grouped by tags, deduplicated.
- name: changes
  description: Either unified diffs or confirmation notes with anchors if {auto_apply}=true.

# ──────────────────────────────────────────────────────────────────────────────

# SAFETY & APPROVAL

# ──────────────────────────────────────────────────────────────────────────────

policies:

- Never mark issues as resolved without explicit user approval.
- If {auto_apply}=false (default), do not write to files—propose diffs.
- Ensure idempotency: re-running should not duplicate rules or anchors.
- Keep edits localized under the section header to minimize merge conflicts.
- Always verify alignment with **NOOR-CANVAS-DESIGN.MD** and **nc-Implementation.md** before applying.

# ──────────────────────────────────────────────────────────────────────────────

# EXAMPLE INVOCATIONS

# ──────────────────────────────────────────────────────────────────────────────

examples:

- "/retrospect notes: 'Timer used old KSESSIONS date 2020-10-26; check time formatting functions' auto_apply: false"
- "/retrospect notes: 'Generalize from neighboring commands' filesToUpdate: '#file:fixissue.prompt.md,#file:implement.prompt.md' auto_apply: true"
