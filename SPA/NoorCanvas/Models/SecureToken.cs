using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NoorCanvas.Models;

[Table("SecureTokens", Schema = "canvas")]
public class SecureToken
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    public long SessionId { get; set; }

    [Required]
    [MaxLength(8)]
    [Column(TypeName = "varchar(8)")]
    public string HostToken { get; set; } = string.Empty;

    [Required]
    [MaxLength(8)]
    [Column(TypeName = "varchar(8)")]
    public string UserToken { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Required]
    public DateTime ExpiresAt { get; set; }

    public bool IsActive { get; set; } = true;

    public int AccessCount { get; set; } = 0;

    public DateTime? LastAccessedAt { get; set; }

    [MaxLength(45)]
    public string? CreatedByIp { get; set; }

    // Navigation properties
    [ForeignKey(nameof(SessionId))]
    public virtual Session Session { get; set; } = null!;
}
