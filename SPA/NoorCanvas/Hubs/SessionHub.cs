using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using NoorCanvas.Data;
using System.Text.Json;

namespace NoorCanvas.Hubs;

public class SessionHub : Hub
{
    private readonly ILogger<SessionHub> _logger;
    private readonly SimplifiedCanvasDbContext _context;
    private static readonly Dictionary<string, (long sessionId, string role, DateTime joinedAt)> _connections = new();
    private static readonly object _connectionsLock = new object();

    public SessionHub(ILogger<SessionHub> logger, SimplifiedCanvasDbContext context)
    {
        _logger = logger;
        _context = context;
    }

    /// <summary>
    /// Handle connection lifecycle - called when client connects.
    /// </summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    public override async Task OnConnectedAsync()
    {
        _logger.LogInformation("NOOR-HUB-LIFECYCLE: Client {ConnectionId} connected", Context.ConnectionId);
        await base.OnConnectedAsync();
    }

    /// <summary>
    /// Handle connection lifecycle - called when client disconnects.
    /// </summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
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
                _ = Task.Run(async () =>
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

    public async Task JoinSession(long sessionId, string role = "user")
    {
        var groupName = $"session_{sessionId}";

        _logger.LogDebug("NOOR-HUB-JOIN: Adding connection {ConnectionId} to group {GroupName}",
            Context.ConnectionId, groupName);

        // Track connection with thread safety
        lock (_connectionsLock)
        {
            _connections[Context.ConnectionId] = (sessionId, role, DateTime.UtcNow);
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);

        _logger.LogInformation("NOOR-HUB-JOIN: User {ConnectionId} joined session {SessionId} as {Role}",
            Context.ConnectionId, sessionId, role);

        await Clients.Group(groupName).SendAsync("UserJoined", new
        {
            connectionId = Context.ConnectionId,
            role = role,
            timestamp = DateTime.UtcNow
        });

        _logger.LogDebug("NOOR-HUB-JOIN: Sent UserJoined notification to group {GroupName}", groupName);
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
        var hubTrackingId = Guid.NewGuid().ToString("N")[..8];

        _logger.LogInformation("[DEBUG-WORKITEM:hostcanvas:HUB-TRACK] 🎣 HUB ENTRY: ShareAsset method called, sessionId={SessionId}, connectionId={ConnectionId}, hubTrackingId={HubTrackingId} ;CLEANUP_OK",
            sessionId, Context.ConnectionId, hubTrackingId);

        _logger.LogDebug("[DEBUG-WORKITEM:hostcanvas:HUB-TRACK] Asset data type: {AssetType}, group name: {GroupName}, hubTrackingId={HubTrackingId} ;CLEANUP_OK",
            assetData?.GetType()?.Name ?? "null", groupName, hubTrackingId);

        // ENHANCED: Log the actual asset data structure for debugging
        try
        {
            var assetJson = System.Text.Json.JsonSerializer.Serialize(assetData, new System.Text.Json.JsonSerializerOptions { WriteIndented = true });
            _logger.LogInformation("[DEBUG-WORKITEM:hostcanvas:HUB-TRACK] 📋 HUB PROCESS: Asset data serialized, length={Length} chars, hubTrackingId={HubTrackingId} ;CLEANUP_OK", assetJson?.Length ?? 0, hubTrackingId);
            _logger.LogDebug("[DEBUG-WORKITEM:hostcanvas:HUB-TRACK] Asset JSON preview: {AssetPreview} ;CLEANUP_OK", assetJson?.Substring(0, Math.Min(200, assetJson?.Length ?? 0)));
        }
        catch (Exception ex)
        {
            _logger.LogWarning("[DEBUG-WORKITEM:hostcanvas:HUB-TRACK] Could not serialize asset data: {Error}, hubTrackingId={HubTrackingId} ;CLEANUP_OK", ex.Message, hubTrackingId);
        }

        try
        {
            var broadcastPayload = new
            {
                sessionId = sessionId,
                asset = assetData,
                timestamp = DateTime.UtcNow,
                sharedBy = Context.ConnectionId
            };

            _logger.LogInformation("[DEBUG-WORKITEM:hostcanvas:HUB-TRACK] 📦 HUB BROADCAST: Broadcasting AssetShared to group {GroupName} for session {SessionId}, hubTrackingId={HubTrackingId} ;CLEANUP_OK",
                groupName, sessionId, hubTrackingId);

            await Clients.Group(groupName).SendAsync("AssetShared", broadcastPayload);

            _logger.LogInformation("[DEBUG-WORKITEM:hostcanvas:HUB-TRACK] ✅ HUB SUCCESS: AssetShared message sent to group {GroupName} for session {SessionId}, hubTrackingId={HubTrackingId} ;CLEANUP_OK",
                groupName, sessionId, hubTrackingId);

            _logger.LogInformation("[DEBUG-WORKITEM:hostcanvas:HUB-TRACK] 📝 HUB COMPLETE: Broadcast complete, testContent={HasTestContent}, hubTrackingId={HubTrackingId} ;CLEANUP_OK",
                assetData?.GetType()?.GetProperty("testContent") != null ? "YES" : "NO", hubTrackingId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[DEBUG-WORKITEM:hostcanvas:HUB-TRACK] ❌ HUB ERROR: Failed to send AssetShared message to group {GroupName} for session {SessionId}, hubTrackingId={HubTrackingId} ;CLEANUP_OK",
                groupName, sessionId, hubTrackingId);
            throw;
        }
    }

    public async Task Ping()
    {
        await Clients.Caller.SendAsync("Pong", DateTime.UtcNow);
    }

    /// <summary>
    /// Q&A: Join host group for receiving question notifications.
    /// </summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    public async Task JoinHostGroup(string sessionId)
    {
        var hostGroupName = $"Host_{sessionId}";

        _logger.LogInformation("COPILOT-DEBUG: JoinHostGroup called - SessionId: {SessionId}, ConnectionId: {ConnectionId}",
            sessionId, Context.ConnectionId);
        _logger.LogInformation("COPILOT-DEBUG: Adding host connection {ConnectionId} to group {HostGroup}",
            Context.ConnectionId, hostGroupName);

        try
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, hostGroupName);

            _logger.LogInformation("COPILOT-DEBUG: Host connection {ConnectionId} successfully added to group {HostGroup}",
                Context.ConnectionId, hostGroupName);
            _logger.LogInformation("NOOR-QA-HUB: Host {ConnectionId} joined host group {HostGroup} for session {SessionId}",
                Context.ConnectionId, hostGroupName, sessionId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "COPILOT-DEBUG: Error adding host {ConnectionId} to group {HostGroup}",
                Context.ConnectionId, hostGroupName);
            throw;
        }
    }

    /// <summary>
    /// Q&A: Leave host group.
    /// </summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    public async Task LeaveHostGroup(string sessionId)
    {
        var hostGroupName = $"Host_{sessionId}";
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, hostGroupName);

        _logger.LogInformation("NOOR-QA-HUB: Host {ConnectionId} left host group for session {SessionId}",
            Context.ConnectionId, sessionId);
    }

    /// <summary>
    /// Q&A: Broadcast question submission to session participants.
    /// </summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    public async Task BroadcastQuestion(string sessionId, object questionData)
    {
        var sessionGroupName = $"session_{sessionId}";  // Fixed: use lowercase to match JoinSession
        var hostGroupName = $"Host_{sessionId}";

        _logger.LogInformation("COPILOT-DEBUG: BroadcastQuestion called - SessionId: {SessionId}, ConnectionId: {ConnectionId}",
            sessionId, Context.ConnectionId);
        _logger.LogInformation("COPILOT-DEBUG: Target groups - SessionGroup: {SessionGroup}, HostGroup: {HostGroup}",
            sessionGroupName, hostGroupName);

        var questionJson = System.Text.Json.JsonSerializer.Serialize(questionData);
        _logger.LogInformation("COPILOT-DEBUG: Question data to broadcast: {QuestionData}", questionJson);

        try
        {
            // Send to all session participants
            _logger.LogInformation("COPILOT-DEBUG: Sending QuestionReceived to group {SessionGroup}", sessionGroupName);
            await Clients.Group(sessionGroupName).SendAsync("QuestionReceived", questionData);
            _logger.LogInformation("COPILOT-DEBUG: QuestionReceived sent successfully to {SessionGroup}", sessionGroupName);

            // Send special notification to hosts with toast trigger
            _logger.LogInformation("COPILOT-DEBUG: Sending HostQuestionAlert to group {HostGroup}", hostGroupName);
            await Clients.Group(hostGroupName).SendAsync("HostQuestionAlert", questionData);
            _logger.LogInformation("COPILOT-DEBUG: HostQuestionAlert sent successfully to {HostGroup}", hostGroupName);

            _logger.LogInformation("NOOR-QA-HUB: Broadcasting question to session {SessionId} completed successfully - groups: {SessionGroup}, {HostGroup}",
                sessionId, sessionGroupName, hostGroupName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "COPILOT-DEBUG: Error broadcasting question to session {SessionId}", sessionId);
            throw;
        }
    }

    /// <summary>
    /// Q&A: Broadcast vote update to session participants.
    /// </summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    public async Task BroadcastVoteUpdate(string sessionId, object voteData)
    {
        var sessionGroupName = $"session_{sessionId}";  // Fixed: use lowercase to match JoinSession

        _logger.LogInformation("NOOR-QA-HUB: Broadcasting vote update to session {SessionId} - group: {SessionGroup}",
            sessionId, sessionGroupName);

        await Clients.Group(sessionGroupName).SendAsync("QuestionVoteUpdate", voteData);

        _logger.LogDebug("NOOR-QA-HUB: Successfully sent vote update to group {SessionGroup}", sessionGroupName);
    }

    /// <summary>
    /// Q&A: Mark question as answered (host action).
    /// </summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    public async Task MarkQuestionAnswered(string sessionId, int questionId)
    {
        var sessionGroupName = $"session_{sessionId}";  // Fixed: use lowercase to match JoinSession

        _logger.LogInformation("NOOR-QA-HUB: Question {QuestionId} marked as answered in session {SessionId} - group: {SessionGroup}",
            questionId, sessionId, sessionGroupName);

        await Clients.Group(sessionGroupName).SendAsync("QuestionAnswered", new { questionId, sessionId });

        _logger.LogDebug("NOOR-QA-HUB: Successfully sent question answered notification to group {SessionGroup}", sessionGroupName);
    }

    /// <summary>
    /// ISSUE-1 FIX: Enhanced group join method that syncs existing participants to new connections.
    /// </summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
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
    /// ISSUE-1 FIX: Generic group leave method for token-based participant filtering.
    /// </summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    public async Task LeaveGroup(string groupName)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
        _logger.LogInformation("NOOR-HUB: Connection {ConnectionId} left group {GroupName}",
            Context.ConnectionId, groupName);
    }

    /// <summary>
    /// Legacy method for session-based grouping (backwards compatibility).
    /// </summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    public async Task JoinSessionGroup(string sessionId)
    {
        var groupName = $"session_{sessionId}";
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
        _logger.LogInformation("NOOR-HUB: Connection {ConnectionId} joined session group {GroupName}",
            Context.ConnectionId, groupName);
    }

    /// <summary>
    /// Broadcast session began event to all participants.
    /// </summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
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
    /// Broadcast HTML content to session participants
    /// PRIMARY IMPLEMENTATION - replaces duplicate TestHub.BroadcastHtml.
    /// </summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    public async Task BroadcastHtml(string sessionId, string htmlContent, string contentType = "general")
    {
        var requestId = Guid.NewGuid().ToString("N")[..8];
        var groupName = $"session_{sessionId}";

        _logger.LogInformation("[DEBUG-WORKITEM:hostcanvas:SESSIONHUB] [{RequestId}] BroadcastHtml called: SessionId {SessionId}, ContentType {ContentType}, ContentLength {Length}, From {ConnectionId}",
            requestId, sessionId, contentType, htmlContent?.Length ?? 0, Context.ConnectionId);

        var broadcastData = new
        {
            htmlContent = htmlContent,
            contentType = contentType,
            senderConnectionId = Context.ConnectionId,
            timestamp = DateTime.UtcNow,
            sessionId = sessionId,
            requestId = requestId
        };

        try
        {
            _logger.LogInformation("[DEBUG-WORKITEM:hostcanvas:SESSIONHUB] [{RequestId}] Broadcasting HtmlContentReceived to group {GroupName}", requestId, groupName);

            // Send to all clients in the session group 
            await Clients.Group(groupName).SendAsync("HtmlContentReceived", broadcastData);

            _logger.LogInformation("[DEBUG-WORKITEM:hostcanvas:SESSIONHUB] [{RequestId}] Successfully sent HtmlContentReceived to group {GroupName}", requestId, groupName);

            // Send confirmation back to sender for debugging
            await Clients.Caller.SendAsync("HtmlBroadcastConfirmed", new
            {
                sessionId = sessionId,
                contentType = contentType,
                timestamp = DateTime.UtcNow,
                status = "sent",
                requestId = requestId,
                groupName = groupName
            });

            _logger.LogInformation("[DEBUG-WORKITEM:hostcanvas:SESSIONHUB] [{RequestId}] HTML broadcast confirmation sent to sender {ConnectionId}", requestId, Context.ConnectionId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[DEBUG-WORKITEM:hostcanvas:SESSIONHUB] [{RequestId}] Failed to broadcast HTML content to session {SessionId}", requestId, sessionId);
            throw;
        }
    }

    /// <summary>
    /// Broadcast session ended event to all participants.
    /// </summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
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
    /// Broadcast participant joined event to session group (called from ParticipantController).
    /// </summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
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
    /// Broadcast participant left event to session group.
    /// </summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
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

    // Test methods for SignalR functionality verification
    public async Task BroadcastToAll(string message)
    {
        _logger.LogInformation("[DEBUG-WORKITEM:hostcanvas:TEST] BroadcastToAll called: {Message} from {ConnectionId}",
            message, Context.ConnectionId);

        try
        {
            await Clients.All.SendAsync("BroadcastMessage", message);
            _logger.LogInformation("[DEBUG-WORKITEM:hostcanvas:TEST] BroadcastToAll sent successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[DEBUG-WORKITEM:hostcanvas:TEST] BroadcastToAll failed: {Error}", ex.Message);
            throw;
        }
    }

    public async Task SendTestMessage(string message)
    {
        _logger.LogInformation("[DEBUG-WORKITEM:hostcanvas:TEST] SendTestMessage called: {Message} from {ConnectionId}",
            message, Context.ConnectionId);

        try
        {
            await Clients.All.SendAsync("TestMessage", message);
            _logger.LogInformation("[DEBUG-WORKITEM:hostcanvas:TEST] SendTestMessage sent successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[DEBUG-WORKITEM:hostcanvas:TEST] SendTestMessage failed: {Error}", ex.Message);
            throw;
        }
    }

    /// <summary>
    /// WORKITEM-WAITINGROOM: Broadcast test participant to token group for debug panel functionality
    /// Sends ParticipantJoined event to all users sharing the same token.
    /// </summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    public async Task BroadcastTestParticipant(string userToken, object participantData)
    {
        var tokenGroup = $"usertoken_{userToken}";

        try
        {
            // Broadcast ParticipantJoined event to all clients in the token group
            await Clients.Group(tokenGroup).SendAsync("ParticipantJoined", participantData);

            // Only log errors, not every successful broadcast (reduces 100 logs to ~0 for success case)
        }
        catch (Exception ex)
        {
            var requestId = Guid.NewGuid().ToString("N")[..8];
            _logger.LogError(ex, "WORKITEM-WAITINGROOM: [{RequestId}] BroadcastTestParticipant failed for token group '{TokenGroup}': {Error}",
                requestId, tokenGroup, ex.Message);
            throw;
        }
    }
}
