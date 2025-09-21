---
applyTo: "**"
description:   Self-learning, context-first workspace rules for Copilot Chat. Tailored for Noor Canvas app. Prevent repeat mistakes, maintain a living Project Ledger, and self-review every answer. Keep lean; reference linked docs for details.
---



# Copilot Self-Learning Instructions – NOOR CANVAS (Unified Core)

## Always start with context
- Read recent chat + key repo files (`README`, configs, migrations, env keys, contracts).
- Maintain/update **Project Ledger** (stack, ports, DBs, tokens, testing rules, design notes).
- For details, reference:
  - `.github/engineering-standards.md` → coding standards, CI/CD, testing practices
  - `.github/NOOR-Canvas-Mock-Implementation-Guide.md` → pixel-perfect design guide
  - `ncImplementationTracker.MD` → history, milestones, lessons learned
  - `.github/ncIssueTracker.MD` → open issues, TODOs, resolutions

## Core Project Essentials
- **Stack:** ASP.NET Core 8.0 + Blazor Server + SignalR + SQL Server
- **App Path:** `SPA/NoorCanvas/`
- **Ports:** 9090 (HTTP), 9091 (HTTPS), 8050 (Docs), 8080 reserved
- **Databases:**  
  - `canvas.*` → Sessions, Registrations, Questions, Annotations, SecureTokens  
  - `KSESSIONS_DEV.dbo.*` → Islamic content (read-only in dev)  
  - `SessionTranscripts` → transcripts (nvarchar(MAX))  
- **Tokens & URLs:**  
  - 8-char friendly tokens (e.g., USER223A, IIZVVHXI)  
  - Host: `/host/control-panel/{hostToken}`  
  - User: `/user/landing/{token}`  
- **Design Standards:**  
  - Colors: Blue `#3B82F6`, Purple `#8B5CF6`; Font: Inter  
  - Logos inside cards; RTL support required  
  - Pixel-perfect compliance (≥95%) → see design guide
- **Testing:**  
  - Playwright + TypeScript, **VSCode Test Explorer only**  
  - Issue-specific test suites (e.g., issue-114, issue-121)  
  - Reports/artifacts → `Workspaces/TEMP/playwright-report`
  - **CRITICAL:** NEVER run Playwright tests without pre-flight validation  
    (see `PLAYWRIGHT-EXECUTION-GUARDRAILS.md`)

## Do / Don’t Log
**Do**
- Check if app is running before launch.  
- Use `KSESSIONS_DEV` only in dev.  
- Respect branding & panel alignment (50%/50%).  
- Load dropdowns **after** token validation.  
- Validate transcripts via DB, not placeholders.  
- Use `Simplified` schema for all new features (deprecate legacy schema).  
- When mock data is used, flag it clearly in summaries.  
- Ensure remote server is running before commands (`Start-Sleep 5; Invoke-WebRequest`).  
- Always validate DB connections, handle errors, and prefer reading over mock generation.  
- Apply incremental changes; consult git history before fixes.  

**Don’t**
- Don’t run multiple servers on 9090/9091.  
- Don’t touch prod DB (`KSESSIONS`) in dev.  
- Don’t run Playwright tests from terminal.  
- Don’t hardcode tokens/transcripts.  
- Don’t auto-mark issues/TODOs resolved.  
- Don’t start Playwright tests without validating app readiness.  
- Don’t use `curl -k`; prefer `Invoke-WebRequest`.  
- Don’t commit sloppy filenames (`new`, `fixed`, `temp`, `backup`).  

## Guardrails
- Ask before destructive actions (kill, clear TEMP, bypass hooks).  
- Never bypass tracker validation (`validate-tracker-consistency.ps1`) without approval.  

## Self-Review (every answer)
- Did I answer exactly what was asked?  
- Could reading replace running?  
- Did I repeat a mistake? → add to “Don’t”.  
- Leave 1–3 reminders for next turn.  

## Output shape
1. **Plan** – steps  
2. **Context Evidence** – files/lines used  
3. **Action** – idempotent commands or edits  
4. **Result** – expected outcome  
5. **Self-Review** – checklist  
6. **Project Ledger** – updated snapshot  

---

# 📝 Narrative Summary & Recommendations
At the end of every run, provide a **plain-English explanation** of:
- What was found in the context (code, DB, logs, config).  
- What actions were taken or proposed.  
- Any risks, concerns, or gaps discovered.  
- Clear **recommendations for next steps** (e.g., “Validate with staging DB”, “Add retry guard”, “Refactor duplicated component”, “Confirm pixel-perfect compliance”).  
- Mention explicitly if **mock data** was used and that it does not represent real production data.  
ONS_DEV.dbo.*` → Islamic content (read-only in dev)  
  - `SessionTranscripts` → transcripts (nvarchar(MAX))  
- **Tokens & URLs:**  
  - 8-char friendly tokens (e.g., USER223A, IIZVVHXI)  
  - Host: `/host/control-panel/{hostToken}`  
  - User: `/user/landing/{token}`  
- **Design Standards:**  
  - Colors: Blue `#3B82F6`, Purple `#8B5CF6`; Font: Inter  
  - Logos inside cards; RTL support required  
  - Pixel-perfect compliance (≥95%) → see design guide
- **Testing:**  
  - Playwright + TypeScript, **VSCode Test Explorer only**  
  - Issue-specific test suites (e.g., issue-114, issue-121)  
  - Reports/artifacts → `Workspaces/TEMP/playwright-report`
  - **CRITICAL:** NEVER run Playwright tests without pre-flight validation  
    (see `PLAYWRIGHT-EXECUTION-GUARDRAILS.md`)

## Do / Don’t Log
**Do**
- Check if app is running before launch.  
- Use `KSESSIONS_DEV` only in dev.  
- Respect branding & panel alignment (50%/50%).  
- Load dropdowns **after** token validation.  
- Validate transcripts via DB, not placeholders.  
- Use `Simplified` schema for all new features (deprecate legacy schema).  
- When mock data is used, flag it clearly in summaries.  
- Ensure remote server is running before commands (`Start-Sleep 5; Invoke-WebRequest`).  
- Always validate DB connections, handle errors, and prefer reading over mock generation.  
- Apply incremental changes; consult git history before fixes.  

**Don’t**
- Don’t run multiple servers on 9090/9091.  
- Don’t touch prod DB (`KSESSIONS`) in dev.  
- Don’t run Playwright tests from terminal.  
- Don’t hardcode tokens/transcripts.  
- Don’t auto-mark issues/TODOs resolved.  
- Don’t start Playwright tests without validating app readiness.  
- Don’t use `curl -k`; prefer `Invoke-WebRequest`.  
- Don’t commit sloppy filenames (`new`, `fixed`, `temp`, `backup`).  

## Guardrails
- Ask before destructive actions (kill, clear TEMP, bypass hooks).  
- Never bypass tracker validation (`validate-tracker-consistency.ps1`) without approval.  

## Self-Review (every answer)
- Did I answer exactly what was asked?  
- Could reading replace running?  
- Did I repeat a mistake? → add to “Don’t”.  
- Leave 1–3 reminders for next turn.  

## Output shape
1. **Plan** – steps  
2. **Context Evidence** – files/lines used  
3. **Action** – idempotent commands or edits  
4. **Result** – expected outcome  
5. **Self-Review** – checklist  
6. **Project Ledger** – updated snapshot  

---

# 📝 Narrative Summary & Recommendations
At the end of every run, provide a **plain-English explanation** of:
- What was found in the context (code, DB, logs, config).  
- What actions were taken or proposed.  
- Any risks, concerns, or gaps discovered.  
- Clear **recommendations for next steps** (e.g., “Validate with staging DB”, “Add retry guard”, “Refactor duplicated component”, “Confirm pixel-perfect compliance”).  
- Mention explicitly if **mock data** was used and that it does not represent real production data.  
