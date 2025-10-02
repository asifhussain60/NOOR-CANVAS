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
    /// <summary>
    /// Handles Q&A functionality including question submission, voting, and session management.
    /// </summary>
    public class QuestionController : ControllerBase
    {
        private readonly SimplifiedCanvasDbContext _context;
        private readonly ILogger<QuestionController> _logger;
        private readonly SimplifiedTokenService _tokenService;
        private readonly IHubContext<SessionHub> _sessionHub;

        /// <summary>
        /// Initializes a new instance of the <see cref="QuestionController"/> class.
        /// </summary>
        /// <param name="context">The database context.</param>
        /// <param name="logger">The logger instance.</param>
        /// <param name="tokenService">The token validation service.</param>
        /// <param name="sessionHub">The SignalR hub context for real-time communication.</param>
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
        /// Helper method to safely convert JsonElement to int.
        /// </summary>
        private static int GetIntFromJsonElement(object jsonElement)
        {
            if (jsonElement is JsonElement element)
            {
                return element.TryGetInt32(out var value) ? value : 0;
            }
            return Convert.ToInt32(jsonElement);
        }

        /// <summary>
        /// Helper method to safely convert JsonElement to bool.
        /// </summary>
        private static bool GetBoolFromJsonElement(object jsonElement)
        {
            if (jsonElement is JsonElement element)
            {
                if (element.ValueKind == JsonValueKind.True) return true;
                if (element.ValueKind == JsonValueKind.False) return false;
                // Try to parse as string if it's a string representation
                if (element.ValueKind == JsonValueKind.String)
                {
                    return bool.TryParse(element.GetString(), out var boolResult) ? boolResult : false;
                }
                return false;
            }
            return Convert.ToBoolean(jsonElement);
        }

        /// <summary>
        /// Submit a new question to a session using user token authorization.
        /// </summary>
        /// <param name="request">The question submission request containing session token, question text, and user GUID.</param>
        /// <returns>The result of the question submission operation.</returns>
        [HttpPost("submit")]
        public async Task<IActionResult> SubmitQuestion([FromBody] SubmitQuestionRequest request)
        {
            var requestId = Guid.NewGuid().ToString("N")[..8];
            var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";

            // Process question submission request

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

                // Find session by user token - accept both Active and Configured sessions
                var session = await _context.Sessions
                    .FirstOrDefaultAsync(s => s.UserToken == request.SessionToken &&
                                            (s.Status == "Active" || s.Status == "Configured"));

                if (session == null)
                {
                    _logger.LogWarning("NOOR-QA-SUBMIT: [{RequestId}] Session not found or inactive for token: {Token}",
                        requestId, request.SessionToken);
                    return NotFound(new { Error = "Session not found or inactive", RequestId = requestId });
                }

                _logger.LogInformation("NOOR-QA-SUBMIT: [{RequestId}] Session found - SessionId: {SessionId}, Status: {Status}",
                    requestId, session.SessionId, session.Status);

                // Check if user is registered for this session
                _logger.LogTrace("NOOR-QA-SUBMIT-TRACE: [{RequestId}] Looking up participant: SessionId={SessionId}, UserGuid='{UserGuid}'", 
                    requestId, session.SessionId, request.UserGuid ?? "NULL");
                    
                var participant = await _context.Participants
                    .FirstOrDefaultAsync(p => p.SessionId == session.SessionId && p.UserGuid == request.UserGuid);

                if (participant == null)
                {
                    _logger.LogWarning("NOOR-QA-SUBMIT: [{RequestId}] User not registered for session: {UserGuid}",
                        requestId, request.UserGuid);
                    return Unauthorized(new { Error = "User not registered for this session", RequestId = requestId });
                }
                
                _logger.LogTrace("NOOR-QA-SUBMIT-TRACE: [{RequestId}] Found participant: ParticipantId={ParticipantId}, Name='{Name}', UserGuid='{UserGuid}'", 
                    requestId, participant.ParticipantId, participant.Name ?? "NULL", participant.UserGuid ?? "NULL");

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
                
                _logger.LogTrace("NOOR-QA-SUBMIT-TRACE: [{RequestId}] Created question data: QuestionId={QuestionId}, UserName='{UserName}', UserId='{UserId}', Text='{Text}'", 
                    requestId, questionData.questionId, questionData.userName, questionData.userId ?? "NULL", 
                    request.QuestionText?.Substring(0, Math.Min(50, request.QuestionText?.Length ?? 0)));
                
                var jsonContent = JsonSerializer.Serialize(questionData);
                _logger.LogTrace("NOOR-QA-SUBMIT-TRACE: [{RequestId}] Serialized JSON: {JsonContent}", requestId, jsonContent);

                // Store in SessionData table
                var sessionData = new NoorCanvas.Models.Simplified.SessionData
                {
                    SessionId = session.SessionId,
                    DataType = SessionDataTypes.Question,
                    Content = jsonContent,
                    CreatedBy = participant.UserGuid,
                    CreatedAt = DateTime.UtcNow
                };
                
                _logger.LogTrace("NOOR-QA-SUBMIT-TRACE: [{RequestId}] Creating SessionData: SessionId={SessionId}, CreatedBy='{CreatedBy}', DataType='{DataType}'", 
                    requestId, sessionData.SessionId, sessionData.CreatedBy ?? "NULL", sessionData.DataType);

                _context.SessionData.Add(sessionData);
                await _context.SaveChangesAsync();

                _logger.LogInformation("NOOR-QA-SUBMIT: [{RequestId}] Question saved successfully, DataId: {DataId}",
                    requestId, sessionData.DataId);

                // Question saved to database successfully

                // Broadcast via SignalR to all session participants
                var sessionGroup = $"session_{session.SessionId}";
                var hostGroup = $"Host_{session.SessionId}";

                // Broadcast via SignalR to all session participants
                try
                {
                    await _sessionHub.Clients.Group(sessionGroup)
                        .SendAsync("QuestionReceived", questionData);

                    // Special notification for hosts
                    await _sessionHub.Clients.Group(hostGroup)
                        .SendAsync("HostQuestionAlert", questionData);
                }
                catch (Exception signalREx)
                {
                    _logger.LogError(signalREx, "SignalR broadcast failed: {Error}", signalREx.Message);
                    // Continue execution - don't fail the API call if SignalR fails
                }

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
        /// Vote on a question using user token authorization.
        /// </summary>
        /// <param name="questionId">The ID of the question to vote on.</param>
        /// <param name="request">The vote request containing session token, direction, and user GUID.</param>
        /// <returns>The result of the vote operation.</returns>
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

                // Find session by user token - accept both Active and Configured sessions
                var session = await _context.Sessions
                    .FirstOrDefaultAsync(s => s.UserToken == request.SessionToken &&
                                            (s.Status == "Active" || s.Status == "Configured"));

                if (session == null)
                {
                    return NotFound(new { Error = "Session not found or inactive", RequestId = requestId });
                }

                _logger.LogInformation("NOOR-QA-VOTE: [{RequestId}] Session found - SessionId: {SessionId}, Status: {Status}",
                    requestId, session.SessionId, session.Status);

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
        /// Get all questions for a session using user token authorization.
        /// </summary>
        /// <param name="sessionToken">The session token for authentication and session identification.</param>
        /// <returns>The list of questions for the specified session.</returns>
        [HttpGet("session/{sessionToken}")]
        public async Task<IActionResult> GetQuestions(string sessionToken)
        {
            var requestId = Guid.NewGuid().ToString("N")[..8];

            _logger.LogInformation("NOOR-QA-GET: [{RequestId}] Questions retrieval started for token: {Token}",
                requestId, sessionToken);
            _logger.LogTrace("NOOR-QA-TRACE: [{RequestId}] Starting detailed trace for GetQuestions method", requestId);

            try
            {
                // Validate token format
                if (string.IsNullOrWhiteSpace(sessionToken) || sessionToken.Length != 8)
                {
                    return BadRequest(new { Error = "Invalid session token format", RequestId = requestId });
                }

                // Find session by user token or host token
                _logger.LogTrace("NOOR-QA-TRACE: [{RequestId}] Looking up session with token: '{Token}'", requestId, sessionToken);
                var session = await _context.Sessions
                    .FirstOrDefaultAsync(s => s.UserToken == sessionToken || s.HostToken == sessionToken);

                if (session == null)
                {
                    _logger.LogWarning("NOOR-QA-TRACE: [{RequestId}] Session not found for token: '{Token}' (tried both UserToken and HostToken)", requestId, sessionToken);
                    return NotFound(new { Error = "Session not found", RequestId = requestId });
                }

                var tokenType = session.UserToken == sessionToken ? "UserToken" : "HostToken";
                _logger.LogInformation("NOOR-QA-TRACE: [{RequestId}] Session found via {TokenType}: SessionId={SessionId}, Status={Status}", 
                    requestId, tokenType, session.SessionId, session.Status ?? "NULL");

                // Get all questions for this session
                _logger.LogTrace("NOOR-QA-TRACE: [{RequestId}] Querying questions for SessionId={SessionId}", requestId, session.SessionId);
                var questions = await _context.SessionData
                    .Where(sd => sd.SessionId == session.SessionId && sd.DataType == SessionDataTypes.Question)
                    .OrderBy(sd => sd.CreatedAt)
                    .Select(q => new
                    {
                        q.DataId,
                        q.CreatedAt,
                        q.Content,
                        q.CreatedBy
                    })
                    .ToListAsync();

                _logger.LogTrace("NOOR-QA-TRACE: [{RequestId}] Found {QuestionCount} questions", requestId, questions.Count);
                
                // Build a lookup dictionary of participants for this session for efficient name resolution
                _logger.LogTrace("NOOR-QA-TRACE: [{RequestId}] Building participant lookup for SessionId={SessionId}", requestId, session.SessionId);
                var participantLookup = await _context.Participants
                    .Where(p => p.SessionId == session.SessionId && p.UserGuid != null)
                    .ToDictionaryAsync(p => p.UserGuid!, p => p.Name ?? "Anonymous");

                _logger.LogTrace("NOOR-QA-TRACE: [{RequestId}] Built participant lookup with {Count} entries: {Participants}", 
                    requestId, participantLookup.Count, 
                    string.Join(", ", participantLookup.Select(kv => $"'{kv.Key}' -> '{kv.Value}'"))); 

                var questionList = questions.Select(q =>
                {
                    _logger.LogTrace("NOOR-QA-TRACE: [{RequestId}] Processing question DataId={DataId}, CreatedBy='{CreatedBy}', ContentLength={ContentLength}", 
                        requestId, q.DataId, q.CreatedBy ?? "NULL", q.Content?.Length ?? 0);
                    
                    var data = string.IsNullOrWhiteSpace(q.Content) ? null :
                        JsonSerializer.Deserialize<Dictionary<string, object>>(q.Content);

                    _logger.LogTrace("NOOR-QA-TRACE: [{RequestId}] DataId={DataId} - JSON parsed successfully: {HasData}, Keys: [{Keys}]", 
                        requestId, q.DataId, data != null, 
                        data != null ? string.Join(", ", data.Keys) : "NONE");

                    // Extract userName from JSON, fallback to looking up participant by CreatedBy
                    var userNameFromJson = data?.ContainsKey("userName") == true ? data["userName"]?.ToString() : null;
                    
                    _logger.LogTrace("NOOR-QA-TRACE: [{RequestId}] DataId={DataId} - UserName from JSON: '{UserNameFromJson}' (IsNull={IsNull}, IsEmpty={IsEmpty})", 
                        requestId, q.DataId, userNameFromJson ?? "NULL", userNameFromJson == null, string.IsNullOrWhiteSpace(userNameFromJson));
                    
                    // If userName from JSON is empty/null/Anonymous, try to look up participant name from database
                    var finalUserName = userNameFromJson;
                    if (string.IsNullOrWhiteSpace(userNameFromJson) || userNameFromJson == "Anonymous")
                    {
                        var createdBy = q.CreatedBy ?? "";
                        _logger.LogTrace("NOOR-QA-TRACE: [{RequestId}] DataId={DataId} - Attempting participant lookup for CreatedBy='{CreatedBy}'", 
                            requestId, q.DataId, createdBy);
                            
                        if (participantLookup.TryGetValue(createdBy, out var participantName))
                        {
                            finalUserName = participantName;
                            _logger.LogInformation("NOOR-QA-RESOLVE: [{RequestId}] DataId={DataId} - Resolved participant name '{ParticipantName}' for CreatedBy='{CreatedBy}'", 
                                requestId, q.DataId, participantName, createdBy);
                        }
                        else
                        {
                            _logger.LogWarning("NOOR-QA-RESOLVE: [{RequestId}] DataId={DataId} - Could not resolve participant name for CreatedBy='{CreatedBy}'. Available participants: [{Available}]", 
                                requestId, q.DataId, createdBy, string.Join(", ", participantLookup.Keys));
                            finalUserName = "Anonymous";
                        }
                    }
                    else
                    {
                        _logger.LogTrace("NOOR-QA-TRACE: [{RequestId}] DataId={DataId} - Using userName from JSON: '{UserNameFromJson}'", 
                            requestId, q.DataId, userNameFromJson);
                    }
                    
                    // Debug logging to trace the userName extraction
                    _logger.LogInformation("NOOR-QA-DEBUG: [{RequestId}] DataId={DataId}, UserNameFromJson='{UserNameFromJson}', FinalUserName='{FinalUserName}', CreatedBy='{CreatedBy}'", 
                        requestId, q.DataId, userNameFromJson ?? "null", finalUserName ?? "null", q.CreatedBy ?? "null");

                    var questionObj = new
                    {
                        QuestionId = data?.ContainsKey("questionId") == true ? data["questionId"]?.ToString() : "",
                        Id = q.DataId,
                        Text = data?.ContainsKey("text") == true ? data["text"]?.ToString() : "",
                        UserName = finalUserName ?? "Anonymous",
                        CreatedBy = q.CreatedBy ?? "", // Include the CreatedBy field for ownership checking
                        Votes = data?.ContainsKey("votes") == true ? GetIntFromJsonElement(data["votes"]) : 0,
                        IsAnswered = data?.ContainsKey("isAnswered") == true ? GetBoolFromJsonElement(data["isAnswered"]) : false,
                        CreatedAt = q.CreatedAt,
                        SubmittedAt = q.CreatedAt
                    };
                    
                    _logger.LogTrace("NOOR-QA-TRACE: [{RequestId}] DataId={DataId} - Final question object: QuestionId='{QuestionId}', Text='{Text}', UserName='{UserName}'", 
                        requestId, q.DataId, questionObj.QuestionId, questionObj.Text, questionObj.UserName);
                    
                    return questionObj;
                }).ToList();

                _logger.LogInformation("NOOR-QA-GET: [{RequestId}] Retrieved {Count} questions", requestId, questionList.Count);
                _logger.LogTrace("NOOR-QA-TRACE: [{RequestId}] Questions summary: [{Questions}]", requestId, 
                    string.Join(", ", questionList.Select(q => $"DataId={q.Id},UserName='{q.UserName}',Text='{q.Text?.Substring(0, Math.Min(20, q.Text?.Length ?? 0))}...'")));

                var response = new
                {
                    Success = true,
                    Questions = questionList,
                    Count = questionList.Count,
                    RequestId = requestId
                };
                
                _logger.LogTrace("NOOR-QA-TRACE: [{RequestId}] Returning response with {Count} questions", requestId, questionList.Count);
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NOOR-QA-GET: [{RequestId}] Failed to retrieve questions", requestId);
                return StatusCode(500, new { Error = "Failed to retrieve questions", RequestId = requestId });
            }
        }

        /// <summary>
        /// Delete a question (only the user who created it can delete).
        /// </summary>
        /// <param name="questionId">The ID of the question to delete.</param>
        /// <param name="request">The delete request containing session token and user GUID.</param>
        /// <returns>The result of the delete operation.</returns>
        [HttpPost("{questionId}/delete")]
        public async Task<IActionResult> DeleteQuestion(int questionId, [FromBody] DeleteQuestionRequest request)
        {
            var requestId = Guid.NewGuid().ToString("N")[..8];
            var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";

            _logger.LogInformation("NOOR-QA-DELETE: [{RequestId}] Question deletion started for QuestionId: {QuestionId}",
                requestId, questionId);

            try
            {
                // Validate request
                if (string.IsNullOrWhiteSpace(request.SessionToken) || request.SessionToken.Length != 8)
                {
                    _logger.LogWarning("NOOR-QA-DELETE: [{RequestId}] Invalid session token format", requestId);
                    return BadRequest(new { Error = "Invalid session token format", RequestId = requestId });
                }

                if (string.IsNullOrWhiteSpace(request.UserGuid))
                {
                    _logger.LogWarning("NOOR-QA-DELETE: [{RequestId}] UserGuid is required for question deletion", requestId);
                    return BadRequest(new { Error = "UserGuid is required", RequestId = requestId });
                }

                // Validate session token
                var session = await _tokenService.ValidateTokenAsync(request.SessionToken, isHostToken: false);
                if (session == null)
                {
                    _logger.LogWarning("NOOR-QA-DELETE: [{RequestId}] Invalid session token: {Token}", requestId, request.SessionToken);
                    return NotFound(new { Error = "Invalid session token", RequestId = requestId });
                }

                _logger.LogInformation("NOOR-QA-DELETE: [{RequestId}] Session validated - SessionId: {SessionId}",
                    requestId, session.SessionId);

                // Find the question and verify ownership
                var questionRecord = await _context.SessionData
                    .FirstOrDefaultAsync(sd => sd.SessionId == session.SessionId &&
                                             sd.DataType == SessionDataTypes.Question &&
                                             sd.Content != null &&
                                             sd.Content.Contains($"\"questionId\":\"{questionId}\"") &&
                                             sd.CreatedBy == request.UserGuid);

                if (questionRecord == null)
                {
                    _logger.LogWarning("NOOR-QA-DELETE: [{RequestId}] Question not found or user not authorized - QuestionId: {QuestionId}, UserGuid: {UserGuid}",
                        requestId, questionId, request.UserGuid);
                    return NotFound(new { Error = "Question not found or you are not authorized to delete it", RequestId = requestId });
                }

                _logger.LogInformation("NOOR-QA-DELETE: [{RequestId}] Question found and ownership verified - Content: {Content}",
                    requestId, questionRecord.Content);

                // Delete the question
                _context.SessionData.Remove(questionRecord);
                await _context.SaveChangesAsync();

                _logger.LogInformation("NOOR-QA-DELETE: [{RequestId}] Question deleted successfully from database", requestId);

                // Notify all clients in the session via SignalR
                await _sessionHub.Clients.Group($"Session_{session.SessionId}")
                    .SendAsync("QuestionDeleted", new { QuestionId = questionId, SessionId = session.SessionId });

                _logger.LogInformation("NOOR-QA-DELETE: [{RequestId}] SignalR notification sent to session group", requestId);

                return Ok(new DeleteQuestionResponse
                {
                    Success = true,
                    Message = "Question deleted successfully",
                    RequestId = requestId
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NOOR-QA-DELETE: [{RequestId}] Exception during question deletion", requestId);
                return StatusCode(500, new { Error = "Failed to delete question", RequestId = requestId });
            }
        }
    }

    // Request/Response Models

    /// <summary>
    /// Request model for submitting a new question to a session.
    /// </summary>
    public class SubmitQuestionRequest
    {
        /// <summary>
        /// Gets or sets the session token for authentication.
        /// </summary>
        public string SessionToken { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the text of the question to be submitted.
        /// </summary>
        public string QuestionText { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the unique identifier for the user submitting the question.
        /// </summary>
        public string UserGuid { get; set; } = string.Empty;
    }

    /// <summary>
    /// Request model for voting on a question.
    /// </summary>
    public class VoteQuestionRequest
    {
        /// <summary>
        /// Gets or sets the session token for authentication.
        /// </summary>
        public string SessionToken { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the direction of the vote (up or down).
        /// </summary>
        public string Direction { get; set; } = string.Empty; // "up" or "down"

        /// <summary>
        /// Gets or sets the unique identifier for the user casting the vote.
        /// </summary>
        public string UserGuid { get; set; } = string.Empty;
    }

    /// <summary>
    /// Request model for deleting a question.
    /// </summary>
    public class DeleteQuestionRequest
    {
        /// <summary>
        /// Gets or sets the session token for authentication.
        /// </summary>
        public string SessionToken { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the unique identifier for the user requesting deletion.
        /// </summary>
        public string UserGuid { get; set; } = string.Empty;
    }

    /// <summary>
    /// Response model for question submission operations.
    /// </summary>
    public class SubmitQuestionResponse
    {
        /// <summary>
        /// Gets or sets a value indicating whether the operation was successful.
        /// </summary>
        public bool Success { get; set; }

        /// <summary>
        /// Gets or sets the unique identifier of the submitted question.
        /// </summary>
        public Guid QuestionId { get; set; }

        /// <summary>
        /// Gets or sets the response message describing the operation result.
        /// </summary>
        public string Message { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the unique identifier for tracking this request.
        /// </summary>
        public string RequestId { get; set; } = string.Empty;
    }

    /// <summary>
    /// Response model for question deletion operations.
    /// </summary>
    public class DeleteQuestionResponse
    {
        /// <summary>
        /// Gets or sets a value indicating whether the deletion was successful.
        /// </summary>
        public bool Success { get; set; }

        /// <summary>
        /// Gets or sets the response message describing the deletion result.
        /// </summary>
        public string Message { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the unique identifier for tracking this request.
        /// </summary>
        public string RequestId { get; set; } = string.Empty;
    }
}