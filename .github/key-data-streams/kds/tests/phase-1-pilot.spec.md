# Phase 1 Pilot Test: Honest Handoff Protocol
**Key: `kds`** | **Phase**: 1/10 | **Test Type**: Coordination Test

---

## 🎯 Test Objective

Validate that `route.prompt.md` implements honest handoff to `plan.prompt.md` using JSON files + Next Command + HALT behavior (no auto-execution).

---

## 📋 Test Scenario

**Given**: User requests feature planning via route.prompt.md  
**When**: Route agent analyzes request and determines plan.prompt.md is correct agent  
**Then**: Route agent should:
1. Create `handoffs/route-to-plan.json` with structured parameters
2. Display Next Command with `@workspace /plan #file:handoffs/route-to-plan.json`
3. HALT execution (not attempt to "execute as agent")
4. Show key reference in Next Command output

---

## ✅ Acceptance Criteria

### AC1: JSON Handoff File Created
- [ ] File exists at `.github/key-data-streams/{key}/handoffs/route-to-plan.json`
- [ ] Contains required fields: `key`, `description`, `acceptanceCriteria`
- [ ] Optional fields included when relevant: `phase`, `task`, `autoChain`, `nextTask`
- [ ] JSON is valid and parseable

### AC2: Next Command Displayed
- [ ] Output shows exact command: `@workspace /plan #file:handoffs/route-to-plan.json`
- [ ] Command includes key reference (e.g., "Next Command (Key: kds):")
- [ ] Command is copy-pasteable (no formatting breaks)

### AC3: HALT Behavior
- [ ] Route agent stops after showing Next Command
- [ ] No attempt to "execute as agent" or simulate plan.prompt.md
- [ ] No additional output beyond handoff summary

### AC4: Honest Language
- [ ] Output does not claim "EXECUTE AS AGENT" or "TRANSITIONS CONTROL"
- [ ] Uses honest language: "Next, invoke plan agent manually" or similar
- [ ] Clarifies user must copy-paste command

---

## 🧪 Test Execution Steps

### Step 1: Invoke Route Agent
**Command**:
```
@workspace /route I need a plan for implementing database backup automation. Key should be "db-backup".
```

**Expected Output Format**:
```
🧠 Analysis (Key: route)
Request: Database backup automation planning
Recommended Agent: plan.prompt.md
Reason: Multi-phase feature requiring phased execution plan

📄 Handoff File Created
Path: .github/key-data-streams/db-backup/handoffs/route-to-plan.json
Contents:
{
  "key": "db-backup",
  "description": "Implement database backup automation...",
  "acceptanceCriteria": ["Automated backups...", "Retention policy..."],
  "autoChain": false
}

Next Command (Key: db-backup):
@workspace /plan #file:.github/key-data-streams/db-backup/handoffs/route-to-plan.json
```

### Step 2: Verify JSON File
**Command** (manual verification):
```powershell
Get-Content .github/key-data-streams/db-backup/handoffs/route-to-plan.json | ConvertFrom-Json
```

**Expected**: Valid JSON object with all required fields

### Step 3: Invoke Plan Agent (Manual)
**Command** (copy-pasted from Step 1 output):
```
@workspace /plan #file:.github/key-data-streams/db-backup/handoffs/route-to-plan.json
```

**Expected**: Plan agent loads JSON, generates multi-phase plan, creates plan.md

### Step 4: Verify No Auto-Execution
**Check**: Route agent output from Step 1 does NOT contain:
- Plan content (phases, tasks, timelines)
- Statements like "Executing plan agent now..."
- Any output beyond handoff JSON + Next Command

---

## 🔍 Validation Checklist

**File System Checks**:
- [ ] handoffs/route-to-plan.json exists
- [ ] JSON structure matches schema in kds-handoff-protocol.md
- [ ] File created before route agent shows Next Command

**Output Checks**:
- [ ] Key displayed in output (subtle but visible)
- [ ] Next Command shown clearly
- [ ] No code blocks (MANDATORY.md Rule #1 compliant)
- [ ] Honest handoff language (no false claims)

**Behavioral Checks**:
- [ ] Route agent halts after handoff
- [ ] Plan agent requires manual invocation
- [ ] JSON file persists for audit trail

---

## 🚨 Failure Modes

| Failure Mode | Symptom | Root Cause | Fix |
|--------------|---------|------------|-----|
| **Auto-Execution** | Route output includes plan content | route.prompt.md tries to "execute as agent" | Remove execution logic, enforce HALT |
| **Missing JSON** | No handoffs/route-to-plan.json created | Route skips file creation step | Add file creation before Next Command |
| **Invalid JSON** | ConvertFrom-Json fails | Malformed JSON structure | Validate JSON schema before saving |
| **No Key Display** | User can't find active key | Missing key reference in output | Add key display per Agentic Rule #9 |
| **No HALT** | Route continues to plan steps | Missing explicit HALT instruction | Add HALT directive after Next Command |

---

## 📊 Success Metrics

**Pass Criteria**: All 4 Acceptance Criteria met (AC1-AC4)  
**Test Duration**: 5-7 minutes (manual execution)  
**Automation Status**: Manual test (requires human observation of agent behavior)  
**Repeatability**: Can be run with different feature requests to validate consistency

---

## 🔄 Rollback Plan

If test fails due to route.prompt.md bugs:
1. Revert to pre-Phase-3 commit (before honest handoff implementation)
2. Fix route.prompt.md issues identified in failure modes table
3. Re-run test until all AC pass

---

## 📝 Test Log Template

```markdown
## Test Run: [Date/Time]
**Tester**: [Name]
**Key Used**: [e.g., db-backup]

### Results:
- [ ] AC1: JSON Handoff File Created
- [ ] AC2: Next Command Displayed
- [ ] AC3: HALT Behavior
- [ ] AC4: Honest Language

### Notes:
[Any observations, edge cases, or issues encountered]

### Verdict: ✅ PASS / ❌ FAIL
```

---

**Key: `kds`** | **Test Status**: Ready for Execution | **Next**: Run pilot test before implementing kds.prompt.md
