using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NoorCanvas.Migrations
{
    /// <inheritdoc />
    public partial class AddAssetLookupTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "KSessionsId",
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

            migrationBuilder.CreateTable(
                name: "SessionAssetsLookup",
                schema: "canvas",
                columns: table => new
                {
                    AssetId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SessionId = table.Column<long>(type: "bigint", nullable: false),
                    AssetClass = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    AlternateClasses = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Position = table.Column<int>(type: "int", nullable: true),
                    CssPattern = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    InstanceCount = table.Column<int>(type: "int", nullable: false),
                    ClassScore = table.Column<int>(type: "int", nullable: false),
                    SharedCount = table.Column<int>(type: "int", nullable: false),
                    ShareId = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    SharedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    DetectedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SessionAssetsLookup", x => x.AssetId);
                    table.ForeignKey(
                        name: "FK_SessionAssetsLookup_Sessions_SessionId",
                        column: x => x.SessionId,
                        principalSchema: "canvas",
                        principalTable: "Sessions",
                        principalColumn: "SessionId",
                        onDelete: ReferentialAction.Cascade);
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

            migrationBuilder.CreateIndex(
                name: "IX_SessionAssets_Class_Session",
                schema: "canvas",
                table: "SessionAssetsLookup",
                columns: new[] { "SessionId", "AssetClass" });

            migrationBuilder.CreateIndex(
                name: "IX_SessionAssets_Position",
                schema: "canvas",
                table: "SessionAssetsLookup",
                columns: new[] { "SessionId", "Position" },
                filter: "[Position] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_SessionAssets_SessionId",
                schema: "canvas",
                table: "SessionAssetsLookup",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_SessionAssets_Shared",
                schema: "canvas",
                table: "SessionAssetsLookup",
                columns: new[] { "IsActive", "SharedAt" },
                filter: "[SharedAt] IS NOT NULL");

            // Insert the 8 predefined asset types from user's asset inventory
            var migrationDate = new DateTime(2025, 9, 20, 22, 25, 44, DateTimeKind.Utc);
            migrationBuilder.InsertData(
                schema: "canvas",
                table: "AssetLookup",
                columns: new[] { "AssetIdentifier", "AssetType", "CssSelector", "DisplayName", "IsActive", "CreatedAt" },
                values: new object[,]
                {
                    { "ayah-card", "ayah-card", ".ayah-card", "Ayah Card", true, migrationDate },
                    { "inserted-hadees", "inserted-hadees", ".inserted-hadees", "Inserted Hadees", true, migrationDate },
                    { "etymology-card", "etymology-card", ".etymology-card", "Etymology Card", true, migrationDate },
                    { "etymology-derivative-card", "etymology-derivative-card", ".etymology-derivative-card", "Etymology Derivative Card", true, migrationDate },
                    { "esotericBlock", "esotericBlock", ".esotericBlock", "Esoteric Block", true, migrationDate },
                    { "verse-container", "verse-container", ".verse-container", "Verse Container", true, migrationDate },
                    { "table", "table", "table[style=\"width: 100%;\"]", "Table", true, migrationDate },
                    { "imgResponsive", "imgResponsive", ".imgResponsive", "Responsive Image", true, migrationDate }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Delete the seeded asset data first
            migrationBuilder.DeleteData(
                schema: "canvas",
                table: "AssetLookup",
                keyColumn: "AssetIdentifier",
                keyValues: new object[] { "ayah-card", "inserted-hadees", "etymology-card", "etymology-derivative-card", "esotericBlock", "verse-container", "table", "imgResponsive" });

            migrationBuilder.DropTable(
                name: "AssetLookup",
                schema: "canvas");

            migrationBuilder.DropTable(
                name: "SessionAssetsLookup",
                schema: "canvas");

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
        }
    }
}
