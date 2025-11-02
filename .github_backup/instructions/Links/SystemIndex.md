# System Index

**Version**: 3.2.0  
**Last Updated**: 2025-10-21  
**Maintained By**: Sync Agent  
**Auto-Update**: This file is automatically updated by Copilot agents when infrastructure, architecture, or configuration changes occur.

**Active Agents**: 9
- plan, task, ask, test-generation, refactor, healthcheck, analyze-learning, sync, cohesion-review

---

## 🗄️ Critical Database Rules

**PRIMARY DATABASE: KSESSIONS_DEV**
- When user mentions "database", they mean **KSESSIONS_DEV**
- Server: AHHOME
- Connection: `_configuration.GetConnectionString("DefaultConnection")`

**SCHEMA ACCESS RULES**:
- ✅ **`canvas.*`** - READ-WRITE (Questions, Votes, Participants, Annotations)
- ❌ **`dbo.*`** - **READ-ONLY** (Sessions, Users, Tokens, Transcripts, Countries)
- ❌ **All other schemas** - **READ-ONLY**

**See**: `InfrastructureQuickRef.md` for complete database documentation

---

## 🧪 Automated End-to-End Visual Regression Testing

**When user mentions "Playwright test" or "pwtest":**

Create automated end-to-end tests using Playwright and Percy. **ALL Playwright tests MUST use orchestration scripts** that launch the application in a separate PowerShell window for proper environment isolation, visible debugging, and reliable cleanup.

**CRITICAL REQUIREMENTS:**
- ✅ **ALWAYS** create orchestration script in `Scripts/run-{feature}-test.ps1`
- ✅ **ALWAYS** launch app in separate PowerShell window (not background, not hidden)
- ✅ **ALWAYS** use health check polling (not fixed delays)
- ✅ **ALWAYS** use `try/finally` for guaranteed cleanup
- ❌ **NEVER** use `PW_MODE=standalone` or webServer config (DEPRECATED)
- ❌ **NEVER** use direct `npx playwright test` without orchestration
- ❌ **NEVER** use `Start-Job` or PowerShell background operator `&`

**Required Pattern:**
```powershell
# Launch in separate window with health check
$app = Start-Process powershell -ArgumentList "-NoExit", "-Command",
    "cd 'D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas'; 
     `$env:ASPNETCORE_ENVIRONMENT='Development'; 
     dotnet run" -WindowStyle Minimized -PassThru

# Health check polling (not fixed delay)
# ... polling logic ...

# Run tests with guaranteed cleanup
try {
    npx playwright test test.spec.ts --headed
} finally {
    Stop-Process -Id $app.Id -Force -ErrorAction SilentlyContinue
}
```

- Test Location: `PlayWright/tests/`, `Tests/UI/`, or `Workspaces/TEMP/` (temporary)
- Configuration: `config/testing/playwright.config.cjs`
- Test Data: Session 212 (tokens: KJAHA99L user / PQ9N5YWW host)
- Base URL: `https://localhost:9091`
- Orchestration Template: `.github/prompts/shared/test-orchestration-patterns.md` ⭐ **MANDATORY READING**

**See**: `PlaywrightQuickRef.md` for complete testing documentation

---

## 📋 Quick Navigation

### Planning & Orchestration
- **plan.prompt.md** ⭐ **NEW** - Interactive planning for complex implementations (requirement refinement, phased execution, test plans, architecture analysis)
- **shared/agent-handoff-protocol.md** - Agent-to-agent handoff specification (plan → task workflow)

### Architecture & Infrastructure
- **Architecture.md** - Full system design (controllers, services, SignalR hubs, database schema)
- **InfrastructureQuickRef.md** ⭐ - DB connections (KSESSIONS_DEV rules), API endpoints, test data
- **CDN-Architecture.md** - Resources CDN architecture (media serving, CORS, URL patterns)
- **Cloudflare-Configuration.md** ⭐ **NEW** - Cloudflare Tunnel setup, dashboard access, troubleshooting, management scripts

### Validation & Quality
- **ValidationFramework.md** - 6-level validation pipeline (build → analyzers → E2E)ion hub for all architectural and configuration references.**

**Version**: 3.1.0  
**Last Updated**: 2025-10-14  
**Maintained By**: Sync Agent  
**Auto-Update**: This file is automatically updated by Copilot agents when infrastructure, architecture, or configuration changes occur.

---

## �️ Critical Database Rules

**PRIMARY DATABASE: KSESSIONS_DEV**
- When user mentions "database", they mean **KSESSIONS_DEV**
- Server: AHHOME
- Connection: `_configuration.GetConnectionString("DefaultConnection")`

**SCHEMA ACCESS RULES**:
- ✅ **`canvas.*`** - READ-WRITE (Questions, Votes, Participants, Annotations)
- ❌ **`dbo.*`** - **READ-ONLY** (Sessions, Users, Tokens, Transcripts, Countries)
- ❌ **All other schemas** - **READ-ONLY**

**See**: `InfrastructureQuickRef.md` for complete database documentation

---

## �📋 Quick Navigation

### Architecture & Infrastructure
- **Architecture.md** - Full system design (controllers, services, SignalR hubs, database schema)
- **InfrastructureQuickRef.md** ⭐ - DB connections (KSESSIONS_DEV rules), API endpoints, test data

### Validation & Quality
- **ValidationFramework.md** - 6-level validation pipeline (build → analyzers → E2E)
- **API-Contract-Validation.md** - Cross-layer contract validation rules
- **AnalyzerConfig.MD** - Code quality tool configurations (Roslynator, StyleCop, ESLint)

### Testing
- **PlaywrightQuickRef.md** ⭐ - Complete Playwright testing guide (test creation, execution, patterns)
- **PlaywrightConfig.MD** - Detailed configuration reference
- **PlaywrightTestPaths.MD** - Canonical test patterns and test data

### Feature Tracking
- **FunctionalityRegistry.md** - Feature tracking schema for regression prevention

### Prompt Enhancement (Optional)
- **PromptEnhancementLibraries.md** 💡 - External libraries for prompt optimization, testing, and orchestration (DSPy, Semantic Kernel, LangChain, PromptFoo, Langfuse)

---

## 🤖 Active Prompt Agents

### Primary Agents

- **feature.prompt.md** - Feature Planning Agent ⭐ **NEW**
  - Interactive planning agent for complex implementations
  - Refines user requests into phased, testable plans
  - Includes test specification generation
  - User approval gate before execution
  - Hands off to task.prompt.md for implementation
  - Image analysis support for visual requirements (Step 0.6)
  - **WHEN TO USE**: Complex multi-phase work (3+ phases), unclear requirements, need comprehensive test plan
  - **HANDOFF**: Generates comprehensive plan → invokes task.prompt.md automatically
  - **KEY FEATURES**:
    - Interactive refinement with user approval
    - Phase-based breakdown with dependencies
    - Technology stack analysis
    - Architecture layer detection
    - Cross-key pattern analysis
    - Enhancement recommendations
    - Test specification generation
    - JSON tracking for programmatic progress queries
    - System Context Pack (APIs, database schemas, SignalR hubs, test data)
  - **OUTPUTS**: `{key}.plan.md`, `{key}.plan.json`, `work-log.md`
  - **SIZE**: 3740 lines (largest prompt - module extraction planned)

- **task.prompt.md** - Canonical task executor
  - File auto-loading, checkpoint commits
  - 9-step workflow with validation gates
  - **Plan integration**: Loads `{key}.plan.md` and `{key}.plan.json` when available
  - Automatic test generation using Playwright, Percy, and configured libraries (Step 6.1)
  - Functionality registry validation (Step 8.2)
  - **MUST** consult InfrastructureQuickRef.md for database rules
  - **MUST** consult PlaywrightQuickRef.md for test creation
  - **WHEN TO USE**: Simple tasks, quick fixes, or continuation of planned work
  - **HANDOFF**: Called by plan.prompt.md for phased execution
  - **CRITICAL**: Launch application in separate PowerShell window before executing headed tests

- **ask.prompt.md** - Application knowledge agent
  - One-stop Q&A solution
  - Deep application analysis
  - Supports all agents with investigation
  - **MUST** reference InfrastructureQuickRef.md for infrastructure queries
  - **MUST** reference PlaywrightQuickRef.md for test-related questions

- **refactor.prompt.md** - Structural integrity agent
  - Checkpointed refactoring workflow
  - Approval-gated changes
  - Zero-warning enforcement
  - Triggers healthcheck for validation
  - **MUST** respect database schema access rules

- **sync.prompt.md** - Synchronizer + janitor
  - Documentation alignment
  - Configuration maintenance
  - System cleanup duties
  - Updates this file automatically

- **healthcheck.prompt.md** - System health auditor
  - Read-only consistency checks
  - Cross-layer validation
  - Reports to sync for fixes

- **test-generation.prompt.md** - Automated end-to-end visual regression test generator
  - Creates tests using Playwright, Percy, and configured libraries
  - Session 212 canonical patterns
  - Multi-browser testing support
  - API-based test approaches
  - **CRITICAL**: Application must be launched in separate PowerShell window for headed tests

- **analyze-learning.prompt.md** - Self-learning analysis agent
  - Pattern extraction from completed keys
  - Continuous improvement recommendations
  - Learning infrastructure updates

- **cohesion-review.prompt.md** - Prompt system auditor
  - Redundancy detection
  - Efficiency optimization
  - Cross-agent coordination review

### Retired Agents
- **retrosync.prompt.md** → Replaced by sync
- **cleanup.prompt.md** → Folded into sync
- **task.md** → Merged into task.prompt.md
- **align.prompt.md** → Renamed to healthcheck.prompt.md

---

## 🎯 Functionality Registry Quick Reference

### For Task Agent (Step 8.2)

**Workflow**:
```
1. Load {key}.md → Parse registry (behaviors, file watch, test coverage)
2. Compare modified files vs file watch
   - Match → High regression risk → Trigger validation
   - No match → Low risk → Skip validation
3. Execute validation (automated tests or manual checklist)
4. Handle result (PASS → allow commit | FAIL → block commit)
```

### Validation Output Templates

**Registry Exists + Validation PASS**:
```
✅ Functionality Validation: PASS
- Core behaviors: 5 verified
- Tests executed: 3 manual validations
- Registry updated (Last Validation: 2025-10-12 14:23:45)
```

**Registry Exists + Validation FAIL**:
```
❌ Functionality Validation: FAIL
- Failed behaviors: Valid Token Flow
- Test failures: User saw token panel flash
- COMMIT BLOCKED - fix regression before proceeding
```

**No File Watch Match**:
```
✓ No file/method watch matches - low regression risk
- Modified files: 2
- Watched files: 3 (no overlap)
- Validation: SKIPPED (optional)
```

**No Registry Exists**:
```
ℹ️ No Functionality Registry found for key 'user-auth'
Consider adding one to track core behaviors and prevent regressions.

Template: .github/key-data-streams/_template/key-template.md
Guide: .github/instructions/Links/FunctionalityRegistry.md
```

### Manual Validation Prompt Template

```
⚠️ REGRESSION RISK: Manual Validation Required

Modified File: UserLanding.razor (File Watch match)
Affected Behaviors: 3 core behaviors

Please verify the following still work:

□ Behavior 1 description
  Navigate to: URL
  Expected: Outcome
  
□ Behavior 2 description
  Navigate to: URL
  Expected: Outcome

Confirm all behaviors work correctly? (yes/no)
```

---

## 🔄 Recommended Workflows

### Complex Feature Implementation (Multi-Phase)
1. **feature.prompt.md** - Refine requirements, generate phased plan with test specifications
2. **User approval** - Review plan draft, select enhancements, answer open questions
3. **User says "proceed"** - Feature planning agent invokes task.prompt.md automatically
4. **task.prompt.md** - Execute phases sequentially (loads `{key}.plan.md` and `{key}.plan.json`)
5. **test-generation.prompt.md** - Generate E2E tests (invoked automatically by task agent)
6. **healthcheck.prompt.md** - Validate implementation (recommended)

### Simple Task Implementation (Single-Phase)
1. **task.prompt.md** - Direct execution (skip planning for simple tasks)
2. **test-generation.prompt.md** - Generate tests if needed
3. **healthcheck.prompt.md** - Validate (optional)

### Code Quality Improvement
1. **refactor.prompt.md** - Improve structure, reduce complexity
2. **healthcheck.prompt.md** - Validate no behavior change
3. **sync.prompt.md** - Clean up obsolete files (optional)

### System Maintenance
1. **sync.prompt.md** - Documentation alignment, configuration updates, cleanup
2. **healthcheck.prompt.md** - Validate system integrity
3. **cohesion-review.prompt.md** - Audit prompt system (monthly)

### Investigation & Analysis
1. **question.prompt.md** - Deep application analysis, Q&A
2. **analyze-learning.prompt.md** - Extract patterns from completed keys
3. **cohesion-review.prompt.md** - Review prompt system health

---

## 🔄 Agent Coordination Protocols

### Interaction Patterns
- **plan** → Creates comprehensive plan, invokes **task** automatically with `{key}.plan.md`, `{key}.plan.json`
- **task** → Loads plan (if exists), executes work, creates tests automatically, updates key stream progressively
- **analyze-learning** → Analyzes key data, updates learning infrastructure, generates recommendations
- **refactor** → Improves structure, triggers **healthcheck** for validation
- **sync** → Orchestrates state, maintains documentation alignment, updates **SystemIndex.md**
- **healthcheck** → Validates integrity, reports to **sync** for fixes
- **question** → Analyzes queries, supports all agents with knowledge

### Cross-Agent Learning Infrastructure
- **Directory**: `Workspaces/Copilot/learning/`
- **Pattern Files**: 
  - `task-patterns.json`
  - `refactor-patterns.json`
  - `validation-patterns.json`
  - `integration-patterns.json`
- **Mandate**: All agents query patterns before execution, contribute learnings after success
- **Analysis Frequency**: Weekly or after 10 completed keys
- **Knowledge Sharing**: Successful patterns shared across agent boundaries

---

## 📊 Current System Snapshot

**Last Architecture Scan**: 2025-10-12

### API Controllers
- **Total Controllers**: 11
- **Total Endpoints**: 52+
- **Key Controllers**: Admin, Host, Participant, Question, Session, Annotations, Health, Token, HostProvisioner, Issue, Logs

### SignalR Hubs
- **Total Hubs**: 4
- **Active Hubs**: SessionHub, QAHub, AnnotationHub, TestHub (dev only)

### Services
- **Total Services**: 17+
- **Core Services**: AssetHtmlProcessingService, HostSessionService, SimplifiedTokenService, SessionStateService, ConfigurableLoadingService

### Database Integration
- **Primary DB**: Canvas (sessions, participants, questions, votes, annotations)
- **Secondary DB**: KSESSIONS (Islamic content, transcripts, country flags)
- **Access Pattern**: API-First (no direct DbContext in components)

### Razor Components
- **Pages**: 15+
- **Key Routes**: 
  - `/host/control-panel/{hostToken}`
  - `/session-canvas/{token}`
  - `/session-waiting/{token}`
  - `/user/landing/{token?}`
  - `/host/session-opener/{hostToken}`

---

## 🔧 Key Management

- **Location**: `.github/key-data-streams`
- **States**: `new`, `In Progress`, `complete`
- **Sorting**: Always alphabetically sorted
- **Template**: `_template/key-template.md`

---

## 🎓 LLM Optimization Principles

- **Consistent Structure**: All prompts follow identical format patterns
- **Clear Parameters**: Standardized parameter names across agents
- **Explicit Instructions**: No ambiguous language
- **Error Prevention**: Built-in validation and retry mechanisms
- **Context Preservation**: Comprehensive state tracking and handoff

---

## 📚 Related Documentation

### Global Instructions
- **SelfAwareness.instructions.md** - Global guardrails and operating rules

### Testing References
- **Multi-Browser Testing**: See `../prompts/multi-browser-testing.prompt.md`
- **Success Stories**: `../copilot-chats/` directory

---

## 🔄 Auto-Update Protocol

This file is automatically updated by the **sync** agent when:
- New API endpoints are added or removed
- Controllers, services, or hubs are created/modified
- Database schema changes occur
- New Razor components are added
- SignalR hub functionality changes
- Prompt agents are created, modified, or retired
- Learning infrastructure is enhanced

**Update Frequency**: On-demand when changes are detected

**Update Sections**:
- 📊 Current System Snapshot
- 🤖 Active Prompt Agents
- 📋 Quick Navigation (if new reference files added)

**Verification**: After updates, sync agent runs healthcheck to ensure consistency across:
- Architecture.md
- InfrastructureQuickRef.md
- This file (SystemIndex.md)

---

**File Consolidation History**:
- 2025-10-12: Merged ReferenceIndex.md, SystemStructureSummary.md, FunctionalityRegistry-QuickRef.md into SystemIndex.md
- 2025-01-11: Added InfrastructureQuickRef.md
- 2025-01-11: Created FunctionalityRegistry-QuickRef.md
