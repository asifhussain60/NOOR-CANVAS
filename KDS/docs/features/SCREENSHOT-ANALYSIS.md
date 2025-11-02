# Screenshot Analysis Feature

**Version:** 1.0.0  
**Added:** 2025-11-02  
**Status:** ✅ Active

---

## 🎯 Overview

KDS can now extract requirements, annotations, and design specifications from uploaded screenshots using GitHub Copilot's built-in Vision API.

**Zero dependencies** - Uses Copilot's native vision capabilities.

---

## 🚀 Quick Start

### Basic Usage
```markdown
#file:KDS/prompts/user/kds.md

Analyze this screenshot and extract requirements

[Attach image via Copilot chat]
```

### Auto-Detection
Simply attach an image - KDS automatically detects and analyzes it.

---

## 📸 Supported Image Types

### 1. UI Mockups & Wireframes
Extract component specifications, layout requirements, and design tokens.

**Example:**
```
User: [Uploads dashboard mockup]

KDS: Extracts:
- 4 metric cards (180px height, 16px padding)
- Line chart component (400px height)
- 3-column grid layout (2fr 2fr 1fr)
- Color palette (#3B82F6, #10B981, etc.)
```

### 2. Annotated Screenshots
Read handwritten or typed annotations, arrows, callouts.

**Example:**
```
User: [Uploads bug screenshot with annotations]

KDS: Extracts:
- "Text gets cut off here!" → Modal overflow bug
- "Add close button?" → Missing feature
- "Buttons should be centered" → Layout fix
```

### 3. Design Specifications
Extract color palettes, typography scales, spacing systems.

**Example:**
```
User: [Uploads style guide]

KDS: Generates CSS variables:
--primary-500: #3B82F6
--text-base: 16px
--space-4: 16px
```

### 4. Bug Reports
Parse visual bug reports with expected vs actual behavior.

**Example:**
```
User: [Uploads error state screenshot]

KDS: Identifies:
- Component: ConfirmationModal.razor
- Issue: Text overflow at 200px height
- Fix: Change to max-height: 80vh
```

---

## 🔄 Integration with KDS Workflow

### Auto-Chain to Planner
Complex requirements → Creates implementation plan

```
Screenshot (12 requirements) → work-planner.md → Multi-phase plan
```

### Auto-Chain to Executor
Simple changes → Direct implementation

```
Screenshot (1 change: button color) → code-executor.md → Applied
```

---

## 📤 Output Format

KDS provides structured output:

```markdown
✅ Screenshot analyzed

📸 Image Summary: [Brief description]

📋 Requirements Extracted:

**Functional:**
- [User interactions, data flows]

**Visual/Design:**
- [Colors, fonts, spacing, layout]

**Components Identified:**
1. **ComponentName** (Type)
   - Specs: [Detailed specifications]

**Annotations Found:**
1. [Location]: "[Text]" - [Category]

**Design Tokens:**
```css
--token-name: value;
```

**Next Steps:**
[Suggested actions]
```

---

## 🎓 Usage Examples

### Example 1: Mockup Analysis
```markdown
User: #file:KDS/prompts/user/kds.md
      Analyze this dashboard mockup

[Attaches high-fidelity design]

KDS: 
- Extracts 8 components
- Identifies 3-column grid
- Extracts color palette
- Provides CSS variables
- Suggests implementation plan

Next: I want to implement this layout
```

### Example 2: Bug Report
```markdown
User: #file:KDS/prompts/user/kds.md
      Extract bug details from this screenshot

[Attaches annotated error screenshot]

KDS:
- Identifies affected component
- Extracts error description
- Suggests specific fix
- Provides file path

Next: Fix the modal overflow issue
```

### Example 3: Design Tokens
```markdown
User: #file:KDS/prompts/user/kds.md
      Extract design tokens from this style guide

[Attaches design system reference]

KDS:
- Generates CSS variables for colors
- Extracts typography scale
- Provides spacing system
- Identifies border radius values

Next: Create CSS variables file with these tokens
```

---

## 🔍 What KDS Can Extract

### ✅ Can Extract
- Text content (typed or handwritten)
- UI component types
- Colors (hex, rgb if visible)
- Approximate spacing/dimensions
- Layout patterns
- Annotation text
- Design patterns
- User flows (from diagrams)

### ⚠️ Cannot Extract (Unless Annotated)
- Exact pixel measurements
- Backend/API logic
- Database schema
- Performance requirements
- Accessibility details (ARIA, etc.)
- Framework-specific code

---

## 💡 Best Practices

### For Best Results

**1. High-Resolution Images**
- PNG preferred
- Minimum 1200px width
- Clear, uncompressed

**2. Provide Context**
```markdown
#file:KDS/prompts/user/kds.md

This is a mockup for the new user dashboard. 
Analyze and extract component specifications.

[Attach image]
```

**3. Multiple Views**
Upload desktop + mobile views for responsive requirements.

**4. Clear Annotations**
- Use contrasting colors for annotations
- Write clearly if handwritten
- Use arrows to point to specific elements

### Common Patterns

**Pattern 1: Design → Implementation**
```
1. Upload mockup
2. KDS extracts requirements
3. "I want to implement this"
4. KDS creates plan
5. "continue" to implement
```

**Pattern 2: Bug → Fix**
```
1. Upload annotated bug screenshot
2. KDS identifies issue and fix
3. "Fix the [specific issue]"
4. KDS implements correction
```

**Pattern 3: Style Guide → CSS**
```
1. Upload design system
2. KDS extracts tokens
3. "Create variables file"
4. KDS generates CSS/SCSS
```

---

## 🧠 BRAIN Learning

KDS learns from screenshot analysis:
- Common annotation terminology
- Design pattern recognition
- Component naming conventions
- Successful extraction → implementation patterns

Logged events:
```json
{
  "event": "screenshot_analyzed",
  "image_type": "mockup",
  "requirements_extracted": 12,
  "routed_to": "work-planner",
  "success": true
}
```

---

## 🔧 Technical Details

### Agent
`KDS/prompts/internal/screenshot-analyzer.md`

### Intent Trigger
- "analyze screenshot"
- "extract from image"
- "what does mockup show"
- Image attachment detected

### Routing Priority
3rd priority (after CORRECT, RESUME)

### Dependencies
**Zero** - Uses GitHub Copilot's built-in Vision API

---

## 🚫 Limitations

### Current Limitations
- Cannot read extremely small text
- Color extraction approximate (if not annotated)
- Cannot measure exact pixels without annotations
- Works best with clear, high-contrast images

### Workarounds
- Annotate measurements on screenshot
- Specify colors in accompanying text
- Provide multiple angles/views
- Use design tool exports (Figma, Sketch) when possible

---

## 📊 Comparison

### Before Screenshot Analysis
```
User: I want a dashboard with metrics
KDS: Can you describe the layout?
User: 3 columns, cards on top, chart below
KDS: What colors?
User: Blue and green
KDS: What dimensions?
[Long back-and-forth]
```

### After Screenshot Analysis
```
User: [Uploads mockup]
      Analyze this

KDS: [Extracts everything]
     - Layout: 3 columns (2fr 2fr 1fr)
     - Colors: #3B82F6, #10B981
     - Components: 4 metrics cards, 1 chart
     Ready to implement?

User: Yes, continue

[Implementation starts]
```

**Time saved:** 5-10 minutes per feature request

---

## 🔗 Related Features

- **work-planner.md** - Creates plans from extracted requirements
- **code-executor.md** - Implements visual changes
- **test-generator.md** - Creates visual regression tests
- **brain-updater.md** - Learns from successful extractions

---

## ✨ Summary

**What:** Extract requirements from screenshots  
**How:** GitHub Copilot Vision API (built-in)  
**When:** Upload mockup, wireframe, bug report, design spec  
**Output:** Structured requirements + implementation plan  
**Dependencies:** None (zero install)

**Usage:**
```markdown
#file:KDS/prompts/user/kds.md
[Upload image + optional context]
```

That's it! 🎯
