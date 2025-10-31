# Rule: Concise Output Format (No Code in Chat + Strict Conciseness)

**ID:** `concise-output-format`  
**Category:** Output Formatting  
**Severity:** Critical  
**Version:** 2.0.0  
**Created:** 2025-10-31  
**Supersedes:** Rules #1 (No Code in Chat) and #4 (Concise Response Format)

---

## 📋 Rule Statement

**User-facing responses MUST comply with TWO mandatory constraints:**

### Part 1: No Code in Chat (STRICT - ALWAYS ENFORCED)
- **ZERO implementation code** in user-facing responses
- **ZERO pseudocode** or algorithm implementations
- Only architectural descriptions allowed (file paths, method names, data flow)
- All implementation code → Key Data Stream files (`.github/key-data-streams/{key}/`)

### Part 2: Conciseness Guidelines (FLEXIBLE - PROMPT-SPECIFIC)
- **Max bullets**: Recommended limits (see Prompt-Specific Adaptations)
- **Max 3 lines** per bullet (strict for readability)
- **Letter-based options** with recommended choice in **ALL CAPS** (strict)
- **Structure**: Each prompt defines its own sections (plan uses Phase→Task, ask uses 🧠/📌/📊, etc.)

---

## 🎯 Hard Limits

| Constraint | Limit | Enforcement | Flexibility |
|------------|-------|-------------|-------------|
| Code blocks | 0 allowed | **STRICT** - Auto-block if any code blocks detected | None - always enforced |
| Code snippets | 0 allowed | **STRICT** - Auto-block if method bodies, HTML, CSS, SQL detected | None - always enforced |
| Pseudocode | 0 allowed | **STRICT** - Auto-block if algorithm implementations detected | None - always enforced |
| Lines per bullet | 3 max | **STRICT** - Auto-block response if exceeded | None - readability requirement |
| Action options | 2-6 letters | **STRICT** - Must include recommended option in **ALL CAPS** | None - always enforced |
| Total bullets | Varies by prompt | **FLEXIBLE** - See prompt-specific limits below | Each prompt defines own limit |
| Structure | Varies by prompt | **FLEXIBLE** - Each prompt defines sections | plan uses Phase→Task, ask uses 🧠/📌/📊 |
| Nested lists | 0 allowed | **RECOMMENDED** - Flat structure preferred | Exceptions allowed for phase breakdown |
| Paragraphs | 0 allowed | **RECOMMENDED** - Bullets preferred | Brief prose allowed in context sections |

---

## ❌ PROHIBITED Content (Part 1: No Code in Chat)

**NEVER in user-facing responses:**
- C# methods, classes, properties (`public void`, `private string`, etc.)
- JavaScript/TypeScript functions (`function`, `const`, `let`, arrow functions)
- HTML tags and structure (`<div>`, `<span>`, `<button>` with attributes)
- CSS rules and selectors (`.class { property: value }`)
- SQL queries (`SELECT`, `INSERT`, `UPDATE`, `DELETE` statements)
- Razor markup (`@code` blocks, `@inject`, component syntax)
- Long paragraphs or narrative explanations
- Nested bullet lists
- Step-by-step implementation details

---

## ✅ ALLOWED Content

**Architectural descriptions:**
- File paths with line numbers: `AssetProcessingService.cs` (lines 361-394)
- Method signatures: `ShareAsset(string shareId, string assetType)`
- Data flow: Component A → Service B → Hub C → Client D
- Change summaries: Added `CreateShareButtonHtml` method, returns HTML string
- Data structures: Key-value pairs in text format (`key: value`)

**Configuration (limited):**
- JSON settings for `appsettings.json` (≤10 lines, no logic)
- PowerShell/Git commands for operations (exact commands only)
- Error messages for debugging (truncated, relevant portions)

---

## 📐 Response Structure Examples (Part 2: Flexible Structure)

**CRITICAL:** Each prompt defines its OWN structure. Rule #1 enforces:
- ✅ **No code/pseudocode** (STRICT - always enforced)
- ✅ **Max 3 lines per bullet** (STRICT - readability requirement)
- ✅ **Letter options with recommended in ALL CAPS** (STRICT - always enforced)
- ✅ **Prompt-specific bullet limits** (FLEXIBLE - see below)
- ✅ **Prompt-specific sections** (FLEXIBLE - each prompt defines own format)

---

### ask.prompt.md Format

```markdown
🧠 Analysis (≤8 bullets, 3 lines each)
- Key: {question-topic}
- Routing: ask → question.prompt.md
- Depth: {quick|standard|comprehensive}
- Context: {files-analyzed}

📌 Answer (≤15 bullets, 3 lines each)
1. {answer-point-1}
2. {architectural-flow}
3. {file-locations}
4. {method-signatures-only}

📊 Next Steps (≤5 bullets)
- Recommended: See Option A below
- Files: {relevant-paths}
- Options: See below

## What would you like to do next?

**A.** **TURN INTO PLAN** (recommended)
**B.** Add to Current Work
**C.** Implement Immediately
**D.** Generate Tests
**E.** Ask Follow-up
**F.** Nothing
```

**Bullet Limit:** Max 25 total (8+15+5 = 28, leave buffer for flexibility)

---

### plan.prompt.md Format (Uses Phase → Task Structure)

```markdown
🧠 Plan Summary (≤5 bullets)
- Plan finalized for key: {key}
- Total phases: {count}
- Complexity: {simple|moderate|complex}
- Location: .github/key-data-streams/{key}/

📌 Plan Overview (≤10 bullets)
1. **Phase 1:** {title} ({task-count} tasks)
2. **Phase 2:** {title} ({task-count} tasks)
3. **Test Strategy:** {test-types}
4. **Rollback:** {checkpoint-strategy}
5. **Next Step:** {auto-execute-or-wait}

📋 Phase Breakdown
**Phase 1: {Title}**
- Task 1.1: {action} - {expected-outcome}
- Task 1.2: {action} - {expected-outcome}

**Phase 2: {Title}**
- Task 2.1: {action} - {expected-outcome}
- Task 2.2: {action} - {expected-outcome}

**Phase 3: {Title}**
- Task 3.1: {action} - {expected-outcome}

⚡ Options
**A.** **AUTO-EXECUTE ALL PHASES** (recommended, starts in 5s)
**B.** Manual Mode
**C.** Review Plan Files
**D.** Modify Plan
**E.** Cancel
```

**Bullet Limit:** Flexible - 30-50 bullets recommended (complexity-dependent)

**Planning Output Format Exception:**

Unlike concise Q&A responses (ask.prompt.md limited to 25 bullets), planning agents require detailed phase/task breakdowns:
- **plan.prompt.md**: 30-50 bullets (varies by plan complexity)
- **todo.prompt.md**: 20 bullets (extending existing plans)
- **route.prompt.md**: 25 bullets (standard routing)
- **Rationale**: Users need complete task visibility before approving multi-phase execution

**CRITICAL for plan.prompt.md:**
- Phase → Task breakdown is **architectural summary**, NOT implementation code
- Each task bullet describes WHAT to do, not HOW (no code/pseudocode)
- Example: ✅ "Task 1.1: Add ShareButton component - imports component in SessionCanvas.razor"
- Example: ❌ "Task 1.1: Add `@using ShareButton` and `<ShareButton onClick={handleShare} />`"

---

### todo.prompt.md Format

```markdown
🧠 Analysis (≤5 bullets)
- Key: {key}
- Task: {task-description}
- Context: {existing-work}

📌 Task Added (≤10 bullets)
1. Task: {what-was-added}
2. Files: {affected-files}
3. Integration: {how-it-fits}

📊 Next (≤5 bullets)
- Status: Task added to queue
- Options: See below

**A.** **CONTINUE** (recommended)
**B.** Review Work Log
**C.** Pause
```

**Bullet Limit:** Max 20 total

---

### task.prompt.md Format

```markdown
🧠 Context (≤5 bullets)
- Key: {key}
- Phase: {current-phase}
- Tasks: {task-count}

📌 Execution (≤15 bullets)
1. Task 1: {action-taken}
2. Task 2: {action-taken}
3. Files: {modified-files}

📊 Complete (≤5 bullets)
- Status: Phase complete
- Next: {next-phase-or-finish}

**A.** **CONTINUE TO NEXT PHASE** (recommended)
**B.** Review Changes
**C.** Pause
```

**Bullet Limit:** Max 25 total

---

## 🔤 Letter-Based Action Options (MANDATORY)

**All responses MUST provide 2-6 options with recommended option in ALL CAPS:**

```markdown
**A.** **RECOMMENDED OPTION** (reason - starts in 5s if auto-chain)
**B.** Alternative Option 1
**C.** Alternative Option 2
**D.** Alternative Option 3 (optional)
**E.** Alternative Option 4 (optional)
**F.** Cancel / Nothing
```

**Formatting Requirements:**
- Recommended option: Use **bold** + **ALL CAPS** for prominence
- For multi-phase plans: Option A (auto-chain) is RECOMMENDED with 5s countdown
- For single actions: Option A is RECOMMENDED
- Alternative: Increase font size using heading (e.g., `### A. AUTO-EXECUTE ALL PHASES`)
- User replies: "A", "manual", "cancel", or waits 5s for auto-execution

**Smart Recommendations:**
- **Recommend A** when action is clear next step (auto-execute, continue, implement)
- **Recommend B-F** only when user should carefully consider alternatives
- Always include reason for recommendation in parentheses

---

## 📂 File Locations for Details

**All implementation code → Key Data Stream files:**
- `.github/key-data-streams/{key}/{key}.plan.md` - Complete method implementations
- `.github/key-data-streams/{key}/work-log.md` - HTML/CSS/SQL examples, detailed logs
- `.github/key-data-streams/{key}/{key}.plan.json` - Structured plan metadata
- User-facing output → Architectural summaries ONLY

**Example Reference:**
```markdown
📌 Summary
1. Added ShareAsset button to asset container header
2. Method: CreateShareButtonHtml() added at line 384
3. Integration: Called by CreateAssetContainerHeaderHtml()
4. Implementation: See {key}.plan.md section "Phase 2 Implementation"
5. Testing: Manual verification in session 215
```

---

## 🔍 Validation Algorithm

```
FUNCTION ValidateConciseOutputFormat(response):
  
  violations = []
  
  # PART 1: Validate No Code in Chat
  codeViolations = ValidateNoCodeInChat(response)
  IF codeViolations.Count > 0 THEN
    violations.ADD(codeViolations)
  END IF
  
  # PART 2: Validate Strict Conciseness
  
  # Count total bullets
  bulletCount = CountBullets(response)
  
  # Check against prompt-specific recommendations (WARNING, not AUTO-BLOCK)
  recommendedLimit = GetPromptRecommendedBulletLimit(currentPrompt)
  IF bulletCount > recommendedLimit THEN
    violations.ADD({
      rule: "concise-output-format",
      part: "conciseness-recommendation",
      violation: "Exceeds recommended bullet limit (not blocking)",
      actual: bulletCount,
      recommended: recommendedLimit,
      severity: "warning",
      suggestedFix: "Consider consolidating bullets or moving details to {key}.plan.md"
    })
  END IF
  
  # Note: Bullet count is FLEXIBLE - no AUTO-BLOCK for exceeding limits
  # Only strict constraints (no code, 3 lines/bullet, letter options) AUTO-BLOCK
  # Planning Exception: plan.prompt.md (30-50), todo.prompt.md (20), route.prompt.md (25)
  
  # Check lines per bullet
  FOR EACH bullet IN response.bullets:
    lineCount = CountLines(bullet)
    IF lineCount > 3 THEN
      violations.ADD({
        rule: "concise-output-format",
        part: "strict-conciseness",
        violation: "Bullet exceeds 3 line limit",
        bullet: TruncateText(bullet, 50),
        actual: lineCount,
        suggestedFix: "Split into multiple bullets or move to documentation"
      })
    END IF
  END FOR
  
  # Check for nested lists
  IF HasNestedLists(response) THEN
    violations.ADD({
      rule: "concise-output-format",
      part: "strict-conciseness",
      violation: "Contains nested lists (flat structure required)",
      suggestedFix: "Convert to flat bullet structure"
    })
  END IF
  
  # Check for paragraphs
  IF HasParagraphs(response) THEN
    violations.ADD({
      rule: "concise-output-format",
      part: "strict-conciseness",
      violation: "Contains paragraphs (bullets only)",
      suggestedFix: "Convert prose to bullet points"
    })
  END IF
  
  # Check for letter-based options
  IF NOT HasLetterOptions(response) THEN
    violations.ADD({
      rule: "concise-output-format",
      part: "strict-conciseness",
      violation: "Missing letter-based action options",
      suggestedFix: "Add A/B/C/D options with recommended choice in ALL CAPS"
    })
  END IF
  
  # Check recommended option formatting
  IF HasLetterOptions(response) AND NOT HasRecommendedInAllCaps(response) THEN
    violations.ADD({
      rule: "concise-output-format",
      part: "strict-conciseness",
      violation: "Recommended option not in ALL CAPS",
      suggestedFix: "Format recommended option as **ALL CAPS**"
    })
  END IF
  
  # Return result
  IF violations.Count > 0 THEN
    RETURN { compliant: false, violations: violations }
  ELSE
    RETURN { compliant: true }
  END IF
  
END FUNCTION


FUNCTION ValidateNoCodeInChat(response):
  
  violations = []
  
  # Check for code blocks
  codeBlocks = FindCodeBlocks(response) # ```csharp, ```js, etc.
  IF codeBlocks.Count > 0 THEN
    FOR EACH block IN codeBlocks:
      violations.ADD({
        rule: "concise-output-format",
        part: "no-code-in-chat",
        violation: "Contains code block",
        language: block.language,
        preview: TruncateText(block.content, 50),
        suggestedFix: "Move to {key}.plan.md, reference file path only"
      })
    END FOR
  END IF
  
  # Check for code snippets (inline code with prohibited patterns)
  IF ContainsCodeSnippets(response) THEN
    snippets = ExtractCodeSnippets(response)
    FOR EACH snippet IN snippets:
      violations.ADD({
        rule: "concise-output-format",
        part: "no-code-in-chat",
        violation: "Contains code snippet",
        type: snippet.type, # method, HTML, CSS, SQL
        preview: TruncateText(snippet.content, 50),
        suggestedFix: "Replace with architectural description or file reference"
      })
    END FOR
  END IF
  
  RETURN violations
  
END FUNCTION


FUNCTION GetPromptRecommendedBulletLimit(promptName)
  
  # Planning agents - flexible limits based on complexity
  IF promptName == "plan.prompt.md" THEN
    RETURN 50  # Complex multi-phase plans can use 30-50
  ELSE IF promptName == "todo.prompt.md" THEN
    RETURN 20  # Plan extensions
  ELSE IF promptName == "route.prompt.md" THEN
    RETURN 25  # Standard routing
  
  # Q&A agents - strict 25 bullet limit
  ELSE IF promptName == "ask.prompt.md" THEN
    RETURN 25
  ELSE IF promptName == "task.prompt.md" THEN
    RETURN 25
  ELSE IF promptName == "test-generation.prompt.md" THEN
    RETURN 25
  ELSE IF promptName == "drift.prompt.md" THEN
    RETURN 25  # Drift summaries (planning mode can use more)
  ELSE IF promptName == "healthcheck.prompt.md" THEN
    RETURN 25
  
  # Default
  ELSE
    RETURN 25
  END IF
  
END FUNCTION
```

---

## 🛠️ Enforcement Actions

**Before sending ANY user-facing output:**

1. **Scan for code blocks** → ZERO allowed (```csharp, ```js, ```html, ```css, ```sql, ```razor)
2. **Scan for code snippets** → ZERO allowed (method bodies, HTML structures, CSS rules, SQL statements)
3. **Count bullets** → Check against prompt-specific limits (plan: 50, todo: 20, others: 25)
4. **Check line length** → Must be ≤3 lines per bullet
5. **Scan for nested lists** → ZERO allowed (exception: Phase headers in plan.prompt.md)
6. **Scan for paragraphs** → ZERO allowed (bullets only)
7. **Verify letter options** → Must include 2-6 options
8. **Check recommended formatting** → Must be in **ALL CAPS**
9. **Violations** → AUTO-BLOCK response, rewrite to comply

**Auto-fail triggers (STRICT - always block):**
- Any code block (```language)
- Code snippets (method implementations, HTML structures, CSS rules, SQL queries)
- Pseudocode or algorithm implementations
- Any bullet exceeding 3 lines
- Missing letter-based action options
- Recommended option not in ALL CAPS

**Warning triggers (FLEXIBLE - suggest improvement, don't block):**
- Exceeding prompt-specific recommended bullet limits
- Nested list structures (allowed for phase breakdown)
- Paragraph text in non-context sections (brief prose allowed)

---

## 📊 Prompt-Specific Adaptations

**Each prompt defines its own structure. Rule #1 enforces core constraints only.**

### STRICT Constraints (All Prompts)
- ❌ **No code blocks** (```language) - AUTO-BLOCK
- ❌ **No code snippets** (method bodies, HTML, CSS, SQL) - AUTO-BLOCK
- ❌ **No pseudocode** (algorithm implementations) - AUTO-BLOCK
- ✅ **Max 3 lines per bullet** - AUTO-BLOCK if exceeded
- ✅ **Letter options with recommended in ALL CAPS** - AUTO-BLOCK if missing

### FLEXIBLE Constraints (Prompt-Specific)

#### ask.prompt.md
- **Recommended limit:** 25 bullets total
- **Structure:** 🧠 Analysis, 📌 Answer, 📊 Next Steps
- **Sections:** Define bullet allocations as needed
- **Options:** A-F (handoff to plan/todo/task/test-generation)

#### plan.prompt.md
- **Recommended limit:** 30-50 bullets (flexible based on complexity)
- **Structure:** Uses **Phase → Task** breakdown (NOT 📋 Tasks format)
- **Format:** 
  - 🧠 Plan Summary (brief)
  - 📌 Plan Overview (phase list)
  - **Phase 1:** Title → Tasks (architectural, NO code)
  - **Phase 2:** Title → Tasks (architectural, NO code)
  - ⚡ Options
- **Task bullets:** Describe WHAT to do, not HOW (no implementation code)
- **Options:** A-E with auto-execute default

#### todo.prompt.md
- **Recommended limit:** 20 bullets total
- **Structure:** 🧠 Analysis, 📌 Task Added, 📊 Next
- **Options:** A-D (continue/pause)

#### task.prompt.md
- **Recommended limit:** 25 bullets total
- **Structure:** 🧠 Context, 📌 Execution, 📊 Complete
- **Options:** A-D (next phase/finish)

---

### Key Principle: Structure Flexibility

**Rule #1 does NOT mandate:**
- ❌ Specific emoji sections (🧠/📌/📊) - prompts choose their own
- ❌ Exact bullet counts per section - prompts adapt to content
- ❌ Fixed section names - prompts use appropriate headings
- ❌ Uniform structure across all prompts - each prompt optimizes for its purpose

**Rule #1 DOES mandate:**
- ✅ No code/pseudocode in chat (STRICT)
- ✅ Max 3 lines per bullet (STRICT)
- ✅ Letter options with recommended in ALL CAPS (STRICT)
- ✅ Architectural descriptions only (STRICT)
- ✅ Reasonable bullet limits (FLEXIBLE - prompt-specific)

---

## 🔗 Related Rules

- **Rule #2:** Document First (`.github/instructions/rules/document-first/rule.md`)
- **Rule #3:** Playwright Orchestration (`.github/instructions/rules/playwright-orchestration/rule.md`)

---

## 📚 References

**Superseded Files:**
- `.github/instructions/rules/no-code-in-chat/rule.md` (Rule #1 - merged into this file)
- `.github/instructions/rules/concise-response-format/rule.md` (Rule #4 - merged into this file)
- `.github/prompts/shared/archive/deprecated-2025-10-30/CONCISE-MANDATE.md` (deprecated)
- `.github/prompts/shared/snippet-handling-policy.md` (code prohibition details)

**Integration:**
- `.github/MANDATORY.md` - Rule index (references this file as combined Rule #1)
- `.github/prompts/ask.prompt.md` - Enforces this rule
- `.github/prompts/plan.prompt.md` - Enforces this rule with phase breakdown exception
- `.github/prompts/todo.prompt.md` - Enforces this rule
- `.github/prompts/task.prompt.md` - Enforces this rule

---

## 📝 Migration Notes

**Created:** 2025-10-31  
**Reason:** Combine Rule #1 (No Code in Chat) and Rule #4 (Concise Response Format) into unified rule

**Changes:**
1. Merged no-code-in-chat validation into concise-output-format
2. Clarified plan.prompt.md special exception (40 bullets with phase breakdown)
3. Unified validation algorithm (checks both parts)
4. Single rule ID for easier enforcement
5. Retained all constraints from both original rules

**Migration Path:**
- Update MANDATORY.md to reference Rule #1 (concise-output-format) only
- Deprecate old Rule #1 (no-code-in-chat) and Rule #4 (concise-response-format)
- Update all prompts to reference new combined rule
- Archive old rule files for reference

---

**Last Updated:** 2025-10-31  
**Maintainer:** System  
**Version:** 2.0.0
