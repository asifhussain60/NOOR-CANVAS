# Isolated Testing Views

This folder contains isolation testing views created by the `@isolate` prompt for debugging functionality in a controlled environment.

## Purpose

Isolation views allow you to:
- Test complex functionality without the overhead of the main application
- Debug issues with controlled inputs and comprehensive logging
- Validate fixes before reintegrating into the codebase
- Create reproducible test scenarios
- Trace data flow through all application layers

## Structure

```
Isolated/
├── _IsolationTemplate.razor     # Template for creating new isolation views
├── README.md                    # This file
└── {Feature}Isolation.razor     # Individual feature isolation views
```

## Creating a New Isolation View

### Option 1: Use the @isolate Prompt (Recommended)

```
@isolate key="isolate-feature-name"
  source-files="path/to/source1.razor,path/to/source2.cs"
  functionality-description="Description of what you're isolating"
  test-scenarios="scenario1,scenario2,scenario3"
  debug-level="trace"
```

The agent will:
1. Analyze the source files
2. Extract the functionality
3. Generate an isolation view with auto-generated controls
4. Add comprehensive debug logging
5. Create test scenarios

### Option 2: Manual Creation

1. Copy `_IsolationTemplate.razor` to `{Feature}Isolation.razor`
2. Update the `@page` route
3. Add required service injections
4. Define test parameters
5. Implement `ExecuteIsolatedFunctionality()`
6. Extract and include styling from original files

## Isolation View Features

### Auto-Generated Controls
Each parameter gets an appropriate input control based on its type:
- `string` → Text input
- `int` → Number input
- `bool` → Checkbox
- `DateTime` → DateTime picker
- `Guid` → Text input with validation
- `Enum` → Dropdown select

### Test Scenarios
Predefined test cases that automatically populate parameters:
- **Happy Path**: Valid inputs, expected success
- **Edge Cases**: Boundary values, unusual combinations
- **Error Cases**: Invalid inputs, constraint violations

### Debug Logging
Comprehensive logging at all layers:
- **UI Layer**: User interactions, state changes
- **API Layer**: HTTP requests, validation
- **Service Layer**: Business logic, calculations
- **Data Layer**: Database queries, results
- **SignalR Layer**: Hub operations, broadcasts

### Results Viewer
Visual display of test execution results:
- Success/failure status
- Execution timestamp
- Detailed messages
- JSON payloads

### Log Viewer
Real-time display of debug logs:
- Color-coded by log level
- Filterable by layer
- Timestamps with millisecond precision
- Auto-scroll support

## Usage Workflow

### 1. Navigate to Isolation View
```
https://localhost:9091/isolated/{feature-name}
```

### 2. Configure Parameters
- Enter required parameter values
- Or click a test scenario to auto-populate

### 3. Execute Test
- Click "Execute Test" button
- Watch debug logs in real-time
- Review results

### 4. Debug and Fix
- Identify issues from debug logs
- Fix in the isolation view
- Re-test immediately

### 5. Reintegrate
- Apply fixes to original source files
- Test in main application
- Clean up debug logs if needed

## Best Practices

### DO ✅

- **Use real services**: No mocking or hardcoding
- **Add comprehensive logs**: Trace every step
- **Test all scenarios**: Happy path, edge cases, errors
- **Document findings**: Update key data stream
- **Clean up after**: Remove or mark as dev-only

### DON'T ❌

- **Don't hardcode data**: Use actual APIs and databases
- **Don't skip validation**: Always validate parameters
- **Don't over-engineer**: Keep it simple and focused
- **Don't commit to production**: Mark as development-only
- **Don't forget cleanup**: Remove debug logs when done

## Debug Log Format

All logs must follow this format:
```
[DEBUG-WORKITEM:isolate-{feature}:{layer}:{RUN_ID}] message ;CLEANUP_OK
```

**Layers**: ui, api, service, data, signalr, lifecycle

**Example**:
```csharp
Logger.LogTrace("[DEBUG-WORKITEM:isolate-canvas-questions:ui:101530] Button clicked - QuestionId=42 ;CLEANUP_OK", runId);
```

## Configuration

### Development Mode Only

To prevent isolation views from deploying to production:

**Option 1**: Conditional compilation
```csharp
#if DEBUG
    @page "/isolated/feature"
    // View code
#endif
```

**Option 2**: Exclude from publish
In `NoorCanvas.csproj`:
```xml
<ItemGroup>
    <Content Remove="Pages/Isolated/**" Condition="'$(Configuration)' == 'Release'" />
</ItemGroup>
```

**Option 3**: DevPanel wrapper
```razor
<DevPanel Title="Feature Isolation Testing">
    <!-- View content -->
</DevPanel>
```

## Examples

### Example 1: Question Upvoting
**File**: `QuestionUpvoteIsolation.razor`  
**Route**: `/isolated/canvas-questions`  
**Purpose**: Debug SignalR broadcasting issues

**Parameters**:
- SessionId (int, required)
- QuestionId (int, required)
- UserId (Guid, required)

**Scenarios**:
- Single user upvote
- Multiple rapid upvotes
- Network lag simulation
- Session ended error

### Example 2: Asset Detection
**File**: `AssetDetectionIsolation.razor`  
**Route**: `/isolated/asset-detection`  
**Purpose**: Debug performance of HTML parsing

**Parameters**:
- HtmlContent (string, required)
- SessionId (int, required)
- TimeoutMs (int, optional)

**Scenarios**:
- Small HTML (100 chars)
- Large HTML (1MB)
- HTML with 100 assets
- HTML with no assets

## Troubleshooting

### Issue: View doesn't compile
**Solution**: Check for missing `@inject` services and `@using` statements

### Issue: Parameters not updating
**Solution**: Verify `@bind` syntax and parameter types match controls

### Issue: Debug logs not showing
**Solution**: Ensure logger is injected and using correct log level

### Issue: API calls fail
**Solution**: Use `IHttpClientFactory` instead of direct `HttpClient`

## Resources

- **Isolate Prompt Documentation**: `/.github/prompts/isolate.prompt.md`
- **Usage Guide**: `/.github/prompts/ISOLATE-GUIDE.md`
- **Template File**: `./_IsolationTemplate.razor`
- **Debug Logging Mandate**: `/.github/prompts/shared/debug-logging-mandate.md`

## Cleanup

When you're done with an isolation view:

1. **Remove debug logs** from original source files (if using cleanup mode)
2. **Delete isolation view** or mark as development-only
3. **Update key data stream** with findings and resolution
4. **Commit changes** with descriptive message

---

**Remember**: Isolation views are temporary debugging tools, not permanent features. Use them to find bugs quickly, fix them with confidence, and then clean up.
