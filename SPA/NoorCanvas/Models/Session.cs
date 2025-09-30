using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NoorCanvas.Models;

/// <summary>
/// Represents a collaborative session in the NOOR Canvas application.
/// Manages session data, participant tracking, and content sharing for real-time collaboration.
/// </summary>
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

    // HostAuthToken removed: deprecated in favor of friendly HostToken (8-char) and GUID-based HostToken flows.

    [StringLength(200)]
    public string? Title { get; set; }

    [StringLength(1000)]
    public string? Description { get; set; }

    [StringLength(50)]
    public string? Status { get; set; } = "Created";

    public int? ParticipantCount { get; set; } = 0;

    public int? MaxParticipants { get; set; }

    public DateTime? StartedAt { get; set; }

    public DateTime? EndedAt { get; set; }

    public DateTime? ExpiresAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime ModifiedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual ICollection<SessionLink> SessionLinks { get; set; } = new List<SessionLink>();
    public virtual ICollection<HostSession> HostSessions { get; set; } = new List<HostSession>();
    public virtual ICollection<Registration> Registrations { get; set; } = new List<Registration>();
    public virtual ICollection<SharedAsset> SharedAssets { get; set; } = new List<SharedAsset>();
    public virtual ICollection<Annotation> Annotations { get; set; } = new List<Annotation>();
    public virtual ICollection<Question> Questions { get; set; } = new List<Question>();
    public virtual ICollection<SessionParticipant> SessionParticipants { get; set; } = new List<SessionParticipant>();
}
