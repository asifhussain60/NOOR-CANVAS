# Rule: Concise Response Format

**ID:** `concise-response-format`  
**Category:** Output Formatting  
**Severity:** Critical  
**Version:** 1.0.0  
**Created:** 2025-10-31

---

## 📋 Rule Statement

**User-facing responses MUST follow strict conciseness constraints:**
- Maximum 25 bullets total per response
- Maximum 3 lines per bullet
- Architectural descriptions only (file paths, method names, data flow)
- Letter-based action options with recommended choice in **ALL CAPS**
- Structured sections: Analysis, Summary, Tasks (when needed), Final

---

## 🎯 Hard Limits

| Constraint | Limit | Enforcement |
|------------|-------|-------------|
| Total bullets | 25 max | Auto-block response if exceeded |
| Lines per bullet | 3 max | Auto-block response if exceeded |
| Code blocks | 0 allowed | See Rule #1 (No Code in Chat) |
| Nested lists | 0 allowed | Flat structure only |
| Paragraphs | 0 allowed | Bullets only |
| Action options | 2-5 letters | Must include recommended option |

---

## 📐 Response Structure

```markdown
🧠 Analysis (≤8 bullets, 3 lines each)
- Key: {key}
- Routing: {prompts-used}
- Complexity: {simple|moderate|complex}
- Layers: {UI, API, Database, SignalR}
- Context: {visual|error|file} packages
- Assumptions: {1-2 brief assumptions}

📌 Summary (≤15 bullets, 3 lines each)
1. Key: {key} | Status: {status}
2. Work: {one-liner description}
3. Files: {count} modified ({file-list})
4. {architecture-description-bullets}
5. Testing: {manual|automated|percy} - {results}
6. Next: See options below

📋 Tasks (≤8 bullets when showing task breakdown)
- Task 1: {description}
- Task 2: {description}
- Dependencies: {task-relationships}

📊 Final (≤5 bullets)
- Status: {status}
- Key: {key}
- Documentation: {key}.plan.md updated
- Next: {primary-action}
- Options: See below
```

---

## 🔤 Letter-Based Action Options

**All responses MUST provide 2-5 options with recommended option in ALL CAPS:**

```markdown
**A.** **AUTO-EXECUTE ALL PHASES** (recommended, auto-starts in 5s)
**B.** Manual mode (step-by-step with approval gates)
**C.** Review Plan / Details
**D.** Modify Approach
**E.** Cancel / Skip
```

**Formatting Requirements:**
- Recommended option: Use **bold** + **ALL CAPS** for prominence
- For multi-phase plans: Option A (auto-chain) is RECOMMENDED with 5s countdown
- For single actions: Option A is RECOMMENDED
- Alternative: Increase font size using heading (e.g., `### A. AUTO-EXECUTE ALL PHASES`)
- User replies: "A", "manual", "cancel", or waits 5s for auto-execution

**Auto-Chain Preference:**
- When plan.prompt.md shows final plan: Default to Option A with 5s countdown
- When task.prompt.md shows phase completion: Use auto-chain flag from plan
- User approves plan ONCE, execution proceeds automatically (can abort with "manual" or "cancel")

---

## ✅ Allowed Content

**Architectural descriptions:**
- File paths with line numbers: `AssetProcessingService.cs` (lines 361-394)
- Method signatures: `ShareAsset(string shareId, string assetType)`
- Data flow: Component A → Service B → Hub C → Client D
- Change summaries: Added `CreateShareButtonHtml` method, returns HTML string
- Data structures: Key-value pairs in text format (key: value)

**Configuration (limited):**
- JSON settings for appsettings.json (≤10 lines, no logic)
- PowerShell/Git commands for operations (exact commands only)
- Error messages for debugging (truncated, relevant portions)

---

## ❌ Prohibited Content

**NEVER in user-facing responses:**
- C# methods, classes, properties (public void, private string, etc.)
- JavaScript/TypeScript functions (function, const, let, arrow functions)
- HTML tags and structure (div, span, button elements with attributes)
- CSS rules and selectors (.class { property: value })
- SQL queries (SELECT, INSERT, UPDATE, DELETE statements)
- Razor markup (@code blocks, @inject, component syntax)
- Long paragraphs or narrative explanations
- Nested bullet lists
- Step-by-step implementation details

**See Rule #1 (No Code in Chat) for complete policy**

---

## 📂 File Locations for Details

**All implementation code → Key Data Stream files:**
- `.github/key-data-streams/{key}/{key}.plan.md` - Complete method implementations
- `.github/key-data-streams/{key}/work-log.md` - HTML/CSS/SQL examples
- User-facing output → Architectural summaries only

---

## 🔍 Validation Algorithm

```
FUNCTION ValidateConciseResponseFormat(response):
  
  violations = []
  
  # Count total bullets
  bulletCount = CountBullets(response)
  IF bulletCount > 25 THEN
    violations.ADD({
      rule: "concise-response-format",
      violation: "Exceeds 25 bullet limit",
      actual: bulletCount,
      suggestedFix: "Consolidate bullets or move details to {key}.plan.md"
    })
  END IF
  
  # Check lines per bullet
  FOR EACH bullet IN response.bullets:
    lineCount = CountLines(bullet)
    IF lineCount > 3 THEN
      violations.ADD({
        rule: "concise-response-format",
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
      rule: "concise-response-format",
      violation: "Contains nested lists (flat structure required)",
      suggestedFix: "Convert to flat bullet structure"
    })
  END IF
  
  # Check for paragraphs
  IF HasParagraphs(response) THEN
    violations.ADD({
      rule: "concise-response-format",
      violation: "Contains paragraphs (bullets only)",
      suggestedFix: "Convert prose to bullet points"
    })
  END IF
  
  # Check for letter-based options
  IF NOT HasLetterOptions(response) THEN
    violations.ADD({
      rule: "concise-response-format",
      violation: "Missing letter-based action options",
      suggestedFix: "Add A/B/C/D options with recommended choice in ALL CAPS"
    })
  END IF
  
  # Check recommended option formatting
  IF HasLetterOptions(response) AND NOT HasRecommendedInAllCaps(response) THEN
    violations.ADD({
      rule: "concise-response-format",
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
```

---

## 🛠️ Enforcement Actions

**Before sending ANY user-facing output:**

1. **Count bullets** → Must be ≤25 total
2. **Check line length** → Must be ≤3 lines per bullet
3. **Scan for nested lists** → ZERO allowed
4. **Scan for paragraphs** → ZERO allowed (bullets only)
5. **Verify letter options** → Must include 2-5 options
6. **Check recommended formatting** → Must be in **ALL CAPS**
7. **Violations** → AUTO-BLOCK response, rewrite to comply

**Auto-fail triggers:**
- More than 25 bullets in response
- Any bullet exceeding 3 lines
- Nested list structure detected
- Paragraph text detected (non-bullet prose)
- Missing letter-based action options
- Recommended option not in ALL CAPS
- Code blocks or snippets (see Rule #1)

---

## 🔗 Related Rules

- **Rule #1:** No Code in Chat (`.github/instructions/rules/no-code-in-chat/rule.md`)
- **Rule #2:** Document First (`.github/instructions/rules/document-first/rule.md`)

---

## 📚 References

**Source Material:**
- `.github/prompts/shared/archive/deprecated-2025-10-30/CONCISE-MANDATE.md` (deprecated)
- `.github/prompts/shared/snippet-handling-policy.md` (code prohibition details)

**Migration Notes:**
- Consolidated from CONCISE-MANDATE.md on 2025-10-31
- Extracted response format rules into standalone rule file
- Integrated with MANDATORY.md rule index

---

**Last Updated:** 2025-10-31  
**Maintainer:** System  
**Version:** 1.0.0
