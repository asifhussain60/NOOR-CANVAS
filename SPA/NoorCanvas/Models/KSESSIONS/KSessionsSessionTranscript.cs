using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NoorCanvas.Models.KSESSIONS
{
    /// <summary>
    /// KSESSIONS SessionTranscripts entity - represents transcript content available for annotation
    /// Maps to KSESSIONS_DEV.dbo.SessionTranscripts table
    /// </summary>
    [Table("SessionTranscripts", Schema = "dbo")]
    public class KSessionsSessionTranscript
    {
        [Key]
        public int TranscriptId { get; set; }

        [Required]
        public int SessionId { get; set; }

        public DateTime? ChangedDate { get; set; }

        // Navigation property to Session
        public virtual KSessionsSession Session { get; set; } = null!;
    }
}
