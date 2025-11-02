# Test Registry: kds

**Last Updated**: 2025-10-31  
**Status**: Self-Validating  
**Reason**: Governance system validates itself through execution

## Test Suites

No automated tests defined. KDS governance system performs self-validation during each review cycle.

### Self-Validation Checks
| Check | Type | Frequency |
|-------|------|-----------|
| Rulebook compliance scan | Governance | Every review |
| Prompt structure validation | Governance | Every review |
| Key structure verification | Governance | Every review |
| Test coverage audit | Governance | Every review |
| Documentation completeness | Governance | Every review |

## Test Execution Commands

### Run KDS Review
```
@workspace Follow instructions in kds.prompt.md
```

### Validate Rulebook
```
@workspace Validate compliance with kds-rulebook.json v1.4.0
```

## Test Coverage

- [x] Integration tests (Self-validating through reviews)
- [x] Governance tests (Built into kds.prompt.md)
- [ ] Unit tests (Not Applicable - prompt-based system)
- [ ] E2E tests (Not Applicable)
- [ ] Visual regression tests (Not Applicable)
- [ ] Accessibility tests (Not Applicable)

## Notes

KDS is a meta-governance system. Its "tests" are the validation algorithms in kds-validation-algorithms.md and the review process itself. Every execution validates the system's health.
