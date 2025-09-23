using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NoorCanvas.Migrations
{
    /// <inheritdoc />
    public partial class RemoveUnusedTokenColumnsCleanup : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "KSessionsId",
                schema: "canvas",
                table: "Sessions");

            migrationBuilder.DropColumn(
                name: "TokenAccessCount",
                schema: "canvas",
                table: "Sessions");

            migrationBuilder.DropColumn(
                name: "TokenCreatedByIp",
                schema: "canvas",
                table: "Sessions");

            migrationBuilder.DropColumn(
                name: "TokenExpiresAt",
                schema: "canvas",
                table: "Sessions");

            migrationBuilder.DropColumn(
                name: "TokenLastAccessedAt",
                schema: "canvas",
                table: "Sessions");

            migrationBuilder.RenameColumn(
                name: "HostGuid",
                schema: "canvas",
                table: "Sessions",
                newName: "HostAuthToken");

            migrationBuilder.RenameColumn(
                name: "GroupId",
                schema: "canvas",
                table: "Sessions",
                newName: "AlbumId");

            migrationBuilder.AddColumn<string>(
                name: "UserToken",
                schema: "canvas",
                table: "Participants",
                type: "varchar(8)",
                maxLength: 8,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "AssetLookup",
                schema: "canvas",
                columns: table => new
                {
                    AssetId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AssetIdentifier = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    AssetType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    CssSelector = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    DisplayName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AssetLookup", x => x.AssetId);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AssetLookup_Type_Active",
                schema: "canvas",
                table: "AssetLookup",
                columns: new[] { "AssetType", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "UQ_AssetLookup_Identifier",
                schema: "canvas",
                table: "AssetLookup",
                column: "AssetIdentifier",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AssetLookup",
                schema: "canvas");

            migrationBuilder.DropColumn(
                name: "UserToken",
                schema: "canvas",
                table: "Participants");

            migrationBuilder.RenameColumn(
                name: "HostAuthToken",
                schema: "canvas",
                table: "Sessions",
                newName: "HostGuid");

            migrationBuilder.RenameColumn(
                name: "AlbumId",
                schema: "canvas",
                table: "Sessions",
                newName: "GroupId");

            migrationBuilder.AddColumn<long>(
                name: "KSessionsId",
                schema: "canvas",
                table: "Sessions",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TokenAccessCount",
                schema: "canvas",
                table: "Sessions",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "TokenCreatedByIp",
                schema: "canvas",
                table: "Sessions",
                type: "nvarchar(45)",
                maxLength: 45,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "TokenExpiresAt",
                schema: "canvas",
                table: "Sessions",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "TokenLastAccessedAt",
                schema: "canvas",
                table: "Sessions",
                type: "datetime2",
                nullable: true);
        }
    }
}
