---
applyTo: "**"
description: Self-learning, context-first workspace rules for Copilot Chat. Tailored for Noor Canvas app. Prevent repeat mistakes, keep a living Project Ledger, and self-review every answer.
---

---
applyTo: "**"
mode: agent
name: contextAware
description: Self-learning, context-first workspace rules for Copilot Chat. Tailored for Noor Canvas. Keep this lean and reference linked docs for details.
---

# Copilot Self-Learning Instructions – NOOR CANVAS (Slim Core)

## Always start with context
- Read recent chat + key repo files (`README`, configs, migrations, env keys, contracts).
- Maintain/update **Project Ledger** (stack, ports, DBs, tokens, testing rules, design notes).
- For detailed guidance, refer to:
  - `.github/engineering-standards.md` → coding standards, CI/CD, testing practices  
  - `.github/NOOR-Canvas-Mock-Implementation-Guide.md` → pixel-perfect design guide  
  - `ncImplementationTracker.MD` → implementation history, milestones, lessons learned  

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
  - Pixel-perfect compliance (≥95%) → see `.github/NOOR-Canvas-Mock-Implementation-Guide.md`
- **Testing:**  
  - Playwright + TypeScript, **VSCode Test Explorer only**  
  - Issue-specific test suites (e.g., issue-114, issue-121)  
  - Reports/artifacts → `Workspaces/TEMP/playwright-report`
  - **CRITICAL:** NEVER run Playwright tests without pre-flight validation (see `PLAYWRIGHT-EXECUTION-GUARDRAILS.md`)

## Do / Don’t Log
**Do**
- Check if app is already running before launch.  
- Use `KSESSIONS_DEV` only in dev.  
- Respect branding & panel alignment (50%/50%).  
- Load countries dropdown **after** token validation.  
- Validate transcripts via DB, not placeholders.  
- Use the `Simplified` schema for all new features and data, fully deprecating the legacy complex canvas schema.
- When encountering mock data, clearly inform the user in the final summary that mock data is being used and does not represent real production data.
- Ensure the remote server is running before executing commands such as `Start-Sleep 5; Invoke-WebRequest`.
- When data is involved, connect to the KSESSIONS_DEV database to ensure data consistency with the development environment.
- Always validate database connections before executing queries or operations.
- Use proper error handling and logging for all database operations.
- Prefer reading existing data over generating mock data when troubleshooting or analyzing issues.
- Apply changes in small, incremental steps to minimize risk.
- When files get corrected, check git history to understand what changed and fix accordingly.


**Don’t**
- Don’t run multiple servers on 9090/9091.  
- Don’t use prod DB (`KSESSIONS`) in dev.  
- Don’t run Playwright UI tests from terminal.  
- Don’t hardcode tokens or transcripts.  
- Don’t auto-mark issues/TODOs resolved. 
- Don't start plawright tests without first ensuring the application is running and accessible. Reference `PLAYWRIGHT-EXECUTION-GUARDRAILS.md` for rules.

## Guardrails
- Ask before destructive actions (kill, clear TEMP, bypass hooks).  
- Never bypass tracker validation (`validate-tracker-consistency.ps1`) without approval.  

## Self-Review (every answer)
- Did I answer exactly what was asked?  
- Could reading replace running?  
- Did I repeat a mistake? → add to “Don’t”  
- 1–3 reminders for next turn.  

## Output shape
1. **Plan** – steps  
2. **Context Evidence** – files/lines used  
3. **Action** – idempotent commands or edits  
4. **Result** – expected outcome  
5. **Self-Review** – checklist  
6. **Project Ledger** – updated snapshot  

---

## Reference Files
- `.github/engineering-standards.md` → coding standards, CI/CD, testing practices
- `.github/ncIssueTracker.MD` → milestones, issues, TODOs, lessons learned
