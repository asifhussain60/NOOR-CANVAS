# Context Gathering Phases (Step 2)

## Overview

Step 2 is the most comprehensive phase of task agent execution, consisting of 10 conditional sub-phases that build complete context before planning. This modular approach prevents duplicate work, identifies root causes early, and ensures architectural alignment.

---

## Execution Flow Decision Tree

```
Step 2: Context Gathering
│
├─→ 2.1: Key Resolution (ALWAYS)
│    └─→ Infer from history, terminal, or request user input
│
├─→ 2.2: Key Data Stream Query (ALWAYS)
│    └─→ Read existing work, detect in-progress status
│
├─→ 2.3: Auto-Load File Mappings (ALWAYS if key exists)
│    └─→ Load referenced files into context
│
├─→ 2.4: Error Triage (IF user reports error)
│    ├─→ Framework Error? → 2.5
│    ├─→ Known Pattern? → 2.6
│    ├─→ UI/Browser Bug? → 2.7
│    └─→ Business Logic? → 2.8
│
├─→ 2.5: Framework Validation (IF 2.4 = framework error)
│    └─→ Validate Blazor/SignalR/EF setup
│
├─→ 2.6: Known Pattern Matching (IF 2.4 classified AND library exists)
│    ├─→ HIGH confidence match? → Apply solution, SKIP 2.8
│    └─→ LOW/no match? → Continue to 2.8
│
├─→ 2.7: UI Debugging Protocol (IF 2.4 = UI bug)
│    └─→ Automated diagnostics or user collaboration
│
├─→ 2.8: Architecture Analysis (USUALLY, skip if 2.6 HIGH confidence)
│    ├─→ Code duplication detection
│    ├─→ Service discovery
│    ├─→ Infrastructure compliance
│    └─→ 2.8.7: Data Lifecycle Validation (IF CRUD operation)
│
├─→ 2.9: QuickRef Localization (IF first use of key)
│    └─→ Cache InfrastructureQuickRef, PlaywrightQuickRef
│
├─→ 2.10: View Documentation (IF annotate parameter)
│    └─→ AI-powered screenshot analysis
│
└─→ 2.11: Refactoring Opportunity Detection (IF modifying existing code)
     ├─→ Analyze method length, duplication, complexity, naming
     ├─→ Present findings to user for approval
     └─→ Add approved refactorings as optional subtasks in Step 3
```

---

## Sub-Phase Details

### 2.0. Shortcut Expansion

**Purpose:** Resolve user shorthand tokens to canonical files and concepts before loading context.

**When:** ALWAYS (first sub-phase in Step 2)

**Actions:**
1. Load `.github/prompts/shared/UserDictionary.md`
2. Scan the user request and parameters for known shortcuts (e.g., hcp, scanv, tcanv, swait)
3. Expand each to canonical names and `#file:` references
4. Carry the expansions into 2.1–2.3 for key resolution and file loading

**Output:**
- Concise: `🔎 Shortcut Expansion: {N} tokens resolved`
- Detailed: Mapping list (shorthand → canonical → file)

### 2.1. Key Resolution & Continuation Detection

**Purpose:** Determine which key (task context) to work within and detect high-priority constraints

**When:** ALWAYS (first sub-phase)

**Logic:**
1. If key provided explicitly → Use provided key
2. If key NOT provided OR user says "continue":
   - Check thread history for recent key usage
   - Infer from `#terminalLastCommand`, `#getTerminalOutput`
   - Query `.github/prompts.keys/` for recently modified files
   - If uncertain → Request clarification from user
3. **2.1.5: High-Priority Constraint Detection** (NEW):
   - Scan user request for ALL CAPS emphasis patterns
   - Extract constraints (do NOT remove, EXACTLY match, MUST include, etc.)
   - Categorize constraints (Preservation, Exactness, Mandatory Inclusion, Behavioral)
   - Create high-priority task entries for Step 6.3 verification
4. Log resolution process in key data stream

**See:** `.github/prompts/shared/high-priority-task-detection.md` for complete constraint detection protocol

**Output:**
- Concise: `🔑 Key: {key-name}` + `HIGH-PRIORITY: {N} constraints detected`
- Detailed: `🔑 Key Resolution: {key-name} (source: {explicit|inferred-from-history|inferred-from-terminal|user-provided})` + constraint details

---

### 2.2. Key Data Stream Query

**Purpose:** Read existing work to prevent duplication and understand context, record user request

**When:** ALWAYS (after key resolution)

**Actions:**
1. Search for key file: `.github/prompts.keys/**/{key}.md`
2. If found:
   - Read key metadata (status, files-affected, changes-made)
   - Build context from work log entries
   - Identify dependencies and related tasks
   - Check for locks or in-progress status
3. If NOT found:
   - Create new key file with initial metadata
   - Mark status as `in-progress`
4. **2.2.1: Record User Request** (NEW):
   - Create succinct 1-2 sentence summary of user's original request
   - Include high-priority constraints (ALL CAPS emphasis)
   - Timestamp entry for traceability
   - This becomes the "User Request" section in key data stream
5. Log verification results

**Output:**
- Concise: `📋 Key Status: {new|in-progress|complete} ({X} previous entries)` + `Recorded user request`
- Detailed: Show recent work log entries, files affected, last commit, full user request summary

---

### 2.3. Auto-Load File Mappings

**Purpose:** Automatically load file context from key metadata to eliminate manual `#file:` references

**When:** IF key exists and has File Mappings section

**Actions:**
1. Parse "File Mappings" section from key metadata
2. Extract file paths referenced
3. Prioritize files (recently modified first)
4. Load files using `read_file` tool
5. Add loaded content to context for use during execution
6. Handle missing files gracefully (log warning, continue)

**Output:**
- Concise: `📁 Auto-loaded {X} files from key mappings`
- Detailed: List each file loaded with line count

**Efficiency:** Eliminates need for user to specify `#file:` references repeatedly

---

### 2.4. Error Triage & Classification

**Trigger:** User request mentions "error", "bug", "not working", "broken", "throws", "fails"

**Purpose:** Classify error type to determine correct investigation path

**Actions:**
1. Parse error description from user request
2. Request browser console logs (if UI error)
3. Request stack trace (if exception)
4. Classify error type:
   - **Priority 1:** Framework/Platform Error (Blazor circuit, SignalR connection, EF migration)
   - **Priority 2:** Known Pattern (error signature matches library)
   - **Priority 3:** UI/Browser Bug (rendering, CSS, JavaScript)
   - **Priority 4:** Business Logic Error (application code)
5. Route to appropriate sub-phase:
   - Priority 1 → Step 2.5 (Framework Validation)
   - Priority 2 → Step 2.6 (Known Pattern Matching)
   - Priority 3 → Step 2.7 (UI Debugging Protocol)
   - Priority 4 → Step 2.8 (Architecture Analysis)

**Output:**
- Concise: `🔍 Error Classification: {type} → Routing to Step 2.{X}`
- Detailed: Error signature analysis, confidence score, recommended path

---

### 2.5. Framework Configuration Validation

**Trigger:** Step 2.4 classified error as Framework/Platform Error (Priority 1)

**Purpose:** Validate framework-specific setup before investigating component code

**When:** ONLY if error classified as framework-related

**Checklists:**

**See:** `.github/prompts/shared/framework-validation-checklists.md` for complete validation procedures:

- **Blazor Server:** Render mode, JavaScript interop, SignalR circuits
- **ASP.NET Core API:** Controller registration, middleware order, CORS
- **SignalR:** Hub configuration, client setup, connection management
- **Entity Framework:** DbContext registration, migrations, connection strings

**Actions:**
1. Select appropriate checklist based on error context
2. Validate configuration systematically
3. Report findings:
   - PASS: Framework configured correctly, error is application-level
   - WARN: Configuration issues found but non-blocking
   - FAIL: Critical framework misconfiguration detected

**Output:**
- Concise: `⚙️ Framework Validation: {PASS | WARN | FAIL}`
- Detailed: Complete configuration analysis with recommendations

**Next Step:**
- If FAIL → Fix framework issues first
- If PASS/WARN → Continue to Step 2.8 (Architecture Analysis)

---

### 2.6. Known Error Pattern Matching

**Trigger:** ONLY if Step 2.4 classified an error AND pattern library exists at `.github/learning/error-patterns.json`

**Purpose:** Match reported error against library of known issues for instant resolution

**When:** After error classification, before architecture analysis

**Actions:**
1. Extract error signature:
   - Error message text
   - Stack trace (if available)
   - Error code/type
   - Context (component, file, line number)
2. Query pattern library: `.github/learning/error-patterns.json`
3. Check legacy patterns for backward compatibility
4. Calculate confidence score (HIGH/MEDIUM/LOW)
5. If HIGH confidence match:
   - Apply known solution immediately
   - Skip Step 2.8 (Architecture Analysis)
   - Document pattern application in key data stream
6. If MEDIUM/LOW confidence or no match:
   - Log potential matches for reference
   - Proceed to Step 2.8 (full architecture analysis)

**Output:**
- Concise: `🎯 Pattern Match: {pattern-id} (confidence: {score}%) → Applying known solution`
- Detailed: Pattern details, historical occurrence count, success rate, solution steps

**Efficiency:** Resolves known issues in seconds instead of hours

---

### 2.7. UI Debugging Protocol

**Trigger:** User reports UI not displaying/working (toasts, panels, buttons, modals), CSS layout issues, JavaScript errors

**Purpose:** Gather concrete evidence about UI state before attempting fixes

**When:** ONLY if error classified as UI/browser bug

**Protocol:**

**See:** `.github/prompts/shared/ui-debugging-protocol.md` for complete protocol

**Phases:**
1. **Automated Evidence Gathering** (if Playwright available)
   - Generate diagnostic test script
   - Capture screenshots, DOM state, console logs
   - Analyze computed styles, z-index hierarchy
   - Verify element visibility and positioning
2. **User Collaboration** (fallback if automation unavailable)
   - Request specific user actions
   - Collect browser console logs
   - Capture screenshots of issue
   - Gather network tab information

**Decision Gates:**
- Evidence collected → Categorize issue (CSS, JavaScript, DOM, rendering)
- No evidence → Request additional user input
- Sufficient data → Proceed to targeted fix

**Output:**
- Concise: `🐛 UI Diagnostics: {issue-type} identified via {automated|user-provided} evidence`
- Detailed: Complete diagnostic report with evidence, screenshots, analysis

**Efficiency:**
- Without Evidence: 5+ attempts, 2+ hours
- With Automated Diagnostics: 1-2 attempts, 1-2 minutes

---

### 2.8. Technical Architecture Analysis

**Purpose:** Prevent code duplication and spaghetti code by analyzing existing infrastructure

**When:**
- MANDATORY for all code implementation tasks (when `debug-level != doc`)
- ENHANCED when `debug-level: doc` (comprehensive documentation)
- SKIP for documentation-only tasks
- SKIP if Step 2.6 matched known error pattern with HIGH confidence

**Analysis Steps:**
1. **Architecture Layer Review**
   - Consult `Architecture.md` for system design
   - Identify affected layers (UI, API, Services, Database)
   - Verify architectural boundaries respected

2. **Code Duplication Detection**
   - Search for similar implementations using `semantic_search`
   - Check for existing components/services that solve same problem
   - Identify reusable patterns

3. **Service Discovery & Dependency Check**
   - Inventory existing services via `grep_search`
   - Map dependencies between components
   - Check for circular dependency risk

4. **Infrastructure Compliance Validation**
   - Consult `InfrastructureQuickRef.md` for database rules, API patterns
   - Verify database schema access (canvas.* write, others read-only)
   - Validate API endpoint patterns

5. **Cross-Agent Pattern Reuse**
   - Query `.github/learning/` for similar task patterns
   - Check validation patterns, error patterns, refactor patterns
   - Reuse proven approaches

6. **Spaghetti Code Risk Assessment**
   - Analyze coupling between components
   - Identify God objects or overly complex classes
   - Flag architectural smells

#### 2.8.7. Data Lifecycle Validation (CRUD Operations)

**When:** IF task involves create, update, or delete operations

**Purpose:** Ensure COMPLETE data lifecycle to prevent UI-only mutations

**Complete Lifecycle Components:**
1. **UI Action** - Button click, form submit triggers operation
2. **API Call** - HTTP POST/PUT/DELETE to backend endpoint
3. **Database Persistence** - EF Core SaveChanges or SQL execution
4. **SignalR Broadcast** - Notify all connected clients of change
5. **UI Update** - All browsers receive and display updated state

**Validation:**
- If ALL 5 components present → ✅ COMPLETE lifecycle
- If ANY component missing → ⚠️ INCOMPLETE lifecycle = RED FLAG

**Incomplete Lifecycle = Early Warning:**
- Agent MUST warn user in Step 4 (Approval) before proceeding
- Present consequences:
  - Changes disappear after page refresh
  - Multi-user desync (only one browser updated)
  - Data loss or corruption
- Request explicit approval to proceed with incomplete implementation

**Output:**
- Concise: `Architecture Analysis: {layer}, {X} reusable patterns, Data Lifecycle: {COMPLETE|INCOMPLETE}`
- Detailed: Complete analysis with recommendations, similar patterns found, compliance results, data lifecycle component breakdown

**Abort Conditions:**
- HIGH duplication risk detected → Halt, request refactor approach
- Infrastructure violations found → Halt, request clarification
- Circular dependency risk identified → Halt, request resolution
- INCOMPLETE data lifecycle (CRUD) → Warn in Step 4, request approval

---

### 2.9. QuickRef Localization

**Purpose:** Cache frequently-referenced information from QuickRef files into key metadata for efficiency

**When:** ONLY if `{key}.md` exists AND "QuickRef Localization" section is empty

**Trigger:** First task execution for a given key

**Source Files:**
- `InfrastructureQuickRef.md` - Database rules, API endpoint patterns, SignalR hubs
- `PlaywrightQuickRef.md` - Test patterns, Session 212 test data (tokens, session ID)

**Actions:**
1. Check if key file has "QuickRef Localization" section
2. If empty or missing:
   - Read relevant QuickRef files
   - Extract key-specific information
   - Add "QuickRef Localization" section to key metadata
   - Cache extracted data for future reference
3. If already populated:
   - Skip this step (use cached data)

**Output:**
- Concise: `📚 QuickRef cached ({X} entries)`
- Detailed: List cached entries from each QuickRef file

**Efficiency:**
- First iteration: Reads QuickRef files (one-time cost)
- Subsequent iterations: Uses cached data (zero I/O overhead)

---

### 2.10. View Documentation

**Purpose:** Analyze screenshots to document HTML state OR extract requirements from annotated designs

**Trigger:** ONLY when `annotate` parameter is provided with image filename(s)

**When:** User provides `annotate="screenshot.png"` or `annotate="view1,view2"`

**Dual-Mode Operation (Auto-Detected):**

**Mode 1: HTML Documentation (Plain Screenshots)**
- AI identifies view/component from screenshot
- Analyzes visible HTML elements (buttons, inputs, forms, layout)
- Documents findings in key data stream under "## View Documentation"
- No code execution - pure documentation for context building

**Mode 2: Requirement Extraction (Annotated Mockups)**
- AI detects visual annotations automatically (arrows, markup, highlights)
- Extracts change requirements from annotations
- Presents requirements to user for approval
- Executes approved changes

**Workflow:**
1. Parse `annotate` parameter (comma-delimited list, extensions optional)
2. For each image:
   - Locate image file in workspace
   - Send to GPT-4 Vision API for analysis
   - Detect mode (plain vs annotated)
   - Extract information based on mode
3. Update key data stream with view documentation
4. Use documented context in planning phase (Step 3)

**Output:**
- Concise: `📸 Analyzed {X} screenshots ({Y} plain, {Z} annotated)`
- Detailed: Complete view documentation with HTML element inventory

---

## Skip Conditions Summary

| Sub-Phase | Skip Condition |
|-----------|---------------|
| 2.1 Key Resolution | Never (ALWAYS execute) |
| 2.2 Key Data Stream Query | Never (ALWAYS execute) |
| 2.3 Auto-Load Mappings | If key doesn't exist or no file mappings |
| 2.4 Error Triage | If user request is NOT error-related |
| 2.5 Framework Validation | If 2.4 didn't classify as framework error |
| 2.6 Known Pattern Matching | If 2.4 didn't classify error OR no pattern library |
| 2.7 UI Debugging | If 2.4 didn't classify as UI bug |
| 2.8 Architecture Analysis | If 2.6 found HIGH confidence match |
| 2.8.7 Data Lifecycle | If task is NOT CRUD operation |
| 2.9 QuickRef Localization | If key doesn't exist OR already localized |
| 2.10 View Documentation | If `annotate` parameter not provided |

---

## Terminal Conditions

**Continue to Step 3 (Planning):**
- Key resolved successfully
- Sufficient context gathered
- No critical framework failures
- Architecture analysis complete (or skipped via pattern match)

**Abort Execution:**
- Key resolution failed after all attempts
- Critical framework misconfiguration (2.5 FAIL)
- HIGH duplication risk without remediation plan
- Infrastructure violations detected
- Circular dependency risk identified
- User declines to proceed after warnings

---

## Performance Optimization

**Token Budget Awareness:**
- Step 2 can consume significant tokens (10 sub-phases)
- Monitor cumulative token usage
- If exceeds 50K tokens in Step 2 → Request user approval for deep dive

**Phase Timeout:**
- Step 2 total execution time limit: 5 minutes
- If exceeded → Log diagnostic, request user intervention
- Prevents infinite recursion in pattern matching or architecture analysis

**Caching:**
- QuickRef Localization (2.9) reduces repeated I/O
- Auto-Load File Mappings (2.3) eliminates manual references
- Known Pattern Library (2.6) provides instant solutions

---

## Integration with Other Steps

**Feeds Into Step 3 (Planning):**
- Key context from 2.2
- Loaded file content from 2.3
- Error classification from 2.4
- Architecture analysis from 2.8
- Data lifecycle status from 2.8.7
- View documentation from 2.10

**Informs Step 4 (Approval):**
- Early warnings from 2.8.7 (incomplete data lifecycle)
- Framework validation results from 2.5
- Architecture violation alerts from 2.8
- Refactoring recommendations from 2.11 (requires user approval)

**Bypasses Steps (Efficiency):**
- If 2.6 HIGH confidence → Skip 2.8, go straight to Step 3
- If 2.4 not triggered → Skip 2.5, 2.6, 2.7
- If documentation mode → Skip execution steps later

---

### 2.11. Refactoring Opportunity Detection

**Purpose:** Proactively identify code quality improvements during code modifications

**When:** CONDITIONAL - Only when modifying existing code (NOT for new features)

**Trigger Conditions:**
- Task involves editing existing files (NOT creating new files)
- User request contains keywords: "fix", "update", "modify", "change", "refactor"
- Files being modified are >100 lines (significant enough to benefit from refactoring)

**Skip Conditions:**
- Task is creating new feature from scratch
- Task is purely configuration/documentation
- Files being modified are <100 lines (too small to warrant refactoring analysis)
- User explicitly says "no refactoring" or "quick fix only"

**Analysis Targets:**

1. **Method Length** (detect long methods):
   ```
   - Scan for methods >50 lines
   - Flag methods >100 lines as HIGH priority
   - Suggest Extract Method refactoring
   - Example: "Method ProcessTranscript (127 lines) → Extract ParseSections, ValidateStructure"
   ```

2. **Code Duplication** (detect similar blocks):
   ```
   - Compare code blocks within same file
   - Identify repeated patterns (>10 lines similar)
   - Suggest Extract Method or Extract Helper
   - Example: "HTML transformation logic repeated 3 times → Extract TransformHtmlSection method"
   ```

3. **Cyclomatic Complexity** (detect complex logic):
   ```
   - Count branches (if/else, switch, loops, ternary)
   - Flag methods with >10 branches
   - Suggest Simplify Conditional or Extract Method
   - Example: "Method ValidateInput has 15 nested conditions → Extract validation methods"
   ```

4. **Poor Naming** (detect unclear identifiers):
   ```
   - Flag single-letter variables (except loop counters i, j, k)
   - Flag ambiguous names (data, temp, obj, val, x, y)
   - Suggest descriptive alternatives
   - Example: "Variable 'x' → 'transcriptSectionIndex'"
   ```

5. **Missing Documentation** (detect undocumented public APIs):
   ```
   - Scan for public methods without XML comments
   - Scan for complex methods without inline comments
   - Suggest adding documentation
   - Example: "Public method ShareTranscriptSection missing XML documentation"
   ```

6. **Magic Numbers** (detect unexplained constants):
   ```
   - Flag numeric literals (except 0, 1, -1, 100)
   - Suggest named constants
   - Example: "Literal '8000' → Extract constant DefaultTimeoutMilliseconds"
   ```

**Integration with Roslynator:**

When .NET/C# code is detected, suggest specific Roslynator analyzers:

```
- RCS1123: Add parentheses when necessary
- RCS1036: Remove redundant empty line
- RCS1118: Mark local variable as const
- RCS1077: Optimize LINQ method call
- RCS1163: Unused parameter
```

**Reference:** See `.github/instructions/Links/RoslynatorRefactoringsQuickRef.md` for complete refactoring catalog

**Output Format:**

```markdown
🔍 Refactoring Opportunities Detected (Step 2.11)

## Code Quality Issues Found

### High Priority
1. **Long Method**: `ProcessTranscript` (127 lines)
   - **Issue**: Method exceeds complexity threshold
   - **Suggestion**: Extract Method refactoring
     - `ParseSections()` - lines 15-45
     - `ValidateStructure()` - lines 46-78
     - `TransformHtml()` - lines 79-120
   - **Benefit**: Improved testability, readability, maintainability
   - **Roslynator**: Use RCS1138 (Add summary to documentation comment)

2. **Code Duplication**: HTML transformation logic (3 occurrences)
   - **Issue**: Same transformation code in lines 89-103, 145-159, 201-215
   - **Suggestion**: Extract `TransformHtmlSection(string html)` helper method
   - **Benefit**: DRY principle, single source of truth, easier bug fixes
   - **Roslynator**: Use RCS1213 (Remove unused member declaration)

### Medium Priority
3. **Poor Naming**: Variable `x` (line 45)
   - **Issue**: Single-letter variable name unclear
   - **Suggestion**: Rename to `transcriptSectionIndex`
   - **Benefit**: Self-documenting code

4. **Magic Number**: Literal `8000` (line 67)
   - **Issue**: Unexplained timeout value
   - **Suggestion**: Extract constant `private const int DefaultTimeoutMilliseconds = 8000;`
   - **Benefit**: Centralized configuration, easier tuning

### Low Priority
5. **Missing Documentation**: Public method `ShareTranscriptSection`
   - **Issue**: No XML documentation for public API
   - **Suggestion**: Add `/// <summary>` documentation
   - **Benefit**: IntelliSense support, API clarity

## User Approval Required

**Include refactoring in implementation plan?**
- ✅ Yes - Include all refactoring tasks as separate subtasks (recommended)
- ⚠️  Partial - Select specific refactorings to include
- ❌ No - Skip refactoring, proceed with minimal changes only

**If approved, refactoring will be added as optional subtasks with clear rollback points.**
```

**Approval Handling:**

1. **User says "yes" or "include refactoring"**:
   - Add refactoring as separate subtasks in Step 3 plan
   - Each refactoring task has independent checkpoint
   - User can skip individual refactoring tasks later

2. **User says "partial" or selects specific items**:
   - Present numbered list of refactorings
   - User selects by number (e.g., "1, 3, 5")
   - Include only selected refactorings in plan

3. **User says "no" or "skip refactoring"**:
   - Proceed with minimal changes only
   - Document detected issues in work-log for future reference

4. **No response / ambiguous**:
   - Default to "no" (safe default - don't add unasked work)

**Integration with Step 3 (Planning):**

If refactoring approved, add as separate phase in implementation plan:

```markdown
### Subtasks

#### Phase 1: Core Implementation
1. Fix share button injection bug
2. Add SignalR handler for transcript sections

#### Phase 2: Refactoring (Optional - Safe to skip)
3. [REFACTOR] Extract Method: ProcessTranscript → ParseSections, ValidateStructure
4. [REFACTOR] Extract Helper: TransformHtmlSection (eliminate duplication)
5. [REFACTOR] Rename variable: x → transcriptSectionIndex

**Checkpoint**: Create git tag before Phase 2 for easy rollback if issues arise
```

**Token Budget:**

- Analysis is lightweight (static analysis, no external tool invocation)
- Limit analysis to files ALREADY loaded in context (no additional file reads)
- Skip analysis if token budget >40,000 (prioritize core task execution)

**Verbosity Control:**

- **Concise**: Summary count only (e.g., "🔍 5 refactoring opportunities detected")
- **Detailed**: Full analysis with code snippets, Roslynator references, approval prompt

---

## Usage in Main Prompt

Reference this comprehensive guide in task.prompt.md:

```markdown
### Step 2: Context Gathering (MANDATORY - Multi-Phase)

**Purpose:** Build comprehensive context before planning.

**See:** `.github/prompts/shared/context-gathering-phases.md` for:
- Complete decision tree (11 sub-phases)
- Conditional execution logic
- Skip conditions and terminal states
- Performance optimization strategies

**Key Sub-Phases:**
- 2.1: Key Resolution (ALWAYS)
- 2.2: Key Data Stream Query (ALWAYS)
- 2.3: Auto-Load File Mappings (if key exists)
- 2.4: Error Triage (if error reported)
- 2.5-2.7: Conditional error investigation
- 2.8: Architecture Analysis (usually)
- 2.8.7: Data Lifecycle Validation (if CRUD)
- 2.9: QuickRef Localization (first use)
- 2.10: View Documentation (if annotate param)
- 2.11: Refactoring Opportunity Detection (if modifying existing code)

**Output (controlled by verbosity):**
- Concise: Brief phase summaries, routing decisions
- Detailed: Complete context dump, analysis results
```

