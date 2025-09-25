---
applyTo: "**"
description: Self-learning, context-first workspace rules for Copilot Chat. Tailored for Noor Canvas app. Prevent repeat mistakes, maintain a living Project Ledger, and self-review every answer. Keep lean; reference linked docs for details.
---

# SelfAwareness — Global Operating Guardrails

> North Star: Prevent repeat mistakes, preserve working behavior, and make future runs faster and smarter.

---

## 0) Scope & Authority
These instructions govern all Noor Canvas agents:
- `/workitem`, `/retrosync` (formerly `/sync`), `/cleanup`, `/pwtest`, `/imgreq`, `/continue`
- Any future agents

Where conflicts arise, **SelfAwareness prevails** unless the user explicitly overrides.

---

## 1) Global Watchdog Requirement
All agents MUST have a watchdog for long-running tasks.

Defaults:
- `idle_seconds_threshold`: 120
- `graceful_stop_timeout_seconds`: 10
- `max_retries`: 1

Behavior:
- If idle > threshold:
  - Capture last 2000 bytes of stdout/stderr and process snapshot.
  - Attempt graceful stop; if still stuck, force kill after timeout.
- Record a `watchdog_event` in:
  - `progress.log.jsonl`
  - `artifacts.json`
- Retry once (idempotent).  
- If still hung → fail with status `watchdog_hang` and pointers to artifacts.

---

## 2) Mandatory Inputs to Consult (every run)
1. **Per-Key State**  
   Path: `NOOR CANVAS\Workspaces\Copilot\{key}\`  
   Files: `run.json`, `plan.json`, `progress.log.jsonl`, `checkpoint.json`, `artifacts.json`  
   Must resume from `checkpoint` if present. Keep state files up to date on exit.  

2. **Requirements-{key}.MD** (from `/imgreq`)  
   Authoritative functional requirements.  

3. **Operational Lessons**  
   `Cleanup-<key>.MD` (or `Cleanup-Global.MD`)  

4. **Design & Trackers**  
   `Workspaces/Documentation/IMPLEMENTATIONS/NOOR-CANVAS-DESIGN.MD`  
   `Workspaces/Documentation/IMPLEMENTATIONS/ncImplementationTracker.MD`  
   `IssueTracker/ncIssueTracker.MD`  

5. **Policy & Schema Guardrails**  
   `.github/instructions/SelfAwareness.instructions.md` (this file)  
   DB/schema constraints (KSESSIONS_DEV read-only unless explicitly allowed)  

6. **Technical Docs in `.github`**  
   Any `D:\PROJECTS\NOOR CANVAS\.github\*.MD`

---

## 3) State & Resumability
- Always **check per-key state first**.  
- Resume from `checkpoint.json`.  
- After each step: update logs, checkpoint, artifacts.  
- If plan changes, version as `plan-v{n}.json`.  

---

## 4) Execution Rules
- Start app with:  
  `.\Workspaces\Global\nc.ps1` → launch only  
- Build + run with:  
  `.\Workspaces\Global\ncb.ps1` → clean/build/launch (then `.\Workspaces\Global\nc.ps1` if needed)  
- Debug logs: `[DEBUG-WORKITEM:{key}:{layer}]`.  
- Ports 9090/9091, auth/token handling must be correct.  
- Schema drift only when explicitly allowed.

---

## 5) Git History First-Aid
Check regressions vs new code; restore last-known-good or fix forward. Document rationale.  

---

## 6) Requirements Discipline
If `Requirements-{key}.MD` exists, it is **authoritative**. Map changes and tests to its numbered requirements.  

---

## 7) Testing & Verification
Use headless Playwright tests (`/pwtest`). Capture artifacts for failures. Cover UI/API/DB + requirements mapping.  

---

## 8) Documentation & Alignment
Update `.MD` docs under `.github` for all major changes. `/retrosync` harmonizes docs, trackers, requirements.  

---

## 9) Cleanup & Learning Loop
`/cleanup` mines lessons, updates instructions, produces cleanup docs, and aligns them.  

---

## 10) Approval & Final Summary
All agents must show an approval gate and summarize:  
- What was asked, implemented, rationale, test plan, files touched, and resume info.  

---

## 11) Safety & Non-Negotiables
- No destructive DB changes on protected datasets unless user directs.  
- No secret leaks. Use placeholders.  
- Structured diffs only.  
- Respect user constraints.  

---

## 12) Ledger
Agents must append ledger entries: timestamp, agent, key, actions, rationale, state/artifacts links.  

---

## 13) Quick Checklist
- [ ] Loaded per-key state (`NOOR CANVAS\Workspaces\Copilot\{key}\`)  
- [ ] Consulted Requirements-{key}.MD  
- [ ] Reviewed Cleanup docs  
- [ ] Confirmed nc.ps1/ncb.ps1 instructions + watchdog  
- [ ] Planned with test plan contract  
- [ ] Will keep state current and write final summary

---

## 14) Context Indexing (per-key)

**Goal:** Build and maintain a compact, machine-oriented index of all relevant context for a given {key} to reduce token usage, prevent drift, and speed up multi-agent handoffs.

- **Path (durable):** `NOOR CANVAS\Workspaces\Copilot\{key}\index\`  
- **Files:**
  - `context.idx.json`         # manifest + doc fingerprints + salience + xrefs
  - `context.pack.jsonl`       # lossy, compact chunk summaries (one JSON per line), sorted by salience
  - `context.delta.json`       # diff since last run (added/removed/changed refs)
  - `context.sources.json`     # absolute/relative source paths + timestamps/hashes

**Build Rules:**
- Prefer **delta-indexing**:
  1) Collect candidates: Requirements-{key}.MD, `.github/Workitem-{key}.MD`, `.github/Test-{key}.MD`, `Cleanup-<key>.MD`, retrosync outputs, recent diffs, and any files touched in the last N commits relevant to {key}.
  2) Chunk semantically (~800–1200 chars), normalize whitespace, strip boilerplate.
  3) Hash each chunk; reuse summaries if hash unchanged.
  4) Summarize per chunk (machine-first; minimal prose):
     - `who/what/where/when` (entities, file paths, timestamps)
     - `claims` (facts/assertions)
     - `contracts` (interfaces, routes, selectors, SQL, test names)
     - `open_questions`
  5) Update `context.idx.json` (manifest + salience + xrefs), `context.pack.jsonl` (summaries), `context.delta.json` (diff).

**Rebuild When:**
- Index missing/corrupted, schema/prompt scaffolding changed, or major Requirements-{key}.MD bump.

**Salience Scoring (0–1):**
- +0.3 direct {key} mention; +0.2 `.github/*{key}*.MD`; +0.2 edited <48h; +0.2 referenced by high-salience chunk; −0.2 archived/legacy.

**Agent Contract:**
- **All agents MUST:**
  - Load `context.idx.json` (if present) before planning.
  - Prefer `context.pack.jsonl` chunks for planning tokens over raw files.
  - Write `context.delta.json` after runs.
  - Append new docs to `context.sources.json`.

**Guardrails:**
- Index is not the source of truth—**Requirements-{key}.MD** wins on conflict.
- Keep index ≤ 500 KB; evict least-salient chunks if needed.
