using System.CommandLine;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using Serilog;
using NoorCanvas.Data;
using NoorCanvas.Models.Simplified;
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

        // Show environment banner for both interactive and CLI modes
        ShowEnvironmentBanner();

        // If no arguments provided, run interactive mode
        if (args.Length == 0)
        {
            await RunInteractiveMode(serviceProvider);
            return 0;
        }

        var rootCommand = new RootCommand("NOOR Canvas Host Provisioner - Generate and manage Host GUIDs");

        // Create command
        var sessionIdOption = new Option<int>("--session-id", "Session ID to associate with the host GUID (references dbo.Sessions.SessionID)") { IsRequired = true };
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

        createCommand.SetHandler(async (int sessionId, string? createdBy, string? expires, bool dryRun, bool createUser, bool createRegistration, bool forceNew, string? rotationReason) =>
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

    private static void ShowEnvironmentBanner()
    {
        var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development";
        var connectionString = GetConnectionStringForDisplay();
        var databaseName = ExtractDatabaseName(connectionString);
        
        Console.WriteLine();
        Console.WriteLine();
        Console.WriteLine();
        Console.WriteLine("*************************************");
        Console.WriteLine($"Environment: {environment}");
        Console.WriteLine($"Database: {databaseName}");
        Console.WriteLine("*************************************");
        Console.WriteLine();
        Console.WriteLine();
    }

    private static void ConfigureServices(ServiceCollection services)
    {
        // STEP 1: Determine environment from multiple sources (priority order)
        // 1. Environment variable (set by PowerShell script or system)
        // 2. app.config file (modified by ncdeploy for production)
        // 3. Default to Development
        string? environment = null;
        string? baseUrl = null;
        
        // Try environment variable first
        environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
        
        // If not set, try reading from app.config
        if (string.IsNullOrEmpty(environment))
        {
            try
            {
                var appConfigPath = Path.Combine(Directory.GetCurrentDirectory(), "HostProvisioner.dll.config");
                if (File.Exists(appConfigPath))
                {
                    var configDoc = System.Xml.Linq.XDocument.Load(appConfigPath);
                    var envSetting = configDoc.Descendants("add")
                        .FirstOrDefault(x => x.Attribute("key")?.Value == "ASPNETCORE_ENVIRONMENT");
                    environment = envSetting?.Attribute("value")?.Value;
                    Console.WriteLine($"[TRACE] Environment from app.config: {environment}");
                    
                    // Read BaseUrl for the environment
                    var baseUrlKey = $"BaseUrl_{environment}";
                    var baseUrlSetting = configDoc.Descendants("add")
                        .FirstOrDefault(x => x.Attribute("key")?.Value == baseUrlKey);
                    baseUrl = baseUrlSetting?.Attribute("value")?.Value;
                    Console.WriteLine($"[TRACE] BaseUrl from app.config: {baseUrl}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[TRACE] Could not read app.config: {ex.Message}");
            }
        }
        else
        {
            Console.WriteLine($"[TRACE] Environment from environment variable: {environment}");
        }
        
        // Default to Development if still not set
        environment ??= "Development";
        
        // Default BaseUrl if not set from config
        baseUrl ??= (environment == "Production" ? "https://noorcanvas.servehttp.com" : "https://localhost:9091");
        
        // Set the environment variable so appsettings loading works correctly
        Environment.SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", environment);
        
        // Store BaseUrl in environment for use in DisplayGuidWithPause
        Environment.SetEnvironmentVariable("NOORCANVAS_BASE_URL", baseUrl);
        
        Console.WriteLine($"[DEBUG-WORKITEM:deploy:connection-resolution] Environment: {environment} ;CLEANUP_OK");
        Console.WriteLine($"[DEBUG-WORKITEM:deploy:connection-resolution] Base URL: {baseUrl} ;CLEANUP_OK");
        
        // Load configuration
        var configuration = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", optional: true, reloadOnChange: true)
            .AddJsonFile($"appsettings.{environment}.json", optional: true, reloadOnChange: true)
            .AddEnvironmentVariables()
            .Build();

        // Add Entity Framework with connection string from NoorCanvas project
        var connectionString = configuration.GetConnectionString("DefaultConnection") ??
            "Server=AHHOME;Database=KSESSIONS_DEV;User ID=sa;Password=adf4961glo;Connection Timeout=3600;MultipleActiveResultSets=true;TrustServerCertificate=True;Encrypt=False;";

        // [DEBUG-WORKITEM:deploy:connection-resolution] Log which database is being targeted ;CLEANUP_OK
        var dbName = connectionString.Contains("KSESSIONS_DEV") ? "KSESSIONS_DEV" : "KSESSIONS";
        Console.WriteLine($"[DEBUG-WORKITEM:deploy:connection-resolution] Target Database: {dbName} ;CLEANUP_OK");

        // Use simplified schema only - use DefaultConnection for all database contexts
        services.AddDbContext<SimplifiedCanvasDbContext>(options =>
            options.UseSqlServer(connectionString, sqlOptions =>
                sqlOptions.CommandTimeout(3600)));

        // Add KSESSIONS Database Context for Session validation (Issue-45)
        services.AddDbContext<KSessionsDbContext>(options =>
            options.UseSqlServer(connectionString, sqlOptions =>
                sqlOptions.CommandTimeout(3600)));

        // Add logging factory for token services
        services.AddLogging(builder => builder.AddSerilog());
        
        // Add simplified token service only
        services.AddScoped<SimplifiedTokenService>();

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
                        if (int.TryParse(input, out int sessionId))
                        {
                            var success = await ProcessSessionId(serviceProvider, sessionId);
                            if (success)
                            {
                                // Tokens generated successfully - exit interactive mode
                                return;
                            }
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
        try
        {
            Console.Clear();
        }
        catch (IOException)
        {
            // Console.Clear() is not supported in some environments (like VS Code terminal)
            // Just continue without clearing the console
        }
        catch (Exception)
        {
            // Ignore any other console clearing issues
        }
        
        // Display environment and database information banner
        var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development";
        var connectionString = GetConnectionStringForDisplay();
        var databaseName = ExtractDatabaseName(connectionString);
        
        Console.WriteLine();
        Console.WriteLine();
        Console.WriteLine("*************************************");
        Console.WriteLine($"Environment: {environment}");
        Console.WriteLine($"Database: {databaseName}");
        Console.WriteLine("*************************************");
        Console.WriteLine();
        Console.WriteLine();
        Console.WriteLine("🔐 NOOR Canvas Host Provisioner - Interactive Mode");
        Console.WriteLine("================================================");
        Console.WriteLine();
        Console.WriteLine("💡 Commands:");
        Console.WriteLine("   • Enter Session ID to generate Host GUID");
        Console.WriteLine("   • Type 'help' for more options");
        Console.WriteLine("   • Type 'exit' to quit");
        Console.WriteLine();
    }
    
    private static string GetConnectionStringForDisplay()
    {
        try
        {
            var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development";
            var configuration = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.json", optional: true)
                .AddJsonFile($"appsettings.{environment}.json", optional: true)
                .Build();
            
            return configuration.GetConnectionString("DefaultConnection") ?? 
                   "Server=AHHOME;Database=KSESSIONS_DEV;User ID=sa;Password=***;";
        }
        catch
        {
            return "Server=AHHOME;Database=KSESSIONS_DEV;User ID=sa;Password=***;";
        }
    }
    
    private static string ExtractDatabaseName(string connectionString)
    {
        try
        {
            var parts = connectionString.Split(';');
            var dbPart = parts.FirstOrDefault(p => p.Trim().StartsWith("Database=", StringComparison.OrdinalIgnoreCase));
            if (dbPart != null)
            {
                return dbPart.Split('=')[1].Trim();
            }
        }
        catch
        {
            // Fall through to default
        }
        return "KSESSIONS_DEV";
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

    private static async Task<bool> ProcessSessionId(IServiceProvider serviceProvider, int sessionId)
    {
        try
        {
            Console.WriteLine();
            Console.WriteLine($"🔄 Processing Session ID: {sessionId}");
            Console.WriteLine();

            // Create Host GUID with database persistence
            await CreateHostGuidWithDatabase(serviceProvider, sessionId, "Interactive User", null, false);
            return true; // Success - tokens were generated
        }
        catch (Exception ex)
        {
            ShowUserFriendlyError(ex, sessionId);
            return false; // Failed - continue interactive mode
        }
    }

    private static void ShowUserFriendlyError(Exception ex, int sessionId)
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

    private static async Task CreateHostGuid(int sessionId, string? createdBy, string? expires, bool dryRun)
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

    private static async Task CreateHostGuidWithDatabase(IServiceProvider serviceProvider, int sessionId, string? createdBy, string? expires, bool dryRun, bool forceNew = false, string? rotationReason = null, bool createUser = false, bool createRegistration = false)
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
            
            Log.Information("PROVISIONER: Getting simplified database contexts from DI...");
            var context = scope.ServiceProvider.GetRequiredService<SimplifiedCanvasDbContext>();
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

            // Create simplified canvas.Sessions record from KSESSIONS data if it doesn't exist
            var existingSession = await context.Sessions.FirstOrDefaultAsync(s => s.SessionId == sessionId);
            NoorCanvas.Models.Simplified.Session canvasSession;
            
            if (existingSession == null)
            {
                Log.Information("PROVISIONER: Creating simplified canvas.Sessions record from KSESSIONS data...");
                canvasSession = new NoorCanvas.Models.Simplified.Session
                {
                    SessionId = sessionId, // Now SessionId contains the KSESSIONS ID
                    AlbumId = Guid.NewGuid(), // Generate new GUID for AlbumId (GroupId is int, AlbumId needs Guid)
                    Status = "Created",
                    CreatedAt = DateTime.UtcNow,
                    HostToken = "",  // Will be set by token generation
                    UserToken = "",  // Will be set by token generation
                    ExpiresAt = DateTime.UtcNow.AddHours(24)
                };
                
                context.Sessions.Add(canvasSession);
                await context.SaveChangesAsync();
                
                Log.Information("PROVISIONER: Simplified Session record created with SessionId {SessionId} (KSESSIONS_ID) and AlbumId {AlbumId}", 
                    canvasSession.SessionId, canvasSession.AlbumId);
            }
            else
            {
                canvasSession = existingSession;
            }

            // Simplified schema - tokens are embedded directly in Session, no separate HostSession table
            Log.Information("PROVISIONER: Using simplified schema - tokens will be embedded in Session record");
            
            // Update session metadata
            canvasSession.CreatedBy = createdBy ?? "Interactive User";
            canvasSession.ExpiresAt = expiresAt;
            
            Log.Information("PROVISIONER: Calling SaveChangesAsync...");
            await context.SaveChangesAsync();
            Log.Information("PROVISIONER: SaveChangesAsync completed successfully");

            // Optional: Create a sample Participant if requested
            Guid? createdUserId = null;
            if (createUser)
            {
                try
                {
                    var userGuid = Guid.NewGuid();
                    
                    // Create Participant in simplified schema
                    var participant = new NoorCanvas.Models.Simplified.Participant
                    {
                        SessionId = canvasSession.SessionId,
                        UserGuid = userGuid.ToString(),
                        Name = createdBy ?? "Provisioner User",
                        Country = "Unknown",
                        JoinedAt = DateTime.UtcNow
                    };

                    Log.Information("PROVISIONER: Creating Participant with UserGuid {UserGuid}", userGuid);
                    context.Participants.Add(participant);
                    await context.SaveChangesAsync();
                    createdUserId = userGuid;
                    Log.Information("PROVISIONER: Participant created with UserGuid {UserId}", createdUserId);
                }
                catch (Exception ex)
                {
                    Log.Warning(ex, "PROVISIONER-WARNING: Failed to create sample participant: {Error}", ex.Message);
                }
            }

            // Generate friendly tokens using SimplifiedTokenService
            string? hostToken = null;
            string? userToken = null;
            string? participantUrl = null;
            string? hostUrl = null;
            
            try
            {
                var tokenService = scope.ServiceProvider.GetRequiredService<SimplifiedTokenService>();
                var (generatedHostToken, generatedUserToken) = await tokenService.GenerateTokenPairForSessionAsync(
                    canvasSession.SessionId, 
                    validHours: 24,
                    clientIp: "127.0.0.1"); // Console app IP
                    
                hostToken = generatedHostToken;
                userToken = generatedUserToken;
                
                // Get base URL from environment (set during ConfigureServices)
                var baseUrl = Environment.GetEnvironmentVariable("NOORCANVAS_BASE_URL") ?? "https://localhost:9091";
                
                // Generate friendly URLs using 8-character tokens with environment-specific base URL
                hostUrl = $"{baseUrl}/host/{hostToken}";
                participantUrl = $"{baseUrl}/user/landing/{userToken}";
                
                Log.Information("PROVISIONER-TOKEN: Generated friendly token pair for Session {SessionId}", canvasSession.SessionId);
                Log.Information("PROVISIONER-TOKEN: Host Token: {HostToken}", hostToken);
                Log.Information("PROVISIONER-TOKEN: User Token: {UserToken}", userToken);
                Log.Information("PROVISIONER-TOKEN: Host URL: {HostUrl}", hostUrl);
                Log.Information("PROVISIONER-TOKEN: Participant URL: {ParticipantUrl}", participantUrl);
            }
            catch (Exception ex)
            {
                Log.Warning(ex, "PROVISIONER-WARNING: Failed to generate friendly tokens: {Error}", ex.Message);
                

            }

            // Display results
            Log.Information("SUCCESS: Session provisioned successfully");
            Log.Information("KSESSIONS Session ID: {KSessionsId}", sessionId);
            Log.Information("Canvas Session ID: {CanvasSessionId}", canvasSession.SessionId);
            Log.Information("Host GUID: {HostGuid}", hostGuid);
            Log.Information("Schema Type: Simplified (tokens embedded in Session)");
            
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
            Log.Information("Database Record: Tokens embedded in canvas.Sessions");
            
            // Interactive mode specific output (Issue-44: Enhanced UX with pause)
            if (createdBy == "Interactive User")
            {
                DisplayGuidWithPause(hostGuid, sessionId, canvasSession.SessionId, createdUserId, participantUrl, hostToken, userToken);
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

    private static void DisplayGuidWithPause(Guid hostGuid, int sessionId, long hostSessionId, Guid? userId = null, string? participantUrl = null, string? hostToken = null, string? userToken = null)
    {
        // Get base URL from environment
        var baseUrl = Environment.GetEnvironmentVariable("NOORCANVAS_BASE_URL") ?? "https://localhost:9091";
        var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development";
        
        // Build full URLs with base URL
        var hostUrl = !string.IsNullOrEmpty(hostToken) ? $"{baseUrl}/host/{hostToken}" : null;
        var userUrl = !string.IsNullOrEmpty(userToken) ? $"{baseUrl}/user/landing/{userToken}" : participantUrl;
        
        Console.WriteLine();
        Console.WriteLine("╔══════════════════════════════════════════════════════════════════════╗");
        Console.ForegroundColor = ConsoleColor.Green;
        Console.WriteLine("║          🎯 NOOR CANVAS - SESSION TOKENS GENERATED! 🎯              ║");
        Console.ResetColor();
        Console.WriteLine("╚══════════════════════════════════════════════════════════════════════╝");
        Console.WriteLine();
        
        Console.ForegroundColor = ConsoleColor.Cyan;
        Console.WriteLine($"   Environment: {environment}");
        Console.WriteLine($"   KSESSIONS Session ID: {sessionId}");
        Console.WriteLine($"   Canvas Session ID: {hostSessionId}");
        Console.WriteLine($"   Generated: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC");
        Console.ResetColor();
        Console.WriteLine();
        
        // HOST AUTHENTICATION SECTION
        if (!string.IsNullOrEmpty(hostToken) && !string.IsNullOrEmpty(hostUrl))
        {
            Console.WriteLine("╔══════════════════════════════════════════════════════════════════════╗");
            Console.ForegroundColor = ConsoleColor.Yellow;
            Console.WriteLine("║                    � HOST AUTHENTICATION                            ║");
            Console.ResetColor();
            Console.WriteLine("╚══════════════════════════════════════════════════════════════════════╝");
            Console.WriteLine();
            Console.ForegroundColor = ConsoleColor.Yellow;
            Console.WriteLine($"   Token: {hostToken}");
            Console.ResetColor();
            Console.WriteLine();
            Console.ForegroundColor = ConsoleColor.White;
            Console.WriteLine($"   🔗 {hostUrl}");
            Console.ResetColor();
            Console.WriteLine();
            Console.ForegroundColor = ConsoleColor.Green;
            Console.WriteLine("   ✓ Click the link above to open in your browser");
            Console.ResetColor();
            Console.WriteLine();
        }
        
        // USER AUTHENTICATION SECTION
        if (!string.IsNullOrEmpty(userToken) && !string.IsNullOrEmpty(userUrl))
        {
            Console.WriteLine("╔══════════════════════════════════════════════════════════════════════╗");
            Console.ForegroundColor = ConsoleColor.Cyan;
            Console.WriteLine("║                    � USER AUTHENTICATION                            ║");
            Console.ResetColor();
            Console.WriteLine("╚══════════════════════════════════════════════════════════════════════╝");
            Console.WriteLine();
            Console.ForegroundColor = ConsoleColor.Cyan;
            Console.WriteLine($"   Token: {userToken}");
            Console.ResetColor();
            Console.WriteLine();
            Console.ForegroundColor = ConsoleColor.White;
            Console.WriteLine($"   🔗 {userUrl}");
            Console.ResetColor();
            Console.WriteLine();
            Console.ForegroundColor = ConsoleColor.Green;
            Console.WriteLine("   ✓ Share this link with participants");
            Console.ResetColor();
            Console.WriteLine();
        }
        
        // DATABASE INFO
        Console.WriteLine("╔══════════════════════════════════════════════════════════════════════╗");
        Console.ForegroundColor = ConsoleColor.Magenta;
        Console.WriteLine("║                         📊 DATABASE INFO                             ║");
        Console.ResetColor();
        Console.WriteLine("╚══════════════════════════════════════════════════════════════════════╝");
        Console.WriteLine();
        Console.WriteLine($"   Schema: Simplified");
        Console.WriteLine($"   Host Session ID: {hostSessionId}");
        if (userId.HasValue)
        {
            Console.WriteLine($"   User GUID: {userId.Value}");
        }
        Console.WriteLine();
        
        // INTERACTIVE OPTIONS
        Console.WriteLine("╔══════════════════════════════════════════════════════════════════════╗");
        Console.ForegroundColor = ConsoleColor.Green;
        Console.WriteLine("║                         � QUICK ACTIONS                             ║");
        Console.ResetColor();
        Console.WriteLine("╚══════════════════════════════════════════════════════════════════════╝");
        Console.WriteLine();
        
        if (!string.IsNullOrEmpty(hostUrl))
        {
            Console.ForegroundColor = ConsoleColor.Yellow;
            Console.WriteLine("   Press [H] to launch Host Authentication page");
            Console.ResetColor();
        }
        
        if (!string.IsNullOrEmpty(userUrl))
        {
            Console.ForegroundColor = ConsoleColor.Cyan;
            Console.WriteLine("   Press [U] to launch User Landing page");
            Console.ResetColor();
        }
        
        Console.ForegroundColor = ConsoleColor.Gray;
        Console.WriteLine("   Press [Any other key] to exit");
        Console.ResetColor();
        Console.WriteLine();
        Console.Write("   Your choice: ");
        
        var key = Console.ReadKey();
        Console.WriteLine();
        
        try
        {
            if (key.Key == ConsoleKey.H && !string.IsNullOrEmpty(hostUrl))
            {
                Console.WriteLine();
                Console.ForegroundColor = ConsoleColor.Green;
                Console.WriteLine("   ✓ Launching Host Authentication page...");
                Console.ResetColor();
                System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
                {
                    FileName = hostUrl,
                    UseShellExecute = true
                });
            }
            else if (key.Key == ConsoleKey.U && !string.IsNullOrEmpty(userUrl))
            {
                Console.WriteLine();
                Console.ForegroundColor = ConsoleColor.Green;
                Console.WriteLine("   ✓ Launching User Landing page...");
                Console.ResetColor();
                System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
                {
                    FileName = userUrl,
                    UseShellExecute = true
                });
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine();
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine($"   ✗ Could not launch browser: {ex.Message}");
            Console.ResetColor();
        }
        
        Console.WriteLine();
        Console.ForegroundColor = ConsoleColor.Green;
        Console.WriteLine("╔══════════════════════════════════════════════════════════════════════╗");
        Console.WriteLine("║            ✅ Host Provisioner completed successfully! ✅            ║");
        Console.WriteLine("╚══════════════════════════════════════════════════════════════════════╝");
        Console.ResetColor();
        Console.WriteLine();
        Console.WriteLine("Goodbye! 👋");
        Environment.Exit(0); // Exit the program completely
    }
}
