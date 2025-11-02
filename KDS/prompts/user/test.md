# KDS User Command: Test

**Purpose:** Create and run tests for your implementation.

**Version:** 4.5  
**Loaded By:** Universal entry point or direct usage

---

## 🎯 How to Use

```markdown
#file:KDS/prompts/user/test.md

Create [test type] for [feature]
```

**Or use the universal entry point:**
```markdown
#file:KDS/prompts/user/kds.md

Create visual tests for the share button
```

---

## 📋 What Happens

When you use this command, KDS will:

1. **Load Test Generator Agent**
   ```
   #file:KDS/prompts/internal/test-generator.md
   ```

2. **Analyze Test Requirements**
   - Determine test type (unit, integration, visual)
   - Identify test framework (Playwright, xUnit, etc.)
   - Load test patterns from knowledge base

3. **Create Tests**
   - Generate test files
   - Follow test-first principles
   - Use published patterns

4. **Run Tests**
   - Execute new tests
   - Report results
   - Capture failures

5. **Publish Patterns** (if successful)
   - Save successful test strategies
   - Document what worked
   - Add to knowledge base

---

## 💡 Test Types Supported

### Visual Regression Tests (Playwright + Percy)
```markdown
#file:KDS/prompts/user/test.md

Create visual regression tests for the FAB pulse animation
```

**Creates:**
- Playwright test file
- Percy snapshot integration
- Multiple scenarios (hover, click, animation states)

### Unit Tests (.NET/xUnit)
```markdown
#file:KDS/prompts/user/test.md

Create unit tests for the PDF generation service
```

**Creates:**
- xUnit test class
- Mock dependencies
- Test data fixtures

### Integration Tests (API)
```markdown
#file:KDS/prompts/user/test.md

Create integration tests for the /api/sessions/export endpoint
```

**Creates:**
- WebApplicationFactory test
- Database seeding
- API request/response validation

### End-to-End Tests (Playwright)
```markdown
#file:KDS/prompts/user/test.md

Create end-to-end test for the session export workflow
```

**Creates:**
- Multi-step Playwright test
- Real database interactions
- Full user journey

---

## 🎓 Examples

### Example 1: Visual Tests
```markdown
You: #file:KDS/prompts/user/test.md
     Create Percy visual tests for the FAB button pulse animation

KDS:
✅ Visual Regression Tests Created

File: Tests/UI/fab-pulse-animation.spec.ts

Tests Created:
  1. "FAB button default state"
     - Captures baseline FAB appearance
     
  2. "FAB pulse animation active"
     - Triggers pulse
     - Captures mid-animation
     
  3. "FAB pulse complete"
     - Waits for animation end
     - Verifies returned to normal

Percy: ✅ 3 snapshots captured
Tests: ✅ 3/3 passing

Pattern Published: knowledge/test-patterns/percy-css-animations.md
```

### Example 2: Unit Tests
```markdown
You: #file:KDS/prompts/user/test.md
     Create unit tests for SessionExportService

KDS:
✅ Unit Tests Created

File: Tests/Unit/Services/SessionExportServiceTests.cs

Tests Created:
  1. ExportToPdf_ValidSession_ReturnsSuccessResult
  2. ExportToPdf_InvalidSessionId_ThrowsNotFoundException
  3. ExportToPdf_IncludesAnnotations_WhenRequested
  4. ExportToPdf_IncludesParticipants_WhenRequested
  5. ExportToPdf_GeneratesValidPdfBytes

Mocks Created:
  - Mock<ISessionRepository>
  - Mock<IAnnotationRepository>
  - Mock<IPdfGenerator>

Tests: ✅ 5/5 passing
Coverage: 94%
```

### Example 3: Integration Tests
```markdown
You: #file:KDS/prompts/user/test.md
     Create integration tests for the export API endpoint

KDS:
✅ Integration Tests Created

File: Tests/Integration/Api/SessionExportControllerTests.cs

Tests Created:
  1. GET_Export_ValidSession_Returns200AndPdf
  2. GET_Export_InvalidSession_Returns404
  3. GET_Export_UnauthorizedUser_Returns403
  4. GET_Export_LargeSession_CompletesWithin5Seconds

Test Database:
  ✅ Seeded with session 212 (known good test data)
  ✅ Added 50 annotations
  ✅ Added 12 participants

Tests: ✅ 4/4 passing
Performance: All under 2s
```

---

## 🔍 Test Pattern Loading

KDS loads successful patterns from knowledge base:

### Visual Test Patterns
```
#file:KDS/knowledge/test-patterns/playwright-element-selection.md
#file:KDS/knowledge/test-patterns/percy-css-animations.md
```

### Test Data
```
#file:KDS/knowledge/test-data/session-212.md
```

### UI Mappings (Rule #15)
```
#file:KDS/knowledge/ui-mappings/host-control-panel-elements.md
```

---

## 🎯 Test-First Workflow

KDS follows test-first principles (Rule #8):

### Step 1: Create Failing Test
```typescript
test('FAB pulse animation triggers on new question', async ({ page }) => {
  await page.goto('/host/session/212');
  
  // Expect animation class to be applied
  await expect(page.getByTestId('fab-share-button')).toHaveClass(/pulse/);
});
```

**Result:** ❌ FAILS (animation not implemented yet)

### Step 2: Implement Feature
```css
@keyframes fab-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.fab-share-button.pulse {
  animation: fab-pulse 2s ease-in-out;
}
```

### Step 3: Run Test Again
**Result:** ✅ PASSES

### Step 4: Publish Pattern
```
Knowledge published: test-patterns/percy-css-animations.md
Includes: What worked, what didn't work, reliable selectors
```

---

## ⚠️ Test Failures

### Handling Failed Tests
```markdown
You: #file:KDS/prompts/user/test.md
     Create tests for the export button

KDS:
❌ Test Creation Failed

File: Tests/UI/export-button.spec.ts

Tests Created:
  ✅ "Export button visible to host"
  ❌ "Export button triggers modal"
     
Error: Selector not found: [data-testid="export-modal"]
Reason: Modal element missing data-testid attribute

Action Required:
  1. Add data-testid="export-modal" to modal element
  2. Re-run test creation
  
Next: #file:KDS/prompts/user/execute.md
      (Implement missing data-testid first)
```

---

## 🔧 Behind the Scenes

### This Prompt Loads:
```markdown
#file:KDS/prompts/internal/test-generator.md
```

### Test Generator Reads:
```markdown
#file:KDS/knowledge/test-patterns/ (successful strategies)
#file:KDS/knowledge/test-data/ (validated data)
#file:KDS/knowledge/ui-mappings/ (element selectors)
#file:KDS/governance/rules.md (Rule #8: Test-First, Rule #15: UI IDs)
#file:KDS/prompts/shared/test-first.md (TDD workflow)
```

### Test Generator Creates:
```
Tests/{type}/{feature}.spec.ts (or .cs)
KDS/knowledge/test-patterns/{pattern}.md (if publishable)
```

---

## ✅ Success Criteria

**Test creation succeeds when:**
- ✅ Tests created for all scenarios
- ✅ Tests use proper selectors (data-testid preferred)
- ✅ Tests follow naming conventions
- ✅ All tests pass
- ✅ Patterns published (if >3 reuses)

---

## 🚀 Integration with Execution

**Tests can be created during execution:**
```markdown
(Planning includes test phase)

You: #file:KDS/prompts/user/execute.md
(implements features in Phase 1)

You: #file:KDS/prompts/user/execute.md
(auto-creates tests in Phase 2 - test task)

Or create tests explicitly:

You: #file:KDS/prompts/user/test.md
     Create visual tests for dark mode toggle
```

---

**Ready to create tests!** 🧪
