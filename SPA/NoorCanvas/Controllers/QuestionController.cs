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
                
                _logger.LogInformation("[DEBUG-WORKITEM:canvas-questions:ownership] Question created in API - QuestionId={QuestionId}, ParticipantName={ParticipantName}, UserId={UserId}, RequestUserGuid={RequestUserGuid} ;CLEANUP_OK",
                    questionData.questionId, questionData.userName, questionData.userId, request.UserGuid);
                
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
                    _logger.LogInformation("[DEBUG-WORKITEM:canvas-questions:ownership] Broadcasting QuestionReceived via SignalR - SessionGroup={SessionGroup}, QuestionId={QuestionId}, UserId={UserId} ;CLEANUP_OK",
                        sessionGroup, questionData.questionId, questionData.userId);
                    
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

            _logger.LogInformation("[DEBUG-WORKITEM:canvas-questions:upvote] ════════ API VOTE REQUEST RECEIVED ════════ QuestionId={QuestionId}, RequestId={RequestId}, SessionToken={SessionToken}, UserGuid={UserGuid}, Direction={Direction} ;CLEANUP_OK",
                questionId, requestId, request.SessionToken, request.UserGuid, request.Direction);

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
                
                _logger.LogInformation("[DEBUG-WORKITEM:canvas-questions:upvote] Database session lookup - SessionId={SessionId}, Status={Status} ;CLEANUP_OK",
                    session.SessionId, session.Status);

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
                    var currentVotes = 0;
                    if (questionData.ContainsKey("votes"))
                    {
                        var votesValue = questionData["votes"];
                        if (votesValue is JsonElement jsonElement)
                        {
                            currentVotes = jsonElement.ValueKind == JsonValueKind.Number
                                ? jsonElement.GetInt32()
                                : 0;
                        }
                        else
                        {
                            currentVotes = Convert.ToInt32(votesValue);
                        }
                    }

                    _logger.LogTrace("[DEBUG-WORKITEM:canvas-questions:upvote] Processing vote - QuestionId={QuestionId}, CurrentVotes={CurrentVotes}, Direction={Direction} ;CLEANUP_OK",
                        questionId, currentVotes, request.Direction);

                    var newVotes = request.Direction?.ToLower() == "up" ? currentVotes + 1 : currentVotes - 1;
                    questionData["votes"] = newVotes;

                    _logger.LogTrace("[DEBUG-WORKITEM:canvas-questions:upvote] Vote calculation - CurrentVotes={CurrentVotes}, NewVotes={NewVotes}, Direction={Direction} ;CLEANUP_OK",
                        currentVotes, newVotes, request.Direction);

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
                    
                    _logger.LogInformation("[DEBUG-WORKITEM:canvas-questions:upvote] Saving to database - OldVotes={OldVotes}, NewVotes={NewVotes} ;CLEANUP_OK",
                        currentVotes, newVotes);
                    
                    await _context.SaveChangesAsync();
                    
                    _logger.LogInformation("[DEBUG-WORKITEM:canvas-questions:upvote] ✅ DATABASE SAVE COMPLETE - QuestionId={QuestionId}, NewVotes={NewVotes} ;CLEANUP_OK",
                        questionId, newVotes);

                    // Broadcast vote update via SignalR
                    var sessionGroup = $"session_{session.SessionId}";
                    _logger.LogInformation("[DEBUG-WORKITEM:canvas-questions:upvote] ════════ BROADCASTING TO SIGNALR ════════ ;CLEANUP_OK");
                    _logger.LogInformation("[DEBUG-WORKITEM:canvas-questions:upvote] SignalR Group={Group}, Event=QuestionVoteUpdate, Payload={{questionId={QuestionId}, votes={Votes}}} ;CLEANUP_OK",
                        sessionGroup, questionId, newVotes);
                    
                    _logger.LogTrace("[DEBUG-WORKITEM:canvas-questions:upvote] Broadcasting vote update - SessionGroup=session_{SessionId}, QuestionId={QuestionId}, NewVotes={NewVotes} ;CLEANUP_OK",
                        session.SessionId, questionId, newVotes);
                    
                    await _sessionHub.Clients.Group(sessionGroup)
                        .SendAsync("QuestionVoteUpdate", new { questionId, votes = newVotes });

                    _logger.LogInformation("[DEBUG-WORKITEM:canvas-questions:upvote] ✅ SIGNALR BROADCAST SENT - Event=QuestionVoteUpdate, Group={Group} ;CLEANUP_OK",
                        sessionGroup);
                    
                    _logger.LogTrace("[DEBUG-WORKITEM:canvas-questions:upvote] Vote update broadcast complete - QuestionId={QuestionId}, Votes={Votes} ;CLEANUP_OK",
                        questionId, newVotes);

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
        /// Update a question's text (only the user who created it can update).
        /// </summary>
        /// <param name="questionId">The GUID of the question to update.</param>
        /// <param name="request">The update request containing session token, new question text, and user GUID.</param>
        /// <returns>The result of the update operation.</returns>
        [HttpPost("{questionId}/update")]
        public async Task<IActionResult> UpdateQuestion(string questionId, [FromBody] UpdateQuestionRequest request)
        {
            var requestId = Guid.NewGuid().ToString("N")[..8];
            _logger.LogInformation("[DEBUG-WORKITEM:canvas:update] [{RequestId}] Question update started for QuestionId: {QuestionId} ;CLEANUP_OK", requestId, questionId);

            try
            {
                // Validate request
                if (string.IsNullOrWhiteSpace(request.SessionToken) || request.SessionToken.Length != 8)
                {
                    _logger.LogWarning("[DEBUG-WORKITEM:canvas:update] [{RequestId}] Invalid session token format ;CLEANUP_OK", requestId);
                    return BadRequest(new { Error = "Invalid session token format", RequestId = requestId });
                }

                if (string.IsNullOrWhiteSpace(request.QuestionText))
                {
                    _logger.LogWarning("[DEBUG-WORKITEM:canvas:update] [{RequestId}] Question text cannot be empty ;CLEANUP_OK", requestId);
                    return BadRequest(new { Error = "Question text cannot be empty", RequestId = requestId });
                }

                if (string.IsNullOrWhiteSpace(request.UserGuid))
                {
                    _logger.LogWarning("[DEBUG-WORKITEM:canvas:update] [{RequestId}] UserGuid is required ;CLEANUP_OK", requestId);
                    return BadRequest(new { Error = "UserGuid is required", RequestId = requestId });
                }

                // Find session by user token
                var session = await _context.Sessions
                    .FirstOrDefaultAsync(s => s.UserToken == request.SessionToken &&
                                            (s.Status == "Active" || s.Status == "Configured"));

                if (session == null)
                {
                    _logger.LogWarning("[DEBUG-WORKITEM:canvas:update] [{RequestId}] Session not found ;CLEANUP_OK", requestId);
                    return NotFound(new { Error = "Session not found or inactive", RequestId = requestId });
                }

                _logger.LogInformation("[DEBUG-WORKITEM:canvas:update] [{RequestId}] Session found - SessionId: {SessionId} ;CLEANUP_OK", requestId, session.SessionId);

                // Find all questions for this session
                var allQuestions = await _context.SessionData
                    .Where(sd => sd.SessionId == session.SessionId &&
                                 sd.DataType == SessionDataTypes.Question &&
                                 sd.Content != null)
                    .ToListAsync();

                _logger.LogInformation("[DEBUG-WORKITEM:canvas:update] [{RequestId}] Found {Count} questions in session {SessionId} ;CLEANUP_OK", 
                    requestId, allQuestions.Count, session.SessionId);

                // Find the specific question by parsing JSON
                SessionData? questionRecord = null;
                foreach (var record in allQuestions)
                {
                    try
                    {
                        var data = JsonSerializer.Deserialize<Dictionary<string, object>>(record.Content ?? "{}");
                        if (data != null && data.ContainsKey("questionId"))
                        {
                            var recordQuestionId = data["questionId"]?.ToString();
                            _logger.LogInformation("[DEBUG-WORKITEM:canvas:update] [{RequestId}] Checking question: QuestionId={RecordQuestionId}, CreatedBy={CreatedBy}, Target={TargetQuestionId}, RequestUserGuid={RequestUserGuid} ;CLEANUP_OK",
                                requestId, recordQuestionId, record.CreatedBy, questionId, request.UserGuid);
                            
                            if (recordQuestionId == questionId.ToString())
                            {
                                _logger.LogInformation("[DEBUG-WORKITEM:canvas:update] [{RequestId}] Found matching questionId. Checking ownership: CreatedBy={CreatedBy} vs UserGuid={UserGuid}, Match={Match} ;CLEANUP_OK",
                                    requestId, record.CreatedBy, request.UserGuid, record.CreatedBy == request.UserGuid);
                                
                                if (record.CreatedBy == request.UserGuid)
                                {
                                    questionRecord = record;
                                    break;
                                }
                                else
                                {
                                    _logger.LogWarning("[DEBUG-WORKITEM:canvas:update] [{RequestId}] Question found but ownership mismatch - CreatedBy={CreatedBy}, UserGuid={UserGuid} ;CLEANUP_OK",
                                        requestId, record.CreatedBy, request.UserGuid);
                                    return NotFound(new { Error = "Question not found or you are not authorized to update it", RequestId = requestId });
                                }
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning("[DEBUG-WORKITEM:canvas:update] [{RequestId}] Failed to parse question record: {Error} ;CLEANUP_OK", requestId, ex.Message);
                    }
                }

                if (questionRecord == null)
                {
                    _logger.LogWarning("[DEBUG-WORKITEM:canvas:update] [{RequestId}] Question not found after checking all records ;CLEANUP_OK", requestId);
                    return NotFound(new { Error = "Question not found or you are not authorized to update it", RequestId = requestId });
                }

                _logger.LogInformation("[DEBUG-WORKITEM:canvas:update] [{RequestId}] Question found and ownership verified ;CLEANUP_OK", requestId);

                // Parse existing question data
                var questionData = JsonSerializer.Deserialize<Dictionary<string, object>>(questionRecord.Content ?? "{}");
                if (questionData == null)
                {
                    return StatusCode(500, new { Error = "Failed to parse question data", RequestId = requestId });
                }

                // Update the question text
                questionData["text"] = request.QuestionText.Trim();
                questionRecord.Content = JsonSerializer.Serialize(questionData);
                await _context.SaveChangesAsync();

                _logger.LogInformation("[DEBUG-WORKITEM:canvas-questions:update] [{RequestId}] Question updated in database - QuestionId={QuestionId}, NewText={NewText} ;CLEANUP_OK",
                    requestId, questionId, request.QuestionText.Trim().Substring(0, Math.Min(50, request.QuestionText.Trim().Length)));
                _logger.LogInformation("[DEBUG-WORKITEM:canvas:update] [{RequestId}] Question updated successfully ;CLEANUP_OK", requestId);

                // Broadcast update via SignalR
                var updatedQuestionData = new
                {
                    questionId = questionId,
                    text = request.QuestionText.Trim(),
                    userName = questionData.ContainsKey("userName") ? questionData["userName"]?.ToString() : "Anonymous",
                    userId = questionData.ContainsKey("userId") ? questionData["userId"]?.ToString() : "",
                    votes = questionData.ContainsKey("votes") ? GetIntFromJsonElement(questionData["votes"]) : 0,
                    isAnswered = questionData.ContainsKey("isAnswered") ? GetBoolFromJsonElement(questionData["isAnswered"]) : false
                };

                _logger.LogInformation("[DEBUG-WORKITEM:canvas-questions:update] ════════ BROADCASTING QUESTION UPDATE ════════ ;CLEANUP_OK");
                _logger.LogInformation("[DEBUG-WORKITEM:canvas-questions:update] [{RequestId}] Preparing SignalR broadcast - QuestionId={QuestionId}, Text={Text}, SessionGroup=session_{SessionId} ;CLEANUP_OK",
                    requestId, updatedQuestionData.questionId, updatedQuestionData.text.Substring(0, Math.Min(30, updatedQuestionData.text.Length)), session.SessionId);

                // Broadcast to participants (session group)
                await _sessionHub.Clients.Group($"session_{session.SessionId}")
                    .SendAsync("QuestionUpdated", updatedQuestionData);

                _logger.LogInformation("[DEBUG-WORKITEM:canvas-questions:update] [{RequestId}] ✅ QuestionUpdated broadcast sent to session_{SessionId} (participants) ;CLEANUP_OK",
                    requestId, session.SessionId);

                // Notify hosts
                await _sessionHub.Clients.Group($"Host_{session.SessionId}")
                    .SendAsync("HostQuestionUpdated", updatedQuestionData);

                _logger.LogInformation("[DEBUG-WORKITEM:canvas-questions:update] [{RequestId}] ✅ HostQuestionUpdated broadcast sent to Host_{SessionId} (host panel) ;CLEANUP_OK",
                    requestId, session.SessionId);
                _logger.LogInformation("[DEBUG-WORKITEM:canvas-questions:update] ════════ BROADCAST COMPLETE ════════ ;CLEANUP_OK");
                _logger.LogInformation("[DEBUG-WORKITEM:canvas:update] [{RequestId}] SignalR notifications sent ;CLEANUP_OK", requestId);

                return Ok(new UpdateQuestionResponse
                {
                    Success = true,
                    Message = "Question updated successfully",
                    RequestId = requestId
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[DEBUG-WORKITEM:canvas:update] [{RequestId}] Exception during question update ;CLEANUP_OK", requestId);
                return StatusCode(500, new { Error = "Failed to update question", RequestId = requestId });
            }
        }

        /// <summary>
        /// Delete a question (only the user who created it can delete).
        /// </summary>
        /// <param name="questionId">The GUID of the question to delete.</param>
        /// <param name="request">The delete request containing session token and user GUID.</param>
        /// <returns>The result of the delete operation.</returns>
        [HttpPost("{questionId}/delete")]
        public async Task<IActionResult> DeleteQuestion(string questionId, [FromBody] DeleteQuestionRequest request)
        {
            var requestId = Guid.NewGuid().ToString("N")[..8];
            _logger.LogInformation("[DEBUG-WORKITEM:canvas:delete:TRACE] [{RequestId}] ════════════════════════════════════════════════════════════════ ;CLEANUP_OK", requestId);
            _logger.LogInformation("[DEBUG-WORKITEM:canvas:delete:TRACE] [{RequestId}] API DELETE STARTED - QuestionId: {QuestionId} ;CLEANUP_OK", requestId, questionId);
            _logger.LogInformation("[DEBUG-WORKITEM:canvas:delete:TRACE] [{RequestId}] ════════════════════════════════════════════════════════════════ ;CLEANUP_OK", requestId);

            try
            {
                // STEP 1: Validate request
                _logger.LogInformation("[DEBUG-WORKITEM:canvas:delete:TRACE] [{RequestId}] Step 1/7: Validating request payload ;CLEANUP_OK", requestId);
                _logger.LogInformation("[DEBUG-WORKITEM:canvas:delete:TRACE] [{RequestId}]   - SessionToken: {SessionToken} ;CLEANUP_OK", requestId, request.SessionToken ?? "NULL");
                _logger.LogInformation("[DEBUG-WORKITEM:canvas:delete:TRACE] [{RequestId}]   - UserGuid: {UserGuid} ;CLEANUP_OK", requestId, request.UserGuid ?? "NULL");
                
                if (string.IsNullOrWhiteSpace(request.SessionToken) || request.SessionToken.Length != 8)
                {
                    _logger.LogWarning("[DEBUG-WORKITEM:canvas:delete:TRACE] [{RequestId}] ❌ VALIDATION FAILED: Invalid session token format ;CLEANUP_OK", requestId);
                    return BadRequest(new { Error = "Invalid session token format", RequestId = requestId });
                }

                if (string.IsNullOrWhiteSpace(request.UserGuid))
                {
                    _logger.LogWarning("[DEBUG-WORKITEM:canvas:delete:TRACE] [{RequestId}] ❌ VALIDATION FAILED: UserGuid is required ;CLEANUP_OK", requestId);
                    return BadRequest(new { Error = "UserGuid is required", RequestId = requestId });
                }

                // STEP 2: Find session by user token
                _logger.LogInformation("[DEBUG-WORKITEM:canvas:delete:TRACE] [{RequestId}] Step 2/7: Looking up session by token ;CLEANUP_OK", requestId);
                var session = await _context.Sessions
                    .FirstOrDefaultAsync(s => s.UserToken == request.SessionToken &&
                                            (s.Status == "Active" || s.Status == "Configured"));

                if (session == null)
                {
                    _logger.LogWarning("[DEBUG-WORKITEM:canvas:delete:TRACE] [{RequestId}] ❌ SESSION NOT FOUND for token: {Token} ;CLEANUP_OK", requestId, request.SessionToken);
                    return NotFound(new { Error = "Session not found or inactive", RequestId = requestId });
                }

                _logger.LogInformation("[DEBUG-WORKITEM:canvas:delete:TRACE] [{RequestId}] ✅ Session found - SessionId: {SessionId}, Status: {Status} ;CLEANUP_OK", 
                    requestId, session.SessionId, session.Status);

                // STEP 3: Find all questions for this session
                _logger.LogInformation("[DEBUG-WORKITEM:canvas:delete:TRACE] [{RequestId}] Step 3/7: Loading all questions from canvas.SessionData ;CLEANUP_OK", requestId);
                var allQuestions = await _context.SessionData
                    .Where(sd => sd.SessionId == session.SessionId &&
                                 sd.DataType == SessionDataTypes.Question &&
                                 sd.Content != null)
                    .ToListAsync();

                _logger.LogInformation("[DEBUG-WORKITEM:canvas:delete:TRACE] [{RequestId}] Found {Count} question records in canvas.SessionData ;CLEANUP_OK", 
                    requestId, allQuestions.Count);

                // STEP 4: Find the specific question by parsing JSON
                _logger.LogInformation("[DEBUG-WORKITEM:canvas:delete:TRACE] [{RequestId}] Step 4/7: Searching for target question ;CLEANUP_OK", requestId);
                SessionData? questionRecord = null;
                int matchAttempts = 0;
                
                foreach (var record in allQuestions)
                {
                    try
                    {
                        matchAttempts++;
                        var data = JsonSerializer.Deserialize<Dictionary<string, object>>(record.Content ?? "{}");
                        if (data != null && data.ContainsKey("questionId"))
                        {
                            var recordQuestionId = data["questionId"]?.ToString();
                            _logger.LogDebug("[DEBUG-WORKITEM:canvas:delete:TRACE] [{RequestId}]   Attempt {Attempt}: QuestionId={RecordQuestionId}, CreatedBy={CreatedBy}, Target={TargetQuestionId} ;CLEANUP_OK",
                                requestId, matchAttempts, recordQuestionId, record.CreatedBy, questionId);
                            
                            if (recordQuestionId == questionId.ToString())
                            {
                                _logger.LogInformation("[DEBUG-WORKITEM:canvas:delete:TRACE] [{RequestId}] 🎯 MATCH FOUND! Validating ownership ;CLEANUP_OK", requestId);
                                _logger.LogInformation("[DEBUG-WORKITEM:canvas:delete:TRACE] [{RequestId}]   - Database CreatedBy: {CreatedBy} ;CLEANUP_OK", requestId, record.CreatedBy);
                                _logger.LogInformation("[DEBUG-WORKITEM:canvas:delete:TRACE] [{RequestId}]   - Request UserGuid: {UserGuid} ;CLEANUP_OK", requestId, request.UserGuid);
                                _logger.LogInformation("[DEBUG-WORKITEM:canvas:delete:TRACE] [{RequestId}]   - Ownership Match: {Match} ;CLEANUP_OK", requestId, record.CreatedBy == request.UserGuid);
                                
                                if (record.CreatedBy == request.UserGuid)
                                {
                                    questionRecord = record;
                                    _logger.LogInformation("[DEBUG-WORKITEM:canvas:delete:TRACE] [{RequestId}] ✅ OWNERSHIP VERIFIED - Proceeding with deletion ;CLEANUP_OK", requestId);
                                    break;
                                }
                                else
                                {
                                    _logger.LogWarning("[DEBUG-WORKITEM:canvas:delete:TRACE] [{RequestId}] ❌ OWNERSHIP MISMATCH - User not authorized ;CLEANUP_OK", requestId);
                                    return NotFound(new { Error = "Question not found or you are not authorized to delete it", RequestId = requestId });
                                }
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning("[DEBUG-WORKITEM:canvas:delete:TRACE] [{RequestId}] ⚠️ Failed to parse question record: {Error} ;CLEANUP_OK", requestId, ex.Message);
                    }
                }

                if (questionRecord == null)
                {
                    _logger.LogWarning("[DEBUG-WORKITEM:canvas:delete:TRACE] [{RequestId}] ❌ QUESTION NOT FOUND after checking {Attempts} records ;CLEANUP_OK", requestId, matchAttempts);
                    return NotFound(new { Error = "Question not found or you are not authorized to delete it", RequestId = requestId });
                }

                _logger.LogInformation("[DEBUG-WORKITEM:canvas:delete:TRACE] [{RequestId}] Question record located - DataId: {DataId} ;CLEANUP_OK", requestId, questionRecord.DataId);

                // STEP 5: Delete from database
                _logger.LogInformation("[DEBUG-WORKITEM:canvas:delete:TRACE] [{RequestId}] Step 5/7: Deleting from canvas.SessionData ;CLEANUP_OK", requestId);
                _logger.LogInformation("[DEBUG-WORKITEM:canvas:delete:TRACE] [{RequestId}]   - Table: canvas.SessionData ;CLEANUP_OK", requestId);
                _logger.LogInformation("[DEBUG-WORKITEM:canvas:delete:TRACE] [{RequestId}]   - DataId: {DataId} ;CLEANUP_OK", requestId, questionRecord.DataId);
                _logger.LogInformation("[DEBUG-WORKITEM:canvas:delete:TRACE] [{RequestId}]   - SessionId: {SessionId} ;CLEANUP_OK", requestId, questionRecord.SessionId);
                
                _context.SessionData.Remove(questionRecord);
                int rowsAffected = await _context.SaveChangesAsync();
                
                _logger.LogInformation("[DEBUG-WORKITEM:canvas:delete:TRACE] [{RequestId}] ✅ DATABASE DELETE SUCCESSFUL - Rows affected: {RowsAffected} ;CLEANUP_OK", 
                    requestId, rowsAffected);

                // STEP 6: Broadcast to session participants via SignalR
                var sessionGroup = $"session_{session.SessionId}";
                _logger.LogInformation("[DEBUG-WORKITEM:canvas:delete:TRACE] [{RequestId}] Step 6/7: Broadcasting to session participants ;CLEANUP_OK", requestId);
                _logger.LogInformation("[DEBUG-WORKITEM:canvas:delete:TRACE] [{RequestId}]   - SignalR Group: {SessionGroup} ;CLEANUP_OK", requestId, sessionGroup);
                _logger.LogInformation("[DEBUG-WORKITEM:canvas:delete:TRACE] [{RequestId}]   - Event: QuestionDeleted ;CLEANUP_OK", requestId);
                _logger.LogInformation("[DEBUG-WORKITEM:canvas:delete:TRACE] [{RequestId}]   - Payload: {{QuestionId:{QuestionId}, SessionId:{SessionId}}} ;CLEANUP_OK", 
                    requestId, questionId, session.SessionId);
                
                await _sessionHub.Clients.Group(sessionGroup)
                    .SendAsync("QuestionDeleted", new { QuestionId = questionId, SessionId = session.SessionId });
                
                _logger.LogInformation("[DEBUG-WORKITEM:canvas:delete:TRACE] [{RequestId}] ✅ QuestionDeleted broadcast SENT to {Group} ;CLEANUP_OK", requestId, sessionGroup);

                // STEP 7: Broadcast to hosts via SignalR
                var hostGroup = $"Host_{session.SessionId}";
                _logger.LogInformation("[DEBUG-WORKITEM:canvas:delete:TRACE] [{RequestId}] Step 7/7: Broadcasting to hosts ;CLEANUP_OK", requestId);
                _logger.LogInformation("[DEBUG-WORKITEM:canvas:delete:TRACE] [{RequestId}]   - SignalR Group: {HostGroup} ;CLEANUP_OK", requestId, hostGroup);
                _logger.LogInformation("[DEBUG-WORKITEM:canvas:delete:TRACE] [{RequestId}]   - Event: HostQuestionDeleted ;CLEANUP_OK", requestId);
                _logger.LogInformation("[DEBUG-WORKITEM:canvas:delete:TRACE] [{RequestId}]   - Payload: {{QuestionId:{QuestionId}, SessionId:{SessionId}}} ;CLEANUP_OK", 
                    requestId, questionId, session.SessionId);
                
                await _sessionHub.Clients.Group(hostGroup)
                    .SendAsync("HostQuestionDeleted", new { QuestionId = questionId, SessionId = session.SessionId });
                
                _logger.LogInformation("[DEBUG-WORKITEM:canvas:delete:TRACE] [{RequestId}] ✅ HostQuestionDeleted broadcast SENT to {Group} ;CLEANUP_OK", requestId, hostGroup);

                _logger.LogInformation("[DEBUG-WORKITEM:canvas:delete:TRACE] [{RequestId}] ════════════════════════════════════════════════════════════════ ;CLEANUP_OK", requestId);
                _logger.LogInformation("[DEBUG-WORKITEM:canvas:delete:TRACE] [{RequestId}] API DELETE COMPLETE - All steps successful ;CLEANUP_OK", requestId);
                _logger.LogInformation("[DEBUG-WORKITEM:canvas:delete:TRACE] [{RequestId}] ════════════════════════════════════════════════════════════════ ;CLEANUP_OK", requestId);

                return Ok(new DeleteQuestionResponse
                {
                    Success = true,
                    Message = "Question deleted successfully",
                    RequestId = requestId
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[DEBUG-WORKITEM:canvas:delete:TRACE] [{RequestId}] 💥 EXCEPTION during question deletion: {Message} ;CLEANUP_OK", requestId, ex.Message);
                _logger.LogError("[DEBUG-WORKITEM:canvas:delete:TRACE] [{RequestId}]   - StackTrace: {StackTrace} ;CLEANUP_OK", requestId, ex.StackTrace);
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
    /// Request model for updating an existing question.
    /// </summary>
    public class UpdateQuestionRequest
    {
        /// <summary>
        /// Gets or sets the session token for authentication.
        /// </summary>
        public string SessionToken { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the updated text of the question.
        /// </summary>
        public string QuestionText { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the unique identifier for the user updating the question.
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
    /// Response model for question update operations.
    /// </summary>
    public class UpdateQuestionResponse
    {
        /// <summary>
        /// Gets or sets a value indicating whether the update was successful.
        /// </summary>
        public bool Success { get; set; }

        /// <summary>
        /// Gets or sets the response message describing the update result.
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
