# 🛡️ KDS Gatekeeper Analysis
**Key: `kds`** | **Date**: 2025-10-31 | **Analyst**: kds.prompt.md

---

## 📋 Request Summary

**User Request**: 
1. Implement enforcement gate in all prompts to block direct .github modifications
2. Create dual-format KDS Rulebook (user-friendly + machine-readable)
3. Execute system cleanup (remove obsolete keys, preserve hcp-*)

**Complexity**: High (affects 11+ prompts, creates new governance document, modifies KDS structure)

---

## 🔍 Step 1: Load Context

### Loaded Documents:
✅ **kds-handoff-protocol.md** - Handoff standards (honest handoff, JSON schemas)  
✅ **kds.plan.md** - Active KDS plan (9 agentic rules, 10 phases, Phase 0-1 complete)  
❌ **MANDATORY.md** - NOT FOUND (expected at `.github/instructions/MANDATORY.md`)  
⚠️ **SelfAwareness.instructions.md** - Not loaded (need to verify location)

### Key Data Stream Scan:
**Total Keys Found**: 40+ keys in `.github/key-data-streams/`

**HCP Keys (PRESERVE)**:
- `hcp-refactor/`
- `hcp-refactor-phase1/`
- `hcp-timer/`
- `hcp-timer-v2/`

**Obsolete Candidates** (require validation):
- `auto-drift-detection/` (drift now in prompts/)
- `auto-execution-fix/` (auto-chain implemented in plan.prompt.md)
- `cohesion/` + `cohesion-cleanup-consolidation/` (duplicate?)
- `drift-prompt/` + `drift-prompt-efficiency/` (duplicate?)
- `prompt/` + `prompt-efficiency-fix/` + `prompt-merged/` + `prompt-state-integration/` (4 prompt-related keys - consolidate?)
- `workspace-cleanup/` (obsolete if we're doing cleanup now?)
- `_ARCHIVE/` (already archived - safe to delete?)

---

## 🚨 Critical Finding: MANDATORY.md Missing

**Issue**: MANDATORY.md file not found at expected location (`.github/instructions/MANDATORY.md`)

**Impact**:
- Cannot validate Rule #1 (Concise Output Format) compliance
- No canonical reference for baseline rules
- kds.plan.md references "MANDATORY.md Rule #1 violations" but file is missing

**Resolution Required BEFORE proceeding**:

**Option A**: Locate existing MANDATORY.md
```powershell
# Search for MANDATORY.md
Get-ChildItem -Path ".github" -Recurse -Filter "MANDATORY.md"
```

**Option B**: Create MANDATORY.md from kds.plan.md references
- Extract Rule #1 (Concise Output Format - No code in chat)
- Extract Rule #2 (Document First)
- Extract Rule #3 (Playwright Orchestration)

**Option C**: Defer MANDATORY.md to Rulebook creation (consolidate into single source)

**Recommendation**: **Option C** - Create KDS Rulebook as THE canonical source, deprecate MANDATORY.md

---

## ✅ Step 2: Compatibility Analysis

### Request Component 1: Enforcement Gate

**Proposed Change**: Add Step 0 to all prompts detecting direct .github modification requests

**Affected Files** (11 prompts):
1. plan.prompt.md
2. route.prompt.md
3. task.prompt.md
4. todo.prompt.md
5. test-generation.prompt.md
6. healthcheck.prompt.md
7. drift.prompt.md
8. cohesion.prompt.md
9. collapse-keys.prompt.md
10. ask.prompt.md
11. (kds.prompt.md itself - no change needed, it's the gatekeeper)

**Conflicts Detected**: ❌ NONE

**Cascading Impacts**:
- All prompts gain enforcement logic (consistent behavior ✅)
- Users redirected to `@workspace /kds` for .github changes
- Enforcement message must include copy-paste command format

**Compatibility Reasoning**:
- ✅ Aligns with Agentic Rule #8 (KDS Governance)
- ✅ Prevents accidental violations of kds-handoff-protocol
- ✅ No conflicts with existing step numbering (inject as Step -1 or Step 0)

**Approval**: ✅ GRANTED (with implementation spec below)

---

### Request Component 2: KDS Rulebook Creation

**Proposed Change**: Create canonical governance document in dual format

**New Files**:
1. `.github/governance/kds-rulebook.md` (user-friendly)
2. `.github/governance/kds-rulebook.json` (machine-readable)

**Consolidation Strategy**:

**Sources to Merge**:
1. MANDATORY.md (missing - infer from kds.plan.md references)
   - Rule #1: Concise Output Format
   - Rule #2: Document First
   - Rule #3: Playwright Orchestration
   
2. kds.plan.md - Agentic Execution Rules (9 rules)
   - Rule #1: Document First, Respond Later
   - Rule #2: Per-Task Handoffs
   - Rule #3: TDD Approach
   - Rule #4: Auto-Chain with Task/Phase Control
   - Rule #5: Test-Generation Handoffs
   - Rule #6: Holistic File Regeneration
   - Rule #7: Plan Conflict Detection
   - Rule #8: KDS Governance
   - Rule #9: Key Display in User Output

3. kds-handoff-protocol.md - Handoff Standards
   - Honest handoff rules (DO/DON'T lists)
   - JSON schemas
   - Workflow patterns

**Conflicts Detected**: ⚠️ POTENTIAL DUPLICATION

**Duplication Analysis**:
- "Document First" appears in both MANDATORY.md Rule #2 AND Agentic Rule #1
- Are these the same rule or different scopes?
  - MANDATORY Rule #2: Update KDS files before code changes
  - Agentic Rule #1: Finalize artifacts before user output
  - **Resolution**: Different scopes - keep both, clarify relationship

**Compatibility Reasoning**:
- ✅ Consolidates scattered rules into single source of truth
- ✅ Dual format supports both human review and machine validation
- ✅ Deprecates MANDATORY.md (prevent duplication going forward)
- ⚠️ Requires careful merge to avoid contradictions

**Approval**: ✅ GRANTED (with merge strategy below)

---

### Request Component 3: System Cleanup

**Proposed Change**: Remove obsolete keys from `.github/key-data-streams/`

**Preservation List** (HCP keys):
- ✅ hcp-refactor/
- ✅ hcp-refactor-phase1/
- ✅ hcp-timer/
- ✅ hcp-timer-v2/

**Deletion Candidates** (require validation):

**High Confidence (likely obsolete)**:
1. `auto-drift-detection/` - Drift now in prompts/drift.prompt.md
2. `auto-execution-fix/` - Auto-chain implemented in plan.prompt.md
3. `workspace-cleanup/` - Superseded by this cleanup
4. `_ARCHIVE/` - Already archived

**Medium Confidence (check for references)**:
5. `cohesion/` + `cohesion-cleanup-consolidation/` - Consolidate to single key?
6. `drift-prompt/` + `drift-prompt-efficiency/` - Consolidate to single key?
7. `prompt/` + `prompt-efficiency-fix/` + `prompt-merged/` + `prompt-state-integration/` - 4 prompt keys, consolidate?

**Low Confidence (preserve until validated)**:
8. `canvas-receivers/` - May be active feature
9. `cdn-dev-cors/` - May be active feature
10. `cloudflare-tunnel-stability/` - May be active feature
11. `database-environment-safeguards/` - May be active feature
12. `debug-panel/` - May be active feature

**Conflicts Detected**: ⚠️ REFERENCE CHECK REQUIRED

**Risk**: Deleting keys that are still referenced in code/docs

**Mitigation Required**:
1. Scan all `.md` files for references to deletion candidates
2. Scan all `.cs` files for key references
3. Confirm no active work in deletion candidates (check work-logs)

**Compatibility Reasoning**:
- ✅ Cleanup prevents future key conflicts
- ✅ Preserves HCP work as requested
- ⚠️ Requires reference validation before deletion

**Approval**: ✅ CONDITIONAL (pending reference scan)

---

## 📊 Step 3: Cascading Impact Assessment

### Impact Matrix

| Change | Prompts Affected | Docs Affected | Tests Required | Risk Level |
|--------|------------------|---------------|----------------|------------|
| Enforcement Gate | 11 prompts | 0 | Validation test | Medium |
| KDS Rulebook | 0 (new file) | 3 (MANDATORY, plan, protocol) | Schema validation | Low |
| System Cleanup | 0 | TBD (scan results) | Regression tests | High |

### Estimated Duration

**Phase 1: Enforcement Gate** (60-90 min)
- Add Step -1 to 11 prompts
- Create enforcement message template
- Test with sample modification request

**Phase 2: KDS Rulebook** (90-120 min)
- Merge 3 rule sources
- Create user-friendly markdown (with examples, anti-patterns)
- Create machine-readable JSON schema
- Validate no contradictions

**Phase 3: System Cleanup** (45-60 min)
- Scan references (20 min)
- Delete validated obsolete keys (10 min)
- Consolidate duplicate keys (15 min)
- Update index files (10 min)

**Total**: 3-4.5 hours

---

## ✅ Step 4: Approval Decision

### Overall Verdict: ✅ APPROVED WITH CONDITIONS

**Conditions**:
1. **MANDATORY.md Resolution**: Proceed with Option C (deprecate via Rulebook)
2. **Reference Scan**: Execute before deleting any keys
3. **Test Validation**: Create enforcement gate test before rollout

---

## 📋 Step 5: Implementation Plan

### Phase 1: Enforcement Gate Implementation

**Files to Modify** (11 prompts):
- plan.prompt.md
- route.prompt.md  
- task.prompt.md
- todo.prompt.md
- test-generation.prompt.md
- healthcheck.prompt.md
- drift.prompt.md
- cohesion.prompt.md
- collapse-keys.prompt.md
- ask.prompt.md

**Injection Point**: Step -1 (before all other steps)

**Enforcement Logic**:
```
Step -1: GOVERNANCE ENFORCEMENT CHECK

IF user request contains:
  - "update prompt" OR "modify .github" OR "change instruction"
  - AND target is .github/prompts/*.md OR .github/instructions/*.md
  - AND current prompt ≠ kds.prompt.md
THEN:
  HALT execution
  Display enforcement message:
  
  "⚠️ GOVERNANCE ENFORCEMENT
  
  Changes to .github prompts/instructions must go through KDS gatekeeper.
  
  Please use this command instead:
  
  ```markdown
  @workspace /kds request="[your change request here]"
  ```
  
  Why: Ensures compatibility analysis and prevents rule conflicts.
  See: .github/prompts/kds.prompt.md"
  
  STOP (do not proceed with Steps 0+)
ELSE:
  Proceed to Step 0
```

**Estimated Time**: 60-90 minutes

---

### Phase 2: KDS Rulebook Creation

**File 1**: `.github/governance/kds-rulebook.md` (User-Friendly)

**Structure**:
```markdown
# KDS Governance Rulebook
Version: 1.0.0 | Status: CANONICAL SOURCE OF TRUTH

## Core Principles
[High-level governance philosophy]

## Rule Categories

### Category 1: Output Format Rules
- Rule #1: Concise Output Format (from MANDATORY)
- Rule #9: Key Display (from Agentic)

### Category 2: Workflow Rules  
- Rule #2: Document First (from MANDATORY + Agentic)
- Rule #3: TDD Approach (from Agentic)
- Rule #4: Auto-Chain Control (from Agentic)

### Category 3: Handoff Rules
- Rule #5: Test-Generation Handoffs (from Agentic)
- Honest Handoff Protocol (from kds-handoff-protocol)

### Category 4: Governance Rules
- Rule #6: Holistic File Regeneration (from Agentic)
- Rule #7: Plan Conflict Detection (from Agentic)
- Rule #8: KDS Governance (from Agentic)

### Category 5: Orchestration Rules
- Rule #3: Playwright Orchestration (from MANDATORY)

## Each Rule Format:
- Rule Statement
- Rationale (why it exists)
- Examples (compliant + violations)
- Anti-Patterns (what NOT to do)
- Enforcement (how it's checked)
```

**File 2**: `.github/governance/kds-rulebook.json` (Machine-Readable)

**Structure**:
```json
{
  "version": "1.0.0",
  "status": "canonical",
  "lastUpdated": "2025-10-31",
  "rules": [
    {
      "id": "output-format-concise",
      "category": "output-format",
      "statement": "No code blocks in user-facing output",
      "severity": "critical",
      "enforcement": "automated",
      "validator": "grep-search pattern for code blocks",
      "violations": [
        {"pattern": "```markdown", "context": "Output Format section"},
        {"pattern": "```csharp", "context": "User-facing examples"}
      ]
    }
  ],
  "categories": [...],
  "enforcement": {
    "automated": ["output-format-concise", ...],
    "manual": ["governance-gate", ...]
  }
}
```

**Estimated Time**: 90-120 minutes

---

### Phase 3: System Cleanup

**Step 3a: Reference Scan** (20 min)
```powershell
# Scan for key references
$deletionCandidates = @(
  "auto-drift-detection",
  "auto-execution-fix",
  "workspace-cleanup",
  "_ARCHIVE",
  "cohesion",
  "cohesion-cleanup-consolidation",
  "drift-prompt",
  "drift-prompt-efficiency",
  "prompt",
  "prompt-efficiency-fix",
  "prompt-merged",
  "prompt-state-integration"
)

foreach ($key in $deletionCandidates) {
  Write-Host "Scanning for references to: $key"
  
  # Search .md files
  Get-ChildItem -Recurse -Include *.md | Select-String $key
  
  # Search .cs files  
  Get-ChildItem -Recurse -Include *.cs | Select-String $key
  
  # Check work-log for recent activity
  if (Test-Path ".github/key-data-streams/$key/work-log.md") {
    Get-Content ".github/key-data-streams/$key/work-log.md" | Select-Object -Last 20
  }
}
```

**Step 3b: Safe Deletion** (10 min)
- Delete keys with ZERO references found
- Move to `_ARCHIVE/` if unsure

**Step 3c: Consolidation** (15 min)
- Merge duplicate keys (e.g., cohesion + cohesion-cleanup-consolidation)
- Update references to point to consolidated key

**Step 3d: Index Update** (10 min)
- Update `.github/key-data-streams/index.md`
- Update `CDN-KEYS-INDEX.md`
- Update `active.keys.log`

**Estimated Time**: 45-60 minutes

---

## 📝 Step 6: Generate Handoff JSONs

### Handoff 1: Enforcement Gate Implementation
**File**: `.github/key-data-streams/kds/handoffs/enforcement-gate.json`

```json
{
  "handoffType": "plan",
  "key": "kds-enforcement-gate",
  "description": "Add Step -1 governance enforcement check to 11 prompts. Users modifying .github/* must be redirected to @workspace /kds.",
  "acceptanceCriteria": [
    "All 11 prompts contain Step -1 enforcement logic",
    "Enforcement message includes copy-paste kds command",
    "Test validates redirection works for modification requests",
    "kds.prompt.md unchanged (it's the gatekeeper)"
  ],
  "files": [
    ".github/prompts/plan.prompt.md",
    ".github/prompts/route.prompt.md",
    ".github/prompts/task.prompt.md",
    ".github/prompts/todo.prompt.md",
    ".github/prompts/test-generation.prompt.md",
    ".github/prompts/healthcheck.prompt.md",
    ".github/prompts/drift.prompt.md",
    ".github/prompts/cohesion.prompt.md",
    ".github/prompts/collapse-keys.prompt.md",
    ".github/prompts/ask.prompt.md"
  ],
  "e2eMode": true,
  "autoChain": true,
  "estimatedDuration": "60-90 minutes",
  "nextTask": "rulebook-creation.json"
}
```

### Handoff 2: Rulebook Creation
**File**: `.github/key-data-streams/kds/handoffs/rulebook-creation.json`

```json
{
  "handoffType": "plan",
  "key": "kds-rulebook",
  "description": "Create canonical KDS Governance Rulebook in dual format (user-friendly .md + machine-readable .json). Merge MANDATORY.md, Agentic Rules, and kds-handoff-protocol.md",
  "acceptanceCriteria": [
    "kds-rulebook.md created with all 9+ rules categorized",
    "kds-rulebook.json created with validation schemas",
    "No rule contradictions exist",
    "Each rule includes: statement, rationale, examples, anti-patterns",
    "MANDATORY.md deprecated (marked as superseded by rulebook)"
  ],
  "files": [
    ".github/governance/kds-rulebook.md",
    ".github/governance/kds-rulebook.json"
  ],
  "e2eMode": true,
  "autoChain": true,
  "estimatedDuration": "90-120 minutes",
  "nextTask": "system-cleanup.json"
}
```

### Handoff 3: System Cleanup
**File**: `.github/key-data-streams/kds/handoffs/system-cleanup.json`

```json
{
  "handoffType": "plan",
  "key": "kds-cleanup",
  "description": "Remove obsolete keys from .github/key-data-streams/ after validating no active references. Preserve hcp-* keys. Consolidate duplicates.",
  "acceptanceCriteria": [
    "Reference scan completed for all deletion candidates",
    "Zero-reference keys safely deleted",
    "Duplicate keys consolidated (cohesion, drift-prompt, prompt-*)",
    "hcp-* keys preserved",
    "Index files updated (index.md, CDN-KEYS-INDEX.md, active.keys.log)"
  ],
  "deletionCandidates": [
    "auto-drift-detection",
    "auto-execution-fix",
    "workspace-cleanup",
    "_ARCHIVE"
  ],
  "consolidationTargets": [
    {"merge": ["cohesion", "cohesion-cleanup-consolidation"], "into": "cohesion"},
    {"merge": ["drift-prompt", "drift-prompt-efficiency"], "into": "drift-prompt"},
    {"merge": ["prompt", "prompt-efficiency-fix", "prompt-merged", "prompt-state-integration"], "into": "prompt-system"}
  ],
  "e2eMode": true,
  "autoChain": false,
  "estimatedDuration": "45-60 minutes",
  "requiresManualValidation": true
}
```

---

## 📤 Step 7: Next Command

**Approval**: ✅ GRANTED

**Recommended Execution**: E2E Mode (auto-chain phases)

**Next Command**:

```markdown
@workspace /plan key=kds-enforcement-rulebook-cleanup #file:.github/key-data-streams/kds/handoffs/enforcement-gate.json auto-chain=true
```

**What this will do**:
1. Load enforcement-gate.json handoff
2. Generate 3-phase plan (Enforcement + Rulebook + Cleanup)
3. Create phase handoff JSONs
4. Execute all phases end-to-end (e2eMode=true)
5. Checkpoint commit after each phase

**Estimated Total Time**: 3-4.5 hours

---

## ✅ Approval Summary

**Request**: Enforcement + Rulebook + Cleanup  
**Compatibility**: ✅ PASSED (with conditions)  
**Conflicts**: None (MANDATORY.md missing resolved via Rulebook)  
**Cascading Impacts**: 11 prompts + 3 docs + cleanup  
**Risk Level**: Medium (enforcement/rulebook) + High (cleanup requires validation)  
**Approval**: ✅ GRANTED  

**Conditions**:
1. Execute reference scan before deleting keys
2. Create enforcement test before rollout
3. Validate rulebook has zero contradictions

**Key: `kds`** | **Status**: Ready for Execution | **Gatekeeper**: APPROVED ✅
