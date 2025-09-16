using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NoorCanvas.Models;

[Table("AdminSessions", Schema = "canvas")]
public class AdminSession
{
    [Key]
    public long AdminSessionId { get; set; }

    [Required]
    [StringLength(100)]
    public string AdminGuid { get; set; } = string.Empty;

    [Required]
    [StringLength(128)]
    public string SessionToken { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime ExpiresAt { get; set; }

    public DateTime? LastUsedAt { get; set; }

    public bool IsActive { get; set; } = true;

    [StringLength(255)]
    public string? UserAgent { get; set; }

    [StringLength(45)]
    public string? IpAddress { get; set; }
}
