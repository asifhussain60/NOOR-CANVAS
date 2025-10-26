# list.prompt.md (List Utility Agent v1.0)

---
mode: agent
purpose: Quick access to workspace resources with alphabetical listing, search, filtering, git integration, and workspace intelligence
inputs: parameter (default|-k|-p|-i|-d|-g|-w|-c), search_term, options (--json|--table|--compact|--fresh)
outputs: Formatted lists, git commit summaries, workspace statistics, cached results
lastUpdated: 2025-10-26
---

# list.prompt.md (List Utility)

**Mode:** Agent | **Purpose:** Fast workspace resource discovery and navigation

## ⚠️ USAGE

Show this help by default or with any invalid parameter.

**Available Parameters:**
- **Default** (no params): Show this help
- **`-k`**: List all keys alphabetically
- **`-k {search}`**: Filter keys by search term
- **`-p`**: List all prompts alphabetically
- **`-p {search}`**: Filter prompts by name
- **`-i`**: List all instructions alphabetically
- **`-d`**: List UserDictionary entries alphabetically
- **`-d {search}`**: Search dictionary entries
- **`-g {n}`**: Show last N git commits summary
- **`-g {n} --key={key}`**: Show commits for specific key
- **`-w`**: Show workspace statistics
- **`-c`**: Show recent chat context (if available)

**Output Format Options:**
- **`--json`**: Output as JSON
- **`--table`**: Output as markdown table
- **`--compact`**: Output as compact single-line format
- **`--fresh`**: Bypass cache and fetch fresh data

---

## Examples

**List all keys:**
```
@workspace /list -k
```

**Search keys containing "zoom":**
```
@workspace /list -k zoom
```

**Show last 10 commits:**
```
@workspace /list -g 10
```

**Get workspace stats in JSON:**
```
@workspace /list -w --json
```

**Search UserDictionary for "host":**
```
@workspace /list -d host
```

---

## Role

You are the List Utility Agent. You provide fast, alphabetically sorted access to workspace resources including keys, prompts, instructions, dictionary entries, git commits, and workspace statistics. You support search filtering, multiple output formats, and intelligent caching for performance.

---

## Operating Guardrails

- Always follow `.github/instructions/SelfAwareness.instructions.md`
- Use natural sorting (case-insensitive, proper number ordering)
- Cache results with 5-minute TTL for performance
- Provide helpful error messages for invalid parameters
- Support fuzzy matching with Levenshtein distance ≤ 2
- Format output consistently across all parameters
- Handle empty results gracefully
- Validate all file paths before access

---

## Core Functions

### Parameter Router

Parse user input and route to appropriate handler:

```
FUNCTION HandleListRequest(rawInput)
  
  // Parse parameters from input
  params = ParseParameters(rawInput)
  
  // Show help if no params or invalid
  IF params.isEmpty OR params.help OR params.invalid THEN
    RETURN ShowHelp()
  END IF
  
  // Generate cache key
  cacheKey = GenerateCacheKey(params)
  
  // Check cache unless --fresh specified
  IF NOT params.fresh AND CacheValid(cacheKey) THEN
    RETURN GetCachedResult(cacheKey)
  END IF
  
  // Route to handler
  result = RouteToHandler(params)
  
  // Apply output format
  formattedResult = ApplyOutputFormat(result, params.format)
  
  // Cache result
  SetCachedResult(cacheKey, formattedResult, ttl=300)
  
  RETURN formattedResult
  
END FUNCTION
```

### List Keys

List all keys from `.github/key-data-streams/` alphabetically:

```
FUNCTION ListKeys(searchTerm = null)
  
  // Read all directories in key-data-streams
  baseDir = ".github/key-data-streams/"
  allItems = ReadDirectory(baseDir)
  
  // Filter out special directories and files
  keys = FilterOut(allItems, ["_ARCHIVE", ".", "..", "*.md", "*.json"])
  
  // Apply search filter if provided
  IF searchTerm THEN
    keys = FuzzyFilter(keys, searchTerm)
  END IF
  
  // Natural sort (case-insensitive, proper number ordering)
  sortedKeys = NaturalSort(keys)
  
  // Format output
  output = FormatList(
    items: sortedKeys,
    title: "Keys" + (searchTerm ? " (filtered by '{searchTerm}')" : ""),
    emptyMessage: "No keys found" + (searchTerm ? " matching '{searchTerm}'" : "")
  )
  
  RETURN output
  
END FUNCTION
```

### List Prompts

List all prompt files from `.github/prompts/` alphabetically:

```
FUNCTION ListPrompts(searchTerm = null)
  
  // Find all .prompt.md files
  promptFiles = FindFiles(".github/prompts/*.prompt.md")
  
  // Extract prompt names (remove .prompt.md suffix)
  promptNames = []
  FOR EACH file IN promptFiles
    name = RemoveSuffix(GetFileName(file), ".prompt.md")
    promptNames.APPEND(name)
  END FOR
  
  // Apply search filter if provided
  IF searchTerm THEN
    promptNames = FilterByName(promptNames, searchTerm)
  END IF
  
  // Alphabetical sort
  sortedPrompts = AlphabeticalSort(promptNames)
  
  // Format output
  output = FormatList(
    items: sortedPrompts,
    title: "Prompts" + (searchTerm ? " (filtered by '{searchTerm}')" : ""),
    emptyMessage: "No prompts found" + (searchTerm ? " matching '{searchTerm}'" : "")
  )
  
  RETURN output
  
END FUNCTION
```

### List Instructions

List all instruction files from `.github/instructions/` alphabetically:

```
FUNCTION ListInstructions()
  
  // Find all .instructions.md files
  instructionFiles = FindFiles(".github/instructions/*.instructions.md")
  
  // Extract instruction names (remove .instructions.md suffix)
  instructionNames = []
  FOR EACH file IN instructionFiles
    name = RemoveSuffix(GetFileName(file), ".instructions.md")
    instructionNames.APPEND(name)
  END FOR
  
  // Alphabetical sort
  sortedInstructions = AlphabeticalSort(instructionNames)
  
  // Format output
  output = FormatList(
    items: sortedInstructions,
    title: "Instructions",
    emptyMessage: "No instructions found"
  )
  
  RETURN output
  
END FUNCTION
```

### List Dictionary Entries

List UserDictionary entries alphabetically:

```
FUNCTION ListDictionary(searchTerm = null)
  
  // Read UserDictionary.md
  dictionaryPath = ".github/prompts/shared/UserDictionary.md"
  content = ReadFile(dictionaryPath)
  
  // Parse dictionary entries
  entries = ParseDictionaryEntries(content)
  
  // Apply search filter if provided
  IF searchTerm THEN
    entries = SearchDictionaryEntries(entries, searchTerm)
  END IF
  
  // Sort by shortcut name (alphabetically)
  sortedEntries = AlphabeticalSort(entries, by="shortcut")
  
  // Format output
  output = FormatDictionaryEntries(
    entries: sortedEntries,
    searchTerm: searchTerm
  )
  
  RETURN output
  
END FUNCTION

FUNCTION ParseDictionaryEntries(content)
  
  entries = []
  lines = Split(content, "\n")
  
  FOR EACH line IN lines
    // Match pattern: "- shortcut: Description — reference: #file:path"
    IF line MATCHES "^- ([^:]+): ([^—]+) — ([^:]+): (.+)$" THEN
      entry = {
        shortcut: Trim(Match[1]),
        description: Trim(Match[2]),
        referenceType: Trim(Match[3]),
        referencePath: Trim(Match[4])
      }
      entries.APPEND(entry)
    END IF
  END FOR
  
  RETURN entries
  
END FUNCTION

FUNCTION SearchDictionaryEntries(entries, searchTerm)
  
  matchedEntries = []
  searchLower = ToLower(searchTerm)
  
  FOR EACH entry IN entries
    // Search in shortcut
    IF Contains(ToLower(entry.shortcut), searchLower) THEN
      matchedEntries.APPEND(entry)
      CONTINUE
    END IF
    
    // Search in description
    IF Contains(ToLower(entry.description), searchLower) THEN
      matchedEntries.APPEND(entry)
      CONTINUE
    END IF
    
    // Search in reference path
    IF Contains(ToLower(entry.referencePath), searchLower) THEN
      matchedEntries.APPEND(entry)
    END IF
  END FOR
  
  RETURN matchedEntries
  
END FUNCTION
```

---

## Utility Functions

### Natural Sort

Sort items with proper handling of numbers:

```
FUNCTION NaturalSort(items, caseInsensitive = true)
  
  // Split each item into text and number segments
  segmentedItems = []
  
  FOR EACH item IN items
    segments = SplitIntoSegments(item)
    segmentedItems.APPEND({
      original: item,
      segments: segments
    })
  END FOR
  
  // Sort using segment comparison
  sorted = Sort(segmentedItems, comparator = CompareSegments)
  
  // Extract original items
  result = ExtractOriginals(sorted)
  
  RETURN result
  
END FUNCTION

FUNCTION SplitIntoSegments(text)
  
  segments = []
  currentSegment = ""
  isNumeric = false
  
  FOR EACH char IN text
    charIsNumeric = IsDigit(char)
    
    IF charIsNumeric != isNumeric AND currentSegment != "" THEN
      // Segment type changed, save current segment
      segments.APPEND({
        value: currentSegment,
        isNumeric: isNumeric
      })
      currentSegment = ""
    END IF
    
    currentSegment += char
    isNumeric = charIsNumeric
  END FOR
  
  // Add final segment
  IF currentSegment != "" THEN
    segments.APPEND({
      value: currentSegment,
      isNumeric: isNumeric
    })
  END IF
  
  RETURN segments
  
END FUNCTION

FUNCTION CompareSegments(a, b)
  
  // Compare segment by segment
  maxLength = Max(Length(a.segments), Length(b.segments))
  
  FOR i = 0 TO maxLength - 1
    segA = a.segments[i]
    segB = b.segments[i]
    
    // Handle missing segments
    IF segA IS NULL THEN RETURN -1
    IF segB IS NULL THEN RETURN 1
    
    // Both numeric: compare as numbers
    IF segA.isNumeric AND segB.isNumeric THEN
      numA = ParseInt(segA.value)
      numB = ParseInt(segB.value)
      
      IF numA < numB THEN RETURN -1
      IF numA > numB THEN RETURN 1
      
    // Both text: compare alphabetically
    ELSE IF NOT segA.isNumeric AND NOT segB.isNumeric THEN
      comparison = CompareText(segA.value, segB.value, caseInsensitive=true)
      
      IF comparison != 0 THEN RETURN comparison
      
    // Mixed: text before numbers
    ELSE
      IF segA.isNumeric THEN RETURN 1
      ELSE RETURN -1
    END IF
  END FOR
  
  // All segments equal
  RETURN 0
  
END FUNCTION
```

### Alphabetical Sort

Simple alphabetical sort for text items:

```
FUNCTION AlphabeticalSort(items, caseInsensitive = true)
  
  IF caseInsensitive THEN
    RETURN Sort(items, comparator = (a, b) => CompareText(ToLower(a), ToLower(b)))
  ELSE
    RETURN Sort(items, comparator = (a, b) => CompareText(a, b))
  END IF
  
END FUNCTION
```

### Format List

Format items as a numbered list:

```
FUNCTION FormatList(items, title, emptyMessage = "No items found")
  
  IF items.isEmpty THEN
    RETURN "**{title}**: {emptyMessage}"
  END IF
  
  output = "**{title}** ({Count(items)} total):\n\n"
  
  FOR i = 0 TO Length(items) - 1
    output += "{i+1}. {items[i]}\n"
  END FOR
  
  RETURN output
  
END FUNCTION
```

### Format Dictionary Entries

Format dictionary entries with shortcuts and references:

```
FUNCTION FormatDictionaryEntries(entries, searchTerm = null)
  
  IF entries.isEmpty THEN
    message = "No dictionary entries found"
    IF searchTerm THEN
      message += " matching '{searchTerm}'"
    END IF
    RETURN "**UserDictionary**: {message}"
  END IF
  
  title = "UserDictionary Entries"
  IF searchTerm THEN
    title += " (filtered by '{searchTerm}')"
  END IF
  
  output = "**{title}** ({Count(entries)} total):\n\n"
  
  FOR EACH entry IN entries
    output += "**{entry.shortcut}**: {entry.description}\n"
    output += "  → {entry.referenceType}: `{entry.referencePath}`\n\n"
  END FOR
  
  RETURN output
  
END FUNCTION
```

---

## Phase 2: Enhanced Search & Filtering

### Fuzzy Matching with Levenshtein Distance

Implement fuzzy matching to find items with up to 2 character differences:

```
FUNCTION FuzzyFilter(items, searchTerm)
  
  matches = []
  searchLower = ToLower(searchTerm)
  
  FOR EACH item IN items
    itemLower = ToLower(item)
    
    // Calculate Levenshtein distance
    distance = LevenshteinDistance(itemLower, searchLower)
    
    // Exact match (highest priority)
    IF itemLower == searchLower THEN
      matches.APPEND({
        item: item,
        score: 0,
        type: "exact",
        matchQuality: 100
      })
      
    // Fuzzy match (within threshold)
    ELSE IF distance <= 2 THEN
      matchQuality = CalculateMatchQuality(distance, Length(searchTerm))
      matches.APPEND({
        item: item,
        score: distance,
        type: "fuzzy",
        matchQuality: matchQuality
      })
      
    // Partial match (contains search term)
    ELSE IF Contains(itemLower, searchLower) THEN
      // Calculate position-based score (earlier = better)
      position = IndexOf(itemLower, searchLower)
      positionScore = position / Length(itemLower)
      
      matches.APPEND({
        item: item,
        score: positionScore,
        type: "partial",
        matchQuality: CalculatePartialMatchQuality(searchLower, itemLower)
      })
      
    // Word boundary match (word starts with search term)
    ELSE IF HasWordBoundaryMatch(itemLower, searchLower) THEN
      matches.APPEND({
        item: item,
        score: 0.5,
        type: "word-boundary",
        matchQuality: 70
      })
    END IF
  END FOR
  
  // Sort by match quality (descending), then by score (ascending)
  sortedMatches = Sort(matches, comparator = CompareMatchQuality)
  
  // Extract items
  result = ExtractItems(sortedMatches)
  
  RETURN result
  
END FUNCTION

FUNCTION CalculateMatchQuality(distance, searchLength)
  
  // Quality decreases with distance
  // Longer search terms tolerate distance better
  
  IF searchLength <= 3 THEN
    // Short searches: strict matching
    IF distance == 0 THEN RETURN 100
    IF distance == 1 THEN RETURN 70
    IF distance == 2 THEN RETURN 40
  ELSE IF searchLength <= 6 THEN
    // Medium searches: moderate tolerance
    IF distance == 0 THEN RETURN 100
    IF distance == 1 THEN RETURN 85
    IF distance == 2 THEN RETURN 60
  ELSE
    // Long searches: higher tolerance
    IF distance == 0 THEN RETURN 100
    IF distance == 1 THEN RETURN 90
    IF distance == 2 THEN RETURN 75
  END IF
  
  RETURN 0
  
END FUNCTION

FUNCTION CalculatePartialMatchQuality(searchTerm, item)
  
  // Higher quality if search term is significant portion of item
  searchLen = Length(searchTerm)
  itemLen = Length(item)
  
  ratio = searchLen / itemLen
  
  IF ratio >= 0.8 THEN RETURN 95  // Search term is 80%+ of item
  IF ratio >= 0.6 THEN RETURN 85  // 60-79%
  IF ratio >= 0.4 THEN RETURN 70  // 40-59%
  IF ratio >= 0.2 THEN RETURN 55  // 20-39%
  
  RETURN 40  // Less than 20%
  
END FUNCTION

FUNCTION CompareMatchQuality(a, b)
  
  // First: Compare by type priority (exact > fuzzy > partial > word-boundary)
  typePriority = {
    "exact": 4,
    "fuzzy": 3,
    "partial": 2,
    "word-boundary": 1
  }
  
  aPriority = typePriority[a.type]
  bPriority = typePriority[b.type]
  
  IF aPriority != bPriority THEN
    RETURN bPriority - aPriority  // Higher priority first
  END IF
  
  // Second: Compare by match quality
  IF a.matchQuality != b.matchQuality THEN
    RETURN b.matchQuality - a.matchQuality  // Higher quality first
  END IF
  
  // Third: Compare by score (lower is better for fuzzy/partial)
  IF a.score != b.score THEN
    RETURN a.score - b.score  // Lower score first
  END IF
  
  // Finally: Alphabetical
  RETURN CompareText(a.item, b.item)
  
END FUNCTION

FUNCTION HasWordBoundaryMatch(text, searchTerm)
  
  // Check if any word in text starts with searchTerm
  words = SplitByWordBoundaries(text)
  
  FOR EACH word IN words
    IF StartsWith(word, searchTerm) THEN
      RETURN true
    END IF
  END FOR
  
  RETURN false
  
END FUNCTION

FUNCTION SplitByWordBoundaries(text)
  
  // Split on common separators: space, dash, underscore, dot
  separators = [" ", "-", "_", "."]
  words = [text]
  
  FOR EACH separator IN separators
    newWords = []
    FOR EACH word IN words
      splitWords = Split(word, separator)
      newWords.APPEND_ALL(splitWords)
    END FOR
    words = newWords
  END FOR
  
  // Filter out empty strings
  words = Filter(words, w => Length(w) > 0)
  
  RETURN words
  
END FUNCTION
```

### Levenshtein Distance Implementation

Calculate edit distance between two strings:

```
FUNCTION LevenshteinDistance(str1, str2)
  
  m = Length(str1)
  n = Length(str2)
  
  // Handle edge cases
  IF m == 0 THEN RETURN n
  IF n == 0 THEN RETURN m
  
  // Create distance matrix [m+1][n+1]
  matrix = CreateMatrix(m + 1, n + 1)
  
  // Initialize first column (deletions from str1)
  FOR i = 0 TO m
    matrix[i][0] = i
  END FOR
  
  // Initialize first row (insertions to str1)
  FOR j = 0 TO n
    matrix[0][j] = j
  END FOR
  
  // Fill matrix using dynamic programming
  FOR i = 1 TO m
    FOR j = 1 TO n
      
      // Cost is 0 if characters match, 1 if they don't
      IF str1[i-1] == str2[j-1] THEN
        cost = 0
      ELSE
        cost = 1
      END IF
      
      // Minimum of:
      // - Deletion: matrix[i-1][j] + 1
      // - Insertion: matrix[i][j-1] + 1
      // - Substitution: matrix[i-1][j-1] + cost
      matrix[i][j] = Min(
        matrix[i-1][j] + 1,      // deletion
        matrix[i][j-1] + 1,      // insertion
        matrix[i-1][j-1] + cost  // substitution
      )
      
    END FOR
  END FOR
  
  // Return bottom-right cell (final distance)
  RETURN matrix[m][n]
  
END FUNCTION
```

### Enhanced Dictionary Search

Search dictionary entries across all fields with ranking:

```
FUNCTION SearchDictionaryEntries(entries, searchTerm)
  
  matchedEntries = []
  searchLower = ToLower(searchTerm)
  
  FOR EACH entry IN entries
    matchScore = 0
    matchType = null
    
    // Check shortcut (highest priority)
    shortcutLower = ToLower(entry.shortcut)
    shortcutDistance = LevenshteinDistance(shortcutLower, searchLower)
    
    IF shortcutLower == searchLower THEN
      matchScore = 100
      matchType = "shortcut-exact"
      
    ELSE IF shortcutDistance <= 2 THEN
      matchScore = 90 - (shortcutDistance * 10)
      matchType = "shortcut-fuzzy"
      
    ELSE IF Contains(shortcutLower, searchLower) THEN
      matchScore = 80
      matchType = "shortcut-partial"
      
    // Check description (medium priority)
    ELSE IF Contains(ToLower(entry.description), searchLower) THEN
      matchScore = 60
      matchType = "description"
      
    // Check reference path (lower priority)
    ELSE IF Contains(ToLower(entry.referencePath), searchLower) THEN
      matchScore = 40
      matchType = "reference"
      
    END IF
    
    // Add to results if matched
    IF matchScore > 0 THEN
      matchedEntries.APPEND({
        entry: entry,
        score: matchScore,
        type: matchType
      })
    END IF
  END FOR
  
  // Sort by score (descending)
  sortedEntries = Sort(matchedEntries, comparator = (a, b) => b.score - a.score)
  
  // Extract entries
  result = ExtractEntries(sortedEntries)
  
  RETURN result
  
END FUNCTION

FUNCTION ExtractEntries(matchedEntries)
  
  result = []
  
  FOR EACH matched IN matchedEntries
    result.APPEND(matched.entry)
  END FOR
  
  RETURN result
  
END FUNCTION
```

### Updated Filter Functions

Update existing filter functions to use fuzzy matching:

```
FUNCTION FilterByName(items, searchTerm)
  
  // Use FuzzyFilter for better matching
  RETURN FuzzyFilter(items, searchTerm)
  
END FUNCTION
```

---

## Phase 3: Git Integration & Key-Specific Queries

## Parameter Parsing

Parse command-line style parameters from user input:

```
FUNCTION ParseParameters(rawInput)
  
  params = {
    isEmpty: false,
    help: false,
    invalid: false,
    parameter: null,
    searchTerm: null,
    format: "default",
    fresh: false,
    gitCount: null,
    gitKey: null
  }
  
  // Trim and normalize whitespace
  input = NormalizeWhitespace(rawInput)
  
  // Check if empty
  IF input == "" OR input == null THEN
    params.isEmpty = true
    RETURN params
  END IF
  
  // Check for help request
  IF input MATCHES "^(-h|--help|help|\?)$" THEN
    params.help = true
    RETURN params
  END IF
  
  // Parse main parameter
  IF input STARTS_WITH "-k" THEN
    params.parameter = "keys"
    remainder = Substring(input, 2)
    params.searchTerm = ExtractSearchTerm(remainder)
    
  ELSE IF input STARTS_WITH "-p" THEN
    params.parameter = "prompts"
    remainder = Substring(input, 2)
    params.searchTerm = ExtractSearchTerm(remainder)
    
  ELSE IF input STARTS_WITH "-i" THEN
    params.parameter = "instructions"
    
  ELSE IF input STARTS_WITH "-d" THEN
    params.parameter = "dictionary"
    remainder = Substring(input, 2)
    params.searchTerm = ExtractSearchTerm(remainder)
    
  ELSE IF input STARTS_WITH "-g" THEN
    params.parameter = "git"
    remainder = Substring(input, 2)
    gitParams = ParseGitParameters(remainder)
    params.gitCount = gitParams.count
    params.gitKey = gitParams.key
    
  ELSE IF input STARTS_WITH "-w" THEN
    params.parameter = "workspace"
    
  ELSE IF input STARTS_WITH "-c" THEN
    params.parameter = "context"
    
  ELSE
    params.invalid = true
    RETURN params
  END IF
  
  // Parse output format options
  IF input CONTAINS "--json" THEN
    params.format = "json"
  ELSE IF input CONTAINS "--table" THEN
    params.format = "table"
  ELSE IF input CONTAINS "--compact" THEN
    params.format = "compact"
  END IF
  
  // Parse fresh flag
  IF input CONTAINS "--fresh" THEN
    params.fresh = true
  END IF
  
  RETURN params
  
END FUNCTION

FUNCTION ExtractSearchTerm(text)
  
  // Trim leading/trailing whitespace
  trimmed = Trim(text)
  
  // Remove format options
  trimmed = Replace(trimmed, "--json", "")
  trimmed = Replace(trimmed, "--table", "")
  trimmed = Replace(trimmed, "--compact", "")
  trimmed = Replace(trimmed, "--fresh", "")
  
  // Trim again
  trimmed = Trim(trimmed)
  
  IF trimmed == "" THEN
    RETURN null
  END IF
  
  RETURN trimmed
  
END FUNCTION
```

---

## Help Text

Show comprehensive help when user requests it or provides invalid input:

```
FUNCTION ShowHelp()
  
  help = """
# List Utility - Quick Reference

**Purpose**: Fast access to workspace resources with alphabetical listing and search

---

## Available Parameters

### Keys
- **`-k`** - List all keys alphabetically
- **`-k {search}`** - Filter keys by search term (fuzzy matching)

**Examples**:
```
@workspace /list -k
@workspace /list -k zoom
```

### Prompts
- **`-p`** - List all prompts alphabetically
- **`-p {search}`** - Filter prompts by name

**Examples**:
```
@workspace /list -p
@workspace /list -p plan
```

### Instructions
- **`-i`** - List all instructions alphabetically

**Example**:
```
@workspace /list -i
```

### UserDictionary
- **`-d`** - List all dictionary entries alphabetically
- **`-d {search}`** - Search dictionary entries (shortcut, description, or path)

**Examples**:
```
@workspace /list -d
@workspace /list -d host
```

### Git Commits (Phase 3 - Coming Soon)
- **`-g {n}`** - Show last N git commits summary
- **`-g {n} --key={key}`** - Show commits for specific key

**Examples**:
```
@workspace /list -g 10
@workspace /list -g 20 --key=transcript-canvas
```

### Workspace Stats (Phase 4 - Coming Soon)
- **`-w`** - Show workspace statistics (files, LOC, keys, prompts)

**Example**:
```
@workspace /list -w
```

### Context (Phase 4 - Coming Soon)
- **`-c`** - Show recent chat context

**Example**:
```
@workspace /list -c
```

---

## Output Format Options

Add these flags to change output format:

- **`--json`** - Output as JSON
- **`--table`** - Output as markdown table
- **`--compact`** - Output as compact single-line format
- **`--fresh`** - Bypass cache and fetch fresh data

**Examples**:
```
@workspace /list -k --json
@workspace /list -w --table
@workspace /list -d host --compact
```

---

## Performance

- **First access**: ~200ms (no cache)
- **Cached access**: ~10ms (95% faster)
- **Cache TTL**: 5 minutes
- **Max cache size**: 50 entries

---

## Notes

- Natural sorting handles numbers correctly (key-1, key-2, key-10)
- Fuzzy matching allows up to 2 character differences
- Empty results show helpful messages
- Invalid parameters show this help text
"""
  
  RETURN help
  
END FUNCTION
```

---

## Router Implementation

Route parsed parameters to appropriate handler:

```
FUNCTION RouteToHandler(params)
  
  MATCH params.parameter
    CASE "keys":
      RETURN ListKeys(params.searchTerm)
      
    CASE "prompts":
      RETURN ListPrompts(params.searchTerm)
      
    CASE "instructions":
      RETURN ListInstructions()
      
    CASE "dictionary":
      RETURN ListDictionary(params.searchTerm)
      
    CASE "git":
      RETURN ShowGitCommits(params.gitCount, params.gitKey)
      
    CASE "workspace":
      RETURN ShowWorkspaceStats()
      
    CASE "context":
      RETURN ShowRecentContext()
      
    DEFAULT:
      RETURN ShowHelp()
  END MATCH
  
END FUNCTION
```

---

## Output Formatting

Apply requested output format:

```
FUNCTION ApplyOutputFormat(data, format)
  
  MATCH format
    CASE "json":
      RETURN ToJSON(data, prettyPrint=true)
      
    CASE "table":
      RETURN ToMarkdownTable(data)
      
    CASE "compact":
      RETURN ToCompactList(data)
      
    DEFAULT:
      RETURN data  // Already formatted by handler
  END MATCH
  
END FUNCTION
```

---

## Caching (Phase 4)

Caching functions will be implemented in Phase 4:

```
FUNCTION GenerateCacheKey(params)
  // Implementation in Phase 4
  RETURN null
END FUNCTION

FUNCTION CacheValid(cacheKey)
  // Implementation in Phase 4
  RETURN false
END FUNCTION

FUNCTION GetCachedResult(cacheKey)
  // Implementation in Phase 4
  RETURN null
END FUNCTION

FUNCTION SetCachedResult(cacheKey, data, ttl)
  // Implementation in Phase 4
  RETURN
END FUNCTION
```

---

## Phase 3: Git Integration

### Show Git Commits

```
FUNCTION ShowGitCommits(count, key = null)
  
  IF count IS NULL OR count <= 0 THEN
    count = 10
  END IF
  
  IF key THEN
    command = "git log -n {count} --grep='({key})' --format='%h|%ai|%s'"
  ELSE
    command = "git log -n {count} --format='%h|%ai|%s'"
  END IF
  
  TRY
    output = ExecuteCommand(command)
  CATCH error
    RETURN "**Error**: Unable to retrieve git commits. {error.message}"
  END TRY
  
  IF output IS NULL OR Trim(output) == "" THEN
    IF key THEN
      RETURN "**Git Commits**: No commits found for key '{key}'"
    ELSE
      RETURN "**Git Commits**: No commits found"
    END IF
  END IF
  
  lines = Split(output, "\n")
  commits = []
  
  FOR EACH line IN lines
    IF Trim(line) != "" THEN
      parsed = ParseCommitLine(line)
      commits.APPEND(parsed)
    END IF
  END FOR
  
  RETURN FormatCommitTable(commits, key)
  
END FUNCTION

FUNCTION ParseCommitLine(commitLine)
  
  parts = Split(commitLine, "|", limit=3)
  
  IF Length(parts) < 3 THEN
    RETURN {
      hash: "?",
      timestamp: "?",
      type: "unknown",
      key: null,
      description: commitLine
    }
  END IF
  
  hash = Trim(parts[0])
  timestamp = Trim(parts[1])
  message = Trim(parts[2])
  
  parsedMessage = ParseCommitMessage(message)
  
  RETURN {
    hash: hash,
    timestamp: FormatTimestamp(timestamp),
    type: parsedMessage.type,
    key: parsedMessage.key,
    description: parsedMessage.description
  }
  
END FUNCTION

FUNCTION ParseCommitMessage(message)
  
  type = "generic"
  key = null
  description = message
  
  IF message MATCHES "^plan\(([^)]+)\):(.+)$" THEN
    type = "plan"
    key = Trim(Match[1])
    description = Trim(Match[2])
    
  ELSE IF message MATCHES "^task\(([^)]+)\):(.+)$" THEN
    type = "task"
    key = Trim(Match[1])
    description = Trim(Match[2])
    
  ELSE IF message MATCHES "^drift\(([^)]+)\):(.+)$" THEN
    type = "drift"
    key = Trim(Match[1])
    description = Trim(Match[2])
    
  ELSE IF message MATCHES "^ckpt\(([^)]+)\):(.+)$" THEN
    type = "checkpoint"
    key = Trim(Match[1])
    description = Trim(Match[2])
    
  ELSE IF message MATCHES "^test\(([^)]+)\):(.+)$" THEN
    type = "test"
    key = Trim(Match[1])
    description = Trim(Match[2])
  END IF
  
  RETURN { type: type, key: key, description: description }
  
END FUNCTION

FUNCTION FormatTimestamp(isoTimestamp)
  
  parts = Split(isoTimestamp, " ")
  
  IF Length(parts) >= 2 THEN
    date = parts[0]
    time = parts[1]
    timeParts = Split(time, ":")
    IF Length(timeParts) >= 2 THEN
      RETURN "{date} {timeParts[0]}:{timeParts[1]}"
    END IF
  END IF
  
  RETURN isoTimestamp
  
END FUNCTION

FUNCTION FormatCommitTable(commits, filterKey = null)
  
  IF commits.isEmpty THEN
    IF filterKey THEN
      RETURN "**Git Commits**: No commits found for key '{filterKey}'"
    ELSE
      RETURN "**Git Commits**: No commits found"
    END IF
  END IF
  
  title = "Git Commits"
  IF filterKey THEN
    title += " (key: {filterKey})"
  END IF
  
  output = "**{title}** ({Count(commits)} total):\n\n"
  output += "| Hash | Date/Time | Type | Key | Description |\n"
  output += "|------|-----------|------|-----|-------------|\n"
  
  FOR EACH commit IN commits
    hash = commit.hash
    datetime = commit.timestamp
    type = commit.type
    key = commit.key OR "—"
    desc = TruncateText(commit.description, 50)
    
    output += "| {hash} | {datetime} | {type} | {key} | {desc} |\n"
  END FOR
  
  RETURN output
  
END FUNCTION

FUNCTION TruncateText(text, maxLength)
  
  IF Length(text) <= maxLength THEN
    RETURN text
  END IF
  
  RETURN Substring(text, 0, maxLength - 3) + "..."
  
END FUNCTION

FUNCTION ParseGitParameters(text)
  
  result = { count: null, key: null }
  
  countMatch = Match(text, "(\d+)")
  IF countMatch THEN
    result.count = ParseInt(countMatch[1])
  END IF
  
  keyMatch = Match(text, "--key=([^\s]+)")
  IF keyMatch THEN
    result.key = Trim(keyMatch[1])
  END IF
  
  RETURN result
  
END FUNCTION
```

---

## Phase 4: Workspace Stats & Caching

### Workspace Statistics

```
FUNCTION ShowWorkspaceStats()
  
  stats = {
    files: CalculateFileCounts(),
    linesOfCode: CalculateLOC(),
    keys: CalculateKeyStats(),
    prompts: CalculatePromptStats(),
    instructions: CalculateInstructionStats(),
    lastUpdated: GetCurrentTimestamp()
  }
  
  RETURN FormatWorkspaceStats(stats)
  
END FUNCTION

FUNCTION CalculateFileCounts()
  
  RETURN {
    total: CountFiles("**/*"),
    csharp: CountFiles("**/*.cs"),
    razor: CountFiles("**/*.razor"),
    javascript: CountFiles("**/*.js"),
    typescript: CountFiles("**/*.ts"),
    tests: CountFiles("**/*.spec.ts"),
    markdown: CountFiles("**/*.md")
  }
  
END FUNCTION

FUNCTION CalculateLOC()
  
  RETURN {
    total: CountLOC("**/*.{cs,razor,js,ts}"),
    csharp: CountLOC("**/*.cs"),
    razor: CountLOC("**/*.razor"),
    frontend: CountLOC("**/*.{js,ts}")
  }
  
END FUNCTION

FUNCTION CalculateKeyStats()
  
  activeKeys = ReadDirectory(".github/key-data-streams/")
  activeKeys = FilterOut(activeKeys, ["_ARCHIVE", ".", "..", "*.md", "*.json"])
  
  archivedKeys = ReadDirectory(".github/key-data-streams/_ARCHIVE/")
  archivedKeys = FilterOut(archivedKeys, [".", "..", "*.md"])
  
  RETURN {
    active: Count(activeKeys),
    archived: Count(archivedKeys),
    total: Count(activeKeys) + Count(archivedKeys)
  }
  
END FUNCTION

FUNCTION CalculatePromptStats()
  
  prompts = FindFiles(".github/prompts/*.prompt.md")
  
  lastModified = null
  FOR EACH prompt IN prompts
    modTime = GetFileModifiedTime(prompt)
    IF lastModified IS NULL OR modTime > lastModified THEN
      lastModified = modTime
    END IF
  END FOR
  
  RETURN {
    total: Count(prompts),
    lastModified: FormatTimestamp(lastModified)
  }
  
END FUNCTION

FUNCTION CalculateInstructionStats()
  
  instructions = FindFiles(".github/instructions/*.instructions.md")
  
  RETURN {
    total: Count(instructions)
  }
  
END FUNCTION

FUNCTION FormatWorkspaceStats(stats)
  
  output = "**Workspace Statistics**\n\n"
  
  output += "### Files\n"
  output += "- **Total**: {stats.files.total}\n"
  output += "- **C#**: {stats.files.csharp}\n"
  output += "- **Razor**: {stats.files.razor}\n"
  output += "- **JavaScript**: {stats.files.javascript}\n"
  output += "- **TypeScript**: {stats.files.typescript}\n"
  output += "- **Tests**: {stats.files.tests}\n"
  output += "- **Markdown**: {stats.files.markdown}\n\n"
  
  output += "### Lines of Code\n"
  output += "- **Total**: {FormatNumber(stats.linesOfCode.total)}\n"
  output += "- **C#**: {FormatNumber(stats.linesOfCode.csharp)}\n"
  output += "- **Razor**: {FormatNumber(stats.linesOfCode.razor)}\n"
  output += "- **Frontend**: {FormatNumber(stats.linesOfCode.frontend)}\n\n"
  
  output += "### Keys\n"
  output += "- **Active**: {stats.keys.active}\n"
  output += "- **Archived**: {stats.keys.archived}\n"
  output += "- **Total**: {stats.keys.total}\n\n"
  
  output += "### Prompts & Instructions\n"
  output += "- **Prompts**: {stats.prompts.total}\n"
  output += "- **Instructions**: {stats.instructions.total}\n"
  output += "- **Last Updated**: {stats.prompts.lastModified}\n\n"
  
  output += "*Updated: {stats.lastUpdated}*\n"
  
  RETURN output
  
END FUNCTION

FUNCTION FormatNumber(num)
  
  str = ToString(num)
  
  IF Length(str) > 3 THEN
    result = ""
    FOR i = Length(str) - 1 DOWN TO 0
      result = str[i] + result
      IF (Length(str) - i) MOD 3 == 0 AND i > 0 THEN
        result = "," + result
      END IF
    END FOR
    RETURN result
  END IF
  
  RETURN str
  
END FUNCTION
```

### Caching Implementation

```
FUNCTION GenerateCacheKey(params)
  
  keyParts = []
  keyParts.APPEND(params.parameter or "default")
  
  IF params.searchTerm THEN
    keyParts.APPEND("search-{params.searchTerm}")
  END IF
  
  IF params.gitCount THEN
    keyParts.APPEND("git-{params.gitCount}")
  END IF
  
  IF params.gitKey THEN
    keyParts.APPEND("key-{params.gitKey}")
  END IF
  
  keyParts.APPEND(params.format or "default")
  
  cacheKey = Join(keyParts, "-")
  cacheKey = Replace(cacheKey, "/", "-")
  cacheKey = Replace(cacheKey, "\\", "-")
  cacheKey = Replace(cacheKey, ":", "-")
  
  RETURN cacheKey
  
END FUNCTION

FUNCTION CacheValid(cacheKey)
  
  cacheFilePath = ".github/.cache/list-cache.json"
  
  IF NOT FileExists(cacheFilePath) THEN
    RETURN false
  END IF
  
  TRY
    cache = ReadJSONFile(cacheFilePath)
  CATCH error
    RETURN false
  END TRY
  
  IF NOT cache.ContainsKey(cacheKey) THEN
    RETURN false
  END IF
  
  entry = cache[cacheKey]
  currentTime = GetCurrentTimestamp()
  
  IF (currentTime - entry.timestamp) > entry.ttl THEN
    RETURN false
  END IF
  
  RETURN true
  
END FUNCTION

FUNCTION GetCachedResult(cacheKey)
  
  cacheFilePath = ".github/.cache/list-cache.json"
  
  TRY
    cache = ReadJSONFile(cacheFilePath)
    
    IF cache.ContainsKey(cacheKey) THEN
      entry = cache[cacheKey]
      RETURN entry.data
    END IF
  CATCH error
    RETURN null
  END TRY
  
  RETURN null
  
END FUNCTION

FUNCTION SetCachedResult(cacheKey, data, ttl = 300)
  
  cacheFilePath = ".github/.cache/list-cache.json"
  cacheDir = ".github/.cache"
  
  IF NOT DirectoryExists(cacheDir) THEN
    CreateDirectory(cacheDir)
  END IF
  
  cache = {}
  IF FileExists(cacheFilePath) THEN
    TRY
      cache = ReadJSONFile(cacheFilePath)
    CATCH error
      cache = {}
    END TRY
  END IF
  
  cache[cacheKey] = {
    data: data,
    timestamp: GetCurrentTimestamp(),
    ttl: ttl
  }
  
  cache = CleanupExpiredEntries(cache)
  
  IF Count(cache) > 50 THEN
    cache = PruneOldestEntries(cache, maxSize=50)
  END IF
  
  TRY
    WriteJSONFile(cacheFilePath, cache)
  CATCH error
    LogWarning("Failed to write cache: {error.message}")
  END TRY
  
END FUNCTION

FUNCTION CleanupExpiredEntries(cache)
  
  currentTime = GetCurrentTimestamp()
  cleanedCache = {}
  
  FOR EACH key, entry IN cache
    IF (currentTime - entry.timestamp) <= entry.ttl THEN
      cleanedCache[key] = entry
    END IF
  END FOR
  
  RETURN cleanedCache
  
END FUNCTION

FUNCTION PruneOldestEntries(cache, maxSize)
  
  entries = []
  FOR EACH key, entry IN cache
    entries.APPEND({
      key: key,
      timestamp: entry.timestamp,
      entry: entry
    })
  END FOR
  
  sorted = Sort(entries, comparator = (a, b) => b.timestamp - a.timestamp)
  
  pruned = {}
  FOR i = 0 TO Min(maxSize, Count(sorted)) - 1
    item = sorted[i]
    pruned[item.key] = item.entry
  END FOR
  
  RETURN pruned
  
END FUNCTION
```

### Output Formats

```
FUNCTION ToJSON(data)
  
  json = {
    type: "list-result",
    timestamp: GetCurrentTimestamp(),
    data: data
  }
  
  RETURN JSONStringify(json, prettyPrint=true)
  
END FUNCTION

FUNCTION ToMarkdownTable(data)
  
  IF data CONTAINS "| " THEN
    RETURN data
  END IF
  
  lines = Split(data, "\n")
  items = []
  
  FOR EACH line IN lines
    IF line MATCHES "^\d+\. (.+)$" THEN
      items.APPEND(Match[1])
    END IF
  END FOR
  
  IF items.isEmpty THEN
    RETURN data
  END IF
  
  output = "| # | Item |\n"
  output += "|---|------|\n"
  
  FOR i = 0 TO Length(items) - 1
    output += "| {i+1} | {items[i]} |\n"
  END FOR
  
  RETURN output
  
END FUNCTION

FUNCTION ToCompactList(data)
  
  lines = Split(data, "\n")
  items = []
  
  FOR EACH line IN lines
    IF line MATCHES "^\d+\. (.+)$" THEN
      items.APPEND(Match[1])
    ELSE IF line MATCHES "^\*\*([^*]+)\*\*:" THEN
      items.APPEND(Match[1])
    END IF
  END FOR
  
  IF items.isEmpty THEN
    RETURN data
  END IF
  
  RETURN Join(items, ", ")
  
END FUNCTION

FUNCTION ShowRecentContext()
  
  RETURN """
**Recent Context**: 

*This feature would show recent conversation context.*

*Note: Requires integration with conversation history API*
"""
  
END FUNCTION
```

---

## Success Criteria

**Phase 1** ✅ Complete:
- [x] list.prompt.md created
- [x] Parameter parsing system
- [x] Natural sorting utility
- [x] Base parameters (-k, -p, -i, -d)
- [x] Help text system

**Phase 2** ✅ Complete:
- [x] Fuzzy matching with Levenshtein distance
- [x] Match quality scoring
- [x] Word boundary detection
- [x] Enhanced dictionary search

**Phase 3** ✅ Complete:
- [x] Git commit listing (-g {n})
- [x] Key-specific filtering (--key={key})
- [x] Commit message parsing
- [x] Commit table formatting

**Phase 4** ✅ Complete:
- [x] Workspace statistics (-w)
- [x] Caching system (5min TTL)
- [x] Output formats (--json, --table, --compact)
- [x] Cache management (cleanup, pruning)

**Phase 5**: Testing and documentation complete
