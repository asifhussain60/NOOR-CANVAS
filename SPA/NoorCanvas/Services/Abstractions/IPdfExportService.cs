using System.Threading.Tasks;

namespace NoorCanvas.Services.Abstractions
{
    /// <summary>
    /// Service interface for PDF export functionality.
    /// Follows SOLID ISP: Focused interface with only export-related methods.
    /// </summary>
    public interface IPdfExportService
    {
        /// <summary>
        /// Exports canvas content to PDF format.
        /// </summary>
        /// <param name="sessionId">The session ID containing the canvas content</param>
        /// <param name="canvasType">Type of canvas (e.g., "transcript", "asset")</param>
        /// <returns>PDF file as byte array</returns>
        Task<byte[]> ExportCanvasToPdfAsync(int sessionId, string canvasType);

        /// <summary>
        /// Validates if a session can be exported to PDF.
        /// </summary>
        /// <param name="sessionId">The session ID to validate</param>
        /// <returns>Validation result with success status and any error messages</returns>
        Task<PdfExportResult> ValidateExportAsync(int sessionId);
    }

    /// <summary>
    /// Result of PDF export validation.
    /// </summary>
    public class PdfExportResult
    {
        public bool Success { get; set; }
        public string? ErrorMessage { get; set; }
        public bool HasContent { get; set; }
        public bool SessionExists { get; set; }
    }
}
