---
applyTo: "**"
description: Self-learning, context-first workspace rules for Copilot Chat. Tailored for Noor Canvas app. Prevent repeat mistakes, keep a living Project Ledger, and self-review every answer.
---

# Copilot Self-Learning Instructions – NOOR CANVAS

## Always start with context
- Before answering, scan recent chat + key repo files (`README`, configs, schema, migrations, docker-compose, env keys, API contracts).
- Maintain a **Project Ledger** with:
  - **Stack:** ASP.NET Core 8.0 + Blazor Server + SignalR + SQL Server
  - **Main App:** `SPA/NoorCanvas/`
  - **Ports:** 9090 (HTTP), 9091 (HTTPS), 8050 (Docs), 8080 reserved (don’t use)
  - **Databases:**  
    - `canvas.*` – app data  
    - `KSESSIONS_DEV.dbo.*` – Islamic content (read-only, dev only)  
    - `KSESSIONS` (prod) – forbidden in dev  
  - **SignalR Hubs:** `SessionHub`, `AnnotationHub`, `QAHub` using `Session_{sessionId}` groups
  - **Logging:** Serilog with `NOOR-{COMPONENT}: {message}` format
  - **Design Standards:**  
    - Colors: Blue `#3B82F6`, Purple `#8B5CF6`  
    - Font: Inter  
    - CSS prefix: `.noor-*`, inline styles in Razor views  
    - Branding header + logo mandatory in every view  
    - RTL support required (Arabic/Urdu)  
    - Follow `.github/NOOR-Canvas-Mock-Implementation-Guide.md`  
  - **Testing:**  
    - Playwright + TypeScript (UI tests)  
    - Run ONLY via VSCode Playwright Test Explorer  
    - Reports/artifacts → `Workspaces/TEMP/playwright-report`, `test-artifacts`, `traces`
  - **Commands:**  
    - `nc <sessionId>` – build + launch (HTTPS 9091)  
    - `ncdoc` – docs on 8050  
    - `iiskill` – cleanup  
    - `validate-tracker-consistency.ps1` – mandatory pre-commit validation  

## Do / Don’t Log
Keep this updated as you work.

**Do**
- Check if app is already running before launching (`iiskill`, `lsof -i :9091`).
- Always use **`KSESSIONS_DEV`** in dev (never prod).
- Insert NOOR branding + inline styles in `.razor` views.
- Use repo scripts (`nc`, `ncdoc`, validation) instead of ad-hoc commands.
- Add 2–3s delays (`Start-Sleep`) between build/test steps to prevent hangups.

**Don’t**
- Don’t run multiple servers on 9090/9091.
- Don’t access `KSESSIONS` (prod DB) in dev.
- Don’t run Playwright tests from terminal (Test Explorer only).
- Don’t auto-mark issues resolved — wait for explicit approval.
- Don’t expose or modify secrets.

## Guardrails
- Ask before destructive actions (kill, clear TEMP, schema migrations, bypassing validation).
- Never bypass `.hooks/validate-tracker-consistency.ps1` unless explicitly approved.

## Self-Review (end of every answer)
Add a short **Self-Review**:
- Did I answer exactly what was asked?
- Could I have solved it by reading instead of running?
- Did I repeat a past mistake? If yes, add a new “Don’t.”
- List 1–3 reminders for next turn.

## Output shape
Structure replies as:
1. **Plan** – steps (read first → run later)
2. **Context Evidence** – files/lines used
3. **Action** – minimal, idempotent commands or code edits
4. **Result** – expected outcome or what to check
5. **Self-Review**
6. **Project Ledger** – updated snapshot with Noor Canvas info

---

### Seeded Do/Don’t Examples

**Do**
- Run `validate-tracker-consistency.ps1` before commits.
- Confirm HTTPS 9091 for launches (not 8080).
- Use Test Explorer for UI tests.

**Don’t**
- Don’t relaunch if service is already bound to 9091.
- Don’t clear TEMP folder structure (only contents).
- Don’t invent schema or bindings without checking source files.
