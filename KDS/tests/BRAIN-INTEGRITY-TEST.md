# KDS BRAIN Integrity Test Documentation

**Version:** 1.0  
**Created:** 2025-11-03  
**Purpose:** Comprehensive BRAIN file validation and corruption detection

---

## 📋 Quick Reference

```powershell
# Basic test
.\KDS\tests\test-brain-integrity.ps1

# Verbose output
.\KDS\tests\test-brain-integrity.ps1 -Verbose

# JSON output (automation)
.\KDS\tests\test-brain-integrity.ps1 -JsonOutput

# Corruption detection
.\KDS\tests\test-brain-corruption-scenarios.ps1

# Playwright automation
npx playwright test KDS/tests/test-brain-integrity.spec.ts
```

---

## 🎯 What Gets Validated

### 13 Integrity Checks

**1. File Existence (4 checks)**
- ✅ conversation-history.jsonl exists
- ✅ knowledge-graph.yaml exists  
- ✅ development-context.yaml exists
- ✅ events.jsonl exists

**2. File Size (1 check)**
- ✅ events.jsonl < 50MB limit

**3. JSONL Syntax (2 checks)**
- ✅ conversation-history.jsonl valid JSON
- ✅ events.jsonl valid JSON
- Handles both single-line and multi-line JSON

**4. YAML Syntax (2 checks)**
- ✅ knowledge-graph.yaml valid YAML  
- ✅ development-context.yaml valid YAML
- Checks for tabs, unbalanced quotes

**5. Conversation FIFO Queue (2 checks)**
- ✅ Max 20 conversations
- ✅ No duplicate conversation IDs

**6. Confidence Scores (1 check)**
- ✅ All scores in range 0.50-1.00

**7. Event Log Integrity (1 check)**
- ✅ All events have valid structure (timestamp/event/type)

---

## ⚡ Performance

| Metric | Target | Actual |
|--------|--------|--------|
| Execution Time | < 10 seconds | ~35-50 ms |
| Average | < 10000 ms | 40 ms |
| Performance Ratio | 100% | 0.4% |

**5-Run Performance Test:**
- Min: 27 ms
- Max: 70 ms
- Avg: 40 ms
- **Well under 10-second requirement!**

---

## 📤 Output Formats

### Standard Output

```
═══════════════════════════════════════════════════════
  🧠 KDS BRAIN Integrity Test
═══════════════════════════════════════════════════════

Category: File Existence
Category: File Size Validation
Category: JSONL Syntax Validation
Category: YAML Syntax Validation
Category: Conversation History FIFO
Category: Knowledge Graph Confidence Scores
Category: Event Log Integrity

═══════════════════════════════════════════════════════
  Test Summary
═══════════════════════════════════════════════════════

  Total Checks:  13
  ✅ Passed:      13
  ❌ Failed:      0
  ⚠️  Warnings:    0

  Overall Status: PASS
  Execution Time: 35 ms

═══════════════════════════════════════════════════════
```

### Verbose Output

Shows detailed information for each check:

```powershell
.\test-brain-integrity.ps1 -Verbose
```

```
Category: File Existence
  ✅ conversation-history.jsonl exists
     Found at: D:\PROJECTS\NOOR CANVAS\KDS\kds-brain\conversation-history.jsonl
  ✅ knowledge-graph.yaml exists
     Found at: D:\PROJECTS\NOOR CANVAS\KDS\kds-brain\knowledge-graph.yaml
  ...
```

### JSON Output

Structured data for automation:

```json
{
  "timestamp": "2025-11-03T16:14:18.7616993-05:00",
  "overall_status": "PASS",
  "total_checks": 13,
  "passed": 13,
  "failed": 0,
  "warnings": 0,
  "execution_time_ms": 35,
  "checks": [
    {
      "category": "File Existence",
      "check": "conversation-history.jsonl exists",
      "status": "PASS",
      "message": "Found at: D:\\PROJECTS\\NOOR CANVAS\\KDS\\kds-brain\\conversation-history.jsonl"
    }
  ]
}
```

---

## 🚦 Exit Codes

| Exit Code | Meaning | Example |
|-----------|---------|---------|
| 0 | All checks passed ✅ | Healthy BRAIN state |
| 1 | 1 check failed ❌ | Single issue detected |
| 3 | 3 checks failed ❌ | Multiple issues |
| 13 | All checks failed ❌ | Catastrophic failure |

**Exit code equals the number of failed checks.**

---

## 🧪 Corruption Detection

### Test Scenarios

The `test-brain-corruption-scenarios.ps1` validates that the integrity test correctly detects various corruption types.

**6 Corruption Scenarios:**

1. **Missing File (events.jsonl)**
   - Temporarily renames events.jsonl
   - Expects 2 failures (existence + size checks)
   - ✅ Detection confirmed

2. **Invalid JSON in conversation-history.jsonl**
   - Adds malformed JSON line
   - Expects 2 failures (syntax + FIFO checks)
   - ✅ Detection confirmed

3. **Confidence Score Out of Range (2.5)**
   - Changes score from 0.95 to 2.5
   - Expects 1 failure (confidence check)
   - ✅ Detection confirmed

4. **Too Many Conversations (>20)**
   - Adds 20 test conversations
   - Expects 1 failure (FIFO limit)
   - ✅ Detection confirmed

5. **Duplicate Conversation IDs**
   - Adds conversation with existing ID
   - Expects 1 failure (unique ID check)
   - ✅ Detection confirmed

6. **YAML with Tabs (invalid)**
   - Replaces spaces with tabs
   - Expects 1 failure (YAML syntax)
   - ✅ Detection confirmed

**Detection Rate: 100% (6/6 scenarios)**

### Safety Features

- ✅ **Backs up** BRAIN files before testing
- ✅ **Restores** automatically after each scenario
- ✅ **Verifies** restoration succeeded
- ✅ **No permanent changes** to production data

### Running Corruption Tests

```powershell
.\KDS\tests\test-brain-corruption-scenarios.ps1
```

**Expected Output:**
```
Scenario: Missing File (events.jsonl)
  ✅ Corruption detected correctly (2 failures)

Scenario: Invalid JSON in conversation-history.jsonl
  ✅ Corruption detected correctly (2 failures)
  
...

═══════════════════════════════════════════════════════
  Corruption Detection Summary
═══════════════════════════════════════════════════════

  Total Scenarios:    6
  ✅ Passed:           6
  ❌ Failed:           0

  ✅ ALL CORRUPTION SCENARIOS DETECTED CORRECTLY
```

---

## 🤖 Playwright Automation

### Test Suite Coverage

**8 Automated Tests:**

1. ✅ Script executes successfully
2. ✅ Exit code 0 on success
3. ✅ Valid JSON output with -JsonOutput flag
4. ✅ All expected check categories present
5. ✅ All BRAIN files validated
6. ✅ Performance < 10 seconds (5-run average)
7. ✅ Verbose mode shows detailed output
8. ✅ Corruption detection works correctly

### Running Playwright Tests

```powershell
# From workspace root
npx playwright test KDS/tests/test-brain-integrity.spec.ts

# With UI (interactive)
npx playwright test KDS/tests/test-brain-integrity.spec.ts --ui

# Headed mode (see browser)
npx playwright test KDS/tests/test-brain-integrity.spec.ts --headed

# Specific test
npx playwright test -g "should return exit code 0"
```

**Test Results:**
```
Running 8 tests using 1 worker

  ✓  1 should execute test-brain-integrity.ps1 successfully (872ms)
  ✓  2 should return exit code 0 on success (908ms)
  ✓  3 should return valid JSON output (934ms)
  ✓  4 should validate all expected check categories (811ms)
  ✓  5 should validate all BRAIN files are checked (841ms)
  ✓  6 should complete in less than 10 seconds (4.2s)
  ✓  7 should run in verbose mode (845ms)
  ✓  8 should detect missing file corruption (1.7s)

  8 passed (21.3s)
```

---

## 🔧 Integration Examples

### Pre-Commit Validation

```powershell
# .git/hooks/pre-commit equivalent
if (.\KDS\tests\test-brain-integrity.ps1) {
    Write-Host "✅ BRAIN is healthy - safe to commit"
    git commit -m "Your commit message"
} else {
    Write-Host "❌ BRAIN integrity issues - fix before committing"
    exit 1
}
```

### CI/CD Integration

```yaml
# GitHub Actions / Azure Pipelines
steps:
  - name: Validate KDS BRAIN Integrity
    run: |
      pwsh -NoProfile -ExecutionPolicy Bypass -File KDS/tests/test-brain-integrity.ps1
    shell: pwsh
```

### Automated Monitoring

```powershell
# Schedule this to run hourly
$result = .\KDS\tests\test-brain-integrity.ps1 -JsonOutput | ConvertFrom-Json

if ($result.overall_status -ne "PASS") {
    $message = @"
KDS BRAIN Integrity Alert

Failed Checks: $($result.failed)
Warnings: $($result.warnings)
Timestamp: $($result.timestamp)

Details:
$($result.checks | Where-Object {$_.status -eq 'FAIL'} | ConvertTo-Json)
"@
    
    Send-MailMessage -To "team@example.com" `
                     -Subject "KDS BRAIN Integrity Alert" `
                     -Body $message
}
```

### Dashboard Integration (Future)

```javascript
// Dashboard API integration
async function checkBrainIntegrity() {
    const response = await fetch('http://localhost:8765/api/brain/integrity');
    const result = await response.json();
    
    displayBrainHealth(result);
}
```

---

## 🛠️ Troubleshooting

### Common Issues

#### Issue: "File not found" errors

**Cause:** BRAIN files missing or moved

**Solution:**
```powershell
# Check for missing files
Get-ChildItem KDS\kds-brain\*.jsonl, KDS\kds-brain\*.yaml

# Verify file permissions
Get-Acl KDS\kds-brain\*.jsonl

# Restore from backup if needed
Copy-Item KDS\kds-brain\_backup\* KDS\kds-brain\ -Force
```

#### Issue: "Invalid JSON" errors

**Cause:** Corrupted JSONL files

**Solution:**
```powershell
# Run verbose mode to see which line failed
.\test-brain-integrity.ps1 -Verbose

# View the specific file
code KDS\kds-brain\events.jsonl

# Check with JSON output for details
$result = .\test-brain-integrity.ps1 -JsonOutput | ConvertFrom-Json
$result.checks | Where-Object {$_.status -eq 'FAIL'}
```

#### Issue: "Confidence score out of range"

**Cause:** Invalid confidence score in knowledge-graph.yaml

**Valid Range:** 0.50 - 1.00

**Solution:**
```powershell
# Find all confidence scores
Select-String -Path KDS\kds-brain\knowledge-graph.yaml -Pattern "confidence:"

# Edit the file
code KDS\kds-brain\knowledge-graph.yaml

# Fix out-of-range scores (must be 0.50-1.00)
```

#### Issue: "Too many conversations (>20)"

**Cause:** FIFO queue exceeded limit

**Solution:**
```powershell
# Count conversations
$count = (Get-Content KDS\kds-brain\conversation-history.jsonl |  
           Where-Object {$_ -ne ""} | Measure-Object).Count
Write-Host "Conversation count: $count"

# If > 20, manually archive older ones
# (KDS should auto-manage this)
```

#### Issue: "Duplicate conversation IDs"

**Cause:** Same conversation ID used multiple times

**Solution:**
```powershell
# Find duplicates
Get-Content KDS\kds-brain\conversation-history.jsonl | 
    ConvertFrom-Json | 
    Group-Object conversation_id | 
    Where-Object Count -gt 1 |
    Select-Object Name, Count

# Remove or rename duplicates manually
code KDS\kds-brain\conversation-history.jsonl
```

#### Issue: "YAML with tabs (invalid)"

**Cause:** Tabs used instead of spaces in YAML

**Solution:**
```powershell
# YAML requires spaces, not tabs
# Check for tabs
Select-String -Path KDS\kds-brain\knowledge-graph.yaml -Pattern "`t"

# Replace tabs with spaces
$content = Get-Content KDS\kds-brain\knowledge-graph.yaml -Raw
$content = $content -replace "`t", "  "  # 2 spaces
$content | Out-File KDS\kds-brain\knowledge-graph.yaml -Encoding UTF8
```

---

## 📋 Best Practices

### When to Run Tests

**Always run before:**
- ✅ Committing changes to KDS BRAIN files
- ✅ Deploying to production
- ✅ Major KDS system updates
- ✅ After manual BRAIN file edits

**Run regularly:**
- ✅ Daily automated checks (CI/CD)
- ✅ After each KDS session completion
- ✅ Weekly comprehensive validation

**Run corruption tests:**
- ✅ After modifying test-brain-integrity.ps1
- ✅ When validating new BRAIN protection features
- ✅ During QA/testing phases

### Development Workflow

1. **Make changes** to KDS BRAIN files
2. **Run quick test**: `.\test-brain-integrity.ps1`
3. **Fix any failures** reported
4. **Run verbose**: `.\test-brain-integrity.ps1 -Verbose` to verify details
5. **Run Playwright tests**: Validate automation still works
6. **Commit**: Only after all tests pass

### Continuous Integration

```yaml
# Example CI/CD workflow
name: KDS BRAIN Validation

on: [push, pull_request]

jobs:
  brain-integrity:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Run BRAIN Integrity Test
        run: |
          pwsh -File KDS/tests/test-brain-integrity.ps1
        
      - name: Upload test results
        if: always()
        run: |
          $result = pwsh -File KDS/tests/test-brain-integrity.ps1 -JsonOutput
          $result | Out-File brain-test-results.json
        
      - uses: actions/upload-artifact@v2
        with:
          name: brain-test-results
          path: brain-test-results.json
```

---

## 📊 Files Reference

### Test Scripts

| File | Purpose | Usage |
|------|---------|-------|
| `test-brain-integrity.ps1` | Main integrity test | `.\test-brain-integrity.ps1 [-Verbose] [-JsonOutput]` |
| `test-brain-corruption-scenarios.ps1` | Corruption detection validation | `.\test-brain-corruption-scenarios.ps1` |
| `test-brain-integrity.spec.ts` | Playwright automation | `npx playwright test KDS/tests/test-brain-integrity.spec.ts` |

### BRAIN Files Validated

| File | Purpose | Max Size | Validation |
|------|---------|----------|------------|
| `conversation-history.jsonl` | Conversation tracking | N/A | JSONL syntax, FIFO (≤20), unique IDs |
| `knowledge-graph.yaml` | Learning patterns | N/A | YAML syntax, confidence scores (0.50-1.00) |
| `development-context.yaml` | Project metrics | N/A | YAML syntax |
| `events.jsonl` | Event log | 50 MB | JSONL syntax, event structure |

---

## 🎯 Acceptance Criteria (All Met ✅)

- ✅ Validate all BRAIN files exist
- ✅ Validate JSON/JSONL syntax
- ✅ Validate YAML syntax
- ✅ Validate conversation history FIFO queue (max 20, no duplicates)
- ✅ Validate knowledge graph confidence scores (0.50-1.00 range)
- ✅ Validate event log integrity (all lines valid JSON)
- ✅ Validate file sizes are reasonable (events.jsonl < 50MB)
- ✅ Return structured result with pass/fail per check
- ✅ Exit code 0 on success, non-zero on failure
- ✅ Complete in < 10 seconds (actual: ~40ms)

---

## 📈 Future Enhancements

### Planned Features
- [ ] VS Code task integration
- [ ] KDS dashboard "Validate BRAIN" button
- [ ] Git hooks integration
- [ ] Automated backup before validation
- [ ] Historical trend analysis
- [ ] Email/Slack notifications on failure
- [ ] Detailed repair suggestions
- [ ] Auto-fix for common issues

### Enhancement Ideas
- Schema validation for YAML files using JSON Schema
- Deep semantic validation of knowledge graph relationships
- Relationship consistency checks (file_relationships validation)
- Event log analytics and anomaly detection
- Performance profiling per check category
- Parallel execution for faster validation
- BRAIN health score (0-100)
- Predictive failure detection

---

**Status:** Test System Complete ✅  
**Next:** Integrate with KDS dashboard and VS Code tasks  
**Goal:** Zero BRAIN corruption incidents in production

