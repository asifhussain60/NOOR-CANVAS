# Rule #1: Concise Output Format

**Category:** Output Format  
**Severity:** Critical  
**Validation Function:** `ValidateConciseOutputFormat()`  
**Applies To:** All prompts

---

## Statement

User-facing responses MUST:
1. **NEVER include code blocks or pseudocode**
2. Use **max 3 lines per bullet point**
3. Use **letter-based options (A, B, C)** with recommended option in **ALL CAPS**
4. Follow **prompt-specific structure** (plan uses Phase→Task, ask uses 🧠/📌/📊)

---

## Rationale

- Code in chat violates separation of concerns (code belongs in files, not output)
- Concise bullets improve readability, reduce cognitive load
- Letter options with emphasis improve UX consistency
- Structured output ensures predictable user experience

---

## Enforcement

**Automated:** Pre-commit hook scans for code blocks in Output Format sections  
**Manual:** Review user-facing templates during pull requests

---

## Examples

### ✅ Compliant

```markdown
## 📌 Next Steps

**A. EXECUTE PHASE 1** (recommended - create test first)
   Creates Playwright test with acceptance criteria validation.
   Command: `@workspace /test-generation #file:handoffs/phase-1-test.json`

**B. Review Plan Details**
   Opens full plan document for architecture review.
```

**Why it works:**
- No code blocks in user output
- Each bullet ≤3 lines
- Letter options with emphasis (A, B)
- Clear structure with sections

---

### ❌ Non-Compliant

```markdown
## Next Steps

Here's the code to execute Phase 1:

\`\`\`typescript
async function executePhase1() {
  await createTest();
  await runTest();
}
\`\`\`

Run this command: `@workspace /test-generation key=kds phase=1`
```

**Why it fails:**
- Contains TypeScript code block (violation)
- No letter-based options
- No emphasis on recommended action
- Unstructured output

---

## Anti-Patterns

### ❌ Including Code in Chat
```markdown
The plan generates this JSON:
\`\`\`json
{
  "key": "feature",
  "phase": 1
}
\`\`\`
```

**Fix:** "The plan generates a JSON file with key, phase, and task metadata stored in handoffs/ directory."

---

### ❌ Multi-Paragraph Bullets
```markdown
- This bullet point is way too long and contains multiple ideas that should be broken down into separate bullets. It goes on and on explaining various concepts in excessive detail that makes it hard to scan quickly. By the time you reach the end, you've forgotten the beginning. This violates the 3-line maximum rule and reduces readability significantly.
```

**Fix:**
```markdown
- Main concept explained in one line
- Supporting detail in second line
- Action item or consequence in third line (max)
```

---

### ❌ Lowercase Options Without Emphasis
```markdown
Next steps:
a. option one
b. option two
c. option three
```

**Fix:**
```markdown
**A. OPTION ONE** (recommended)
**B.** Option Two
**C.** Option Three
```

---

## Special Exceptions

### Exception 1: plan.prompt.md Bullet Count
**Reason:** Multi-phase plans need detailed breakdowns  
**Allowed:** Up to 40 bullets for phase/task structure  
**Restriction:** Still max 3 lines per bullet

### Exception 2: Algorithm Docs in shared/
**Reason:** Technical references need pseudocode for clarity  
**Allowed:** Code blocks in `.github/prompts/shared/*.md` reference docs  
**Restriction:** NOT in user-facing output sections

---

## Validation Function

```powershell
# Pseudocode validation logic
FUNCTION ValidateConciseOutputFormat(promptFile):
  content = READ_FILE(promptFile)
  
  # Check 1: Code blocks in user-facing sections
  outputSection = EXTRACT_SECTION(content, "Output Format")
  IF outputSection CONTAINS "```":
    RETURN violation("Code blocks in output section")
  
  # Check 2: Bullet length
  bullets = EXTRACT_BULLETS(outputSection)
  FOR EACH bullet IN bullets:
    lineCount = COUNT_LINES(bullet)
    IF lineCount > 3:
      RETURN violation("Bullet exceeds 3 lines: " + bullet)
  
  # Check 3: Letter options
  options = EXTRACT_OPTIONS(outputSection)
  FOR EACH option IN options:
    IF NOT MATCHES(option, "^\\*\\*[A-Z]\\."):
      RETURN violation("Options must use **A.** format")
  
  RETURN compliant()
```

---

## Common Questions

**Q: Can I use inline code (backticks) for filenames?**  
A: Yes! Inline code for filenames, variables, and commands is allowed. Only code **blocks** are prohibited.

**Q: What about JSON schemas in handoff protocol documentation?**  
A: Store schemas in `.github/prompts/shared/kds-handoff-protocol.md` (reference doc). In user output, describe schema fields in prose.

**Q: How do I show command examples without code blocks?**  
A: Use inline code: "Invoke the plan agent with `@workspace /plan key=feature`"

**Q: Are algorithm pseudocode blocks ever allowed?**  
A: Yes, but only in reference docs (`.github/prompts/shared/*.md`), and only if ≤7-10 lines. User-facing output must use prose.

---

## Related Rules

- **Rule #12 (Honest Handoff):** User output shows "Next Command" as inline code, not code block
- **Rule #4 (Per-Task Handoffs):** JSON schemas stored in files, described in prose to users
- **Rule #11 (Key Display):** Key shown in section headers, not code blocks

---

**Back to:** [kds-rulebook.md](../kds-rulebook.md) | [Quick Start Guide](../kds-rulebook-quick.md)
