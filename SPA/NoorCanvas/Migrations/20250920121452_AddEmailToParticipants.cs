using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NoorCanvas.Migrations
{
    /// <inheritdoc />
    public partial class AddEmailToParticipants : Migration
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
                    KSessionsId = table.Column<long>(type: "bigint", nullable: true),
                    HostToken = table.Column<string>(type: "nvarchar(8)", maxLength: 8, nullable: false),
                    UserToken = table.Column<string>(type: "nvarchar(8)", maxLength: 8, nullable: false),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    GroupId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StartedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    EndedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    HostGuid = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    MaxParticipants = table.Column<int>(type: "int", nullable: true),
                    ParticipantCount = table.Column<int>(type: "int", nullable: true),
                    TokenExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    TokenAccessCount = table.Column<int>(type: "int", nullable: false),
                    TokenCreatedByIp = table.Column<string>(type: "nvarchar(45)", maxLength: 45, nullable: true),
                    TokenLastAccessedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Sessions", x => x.SessionId);
                });

            migrationBuilder.CreateTable(
                name: "Participants",
                schema: "canvas",
                columns: table => new
                {
                    ParticipantId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SessionId = table.Column<long>(type: "bigint", nullable: false),
                    UserGuid = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Email = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    Country = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    City = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    JoinedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LastSeenAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Participants", x => x.ParticipantId);
                    table.ForeignKey(
                        name: "FK_Participants_Sessions_SessionId",
                        column: x => x.SessionId,
                        principalSchema: "canvas",
                        principalTable: "Sessions",
                        principalColumn: "SessionId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SessionData",
                schema: "canvas",
                columns: table => new
                {
                    DataId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SessionId = table.Column<long>(type: "bigint", nullable: false),
                    DataType = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Content = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SessionData", x => x.DataId);
                    table.ForeignKey(
                        name: "FK_SessionData_Sessions_SessionId",
                        column: x => x.SessionId,
                        principalSchema: "canvas",
                        principalTable: "Sessions",
                        principalColumn: "SessionId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Participants_SessionId",
                schema: "canvas",
                table: "Participants",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_Participants_SessionUser",
                schema: "canvas",
                table: "Participants",
                columns: new[] { "SessionId", "UserGuid" });

            migrationBuilder.CreateIndex(
                name: "IX_SessionData_Query_Optimized",
                schema: "canvas",
                table: "SessionData",
                columns: new[] { "SessionId", "DataType", "IsDeleted", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_SessionData_Session_Type",
                schema: "canvas",
                table: "SessionData",
                columns: new[] { "SessionId", "DataType" });

            migrationBuilder.CreateIndex(
                name: "IX_SessionData_SessionId",
                schema: "canvas",
                table: "SessionData",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_Sessions_Status_Expires",
                schema: "canvas",
                table: "Sessions",
                columns: new[] { "Status", "ExpiresAt" });

            migrationBuilder.CreateIndex(
                name: "UQ_Sessions_HostToken",
                schema: "canvas",
                table: "Sessions",
                column: "HostToken",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UQ_Sessions_UserToken",
                schema: "canvas",
                table: "Sessions",
                column: "UserToken",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Participants",
                schema: "canvas");

            migrationBuilder.DropTable(
                name: "SessionData",
                schema: "canvas");

            migrationBuilder.DropTable(
                name: "Sessions",
                schema: "canvas");
        }
    }
}
