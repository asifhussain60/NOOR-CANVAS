# Plan Modifier Algorithm

**Purpose:** Modify existing plans based on user feedback or new requirements

**Used by:** plan.prompt.md (User option B - Modify Plan)

---

## Algorithm

**Input:** existing_plan, modification_request, key

**Output:** updated_plan

---

## Modification Types

**1. Add Phase**
- Insert new phase
- Renumber subsequent phases
- Update dependencies
- Adjust file list

**2. Remove Phase**
- Remove phase
- Renumber remaining phases
- Check for orphaned dependencies
- Update file list

**3. Reorder Phases**
- Validate new order
- Check dependencies still valid
- Update phase numbers
- Preserve phase content

**4. Modify Phase Content**
- Update steps within phase
- Add/remove files
- Adjust success criteria
- Maintain phase goal

**5. Adjust Scope**
- Add files to plan
- Remove files from plan
- Change affected layers
- Update complexity score

**6. Update Test Strategy**
- Add test scenarios
- Remove unnecessary tests
- Change test types
- Update Percy snapshots

---

## Validation Rules

**After modification:**
- ✓ Phase numbers sequential
- ✓ Dependencies still valid
- ✓ All files accounted for
- ✓ Success criteria complete
- ✓ Rollback points preserved
- ✓ Test coverage maintained

**Warn if:**
- Circular dependencies created
- Critical phase removed
- Test coverage reduced
- Breaking changes introduced

---

## Dependency Checking

**When reordering phases:**
- Database changes before API changes
- Services before UI components
- Models before database migrations
- Core features before enhancements

**Invalid orders:**
- UI depends on API (API must come first)
- Services depend on DB (DB must come first)
- Tests before implementation (implementation first)

---

## Modification Workflow

**1. Parse modification request**
- Identify change type
- Extract specifics
- Validate feasibility

**2. Apply modification**
- Update plan structure
- Renumber if needed
- Preserve context

**3. Validate result**
- Check dependencies
- Verify completeness
- Update metadata

**4. Present changes**
- Show diff
- Highlight impacts
- Request approval

---

## Example Modifications

**Add Phase:**
```
Request: "Add database migration phase before API changes"
Action: 
  - Insert Phase 1.5: Database Migration
  - Renumber Phase 2 → Phase 3, etc.
  - Add migration files to Phase 1.5
  - Update Phase 3 dependencies
```

**Modify Scope:**
```
Request: "Don't modify SessionCanvas, only AssetSidebar"
Action:
  - Remove SessionCanvas.razor from file list
  - Update Phase 1 to focus on AssetSidebar
  - Adjust test scenarios
  - Update complexity score
```

**Update Test Strategy:**
```
Request: "Add Percy visual regression tests"
Action:
  - Add Phase 4: Visual Testing
  - Include Percy snapshot points
  - Add .spec.ts file to file list
  - Update test strategy section
```

---

## Diff Presentation

```markdown
## 📝 Plan Changes

**Modified Sections:**
- Phase 1: Added step 3 (Add ShareButton component)
- Phase 2: Removed (merged into Phase 1)
- Files: Added ShareButton.razor (+1)
- Tests: Added Percy snapshots (3 points)

**Impact:**
- Complexity: 8 → 6 (reduced)
- Phases: 3 → 2 (simplified)
- Timeline: Faster execution

**Approve changes?** (Y/n)
```

---

## See Also

- `../plan.prompt.md` - Modification usage
- `plan-generator.md` - Original plan creation
- `validation-engine.md` - Plan validation
