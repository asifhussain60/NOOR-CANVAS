using NoorCanvas.Pages;

namespace NoorCanvas.Services.SignalR;

/// <summary>
/// [REFACTOR:Phase3] Service interface for SessionCanvas/TranscriptCanvas SignalR event handling
/// Extracted from inline handlers to eliminate ~900 lines of duplicated code
/// </summary>
public interface ISessionCanvasSignalRService
{
    /// <summary>
    /// Handle QuestionReceived event from SignalR hub
    /// Called when another participant submits a question
    /// </summary>
    /// <param name="data">Question data from SignalR (JSON object)</param>
    /// <param name="onQuestionAdded">Callback to add question to component model</param>
    Task HandleQuestionReceivedAsync(object data, Func<SessionCanvas.QuestionData, Task>? onQuestionAdded = null);
    
    /// <summary>
    /// Handle QuestionUpdated event from SignalR hub
    /// Called when a participant edits their question
    /// </summary>
    /// <param name="data">Updated question data from SignalR (JSON object)</param>
    /// <param name="onQuestionUpdated">Callback to update question in component model</param>
    Task HandleQuestionUpdatedAsync(object data, Func<SessionCanvas.QuestionData, Task>? onQuestionUpdated = null);
    
    /// <summary>
    /// Handle QuestionDeleted event from SignalR hub
    /// Called when a participant deletes their question
    /// </summary>
    /// <param name="data">Delete data from SignalR (JSON object)</param>
    /// <param name="onQuestionDeleted">Callback to remove question from component model</param>
    Task HandleQuestionDeletedAsync(object data, Func<string, string?, Task>? onQuestionDeleted = null);
    
    /// <summary>
    /// Handle VoteUpdateReceived event from SignalR hub
    /// Called when someone upvotes a question
    /// </summary>
    /// <param name="data">Vote data from SignalR (JSON object)</param>
    /// <param name="onVoteUpdated">Callback to update vote count in component model</param>
    Task HandleVoteUpdateAsync(object data, Func<string, int, Task>? onVoteUpdated = null);
    
    /// <summary>
    /// Handle AssetShared event from SignalR hub (OLD question-based pattern)
    /// Called when host shares a question as an asset
    /// </summary>
    /// <param name="data">Asset data from SignalR (JSON object)</param>
    /// <param name="onAssetShared">Callback to render asset in component</param>
    Task HandleAssetSharedAsync(object data, Func<string, Task>? onAssetShared = null);
    
    /// <summary>
    /// Handle AssetContentReceived event from SignalR hub (NEW KSESSIONS pattern)
    /// Called when host broadcasts asset HTML via PublishAssetContent
    /// </summary>
    /// <param name="htmlContent">Direct HTML content string from AssetSharingService</param>
    /// <param name="onAssetReceived">Callback to render asset in component</param>
    Task HandleAssetContentReceivedAsync(string htmlContent, Func<string, Task>? onAssetReceived = null);
    
    /// <summary>
    /// Handle TranscriptUpdated event from SignalR hub
    /// Called when host updates the transcript
    /// </summary>
    /// <param name="data">Transcript data from SignalR (JSON object or string)</param>
    /// <param name="onTranscriptUpdated">Callback to update transcript in component model</param>
    Task HandleTranscriptUpdatedAsync(object data, Func<string, Task>? onTranscriptUpdated = null);
    
    /// <summary>
    /// Handle SessionEnded event from SignalR hub
    /// Called when host ends the session
    /// </summary>
    /// <param name="data">Session end data from SignalR (JSON object)</param>
    /// <param name="onSessionEnded">Callback to handle session end (e.g., navigate away)</param>
    Task HandleSessionEndedAsync(object data, Func<int, Task>? onSessionEnded = null);
}
