using System.ComponentModel.DataAnnotations;

namespace NoorCanvas.Models.DTOs;

/// <summary>
/// DTO for session details from KSESSIONS database
/// Maps to combined KSessionsSession and KSessionsSessionTranscript data
/// </summary>
public class SessionDetailsDto
{
    public int SessionId { get; set; }
    public int GroupId { get; set; }
    public int CategoryId { get; set; }
    public string SessionName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime? SessionDate { get; set; }
    public string? MediaPath { get; set; }
    public int? SpeakerId { get; set; }
    public bool? IsActive { get; set; }
    public string? Transcript { get; set; }
    public DateTime? CreatedDate { get; set; }
    public DateTime? ChangedDate { get; set; }
    
    // Navigation data
    public string? GroupName { get; set; }
    public string? CategoryName { get; set; }
    public string? SpeakerName { get; set; }
}

/// <summary>
/// Response wrapper for enhanced session details API with transcript
/// </summary>
public class EnhancedSessionDetailsResponse
{
    public bool Success { get; set; }
    public string? Message { get; set; }
    public SessionDetailsDto? Session { get; set; }
    public int TotalCount { get; set; } = 0;
}