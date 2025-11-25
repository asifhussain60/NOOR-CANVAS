using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.JSInterop;
using NoorCanvas.ViewModels;

namespace NoorCanvas.Services.SignalR;

/// <summary>
/// [REFACTOR:Phase2] Implementation of SignalR event handlers for Host Control Panel
/// Extracted from HostControlPanel.razor to separate concerns and improve testability
/// </summary>
public class HostSignalREventHandler : IHostSignalREventHandler
{
    private readonly ILogger<HostSignalREventHandler> _logger;
    private readonly IJSRuntime _jsRuntime;
    
    public HostSignalREventHandler(
        ILogger<HostSignalREventHandler> logger,
        IJSRuntime jsRuntime)
    {
        _logger = logger;
        _jsRuntime = jsRuntime;
    }
    
    /// <inheritdoc/>
    public async Task HandleQuestionReceivedAsync(object data, Func<QuestionItem, Task>? onQuestionAdded = null)
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
            
            // SignalR serializes to camelCase
            var questionId = root.TryGetProperty("questionId", out var qIdProp) ? qIdProp.GetString() : null;
            var questionText = root.TryGetProperty("text", out var textProp) ? textProp.GetString() : null;
            var userName = root.TryGetProperty("userName", out var userNameProp) ? userNameProp.GetString() : "Anonymous";
            var userId = root.TryGetProperty("userId", out var userIdProp) ? userIdProp.GetString() : "";
            var submittedAt = DateTime.UtcNow;
            if (root.TryGetProperty("submittedAt", out var submittedAtProp) && DateTime.TryParse(submittedAtProp.GetString(), out var parsedDate))
            {
                submittedAt = parsedDate;
            }

            context.LogInfo("Parsed - QuestionId: {QuestionId}, Text: {Text}, UserName: {UserName}",
                questionId ?? "NULL", 
                questionText ?? "NULL", 
                userName ?? "NULL");

            if (questionId != null && !string.IsNullOrEmpty(questionText))
            {
                var newQuestion = new QuestionItem
                {
                    Id = Guid.Parse(questionId),
                    Text = questionText,
                    UserName = userName ?? "Anonymous",
                    CreatedBy = userId ?? string.Empty,
                    CreatedAt = submittedAt,
                    IsAnswered = false,
                    VoteCount = root.TryGetProperty("votes", out var votesProp) ? votesProp.GetInt32() : 0
                };

                // Invoke callback to add question to model
                if (onQuestionAdded != null)
                {
                    await onQuestionAdded(newQuestion);
                }
                
                // Show toast notification to host about new question
                context.LogInfo("Showing toast notification - User: {UserName}, Question: {Text}", 
                    userName ?? "Anonymous", questionText.Substring(0, Math.Min(50, questionText.Length)));
                
                try
                {
                    var toastMessage = $"{userName} asked: \"{questionText}\"";
                    await _jsRuntime.InvokeVoidAsync("showNoorToast", 
                        toastMessage, 
                        "New Question Received", 
                        "info");
                    context.LogInfo("Toast notification shown successfully");
                }
                catch (Exception toastEx)
                {
                    context.LogWarning("Failed to show toast notification: {Message}", toastEx.Message);
                }

                context.LogInfo("Question added successfully");
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
    public async Task HandleTranscriptUpdatedAsync(string transcript, Func<string, Task>? onTranscriptUpdated = null)
    {
        await using var context = new SignalREventContext("TranscriptUpdated", _logger);
        
        try
        {
            context.LogInfo("TranscriptLength={Length}", transcript?.Length ?? 0);
            
            if (onTranscriptUpdated != null && transcript != null)
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
    
    /// <inheritdoc/>
    public async Task HandleVoteUpdateReceivedAsync(string questionText, int voteCount, Func<string, int, Task>? onVoteUpdated = null)
    {
        await using var context = new SignalREventContext("VoteUpdateReceived", _logger);
        
        try
        {
            context.LogInfo("QuestionText: {Text}, VoteCount: {Count}",
                questionText?.Substring(0, Math.Min(50, questionText?.Length ?? 0)) ?? "NULL", 
                voteCount);
            
            // Show toast notification to host about vote update
            await _jsRuntime.InvokeVoidAsync("showVoteUpdateToast", questionText ?? string.Empty, voteCount);
            
            // Invoke callback to update vote count in model
            if (onVoteUpdated != null && questionText != null)
            {
                await onVoteUpdated(questionText, voteCount);
                context.LogInfo("Vote count updated successfully");
            }
        }
        catch (Exception ex)
        {
            context.LogError(ex, "Exception processing VoteUpdateReceived: {Message}", ex.Message);
        }
    }
    
    /// <inheritdoc/>
    public async Task HandleHostQuestionUpdatedAsync(object data, Func<QuestionItem, Task>? onQuestionUpdated = null)
    {
        await using var context = new SignalREventContext("HostQuestionUpdated", _logger);
        
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
            
            // SignalR serializes to camelCase
            var questionId = root.TryGetProperty("questionId", out var qIdProp) ? qIdProp.GetString() : null;
            var newText = root.TryGetProperty("text", out var textProp) ? textProp.GetString() : null;
            
            context.LogInfo("Parsed - QuestionId: {QuestionId}, NewText: {NewText}",
                questionId ?? "NULL",
                newText?.Substring(0, Math.Min(50, newText?.Length ?? 0)) ?? "NULL");
            
            if (questionId != null && newText != null)
            {
                var updatedQuestion = new QuestionItem
                {
                    Id = Guid.Parse(questionId),
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
            context.LogError(ex, "Exception processing HostQuestionUpdated: {Message}", ex.Message);
        }
    }
    
    /// <inheritdoc/>
    public async Task HandleHostQuestionDeletedAsync(object data, Func<Guid, Task>? onQuestionDeleted = null)
    {
        await using var context = new SignalREventContext("HostQuestionDeleted", _logger);
        
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
            
            // SignalR serializes to camelCase
            var questionId = root.TryGetProperty("questionId", out var qIdProp) ? qIdProp.GetString() : null;
            var sessionId = root.TryGetProperty("sessionId", out var sIdProp) ? sIdProp.GetInt32() : 0;
            
            context.LogInfo("Parsed - QuestionId: {QuestionId}, SessionId: {SessionId}",
                questionId ?? "NULL", 
                sessionId);
            
            if (questionId != null)
            {
                var questionGuid = Guid.Parse(questionId);
                
                // Invoke callback to delete question from model
                if (onQuestionDeleted != null)
                {
                    await onQuestionDeleted(questionGuid);
                    context.LogInfo("Question deleted successfully");
                }
            }
            else
            {
                context.LogWarning("Invalid delete data (missing question ID)");
            }
        }
        catch (Exception ex)
        {
            context.LogError(ex, "Exception processing HostQuestionDeleted: {Message}", ex.Message);
        }
    }
}
