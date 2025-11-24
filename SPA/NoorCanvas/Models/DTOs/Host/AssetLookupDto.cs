namespace NoorCanvas.Models.DTOs.Host;

/// <summary>
/// [REFACTOR:Phase1] Asset lookup definition from database
/// Extracted from HostControlPanel.razor for reusability
/// </summary>
public class AssetLookupDto
{
    public long AssetTypeId { get; set; }
    public string AssetTypeName { get; set; } = string.Empty;
    public string CssSelector { get; set; } = string.Empty;
}
