# Screenshot-Based Test Metadata Extraction Algorithm

**Version**: 1.0.0  
**Last Updated**: 2025-10-31  
**Purpose**: Extract comprehensive test metadata from UI screenshots with numbered markers for automated Playwright test generation

---

## Overview

This algorithm enables automated extraction of test metadata from user-uploaded screenshots showing click sequences. By analyzing visual markers, DevTools CSS panels, and session context, it generates structured JSON metadata compatible with test-generation.prompt.md.

**Key Innovation**: Leverages GitHub Copilot's built-in vision analysis capabilities to extract numbered markers, button text, CSS properties, and session context from images.

---

## Integration Points

### test-generation.prompt.md
- **Step 0.5**: Screenshot Analysis (NEW)
- **Parameter**: `screenshots` (array of image attachments)
- **Output**: click-sequence-metadata.json

### test-prep.prompt.md
- **Step 1.5**: Verify Prep Markers (NEW)
- **Validation**: Cross-reference screenshot markers with existing data-playwright-log-marker

---

## Algorithm: ExtractTestMetadataFromScreenshots

**Inputs**:
- `screenshots[]`: Array of image attachments with numbered markers
- `sessionContext`: Session ID, tokens, base URL (optional, can infer from images)
- `key`: KDS key for test placement

**Outputs**:
- `click-sequence-metadata.json`: Comprehensive element metadata
- Test spec file path for subsequent generation
- Orchestration script parameters

**Vision Tool Usage**: This algorithm uses GitHub Copilot's built-in vision analysis to extract text, markers, and visual properties from screenshots.

---

### Main Algorithm

```
FUNCTION ExtractTestMetadataFromScreenshots(screenshots, sessionContext, key):
  
  # Step 1: Analyze Screenshots for Visual Markers
  clickSequence = []
  sessionInfo = {}
  
  FOR EACH screenshot IN screenshots:
    # Use vision analysis to extract numbered markers (circles/boxes with numbers 1, 2, 3...)
    markers = IdentifyNumberedMarkers(screenshot)
    
    # Extract session context from URL bar if visible
    IF screenshot.ShowsURLBar():
      urlComponents = ExtractBaseURL(screenshot)  # Returns full URL + components
      sessionInfo.full_url = urlComponents.full_url           # Complete URL
      sessionInfo.baseUrl = urlComponents.base_url            # Protocol + domain + port
      sessionInfo.route = urlComponents.route                  # Full route path
      sessionInfo.hostToken = urlComponents.tokens.host || ExtractTokenFromURL(screenshot, "host")
      sessionInfo.userToken = urlComponents.tokens.user || ExtractTokenFromURL(screenshot, "user")
      sessionInfo.query_params = urlComponents.query_params   # All query parameters
    END IF
    
    # Extract page title if visible
    IF screenshot.ShowsPageTitle():
      sessionInfo.sessionTitle = ExtractPageTitle(screenshot)
    END IF
    
    # For each numbered marker found
    FOR EACH marker IN markers:
      # Infer action from visual context
      nearbyText = ExtractTextNearMarker(marker, screenshot, radius=50px)
      location = DetermineMarkerLocation(marker, screenshot)  # "Top-right", "Below canvas selection"
      
      step = {
        step: marker.number,
        marker_id: marker.number.ToString(),
        action: InferActionType(nearbyText),  # "click", "navigate", "verify"
        visual_cues: {
          location: location,
          nearby_text: nearbyText,
          colors: ExtractColors(marker.region, screenshot),
          icon: ExtractIcon(marker.region, screenshot)
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
  IF sessionInfo IS EMPTY:
    sessionInfo = InferSessionContext(screenshots)
    # Fallback: Ask user for session ID if not visible in URL
  END IF
  
  # Step 4: Map Visual Elements to Razor Components
  elementMappings = []
  FOR EACH step IN clickSequence:
    # Search Razor files for matching elements
    candidates = SearchRazorFiles(step.visual_cues.nearby_text)
    
    # Narrow down using CSS properties if available
    IF cssProperties.ContainsKey(step.visual_cues.nearby_text):
      candidates = FilterByCSSMatch(candidates, cssProperties[step.visual_cues.nearby_text])
    END IF
    
    # Present candidates to user if ambiguous
    IF candidates.Count > 1:
      selectedComponent = PromptUserToSelectComponent(candidates, step)
    ELSE:
      selectedComponent = candidates[0]
    END IF
    
    # Extract selectors from component
    selectors = ExtractSelectors(selectedComponent)
    
    # Add element mapping
    elementMappings.Add({
      step: step.step,
      component: selectedComponent.fileName,
      element: {
        text: step.visual_cues.nearby_text,
        selectors: selectors,
        css_identifiers: cssProperties.GetOrDefault(step.visual_cues.nearby_text, {})
      }
    })
  END FOR
  
  # Step 5: Generate Comprehensive Metadata JSON
  metadata = {
    metadata: {
      key: key,
      session_id: sessionInfo.sessionId,
      base_url: sessionInfo.baseUrl,
      host_token: sessionInfo.hostToken,
      user_token: sessionInfo.userToken,
      session_title: sessionInfo.sessionTitle,
      test_framework: "playwright",
      orchestration_pattern: "canonical-v3.0"
    },
    click_sequence: elementMappings,
    ui_components: ExtractUIComponents(elementMappings),
    signalr_architecture: InferSignalRArchitecture(elementMappings),
    playwright_selectors: GeneratePlaywrightSelectors(elementMappings),
    visual_regression: GenerateVisualRegressionSpec(clickSequence),
    code_references: ExtractCodeReferences(elementMappings)
  }
  
  # Save metadata to KDS location
  outputPath = ".github/key-data-streams/{key}/tests/click-sequence-metadata.json"
  WriteJSON(metadata, outputPath)
  
  RETURN metadata
END FUNCTION
```

---

## Helper Functions

### Algorithm 1: IdentifyNumberedMarkers

**Purpose**: Use vision analysis to detect numbered circles/boxes in screenshots

```
FUNCTION IdentifyNumberedMarkers(screenshot):
  # Use Copilot vision analysis to extract visual markers
  prompt = "Identify all numbered markers (circular or boxed numbers) in this image. For each marker, provide:
    1. The number displayed (1, 2, 3, etc.)
    2. The approximate location (top-left, center, bottom-right, etc.)
    3. Any text near the marker (within 50px radius)
    4. The color of the marker background"
  
  visionResult = AnalyzeImageWithVision(screenshot, prompt)
  
  markers = []
  FOR EACH detected IN visionResult.markers:
    markers.Add({
      number: detected.number,
      location: detected.location,
      nearbyText: detected.nearbyText,
      color: detected.backgroundColor
    })
  END FOR
  
  RETURN markers
END FUNCTION
```

### Algorithm 2: ExtractBaseURL

**Purpose**: Extract complete URL from browser address bar (base + route + query params)

```
FUNCTION ExtractBaseURL(screenshot):
  # Use vision analysis to read URL bar - extract FULL URL
  prompt = "Extract the complete URL from the browser address bar, including:
    1. Protocol (http/https)
    2. Domain (localhost, IP, or domain name)
    3. Port number (if visible)
    4. Full route path (e.g., /host/control-panel/TOKEN)
    5. All query parameters (if any)
    Return the full URL exactly as shown."
  
  visionResult = AnalyzeImageWithVision(screenshot, prompt)
  
  # Parse URL components
  fullUrl = visionResult.url  # e.g., "https://localhost:9091/host/control-panel/PQ9N5YWW"
  
  # Extract components
  components = {
    full_url: fullUrl,
    base_url: ExtractProtocolDomainPort(fullUrl),  # https://localhost:9091
    route: ExtractRoutePath(fullUrl),               # /host/control-panel/PQ9N5YWW
    tokens: ExtractTokensFromRoute(fullUrl),        # {host: PQ9N5YWW}
    query_params: ExtractQueryParams(fullUrl)       # {} or {key: value}
  }
  
  # Store ALL components in metadata (even if not immediately used)
  # Future tests may need full route, query params, or session context
  
  RETURN components
END FUNCTION
```

### Algorithm 3: ExtractTokenFromURL

**Purpose**: Extract host/user tokens from URL path segments or query parameters

```
FUNCTION ExtractTokenFromURL(screenshot, tokenType):
  # Use vision analysis to read URL bar
  prompt = "Extract the full URL from the browser address bar, including:
    - Full route path (e.g., /host/control-panel/TOKEN)
    - All query parameters (e.g., ?host=TOKEN&user=TOKEN)
    Return the complete URL string."
  
  visionResult = AnalyzeImageWithVision(screenshot, prompt)
  url = visionResult.url
  
  # Try BOTH path segments AND query parameters
  # Modern NoorCanvas pattern: /host/control-panel/{hostToken} or /session/{userToken}
  
  IF tokenType == "host":
    # Check path segments first (modern pattern)
    pathToken = ExtractPathSegment(url, "/host/control-panel/")  # Gets token after route
    IF pathToken:
      RETURN pathToken
    END IF
    # Fallback to query params (legacy pattern)
    RETURN ExtractQueryParam(url, "host") || ExtractQueryParam(url, "hostToken")
    
  ELSE IF tokenType == "user":
    # Check path segments first
    pathToken = ExtractPathSegment(url, "/session/") || ExtractPathSegment(url, "/user/canvas/") || ExtractPathSegment(url, "/user/transcript/")
    IF pathToken:
      RETURN pathToken
    END IF
    # Fallback to query params
    RETURN ExtractQueryParam(url, "user") || ExtractQueryParam(url, "userToken") || ExtractQueryParam(url, "token")
  END IF
END FUNCTION
```

### Algorithm 4: IsDevToolsScreenshot

**Purpose**: Detect if screenshot shows browser DevTools panel

```
FUNCTION IsDevToolsScreenshot(screenshot):
  # Use vision analysis to detect DevTools UI
  prompt = "Does this screenshot show browser Developer Tools (DevTools)? Look for:
    - A 'Styles' or 'Computed' tab
    - CSS rules with property names (background-color, border-radius, etc.)
    - Element inspector panel
    Return true/false."
  
  visionResult = AnalyzeImageWithVision(screenshot, prompt)
  
  RETURN visionResult.hasDevTools
END FUNCTION
```

### Algorithm 5: ExtractCSSRules

**Purpose**: Extract CSS properties from DevTools Styles panel

```
FUNCTION ExtractCSSRules(screenshot):
  # Use vision analysis to read CSS rules
  prompt = "Extract all CSS rules visible in the Styles panel. For each property, provide:
    1. Property name (e.g., background-color, border-radius)
    2. Property value (e.g., #065f46, 8px)
    Return as structured list."
  
  visionResult = AnalyzeImageWithVision(screenshot, prompt)
  
  cssRules = {}
  FOR EACH rule IN visionResult.cssRules:
    propertyName = ConvertToSnakeCase(rule.property)  # background-color → background_color
    cssRules[propertyName] = rule.value
  END FOR
  
  RETURN cssRules
END FUNCTION
```

### Algorithm 6: SearchRazorFiles

**Purpose**: Search Razor components for matching button text

```
FUNCTION SearchRazorFiles(buttonText):
  # Use grep_search to find matching text in Razor files
  pattern = EscapeRegex(buttonText)
  results = grep_search(pattern, includePattern="**/*.razor", isRegexp=true)
  
  candidates = []
  FOR EACH result IN results:
    candidates.Add({
      fileName: result.filePath,
      lineNumber: result.lineNumber,
      content: ReadFileLines(result.filePath, result.lineNumber - 5, result.lineNumber + 5)
    })
  END FOR
  
  RETURN candidates
END FUNCTION
```

### Algorithm 7: ExtractSelectors

**Purpose**: Generate Playwright selectors from Razor component code

```
FUNCTION ExtractSelectors(component):
  selectors = []
  
  # Check for data-testid attribute
  IF component.content.Contains("data-testid"):
    testid = ExtractAttribute(component.content, "data-testid")
    selectors.Add("[data-testid=\"{testid}\"]")
  END IF
  
  # Check for data-playwright-log-marker attribute
  IF component.content.Contains("data-playwright-log-marker"):
    marker = ExtractAttribute(component.content, "data-playwright-log-marker")
    selectors.Add("[data-playwright-log-marker=\"{marker}\"]")
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
```

### Algorithm 8: InferActionType

**Purpose**: Determine action type from button text

```
FUNCTION InferActionType(buttonText):
  # Keyword mapping
  clickKeywords = ["Start", "Share", "Submit", "Send", "Click", "Open", "Close"]
  verifyKeywords = ["Verify", "Check", "Confirm", "Validate"]
  navigateKeywords = ["Navigate", "Go to", "Open", "View"]
  
  FOR EACH keyword IN clickKeywords:
    IF buttonText.Contains(keyword):
      RETURN "click"
    END IF
  END FOR
  
  FOR EACH keyword IN verifyKeywords:
    IF buttonText.Contains(keyword):
      RETURN "verify"
    END IF
  END FOR
  
  FOR EACH keyword IN navigateKeywords:
    IF buttonText.Contains(keyword):
      RETURN "navigate"
    END IF
  END FOR
  
  # Default to click
  RETURN "click"
END FUNCTION
```

### Algorithm 9: GenerateVisualRegressionSpec

**Purpose**: Generate Percy screenshot specifications

```
FUNCTION GenerateVisualRegressionSpec(clickSequence):
  screenshots = []
  
  FOR EACH step IN clickSequence:
    screenshots.Add({
      name: "{key}-visual-step{step.step}-{step.description}",
      description: "Visual snapshot after {step.action} on {step.element.text}",
      percyOptions: {
        widths: [1280],
        minHeight: 1024
      }
    })
  END FOR
  
  RETURN screenshots
END FUNCTION
```

### Algorithm 10: AnalyzeImageWithVision

**Purpose**: Wrapper for GitHub Copilot vision analysis

```
FUNCTION AnalyzeImageWithVision(screenshot, prompt):
  # GitHub Copilot has built-in vision analysis capabilities
  # When images are provided in attachments, Copilot can analyze them
  # This function represents the abstraction layer for vision queries
  
  # In practice, the agent directly analyzes images when they are attached
  # and responds to structured prompts about their content
  
  # Example usage in test-generation.prompt.md Step 0.5:
  # "Analyze the provided screenshots and extract all numbered markers.
  #  For each marker, identify the nearby button text and location."
  
  RETURN VisionAnalysisResult  # Structured data from Copilot's vision model
END FUNCTION
```

---

## Limitations & Workarounds

### Limitation 1: OCR Accuracy
**Issue**: Vision analysis may misread text in low-resolution screenshots  
**Workaround**: Prompt user to confirm extracted text (e.g., "Is this button text 'Start Session'?")

### Limitation 2: Component Disambiguation
**Issue**: Multiple Razor components may contain same button text  
**Workaround**: Present candidate list to user for selection

### Limitation 3: CSS Property Inference
**Issue**: DevTools screenshots may not show all relevant CSS properties  
**Workaround**: Use inline styles from Razor component, prompt user for missing properties

### Limitation 4: Marker Detection
**Issue**: Vision analysis may miss numbered markers if they blend with background  
**Workaround**: Request user to describe sequence order ("Which marker is first?")

---

## Example Usage

### Input: 6 Screenshots
1. Host Control Panel (marker 1 on URL)
2. Transcript Canvas button (marker 2)
3. Start Session button (marker 3)
4. Share Section button (marker 4, with DevTools showing yellow background)
5. Question modal (marker 5, with DevTools showing purple FAB)
6. Additional DevTools CSS panel

### Output: click-sequence-metadata.json
```json
{
  "metadata": {
    "key": "hcp-refactor",
    "session_id": 212,
    "base_url": "https://localhost:9091",
    "host_token": "PQ9N5YWW",
    "user_token": "KJAHA99L",
    "session_title": "Need For Messengers",
    "test_framework": "playwright",
    "orchestration_pattern": "canonical-v3.0"
  },
  "click_sequence": [
    {
      "step": 1,
      "marker_id": "1",
      "action": "navigate",
      "element": {
        "component": "N/A",
        "text": "Host Control Panel URL",
        "selectors": ["page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW')"]
      }
    },
    {
      "step": 2,
      "marker_id": "2",
      "action": "click",
      "element": {
        "component": "HostControlPanelContent.razor",
        "text": "Transcript Canvas",
        "selectors": [
          "button:has-text('Transcript Canvas')",
          "[data-testid='transcript-canvas-btn']"
        ],
        "css_identifiers": {
          "background_color": "#f8fafc",
          "border_color": "#cbd5e1"
        }
      }
    }
  ]
}
```

---

## Integration with test-generation.prompt.md

**Step 0.5: Screenshot Analysis** (NEW)

```
IF user provides screenshots parameter:
  1. Invoke ExtractTestMetadataFromScreenshots(screenshots, sessionContext, key)
  2. Display extracted metadata summary for user approval:
     - Session context (ID, tokens, URL)
     - Click sequence (N steps identified)
     - Component mappings (Razor files)
     - CSS identifiers (from DevTools)
  3. Prompt user for confirmation:
     A. APPROVE - Proceed with extracted metadata
     B. REVISE - User corrects extracted data
     C. MANUAL - User provides manual JSON
  4. Save approved metadata to click-sequence-metadata.json
  5. Proceed to Step 2 (Test Spec Generation) using metadata
END IF
```

---

## Related Files

- `.github/prompts/test-generation.prompt.md` - Main test generation workflow
- `.github/prompts/test-prep.prompt.md` - Test prep with marker validation
- `.github/prompts/shared/image-analysis-protocol.md` - General image analysis guidelines
- `.github/governance/kds-rulebook.json` - Rule #17 definition
- `.github/key-data-streams/hcp-refactor/FEASIBILITY-SCREENSHOT-TO-TEST-GENERATION.md` - Feasibility analysis

---

## Changelog

### [1.0.0] - 2025-10-31
- Initial algorithm implementation
- Integrated GitHub Copilot vision analysis capabilities
- 10 helper functions for marker detection, CSS extraction, component mapping
- Support for Session 212 canonical test data
- Visual regression specification generation
