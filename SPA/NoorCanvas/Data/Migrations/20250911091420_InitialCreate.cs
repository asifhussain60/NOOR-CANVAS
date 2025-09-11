using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NoorCanvas.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "canvas");

            migrationBuilder.CreateTable(
                name: "Sessions",
                schema: "canvas",
                columns: table => new
                {
                    SessionId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    GroupId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StartedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    EndedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Sessions", x => x.SessionId);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                schema: "canvas",
                columns: table => new
                {
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    City = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    Country = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    FirstJoinedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LastJoinedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.UserId);
                });

            migrationBuilder.CreateTable(
                name: "Annotations",
                schema: "canvas",
                columns: table => new
                {
                    AnnotationId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SessionId = table.Column<long>(type: "bigint", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    AnnotationData = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Annotations", x => x.AnnotationId);
                    table.ForeignKey(
                        name: "FK_Annotations_Sessions_SessionId",
                        column: x => x.SessionId,
                        principalSchema: "canvas",
                        principalTable: "Sessions",
                        principalColumn: "SessionId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "HostSessions",
                schema: "canvas",
                columns: table => new
                {
                    HostSessionId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SessionId = table.Column<long>(type: "bigint", nullable: false),
                    HostGuidHash = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastUsedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    RevokedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    RevokedBy = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HostSessions", x => x.HostSessionId);
                    table.ForeignKey(
                        name: "FK_HostSessions_Sessions_SessionId",
                        column: x => x.SessionId,
                        principalSchema: "canvas",
                        principalTable: "Sessions",
                        principalColumn: "SessionId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SessionLinks",
                schema: "canvas",
                columns: table => new
                {
                    LinkId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SessionId = table.Column<long>(type: "bigint", nullable: false),
                    Guid = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    State = table.Column<byte>(type: "tinyint", nullable: false),
                    LastUsedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UseCount = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SessionLinks", x => x.LinkId);
                    table.ForeignKey(
                        name: "FK_SessionLinks_Sessions_SessionId",
                        column: x => x.SessionId,
                        principalSchema: "canvas",
                        principalTable: "Sessions",
                        principalColumn: "SessionId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SharedAssets",
                schema: "canvas",
                columns: table => new
                {
                    AssetId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SessionId = table.Column<long>(type: "bigint", nullable: false),
                    SharedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    AssetType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    AssetData = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SharedAssets", x => x.AssetId);
                    table.ForeignKey(
                        name: "FK_SharedAssets_Sessions_SessionId",
                        column: x => x.SessionId,
                        principalSchema: "canvas",
                        principalTable: "Sessions",
                        principalColumn: "SessionId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AuditLog",
                schema: "canvas",
                columns: table => new
                {
                    EventId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    At = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Actor = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    SessionId = table.Column<long>(type: "bigint", nullable: true),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Action = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Details = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditLog", x => x.EventId);
                    table.ForeignKey(
                        name: "FK_AuditLog_Sessions_SessionId",
                        column: x => x.SessionId,
                        principalSchema: "canvas",
                        principalTable: "Sessions",
                        principalColumn: "SessionId");
                    table.ForeignKey(
                        name: "FK_AuditLog_Users_UserId",
                        column: x => x.UserId,
                        principalSchema: "canvas",
                        principalTable: "Users",
                        principalColumn: "UserId");
                });

            migrationBuilder.CreateTable(
                name: "Issues",
                schema: "canvas",
                columns: table => new
                {
                    IssueId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Priority = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Category = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    ReportedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    SessionId = table.Column<long>(type: "bigint", nullable: true),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ReportedBy = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    Context = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Issues", x => x.IssueId);
                    table.ForeignKey(
                        name: "FK_Issues_Sessions_SessionId",
                        column: x => x.SessionId,
                        principalSchema: "canvas",
                        principalTable: "Sessions",
                        principalColumn: "SessionId");
                    table.ForeignKey(
                        name: "FK_Issues_Users_UserId",
                        column: x => x.UserId,
                        principalSchema: "canvas",
                        principalTable: "Users",
                        principalColumn: "UserId");
                });

            migrationBuilder.CreateTable(
                name: "Questions",
                schema: "canvas",
                columns: table => new
                {
                    QuestionId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SessionId = table.Column<long>(type: "bigint", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    QuestionText = table.Column<string>(type: "nvarchar(280)", maxLength: 280, nullable: false),
                    QueuedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    AnsweredAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    VoteCount = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Questions", x => x.QuestionId);
                    table.ForeignKey(
                        name: "FK_Questions_Sessions_SessionId",
                        column: x => x.SessionId,
                        principalSchema: "canvas",
                        principalTable: "Sessions",
                        principalColumn: "SessionId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Questions_Users_UserId",
                        column: x => x.UserId,
                        principalSchema: "canvas",
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Registrations",
                schema: "canvas",
                columns: table => new
                {
                    RegistrationId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SessionId = table.Column<long>(type: "bigint", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    JoinTime = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Registrations", x => x.RegistrationId);
                    table.ForeignKey(
                        name: "FK_Registrations_Sessions_SessionId",
                        column: x => x.SessionId,
                        principalSchema: "canvas",
                        principalTable: "Sessions",
                        principalColumn: "SessionId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Registrations_Users_UserId",
                        column: x => x.UserId,
                        principalSchema: "canvas",
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "QuestionAnswers",
                schema: "canvas",
                columns: table => new
                {
                    AnswerId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    QuestionId = table.Column<long>(type: "bigint", nullable: false),
                    PostedBy = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    PostedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    AnswerText = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuestionAnswers", x => x.AnswerId);
                    table.ForeignKey(
                        name: "FK_QuestionAnswers_Questions_QuestionId",
                        column: x => x.QuestionId,
                        principalSchema: "canvas",
                        principalTable: "Questions",
                        principalColumn: "QuestionId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "QuestionVotes",
                schema: "canvas",
                columns: table => new
                {
                    VoteId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    QuestionId = table.Column<long>(type: "bigint", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    VoteValue = table.Column<byte>(type: "tinyint", nullable: false),
                    VotedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuestionVotes", x => x.VoteId);
                    table.ForeignKey(
                        name: "FK_QuestionVotes_Questions_QuestionId",
                        column: x => x.QuestionId,
                        principalSchema: "canvas",
                        principalTable: "Questions",
                        principalColumn: "QuestionId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_QuestionVotes_Users_UserId",
                        column: x => x.UserId,
                        principalSchema: "canvas",
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Annotations_SessionId",
                schema: "canvas",
                table: "Annotations",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_AuditLog_SessionId",
                schema: "canvas",
                table: "AuditLog",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_AuditLog_UserId",
                schema: "canvas",
                table: "AuditLog",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_HostSessions_SessionGuidHash",
                schema: "canvas",
                table: "HostSessions",
                columns: new[] { "SessionId", "HostGuidHash" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Issues_SessionId",
                schema: "canvas",
                table: "Issues",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_Issues_UserId",
                schema: "canvas",
                table: "Issues",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_QuestionAnswers_QuestionId",
                schema: "canvas",
                table: "QuestionAnswers",
                column: "QuestionId");

            migrationBuilder.CreateIndex(
                name: "IX_Questions_SessionStatusVoteQueue",
                schema: "canvas",
                table: "Questions",
                columns: new[] { "SessionId", "Status", "VoteCount", "QueuedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Questions_UserId",
                schema: "canvas",
                table: "Questions",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_QuestionVotes_UserId",
                schema: "canvas",
                table: "QuestionVotes",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "UQ_QuestionVotes_QuestionUser",
                schema: "canvas",
                table: "QuestionVotes",
                columns: new[] { "QuestionId", "UserId" },
                unique: true,
                filter: "[UserId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Registrations_SessionId",
                schema: "canvas",
                table: "Registrations",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "UQ_Registration_UserSession",
                schema: "canvas",
                table: "Registrations",
                columns: new[] { "UserId", "SessionId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SessionLinks_SessionId",
                schema: "canvas",
                table: "SessionLinks",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_SessionLinks_StateGuid",
                schema: "canvas",
                table: "SessionLinks",
                columns: new[] { "State", "Guid" });

            migrationBuilder.CreateIndex(
                name: "IX_SharedAssets_SessionShared",
                schema: "canvas",
                table: "SharedAssets",
                columns: new[] { "SessionId", "SharedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Annotations",
                schema: "canvas");

            migrationBuilder.DropTable(
                name: "AuditLog",
                schema: "canvas");

            migrationBuilder.DropTable(
                name: "HostSessions",
                schema: "canvas");

            migrationBuilder.DropTable(
                name: "Issues",
                schema: "canvas");

            migrationBuilder.DropTable(
                name: "QuestionAnswers",
                schema: "canvas");

            migrationBuilder.DropTable(
                name: "QuestionVotes",
                schema: "canvas");

            migrationBuilder.DropTable(
                name: "Registrations",
                schema: "canvas");

            migrationBuilder.DropTable(
                name: "SessionLinks",
                schema: "canvas");

            migrationBuilder.DropTable(
                name: "SharedAssets",
                schema: "canvas");

            migrationBuilder.DropTable(
                name: "Questions",
                schema: "canvas");

            migrationBuilder.DropTable(
                name: "Sessions",
                schema: "canvas");

            migrationBuilder.DropTable(
                name: "Users",
                schema: "canvas");
        }
    }
}
