# Lesson: Remove dead SignalR code and unused client fields to prevent confusion and compiler warnings. Use Playwright implementation comparison tests to validate architecture decisions.

# Ledger Entry
timestamp: 2024-12-13T10:35:00Z
agent: GitHub Copilot
key: canvas
actions: SignalR cleanup (removed unused _hubConnection, dead JS code)
rationale: Prevent confusion, resolve compiler warnings, preserve working SignalR features
state/artifacts links: Workspaces/TEMP/state/canvas/
---
applyTo: "**"
description: Self-learning, context-first workspace rules for Copilot Chat. Tailored for Noor Canvas app. Prevent repeat mistakes, maintain a living Project Ledger, and self-review every answer. Keep lean; reference linked docs for details.
---

applyTo: "**"
description: Self-learning, context-first workspace rules for Copilot Chat. Tailored for Noor Canvas app. Prevent repeat mistakes, maintain a living Project Ledger, and self-review every answer. Keep lean; reference linked docs for details.
---

# SelfAwareness — Global Operating Guardrails

> North Star: Prevent repeat mistakes, preserve working behavior, and make future runs faster and smarter.

---

## 0) Scope & Authority
These instructions govern all Noor Canvas agents:
- `/workitem`, `/sync`, `/cleanup`, `/pwtest`, `/imgreq`
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
  `.\nc.ps1` → launch only  
- Build + run with:  
  `.\ncb.ps1` → clean/build/launch (then `.\nc.ps1` if needed)  
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
Update `.MD` docs under `.github` for all major changes. `/sync` harmonizes docs, trackers, requirements.  

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
