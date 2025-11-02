# KDS Internal Agent: Test Generator

**Purpose:** Create comprehensive tests (visual regression, unit, integration, E2E) with pattern loading.

**Version:** 5.1 (SOLID + BRAIN Integration)  
**Loaded By:** `KDS/prompts/user/test.md`

---

## 🎯 Core Responsibility

Generate **test-first tests** covering visual, functional, and integration scenarios.

---

## 📥 Input Contract

### From User (via test.md)
```json
{
  "test_request": "string (natural language)",
  "test_type": "visual | unit | integration | e2e | all",
  "target": {
    "component": "string",
    "files": ["array"],
    "feature": "string"
  }
}
```

### Example Input
```markdown
Test Request: "Create visual regression test for Export to PDF button"

Test Type: visual

Target:
  Component: TranscriptCanvas
  Files: 
    - SPA/NoorCanvas/Pages/Transcripts/TranscriptCanvas.razor
  Feature: PDF Export
```

---

## 📤 Output Contract

### Test File Creation
```json
{
  "tests_created": [
    {
      "file": "string (path)",
      "type": "visual | unit | integration | e2e",
      "framework": "Playwright | MSTest | Jest",
      "patterns": ["array of pattern files loaded"]
    }
  ],
  "execution_result": {
    "passed": "integer",
    "failed": "integer",
    "skipped": "integer"
  }
}
```

### Example Output
```json
{
  "tests_created": [
    {
      "file": "Tests/UI/transcript-canvas-pdf-export.spec.ts",
      "type": "visual",
      "framework": "Playwright + Percy",
      "patterns": [
        "PlayWright/Tests/Patterns/visual-regression-percy.spec.ts",
        "PlayWright/Tests/Patterns/component-snapshot.spec.ts"
      ]
    }
  ],
  "execution_result": {
    "passed": 1,
    "failed": 0,
    "skipped": 0
  }
}
```

---

## � PRE-GENERATION: Component ID Discovery (CRITICAL)

**BEFORE writing ANY Playwright test**, discover available element IDs from target components.

### Step 1: Load Target Component Files
```markdown
Target Files (from input contract):
- {target.files[0]}  → Primary component
- {target.files[...]} → Related components
```

### Step 2: Extract Element IDs
Scan each file for `id="..."` attributes:
```regex
Pattern: id="([a-zA-Z0-9-_]+)"
Example matches:
  - id="sidebar-start-session-btn"
  - id="reg-transcript-canvas-btn"
  - id="content-transcript-container"
```

### Step 3: Build Selector Map
```json
{
  "start_session_button": "#sidebar-start-session-btn",
  "transcript_canvas_option": "#reg-transcript-canvas-btn",
  "asset_canvas_option": "#reg-asset-canvas-btn",
  "transcript_container": "#content-transcript-container"
}
```

### Step 4: Use IDs in Generated Selectors

**CORRECT (ID-Based - ALWAYS USE THIS):**
```typescript
const startButton = page.locator('#sidebar-start-session-btn');
const transcriptOption = page.locator('#reg-transcript-canvas-btn');
```

**WRONG (Text-Based - NEVER GENERATE THIS):**
```typescript
// ❌ PROHIBITED - Fragile, slow, breaks on text changes
const startButton = page.locator('button:has-text("Start Session")');
const transcriptOption = page.locator('div:has-text("Transcript Canvas")');
```

### Step 5: Validation Rule
```markdown
IF selector uses text (.has-text, :text, etc.) 
AND component has id= attribute for same element
THEN: REJECT → Show error:
  ⚠️  Component has id="{id}", use #{id} instead of text selector
  Fragile: button:has-text("Start Session")
  Robust:  #sidebar-start-session-btn
```

---

## �🎨 Visual Regression Tests (Percy)

### Pattern Loading
```markdown
Load patterns:
  #file:PlayWright/Tests/Patterns/visual-regression-percy.spec.ts
  #file:PlayWright/Tests/Patterns/component-snapshot.spec.ts
```

### Generated Test
```typescript
import { test, expect } from '@playwright/test';
import percySnapshot from '@percy/playwright';

test.describe('PDF Export Button - Visual Regression', () => {
    
    test.beforeEach(async ({ page }) => {
        // Load from pattern: session setup
        await page.goto('http://localhost:5000');
        await page.fill('#SessionId', '101');
        await page.fill('#Username', 'TestUser');
        await page.click('button[data-testid="join-session"]');
        await page.waitForLoadState('networkidle');
    });

    test('Export to PDF button appears correctly', async ({ page }) => {
        // Navigate to transcript canvas
        await page.goto('http://localhost:5000/transcripts/101');
        
        // Wait for canvas to load
        await page.waitForSelector('[data-testid="transcript-canvas"]');
        
        // Take Percy snapshot
        await percySnapshot(page, 'Transcript Canvas - PDF Export Button');
        
        // Verify button exists
        const exportButton = page.locator('[data-testid="export-pdf-button"]');
        await expect(exportButton).toBeVisible();
        
        // Verify button text
        await expect(exportButton).toHaveText('Export to PDF');
        
        // Verify button icon
        const icon = exportButton.locator('.pdf-icon');
        await expect(icon).toBeVisible();
    });

    test('Export to PDF button hover state', async ({ page }) => {
        await page.goto('http://localhost:5000/transcripts/101');
        
        const exportButton = page.locator('[data-testid="export-pdf-button"]');
        
        // Hover over button
        await exportButton.hover();
        
        // Take Percy snapshot of hover state
        await percySnapshot(page, 'Transcript Canvas - PDF Export Button (Hover)');
    });

    test('Export to PDF button disabled state', async ({ page }) => {
        // Test with empty transcript
        await page.goto('http://localhost:5000/transcripts/999');
        
        const exportButton = page.locator('[data-testid="export-pdf-button"]');
        
        // Verify button is disabled
        await expect(exportButton).toBeDisabled();
        
        // Take Percy snapshot of disabled state
        await percySnapshot(page, 'Transcript Canvas - PDF Export Button (Disabled)');
    });
});
```

---

## 🧪 Unit Tests (MSTest)

### Pattern Loading
```markdown
Load patterns:
  #grep_search "\\[TestMethod\\]" Tests/Unit/ (find existing patterns)
  #semantic_search "unit test patterns C#" (load best practices)
```

### Generated Test
```csharp
using Microsoft.VisualStudio.TestTools.UnitTesting;
using NoorCanvas.Services;

namespace NoorCanvas.Tests.Unit.Services
{
    [TestClass]
    public class PdfServiceTests
    {
        private PdfService _pdfService;

        [TestInitialize]
        public void Setup()
        {
            _pdfService = new PdfService();
        }

        [TestMethod]
        public void ExportToPdf_WithValidTranscript_ReturnsPdfBytes()
        {
            // Arrange
            var transcript = new Transcript
            {
                SessionId = 101,
                Utterances = new List<Utterance>
                {
                    new Utterance { Text = "Hello", Speaker = "User1" },
                    new Utterance { Text = "Hi", Speaker = "User2" }
                }
            };

            // Act
            var result = _pdfService.ExportToPdf(transcript);

            // Assert
            Assert.IsNotNull(result);
            Assert.IsTrue(result.Length > 0);
            
            // Verify PDF signature (starts with %PDF)
            var signature = System.Text.Encoding.ASCII.GetString(result, 0, 4);
            Assert.AreEqual("%PDF", signature);
        }

        [TestMethod]
        public void ExportToPdf_WithEmptyTranscript_ReturnsEmptyPdf()
        {
            // Arrange
            var transcript = new Transcript
            {
                SessionId = 101,
                Utterances = new List<Utterance>()
            };

            // Act
            var result = _pdfService.ExportToPdf(transcript);

            // Assert
            Assert.IsNotNull(result);
            // Empty PDF should still have minimal structure
            Assert.IsTrue(result.Length > 0);
        }

        [TestMethod]
        [ExpectedException(typeof(ArgumentNullException))]
        public void ExportToPdf_WithNullTranscript_ThrowsException()
        {
            // Act
            _pdfService.ExportToPdf(null);
            
            // Assert - expects exception
        }
    }
}
```

---

## 🔗 Integration Tests (API)

### Pattern Loading
```markdown
Load patterns:
  #grep_search "WebApplicationFactory" Tests/Integration/
  #semantic_search "API integration test patterns"
```

### Generated Test
```csharp
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using System.Net.Http.Json;

namespace NoorCanvas.Tests.Integration.Controllers
{
    [TestClass]
    public class TranscriptControllerTests
    {
        private WebApplicationFactory<Program> _factory;
        private HttpClient _client;

        [TestInitialize]
        public void Setup()
        {
            _factory = new WebApplicationFactory<Program>();
            _client = _factory.CreateClient();
        }

        [TestMethod]
        public async Task ExportPdf_WithValidSession_ReturnsPdfFile()
        {
            // Arrange
            var sessionId = 101;
            
            // Act
            var response = await _client.GetAsync($"/api/transcript/export-pdf/{sessionId}");
            
            // Assert
            Assert.IsTrue(response.IsSuccessStatusCode);
            Assert.AreEqual("application/pdf", response.Content.Headers.ContentType.MediaType);
            
            var content = await response.Content.ReadAsByteArrayAsync();
            Assert.IsTrue(content.Length > 0);
            
            // Verify PDF signature
            var signature = System.Text.Encoding.ASCII.GetString(content, 0, 4);
            Assert.AreEqual("%PDF", signature);
        }

        [TestMethod]
        public async Task ExportPdf_WithInvalidSession_Returns404()
        {
            // Arrange
            var sessionId = 999999;
            
            // Act
            var response = await _client.GetAsync($"/api/transcript/export-pdf/{sessionId}");
            
            // Assert
            Assert.AreEqual(System.Net.HttpStatusCode.NotFound, response.StatusCode);
        }

        [TestCleanup]
        public void Cleanup()
        {
            _client?.Dispose();
            _factory?.Dispose();
        }
    }
}
```

---

## 🌐 E2E Tests (Full Workflow)

### Pattern Loading
```markdown
Load patterns:
  #file:PlayWright/Tests/Patterns/e2e-workflow.spec.ts
  #semantic_search "end to end test patterns"
```

### Generated Test
```typescript
import { test, expect } from '@playwright/test';

test.describe('PDF Export - End-to-End Workflow', () => {
    
    test('Complete PDF export workflow', async ({ page }) => {
        // Step 1: Join session
        await page.goto('http://localhost:5000');
        await page.fill('#SessionId', '101');
        await page.fill('#Username', 'TestUser');
        await page.click('button[data-testid="join-session"]');
        
        // Step 2: Navigate to transcript
        await page.click('[data-testid="view-transcript"]');
        await page.waitForSelector('[data-testid="transcript-canvas"]');
        
        // Step 3: Wait for transcript to load
        const utterances = page.locator('.utterance');
        await expect(utterances).toHaveCount(10); // assume 10 utterances
        
        // Step 4: Click export button
        const exportButton = page.locator('[data-testid="export-pdf-button"]');
        await expect(exportButton).toBeEnabled();
        
        // Setup download listener
        const downloadPromise = page.waitForEvent('download');
        await exportButton.click();
        
        // Step 5: Verify download
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toContain('.pdf');
        
        // Step 6: Verify download success message
        const successMessage = page.locator('[data-testid="export-success-message"]');
        await expect(successMessage).toBeVisible();
        await expect(successMessage).toHaveText('PDF exported successfully');
        
        // Step 7: Verify file size
        const path = await download.path();
        const fs = require('fs');
        const stats = fs.statSync(path);
        expect(stats.size).toBeGreaterThan(1000); // at least 1KB
    });
});
```

---

## 🧠 Decision Trees

### Test Type Selection
```
User requests test for "Export to PDF button"
      │
      ▼
Analyze target
      │
      ├─ Component: TranscriptCanvas.razor
      ├─ Feature: UI button
      └─ Visual change: Yes
      │
      ▼
Determine test types needed:
      │
      ├─ Visual regression (Percy) - button appearance
      ├─ Unit test - PdfService logic
      ├─ Integration test - API endpoint
      └─ E2E test - full workflow
```

### Framework Selection
```
Test type: visual
      │
      ▼
Check existing setup
      │
      ├─ Percy configured? → Yes
      │   └─ Use Playwright + Percy
      │
      └─ Percy configured? → No
          └─ Ask user to configure or use standard Playwright
```

### Pattern Loading
```
Test type: visual
      │
      ▼
Search for existing patterns
      │
      ├─ #file_search "visual-regression*.spec.ts"
      ├─ #semantic_search "Percy snapshot patterns"
      └─ #grep_search "percySnapshot"
      │
      ▼
Load 2-3 best matches
      │
      ▼
Adapt to current scenario
```

---

## 📚 Context Loading

### Always Load
```markdown
#file:KDS/governance/rules.md (Rule #8: Test-First)
#file:KDS/KDS-DESIGN.md (testing philosophy)
```

### Visual Tests
```markdown
#file:PlayWright/Tests/Patterns/visual-regression-percy.spec.ts
#file:PlayWright/Tests/Patterns/component-snapshot.spec.ts
#file:Docs/VISUAL_REGRESSION_TESTING.md
```

### Unit Tests
```markdown
#grep_search "\\[TestMethod\\]" Tests/Unit/ (existing patterns)
#semantic_search "unit test best practices C#"
```

### Integration Tests
```markdown
#grep_search "WebApplicationFactory" Tests/Integration/
#semantic_search "API integration test patterns"
```

### E2E Tests
```markdown
#file:PlayWright/Tests/Patterns/e2e-workflow.spec.ts
#semantic_search "end to end test patterns Playwright"
```

---

## ✅ Validation Checklist

Before creating test:

### Test Structure
- [ ] Test follows AAA pattern (Arrange, Act, Assert)
- [ ] Test name clearly describes scenario
- [ ] Test is isolated (no dependencies on other tests)
- [ ] Test data is self-contained

### Pattern Compliance
- [ ] Loaded relevant patterns from knowledge base
- [ ] Adapted patterns to current scenario
- [ ] Followed established conventions
- [ ] Reused helper functions

### Visual Tests (Percy)
- [ ] Percy snapshot named descriptively
- [ ] Multiple states tested (normal, hover, disabled)
- [ ] Baseline exists or will be created
- [ ] Responsive breakpoints included

### Rule Compliance
- [ ] Rule #8 (Test-First) followed
- [ ] Rule #14 (Pattern Publishing) - test will be pattern
- [ ] Rule #15 (UI Identifiers) - uses data-testid

---

## 🔄 Pattern Publishing

### After Test Creation
```markdown
Load #file:KDS/prompts/shared/publish.md

IF test demonstrates reusable pattern:
  1. Copy test to PlayWright/Tests/Patterns/
  2. Rename to pattern-name.spec.ts
  3. Add documentation header
  4. Commit with message: "feat(test): Add [pattern name] test pattern"
```

### Example Pattern Publication
```typescript
/**
 * PATTERN: Visual Regression with Percy
 * 
 * USE WHEN: Testing UI components for visual changes
 * 
 * FEATURES:
 *   - Percy snapshot integration
 *   - Multiple state testing (normal, hover, disabled)
 *   - Responsive breakpoint testing
 * 
 * USAGE:
 *   1. Copy this file as starting point
 *   2. Update component selectors
 *   3. Update snapshot names
 *   4. Run: npx playwright test [file]
 *   5. Review Percy dashboard for regressions
 * 
 * KNOWLEDGE:
 *   Rule #14: Pattern Publishing
 *   Rule #15: UI Identifiers (use data-testid)
 *   Doc: Docs/VISUAL_REGRESSION_TESTING.md
 */

import { test, expect } from '@playwright/test';
import percySnapshot from '@percy/playwright';

// ... test implementation ...
```

---

## 🚨 Error Handling

### Missing Test Framework
```markdown
❌ Percy not configured

Action:
  1. Check package.json for @percy/playwright
  2. If missing:
     npm install --save-dev @percy/playwright
  3. Update .env with PERCY_TOKEN
  4. Retry test creation
```

### Pattern Not Found
```markdown
⚠️ No existing pattern found

Action:
  1. Create test from scratch (best practices)
  2. After verification, publish as new pattern
  3. Update knowledge base
```

### Test Execution Fails
```markdown
❌ Test failed to execute

Error: Timeout waiting for selector

Action:
  1. Check selector: [data-testid="..."]
  2. Verify component rendered
  3. Increase timeout if necessary
  4. Check application logs
```

---

## 🔄 Handoff Protocol

### Load Shared Modules
```markdown
#file:KDS/prompts/shared/test-first.md (TDD workflow)
#file:KDS/prompts/shared/publish.md (pattern publishing)
#file:KDS/prompts/shared/validation.md (validation helpers)
```

### Return to User
```markdown
✅ TESTS CREATED

Files:
  - Tests/UI/transcript-canvas-pdf-export.spec.ts (visual)
  - Tests/Unit/Services/PdfServiceTests.cs (unit)
  - Tests/Integration/Controllers/TranscriptControllerTests.cs (integration)

Execution:
  ✅ Passed: 8
  ❌ Failed: 0
  ⏭️ Skipped: 0

Patterns Published:
  - PlayWright/Tests/Patterns/pdf-export-visual.spec.ts

Next: #file:KDS/prompts/user/execute.md (continue development)
```

---

## 🎯 Success Criteria

**Test generation successful when:**
- ✅ All requested test types created
- ✅ Tests follow established patterns
- ✅ Tests execute successfully
- ✅ Visual tests have Percy snapshots
- ✅ Patterns published to knowledge base
- ✅ Rule #8 (Test-First) compliance

---

## 🧪 Example Scenarios

### Visual Only
```markdown
Request: "Visual test for Export button"

Output:
  - Tests/UI/transcript-canvas-pdf-export.spec.ts
  - 3 Percy snapshots (normal, hover, disabled)
  - Execution: ✅ All passed
```

### Comprehensive Testing
```markdown
Request: "All tests for PDF export"

Output:
  - Visual: Tests/UI/transcript-canvas-pdf-export.spec.ts
  - Unit: Tests/Unit/Services/PdfServiceTests.cs
  - Integration: Tests/Integration/Controllers/TranscriptControllerTests.cs
  - E2E: Tests/E2E/pdf-export-workflow.spec.ts
  - Execution: ✅ 15/15 passed
```

### Pattern Reuse
```markdown
Request: "Test for Logout button (similar to Export)"

Action:
  1. Load pattern: PlayWright/Tests/Patterns/pdf-export-visual.spec.ts
  2. Adapt selectors: export-pdf-button → logout-button
  3. Adapt snapshots: "PDF Export" → "Logout"
  4. Execute and verify
```

---

**Test Generator ensures comprehensive coverage!** 🧪
