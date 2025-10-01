using Microsoft.AspNetCore.SignalR;
using NoorCanvas.Services;

namespace NoorCanvas.Hubs
{
    public class AnnotationHub : Hub
    {
        private readonly ILogger<AnnotationHub> _logger;
        private readonly IAnnotationService _annotationService;

        public AnnotationHub(ILogger<AnnotationHub> logger, IAnnotationService annotationService)
        {
            _logger = logger;
            _annotationService = annotationService;
        }

        /// <inheritdoc/>
        public override async Task OnConnectedAsync()
        {
            _logger.LogInformation("NOOR-ANNOTATION-HUB: Client connected - ConnectionId: {ConnectionId}", Context.ConnectionId);
            await base.OnConnectedAsync();
        }

        /// <inheritdoc/>
        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            if (exception != null)
            {
                _logger.LogWarning(exception, "NOOR-ANNOTATION-HUB: Client disconnected with exception - ConnectionId: {ConnectionId}", Context.ConnectionId);
            }
            else
            {
                _logger.LogInformation("NOOR-ANNOTATION-HUB: Client disconnected - ConnectionId: {ConnectionId}", Context.ConnectionId);
            }

            await base.OnDisconnectedAsync(exception);
        }

        /// <summary>
        /// Join a session group for real-time annotation updates.
        /// </summary>
        /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
        public async Task JoinSession(long sessionId, string userId)
        {
            try
            {
                _logger.LogInformation("NOOR-ANNOTATION-HUB: User {UserId} joining session {SessionId} - ConnectionId: {ConnectionId}",
                    userId, sessionId, Context.ConnectionId);

                var groupName = $"Session_{sessionId}";
                await Groups.AddToGroupAsync(Context.ConnectionId, groupName);

                // Send current annotations to the newly joined user
                var annotations = await _annotationService.GetSessionAnnotationsAsync(sessionId);
                await Clients.Caller.SendAsync("LoadAnnotations", annotations);

                // Notify others in the session about the new user
                await Clients.OthersInGroup(groupName).SendAsync("UserJoined", new { userId, connectionId = Context.ConnectionId });

                _logger.LogInformation("NOOR-ANNOTATION-HUB: User {UserId} successfully joined session {SessionId}", userId, sessionId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NOOR-ANNOTATION-HUB: Error joining session {SessionId} for user {UserId}", sessionId, userId);
                await Clients.Caller.SendAsync("Error", new { message = "Failed to join session for annotations" });
            }
        }

        /// <summary>
        /// Leave a session group.
        /// </summary>
        /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
        public async Task LeaveSession(long sessionId, string userId)
        {
            try
            {
                _logger.LogInformation("NOOR-ANNOTATION-HUB: User {UserId} leaving session {SessionId} - ConnectionId: {ConnectionId}",
                    userId, sessionId, Context.ConnectionId);

                var groupName = $"Session_{sessionId}";
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);

                // Notify others in the session about the user leaving
                await Clients.OthersInGroup(groupName).SendAsync("UserLeft", new { userId, connectionId = Context.ConnectionId });

                _logger.LogInformation("NOOR-ANNOTATION-HUB: User {UserId} successfully left session {SessionId}", userId, sessionId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NOOR-ANNOTATION-HUB: Error leaving session {SessionId} for user {UserId}", sessionId, userId);
            }
        }

        /// <summary>
        /// Broadcast a new annotation to all session participants.
        /// </summary>
        /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
        public async Task BroadcastAnnotation(long sessionId, string userId, object annotationData)
        {
            try
            {
                _logger.LogInformation("NOOR-ANNOTATION-HUB: Broadcasting annotation from user {UserId} in session {SessionId}",
                    userId, sessionId);

                // Save the annotation to database
                var annotation = await _annotationService.CreateAnnotationAsync(sessionId, userId, annotationData);

                // Broadcast to all session participants except the sender
                var groupName = $"Session_{sessionId}";
                await Clients.OthersInGroup(groupName).SendAsync("AnnotationCreated", new
                {
                    annotationId = annotation.AnnotationId,
                    sessionId = annotation.SessionId,
                    createdBy = annotation.CreatedBy,
                    createdAt = annotation.CreatedAt,
                    annotationData = annotation.AnnotationData,
                    userId = userId
                });

                // Confirm to sender
                await Clients.Caller.SendAsync("AnnotationConfirmed", new
                {
                    annotationId = annotation.AnnotationId,
                    status = "created"
                });

                _logger.LogInformation("NOOR-ANNOTATION-HUB: Successfully broadcast annotation {AnnotationId} from user {UserId}",
                    annotation.AnnotationId, userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NOOR-ANNOTATION-HUB: Error broadcasting annotation from user {UserId} in session {SessionId}",
                    userId, sessionId);
                await Clients.Caller.SendAsync("Error", new { message = "Failed to create annotation" });
            }
        }

        /// <summary>
        /// Broadcast annotation update to all session participants.
        /// </summary>
        /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
        public async Task BroadcastAnnotationUpdate(long sessionId, long annotationId, string userId, object annotationData)
        {
            try
            {
                _logger.LogInformation("NOOR-ANNOTATION-HUB: Broadcasting annotation update {AnnotationId} from user {UserId} in session {SessionId}",
                    annotationId, userId, sessionId);

                // Update the annotation in database
                var success = await _annotationService.UpdateAnnotationAsync(annotationId, userId, annotationData);

                if (success)
                {
                    // Broadcast to all session participants except the sender
                    var groupName = $"Session_{sessionId}";
                    await Clients.OthersInGroup(groupName).SendAsync("AnnotationUpdated", new
                    {
                        annotationId = annotationId,
                        sessionId = sessionId,
                        annotationData = annotationData,
                        updatedBy = userId,
                        updatedAt = DateTime.UtcNow
                    });

                    // Confirm to sender
                    await Clients.Caller.SendAsync("AnnotationConfirmed", new
                    {
                        annotationId = annotationId,
                        status = "updated"
                    });

                    _logger.LogInformation("NOOR-ANNOTATION-HUB: Successfully broadcast annotation update {AnnotationId}", annotationId);
                }
                else
                {
                    await Clients.Caller.SendAsync("Error", new { message = "Failed to update annotation - not found or access denied" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NOOR-ANNOTATION-HUB: Error broadcasting annotation update {AnnotationId} from user {UserId}",
                    annotationId, userId);
                await Clients.Caller.SendAsync("Error", new { message = "Failed to update annotation" });
            }
        }

        /// <summary>
        /// Broadcast annotation deletion to all session participants.
        /// </summary>
        /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
        public async Task BroadcastAnnotationDeletion(long sessionId, long annotationId, string userId)
        {
            try
            {
                _logger.LogInformation("NOOR-ANNOTATION-HUB: Broadcasting annotation deletion {AnnotationId} from user {UserId} in session {SessionId}",
                    annotationId, userId, sessionId);

                // Delete the annotation from database
                var success = await _annotationService.DeleteAnnotationAsync(annotationId, userId);

                if (success)
                {
                    // Broadcast to all session participants except the sender
                    var groupName = $"Session_{sessionId}";
                    await Clients.OthersInGroup(groupName).SendAsync("AnnotationDeleted", new
                    {
                        annotationId = annotationId,
                        sessionId = sessionId,
                        deletedBy = userId,
                        deletedAt = DateTime.UtcNow
                    });

                    // Confirm to sender
                    await Clients.Caller.SendAsync("AnnotationConfirmed", new
                    {
                        annotationId = annotationId,
                        status = "deleted"
                    });

                    _logger.LogInformation("NOOR-ANNOTATION-HUB: Successfully broadcast annotation deletion {AnnotationId}", annotationId);
                }
                else
                {
                    await Clients.Caller.SendAsync("Error", new { message = "Failed to delete annotation - not found or access denied" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NOOR-ANNOTATION-HUB: Error broadcasting annotation deletion {AnnotationId} from user {UserId}",
                    annotationId, userId);
                await Clients.Caller.SendAsync("Error", new { message = "Failed to delete annotation" });
            }
        }

        /// <summary>
        /// Broadcast session annotation clear to all participants.
        /// </summary>
        /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
        public async Task BroadcastClearAnnotations(long sessionId, string userId)
        {
            try
            {
                _logger.LogInformation("NOOR-ANNOTATION-HUB: Broadcasting annotation clear from user {UserId} in session {SessionId}",
                    userId, sessionId);

                // Clear user's annotations from database
                await _annotationService.ClearSessionAnnotationsAsync(sessionId, userId);

                // Broadcast to all session participants
                var groupName = $"Session_{sessionId}";
                await Clients.Group(groupName).SendAsync("AnnotationsCleared", new
                {
                    sessionId = sessionId,
                    clearedBy = userId,
                    clearedAt = DateTime.UtcNow
                });

                _logger.LogInformation("NOOR-ANNOTATION-HUB: Successfully broadcast annotation clear for session {SessionId}", sessionId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NOOR-ANNOTATION-HUB: Error broadcasting annotation clear from user {UserId} in session {SessionId}",
                    userId, sessionId);
                await Clients.Caller.SendAsync("Error", new { message = "Failed to clear annotations" });
            }
        }
    }
}
