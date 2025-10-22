namespace NoorCanvas.Services.Security;

/// <summary>
/// Service to detect and prevent production application from connecting to development database.
/// Critical security measure to prevent data corruption and exposure.
/// </summary>
public interface IDatabaseEnvironmentGuardService
{
    /// <summary>
    /// Check if production app is connecting to development database (security violation).
    /// </summary>
    /// <param name="currentUrl">Current request URL (from NavigationManager.Uri)</param>
    /// <returns>Mismatch details if violation detected, null if safe</returns>
    EnvironmentMismatchInfo? CheckEnvironmentMismatch(string currentUrl);
}

/// <summary>
/// Details about a detected database environment mismatch (production app + dev database).
/// </summary>
public class EnvironmentMismatchInfo
{
    /// <summary>
    /// Hostname that triggered the violation (e.g., "noorcanvas.servehttp.com")
    /// </summary>
    public string Hostname { get; set; } = "";
    
    /// <summary>
    /// Expected database name for this hostname (e.g., "KSESSIONS" for production)
    /// </summary>
    public string ExpectedDatabase { get; set; } = "KSESSIONS";
    
    /// <summary>
    /// Actual database name detected in connection string (e.g., "KSESSIONS_DEV")
    /// </summary>
    public string ActualDatabase { get; set; } = "";
    
    /// <summary>
    /// Severity level of the mismatch (always "CRITICAL" for production + dev database)
    /// </summary>
    public string Severity { get; set; } = "CRITICAL";
}
