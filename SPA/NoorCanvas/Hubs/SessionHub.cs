using Microsoft.AspNetCore.SignalR;
using System.Text.Json;

namespace NoorCanvas.Hubs;

public class SessionHub : Hub
{
    private readonly ILogger<SessionHub> _logger;

    public SessionHub(ILogger<SessionHub> logger)
    {
        _logger = logger;
    }

    public async Task JoinSession(long sessionId, string role = "user")
    {
        var groupName = $"session_{sessionId}";
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
        
        _logger.LogInformation("NOOR-HUB: User {ConnectionId} joined session {SessionId} as {Role}", 
            Context.ConnectionId, sessionId, role);

        await Clients.Group(groupName).SendAsync("UserJoined", new 
        {
            connectionId = Context.ConnectionId,
            role = role,
            timestamp = DateTime.UtcNow
        });
    }

    public async Task LeaveSession(long sessionId)
    {
        var groupName = $"session_{sessionId}";
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
        
        _logger.LogInformation("NOOR-HUB: User {ConnectionId} left session {SessionId}", 
            Context.ConnectionId, sessionId);

        await Clients.Group(groupName).SendAsync("UserLeft", new 
        {
            connectionId = Context.ConnectionId,
            timestamp = DateTime.UtcNow
        });
    }

    public async Task ShareAsset(long sessionId, object assetData)
    {
        var groupName = $"session_{sessionId}";
        
        _logger.LogDebug("NOOR-HUB: Asset shared in session {SessionId}", sessionId);

        await Clients.Group(groupName).SendAsync("AssetShared", new 
        {
            sessionId = sessionId,
            asset = assetData,
            timestamp = DateTime.UtcNow,
            sharedBy = Context.ConnectionId
        });
    }

    public async Task Ping()
    {
        await Clients.Caller.SendAsync("Pong", DateTime.UtcNow);
    }

    public override async Task OnConnectedAsync()
    {
        _logger.LogDebug("NOOR-HUB: Connection established: {ConnectionId}", Context.ConnectionId);
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        if (exception != null)
        {
            _logger.LogWarning(exception, "NOOR-HUB: Connection {ConnectionId} disconnected with error", Context.ConnectionId);
        }
        else
        {
            _logger.LogDebug("NOOR-HUB: Connection {ConnectionId} disconnected normally", Context.ConnectionId);
        }
        
        await base.OnDisconnectedAsync(exception);
    }
}
