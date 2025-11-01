# Test: Rule #18 Router Exemption

**Rule**: Routing prompts (route.prompt.md, ask.prompt.md) are EXEMPT from Step -1 governance enforcement

**Severity**: CRITICAL

**Last Tested**: Never

---

## Assertion

route.prompt.md and ask.prompt.md MUST NOT have a Step -1 governance block to preserve routing workflow integrity

---

## Test Scope

**Files Under Test**:
- `.github/prompts/route.prompt.md`
- `.github/prompts/ask.prompt.md`

**Validation Function**: `ValidateRouterExemption()` (kds-rulebook.json)

---

## Test Steps

### Step 1: Load Router Prompts

```
Read route.prompt.md content
Read ask.prompt.md content
```

### Step 2: Search for Step -1 Sections

**Detection Patterns**:
- `## Step -1:` (heading)
- `### Step -1:` (subheading)
- `**Step -1:**` (bold)
- Any heading containing "Step -1" or "Governance Enforcement"

**Algorithm**:
```
FOR EACH router prompt (route.prompt.md, ask.prompt.md):
  Search content for Step -1 patterns
  IF Step -1 found:
    Record violation with line number
  ELSE:
    Mark as compliant
```

### Step 3: Verify Routing Workflow Intact

**Check that router can execute Steps 0-7**:
1. Step 0: Load context
2. Step 1: Analyze request (including Step 1.5 multi-task detection)
3. Step 2: Determine target agent
4. Step 3: Generate key
5. Step 4: Create handoff JSON
6. Step 5: Display options
7. Step 6: Execute handoff (or HALT for user approval)

**Validation**:
```
Search route.prompt.md for:
  "Step 1.5" or "multi-task detection" → MUST be present
  Handoff JSON creation logic → MUST be present
  plan.prompt.md routing → MUST be present
```

### Step 4: Check Execution Prompts for Step -1

**Verify Step -1 IS present in execution prompts** (proper enforcement location):
- `.github/prompts/plan.prompt.md`
- `.github/prompts/task.prompt.md`
- `.github/prompts/todo.prompt.md`
- `.github/prompts/test-generation.prompt.md`

**Algorithm**:
```
FOR EACH execution prompt:
  Search for Step -1 block
  IF Step -1 NOT found:
    Record missing enforcement violation
```

---

## Expected Outcomes

### ✅ PASS Criteria

**For Routers (route.prompt.md, ask.prompt.md)**:
1. NO Step -1 sections found in either file
2. Multi-task detection (Step 1.5) is present and functional
3. Handoff JSON creation logic exists
4. Routing to plan.prompt.md works for multi-task requests

**For Executors (plan, task, todo, test-generation)**:
1. Step -1 block present in each file
2. Step -1 enforces KDS governance (references Rule #10)

### ❌ FAIL Criteria

**CRITICAL Violations**:
1. Step -1 found in route.prompt.md or ask.prompt.md
2. Multi-task detection missing from route.prompt.md
3. Router auto-executes instead of creating handoffs

**HIGH Violations**:
1. Step -1 missing from execution prompts (plan/task/todo)
2. Step -1 present but doesn't reference Rule #10

---

## Violation Examples

### Example 1: Step -1 in Router (CRITICAL)

**File**: route.prompt.md  
**Line**: 15-35  
**Content**:
```markdown
## Step -1: KDS Governance Enforcement

Before routing, check if .github modifications proposed...
```

**Impact**: Breaks routing workflow - bypasses multi-task detection, prevents plan creation

**Fix**:
```
Remove Step -1 section from route.prompt.md per Rule #18
Verify route.prompt.md can execute Steps 0-7 without governance halt
```

### Example 2: Missing Step -1 in Executor (HIGH)

**File**: task.prompt.md  
**Line**: N/A (missing)  
**Content**: No Step -1 block found

**Impact**: Allows .github modifications without governance review

**Fix**:
```
Add Step -1 enforcement to task.prompt.md (see Rule #10 for reference)
```

---

## Rollback on Failure

### If Step -1 Found in Router:

**Action**: Remove Step -1 block immediately

**Justification**: Rule #18 - Router exemption is critical to prevent regression (commit da40bc31 broke routing workflow when Step -1 was added)

**Restoration Steps**:
1. Delete Step -1 section from router prompt
2. Verify multi-task detection still works
3. Test: `/route request="Task A, Task B"` → Should route to plan.prompt.md
4. Commit with message: `fix(kds): Remove Step -1 from router per Rule #18 (restore routing workflow)`

### If Step -1 Missing from Executor:

**Action**: Add Step -1 reference to execution prompt

**Template**:
```markdown
## Step -1: KDS Governance Enforcement

**LOAD FIRST:** `.github/governance/kds-rulebook.md` - Rule #10 (KDS Governance)

**CRITICAL CHECK** - Before ANY execution:

IF modifying `.github/` OR modifying KDS files:
  → HALT and route to @workspace /kds for governance review
  → Provide: full context + rationale + change request
  → Do NOT proceed until kds.prompt.md approves change

**Enforcement**: All .github changes MUST pass through kds.prompt.md gatekeeper
```

---

## Automated Checks

**Pre-Commit Hook**:
```powershell
# Check router exemption before committing changes to route.prompt.md
$routerFiles = @("route.prompt.md", "ask.prompt.md")
$violations = @()

foreach ($file in $routerFiles) {
    $content = Get-Content ".github/prompts/$file" -Raw
    if ($content -match "##\s*Step\s*-1") {
        $violations += "CRITICAL: Step -1 found in $file (violates Rule #18)"
    }
}

if ($violations.Count -gt 0) {
    Write-Error "Router Exemption Violation Detected:"
    $violations | ForEach-Object { Write-Error $_ }
    exit 1
}
```

**KDS Review Mode Integration**:
- Execute this test during kds.prompt.md Review Mode Step 3 (Validate Against Rulebook)
- Report violations in compliance summary
- Auto-fix available: Remove Step -1 from routers, add to executors

---

## Test Metadata

**Test ID**: test-rule-18-router-exemption  
**Category**: Governance  
**Frequency**: Every KDS Review Mode execution + Pre-commit  
**Auto-Fix**: Supported (remove Step -1 from routers)  
**Related Tests**: test-rule-10-kds-governance, test-rule-19-dual-rulebook-sync  
**Estimated Runtime**: <5 seconds (file content search)
