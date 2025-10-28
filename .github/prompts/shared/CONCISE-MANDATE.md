# CONCISE OUTPUT MANDATE (GLOBAL)

**ALL prompts MUST follow this for USER-FACING output. NO exceptions.**

## Hard Limits
- MAX 25 bullets total per response
- MAX 2 lines per bullet
- **ZERO implementation code in chat** (no C#, JS, HTML, CSS, Razor, SQL, TS code blocks)
- **ONLY architectural descriptions** (file paths, method names, flow diagrams)
- NO nested lists (flat structure only)
- NO long paragraphs (bullets only)
- NO code examples or snippets (not even as teaching examples)

## What Code Means

**❌ PROHIBITED - NEVER show in chat:**
- C# methods, classes, properties (public void, private string, etc.)
- JavaScript/TypeScript functions (function, const, let, arrow functions)
- HTML tags and structure (div, span, button elements with attributes)
- CSS rules and selectors (.class { property: value })
- SQL queries (SELECT, INSERT, UPDATE, DELETE statements)
- Razor markup (@code blocks, @inject, component syntax)

**✅ ALLOWED - Descriptions only:**
- File paths with line numbers: AssetProcessingService.cs (lines 361-394)
- Method signatures: ShareAsset(string shareId, string assetType)
- Architectural flow: Component A → Service B → Hub C → Client D
- Change summaries: Added CreateShareButtonHtml method, returns HTML string
- Data structures: Key-value pairs in text format (key: value)

**✅ ALLOWED - Configuration only:**
- JSON settings for appsettings.json (≤10 lines, no logic)
- PowerShell/Git commands for operations (exact commands only)
- Error messages for debugging (truncated, relevant portions)

## Where Code Details Go

**All implementation code → `{key}.plan.md` or `{key}/work-log.md`:**
- Complete method implementations
- HTML structure examples
- CSS styling details
- SQL queries
- JavaScript functions

**User-facing output → Architectural summaries:**
- What files changed
- What methods were added/modified
- Data flow descriptions
- High-level algorithm steps

## Response Structure

```
🧠 Analysis (≤8 bullets, 2 lines each)
- Key: {key}
- Routing: {prompts-used}
- Complexity: {simple|moderate|complex}
- Layers: {UI, API, Database, SignalR}
- Context: {visual|error|file} packages
- Assumptions: {1-2 brief assumptions}

📌 Summary (≤15 bullets, 2 lines each)
1. Key: {key} | Status: {status}
2. Work: {one-liner description}
3. Files: {count} modified ({file-list})
4. {architecture-description-bullets}
5. Testing: {manual|automated|percy} - {results}
6. Next: See options below

📋 Tasks (≤8 bullets when showing task breakdown)
- Task 1: {description}
- Task 2: {description}
- Dependencies: {task-relationships}

📊 Final (≤5 bullets)
- Status: {status}
- Key: {key}
- Documentation: {key}.plan.md updated
- Next: {primary-action}
- Options: See below
```

## Letter-Based Actions
Always provide 2-4 options:
- **A.** Execute / Proceed
- **B.** Review Plan / Details
- **C.** Modify Approach
- **D.** Cancel / Skip

User replies: "A", "A, C", or "all"

## File Locations
All output → `.github/key-data-streams/{key}/` (authoritative location)
NEVER → Chat responses

## Step Descriptions (ALLOWED FORMAT)

**Describe changes with architectural bullets:**
- File: AssetProcessingService.cs (line 384)
- Method: CreateShareButtonHtml added
- Purpose: Generate blue action bar with Share Asset button
- Returns: HTML string with ks-share-button class
- Integration: Called by CreateAssetContainerHeaderHtml

**Reference documentation for details:**
- Implementation → See {key}.plan.md section "Code Implementation"
- Full methods → See {key}/work-log.md
- Testing → See {key}.plan.md section "Testing Strategy"

## Enforcement
Before responding:
1. Count bullets → Must be ≤25 total
2. Scan for code blocks → ZERO allowed (```csharp, ```js, ```html, ```css, ```sql)
3. Verify architectural descriptions → File paths + method names + flow only
4. Check for {key}.plan.md reference → Must point to docs for implementation
5. Violations → AUTO-BLOCK response, rewrite without code

**Auto-fail triggers:**
- Any ```csharp, ```javascript, ```html, ```css, ```razor, ```sql block
- Method implementations (public void, function, const myFunc)
- HTML element structures (complete tags with attributes)
- CSS rule sets (selectors with property:value pairs)
- Exception: JSON config snippets ≤10 lines for settings only

## Special Cases

**Configuration files (appsettings.json, package.json):**
- ✅ ALLOWED: JSON snippets for settings only (≤10 lines)
- Must be pure configuration (no logic or code)
- Label clearly as "Configuration Change"

**Git commands, PowerShell scripts:**
- ✅ ALLOWED: Exact operational commands to run
- Format: Command to execute (not script internals)
- Example: git checkout -b feature/new-button

**Error messages, stack traces:**
- ✅ ALLOWED: For debugging context only
- Truncate if >20 lines, show relevant portions
- Focus on error message and file/line references

**NEVER ALLOWED regardless of context:**
- Method/function implementations
- HTML element structures with content
- CSS styling rules
- SQL query statements
- Component markup (Razor, JSX, Vue)
