using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NoorCanvas.Models.Simplified;

/// <summary>
/// SessionAssets lookup table for efficient asset detection and share button injection.
/// Replaces client-side regex parsing with server-side asset catalog.
/// </summary>
[Table("SessionAssets", Schema = "canvas")]
public class SessionAsset
{
    /// <summary>
    /// Primary key - unique asset identifier
    /// </summary>
    [Key]
    public long AssetId { get; set; }
    
    /// <summary>
    /// Foreign key to Sessions table
    /// </summary>
    [Required]
    public long SessionId { get; set; }
    
    /// <summary>
    /// Type of Islamic content asset (etymology-card, ahadees-container, ayah-card, image-asset, table-asset)
    /// </summary>
    [Required, MaxLength(50)]
    public string AssetType { get; set; } = string.Empty;
    
    /// <summary>
    /// Unique selector for targeting this asset (e.g., 'ayah-2-255', 'hadees-bukhari-123')
    /// Used for data-asset-id injection and JavaScript targeting
    /// </summary>
    [Required, MaxLength(200)]
    public string AssetSelector { get; set; } = string.Empty;
    
    /// <summary>
    /// Position/order within the transcript for reliable button injection
    /// Lower numbers = earlier in transcript
    /// </summary>
    public int? Position { get; set; }
    
    /// <summary>
    /// CSS regex pattern used to detect this asset type (for re-targeting)
    /// Stored for reliability in case HTML structure changes
    /// </summary>
    [MaxLength(500)]
    public string? CssPattern { get; set; }
    
    /// <summary>
    /// When this asset was shared by host (NULL = detected but not shared yet)
    /// </summary>
    public DateTime? SharedAt { get; set; }
    
    /// <summary>
    /// Soft delete flag - false means asset should be ignored
    /// </summary>
    public bool IsActive { get; set; } = true;
    
    /// <summary>
    /// When this asset was first detected in the transcript
    /// </summary>
    public DateTime DetectedAt { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// When this record was created
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// Who created this asset record (optional)
    /// </summary>
    [MaxLength(100)]
    public string? CreatedBy { get; set; }
    
    // Navigation properties
    /// <summary>
    /// Navigation property to parent Session
    /// </summary>
    [ForeignKey(nameof(SessionId))]
    public virtual Session Session { get; set; } = null!;
    
    // Helper properties
    /// <summary>
    /// Computed property - true if asset has been shared by host
    /// </summary>
    [NotMapped]
    public bool IsShared => SharedAt.HasValue;
    
    /// <summary>
    /// Computed property - generates data-asset-id value for HTML injection
    /// </summary>
    [NotMapped]
    public string DataAssetId => $"asset-{AssetId}";
    
    /// <summary>
    /// Computed property - generates CSS selector for JavaScript targeting
    /// </summary>
    [NotMapped]
    public string CssSelector => $"[data-asset-id='{DataAssetId}']";
}

/// <summary>
/// Constants for asset types - ensures consistency across the application
/// </summary>
public static class AssetTypes
{
    public const string EtymologyCard = "etymology-card";
    public const string AhadeesContainer = "ahadees-container"; 
    public const string AyahCard = "ayah-card";
    public const string ImageAsset = "image-asset";
    public const string TableAsset = "table-asset";
    
    /// <summary>
    /// All supported asset types
    /// </summary>
    public static readonly string[] All = 
    {
        EtymologyCard,
        AhadeesContainer,
        AyahCard,
        ImageAsset,
        TableAsset
    };
    
    /// <summary>
    /// CSS patterns for detecting each asset type
    /// </summary>
    public static readonly Dictionary<string, string> DetectionPatterns = new()
    {
        { EtymologyCard, @"<div[^>]*class=""[^""]*etymology-derivative-card[^""]*""[^>]*>" },
        { AhadeesContainer, @"<div[^>]*class=""[^""]*(?:inserted-hadees|ks-ahadees-container|ahadees-content)[^""]*""[^>]*>" },
        { AyahCard, @"<div[^>]*class=""[^""]*ayah-card[^""]*""[^>]*>" },
        { ImageAsset, @"<img[^>]*(?:src=""[^""]*""[^>]*|[^>]*)\s*/?>" },
        { TableAsset, @"<table[^>]*class=""[^""]*(?:islamic-table|content-table|comparison-table)[^""]*""[^>]*>" }
    };
}

/// <summary>
/// DTO for API responses - lighter version of SessionAsset
/// </summary>
public class SessionAssetDto
{
    public long AssetId { get; set; }
    public string AssetType { get; set; } = string.Empty;
    public string AssetSelector { get; set; } = string.Empty;
    public int? Position { get; set; }
    public bool IsShared { get; set; }
    public DateTime? SharedAt { get; set; }
    
    /// <summary>
    /// Convert from entity to DTO
    /// </summary>
    public static SessionAssetDto FromEntity(SessionAsset asset)
    {
        return new SessionAssetDto
        {
            AssetId = asset.AssetId,
            AssetType = asset.AssetType,
            AssetSelector = asset.AssetSelector,
            Position = asset.Position,
            IsShared = asset.IsShared,
            SharedAt = asset.SharedAt
        };
    }
}

/// <summary>
/// Response wrapper for asset collections
/// </summary>
public class SessionAssetsResponse
{
    public long SessionId { get; set; }
    public int TotalAssets { get; set; }
    public int SharedAssets { get; set; }
    public Dictionary<string, int> AssetsByType { get; set; } = new();
    public List<SessionAssetDto> Assets { get; set; } = new();
    public string? RequestId { get; set; }
}