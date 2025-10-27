# User Dictionary — Shortcut Lookup (Evaluated in Analysis)

Purpose
- Central lookup for common abbreviations used by the user. During analysis, always expand these shortcuts to their canonical names and referenced files.
- References use the repository’s #file: convention. Prompts should prefer these references and auto-load files when needed.

How to use
- When a request contains a shortcut token (e.g., "hcp", "tcanv"), resolve it using this dictionary before deciding scope.
- If both a generic filename and a full path exist, prefer the generic #file: reference (the prompt system resolves it).

Views (Blazor Components)
- hcp: Host Control Panel — view: #file:HostControlPanel.razor
- scanv: Session Canvas — view: #file:SessionCanvas.razor
- tcanv: Transcript Canvas — view: #file:TranscriptCanvas.razor
- swait: Session Waiting — view: #file:SessionWaiting.razor
- uland: User Landing (registration) — view: #file:UserLanding.razor
- hland: Host Landing — view: #file:HostLanding.razor
- sdiag: Session Diagnostics — view: #file:SessionDiagnostics.razor
- send: Session Ended — view: #file:SessionEnded.razor

API Controllers
- hctrl: HostController — #file:HostController.cs
- pctrl: ParticipantController — #file:ParticipantController.cs
- qctrl: QuestionController — #file:QuestionController.cs
- sctrl: SessionController — #file:SessionController.cs
- dctrl: DiagnosticsController — #file:DiagnosticsController.cs
- actrl: AnnotationsController — #file:AnnotationsController.cs

SignalR
- hub: SessionHub — #file:SessionHub.cs

Services (Server-side)
- hss: HostSessionService — #file:HostSessionService.cs
- hsss: HostSessionStateService — #file:HostSessionStateService.cs
- sstate: SessionStateService — #file:SessionStateService.cs
- ahps: AssetHtmlProcessingService — #file:AssetHtmlProcessingService.cs
- uht: UnifiedHtmlTransformService — #file:UnifiedHtmlTransformService.cs
- sst: SecureSessionTokenService — #file:SecureSessionTokenService.cs
- stoken: SimplifiedTokenService — #file:SimplifiedTokenService.cs

Data/DbContext
- sdb: SimplifiedCanvasDbContext — #file:SimplifiedCanvasDbContext.cs
- kdb: KSessionsDbContext — #file:KSessionsDbContext.cs

Routes/Flows
- start: Start Session flow (host) — #file:HostControlPanel.razor
- reg: Participant Registration flow — #file:UserLanding.razor
- wait: Waiting Room flow — #file:SessionWaiting.razor
- live: Live Session flow — #file:SessionCanvas.razor
- trans: Transcript flow — #file:TranscriptCanvas.razor

Testing & Config
- pwcfg: Playwright config — #file:config/testing/playwright.config.cjs
- eslint: ESLint config — #file:config/testing/eslint.config.js
- tsconfig: Tests TypeScript config — #file:config/testing/tsconfig.json
- prettier: Prettier config — #file:config/testing/.prettierrc
- tests-ui: UI tests root — #file:Tests/UI

Scripts & Tasks
- nc: Launch app (dev) — #file:Workspaces/Global/nc.ps1
- ncb: Clean, build, run — #file:Workspaces/Global/ncb.ps1
- nchealth: App healthcheck — #file:Workspaces/Global/nchealthcheck.ps1
- ros: Roslynator analysis — #file:Workspaces/CodeQuality/run-roslynator.ps1
- dpp: Debug panel Percy tests — #file:Scripts/run-debug-panel-percy-tests.ps1

Migrations & Data
- mig-canvastype: Add CanvasType column — #file:Migrations/migration-20251020-add-canvastype-column.sql
- mig-rollback-canvastype: Rollback CanvasType — #file:Migrations/rollback-20251020-add-canvastype-column.sql

Tools
- hp: Host Provisioner (WinForms .exe) — #file:Tools/HostProvisioner/HostProvisioner.WinForms/Program.cs
- hpapp: HostProvisioner CLI entry — #file:Tools/HostProvisioner/HostProvisioner/Program.cs
- hp-sst: HostProvisioner SecureSessionTokenService — #file:Tools/HostProvisioner/HostProvisioner/Services/SecureSessionTokenService.cs

Documentation quick refs
- sysidx: System Index — #file:.github/instructions/Links/SystemIndex.md
- infra: Infrastructure Quick Ref — #file:.github/instructions/Links/InfrastructureQuickRef.md
- arch: Architecture Overview — #file:.github/instructions/Links/Architecture.md
- cfcfg: Cloudflare Configuration — #file:.github/instructions/Cloudflare-Configuration.md
- cdnarch: CDN Architecture — #file:.github/instructions/CDN-Architecture.md

Cloudflare/Infrastructure
- cftunnel: Cloudflare tunnel config — #file:Workspaces/Infrastructure/Cloudflare/tunnel-configuration.md
- cfconfig: Cloudflare config.yml — #file:Workspaces/Infrastructure/Cloudflare/config.yml
- cfinstall: Install tunnel service — #file:Workspaces/Infrastructure/Cloudflare/install-tunnel-service.ps1
- cfrestart: Restart tunnel service — #file:Workspaces/Infrastructure/Cloudflare/restart-tunnel-service.ps1
- cfhealth: Check tunnel health — #file:Workspaces/Infrastructure/Cloudflare/check-tunnel-health.ps1
- cftrouble: Cloudflare troubleshooting — #file:Workspaces/Infrastructure/Cloudflare/TROUBLESHOOTING.md

Notes
- This file is authoritative for shortcut expansion. If a shortcut is ambiguous or missing, add a new entry here instead of hardcoding logic in a prompt.
- Prompts must re-evaluate this dictionary during every analysis step so changes take effect immediately without code edits.
