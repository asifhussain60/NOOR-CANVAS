using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using NoorCanvas.Data;
using NoorCanvas.Hubs;
using NoorCanvas.Services;
using NoorCanvas.Models.Simplified;
using System.Text.Json;

namespace NoorCanvas.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class QuestionController : ControllerBase
    {
        private readonly SimplifiedCanvasDbContext _context;
        private readonly ILogger<QuestionController> _logger;
        private readonly SimplifiedTokenService _tokenService;
        private readonly IHubContext<SessionHub> _sessionHub;

        public QuestionController(
            SimplifiedCanvasDbContext context,
            ILogger<QuestionController> logger,
            SimplifiedTokenService tokenService,
            IHubContext<SessionHub> sessionHub)
        {
            _context = context;
            _logger = logger;
            _tokenService = tokenService;
            _sessionHub = sessionHub;
        }

        /// <summary>
        /// Submit a new question to a session using user token authorization
        /// </summary>
        [HttpPost("submit")]
        public async Task<IActionResult> SubmitQuestion([FromBody] SubmitQuestionRequest request)
        {
            var requestId = Guid.NewGuid().ToString("N")[..8];
            var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";

            _logger.LogInformation("NOOR-QA-SUBMIT: [{RequestId}] Question submission started", requestId);
            _logger.LogInformation("NOOR-QA-SUBMIT: [{RequestId}] Token: {Token}, ClientIP: {ClientIp}", 
                requestId, request.SessionToken, clientIp);

            try
            {
                // Validate request
                if (string.IsNullOrWhiteSpace(request.SessionToken) || request.SessionToken.Length != 8)
                {
                    _logger.LogWarning("NOOR-QA-SUBMIT: [{RequestId}] Invalid token format", requestId);
                    return BadRequest(new { Error = "Invalid session token format", RequestId = requestId });
                }

                if (string.IsNullOrWhiteSpace(request.QuestionText))
                {
                    _logger.LogWarning("NOOR-QA-SUBMIT: [{RequestId}] Empty question text", requestId);
                    return BadRequest(new { Error = "Question text cannot be empty", RequestId = requestId });
                }

                // Find session by user token
                var session = await _context.Sessions
                    .FirstOrDefaultAsync(s => s.UserToken == request.SessionToken && s.Status == "Active");

                if (session == null)
                {
                    _logger.LogWarning("NOOR-QA-SUBMIT: [{RequestId}] Session not found or inactive for token: {Token}", 
                        requestId, request.SessionToken);
                    return NotFound(new { Error = "Session not found or inactive", RequestId = requestId });
                }

                // Check if user is registered for this session
                var participant = await _context.Participants
                    .FirstOrDefaultAsync(p => p.SessionId == session.SessionId && p.UserGuid == request.UserGuid);

                if (participant == null)
                {
                    _logger.LogWarning("NOOR-QA-SUBMIT: [{RequestId}] User not registered for session: {UserGuid}", 
                        requestId, request.UserGuid);
                    return Unauthorized(new { Error = "User not registered for this session", RequestId = requestId });
                }

                // Create question data
                var questionData = new
                {
                    questionId = Guid.NewGuid(),
                    text = request.QuestionText,
                    userName = participant.Name ?? "Anonymous",
                    userId = participant.UserGuid,
                    submittedAt = DateTime.UtcNow,
                    votes = 0,
                    isAnswered = false
                };

                // Store in SessionData table
                var sessionData = new NoorCanvas.Models.Simplified.SessionData
                {
                    SessionId = session.SessionId,
                    DataType = SessionDataTypes.Question,
                    Content = JsonSerializer.Serialize(questionData),
                    CreatedBy = participant.UserGuid,
                    CreatedAt = DateTime.UtcNow
                };

                _context.SessionData.Add(sessionData);
                await _context.SaveChangesAsync();

                _logger.LogInformation("NOOR-QA-SUBMIT: [{RequestId}] Question saved successfully, DataId: {DataId}", 
                    requestId, sessionData.DataId);

                // Broadcast via SignalR to all session participants
                await _sessionHub.Clients.Group($"Session_{session.SessionId}")
                    .SendAsync("QuestionReceived", questionData);

                // Special notification for hosts
                await _sessionHub.Clients.Group($"Host_{session.SessionId}")
                    .SendAsync("HostQuestionAlert", questionData);

                _logger.LogInformation("NOOR-QA-SUBMIT: [{RequestId}] SignalR notifications sent", requestId);

                var response = new SubmitQuestionResponse
                {
                    Success = true,
                    QuestionId = questionData.questionId,
                    Message = "Question submitted successfully",
                    RequestId = requestId
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NOOR-QA-SUBMIT: [{RequestId}] Failed to submit question", requestId);
                return StatusCode(500, new { Error = "Failed to submit question", RequestId = requestId });
            }
        }

        /// <summary>
        /// Vote on a question using user token authorization
        /// </summary>
        [HttpPost("{questionId}/vote")]
        public async Task<IActionResult> VoteQuestion(string questionId, [FromBody] VoteQuestionRequest request)
        {
            var requestId = Guid.NewGuid().ToString("N")[..8];
            
            _logger.LogInformation("NOOR-QA-VOTE: [{RequestId}] Vote submission started for question {QuestionId}", 
                requestId, questionId);

            try
            {
                // Validate request
                if (string.IsNullOrWhiteSpace(request.SessionToken) || request.SessionToken.Length != 8)
                {
                    return BadRequest(new { Error = "Invalid session token format", RequestId = requestId });
                }

                if (!new[] { "up", "down" }.Contains(request.Direction?.ToLower()))
                {
                    return BadRequest(new { Error = "Vote direction must be 'up' or 'down'", RequestId = requestId });
                }

                // Find session by user token
                var session = await _context.Sessions
                    .FirstOrDefaultAsync(s => s.UserToken == request.SessionToken && s.Status == "Active");

                if (session == null)
                {
                    return NotFound(new { Error = "Session not found or inactive", RequestId = requestId });
                }

                // Check if user is registered for this session
                var participant = await _context.Participants
                    .FirstOrDefaultAsync(p => p.SessionId == session.SessionId && p.UserGuid == request.UserGuid);

                if (participant == null)
                {
                    return Unauthorized(new { Error = "User not registered for this session", RequestId = requestId });
                }

                // Find the question
                var questionRecord = await _context.SessionData
                    .FirstOrDefaultAsync(sd => sd.SessionId == session.SessionId &&
                                             sd.DataType == SessionDataTypes.Question &&
                                             sd.Content != null && sd.Content.Contains($"\"questionId\":\"{questionId}\""));

                if (questionRecord == null)
                {
                    return NotFound(new { Error = "Question not found", RequestId = requestId });
                }

                // Check if user already voted on this question
                var existingVote = await _context.SessionData
                    .FirstOrDefaultAsync(sd => sd.DataType == SessionDataTypes.QuestionVote &&
                                             sd.Content != null && sd.Content.Contains($"\"questionId\":\"{questionId}\"") &&
                                             sd.Content.Contains($"\"userId\":\"{participant.UserGuid}\""));

                if (existingVote != null)
                {
                    return Conflict(new { Error = "User has already voted on this question", RequestId = requestId });
                }

                // Parse and update question votes
                var questionData = JsonSerializer.Deserialize<Dictionary<string, object>>(questionRecord.Content ?? "{}");
                if (questionData != null)
                {
                    var currentVotes = questionData.ContainsKey("votes") ?
                        Convert.ToInt32(questionData["votes"]) : 0;

                    var newVotes = request.Direction?.ToLower() == "up" ? currentVotes + 1 : currentVotes - 1;
                    questionData["votes"] = newVotes;

                    questionRecord.Content = JsonSerializer.Serialize(questionData);

                    // Record the vote
                    var voteRecord = new NoorCanvas.Models.Simplified.SessionData
                    {
                        SessionId = session.SessionId,
                        DataType = SessionDataTypes.QuestionVote,
                        Content = JsonSerializer.Serialize(new
                        {
                            questionId = questionId,
                            userId = participant.UserGuid,
                            direction = request.Direction
                        }),
                        CreatedBy = participant.UserGuid,
                        CreatedAt = DateTime.UtcNow
                    };

                    _context.SessionData.Add(voteRecord);
                    await _context.SaveChangesAsync();

                    // Broadcast vote update via SignalR
                    await _sessionHub.Clients.Group($"Session_{session.SessionId}")
                        .SendAsync("QuestionVoteUpdate", new { questionId, votes = newVotes });

                    // Notify hosts with toast
                    var questionText = questionData.ContainsKey("text") ? questionData["text"]?.ToString() : "Question";
                    await _sessionHub.Clients.Group($"Host_{session.SessionId}")
                        .SendAsync("VoteUpdateReceived", questionText, newVotes);

                    _logger.LogInformation("NOOR-QA-VOTE: [{RequestId}] Vote recorded successfully, new count: {VoteCount}", 
                        requestId, newVotes);

                    return Ok(new
                    {
                        Success = true,
                        NewVoteCount = newVotes,
                        RequestId = requestId
                    });
                }

                return StatusCode(500, new { Error = "Failed to process vote", RequestId = requestId });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NOOR-QA-VOTE: [{RequestId}] Failed to process vote", requestId);
                return StatusCode(500, new { Error = "Failed to process vote", RequestId = requestId });
            }
        }

        /// <summary>
        /// Get all questions for a session using user token authorization
        /// </summary>
        [HttpGet("session/{sessionToken}")]
        public async Task<IActionResult> GetQuestions(string sessionToken)
        {
            var requestId = Guid.NewGuid().ToString("N")[..8];
            
            _logger.LogInformation("NOOR-QA-GET: [{RequestId}] Questions retrieval started for token: {Token}", 
                requestId, sessionToken);

            try
            {
                // Validate token format
                if (string.IsNullOrWhiteSpace(sessionToken) || sessionToken.Length != 8)
                {
                    return BadRequest(new { Error = "Invalid session token format", RequestId = requestId });
                }

                // Find session by user token
                var session = await _context.Sessions
                    .FirstOrDefaultAsync(s => s.UserToken == sessionToken);

                if (session == null)
                {
                    return NotFound(new { Error = "Session not found", RequestId = requestId });
                }

                // Get all questions for this session
                var questions = await _context.SessionData
                    .Where(sd => sd.SessionId == session.SessionId && sd.DataType == SessionDataTypes.Question)
                    .OrderBy(sd => sd.CreatedAt)
                    .Select(q => new
                    {
                        q.DataId,
                        q.CreatedAt,
                        q.Content
                    })
                    .ToListAsync();

                var questionList = questions.Select(q => {
                    var data = string.IsNullOrWhiteSpace(q.Content) ? null : 
                        JsonSerializer.Deserialize<Dictionary<string, object>>(q.Content);
                    
                    return new
                    {
                        Id = q.DataId,
                        Text = data?.ContainsKey("text") == true ? data["text"]?.ToString() : "",
                        UserName = data?.ContainsKey("userName") == true ? data["userName"]?.ToString() : "Anonymous",
                        Votes = data?.ContainsKey("votes") == true ? Convert.ToInt32(data["votes"]) : 0,
                        IsAnswered = data?.ContainsKey("isAnswered") == true ? Convert.ToBoolean(data["isAnswered"]) : false,
                        SubmittedAt = q.CreatedAt
                    };
                }).ToList();

                _logger.LogInformation("NOOR-QA-GET: [{RequestId}] Retrieved {Count} questions", requestId, questionList.Count);

                return Ok(new
                {
                    Success = true,
                    Questions = questionList,
                    Count = questionList.Count,
                    RequestId = requestId
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NOOR-QA-GET: [{RequestId}] Failed to retrieve questions", requestId);
                return StatusCode(500, new { Error = "Failed to retrieve questions", RequestId = requestId });
            }
        }
    }

    // Request/Response Models
    public class SubmitQuestionRequest
    {
        public string SessionToken { get; set; } = string.Empty;
        public string QuestionText { get; set; } = string.Empty;
        public string UserGuid { get; set; } = string.Empty;
    }

    public class VoteQuestionRequest
    {
        public string SessionToken { get; set; } = string.Empty;
        public string Direction { get; set; } = string.Empty; // "up" or "down"
        public string UserGuid { get; set; } = string.Empty;
    }

    public class SubmitQuestionResponse
    {
        public bool Success { get; set; }
        public Guid QuestionId { get; set; }
        public string Message { get; set; } = string.Empty;
        public string RequestId { get; set; } = string.Empty;
    }
}