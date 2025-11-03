# Server-Side Button Event Binding Strategy

**Date:** November 3, 2025  
**Context:** How event binding and data tracking work with server-side button injection

---

## Your Questions Answered

### Q1: How will click event binding occur on server-side rendered buttons?

**Answer:** Using **Event Delegation** pattern - a single event listener on the container that handles all button clicks.

### Q2: Will there be a flag to signal JavaScript to bind buttons?

**Answer:** Yes - **data attributes** embedded in the HTML act as flags, plus we can add an explicit initialization marker.

### Q3: How will button clicks know which asset/section HTML to share?

**Answer:** **Data attributes** on each button contain all necessary metadata (shareId, assetType, sectionId, etc.)

---

## Architecture: Event Delegation Pattern

### Current Implementation (for Asset Buttons)

This pattern is **already working** in your codebase. Let me show you:

#### 1. Server-Side Button Generation

**Location:** `AssetProcessingService.cs` (Lines 450-475)

```csharp
private static string CreateAssetContainerHeaderHtml(
    string assetType, 
    string displayName, 
    string shareId, 
    int instanceNumber)
{
    // Generate unique button ID
    var buttonId = $"asset-fab-{assetType.ToLowerInvariant().Replace(" ", "-")}-{instanceNumber}";

    // Purple FAB button with DATA ATTRIBUTES for event handling
    return $@"<button type=""button"" 
                id=""{buttonId}"" 
                class=""asset-header-fab-button"" 
                data-share-id=""{encodedShareId}"" 
                data-asset-type=""{encodedAssetType}"" 
                data-instance-number=""{instanceNumber}"" 
                aria-label=""Share {encodedDisplayName} asset #{instanceNumber}"" 
                style=""..."">
            <i class=""fa-solid fa-share-nodes""></i>
        </button>";
}
```

**Key Elements:**
- ✅ **Unique ID:** `asset-fab-inserted-hadees-1`
- ✅ **CSS Class:** `asset-header-fab-button` (for delegation selector)
- ✅ **Data Attributes:** All metadata needed for sharing
- ✅ **No inline onclick:** Clean separation of concerns

#### 2. Client-Side Event Delegation Setup

**Pattern from `transcript-section-parser.js` (Lines 300-320):**

```javascript
// Called once after HTML is rendered
setupClickDelegation: function (containerId, dotNetRef) {
    console.log('[DELEGATION] Setting up click delegation...');
    const container = document.getElementById(containerId);

    if (!container) {
        console.error('[DELEGATION] Container not found');
        return;
    }

    // Remove old listener to prevent duplicates
    if (container._clickHandler) {
        container.removeEventListener('click', container._clickHandler);
    }

    // Create single click handler for ALL buttons
    const clickHandler = async function (event) {
        // Find closest button with delegation class
        const button = event.target.closest('.transcript-section-share-btn');
        
        if (!button) {
            return; // Not a share button, ignore
        }

        event.preventDefault();
        
        // Extract metadata from data attributes
        const sectionId = button.getAttribute('data-section-id');
        const h2Index = parseInt(button.getAttribute('data-h2-index'));
        const h2Text = button.getAttribute('data-h2-text');
        
        // Extract HTML for this specific section
        const sectionWrapper = document.getElementById(sectionId);
        const sectionHtml = sectionWrapper.innerHTML;
        
        // Call C# method with extracted data
        await dotNetRef.invokeMethodAsync(
            'ShareTranscriptSection', 
            sectionId, 
            sectionHtml, 
            h2Text
        );
    };

    // Attach handler to container (not individual buttons)
    container.addEventListener('click', clickHandler);
    container._clickHandler = clickHandler; // Store for cleanup
}
```

**Why Event Delegation?**
- ✅ **Single Listener:** One event handler for unlimited buttons
- ✅ **Dynamic Content:** Works even if buttons added/removed dynamically
- ✅ **Better Performance:** No need to attach listeners to each button
- ✅ **Memory Efficient:** Prevents memory leaks from orphaned listeners

---

## Implementation Plan for Unified Server-Side Injection

### Phase 1: Server-Side Button HTML with Data Attributes

#### Asset Share Buttons (Already Implemented ✅)

**Generated HTML:**
```html
<button type="button" 
        id="asset-fab-inserted-hadees-1" 
        class="asset-header-fab-button"
        data-share-id="asset-inserted-hadees-1"
        data-asset-type="inserted-hadees"
        data-instance-number="1"
        aria-label="Share Inserted Hadees asset #1">
    <i class="fa-solid fa-share-nodes"></i>
</button>

<!-- Asset content is wrapped in container with matching ID -->
<div class="asset-group-container" 
     data-share-id="asset-inserted-hadees-1"
     data-asset-type="inserted-hadees">
    <!-- Actual asset HTML here -->
    <div class="asset-content-wrapper">
        <div class="inserted-hadees-card" id="hadees-123">
            <!-- Original hadees content -->
        </div>
    </div>
</div>
```

#### Section Share Buttons (To Be Implemented)

**Server-Side Button Generation in `TranscriptSectionParserService.cs`:**

```csharp
private string CreateSectionShareButtonHtml(
    string sectionId, 
    string h2Text, 
    int index)
{
    var encodedSectionId = System.Web.HttpUtility.HtmlEncode(sectionId);
    var encodedH2Text = System.Web.HttpUtility.HtmlEncode(h2Text);
    
    // Button wrapper (golden theme matching current design)
    return $@"
        <div class=""share-button-wrapper"" 
             style=""text-align:center; margin:15px 0; padding:10px; background:#FFFAEB; border-radius:8px;"">
            <button type=""button"" 
                    id=""section-share-btn-{index}"" 
                    class=""transcript-section-share-btn""
                    data-section-id=""{encodedSectionId}""
                    data-h2-index=""{index}""
                    data-h2-text=""{encodedH2Text}""
                    data-noor-share-control=""true""
                    aria-label=""Share section: {encodedH2Text}""
                    style=""background-color:#FFD700; color:#333; padding:10px 20px; border:1px solid #C5A84C; border-radius:5px; cursor:pointer; font-size:0.9rem; transition:background-color 0.1s;"">
                <i class=""fas fa-share-alt"" style=""margin-right:8px; color:#888;""></i>
                Share {encodedH2Text}
            </button>
        </div>";
}

private string CreateSectionWrapperHtml(
    string sectionId, 
    IEnumerable<IElement> sectionElements)
{
    var encodedSectionId = System.Web.HttpUtility.HtmlEncode(sectionId);
    
    // Wrapper div containing all section content
    var innerHtml = string.Join("", sectionElements.Select(el => el.OuterHtml));
    
    return $@"
        <div id=""{encodedSectionId}"" 
             class=""transcript-section-wrapper""
             data-section-id=""{encodedSectionId}"">
            {innerHtml}
        </div>";
}
```

**Generated HTML Structure:**
```html
<!-- Button BEFORE section wrapper -->
<div class="share-button-wrapper">
    <button type="button" 
            id="section-share-btn-0" 
            class="transcript-section-share-btn"
            data-section-id="transcript-section-0"
            data-h2-index="0"
            data-h2-text="Introduction"
            data-noor-share-control="true">
        <i class="fas fa-share-alt"></i>
        Share Introduction
    </button>
</div>

<!-- Section content wrapper with matching ID -->
<div id="transcript-section-0" 
     class="transcript-section-wrapper"
     data-section-id="transcript-section-0">
    <h2>Introduction</h2>
    <p>Section content here...</p>
    <!-- More content until next h2 -->
</div>

<!-- Next section follows same pattern -->
<div class="share-button-wrapper">
    <button type="button" 
            id="section-share-btn-1" 
            class="transcript-section-share-btn"
            data-section-id="transcript-section-1"
            data-h2-index="1"
            data-h2-text="First Topic">
        <i class="fas fa-share-alt"></i>
        Share First Topic
    </button>
</div>

<div id="transcript-section-1" 
     class="transcript-section-wrapper"
     data-section-id="transcript-section-1">
    <h2>First Topic</h2>
    <p>More content...</p>
</div>
```

---

### Phase 2: Client-Side Event Delegation Setup

#### Option A: Automatic Initialization (Recommended)

**Create:** `wwwroot/js/noor-share-button-handler.js`

```javascript
/**
 * Unified Share Button Handler
 * Automatically initializes event delegation for all share buttons
 * Works with server-side injected buttons (no post-render injection needed)
 */
window.NoorShareButtonHandler = {
    _dotNetRef: null,
    _initialized: false,

    /**
     * Initialize event delegation on transcript container
     * Called once from HostControlPanelContent.OnAfterRenderAsync
     */
    initialize: function(containerId, dotNetRef) {
        if (this._initialized) {
            console.log('[NOOR-SHARE] Already initialized, skipping');
            return { success: true, alreadyInitialized: true };
        }

        console.log('[NOOR-SHARE] Initializing event delegation...');
        this._dotNetRef = dotNetRef;

        const container = document.getElementById(containerId);
        if (!container) {
            console.error('[NOOR-SHARE] Container not found:', containerId);
            return { success: false, error: 'Container not found' };
        }

        // Set up unified click handler for ALL share button types
        container.addEventListener('click', this._handleShareButtonClick.bind(this));
        
        this._initialized = true;
        
        // Count existing buttons
        const assetButtons = container.querySelectorAll('.asset-header-fab-button').length;
        const sectionButtons = container.querySelectorAll('.transcript-section-share-btn').length;
        
        console.log(`[NOOR-SHARE] Initialized - ${assetButtons} asset buttons, ${sectionButtons} section buttons`);
        
        return { 
            success: true, 
            assetButtons: assetButtons,
            sectionButtons: sectionButtons
        };
    },

    /**
     * Unified click handler for both asset and section share buttons
     */
    _handleShareButtonClick: async function(event) {
        // Check for asset FAB button
        const assetButton = event.target.closest('.asset-header-fab-button');
        if (assetButton) {
            await this._handleAssetShare(assetButton, event);
            return;
        }

        // Check for section share button
        const sectionButton = event.target.closest('.transcript-section-share-btn');
        if (sectionButton) {
            await this._handleSectionShare(sectionButton, event);
            return;
        }

        // Not a share button, ignore
    },

    /**
     * Handle asset share button click
     */
    _handleAssetShare: async function(button, event) {
        event.preventDefault();
        console.log('[NOOR-SHARE] Asset button clicked');

        // Extract metadata from data attributes
        const shareId = button.getAttribute('data-share-id');
        const assetType = button.getAttribute('data-asset-type');
        const instanceNumber = parseInt(button.getAttribute('data-instance-number'));

        console.log(`[NOOR-SHARE] Sharing asset: ${shareId}, type: ${assetType}, instance: ${instanceNumber}`);

        // Find the asset container with matching data-share-id
        const assetContainer = document.querySelector(
            `.asset-group-container[data-share-id="${shareId}"]`
        );

        if (!assetContainer) {
            console.error('[NOOR-SHARE] Asset container not found for:', shareId);
            return;
        }

        // Extract HTML from asset-content-wrapper
        const contentWrapper = assetContainer.querySelector('.asset-content-wrapper');
        if (!contentWrapper) {
            console.error('[NOOR-SHARE] Content wrapper not found in:', shareId);
            return;
        }

        // Clone and clean the content (remove share controls)
        const clone = contentWrapper.cloneNode(true);
        const shareControls = clone.querySelectorAll('[data-noor-share-control="true"]');
        shareControls.forEach(control => control.remove());

        const assetHtml = clone.innerHTML;

        // Visual feedback
        this._showButtonLoading(button);

        try {
            // Call C# method
            await this._dotNetRef.invokeMethodAsync(
                'ShareAsset', 
                shareId, 
                assetType, 
                instanceNumber
            );

            this._showButtonSuccess(button);
        } catch (error) {
            console.error('[NOOR-SHARE] Asset share failed:', error);
            this._showButtonError(button);
        }
    },

    /**
     * Handle section share button click
     */
    _handleSectionShare: async function(button, event) {
        event.preventDefault();
        console.log('[NOOR-SHARE] Section button clicked');

        // Extract metadata from data attributes
        const sectionId = button.getAttribute('data-section-id');
        const h2Index = parseInt(button.getAttribute('data-h2-index'));
        const h2Text = button.getAttribute('data-h2-text');

        console.log(`[NOOR-SHARE] Sharing section: ${sectionId}, h2: ${h2Text}`);

        // Find section wrapper with matching ID
        const sectionWrapper = document.getElementById(sectionId);
        if (!sectionWrapper) {
            console.error('[NOOR-SHARE] Section wrapper not found:', sectionId);
            return;
        }

        // Clone and clean the content
        const clone = sectionWrapper.cloneNode(true);
        
        // Remove share controls
        const shareControls = clone.querySelectorAll('[data-noor-share-control="true"]');
        shareControls.forEach(control => control.remove());
        
        // Remove event handlers
        this._removeEventHandlers(clone);

        const sectionHtml = clone.innerHTML;

        // Visual feedback
        this._showButtonLoading(button);

        try {
            // Call C# method
            await this._dotNetRef.invokeMethodAsync(
                'ShareTranscriptSection', 
                sectionId, 
                sectionHtml, 
                h2Text
            );

            this._showButtonSuccess(button);
        } catch (error) {
            console.error('[NOOR-SHARE] Section share failed:', error);
            this._showButtonError(button);
        }
    },

    /**
     * Remove all event handler attributes from element tree
     */
    _removeEventHandlers: function(element) {
        const allElements = element.querySelectorAll('*');
        allElements.forEach(el => {
            const attrs = Array.from(el.attributes);
            attrs.forEach(attr => {
                if (attr.name.toLowerCase().startsWith('on')) {
                    el.removeAttribute(attr.name);
                }
            });
        });
    },

    /**
     * Visual feedback helpers
     */
    _showButtonLoading: function(button) {
        button._originalHtml = button.innerHTML;
        button._originalBg = button.style.backgroundColor;
        button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sharing...';
        button.disabled = true;
    },

    _showButtonSuccess: function(button) {
        button.innerHTML = '<i class="fa-solid fa-check"></i> Shared!';
        button.style.backgroundColor = '#059669';
        
        setTimeout(() => {
            button.innerHTML = button._originalHtml;
            button.style.backgroundColor = button._originalBg;
            button.disabled = false;
        }, 2000);
    },

    _showButtonError: function(button) {
        button.innerHTML = '<i class="fa-solid fa-exclamation-triangle"></i> Error';
        button.style.backgroundColor = '#DC2626';
        
        setTimeout(() => {
            button.innerHTML = button._originalHtml;
            button.style.backgroundColor = button._originalBg;
            button.disabled = false;
        }, 3000);
    }
};
```

#### Integration in HostControlPanelContent.razor

```csharp
protected override async Task OnAfterRenderAsync(bool firstRender)
{
    await base.OnAfterRenderAsync(firstRender);
    
    // Initialize event delegation ONCE on first render
    if (firstRender && !string.IsNullOrEmpty(Model?.TransformedTranscript))
    {
        try
        {
            var dotNetRef = DotNetObjectReference.Create(this);
            var result = await JSRuntime.InvokeAsync<JsonElement>(
                "NoorShareButtonHandler.initialize",
                "content-transcript-container",
                dotNetRef
            );
            
            var success = result.GetProperty("success").GetBoolean();
            if (success)
            {
                Logger.LogInformation(
                    "[NOOR-SHARE] Event delegation initialized - Asset buttons: {AssetButtons}, Section buttons: {SectionButtons}",
                    result.GetProperty("assetButtons").GetInt32(),
                    result.GetProperty("sectionButtons").GetInt32()
                );
            }
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "[NOOR-SHARE] Failed to initialize event delegation");
        }
    }
}
```

---

### Phase 3: Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ SERVER SIDE (C#)                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  UnifiedHtmlTransformService.TransformForHostAsync()            │
│    │                                                            │
│    ├─> AssetProcessingService.InjectAssetShareButtonsAsync()   │
│    │     │                                                      │
│    │     └─> Creates buttons with data attributes:             │
│    │         <button class="asset-header-fab-button"           │
│    │                 data-share-id="asset-hadees-1"            │
│    │                 data-asset-type="inserted-hadees"         │
│    │                 data-instance-number="1">                 │
│    │                                                            │
│    └─> TranscriptSectionParserService.InjectSectionButtons()   │
│          │                                                      │
│          └─> Creates buttons with data attributes:             │
│              <button class="transcript-section-share-btn"      │
│                      data-section-id="transcript-section-0"    │
│                      data-h2-index="0"                         │
│                      data-h2-text="Introduction">              │
│                                                                 │
│  Returns: Complete HTML with ALL buttons injected              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                           │
                           │ HTML string
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ COMPONENT RENDERING (Blazor)                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  HostControlPanelContent.razor renders:                         │
│  @((MarkupString)Model.TransformedTranscript)                   │
│                                                                 │
│  → Buttons exist in DOM immediately                            │
│  → No JavaScript manipulation needed yet                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                           │
                           │ OnAfterRenderAsync
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ CLIENT SIDE (JavaScript)                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  NoorShareButtonHandler.initialize()                            │
│    │                                                            │
│    └─> Attaches ONE click listener to container                │
│                                                                 │
│  User clicks ANY share button                                  │
│    │                                                            │
│    └─> Event bubbles to container                              │
│          │                                                      │
│          └─> Handler checks event.target.closest():            │
│                │                                                │
│                ├─> Is it .asset-header-fab-button?             │
│                │     YES → Extract data-share-id               │
│                │           Find matching container             │
│                │           Extract HTML from wrapper           │
│                │           Call ShareAsset(shareId, type, #)   │
│                │                                                │
│                └─> Is it .transcript-section-share-btn?        │
│                      YES → Extract data-section-id             │
│                            Find section wrapper by ID          │
│                            Extract HTML from wrapper           │
│                            Call ShareTranscriptSection(...)    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                           │
                           │ JSInterop
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ C# METHOD INVOCATION                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [JSInvokable]                                                  │
│  public async Task ShareAsset(                                  │
│      string shareId,      // "asset-hadees-1"                  │
│      string assetType,    // "inserted-hadees"                 │
│      int instanceNumber)  // 1                                 │
│  {                                                              │
│      // Broadcast via SignalR                                  │
│      await hubConnection.InvokeAsync("ShareAsset", ...);        │
│  }                                                              │
│                                                                 │
│  [JSInvokable]                                                  │
│  public async Task ShareTranscriptSection(                      │
│      string sectionId,    // "transcript-section-0"            │
│      string sectionHtml,  // Extracted HTML                    │
│      string h2Text)       // "Introduction"                    │
│  {                                                              │
│      // Broadcast via SignalR                                  │
│      await hubConnection.InvokeAsync("ShareSection", ...);      │
│  }                                                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Advantages of This Approach

### 1. **Single Source of Truth**
- All button HTML generated server-side
- Data attributes define behavior
- No JavaScript string manipulation

### 2. **Clean Separation of Concerns**
```
Server → Generates HTML with data
Client → Reads data, handles events
```

### 3. **Resilient to DOM Changes**
- Event delegation works even if buttons added/removed
- No need to re-bind after content updates

### 4. **Easy Testing**
```csharp
// Server-side test
var html = await service.InjectSectionShareButtonsAsync(transcript, sessionId);
Assert.Contains("data-section-id=\"transcript-section-0\"", html);

// Client-side test (Playwright)
await page.click('[data-section-id="transcript-section-0"]');
await expect(page.locator('.shared-indicator')).toBeVisible();
```

### 5. **Performance**
- One-time setup (initialize event delegation)
- No repeated DOM queries
- No memory leaks from orphaned listeners

---

## Migration Checklist

### Server-Side Changes
- [ ] Create `TranscriptSectionParserService.cs`
- [ ] Implement `InjectSectionShareButtonsAsync()` with data attributes
- [ ] Add service to `UnifiedHtmlTransformService` pipeline
- [ ] Verify button HTML includes all required data attributes

### Client-Side Changes
- [ ] Create `noor-share-button-handler.js`
- [ ] Implement unified click delegation
- [ ] Add initialization call in `OnAfterRenderAsync`
- [ ] Remove old `transcript-section-parser.js` injection logic

### Testing
- [ ] Unit test: Verify button HTML contains correct data attributes
- [ ] Integration test: Click buttons and verify C# methods called
- [ ] Playwright test: Verify both asset and section sharing work
- [ ] Manual test: Session 212 with both button types

---

## Summary

**Q: How will event binding occur?**
**A:** Single event delegation listener on the container, set up once on first render.

**Q: Will there be a flag?**
**A:** Yes - CSS classes (`.asset-header-fab-button`, `.transcript-section-share-btn`) act as flags for the event handler.

**Q: How will clicks know which HTML to share?**
**A:** Data attributes on each button (`data-share-id`, `data-section-id`) identify the corresponding content wrapper, which is queried by ID to extract the HTML.

This pattern is **already proven** in your codebase with the current JavaScript section parser - we're just moving the HTML generation to server-side while keeping the same event delegation pattern.
