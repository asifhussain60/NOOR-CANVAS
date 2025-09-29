# KSESSIONS-HUB SignalR Broadcasting Documentation

## Overview
The NOOR Canvas SignalR hub service enables real-time broadcasting of assets from the Host Control Panel to connected user sessions. This document details the successful implementation pattern for assetshare functionality using database-driven detection.

## Hub Service Architecture

### SessionHub (/hub/session)
Located at: `SPA/NoorCanvas/Hubs/SessionHub.cs`

The SessionHub provides the core SignalR functionality for broadcasting assets detected via the `canvas.AssetLookup` table to connected user sessions.

**Key Methods:**
- `ShareAsset()` - Broadcasts asset HTML to group members
- Group management for session-based targeting
- Comprehensive logging and error handling

### Database-Driven Asset Detection

#### AssetLookup Table Schema
```sql
-- canvas.AssetLookup table structure
CREATE TABLE [canvas].[AssetLookup] (
    [AssetId] bigint IDENTITY(1,1) PRIMARY KEY,
    [AssetIdentifier] nvarchar(100) NOT NULL, -- e.g., 'ayah-card', 'inserted-hadees'
    [AssetType] nvarchar(50) NOT NULL,        -- Asset category
    [CssSelector] nvarchar(200),              -- CSS selector for detection
    [DisplayName] nvarchar(100),              -- Human-readable name for buttons
    [IsActive] bit NOT NULL DEFAULT 1,        -- Enable/disable flag
    [CreatedAt] datetime2 NOT NULL
)
```

#### Predefined Asset Types (8 Total)
1. **ayah-card** - `.ayah-card` - Ayah Card
2. **inserted-hadees** - `.inserted-hadees` - Inserted Hadees
3. **etymology-card** - `.etymology-card` - Etymology Card  
4. **etymology-derivative-card** - `.etymology-derivative-card` - Etymology Derivative Card
5. **esotericBlock** - `.esotericBlock` - Esoteric Block
6. **verse-container** - `.verse-container` - Verse Container
7. **table** - `table[style="width: 100%;"]` - Table
8. **imgResponsive** - `.imgResponsive` - Responsive Image

## Implementation Pattern

### 1. Asset Detection (Host Side)
**Location:** `SPA/NoorCanvas/Pages/HostControlPanel.razor`
**Method:** `InjectAssetShareButtonsDatabaseAsync()`

```csharp
// Database-driven approach using AssetLookup table
var assetLookups = await SimplifiedCanvasDb.AssetLookup
    .Where(a => a.IsActive && !string.IsNullOrEmpty(a.CssSelector))
    .OrderBy(a => a.AssetIdentifier)
    .ToListAsync();

// Process each asset type using CSS selectors
foreach (var assetLookup in assetLookups.AsEnumerable().Reverse())
{
    var elements = document.QuerySelectorAll(assetLookup.CssSelector ?? string.Empty);
    
    foreach (var element in elements)
    {
        var shareId = $"asset-{assetLookup.AssetIdentifier}-{i + 1}";
        element.SetAttribute("data-asset-id", shareId);
        
        // Inject red share button before element
        var shareButton = CreateRedShareButtonHtml(
            assetLookup.AssetIdentifier, 
            assetLookup.DisplayName ?? assetLookup.AssetIdentifier, 
            shareId, 
            i + 1
        );
    }
}
```

### 2. Red Share Button Injection

**Button HTML Structure:**
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
- **Red styling** (`#dc3545`) for visibility
- **Simple ID matching** between share button `data-share-id` and asset `data-asset-id`
- **Instance numbering** for multiple assets of same type
- **Click handler** integration with SignalR broadcast

### 3. SignalR Broadcast Workflow

#### Host Side (Share Button Click)
**Method:** `ShareAsset()` in HostControlPanel.razor

```csharp
[JSInvokable]
public async Task ShareAsset(string shareId, string assetType, int instanceNumber)
{
    // Step 1: Extract asset HTML using data-asset-id matching
    var rawAssetHtml = ExtractAssetHtml(shareId);
    
    // Step 2: Create broadcast payload
    var assetData = new {
        shareId = shareId,
        assetType = assetType,
        instanceNumber = instanceNumber,
        rawHtmlContent = rawAssetHtml,
        timestamp = DateTime.UtcNow
    };
    
    // Step 3: Broadcast via SignalR Hub
    await hubConnection.InvokeAsync("ShareAsset", SessionId.Value, assetData);
    
    Logger.LogInformation("[DEBUG-WORKITEM:assetshare:continue] ✅ Asset broadcasted to session_{SessionId}", SessionId.Value);
}
```

#### Hub Processing (SessionHub.cs)
```csharp
public async Task ShareAsset(int sessionId, object assetData)
{
    var hubTrackingId = Guid.NewGuid().ToString("N")[..8];
    var groupName = $"session_{sessionId}";
    
    // Broadcast to all users in the session group
    await Clients.Group(groupName).SendAsync("AssetShared", assetData);
    
    _logger.LogInformation("[DEBUG-WORKITEM:hostcanvas:HUB-TRACK] ✅ AssetShared message sent to group {GroupName}", groupName);
}
```

#### User Side Reception (SessionCanvas.razor)
```javascript
hubConnection.On("AssetShared", async (assetData) => {
    console.log("[DEBUG-WORKITEM:hub:continue] 📬 CANVAS RECEIVE: AssetShared event received");
    
    // Process received asset HTML
    if (assetData && assetData.rawHtmlContent) {
        // Inject asset into canvas display area
        await injectSharedAsset(assetData.rawHtmlContent);
    }
});
```

## Testing and Validation

### Database Detection Test
**Location:** `Tests/UI/assetlookup-database-detection.spec.ts`

Validates:
- AssetLookup table integration
- CSS selector-based detection
- Red share button injection
- Data attribute matching between buttons and assets
- SignalR broadcast functionality

### URL for Testing
**Host Control Panel:** https://localhost:9091/host/control-panel/PQ9N5YWW
**User Landing:** https://localhost:9091/user/landing/KJAHA99L
**SessionCanvas:** https://localhost:9091/session/canvas/testuser123

## Success Indicators

### Console Logging
- `[ASSETSHARE-DB]` - Database-driven detection activity
- `[DEBUG-WORKITEM:assetshare:continue]` - Share button operations
- `[DEBUG-WORKITEM:hostcanvas:HUB-TRACK]` - Hub broadcasting
- `[DEBUG-WORKITEM:hub:continue] 📬 CANVAS RECEIVE` - User reception

### Visual Validation
1. **Red share buttons** appear before detected assets
2. **Asset elements** have `data-asset-id` attributes matching button `data-share-id`
3. **Click response** - buttons briefly show "SHARING..." state
4. **SessionCanvas** receives and displays shared asset HTML

## Migration from Regex to Database

The implementation successfully transitioned from regex-based asset detection to database-driven detection using the `canvas.AssetLookup` table. This provides:

- **Consistent detection** across all asset types
- **Easy configuration** via database records
- **Performance optimization** through indexed lookups
- **Maintainable selectors** without code changes

## Configuration Management

Asset types can be managed by updating the `canvas.AssetLookup` table:

```sql
-- Enable/disable asset types
UPDATE canvas.AssetLookup SET IsActive = 0 WHERE AssetIdentifier = 'etymology-card';

-- Add new asset type
INSERT INTO canvas.AssetLookup (AssetIdentifier, AssetType, CssSelector, DisplayName, IsActive, CreatedAt)
VALUES ('new-asset', 'content', '.new-asset-class', 'New Asset Type', 1, GETUTCDATE());
```

## Summary

The database-driven assetshare functionality provides a robust, maintainable system for:
1. **Asset Detection** via CSS selectors from AssetLookup table
2. **Share Button Injection** with simple ID matching system
3. **SignalR Broadcasting** from host to connected user sessions
4. **Real-time Asset Sharing** with comprehensive logging and error handling

The system successfully replaces complex regex patterns with a simple, database-driven approach that is both performant and easily configurable.