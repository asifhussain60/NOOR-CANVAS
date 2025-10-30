# Complexity Assessor Algorithm

**Purpose:** Determine work complexity to guide agent behavior

**Used by:** route.prompt.md (Step 3)

---

## Algorithm

**Input:** context_package, work_type

**Output:** { score: number, level: string }

---

## Scoring Factors

**Multi-Layer Changes (+3 each):**
- UI layer (Razor, CSS, JS)
- API layer (Controllers, Services)
- Service layer (Business logic)
- Database layer (Migrations, queries)
- SignalR layer (Hubs, clients)

**Architectural Changes (+5):**
- New design patterns
- System-wide refactor
- Breaking changes
- Infrastructure updates

**File Count (+2 if >3 files):**
- Count files mentioned
- Count components affected
- Count test files needed

**Feature Type:**
- New feature: +3
- Bug fix: +1
- Refactor: +2
- Investigation: +2

**Testing Requirements (+2):**
- E2E tests needed
- Visual regression tests
- Unit tests
- Integration tests

**Dependencies (+1 each):**
- External libraries
- NuGet packages
- NPM packages
- API integrations

---

## Complexity Levels

**Simple (score ≤ 4):**
- Single file change
- CSS/styling fix
- Text updates
- Simple bug fix
- No architectural impact

**Moderate (score 5-10):**
- 2-3 files affected
- Single layer change
- Standard feature
- Minor refactor
- Basic testing needed

**Complex (score > 10):**
- Multi-layer changes
- Architectural impact
- Many files (>3)
- Extensive testing
- Migration required

---

## Examples

**Request:** "Fix button alignment in header"
- UI layer: +3
- Bug fix: +1
- Single file: +0
- **Score: 4 (Simple)**

**Request:** "Add share button to SessionCanvas with SignalR broadcast"
- UI layer: +3
- SignalR layer: +3
- New feature: +3
- Testing: +2
- **Score: 11 (Complex)**

**Request:** "Refactor authentication system"
- API layer: +3
- Service layer: +3
- Architectural: +5
- Refactor: +2
- Multiple files: +2
- **Score: 15 (Complex)**

---

## Impact on Routing

**Simple work:**
- Route to `task` (direct execution)
- Minimal planning needed
- Single phase

**Moderate work:**
- Route to `plan` (strategic approach)
- 2-3 phases
- Standard testing

**Complex work:**
- Route to `plan` (mandatory)
- Multi-phase execution
- Comprehensive testing
- Rollback strategy required

---

## See Also

- `../route.prompt.md` - Step 3 implementation
- `work-classifier.md` - Work type classification
