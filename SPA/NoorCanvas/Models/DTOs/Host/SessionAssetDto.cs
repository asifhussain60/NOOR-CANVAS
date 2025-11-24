namespace NoorCanvas.Models.DTOs.Host;

/// <summary>
/// [REFACTOR:Phase1] Session asset data transfer object
/// Extracted from HostControlPanel.razor for reusability
/// </summary>
public class SessionAssetDto
{
    public long AssetId { get; set; }
    public string AssetType { get; set; } = string.Empty;
    public string AssetSelector { get; set; } = string.Empty;
    public int? Position { get; set; }
    public bool IsShared { get; set; }
    public DateTime? SharedAt { get; set; }
}
