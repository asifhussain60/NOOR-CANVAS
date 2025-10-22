# Task Agent Execution Flow

## Linear Step Sequence

```
┌─────────────────────────────────────────────────────────────────────┐
│ Step 0: Branch Verification (MANDATORY)                            │
│ → Verify: git branch --show-current == "development"               │
│ → Abort if on master, switch to development                        │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ Step 1: Checkpoint Commit (MANDATORY)                              │
│ → git commit -m "checkpoint: pre-task {key}"                       │
│ → Ensures rollback capability                                      │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ Step 2: Context Gathering (MANDATORY - Multi-Phase)                │
│                                                                     │
│ 2.0: Shortcut Expansion → Evaluate shared/UserDictionary.md         │
│ 2.1: Key Resolution → Infer or use provided key                    │
│ 2.2: Key Data Stream Query → Read existing work                    │
│ 2.3: Auto-Load File Mappings → Load referenced files               │
│ 2.4: Error Triage (if applicable) → Classify error type            │
│ 2.5: Framework Validation (if framework error) → See shared file   │
│ 2.6: Known Pattern Matching → Check error library                  │
│ 2.7: UI Debugging (if UI bug) → See shared protocol                │
│ 2.8: Architecture Analysis → Anti-duplication check                │
│ 2.9: QuickRef Localization → Cache infrastructure data             │
│ 2.10: View Documentation (if annotate param) → Analyze screenshots │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ Step 3: Plan                                                        │
│ → Generate execution plan based on context                         │
│ → Respect verbosity parameter (concise vs detailed)                │
│ → Detect completion keywords or doc mode                           │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ Step 4: Approval (MANDATORY)                                       │
│ → Present plan to user                                             │
│ → Early warning if incomplete data lifecycle (CRUD operations)     │
│ → Wait for explicit approval                                       │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
                    ┌─────────┴─────────┐
                    │                   │
                    ↓                   ↓
       ┌─────────────────────┐  ┌─────────────────────┐
       │ 5a: Doc Mode        │  │ 5b: Implementation  │
       │ (debug-level: doc)  │  │ (default)           │
       │                     │  │                     │
       │ → Generate docs     │  │ → Execute subtasks  │
       │ → Skip code exec    │  │ → Insert debug logs │
       │ → Skip to Step 8    │  │ → Validation gate   │
       └─────────────────────┘  └─────────────────────┘
                    │                   │
                    └─────────┬─────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ Step 6: Validate                                                    │
│ → Run ValidationFramework.md (Levels 1-5, Level 6 if structural)   │
│ → Auto-generate Playwright tests for UI changes                    │
│ → Execute tests via orchestration scripts                          │
│ → Rollback after 3 failed validation attempts                      │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ Step 7: Confirm                                                     │
│ → Provide summary (concise or detailed per verbosity param)        │
│ → Report status: In Progress | Complete | Failed                   │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ Step 8: Update Key Data Stream (MANDATORY)                         │
│ → Bloat detection & cleanup                                        │
│ → Append work log entry with git commit SHA                        │
│ → Update functionality registry                                    │
│ → Validate update occurred                                         │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
                    ┌─────────┴─────────┐
                    │                   │
                    ↓                   ↓
       ┌─────────────────────┐  ┌─────────────────────┐
       │ Continue to next    │  │ Step 9: Completion  │
       │ subtask (loop 5-8)  │  │ (if tasks = "mark   │
       │                     │  │  complete")         │
       └─────────────────────┘  │                     │
                                │ → Cross-layer docs  │
                                │ → Debug cleanup     │
                                │ → Mark complete     │
                                └─────────────────────┘
```

---

## Decision Gates

### At Step 2: Error Routing
```
IF user reports error:
  ├─→ Step 2.4: Error Triage → Classify error type
  │
  ├─→ If Framework Error (Priority 1):
  │   └─→ Step 2.5: Framework Validation → See shared/framework-validation-checklists.md
  │
  ├─→ If Known Pattern Exists (Step 2.6):
  │   ├─→ HIGH confidence → Apply known solution, skip Step 2.8
  │   └─→ LOW confidence → Proceed to Step 2.8
  │
  ├─→ If UI/Browser Bug:
  │   └─→ Step 2.7: UI Debugging → See shared/ui-debugging-protocol.md
  │
  └─→ Else:
      └─→ Step 2.8: Architecture Analysis → Full anti-duplication check
```

### At Step 5: Execution Mode
```
IF debug-level == "doc":
  └─→ Step 5a: Generate implementation documentation only
  └─→ Skip to Step 8 (no code execution)

ELSE:
  └─→ Step 5b: Normal implementation
  └─→ Continue to Step 6
```

### At Step 8: Completion Check
```
IF tasks contains "mark complete" OR "completed":
  └─→ Step 9: Completion Workflow → See shared/completion-workflow-template.md

ELSE:
  └─→ Check for more subtasks
  ├─→ More subtasks → Loop back to Step 5
  └─→ No more subtasks → END
```

---

## Conditional Step Execution

| Step | Always Execute? | Conditions |
|------|----------------|------------|
| 0. Branch Verification | ✅ ALWAYS | None |
| 1. Checkpoint | ✅ ALWAYS | None |
| 2.1-2.3 | ✅ ALWAYS | Context gathering |
| 2.4 | ❓ CONDITIONAL | Only if user reports error |
| 2.5 | ❓ CONDITIONAL | Only if Step 2.4 classified as framework error |
| 2.6 | ❓ CONDITIONAL | Only if error library exists |
| 2.7 | ❓ CONDITIONAL | Only if UI/browser bug |
| 2.8 | ✅ USUALLY | Skip if Step 2.6 HIGH confidence match |
| 2.9 | ❓ CONDITIONAL | Only on first use of key |
| 2.10 | ❓ CONDITIONAL | Only if `annotate` param provided |
| 3. Plan | ✅ ALWAYS | None |
| 4. Approval | ✅ ALWAYS | None |
| 5. Execute | ✅ ALWAYS | Mode depends on debug-level |
| 6. Validate | ✅ ALWAYS | Unless debug-level=doc |
| 7. Confirm | ✅ ALWAYS | None |
| 8. Update Key | ✅ ALWAYS | None |
| 9. Completion | ❓ CONDITIONAL | Only if tasks="mark complete" |

---

## Step Dependencies

**No Backward References Allowed:**
- Steps must execute in linear order
- Step N cannot reference Step N+1
- Exception: Step 2 sub-steps have internal routing logic

**Shared File References (External):**
- Step 0 → See `SelfAwareness.instructions.md` (Branch Strategy)
- Step 2.5 → See `shared/framework-validation-checklists.md`
- Step 2.7 → See `shared/ui-debugging-protocol.md`
- Step 6 → See `shared/playwright-test-generation.md`
- Step 9 → See `shared/completion-workflow-template.md`

---

## Abort Conditions

**Immediate Abort (No Retry):**
- Step 0: On master branch (must switch to development)
- Step 2: Key locked by another agent (unless --force)
- Step 4: User denies approval

**Retry with Limit:**
- Step 6: Validation failures (max 3 attempts, then rollback)
- Step 2.7: Evidence gathering failures (max 3 attempts, then escalate)

**Escalation:**
- After 3 failed attempts → Enable diagnostic mode
- After 5 failed attempts → Request manual intervention
