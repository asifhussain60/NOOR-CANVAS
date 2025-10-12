# Database Rules Integration Summary

**Date**: 2025-10-12  
**Purpose**: Ensure all essential prompts reference KSESSIONS_DEV database rules and external dependencies

---

## 🎯 Objective Achieved

All essential prompt agents now have **mandatory** awareness of:
1. **Primary Database**: KSESSIONS_DEV (default when user says "database")
2. **Schema Access Rules**: 
   - ✅ `canvas.*` - READ-WRITE
   - ❌ `dbo.*` - READ-ONLY
3. **Connection String**: Always use `_configuration.GetConnectionString("DefaultConnection")`
4. **Server**: AHHOME

---

## 📝 Files Updated

### 1. InfrastructureQuickRef.md (PRIMARY SOURCE)
**Version**: 1.0.0 → 2.0.0

**Major Enhancements**:
- Added prominent "Critical Database Rules" section at top
- Expanded KSESSIONS_DEV details with explicit schema access rules
- Listed all `canvas.*` tables (READ-WRITE)
- Listed all `dbo.*` tables (READ-ONLY)
- Added KQUR_DEV secondary database information
- Added External Dependencies section (SQL Server, Kestrel, SignalR)
- Added Configuration Files section
- Clear examples of correct vs incorrect connection string usage

**New Sections**:
```
🗄️ Database Connections
  - Primary Database: KSESSIONS_DEV
  - ⚠️ CRITICAL DATABASE RULES
  - Schema Usage (detailed table listings)
  - Secondary Database: KQUR_DEV
  - Connection String Best Practices

🔌 External Dependencies
  - Required Services
  - Configuration Files
  - Environment Variables
```

---

### 2. SystemIndex.md
**Updated**: 2025-10-12

**Added**:
- **Critical Database Rules** section at the top (before Quick Navigation)
- User reference: "When user mentions 'database', they mean KSESSIONS_DEV"
- Schema access rules prominently featured
- Reference to InfrastructureQuickRef.md for complete docs
- Updated Quick Navigation to emphasize InfrastructureQuickRef.md
- Added database rule requirements to each agent description

**Agent Updates**:
- task.prompt.md: MUST consult InfrastructureQuickRef.md for database rules
- question.prompt.md: MUST reference InfrastructureQuickRef.md for infrastructure queries
- refactor.prompt.md: MUST respect database schema access rules

---

### 3. SelfAwareness.instructions.md
**Version**: 2.5.0

**Added**:
- New section: **Database Access Rules (MANDATORY)**
- Positioned after "Required Reading" for maximum visibility
- Complete schema access control rules
- Violation consequences (rollback + user notification)
- Reference to InfrastructureQuickRef.md
- Added InfrastructureQuickRef.md to Required Reading section

---

### 4. task.prompt.md
**Updated Core Mandates**:

**Added**:
- New subsection: **Database Access Rules (MANDATORY)**
- Positioned before Architectural Reference Documentation
- Violation = immediate rollback policy
- Marked InfrastructureQuickRef.md as ⭐ **MANDATORY for database operations**

**Agent Behavior**:
- Must check InfrastructureQuickRef.md before ANY database operation
- Clear schema rules visible in every task execution
- Automatic rollback on violation

---

### 5. question.prompt.md
**Updated Core Mandates**:

**Added**:
- New subsection: **Database Knowledge (MANDATORY)**
- Default assumption when user says "database": KSESSIONS_DEV
- Complete schema rules
- Reference to InfrastructureQuickRef.md
- Updated Reference Documentation to mark InfrastructureQuickRef.md as ⭐ **MANDATORY**

**Agent Behavior**:
- Automatically interprets "database" as KSESSIONS_DEV
- Provides schema-aware answers
- References correct connection string patterns

---

### 6. refactor.prompt.md
**Updated Core Mandates**:

**Added**:
- **Database Operations** mandate with InfrastructureQuickRef.md requirement
- MANDATORY consultation before database changes
- Schema access rules (✅ canvas.*, ❌ dbo.*)
- Violation = Immediate rollback

**Agent Behavior**:
- Cannot refactor database code without checking schema rules
- Automatic rollback on dbo.* modification attempts
- Preserves READ-ONLY constraints during structural changes

---

### 7. sync.prompt.md
**Updated Reference Documentation**:

**Added**:
- New subsection: **Database Knowledge (For SystemIndex.md Updates)**
- Ensures sync agent maintains database rules in SystemIndex.md
- Marks InfrastructureQuickRef.md with ⭐ for emphasis
- Clear guidance on keeping database rules prominent

**Agent Behavior**:
- Keeps SystemIndex.md database rules current
- Syncs InfrastructureQuickRef.md after structural changes
- Maintains consistency across all reference files

---

## 🎯 User Experience Improvements

### When User Says "database"
**Before**: Copilot might ask "Which database?" or assume wrong database

**After**: Copilot knows:
- Default = KSESSIONS_DEV
- Server = AHHOME
- Connection string pattern
- Schema access rules

### When User Requests Database Modification
**Before**: Copilot might attempt to modify dbo.* tables

**After**: Copilot checks InfrastructureQuickRef.md and:
- Allows modifications to `canvas.*` schema
- Blocks modifications to `dbo.*` schema
- Shows clear error if violation attempted
- Automatic rollback on violation

### When User Asks About Database Structure
**Before**: Copilot might search code files for schema information

**After**: Copilot references InfrastructureQuickRef.md for:
- Complete schema listings
- Table purposes
- Access permissions
- Connection patterns

---

## 📊 Coverage Matrix

| Agent | Database Rules Added | InfrastructureQuickRef.md Required | Schema Enforcement |
|-------|---------------------|-----------------------------------|-------------------|
| task.prompt.md | ✅ | ✅ MANDATORY | ✅ Rollback on violation |
| question.prompt.md | ✅ | ✅ MANDATORY | ✅ Schema-aware answers |
| refactor.prompt.md | ✅ | ✅ MANDATORY | ✅ Rollback on violation |
| sync.prompt.md | ✅ | ✅ | ✅ Maintains rules |
| healthcheck.prompt.md | ➖ | ➖ | ➖ Read-only agent |
| test-generation.prompt.md | ➖ | ➖ | ➖ Test-focused |
| analyze-learning.prompt.md | ➖ | ➖ | ➖ Analysis-only |

**Legend**:
- ✅ = Updated with database rules
- ➖ = Not applicable (agent doesn't modify database)

---

## 🔍 External Dependencies Now Referenced

### Database Connections
- ✅ KSESSIONS_DEV (primary, AHHOME server)
- ✅ KQUR_DEV (secondary, Quranic content)
- ✅ Connection string patterns
- ✅ Schema access rules

### Services
- ✅ SQL Server (AHHOME)
- ✅ Kestrel Web Server (port 9091)
- ✅ SignalR Hubs (4 hubs documented)

### Configuration
- ✅ appsettings.json location
- ✅ appsettings.Development.json overrides
- ✅ Connection string configuration
- ✅ Environment variables

---

## 🎓 Knowledge Hierarchy

```
SelfAwareness.instructions.md (Global Rules)
    ↓
SystemIndex.md (Navigation Hub + Database Rules Summary)
    ↓
InfrastructureQuickRef.md (Complete Database Documentation)
    ↓
Individual Prompts (task, question, refactor, sync)
```

**Flow**:
1. All agents read SelfAwareness.instructions.md (mandatory database rules)
2. Agents consult SystemIndex.md for navigation (database rules at top)
3. Agents reference InfrastructureQuickRef.md for complete database details
4. Each prompt has database rules in Core Mandates for immediate visibility

---

## ✅ Verification Checklist

- [x] InfrastructureQuickRef.md updated with complete database rules
- [x] SystemIndex.md has database rules at top
- [x] SelfAwareness.instructions.md includes database access rules
- [x] task.prompt.md has mandatory database rules
- [x] question.prompt.md knows KSESSIONS_DEV is default
- [x] refactor.prompt.md enforces schema access rules
- [x] sync.prompt.md maintains database rule consistency
- [x] All prompts reference InfrastructureQuickRef.md
- [x] Schema access rules clearly documented (canvas.* vs dbo.*)
- [x] Violation consequences specified (rollback)

---

## 🚀 Expected Behavior

### Scenario 1: User says "Check the database for sessions"
**Copilot Response**:
- Assumes KSESSIONS_DEV
- References `dbo.Sessions` table (READ-ONLY)
- Uses correct connection string
- No modification attempts

### Scenario 2: User says "Add a new question to the database"
**Copilot Response**:
- Targets `canvas.Questions` table (READ-WRITE)
- Uses proper connection string
- Follows INSERT best practices
- Validates before execution

### Scenario 3: User says "Update a group name in the database"
**Copilot Response**:
- Recognizes `dbo.Groups` is READ-ONLY
- Blocks modification attempt
- Explains dbo.* schema is for legacy Islamic content
- References InfrastructureQuickRef.md for schema access rules

### Scenario 4: User says "What's the database connection?"
**Copilot Response**:
- References KSESSIONS_DEV on AHHOME
- Shows connection string pattern: `_configuration.GetConnectionString("DefaultConnection")`
- Notes appsettings.json location
- Explains schema access rules

---

**Integration Complete**: 2025-10-12
**Next Steps**: Test with actual user queries to verify behavior
