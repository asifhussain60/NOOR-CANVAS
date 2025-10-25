# SignalR Disconnection Fix - Implementation Plan

**Key**: `signalr-disconnection-fix`  
**Branch**: `fix/signalr-disconnection-fix`  
**Created**: 2025-10-25  
**Status**: Planning Complete - Ready for Implementation

---

## Executive Summary

### Problem Statement
Production SignalR connections on TranscriptCanvas.razor are experiencing premature disconnections mid-session with failures to reconnect. Root cause analysis of production logs (D:\Websites\NOOR-CANVAS\logs\noor-canvas-prod-20251025.txt) identified:

1. **ObjectDisposedException** in SessionHub.cs line 53 during OnDisconnectedAsync cleanup
2. **Blazor Circuit Timeouts** - 180-second retention period too short for production sessions
3. **Insufficient Diagnostic Logging** - Limited visibility into connection lifecycle in production

### Impact
- Users lose real-time updates during active sessions
- Reconnection attempts fail after circuit disposal
- Production debugging difficult due to sparse logging

### Solution Approach
Five-phase implementation addressing hub disposal race condition, optimizing timeout configurations, and adding comprehensive diagnostic logging for both development and production environments.

---

## Evidence & Validation

### Production Log Analysis (@workspace: D:\Websites\NOOR-CANVAS\logs\noor-canvas-prod-20251025.txt)

**Connection Timeline (Oct 25, 2025):**
```
[05:47:16] TranscriptCanvas initialized, SignalR connected
[05:47:19] Disposing SignalR connection  
[05:47:20] SignalR connection closed: No error
[05:53:45] ERR: Failed to notify group of user departure
           System.ObjectDisposedException: Cannot access a disposed object
           Object name: 'NoorCanvas.Hubs.SessionHub'
           at NoorCanvas.Hubs.SessionHub.OnDisconnectedAsync() in SessionHub.cs:line 53
```

**Pattern Identified:**
- Connections lasting 3-4 seconds (circuit timeout at 180s)
- Multiple disconnection events across connection IDs: `5tLhF-R9dYL_WlHA8RaRBw`, `XlATHbeqrWJf6zjxUkPDmQ`, `y-AGkQCcnJfsw0ndUWedQA`
- ObjectDisposedException during hub cleanup → fire-and-forget Task.Run accessing disposed Clients property

### Code Evidence (@workspace)

**SessionHub.cs (lines 47-63):**
```csharp
// BUG: Fire-and-forget task accesses Clients after hub disposal
_ = Task.Run(async () =>
{
    try
    {
        var groupName = $"session_{connectionInfo.sessionId}";
        await Clients.Group(groupName).SendAsync("UserLeft", new { ... }); // ← Line 53: ObjectDisposedException
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "NOOR-HUB-LIFECYCLE: Failed to notify group of user departure");
    }
});
```

**Program.cs (line 45):**
```csharp
options.DisconnectedCircuitRetentionPeriod = TimeSpan.FromSeconds(180); // 3 minutes - TOO SHORT
```

**Program.cs (lines 90-91):**
```csharp
options.KeepAliveInterval = TimeSpan.FromSeconds(15);
options.ClientTimeoutInterval = TimeSpan.FromSeconds(30);
```

**TranscriptCanvas.razor (line 2769):**
```csharp
.WithAutomaticReconnect(new[] { TimeSpan.Zero, TimeSpan.FromSeconds(2), 
                                 TimeSpan.FromSeconds(10), TimeSpan.FromSeconds(30) })
```

---

## Phase 1: Fix SessionHub ObjectDisposedException

### Objective
Eliminate ObjectDisposedException by replacing fire-and-forget Task.Run with synchronous await in OnDisconnectedAsync cleanup.

### Technical Changes

**File**: `SPA\NoorCanvas\Hubs\SessionHub.cs`

**Current Code (lines 36-75):**
```csharp
public override async Task OnDisconnectedAsync(Exception? exception)
{
    lock (_connectionsLock)
    {
        if (_connections.TryGetValue(Context.ConnectionId, out var connectionInfo))
        {
            _connections.Remove(Context.ConnectionId);

            _logger.LogInformation("NOOR-HUB-LIFECYCLE: Connection {ConnectionId} removed from session {SessionId} (role: {Role}) - Duration: {Duration}ms",
                Context.ConnectionId, connectionInfo.sessionId, connectionInfo.role,
                (DateTime.UtcNow - connectionInfo.joinedAt).TotalMilliseconds);

            // Notify session group of user departure
            _ = Task.Run(async () =>  // ← PROBLEM: Fire-and-forget
            {
                try
                {
                    var groupName = $"session_{connectionInfo.sessionId}";
                    await Clients.Group(groupName).SendAsync("UserLeft", new
                    {
                        connectionId = Context.ConnectionId,
                        role = connectionInfo.role,
                        timestamp = DateTime.UtcNow,
                        reason = exception?.Message ?? "disconnected"
                    });
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "NOOR-HUB-LIFECYCLE: Failed to notify group of user departure");
                }
            });
        }
    }

    if (exception != null)
    {
        _logger.LogWarning("NOOR-HUB-LIFECYCLE: Client {ConnectionId} disconnected with exception: {Error}",
            Context.ConnectionId, exception.Message);
    }
    else
    {
        _logger.LogInformation("NOOR-HUB-LIFECYCLE: Client {ConnectionId} disconnected normally", Context.ConnectionId);
    }

    await base.OnDisconnectedAsync(exception);
}
```

**New Code (Synchronous cleanup before disposal):**
```csharp
public override async Task OnDisconnectedAsync(Exception? exception)
{
    (int sessionId, string role, DateTime joinedAt) connectionInfo = default;
    bool hasConnectionInfo = false;

    lock (_connectionsLock)
    {
        if (_connections.TryGetValue(Context.ConnectionId, out var info))
        {
            connectionInfo = info;
            hasConnectionInfo = true;
            _connections.Remove(Context.ConnectionId);

            _logger.LogInformation("NOOR-HUB-LIFECYCLE: Connection {ConnectionId} removed from session {SessionId} (role: {Role}) - Duration: {Duration}ms",
                Context.ConnectionId, connectionInfo.sessionId, connectionInfo.role,
                (DateTime.UtcNow - connectionInfo.joinedAt).TotalMilliseconds);
        }
    }

    // CRITICAL FIX: Notify group BEFORE hub disposal (synchronous await)
    if (hasConnectionInfo)
    {
        try
        {
            var groupName = $"session_{connectionInfo.sessionId}";
            _logger.LogDebug("NOOR-HUB-LIFECYCLE: Notifying group {GroupName} of user departure (ConnectionId: {ConnectionId})",
                groupName, Context.ConnectionId);
            
            await Clients.Group(groupName).SendAsync("UserLeft", new
            {
                connectionId = Context.ConnectionId,
                role = connectionInfo.role,
                timestamp = DateTime.UtcNow,
                reason = exception?.Message ?? "disconnected",
                duration = (DateTime.UtcNow - connectionInfo.joinedAt).TotalMilliseconds
            });
            
            _logger.LogDebug("NOOR-HUB-LIFECYCLE: Successfully notified group {GroupName} of departure", groupName);
        }
        catch (ObjectDisposedException odEx)
        {
            _logger.LogDebug("NOOR-HUB-LIFECYCLE: Hub disposed before UserLeft notification - graceful shutdown (ConnectionId: {ConnectionId})",
                Context.ConnectionId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "NOOR-HUB-LIFECYCLE: Failed to notify group of user departure (ConnectionId: {ConnectionId})",
                Context.ConnectionId);
        }
    }

    if (exception != null)
    {
        _logger.LogWarning("NOOR-HUB-LIFECYCLE: Client {ConnectionId} disconnected with exception: {Error}",
            Context.ConnectionId, exception.Message);
    }
    else
    {
        _logger.LogInformation("NOOR-HUB-LIFECYCLE: Client {ConnectionId} disconnected normally", Context.ConnectionId);
    }

    await base.OnDisconnectedAsync(exception);
}
```

### Key Improvements
1. **Extract connection info outside lock** - Avoid lock during async I/O
2. **Synchronous await** - Complete group notification before hub disposal
3. **Explicit ObjectDisposedException handling** - Graceful degradation for race conditions
4. **Enhanced logging** - Debug-level visibility into notification flow

### Testing
- Unit test: Verify UserLeft notification sent before disposal
- Integration test: Simulate rapid connect/disconnect cycles
- Production validation: Monitor logs for ObjectDisposedException elimination

---

## Phase 2: Optimize Circuit & SignalR Timeouts

### Objective
Extend Blazor circuit retention and optimize SignalR keep-alive settings to prevent premature disconnections during active sessions.

### Technical Changes

**File**: `SPA\NoorCanvas\Program.cs`

#### Change 1: Extend Circuit Retention Period

**Current Code (line 45):**
```csharp
options.DisconnectedCircuitRetentionPeriod = TimeSpan.FromSeconds(180); // 3 minutes
```

**New Code:**
```csharp
// SIGNALR-FIX: Extend circuit retention to 30 minutes for production sessions
// Prevents premature circuit disposal during temporary network interruptions
options.DisconnectedCircuitRetentionPeriod = TimeSpan.FromMinutes(30); // 30 minutes (was 3 min)
```

**Rationale:**
- 180 seconds (3 min) too short for production sessions lasting 30+ minutes
- 30 minutes provides buffer for network recovery without indefinite resource retention
- Balances reconnection capability with server memory constraints

#### Change 2: Optimize SignalR Keep-Alive Configuration

**Current Code (lines 86-100):**
```csharp
builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = builder.Environment.IsDevelopment();
    options.HandshakeTimeout = TimeSpan.FromSeconds(15);
    options.KeepAliveInterval = TimeSpan.FromSeconds(15);
    options.ClientTimeoutInterval = TimeSpan.FromSeconds(30);
    options.MaximumReceiveMessageSize = 1024 * 1024; // 1MB max message size

    // Enhanced logging for hostcanvas debugging
    if (builder.Environment.IsDevelopment())
    {
        Log.Information("NOOR-SIGNALR-CONFIG: SignalR configured with detailed errors, timeouts: handshake={HandshakeTimeout}s, keepalive={KeepAliveInterval}s, client={ClientTimeoutInterval}s",
            options.HandshakeTimeout?.TotalSeconds ?? 0, options.KeepAliveInterval?.TotalSeconds ?? 0, options.ClientTimeoutInterval?.TotalSeconds ?? 0);
    }
})
.AddJsonProtocol(); // Force JSON protocol only
```

**New Code:**
```csharp
builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = builder.Environment.IsDevelopment();
    
    // SIGNALR-FIX: Optimized timeouts for production stability
    options.HandshakeTimeout = TimeSpan.FromSeconds(20);              // Increased from 15s → 20s
    options.KeepAliveInterval = TimeSpan.FromSeconds(10);             // Decreased from 15s → 10s (more frequent pings)
    options.ClientTimeoutInterval = TimeSpan.FromSeconds(60);         // Increased from 30s → 60s (longer grace period)
    options.MaximumReceiveMessageSize = 1024 * 1024;                  // 1MB max message size
    
    // SIGNALR-FIX: Add connection lifecycle logging for both dev and prod
    var keepAlive = options.KeepAliveInterval?.TotalSeconds ?? 0;
    var clientTimeout = options.ClientTimeoutInterval?.TotalSeconds ?? 0;
    var handshake = options.HandshakeTimeout?.TotalSeconds ?? 0;
    
    Log.Information("NOOR-SIGNALR-CONFIG: SignalR configured - Environment={Environment}, DetailedErrors={DetailedErrors}",
        builder.Environment.EnvironmentName, options.EnableDetailedErrors);
    Log.Information("NOOR-SIGNALR-CONFIG: Timeouts - Handshake={Handshake}s, KeepAlive={KeepAlive}s, ClientTimeout={ClientTimeout}s",
        handshake, keepAlive, clientTimeout);
    Log.Information("NOOR-SIGNALR-CONFIG: Connection health - KeepAlive interval ensures server pings every {KeepAlive}s, client timeout after {ClientTimeout}s silence",
        keepAlive, clientTimeout);
})
.AddJsonProtocol(); // Force JSON protocol only
```

**Configuration Rationale:**

| Setting | Old Value | New Value | Justification |
|---------|-----------|-----------|---------------|
| HandshakeTimeout | 15s | 20s | Allow slower network connections to complete initial handshake |
| KeepAliveInterval | 15s | 10s | More frequent server pings detect disconnections faster |
| ClientTimeoutInterval | 30s | 60s | Longer grace period before considering client dead (6x keep-alive) |

**ASP.NET Core Recommendation:** ClientTimeoutInterval should be at least 2x KeepAliveInterval (we use 6x for extra safety).

### Testing
- Load test: Verify 30-minute circuit retention under concurrent users
- Network test: Simulate 30-60 second network interruption and verify reconnection
- Production monitoring: Track circuit disposal events in logs

---

## Phase 3: Add Comprehensive Diagnostic Logging

### Objective
Implement detailed connection lifecycle logging for both development and production environments to enable rapid troubleshooting of future disconnection issues.

### Technical Changes

#### Change 1: Enhanced SessionHub Logging

**File**: `SPA\NoorCanvas\Hubs\SessionHub.cs`

Add detailed lifecycle logging in key methods:

**JoinSession Method Enhancement:**
```csharp
public async Task JoinSession(int sessionId, string role)
{
    var joinedAt = DateTime.UtcNow;
    
    // SIGNALR-FIX: Enhanced connection tracking with timestamp
    lock (_connectionsLock)
    {
        _connections[Context.ConnectionId] = (sessionId, role, joinedAt);
        _logger.LogInformation("NOOR-HUB-LIFECYCLE: Connection {ConnectionId} joined session {SessionId} as {Role} at {JoinedAt:yyyy-MM-dd HH:mm:ss.fff}",
            Context.ConnectionId, sessionId, role, joinedAt);
    }

    var groupName = $"session_{sessionId}";
    await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
    
    // SIGNALR-FIX: Log group membership confirmation
    _logger.LogInformation("NOOR-HUB-LIFECYCLE: Connection {ConnectionId} added to group {GroupName} (Session {SessionId}, Role: {Role})",
        Context.ConnectionId, groupName, sessionId, role);

    // Notify other group members
    await Clients.OthersInGroup(groupName).SendAsync("UserJoined", new
    {
        connectionId = Context.ConnectionId,
        role,
        timestamp = joinedAt
    });
    
    // SIGNALR-FIX: Log current connection count for session monitoring
    int connectionCount;
    lock (_connectionsLock)
    {
        connectionCount = _connections.Count(c => c.Value.sessionId == sessionId);
    }
    _logger.LogInformation("NOOR-HUB-LIFECYCLE: Session {SessionId} now has {ConnectionCount} active connections",
        sessionId, connectionCount);
}
```

#### Change 2: Client-Side Connection State Logging

**File**: `SPA\NoorCanvas\Pages\TranscriptCanvas.razor`

**Enhancement to InitializeSignalRAsync (lines 2749-2850):**

Add detailed logging for all connection state transitions:

```csharp
private async Task InitializeSignalRAsync()
{
    try
    {
        // Dispose existing connection if any
        if (hubConnection != null)
        {
            Logger.LogInformation("[SIGNALR-FIX:CLIENT] 🔄 Disposing existing SignalR connection - State: {State}, ConnectionId: {ConnectionId}",
                hubConnection.State, hubConnection.ConnectionId ?? "null");
            await hubConnection.DisposeAsync();
            hubConnection = null;
        }

        Logger.LogInformation("[SIGNALR-FIX:CLIENT] 🔗 Creating new SignalR hub connection to /hub/session - SessionId: {SessionId}, UserGuid: {UserGuid}",
            Model?.SessionId ?? 0, CurrentUserGuid ?? "null");
        
        hubConnection = new HubConnectionBuilder()
            .WithUrl(Navigation.ToAbsoluteUri("/hub/session"))
            .WithAutomaticReconnect(new[] { TimeSpan.Zero, TimeSpan.FromSeconds(2), TimeSpan.FromSeconds(10), TimeSpan.FromSeconds(30) })
            .Build();

        Logger.LogInformation("[SIGNALR-FIX:CLIENT] SignalR connection created - Initial State: {State}", hubConnection.State);

        // Connection state change events with enhanced logging
        hubConnection.Closed += async (error) =>
        {
            var errorMsg = error?.Message ?? "No error";
            var errorType = error?.GetType().Name ?? "None";
            Logger.LogWarning("[SIGNALR-FIX:CLIENT] ❌ SignalR connection CLOSED - Error: {Error}, Type: {ErrorType}, SessionId: {SessionId}",
                errorMsg, errorType, Model?.SessionId ?? 0);
            
            // SIGNALR-FIX: Log stack trace for unexpected closures
            if (error != null)
            {
                Logger.LogDebug("[SIGNALR-FIX:CLIENT] Connection closure stack trace: {StackTrace}", error.StackTrace);
            }
            
            await InvokeAsync(StateHasChanged);
        };

        hubConnection.Reconnecting += async (error) =>
        {
            var errorMsg = error?.Message ?? "No error";
            var attemptTime = DateTime.UtcNow;
            Logger.LogWarning("[SIGNALR-FIX:CLIENT] 🔄 SignalR RECONNECTING - Attempt at {AttemptTime:HH:mm:ss.fff}, Error: {Error}, SessionId: {SessionId}",
                attemptTime, errorMsg, Model?.SessionId ?? 0);
            await InvokeAsync(StateHasChanged);
        };

        hubConnection.Reconnected += async (connectionId) =>
        {
            var reconnectTime = DateTime.UtcNow;
            var connectionDuration = lastConnectionTime.HasValue ? (reconnectTime - lastConnectionTime.Value).TotalSeconds : 0;
            
            Logger.LogInformation("[SIGNALR-FIX:CLIENT] ✅ SignalR RECONNECTED - New ConnectionId: {ConnectionId}, SessionId: {SessionId}, Downtime: {Downtime}s",
                connectionId ?? "unknown", Model?.SessionId ?? 0, connectionDuration);
            
            lastConnectionTime = reconnectTime;
            await InvokeAsync(StateHasChanged);
            
            // Re-join session after reconnection
            if (Model?.SessionId > 0)
            {
                Logger.LogInformation("[SIGNALR-FIX:CLIENT] Re-joining session {SessionId} after reconnection", Model.SessionId);
                await hubConnection.SendAsync("JoinSession", Model.SessionId, "participant");
                Logger.LogInformation("[SIGNALR-FIX:CLIENT] Successfully re-joined session {SessionId}", Model.SessionId);
            }
        };

        // Connect to hub
        Logger.LogInformation("[SIGNALR-FIX:CLIENT] Starting SignalR connection - SessionId: {SessionId}", Model?.SessionId ?? 0);
        await hubConnection.StartAsync();
        lastConnectionTime = DateTime.UtcNow;
        
        Logger.LogInformation("[SIGNALR-FIX:CLIENT] ✅ SignalR connection STARTED - State: {State}, ConnectionId: {ConnectionId}, SessionId: {SessionId}",
            hubConnection.State, hubConnection.ConnectionId ?? "null", Model?.SessionId ?? 0);

        // Join session group
        if (Model?.SessionId > 0)
        {
            Logger.LogInformation("[SIGNALR-FIX:CLIENT] Joining session group - SessionId: {SessionId}, Role: participant", Model.SessionId);
            await hubConnection.SendAsync("JoinSession", Model.SessionId, "participant");
            Logger.LogInformation("[SIGNALR-FIX:CLIENT] ✅ Successfully joined session {SessionId} - ConnectionId: {ConnectionId}",
                Model.SessionId, hubConnection.ConnectionId ?? "null");
        }

        await InvokeAsync(StateHasChanged);
    }
    catch (Exception ex)
    {
        Logger.LogError(ex, "[SIGNALR-FIX:CLIENT] ❌ CRITICAL ERROR during SignalR initialization - SessionId: {SessionId}, Error: {Error}",
            Model?.SessionId ?? 0, ex.Message);
        throw;
    }
}
```

#### Change 3: Production Logging Configuration

**File**: `SPA\NoorCanvas\appsettings.Production.json`

Ensure SignalR lifecycle logs are captured in production:

```json
{
  "Serilog": {
    "MinimumLevel": {
      "Default": "Information",
      "Override": {
        "Microsoft.AspNetCore": "Warning",
        "Microsoft.AspNetCore.SignalR": "Information",
        "Microsoft.AspNetCore.Http.Connections": "Information",
        "NoorCanvas.Hubs": "Debug",
        "NoorCanvas.Pages.TranscriptCanvas": "Information"
      }
    }
  }
}
```

### Logging Strategy

**Development Environment:**
- All SignalR events logged at Debug/Information level
- Connection state transitions with timestamps
- Full exception stack traces

**Production Environment:**
- Connection lifecycle at Information level (connect, disconnect, reconnect)
- Hub operations at Debug level (via appsettings.Production.json override)
- Critical errors with full context (SessionId, ConnectionId, timestamps)

### Testing
- Verify log output in development: Check terminal for lifecycle events
- Verify log output in production: Tail D:\Websites\NOOR-CANVAS\logs\noor-canvas-prod-*.txt
- Log volume check: Ensure logs don't exceed 50MB/day under normal load

---

## Phase 4: Testing & Validation

### Objective
Validate all changes in development environment and perform dry-run validation against production configuration before deployment.

### Test Plan

#### 4.1 Unit Tests

**Test File**: Create `SPA\NoorCanvas.Tests\Hubs\SessionHubTests.cs`

```csharp
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Moq;
using NoorCanvas.Hubs;
using Xunit;

namespace NoorCanvas.Tests.Hubs;

public class SessionHubTests
{
    [Fact]
    public async Task OnDisconnectedAsync_SendsUserLeftBeforeDisposal()
    {
        // Arrange
        var mockLogger = new Mock<ILogger<SessionHub>>();
        var mockContext = new Mock<SimplifiedCanvasDbContext>();
        var hub = new SessionHub(mockLogger.Object, mockContext.Object);
        
        // Simulate connection tracking
        await hub.OnConnectedAsync();
        await hub.JoinSession(sessionId: 123, role: "participant");
        
        // Act
        await hub.OnDisconnectedAsync(exception: null);
        
        // Assert
        mockLogger.Verify(
            x => x.Log(
                LogLevel.Debug,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString().Contains("Successfully notified group")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once,
            "UserLeft notification should complete before disposal");
    }
    
    [Fact]
    public async Task OnDisconnectedAsync_HandlesObjectDisposedException()
    {
        // Arrange
        var mockLogger = new Mock<ILogger<SessionHub>>();
        var mockContext = new Mock<SimplifiedCanvasDbContext>();
        var hub = new SessionHub(mockLogger.Object, mockContext.Object);
        
        // Simulate hub already disposed
        await hub.DisposeAsync();
        
        // Act & Assert (should not throw)
        await hub.OnDisconnectedAsync(exception: null);
        
        mockLogger.Verify(
            x => x.Log(
                LogLevel.Debug,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString().Contains("Hub disposed before UserLeft")),
                It.IsAny<ObjectDisposedException>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }
}
```

#### 4.2 Integration Tests

**Test File**: Create `SPA\NoorCanvas.Tests\Integration\SignalRConnectionTests.cs`

```csharp
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace NoorCanvas.Tests.Integration;

public class SignalRConnectionTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public SignalRConnectionTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Connection_SurvivesCircuitRetentionPeriod()
    {
        // Arrange
        var client = _factory.CreateClient();
        var hubUrl = new Uri(client.BaseAddress!, "/hub/session");
        
        var connection = new HubConnectionBuilder()
            .WithUrl(hubUrl, options =>
            {
                options.HttpMessageHandlerFactory = _ => _factory.Server.CreateHandler();
            })
            .WithAutomaticReconnect()
            .Build();
        
        // Act
        await connection.StartAsync();
        var initialState = connection.State;
        
        // Simulate 5 minutes of activity (exceeds old 3-minute timeout)
        await Task.Delay(TimeSpan.FromMinutes(5));
        
        // Assert
        Assert.Equal(HubConnectionState.Connected, connection.State);
        Assert.Equal(HubConnectionState.Connected, initialState);
        
        // Cleanup
        await connection.StopAsync();
        await connection.DisposeAsync();
    }
    
    [Fact]
    public async Task Connection_ReconnectsAfterNetworkInterruption()
    {
        // Arrange
        var client = _factory.CreateClient();
        var hubUrl = new Uri(client.BaseAddress!, "/hub/session");
        
        var reconnectedEvent = new TaskCompletionSource<string>();
        
        var connection = new HubConnectionBuilder()
            .WithUrl(hubUrl, options =>
            {
                options.HttpMessageHandlerFactory = _ => _factory.Server.CreateHandler();
            })
            .WithAutomaticReconnect()
            .Build();
        
        connection.Reconnected += connectionId =>
        {
            reconnectedEvent.SetResult(connectionId ?? "unknown");
            return Task.CompletedTask;
        };
        
        await connection.StartAsync();
        
        // Act - Simulate network interruption
        await connection.StopAsync(); // Force disconnect
        
        // Wait for auto-reconnect (max 30 seconds per retry config)
        var timeoutTask = Task.Delay(TimeSpan.FromSeconds(60));
        var completedTask = await Task.WhenAny(reconnectedEvent.Task, timeoutTask);
        
        // Assert
        Assert.True(completedTask == reconnectedEvent.Task, "Connection should reconnect within 60 seconds");
        Assert.NotEqual("unknown", await reconnectedEvent.Task);
        
        // Cleanup
        await connection.StopAsync();
        await connection.DisposeAsync();
    }
}
```

#### 4.3 Manual Testing Checklist

**Development Environment (https://localhost:9091):**

- [ ] Start app: `dotnet run --project SPA\NoorCanvas`
- [ ] Open TranscriptCanvas with valid session token
- [ ] Verify SignalR connection established (green indicator)
- [ ] Monitor logs for `[SIGNALR-FIX:CLIENT]` and `NOOR-HUB-LIFECYCLE` entries
- [ ] Simulate network interruption (disable/enable network adapter)
- [ ] Verify auto-reconnect within 60 seconds
- [ ] Keep session open for 10 minutes → verify no disconnections
- [ ] Close browser tab → verify graceful disconnect in logs (no ObjectDisposedException)
- [ ] Verify log entries show proper lifecycle: Connect → Join → Activity → Disconnect

**Production Dry-Run (ncdeploy.ps1 -DryRun):**

- [ ] Run: `.\Scripts\ncdeploy.ps1 -DryRun`
- [ ] Verify build succeeds in Release mode
- [ ] Verify web.config transformation applied (ASPNETCORE_ENVIRONMENT=Production)
- [ ] Check appsettings.Production.json includes SignalR logging overrides
- [ ] Verify no migration conflicts or syntax errors

#### 4.4 Load Testing

**Tool**: Apache JMeter or SignalR load testing tool

**Scenario**: 50 concurrent connections to /hub/session
- Each connection joins session group
- Random 5-10 minute connection duration
- 10% connections simulate network interruption (disconnect/reconnect)

**Success Criteria**:
- Zero ObjectDisposedException errors in logs
- 95% reconnection success rate within 60 seconds
- No memory leaks (monitor circuit retention count)
- Server CPU < 80% during test

---

## Phase 5: Production Deployment

### Objective
Deploy validated changes to production environment (D:\Websites\NOOR-CANVAS) using ncdeploy.ps1 automation with comprehensive monitoring.

### Deployment Procedure

#### 5.1 Pre-Deployment Checklist

- [ ] All Phase 4 tests passing
- [ ] Code review completed for SessionHub.cs and Program.cs changes
- [ ] Git branch `fix/signalr-disconnection-fix` merged to `development`
- [ ] Backup current production logs: `D:\Websites\NOOR-CANVAS\logs\*`
- [ ] Backup current production deployment: `D:\Websites\NOOR-CANVAS\` (excluding logs)
- [ ] Verify IIS Application Pool "NoorCanvas" is healthy
- [ ] Notify users of brief deployment window (expected: 2-3 minutes downtime)

#### 5.2 Deployment Execution

**Command Sequence:**

```powershell
# 1. Navigate to workspace
cd "D:\PROJECTS\NOOR CANVAS"

# 2. Ensure on development branch with latest changes
git checkout development
git pull origin development

# 3. Run deployment script
.\Scripts\ncdeploy.ps1

# Expected output:
# ✓ Building NoorCanvas in Release mode
# ✓ Applying web.config transformations
# ✓ Stopping IIS Application Pool: NoorCanvas
# ✓ Deploying to D:\Websites\NOOR-CANVAS
# ✓ Starting IIS Application Pool: NoorCanvas
# ✓ Merging development → master (production state recorded)
```

**What ncdeploy.ps1 Does:**
1. Builds `SPA\NoorCanvas` in Release mode
2. Publishes to `bin\Release\net8.0\publish\`
3. Applies `web.config` transformation (ASPNETCORE_ENVIRONMENT=Production)
4. Stops IIS App Pool "NoorCanvas"
5. Copies publish output to `D:\Websites\NOOR-CANVAS\`
6. Starts IIS App Pool
7. Merges `development` → `master` branch (records production state)
8. Remains on `development` for continued work

**Estimated Downtime**: 2-3 minutes

#### 5.3 Post-Deployment Validation

**Immediate Checks (within 5 minutes):**

```powershell
# 1. Verify application started successfully
Get-WebAppPoolState -Name "NoorCanvas"
# Expected: Started

# 2. Check recent production logs for startup
Get-Content "D:\Websites\NOOR-CANVAS\logs\noor-canvas-prod-$(Get-Date -Format 'yyyyMMdd').txt" -Tail 50
# Expected: "NOOR-SIGNALR-CONFIG: SignalR configured - Environment=Production"
# Expected: "NOOR-SIGNALR-CONFIG: Timeouts - Handshake=20s, KeepAlive=10s, ClientTimeout=60s"

# 3. Test health endpoint
Invoke-WebRequest -Uri "https://noorcanvas.kashkole.com/" -UseBasicParsing
# Expected: HTTP 200 OK

# 4. Monitor for errors (5-minute window)
Get-Content "D:\Websites\NOOR-CANVAS\logs\noor-canvas-prod-$(Get-Date -Format 'yyyyMMdd').txt" -Wait |
    Select-String -Pattern "ERR|CRITICAL|ObjectDisposedException" -Context 2,2
# Expected: No ObjectDisposedException errors
```

**Functional Validation (within 15 minutes):**

- [ ] Open production TranscriptCanvas: `https://noorcanvas.kashkole.com/transcript/canvas/{valid-token}`
- [ ] Verify SignalR connection indicator shows "Connected" (green)
- [ ] Check browser console for connection logs
- [ ] Keep session open for 10 minutes → verify no disconnections
- [ ] Check production logs for lifecycle events:

```powershell
# Monitor connection lifecycle
Get-Content "D:\Websites\NOOR-CANVAS\logs\noor-canvas-prod-$(Get-Date -Format 'yyyyMMdd').txt" -Wait |
    Select-String -Pattern "NOOR-HUB-LIFECYCLE|SIGNALR-FIX:CLIENT"
```

**Expected Log Patterns:**
```
[INFO] NOOR-HUB-LIFECYCLE: Client <ConnectionId> connected
[INFO] NOOR-HUB-LIFECYCLE: Connection <ConnectionId> joined session <SessionId> as participant
[INFO] NOOR-HUB-LIFECYCLE: Session <SessionId> now has <N> active connections
[INFO] NOOR-HUB-LIFECYCLE: Connection <ConnectionId> removed from session <SessionId> - Duration: <N>ms
[DEBUG] NOOR-HUB-LIFECYCLE: Successfully notified group session_<SessionId> of departure
[INFO] NOOR-HUB-LIFECYCLE: Client <ConnectionId> disconnected normally
```

#### 5.4 Monitoring Plan (24-hour window)

**Metrics to Track:**

1. **Connection Stability**
   - SignalR connection duration (should be > 10 minutes for active sessions)
   - Disconnection rate (target: < 5% per hour)
   - Reconnection success rate (target: > 95%)

2. **Error Rates**
   - ObjectDisposedException count (target: 0)
   - Circuit disposal events during active sessions (target: 0)
   - SignalR connection failures (target: < 1% of attempts)

3. **Performance**
   - Server CPU usage (target: < 70% avg)
   - Memory usage (target: < 80% of available)
   - IIS App Pool restarts (target: 0 unplanned restarts)

**Monitoring Commands:**

```powershell
# Real-time error monitoring (run in separate PowerShell window)
Get-Content "D:\Websites\NOOR-CANVAS\logs\noor-canvas-prod-$(Get-Date -Format 'yyyyMMdd').txt" -Wait |
    Select-String -Pattern "ERR|CRITICAL|Exception|Failed" -Context 2,2

# Connection health monitoring
Get-Content "D:\Websites\NOOR-CANVAS\logs\noor-canvas-prod-$(Get-Date -Format 'yyyyMMdd').txt" -Wait |
    Select-String -Pattern "NOOR-HUB-LIFECYCLE.*connected|disconnected|reconnect" -Context 0,0

# Hourly summary (run every hour for 24 hours)
$logFile = "D:\Websites\NOOR-CANVAS\logs\noor-canvas-prod-$(Get-Date -Format 'yyyyMMdd').txt"
$lastHour = (Get-Date).AddHours(-1).ToString("yyyy-MM-dd HH:")
$logs = Get-Content $logFile | Select-String -Pattern $lastHour

Write-Host "=== Last Hour Summary ==="
Write-Host "Total log entries: $($logs.Count)"
Write-Host "Connections: $(($logs | Select-String 'Client .* connected' | Measure-Object).Count)"
Write-Host "Disconnections: $(($logs | Select-String 'Client .* disconnected' | Measure-Object).Count)"
Write-Host "Errors: $(($logs | Select-String 'ERR|CRITICAL' | Measure-Object).Count)"
Write-Host "ObjectDisposedException: $(($logs | Select-String 'ObjectDisposedException' | Measure-Object).Count)"
```

#### 5.5 Rollback Plan

**If critical issues detected within 24 hours:**

```powershell
# 1. Navigate to workspace
cd "D:\PROJECTS\NOOR CANVAS"

# 2. Run rollback script
.\Scripts\ncrollback.ps1

# 3. Verify rollback success
Get-Content "D:\Websites\NOOR-CANVAS\logs\noor-canvas-prod-$(Get-Date -Format 'yyyyMMdd').txt" -Tail 50
```

**Rollback Triggers:**
- ObjectDisposedException errors persist in production
- Connection failure rate > 10%
- Server CPU > 90% sustained for 5+ minutes
- User-reported session interruptions > 5 incidents/hour

---

## Optional Enhancements

### A. SignalR Connection Health Monitoring Dashboard (MEDIUM PRIORITY)

**Objective**: Real-time visibility into SignalR connection health across all active sessions.

**Implementation**:
1. Create `SPA\NoorCanvas\Pages\Admin\SignalRHealth.razor` admin page
2. Display metrics: Total connections, connections per session, avg connection duration, error rate
3. Add background service to aggregate connection metrics every 60 seconds
4. Store metrics in Redis cache or in-memory for dashboard consumption

**Effort**: Medium (8-12 hours)  
**Value**: High visibility for production operations

### B. Automatic Session Recovery on Reconnection (HIGH PRIORITY)

**Objective**: Restore participant state (questions, votes, shared assets) after SignalR reconnection.

**Implementation**:
1. Store participant state (UserGuid, role, last activity timestamp) in session cache
2. On reconnection, call `RecoverSession` hub method with UserGuid
3. Hub returns missed events (questions submitted, assets shared, Q&A updates)
4. Client applies missed events to UI state

**Effort**: Medium (12-16 hours)  
**Value**: Seamless user experience during temporary network interruptions

### C. Percy Visual Regression Tests for Connection State Indicators (LOW PRIORITY)

**Objective**: Prevent UI regressions in SignalR connection state indicators.

**Implementation**:
1. Create `Tests/UI/signalr-connection-states.spec.ts` Playwright test
2. Capture Percy snapshots for all states: Connected, Connecting, Reconnecting, Disconnected
3. Add to CI/CD pipeline (runs on PR merge to development)

**Effort**: Low (4-6 hours)  
**Value**: Prevent visual bugs in connection status UI

### D. Application Insights Telemetry for SignalR (MEDIUM PRIORITY)

**Objective**: Cloud-based telemetry for SignalR connection patterns and failure analysis.

**Implementation**:
1. Add `Microsoft.ApplicationInsights.AspNetCore` NuGet package
2. Configure Application Insights in `appsettings.Production.json`
3. Add custom telemetry for connection lifecycle events
4. Create dashboards in Azure Portal for connection health

**Effort**: Medium (8-10 hours)  
**Value**: Advanced analytics and alerting capabilities

---

## Risk Assessment

### High Risk Areas

1. **Circuit Retention Memory Impact**
   - **Risk**: 30-minute retention may increase memory usage on server
   - **Mitigation**: Monitor server memory during 24-hour post-deployment window
   - **Fallback**: Reduce to 15 minutes if memory usage exceeds 80%

2. **Production Deployment Downtime**
   - **Risk**: Deployment may take longer than 2-3 minutes
   - **Mitigation**: Test ncdeploy.ps1 in dry-run mode; notify users of maintenance window
   - **Fallback**: Rollback via ncrollback.ps1 if issues persist > 10 minutes

3. **Logging Volume Increase**
   - **Risk**: Enhanced logging may generate > 100MB/day in production
   - **Mitigation**: Monitor log file sizes; adjust retention policy if needed
   - **Fallback**: Reduce log level for `NoorCanvas.Hubs` from Debug to Information

### Medium Risk Areas

1. **Auto-Reconnect Exhaustion**
   - **Risk**: Clients may exhaust retry attempts (0s, 2s, 10s, 30s) during extended outages
   - **Mitigation**: Keep-alive interval (10s) detects failures faster; 60s timeout provides buffer
   - **Fallback**: Add manual "Reconnect" button in UI for user-initiated recovery

2. **Hub Method Performance**
   - **Risk**: Synchronous await in OnDisconnectedAsync may slow disconnection processing
   - **Mitigation**: Group notification typically completes in < 50ms; acceptable tradeoff for correctness
   - **Fallback**: Add timeout (5s) to group notification if performance issues arise

---

## Success Criteria

### Phase 1: SessionHub Fix
- [ ] Zero `ObjectDisposedException` errors in development logs after 100 connect/disconnect cycles
- [ ] Unit tests pass for OnDisconnectedAsync synchronous cleanup

### Phase 2: Timeout Optimization
- [ ] Connections survive 30-minute idle period without disconnection
- [ ] Auto-reconnect succeeds within 60 seconds after network interruption
- [ ] Integration tests pass for circuit retention and reconnection

### Phase 3: Diagnostic Logging
- [ ] All connection lifecycle events logged with timestamps in development
- [ ] Production logs include SessionId, ConnectionId, and connection duration for all events
- [ ] Log volume < 50MB/day under normal production load

### Phase 4: Testing
- [ ] All unit tests pass (>= 2 tests for SessionHub)
- [ ] All integration tests pass (>= 2 tests for SignalR connection)
- [ ] Manual testing checklist 100% complete in development
- [ ] Production dry-run completes successfully

### Phase 5: Production Deployment
- [ ] Deployment completes in < 5 minutes with zero errors
- [ ] Zero `ObjectDisposedException` errors in production logs (24-hour window)
- [ ] User-reported disconnection issues reduced to < 1 per day (from current ~5-10 per day)
- [ ] Reconnection success rate >= 95% (measured via logs)

---

## Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: SessionHub Fix | 2-3 hours | None |
| Phase 2: Timeout Optimization | 1-2 hours | None (can parallelize with Phase 1) |
| Phase 3: Diagnostic Logging | 3-4 hours | Phase 1, 2 complete |
| Phase 4: Testing & Validation | 4-6 hours | Phase 1, 2, 3 complete |
| Phase 5: Production Deployment | 1-2 hours | Phase 4 complete, user approval |

**Total Estimated Time**: 11-17 hours (approximately 2 working days)

**Critical Path**: Phase 1 → Phase 3 → Phase 4 → Phase 5  
**Parallelizable**: Phase 1 + Phase 2 can be implemented simultaneously

---

## Appendix

### A. Configuration Reference

**Current Production Configuration** (before fix):
```csharp
// Blazor Circuit
DisconnectedCircuitRetentionPeriod = 180s (3 minutes)
DisconnectedCircuitMaxRetained = 100

// SignalR
HandshakeTimeout = 15s
KeepAliveInterval = 15s
ClientTimeoutInterval = 30s
MaximumReceiveMessageSize = 1MB

// Auto-Reconnect
Retry Intervals = [0s, 2s, 10s, 30s]
```

**New Production Configuration** (after fix):
```csharp
// Blazor Circuit
DisconnectedCircuitRetentionPeriod = 1800s (30 minutes) ← CHANGED
DisconnectedCircuitMaxRetained = 100

// SignalR
HandshakeTimeout = 20s ← CHANGED
KeepAliveInterval = 10s ← CHANGED
ClientTimeoutInterval = 60s ← CHANGED
MaximumReceiveMessageSize = 1MB

// Auto-Reconnect
Retry Intervals = [0s, 2s, 10s, 30s] (unchanged)
```

### B. Production Log File Locations

- **Current Production Logs**: `D:\Websites\NOOR-CANVAS\logs\noor-canvas-prod-YYYYMMDD.txt`
- **IIS Logs**: `C:\inetpub\logs\LogFiles\W3SVC1\` (W3SVC2, W3SVC3 if multiple sites)
- **Application Event Logs**: Windows Event Viewer → Application
- **Deployment Logs**: Created by ncdeploy.ps1 in workspace root (timestamped)

### C. Related Documentation

- ASP.NET Core SignalR Configuration: https://learn.microsoft.com/en-us/aspnet/core/signalr/configuration
- Blazor Server Circuit Management: https://learn.microsoft.com/en-us/aspnet/core/blazor/fundamentals/signalr
- Serilog Configuration: https://github.com/serilog/serilog/wiki/Configuration-Basics
- ncdeploy.ps1 Quick Reference: `Scripts/NCDEPLOY-QUICK-REFERENCE.md`

### D. Contact & Escalation

**If deployment issues arise:**
1. Check rollback procedure (Section 5.5)
2. Review production logs for error patterns
3. Contact: Repository Owner (asifhussain60) via GitHub issues
4. Emergency: Run `.\Scripts\ncrollback.ps1` to restore previous version

---

**Plan Version**: 1.0  
**Last Updated**: 2025-10-25  
**Next Review**: After Phase 5 completion (production deployment + 24-hour monitoring)
