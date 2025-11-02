# Test Prep — Prepare Components for Automated Playwright Test Generation

**⚠️ LOAD FIRST:** `.github/MANDATORY.md` (Enforce: No code in chat | Document first | Playwright orchestration)

---

## Purpose

Automate preparation of Razor components for Playwright test generation via dual-stream interaction logging (client console + server logs).

**Use Case**: Transform manual test writing into automated test generation from real user interactions.

---

## Version

**Version**: 1.0.0  
**Created**: 2025-10-31  
**Last Updated**: 2025-10-31

---

## Usage

### Flexible Request Mode
```
@workspace /test-prep {Additional request modifying default behavior}
```

**Examples**:
```
@workspace /test-prep Prepare HostControlPanel for asset sharing test
@workspace /test-prep Review logs and suggest tests
@workspace /test-prep Generate tests from session 212, focus on annotation sync
@workspace /test-prep Clean up all logging markers from last session
```

**Agent parses natural language** to determine action (prep/review/generate/cleanup) and extract parameters.

### Direct File Mode
```
@workspace /test-prep #file:Component1.razor #file:Component2.razor [options]
```

**Examples**:
```
@workspace /test-prep #file:HostControlPanel.razor #file:TranscriptCanvas.razor #file:SessionCanvas.razor
@workspace /test-prep #file:HostControlPanel.razor session=212
@workspace /test-prep #file:AssetSidebar.razor #file:QuestionPanel.razor key=hcp feature=asset-sharing
```

**When #file: detected** → Defaults to `action=prep` with specified files

---

## Commands

### 1. Prep Files for Logging

**Invocation (Structured)**:
```
@workspace /test-prep action=prep files=[HostControlPanel.razor,SessionCanvas.razor] session=212
```

**Invocation (Direct File Mode)**:
```
@workspace /test-prep #file:HostControlPanel.razor #file:SessionCanvas.razor session=212
```

**Invocation (Natural Language)**:
```
@workspace /test-prep Prepare HostControlPanel, SessionCanvas, and TranscriptCanvas for testing
```

**Actions**:
1. Inject `data-playwright-log-marker` attributes (Algorithm 10)
2. Enable PlaywrightLogger.js (create if missing)
3. Configure appsettings.json (PlaywrightLogging.Enabled=true)
4. Enable server-side logging (Serilog file writer)
5. Save tracking file (`.github/key-data-streams/test-prep/sessions/{session}/injected-files.json`)

**Output**:
- Files modified count
- Tracking file path
- Next command: Manual testing instructions

---

### 2. Review Logs & Report Test Potential

**Invocation (Structured)**:
```
@workspace /test-prep action=review session=212
```

**Invocation (Natural Language)**:
```
@workspace /test-prep Review logs and suggest tests
@workspace /test-prep Analyze captured interactions and report coverage
@workspace /test-prep What tests can I create from the logs?
```

**Actions**:
1. **Verify Log Files Exist**:
   - Check `SPA/NoorCanvas/playwright-server-logs.txt` (Blazor server logs)
   - Check browser console logs via DevTools Protocol or manual export
   - Report which logs are missing

2. **Read & Parse Server Logs**:
   - Extract SignalR events (hub invocations, broadcasts)
   - Extract API calls (controllers, endpoints, response codes)
   - Extract database operations (EF Core queries, inserts, updates)
   - Extract component lifecycle (OnInitialized, OnParametersSet, renders)

3. **Read & Parse Client Logs** (Browser Console):
   - **CRITICAL**: Browser console logs are NOT automatically captured
   - **Manual Export Required**: User must open DevTools → Console → Right-click → "Save as..."
   - **Alternative**: Inject console.log interceptor in PlaywrightLogger.js
   - Extract client-side events (button clicks, form submissions, navigation)
   - Extract JavaScript errors, warnings, and custom log messages

4. **Correlate Interactions**:
   - Match client actions to server responses (by timestamp ±2s window)
   - Identify complete flows (e.g., button click → API call → SignalR broadcast → UI update)
   - Detect incomplete flows (client action with no server response = potential bug)

5. **Generate Test Potential Report**:
   - **Format**: Markdown table with test scenarios
   - **Columns**: Test Name | Client Action | Server Events | Assertions Possible | Quality Score
   - **Prioritization**: Sort by completeness (flows with both client + server events first)

6. **Request User Approval**:
   - Display report with test count and coverage summary
   - Ask: "Generate all tests?" or "Select specific tests?"
   - Allow filtering by component, feature, or quality score threshold

**Output**:
- Log validation status (✅ both logs present, ⚠️ client logs missing, ❌ no logs found)
- Test potential report (table format, ≤20 rows for readability)
- Recommended next action (approve generation, capture missing logs, or cleanup)

**Example Output**:

**📊 Test Potential Report**

**Session**: 212  
**Server Logs**: ✅ Found (2088 lines, 638KB)  
**Client Logs**: ⚠️ **NOT FOUND** - Browser console logs not captured

**⚠️ Client Log Capture Required**:

**Option A - Manual Export** (Recommended for this session):
1. Open browser DevTools (F12)
2. Go to Console tab
3. Right-click in console → "Save as..." → Save to `SPA/NoorCanvas/playwright-interaction-logs.txt`
4. Re-run `@workspace /test-prep action=review session=212`

**Option B - Automated Capture** (For future sessions):
1. Inject console interceptor in PlaywrightLogger.js
2. Logs will auto-save to `playwright-interaction-logs.txt`
3. See `.github/prompts/shared/kds-validation-algorithms.md` Algorithm 10

**Testable Flows** (Server-side only, limited without client logs):

| # | Test Name | Client Action | Server Events | Assertions | Score |
|---|-----------|---------------|---------------|------------|-------|
| 1 | HCP: Broadcast Transcript Section | *(Unknown - no client logs)* | BroadcastTranscriptSection invoked, HtmlContentReceived sent to session_212, 7422 chars | Verify section HTML received, verify asset count (3 assets detected) | 60% |
| 2 | HCP: SignalR Connection Establishment | *(Unknown - no client logs)* | Connection handshake, ConnectionId assigned (Zp_V0Nr6zRJ9M9zQC9hS3g), Timeout configured (60s) | Verify connection state, verify ConnectionId format | 75% |
| 3 | HCP: Join Session Groups | *(Unknown - no client logs)* | JoinSession invoked (SessionId=212, Role=host), JoinHostGroup invoked | Verify group membership (session_212, Host_212) | 70% |
| 4 | TC: Participant Verification | *(Unknown - no client logs)* | API call /api/participant/session/KJAHA99L/validate, UserGuid found (fe79bb17...) | Verify participant exists, verify registration check passes | 65% |
| 5 | TC: Asset Reception | *(Likely broadcast received)* | HtmlContentReceived event (7422 chars), HTML transformation (7422→7443 chars), 3 assets detected | Verify asset content rendered, verify share buttons present | 55% |

**Total Tests Possible**: 8 complete flows, 12 partial flows (20 total)  
**Coverage**: SignalR (100%), API calls (85%), Database ops (40%), UI interactions (0% - no client logs)

**⚡ Next Steps**:

**A.** Capture client logs (manual export) and re-run review → **Unlock 12 additional tests**  
**B.** Generate ALL 8 server-only tests now (limited assertions, 60-75% quality)  
**C.** Cherry-pick specific tests to generate (select by test number)  
**D.** Cancel and re-do manual testing with automated logging enabled  

**Choose Action**: [A/B/C/D]

---

**If User Selects B (Generate All Tests)**:
- Proceed directly to `action=generate` with all 8 tests
- Generate files: `Tests/UI/hcp-broadcast-section.spec.ts`, `Tests/UI/hcp-signalr-connection.spec.ts`, etc.
- Report: "✅ Generated 8 tests. Quality scores: 60-75%. Run tests: `npx playwright test`"

**If User Selects C (Cherry-Pick Tests)**:
- Prompt: "Enter test numbers to generate (comma-separated, e.g., 1,2,5): "
- User input: `1,2,5`
- Generate only selected tests (3 files in this example)
- Report: "✅ Generated 3 tests: #1 (HCP: Broadcast Section), #2 (SignalR Connection), #5 (Asset Reception)"

**Flow After Cherry-Pick Selection**:
```
User: @workspace /test-prep Review logs

Copilot: [Displays report with 8 testable flows]
         Choose Action: [A/B/C/D]

User: C

Copilot: Enter test numbers to generate (comma-separated, e.g., 1,2,5):

User: 1,3,4

Copilot: ✅ Generating 3 selected tests:
         - Test #1: HCP: Broadcast Transcript Section
         - Test #3: HCP: Join Session Groups
         - Test #4: TC: Participant Verification
         
         [Calls action=generate with testNumbers=[1,3,4]]
         
         ✅ Generated 3 tests successfully:
         📁 Tests/UI/hcp-broadcast-section.spec.ts (Quality: 60%)
         📁 Tests/UI/hcp-join-groups.spec.ts (Quality: 70%)
         📁 Tests/UI/tc-participant-verification.spec.ts (Quality: 65%)
         
         Next: Run tests with `npx playwright test` or cleanup with `@workspace /test-prep action=cleanup`
```

---

### 3. Generate Tests from Logs

**Invocation (Structured)**:
```
@workspace /test-prep action=generate session=212 key=hcp feature=asset-sharing
@workspace /test-prep action=generate session=212 testNumbers=[1,3,5]
```

**Invocation (Natural Language)**:
```
@workspace /test-prep Generate tests from session 212 for host control panel asset sharing
@workspace /test-prep Create Playwright test from the logs, focus on annotation sync feature
@workspace /test-prep Generate tests 1, 3, and 5 from session 212
```

**Actions**:
1. Load session context from `.github/key-data-streams/test-prep/sessions/{session}/`
2. Read `playwright-interaction-logs.txt` (client clicks/inputs/navigation)
3. Read `playwright-server-logs.txt` (server events/SignalR/database)
4. Correlate by timestamp (client → server event matching)
5. **Filter by test numbers** (if `testNumbers` parameter provided):
   - If `testNumbers=[1,3,5]` → Generate only tests #1, #3, #5 from review report
   - If `testNumbers` omitted → Generate ALL tests
6. Generate Playwright test(s) with assertions
7. Apply quality scoring (Algorithm 9)
8. Save test(s) to `Tests/UI/{key}-{feature}.spec.ts`

**Output**:
- Test file path(s)
- Quality score (0-100) for each test
- Coverage summary (interactions → assertions)
- Next command: Run test or cleanup

**Example Output (Cherry-Picked)**:

**✅ Generated 3 Tests**

**Session**: 212  
**Tests Selected**: #1, #3, #5

**Files Created**:
1. `Tests/UI/hcp-broadcast-section.spec.ts` (Quality: 60%, 5 assertions)
2. `Tests/UI/hcp-join-groups.spec.ts` (Quality: 70%, 3 assertions)
3. `Tests/UI/tc-asset-reception.spec.ts` (Quality: 55%, 4 assertions)

**Coverage**:
- Client interactions: 3 flows
- Server events: 8 correlated
- Assertions: 12 total

**⚡ Next Steps**:

**A.** Run tests now: `npx playwright test --headed`  
**B.** Generate more tests (different test numbers)  
**C.** Review test files before running  
**D.** Cleanup logging infrastructure  

---

### 4. Cleanup Logging Infrastructure

**Invocation (Structured)**:
```
@workspace /test-prep action=cleanup session=212
```

**Invocation (Natural Language)**:
```
@workspace /test-prep Clean up all logging markers from session 212
@workspace /test-prep Remove test prep infrastructure and archive logs
```

**Actions**:
1. Read injected-files.json from session
2. Remove all `data-playwright-log-marker` attributes
3. Remove PlaywrightLogger.init() script blocks
4. Delete log files (`playwright-interaction-logs.txt`, `playwright-server-logs.txt`)
5. Archive session folder to `_ARCHIVE/session-{timestamp}/`

**Output**:
- Files cleaned count
- Session archived path
- Status: Ready for new test prep session

---

## Parameters

### Input Parsing Logic

**Priority Order**:
1. **Direct File Mode** (`#file:` detected) → Extract files, default `action=prep`
2. **Structured Mode** (`action=` detected) → Parse explicit parameters
3. **Natural Language Mode** → Analyze request, infer action and parameters

**File Extraction**:
```
Input: "@workspace /test-prep #file:HostControlPanel.razor #file:SessionCanvas.razor session=212"
Parsed:
  action = "prep" (default when #file: present)
  files = ["HostControlPanel.razor", "SessionCanvas.razor"]
  session = "212"
```

**Natural Language Parsing Examples**:
```
Input: "Prepare HostControlPanel for asset sharing test"
Parsed:
  action = "prep"
  files = ["HostControlPanel.razor"] (inferred from component name)
  feature = "asset-sharing" (inferred from description)

Input: "Review logs and suggest tests"
Parsed:
  action = "review"
  session = "latest" (use most recent session)

Input: "What tests can I create from the logs?"
Parsed:
  action = "review"
  session = "latest"

Input: "Generate tests from session 212, focus on annotation sync"
Parsed:
  action = "generate"
  session = "212"
  feature = "annotation-sync" (inferred)

Input: "Clean up all logging markers"
Parsed:
  action = "cleanup"
  session = "latest" or prompt user for session ID
```

### action *(auto-detected or explicit)*
- `prep` - Inject logging infrastructure
- `review` - Analyze logs and report test potential (approval required before generation)
- `generate` - Create Playwright test from logs
- `cleanup` - Remove all logging infrastructure

**Auto-detection**:
- Keywords: "prepare", "setup", "inject" → `prep`
- Keywords: "review", "analyze", "report", "suggest", "what tests" → `review`
- Keywords: "generate", "create test", "build test" → `generate`
- Keywords: "cleanup", "clean", "remove", "archive" → `cleanup`
- Presence of `#file:` → `prep` (default)

### files *(required for action=prep)*
Array of Razor component file paths (relative or absolute)

**Structured Mode**:  
`files=[HostControlPanel.razor,SessionCanvas.razor,TranscriptCanvas.razor]`

**Direct File Mode**:  
`#file:HostControlPanel.razor #file:SessionCanvas.razor #file:TranscriptCanvas.razor`

**Natural Language Mode**:  
Agent infers from component names in request (e.g., "Prepare HostControlPanel and SessionCanvas")

**Path Resolution**:
- Relative paths resolved from workspace root
- Common locations searched: `SPA/NoorCanvas/Components/`, `SPA/NoorCanvas/Pages/`
- Full paths accepted: `SPA/NoorCanvas/Components/HostControlPanel.razor`

### session *(optional, default=auto-generated)*
Session ID for tracking (used for cleanup and log correlation)

**Format**: Numeric or timestamp-based (e.g., `212` or `20251031143022`)

### key *(required for action=generate)*
KDS key for test organization (e.g., `hcp`, `canvas`, `transcript-canvas`)

### feature *(required for action=generate)*
Feature name for test file naming (kebab-case)

**Example**: `asset-sharing`, `question-submission`, `annotation-sync`

### testNumbers *(optional for action=generate)*
Array of test numbers to generate (cherry-pick specific tests from review report)

**Format**: `testNumbers=[1,3,5]` or comma-separated string `"1,3,5"`

**Behavior**:
- If **provided**: Generate only selected tests from review report
- If **omitted**: Generate ALL tests from review report

**Example**:
```
@workspace /test-prep action=generate session=212 testNumbers=[1,2,5]
```
Generates only tests #1, #2, #5 from the review report table.

### filter *(optional for action=generate)*
Log filtering criteria (e.g., `component=AssetSidebar`, `timerange=14:30-14:35`)

### validate *(flag, optional for action=generate)*
Run Algorithm 9 (Test Quality Scoring) after generation

---

## Execution Steps

### Action: prep

**Step 1: Validate Inputs**
- Verify files exist and are Razor components
- Generate session ID if not provided
- Create session tracking folder

**Step 2: Clean Up Old Markers (if any exist)**

**For each file**:
1. Read component file
2. Scan for existing `data-playwright-log-marker` attributes (regex: `data-playwright-log-marker="[^"]*"`)
3. If found:
   - Remove ALL old markers from file
   - Log removed marker IDs to cleanup report
   - Save cleaned file
4. If not found: Proceed to injection

**Rationale**: Only ONE active test prep session should exist at a time to avoid log correlation confusion

**Step 1.5: Verify Prep Markers (CONDITIONAL - Screenshot Scenario)**

**Trigger:** User invoked test-generation with screenshots parameter AND Razor components have existing data-playwright-log-marker attributes

**Purpose:** Cross-reference screenshot markers with existing test-prep markers to prevent conflicts

**Algorithm:**

1. **Detect Screenshot Scenario**:
   - Check if test-generation invocation included screenshots
   - Check if components have data-playwright-log-marker attributes
   - If BOTH true → Execute marker validation

2. **Cross-Reference Markers**:
   - Load screenshot visual markers (1, 2, 3... from images)
   - Load prep markers from Razor components (timestamp-component format)
   - Compare marker count: Visual markers vs Prep markers
   - Compare visual sequence vs component element order

3. **Validation Report**:
   - ✅ **MATCH**: Visual markers align with prep markers (e.g., Marker 2 → Start Session button with data-playwright-log-marker="20251031-HostControlPanel")
   - ⚠️ **PARTIAL MATCH**: Some visual markers have no prep markers (incomplete prep)
   - ❌ **MISMATCH**: Visual markers conflict with prep markers (wrong components prepped)

4. **User Decision**:
   - **If MATCH**: Proceed with screenshot-based test generation using prep markers
   - **If PARTIAL MATCH**: 
     - Option A: Keep existing markers, supplement with screenshot data
     - Option B: Cleanup old markers, re-prep with screenshot guidance
   - **If MISMATCH**:
     - Option A: Cleanup old markers, re-prep with screenshot guidance (RECOMMENDED)
     - Option B: Ignore screenshots, use prep markers only
     - Option C: Cancel test generation

**Example Scenario**:

**Visual Markers** (from screenshots):
1. Navigate to Host Control Panel
2. Click "Transcript Canvas" button
3. Click "Start Session" button
4. Click "Share Section" button
5. Click Question FAB

**Prep Markers** (from Razor components):
- HostControlPanelSidebar.razor: data-playwright-log-marker="20251031-HostControlPanel" (Start Session button)
- HostControlPanelContent.razor: data-playwright-log-marker="20251031-TranscriptBroadcast" (Broadcast Transcript button)
- TranscriptCanvas.razor: data-playwright-log-marker="20251031-QuestionModal" (Question FAB)

**Validation Result**:
- ⚠️ **PARTIAL MATCH**
- Marker 3 (Start Session) → FOUND in HostControlPanelSidebar
- Marker 5 (Question FAB) → FOUND in TranscriptCanvas
- Marker 2 (Transcript Canvas button) → NOT FOUND (no prep marker)
- Marker 4 (Share Section button) → NOT FOUND (no prep marker)

**Recommendation**:
- Cleanup existing markers (partial coverage insufficient)
- Re-run test-prep with all components from screenshots:
  - `@workspace /test-prep #file:HostControlPanelContent.razor #file:HostControlPanelSidebar.razor #file:TranscriptCanvas.razor session=212`

**Integration with test-generation.prompt.md**:
- Screenshot analysis (Step 0.5) passes extracted selectors to test-prep validator
- If mismatch detected, test-generation halts with cleanup recommendation
- User must resolve marker conflicts before test generation proceeds

---

**Step 3: Inject Fresh Logging Infrastructure**

**Algorithm**: See `.github/prompts/shared/kds-validation-algorithms.md` - Algorithm 10 (InjectPlaywrightLogger)

**For each file**:
1. Read component file (now guaranteed clean)
2. Generate unique marker: `{timestamp}-{componentName}`
3. Inject `data-playwright-log-marker` attribute into root div
4. Inject PlaywrightLogger.init() script block (if automated approach)
5. Save modified file

**Step 4: Create KDS Browser Console Log Placeholder**

**File**: `.github/key-data-streams/test-prep/sessions/{session}/browser-console-logs.md`

**Purpose**: 
- Tie browser logs into KDS system (Rule #2b compliance)
- Preserve session context for future reference
- Enable cross-session log analysis

**Template**:
```markdown
# Browser Console Logs - Session {session}

**Session ID**: {session}  
**Created**: {timestamp}  
**Components**: {component1, component2, component3}  
**Status**: Awaiting manual capture

---

## 📋 Capture Instructions

1. Run application: `dotnet run --project SPA/NoorCanvas`
2. Open browser DevTools (F12) → Console tab
3. Perform test scenarios (see ../SESSION-{session}.md)
4. Right-click in console → "Save as..."
5. Replace this file with saved console output

---

## 🔍 Expected Content

- NoorLogger initialization messages
- Component lifecycle events (mounted, rendered)
- User interactions (clicks, inputs, navigation)
- SignalR events (connection, invoke, receive)
- JavaScript errors/warnings

---

## ⚠️ Status

**NOT YET CAPTURED** - Placeholder file, replace with actual console export

---

**Related Files**:
- Session Plan: `../SESSION-{session}.md`
- Server Logs: Copy from `SPA/NoorCanvas/playwright-server-logs.txt`
- Tracking: `./injected-files.json`
```

**Step 5: Configure Backend Logging**

**File**: `SPA/NoorCanvas/appsettings.Development.json`

**Add if missing**:
```json
{
  "Serilog": {
    "WriteTo": [
      {
        "Name": "File",
        "Args": {
          "path": "playwright-server-logs.txt",
          "outputTemplate": "[SERVER] {Timestamp:yyyy-MM-ddTHH:mm:ss.fffZ} | {SourceContext} | {Message:lj}{NewLine}"
        }
      }
    ]
  }
}
```

**Step 4: Verify PlaywrightLogger.js Exists (Optional - for automated approach)**

**File**: `SPA/NoorCanvas/wwwroot/js/PlaywrightLogger.js`

**Note**: Current implementation uses manual browser console saving (see ROLLBACK-SUMMARY.md)

**If automated approach needed**: Use Algorithm 10 specification

**Step 5: Save Tracking File + KDS Integration**

**File**: `.github/key-data-streams/test-prep/sessions/{session}/injected-files.json`

**Format**:
```json
{
  "session": "{session}",
  "timestamp": "2025-10-31T14:30:22.123Z",
  "approach": "manual-dual-stream",
  "kds": {
    "sessionPlan": "../SESSION-{session}.md",
    "browserLogs": "./browser-console-logs.md",
    "serverLogs": "../../../../SPA/NoorCanvas/playwright-server-logs.txt",
    "trackingFile": "./injected-files.json"
  },
  "files": [
    {
      "path": "SPA/NoorCanvas/Pages/HostControlPanel.razor",
      "marker": "{session}-HostControlPanel",
      "linesModified": [45, 2150],
      "oldMarkersRemoved": ["20251031150100-HostControlPanel"]
    }
  ],
  "cleanup": {
    "oldMarkersFound": 11,
    "oldMarkersRemoved": 11,
    "previousSessions": ["20251031150100", "20251031150200"]
  },
  "status": "prepped"
}
```

**Step 6: Output Instructions**

**Format** (≤20 bullets):

**🎯 Test Prep Complete**

**Session**: `{session}`  
**Files Prepped**: {count} components  
**Old Markers Cleaned**: {count} removed from {previousSessionCount} previous sessions  
**Tracking File**: `.github/key-data-streams/test-prep/sessions/{session}/injected-files.json`

**📁 KDS Integration**:
- Session Plan: `.github/key-data-streams/test-prep/SESSION-{session}.md`
- Browser Logs Placeholder: `sessions/{session}/browser-console-logs.md`
- Server Logs: Copy from `SPA/NoorCanvas/playwright-server-logs.txt`
- Tracking: `sessions/{session}/injected-files.json`

**📋 Next Steps**:

1. **Run Application** (headed mode):
   
   **Algorithm:** See `.github/prompts/shared/test-prep-examples.md` - Example 1 (Run Application Command)

2. **Perform Manual Testing** (5-10 minutes):
   - Navigate to prepped components
   - Click buttons, fill forms, submit data
   - Trigger SignalR events, database operations
   - Cover all test scenarios

3. **Verify Logs Generated**:
   - Browser logs: Manually save console to `sessions/{session}/browser-console-logs.md`
   - Server logs: Copy `SPA/NoorCanvas/playwright-server-logs.txt` to KDS

4. **Review Logs**:
   ```
   @workspace /test-prep action=review session={session}
   ```

5. **Generate Tests** (after review approval):
   ```
   @workspace /test-prep action=generate session={session} key={key} feature={feature}
   ```

**⚡ Options**

**A.** Start manual testing now (run app, open DevTools)  
**B.** Review injected markers first (verify clean injection)  
**C.** Review KDS integration (check session files created)  
**D.** Cancel and cleanup (remove markers)

**📊 Cleanup Report** (if old markers removed):
- Previous sessions cleaned: {list of session IDs}
- Total markers removed: {count}
- Files affected: {list of file names}

---

### Action: generate

**Step 1: Load Session Context**

**Read**: `.github/key-data-streams/test-prep/sessions/{session}/injected-files.json`

**Verify**:
- Session exists
- Files still contain markers (not cleaned up prematurely)
- Log files exist

**Step 2: Read Log Files**

**Client Logs** (`playwright-interaction-logs.txt`):
```
[CLIENT] 2025-10-31T14:32:15.123Z | CLICK | [data-testid="share-asset-btn"] | button | "Share Asset"
[CLIENT] 2025-10-31T14:32:16.456Z | INPUT | [data-testid="asset-title-input"] | value="Test Image"
[CLIENT] 2025-10-31T14:32:17.789Z | NAVIGATE | /host/control-panel/212
```

**Server Logs** (`playwright-server-logs.txt`):
```
[SERVER] 2025-10-31T14:32:15.456Z | AssetSidebar | Sharing asset ABC123 of type Image
[SERVER] 2025-10-31T14:32:15.789Z | SessionHub | Asset shared to session 212
[SERVER] 2025-10-31T14:32:16.012Z | CanvasDbContext | INSERT INTO SessionAssets (ShareId=ABC123)
```

**Step 3: Correlate Logs by Timestamp**

**Algorithm**:
```
FOR EACH clientLog IN clientLogs:
  timestamp = clientLog.timestamp
  
  # Find matching server events (within 2 second window)
  matchingServerLogs = serverLogs.WHERE(
    log.timestamp BETWEEN timestamp AND timestamp + 2s
  )
  
  # Create interaction with assertions
  interaction = {
    clientAction: clientLog.action,
    selector: clientLog.selector,
    serverEvents: matchingServerLogs,
    assertions: GenerateAssertions(matchingServerLogs)
  }
END FOR
```

**Step 4: Generate Playwright Test**

**Algorithm:** See `.github/prompts/shared/test-prep-examples.md` - Example 2 (Playwright Test Template)

**Step 5: Apply Quality Scoring (if --validate)**

**Algorithm**: See `.github/prompts/shared/test-quality-scoring.md` - Algorithm 9

**Criteria**:
- Selector quality (data-testid vs CSS)
- Assertion coverage (client actions → server verification)
- Error handling (try-catch, timeouts)
- Test isolation (beforeEach cleanup)

**Step 6: Save Test File**

**Path**: `Tests/UI/{key}-{feature}.spec.ts`

**Step 7: Output Summary**

**Format** (≤15 bullets):

**✅ Test Generated**

**Session**: `{session}`  
**Test File**: `Tests/UI/{key}-{feature}.spec.ts`  
**Quality Score**: {score}/100 ({grade})

**📊 Coverage**:
- Client interactions: {count}
- Server events correlated: {count}
- Assertions generated: {count}

**🎯 Test Details**:
- Selectors: {data-testid count} data-testid, {css count} CSS
- Timeouts: {count} configured
- Error handling: {yes/no}

**⚡ Options**

**A.** Run test now (headed mode)  
**B.** Review test file first  
**C.** Generate additional tests (new session)  
**D.** Cleanup logging infrastructure

---

### Action: cleanup

**Step 1: Load Session Context from KDS**

**Read**: `.github/key-data-streams/test-prep/sessions/{session}/injected-files.json`

**Verify**:
- Session exists in KDS
- Tracking file valid
- Files still contain markers

**Step 2: Remove Markers from Files**

**For each file**:
1. Read current file content
2. Remove `data-playwright-log-marker` attributes matching session ID
3. Remove PlaywrightLogger.init() script blocks (if present)
4. Verify no markers remain (regex scan: `data-playwright-log-marker="[^"]*"`)
5. Save cleaned file

**Step 3: Archive KDS Session Data**

**Move entire session folder**:
```
FROM: .github/key-data-streams/test-prep/sessions/{session}/
TO:   .github/key-data-streams/test-prep/_ARCHIVE/session-{session}-archived-{timestamp}/
```

**Archived contents**:
- `injected-files.json` (tracking data)
- `browser-console-logs.md` (captured or placeholder)
- `SESSION-{session}.md` (if exists in parent)
- Any generated test files or reports

**Step 4: Archive Server Logs**

**Copy** (don't delete - may be needed for debugging):
```
FROM: SPA/NoorCanvas/playwright-server-logs.txt
TO:   .github/key-data-streams/test-prep/_ARCHIVE/session-{session}-archived-{timestamp}/server-logs.txt
```

**Step 5: Output Summary**

**Format** (≤15 bullets):

**🧹 Cleanup Complete**

**Session**: `{session}`  
**Files Cleaned**: {count} components  
**Markers Removed**: {count} total (session {session})  
**KDS Archive**: `.github/key-data-streams/test-prep/_ARCHIVE/session-{session}-archived-{timestamp}/`

**📂 Archived Contents**:
- Tracking data (`injected-files.json`)
- Browser console logs (`browser-console-logs.md`)
- Server logs (`server-logs.txt`)
- Session plan (`SESSION-{session}.md`)
- Generated tests (if any)

**📊 Archive Stats**:
- Session duration: {start} → {end}
- Components tested: {list}
- Tests generated: {count} files
- Total log size: {KB}

**⚡ Status**: Ready for new test prep session

**Next Session ID**: `{nextSessionId}` (auto-generated when needed)

---

## Integration Points

### With KDS System

**Full KDS Integration** - All test-prep artifacts stored in Key Data Streams:

**Directory Structure**:
```
.github/key-data-streams/test-prep/
├── README.md                                    ← Guide for test-prep system
├── E2E-TEST-CAPTURE-GUIDE.md                   ← Manual capture workflow
├── ROLLBACK-SUMMARY.md                         ← Why manual approach
├── SESSION-{session}.md                        ← Current session plan
├── PRE-FLIGHT-CHECK-{session}.md               ← Validation report
├── sessions/
│   └── {session}/
│       ├── injected-files.json                 ← Tracking + KDS links
│       ├── browser-console-logs.md             ← Captured logs
│       └── test-generation-report.md           ← Review output
└── _ARCHIVE/
    └── session-{session}-archived-{timestamp}/
        ├── injected-files.json
        ├── browser-console-logs.md
        ├── server-logs.txt
        ├── SESSION-{session}.md
        └── generated-tests/
            └── *.spec.ts
```

**KDS Benefits**:
- **Traceability**: Every test session has complete audit trail
- **Reproducibility**: All context preserved for debugging
- **Cross-Session Analysis**: Compare logs across sessions
- **Documentation**: Session plans serve as test documentation
- **Cleanup Safety**: Archive prevents data loss

**KDS Rulebook Compliance**:
- **Rule 2b**: Test Reverse-Engineering Metadata (UI interaction logging)
- **Handoff Protocol**: Session tracking enables proper handoff
- **Document First**: Session plan created before code changes

### With KDS Rulebook

**Rule #2b**: Test Reverse-Engineering Metadata  
**Section**: UI Interaction Logging

**References**:
- Algorithm 10 (InjectPlaywrightLogger)
- PlaywrightLogger.js specification
- Cleanup automation patterns

### With Prompts

**test-generation.prompt.md**:
- Invoked by `action=generate` (Step 4: Generate Playwright Test)
- File-based log reading (not manual copy-paste)

**cleanup-playwright-logging.prompt.md**:
- Invoked by `action=cleanup` (Step 2: Remove Markers)
- Session-aware cleanup (preserves other sessions)

### With Algorithms

**Algorithm 9** (Test Quality Scoring):
- Applied when `--validate` flag present
- Scores generated test (0-100 scale)

**Algorithm 10** (InjectPlaywrightLogger):
- Core injection logic for `action=prep`
- Marker format, script block templates

---

## Error Handling

**Error**: Session already exists  
**Action**: Prompt to cleanup existing or use different session ID

**Error**: Log files not found  
**Action**: Prompt user to run application and interact first

**Error**: No server logs generated  
**Action**: Verify Serilog configuration, check appsettings.json

**Error**: Marker injection failed (file locked)  
**Action**: Close Visual Studio, retry injection

---

## Success Criteria

**Prep**:
- All files contain markers
- PlaywrightLogger.js exists
- Tracking file saved
- appsettings.json configured

**Generate**:
- Test file created with valid syntax
- Selectors extracted from client logs
- Assertions generated from server logs
- Quality score ≥60 (if --validate)

**Cleanup**:
- Zero markers remain in files
- Log files deleted
- Session archived
- No side effects on other sessions

---

## See Also

- `.github/governance/kds-rulebook.md` - Rule #2b (Test Reverse-Engineering Metadata)
- `.github/prompts/shared/kds-validation-algorithms.md` - Algorithm 10 (InjectPlaywrightLogger)
- `.github/prompts/test-generation.prompt.md` - Test generation engine
- `.github/prompts/cleanup-playwright-logging.prompt.md` - Cleanup automation

---

**Version**: 1.0.0  
**Created**: 2025-10-31  
**Maintainer**: KDS System
