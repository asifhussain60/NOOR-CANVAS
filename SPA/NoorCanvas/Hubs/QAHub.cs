using Microsoft.AspNetCore.SignalR;
using NoorCanvas.Data;
using Microsoft.EntityFrameworkCore;

namespace NoorCanvas.Hubs;

public class QAHub : Hub
{
    private readonly ILogger<QAHub> _logger;
    private readonly CanvasDbContext _context;

    public QAHub(ILogger<QAHub> logger, CanvasDbContext context)
    {
        _logger = logger;
        _context = context;
    }

    public async Task JoinQASession(long sessionId)
    {
        var groupName = $"qa_session_{sessionId}";
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);

        _logger.LogInformation("NOOR-QA: User {ConnectionId} joined Q&A for session {SessionId}",
            Context.ConnectionId, sessionId);
    }

    public async Task AskQuestion(long sessionId, string questionText, Guid userId)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(questionText) || questionText.Length > 280)
            {
                await Clients.Caller.SendAsync("QuestionError", "Question must be 1-280 characters");
                return;
            }

            var groupName = $"qa_session_{sessionId}";

            // Create question (placeholder - would normally save to DB)
            var question = new
            {
                questionId = DateTime.UtcNow.Ticks, // Temporary ID
                sessionId = sessionId,
                userId = userId,
                questionText = questionText,
                queuedAt = DateTime.UtcNow,
                voteCount = 0,
                status = "Queued"
            };

            _logger.LogInformation("NOOR-QA: Question submitted for session {SessionId}: {Question}",
                sessionId, questionText.Substring(0, Math.Min(50, questionText.Length)));

            // Broadcast to Q&A group
            await Clients.Group(groupName).SendAsync("QuestionQueued", question);

            // Confirm to sender
            await Clients.Caller.SendAsync("QuestionSubmitted", new { success = true, questionId = question.questionId });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "NOOR-QA: Error submitting question for session {SessionId}", sessionId);
            await Clients.Caller.SendAsync("QuestionError", "Failed to submit question");
        }
    }

    public async Task Vote(long questionId, Guid userId, int voteValue)
    {
        try
        {
            if (voteValue != 0 && voteValue != 1)
            {
                await Clients.Caller.SendAsync("VoteError", "Vote value must be 0 or 1");
                return;
            }

            // Placeholder logic - would normally update database and get session info
            var sessionId = 1L; // Would get this from question lookup
            var groupName = $"qa_session_{sessionId}";

            _logger.LogInformation("NOOR-QA: Vote cast on question {QuestionId} by user {UserId}: {Vote}",
                questionId, userId, voteValue);

            // Broadcast vote update
            await Clients.Group(groupName).SendAsync("QuestionVoteUpdated", new
            {
                questionId = questionId,
                voteCount = 5, // Placeholder - would calculate from DB
                timestamp = DateTime.UtcNow
            });

            await Clients.Caller.SendAsync("VoteSubmitted", new { success = true, questionId = questionId });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "NOOR-QA: Error processing vote for question {QuestionId}", questionId);
            await Clients.Caller.SendAsync("VoteError", "Failed to process vote");
        }
    }

    /// <inheritdoc/>
    public override async Task OnConnectedAsync()
    {
        _logger.LogDebug("NOOR-QA: Connection established: {ConnectionId}", Context.ConnectionId);
        await base.OnConnectedAsync();
    }

    /// <inheritdoc/>
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        if (exception != null)
        {
            _logger.LogWarning(exception, "NOOR-QA: Connection {ConnectionId} disconnected with error", Context.ConnectionId);
        }
        else
        {
            _logger.LogDebug("NOOR-QA: Connection {ConnectionId} disconnected normally", Context.ConnectionId);
        }

        await base.OnDisconnectedAsync(exception);
    }
}
