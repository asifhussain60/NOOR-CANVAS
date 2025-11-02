# KDS Universal Entry Point

**Purpose:** Single command for ALL KDS interactions. You don't need to remember multiple commands - just use this one and KDS figures out what you need.

**Version:** 5.0 (SOLID Refactor)  
**Status:** 🎯 ACTIVE DESIGN  
**Architecture:** SOLID-compliant modular system

---

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

### Specialist Agents (9 Total)
```
Router            → intent-router.md       → Analyzes & routes requests
Planner           → work-planner.md        → Creates multi-phase plans
Executor          → code-executor.md       → Implements code (test-first)
Tester            → test-generator.md      → Creates & runs tests
Validator         → health-validator.md    → System health checks
Governor          → change-governor.md     → Reviews KDS changes
Error Corrector   → error-corrector.md     → Fixes Copilot mistakes
Session Resumer   → session-resumer.md     → Resumes after breaks
Screenshot Analyzer → screenshot-analyzer.md → Extracts requirements from images (NEW)
```

### 🧠 BRAIN System (Self-Learning Feedback Loop)

**NEW in v5.0:** KDS learns from every interaction!

```
🧠 BRAIN = Knowledge Graph + Event Stream

Purpose: Learn from successful/failed routings, corrections, file relationships
Storage: KDS/kds-brain/
- knowledge-graph.yaml  → Aggregated learnings
- events.jsonl          → Raw event stream
```

**What BRAIN Learns:**
- ✅ Intent patterns (which phrases trigger which intents)
- ✅ File relationships (which files are modified together)
- ✅ Common mistakes (which corrections happen frequently)
- ✅ Workflow patterns (successful task sequences)
- ✅ Validation insights (common failures and fixes)

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
brain-query.md   → Query knowledge graph for insights
brain-updater.md → Process events and update graph
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

### Standard Practice: Always Let BRAIN Learn

**Every KDS interaction should:**
1. ✅ Log events (automatic in all agents)
2. ✅ Query BRAIN for insights (before decisions)
3. ✅ Update knowledge graph (periodic automatic)

**This is now STANDARD KDS practice** - all agents follow this pattern.

### First-Time Setup

**Option 1: Populate from existing sessions (if you have session history):**
```powershell
# PowerShell
.\KDS\scripts\populate-kds-brain.ps1

# Then update knowledge graph
#file:KDS/prompts/internal/brain-updater.md
```

**Option 2: Crawl your codebase (recommended for new KDS installations):**
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

### Ongoing Usage

**Just use KDS normally!** BRAIN learns automatically:
- 📝 Events logged with every action
- 🧠 BRAIN updated periodically
- 💡 Decisions get smarter over time
- 🕷️ Run incremental crawler scans to keep current

**No manual intervention needed.**

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
