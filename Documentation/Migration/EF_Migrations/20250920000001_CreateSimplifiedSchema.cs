using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NoorCanvas.Data.Migrations
{
    /// <inheritdoc />
    public partial class CreateSimplifiedSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Create new simplified Sessions table
            migrationBuilder.CreateTable(
                name: "Sessions_New",
                schema: "canvas",
                columns: table => new
                {
                    SessionId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    HostToken = table.Column<string>(type: "varchar(8)", maxLength: 8, nullable: false),
                    UserToken = table.Column<string>(type: "varchar(8)", maxLength: 8, nullable: false),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "Active"),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Sessions_New", x => x.SessionId);
                });

            // Create new Participants table (consolidates Users + Registrations + SessionParticipants)
            migrationBuilder.CreateTable(
                name: "Participants_New",
                schema: "canvas",
                columns: table => new
                {
                    ParticipantId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SessionId = table.Column<int>(type: "int", nullable: false),
                    UserGuid = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Country = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    City = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    JoinedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    LastSeenAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Participants_New", x => x.ParticipantId);
                    table.ForeignKey(
                        name: "FK_Participants_New_Sessions_New_SessionId",
                        column: x => x.SessionId,
                        principalSchema: "canvas",
                        principalTable: "Sessions_New",
                        principalColumn: "SessionId",
                        onDelete: ReferentialAction.Cascade);
                });

            // Create new SessionData table (consolidates Annotations + SharedAssets + Questions + QuestionAnswers)
            migrationBuilder.CreateTable(
                name: "SessionData_New",
                schema: "canvas",
                columns: table => new
                {
                    DataId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SessionId = table.Column<int>(type: "int", nullable: false),
                    DataType = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Content = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SessionData_New", x => x.DataId);
                    table.ForeignKey(
                        name: "FK_SessionData_New_Sessions_New_SessionId",
                        column: x => x.SessionId,
                        principalSchema: "canvas",
                        principalTable: "Sessions_New",
                        principalColumn: "SessionId",
                        onDelete: ReferentialAction.Cascade);
                });

            // Create indexes for optimal performance
            migrationBuilder.CreateIndex(
                name: "UQ_Sessions_New_HostToken",
                schema: "canvas",
                table: "Sessions_New",
                column: "HostToken",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UQ_Sessions_New_UserToken",
                schema: "canvas",
                table: "Sessions_New",
                column: "UserToken",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Sessions_New_Status_Expires",
                schema: "canvas",
                table: "Sessions_New",
                columns: new[] { "Status", "ExpiresAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Participants_New_SessionId",
                schema: "canvas",
                table: "Participants_New",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_Participants_New_SessionUser",
                schema: "canvas",
                table: "Participants_New",
                columns: new[] { "SessionId", "UserGuid" });

            migrationBuilder.CreateIndex(
                name: "IX_SessionData_New_SessionId",
                schema: "canvas",
                table: "SessionData_New",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_SessionData_New_Session_Type",
                schema: "canvas",
                table: "SessionData_New",
                columns: new[] { "SessionId", "DataType" });

            migrationBuilder.CreateIndex(
                name: "IX_SessionData_New_Query_Optimized",
                schema: "canvas",
                table: "SessionData_New",
                columns: new[] { "SessionId", "DataType", "IsDeleted", "CreatedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Drop new tables in reverse order (child tables first)
            migrationBuilder.DropTable(
                name: "SessionData_New",
                schema: "canvas");

            migrationBuilder.DropTable(
                name: "Participants_New",
                schema: "canvas");

            migrationBuilder.DropTable(
                name: "Sessions_New",
                schema: "canvas");
        }
    }
}