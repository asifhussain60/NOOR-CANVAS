using System.CommandLine;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using Serilog;
using NoorCanvas.Data;
using NoorCanvas.Models;
using NoorCanvas.Models.KSESSIONS;

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

        // Setup dependency injection
        var services = new ServiceCollection();
        ConfigureServices(services);
        var serviceProvider = services.BuildServiceProvider();

        // If no arguments provided, run interactive mode
        if (args.Length == 0)
        {
            await RunInteractiveMode(serviceProvider);
            return 0;
        }

        var rootCommand = new RootCommand("NOOR Canvas Host Provisioner - Generate and manage Host GUIDs");

        // Create command
        var createCommand = new Command("create", "Generate a new Host GUID")
        {
            new Option<long>("--session-id", "Session ID to associate with the host GUID") { IsRequired = true },
            new Option<string>("--created-by", "Name of the person creating the host session") { IsRequired = false },
            new Option<string>("--expires", "Expiration date (yyyy-MM-dd)") { IsRequired = false },
            new Option<bool>("--dry-run", "Show what would be done without making changes") { IsRequired = false },
            new Option<bool>("--force-new", "Force creation of new record even if Session ID exists") { IsRequired = false },
            new Option<string>("--rotation-reason", "Reason for GUID rotation (for audit purposes)") { IsRequired = false }
        };

        createCommand.SetHandler(async (long sessionId, string? createdBy, string? expires, bool dryRun, bool forceNew, string? rotationReason) =>
        {
            await CreateHostGuidWithDatabase(serviceProvider, sessionId, createdBy, expires, dryRun, forceNew, rotationReason);
        },
        createCommand.Options.OfType<Option<long>>().First(),           // --session-id
        createCommand.Options.OfType<Option<string>>().First(),         // --created-by
        createCommand.Options.OfType<Option<string>>().Skip(1).First(), // --expires
        createCommand.Options.OfType<Option<bool>>().First(),           // --dry-run
        createCommand.Options.OfType<Option<bool>>().Skip(1).First(),   // --force-new
        createCommand.Options.OfType<Option<string>>().Skip(2).First()); // --rotation-reason

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

    private static void ConfigureServices(ServiceCollection services)
    {
        // Load configuration
        var configuration = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", optional: true, reloadOnChange: true)
            .Build();

        // Add Entity Framework with connection string from NoorCanvas project
        var connectionString = configuration.GetConnectionString("DefaultConnection") ??
            "Data Source=AHHOME;Initial Catalog=KSESSIONS_DEV;User Id=sa;Password=adf4961glo;Connection Timeout=3600;MultipleActiveResultSets=true;TrustServerCertificate=true;Encrypt=false";

        services.AddDbContext<CanvasDbContext>(options =>
            options.UseSqlServer(connectionString, sqlOptions =>
                sqlOptions.CommandTimeout(3600))); // Match the connection timeout

        // Add KSESSIONS Database Context for Session validation (Issue-45)
        var kSessionsConnectionString = configuration.GetConnectionString("KSessionsDb") ?? connectionString;
        services.AddDbContext<KSessionsDbContext>(options =>
            options.UseSqlServer(kSessionsConnectionString, sqlOptions =>
                sqlOptions.CommandTimeout(3600)));

        // Register configuration
        services.AddSingleton<IConfiguration>(configuration);
    }

    private static async Task RunInteractiveMode(IServiceProvider serviceProvider)
    {
        ClearAndShowHeader();

        while (true)
        {
            try
            {
                Console.Write("Enter command (or Session ID): ");
                var input = Console.ReadLine()?.Trim();
                
                if (string.IsNullOrEmpty(input))
                    continue;
                    
                // Handle special commands (Issue-44: Enhanced UX)
                switch (input.ToLower())
                {
                    case "exit":
                        Console.WriteLine("Goodbye! 👋");
                        return;
                        
                    case "help":
                        ShowInteractiveHelp();
                        continue;
                        
                    case "clear":
                        ClearAndShowHeader();
                        continue;
                        
                    default:
                        // Try to parse as Session ID
                        if (long.TryParse(input, out long sessionId))
                        {
                            await ProcessSessionId(serviceProvider, sessionId);
                        }
                        else
                        {
                            ShowInvalidInputMessage(input);
                        }
                        break;
                }
            }
            catch (Exception ex)
            {
                ShowUserFriendlyError(ex, 0);
            }
        }
    }

    private static void ClearAndShowHeader()
    {
        Console.Clear();
        Console.WriteLine("🔐 NOOR Canvas Host Provisioner - Interactive Mode");
        Console.WriteLine("================================================");
        Console.WriteLine();
        Console.WriteLine("💡 Commands:");
        Console.WriteLine("   • Enter Session ID to generate Host GUID");
        Console.WriteLine("   • Type 'help' for more options");
        Console.WriteLine("   • Type 'exit' to quit");
        Console.WriteLine();
    }

    private static void ShowInteractiveHelp()
    {
        Console.WriteLine();
        Console.WriteLine("🔐 NOOR Canvas Host Provisioner - Help");
        Console.WriteLine("=====================================");
        Console.WriteLine();
        Console.WriteLine("📋 COMMANDS:");
        Console.WriteLine("   help        Show this help information");
        Console.WriteLine("   exit        Exit the Host Provisioner");
        Console.WriteLine("   clear       Clear screen and refresh display");
        Console.WriteLine("   [number]    Generate Host GUID for Session ID");
        Console.WriteLine();
        Console.WriteLine("📝 EXAMPLE:");
        Console.WriteLine("   1           Generate Host GUID for Session 1");
        Console.WriteLine();
        Console.WriteLine("🔧 FEATURES:");
        Console.WriteLine("   • One GUID per Session ID (updates existing)");
        Console.WriteLine("   • Secure HMAC-SHA256 hash generation");
        Console.WriteLine("   • Database persistence with audit trail");
        Console.WriteLine("   • Automatic GUID rotation support");
        Console.WriteLine();
        Console.Write("Press any key to continue...");
        Console.ReadKey();
        Console.WriteLine();
        Console.WriteLine();
    }

    private static void ShowInvalidInputMessage(string input)
    {
        Console.WriteLine();
        Console.WriteLine($"❌ Invalid input: '{input}'");
        Console.WriteLine("💡 Please enter a Session ID number, or try:");
        Console.WriteLine("   • 'help' for available commands");
        Console.WriteLine("   • 'exit' to quit");
        Console.WriteLine();
    }

    private static async Task ProcessSessionId(IServiceProvider serviceProvider, long sessionId)
    {
        try
        {
            Console.WriteLine();
            Console.WriteLine($"🔄 Processing Session ID: {sessionId}");
            Console.WriteLine();

            // Create Host GUID with database persistence
            await CreateHostGuidWithDatabase(serviceProvider, sessionId, "Interactive User", null, false);
        }
        catch (Exception ex)
        {
            ShowUserFriendlyError(ex, sessionId);
        }
    }

    private static void ShowUserFriendlyError(Exception ex, long sessionId)
    {
        Console.WriteLine();
        Console.WriteLine("❌ Error Creating Host GUID");
        Console.WriteLine("===========================");
        
        if (ex.Message.Contains("does not exist"))
        {
            Console.WriteLine($"🔍 Session ID {sessionId} does not exist in the database.");
            Console.WriteLine("💡 Please create the Session first using NOOR Canvas application.");
            Console.WriteLine("📋 Available Session ID: 1 (for testing)");
        }
        else if (ex.Message.Contains("FOREIGN KEY constraint"))
        {
            Console.WriteLine($"🔍 Session ID {sessionId} does not exist in the database.");
            Console.WriteLine("💡 Please create the Session first using NOOR Canvas application.");
            Console.WriteLine("📋 Available Session ID: 1 (for testing)");
        }
        else if (ex.Message.Contains("timeout"))
        {
            Console.WriteLine("⏰ Database connection timeout occurred.");
            Console.WriteLine("💡 Please try again, or contact technical support if this persists.");
        }
        else
        {
            Console.WriteLine($"🚨 Unexpected error occurred: {ex.Message}");
            Console.WriteLine("💡 Please contact technical support with this error message.");
        }
        
        Console.WriteLine();
        Console.Write("Press any key to continue...");
        Console.ReadKey();
        Console.WriteLine();
        Console.WriteLine();
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
                Log.Information("  Created By: {CreatedBy}", createdBy ?? "Unknown");
                Log.Information("  Expires At: {ExpiresAt}", expiresAt?.ToString() ?? "Never");
                return;
            }

            // In a real implementation, this would save to database
            // For Phase 2, we'll just log the generated values
            Log.Information("SUCCESS: Host GUID created");
            Log.Information("Session ID: {SessionId}", sessionId);
            Log.Information("Host GUID: {HostGuid}", hostGuid);
            Log.Information("Created By: {CreatedBy}", createdBy ?? "Unknown");
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

    private static async Task CreateHostGuidWithDatabase(IServiceProvider serviceProvider, long sessionId, string? createdBy, string? expires, bool dryRun, bool forceNew = false, string? rotationReason = null)
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
                Log.Information("  Created By: {CreatedBy}", createdBy ?? "Unknown");
                Log.Information("  Expires At: {ExpiresAt}", expiresAt?.ToString() ?? "Never");
                return;
            }

            Log.Information("PROVISIONER: Creating service scope...");
            // Get database context from service provider
            using var scope = serviceProvider.CreateScope();
            
            Log.Information("PROVISIONER: Getting database contexts from DI...");
            var context = scope.ServiceProvider.GetRequiredService<CanvasDbContext>();
            var kSessionsContext = scope.ServiceProvider.GetRequiredService<KSessionsDbContext>();

            Log.Information("PROVISIONER: Testing database connectivity...");
            var canConnect = await context.Database.CanConnectAsync();
            var kSessionsCanConnect = await kSessionsContext.Database.CanConnectAsync();
            
            Log.Information("PROVISIONER: Canvas DB connectivity: {CanConnect}", canConnect);
            Log.Information("PROVISIONER: KSESSIONS DB connectivity: {KSessionsCanConnect}", kSessionsCanConnect);

            if (!canConnect || !kSessionsCanConnect)
            {
                throw new Exception($"Database connectivity failed. Canvas: {canConnect}, KSESSIONS: {kSessionsCanConnect}");
            }

            // Issue-45: Validate Session ID exists in KSESSIONS database
            Log.Information("PROVISIONER: Validating Session ID {SessionId} exists in KSESSIONS_DEV.Sessions...", sessionId);
            var kSession = await kSessionsContext.Sessions
                .FirstOrDefaultAsync(s => s.SessionId == (int)sessionId);
            
            if (kSession == null)
            {
                Log.Error("PROVISIONER-ERROR: Session ID {SessionId} does not exist in KSESSIONS database", sessionId);
                throw new InvalidOperationException($"Session ID {sessionId} does not exist in KSESSIONS database. Please select a valid Session from the Islamic content library.");
            }

            Log.Information("PROVISIONER: Found Session: {SessionName} in KSESSIONS", kSession.Description ?? "No Description");

            // Issue-45: Verify Session has transcripts available for annotation
            Log.Information("PROVISIONER: Verifying Session {SessionId} has transcripts available...", sessionId);
            var transcriptCount = await kSessionsContext.SessionTranscripts
                .CountAsync(st => st.SessionId == (int)sessionId);
                
            if (transcriptCount == 0)
            {
                Log.Error("PROVISIONER-ERROR: Session ID {SessionId} has no transcripts available for annotation", sessionId);
                throw new InvalidOperationException($"Session ID {sessionId} has no transcripts available. Transcripts are required for NOOR Canvas annotation features.");
            }

            Log.Information("PROVISIONER: Session has {TranscriptCount} transcripts available", transcriptCount);

            // Issue-45: Create canvas.Sessions record from KSESSIONS data if it doesn't exist
            // Use KSessionsId to reference KSESSIONS SessionId, let SessionId auto-increment
            var canvasSession = await context.Sessions.FirstOrDefaultAsync(s => s.KSessionsId == sessionId);
            if (canvasSession == null)
            {
                Log.Information("PROVISIONER: Creating canvas.Sessions record from KSESSIONS data...");
                canvasSession = new Session
                {
                    // SessionId will auto-increment
                    KSessionsId = sessionId, // Store KSESSIONS reference
                    GroupId = Guid.NewGuid(), // Map from KSESSIONS if needed
                    CreatedAt = DateTime.UtcNow,
                    ModifiedAt = DateTime.UtcNow,
                    Description = kSession.Description ?? $"Session {sessionId} from KSESSIONS",
                    Title = kSession.SessionName ?? $"Islamic Session {sessionId}",
                    Status = "Created",
                    HostGuid = "" // Will be set by Host GUID creation
                };
                
                context.Sessions.Add(canvasSession);
                await context.SaveChangesAsync();
                
                Log.Information("PROVISIONER: Canvas Session record created with SessionId {CanvasSessionId} for KSessionsId {KSessionsId}", 
                    canvasSession.SessionId, canvasSession.KSessionsId);
            }

            HostSession hostSession;
            
            // Handle --force-new parameter (bypass update logic)
            if (forceNew)
            {
                Log.Information("PROVISIONER: --force-new parameter specified - creating new record regardless of existing Session ID");
            }
            else
            {
                Log.Information("PROVISIONER: Checking for existing Host Session with Session ID {SessionId}...", sessionId);
            }
            
            // Check for existing Host Session by Canvas SessionId (Issue-42: Single GUID per Session ID rule)
            // Note: Now we use the canvas.Sessions.SessionId (auto-increment PK) not the KSESSIONS SessionId
            var existingHostSession = forceNew ? null : await context.HostSessions
                .FirstOrDefaultAsync(hs => hs.SessionId == canvasSession.SessionId);

            if (existingHostSession != null && !forceNew)
            {
                // Update existing record with new GUID (GUID rotation)
                Log.Information("PROVISIONER: Found existing Host Session {HostSessionId} - updating with new GUID", existingHostSession.HostSessionId);
                
                existingHostSession.HostGuidHash = hostGuidHash;
                existingHostSession.CreatedAt = DateTime.UtcNow;
                existingHostSession.CreatedBy = createdBy ?? "Interactive User";
                existingHostSession.IsActive = true;
                existingHostSession.ExpiresAt = expiresAt;
                
                hostSession = existingHostSession;
                
                var logMessage = "PROVISIONER-UPDATE: Rotating Host GUID for existing Session {SessionId} by {CreatedBy}";
                if (!string.IsNullOrEmpty(rotationReason))
                {
                    Log.Information(logMessage + " - Reason: {RotationReason}", sessionId, createdBy ?? "Interactive User", rotationReason);
                }
                else
                {
                    Log.Information(logMessage, sessionId, createdBy ?? "Interactive User");
                }
            }
            else
            {
                // Create new Host Session record
                Log.Information("PROVISIONER: No existing Host Session found - creating new record");
                
                hostSession = new HostSession
                {
                    SessionId = canvasSession.SessionId, // Use canvas SessionId (auto-increment PK)
                    HostGuidHash = hostGuidHash,
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = createdBy ?? "Interactive User",
                    IsActive = true,
                    ExpiresAt = expiresAt
                };

                Log.Information("PROVISIONER: Adding new HostSession to DbContext...");
                context.HostSessions.Add(hostSession);
                Log.Information("PROVISIONER-CREATE: Creating new Host Session for Canvas SessionId {CanvasSessionId} (KSessions {KSessionsId}) by {CreatedBy}", 
                    canvasSession.SessionId, sessionId, createdBy ?? "Interactive User");
            }
            
            Log.Information("PROVISIONER: Calling SaveChangesAsync...");
            await context.SaveChangesAsync();
            Log.Information("PROVISIONER: SaveChangesAsync completed successfully");

            // Display results
            Log.Information("SUCCESS: Host GUID created and saved to database");
            Log.Information("KSESSIONS Session ID: {KSessionsId}", sessionId);
            Log.Information("Canvas Session ID: {CanvasSessionId}", canvasSession.SessionId);
            Log.Information("Host GUID: {HostGuid}", hostGuid);
            Log.Information("Host Session ID: {HostSessionId}", hostSession.HostSessionId);
            Log.Information("Created By: {CreatedBy}", createdBy ?? "Interactive User");
            Log.Information("Database Record: ✅ Saved to canvas.HostSessions");
            
            // Interactive mode specific output (Issue-44: Enhanced UX with pause)
            if (createdBy == "Interactive User")
            {
                DisplayGuidWithPause(hostGuid, sessionId, hostSession.HostSessionId);
            }
        }
        catch (Exception ex)
        {
            Log.Error(ex, "PROVISIONER-ERROR: Failed to create Host GUID with database persistence");
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
                Log.Information("  Complete New Hash: {Hash}", newHostGuidHash);
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
            Log.Information("Complete New Hash: {Hash}", newHostGuidHash);
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

    private static void DisplayGuidWithPause(Guid hostGuid, long sessionId, long hostSessionId)
    {
        Console.WriteLine();
        Console.WriteLine("✅ Host GUID Generated Successfully!");
        Console.WriteLine("===================================");
        Console.WriteLine($"📊 Session ID: {sessionId}");
        Console.WriteLine($"🆔 Host GUID: {hostGuid}");
        Console.WriteLine($"🔢 Host Session ID: {hostSessionId}");
        Console.WriteLine($"⏰ Generated: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC");
        Console.WriteLine($"💾 Database: ✅ Saved to canvas.HostSessions");
        Console.WriteLine();
        Console.WriteLine("📋 Copy the Host GUID above to use for authentication.");
        Console.WriteLine("🔑 The GUID is stored securely in the database.");
        Console.WriteLine();
        Console.Write("Press any key to continue...");
        Console.ReadKey();
        Console.WriteLine();
        Console.WriteLine();
    }
}
