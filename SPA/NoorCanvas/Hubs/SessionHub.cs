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

    /// <summary>
    /// Broadcast session began event to all participants
    /// </summary>
    public async Task BroadcastSessionBegan(long sessionId, object sessionData)
    {
        var groupName = $"session_{sessionId}";

        _logger.LogInformation("NOOR-HUB: Broadcasting SessionBegan for session {SessionId}", sessionId);

        await Clients.Group(groupName).SendAsync("SessionBegan", new
        {
            sessionId = sessionId,
            sessionData = sessionData,
            startedAt = DateTime.UtcNow,
            timestamp = DateTime.UtcNow
        });

        _logger.LogInformation("NOOR-HUB: SessionBegan broadcast completed for session {SessionId}", sessionId);
    }

    /// <summary>
    /// Broadcast session ended event to all participants
    /// </summary>
    public async Task BroadcastSessionEnded(long sessionId, string reason = "Host ended session")
    {
        var groupName = $"session_{sessionId}";

        _logger.LogInformation("NOOR-HUB: Broadcasting SessionEnded for session {SessionId}, reason: {Reason}", sessionId, reason);

        await Clients.Group(groupName).SendAsync("SessionEnded", new
        {
            sessionId = sessionId,
            reason = reason,
            endedAt = DateTime.UtcNow,
            timestamp = DateTime.UtcNow
        });

        _logger.LogInformation("NOOR-HUB: SessionEnded broadcast completed for session {SessionId}", sessionId);
    }

    /// <summary>
    /// Broadcast participant joined event to session group (called from ParticipantController)
    /// </summary>
    public async Task BroadcastParticipantJoined(long sessionId, string participantId, string displayName, string? country, DateTime joinedAt)
    {
        var groupName = $"session_{sessionId}";

        _logger.LogInformation("NOOR-HUB: Broadcasting ParticipantJoined for session {SessionId}, participant {ParticipantId}",
            sessionId, participantId);

        await Clients.Group(groupName).SendAsync("ParticipantJoined", new
        {
            sessionId = sessionId,
            participantId = participantId,
            displayName = displayName,
            country = country,
            joinedAt = joinedAt,
            timestamp = DateTime.UtcNow
        });

        _logger.LogInformation("NOOR-HUB: ParticipantJoined broadcast completed for session {SessionId}", sessionId);
    }

    /// <summary>
    /// Broadcast participant left event to session group
    /// </summary>
    public async Task BroadcastParticipantLeft(long sessionId, string participantId, string displayName)
    {
        var groupName = $"session_{sessionId}";

        _logger.LogInformation("NOOR-HUB: Broadcasting ParticipantLeft for session {SessionId}, participant {ParticipantId}",
            sessionId, participantId);

        await Clients.Group(groupName).SendAsync("ParticipantLeft", new
        {
            sessionId = sessionId,
            participantId = participantId,
            displayName = displayName,
            leftAt = DateTime.UtcNow,
            timestamp = DateTime.UtcNow
        });

        _logger.LogInformation("NOOR-HUB: ParticipantLeft broadcast completed for session {SessionId}", sessionId);
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
