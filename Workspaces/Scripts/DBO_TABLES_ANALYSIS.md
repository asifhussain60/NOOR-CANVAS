# NOOR CANVAS Database Usage Analysis

**Date**: October 12, 2025  
**Analysis Method**: Codebase grep + Entity Framework model review  
**Database**: KSESSIONS_DEV on AHHOME

---

## ✅ Actual dbo Tables Used by NOOR CANVAS

### READ-ONLY Access to Legacy Islamic Content Database

NOOR CANVAS accesses the following `dbo.*` tables for **READ-ONLY** purposes (legacy Islamic learning content):

| Table | Purpose | Evidence |
|-------|---------|----------|
| **`dbo.Groups`** | Islamic content collections (Albums) | EF Model: `KSessionsGroup.cs` |
| **`dbo.Categories`** | Subdivisions within Groups | EF Model: `KSessionsCategory.cs` |
| **`dbo.Sessions`** | Individual Islamic learning sessions (LEGACY) | EF Model: `KSessionsSession.cs` |
| **`dbo.Speakers`** | Session instructors/presenters | EF Model: `KSessionsSpeaker.cs` |
| **`dbo.SessionTranscripts`** | Transcript content for annotation | EF Model: `KSessionsSessionTranscript.cs` |

### Stored Procedures Used

| Stored Procedure | Parameters | Purpose | Usage Location |
|------------------|------------|---------|----------------|
| **`dbo.GetAllGroups`** | None | Retrieves all Groups/Albums | `HostController.cs:456` |
| **`dbo.GetCategoriesForGroup`** | `@GroupID` | Retrieves Categories for a specific Group | `HostController.cs:483` |

---

## ❌ Tables NOT Used (Removed from Documentation)

These tables were previously listed in documentation but are **NOT actually used** by NOOR CANVAS:

| Table | Why Removed | Evidence |
|-------|-------------|----------|
| **`dbo.Members`** | No EF model, no SQL queries | 0 code references |
| **`dbo.SessionTokens`** | No EF model, no SQL queries | 0 code references |
| **`dbo.Users`** | Table doesn't exist in database | Database query returned NULL |
| **`dbo.Tokens`** | Table doesn't exist in database | Database query returned NULL |
| **`dbo.Countries`** | No EF model, no SQL queries | 0 code references |

---

## 🔍 Verification Evidence

### Entity Framework Models

**Location**: `SPA/NoorCanvas/Models/KSessionsModels.cs`

```csharp
namespace NoorCanvas.Models.KSESSIONS
{
    [Table("Groups", Schema = "dbo")]
    public class KSessionsGroup { ... }
    
    [Table("Categories", Schema = "dbo")]
    public class KSessionsCategory { ... }
    
    [Table("Sessions", Schema = "dbo")]
    public class KSessionsSession { ... }
    
    [Table("Speakers", Schema = "dbo")]
    public class KSessionsSpeaker { ... }
}
```

**Location**: `SPA/NoorCanvas/Models/KSESSIONS/KSessionsSessionTranscript.cs`

```csharp
namespace NoorCanvas.Models.KSESSIONS
{
    [Table("SessionTranscripts", Schema = "dbo")]
    public class KSessionsSessionTranscript { ... }
}
```

### Direct SQL Usage

**Location**: `SPA/NoorCanvas/Controllers/HostController.cs`

```csharp
// Line 456: Fetch all Groups
var albums = await _ksessionsContext.Database
    .SqlQuery<AlbumData>($"EXEC dbo.GetAllGroups")
    .ToListAsync();

// Line 483: Fetch Categories for a Group
var categories = await _ksessionsContext.Database
    .SqlQuery<CategoryData>($"EXEC dbo.GetCategoriesForGroup {albumId}")
    .ToListAsync();
```

### Grep Search Results

```bash
# Search for dbo table references
grep -r "dbo\." --include="*.cs" SPA/NoorCanvas/

# Results:
# - dbo.Groups: 3 references (Model + Comments)
# - dbo.Categories: 3 references (Model + Comments)
# - dbo.Sessions: 6 references (Model + Comments)
# - dbo.Speakers: 2 references (Model)
# - dbo.SessionTranscripts: 2 references (Model)
# - dbo.GetAllGroups: 1 reference (SQL query)
# - dbo.GetCategoriesForGroup: 1 reference (SQL query)

# NOT FOUND:
# - dbo.Members: 0 references
# - dbo.SessionTokens: 0 references
# - dbo.Users: 0 references
# - dbo.Tokens: 0 references
# - dbo.Countries: 0 references
```

---

## 🏗️ Architecture Context

### Two Separate Database Domains

```
KSESSIONS_DEV Database
├── canvas.* schema (NOOR CANVAS ownership - READ-WRITE)
│   ├── canvas.Sessions - Canvas session management (NEW)
│   ├── canvas.Participants - Canvas participants
│   ├── canvas.Questions - Canvas questions
│   ├── canvas.QuestionVotes - Question votes
│   └── canvas.AssetLookup - Asset definitions
│
└── dbo.* schema (Legacy Islamic content - READ-ONLY)
    ├── dbo.Groups - Islamic content collections
    ├── dbo.Categories - Group subdivisions
    ├── dbo.Sessions - Islamic learning sessions (LEGACY - different from canvas.Sessions)
    ├── dbo.Speakers - Session instructors
    └── dbo.SessionTranscripts - Transcript content
```

### Important Distinction: Two Different "Sessions" Tables

| Table | Purpose | Schema | Access |
|-------|---------|--------|--------|
| **`canvas.Sessions`** | NOOR CANVAS session management (8-char access codes) | `canvas` | READ-WRITE |
| **`dbo.Sessions`** | Legacy Islamic learning sessions (video content, speakers) | `dbo` | READ-ONLY |

**These are completely different tables serving different purposes!**

---

## 📋 Documentation Files Updated

### Files Corrected (5 total):

1. **`.github/instructions/Links/InfrastructureQuickRef.md`** ✅
   - Removed: dbo.Members, dbo.SessionTokens, dbo.Countries
   - Added: dbo.Speakers, stored procedures
   - Added: Clarification about dual Sessions tables

2. **`.github/instructions/SelfAwareness.instructions.md`** ✅
   - Removed: dbo.Members, dbo.SessionTokens, dbo.Countries
   - Added: dbo.Speakers, stored procedures
   - Added: Note about LEGACY dbo.Sessions

3. **`Workspaces/Copilot/prompts.keys/_template/key-template.md`** ✅
   - Removed: dbo.Members, dbo.SessionTokens
   - Added: dbo.Groups, dbo.Speakers
   - Added: Clarification about Sessions-LEGACY

4. **`Workspaces/Copilot/database-rules-integration-summary.md`** ✅
   - Updated scenario from "Update user email" to "Update group name"
   - Changed from dbo.Members to dbo.Groups

5. **`DocFX/articles/development/getting-started.md`** ✅
   - Removed: Query to dbo.Members
   - Added: Queries to dbo.Groups and dbo.SessionTranscripts

---

## 🎯 Schema Access Rules Summary

### ✅ **canvas.* Schema** (READ-WRITE)

**Purpose**: NOOR CANVAS application data  
**Access**: Full CRUD operations allowed  
**Tables**:
- `canvas.Sessions` - Canvas session management
- `canvas.Participants` - Canvas participants
- `canvas.Questions` - Canvas questions
- `canvas.QuestionVotes` - Question votes
- `canvas.AssetLookup` - Asset definitions
- `canvas.SessionData` - Session data (future)

### ❌ **dbo.* Schema** (READ-ONLY)

**Purpose**: Legacy Islamic learning content  
**Access**: SELECT only - NO INSERT, UPDATE, DELETE  
**Tables**:
- `dbo.Groups` - Islamic content collections (Albums)
- `dbo.Categories` - Group subdivisions
- `dbo.Sessions` - Islamic learning sessions (LEGACY)
- `dbo.Speakers` - Session instructors
- `dbo.SessionTranscripts` - Transcript content

**Stored Procedures**:
- `dbo.GetAllGroups` - Retrieve all Groups
- `dbo.GetCategoriesForGroup` - Retrieve Categories for a Group

**Rationale**: Legacy data managed by separate system, NOOR CANVAS consumes read-only

---

## 🔧 Usage Patterns

### How NOOR CANVAS Uses Legacy dbo Tables

#### 1. Host Session Creation Flow

```csharp
// Step 1: Fetch available Groups (Albums)
var albums = await _ksessionsContext.Database
    .SqlQuery<AlbumData>($"EXEC dbo.GetAllGroups")
    .ToListAsync();

// Step 2: User selects an Album (Group)
// Step 3: Fetch Categories for selected Album
var categories = await _ksessionsContext.Database
    .SqlQuery<CategoryData>($"EXEC dbo.GetCategoriesForGroup {albumId}")
    .ToListAsync();

// Step 4: User selects Category
// Step 5: Fetch Sessions for Category
var sessions = await _ksessionsContext.KSessionsSessions
    .Where(s => s.CategoryId == categoryId && s.IsActive == true)
    .ToListAsync();

// Step 6: User selects Session
// Step 7: Create NOOR CANVAS session (writes to canvas.Sessions)
var canvasSession = new Session {
    AlbumId = selectedGroup.GroupId, // Links to dbo.Groups
    HostToken = GenerateToken(),
    UserToken = GenerateToken(),
    Status = SessionStatus.Active
};
await _canvasContext.Sessions.AddAsync(canvasSession);
```

#### 2. Transcript Loading Flow

```csharp
// Fetch transcript for annotation
var transcript = await _ksessionsContext.KSessionsSessionTranscripts
    .FirstOrDefaultAsync(t => t.SessionId == legacySessionId);

if (transcript != null)
{
    // Display transcript content in canvas for annotation
    return View(new TranscriptViewModel {
        Content = transcript.Transcript,
        SessionId = canvasSessionId
    });
}
```

#### 3. Speaker Information Display

```csharp
// Get speaker details for session
var session = await _ksessionsContext.KSessionsSessions
    .Include(s => s.Speaker)
    .Include(s => s.Category)
    .Include(s => s.Group)
    .FirstOrDefaultAsync(s => s.SessionId == legacySessionId);

return new SessionDetailViewModel {
    SessionName = session.SessionName,
    SpeakerName = session.Speaker?.SpeakerName ?? "Unknown",
    GroupName = session.Group.GroupName,
    CategoryName = session.Category.CategoryName
};
```

---

## 📊 Comparison: Before vs After

### Documentation Accuracy

| Aspect | Before | After |
|--------|--------|-------|
| **dbo.Members** | ✅ Listed (WRONG) | ❌ Removed (CORRECT) |
| **dbo.SessionTokens** | ✅ Listed (WRONG) | ❌ Removed (CORRECT) |
| **dbo.Users** | ✅ Listed (WRONG) | ❌ Never existed |
| **dbo.Tokens** | ✅ Listed (WRONG) | ❌ Never existed |
| **dbo.Countries** | ✅ Listed (WRONG) | ❌ Removed (CORRECT) |
| **dbo.Groups** | ✅ Listed | ✅ Listed (VERIFIED) |
| **dbo.Categories** | ✅ Listed | ✅ Listed (VERIFIED) |
| **dbo.Sessions** | ✅ Listed | ✅ Listed + clarified LEGACY |
| **dbo.Speakers** | ❌ Missing | ✅ Added (CORRECT) |
| **dbo.SessionTranscripts** | ✅ Listed | ✅ Listed (VERIFIED) |
| **Stored Procedures** | ❌ Missing | ✅ Added (CORRECT) |

### Verification Method

| Before | After |
|--------|-------|
| ❌ Doc-to-doc comparison | ✅ Codebase grep |
| ❌ Assumptions | ✅ EF model verification |
| ❌ Database screenshot only | ✅ SQL query verification |
| ❌ No stored procedure check | ✅ SQL usage analysis |

---

## ✅ Validation Checklist

- [x] Searched entire codebase for `dbo.*` references
- [x] Reviewed all Entity Framework model classes
- [x] Identified direct SQL queries (`SqlQuery`, `EXEC`)
- [x] Verified stored procedure usage
- [x] Confirmed tables don't exist (dbo.Users, dbo.Tokens)
- [x] Confirmed tables not used (dbo.Members, dbo.SessionTokens, dbo.Countries)
- [x] Updated 5 documentation files
- [x] Created this analysis document
- [x] Added clarification about dual Sessions tables
- [x] Documented stored procedures

---

## 🎓 Key Takeaways

### 1. **Always Verify Against Codebase**
- ✅ Grep for actual usage
- ✅ Check Entity Framework models
- ✅ Review SQL queries
- ❌ Don't assume from database schema alone

### 2. **Two "Sessions" Tables**
- `canvas.Sessions` - NOOR CANVAS session management (NEW)
- `dbo.Sessions` - Legacy Islamic learning sessions (LEGACY)
- These serve completely different purposes!

### 3. **READ-ONLY Pattern**
- NOOR CANVAS consumes legacy Islamic content (READ-ONLY)
- All NOOR CANVAS writes go to `canvas.*` schema
- Clean separation of concerns

### 4. **Documentation Must Match Reality**
- Code is the source of truth
- Database schema alone is insufficient
- Regular validation prevents drift

---

**Analysis Complete**: ✅  
**Documentation Updated**: ✅  
**Verified Against Codebase**: ✅  

All dbo table references now accurately reflect actual NOOR CANVAS usage.
