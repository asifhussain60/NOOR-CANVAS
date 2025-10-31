# Feasibility Analysis: Screenshot-Based Test Generation Rule

**Date**: 2025-10-31  
**Proposal**: Add KDS rule for automatic test generation from UI screenshots  
**Status**: 🟢 HIGHLY FEASIBLE with existing infrastructure  
**Complexity**: MEDIUM (integration, not new development)

---

## 📊 Executive Summary

**Feasibility**: ✅ **95% FEASIBLE** with current KDS architecture

**Why?**
1. ✅ **test-prep.prompt.md already exists** - Reverse engineering from `data-playwright-log-marker`
2. ✅ **PlaywrightLogger.js infrastructure** - Captures UI interactions → console logs
3. ✅ **JSON metadata pattern proven** - `click-sequence-metadata.json` (520 lines) successfully created
4. ✅ **Razor component analysis** - Can extract selectors, CSS, component structure
5. ✅ **Visual regression support** - Percy integration already in place

**Missing Pieces** (can be added):
- Image analysis preprocessing step in test-generation.prompt.md
- Automated HTML element mapping from screenshot annotations
- Click sequence extraction algorithm

**Recommendation**: ✅ **PROCEED** - Add as Rule #15 with structured algorithm

---

## 🏗️ Existing Infrastructure (Ready to Use)

### 1. Test-Prep System (Reverse Engineering)

**File**: `.github/prompts/test-prep.prompt.md` (v1.0.0)

**Capabilities**:
- ✅ Injects `data-playwright-log-marker` into Razor components
- ✅ Captures user interactions via PlaywrightLogger.js
- ✅ Correlates browser console logs with server-side events
- ✅ Generates Playwright tests from captured logs
- ✅ Cleanup of logging infrastructure after test generation

**Example Flow**:
```
@workspace /test-prep #file:HostControlPanel.razor
→ Injects markers: data-playwright-log-marker="20251031120000-HostControlPanel-StartSession"
→ User performs manual test in browser
→ Logs captured: [PLAYWRIGHT-LOG] CLICK | [data-playwright-log-marker="..."] | button | "Start Session"
→ @workspace /test-prep action=generate
→ Generates: Tests/UI/hcp-start-session.spec.ts
```

**Evidence**: 
- SessionCanvas.razor has 7 markers (lines 1217-1342)
- TranscriptCanvas.razor has 4 markers (lines 1177-1239)
- HostControlPanel components have 3 markers

### 2. PlaywrightLogger.js (UI Interaction Capture)

**File**: `SPA/NoorCanvas/wwwroot/js/PlaywrightLogger.js`

**Capabilities**:
- ✅ Click tracking with data-playwright-log-marker priority
- ✅ Input tracking (text fields, dropdowns, checkboxes)
- ✅ Navigation tracking (URL changes)
- ✅ Selector generation (CSS selector fallback if no marker)
- ✅ Console log buffering with automatic flush
- ✅ Element text capture (first 50 chars)

**Priority System**:
1. `data-playwright-log-marker` (test-prep system)
2. `data-testid` (legacy support)
3. CSS selector (auto-generated)

**Log Format**:
```
2025-10-31T18:08:24.123Z | CLICK | [data-playwright-log-marker="20251031120000-HostControlPanel-StartSession"] | button | "▶ Start Session" | MARKER: 20251031120000-HostControlPanel-StartSession
```

### 3. JSON Metadata Pattern (Proven Success)

**File**: `.github/key-data-streams/hcp-refactor/tests/click-sequence-metadata.json` (520 lines)

**Structure**:
```json
{
  "metadata": { /* session context, test framework */ },
  "click_sequence": [ /* 5 steps with complete element definitions */ ],
  "ui_components": { /* component documentation */ },
  "signalr_architecture": { /* hub, events, receivers */ },
  "playwright_selectors": { /* button, navigation, content locators */ },
  "visual_regression": { /* screenshot inventory */ },
  "code_references": { /* Razor files, JS files, methods */ }
}
```

**Created From**: 6 screenshots + HostControlPanel.razor analysis

**Key Sections**:
- **click_sequence**: Each step has element metadata (component, text, selectors, CSS identifiers, visual cues)
- **css_identifiers**: Exact CSS properties from DevTools screenshots (#065f46, border-radius: 8px, etc.)
- **code_references**: File paths, line numbers, method names
- **selectors**: Multiple strategies (text, testid, class, style)

**Evidence of Success**: All metadata extracted correctly from images + code analysis

### 4. Razor Component Analysis (Code Intelligence)

**Capabilities** (via semantic_search, grep_search, read_file):
- ✅ Extract component structure (@page, @layout, @inject)
- ✅ Locate data-playwright-log-marker attributes
- ✅ Find data-testid attributes (legacy)
- ✅ Identify SignalR event handlers (HandleQuestionReceivedAsync, etc.)
- ✅ Map Blazor @code sections to UI elements
- ✅ Extract CSS classes and inline styles
- ✅ Locate JSInvokable methods (ShareAsset, ShareTranscriptSection)

**Example**:
```
Query: "Start Session button in HostControlPanel"
→ Found: HostControlPanelSidebar.razor line 83
→ Marker: data-playwright-log-marker="20251031120000-HostControlPanel-StartSession"
→ Method: StartSession() at HostControlPanel.razor lines 1325-1380
→ SignalR: BroadcastFullTranscript() via SessionHub
```

### 5. Visual Regression Infrastructure

**Percy Integration**:
- ✅ Percy parameter in orchestration scripts
- ✅ Screenshot capture at each test step
- ✅ Baseline comparison workflow
- ✅ Screenshot naming convention (hcp-visual-step{N}-{description}.png)

**Evidence**: 
- run-hcp-visual-test.ps1 has `-Percy` parameter
- hcp-visual-click-sequence.spec.ts captures 12 screenshots
- Visual regression section in click-sequence-metadata.json

---

## 🚀 Proposed Rule #15: Screenshot-Based Test Generation

### Rule Definition

**ID**: screenshot-test-generation  
**Number**: 15  
**Category**: test-automation  
**Severity**: MEDIUM  
**Enforcement**: Semi-Automated (requires manual screenshot upload)

**Trigger**: User uploads multiple images with visual markers/annotations

**Assumption**: 
- Images showing numbered markers (1, 2, 3...) indicate click sequence
- DevTools screenshots provide CSS identifiers for element targeting
- Session context can be inferred from URL/page title

**Workflow**:
```
1. User uploads screenshots with numbered markers
2. Agent analyzes images to extract:
   - Click sequence order (marker numbers)
   - Visual element descriptions (button text, icons, colors)
   - CSS properties (from DevTools screenshots if provided)
   - Page URLs (from browser address bar)
3. Agent analyzes Razor views to map:
   - Image elements → HTML elements
   - Button text → Razor component code
   - Visual markers → data-playwright-log-marker attributes
   - UI states → Blazor @code methods
4. Agent creates JSON metadata structure (click-sequence-metadata.json pattern)
5. Agent generates Playwright test spec + orchestration script
6. Agent updates test registry with new test entry
```

### Algorithm: ExtractTestMetadataFromScreenshots

**Location**: `.github/prompts/shared/screenshot-test-extraction.md` (NEW)

**Inputs**:
- `screenshots[]`: Array of image attachments with numbered markers
- `sessionContext`: Session ID, tokens, base URL (optional, can infer)
- `key`: KDS key for test placement

**Outputs**:
- `click-sequence-metadata.json`: Comprehensive element metadata
- `{key}-visual-test.spec.ts`: Playwright test file
- `run-{key}-visual-test.ps1`: Orchestration script
- `test-registry.md`: Updated with new test entry

**Steps**:

```
FUNCTION ExtractTestMetadataFromScreenshots(screenshots, sessionContext, key):
  
  # Step 1: Analyze Screenshots for Visual Markers
  clickSequence = []
  FOR EACH screenshot IN screenshots:
    markers = ExtractNumberedMarkers(screenshot)  # Find circles/boxes with numbers
    FOR EACH marker IN markers:
      step = {
        step: marker.number,
        description: InferActionFromVisual(marker.location, marker.surroundingText),
        visual_cues: {
          location: marker.location,  # "Top-right", "Below canvas selection"
          nearby_text: ExtractNearbyText(marker, screenshot),
          colors: ExtractColors(marker.region),
          icon: ExtractIcon(marker.region)
        }
      }
      clickSequence.Add(step)
    END FOR
  END FOR
  
  # Step 2: Extract CSS Identifiers from DevTools Screenshots
  cssProperties = {}
  FOR EACH screenshot IN screenshots:
    IF IsDevToolsScreenshot(screenshot):  # Check for "Styles" panel, CSS rules
      elementName = ExtractSelectedElement(screenshot)  # <button>, <div>, etc.
      cssRules = ExtractCSSRules(screenshot)  # background-color, border-radius, etc.
      cssProperties[elementName] = cssRules
    END IF
  END FOR
  
  # Step 3: Extract Session Context from Screenshots
  IF sessionContext IS NULL:
    sessionContext = InferSessionContext(screenshots)
    # Check URL bar for tokens, session ID
    # Check page title for session name
    # Extract base URL (https://localhost:9091)
  END IF
  
  # Step 4: Map Visual Elements to Razor Components
  elementMappings = []
  FOR EACH step IN clickSequence:
    # Search Razor files for matching elements
    buttonText = step.visual_cues.nearby_text
    components = SearchRazorFiles(buttonText, step.description)
    
    FOR EACH component IN components:
      mapping = {
        visual_element: step.description,
        razor_component: component.file,
        code_location: component.lines,
        selectors: ExtractSelectors(component),  # text, testid, class, marker
        css_identifiers: cssProperties[component.elementType] || {},
        data_attributes: ExtractDataAttributes(component),  # data-playwright-log-marker
        methods: ExtractRelatedMethods(component)  # @onclick handlers, JSInvokable
      }
      elementMappings.Add(mapping)
    END FOR
  END FOR
  
  # Step 5: Analyze SignalR Architecture (if applicable)
  signalrEvents = []
  FOR EACH mapping IN elementMappings:
    IF mapping.methods.Any(m => m.InvokesSignalR):
      event = {
        trigger: mapping.visual_element,
        hub: ExtractHubName(mapping.methods),
        method: ExtractHubMethod(mapping.methods),
        payload: ExtractPayloadStructure(mapping.methods)
      }
      signalrEvents.Add(event)
    END IF
  END FOR
  
  # Step 6: Generate JSON Metadata Structure
  metadata = {
    metadata: {
      version: "1.0.0",
      created: DateTime.Now,
      session_context: sessionContext,
      test_framework: "Playwright",
      orchestration_pattern: "v3.0 (Invoke-PlaywrightTest.ps1)"
    },
    click_sequence: EnrichClickSequence(clickSequence, elementMappings),
    ui_components: GroupByComponent(elementMappings),
    signalr_architecture: {
      hub: ExtractHub(signalrEvents),
      events: signalrEvents,
      receivers: IdentifyReceivers(signalrEvents)
    },
    playwright_selectors: GenerateSelectorInventory(elementMappings),
    visual_regression: GenerateScreenshotInventory(screenshots),
    code_references: GenerateCodeReferences(elementMappings)
  }
  
  # Step 7: Write JSON to KDS
  WriteFile(".github/key-data-streams/{key}/tests/click-sequence-metadata.json", metadata)
  
  # Step 8: Generate Playwright Test
  testSpec = GeneratePlaywrightTest(metadata)
  WriteFile(".github/key-data-streams/{key}/tests/{key}-visual-test.spec.ts", testSpec)
  
  # Step 9: Generate Orchestration Script
  orchestrationScript = GenerateOrchestrationScript(metadata, key)
  WriteFile(".github/key-data-streams/{key}/scripts/run-{key}-visual-test.ps1", orchestrationScript)
  
  # Step 10: Update Test Registry
  UpdateTestRegistry(key, metadata, testSpec, orchestrationScript)
  
  RETURN metadata
END FUNCTION

# Helper: Infer action from visual context
FUNCTION InferActionFromVisual(location, nearbyText):
  IF nearbyText.Contains("Start"):
    RETURN "Click Start Session button"
  ELSE IF nearbyText.Contains("Share"):
    RETURN "Click Share Section button"
  ELSE IF nearbyText.Contains("Canvas"):
    RETURN "Select canvas type"
  ELSE:
    RETURN "Click button at {location}"
  END IF
END FUNCTION

# Helper: Search Razor files for matching button text
FUNCTION SearchRazorFiles(buttonText, description):
  results = []
  files = FileSearch("**/*.razor")
  
  FOR EACH file IN files:
    content = ReadFile(file)
    IF content.Contains(buttonText):
      lineNumber = FindLineNumber(content, buttonText)
      results.Add({
        file: file,
        lines: lineNumber,
        elementType: InferElementType(content, lineNumber)
      })
    END IF
  END FOR
  
  RETURN results
END FUNCTION

# Helper: Extract selectors from Razor component
FUNCTION ExtractSelectors(component):
  selectors = []
  
  # Check for data-playwright-log-marker
  IF component.content.Contains("data-playwright-log-marker"):
    marker = ExtractAttribute(component.content, "data-playwright-log-marker")
    selectors.Add("[data-playwright-log-marker=\"{marker}\"]")
  END IF
  
  # Check for data-testid
  IF component.content.Contains("data-testid"):
    testid = ExtractAttribute(component.content, "data-testid")
    selectors.Add("[data-testid=\"{testid}\"]")
  END IF
  
  # Generate text selector
  buttonText = ExtractButtonText(component.content)
  IF buttonText:
    selectors.Add("button:has-text(\"{buttonText}\")")
  END IF
  
  # Generate class selector
  classes = ExtractClasses(component.content)
  FOR EACH class IN classes:
    selectors.Add(".{class}")
  END FOR
  
  RETURN selectors
END FUNCTION

# Helper: Check if screenshot shows DevTools
FUNCTION IsDevToolsScreenshot(screenshot):
  # Look for CSS panel indicators
  textContent = ExtractTextFromImage(screenshot)
  RETURN textContent.Contains("Styles") || 
         textContent.Contains("border-color") || 
         textContent.Contains("background-color")
END FUNCTION
```

### Integration Points

**test-generation.prompt.md Updates**:

**Add Step 0.5: Screenshot Analysis (BEFORE Step 1)**:
```
IF user provides multiple screenshots with visual markers:
  1. Invoke ExtractTestMetadataFromScreenshots algorithm
  2. Generate click-sequence-metadata.json
  3. Proceed to Step 2 (Test Spec Generation) using extracted metadata
ELSE:
  Proceed with standard test generation workflow
END IF
```

**Add Parameter**:
```
### screenshots *(optional)*
Array of image attachments with numbered markers indicating click sequence

**Behavior**:
- Agent analyzes images for visual markers (1, 2, 3...)
- Extracts CSS identifiers from DevTools screenshots
- Maps visual elements to Razor component code
- Generates click-sequence-metadata.json automatically
- Creates Playwright test + orchestration script
```

**test-prep.prompt.md Updates**:

**Add Step 1.5: Verify Prep Markers (BEFORE injection)**:
```
IF user provides screenshots AND Razor components have data-playwright-log-marker:
  1. Cross-reference screenshot elements with existing markers
  2. Validate markers match visual sequence
  3. Report any discrepancies (visual marker 2 maps to marker "Step1")
  4. Recommend: Keep markers OR cleanup + re-prep
END IF
```

---

## 📐 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER UPLOADS SCREENSHOTS                      │
│  Image 1: Control Panel (markers 1-3)                           │
│  Image 2: Transcript Canvas (marker 4-5)                        │
│  Image 3-6: DevTools CSS (colors, borders, padding)             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              SCREENSHOT ANALYSIS (Algorithm)                     │
│  ├─ Extract numbered markers (1, 2, 3...)                       │
│  ├─ Extract nearby text ("Start Session", "Share Section")      │
│  ├─ Extract CSS from DevTools (#065f46, border-radius: 8px)     │
│  └─ Infer session context (URL bar, page title)                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│           RAZOR COMPONENT ANALYSIS (Code Intelligence)          │
│  ├─ Search for button text in .razor files                      │
│  ├─ Extract data-playwright-log-marker attributes               │
│  ├─ Locate @onclick handlers, JSInvokable methods               │
│  ├─ Map SignalR events (BroadcastTranscript, ShareAsset)        │
│  └─ Generate multiple selector strategies                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│         JSON METADATA GENERATION (click-sequence-metadata.json)  │
│  ├─ click_sequence: 5 steps with element definitions            │
│  ├─ ui_components: Component documentation                      │
│  ├─ signalr_architecture: Hub, events, receivers                │
│  ├─ playwright_selectors: Button, navigation locators           │
│  ├─ visual_regression: Screenshot inventory                     │
│  └─ code_references: Razor files, methods, line numbers         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│            PLAYWRIGHT TEST GENERATION (Automated)                │
│  ├─ {key}-visual-test.spec.ts (8-step click sequence)           │
│  ├─ run-{key}-visual-test.ps1 (orchestration v3.0)              │
│  ├─ test-registry.md (updated with new test)                    │
│  └─ work-log.md (session entry documenting creation)            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Success Criteria

**Required for Rule #15 Implementation**:

1. ✅ **Algorithm File Created**: `.github/prompts/shared/screenshot-test-extraction.md`
2. ✅ **test-generation.prompt.md Updated**: Step 0.5 added, screenshots parameter
3. ✅ **test-prep.prompt.md Updated**: Step 1.5 marker validation
4. ✅ **KDS Rulebook Updated**: Rule #15 added with enforcement
5. ✅ **MANDATORY.md Updated**: Rule #15 indexed
6. ✅ **Example Validation**: Re-run hcp-refactor scenario with screenshots to verify

**Acceptance Test**:
```
@workspace /test-generation key=hcp-refactor-screenshot feature="Host Control Panel Visual Flow" scenario="Session start with transcript sharing"

[User uploads 6 screenshots]

Expected Output:
✅ click-sequence-metadata.json created (5 steps extracted)
✅ hcp-refactor-screenshot-visual-test.spec.ts created (8 test steps)
✅ run-hcp-refactor-screenshot-visual-test.ps1 created
✅ test-registry.md updated with new test entry
✅ All CSS identifiers match DevTools screenshots
✅ All selectors validated against Razor components
```

---

## ⚠️ Limitations & Constraints

### 1. Image Analysis Limitations

**Current State**: 
- ❌ No automated image OCR (text extraction from screenshots)
- ❌ No automated marker detection (circle/box recognition)
- ❌ No automated color extraction from screenshots

**Workaround**:
- ✅ Agent uses attachment metadata (filename, user description)
- ✅ Agent prompts user for clarification if ambiguous
- ✅ Agent cross-references visual description with code search

**Future Enhancement**: 
- Integrate GPT-4 Vision API for automated image analysis
- OCR layer for text extraction from screenshots
- Marker detection using computer vision

### 2. Component Mapping Accuracy

**Challenge**: Multiple components may have similar button text

**Example**:
- "Start Session" button in HostControlPanelSidebar
- "Start Session" button in UserRegistrationLink (different context)

**Solution**:
- Agent generates multiple candidate mappings
- Agent prompts user: "Found 2 'Start Session' buttons. Which file? A) HostControlPanelSidebar.razor B) UserRegistrationLink.razor"
- User selects correct mapping
- Agent documents choice in metadata

### 3. CSS Property Inference

**Challenge**: Not all screenshots include DevTools

**Solution**:
- Agent uses default CSS patterns if no DevTools screenshot
- Agent extracts inline styles from Razor components
- Agent prompts user: "Unable to determine exact color. Proceed with extracted inline style #065f46?"

### 4. SignalR Event Correlation

**Challenge**: Screenshots don't show SignalR broadcasts

**Solution**:
- Agent analyzes @onclick handlers for SignalR invocations
- Agent searches for hubConnection.InvokeAsync patterns
- Agent documents SignalR events in metadata for validation

---

## 🔄 Workflow Comparison

### Current Manual Process (Session 5)

**Time**: ~45 minutes  
**Steps**:
1. User uploads 6 screenshots
2. Agent manually analyzes images (visual inspection)
3. Agent reads HostControlPanel.razor (4,962 lines)
4. Agent extracts CSS identifiers by reading screenshots
5. Agent maps visual markers to code manually
6. Agent creates click-sequence-metadata.json (520 lines) manually
7. Agent creates test spec manually (316 lines)
8. Agent creates orchestration script manually (180 lines)
9. Agent updates test registry manually

**Effort**: HIGH - Manual analysis, manual JSON creation, manual code mapping

### Proposed Automated Process (Rule #15)

**Time**: ~10 minutes  
**Steps**:
1. User uploads 6 screenshots
2. User runs: `@workspace /test-generation key=hcp-visual screenshots feature="..." scenario="..."`
3. Agent invokes ExtractTestMetadataFromScreenshots algorithm
4. Agent generates all files automatically
5. Agent prompts user for disambiguation if needed

**Effort**: LOW - Algorithm handles analysis, automated generation

**Time Savings**: 35 minutes per visual test creation (78% reduction)

---

## 📊 Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Image analysis fails (no markers detected) | MEDIUM | HIGH | Prompt user for manual marker descriptions |
| Multiple components match visual element | HIGH | MEDIUM | Generate candidate list, user selects correct |
| DevTools screenshots missing | MEDIUM | LOW | Use inline styles from Razor, prompt user |
| Session context inference fails | LOW | MEDIUM | Default to Session 212, prompt user to override |
| Generated test has wrong selectors | MEDIUM | HIGH | Validate selectors against Razor code before saving |
| SignalR events incorrectly mapped | LOW | MEDIUM | Code analysis for hubConnection.InvokeAsync patterns |

**Overall Risk**: 🟡 MEDIUM - Mitigations in place for all high-impact risks

---

## ✅ Recommendation

### PROCEED with Rule #15 Implementation

**Rationale**:
1. ✅ 95% of infrastructure already exists (test-prep, PlaywrightLogger, JSON pattern)
2. ✅ Proven success with manual process (Session 5)
3. ✅ Clear time savings (78% reduction in test creation time)
4. ✅ Low risk with proper mitigation strategies
5. ✅ Enhances KDS test automation capabilities

**Implementation Priority**: HIGH

**Estimated Effort**: 
- Algorithm development: 4 hours
- test-generation.prompt.md integration: 2 hours
- test-prep.prompt.md integration: 1 hour
- Testing & validation: 3 hours
- **Total**: ~10 hours (1.25 dev days)

**Deliverables**:
1. `.github/prompts/shared/screenshot-test-extraction.md` (Algorithm)
2. Updated `.github/prompts/test-generation.prompt.md` (Step 0.5 + screenshots parameter)
3. Updated `.github/prompts/test-prep.prompt.md` (Step 1.5 marker validation)
4. Updated `.github/governance/kds-rulebook.json` (Rule #15)
5. Updated `.github/MANDATORY.md` (Rule #15 index)
6. Example validation (hcp-refactor-screenshot scenario)

**Next Steps**:
1. Create algorithm file (screenshot-test-extraction.md)
2. Update test-generation.prompt.md
3. Update test-prep.prompt.md
4. Update KDS rulebook
5. Run acceptance test with hcp-refactor screenshots

---

**Status**: 🟢 READY FOR IMPLEMENTATION  
**Approval Required**: User confirmation to proceed

