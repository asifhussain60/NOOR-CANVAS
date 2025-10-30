# Mandatory Rules System

**Version:** 2.0.0  
**Created:** 2025-10-30  
**Last Updated:** 2025-10-30

---

## Overview

The Mandatory Rules System enforces non-negotiable operating constraints across ALL prompts in the workspace. Rules are defined in separate implementation files and indexed in `.github/MANDATORY.md`.

**Key Features:**
- **Scalable**: Add new rules without modifying large files
- **Modular**: Each rule in its own folder with implementation, metadata, examples
- **Template-driven**: Consistent structure for all rules
- **Source of Truth**: Rules are canonical until explicitly changed by user
- **Auto-enforcement**: Validation runs automatically before prompt output

---

## Rule Structure

Each rule consists of 3 files in its own folder:

```
.github/instructions/rules/{rule-id}/
├── rule.md           # Full implementation (validation + enforcement)
├── metadata.json     # Rule metadata (version, severity, etc.)
└── examples.md       # Examples, anti-patterns, edge cases
```

### rule.md

Contains the complete rule implementation:
- **Rule Statement**: What the rule enforces (one-sentence + detailed)
- **Prohibited Actions**: What NOT to do
- **Required Actions**: What to do instead
- **Validation Algorithm**: Pseudocode for detecting violations
- **Enforcement Action**: What happens when violated (HALT, auto-fix)
- **Related Documentation**: Links to related rules, modules, docs

### metadata.json

Rule metadata for discovery and loading:
```json
{
  "id": "rule-id",
  "title": "Rule Title",
  "version": "1.0.0",
  "created": "2025-10-30",
  "category": "workflow",
  "severity": "critical",
  "enforcement": "automatic",
  "autoFix": true,
  "validationFunction": "ValidateRuleId",
  "appliesToPrompts": ["all"],
  "relatedRules": [],
  "tags": []
}
```

### examples.md

Comprehensive examples:
- **✅ Compliant Examples**: Correct approaches with explanations
- **❌ Non-Compliant Examples**: Violations with fixes
- **🔍 Edge Cases**: Unusual scenarios and how to handle
- **📊 Common Patterns**: Reusable patterns for following rule

---

## Adding a New Rule

### Step 1: Create Rule Folder

```powershell
# Navigate to workspace root
cd "d:\PROJECTS\NOOR CANVAS"

# Create rule directory
New-Item -Path ".github/instructions/rules/{rule-id}" -ItemType Directory

# Copy templates
Copy-Item ".github/instructions/rules/_template/*" `
          ".github/instructions/rules/{rule-id}/"
```

**Naming Convention:**
- Use lowercase with hyphens: `my-new-rule`
- Descriptive: `no-direct-database-access`
- Consistent with KDS naming

---

### Step 2: Implement Rule

#### Edit `rule.md`

1. **Update header**:
   ```markdown
   # Rule: My New Rule
   
   **ID:** `my-new-rule`  
   **Version:** 1.0.0  
   **Created:** 2025-10-30  
   **Category:** {choose: output-format, workflow, testing, security, documentation, code-quality}  
   **Severity:** {choose: critical, high, medium, low}  
   **Applies To:** {all OR specific prompts}
   ```

2. **Write rule statement**:
   - **Summary**: One sentence for MANDATORY.md index
   - **Detailed Description**: Full explanation (2-3 paragraphs)
   - **Why This Matters**: 3-5 bullet points

3. **Define prohibited/required actions**:
   - ❌ PROHIBITED: List what NOT to do
   - ✅ REQUIRED: List what to do instead
   - Include exceptions if applicable

4. **Implement validation algorithm**:
   ```
   FUNCTION ValidateMyNewRule(context):
     # Step 1: Check applicability
     # Step 2: Execute checks
     # Step 3: Return result
   END FUNCTION
   ```

5. **Define enforcement action**:
   - Log violation
   - HALT execution
   - Show fix guidance
   - Auto-fix (if possible)

#### Edit `metadata.json`

1. Set `id`, `title`, `version`, `created`
2. Choose `category` and `severity`
3. Set `enforcement`: `automatic` or `manual`
4. Set `autoFix`: `true` if auto-fix available
5. Specify `appliesToPrompts`: `["all"]` or specific list
6. Link `relatedRules`, `relatedModules`, `relatedDocs`
7. Add `tags` for searchability

#### Edit `examples.md`

1. Add 2-3 **compliant examples** (best practices)
2. Add 2-3 **non-compliant examples** (violations + fixes)
3. Document 2-3 **edge cases** (unusual scenarios)
4. Create 2-3 **common patterns** (reusable approaches)

---

### Step 3: Add to Index

Edit `.github/MANDATORY.md`:

```markdown
| 4 | My New Rule | {One-sentence description} | [rule.md](instructions/rules/my-new-rule/rule.md) |
```

**Important:**
- Use next sequential ID number
- Keep description under 100 characters
- Verify link path is correct

---

### Step 4: Update ValidateMandatoryCompliance (if needed)

**Most rules work automatically** via `LoadRules()` function.

**Only update if:**
- Rule requires special validation context
- Rule needs custom handling logic
- Rule applies conditionally (complex criteria)

**Location:** `.github/MANDATORY.md` - `ValidateMandatoryCompliance()` function

---

### Step 5: Document in KDS

```powershell
# Update work-log.md
$workLog = ".github/key-data-streams/prompt/work-log.md"

Add-Content $workLog @"

## Session: $(Get-Date -Format 'yyyy-MM-dd') (New Rule: my-new-rule)

**Action:** Added new mandatory rule: my-new-rule  
**Status:** Complete  
**Context:** {Why this rule was needed}

**Deliverables:**
- ✅ rule.md (implementation)
- ✅ metadata.json (metadata)
- ✅ examples.md (examples)
- ✅ Updated MANDATORY.md index

**Next:** Test rule validation
"@

# Commit
git add .github/instructions/rules/my-new-rule/
git add .github/MANDATORY.md
git add .github/key-data-streams/prompt/work-log.md
git commit -m "doc(prompts): Add mandatory rule my-new-rule"
```

---

### Step 6: Test Rule

#### Create Test Scenario

1. **Create violation**: Code that violates the rule
2. **Run validation**: Execute rule's validation function
3. **Verify detection**: Confirm violation is caught
4. **Test enforcement**: Verify HALT or auto-fix
5. **Verify logging**: Check `.github/audits/mandate-violations.log`

#### Test Script Template

```powershell
# Test: my-new-rule validation

Write-Host "Testing my-new-rule..." -ForegroundColor Cyan

# Create test context that violates rule
$testContext = @{
    # ... violation scenario ...
}

# Execute validation
$result = Invoke-Validation -Rule "my-new-rule" -Context $testContext

# Assert violation detected
if ($result.violation -eq $false) {
    Write-Host "ERROR: Validation failed to detect violation" -ForegroundColor Red
    exit 1
}

Write-Host "Violation detected correctly" -ForegroundColor Green

# Test enforcement
$enforcement = Invoke-Enforcement -Rule "my-new-rule" -Violation $result

# Assert HALT or auto-fix
if ($enforcement.continued -and -not $enforcement.autoFixed) {
    Write-Host "ERROR: Enforcement did not halt or auto-fix" -ForegroundColor Red
    exit 1
}

Write-Host "Enforcement action correct" -ForegroundColor Green

# Verify logging
if (-not (Test-Path ".github/audits/mandate-violations.log")) {
    Write-Host "ERROR: Violation not logged" -ForegroundColor Red
    exit 1
}

Write-Host "Logging verified" -ForegroundColor Green
Write-Host "All tests passed!" -ForegroundColor Green
```

#### Integration Test

Test rule in actual prompt:

1. Open test prompt file
2. Add `LOAD_MODULE(".github/MANDATORY.md")`
3. Create scenario that violates rule
4. Run prompt
5. Verify violation detected and execution halted
6. Fix violation
7. Verify prompt continues successfully

---

### Step 7: Commit Changes

```bash
# Add all files
git add .github/MANDATORY.md
git add .github/instructions/rules/my-new-rule/
git add .github/key-data-streams/prompt/work-log.md

# Commit with rule-change prefix
git commit -m "doc(prompts): Add mandatory rule my-new-rule

- Added rule implementation (rule.md)
- Added metadata and examples
- Updated MANDATORY.md index
- Tested validation and enforcement

Closes #XXX (if related to issue)"

# Push
git push origin noorcanvas/prompt-enhancements
```

---

## Rule Categories

| Category | Description | Example Rules | Severity |
|----------|-------------|---------------|----------|
| **output-format** | Response structure and content rules | no-code-in-chat | Critical |
| **workflow** | Process and sequencing rules | document-first | Critical |
| **testing** | Test orchestration and execution rules | playwright-orchestration | Critical |
| **security** | Security and access control rules | no-secrets-in-code | Critical |
| **documentation** | KDS and documentation rules | required-work-log-entry | High |
| **code-quality** | Code standards and patterns | use-dependency-injection | Medium |

**Choosing Category:**
- **Critical**: Violations cause system failures or data loss
- **High**: Violations cause significant problems but not catastrophic
- **Medium**: Violations reduce quality but system still works
- **Low**: Violations are minor style/preference issues

---

## Enforcement Levels

| Level | Behavior | Use When |
|-------|----------|----------|
| **automatic** | Validation runs automatically; violations HALT execution | Most rules (default) |
| **manual** | Validation on-demand; violations show warnings | Advisory rules, best practices |

**Auto-Fix Support:**
- Set `autoFix: true` in metadata.json if rule can auto-correct violations
- Implement auto-fix logic in enforcement action
- Test auto-fix thoroughly before enabling

---

## Source of Truth Behavior

**Rules are CANONICAL until user explicitly changes them:**

### What This Means

1. ✅ **Rules define system behavior** (not just documentation)
2. ✅ **Prompts MUST comply** (no exceptions without user approval)
3. ✅ **Changes require explicit user instruction**
4. ❌ **Agents CANNOT modify rules autonomously**
5. ❌ **Prompts CANNOT override rules**

### Modification Process

**Only user can change rules:**

1. **User requests change**: "Update the playwright-orchestration rule to allow..."
2. **Agent creates plan**: Document proposed changes
3. **User approves plan**: Explicit approval required
4. **Agent updates rule**: Modify rule.md, increment version
5. **Agent updates metadata**: Update `lastModified`, `version`
6. **Agent commits**: Prefix with `rule-change:`

**Example:**
```bash
git commit -m "rule-change(playwright-orchestration): Allow standalone mode for CI

User approved change to support CI/CD environments.
Updated validation to allow PW_MODE=standalone when $env:CI -eq 'true'.

Version: 1.0.0 → 1.1.0"
```

### Version Control

**Rule Versioning:**
- **Patch (1.0.0 → 1.0.1)**: Typo fixes, clarifications (no behavior change)
- **Minor (1.0.0 → 1.1.0)**: New examples, relaxed constraints, auto-fix added
- **Major (1.0.0 → 2.0.0)**: Breaking changes, tightened constraints, new validations

**Always increment version when modifying rule behavior.**

---

## Troubleshooting

### Rule Not Loading

**Symptom:** Rule validation not executing

**Causes:**
1. `metadata.json` malformed (invalid JSON)
2. Rule file path incorrect in MANDATORY.md
3. `appliesToPrompts` excludes current prompt

**Fix:**
```powershell
# Validate JSON
Get-Content ".github/instructions/rules/my-rule/metadata.json" | ConvertFrom-Json

# Check file paths
Test-Path ".github/instructions/rules/my-rule/rule.md"

# Verify prompt applicability
# Check metadata.json: "appliesToPrompts": ["all"] or ["plan", "task"]
```

---

### Validation Causing Infinite Loop

**Symptom:** Prompt halts repeatedly with same violation

**Causes:**
1. Validation checks prompt's own output (recursive)
2. Auto-fix creates new violation
3. Validation too strict (impossible to satisfy)

**Fix:**
```
# Add guard to validation
IF context.isValidationContext THEN
  RETURN { violation: false, reason: "Validation context" }
END IF

# Test auto-fix thoroughly
# Ensure auto-fix doesn't create new violations

# Review validation logic
# Ensure constraints are achievable
```

---

### Rule Too Strict/Too Lenient

**Symptom:** False positives or false negatives

**Fix:**
1. Review examples (add edge cases that are misclassified)
2. Adjust validation logic (refine conditions)
3. Update rule.md with clarifications
4. Increment version (minor or major)
5. Test with real scenarios

---

## Best Practices

### Writing Rules

**Do:**
- ✅ One rule = one responsibility (single purpose)
- ✅ Clear, unambiguous language
- ✅ Comprehensive examples (compliant + non-compliant)
- ✅ Specific error messages in validation
- ✅ Actionable fix guidance in enforcement

**Don't:**
- ❌ Combine multiple concerns in one rule
- ❌ Use vague language ("should", "might", "sometimes")
- ❌ Skip examples (examples are critical!)
- ❌ Generic error messages ("Validation failed")
- ❌ Fix guidance without specific steps

### Testing Rules

**Always test:**
1. **Happy path**: Compliant code passes validation
2. **Violation detection**: Each prohibited pattern caught
3. **Auto-fix**: If enabled, fixes work correctly
4. **Edge cases**: Unusual scenarios handled properly
5. **Performance**: Validation completes quickly (<100ms)

### Documenting Rules

**Every rule needs:**
- Clear "Why This Matters" section
- At least 2 compliant examples
- At least 2 non-compliant examples
- Edge cases documented
- Related rules linked

---

## Related Documentation

**Core Files:**
- `.github/MANDATORY.md` - Rule index (THIS IS THE ENTRY POINT)
- `.github/instructions/SelfAwareness.instructions.md` - Global guardrails
- `.github/key-data-streams/prompt/` - Rule system development history

**Templates:**
- `.github/instructions/rules/_template/rule-template.md` - Rule implementation template
- `.github/instructions/rules/_template/metadata.json` - Metadata template
- `.github/instructions/rules/_template/examples.md` - Examples template

**Existing Rules:**
- `.github/instructions/rules/no-code-in-chat/` - Output format rule
- `.github/instructions/rules/document-first/` - Workflow rule
- `.github/instructions/rules/playwright-orchestration/` - Testing rule

---

## FAQ

**Q: When should I create a new rule vs. update existing?**

A: Create new if:
- Different category (e.g., security vs. testing)
- Independent validation logic
- Applies to different contexts

Update existing if:
- Refinement of same constraint
- Additional examples for same rule
- Bug fix in validation

**Q: Can rules reference each other?**

A: Yes! Use `relatedRules` in metadata.json and link in rule.md.

Example: `document-first` references `no-code-in-chat` (both deal with KDS documentation).

**Q: What if a rule conflicts with user request?**

A: HALT and ask user for clarification. Rules are canonical, but user can override by explicitly instructing to modify rule.

**Q: How do I deprecate a rule?**

A: 
1. Create `DEPRECATED.md` in rule folder explaining why
2. Update metadata: `"deprecated": true, "replacedBy": "new-rule-id"`
3. Keep rule files (don't delete - for historical reference)
4. Remove from MANDATORY.md index table
5. Document in work-log.md

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | 2025-10-30 | Initial rules system documentation (transformed from monolithic MANDATORY.md) |

---

**For questions or issues, see:** `.github/key-data-streams/prompt/work-log.md`
