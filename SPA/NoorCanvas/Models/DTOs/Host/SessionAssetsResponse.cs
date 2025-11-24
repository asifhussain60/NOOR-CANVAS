namespace NoorCanvas.Models.DTOs.Host;

/// <summary>
/// [REFACTOR:Phase1] Session assets API response
/// Extracted from HostControlPanel.razor for reusability
/// </summary>
public class SessionAssetsResponse
{
    public bool Success { get; set; }
    public string? Message { get; set; }
    public List<SessionAssetDto> Assets { get; set; } = new();
    public int TotalCount { get; set; }
}
