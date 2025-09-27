# SelfAwareness – Global Operating Guardrails (2.5.0)

> Canonical operating rules for all agents. Keep **.github/prompts/** as the source of truth.  
> Everything else lives under **Workspaces/Copilot/**.

## Scope
Governs `/workitem`, `/continue`, `/pwtest`, `/cleanup`, `/retrosync`, `/imgreq`, `/refactor`, `/migrate`, `/promptsync`.

## Core Principles
- **Deterministic rails**: follow these rules exactly; do not invent new flows.  
- **Single source of truth**: prompts here; configs and state under `Workspaces/Copilot/`.  
- **Evidence-first**: factor terminal logs, analyzers, and artifacts into analysis and summaries.  
- **Small steps**: change one thing at a time, accumulate tests, and stabilize before moving on.

## Phase Prompt Processing
All agents must handle `---` delimited input as separate todo items:

### Phase Recognition
- **Delimiter**: `---` on its own line indicates phase separation
- **Parsing**: Split user input into individual phases for sequential processing
- **Identification**: Each phase gets a unique identifier: `phase_{number}` where number starts at 1

### Phase Processing Workflow
For each phase, agents must:
1. **Implementation**: Make the required change for this specific phase
2. **Test Generation**: Create headless, silent Playwright test in `Workspaces/TEMP/`
   - Naming: `{agent}-phase-{phase_number}-{key}-{RUN_ID}.spec.ts`
   - Must be headless and silent (no browser UI)
   - Must validate the specific change made in this phase
3. **Test Validation**: Ensure test passes (retry up to 3 times if needed)
4. **Phase Completion**: Mark complete with debug log
5. **Next Phase**: Move to subsequent phase only after current phase is fully complete

### Temporary Test Management
- **Location**: All phase tests go in `Workspaces/TEMP/` directory
- **Cleanup**: Remove temporary phase tests after all phases complete (unless `commit:false`)
- **Distinction**: Permanent tests follow proper structure as per config files in `config/testing/`
- **Isolation**: Each phase test should be independent and not depend on previous phase tests

### Phase Completion Logging
- **Format**: `[DEBUG-WORKITEM:{key}:impl:{RUN_ID}] phase_{number}_complete status=success/failure ;CLEANUP_OK`
- **Required**: Each phase must log completion before proceeding to next phase
- **Failure Handling**: If phase fails, stop processing and report failure with specific phase number  

## File Organization Rules
**CRITICAL**: Never create analysis, summary, or documentation files in the project root.

### Documentation & Analysis File Placement
All agent-generated documentation must be placed in the designated directory structure:

```
Workspaces/Copilot/
├── _DOCS/                    # All analysis and summary documents
│   ├── summaries/           # Work completion summaries
│   ├── analysis/            # Technical analysis documents
│   ├── configs/             # Configuration documentation
│   └── migrations/          # Migration and reorganization docs
├── artifacts/               # Build and test artifacts
├── config/                  # Agent configurations
└── prompts.keys/           # Key-based prompt storage
```

**Enforcement:**
- **Summaries**: `Workspaces/Copilot/_DOCS/summaries/`
- **Analysis**: `Workspaces/Copilot/_DOCS/analysis/`
- **Config Documentation**: `Workspaces/Copilot/_DOCS/configs/`
- **Migration Reports**: `Workspaces/Copilot/_DOCS/migrations/`
- **Never use project root** for any temporary or analysis files

## Absolute Runtime Rules

### For .NET Application Development
- **Never** launch with `dotnet run` or any variant.  
- Launch only via PowerShell scripts:  
  - `./Workspaces/Global/nc.ps1`  (launch only)  
  - `./Workspaces/Global/ncb.ps1` (clean, build, then launch)  
- If the agent initiates a stop/restart, **self-attribute** in logs and summaries.

### For Playwright Testing
- **Never** use PowerShell scripts (`nc.ps1`/`ncb.ps1`) for test execution
- Playwright manages application lifecycle via `webServer` configuration in `config/testing/playwright.config.cjs`
- Use `PW_MODE=standalone` to enable automatic app startup and shutdown
- Tests run entirely in Node.js context with Playwright managing the .NET app as a subprocess

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
- Main config: `config/testing/eslint.config.js` (centralized configuration)  
- Legacy configs in PlayWright/ (`.eslintrc.js`, `.eslintrc.cleanup.js`) for specific patterns like SignalR globals, Playwright contexts.  
- **Baseline Debt (Accepted)**:  
  - SignalR Browser Globals (20 errors) – acceptable.  
  - Playwright Dynamic Contexts (10 errors) – acceptable.  
  - Fixture Inheritance (6 errors) – acceptable.  
  - Catch Block Patterns (3 errors) – acceptable.  
- Agents must **not** attempt to eliminate these debts unless explicitly instructed.

### npm Script Enforcement (Updated Sept 27, 2025)
All agents must use the centralized npm scripts for linting, formatting, and testing:

- **Linting**: `npm run lint` (uses `config/testing/eslint.config.js`)
- **Formatting Check**: `npm run format:check` (uses `config/testing/.prettierrc`)
- **Formatting Fix**: `npm run format` (uses `config/testing/.prettierrc`)
- **TypeScript Check**: `npm run build:tests` (uses `config/testing/tsconfig.json`)
- **Playwright Tests**: All test commands use `config/testing/playwright.config.cjs`

**Enforcement Rules:**
- Run from repository root directory
- All scripts automatically reference centralized config files
- **Zero tolerance**: All linting and formatting must pass before declaring success
- **Error Interpretation**: Distinguish between config issues vs. actual code problems

## Modernization Guardrails
- **Imports**: All new code must use ES6 `import` syntax. Never reintroduce `require()`.  
- **Typing**: Prefer explicit types over `any`. If unavoidable, document why.  
- **Error Handling**: Use null coalescing (`??`) and safe defaults for resilience.  
- **Code Hygiene**: Delete unused functions/variables instead of prefixing with `_`.  
- **Formatting**: Always format with Prettier using `config/testing/.prettierrc`. Respect case sensitivity (`Tests` → `tests`).  

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

### Configuration File Organization (Updated Sept 27, 2025)
All JavaScript/JSON configuration files have been centralized for better organization:

```
config/
└── testing/
    ├── eslint.config.js          # ESLint configuration for TypeScript/Playwright tests
    ├── playwright.config.cjs     # Playwright test configuration (CommonJS format)
    ├── tsconfig.json            # TypeScript configuration for tests
    └── .prettierrc             # Prettier formatting configuration
```

**Key Points:**
- **Centralized Location**: All configs in `config/testing/` directory
- **npm Scripts**: All package.json scripts reference the centralized config locations
- **Backward Compatibility**: Legacy configs in PlayWright/ maintained for specific use cases
- **CommonJS Format**: Playwright config uses `.cjs` extension for ES module compatibility
- **Path Updates**: All relative paths correctly updated for new directory structure

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
- **For Development**: Use nc.ps1/ncb.ps1 for port cleanup and dynamic assignment
- **For Playwright Tests**: Use webServer configuration (`PW_MODE=standalone`) for automatic management
- Always check for orphaned IIS Express processes before launch (development only)

#### Entity Framework
- Use retry logic for DbContext initialization
- Connection string must match above for all .NET apps

#### Playwright Test Infrastructure
- Centralized under PlayWright/ (tests, reports, results, artifacts)
- **Main config**: `config/testing/playwright.config.cjs` (centralized configuration)
- **webServer Configuration**: Handles automatic .NET app startup/shutdown for tests
- **Usage Context**:
  - **Development/Implementation**: Use PowerShell scripts (nc.ps1/ncb.ps1)
  - **Playwright Testing**: Use webServer (`PW_MODE=standalone`) - never PowerShell scripts
- Legacy configs: PlayWright/config/ and root (for backward compatibility)
- All npm scripts reference the centralized config location

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

**Version:** 2.8.0  
**Last Updated:** Documentation Organization & File Placement Rules – Sept 27, 2025  

```