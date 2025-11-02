# UI Mapping System - Complete Integration Guide

**Created**: 2025-11-01  
**System**: KDS (Key Data Streams)  
**Purpose**: Automated UI element mapping for Playwright test generation

---

## Overview

The UI Mapping System provides automated analysis of Razor components to create structured element inventories for test generation. It integrates seamlessly with the existing KDS workflow and test preparation system.

### Key Benefits

✅ **Automated Element Discovery** - Scans Razor files for all clickable elements  
✅ **Consistent ID Naming** - Enforces hierarchical naming convention  
✅ **Test-Ready Output** - Maps include Playwright selectors and examples  
✅ **KDS Integration** - Published to handoffs directory for test-generation reference  
✅ **Collision Detection** - Prevents duplicate IDs across components  

---

## Architecture

### Components

```
UI Mapping System
├── ui-map.prompt.md          # Copilot prompt for interactive mapping
├── analyze-ui-elements.ps1   # PowerShell automation script
├── {key}/handoffs/
│   ├── element-maps-index.md        # Index of all maps
│   └── {Component}-element-map.md   # Individual element maps
└── Integration with:
    ├── test-prep.prompt.md          # Interaction logging
    └── test-generation.prompt.md    # Test creation
```

### Workflow

```
┌─────────────────┐
│   UI Mapping    │  Step 1: Analyze component structure
│  (ui-map.prompt)│  - Detect clickable elements
└────────┬────────┘  - Generate unique IDs
         │           - Create element inventory
         ▼
┌─────────────────┐
│  Element Map    │  Step 2: Publish to KDS handoffs
│   Published     │  - Structured markdown table
└────────┬────────┘  - Implementation examples
         │           - Playwright selectors
         ▼
┌─────────────────┐
│   Implement     │  Step 3: Apply IDs to components
│      IDs        │  - Manual or automated update
└────────┬────────┘  - Verify no duplicates
         │
         ▼
┌─────────────────┐
│   Test Prep     │  Step 4: Add interaction logging
│ (test-prep)     │  - Inject markers
└────────┬────────┘  - Enable dual-stream logging
         │
         ▼
┌─────────────────┐
│ Test Generation │  Step 5: Create Playwright tests
│(test-generation)│  - Use element map for selectors
└─────────────────┘  - Reference interaction logs
```

---

## Usage

### Method 1: Interactive (Copilot)

```
@workspace /ui-map HostControlPanel
```

**Features**:
- Natural language component selection
- Auto-detects file locations
- Publishes to KDS handoffs
- Provides next step options

**Output Example**:
```
✅ UI Element Map Complete | Key: `hcp`

Components Analyzed: 1
  • HostControlPanel: 8 elements

📁 Map Published:
  .github/key-data-streams/hcp/handoffs/HostControlPanel-element-map.md

🎯 Next: Implement IDs or Generate Tests
```

---

### Method 2: Automated (PowerShell)

```powershell
.\.github\scripts\analyze-ui-elements.ps1 `
    -ComponentPath "SPA/NoorCanvas/Pages/HostControlPanel.razor" `
    -Key "hcp" `
    -OutputMode "detailed"
```

**Features**:
- Batch processing
- CI/CD integration
- Scriptable analysis
- Direct file output

**Parameters**:
- `-ComponentPath` - File path(s) or glob patterns
- `-Key` - KDS key (auto-detected if omitted)
- `-OutputMode` - standard | detailed | summary
- `-Publish` - Publish to KDS (default: true)

---

## Element Detection

### Supported Element Types

#### 1. Native Interactive Elements
- `<button>` tags
- `<a>` links with href
- `<input type="button|submit|reset">`
- `<select>` dropdowns

#### 2. Event-Driven Elements
- Elements with `@onclick`
- Elements with `@onmousedown`
- Elements with `@onkeydown`
- Elements with `@onmouseup`

#### 3. ARIA Interactive Elements
- `role="button"`
- `role="link"`
- `role="menuitem"`
- `tabindex="0"` (keyboard focusable)

#### 4. CSS Interactive Elements
- `cursor: pointer` in style attribute
- CSS classes: `.clickable`, `.btn`, `.interactive`

---

## ID Naming Convention

### Pattern

```
{component-prefix}-{element-type}-{descriptor}[-{index}]
```

### Component Prefixes

| Component | Prefix | Example ID |
|-----------|--------|------------|
| HostControlPanel | `hcp-` | `hcp-start-session-btn` |
| HostControlPanelSidebar | `sidebar-` | `sidebar-canvas-select` |
| SessionCanvas | `canvas-` | `canvas-qa-fab` |
| QuestionCard | `qa-` | `qa-card-0` |
| DebugPanel | `debug-` | `debug-toggle-btn` |

### Descriptor Generation

**Priority**:
1. Existing simple ID (if present)
2. Button text (e.g., "Start Session" → `start-session`)
3. ARIA label
4. Element position (e.g., `btn-1`, `btn-2`)

**Rules**:
- Lowercase only
- Hyphens for word separation
- Max 50 characters
- Alphanumeric + hyphens only
- No consecutive hyphens

### Collision Resolution

If generated ID already exists:
1. Append numeric suffix: `-1`, `-2`, etc.
2. Example: `hcp-btn-1`, `hcp-btn-2`
3. Report collision in analysis output

---

## Element Map Structure

### Header Section

```markdown
# {Component} - Clickable Elements Map

**Component**: HostControlPanel  
**File**: SPA/NoorCanvas/Pages/HostControlPanel.razor  
**Generated**: 2025-11-01T14:30:22.123Z  
**Key**: `hcp`
```

### Summary

```markdown
## Summary

**Total Elements**: 8  
**Components Analyzed**: 1  
**IDs Required**: 8  
**IDs Existing**: 0
```

### Element Inventory Table

| Element | Current ID | Suggested ID | Type | Event | ARIA | Description |
|---------|-----------|--------------|------|-------|------|-------------|
| button  | (none)    | `hcp-start-btn` | button | @onclick | - | Start Session button |
| div     | (none)    | `qa-card-0` | div | @onclick | role="button" | Question card container |

### Implementation Guide

```razor
<!-- Example: Start Session Button -->
<button id="hcp-start-session-btn" @onclick="StartSession">
    Start Session
</button>
```

### Playwright Selectors

```typescript
// Direct ID selection
await page.locator('#hcp-start-session-btn').click();

// ARIA-enhanced selection
await page.locator('[role="button"]#canvas-qa-fab').click();
```

---

## Integration Points

### With test-prep.prompt.md

**Workflow**:
1. Generate element map (ui-map)
2. Implement IDs in components
3. Run test-prep to add interaction logging
4. Perform manual testing
5. Generate tests from logs

**ID Correlation**:
- Element map IDs match test-prep marker format
- Enables: Element ID → Prep Marker → Playwright Selector

### With test-generation.prompt.md

**Input Artifact**:
- test-generation loads element map as context
- Selectors in generated tests use map IDs
- Assertions reference ARIA attributes from map

**Selector Priority**:
1. `data-testid` (if present)
2. `id` attribute from element map
3. ARIA attributes (`role`, `aria-label`)
4. CSS classes (fallback)

### With KDS Handoff Protocol

**Directory Structure**:
```
.github/key-data-streams/{key}/
├── handoffs/
│   ├── element-maps-index.md          ← Index of all maps
│   ├── HostControlPanel-element-map.md
│   ├── SessionCanvas-element-map.md
│   └── phase-{N}-test.json            ← Test handoffs reference maps
└── tests/
    └── {component}-tests.spec.ts      ← Tests use map selectors
```

**Handoff JSON Enhancement**:
```json
{
  "key": "hcp",
  "phase": 1,
  "task": "Generate Playwright test for Start Session flow",
  "elementMap": "handoffs/HostControlPanel-element-map.md",
  "files": ["SPA/NoorCanvas/Pages/HostControlPanel.razor"],
  "acceptanceCriteria": [
    "Test uses IDs from element map",
    "All interactive elements have stable selectors"
  ]
}
```

---

## Best Practices

### When to Use UI Mapping

✅ **Before writing Playwright tests** - Ensures stable selectors  
✅ **For complex multi-component UIs** - Maintains ID consistency  
✅ **During refactoring** - Identifies ID changes needed  
✅ **Before test-prep** - Plan interaction logging points  

### When NOT to Use

❌ Simple single-component pages (overkill)  
❌ Display-only components (no interactive elements)  
❌ Third-party components (can't modify IDs)  

### Maintenance

**Update maps when**:
1. New interactive elements added to components
2. Component hierarchy changes
3. Event handlers modified
4. ARIA attributes updated

**Versioning**:
- Maps are timestamped
- Keep old maps in `_ARCHIVE/` if major refactor
- Update element-maps-index.md with version history

---

## Examples

### Example 1: Host Control Panel

**Command**:
```
@workspace /ui-map HostControlPanel
```

**Generated Map** (excerpt):
```markdown
# HostControlPanel - Clickable Elements Map

## Element Inventory

| Element | Current ID | Suggested ID | Type | Event |
|---------|-----------|--------------|------|-------|
| button  | (none) | `hcp-start-session-btn` | button | @onclick |
| button  | (none) | `hcp-end-session-btn` | button | @onclick |
| button  | (none) | `hcp-qa-toggle-btn` | button | @onclick |
| div     | (none) | `hcp-qa-panel` | div | - |
```

**Usage in Test**:
```typescript
test('Start session flow', async ({ page }) => {
  await page.goto('/host');
  await page.locator('#hcp-start-session-btn').click();
  await expect(page.locator('#hcp-qa-panel')).toBeVisible();
});
```

---

### Example 2: Multi-Component Analysis

**Command**:
```
@workspace /ui-map HostControlPanel SessionCanvas TranscriptCanvas output=detailed
```

**Result**:
- 3 element maps generated
- Index updated with all maps
- Cross-component ID collision check
- Hierarchical ID namespacing

**Namespacing**:
```
HostControlPanel  → hcp-*
  ├─ Sidebar      → sidebar-*
  ├─ Content      → content-*
  └─ Header       → header-*
SessionCanvas     → canvas-*
TranscriptCanvas  → tcanvas-*
```

---

## Troubleshooting

### Issue: No elements detected

**Cause**: Component is display-only or uses dynamic rendering  
**Solution**: 
- Verify component has interactive elements
- Check for elements rendered conditionally
- May need manual ID assignment for dynamic elements

### Issue: Too many ID collisions

**Cause**: Poor element descriptor generation  
**Solution**:
- Manually review suggested IDs
- Add unique descriptors in element text
- Use ARIA labels for better descriptor extraction

### Issue: Map out of date after component changes

**Cause**: Component modified but map not regenerated  
**Solution**:
- Re-run ui-map analysis
- Archive old map to `_ARCHIVE/`
- Update element-maps-index.md with new version

---

## Future Enhancements

### Planned Features

1. **Visual Diffing** - Compare maps before/after component changes
2. **Auto-Implementation** - Apply suggested IDs automatically
3. **Test Coverage Analysis** - Show which elements lack tests
4. **ARIA Compliance Checking** - Validate accessibility attributes
5. **Cross-Key Analysis** - Detect ID collisions across keys

### Integration Roadmap

- [ ] Visual Studio Code extension for inline mapping
- [ ] GitHub Action for CI/CD element analysis
- [ ] Playwright test recorder integration (use map IDs)
- [ ] Percy visual regression with element highlights

---

## See Also

- **Prompts**:
  - `.github/prompts/ui-map.prompt.md` - Interactive mapping
  - `.github/prompts/test-prep.prompt.md` - Interaction logging
  - `.github/prompts/test-generation.prompt.md` - Test creation

- **Scripts**:
  - `.github/scripts/analyze-ui-elements.ps1` - Automated analysis

- **Governance**:
  - `.github/governance/kds-rulebook.md` - Rule #2b (Test Metadata)
  - `.github/prompts/shared/kds-handoff-protocol.md` - Handoff standards

---

**Version**: 1.0.0  
**Status**: Production  
**Maintainer**: KDS System
