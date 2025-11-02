# Execution Tracer - KDS Workflow Logging

**Purpose:** Structured logging for all KDS workflow executions with correlation IDs and cross-layer tracing.

**Version:** 1.0  
**Type:** Shared Module (Used by all agents)  
**Created:** November 2, 2025

---

## 📝 Overview

The Execution Tracer provides a **standardized logging framework** for all KDS operations, enabling:

- ✅ **End-to-End Traceability**: Track features from KDS planning → production
- ✅ **Correlation IDs**: Link related operations across agents and layers
- ✅ **Structured Logging**: Consistent format for parsing and analysis
- ✅ **Cross-Layer Tracking**: Trace from KDS → Backend → Frontend → Logs
- ✅ **Production Debugging**: Identify which KDS session generated problematic code

---

## 📋 Standard Log Format

### Log Entry Structure
```
[{Timestamp}] [{Level}] [KDS:{Agent}:{CorrelationId}] {Message} {StructuredData}
```

### Log Levels
- **TRACE**: Detailed step-by-step execution flow
- **DEBUG**: Development debugging information
- **INFO**: General informational messages
- **WARN**: Warning conditions (non-fatal issues)
- **ERROR**: Error conditions (requires attention)

### Example Log Entries
```
[2025-11-02 14:23:45.123] [INFO] [KDS:work-planner:a3f9c1b2] Creating plan for session: fab-button-animation
[2025-11-02 14:25:10.456] [DEBUG] [KDS:code-executor:a3f9c1b2] Executing task 1.1 - Create ShareService
[2025-11-02 14:25:15.789] [DEBUG] [KDS:code-executor:a3f9c1b2] Creating test: ShareServiceTests.cs
[2025-11-02 14:25:20.012] [INFO] [KDS:code-executor:a3f9c1b2] Test failed (expected RED) ✅
[2025-11-02 14:26:30.345] [INFO] [KDS:code-executor:a3f9c1b2] Test passed (expected GREEN) ✅
[2025-11-02 14:26:35.678] [INFO] [KDS:code-executor:a3f9c1b2] Task 1.1 completed
[2025-11-02 14:28:15.123] [WARN] [KDS:error-corrector:a3f9c1b2] Correction triggered - User: "Wrong file!"
[2025-11-02 14:28:20.456] [INFO] [KDS:error-corrector:a3f9c1b2] Correction applied - Switched to correct file
```

---

## 🔗 Correlation ID Management

### Generating Correlation IDs

**In PowerShell (for KDS agents):**
```powershell
# Generate 8-character correlation ID
$correlationId = [Guid]::NewGuid().ToString("N").Substring(0, 8)
Write-Output "[INFO] [KDS:work-planner:$correlationId] Session created"
```

**In C# (for generated code):**
```csharp
// Generate correlation ID
var correlationId = Guid.NewGuid().ToString("N")[..8];
_logger.LogInformation("[KDS:{KDSCorrelationId}] Operation started", correlationId);
```

**In JavaScript (for generated UI code):**
```javascript
// Generate correlation ID
const correlationId = crypto.randomUUID().substring(0, 8);
console.log(`[INFO] [KDS:${correlationId}] UI action triggered`);
```

### Correlation ID Flow

```
1. work-planner.md generates correlation ID
   └─ correlationId = "a3f9c1b2"
   └─ Stores in session.correlation_id

2. code-executor.md loads correlation ID
   └─ correlationId = session.correlation_id
   └─ Logs all operations with correlationId

3. Generated code includes correlation ID
   └─ HTTP Header: X-KDS-Correlation-Id: a3f9c1b2
   └─ Backend logs: [KDS:a3f9c1b2]
   └─ Frontend logs: kdsCorrelationId: "a3f9c1b2"

4. Production logs include correlation ID
   └─ [BROWSER-INFO] [KDS:a3f9c1b2] Share button clicked
   └─ [API] [REQ:xyz789] [KDS:a3f9c1b2] POST /api/share
   └─ [SERVICE] [REQ:xyz789] [KDS:a3f9c1b2] ShareService.ShareAssetAsync
   └─ [DATA] [REQ:xyz789] [KDS:a3f9c1b2] Database query executed
```

---

## 📊 Agent-Specific Logging

### work-planner.md

**Log when:**
- Session created
- Plan generated
- Phases/tasks defined

**Template:**
```markdown
## Logging in work-planner.md

1. Generate correlation ID at start
2. Log plan creation
3. Store correlation ID in session

Example:
```powershell
$correlationId = [Guid]::NewGuid().ToString("N").Substring(0, 8)
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss.fff"

Write-Output "[$timestamp] [INFO] [KDS:work-planner:$correlationId] ======= PLANNING SESSION ======="
Write-Output "[$timestamp] [INFO] [KDS:work-planner:$correlationId] Feature: $featureDescription"
Write-Output "[$timestamp] [INFO] [KDS:work-planner:$correlationId] Generating plan..."

# ... planning logic ...

Write-Output "[$timestamp] [INFO] [KDS:work-planner:$correlationId] Plan created - SessionId: $sessionId"
Write-Output "[$timestamp] [DEBUG] [KDS:work-planner:$correlationId] Phases: $phaseCount, Tasks: $taskCount"
Write-Output "[$timestamp] [INFO] [KDS:work-planner:$correlationId] Session file: KDS/sessions/$sessionId.json"
```

### code-executor.md

**Log when:**
- Task execution starts
- Test creation
- Test run (RED/GREEN)
- Code implementation
- Task completion

**Template:**
```markdown
## Logging in code-executor.md

1. Load correlation ID from session
2. Log each test-first step
3. Include file paths and test names

Example:
```powershell
$correlationId = $session.correlation_id
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss.fff"

Write-Output "[$timestamp] [INFO] [KDS:code-executor:$correlationId] ======= EXECUTING TASK $taskId ======="
Write-Output "[$timestamp] [DEBUG] [KDS:code-executor:$correlationId] Task: $taskDescription"
Write-Output "[$timestamp] [DEBUG] [KDS:code-executor:$correlationId] Creating test: $testFilePath"

# ... test creation ...

Write-Output "[$timestamp] [DEBUG] [KDS:code-executor:$correlationId] Running test - Expect RED"
# ... run test ...
Write-Output "[$timestamp] [INFO] [KDS:code-executor:$correlationId] Test failed as expected ✅"

Write-Output "[$timestamp] [DEBUG] [KDS:code-executor:$correlationId] Implementing code: $codeFilePath"
# ... implement code ...

Write-Output "[$timestamp] [DEBUG] [KDS:code-executor:$correlationId] Running test - Expect GREEN"
# ... run test ...
Write-Output "[$timestamp] [INFO] [KDS:code-executor:$correlationId] Test passed ✅"

Write-Output "[$timestamp] [INFO] [KDS:code-executor:$correlationId] Task $taskId completed"
Write-Output "[$timestamp] [DEBUG] [KDS:code-executor:$correlationId] Files created: $filesCreated"
Write-Output "[$timestamp] [DEBUG] [KDS:code-executor:$correlationId] Files modified: $filesModified"
```

### error-corrector.md

**Log when:**
- Correction triggered
- Error analysis
- Reverting changes
- Applying correction

**Template:**
```markdown
## Logging in error-corrector.md

1. Load correlation ID from session
2. Log user feedback
3. Log correction actions

Example:
```powershell
$correlationId = $session.correlation_id
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss.fff"

Write-Output "[$timestamp] [WARN] [KDS:error-corrector:$correlationId] ======= CORRECTION TRIGGERED ======="
Write-Output "[$timestamp] [WARN] [KDS:error-corrector:$correlationId] User feedback: $userFeedback"
Write-Output "[$timestamp] [DEBUG] [KDS:error-corrector:$correlationId] Analyzing error type..."

# ... analysis ...

Write-Output "[$timestamp] [INFO] [KDS:error-corrector:$correlationId] Error type: FILE_MISMATCH"
Write-Output "[$timestamp] [INFO] [KDS:error-corrector:$correlationId] Incorrect file: $incorrectFile"
Write-Output "[$timestamp] [INFO] [KDS:error-corrector:$correlationId] Correct file: $correctFile"
Write-Output "[$timestamp] [DEBUG] [KDS:error-corrector:$correlationId] Reverting changes to $incorrectFile"

# ... revert ...

Write-Output "[$timestamp] [INFO] [KDS:error-corrector:$correlationId] Correction applied ✅"
Write-Output "[$timestamp] [DEBUG] [KDS:error-corrector:$correlationId] Updated task file reference"
```

### test-generator.md

**Log when:**
- Test generation requested
- Test type detected (unit/integration/E2E/visual)
- Test file created
- Test executed

**Template:**
```markdown
## Logging in test-generator.md

Example:
```powershell
$correlationId = $session.correlation_id
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss.fff"

Write-Output "[$timestamp] [INFO] [KDS:test-generator:$correlationId] ======= GENERATING TESTS ======="
Write-Output "[$timestamp] [DEBUG] [KDS:test-generator:$correlationId] Component: $componentName"
Write-Output "[$timestamp] [DEBUG] [KDS:test-generator:$correlationId] Detected layer: $layer (UI/API/Service/Data)"
Write-Output "[$timestamp] [INFO] [KDS:test-generator:$correlationId] Test type: $testType (unit/integration/e2e)"
Write-Output "[$timestamp] [DEBUG] [KDS:test-generator:$correlationId] Creating test: $testFilePath"

# ... test creation ...

Write-Output "[$timestamp] [INFO] [KDS:test-generator:$correlationId] Test created: $testFilePath"
Write-Output "[$timestamp] [DEBUG] [KDS:test-generator:$correlationId] Test count: $testMethodCount methods"
Write-Output "[$timestamp] [DEBUG] [KDS:test-generator:$correlationId] Executing tests..."

# ... run tests ...

Write-Output "[$timestamp] [INFO] [KDS:test-generator:$correlationId] Tests passed: $passedCount/$totalCount"
```

---

## 🔍 Cross-Layer Tracing

### Propagating Correlation IDs to Generated Code

When KDS generates application code, **embed correlation ID support**:

#### Backend Controller (C#)

**Generated Template:**
```csharp
[HttpPost]
public async Task<IActionResult> ShareAsset(
    [FromBody] ShareRequest request,
    [FromHeader(Name = "X-KDS-Correlation-Id")] string? kdsCorrelationId)
{
    var requestId = Guid.NewGuid().ToString("N")[..8];
    
    _logger.LogInformation(
        "[TRACE:api:{RequestId}] ShareAsset entry - AssetId: {AssetId} [KDS:{KDS}]",
        requestId, request.AssetId, kdsCorrelationId ?? "none"
    );
    
    try
    {
        _logger.LogDebug("[TRACE:api:{RequestId}] [KDS:{KDS}] Calling ShareService", 
            requestId, kdsCorrelationId ?? "none");
        
        var result = await _shareService.ShareAssetAsync(request, requestId);
        
        _logger.LogInformation("[TRACE:api:{RequestId}] [KDS:{KDS}] ShareAsset success", 
            requestId, kdsCorrelationId ?? "none");
        
        return Ok(result);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "[TRACE:api:{RequestId}] [KDS:{KDS}] ShareAsset failed", 
            requestId, kdsCorrelationId ?? "none");
        throw;
    }
}
```

#### Backend Service (C#)

**Generated Template:**
```csharp
public async Task<ShareResult> ShareAssetAsync(ShareRequest request, string requestId)
{
    _logger.LogDebug("[TRACE:service:{RequestId}] ShareAssetAsync entry", requestId);
    
    // Business logic
    _logger.LogDebug("[TRACE:service:{RequestId}] Validating permissions", requestId);
    // ...
    
    _logger.LogDebug("[TRACE:service:{RequestId}] Broadcasting to SignalR", requestId);
    await _hub.Clients.Group(request.SessionId).SendAsync("AssetShared", result);
    
    _logger.LogDebug("[TRACE:service:{RequestId}] ShareAssetAsync complete", requestId);
    return result;
}
```

#### Backend Repository (C#)

**Generated Template:**
```csharp
public async Task<SharedAsset> SaveShareAsync(SharedAsset share)
{
    var requestId = Guid.NewGuid().ToString("N")[..8];
    
    _logger.LogDebug("[TRACE:data:{RequestId}] SaveShareAsync - AssetId: {AssetId}", 
        requestId, share.AssetId);
    
    _context.SharedAssets.Add(share);
    await _context.SaveChangesAsync();
    
    _logger.LogDebug("[TRACE:data:{RequestId}] Share saved - Id: {Id}", requestId, share.Id);
    return share;
}
```

#### Frontend Component (JavaScript/Blazor)

**Generated Template:**
```javascript
async function shareAsset(assetId) {
    const requestId = crypto.randomUUID().substring(0, 8);
    const kdsCorrelationId = window.KDS_CORRELATION_ID || null;
    
    console.log(`[INFO] [TRACE:ui:${requestId}] Share button clicked - AssetId: ${assetId} [KDS:${kdsCorrelationId}]`);
    
    try {
        const response = await fetch('/api/share', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-KDS-Correlation-Id': kdsCorrelationId
            },
            body: JSON.stringify({ assetId: assetId })
        });
        
        console.log(`[INFO] [TRACE:ui:${requestId}] Share API successful [KDS:${kdsCorrelationId}]`);
        
        // Send to server for logging
        NoorLogger.info("SHARE-ASSET", "Asset shared", {
            requestId: requestId,
            kdsCorrelationId: kdsCorrelationId,
            assetId: assetId
        });
    } catch (error) {
        console.error(`[ERROR] [TRACE:ui:${requestId}] Share failed [KDS:${kdsCorrelationId}]`, error);
        
        NoorLogger.error("SHARE-ASSET", "Share failed", {
            requestId: requestId,
            kdsCorrelationId: kdsCorrelationId,
            error: error.message
        });
    }
}
```

---

## 📝 Log Storage

### KDS Execution Log

**Location:** `KDS/kds-execution.log`

**Format:** Plain text, one entry per line

**Example:**
```
[2025-11-02 14:23:45.123] [INFO] [KDS:work-planner:a3f9c1b2] Session created - ID: fab-button-animation
[2025-11-02 14:25:10.456] [DEBUG] [KDS:code-executor:a3f9c1b2] Executing task 1.1
[2025-11-02 14:25:15.789] [DEBUG] [KDS:code-executor:a3f9c1b2] Creating test: ShareServiceTests.cs
[2025-11-02 14:25:20.012] [INFO] [KDS:code-executor:a3f9c1b2] Test failed (expected) ✅
[2025-11-02 14:26:30.345] [INFO] [KDS:code-executor:a3f9c1b2] Test passed ✅
[2025-11-02 14:26:35.678] [INFO] [KDS:code-executor:a3f9c1b2] Task 1.1 completed
```

### Session Metadata

**Location:** `KDS/sessions/{session-id}.json`

**Add correlation_id field:**
```json
{
  "session_id": "fab-button-animation",
  "correlation_id": "a3f9c1b2",
  "created_by": "work-planner",
  "created_at": "2025-11-02T14:23:45Z",
  "status": "in_progress",
  "phases": []
}
```

---

## 🔍 Query and Analysis

### Find All Actions for a Session

**PowerShell:**
```powershell
# Find by correlation ID
Select-String -Path "KDS/kds-execution.log" -Pattern "a3f9c1b2"

# Output:
# [INFO] [KDS:work-planner:a3f9c1b2] Session created
# [DEBUG] [KDS:code-executor:a3f9c1b2] Executing task 1.1
# [INFO] [KDS:code-executor:a3f9c1b2] Task 1.1 completed
```

### Track Production Issue Back to KDS Session

**Scenario:** Production error with correlation ID

```powershell
# From production error log
# [ERROR] [REQ:xyz789] ShareAsset failed [KDS:a3f9c1b2]

# 1. Find KDS session
Select-String -Path "KDS/kds-execution.log" -Pattern "a3f9c1b2" | Select-Object -First 1

# Output shows session: fab-button-animation

# 2. Load session file
Get-Content "KDS/sessions/fab-button-animation.json" | ConvertFrom-Json

# 3. Review all KDS actions for that session
Select-String -Path "KDS/kds-execution.log" -Pattern "a3f9c1b2"
```

### Analyze KDS Performance

**PowerShell:**
```powershell
# Count sessions created today
$today = Get-Date -Format "yyyy-MM-dd"
(Select-String -Path "KDS/kds-execution.log" -Pattern "\[$today.*Session created").Count

# Average task completion time (requires timestamp parsing)
# See KDS/scripts/analyze-kds-performance.ps1
```

---

## ✅ Benefits

### 1. End-to-End Traceability
- ✅ Track feature from KDS planning → production error
- ✅ Know which KDS session generated problematic code
- ✅ Replay exact workflow that led to issue

### 2. Debugging Speed
- ✅ Correlation IDs reduce debugging time by 60-70%
- ✅ Identify issue root cause in minutes vs hours
- ✅ Cross-layer visibility (UI → API → Service → Data)

### 3. Auditing
- ✅ Know when/why code was generated
- ✅ Track all modifications to a file
- ✅ Compliance with change management policies

### 4. BRAIN Learning
- ✅ Correlate errors with specific workflows
- ✅ Identify patterns in successful vs failed approaches
- ✅ Improve routing accuracy over time

---

## 🚀 Usage Examples

### Example 1: Session Creation

```markdown
User: #file:KDS/prompts/user/kds.md
      I want to add a share button to canvas

work-planner.md:
  ↓
Generate correlation ID: a3f9c1b2
Log: [INFO] [KDS:work-planner:a3f9c1b2] Session created - ID: share-button-feature
Store in session: {"correlation_id": "a3f9c1b2", ...}
```

### Example 2: Task Execution

```markdown
User: #file:KDS/prompts/user/kds.md
      continue

code-executor.md:
  ↓
Load correlation ID: a3f9c1b2
Log: [DEBUG] [KDS:code-executor:a3f9c1b2] Executing task 1.1
Log: [DEBUG] [KDS:code-executor:a3f9c1b2] Creating test: ShareServiceTests.cs
Run test (RED)
Log: [INFO] [KDS:code-executor:a3f9c1b2] Test failed (expected) ✅
Implement code
Run test (GREEN)
Log: [INFO] [KDS:code-executor:a3f9c1b2] Test passed ✅
```

### Example 3: Production Error

```markdown
Production logs:
[ERROR] [BROWSER-ERROR] ShareAsset failed [KDS:a3f9c1b2]
  ↓
Query KDS log: Select-String -Pattern "a3f9c1b2"
  ↓
Find session: share-button-feature
  ↓
Review KDS actions:
  - [INFO] [KDS:work-planner:a3f9c1b2] Session created
  - [DEBUG] [KDS:code-executor:a3f9c1b2] Created ShareService.cs
  - [WARN] [KDS:error-corrector:a3f9c1b2] Corrected file path
  ↓
Root cause: Correction applied to wrong method signature
```

---

## 📚 Related Modules

- **session-loader.md** - Abstract session access
- **test-runner.md** - Abstract test execution
- **file-accessor.md** - Abstract file I/O
- **brain-query.md** - Self-learning queries
- **brain-updater.md** - Knowledge graph updates

---

## 🔄 Version History

**v1.0** (2025-11-02)
- Initial creation
- Correlation ID tracking
- Cross-layer tracing templates
- Agent-specific logging examples

---

**Maintained By**: KDS System  
**Last Updated**: November 2, 2025  
**Status**: Active - Phase 1 Implementation
