using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NoorCanvas.Models.KSESSIONS
{
    /// <summary>
    /// Groups (Albums) from KSESSIONS database - Islamic content collections
    /// Maps to KSESSIONS.dbo.Groups table.
    /// </summary>
    [Table("Groups", Schema = "dbo")]
    public class KSessionsGroup
    {
        [Key]
        [Column("GroupID")]
        public int GroupId { get; set; }

        [Column("GroupName")]
        [StringLength(255)]
        public string GroupName { get; set; } = string.Empty;

        [Column("GroupImage")]
        [StringLength(255)]
        public string? GroupImage { get; set; }

        [Column("GroupDescription")]
        public string? GroupDescription { get; set; }

        [Column("Syllabus")]
        public string? Syllabus { get; set; }

        [Column("SpeakerID")]
        public int? SpeakerId { get; set; }

        [Column("IsCompleted")]
        public bool? IsCompleted { get; set; }

        [Column("IsActive")]
        public bool? IsActive { get; set; }

        [Column("CreatedDate")]
        public DateTime? CreatedDate { get; set; }

        [Column("ChangedDate")]
        public DateTime? ChangedDate { get; set; }

        // Navigation properties
        public virtual ICollection<KSessionsCategory> Categories { get; set; } = new List<KSessionsCategory>();
        public virtual ICollection<KSessionsSession> Sessions { get; set; } = new List<KSessionsSession>();
    }

    /// <summary>
    /// Categories from KSESSIONS database - Subdivisions within Groups
    /// Maps to KSESSIONS.dbo.Categories table.
    /// </summary>
    [Table("Categories", Schema = "dbo")]
    public class KSessionsCategory
    {
        [Key]
        [Column("CategoryID")]
        public int CategoryId { get; set; }

        [Column("CategoryName")]
        [StringLength(255)]
        public string CategoryName { get; set; } = string.Empty;

        [Column("GroupID")]
        public int GroupId { get; set; }

        [Column("IsActive")]
        public bool? IsActive { get; set; }

        [Column("CreatedDate")]
        public DateTime? CreatedDate { get; set; }

        [Column("ChangedDate")]
        public DateTime? ChangedDate { get; set; }

        [Column("SortOrder")]
        public int? SortOrder { get; set; }

        // Navigation properties
        [ForeignKey("GroupId")]
        public virtual KSessionsGroup Group { get; set; } = null!;

        public virtual ICollection<KSessionsSession> Sessions { get; set; } = new List<KSessionsSession>();
    }

    /// <summary>
    /// Sessions from KSESSIONS database - Individual Islamic learning sessions
    /// Maps to KSESSIONS.dbo.Sessions table.
    /// </summary>
    [Table("Sessions", Schema = "dbo")]
    public class KSessionsSession
    {
        [Key]
        [Column("SessionID")]
        public int SessionId { get; set; }

        [Column("GroupID")]
        public int GroupId { get; set; }

        [Column("Sequence")]
        public int? Sequence { get; set; }

        [Column("CategoryID")]
        public int CategoryId { get; set; }

        [Column("SessionName")]
        [StringLength(500)]
        public string SessionName { get; set; } = string.Empty;

        [Column("Description")]
        public string? Description { get; set; }

        [Column("SessionDate")]
        public DateTime? SessionDate { get; set; }

        [Column("MediaPath")]
        [StringLength(500)]
        public string? MediaPath { get; set; }

        [Column("SpeakerID")]
        public int? SpeakerId { get; set; }

        [Column("DeliveryRating")]
        public int? DeliveryRating { get; set; }

        [Column("CreatedDate")]
        public DateTime? CreatedDate { get; set; }

        [Column("ChangedDate")]
        public DateTime? ChangedDate { get; set; }

        [Column("IsActive")]
        public bool? IsActive { get; set; }

        [Column("ImageCount")]
        public int? ImageCount { get; set; }

        [Column("ImagesFolderPath")]
        [StringLength(500)]
        public string? ImagesFolderPath { get; set; }

        [Column("ImagesProcessedDate")]
        public DateTime? ImagesProcessedDate { get; set; }

        // Navigation properties
        [ForeignKey("GroupId")]
        public virtual KSessionsGroup Group { get; set; } = null!;

        [ForeignKey("CategoryId")]
        public virtual KSessionsCategory Category { get; set; } = null!;

        [ForeignKey("SpeakerId")]
        public virtual KSessionsSpeaker? Speaker { get; set; }
    }

    /// <summary>
    /// Speakers from KSESSIONS database - Session instructors/presenters
    /// Maps to KSESSIONS.dbo.Speakers table.
    /// </summary>
    [Table("Speakers", Schema = "dbo")]
    public class KSessionsSpeaker
    {
        [Key]
        [Column("SpeakerID")]
        public int SpeakerId { get; set; }

        [Column("SpeakerName")]
        [StringLength(150)]
        public string SpeakerName { get; set; } = string.Empty;

        // Navigation properties
        public virtual ICollection<KSessionsSession> Sessions { get; set; } = new List<KSessionsSession>();
        public virtual ICollection<KSessionsGroup> Groups { get; set; } = new List<KSessionsGroup>();
    }
}
