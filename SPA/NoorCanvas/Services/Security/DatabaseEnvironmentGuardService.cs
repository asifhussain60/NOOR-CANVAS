using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;

namespace NoorCanvas.Services.Security;

/// <summary>
/// [SECURITY-GUARD:hp-db-guard] Prevents production app from connecting to development database.
/// Critical security measure added 2025-10-22 to prevent data corruption and exposure.
/// </summary>
public class DatabaseEnvironmentGuardService : IDatabaseEnvironmentGuardService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<DatabaseEnvironmentGuardService> _logger;
    
    // Production hostname constant (domain only, no protocol/port)
    private const string PRODUCTION_HOSTNAME = "noorcanvas.servehttp.com";
    private const string PRODUCTION_DATABASE_NAME = "KSESSIONS";
    private const string DEVELOPMENT_DATABASE_NAME = "KSESSIONS_DEV";
    
    public DatabaseEnvironmentGuardService(
        IConfiguration configuration,
        ILogger<DatabaseEnvironmentGuardService> logger)
    {
        _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }
    
    /// <summary>
    /// [SECURITY-GUARD:hp-db-guard] Check if production app is connecting to development database.
    /// Detection logic:
    /// 1. Parse hostname from currentUrl
    /// 2. Check if hostname contains "noorcanvas.servehttp.com" (production)
    /// 3. Extract database name from connection string
    /// 4. If production hostname AND database contains "KSESSIONS_DEV" → VIOLATION
    /// 5. Log all checks for security audit trail
    /// </summary>
    public EnvironmentMismatchInfo? CheckEnvironmentMismatch(string currentUrl)
    {
        if (string.IsNullOrWhiteSpace(currentUrl))
        {
            _logger.LogWarning("[SECURITY-GUARD:hp-db-guard] CheckEnvironmentMismatch called with null/empty URL");
            return null;
        }
        
        var requestId = Guid.NewGuid().ToString("N")[..8];
        _logger.LogInformation("[SECURITY-GUARD:hp-db-guard] [{RequestId}] Starting environment mismatch check for URL: {Url}", 
            requestId, currentUrl);
        
        try
        {
            // Step 1: Parse hostname from URL
            var uri = new Uri(currentUrl);
            var hostname = uri.Host.ToLowerInvariant();
            
            _logger.LogDebug("[SECURITY-GUARD:hp-db-guard] [{RequestId}] Parsed hostname: {Hostname}", 
                requestId, hostname);
            
            // Step 2: Check if this is a production hostname
            var isProductionHostname = hostname.Contains(PRODUCTION_HOSTNAME.ToLowerInvariant());
            
            _logger.LogDebug("[SECURITY-GUARD:hp-db-guard] [{RequestId}] Is production hostname: {IsProduction} (checking for '{ProductionHost}')", 
                requestId, isProductionHostname, PRODUCTION_HOSTNAME);
            
            // If not production hostname, no violation possible
            if (!isProductionHostname)
            {
                _logger.LogInformation("[SECURITY-GUARD:hp-db-guard] [{RequestId}] ✅ Safe: Non-production hostname ({Hostname})", 
                    requestId, hostname);
                return null;
            }
            
            // Step 3: Extract database name from connection string
            var connectionString = _configuration.GetConnectionString("DefaultConnection");
            
            if (string.IsNullOrWhiteSpace(connectionString))
            {
                _logger.LogError("[SECURITY-GUARD:hp-db-guard] [{RequestId}] ⚠️ Connection string 'DefaultConnection' is null/empty! Cannot verify database name.", 
                    requestId);
                
                // Conservative approach: If we can't verify the database, treat it as a potential violation
                return new EnvironmentMismatchInfo
                {
                    Hostname = hostname,
                    ExpectedDatabase = PRODUCTION_DATABASE_NAME,
                    ActualDatabase = "UNKNOWN (connection string missing)",
                    Severity = "CRITICAL"
                };
            }
            
            var actualDatabaseName = ExtractDatabaseNameFromConnectionString(connectionString);
            
            _logger.LogDebug("[SECURITY-GUARD:hp-db-guard] [{RequestId}] Extracted database name: {DatabaseName}", 
                requestId, actualDatabaseName);
            
            // Step 4: Check for violation (production hostname + development database)
            var isDevelopmentDatabase = actualDatabaseName.Contains(DEVELOPMENT_DATABASE_NAME, StringComparison.OrdinalIgnoreCase);
            
            if (isDevelopmentDatabase)
            {
                // 🚨 SECURITY VIOLATION DETECTED 🚨
                _logger.LogCritical(
                    "[SECURITY-GUARD:hp-db-guard] [{RequestId}] 🚨 SECURITY VIOLATION DETECTED 🚨 " +
                    "Production hostname ({Hostname}) is connected to DEVELOPMENT database ({ActualDb})! " +
                    "Expected: {ExpectedDb}. This page will be blocked with red alert.",
                    requestId, hostname, actualDatabaseName, PRODUCTION_DATABASE_NAME);
                
                return new EnvironmentMismatchInfo
                {
                    Hostname = hostname,
                    ExpectedDatabase = PRODUCTION_DATABASE_NAME,
                    ActualDatabase = actualDatabaseName,
                    Severity = "CRITICAL"
                };
            }
            
            // All checks passed - safe environment combination
            _logger.LogInformation(
                "[SECURITY-GUARD:hp-db-guard] [{RequestId}] ✅ Safe: Production hostname ({Hostname}) connected to production database ({Database})",
                requestId, hostname, actualDatabaseName);
            
            return null;
        }
        catch (UriFormatException ex)
        {
            _logger.LogError(ex, 
                "[SECURITY-GUARD:hp-db-guard] [{RequestId}] Failed to parse URL: {Url}. Treating as safe (no violation).",
                requestId, currentUrl);
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, 
                "[SECURITY-GUARD:hp-db-guard] [{RequestId}] Unexpected error during environment mismatch check. URL: {Url}",
                requestId, currentUrl);
            
            // Conservative approach: If we encounter an unexpected error, don't block the app
            // but log it for investigation
            return null;
        }
    }
    
    /// <summary>
    /// Extract database name from SQL Server connection string.
    /// Handles multiple formats: "Initial Catalog=X", "Database=X", "InitialCatalog=X"
    /// </summary>
    private string ExtractDatabaseNameFromConnectionString(string connectionString)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            return "UNKNOWN";
        }
        
        // Try common connection string database keywords
        var keywords = new[] { "Initial Catalog=", "Database=", "InitialCatalog=" };
        
        foreach (var keyword in keywords)
        {
            var keywordIndex = connectionString.IndexOf(keyword, StringComparison.OrdinalIgnoreCase);
            if (keywordIndex >= 0)
            {
                var startIndex = keywordIndex + keyword.Length;
                var endIndex = connectionString.IndexOf(';', startIndex);
                
                var databaseName = endIndex > startIndex
                    ? connectionString.Substring(startIndex, endIndex - startIndex).Trim()
                    : connectionString.Substring(startIndex).Trim();
                
                return databaseName;
            }
        }
        
        // If no keyword found, log and return UNKNOWN
        _logger.LogWarning(
            "[SECURITY-GUARD:hp-db-guard] Could not extract database name from connection string. " +
            "Connection string may be in unexpected format.");
        
        return "UNKNOWN";
    }
}
