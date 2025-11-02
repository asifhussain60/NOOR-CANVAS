# KDS Shared Module: Session Loader

**Purpose:** Abstract session state access (Dependency Inversion Principle).

**Version:** 5.0 (SOLID Refactor)  
**Type:** Shared utility module  
**Single Responsibility:** Session data access ONLY  
**Dependencies:** ✅ ZERO external dependencies (all logic in KDS/)

---

## 🎯 Purpose (DIP Compliance)

**Problem:** Agents hardcoded session file paths, creating tight coupling.

**Solution:** Abstract session access behind this interface.

**CRITICAL:** This module is **100% local** (implemented in KDS/). Cloud/database storage options are **future extensibility** but NOT required. Default is local file storage.

```markdown
# Before (Tight Coupling)
#file:KDS/sessions/current-session.json  # Concrete dependency

# After (Dependency Inversion)
#shared-module:session-loader.md  # Abstract interface
→ Implementation can change without affecting agents
```

---

## 📥 Interface

### Load Current Session
```json
{
  "operation": "load_current",
  "return": "Session object or null"
}
```

### Load Specific Session
```json
{
  "operation": "load_by_id",
  "session_id": "string",
  "return": "Session object or null"
}
```

### Save Session
```json
{
  "operation": "save",
  "session": "Session object",
  "return": "boolean (success/failure)"
}
```

### List Recent Sessions
```json
{
  "operation": "list_recent",
  "limit": "integer (default: 10)",
  "return": "Array of session summaries"
}
```

---

## 📤 Session Object Schema

```json
{
  "sessionId": "string",
  "feature": "string",
  "status": "ACTIVE | PAUSED | BLOCKED | COMPLETED",
  "currentPhase": "integer",
  "currentTask": "string",
  "totalPhases": "integer",
  "totalTasks": "integer",
  "completedTasks": ["array of task IDs"],
  "phases": [
    {
      "phaseNumber": "integer",
      "name": "string",
      "tasks": [
        {
          "taskId": "string",
          "description": "string",
          "status": "not_started | in_progress | completed | blocked",
          "files": ["array"],
          "tests": ["array"]
        }
      ]
    }
  ],
  "lastUpdated": "ISO 8601 timestamp",
  "lastAccessed": "ISO 8601 timestamp"
}
```

---

## 🔧 Implementation (Configurable, LOCAL BY DEFAULT)

### Current Implementation: File-Based (LOCAL ONLY)
```yaml
storage_type: file  # DEFAULT (no external deps)
location: KDS/sessions/current-session.json
backup_location: KDS/sessions/backups/
implementation: KDS/scripts/session-storage/file-storage.ps1  # LOCAL
```

### Future Implementations (OPTIONAL EXTENSIONS)
```yaml
# SQLite Database (LOCAL, no cloud)
storage_type: database
engine: sqlite  # EXCEPTION: Open-source, can run locally
connection: KDS/data/kds.db  # LOCAL file
implementation: KDS/scripts/session-storage/sqlite-storage.ps1

# Cloud Storage (EXCEPTION: User's choice)
storage_type: cloud
provider: azure_blob | aws_s3 | gcp_storage  # User's existing service
container: kds-sessions
implementation: KDS/scripts/session-storage/cloud-storage.ps1

# In-Memory (Testing only - LOCAL)
storage_type: memory
persist_on_exit: false
implementation: KDS/scripts/session-storage/memory-storage.ps1
```

**CRITICAL NOTES:**
- ✅ **Default: File-based (zero external deps)**
- ✅ **SQLite: Local database (exception allowed per Rule #18)**
- ✅ **Cloud: Optional extension (user's existing service)**
- ✅ **All implementations in KDS/scripts/**
- ✅ **KDS never installs cloud SDKs** (user provides if wanted)

---

## 📚 Usage Examples

### In work-planner.md
```markdown
# Old (Concrete)
#file:KDS/sessions/current-session.json
session = read_file("KDS/sessions/current-session.json")

# New (Abstract)
#shared-module:session-loader.md
session = session_loader.load_current()
```

### In code-executor.md
```markdown
# Old (Concrete)
update_file("KDS/sessions/current-session.json", new_data)

# New (Abstract)
#shared-module:session-loader.md
session.current_task = "1.3"
session_loader.save(session)
```

### In session-resumer.md
```markdown
# Old (Concrete)
if file_exists("KDS/sessions/current-session.json"):
    session = parse_json(...)

# New (Abstract)
#shared-module:session-loader.md
session = session_loader.load_current()
if session is not None:
    # Resume logic
```

---

## ✅ Benefits

### Flexibility
- ✅ Swap storage without changing agents
- ✅ Add caching layer transparently
- ✅ Migrate to database without code changes

### Testability
- ✅ Mock session loader for unit tests
- ✅ Use in-memory storage for fast tests
- ✅ Isolate agent logic from persistence

### Maintainability
- ✅ One place to fix session bugs
- ✅ Consistent error handling
- ✅ Centralized validation

---

## 🚨 Error Handling

### File Not Found
```json
{
  "error": "SESSION_NOT_FOUND",
  "message": "No active session exists",
  "suggestion": "Start new session with plan.md"
}
```

### Parse Error
```json
{
  "error": "INVALID_SESSION_FORMAT",
  "message": "Session file corrupted",
  "file": "KDS/sessions/current-session.json",
  "suggestion": "Restore from backup or start fresh"
}
```

### Save Failure
```json
{
  "error": "SAVE_FAILED",
  "message": "Cannot write to session file",
  "reason": "Permission denied",
  "suggestion": "Check file permissions"
}
```

---

## 🔄 Implementation Details

### load_current()
```python
def load_current():
    """Load active session from configured storage"""
    
    storage = get_configured_storage()  # From kds.config.json
    
    try:
        if storage.type == "file":
            path = storage.location
            if not file_exists(path):
                return None
            content = read_file(path)
            session = parse_json(content)
            validate_session(session)
            return session
        
        elif storage.type == "database":
            # Database implementation
            pass
        
        elif storage.type == "memory":
            # In-memory implementation
            pass
    
    except Exception as e:
        log_error(f"Session load failed: {e}")
        return None
```

### save(session)
```python
def save(session):
    """Save session to configured storage"""
    
    storage = get_configured_storage()
    
    # Validate before saving
    if not validate_session(session):
        raise ValidationError("Invalid session structure")
    
    # Update timestamp
    session.last_updated = now()
    
    try:
        if storage.type == "file":
            # Backup existing
            if file_exists(storage.location):
                backup(storage.location)
            
            # Write new
            write_file(storage.location, to_json(session))
            return True
        
        elif storage.type == "database":
            # Database save
            pass
        
        elif storage.type == "memory":
            # In-memory save
            pass
    
    except Exception as e:
        log_error(f"Session save failed: {e}")
        return False
```

---

## 📝 Configuration

### In kds.config.json
```json
{
  "session_storage": {
    "type": "file",
    "location": "KDS/sessions/current-session.json",
    "backup_enabled": true,
    "backup_location": "KDS/sessions/backups/",
    "max_backups": 5
  }
}
```

---

**Session Loader: Decouple agents from storage!** 🗄️
