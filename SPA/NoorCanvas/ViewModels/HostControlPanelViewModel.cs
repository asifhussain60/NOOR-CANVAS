using System;
using System.Collections.Generic;

namespace NoorCanvas.ViewModels
{
    /// <summary>
    /// ViewModel for HostControlPanel containing session details and UI state.
    /// </summary>
    public class HostControlPanelViewModel
    {
        public string? LogoText { get; set; }
        public string? SessionName { get; set; }
        public string? SessionDescription { get; set; }
        public string? SessionStatus { get; set; }
        public string? SessionTranscript { get; set; }
        public string? TransformedTranscript { get; set; }
        public List<QuestionItem>? Questions { get; set; }
        public bool UserCopied { get; set; }

        // Scheduling fields from Host Session Opener
        public string? ScheduledDate { get; set; }    // Date: 09/28/2025
        public string? ScheduledTime { get; set; }    // Time: 6:00 AM
        public string? ScheduledDuration { get; set; } // Duration: 60 minutes
    }

    /// <summary>
    /// Question item model for Q&A panel.
    /// </summary>
    public class QuestionItem
    {
        public Guid Id { get; set; }
        public string Text { get; set; } = "";
        public bool IsAnswered { get; set; }
        public int VoteCount { get; set; }
        public string UserName { get; set; } = "";
        public string CreatedBy { get; set; } = "";
        public DateTime CreatedAt { get; set; }
    }

    /// <summary>
    /// API Response Models for session data.
    /// </summary>
    public class SessionDetailsResponse
    {
        // dbo Schema (KSESSIONS primary content source)
        public int SessionId { get; set; }
        public int GroupId { get; set; }
        public int CategoryId { get; set; }
        public string? SessionName { get; set; }
        public string? Description { get; set; }

        // dbo Schema (Session Transcript)
        public string? Transcript { get; set; }
        public DateTime? TranscriptCreatedDate { get; set; }
        public DateTime? TranscriptChangedDate { get; set; }
        public bool HasTranscript { get; set; }

        // canvas Schema (Session management)
        public int? CanvasSessionId { get; set; }
        public string? CanvasTitle { get; set; }
        public string? CanvasDescription { get; set; }
        public string? Status { get; set; }
        public int ParticipantCount { get; set; }
        public int? MaxParticipants { get; set; }
        public string? HostGuid { get; set; }
        public DateTime? StartedAt { get; set; }
        public DateTime? EndedAt { get; set; }
        public DateTime? CanvasCreatedAt { get; set; }
        public DateTime? CanvasModifiedAt { get; set; }

        // Derived information
        public bool IsCanvasSessionCreated { get; set; }

        // Host Session Opener scheduling fields
        public string? ScheduledDate { get; set; }    // Date: 09/28/2025
        public string? ScheduledTime { get; set; }    // Time: 6:00 AM  
        public string? ScheduledDuration { get; set; } // Duration: 60 minutes
    }

    /// <summary>
    /// Response model for user token API endpoint.
    /// </summary>
    public class UserTokenResponse
    {
        public string? UserToken { get; set; }
        public int SessionId { get; set; }
        public bool IsActive { get; set; }
        public DateTime? ExpiresAt { get; set; }
    }

    /// <summary>
    /// Response model for questions API endpoint.
    /// </summary>
    public class GetQuestionsApiResponse
    {
        public bool Success { get; set; }
        public List<QuestionApiItem>? Questions { get; set; }
        public int Count { get; set; }
        public string? RequestId { get; set; }
    }

    /// <summary>
    /// Question item from API.
    /// </summary>
    public class QuestionApiItem
    {
        public string? QuestionId { get; set; }
        public int Id { get; set; }
        public string? Text { get; set; }
        public string? UserName { get; set; }
        public string? CreatedBy { get; set; }
        public int Votes { get; set; }
        public bool IsAnswered { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}