

📋 KDS Rules Summary (By Functionality Relevance)
Core Workflow (Highest Priority):

Rule #2: Document First (KDS files before code)
Rule #5: TDD (tests FIRST, red-green-refactor)
Rule #4: Per-Task Handoffs (dedicated JSON per task)
Rule #12: Honest Handoffs (JSON + Next Command + HALT)
Output & Quality:

Rule #1: Concise Format (no code in chat, 3-line bullets, CAPS options)
Rule #11: Key Display (visible in headers, commands)
Rule #16: Test Quality Gate (0-100 scoring)
Rule #17: Screenshot Tests (vision analysis workflow)
Test Execution (CRITICAL FOR THIS KEY):

Rule #3: Playwright Orchestration (dotnet scripts ONLY, no webServer/standalone)
Rule #20: KDTR Enforcement (query before, publish after)
Rule #7: Central Test Index (reuse before creating)
Governance:

Rule #10: KDS Gatekeeper (all .github changes via kds.prompt.md)
Rule #18: Router Exemption (routers skip Step -1)
Rule #19: Dual Rulebook Sync (JSON + MD atomic updates)
Workflow Optimization:

Rule #6: Auto-Chain Defaults (tasks chain, phases need approval)
Rule #8: Holistic Regeneration (delete & recreate, no partial edits)
Rule #9: Plan Conflict Detection (analyze before routing)
Rule #13: Phase Chat Isolation (new window per phase when manual mode)
Documentation & Metadata:

Rule #2b: Test Metadata (UI/API files include PLAYWRIGHT TEST METADATA)
Rule #14: Build Validation (zero errors after completion)
Rule #15: Git History Validation (commit analysis)





=======================================================================
🎯 Playwright Test Execution Pattern Summary
Application Launch Protocol
Separate Window Launch (Required):
=======================================================================

Launch app in dedicated PowerShell window using Start-Process powershell
Pass arguments: -NoExit, -Command with full startup command
Set environment variables: ASPNETCORE_ENVIRONMENT='Development', ASPNETCORE_URLS='https://localhost:9091'
Use WindowStyle Normal (NOT Minimized/Hidden) for visibility during debugging
Command pattern: cd 'D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas'; dotnet run
Health Check Before Tests:

Wait 15+ seconds for initial startup
Poll app availability using Invoke-WebRequest -Uri "https://localhost:9091" -SkipCertificateCheck
Use timeout loop (20-30 attempts) with 2-second intervals
Verify HTTP 200 status before proceeding
Handle SSL certificate validation with -SkipCertificateCheck flag
Test Design Pattern
Test Structure (4-Test Suite Example):

Test 1: Complete end-to-end validation (12 steps)
Test 2: Edge cases (multiple assets, timing)
Test 3: Data validation (asset types, ID patterns)
Test 4: UI validation (styling, z-index, layering)
Timing Safety:

Set overall test timeout (90 seconds for session startup)
Use step-specific timeouts (container: 30s, assets: 20s, buttons: 20s)
Wait for DOM elements with waitForSelector (never use fixed delays)
Verify state transitions (attached, visible) before proceeding
Validation Steps:

Navigate to page and wait for networkidle
Click elements using data-playwright-log-marker attributes
Wait for container IDs (#content-transcript-container)
Verify element attributes ([data-asset-id], [id^="share-btn-"])
Test click handlers and visual feedback (toast notifications)
Validate styling (gradients, positioning, z-index values)
Test Execution Pattern
Manual Execution (From CopilotChats.md):

Launch app in separate window first
Wait for app to be ready (health check polling)
Run Playwright test: npx playwright test {file}.spec.ts --config=config/testing/playwright.config.cjs --headed --reporter=list
Review test results and artifacts (screenshots, videos in test-results)
Orchestration Script Pattern (Preferred but had issues):

Script handles: cleanup → launch → health check → test → cleanup
Uses v3.0 direct dotnet.exe launch (not nested PowerShell)
Implements try/finally for guaranteed cleanup
Supports flags: -SkipBuild, -Headless, -KeepAppRunning
Issue encountered: Process terminates unexpectedly when using --no-build
Console Logging Standards
ASCII-Only Prefixes (No Emojis):

[STEP] - Test step execution
[PASS] - Verification passed
[INFO] - Informational message
[WARN] - Non-critical warning
Rationale: Cross-platform compatibility, CI/CD pipelines, log file readability
Test Results Analysis
Expected Failures Pattern:

All tests timeout waiting for [data-asset-id] elements
Root cause: Share button injection service not adding required attributes
Test progression: Navigation ✅ → Session start ✅ → Container found ✅ → Assets load ❌
Artifacts generated: Screenshots + videos showing where injection fails
Bug Validation:

Tests successfully detected the injection failure
Confirmed assets lack data-asset-id attributes
Confirmed share buttons never appear in DOM
Proves ShareButtonInjectionService integration incomplete
Key Corrections Applied
Container ID Fix:

Wrong: transcript-content-container (JavaScript was looking for this)
Correct: content-transcript-container (actual DOM ID)
Test uses correct ID throughout
Pattern Matching:

Button IDs: share-btn-{type}-{id} (e.g., share-btn-ayah-card-12345)
Asset types: ayah-card, ahadees, other
Initialization flag: window.shareButtonsInitialized must be true
Test Configuration
Session Data:

Session ID: 212 (canonical test session)
Host token: PQ9N5YWW
URL: https://localhost:9091/host/control-panel/PQ9N5YWW
Assets: Ayah cards with known structure
Execution Mode:

Headed mode (default): Visible browser for debugging
Headless mode (optional): -Headless flag for CI/CD
Reporter: list format for clear step-by-step output




















=============================
KEY DATA STREAMS SYSTEM
=============================
asifhussain60: Follow instructions in [kds.prompt.md](file:///d%3A/PROJECTS/NOOR%20CANVAS/.github/prompts/kds.prompt.md).
review the KDS system and tell me where would the #file:CopilotChats.md instructions on the playwright test orchestration process (not the actual test) fit in the KDS design. How can we make it so that when #file:plan.prompt.md breaks work into phases and tasks, it adds a reference to this orchestration protocol for every playwright test created so that playwright cannot deviate from it. Are there are any playwright settings that need to be modified?
Repond using #file:CONCISE-MANDATE.md

GitHub Copilot: I need to load the required files and perform a KDS system review to answer your question about integrating the Playwright test orchestration protocol. 

Read [](file:///d%3A/PROJECTS/NOOR%20CANVAS/.github/governance/kds-rulebook.json)

Read [](file:///d%3A/PROJECTS/NOOR%20CANVAS/.github/prompts/shared/kds-handoff-protocol.md)

Read [](file:///d%3A/PROJECTS/NOOR%20CANVAS/.github/instructions/SelfAwareness.instructions.md)

Read [](file:///d%3A/PROJECTS/NOOR%20CANVAS/.github/prompts/shared/kds-validation-algorithms.md#1-1), lines 1 to 2000

Read [](file:///d%3A/PROJECTS/NOOR%20CANVAS/.github/prompts/shared/test-orchestration-patterns.md)

I'll now read the current key data streams structure to understand where the orchestration protocol fits. 

Read [](file:///d%3A/PROJECTS/NOOR%20CANVAS/.github)

Searched text for `test.*orchestration|playwright.*orchestration|Start-NoorCanvasForTests` (`**/.github/**/*.md`), 20 results

Now I have the full context. Let me analyze and provide a comprehensive answer following the CONCISE-MANDATE format.

## 🔍 KDS Review: Playwright Orchestration Protocol Integration

**Key:** `kds-system-review`

---

### 📊 Current State Analysis (5 bullets)

- **CopilotChats.md orchestration protocol** exists but OUTSIDE KDS governance
- **test-orchestration-patterns.md** in shared (correct location)
- **3 prompts reference it** (plan, todo, test-generation) but NOT enforced by kds.prompt.md
- **No Rule #3 validation** in kds-validation-algorithms.md - exists as reference but no enforcement algorithm
- **Gap:** Playwright settings in playwright.config.cjs NOT governed by KDS rulebook

---

### 🎯 Where CopilotChats.md Instructions Fit in KDS Design

**Correct Location:** test-orchestration-patterns.md ✅ (already exists)

**Current Integration:**
- ✅ Referenced in plan.prompt.md (11 locations)
- ✅ Referenced in todo.prompt.md (5 locations) 
- ✅ Referenced in test-generation.prompt.md (indirect)
- ❌ NOT validated by kds.prompt.md Review Mode
- ❌ NOT in kds-validation-algorithms.md (Algorithm 12 stub exists but incomplete)

**Missing Enforcement:**
```
CURRENT: Prompts REFERENCE test-orchestration-patterns.md
NEEDED:  KDS validates orchestration scripts COMPLY with test-orchestration-patterns.md
```

---

### 🛡️ KDS Enforcement Strategy (7 bullets)

**1. Rule #3 Enhancement (kds-rulebook.json)**
- Add `validationFunction: "ValidatePlaywrightOrchestration"` (currently references Algorithm 12)
- Algorithm 12 in kds-validation-algorithms.md needs completion (lines 882-1048 stubbed)
- Validation checks: ✅ dotnet orchestration, ❌ standalone mode, ❌ nested PowerShell

**2. test-generation.prompt.md Step 7 Integration**
- AFTER test file generation → auto-generate orchestration script
- Use test-orchestration-patterns.md as template
- Auto-populate: `{{APP_HEALTH_CHECK_URL}}`, `{{SOURCE_PATH}}`, test filename

**3. plan.prompt.md Handoff JSON Enhancement**
```json
{
  "testFile": "Tests/UI/{key}.spec.ts",
  "orchestrationScript": "Scripts/run-{key}-test.ps1",
  "templateRef": ".github/prompts/shared/test-orchestration-patterns.md",
  "mandatoryPattern": "v3.0-direct-dotnet"
}
```

**4. kds.prompt.md Review Mode Addition (Step 2.6)**
- Scan `Scripts/run-*-test.ps1` for compliance
- Detect violations: standalone mode, nested PowerShell, missing cleanup
- Generate orchestration compliance report

**5. Playwright Config Governance**
- Add playwright.config.cjs to KDS-governed files
- Validate: timeout values, reporter settings, retry logic match KDS standards
- Prevent: webServer configuration (DEPRECATED per Rule #3)

**6. Pre-Commit Hook Integration**
```powershell
# .github/hooks/pre-commit.ps1 addition
ValidatePlaywrightOrchestration -Path "Scripts/*.ps1"
# HALT commit if violations detected
```

**7. Test Registry Integration (Rule #20 - KDTR)**
- Orchestration script path added to `.github/test-registry/{key}/{test-name}.json`
- Cross-reference: test file → orchestration script → app launcher (all linked)

---

### 🔧 Required KDS File Modifications (6 bullets)

**File 1: kds-rulebook.json**
- Rule #3 enhancement: Add `lastValidated: "2025-11-02"`, `validationFrequency: 60`
- Update `approvedPattern`: "Start-Job → dotnet run → Sleep → Test → Stop-Job" → "v3.0-direct-dotnet (Start-NoorCanvasForTests.ps1)"

**File 2: kds-validation-algorithms.md**
- Complete Algorithm 12: `ValidateTestOrchestration` (lines 882-1048)
- Add checks: v3.0 pattern, `Start-NoorCanvasForTests.ps1` usage, headless defaults

**File 3: test-generation.prompt.md**
- Add Step 7.5: Auto-generate orchestration script from template
- Validate script before finalizing (call Algorithm 12)

**File 4: plan.prompt.md**
- Enhance handoff JSON schema (line 492): Add `orchestrationScript`, `mandatoryPattern`
- Update Test Execution Requirements section (lines 420-437) with v3.0 references

**File 5: `kds.prompt.md` (Review Mode)**
- Add Step 2.6: Scan orchestration scripts, call Algorithm 12
- Add to compliance report: Orchestration violations by severity

**File 6: SelfAwareness.instructions.md**
- Update Playwright Testing section (lines 189-220) → Reference Rule #3
- Cross-link to test-orchestration-patterns.md as canonical source

---

### ⚙️ Playwright Settings Governance (4 bullets)

**playwright.config.cjs Changes:**

**1. Timeout Standardization**
```javascript
// BEFORE: Arbitrary per-test
timeout: 90000

// AFTER: KDS-governed default
timeout: process.env.CI ? 120000 : 90000  // CI gets extra time
```

**2. Retry Logic (Rule #3 Compliance)**
```javascript
// BEFORE: No retries
retries: 0

// AFTER: Aligned with KDS best practices
retries: process.env.CI ? 2 : 0  // CI only (local debugging needs instant feedback)
```

**3. Headless Mode Default (Rule #3)**
```javascript
// BEFORE: use.headless not specified
// AFTER: Explicit headless default
use: {
  headless: !process.env.HEADED,  // Override with HEADED=1 env var
  ...
}
```

**4. Deprecated webServer Removal (Rule #3 Critical)**
```javascript
// ❌ REMOVE (violates Rule #3)
webServer: {
  command: 'dotnet run',
  url: 'https://localhost:9091',
  reuseExistingServer: !process.env.CI
}

// ✅ ENFORCE: Orchestration scripts ONLY
// No webServer config allowed (use Scripts/run-*-test.ps1)
```

---

### 📋 Next Command (KDS Governance Update)

```bash
@workspace /kds I need to enhance Rule #3 (Playwright Orchestration) enforcement with:
1. Complete Algorithm 12 validation in kds-validation-algorithms.md
2. Add orchestration script validation to Review Mode (Step 2.6)
3. Govern config/testing/playwright.config.cjs settings
4. Add orchestrationScript field to test handoff JSONs
5. Integrate with Rule #20 (KDTR) - orchestration scripts in test registry
```

---

**Status:** KDS orchestration enforcement incomplete - template exists but validation missing  
**Impact:** Prompts can deviate from canonical v3.0 pattern without detection  
**Priority:** P1 (Rule #3 is MANDATORY but not validated in Review Mode)