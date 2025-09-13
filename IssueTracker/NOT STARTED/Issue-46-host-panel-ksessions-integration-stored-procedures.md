# Issue-46: Host Panel KSESSIONS Integration with Stored Procedures

## 📋 **Issue Summary**
**Title:** Host Control Panel should use KSESSIONS_DEV stored procedures instead of duplicating data  
**Priority:** 🔴 HIGH  
**Category:** 🔧 Enhancement  
**Status:** Not Started  
**Created:** September 13, 2025  

## 🔍 **Problem Analysis**

### **Current Incorrect Implementation:**
- Host Panel creates mock data for Albums, Categories, Sessions dropdowns
- Duplicates existing KSESSIONS database structure
- No integration with existing Islamic content management system
- Creates data synchronization and maintenance issues

### **Required Correct Implementation:**
- Use existing `KSESSIONS_DEV.dbo.Groups` table for Albums dropdown
- Use existing `KSESSIONS_DEV.dbo.Categories` table for Categories dropdown  
- Use existing `KSESSIONS_DEV.dbo.Sessions` table for Sessions dropdown
- Leverage existing stored procedures instead of creating new ones
- Maintain hierarchical relationship: Groups → Categories → Sessions

## 📊 **KSESSIONS Database Structure Analysis**

### **Key Tables (from KSESSIONS_Schema_Data.sql):**
```sql
-- Groups (Albums) - Islamic content collections
[dbo].[Groups] (
    [GroupID] int NOT NULL,
    [GroupName] varchar(150),
    [GroupImage] varchar(255),
    [IsActive] bit,
    [SpeakerID] int,
    [CreatedDate] datetime
)

-- Categories - Subdivisions within Groups
[dbo].[Categories] (
    [CategoryID] int NOT NULL,
    [CategoryName] varchar(150),
    [GroupID] int, -- FK to Groups
    [IsActive] bit,
    [SortOrder] int
)

-- Sessions - Individual Islamic learning sessions  
[dbo].[Sessions] (
    [SessionID] int NOT NULL,
    [Description] varchar(500),
    [GroupID] int, -- FK to Groups
    [CategoryID] int, -- FK to Categories
    [IsActive] bit,
    [Sequence] int
)

-- SessionTranscripts - Available for annotation
[dbo].[SessionTranscripts] (
    [TranscriptID] int NOT NULL,
    [SessionID] int, -- FK to Sessions
    [ChangedDate] datetime
)
```

### **Hierarchical Cascade Structure:**
1. **Albums (Groups)** → Load active Groups with Islamic content
2. **Categories** → Load Categories filtered by selected GroupID  
3. **Sessions** → Load Sessions filtered by selected CategoryID
4. **Validation** → Verify Session has transcripts before allowing Host creation

## 🛠 **Implementation Requirements**

### **API Endpoint Updates:**
```csharp
// Replace mock data with KSESSIONS queries
GET /api/host/albums → Query KSESSIONS_DEV.dbo.Groups WHERE IsActive = 1
GET /api/host/categories/{albumId} → Query KSESSIONS_DEV.dbo.Categories WHERE GroupID = {albumId} AND IsActive = 1  
GET /api/host/sessions/{categoryId} → Query KSESSIONS_DEV.dbo.Sessions WHERE CategoryID = {categoryId} AND IsActive = 1
GET /api/host/sessions/{sessionId}/transcripts → Verify SessionTranscripts exist
```

### **Entity Models Required:**
```csharp
// Models/KSESSIONS/KSessionsGroup.cs
public class KSessionsGroup 
{
    public int GroupID { get; set; }
    public string GroupName { get; set; }
    public string GroupImage { get; set; }
    public bool IsActive { get; set; }
    public int SpeakerID { get; set; }
    public DateTime CreatedDate { get; set; }
}

// Models/KSESSIONS/KSessionsCategory.cs  
public class KSessionsCategory
{
    public int CategoryID { get; set; }
    public string CategoryName { get; set; }
    public int GroupID { get; set; }
    public bool IsActive { get; set; }
    public int SortOrder { get; set; }
}

// Models/KSESSIONS/KSessionsSession.cs
public class KSessionsSession
{
    public int SessionID { get; set; }
    public string Description { get; set; }
    public int GroupID { get; set; }
    public int CategoryID { get; set; }
    public bool IsActive { get; set; }
    public int Sequence { get; set; }
}
```

### **Stored Procedures Integration:**
- **Identify existing stored procedures** in KSESSIONS for Groups/Categories/Sessions queries
- **Reuse existing logic** instead of creating duplicate Entity Framework queries
- **Maintain performance optimization** that existing stored procedures provide
- **Preserve business logic** embedded in existing procedures

## 🔄 **Database Integration Strategy**

### **Connection Management:**
- **Primary Connection:** KSESSIONS_DEV for Groups/Categories/Sessions (read-only)
- **Secondary Connection:** KSESSIONS_DEV.canvas for NOOR Canvas records (read-write)
- **Single Database:** Both schemas in same KSESSIONS_DEV database
- **Transaction Coordination:** Ensure consistency across schemas

### **Query Optimization:**
- **No-Tracking Queries:** Use AsNoTracking() for read-only KSESSIONS data
- **Caching Strategy:** Cache Groups/Categories for performance
- **Lazy Loading:** Load Sessions only when Category selected
- **Stored Procedure Calls:** Use FromSqlRaw() for existing procedures

### **Error Handling:**
- **Missing Groups:** "No Islamic content groups available"
- **Missing Categories:** "No categories found for selected album"
- **Missing Sessions:** "No sessions available for selected category"
- **No Transcripts:** "Selected session has no transcripts available for annotation"

## 🧪 **Test Scenarios**

### **Cascaded Loading Test:**
1. Load Albums → Should show KSESSIONS Groups where IsActive = true
2. Select Album → Should load Categories for that GroupID
3. Select Category → Should load Sessions for that CategoryID
4. Select Session → Should verify transcripts exist before enabling Host creation

### **Data Validation Test:**
- Verify all dropdown data comes from KSESSIONS_DEV, not mock data
- Confirm hierarchical relationships maintained (Group → Category → Session)
- Validate only Sessions with transcripts are selectable for Host creation
- Test performance with real KSESSIONS data volume

### **Integration Test:**
- Host Panel and Host Provisioner use same KSESSIONS data
- Session ID validation consistent across both components
- No data duplication between systems

## 📁 **Affected Files**
- `SPA/NoorCanvas/Controllers/HostController.cs` - Replace mock data with KSESSIONS queries
- `SPA/NoorCanvas/Data/KSessionsDbContext.cs` - Add Groups/Categories/Sessions entities
- `SPA/NoorCanvas/Models/KSESSIONS/` - Create entity models for KSESSIONS tables
- `SPA/NoorCanvas/Views/Host/Create.cshtml` - Update dropdown loading logic
- `Tools/HostProvisioner/HostProvisioner/Program.cs` - Align validation with Host Panel

## ✅ **Acceptance Criteria**
- [ ] Albums dropdown loads from KSESSIONS_DEV.dbo.Groups
- [ ] Categories dropdown filtered by GroupID from KSESSIONS_DEV.dbo.Categories
- [ ] Sessions dropdown filtered by CategoryID from KSESSIONS_DEV.dbo.Sessions  
- [ ] Only Sessions with transcripts available for Host creation
- [ ] No mock data remaining in Host Panel
- [ ] Existing stored procedures reused where possible
- [ ] Performance maintained with real data volume
- [ ] Host Provisioner validates same KSESSIONS data

## 🔗 **Related Issues**
- **Issue-45:** Host Provisioner SessionTranscripts validation (must use same data)
- **Issue-22:** Host endpoint missing (may be related to data integration)
- **Implementation Tracker Phase 2:** Host & Participant Core integration requirements

## 📚 **Research Required**
- [ ] Analyze KSESSIONS_Schema_Data.sql for stored procedures
- [ ] Identify existing Islamic content management workflows
- [ ] Understand Groups/Categories/Sessions business relationships
- [ ] Document performance characteristics of existing procedures

---
**Impact:** Critical data integration affecting entire Host workflow  
**Effort:** High (requires KSESSIONS schema analysis and stored procedure integration)  
**Dependencies:** KSESSIONS database access, stored procedure documentation, Issue-45 resolution
