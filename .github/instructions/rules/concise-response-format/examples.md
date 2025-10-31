# Examples: Concise Response Format

**Rule:** `concise-response-format`  
**Version:** 1.0.0

---

## ✅ Compliant Examples

### Example 1: Simple Task Response

```markdown
🧠 Analysis
- Key: share-asset-button
- Routing: task.prompt.md
- Complexity: Simple
- Layers: UI only
- Files: 1 modified

📌 Summary
1. Key: share-asset-button | Status: Complete
2. Work: Added Share Asset button to asset container header
3. Files: 1 modified (AssetProcessingService.cs)
4. Method: CreateShareButtonHtml() added (line 384)
5. Button: Blue action bar with share icon + text
6. Integration: Called by CreateAssetContainerHeaderHtml()
7. Testing: Manual verification in session 215

📊 Final
- Status: Complete
- Key: share-asset-button
- Documentation: work-log.md updated
- Next: Test button functionality
- Options: See below

**A.** **TEST BUTTON** (recommended)
**B.** Review Changes
**C.** Modify Styling
```

**Why compliant:**
- Total bullets: 15 (≤25) ✓
- Max lines per bullet: 1 (≤3) ✓
- No code blocks ✓
- Letter-based options with recommended in ALL CAPS ✓
- Structured sections ✓

---

### Example 2: Multi-Phase Plan Response

```markdown
🧠 Analysis
- Key: transcript-canvas-visual-tests
- Routing: plan.prompt.md
- Complexity: Moderate
- Layers: UI, Testing
- Phases: 3 (Setup, Implementation, Verification)
- Dependencies: Percy account, Playwright config

📌 Summary
1. Key: transcript-canvas-visual-tests | Status: Plan Ready
2. Work: Add visual regression tests for transcript canvas
3. Files: 4 new (test spec, orchestration script, Percy config, README)
4. Phase 1: Setup Percy project + install dependencies
5. Phase 2: Create test spec with 5 visual snapshots
6. Phase 3: Run tests + verify Percy dashboard
7. Orchestration: Use Scripts/run-transcript-canvas-visual-tests.ps1
8. Testing: Automated (Percy visual regression)

📋 Tasks
- Phase 1: Setup (15 min)
- Phase 2: Implementation (30 min)
- Phase 3: Verification (10 min)
- Total: ~55 minutes estimated

📊 Final
- Status: Plan ready for execution
- Key: transcript-canvas-visual-tests
- Documentation: transcript-canvas-visual-tests.plan.md created
- Next: Execute plan (auto-chain or manual)
- Options: See below

**A.** **AUTO-EXECUTE ALL PHASES** (recommended, starts in 5s)
**B.** Manual mode (approve each phase)
**C.** Review Plan Details
**D.** Modify Approach
```

**Why compliant:**
- Total bullets: 21 (≤25) ✓
- Max lines per bullet: 1 (≤3) ✓
- Includes Tasks section for multi-phase plan ✓
- Recommended option in ALL CAPS with countdown ✓
- Structured sections ✓

---

## ❌ Non-Compliant Examples

### Example 1: Too Many Bullets

```markdown
🧠 Analysis
- Key: share-asset-button
- Routing: task.prompt.md
- Complexity: Simple
- Layers: UI only
- Files: 1 modified
- Dependencies: None
- Risks: None
- Prerequisites: None

📌 Summary
1. Added Share Asset button to asset container
2. Modified AssetProcessingService.cs
3. Created CreateShareButtonHtml method
4. Method returns HTML string
5. Button has ks-share-button class
6. Button shows share icon
7. Button shows "Share Asset" text
8. Button appears in action bar
9. Action bar has blue background
10. Action bar uses ks-action-bar class
11. Called by CreateAssetContainerHeaderHtml
12. Integrated with existing header logic
13. Tested in session 215
14. Verified button renders correctly
15. Verified styling matches design
16. Verified accessibility attributes
17. Added logging for button creation
18. Updated work-log.md
19. Committed changes to git
20. No breaking changes

📊 Final
- Status: Complete
- Next: Test functionality
```

**Why non-compliant:**
- Total bullets: 28 (exceeds 25 limit) ❌
- Too granular - should consolidate related items
- Missing letter-based options ❌

**Fix:** Consolidate bullets, add letter options

---

### Example 2: Bullets Too Long

```markdown
📌 Summary
1. Key: share-asset-button | Status: Complete - Added Share Asset button to asset container header with blue styling
   Integration point: CreateAssetContainerHeaderHtml calls new CreateShareButtonHtml method (line 384)
   Testing: Manual verification in session 215, confirmed button renders with correct styling and accessibility attributes
   Files modified: AssetProcessingService.cs (1 file, 12 lines changed, 1 method added)
```

**Why non-compliant:**
- Bullet 1 has 4 lines (exceeds 3 line limit) ❌
- Too much detail packed into single bullet

**Fix:** Split into multiple bullets

---

### Example 3: Missing Letter Options

```markdown
🧠 Analysis
- Key: share-asset-button
- Status: Complete

📌 Summary
1. Added Share Asset button
2. Modified AssetProcessingService.cs
3. Testing complete

📊 Final
- Status: Complete
- Next steps: You can now test the button in the UI, or I can help you add click handlers next.
```

**Why non-compliant:**
- Missing letter-based action options ❌
- Has paragraph text in Final section ❌
- No recommended option in ALL CAPS

**Fix:** Add A/B/C options with recommended in ALL CAPS

---

### Example 4: Nested Lists

```markdown
📌 Summary
1. Added Share Asset button
   - Created CreateShareButtonHtml method
     - Returns HTML string
     - Uses ks-share-button class
   - Integrated with header
     - Called by CreateAssetContainerHeaderHtml
     - Appears in action bar
2. Testing complete
```

**Why non-compliant:**
- Contains nested list structure (indented sub-bullets) ❌
- Violates flat structure requirement

**Fix:** Convert to flat bullet list

---

### Example 5: Contains Code

```markdown
📌 Summary
1. Added Share Asset button to asset container
2. Created new method in AssetProcessingService.cs:
   ```csharp
   private string CreateShareButtonHtml()
   {
       return $"<div class='ks-action-bar'><button class='ks-share-button'>Share Asset</button></div>";
   }
   ```
3. Integrated with existing header logic

**Options:**
A. Test button
B. Modify styling
```

**Why non-compliant:**
- Contains code block (violates Rule #1) ❌
- Recommended option not in ALL CAPS ❌

**Fix:** Remove code block, reference {key}.plan.md, format recommended option

---

## 🎯 Quick Reference

**Compliant Response Checklist:**
- [ ] Total bullets ≤25
- [ ] Each bullet ≤3 lines
- [ ] No code blocks or snippets
- [ ] No nested lists (flat structure)
- [ ] No paragraphs (bullets only)
- [ ] Letter-based options (2-5 choices)
- [ ] Recommended option in **ALL CAPS**
- [ ] Structured sections (Analysis, Summary, Final)
- [ ] Architectural descriptions only
- [ ] Implementation details → {key}.plan.md

---

**Last Updated:** 2025-10-31  
**Maintainer:** System  
**Version:** 1.0.0
