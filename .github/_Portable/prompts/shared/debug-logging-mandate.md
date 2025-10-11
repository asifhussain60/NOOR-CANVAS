# Debug Logging Mandate (Code Insertion)

**Version**: 1.0.0  
**Purpose**: Standardize debug logging insertion for troubleshooting and cleanup

---

## Overview

The `debug-level` parameter controls debug logging code **inserted INTO source files**, NOT agent output verbosity.

This mandate ensures:
- Consistent debug marker format across all code
- Automatic detection and cleanup capability
- Clear separation between debug and production code

---

## Debug Levels

### `none` (Default)
Write production-ready code with **no debug logging** inserted.

**When to use**: Production releases, clean implementations

---

### `simple`
Insert **basic debug markers** at key integration points.

**Language-Specific Examples:**

**C# / .NET:**
```csharp
Logger.LogInformation("[DEBUG-WORKITEM:scope:context] Key event occurred ;CLEANUP_OK");
```

**JavaScript / TypeScript:**
```javascript
console.log("[DEBUG-WORKITEM:scope:context] Event triggered ;CLEANUP_OK");
```

**Python:**
```python
logger.info("[DEBUG-WORKITEM:scope:context] Process started ;CLEANUP_OK")
```

**Java:**
```java
logger.info("[DEBUG-WORKITEM:scope:context] Operation completed ;CLEANUP_OK");
```

**When to use**: Initial implementation, basic troubleshooting

---

### `trace`
Insert **comprehensive debug markers** with state dumps.

**C# Example:**
```csharp
Logger.LogInformation("[DEBUG-WORKITEM:scope:context] Before operation: {@State} ;CLEANUP_OK", currentState);
var result = PerformOperation();
Logger.LogInformation("[DEBUG-WORKITEM:scope:context] After operation: {@Result} ;CLEANUP_OK", result);
```

**JavaScript Example:**
```javascript
console.log("[DEBUG-WORKITEM:scope:context] Before:", JSON.stringify(state), ";CLEANUP_OK");
const result = performOperation();
console.log("[DEBUG-WORKITEM:scope:context] After:", JSON.stringify(result), ";CLEANUP_OK");
```

**Python Example:**
```python
logger.debug(f"[DEBUG-WORKITEM:scope:context] Input: {input_data} ;CLEANUP_OK")
result = process_data(input_data)
logger.debug(f"[DEBUG-WORKITEM:scope:context] Output: {result} ;CLEANUP_OK")
```

**When to use**: Complex debugging, state tracking, integration issues

---

### `cleanup`
**Remove ALL debug markers** from codebase.

**Detection Pattern:**
```regex
\[DEBUG-WORKITEM:[^\]]+\].*?;CLEANUP_OK
```

**Process:**
1. Search for all lines containing `[DEBUG-WORKITEM:` and `;CLEANUP_OK`
2. Remove entire line including logging statement
3. Clean up empty blocks or orphaned braces
4. Verify build still succeeds

**When to use**: Before production deployment, after debugging complete

---

## Marker Format

### Standard Pattern
```
[DEBUG-WORKITEM:{scope}:{context}] {message} ;CLEANUP_OK
```

**Components:**
- `DEBUG-WORKITEM` - Fixed prefix for detection
- `scope` - High-level area (key, feature, component)
- `context` - Specific location or operation
- `message` - Human-readable debug information
- `;CLEANUP_OK` - Mandatory suffix for automatic removal

### Examples by Scope

**Feature Implementation:**
```
[DEBUG-WORKITEM:user-auth:login] Validating credentials ;CLEANUP_OK
[DEBUG-WORKITEM:user-auth:session] Creating session token ;CLEANUP_OK
```

**Refactoring:**
```
[DEBUG-WORKITEM:refactor:extract-method] Before extraction ;CLEANUP_OK
[DEBUG-WORKITEM:refactor:extract-method] After extraction ;CLEANUP_OK
```

**Integration Testing:**
```
[DEBUG-WORKITEM:integration:api-call] Request sent ;CLEANUP_OK
[DEBUG-WORKITEM:integration:api-call] Response received ;CLEANUP_OK
```

---

## Placement Guidelines

### Where to Place Debug Markers

**Integration Points:**
```csharp
public async Task<Response> ProcessRequest(Request request)
{
    Logger.LogInformation("[DEBUG-WORKITEM:api:process] Request received: {@Request} ;CLEANUP_OK", request);
    
    var result = await _service.Process(request);
    
    Logger.LogInformation("[DEBUG-WORKITEM:api:process] Response prepared: {@Response} ;CLEANUP_OK", result);
    return result;
}
```

**State Transitions:**
```javascript
function updateState(newState) {
    console.log("[DEBUG-WORKITEM:state:update] Before:", currentState, ";CLEANUP_OK");
    currentState = newState;
    console.log("[DEBUG-WORKITEM:state:update] After:", currentState, ";CLEANUP_OK");
}
```

**Error Paths:**
```python
try:
    result = risky_operation()
    logger.info(f"[DEBUG-WORKITEM:operation:success] Result: {result} ;CLEANUP_OK")
except Exception as e:
    logger.error(f"[DEBUG-WORKITEM:operation:failure] Error: {e} ;CLEANUP_OK")
    raise
```

### Where NOT to Place

❌ **Inside loops** (creates excessive output):
```csharp
// BAD
foreach (var item in items)
{
    Logger.LogInformation("[DEBUG-WORKITEM:loop:item] Processing ;CLEANUP_OK");
}
```

❌ **In hot paths** (performance impact):
```javascript
// BAD
function frequentlyCalled() {
    console.log("[DEBUG-WORKITEM:hot:path] Called ;CLEANUP_OK");
    // This executes thousands of times per second
}
```

❌ **In production-only code**:
```python
# BAD - Don't add debug markers to stable, production code
def well_tested_function():
    logger.info("[DEBUG-WORKITEM:stable:code] Running ;CLEANUP_OK")
```

---

## Language-Specific Patterns

### C# / .NET
```csharp
// Simple
_logger.LogInformation("[DEBUG-WORKITEM:{Key}:{Context}] {Message} ;CLEANUP_OK", key, context, message);

// Trace with state
_logger.LogDebug("[DEBUG-WORKITEM:{Key}:{Context}] State: {@State} ;CLEANUP_OK", key, context, state);

// Comment style (for non-logged debug info)
// DEBUG-WORKITEM: Temporary implementation for testing ;CLEANUP_OK
```

### JavaScript / TypeScript
```typescript
// Simple
console.log(`[DEBUG-WORKITEM:${key}:${context}] ${message} ;CLEANUP_OK`);

// Trace with state
console.log(`[DEBUG-WORKITEM:${key}:${context}] State:`, JSON.stringify(state), `;CLEANUP_OK`);

// Comment style
// DEBUG-WORKITEM: Testing new approach ;CLEANUP_OK
```

### Python
```python
# Simple
logger.info(f"[DEBUG-WORKITEM:{key}:{context}] {message} ;CLEANUP_OK")

# Trace with state
logger.debug(f"[DEBUG-WORKITEM:{key}:{context}] State: {state} ;CLEANUP_OK")

# Comment style
# DEBUG-WORKITEM: Experimental feature ;CLEANUP_OK
```

### Java
```java
// Simple
logger.info("[DEBUG-WORKITEM:{}:{}] {} ;CLEANUP_OK", key, context, message);

// Trace with state
logger.debug("[DEBUG-WORKITEM:{}:{}] State: {} ;CLEANUP_OK", key, context, state);

// Comment style
// DEBUG-WORKITEM: Legacy code path ;CLEANUP_OK
```

---

## Cleanup Process

### Automatic Cleanup (debug-level=cleanup)

**Step 1: Detection**
```bash
# Find all debug markers (example for Unix-like systems)
grep -r "\[DEBUG-WORKITEM:" --include="*.cs" --include="*.js" --include="*.ts" --include="*.py" --include="*.java"
```

**Step 2: Removal**
Agent automatically removes:
- Logging statements with debug markers
- Comment-style debug markers
- Empty lines left after removal
- Orphaned braces/blocks

**Step 3: Validation**
- Build project to ensure still compiles
- Run tests to ensure functionality preserved
- Review changes before committing

### Manual Cleanup (if needed)

**Search Pattern (Regex):**
```regex
.*\[DEBUG-WORKITEM:.*?\].*?;CLEANUP_OK.*
```

**Replace With:** (empty)

---

## Best Practices

1. **Always include `;CLEANUP_OK`** - Required for automatic removal
2. **Use consistent scope naming** - Match key names when possible
3. **Include context** - Helps identify where logging occurs
4. **Avoid sensitive data** - Don't log passwords, tokens, PII
5. **Remove before production** - Use `debug-level=cleanup`
6. **Don't commit debug markers** - Unless actively debugging production issue

---

## Integration with Agents

### Task Agent
- Adds debug markers during implementation if `debug-level=simple|trace`
- Removes at completion if `debug-level=cleanup`

### Refactor Agent
- Preserves existing debug markers during refactoring
- Can add markers to track refactoring impact
- Removes all before completion

### Health Check Agent
- Detects remaining debug markers
- Reports as warning if found in production branches

---

## Troubleshooting

**Q: Debug markers not being removed?**
A: Ensure `;CLEANUP_OK` suffix is present on same line

**Q: Build fails after cleanup?**
A: Review removed code - may have orphaned braces/blocks

**Q: Too much debug output?**
A: Use `debug-level=simple` instead of `trace`, or add to hot paths selectively

**Q: Need persistent logging?**
A: Use standard logging without debug markers for production logging needs

---

## Examples

### Complete Example: C# Feature Implementation

```csharp
public class UserService
{
    private readonly ILogger<UserService> _logger;

    public async Task<User> CreateUser(CreateUserRequest request)
    {
        // DEBUG-WORKITEM: Validating input before processing ;CLEANUP_OK
        _logger.LogInformation("[DEBUG-WORKITEM:user-service:create] Request received: {@Request} ;CLEANUP_OK", request);
        
        var user = new User
        {
            Email = request.Email,
            Name = request.Name
        };
        
        _logger.LogInformation("[DEBUG-WORKITEM:user-service:create] User object created: {@User} ;CLEANUP_OK", user);
        
        await _repository.SaveAsync(user);
        
        _logger.LogInformation("[DEBUG-WORKITEM:user-service:create] User saved to database: {UserId} ;CLEANUP_OK", user.Id);
        
        return user;
    }
}
```

### Complete Example: JavaScript API Integration

```javascript
async function fetchUserData(userId) {
    console.log(`[DEBUG-WORKITEM:api:fetch-user] Starting fetch for user: ${userId} ;CLEANUP_OK`);
    
    try {
        const response = await fetch(`/api/users/${userId}`);
        console.log(`[DEBUG-WORKITEM:api:fetch-user] Response status: ${response.status} ;CLEANUP_OK`);
        
        const data = await response.json();
        console.log(`[DEBUG-WORKITEM:api:fetch-user] Data received:`, JSON.stringify(data), `;CLEANUP_OK`);
        
        return data;
    } catch (error) {
        console.error(`[DEBUG-WORKITEM:api:fetch-user] Error: ${error.message} ;CLEANUP_OK`);
        throw error;
    }
}
```

---

## Summary

| Level | Use Case | Markers Inserted | Cleanup |
|-------|----------|------------------|---------|
| `none` | Production code | None | N/A |
| `simple` | Basic debugging | Key points only | Manual or auto |
| `trace` | Deep debugging | Comprehensive | Manual or auto |
| `cleanup` | Pre-production | N/A | Removes all |

**Remember:** Debug markers are temporary troubleshooting tools, not production logging.
