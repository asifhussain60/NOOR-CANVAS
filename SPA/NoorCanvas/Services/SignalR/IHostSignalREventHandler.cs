using NoorCanvas.ViewModels;

namespace NoorCanvas.Services.SignalR;

/// <summary>
/// [REFACTOR:Phase2] Interface for handling SignalR events in Host Control Panel
/// Extracted from HostControlPanel.razor to separate event handling concerns
/// </summary>
public interface IHostSignalREventHandler
{
    /// <summary>
    /// Handle QuestionReceived event from SignalR hub
    /// Triggered when a participant submits a new question
    /// </summary>
    /// <param name="data">Question data as object (will be deserialized to QuestionDto)</param>
    /// <param name="onQuestionAdded">Callback to update UI with new question</param>
    Task HandleQuestionReceivedAsync(object data, Func<QuestionItem, Task>? onQuestionAdded = null);
    
    /// <summary>
    /// Handle TranscriptUpdated event from SignalR hub
    /// Triggered when session transcript is updated by host
    /// </summary>
    /// <param name="transcript">Updated transcript HTML content</param>
    /// <param name="onTranscriptUpdated">Callback to update UI with new transcript</param>
    Task HandleTranscriptUpdatedAsync(string transcript, Func<string, Task>? onTranscriptUpdated = null);
    
    /// <summary>
    /// Handle VoteUpdateReceived event from SignalR hub
    /// Triggered when a participant votes on a question
    /// </summary>
    /// <param name="questionText">Text of the question that received a vote</param>
    /// <param name="voteCount">New total vote count</param>
    /// <param name="onVoteUpdated">Callback to update UI with vote count</param>
    Task HandleVoteUpdateReceivedAsync(string questionText, int voteCount, Func<string, int, Task>? onVoteUpdated = null);
    
    /// <summary>
    /// Handle HostQuestionUpdated event from SignalR hub
    /// Triggered when host updates a question (e.g., marks as answered)
    /// </summary>
    /// <param name="data">Updated question data as object (will be deserialized)</param>
    /// <param name="onQuestionUpdated">Callback to update UI with modified question</param>
    Task HandleHostQuestionUpdatedAsync(object data, Func<QuestionItem, Task>? onQuestionUpdated = null);
    
    /// <summary>
    /// Handle HostQuestionDeleted event from SignalR hub
    /// Triggered when host deletes a question
    /// </summary>
    /// <param name="data">Delete data containing question ID</param>
    /// <param name="onQuestionDeleted">Callback to remove question from UI</param>
    Task HandleHostQuestionDeletedAsync(object data, Func<Guid, Task>? onQuestionDeleted = null);
}
