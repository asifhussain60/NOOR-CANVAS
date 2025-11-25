using System.Text.Json;
using Microsoft.AspNetCore.SignalR.Client;
using NoorCanvas.ViewModels;

namespace NoorCanvas.Services;

/// <summary>
/// [REFACTOR:Week2] Service for managing question operations across Host Control Panel and Canvas components
/// Consolidates Q&A API calls to eliminate ~400 duplicate lines
/// Extracted from HostControlPanel.razor and SessionCanvas.razor to separate business logic from UI layer
/// Handles question submission, updating, voting, deletion, loading, sharing, and HTML formatting
/// </summary>
public interface IQuestionManagementService
{
    // [REFACTOR:Week2] Canvas Participant Operations - SessionCanvas.razor
    
    /// <summary>
    /// Submit new question to session
    /// </summary>
    Task<QuestionSubmissionResult> SubmitQuestionAsync(string sessionToken, string questionText, string userGuid);
    
    /// <summary>
    /// Update existing question text
    /// </summary>
    Task<QuestionUpdateResult> UpdateQuestionAsync(string questionId, string sessionToken, string questionText, string userGuid);
    
    /// <summary>
    /// Vote on a question (upvote)
    /// </summary>
    Task<QuestionVoteResult> VoteQuestionAsync(string questionId, string sessionToken, string direction, string userGuid);
    
    /// <summary>
    /// Delete question from session
    /// </summary>
    Task<QuestionDeleteResult> DeleteQuestionAsync(string questionId, string sessionToken, string userGuid);
    
    // [PHASE-6:hcp] Host Control Panel Operations - HostControlPanel.razor
    
    /// <summary>
    /// Load questions for a session using user token (host view)
    /// </summary>
    Task<List<QuestionItem>> LoadQuestionsAsync(string userToken);
    
    /// <summary>
    /// Share question asset to session participants via SignalR
    /// </summary>
    Task ShareQuestionAsync(QuestionItem question, int sessionId, HubConnection hubConnection);
    
    /// <summary>
    /// Delete question from database and broadcast deletion via SignalR (host operation)
    /// </summary>
    Task<bool> DeleteQuestionAsync(Guid questionId, string hostToken, string createdBy);
    
    /// <summary>
    /// Format question into orange-themed HTML card
    /// </summary>
    string FormatQuestionHtml(QuestionItem question);
}

/// <summary>
/// [REFACTOR:Week2] Result object for question submission
/// </summary>
public class QuestionSubmissionResult
{
    public bool Success { get; set; }
    public System.Net.HttpStatusCode StatusCode { get; set; }
    public string? ResponseContent { get; set; }
    public string? ErrorMessage { get; set; }
}

/// <summary>
/// [REFACTOR:Week2] Result object for question update
/// </summary>
public class QuestionUpdateResult
{
    public bool Success { get; set; }
    public System.Net.HttpStatusCode StatusCode { get; set; }
    public string? ResponseContent { get; set; }
    public string? ErrorMessage { get; set; }
}

/// <summary>
/// [REFACTOR:Week2] Result object for question vote
/// </summary>
public class QuestionVoteResult
{
    public bool Success { get; set; }
    public System.Net.HttpStatusCode StatusCode { get; set; }
    public string? ResponseContent { get; set; }
    public string? ErrorMessage { get; set; }
}

/// <summary>
/// [REFACTOR:Week2] Result object for question deletion
/// </summary>
public class QuestionDeleteResult
{
    public bool Success { get; set; }
    public System.Net.HttpStatusCode StatusCode { get; set; }
    public string? ResponseContent { get; set; }
    public string? ErrorMessage { get; set; }
}

public class QuestionManagementService : IQuestionManagementService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<QuestionManagementService> _logger;

    public QuestionManagementService(
        IHttpClientFactory httpClientFactory,
        ILogger<QuestionManagementService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // [REFACTOR:Week2] CANVAS PARTICIPANT OPERATIONS (SessionCanvas.razor)
    // ═══════════════════════════════════════════════════════════════════════════

    /// <summary>
    /// [REFACTOR:Week2] Submit new question to session
    /// Calls POST /api/Question/Submit endpoint
    /// Extracted from SessionCanvas.razor SubmitQuestion() method
    /// </summary>
    public async Task<QuestionSubmissionResult> SubmitQuestionAsync(string sessionToken, string questionText, string userGuid)
    {
        var requestId = Guid.NewGuid().ToString("N")[..8];
        _logger.LogInformation("[REFACTOR:Week2:QuestionMgmt] [{RequestId}] SubmitQuestionAsync called - SessionToken={TokenPreview}, UserGuid={UserGuid}", 
            requestId, sessionToken?.Substring(0, Math.Min(4, sessionToken?.Length ?? 0)) + "...", userGuid);

        try
        {
            var requestPayload = new
            {
                SessionToken = sessionToken,
                QuestionText = questionText.Trim(),
                UserGuid = userGuid
            };
            
            _logger.LogInformation("[REFACTOR:Week2:QuestionMgmt] [{RequestId}] Sending POST request to /api/Question/Submit", requestId);
            
            using var httpClient = _httpClientFactory.CreateClient("default");
            var response = await httpClient.PostAsJsonAsync("/api/Question/Submit", requestPayload);

            _logger.LogInformation("[REFACTOR:Week2:QuestionMgmt] [{RequestId}] API response received - StatusCode: {StatusCode}", 
                requestId, response.StatusCode);

            var responseContent = await response.Content.ReadAsStringAsync();

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("[REFACTOR:Week2:QuestionMgmt] [{RequestId}] Question submitted successfully", requestId);
                return new QuestionSubmissionResult
                {
                    Success = true,
                    StatusCode = response.StatusCode,
                    ResponseContent = responseContent
                };
            }
            else
            {
                _logger.LogWarning("[REFACTOR:Week2:QuestionMgmt] [{RequestId}] Question submission failed: {StatusCode} - {Error}", 
                    requestId, response.StatusCode, responseContent);
                return new QuestionSubmissionResult
                {
                    Success = false,
                    StatusCode = response.StatusCode,
                    ErrorMessage = responseContent
                };
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[REFACTOR:Week2:QuestionMgmt] [{RequestId}] Exception during question submission: {Message}", 
                requestId, ex.Message);
            return new QuestionSubmissionResult
            {
                Success = false,
                StatusCode = System.Net.HttpStatusCode.InternalServerError,
                ErrorMessage = ex.Message
            };
        }
    }

    /// <summary>
    /// [REFACTOR:Week2] Update existing question text
    /// Calls POST /api/Question/{questionId}/update endpoint
    /// Extracted from SessionCanvas.razor UpdateQuestion() method
    /// </summary>
    public async Task<QuestionUpdateResult> UpdateQuestionAsync(string questionId, string sessionToken, string questionText, string userGuid)
    {
        var requestId = Guid.NewGuid().ToString("N")[..8];
        _logger.LogInformation("[REFACTOR:Week2:QuestionMgmt] [{RequestId}] UpdateQuestionAsync called - QuestionId={QuestionId}, UserGuid={UserGuid}", 
            requestId, questionId, userGuid);

        try
        {
            var requestPayload = new
            {
                SessionToken = sessionToken,
                QuestionText = questionText.Trim(),
                UserGuid = userGuid
            };

            _logger.LogInformation("[REFACTOR:Week2:QuestionMgmt] [{RequestId}] Sending UPDATE request to /api/Question/{QuestionId}/update", 
                requestId, questionId);
            
            using var httpClient = _httpClientFactory.CreateClient("default");
            var response = await httpClient.PostAsJsonAsync($"/api/Question/{questionId}/update", requestPayload);

            _logger.LogInformation("[REFACTOR:Week2:QuestionMgmt] [{RequestId}] API response received - StatusCode: {StatusCode}", 
                requestId, response.StatusCode);

            var responseContent = await response.Content.ReadAsStringAsync();

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("[REFACTOR:Week2:QuestionMgmt] [{RequestId}] Question updated successfully", requestId);
                return new QuestionUpdateResult
                {
                    Success = true,
                    StatusCode = response.StatusCode,
                    ResponseContent = responseContent
                };
            }
            else
            {
                _logger.LogWarning("[REFACTOR:Week2:QuestionMgmt] [{RequestId}] Question update failed: {StatusCode} - {Error}", 
                    requestId, response.StatusCode, responseContent);
                return new QuestionUpdateResult
                {
                    Success = false,
                    StatusCode = response.StatusCode,
                    ErrorMessage = responseContent
                };
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[REFACTOR:Week2:QuestionMgmt] [{RequestId}] Exception during question update: {Message}", 
                requestId, ex.Message);
            return new QuestionUpdateResult
            {
                Success = false,
                StatusCode = System.Net.HttpStatusCode.InternalServerError,
                ErrorMessage = ex.Message
            };
        }
    }

    /// <summary>
    /// [REFACTOR:Week2] Vote on a question (upvote)
    /// Calls POST /api/Question/{questionId}/vote endpoint
    /// Extracted from SessionCanvas.razor VoteQuestion() method
    /// </summary>
    public async Task<QuestionVoteResult> VoteQuestionAsync(string questionId, string sessionToken, string direction, string userGuid)
    {
        var requestId = Guid.NewGuid().ToString("N")[..8];
        _logger.LogInformation("[REFACTOR:Week2:QuestionMgmt] [{RequestId}] VoteQuestionAsync called - QuestionId={QuestionId}, Direction={Direction}, UserGuid={UserGuid}", 
            requestId, questionId, direction, userGuid);

        try
        {
            var requestPayload = new
            {
                SessionToken = sessionToken,
                Direction = direction,
                UserGuid = userGuid
            };

            _logger.LogInformation("[REFACTOR:Week2:QuestionMgmt] [{RequestId}] Sending vote request to /api/Question/{QuestionId}/vote", 
                requestId, questionId);
            
            using var httpClient = _httpClientFactory.CreateClient("default");
            var response = await httpClient.PostAsJsonAsync($"/api/Question/{questionId}/vote", requestPayload);

            _logger.LogInformation("[REFACTOR:Week2:QuestionMgmt] [{RequestId}] API response received - StatusCode: {StatusCode}", 
                requestId, response.StatusCode);

            var responseContent = await response.Content.ReadAsStringAsync();

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("[REFACTOR:Week2:QuestionMgmt] [{RequestId}] Vote successful", requestId);
                return new QuestionVoteResult
                {
                    Success = true,
                    StatusCode = response.StatusCode,
                    ResponseContent = responseContent
                };
            }
            else
            {
                _logger.LogWarning("[REFACTOR:Week2:QuestionMgmt] [{RequestId}] Vote failed: {StatusCode} - {Error}", 
                    requestId, response.StatusCode, responseContent);
                return new QuestionVoteResult
                {
                    Success = false,
                    StatusCode = response.StatusCode,
                    ErrorMessage = responseContent
                };
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[REFACTOR:Week2:QuestionMgmt] [{RequestId}] Exception during vote: {Message}", 
                requestId, ex.Message);
            return new QuestionVoteResult
            {
                Success = false,
                StatusCode = System.Net.HttpStatusCode.InternalServerError,
                ErrorMessage = ex.Message
            };
        }
    }

    /// <summary>
    /// [REFACTOR:Week2] Delete question from session (participant operation)
    /// Calls POST /api/Question/{questionId}/delete endpoint
    /// Extracted from SessionCanvas.razor DeleteConfirmed() method
    /// </summary>
    public async Task<QuestionDeleteResult> DeleteQuestionAsync(string questionId, string sessionToken, string userGuid)
    {
        var requestId = Guid.NewGuid().ToString("N")[..8];
        _logger.LogInformation("[REFACTOR:Week2:QuestionMgmt] [{RequestId}] DeleteQuestionAsync called - QuestionId={QuestionId}, UserGuid={UserGuid}", 
            requestId, questionId, userGuid);

        try
        {
            var requestPayload = new
            {
                SessionToken = sessionToken,
                UserGuid = userGuid
            };

            _logger.LogInformation("[REFACTOR:Week2:QuestionMgmt] [{RequestId}] Sending DELETE request to /api/Question/{QuestionId}/delete", 
                requestId, questionId);
            
            using var httpClient = _httpClientFactory.CreateClient("default");
            var response = await httpClient.PostAsJsonAsync($"/api/Question/{questionId}/delete", requestPayload);

            _logger.LogInformation("[REFACTOR:Week2:QuestionMgmt] [{RequestId}] API response received - StatusCode: {StatusCode}", 
                requestId, response.StatusCode);

            var responseContent = await response.Content.ReadAsStringAsync();

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("[REFACTOR:Week2:QuestionMgmt] [{RequestId}] Question deleted successfully", requestId);
                return new QuestionDeleteResult
                {
                    Success = true,
                    StatusCode = response.StatusCode,
                    ResponseContent = responseContent
                };
            }
            else
            {
                _logger.LogWarning("[REFACTOR:Week2:QuestionMgmt] [{RequestId}] Question deletion failed: {StatusCode} - {Error}", 
                    requestId, response.StatusCode, responseContent);
                return new QuestionDeleteResult
                {
                    Success = false,
                    StatusCode = response.StatusCode,
                    ErrorMessage = responseContent
                };
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[REFACTOR:Week2:QuestionMgmt] [{RequestId}] Exception during question deletion: {Message}", 
                requestId, ex.Message);
            return new QuestionDeleteResult
            {
                Success = false,
                StatusCode = System.Net.HttpStatusCode.InternalServerError,
                ErrorMessage = ex.Message
            };
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // [PHASE-6:hcp] HOST CONTROL PANEL OPERATIONS (HostControlPanel.razor)
    // ═══════════════════════════════════════════════════════════════════════════

    /// <summary>
    /// [PHASE-6:hcp] Load questions for a session using user token
    /// Calls /api/question/session/{userToken} endpoint
    /// </summary>
    public async Task<List<QuestionItem>> LoadQuestionsAsync(string userToken)
    {
        try
        {
            using var httpClient = _httpClientFactory.CreateClient("default");
            var response = await httpClient.GetAsync($"/api/question/session/{userToken}");
            
            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                var questionsResponse = JsonSerializer.Deserialize<GetQuestionsApiResponse>(content, 
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                if (questionsResponse?.Questions != null)
                {
                    var questions = questionsResponse.Questions.Select(q => new QuestionItem
                    {
                        Id = Guid.NewGuid(), // Generate new GUID for UI tracking
                        Text = q.Text ?? "",
                        UserName = !string.IsNullOrWhiteSpace(q.UserName) ? q.UserName : "Anonymous User",
                        CreatedBy = q.CreatedBy ?? "",
                        CreatedAt = q.CreatedAt,
                        IsAnswered = q.IsAnswered,
                        VoteCount = q.Votes
                    }).ToList();
                    
                    _logger.LogInformation("[PHASE-6:hcp] Loaded {Count} questions for session", questions.Count);
                    
                    return questions;
                }
            }
            else
            {
                _logger.LogWarning("[PHASE-6:hcp] Failed to load questions - API returned: {StatusCode}", response.StatusCode);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[PHASE-6:hcp] Exception loading questions");
        }
        
        return new List<QuestionItem>();
    }

    /// <summary>
    /// [PHASE-6:hcp] Share question asset to session participants via SignalR
    /// Formats question with orange theme and broadcasts via ShareAsset hub method
    /// </summary>
    public async Task ShareQuestionAsync(QuestionItem question, int sessionId, HubConnection hubConnection)
    {
        var requestId = Guid.NewGuid().ToString("N")[..8];
        var broadcastId = Guid.NewGuid().ToString("N")[..8];
        
        _logger.LogInformation("[PHASE-6:hcp] [{RequestId}] Sharing question: QuestionId={QuestionId}, Text='{Text}', BroadcastId={BroadcastId}", 
            requestId, question.Id, question.Text?.Substring(0, Math.Min(50, question.Text.Length)) ?? "NULL", broadcastId);
        
        if (hubConnection?.State != HubConnectionState.Connected)
        {
            _logger.LogWarning("[PHASE-6:hcp] [{RequestId}] Cannot share - HubState={HubState}", 
                requestId, hubConnection?.State.ToString() ?? "NULL");
            return;
        }
        
        try
        {
            // Format question HTML with orange theme
            var questionHtml = FormatQuestionHtml(question);
            
            _logger.LogInformation("[PHASE-6:hcp] [{RequestId}] Orange-themed HTML created, length={Length} chars", 
                requestId, questionHtml.Length);
            
            // Create asset payload
            var assetData = new
            {
                shareId = broadcastId,
                assetType = "question",
                htmlContent = questionHtml,
                metadata = new
                {
                    questionId = question.Id.ToString(),
                    questionText = question.Text,
                    userName = question.UserName,
                    voteCount = question.VoteCount,
                    sharedAt = DateTime.UtcNow,
                    theme = "orange",
                    styleSource = "QuestionManagementService"
                }
            };
            
            _logger.LogInformation("[PHASE-6:hcp] [{RequestId}] Invoking ShareAsset on hub, target=session_{SessionId}", 
                requestId, sessionId);
            
            await hubConnection.InvokeAsync("ShareAsset", sessionId, assetData);
            
            _logger.LogInformation("[PHASE-6:hcp] [{RequestId}] ✅ Question broadcasted to session_{SessionId}, BroadcastId: {BroadcastId}", 
                requestId, sessionId, broadcastId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[PHASE-6:hcp] [{RequestId}] Error sharing question", requestId);
            throw;
        }
    }

    /// <summary>
    /// [PHASE-6:hcp] Delete question from database via API
    /// Calls /api/Question/{questionId}/delete endpoint which triggers SignalR broadcast
    /// </summary>
    public async Task<bool> DeleteQuestionAsync(Guid questionId, string hostToken, string createdBy)
    {
        var requestId = Guid.NewGuid().ToString("N")[..8];
        
        _logger.LogInformation("[PHASE-6:hcp] [{RequestId}] Deleting question: QuestionId={QuestionId}", 
            requestId, questionId);
        
        try
        {
            var requestPayload = new
            {
                SessionToken = hostToken,
                UserGuid = createdBy
            };
            
            _logger.LogInformation("[PHASE-6:hcp] [{RequestId}] Calling API /api/Question/{QuestionId}/delete", 
                requestId, questionId);
            
            var httpClient = _httpClientFactory.CreateClient();
            var response = await httpClient.PostAsJsonAsync(
                $"https://localhost:9091/api/Question/{questionId}/delete", 
                requestPayload);
            
            _logger.LogInformation("[PHASE-6:hcp] [{RequestId}] API response: {StatusCode}", 
                requestId, response.StatusCode);

            if (response.IsSuccessStatusCode)
            {
                var responseContent = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("[PHASE-6:hcp] [{RequestId}] ✅ Question deleted successfully - Response: {Response}", 
                    requestId, responseContent);
                return true;
            }
            else
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError("[PHASE-6:hcp] [{RequestId}] ❌ Deletion failed: {StatusCode} - {Error}", 
                    requestId, response.StatusCode, errorContent);
                return false;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[PHASE-6:hcp] [{RequestId}] Exception deleting question", requestId);
            return false;
        }
    }

    /// <summary>
    /// [PHASE-6:hcp] Format question into orange-themed HTML card
    /// Uses shared-question-card CSS classes from session-transcript.css
    /// Theme: Background #fff7f5 (orange-50), Border #fdba74 (orange-300), Icon #f97316 (orange-500), Title #c2410c (orange-700)
    /// </summary>
    public string FormatQuestionHtml(QuestionItem question)
    {
        var encodedQuestionText = System.Web.HttpUtility.HtmlEncode(question.Text);
        var encodedUserName = System.Web.HttpUtility.HtmlEncode(question.UserName ?? "Anonymous");
        
        // Vote badge (if votes > 0)
        var voteBadgeHtml = "";
        if (question.VoteCount > 0)
        {
            var voteLabel = question.VoteCount == 1 ? "vote" : "votes";
            voteBadgeHtml = $@"
        <div style=""display:flex;align-items:center;gap:0.5rem;background-color:#DC2626;color:white;padding:0.375rem 0.75rem;border-radius:9999px;box-shadow:0 2px 4px rgba(220,38,38,0.3);"">
            <i class=""fa-solid fa-thumbs-up"" style=""font-size:0.75rem;""></i>
            <span style=""font-size:0.875rem;font-weight:600;"">{question.VoteCount} {voteLabel}</span>
        </div>";
        }
        
        // Orange-themed question card HTML
        var questionHtml = $@"
<div class=""shared-question-card"">
    <div class=""shared-question-header"">
        <div class=""shared-question-icon-wrapper"">
            <i class=""fa-solid fa-question-circle shared-question-icon""></i>
        </div>
        <div>
            <h1 class=""shared-question-title"">Participant Question</h1>
            <p class=""shared-question-subtitle"">Shared by host for discussion</p>
        </div>
    </div>
    <div class=""shared-question-content"">
        <p class=""shared-question-text"">{encodedQuestionText}</p>
    </div>
</div>";

        return questionHtml;
    }
}

/// <summary>
/// [PHASE-6:hcp] API response model for GET /api/question/session/{userToken}
/// </summary>
internal class GetQuestionsApiResponse
{
    public List<QuestionDto>? Questions { get; set; }
}

/// <summary>
/// [PHASE-6:hcp] DTO for question data from API
/// </summary>
internal class QuestionDto
{
    public string? Text { get; set; }
    public string? UserName { get; set; }
    public string? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsAnswered { get; set; }
    public int Votes { get; set; }
}
