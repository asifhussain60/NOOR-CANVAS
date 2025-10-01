using Microsoft.EntityFrameworkCore;
using NoorCanvas.Models;

namespace NoorCanvas.Data;

public class CanvasDbContext : DbContext
{
    public CanvasDbContext(DbContextOptions<CanvasDbContext> options) : base(options)
    {
    }

    // Canvas Schema Tables
    public DbSet<Session> Sessions { get; set; }
    public DbSet<SessionLink> SessionLinks { get; set; }
    public DbSet<HostSession> HostSessions { get; set; }
    public DbSet<AdminSession> AdminSessions { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<Registration> Registrations { get; set; }
    public DbSet<SharedAsset> SharedAssets { get; set; }
    public DbSet<Annotation> Annotations { get; set; }
    public DbSet<Question> Questions { get; set; }
    public DbSet<QuestionAnswer> QuestionAnswers { get; set; }
    public DbSet<QuestionVote> QuestionVotes { get; set; }
    public DbSet<AuditLog> AuditLogs { get; set; }
    public DbSet<Issue> Issues { get; set; }
    public DbSet<SecureToken> SecureTokens { get; set; }
    public DbSet<SessionParticipant> SessionParticipants { get; set; }

    // [DEBUG-WORKITEM:canvascleanup:impl] ContentBroadcast DbSet removed ;CLEANUP_OK

    /// <inheritdoc/>
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure unique constraints
        modelBuilder.Entity<Registration>()
            .HasIndex(r => new { r.UserId, r.SessionId })
            .IsUnique()
            .HasDatabaseName("UQ_Registration_UserSession");

        modelBuilder.Entity<HostSession>()
            .HasIndex(h => new { h.SessionId, h.HostGuidHash })
            .IsUnique()
            .HasDatabaseName("IX_HostSessions_SessionGuidHash");

        modelBuilder.Entity<QuestionVote>()
            .HasIndex(v => new { v.QuestionId, v.UserId })
            .IsUnique()
            .HasDatabaseName("UQ_QuestionVotes_QuestionUser");

        // Configure indexes for performance
        modelBuilder.Entity<SessionLink>()
            .HasIndex(sl => new { sl.State, sl.Guid })
            .HasDatabaseName("IX_SessionLinks_StateGuid");

        modelBuilder.Entity<Question>()
            .HasIndex(q => new { q.SessionId, q.Status, q.VoteCount, q.QueuedAt })
            .HasDatabaseName("IX_Questions_SessionStatusVoteQueue");

        modelBuilder.Entity<SharedAsset>()
            .HasIndex(sa => new { sa.SessionId, sa.SharedAt })
            .HasDatabaseName("IX_SharedAssets_SessionShared");

        // Configure SecureToken indexes and unique constraints
        modelBuilder.Entity<SecureToken>()
            .HasIndex(st => st.HostToken)
            .IsUnique()
            .HasDatabaseName("UQ_SecureTokens_HostToken");

        modelBuilder.Entity<SecureToken>()
            .HasIndex(st => st.UserToken)
            .IsUnique()
            .HasDatabaseName("UQ_SecureTokens_UserToken");

        modelBuilder.Entity<SecureToken>()
            .HasIndex(st => st.SessionId)
            .HasDatabaseName("IX_SecureTokens_SessionId");

        modelBuilder.Entity<SecureToken>()
            .HasIndex(st => new { st.ExpiresAt, st.IsActive })
            .HasDatabaseName("IX_SecureTokens_ExpiryActive");

        // Configure relationships
        modelBuilder.Entity<Registration>()
            .HasOne(r => r.Session)
            .WithMany(s => s.Registrations)
            .HasForeignKey(r => r.SessionId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Registration>()
            .HasOne(r => r.User)
            .WithMany(u => u.Registrations)
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Question>()
            .HasOne(q => q.Session)
            .WithMany(s => s.Questions)
            .HasForeignKey(q => q.SessionId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Question>()
            .HasOne(q => q.User)
            .WithMany(u => u.Questions)
            .HasForeignKey(q => q.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<QuestionVote>()
            .HasOne(v => v.Question)
            .WithMany(q => q.QuestionVotes)
            .HasForeignKey(v => v.QuestionId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<QuestionVote>()
            .HasOne(v => v.User)
            .WithMany(u => u.QuestionVotes)
            .HasForeignKey(v => v.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<SecureToken>()
            .HasOne(st => st.Session)
            .WithMany()
            .HasForeignKey(st => st.SessionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
