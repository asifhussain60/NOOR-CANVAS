# SelfAwareness – Global Operating Guardrails (2.5.0)

> Canonical operating rules for all agents. Keep **.github/prompts/** as the source of truth.  
> Everything else lives under **Workspaces/Copilot/**.

## Scope
Governs `/workitem`, `/continue`, `/pwtest`, `/cleanup`, `/retrosync`, `/imgreq`, `/refactor`, `/migrate`.

## Core Principles
- **Deterministic rails**: follow these rules exactly; do not invent new flows.  
- **Single source of truth**: prompts here; configs and state under `Workspaces/Copilot/`.  
- **Evidence-first**: factor terminal logs, analyzers, and artifacts into analysis and summaries.  
- **Small steps**: change one thing at a time, accumulate tests, and stabilize before moving on.  

## Absolute Runtime Rules
- **Never** launch with `dotnet run` or any variant.  
- Launch only via PowerShell scripts:  
  - `./Workspaces/Copilot/Global/nc.ps1`  (launch only)  
  - `./Workspaces/Copilot/Global/ncb.ps1` (clean, build, then launch)  
- If the agent initiates a stop/restart, **self-attribute** in logs and summaries.

## Debug Logging Rules
- All debug lines must use the consistent marker:  
  `[DEBUG-WORKITEM:{key}:{layer}:{RUN_ID}] message ;CLEANUP_OK`  
- `{layer}` values: `impl`, `tests`, `pwtest`, `retrosync`, `refactor`, `cleanup`, `lifecycle`.  
- `RUN_ID` is a short unique id (timestamp + random suffix).  
- Behavior by mode:  
  - **none**: do not insert debug lines.  
  - **simple**: add logs only for critical checks, decision points, and lifecycle events.  
  - **trace**: log every step of the flow, including intermediate calculations, branching decisions, and results.  

## Analyzer & Linter Enforcement (Post-Cleanup – Sept 27, 2025)
All agents must enforce **industry-standard analyzers and linters** before declaring success.

### .NET Analyzer Integration
- **NuGet Packages**:
  - Microsoft.CodeAnalysis.NetAnalyzers v8.0.0  
  - StyleCop.Analyzers v1.2.0-beta.507  
- **Configuration**: `Directory.Build.props` at repo root ensures:  
  - `<AnalysisLevel>latest</AnalysisLevel>`  
  - `<EnforceCodeStyleInBuild>true</EnforceCodeStyleInBuild>`  
  - `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>`  
- **Suppressions**: 36 StyleCop rules intentionally suppressed (e.g., SA1200, SA1208, SA1633).  
- **Invariant**: Do **not** attempt to reintroduce suppressed rules unless explicitly instructed.

### ESLint Integration
- Default config: `.eslintrc.js`  
- Cleanup config: `.eslintrc.cleanup.js` (for complex patterns like SignalR globals, Playwright contexts).  
- **Baseline Debt (Accepted)**:  
  - SignalR Browser Globals (20 errors) – acceptable.  
  - Playwright Dynamic Contexts (10 errors) – acceptable.  
  - Fixture Inheritance (6 errors) – acceptable.  
  - Catch Block Patterns (3 errors) – acceptable.  
- Agents must **not** attempt to eliminate these debts unless explicitly instructed.

## Modernization Guardrails
- **Imports**: All new code must use ES6 `import` syntax. Never reintroduce `require()`.  
- **Typing**: Prefer explicit types over `any`. If unavoidable, document why.  
- **Error Handling**: Use null coalescing (`??`) and safe defaults for resilience.  
- **Code Hygiene**: Delete unused functions/variables instead of prefixing with `_`.  
- **Formatting**: Always format with Prettier. Respect case sensitivity (`Tests` → `tests`).  

## Memory of Failures & Prohibited Retries
Agents must **record and respect failed approaches**:  
- Do not retry typing refactors of SignalR globals.  
- Do not force Playwright fixture rewrites when context inheritance is involved.  
- Do not attempt to "fix" suppressed StyleCop rules.  

## Test Strategy Rules
- Always generate Playwright tests incrementally:  
  1. Begin with simple hardcoded render checks.  
  2. Progress to integration with fixtures.  
  3. Only at the final stage use live browser contexts with SignalR.  
- If a test hangs, agents must self-recover and retry with reduced scope.  

## Logging for Success/Failure Memory
- On success: append `;SUCCESS_PATH` to debug logs.  
- On failure: append `;FAIL_PATH:{reason}` and mark prohibited retries.  
- Summaries must include both successes and failures so future generations don’t repeat mistakes.

## Version Control Rules
- Always operate within Git.  
- On completion: ensure `git status` is clean.  
- Commits must include RUN_ID in the message for traceability.

---

## Key Infrastructure (Migrated from IssueTracker)

### Port Management & Launch

### Database Connectivity

#### KSESSIONS_DEV SQL Connection String
```
Data Source=AHHOME;Initial Catalog=KSESSIONS_DEV;User Id=sa;Password=adf4961glo;Connection Timeout=3600;MultipleActiveResultSets=true;TrustServerCertificate=true;Encrypt=false
```

**Never use localdb for any database operations.**
All agents and scripts must connect only to the specified SQL Server instance above. LocalDB is strictly prohibited for development, testing, or production workflows.

#### IIS Express & Port Management
- Default app port: 9091 (avoid system reserved)
- Use nc.ps1/ncb.ps1 for port cleanup and dynamic assignment
- Always check for orphaned IIS Express processes before launch

#### Entity Framework
- Use retry logic for DbContext initialization
- Connection string must match above for all .NET apps

#### Playwright Test Infrastructure
- Centralized under PlayWright/ (tests, reports, results, artifacts, config)
- Main config: PlayWright/config/playwright.config.js
- Proxy config: project root playwright.config.js

#### SignalR
- Handle InvalidDataException during message parsing
- Use resilient serialization formats for real-time updates

#### API Endpoints
- Token validation: `/api/host/token/{token}/validate` for friendly tokens
- **Connection String Standard**: Always use identical connection strings across all applications
- **Timeout Configuration**: Use Connection Timeout=3600 for long-running operations
- **Route Conflicts**: Always check for ambiguous route patterns during development
- **Token Validation**: Use correct API endpoints: `/api/host/token/{token}/validate` for friendly tokens
- **SignalR Integration**: Handle InvalidDataException during data parsing; verify message serialization
- **Authentication Flows**: Validate token formats match expected endpoint requirements

### Playwright Test Infrastructure
- **Centralized Structure**: All test artifacts under PlayWright/ directory
- **Artifact Management**: Organized into tests/, reports/, results/, artifacts/, config/
- **Configuration**: Proxy config at root, main config in PlayWright/config/
- **Path Resolution**: All paths relative to project root for consistency

## Key Requirements (Migrated from IssueTracker)

### Authentication & Session Management
- **Token Consistency**: Host-SessionOpener workflow must maintain token validation throughout
- **Session Name Display**: Support both KSESSIONS database lookup and fallback display patterns
- **Multi-route Support**: Components must handle multiple route patterns (/, /host, /host/{token})
- **Error Handling**: Authentication failures must show user-friendly messages, not technical errors

### UI/UX Standards
- **Responsive Design**: All authentication cards must be properly centered and sized
- **Visual Consistency**: Maintain purple theme, Tailwind CSS, and consistent padding/spacing
- **Logo Placement**: Large, prominent logo display in headers
- **Animation Support**: Landing pages should support smooth transitions and animations

### API Integration Requirements
- **KSESSIONS Integration**: Support both KSESSIONS_DEV and production database contexts
- **Host Provisioner**: Single GUID per session ID with proper foreign key constraints
- **Validation Logic**: Implement comprehensive SessionTranscripts validation
- **Real-time Updates**: SignalR must handle participant updates without connection drops

### Data Management
- **Album & Category Data**: Support dynamic loading from KSESSIONS database
- **Session Transcripts**: Proper validation and storage with token-based access
- **Participant Management**: Real-time participant list updates via SignalR
- **Flag Display**: ISO2 country code mapping for participant countries

---

**Version:** 2.6.0  
**Last Updated:** IssueTracker Migration – Sept 27, 2025  

```