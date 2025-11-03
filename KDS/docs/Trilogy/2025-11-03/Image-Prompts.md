---
Trilogy-Version: 2025-11-03
Title: KDS Architecture Diagram Prompts (PR-Intelligence Edition)
Source: KDS/docs/The KDS Story/KDS-Diagram-Prompts.md
Includes-PR-Intelligence: true
Generated-By: kds.md document
Generated-At: 2025-11-03T00:00:00Z
---

# KDS Architecture Diagram Prompts (PR-Intelligence Edition)

The following prompts are copied from `KDS/docs/The KDS Story/KDS-Diagram-Prompts.md` and expanded to include PR intelligence. Use one prompt per image in your generator.

[BEGIN PROMPTS]

# KDS Architecture Diagram Prompts (Drop-In for ChatGPT Image Generator)

Use one prompt per section to generate a separate diagram. Keep names EXACT and visible on the diagram. Prefer a clean, engineering style: white background, high-contrast labels, thin vector lines, no gradients, and readable typography.

Global styling guidance:
- Color coding:
	- Universal Entry/Router: green
	- Specialist Agents: blue
	- Abstractions (DIP): orange
	- BRAIN and its storage tiers: purple
	- Storage files: gray
	- Events/logging flows: dashed dark gray
	- Data/control flows: solid black arrows with verb labels
- Layout: left-to-right where possible, with clear groupings and headings in the diagram.
- Label components with their real names and file references where shown (use backticks in labels, e.g., `intent-router.md`).
- Include a legend for colors and line styles.

---

## Prompt 1 — Universal Entry Point (Single Door) and High-Level Flow

Create a clean systems diagram titled “KDS Universal Entry Point.”

Depict:
- On the far left: A single green “One Door” labeled: `#file:KDS/prompts/user/kds.md` (Universal Entry). Caption: “Speak here in plain words.”
- Next to it: A green “Dispatcher (Router)” box labeled: `intent-router.md`.
- To the right: A horizontal row of blue specialist agents (each a separate box):
	- Planner `work-planner.md`
	- Executor `code-executor.md`
	- Tester `test-generator.md`
	- Validator `health-validator.md`
	- Governor `change-governor.md`
	- Error Corrector `error-corrector.md`
	- Session Resumer `session-resumer.md`
	- Screenshot Analyzer `screenshot-analyzer.md`
	- Commit Handler `commit-handler.md`
- On the far right: A purple “BRAIN” cluster (see Prompt 3 for internals). For this prompt, show the BRAIN as one grouped container labeled “BRAIN (Tiered Memory).”

Flows:
- Arrow from One Door → Router labeled “User request.”
- Arrows from Router → each agent labeled “Intent routing.”
- Arrows from agents → BRAIN labeled “Query + Learn.”
- Dashed arrows from all agents → gray file `events.jsonl` labeled “event logs.” Place `events.jsonl` near the Brain cluster as part of the system.

Legend:
- Colors and dashed vs solid lines as specified in Global styling.

---

## Prompt 2 — SOLID Specialist Agents and Abstractions (DIP)

Create a modular architecture diagram titled “KDS Specialist Agents (SOLID) + Abstractions.” Use story names + technical names together for clarity.

Depict:
- On the left: Green Dispatcher (Router) `intent-router.md`.
- Center: Blue agent boxes in a grid (each with a one-line role):
	- Planner (Work Planner) `work-planner.md` — “Create phases/tasks”
	- Builder (Executor) `code-executor.md` — “Implement step-by-step”
	- Tester (Test Generator) `test-generator.md` — “Generate and run tests”
	- Inspector (Validator) `health-validator.md` — “System health checks”
	- Governor (Change Governor) `change-governor.md` — “Review KDS changes”
	- Fixer (Error Corrector) `error-corrector.md` — “Halt, revert, correct”
	- Timekeeper (Session Resumer) `session-resumer.md` — “Resume where left off”
	- Analyst with a Lens (Screenshot Analyzer) `screenshot-analyzer.md` — “Extract requirements from images”
	- Archivist (Commit Handler) `commit-handler.md` — “Semantic commits and tags”
- Below them, an orange “Abstractions (DIP)” band with four orange nodes:
	- `session-loader`
	- `test-runner`
	- `file-accessor`
	- `brain-query`
- To the right, a purple “BRAIN (query)” port indicating agents consult BRAIN via `brain-query`.

Flows:
- Router → agents (solid arrows, “route by intent”).
- Agents ↔ Abstractions (solid arrows). Show that agents depend on abstractions, not concrete storage.
- Abstractions ↔ BRAIN (solid arrows via `brain-query`).
- Dashed arrows from agents to `events.jsonl` labeled “event logs”.

Legend:
- Emphasize “Single Responsibility” and “Dependency Inversion.”

---

## Prompt 3 — The Three‑Tier BRAIN

Create a layered diagram titled “KDS BRAIN: Three Tiers.”

Structure:
- A large purple container labeled “BRAIN.” Inside, three horizontal layers (top to bottom):
	1. Tier 3 — Development Context `development-context.yaml`
	2. Tier 2 — Knowledge Graph `knowledge-graph.yaml`
	3. Tier 1 — Conversation History `conversation-history.jsonl`
- Outside but adjacent: gray `events.jsonl` labeled “Raw event stream.”
- A purple process node: `brain-updater.md` between `events.jsonl` and the BRAIN layers.
- A purple node: `development-context-collector.md` connected to Tier 3 with a note: “Throttled: only if > 1 hour since last collection.”

Flows:
- Dashed arrows from agents → `events.jsonl` labeled “events.”
- Solid arrow `events.jsonl` → `brain-updater.md` → Tier 2 and Tier 1 (“process & consolidate”).
- Solid arrow from `brain-updater.md` → `development-context-collector.md` → Tier 3 (“refresh context when due”).
- A query port on the left of the BRAIN labeled “Router + Agents query BRAIN (context).”

Notes on the diagram:
- Tier 1 retains last 20 complete conversations (FIFO), active conversation never deleted.
- Tier 2 contains intent patterns, file relationships, workflow patterns.
- Tier 3 tracks velocity, hotspots, testing trends, correlations.

---

## Prompt 4 — End-to-End Workflow (A Day in KDS City)

Create a left-to-right sequence diagram titled “End-to-End Flow.” Use the story’s TDD order.

Participants and order:
User → `kds.md` (One Door) → Dispatcher (Router) → Planner → Tester (RED) → Builder (Executor, GREEN) → Tester → Inspector (Validator) → Archivist (Commit Handler) → Brain Updater → BRAIN

Messages:
1. User → `kds.md`: “I want to add a pulse animation to the FAB button.”
2. `kds.md` → Dispatcher (Router): “User request.”
3. Dispatcher → Planner: “PLAN intent.”
4. Planner → Tester (RED): “Acceptance criteria & initial checks (expected to fail).”
5. Tester (RED) → Builder (Executor): “Failing checks; implement.”
6. Builder (GREEN) → Tester: “Implementation done; re-run.”
7. Tester → Inspector (Validator): “All checks passing (GREEN).”
8. Inspector → Archivist (Commit Handler): “System health OK.”
9. Archivist → Git (implicit): “Semantic commit + optional tag.”
10. All agents → `events.jsonl` (dashed, asynchronous): “event logs.”
11. Brain Updater → BRAIN: “Update Tier 1/2, trigger Tier 3 (if > 1h).”

Annotations:
- Show that Timekeeper (Session Resumer) and Fixer (Error Corrector) can intercept: 
	- Fixer halts and reverts if wrong file.
	- Timekeeper resumes the next day with “continue.”

---

## Prompt 5 — Automatic Learning Triggers and Protections

Create a causal loop diagram titled “Automatic Learning Triggers.”

Depict:
- Counters and timers near `events.jsonl` (“≥ 50 events” and “≥ 24 hours since last update”).
- `brain-updater.md` node triggered by those conditions.
- A separate throttle note for Tier 3: “Collect if last_collection > 1 hour.”
- Show Rule #16 Step 5 “BRAIN health check” feeding the decision to update.
- Output arrows to: Tier 2 (Knowledge Graph updated), Tier 3 (Context refreshed), and routing accuracy improvement (“Router gets smarter next request”).

Legend:
- Use icons or small annotations for thresholds and time-based triggers.

---

## Prompt 6 — Development Context (Tier 3) Metrics

Create a dashboard-style diagram titled “Development Context Signals (Tier 3).”

Depict grouped metrics:
- Git Activity: commit history (30 days), change velocity/week, file hotspots, contributors.
- Code Changes: lines added/deleted, churn rate per file, stability classification.
- KDS Usage: sessions, intent distribution, success rates, test-first effectiveness.
- Testing: creation rate, pass/fail, flaky tests, coverage trends.
- Project Health: build status, deployment frequency, code quality, issue resolution time.
- Work Patterns: productive times, session duration, feature cycle time, focus duration.
- Correlations: commit size vs success, test-first vs rework, KDS usage vs velocity.

Arrows:
- From `development-context-collector.md` into this dashboard.
- From dashboard to callouts: “Proactive warnings,” “Estimates,” “Hotspots.”

Style:
- Minimal charts/icons; prioritize labeled boxes and simple arrows.

---

## Prompt 7 — Playwright Testing Protocol (Optional)

Create a compact protocol diagram titled “Playwright Testing Protocol (PowerShell).”

Depict:
- Start-Job (app launch) → Wait 20s/health check → Run `npx playwright test …` → Capture `$LASTEXITCODE` → Cleanup with Stop-Job/Remove-Job.
- Emphasize ID-based selectors and the component ID discovery step.

Notes:
- Show correct vs incorrect patterns briefly (IDs vs text selectors).

---

## Prompt 8 — Architecture-First Mandate (Optional)

Create a principles poster titled “Architecture-First Mandate.”

Depict:
- Do’s vs Don’ts with short bullets:
	- Do: create files in final locations, follow existing patterns.
	- Don’t: build monoliths and refactor later.
- A simple pipeline at the bottom: Discover → Pattern Match → Align → Propose.

Style:
- Poster-like, minimal text, strong headings.

---

## Prompt 9 — TDD Flow (Red → Green → Refactor)

Create a compact lifecycle diagram titled “KDS TDD Flow.”

Depict the sequence with distinct stages and brief captions:
- Planner: “Define acceptance criteria (what must be verified).”
- Tester (RED): “Write checks first; they fail initially.”
- Executor (GREEN): “Implement change to make checks pass.”
- Tester: “Re-run; all green.”
- Executor (REFACTOR): “Polish safely while tests stay green.”
- Validator: “System health OK.”
- Commit Handler: “Semantic commit + optional tag.”

Annotations:
- Add a callout: “TDD is enforced by design; test-first preferred.”
- Note: Router favors plans that include tests; health validator expects tests to run.

Style:
- Use a red/green/refactor color motif for the central loop.
- Keep arrows clear and minimal; emphasize the loop.

---

## Prompt 10 — PR Intelligence Overview (Local, Opt‑In)

Create a clean systems diagram titled “KDS PR Intelligence (Local, Opt‑In).”

Depict:
- On the left: a gray Git repository icon labeled “Local Git (no external APIs).”
- A purple process node `KDS/scripts/collect-pr-intelligence.ps1` (Collector).
- A purple config sheet `KDS/config/team-intelligence.yaml` (Opt‑In, Privacy, Throttle).
- A purple schema sheet `KDS/kds-brain/schemas/pr-intelligence-schema.yaml` (Shapes & rules).
- On the right: the BRAIN container with ports into Tier 2 (pr_patterns) and Tier 3 (pr_metrics).

Flows:
- Solid arrows from Git → Collector labeled “git log, merge commits, file stats.”
- Solid arrows from Config → Collector labeled “enable, anonymize, throttle.”
- Solid arrows from Schema → Collector labeled “validate shapes.”
- Solid arrows from Collector → BRAIN Tier 2/3 labeled “write pr_patterns / pr_metrics (throttled).”

Style spec:
- Palette: green (#1B8733) router, blue (#1E88E5) agents, purple (#6A1B9A) BRAIN, gray (#616161) files, dashed dark gray (#424242) events.
- Layout: left-to-right: Git → Collector → BRAIN, with Config/Schema above Collector.
- Typography: Segoe UI or Inter, 12–14 pt.

---

## Prompt 11 — PR Merge Detection Patterns

Create a diagram titled “Detecting PRs in Local History.”

Depict:
- A gray “git log” box feeding a decision diamond “PR Merge?”
- A box listing message patterns (examples):
	- “Merge pull request #123 …”
	- “PR-456: …”
	- “Merge branch … from feature/* to main”
- Output branches:
	- Yes → “PR Record” node with fields: id, title, authors, files, lines_added, lines_deleted, date.
	- No → “Skip.”

Flows:
- git log → decision → PR Record or Skip.
- Note: “Team detection toggles PR analysis” connected from `team-intelligence.yaml`.

Style spec:
- Palette per global; emphasize decisions with orange border.
- Show 2–3 sample commit lines as tiny gray notes.

---

## Prompt 12 — PR Collection → BRAIN (Tier 2/3)

Create a data flow diagram titled “Collector Writes PR Data to BRAIN.”

Depict:
- Collector `collect-pr-intelligence.ps1` in the center.
- Left inputs: Git (commits/files), Config (enable/privacy), Clock (throttle > 1h).
- Right outputs:
	- Tier 2 node: `knowledge-graph.yaml` (append `pr_patterns`).
	- Tier 3 node: `development-context.yaml` (update `pr_metrics`).

Flows:
- Throttle gate between Collector and Tier 3 with note: “only if last_collection > 1h.”
- Validation check against `pr-intelligence-schema.yaml` before writes.

Style spec:
- Layout: inputs (left) → collector (center) → outputs (right).
- Include a small “DryRun” toggle icon showing preview-only path.

---

## Prompt 13 — Team Detection & Privacy Controls

Create a control diagram titled “Team Mode & Privacy.”

Depict:
- Config `team-intelligence.yaml` with switches:
	- enable: true/false
	- team_auto_detect: true/false
	- anonymize_authors: true/false
	- max_history_days: 30
	- throttle_minutes: 60
- A decision: “Unique authors ≥ N?” → If yes, “Team Mode,” else “Solo Mode.”
- An “Anonymizer” box masking author names/emails when enabled.

Flows:
- Config → Collector.
- Team Mode → enable PR analysis; Solo Mode → optional.
- Anonymizer → PR Records before write.

Style spec:
- Use lock icon near anonymize; team icon near team_auto_detect.
- Keep settings readable as labeled key:value chips.

---

## Prompt 14 — Router/Planner/Executor use PR Signals

Create an integration diagram titled “Agents Use PR Intelligence.”

Depict:
- Blue agents: Router, Planner, Executor, Tester, Validator, Commit Handler.
- Purple BRAIN query port labeled “pr_patterns + pr_metrics.”
- Callouts:
	- Router: “Route with awareness of hotspots.”
	- Planner: “Estimate effort from PR sizes & rework trends.”
	- Executor: “Warn on risky files (high churn).”
	- Tester: “Prioritize flaky areas.”
	- Validator: “Gate on size/complexity thresholds.”
	- Commit Handler: “Suggest semantic PR tags.”

Flows:
- Agents ↔ BRAIN via `brain-query` abstraction.

Style spec:
- Grid layout of agents with a shared purple port to the right.
- Thin connectors; brief text in callouts.

---

## Prompt 15 — Tier 2 PR Patterns (Knowledge Graph)

Create a layered box titled “`knowledge-graph.yaml` → pr_patterns.”

Depict:
- Pattern nodes:
	- High Rework Files (file → PR count, rework ratio)
	- Collaboration Hotspots (file → unique authors)
	- Quality Indicators (PR size → post-fix probability)
- Edges to concrete files (examples with backticks) and tags (e.g., `ui`, `backend`).

Flows:
- From events/collector → pattern aggregations → stored as Tier 2 entries.

Style spec:
- Use orange labels on node types; purple container for Tier 2.
- Show 2–3 example entries.

---

## Prompt 16 — Tier 3 PR Metrics (Development Context)

Create a dashboard tile grid titled “`development-context.yaml` → pr_metrics.”

Depict tiles:
- PR Volume (30d): total, per week.
- Size Buckets: XS/S/M/L/XL distributions.
- Review Dynamics: avg reviewers, time-to-merge.
- File Impact: top 5 files by changes.
- Risk Alerts: threshold breaches (e.g., > 500 lines changed).

Flows:
- From Collector (throttled) → update context snapshot.

Style spec:
- Minimal bar/number tiles with labels; legible values, no gradients.

---

## Prompt 17 — Hotspot Analysis from PRs (File Churn)

Create a heatmap-style diagram titled “File Churn (PR‑derived).”

Depict:
- A list/map of files with intensity representing churn (lines changed, revisit frequency).
- Callouts for top 3 hotspots with brief reasons.

Flows:
- From Tier 2 patterns + Tier 3 metrics → visualization.

Style spec:
- Use a monochrome purple scale (#EDE7F6 → #6A1B9A).
- Keep labels exact with backticks for file paths.

---

## Prompt 18 — Collaboration Hotspots Map

Create a diagram titled “Collaboration Hotspots (Authors × Files).”

Depict:
- Bipartite view: authors (left) ↔ files (right).
- Edge thickness indicates number of PRs involving that pair.
- Annotations: “High coordination cost here.”

Flows:
- From pr_patterns.collaboration_hotspots.

Style spec:
- Keep author labels anonymized when privacy is on (e.g., “Author A”).

---

## Prompt 19 — Quality Indicators & Guardrails

Create a policy diagram titled “PR Size & Risk Guardrails.”

Depict:
- Threshold bars: lines_changed, files_changed, test_ratio, review_time.
- Colored zones: green within bounds, red beyond.
- Agent callouts:
	- Planner: “Split work if > L size.”
	- Validator: “Warn if tests missing for L/XL.”

Flows:
- From Tier 3 metrics → agent guidance.

Style spec:
- Simple gauge bars with labels; no numeric clutter.

---

## Prompt 20 — Governance & Protections (PR Data)

Create a safeguards diagram titled “Protections Around PR Intelligence.”

Depict:
- Switches: enable, anonymize, throttle, max_history_days.
- Validation: schema check (`pr-intelligence-schema.yaml`).
- Guard tasks: `validate-issue-67-protection`, privacy notes.

Flows:
- Config → Collector; Collector → BRAIN only when validations pass.

Style spec:
- Add a small shield icon near validations.

---

## Prompt 21 — Example Walkthrough: Feature PR Analysis

Create a storyboard titled “Example: FAB Pulse Feature PRs.”

Depict frames:
1) Developer opens PR (#215): files, size.
2) Collector detects merge; updates metrics.
3) Planner estimates a related follow-up using prior PR size.
4) Executor gets hotspot warning for `SPA/NoorCanvas/...`.
5) Validator checks guardrails; all good → merge.

Style spec:
- Five frames left-to-right with brief captions.

---

## Prompt 22 — Sequence: Collector DryRun vs Commit

Create a sequence diagram titled “PR Collector Modes.”

Participants and order:
Operator → Collector (DryRun) → Preview (files) → Operator → Collector (Commit) → Schema Validate → BRAIN (Tier 2/3)

Messages:
1. Operator: “Run with -DryRun.”
2. Collector → Preview: “Show would‑write.”
3. Operator: “Run with -Force.”
4. Collector → Schema: “Validate.”
5. Collector → BRAIN: “Persist pr_patterns / pr_metrics.”

Style spec:
- Use dashed border around DryRun path.

---

## Prompt 23 — PR Pattern + Metrics Overlay

Create a composite diagram titled “Patterns + Metrics Overlay.”

Depict:
- Left: Tier 2 pattern nodes (rework files, collaboration hotspots).
- Right: Tier 3 metric tiles (size buckets, review time).
- Center overlay: “Recommendations” box linking specific patterns to actions.

Flows:
- Arrows from patterns and metrics into recommendations, then to agents.

Style spec:
- Slight drop shadow only for the central overlay; keep others flat.

[END PROMPTS]


