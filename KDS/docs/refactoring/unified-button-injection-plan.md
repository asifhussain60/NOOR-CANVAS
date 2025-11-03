# Unified Button Injection Plan

**Date:** November 3, 2025  
**Context:** Currently button injections happen in two separate phases - this document outlines how to unify them into a single server-side operation.

## Current State: Two-Phase Injection

### Phase 1: Server-Side Asset Button Injection
**When:** During transcript transformation (before rendering)  
**Where:** `UnifiedHtmlTransformService.TransformForHostAsync()`  
**What:** Purple FAB asset share buttons  
**How:** C# service using AngleSharp DOM manipulation

```csharp
// Step 2: Inject asset containers with purple FAB buttons
cleanedHtml = await _assetProcessingService.InjectAssetShareButtonsAsync(
    cleanedHtml,
    runId);
```

### Phase 2: Client-Side Section Button Injection
**When:** After DOM renders (post-render lifecycle)  
**Where:** JavaScript `TranscriptSectionParser.injectShareButtons()`  
**What:** Green share buttons for transcript sections (h2 groups)  
**How:** JavaScript DOM manipulation using `querySelectorAll('h2')`

```javascript
// Called from HostControlPanel.HandleTranscriptRendered()
var injectionResult = await JSRuntime.InvokeAsync<JsonElement>(
    "TranscriptSectionParser.injectShareButtons", 
    "transcript-content-container", 
    dotNetRef, 
    selectedCanvasType
);
```

---

## Proposed State: Unified Server-Side Injection

All button injections happen server-side during transcript transformation, before any HTML is rendered.

### Benefits
1. ✅ **Single Source of Truth** - One location for all button logic
2. ✅ **Better Performance** - No post-render DOM manipulation delays
3. ✅ **Easier Testing** - Server-side HTML string assertions instead of complex JavaScript mocking
4. ✅ **Simplified Component Lifecycle** - No need for `OnAfterRenderAsync` handlers
5. ✅ **No Race Conditions** - Buttons present immediately when component renders
6. ✅ **Better SEO/Accessibility** - Full HTML available on initial render

### Trade-offs
1. ❌ **More Complex Server Code** - HTML manipulation logic in C#
2. ❌ **No Dynamic DOM Updates** - Can't re-inject without full re-render
3. ⚠️ **Larger Initial Payload** - All buttons in initial HTML (minimal impact)

---

## Required Changes

### 1. Create New Service: `TranscriptSectionParserService.cs`

**Purpose:** Port JavaScript section parsing logic to C#

**Location:** `SPA/NoorCanvas/Services/TranscriptSectionParserService.cs`

**Responsibilities:**
- Parse HTML to find all `<h2>` elements
- Group content between consecutive `<h2>` tags
- Generate section share button HTML
- Inject buttons above each section wrapper
- Return transformed HTML with section buttons

**Key Methods:**

```csharp
public class TranscriptSectionParserService
{
    private readonly ILogger<TranscriptSectionParserService> _logger;
    
    /// <summary>
    /// Inject section share buttons for all h2 groups in transcript HTML
    /// Ports functionality from transcript-section-parser.js to server-side
    /// </summary>
    /// <param name="html">HTML with h2 elements defining sections</param>
    /// <param name="sessionId">Session ID for logging</param>
    /// <param name="canvasType">Canvas type ('transcript' only, skip for 'asset')</param>
    /// <returns>HTML with section share buttons injected</returns>
    public async Task<string> InjectSectionShareButtonsAsync(
        string html, 
        long sessionId, 
        string canvasType = "transcript")
    {
        // Skip injection for non-transcript canvas types
        if (canvasType != "transcript")
        {
            _logger.LogInformation(
                "[SECTION-PARSER] Skipping section buttons for {CanvasType} canvas", 
                canvasType);
            return html;
        }
        
        // Parse HTML with AngleSharp
        var parser = new HtmlParser();
        var document = await parser.ParseDocumentAsync(html);
        
        // Find all h2 elements
        var h2Elements = document.QuerySelectorAll("h2").ToList();
        
        _logger.LogInformation(
            "[SECTION-PARSER] Found {Count} h2 sections in session {SessionId}",
            h2Elements.Count(), sessionId);
        
        if (!h2Elements.Any())
        {
            return html;
        }
        
        // Process each h2 section
        foreach (var (h2, index) in h2Elements.Select((el, i) => (el, i)))
        {
            var sectionId = $"transcript-section-{index}";
            var h2Text = h2.TextContent?.Trim() ?? $"Section {index + 1}";
            
            // Collect content from this h2 until next h2 (or end)
            var sectionElements = CollectSectionElements(h2);
            
            // Wrap section in container div
            var sectionWrapper = CreateSectionWrapper(
                sectionId, 
                sectionElements, 
                document);
            
            // Create share button
            var shareButton = CreateSectionShareButton(
                sectionId, 
                h2Text, 
                index);
            
            // Insert button before section wrapper
            sectionWrapper.Parent?.InsertBefore(shareButton, sectionWrapper);
        }
        
        // Serialize back to HTML string
        return document.DocumentElement.OuterHtml;
    }
    
    private IElement CreateSectionShareButton(
        string sectionId, 
        string h2Text, 
        int index)
    {
        // Generate same HTML as JavaScript version
        // Green "Share Section" button matching current design
        return CreateButtonElement(sectionId, h2Text, index);
    }
    
    private IEnumerable<IElement> CollectSectionElements(IElement h2)
    {
        // Collect h2 and all siblings until next h2
        var elements = new List<IElement> { h2 };
        var current = h2.NextElementSibling;
        
        while (current != null && current.TagName != "H2")
        {
            elements.Add(current);
            current = current.NextElementSibling;
        }
        
        return elements;
    }
    
    private IElement CreateSectionWrapper(
        string sectionId, 
        IEnumerable<IElement> elements,
        IDocument document)
    {
        var wrapper = document.CreateElement("div");
        wrapper.Id = sectionId;
        wrapper.ClassName = "transcript-section-wrapper";
        wrapper.SetAttribute("data-section-id", sectionId);
        
        // Move elements into wrapper
        foreach (var el in elements.ToList())
        {
            wrapper.AppendChild(el);
        }
        
        return wrapper;
    }
}
```

### 2. Update `UnifiedHtmlTransformService.TransformForHostAsync()`

**Add section button injection after asset button injection:**

```csharp
public async Task<string> TransformForHostAsync(
    string html, 
    int? sessionId, 
    string? sessionStatus)
{
    // ... existing code ...
    
    // Step 2: Inject asset containers with purple FAB buttons
    if (shouldProcessAssets)
    {
        cleanedHtml = await _assetProcessingService.InjectAssetShareButtonsAsync(
            cleanedHtml,
            runId);
    }
    
    // Step 3: Inject section share buttons for transcript sections (NEW)
    // Only applies when selectedCanvasType is "transcript"
    if (shouldProcessAssets && sessionId.HasValue)
    {
        _logger.LogInformation(
            "UnifiedHtmlTransformService: Injecting section share buttons for session {SessionId}",
            sessionId);
            
        cleanedHtml = await _transcriptSectionParser.InjectSectionShareButtonsAsync(
            cleanedHtml,
            sessionId.Value,
            canvasType: "transcript"); // Pass from parameter
    }
    
    return cleanedHtml;
}
```

**Updated Constructor:**

```csharp
private readonly TranscriptSectionParserService _transcriptSectionParser;

public UnifiedHtmlTransformService(
    HtmlParsingService htmlParsingService,
    AssetProcessingService assetProcessingService,
    IMediaUrlTransformService mediaUrlTransformService,
    ShareButtonInjectionService shareButtonInjectionService,
    TranscriptSectionParserService transcriptSectionParser, // NEW
    ILogger<UnifiedHtmlTransformService> logger)
{
    _htmlParsingService = htmlParsingService;
    _assetProcessingService = assetProcessingService;
    _mediaUrlTransformService = mediaUrlTransformService;
    _shareButtonInjectionService = shareButtonInjectionService;
    _transcriptSectionParser = transcriptSectionParser; // NEW
    _logger = logger;
}
```

### 3. Update `HostControlPanel.razor`

**REMOVE:** Post-render JavaScript injection logic

```csharp
// DELETE THIS METHOD (Line 1385-1480)
private async Task HandleTranscriptRendered()
{
    // ... ALL THIS CODE CAN BE DELETED ...
}
```

**REMOVE:** OnAfterRenderAsync section button re-initialization

```csharp
protected override async Task OnAfterRenderAsync(bool firstRender)
{
    // REMOVE section button injection logic
    // Keep only toastr initialization if needed
    
    if (firstRender)
    {
        // Only toastr check remains, if needed
    }
    
    // DELETE: All ReinitializeShareButtonHandlersAsync calls
    // DELETE: All HandleTranscriptRendered calls
}
```

**REMOVE:** Callback from HostControlPanelContent

```csharp
// DELETE from component parameters:
[Parameter] public EventCallback OnTranscriptRendered { get; set; }
```

### 4. Update `HostControlPanelContent.razor`

**REMOVE:** OnTranscriptRendered callback invocation

```csharp
protected override async Task OnAfterRenderAsync(bool firstRender)
{
    await base.OnAfterRenderAsync(firstRender);
    
    // [TRACE:hcp-fab-button] Log FAB button visibility
    if (firstRender || Model != null)
    {
        Console.WriteLine($"[FAB-DEBUG] HasTranscript: ...");
    }
    
    // DELETE THIS ENTIRE SECTION:
    // if (!hasNotifiedTranscriptRendered && !string.IsNullOrEmpty(Model?.TransformedTranscript))
    // {
    //     hasNotifiedTranscriptRendered = true;
    //     await OnTranscriptRendered.InvokeAsync();
    // }
}
```

**REMOVE:** Parameter and state tracking

```csharp
// DELETE these lines from @code block:
[Parameter] public EventCallback OnTranscriptRendered { get; set; }
private bool hasNotifiedTranscriptRendered = false;
```

### 5. JavaScript Changes (transcript-section-parser.js)

**Option A: Keep for backward compatibility (recommended initially)**
- Keep the file but add early exit if buttons already exist
- Prevents duplicate injection if called accidentally

```javascript
injectShareButtons: async function (containerId, dotNetRef, canvasType = 'transcript') {
    // Check if buttons already exist (server-side injection)
    const container = document.getElementById(containerId);
    const existingButtons = container?.querySelectorAll('.section-share-button');
    
    if (existingButtons && existingButtons.length > 0) {
        console.log('[SECTION-PARSER] Buttons already exist - skipping client-side injection');
        return { success: true, sections: existingButtons.length, alreadyInjected: true };
    }
    
    // Original logic continues...
}
```

**Option B: Delete file entirely (future cleanup)**
- Remove file after confirming server-side injection works
- Remove all JavaScript references
- Clean up HeadContent script tags in HostControlPanel.razor

### 6. Update `Program.cs` - Register New Service

```csharp
// Add to service registration section
builder.Services.AddScoped<TranscriptSectionParserService>();
```

### 7. Update TransformForHostAsync Signature

**Current:**
```csharp
public async Task<string> TransformForHostAsync(
    string html, 
    int? sessionId, 
    string? sessionStatus)
```

**Updated with CanvasType:**
```csharp
public async Task<string> TransformForHostAsync(
    string html, 
    int? sessionId, 
    string? sessionStatus,
    string canvasType = "asset") // NEW parameter
```

**Update callers in HostControlPanel.razor:**

```csharp
// Line 2675 (TransformTranscriptHtmlAsync method)
return await HtmlTransform.TransformForHostAsync(
    originalHtml, 
    SessionId, 
    Model?.SessionStatus,
    selectedCanvasType); // Pass canvas type
```

---

## Implementation Checklist

### Phase 1: Create Server-Side Infrastructure
- [ ] Create `TranscriptSectionParserService.cs` with full implementation
- [ ] Add unit tests for section parsing logic
- [ ] Add unit tests for button HTML generation
- [ ] Register service in `Program.cs`

### Phase 2: Integrate into Transform Pipeline
- [ ] Add `canvasType` parameter to `TransformForHostAsync`
- [ ] Update `UnifiedHtmlTransformService` constructor with new dependency
- [ ] Add section button injection step in `TransformForHostAsync`
- [ ] Update all callers to pass `selectedCanvasType`

### Phase 3: Remove Client-Side Logic
- [ ] Remove `HandleTranscriptRendered()` from HostControlPanel.razor
- [ ] Remove `OnTranscriptRendered` callback from HostControlPanelContent
- [ ] Clean up `OnAfterRenderAsync` in both components
- [ ] Add safety check to transcript-section-parser.js (don't delete yet)

### Phase 4: Testing & Validation
- [ ] Unit tests: Verify section parsing finds all h2 elements
- [ ] Unit tests: Verify button HTML generation matches JavaScript version
- [ ] Integration tests: Load session 212 and verify buttons present on initial render
- [ ] Manual testing: Click section share buttons and verify SignalR broadcast works
- [ ] Manual testing: Test with both asset and transcript canvas types
- [ ] Performance testing: Measure transform time increase (should be minimal)

### Phase 5: Cleanup (Optional Future Work)
- [ ] Remove transcript-section-parser.js file entirely
- [ ] Remove script tag from HostControlPanel.razor HeadContent
- [ ] Remove any remaining JSRuntime calls to TranscriptSectionParser
- [ ] Update documentation to reflect server-side-only injection

---

## Benefits Summary

### Performance
- **Faster Initial Render:** Buttons present immediately, no 100ms delay + DOM query time
- **No Re-injection Logic:** Eliminates OnAfterRenderAsync complexity
- **Single Pass Transform:** One HTML transformation instead of two-phase

### Maintainability
- **Single Source:** All button logic in C# services
- **Easier Testing:** String assertions instead of JavaScript DOM mocking
- **Type Safety:** Full IntelliSense and compile-time checking
- **Consistent Patterns:** Matches existing asset button injection pattern

### Developer Experience
- **Simpler Component Code:** No lifecycle complexity in HostControlPanel/HostControlPanelContent
- **Better Debugging:** C# logging and breakpoints instead of JavaScript console
- **Clearer Architecture:** Separation of concerns between transformation and rendering

---

## Risks & Mitigations

### Risk: AngleSharp Parsing Differences
**Mitigation:** 
- Thorough unit tests comparing output to JavaScript version
- Manual testing with real session 212 transcript
- Keep JavaScript file with safety check during transition period

### Risk: Performance Impact
**Mitigation:**
- Benchmark transform time before/after
- Profile memory usage with large transcripts
- Consider caching transformed HTML if needed

### Risk: Breaking Existing Functionality
**Mitigation:**
- Implement in feature branch (features/unified-button-injection)
- Comprehensive testing before merge
- Keep JavaScript as fallback initially
- Gradual rollout with rollback plan

---

## Alternative Approaches Considered

### 1. Keep Dual Injection (Status Quo)
- **Pro:** Already works, no changes needed
- **Con:** Complex lifecycle, race conditions, harder testing

### 2. Pure Client-Side Injection
- **Pro:** Dynamic, can update without re-render
- **Con:** Slower, flicker, accessibility issues, harder testing

### 3. Hybrid: Server Assets + Client Sections
- **Pro:** Balances server/client complexity
- **Con:** Still maintains two-phase complexity (current state)

### 4. Pure Server-Side Injection (RECOMMENDED)
- **Pro:** All benefits listed above
- **Con:** Requires upfront C# implementation work

---

## Timeline Estimate

- **Phase 1 (Service Creation):** 4-6 hours
- **Phase 2 (Integration):** 2-3 hours  
- **Phase 3 (Cleanup):** 1-2 hours
- **Phase 4 (Testing):** 4-6 hours
- **Phase 5 (Optional):** 1-2 hours

**Total:** ~12-19 hours for complete unified injection

---

## Success Criteria

✅ All h2 sections have share buttons on initial render  
✅ No JavaScript DOM manipulation after render  
✅ Session 212 transcript displays correctly with all buttons  
✅ Button clicks trigger SignalR broadcasts successfully  
✅ Unit tests pass for all section parsing scenarios  
✅ Transform time increase < 50ms for typical transcripts  
✅ No console errors or warnings  
✅ Playwright tests pass without modification  

---

## Conclusion

**Recommendation:** Implement unified server-side injection.

The current two-phase approach works but creates unnecessary complexity in component lifecycle management. Moving all button injection to server-side transformation provides cleaner architecture, better testability, and improved performance while maintaining all existing functionality.

The implementation is straightforward since the pattern already exists for asset button injection - we're simply extending it to cover section buttons as well.
