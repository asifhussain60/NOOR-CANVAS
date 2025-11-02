# Debug Logging Mandate (Code Insertion)

**Version**: 1.0.0  
**Last Updated**: 2025-10-11  
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

**C# Example**:
```csharp
Logger.LogInformation("[DEBUG-WORKITEM:scope:context] Key event occurred ;CLEANUP_OK");
```

**JavaScript Example**:
```javascript
console.log("[DEBUG-WORKITEM:scope:context] Event triggered ;CLEANUP_OK");
```

**When to use**: Initial implementation, basic troubleshooting

---

### `trace`
Insert **comprehensive debug markers** with state dumps.

**C# Example**:
```csharp
Logger.LogDebug("[DEBUG-WORKITEM:scope:context] Before: state={State}, value={Value} ;CLEANUP_OK", state, value);
// Perform operation
Logger.LogDebug("[DEBUG-WORKITEM:scope:context] After: state={State}, value={Value} ;CLEANUP_OK", state, value);
```

**JavaScript Example**:
```javascript
console.log(`[DEBUG-WORKITEM:scope:context] Before: state=${state}, value=${value} ;CLEANUP_OK`);
// Perform operation
console.log(`[DEBUG-WORKITEM:scope:context] After: state=${state}, value=${value} ;CLEANUP_OK`);
```

**When to use**: Complex debugging, state tracking, multi-step workflows

---

### `cleanup`
Search for and **remove all debug markers** matching these patterns:
- `[DEBUG-WORKITEM:*] ;CLEANUP_OK`
- `// DEBUG-WORKITEM:* ;CLEANUP_OK`
- `console.log("[DEBUG-WORKITEM:*] ;CLEANUP_OK")`

**Implementation**:
1. Use `grep_search` to find all debug markers
2. Remove matching lines/statements
3. Verify no debug markers remain (use `grep_search` again)
4. Commit cleanup: `git commit -m "chore({key}): Remove debug logging markers"`

**When to use**: Before production deployment, completion workflow, code cleanup

---

## Marker Format

### Pattern
```
[DEBUG-WORKITEM:scope:context] message ;CLEANUP_OK
```

**Components**:
- `DEBUG-WORKITEM`: Fixed prefix for detection
- `scope`: Feature/module (e.g., "canvas", "voting", "auth")
- `context`: Specific location (e.g., "SubmitQuestion", "BroadcastResults")
- `message`: Descriptive log message
- `;CLEANUP_OK`: **MANDATORY** suffix for automatic cleanup

### Examples

**C# Logging**:
```csharp
// Basic info
Logger.LogInformation("[DEBUG-WORKITEM:voting:SubmitVote] Vote submitted for questionId={QuestionId} ;CLEANUP_OK", questionId);

// Detailed trace
Logger.LogDebug("[DEBUG-WORKITEM:canvas:LoadQuestions] Loaded {Count} questions for session {SessionId} ;CLEANUP_OK", questions.Count, sessionId);

// Error tracking
Logger.LogError("[DEBUG-WORKITEM:broadcast:SendMessage] Failed to broadcast: {Error} ;CLEANUP_OK", ex.Message);
```

**JavaScript Logging**:
```javascript
// Basic info
console.log(`[DEBUG-WORKITEM:voting:submitVote] Vote submitted for questionId=${questionId} ;CLEANUP_OK`);

// Detailed trace
console.log(`[DEBUG-WORKITEM:canvas:loadQuestions] Loaded ${questions.length} questions for session ${sessionId} ;CLEANUP_OK`);

// Error tracking
console.error(`[DEBUG-WORKITEM:broadcast:sendMessage] Failed to broadcast: ${error} ;CLEANUP_OK`);
```

**Comments**:
```csharp
// DEBUG-WORKITEM:canvas:refactor Temporary workaround for issue #123 ;CLEANUP_OK

/* DEBUG-WORKITEM:voting:investigation
   Testing alternative approach for vote aggregation
   Remove after validation ;CLEANUP_OK */
```

---

## Critical Rules

1. **ALWAYS include `;CLEANUP_OK` suffix** - Enables automatic detection and removal
2. **Follow pattern exactly** - `[DEBUG-WORKITEM:scope:context] message ;CLEANUP_OK`
3. **Never commit debug logging to production** without explicit approval
4. **Use appropriate log level**:
   - `LogInformation` / `console.log` for simple markers
   - `LogDebug` / `console.debug` for trace markers
   - `LogError` / `console.error` for error tracking
5. **Scope should match key or feature name** for easy filtering
6. **Context should identify code location** (method, handler, component)

---

## Cleanup Procedures

### Manual Cleanup

```bash
# Search for all debug markers
grep -r "DEBUG-WORKITEM.*CLEANUP_OK" --include="*.cs" --include="*.js" --include="*.razor"

# Review and remove each marker
# Then commit
git commit -m "chore({key}): Remove debug logging markers"
```

### Automated Cleanup (via task.prompt.md)

**Invoke with `debug-level: cleanup`**:
```
Follow instructions in task.prompt.md.
key: {your-key}
debug-level: cleanup
tasks: Remove all debug markers
```

Agent will:
1. Search workspace for all debug markers
2. Remove matching lines/statements
3. Verify cleanup complete
4. Commit changes

### Completion Workflow Auto-Cleanup

When marking task complete, Step 9.2 automatically removes all debug markers:
```
Follow instructions in task.prompt.md.
key: {your-key}
tasks: mark complete
```

---

## Usage

**Reference this module** in your prompt:
```markdown
## Debug Logging Mandate
**See**: [Debug Logging Mandate](shared/debug-logging-mandate.md)

Respect `debug-level` parameter when implementing code.
```

OR **Include inline**:
```markdown
## Debug Logging Mandate
Insert debug markers following pattern: `[DEBUG-WORKITEM:scope:context] message ;CLEANUP_OK`
Levels: none (default), simple, trace, cleanup. See shared/debug-logging-mandate.md for details.
```

---

## Integration with Parameters

In your prompt's Parameters section:

```markdown
- **debug-level** *(optional, default=`none`)*  
  Controls debug logging code inserted into source files.  
  Options: `none`, `simple`, `trace`, `cleanup`.  
  See [Debug Logging Mandate](shared/debug-logging-mandate.md) for details.
```

---

## Examples by Language

### C# (ASP.NET Core)

```csharp
public async Task<IActionResult> SubmitQuestion([FromBody] QuestionSubmitRequest request)
{
    Logger.LogInformation("[DEBUG-WORKITEM:canvas:SubmitQuestion] Received question submission ;CLEANUP_OK");
    
    var question = new Question
    {
        Text = request.Text,
        SessionId = request.SessionId
    };
    
    Logger.LogDebug("[DEBUG-WORKITEM:canvas:SubmitQuestion] Created question entity: {@Question} ;CLEANUP_OK", question);
    
    await _context.Questions.AddAsync(question);
    await _context.SaveChangesAsync();
    
    Logger.LogInformation("[DEBUG-WORKITEM:canvas:SubmitQuestion] Question saved, ID={QuestionId} ;CLEANUP_OK", question.Id);
    
    return Ok(new { questionId = question.Id });
}
```

### JavaScript/Blazor

```javascript
async function submitVote(questionId, vote) {
    console.log(`[DEBUG-WORKITEM:voting:submitVote] Submitting vote for question ${questionId} ;CLEANUP_OK`);
    
    try {
        const response = await fetch('/api/Vote/Submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ questionId, vote })
        });
        
        console.log(`[DEBUG-WORKITEM:voting:submitVote] Response status: ${response.status} ;CLEANUP_OK`);
        
        const result = await response.json();
        console.log(`[DEBUG-WORKITEM:voting:submitVote] Vote submitted successfully ;CLEANUP_OK`);
        
        return result;
    } catch (error) {
        console.error(`[DEBUG-WORKITEM:voting:submitVote] Failed: ${error.message} ;CLEANUP_OK`);
        throw error;
    }
}
```

### Razor Components

```razor
@code {
    private async Task HandleSubmit()
    {
        Logger.LogInformation("[DEBUG-WORKITEM:canvas:HandleSubmit] Form submission started ;CLEANUP_OK");
        
        // Validation
        if (string.IsNullOrWhiteSpace(QuestionText))
        {
            Logger.LogWarning("[DEBUG-WORKITEM:canvas:HandleSubmit] Validation failed: empty question ;CLEANUP_OK");
            return;
        }
        
        Logger.LogDebug("[DEBUG-WORKITEM:canvas:HandleSubmit] Calling API with text: {Text} ;CLEANUP_OK", QuestionText);
        
        await SubmitQuestion(QuestionText);
        
        Logger.LogInformation("[DEBUG-WORKITEM:canvas:HandleSubmit] Submission complete ;CLEANUP_OK");
    }
}
```

---

## Version History

- **v1.0.0** (2025-10-11): Initial extraction from task.prompt.md
  - Debug levels: none, simple, trace, cleanup
  - Marker format specification
  - Cleanup procedures
  - Language-specific examples
  - Integration with completion workflow
