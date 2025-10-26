# Test Registry: nclist-cli-utility

Last Updated: 2025-10-26

## Test Suites

### Phase 1: Core CLI Framework
| Test File | Scenario | Type | Status | Last Run | Pass/Fail |
|-----------|----------|------|--------|----------|-----------|
| ConfigurationTests.cs | Load valid config | Unit | ⏳ Pending | - | - |
| ConfigurationTests.cs | Invalid config handling | Unit | ⏳ Pending | - | - |
| DependencyInjectionTests.cs | Service resolution | Unit | ⏳ Pending | - | - |
| ColorConsoleTests.cs | ANSI color output | Unit | ⏳ Pending | - | - |

### Phase 2: List Operations
| Test File | Scenario | Type | Status | Last Run | Pass/Fail |
|-----------|----------|------|--------|----------|-----------|
| NaturalSortComparerTests.cs | Mixed alphanumeric sorting | Unit | ⏳ Pending | - | - |
| NaturalSortComparerTests.cs | Edge cases | Unit | ⏳ Pending | - | - |
| ListingServiceTests.cs | List keys | Unit | ⏳ Pending | - | - |
| ListingServiceTests.cs | List prompts | Unit | ⏳ Pending | - | - |
| ListingServiceTests.cs | List instructions | Unit | ⏳ Pending | - | - |
| ListingServiceTests.cs | List dictionary | Unit | ⏳ Pending | - | - |
| ListKeysCommandTests.cs | E2E key listing | Integration | ⏳ Pending | - | - |

### Phase 3: Filtering & Search
| Test File | Scenario | Type | Status | Last Run | Pass/Fail |
|-----------|----------|------|--------|----------|-----------|
| GlobMatcherTests.cs | Single pattern matching | Unit | ⏳ Pending | - | - |
| GlobMatcherTests.cs | Chained pattern matching | Unit | ⏳ Pending | - | - |
| LevenshteinDistanceTests.cs | Distance calculation | Unit | ⏳ Pending | - | - |
| FilteringServiceTests.cs | Fuzzy match prioritization | Unit | ⏳ Pending | - | - |
| FilteringServiceTests.cs | Combined glob + fuzzy | Unit | ⏳ Pending | - | - |
| FilteringIntegrationTests.cs | E2E filtering | Integration | ⏳ Pending | - | - |

### Phase 4: Git Integration
| Test File | Scenario | Type | Status | Last Run | Pass/Fail |
|-----------|----------|------|--------|----------|-----------|
| GitServiceTests.cs | Commit retrieval | Unit | ⏳ Pending | - | - |
| GitServiceTests.cs | Commit message parsing | Unit | ⏳ Pending | - | - |
| GitServiceTests.cs | Key extraction | Unit | ⏳ Pending | - | - |
| GitCommitsCommandTests.cs | E2E git integration | Integration | ⏳ Pending | - | - |
| WorkspaceStatsTests.cs | Statistics calculation | Integration | ⏳ Pending | - | - |

### Phase 5: Output Formatters
| Test File | Scenario | Type | Status | Last Run | Pass/Fail |
|-----------|----------|------|--------|----------|-----------|
| DefaultFormatterTests.cs | Default output | Unit | ⏳ Pending | - | - |
| JsonFormatterTests.cs | JSON serialization | Unit | ⏳ Pending | - | - |
| TableFormatterTests.cs | Markdown table generation | Unit | ⏳ Pending | - | - |
| CompactFormatterTests.cs | Compact line wrapping | Unit | ⏳ Pending | - | - |
| FormatterIntegrationTests.cs | All formatters E2E | Integration | ⏳ Pending | - | - |

### Phase 6: Caching System
| Test File | Scenario | Type | Status | Last Run | Pass/Fail |
|-----------|----------|------|--------|----------|-----------|
| CacheServiceTests.cs | Cache CRUD operations | Unit | ⏳ Pending | - | - |
| CacheServiceTests.cs | TTL expiration | Unit | ⏳ Pending | - | - |
| CacheServiceTests.cs | Cache key generation | Unit | ⏳ Pending | - | - |
| CacheIntegrationTests.cs | Cache hit/miss flow | Integration | ⏳ Pending | - | - |
| CacheIntegrationTests.cs | --fresh bypass | Integration | ⏳ Pending | - | - |

### Phase 7: Testing & Documentation
| Test File | Scenario | Type | Status | Last Run | Pass/Fail |
|-----------|----------|------|--------|----------|-----------|
| CacheBenchmarks.cs | Cache performance | Benchmark | ⏳ Pending | - | - |
| EndToEndTests.cs | Full workflow | Integration | ⏳ Pending | - | - |
| PublishTests.cs | Single-file exe creation | Integration | ⏳ Pending | - | - |

## Test Execution Commands

### Run All Tests
```powershell
cd Tools\NCList
dotnet test NCList.Tests
```

### Run Phase-Specific Tests
```powershell
# Phase 1
dotnet test NCList.Tests --filter "FullyQualifiedName~ConfigurationTests|DependencyInjectionTests|ColorConsoleTests"

# Phase 2
dotnet test NCList.Tests --filter "FullyQualifiedName~NaturalSortComparerTests|ListingServiceTests|ListKeysCommandTests"

# Phase 3
dotnet test NCList.Tests --filter "FullyQualifiedName~GlobMatcherTests|LevenshteinDistanceTests|FilteringServiceTests"

# Phase 4
dotnet test NCList.Tests --filter "FullyQualifiedName~GitServiceTests|GitCommitsCommandTests|WorkspaceStatsTests"

# Phase 5
dotnet test NCList.Tests --filter "FullyQualifiedName~FormatterTests"

# Phase 6
dotnet test NCList.Tests --filter "FullyQualifiedName~CacheServiceTests|CacheIntegrationTests"

# Phase 7
dotnet test NCList.Tests --filter "FullyQualifiedName~EndToEndTests|PublishTests"
```

### Run Benchmarks
```powershell
cd Tools\NCList\NCList.Tests
dotnet run -c Release --project Benchmarks
```

### Run Individual Test
```powershell
dotnet test NCList.Tests --filter "FullyQualifiedName~NaturalSortComparerTests.SortNaturally_MixedAlphanumeric_SortsCorrectly"
```

## Test Coverage

- [ ] Unit tests (>80% coverage target)
- [ ] Integration tests
- [ ] E2E tests
- [ ] Performance benchmarks
- [ ] Publish/deployment tests

## Test Results Summary

### Overall Statistics
- **Total Tests**: 0 (will update as tests are created)
- **Passed**: 0
- **Failed**: 0
- **Skipped**: 0
- **Coverage**: 0%

### Performance Benchmarks
_Benchmarks will be recorded here after Phase 7_

**Expected Results:**
- Cache Miss: ~50-100ms
- Cache Hit: ~1-5ms
- Speedup: 10-20x

## Test Data

### Sample Test Workspace
Located at: `Tools/NCList/NCList.Tests/TestData/`

Contains:
- Sample keys directory structure
- Sample prompt files
- Sample instruction files
- Sample dictionary entries
- Mock git repository

## Continuous Integration

### Build & Test Pipeline
```yaml
# .github/workflows/nclist-tests.yml (future enhancement)
name: NCList Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-dotnet@v3
        with:
          dotnet-version: '8.0.x'
      - run: dotnet test Tools/NCList/NCList.Tests --logger trx
      - run: dotnet run --project Tools/NCList/NCList.Tests/Benchmarks -c Release
```

## Notes

- Tests are written incrementally during each phase
- Benchmark results establish performance baselines
- Integration tests require actual workspace structure
- Manual testing required for colorized output (visual verification)
