# Brain Test Synchronization Rule

**Rule ID:** BRAIN-SYNC-001  
**Version:** 1.0  
**Created:** 2025-11-03  
**Status:** ✅ ACTIVE  
**Enforcement:** MANDATORY

---

## 📋 Rule Statement

**When the BRAIN integrity test suite is modified, ALL dependent systems MUST be updated synchronously.**

This is a **critical architectural rule** that ensures the dashboard and health monitoring always reflect the current state of BRAIN validation.

---

## 🎯 Scope

This rule applies to modifications of:

### Primary: BRAIN Test Suite
- `KDS/tests/test-brain-integrity.ps1` - The 13-check integrity test
- `KDS/tests/test-brain-corruption-scenarios.ps1` - Corruption detection tests
- `KDS/tests/BRAIN-INTEGRITY-TEST.md` - Test documentation

### Dependent: Health Check System
- `KDS/scripts/run-health-checks.ps1` - Must include all BRAIN integrity checks
- `KDS/kds-dashboard.html` - Must display all BRAIN integrity results
- `KDS/dashboard/README.md` - Must document BRAIN check categories

---

## 🔄 Synchronization Requirements

### 1. When BRAIN Test is Updated

**If you modify `test-brain-integrity.ps1`:**

✅ **MUST update these files in the SAME commit:**

1. **`run-health-checks.ps1`** (Section: `Test-BRAINSystem()`)
   - Update check count comment (e.g., "3.7-3.19 Full BRAIN Integrity Test (13 checks)")
   - Update JSON parsing if output format changed
   - Add/remove checks to match new test suite
   - Update check names if renamed

2. **`kds-dashboard.html`** (Function: `renderBRAINMetricsFromAPI()`)
   - Update check display logic
   - Update check count displays
   - Update category descriptions
   - Ensure all new checks render correctly

3. **`BRAIN-INTEGRITY-TEST.md`** (Documentation)
   - Update check count in "What Gets Validated" section
   - Update examples if output changed
   - Update acceptance criteria

**If you DON'T update dependent files:**
- ❌ Change-governor WILL reject the commit
- ❌ Health checks will show incorrect/incomplete status
- ❌ Dashboard will display outdated information
- ❌ System integrity compromised

---

## 📊 Check Count Consistency

**Current State (as of 2025-11-03):**

| Component | Check Count | Location |
|-----------|-------------|----------|
| `test-brain-integrity.ps1` | 13 checks | Main test suite |
| `run-health-checks.ps1` | 13 checks | Section 3.7-3.19 |
| `kds-dashboard.html` | 13 checks | BRAIN System tab |
| `BRAIN-INTEGRITY-TEST.md` | 13 checks | Documentation |

**ALL four must stay synchronized!**

---

## 🛠️ How to Comply

### Step-by-Step Process:

```bash
# 1. Make changes to BRAIN test
code KDS/tests/test-brain-integrity.ps1

# 2. Update health check script
code KDS/scripts/run-health-checks.ps1
# → Update Test-BRAINSystem() function
# → Update check count in comments

# 3. Update dashboard
code KDS/kds-dashboard.html
# → Update renderBRAINMetricsFromAPI() function
# → Ensure new checks display properly

# 4. Update documentation
code KDS/tests/BRAIN-INTEGRITY-TEST.md
# → Update "What Gets Validated" section
# → Update check count references

# 5. Test the integration
.\KDS\scripts\run-health-checks.ps1 -Category brain -OutputFormat json
.\KDS\scripts\launch-dashboard.ps1
# → Verify all 13 checks appear in dashboard

# 6. Commit ALL files together
git add KDS/tests/test-brain-integrity.ps1
git add KDS/scripts/run-health-checks.ps1
git add KDS/kds-dashboard.html
git add KDS/tests/BRAIN-INTEGRITY-TEST.md
git commit -m "feat(brain): Update integrity test suite (13 checks)"
```

---

## 🔍 Validation Checks

The **Change Governor** (`change-governor.md`) MUST verify:

### Pre-Commit Validation:

```yaml
rule: BRAIN-SYNC-001
checks:
  - name: "Brain test modified?"
    condition: "test-brain-integrity.ps1" in modified_files
    
  - name: "Health check script updated?"
    required: true
    file: "run-health-checks.ps1"
    validation: |
      - Check count comment matches test suite
      - All checks from test suite mapped to health checks
      
  - name: "Dashboard updated?"
    required: true
    file: "kds-dashboard.html"
    validation: |
      - renderBRAINMetricsFromAPI() handles all checks
      - Check count displays are correct
      
  - name: "Documentation updated?"
    required: true
    file: "BRAIN-INTEGRITY-TEST.md"
    validation: |
      - Check count in docs matches actual count
      - Examples reflect current output format

enforcement: BLOCKING
severity: CRITICAL
auto_fix: false
```

### Automated Detection:

The change-governor will:
1. ✅ Detect modifications to `test-brain-integrity.ps1`
2. ✅ Verify all 3 dependent files are also modified
3. ✅ Check that check counts are synchronized
4. ✅ Validate commit message includes all files
5. ❌ **BLOCK commit** if any dependency missing

---

## 🎯 Rationale

**Why this rule exists:**

1. **Dashboard Accuracy:** Users must see ALL current BRAIN checks, not a subset
2. **Health Monitoring Completeness:** Automated health checks must include every integrity validation
3. **Consistency:** System components must agree on what "healthy BRAIN" means
4. **Debugging:** When issues arise, all systems must report the same 13 checks
5. **Trust:** If dashboard shows 13 checks but test runs 15, trust is broken

**Example of what goes wrong without this rule:**

```
Scenario: Developer adds 2 new checks to test-brain-integrity.ps1

Without synchronization:
- Test suite runs 15 checks ✅
- Dashboard shows only 13 checks ❌
- Health check API returns 13 results ❌
- User sees "All checks passed" but 2 checks never ran ❌

Result: False sense of security, silent failures
```

---

## 📚 Related Rules

- `KDS-GOVERNANCE-001` - Change Governor enforcement
- `BRAIN-UPDATE-001` - BRAIN update synchronization
- `TEST-COVERAGE-001` - Test coverage requirements

---

## 🔄 Update History

| Date | Version | Change | Author |
|------|---------|--------|--------|
| 2025-11-03 | 1.0 | Initial rule creation | KDS System |

---

## 🧠 BRAIN Learning Integration

This rule is stored in long-term memory:

**Knowledge Graph Entry:**
```yaml
architectural_patterns:
  - pattern_id: brain_test_synchronization
    description: "BRAIN test suite changes require synchronous updates to health checks and dashboard"
    confidence: 1.00
    source: "governance/rules/brain-test-synchronization.md"
    enforcement: "change-governor.md"
    files_affected:
      - "KDS/tests/test-brain-integrity.ps1"
      - "KDS/scripts/run-health-checks.ps1"
      - "KDS/kds-dashboard.html"
      - "KDS/tests/BRAIN-INTEGRITY-TEST.md"
    validation_logic: "All 4 files must be modified in same commit when test suite changes"
```

**Violation Detection:**
The BRAIN will learn patterns of violations and warn proactively:
- "⚠️ You're modifying test-brain-integrity.ps1 but haven't updated run-health-checks.ps1"
- "💡 Remember: BRAIN test changes require dashboard updates (BRAIN-SYNC-001)"

---

## ✅ Acceptance Criteria

This rule is successfully enforced when:

- ✅ Change-governor detects BRAIN test modifications
- ✅ Change-governor validates all 3 dependencies updated
- ✅ Change-governor blocks commits missing dependencies
- ✅ Dashboard always shows current check count
- ✅ Health check API returns complete results
- ✅ Documentation stays synchronized
- ✅ Zero incidents of "dashboard shows old data"

---

**Rule Status:** ✅ ACTIVE and ENFORCED  
**Compliance:** MANDATORY  
**Violations:** AUTO-BLOCKED by change-governor.md
