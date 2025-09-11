using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NoorCanvas.Models;

[Table("Sessions", Schema = "canvas")]
public class Session
{
    [Key]
    public long SessionId { get; set; }
    
    public Guid GroupId { get; set; }
    
    public DateTime? StartedAt { get; set; }
    
    public DateTime? EndedAt { get; set; }
    
    public DateTime? ExpiresAt { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public virtual ICollection<SessionLink> SessionLinks { get; set; } = new List<SessionLink>();
    public virtual ICollection<HostSession> HostSessions { get; set; } = new List<HostSession>();
    public virtual ICollection<Registration> Registrations { get; set; } = new List<Registration>();
    public virtual ICollection<SharedAsset> SharedAssets { get; set; } = new List<SharedAsset>();
    public virtual ICollection<Annotation> Annotations { get; set; } = new List<Annotation>();
    public virtual ICollection<Question> Questions { get; set; } = new List<Question>();
}
