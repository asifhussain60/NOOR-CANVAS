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
@workspace /test-prep Generate tests from session 212, focus on annotation sync
@workspace /test-prep Clean up all logging markers from last session
```

**Agent parses natural language** to determine action (prep/generate/cleanup) and extract parameters.

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

### 2. Generate Tests from Logs

**Invocation (Structured)**:
```
@workspace /test-prep action=generate session=212 key=hcp feature=asset-sharing
```

**Invocation (Natural Language)**:
```
@workspace /test-prep Generate tests from session 212 for host control panel asset sharing
@workspace /test-prep Create Playwright test from the logs, focus on annotation sync feature
```

**Actions**:
1. Read `playwright-interaction-logs.txt` (client clicks/inputs/navigation)
2. Read `playwright-server-logs.txt` (server events/SignalR/database)
3. Correlate by timestamp (client → server event matching)
4. Generate Playwright test with assertions
5. Apply quality scoring (Algorithm 9)
6. Save test to `Tests/UI/{key}-{feature}.spec.ts`

**Output**:
- Test file path
- Quality score (0-100)
- Coverage summary (interactions → assertions)
- Next command: Run test or cleanup

---

### 3. Cleanup Logging Infrastructure

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
- `generate` - Create Playwright test from logs
- `cleanup` - Remove all logging infrastructure

**Auto-detection**:
- Keywords: "prepare", "setup", "inject" → `prep`
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

**Step 2: Inject Logging Infrastructure**

**Algorithm**: See `.github/prompts/shared/kds-validation-algorithms.md` - Algorithm 10 (InjectPlaywrightLogger)

**For each file**:
1. Read component file
2. Generate unique marker: `{timestamp}-{componentName}`
3. Inject `data-playwright-log-marker` attribute into root div
4. Inject PlaywrightLogger.init() script block
5. Save modified file

**Step 3: Configure Backend Logging**

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

**Step 4: Verify PlaywrightLogger.js Exists**

**File**: `SPA/NoorCanvas/wwwroot/js/PlaywrightLogger.js`

**Create if missing**: Use Algorithm 10 specification

**Step 5: Save Tracking File**

**File**: `.github/key-data-streams/test-prep/sessions/{session}/injected-files.json`

**Format**:
```json
{
  "session": "212",
  "timestamp": "2025-10-31T14:30:22.123Z",
  "files": [
    {
      "path": "SPA/NoorCanvas/Components/HostControlPanel.razor",
      "marker": "20251031143022-HostControlPanel",
      "linesModified": [45, 2150]
    }
  ],
  "status": "prepped"
}
```

**Step 6: Output Instructions**

**Format** (≤15 bullets):

**🎯 Test Prep Complete**

**Session**: `{session}`  
**Files Prepped**: {count} components  
**Tracking File**: `.github/key-data-streams/test-prep/sessions/{session}/injected-files.json`

**📋 Next Steps**:

1. **Run Application** (headed mode):
   ```powershell
   dotnet run --project SPA/NoorCanvas
   ```

2. **Perform Manual Testing** (5-10 minutes):
   - Navigate to prepped components
   - Click buttons, fill forms, submit data
   - Trigger SignalR events, database operations
   - Cover all test scenarios

3. **Verify Logs Generated**:
   - Client logs: `playwright-interaction-logs.txt`
   - Server logs: `playwright-server-logs.txt`

4. **Generate Tests**:
   ```
   @workspace /test-prep action=generate session={session} key={key} feature={feature}
   ```

**⚡ Options**

**A.** Start manual testing now  
**B.** Review injected markers first  
**C.** Modify session configuration  
**D.** Cancel and cleanup

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

**Template**:
```typescript
import { test, expect } from '@playwright/test';

test.describe('{key} - {feature}', () => {
  
  test.beforeEach(async ({ page }) => {
    // Setup from session context
    await page.goto('/host/control-panel/212');
  });
  
  test('{feature} - {interaction description}', async ({ page }) => {
    // Generated from client logs
    await page.getByTestId('share-asset-btn').click();
    
    // Generated from server logs (assertions)
    await expect(page.locator('.asset-shared')).toContainText('ABC123');
    await expect(page.locator('.asset-type')).toContainText('Image');
  });
  
});
```

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

**Step 1: Load Session Context**

**Read**: `.github/key-data-streams/test-prep/sessions/{session}/injected-files.json`

**Step 2: Remove Markers from Files**

**For each file**:
1. Read current file content
2. Remove `data-playwright-log-marker` attributes
3. Remove PlaywrightLogger.init() script blocks
4. Verify no markers remain (regex scan)
5. Save cleaned file

**Step 3: Delete Log Files**

**Files to delete**:
- `playwright-interaction-logs.txt`
- `playwright-server-logs.txt`

**Step 4: Archive Session**

**Move**: `.github/key-data-streams/test-prep/sessions/{session}/` → `.github/key-data-streams/test-prep/_ARCHIVE/session-{timestamp}/`

**Step 5: Output Summary**

**Format** (≤10 bullets):

**🧹 Cleanup Complete**

**Session**: `{session}`  
**Files Cleaned**: {count} components  
**Markers Removed**: {count} total  
**Logs Deleted**: 2 files

**📂 Archive**: `.github/key-data-streams/test-prep/_ARCHIVE/session-{timestamp}/`

**⚡ Status**: Ready for new test prep session

---

## Integration Points

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
