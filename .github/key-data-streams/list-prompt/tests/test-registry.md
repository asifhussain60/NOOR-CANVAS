# Test Registry: list-prompt

Last Updated: 2025-10-26

## Test Suites

### Phase 1: Core List Infrastructure
| Test File | Scenario | Type | Status | Last Run | Pass/Fail |
|-----------|----------|------|--------|----------|-----------|
| test-parameter-parsing.md | Parameter validation | Unit | ⏳ Pending | - | - |
| test-alphabetical-sort.md | Sorting accuracy | Unit | ⏳ Pending | - | - |
| test-help-text.md | Help display | E2E | ⏳ Pending | - | - |

### Phase 2: Enhanced Search & Filtering
| Test File | Scenario | Type | Status | Last Run | Pass/Fail |
|-----------|----------|------|--------|----------|-----------|
| test-fuzzy-matching.md | Levenshtein distance | Unit | ⏳ Pending | - | - |
| test-key-search.md | Key filtering | E2E | ⏳ Pending | - | - |
| test-dictionary-search.md | Dictionary search | E2E | ⏳ Pending | - | - |

### Phase 3: Git Integration & Key-Specific Queries
| Test File | Scenario | Type | Status | Last Run | Pass/Fail |
|-----------|----------|------|--------|----------|-----------|
| test-git-commits.md | Commit listing | E2E | ⏳ Pending | - | - |
| test-commit-parsing.md | Message pattern extraction | Unit | ⏳ Pending | - | - |
| test-key-filtering.md | Key-specific commits | E2E | ⏳ Pending | - | - |

### Phase 4: Workspace Intelligence & Output Formats
| Test File | Scenario | Type | Status | Last Run | Pass/Fail |
|-----------|----------|------|--------|----------|-----------|
| test-workspace-stats.md | Stats calculation | Unit | ⏳ Pending | - | - |
| test-caching.md | Cache behavior | Unit | ⏳ Pending | - | - |
| test-output-json.md | JSON format validation | E2E | ⏳ Pending | - | - |
| test-output-table.md | Table format | E2E | ⏳ Pending | - | - |
| test-output-compact.md | Compact format | E2E | ⏳ Pending | - | - |

### Phase 5: Testing & Documentation
| Test File | Scenario | Type | Status | Last Run | Pass/Fail |
|-----------|----------|------|--------|----------|-----------|
| test-edge-cases.md | Edge case handling | E2E | ⏳ Pending | - | - |
| test-error-messages.md | Error messaging | E2E | ⏳ Pending | - | - |
| test-performance.md | Performance benchmarks | Load | ⏳ Pending | - | - |

## Test Execution Commands

### Run All Tests
```powershell
.\.github\key-data-streams\list-prompt\tests\run-all-tests.ps1
```

### Run Phase-Specific Tests
```powershell
# Phase 1
.\.github\key-data-streams\list-prompt\tests\run-phase-1-tests.ps1

# Phase 2
.\.github\key-data-streams\list-prompt\tests\run-phase-2-tests.ps1

# Phase 3
.\.github\key-data-streams\list-prompt\tests\run-phase-3-tests.ps1

# Phase 4
.\.github\key-data-streams\list-prompt\tests\run-phase-4-tests.ps1

# Phase 5
.\.github\key-data-streams\list-prompt\tests\run-phase-5-tests.ps1
```

### Run Individual Test
```powershell
# Example: Test parameter parsing
.\.github\key-data-streams\list-prompt\tests\test-parameter-parsing.ps1
```

## Test Coverage

- [ ] Unit tests (parameter parsing, sorting, caching)
- [ ] Integration tests (git commands, file I/O)
- [ ] E2E tests (full command execution)
- [ ] Performance tests (caching, large datasets)
- [ ] Edge case tests (empty results, malformed input)

## Coverage Goals

- **Unit Tests**: 95%+
- **Integration Tests**: 90%+
- **E2E Tests**: 85%+
- **Overall**: 90%+

## Test Environment

- **Repository**: NOOR-CANVAS
- **Branch**: development
- **PowerShell Version**: 7.x
- **Git Version**: 2.x+

## Notes

- Tests will be created during Phase 5 implementation
- Each test file contains test cases and expected results
- Performance tests measure cache effectiveness
- All tests must pass before plan completion
