using Microsoft.AspNetCore.SignalR;

namespace NoorCanvas.Hubs;

public class TestHub : Hub
{
    private readonly ILogger<TestHub> _logger;

    public TestHub(ILogger<TestHub> logger)
    {
        _logger = logger;
    }

    public async Task SendMessage(string message)
    {
        _logger.LogInformation("[DEBUG-WORKITEM:hostcanvas:TESTHUB] SendMessage called: {Message} from {ConnectionId}",
            message, Context.ConnectionId);

        try
        {
            await Clients.All.SendAsync("ReceiveMessage", message);
            _logger.LogInformation("[DEBUG-WORKITEM:hostcanvas:TESTHUB] Message sent successfully to all clients");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[DEBUG-WORKITEM:hostcanvas:TESTHUB] Error sending message: {Error}", ex.Message);
            throw;
        }
    }

    public async Task JoinHtmlTestSession(string sessionId)
    {
        var groupName = $"htmltest_{sessionId}";

        _logger.LogInformation("[DEBUG-WORKITEM:hostcanvas:TESTHUB] JoinHtmlTestSession: ConnectionId {ConnectionId} joining group {GroupName}",
            Context.ConnectionId, groupName);

        try
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);

            // Notify others in the group about the new participant
            await Clients.Group(groupName).SendAsync("ParticipantJoined", new
            {
                connectionId = Context.ConnectionId,
                sessionId = sessionId,
                timestamp = DateTime.UtcNow
            });

            _logger.LogInformation("[DEBUG-WORKITEM:hostcanvas:TESTHUB] Successfully added {ConnectionId} to session group {GroupName}",
                Context.ConnectionId, groupName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[DEBUG-WORKITEM:hostcanvas:TESTHUB] Error joining session group: {Error}", ex.Message);
            throw;
        }
    }

    /* 
    // DEPRECATED: Duplicate of SessionHub.BroadcastHtml - use SessionHub for production HTML broadcasting
    // Commented out per hostcanvas analysis - can be restored if TestHub-specific broadcasting is needed
    // Replacement: Use SessionHub.BroadcastHtml which connects to /hub/session with group name "session_{sessionId}"
    public async Task BroadcastHtml(string sessionId, string htmlContent, string contentType = "general")
    {
        var groupName = $"htmltest_{sessionId}";
        
        _logger.LogInformation("[DEBUG-WORKITEM:hostcanvas:TESTHUB] BroadcastHtml called: SessionId {SessionId}, ContentType {ContentType}, ContentLength {Length}, From {ConnectionId}", 
            sessionId, contentType, htmlContent?.Length ?? 0, Context.ConnectionId);

        try
        {
            var broadcastPayload = new
            {
                htmlContent = htmlContent,
                contentType = contentType,
                senderConnectionId = Context.ConnectionId,
                sessionId = sessionId,
                timestamp = DateTime.UtcNow
            };

            // Send to all clients in the session group EXCEPT the sender
            await Clients.GroupExcept(groupName, Context.ConnectionId).SendAsync("HtmlContentReceived", broadcastPayload);
            
            _logger.LogInformation("[DEBUG-WORKITEM:hostcanvas:TESTHUB] HTML broadcast sent to group {GroupName} (excluding sender {ConnectionId})", 
                groupName, Context.ConnectionId);

            // Send confirmation back to sender
            await Clients.Caller.SendAsync("HtmlBroadcastConfirmed", new
            {
                sessionId = sessionId,
                contentType = contentType,
                timestamp = DateTime.UtcNow,
                status = "sent"
            });

            _logger.LogInformation("[DEBUG-WORKITEM:hostcanvas:TESTHUB] HTML broadcast confirmation sent to sender {ConnectionId}", 
                Context.ConnectionId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[DEBUG-WORKITEM:hostcanvas:TESTHUB] Error broadcasting HTML: {Error}", ex.Message);
            throw;
        }
    }
    */

    public async Task Echo(string message)
    {
        _logger.LogInformation("[DEBUG-WORKITEM:hostcanvas:TESTHUB] Echo called: {Message} from {ConnectionId}",
            message, Context.ConnectionId);

        try
        {
            await Clients.Caller.SendAsync("EchoResponse", $"Echo: {message}");
            _logger.LogInformation("[DEBUG-WORKITEM:hostcanvas:TESTHUB] Echo response sent successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[DEBUG-WORKITEM:hostcanvas:TESTHUB] Error sending echo: {Error}", ex.Message);
            throw;
        }
    }

    /// <inheritdoc/>
    public override async Task OnConnectedAsync()
    {
        _logger.LogInformation("[DEBUG-WORKITEM:hostcanvas:TESTHUB] Client connected: {ConnectionId}", Context.ConnectionId);
        await base.OnConnectedAsync();
    }

    /// <inheritdoc/>
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        if (exception != null)
        {
            _logger.LogWarning(exception, "[DEBUG-WORKITEM:hostcanvas:TESTHUB] Client disconnected with error: {ConnectionId}", Context.ConnectionId);
        }
        else
        {
            _logger.LogInformation("[DEBUG-WORKITEM:hostcanvas:TESTHUB] Client disconnected normally: {ConnectionId}", Context.ConnectionId);
        }

        await base.OnDisconnectedAsync(exception);
    }
}