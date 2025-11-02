# KDS Shared Module: File Accessor

**Purpose:** Abstract file system operations (Dependency Inversion Principle).

**Version:** 5.0 (SOLID Refactor)  
**Type:** Shared utility module  
**Single Responsibility:** File I/O ONLY  
**Dependencies:** ✅ ZERO external dependencies (pure file system operations)  
**Implementation:** ✅ 100% local (KDS/scripts/file-operations.ps1)

---

## 🎯 Purpose (DIP Compliance)

**Problem:** Agents directly manipulate files, creating tight coupling to file system.

**Solution:** Abstract file operations behind this interface.

**CRITICAL:** This module uses **native file system operations** only (PowerShell/Node.js built-ins). Zero external packages required.

```markdown
# Before (Direct Access)
content = read_file("KDS/governance/rules.md")  # Direct I/O

# After (Abstraction)
#shared-module:file-accessor.md
content = file_accessor.read("rules.md", category="governance")
→ Path resolution abstracted, can add caching, validation, etc.
```

---

## 📥 Interface

### Read File
```json
{
  "operation": "read",
  "file_path": "string (relative or absolute)",
  "category": "prompts | governance | sessions | knowledge | tests",
  "return": "string (file content)"
}
```

### Write File
```json
{
  "operation": "write",
  "file_path": "string",
  "content": "string",
  "category": "string",
  "create_backup": "boolean (default: true)",
  "return": "boolean (success)"
}
```

### File Exists
```json
{
  "operation": "exists",
  "file_path": "string",
  "category": "string",
  "return": "boolean"
}
```

### List Files
```json
{
  "operation": "list",
  "pattern": "string (glob pattern)",
  "category": "string",
  "return": "array of file paths"
}
```

---

## 🔧 Path Resolution

### Category-Based Paths
```yaml
prompts: KDS/prompts/{subcategory}/{file}
governance: KDS/governance/{file}
sessions: KDS/sessions/{file}
knowledge: KDS/knowledge/{subcategory}/{file}
tests: Tests/{subcategory}/{file}
scripts: KDS/scripts/{subcategory}/{file}
```

### Examples
```python
# Instead of hardcoded paths
read_file("KDS/prompts/internal/work-planner.md")
read_file("KDS/governance/rules.md")
read_file("KDS/sessions/current-session.json")

# Use category-based resolution
file_accessor.read("work-planner.md", category="prompts/internal")
file_accessor.read("rules.md", category="governance")
file_accessor.read("current-session.json", category="sessions")
```

---

## ✅ Benefits

### Path Independence
- ✅ Relocate KDS folder without changing agents
- ✅ Support multiple workspace configurations
- ✅ Centralized path management

### Safety Features
- ✅ Automatic backups before writes
- ✅ Validation of file existence
- ✅ Prevent overwrites of protected files

### Performance
- ✅ Optional caching layer
- ✅ Batch read operations
- ✅ Lazy loading

---

## 📚 Usage Examples

### In work-planner.md
```markdown
# Old (Direct)
rules = read_file("KDS/governance/rules.md")
design = read_file("KDS/KDS-DESIGN.md")

# New (Abstract)
#shared-module:file-accessor.md
rules = file_accessor.read("rules.md", category="governance")
design = file_accessor.read("KDS-DESIGN.md", category="root")
```

### In code-executor.md
```markdown
# Old (Direct)
session = read_file("KDS/sessions/current-session.json")
session.current_task = "1.3"
write_file("KDS/sessions/current-session.json", session)

# New (Abstract via session-loader)
#shared-module:session-loader.md  # Uses file-accessor internally
session = session_loader.load_current()
session.current_task = "1.3"
session_loader.save(session)
```

### In knowledge-retriever.md
```markdown
# Old (Direct)
patterns = glob("KDS/knowledge/test-patterns/*.md")

# New (Abstract)
#shared-module:file-accessor.md
patterns = file_accessor.list(
    pattern="*.md",
    category="knowledge/test-patterns"
)
```

---

## 🚨 Error Handling

### File Not Found
```json
{
  "error": "FILE_NOT_FOUND",
  "file_path": "work-planner.md",
  "category": "prompts/internal",
  "resolved_path": "KDS/prompts/internal/work-planner.md",
  "suggestion": "Verify file exists or check category"
}
```

### Write Permission Denied
```json
{
  "error": "WRITE_PERMISSION_DENIED",
  "file_path": "rules.md",
  "category": "governance",
  "suggestion": "Check file permissions or read-only status"
}
```

### Invalid Category
```json
{
  "error": "INVALID_CATEGORY",
  "category": "invalid-category",
  "valid_categories": ["prompts", "governance", "sessions", "knowledge", "tests"],
  "suggestion": "Use valid category from list"
}
```

---

## 🔄 Implementation

### Path Resolution
```python
def resolve_path(file_path, category):
    """Resolve category-based path to absolute path"""
    
    base_paths = {
        "prompts/user": "KDS/prompts/user",
        "prompts/internal": "KDS/prompts/internal",
        "prompts/shared": "KDS/prompts/shared",
        "governance": "KDS/governance",
        "sessions": "KDS/sessions",
        "knowledge/test-patterns": "KDS/knowledge/test-patterns",
        "knowledge/test-data": "KDS/knowledge/test-data",
        "knowledge/ui-mappings": "KDS/knowledge/ui-mappings",
        "knowledge/workflows": "KDS/knowledge/workflows",
        "tests": "Tests",
        "scripts": "KDS/scripts",
        "root": "KDS"
    }
    
    if category not in base_paths:
        raise InvalidCategoryError(category)
    
    base = base_paths[category]
    full_path = os.path.join(base, file_path)
    
    return os.path.abspath(full_path)
```

### Read with Caching
```python
_cache = {}

def read(file_path, category, use_cache=True):
    """Read file with optional caching"""
    
    resolved = resolve_path(file_path, category)
    
    # Check cache
    if use_cache and resolved in _cache:
        return _cache[resolved]
    
    # Read from disk
    if not os.path.exists(resolved):
        raise FileNotFoundError(resolved)
    
    with open(resolved, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Cache
    if use_cache:
        _cache[resolved] = content
    
    return content
```

### Write with Backup
```python
def write(file_path, content, category, create_backup=True):
    """Write file with automatic backup"""
    
    resolved = resolve_path(file_path, category)
    
    # Create backup
    if create_backup and os.path.exists(resolved):
        backup_path = f"{resolved}.backup"
        shutil.copy2(resolved, backup_path)
    
    # Write
    with open(resolved, 'w', encoding='utf-8') as f:
        f.write(content)
    
    # Clear cache
    if resolved in _cache:
        del _cache[resolved]
    
    return True
```

---

## 📝 Configuration (LOCAL ONLY)

### In kds.config.json
```json
{
  "file_accessor": {
    "enable_caching": true,
    "cache_ttl_seconds": 300,
    "auto_backup": true,
    "backup_location": "KDS/.backups",  // LOCAL directory
    "max_backups_per_file": 5,
    "implementation": "KDS/scripts/file-operations.ps1"  // LOCAL script
  }
}
```

**CRITICAL NOTES:**
- ✅ All operations are **local file system** only
- ✅ No external packages (uses PowerShell built-ins: Get-Content, Set-Content)
- ✅ Backups stored in KDS/.backups (local)
- ✅ Cache is in-memory (no external cache service)
- ✅ Zero network calls, zero external dependencies

---

**File Accessor: Decouple agents from file system!** 📁
