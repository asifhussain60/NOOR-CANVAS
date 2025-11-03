# Start Session Button Flow Map

**Generated:** 2025-11-03  
**Purpose:** Visual map of execution flow when Start Session button is clicked in HostControlPanel.razor

---

## 🎯 Visual Flow Map

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USER ACTION                                                  │
│ Click "Start Session" button                                    │
│ Location: HostControlPanelSidebar.razor                         │
│ Element ID: #sidebar-start-session-btn                          │
│ Line: 82                                                         │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. EVENT HANDLER (Parent Component)                             │
│ Function: StartSession()                                        │
│ Location: HostControlPanel.razor                                │
│ Line: 1325                                                       │
│                                                                  │
│ Actions:                                                         │
│ • Set isLoading = true                                           │
│ • Set Model.SessionStatus = "Starting"                           │
│ • Trigger UI update (StateHasChanged)                            │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2a. API CALL                                                    │
│ HTTP POST /api/host/session/{SessionId}/start                   │
│                    ?canvasType={selectedCanvasType}              │
│                                                                  │
│ Parameters:                                                      │
│ • SessionId: int (from Model.SessionId)                         │
│ • canvasType: string ("asset" or "transcript")                  │
│                                                                  │
│ Source: HostControlPanel.razor, Line 1342                       │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. API CONTROLLER ENDPOINT                                      │
│ Method: StartSession()                                          │
│ Location: Controllers/HostController.cs                         │
│ Line: 386                                                        │
│ Signature: [HttpPost("session/{sessionId}/start")]              │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3a. VALIDATE CANVAS TYPE                                        │
│ Location: HostController.cs, Line 393                           │
│                                                                  │
│ Valid types: ["asset", "transcript"]                            │
│ Default: "asset" (if invalid)                                   │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3b. DATABASE UPDATE                                             │
│ Location: HostController.cs, Line 404-417                       │
│                                                                  │
│ Table: Sessions (via EF Core _context)                          │
│ Fields Updated:                                                  │
│ • StartedAt = DateTime.UtcNow                                    │
│ • Status = "Active"                                              │
│ • CanvasType = canvasType.ToLowerInvariant()                    │
│                                                                  │
│ Operation: await _context.SaveChangesAsync()                    │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3c. SIGNALR BROADCAST                                           │
│ Location: HostController.cs, Line 419-433                       │
│                                                                  │
│ Hub: SessionHub (_sessionHub injected dependency)               │
│ Method: SendAsync("SessionBegan", sessionData)                  │
│ Target: Group $"session_{sessionId}"                            │
│                                                                  │
│ Payload (sessionData):                                           │
│ {                                                                │
│   sessionId: int,                                                │
│   groupId: int (AlbumId),                                        │
│   startedAt: DateTime,                                           │
│   expiresAt: DateTime,                                           │
│   maxParticipants: int,                                          │
│   canvasType: string                                             │
│ }                                                                │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3d. API RESPONSE                                                │
│ Location: HostController.cs, Line 435                           │
│                                                                  │
│ Returns: Ok(new {                                                │
│   success = true,                                                │
│   status = "Active",                                             │
│   canvasType = canvasType                                        │
│ })                                                               │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. RESPONSE HANDLER (Client)                                    │
│ Location: HostControlPanel.razor, Line 1343-1373                │
│                                                                  │
│ If successful:                                                   │
│ • Model.SessionStatus = "Active"                                 │
│ • sessionStartTime = DateTime.UtcNow                             │
│ • Re-transform transcript (inject share buttons)                │
│ • Show success message                                           │
│                                                                  │
│ If failed:                                                       │
│ • Model.SessionStatus = "Waiting" (revert)                       │
│ • Log error                                                      │
│ • Show error message                                             │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4a. TRANSCRIPT RE-TRANSFORMATION                                │
│ Location: HostControlPanel.razor, Line 1354                     │
│                                                                  │
│ Condition: Session active AND transcript exists                 │
│ Method: TransformTranscriptHtmlAsync(Model.SessionTranscript)   │
│ Purpose: Prepare HTML for share button injection                │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4a-1. HTML TRANSFORMATION SERVICE                               │
│ Location: HostControlPanel.razor, Line 2654-2680                │
│                                                                  │
│ Service: UnifiedHtmlTransformService                             │
│ Method: TransformForHostAsync(html, sessionId, status)          │
│                                                                  │
│ Operations:                                                      │
│ • Remove delete buttons from assets                             │
│ • Clean up host-only controls                                   │
│ • Prepare HTML structure for button injection                   │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4a-2. ASSET SHARE BUTTONS INJECTION (Server-Side)              │
│ Location: HostControlPanel.razor, Line 3190-3340                │
│                                                                  │
│ Step 1: Load Session Assets from API                            │
│   - GET /api/host/sessions/{sessionId}/assets                   │
│   - Returns: List<SessionAssetDto> (asset metadata)             │
│                                                                  │
│ Step 2: Inject data-asset-id Attributes                         │
│   Method: InjectAssetIdentifiers(html, assets)                  │
│   - Finds asset containers using CSS selectors                  │
│   - Adds data-asset-id="{assetId}" to containers                │
│   - Example: <div class="ayah-card" data-asset-id="123">        │
│                                                                  │
│ Step 3: Inject Share Asset Buttons                              │
│   Method: InjectShareButtons(html, assets)                      │
│   - Creates golden-themed share buttons                         │
│   - Inserts buttons BEFORE asset containers                     │
│   - Button HTML: <button data-asset-id="123">Share</button>     │
│   - Style: Golden background (#FFD700), centered                │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. UI UPDATE & RENDER                                           │
│ Location: HostControlPanel.razor, Line 1365-1373                │
│                                                                  │
│ Actions:                                                         │
│ • isLoading = false                                              │
│ • Model.TransformedTranscript updated with buttons              │
│ • StateHasChanged() - trigger Blazor re-render                  │
│ • Sidebar HIDDEN (conditional: SessionStatus != "Active")        │
│ • HostControlPanelContent SHOWN (status is "Active")             │
│ • Transcript HTML rendered to DOM                                │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. CLIENT-SIDE BUTTON INJECTION (After Render)                 │
│ Location: HostControlPanel.razor, Line 1395-1470                │
│ Trigger: HandleTranscriptRendered() callback                    │
│                                                                  │
│ Step 1: Wait for DOM to Stabilize                               │
│   - Task.Delay(100ms) for DOM update                            │
│                                                                  │
│ Step 2: Load JavaScript Module                                  │
│   - Check if TranscriptSectionParser exists                     │
│   - Dynamically inject script if missing                        │
│   - Script: /js/transcript-section-parser.js                    │
│                                                                  │
│ Step 3: Call JavaScript Injection                               │
│   - Method: TranscriptSectionParser.injectShareButtons()        │
│   - Parameters: (containerId, dotNetRef, canvasType)            │
│   - Container: "transcript-content-container"                   │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6a. JAVASCRIPT SECTION SHARE BUTTONS                            │
│ Location: wwwroot/js/transcript-section-parser.js               │
│ Method: injectShareButtons(containerId, dotNetRef, canvasType)  │
│                                                                  │
│ Operations:                                                      │
│ 1. Skip if canvasType !== "transcript"                          │
│    (Asset Canvas doesn't use section buttons)                   │
│                                                                  │
│ 2. Wait for container with polling                              │
│    - Max 20 attempts × 250ms = 5 seconds                        │
│    - Check: Container exists AND has content                    │
│                                                                  │
│ 3. Find all <h2> elements in transcript                         │
│    - Identifies section headings                                │
│                                                                  │
│ 4. For each <h2> section:                                       │
│    a. Create section wrapper div                                │
│       - ID: "transcript-section-{index}"                        │
│       - Contains: h2 + content until next h2                    │
│                                                                  │
│    b. Create golden share button                                │
│       - Style: Golden (#FFD700), centered                       │
│       - Text: "Share Section"                                   │
│       - Data attributes: section-id, h2-index, h2-text          │
│                                                                  │
│    c. Insert button BEFORE section wrapper                      │
│       - Order: [Button Wrapper] → [Section Wrapper]             │
│       - Button appears above h2 heading                         │
│                                                                  │
│ 5. Set up click event delegation                                │
│    - Single listener on container (event bubbling)              │
│    - Handles all share button clicks                            │
│                                                                  │
│ Result:                                                          │
│ • Each h2 section has a "Share Section" button above it         │
│ • Buttons extract section HTML and call C# callback             │
│ • Visual feedback: Loading spinner → Success/Error              │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. SHARE BUTTON CLICK HANDLERS (Ready)                         │
│                                                                  │
│ Asset Share Buttons (Server-rendered):                          │
│ • Click → JavaScript event → C# ShareAsset() callback           │
│ • Extracts asset HTML using data-asset-id                       │
│ • Broadcasts via SignalR to participants                        │
│                                                                  │
│ Section Share Buttons (Client-injected):                        │
│ • Click → JavaScript event delegation                           │
│ • Clones section wrapper, removes share controls                │
│ • Calls C# ShareTranscriptSection() via DotNet interop          │
│ • Broadcasts section HTML via SignalR                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## � Share Button Injection Flow

The Start Session process triggers a **two-phase share button injection system** that enables hosts to share content with participants:

### Phase 1: Server-Side Asset Button Injection

**When:** During transcript transformation (Step 4a-2)  
**Technology:** C# / Razor (server-side)  
**Target:** Individual assets (Ayah cards, images, etc.)

```
TransformTranscriptHtmlAsync()
    ↓
UnifiedHtmlTransformService.TransformForHostAsync()
    ↓
Load assets from API → /api/host/sessions/{id}/assets
    ↓
InjectAssetIdentifiers() → Add data-asset-id attributes
    ↓
InjectShareButtons() → Insert golden share buttons BEFORE assets
    ↓
Result: HTML with asset share buttons (server-rendered)
```

**Asset Button Structure:**
```html
<!-- Button Wrapper (Golden theme) -->
<div class="share-wrapper" data-noor-share-control="true" 
     style="background-color: #f7f3e0; padding: 20px; text-align: center;">
  <button class="share-button" data-asset-id="123">
    <i class="fas fa-share-alt"></i> Share
  </button>
</div>

<!-- Asset Container (with ID injected) -->
<div class="ayah-card" data-asset-id="123">
  <!-- Asset content -->
</div>
```

### Phase 2: Client-Side Section Button Injection

**When:** After DOM render (Step 6)  
**Technology:** JavaScript (client-side)  
**Target:** Transcript sections (h2 groupings)

```
HandleTranscriptRendered() callback
    ↓
Wait for DOM to stabilize (100ms)
    ↓
Load TranscriptSectionParser.js
    ↓
TranscriptSectionParser.injectShareButtons()
    ↓
    1. Find all <h2> elements
    2. Group content between h2 tags
    3. Create wrapper divs for each section
    4. Inject golden "Share Section" buttons ABOVE h2
    5. Set up click event delegation
    ↓
Result: Each h2 section has a share button (client-rendered)
```

**Section Button Structure:**
```html
<!-- Button Wrapper (Golden theme) -->
<div class="share-wrapper" data-noor-share-control="true">
  <button class="transcript-section-share-btn" 
          data-section-id="transcript-section-0"
          data-h2-index="0"
          data-h2-text="Introduction">
    <i class="fas fa-share-alt"></i> Share Section
  </button>
</div>

<!-- Section Wrapper -->
<div id="transcript-section-0" data-section-index="0">
  <h2>Introduction</h2>
  <p>Section content...</p>
  <!-- More content until next h2 -->
</div>
```

### Why Two Phases?

| Aspect | Server-Side (Assets) | Client-Side (Sections) |
|--------|---------------------|------------------------|
| **Data Source** | Database (SessionAssets table) | DOM parsing (h2 elements) |
| **Timing** | During initial HTML transformation | After Blazor render complete |
| **Complexity** | Requires asset metadata from DB | Lightweight DOM manipulation |
| **Performance** | One-time during transform | Fast client-side injection |
| **Flexibility** | Tied to database records | Dynamic based on HTML structure |

### Click Handling

**Asset Buttons:**
- Event: Direct click handler
- Callback: `ShareAsset(shareId, assetType, instanceNumber)`
- Flow: Extract HTML using `data-asset-id` → Broadcast via SignalR

**Section Buttons:**
- Event: Delegated click handler (container listener)
- Callback: `ShareTranscriptSection(sectionId, sectionHtml, h2Text)`
- Flow: Clone section wrapper → Remove share controls → Broadcast via SignalR

### Golden Theme Consistency

Both button types use the **golden NOOR Canvas theme**:
- Background: `#FFD700` (gold)
- Border: `#e0c242` (darker gold)
- Hover: `#e0c242` (darkens)
- Icon: Font Awesome `fa-share-alt`
- Style: Centered, rounded corners, shadow

---

## �📊 Execution Summary

### Components Involved
1. **HostControlPanelSidebar.razor** - UI button component
2. **HostControlPanel.razor** - Parent page with event handler
3. **HostController.cs** - API endpoint
4. **SessionHub** (SignalR) - Real-time broadcast
5. **Database** (EF Core) - Session state persistence

### Key Data Flow
```
Button Click → StartSession() → HTTP POST → Controller Action
    ↓
Database Update (Sessions table)
    ↓
SignalR Broadcast ("SessionBegan" event to all participants)
    ↓
HTTP Response → Client Handler → UI Update
```

### Side Effects
- **Database:** Sessions table updated (Status, StartedAt, CanvasType)
- **SignalR:** All connected clients in session group notified
- **UI:** Sidebar hidden, main content panel shown
- **State:** Session timer starts, controls become active

---

## 🔍 Key Code Locations

| Component | Location | Line(s) | Purpose |
|-----------|----------|---------|---------|
| **Start Session Flow** ||||
| Button Element | `Components/Host/HostControlPanelSidebar.razor` | 82-91 | UI button with ID `sidebar-start-session-btn` |
| Event Handler | `Pages/HostControlPanel.razor` | 1325-1376 | `StartSession()` method |
| API Endpoint | `Controllers/HostController.cs` | 386-442 | `[HttpPost("session/{sessionId}/start")]` |
| Database Context | `Controllers/HostController.cs` | 410-417 | EF Core SaveChangesAsync() |
| SignalR Broadcast | `Controllers/HostController.cs` | 429-433 | SendAsync("SessionBegan") |
| **Share Button Injection** ||||
| HTML Transform Entry | `Pages/HostControlPanel.razor` | 2654-2680 | `TransformTranscriptHtmlAsync()` |
| Transform Service | `Services/UnifiedHtmlTransformService.cs` | N/A | `TransformForHostAsync()` |
| Asset ID Injection | `Pages/HostControlPanel.razor` | 3240-3280 | `InjectAssetIdentifiers()` |
| Asset Button Injection | `Pages/HostControlPanel.razor` | 3282-3340 | `InjectShareButtons()` |
| Render Callback | `Pages/HostControlPanel.razor` | 1395-1470 | `HandleTranscriptRendered()` |
| Section Parser Script | `wwwroot/js/transcript-section-parser.js` | 1-450 | JavaScript module |
| Section Button Injection | `wwwroot/js/transcript-section-parser.js` | 45-250 | `injectShareButtons()` |
| Click Delegation | `wwwroot/js/transcript-section-parser.js` | 252-350 | `setupClickDelegation()` |
| **Click Handlers** ||||
| Share Asset (C#) | `Pages/HostControlPanel.razor` | 1512-1550 | `ShareAsset()` JSInvokable |
| Share Section (C#) | `Pages/HostControlPanel.razor` | 1552-1620 | `ShareTranscriptSection()` JSInvokable |

---

## 🧪 Testing Points

Based on this flow, test the following:

### 1. Button State & Start Session
   - ✅ Start button enabled only when canvas selected
   - ✅ Disabled when loading or session active
   - ✅ Has unique ID `#sidebar-start-session-btn`
   - ✅ Correct endpoint: `/api/host/session/{id}/start`
   - ✅ Query parameter: `canvasType` passed correctly

### 2. Database & SignalR
   - ✅ Session status changes to "Active"
   - ✅ StartedAt timestamp set
   - ✅ CanvasType persisted
   - ✅ "SessionBegan" event broadcasted
   - ✅ All participants receive notification
   - ✅ Payload includes canvasType

### 3. Asset Share Buttons (Server-Side)
   - ✅ API loads SessionAssets correctly
   - ✅ `data-asset-id` attributes injected into containers
   - ✅ Share buttons appear BEFORE asset containers
   - ✅ Buttons have golden theme (#FFD700)
   - ✅ Buttons centered in wrapper divs
   - ✅ Click triggers `ShareAsset()` C# method
   - ✅ Asset HTML extracted correctly
   - ✅ SignalR broadcast to participants successful

### 4. Section Share Buttons (Client-Side)
   - ✅ TranscriptSectionParser.js loads successfully
   - ✅ Script waits for DOM before injection
   - ✅ All `<h2>` elements detected
   - ✅ Section content grouped correctly (h2 + content until next h2)
   - ✅ Share buttons injected ABOVE each section
   - ✅ Buttons only appear for "transcript" canvas type
   - ✅ Click event delegation works
   - ✅ Section HTML cloned and cleaned (removes share controls)
   - ✅ Event handlers stripped from HTML (XSS prevention)
   - ✅ `ShareTranscriptSection()` C# callback successful
   - ✅ Visual feedback: Spinner → Success/Error

### 5. UI State & Visual Testing
   - ✅ Sidebar hidden after start
   - ✅ Main content panel visible
   - ✅ Success message shown
   - ✅ Loading spinner behavior correct
   - ✅ Both button types visible and styled correctly
   - ✅ Golden theme consistent across both types
   - ✅ Hover effects work (color darkens)
   - ✅ Buttons don't overlap or cause layout issues

### 6. Canvas Type Routing
   - ✅ Asset Canvas: Only asset buttons injected
   - ✅ Transcript Canvas: Both asset AND section buttons injected
   - ✅ Section button injection skipped for asset canvas

---

## 📝 Notes

### Session Management
- **Canvas Type Selection:** Users must select "Transcript Canvas" or "Asset Canvas" before Start Session button is enabled
- **SignalR Groups:** Session uses group naming pattern `session_{sessionId}` for targeted broadcasts
- **State Management:** Parent component (HostControlPanel) manages session state, child component (Sidebar) only renders UI
- **Error Recovery:** Failed start attempts revert status to "Waiting" and show error message

### Share Button Architecture

**Two-Phase Design:**
1. **Server-Side (Assets):** Buttons injected during HTML transformation on server
2. **Client-Side (Sections):** Buttons injected after Blazor render using JavaScript

**Why This Approach?**
- Assets require database metadata (SessionAssets table) → Server-side
- Sections are purely HTML-based (h2 parsing) → Client-side
- Separation improves performance and maintainability

**Button Marker:** Both types use `data-noor-share-control="true"` attribute for unified cleanup

**Security:**
- Section HTML is cloned before broadcast
- All event handlers (`onclick`, `onload`, etc.) are stripped
- Share control elements removed to prevent recursive sharing

**Canvas Type Behavior:**
- **Asset Canvas:** Only asset share buttons (server-side)
- **Transcript Canvas:** Both asset AND section share buttons
- Section injection skipped if `canvasType !== "transcript"`

**Event Handling:**
- Asset buttons: Direct click handlers
- Section buttons: Event delegation (single container listener)
- Both call C# methods via JSInvokable/DotNet interop

**Visual Consistency:**
- Golden NOOR Canvas theme (#FFD700)
- Centered button layout
- Font Awesome icons
- Loading spinner → Success/Error feedback

---

**Generated by KDS Investigation**  
**Method:** Manual code tracing (no crawler needed for single-flow analysis)  
**Confidence:** High (traced actual code paths with line numbers)
