namespace NoorCanvas.Models.DTOs.Host;

/// <summary>
/// [REFACTOR:Phase1] Detailed session information
/// Extracted from HostControlPanel.razor for reusability
/// </summary>
public class SessionDetailsDto
{
    public long SessionId { get; set; }
    public string? SessionName { get; set; }
    public string? SessionDescription { get; set; }
    public int? Duration { get; set; }
    public DateTime? ScheduledDate { get; set; }
    public DateTime? StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public string? Status { get; set; }
    public string? HostToken { get; set; }
    public string? UserToken { get; set; }
    public string? SessionTranscript { get; set; }
    public string? GroupName { get; set; }
    public string? CategoryName { get; set; }
    public string? SpeakerName { get; set; }
}
