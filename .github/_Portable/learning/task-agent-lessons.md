# Task Agent - Lessons Learned

## Purpose

Document critical lessons from task agent failures to prevent recurrence and improve architectural patterns.

---

## Lesson 1: Question Deletion Bug (October 13, 2025)

### Issue Summary
**Problem:** User reported "Delete is not working, check logs" for question deletion feature.

### Root Cause
UI-only deletion without complete data lifecycle implementation:
- Delete button click removed question from UI state
- No API call to backend
- No database persistence
- No SignalR broadcast to other clients
- Questions reappeared after page refresh
- Other users never saw deletions

### What Went Wrong

**Time Wasted:** 8+ hours fixing *symptoms* instead of root cause

**Symptom Fixes (Ineffective):**
1. UI styling adjustments (delete button appearance)
2. Upvote display logic fixes
3. SignalR case sensitivity investigations
4. Log analysis without understanding complete flow

**Late Discovery:**
- Root cause (UI-only deletion) discovered after extensive troubleshooting
- No early validation of complete data lifecycle
- No persistence testing (page refresh would have revealed issue immediately)

### Impact on task.prompt.md

To prevent recurrence, the following changes were made:

#### 1. Added Step 2.8.7 - Data Lifecycle Validation
**Location:** Step 2.8 (Architecture Analysis)

**Purpose:** Mandatory CRUD validation before implementation

**Validates Complete Lifecycle:**
- **Component 1:** UI Action (button click, form submit)
- **Component 2:** API Call (HTTP POST/PUT/DELETE)
- **Component 3:** Database Persistence (EF SaveChanges, SQL execution)
- **Component 4:** SignalR Broadcast (notify all clients)
- **Component 5:** UI Update (all browsers receive update)

**Result:**
- COMPLETE: Proceed with confidence
- INCOMPLETE: RED FLAG → Early warning in Step 4 approval

#### 2. Enhanced Step 4 - Approval with Early Warning
**Location:** Step 4 (Approval)

**Addition:** Incomplete data lifecycle warning shown BEFORE execution

**Example Warning:**
```
⚠️ WARNING: Incomplete Data Lifecycle Detected

Current implementation missing:
- [X] Database Persistence (mutations not saved)
- [X] SignalR Broadcast (other clients won't see changes)

This will result in:
- ❌ Changes disappear after page refresh
- ❌ Multi-user desync (only one browser updated)

Recommendation:
1. Add API endpoint: POST /api/questions/{id}/delete
2. Add database mutation: DbContext.Questions.Remove()
3. Add SignalR broadcast: Clients.All.SendAsync("QuestionDeleted")

Proceed with incomplete implementation? (Not recommended)
```

#### 3. Updated Step 6.1 - Playwright Tests
**Location:** Step 6 (Validate) → 6.1 (Automatic Playwright Test Creation)

**Addition:** Mandatory persistence validation

**Test Pattern:**
```javascript
// DELETE operation test
test('Question deletion persists after page refresh', async ({ page }) => {
  // Step 1: Delete question
  await page.click('[data-testid="delete-question-123"]');
  
  // Step 2: Verify UI update (immediate)
  await expect(page.locator('[data-testid="question-123"]')).toBeHidden();
  
  // Step 3: CRITICAL - Refresh page to test persistence
  await page.reload();
  
  // Step 4: Verify question still deleted (tests database persistence)
  await expect(page.locator('[data-testid="question-123"]')).toBeHidden();
  
  // Step 5: Verify other clients receive update (tests SignalR broadcast)
  // (requires multi-browser test or SignalR message verification)
});
```

**Requirement:** ALL CRUD operation tests MUST include page refresh verification

#### 4. Strengthened Guardrails
**Location:** Guardrails section

**New Mandates:**
- **ALWAYS execute Step 2.8.7 Data Lifecycle Validation for CRUD operations** (prevents UI-only mutations)
- **ALWAYS include persistence tests in Playwright specs** (page refresh after mutation is mandatory)
- **NEVER implement UI-only mutations** - all CRUD operations MUST have complete data lifecycle

### Prevention Strategy

**Early Detection (Step 2.8.7):**
- Architecture analysis flags UI-only mutations BEFORE implementation
- Agent knows to check for complete lifecycle upfront
- No wasted time implementing incomplete solutions

**User Confirmation (Step 4):**
- Incomplete data lifecycle triggers explicit approval with warning
- User sees consequences before proceeding
- Informed decision to continue or redesign

**Test Coverage (Step 6.1):**
- Playwright specs require page refresh after mutations
- Persistence validated automatically
- Multi-user sync can be tested

**Clear Red Flags:**
- Documentation explicitly calls out UI-only mutations as architectural smell
- Guardrails prevent accidental incomplete implementations

### Success Criteria for Future CRUD Operations

✅ **Step 2.8.7** executes and reports COMPLETE data lifecycle  
✅ **Step 4** approval includes data lifecycle status  
✅ **Playwright test** includes persistence validation with page refresh  
✅ **All 5 lifecycle components** documented: UI → API → Database → Broadcast → UI

---

## Lesson 2: [Future Lessons]

### Template for New Lessons

**Issue Summary:**
- Problem description
- User-reported symptoms

**Root Cause:**
- Technical explanation
- Why it wasn't caught early

**What Went Wrong:**
- Time wasted
- Ineffective troubleshooting approaches
- Late discovery causes

**Impact on task.prompt.md:**
- Changes made to prevent recurrence
- New validation steps added
- Enhanced guardrails

**Prevention Strategy:**
- Early detection mechanisms
- User confirmation requirements
- Test coverage improvements
- Documentation updates

**Success Criteria:**
- Checklist for future similar work

---

## Usage

### Adding New Lessons

1. Document lesson immediately after resolution
2. Follow template structure
3. Link to related prompt changes
4. Include success criteria checklist
5. Update task.prompt.md references

### Referencing Lessons

**In task.prompt.md:**
```markdown
**See:** `.github/learning/task-agent-lessons.md` for historical lessons learned and prevention patterns
```

**In key data stream:**
```markdown
**Applied Lesson:** Question Deletion Bug prevention (Lesson 1)
- Validated complete data lifecycle (Step 2.8.7)
- All 5 components present: UI → API → DB → Broadcast → UI
- Playwright test includes page refresh verification
```

### Periodic Review

**Monthly:** Review lessons learned for emerging patterns  
**Quarterly:** Update prevention strategies based on new lessons  
**Annually:** Archive obsolete lessons, promote critical patterns to core guardrails

---

## Cross-Reference

**Related Files:**
- `.github/prompts/task.prompt.md` - Core task agent prompt (prevention measures)
- `.github/prompts/shared/context-gathering-phases.md` - Step 2.8.7 detailed validation
- `.github/prompts/shared/playwright-test-generation.md` - Persistence test patterns
- `.github/learning/validation-patterns.json` - Automated validation pattern library

**Related Concepts:**
- Data lifecycle validation (CRUD operations)
- UI-only mutation anti-pattern
- Persistence testing requirements
- Multi-user synchronization patterns
