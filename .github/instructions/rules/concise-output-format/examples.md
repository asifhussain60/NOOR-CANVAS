# Examples: Concise Output Format

**Rule:** `concise-output-format` (Combined: No Code in Chat + Strict Conciseness)  
**Version:** 2.0.0

---

## ✅ Compliant Examples

### Example 1: Simple Task Response (ask.prompt.md)

```markdown
🧠 Analysis
- Key: share-asset-button
- Routing: ask → question.prompt.md
- Complexity: Simple
- Layers: UI only
- Files: 1 modified (AssetProcessingService.cs)

📌 Answer
1. Share button missing because ShareButton component not imported
2. File: SessionCanvas.razor (line 84) - missing @using statement
3. Integration: Add @using directive for ShareButton component
4. Method: ShareCanvas() already exists (line 142) - event handler ready
5. Styling: ks-share-button class available in site.css

📊 Next Steps
- Recommended: See Option A below
- Files: SessionCanvas.razor, site.css
- Documentation: See session-canvas-share-button.plan.md for details
- Options: See below

## What would you like to do next?

💡 **Recommended: A** (Simple single-file fix)

**A.** **IMPLEMENT IMMEDIATELY** (add @using directive)
**B.** Turn Into Plan (if multi-phase needed)
**C.** Ask Follow-up Question
**D.** Nothing, I'm All Set
```

**Why compliant:**
- Part 1 (No Code): No code blocks or snippets ✓
- Part 2 (Conciseness): Total bullets: 14 (≤25) ✓
- Max lines per bullet: 1 (≤3) ✓
- Letter-based options with recommended in **ALL CAPS** ✓
- Structured sections (🧠/📌/📊) ✓
- Architectural descriptions only ✓

---

### Example 2: Multi-Phase Plan Response (plan.prompt.md)

```markdown
🧠 Plan Summary
- Plan finalized for key: transcript-canvas-visual-tests
- Total phases: 3 (moderate complexity)
- Files created: plan.md, plan.json, work-log.md
- Location: .github/key-data-streams/transcript-canvas-visual-tests/
- Ready for execution via task.prompt.md

📌 Plan Overview
1. **Phase 1:** Setup Percy + Dependencies (3 tasks, 2 files)
2. **Phase 2:** Create Test Spec (4 tasks, 3 files)
3. **Phase 3:** Execute + Verify (2 tasks, 1 file)
4. **Test Strategy:** Percy visual regression (5 snapshots)
5. **Rollback:** Checkpoint commits after each phase
6. **Handoff:** task.prompt.md + test-generation.prompt.md
7. **First Phase:** Setup Percy project configuration
8. **Estimated Scope:** UI + Testing layers
9. **Dependencies:** Percy account required
10. **Next Step:** Auto-executing in 5 seconds

📋 Phases & Tasks
**Phase 1: Setup**
- Task 1.1: Create Percy project - Percy dashboard configured
- Task 1.2: Install dependencies - package.json updated
- Task 1.3: Configure Percy - .percy.yml created

**Phase 2: Implementation**
- Task 2.1: Create test spec - Tests/UI/transcript-canvas-visual.spec.ts
- Task 2.2: Add 5 snapshots - Viewport variations captured
- Task 2.3: Create orchestration script - Scripts/run-transcript-canvas-visual-tests.ps1
- Task 2.4: Update README - Testing documentation added

**Phase 3: Verification**
- Task 3.1: Run tests - Verify Percy integration
- Task 3.2: Review dashboard - Confirm snapshots uploaded

⚡ Options
**A.** **AUTO-EXECUTE ALL PHASES** (recommended, starts in 5s)
**B.** Manual Mode (approve each phase)
**C.** Review Plan Files
**D.** Modify Plan Scope
**E.** Cancel Planning
```

**Why compliant:**
- Part 1 (No Code): No code blocks or snippets ✓
- Part 2 (Conciseness): Total bullets: 35 (≤40 for plan.prompt.md) ✓
- Plan Summary: 5 bullets ✓
- Plan Overview: 10 bullets ✓
- Phases & Tasks: 15 bullets ✓
- Options: 5 bullets ✓
- Max lines per bullet: 1 (≤3) ✓
- Recommended option in **ALL CAPS** ✓
- Phase breakdown is architectural summary, not implementation code ✓

---

## ❌ Non-Compliant Examples

### Example 1: Contains Code Block (Violates Part 1)

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
- ❌ Contains code block (violates Part 1: No Code in Chat)
- ❌ Recommended option not in **ALL CAPS** (violates Part 2)

**Fix:**
```markdown
📌 Summary
1. Added Share Asset button to asset container
2. Method: CreateShareButtonHtml() added at line 384
3. Returns: HTML string with ks-share-button class
4. Integration: Called by CreateAssetContainerHeaderHtml()
5. Implementation: See share-asset-button.plan.md for details

**A.** **TEST BUTTON** (recommended)
**B.** Modify Styling
**C.** Review Changes
```

---

### Example 2: Contains Code Snippets (Violates Part 1)

```markdown
📌 Answer
1. Registration form needs validation
2. Add FluentValidation:
   - Install-Package FluentValidation.AspNetCore
   - Create UserRegistrationValidator.cs with rules:
     RuleFor(x => x.Email).NotEmpty().EmailAddress();
     RuleFor(x => x.Password).MinimumLength(8);
3. Register in Program.cs:
   builder.Services.AddValidatorsFromAssemblyContaining<UserRegistrationValidator>();
```

**Why non-compliant:**
- ❌ Contains inline code snippets (violates Part 1: No Code in Chat)
- ❌ Method calls and code patterns shown (RuleFor, builder.Services.AddValidators)

**Fix:**
```markdown
📌 Answer
1. Registration form needs FluentValidation package
2. Create: UserRegistrationValidator.cs with email + password rules
3. Register: Program.cs service registration required
4. Rules: Email format validation, 8-char minimum password
5. Implementation: See user-registration-validation.plan.md for details
```

---

### Example 3: Too Many Bullets (Violates Part 2)

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
- Constraints: None
- Testing: Manual

📌 Summary
1. Added Share Asset button
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
- ❌ Total bullets: 30 (exceeds 25 limit for non-plan prompts) - violates Part 2
- ❌ Too granular - should consolidate related items
- ❌ Missing letter-based options - violates Part 2

**Fix:** Consolidate bullets, add letter options (see Example 1)

---

### Example 4: Bullets Too Long (Violates Part 2)

```markdown
📌 Summary
1. Key: share-asset-button | Status: Complete - Added Share Asset button to asset container header with blue styling
   Integration point: CreateAssetContainerHeaderHtml calls new CreateShareButtonHtml method (line 384)
   Testing: Manual verification in session 215, confirmed button renders with correct styling and accessibility attributes
   Files modified: AssetProcessingService.cs (1 file, 12 lines changed, 1 method added)
```

**Why non-compliant:**
- ❌ Bullet 1 has 4 lines (exceeds 3 line limit) - violates Part 2

**Fix:** Split into multiple bullets:
```markdown
📌 Summary
1. Key: share-asset-button | Status: Complete
2. Work: Added Share Asset button to asset container header
3. Method: CreateShareButtonHtml() added at line 384
4. Integration: Called by CreateAssetContainerHeaderHtml()
5. Testing: Manual verification in session 215
6. Files: AssetProcessingService.cs (12 lines changed)
```

---

### Example 5: Nested Lists (Violates Part 2)

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
- ❌ Contains nested list structure (indented sub-bullets) - violates Part 2
- ❌ Violates flat structure requirement

**Fix:** Convert to flat bullet list:
```markdown
📌 Summary
1. Added Share Asset button to asset container
2. Method: CreateShareButtonHtml() added
3. Returns: HTML string with ks-share-button class
4. Integration: Called by CreateAssetContainerHeaderHtml()
5. Location: Action bar in asset header
6. Testing: Complete - verified in session 215
```

---

### Example 6: Plan Exceeds 40 Bullets (Violates Part 2 Special Exception)

```markdown
🧠 Plan Summary (6 bullets)
...

📌 Plan Overview (12 bullets)
...

📋 Phases & Tasks (25 bullets)
**Phase 1:** ...
- Task 1.1: ...
- Task 1.2: ...
... (20 more task bullets)

⚡ Options (5 bullets)
...
```

**Why non-compliant:**
- ❌ Total bullets: 48 (exceeds 40 limit even for plan.prompt.md) - violates Part 2

**Fix:** Consolidate phase tasks or reduce overview bullets to stay within 40 total

---

## 🎯 Quick Reference

**Compliant Response Checklist:**

**Part 1: No Code in Chat**
- [ ] Zero code blocks (```language)
- [ ] Zero code snippets (method bodies, HTML, CSS, SQL)
- [ ] Architectural descriptions only (file paths, method names, flow)
- [ ] Implementation → {key}.plan.md reference

**Part 2: Strict Conciseness**
- [ ] Total bullets ≤25 (≤40 for plan.prompt.md)
- [ ] Each bullet ≤3 lines
- [ ] No nested lists (flat structure)
- [ ] No paragraphs (bullets only)
- [ ] Letter-based options (2-6 choices)
- [ ] Recommended option in **ALL CAPS**
- [ ] Structured sections (🧠/📌/📊 or 📋)

---

**Last Updated:** 2025-10-31  
**Maintainer:** System  
**Version:** 2.0.0
