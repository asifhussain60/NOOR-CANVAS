# Context Gathering Protocol (Step 2)

**Purpose:** Build comprehensive context before planning through conditional, intelligent sub-phases.

**Referenced by:** task.prompt.md Step 2

**Dependencies:**
- `.github/prompts/shared/framework-validation-checklists.md` (Step 2.5 quick checks)
- `.github/prompts/shared/ui-debugging-protocol.md` (Step 2.7 evidence gathering)

---

## CRITICAL GUARDRAILS

1. **Token Budget Protection:** If Step 2 context gathering exceeds 50,000 tokens → HALT and request user approval before proceeding (prevents context overflow)

2. **Circular Dependency Detection:** If Step 2.8 detects circular dependencies in architecture → HALT and request resolution strategy from user (prevents infinite recursion)

3. **Phase Timeout Protection:** If Step 2 total execution exceeds 5 minutes → Emit warning, proceed with gathered context (prevents infinite analysis loops)

---

## Sub-Phases Overview

### Always Execute

**2.1: Key Resolution**
- Infer from history, use provided parameter, or auto-detected from Step 0.5
- **2.1.5: High-Priority Constraint Detection** - Scan for ALL CAPS emphasis in user request

**2.2: Key Data Stream Query**
- Read existing work, prevent duplication
- **2.2.1: Record User Request** - Succinct summary before work begins

**2.3: Auto-Load File Mappings**
- Load referenced files into context

### Conditional Execution (based on task type)

**2.4: Error Triage**
- Classify error type, route to appropriate investigation

**2.5: Framework Validation** (if framework error detected)
- See `shared/framework-validation-checklists.md`
- Quick checks for ASP.NET, Blazor, SignalR, Playwright, SQL

**2.6: Known Pattern Matching**
- Instant solution from error library

**2.7: UI Debugging Protocol** (automated evidence gathering for UI bugs)
- See `shared/ui-debugging-protocol.md`
- Selectors, logs, screenshots, Percy

**2.8: Architecture Analysis**
- Prevent duplication, ensure compliance
- **2.8.7: Data Lifecycle Validation** - CRUD: verify UI → API → DB → Broadcast → UI

**2.9: QuickRef Localization**
- Cache InfrastructureQuickRef, PlaywrightQuickRef (first use only)

**2.10: View Documentation** - **DEPRECATED**
- Image analysis moved to plan.prompt.md Step 0.6

**2.11: Refactoring Opportunity Detection**
- Conditional - runs when modifying existing code

**2.12: Load System Context Pack**
- If {key}.plan.md exists - load pre-gathered context

---

## Routing Logic

```
Error reported → 2.4 triages → Routes to 2.5, 2.6, 2.7, or 2.8
HIGH confidence pattern match (2.6) → Skip 2.8, proceed to planning
CRUD operation → 2.8.7 validates complete data lifecycle
Incomplete lifecycle → Early warning in Step 4 approval
```

---

## Step 2.1.5: High-Priority Constraint Detection

**Purpose:** Identify non-negotiable requirements from ALL CAPS emphasis in user request

**Detection Algorithm:**

```
FUNCTION DetectHighPriorityConstraints(userRequest)
  
  constraints = []
  
  // Scan for ALL CAPS patterns (minimum 3 consecutive words)
  allCapsMatches = REGEX_MATCH(userRequest, /\b[A-Z][A-Z\s]{10,}\b/g)
  
  FOR EACH match IN allCapsMatches
    constraint = {
      text: match,
      category: ClassifyConstraintCategory(match),
      verification: GenerateVerificationMethod(match),
      status: "PENDING"
    }
    constraints.APPEND(constraint)
  END FOR
  
  // Scan for explicit emphasis markers
  emphasisMarkers = [
    "MUST", "REQUIRED", "CRITICAL", "DO NOT", "NEVER",
    "ALWAYS", "ENSURE", "MANDATORY", "CANNOT", "SHALL"
  ]
  
  FOR EACH marker IN emphasisMarkers
    IF userRequest.CONTAINS(marker) THEN
      context = ExtractSurroundingContext(userRequest, marker, 50 chars)
      constraint = {
        text: context,
        category: "Mandatory Inclusion",
        verification: "Manual verification required",
        status: "PENDING"
      }
      constraints.APPEND(constraint)
    END IF
  END FOR
  
  RETURN constraints
  
END FUNCTION
```

**Constraint Categories:**

1. **Preservation:** DO NOT MODIFY/REMOVE/CHANGE existing functionality
2. **Exactness:** USE EXACT VALUES/WORDING/STRUCTURE
3. **Mandatory Inclusion:** MUST INCLUDE/ADD/IMPLEMENT specific feature
4. **Behavioral:** MUST BEHAVE/FUNCTION in specific way

**Output Format:**

```markdown
### HIGH-PRIORITY Constraints (from user ALL CAPS emphasis)

1. [PRESERVATION] DO NOT CHANGE THE EXISTING SESSION TITLE DISPLAY
   - **Category**: Preservation
   - **Verification Method**: Regression test on session title rendering
   - **Status**: PENDING → VERIFIED → FAILED

2. [EXACTNESS] USE THE EXACT CSS CLASS "btn-primary"
   - **Category**: Exactness
   - **Verification Method**: grep search for class="btn-primary"
   - **Status**: PENDING

3. [MANDATORY] MUST INCLUDE DELETE CONFIRMATION DIALOG
   - **Category**: Mandatory Inclusion
   - **Verification Method**: Functional test for dialog appearance
   - **Status**: PENDING
```

---

## Step 2.2.1: Record User Request

**Purpose:** Capture succinct summary of user request before work begins

**Output Location:** `.github/key-data-streams/{key}/work-log.md`

**Format:**

```markdown
## Session Start: {ISO-8601-timestamp}

### User Request (Original)
{verbatim user message - first 500 characters}

### Interpreted Task Summary
{one-sentence distilled task description}

### High-Priority Constraints Detected
{list of ALL CAPS constraints if present, or "None detected"}

### Execution Mode
- **Debug Level**: {none|minimal|detailed|doc}
- **Verbosity**: {concise|detailed}
- **Plan Exists**: {YES|NO}
- **Phase-Driven**: {YES|NO}
```

---

## Step 2.8.7: Data Lifecycle Validation (CRUD)

**Purpose:** Verify complete data flow for CRUD operations to prevent incomplete implementations

**Trigger:** Any task involving data mutations (CREATE, UPDATE, DELETE)

**Required Lifecycle Components:**

```
┌──────────────────────────────────────────────────────────────┐
│                   Complete CRUD Lifecycle                     │
└──────────────────────────────────────────────────────────────┘

1. UI Event Handler (Button click, form submit, etc.)
   ↓
2. API Endpoint (POST/PUT/DELETE to /api/*)
   ↓
3. Database Mutation (DbContext.SaveChanges())
   ↓
4. SignalR Broadcast (Clients.All.SendAsync(...))
   ↓
5. UI Update (All clients receive and render change)
```

**Validation Algorithm:**

```
FUNCTION ValidateDataLifecycle(taskDescription, contextFiles)
  
  lifecycle = {
    uiEventHandler: DETECT(contextFiles, /onclick|@onsubmit|HandleClick/),
    apiEndpoint: DETECT(contextFiles, /\[HttpPost\]|\[HttpPut\]|\[HttpDelete\]/),
    dbMutation: DETECT(contextFiles, /DbContext\.(Add|Update|Remove)|SaveChanges/),
    signalrBroadcast: DETECT(contextFiles, /Clients\.All\.SendAsync|BroadcastAsync/),
    uiUpdate: DETECT(contextFiles, /StateHasChanged|@bind|OnInitializedAsync/)
  }
  
  missing = []
  
  IF NOT lifecycle.apiEndpoint THEN
    missing.APPEND("API Endpoint")
  END IF
  
  IF NOT lifecycle.dbMutation THEN
    missing.APPEND("Database Persistence")
  END IF
  
  IF NOT lifecycle.signalrBroadcast THEN
    missing.APPEND("SignalR Broadcast")
  END IF
  
  IF missing.LENGTH > 0 THEN
    RETURN {
      complete: FALSE,
      missing: missing,
      impact: GenerateImpactWarning(missing)
    }
  ELSE
    RETURN {
      complete: TRUE,
      missing: [],
      impact: "✅ Complete data lifecycle detected"
    }
  END IF
  
END FUNCTION
```

**Impact Warnings:**

| Missing Component | User-Facing Impact |
|-------------------|-------------------|
| API Endpoint | Changes not saved - page refresh loses data |
| Database Persistence | Mutations not persisted - server restart loses data |
| SignalR Broadcast | Multi-user desync - only one client sees changes |
| UI Update | Stale UI - requires manual refresh to see changes |

**Early Warning Output (for Step 4 Approval):**

```
⚠️ WARNING: Incomplete Data Lifecycle Detected

Current implementation missing:
- [X] Database Persistence (mutations not saved)
- [X] SignalR Broadcast (other clients won't see changes)

This will result in:
- ❌ Changes disappear after page refresh
- ❌ Multi-user desync (only one browser updated)

Recommendation:
1. Add API endpoint: POST /api/questions/{id}/delete
2. Add database mutation: DbContext.Questions.Remove()
3. Add SignalR broadcast: Clients.All.SendAsync("QuestionDeleted")

Proceed with incomplete implementation? (Not recommended)
```

---

## Step 2.12: Load System Context Pack (from plan)

**Trigger:** When `.github/key-data-streams/{key}/{key}.plan.md` exists

**Purpose:** Load pre-gathered execution context to skip redundant analysis

**Actions:**

1. **Read plan document** at `.github/key-data-streams/{key}/{key}.plan.md`

2. **Extract System Context Pack section** (if present)

3. **Cache the following for immediate use:**
   - **API Endpoints**: Paths, methods, request/response contracts, authentication
   - **Database Schemas**: Tables, columns, relations, migration details
   - **SignalR Hubs**: Hub names, event names, payload structures
   - **Test Data**: Session 212 defaults, tokens (Host/User), canonical URLs
   - **Configuration**: Environment variables, ports, feature flags
   - **Canonical References**: Links to InfrastructureQuickRef, PlaywrightQuickRef

**Benefits:**
- ✅ Skip API endpoint discovery (already documented in plan)
- ✅ Skip database schema exploration (already validated in plan)
- ✅ Use pre-validated test data (consistency across phases)
- ✅ Faster execution (no redundant context gathering)
- ✅ Technology-aware implementation (framework/version compatibility validated by plan)

**Output:**

```
📦 Loaded System Context Pack from plan

- APIs: 3 endpoints cached
- Database: 2 tables (canvas.Sessions, canvas.Participants)
- SignalR: SessionHub (3 events)
- Test Data: Session 212 (Host: PQ9N5YWW, User: KJAHA99L)
- Technology: ASP.NET Core 8.0 (Blazor Server)

✅ Ready to execute with pre-validated context
```

---

## Step 2.10 Deprecation Notice

**DEPRECATED:** Image analysis has been moved to plan.prompt.md Step 0.6 for proper requirement gathering during planning phase.

**If user provides `annotate` parameter or images during task execution:**
- ⚠️ Warn that image analysis should be done in planning phase
- Suggest running `@workspace /feature` first
- Do not attempt image analysis in task.prompt.md

---

## Output Control (based on verbosity)

**Concise:**
- Phase names only
- Routing decisions
- Key findings summary
- Constraint count

**Detailed:**
- Complete context dump
- Analysis results with confidence scores
- File-by-file breakdown
- Architectural impact analysis
- Full constraint verification plan
