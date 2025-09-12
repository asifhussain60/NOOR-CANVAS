using Xunit;
using Microsoft.EntityFrameworkCore;
using NoorCanvas.Data;
using NoorCanvas.Models;
using System.ComponentModel.DataAnnotations;

namespace NoorCanvas.Core.Tests.Models
{
    /// <summary>
    /// Comprehensive test suite for domain models and entities
    /// Tests property validation, relationships, constraints, and business logic
    /// </summary>
    public class ModelValidationTests : IDisposable
    {
        private readonly CanvasDbContext _context;

        public ModelValidationTests()
        {
            var options = new DbContextOptionsBuilder<CanvasDbContext>()
                .UseInMemoryDatabase(databaseName: $"ModelValidation_Tests_{Guid.NewGuid()}")
                .Options;

            _context = new CanvasDbContext(options);
            _context.Database.EnsureCreated();
        }

        #region Session Model Tests

        [Fact]
        [Trait("Category", "Models")]
        [Trait("Entity", "Session")]
        public void Session_ValidInstance_ShouldHaveCorrectProperties()
        {
            // Arrange & Act
            var session = new Session
            {
                GroupId = Guid.NewGuid(),
                Title = "Test Session",
                Description = "Test Description",
                Status = "Created",
                ParticipantCount = 5,
                MaxParticipants = 100,
                HostGuid = Guid.NewGuid().ToString(),
                StartedAt = DateTime.UtcNow.AddMinutes(-30),
                EndedAt = null,
                ExpiresAt = DateTime.UtcNow.AddHours(3),
                CreatedAt = DateTime.UtcNow,
                ModifiedAt = DateTime.UtcNow
            };

            // Assert
            Assert.True(session.GroupId != Guid.Empty);
            Assert.Equal("Test Session", session.Title);
            Assert.Equal("Test Description", session.Description);
            Assert.Equal("Created", session.Status);
            Assert.Equal(5, session.ParticipantCount);
            Assert.Equal(100, session.MaxParticipants);
            Assert.NotNull(session.HostGuid);
            Assert.NotNull(session.StartedAt);
            Assert.Null(session.EndedAt);
            Assert.NotNull(session.ExpiresAt);
            Assert.True(session.CreatedAt > DateTime.MinValue);
            Assert.True(session.ModifiedAt > DateTime.MinValue);
        }

        [Fact]
        [Trait("Category", "Models")]
        [Trait("Entity", "Session")]
        public async Task Session_WithNavigationProperties_ShouldInitializeCollections()
        {
            // Arrange
            var session = new Session
            {
                GroupId = Guid.NewGuid(),
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddHours(3)
            };

            // Act & Assert
            Assert.NotNull(session.SessionLinks);
            Assert.NotNull(session.HostSessions);
            Assert.NotNull(session.Registrations);
            Assert.NotNull(session.SharedAssets);
            Assert.NotNull(session.Annotations);
            Assert.NotNull(session.Questions);

            Assert.Empty(session.SessionLinks);
            Assert.Empty(session.HostSessions);
            Assert.Empty(session.Registrations);
            Assert.Empty(session.SharedAssets);
            Assert.Empty(session.Annotations);
            Assert.Empty(session.Questions);
        }

        [Theory]
        [Trait("Category", "Models")]
        [Trait("Entity", "Session")]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("This title is way too long and exceeds the maximum length allowed for session titles which should be validated properly by the model constraints")]
        public void Session_WithInvalidTitle_ShouldFailValidation(string invalidTitle)
        {
            // Arrange
            var session = new Session
            {
                GroupId = Guid.NewGuid(),
                Title = invalidTitle,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddHours(3)
            };

            // Act & Assert
            var validationResults = ValidateModel(session);
            
            if (string.IsNullOrEmpty(invalidTitle))
            {
                // Null/empty titles should be allowed (optional field)
                Assert.Empty(validationResults);
            }
            else
            {
                // Overly long titles should fail validation
                Assert.Contains(validationResults, v => v.MemberNames.Contains("Title"));
            }
        }

        #endregion

        #region User Model Tests

        [Fact]
        [Trait("Category", "Models")]
        [Trait("Entity", "User")]
        public void User_ValidInstance_ShouldHaveCorrectProperties()
        {
            // Arrange & Act
            var user = new User
            {
                UserId = Guid.NewGuid(),
                Name = "John Doe",
                City = "New York",
                Country = "United States",
                FirstJoinedAt = DateTime.UtcNow.AddDays(-30),
                LastJoinedAt = DateTime.UtcNow
            };

            // Assert
            Assert.True(user.UserId != Guid.Empty);
            Assert.Equal("John Doe", user.Name);
            Assert.Equal("New York", user.City);
            Assert.Equal("United States", user.Country);
            Assert.True(user.FirstJoinedAt < user.LastJoinedAt);
            Assert.NotNull(user.Registrations);
            Assert.NotNull(user.Questions);
            Assert.NotNull(user.QuestionVotes);
        }

        [Theory]
        [Trait("Category", "Models")]
        [Trait("Entity", "User")]
        [InlineData("", "Valid City", "Valid Country")]
        [InlineData(null, "Valid City", "Valid Country")]
        [InlineData("Valid Name", "", "Valid Country")]
        [InlineData("Valid Name", null, "Valid Country")]
        [InlineData("Valid Name", "Valid City", "")]
        [InlineData("Valid Name", "Valid City", null)]
        public void User_WithMissingRequiredFields_ShouldFailValidation(string name, string city, string country)
        {
            // Arrange
            var user = new User
            {
                UserId = Guid.NewGuid(),
                Name = name,
                City = city,
                Country = country,
                FirstJoinedAt = DateTime.UtcNow
            };

            // Act
            var validationResults = ValidateModel(user);

            // Assert - Should have validation errors for required fields
            if (string.IsNullOrEmpty(name))
            {
                Assert.Contains(validationResults, v => v.MemberNames.Contains("Name"));
            }
            if (string.IsNullOrEmpty(city))
            {
                Assert.Contains(validationResults, v => v.MemberNames.Contains("City"));
            }
            if (string.IsNullOrEmpty(country))
            {
                Assert.Contains(validationResults, v => v.MemberNames.Contains("Country"));
            }
        }

        #endregion

        #region Registration Model Tests

        [Fact]
        [Trait("Category", "Models")]
        [Trait("Entity", "Registration")]
        public async Task Registration_ValidInstance_ShouldCreateSuccessfully()
        {
            // Arrange
            var session = await CreateTestSession();
            var user = await CreateTestUser();

            var registration = new Registration
            {
                SessionId = session.SessionId,
                UserId = user.UserId,
                JoinTime = DateTime.UtcNow
            };

            // Act
            _context.Registrations.Add(registration);
            await _context.SaveChangesAsync();

            // Assert
            var savedRegistration = await _context.Registrations
                .Include(r => r.Session)
                .Include(r => r.User)
                .FirstOrDefaultAsync(r => r.RegistrationId == registration.RegistrationId);

            Assert.NotNull(savedRegistration);
            Assert.Equal(session.SessionId, savedRegistration.SessionId);
            Assert.Equal(user.UserId, savedRegistration.UserId);
            Assert.NotNull(savedRegistration.Session);
            Assert.NotNull(savedRegistration.User);
        }

        [Fact]
        [Trait("Category", "Models")]
        [Trait("Entity", "Registration")]
        public async Task Registration_DuplicateUserSession_ShouldFailUniqueConstraint()
        {
            // Arrange
            var session = await CreateTestSession();
            var user = await CreateTestUser();

            var registration1 = new Registration
            {
                SessionId = session.SessionId,
                UserId = user.UserId,
                JoinTime = DateTime.UtcNow
            };

            var registration2 = new Registration
            {
                SessionId = session.SessionId,
                UserId = user.UserId, // Same user trying to register again
                JoinTime = DateTime.UtcNow.AddMinutes(5)
            };

            // Act & Assert
            _context.Registrations.Add(registration1);
            await _context.SaveChangesAsync();

            _context.Registrations.Add(registration2);
            
            await Assert.ThrowsAsync<InvalidOperationException>(() => _context.SaveChangesAsync());
        }

        #endregion

        #region Annotation Model Tests

        [Fact]
        [Trait("Category", "Models")]
        [Trait("Entity", "Annotation")]
        public async Task Annotation_ValidInstance_ShouldCreateSuccessfully()
        {
            // Arrange
            var session = await CreateTestSession();
            var annotationData = @"{""type"":""highlight"",""text"":""Selected text"",""color"":""#ffff00""}";

            var annotation = new Annotation
            {
                SessionId = session.SessionId,
                AnnotationData = annotationData,
                CreatedBy = "test-user",
                CreatedAt = DateTime.UtcNow
            };

            // Act
            _context.Annotations.Add(annotation);
            await _context.SaveChangesAsync();

            // Assert
            var savedAnnotation = await _context.Annotations
                .Include(a => a.Session)
                .FirstOrDefaultAsync(a => a.AnnotationId == annotation.AnnotationId);

            Assert.NotNull(savedAnnotation);
            Assert.Equal(session.SessionId, savedAnnotation.SessionId);
            Assert.Equal(annotationData, savedAnnotation.AnnotationData);
            Assert.Equal("test-user", savedAnnotation.CreatedBy);
            Assert.NotNull(savedAnnotation.Session);
        }

        [Theory]
        [Trait("Category", "Models")]
        [Trait("Entity", "Annotation")]
        [InlineData(null)]
        [InlineData("")]
        public void Annotation_WithInvalidAnnotationData_ShouldFailValidation(string invalidData)
        {
            // Arrange
            var annotation = new Annotation
            {
                SessionId = 1,
                AnnotationData = invalidData,
                CreatedBy = "test-user",
                CreatedAt = DateTime.UtcNow
            };

            // Act
            var validationResults = ValidateModel(annotation);

            // Assert
            if (string.IsNullOrEmpty(invalidData))
            {
                Assert.Contains(validationResults, v => v.MemberNames.Contains("AnnotationData"));
            }
        }

        #endregion

        #region SessionLink Model Tests

        [Fact]
        [Trait("Category", "Models")]
        [Trait("Entity", "SessionLink")]
        public async Task SessionLink_ValidInstance_ShouldCreateSuccessfully()
        {
            // Arrange
            var session = await CreateTestSession();

            var sessionLink = new SessionLink
            {
                SessionId = session.SessionId,
                Guid = Guid.NewGuid(),
                State = 1, // Active
                CreatedAt = DateTime.UtcNow
            };

            // Act
            _context.SessionLinks.Add(sessionLink);
            await _context.SaveChangesAsync();

            // Assert
            var savedLink = await _context.SessionLinks
                .Include(sl => sl.Session)
                .FirstOrDefaultAsync(sl => sl.LinkId == sessionLink.LinkId);

            Assert.NotNull(savedLink);
            Assert.Equal(session.SessionId, savedLink.SessionId);
            Assert.True(savedLink.Guid != Guid.Empty);
            Assert.Equal(1, savedLink.State);
            Assert.NotNull(savedLink.Session);
        }

        #endregion

        #region Question Model Tests

        [Fact]
        [Trait("Category", "Models")]
        [Trait("Entity", "Question")]
        public async Task Question_ValidInstance_ShouldCreateSuccessfully()
        {
            // Arrange
            var session = await CreateTestSession();
            var user = await CreateTestUser();

            var question = new Question
            {
                SessionId = session.SessionId,
                UserId = user.UserId,
                QuestionText = "What is the meaning of this verse?",
                Status = "Pending",
                VoteCount = 0,
                QueuedAt = DateTime.UtcNow
            };

            // Act
            _context.Questions.Add(question);
            await _context.SaveChangesAsync();

            // Assert
            var savedQuestion = await _context.Questions
                .Include(q => q.Session)
                .Include(q => q.User)
                .FirstOrDefaultAsync(q => q.QuestionId == question.QuestionId);

            Assert.NotNull(savedQuestion);
            Assert.Equal(session.SessionId, savedQuestion.SessionId);
            Assert.Equal(user.UserId, savedQuestion.UserId);
            Assert.Equal("What is the meaning of this verse?", savedQuestion.QuestionText);
            Assert.Equal("Pending", savedQuestion.Status);
            Assert.NotNull(savedQuestion.Session);
            Assert.NotNull(savedQuestion.User);
        }

        #endregion

        #region Database Relationship Tests

        [Fact]
        [Trait("Category", "Models")]
        [Trait("Type", "Relationships")]
        public async Task SessionDeletion_ShouldCascadeToRelatedEntities()
        {
            // Arrange
            var session = await CreateTestSession();
            var user = await CreateTestUser();

            // Create related entities
            var registration = new Registration { SessionId = session.SessionId, UserId = user.UserId };
            var annotation = new Annotation { SessionId = session.SessionId, AnnotationData = "{}", CreatedBy = "user" };
            var sessionLink = new SessionLink { SessionId = session.SessionId, Guid = Guid.NewGuid(), State = 1 };

            _context.Registrations.Add(registration);
            _context.Annotations.Add(annotation);
            _context.SessionLinks.Add(sessionLink);
            await _context.SaveChangesAsync();

            var registrationId = registration.RegistrationId;
            var annotationId = annotation.AnnotationId;
            var sessionLinkId = sessionLink.LinkId;

            // Act - Delete the session
            _context.Sessions.Remove(session);
            await _context.SaveChangesAsync();

            // Assert - Related entities should be cascaded deleted
            Assert.Null(await _context.Registrations.FindAsync(registrationId));
            Assert.Null(await _context.Annotations.FindAsync(annotationId));
            Assert.Null(await _context.SessionLinks.FindAsync(sessionLinkId));
            
            // User should still exist (restrict delete)
            Assert.NotNull(await _context.Users.FindAsync(user.UserId));
        }

        [Fact]
        [Trait("Category", "Models")]
        [Trait("Type", "Relationships")]
        public async Task UserDeletion_WithRegistrations_ShouldBeRestricted()
        {
            // Arrange
            var session = await CreateTestSession();
            var user = await CreateTestUser();
            var registration = new Registration { SessionId = session.SessionId, UserId = user.UserId };

            _context.Registrations.Add(registration);
            await _context.SaveChangesAsync();

            // Act & Assert - User deletion should be restricted due to existing registration
            _context.Users.Remove(user);
            await Assert.ThrowsAsync<DbUpdateException>(() => _context.SaveChangesAsync());
        }

        #endregion

        #region Helper Methods

        private async Task<Session> CreateTestSession()
        {
            var session = new Session
            {
                GroupId = Guid.NewGuid(),
                Title = "Test Session",
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddHours(3)
            };

            _context.Sessions.Add(session);
            await _context.SaveChangesAsync();
            return session;
        }

        private async Task<User> CreateTestUser()
        {
            var user = new User
            {
                UserId = Guid.NewGuid(),
                Name = "Test User",
                City = "Test City", 
                Country = "Test Country",
                FirstJoinedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return user;
        }

        private List<ValidationResult> ValidateModel(object model)
        {
            var validationResults = new List<ValidationResult>();
            var validationContext = new ValidationContext(model);
            Validator.TryValidateObject(model, validationContext, validationResults, true);
            return validationResults;
        }

        #endregion

        public void Dispose()
        {
            _context.Dispose();
        }
    }
}

namespace NoorCanvas.Core.Tests.Models
{
    /// <summary>
    /// Business logic tests for domain models
    /// Tests model behavior, computed properties, and business rules
    /// </summary>
    public class ModelBusinessLogicTests : IDisposable
    {
        private readonly CanvasDbContext _context;

        public ModelBusinessLogicTests()
        {
            var options = new DbContextOptionsBuilder<CanvasDbContext>()
                .UseInMemoryDatabase(databaseName: $"ModelBusinessLogic_Tests_{Guid.NewGuid()}")
                .Options;

            _context = new CanvasDbContext(options);
            _context.Database.EnsureCreated();
        }

        [Fact]
        [Trait("Category", "BusinessLogic")]
        [Trait("Entity", "Session")]
        public void Session_StatusDetermination_ShouldReflectLifecycle()
        {
            // Test different session states
            var createdSession = new Session { CreatedAt = DateTime.UtcNow, ExpiresAt = DateTime.UtcNow.AddHours(3) };
            var activeSession = new Session { CreatedAt = DateTime.UtcNow, StartedAt = DateTime.UtcNow, ExpiresAt = DateTime.UtcNow.AddHours(3) };
            var completedSession = new Session { CreatedAt = DateTime.UtcNow, StartedAt = DateTime.UtcNow, EndedAt = DateTime.UtcNow.AddHours(1), ExpiresAt = DateTime.UtcNow.AddHours(3) };
            var expiredSession = new Session { CreatedAt = DateTime.UtcNow.AddHours(-5), ExpiresAt = DateTime.UtcNow.AddHours(-1) };

            // Business logic for determining status (this would typically be in a service or computed property)
            Assert.True(IsSessionActive(activeSession));
            Assert.False(IsSessionActive(createdSession));
            Assert.False(IsSessionActive(completedSession));
            Assert.False(IsSessionActive(expiredSession));
        }

        [Fact]
        [Trait("Category", "BusinessLogic")]
        [Trait("Entity", "Registration")]
        public async Task Registration_ParticipantCounting_ShouldBeAccurate()
        {
            // Arrange
            var session = await CreateTestSession();
            var users = new[]
            {
                await CreateTestUser("User1"),
                await CreateTestUser("User2"),
                await CreateTestUser("User3")
            };

            // Act - Register users
            foreach (var user in users)
            {
                var registration = new Registration
                {
                    SessionId = session.SessionId,
                    UserId = user.UserId,
                    JoinTime = DateTime.UtcNow
                };
                _context.Registrations.Add(registration);
            }
            await _context.SaveChangesAsync();

            // Assert
            var participantCount = await _context.Registrations
                .CountAsync(r => r.SessionId == session.SessionId);
            
            Assert.Equal(3, participantCount);
        }

        [Fact]
        [Trait("Category", "BusinessLogic")]
        [Trait("Entity", "Question")]
        public async Task Question_VoteCounting_ShouldCalculateCorrectly()
        {
            // Arrange
            var session = await CreateTestSession();
            var questionUser = await CreateTestUser("QuestionUser");
            var voters = new[]
            {
                await CreateTestUser("Voter1"),
                await CreateTestUser("Voter2"),
                await CreateTestUser("Voter3")
            };

            var question = new Question
            {
                SessionId = session.SessionId,
                UserId = questionUser.UserId,
                QuestionText = "Test question",
                Status = "Pending",
                VoteCount = 0,
                QueuedAt = DateTime.UtcNow
            };

            _context.Questions.Add(question);
            await _context.SaveChangesAsync();

            // Act - Add votes
            foreach (var voter in voters)
            {
                var vote = new QuestionVote
                {
                    QuestionId = question.QuestionId,
                    UserId = voter.UserId,
                    VoteValue = 1, // Upvote
                    VotedAt = DateTime.UtcNow
                };
                _context.QuestionVotes.Add(vote);
            }
            await _context.SaveChangesAsync();

            // Assert
            var totalVotes = await _context.QuestionVotes
                .Where(v => v.QuestionId == question.QuestionId)
                .SumAsync(v => v.VoteValue);

            Assert.Equal(3, totalVotes);
        }

        [Theory]
        [Trait("Category", "BusinessLogic")]
        [Trait("Entity", "Session")]
        [InlineData(-1, false)] // Expired
        [InlineData(1, true)]   // Valid
        [InlineData(0.5, true)] // Valid (30 minutes remaining)
        public void Session_ExpirationLogic_ShouldDetermineValidSessions(double hoursFromNow, bool shouldBeValid)
        {
            // Arrange
            var session = new Session
            {
                CreatedAt = DateTime.UtcNow.AddHours(-2),
                ExpiresAt = DateTime.UtcNow.AddHours(hoursFromNow)
            };

            // Act & Assert
            var isValid = session.ExpiresAt > DateTime.UtcNow;
            Assert.Equal(shouldBeValid, isValid);
        }

        [Fact]
        [Trait("Category", "BusinessLogic")]
        [Trait("Entity", "User")]
        public async Task User_ActivityTracking_ShouldUpdateCorrectly()
        {
            // Arrange
            var user = new User
            {
                UserId = Guid.NewGuid(),
                Name = "Test User",
                City = "Test City",
                Country = "Test Country",
                FirstJoinedAt = DateTime.UtcNow.AddDays(-30),
                LastJoinedAt = DateTime.UtcNow.AddDays(-7)
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var originalLastJoined = user.LastJoinedAt;

            // Act - Simulate user joining another session
            user.LastJoinedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            // Assert
            var updatedUser = await _context.Users.FindAsync(user.UserId);
            Assert.NotNull(updatedUser);
            Assert.True(updatedUser.LastJoinedAt > originalLastJoined);
            Assert.True(updatedUser.LastJoinedAt > updatedUser.FirstJoinedAt);
        }

        // Helper methods
        private bool IsSessionActive(Session session)
        {
            return session.StartedAt.HasValue && 
                   !session.EndedAt.HasValue && 
                   session.ExpiresAt > DateTime.UtcNow;
        }

        private async Task<Session> CreateTestSession()
        {
            var session = new Session
            {
                GroupId = Guid.NewGuid(),
                Title = "Test Session",
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
                City = "Test City",
                Country = "Test Country",
                FirstJoinedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return user;
        }

        public void Dispose()
        {
            _context.Dispose();
        }
    }
}
