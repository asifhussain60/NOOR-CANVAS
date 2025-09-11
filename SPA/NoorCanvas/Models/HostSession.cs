using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NoorCanvas.Models;

[Table("HostSessions", Schema = "canvas")]
public class HostSession
{
    [Key]
    public long HostSessionId { get; set; }
    
    [Required]
    public long SessionId { get; set; }
    
    [Required]
    [MaxLength(128)]
    public string HostGuidHash { get; set; } = string.Empty;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime? ExpiresAt { get; set; }
    
    public DateTime? LastUsedAt { get; set; }
    
    [MaxLength(128)]
    public string? CreatedBy { get; set; }
    
    public DateTime? RevokedAt { get; set; }
    
    [MaxLength(128)]
    public string? RevokedBy { get; set; }
    
    public bool IsActive { get; set; } = true;
    
    // Navigation properties
    [ForeignKey(nameof(SessionId))]
    public virtual Session Session { get; set; } = null!;
}
