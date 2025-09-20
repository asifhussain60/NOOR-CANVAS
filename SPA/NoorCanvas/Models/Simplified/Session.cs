using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NoorCanvas.Models.Simplified;

[Table("Sessions", Schema = "canvas")]
public class Session
{
    /// <summary>
    /// KSESSIONS database SessionId - now the primary key for consistent referencing
    /// </summary>
    [Key]
    public long SessionId { get; set; }
    
    /// <summary>
    /// Album/Group identifier from KSESSIONS database (formerly GroupId)
    /// </summary>
    public Guid AlbumId { get; set; }
    
    /// <summary>
    /// Host authentication token for secure access (formerly HostGuid)  
    /// </summary>
    [StringLength(100)]
    public string HostAuthToken { get; set; } = string.Empty;
    
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
    
    // CreatedBy property removed - not present in existing table structure
    [NotMapped]
    public string? CreatedBy { get; set; }
    
    // Additional properties to match simplified database schema
    public DateTime? StartedAt { get; set; }
    public DateTime? EndedAt { get; set; }
    public DateTime ModifiedAt { get; set; } = DateTime.UtcNow;
    public int? MaxParticipants { get; set; }
    public int? ParticipantCount { get; set; }
    public DateTime? TokenExpiresAt { get; set; }
    public int TokenAccessCount { get; set; } = 0;
    [MaxLength(45)]
    public string? TokenCreatedByIp { get; set; }
    public DateTime? TokenLastAccessedAt { get; set; }
    
    // Navigation properties
    public virtual ICollection<Participant> Participants { get; set; } = new List<Participant>();
    public virtual ICollection<SessionData> SessionData { get; set; } = new List<SessionData>();
}