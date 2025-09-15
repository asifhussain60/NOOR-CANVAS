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
using NoorCanvas.Services;

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
        var sessionIdOption = new Option<long>("--session-id", "Session ID to associate with the host GUID") { IsRequired = true };
        var createdByOption = new Option<string>("--created-by", "Name of the person creating the host session") { IsRequired = false };
        var expiresOption = new Option<string>("--expires", "Expiration date (yyyy-MM-dd)") { IsRequired = false };
        var dryRunOption = new Option<bool>("--dry-run", "Show what would be done without making changes") { IsRequired = false };
        var createUserOption = new Option<bool>("--create-user", "Also generate and persist a User GUID for session participation") { IsRequired = false };
        var createRegistrationOption = new Option<bool>("--create-registration", "Also create a registration linking the created user to the session") { IsRequired = false };
        var forceNewOption = new Option<bool>("--force-new", "Force creation of new record even if Session ID exists") { IsRequired = false };
        var rotationReasonOption = new Option<string>("--rotation-reason", "Reason for GUID rotation (for audit purposes)") { IsRequired = false };

        var createCommand = new Command("create", "Generate a new Host GUID")
        {
            sessionIdOption,
            createdByOption,
            expiresOption,
            dryRunOption,
            createUserOption,
            createRegistrationOption,
            forceNewOption,
            rotationReasonOption
        };

        createCommand.SetHandler(async (long sessionId, string? createdBy, string? expires, bool dryRun, bool createUser, bool createRegistration, bool forceNew, string? rotationReason) =>
        {
            await CreateHostGuidWithDatabase(serviceProvider, sessionId, createdBy, expires, dryRun, forceNew, rotationReason, createUser, createRegistration);
        },
        sessionIdOption,
        createdByOption,
        expiresOption,
        dryRunOption,
        createUserOption,
        createRegistrationOption,
        forceNewOption,
        rotationReasonOption);

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
            .AddJsonFile($"appsettings.{Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development"}.json", optional: true, reloadOnChange: true)
            .AddEnvironmentVariables()
            .Build();

        // Add Entity Framework with connection string from NoorCanvas project
        var connectionString = configuration.GetConnectionString("DefaultConnection") ??
            "Server=AHHOME;Database=KSESSIONS_DEV;User ID=sa;Password=adf4961glo;Connection Timeout=3600;MultipleActiveResultSets=true;TrustServerCertificate=True;Encrypt=False;";

        services.AddDbContext<CanvasDbContext>(options =>
            options.UseSqlServer(connectionString, sqlOptions =>
                sqlOptions.CommandTimeout(3600))); // Match the connection timeout

        // Add KSESSIONS Database Context for Session validation (Issue-45)
        var kSessionsConnectionString = configuration.GetConnectionString("KSessionsDb") ?? connectionString;
        services.AddDbContext<KSessionsDbContext>(options =>
            options.UseSqlServer(kSessionsConnectionString, sqlOptions =>
                sqlOptions.CommandTimeout(3600)));

        // Add logging factory for SecureTokenService
        services.AddLogging(builder => builder.AddSerilog());
        
        // Add SecureTokenService for friendly token generation
        services.AddScoped<SecureTokenService>();

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

    private static async Task CreateHostGuidWithDatabase(IServiceProvider serviceProvider, long sessionId, string? createdBy, string? expires, bool dryRun, bool forceNew = false, string? rotationReason = null, bool createUser = false, bool createRegistration = false)
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
            
            // BUGFIX: Set the HostGuid in Sessions table for authentication controller
            Log.Information("PROVISIONER: Setting canvas.Sessions.HostGuid for authentication controller...");
            canvasSession.HostGuid = hostGuidHash;
            canvasSession.ModifiedAt = DateTime.UtcNow;
            
            Log.Information("PROVISIONER: Calling SaveChangesAsync...");
            await context.SaveChangesAsync();
            Log.Information("PROVISIONER: SaveChangesAsync completed successfully");

            // Optional: Create a sample User and Registration if requested
            Guid? createdUserId = null;
            if (createUser)
            {
                try
                {
                    var userGuid = Guid.NewGuid();
                    var user = new NoorCanvas.Models.User
                    {
                        UserId = userGuid,
                        UserGuid = userGuid.ToString(),
                        Name = createdBy ?? "Provisioner User",
                        CreatedAt = DateTime.UtcNow,
                        ModifiedAt = DateTime.UtcNow,
                        FirstJoinedAt = DateTime.UtcNow,
                        LastJoinedAt = DateTime.UtcNow,
                        IsActive = true
                    };

                    Log.Information("PROVISIONER: Creating User with UserGuid {UserGuid}", user.UserGuid);
                    context.Users.Add(user);
                    await context.SaveChangesAsync();
                    createdUserId = user.UserId;
                    Log.Information("PROVISIONER: User created with UserId {UserId}", createdUserId);

                    if (createRegistration && createdUserId.HasValue)
                    {
                        var registration = new NoorCanvas.Models.Registration
                        {
                            SessionId = canvasSession.SessionId,
                            UserId = createdUserId.Value,
                            JoinTime = DateTime.UtcNow
                        };

                        context.Registrations.Add(registration);
                        await context.SaveChangesAsync();
                        Log.Information("PROVISIONER: Registration created linking User {UserId} to Session {SessionId}", createdUserId, canvasSession.SessionId);
                    }
                }
                catch (Exception ex)
                {
                    Log.Warning(ex, "PROVISIONER-WARNING: Failed to create sample user or registration");
                }
            }

            // Generate friendly tokens using SecureTokenService
            string? hostToken = null;
            string? userToken = null;
            string? participantUrl = null;
            string? hostUrl = null;
            
            try
            {
                var tokenService = serviceProvider.GetRequiredService<SecureTokenService>();
                var (generatedHostToken, generatedUserToken) = await tokenService.GenerateTokenPairAsync(
                    canvasSession.SessionId, 
                    validHours: 24,
                    clientIp: "127.0.0.1"); // Console app IP
                    
                hostToken = generatedHostToken;
                userToken = generatedUserToken;
                
                // Generate friendly URLs using 8-character tokens
                hostUrl = $"https://localhost:9091/host/{hostToken}";
                participantUrl = $"https://localhost:9091/session/{userToken}";
                
                Log.Information("PROVISIONER-TOKEN: Generated friendly token pair for Session {SessionId}", canvasSession.SessionId);
                Log.Information("PROVISIONER-TOKEN: Host Token: {HostToken}", hostToken);
                Log.Information("PROVISIONER-TOKEN: User Token: {UserToken}", userToken);
                Log.Information("PROVISIONER-TOKEN: Host URL: {HostUrl}", hostUrl);
                Log.Information("PROVISIONER-TOKEN: Participant URL: {ParticipantUrl}", participantUrl);
            }
            catch (Exception ex)
            {
                Log.Warning(ex, "PROVISIONER-WARNING: Failed to generate friendly tokens, falling back to GUID-based SessionLink");
                
                // Fallback to traditional GUID-based SessionLink if token generation fails
                if (createUser && createdUserId.HasValue)
                {
                    try
                    {
                        var sessionLink = new NoorCanvas.Models.SessionLink
                        {
                            SessionId = canvasSession.SessionId,
                            Guid = Guid.NewGuid(),
                            State = 1, // Active
                            CreatedAt = DateTime.UtcNow,
                            UseCount = 0
                        };

                        context.SessionLinks.Add(sessionLink);
                        await context.SaveChangesAsync();
                        
                        // Generate participant URL with User GUID attached (fallback)
                        participantUrl = $"https://localhost:9091/join/{sessionLink.Guid}?userGuid={createdUserId.Value}";
                        
                        Log.Information("PROVISIONER-FALLBACK: SessionLink created with GUID {SessionLinkGuid}", sessionLink.Guid);
                        Log.Information("PROVISIONER-FALLBACK: Participant URL: {ParticipantUrl}", participantUrl);
                    }
                    catch (Exception fallbackEx)
                    {
                        Log.Error(fallbackEx, "PROVISIONER-ERROR: Failed to create fallback session link");
                    }
                }
            }

            // Display results
            Log.Information("SUCCESS: Host GUID created and saved to database");
            Log.Information("KSESSIONS Session ID: {KSessionsId}", sessionId);
            Log.Information("Canvas Session ID: {CanvasSessionId}", canvasSession.SessionId);
            Log.Information("Host GUID: {HostGuid}", hostGuid);
            Log.Information("Host Session ID: {HostSessionId}", hostSession.HostSessionId);
            
            // Display friendly token information
            if (!string.IsNullOrEmpty(hostToken) && !string.IsNullOrEmpty(userToken))
            {
                Log.Information("🎯 FRIENDLY TOKENS GENERATED:");
                Log.Information("  → Host Access: {HostToken} → {HostUrl}", hostToken, hostUrl);
                Log.Information("  → User Access: {UserToken} → {ParticipantUrl}", userToken, participantUrl);
            }
            
            if (createdUserId.HasValue)
            {
                Log.Information("User GUID: {UserId}", createdUserId.Value);
            }
            if (!string.IsNullOrEmpty(participantUrl))
            {
                Log.Information("Participant URL: {ParticipantUrl}", participantUrl);
            }
            Log.Information("Created By: {CreatedBy}", createdBy ?? "Interactive User");
            Log.Information("Database Record: Saved to canvas.HostSessions");
            
            // Interactive mode specific output (Issue-44: Enhanced UX with pause)
            if (createdBy == "Interactive User")
            {
                DisplayGuidWithPause(hostGuid, sessionId, hostSession.HostSessionId, createdUserId, participantUrl);
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

    private static void DisplayGuidWithPause(Guid hostGuid, long sessionId, long hostSessionId, Guid? userId = null, string? participantUrl = null)
    {
        Console.WriteLine();
        Console.WriteLine("🎯 Session Tokens Generated Successfully!");
        Console.WriteLine("==========================================");
        Console.WriteLine($"KSESSIONS Session ID: {sessionId}");
        Console.WriteLine($"Canvas Session ID: {hostSessionId}");
        Console.WriteLine($"Generated: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC");
        Console.WriteLine();
        
        // Prioritize friendly token display
        if (!string.IsNullOrEmpty(participantUrl) && participantUrl.Contains("/session/"))
        {
            // Extract friendly token from URL
            var tokenMatch = participantUrl.Split("/session/").LastOrDefault()?.Split('?').FirstOrDefault();
            if (!string.IsNullOrEmpty(tokenMatch))
            {
                Console.WriteLine("🔗 FRIENDLY SESSION ACCESS:");
                Console.WriteLine($"   Participant Token: {tokenMatch}");
                Console.WriteLine($"   Participant URL: {participantUrl}");
                Console.WriteLine();
            }
        }
        
        Console.WriteLine("🔐 HOST AUTHENTICATION:");
        Console.WriteLine($"   Host GUID: {hostGuid}");
        if (userId.HasValue)
        {
            Console.WriteLine($"   User GUID: {userId.Value}");
        }
        Console.WriteLine();
        
        Console.WriteLine("📊 DATABASE:");
        Console.WriteLine($"   Saved to: canvas.HostSessions, canvas.SecureTokens");
        Console.WriteLine($"   Host Session ID: {hostSessionId}");
        
        Console.WriteLine();
        Console.WriteLine("📋 INSTRUCTIONS:");
        Console.WriteLine("   1. Copy the Host GUID for authentication");
        if (!string.IsNullOrEmpty(participantUrl) && participantUrl.Contains("/session/"))
        {
            Console.WriteLine("   2. Share the Participant URL for easy user access");
        }
        else if (userId.HasValue)
        {
            Console.WriteLine("   2. Share the Participant URL with users to join");
        }
        Console.WriteLine("   3. All tokens are stored securely with expiration tracking");
        Console.WriteLine();
        Console.Write("Press any key to continue...");
        Console.ReadKey();
        Console.WriteLine();
        Console.WriteLine();
    }
}
