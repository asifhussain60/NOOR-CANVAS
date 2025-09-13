using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NoorCanvas.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddAdminSessions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                schema: "canvas",
                table: "Users",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                schema: "canvas",
                table: "Users",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastSeenAt",
                schema: "canvas",
                table: "Users",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ModifiedAt",
                schema: "canvas",
                table: "Users",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "UserGuid",
                schema: "canvas",
                table: "Users",
                type: "nvarchar(256)",
                maxLength: 256,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Description",
                schema: "canvas",
                table: "Sessions",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "HostGuid",
                schema: "canvas",
                table: "Sessions",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "MaxParticipants",
                schema: "canvas",
                table: "Sessions",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ModifiedAt",
                schema: "canvas",
                table: "Sessions",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<int>(
                name: "ParticipantCount",
                schema: "canvas",
                table: "Sessions",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                schema: "canvas",
                table: "Sessions",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Title",
                schema: "canvas",
                table: "Sessions",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "AdminSessions",
                schema: "canvas",
                columns: table => new
                {
                    AdminSessionId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AdminGuid = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    SessionToken = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LastUsedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    UserAgent = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    IpAddress = table.Column<string>(type: "nvarchar(45)", maxLength: 45, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AdminSessions", x => x.AdminSessionId);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AdminSessions",
                schema: "canvas");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                schema: "canvas",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "IsActive",
                schema: "canvas",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "LastSeenAt",
                schema: "canvas",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ModifiedAt",
                schema: "canvas",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "UserGuid",
                schema: "canvas",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Description",
                schema: "canvas",
                table: "Sessions");

            migrationBuilder.DropColumn(
                name: "HostGuid",
                schema: "canvas",
                table: "Sessions");

            migrationBuilder.DropColumn(
                name: "MaxParticipants",
                schema: "canvas",
                table: "Sessions");

            migrationBuilder.DropColumn(
                name: "ModifiedAt",
                schema: "canvas",
                table: "Sessions");

            migrationBuilder.DropColumn(
                name: "ParticipantCount",
                schema: "canvas",
                table: "Sessions");

            migrationBuilder.DropColumn(
                name: "Status",
                schema: "canvas",
                table: "Sessions");

            migrationBuilder.DropColumn(
                name: "Title",
                schema: "canvas",
                table: "Sessions");
        }
    }
}
