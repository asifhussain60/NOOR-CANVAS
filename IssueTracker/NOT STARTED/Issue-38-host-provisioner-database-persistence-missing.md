# Issue-38: Host Provisioner Not Saving to Database

## **Issue Summary**
Host Provisioner generates Host GUIDs but does not save records to `canvas.HostSessions` table.

## **Current Behavior**
- Host Provisioner generates GUID: `51179767-693b-49a1-b753-380ca3bb39f7`
- Session ID provided: `215`
- **Problem**: No record created in `canvas.HostSessions` table
- Both console tool and API endpoint affected

## **Root Cause**
Both Host Provisioner implementations are in **Phase 2 mode**:

### **Console Tool** (`Program.cs` line 157-158):
```csharp
// In a real implementation, this would save to database
// For Phase 2, we'll just log the generated values
```

### **API Endpoint** (`HostProvisionerController.cs`):
- Generates Host GUID and hash
- Returns response with GUID
- **Missing**: Database persistence to `canvas.HostSessions`

## **Expected Behavior**
When Host Provisioner generates Host GUID for Session ID 215:
1. Generate Host GUID: `51179767-693b-49a1-b753-380ca3bb39f7`
2. Compute HMAC-SHA256 hash
3. **Insert record** into `canvas.HostSessions`:
   ```sql
   INSERT INTO canvas.HostSessions 
   (SessionId, HostGuidHash, CreatedAt, CreatedBy, IsActive)
   VALUES (215, 'COMPUTED_HASH', GETUTCDATE(), 'Interactive User', 1)
   ```

## **Required Implementation**

### **Database Context Integration**
- Add `CanvasDbContext` dependency injection to Host Provisioner
- Implement actual database storage in both console tool and API endpoint

### **Console Tool Enhancement**
```csharp
// Replace placeholder with actual database save
var hostSession = new HostSession
{
    SessionId = sessionId,
    HostGuidHash = hostGuidHash,
    CreatedAt = DateTime.UtcNow,
    CreatedBy = createdBy ?? "Interactive User",
    IsActive = true,
    ExpiresAt = expiresAt
};

await context.HostSessions.AddAsync(hostSession);
await context.SaveChangesAsync();
```

### **API Endpoint Enhancement**
```csharp
// Add database persistence to HostProvisionerController
var hostSession = new HostSession
{
    SessionId = request.SessionId,
    HostGuidHash = hostGuidHash,
    CreatedAt = DateTime.UtcNow,
    CreatedBy = request.CreatedBy ?? "API User",
    IsActive = true
};

await _context.HostSessions.AddAsync(hostSession);
await _context.SaveChangesAsync();
```

## **Testing Requirements**
1. Generate Host GUID for Session ID 215
2. Verify record exists in `canvas.HostSessions`
3. Confirm `HostGuidHash` matches computed hash
4. Test both console tool and API endpoint

## **Priority**: 🔴 **HIGH** - Breaks host authentication workflow

## **Category**: 🐛 **Bug** - Missing core functionality

## **Impact**: Host authentication will fail in Phase 3+ when database validation is enabled

---

**Created**: September 13, 2025  
**Status**: Not Started  
**Assigned**: Database Integration Team
