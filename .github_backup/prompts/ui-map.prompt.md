````prompt
# UI Map — Automated UI Element Mapping for Playwright Test Generation

**⚠️ LOAD FIRST:** `.github/MANDATORY.md` (Enforce: No code in chat | Document first | Playwright orchestration)

---

## Purpose

Analyze Razor components and generate comprehensive clickable element ID maps to facilitate Playwright test generation.

**Use Case**: Create structured element inventories for complex UI components before writing automated tests.

---

## Version

**Version**: 1.0.0  
**Created**: 2025-11-01  
**Last Updated**: 2025-11-01

---

## Usage

### Flexible Request Mode
```
@workspace /ui-map {component-name} [options]
```

**Examples**:
```
@workspace /ui-map HostControlPanel
@workspace /ui-map SessionCanvas TranscriptCanvas
@workspace /ui-map #file:HostControlPanel.razor #file:SessionCanvas.razor
@workspace /ui-map HostControlPanel key=hcp output=detailed
```

---

## Parameters

### files *(auto-detected or explicit)*
Component files to analyze for clickable elements.

**Auto-detection from component name**:
- "HostControlPanel" → searches for `**/HostControlPanel*.razor`
- "SessionCanvas" → searches for `**/SessionCanvas*.razor`

**Direct file mode** (`#file:` prefix):
```
@workspace /ui-map #file:Pages/HostControlPanel.razor #file:Components/SessionCanvas.razor
```

**Path resolution**: Automatically searches common directories:
- `SPA/NoorCanvas/Pages/`
- `SPA/NoorCanvas/Components/`
- `SPA/NoorCanvas/Components/Host/`
- `SPA/NoorCanvas/Components/Development/`

### key *(optional, auto-detected)*
KDS key for organizing output (e.g., `hcp`, `canvas`, `debug-panel`)

**Auto-detection**:
- Component name → key mapping via dictionary lookup
- Falls back to kebab-case component name

### output *(optional, default=standard)*
Output detail level:
- `standard` - Element inventory table with IDs, types, events
- `detailed` - Adds implementation examples, Playwright selectors
- `summary` - Concise list for quick reference

### publish *(optional, default=true)*
Publish map to KDS handoffs directory for test generation reference

---

## Execution Steps

### Step 1: Validate & Resolve Files

**Algorithm**:
1. Parse user request for component names or #file: references
2. For each component name, search workspace for matching .razor files
3. If multiple matches found, prompt user to select specific file
4. Verify all files exist and are accessible
5. Report files to be analyzed

**Output** (≤10 bullets):
```
🔍 File Resolution

Files to Analyze: 3 components
  1. SPA/NoorCanvas/Pages/HostControlPanel.razor
  2. SPA/NoorCanvas/Components/Host/HostControlPanelSidebar.razor  
  3. SPA/NoorCanvas/Components/Host/HostControlPanelContent.razor

⚡ Proceed with Analysis?
  **A. YES** - Analyze all 3 components
  **B. Remove Files** - Exclude specific files from analysis
  **C. Add More Files** - Include additional components
```

---

### Step 2: Analyze Component Structure

**For each file:**

**2.1 Identify Component Hierarchy**
- Parse @code blocks for nested components
- Extract component references (e.g., `<UserRegistrationLink />`)
- Build dependency tree (parent → children)

**2.2 Detect Clickable Elements**

**Element types to identify:**
1. **Native Interactive Elements**:
   - `<button>` tags
   - `<a>` tags (links)
   - `<input type="button|submit|reset">`
   - `<select>` dropdowns
   - `<textarea>` (if has click handler)

2. **Event Handler Elements**:
   - Elements with `@onclick`
   - Elements with `@onmousedown`
   - Elements with `@onmouseup`
   - Elements with `@onkeydown` (keyboard interaction)

3. **ARIA Interactive Elements**:
   - `role="button"`
   - `role="link"`
   - `role="menuitem"`
   - `tabindex="0"` (keyboard focusable)

4. **CSS Interactive Elements**:
   - `cursor: pointer` in style attribute
   - CSS classes suggesting interaction (e.g., `clickable`, `interactive`, `btn`)

**2.3 Extract Element Properties**

For each detected element, capture:
- **Element Type**: button, div, span, a, input, etc.
- **Current ID**: Existing `id` attribute (if present)
- **Suggested ID**: Auto-generated using naming convention
- **Event Handlers**: List of event attributes (@onclick, etc.)
- **ARIA Attributes**: role, aria-pressed, aria-controls, etc.
- **Text Content**: Button text, label, or aria-label
- **Parent Component**: Which component file contains this element
- **Nested Level**: Depth in component hierarchy (for unique ID generation)

**2.4 Generate Unique IDs**

**Naming Convention**:
```
{component-prefix}-{element-type}-{specific-name}[-{index}]
```

**Component Prefixes** (auto-detected):
- HostControlPanel → `hcp-`
- HostControlPanelSidebar → `sidebar-`
- SessionCanvas → `canvas-`
- QuestionCard → `qa-`
- DebugPanel → `debug-`

**Index-Based IDs** (for dynamic elements):
- Question cards: `qa-card-{index}`
- Debug actions: `debug-action-{index}`
- List items: `{prefix}-item-{index}`

**Collision Detection**:
- Track all generated IDs
- Append numeric suffix if collision detected (e.g., `hcp-btn-2`)
- Report collisions in analysis output

---

### Step 3: Generate Element Map

**Create structured map document**:

**3.1 Header Section**
- Component name and file path
- Analysis timestamp
- Total clickable elements count
- KDS key association

**3.2 Element Inventory Table**

**Table Format**:
| Element | Current ID | Suggested ID | Type | Event | ARIA | Description |
|---------|-----------|--------------|------|-------|------|-------------|
| Button  | (none)    | `hcp-start-btn` | button | @onclick | - | Start Session button |
| Div     | (none)    | `qa-card-0` | div | @onclick | role="button" | Question card container |

**3.3 Implementation Guide** (if output=detailed)
- Code snippets showing how to add suggested IDs
- Playwright selector examples
- Accessibility testing patterns

**3.4 Component Hierarchy** (if nested components detected)
- Tree diagram showing parent-child relationships
- ID namespace per component

---

### Step 4: Publish to KDS (if publish=true)

**Create map file**:

**Path**: `.github/key-data-streams/{key}/handoffs/{component}-element-map.md`

**File Structure**:
````markdown
# {Component} - Clickable Elements Map

**Component**: {ComponentName}  
**File**: {FilePath}  
**Generated**: {Timestamp}  
**Key**: `{key}`

---

## Summary

**Total Elements**: {count}  
**Components Analyzed**: {list}  
**IDs Required**: {count needing IDs}  
**IDs Existing**: {count with IDs}

---

## Element Inventory

{Table from Step 3.2}

---

## Implementation Guide

{Examples from Step 3.3}

---

## Playwright Selectors

{Selector patterns for testing}

---

## Related Files

- **Component**: `{FilePath}`
- **Tests**: `.github/key-data-streams/{key}/tests/`
- **Test Prep**: Use `@workspace /test-prep #file:{Component}.razor`

---
````

**Also update**: `.github/key-data-streams/{key}/handoffs/element-maps-index.md`
- List of all element maps for this key
- Quick reference for test authors

---

### Step 5: Output Summary

**Format** (≤10 bullets, max 3 lines each, MANDATORY.md Rule #1):

```
✅ UI Map Complete | {count} components | Key: `{key}`

**Elements Found**: {total} interactive elements
  • Buttons: {count} | Links: {count} | Forms: {count} | ARIA: {count}
  • Existing IDs: {count} | Suggested: {count} | Collisions: {count}

**Maps Published**:
  • .github/key-data-streams/{key}/handoffs/{component1}-element-map.md
  • .github/key-data-streams/{key}/handoffs/{component2}-element-map.md

**Next Action**:

**A. IMPLEMENT IDS** - Apply suggested IDs from maps to Razor components
**B. GENERATE TESTS** - Create Playwright tests using element maps
**C. PREP LOGGING** - Add interaction markers via /test-prep
**D. REVIEW MAPS** - Open published files for implementation details
```

---

## Integration Points

### With KDS System

**Directory Structure**:
```
.github/key-data-streams/{key}/
├── handoffs/
│   ├── element-maps-index.md          ← Index of all maps
│   ├── HostControlPanel-element-map.md
│   ├── SessionCanvas-element-map.md
│   └── {Component}-element-map.md
└── tests/
    └── {component}-tests.spec.ts      ← Tests reference map
```

**KDS Rulebook Compliance**:
- **Rule 2**: Document First - Map created before ID implementation
- **Rule 2b**: Test Metadata - Map serves as test planning reference
- **Handoff Protocol**: Maps are handoff artifacts for test-generation

### With test-prep.prompt.md

**Workflow Integration**:
1. **ui-map** → Generate element inventory
2. **Implement IDs** → Apply suggested IDs to components
3. **test-prep** → Add interaction logging
4. **Manual Testing** → Capture user interactions
5. **test-generation** → Generate tests using element map + logs

**Map references prep markers**:
- Element map IDs should match test-prep marker format
- Enables correlation: Element ID → Prep Marker → Playwright Selector

### With test-generation.prompt.md

**Input Artifact**:
- test-generation can load element map as context
- Selectors in generated tests use map IDs
- Assertions reference ARIA attributes from map

**Selector Quality**:
- Map identifies best selector strategy per element
- Prefers data-testid > id > ARIA > CSS classes

---

## Algorithms

### Algorithm: Component File Discovery

**Input**: Component name (e.g., "HostControlPanel")  
**Output**: Resolved file path

**Steps**:
1. Search patterns:
   - `**/{ComponentName}.razor`
   - `**/{ComponentName}*.razor` (catches nested components)
2. Search directories (ordered):
   - `SPA/NoorCanvas/Pages/`
   - `SPA/NoorCanvas/Components/`
   - `SPA/NoorCanvas/Components/Host/`
   - `SPA/NoorCanvas/Components/Development/`
3. If multiple matches → Prompt user selection
4. If zero matches → Error: Component not found
5. Return resolved path(s)

---

### Algorithm: Clickable Element Detection

**Input**: Razor component file content  
**Output**: List of clickable elements with properties

**Steps**:
1. Parse file using regex patterns:
   - `<button[^>]*>` (button tags)
   - `@onclick="[^"]*"` (event handlers)
   - `role="(button|link|menuitem)"` (ARIA roles)
   - `cursor:\s*pointer` (CSS interactive)

2. For each match:
   - Extract element tag
   - Extract existing id attribute (if present)
   - Extract event handlers
   - Extract ARIA attributes
   - Extract text content (first 50 chars)
   - Determine parent component (file name)

3. Generate suggested ID:
   - Component prefix + element type + descriptor
   - Check for collisions, append index if needed
   - Validate ID format (simple, no special chars)

4. Categorize element:
   - Native interactive (button, a, input)
   - Event-driven (div/span with handlers)
   - ARIA-enabled (role attributes)
   - CSS interactive (cursor pointer)

5. Return structured element list

---

### Algorithm: Unique ID Generation

**Input**: Element properties, component name, existing IDs  
**Output**: Unique ID string

**Steps**:
1. Determine component prefix:
   - Map component name to prefix (e.g., HostControlPanel → hcp)
   - If no mapping, use kebab-case first word

2. Determine element descriptor:
   - Use existing id as base (if simple enough)
   - Extract from text content (e.g., "Start Session" → start-session)
   - Use element type + position (e.g., btn-1, btn-2)

3. Combine: `{prefix}-{descriptor}`
   - Example: `hcp-start-session-btn`

4. Check collision:
   - If ID exists in tracking set → Append numeric suffix
   - Example: `hcp-btn-2`

5. Validate format:
   - Alphanumeric + hyphens only
   - Max 50 characters
   - No consecutive hyphens

6. Add to tracking set
7. Return unique ID

---

## Error Handling

**Error**: Component file not found  
**Action**: Search common directories, suggest similar names

**Error**: No clickable elements detected  
**Action**: Report "No interactive elements found - component may be display-only"

**Error**: Too many ID collisions (>10 for same base)  
**Action**: Suggest renaming strategy, manual review

**Error**: File read permission denied  
**Action**: Check file locks, suggest closing IDE

---

## Success Criteria

**Analysis**:
- All specified files successfully parsed
- 100% of clickable elements detected
- Zero duplicate IDs in suggestions
- Clear component hierarchy identified

**Map Quality**:
- Table includes all required columns
- IDs follow naming convention
- Implementation guide includes code examples
- Playwright selectors are valid and testable

**KDS Integration**:
- Map published to correct handoffs directory
- Index file updated with new map
- Related test files cross-referenced

---

## Examples

### Example 1: Basic Usage

**Input**:
```
@workspace /ui-map HostControlPanel
```

**Output** (standard mode):
```
✅ UI Element Map Complete | Key: `hcp`

Components Analyzed: 1
  • HostControlPanel: 8 elements

Element Breakdown:
  • Buttons: 3
  • Interactive Divs: 2
  • ARIA Elements: 3

ID Status:
  • Existing IDs: 0
  • IDs Needed: 8
  • Suggested IDs: 8

📁 Map Published:
  .github/key-data-streams/hcp/handoffs/HostControlPanel-element-map.md

🎯 Next: Implement IDs or Generate Tests
```

---

### Example 2: Multiple Components with Detailed Output

**Input**:
```
@workspace /ui-map HostControlPanel SessionCanvas output=detailed
```

**Output** (detailed mode):
```
✅ UI Element Map Complete | Key: `hcp`

Components Analyzed: 2
  • HostControlPanel: 12 elements
  • SessionCanvas: 6 elements

[... standard summary ...]

📋 Implementation Examples:

HostControlPanel.razor - Start Session Button:
<button id="hcp-start-session-btn" @onclick="StartSession">
    Start Session
</button>

SessionCanvas.razor - Question FAB:
<div id="canvas-qa-fab" 
     role="button" 
     @onclick="OpenQuestionModal">
    <i class="fa-solid fa-question"></i>
</div>

🧪 Playwright Selectors:

// Direct ID selection
await page.locator('#hcp-start-session-btn').click();

// ARIA-enhanced selection
await page.locator('[role="button"]#canvas-qa-fab').click();

📁 Maps Published:
  .github/key-data-streams/hcp/handoffs/HostControlPanel-element-map.md
  .github/key-data-streams/hcp/handoffs/SessionCanvas-element-map.md
```

---

## See Also

- `.github/governance/kds-rulebook.md` - Rule #2b (Test Metadata)
- `.github/prompts/test-prep.prompt.md` - Interaction logging
- `.github/prompts/test-generation.prompt.md` - Test creation using maps
- `.github/prompts/shared/kds-handoff-protocol.md` - Handoff file standards

---

**Version**: 1.0.0  
**Created**: 2025-11-01  
**Maintainer**: KDS System

````