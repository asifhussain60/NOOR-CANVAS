using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NoorCanvas.Models.Simplified;

[Table("Sessions", Schema = "canvas")]
public class Session
{
    [Key]
    public int SessionId { get; set; }
    
    [Required, MaxLength(8)]
    public string HostToken { get; set; } = string.Empty;
    
    [Required, MaxLength(8)] 
    public string UserToken { get; set; } = string.Empty;
    
    [MaxLength(200)]
    public string? Title { get; set; }
    
    [MaxLength(500)]
    public string? Description { get; set; }
    
    [MaxLength(20)]
    public string Status { get; set; } = "Active";
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ExpiresAt { get; set; }
    
    [MaxLength(100)]
    public string? CreatedBy { get; set; }
    
    // Navigation properties
    public virtual ICollection<Participant> Participants { get; set; } = new List<Participant>();
    public virtual ICollection<SessionData> SessionData { get; set; } = new List<SessionData>();
}