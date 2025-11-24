namespace NoorCanvas.Models.DTOs.Host;

/// <summary>
/// [REFACTOR:Phase1] Asset detection analysis result
/// Extracted from HostControlPanel.razor for reusability
/// </summary>
public class AssetDetectionResult
{
    public string SourceName { get; set; } = string.Empty;
    public List<DetectedAsset> DetectedAssets { get; set; } = new();
    public int TotalAssetsDetected { get; set; }
}

/// <summary>
/// [REFACTOR:Phase1] Information about a detected asset
/// </summary>
public class DetectedAsset
{
    public string AssetType { get; set; } = string.Empty;
    public string AssetId { get; set; } = string.Empty;
    public int InstanceCount { get; set; }
    public List<string> FoundInstances { get; set; } = new();
}
