# Examples: No Code in Chat

## ✅ Compliant Examples

### Example 1: File Reference with Architectural Description

**Context:** User asks about share button implementation

**Compliant Response:**
```markdown
Updated ShareAsset functionality in AssetProcessingService.cs:
- Added CreateShareButtonHtml method (returns HTML string)
- Integrated with existing asset validation pipeline
- Data flow: Component → Service → Hub → Client

Implementation → See table-asset-enhancement/work-log.md lines 284-310
```

**Why Compliant:**
- No code blocks shown
- Architectural description only (method name, data flow)
- Clear reference to detailed implementation

---

### Example 2: Method Signature Reference

**Context:** Explaining validation changes

**Compliant Response:**
```markdown
Added validation method signature:
`ValidateAssetShare(string shareId, DateTime expiry) → Result<ShareLink>`

Logic:
1. Check shareId exists
2. Validate expiry > Now()
3. Generate secure token
4. Return ShareLink

Full validation algorithm → See table-asset-enhancement.plan.md "Phase 2: Validation"
```

**Why Compliant:**
- Signature shown (no implementation)
- Logic described at high level (steps, not code)
- Reference to detailed algorithm

---

### Example 3: Configuration JSON (≤10 lines)

**Context:** Updating appsettings for feature flag

**Compliant Response:**
```markdown
Added debug panel configuration:

```json
{
  "DebugPanel": {
    "Enabled": true,
    "ShowStatistics": true,
    "RefreshInterval": 5000
  }
}
```

This enables the debug panel across all views.
```

**Why Compliant:**
- JSON ≤10 lines (pure configuration, no logic)
- No implementation code
- Exception to rule (config allowed)

---

### Example 4: Data Flow Description

**Context:** Explaining real-time update mechanism

**Compliant Response:**
```markdown
Real-time update flow:
1. User action triggers client event
2. SignalR hub receives event
3. Hub broadcasts to SessionGroup
4. All clients in group update UI
5. State persistence to database (async)

Hub implementation → See signalr-disconnect/work-log.md section "Hub Methods"
Client handling → See signalr-disconnect.plan.md "Phase 3: Client Integration"
```

**Why Compliant:**
- Data flow described with components
- No code implementations
- Multiple references for details

---

## ❌ Non-Compliant Examples

### Example 1: Code Block in Response (VIOLATION)

**Context:** User asks about button click handler

**Violation:**
```markdown
Here's the button click handler:

```csharp
private async Task OnShareButtonClick()
{
    var shareId = Guid.NewGuid().ToString();
    var result = await AssetProcessor.ShareAsset(shareId, AssetType);
    
    if (result.Success)
    {
        await JSRuntime.InvokeVoidAsync("showNotification", "Share created!");
    }
}
```

This handles the share button click and shows notification.
```

**Why Non-Compliant:**
- C# code block shown (implementation)
- Method body with logic
- Violates core rule

**Fix:**
```markdown
Added OnShareButtonClick handler:
- Generates unique shareId
- Calls AssetProcessor.ShareAsset
- Shows success notification via JSRuntime

Handler implementation → See table-asset-enhancement/work-log.md lines 156-170
```

---

### Example 2: HTML Component Structure (VIOLATION)

**Context:** Explaining new UI component

**Violation:**
```markdown
Added share button component:

```html
<div class="share-container">
  <button class="btn btn-primary" @onclick="OnShareButtonClick">
    <i class="fas fa-share"></i>
    <span>Share Asset</span>
  </button>
  <div class="share-options">
    <input type="text" @bind="ShareExpiry" placeholder="Expiry (days)" />
    <select @bind="SharePermission">
      <option value="view">View Only</option>
      <option value="edit">Can Edit</option>
    </select>
  </div>
</div>
```

This creates the complete share UI.
```

**Why Non-Compliant:**
- Full HTML markup structure shown
- Component implementation details
- Multiple elements with attributes

**Fix:**
```markdown
Added share button component:
- Primary button with icon + text
- Expiry input field (days)
- Permission dropdown (view/edit)

Component markup → See table-asset-enhancement.plan.md "Phase 4: UI Components"
```

---

### Example 3: JavaScript Function (VIOLATION)

**Context:** Explaining client-side validation

**Violation:**
```markdown
Here's the validation function:

```javascript
function validateShareExpiry(days) {
  if (!days || days <= 0) {
    showError("Expiry must be positive");
    return false;
  }
  
  if (days > 365) {
    showError("Expiry cannot exceed 1 year");
    return false;
  }
  
  return true;
}
```

This ensures valid expiry values.
```

**Why Non-Compliant:**
- JavaScript function body shown
- Implementation logic visible
- Conditional branches in code

**Fix:**
```markdown
Added validateShareExpiry function:
- Checks: days > 0
- Checks: days ≤ 365
- Returns: boolean (shows error on invalid)

Validation logic → See table-asset-enhancement/work-log.md "Client Validation"
```

---

### Example 4: SQL Statement (VIOLATION)

**Context:** Explaining database query

**Violation:**
```markdown
Query to fetch share links:

```sql
SELECT s.ShareId, s.AssetId, s.ExpiryDate, s.Permission, a.FileName
FROM ShareLinks s
INNER JOIN Assets a ON s.AssetId = a.AssetId
WHERE s.UserId = @userId
  AND s.ExpiryDate > GETDATE()
  AND s.IsActive = 1
ORDER BY s.CreatedDate DESC;
```

This gets all active, non-expired shares for the user.
```

**Why Non-Compliant:**
- Full SQL statement shown
- JOIN logic visible
- WHERE clause implementation

**Fix:**
```markdown
Added GetActiveShareLinks query:
- Joins: ShareLinks → Assets
- Filters: userId, non-expired, active
- Ordering: CreatedDate DESC

Query → See table-asset-enhancement.plan.md "Database Queries" section
```

---

## 🔍 Edge Cases

### Edge Case 1: Configuration JSON >10 Lines

**Situation:**
User needs to update complex appsettings (25 lines of JSON).

**Decision:**
VIOLATION - Exceeds 10-line limit.

**Rationale:**
Even pure configuration should be concise in chat. Large configs belong in files.

**Correct Approach:**
```markdown
Updated appsettings.json with new section:
- Added EmailSettings (SMTP config)
- Added NotificationSettings (templates, timing)
- Added RetryPolicy (attempts, backoff)

Full configuration → See config/appsettings.json or plan.md "Configuration"
```

---

### Edge Case 2: Inline Code Reference (One-Liner)

**Situation:**
Need to reference a specific constant or variable for clarity.

**Decision:**
ALLOWED (single-line, no logic).

**Rationale:**
Brief references aid understanding without cluttering response.

**Example:**
```markdown
Updated timeout constant from `const TIMEOUT = 30000` to `60000` (60 seconds).

This affects all SignalR connection attempts.
```

---

### Edge Case 3: Shell Script (Multiple Lines)

**Situation:**
Deployment script with 15 lines of bash commands.

**Decision:**
VIOLATION - Implementation script, not configuration.

**Rationale:**
Scripts are implementation logic, belong in files.

**Correct Approach:**
```markdown
Created deployment script (deploy.sh):
- Builds application (dotnet publish)
- Copies to production server
- Restarts IIS app pool
- Validates deployment

Script → See Scripts/deploy.sh or deployment-plan.md
```

---

### Edge Case 4: Error Stack Trace

**Situation:**
Debugging error, need to show stack trace for context.

**Decision:**
ALLOWED (diagnostic output, not implementation).

**Rationale:**
Stack traces help diagnose issues; not implementation code.

**Example:**
```markdown
Error at AssetProcessor.ShareAsset (line 284):
```
System.ArgumentNullException: Value cannot be null. (Parameter 'shareId')
   at AssetProcessingService.ShareAsset(String shareId, String assetType)
   at ShareButton.OnClick() in ShareButton.razor:line 42
```

Root cause: Missing null check before ShareAsset call.
Fix → See work-log.md "Bug Fix: Null ShareId"
```

---

## 📊 Common Patterns

### Pattern 1: Method Addition Summary

**When to Use:**
Announcing new methods without showing implementation.

**How to Apply:**
- State method name + signature
- Describe purpose (1 sentence)
- List key steps (high-level)
- Reference detailed implementation

**Example:**
```markdown
Added ProcessShareRequest(ShareRequest request) method:
- Validates request parameters
- Generates unique share link
- Persists to database
- Returns ShareResult

Implementation → See table-asset-enhancement/work-log.md lines 200-245
```

---

### Pattern 2: Component Update Summary

**When to Use:**
Describing UI component changes without markup.

**How to Apply:**
- Name component/file
- List elements added/changed (no attributes)
- Describe functionality
- Reference markup file

**Example:**
```markdown
Updated ShareButton.razor component:
- Added expiry date picker
- Added permission dropdown
- Integrated validation feedback
- Wired to OnShareClick handler

Component → See SPA/NoorCanvas/Components/ShareButton.razor
```

---

### Pattern 3: Algorithm Description

**When to Use:**
Explaining complex logic without code.

**How to Apply:**
- Numbered steps (high-level)
- Conditional flows (if/then statements)
- Data transformations (input → output)
- Reference detailed algorithm

**Example:**
```markdown
Share link validation algorithm:
1. Parse shareId from URL
2. Query database for share record
3. IF expired → return 404
4. IF permission insufficient → return 403
5. ELSE → load asset and render

Detailed algorithm → See table-asset-enhancement.plan.md "Validation Logic"
```

---

### Pattern 4: Data Flow Diagram

**When to Use:**
Explaining multi-component interactions.

**How to Apply:**
- Component names with arrows
- Event triggers
- State changes
- References for each component's implementation

**Example:**
```markdown
Share creation flow:
ShareButton → AssetProcessor → Database → SignalR Hub → All Clients

1. ShareButton.OnClick → AssetProcessor.ShareAsset
2. AssetProcessor → Database.InsertShare
3. Database → AssetProcessor (ShareId)
4. AssetProcessor → SignalR.NotifyShareCreated
5. SignalR → All clients in SessionGroup
6. Clients → Update UI with new share

Component implementations → See table-asset-enhancement/work-log.md sections
```
