using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NoorCanvas.Models.Simplified;

/// <summary>
/// SessionAssetsLookup table for flexible asset detection and class-based tracking.
/// Supports partial CSS class matching and consolidated instance counting.
/// </summary>
[Table("SessionAssetsLookup", Schema = "canvas")]
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
    /// Primary CSS class for this asset type (e.g., 'imgResponsive', 'ayah-card', 'inserted-hadees')
    /// Used for flexible class-based detection and targeting
    /// </summary>
    [Required, MaxLength(100)]
    public string AssetClass { get; set; } = string.Empty;

    /// <summary>
    /// Alternate CSS classes found with this asset (comma-separated)
    /// Supports flexible matching (e.g., 'fr-fic,fr-dib,fr-bordered')
    /// </summary>
    [MaxLength(500)]
    public string? AlternateClasses { get; set; }

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
    /// Number of instances of this asset class found in the transcript
    /// </summary>
    public int InstanceCount { get; set; } = 1;

    /// <summary>
    /// Match confidence score for flexible class detection (1-5)
    /// Higher scores indicate better class matches
    /// </summary>
    public int ClassScore { get; set; } = 1;

    /// <summary>
    /// How many times this asset class has been shared by host
    /// </summary>
    public int SharedCount { get; set; } = 0;

    /// <summary>
    /// Unique identifier for sharing this asset via SignalR
    /// </summary>
    [MaxLength(100)]
    public string? ShareId { get; set; }

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
    // Core Islamic content assets
    public const string AyahCard = "ayah-card";
    public const string InsertedHadees = "inserted-hadees";
    public const string EtymologyCard = "etymology-card";
    public const string EtymologyDerivativeCard = "etymology-derivative-card";

    // Layout and styling assets
    public const string EsotericBlock = "esotericBlock";
    public const string VerseContainer = "verse-container";
    public const string TableAsset = "table";
    public const string ImageResponsive = "imgResponsive";

    /// <summary>
    /// All supported asset types based on Session 212 analysis
    /// </summary>
    public static readonly string[] All =
    {
        AyahCard,
        InsertedHadees,
        EtymologyCard,
        EtymologyDerivativeCard,
        EsotericBlock,
        VerseContainer,
        TableAsset,
        ImageResponsive
    };

    /// <summary>
    /// CSS patterns for detecting each asset type (legacy - flexible detection now handles this)
    /// </summary>
    public static readonly Dictionary<string, string> DetectionPatterns = new()
    {
        { AyahCard, @"<div[^>]*class=""[^""]*ayah-card[^""]*""[^>]*>" },
        { InsertedHadees, @"<div[^>]*class=""[^""]*(?:inserted-hadees|ks-ahadees-container|ahadees-content)[^""]*""[^>]*>" },
        { EtymologyCard, @"<div[^>]*class=""[^""]*etymology-card[^""]*""[^>]*>" },
        { EtymologyDerivativeCard, @"<div[^>]*class=""[^""]*etymology-derivative-card[^""]*""[^>]*>" },
        { EsotericBlock, @"<div[^>]*class=""[^""]*esotericBlock[^""]*""[^>]*>" },
        { VerseContainer, @"<div[^>]*class=""[^""]*verse-container[^""]*""[^>]*>" },
        { TableAsset, @"<table[^>]*style=""[^""]*width:\s*100%[^""]*""[^>]*>" },
        { ImageResponsive, @"<img[^>]*class=""[^""]*imgResponsive[^""]*""[^>]*>" }
    };
}

/// <summary>
/// DTO for API responses - lighter version of SessionAsset
/// </summary>
public class SessionAssetDto
{
    public long AssetId { get; set; }
    public string AssetClass { get; set; } = string.Empty;
    public string? AlternateClasses { get; set; }
    public int InstanceCount { get; set; }
    public int ClassScore { get; set; }
    public int? Position { get; set; }
    public bool IsShared { get; set; }
    public DateTime? SharedAt { get; set; }
    public int SharedCount { get; set; }

    /// <summary>
    /// Convert from entity to DTO
    /// </summary>
    public static SessionAssetDto FromEntity(SessionAsset asset)
    {
        return new SessionAssetDto
        {
            AssetId = asset.AssetId,
            AssetClass = asset.AssetClass,
            AlternateClasses = asset.AlternateClasses,
            InstanceCount = asset.InstanceCount,
            ClassScore = asset.ClassScore,
            Position = asset.Position,
            IsShared = asset.SharedAt.HasValue,
            SharedAt = asset.SharedAt,
            SharedCount = asset.SharedCount
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