using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.JSInterop;
using NoorCanvas.Pages;

namespace NoorCanvas.Services.SignalR;

/// <summary>
/// [REFACTOR:Phase3] Implementation of SignalR event handlers for SessionCanvas/TranscriptCanvas
/// Eliminates ~900 lines of duplicated code across 2 components
/// </summary>
public class SessionCanvasSignalRService : ISessionCanvasSignalRService
{
    private readonly ILogger<SessionCanvasSignalRService> _logger;
    private readonly IJSRuntime _jsRuntime;
    
    public SessionCanvasSignalRService(
        ILogger<SessionCanvasSignalRService> logger,
        IJSRuntime jsRuntime)
    {
        _logger = logger;
        _jsRuntime = jsRuntime;
    }
    
    /// <inheritdoc/>
    public async Task HandleQuestionReceivedAsync(object data, Func<SessionCanvas.QuestionData, Task>? onQuestionAdded = null)
    {
        await using var context = new SignalREventContext("QuestionReceived", _logger);
        
        try
        {
            if (data == null)
            {
                context.LogWarning("Received null questionData");
                return;
            }

            var jsonString = JsonSerializer.Serialize(data);
            context.LogInfo("Payload JSON: {Json}", jsonString);
            
            using var jsonDocument = JsonDocument.Parse(jsonString);
            var root = jsonDocument.RootElement;
            
            // Parse question data from SignalR
            var questionId = root.TryGetProperty("questionId", out var qIdProp) ? 
                (qIdProp.ValueKind == JsonValueKind.String ? qIdProp.GetString() ?? "" : qIdProp.GetInt32().ToString()) : "";
            var text = root.TryGetProperty("text", out var textProp) ? textProp.GetString() ?? "" : "";
            var userName = root.TryGetProperty("userName", out var userNameProp) ? userNameProp.GetString() ?? "Anonymous" : "Anonymous";
            var userId = root.TryGetProperty("userId", out var userIdProp) ? userIdProp.GetString() ?? "" : "";
            var votes = root.TryGetProperty("votes", out var votesProp) ? votesProp.GetInt32() : 0;
            var createdAt = root.TryGetProperty("submittedAt", out var dateProp) ? dateProp.GetDateTime() : DateTime.UtcNow;
            var isAnswered = root.TryGetProperty("isAnswered", out var answeredProp) ? answeredProp.GetBoolean() : false;

            context.LogInfo("Parsed - QuestionId: {QuestionId}, Text: {Text}, UserName: {UserName}",
                questionId,
                text.Length > 50 ? text.Substring(0, 50) + "..." : text,
                userName);

            if (!string.IsNullOrEmpty(questionId) && !string.IsNullOrEmpty(text))
            {
                var question = new SessionCanvas.QuestionData
                {
                    QuestionId = questionId,
                    Text = text,
                    UserName = userName,
                    CreatedBy = userId,
                    Votes = votes,
                    CreatedAt = createdAt,
                    IsAnswered = isAnswered,
                    IsMyQuestion = false // Will be set by callback based on CurrentUserGuid
                };

                // Invoke callback to add question to model
                if (onQuestionAdded != null)
                {
                    await onQuestionAdded(question);
                }

                context.LogInfo("Question processed successfully");
            }
            else
            {
                context.LogWarning("Invalid question data (missing ID or text)");
            }
        }
        catch (Exception ex)
        {
            context.LogError(ex, "Exception processing QuestionReceived: {Message}", ex.Message);
        }
    }
    
    /// <inheritdoc/>
    public async Task HandleQuestionUpdatedAsync(object data, Func<SessionCanvas.QuestionData, Task>? onQuestionUpdated = null)
    {
        await using var context = new SignalREventContext("QuestionUpdated", _logger);
        
        try
        {
            if (data == null)
            {
                context.LogWarning("Received null questionData");
                return;
            }

            var jsonString = JsonSerializer.Serialize(data);
            context.LogInfo("Payload JSON: {Json}", jsonString);
            
            using var jsonDocument = JsonDocument.Parse(jsonString);
            var root = jsonDocument.RootElement;
            
            var questionId = root.TryGetProperty("questionId", out var qIdProp) ? qIdProp.GetString() ?? "" : "";
            var newText = root.TryGetProperty("text", out var textProp) ? textProp.GetString() ?? "" : "";
            
            context.LogInfo("Parsed - QuestionId: {QuestionId}, NewText: {NewText}",
                questionId,
                newText.Length > 50 ? newText.Substring(0, 50) + "..." : newText);
            
            if (!string.IsNullOrEmpty(questionId) && !string.IsNullOrEmpty(newText))
            {
                var updatedQuestion = new SessionCanvas.QuestionData
                {
                    QuestionId = questionId,
                    Text = newText
                };
                
                // Invoke callback to update question in model
                if (onQuestionUpdated != null)
                {
                    await onQuestionUpdated(updatedQuestion);
                    context.LogInfo("Question updated successfully");
                }
            }
            else
            {
                context.LogWarning("Invalid question data (missing ID or text)");
            }
        }
        catch (Exception ex)
        {
            context.LogError(ex, "Exception processing QuestionUpdated: {Message}", ex.Message);
        }
    }
    
    /// <inheritdoc/>
    public async Task HandleQuestionDeletedAsync(object data, Func<string, string?, Task>? onQuestionDeleted = null)
    {
        await using var context = new SignalREventContext("QuestionDeleted", _logger);
        
        try
        {
            if (data == null)
            {
                context.LogWarning("Received null deleteData");
                return;
            }

            var jsonString = JsonSerializer.Serialize(data);
            context.LogInfo("Payload JSON: {Json}", jsonString);
            
            using var jsonDocument = JsonDocument.Parse(jsonString);
            var root = jsonDocument.RootElement;
            
            var questionId = root.TryGetProperty("questionId", out var qIdProp) ? qIdProp.GetString() : null;
            var originalAskerGuid = root.TryGetProperty("originalAskerGuid", out var askerProp) ? askerProp.GetString() : null;
            
            context.LogInfo("QuestionId: {QuestionId}, OriginalAskerGuid: {AskerGuid}", 
                questionId ?? "NULL", originalAskerGuid ?? "NULL");
            
            if (!string.IsNullOrEmpty(questionId) && onQuestionDeleted != null)
            {
                await onQuestionDeleted(questionId, originalAskerGuid);
                context.LogInfo("Question deleted successfully");
            }
        }
        catch (Exception ex)
        {
            context.LogError(ex, "Exception processing QuestionDeleted: {Message}", ex.Message);
        }
    }
    
    public async Task HandleVoteUpdateAsync(object data, Func<string, int, Task>? onVoteUpdated = null)
    {
        await using var context = new SignalREventContext("VoteUpdateReceived", _logger);
        
        try
        {
            if (data == null)
            {
                context.LogWarning("Received null voteData");
                return;
            }

            var jsonString = JsonSerializer.Serialize(data);
            context.LogInfo("Payload JSON: {Json}", jsonString);
            
            using var jsonDocument = JsonDocument.Parse(jsonString);
            var root = jsonDocument.RootElement;
            
            var questionId = root.TryGetProperty("questionId", out var qIdProp) ? qIdProp.GetString() : null;
            var votes = root.TryGetProperty("votes", out var votesProp) ? votesProp.GetInt32() : 0;
            
            context.LogInfo("QuestionId: {QuestionId}, Votes: {Votes}", questionId ?? "NULL", votes);
            
            if (!string.IsNullOrEmpty(questionId) && onVoteUpdated != null)
            {
                await onVoteUpdated(questionId, votes);
                context.LogInfo("Vote count updated successfully");
            }
        }
        catch (Exception ex)
        {
            context.LogError(ex, "Exception processing VoteUpdateReceived: {Message}", ex.Message);
        }
    }
    
    public async Task HandleAssetSharedAsync(object data, Func<string, Task>? onAssetShared = null)
    {
        await using var context = new SignalREventContext("AssetShared", _logger);
        
        try
        {
            if (data == null)
            {
                context.LogWarning("Received null assetData");
                return;
            }

            var jsonString = JsonSerializer.Serialize(data);
            context.LogInfo("Payload JSON length: {Length}", jsonString?.Length ?? 0);
            
            using var jsonDocument = JsonDocument.Parse(jsonString);
            var root = jsonDocument.RootElement;
            
            string? htmlContent = null;
            
            if (root.TryGetProperty("asset", out var assetElement))
            {
                if (assetElement.TryGetProperty("htmlContent", out var htmlElement))
                {
                    htmlContent = htmlElement.GetString();
                }
            }
            else if (root.TryGetProperty("htmlContent", out var directHtmlElement))
            {
                htmlContent = directHtmlElement.GetString();
            }
            
            if (!string.IsNullOrEmpty(htmlContent) && onAssetShared != null)
            {
                await onAssetShared(htmlContent);
                context.LogInfo("Asset shared successfully - ContentLength: {Length}", htmlContent.Length);
            }
            else
            {
                context.LogWarning("No htmlContent found in asset data");
            }
        }
        catch (Exception ex)
        {
            context.LogError(ex, "Exception processing AssetShared: {Message}", ex.Message);
        }
    }
    
    /// <inheritdoc/>
    public async Task HandleAssetContentReceivedAsync(string htmlContent, Func<string, Task>? onAssetReceived = null)
    {
        await using var context = new SignalREventContext("AssetContentReceived", _logger);
        
        try
        {
            var trackingId = Guid.NewGuid().ToString("N")[..8];
            var receiveTime = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            
            _logger.LogInformation("[DEBUG-BROADCAST:{TrackingId}] ════════════════════════════════════════", trackingId);
            _logger.LogInformation("[DEBUG-BROADCAST:{TrackingId}] SERVICE: HandleAssetContentReceivedAsync called", trackingId);
            _logger.LogInformation("[DEBUG-BROADCAST:{TrackingId}] SERVICE: receiveTime={ReceiveTime}ms, htmlLength={Length}",
                trackingId, receiveTime, htmlContent?.Length ?? 0);
            _logger.LogInformation("[DEBUG-BROADCAST:{TrackingId}] SERVICE: onAssetReceived callback is {Status}",
                trackingId, onAssetReceived != null ? "PROVIDED" : "NULL");
            
            context.LogInfo("[{TrackingId}] Content received at {ReceiveTime}ms, length={Length}",
                trackingId, receiveTime, htmlContent?.Length ?? 0);
            
            if (!string.IsNullOrEmpty(htmlContent) && onAssetReceived != null)
            {
                _logger.LogInformation("[DEBUG-BROADCAST:{TrackingId}] SERVICE: Invoking onAssetReceived callback...", trackingId);
                await onAssetReceived(htmlContent);
                _logger.LogInformation("[DEBUG-BROADCAST:{TrackingId}] SERVICE: ✅ Callback invoked successfully", trackingId);
                
                var displayTime = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
                var latency = displayTime - receiveTime;
                
                _logger.LogInformation("[DEBUG-BROADCAST:{TrackingId}] SERVICE: displayTime={DisplayTime}ms, latency={Latency}ms",
                    trackingId, displayTime, latency);
                
                context.LogInfo("[{TrackingId}] Asset displayed at {DisplayTime}ms (latency: {Latency}ms)",
                    trackingId, displayTime, latency);
            }
            else
            {
                if (string.IsNullOrEmpty(htmlContent))
                {
                    _logger.LogWarning("[DEBUG-BROADCAST:{TrackingId}] SERVICE: ⚠️ htmlContent is null or empty", trackingId);
                }
                if (onAssetReceived == null)
                {
                    _logger.LogWarning("[DEBUG-BROADCAST:{TrackingId}] SERVICE: ⚠️ onAssetReceived callback is NULL", trackingId);
                }
                context.LogWarning("[{TrackingId}] Cannot display - htmlContent is null or empty", trackingId);
            }
            
            _logger.LogInformation("[DEBUG-BROADCAST:{TrackingId}] ════════════════════════════════════════", trackingId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[DEBUG-BROADCAST] SERVICE: ❌ EXCEPTION in HandleAssetContentReceivedAsync");
            _logger.LogError("[DEBUG-BROADCAST] SERVICE: Exception type: {ExceptionType}, Message: {Message}",
                ex.GetType().Name, ex.Message);
            context.LogError(ex, "Exception processing AssetContentReceived: {Message}", ex.Message);
        }
    }
    
    public async Task HandleTranscriptUpdatedAsync(object data, Func<string, Task>? onTranscriptUpdated = null)
    {
        await using var context = new SignalREventContext("TranscriptUpdated", _logger);
        
        try
        {
            string? transcript = null;
            
            if (data is string directString)
            {
                transcript = directString;
            }
            else if (data != null)
            {
                var jsonString = JsonSerializer.Serialize(data);
                using var jsonDocument = JsonDocument.Parse(jsonString);
                var root = jsonDocument.RootElement;
                
                if (root.TryGetProperty("transcript", out var transcriptProp))
                {
                    transcript = transcriptProp.GetString();
                }
            }
            
            context.LogInfo("TranscriptLength={Length}", transcript?.Length ?? 0);
            
            if (transcript != null && onTranscriptUpdated != null)
            {
                await onTranscriptUpdated(transcript);
                context.LogInfo("Transcript updated successfully");
            }
        }
        catch (Exception ex)
        {
            context.LogError(ex, "Exception processing TranscriptUpdated: {Message}", ex.Message);
        }
    }
    
    public async Task HandleSessionEndedAsync(object data, Func<int, Task>? onSessionEnded = null)
    {
        await using var context = new SignalREventContext("SessionEnded", _logger);
        
        try
        {
            if (data == null)
            {
                context.LogWarning("Received null endData");
                return;
            }

            var jsonString = JsonSerializer.Serialize(data);
            context.LogInfo("Payload JSON: {Json}", jsonString);
            
            using var jsonDocument = JsonDocument.Parse(jsonString);
            var root = jsonDocument.RootElement;
            
            var sessionId = root.TryGetProperty("sessionId", out var sessionIdProp) ? sessionIdProp.GetInt32() : 0;
            
            context.LogInfo("SessionId: {SessionId}", sessionId);
            
            if (sessionId > 0 && onSessionEnded != null)
            {
                await onSessionEnded(sessionId);
                context.LogInfo("Session ended handler completed");
            }
        }
        catch (Exception ex)
        {
            context.LogError(ex, "Exception processing SessionEnded: {Message}", ex.Message);
        }
    }
}
