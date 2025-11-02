# UI Mapping - Quick Reference

**Version**: 1.0.0 | **Created**: 2025-11-01

---

## 🎯 Purpose

Generate structured element maps for Razor components to streamline Playwright test creation.

---

## 🚀 Quick Start

### Interactive (Copilot)
```
@workspace /ui-map HostControlPanel
```

### Automated (PowerShell)
```powershell
.\.github\scripts\analyze-ui-elements.ps1 -ComponentPath "**/*HostControlPanel*.razor"
```

---

## 📋 Common Commands

### Single Component
```
@workspace /ui-map HostControlPanel
```

### Multiple Components
```
@workspace /ui-map HostControlPanel SessionCanvas TranscriptCanvas
```

### Detailed Output
```
@workspace /ui-map HostControlPanel output=detailed
```

### Direct File Reference
```
@workspace /ui-map #file:SPA/NoorCanvas/Pages/HostControlPanel.razor
```

---

## 📁 Output Location

Maps published to:
```
.github/key-data-streams/{key}/handoffs/
├── element-maps-index.md           # Index of all maps
└── {Component}-element-map.md      # Individual map
```

---

## 🔍 Element Detection

**Auto-detected**:
- `<button>` tags
- `@onclick`, `@onmousedown`, `@onkeydown` handlers
- `role="button"`, `role="link"` ARIA attributes
- `cursor: pointer` CSS styles

---

## 🏷️ ID Naming

**Pattern**:
```
{component-prefix}-{element-type}-{descriptor}[-{index}]
```

**Examples**:
- `hcp-start-session-btn` (HostControlPanel start button)
- `sidebar-canvas-select` (Sidebar canvas selector)
- `qa-card-0` (Question card index 0)

---

## 🔗 Workflow Integration

1. **Generate Map** → `@workspace /ui-map Component`
2. **Implement IDs** → Apply suggested IDs to component files
3. **Test Prep** → `@workspace /test-prep #file:Component.razor`
4. **Manual Testing** → Capture interactions
5. **Generate Tests** → `@workspace /test-generation ...`

---

## 📊 Map Structure

### Header
- Component name, file path, timestamp, key

### Element Inventory Table
| Element | Current ID | Suggested ID | Type | Event | Description |
|---------|-----------|--------------|------|-------|-------------|

### Implementation Guide
- Code examples for applying IDs
- Playwright selector patterns
- Accessibility attributes

---

## 🎯 When to Use

✅ **Before** writing Playwright tests  
✅ **For** complex multi-component UIs  
✅ **During** refactoring  
✅ **Before** test-prep (plan logging points)

❌ Simple single-component pages  
❌ Display-only components  
❌ Third-party components

---

## 🔧 PowerShell Options

```powershell
analyze-ui-elements.ps1 `
    -ComponentPath "Path/To/Component.razor" `
    -Key "hcp" `
    -OutputMode "detailed" `
    -Publish $true
```

**Parameters**:
- `-ComponentPath` - File path or glob pattern
- `-Key` - KDS key (auto-detected if omitted)
- `-OutputMode` - standard | detailed | summary
- `-Publish` - Publish to KDS (default: true)

---

## 📚 See Also

- **Full Guide**: `.github/key-data-streams/kds/handoffs/UI-MAPPING-SYSTEM.md`
- **Prompt**: `.github/prompts/ui-map.prompt.md`
- **Script**: `.github/scripts/analyze-ui-elements.ps1`
- **Test Prep**: `.github/prompts/test-prep.prompt.md`

---

**Quick Help**: `@workspace /ui-map --help`
