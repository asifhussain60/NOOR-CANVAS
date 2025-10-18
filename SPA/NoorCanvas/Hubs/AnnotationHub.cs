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
        public async Task JoinSession(int sessionId, string userId)
        {
            try
            {
                _logger.LogInformation("[TRACE-ANNOTATION:join] User {UserId} joining session {SessionId} - ConnectionId: {ConnectionId} ;CLEANUP_OK",
                    userId, sessionId, Context.ConnectionId);

                var groupName = $"Session_{sessionId}";
                
                _logger.LogInformation("[TRACE-ANNOTATION:join] Adding connection to group {GroupName} ;CLEANUP_OK", groupName);
                await Groups.AddToGroupAsync(Context.ConnectionId, groupName);

                // Send current annotations to the newly joined user
                _logger.LogInformation("[TRACE-ANNOTATION:join] Loading annotations for session {SessionId} ;CLEANUP_OK", sessionId);
                var annotations = await _annotationService.GetSessionAnnotationsAsync(sessionId);
                _logger.LogInformation("[TRACE-ANNOTATION:join] Found annotations for session {SessionId} ;CLEANUP_OK", sessionId);
                
                await Clients.Caller.SendAsync("LoadAnnotations", annotations);

                // Notify others in the session about the new user
                await Clients.OthersInGroup(groupName).SendAsync("UserJoined", new { userId, connectionId = Context.ConnectionId });

                _logger.LogInformation("[TRACE-ANNOTATION:join] User {UserId} successfully joined session {SessionId} ;CLEANUP_OK", userId, sessionId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[TRACE-ANNOTATION:join] Error joining session {SessionId} for user {UserId} ;CLEANUP_OK", sessionId, userId);
                await Clients.Caller.SendAsync("Error", new { message = "Failed to join session for annotations" });
            }
        }

        /// <summary>
        /// Leave a session group.
        /// </summary>
        /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
        public async Task LeaveSession(int sessionId, string userId)
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
        public async Task BroadcastAnnotation(int sessionId, string userId, object annotationData)
        {
            try
            {
                _logger.LogInformation("[TRACE-ANNOTATION:hub-receive] Broadcasting annotation from user {UserId} in session {SessionId} ;CLEANUP_OK",
                    userId, sessionId);
                _logger.LogInformation("NOOR-ANNOTATION-HUB: Broadcasting annotation from user {UserId} in session {SessionId}",
                    userId, sessionId);

                _logger.LogInformation("[TRACE-ANNOTATION:db-save] Saving annotation to database ;CLEANUP_OK");
                // Save the annotation to database
                var annotation = await _annotationService.CreateAnnotationAsync(sessionId, userId, annotationData);
                _logger.LogInformation("[TRACE-ANNOTATION:db-saved] Annotation saved with ID {AnnotationId} ;CLEANUP_OK", annotation.AnnotationId);

                // Broadcast to all session participants except the sender
                var groupName = $"Session_{sessionId}";
                _logger.LogInformation("[TRACE-ANNOTATION:signalr-broadcast] Sending to group {GroupName} ;CLEANUP_OK", groupName);
                await Clients.OthersInGroup(groupName).SendAsync("AnnotationCreated", new
                {
                    annotationId = annotation.AnnotationId,
                    sessionId = annotation.SessionId,
                    createdBy = annotation.CreatedBy,
                    createdAt = annotation.CreatedAt,
                    annotationData = annotation.AnnotationData,
                    userId = userId
                });
                _logger.LogInformation("[TRACE-ANNOTATION:signalr-sent] Successfully broadcast to others in group ;CLEANUP_OK");

                // Confirm to sender
                _logger.LogInformation("[TRACE-ANNOTATION:confirm-sender] Sending confirmation to caller ;CLEANUP_OK");
                await Clients.Caller.SendAsync("AnnotationConfirmed", new
                {
                    annotationId = annotation.AnnotationId,
                    status = "created"
                });
                _logger.LogInformation("[TRACE-ANNOTATION:complete] Annotation broadcast complete ;CLEANUP_OK");

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
        public async Task BroadcastAnnotationUpdate(int sessionId, long annotationId, string userId, object annotationData)
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
        public async Task BroadcastAnnotationDeletion(int sessionId, long annotationId, string userId)
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
        public async Task BroadcastClearAnnotations(int sessionId, string userId)
        {
            try
            {
                _logger.LogInformation("[TRACE-ANNOTATION:clear-request] User {UserId} requesting clear for session {SessionId} ;CLEANUP_OK",
                    userId, sessionId);
                _logger.LogInformation("NOOR-ANNOTATION-HUB: Broadcasting annotation clear from user {UserId} in session {SessionId}",
                    userId, sessionId);

                // Clear user's annotations from database
                _logger.LogInformation("[TRACE-ANNOTATION:clear-db] Clearing annotations from database ;CLEANUP_OK");
                await _annotationService.ClearSessionAnnotationsAsync(sessionId, userId);

                // Broadcast to all session participants
                var groupName = $"Session_{sessionId}";
                _logger.LogInformation("[TRACE-ANNOTATION:clear-broadcast] Broadcasting to group {GroupName} ;CLEANUP_OK", groupName);
                await Clients.Group(groupName).SendAsync("AnnotationsCleared", new
                {
                    sessionId = sessionId,
                    clearedBy = userId,
                    clearedAt = DateTime.UtcNow
                });

                _logger.LogInformation("[TRACE-ANNOTATION:clear-complete] Successfully broadcast annotation clear for session {SessionId} ;CLEANUP_OK", sessionId);
                _logger.LogInformation("NOOR-ANNOTATION-HUB: Successfully broadcast annotation clear for session {SessionId}", sessionId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[TRACE-ANNOTATION:clear-error] Error broadcasting annotation clear from user {UserId} in session {SessionId} ;CLEANUP_OK",
                    userId, sessionId);
                _logger.LogError(ex, "NOOR-ANNOTATION-HUB: Error broadcasting annotation clear from user {UserId} in session {SessionId}",
                    userId, sessionId);
                await Clients.Caller.SendAsync("Error", new { message = "Failed to clear annotations" });
            }
        }

        /// <summary>
        /// Broadcast laser pointer position to all session participants (non-persistent, real-time only).
        /// </summary>
        /// <param name="sessionId">The session ID.</param>
        /// <param name="userId">The user ID.</param>
        /// <param name="position">The laser pointer position data.</param>
        /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
        public async Task BroadcastLaserPointer(int sessionId, string userId, object position)
        {
            try
            {
                _logger.LogInformation("[TRACE-ANNOTATION:laser] Broadcasting laser from user {UserId} in session {SessionId}, position: {Position} ;CLEANUP_OK",
                    userId, sessionId, position);
                
                // Broadcast to all session participants except the sender
                var groupName = $"Session_{sessionId}";
                _logger.LogInformation("[TRACE-ANNOTATION:laser] Sending to group {GroupName} ;CLEANUP_OK", groupName);
                
                await Clients.OthersInGroup(groupName).SendAsync("LaserPointerMove", position);
                
                _logger.LogInformation("[TRACE-ANNOTATION:laser] Successfully broadcast laser pointer ;CLEANUP_OK");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[TRACE-ANNOTATION:laser] Error broadcasting laser pointer from user {UserId} in session {SessionId} ;CLEANUP_OK",
                    userId, sessionId);
            }
        }

        /// <summary>
        /// Broadcast laser pointer hide to all session participants.
        /// </summary>
        /// <param name="sessionId">The session ID.</param>
        /// <param name="userId">The user ID.</param>
        /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
        public async Task HideLaserPointer(int sessionId, string userId)
        {
            try
            {
                _logger.LogInformation("[TRACE-ANNOTATION:laser-hide] Hiding laser from user {UserId} in session {SessionId} ;CLEANUP_OK",
                    userId, sessionId);
                    
                var groupName = $"Session_{sessionId}";
                await Clients.OthersInGroup(groupName).SendAsync("LaserPointerHide");
                
                _logger.LogInformation("[TRACE-ANNOTATION:laser-hide] Successfully broadcast laser hide ;CLEANUP_OK");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[TRACE-ANNOTATION:laser-hide] Error broadcasting laser pointer hide from user {UserId} in session {SessionId} ;CLEANUP_OK",
                    userId, sessionId);
            }
        }
    }
}
