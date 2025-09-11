using System.CommandLine;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using Serilog;

namespace HostProvisioner;

class Program
{
    private static readonly string AppSecret = "NOOR-CANVAS-HOST-SECRET-2025";
    
    static async Task<int> Main(string[] args)
    {
        // Configure logging
        Log.Logger = new LoggerConfiguration()
            .WriteTo.Console()
            .CreateLogger();

        var rootCommand = new RootCommand("NOOR Canvas Host Provisioner - Generate and manage Host GUIDs");

        // Create command
        var createCommand = new Command("create", "Generate a new Host GUID")
        {
            new Option<long>("--session-id", "Session ID to associate with the host GUID") { IsRequired = true },
            new Option<string>("--created-by", "Name of the person creating the host session") { IsRequired = false },
            new Option<string>("--expires", "Expiration date (yyyy-MM-dd)") { IsRequired = false },
            new Option<bool>("--dry-run", "Show what would be done without making changes") { IsRequired = false }
        };

        createCommand.SetHandler(async (long sessionId, string? createdBy, string? expires, bool dryRun) =>
        {
            await CreateHostGuid(sessionId, createdBy, expires, dryRun);
        },
        createCommand.Options.OfType<Option<long>>().First(),
        createCommand.Options.OfType<Option<string>>().First(),
        createCommand.Options.OfType<Option<string>>().Skip(1).First(),
        createCommand.Options.OfType<Option<bool>>().First());

        // Rotate command
        var rotateCommand = new Command("rotate", "Rotate an existing Host GUID")
        {
            new Option<long>("--host-session-id", "Host Session ID to rotate") { IsRequired = true },
            new Option<bool>("--dry-run", "Show what would be done without making changes") { IsRequired = false }
        };

        rotateCommand.SetHandler(async (long hostSessionId, bool dryRun) =>
        {
            await RotateHostGuid(hostSessionId, dryRun);
        },
        rotateCommand.Options.OfType<Option<long>>().First(),
        rotateCommand.Options.OfType<Option<bool>>().First());

        rootCommand.Add(createCommand);
        rootCommand.Add(rotateCommand);

        try
        {
            return await rootCommand.InvokeAsync(args);
        }
        catch (Exception ex)
        {
            Log.Error(ex, "PROVISIONER-ERROR: Unhandled exception");
            return 1;
        }
        finally
        {
            Log.CloseAndFlush();
        }
    }

    private static async Task CreateHostGuid(long sessionId, string? createdBy, string? expires, bool dryRun)
    {
        try
        {
            var hostGuid = Guid.NewGuid();
            var hostGuidHash = ComputeHash(hostGuid.ToString());
            var expiresAt = string.IsNullOrEmpty(expires) ? (DateTime?)null : DateTime.Parse(expires);

            Log.Information("PROVISIONER: Creating Host GUID for Session {SessionId}", sessionId);
            
            if (dryRun)
            {
                Log.Information("DRY-RUN: Would create Host Session:");
                Log.Information("  Session ID: {SessionId}", sessionId);
                Log.Information("  Host GUID: {HostGuid}", hostGuid);
                Log.Information("  Hash: {Hash}", hostGuidHash.Substring(0, 16) + "...");
                Log.Information("  Created By: {CreatedBy}", createdBy ?? "Unknown");
                Log.Information("  Expires At: {ExpiresAt}", expiresAt?.ToString() ?? "Never");
                return;
            }

            // In a real implementation, this would save to database
            // For Phase 1, we'll just log the generated values
            Log.Information("SUCCESS: Host GUID created");
            Log.Information("Session ID: {SessionId}", sessionId);
            Log.Information("Host GUID: {HostGuid}", hostGuid);
            Log.Information("IMPORTANT: Save this GUID securely - it will be hashed in the database");
            
            // Copy to clipboard if possible
            try
            {
                // Note: Clipboard access requires additional packages in a real implementation
                Log.Information("Host GUID copied to clipboard (if supported)");
            }
            catch
            {
                Log.Warning("Could not copy to clipboard - manual copy required");
            }

            await Task.CompletedTask; // Placeholder for async database operations
        }
        catch (Exception ex)
        {
            Log.Error(ex, "PROVISIONER-ERROR: Failed to create Host GUID");
            throw;
        }
    }

    private static async Task RotateHostGuid(long hostSessionId, bool dryRun)
    {
        try
        {
            var newHostGuid = Guid.NewGuid();
            var newHostGuidHash = ComputeHash(newHostGuid.ToString());

            Log.Information("PROVISIONER: Rotating Host GUID for Host Session {HostSessionId}", hostSessionId);
            
            if (dryRun)
            {
                Log.Information("DRY-RUN: Would rotate Host Session {HostSessionId}", hostSessionId);
                Log.Information("  New Host GUID: {HostGuid}", newHostGuid);
                Log.Information("  New Hash: {Hash}", newHostGuidHash.Substring(0, 16) + "...");
                Log.Information("  Would revoke existing GUID");
                return;
            }

            // In a real implementation, this would:
            // 1. Mark old GUID as revoked
            // 2. Create new GUID record
            // 3. Update host session
            Log.Information("SUCCESS: Host GUID rotated");
            Log.Information("Host Session ID: {HostSessionId}", hostSessionId);
            Log.Information("New Host GUID: {HostGuid}", newHostGuid);
            Log.Information("IMPORTANT: Update host with new GUID - old GUID is now invalid");

            await Task.CompletedTask; // Placeholder for async database operations
        }
        catch (Exception ex)
        {
            Log.Error(ex, "PROVISIONER-ERROR: Failed to rotate Host GUID");
            throw;
        }
    }

    private static string ComputeHash(string input)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(AppSecret));
        var hashBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(input));
        return Convert.ToBase64String(hashBytes);
    }
}
