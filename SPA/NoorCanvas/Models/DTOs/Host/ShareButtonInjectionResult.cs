namespace NoorCanvas.Models.DTOs.Host;

/// <summary>
/// [REFACTOR:Phase1] Result of share button injection test
/// Extracted from HostControlPanel.razor for test verification
/// </summary>
public class ShareButtonInjectionResult
{
    public bool Success { get; set; }
    public int TotalShareButtonsInjected { get; set; }
    public int TotalDataAssetIds { get; set; }
    public List<string> InjectedAssetTypes { get; set; } = new();
    public string TransformedHtml { get; set; } = string.Empty;
}
