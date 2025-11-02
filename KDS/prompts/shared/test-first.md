# KDS Shared Module: Test-First

**Purpose:** Enforce test-driven development (TDD) workflow - create failing tests BEFORE implementation.

**Version:** 4.5  
**Loaded By:** `code-executor.md`, `test-generator.md`

---

## 🎯 Core Responsibility

Ensure **tests drive implementation**, not the other way around.

---

## 📋 Test-First Workflow

### The Sacred Sequence

```
1. UNDERSTAND
   │ Read task requirements
   │ Identify acceptance criteria
   │ Determine test type needed
   │
   ▼
2. CREATE FAILING TEST (RED)
   │ Write test that fails
   │ Verify test actually fails
   │ Document expected behavior
   │
   ▼
3. VERIFY FAILURE
   │ Run test
   │ Confirm RED status ❌
   │ Ensure failure is for RIGHT reason
   │
   ▼
4. IMPLEMENT CODE
   │ Write MINIMAL code to pass test
   │ No gold-plating
   │ Focus on making test GREEN
   │
   ▼
5. VERIFY SUCCESS
   │ Run test again
   │ Confirm GREEN status ✅
   │ All tests still passing
   │
   ▼
6. REFACTOR (if needed)
   │ Improve code quality
   │ Maintain GREEN status
   │ Keep tests passing
```

---

## 🚫 Anti-Patterns (NEVER DO THIS)

### ❌ Code-First
```markdown
❌ WRONG:
  1. Write implementation
  2. Write test to verify it works

This is verification, not TDD!
```

### ❌ Test-After
```markdown
❌ WRONG:
  1. Complete entire feature
  2. Add tests at the end

Tests won't drive design!
```

### ❌ No Test Execution
```markdown
❌ WRONG:
  1. Write test
  2. Write implementation
  3. Assume it works without running tests

Always verify RED → GREEN!
```

### ❌ Passing Test First
```markdown
❌ WRONG:
  1. Write test
  2. Test passes immediately

Test is not testing anything new!
```

---

## ✅ Test-First Patterns

### Pattern 1: Unit Test (C# / MSTest)

#### Step 1: Create Failing Test
```csharp
// Tests/Unit/Services/PdfServiceTests.cs
using Microsoft.VisualStudio.TestTools.UnitTesting;
using NoorCanvas.Services;

namespace NoorCanvas.Tests.Unit.Services
{
    [TestClass]
    public class PdfServiceTests
    {
        [TestMethod]
        public void ExportToPdf_WithValidTranscript_ReturnsPdfBytes()
        {
            // Arrange
            var pdfService = new PdfService();  // ❌ Doesn't exist yet!
            var transcript = new Transcript
            {
                SessionId = 101,
                Utterances = new List<Utterance>
                {
                    new Utterance { Text = "Hello", Speaker = "User1" }
                }
            };

            // Act
            var result = pdfService.ExportToPdf(transcript);

            // Assert
            Assert.IsNotNull(result);
            Assert.IsTrue(result.Length > 0);
        }
    }
}
```

#### Step 2: Verify Failure (RED)
```bash
$ dotnet test --filter "ExportToPdf_WithValidTranscript"

❌ FAILED
Error: The type or namespace name 'PdfService' could not be found

✅ Good! Test fails for expected reason.
```

#### Step 3: Implement Code
```csharp
// SPA/NoorCanvas/Services/PdfService.cs
using QuestPDF.Fluent;
using QuestPDF.Helpers;

namespace NoorCanvas.Services
{
    public class PdfService : IPdfService
    {
        public byte[] ExportToPdf(Transcript transcript)
        {
            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Content().Text($"Transcript for Session {transcript.SessionId}");
                    
                    foreach (var utterance in transcript.Utterances)
                    {
                        page.Content().Text($"{utterance.Speaker}: {utterance.Text}");
                    }
                });
            });

            return document.GeneratePdf();
        }
    }
}
```

#### Step 4: Verify Success (GREEN)
```bash
$ dotnet test --filter "ExportToPdf_WithValidTranscript"

✅ PASSED
Test Duration: 1.2s

✅ Good! Test now passes.
```

---

### Pattern 2: Visual Regression Test (Playwright + Percy)

#### Step 1: Create Failing Test
```typescript
// Tests/UI/transcript-canvas-pdf-export.spec.ts
import { test, expect } from '@playwright/test';
import percySnapshot from '@percy/playwright';

test.describe('PDF Export Button - Visual Regression', () => {
    
    test('Export to PDF button appears correctly', async ({ page }) => {
        // Navigate to transcript canvas
        await page.goto('http://localhost:5000/transcripts/101');
        
        // Wait for button that doesn't exist yet
        const exportButton = page.locator('[data-testid="export-pdf-button"]');
        await expect(exportButton).toBeVisible();  // ❌ Will fail!
        
        // Take Percy snapshot
        await percySnapshot(page, 'Transcript Canvas - PDF Export Button');
    });
});
```

#### Step 2: Verify Failure (RED)
```bash
$ npx playwright test transcript-canvas-pdf-export.spec.ts

❌ FAILED
Error: Timeout 30000ms exceeded waiting for selector '[data-testid="export-pdf-button"]'

✅ Good! Test fails because button doesn't exist.
```

#### Step 3: Implement Code
```razor
<!-- SPA/NoorCanvas/Pages/Transcripts/TranscriptCanvas.razor -->
@page "/transcripts/{SessionId:int}"

<div data-testid="transcript-canvas">
    
    <!-- Other canvas content -->
    
    <button 
        id="exportPdfButton"
        data-testid="export-pdf-button" 
        @onclick="ExportToPdf">
        Export to PDF
    </button>
</div>

@code {
    private async Task ExportToPdf()
    {
        // Call PDF service
        var pdf = await PdfService.ExportToPdf(SessionId);
        // Trigger download
        await JS.InvokeVoidAsync("downloadFile", "transcript.pdf", pdf);
    }
}
```

#### Step 4: Verify Success (GREEN)
```bash
$ npx playwright test transcript-canvas-pdf-export.spec.ts

✅ PASSED
Percy snapshot captured: Transcript Canvas - PDF Export Button

✅ Good! Test now passes and Percy baseline created.
```

---

### Pattern 3: Integration Test (API)

#### Step 1: Create Failing Test
```csharp
// Tests/Integration/Controllers/TranscriptControllerTests.cs
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.VisualStudio.TestTools.UnitTesting;

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
            // ❌ Endpoint doesn't exist yet!
            
            // Assert
            Assert.IsTrue(response.IsSuccessStatusCode);
            Assert.AreEqual("application/pdf", response.Content.Headers.ContentType.MediaType);
        }
    }
}
```

#### Step 2: Verify Failure (RED)
```bash
$ dotnet test --filter "ExportPdf_WithValidSession"

❌ FAILED
Error: Response status code does not indicate success: 404 (Not Found)

✅ Good! Endpoint doesn't exist yet.
```

#### Step 3: Implement Code
```csharp
// SPA/NoorCanvas/Controllers/TranscriptController.cs
[ApiController]
[Route("api/[controller]")]
public class TranscriptController : ControllerBase
{
    private readonly IPdfService _pdfService;
    
    public TranscriptController(IPdfService pdfService)
    {
        _pdfService = pdfService;
    }
    
    [HttpGet("export-pdf/{sessionId}")]
    public async Task<IActionResult> ExportPdf(int sessionId)
    {
        var transcript = await GetTranscript(sessionId);
        
        if (transcript == null)
        {
            return NotFound();
        }
        
        var pdfBytes = _pdfService.ExportToPdf(transcript);
        
        return File(pdfBytes, "application/pdf", $"transcript-{sessionId}.pdf");
    }
}
```

#### Step 4: Verify Success (GREEN)
```bash
$ dotnet test --filter "ExportPdf_WithValidSession"

✅ PASSED
Test Duration: 2.1s

✅ Good! API endpoint working.
```

---

## 🎯 Test-First Enforcement

### Checklist (Mandatory)

Before marking task complete:

- [ ] ✅ Test created BEFORE implementation
- [ ] ✅ Test initially failed (RED status verified)
- [ ] ✅ Implementation created to pass test
- [ ] ✅ Test now passes (GREEN status verified)
- [ ] ✅ All other tests still passing (no regression)
- [ ] ✅ Test covers acceptance criteria

---

## 🚨 Enforcement Actions

### Scenario: Implementation Exists, No Test

```markdown
❌ TEST-FIRST VIOLATION DETECTED

File created: SPA/NoorCanvas/Services/PdfService.cs
Test file: Tests/Unit/Services/PdfServiceTests.cs - NOT FOUND

🛑 BLOCKED

Action:
  1. Revert implementation: git checkout -- SPA/NoorCanvas/Services/PdfService.cs
  2. Create test FIRST
  3. Verify test fails (RED)
  4. Re-create implementation
  5. Verify test passes (GREEN)

Rationale: Rule #8 (Test-First Mandatory)
```

### Scenario: Test Created But Never Failed

```markdown
❌ TEST-FIRST VIOLATION DETECTED

Test: PdfServiceTests.ExportToPdf_WithValidTranscript
Status: ✅ PASSED (on first run)

🛑 SUSPICIOUS

Test passed immediately - it's not testing anything new!

Action:
  1. Review test assertions
  2. Ensure test requires new code
  3. Verify RED → GREEN cycle occurred
```

---

## 🧠 Benefits of Test-First

### 1. Better Design
```markdown
Writing test FIRST forces you to think about:
  ✅ Public API design
  ✅ Dependencies
  ✅ Error handling
  ✅ Edge cases
```

### 2. Complete Coverage
```markdown
Test-first ensures:
  ✅ Every feature has tests
  ✅ Tests written when requirements fresh
  ✅ No "we'll test it later" technical debt
```

### 3. Fast Feedback
```markdown
Test-first provides:
  ✅ Immediate verification of implementation
  ✅ Confidence in changes
  ✅ Regression detection
```

### 4. Living Documentation
```markdown
Tests serve as:
  ✅ Usage examples
  ✅ Behavior specification
  ✅ Contract definition
```

---

## 🔄 Test-First in KDS Workflow

### Integration with code-executor.md

```markdown
When executing task:
  1. Load #file:KDS/prompts/shared/test-first.md
  2. Identify test type (unit, integration, visual, E2E)
  3. Load test-generator.md to create failing test
  4. Verify test fails (RED) ❌
  5. Implement code
  6. Verify test passes (GREEN) ✅
  7. Mark task complete
```

### Integration with test-generator.md

```markdown
When creating test:
  1. Load #file:KDS/prompts/shared/test-first.md
  2. Create test based on acceptance criteria
  3. Ensure test will fail initially
  4. Return to code-executor with:
     - Test file path
     - Expected failure reason
     - Implementation guidance
```

---

## 📊 Test-First Metrics

### Track RED → GREEN Cycles

```json
// KDS/sessions/current-session.json
{
  "test_first_metrics": {
    "total_tasks": 8,
    "tasks_with_tests": 8,
    "red_green_cycles": 8,
    "violations": 0,
    "compliance_rate": "100%"
  }
}
```

### Report Compliance

```markdown
📊 TEST-FIRST COMPLIANCE

Session: 20251102-export-pdf
Compliance: 100% ✅

Tasks: 8
  ✅ All tasks followed RED → GREEN cycle
  ✅ No violations detected
  ✅ All tests passing

Quality: EXCELLENT
```

---

## 🧪 Example Test-First Sessions

### Example 1: Perfect Compliance
```markdown
Task 1.1: Create IPdfService interface
  1. ✅ Create PdfServiceTests.cs (RED)
  2. ✅ Create IPdfService.cs
  3. ✅ Test passes (GREEN)

Task 1.2: Implement PdfService
  1. ✅ Add test to PdfServiceTests.cs (RED)
  2. ✅ Implement PdfService.cs
  3. ✅ Test passes (GREEN)

Compliance: 100% ✅
```

### Example 2: Violation Caught
```markdown
Task 2.1: Add Export button
  1. ❌ Added button to TranscriptCanvas.razor
  2. ❌ No test created

🛑 VIOLATION DETECTED

Action:
  1. Revert changes
  2. Create visual test FIRST
  3. Verify test fails (no button)
  4. Re-add button
  5. Verify test passes

Compliance: Violation corrected ✅
```

---

## 🎓 Test-First Philosophy

### Core Principle
```markdown
"Tests are not a safety net to catch bugs.
 Tests are a design tool that drives implementation."
```

### KDS Commitment
```markdown
Test-first is NON-NEGOTIABLE in KDS.

Why?
  - Prevents technical debt
  - Ensures quality from start
  - Builds confidence in changes
  - Creates living documentation

Exceptions: NONE
```

---

**Test-First ensures quality from the start!** 🧪
