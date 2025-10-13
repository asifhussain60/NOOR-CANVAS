# Isolation Testing Prompt - Quick Start Guide

## What is Isolation Testing?

Isolation testing extracts complex functionality into a standalone test harness where you can:
- Debug issues without side effects from the main application
- Test edge cases with controlled inputs using auto-generated controls
- Validate fixes before reintegrating into the codebase
- Create reproducible test scenarios
- Add comprehensive trace logging through all layers

## When to Use the Isolate Prompt

✅ **USE when you need to**:
- Debug a bug that's hard to reproduce in the main app
- Test a complex feature with many parameters
- Validate SignalR real-time updates
- Trace data flow from UI → API → Service → Database
- Test edge cases and error scenarios systematically
- Fix an issue and verify the fix works in isolation first

❌ **DON'T USE when**:
- Building new features from scratch (use `task` prompt)
- Making simple one-line fixes (just fix directly)
- The issue is in build/deployment configuration
- You just need to read code (use semantic search)

## Quick Start - 3 Steps

### Step 1: Identify What to Isolate

Ask yourself:
1. **What functionality is broken?** (e.g., "Question upvoting not updating UI")
2. **Which files contain this functionality?** (e.g., SessionCanvas.razor, QuestionController.cs)
3. **What parameters does it need?** (e.g., sessionId, questionId, userId)

### Step 2: Invoke the Prompt

```
@isolate key="isolate-canvas-questions"
  source-files="SPA/NoorCanvas/Pages/SessionCanvas.razor,SPA/NoorCanvas/Controllers/QuestionController.cs"
  functionality-description="Question upvoting with SignalR real-time updates to all session participants"
  test-scenarios="single upvote,rapid upvotes,network lag,session ended"
  debug-level="trace"
```

### Step 3: Test, Fix, Reintegrate

1. Navigate to `/isolated/canvas-questions` in your browser
2. Use the auto-generated controls to test scenarios
3. Review debug logs to find the root cause
4. Fix the issue in the isolation view
5. Verify all test scenarios pass
6. Reintegrate the fix back to the original files

## Detailed Examples

### Example 1: Debug SignalR Broadcasting Issue

**Problem**: Upvotes not broadcasting to other users

**Invocation**:
```
@isolate key="isolate-signalr-broadcast"
  source-files="SPA/NoorCanvas/Controllers/QuestionController.cs,SPA/NoorCanvas/Hubs/SessionHub.cs"
  functionality-description="SignalR broadcasting when question is upvoted. Should send message to group 'session_{sessionId}' with updated vote count."
  test-scenarios="broadcast to 1 user,broadcast to 50 users,broadcast with disconnected user,broadcast with network partition"
  debug-level="trace"
```

**What You Get**:
- Input controls for sessionId, questionId, voteCount
- Button to trigger the broadcast
- Real-time log viewer showing:
  - API endpoint called with parameters
  - SignalR hub invoked with group name
  - Message payload sent
  - Broadcast confirmation
- Results showing success/failure for each test

**Expected Debug Output**:
```
[DEBUG-WORKITEM:isolate-signalr-broadcast:api:123456] API endpoint called - QuestionId=42, SessionId=10
[DEBUG-WORKITEM:isolate-signalr-broadcast:signalr:123456] Broadcasting to group=session_10, method=QuestionVoteUpdated
[DEBUG-WORKITEM:isolate-signalr-broadcast:signalr:123456] Broadcast payload={questionId:42,votes:5}
[DEBUG-WORKITEM:isolate-signalr-broadcast:signalr:123456] Broadcast complete - ClientCount=3
```

### Example 2: Debug Database Query Performance

**Problem**: Asset detection query taking 30+ seconds

**Invocation**:
```
@isolate key="isolate-asset-query"
  source-files="SPA/NoorCanvas/Services/AssetService.cs,SPA/NoorCanvas/Data/Repositories/AssetRepository.cs"
  functionality-description="Asset detection in HTML content. Parses HTML, extracts asset markers, queries AssetLookup table, returns matched assets."
  test-scenarios="small HTML 100 chars,medium HTML 10KB,large HTML 1MB,HTML with 100 assets,HTML with no assets"
  debug-level="trace"
```

**What You Get**:
- Text area to paste HTML content
- Number input for timeout threshold (ms)
- Button to execute detection
- Performance metrics for each stage:
  - HTML parsing duration
  - Database query duration
  - Result processing duration
- Debug logs showing:
  - SQL query generated
  - Number of rows scanned
  - Query execution plan (if applicable)

**Expected Debug Output**:
```
[DEBUG-WORKITEM:isolate-asset-query:service:123456] Starting asset detection - HtmlLength=50000
[DEBUG-WORKITEM:isolate-asset-query:service:123456] Parsed HTML in 15ms - Found 23 potential markers
[DEBUG-WORKITEM:isolate-asset-query:data:123456] Executing query - MarkerCount=23
[DEBUG-WORKITEM:isolate-asset-query:data:123456] Query completed in 2300ms - RowsReturned=12
[DEBUG-WORKITEM:isolate-asset-query:service:123456] Asset detection complete - Total=2315ms
```

### Example 3: Debug UI State Management

**Problem**: Question card not re-rendering after upvote

**Invocation**:
```
@isolate key="isolate-question-card"
  source-files="SPA/NoorCanvas/Pages/SessionCanvas.razor"
  functionality-description="Question card UI component. Displays question text, vote count, upvote button. Should re-render when SignalR broadcasts vote update."
  test-scenarios="initial render,upvote local,receive SignalR update,multiple rapid updates,update for different question"
  debug-level="trace"
```

**What You Get**:
- Live preview of the question card
- Controls to simulate:
  - Question data (id, text, votes, createdBy)
  - SignalR message payload
  - User interaction (click upvote)
- State inspector showing:
  - Current component state
  - Parameter values
  - Change detection logs

**Expected Debug Output**:
```
[DEBUG-WORKITEM:isolate-question-card:ui:123456] Component rendering - QuestionId=42, Votes=5
[DEBUG-WORKITEM:isolate-question-card:ui:123456] User clicked upvote - CurrentVotes=5
[DEBUG-WORKITEM:isolate-question-card:ui:123456] API call successful - NewVotes=6
[DEBUG-WORKITEM:isolate-question-card:ui:123456] SignalR update received - QuestionId=42, Votes=6
[DEBUG-WORKITEM:isolate-question-card:ui:123456] StateHasChanged() called
[DEBUG-WORKITEM:isolate-question-card:ui:123456] Component re-rendering - QuestionId=42, Votes=6
```

## Understanding the Isolation View UI

### Layout Overview

```
┌─────────────────────────────────────────────────────────┐
│ 🧪 Isolation Test: Question Upvoting                   │
│ Testing in isolation for debugging and validation       │
│ [Key: isolate-canvas-questions] [Debug: trace] [Ready] │
├─────────────────────────────────────────────────────────┤
│ 🎛️ Test Parameters                                      │
│                                                          │
│ Session ID *                                            │
│ [123________________]                                   │
│ The session to test against                             │
│                                                          │
│ Question ID *                                           │
│ [42_________________]                                   │
│ The question to upvote                                  │
│                                                          │
│ User GUID *                                             │
│ [c4f2e1a0-1234-5678-90ab-cdef12345678]                 │
│ The user performing the upvote                          │
├─────────────────────────────────────────────────────────┤
│ [▶️ Execute Test] [🧹 Clear Results] [↺ Reset Params]   │
├─────────────────────────────────────────────────────────┤
│ ✅ Test Scenarios                                       │
│                                                          │
│ [🧪 Single Upvote] [🧪 Rapid Upvotes] [🧪 Network Lag] │
│ [🧪 Session Ended]                                      │
├─────────────────────────────────────────────────────────┤
│ 📊 Test Results                                         │
│                                                          │
│ ✅ 10:15:23.456  SUCCESS                                │
│    Test completed successfully                          │
│    {"questionId":42,"votes":6,"success":true}          │
├─────────────────────────────────────────────────────────┤
│ 💻 Debug Logs                                   [🗑️]    │
│                                                          │
│ 10:15:23.123 [INFO] [ui] Test execution started        │
│ 10:15:23.145 [TRACE] [ui] SessionId=123                │
│ 10:15:23.167 [INFO] [api] Sending API request...       │
│ 10:15:23.234 [INFO] [api] API response: 200 OK         │
│ 10:15:23.256 [TRACE] [service] Business logic start    │
│ 10:15:23.278 [TRACE] [data] Database query executing   │
│ 10:15:23.345 [TRACE] [data] Query completed - 1 row    │
│ 10:15:23.367 [TRACE] [signalr] Broadcasting message    │
│ 10:15:23.389 [SUCCESS] [ui] Test execution completed   │
├─────────────────────────────────────────────────────────┤
│ 👁️ Live Preview                                        │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ [Extracted functionality renders here]              │ │
│ │                                                     │ │
│ │ ❓ What are the five pillars of Islam?             │ │
│ │                                                     │ │
│ │ 👤 Muhammad Ali • 2 minutes ago                    │ │
│ │                                                     │ │
│ │ [⬆️ 6]  [✏️ Edit]  [🗑️ Delete]                     │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### UI Components Explained

1. **Header**: Shows isolation key, debug level, and current status
2. **Test Parameters**: Auto-generated input controls for all function parameters
3. **Action Buttons**: Execute test, clear results, reset to defaults
4. **Test Scenarios**: Predefined test cases that auto-fill parameters
5. **Test Results**: Timeline of test executions with success/failure status
6. **Debug Logs**: Real-time logs from all layers (ui → api → service → data → signalr)
7. **Live Preview**: Actual functionality rendered in isolation

## Debug Log Markers Reference

All debug logs follow this format:
```
[DEBUG-WORKITEM:isolate-{feature}:{layer}:{RUN_ID}] message ;CLEANUP_OK
```

### Layers

| Layer | Description | Example |
|-------|-------------|---------|
| `ui` | Blazor component, user interactions | Button clicked, component rendered |
| `api` | Controller endpoints, HTTP requests | API called, validation failed |
| `service` | Business logic, calculations | Rule evaluated, process started |
| `data` | Database queries, repository calls | Query executed, rows returned |
| `signalr` | SignalR hub operations, broadcasts | Message sent, client connected |
| `lifecycle` | Component lifecycle events | OnInitialized, OnAfterRender |

### Log Levels

| Level | When to Use | Color in UI |
|-------|-------------|-------------|
| `LogTrace` | Every step, state dumps, detailed flow | Purple |
| `LogInformation` | Major events, milestones | Blue |
| `LogWarning` | Unexpected but handled situations | Orange |
| `LogError` | Failures, exceptions | Red |

### Example Log Patterns

**UI Layer**:
```csharp
Logger.LogTrace("[DEBUG-WORKITEM:isolate-{feature}:ui:{RunId}] Button clicked - ButtonId={ButtonId} ;CLEANUP_OK", runId, buttonId);
Logger.LogTrace("[DEBUG-WORKITEM:isolate-{feature}:ui:{RunId}] State before update - State={State} ;CLEANUP_OK", runId, JsonSerializer.Serialize(state));
Logger.LogInformation("[DEBUG-WORKITEM:isolate-{feature}:ui:{RunId}] Component re-rendering ;CLEANUP_OK", runId);
```

**API Layer**:
```csharp
_logger.LogInformation("[DEBUG-WORKITEM:isolate-{feature}:api:{RunId}] Endpoint invoked - Method={Method}, Path={Path} ;CLEANUP_OK", runId, method, path);
_logger.LogTrace("[DEBUG-WORKITEM:isolate-{feature}:api:{RunId}] Request payload - Payload={Payload} ;CLEANUP_OK", runId, JsonSerializer.Serialize(request));
_logger.LogTrace("[DEBUG-WORKITEM:isolate-{feature}:api:{RunId}] Validation result - IsValid={IsValid}, Errors={Errors} ;CLEANUP_OK", runId, isValid, errors);
```

**Service Layer**:
```csharp
_logger.LogTrace("[DEBUG-WORKITEM:isolate-{feature}:service:{RunId}] Service method entry - Parameters={Params} ;CLEANUP_OK", runId, JsonSerializer.Serialize(parameters));
_logger.LogTrace("[DEBUG-WORKITEM:isolate-{feature}:service:{RunId}] Business rule: {RuleName} - Result={Result} ;CLEANUP_OK", runId, ruleName, result);
_logger.LogInformation("[DEBUG-WORKITEM:isolate-{feature}:service:{RunId}] Operation completed - Duration={DurationMs}ms ;CLEANUP_OK", runId, duration);
```

**Data Layer**:
```csharp
_logger.LogTrace("[DEBUG-WORKITEM:isolate-{feature}:data:{RunId}] Executing query - Query={QueryDescription} ;CLEANUP_OK", runId, queryDesc);
_logger.LogTrace("[DEBUG-WORKITEM:isolate-{feature}:data:{RunId}] Query parameters - Params={Params} ;CLEANUP_OK", runId, JsonSerializer.Serialize(params));
_logger.LogInformation("[DEBUG-WORKITEM:isolate-{feature}:data:{RunId}] Query completed - RowCount={RowCount}, Duration={DurationMs}ms ;CLEANUP_OK", runId, rowCount, duration);
```

**SignalR Layer**:
```csharp
_logger.LogInformation("[DEBUG-WORKITEM:isolate-{feature}:signalr:{RunId}] Broadcasting - Group={GroupName}, Method={MethodName} ;CLEANUP_OK", runId, groupName, methodName);
_logger.LogTrace("[DEBUG-WORKITEM:isolate-{feature}:signalr:{RunId}] Broadcast payload - Payload={Payload} ;CLEANUP_OK", runId, JsonSerializer.Serialize(payload));
_logger.LogInformation("[DEBUG-WORKITEM:isolate-{feature}:signalr:{RunId}] Broadcast complete - ClientCount={ClientCount} ;CLEANUP_OK", runId, clientCount);
```

## Test Scenarios Deep Dive

### Creating Effective Test Scenarios

Good test scenarios should:
1. **Be specific**: "Upvote with 50 existing votes" not "Test upvoting"
2. **Cover edge cases**: Boundary values, empty states, max limits
3. **Test error paths**: Invalid inputs, network failures, constraints
4. **Be reproducible**: Same inputs always give same results
5. **Be independent**: Each scenario can run standalone

### Scenario Categories

#### 1. Happy Path Scenarios
Test typical, successful usage:
- Valid inputs
- Normal data ranges
- Expected user workflows

**Example**:
```
test-scenarios="valid upvote,upvote increases count,broadcast sends to all users"
```

#### 2. Edge Case Scenarios
Test boundary conditions:
- Empty/null values
- Minimum/maximum values
- Unusual but valid combinations

**Example**:
```
test-scenarios="upvote with 0 votes,upvote with 999 votes,upvote by owner,upvote same question twice"
```

#### 3. Error Scenarios
Test failure handling:
- Invalid inputs
- Database errors
- Network timeouts
- Permission denied

**Example**:
```
test-scenarios="upvote nonexistent question,upvote in ended session,upvote with invalid user,database timeout"
```

#### 4. Performance Scenarios
Test under load:
- Large data volumes
- Concurrent operations
- Slow network conditions

**Example**:
```
test-scenarios="upvote with 1000 participants,10 rapid upvotes,upvote with 500ms latency"
```

#### 5. Race Condition Scenarios
Test concurrent operations:
- Multiple users same action
- Simultaneous database updates
- SignalR broadcast timing

**Example**:
```
test-scenarios="5 users upvote simultaneously,upvote during delete,upvote during session end"
```

## Reintegration Checklist

Before bringing fixes back to the main application:

### 1. Pre-Reintegration Validation
- [ ] All test scenarios pass in isolation view
- [ ] No hardcoded values remain (check for TODO comments)
- [ ] Debug logs follow standard format with `;CLEANUP_OK`
- [ ] Performance is acceptable (no unexpected delays)
- [ ] Error handling is comprehensive

### 2. Code Review
- [ ] Review diff between isolated and original code
- [ ] Verify only intended changes are present
- [ ] Check for unintended side effects
- [ ] Confirm coding standards are met
- [ ] Ensure comments explain non-obvious changes

### 3. Dependency Check
- [ ] No new NuGet packages added (or documented if required)
- [ ] No new service injections (or justified if needed)
- [ ] Configuration changes documented in appsettings.json
- [ ] Database schema changes scripted (if applicable)

### 4. Reintegration Execution
- [ ] Create backup branch: `git checkout -b backup-before-reintegrate`
- [ ] Apply changes file by file using `replace_string_in_file`
- [ ] Build after each file to catch errors early
- [ ] Run unit tests after each file
- [ ] Run integration tests after all files

### 5. Post-Reintegration Testing
- [ ] Main application builds successfully
- [ ] Feature works in original context
- [ ] No regressions in related features
- [ ] Playwright E2E tests pass
- [ ] Performance benchmarks unchanged

### 6. Cleanup
- [ ] Decide on debug log retention:
  - Option A: Remove all logs (debug-level=cleanup)
  - Option B: Keep essential logs, remove trace
  - Option C: Keep all logs for production debugging
- [ ] Remove or mark isolation view as development-only
- [ ] Update documentation with findings
- [ ] Close related issues/work items

### 7. Commit and Document
- [ ] Commit with descriptive message following conventions
- [ ] Update key data stream with reintegration results
- [ ] Document any gotchas or future considerations
- [ ] Update related documentation (API docs, architecture)

## Troubleshooting Common Issues

### Issue: Isolation view doesn't compile

**Symptoms**: Build errors when creating isolation view

**Possible Causes**:
1. Missing using statements
2. Wrong service injection types
3. Incompatible dependencies
4. Circular references

**Solution**:
```
1. Check `get_errors` tool output
2. Add missing `@using` directives
3. Verify `@inject` types match original
4. Check for conflicting namespace references
```

### Issue: Parameters not accepting values

**Symptoms**: Input controls disabled or not updating

**Possible Causes**:
1. Wrong parameter type in control generation
2. Binding syntax error
3. Null reference in binding
4. Validation blocking input

**Solution**:
```
1. Check parameter Type property matches control
2. Use @bind="param.Value" syntax
3. Initialize Value property in constructor
4. Temporarily disable validation
```

### Issue: Debug logs not appearing

**Symptoms**: Log viewer stays empty

**Possible Causes**:
1. Logger not injected
2. Wrong log level (LogTrace requires trace level)
3. Missing `;CLEANUP_OK` marker
4. Logger filtering configured

**Solution**:
```
1. Verify `@inject ILogger<Component> Logger` exists
2. Use `LogInformation` for testing
3. Add `;CLEANUP_OK` to all markers
4. Check appsettings.json logging configuration
```

### Issue: API calls fail from isolation view

**Symptoms**: 404 or 401 errors when calling APIs

**Possible Causes**:
1. Wrong HttpClient configuration
2. Missing authentication
3. Incorrect base URL
4. CORS issues

**Solution**:
```
1. Use `@inject IHttpClientFactory` instead of `HttpClient`
2. Get HttpClient: `var http = HttpClientFactory.CreateClient("api");`
3. Verify base URL in configuration
4. Check browser console for CORS errors
```

### Issue: SignalR not broadcasting

**Symptoms**: Logs show broadcast but clients don't receive

**Possible Causes**:
1. Wrong group name (case sensitivity!)
2. Client not connected
3. Hub not registered
4. Missing authorization

**Solution**:
```
1. Verify group name matches exactly (check logs)
2. Test SignalR connection status
3. Check Program.cs for hub mapping
4. Verify user has access to hub
```

### Issue: Test scenarios not loading

**Symptoms**: Scenario buttons don't appear

**Possible Causes**:
1. test-scenarios parameter not parsed
2. Syntax error in scenario names
3. Empty testScenarios list
4. Conditional rendering hiding scenarios

**Solution**:
```
1. Check parameter parsing in OnInitializedAsync
2. Use simple names: "scenario1,scenario2,scenario3"
3. Log scenario count after loading
4. Verify @if (testScenarios.Any()) condition
```

## Advanced Tips

### Tip 1: Use Browser DevTools
- Open F12 developer console
- Check Network tab for API calls
- Use SignalR tab (if extension installed)
- Monitor Console for JavaScript errors

### Tip 2: Add Breakpoints in Isolation
Since isolation view is standalone:
- Set breakpoints in Visual Studio
- Step through code without distractions
- Inspect variables in isolation context
- No main app state interference

### Tip 3: Export Test Results
Add export functionality to isolation view:
```csharp
private async Task ExportResults()
{
    var csv = string.Join("\n", testResults.Select(r => 
        $"{r.Timestamp:O},{r.Status},{r.Message}"));
    
    await JSRuntime.InvokeVoidAsync("downloadFile", 
        "test-results.csv", csv);
}
```

### Tip 4: Automate Test Execution
Create a button to run all scenarios:
```csharp
private async Task RunAllScenarios()
{
    foreach (var scenario in testScenarios)
    {
        LoadScenario(scenario);
        await ExecuteTest();
        await Task.Delay(1000); // Brief pause between tests
    }
}
```

### Tip 5: Compare Before/After
Keep original code in comments:
```csharp
// ORIGINAL CODE (with bug):
// var groupName = $"Session_{sessionId}";

// FIXED CODE:
var groupName = $"session_{sessionId}"; // Case must match hub registration
```

## Real-World Workflow Example

### Complete Session: Fixing the Question Upvote Bug

**Background**: Users report upvotes not updating for other participants

**Step 1: Invoke isolation prompt**
```
@isolate key="isolate-canvas-questions"
  source-files="SPA/NoorCanvas/Pages/SessionCanvas.razor,SPA/NoorCanvas/Controllers/QuestionController.cs,SPA/NoorCanvas/Hubs/SessionHub.cs"
  functionality-description="Question upvoting with SignalR real-time sync. Click upvote → API increments vote → SignalR broadcasts → All clients update UI"
  test-scenarios="single user upvote,two users same question,rapid upvotes,disconnected user"
  debug-level="trace"
```

**Step 2: Test in isolation** (5 minutes)
- Navigate to `/isolated/canvas-questions`
- Enter SessionId=123, QuestionId=42, UserId=test-guid
- Click "Execute Test"
- Observe: API succeeds but no broadcast visible

**Step 3: Review debug logs** (3 minutes)
```
[DEBUG-WORKITEM:isolate-canvas-questions:api:101530] Broadcasting to group=Session_123
[DEBUG-WORKITEM:isolate-canvas-questions:signalr:101530] Group name received=Session_123
```

**Step 4: Compare with hub** (2 minutes)
Check SessionHub.cs:
```csharp
public async Task JoinSession(int sessionId)
{
    await Groups.AddToGroupAsync(Context.ConnectionId, $"session_{sessionId}"); // lowercase!
}
```

**Step 5: Identify root cause** (1 minute)
- API broadcasts to `Session_123` (uppercase S)
- Clients join group `session_123` (lowercase s)
- Case mismatch = 100% broadcast miss rate!

**Step 6: Fix in isolation** (2 minutes)
```csharp
// In isolation view's ExecuteIsolatedFunctionality method:
var groupName = $"session_{sessionId}"; // Changed from Session_{sessionId}
Logger.LogTrace("[DEBUG-WORKITEM:isolate-canvas-questions:api:{RunId}] Broadcasting to group={GroupName} ;CLEANUP_OK", runId, groupName);
```

**Step 7: Validate fix** (3 minutes)
- Run "single user upvote" scenario → SUCCESS
- Run "two users same question" scenario → SUCCESS  
- Run "rapid upvotes" scenario → SUCCESS
- All scenarios passing!

**Step 8: Reintegrate** (5 minutes)
Apply fix to original files:
```
1. Open QuestionController.cs
2. Find VoteQuestion method (line 351)
3. Change: await _hubContext.Clients.Group($"Session_{sessionId}")...
   To:     await _hubContext.Clients.Group($"session_{sessionId}")...
4. Repeat for UpdateQuestion (line 638) and DeleteQuestion (line 730)
5. Build and test main application
```

**Step 9: Commit and document** (3 minutes)
```bash
git add -A
git commit -m "fix(canvas-questions): Fix SignalR group name case sensitivity

- Changed uppercase 'Session_' to lowercase 'session_' in QuestionController
- VoteQuestion: Broadcasting to session_{sessionId} (line 351)
- UpdateQuestion: Broadcasting to session_{sessionId} (line 638)
- DeleteQuestion: Broadcasting to session_{sessionId} (line 730)
- Matches SessionHub.JoinSession which uses lowercase 'session_' (line 84)
- This bug caused 100% broadcast miss rate - clients joined lowercase group but API broadcast to uppercase group
- Verified fix with isolation testing key: isolate-canvas-questions"
```

**Total Time**: 24 minutes from bug report to commit
**Without Isolation**: Would have taken hours of trial-and-error testing with multiple users

## FAQ

### Q: Do I need to keep the isolation view after fixing the bug?
**A**: No, isolation views are temporary. You can:
1. Delete it after reintegration
2. Keep it wrapped in `#if DEBUG` for future debugging
3. Move it to a `/Development` folder excluded from production

### Q: Can I test multiple features in one isolation view?
**A**: Not recommended. Each isolation view should focus on ONE specific functionality. Create separate isolation keys for different features.

### Q: What if the functionality needs 20+ parameters?
**A**: Group related parameters:
```csharp
// Instead of 20 individual parameters:
private class TestParameters
{
    public UserContext User { get; set; }
    public SessionContext Session { get; set; }
    public QuestionContext Question { get; set; }
}
```

### Q: Can I use isolation testing for frontend-only issues?
**A**: Yes! Set `source-files` to just the Razor component and test UI state management in isolation.

### Q: How do I test async/await issues in isolation?
**A**: Isolation view preserves async flow. Add logs before/after awaits:
```csharp
Logger.LogTrace("[DEBUG-WORKITEM:isolate-X:ui:{RunId}] Before await ;CLEANUP_OK", runId);
var result = await SomeAsyncMethod();
Logger.LogTrace("[DEBUG-WORKITEM:isolate-X:ui:{RunId}] After await - Result={Result} ;CLEANUP_OK", runId, result);
```

### Q: Should I clean up debug logs after reintegration?
**A**: Depends on the situation:
- **Bug fix in stable code**: Clean up (debug-level=cleanup)
- **New complex feature**: Keep essential logs for production debugging
- **Known problematic area**: Keep trace logs temporarily

### Q: Can I share isolation views with other developers?
**A**: Yes! Commit to a development branch:
```bash
git checkout -b dev/isolation-views
git add SPA/NoorCanvas/Pages/Isolated/
git commit -m "dev: Add isolation views for debugging"
git push -u origin dev/isolation-views
```

## Additional Resources

- **Task Prompt Documentation**: `.github/prompts/task.prompt.md`
- **Debug Logging Mandate**: `.github/prompts/shared/debug-logging-mandate.md`
- **Key Template**: `.github/prompts.keys/_template/key-template.md`
- **Self-Awareness Instructions**: `.github/instructions/SelfAwareness.instructions.md`

## Getting Help

If you encounter issues with the isolation prompt:

1. **Check this guide**: Search for your specific issue
2. **Review key data stream**: Check `.github/prompts.keys/isolate-{feature}.md`
3. **Check debug logs**: Look for error markers in console output
4. **Ask for help**: Include isolation key, error message, and relevant logs

---

**Remember**: Isolation testing is about **speed and precision**. Get in, find the bug, fix it, verify it, and get out. Don't over-engineer the isolation view – it's a temporary debugging tool, not a permanent feature.
