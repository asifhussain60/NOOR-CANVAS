# Documentation Requirements (Document First, Report Later)

**Purpose:** Enforce comprehensive work-log documentation for investigation timeline reconstruction

**Principle:** Record ALL implementation details in work-log.md BEFORE reporting completion to user

---

## When to Document

**Before Implementation (Step 2.2.1):**
- User request summary
- High-priority constraints (ALL CAPS)
- Implementation plan (views, APIs, database, SignalR, services)
- File paths, method names, anticipated changes
- Testing strategy

**After Implementation (Step 8.3):**
- Work completed summary
- Files modified with line ranges
- Complete architectural context (see checklist below)
- Testing results
- Constraint verification
- Commit details

---

## Comprehensive Documentation Checklist

### ✅ Always Document

**1. User Request:**
- [ ] Succinct 1-2 sentence summary
- [ ] High-priority constraints (ALL CAPS from user)
- [ ] Timestamp (ISO-8601 format)

**2. Files Modified:**
- [ ] Complete file path (absolute from workspace root)
- [ ] Line ranges (start-end)
- [ ] What was added/modified/removed
- [ ] WORKITEM comment references (if applicable)

**3. Testing Results:**
- [ ] Manual verification steps performed
- [ ] Automated test file names and results
- [ ] Percy visual regression snapshot names
- [ ] Lint validation status (PASS/FAIL by file type)

**4. Commit Details:**
- [ ] Full SHA hash
- [ ] Commit message
- [ ] Git tag (checkpoint/{key}/{timestamp})
- [ ] Files changed count
- [ ] Lines added/deleted

---

### ✅ Conditional Documentation (Include if Applicable)

**If UI/Component Work:**
- [ ] **Views/Components** section
  - File paths (*.razor, *.cshtml)
  - Razor syntax changes (@if, @foreach, @code blocks)
  - Component parameters and event callbacks
  - HTML structure examples (key structural changes)
  - CSS classes added/modified (with purpose descriptions)
  - JavaScript event handlers (element selectors → handler functions)

**If API Work:**
- [ ] **API Endpoints** section
  - Controller name and file path
  - Method name and HTTP verb
  - Route template
  - Request model type
  - Response model type
  - Authentication requirements
  - Changes made to endpoint

**If Database Work:**
- [ ] **Database** section
  - Schema and table names
  - Operations performed (SELECT/INSERT/UPDATE/DELETE)
  - Columns affected
  - Migration file name (if created)
  - Connection string used (which appsettings.json entry)
  - Schema rules compliance (canvas.* READ/WRITE, others READ-ONLY)

**If SignalR Work:**
- [ ] **SignalR Hubs** section
  - Hub name and file path
  - Methods added/modified with parameters
  - Events broadcast with target groups
  - Client handler locations (connection.on in which files)
  - Payload structures (JSON examples)
  - Broadcast flow diagram (which component triggers → which hub → which clients receive)

**If Service Layer Work:**
- [ ] **Services** section
  - Service class name and file path
  - Methods added/modified with signatures
  - Dependencies injected via constructor
  - Algorithm descriptions (brief logic overview)
  - Data transformations performed

---

## Examples of Good Documentation

### Example 1: SignalR + Database + UI
```markdown
## Phase 2: Asset Share Implementation (2025-10-28 15:26)

### User Request
Restore blue Share Asset bar with SignalR broadcast while preserving golden wrapper container for visual grouping.

**High-Priority Constraints:**
- REMOVE kebab menu component from UI
- PRESERVE both blue bar AND golden wrapper (do not choose one)

### Implementation Plan

#### Affected Components
**Views/Components:**
- File: `SPA/NoorCanvas/Services/AssetProcessingService.cs`
- Lines: 361-394
- Changes: Add CreateShareButtonHtml method, modify CreateAssetContainerHeaderHtml to call it

**SignalR Hubs:**
- Hub: SessionHub (file: `SPA/NoorCanvas/Hubs/SessionHub.cs`)
- Methods: ShareAsset(string shareId, string assetType)
- Events: AssetShared
- Broadcast Target: session_{sessionId} group

**Services:**
- Service: AssetProcessingService (file: `SPA/NoorCanvas/Services/AssetProcessingService.cs`)
- Methods: CreateShareButtonHtml, CreateAssetContainerHeaderHtml
- Dependencies: ILogger<AssetProcessingService>, IHttpClientFactory

#### Implementation Strategy
1. Create CreateShareButtonHtml method to generate blue gradient bar with white Share Asset button
2. Update CreateAssetContainerHeaderHtml to call CreateShareButtonHtml BEFORE golden wrapper
3. Remove kebab menu HTML (asset-menu-wrapper div)
4. Add ks-share-button class with data attributes for SignalR broadcast
5. Preserve golden wrapper structure (asset-group-container)

#### Testing Plan
- Manual: Insert asset in session 212, verify blue bar + golden wrapper both visible, click Share Asset
- Automated: N/A (SignalR broadcast testing requires multi-client setup)
- Percy: N/A (asset wrapper styling unchanged from previous implementation)

---

### Work Completed (2025-10-28 15:45)

**Status**: Complete

#### Changes Summary
Added blue Share Asset bar generator method and restored it to asset wrapper output while removing kebab menu dropdown.

#### Files Modified

**Services:**
1. `SPA/NoorCanvas/Services/AssetProcessingService.cs` (lines 361-394)
   - Added: CreateShareButtonHtml method (lines 384-394) - Generates blue action-wrapper div with Share Asset button
   - Modified: CreateAssetContainerHeaderHtml (lines 361-380) - Calls CreateShareButtonHtml and removes kebab menu HTML
   - Removed: Kebab menu implementation (asset-menu-wrapper div with Share/Annotate dropdown)

#### SignalR Hubs

1. `SessionHub` (file: `SPA/NoorCanvas/Hubs/SessionHub.cs`)
   - Methods: ShareAsset(string shareId, string assetType) - UNCHANGED (existing method)
   - Events Broadcast: AssetShared to session_{sessionId} group
   - Client Handlers: `connection.on('AssetShared', ...)` in `HostControlPanelContent.razor`

#### HTML/CSS/JavaScript Changes

**HTML Structure:**
```html
<!-- Blue Share Asset Bar -->
<div class="action-wrapper" style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);">
  <button class="ks-share-button" data-share-id="{shareId}">Share Asset</button>
</div>

<!-- Golden Wrapper -->
<div class="asset-group-container">
  <div class="asset-header"><h3>{assetName}</h3></div>
  <div class="asset-content-wrapper">[asset content]</div>
</div>
```

**CSS Classes:**
- `.action-wrapper` - Blue gradient bar container (inline styles)
- `.ks-share-button` - SignalR broadcast button (white background, blue text)
- `.asset-group-container` - Golden wrapper with border and shadow

**JavaScript:**
- Event handlers: `.ks-share-button` → `shareAssetViaSignalR()` (click handler in HostControlPanelContent.razor)
- SignalR: `hubConnection.InvokeAsync('ShareAsset', shareId, assetType)` triggered on button click

#### Testing Results
- **Manual Verification**: Inserted hadees asset in session 212, verified blue bar appears above golden wrapper, button click logged to console - PASS
- **Automated Tests**: N/A
- **Percy Visual**: N/A
- **Lint Validation**: PASS (no C# syntax errors)

#### High-Priority Constraints Verified
- [PASS] Kebab menu removed from UI (user ALL CAPS: REMOVE kebab menu component)
- [PASS] Both blue bar AND golden wrapper present (user ALL CAPS: PRESERVE both elements)

#### Commit Details
- **SHA**: (pending commit)
- **Message**: `task(hcp-fab-button): Restore blue Share Asset bar + golden wrapper, remove kebab menu`
- **Tag**: checkpoint/hcp-fab-button/20251028-1545
- **Files Changed**: 1 (AssetProcessingService.cs)
- **Lines Changed**: +25 -10
```

---

## Anti-Patterns (What NOT to Do)

❌ **Vague descriptions:**
```markdown
- Updated the asset service
- Modified the component
- Fixed the database query
```

✅ **Specific descriptions:**
```markdown
- Updated AssetProcessingService.CreateAssetContainerHeaderHtml (line 361) to call CreateShareButtonHtml
- Modified HostControlPanelContent.razor OnBroadcastTranscript method to invoke SessionHub.ShareAsset
- Fixed database query in SessionRepository.GetActiveSessionsAsync to filter by Status = 'Active'
```

---

❌ **Missing architectural context:**
```markdown
### Work Completed
- Added share button
- Button works now
```

✅ **Complete architectural context:**
```markdown
### Work Completed

**SignalR Hubs:**
- Hub: SessionHub (file: SPA/NoorCanvas/Hubs/SessionHub.cs)
- Method: ShareAsset(string shareId, string assetType)
- Broadcast: Sends AssetShared event to session_{sessionId} group
- Client: HostControlPanelContent.razor connection.on('AssetShared', ...) receives event

**HTML Structure:**
[blue bar HTML + golden wrapper HTML example]
```

---

## Enforcement

**In task.prompt.md:**
- Step 2.2.1: Document BEFORE implementing
- Step 7: Validate documentation completeness BEFORE confirming
- Step 8.3: Append Work Completed section AFTER implementing

**In cohesion.prompt.md:**
- Step 4: Verify all phases documented with architectural context

**In plan.prompt.md:**
- Step 4: Generate comprehensive plan including API/DB/SignalR/Service sections

---

## Benefits

1. **Investigation Timeline Reconstruction:** Future developers can understand "why" and "how" decisions were made
2. **Searchable Knowledge Base:** grep/search for SignalR hubs, API endpoints, database schemas across all keys
3. **Handoff Readiness:** New team members can onboard by reading work-logs
4. **Debugging Aid:** When bugs appear, work-logs show complete data flow (UI → API → DB → SignalR)
5. **Code Review Quality:** Reviewers see full context without reading entire codebase
6. **Architectural Documentation:** Auto-generates system architecture map from aggregated work-logs

---

**Last Updated:** 2025-10-28  
**Applies To:** task.prompt.md, plan.prompt.md, cohesion.prompt.md, drift.prompt.md
