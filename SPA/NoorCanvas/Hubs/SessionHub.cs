using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using NoorCanvas.Data;
using System.Text.Json;

namespace NoorCanvas.Hubs;

public class SessionHub : Hub
{
    private readonly ILogger<SessionHub> _logger;
    private readonly SimplifiedCanvasDbContext _context;
    private static readonly Dictionary<string, (int sessionId, string role, DateTime joinedAt)> _connections = new();
    private static readonly object _connectionsLock = new();

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
        // SIGNALR-FIX: Extract connection info outside lock to avoid holding lock during async I/O
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

        // SIGNALR-FIX: CRITICAL FIX - Notify group BEFORE hub disposal (synchronous await instead of fire-and-forget Task.Run)
        // This prevents ObjectDisposedException when accessing Clients property after hub disposal
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
            catch (ObjectDisposedException)
            {
                // SIGNALR-FIX: Graceful handling for rare case where hub is disposed before notification completes
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

    public async Task JoinSession(int sessionId, string role = "user")
    {
        var joinedAt = DateTime.UtcNow;
        var groupName = $"session_{sessionId}";

        _logger.LogInformation("[DEBUG-WORKITEM:canvas-questions:upvote] ════════ CLIENT JOINING SESSION ════════ ConnectionId={ConnectionId}, SessionId={SessionId}, GroupName={GroupName}, Role={Role} ;CLEANUP_OK",
            Context.ConnectionId, sessionId, groupName, role);

        _logger.LogDebug("NOOR-HUB-JOIN: Adding connection {ConnectionId} to group {GroupName}",
            Context.ConnectionId, groupName);

        // SIGNALR-FIX: Enhanced connection tracking with timestamp for duration calculations
        lock (_connectionsLock)
        {
            _connections[Context.ConnectionId] = (sessionId, role, joinedAt);
            _logger.LogInformation("NOOR-HUB-LIFECYCLE: Connection {ConnectionId} joined session {SessionId} as {Role} at {JoinedAt:yyyy-MM-dd HH:mm:ss.fff}",
                Context.ConnectionId, sessionId, role, joinedAt);
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);

        // SIGNALR-FIX: Log group membership confirmation
        _logger.LogInformation("NOOR-HUB-LIFECYCLE: Connection {ConnectionId} added to group {GroupName} (Session {SessionId}, Role: {Role})",
            Context.ConnectionId, groupName, sessionId, role);

        _logger.LogInformation("[DEBUG-WORKITEM:canvas-questions:upvote] ✅ CLIENT ADDED TO GROUP - ConnectionId={ConnectionId}, GroupName={GroupName}, TotalConnections={Total} ;CLEANUP_OK",
            Context.ConnectionId, groupName, _connections.Count);

        _logger.LogInformation("NOOR-HUB-JOIN: User {ConnectionId} joined session {SessionId} as {Role}",
            Context.ConnectionId, sessionId, role);

        await Clients.Group(groupName).SendAsync("UserJoined", new
        {
            connectionId = Context.ConnectionId,
            role = role,
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

        _logger.LogDebug("NOOR-HUB-JOIN: Sent UserJoined notification to group {GroupName}", groupName);
    }

    public async Task LeaveSession(int sessionId)
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

    public async Task ShareAsset(int sessionId, object assetData)
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

    /// <summary>
    /// Simple asset content publishing method - KSESSIONS-style approach for POC
    /// </summary>
    public async Task PublishAssetContent(int sessionId, string contentHtml)
    {
        var groupName = $"session_{sessionId}";
        var hubTrackingId = Guid.NewGuid().ToString("N")[..8];

        _logger.LogInformation("[ASSET-SHARE-POC] Publishing content to group {GroupName}, trackingId={HubTrackingId}, contentLength={ContentLength}", 
            groupName, hubTrackingId, contentHtml?.Length ?? 0);

        try
        {
            // Simple direct broadcast - no complex wrapping, following KSESSIONS pattern
            await Clients.Group(groupName).SendAsync("AssetContentReceived", contentHtml);
            
            _logger.LogInformation("[ASSET-SHARE-POC] ✅ Content published successfully to group {GroupName}, trackingId={HubTrackingId}", 
                groupName, hubTrackingId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[ASSET-SHARE-POC] ❌ Failed to publish content to group {GroupName}, trackingId={HubTrackingId}", 
                groupName, hubTrackingId);
            throw;
        }
    }

    /// <summary>
    /// [TRACE:hcp-tcanvas:broadcast] Broadcast transcript section (h2 + content) to session participants ;CLEANUP_OK
    /// Called from HostControlPanel when host clicks section share button
    /// </summary>
    public async Task BroadcastTranscriptSection(string sessionId, string sectionHtml, string h2Text)
    {
        var groupName = $"session_{sessionId}";
        var trackingId = Guid.NewGuid().ToString("N")[..8];

        _logger.LogInformation("[TRACE:hcp-tcanvas:broadcast] ════════ HUB: BROADCAST SECTION ════════ ;CLEANUP_OK");
        _logger.LogInformation("[TRACE:hcp-tcanvas:broadcast] [{TrackingId}] SessionId={SessionId}, GroupName={GroupName}, ConnectionId={ConnectionId} ;CLEANUP_OK",
            trackingId, sessionId, groupName, Context.ConnectionId);
        _logger.LogInformation("[TRACE:hcp-tcanvas:broadcast] [{TrackingId}] H2 Text: {H2Text}, HTML Length: {HtmlLength} chars ;CLEANUP_OK",
            trackingId, h2Text, sectionHtml?.Length ?? 0);

        try
        {
            var payload = new
            {
                sessionId = sessionId,
                sectionHtml = sectionHtml,
                h2Text = h2Text,
                timestamp = DateTime.UtcNow,
                sharedBy = Context.ConnectionId,
                trackingId = trackingId
            };

            _logger.LogInformation("[TRACE:hcp-tcanvas:broadcast] [{TrackingId}] Sending ReceiveTranscriptSection to group {GroupName} ;CLEANUP_OK",
                trackingId, groupName);

            await Clients.Group(groupName).SendAsync("ReceiveTranscriptSection", payload);

            _logger.LogInformation("[TRACE:hcp-tcanvas:broadcast] [{TrackingId}] ✅ Section broadcasted successfully to {GroupName} ;CLEANUP_OK",
                trackingId, groupName);
            _logger.LogInformation("[TRACE:hcp-tcanvas:broadcast] ════════ BROADCAST COMPLETE ════════ ;CLEANUP_OK");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[TRACE:hcp-tcanvas:broadcast] [{TrackingId}] ❌ ERROR broadcasting section to {GroupName}: {Message} ;CLEANUP_OK",
                trackingId, groupName, ex.Message);
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

        _logger.LogInformation("[DEBUG-WORKITEM:canvas-questions:host-update] ════════ JOIN HOST GROUP ════════ SessionId={SessionId}, ConnectionId={ConnectionId} ;CLEANUP_OK",
            sessionId, Context.ConnectionId);
        _logger.LogInformation("COPILOT-DEBUG: JoinHostGroup called - SessionId: {SessionId}, ConnectionId: {ConnectionId}",
            sessionId, Context.ConnectionId);
        _logger.LogInformation("COPILOT-DEBUG: Adding host connection {ConnectionId} to group {HostGroup}",
            Context.ConnectionId, hostGroupName);

        try
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, hostGroupName);

            _logger.LogInformation("[DEBUG-WORKITEM:canvas-questions:host-update] ✅ Host {ConnectionId} SUCCESSFULLY ADDED to {HostGroup} ;CLEANUP_OK",
                Context.ConnectionId, hostGroupName);
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
    /// Q&A: Mark question as answered (host action) - DEPRECATED, use BroadcastQuestionAnswered instead.
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
    /// [FIX-ISSUE-2] Broadcast that host answered a question - removes from all participants and shows toast to asker.
    /// </summary>
    /// <param name="sessionId">The session ID where the question was answered.</param>
    /// <param name="questionId">The GUID of the answered question.</param>
    /// <param name="originalAskerGuid">The UserGuid of the person who originally asked the question.</param>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    public async Task BroadcastQuestionAnswered(int sessionId, string questionId, string originalAskerGuid)
    {
        var sessionGroupName = $"session_{sessionId}";
        
        _logger.LogInformation("[DEBUG-WORKITEM:hcp-questions:answered] Broadcasting QuestionAnswered to {Group} - QuestionId={QuestionId}, Asker={Asker} ;CLEANUP_OK", 
            sessionGroupName, questionId, originalAskerGuid ?? "NULL");
        
        await Clients.Group(sessionGroupName).SendAsync("QuestionAnswered", new
        {
            questionId = questionId,
            originalAskerGuid = originalAskerGuid,
            answeredAt = DateTime.UtcNow,
            sessionId = sessionId
        });
        
        _logger.LogInformation("[DEBUG-WORKITEM:hcp-questions:answered] ✅ QuestionAnswered broadcast complete to {Group} ;CLEANUP_OK", sessionGroupName);
    }

    /// <summary>
    /// [DEBUG-WORKITEM:hcp] Clear canvas content and show default message in participant views ;CLEANUP_OK
    /// </summary>
    public async Task ClearCanvas(int sessionId)
    {
        var sessionGroupName = $"session_{sessionId}";
        
        _logger.LogInformation("[DEBUG-WORKITEM:hcp] Broadcasting ClearCanvas to {Group} - SessionId={SessionId} ;CLEANUP_OK", 
            sessionGroupName, sessionId);
        
        await Clients.Group(sessionGroupName).SendAsync("ClearCanvas");
        
        _logger.LogInformation("[DEBUG-WORKITEM:hcp] ✅ ClearCanvas broadcast complete to {Group} ;CLEANUP_OK", sessionGroupName);
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
    public async Task BroadcastSessionBegan(int sessionId, object sessionData)
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
    public async Task BroadcastSessionEnded(int sessionId, string reason = "Host ended session")
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
    /// [DEBUG-WORKITEM:transcript-canvas:broadcast] Broadcast full transcript HTML to all participants ;CLEANUP_OK
    /// </summary>
    /// <param name="sessionId">Session ID to broadcast to.</param>
    /// <param name="transcriptHtml">Full transcript HTML content to share.</param>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    public async Task BroadcastTranscriptShared(int sessionId, string transcriptHtml)
    {
        var groupName = $"session_{sessionId}";

        _logger.LogInformation("[DEBUG-WORKITEM:transcript-canvas:broadcast] Broadcasting TranscriptShared to session {SessionId}, contentLength: {Length} chars ;CLEANUP_OK", 
            sessionId, transcriptHtml?.Length ?? 0);

        await Clients.Group(groupName).SendAsync("TranscriptShared", new
        {
            sessionId = sessionId,
            transcriptHtml = transcriptHtml,
            sharedAt = DateTime.UtcNow,
            timestamp = DateTime.UtcNow
        });

        _logger.LogInformation("[DEBUG-WORKITEM:transcript-canvas:broadcast] TranscriptShared broadcast completed for session {SessionId} ;CLEANUP_OK", sessionId);
    }

    /// <summary>
    /// Broadcast participant joined event to session group (called from ParticipantController).
    /// </summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    public async Task BroadcastParticipantJoined(int sessionId, string participantId, string displayName, string? country, DateTime joinedAt)
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
    public async Task BroadcastParticipantLeft(int sessionId, string participantId, string displayName)
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
