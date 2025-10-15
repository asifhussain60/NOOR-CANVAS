# Task Agent Parameters Reference

## Complete Parameter Documentation

---

## key *(required if available)*

**Type:** String  
**Purpose:** Identifier for the task (maps directly to the keylock system)  
**Example:** `hostcontrolpanel`, `canvas-sharing`, `debug-panel`

### Resolution Strategy (If Not Provided)

The agent will attempt to infer the key in this order:

1. **Thread History:** Check conversation history for most recently used key in this session
2. **Terminal Commands:** Review `#terminalLastCommand`, `#getTerminalOutput` for context clues
3. **Recent Keys:** Query `.github/prompts.keys/` for recently modified key files
4. **User Clarification:** If uncertain after all attempts, halt and request explicit key

### Rationale

Work within a session typically relates to the same key context unless explicitly changed. Automatic key inference reduces friction for continuing work.

### Key File Location

`.github/prompts.keys/**/{key}.md` or `.github/prompts.keys/{category}/{key}.md`

---

## debug-level *(optional, default=`none`)*

**Type:** Enum  
**Purpose:** Controls debug logging code **inserted into source files** OR documentation mode  
**Options:** `none`, `simple`, `trace`, `diagnostic`, `cleanup`, `doc`

### Option Details

#### `none` (Default)
- Production-ready code
- No debug logging inserted
- Clean, deployable implementation
- **Use When:** Final implementation, production deployment

#### `simple`
- Basic debug markers for quick troubleshooting
- Pattern: `Logger.LogInformation("[DEBUG-WORKITEM:scope] message ;CLEANUP_OK")`
- Minimal performance impact
- **Use When:** Quick debugging, simple state verification

#### `trace`
- Comprehensive debug markers with detailed state tracking
- Logs method entry/exit, parameter values, intermediate states
- Pattern: `Logger.LogInformation("[DEBUG-WORKITEM:scope:context] detailed message ;CLEANUP_OK")`
- **Use When:** Complex debugging, multi-step workflows, race conditions

#### `diagnostic`
- Deep diagnostic mode with multi-layer analysis
- Includes:
  - JavaScript DOM inspection (element states, computed styles, z-index hierarchy)
  - CSS layout analysis (heights, widths, overflow, flex/grid behavior)
  - Browser state verification (library loading, function availability)
  - Network resource verification (CSS/JS file loading)
- Uses `DiagnosticLogger` Razor component for reusable diagnostics
- Logs at `CRITICAL` level for high visibility in production logs
- Includes request correlation IDs for trace analysis
- **Use When:** Persistent bugs, CSS layout issues, JavaScript timing problems, cross-browser issues

**See:** `.github/prompts/shared/debug-logging-mandate.md` for complete diagnostic mode patterns

#### `cleanup`
- Detect and remove existing debug logs using standardized markers
- Searches for patterns: `[DEBUG-WORKITEM:*]`, `[DIAGNOSTIC:*]`, `;CLEANUP_OK`
- Removes from C#, JavaScript, TypeScript, Razor files
- Verifies clean removal with `git grep`
- **Use When:** Preparing for production, post-debugging cleanup

#### `doc` (Documentation-Only Mode)
- **SPECIAL MODE:** Generate implementation plan without code execution
- Performs complete technical analysis
- Generates comprehensive plan with code examples
- Documents architectural decisions and patterns
- **SKIPS** code execution (Step 5) and validation (Step 6)
- Output: Complete implementation documentation in key data stream
- **Use When:** Planning phase, architectural design, training documentation

### Debug Marker Standards

**All debug markers MUST include `;CLEANUP_OK` suffix for automatic detection and removal.**

**Patterns:**
- C# Logging: `Logger.Log*("[DEBUG-WORKITEM:scope:context] message ;CLEANUP_OK")`
- JavaScript: `console.log("[DEBUG-WORKITEM:scope:context] message ;CLEANUP_OK")`
- Comments: `// DEBUG-WORKITEM: description ;CLEANUP_OK`
- Diagnostic: `[DIAGNOSTIC:scope] message ;CLEANUP_OK`

**See:** `.github/prompts/shared/debug-logging-mandate.md` for complete patterns and examples

---

## verbosity *(optional, default=`concise`)*

**Type:** Enum  
**Purpose:** Controls agent output detail level shown to user (does NOT affect functionality)  
**Options:** `concise`, `detailed`

### Option Comparison

| Aspect | Concise (Default) | Detailed |
|--------|-------------------|----------|
| **Step Summaries** | 3-5 lines max | Complete analysis |
| **File Changes** | Count only | File-by-file breakdown |
| **Context Gathering** | Phase names, key findings | Full context dump |
| **Architecture Analysis** | Layer, risk level, lifecycle status | Complete recommendations, patterns found |
| **Validation Results** | Pass/fail status | All errors with stack traces |
| **Key Data Stream Updates** | Brief acknowledgment | Show complete entry added |
| **Commit Messages** | Brief summary | Full commit details |

### When to Use Each

**Concise (Default):**
- Quick iterations
- User understands system well
- Minimal noise desired
- Fast feedback loops

**Detailed:**
- Complex debugging
- Learning system architecture
- Documentation generation
- Audit trail requirements
- Troubleshooting failures

### Example Output

**Concise:**
```
✓ Step 2: Context gathered (5 files loaded, CRUD lifecycle COMPLETE)
✓ Step 5: 3 subtasks executed, 0 errors
✓ Step 8: Key data stream updated (commit: db0c89d5)
```

**Detailed:**
```
Step 2: Context Gathering Complete
- Key: debug-panel (inferred from terminal history)
- Files loaded: SessionCanvas.razor (450 lines), DebugPanelService.cs (120 lines), ...
- Architecture analysis: UI layer, 2 reusable patterns found
- Data Lifecycle: COMPLETE (UI → API → DB → SignalR → UI)

Step 5: Execution Complete
- Subtask 1: Add DebugPanel component (150 lines added)
- Subtask 2: Wire up SignalR broadcast (3 files modified)
- Subtask 3: Create Playwright test (80 lines, test passes)

Step 8: Key Data Stream Update
Entry added:
### 2025-10-14T12:34:56Z
- Status: In Progress
- Changes: Debug panel UI component, SignalR integration
- Files: SessionCanvas.razor, DebugPanelService.cs, debug-panel-visibility.spec.ts
- Commit: db0c89d52f1a3b4c5d6e7f8g9h0i1j2k3l4m5n6o
```

---

## tasks *(optional, multi-line)*

**Type:** Multi-line string  
**Purpose:** Subtasks to be performed in sequence, halting on failure  
**Format:** One task per line, or use `\n---\n` as separator

### Standard Usage

```
tasks="Fix hadees token removal in SessionCanvas
---
Add share button to toolbar
---
Create Playwright test for share functionality"
```

### Special Keywords

#### "mark complete" or "completed"
**Triggers Step 9: Completion Workflow**

When user specifies `tasks="mark complete"` or `tasks="completed"`:

1. **Cross-Layer Documentation:** Documents COMPLETE workflow across all 8 layers
   - Frontend (UI components, user journey, styling, client logic)
   - API (endpoints, DTOs, authentication, error handling)
   - Service (business logic, transformations, dependencies)
   - Database (tables, migrations, queries, indexes)
   - SignalR/Real-Time (hubs, connection management, message flow)
   - Configuration (appsettings, environment variables, feature flags)
   - Testing Coverage (unit, integration, Playwright, visual)
   - Dependencies (NuGet/npm packages, framework versions)

2. **Obsolete Information Removal:** Cleans key data stream
   - Removes superseded implementations
   - Removes failed attempts
   - Removes temporary workarounds
   - Keeps only current, working implementation

3. **Debug Marker Cleanup:** Removes all debug logging (MANDATORY)
   - Searches all modified files for debug markers
   - Removes `[DEBUG-WORKITEM:*]`, `[DIAGNOSTIC:*]`, `;CLEANUP_OK`
   - Verifies with `git grep` (zero remaining markers)
   - Ensures clean build

4. **State Management:** Marks key as `complete` in metadata

5. **Resumption Protocol:** If new tasks arrive later
   - Auto-reverts status from `complete` to `in-progress`
   - Preserves completion documentation
   - Adds new work log entry documenting resumption

**See:** `.github/prompts/shared/completion-workflow-template.md` for complete template

### Execution Behavior

- **Sequential:** Tasks executed one by one, in order
- **Halt on Failure:** If any task fails, execution stops (unless user grants override)
- **Incremental Updates:** Key data stream updated after EACH subtask completion
- **Rollback Capable:** Checkpoint commit enables rollback to pre-task state

---

## annotate *(optional)*

**Type:** String (comma-delimited filenames)  
**Purpose:** Triggers AI-powered view analysis from screenshots with dual-mode operation  
**Format:** Filename(s) with or without extensions, comma-separated for multiple

### Dual-Mode Operation (Auto-Detected)

**Mode 1: HTML Documentation (DEFAULT)**  
**Trigger:** Plain screenshots without visual annotations

1. AI identifies view/component from screenshot
2. Analyzes visible HTML elements (buttons, inputs, forms, layout)
3. Documents findings in key data stream under "## View Documentation"
4. No code execution - pure documentation for context building
5. Used during planning phase for accurate implementation

**Mode 2: Requirement Extraction (ANNOTATED)**  
**Trigger:** Images with visual annotations (arrows, markup, highlights)

1. AI detects visual annotations automatically
2. Extracts change requirements from annotations
3. Presents requirements to user for approval
4. Executes approved changes

### Usage Examples

```
# Single image
annotate="screenshot.png"

# Multiple images (extensions optional)
annotate="view1,view2,view3"

# Mixed modes
annotate="current.png,mockup-annotated.jpg"
```

### Supported Image Formats

- PNG (`.png`)
- JPEG (`.jpg`, `.jpeg`)
- WebP (`.webp`)
- GIF (`.gif`)

### Workflow

1. **Parse Parameter:** Extract comma-delimited filenames
2. **Locate Images:** Search workspace for image files
3. **Send to Vision API:** GPT-4 Vision analyzes each image
4. **Detect Mode:** Plain vs annotated (automatic)
5. **Extract Information:**
   - Mode 1: HTML element inventory
   - Mode 2: Requirements from annotations
6. **Update Key Data Stream:** Add "## View Documentation" section
7. **Use in Planning:** Referenced during Step 3 (Plan) and Step 4 (Approval)

### Output

**Concise:**
```
📸 Analyzed 3 screenshots (2 plain, 1 annotated)
```

**Detailed:**
```
View Documentation Complete

screenshot1.png (Mode: HTML Documentation)
- Component: SessionCanvas.razor
- Elements Identified: 8 buttons, 2 input fields, 1 dropdown, toolbar layout
- Layout: Flex container, responsive grid

screenshot2.png (Mode: HTML Documentation)
- Component: DebugPanel.razor
- Elements Identified: Toggle button, log viewer, filter controls
- Visibility: Initially hidden (display: none)

mockup-annotated.jpg (Mode: Requirement Extraction)
- Annotation 1: "Move this button to the left" (arrow pointing to Share button)
- Annotation 2: "Add tooltip here" (highlight on Help icon)
- Requirements extracted, awaiting approval
```

---

## Parameter Combinations

### Common Patterns

**Quick Bug Fix:**
```
key=debug-panel
debug-level=simple
verbosity=concise
tasks="Fix toast notification not showing"
```

**Feature Implementation:**
```
key=canvas-sharing
debug-level=none
verbosity=detailed
tasks="Add share button\n---\nCreate API endpoint\n---\nAdd Playwright test"
```

**Deep Diagnostic Session:**
```
key=debug-panel
debug-level=diagnostic
verbosity=detailed
tasks="Investigate panel not visible issue"
```

**Documentation-Only (No Code Execution):**
```
key=new-feature
debug-level=doc
verbosity=detailed
tasks="Design multi-user collaboration architecture"
```

**Task Completion:**
```
key=canvas-sharing
debug-level=cleanup
verbosity=detailed
tasks="mark complete"
```

**Screenshot-Driven Development:**
```
key=ui-redesign
debug-level=none
verbosity=concise
annotate="mockup.png,current-state.png"
tasks="Implement UI changes from mockup"
```

---

## Parameter Validation

**Invalid Combinations:**

❌ `debug-level=doc` + `debug-level=diagnostic`  
→ Use either `doc` (documentation only) OR `diagnostic` (code + deep logging)

❌ `tasks=""` + no other work specified  
→ Provide at least one task or use implicit continuation

✅ `debug-level=cleanup` + `tasks="mark complete"`  
→ Valid: Cleanup removes debug markers, completion documents final state

---

## Usage in Invocation

### Standard Format

```
@workspace /task key=debug-panel debug-level=simple verbosity=concise tasks="Fix panel visibility"
```

### Multi-Line Tasks

```
@workspace /task key=canvas tasks="
Add share button
---
Create API endpoint POST /api/sessions/{id}/share
---
Add Playwright test for sharing workflow
"
```

### With Screenshot Analysis

```
@workspace /task key=ui-refresh annotate="mockup.png" tasks="Implement new design from mockup"
```

---

## Advanced Features

### Auto-Key Inference

If key is not provided, agent will:
1. Check conversation history
2. Analyze terminal output
3. Query recent key modifications
4. Request clarification if uncertain

**Example:**
```
@workspace /task tasks="continue previous work"
→ Agent infers key from last task in thread history
```

### Documentation Mode Workflow

When `debug-level=doc`:
1. Step 2: Full context gathering (all phases)
2. Step 3: Comprehensive planning with code examples
3. Step 4: Approval of documentation plan
4. **SKIP Step 5:** No code execution
5. **SKIP Step 6:** No validation
6. Step 7: Summary of documentation generated
7. Step 8: Key data stream updated with implementation plan

Output: Complete technical specification in `.github/prompts.keys/{key}/implementation-plan.md`

### Verbosity Impact Across Steps

| Step | Concise Output | Detailed Output |
|------|---------------|-----------------|
| Step 2 | Phase names, key findings | Full context dump, all analysis |
| Step 3 | 3-5 line plan summary | Complete file-by-file breakdown |
| Step 4 | Brief approval request | Full plan with warnings |
| Step 5 | Progress markers only | Execution details, file diffs |
| Step 6 | Test pass/fail count | All test output, error traces |
| Step 7 | Brief summary | Comprehensive result report |
| Step 8 | Commit hash only | Full key data stream entry |

---

## Best Practices

1. **Always Provide Key (When Possible):** Reduces ambiguity, faster execution
2. **Use `debug-level=none` for Production:** Clean, deployable code
3. **Use `debug-level=diagnostic` Sparingly:** Only for persistent bugs
4. **Default to `verbosity=concise`:** Reduces noise, faster iterations
5. **Switch to `verbosity=detailed` for Debugging:** More context when troubleshooting
6. **Use `debug-level=cleanup` Before Completion:** Ensures no debug markers remain
7. **Always Use `tasks="mark complete"` When Done:** Triggers comprehensive documentation
8. **Leverage `annotate` for UI Work:** Screenshot analysis accelerates UI implementation
9. **Use `debug-level=doc` for Planning:** Generate specs before implementation

---

## See Also

- `.github/prompts/shared/debug-logging-mandate.md` - Complete debug marker patterns
- `.github/prompts/shared/completion-workflow-template.md` - Step 9 documentation template
- `.github/prompts/shared/context-gathering-phases.md` - Step 2 detailed workflow
