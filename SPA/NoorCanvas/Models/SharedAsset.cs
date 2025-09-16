using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NoorCanvas.Models;

[Table("SharedAssets", Schema = "canvas")]
public class SharedAsset
{
    [Key]
    public long AssetId { get; set; }

    [Required]
    public long SessionId { get; set; }

    public DateTime SharedAt { get; set; } = DateTime.UtcNow;

    [MaxLength(50)]
    public string? AssetType { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string? AssetData { get; set; }

    // Navigation properties
    [ForeignKey(nameof(SessionId))]
    public virtual Session Session { get; set; } = null!;
}
