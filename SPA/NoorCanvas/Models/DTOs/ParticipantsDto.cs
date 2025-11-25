using System;
using System.Collections.Generic;

namespace NoorCanvas.Models.DTOs;

/// <summary>
/// [REFACTOR:Week2] Display model for participant in UI
/// Extracted from SessionCanvas/TranscriptCanvas/SessionWaiting code-behind to eliminate duplication
/// </summary>
public class ParticipantData
{
    public string UserId { get; set; } = "";
    public string Name { get; set; } = "";
    public string Country { get; set; } = "";
    public string Flag { get; set; } = "";
}

/// <summary>
/// [REFACTOR:Week2] API response wrapper for participant lists
/// Extracted from SessionCanvas/TranscriptCanvas/SessionWaiting to eliminate duplicate DTOs
/// </summary>
public class ParticipantsResponse
{
    public int SessionId { get; set; }
    public string? Token { get; set; }
    public int ParticipantCount { get; set; }
    public List<ParticipantApiData>? Participants { get; set; }
    public string? RequestId { get; set; }
}

/// <summary>
/// [REFACTOR:Week2] API representation of a participant with server-provided details
/// </summary>
public class ParticipantApiData
{
    public string UserId { get; set; } = "";
    public string DisplayName { get; set; } = "";
    public DateTime JoinedAt { get; set; }
    public string Role { get; set; } = "";
    public string? City { get; set; }
    public string? Country { get; set; }
    public string? CountryFlag { get; set; }
}

/// <summary>
/// [REFACTOR:Week2] Service operation result for LoadParticipantsAsync
/// Contains mapped ParticipantData ready for UI binding
/// </summary>
public class ParticipantsResult
{
    public bool Success { get; set; }
    public List<ParticipantData>? Participants { get; set; }
    public int StatusCode { get; set; }
    public string? ErrorMessage { get; set; }
}

/// <summary>
/// [REFACTOR:Week2] Display participant model already exists in ViewModels.ParticipantData
/// This result wraps the current participant lookup
/// </summary>
public class CurrentParticipantResult
{
    public bool Success { get; set; }
    public ParticipantData? CurrentParticipant { get; set; }
    public string? CurrentUserGuid { get; set; }
    public int StatusCode { get; set; }
    public string? ErrorMessage { get; set; }
}
