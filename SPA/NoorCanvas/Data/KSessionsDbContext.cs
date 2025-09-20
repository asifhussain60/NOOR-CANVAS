using Microsoft.EntityFrameworkCore;
using NoorCanvas.Models.KSESSIONS;

namespace NoorCanvas.Data
{
    /// <summary>
    /// KSESSIONS Database Context - Read-only access to Islamic content database
    /// Connects to production KSESSIONS database for Groups, Categories, Sessions data
    /// </summary>
    public class KSessionsDbContext : DbContext
    {
        public KSessionsDbContext(DbContextOptions<KSessionsDbContext> options) : base(options)
        {
        }

        // KSESSIONS Database Tables (Read-Only)
        public DbSet<KSessionsGroup> Groups { get; set; }
        public DbSet<KSessionsCategory> Categories { get; set; }
        public DbSet<KSessionsSession> Sessions { get; set; }
        public DbSet<KSessionsSessionTranscript> SessionTranscripts { get; set; }
        public DbSet<KSessionsCountry> Countries { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure Groups entity
            modelBuilder.Entity<KSessionsGroup>(entity =>
            {
                entity.HasKey(e => e.GroupId);
                entity.ToTable("Groups", "dbo");

                // Configure relationships
                entity.HasMany(g => g.Categories)
                      .WithOne(c => c.Group)
                      .HasForeignKey(c => c.GroupId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasMany(g => g.Sessions)
                      .WithOne(s => s.Group)
                      .HasForeignKey(s => s.GroupId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // Configure Categories entity
            modelBuilder.Entity<KSessionsCategory>(entity =>
            {
                entity.HasKey(e => e.CategoryId);
                entity.ToTable("Categories", "dbo");

                // Configure relationships
                entity.HasOne(c => c.Group)
                      .WithMany(g => g.Categories)
                      .HasForeignKey(c => c.GroupId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasMany(c => c.Sessions)
                      .WithOne(s => s.Category)
                      .HasForeignKey(s => s.CategoryId)
                      .OnDelete(DeleteBehavior.Restrict);

                // Add indexes for performance
                entity.HasIndex(e => e.GroupId).HasDatabaseName("IX_Categories_GroupID");
                entity.HasIndex(e => new { e.GroupId, e.IsActive }).HasDatabaseName("IX_Categories_GroupID_IsActive");
            });

            // Configure Sessions entity
            modelBuilder.Entity<KSessionsSession>(entity =>
            {
                entity.HasKey(e => e.SessionId);
                entity.ToTable("Sessions", "dbo");

                // Configure relationships
                entity.HasOne(s => s.Group)
                      .WithMany(g => g.Sessions)
                      .HasForeignKey(s => s.GroupId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(s => s.Category)
                      .WithMany(c => c.Sessions)
                      .HasForeignKey(s => s.CategoryId)
                      .OnDelete(DeleteBehavior.Restrict);

                // Add indexes for performance
                entity.HasIndex(e => e.GroupId).HasDatabaseName("IX_Sessions_GroupID");
                entity.HasIndex(e => e.CategoryId).HasDatabaseName("IX_Sessions_CategoryID");
                entity.HasIndex(e => new { e.GroupId, e.CategoryId, e.IsActive }).HasDatabaseName("IX_Sessions_GroupID_CategoryID_IsActive");
            });

            // Configure SessionTranscripts entity
            modelBuilder.Entity<KSessionsSessionTranscript>(entity =>
            {
                entity.HasKey(e => e.TranscriptId);
                entity.ToTable("SessionTranscripts", "dbo");

                // Configure relationship to Session
                entity.HasOne(st => st.Session)
                      .WithMany()
                      .HasForeignKey(st => st.SessionId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(e => e.SessionId).HasDatabaseName("IX_SessionTranscripts_SessionID");
            });

            // Configure Countries entity
            modelBuilder.Entity<KSessionsCountry>(entity =>
            {
                entity.HasKey(e => e.CountryId);
                entity.ToTable("Countries", "dbo");

                // Add index for performance
                entity.HasIndex(e => e.IsActive).HasDatabaseName("IX_Countries_IsActive");
                entity.HasIndex(e => e.CountryName).HasDatabaseName("IX_Countries_CountryName");
            });
        }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            // Read-only configuration - no change tracking needed for performance
            if (!optionsBuilder.IsConfigured)
            {
                optionsBuilder.UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking);
            }
        }
    }
}
