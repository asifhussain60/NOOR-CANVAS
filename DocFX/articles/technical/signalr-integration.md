# SignalR Integration Guide

## Overview

NOOR CANVAS uses SignalR for real-time communication, enabling live collaboration, annotation synchronization, and instant participant feedback.

## Hub Architecture

### Core SignalR Hubs

**SessionHub** - Session Management

```csharp
public class SessionHub : Hub
{
    public async Task JoinSession(string sessionId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"session_{sessionId}");
        await Clients.Group($"session_{sessionId}").SendAsync("UserJoined", Context.ConnectionId);
    }

    public async Task LeaveSession(string sessionId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"session_{sessionId}");
        await Clients.Group($"session_{sessionId}").SendAsync("UserLeft", Context.ConnectionId);
    }
}
```

**AnnotationHub** - Real-time Drawing

```csharp
public class AnnotationHub : Hub
{
    public async Task SendAnnotation(string sessionId, AnnotationData data)
    {
        await Clients.Group($"session_{sessionId}").SendAsync("ReceiveAnnotation", data);
    }

    public async Task ClearCanvas(string sessionId)
    {
        await Clients.Group($"session_{sessionId}").SendAsync("CanvasCleared");
    }
}
```

## Client-Side Integration

### Blazor Server Connection

**Connection Establishment**

```javascript
const connection = new signalR.HubConnectionBuilder()
  .withUrl("/hub/session")
  .configureLogging(signalR.LogLevel.Information)
  .build();

// Start connection
await connection.start();
```

**Real-time Event Handling**

```javascript
// Listen for annotation updates
connection.on("ReceiveAnnotation", function (data) {
  renderAnnotation(data);
  updateCanvas(data);
});

// Handle participant changes
connection.on("UserJoined", function (connectionId) {
  updateParticipantList();
  showNotification("New participant joined");
});
```

## Performance Optimizations

### Connection Management

- **Connection Pooling**: Efficient connection reuse
- **Automatic Reconnection**: Handles network interruptions
- **Heartbeat Monitoring**: Connection health checks
- **Graceful Degradation**: Fallback mechanisms

### Message Optimization

```csharp
// Efficient message structure
public class AnnotationData
{
    public string Type { get; set; }        // draw, erase, clear
    public int[] Coordinates { get; set; }  // compressed coordinates
    public string Color { get; set; }       // hex color code
    public int Thickness { get; set; }      // line thickness
    public long Timestamp { get; set; }     // client timestamp
}
```

### Scalability Features

- **Group Management**: Session-based message routing
- **Message Compression**: Reduced bandwidth usage
- **Client-side Caching**: Optimized rendering
- **Selective Updates**: Only send necessary changes

## Security Implementation

### Connection Authentication

```csharp
public class SessionHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        var sessionId = Context.GetHttpContext()?.Request.Query["sessionId"];
        var isValidSession = await ValidateSessionAccess(sessionId);

        if (!isValidSession)
        {
            Context.Abort();
            return;
        }

        await base.OnConnectedAsync();
    }
}
```

### Message Validation

- **Input Sanitization**: All messages validated
- **Rate Limiting**: Prevents spam and abuse
- **Session Verification**: Ensures user belongs to session
- **Data Encryption**: Secure message transmission

## Error Handling

### Connection Errors

```javascript
connection.onclose(async () => {
  console.log("Connection closed. Attempting to reconnect...");
  await startConnection();
});

connection.onreconnecting(() => {
  console.log("Attempting to reconnect...");
  showConnectionStatus("Reconnecting...");
});

connection.onreconnected(() => {
  console.log("Successfully reconnected.");
  showConnectionStatus("Connected");
});
```

### Server-side Error Handling

```csharp
public class AnnotationHub : Hub
{
    public async Task SendAnnotation(string sessionId, AnnotationData data)
    {
        try
        {
            await ValidateAnnotationData(data);
            await SaveAnnotation(sessionId, data);
            await Clients.Group($"session_{sessionId}").SendAsync("ReceiveAnnotation", data);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to process annotation for session {SessionId}", sessionId);
            await Clients.Caller.SendAsync("AnnotationError", "Failed to process annotation");
        }
    }
}
```

## Configuration

### Startup Configuration

```csharp
// Program.cs
builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = builder.Environment.IsDevelopment();
    options.HandshakeTimeout = TimeSpan.FromSeconds(15);
    options.KeepAliveInterval = TimeSpan.FromSeconds(15);
    options.ClientTimeoutInterval = TimeSpan.FromSeconds(30);
});

// Configure endpoints
app.MapHub<SessionHub>("/hub/session");
app.MapHub<AnnotationHub>("/hub/annotation");
app.MapHub<ParticipantHub>("/hub/participant");
app.MapHub<QuestionHub>("/hub/question");
```

### Client Configuration

```javascript
const connection = new signalR.HubConnectionBuilder()
  .withUrl("/hub/session", {
    transport:
      signalR.HttpTransportType.WebSockets |
      signalR.HttpTransportType.LongPolling,
  })
  .withAutomaticReconnect([0, 2000, 10000, 30000])
  .configureLogging(signalR.LogLevel.Information)
  .build();
```

## Testing SignalR Integration

### Unit Testing Hubs

```csharp
[Test]
public async Task SessionHub_JoinSession_AddsToGroup()
{
    // Arrange
    var hub = new SessionHub();
    var context = CreateMockHubContext();
    hub.Context = context;

    // Act
    await hub.JoinSession("test-session");

    // Assert
    VerifyGroupMembership("session_test-session", context.ConnectionId);
}
```

### Integration Testing

```csharp
[Test]
public async Task SignalR_AnnotationFlow_WorksEndToEnd()
{
    // Test full annotation workflow
    var connection = await CreateTestConnection();
    var annotation = CreateTestAnnotation();

    await connection.InvokeAsync("SendAnnotation", "test-session", annotation);

    var receivedAnnotation = await WaitForAnnotation();
    Assert.AreEqual(annotation.Data, receivedAnnotation.Data);
}
```

---

_For more implementation details, see [Getting Started Guide](../development/getting-started.md)_
