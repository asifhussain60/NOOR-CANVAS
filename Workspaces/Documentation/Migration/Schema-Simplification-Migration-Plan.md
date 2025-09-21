# NOOR Canvas Schema Simplification Migration Plan

**Migration Type**: Major Schema Simplification  
**Target**: 15-table → 3-table ultra-minimal design  
**Data Safety**: Complete data preservation during transition  
**Rollback**: Full rollback capability maintained

---

## 🎯 **MIGRATION OVERVIEW**

### **Current State (15 Tables)**

```
canvas.Sessions, canvas.SessionLinks, canvas.HostSessions, canvas.AdminSessions,
canvas.Users, canvas.Registrations, canvas.SharedAssets, canvas.Annotations,
canvas.Questions, canvas.QuestionAnswers, canvas.QuestionVotes, canvas.AuditLogs,
canvas.Issues, canvas.SessionParticipants, canvas.SecureTokens
```

### **Target State (3 Tables)**

```
canvas.Sessions_New, canvas.Participants_New, canvas.SessionData_New
```

### **Migration Benefits**

- **80% table reduction** (15 → 3 tables)
- **Simplified Entity Framework** context
- **Faster query performance** with minimal JOINs
- **Easier maintenance** and development
- **Preserved functionality** for all core features

---

## 📋 **PHASE 1: CREATE NEW SIMPLIFIED SCHEMA**

### **Step 1.1: Create New Tables**

```sql
-- New Sessions table with embedded tokens
CREATE TABLE [canvas].[Sessions_New] (
    SessionId       INT IDENTITY(1,1) PRIMARY KEY,
    HostToken       VARCHAR(8) UNIQUE NOT NULL,        -- e.g., IIZVVHXI
    UserToken       VARCHAR(8) UNIQUE NOT NULL,        -- e.g., BBQQMNET
    Title           VARCHAR(200),
    Description     VARCHAR(500),
    Status          VARCHAR(20) DEFAULT 'Active',
    CreatedAt       DATETIME2 DEFAULT GETUTCDATE(),
    ExpiresAt       DATETIME2,
    CreatedBy       VARCHAR(100),

    -- Indexes for performance
    INDEX IX_Sessions_HostToken (HostToken),
    INDEX IX_Sessions_UserToken (UserToken),
    INDEX IX_Sessions_Status_Expires (Status, ExpiresAt)
);

-- Unified Participants table
CREATE TABLE [canvas].[Participants_New] (
    ParticipantId   INT IDENTITY(1,1) PRIMARY KEY,
    SessionId       INT NOT NULL,
    UserGuid        VARCHAR(256),              -- For cross-session identification
    Name            VARCHAR(100),
    Country         VARCHAR(100),
    City            VARCHAR(100),
    JoinedAt        DATETIME2 DEFAULT GETUTCDATE(),
    LastSeenAt      DATETIME2,

    -- Foreign key and indexes
    FOREIGN KEY (SessionId) REFERENCES [canvas].[Sessions_New](SessionId),
    INDEX IX_Participants_Session (SessionId),
    INDEX IX_Participants_UserGuid (UserGuid)
);

-- Universal content storage table
CREATE TABLE [canvas].[SessionData_New] (
    DataId          INT IDENTITY(1,1) PRIMARY KEY,
    SessionId       INT NOT NULL,
    DataType        VARCHAR(20) NOT NULL,      -- 'SharedAsset', 'Annotation', 'Question', 'QuestionAnswer'
    Content         NVARCHAR(MAX),             -- JSON blob for flexible storage
    CreatedBy       VARCHAR(100),
    CreatedAt       DATETIME2 DEFAULT GETUTCDATE(),
    IsDeleted       BIT DEFAULT 0,

    -- Foreign key and indexes
    FOREIGN KEY (SessionId) REFERENCES [canvas].[Sessions_New](SessionId),
    INDEX IX_SessionData_Session_Type (SessionId, DataType),
    INDEX IX_SessionData_Created (CreatedAt),
    INDEX IX_SessionData_Active (SessionId, IsDeleted, CreatedAt)
);
```

---

## 📊 **PHASE 2: DATA MIGRATION SCRIPTS**

### **Step 2.1: Migrate Sessions Data**

```sql
-- Migrate Sessions with embedded token data
INSERT INTO [canvas].[Sessions_New] (
    HostToken, UserToken, Title, Description, Status,
    CreatedAt, ExpiresAt, CreatedBy
)
SELECT
    COALESCE(st.HostToken, SUBSTRING(CONVERT(VARCHAR(36), NEWID()), 1, 8)) AS HostToken,
    COALESCE(st.UserToken, SUBSTRING(CONVERT(VARCHAR(36), NEWID()), 1, 8)) AS UserToken,
    s.Title,
    s.Description,
    CASE
        WHEN s.Status IS NULL THEN 'Active'
        ELSE s.Status
    END AS Status,
    s.CreatedAt,
    DATEADD(HOUR, 3, s.CreatedAt) AS ExpiresAt,  -- Default 3-hour expiry
    COALESCE(hs.CreatedBy, 'System') AS CreatedBy
FROM [canvas].[Sessions] s
LEFT JOIN [canvas].[SecureTokens] st ON st.SessionId = s.SessionId
LEFT JOIN [canvas].[HostSessions] hs ON hs.SessionId = s.SessionId;
```

### **Step 2.2: Migrate Participant Data**

```sql
-- Migrate Users + Registrations → Participants
INSERT INTO [canvas].[Participants_New] (
    SessionId, UserGuid, Name, Country, City,
    JoinedAt, LastSeenAt
)
SELECT
    sn.SessionId,           -- Map to new session ID
    u.UserGuid,
    u.Name,
    r.Country,
    u.City,
    r.CreatedAt AS JoinedAt,
    u.LastSeenAt
FROM [canvas].[Users] u
INNER JOIN [canvas].[Registrations] r ON r.UserId = u.UserId
INNER JOIN [canvas].[Sessions] s ON s.SessionId = r.SessionId
INNER JOIN [canvas].[Sessions_New] sn ON sn.HostToken = COALESCE(
    (SELECT st.HostToken FROM [canvas].[SecureTokens] st WHERE st.SessionId = s.SessionId),
    SUBSTRING(CONVERT(VARCHAR(36), s.HostGuid), 1, 8)
);
```

### **Step 2.3: Migrate Content Data**

```sql
-- Migrate SharedAssets
INSERT INTO [canvas].[SessionData_New] (SessionId, DataType, Content, CreatedBy, CreatedAt)
SELECT
    sn.SessionId,
    'SharedAsset' AS DataType,
    JSON_OBJECT(
        'AssetSelector', sa.AssetSelector,
        'AssetPosition', sa.AssetPosition,
        'AssetMetadata', sa.AssetMetadata,
        'ShareCount', sa.ShareCount
    ) AS Content,
    sa.SharedBy AS CreatedBy,
    sa.SharedAt AS CreatedAt
FROM [canvas].[SharedAssets] sa
INNER JOIN [canvas].[Sessions] s ON s.SessionId = sa.SessionId
INNER JOIN [canvas].[Sessions_New] sn ON sn.HostToken = COALESCE(
    (SELECT st.HostToken FROM [canvas].[SecureTokens] st WHERE st.SessionId = s.SessionId),
    SUBSTRING(CONVERT(VARCHAR(36), s.HostGuid), 1, 8)
);

-- Migrate Annotations
INSERT INTO [canvas].[SessionData_New] (SessionId, DataType, Content, CreatedBy, CreatedAt)
SELECT
    sn.SessionId,
    'Annotation' AS DataType,
    a.AnnotationData AS Content,
    a.CreatedBy,
    a.CreatedAt
FROM [canvas].[Annotations] a
INNER JOIN [canvas].[Sessions] s ON s.SessionId = a.SessionId
INNER JOIN [canvas].[Sessions_New] sn ON sn.HostToken = COALESCE(
    (SELECT st.HostToken FROM [canvas].[SecureTokens] st WHERE st.SessionId = s.SessionId),
    SUBSTRING(CONVERT(VARCHAR(36), s.HostGuid), 1, 8)
)
WHERE a.IsDeleted = 0;

-- Migrate Questions
INSERT INTO [canvas].[SessionData_New] (SessionId, DataType, Content, CreatedBy, CreatedAt)
SELECT
    sn.SessionId,
    'Question' AS DataType,
    JSON_OBJECT(
        'QuestionId', q.QuestionId,
        'QuestionText', q.QuestionText,
        'VoteCount', q.VoteCount,
        'Status', q.Status,
        'QueuedAt', q.QueuedAt
    ) AS Content,
    COALESCE(p.Name, 'Anonymous') AS CreatedBy,
    q.QueuedAt AS CreatedAt
FROM [canvas].[Questions] q
INNER JOIN [canvas].[Sessions] s ON s.SessionId = q.SessionId
INNER JOIN [canvas].[Sessions_New] sn ON sn.HostToken = COALESCE(
    (SELECT st.HostToken FROM [canvas].[SecureTokens] st WHERE st.SessionId = s.SessionId),
    SUBSTRING(CONVERT(VARCHAR(36), s.HostGuid), 1, 8)
)
LEFT JOIN [canvas].[Users] u ON u.UserId = q.UserId
LEFT JOIN [canvas].[Participants_New] p ON p.UserGuid = u.UserGuid AND p.SessionId = sn.SessionId;
```

---

## 🔄 **PHASE 3: UPDATE ENTITY FRAMEWORK MODELS**

### **Step 3.1: Create New Entity Models**

Create new simplified models:

```csharp
// Models/Simplified/Session.cs
[Table("Sessions_New", Schema = "canvas")]
public class Session
{
    [Key]
    public int SessionId { get; set; }

    [Required, MaxLength(8)]
    public string HostToken { get; set; } = string.Empty;

    [Required, MaxLength(8)]
    public string UserToken { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? Title { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }

    [MaxLength(20)]
    public string Status { get; set; } = "Active";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ExpiresAt { get; set; }

    [MaxLength(100)]
    public string? CreatedBy { get; set; }

    // Navigation properties
    public virtual ICollection<Participant> Participants { get; set; } = new List<Participant>();
    public virtual ICollection<SessionData> SessionData { get; set; } = new List<SessionData>();
}

// Models/Simplified/Participant.cs
[Table("Participants_New", Schema = "canvas")]
public class Participant
{
    [Key]
    public int ParticipantId { get; set; }

    [Required]
    public int SessionId { get; set; }

    [MaxLength(256)]
    public string? UserGuid { get; set; }

    [MaxLength(100)]
    public string? Name { get; set; }

    [MaxLength(100)]
    public string? Country { get; set; }

    [MaxLength(100)]
    public string? City { get; set; }

    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastSeenAt { get; set; }

    // Navigation properties
    [ForeignKey(nameof(SessionId))]
    public virtual Session Session { get; set; } = null!;
}

// Models/Simplified/SessionData.cs
[Table("SessionData_New", Schema = "canvas")]
public class SessionData
{
    [Key]
    public int DataId { get; set; }

    [Required]
    public int SessionId { get; set; }

    [Required, MaxLength(20)]
    public string DataType { get; set; } = string.Empty; // 'SharedAsset', 'Annotation', 'Question'

    [Column(TypeName = "nvarchar(max)")]
    public string? Content { get; set; }  // JSON blob

    [MaxLength(100)]
    public string? CreatedBy { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsDeleted { get; set; } = false;

    // Navigation properties
    [ForeignKey(nameof(SessionId))]
    public virtual Session Session { get; set; } = null!;
}
```

### **Step 3.2: Create Simplified DbContext**

```csharp
// Data/SimplifiedCanvasDbContext.cs
public class SimplifiedCanvasDbContext : DbContext
{
    public SimplifiedCanvasDbContext(DbContextOptions<SimplifiedCanvasDbContext> options) : base(options)
    {
    }

    // Simplified Schema Tables
    public DbSet<Models.Simplified.Session> Sessions { get; set; }
    public DbSet<Models.Simplified.Participant> Participants { get; set; }
    public DbSet<Models.Simplified.SessionData> SessionData { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure unique constraints
        modelBuilder.Entity<Models.Simplified.Session>()
            .HasIndex(s => s.HostToken)
            .IsUnique()
            .HasDatabaseName("UQ_Sessions_HostToken");

        modelBuilder.Entity<Models.Simplified.Session>()
            .HasIndex(s => s.UserToken)
            .IsUnique()
            .HasDatabaseName("UQ_Sessions_UserToken");

        // Configure performance indexes
        modelBuilder.Entity<Models.Simplified.Participant>()
            .HasIndex(p => new { p.SessionId, p.UserGuid })
            .HasDatabaseName("IX_Participants_SessionUser");

        modelBuilder.Entity<Models.Simplified.SessionData>()
            .HasIndex(sd => new { sd.SessionId, sd.DataType, sd.IsDeleted, sd.CreatedAt })
            .HasDatabaseName("IX_SessionData_Query_Optimized");
    }
}
```

---

## ⚡ **PHASE 4: SERVICE LAYER UPDATES**

### **Step 4.1: Update Controllers**

Key controller changes needed:

```csharp
// Controllers/HostController.cs - Updated methods
public async Task<IActionResult> Authenticate([FromBody] HostAuthRequest request)
{
    // OLD: Complex SecureTokens lookup
    // var secureToken = await _context.SecureTokens
    //     .FirstOrDefaultAsync(st => st.HostToken == request.HostToken && st.IsActive);

    // NEW: Direct session lookup
    var session = await _simplifiedContext.Sessions
        .FirstOrDefaultAsync(s => s.HostToken == request.HostToken && s.Status == "Active");

    if (session == null || session.ExpiresAt < DateTime.UtcNow)
    {
        return BadRequest(new HostAuthResponse { IsValid = false, ErrorMessage = "TOKEN_INVALID" });
    }

    return Ok(new HostAuthResponse {
        IsValid = true,
        SessionId = session.SessionId.ToString(),
        SessionName = session.Title
    });
}
```

### **Step 4.2: Update Services**

```csharp
// Services/Simplified/SessionService.cs
public class SimplifiedSessionService
{
    private readonly SimplifiedCanvasDbContext _context;

    // Get session by host token
    public async Task<Session?> GetSessionByHostTokenAsync(string hostToken)
    {
        return await _context.Sessions
            .Include(s => s.Participants)
            .FirstOrDefaultAsync(s => s.HostToken == hostToken && s.Status == "Active");
    }

    // Add shared asset (now as SessionData)
    public async Task<bool> ShareAssetAsync(int sessionId, string assetData, string sharedBy)
    {
        var sessionData = new SessionData
        {
            SessionId = sessionId,
            DataType = "SharedAsset",
            Content = assetData,  // JSON string
            CreatedBy = sharedBy
        };

        _context.SessionData.Add(sessionData);
        return await _context.SaveChangesAsync() > 0;
    }

    // Get session content by type
    public async Task<List<SessionData>> GetSessionContentAsync(int sessionId, string? dataType = null)
    {
        var query = _context.SessionData
            .Where(sd => sd.SessionId == sessionId && !sd.IsDeleted);

        if (!string.IsNullOrEmpty(dataType))
        {
            query = query.Where(sd => sd.DataType == dataType);
        }

        return await query.OrderBy(sd => sd.CreatedAt).ToListAsync();
    }
}
```

---

## 🔄 **PHASE 5: GRADUAL CUTOVER STRATEGY**

### **Step 5.1: Parallel Operation Period**

1. **Week 1-2**: Both schemas operational
2. **Week 3**: New schema for new sessions only
3. **Week 4**: Migrate remaining active sessions
4. **Week 5**: Remove old schema

### **Step 5.2: Feature Flag Implementation**

```csharp
// appsettings.json
{
  "FeatureFlags": {
    "UseSimplifiedSchema": false,  // Start with false
    "AllowNewSessionsOnlyOnSimplified": false,
    "ReadFromSimplifiedSchema": false
  }
}

// Services/FeatureFlagService.cs
public class FeatureFlagService
{
    public bool UseSimplifiedSchema => _config.GetValue<bool>("FeatureFlags:UseSimplifiedSchema");
    public bool AllowNewSessionsOnlyOnSimplified => _config.GetValue<bool>("FeatureFlags:AllowNewSessionsOnlyOnSimplified");
}
```

---

## 📋 **PHASE 6: VALIDATION & ROLLBACK**

### **Step 6.1: Data Integrity Checks**

```sql
-- Validate migration completeness
SELECT 'Original Sessions' as Source, COUNT(*) as Count FROM [canvas].[Sessions]
UNION ALL
SELECT 'Migrated Sessions' as Source, COUNT(*) as Count FROM [canvas].[Sessions_New]

UNION ALL
SELECT 'Original Users+Registrations' as Source, COUNT(*) as Count
FROM [canvas].[Users] u INNER JOIN [canvas].[Registrations] r ON u.UserId = r.UserId
UNION ALL
SELECT 'Migrated Participants' as Source, COUNT(*) as Count FROM [canvas].[Participants_New]

UNION ALL
SELECT 'Original Content Items' as Source,
    (SELECT COUNT(*) FROM [canvas].[SharedAssets]) +
    (SELECT COUNT(*) FROM [canvas].[Annotations] WHERE IsDeleted = 0) +
    (SELECT COUNT(*) FROM [canvas].[Questions]) as Count
UNION ALL
SELECT 'Migrated Content Items' as Source, COUNT(*) as Count FROM [canvas].[SessionData_New];
```

### **Step 6.2: Rollback Plan**

If issues arise during migration:

```sql
-- Quick rollback procedure
-- 1. Stop application
-- 2. Switch connection string back to original schema
-- 3. Drop new tables if needed
DROP TABLE IF EXISTS [canvas].[SessionData_New];
DROP TABLE IF EXISTS [canvas].[Participants_New];
DROP TABLE IF EXISTS [canvas].[Sessions_New];

-- 4. Restart application with original configuration
```

---

## 📊 **MIGRATION TIMELINE & RESOURCES**

### **Estimated Timeline**

- **Phase 1-2 (Schema + Migration)**: 2 days
- **Phase 3-4 (Code Updates)**: 3 days
- **Phase 5 (Gradual Cutover)**: 1 week
- **Phase 6 (Validation)**: 1 day
- **Total**: ~2 weeks

### **Required Resources**

- **DBA Time**: 1 day for script review
- **Developer Time**: 4 days for code updates
- **Testing Time**: 2 days for validation
- **Downtime**: < 30 minutes for final cutover

### **Risk Assessment**

- **Low Risk**: Data migration (well-tested scripts)
- **Medium Risk**: Controller/Service updates (thorough testing required)
- **Mitigation**: Parallel operation + feature flags + rollback plan

---

## ✅ **SUCCESS CRITERIA**

### **Technical Metrics**

- ✅ All 15 original tables successfully consolidated into 3 tables
- ✅ 100% data preservation during migration
- ✅ All Controller endpoints functioning with new schema
- ✅ SignalR hubs operational with SessionData approach
- ✅ Performance improvement (faster queries, simplified joins)

### **Business Metrics**

- ✅ Zero downtime for active sessions during migration
- ✅ All host and participant functionality preserved
- ✅ Islamic content sharing working identically
- ✅ Authentication/authorization unchanged for end users
- ✅ Developer productivity improved with simpler schema

---

**🎯 This migration plan transforms NOOR Canvas from a complex 15-table architecture to an elegant 3-table design while preserving 100% of functionality and ensuring safe, reversible deployment.**
