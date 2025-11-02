# Algorithm 15: Router Performance Validation

**Purpose**: Validate route.prompt.md compliance with Rules #9, #11, #12, #18 and generate router performance score

**Applies To**: route.prompt.md, ask.prompt.md (routing prompts)

**Enforcement**: Automated via kds.prompt.md Review Mode Step 0.2

---

## Overview

Router Performance Validation ensures routing prompts (route.prompt.md, ask.prompt.md) properly:
1. **Detect keys** in user requests (Rule #9)
2. **Load existing plans** for conflict detection (Rule #11)
3. **Create handoff JSONs** with complete parameters (Rule #12)
4. **Remain exempt from Step -1** governance to preserve routing workflow (Rule #18)

**Output**: Router performance score (0-100) + compliance report

---

## Validation Checks

### 1. Key Detection (Rule #9) - 30 points

**What to validate**:
- Router parses `key` parameter from user input
- Router searches existing key-data-streams for related keys
- Router displays key status (FOUND/NOT_FOUND/RELATED)
- Router loads existing plan.md when key found

**Pass Criteria**:
```markdown
✅ PASS (30 points):
- key parameter extraction logic present
- .github/key-data-streams/ search implemented
- Key status displayed in output
- Plan loading logic present (grep search or file read)

⚠️ PARTIAL (15 points):
- Key extraction present BUT search logic missing
- OR key status not displayed

❌ FAIL (0 points):
- No key detection logic
- Router creates duplicate keys without checking
```

**Test Cases**:
1. User provides explicit key: `/route key=test-123 request="..."`
   - Expected: Router extracts "test-123", searches for existing key, loads plan if found
2. User omits key: `/route request="Add feature X"`
   - Expected: Router generates key, searches for related keys, offers merge option

**Violation Examples**:
- Router accepts key but doesn't search for existing keys (creates duplicates)
- Key parameter ignored, always generates new key
- No plan loading logic when existing key found

---

### 2. Plan Loading (Rule #11) - 30 points

**What to validate**:
- Router loads `.github/key-data-streams/{key}/plan.md` when existing key detected
- Router analyzes plan for conflicts with new request
- Router presents conflict resolution options (Merge/Replace/Create New/Review)
- Router displays plan summary in output

**Pass Criteria**:
```markdown
✅ PASS (30 points):
- Plan loading logic present (file read for existing keys)
- Conflict detection algorithm implemented
- Resolution options displayed (A/B/C/D format)
- Plan summary shown to user

⚠️ PARTIAL (15 points):
- Plan loading present BUT no conflict detection
- OR conflict detection without resolution options

❌ FAIL (0 points):
- No plan loading logic
- Router always creates new plan (overwrites existing)
```

**Test Cases**:
1. Existing key with plan: `/route key=existing-key request="Add conflicting feature"`
   - Expected: Loads plan, detects conflict, presents resolution options
2. New key: `/route key=new-key request="..."`
   - Expected: No plan loading, proceeds to plan creation

**Violation Examples**:
- Router routes to plan.prompt.md without checking for existing plan
- Plan exists but router generates new plan (data loss)
- No conflict detection when existing plan scope differs from new request

---

### 3. Handoff Creation (Rule #12) - 30 points

**What to validate**:
- Router generates valid handoff JSON using kds-handoff-protocol.md
- Handoff includes all required fields (key, description, acceptanceCriteria, files, autoChain, nextTask)
- Handoff pre-populates parameters (not placeholders like "{key}")
- Router displays "Next Command" with handoff path
- Router HALTs after handoff creation (no auto-execution)

**Pass Criteria**:
```markdown
✅ PASS (30 points):
- Handoff JSON created with valid schema
- All required fields populated with real values
- Next Command displayed with absolute path
- Router HALTs (user must invoke next prompt)

⚠️ PARTIAL (15 points):
- Handoff created BUT missing required fields
- OR placeholders instead of real values
- OR no Next Command displayed

❌ FAIL (0 points):
- No handoff JSON created
- Router auto-executes target prompt (violates Honest Handoff)
```

**Test Cases**:
1. Route to plan: `/route request="Multi-task feature"`
   - Expected: Creates `.github/key-data-streams/{key}/handoffs/route-to-plan.json`, displays Next Command, HALTs
2. Route to todo: `/route key=existing request="Single task"`
   - Expected: Creates handoff with pre-populated key/phase/task, HALTs

**Violation Examples**:
- Router says "Routing to plan.prompt.md" but doesn't create handoff JSON
- Handoff JSON has `"key": "{key}"` instead of actual key value
- Router auto-executes plan.prompt.md instead of HALTing

---

### 4. Router Exemption (Rule #18) - 10 points

**What to validate**:
- Router prompt has ZERO Step -1 governance blocks
- Router can execute full workflow (Steps 0-7) without governance halt
- Multi-task detection (Step 1.5) is functional
- Router creates handoffs for plan creation (not bypassed)

**Pass Criteria**:
```markdown
✅ PASS (10 points):
- No Step -1 section found in route.prompt.md or ask.prompt.md
- Router workflow executes without governance interruption
- Multi-task detection step present and functional
- Handoff to plan.prompt.md created for multi-task requests

❌ FAIL (0 points):
- Step -1 section found in router (violates Rule #18)
- Router workflow broken (skips steps due to governance halt)
- Multi-task requests executed directly without plan creation
```

**Test Cases**:
1. Multi-task request: `/route request="Task A, Task B, Task C"`
   - Expected: Router detects 3 tasks, routes to plan.prompt.md, creates handoff
2. Check route.prompt.md content:
   - Expected: No "Step -1" heading, no governance enforcement block

**Violation Examples**:
- Step -1 block added to route.prompt.md (regression from commit da40bc31)
- Router bypasses Step 1.5 (multi-task detection) due to governance halt
- Multi-task requests executed directly instead of routing to plan.prompt.md

---

## Scoring Algorithm

**Total Score = Key Detection + Plan Loading + Handoff Creation + Router Exemption**

**Scoring Scale**:
- **90-100**: Excellent (full compliance, all features working)
- **80-89**: Good (minor gaps, mostly compliant)
- **70-79**: Acceptable (some features missing, needs improvement)
- **60-69**: Poor (significant gaps, multiple violations)
- **<60**: Critical (router fundamentally broken)

**Example Score**:
```json
{
  "router_performance_score": 85,
  "key_detection_score": 30,
  "plan_loading_score": 25,
  "handoff_creation_score": 20,
  "exemption_compliance_score": 10,
  "violations": [
    "Plan loading present but conflict detection missing (-5 points)"
  ],
  "recommendations": [
    "Add conflict detection algorithm to plan loading logic (see kds-validation-algorithms.md Algorithm 6)"
  ]
}
```

---

## Output Format

**JSON Schema**:
```json
{
  "router_performance_score": 0-100,
  "key_detection_score": 0-30,
  "plan_loading_score": 0-30,
  "handoff_creation_score": 0-30,
  "exemption_compliance_score": 0-10,
  "violations": ["string array of issues found"],
  "recommendations": ["string array of fixes"],
  "compliance_level": "EXCELLENT|GOOD|ACCEPTABLE|POOR|CRITICAL",
  "tested_prompts": ["route.prompt.md", "ask.prompt.md"]
}
```

**Markdown Report**:
```markdown
## Router Performance Validation (Algorithm 15)

**Score**: 85/100 (GOOD)

**Breakdown**:
- Key Detection (Rule #9): 30/30 ✅
- Plan Loading (Rule #11): 25/30 ⚠️
- Handoff Creation (Rule #12): 20/30 ⚠️
- Router Exemption (Rule #18): 10/10 ✅

**Violations**:
- Plan loading present but conflict detection missing (-5 points)
- Handoff JSON missing 'files' field (-10 points)

**Recommendations**:
- Add conflict detection algorithm to plan loading logic
- Ensure all handoff JSONs include 'files' array (even if empty)
```

---

## Integration Points

**1. KDS Review Mode (kds.prompt.md Step 0.2)**:
- Execute router-performance-validation.md during conversation history analysis
- Include router score in overall compliance report

**2. Router Modification Workflow**:
- When modifying route.prompt.md or ask.prompt.md via kds.prompt.md
- Run Algorithm 15 to verify no regressions introduced

**3. Pre-Commit Hook**:
- Validate router performance before committing changes to route.prompt.md
- Block commit if score < 70 (ACCEPTABLE threshold)

---

## Maintenance

**Last Validated**: 2025-11-01  
**Validation Frequency**: 30 days  
**Owner**: KDS governance system  
**Related Rules**: #9 (Plan Conflict Detection), #11 (Key Display), #12 (Honest Handoff), #18 (Router Exemption)
