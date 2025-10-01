using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NoorCanvas.Models.KSESSIONS
{
    /// <summary>
    /// KSESSIONS SessionTranscripts entity - represents transcript content available for annotation
    /// Maps to KSESSIONS_DEV.dbo.SessionTranscripts table.
    /// </summary>
    [Table("SessionTranscripts", Schema = "dbo")]
    public class KSessionsSessionTranscript
    {
        [Key]
        public int TranscriptId { get; set; }

        [Required]
        public int SessionId { get; set; }

        /// <summary>
        /// Gets or sets transcript content in HTML format with Arabic text support
        /// Maps to nvarchar(MAX) field in database.
        /// </summary>
        public string? Transcript { get; set; }

        /// <summary>
        /// Gets or sets when transcript was originally created.
        /// </summary>
        public DateTime? CreatedDate { get; set; }

        /// <summary>
        /// Gets or sets when transcript was last modified.
        /// </summary>
        public DateTime? ChangedDate { get; set; }

        // Navigation property to Session
        public virtual KSessionsSession Session { get; set; } = null!;
    }
}
