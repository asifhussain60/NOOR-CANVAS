# Database Access Rules

**Purpose**: Enforce database schema access permissions during task execution.

**When to Load**: Before ANY database operation (Step 2 context gathering, Step 4-6 implementation).

**Integration Point**: Called by task.prompt.md during implementation planning and validation.

---

## Primary Database

**TARGET DATABASE:** KSESSIONS_DEV

**Assumptions:**
- When user mentions "database", assume **KSESSIONS_DEV**
- Connection string: Always use `_configuration.GetConnectionString("DefaultConnection")`
- Local development database (SQL Server on AHHOME instance)

---

## Schema Access Rules (MANDATORY)

### ✅ READ-WRITE Allowed

**canvas.* schema ONLY**
- `canvas.CanvasSessions` - Full CRUD operations
- `canvas.Questions` - Full CRUD operations
- `canvas.Annotations` - Full CRUD operations
- `canvas.ContentBroadcasts` - Full CRUD operations
- Any future `canvas.*` tables - Full CRUD operations

**Examples:**
```sql
-- ALLOWED: Insert into canvas schema
INSERT INTO canvas.Questions (SessionId, QuestionText, ...) VALUES (...)

-- ALLOWED: Update canvas schema
UPDATE canvas.CanvasSessions SET Status = 'Active' WHERE SessionId = 212

-- ALLOWED: Delete from canvas schema
DELETE FROM canvas.Annotations WHERE AnnotationId = 123
```

---

### ❌ READ-ONLY Enforced

**ALL other schemas** (dbo.*, custom.*, etc.)
- `dbo.Users` - READ-ONLY
- `dbo.Sessions` - READ-ONLY
- `dbo.MigrationHistory` - READ-ONLY
- `dbo.*` - READ-ONLY
- Any non-canvas schema - READ-ONLY

**Examples:**
```sql
-- ALLOWED: Read from dbo schema
SELECT * FROM dbo.Users WHERE UserId = 1

-- PROHIBITED: Insert into dbo schema
INSERT INTO dbo.Users (Name, Email) VALUES (...)  -- ❌ VIOLATION

-- PROHIBITED: Update dbo schema
UPDATE dbo.Sessions SET Status = 'Active'  -- ❌ VIOLATION

-- PROHIBITED: Delete from dbo schema
DELETE FROM dbo.MigrationHistory WHERE Id = 5  -- ❌ VIOLATION
```

---

## Violation Handling

**IMMEDIATE ROLLBACK on detection**

### Detection Points
1. **During planning** (Step 3) - Code review before implementation
2. **During implementation** (Step 4-6) - Real-time validation
3. **Post-execution validation** (Step 8.5) - Final verification

### Rollback Protocol

**If violation detected:**
```
1. HALT execution immediately
2. Display violation details to user:
   
   ❌ DATABASE ACCESS RULE VIOLATION
   
   Schema: dbo (READ-ONLY)
   Operation: INSERT
   File: UserService.cs, Line 42
   Statement: INSERT INTO dbo.Users (Name, Email) VALUES (...)
   
   VIOLATION: All non-canvas.* schemas are READ-ONLY
   
3. Revert changes:
   git reset --hard {last-checkpoint-sha}
   
4. Present corrective options:
   A. Modify to use canvas.* schema
   B. Use READ-ONLY operation (SELECT only)
   C. Cancel task (preserve rollback point)
   
5. WAIT for user decision
```

### Auto-Fix Suggestions

When violation detected, suggest alternatives:

**Example 1: User INSERT violation**
```
❌ Violation: INSERT INTO dbo.Users
✅ Alternative: Store canvas-specific user data in canvas.CanvasParticipants
```

**Example 2: Session UPDATE violation**
```
❌ Violation: UPDATE dbo.Sessions SET Status = 'Active'
✅ Alternative: UPDATE canvas.CanvasSessions SET Status = 'Active'
```

---

## Validation Queries

**Use these queries to verify schema compliance:**

### Check Table Schema
```sql
SELECT SCHEMA_NAME(schema_id) AS SchemaName, name AS TableName
FROM sys.tables
WHERE SCHEMA_NAME(schema_id) = 'canvas'
ORDER BY TableName;
```

### Verify Operation Type
```csharp
// In code review, parse SQL statements for operation type
var sqlStatement = "INSERT INTO dbo.Users...";
var operation = ExtractOperation(sqlStatement);  // Returns: INSERT, UPDATE, DELETE, SELECT
var schema = ExtractSchema(sqlStatement);        // Returns: dbo, canvas, etc.

if (schema != "canvas" && operation != "SELECT") {
    throw new DatabaseAccessViolationException($"Operation {operation} not allowed on schema {schema}");
}
```

---

## Reference Documentation

**Complete rules in:** `InfrastructureQuickRef.md`

**Sections:**
- Database connection strings
- Schema ownership and permissions
- Migration workflow (canvas.* vs dbo.*)
- EF Core DbContext configuration

---

## Common Scenarios

### ✅ Scenario 1: Canvas Question CRUD
```csharp
// ALLOWED: Full CRUD on canvas.Questions
public async Task<Question> CreateQuestion(CreateQuestionDto dto) {
    var question = new Question {
        SessionId = dto.SessionId,
        QuestionText = dto.Text,
        // ... other canvas.Questions fields
    };
    
    _context.Questions.Add(question);  // ✅ canvas.Questions - ALLOWED
    await _context.SaveChangesAsync();
    return question;
}
```

### ✅ Scenario 2: User Lookup (READ-ONLY)
```csharp
// ALLOWED: Read from dbo.Users
public async Task<User> GetUserById(int userId) {
    return await _context.Users  // ✅ dbo.Users - READ-ONLY allowed
        .FirstOrDefaultAsync(u => u.UserId == userId);
}
```

### ❌ Scenario 3: User Update (VIOLATION)
```csharp
// PROHIBITED: Update dbo.Users
public async Task UpdateUser(int userId, string newName) {
    var user = await _context.Users.FindAsync(userId);
    user.Name = newName;  // ❌ VIOLATION: dbo.Users is READ-ONLY
    await _context.SaveChangesAsync();
}

// ✅ CORRECTED: Use canvas schema or alternative approach
public async Task UpdateCanvasParticipant(int participantId, string displayName) {
    var participant = await _context.CanvasParticipants.FindAsync(participantId);
    participant.DisplayName = displayName;  // ✅ canvas.CanvasParticipants - ALLOWED
    await _context.SaveChangesAsync();
}
```

---

## Exception Cases

**NONE - Rules are absolute**

- No exceptions for "urgent" fixes
- No exceptions for "just this once"
- No exceptions for "testing purposes"

**If you need to modify dbo.* schema:**
1. Create production migration script
2. Follow migration workflow in InfrastructureQuickRef.md
3. Get DBA approval for schema changes
4. Execute via controlled migration process

---

## Integration Notes

**Call this module:**
- **Before** Step 3 (Planning) - Validate planned database operations
- **During** Step 4-6 (Implementation) - Real-time validation
- **After** Step 8 (Completion) - Final verification

**Update on violation:**
- Append to `{key}/work-log.md`: "🚨 Database access violation detected: {details}"
- HALT execution
- Revert to last checkpoint
- Present corrective options to user

**Reference:**
- See InfrastructureQuickRef.md for complete database architecture
- See task.prompt.md for main execution flow
- See checkpoint-protocol.md for rollback mechanics
