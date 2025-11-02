# KDS User Command: Govern

**Purpose:** Review and validate changes to KDS itself (.github/ directory).

**Version:** 4.5  
**Loaded By:** Universal entry point or direct usage

---

## 🎯 How to Use

```markdown
#file:.github/prompts/user/govern.md

I [updated|modified|changed] [what you changed in KDS]
```

**Or use the universal entry point:**
```markdown
#file:.github/prompts/user/kds.md

I updated the test-generator to support Percy visual testing
```

---

## 📋 What Happens

When you use this command, KDS will:

1. **Load Change Governor Agent**
   ```
   #file:.github/prompts/internal/change-governor.md
   ```

2. **Detect KDS Modifications**
   - Scan `.github/` directory for changes
   - Identify modified files
   - Extract change diff

3. **Review Against Design**
   ```
   #file:.github/KDS-DESIGN.md
   #file:.github/governance/rules.md
   ```

4. **Validate Changes**
   - Check for breaking changes
   - Verify backward compatibility
   - Ensure rule compliance

5. **Challenge or Approve**
   - **STOP** you if harmful
   - **SUGGEST** alternatives if better approach exists
   - **APPROVE** if beneficial

6. **Update Design Documents**
   - Add decision to KDS-DESIGN.md
   - Update rules.md if needed
   - Document rationale

---

## 💡 Examples

### Example 1: Beneficial Change (Approved)
```markdown
You: #file:.github/prompts/user/govern.md
     I updated test-generator.md to support Percy visual testing

KDS:
✅ KDS CHANGE APPROVED

Files Modified:
  - .github/prompts/internal/test-generator.md

Changes Detected:
  + Added Percy snapshot integration
  + Added visual regression test patterns
  + Updated test creation workflow

Review:
  ✅ Aligns with KDS design (test-first, pattern publishing)
  ✅ No breaking changes
  ✅ Enhances test capabilities
  ✅ Follows Rule #2 (Function-Based Naming)
  ✅ Follows Rule #14 (Pattern Publishing)

Design Update:
  ✓ Added to KDS-DESIGN.md:
    - Decision: Percy visual testing integration
    - Rationale: Enhances test coverage for UI changes
    - Date: 2025-11-02

Next: Changes approved. Continue using KDS normally.
```

### Example 2: Harmful Change (STOPPED)
```markdown
You: #file:.github/prompts/user/govern.md
     I removed the test-first workflow from execute.md

KDS:
❌ KDS CHANGE REJECTED

Files Modified:
  - .github/prompts/shared/test-first.md (DELETED)
  - .github/prompts/internal/code-executor.md

Changes Detected:
  - Removed test-first enforcement
  - Removed Rule #8 compliance checks

Issues:
  ❌ Violates Rule #8 (Test-First Mandatory)
  ❌ Breaking change (existing workflows rely on this)
  ❌ Reduces code quality
  ❌ Removes critical guardrail

🛑 CHANGE BLOCKED

Rationale:
  Test-first workflow is a CORE principle of KDS. Removing it:
  1. Allows untested code into production
  2. Breaks automated validation
  3. Violates design philosophy

Alternatives:
  1. Make test-first OPTIONAL for specific scenarios
  2. Add flag to bypass when justified
  3. Keep enforcement but improve messaging

Would you like to:
  1. Revert changes
  2. Implement alternative approach
  3. Override (requires rationale)
```

### Example 3: Needs Improvement (Suggested)
```markdown
You: #file:.github/prompts/user/govern.md
     I added a new prompt: wizard.prompt.md for guided setup

KDS:
⚠️ KDS CHANGE NEEDS IMPROVEMENT

Files Modified:
  - .github/prompts/user/wizard.prompt.md (NEW)

Changes Detected:
  + Added guided setup wizard

Issues:
  ⚠️  Violates Rule #2 (Function-Based Naming)
     Current: wizard.prompt.md
     Should be: setup-wizard.md
     
  ⚠️  Not documented in KDS-DESIGN.md
  ⚠️  No internal agent specified

Suggestions:
  1. Rename: wizard.prompt.md → setup-wizard.md
  2. Add entry to KDS-DESIGN.md (design decision)
  3. Create internal agent: setup-wizard.md or route to intent-router.md
  4. Add to universal entry point (kds.md) patterns

Would you like me to:
  1. Auto-fix naming and structure
  2. Show you how to fix manually
  3. Proceed as-is (not recommended)
```

### Example 4: User Override (Allowed but Logged)
```markdown
You: #file:.github/prompts/user/govern.md
     I removed test-first for rapid prototyping

KDS:
❌ KDS CHANGE REJECTED (see previous issues)

You: Override - I need this for prototyping phase

KDS:
⚠️ USER OVERRIDE ACCEPTED (logged)

Override Details:
  User: asifhussain60
  Date: 2025-11-02 10:32:15
  Change: Removed test-first enforcement
  Rationale: "Rapid prototyping phase"
  
Logged to:
  .github/governance/overrides.log
  
⚠️  WARNING:
  - This violates core KDS principles
  - Technical debt will accumulate
  - Recommend re-enabling after prototyping
  
Reminder:
  Re-enable test-first when prototyping complete:
    git revert [commit-hash]

Next: Override accepted. Proceed with caution.
```

---

## 🔍 What Gets Reviewed

### Prompts (user/ and internal/)
```yaml
checks:
  - Naming convention (Rule #2)
  - Function clarity
  - No duplication
  - Proper agent routing
```

### Rules (governance/rules.md)
```yaml
checks:
  - Rule numbering sequential
  - No contradictions
  - Clear validation criteria
  - Enforcement mechanisms defined
```

### Design (KDS-DESIGN.md)
```yaml
checks:
  - Design decisions documented
  - Rationale provided
  - Version updated
  - Status accurate
```

### Structure (directory changes)
```yaml
checks:
  - Follows defined structure
  - No orphaned files
  - README files present
  - No archive/ or backup/ folders
```

---

## 🚫 Common Rejection Reasons

### 1. Breaking Changes
```
❌ Removing existing prompts
❌ Changing agent contracts
❌ Modifying session state structure
❌ Deleting rules without replacement
```

### 2. Design Violations
```
❌ Adding archive/ folders (use git history)
❌ Creating .old or .bak files
❌ Mixing user and internal concerns
❌ Hardcoded values (use config)
```

### 3. Rule Conflicts
```
❌ New rule contradicts existing rule
❌ Bypassing mandatory workflows
❌ Weakening validation
❌ Removing test enforcement
```

### 4. Undocumented Changes
```
❌ No entry in KDS-DESIGN.md
❌ No rationale provided
❌ Version not updated
❌ No decision tracked
```

---

## ✅ Approval Criteria

**Changes approved when:**
- ✅ Aligns with KDS design philosophy
- ✅ No breaking changes (or justified with migration plan)
- ✅ Documented in KDS-DESIGN.md
- ✅ Follows naming conventions (Rule #2)
- ✅ No rule contradictions
- ✅ Enhances KDS capabilities

---

## 🔧 Behind the Scenes

### This Prompt Loads:
```markdown
#file:.github/prompts/internal/change-governor.md
```

### Change Governor Reads:
```markdown
#file:.github/KDS-DESIGN.md (design principles)
#file:.github/governance/rules.md (validation rules)
git diff .github/ (detect changes)
```

### Change Governor Updates (if approved):
```markdown
#file:.github/KDS-DESIGN.md (adds design decision)
#file:.github/governance/rules.md (if rule changes)
#file:.github/governance/overrides.log (if user overrode)
```

---

## 📊 Governance Workflow

```
User Modifies KDS
      │
      ▼
#file:.github/prompts/user/govern.md
      │
      ▼
Change Governor Analyzes
      │
      ├─ Beneficial? ──→ APPROVE ──→ Update docs
      │
      ├─ Harmful? ──→ REJECT ──→ Suggest alternatives
      │
      └─ Needs Work? ──→ SUGGEST ──→ Show improvements
            │
            ▼
      User Decides
            │
            ├─ Fix ──→ Re-submit to govern.md
            │
            ├─ Override ──→ Log & Allow (with warning)
            │
            └─ Revert ──→ Git revert
```

---

## 🎓 Design Decision Tracking

### Approved Changes Get Documented
```markdown
## 2025-11-02: Percy Visual Testing Integration

**Decision:** Add Percy snapshot support to test-generator.md

**Rationale:**
- Visual regression testing critical for UI changes
- Percy provides reliable snapshot comparison
- Integrates with existing Playwright tests
- Follows test-first principles

**Changes:**
- Updated `.github/prompts/internal/test-generator.md`
- Added Percy setup instructions
- Added visual test pattern to knowledge base

**Impact:**
- Enhanced test coverage for UI
- Better detection of unintended visual changes
- Consistent visual regression workflow

**Compatibility:** Non-breaking (additive enhancement)
```

---

## ⚠️ When to Use Govern

### Required
```markdown
✅ Modifying any file in .github/
✅ Adding new prompts
✅ Changing rules
✅ Updating KDS-DESIGN.md
✅ Modifying agents
```

### Not Required
```markdown
❌ Working on application code
❌ Adding features to NOOR Canvas
❌ Creating tests
❌ Modifying UI components
```

---

## 🚀 After Governance

### If APPROVED
```markdown
✅ Changes approved and documented

Next:
  Continue using KDS with your enhancements
  
Commit:
  git commit -m "feat(kds): Add Percy visual testing support"
```

### If REJECTED
```markdown
❌ Changes rejected

Next:
  1. Review suggested alternatives
  2. Revert changes: git checkout -- .github/
  3. Implement alternative
  4. Re-submit to govern.md
```

### If OVERRIDE
```markdown
⚠️ Override logged

Next:
  Proceed with caution
  Re-evaluate during next KDS review
  
Reminder:
  Technical debt created - address later
```

---

**KDS governance keeps the system healthy!** 🛡️
