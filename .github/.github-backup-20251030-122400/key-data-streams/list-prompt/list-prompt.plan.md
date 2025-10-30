# list-prompt Implementation Plan v1.1

**Key**: `list-prompt`  
**Branch**: `development`  
**Created**: 2025-10-26  
**Status**: Ready for Implementation  
**Total Phases**: 5

---

## Overview

Create a specialized list prompt (`list.prompt.md`) for quick access to workspace resources with advanced filtering, search, git integration, workspace intelligence, and result caching.

## User Decisions

**Enhancement Selection**: ALL (A-F)
- A. Filter keys by search term
- B. Show commits for specific key
- C. Workspace stats
- D. Output formatting (JSON/table/compact)
- E. Recent chat context
- F. Result caching

---

## Assumptions Validated

@workspace evidence:
- ✓ Prompts directory: `.github/prompts/` (8 prompt files: plan, task, test-generation, todo, healthcheck, cohesion, drift, ask)
- ✓ Instructions: `.github/instructions/SelfAwareness.instructions.md`
- ✓ UserDictionary: `.github/prompts/shared/UserDictionary.md`
- ✓ Key-data-streams: `.github/key-data-streams/` (19 active keys detected)
- ✓ Git repository: NOOR-CANVAS (development branch)

---

## Phase 1: Core List Infrastructure

### Objectives
- Create `list.prompt.md` with parameter routing system
- Implement alphabetical sorting utilities
- Add comprehensive help text and parameter validation
- Support base parameters: default, `-k`, `-p`, `-i`, `-d`

### Implementation Details

**File**: `.github/prompts/list.prompt.md`

**Core Functions**:
1. **Parameter Router**
   - Parse command-line style parameters
   - Validate parameter format
   - Route to appropriate handler function
   - Return formatted results

2. **Alphabetical Sorting**
   - Case-insensitive comparison
   - Natural sort for numbers (e.g., "key-1" before "key-10")
   - Preserve directory structure for nested items

3. **Help Text System**
   ```markdown
   # list.prompt.md Usage
   
   Default: Show all available parameters
   -k: List all keys (alphabetically)
   -k {search}: Filter keys by search term
   -p: List all prompts (alphabetically)
   -p {search}: Filter prompts by name
   -i: List all instructions (alphabetically)
   -d: List UserDictionary entries (alphabetically)
   -d {search}: Search dictionary entries
   -g {n}: Show last N git commits summary
   -g {n} --key={key}: Show commits for specific key
   -w: Show workspace stats
   -c: Show recent chat context
   
   Output Formats:
   --json: JSON output
   --table: Table format
   --compact: Compact single-line format
   ```

4. **Parameter Validation**
   - Check for valid parameter names
   - Validate parameter values (e.g., {n} is numeric)
   - Provide helpful error messages
   - Suggest corrections for typos

### Pseudocode

```
FUNCTION ListPrompt(rawInput)
  
  // Parse parameters
  params = ParseCommandLine(rawInput)
  
  IF params.isEmpty OR params.help THEN
    RETURN ShowHelp()
  END IF
  
  // Validate parameters
  validationErrors = ValidateParameters(params)
  IF validationErrors.notEmpty THEN
    RETURN ShowErrors(validationErrors) + SuggestCorrections()
  END IF
  
  // Route to handler
  result = RouteToHandler(params)
  
  // Apply formatting
  formattedResult = ApplyOutputFormat(result, params.format)
  
  RETURN formattedResult
  
END FUNCTION

FUNCTION ListKeys(searchTerm = null)
  
  keys = ReadDirectory(".github/key-data-streams/")
  
  // Filter hidden/special directories
  keys = FilterOut(keys, ["_ARCHIVE", ".", ".."])
  
  IF searchTerm THEN
    keys = FuzzyFilter(keys, searchTerm)
  END IF
  
  // Natural sort
  sortedKeys = NaturalSort(keys, caseInsensitive=true)
  
  RETURN FormatList(sortedKeys, title="Keys")
  
END FUNCTION

FUNCTION ListPrompts(searchTerm = null)
  
  prompts = FindFiles(".github/prompts/*.prompt.md")
  
  // Extract prompt names (remove .prompt.md suffix)
  promptNames = ExtractNames(prompts)
  
  IF searchTerm THEN
    promptNames = FilterByName(promptNames, searchTerm)
  END IF
  
  sortedPrompts = AlphabeticalSort(promptNames)
  
  RETURN FormatList(sortedPrompts, title="Prompts")
  
END FUNCTION

FUNCTION ListInstructions()
  
  instructions = FindFiles(".github/instructions/*.instructions.md")
  instructionNames = ExtractNames(instructions)
  sortedInstructions = AlphabeticalSort(instructionNames)
  
  RETURN FormatList(sortedInstructions, title="Instructions")
  
END FUNCTION

FUNCTION ListDictionary(searchTerm = null)
  
  content = ReadFile(".github/prompts/shared/UserDictionary.md")
  entries = ParseMarkdownList(content)
  
  IF searchTerm THEN
    entries = SearchEntries(entries, searchTerm)
  END IF
  
  sortedEntries = AlphabeticalSort(entries, by="shortcut")
  
  RETURN FormatDictionaryEntries(sortedEntries)
  
END FUNCTION
```

### Files to Create
- `.github/prompts/list.prompt.md` (main prompt file)

### Tests
- Validate parameter parsing
- Test alphabetical sorting with edge cases
- Verify help text completeness
- Test error handling for invalid parameters

### Acceptance Criteria
- [ ] `list.prompt.md` created and functional
- [ ] Default behavior shows parameter list
- [ ] `-k`, `-p`, `-i`, `-d` parameters work correctly
- [ ] Alphabetical sorting accurate
- [ ] Help text comprehensive
- [ ] Error messages helpful

---

## Phase 2: Enhanced Search & Filtering

### Objectives
- Implement search functionality for keys and prompts
- Add fuzzy matching algorithm
- Support partial matches and wildcards
- Optimize search performance

### Implementation Details

**Search Features**:
1. **Fuzzy Matching**
   - Levenshtein distance algorithm
   - Threshold: max 2 character differences
   - Rank results by similarity score

2. **Partial Match**
   - Substring matching (case-insensitive)
   - Word boundary detection
   - Highlight matched portions in output

3. **Dictionary Search**
   - Search by shortcut name
   - Search by full reference path
   - Search by description text
   - Return matching entries with context

### Pseudocode

```
FUNCTION FuzzyFilter(items, searchTerm)
  
  matches = []
  
  FOR EACH item IN items
    similarity = LevenshteinDistance(item, searchTerm)
    
    IF similarity <= 2 THEN
      matches.APPEND({
        item: item,
        score: similarity,
        type: "fuzzy"
      })
    ELSE IF item.CONTAINS(searchTerm, caseInsensitive=true) THEN
      matches.APPEND({
        item: item,
        score: 0,
        type: "partial"
      })
    END IF
  END FOR
  
  // Sort by score (lower = better match)
  matches = SortByScore(matches, ascending=true)
  
  RETURN ExtractItems(matches)
  
END FUNCTION

FUNCTION SearchDictionary(searchTerm)
  
  content = ReadFile(".github/prompts/shared/UserDictionary.md")
  entries = ParseDictionaryEntries(content)
  
  matchedEntries = []
  
  FOR EACH entry IN entries
    // Search in shortcut
    IF entry.shortcut.CONTAINS(searchTerm, caseInsensitive=true) THEN
      matchedEntries.APPEND(entry)
      CONTINUE
    END IF
    
    // Search in reference path
    IF entry.reference.CONTAINS(searchTerm, caseInsensitive=true) THEN
      matchedEntries.APPEND(entry)
      CONTINUE
    END IF
    
    // Search in description
    IF entry.description.CONTAINS(searchTerm, caseInsensitive=true) THEN
      matchedEntries.APPEND(entry)
    END IF
  END FOR
  
  RETURN matchedEntries
  
END FUNCTION

FUNCTION LevenshteinDistance(str1, str2)
  
  m = Length(str1)
  n = Length(str2)
  
  // Create distance matrix
  matrix = CreateMatrix(m+1, n+1)
  
  // Initialize first row and column
  FOR i = 0 TO m
    matrix[i][0] = i
  END FOR
  
  FOR j = 0 TO n
    matrix[0][j] = j
  END FOR
  
  // Calculate distances
  FOR i = 1 TO m
    FOR j = 1 TO n
      IF str1[i-1] == str2[j-1] THEN
        cost = 0
      ELSE
        cost = 1
      END IF
      
      matrix[i][j] = MIN(
        matrix[i-1][j] + 1,      // deletion
        matrix[i][j-1] + 1,      // insertion
        matrix[i-1][j-1] + cost  // substitution
      )
    END FOR
  END FOR
  
  RETURN matrix[m][n]
  
END FUNCTION
```

### Files to Modify
- `.github/prompts/list.prompt.md` (add search functions)

### Tests
- Test fuzzy matching with typos
- Verify partial match accuracy
- Test dictionary search across all fields
- Performance test with 100+ items

### Acceptance Criteria
- [ ] `-k {search}` filters keys accurately
- [ ] `-p {search}` filters prompts
- [ ] `-d {search}` searches dictionary
- [ ] Fuzzy matching works with 1-2 char differences
- [ ] Results ranked by relevance
- [ ] Search performance < 100ms

---

## Phase 3: Git Integration & Key-Specific Queries

### Objectives
- Implement `-g {n}` for recent commit summaries
- Add `-g {n} --key={key}` for key-specific commits
- Parse commit message patterns
- Format output with commit metadata

### Implementation Details

**Git Commands**:
1. **Recent Commits**
   ```powershell
   git log -n {n} --format="%h|%ai|%s"
   ```

2. **Key-Specific Commits**
   ```powershell
   git log -n {n} --grep="({key})" --format="%h|%ai|%s"
   ```

3. **Commit Pattern Parsing**
   - `plan({key}):` → Plan commits
   - `task({key}):` → Task execution commits
   - `drift({key}):` → Drift management commits
   - `ckpt({key}):` → Checkpoint commits
   - Others → Generic commits

### Pseudocode

```
FUNCTION ShowGitCommits(count, key = null)
  
  IF key THEN
    command = "git log -n {count} --grep='({key})' --format='%h|%ai|%s'"
  ELSE
    command = "git log -n {count} --format='%h|%ai|%s'"
  END IF
  
  output = ExecuteCommand(command)
  commits = ParseGitOutput(output)
  
  formattedCommits = []
  
  FOR EACH commit IN commits
    parsed = ParseCommitMessage(commit)
    
    formattedCommits.APPEND({
      hash: parsed.hash,
      timestamp: parsed.timestamp,
      type: parsed.type,
      key: parsed.key,
      description: parsed.description
    })
  END FOR
  
  RETURN FormatCommitTable(formattedCommits)
  
END FUNCTION

FUNCTION ParseCommitMessage(commitLine)
  
  parts = Split(commitLine, "|")
  hash = parts[0]
  timestamp = parts[1]
  message = parts[2]
  
  // Extract commit type and key
  IF message MATCHES "plan\(([^)]+)\):" THEN
    type = "plan"
    key = ExtractMatch(message, 1)
    description = ExtractAfterColon(message)
    
  ELSE IF message MATCHES "task\(([^)]+)\):" THEN
    type = "task"
    key = ExtractMatch(message, 1)
    description = ExtractAfterColon(message)
    
  ELSE IF message MATCHES "drift\(([^)]+)\):" THEN
    type = "drift"
    key = ExtractMatch(message, 1)
    description = ExtractAfterColon(message)
    
  ELSE IF message MATCHES "ckpt\(([^)]+)\):" THEN
    type = "checkpoint"
    key = ExtractMatch(message, 1)
    description = ExtractAfterColon(message)
    
  ELSE
    type = "generic"
    key = null
    description = message
  END IF
  
  RETURN {
    hash: hash,
    timestamp: FormatTimestamp(timestamp),
    type: type,
    key: key,
    description: description
  }
  
END FUNCTION

FUNCTION FormatCommitTable(commits)
  
  table = CreateTable(columns: ["Hash", "Date", "Type", "Key", "Description"])
  
  FOR EACH commit IN commits
    table.AddRow([
      commit.hash,
      FormatDate(commit.timestamp),
      commit.type,
      commit.key OR "—",
      TruncateDescription(commit.description, maxLength: 60)
    ])
  END FOR
  
  RETURN table.ToString()
  
END FUNCTION
```

### Files to Modify
- `.github/prompts/list.prompt.md` (add git integration)

### Tests
- Test git log command execution
- Verify commit message parsing for all types
- Test key filtering accuracy
- Validate timestamp formatting
- Edge case: repository with no commits

### Acceptance Criteria
- [ ] `-g {n}` shows last N commits
- [ ] `-g {n} --key={key}` filters by key
- [ ] Commit types classified correctly
- [ ] Table format readable and aligned
- [ ] Timestamps formatted consistently
- [ ] Handles empty results gracefully

---

## Phase 4: Workspace Intelligence & Output Formats

### Objectives
- Implement `-w` workspace statistics
- Add `-c` recent chat context
- Support `--json`, `--table`, `--compact` output formats
- Implement result caching with TTL

### Implementation Details

**Workspace Stats**:
1. **File Counts**
   - Total files in workspace
   - C# files (*.cs, *.csproj)
   - Razor files (*.razor)
   - JavaScript/TypeScript (*.js, *.ts)
   - Test files (*.spec.ts)

2. **Lines of Code**
   - Count LOC for each file type
   - Exclude comments and blank lines
   - Aggregate by category

3. **Key Statistics**
   - Active keys (in `.github/key-data-streams/`)
   - Archived keys
   - Average key age (from git history)

4. **Prompt & Instruction Stats**
   - Total prompts
   - Total instructions
   - Last modified dates

**Caching System**:
1. **Cache Storage**
   - File-based cache: `.github/.cache/list-cache.json`
   - Structure: `{ cacheKey: { data, timestamp, ttl } }`

2. **Cache Key Generation**
   - Hash of: parameter + options + file timestamps
   - Example: `keys-search-zoom-20251026T103045`

3. **TTL Management**
   - Default TTL: 300 seconds (5 minutes)
   - Check timestamp on each access
   - Auto-cleanup expired entries

### Pseudocode

```
FUNCTION ShowWorkspaceStats()
  
  stats = {
    files: {
      total: CountFiles("**/*"),
      csharp: CountFiles("**/*.cs"),
      razor: CountFiles("**/*.razor"),
      javascript: CountFiles("**/*.js"),
      typescript: CountFiles("**/*.ts"),
      tests: CountFiles("**/*.spec.ts")
    },
    linesOfCode: {
      total: CountLOC("**/*.{cs,razor,js,ts}"),
      csharp: CountLOC("**/*.cs"),
      razor: CountLOC("**/*.razor"),
      frontend: CountLOC("**/*.{js,ts}")
    },
    keys: {
      active: CountDirs(".github/key-data-streams/", exclude="_ARCHIVE"),
      archived: CountDirs(".github/key-data-streams/_ARCHIVE/"),
      avgAge: CalculateAverageKeyAge()
    },
    prompts: {
      total: CountFiles(".github/prompts/*.prompt.md"),
      lastModified: GetLastModified(".github/prompts/")
    },
    instructions: {
      total: CountFiles(".github/instructions/*.instructions.md"),
      lastModified: GetLastModified(".github/instructions/")
    }
  }
  
  RETURN FormatStatsTable(stats)
  
END FUNCTION

FUNCTION ApplyOutputFormat(data, format)
  
  MATCH format
    CASE "json":
      RETURN ToJSON(data, prettyPrint=true)
      
    CASE "table":
      RETURN ToMarkdownTable(data)
      
    CASE "compact":
      RETURN ToCompactList(data)
      
    DEFAULT:
      RETURN ToDefaultFormat(data)
  END MATCH
  
END FUNCTION

// Caching Implementation

FUNCTION GetCachedResult(cacheKey)
  
  cacheFilePath = ".github/.cache/list-cache.json"
  
  IF NOT FileExists(cacheFilePath) THEN
    RETURN null
  END IF
  
  cache = ReadJSONFile(cacheFilePath)
  
  IF NOT cache.ContainsKey(cacheKey) THEN
    RETURN null
  END IF
  
  entry = cache[cacheKey]
  currentTime = GetCurrentTimestamp()
  
  // Check if expired
  IF (currentTime - entry.timestamp) > entry.ttl THEN
    DeleteCacheEntry(cacheKey)
    RETURN null
  END IF
  
  RETURN entry.data
  
END FUNCTION

FUNCTION SetCachedResult(cacheKey, data, ttl = 300)
  
  cacheFilePath = ".github/.cache/list-cache.json"
  
  // Load existing cache
  IF FileExists(cacheFilePath) THEN
    cache = ReadJSONFile(cacheFilePath)
  ELSE
    cache = {}
    CreateDirectory(".github/.cache/")
  END IF
  
  // Add new entry
  cache[cacheKey] = {
    data: data,
    timestamp: GetCurrentTimestamp(),
    ttl: ttl
  }
  
  // Cleanup expired entries
  CleanupExpiredEntries(cache)
  
  // Write back to file
  WriteJSONFile(cacheFilePath, cache)
  
END FUNCTION

FUNCTION GenerateCacheKey(parameter, options)
  
  keyParts = [
    parameter,
    JSON.Stringify(options),
    GetFileTimestamp(".github/key-data-streams/"),
    GetFileTimestamp(".github/prompts/")
  ]
  
  combinedString = Join(keyParts, "-")
  hash = SHA256(combinedString).Substring(0, 16)
  
  RETURN "{parameter}-{hash}"
  
END FUNCTION
```

### Files to Modify
- `.github/prompts/list.prompt.md` (add stats, caching, formats)

### Files to Create
- `.github/.cache/.gitignore` (ignore cache files from git)

### Tests
- Test workspace stats calculation accuracy
- Verify cache hit/miss behavior
- Test cache expiration after TTL
- Validate JSON output schema
- Test table formatting alignment
- Verify compact format readability

### Acceptance Criteria
- [ ] `-w` shows accurate workspace stats
- [ ] `-c` shows recent context (if available)
- [ ] `--json` outputs valid JSON
- [ ] `--table` produces aligned tables
- [ ] `--compact` shows single-line format
- [ ] Cache reduces execution time by 80%+
- [ ] Cache expires correctly after TTL
- [ ] Cache auto-cleans expired entries

---

## Phase 5: Testing & Documentation

### Objectives
- Create comprehensive test suite
- Validate all parameter combinations
- Test edge cases and error scenarios
- Document usage examples in prompt file

### Implementation Details

**Test Scenarios**:
1. **Parameter Parsing**
   - Single parameter
   - Multiple parameters
   - Invalid parameters
   - Missing required values
   - Conflicting parameters

2. **Sorting & Filtering**
   - Empty result sets
   - Single item
   - Large datasets (100+ items)
   - Special characters in names
   - Unicode characters

3. **Git Integration**
   - Repository with no commits
   - Repository with commits but no matching key
   - Malformed commit messages
   - Very large commit history (1000+ commits)

4. **Caching**
   - Cache miss (first access)
   - Cache hit (second access)
   - Cache expiration
   - Cache corruption recovery
   - Concurrent access

5. **Output Formats**
   - JSON validation with schema
   - Table alignment with varied content lengths
   - Compact format with long descriptions
   - Unicode characters in output

### Test Files to Create
- `.github/key-data-streams/list-prompt/tests/test-parameter-parsing.md`
- `.github/key-data-streams/list-prompt/tests/test-sorting.md`
- `.github/key-data-streams/list-prompt/tests/test-git-integration.md`
- `.github/key-data-streams/list-prompt/tests/test-caching.md`
- `.github/key-data-streams/list-prompt/tests/test-output-formats.md`

### Documentation to Add

**In list.prompt.md**:
```markdown
## Examples

### List all keys alphabetically
```
@workspace /list -k
```

### Search for keys containing "zoom"
```
@workspace /list -k zoom
```

### Show last 10 git commits
```
@workspace /list -g 10
```

### Show commits for specific key
```
@workspace /list -g 20 --key=transcript-canvas
```

### Get workspace stats in JSON format
```
@workspace /list -w --json
```

### Search UserDictionary for "host"
```
@workspace /list -d host
```

## Performance Notes

- First access: ~200ms (no cache)
- Cached access: ~10ms (95% faster)
- Cache TTL: 5 minutes
- Max cache size: 50 entries
```

### Pseudocode (Test Execution)

```
FUNCTION RunAllTests()
  
  testSuites = [
    TestParameterParsing(),
    TestSorting(),
    TestGitIntegration(),
    TestCaching(),
    TestOutputFormats()
  ]
  
  results = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  }
  
  FOR EACH suite IN testSuites
    suiteResults = ExecuteTestSuite(suite)
    results.total += suiteResults.total
    results.passed += suiteResults.passed
    results.failed += suiteResults.failed
    results.skipped += suiteResults.skipped
  END FOR
  
  GenerateTestReport(results)
  
  IF results.failed > 0 THEN
    RETURN FAILURE
  ELSE
    RETURN SUCCESS
  END IF
  
END FUNCTION
```

### Acceptance Criteria
- [ ] All test scenarios documented
- [ ] Test coverage > 90%
- [ ] All edge cases handled
- [ ] Examples added to prompt file
- [ ] Performance benchmarks documented
- [ ] Error messages user-friendly
- [ ] All tests passing

---

## Test Registry

See: `.github/key-data-streams/list-prompt/tests/test-registry.md`

---

## Effort Estimate

- **Phase 1**: 45 minutes (core infrastructure)
- **Phase 2**: 30 minutes (search/filter)
- **Phase 3**: 60 minutes (git integration)
- **Phase 4**: 45 minutes (stats/caching/formats)
- **Phase 5**: 30 minutes (testing/docs)
- **Total**: ~3.5 hours

---

## Risk Mitigation

1. **Git Command Failures**
   - Wrap git commands in try-catch
   - Provide fallback behavior
   - Show helpful error messages

2. **Cache Corruption**
   - Validate cache JSON schema on read
   - Rebuild cache if corrupted
   - Log corruption events

3. **Performance Issues**
   - Limit max items displayed (default 100)
   - Add pagination for large results
   - Optimize file I/O operations

4. **Unicode Handling**
   - Ensure UTF-8 encoding
   - Test with non-ASCII characters
   - Validate table alignment

---

## Success Criteria

- [ ] All parameters functional
- [ ] Alphabetical sorting accurate
- [ ] Search/filter working correctly
- [ ] Git integration parsing commits
- [ ] Workspace stats accurate
- [ ] Caching improves performance
- [ ] Output formats valid
- [ ] All tests passing
- [ ] Documentation complete
- [ ] User-friendly error messages

---

## Rollback Plan

If issues discovered:
1. Disable caching (remove cache file)
2. Disable problematic parameter
3. Revert to previous version
4. Create drift for fix

---

## Post-Implementation

After completion:
- Add to `.github/prompts/README.md`
- Update user documentation
- Create quick reference card
- Consider auto-completion support
