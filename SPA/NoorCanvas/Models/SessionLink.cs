using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NoorCanvas.Models;

[Table("SessionLinks", Schema = "canvas")]
public class SessionLink
{
    [Key]
    public long LinkId { get; set; }
    
    [Required]
    public long SessionId { get; set; }
    
    [Required]
    public Guid Guid { get; set; }
    
    public byte State { get; set; } = 1; // 1=Active, 0=Expired
    
    public DateTime? LastUsedAt { get; set; }
    
    public int UseCount { get; set; } = 0;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    [ForeignKey(nameof(SessionId))]
    public virtual Session Session { get; set; } = null!;
}
