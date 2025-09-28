using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NoorCanvas.Models.Simplified;

[Table("Sessions", Schema = "canvas")]
public class Session
{
    /// <summary>
    /// Auto-generated Canvas SessionId - primary key (not the KSESSIONS database SessionId)
    /// </summary>
    [Key]
    public long SessionId { get; set; }

    /// <summary>
    /// Album/Group identifier from KSESSIONS database (formerly GroupId)
    /// </summary>
    public Guid AlbumId { get; set; }

    // HostAuthToken removed: deprecated in favor of embedded HostToken (8-char) and GUID-based HostToken flows.

    [Required, MaxLength(8)]
    public string HostToken { get; set; } = string.Empty;

    [Required, MaxLength(8)]
    public string UserToken { get; set; } = string.Empty;

    // Title removed - fetch from KSESSIONS_DEV.dbo.Sessions.SessionName via SessionId
    // [MaxLength(200)]
    // public string? Title { get; set; }

    // Description removed - fetch from KSESSIONS_DEV.dbo.Sessions.Description via SessionId
    // [MaxLength(500)]
    // public string? Description { get; set; }

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

    // Host Session Opener custom scheduling fields - Issue sessionopener
    [MaxLength(20)]
    public string? ScheduledDate { get; set; }    // Date: 09/28/2025 (stored as string from form)
    
    [MaxLength(20)] 
    public string? ScheduledTime { get; set; }    // Time: 6:00 AM (stored as string from form)
    
    [MaxLength(10)]
    public string? ScheduledDuration { get; set; } // Duration: 60 (minutes, stored as string from form)

    // REMOVED: Token-related columns that were unused in business logic
    // - TokenExpiresAt (separate from ExpiresAt, all null in data)
    // - TokenAccessCount (not referenced in API logic)  
    // - TokenCreatedByIp (not used in validation)
    // - TokenLastAccessedAt (not actively updated)

    // Navigation properties
    public virtual ICollection<Participant> Participants { get; set; } = new List<Participant>();
    public virtual ICollection<SessionData> SessionData { get; set; } = new List<SessionData>();
}