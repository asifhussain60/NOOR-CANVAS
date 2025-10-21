# Image Analysis Protocol

**Version**: 1.0.0  
**Last Updated**: 2025-10-21  
**Purpose**: Standardize AI-powered image analysis for requirement extraction and visual specification capture

---

## Overview

This protocol defines how agents should analyze images (screenshots, mockups, design comps, error screenshots) to extract requirements, visual specifications, and diagnostic information BEFORE implementation planning begins.

**Key Principle**: Requirements extraction is a PLANNING concern, not an execution concern. Images should be analyzed during planning to generate proper requirements that users can approve.

---

## When to Use

### Trigger Conditions
- User provides images in request (inline or file paths)
- `annotate` parameter specified with comma-delimited filenames
- User request mentions visual changes requiring specification
- Need to extract design requirements from mockups
- Need to document current state for comparison

### Use Cases
1. **Annotated Mockups** → Extract requirements from callouts, arrows, annotations
2. **Design Comps** → Extract visual specifications (colors, spacing, layout)
3. **Plain Screenshots** → Document current state for reference
4. **Error Screenshots** → Extract diagnostic information (stack traces, console errors)

---

## Image Classification

### 1. Annotated Mockups (Highest Priority)

**Characteristics**:
- Contains text callouts, arrows, notes
- Has highlighted areas (boxes, circles, underlining)
- Shows desired changes or additions
- Includes design annotations

**Analysis Focus**:
- Extract all text annotations and callout content
- Identify arrows and flow indicators
- Document highlighted areas and change markers
- Capture color specifications from annotations
- Extract dimension annotations (spacing, sizing)

**Output**: Structured requirements (visual + functional)

### 2. Design Comps (Visual Specifications)

**Characteristics**:
- Professional design mockups
- Shows desired visual state
- May include color swatches, typography specs
- Precise layout and spacing

**Analysis Focus**:
- Extract exact color values using vision analysis
- Document spacing, typography, layout specifications
- Identify reusable design patterns
- Note responsive breakpoints

**Output**: Visual acceptance criteria for implementation

### 3. Plain Screenshots (Reference)

**Characteristics**:
- Captures current application state
- No annotations or modifications
- Used for "before" comparison

**Analysis Focus**:
- Document current state
- Identify elements that need change
- Establish baseline for Percy tests

**Output**: Reference documentation

### 4. Error Screenshots (Diagnostics)

**Characteristics**:
- Shows errors, warnings, or broken functionality
- May include console output, stack traces
- Browser developer tools visible

**Analysis Focus**:
- Extract stack traces and error messages
- Identify error location (file, line number)
- Extract console errors and warnings
- Document browser and environment info

**Output**: Diagnostic context for debugging

---

## Analysis Process

### Step 1: Detection

**Scan user request for image references:**
```
Inline images: (detected automatically in chat)
File paths: "mockup.png", "design.jpg", "error-screenshot.png"
annotate parameter: "mockup-1.png, mockup-2.png, error.png"
```

**Classify each image** using characteristics above

### Step 2: Vision Analysis

**For Annotated Mockups (highest priority):**

1. **Use vision analysis to extract:**
   - Text annotations and callout content
   - Arrows and flow indicators (direction, source, target)
   - Highlighted areas and change markers
   - Color specifications from annotations (hex codes, RGB)
   - Dimension annotations (width, height, spacing, padding)

2. **Pay special attention to:**
   - Text callouts and arrows
   - Highlighted areas (boxes, circles, underlining)
   - Color swatches and specifications
   - Dimension annotations (spacing, sizing)
   - Flow indicators (numbered steps, arrows, sequence)

3. **Extraction format:**
   - Convert visual annotations to plain text requirements
   - Preserve exact color codes, dimensions, text content
   - Maintain logical grouping (visual vs functional requirements)
   - Separate "must have" from "nice to have" based on annotation emphasis

### Step 3: Structured Conversion

**Convert visual findings to structured requirements:**

```markdown
## Requirements Extracted from Images

### Image 1: {filename}
**Type:** Annotated Mockup

**Visual Requirements:**
- Element X: Change color to #FF5733 (from annotation)
- Element Y: Add "Submit" button (from callout)
- Layout: Center-align question cards (from arrow indicator)
- Spacing: 16px padding between cards (from dimension annotation)

**Functional Requirements:**
- Clicking "Submit" should validate form (from annotation)
- Display confirmation dialog before submit (from note)
- Handle validation errors inline (from error callout)

**Technical Constraints:**
- Must work on mobile viewport (from viewport annotation)
- Animation duration: 300ms fade-in (from timing note)
- Support IE11 fallback (from compatibility note)
```

### Step 4: Incorporation into Plan

**Add extracted requirements to plan sections:**

1. **Goals and Success Criteria**: Include functional requirements
2. **Phase Deliverables**: Include visual specifications as acceptance criteria
3. **Test Plan**: Generate Percy visual regression tests for visual changes
4. **Dependencies and References**: Link to source images
5. **Technical Constraints**: Document any technical limitations from annotations

### Step 5: User Confirmation

**Present findings to user for approval:**

```markdown
📸 Image Analysis Complete

Analyzed {N} image(s):
- mockup-annotated.png: Extracted 5 visual requirements, 3 functional requirements
- error-screenshot.png: Identified console error in SessionCanvas.razor line 142
- design-comp.png: Extracted color palette and layout specifications

Extracted Requirements Summary:
1. Change submit button color to #FF5733
2. Add confirmation dialog before form submission
3. Center-align question cards in mobile view
4. Fix console error: "Cannot read property 'userId'"
5. Add 300ms fade-in animation

These requirements will be incorporated into the implementation plan.

Are these interpretations correct? (yes to proceed, or provide corrections)
```

**If user provides corrections:**
- Update requirements based on feedback
- Re-confirm updated understanding
- Proceed only after user approval

---

## Vision Tool Instructions

### For Images in Chat
- Use built-in vision capabilities
- Analyze images directly using vision model
- Extract text, annotations, colors, layout specifications

### For Image File Paths
- Read image files from disk using appropriate tools
- Use vision analysis to extract requirements
- Document findings in structured format

### Extraction Priorities

**For Annotated Mockups:**
1. Text callouts and arrows (highest priority)
2. Highlighted areas (boxes, circles, underlining)
3. Color swatches and specifications
4. Dimension annotations (spacing, sizing)
5. Flow indicators (numbered steps, arrows)

**For Design Comps:**
1. Color palette (hex codes)
2. Typography (fonts, sizes, weights)
3. Spacing and layout (padding, margins, grid)
4. Component hierarchy
5. Responsive breakpoints

**For Error Screenshots:**
1. Error messages (exact text)
2. Stack traces (file, line, function)
3. Console output (errors, warnings)
4. Browser environment (version, OS)
5. Network errors (if visible)

---

## Output Format

### Visual Requirements
```markdown
**Visual Requirements:**
- Color: Submit button → #FF5733 (currently #3357FF)
- Layout: Center-align question cards (currently left-aligned)
- Spacing: 16px padding between cards (currently 8px)
- Animation: 300ms fade-in on card render (currently instant)
- Typography: Card title → 18px bold (currently 16px regular)
```

### Functional Requirements
```markdown
**Functional Requirements:**
- Validation: Submit button validates form before submission
- Confirmation: Display confirmation dialog on submit ("Are you sure?")
- Error Handling: Show inline validation errors (red text below input)
- State Management: Disable submit button during processing
```

### Technical Constraints
```markdown
**Technical Constraints:**
- Mobile: Must work on viewport width ≥ 320px
- Animation: Use CSS transitions (not JavaScript)
- Compatibility: Support IE11 (no CSS Grid)
- Performance: Animation duration ≤ 300ms
```

### Percy Test Specifications
```markdown
**Percy Visual Regression Tests:**
- Scenario 1: Submit button color change (#FF5733)
  - Baseline: Current state
  - Expected: New color applied
  - Viewports: mobile, tablet, desktop
  
- Scenario 2: Card layout centering
  - Baseline: Left-aligned cards
  - Expected: Center-aligned cards
  - Viewports: mobile, tablet, desktop
  
- Scenario 3: Fade-in animation (requires video)
  - Baseline: Instant render
  - Expected: 300ms fade-in
  - Capture: Animation frames
```

---

## Integration with Planning Workflow

### feature.prompt.md Step 0.6

**When to Invoke**: During Step 0.6 (after technology stack detection, before interactive refinement)

**Workflow**:
1. Detect images in user request or `annotate` parameter
2. Classify image types (annotated mockup, design comp, screenshot, error)
3. Analyze using vision API
4. Extract structured requirements
5. Present findings to user for confirmation
6. Incorporate approved requirements into plan

**Benefits**:
- ✅ Requirements gathered BEFORE planning (proper sequence)
- ✅ User approves interpreted requirements during plan approval phase
- ✅ Vision analysis informs architecture decisions (UI vs backend changes)
- ✅ Percy test specifications auto-generated from visual requirements
- ✅ Clear separation of planning vs execution concerns

### task.prompt.md Integration (Deprecated)

**Note**: Image analysis was previously in task.prompt.md's `annotate` parameter but has been moved to feature.prompt.md.

**Why deprecated in task.prompt.md:**
- Image analysis is a requirement gathering activity (planning concern, not execution)
- Requirements should be extracted BEFORE implementation begins
- User should approve interpreted requirements during plan approval phase

**If user provides images during task execution:**
Suggest running plan prompt first:
```
⚠️ Images detected in request

Image analysis should be done during planning phase for proper requirement extraction.

Recommended approach:
@workspace /feature key={key} user_request="{requirements}" annotate="{image-files}"

This will:
- Extract requirements from images using vision analysis
- Incorporate into comprehensive plan
- Generate proper test specifications
- Allow you to approve interpreted requirements

Proceed with task without image analysis? (not recommended for complex visual changes)
```

---

## Best Practices

### Do's ✅
- Always classify images before analysis
- Extract exact values (colors, dimensions) when available
- Separate visual from functional requirements
- Confirm understanding with user before incorporating into plan
- Generate Percy test specifications for visual changes
- Document source images in plan references

### Don'ts ❌
- Don't analyze images during execution phase (belongs in planning)
- Don't assume requirements without user confirmation
- Don't skip annotation extraction (highest value)
- Don't ignore technical constraints in annotations
- Don't mix planning and execution concerns
- Don't proceed without user approval of extracted requirements

---

## Example Analysis

### Input Image: "mockup-annotated.png"

**Visual Annotations Found**:
- Callout 1: "Change button color to #FF5733"
- Callout 2: "Add confirmation dialog"
- Arrow: Points from submit button to dialog mockup
- Dimension: "16px padding" annotation between cards
- Highlight: Red box around error message area

**Extracted Requirements**:

```markdown
## Visual Requirements
- Submit button: Change background color from #3357FF to #FF5733
- Card spacing: Increase padding from 8px to 16px
- Error messages: Red background (#FFEBEE), dark red text (#C62828)

## Functional Requirements
- Submit button: Show confirmation dialog before submission
- Confirmation dialog: "Are you sure you want to submit?" with Yes/No buttons
- Error handling: Display inline validation errors in red message area

## Percy Test Specifications
- Test 1: Button color change (3 viewports)
- Test 2: Card spacing increase (3 viewports)
- Test 3: Error message styling (1 viewport)
- Test 4: Confirmation dialog appearance (3 viewports)
```

**User Confirmation**:
```
Are these interpretations correct?
- Button color: #FF5733 ✓
- Confirmation dialog: Yes/No buttons ✓
- Error styling: Red background ✓
```

**Incorporation**: Requirements added to plan's Goals, Phase Deliverables, and Test Plan sections.

---

## Related Files

- **feature.prompt.md** - Invokes this protocol in Step 0.6
- **task.prompt.md** - Deprecated `annotate` parameter (now suggests using feature.prompt.md)
- **test-generation.prompt.md** - Consumes Percy specifications generated by this protocol
- **PlaywrightQuickRef.md** - Percy visual testing patterns and best practices

---

## Changelog

### v1.0.0 (2025-10-21)
- Initial creation
- Extracted from feature.prompt.md Step 0.6
- Documented image classification taxonomy
- Added vision analysis workflow
- Added structured extraction formats
- Added Percy test specification generation
- Added integration guidance for planning workflow
- Part of cohesion review action item 03 (Extract plan shared modules)


