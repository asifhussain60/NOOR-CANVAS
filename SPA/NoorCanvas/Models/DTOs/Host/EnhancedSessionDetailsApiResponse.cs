namespace NoorCanvas.Models.DTOs.Host;

/// <summary>
/// [REFACTOR:Phase1] Enhanced session details from API
/// Extracted from HostControlPanel.razor for reusability
/// </summary>
public class EnhancedSessionDetailsApiResponse
{
    public bool Success { get; set; }
    public SessionDetailsDto? SessionDetails { get; set; }
}
