# GitHub Copilot — Workspace Efficiency Instructions

## 1. Project Context & Technologies

- **Workspace Root:** `D:\PROJECTS\NOOR CANVAS`
- **Main Application:** Islamic learning platform (NOOR CANVAS)
- **Frontend:** Next.js 15 (App Router), React 18, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion
- **Backend:** NestJS (Node 22), REST API, Socket.IO for real-time features
- **Mock Data:** Centralized in `@noor-canvas/mock-data` (sessions, assets, questions, countries, images)
- **Database:** SQL Server (Prisma ORM), Redis for presence/pubsub (Phase 2+)
- **Security:** GUID-based session tokens (UUIDv4), no Auth0
- **Design System:** Islamic theme (emerald green #059669, gold #D4A574), Amiri font for Arabic, responsive/mobile-first
- **Static Mock Application:** Located in `MockPages/` (HTML, CSS, JS, full user journeys)
- **Documentation:** Strategy in `Workspaces/Documentation/IMPLEMENTATIONS/NOOR-CANVAS-STRATEGY.MD`, mockup details in `MockPages/README.md`

## 2. Directory Structure

- `SPA/` — All runtime code (apps, packages, docker, etc.)
- `Storybook/` — (To be removed) UI component mocks, stories
- `MockPages/` — Complete static mock application
- `Workspaces/Documentation/` — Strategy, requirements, implementation docs
- `Workspaces/Global/` — Copilot instructions (this file)

## 3. Known Working Commands & Actions

- **Node & NPM Version Check:**
  - `node -v; npm -v` — Works for checking Node and npm versions
- **pnpm Install:**
  - `pnpm install` — Works for installing dependencies
  - `pnpm install --reporter=append-only` — Works for installing with minimal output
- **Process & Port Check:**
  - `Get-Process -Name node -ErrorAction SilentlyContinue | Select-Object Id,ProcessName,StartTime` — Works for listing node processes
  - `netstat -ano | findstr ":6006"` — Works for checking if port 6006 is in use
  - `Test-NetConnection -ComputerName localhost -Port 7007` — Works for testing port connectivity

## 4. Commands That Fail (Do NOT Use)

- **Terminal Output Retrieval:**
  - All recent attempts to use `get_terminal_output` with provided IDs have failed (invalid terminal ID errors)
- **Remove-Item for Storybook Directory:**
  - `Remove-Item -Path "D:\PROJECTS\NOOR CANVAS\Storybook" -Recurse -Force` — Fails if directory is in use
  - Even after killing node processes, directory may remain locked
- **Process Kill by Path:**
  - `Get-Process | Where-Object { $_.Path -like '*Storybook*' } | Stop-Process -Force` — No effect if processes are not found

## 5. Instructions for Efficient Operation

- **Always check for locked files/processes before attempting to delete directories.**
- **Use only commands listed in Section 3 for routine checks and installs.**
- **Avoid using any command or tool that has previously failed (see Section 4).**
- **For Storybook removal, ensure all terminals and editors accessing the directory are closed before running deletion commands.**
- **For real-time features, use Socket.IO and REST endpoints as described in the strategy document.**
- **For mock data and UI demonstration, use the static HTML files in `MockPages/`.**
- **Refer to `NOOR-CANVAS-STRATEGY.MD` and `MockPages/README.md` for architecture and implementation details.**

## 6. Additional Notes

- **Do not use IIS for Node/Docker hosting.**
- **Use Docker Compose for local development and scalable demos.**
- **For public demos, use ngrok or Cloudflare Tunnel.**
- **All new instructions and technology updates should be appended to this file for future efficiency.**

---
**Last updated:** September 7, 2025
