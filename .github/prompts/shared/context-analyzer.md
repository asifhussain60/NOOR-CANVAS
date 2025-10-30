# Context Analyzer Algorithm

**Purpose:** Extract all contextual information from user request

**Used by:** route.prompt.md (Step 1)

---

## Algorithm

**Input:** user_request (string), attachments[] (files/images/videos)

**Output:** context_package { text, files, images, videos, errors, urls, work_type }

---

## Analysis Categories

**1. Text Context**
- Extract technical terms
- Identify component/file references
- Detect error keywords
- Find action verbs

**2. File Uploads**
- Code files (.cs, .razor, .js, .css)
- Documents (.md, .txt, .pdf)
- Configuration files (.json, .xml)
- Extract file paths, class names, methods

**3. Image Uploads**
- UI mockups (design intent)
- Screenshots (current state, bugs)
- Diagrams (architecture, flow)
- Error messages (visual errors)

**4. Video Uploads**
- User flows (step-by-step actions)
- Bug demonstrations (reproduce steps)
- Feature walkthroughs (expected behavior)

**5. Error Messages**
- Stack traces
- Exception types
- Line numbers
- Error codes

**6. URLs and Paths**
- File paths mentioned
- Repository links
- Documentation references
- External resources

---

## Work Type Classification

**Feature Request:**
- Keywords: add, create, new, implement
- Has mockup/design
- Describes user benefit

**Bug Fix:**
- Keywords: fix, broken, not working, error
- Has screenshot/video
- Stack trace present

**Refactor:**
- Keywords: refactor, restructure, clean, optimize
- Code quality focus
- Architecture change

**Investigation:**
- Keywords: why, how, investigate, debug
- Question format
- Seeking understanding

---

## Output Format

```
context_package:
  text_keywords: [share, button, canvas, missing]
  files: [SessionCanvas.razor, AssetSidebar.razor]
  images: [mockup-share-button.png]
  videos: []
  errors: [NullReferenceException at line 245]
  urls: [SPA/NoorCanvas/Pages/]
  work_type: bug-fix
  complexity_hints: [ui, component, signalr]
```

---

## Context Prioritization

**High Priority:**
- Explicit file references
- Error stack traces
- UI mockups/screenshots
- User flow videos

**Medium Priority:**
- Technical terms
- Component names
- Architecture mentions
- Related documentation

**Low Priority:**
- General keywords
- Vague descriptions
- Opinion statements

---

## See Also

- `../route.prompt.md` - Step 1 implementation
- `work-classifier.md` - Work type usage
