# KDS Governance Rulebook
**Version:** 1.3.1 | **Status:** CANONICAL SOURCE OF TRUTH | **Date:** 2025-10-31

---

## ⚡ Quick Reference

**Core Principles:**
- **Governance First** - All `.github` changes through kds.prompt.md gatekeeper
- **Document First** - Update KDS files before code, docs commit before implementation
- **Test Metadata First** - UI/API files include PLAYWRIGHT TEST METADATA for reverse-engineering (Rule #2b)
- **Honest Handoffs** - Agents use JSON + Next Command + HALT (no auto-execution)
- **Test-Driven** - Create tests FIRST (red-green-refactor), prefer headless mode
- **Holistic Regeneration** - Delete & recreate files (no partial edits to prevent duplication)

**Output Quality:**
- **Concise Format** - No code in chat, 3-line bullets max, letter options in ALL CAPS
- **Key Visibility** - Display active key in all headers, phase output, and commands
- **Per-Task Handoffs** - Every task gets dedicated JSON with all parameters pre-populated

**Workflow Standards:**
- **Auto-Chain Defaults** - Tasks chain by default, phases need user approval (unless E2E mode)
- **Phase Isolation** - New chat window per phase when autoChain=false (better performance)
- **Plan Conflicts** - Load existing plan, analyze conflicts before routing to existing keys
- **Test Registry** - Central index (`.github/tests/`), reuse before creating new tests

**Orchestration:**
- **Playwright Pattern** - Dotnet orchestration scripts only (Start-Job → dotnet run → Test → Stop-Job)
- **KDS Cleanup** - Review mode detects backup files, archives (not deletes) with manifest

**Enforcement:**
- **14 Rules** - Validated before output (Rule #1-14, includes #2b sub-rule), each with validation function
- **Step -1** - All prompts include governance enforcement (except kds.prompt.md itself)
- **Dual Rulebook** - JSON (machine-readable) + MD (human-readable), always synced
- **Test Metadata** - ValidateTestMetadata() scans UI/API files for PLAYWRIGHT TEST METADATA blocks

---

## 📖 Purpose

This document consolidates **ALL governance rules** for the KDS (Key Data Streams) system and GitHub Copilot workspace. It serves as the **single authoritative source** for:

- MANDATORY operating rules (all prompts must follow)
- Agentic execution rules (KDS workflow standards)
- Handoff protocol standards (JSON schemas and workflows)
- Enforcement mechanisms (validation, gatekeeper procedures)

**Replaces/Supersedes:**
- `.github/MANDATORY.md` (now references this rulebook for extended documentation)
- Scattered rules in `kds.plan.md`, `kds-handoff-protocol.md`
- Implicit governance patterns in individual prompts

**Dual Format:**
- **This file (kds-rulebook.md)**: Human-readable with examples, rationale, anti-patterns
- **Companion (kds-rulebook.json)**: Machine-readable schemas for automated validation

---

## 🏛️ Core Principles

### Principle 1: Governance Before Execution
**All `.github` modifications must pass through KDS gatekeeper (`kds.prompt.md`) for compatibility analysis.**

**Rationale:** Prevents rule conflicts, maintains architectural coherence, protects against regressions.

### Principle 2: Document First, Respond Later
**All KDS files must be updated/created BEFORE sending user-facing output.**

**Rationale:** Ensures knowledge preservation even if session fails; enables recovery and continuity.

### Principle 3: Test-Driven Development
**Every implementation task must have a corresponding test created FIRST (red-green-refactor).**

**Rationale:** Validates acceptance criteria, prevents feature drift, creates regression safety net.

### Principle 4: Honest Handoffs
**Agents cannot execute other agents. All handoffs require explicit user invocation.**

**Rationale:** Maintains transparency, user control, debuggability; prevents autonomous agent chains.

### Principle 5: Holistic Regeneration
**When updating plans or major docs, DELETE and RECREATE entire file (no partial edits).**

**Rationale:** Prevents duplicate sections, conflicting instructions, architectural inconsistencies.

---

## 📋 MANDATORY Rules (All Prompts)

These rules apply to **EVERY prompt** in `.github/prompts/*.prompt.md` without exception.

### Rule #1: Concise Output Format

**Statement:**  
User-facing responses MUST:
1. **NEVER include code blocks or pseudocode** (only architectural descriptions)
2. Use **max 3 lines per bullet point**
3. Use **letter-based options (A, B, C)** with recommended option in **ALL CAPS**
4. Follow **prompt-specific structure** (plan uses Phase→Task, ask uses 🧠/📌/📊)

**Rationale:**  
- Code in chat violates separation of concerns (code belongs in files, not output)
- Concise bullets improve readability, reduce cognitive load
- Letter options with emphasis improve UX consistency

**Enforcement:**
- Automated: grep_search for code blocks in Output Format sections
- Manual: Review user-facing templates for compliance

**Examples:**

✅ **COMPLIANT:**
```markdown
## 📌 Next Steps

**A. EXECUTE PHASE 1** (recommended - create test first)
   Creates Playwright test with acceptance criteria validation.
   Command: `@workspace /test-generation #file:handoffs/phase-1-test.json`

**B. Review Plan Details**
   Opens full plan document for architecture review.
```

❌ **NON-COMPLIANT:**
```markdown
## Next Steps

Here's the code to execute Phase 1:

```typescript
async function executePhase1() {
  await createTest();
  await runTest();
}
```

Run this command: `@workspace /test-generation key=kds phase=1`
```

**Anti-Patterns:**
- Including C#/TypeScript/PowerShell code snippets in user output
- Multi-paragraph bullets (exceeds 3-line limit)
- Lowercase letter options without emphasis (`a. option` instead of `**A. OPTION**`)

**Special Exceptions:**
- `plan.prompt.md` may use up to 40 bullets for phase/task breakdown (structured output needs detail)
- Algorithm documentation in shared/ folder may include pseudocode for clarity (not user-facing)

**Validation Function:** `ValidateConciseOutputFormat()`

---

### Rule #2: Document First

**Statement:**  
Update KDS files BEFORE code changes. Documentation commits must precede implementation commits.

**Workflow:**
1. **Update plan.md** with new phase/task descriptions
2. **Append to work-log.md** with session entry
2a. **Update KDS documentation** (if modifying governance, prompts, or rules)
2b. **Add test reverse-engineering metadata** (if creating/modifying UI components, controllers, or SignalR hubs)
3. **Create handoff JSONs** for next tasks
4. **Commit documentation**: `docs(key): Add Phase N plan`
5. **Implement code changes**
6. **Commit implementation**: `feat(key): Implement Phase N Task M`

**Rationale:**
- Knowledge preserved even if session fails mid-implementation
- Enables recovery and continuity across sessions
- Creates audit trail for decisions and architecture
- Test metadata enables automated Playwright test generation from existing code

**Enforcement:**
- `plan.prompt.md` Step 5.5: Blocks output until artifacts exist (plan.md, work-log.md, handoffs/)
- `task.prompt.md` Step 8.25: Verifies work-log.md timestamp updated within 60s
- `todo.prompt.md`: Verifies file size increased (append occurred)
- `task.prompt.md` Step 6.5: Generates test metadata for UI/API code
- **NEW**: `kds.prompt.md` (Review Mode): Validates commits follow docs→code sequence
- **NEW**: Pre-commit git hook (optional): Blocks implementation commits without preceding docs commit

**Commit Sequence Validation:**
```
FUNCTION ValidateDocumentFirst(commitHistory):
  
  lastDocCommit = FindLastCommit(commitHistory, pattern="docs(")
  lastFeatCommit = FindLastCommit(commitHistory, pattern="feat(|fix(|refactor(")
  
  IF lastFeatCommit.timestamp < lastDocCommit.timestamp THEN
    RETURN {
      valid: false,
      violation: "Implementation commit without preceding documentation commit",
      lastDocCommit: lastDocCommit.sha,
      lastFeatCommit: lastFeatCommit.sha,
      recommendation: "Create docs commit before implementation"
    }
  END IF
  
  RETURN { valid: true }
  
END FUNCTION
```

**Exception Handling:**
- Minor bug fixes (fix commits) MAY skip docs update if no architectural impact
- Typo corrections, formatting changes exempt from rule
- Emergency hotfixes require retroactive documentation within 24 hours

**Examples:**

✅ **COMPLIANT WORKFLOW:**
```
Session 1:
1. Create plan.md with Phase 1 architecture  [docs(kds): Add Phase 1 plan]
2. Append work-log.md with session entry     [docs(kds): Session 5 entry]
3. Create handoffs/phase-1-test.json         [docs(kds): Add Phase 1 handoffs]
4. Implement enforcement gate                [feat(kds): Add Step -1 to prompts]
```

❌ **NON-COMPLIANT WORKFLOW:**
```
Session 1:
1. Implement enforcement gate                [feat(kds): Add enforcement]
2. (Forget to update plan.md - session ends - knowledge lost)
```

**Anti-Patterns:**
- Implementing code first, documenting later (or never)
- Committing code and docs in same commit (violates commit ordering)
- Partial documentation (plan updated but work-log forgotten)

**Validation Function:** `ValidateDocumentFirst()`

---

#### Rule #2b: Test Reverse-Engineering Metadata (Sub-Rule)

**Statement:**  
All Razor components, controllers, and SignalR hubs MUST include:
1. Structured PLAYWRIGHT TEST METADATA comments with API routes, database connections, test data, and selectors
2. **UI Interaction Logging** for runtime click tracking and element identification (headed Playwright test development)

**When to Apply:**
- Creating new UI components (`.razor` files)
- Creating/modifying API controllers (`Controllers/*.cs`)
- Creating/modifying SignalR hubs (`Hubs/*.cs`)
- Any file that handles HTTP requests or database operations

**Metadata Structure:**

```csharp
// ============================================================================
// PLAYWRIGHT TEST METADATA
// ============================================================================
// Component: {component-name}
// Key: {kds-key}
// Test Scenarios:
//   1. {scenario-1-description}
//   2. {scenario-2-description}
//   3. {scenario-3-description}
//
// API Routes:
//   - {METHOD} {endpoint} → {stored-procedure-or-linq} ({database})
//   - {METHOD} {endpoint} → {stored-procedure-or-linq} ({database})
//
// Database Connections:
//   - {DbContextName} ({database-name}) - {tables-accessed}
//
// Test Data (Session {session-id}):
//   - {data-element}: {value}
//   - {data-element}: {value}
//
// SignalR Hubs (if applicable):
//   - {endpoint} → {HubName} ({connection-groups})
//
// Expected Flow:
//   1. {step-1}
//   2. {step-2}
//   3. {step-3}
//
// Playwright Selectors:
//   - [data-testid="{selector-1}"]
//   - [data-testid="{selector-2}"]
//
// UI Interaction Logging (Headed Test Development):
//   - Click Tracking: ENABLED (logs all @onclick, button, link clicks)
//   - Element Identification: data-testid + CSS selectors logged
//   - Interaction Flow: Sequence of user actions captured
//   - Console Output Format: [PLAYWRIGHT-LOG] {timestamp} | {action} | {selector} | {element-type}
//   - Log Marker: data-playwright-log-marker="{timestamp}-{component-name}" (unique per session)
//   - Cleanup Triggers: Manual request OR post-test-generation (automatic)
//   - Cleanup Algorithm: Remove all data-playwright-log-marker attributes + PlaywrightLogger script tags
//
// Related Files:
//   - {test-file-path} ({test-status: existing/planned})
//   - {documentation-path}
// ============================================================================
```

**Example (HostControlPanel.razor):**

```csharp
// ============================================================================
// PLAYWRIGHT TEST METADATA
// ============================================================================
// Component: Host-HostControlPanel.razor
// Key: host-control-panel
// Test Scenarios:
//   1. Load control panel with valid session token
//   2. Verify dropdown cascading (Album → Category → Session)
//   3. Validate session state persistence
//
// API Routes:
//   - GET /api/host/albums → dbo.GetAllGroups (KSESSIONS)
//   - GET /api/host/categories/{albumId} → dbo.GetCategoriesForGroup (KSESSIONS)
//   - GET /api/host/sessions/{categoryId} → LINQ to dbo.Sessions (KSESSIONS)
//   - POST /api/host/validate-token → canvas.Sessions lookup (canvas + KSESSIONS join)
//
// Database Connections:
//   - KSessionsDbContext (KSESSIONS) - Albums, Categories, Sessions tables
//   - CanvasDbContext (canvas) - Sessions table (token validation)
//
// Test Data (Session 212):
//   - Host Token: KJAHA99L
//   - Participant Token: PQ9N5YWW
//   - Album ID: 1 (Group 1)
//   - Category ID: 2 (Category for Group 1)
//   - Session ID: 212 (Peter Parker session)
//
// SignalR Hubs:
//   - Not applicable (no SignalR in this component)
//
// Expected Flow:
//   1. Navigate to /host/control-panel
//   2. Load albums (API call + dropdown population)
//   3. Select album → trigger categories load
//   4. Select category → trigger sessions load
//   5. Select session → validate token → persist state
//
// Playwright Selectors:
//   - [data-testid="album-dropdown"]
//   - [data-testid="category-dropdown"]
//   - [data-testid="session-dropdown"]
//   - [data-testid="session-title"]
//
// Related Files:
//   - Tests/UI/host-authentication-flow-e2e.spec.ts (existing)
//   - Tests/UI/cascading-dropdowns.spec.ts (existing)
//   - .github/instructions/Links/PlaywrightQuickRef.md (test data reference)
// ============================================================================
```

**Rationale:**
- **Reverse-Engineering**: Enables automated Playwright test generation from production code
- **Test Data Centralization**: Session 212 becomes canonical reference (documented in PlaywrightQuickRef.md)
- **API Discovery**: Developers can quickly find all endpoints a component uses
- **Database Mapping**: Clear connection between UI → API → Database
- **Selector Consistency**: Enforces data-testid usage for stable test selectors
- **UI Interaction Logging**: Runtime click tracking enables headed Playwright test creation from live user sessions

**Implementation Requirements:**

### A. Static Metadata (documentation in code comments)
- PLAYWRIGHT TEST METADATA block at top of file
- All required fields populated (Component, Key, Test Scenarios, Expected Flow, Selectors)
- Session 212 test data referenced

### B. UI Interaction Logging Infrastructure (NEW)

**Required JavaScript Implementation:**

```javascript
// Add to component's OnAfterRenderAsync or in <script> section
// IMPORTANT: This script is tagged with data-playwright-log-marker for cleanup after test generation
window.PlaywrightLogger = {
    enabled: true, // Toggle via appsettings.json or environment variable
    
    init: function() {
        if (!this.enabled) return;
        
        // Global click listener
        document.addEventListener('click', (e) => {
            const target = e.target;
            const testId = target.getAttribute('data-testid') || 
                          target.closest('[data-testid]')?.getAttribute('data-testid');
            const selector = testId ? `[data-testid="${testId}"]` : this.getSelector(target);
            const elementType = target.tagName.toLowerCase();
            const elementText = target.textContent?.trim().substring(0, 50);
            
            console.log(`[PLAYWRIGHT-LOG] ${new Date().toISOString()} | CLICK | ${selector} | ${elementType} | "${elementText}"`);
        }, true);
        
        // Input change listener
        document.addEventListener('change', (e) => {
            const target = e.target;
            if (target.matches('input, select, textarea')) {
                const testId = target.getAttribute('data-testid');
                const selector = testId ? `[data-testid="${testId}"]` : this.getSelector(target);
                const value = target.type === 'password' ? '[REDACTED]' : target.value;
                
                console.log(`[PLAYWRIGHT-LOG] ${new Date().toISOString()} | INPUT | ${selector} | ${target.tagName.toLowerCase()} | value="${value}"`);
            }
        }, true);
        
        console.log('[PLAYWRIGHT-LOG] UI Interaction Logging ENABLED - headed test development mode');
    },
    
    getSelector: function(element) {
        // Generate CSS selector path
        const path = [];
        while (element && element.nodeType === Node.ELEMENT_NODE) {
            let selector = element.nodeName.toLowerCase();
            if (element.id) {
                selector += '#' + element.id;
                path.unshift(selector);
                break;
            } else {
                let sibling = element;
                let nth = 1;
                while (sibling = sibling.previousElementSibling) {
                    if (sibling.nodeName.toLowerCase() === selector) nth++;
                }
                if (nth !== 1) selector += `:nth-of-type(${nth})`;
            }
            path.unshift(selector);
            element = element.parentNode;
        }
        return path.join(' > ');
    }
};

// Auto-initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    window.PlaywrightLogger.init();
});
```

**Log Marker Pattern (for cleanup tracking):**

```cshtml
@* Razor component with PlaywrightLogger injection *@
@* data-playwright-log-marker format: {timestamp}-{component-name} *@
@* Example: data-playwright-log-marker="20251031143025-HostControlPanel" *@

<div data-playwright-log-marker="@($"{DateTime.UtcNow:yyyyMMddHHmmss}-{ComponentName}")">
  <!-- Component content -->
</div>

<script data-playwright-log-marker="@($"{DateTime.UtcNow:yyyyMMddHHmmss}-{ComponentName}")">
  // PlaywrightLogger initialization code
  window.PlaywrightLogger.init();
</script>
```

**Cleanup Algorithm (global cleanup of all logging infrastructure):**

```
FUNCTION CleanupPlaywrightLogging(workspaceRoot):
  
  # Step 1: Find all files with logging markers
  files = FindFiles(workspaceRoot, "**/*.{razor,cshtml,html}")
  
  # Step 2: Remove data-playwright-log-marker attributes
  FOR EACH file IN files:
    content = ReadFile(file)
    
    # Remove marker attributes from HTML elements
    content = RemovePattern(content, 'data-playwright-log-marker="[^"]*"')
    
    # Remove entire <script> blocks with markers
    content = RemovePattern(content, '<script[^>]*data-playwright-log-marker[^>]*>.*?</script>', MULTILINE)
    
    # Remove PlaywrightLogger initialization in @code blocks
    IF content.Contains("window.PlaywrightLogger") THEN
      content = RemoveCodeBlock(content, "JSRuntime.InvokeVoidAsync.*PlaywrightLogger")
    END IF
    
    WriteFile(file, content)
    Log("Cleaned: " + file)
  END FOR
  
  # Step 3: Remove appsettings.json PlaywrightLogging section
  appsettingsPath = Path.Combine(workspaceRoot, "SPA/NoorCanvas/appsettings.json")
  IF FileExists(appsettingsPath) THEN
    config = ReadJson(appsettingsPath)
    IF config.Contains("PlaywrightLogging") THEN
      config.Remove("PlaywrightLogging")
      WriteJson(appsettingsPath, config)
      Log("Cleaned: appsettings.json (PlaywrightLogging section removed)")
    END IF
  END IF
  
  # Step 4: Generate cleanup report
  RETURN {
    filesProcessed: files.Count,
    markersRemoved: CountRemovals,
    scriptsRemoved: CountScriptRemovals,
    configCleaned: configRemoved
  }
  
END FUNCTION
```

**Cleanup Trigger Modes:**

1. **Manual Request (user-initiated):**
   ```
   @workspace /cleanup-playwright-logging
   ```
   - User explicitly requests cleanup after test generation complete
   - Runs global cleanup algorithm across entire workspace
   - Generates cleanup report with file manifest

2. **Post-Test-Generation (automatic):**
   ```
   @workspace /test-generation #file:handoffs/phase-2-test.json
   → Test generated successfully
   → Automatically trigger CleanupPlaywrightLogging()
   → Display cleanup report
   ```
   - test-generation.prompt.md automatically runs cleanup after test file created
   - Ensures logging infrastructure removed after served its purpose
   - Prevents logging code from being committed to production

**Configuration (appsettings.json):**

```json
{
  "PlaywrightLogging": {
    "Enabled": true,
    "LogLevel": "Debug",
    "OutputFormat": "Console", // or "File", "Database"
    "RedactSensitiveData": true
  }
}
```

**Usage in Razor Components:**

```cshtml
@* Add unique log marker to component root element *@
<div data-playwright-log-marker="@($"{DateTime.UtcNow:yyyyMMddHHmmss}-HostControlPanel")">
  <!-- Component content -->
</div>

@* Add log marker to script tag for cleanup tracking *@
<script data-playwright-log-marker="@($"{DateTime.UtcNow:yyyyMMddHHmmss}-HostControlPanel")">
  // PlaywrightLogger initialization
  if (window.PlaywrightLogger) {
    window.PlaywrightLogger.init();
  }
</script>

@code {
    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (firstRender)
        {
            // Alternative: Initialize via JSRuntime (also needs marker for cleanup)
            await JSRuntime.InvokeVoidAsync("eval", @"
                if (window.PlaywrightLogger) {
                    window.PlaywrightLogger.init();
                }
            ");
        }
    }
}
```

**Enforcement:**
- `task.prompt.md` Step 6.5: Auto-generates metadata when creating UI/API files
- `task.prompt.md` Step 6.6: Injects PlaywrightLogger JavaScript with unique log marker (timestamp-component format)
- `healthcheck.prompt.md`: Scans for missing metadata in testable files
- `test-generation.prompt.md` Step 1.5: Loads metadata before generating tests
- `test-generation.prompt.md` Step 1.6: Parses console logs to extract interaction flow for headed tests
- `test-generation.prompt.md` Step 9.5: Automatically runs CleanupPlaywrightLogging() after test file created
- `cleanup-playwright-logging.prompt.md`: Manual cleanup invocation with workspace-wide marker removal

### C. Test Generation from Interaction Logs (NEW)

**Workflow:**

1. **Enable Logging** (appsettings.json → PlaywrightLogging.Enabled = true)
2. **Run Application in Headed Mode** (manual or via `dotnet run`)
3. **Perform User Interactions** (click buttons, fill forms, navigate)
4. **Copy Console Logs** (all lines starting with `[PLAYWRIGHT-LOG]`)
5. **Generate Test** (invoke test-generation.prompt.md with logs as input)

**Test Generation Algorithm:**

```
FUNCTION GeneratePlaywrightTestFromLogs(consoleLogs, componentMetadata):
  
  # Step 1: Parse console logs into interaction sequence
  interactions = []
  FOR EACH line IN consoleLogs:
    IF line.StartsWith("[PLAYWRIGHT-LOG]") THEN
      parts = ParseLogLine(line) # {timestamp, action, selector, elementType, value}
      interactions.Add(parts)
    END IF
  END FOR
  
  # Step 2: Group interactions by page/navigation
  pageGroups = GroupByNavigation(interactions) # Detect URL changes
  
  # Step 3: Generate test structure
  test = "import { test, expect } from '@playwright/test';\n\n"
  test += "test.describe('${componentMetadata.Component} - Recorded User Flow', () => {\n"
  test += "  test('should complete user interaction flow - Session ${componentMetadata.SessionId}', async ({ page }) => {\n"
  test += "    // Generated from console logs - ${new Date().toISOString()}\n\n"
  
  # Step 4: Add navigation
  test += "    await page.goto('${GetInitialURL(pageGroups[0])}');\n\n"
  
  # Step 5: Convert interactions to Playwright commands
  FOR EACH interaction IN interactions:
    IF interaction.action == "CLICK" THEN
      test += "    await page.locator('${interaction.selector}').click();\n"
      test += "    // Clicked: ${interaction.elementType} - \"${interaction.text}\"\n\n"
      
    ELSE IF interaction.action == "INPUT" THEN
      test += "    await page.locator('${interaction.selector}').fill('${interaction.value}');\n"
      test += "    // Filled: ${interaction.elementType}\n\n"
      
    ELSE IF interaction.action == "SELECT" THEN
      test += "    await page.locator('${interaction.selector}').selectOption('${interaction.value}');\n\n"
    END IF
  END FOR
  
  # Step 6: Add assertions from metadata Expected Flow
  FOR EACH expectedOutcome IN componentMetadata.ExpectedFlow:
    test += "    // Assert: ${expectedOutcome}\n"
    test += "    await expect(page.locator('${GetSelectorForAssertion(expectedOutcome)}')).toBeVisible();\n\n"
  END FOR
  
  test += "  });\n"
  test += "});\n"
  
  RETURN test
END FUNCTION
```

**Example Generated Test (from logs):**

```typescript
// AUTO-GENERATED from console logs - 2025-10-31T14:23:45Z
// Component: Host-HostControlPanel.razor
// Test Data: Session 212 (KJAHA99L)

import { test, expect } from '@playwright/test';

test.describe('Host-HostControlPanel - Recorded User Flow', () => {
  test('should complete cascading dropdown selection - Session 212', async ({ page }) => {
    // Navigate to host control panel
    await page.goto('/host/control-panel/KJAHA99L');
    
    // [PLAYWRIGHT-LOG] 2025-10-31T14:23:48Z | CLICK | [data-testid="album-dropdown"] | select | ""
    await page.locator('[data-testid="album-dropdown"]').click();
    // Clicked: select - ""
    
    // [PLAYWRIGHT-LOG] 2025-10-31T14:23:50Z | INPUT | [data-testid="album-dropdown"] | select | value="1"
    await page.locator('[data-testid="album-dropdown"]').selectOption('1');
    // Filled: select - Album: "Group 1"
    
    // Wait for categories to load (API call triggered)
    await page.waitForSelector('[data-testid="category-dropdown"]:not([disabled])');
    
    // [PLAYWRIGHT-LOG] 2025-10-31T14:23:52Z | CLICK | [data-testid="category-dropdown"] | select | ""
    await page.locator('[data-testid="category-dropdown"]').click();
    
    // [PLAYWRIGHT-LOG] 2025-10-31T14:23:54Z | INPUT | [data-testid="category-dropdown"] | select | value="2"
    await page.locator('[data-testid="category-dropdown"]').selectOption('2');
    
    // Wait for sessions to load
    await page.waitForSelector('[data-testid="session-dropdown"]:not([disabled])');
    
    // [PLAYWRIGHT-LOG] 2025-10-31T14:23:56Z | CLICK | [data-testid="session-dropdown"] | select | ""
    await page.locator('[data-testid="session-dropdown"]').click();
    
    // [PLAYWRIGHT-LOG] 2025-10-31T14:23:58Z | INPUT | [data-testid="session-dropdown"] | select | value="212"
    await page.locator('[data-testid="session-dropdown"]').selectOption('212');
    
    // Assertions from PLAYWRIGHT TEST METADATA Expected Flow
    // Assert: Session details display (Session 212 - "Need For Messengers")
    await expect(page.locator('[data-testid="session-title"]')).toHaveText('Need For Messengers');
    await expect(page.locator('[data-testid="session-title"]')).toBeVisible();
  });
});
```

**Trigger Workflow:**

1. **Automatic (during implementation):**
   - `@workspace /task` detects UI/API file creation
   - Automatically generates PLAYWRIGHT TEST METADATA block
   - Inserts at top of file (after usings/imports)

2. **Manual (reverse-engineering existing code):**
   - `@workspace /route key=reverse-engineer request="Add test metadata to {file}"`
   - Scans file for API routes, database operations, SignalR hubs
   - Extracts Session 212 test data from PlaywrightQuickRef.md
   - Generates metadata block and inserts

3. **Validation (healthcheck):**
   - `@workspace /healthcheck` scans codebase
   - Identifies UI/API files without metadata
   - Reports missing metadata with suggested fix commands

**Examples:**

✅ **COMPLIANT (auto-generated during task):**
```
Task: Create TranscriptCanvas.razor
1. Generate component code
2. Auto-detect API calls (/api/participant/validate-token)
3. Auto-detect SignalR usage (/hubs/canvas)
4. Load Session 212 test data from PlaywrightQuickRef.md
5. Generate PLAYWRIGHT TEST METADATA block
6. Insert at top of TranscriptCanvas.razor
```

❌ **NON-COMPLIANT (no metadata):**
```csharp
@page "/participant/transcript"
@inject HttpClient Http

<div>
  <input @bind="questionText" />
  <button @onclick="SubmitQuestion">Submit</button>
</div>

@code {
  // NO PLAYWRIGHT TEST METADATA - violates Rule #2b
  private async Task SubmitQuestion() { ... }
}
```

**Anti-Patterns:**
- Creating UI components without test metadata (defeats reverse-engineering)
- Outdated test data (metadata references Session 100, but Session 212 is canonical)
- Missing selectors (no data-testid attributes documented)
- Incomplete API routes (only lists GET endpoints, forgets POST/PUT/DELETE)

**Validation Function:** `ValidateTestMetadata()`

**Validation Algorithm:**

```
FUNCTION ValidateTestMetadata(filePath):
  
  # Step 1: Determine if file is testable
  testableExtensions = [".razor", "Controller.cs", "Hub.cs"]
  IF NOT filePath.EndsWith(testableExtensions) THEN
    RETURN { violation: false, reason: "Not a testable file type" }
  END IF
  
  # Step 2: Read file contents
  fileContents = ReadFile(filePath)
  
  # Step 3: Check for PLAYWRIGHT TEST METADATA block
  IF NOT fileContents.Contains("PLAYWRIGHT TEST METADATA") THEN
    
    # Step 3a: Scan for test-worthy code patterns
    hasApiCalls = fileContents.Contains("HttpClient") OR fileContents.Contains("[HttpGet]")
    hasDatabase = fileContents.Contains("DbContext") OR fileContents.Contains("LINQ")
    hasSignalR = fileContents.Contains("Hub") OR fileContents.Contains("HubConnection")
    
    IF hasApiCalls OR hasDatabase OR hasSignalR THEN
      RETURN {
        violation: true,
        type: "MISSING_METADATA",
        filePath: filePath,
        reason: "File contains testable code but no PLAYWRIGHT TEST METADATA block",
        suggestedFix: "@workspace /route key=reverse-engineer request='Add test metadata to {filePath}'"
      }
    ELSE
      RETURN { violation: false, reason: "No testable code patterns detected" }
    END IF
  END IF
  
  # Step 4: Validate metadata completeness
  metadataBlock = ExtractBlock(fileContents, "PLAYWRIGHT TEST METADATA")
  
  requiredFields = [
    "Component:",
    "Key:",
    "Test Scenarios:",
    "Expected Flow:",
    "Playwright Selectors:",
    "Related Files:"
  ]
  
  missingFields = []
  FOR EACH field IN requiredFields:
    IF NOT metadataBlock.Contains(field) THEN
      missingFields.Add(field)
    END IF
  END FOR
  
  IF missingFields.Count > 0 THEN
    RETURN {
      violation: true,
      type: "INCOMPLETE_METADATA",
      filePath: filePath,
      missingFields: missingFields,
      reason: "PLAYWRIGHT TEST METADATA block exists but missing required fields"
    }
  END IF
  
  # Step 5: Validate test data references Session 212
  IF metadataBlock.Contains("Test Data") THEN
    IF NOT metadataBlock.Contains("Session 212") THEN
      WARN("Test data should reference Session 212 (canonical test session)")
    END IF
  END IF
  
  RETURN { violation: false }
  
END FUNCTION
```

**Related Documentation:**
- `.github/instructions/Links/PlaywrightQuickRef.md` - Session 212 canonical test data
- `.github/prompts/task.prompt.md` - Step 6.5 (auto-generation logic)
- `.github/prompts/test-generation.prompt.md` - Step 1.5 (metadata loading)
- `.github/prompts/healthcheck.prompt.md` - Metadata completeness scan

---

### Rule #3: Playwright Orchestration

**Statement:**  
Use dotnet orchestration scripts for Playwright tests. NEVER use nested PowerShell processes or deprecated standalone mode.

**Approved Pattern:**
```powershell
# Orchestrator script (e.g., run-transcript-canvas-visual-tests.ps1)
cd "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas"
Start-Job -ScriptBlock { dotnet run } | Out-Null
Start-Sleep -Seconds 15

cd "D:\PROJECTS\NOOR CANVAS\Tests\UI"
npx playwright test transcript-canvas-visual.spec.ts --headed

Stop-Job -Name Job1 -ErrorAction SilentlyContinue
```

**Rationale:**
- Dotnet orchestration ensures app lifecycle managed by single script
- Prevents orphaned processes (app running after test fails)
- Enables CI/CD integration with proper cleanup

**Enforcement:**
- test-generation.prompt.md creates orchestrator script per test
- Validation scans for deprecated `Start-Process` patterns

**Examples:**

✅ **COMPLIANT:**
```markdown
Test: transcript-canvas-visual.spec.ts
Orchestrator: Scripts/run-transcript-canvas-visual-tests.ps1
Pattern: Start-Job → dotnet run → Sleep → Test → Stop-Job
```

❌ **NON-COMPLIANT:**
```powershell
# Standalone mode (no app lifecycle management)
npx playwright test my-test.spec.ts --headed
```

**Anti-Patterns:**
- Running Playwright tests without app orchestration
- Using nested PowerShell processes (`Start-Process powershell.exe`)
- Forgetting cleanup (app keeps running after test)

**Validation Function:** `ValidatePlaywrightOrchestration()`

---

## 🤖 Agentic Execution Rules (KDS Workflow)

These rules govern **how KDS agents execute planned work**.

### Rule #4: Per-Task Handoffs (One Handoff per Task)

**Statement:**  
Every task generates a dedicated handoff JSON file with all parameters pre-populated.

**Files:** `handoffs/phase-{N}-todo-{M}.json` (M = 1..N tasks in phase)

**Fields:**
- `key`: KDS key (e.g., "kds", "debug-panel")
- `phase`: Phase number (e.g., 1)
- `task`: Task ID (e.g., "1a", "2b")
- `description`: What this task accomplishes
- `files`: Array of files to create/modify
- `acceptanceCriteria`: Array of validation criteria (3-7 items)
- `autoChain`: Boolean (true = auto-continue to nextTask)
- `nextTask`: Next handoff file or "complete"
- `testFile`: Associated test file path

**Purpose:**
- Eliminates manual parameter construction errors
- Enables traceable handoff chain for debugging
- Supports E2E execution with autoChain

**Rationale:**
- Manual parameter entry prone to typos, missing fields
- JSON files serve as execution audit trail
- autoChain enables E2E mode without violating honest handoff (user approves chain upfront)

**Enforcement:**
- `plan.prompt.md` Step 4.25: Generates handoff JSONs for all tasks
- Handoffs saved to `.github/key-data-streams/{key}/handoffs/` before user approval

**Examples:**

✅ **COMPLIANT HANDOFF:**
```json
{
  "key": "kds-enforcement-gate",
  "phase": 1,
  "task": "1a",
  "description": "Add Step -1 governance enforcement to plan.prompt.md",
  "files": [".github/prompts/plan.prompt.md"],
  "acceptanceCriteria": [
    "Step -1 logic detects .github modification requests",
    "Enforcement message includes copy-paste @workspace /kds command",
    "No code blocks in enforcement message"
  ],
  "autoChain": true,
  "nextTask": "handoffs/phase-1-todo-2.json",
  "testFile": ".github/key-data-streams/kds/tests/enforcement-validation.spec.md"
}
```

❌ **NON-COMPLIANT (manual parameters):**
```markdown
Next Command:
@workspace /todo key=kds-enforcement phase=1 task=1a files="plan.prompt.md" acceptance="Add Step -1, Include message, No code" auto-chain=true next="phase-1-todo-2"
```

**Anti-Patterns:**
- Manual parameter strings (error-prone)
- Missing acceptanceCriteria (no validation criteria)
- Broken autoChain (nextTask points to non-existent file)

**Validation Function:** `ValidatePerTaskHandoffs()`

---

### Rule #5: TDD on Every Todo (Prefer Headless)

**Statement:**  
Every implementation task must have a corresponding test created FIRST (red-green-refactor workflow).

**Files:** `handoffs/phase-{N}-test.json`

**Fields (additional to base handoff):**
- `acceptanceCriteria`: What the test must validate
- `assertCriteria`: Boolean (true = test must assert all acceptance criteria)
- `mode`: "headless" (default) or "headed" (UI/visual only)

**Workflow:**
1. **Red**: Create failing test (assertions for acceptance criteria)
2. **Green**: Implement feature until test passes
3. **Refactor**: Clean up code while keeping test passing

**Rationale:**
- Tests define success criteria upfront (prevents scope creep)
- Red-green-refactor prevents premature optimization
- Headless mode faster for non-UI features

**Enforcement:**
- `plan.prompt.md` Phase structure: Task {N}a (test) → Task {N}b-x (impl) → Task {N}y (validate)
- `test-generation.prompt.md`: Requires acceptanceCriteria and generates assertions

**Examples:**

✅ **COMPLIANT TEST-FIRST:**
```markdown
Phase 1 Tasks:
- 1a: Create enforcement-validation test (RED)
- 1b: Add Step -1 to plan.prompt.md (GREEN)
- 1c: Add Step -1 to route.prompt.md (GREEN)
- 1d: Run enforcement-validation test (VALIDATE)
```

❌ **NON-COMPLIANT (implementation first):**
```markdown
Phase 1 Tasks:
- 1a: Add Step -1 to all prompts
- 1b: Create test to verify enforcement works
```

**Anti-Patterns:**
- Creating tests after implementation (defeats purpose)
- Using headed mode for non-UI features (slower, unnecessary)
- Skipping refactor step (leaves technical debt)

**Validation Function:** `ValidateTDDWorkflow()`

---

### Rule #6: Auto-Chain Defaults and Options

**Statement:**  
Tasks auto-chain by default (autoChain=true). Phases require user approval unless E2E mode selected.

**Task-Level Chaining:**
- `autoChain: true` → Automatically invokes nextTask after completion
- User approves **plan once**, tasks execute E2E within phase
- Stop points: Validate tasks (user reviews results)

**Phase-Level Approval:**
- **Option A**: Execute Phase by Phase (stop after each phase - RECOMMENDED)
- **Option B**: Execute All Phases E2E (auto-continue through all phases)

**Implementation:**
- todo.json includes "autoChain": true and "nextTask" pointer
- plan.prompt.md shows execution mode options (A vs B)

**Rationale:**
- Task-level chaining reduces friction (approve 1 plan vs N tasks)
- Phase-level checkpoints enable review and course correction
- E2E mode supports uninterrupted multi-phase execution

**Enforcement:**
- `plan.prompt.md` Step 6: Handoff logic includes E2E countdown (5s) or manual proceed
- JSON files control chaining behavior

**Examples:**

✅ **COMPLIANT AUTO-CHAIN:**
```json
{
  "task": "1a",
  "autoChain": true,
  "nextTask": "handoffs/phase-1-todo-2.json"
}
```

**User Experience:**
```
Phase 1 complete. Auto-continuing to Phase 2 in 5s... (Ctrl+C to stop)
```

❌ **NON-COMPLIANT (no chaining):**
```markdown
Phase 1 Task 1a complete.
Please manually run: @workspace /todo #file:handoffs/phase-1-todo-2.json
(User must manually invoke each task - poor UX)
```

**Anti-Patterns:**
- Forcing manual invocation for every task (defeats E2E purpose)
- Missing nextTask pointers (breaks chain)
- No Ctrl+C interrupt mechanism (user can't stop runaway execution)

**Validation Function:** `ValidateAutoChain()`

---

### Rule #7: Central Playwright Test Index (Global Reuse)

**Statement:**  
All tests registered in `.github/tests/playwright-index.json`. Prefer reusing existing tests before creating new ones.

**Path:** `.github/tests/playwright-index.json`

**Policy:** `reuseStrategy=prefer-index`

**Fields:**
- `testId`: Unique identifier (e.g., "phase-1-pilot-test")
- `key`: Associated KDS key
- `path`: File path to test
- `type`: "documentation" | "functional" | "visual"
- `description`: What the test validates
- `tags`: Searchable keywords
- `acceptanceCriteria`: Array of criteria
- `reusable`: Boolean (can other keys use this test?)
- `dependencies`: Array of required keys/files
- `estimatedDuration`: e.g., "30s"

**Purpose:**
- Prevent duplicate tests across keys
- Enforce test reuse and maintenance
- Enable test discovery by capability

**Rationale:**
- Duplication wastes time, creates maintenance burden
- Centralized index enables "find test for X" queries
- Reusable flag promotes test sharing

**Enforcement:**
- `test-generation.prompt.md`: Searches index before creating new test
- `plan.prompt.md`: Updates index when generating phase tests

**Examples:**

✅ **COMPLIANT INDEX ENTRY:**
```json
{
  "testId": "enforcement-validation",
  "key": "kds",
  "path": ".github/key-data-streams/kds/tests/enforcement-validation.spec.md",
  "type": "documentation",
  "description": "Validates Step -1 enforcement gate blocks .github modifications",
  "tags": ["governance", "enforcement", "kds"],
  "acceptanceCriteria": [
    "Agent halts when detecting .github modification request",
    "Enforcement message displayed with @workspace /kds command"
  ],
  "reusable": true,
  "dependencies": ["kds.prompt.md"],
  "estimatedDuration": "2min"
}
```

**Anti-Patterns:**
- Creating duplicate tests (not searching index first)
- Marking non-reusable tests reusable (creates confusion)
- Forgetting to update index (orphaned tests)

**Validation Function:** `ValidateTestIndexCompliance()`

---

### Rule #8: Holistic File Regeneration (No Partial Edits)

**Statement:**  
When updating plans or major docs, DELETE entire file and RECREATE from scratch (no partial edits).

**Problem:**  
Partial edits create duplicate sections, conflicting instructions, architectural inconsistencies.

**Solution:**

**Strategy A (plan.md):**  
Delete and recreate entire file when significant changes occur.

**Strategy B (work-log.md):**  
Use structured merge with deduplication (preserves session history).

**Implementation:**
- `plan.prompt.md` Step 4: Regenerates complete plan.md from scratch
- work-log uses append-with-dedup pattern (detect duplicate session entries, consolidate)

**Benefits:**
- Eliminates redundancy
- Maintains architectural coherence
- Prevents contradictory instructions

**Rationale:**
- Partial edits compound over sessions (redundancy accumulates)
- Full regeneration ensures single source of truth
- Work-log exception: history preservation trumps deduplication

**Enforcement:**
- `plan.prompt.md` Step 4: DELETE {key}.plan.md → REGENERATE with all phases
- Validation scans for duplicate sections (warning, not blocking)

**Examples:**

✅ **COMPLIANT REGENERATION:**
```markdown
Step 4: Regenerate Plan
1. Delete existing .github/key-data-streams/kds/kds.plan.md
2. Create new kds.plan.md with:
   - Updated Executive Summary
   - All 10 phases (no duplicates)
   - Acceptance criteria per phase
```

❌ **NON-COMPLIANT (partial edit):**
```markdown
Step 4: Update Plan
1. Append Phase 11 to existing plan.md
   (Now plan has 2 "Phase 1" sections - CONFLICT)
```

**Anti-Patterns:**
- Appending sections without checking for duplicates
- Editing sections in-place (old version remains elsewhere in file)
- Partial updates (Phase 1 updated, Phase 2-10 stale)

**Validation Function:** `ValidateHolisticRegeneration()`

---

### Rule #9: Plan Conflict Detection (Routing to Existing Keys)

**Statement:**  
When routing to existing key, LOAD existing plan and ANALYZE conflicts before proceeding.

**Trigger:** `route.prompt.md` detects existing plan file (`.github/key-data-streams/{key}/{key}.plan.md`)

**Process:**
1. **Load** existing plan.md (phases, tasks, architecture)
2. **Analyze** new user request for conflicts with existing plan
3. **If conflicts detected** → HALT and present resolution options:
   - **A. Merge** new request into existing plan (extend - use `todo`)
   - **B. Replace** existing plan (regenerate - use `plan` with override)
   - **C. Create new key** (separate work - generate new key)
   - **D. Review** existing plan first (cancel - show plan to user)

**Output:** Architectural coherence report showing conflicts

**Purpose:**
- Preserve plan integrity
- Prevent contradictory instructions
- Maintain traceability

**Rationale:**
- Multiple requests to same key create architectural conflicts
- Explicit conflict resolution prevents silent overwrites
- User decides merge vs replace (architectural decision)

**Enforcement:**
- `route.prompt.md` Step 0.5: After key consultation, before handoff
- Conflict report shows: overlapping phases, contradictory tasks, incompatible architecture

**Examples:**

✅ **COMPLIANT CONFLICT DETECTION:**
```markdown
## ⚠️ Plan Conflict Detected

**Existing Plan (key=kds):** 10-phase KDS overhaul, currently on Phase 2
**New Request:** "Rewrite all prompts from scratch"

**Conflicts:**
- Phases 2-9 already planned (rewrite would invalidate existing work)
- 4 handoff JSONs created (rewrite would break chains)

**Resolution Options:**

**A. MERGE INTO EXISTING PLAN** (recommended - extend Phase 10)
   Add rewrite as Phase 11, preserves completed work.

**B. Replace Existing Plan** (destructive - loses Phases 2-9)
   Regenerate plan with rewrite as primary goal.

**C. Create New Key** (isolate work - key=prompt-rewrite)
   Separate work stream, KDS plan untouched.

**D. Review Existing Plan First**
   Show kds.plan.md before deciding.
```

❌ **NON-COMPLIANT (silent overwrite):**
```markdown
Creating new plan for key=kds...
(Old plan silently overwritten - Phases 2-9 lost)
```

**Anti-Patterns:**
- Routing to plan without checking for existing plan.md
- Silently overwriting plans (no conflict analysis)
- No resolution options (user has no choice)

**Validation Function:** `ValidatePlanConflictDetection()`

---

### Rule #10: KDS Governance (All .github/KDS Changes via kds.prompt.md)

**Statement:**  
No direct modifications to `.github` or KDS files without governance review.

**Gatekeeper:** `kds.prompt.md` analyzes all requests for conflicts, regressions, rule violations

**Load Order:**
1. MANDATORY.md (baseline rules)
2. kds-handoff-protocol.md (handoff standards)
3. SelfAwareness.instructions.md (operating guardrails)
4. Active key context (existing plan.md, work-log.md)

**Enforcement:**
- Rejects changes that violate or nullify previous rules
- Requires compatibility reasoning (WHY change won't break existing work)
- Cascading impact analysis (what else breaks if this changes?)

**Invocation:**
```markdown
@workspace /kds request="[your change request here]"
```

**Workflow:**
1. User requests .github modification
2. Agent detects modification (Step -1 in all prompts)
3. Agent HALTS and redirects to `@workspace /kds`
4. kds.prompt.md loads context, analyzes compatibility
5. kds.prompt.md generates approval/rejection report
6. If approved: creates implementation handoff JSON
7. User executes handoff JSON

**Purpose:**
- Prevent rule conflicts (new rule contradicts existing rule)
- Protect against regressions (change breaks existing workflows)
- Maintain architectural coherence (all changes fit together)

**Rationale:**
- .github is high-impact (affects all prompts)
- Ungated changes create silent conflicts
- Governance ensures compatibility analysis

**Enforcement:**
- All prompts include Step -1: KDS Governance Enforcement
- kds.prompt.md is the ONLY prompt without Step -1 (it's the gatekeeper)

**Examples:**

✅ **COMPLIANT GOVERNANCE FLOW:**
```markdown
User: "Update plan.prompt.md to skip file verification"

Agent (plan.prompt.md Step -1):
⚠️ GOVERNANCE ENFORCEMENT
Please use: @workspace /kds request="Skip file verification in plan.prompt.md"

User: @workspace /kds request="Skip file verification in plan.prompt.md"

Agent (kds.prompt.md):
🔍 Compatibility Analysis
- CONFLICT: Violates Rule #2 (Document First)
- REGRESSION: Breaks 4 existing workflows
- VERDICT: ❌ REJECTED

Recommended Alternative:
- Make verification optional (add -skip-verification flag)
- Preserves safety by default, enables override
```

❌ **NON-COMPLIANT (direct modification):**
```markdown
User: "Update plan.prompt.md to skip file verification"

Agent (plan.prompt.md):
Updating plan.prompt.md...
(Rule #2 violated - no compatibility check - workflows broken)
```

**Anti-Patterns:**
- Modifying .github files without governance review
- Skipping compatibility analysis (no conflict detection)
- No cascading impact analysis (break related prompts)

**Validation Function:** `ValidateKDSGovernance()`

---

### Rule #11: Key Display in User Output (Visibility Protocol)

**Statement:**  
All user-facing output must display the active key for traceability.

**Implementation:**
- **Section Headers:** Include key in format `**Key: \`{key}\`**` (subtle, right-aligned or piped)
- **Phase/Task Output:** Show `Phase N (Key: {key})` in execution summaries
- **Next Command:** Include key in handoff commands
- **Work-Log Entries:** Always prefix with key

**Examples:**

✅ **COMPLIANT KEY DISPLAY:**
```markdown
## 🧠 Analysis | Key: `kds`

Phase 1 complete (Key: kds). Auto-continuing to Phase 2...

Next Command:
@workspace /test-generation #file:.github/key-data-streams/kds/handoffs/phase-2-test.json
```

❌ **NON-COMPLIANT (no key):**
```markdown
## Analysis

Phase 1 complete. Continuing to Phase 2...
(User loses context - which key am I working on?)
```

**Purpose:**
- Users never lose context of which work stream they're in
- Prevents key confusion during multi-key work
- Enables traceability in logs and transcripts

**Rationale:**
- Multi-key sessions common (user switches between features)
- Missing key context creates confusion ("which plan is this?")
- Explicit display prevents context loss

**Anti-Patterns:**
- Omitting key from headers (no context)
- Showing key once at top (user forgets after scrolling)
- Inconsistent display (key in some sections, not others)

**Validation Function:** `ValidateKeyDisplay()`

---

### Rule #13: Phase Boundary Chat Isolation

**Statement:**  
Each phase should begin in a new Copilot chat window when autoChain is disabled. Ignored if E2E mode enabled.

**Rationale:**
- Prevents context pollution (Phase 1 assumptions bleeding into Phase 2)
- Enables phase-specific rollback (undo Phase 2 without affecting Phase 1)
- Improves Copilot performance (fresh context, no token bloat)
- Maintains session hygiene (clear boundaries between work phases)

**Enforcement:**
- `plan.prompt.md`: Display guidance at phase boundary when autoChain=false
- `task.prompt.md`: Display guidance at phase completion when autoChain=false
- Manual compliance (user creates new chat)

**Trigger:**
- Phase completion
- autoChain=false
- Not in E2E mode

**Guidance Message:**
```
💡 Best Practice: Start a new Copilot chat window for Phase N

Benefits:
- Fresh context (no token pollution from previous phase)
- Clean rollback (can undo Phase N without affecting Phase N-1)
- Better performance (Copilot works better with isolated contexts)

How:
1. Note your current command/handoff file
2. Open new chat window (Ctrl+Shift+P → "GitHub Copilot: Open Chat")
3. Continue with next phase command
```

**Exception:**  
E2E mode (autoChain=true) - Single chat session for all phases (user approved chain upfront)

**Examples:**

✅ **COMPLIANT WORKFLOW:**
```
Phase 1 complete (autoChain=false).

💡 Best Practice: Start a new Copilot chat window for Phase 2

Next Command (Key: kds):
@workspace /test-generation #file:.github/key-data-streams/kds/handoffs/phase-2-test.json

[User opens new chat, pastes command]
```

❌ **NON-COMPLIANT (no guidance):**
```
Phase 1 complete.

Next: @workspace /test-generation ...
(User continues in same chat - context pollution risk)
```

**Anti-Patterns:**
- Continuing all phases in single chat (token bloat)
- No guidance provided (user unaware of best practice)
- Forcing new chat in E2E mode (breaks user workflow)

**Validation Function:** `ValidatePhaseBoundaryChatIsolation()`

---

## 🔗 Handoff Protocol Standards

These rules govern **JSON handoff file structure and workflow**.

### Rule #12: Honest Handoff Protocol

**Statement:**  
Agents cannot execute other agents. All handoffs require explicit user invocation.

**Core Principle:**  
"Honest Handoff = JSON + Next Command + HALT"

**Workflow:**
1. Agent creates handoff JSON file with all parameters
2. Agent saves JSON to `.github/key-data-streams/{key}/handoffs/`
3. Agent displays "Next Command" section with exact invocation
4. Agent HALTS (does not auto-execute)
5. User manually invokes command (or selects auto-continue in E2E mode)

**Rationale:**
- Maintains transparency (user sees what will execute)
- User control (can review/modify handoff before proceeding)
- Debuggability (handoff JSON is audit trail)
- Prevents autonomous agent chains (anti-pattern)

**Exception:** E2E mode with autoChain=true (user approves chain upfront)

**Enforcement:**
- All prompts generate handoff JSON before output
- "Next Command" section mandatory in user output
- No auto-execution logic (except E2E countdown)

**Examples:**

✅ **COMPLIANT HONEST HANDOFF:**
```markdown
## 📋 Next Command

```markdown
@workspace /test-generation #file:.github/key-data-streams/kds/handoffs/phase-1-test.json
```

Handoff file created at: `.github/key-data-streams/kds/handoffs/phase-1-test.json`

(Agent HALTS - user invokes manually)
```

❌ **NON-COMPLIANT (auto-execution):**
```markdown
Executing test-generation agent...
(Agent executes other agent - dishonest, opaque, not debuggable)
```

**Anti-Patterns:**
- Implicit agent execution (no handoff JSON)
- Hiding parameters (user doesn't see what will execute)
- Auto-execution without user approval

**Validation Function:** `ValidateHonestHandoff()`

---

### Base Handoff JSON Schema

**All handoff files must include:**

```json
{
  "key": "string (required) - KDS key identifier",
  "description": "string (required) - What this handoff accomplishes",
  "acceptanceCriteria": ["string[]" (required) - 3-7 validation criteria"],
  "autoChain": "boolean (optional, default false) - Auto-continue to nextTask",
  "nextTask": "string (optional) - Path to next handoff JSON or 'complete'"
}
```

### route-to-plan.json Schema

**Additional fields:**

```json
{
  "request": "string (required) - User's original request",
  "scope": "string (optional) - Scope boundaries",
  "constraints": ["string[]" (optional) - Constraints"],
  "e2eMode": "boolean (optional, default false) - E2E execution mode",
  "autoChainPhases": "boolean (optional, default false) - Auto-continue phases"
}
```

### phase-{N}-test.json Schema

**Additional fields:**

```json
{
  "phase": "number (required) - Phase number",
  "scenario": "string (required) - Test scenario description",
  "assertCriteria": "boolean (required) - Must assert all acceptance criteria",
  "mode": "string (optional, default 'headless') - Test execution mode"
}
```

### phase-{N}-todo-{M}.json Schema

**Additional fields:**

```json
{
  "phase": "number (required) - Phase number",
  "task": "string (required) - Task ID (e.g., '1a', '2b')",
  "files": ["string[] (required) - Files to create/modify"],
  "testFile": "string (optional) - Associated test file path"
}
```

---

## 🛡️ Enforcement Mechanisms

### Validation Functions

Each rule has a corresponding validation function executed before user-facing output:

- `ValidateConciseOutputFormat()` - Rule #1
- `ValidateDocumentFirst()` - Rule #2
- `ValidatePlaywrightOrchestration()` - Rule #3
- `ValidatePerTaskHandoffs()` - Rule #4
- `ValidateTDDWorkflow()` - Rule #5
- `ValidateAutoChain()` - Rule #6
- `ValidateTestIndexCompliance()` - Rule #7
- `ValidateHolisticRegeneration()` - Rule #8
- `ValidatePlanConflictDetection()` - Rule #9
- `ValidateKDSGovernance()` - Rule #10
- `ValidateKeyDisplay()` - Rule #11
- `ValidateHonestHandoff()` - Rule #12

### Global Compliance Check

**Execute before ANY user-facing output:**

```
FUNCTION ValidateAllRules():
  violations = []
  
  FOR EACH rule IN KDSRulebook:
    result = EXECUTE rule.validationFunction()
    IF result.violation THEN
      violations.ADD(result)
    END IF
  END FOR
  
  IF violations.Count > 0 THEN
    LogViolations(violations)
    HALT
  END IF
  
  RETURN { compliant: true }
END FUNCTION
```

### KDS Governance Gatekeeper

**kds.prompt.md Load Order:**

1. Load MANDATORY.md
2. Load kds-handoff-protocol.md
3. Load SelfAwareness.instructions.md
4. Load active key context (plan.md, work-log.md)

**Compatibility Analysis:**

1. **Parse request** - Extract change intent, target files, rationale
2. **Load context** - All related rules, existing plans, dependencies
3. **Detect conflicts** - Rule contradictions, architectural incoherence
4. **Analyze cascading impacts** - What else breaks if this changes?
5. **Generate report** - PASSED or FAILED with resolution options
6. **If approved** - Create implementation handoff JSON
7. **HALT** - User invokes handoff manually

**Rejection Criteria:**
- Violates existing rules (contradicts Rule #1-12)
- Causes regressions (breaks existing workflows)
- Creates architectural incoherence (doesn't fit with existing design)
- Missing rationale (WHY change needed not explained)

---

## 📚 Related Documentation

**Core References:**
- `.github/MANDATORY.md` - Lightweight index (references this rulebook)
- `.github/prompts/shared/kds-handoff-protocol.md` - Detailed JSON schemas and workflow diagrams
- `.github/key-data-streams/kds/kds.plan.md` - KDS overhaul implementation plan
- `.github/instructions/SelfAwareness.instructions.md` - Global operating guardrails

**Rule Implementations:**
- `.github/instructions/rules/concise-output-format/rule.md` - Rule #1 detailed implementation
- `.github/instructions/rules/document-first/rule.md` - Rule #2 detailed implementation
- `.github/instructions/rules/playwright-orchestration/rule.md` - Rule #3 detailed implementation

**Governance:**
- `.github/prompts/kds.prompt.md` - Governance gatekeeper (compatibility analysis)
- `.github/governance/kds-rulebook.json` - Machine-readable schemas (companion to this file)

---

## 🔄 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.3.1 | 2025-10-31 | **ENHANCED Rule #2b Cleanup** - Added data-playwright-log-marker attribute pattern (timestamp-component format), cleanup trigger modes (manual request, post-test-generation automatic), global cleanup algorithm (CleanupPlaywrightLogging function), updated enforcement with Step 9.5 in test-generation.prompt.md |
| 1.3.0 | 2025-10-31 | **ENHANCED Rule #2b** - Added UI Interaction Logging infrastructure, PlaywrightLogger JavaScript class, test generation from console logs, headed Playwright test development support |
| 1.2.1 | 2025-10-31 | **ENFORCED Rule #2b** - Test Reverse-Engineering Metadata now mandatory for UI/API files. Added to Quick Reference, updated enforcement count to 14 rules |
| 1.2.0 | 2025-10-31 | Added Rule #2b (Test Reverse-Engineering Metadata) as sub-rule with ValidateTestMetadata() function |
| 1.1.1 | 2025-10-31 | Added Quick Reference summary section for rapid comprehension |
| 1.1.0 | 2025-10-31 | Added Rule #13 (Phase Boundary Chat Isolation), enhanced cleanup automation support |
| 1.0.0 | 2025-10-31 | Initial rulebook consolidating MANDATORY.md, Agentic Rules, Handoff Protocol |

---

**This rulebook is the CANONICAL source for all KDS governance rules.**

**Last Updated:** 2025-10-31  
**Maintainer:** KDS System  
**Version:** 1.3.1
