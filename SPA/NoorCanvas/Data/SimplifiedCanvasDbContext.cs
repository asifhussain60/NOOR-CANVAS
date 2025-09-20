using Microsoft.EntityFrameworkCore;
using NoorCanvas.Models.Simplified;

namespace NoorCanvas.Data;

/// <summary>
/// Simplified Canvas Database Context - Ultra-minimal 4-table design
/// Replaces the complex 15-table architecture with elegant simplicity
/// </summary>
public class SimplifiedCanvasDbContext : DbContext
{
    public SimplifiedCanvasDbContext(DbContextOptions<SimplifiedCanvasDbContext> options) : base(options)
    {
    }

    // Simplified Schema Tables (4 total - 75% reduction from original 15 tables)
    public DbSet<Session> Sessions { get; set; }
    public DbSet<Participant> Participants { get; set; }
    public DbSet<SessionData> SessionData { get; set; }
    public DbSet<SessionAsset> SessionAssets { get; set; } // Asset lookup table for share button injection

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure unique constraints for authentication tokens
        modelBuilder.Entity<Session>()
            .HasIndex(s => s.HostToken)
            .IsUnique()
            .HasDatabaseName("UQ_Sessions_HostToken");

        modelBuilder.Entity<Session>()
            .HasIndex(s => s.UserToken)
            .IsUnique()
            .HasDatabaseName("UQ_Sessions_UserToken");

        // Configure performance indexes for common queries
        modelBuilder.Entity<Session>()
            .HasIndex(s => new { s.Status, s.ExpiresAt })
            .HasDatabaseName("IX_Sessions_Status_Expires");

        modelBuilder.Entity<Participant>()
            .HasIndex(p => p.SessionId)
            .HasDatabaseName("IX_Participants_SessionId");

        modelBuilder.Entity<Participant>()
            .HasIndex(p => new { p.SessionId, p.UserGuid })
            .HasDatabaseName("IX_Participants_SessionUser");

        modelBuilder.Entity<SessionData>()
            .HasIndex(sd => sd.SessionId)
            .HasDatabaseName("IX_SessionData_SessionId");

        modelBuilder.Entity<SessionData>()
            .HasIndex(sd => new { sd.SessionId, sd.DataType })
            .HasDatabaseName("IX_SessionData_Session_Type");

        modelBuilder.Entity<SessionData>()
            .HasIndex(sd => new { sd.SessionId, sd.DataType, sd.IsDeleted, sd.CreatedAt })
            .HasDatabaseName("IX_SessionData_Query_Optimized");

        // Configure relationships
        modelBuilder.Entity<Participant>()
            .HasOne(p => p.Session)
            .WithMany(s => s.Participants)
            .HasForeignKey(p => p.SessionId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<SessionData>()
            .HasOne(sd => sd.Session)
            .WithMany(s => s.SessionData)
            .HasForeignKey(sd => sd.SessionId)
            .OnDelete(DeleteBehavior.Cascade);

        // Configure SessionAssets indexes for optimal performance
        modelBuilder.Entity<SessionAsset>()
            .HasIndex(sa => sa.SessionId)
            .HasDatabaseName("IX_SessionAssets_SessionId");

        modelBuilder.Entity<SessionAsset>()
            .HasIndex(sa => new { sa.SessionId, sa.AssetType })
            .HasDatabaseName("IX_SessionAssets_Type_Session");

        modelBuilder.Entity<SessionAsset>()
            .HasIndex(sa => new { sa.IsActive, sa.SharedAt })
            .HasDatabaseName("IX_SessionAssets_Shared")
            .HasFilter("[SharedAt] IS NOT NULL");

        modelBuilder.Entity<SessionAsset>()
            .HasIndex(sa => new { sa.SessionId, sa.Position })
            .HasDatabaseName("IX_SessionAssets_Position")
            .HasFilter("[Position] IS NOT NULL");

        // Configure SessionAssets relationships
        modelBuilder.Entity<SessionAsset>()
            .HasOne(sa => sa.Session)
            .WithMany() // No navigation property on Session for now (keep it simple)
            .HasForeignKey(sa => sa.SessionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}