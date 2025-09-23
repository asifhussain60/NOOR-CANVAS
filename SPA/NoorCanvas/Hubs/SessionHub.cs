using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using NoorCanvas.Data;
using System.Text.Json;

namespace NoorCanvas.Hubs;

public class SessionHub : Hub
{
    private readonly ILogger<SessionHub> _logger;
    private readonly SimplifiedCanvasDbContext _context;

    public SessionHub(ILogger<SessionHub> logger, SimplifiedCanvasDbContext context)
    {
        _logger = logger;
        _context = context;
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
    /// Q&A: Join host group for receiving question notifications
    /// </summary>
    public async Task JoinHostGroup(string sessionId)
    {
        var hostGroupName = $"Host_{sessionId}";
        await Groups.AddToGroupAsync(Context.ConnectionId, hostGroupName);
        
        _logger.LogInformation("NOOR-QA-HUB: Host {ConnectionId} joined host group for session {SessionId}", 
            Context.ConnectionId, sessionId);
    }

    /// <summary>
    /// Q&A: Leave host group
    /// </summary>
    public async Task LeaveHostGroup(string sessionId)
    {
        var hostGroupName = $"Host_{sessionId}";
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, hostGroupName);
        
        _logger.LogInformation("NOOR-QA-HUB: Host {ConnectionId} left host group for session {SessionId}", 
            Context.ConnectionId, sessionId);
    }

    /// <summary>
    /// Q&A: Broadcast question submission to session participants
    /// </summary>
    public async Task BroadcastQuestion(string sessionId, object questionData)
    {
        var sessionGroupName = $"Session_{sessionId}";
        var hostGroupName = $"Host_{sessionId}";
        
        _logger.LogInformation("NOOR-QA-HUB: Broadcasting question to session {SessionId}", sessionId);

        // Send to all session participants
        await Clients.Group(sessionGroupName).SendAsync("QuestionReceived", questionData);
        
        // Send special notification to hosts with toast trigger
        await Clients.Group(hostGroupName).SendAsync("HostQuestionAlert", questionData);
    }

    /// <summary>
    /// Q&A: Broadcast vote update to session participants
    /// </summary>
    public async Task BroadcastVoteUpdate(string sessionId, object voteData)
    {
        var sessionGroupName = $"Session_{sessionId}";
        
        _logger.LogInformation("NOOR-QA-HUB: Broadcasting vote update to session {SessionId}", sessionId);
        
        await Clients.Group(sessionGroupName).SendAsync("QuestionVoteUpdate", voteData);
    }

    /// <summary>
    /// Q&A: Mark question as answered (host action)
    /// </summary>
    public async Task MarkQuestionAnswered(string sessionId, int questionId)
    {
        var sessionGroupName = $"Session_{sessionId}";
        
        _logger.LogInformation("NOOR-QA-HUB: Question {QuestionId} marked as answered in session {SessionId}", 
            questionId, sessionId);
        
        await Clients.Group(sessionGroupName).SendAsync("QuestionAnswered", new { questionId, sessionId });
    }

    /// <summary>
    /// ISSUE-1 FIX: Enhanced group join method that syncs existing participants to new connections
    /// </summary>
    public async Task JoinGroup(string groupName)
    {
        var requestId = Guid.NewGuid().ToString("N")[..8];
        
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
        _logger.LogInformation("COPILOT-DEBUG: [{RequestId}] Connection {ConnectionId} joined group {GroupName}", 
            requestId, Context.ConnectionId, groupName);

        // COPILOT-DEBUG: SIGNALR SYNC FIX - Send existing participants to newly connected user
        if (groupName.StartsWith("usertoken_"))
        {
            var userToken = groupName.Substring("usertoken_".Length);
            _logger.LogInformation("COPILOT-DEBUG: [{RequestId}] SIGNALR SYNC FIX - Extracting user token '{UserToken}' from group '{GroupName}'", 
                requestId, userToken, groupName);

            try
            {
                // Get all existing participants for this token
                var existingParticipants = await _context.Participants
                    .Where(p => p.UserToken == userToken)
                    .Select(p => new
                    {
                        sessionId = p.SessionId,
                        participantId = p.UserGuid,
                        displayName = p.Name,
                        country = p.Country,
                        joinedAt = p.JoinedAt,
                        timestamp = DateTime.UtcNow,
                        userToken = p.UserToken
                    })
                    .ToListAsync();

                _logger.LogInformation("COPILOT-DEBUG: [{RequestId}] SIGNALR SYNC FIX - Found {Count} existing participants for token '{UserToken}'", 
                    requestId, existingParticipants.Count, userToken);

                // Send each existing participant to the newly connected client
                foreach (var participant in existingParticipants)
                {
                    await Clients.Caller.SendAsync("ParticipantJoined", participant);
                    _logger.LogInformation("COPILOT-DEBUG: [{RequestId}] SIGNALR SYNC FIX - Sent existing participant '{Name}' to new connection", 
                        requestId, participant.displayName);
                }
                
                if (existingParticipants.Count > 0)
                {
                    _logger.LogInformation("COPILOT-DEBUG: [{RequestId}] SIGNALR SYNC FIX COMPLETED - Synced {Count} existing participants to connection {ConnectionId}", 
                        requestId, existingParticipants.Count, Context.ConnectionId);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "COPILOT-DEBUG: [{RequestId}] SIGNALR SYNC FIX ERROR - Failed to sync existing participants for token '{UserToken}'", 
                    requestId, userToken);
            }
        }
    }

    /// <summary>
    /// ISSUE-1 FIX: Generic group leave method for token-based participant filtering
    /// </summary>
    public async Task LeaveGroup(string groupName)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
        _logger.LogInformation("NOOR-HUB: Connection {ConnectionId} left group {GroupName}", 
            Context.ConnectionId, groupName);
    }

    /// <summary>
    /// Legacy method for session-based grouping (backwards compatibility)
    /// </summary>
    public async Task JoinSessionGroup(string sessionId)
    {
        var groupName = $"session_{sessionId}";
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
        _logger.LogInformation("NOOR-HUB: Connection {ConnectionId} joined session group {GroupName}", 
            Context.ConnectionId, groupName);
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
