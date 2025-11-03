# KDS Universal Entry Point

**Purpose:** Single command for ALL KDS interactions. You don't need to remember multiple commands - just use this one and KDS figures out what you need.

**Version:** 5.0 (SOLID Refactor)  
**Status:** 🎯 ACTIVE DESIGN  
**Architecture:** SOLID-compliant modular system

---

## 📊 Implementation Status

**Legend:**
- ✅ **Fully Implemented** - Working and tested
- 🟡 **Partially Implemented** - Core working, missing features
- 🔄 **In Progress** - Currently being developed
- 📋 **Designed Only** - Documentation exists, no code

| Feature | Status | Notes |
|---------|--------|-------|
| **Core Routing** | ✅ | Intent router fully functional |
| **Agent Architecture (SOLID)** | ✅ | 10 specialist agents operational |
| **Tier 2: Knowledge Graph** | ✅ | Learning from interactions (95% complete) |
| **Event Logging** | ✅ | All agents log to events.jsonl |
| **Protection System** | ✅ | Confidence thresholds, anomaly detection |
| **Tier 3: Development Context** | ✅ | Collecting git/test/build metrics (1,249 commits analyzed) |
| **Commit Handler** | ✅ | Smart validation with baseline comparison |
| **Tier 1: Conversation History** | ✅ | Complete - 3 conversations stored, FIFO queue working |
| **Conversation Tracking** | ✅ | Integrated with intent router - "Make it purple" works |
| **Setup Automation** | 📋 | Documented - not implemented |
| **Brain Crawler** | 📋 | Designed - not implemented |

**Last Updated:** 2025-11-03  
**Self-Review Date:** 2025-11-03

---

## 🧚 A story for humans: The One Door and the Three‑Story Brain

Imagine a small, well-run city called KDS. At the very front of City Hall there’s only one entrance with a sign that says:

“Speak here in plain words. We’ll take it from there.”

That entrance is the One Door — your single command: `#file:KDS/prompts/user/kds.md`. You step up and say what you want, and the city quietly springs into action.

### The cast (each with exactly one job)

- The Door (Universal Entry Point)
  - Listens to your request in natural language and ushers it inside. You never need to remember a different door.

- The Dispatcher (Router → `intent-router.md`)
  - Hears your words and decides who should take the job first. If you say “I want to add…”, it calls the Planner; if you say “continue”, it calls the Executor; if you say “test this”, it calls the Tester.

- The Planner (Work Planner → `work-planner.md`)
  - Turns big wishes into careful phases and small tasks. No building begins without a plan that matches the city’s layout.

- The Builder (Executor → `code-executor.md`)
  - Creates or edits what’s needed, one focused task at a time, following the plan.

- The Tester (Test Generator → `test-generator.md`)
  - Writes and runs checks to prove the work behaves as promised, including visual checks when needed.

- The Inspector (Health Validator → `health-validator.md`)
  - Walks the site to verify the system is healthy: builds, tests, and safeguards are green.

- The Governor (Change Governor → `change-governor.md`)
  - Reviews changes made to the city’s own rules (KDS itself) and keeps standards high.

- The Fixer (Error Corrector → `error-corrector.md`)
  - If someone starts working on the wrong thing or in the wrong place, the Fixer halts, reverts, and puts everyone back on the correct track.

- The Timekeeper (Session Resumer → `session-resumer.md`)
  - Remembers exactly where you left off yesterday and guides you to the next step today.

- The Analyst with a Lens (Screenshot Analyzer → `screenshot-analyzer.md`)
  - Looks at pictures and mockups and translates what’s on the screen into clear requirements.

- The Archivist (Commit Handler → `commit-handler.md`)
  - Files finished work with tidy labels, organizes related changes, and tags milestones so history stays readable.

Every person in KDS City has one job on purpose. That’s the SOLID way: simple roles, clean handoffs, and no one wearing two hats.

### The Three‑Story Brain at the center of town

In the town square stands a quiet, wise building called the Brain. It has three floors:

1) Ground Floor — Short‑Term Conversations (Tier 1 → `conversation-history.jsonl`)
   - Keeps the last 20 complete conversations. If you say, “Make it purple,” it remembers which “it” you meant. The oldest conversation is gently filed away when a new one begins (FIFO), and the active one is never discarded.

2) Second Floor — Long‑Term Knowledge (Tier 2 → `knowledge-graph.yaml`)
   - All the city’s experiences become patterns here: which requests usually mean which intent, which files often change together, what workflows succeed. It grows wiser with use.

3) Top Floor — Development Context (Tier 3 → `development-context.yaml`)
   - A balcony view of the whole project: commit rhythms, file hotspots, testing health, and helpful correlations. It can gently warn, “That file has been unstable lately,” or “Smaller steps work better here.”

Feeding the Brain is the Scribe — an ever‑writing pen (`events.jsonl`). After meaningful periods (say, ~50 new events or a day has passed), the Brain Updater (`brain-updater.md`) tidies notes into long‑term memory and, when it’s been at least an hour, refreshes the balcony view (Tier 3) using the Development Context Collector (`development-context-collector.md`).

### A day in KDS City (how the parts work together)

You arrive at the Door and say, “I want to add a pulse animation to the FAB button.”

1) The Door opens → The Dispatcher listens and says, “This is a plan.” It calls the Planner.
2) The Planner drafts a simple map: phases, tasks, and acceptance criteria that match how the city is built today — including what must be verified.
3) The Tester writes the checks first and runs them (RED). The city expects failing tests before any building begins.
4) The Builder implements the change to make those checks pass (GREEN), in the right place, the right way.
5) The Tester reruns the checks until they’re all green, and small cleanups happen safely (REFACTOR) while tests stay green.
6) The Inspector strolls through. “Healthy,” they say.
7) The Archivist files the work cleanly, perhaps adding a tag for this milestone.
8) The Scribe logs each step; later, the Brain absorbs the experience so the next similar request is faster and safer.

> TDD is the rule here: write the checks first (RED), make them pass (GREEN), then polish (REFACTOR).

If mid‑way someone starts in the wrong file, the Fixer freezes the scene, undoes the mistake, and points to the correct file. If you return tomorrow and say, “continue,” the Timekeeper guides you to the exact next step without you repeating a thing.

If you bring a screenshot instead of words, the Analyst with a Lens reads the picture like a blueprint and translates it for the Planner and Builder.

### Why the city runs smoothly

- One Door means zero guesswork for you. You always speak in plain words.
- The Dispatcher consults the Brain, so routing gets smarter over time.
- Each specialist does one job, which keeps quality high and surprises low.
- The Brain remembers conversations (short‑term), learns patterns (long‑term), and watches the horizon (context) to guide better decisions.

### Try it in one sentence

Use the One Door and just talk:

```markdown
#file:KDS/prompts/user/kds.md

I want to add a pulse animation to the FAB button
```

KDS City will plan it, build it, test it, validate it, commit it — and learn from it.

### Who’s who (quick reference)

- Universal Entry: `kds.md` (this file)
- Router: `intent-router.md`
- Planner: `work-planner.md`
- Executor: `code-executor.md`
- Tester: `test-generator.md`
- Validator: `health-validator.md`
- Governor: `change-governor.md`
- Error Corrector: `error-corrector.md`
- Session Resumer: `session-resumer.md`
- Screenshot Analyzer: `screenshot-analyzer.md`
- Commit Handler: `commit-handler.md`
- Knowledge Retriever: `knowledge-retriever.md`
- Metrics Reporter: `metrics-reporter.md`
- Brain Updater: `brain-updater.md`
- Brain Query: `brain-query.md`
- Conversation Manager: `conversation-context-manager.md`
- Dev Context Collector: `development-context-collector.md`
- Abstractions: `session-loader`, `test-runner`, `file-accessor`, `brain-query`
- Brain Storage: `conversation-history.jsonl`, `knowledge-graph.yaml`, `development-context.yaml`, `events.jsonl`

If all you remember is “the One Door” and “the Three‑Story Brain,” you’ll already understand how KDS works.

## 🎯 The ONLY Command You Need to Remember

```markdown
#file:KDS/prompts/user/kds.md

[Tell KDS what you want in natural language]
```

That's it! KDS will automatically:
- ✅ Analyze your request (intent detection)
- ✅ Route to the appropriate specialist agent
- ✅ Execute the correct workflow
- ✅ Handle multi-step operations
- ✅ Maintain session state

---

## 🏗️ SOLID v5.0 Architecture

### What's New
- ✅ **Single Responsibility (SRP):** Each agent has ONE clear job
- ✅ **Interface Segregation (ISP):** Dedicated agents (no mode switches)
- ✅ **Dependency Inversion (DIP):** Abstractions for session/file/test access
- ✅ **Open/Closed (OCP):** Easy to extend (add new intents/agents)

### Specialist Agents (10 Total)
```
Router            → intent-router.md       → Analyzes & routes requests
Planner           → work-planner.md        → Creates multi-phase plans
Executor          → code-executor.md       → Implements code (test-first)
Tester            → test-generator.md      → Creates & runs tests
Validator         → health-validator.md    → System health checks
Governor          → change-governor.md     → Reviews KDS changes
Error Corrector   → error-corrector.md     → Fixes Copilot mistakes
Session Resumer   → session-resumer.md     → Resumes after breaks
Screenshot Analyzer → screenshot-analyzer.md → Extracts requirements from images
Commit Handler    → commit-handler.md      → Intelligent git commits (NEW)
```

### 🧠 BRAIN System (Self-Learning Feedback Loop)

**NEW in v5.0:** KDS learns from every interaction!  
**ENHANCED in v6.0:** Three-tier architecture with holistic development intelligence!

```
🧠 BRAIN = Three-Tier Intelligence System

Purpose: Learn from interactions, conversations, AND development activity
Storage: KDS/kds-brain/
- conversation-history.jsonl → Last 20 complete conversations (Tier 1) ✅ WORKING
- conversation-context.jsonl → Recent messages buffer (last 10) ✅ WORKING
- knowledge-graph.yaml       → Aggregated learnings (Tier 2) ✅ WORKING
- development-context.yaml   → Holistic project metrics (Tier 3) ✅ WORKING
- events.jsonl               → Raw event stream ✅ WORKING

Architecture: Three-tier system inspired by human cognition
- Tier 1 (Short-term): Last 20 conversations (FIFO queue, no time expiration) 🟡
- Tier 2 (Long-term): Consolidated patterns from deleted conversations ✅
- Tier 3 (Context): Development activity, velocity, correlations ✅
- Design: KDS/docs/architecture/BRAIN-CONVERSATION-MEMORY-DESIGN.md
- Tier 3 Design: KDS/docs/architecture/KDS-HOLISTIC-REVIEW-AND-RECOMMENDATIONS.md
- Validation: KDS/docs/architecture/CONVERSATION-MEMORY-SELF-REVIEW.md (health tracking)
```

**What BRAIN Learns:**
- ✅ Intent patterns (which phrases trigger which intents)
- ✅ File relationships (which files are modified together)
- ✅ Common mistakes (which corrections happen frequently)
- ✅ Workflow patterns (successful task sequences)
- ✅ Validation insights (common failures and fixes)
- ✅ **Conversation history (last 20 complete conversations, FIFO queue)** 🆕
- ✅ **Development velocity (code changes, commit patterns)** 🆕
- ✅ **Testing activity (pass rates, flaky tests, coverage)** 🆕
- ✅ **Work patterns (productive times, focus duration, correlations)** 🆕

**How Automatic Learning Works:**
```
Agent performs action
    ↓
Event logged to events.jsonl (automatic)
Message appended to active conversation
    ↓
Conversation boundary detected? → End conversation, start new one
    ↓
IF 21st conversation starts → Delete oldest conversation (FIFO)
    ↓
Event count checked after each task (Rule #16 Step 5)
    ↓
IF 50+ events OR 24 hours passed → Automatic BRAIN update
    ↓
brain-updater.md processes events → Updates knowledge-graph.yaml
Deleted conversations → Patterns extracted → Long-term memory
    ↓
Next request → Router queries BRAIN + conversation history → Smarter decisions with context
```

**Conversation History Benefits:**
- 🔄 **Continuity:** "Make it purple" knows you mean the FAB button from earlier conversation
- 🧩 **Cross-conversation context:** Reference any of the last 20 conversations
- 💬 **Natural follow-ups:** No need to repeat full context in every message
- 📝 **Reference resolution:** "Change that file" knows which file from conversation history
- ⏳ **Long-running work:** Conversation preserved until 20 newer conversations (days/weeks/months depending on usage)

**FIFO Queue (Conversation-Level):**
- 📊 **Capacity:** Last 20 complete conversations (not individual messages)
- 🔄 **Deletion:** When conversation #21 starts, conversation #1 deleted
- ⏰ **No time limits:** Conversations preserved until FIFO deletion (could be months for light usage)
- ✨ **Active conversation:** Never deleted (even if oldest)
- 🎯 **Pattern extraction:** Before deletion, patterns consolidated to long-term memory

**Privacy & Storage:**
- 🏠 **Local storage:** History stays in `KDS/kds-brain/conversation-history.jsonl`
- 💾 **Predictable size:** Always 20 conversations (~70-200 KB total)
- 🧹 **Manual clear:** Use `#file:KDS/prompts/internal/clear-conversation.md` to reset
- 🔒 **Deleted conversations:** Patterns extracted, details discarded

**Tier 3: Development Context (NEW in v6.0)**

**Purpose:** Holistic project understanding for data-driven planning and proactive warnings

**What's Tracked:**
```yaml
Git Activity:
  - Commit history (30 days)
  - Change velocity per week
  - File hotspots (high churn rate)
  - Contributors and patterns
  
Code Changes:
  - Lines added/deleted
  - Velocity trends (increasing/decreasing)
  - Churn rates per file
  - Stability classification
  
KDS Usage:
  - Session creation and completion rates
  - Intent distribution (PLAN, EXECUTE, TEST, etc.)
  - Workflow success rates
  - Test-first vs test-skip effectiveness
  
Testing Activity:
  - Test creation rate
  - Pass/fail rates
  - Flaky test detection
  - Coverage trends
  
Project Health:
  - Build status
  - Deployment frequency
  - Code quality metrics
  - Issue resolution times
  
Work Patterns:
  - Most productive times
  - Session duration averages
  - Feature lifecycle timing
  - Focus duration without interruptions
  
Correlations:
  - Commit size vs success rate
  - Test-first vs rework rate
  - KDS usage vs velocity
```

**Automatic Benefits:**
```
Planning Phase:
  → "Based on 12 similar UI features, estimated 5-6 days"
  → "Recommend 10am-12pm sessions (94% success rate at that time)"
  → "Test-first approach reduces rework by 68%"

File Modification:
  → "⚠️ HostControlPanel.razor is a hotspot (28% churn)"
  → "This file often modified with noor-canvas.css (75% co-mod rate)"
  → "Add extra testing - file is unstable"

Proactive Warnings:
  → "⚠️ Velocity dropped 68% this week (consider smaller commits)"
  → "⚠️ Flaky test detected: fab-button.spec.ts (15% failure rate)"
  → "✅ Test coverage increased from 72% to 76% (good trend!)"
```

**How to Collect:**
```powershell
# Manual collection (always runs)
.\KDS\scripts\collect-development-context.ps1

# Automatic collection (throttled for efficiency)
# Triggered by brain-updater.md ONLY IF last collection > 1 hour
# This optimizes performance while maintaining accuracy
```

**Storage:**
- File: `KDS/kds-brain/development-context.yaml`
- Size: ~50-100 KB (holistic metrics, not raw data)
- Update: ⚡ **Throttled** - Only when > 1 hour since last collection
- Purpose: Data-driven estimates, proactive warnings, velocity tracking

**⚡ Efficiency Optimization:**
- ✅ **Automatic throttling:** Tier 3 only updates if last_collection > 1 hour
- ✅ **Rationale:** Git/test/build metrics don't change every 50 events
- ✅ **Impact:** Reduces 2-5 min operations from 2-4x/day to 1-2x/day
- ✅ **Accuracy:** 1-hour freshness sufficient for velocity metrics
- 📊 **User benefit:** Zero performance impact, same data quality

**Automatic Update Triggers:**
1. **Event threshold:** 50+ new events accumulated (Tier 2 update)
2. **Time threshold:** 24 hours since last update (Tier 2 if 10+ events exist)
3. **Tier 3 throttle:** Only if last Tier 3 collection > 1 hour ⚡ **NEW**
4. **End of session:** When all tasks in session complete
5. **Manual trigger:** User explicitly calls `#file:KDS/prompts/internal/brain-updater.md`

**🚨 CRITICAL: Event Logging Must Be Active**

For automatic learning to work:
- ✅ All agents MUST log events to `events.jsonl`
- ✅ Events follow standard format (see `KDS/kds-brain/README.md`)
- ✅ `events.jsonl` must be writable (check file permissions)
- ✅ Rule #16 Step 5 must include BRAIN health check

**If BRAIN isn't learning:**
1. Check `events.jsonl` exists and has recent events
2. Verify `knowledge-graph.yaml` updated in last 24 hours
3. Count unprocessed events (warn if >50)
4. Run manual update: `#file:KDS/prompts/internal/brain-updater.md`

**See:** `KDS/docs/architecture/KDS-SELF-REVIEW-STRATEGY.md` for violation detection

**How It Works:**
```
User request → Router queries BRAIN → High confidence? → Auto-route
                                   → Low confidence? → Pattern matching

Agent action → Log event → BRAIN updater processes → Knowledge graph updated

Next request → Router gets smarter (learned from history)
```

**Benefits:**
- 🚀 Faster routing (learns successful patterns)
- ⚠️ Prevents mistakes (warns about common file confusions)
- 💡 Suggests related files (based on co-modification history)
- 📊 Improves over time (accumulates knowledge)

**BRAIN Agents:**
```
brain-query.md   → Query knowledge graph AND development context for insights
brain-updater.md → Process events, update graph, trigger Tier 3 collection
conversation-context-manager.md → Track recent messages for continuity (NEW)
clear-conversation.md → Reset conversation context (NEW)
development-context-collector.md → Collect git, test, build metrics (Tier 3) 🆕
```

### Shared Abstractions (DIP Compliance)
```
session-loader → Abstract session access (file/db/cloud agnostic)
test-runner    → Abstract test execution (framework agnostic)
file-accessor  → Abstract file I/O (path agnostic)
brain-query    → Abstract BRAIN queries (self-learning system)

CRITICAL: All abstractions are 100% LOCAL (in KDS/).
- Default storage: Local files (KDS/sessions/)
- Default tests: Project's existing tools (discovered, not installed)
- Default I/O: PowerShell built-ins (Get-Content, Set-Content)
- Default BRAIN: Local YAML/JSON (KDS/kds-brain/)
- Zero external dependencies for KDS CORE
- Cloud/database options are OPTIONAL extensions (user's choice)
```

### 📦 Open Source Library Policy

**KDS Enhancement Libraries (ALLOWED)**

Open source libraries that enhance KDS functionality are PERMITTED when:
- ✅ They are declared as **required dependencies** during KDS setup
- ✅ They are included in setup instructions (package.json, requirements.txt, etc.)
- ✅ User is informed upfront that these are needed to proceed
- ✅ They enhance KDS capabilities (routing, analysis, testing, validation)

**Examples of Acceptable KDS Dependencies:**
```json
// package.json (if KDS uses Node.js enhancements)
{
  "devDependencies": {
    "markdown-it": "^13.0.0",      // Enhanced markdown parsing for intent analysis
    "yaml": "^2.3.0",                // YAML parsing for configuration
    "chalk": "^5.3.0"                // Terminal output formatting
  }
}

// requirements.txt (if KDS uses Python enhancements)
markdown-it-py>=3.0.0    # Enhanced markdown processing
pyyaml>=6.0              # YAML configuration parsing
rich>=13.0.0             # Beautiful terminal output
```

**NOT Considered External Dependencies:**
- Libraries needed for KDS core functionality (router, planner, executor)
- Libraries that improve intent detection accuracy
- Libraries that enhance session state management
- Libraries that provide better error reporting/logging

**STILL External Dependencies (Require User Approval):**
- Libraries for the user's APPLICATION code (React, SignalR, etc.)
- Libraries that change application architecture
- Libraries that affect production deployment
- Database/cloud providers not already in use

**Setup Protocol:**
When recommending KDS enhancement libraries:
```markdown
⚠️ **KDS Enhancement Dependencies Required**

To proceed with this KDS feature, the following libraries are needed:

📦 Node.js (npm install):
  - markdown-it: Enhanced markdown parsing for intent analysis
  - yaml: Configuration file parsing
  
Installation:
  npm install --save-dev markdown-it yaml

These are KDS-internal dependencies and won't affect your application code.

Proceed with installation? (Y/n)
```

---

## 🧪 Playwright Testing Protocol (PowerShell)

**CRITICAL RULE: All Playwright test automation scripts MUST follow the established protocol pattern.**

**⚠️ LONG-RUNNING PROCESS:** Test automation scripts often run >30 seconds. Follow the Long-Running Process Protocol (see Setup section) for:
- Padded time estimates (add 25-50% buffer to test execution time)
- Status updates during app startup and test execution
- Progress indicators when running multiple test files
- Graceful Ctrl+C handling with cleanup

### 🎯 CRITICAL: Component ID-Based Selectors (TDD Requirement)

**RULE:** Always use element IDs for Playwright selectors. Text-based selectors are FRAGILE and PROHIBITED.

**WHY:**
- ✅ 10x faster (getElementById vs DOM text search)
- ✅ Immune to text changes (i18n, wording updates, HTML restructuring)
- ✅ Explicit intent (`#login-btn` is clearer than `button:has-text("Login")`)
- ✅ No false positives (unique ID vs multiple matching texts)

**WRONG (FRAGILE - DO NOT USE):**
```typescript
// ❌ BREAKS when text changes, slow DOM search, ambiguous
const button = page.locator('button:has-text("Start Session")').first();
const link = page.locator('div:has-text("Transcript Canvas")');
```

**CORRECT (ROBUST - ALWAYS USE):**
```typescript
// ✅ Fast, reliable, explicit, future-proof
const button = page.locator('#sidebar-start-session-btn');
const link = page.locator('#reg-transcript-canvas-btn');
```

**Component ID Discovery:**
Before writing ANY Playwright test, discover available IDs:
1. Open target component file (e.g., `HostControlPanelSidebar.razor`)
2. Search for `id="` attributes
3. Use those IDs in your test selectors
4. If no ID exists → ADD ONE to the component (with `[REFACTOR:component-id]` comment)

**Enforcement:**
- Test reviews MUST reject text-based selectors
- KDS test-generator SHOULD warn when ID exists but text selector used
- Future: Automated crawler will build `KDS/cache/component-ids.json`

### Application Routes & Tokens

**Host Control Panel:**
- Route: `https://localhost:9091/host/control-panel/{hostToken}`
- Page File: `SPA/NoorCanvas/Pages/HostControlPanel.razor`
- Component File: `SPA/NoorCanvas/Components/Host/HostControlPanelContent.razor`
- Session 212 Token: `PQ9N5YWW`
- Full URL: `https://localhost:9091/host/control-panel/PQ9N5YWW`

**Component IDs (Host Control Panel):**
| Element | Component | ID | Purpose |
|---------|-----------|-----|---------|
| Transcript Canvas Button | UserRegistrationLink.razor | `reg-transcript-canvas-btn` | Select transcript canvas mode |
| Asset Canvas Button | UserRegistrationLink.razor | `reg-asset-canvas-btn` | Select asset canvas mode |
| Start Session Button | HostControlPanelSidebar.razor | `sidebar-start-session-btn` | Initiate session |
| Registration Link Container | UserRegistrationLink.razor | `reg-link-container` | Parent container for canvas buttons |

### Standard Protocol Pattern

**Reference Implementation:** `Scripts/run-debug-panel-percy-tests.ps1`

**Required Steps:**
1. ✅ Launch app using `Start-Job` with `dotnet run` (NOT Start-Process)
2. ✅ Wait for app readiness (20 seconds minimum, or health check loop)
3. ✅ Run Playwright tests using `npx playwright test [file] --headed`
4. ✅ Cleanup with `Stop-Job` and `Remove-Job` (unless -KeepAppRunning)

### Correct Pattern (FOLLOW THIS)

```powershell
param([switch]$KeepAppRunning)

# Step 1: Start app with Start-Job
$appJob = Start-Job -ScriptBlock {
    Set-Location 'D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas'
    dotnet run
}

# Step 2: Wait for readiness (20s minimum)
Start-Sleep -Seconds 20

# Step 3: Run Playwright tests
try {
    Set-Location 'D:\PROJECTS\NOOR CANVAS'
    npx playwright test Tests/UI/my-test.spec.ts --headed
    $exitCode = $LASTEXITCODE
}
finally {
    # Step 4: Cleanup
    if (-not $KeepAppRunning) {
        Stop-Job -Job $appJob -ErrorAction SilentlyContinue
        Remove-Job -Job $appJob -ErrorAction SilentlyContinue
    }
}

exit $exitCode
```

### WRONG Patterns (NEVER DO THIS)

❌ **Using Start-Process with -ArgumentList:**
```powershell
# WRONG - Don't use Start-Process with complex arguments
$proc = Start-Process -FilePath "npx" -ArgumentList $testArgs -NoNewWindow -Wait -PassThru
```

❌ **Using Invoke-WebRequest for health checks without proper error handling:**
```powershell
# WRONG - Complex health check that can fail unpredictably
$resp = Invoke-WebRequest -Uri $appUrl -SkipCertificateCheck -TimeoutSec 5
```

❌ **Separating test running from working directory:**
```powershell
# WRONG - Don't Push-Location multiple times
Push-Location $testsPath
npx playwright test
Pop-Location
```

### Playwright Command Format

**Correct:**
```powershell
# Set working directory ONCE, then run test
Set-Location 'D:\PROJECTS\NOOR CANVAS'
npx playwright test Tests/UI/my-test.spec.ts --headed
```

**For Percy visual tests:**
```powershell
# Percy wraps Playwright
percy exec -- playwright test Tests/UI/my-test.spec.ts --headed
```

**Capture exit code:**
```powershell
npx playwright test Tests/UI/my-test.spec.ts --headed
$exitCode = $LASTEXITCODE
exit $exitCode
```

### Test Script Checklist

Before creating ANY Playwright test automation script, verify:

```
✓ Uses Start-Job (not Start-Process) for app launch?
✓ Waits minimum 20 seconds for app readiness?
✓ Sets working directory to project root (not Tests/UI)?
✓ Runs npx playwright test with direct command (no Start-Process)?
✓ Captures $LASTEXITCODE for exit status?
✓ Cleans up with Stop-Job and Remove-Job?
✓ Supports -KeepAppRunning parameter?

If ANY answer is NO → FIX before running
```

### Reference Scripts

**Study these working examples:**
- ✅ `Scripts/run-debug-panel-percy-tests.ps1` - Full featured (health checks, Percy, detailed logging)
- ✅ `Scripts/run-transcript-canvas-visual-tests.ps1` - Simple pattern (20s wait, basic cleanup)
- ✅ `Scripts/run-fab-share-button-percy-tests.ps1` - Percy visual regression pattern

**Key Patterns:**
```powershell
# App Launch
$appJob = Start-Job -ScriptBlock {
    Set-Location 'D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas'
    dotnet run
}

# Wait Pattern (Simple)
Start-Sleep -Seconds 20

# Wait Pattern (Health Check - Advanced)
while ($attempt -lt $maxAttempts) {
    try {
        $resp = Invoke-WebRequest -Uri $appUrl -UseBasicParsing -TimeoutSec 5
        if ($resp.StatusCode -eq 200) { break }
    } catch {
        Start-Sleep -Seconds 2
    }
    $attempt++
}

# Test Execution
Set-Location 'D:\PROJECTS\NOOR CANVAS'
npx playwright test Tests/UI/my-test.spec.ts --headed
$exitCode = $LASTEXITCODE

# Cleanup
Stop-Job -Job $appJob -ErrorAction SilentlyContinue
Remove-Job -Job $appJob -ErrorAction SilentlyContinue
```

---

## 🏗️ Architectural Thinking Mandate

**CRITICAL RULE: All KDS agents MUST think architecturally when proposing solutions.**

### Core Principles

**1. Architecture-First Design**
- ✅ Understand existing application architecture BEFORE proposing solutions
- ✅ Design solutions that naturally fit the current architecture from the start
- ❌ NEVER propose monolithic implementations that need refactoring later
- ❌ NEVER create "everything in one file" with intent to break apart later

**2. Pre-Flight Architectural Validation**
Every solution proposal must pass this refactor logic check:

```
BEFORE proposing a solution:
  ↓
1. Identify current architectural patterns
   - Component structure (where do similar components live?)
   - API organization (where do similar APIs exist?)
   - Service layer patterns (how are services currently structured?)
   - State management (what patterns are in use?)
   - File organization (what's the project structure?)
   ↓
2. Run mental refactor test
   - Would this solution require significant refactoring to fit the architecture?
   - Am I creating files that don't match existing conventions?
   - Am I mixing concerns that are separated elsewhere?
   ↓
3. If refactor is needed → REDESIGN the solution
   - Align with existing patterns
   - Follow established separation of concerns
   - Place files in correct locations from the start
   ↓
4. Only then propose the architecturally-aligned solution
```

**3. Forbidden Anti-Patterns**

❌ **NEVER do this:**
```
❌ "Let's create everything in PageComponent.razor first, then we'll break out 
   the child components later"
   
❌ "I'll add the API logic to the page for now, we can move it to a service later"

❌ "Let's put this in a temporary location and reorganize after it works"

❌ "We'll create the monolith first, then refactor to match your architecture"
```

✅ **ALWAYS do this:**
```
✅ "Based on the existing component structure in Components/Canvas/, 
   I'll create CanvasPdfExport.razor there and import it into the parent"
   
✅ "Following the pattern in Services/, I'll create PdfExportService.cs 
   and inject it via DI as seen in other services"

✅ "The existing API controllers are in Controllers/API/, so I'll create 
   PdfExportController.cs there with the same routing pattern"

✅ "This matches the architecture - components are separated, services handle 
   business logic, and APIs are in the correct location from the start"
```

**4. Architectural Discovery Process**

Before proposing ANY solution, agents must:

```
Step 1: Discover Current Architecture
  - Search for similar features/components
  - Identify existing patterns and conventions
  - Map out file organization structure
  - Understand separation of concerns

Step 2: Pattern Matching
  - "Where do similar components live?"
  - "How are APIs currently organized?"
  - "What's the service layer pattern?"
  - "How is state managed?"

Step 3: Alignment Check
  - Does my solution follow these patterns?
  - Are files in the right locations?
  - Is separation of concerns maintained?
  - Would a developer familiar with this codebase find this natural?

Step 4: Propose Solution
  - Only after architectural alignment is confirmed
  - Explicitly state which patterns you're following
  - Show how it fits the existing structure
```

**5. Implementation Example**

**BAD (Anti-Pattern):**
```markdown
Plan: Add PDF export feature

Phase 1: Create basic implementation
  - Task 1.1: Add export logic to TranscriptCanvas.razor
  - Task 1.2: Test the functionality
  
Phase 2: Refactor to proper architecture
  - Task 2.1: Extract to PdfExportService
  - Task 2.2: Create dedicated component
  - Task 2.3: Move to API controller

❌ This violates architectural thinking - refactoring is built into the plan!
```

**GOOD (Architecturally Aligned):**
```markdown
Plan: Add PDF export feature

Phase 0: Architectural Discovery
  - Task 0.1: Map existing service patterns (Services/)
  - Task 0.2: Identify component organization (Components/)
  - Task 0.3: Review API structure (Controllers/API/)

Phase 1: Test Infrastructure (following existing test patterns)
  - Task 1.1: Create PdfExportServiceTests.cs (Tests/Unit/Services/)
  - Task 1.2: Create PdfExportController tests (Tests/Unit/Controllers/)
  - Task 1.3: Create visual tests (Tests/UI/pdf-export.spec.ts)

Phase 2: Implementation (architecturally aligned from start)
  - Task 2.1: Create PdfExportService.cs in Services/
  - Task 2.2: Create PdfExportButton.razor in Components/Canvas/
  - Task 2.3: Create PdfExportController.cs in Controllers/API/
  - Task 2.4: Register service in DI (Program.cs pattern)

✅ This is architecturally correct from the start - no refactoring needed!
```

**6. Agent-Specific Requirements**

**Work Planner (work-planner.md):**
- ✅ MUST include "Phase 0: Architectural Discovery" for new features
- ✅ Plans must show architectural alignment in task descriptions
- ✅ File paths must match existing conventions

**Code Executor (code-executor.md):**
- ✅ MUST verify file location matches architecture before creating
- ✅ MUST follow existing patterns for similar features
- ✅ MUST NOT create temporary/placeholder implementations

**Test Generator (test-generator.md):**
- ✅ Tests must mirror the application's architectural organization
- ✅ Test files must be placed following existing test structure

**7. Validation Checkpoint**

Before ANY code generation, agents must answer:

```
✓ Have I identified where similar code lives in this architecture?
✓ Am I following the existing file organization patterns?
✓ Is my separation of concerns consistent with the codebase?
✓ Would this solution require refactoring to fit the architecture?
✓ Am I creating files in their permanent, correct locations?

If ANY answer is NO → STOP and redesign the solution
```

**8. Success Criteria**

A solution is architecturally valid when:
- ✅ No refactoring phase exists in the plan
- ✅ Files are in correct locations from creation
- ✅ Patterns match existing similar features
- ✅ Separation of concerns is maintained from start
- ✅ A developer familiar with the codebase would say "this fits naturally"

---

## �🎯 The ONLY Command You Need to Remember

```markdown
#file:KDS/prompts/user/kds.md

[Tell KDS what you want in natural language]
```

That's it! KDS will automatically:
- ✅ Analyze your request (intent detection)
- ✅ Route to the appropriate specialist agent
- ✅ Execute the correct workflow
- ✅ Handle multi-step operations
- ✅ Maintain session state

---

## 📋 What You Can Say

### Start New Work
```markdown
#file:KDS/prompts/user/kds.md

I want to add a FAB button pulse animation when questions arrive
```
→ Routes to: **plan.md** → work-planner.md

### Continue Existing Work
```markdown
#file:KDS/prompts/user/kds.md

Continue working on the current task
```
→ Routes to: **execute.md** → code-executor.md

### Resume After Break
```markdown
#file:KDS/prompts/user/kds.md

Show me where I left off
```
→ Routes to: **resume.md** → work-planner.md

### Fix Copilot's Mistake
```markdown
#file:KDS/prompts/user/kds.md

You're modifying the wrong file. The FAB button is in HostControlPanelContent.razor
```
→ Routes to: **correct.md** → code-executor.md

### Create Tests
```markdown
#file:KDS/prompts/user/kds.md

Create visual regression tests for the share button
```
→ Routes to: **test.md** → test-generator.md

### Check System Health
```markdown
#file:KDS/prompts/user/kds.md

Run all validations and show me the health status
```
→ Routes to: **validate.md** → health-validator.md

### Analyze Screenshot
```markdown
#file:KDS/prompts/user/kds.md

Analyze this screenshot and extract requirements

[Attach screenshot via chat interface]
```
→ Routes to: **screenshot-analyzer.md** → Extracts requirements, annotations, design specs

### Commit Changes
```markdown
#file:KDS/prompts/user/kds.md

Commit changes
```
→ Uses: **KDS/scripts/commit-kds-changes.ps1** → Smart commit handler achieving zero uncommitted files

**What it does:**
- ✅ Analyzes uncommitted files and categorizes them intelligently
- ✅ Auto-updates .gitignore for KDS auto-generated files (BRAIN state, internal prompts, reports)
- ✅ Resets auto-generated files that should not be committed (conversation-context.jsonl, etc.)
- ✅ Stages only user-created files (user prompts, documentation, code)
- ✅ Creates semantic commit messages (feat/fix/docs/chore)
- ✅ Achieves zero uncommitted files automatically
- ✅ Interactive mode for documentation decisions
- ✅ Dry-run mode for preview without changes

**Automatic .gitignore management:**
- KDS BRAIN state files (conversation-context.jsonl, conversation-history.jsonl, development-context.yaml)
- KDS internal prompts (auto-updated by system)
- KDS reports (monitoring/, self-review/, test-reports/)
- PlayWright KDS artifacts
- Temporary test files (.mjs, .spec.*)

**Example output:**
```
🧠 KDS Smart Commit Handler
═══════════════════════════════════════════════════════

Step 1: Analyzing uncommitted files...
  Modified files: 9
  Untracked files: 11

Step 2: Categorizing files...
Step 3: Updating .gitignore...
  Adding to .gitignore:
    + KDS/kds-brain/conversation-context.jsonl
    + KDS/prompts/internal/*.md
    + KDS/reports/monitoring/
  ✅ .gitignore updated with KDS patterns

Step 4: Resetting auto-generated files...
  Resetting:
    - KDS/kds-brain/conversation-context.jsonl
    - KDS/prompts/internal/code-executor.md
  ✅ Reset 2 auto-generated files

Step 5: Preparing commit...
  Files to commit: 3
    + KDS/prompts/user/kds.md
    + KDS/dashboard/README.md
    + .gitignore

Step 6: Staging files...
  ✅ Files staged

Step 7: Committing...
  ✅ Changes committed

═══════════════════════════════════════════════════════
✅ SUCCESS: Zero uncommitted files!
═══════════════════════════════════════════════════════
```

**Usage:**
```powershell
# Interactive mode (default)
.\KDS\scripts\commit-kds-changes.ps1

# With custom message
.\KDS\scripts\commit-kds-changes.ps1 -Message "feat(kds): Add dashboard"

# Dry run (preview without changes)
.\KDS\scripts\commit-kds-changes.ps1 -DryRun

# Non-interactive (auto-include all documentation)
.\KDS\scripts\commit-kds-changes.ps1 -Interactive:$false
```

### Ask Questions
```markdown
#file:KDS/prompts/user/kds.md

How do I use Playwright to test the canvas element?
```
→ Routes to: **ask-kds.md** → knowledge-retriever.md

### Review KDS Changes
```markdown
#file:KDS/prompts/user/kds.md

I updated the test-generator to support Percy visual testing
```
→ Routes to: **govern.md** → change-governor.md

### View Performance Metrics
```markdown
#file:KDS/prompts/user/kds.md

run metrics
```
→ Routes to: **metrics-reporter.md** → Generates visual performance report

Output destination (for historical comparison):
- A Markdown report is written to `KDS/reports/metrics/<YYYY-MM-DD>/metrics-<timestamp>.md`
- A convenience copy is saved at `KDS/reports/metrics/latest.md`

Notes:
- Reports are visual with bar displays and contain no code snippets.
- Because reports live in the repository, Git naturally versions them so you can compare trends over time.

**What it shows:**
- ✅ BRAIN health score and trends
- ✅ Routing accuracy by intent type
- ✅ Knowledge graph growth visualization
- ✅ File hotspots (high-churn files)
- ✅ Code velocity trends
- ✅ Test-first impact analysis
- ✅ Productivity patterns (best times to work)
- ✅ Auto-learning performance
- ✅ Month-over-month improvements
- ✅ Actionable recommendations

**Example output:**
```
📊 Quick Stats
Routing Accuracy: 94% ▲ +3% 🟢 Excellent
Learning Efficiency: 92% ▲ +12% 🟢 Excellent

🧠 BRAIN Storage
Tier 1: [████████░░░░░░░░░░░░] 8/20 (40%)
Tier 2: 3,847 entries (+247 this month)
Tier 3: 1,547 commits analyzed

🔥 File Hotspots
HostControlPanelContent.razor  ████████████ 28% churn ⚠️
UserRegistrationLink.razor     ██████████░░ 24% churn ⚠️

💡 Recommendations
1. Continue test-first (96% success rate)
2. Work 10am-12pm (94% peak productivity)
3. Refactor hotspots (>20% churn)
4. Keep sessions <60 min (89% vs 67%)
```

**⏱️ Report time:** ~90 seconds to read

---

## 🧠 KDS Health Dashboard

**Purpose:** Visual monitoring dashboard for KDS system health, BRAIN status, and development metrics.

### Launch Dashboard

```markdown
#file:KDS/prompts/user/kds.md launch dashboard
```

Or directly:
```powershell
.\KDS\scripts\launch-dashboard.ps1
```

**What it does:**
- ✅ Starts API server in a **separate visible PowerShell window**
- ✅ Opens dashboard in your default browser
- ✅ Provides real-time health monitoring
- ✅ Shows visual feedback for all operations

**⚠️ PERMANENT RULE: API Server Window Behavior**

The API server MUST run in a **separate visible PowerShell window**, NOT as a background job.

**Rationale:**
- ✅ User can see server logs in real-time
- ✅ Easy to stop (just close the window or Ctrl+C)
- ✅ Clear visual indicator that server is running
- ✅ No hidden background processes
- ❌ Background jobs are invisible and hard to manage
- ❌ Users couldn't tell if server was running

**Implementation:**
```powershell
# CORRECT - Separate visible window
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$workspaceRoot'; .\KDS\scripts\dashboard-api-server.ps1"

# WRONG - Background job (DO NOT USE)
$job = Start-Job -ScriptBlock { ... }
```

### Dashboard Features

**Visual Loading Feedback:**
- 📊 Progress bar at top of page during operations
- 🔄 Loading overlay with detailed status messages
- ⏱️ Real-time progress updates
- 🎯 Stats start at 0 and refresh with live data

**Health Check Categories:**
- 🏗️ Infrastructure (files, directories, permissions)
- 🤖 Agents & Prompts (all 10 specialist agents)
- 🧠 BRAIN System (3-tier architecture)
- 💾 Session State (active sessions, history)
- 📚 Knowledge Base (graph, patterns, context)
- 🔧 Scripts & Tools (PowerShell, validation)
- ⚡ Performance (response times, efficiency)

**Actions:**
- 🔄 **Refresh** - Run all health checks (shows loading feedback)
- 📋 **Copy to Clipboard** - Copy health report JSON (with fallback for file:// protocol)
- 📊 **Export Report** - Download JSON file

**Connection States:**
- 🔗 **Live** - API server connected, real data
- 🔌 **Disconnected** - API server not running (shows retry button)

### Copy to Clipboard Feature

**Multi-Layer Fallback System:**

1. **Modern Clipboard API** (HTTPS/secure context)
   ```javascript
   navigator.clipboard.writeText(jsonText)
   ```

2. **Legacy execCommand** (HTTP/file:// protocol)
   ```javascript
   document.execCommand('copy')
   ```

3. **Manual Prompt** (Last resort)
   ```javascript
   prompt('Copy this JSON (Ctrl+C):', jsonText)
   ```

**Why fallback is needed:**
- ⚠️ Dashboard runs on `file://` protocol (not HTTPS)
- ⚠️ Modern clipboard API requires secure context
- ✅ Fallback ensures copy works in all scenarios
- ✅ Always provides a way to get the JSON

### To Stop Dashboard

**Option 1:** Close the API server PowerShell window

**Option 2:** Press Ctrl+C in the API server window

**Option 3:** Just close your browser (server keeps running until manually stopped)

**Dashboard remains functional** in disconnected mode - you can view cached data and retry connection.

---

## 🚀 First-Time Setup (New Application Installation)

**When to use this:** You're installing KDS in a new application (e.g., a fresh project like `https://github.com/yourname/new-project`)

**Purpose:** Complete KDS initialization with brain absorption, crawlers, and knowledge graph population for application-specific intelligence.

### Setup Command

```markdown
#file:KDS/prompts/user/kds.md Setup
```

This triggers the complete KDS initialization sequence.

**⏱️ Expected Duration: 15-20 minutes** (padded estimate)
- Small project (<1000 files): ~10-12 minutes
- Medium project (1000-5000 files): ~15-18 minutes  
- Large project (>5000 files): ~20-25 minutes

**🔔 Status Updates:** You'll receive progress updates every 30-60 seconds so you know the system is working.

---

### 📋 Setup Sequence (Automatic)

When you invoke `Setup`, KDS executes this sequence:

**⚙️ RULE: Long-Running Process Protocol**

ALL long-running operations (>30 seconds) in KDS MUST:
1. ✅ Display padded time estimate upfront (add 25-50% buffer)
2. ✅ Show phase-by-phase progress indicators
3. ✅ Provide status updates every 30-60 seconds
4. ✅ Display percentage complete when measurable
5. ✅ Show "Still working..." heartbeat for CPU-intensive tasks
6. ✅ Explain what's happening (not just "Processing...")
7. ✅ Allow graceful interruption (Ctrl+C with cleanup)

**Examples of long-running operations:**
- Setup sequence (15-20 min)
- Deep crawler (5-10 min)
- Development context collection (2-5 min)
- BRAIN updates with large event backlogs (1-3 min)
- Test suite runs (varies)
- Build processes (varies)

**See:** Full protocol at end of this section

#### Phase 1: Environment Validation (2-3 minutes)

**Status Display:**
```
🚀 KDS Setup - Phase 1/6: Environment Validation
⏱️  Estimated time: 2-3 minutes
📊 Progress: [▓▓▓░░░░░░░] 0%

⏳ Checking KDS structure...
```

**Step 1.1: Verify KDS Structure**
```
✓ Check KDS/ directory exists
✓ Verify all core agents present (10 specialist agents)
✓ Validate BRAIN directories (kds-brain/, sessions/, knowledge/)
✓ Check abstraction layer (session-loader, test-runner, file-accessor)

Status: ✅ KDS structure verified (10/10 agents found)
```

**Step 1.2: Detect Application Type**
```
⏳ Analyzing application type...

✓ Identify primary language (C#, TypeScript, Python, etc.)
✓ Detect frameworks (ASP.NET, React, Django, etc.)
✓ Find build tools (dotnet, npm, pip, etc.)
✓ Locate test frameworks (Playwright, Jest, xUnit, etc.)

Status: ✅ Detected: C# + ASP.NET Core 8.0 + Playwright
```

**Step 1.3: Validate Dependencies**
```
⏳ Checking system dependencies...

✓ Check Git is available (required for context collection)
✓ Verify PowerShell/Bash (for scripts)
✓ Confirm workspace structure is readable
✓ Test file system permissions

Status: ✅ All dependencies available

📊 Progress: [▓▓▓▓▓░░░░░] 20% - Phase 1 complete
```

**Output:** Environment validation report

---

#### Phase 2: BRAIN Initialization (7-12 minutes)

**Status Display:**
```
🚀 KDS Setup - Phase 2/6: BRAIN Initialization
⏱️  Estimated time: 7-12 minutes (longest phase)
📊 Progress: [▓▓▓▓▓░░░░░] 20%

⚠️  This phase takes the longest - please be patient!
```

**Step 2.1: Create BRAIN Storage**
```
⏳ Creating BRAIN directory structure...

✓ Initialize KDS/kds-brain/ directory structure
  - conversation-history.jsonl (Tier 1 - empty initially)
  - knowledge-graph.yaml (Tier 2 - base template)
  - development-context.yaml (Tier 3 - empty initially)
  - events.jsonl (event stream - empty)
  - crawler-state.yaml (crawler tracking)
✓ Set up session storage (KDS/sessions/)
✓ Create knowledge repository (KDS/knowledge/)

Status: ✅ BRAIN storage created
📊 Progress: [▓▓▓▓▓▓░░░░] 25%
```

**Step 2.2: Run Deep Codebase Crawler**
```
⏳ Starting deep codebase crawl...
⏱️  This will take 5-10 minutes depending on project size

Invoke: #file:KDS/prompts/internal/brain-crawler.md
Mode: deep
Duration: 5-10 minutes

Status updates every 60 seconds:
  [00:30] 📂 Discovered 247 files (still scanning...)
  [01:00] 📂 Discovered 612 files (analyzing structure...)
  [01:30] 📂 Discovered 1,089 files (mapping relationships...)
  [02:00] 🔍 Parsing file contents (324/1,089 files)
  [02:30] 🔍 Parsing file contents (687/1,089 files)
  [03:00] 🔍 Analyzing imports and dependencies...
  [03:30] 📊 Building relationship graph...
  [04:00] 🎯 Detecting naming conventions...
  [04:30] ✅ Crawler complete - generating report...

What it discovers:
✓ File structure & architecture (where components/services/tests live)
✓ Code relationships (dependencies, imports, DI patterns)
✓ Test patterns (frameworks, selectors, test data)
✓ Technology stack (languages, frameworks, libraries)
✓ Naming conventions (PascalCase, kebab-case, etc.)
✓ Configuration patterns (appsettings hierarchy, env vars)
✓ Documentation locations (README files, API docs)

Feeds BRAIN with:
  - architectural_patterns (Components/**/*.razor)
  - file_relationships (co-modification patterns)
  - test_patterns (Playwright, session-212, data-testid)
  - conventions (naming, file organization)
  - technology_stack (complete inventory)

Status: ✅ Crawler discovered 1,089 files, 3,247 relationships
📊 Progress: [▓▓▓▓▓▓▓░░░] 35%
```

**Output:** Crawler report (`KDS/kds-brain/crawler-report-{timestamp}.md`)

**Step 2.3: Initialize Development Context (Tier 3)**
```
⏳ Collecting development metrics (2-5 minutes)...

Invoke: #file:KDS/prompts/internal/development-context-collector.md

Status updates:
  [00:30] 📊 Analyzing Git history (last 30 days)...
  [01:00] 📊 Processing 1,237 commits...
  [01:30] 📊 Calculating code velocity...
  [02:00] 📊 Identifying file hotspots...
  [02:30] 📊 Analyzing test patterns...
  [03:00] 📊 Building baseline metrics...

What it collects:
✓ Git activity (last 30 days of commits)
✓ Code change velocity (lines added/deleted per week)
✓ File hotspots (high churn rate files)
✓ KDS session history (if any exist)
✓ Testing activity (if tests exist)
✓ Build/deploy patterns (if scripts exist)

Feeds BRAIN with:
  - Baseline metrics (velocity, churn, activity)
  - Productivity patterns (commit frequency)
  - File stability analysis (churn rates)
  - Initial correlations (commit size vs complexity)

Status: ✅ Collected metrics from 1,237 commits, 78 tests
📊 Progress: [▓▓▓▓▓▓▓▓░░] 45%
```

**Output:** `KDS/kds-brain/development-context.yaml` (baseline metrics)

---

#### Phase 3: Knowledge Graph Population (3-5 minutes)

**Status Display:**
```
🚀 KDS Setup - Phase 3/6: Knowledge Graph Population
⏱️  Estimated time: 3-5 minutes
📊 Progress: [▓▓▓▓▓▓▓▓░░] 45%

⏳ Processing crawler discoveries...
```

**Step 3.1: Process Crawler Results**
```
⏳ Transforming discoveries into knowledge graph...

Invoke: #file:KDS/prompts/internal/brain-updater.md
Mode: bootstrap

Status updates:
  [00:30] 🧠 Processing 3,247 relationships...
  [01:00] 🧠 Assigning confidence scores...
  [01:30] 🧠 Creating file_relationships section (1,247 entries)
  [02:00] 🧠 Creating architectural_patterns section (127 patterns)
  [02:30] 🧠 Creating validation_insights section...

Actions:
✓ Transform crawler discoveries into knowledge graph entries
✓ Assign confidence scores (0.50 - 0.98)
  - Direct observations (imports): 0.95+ confidence
  - Pattern inference (naming): 0.70-0.85 confidence
  - Statistical (co-modification): 0.50-0.70 confidence
✓ Create file_relationships section
✓ Create architectural_patterns section
✓ Create validation_insights section
✓ Create intent_patterns (empty, will learn from usage)

Status: ✅ Knowledge graph populated with 3,247 entries
📊 Progress: [▓▓▓▓▓▓▓▓▓░] 55%
```

**Step 3.2: Build Intent Vocabulary (Bootstrapping)**
```
⏳ Bootstrapping intent patterns...

If generic patterns available (from templates):
  ✓ Import common intent patterns
    - "add a button" → PLAN intent
    - "create service" → PLAN intent
    - "continue" → EXECUTE intent
  ✓ Seed with generic workflow patterns
    - UI feature: plan → execute → test
    - API endpoint: plan → execute → unit-test → integration-test
  ✓ Import common file confusion warnings
    - "HostControlPanel vs HostControlPanelContent"
    
If no templates:
  ✓ Start with empty intent_patterns
  ✓ BRAIN will learn from first interactions

Status: ✅ Intent vocabulary seeded with 47 patterns
📊 Progress: [▓▓▓▓▓▓▓▓▓░] 60%
```

**Step 3.3: Validate Knowledge Graph**
```
⏳ Validating knowledge graph integrity...

✓ Run structure validation (YAML syntax)
✓ Check confidence score ranges (0.50-1.00)
✓ Verify file references exist
✓ Test query functionality
✓ Run protection rules check

Status: ✅ Knowledge graph validated successfully
📊 Progress: [▓▓▓▓▓▓▓▓▓▓] 65%
```

**Output:** `KDS/kds-brain/knowledge-graph.yaml` (fully populated)

---

#### Phase 4: Three-Tier BRAIN Setup (1-2 minutes)

**Status Display:**
```
🚀 KDS Setup - Phase 4/6: Three-Tier BRAIN Setup
⏱️  Estimated time: 1-2 minutes
📊 Progress: [▓▓▓▓▓▓▓▓▓▓] 65%

⏳ Configuring three-tier architecture...
```

**Step 4.1: Initialize Tier 1 (Conversation History)**
```
⏳ Setting up conversation memory...

✓ Create conversation-history.jsonl
✓ Set FIFO queue capacity (20 conversations)
✓ Initialize first conversation (the setup itself)
✓ Configure conversation boundary detection

Status: ✅ Tier 1 initialized
📊 Progress: [▓▓▓▓▓▓▓▓▓▓] 70%
```

**Step 4.2: Verify Tier 2 (Knowledge Graph)**
```
⏳ Verifying knowledge graph...

✓ Confirm knowledge-graph.yaml populated
✓ Test brain-query queries
✓ Verify all sections present:
  - intent_patterns
  - file_relationships
  - workflow_patterns
  - validation_insights
  - correction_history

Status: ✅ Tier 2 verified (3,247 entries)
📊 Progress: [▓▓▓▓▓▓▓▓▓▓] 75%
```

**Step 4.3: Verify Tier 3 (Development Context)**
```
⏳ Verifying development context...

✓ Confirm development-context.yaml has baseline metrics
✓ Test proactive_warnings generation
✓ Verify correlation analysis available
✓ Check hotspot detection working

Status: ✅ Tier 3 verified (baseline metrics ready)
📊 Progress: [▓▓▓▓▓▓▓▓▓▓] 80%
```

**Step 4.4: Enable Automatic Learning**
```
⏳ Configuring automatic learning...

✓ Configure event logging (all agents → events.jsonl)
✓ Set automatic update triggers:
  - 50+ events → brain-updater.md
  - 24 hours → brain-updater.md (if 10+ events)
✓ Enable Tier 3 collection (runs after brain updates)
✓ Verify Rule #16 Step 5 compliance (event count check)

Status: ✅ Automatic learning enabled
📊 Progress: [▓▓▓▓▓▓▓▓▓▓] 85%
```

**Output:** Three-tier BRAIN fully operational

---

#### Phase 5: Testing & Validation (2-3 minutes)

**Status Display:**
```
🚀 KDS Setup - Phase 5/6: Testing & Validation
⏱️  Estimated time: 2-3 minutes
📊 Progress: [▓▓▓▓▓▓▓▓▓▓] 85%

⏳ Running validation checks...
```

**Step 5.1: Test Core Workflows**
```
⏳ Testing KDS components...

✓ Test intent routing (sample phrases)
  - "I want to add a feature" → Should route to PLAN
  - "Continue" → Should detect no session, prompt accordingly
✓ Test BRAIN queries
  - Query architectural_patterns → Should return discovered structure
  - Query file_relationships → Should return co-modification data
✓ Test file operations
  - session-loader.md → Should create/read session files
  - file-accessor.md → Should read/write application files

Status: ✅ All core workflows tested successfully
📊 Progress: [▓▓▓▓▓▓▓▓▓▓] 90%
```

**Step 5.2: Run Health Validator**
```
⏳ Running comprehensive health check...

Invoke: #file:KDS/prompts/internal/health-validator.md

Checks:
✓ All agents loadable
✓ BRAIN files readable/writable
✓ Knowledge graph valid
✓ Session storage functional
✓ Test framework detection working
✓ Git integration working

Status: ✅ All health checks passed
📊 Progress: [▓▓▓▓▓▓▓▓▓▓] 93%
```

**Step 5.3: Generate Setup Report**
```
⏳ Generating setup report...

Create: KDS/setup-report-{timestamp}.md

Contents:
✓ Environment summary (languages, frameworks, tools)
✓ Discovered patterns (components, services, tests)
✓ BRAIN status (all 3 tiers operational)
✓ File counts (components: 89, services: 34, tests: 120)
✓ Known issues (if any)
✓ Next steps (ready to use!)

Status: ✅ Report generated
📊 Progress: [▓▓▓▓▓▓▓▓▓▓] 95%
```

**Output:** Setup complete confirmation

---

#### Phase 6: First Interaction Guidance (1 minute)

**Status Display:**
```
🚀 KDS Setup - Phase 6/6: Finalizing
⏱️  Estimated time: 1 minute
📊 Progress: [▓▓▓▓▓▓▓▓▓▓] 95%

⏳ Preparing your workspace...
```

**Step 6.1: Show User Quick Start**
```
⏳ Generating getting started guide...

Display:
  ✅ Setup complete! KDS is ready.
  
  📊 What KDS learned about your application:
  - Technology: {detected stack}
  - Components: {count} files in {location}
  - Services: {count} files in {location}
  - Tests: {count} files, {framework} framework
  - Conventions: {naming patterns}
  
  🧠 BRAIN Status:
  - Tier 1 (Conversations): Initialized
  - Tier 2 (Knowledge Graph): {entry_count} entries
  - Tier 3 (Dev Context): Baseline metrics collected
  
  🚀 Ready to start!
  
  Try: #file:KDS/prompts/user/kds.md
       I want to [describe your first feature]

Status: ✅ Setup complete!
📊 Progress: [▓▓▓▓▓▓▓▓▓▓] 98%
```

**Step 6.2: Log Setup Event**
```
⏳ Finalizing...

✓ Record setup completion in events.jsonl
✓ Create first conversation in conversation-history.jsonl
✓ Mark setup as successful in crawler-state.yaml

Status: ✅ All done!
📊 Progress: [▓▓▓▓▓▓▓▓▓▓] 100% ✨

⏱️  Total time: 15m 32s
```

---

### 📊 Long-Running Process Protocol (UNIVERSAL RULE)

**APPLIES TO:** All KDS operations >30 seconds

**Required Elements:**

1. **Upfront Expectation Setting**
   ```
   ⏱️  Estimated time: X-Y minutes (padded 25-50%)
   ⚠️  This is the longest phase - please be patient!
   ```

2. **Visual Progress Indicators**
   ```
   📊 Progress: [▓▓▓▓▓▓▓░░░] 45%
   🔄 Phase 3/6: Knowledge Graph Population
   ```

3. **Heartbeat Status Updates**
   ```
   Every 30-60 seconds:
   [00:30] Still working on X... (detail what's happening)
   [01:00] Processing Y... (show counts/progress)
   [01:30] Almost done with Z... (reassure user)
   ```

4. **Informative Messages**
   ```
   ❌ BAD: "Processing..." (vague, scary)
   ✅ GOOD: "Analyzing 1,247 commits for velocity patterns..."
   
   ❌ BAD: "Please wait..." (no context)
   ✅ GOOD: "Scanning 612 files for architectural patterns (2m 30s elapsed)"
   ```

5. **Completion Confirmation**
   ```
   Status: ✅ Phase complete in 4m 23s
   📊 Progress: [▓▓▓▓▓▓▓▓▓▓] 65% → 75%
   ```

6. **Graceful Interruption**
   ```
   ⏸️  You can press Ctrl+C to cancel
   ⚠️  Cleanup will run automatically if interrupted
   ```

7. **Error Recovery Guidance**
   ```
   If something goes wrong:
   ❌ Error at Phase 3 (2m 15s elapsed)
   💡 You can:
      1. Retry this phase only
      2. Skip and continue (if non-critical)
      3. Cancel and review logs
   ```

**Implementation Checklist:**

For ALL long-running operations, verify:
- ☐ Padded time estimate shown upfront (realistic + buffer)
- ☐ Phase/step breakdown displayed
- ☐ Progress bar or percentage shown
- ☐ Status updates every 30-60 seconds minimum
- ☐ Detailed "what's happening now" messages
- ☐ Elapsed time counter visible
- ☐ Graceful Ctrl+C handling
- ☐ Clear completion confirmation
- ☐ Error messages with recovery options

**Examples in KDS:**

```markdown
Long-Running Operations:
✓ Setup (15-20 min) - Has all required elements above
✓ Deep Crawler (5-10 min) - Needs status updates added
✓ Development Context Collection (2-5 min) - Needs progress bar
✓ BRAIN Update with backlog (1-3 min) - Needs heartbeat
✓ Test Suite Execution (varies) - Needs all elements
✓ Build Processes (varies) - Needs all elements
```

**Agents Responsible:**

All specialist agents that trigger long operations:
- `work-planner.md` - When creating large plans
- `code-executor.md` - When running builds/tests
- `test-generator.md` - When generating many tests
- `health-validator.md` - When running full validation
- `brain-crawler.md` - When scanning codebase
- `development-context-collector.md` - When analyzing history
- `brain-updater.md` - When processing large backlogs

**PowerShell Script Requirements:**

All KDS scripts (`.ps1`) MUST include:
```powershell
# At start
Write-Host "⏱️  Estimated time: 3-5 minutes" -ForegroundColor Yellow
$stopwatch = [System.Diagnostics.Stopwatch]::StartNew()

# During execution (every 30-60s)
Write-Host "[$(($stopwatch.Elapsed.TotalSeconds).ToString('00.0'))s] Still working on X..." -ForegroundColor Cyan

# At completion
$stopwatch.Stop()
Write-Host "✅ Complete in $($stopwatch.Elapsed.TotalMinutes.ToString('0.0'))m" -ForegroundColor Green
```

**See Also:**
- Playwright Testing Protocol (uses 20s wait with status)
- Health Validator (should show check-by-check progress)
- Crawler modes (quick vs deep time estimates)

---

### 🎯 Setup Modes

**Default Mode: Full Setup (Recommended)**
```markdown
#file:KDS/prompts/user/kds.md Setup
```
- ⏱️ Duration: 15-20 minutes (padded estimate)
- Runs all 6 phases with complete initialization
- Complete BRAIN initialization with deep crawler
- Ready for immediate production use
- **Status updates:** Every 30-60 seconds
- **Progress tracking:** Phase-by-phase with percentage

**Quick Mode: Minimal Setup (For Testing)**
```markdown
#file:KDS/prompts/user/kds.md Setup --quick
```
- ⏱️ Duration: 3-5 minutes (padded estimate)
- Skips deep crawler (runs quick scan only)
- Minimal Tier 3 data (current snapshot only)
- Good for experimentation, not production
- **Status updates:** Every 60 seconds
- **Progress tracking:** Simplified progress bar

**Migration Mode: Import Existing Knowledge**
```markdown
#file:KDS/prompts/user/kds.md Setup --import "path/to/old-kds/kds-brain/"
```
- ⏱️ Duration: 7-10 minutes (padded estimate)
- Imports generic patterns from previous KDS installation
- Runs deep crawler for new application
- Merges old patterns with new discoveries
- Best for migrating KDS to similar project
- **Status updates:** Every 45 seconds
- **Progress tracking:** Shows import + scan progress separately

---

### 📁 What Gets Created

After setup completes, you'll have:

```
KDS/
├── kds-brain/
│   ├── conversation-history.jsonl      ✅ Initialized (setup conversation)
│   ├── knowledge-graph.yaml            ✅ Populated (crawler + baseline)
│   ├── development-context.yaml        ✅ Baseline metrics
│   ├── events.jsonl                    ✅ Setup events logged
│   ├── crawler-state.yaml              ✅ Last scan info
│   └── crawler-report-{timestamp}.md   📊 Detailed discoveries
│
├── sessions/                           ✅ Empty (ready for first session)
│
├── knowledge/                          ✅ Ready for knowledge articles
│
├── scripts/
│   ├── brain-crawler.ps1               ✅ Tested and working
│   ├── collect-development-context.ps1 ✅ Tested and working
│   └── protect-brain-update.ps1        ✅ Protection active
│
└── setup-report-{timestamp}.md         📊 Setup summary
```

---

### 🔧 Troubleshooting Setup

**Setup fails at Phase 1 (Validation):**
```
Cause: Missing KDS files or permissions issue
Fix: 
  1. Verify KDS/ directory copied completely
  2. Check file permissions (should be readable/writable)
  3. Ensure Git is installed and accessible
```

**Setup fails at Phase 2 (Crawler):**
```
Cause: Large codebase (>10,000 files) or binary files
Fix:
  1. Use Setup --quick (skips deep scan)
  2. Manually run targeted crawler later
  3. Add skip patterns to KDS/kds-brain/crawler-config.yaml
```

**Setup succeeds but queries fail:**
```
Cause: Knowledge graph structure invalid
Fix:
  1. Check KDS/kds-brain/knowledge-graph.yaml syntax
  2. Re-run: #file:KDS/prompts/internal/brain-updater.md
  3. Validate with: #file:KDS/prompts/internal/health-validator.md
```

---

### ✅ Setup Success Indicators

You'll know setup succeeded when:

```
✓ All 6 phases completed without errors
✓ KDS/setup-report-{timestamp}.md exists
✓ knowledge-graph.yaml has 50+ entries
✓ development-context.yaml has baseline metrics
✓ Health validator reports "All checks passed"
✓ Test query returns architectural patterns
✓ First kds.md request routes correctly
```

---

### 🎓 Post-Setup Best Practices

**1. Verify BRAIN Learning:**
```
After your first few KDS interactions:

Check: KDS/kds-brain/events.jsonl (should have new events)
Check: conversation-history.jsonl (should have conversations)
Run: #file:KDS/prompts/internal/brain-updater.md (manual update)
Verify: knowledge-graph.yaml updated with your patterns
```

**2. Regular Maintenance:**
```
Daily: Let automatic learning work (no action needed)
Weekly: Check proactive_warnings in development-context.yaml
Monthly: Run incremental crawler (keep structure current)
After refactoring: Run deep crawler (re-learn architecture)
```

**3. Optimize for Your Workflow:**
```
If KDS misroutes frequently:
  → Check intent_patterns in knowledge-graph.yaml
  → Add manual entries for your common phrases
  
If file suggestions wrong:
  → Check architectural_patterns
  → Run targeted crawler on new modules
  
If estimates inaccurate:
  → Let development-context accumulate data (2-4 weeks)
  → Correlations improve with more history
```

---

## 🤖 How It Works

### Step 1: Intent Detection
When you use `kds.md`, it loads the **Intent Router** agent which analyzes your request.

**Router reads:**
```yaml
keywords:
  plan: ["I want to", "add a", "create a", "build a", "implement"]
  execute: ["continue", "next task", "keep going", "proceed"]
  resume: ["where was I", "show progress", "left off", "resume"]
  correct: ["wrong file", "not what I", "actually", "correction"]
  test: ["test", "visual regression", "playwright", "unit test"]
  validate: ["health", "validate", "check", "run all", "status"]
  ask: ["how do I", "what is", "explain", "tell me about"]
  govern: ["I updated KDS", "I modified KDS", "review my changes"]
```

### Step 2: Routing Decision
```
User: "I want to add dark mode"
  ↓
Intent Router: Detects "I want to add" = PLAN intent
  ↓
Routes to: plan.md → work-planner.md
  ↓
Creates multi-phase plan, saves session state
```

### Step 3: Execution
The appropriate specialist agent executes:
- **Planner:** Breaks work into phases/tasks
- **Executor:** Implements code changes
- **Tester:** Creates and runs tests
- **Validator:** Checks system health
- **Governor:** Reviews KDS modifications
- **Knowledge Retriever:** Answers questions

### Step 4: Handoff (If Multi-Step)
For complex requests like "Add dark mode and test it":
```
User: "I want to add dark mode and test it"
  ↓
Intent Router: Detects TWO intents (PLAN + TEST)
  ↓
Routes to: plan.md → work-planner.md
  ↓
Planner creates plan with testing phase
  ↓
Tells you: "Next: #file:KDS/prompts/user/kds.md continue"
  ↓
You: "continue"
  ↓
Routes to: execute.md → code-executor.md
  ↓
Implements code → Routes to: test.md → test-generator.md
  ↓
Creates tests → Validates → Complete
```

---

## 🎯 Intent Detection Rules

**LOAD:** `#file:KDS/prompts/internal/intent-router.md`

The router uses these patterns:

### PRIMARY INTENT (Choose One)

**PLAN** - Starting new feature work
```
Patterns: "I want to", "add a", "create a", "build", "implement"
Examples: 
  - "I want to add a share button"
  - "Create a PDF export feature"
  - "Build a dark mode toggle"
```

**EXECUTE** - Continue active session
```
Patterns: "continue", "next", "keep going", "proceed", "execute"
Examples:
  - "Continue working"
  - "Next task"
  - "Keep going"
```

**RESUME** - Pickup after interruption
```
Patterns: "resume", "where was I", "show progress", "left off", "status"
Examples:
  - "Show me where I left off"
  - "What's the current status?"
  - "Resume work"
```

**CORRECT** - Fix Copilot error
```
Patterns: "wrong", "not that", "actually", "correction", "fix"
Examples:
  - "You're working on the wrong file"
  - "That's not what I meant"
  - "Actually, use SignalR not polling"
```

**TEST** - Create or run tests
```
Patterns: "test", "playwright", "visual regression", "unit test"
Examples:
  - "Create visual tests for the button"
  - "Run all Playwright tests"
  - "Add unit tests for the service"
```

**VALIDATE** - System health check
```
Patterns: "validate", "health", "check", "run all", "quality"
Examples:
  - "Check system health"
  - "Validate all changes"
  - "Run quality checks"
```

**ASK** - Question about KDS/codebase
```
Patterns: "how do I", "what is", "explain", "tell me", "?"
Examples:
  - "How do I test canvas elements?"
  - "What test patterns exist?"
  - "Explain the session state"
```

**GOVERN** - Review KDS changes
```
Patterns: "I updated KDS", "modified KDS", "review", "KDS change"
Examples:
  - "I updated the test-generator"
  - "Review my KDS modifications"
  - "I changed the rules"
```

**ANALYZE_SCREENSHOT** - Extract requirements from images
```
Patterns: "analyze screenshot", "extract from image", "what does mockup show", "read annotations"
Examples:
  - "Analyze this screenshot and extract requirements"
  - "What does this mockup show?"
  - "Extract specs from this design"
  - "Read the annotations on this bug report"
  - [Image attachment detected]
```

**COMMIT** - Intelligent git commits
```
Patterns: "commit changes", "commit work", "git commit", "save to git"
Examples:
  - "Commit changes"
  - "Commit my work"
  - "Save changes to git"
  - "Create commits with proper categorization"
  - "Commit and tag if milestone"
```
  - "Read the annotations on this bug report"
  - [Image attachment detected]
```

### SECONDARY INTENTS (Can Combine)

**If multiple intents detected:**
```
"I want to add dark mode and test it"
  ↓
Primary: PLAN
Secondary: TEST
  ↓
Planner includes testing phase in plan
```

---

## 🔄 Complete Workflow Examples

### Example 1: New Feature (Simple)
```
You: #file:KDS/prompts/user/kds.md
     I want to add a pulse animation to the FAB button

Router: PLAN intent detected
   ↓
Planner: Creates 3-phase plan
   ↓
Output: ✅ Session created: fab-button-animation
        Next: #file:KDS/prompts/user/kds.md continue
```

### Example 2: Continue Work
```
You: #file:KDS/prompts/user/kds.md
     continue

Router: EXECUTE intent detected
   ↓
Executor: Implements next task
   ↓
Output: ✅ Task 1.1 complete: CSS animation added
        Next: #file:KDS/prompts/user/kds.md continue
```

### Example 3: Resume After Break (SOLID v5.0)
```
(New chat next day)

You: #file:KDS/prompts/user/kds.md
     where was I?

Router: RESUME intent detected
   ↓
Session Resumer: Loads via session-loader (DIP)
   ↓
Output: Session: fab-button-animation
        Progress: 3/8 tasks (38%)
        
        📊 Detailed Progress:
        Phase 1: ✅ Complete
        Phase 2: 🔄 1/3 tasks done
        Phase 3: ⬜ Not started
        
        Next: #file:KDS/prompts/user/kds.md continue
```

### Example 4: Correction Mid-Work (SOLID v5.0)
```
You: #file:KDS/prompts/user/kds.md
     continue

Executor: Modifying HostControlPanel.razor...

You: #file:KDS/prompts/user/kds.md
     Wrong file! The FAB is in HostControlPanelContent.razor

Router: CORRECT intent detected
   ↓
Error Corrector: HALTS execution (dedicated agent)
   ↓
Analysis: FILE_MISMATCH
   Incorrect: HostControlPanel.razor
   Correct: HostControlPanelContent.razor
   ↓
Actions:
   ✅ Reverted changes to HostControlPanel.razor
   ✅ Loaded HostControlPanelContent.razor
   ✅ Updated task file reference
   ↓
Output: ✅ Correction applied
        Next: #file:KDS/prompts/user/kds.md continue
```

### Example 5: Multi-Intent Request
```
You: #file:KDS/prompts/user/kds.md
     I want to add dark mode toggle and create Percy visual tests for it

Router: PLAN + TEST intents detected
   ↓
Planner: Creates plan with dedicated test phase
   ↓
Output: ✅ 4-phase plan created (includes visual testing)
        Phase 4: Percy visual regression tests
        Next: #file:KDS/prompts/user/kds.md continue
```

---

## ✅ Benefits of Universal Entry Point + SOLID v5.0

### User Experience
- ✅ **One command to remember** (`kds.md`)
- ✅ **Natural language** - say what you want
- ✅ **No cognitive load** - don't need to know which specialist to call
- ✅ **Forgiving** - works even if you're vague
- ✅ **Predictable** - same command, consistent behavior

### Technical Benefits (SOLID v5.0)
- ✅ **Intelligent routing** - right agent for the job
- ✅ **Multi-intent handling** - complex requests work
- ✅ **Context preservation** - session state via abstraction
- ✅ **Automatic workflows** - no manual orchestration
- ✅ **Single Responsibility** - each agent focused on one job
- ✅ **Dependency Inversion** - swap storage/tools without breaking agents
- ✅ **Interface Segregation** - no mode switches, dedicated specialists
- ✅ **Easy to test** - mock abstractions, isolate agents

### Architecture Benefits
- 🎯 **Modular** - add new agents without touching existing ones
- 🔧 **Maintainable** - fix bugs in one place
- 🚀 **Performant** - no mode-switch overhead
- 📦 **Portable** - abstractions make storage/tools swappable
- 🏠 **Local-First** - 100% in KDS/, zero external dependencies
- 🔒 **Offline-Capable** - works without internet (except optional cloud features)
- 🆓 **Zero-Install** - no npm/pip/dotnet packages required for KDS

### Comparison

**Before v5.0 (7 commands + mode switches):**
```
plan.md → for new features
execute.md → for continuing work + corrections (mode switch)
resume.md → after breaks (actually loads work-planner)
correct.md → for fixing errors (loads executor in correction mode)
test.md → for creating tests
validate.md → for health checks
ask-kds.md → for questions
govern.md → for KDS changes

Issues:
❌ Executor does 2 jobs (execution + correction)
❌ Planner does 2 jobs (planning + resumption)
❌ Hardcoded file paths everywhere
❌ Hardcoded test commands
```

**After v5.0 (1 command + SOLID compliance):**
```
kds.md → for EVERYTHING
  ↓
intent-router.md → routes to 8 focused specialists
  ↓
Specialists use shared abstractions (session-loader, test-runner, file-accessor)

Benefits:
✅ Each agent has ONE responsibility
✅ Error correction is dedicated (error-corrector.md)
✅ Session resumption is dedicated (session-resumer.md)
✅ Abstractions decouple from storage/tools
✅ Easy to extend (add new agent = add new route)
```

---

## 🚫 When Routing Fails

**If intent is ambiguous:**
```
You: #file:KDS/prompts/user/kds.md
     do something

Router: ❓ Intent unclear. Did you mean:
        1. Continue current work? (execute)
        2. Check progress? (resume)
        3. Validate changes? (validate)
        
        Please clarify.
```

**If no active session and you say "continue":**
```
You: #file:KDS/prompts/user/kds.md
     continue

Router: ❌ No active session found.
        Did you mean to start new work?
        Use: "I want to [describe feature]"
```

---

## 📊 SOLID v5.0 Design Benefits

### Answer: YES - It Makes KDS Better!

**Design Improvements:**
- ✅ **Single Responsibility** - Each agent has ONE clear job
- ✅ **Interface Segregation** - No mode switches (dedicated agents)
- ✅ **Dependency Inversion** - Abstractions decouple from concrete implementations
- ✅ **Open/Closed** - Easy to extend (add agents) without modifying existing code

**SOLID v5.0 Architecture:**
```
User Interface Layer:
  kds.md (universal) ────────┐
  plan.md (direct)   ────────┤
  execute.md (direct) ───────┤
  test.md (direct)    ───────┤  All route through
  correct.md (direct) ───────┤
  resume.md (direct)  ───────┤
  ...                        ├─→ intent-router.md (ROUTER)
                             │
Internal Agent Layer:        │
  work-planner.md     ←──────┤  (PLAN only)
  code-executor.md    ←──────┤  (EXECUTE only)
  error-corrector.md  ←──────┤  (CORRECT only - NEW)
  session-resumer.md  ←──────┤  (RESUME only - NEW)
  test-generator.md   ←──────┤  (TEST only)
  health-validator.md ←──────┤  (VALIDATE only)
  change-governor.md  ←──────┤  (GOVERN only)
  knowledge-retriever.md ←───┘  (ASK only)
  
Abstraction Layer (DIP):
  session-loader.md   → Abstract session access
  test-runner.md      → Abstract test execution
  file-accessor.md    → Abstract file I/O
```

**What Changed from v4.5:**
```diff
- code-executor.md (execution + correction modes) ❌ SRP violation
+ code-executor.md (execution only) ✅ SRP compliant
+ error-corrector.md (correction only) ✅ ISP compliant

- work-planner.md (planning + resumption modes) ❌ SRP violation
+ work-planner.md (planning only) ✅ SRP compliant
+ session-resumer.md (resumption only) ✅ ISP compliant

- Direct file access (#file:KDS/sessions/...) ❌ DIP violation
+ Abstract access (session-loader.md) ✅ DIP compliant

- Hardcoded test commands (npx playwright test) ❌ DIP violation
+ Abstract runner (test-runner.md) ✅ DIP compliant
```

**Benefits:**
- 🎯 **Clarity** - One agent = one job (easier to understand)
- 🚀 **Performance** - No mode-switch logic (faster routing)
- 🔧 **Testability** - Mock abstractions (easier to test)
- 📦 **Flexibility** - Swap storage/tools without breaking agents

**Flexibility:**
```
Option 1 (Easy): Use kds.md universal entry point
Option 2 (Explicit): Call specific prompts directly
Option 3 (Advanced): Call internal agents with abstractions

All work! Universal is for convenience, SOLID is for quality.
```

---

## 🎓 Quick Reference Card

**For everything:**
```
#file:KDS/prompts/user/kds.md
[what you want in natural language]
```

**What it detects:**
- "I want to..." → plan
- "Continue..." → execute  
- "Where was I..." → resume
- "Wrong..." → correct
- "Test..." → test
- "Validate..." → validate
- "How do I..." → ask
- "I updated KDS..." → govern

**That's all you need to know!** 🚀

---

## 🧠 BRAIN System Best Practices

### Automatic Learning is ENABLED by Default

**KDS v5.0+ automatically logs events and updates BRAIN - no user action needed!**

**What happens automatically:**
1. ✅ Agents log events after every action (routing, file modifications, corrections)
2. ✅ Events accumulate in `KDS/kds-brain/events.jsonl`
3. ✅ Rule #16 Step 5 checks event count after each task
4. ✅ When 50 events reached → `brain-updater.md` auto-triggered
5. ✅ Knowledge graph updated with new patterns
6. ✅ Next routing decision gets smarter

**You benefit without doing anything!**

### Verify BRAIN is Learning (Optional Health Check)

**Want to confirm automatic learning is working?**

Check these indicators:
```bash
# 1. Recent events logged (should have timestamps from today)
cat KDS/kds-brain/events.jsonl | tail -5

# 2. Knowledge graph updated recently (check last modified)
ls -la KDS/kds-brain/knowledge-graph.yaml

# 3. Event count reasonable (not accumulating to 100+)
wc -l KDS/kds-brain/events.jsonl
```

**Healthy BRAIN signs:**
- ✅ `events.jsonl` has recent timestamps (within last few hours)
- ✅ `knowledge-graph.yaml` updated in last 24 hours
- ✅ Event count stays below 50 (auto-cleanup working)

**⚠️ Warning signs (violations detected):**
- ❌ No events logged for 4+ hours (event logging broken)
- ❌ `knowledge-graph.yaml` not updated in 24+ hours
- ❌ 50+ unprocessed events accumulated (automatic update not triggering)

**If you see warnings:** See `KDS/docs/architecture/KDS-SELF-REVIEW-STRATEGY.md` for fixes

### Manual BRAIN Update (Only if Needed)

**When to manually update:**
- 🔧 After bulk corrections (fixed multiple files at once)
- 🔧 After large refactoring (want BRAIN to learn patterns immediately)
- 🚨 If automatic updates stopped working (>50 events accumulated)
- 📊 Before important routing decision (want latest knowledge)

**How to trigger manually:**
```markdown
#file:KDS/prompts/internal/brain-updater.md
```

This processes all events and updates the knowledge graph.

### Standard Practice: Trust Automatic Learning

**Every KDS interaction SHOULD automatically:**
1. ✅ Log events (no user action needed)
2. ✅ Query BRAIN for insights (before routing/file decisions)
3. ✅ Update knowledge graph (periodic automatic)

**This is STANDARD KDS practice** - all agents follow this pattern automatically.

### For Advanced Users Only

**Manual intervention rarely needed, but available:**

1. **Manually correct routing** if BRAIN suggests wrong intent:
   ```markdown
   #file:KDS/prompts/user/kds.md
   Wrong intent! I meant [correct interpretation]
   ```
   Error corrector logs the mistake, BRAIN learns for next time.

2. **Check BRAIN health** during self-review:
   ```markdown
   #file:KDS/prompts/user/validate.md
   Check BRAIN system health
   ```

3. **Force immediate update** after major changes:
   ```markdown
   #file:KDS/prompts/internal/brain-updater.md
   ```

**But in normal usage: Just use KDS and let BRAIN learn automatically!**

### First-Time Setup (Optional - BRAIN Works Out of the Box)

**KDS v5.0+ works immediately with empty BRAIN - learning starts from first use!**

**Optional bootstrapping (faster initial learning):**

**Option 1: Populate from existing sessions (if you have session history):**
```powershell
# PowerShell - Seed BRAIN from past sessions
.\KDS\scripts\populate-kds-brain.ps1

# Then update knowledge graph
#file:KDS/prompts/internal/brain-updater.md
```

**Option 2: Crawl your codebase (recommended for new installations):**
```powershell
# PowerShell - Quick scan (30 seconds)
.\KDS\scripts\brain-crawler.ps1 -Mode quick

# OR Deep scan (5-10 minutes, comprehensive)
.\KDS\scripts\brain-crawler.ps1 -Mode deep
```

The crawler analyzes your entire application and feeds BRAIN with:
- 🏗️ Architectural patterns (where components/services/tests live)
- 🔗 File relationships (what depends on what)
- 📝 Naming conventions (how files are named)
- 🛠️ Technology stack (languages, frameworks, tools)
- 🧪 Test patterns (frameworks, test data, selectors)

**See:** `#file:KDS/prompts/internal/brain-crawler.md` for details

**But remember: Bootstrapping is OPTIONAL - BRAIN learns automatically from first interaction!**

### Ongoing Usage - No Action Needed!

**Just use KDS normally!** BRAIN learns automatically from every interaction:
- 📝 Events logged automatically with every agent action
- 🧠 BRAIN updated automatically when 50 events accumulate
- 💡 Decisions get smarter automatically over time
- 🕷️ Optional: Run incremental crawler scans to refresh architectural knowledge

**Zero manual intervention required for continuous learning.**

**Only manual actions needed:**
1. 🚨 If automatic learning breaks (check `KDS-SELF-REVIEW-STRATEGY.md`)
2. 🔧 After bulk corrections (want immediate learning)
3. 📊 When starting new project (run crawler to learn codebase)

**99% of the time: BRAIN just works!**

### Moving KDS to Another Application

**Need to reset BRAIN for a new project?**
```powershell
# PowerShell - Soft reset (clear data, keep config)
.\KDS\scripts\brain-reset.ps1 -Mode soft

# OR Export generic patterns first, then reset
.\KDS\scripts\brain-reset.ps1 -Mode export-reset -ExportPath ".\templates\my-patterns\"

# Then crawl the new application
.\KDS\scripts\brain-crawler.ps1 -Mode deep
```

BRAIN gets amnesia (forgets old app) but keeps all logic intact!

**See:** `#file:KDS/prompts/internal/brain-reset.md` for details

---

## 🔗 Technical Implementation (SOLID v5.0)

**This prompt loads:**
```markdown
#file:KDS/prompts/internal/intent-router.md
```

**Which analyzes your request and loads one of:**
```
#file:KDS/prompts/user/plan.md → #file:KDS/prompts/internal/work-planner.md
#file:KDS/prompts/user/execute.md → #file:KDS/prompts/internal/code-executor.md
#file:KDS/prompts/user/test.md → #file:KDS/prompts/internal/test-generator.md
#file:KDS/prompts/user/validate.md → #file:KDS/prompts/internal/health-validator.md
#file:KDS/prompts/user/govern.md → #file:KDS/prompts/internal/change-governor.md
#file:KDS/prompts/user/ask-kds.md → #file:KDS/prompts/internal/knowledge-retriever.md
#file:KDS/prompts/user/correct.md → #file:KDS/prompts/internal/error-corrector.md (NEW)
#file:KDS/prompts/user/resume.md → #file:KDS/prompts/internal/session-resumer.md (NEW)
```

**Shared abstractions (DIP compliance):**
```
#shared-module:session-loader.md → Abstract session access (default: local files)
#shared-module:test-runner.md → Abstract test execution (uses project's tools)
#shared-module:file-accessor.md → Abstract file I/O (PowerShell built-ins)

NOTE: All 100% local (in KDS/), zero external dependencies
```

**BRAIN management agents:**
```
#file:KDS/prompts/internal/brain-query.md → Query knowledge graph
#file:KDS/prompts/internal/brain-updater.md → Process events and update
#file:KDS/prompts/internal/brain-crawler.md → Codebase analysis (NEW)
#file:KDS/prompts/internal/brain-reset.md → Selective amnesia (NEW)
```

---

## ✨ Summary

**You asked:**
> "Will the KDS system benefit from SOLID principles?"

**Answer: ABSOLUTELY! v5.0 implements:**
- ✅ **Single Responsibility** - One agent = one job
- ✅ **Interface Segregation** - Dedicated agents (no mode switches)
- ✅ **Dependency Inversion** - Abstractions decouple from concrete implementations
- ✅ **Open/Closed** - Easy to extend without modifying existing code

**What changed:**
- ➕ Added `error-corrector.md` (dedicated correction agent)
- ➕ Added `session-resumer.md` (dedicated resumption agent)
- ➕ Added abstraction layer (`session-loader`, `test-runner`, `file-accessor`)
- ✅ Removed mode switches from `code-executor` and `work-planner`
- ✅ Decoupled agents from concrete file paths and tool commands

**Local-First Compliance:**
- ✅ **100% in KDS/** - All KDS logic, data, scripts housed locally
- ✅ **Minimal external dependencies** - Only KDS enhancement libraries (declared upfront)
- ✅ **Offline-capable** - Works without internet (core functionality)
- ✅ **Transparent setup** - User informed of all required libraries during setup
- ⚠️ **Optional extensions** - Cloud/database storage available but not required

**Dependency Categories:**
1. **KDS Core** - Zero dependencies (PowerShell/bash built-ins only)
2. **KDS Enhancements** - Open source libraries for improved capabilities (ALLOWED, declared at setup)
3. **Application Code** - User's project dependencies (Copilot recommends, user approves)
4. **Optional Features** - Cloud/DB/external services (opt-in only)

**What you need to remember:**
```
#file:KDS/prompts/user/kds.md
[describe what you want]
```

**That's it. KDS handles the rest with SOLID principles and local-first design.** 🎯
