# Clean Exit Guarantee

## Standard for All Agents

At the end of every agent execution, the system MUST meet these conditions:

### Build Quality
- Solution must build with **zero errors and zero warnings**
- All compilation issues resolved
- No degradation in build health

### Code Quality  
- All analyzers pass (Roslynator, StyleCop, etc.)
- All linters pass (ESLint, TSLint, etc.)
- All configured code quality tools report clean status

### Test Coverage
- All relevant automated tests must pass
- No regression in test coverage
- New functionality includes appropriate tests

### Contract Integrity
- All contracts remain intact (API, DTO, DB schema)
- No breaking changes to interfaces
- Backward compatibility preserved (unless explicitly approved)

### Code Health
- No obsolete or broken code paths
- No orphaned files or references
- No circular dependencies introduced

---

## Failure Protocol

If any condition fails:
- Task/workflow MUST be marked **Incomplete**
- Specific failures MUST be reported with:
  - Exact error messages
  - Affected files/components
  - Recommended remediation steps
- Agent MUST NOT report success until all conditions met

---

## Rollback Safety

All agents maintain rollback capability via:
- Mandatory checkpoint commits before execution
- Git history preservation
- Key data stream audit trail
- Ability to restore previous working state

---

## Usage

Reference this guarantee in agent prompts:

```markdown
**See:** `.github/prompts/shared/clean-exit-guarantee.md` for complete exit criteria
```

---

## Scope

Applies to all agents:
- task
- refactor
- sync
- migrate
- healthcheck
- And any future agents
