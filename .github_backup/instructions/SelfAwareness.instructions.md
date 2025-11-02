# SelfAwareness – Global Operating Guardrails (2.10.0)

> **⚠️ MANDATORY RULES:** Load `.github/MANDATORY.md` FIRST - Rule index + referenced implementation files  
> Canonical operating rules for all agents. Keep **.github/prompts/** as the source of truth.  
> Everything else lives under **Workspaces/Copilot/**.

## 📚 Essential Reading (START HERE)

**CRITICAL - Load before ANY work:**
- **`.github/MANDATORY.md`** - 3 ABSOLUTE RULES (index + rule files in `.github/instructions/rules/`)
  - Rule 1: [No Code in Chat](instructions/rules/no-code-in-chat/rule.md)
  - Rule 2: [Document First](instructions/rules/document-first/rule.md)
  - Rule 3: [Playwright Orchestration](instructions/rules/playwright-orchestration/rule.md)

**Before making any changes, ALWAYS consult:**
- **`.github/prompts/shared/UserDictionary.md`** - Canonical shortcut lookup (expand all shorthand)
- **`.github/instructions/Links/SystemIndex.md`** - Central navigation hub for all architecture
- **`.github/instructions/Links/InfrastructureQuickRef.md`** - Database connections & schema rules
- **`.github/instructions/CDN-Architecture.md`** - Media/resource URL patterns & CDN usage
- **`.github/instructions/Cloudflare-Configuration.md`** - Tunnel/networking configuration
- **`.github/instructions/Links/Architecture.md`** - Complete API, Razor, service, SignalR inventory

## 📖 Table of Contents

1. [Essential Reading](#-essential-reading-start-here)
2. [Branch Strategy](#-branch-strategy-critical)
3. [File Organization Rules](#-file-organization-rules-critical)
4. [Document First, Respond Later Protocol](#-document-first-respond-later-protocol-mandatory)
5. [Key Data Stream (KDS) Architecture](#️-key-data-stream-kds-architecture---lessons-learned-2025-10-29)
6. [Database Access Rules](#️-database-access-rules-mandatory)
7. [Core Principles](#core-principles)
8. [Phase Prompt Processing](#phase-prompt-processing)
9. [Absolute Runtime Rules](#absolute-runtime-rules)
10. [Debug Logging Rules](#debug-logging-rules)
11. [Analyzer & Linter Enforcement](#analyzer--linter-enforcement-post-cleanup--sept-27-2025)
12. [Quick Reference Card](#-quick-reference-card)
13. [Version History](#-version-history)

## 🔀 Branch Strategy (CRITICAL)

**BRANCH STRUCTURE**:
- **`master`** - Production branch (PROTECTED)
  - ALWAYS represents what's currently deployed in production via `ncdeploy.ps1`
  - NEVER commit directly to master
  - Only receives merges from `development` after testing
  - Deployment script: `Scripts/ncdeploy.ps1` deploys from this branch
  
- **`development`** - Active development branch (DEFAULT)
  - ALL development work happens here
  - ALL feature implementations
  - ALL bug fixes
  - ALL testing and experimentation
  - Agents should ALWAYS work in this branch

**WORKFLOW**:
1. **Development**: All work done in `development` branch
2. **Testing**: Validate changes thoroughly in development
3. **Merge**: When ready for production, merge `development` → `master`
4. **Deploy**: Run `ncdeploy.ps1` which deploys from `master` branch
5. **Continue**: Resume development work in `development` branch

**ENFORCEMENT**:
- ⚠️ **NEVER** modify `master` branch directly
- ✅ **ALWAYS** create commits in `development` branch
- ✅ **ALWAYS** verify you're in `development` before starting work:
  ```powershell
  git branch --show-current  # Should return: development
  ```
- ❌ If on `master`, switch immediately:
  ```powershell
  git checkout development
  ```

**RATIONALE**:
- Production stability: `master` only contains tested, deployable code
- Safe experimentation: `development` allows iteration without affecting production
- Clear deployment path: `ncdeploy.ps1` knows to deploy from `master`
- Easy rollback: Can revert `master` without losing development work

## 🚫 File Organization Rules (CRITICAL)

**PROMPTS FOLDER MUST REMAIN CLEAN:**
- **.github/prompts/** contains ONLY:
  - Agent prompt files (`*.prompt.md`)
  - Shared algorithm files (`shared/*.md`)
  - Internal agent files (`internal/**/*.prompt.md`)
  - State tracker utility (`shared/state-tracker.ps1`)
  
**PROHIBITED in .github/prompts/:**
- ❌ Documentation files (guides, tutorials, references)
- ❌ Work items or plan files
- ❌ Analysis reports or summaries
- ❌ Temporary files or logs
- ❌ Key data stream files (belong in `.github/key-data-streams/`)
- ❌ README files or markdown documentation

**DOCUMENTATION LOCATIONS:**
- **Workspaces/Documentation/** - All documentation, guides, references
- **Workspaces/Copilot/_DOCS/** - Copilot-specific documentation
- **.github/key-data-streams/{key}/** - Key-specific work plans and logs
- **Docs/** - Project-level documentation (deployment, setup, processes)

**ENFORCEMENT:**
- ✅ Prompts MUST save reports to `Workspaces/Documentation/` or `Workspaces/Copilot/_DOCS/`
- ✅ Work plans MUST go to `.github/key-data-streams/{key}/`
- ✅ Never create `*.md` files directly in `.github/prompts/` root
- ✅ Cleanup: Remove any documentation files found in prompts folder
- ✅ All agents MUST follow these rules when generating output

## Scope
Governs `/workitem`, `/todo`, `/pwtest`, `/cleanup`, `/retrosync`, `/imgreq`, `/refactor`, `/migrate`, `/promptsync`.

## Required Reading
**CRITICAL:** Before making any architectural decisions, implementing new features, or modifying existing code, agents **MUST** consult:
- **`.github/prompts/shared/UserDictionary.md`** - Canonical shortcut lookup; during analysis, ALWAYS load and expand user shorthand (e.g., hcp, scanv, tcanv) to concrete files and concepts
- **`.github/instructions/Links/SystemIndex.md`** - Central navigation hub for all architectural references, agent coordination, and system snapshots
- **`.github/instructions/Links/InfrastructureQuickRef.md`** - **MANDATORY** for database operations - contains KSESSIONS_DEV connection details and schema access rules
- **`.github/instructions/CDN-Architecture.md`** - **MANDATORY** for media/resource URLs - explains why CDN (`resources.kashkole.com`) exists and why `file://` URLs should NOT be used (related keys: `ksessions-cdn`, `transcript-img-fix`, `cdn-dev-cors`)
- **`.github/instructions/Cloudflare-Configuration.md`** - **MANDATORY** for tunnel/networking questions - comprehensive Cloudflare Tunnel configuration, dashboard access, troubleshooting, and management scripts (related keys: `cloudflare-tunnel-stability`, `cdn-cloudflare-fix`)
- **`.github/instructions/Links/Architecture.md`** - Comprehensive application architecture documentation including:
  - Complete API endpoint catalog (52 endpoints across 11 controllers)
  - Razor pages and component inventory (15+ pages, 10+ components)
  - Service architecture (15+ services with responsibilities)
  - SignalR hub documentation (4 hubs with methods and events)
  - Data model catalog and database schemas
  - Authentication flows and security patterns
  - Integration patterns and common workflows

**Purpose:** This prevents duplication of existing functionality and ensures new implementations follow established architectural patterns.

### Shortcut Expansion Policy (MANDATORY)
- During the analysis phase of ANY prompt, automatically evaluate `.github/prompts/shared/UserDictionary.md` and expand all detected shortcut tokens in the user request and context (e.g., "hcp" → Host Control Panel → file: HostControlPanel.razor).
- Treat the dictionary as authoritative; if a shortcut is missing, prefer asking once or proceeding with a clearly stated assumption and then add it to the dictionary.
- When generating summaries, preserve the user's shorthand but include the resolved canonical names in parentheses on first mention.

## 📝 Document First, Respond Later Protocol (MANDATORY)

**PURPOSE**: Ensure all key data stream files are created/updated BEFORE showing responses to users.

**ENFORCEMENT**: All prompts that create/update key data streams MUST verify file finalization before user output.

**PROTOCOL**:

1. **plan.prompt.md** - Step 5.5 (BLOCKING)
   - Verify 4 files exist: `{key}.plan.md`, `{key}.plan.json`, `work-log.md`, `state.json`
   - HALT if any missing
   - Block Step 6 (Handoff) and Step 7.5 (Response Validation)

2. **task.prompt.md** - Step 8.25 (BLOCKING)
   - Verify `work-log.md` modified within 60 seconds
   - HALT if stale or missing
   - Block Step 8.6 (Response Validation)

3. **todo.prompt.md** - Execution Section (BLOCKING)
   - Verify `work-log.md` file size increased (append occurred)
   - HALT if unchanged
   - Block Response Validation

**ALGORITHM**: See `.github/prompts/shared/file-finalization-verifier.md`

**TESTING**: Use `-test` flag with any prompt to validate file finalization compliance (see `.github/prompts/shared/prompt-test-validation-framework.md`)

**RATIONALE**:
- Documentation happens during work, not after
- Users see complete context when reviewing work
- Preserves execution history for future reference
- Prevents incomplete key data streams

---

## 🗂️ Key Data Stream (KDS) Architecture - Lessons Learned (2025-10-29)

**SOURCE**: CopilotChats.md analysis - identified 5 protocol violations with KDS-related root causes

### KDS Canonical Structure (MANDATORY)

**Every key in `.github/key-data-streams/{key}/` MUST have:**

```
.github/key-data-streams/{key}/
├── {key}.plan.md          # REQUIRED - Phase plan, tasks, acceptance criteria
├── work-log.md            # REQUIRED - Session-by-session execution history
├── tests/                 # OPTIONAL - If tests exist for this key
│   ├── test-registry.md   # REQUIRED if tests/ exists - Inventory of all test files
│   └── *.spec.ts          # Actual test files
├── drift-log.md           # OPTIONAL - If drift detected during execution
└── metadata.json          # OPTIONAL - Key metadata (status, priority, tags)
```

**PROHIBITED in KDS directories:**
- ❌ `.tmp`, `.backup`, `.bak` files (backup files belong in `.github/prompts/` root only)
- ❌ Orphaned directories (keys without plan.md or work-log.md)
- ❌ Undocumented test files (tests exist but not in test-registry.md)

### Critical KDS Violations Identified (Analysis: CopilotChats.md)

#### 1. Document-First Rule Violation (60% of sessions - HIGH SEVERITY)

**Evidence:** Lines 125-400 - TranscriptController.cs created without prior plan.md/work-log.md updates

**Root Cause:** Code implementation before documentation update

**Fix Applied:** Enhancement 1 (P0) - step-2-5-document-first-checkpoint.md
- **Step 2.5** in task.prompt.md now MANDATORY
- Updates plan.md + work-log.md BEFORE any code changes
- Commits documentation first (separate commit)
- HALTS execution if documentation update fails

**Protocol:**
```
CORRECT SEQUENCE:
1. Update {key}.plan.md with phase details
2. Append session entry to work-log.md
3. Commit documentation (separate commit)
4. THEN implement code
5. Commit code (references doc commit)

VIOLATION (60% rate before fix):
1. Implement code directly
2. Create commits
3. Document AFTER (if at all)
```

**Enforcement:** healthcheck.prompt.md v1.3.0 - KDS Document-First validation algorithm

---

#### 2. Plan Approval Without File Artifact (33% of sessions - MEDIUM SEVERITY)

**Evidence:** User said "A" (approve) → immediate code generation without plan.md file written

**Root Cause:** Plan shown in chat but not persisted to disk before execution

**Fix Applied:** Enhancement 3 (P1) - step-3-5-plan-validation-gate.md
- **Step 3.5** writes plan to {key}.plan.md BEFORE user approval
- User reviews actual file (not just chat message)
- Approval gate references file location
- Plan modifications tracked in git

**Protocol:**
```
CORRECT SEQUENCE:
1. Generate plan in memory
2. WRITE to {key}.plan.md
3. SHOW file path to user
4. PROMPT approval with file reference
5. User reviews file, can edit
6. On approval, proceed with execution

VIOLATION (33% rate before fix):
1. Generate plan in chat
2. Show to user
3. User approves
4. Execute immediately (no file artifact)
```

**Enforcement:** plan.prompt.md updated - Step 3.5 integration

---

#### 3. Test Registry Gaps (33% of test creations - MEDIUM SEVERITY)

**Evidence:** TranscriptApiTests.cs created without test-registry.md entry

**Root Cause:** Test creation not atomic with registry update

**Fix Applied:** Enhancement 4 (P1) - step-7-5-test-registry-auto-update.md
- test-generation.prompt.md Step 7.5 auto-updates registry
- Each test gets entry: file, type, status, run command, coverage
- Registry committed atomically with test files
- Violation detection in healthcheck

**Protocol:**
```
CORRECT SEQUENCE:
1. Generate test file
2. IF test-registry.md doesn't exist THEN create from template
3. ADD test entry to registry (file, type, status, command)
4. git add test-file.spec.ts test-registry.md
5. git commit (atomic)

VIOLATION (33% rate before fix):
1. Generate test file
2. git add test-file.spec.ts
3. git commit
4. Forget to update test-registry.md (or update later in separate commit)
```

**Enforcement:** healthcheck.prompt.md v1.3.0 - Test Registry Completeness validation

---

#### 4. Work Log Gaps (Stale Keys - LOW SEVERITY but common)

**Evidence:** Keys with >7 day gaps between work-log.md sessions

**Root Cause:** Resuming work without documenting session start

**Protocol:**
```
CORRECT SEQUENCE (Resume work on existing key):
1. git checkout development
2. Read {key}.plan.md for context
3. APPEND new session to work-log.md:
   ---
   ## [ISO-8601-Timestamp] - [agent-name]
   **Status**: in-progress
   **Phase**: [current-phase]
   **Resume Context**: [What you're continuing]
   ---
4. THEN proceed with implementation

VIOLATION:
1. Resume coding without work-log.md session entry
2. Results in multi-day gaps in work-log.md timeline
```

**Enforcement:** healthcheck.prompt.md v1.3.0 - Work Log Continuity validation
- Detects gaps >7 days
- Flags stale keys (>30 days no activity)
- Identifies orphaned directories

---

#### 5. Plan-to-Implementation Drift (MEDIUM SEVERITY)

**Evidence:** Plan phases completed without work-log.md tracking

**Root Cause:** Phase completion not documented in work-log.md

**Protocol:**
```
CORRECT SEQUENCE:
1. plan.md Phase 1: "Implement API endpoints"
2. work-log.md session entry:
   **Phase**: 1 - Implement API endpoints
   **Status**: in-progress
3. Complete implementation
4. work-log.md update:
   **Phase**: 1 - Implement API endpoints
   **Status**: complete
   **Tasks completed**: [list]
5. Move to Phase 2

VIOLATION:
1. plan.md has Phases 1-3
2. work-log.md only has Phase 1 entry
3. Code shows Phases 2-3 implemented but not documented
```

**Enforcement:** healthcheck.prompt.md v1.3.0 - Plan-to-Implementation Mapping
- Cross-references plan phases with work-log sessions
- Flags unmapped phases (in plan but not in work-log)
- Validates plan.md file references exist

---

### KDS Best Practices (2025-10-29)

**From Analysis (CopilotChats.md violations):**

1. **ALWAYS Document BEFORE Code** (60% violation fix)
   - Update plan.md/work-log.md in separate commit before code changes
   - Commit message: `docs({key}): update plan for Phase X` THEN `feat({key}): implement Phase X`

2. **ALWAYS Persist Plans Before Approval** (33% violation fix)
   - Write plan.md to disk before showing user
   - User can review/edit file, not just chat message

3. **ALWAYS Update Test Registry Atomically** (33% violation fix)
   - Test file + test-registry.md in same commit
   - Use template for new registries

4. **ALWAYS Log Session Start When Resuming** (stale key prevention)
   - First action: append to work-log.md
   - Document resume context and current phase

5. **ALWAYS Map Plan Phases to Work Log** (drift prevention)
   - Each plan phase gets work-log session(s)
   - Mark phases complete in work-log when done

6. **NEVER Leave Orphaned Keys** (cleanup enforcement)
   - Keys with plan.md but no work-log.md = violation
   - Keys with no activity >30 days = archive candidate

**Enforcement:** healthcheck.prompt.md v1.3.0 validates all 6 best practices

## 🗄️ Database Access Rules (MANDATORY)

**PRIMARY DATABASE: KSESSIONS_DEV**
- Default database: **KSESSIONS_DEV** (assume unless specified otherwise)
- Server: **AHHOME**
- Connection: Always use `_configuration.GetConnectionString("DefaultConnection")`
- Connection String Format:
  ```
  Data Source=AHHOME;Initial Catalog=KSESSIONS_DEV;User Id=sa;Password=adf4961glo;
  Connection Timeout=3600;MultipleActiveResultSets=true;TrustServerCertificate=true;Encrypt=false
  ```

**SCHEMA ACCESS CONTROL**:
- ✅ **`canvas.*` schema**: **READ-WRITE** allowed
  - canvas.Questions, canvas.QuestionVotes, canvas.Participants, canvas.AssetLookup, canvas.Sessions
  
- ❌ **`dbo.*` schema**: **READ-ONLY** - NO INSERT, UPDATE, DELETE
  - dbo.Groups (Albums), dbo.Categories, dbo.Sessions (LEGACY), dbo.Speakers, dbo.SessionTranscripts
  - dbo.GetAllGroups (stored procedure), dbo.GetCategoriesForGroup (stored procedure)
  
  > **Verified 2025-10-12**: Only dbo tables with EF models or direct SQL usage are listed.
  > NOOR CANVAS does NOT use dbo.Members, dbo.SessionTokens, dbo.Users, or dbo.Tokens.
  
- ❌ **All other schemas**: **READ-ONLY**

**CRITICAL PROHIBITIONS**:
- ❌ **NEVER use LocalDB** - Prohibited for all workflows (development, testing, production)
- ❌ **NEVER modify dbo.* schema** - READ-ONLY enforced
- ❌ **NEVER inject DbContext in UI** - Use HTTP APIs only (see Database Access Architecture below)

**UI-DATABASE MAPPING**:
- In UI layer, `albumID` corresponds to `GroupID` in SQL table `dbo.Sessions.Groups`

**VIOLATION CONSEQUENCES**:
- Immediate task failure
- Rollback to checkpoint
- User notification of violation

**See**: `.github/instructions/Links/InfrastructureQuickRef.md` for complete database documentation

## Core Principles
- **Deterministic rails**: Follow these rules exactly; do not invent new flows
- **Single source of truth**: Prompts in `.github/prompts/`; configs and state under `Workspaces/Copilot/`
- **Evidence-first**: Factor terminal logs, analyzers, and artifacts into analysis and summaries
- **Small steps**: Change one thing at a time, accumulate tests, and stabilize before moving on
- **Shortcut expansion**: Always expand user shorthand via UserDictionary.md during analysis phase
- **Document before code**: Update plan.md/work-log.md BEFORE implementing changes

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

### Markdown Output Placement (STRICT)
- Do NOT create or save any Markdown files under `.github/prompts/` or `.github/instructions/`.
- All agent-generated Markdown must be written only under `Workspaces/Copilot/_DOCS/`.
  - Analysis reports → `Workspaces/Copilot/_DOCS/analysis/`
  - Completion summaries/work logs → `Workspaces/Copilot/_DOCS/summaries/`
  - Config/documentation → `Workspaces/Copilot/_DOCS/configs/`
  - Migrations/reorg notes → `Workspaces/Copilot/_DOCS/migrations/`
  - Temporary notes/drafts → `Workspaces/Copilot/_DOCS/temp/`
  - Exception: Key data streams in `.github/key-data-streams/` remain as-is.

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
└── key-data-streams/           # Key-based prompt storage
```

### Code Quality Analysis - Roslynator Organization
**MANDATORY**: All Roslynator code analysis data is strictly organized under `Workspaces/CodeQuality/` with documentation stored in `Workspaces/Documentation/ROSLYNATOR DOCS/`:

```
Workspaces/CodeQuality/
├── README.md                         # Comprehensive usage documentation
├── run-roslynator.ps1               # Automated analysis execution script
├── CONFIGURATION_COMPLETE.md        # Setup completion status
└── Roslynator/
    ├── Config/
    │   └── roslynator.config        # Main Roslynator configuration
    ├── Reports/
    │   ├── baseline-analysis.json   # Initial baseline for comparison
    │   ├── latest-analysis.json     # Most recent analysis (GitLab format)
    │   └── analysis_*.json          # Timestamped historical reports
    └── Logs/
        ├── latest-analysis.log      # Most recent execution log
        └── analysis_*.log           # Timestamped historical logs

Workspaces/Documentation/ROSLYNATOR DOCS/
├── latest-roslynator-documentation.md    # Most recent analysis documentation
└── roslynator-documentation_*.md         # Timestamped historical documentation
```

**Roslynator Documentation Features:**
- **Automatic Generation**: Enhanced markdown documentation with executive summaries
- **Health Scoring**: Project health scores calculated from diagnostic patterns
- **Severity Analysis**: Issues grouped by Error, Warning, Info, and Suggestion levels
- **File Rankings**: Identification of files requiring the most attention
- **Actionable Recommendations**: Specific improvement suggestions based on analysis
- **Dual Format Output**: Both technical JSON reports and user-friendly documentation

**Roslynator Execution Rules:**
- **NEVER** run `roslynator` commands directly in project root
- **ALWAYS** use: `.\Workspaces\CodeQuality\run-roslynator.ps1`
- **VS Code Integration**: Use tasks "run-roslynator-analysis" or "run-roslynator-analysis-and-open"
- **Report Access**: Latest results always at `Workspaces/CodeQuality/Roslynator/Reports/latest-analysis.json`
- **Documentation Access**: Latest user-friendly docs at `Workspaces/Documentation/ROSLYNATOR DOCS/latest-roslynator-documentation.md`
- **No Root Pollution**: All analysis artifacts are contained in the organized structure

**Enforcement:**
- **Summaries**: `Workspaces/Copilot/_DOCS/summaries/`
- **Analysis**: `Workspaces/Copilot/_DOCS/analysis/`
- **Config Documentation**: `Workspaces/Copilot/_DOCS/configs/`
- **Migration Reports**: `Workspaces/Copilot/_DOCS/migrations/`
- **Code Quality**: `Workspaces/CodeQuality/Roslynator/`
- **Never use project root** for any temporary or analysis files

## Absolute Runtime Rules

### For .NET Application Development
- **Never** launch with `dotnet run` or any variant.  
- Launch only via PowerShell scripts:  
  - `./Workspaces/Global/nc.ps1`  (launch only)  
  - `./Workspaces/Global/ncb.ps1` (clean, build, then launch)  
- If the agent initiates a stop/restart, **self-attribute** in logs and summaries.

### For Database Access Architecture
- **CRITICAL RULE**: Database data MUST ONLY be accessed via HTTP APIs, NEVER directly through DbContext injection in UI components
- **UI Layer Prohibition**: Razor pages and components must NOT inject `SimplifiedCanvasDbContext` or `KSessionsDbContext`
- **Required Pattern**: UI → HTTP API → Controller → DbContext → Database
- **API-First**: All database operations must go through properly designed API endpoints with DTOs
- **No Direct Queries**: Never use Entity Framework queries directly in UI layer (Pages/, Components/)
- **Enforcement**: Controllers may use DbContext internally, but UI components must use HttpClientFactory for all data access

### For Playwright Testing
**CRITICAL**: ALL Playwright tests MUST use orchestration scripts with direct dotnet.exe launch!

**⚠️ ABSOLUTE REQUIREMENT: Use Orchestration Scripts**

- **ALWAYS** use orchestration scripts in `Scripts/run-{feature}-test.ps1`
- **ALWAYS** launch app with direct `Start-Process -FilePath "dotnet"` (v3.0 pattern)
- **ALWAYS** use health check polling with port binding validation (not fixed delays)
- **ALWAYS** use `try/finally` for guaranteed cleanup
- **NEVER** use `PW_MODE=standalone` or `webServer` config (DEPRECATED approach)
- **NEVER** use `Start-Job` for app startup (unreliable)
- **NEVER** use nested PowerShell windows (slow health checks, unreliable cleanup)
- **NEVER** use direct `npx playwright test` without orchestration script
- **NEVER** use PowerShell background operator `&` (doesn't work in PowerShell 5.1)

**Orchestration Script Pattern v3.0 (MANDATORY):**
```powershell
# 1. Launch app with direct dotnet.exe (SEPARATE WINDOW)
$appInfo = & "Scripts\Test-Framework\Start-NoorCanvasForTests.ps1" `
    -Url "https://localhost:9091" `
    -Environment "Development"

# Start-NoorCanvasForTests.ps1 internally does:
# - Direct dotnet.exe launch (no nested PowerShell)
# - Port binding check + HTTP health check
# - Exponential backoff (500ms, 1s, 2s, 3s)
# - Returns process info for cleanup

# 2. Run tests with guaranteed cleanup
try {
    npx playwright test test.spec.ts --headed
} finally {
    # Cleanup using returned process ID
    Stop-Process -Id $appInfo.ProcessId -Force -ErrorAction SilentlyContinue
}
```

**Why Direct dotnet.exe Launch is Mandatory (v3.0):**
- ✅ Eliminates nested process hierarchies (faster health checks: 1-3 attempts vs 5-15)
- ✅ Proper environment isolation (`ASPNETCORE_ENVIRONMENT=Development`)
- ✅ Reliable PID tracking for cleanup (single process owner)
- ✅ Port binding validation before HTTP checks (faster detection)
- ✅ Guaranteed cleanup via `try/finally`
- ✅ Visible window for debugging (can check logs if tests fail)

**See:** 
- `.github/prompts/shared/test-orchestration-patterns.md` - Canonical template
- `.github/prompts/shared/app-launch-fix-protocol.md` - v3.0 implementation details
- `Scripts/Test-Framework/Start-NoorCanvasForTests.ps1` - Canonical launcher

**Manual App Launch (nc.ps1/ncb.ps1) is ONLY for:**
- Development: Manual testing in browser
- Debugging: Visual Studio/VS Code debugger
- **NEVER** for Playwright test execution (use orchestration scripts instead)

#### ✅ Multi-Browser Isolation Success (Oct 1, 2025)
**Proven Solution**: API-based participant identification eliminates "same name on multiple browsers" issue
- **Working Tokens**: Session 212 - KJAHA99L (user) / PQ9N5YWW (host)
- **Test Suite**: `PlayWright/tests/multi-browser-participant-isolation.spec.ts` (ALL TESTS PASS ✅)
- **Key Pattern**: Direct `/session/canvas/{token}` navigation with API-based loading
- **Reference**: See `Links/PlaywrightTestPaths.MD` for comprehensive API-based testing patterns

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
- Always operate within Git
- On completion: ensure `git status` is clean
- Commits must include RUN_ID in the message for traceability
- **Backup discipline**: Create backup commit before /workitem or /todo
- **Rollback support**: Store commit hashes in undo logs; use `git reset --hard <hash>`
- **Squash on lock**: On /keylock, squash backup commits into one final commit

---

## 🎯 Quick Reference Card

### Most Common Rules (Copy-Paste Reference)

**Database:**
- Server: `AHHOME` | Database: `KSESSIONS_DEV`
- ✅ canvas.* = READ-WRITE | ❌ dbo.* = READ-ONLY | ❌ Never use LocalDB

**Branches:**
- ✅ development (DEFAULT - all work here) | ❌ master (PROTECTED - deploy only)

**File Organization:**
- ✅ Docs → `Workspaces/Copilot/_DOCS/` | ❌ Never in `.github/prompts/` root
- ✅ Tests → `Workspaces/TEMP/` (temporary) or proper structure (permanent)

**Routing Commands** (Case-Insensitive):
- **Standard**: `/route key: hcp-ids` (all lowercase recommended)
- **Also works**: `/route Key: hcp-ids` or `/route KEY: hcp-ids`
- Parameter names are case-insensitive (key/Key/KEY, target/Target/TARGET)
- Always detects existing keys and offers execution options before creating new plans

**Playwright Testing:**
- ✅ Use orchestration scripts (`Scripts/run-{feature}-test.ps1`)
- ✅ Direct dotnet.exe launch with health checks
- ❌ Never use `PW_MODE=standalone` or `webServer` config

**Document First Protocol:**
- 1️⃣ Update plan.md + work-log.md | 2️⃣ Commit docs | 3️⃣ Implement code | 4️⃣ Commit code

**Debug Logging:**
```
[DEBUG-WORKITEM:{key}:{layer}:{RUN_ID}] message ;CLEANUP_OK
```

**Essential Files to Read First:**
- UserDictionary.md (shortcuts) | SystemIndex.md (navigation) | InfrastructureQuickRef.md (database)

---

## 📜 Version History

### v2.10.0 (2025-10-30)
- 🚨 **CRITICAL**: Added reference to `.github/MANDATORY.md` as first item in Essential Reading
- 🚨 **CRITICAL**: All prompts now load MANDATORY.md before any work (enforces 3 absolute rules)
- 📋 MANDATORY.md consolidates 3 critical violations into single entry point:
  1. No code in chat (merged from CONCISE-MANDATE.md, snippet-handling-policy.md)
  2. Document first (enforces step-2-5-document-first-checkpoint.md protocol)
  3. Playwright orchestration (enforces PlaywrightTestOrchestration.md pattern)
- ✅ All 10 prompt files updated with `**LOAD FIRST:** .github/MANDATORY.md` header
- 📊 Violations now logged to `.github/audits/mandate-violations.log`
- 🔧 Auto-enforcement algorithms with HALT on violation detection

### v2.9.0 (2025-10-30)
- ✨ Added Table of Contents for easier navigation
- ✨ Added Essential Reading section at top with cross-references
- ✨ Added Quick Reference Card for most common rules
- ✨ Added Version History section
- 🔧 Consolidated duplicate database information into single section
- 🔧 Enhanced Database Access Rules with connection string and prohibitions
- 🔧 Added backup discipline and rollback rules to Version Control
- 🔧 Enhanced Core Principles with shortcut expansion and document-first rules

### v2.8.0 (2025-09-27)
- Documentation Organization & File Placement Rules
- npm Script Enforcement updates

### v2.5.0 (Previous baseline)
- KDS Architecture lessons learned
- Document First, Respond Later Protocol
- File Organization Rules
- Branch Strategy enforcement

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

> **Note**: Database connection details consolidated in [Database Access Rules](#️-database-access-rules-mandatory) section above.

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
- **Token Validation**: `/api/host/token/{token}/validate` for friendly tokens
- **Route Conflicts**: Always check for ambiguous route patterns during development
- **SignalR Integration**: Handle InvalidDataException during data parsing; verify message serialization
- **Authentication Flows**: Validate token formats match expected endpoint requirements

**See**: `.github/instructions/Links/Architecture.md` for complete API endpoint catalog (52 endpoints across 11 controllers)

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
- **UI-Database Mapping**: In UI layer, `albumID` corresponds to `GroupID` in SQL table `dbo.Sessions.Groups`

### Data Management
- **Album & Category Data**: Support dynamic loading from KSESSIONS database
- **Session Transcripts**: Proper validation and storage with token-based access
- **Participant Management**: Real-time participant list updates via SignalR
- **Flag Display**: ISO2 country code mapping for participant countries

---

## Reference: System Index
This instruction set references the central `SystemIndex.md`. Any structural changes must be reflected there.