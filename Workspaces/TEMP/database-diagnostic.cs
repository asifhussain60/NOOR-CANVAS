using Microsoft.EntityFrameworkCore;
using NoorCanvas.Data;
using NoorCanvas.Data.Simplified;

Console.WriteLine("[DEBUG-WORKITEM:assetshare:continue] Starting database diagnostic and fix utility");

// Create database contexts
var canvasConnectionString = "Server=localhost;Database=KSESSIONS_DEV;Trusted_Connection=true;TrustServerCertificate=true;";
var ksessionsConnectionString = "Server=localhost;Database=KSESSIONS_DEV;Trusted_Connection=true;TrustServerCertificate=true;";

var canvasOptions = new DbContextOptionsBuilder<SimplifiedCanvasDbContext>()
    .UseSqlServer(canvasConnectionString)
    .Options;

var ksessionsOptions = new DbContextOptionsBuilder<KSessionsDbContext>()
    .UseSqlServer(ksessionsConnectionString)
    .Options;

using var canvasDb = new SimplifiedCanvasDbContext(canvasOptions);
using var ksessionsDb = new KSessionsDbContext(ksessionsOptions);

Console.WriteLine("[DEBUG-WORKITEM:assetshare:continue] Checking current session 212 data...");

// Check if session 212 exists in KSessions
var ksession = await ksessionsDb.Sessions.FirstOrDefaultAsync(s => s.SessionId == 212);
if (ksession != null)
{
    Console.WriteLine($"[DEBUG-WORKITEM:assetshare:continue] ✅ KSessions session 212 found: {ksession.SessionName}");
}
else
{
    Console.WriteLine("[DEBUG-WORKITEM:assetshare:continue] ❌ KSessions session 212 NOT found");
}

// Check if session 212 exists in canvas.Sessions
var canvasSession = await canvasDb.Sessions.FirstOrDefaultAsync(s => s.SessionId == 212);
if (canvasSession != null)
{
    Console.WriteLine($"[DEBUG-WORKITEM:assetshare:continue] ✅ Canvas session 212 found: HostToken={canvasSession.HostToken}, UserToken={canvasSession.UserToken}");
}
else
{
    Console.WriteLine("[DEBUG-WORKITEM:assetshare:continue] ❌ Canvas session 212 NOT found - need to create it");
    
    // Create canvas session record
    canvasSession = new NoorCanvas.Models.Simplified.Session
    {
        SessionId = 212,
        HostToken = "HOST212A",
        UserToken = "USER212A", 
        Status = "Waiting",
        ParticipantCount = 0,
        MaxParticipants = 50,
        CreatedAt = DateTime.UtcNow,
        ModifiedAt = DateTime.UtcNow,
        ExpiresAt = DateTime.UtcNow.AddDays(30), // 30 days from now
        AlbumId = 1, // Default album
        ScheduledDate = "09/29/2025",
        ScheduledTime = "6:00 PM", 
        ScheduledDuration = "60"
    };
    
    canvasDb.Sessions.Add(canvasSession);
    await canvasDb.SaveChangesAsync();
    
    Console.WriteLine("[DEBUG-WORKITEM:assetshare:continue] ✅ Created canvas session 212 with HOST212A token");
}

// Check AssetLookup table
var assetLookups = await canvasDb.AssetLookup.Where(a => a.IsActive).ToListAsync();
Console.WriteLine($"[DEBUG-WORKITEM:assetshare:continue] Found {assetLookups.Count} active asset lookups:");

foreach (var lookup in assetLookups)
{
    Console.WriteLine($"  - {lookup.AssetIdentifier}: {lookup.CssSelector} -> {lookup.DisplayName}");
}

// Check if ayah-card is in the lookup table
var ayahCardLookup = assetLookups.FirstOrDefault(a => a.AssetIdentifier == "ayah-card");
if (ayahCardLookup != null)
{
    Console.WriteLine($"[DEBUG-WORKITEM:assetshare:continue] ✅ ayah-card lookup found: {ayahCardLookup.CssSelector}");
}
else
{
    Console.WriteLine("[DEBUG-WORKITEM:assetshare:continue] ❌ ayah-card lookup NOT found");
}

// Check session transcript
var transcript = await ksessionsDb.SessionTranscripts.FirstOrDefaultAsync(t => t.SessionId == 212);
if (transcript != null)
{
    Console.WriteLine($"[DEBUG-WORKITEM:assetshare:continue] ✅ Session 212 transcript found: {transcript.Transcript?.Length ?? 0} characters");
    
    // Count ayah-card occurrences in transcript
    var ayahCardCount = 0;
    if (!string.IsNullOrEmpty(transcript.Transcript))
    {
        ayahCardCount = System.Text.RegularExpressions.Regex.Matches(transcript.Transcript, @"class=""[^""]*ayah-card[^""]*""").Count;
    }
    Console.WriteLine($"[DEBUG-WORKITEM:assetshare:continue] Found {ayahCardCount} ayah-card elements in transcript");
}
else
{
    Console.WriteLine("[DEBUG-WORKITEM:assetshare:continue] ❌ Session 212 transcript NOT found");
}

Console.WriteLine("[DEBUG-WORKITEM:assetshare:continue] Database diagnostic completed");
Console.WriteLine("[DEBUG-WORKITEM:assetshare:continue] Next step: Test HOST212A token at https://localhost:9091/host/HOST212A");