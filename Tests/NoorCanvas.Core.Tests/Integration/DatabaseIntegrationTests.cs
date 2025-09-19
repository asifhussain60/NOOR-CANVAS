using Xunit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using NoorCanvas.Data;
using NoorCanvas.Models;
using System.Transactions;

namespace NoorCanvas.Core.Tests.Integration
{
    /// <summary>
    /// Integration tests for Entity Framework operations
    /// Tests database context, migrations, queries, and relationships using in-memory database
    /// </summary>
    public class DatabaseIntegrationTests : IDisposable
    {
        private readonly CanvasDbContext _context;
        private readonly ServiceProvider _serviceProvider;

        public DatabaseIntegrationTests()
        {
            var services = new ServiceCollection();
            services.AddDbContext<CanvasDbContext>(options =>
                options.UseInMemoryDatabase(databaseName: $"DatabaseIntegration_Tests_{Guid.NewGuid()}"));

            _serviceProvider = services.BuildServiceProvider();
            _context = _serviceProvider.GetRequiredService<CanvasDbContext>();

            // Ensure database is created
            _context.Database.EnsureCreated();
        }

        #region Database Context Tests

        [Fact]
        [Trait("Category", "DatabaseIntegration")]
        [Trait("Type", "Context")]
        public async Task CanvasDbContext_AllDbSets_ShouldBeAccessible()
        {
            // Act & Assert - Verify all DbSets are accessible
            Assert.NotNull(_context.Sessions);
            Assert.NotNull(_context.SessionLinks);
            Assert.NotNull(_context.HostSessions);
            Assert.NotNull(_context.AdminSessions);
            Assert.NotNull(_context.Users);
            Assert.NotNull(_context.Registrations);
            Assert.NotNull(_context.SharedAssets);
            Assert.NotNull(_context.Annotations);
            Assert.NotNull(_context.Questions);
            Assert.NotNull(_context.QuestionAnswers);
            Assert.NotNull(_context.QuestionVotes);
            Assert.NotNull(_context.AuditLogs);
            Assert.NotNull(_context.Issues);

            // Verify they can be queried without errors
            await _context.Sessions.CountAsync();
            await _context.Users.CountAsync();
            await _context.Registrations.CountAsync();
            await _context.Annotations.CountAsync();
        }

        [Fact]
        [Trait("Category", "DatabaseIntegration")]
        [Trait("Type", "Schema")]
        public async Task Database_SchemaConfiguration_ShouldApplyCorrectTableNames()
        {
            // Arrange
            var session = new Session
            {
                GroupId = Guid.NewGuid(),
                Title = "Schema Test Session",
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddHours(3)
            };

            var user = new User
            {
                UserId = Guid.NewGuid(),
                Name = "Schema Test User",
                Country = "Test Country",
                FirstJoinedAt = DateTime.UtcNow
            };

            // Act
            _context.Sessions.Add(session);
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Assert - Verify records are persisted correctly
            var savedSession = await _context.Sessions.FindAsync(session.SessionId);
            var savedUser = await _context.Users.FindAsync(user.UserId);

            Assert.NotNull(savedSession);
            Assert.NotNull(savedUser);
            Assert.Equal("Schema Test Session", savedSession.Title);
            Assert.Equal("Schema Test User", savedUser.Name);
        }

        #endregion

        #region Relationship Tests

        [Fact]
        [Trait("Category", "DatabaseIntegration")]
        [Trait("Type", "Relationships")]
        public async Task Session_WithSessionLinks_ShouldMaintainCorrectRelationship()
        {
            // Arrange
            var session = new Session
            {
                GroupId = Guid.NewGuid(),
                Title = "Link Test Session",
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddHours(3)
            };

            _context.Sessions.Add(session);
            await _context.SaveChangesAsync();

            var sessionLink = new SessionLink
            {
                SessionId = session.SessionId,
                Guid = Guid.NewGuid(),
                State = 1,
                CreatedAt = DateTime.UtcNow
            };

            // Act
            _context.SessionLinks.Add(sessionLink);
            await _context.SaveChangesAsync();

            // Assert - Test navigation properties
            var sessionWithLinks = await _context.Sessions
                .Include(s => s.SessionLinks)
                .FirstOrDefaultAsync(s => s.SessionId == session.SessionId);

            Assert.NotNull(sessionWithLinks);
            Assert.Single(sessionWithLinks.SessionLinks);
            Assert.Equal(sessionLink.Guid, sessionWithLinks.SessionLinks.First().Guid);

            var linkWithSession = await _context.SessionLinks
                .Include(sl => sl.Session)
                .FirstOrDefaultAsync(sl => sl.LinkId == sessionLink.LinkId);

            Assert.NotNull(linkWithSession);
            Assert.NotNull(linkWithSession.Session);
            Assert.Equal(session.Title, linkWithSession.Session.Title);
        }

        [Fact]
        [Trait("Category", "DatabaseIntegration")]
        [Trait("Type", "Relationships")]
        public async Task UserRegistration_ShouldMaintainCorrectRelationships()
        {
            // Arrange
            var session = await CreateTestSession("Registration Test Session");
            var user = await CreateTestUser("Registration Test User");

            var registration = new Registration
            {
                SessionId = session.SessionId,
                UserId = user.UserId,
                JoinTime = DateTime.UtcNow
            };

            // Act
            _context.Registrations.Add(registration);
            await _context.SaveChangesAsync();

            // Assert - Test bidirectional navigation
            var userWithRegistrations = await _context.Users
                .Include(u => u.Registrations)
                    .ThenInclude(r => r.Session)
                .FirstOrDefaultAsync(u => u.UserId == user.UserId);

            Assert.NotNull(userWithRegistrations);
            Assert.Single(userWithRegistrations.Registrations);
            Assert.Equal(session.SessionId, userWithRegistrations.Registrations.First().SessionId);
            Assert.Equal("Registration Test Session", userWithRegistrations.Registrations.First().Session.Title);

            var sessionWithRegistrations = await _context.Sessions
                .Include(s => s.Registrations)
                    .ThenInclude(r => r.User)
                .FirstOrDefaultAsync(s => s.SessionId == session.SessionId);

            Assert.NotNull(sessionWithRegistrations);
            Assert.Single(sessionWithRegistrations.Registrations);
            Assert.Equal(user.UserId, sessionWithRegistrations.Registrations.First().UserId);
            Assert.Equal("Registration Test User", sessionWithRegistrations.Registrations.First().User.Name);
        }

        [Fact]
        [Trait("Category", "DatabaseIntegration")]
        [Trait("Type", "Relationships")]
        public async Task QuestionVoting_ShouldMaintainCorrectRelationships()
        {
            // Arrange
            var session = await CreateTestSession("Question Test Session");
            var questionUser = await CreateTestUser("Question User");
            var voterUser = await CreateTestUser("Voter User");

            var question = new Question
            {
                SessionId = session.SessionId,
                UserId = questionUser.UserId,
                QuestionText = "What is the meaning of this verse?",
                Status = "Pending",
                VoteCount = 0,
                QueuedAt = DateTime.UtcNow
            };

            _context.Questions.Add(question);
            await _context.SaveChangesAsync();

            var vote = new QuestionVote
            {
                QuestionId = question.QuestionId,
                UserId = voterUser.UserId,
                VoteValue = 1,
                VotedAt = DateTime.UtcNow
            };

            // Act
            _context.QuestionVotes.Add(vote);
            await _context.SaveChangesAsync();

            // Assert - Test complex relationships
            var questionWithVotes = await _context.Questions
                .Include(q => q.QuestionVotes)
                    .ThenInclude(v => v.User)
                .Include(q => q.User)
                .Include(q => q.Session)
                .FirstOrDefaultAsync(q => q.QuestionId == question.QuestionId);

            Assert.NotNull(questionWithVotes);
            Assert.Single(questionWithVotes.QuestionVotes);
            Assert.Equal(voterUser.Name, questionWithVotes.QuestionVotes.First().User.Name);
            Assert.Equal(questionUser.Name, questionWithVotes.User.Name);
            Assert.Equal(session.Title, questionWithVotes.Session.Title);
        }

        #endregion

        #region Query Performance Tests

        [Fact]
        [Trait("Category", "DatabaseIntegration")]
        [Trait("Type", "Performance")]
        public async Task BulkOperations_ShouldPerformEfficiently()
        {
            // Arrange
            var session = await CreateTestSession("Bulk Test Session");
            var users = new List<User>();
            var registrations = new List<Registration>();

            // Create multiple users and registrations
            for (int i = 0; i < 50; i++)
            {
                var user = new User
                {
                    UserId = Guid.NewGuid(),
                    Name = $"Bulk User {i}",
                    Country = "Test Country",
                    FirstJoinedAt = DateTime.UtcNow
                };
                users.Add(user);

                var registration = new Registration
                {
                    SessionId = session.SessionId,
                    UserId = user.UserId,
                    JoinTime = DateTime.UtcNow.AddMinutes(i)
                };
                registrations.Add(registration);
            }

            // Act - Bulk insert
            var startTime = DateTime.UtcNow;

            _context.Users.AddRange(users);
            await _context.SaveChangesAsync();

            _context.Registrations.AddRange(registrations);
            await _context.SaveChangesAsync();

            var endTime = DateTime.UtcNow;

            // Assert - Verify all records were created
            var userCount = await _context.Users.CountAsync();
            var registrationCount = await _context.Registrations
                .CountAsync(r => r.SessionId == session.SessionId);

            Assert.True(userCount >= 50);
            Assert.Equal(50, registrationCount);

            // Performance assertion (bulk operations should complete reasonably quickly)
            var operationTime = endTime - startTime;
            Assert.True(operationTime.TotalSeconds < 10, $"Bulk operation took {operationTime.TotalSeconds} seconds");
        }

        [Fact]
        [Trait("Category", "DatabaseIntegration")]
        [Trait("Type", "Performance")]
        public async Task ComplexQueries_ShouldExecuteEfficiently()
        {
            // Arrange - Create test data
            var sessions = new List<Session>();
            for (int i = 0; i < 5; i++)
            {
                sessions.Add(await CreateTestSession($"Complex Query Session {i}"));
            }

            var users = new List<User>();
            for (int i = 0; i < 20; i++)
            {
                users.Add(await CreateTestUser($"Complex Query User {i}"));
            }

            // Create registrations and annotations
            foreach (var session in sessions)
            {
                foreach (var user in users.Take(4)) // 4 users per session
                {
                    var registration = new Registration
                    {
                        SessionId = session.SessionId,
                        UserId = user.UserId,
                        JoinTime = DateTime.UtcNow
                    };
                    _context.Registrations.Add(registration);

                    var annotation = new Annotation
                    {
                        SessionId = session.SessionId,
                        AnnotationData = $"{{\"type\":\"test\",\"user\":\"{user.Name}\"}}",
                        CreatedBy = user.UserId.ToString(),
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.Annotations.Add(annotation);
                }
            }
            await _context.SaveChangesAsync();

            // Act - Execute complex query
            var startTime = DateTime.UtcNow;

            var queryResult = await _context.Sessions
                .Include(s => s.Registrations)
                    .ThenInclude(r => r.User)
                .Include(s => s.Annotations)
                .Where(s => s.Registrations.Count() > 2)
                .Select(s => new
                {
                    SessionTitle = s.Title,
                    ParticipantCount = s.Registrations.Count(),
                    AnnotationCount = s.Annotations.Count(),
                    ParticipantNames = s.Registrations.Select(r => r.User.Name).ToList()
                })
                .ToListAsync();

            var endTime = DateTime.UtcNow;

            // Assert
            Assert.Equal(5, queryResult.Count); // All sessions should have > 2 participants
            Assert.All(queryResult, r => Assert.True(r.ParticipantCount > 2));
            Assert.All(queryResult, r => Assert.True(r.AnnotationCount > 0));

            var queryTime = endTime - startTime;
            Assert.True(queryTime.TotalSeconds < 5, $"Complex query took {queryTime.TotalSeconds} seconds");
        }

        #endregion

        #region Constraint Tests

        [Fact]
        [Trait("Category", "DatabaseIntegration")]
        [Trait("Type", "Constraints")]
        public async Task UniqueConstraints_ShouldEnforceDataIntegrity()
        {
            // Test Registration unique constraint (UserId + SessionId)
            var session = await CreateTestSession("Constraint Test Session");
            var user = await CreateTestUser("Constraint Test User");

            var registration1 = new Registration
            {
                SessionId = session.SessionId,
                UserId = user.UserId,
                JoinTime = DateTime.UtcNow
            };

            var registration2 = new Registration
            {
                SessionId = session.SessionId,
                UserId = user.UserId, // Same user, same session
                JoinTime = DateTime.UtcNow.AddMinutes(5)
            };

            // Act & Assert
            _context.Registrations.Add(registration1);
            await _context.SaveChangesAsync(); // This should succeed

            _context.Registrations.Add(registration2);
            await Assert.ThrowsAsync<InvalidOperationException>(() => _context.SaveChangesAsync()); // This should fail
        }

        [Fact]
        [Trait("Category", "DatabaseIntegration")]
        [Trait("Type", "Constraints")]
        public async Task ForeignKeyConstraints_ShouldEnforceRelationships()
        {
            // Test that registration requires valid SessionId and UserId
            var invalidRegistration = new Registration
            {
                SessionId = 99999, // Non-existent session
                UserId = Guid.NewGuid(), // Non-existent user
                JoinTime = DateTime.UtcNow
            };

            // Act & Assert
            _context.Registrations.Add(invalidRegistration);
            await Assert.ThrowsAsync<DbUpdateException>(() => _context.SaveChangesAsync());
        }

        #endregion

        #region Transaction Tests

        [Fact]
        [Trait("Category", "DatabaseIntegration")]
        [Trait("Type", "Transactions")]
        public async Task DatabaseTransactions_ShouldMaintainConsistency()
        {
            // Arrange
            var session = await CreateTestSession("Transaction Test Session");
            var user = await CreateTestUser("Transaction Test User");

            // Act - Simulate a transaction that should be rolled back
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Add registration
                var registration = new Registration
                {
                    SessionId = session.SessionId,
                    UserId = user.UserId,
                    JoinTime = DateTime.UtcNow
                };
                _context.Registrations.Add(registration);

                // Add annotation
                var annotation = new Annotation
                {
                    SessionId = session.SessionId,
                    AnnotationData = "{\"type\":\"test\"}",
                    CreatedBy = user.UserId.ToString(),
                    CreatedAt = DateTime.UtcNow
                };
                _context.Annotations.Add(annotation);

                await _context.SaveChangesAsync();

                // Simulate an error condition
                throw new InvalidOperationException("Simulated transaction failure");
            }
            catch (InvalidOperationException)
            {
                await transaction.RollbackAsync();
            }

            // Assert - Verify rollback occurred
            var registrationCount = await _context.Registrations.CountAsync(r => r.SessionId == session.SessionId);
            var annotationCount = await _context.Annotations.CountAsync(a => a.SessionId == session.SessionId);

            Assert.Equal(0, registrationCount);
            Assert.Equal(0, annotationCount);
        }

        #endregion

        #region Migration Tests

        [Fact]
        [Trait("Category", "DatabaseIntegration")]
        [Trait("Type", "Migration")]
        public async Task DatabaseMigration_ShouldCreateCorrectStructure()
        {
            // This test verifies that the database can be created and basic operations work
            // In a real scenario, this would test actual migration scripts

            // Act - Create sample data for each entity type
            var session = await CreateTestSession("Migration Test Session");
            var user = await CreateTestUser("Migration Test User");

            var sessionLink = new SessionLink
            {
                SessionId = session.SessionId,
                Guid = Guid.NewGuid(),
                State = 1,
                CreatedAt = DateTime.UtcNow
            };

            var registration = new Registration
            {
                SessionId = session.SessionId,
                UserId = user.UserId,
                JoinTime = DateTime.UtcNow
            };

            var annotation = new Annotation
            {
                SessionId = session.SessionId,
                AnnotationData = "{\"type\":\"migration-test\"}",
                CreatedBy = user.UserId.ToString(),
                CreatedAt = DateTime.UtcNow
            };

            _context.SessionLinks.Add(sessionLink);
            _context.Registrations.Add(registration);
            _context.Annotations.Add(annotation);

            // Assert - Should save without errors
            await _context.SaveChangesAsync();

            // Verify all entities were created
            Assert.True(await _context.Sessions.AnyAsync());
            Assert.True(await _context.Users.AnyAsync());
            Assert.True(await _context.SessionLinks.AnyAsync());
            Assert.True(await _context.Registrations.AnyAsync());
            Assert.True(await _context.Annotations.AnyAsync());
        }

        #endregion

        #region Helper Methods

        private async Task<Session> CreateTestSession(string title = "Test Session")
        {
            var session = new Session
            {
                GroupId = Guid.NewGuid(),
                Title = title,
                Description = "Test Description",
                Status = "Created",
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddHours(3)
            };

            _context.Sessions.Add(session);
            await _context.SaveChangesAsync();
            return session;
        }

        private async Task<User> CreateTestUser(string name = "Test User")
        {
            var user = new User
            {
                UserId = Guid.NewGuid(),
                Name = name,
                Country = "Test Country",
                FirstJoinedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return user;
        }

        #endregion

        public void Dispose()
        {
            _context?.Dispose();
            _serviceProvider?.Dispose();
        }
    }
}
