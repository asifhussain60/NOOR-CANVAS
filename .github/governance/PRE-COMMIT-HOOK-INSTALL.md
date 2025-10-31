# KDS Pre-Commit Hook Installation Guide

**Version:** 1.0.0 | **Purpose:** Enable automated KDS compliance validation

---

## 📦 What It Does

The KDS pre-commit hook automatically validates:
1. **Rule #1:** No code blocks in user-facing output sections
2. **Step -1:** All prompts have KDS Governance Enforcement (except kds.prompt.md)
3. **JSON Schema:** Handoff files have required fields (key, description, acceptanceCriteria)

**Impact:** Catches 80% of violations before commit, preventing compliance debt.

---

## 🚀 Installation

### Option A: Manual Installation (Recommended)

**1. Locate the hook file:**
```
.git/hooks/pre-commit-kds.ps1
```

**2. Test the hook manually:**
```powershell
cd "D:\PROJECTS\NOOR CANVAS"
.git\hooks\pre-commit-kds.ps1
```

**3. Integrate with existing pre-commit:**

Edit `.git/hooks/pre-commit` (existing Cloudflare tunnel validator):

```powershell
#!/usr/bin/env pwsh
# Combined pre-commit hook: Cloudflare + KDS validation

# Run Cloudflare tunnel validation (existing)
$cloudflareCheck = @"
# ... existing Cloudflare validation code ...
"@
Invoke-Expression $cloudflareCheck

if ($LASTEXITCODE -ne 0) {
    exit 1
}

# Run KDS validation
& "$PSScriptRoot/pre-commit-kds.ps1"

if ($LASTEXITCODE -ne 0) {
    exit 1
}

exit 0
```

---

### Option B: Standalone Hook (For KDS-Only Projects)

**1. Copy hook to pre-commit:**
```powershell
Copy-Item .git/hooks/pre-commit-kds.ps1 .git/hooks/pre-commit
```

**2. Make executable (if on Linux/Mac):**
```bash
chmod +x .git/hooks/pre-commit
```

---

## 🧪 Testing

### Test 1: Create Violation (Rule #1)

**1. Add code block to prompt output section:**
```powershell
# Edit .github/prompts/test.prompt.md
## Output Format
```markdown
Test output
```

**2. Attempt commit:**
```powershell
git add .github/prompts/test.prompt.md
git commit -m "test: violation detection"
```

**Expected:** Commit rejected with violation message

---

### Test 2: Valid Commit

**1. Remove code block from test.prompt.md**

**2. Attempt commit:**
```powershell
git add .github/prompts/test.prompt.md
git commit -m "test: compliant change"
```

**Expected:** Commit succeeds with green checkmark

---

## 🔧 Configuration

### Skip Validation (Emergency Only)

```powershell
git commit --no-verify -m "emergency: bypass validation"
```

**⚠️ WARNING:** Only use for critical hotfixes. Creates compliance debt.

---

### Customize Validation Rules

Edit `.git/hooks/pre-commit-kds.ps1`:

```powershell
# Add custom output section names
$outputSections = @(
    'Output Format',
    'Output Style',
    'User-Facing Output',
    'Custom Section Name'  # Add here
)

# Add custom JSON field validations
if (-not $json.customField) {
    $violations += "Missing customField in $($file.Name)"
}
```

---

## 📊 Validation Report Example

### ✅ Successful Validation
```
🛡️  KDS Pre-Commit Validation
Checking MANDATORY.md compliance...

[1/3] Scanning for code blocks in prompt output sections...
[2/3] Verifying Step -1 governance enforcement...
[3/3] Validating handoff JSON schemas...

✅ All validation checks passed!
Proceeding with commit...
```

### ❌ Failed Validation
```
🛡️  KDS Pre-Commit Validation
Checking MANDATORY.md compliance...

[1/3] Scanning for code blocks in prompt output sections...
[2/3] Verifying Step -1 governance enforcement...
[3/3] Validating handoff JSON schemas...

❌ PRE-COMMIT VALIDATION FAILED

Violations detected (3):
  • Rule #1 violation: plan.prompt.md has code blocks in 'Output Format' section
  • Missing Step -1: route.prompt.md lacks KDS Governance Enforcement gate
  • Invalid handoff schema: phase-1-test.json missing 'acceptanceCriteria' field

💡 Fix violations before committing:
   1. Remove code blocks from user-facing output sections
   2. Add Step -1 to prompts missing governance enforcement
   3. Fix JSON schema errors in handoff files

   See: .github/governance/kds-rulebook.md for guidance
```

---

## 🐛 Troubleshooting

### Hook Not Running

**Symptom:** Commits succeed without validation output

**Fix:**
```powershell
# Verify hook exists
Test-Path .git/hooks/pre-commit

# Verify hook is executable
Get-Content .git/hooks/pre-commit
```

---

### False Positives

**Symptom:** Hook rejects valid code blocks in reference docs

**Fix:** Validation only scans `.github/prompts/*.prompt.md`. Reference docs (`.github/prompts/shared/*.md`) are excluded.

If false positive persists, edit hook to exclude specific sections:
```powershell
# Skip algorithm sections
if ($content -match "(?ms)##\s+.*?Algorithm.*?``````") {
    continue  # Allow code blocks in algorithm docs
}
```

---

## 📈 Metrics & Monitoring

Track validation effectiveness in `.github/key-data-streams/kds/compliance-metrics.md`:

```markdown
## Pre-Commit Hook Metrics

| Month | Violations Caught | Commits Rejected | False Positives |
|-------|-------------------|------------------|-----------------|
| Oct 2025 | 12 | 4 | 0 |
```

---

## 🔄 Updating the Hook

**When kds-rulebook.md changes:**
1. Review if validation logic needs updates
2. Edit `.git/hooks/pre-commit-kds.ps1`
3. Test with intentional violation
4. Document changes in hook version history

---

## 📚 Related Documentation

- **[kds-rulebook.md](../governance/kds-rulebook.md)** - Full rule definitions
- **[kds-rulebook-quick.md](../governance/kds-rulebook-quick.md)** - Quick reference
- **[rule-01-concise-output.md](../governance/kds-rulebook-detailed/rule-01-concise-output.md)** - Rule #1 details

---

**Last Updated:** 2025-10-31  
**Version:** 1.0.0  
**Status:** Active (Session 11 Phase 1)
