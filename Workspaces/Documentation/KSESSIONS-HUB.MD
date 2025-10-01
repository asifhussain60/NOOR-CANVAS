# KSESSIONS-HUB SignalR Broadcasting Documentation

## Overview##### SessionAsset Data Structure
The system uses `SessionAssetDto` objects returned from the `/api/sessions/{sessionId}/assets` endpoint:

```csharp
public class SessionAssetDto
{
    public string AssetType { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public int InstanceNumber { get; set; }
    public string CssSelector { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    // Additional metadata properties as needed
}
```

**Primary Asset Types Supported:**
- **ayah-card** - Quranic verse cards with Arabic text and translations
- **inserted-hadees** - Hadith content blocks with chain of narration
- **etymology-card** - Word etymology and linguistic analysis cards
- **esotericBlock** - Specialized content for advanced study
- **verse-container** - General verse containers for various content types
- **table** - Structured data tables with Islamic content
- **imgResponsive** - Responsive images with Islamic artwork or diagramsvas SignalR hub service provides real-time broadcasting functionality for sharing assets from the Host Control Panel to connected user sessions at https://localhost:9091/user/landing/KJAHA99L. This document outlines the complete broadcasting architecture, implementation patterns, and usage flows.

## Architecture Components

### 1. SignalR Hub Infrastructure

#### SessionHub (/hub/session)
**Location:** `SPA/NoorCanvas/Hubs/SessionHub.cs`

The SessionHub serves as the central SignalR hub for all real-time communications in NOOR Canvas, providing:
- Asset broadcasting from host to participants
- Q&A functionality
- Participant management
- Connection lifecycle management

**Key Configuration:**
```csharp
// Program.cs configuration
builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = true;
    options.HandshakeTimeout = TimeSpan.FromSeconds(15);
    options.KeepAliveInterval = TimeSpan.FromSeconds(15);
    options.ClientTimeoutInterval = TimeSpan.FromSeconds(30);
});

// Hub endpoint mapping
app.MapHub<SessionHub>("/hub/session");
```

### 2. Asset Broadcasting Flow

#### Host Side: Asset Detection & Sharing
**Component:** `HostControlPanel.razor`
**URL:** https://localhost:9091/host/control-panel/PQ9N5YWW

##### SessionAssets API-Driven Asset Detection
The system uses the SessionAssets API endpoint for asset detection and management:

```csharp
// LoadSessionAssetsAsync method
private async Task<List<SessionAssetDto>?> LoadSessionAssetsAsync(long sessionId)
{
    var response = await Http.GetAsync($"/api/sessions/{sessionId}/assets");
    if (response.IsSuccessStatusCode)
    {
        var json = await response.Content.ReadAsStringAsync();
        var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        return JsonSerializer.Deserialize<List<SessionAssetDto>>(json, options);
    }
    return null;
}

// Process session assets for share button injection
var sessionAssets = await LoadSessionAssetsAsync(sessionId);
if (sessionAssets != null)
{
    foreach (var asset in sessionAssets)
    {
        var shareId = $"asset-{asset.AssetType}-{asset.InstanceNumber}";
        // Inject share buttons using asset metadata from API
        var shareButton = CreateRedShareButtonHtml(asset.AssetType, 
            asset.DisplayName ?? asset.AssetType, shareId, asset.InstanceNumber);
    }
}
```

##### Asset Types Configuration
The system supports 8 predefined asset types stored in `canvas.AssetLookup`:

| Asset Identifier | CSS Selector | Display Name |
|-----------------|--------------|--------------|
| `ayah-card` | `.ayah-card` | Ayah Card |
| `inserted-hadees` | `.inserted-hadees` | Inserted Hadees |
| `etymology-card` | `.etymology-card` | Etymology Card |
| `etymology-derivative-card` | `.etymology-derivative-card` | Etymology Derivative Card |
| `esotericBlock` | `.esotericBlock` | Esoteric Block |
| `verse-container` | `.verse-container` | Verse Container |
| `table` | `table[style="width: 100%;"]` | Table |
| `imgResponsive` | `.imgResponsive` | Responsive Image |

##### Share Button Structure
Red share buttons are injected with the following HTML structure:

```html
<div class="ks-share-wrapper">
    <button class="ks-share-button ks-share-red" 
            data-share-button="asset" 
            data-share-id="asset-ayah-card-1" 
            data-asset-type="ayah-card" 
            data-instance-number="1" 
            type="button" 
            style="background-color: #dc3545; color: white; border: 1px solid #dc3545; padding: 4px 8px; font-size: 12px; border-radius: 3px; cursor: pointer;">
        📤 SHARE AYAH CARD #1
    </button>
</div>
```

**Key Features:**
- **Red styling** (`#dc3545`) for high visibility
- **Data attributes** for JavaScript integration
- **ID matching** between share button and target asset
- **Instance numbering** for multiple assets of the same type

#### Share Button Click Handler
**Method:** `ShareAsset()` in HostControlPanel.razor

```csharp
[JSInvokable]
public async Task ShareAsset(string shareId, string assetType, int instanceNumber)
{
    var broadcastId = Guid.NewGuid().ToString("N")[..8];
    
    try
    {
        // Step 1: Extract asset HTML using HtmlAgilityPack parsing
        var rawAssetHtml = await ExtractRawAssetHtml(shareId, assetType, instanceNumber);
    
        if (string.IsNullOrEmpty(rawAssetHtml))
        {
            await ShowErrorMessageAsync($"Asset content not found for {assetType} #{instanceNumber}");
            return;
        }

        // Step 2: Create broadcast payload
        var assetData = new {
            shareId = shareId,
            assetType = assetType,
            instanceNumber = instanceNumber,
            rawHtmlContent = rawAssetHtml,
            sharedAt = DateTime.UtcNow,
            sessionId = SessionId.Value
        };
        
        // Step 3: Broadcast via SignalR Hub with timeout handling
        var shareTask = hubConnection.InvokeAsync("ShareAsset", SessionId.Value, assetData);
        var timeoutTask = Task.Delay(5000); // 5 second timeout
        
        var completedTask = await Task.WhenAny(shareTask, timeoutTask);
        
        if (completedTask == timeoutTask)
        {
            Logger.LogError("SignalR timeout after 5 seconds");
            await ShowErrorMessageAsync("Asset sharing timed out after 5 seconds");
            return;
        }

        await shareTask; // Await the actual task to catch any exceptions
        await ShowSuccessMessageAsync($"✅ {assetType} #{instanceNumber} shared successfully!");
    }
    catch (Exception ex)
    {
        Logger.LogError(ex, "Error sharing asset: {ShareId}", shareId);
        await ShowErrorMessageAsync($"Error sharing asset: {ex.Message}");
    }
}
```

#### HTML Asset Extraction Method
**Method:** `ExtractRawAssetHtml()` in HostControlPanel.razor

```csharp
private Task<string> ExtractRawAssetHtml(string shareId, string assetType, int instanceNumber)
{
    try
    {
        if (string.IsNullOrEmpty(Model?.SessionTranscript))
        {
            Logger.LogError("SessionTranscript is null or empty");
            return Task.FromResult(string.Empty);
        }

        // Use HtmlAgilityPack for server-side HTML parsing
        var htmlDoc = new HtmlAgilityPack.HtmlDocument();
        htmlDoc.LoadHtml(Model.SessionTranscript);
        
        // Find asset elements using CSS class selectors
        var assetElements = htmlDoc.DocumentNode.SelectNodes("//div[contains(@class, 'ayah-card')]");
        
        if (assetElements != null && assetElements.Count > instanceNumber - 1)
        {
            var targetElement = assetElements[instanceNumber - 1];
            var rawHtml = targetElement.OuterHtml;
            
            Logger.LogInformation("Successfully extracted raw asset HTML: {Length} chars", rawHtml.Length);
            return Task.FromResult(rawHtml);
        }
        else
        {
            Logger.LogWarning("Asset element not found: {AssetType} instance {Instance}", assetType, instanceNumber);
            return Task.FromResult(string.Empty);
        }
    }
    catch (Exception ex)
    {
        Logger.LogError(ex, "Error extracting raw asset HTML: {AssetType}", assetType);
        return Task.FromResult(string.Empty);
    }
}
```

**Logging Pattern:**
The system uses comprehensive debug logging with broadcast tracking IDs:
```
[DEBUG-WORKITEM:assetshare:continue] 🚀 STEP 4/7: Broadcasting asset via SignalR ShareAsset, target=session_{SessionId}, broadcastId={BroadcastId}
[DEBUG-WORKITEM:assetshare:continue] ✅ STEP 5/7: SignalR ShareAsset call completed successfully
```

### 3. Hub Processing & Broadcasting

#### SessionHub.ShareAsset Method
**Location:** `SPA/NoorCanvas/Hubs/SessionHub.cs`

```csharp
public async Task ShareAsset(long sessionId, object assetData)
{
    var groupName = $"session_{sessionId}";
    var hubTrackingId = Guid.NewGuid().ToString("N")[..8];

    // Enhanced logging for asset data structure
    try
    {
        var assetJson = JsonSerializer.Serialize(assetData, new JsonSerializerOptions { WriteIndented = true });
        _logger.LogInformation("[DEBUG-WORKITEM:hostcanvas:HUB-TRACK] 📋 Asset data serialized, length={Length} chars, hubTrackingId={HubTrackingId}", 
            assetJson?.Length ?? 0, hubTrackingId);
    }
    catch (Exception ex)
    {
        _logger.LogWarning("[DEBUG-WORKITEM:hostcanvas:HUB-TRACK] Could not serialize asset data: {Error}, hubTrackingId={HubTrackingId}", 
            ex.Message, hubTrackingId);
    }

    // Create broadcast payload with metadata
    var broadcastPayload = new
    {
        sessionId = sessionId,
        asset = assetData,
        timestamp = DateTime.UtcNow,
        sharedBy = Context.ConnectionId
    };

    // Broadcast to session group
    await Clients.Group(groupName).SendAsync("AssetShared", broadcastPayload);
    
    _logger.LogInformation("[DEBUG-WORKITEM:hostcanvas:HUB-TRACK] ✅ AssetShared message sent to group {GroupName} for session {SessionId}, hubTrackingId={HubTrackingId}", 
        groupName, sessionId, hubTrackingId);
}
```

**Hub Logging Pattern:**
```
[DEBUG-WORKITEM:hostcanvas:HUB-TRACK] 🎣 HUB ENTRY: ShareAsset method called, sessionId={SessionId}, connectionId={ConnectionId}
[DEBUG-WORKITEM:hostcanvas:HUB-TRACK] 📦 HUB BROADCAST: Broadcasting AssetShared to group {GroupName}
[DEBUG-WORKITEM:hostcanvas:HUB-TRACK] ✅ HUB SUCCESS: AssetShared message sent to group {GroupName}
```

### 4. User Side Reception

#### SessionCanvas Asset Handler
**Component:** `SessionCanvas.razor`
**URL:** https://localhost:9091/session/canvas/testuser123

```csharp
// Asset sharing event handler
hubConnection.On<object>("AssetShared", async (assetData) =>
{
    var canvasTrackingId = Guid.NewGuid().ToString("N")[..8];
    
    try
    {
        // Serialize and parse asset data
        var assetJson = JsonSerializer.Serialize(assetData);
        using var jsonDoc = JsonDocument.Parse(assetJson);
        var root = jsonDoc.RootElement;

        // Handle hub payload structure - look for "asset" wrapper
        JsonElement actualAsset = root;
        if (root.TryGetProperty("asset", out var assetProperty))
        {
            actualAsset = assetProperty;
            Logger.LogInformation("[DEBUG-WORKITEM:hub:continue] 📦 STRUCTURE: Found asset wrapper, canvasTrackingId={CanvasTrackingId}", canvasTrackingId);
        }

        // Extract HTML content - support both rawHtmlContent and testContent
        var htmlContent = string.Empty;
        var contentSourceProperty = string.Empty;
        
        if (actualAsset.TryGetProperty("rawHtmlContent", out var contentElement))
        {
            htmlContent = contentElement.GetString();
            contentSourceProperty = "rawHtmlContent";
            Logger.LogInformation("[DEBUG-WORKITEM:assetshare:continue] ✅ PHASE1 SUCCESS: rawHtmlContent property found, length={ContentLength} chars, canvasTrackingId={CanvasTrackingId}", 
                htmlContent?.Length ?? 0, canvasTrackingId);
        }
        else if (actualAsset.TryGetProperty("testContent", out contentElement))
        {
            htmlContent = contentElement.GetString();
            contentSourceProperty = "testContent";
            Logger.LogInformation("[DEBUG-WORKITEM:assetshare:continue] ✅ PHASE1 FALLBACK: testContent property found (backward compatibility), length={ContentLength} chars, canvasTrackingId={CanvasTrackingId}", 
                htmlContent?.Length ?? 0, canvasTrackingId);
        }
        
        if (!string.IsNullOrEmpty(htmlContent))
        {
            // Update UI with received content
            Model.SharedAssetContent = htmlContent;
            await InvokeAsync(StateHasChanged);
            
            Logger.LogInformation("[DEBUG-WORKITEM:assetshare:continue] ✅ PHASE1 RENDER SUCCESS: UI updated with {PropertyName}, content should be visible, canvasTrackingId={CanvasTrackingId}", 
                contentSourceProperty, canvasTrackingId);
        }
    }
    catch (Exception ex)
    {
        Logger.LogError(ex, "[DEBUG-WORKITEM:hub:continue] ❌ CANVAS ERROR: Exception in AssetShared handler, canvasTrackingId={CanvasTrackingId}", canvasTrackingId);
    }
});
```

**Canvas Logging Pattern:**
```
[DEBUG-WORKITEM:hub:continue] 📬 CANVAS RECEIVE: AssetShared event received, canvasTrackingId={CanvasTrackingId}
[DEBUG-WORKITEM:assetshare:continue] 🎨 PHASE1 CONTENT EXTRACTED: rawHtmlContent found, length={ContentLength}
[DEBUG-WORKITEM:assetshare:continue] 🔄 PHASE1 UI UPDATE: SharedAssetContent set from rawHtmlContent, calling StateHasChanged
[DEBUG-WORKITEM:assetshare:continue] ✅ PHASE1 RENDER SUCCESS: UI updated with rawHtmlContent, content should be visible
```

## Connection Management

### Group-Based Broadcasting
The system uses session-based groups for targeted broadcasting:

```csharp
// Group naming convention
var groupName = $"session_{sessionId}";

// Host joins session group (implicit via connection)
// Participants join session group via JoinSession call
await hubConnection.SendAsync("JoinSession", sessionId, "participant");

// Broadcasting to all session participants
await Clients.Group(groupName).SendAsync("AssetShared", broadcastPayload);
```

### Connection Lifecycle
**Connection Events:**
- `OnConnectedAsync()` - Logs connection establishment
- `OnDisconnectedAsync()` - Handles cleanup and departure notifications
- Automatic reconnection with exponential backoff

**Reconnection Configuration:**
```csharp
hubConnection = new HubConnectionBuilder()
    .WithUrl(Navigation.ToAbsoluteUri("/hub/session"))
    .WithAutomaticReconnect(new[] { 
        TimeSpan.Zero, 
        TimeSpan.FromSeconds(2), 
        TimeSpan.FromSeconds(10), 
        TimeSpan.FromSeconds(30) 
    })
    .Build();
```

## Testing & Validation URLs

### Primary Testing Endpoints
- **Host Control Panel:** https://localhost:9091/host/control-panel/PQ9N5YWW
- **User Landing:** https://localhost:9091/user/landing/KJAHA99L
- **Session Canvas:** https://localhost:9091/session/canvas/testuser123

### Test Asset Button
The Host Control Panel includes a "Test Share Asset" button for validation:

```csharp
private async Task TestShareAsset()
{
    var testAssetData = new
    {
        testContent = "<div class='test-shared-content' style='padding:20px;background:#e8f5e8;border:2px solid #4CAF50;border-radius:8px;'>" +
                     "<h3 style='color:#2E7D32;margin-top:0;'>📚 Shared Islamic Content</h3>" +
                     "<p style='color:#1B5E20;margin:10px 0;'>This is a test of the asset sharing system using SignalR broadcasting.</p>" +
                     "<div style='background:white;padding:15px;border-radius:4px;'>" +
                     "<strong>Test Asset Data:</strong><br>" +
                     $"Broadcast Time: {DateTime.UtcNow:HH:mm:ss}<br>" +
                     $"Session ID: {SessionId}<br>" +
                     $"Content Type: Test Asset" +
                     "</div></div>",
        assetType = "test-content",
        sharedAt = DateTime.UtcNow,
        sessionId = SessionId.Value
    };

    await hubConnection.InvokeAsync("ShareAsset", SessionId.Value, testAssetData);
}
```

## Error Handling & Debugging

### Common Debug Markers
- `[DEBUG-WORKITEM:assetshare:continue]` - Asset sharing operations
- `[DEBUG-WORKITEM:hostcanvas:HUB-TRACK]` - Hub-level operations
- `[DEBUG-WORKITEM:hub:continue]` - Canvas reception events
- `[ASSETSHARE-DB]` - Database-driven asset detection

### Timeout Handling
The system implements timeout protection for SignalR operations:

```csharp
var shareTask = hubConnection.InvokeAsync("ShareAsset", SessionId.Value, assetData);
var timeoutTask = Task.Delay(5000);

var completedTask = await Task.WhenAny(shareTask, timeoutTask);

if (completedTask == timeoutTask)
{
    Logger.LogError("SignalR timeout after 5 seconds");
    await ShowErrorMessageAsync("Asset sharing timed out");
    return;
}
```

### Connection State Monitoring
The SessionCanvas provides real-time connection status:
- **Connected** - Green indicator, fully operational
- **Connecting** - Yellow indicator with spinner
- **Reconnecting** - Yellow indicator with rotation animation
- **Disconnected** - Red indicator with retry option

## Performance Considerations

### Asset Content Optimization
- HTML content is transmitted as raw strings
- Large assets may impact performance
- Content is transmitted once per share operation
- No persistent storage of shared content

### Broadcasting Efficiency
- Group-based targeting reduces bandwidth
- Single hub method handles all asset types
- Minimal payload wrapping
- Efficient JSON serialization

## Security Considerations

### Authentication & Authorization
- Session-based access control via tokens
- Group membership validation
- Connection context tracking

### Content Sanitization
The system includes HTML sanitization on the host side:

```csharp
private string SanitizeHtml(string html)
{
    // Remove hazardous elements entirely
    var removeSelectors = new[] { "script", "style", "iframe", "object", "embed", "link" };
    
    // Sanitize attributes on all elements
    foreach (var element in document.All)
    {
        // Remove event handlers (onclick, onerror, etc.)
        if (name.StartsWith("on", StringComparison.OrdinalIgnoreCase))
        {
            toRemove.Add(name);
        }
    }
}
```

## Implementation Best Practices

### Broadcast Tracking
Use unique tracking IDs for debugging:
```csharp
var broadcastId = Guid.NewGuid().ToString("N")[..8];
var hubTrackingId = Guid.NewGuid().ToString("N")[..8];
var canvasTrackingId = Guid.NewGuid().ToString("N")[..8];
```

### Logging Strategy
Implement structured logging with consistent patterns:
- **Entry Points:** `🎣 HUB ENTRY`, `🚀 STEP X/Y`
- **Success States:** `✅ SUCCESS`, `🎉 COMPLETE`
- **Error States:** `❌ ERROR`, `⚠️ WARNING`
- **Data Flow:** `📦 BROADCAST`, `📬 RECEIVE`, `🔄 UPDATE`

### Asset ID Matching
Ensure consistent ID matching between share buttons and target elements:
```csharp
// Share button
data-share-id="asset-ayah-card-1"

// Target asset element
data-asset-id="asset-ayah-card-1"
```

## Summary

The KSESSIONS-HUB SignalR broadcasting functionality provides a robust, real-time asset sharing system that:

1. **Detects assets** using SessionAssets API endpoint for session-specific asset management
2. **Extracts content** using HtmlAgilityPack for reliable server-side HTML parsing
3. **Injects share buttons** with data attribute matching system for easy identification
4. **Broadcasts content** via SessionHub using group-based targeting with timeout handling
5. **Receives and displays** shared assets in real-time on connected user sessions
6. **Provides comprehensive logging** and error handling with unique tracking IDs
7. **Supports dual content properties** (rawHtmlContent and testContent) for backward compatibility

The system uses an API-driven approach that enables real-time collaboration and content sharing in NOOR Canvas sessions, with enhanced error handling, timeout management, and comprehensive debug logging throughout the pipeline.