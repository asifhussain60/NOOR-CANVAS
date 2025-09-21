# Noor Canvas – GitHub Copilot Self-Learning & Engineering Protocols

**Scope:**  
Self-learning, context-first workspace rules for Copilot Chat tailored to the Noor Canvas app.  
Prevent repeat mistakes, maintain a living Project Ledger, enforce explicit approval for issue resolution, and self-review every answer.

_Last Updated: September 20, 2025_

---

## Always Start with Context

- Read recent chat + key repo files (`README`, configs, migrations, env keys, contracts).
- Maintain/update **Project Ledger** (stack, ports, DBs, tokens, testing rules, design notes).
- For detailed guidance, reference:
  - `.github/engineering-standards.md` → coding standards, CI/CD, testing practices
  - `.github/NOOR-Canvas-Mock-Implementation-Guide.md` → pixel-perfect design guide
  - `ncImplementationTracker.MD` → implementation history, milestones, lessons learned
  - `IssueTracker/ncIssueTracker.MD` → issues, TODOs, lessons learned

---

## Project Overview

**Islamic Content Sharing Platform** – Real-time collaborative learning with live annotations, Q&A, and session management.

- **Stack:** ASP.NET Core 8.0 + Blazor Server + SignalR + SQL Server
- **Main App Path:** `SPA/NoorCanvas/`
- **Ports:** 9090 (HTTP), 9091 (HTTPS), 8050 (Docs), 8080 reserved
- **Databases:**
  - `canvas.*` – Sessions, Registrations, Questions, Annotations, SecureTokens
  - `KSESSIONS_DEV.dbo.*` – Islamic content (read-only in dev)
  - `SessionTranscripts` – transcripts (nvarchar(MAX))

**SignalR Hubs:** SessionHub, AnnotationHub, QAHub → all follow `"Session_{sessionId}"` pattern.

---

## Standards & Guardrails

### ✅ Do

- Check if app is already running before launch.
- Use `KSESSIONS_DEV` in dev; never prod DB.
- Respect branding: Blue `#3B82F6`, Purple `#8B5CF6`, Inter font, RTL required.
- Load countries dropdown **after** token validation.
- Validate transcripts against DB, not placeholders.
- Prefer existing data over mock data; if mock used, flag in summary.
- Apply incremental changes; validate DB connections before queries.
- Use proper error handling/logging; professional filenames only.
- Keep TEMP workspace for experimental/debug files.

### ❌ Don’t

- Don’t run multiple servers on 9090/9091.
- Don’t hardcode tokens/transcripts.
- Don’t run Playwright UI tests from terminal (Test Explorer only).
- Don’t auto-mark TODOs/issues as resolved.
- Don’t bypass tracker validation or validation hooks without approval.
- Don’t use curl for HTTPS; prefer `Invoke-WebRequest` after server check.
- Don’t use unprofessional file names (`new`, `fixed`, `temp`).

### 🔒 Critical Guardrails

- Ask before destructive actions (kill, clear TEMP, bypass hooks).
- Never bypass `validate-tracker-consistency.ps1` without approval.
- All Playwright UI testing must be run **via VSCode Test Explorer** only.

---

## Issue Resolution Protocol

### **CRITICAL RULE:**

**Never mark issues as resolved without explicit user approval.**

- **Violation Alert (Sep 17, 2025):** Copilot auto-closed issues against instructions. Protocol now enforced globally.

#### Workflow

1. **Complete Technical Work** – Implement, test, validate, ensure build success.
2. **Document Progress** – Update issue tracker, note findings, blockers, implementation details.
3. **Present Findings** – Summarize what was done, show evidence (builds, tests, screenshots).
4. **Wait for User Confirmation** – Only accept phrases like:
   - “mark as resolved”
   - “approve this resolution”
   - “this is complete”
   - “close this issue”  
     Never assume approval from positive feedback.
5. **Only Then Update Status** – Change from `ACTIVE` → `RESOLVED` with resolution date and notes.

#### Status Indicators

- `ACTIVE` – Work in progress
- `ACTIVE - AWAITING USER APPROVAL` – Technical work complete, awaiting approval
- `RESOLVED` – Only after explicit approval
- `DEFERRED` – User postponed
- `CANCELLED` – User decided not to proceed

---

## Self-Review (Every Answer)

- Did I answer exactly what was asked?
- Could reading logs/files replace running commands?
- Did I repeat a mistake? → Add to **Don’t** list.
- Provide 1–3 reminders for the next turn.
- Ensure issue status is **never advanced without explicit approval**.

---

## Output Shape

1. **Plan** – steps
2. **Context Evidence** – files/lines referenced
3. **Action** – idempotent commands/edits
4. **Result** – expected outcome
5. **Self-Review** – checklist
6. **Project Ledger** – updated snapshot

---

## Quick Commands (Workspaces/Global/)

```powershell
nc 215             # Session: token + build + launch
nc                 # Generic build + launch
nct create 123     # Standalone token generation
ncdoc              # Documentation (port 8050)
iiskill            # Process cleanup
```
